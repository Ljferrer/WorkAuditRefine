import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { ptSpans, ptSpanRanges, extractInterpolations, extractArgsFields, unguardedTopLevelKeys, checkArgs, EXEMPT_FIELDS, boundaryWarnings } from './assert-args-complete.mjs'
// The provenance mirror and the command-shape exports ride a namespace import, so each new test reds
// on its own when an export is absent instead of failing the whole file at import.
import * as aac from './assert-args-complete.mjs'
import { stripFullLineComments } from './stage-workflow.mjs'

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

test('ptSpanRanges: offsets start at the pt` tag and end just past the closing backtick; ptSpans is its text view', () => {
  const src = 'const a = pt`hi ${x}`; const b = 1; const c = pt`bye`'
  const ranges = ptSpanRanges(src)
  assert.deepEqual(ranges, [{ start: 10, end: 21, text: 'hi ${x}', exprs: [[16, 20]] }, { start: 46, end: 53, text: 'bye', exprs: [] }])
  assert.equal(src.slice(ranges[0].start, ranges[0].end), 'pt`hi ${x}`', 'the range covers the tag through the closing backtick')
  assert.equal(src.slice(16, 20), '${x}', 'an expr range covers `${` through its closing brace')
  const nested = 'pt`a ${cond ? pt`b ${y}` : \'\'} c`'
  assert.deepEqual(ptSpanRanges(nested)[0].exprs, [[5, 30]], 'a nested template inside the expression stays inside that one top-level expr range')
  assert.equal(ptSpanRanges(nested).length, 1, 'by default the inner pt span is not a separate entry')
  assert.deepEqual(ptSpanRanges(nested, { nested: true }).map((r) => [r.start, r.end, r.text, r.exprs]),
    [[0, 33, 'a ${cond ? pt`b ${y}` : \'\'} c', [[5, 30]]], [14, 24, 'b ${y}', [[19, 23]]]],
    'nested: true also emits the inner span after its outer, offsets in the caller\'s source')
  const combined = 'pt`a ${ {k: 1}[0] ? pt`b` : pt`c ${z}`} d`'
  assert.deepEqual(ptSpanRanges(combined, { nested: true }).map((r) => [r.start, r.end, r.text, r.exprs]),
    [[0, 42, 'a ${ {k: 1}[0] ? pt`b` : pt`c ${z}`} d', [[5, 39]]], [20, 25, 'b', []], [28, 38, 'c ${z}', [[33, 37]]]],
    'a plain-brace object before two inner pt spans in one expression: both inners emitted with shifted offsets and their own exprs')
  const braces = 'pt`x ${JSON.stringify({ a: 1 })} y`'
  assert.deepEqual(ptSpanRanges(braces)[0].exprs, [[5, 32]], 'a plain-brace object inside the expression does not split or end the expr range')
  assert.equal(braces.slice(5, 32), '${JSON.stringify({ a: 1 })}')
  assert.deepEqual(ptSpans(src), ranges.map((r) => r.text))
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

// ---------------------------------------------------------------------------
// Boundary-seat warning (#2545 part 3): warn, never refuse
// ---------------------------------------------------------------------------
const SONNET = { auditor: { model: 'sonnet', effort: 'high', high: { model: 'opus', effort: 'default' } } }
const btask = (over) => ({ id: 't1', title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }], files: ['src/app.js'], ...over })
const warnsFor = (task, agents = SONNET) => boundaryWarnings({ agents, tasks: [task] })

test('boundaryWarnings: each boundary signal with no opus seat warns once and names the task and the signal', () => {
  for (const [task, signal] of [
    [btask({ roster: [{ lens: 'security' }] }), /security seat/],
    [btask({ files: ['db/migrations/0042_keys.sql'] }), /db\/migrations\/0042_keys\.sql/],
    [btask({ files: ['server/auth/session.ts'] }), /server\/auth\/session\.ts/],
    [btask({ files: ['lib/oauth-client.js'] }), /oauth-client/],
    [btask({ files: ['src/authenticate.js'] }), /authenticate\.js/],
    [btask({ files: ['api/authorize.ts'] }), /authorize\.ts/],
    [btask({ files: ['lib/oauth2/client.js'] }), /oauth2/],
    [btask({ files: ['src/authMiddleware.ts'] }), /authMiddleware\.ts/],
    [btask({ files: ['src/userAuth.ts'] }), /userAuth\.ts/],
    [btask({ files: ['components/withAuth.tsx'] }), /withAuth\.tsx/],
    [btask({ files: ['api/unauthorized.ts'] }), /unauthorized\.ts/],
    [btask({ files: ['hooks/validate-auditor-git.sh'] }), /validate-auditor-git\.sh/],
    [btask({ files: ['.gitmodules'] }), /\.gitmodules/],
    [btask({ files: ['.gitignore'] }), /\.gitignore/],
    [btask({ files: ['.gitattributes'] }), /\.gitattributes/],
    [btask({ files: ['src/GitService.ts'] }), /GitService\.ts/],
    [btask({ files: ['lib/gitClient.js'] }), /gitClient\.js/],
    [btask({ files: ['src/MyOAuth.ts'] }), /MyOAuth\.ts/],
  ]) {
    const w = warnsFor(task)
    assert.equal(w.length, 1, `one warning for ${JSON.stringify(task.files)} / ${JSON.stringify(task.roster)}`)
    assert.match(w[0], /task t1/)
    assert.match(w[0], signal)
  }
})

test('boundaryWarnings: silent when a seat resolves to opus or above, or when the task has no signal', () => {
  const sec = { roster: [{ lens: 'security', tier: 'high' }] }
  assert.deepEqual(warnsFor(btask(sec)), [], 'a high-tier seat resolves to opus')
  assert.deepEqual(warnsFor(btask({ roster: [{ lens: 'security' }, { lens: 'correctness', model: 'fable' }] })), [], 'a fable seat ranks above opus')
  assert.deepEqual(warnsFor(btask({ roster: [{ lens: 'security' }] }), { auditor: { model: 'opus', effort: 'default' } }), [], 'an opus base tier covers a seat with no tier')
  assert.deepEqual(warnsFor(btask({ roster: [{ lens: 'security' }] }), { auditor: { model: 'sonnet', effort: 'high', low: { model: 'opus', effort: 'default' } } }), [], 'an opus low tier covers a seat with no tier')
  assert.deepEqual(warnsFor(btask({ files: ['docs/authoring-guide.md', 'AUTHORS.md', 'docs/author.md', 'docs/coAuthors.md', 'src/GitHubBadge.tsx', 'src/gitHubApi.ts', 'src/legitScore.js', 'src/DigitalClock.ts', 'src/digit.js', 'README.md'] })), [], 'author, authoring and digit are not boundary words')
  assert.deepEqual(warnsFor(btask()), [], 'no signal, no warning')
  assert.equal(warnsFor(btask({ roster: [{ lens: 'security', tier: 'high' }] }), { auditor: { model: 'sonnet', effort: 'high', high: { model: 'sonnet', effort: 'high' } } }).length, 1,
    'a high tier below opus does not cover the floor')
  assert.deepEqual(boundaryWarnings({ tasks: [] }), [], 'a zero-task launch is silent')
  assert.deepEqual(warnsFor(btask({ roster: [{ lens: 'security', tier: 'high' }] }), { auditor: { model: 'sonnet', effort: 'high' } }), [],
    'an absent high block resolves to the DEFAULTS high model (opus), as spawnSeat resolves it')
  assert.equal(warnsFor(btask({ roster: [{ lens: 'security', tier: 'high' }] }), { auditor: { model: 'sonnet', effort: 'high', high: { model: 'haiku', effort: 'high' } } }).length, 1,
    'the clamp lifts a high tier only to the base model, so a sonnet base still warns')
  assert.deepEqual(warnsFor(btask({ roster: [{ lens: 'security', tier: 'high' }] }), { auditor: { model: 'fable', effort: 'default', high: { model: 'sonnet', effort: 'high' } } }), [],
    'a high tier below a fable base resolves to fable (the #2534 clamp), as spawnSeat resolves it')
})

test('CLI: a boundary warning goes to stderr and keeps exit 0 (warn, never refuse)', () => {
  const args = { ...COMPLETE(), agents: SONNET, tasks: [btask({ roster: [{ lens: 'security' }] })] }
  const r = runCli([], JSON.stringify(args))
  assert.equal(r.status, 0, 'the warning never changes the exit code')
  assert.match(r.stderr, /warning: task t1 .*security seat/, 'stderr carries the warning')
  assert.match(r.stdout, /dispatch-complete/, 'the launch still certifies')
  const quiet = runCli([], JSON.stringify({ ...args, tasks: [btask({ roster: [{ lens: 'security', tier: 'high' }] })] }))
  assert.equal(quiet.status, 0)
  assert.doesNotMatch(quiet.stderr, /warning/, 'an opus seat leaves stderr clean')
})

// ---------------------------------------------------------------------------
// Tokenizer: comments and strings outside spans open no span (#1775); bracket chains (#1760)
// ---------------------------------------------------------------------------

test('ptSpanRanges: a pt backtick inside a string or comment opens no span', () => {
  const src = [
    "const s1 = 'a pt`${x.y}` in a string'",
    'const s2 = "pt`${x.z}` in a double-quoted string"',
    '// pt`${c.d}` in a line comment',
    '/* pt`${e.f}` in a block comment */',
    // A regex literal holding a quote and a backtick: a skipper that reads the quote as a string
    // opener swallows the real span after it, and one that reads the backtick opens a phantom template.
    "const re = /['`]pt/g; const real = pt`${ok.chain}`",
    'const s3 = `plain pt`',
    'const tail = pt`${ok.tail}`',
  ].join('\n')
  const spans = ptSpanRanges(src)
  assert.deepEqual(spans.map((s) => s.text), ['${ok.chain}', '${ok.tail}'], `only the two real spans open — got ${JSON.stringify(spans.map((s) => s.text))}`)
  assert.deepEqual([...extractInterpolations(src).keys()], ['ok.chain', 'ok.tail'])
  assert.equal(src.slice(spans[0].start, spans[0].end), 'pt`${ok.chain}`', 'the real span keeps its exact offsets')
})

test('extractInterpolations: bracket-indexed chain is censused', () => {
  const src = 'const { tasks } = A\nconst a = pt`first task ${tasks[0].id} and ${tasks[12].title}`'
  const chains = extractInterpolations(src)
  assert.ok(chains.has('tasks[0].id') && chains.has('tasks[12].title'), `bracket chains are censused — got ${JSON.stringify([...chains.keys()])}`)
  const fields = extractArgsFields(src)
  assert.ok(fields.includes('tasks[].id') && fields.includes('tasks[].title'), `tasks[N].x maps to tasks[].x — got ${JSON.stringify(fields)}`)
  assert.ok(!fields.some((f) => /\[\d+\]/.test(f)), 'no index survives into a field name')
  assert.ok(!chains.has('tasks[x].id') && !extractInterpolations('pt`${tasks[i].id}`').size, 'a non-digit index is not a pure chain')
})

test('CLI --template: EMBEDDED_ARGS prose leaves the field set unchanged', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-embedded-'))
  try {
    const args = { ...COMPLETE(), adjudications: ['x: keep the row form, never pt`${plan.zzz}` prose'] }
    const argsFile = join(dir, 'args.json')
    writeFileSync(argsFile, JSON.stringify(args))
    const st = spawnSync(process.execPath, [join(here, 'stage-workflow.mjs'), join(here, 'workflow-template.js'), join(dir, 'staged'), 'x', '3', '--args', argsFile], { encoding: 'utf8' })
    assert.equal(st.status, 0, `the stager writes the staged copy — stderr: ${st.stderr}`)
    const stagedPath = st.stdout.trim()
    const staged = readFileSync(stagedPath, 'utf8')
    assert.ok(staged.includes('const EMBEDDED_ARGS = ') && staged.includes('pt`${plan.zzz}`'), 'the fixture embeds the pt-backtick prose in the EMBEDDED_ARGS line')
    const fields = extractArgsFields(staged)
    assert.deepEqual(fields, extractArgsFields(templateSrc), `the staged field set equals the shipped one — got ${JSON.stringify(fields)}`)
    assert.ok(!fields.includes('plan.zzz'), 'the phantom plan.zzz from the args prose is not a field')
    const r = runCli(['--template', stagedPath], JSON.stringify(args))
    assert.equal(r.status, 0, `the staged copy certifies the same args — stderr: ${r.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// ---------------------------------------------------------------------------
// Provenance mirror (#1896): the preflight runs the template's own floor code
// ---------------------------------------------------------------------------

const SLUG = '2026-11-08-args-floor'
const PLAN_FILE = `docs/plans/${SLUG}.md`
const PROV = (over = {}) => ({ ...COMPLETE(), planSlug: SLUG, plan: { file: PLAN_FILE, gate: 'make gate' }, ...over })
const STAMP_LINE = /at its ledger source/

test('provenance mirror: token-less adjudication string row exits 1 naming args.adjudications', () => {
  const r = runCli([], JSON.stringify(PROV({ adjudications: ['use the faster approach everywhere'] })))
  assert.equal(r.status, 1, `exit 1 on a token-less row — stderr: ${r.stderr}`)
  assert.match(r.stderr, /args\.adjudications/, 'stderr names the refused surface')
  assert.match(r.stderr, /\[args, floor\]/, 'stderr carries the token list verbatim from the template')
  assert.match(r.stderr, /refused at entry \(#1413\)/, 'the template refusal is printed verbatim')
  const stampLines = r.stderr.split('\n').filter((l) => STAMP_LINE.test(l))
  assert.equal(stampLines.length, 1, `exactly one stderr line tells the Lead to stamp the row at its ledger source — got ${JSON.stringify(stampLines)}`)
  assert.match(stampLines[0], /not the launch copy/, 'the one line names the launch copy as the wrong place')
})

test('provenance mirror: planFile-stamped row exits 0', () => {
  const r = runCli([], JSON.stringify(PROV({ adjudications: [{ why: 'use the faster approach everywhere', planFile: PLAN_FILE }] })))
  assert.equal(r.status, 0, `exit 0 on the stamped row — stderr: ${r.stderr}`)
  assert.match(r.stdout, /dispatch-complete/)
  assert.doesNotMatch(r.stderr, STAMP_LINE, 'no stamp line on a pass')
})

test('provenance mirror: missing floor markers exit 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-nomarker-'))
  try {
    const tpl = join(dir, 'tpl.js')
    // A template with prompt interpolations (so the zero-field guard passes) but no floor markers.
    writeFileSync(tpl, templateSrc.split('\n').filter((l) => l.trim() !== 'const provenanceProblems = []').join('\n'))
    const r = runCli(['--template', tpl], JSON.stringify(PROV()))
    assert.equal(r.status, 2, `exit 2 when the markers are absent — stdout: ${r.stdout}; stderr: ${r.stderr}`)
    assert.match(r.stderr, /const provenanceProblems = \[\]/, 'stderr names the missing marker')
    assert.throws(() => aac.provenanceProblems('const a = 1\n', PROV()), aac.PreflightToolingError, 'the export throws the tooling error class, never a refusal list')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('provenance mirror: runs on the stripped staged form', () => {
  const stripped = stripFullLineComments(templateSrc)
  assert.notEqual(stripped, templateSrc, 'the fixture really is the stripped form')
  for (const args of [
    PROV({ adjudications: ['use the faster approach everywhere'] }),
    PROV({ adjudications: [{ why: 'use the faster approach everywhere', planFile: PLAN_FILE }] }),
    PROV({ backstops: ['an args floor backstop'], intent: 'nothing that names the run' }),
    PROV(),
  ]) {
    assert.deepEqual(aac.provenanceProblems(stripped, args), aac.provenanceProblems(templateSrc, args), `same refusals and logs on both forms for ${JSON.stringify(args.adjudications ?? args.backstops ?? null)}`)
  }
  const dir = mkdtempSync(join(tmpdir(), 'aac-stripped-'))
  try {
    const tpl = join(dir, 'staged.js')
    writeFileSync(tpl, stripped)
    const bad = runCli(['--template', tpl], JSON.stringify(PROV({ adjudications: ['use the faster approach everywhere'] })))
    assert.equal(bad.status, 1, `the staged form refuses the token-less row — stderr: ${bad.stderr}`)
    assert.match(bad.stderr, /args\.adjudications/)
    const ok = runCli(['--template', tpl], JSON.stringify(PROV({ adjudications: [{ why: 'x', planFile: PLAN_FILE }] })))
    assert.equal(ok.status, 0, `the staged form passes the stamped row — stderr: ${ok.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('provenance mirror: copied bindings are byte-equal to the template', () => {
  const B = aac.FLOOR_BINDINGS
  assert.ok(Array.isArray(B), 'FLOOR_BINDINGS is exported')
  const constructs = [
    ['the destructure', /^const \{ phase: ph, plan, .*\} = A$/],
    ['intent', /^const intent = /],
    ['backstops', /^const backstops = /],
    ['the adjudications head', /^const adjudications = Array\.isArray\(A\.adjudications\)$/],
    ['the adjudications continuation', /^\? A\.adjudications\.filter\(.*\) : \[\]$/],
    ['planSlug', /^const planSlug = A\.planSlug$/],
  ]
  for (const [name, re] of constructs) assert.equal(B.filter((b) => re.test(b)).length, 1, `FLOOR_BINDINGS holds exactly one ${name} line`)
  const lines = templateSrc.split('\n').map((l) => l.replace(/^[ \t]+/, ''))
  for (const b of B) {
    assert.equal(b, b.replace(/^[ \t]+/, ''), 'an entry carries no leading whitespace')
    assert.equal(lines.filter((l) => l === b).length, 1, `the template holds exactly one line equal to ${JSON.stringify(b)}, leading whitespace stripped`)
  }
})

test('provenance mirror: the shipped slice is self-contained', () => {
  const rows = () => [
    'a prose string row with no own word',
    { why: 'an object row with no own word', check: 'true' },
    { why: 'an auto row', source: 'auto' },
    { why: 'a stamped row', planFile: PLAN_FILE },
  ]
  for (const args of [
    PROV({ intent: 'an intent that names the args floor', backstops: rows(), adjudications: rows() }),
    PROV({ intent: 'an intent with no own word', backstops: rows().slice(0, 2), adjudications: rows().slice(0, 1) }),
  ]) {
    let res
    assert.doesNotThrow(() => { res = aac.provenanceProblems(templateSrc, args) }, 'the slice reads no name it does not bind')
    assert.ok(Array.isArray(res.problems) && Array.isArray(res.logs), 'the result is a refusal list (maybe empty) and a log list')
  }
})

// ---------------------------------------------------------------------------
// Command shapes (#2674, #2675), the dispatch-shape line (#2677), the Done-when compare (#2717)
// ---------------------------------------------------------------------------

test('check-shape: an unparsable End state check command exits 1 naming the row', () => {
  const a = COMPLETE()
  a.phase.endState = [{ condition: 'c1', check: "grep -q 'unterminated f && echo PASS-E1" }, { condition: 'c2', check: "grep -q 'ok' f && echo PASS-E2" }, 'a bare string row']
  const r = runCli([], JSON.stringify(a))
  assert.equal(r.status, 1, `exit 1 on an unparsable check — stderr: ${r.stderr}`)
  assert.match(r.stderr, /phase\.endState\[1\]\.check does not parse as shell: /, 'stderr names the row by its 1-based index')
  assert.doesNotMatch(r.stderr, /phase\.endState\[[23]\]/, 'the well-formed sibling and the bare-string row are not named')
  a.phase.endState.shift()
  assert.equal(runCli([], JSON.stringify(a)).status, 0, 'a launch whose checks all parse exits 0')
})

test('check-shape: a prose doneWhen exits 1 naming the task and the null remedy', () => {
  const a = COMPLETE()
  a.tasks = [{ ...a.tasks[0], doneWhen: 'None — release slot files' }, { id: 't2', title: 'Task two', planSlice: 's', doneWhen: null }]
  const r = runCli([], JSON.stringify(a))
  assert.equal(r.status, 1, `exit 1 on a prose doneWhen — stderr: ${r.stderr}`)
  assert.match(r.stderr, /tasks\[t1\]\.doneWhen is the plan's no-command arm/, 'stderr names the task')
  assert.match(r.stderr, /stage doneWhen: null, never the prose/, 'stderr names the null remedy')
  assert.doesNotMatch(r.stderr, /tasks\[t2\]/, 'the null sibling passes')
})

test('CLI exit 0: the dispatch-complete line names the two dispatch shapes', () => {
  const r = runCli([], JSON.stringify(COMPLETE()))
  assert.equal(r.status, 0, `exit 0 — stderr: ${r.stderr}`)
  const line = r.stdout.split('\n').find((l) => /dispatch-complete/.test(l))
  assert.ok(line, 'one stdout line certifies the launch')
  assert.match(line, /parsed object as the Workflow args/, 'the first shape')
  assert.match(line, /no args over an --args staged script/, 'the second shape')
  assert.match(line, /never a file path string/, 'the file path string is forbidden')
  assert.match(line, /file path/)
})

test('check-shape: a doneWhen one space off its plan Done when bullet exits 1 naming the task', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-donewhen-'))
  try {
    const wrapped = 'node --test a.test.mjs && echo PASS-1'
    const spaced = "grep -c -E '^  (a|b)' f"
    writeFileSync(join(dir, 'plan.md'), [
      '### Task t1 — first',
      '- Files: `a.mjs`',
      '- Done when: `node --test a.test.mjs &&',
      '  echo PASS-1` (the `PASS-1` token proves it)',
      '- deps: []',
      '',
      '### Task t2 — second',
      "- Done when: `grep -c -E '^  (a|b)' f`",
      '',
    ].join('\n'))
    assert.deepEqual(aac.planDoneWhenBullets(readFileSync(join(dir, 'plan.md'), 'utf8')), [wrapped, spaced], 'the intake rule joins soft wraps and keeps the code span body only')
    const a = COMPLETE()
    a.plan.file = 'plan.md'
    a.mainCheckout = dir
    a.tasks = [{ ...a.tasks[0], doneWhen: wrapped }, { id: 't2', title: 'Task two', planSlice: 's', doneWhen: "grep -c -E '^ (a|b)' f" }]
    const r = runCli([], JSON.stringify(a))
    assert.equal(r.status, 1, `exit 1 on the one-space form — stderr: ${r.stderr}`)
    assert.match(r.stderr, /tasks\[t2\]\.doneWhen equals no Done when bullet of plan\.md byte for byte — differs at byte 14 /, 'stderr names the task and the first differing byte')
    assert.match(r.stderr, /re-extract the command with its whitespace kept, never hand-edit the staged string/, 'stderr names the remedy')
    assert.doesNotMatch(r.stderr, /tasks\[t1\]/, 'the verbatim sibling is not named')
    a.tasks[1].doneWhen = spaced
    const ok = runCli([], JSON.stringify(a))
    assert.equal(ok.status, 0, `exit 0 once both strings equal their bullets — stderr: ${ok.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('check-shape: a staged doneWhen with an unreadable plan file exits 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'aac-noplan-'))
  try {
    const a = COMPLETE()
    a.plan.file = 'docs/plans/missing.md'
    a.mainCheckout = dir
    a.tasks[0].doneWhen = 'true'
    const r = runCli([], JSON.stringify(a))
    assert.equal(r.status, 2, `exit 2 on an unreadable plan — stderr: ${r.stderr}`)
    assert.ok(r.stderr.includes(join(dir, 'docs/plans/missing.md')), `stderr names the resolved path — got ${r.stderr}`)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
