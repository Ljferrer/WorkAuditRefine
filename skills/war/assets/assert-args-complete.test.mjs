import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { ptSpans, extractInterpolations, extractArgsFields, unguardedTopLevelKeys, checkArgs, EXEMPT_FIELDS } from './assert-args-complete.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const CLI = join(here, 'assert-args-complete.mjs')
const templateSrc = readFileSync(join(here, 'workflow-template.js'), 'utf8')

// ---------------------------------------------------------------------------
// Extraction mechanics (A2)
// ---------------------------------------------------------------------------

test('ptSpans: collects only pt-tagged template literals, never plain ones or comments', () => {
  const src = [
    'const a = pt`hello ${x.y}`',
    'const b = `plain ${z.w}`', // plain template literal — not a prompt span
    '// a comment mentioning ${c.d} in prose',
    'const c = pt`second ${q.r} span`',
  ].join('\n')
  const spans = ptSpans(src)
  assert.equal(spans.length, 2, `exactly the two pt spans are collected, got ${spans.length}`)
  assert.ok(spans[0].includes('${x.y}'), 'first pt span carries its interpolation')
  assert.ok(spans[1].includes('${q.r}'), 'second pt span carries its interpolation')
  const chains = extractInterpolations(src)
  assert.ok(chains.has('x.y') && chains.has('q.r'), 'pt-span chains extracted')
  assert.ok(!chains.has('z.w'), 'plain-template chain is NOT extracted')
  assert.ok(!chains.has('c.d'), 'comment-prose chain is NOT extracted')
})

test('ptSpans: a nested pt literal inside a ternary expression stays inside the outer span', () => {
  const src = 'const a = pt`outer ${cond ? pt`inner ${a.b} text` : \'\'} tail ${c.d}`'
  const spans = ptSpans(src)
  // The outer walk collects one span whose text INCLUDES the nested literal; the flat ${…} re-scan
  // over that text sees both interpolations (the inner span is never matched separately).
  const chains = extractInterpolations(src)
  assert.ok(chains.has('a.b'), 'nested-span interpolation extracted')
  assert.ok(chains.has('c.d'), 'outer-span tail interpolation extracted — the span did not terminate early')
  assert.ok(spans[0].includes('tail'), 'outer span text runs past the nested literal')
})

test('ptSpans: plain braces inside an interpolation expression do not end the expression early', () => {
  const src = 'const a = pt`x ${JSON.stringify({ a: 1 })} then ${b.c}`'
  const chains = extractInterpolations(src)
  assert.ok(chains.has('b.c'), 'chain after a braced expression is still extracted')
  assert.ok(!chains.has('a'), 'the braced call expression itself is not a pure chain')
})

test('extractInterpolations: fallback-bearing and guarded expressions are excluded (fallback-free only)', () => {
  const src = 'const a = pt`${x.y ?? "<unset>"} ${p || "<p>"} ${flag ? q.r : ""} ${s?.t} ${fn(u)} ${plain.chain}`'
  const chains = extractInterpolations(src)
  assert.deepEqual([...chains.keys()], ['plain.chain'],
    `only the pure member chain qualifies — got ${JSON.stringify([...chains.keys()])}`)
})

test('unguardedTopLevelKeys: finds unguarded const X = A.X reads and no-default destructure bindings, mapping local → args key', () => {
  const src = [
    'const { phase: ph, plan, tasks, learningsTarget, agents = {}, audit = {}, run = {} } = A',
    'const planSlug = A.planSlug',
    'const runId = A.runId',
    "const ghUser = (typeof A.ghUser === 'string') ? A.ghUser : ''", // guarded — excluded
  ].join('\n')
  const keys = unguardedTopLevelKeys(src)
  for (const k of ['planSlug', 'runId', 'plan', 'tasks', 'learningsTarget', 'ph']) {
    assert.ok(keys.has(k), `unguarded binding ${k} is found (detection keys on the LOCAL name)`)
  }
  assert.equal(keys.get('ph'), 'phase', 'an aliased destructure binding maps to the ARGS key it reads')
  assert.equal(keys.get('planSlug'), 'planSlug', 'an unaliased binding maps to itself')
  assert.ok(!keys.has('ghUser'), 'a guarded (intake-defaulted) binding is NOT an unguarded key')
  assert.ok(!keys.has('agents'), 'a destructure binding with a default is NOT an unguarded key')
})

test('extractArgsFields: a bare aliased binding emits the ARGS key, never the local alias', () => {
  const src = [
    'const { phase: ph } = A',
    'const a = pt`phase object dump: ${ph}`',
  ].join('\n')
  const fields = extractArgsFields(src)
  assert.ok(fields.includes('phase'), `emits the args key phase — got ${JSON.stringify(fields)}`)
  assert.ok(!fields.includes('ph'), 'the local alias ph is never emitted as a field')
})

test('extractInterpolations: an escaped \\${…} in prompt prose is NOT extracted (it is prose, not an interpolation)', () => {
  const src = 'const a = pt`resolve \\${MAIN} yourself, then ${real.chain}`'
  const chains = extractInterpolations(src)
  assert.ok(!chains.has('MAIN'), `escaped prose placeholder is not extracted — got ${JSON.stringify([...chains.keys()])}`)
  assert.ok(chains.has('real.chain'), 'the genuine interpolation after the escaped pair is still extracted')
})

test('extractArgsFields: maps roots to args surfaces (ph→phase, r.task→tasks[]) and drops locals', () => {
  const src = [
    'const planSlug = A.planSlug',
    'const a = pt`${ph.integrationBranch} ${plan.file} ${task.id} ${t.worktree} ${r.task.branch} ${localVar} ${planSlug}`',
  ].join('\n')
  assert.deepEqual(extractArgsFields(src),
    ['phase.integrationBranch', 'plan.file', 'planSlug', 'tasks[].branch', 'tasks[].id', 'tasks[].worktree'],
    'roots map: ph→phase.*, plan→plan.*, task/t/r.task→tasks[].*, unguarded top-level bare id kept, locals dropped')
})

// ---------------------------------------------------------------------------
// The real template: the extracted field set is the floor's live requirement surface
// ---------------------------------------------------------------------------

test('real template: extraction finds the phase-field quartet and the per-task interpolation fields', () => {
  const fields = extractArgsFields(templateSrc)
  for (const f of ['phase.id', 'phase.integrationBranch', 'phase.title', 'phase.workingBranch', 'tasks[].id', 'tasks[].title', 'tasks[].branch', 'tasks[].worktree']) {
    assert.ok(fields.includes(f), `extracted set includes ${f} — got ${JSON.stringify(fields)}`)
  }
})

test('real template: every EXEMPT_FIELDS entry is consulted (extracted, or a special-cased derivable)', () => {
  const fields = new Set(extractArgsFields(templateSrc))
  for (const field of EXEMPT_FIELDS.keys()) {
    assert.ok(fields.has(field), `exemption ${field} names a field the extraction actually yields — a stale exemption row is dead documentation`)
  }
})

// ---------------------------------------------------------------------------
// checkArgs semantics
// ---------------------------------------------------------------------------

const COMPLETE = () => ({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/x/phase-3', workingBranch: 'dev/x' },
  plan: { file: 'docs/plans/x.md', gate: 'make gate' },
  planSlug: 'x', runId: 'run-1', worktreeRoot: '/abs/wt',
  tasks: [{ id: 't1', title: 'Task one', planSlice: 'slice' }],
})

test('checkArgs: a complete launch has zero missing fields', () => {
  const missing = checkArgs(extractArgsFields(templateSrc), COMPLETE())
  assert.deepEqual(missing, [], `complete args report nothing missing — got ${JSON.stringify(missing)}`)
})

test('checkArgs: a missing phase field is named (unconditional phase-field class)', () => {
  const a = COMPLETE(); delete a.phase.integrationBranch
  const missing = checkArgs(extractArgsFields(templateSrc), a)
  assert.ok(missing.some(m => m.includes('phase.integrationBranch')), `names phase.integrationBranch — got ${JSON.stringify(missing)}`)
})

test('checkArgs: missing derivation inputs surface on tasks[].branch/worktree naming both remedies', () => {
  const a = COMPLETE(); delete a.runId
  const missing = checkArgs(extractArgsFields(templateSrc), a)
  const row = missing.find(m => m.includes('tasks[t1].worktree'))
  assert.ok(row, `tasks[t1].worktree flagged when runId is absent — got ${JSON.stringify(missing)}`)
  // Both remedies, asserted separately — an alternation would pass with either half missing.
  assert.match(row, /supply it explicitly/, 'the message names the explicit-path remedy')
  assert.match(row, /worktreeRoot \+ runId \+ phase\.id/, 'the message names the full derivation-input remedy')
})

test('checkArgs: a bare top-level derivation input is required only while some task still needs derivation', () => {
  // The shipped template never interpolates the trio bare into a pt span, so this gate is
  // exercised against a SYNTHETIC template that does (the defensive branch stays covered).
  const src = [
    'const runId = A.runId',
    'const a = pt`run ${runId} / task ${task.id} at ${task.worktree} on ${task.branch}`',
  ].join('\n')
  const fields = extractArgsFields(src)
  assert.ok(fields.includes('runId'), `synthetic template requires bare runId — got ${JSON.stringify(fields)}`)
  const base = () => ({ phase: { id: 3 }, tasks: [{ id: 't1', branch: 'war/x/t1', worktree: '/abs/t1' }] })
  assert.deepEqual(checkArgs(fields, base()), [],
    'all tasks explicit ⇒ the absent derivation input is not demanded')
  const a = base(); delete a.tasks[0].worktree
  const missing = checkArgs(fields, a)
  assert.ok(missing.some(m => m === 'runId is missing'), `a task needing derivation demands the input — got ${JSON.stringify(missing)}`)
})

test('checkArgs: explicit per-task branch+worktree satisfy without the derivation trio', () => {
  const a = COMPLETE()
  delete a.planSlug; delete a.runId; delete a.worktreeRoot
  a.tasks[0].branch = 'war/x/p3-t1'; a.tasks[0].worktree = '/abs/wt/run-1/p3-t1'
  assert.deepEqual(checkArgs(extractArgsFields(templateSrc), a), [],
    'the hand-patched-DAG escape hatch stays legal')
})

test('checkArgs: a zero-task launch needs no plan and no task fields (ratified shapes stay legal)', () => {
  const a = COMPLETE(); a.tasks = []; delete a.plan
  assert.deepEqual(checkArgs(extractArgsFields(templateSrc), a), [],
    'zero-task launch passes with phase fields alone')
})

test('checkArgs: a missing tasks[].title is named per task', () => {
  const a = COMPLETE(); delete a.tasks[0].title
  const missing = checkArgs(extractArgsFields(templateSrc), a)
  assert.ok(missing.some(m => m.includes('tasks[t1].title')), `names tasks[t1].title — got ${JSON.stringify(missing)}`)
})

test('checkArgs: exempt fields (plan.gate, tasks[].doneWhen, phase.epicIssue) are never required', () => {
  const a = COMPLETE()
  delete a.plan.gate // composed at the gate composition point
  const missing = checkArgs(extractArgsFields(templateSrc), a)
  assert.ok(!missing.some(m => m.includes('plan.gate') || m.includes('doneWhen') || m.includes('epicIssue')),
    `no exempt field is demanded — got ${JSON.stringify(missing)}`)
})

// ---------------------------------------------------------------------------
// CLI contract: exit 0 complete / 1 naming the missing field / 2 on read error
// ---------------------------------------------------------------------------

const runCli = (argv, input) => spawnSync(process.execPath, [CLI, ...argv], { input, encoding: 'utf8' })

test('CLI: complete args on stdin exit 0, claiming only the interpolation surface', () => {
  const r = runCli([], JSON.stringify(COMPLETE()))
  assert.equal(r.status, 0, `exit 0 on complete args — stderr: ${r.stderr}`)
  assert.match(r.stdout, /dispatch-complete/, 'stdout confirms completeness')
  assert.match(r.stdout, /entry validation still applies/,
    'the success line scopes the claim — the preflight never vouches for the fallback-guarded entry fields')
})

test('CLI: a symlinked invocation still RUNS the floor (repo-canonical realpath main guard)', () => {
  // The retired file:// string-build main guard made a symlinked invocation exit 0 having checked
  // NOTHING — the worst failure mode for a floor. Spawn through a symlink and prove the floor ran.
  const dir = mkdtempSync(join(tmpdir(), 'aac-link-'))
  try {
    const link = join(dir, 'aac-link.mjs')
    symlinkSync(CLI, link)
    const ok = spawnSync(process.execPath, [link], { input: JSON.stringify(COMPLETE()), encoding: 'utf8' })
    assert.equal(ok.status, 0, `symlinked run with complete args exits 0 — stderr: ${ok.stderr}`)
    assert.match(ok.stdout, /dispatch-complete/, 'the floor actually ran and certified (not a silent no-op exit 0)')
    const a = COMPLETE(); delete a.phase.workingBranch
    const bad = spawnSync(process.execPath, [link], { input: JSON.stringify(a), encoding: 'utf8' })
    assert.equal(bad.status, 1, `symlinked run with incomplete args exits 1 — stderr: ${bad.stderr}`)
    assert.match(bad.stderr, /phase\.workingBranch/, 'the symlinked floor names the missing field')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('CLI: a readable template yielding ZERO interpolations is refused as a tooling error (exit 2), never certified', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-empty-'))
  try {
    const empty = join(dir, 'not-the-template.js')
    writeFileSync(empty, '// readable, but not a workflow template\n')
    const r = runCli(['--template', empty], JSON.stringify(COMPLETE()))
    assert.equal(r.status, 2, `exit 2 on a zero-field template — stdout: ${r.stdout}; stderr: ${r.stderr}`)
    assert.match(r.stderr, /ZERO fallback-free interpolations/, 'stderr names the vacuous extraction')
    assert.match(r.stderr, /refusing to certify/, 'the refusal is explicit — never a silent floor pass')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('CLI: a launch omitting a fallback-free field exits 1 naming the field, before any dispatch', () => {
  const a = COMPLETE(); delete a.phase.workingBranch
  const r = runCli([], JSON.stringify(a))
  assert.equal(r.status, 1, `exit 1 on a missing field — stderr: ${r.stderr}`)
  assert.match(r.stderr, /phase\.workingBranch/, 'stderr names the missing field')
})

test('CLI: args file positional works the same as stdin', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-'))
  try {
    const a = COMPLETE(); delete a.phase.title
    const f = join(dir, 'args.json')
    writeFileSync(f, JSON.stringify(a))
    const r = runCli([f])
    assert.equal(r.status, 1, 'exit 1 via file input')
    assert.match(r.stderr, /phase\.title/, 'stderr names the missing field')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('CLI: unparseable args JSON is a READ error (exit 2), never a floor status', () => {
  const r = runCli([], '{not json')
  assert.equal(r.status, 2, `exit 2 on unparseable args — stderr: ${r.stderr}`)
  assert.match(r.stderr, /not valid JSON/, 'stderr names the parse failure')
})

test('CLI: a non-object args value (array/scalar) is exit 2, never "missing field"', () => {
  const r = runCli([], '[1,2]')
  assert.equal(r.status, 2, 'exit 2 on array args')
  assert.match(r.stderr, /must be a JSON object/, 'stderr names the shape failure')
})

test('CLI: an unreadable template path is exit 2 with the path named', () => {
  const r = runCli(['--template', '/nonexistent/tpl.js'], JSON.stringify(COMPLETE()))
  assert.equal(r.status, 2, 'exit 2 on unreadable template')
  assert.match(r.stderr, /cannot read template \/nonexistent\/tpl\.js/, 'stderr names the template path')
})

test('CLI: an unreadable args file path is exit 2 with the path named', () => {
  const r = runCli(['/nonexistent/args.json'])
  assert.equal(r.status, 2, 'exit 2 on unreadable args file')
  assert.match(r.stderr, /cannot read args \/nonexistent\/args\.json/, 'stderr names the args path')
})

test('CLI: an unknown flag is refused loudly in stdin mode (default-deny, both input modes)', () => {
  const r = runCli(['--bogus'], JSON.stringify(COMPLETE()))
  assert.equal(r.status, 2, 'exit 2 on unknown flag')
  assert.match(r.stderr, /unknown flag --bogus/, 'stderr names the refused flag')
})

test('CLI: an unknown flag is refused in file mode too (never silently dropped)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-'))
  try {
    const f = join(dir, 'args.json')
    writeFileSync(f, JSON.stringify(COMPLETE()))
    const r = runCli([f, '--bogus'])
    assert.equal(r.status, 2, 'exit 2 on unknown flag beside a file positional')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('CLI: a surplus second positional is refused (exit 2), never silently ignored', () => {
  const r = runCli(['a.json', 'b.json'])
  assert.equal(r.status, 2, 'exit 2 on surplus positional')
  assert.match(r.stderr, /unexpected extra argument/, 'stderr names the surplus token')
})
