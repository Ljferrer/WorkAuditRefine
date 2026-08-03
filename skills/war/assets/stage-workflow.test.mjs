import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, symlinkSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { NAME_ANCHOR, DESCRIPTION_ANCHOR, ARGS_FALLBACK_ANCHOR, deriveName, deriveDescription } from './stage-workflow.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const STAGER = join(HERE, 'stage-workflow.mjs')
const TEMPLATE = join(HERE, 'workflow-template.js')

// Run the real stager CLI as a subprocess. We assert on the STAGED TEXT it writes and the exported
// pure functions. DESIGN INVARIANT, with ONE carve-out: we never import() a staged copy or the
// shipped template, because the template's top-level body IS a phase run. The carve-out is case (m),
// the embedded-args ENTRY-VALIDATION harness — it builds a staged copy into an AsyncFunction with
// every effect handle stubbed and reads the returned object, which exercises the top-level arg entry
// guard and nothing beyond it (no import(), no real dispatch). Any other execution of staged text
// stays out of this suite.
function runStager(args, { expectFail = false } = {}) {
  const r = spawnSync(process.execPath, [STAGER, ...args], { encoding: 'utf8' })
  if (!expectFail && r.status !== 0) {
    throw new Error(`stager exited ${r.status}; stderr: ${r.stderr}`)
  }
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status }
}

const scratch = (prefix) => mkdtempSync(join(tmpdir(), prefix))

// A minimal fixture carrying each anchor exactly once, built from the imported constants so it
// never drifts from the real anchors.
const MINIMAL_TEMPLATE = `export const meta = {
  ${NAME_ANCHOR},
  description: '${DESCRIPTION_ANCHOR}',
}
export const other = 1
`

// The exact two-line prelude the stager injects, and the strip used by the restore roundtrips. Built
// from the same JSON.stringify the stager runs, so the roundtrip proves byte-equality of the payload
// rather than re-deriving it.
const PRELUDE_STRIP = /\n\/\/ Embedded phase args \(stage-workflow\.mjs --args\)[^\n]*\nconst EMBEDDED_ARGS = [^\n]*\n/
const preludeLine = (payload) => `const EMBEDDED_ARGS = ${JSON.stringify(payload)}`
const writeArgs = (dir, payload) => {
  const p = join(dir, 'args.json')
  writeFileSync(p, JSON.stringify(payload))
  return p
}

// (a) derivations, with and without an ordinal (red: format drift in the title, the only place it lives).
test('(a) deriveName without ordinal', () => {
  assert.equal(deriveName('2026-07-16-land-failure-recovery', 1), 'war-2026-07-16-land-failure-recovery-p1')
})
test('(a) deriveName with ordinal', () => {
  assert.equal(deriveName('myslug', 2, 3), 'war-c3-myslug-p2')
})
test('(a) deriveDescription without ordinal', () => {
  assert.equal(deriveDescription('myslug', 1),
    'WAR phase 1 of myslug: Work, Audit, Refine, Land, then Wrap-up learnings.')
})
test('(a) deriveDescription with ordinal', () => {
  assert.equal(deriveDescription('myslug', 2, 3),
    'WAR phase 2 of myslug (campaign plan 3): Work, Audit, Refine, Land, then Wrap-up learnings.')
})

// (b) staged text carries the derived meta literals and differs from its input in EXACTLY the two
// literals — proven by substituting the shipped literals back and demanding whole-file equality
// (red: any stray rewrite outside the two anchors).
test('(b) minimal fixture: staged text carries derived literals, differs only in the two literals', () => {
  const dir = scratch('stage-min-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const slug = 'demo-slug'
  const { stdout } = runStager([tpl, dir, slug, '4', '7'])
  const staged = readFileSync(stdout.trim(), 'utf8')
  const name = deriveName(slug, '4', '7')
  const desc = deriveDescription(slug, '4', '7')
  assert.ok(staged.includes(`name: '${name}'`), 'staged carries the derived name literal')
  assert.ok(staged.includes(`description: '${desc}'`), 'staged carries the derived description literal')
  const restored = staged.split(`name: '${name}'`).join(NAME_ANCHOR).split(desc).join(DESCRIPTION_ANCHOR)
  assert.equal(restored, MINIMAL_TEMPLATE)
})

test('(b) shipped template: staged text carries derived literals, differs only in the two literals', () => {
  const dir = scratch('stage-ship-')
  const original = readFileSync(TEMPLATE, 'utf8')
  const slug = '2026-07-16-land-failure-recovery'
  const { stdout } = runStager([TEMPLATE, dir, slug, '1'])
  const staged = readFileSync(stdout.trim(), 'utf8')
  const name = deriveName(slug, '1')
  const desc = deriveDescription(slug, '1')
  assert.ok(staged.includes(`name: '${name}'`), 'staged carries the derived name literal')
  assert.ok(staged.includes(`description: '${desc}'`), 'staged carries the derived description literal')
  const restored = staged.split(`name: '${name}'`).join(NAME_ANCHOR).split(desc).join(DESCRIPTION_ANCHOR)
  assert.equal(restored, original)
})

// (c) fail-loud: a missing OR duplicated anchor exits non-zero (red: delete the exactly-once check
// and the duplicated-anchor arm silently passes).
test('(c) missing name anchor exits non-zero', () => {
  const dir = scratch('stage-miss-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, `export const meta = { description: '${DESCRIPTION_ANCHOR}' }\n`)
  const { status } = runStager([tpl, dir, 'slug', '1'], { expectFail: true })
  assert.notEqual(status, 0)
})
test('(c) duplicated name anchor exits non-zero', () => {
  const dir = scratch('stage-dup-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, `${NAME_ANCHOR}\n${NAME_ANCHOR}\ndescription: '${DESCRIPTION_ANCHOR}'\n`)
  const { status } = runStager([tpl, dir, 'slug', '1'], { expectFail: true })
  assert.notEqual(status, 0)
})

// (d) determinism — two fresh stagings (distinct dirs, same inputs) are byte-identical
// (red: a timestamp or other nondeterministic content).
test('(d) two fresh stagings are byte-identical', () => {
  const dirA = scratch('stage-detA-')
  const dirB = scratch('stage-detB-')
  const tpl = join(dirA, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const a = runStager([tpl, dirA, 'slug', '1', '2']).stdout.trim()
  const b = runStager([tpl, dirB, 'slug', '1', '2']).stdout.trim()
  assert.equal(readFileSync(a, 'utf8'), readFileSync(b, 'utf8'))
})

// (e) write-if-absent — a pre-existing staged file with DIFFERENT content is left byte-untouched,
// its absolute path printed, exit 0 (red: overwrite regression — End state 7).
test('(e) write-if-absent leaves a pre-existing staged file byte-untouched, prints its path, exit 0', () => {
  const dir = scratch('stage-abs-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  const sentinel = '// pre-existing staged content — an approved injected stage\n'
  writeFileSync(stagedPath, sentinel)
  const { stdout, status } = runStager([tpl, dir, 'slug', '1'])
  assert.equal(status, 0)
  assert.ok(isAbsolute(stdout.trim()), 'printed path is absolute')
  assert.equal(readFileSync(stdout.trim(), 'utf8'), sentinel, 'printed path points at the untouched file')
})

// (f) anchor guard (End state 8) — the shipped template contains EXACTLY ONE occurrence of each
// IMPORTED anchor constant. Line-scoped raw-source counting (sum of per-line non-overlapping
// occurrences); NO block-comment strip — a block-comment strip is string-blind and can over-match a
// glob literal, corrupting the count (#929, lesson
// glob-literal-fools-block-comment-strip-regex-in-structural-tests). Red: a second copy of an
// anchor literal anywhere in the template (e.g. a careless coupling comment restating the bytes).
test('(f) anchor guard: each imported anchor occurs exactly once in the shipped template', () => {
  const src = readFileSync(TEMPLATE, 'utf8')
  for (const anchor of [NAME_ANCHOR, DESCRIPTION_ANCHOR, ARGS_FALLBACK_ANCHOR]) {
    const occurrences = src.split('\n').reduce((n, line) => n + (line.split(anchor).length - 1), 0)
    assert.equal(occurrences, 1, `expected exactly one occurrence of ${JSON.stringify(anchor)} in workflow-template.js, found ${occurrences}`)
  }
})

// (g) --force restage — the same pre-existing different-content staged file is overwritten with a
// fresh substitution when --force is passed (red: flag ignored, stale bytes survive).
test('(g) --force overwrites a pre-existing different-content staged file with a fresh substitution', () => {
  const dir = scratch('stage-force-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  writeFileSync(stagedPath, '// stale bytes\n')
  const { status } = runStager([tpl, dir, 'slug', '1', '--force'])
  assert.equal(status, 0)
  const staged = readFileSync(stagedPath, 'utf8')
  assert.ok(staged.includes(`name: '${deriveName('slug', '1')}'`), 'stale bytes replaced by a fresh substitution')
  assert.ok(!staged.includes('stale bytes'), 'stale bytes gone')
})

// ---------------------------------------------------------------------------
// `--args <file>` embedding — cases (h)–(m) from #1134, plus the two fail-loud arms (n)–(o) from #1163.
// ---------------------------------------------------------------------------

// (h) Invalid `--args` (End state 3) — every arm exits non-zero with a named `stage-workflow:` error
// and writes NO staged file. The last three arms are the parse-ordering pins, not incidental:
//   · `--args --force` — the value is the immediately-following token VERBATIM, so `--force` becomes
//     the filename and the run dies at the READ error (a peel that skipped flag-shaped values would
//     instead stage silently with --force honoured);
//   · duplicate `--args` — the peel removes only the first pair, so a second one survives into the
//     positional split and must be caught, not absorbed as campaignOrdinal;
//   · attached `--args=<file>` — this is the #1134 shape. Without the guard the token is not a flag
//     to the parser at all: it survives `rest.filter(a => a !== '--force')` and binds to the 5th
//     positional, staging an args-LESS script at exit 0. Red: drop the guard and this arm exits 0.
test('(h) invalid --args: every arm exits non-zero with a named error and writes no staged file', () => {
  const cases = [
    { label: 'malformed JSON', write: '{ not json', expectStderr: /is not valid JSON/ },
    { label: 'array', write: '[1,2]', expectStderr: /must contain a JSON object, got array/ },
    { label: 'null', write: 'null', expectStderr: /must contain a JSON object, got null/ },
    { label: 'number', write: '5', expectStderr: /must contain a JSON object, got number/ },
    { label: 'string', write: '"x"', expectStderr: /must contain a JSON object, got string/ },
    { label: 'boolean', write: 'true', expectStderr: /must contain a JSON object, got boolean/ },
  ]
  for (const { label, write, expectStderr } of cases) {
    const dir = scratch('stage-badargs-')
    const tpl = join(dir, 'tpl.js')
    writeFileSync(tpl, MINIMAL_TEMPLATE)
    const argsPath = join(dir, 'args.json')
    writeFileSync(argsPath, write)
    const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', argsPath], { expectFail: true })
    assert.notEqual(status, 0, `${label}: must exit non-zero`)
    assert.match(stderr, /^stage-workflow: /m, `${label}: error must be stage-workflow:-prefixed`)
    assert.match(stderr, expectStderr, `${label}: error must name the failure`)
    assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false, `${label}: no staged file written`)
  }
})

test('(h) --args with a nonexistent file exits non-zero at the named read error, writes no staged file', () => {
  const dir = scratch('stage-noargs-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', join(dir, 'absent.json')], { expectFail: true })
  assert.notEqual(status, 0)
  assert.match(stderr, /stage-workflow: cannot read --args file/)
  assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false)
})

test('(h) --args as the last token (missing value) exits non-zero with the usage error', () => {
  const dir = scratch('stage-argsnoval-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args'], { expectFail: true })
  assert.notEqual(status, 0)
  assert.match(stderr, /stage-workflow: --args requires a following <file> token/)
  assert.match(stderr, /usage: node stage-workflow\.mjs/)
  assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false)
})

test('(h) peel ordering: `--args --force` consumes --force as the filename and dies at the read error', () => {
  const dir = scratch('stage-argsforce-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', '--force'], { expectFail: true })
  assert.notEqual(status, 0)
  assert.match(
    stderr,
    /stage-workflow: cannot read --args file "--force"/,
    'the value token is taken VERBATIM — a flag-shaped value must fail loud at the read, never be re-parsed as --force',
  )
  assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false)
})

test('(h) duplicate --args exits non-zero with the usage error', () => {
  const dir = scratch('stage-argsdup-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const a = writeArgs(dir, { k: 1 })
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', a, '--args', a], { expectFail: true })
  assert.notEqual(status, 0)
  assert.match(stderr, /stage-workflow: repeated --args/)
  assert.match(stderr, /usage: node stage-workflow\.mjs/)
  assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false)
})

test('(h) attached-form --args=<file> exits non-zero with the usage error (#1134), never a silent args-less stage', () => {
  const dir = scratch('stage-argsattached-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const a = writeArgs(dir, { k: 1 })
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', `--args=${a}`], { expectFail: true })
  assert.notEqual(status, 0, 'the attached form must be REJECTED — unguarded it binds to campaignOrdinal and stages args-less at exit 0')
  assert.match(stderr, /stage-workflow: --args takes its value as a separate following token/)
  assert.equal(existsSync(join(dir, deriveName('slug', '1') + '.js')), false)
  // …and it must not have leaked into the basename as a campaignOrdinal either.
  assert.equal(existsSync(join(dir, deriveName('slug', '1', `--args=${a}`) + '.js')), false)
})

// (i) Valid `--args` on the SHIPPED template (End state 2 i–iii). (i) is pinned POSITIONALLY and with
// a dispatch-shape assertion — the Workflow tool refuses a script whose first STATEMENT is not
// `export const meta` ("Invalid workflow script: …"), so a prepended prelude dies before any agent is
// dispatched. A "prelude is present" check would have passed that broken prepend; this one does not.
test('(i) valid --args: prelude follows the meta statement, fallback rewritten, restores to the shipped template', () => {
  const dir = scratch('stage-args-ok-')
  const original = readFileSync(TEMPLATE, 'utf8')
  const payload = { phase: { id: 7 }, tasks: [], note: 'hello' }
  const slug = 'args-embedding'
  const { stdout } = runStager([TEMPLATE, dir, slug, '2', '--args', writeArgs(dir, payload)])
  const staged = readFileSync(stdout.trim(), 'utf8')

  // (i) placement — positional, not presence.
  const metaAt = staged.indexOf('export const meta')
  const preludeAt = staged.indexOf('const EMBEDDED_ARGS =')
  assert.notEqual(metaAt, -1, 'staged text keeps its `export const meta` statement')
  assert.notEqual(preludeAt, -1, 'staged text carries the EMBEDDED_ARGS prelude')
  assert.ok(preludeAt > metaAt, 'the prelude must follow the `export const meta` statement, never precede it')
  for (const line of staged.slice(0, metaAt).split('\n')) {
    assert.ok(
      line.trim() === '' || line.trim().startsWith('//'),
      `no STATEMENT may precede \`export const meta\` (a leading comment is fine, a leading const is not); found: ${JSON.stringify(line)}`,
    )
  }

  // (ii) the fallback is rewritten, and the original fallback bytes are gone.
  assert.equal(staged.split(': (args || EMBEDDED_ARGS)').length - 1, 1, 'the rewritten fallback appears exactly once')
  assert.ok(!staged.includes(ARGS_FALLBACK_ANCHOR), 'the original fallback bytes are gone from the staged text')
  assert.ok(staged.includes(preludeLine(payload)), 'the prelude carries the JSON.stringify payload byte-equal')

  // (iii) reversing all three substitutions and stripping the prelude restores the shipped template.
  const name = deriveName(slug, '2')
  const desc = deriveDescription(slug, '2')
  const restored = staged
    .split(`name: '${name}'`).join(NAME_ANCHOR)
    .split(desc).join(DESCRIPTION_ANCHOR)
    .split(': (args || EMBEDDED_ARGS)').join(ARGS_FALLBACK_ANCHOR)
    .replace(PRELUDE_STRIP, '')
  assert.equal(restored, original)
})

// (j) Injection-ordering invariant (End state 4) — a payload that string-quotes all three anchors AND
// carries JS-meta content (backticks, `${`, quotes, newlines, U+2028/U+2029) still stages cleanly: the
// payload is injected only AFTER every exactly-once count has run, so it cannot fork the stage.
test('(j) a payload quoting all three anchors with JS-meta content stages cleanly, prelude byte-equal', () => {
  const dir = scratch('stage-args-evil-')
  const original = readFileSync(TEMPLATE, 'utf8')
  const payload = {
    anchors: [NAME_ANCHOR, DESCRIPTION_ANCHOR, ARGS_FALLBACK_ANCHOR],
    jsMeta: 'back`tick ${interp} "double" \'single\' \\backslash\nnewline\u2028LS\u2029PS',
  }
  const slug = 'evil-payload'
  const { stdout, status } = runStager([TEMPLATE, dir, slug, '3', '--args', writeArgs(dir, payload)])
  assert.equal(status, 0, 'an anchor-quoting payload must stage cleanly')
  const staged = readFileSync(stdout.trim(), 'utf8')
  assert.ok(staged.includes(`name: '${deriveName(slug, '3')}'`), 'the name substitution still landed')
  assert.ok(staged.includes(deriveDescription(slug, '3')), 'the description substitution still landed')
  assert.equal(staged.split(': (args || EMBEDDED_ARGS)').length - 1, 1, 'the fallback rewrite is still exactly-once')
  assert.ok(staged.includes(preludeLine(payload)), 'the prelude carries the JSON.stringify output byte-equal')
  const restored = staged
    .split(`name: '${deriveName(slug, '3')}'`).join(NAME_ANCHOR)
    .split(deriveDescription(slug, '3')).join(DESCRIPTION_ANCHOR)
    .split(': (args || EMBEDDED_ARGS)').join(ARGS_FALLBACK_ANCHOR)
    .replace(PRELUDE_STRIP, '')
  assert.equal(restored, original, 'even an anchor-quoting payload leaves the rest of the template byte-untouched')
})

// (k) No-flag negative (End state 1) — keyed on the SUBSTITUTION EVIDENCE, never the bare token: the
// template's referential coupling comment mentions EMBEDDED_ARGS by name and the stager copies template
// bytes verbatim apart from the substitutions, so that mention rides into every staged copy by
// construction and a zero-bare-token assertion would be RED on arrival. Steps (2)–(3) provably never ran.
test('(k) without --args the staged output carries no substitution evidence and keeps the original fallback', () => {
  const dir = scratch('stage-noflag-')
  const { stdout } = runStager([TEMPLATE, dir, 'no-flag-slug', '1'])
  const staged = readFileSync(stdout.trim(), 'utf8')
  assert.equal(staged.split('const EMBEDDED_ARGS =').length - 1, 0, 'no prelude was injected')
  assert.equal(staged.split(': (args || EMBEDDED_ARGS)').length - 1, 0, 'the fallback was not rewritten')
  assert.equal(staged.split(ARGS_FALLBACK_ANCHOR).length - 1, 1, 'the original fallback survives exactly once')
})

// (l) Write-if-absent still short-circuits before any --args processing — the addition is one stderr
// warning, so an operator who believes they just re-embedded is told otherwise. Exit code, stdout and
// the staged bytes are unchanged (a resume re-running the same stage command sees an accurate,
// harmless warning, never an error).
test('(l) --args on a pre-existing staged file warns on stderr, leaves it byte-untouched, exits 0', () => {
  const dir = scratch('stage-args-reuse-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  const sentinel = '// pre-existing staged content — an approved injected stage\n'
  writeFileSync(stagedPath, sentinel)
  const { stdout, stderr, status } = runStager([tpl, dir, 'slug', '1', '--args', writeArgs(dir, { k: 1 })])
  assert.equal(status, 0)
  assert.equal(stdout.trim(), stagedPath, 'stdout stays the staged path, byte-unchanged')
  assert.equal(readFileSync(stagedPath, 'utf8'), sentinel, 'the staged file is byte-untouched — no re-embed')
  assert.match(
    stderr,
    /stage-workflow: existing staged file reused — --args ignored \(pass --force to re-embed\)/,
    'the ignored --args must be reported once on stderr',
  )
})

// (m) Entry-validation semantics of the embedded fallback — the SEMANTIC half of the plan's
// live-transport backstop, pulled pre-merge (red-team 2026-07-27). Only the TRANSPORT half (what the
// harness actually hands a staged script at ~104.5 KB) still needs a live run.
//
// This is the file-header carve-out: a ~3-line AsyncFunction harness, NET-NEW here on purpose —
// workflow-template.test.mjs's builder is module-scoped and closed over the shipped template, so it is
// unreachable from this suite. Every effect handle is stubbed and `args` is passed FALSY, which is
// exactly the shape a staged script sees when the Lead dispatches with no Workflow args.
//
// The discriminator is the returned `phase` field: entry validation assigns `phaseId` from the args
// object it resolved, so a sentinel phase id can only appear if the EMBEDDED payload became `A`. The
// no-flag control proves it: staged without --args, the same falsy entry resolves `{}` and the field
// comes back null. Red: break the embedding and the sentinel arm returns null too.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const runStagedEntry = (text, args) => new AsyncFunction(
  'agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget',
  text.replace(/^export const meta/m, 'const meta'),
)(async () => ({}), async (t) => Promise.all(t.map((f) => f())), async () => [], () => {}, () => {}, args, { total: null })

test('(m) a staged script entered with FALSY args clears entry validation via the embedded fallback', async () => {
  const dir = scratch('stage-entry-')
  const sentinel = 'P-EMBEDDED-SENTINEL'
  const withArgs = runStager([TEMPLATE, dir, 'entry-slug', '1', '--args', writeArgs(dir, { phase: { id: sentinel } })])
  const out = await runStagedEntry(readFileSync(withArgs.stdout.trim(), 'utf8'), undefined)
  assert.doesNotMatch(
    String((out.workflowError && out.workflowError.message) || ''),
    /args must be a JSON object/,
    'the embedded fallback must satisfy the top-level ADR 0034 entry validation on a falsy `args`',
  )
  assert.equal(out.phase, sentinel, 'the resolved args object must BE the embedded payload')

  // Control: staged WITHOUT --args, the same falsy entry resolves the empty-object fallback.
  const noArgs = runStager([TEMPLATE, scratch('stage-entry-ctl-'), 'entry-slug', '1'])
  const ctl = await runStagedEntry(readFileSync(noArgs.stdout.trim(), 'utf8'), undefined)
  assert.equal(ctl.phase, null, 'without --args a falsy entry still resolves {} — so the sentinel above is real evidence')
})

// (n)–(o) The two fail-loud arms of the `--args` path that had NO test at all (#1163). Both are
// reachable only WITH `--args`: without the flag neither step (2) nor step (3) runs.
//
// THROW ORDER, stated because the fixtures are otherwise easy to misread (decoy-fixture-comment
// lesson): main() substitutes name → description → args fallback via `replaceExactlyOnce`, and ONLY
// THEN calls `insertArgsPrelude`. So (n)'s fixture dies at the third substitution and never reaches
// the insertion, while (o)'s fixture must satisfy all three substitutions first in order to reach
// it. The two stderr shapes are disjoint and each has a single emitter in the stager:
// `expected exactly one <label> anchor` comes only from `replaceExactlyOnce`, `could not locate the`
// only from `insertArgsPrelude` — so the matched fragment is itself the proof of which arm fired.
// Both assertions anchor on that stable fragment ALONE, never the full message bytes (spec §8): a
// future reword of these errors should RED loudly, but nothing wider is coupled.

// (n) `args fallback` exactly-once arm — the third substitution, count 0. MINIMAL_TEMPLATE already
// IS the needed shape: both meta anchors, no `: (args || {})` tail. Red: drop the exactly-once check
// and count 0 becomes a no-op join — the stager then injects an EMBEDDED_ARGS prelude the never-
// rewritten fallback can never read, and exits 0 on a silently args-less script.
test('(n) --args on a fixture with no fallback tail exits non-zero at the args-fallback exactly-once throw', () => {
  const dir = scratch('stage-nofallback-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', writeArgs(dir, { k: 1 })], { expectFail: true })
  assert.notEqual(status, 0, 'a missing args-fallback anchor must fail loud, never stage a script whose prelude is dead weight')
  assert.match(stderr, /expected exactly one args fallback anchor/)
})

// A fixture whose `export const meta` statement opens AND closes on one line, with no column-0 `}`
// line anywhere else either — `META_STATEMENT` is line-anchored (`^\}$`), so it finds no terminator
// and does not match. The "anywhere else" half is load-bearing: give the fixture any later column-0
// `}` line and the regex matches through to THAT line and inserts without throwing. All three
// anchors are present exactly once, built from the imported constants, so the three substitutions
// succeed and the insertion is genuinely reached.
const META_ONE_LINE_TEMPLATE = `export const meta = { ${NAME_ANCHOR}, description: '${DESCRIPTION_ANCHOR}' }
const A = typeof args === 'string' ? JSON.parse(args) ${ARGS_FALLBACK_ANCHOR}
`

// (o) `insertArgsPrelude` meta-not-found arm — the last `--args` step. Red: swap the throw for a
// silent `return text` and the stager writes a staged copy referencing an EMBEDDED_ARGS constant it
// never declared, exit 0 — a ReferenceError deferred to dispatch time.
test('(o) --args on a fixture with no column-0 `}` line exits non-zero at the insertArgsPrelude meta-not-found throw', () => {
  const dir = scratch('stage-nometa-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, META_ONE_LINE_TEMPLATE)
  const { status, stderr } = runStager([tpl, dir, 'slug', '1', '--args', writeArgs(dir, { k: 1 })], { expectFail: true })
  assert.notEqual(status, 0, 'an unlocatable meta statement must fail loud, never stage an undeclared-EMBEDDED_ARGS script')
  assert.match(stderr, /could not locate the/)
})

// (guard) Symlink-invocation regression: running the CLI through a symlink must still fire main()
// (fail loud), never silently exit 0. RED against the pre-normalization guard
// (`fileURLToPath(import.meta.url) === process.argv[1]`): the loader realpaths the main module, but
// argv[1] keeps the symlink path, so bare-equality is false and main() never runs. The realpathSync
// idiom canonicalizes both sides so the guard fires. (Relative invocation is non-discriminating on
// Node >= 24 — argv[1] arrives pre-resolved — so the symlink is the trigger that goes RED.)
test('(guard) symlinked invocation still runs main() — usage on stderr, non-zero exit', () => {
  const link = join(scratch('stage-symlink-'), 'link.mjs')
  symlinkSync(STAGER, link)
  let status, stderr
  try {
    execFileSync(process.execPath, [link], { encoding: 'utf8' })
    status = 0
  } catch (err) {
    status = err.status
    stderr = err.stderr || ''
  }
  assert.notEqual(status, 0, 'symlinked invocation must exit non-zero (main ran and hit the missing-arg path)')
  assert.match(stderr, /usage: node stage-workflow\.mjs/, `usage line must reach stderr; got: ${stderr}`)
})
