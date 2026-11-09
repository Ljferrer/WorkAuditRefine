import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, symlinkSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { NAME_ANCHOR, DESCRIPTION_ANCHOR, ARGS_FALLBACK_ANCHOR, SCRIPT_BYTE_CAP, DISCARD_FLAG, SIDECAR_SUFFIX, ARGS_SIBLING_SUFFIX, argsSiblingPath, argsLoaderLine, argsFallbackRewrite, deriveName, deriveDescription, stripFullLineComments } from './stage-workflow.mjs'
import { extractInterpolations, extractArgsFields, unguardedTopLevelKeys, ptSpanRanges } from './assert-args-complete.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const STAGER = join(HERE, 'stage-workflow.mjs')
const TEMPLATE = join(HERE, 'workflow-template.js')

// Run the real stager CLI as a subprocess. We assert on the STAGED TEXT it writes and the exported
// pure functions. DESIGN INVARIANT, with ONE carve-out: we never import() a staged copy or the
// shipped template, because the template's top-level body IS a phase run. The carve-out is case (m),
// the embedded-args ENTRY-VALIDATION harness — it builds a staged copy into an AsyncFunction with
// every effect handle stubbed and reads the returned object, which exercises the top-level arg entry
// guard and nothing beyond it (no import(), no real dispatch), and the `args sibling (D38):` rows that
// run the same entry harness or evaluate an args sibling script (a meta statement and a `return` of
// JSON, nothing else). Any other execution of staged text stays out of this suite. The `indent-strip: harness runs the staged form` row is no such execution:
// its child process imports workflow-template.test-harness.mjs and COMPILES the template with build(),
// reading the compiled bytes back, but never calls the result.
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

// The one-line args loader the stager inserts (D38), and the strip used by the restore roundtrips.
// The expected loader and fallback bytes come from the stager's exports for the staged path the CLI
// printed; the args sibling's evaluated return value (argsOf below) is the independent check that the
// payload itself travels byte-equal.
const PRELUDE_STRIP = /^let EMBEDDED_ARGS = null, EMBEDDED_ARGS_ERROR = null; [^\n]*\n/m
const restoreArgs = (staged, stagedPath) => staged
  .split(argsFallbackRewrite(argsSiblingPath(stagedPath))).join(ARGS_FALLBACK_ANCHOR)
  .replace(PRELUDE_STRIP, '')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
// Evaluate a Workflow script body the way the harness hands it one: `export const meta` becomes a
// plain const and the body runs as an async function, with `workflow` bound to the given stub.
const evalScript = (text, workflow) => new AsyncFunction('workflow', text.replace(/^export const meta/m, 'const meta'))(workflow)
// A `workflow` stub that does what the Workflow tool does for a nested scriptPath: run that script.
const siblingWorkflow = (calls = []) => async ({ scriptPath }) => {
  calls.push(scriptPath)
  return evalScript(readFileSync(scriptPath, 'utf8'), async () => { throw new Error('nested workflow() is refused') })
}
const argsOf = (stagedPath) => evalScript(readFileSync(argsSiblingPath(stagedPath), 'utf8'), async () => { throw new Error('the args sibling calls no workflow()') })
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
  assert.equal(restored, stripFullLineComments(MINIMAL_TEMPLATE), 'against the stripped fixture: the strip drops the meta lines\' indent (arm (s))')
})

// The shipped-template arms compare against the COMMENT- AND INDENT-STRIPPED template (#2099, #2613): the
// stager blanks full-line code comments and drops top-level indent before it substitutes, so "differs only
// in the two literals" holds against stripFullLineComments(original), and the strip itself is proven
// separately in (p) and (s).
test('(b) shipped template: staged text carries derived literals, differs only in the two literals', () => {
  const dir = scratch('stage-ship-')
  const original = stripFullLineComments(readFileSync(TEMPLATE, 'utf8'))
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
// fresh substitution when --force is passed and its digest sidecar matches its bytes (a clean stage
// from an older template; red: flag ignored, stale bytes survive). Arm (t) covers the refusals.
const sha256 = (text) => createHash('sha256').update(text).digest('hex')
test('(g) --force overwrites a pre-existing different-content staged file with a fresh substitution', () => {
  const dir = scratch('stage-force-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  writeFileSync(stagedPath, '// stale bytes\n')
  writeFileSync(stagedPath + SIDECAR_SUFFIX, sha256('// stale bytes\n') + '\n')
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
test('(i) valid --args: prelude follows the meta statement, fallback rewritten, restores to the shipped template', async () => {
  const dir = scratch('stage-args-ok-')
  const original = stripFullLineComments(readFileSync(TEMPLATE, 'utf8'))
  const payload = { phase: { id: 7 }, tasks: [], note: 'hello' }
  const slug = 'args-embedding'
  const { stdout } = runStager([TEMPLATE, dir, slug, '2', '--args', writeArgs(dir, payload)])
  const stagedPath = stdout.trim()
  const staged = readFileSync(stagedPath, 'utf8')

  // (i) placement — positional, not presence.
  const metaAt = staged.indexOf('export const meta')
  const preludeAt = staged.indexOf('let EMBEDDED_ARGS =')
  assert.notEqual(metaAt, -1, 'staged text keeps its `export const meta` statement')
  assert.notEqual(preludeAt, -1, 'staged text carries the EMBEDDED_ARGS loader')
  assert.ok(preludeAt > metaAt, 'the loader must follow the `export const meta` statement, never precede it')
  assert.equal(staged.split('\n').length, original.split('\n').length + 1, 'an --args stage adds exactly the one loader line — no blank line left behind (#2099 round 3)')
  assert.match(staged, /^\}\nlet EMBEDDED_ARGS = /m, 'the loader sits on the line right after the `}` that closes meta')
  assert.equal(staged.indexOf('let EMBEDDED_ARGS = '), staged.indexOf('\n}\n') + 3, 'and that `}` is the FIRST column-0 `}` of the file — meta\'s own, not a later one')
  for (const line of staged.slice(0, metaAt).split('\n')) {
    assert.ok(
      line.trim() === '' || line.trim().startsWith('//'),
      `no STATEMENT may precede \`export const meta\` (a leading comment is fine, a leading const is not); found: ${JSON.stringify(line)}`,
    )
  }

  // (ii) the fallback is rewritten, the original fallback bytes are gone, and the args ride the
  // sibling, never the staged copy.
  assert.equal(staged.split(argsFallbackRewrite(argsSiblingPath(stagedPath))).length - 1, 1, 'the rewritten fallback appears exactly once')
  assert.ok(!staged.includes(ARGS_FALLBACK_ANCHOR), 'the original fallback bytes are gone from the staged text')
  assert.ok(staged.includes(argsLoaderLine(argsSiblingPath(stagedPath)) + '\n'), 'the loader names the args sibling beside the staged copy')
  assert.ok(!staged.includes('"note":"hello"'), 'the args JSON is not in the staged copy')
  assert.deepEqual(await argsOf(stagedPath), payload, 'the args sibling returns the payload')

  // (iii) reversing all three substitutions and stripping the loader restores the shipped template.
  const name = deriveName(slug, '2')
  const desc = deriveDescription(slug, '2')
  const restored = restoreArgs(staged
    .split(`name: '${name}'`).join(NAME_ANCHOR)
    .split(desc).join(DESCRIPTION_ANCHOR), stagedPath)
  assert.equal(restored, original)
})

// (i) The two other line-ending shapes insertArgsPrelude must handle (#2099 round 4): a CRLF template,
// where a multiline `$` matches before `\r` and the prelude must still go in after the whole `\r\n`
// (no blank second line); and a template whose meta `}` is the file's last byte, where the loader is
// appended after a newline of its own instead of glued onto the `}`. Both carry the fallback tail
// inside meta so the --args path reaches the insert.
const TAIL_IN_META = `export const meta = {\n  ${NAME_ANCHOR},\n  description: '${DESCRIPTION_ANCHOR}',\n  a${ARGS_FALLBACK_ANCHOR},\n}`
test('(i) --args prelude under CRLF endings adds exactly one line; a `}` as the last byte gets the prelude on its own line', () => {
  const dir = scratch('stage-args-endings-')
  const crlf = join(dir, 'crlf.js')
  writeFileSync(crlf, (TAIL_IN_META + '\nexport const other = 1\n').replace(/\n/g, '\r\n'))
  const stagedCrlf = readFileSync(runStager([crlf, dir, 'crlf-slug', '1', '--args', writeArgs(dir, { k: 1 })]).stdout.trim(), 'utf8')
  assert.ok(stagedCrlf.includes('}\r\nlet EMBEDDED_ARGS = '), 'the loader follows the whole CRLF line ending')
  assert.equal(stagedCrlf.split('\n').length, (TAIL_IN_META + '\nexport const other = 1\n').split('\n').length + 1, 'exactly one line added under CRLF — no blank second line')
  const lastByte = join(dir, 'last-byte.js')
  writeFileSync(lastByte, TAIL_IN_META)
  const stagedLast = readFileSync(runStager([lastByte, dir, 'last-slug', '1', '--args', writeArgs(dir, { k: 1 })]).stdout.trim(), 'utf8')
  assert.ok(stagedLast.includes('}\nlet EMBEDDED_ARGS = '), 'a `}` that is the last byte gets the loader on its own line, never glued on')
})

// (j) Injection-ordering invariant (End state 4) — a payload that string-quotes all three anchors AND
// carries JS-meta content (backticks, `${`, quotes, newlines, U+2028/U+2029) still stages cleanly: the
// payload never enters the staged copy (it rides the args sibling, D38), and the loader goes in only
// AFTER every exactly-once count has run, so the payload cannot fork the stage.
test('(j) a payload quoting all three anchors with JS-meta content stages cleanly, prelude byte-equal', async () => {
  const dir = scratch('stage-args-evil-')
  const original = stripFullLineComments(readFileSync(TEMPLATE, 'utf8'))
  const payload = {
    anchors: [NAME_ANCHOR, DESCRIPTION_ANCHOR, ARGS_FALLBACK_ANCHOR],
    jsMeta: 'back`tick ${interp} "double" \'single\' \\backslash\nnewline\u2028LS\u2029PS',
  }
  const slug = 'evil-payload'
  const { stdout, status } = runStager([TEMPLATE, dir, slug, '3', '--args', writeArgs(dir, payload)])
  assert.equal(status, 0, 'an anchor-quoting payload must stage cleanly')
  const stagedPath = stdout.trim()
  const staged = readFileSync(stagedPath, 'utf8')
  assert.ok(staged.includes(`name: '${deriveName(slug, '3')}'`), 'the name substitution still landed')
  assert.ok(staged.includes(deriveDescription(slug, '3')), 'the description substitution still landed')
  assert.equal(staged.split(argsFallbackRewrite(argsSiblingPath(stagedPath))).length - 1, 1, 'the fallback rewrite is still exactly-once')
  assert.ok(staged.includes(argsLoaderLine(argsSiblingPath(stagedPath)) + '\n'), 'the loader line is byte-equal to the stager\'s')
  assert.ok(!staged.includes(JSON.stringify(payload.jsMeta)), 'the payload is not in the staged copy')
  assert.deepEqual(await argsOf(stagedPath), payload, 'the args sibling returns the JS-meta payload byte-equal')
  const restored = restoreArgs(staged
    .split(`name: '${deriveName(slug, '3')}'`).join(NAME_ANCHOR)
    .split(deriveDescription(slug, '3')).join(DESCRIPTION_ANCHOR), stagedPath)
  assert.equal(restored, original, 'even an anchor-quoting payload leaves the rest of the template byte-untouched')
})

// (k) No-flag negative (End state 1) — keyed on the SUBSTITUTION EVIDENCE, never the bare token: the
// template's referential coupling comment mentions EMBEDDED_ARGS by name, and although the #2099
// comment strip now blanks that full-line comment out of the staged copy, a trailing or block comment
// naming the token would still ride through — so the bare token stays the wrong key. Steps (2)–(3)
// provably never ran.
test('(k) without --args the staged output carries no substitution evidence and keeps the original fallback', () => {
  const dir = scratch('stage-noflag-')
  const { stdout } = runStager([TEMPLATE, dir, 'no-flag-slug', '1'])
  const staged = readFileSync(stdout.trim(), 'utf8')
  assert.equal(staged.split('let EMBEDDED_ARGS =').length - 1, 0, 'no loader was inserted')
  assert.equal(staged.split(': (args || EMBEDDED_ARGS').length - 1, 0, 'the fallback was not rewritten')
  assert.equal(staged.split(ARGS_FALLBACK_ANCHOR).length - 1, 1, 'the original fallback survives exactly once')
  assert.ok(!existsSync(argsSiblingPath(stdout.trim())), 'no args sibling is written')
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
    /stage-workflow: existing staged file reused — --args ignored \(pass --force or --discard-injections to re-embed\)/,
    'the ignored --args must be reported once on stderr',
  )
})

// (m) Entry-validation semantics of the embedded fallback — the SEMANTIC half of the plan's
// live-transport backstop, pulled pre-merge (red-team 2026-07-27). Only the TRANSPORT half (what the
// harness actually hands a staged script at ~104.5 KB) still needs a live run.
//
// This is the file-header carve-out: a ~3-line AsyncFunction harness, NET-NEW here on purpose —
// workflow-template.engine-1.test.mjs's builder is module-scoped and closed over the shipped template, so it is
// unreachable from this suite. Every effect handle is stubbed and `args` is passed FALSY, which is
// exactly the shape a staged script sees when the Lead dispatches with no Workflow args.
//
// The discriminator is the returned `phase` field: entry validation assigns `phaseId` from the args
// object it resolved, so a sentinel phase id can only appear if the EMBEDDED payload became `A`. The
// no-flag control proves it: staged without --args, the same falsy entry resolves `{}` and the field
// comes back null. Red: break the embedding and the sentinel arm returns null too. The staged copy
// loads its args from the args sibling through `workflow({ scriptPath })` (D38), so the harness binds
// `workflow` to siblingWorkflow, which runs the named script as the Workflow tool would.
const runStagedEntry = (text, args, workflow = siblingWorkflow()) => new AsyncFunction(
  'agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', 'workflow',
  text.replace(/^export const meta/m, 'const meta'),
)(async () => ({}), async (t) => Promise.all(t.map((f) => f())), async () => [], () => {}, () => {}, args, { total: null }, workflow)

test('(m) a staged script entered with FALSY args clears entry validation via the embedded fallback', async () => {
  const dir = scratch('stage-entry-')
  const sentinel = 'P-EMBEDDED-SENTINEL'
  const withArgs = runStager([TEMPLATE, dir, 'entry-slug', '1', '--args', writeArgs(dir, { phase: { id: sentinel } })])
  const loads = []
  const out = await runStagedEntry(readFileSync(withArgs.stdout.trim(), 'utf8'), undefined, siblingWorkflow(loads))
  assert.deepEqual(loads, [argsSiblingPath(withArgs.stdout.trim())], 'the falsy entry loads the args sibling exactly once')
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

// args sibling (D38, operator ruling 2026-11-09: the staged-template cap is funded by moving the
// embedded args into a sibling args script). Under --args the stager writes the args to
// `<staged basename minus .js>.args.js` with its own sidecar, and the staged copy carries one loader
// line that reads it through `workflow({ scriptPath })` only when no args were dispatched. Each row
// names the stage it proves: the loader shape, the sibling's return value, the paired --force and cap
// refusals, the dispatched-args skip, the held:workflow-error on a failed load (the loader stores the
// error, so nothing above the engine's top-level try throws), and the partial-presence rules.
const D38_MARKER = 'D38-PAYLOAD-MARKER'
const d38Stage = (extra = []) => {
  const dir = scratch('stage-d38-')
  const payload = { phase: { id: 'P-D38' }, tasks: [], marker: D38_MARKER }
  const argsFile = writeArgs(scratch('stage-d38-args-'), payload)
  const stagedPath = runStager([TEMPLATE, dir, 'd38-slug', '1', '--args', argsFile, ...extra]).stdout.trim()
  return { dir, payload, argsFile, stagedPath, siblingPath: argsSiblingPath(stagedPath) }
}
test('args sibling (D38): the staged copy carries the one-line loader and no args JSON', () => {
  const { dir, stagedPath, siblingPath } = d38Stage()
  assert.equal(siblingPath, join(dir, deriveName('d38-slug', '1') + ARGS_SIBLING_SUFFIX), 'the sibling sits beside the staged copy, named after it')
  const staged = readFileSync(stagedPath, 'utf8')
  const loaders = staged.split('\n').filter((l) => l.includes('EMBEDDED_ARGS = null'))
  assert.deepEqual(loaders, [argsLoaderLine(siblingPath)], 'exactly one loader line, naming the absolute sibling path')
  assert.ok(loaders[0].includes('if (!args) try {') && loaders[0].includes('catch (e) { EMBEDDED_ARGS_ERROR = e }'), 'the loader runs only on absent args and stores its error')
  assert.ok(!staged.includes(D38_MARKER), 'the args JSON is not in the staged copy')
  assert.ok(readFileSync(siblingPath, 'utf8').includes(D38_MARKER), 'the args JSON is in the sibling')
  const bare = readFileSync(runStager([TEMPLATE, scratch('stage-d38-bare-'), 'd38-slug', '1']).stdout.trim(), 'utf8')
  assert.equal(staged.split('\n').length, bare.split('\n').length + 1, 'the loader is the only line an --args stage adds')
})
test('args sibling (D38): the sibling returns the exact args object', async () => {
  const { payload, stagedPath, siblingPath } = d38Stage()
  const text = readFileSync(siblingPath, 'utf8')
  assert.match(text, /^export const meta = \{/, 'the sibling opens with its meta statement, as the Workflow tool requires')
  assert.equal(text.split('\n').filter(Boolean).length, 2, 'a meta statement, then the return')
  assert.deepEqual(await argsOf(stagedPath), payload)
  assert.equal(readFileSync(siblingPath + SIDECAR_SUFFIX, 'utf8'), sha256(text) + '\n', 'the sibling has its own matching sidecar')
})
test('args sibling (D38): a --force restage over a hand-edited sibling refuses', () => {
  const { dir, argsFile, stagedPath, siblingPath } = d38Stage()
  const edited = readFileSync(siblingPath, 'utf8').replace(D38_MARKER, 'HAND-EDITED')
  writeFileSync(siblingPath, edited)
  const stagedBefore = readFileSync(stagedPath, 'utf8')
  const r = runStager([TEMPLATE, dir, 'd38-slug', '1', '--force', '--args', argsFile], { expectFail: true })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /existing args sibling .* differs from its \.sha256 digest sidecar/)
  assert.match(r.stderr, new RegExp(DISCARD_FLAG))
  assert.equal(readFileSync(siblingPath, 'utf8'), edited, 'the sibling is left byte-untouched')
  assert.equal(readFileSync(stagedPath, 'utf8'), stagedBefore, 'the staged copy is left byte-untouched too: the pair moves together')
  runStager([TEMPLATE, dir, 'd38-slug', '1', DISCARD_FLAG, '--args', argsFile])
  assert.ok(readFileSync(siblingPath, 'utf8').includes(D38_MARKER), `${DISCARD_FLAG} overwrites the hand-edited sibling`)
})
test('args sibling (D38): an over-cap args file refuses and writes nothing', () => {
  const dir = scratch('stage-d38-cap-')
  const r = runStager([TEMPLATE, dir, 'd38-cap', '1', '--args', writeArgs(dir, { pad: 'x'.repeat(SCRIPT_BYTE_CAP) })], { expectFail: true })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, new RegExp(`args sibling script would be \\d+ bytes, over the Workflow tool's ${SCRIPT_BYTE_CAP}-byte scriptPath cap \\(args JSON [1-9]\\d* bytes\\)`))
  const staged = join(dir, deriveName('d38-cap', '1') + '.js')
  assert.ok(!existsSync(staged) && !existsSync(argsSiblingPath(staged)), 'neither file is written')
})
test('args sibling (D38): an over-cap existing sibling refuses reuse', () => {
  const { dir, siblingPath } = d38Stage()
  const inflated = 'x'.repeat(SCRIPT_BYTE_CAP + 1)
  writeFileSync(siblingPath, inflated)
  const r = runStager([TEMPLATE, dir, 'd38-slug', '1'], { expectFail: true })
  assert.equal(r.status, 1)
  assert.match(r.stderr, new RegExp(`existing args sibling .* is ${SCRIPT_BYTE_CAP + 1} bytes, over the Workflow tool's`))
  assert.match(r.stderr, new RegExp(DISCARD_FLAG))
  assert.equal(r.stdout, '', 'a refused reuse prints no staged path')
  assert.equal(readFileSync(siblingPath, 'utf8'), inflated, 'the sibling is left byte-untouched')
})
test('args sibling (D38): dispatched args skip the loader', async () => {
  const { stagedPath } = d38Stage()
  const loads = []
  const out = await runStagedEntry(readFileSync(stagedPath, 'utf8'), { phase: { id: 'P-DISPATCHED' } }, siblingWorkflow(loads))
  assert.deepEqual(loads, [], 'no workflow() load runs when args were dispatched')
  assert.equal(out.phase, 'P-DISPATCHED', 'the dispatched args win')
})
test('args sibling (D38): a missing sibling yields held:workflow-error naming the args sibling', async () => {
  const { stagedPath, siblingPath } = d38Stage()
  rmSync(siblingPath)
  const text = readFileSync(stagedPath, 'utf8')
  for (const [label, workflow] of [['a workflow() that cannot read the sibling', siblingWorkflow()], ['no workflow binding at all', undefined]]) {
    const out = await new AsyncFunction(
      'agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', 'workflow',
      text.replace(/^export const meta/m, 'const meta'),
    )(async () => ({}), async (t) => Promise.all(t.map((f) => f())), async () => [], () => {}, () => {}, undefined, { total: null }, workflow)
    assert.equal(out.landDecision, 'held:workflow-error', `${label}: a failed load returns a structured hold, never a throw`)
    assert.match(out.workflowError.message, /args sibling load failed/, `${label}: the message names the args sibling`)
    assert.ok(out.workflowError.message.includes(siblingPath), `${label}: and its path`)
  }
})
test('args sibling (D38): a staged copy with no sibling refuses reuse', () => {
  const { dir, argsFile, stagedPath, siblingPath } = d38Stage()
  rmSync(siblingPath)
  rmSync(siblingPath + SIDECAR_SUFFIX)
  const before = readFileSync(stagedPath, 'utf8')
  const r = runStager([TEMPLATE, dir, 'd38-slug', '1'], { expectFail: true })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /loads its args from .* which is missing/)
  assert.match(r.stderr, /--force/)
  assert.match(r.stderr, new RegExp(DISCARD_FLAG))
  assert.equal(r.stdout, '', 'no staged path is printed on refusal')
  assert.equal(readFileSync(stagedPath, 'utf8'), before, 'the staged copy is left byte-untouched')
  runStager([TEMPLATE, dir, 'd38-slug', '1', '--force', '--args', argsFile])
  assert.ok(existsSync(siblingPath), 'a --force restage writes the sibling back')
})
test('args sibling (D38): a sibling with no staged copy is overwritten', async () => {
  const { dir, stagedPath, siblingPath } = d38Stage()
  rmSync(stagedPath)
  rmSync(stagedPath + SIDECAR_SUFFIX)
  writeFileSync(siblingPath, 'export const meta = {}\nreturn { stale: true }\n')
  const fresh = { phase: { id: 'P-FRESH' } }
  runStager([TEMPLATE, dir, 'd38-slug', '1', '--args', writeArgs(scratch('stage-d38-fresh-'), fresh)])
  assert.deepEqual(await argsOf(stagedPath), fresh, 'the orphan sibling is replaced by the fresh stage\'s args')
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

// (p) Comment strip (#2099). The Workflow tool refuses a scriptPath over SCRIPT_BYTE_CAP bytes and the
// shipped template alone crossed it at 0.21.11, so the stager blanks every full-line `//` comment in
// code state. The fixture carries one or more constructs per scanner arm, each followed by a line
// whose expected treatment flips if that arm is deleted, so the whole-file byte compare reds per arm:
//   - string arm: a `//` inside a single-quoted string, a backtick inside one, and an unterminated
//     string (the line-local newline stop);
//   - template arm: a `//` line inside a template literal, inside a nested `${…}` template, and after
//     an escaped backtick (the template escape arm);
//   - interpolation brace depth: a closed plain brace inside a `${…}` body, then a code comment;
//   - regex arm: a `[…]` class holding a `/`, a class holding a `/` and a backtick, an escaped `/`
//     before an escaped backtick, a regex whose `\` sits at the line end (the escape step's newline
//     bound), a keyword-led regex holding a backtick after `{`, and one on a fresh line after a digit
//     (REGEX_AFTER_WORD, and the fresh-word rule);
//   - regex-vs-division tie-break: a division chain, a division followed on the same line by a
//     multi-line template, a postfix `x++` divided before a multi-line template, a regex after a single
//     binary `+` (the postfix conjunct), a property named like a keyword divided before a multi-line
//     template, and the same with whitespace around the dot (the `wordProp` rule, whitespace-blind);
//   - block-comment arm: a block comment holding a `//` line.
// Each arm was deleted in turn and the compare went red (the proof list rides the commit body). The
// branches with no discriminating mutant by construction, and so not fixture arms: the regex flags
// loop (flag letters scanned as code spell no keyword and read as division either way), the
// `lastSig === ''` disjunct (true only at byte 0 of the source), and `src[i - 1]` at i === 0 in the
// fresh-word test (undefined is not a word char, so byte 0 starts a word either way).
const STRIP_FIXTURE = `// header comment
export const meta = { ${NAME_ANCHOR}, description: '${DESCRIPTION_ANCHOR}' }
  // indented code comment
const s = 'a // not a comment\\n' // trailing comment stays
const s2 = 'tick \` inside a string'
// after the backtick-holding string: still code
const t = \`line one
// a line inside a template literal
\${cond ? \`nested
// a line inside a nested template
\` : ''}
\`
const r = /[a-z/]+\\/\\/'"x/g
// after the regex: still code
const r2 = /[\`]/g
// after the backtick-holding regex: still code
const f = () => { return /\`/.test(x) }
// after the keyword-led regex: still code
const d = a / b / c
// after the division: still code
const q = a / b + \`tail
// a line inside a template that follows a division
\`
const s3 = 'unterminated
// after an unterminated string: still code
const ok = 'x'
const rx = /[/\`]/
// after the class-held slash and backtick: still code
const rr = /a\\/\\\`b/
// after the escaped slash and backtick: still code
const pp = x++ / y + \`t
// a line inside a template after a postfix increment
\`
const o = \`x \${ { a: 1 }
// a code comment after a closed brace inside the interpolation
} y\`
const n6 = 6
return /\`/.test(s)
// after a keyword-led regex on a fresh line: still code
const g = o.in / 2 + \`t
// a line inside a template after a property named like a keyword
\`
const bp = a + /[\`]/.test(x)
// after the binary-plus regex: still code
const tb = \`esc \\\` still template
// a line inside a template after an escaped backtick
\`
const le = /a\\
// after a regex whose escape sits at the line end: still code
const g2 = o . of / 2 + \`t
// a line inside a template after a property split from its dot by whitespace
\`
/* block
// a line inside a block comment
*/
// last
`
const STRIP_EXPECTED = `
export const meta = { ${NAME_ANCHOR}, description: '${DESCRIPTION_ANCHOR}' }

const s = 'a // not a comment\\n' // trailing comment stays
const s2 = 'tick \` inside a string'

const t = \`line one
// a line inside a template literal
\${cond ? \`nested
// a line inside a nested template
\` : ''}
\`
const r = /[a-z/]+\\/\\/'"x/g

const r2 = /[\`]/g

const f = () => { return /\`/.test(x) }

const d = a / b / c

const q = a / b + \`tail
// a line inside a template that follows a division
\`
const s3 = 'unterminated

const ok = 'x'
const rx = /[/\`]/

const rr = /a\\/\\\`b/

const pp = x++ / y + \`t
// a line inside a template after a postfix increment
\`
const o = \`x \${ { a: 1 }

} y\`
const n6 = 6
return /\`/.test(s)

const g = o.in / 2 + \`t
// a line inside a template after a property named like a keyword
\`
const bp = a + /[\`]/.test(x)

const tb = \`esc \\\` still template
// a line inside a template after an escaped backtick
\`
const le = /a\\

const g2 = o . of / 2 + \`t
// a line inside a template after a property split from its dot by whitespace
\`
/* block
// a line inside a block comment
*/

`
test('(p) stripFullLineComments blanks only full-line code comments, keeps every string/template/regex/block line and the line count', () => {
  const out = stripFullLineComments(STRIP_FIXTURE)
  assert.equal(out, STRIP_EXPECTED)
  assert.equal(out.split('\n').length, STRIP_FIXTURE.split('\n').length, 'line count is preserved — blanked, never deleted')
  assert.equal(stripFullLineComments(out), out, 'the strip is idempotent — a stripped copy re-stripped is byte-unchanged')
  assert.throws(() => stripFullLineComments('const x = `open template'), /lost track/, 'an unterminated template literal refuses loudly rather than staging a desynced copy')
})

// (p) On the shipped template the strip is proven by three oracles that do not share the scanner
// under test. (1) Line shape: every changed line was a `//`-led line and is now empty, or lost only
// its leading indent (the indent strip; arm (s) holds its own line-for-line oracle). (2) Prompt
// bytes: `ptSpanRanges` (assert-args-complete.mjs — seeded on the pt` tag, its own state machine)
// locates every prompt span in the stripped copy, nested spans included, with each span's `${…}`
// expression bodies; for a blanked line the INNERMOST enclosing span is judged, and the line may not
// fall in that span's prose (a blank inside an expression body is a code comment inside the
// interpolation — legal). An unindented line may not fall inside any span at all. This is what catches a prompt line that begins with `//` and was wrongly
// blanked, which oracle (1) alone would accept. Scope: the oracle proves pt-tagged prompt spans; a
// plain (untagged) template literal is outside it and rests on oracle (1) plus the fixture arms. (3) `node --check` parses the result, and the fallback-free interpolation census the
// args preflight reads is unchanged, occurrence counts included. The staged size must also sit under
// the cap with headroom for what an --args stage adds to the staged copy. The args themselves ride
// the args sibling script (D38, operator ruling 2026-11-09: the staged-template cap is funded by
// moving the embedded args into a sibling args script), so the reserve covers only the one loader
// line and the fallback rewrite, each naming the absolute sibling path once (about 420 bytes plus
// twice the path length): 4 KiB holds a path of well over 1,500 bytes, so a template growth that eats
// the margin reds here before a launch dies at dispatch. History: the reserve held the ~104.5 KB
// over-size args class at 117 KiB, lowered from 119 KiB (#2617 part 2) and from 118 KiB (#2622); the
// D38 ruling dropped it to this prelude reserve, and ADR 0037's 2026-11-09 amendment records why.
const ARGS_HEADROOM_BYTES = 4096
// Oracles (1) and (2), shared by the shipped-template arm and the synthetic negative below. Returns
// { blanked, spans, insideExpr } so each caller can add its own non-vacuity bounds.
function assertStripKeptPromptBytes (original, stripped) {
  const a = original.split('\n')
  const b = stripped.split('\n')
  assert.equal(b.length, a.length, 'line count preserved')
  const blanked = [] // 1-based line numbers
  const unindented = [] // 1-based: lines that lost only their leading indent (the indent strip, arm (s))
  for (let k = 0; k < a.length; k++) {
    if (a[k] === b[k]) continue
    if (a[k].trim().startsWith('//') && b[k] === '') { blanked.push(k + 1); continue }
    assert.ok(b[k] === a[k].replace(/^[ \t]+/, ''), `line ${k + 1}: a non-comment line changed beyond its leading indent: ${JSON.stringify(a[k].slice(0, 80))} → ${JSON.stringify(b[k].slice(0, 80))}`)
    unindented.push(k + 1)
  }
  assert.ok(!/\/\/[^\n]*\bpt`/.test(stripped), 'no comment-seeded pt` byte-run survives the strip, so ptSpanRanges reads real prompt spans only')
  const lineStarts = [0]
  for (let i = 0; i < stripped.length; i++) if (stripped[i] === '\n') lineStarts.push(i + 1)
  const lineOf = (offset) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= offset) lo = mid; else hi = mid - 1 } return lo + 1 }
  const spans = ptSpanRanges(stripped, { nested: true }).map(({ start, end, exprs }) => ({
    start, end, lo: lineOf(start), hi: lineOf(end - 1), exprs: exprs.map(([x, y]) => [lineOf(x), lineOf(y - 1)]),
  }))
  const inExpr = (sp, k) => sp.exprs.some(([x, y]) => k >= x && k <= y)
  for (const k of unindented) {
    const hit = spans.find((sp) => k > sp.lo && k <= sp.hi)
    assert.ok(!hit, `line ${k} lost its indent inside the pt prompt span on lines ${hit && hit.lo}-${hit && hit.hi} — the strip touched a span's bytes`)
  }
  let insideExpr = 0
  for (const k of blanked) {
    const hit = spans.filter((sp) => k > sp.lo && k <= sp.hi).sort((a, b) => (a.end - a.start) - (b.end - b.start))[0] // innermost
    if (!hit) continue
    assert.ok(inExpr(hit, k), `line ${k} was blanked inside the prose of the pt prompt span on lines ${hit.lo}-${hit.hi} — the strip touched dispatched prompt bytes`)
    insideExpr++
  }
  return { blanked, spans, insideExpr }
}

// The oracle's own negative: a multi-line pt span whose prose line begins with `//` (a bash comment
// inside a dispatched prompt), and a copy in which that line was blanked — exactly the failure the
// per-line shape check accepts. The oracle must refuse it, and must accept the same span when the
// blanked line sits inside a `${…}` expression instead. Red: drop the prose check and both pass.
test('(p) the prompt-byte oracle refuses a blanked `//` line inside prompt prose and accepts one inside an interpolation expression', () => {
  const prose = 'const x = 1\nconst p = pt`run this:\n// not a comment, a prompt line\ndone ${a}`\n'
  assert.throws(() => assertStripKeptPromptBytes(prose, prose.replace('// not a comment, a prompt line', '')), /inside the prose of the pt prompt span/)
  const expr = 'const p = pt`items: ${list.map(t =>\n  // a code comment inside the interpolation\n  t.id).join(\', \')}`\n'
  const { insideExpr } = assertStripKeptPromptBytes(expr, expr.replace('  // a code comment inside the interpolation', ''))
  assert.equal(insideExpr, 1)
  const inner = 'const p = pt`a ${c ? pt`b\n// inner prose, inside the outer span\'s expression\n` : \'\'} d`\n'
  assert.throws(() => assertStripKeptPromptBytes(inner, inner.replace('// inner prose, inside the outer span\'s expression', '')), /inside the prose of the pt prompt span/, 'a nested span\'s prose is judged by the innermost span, not excused as the outer span\'s expression')
  const indentedProse = 'const p = pt`run this:\n  an indented prompt line ${a}`\n'
  assert.throws(() => assertStripKeptPromptBytes(indentedProse, indentedProse.replace('\n  an indented', '\nan indented')), /lost its indent inside the pt prompt span/, 'an unindented line inside a span is refused')
  assert.equal(stripFullLineComments(indentedProse), indentedProse, 'and the real strip keeps the indented prompt line')
  assert.equal(stripFullLineComments(prose), prose, 'and the real strip leaves the prose line alone')
  assert.equal(stripFullLineComments(inner), inner, 'and the real strip leaves the nested prose line alone')
})

test('(p) shipped template: only `//`-led lines blank, no prompt byte moves, the copy parses, the census holds, headroom stays', () => {
  const original = readFileSync(TEMPLATE, 'utf8')
  const stripped = stripFullLineComments(original)
  const { blanked, spans, insideExpr } = assertStripKeptPromptBytes(original, stripped)
  assert.ok(blanked.length > 1000, `non-vacuity: the shipped template carries >1000 full-line comments, blanked ${blanked.length}`)
  assert.ok(spans.length > 300, `non-vacuity: the shipped template carries >300 pt spans, found ${spans.length}`)
  assert.ok(insideExpr > 0, 'non-vacuity: the shipped template carries code comments inside prompt interpolations, so the expression carve-out is exercised')

  const dir = scratch('stage-strip-check-')
  const strippedPath = join(dir, 'stripped.js')
  writeFileSync(strippedPath, stripped)
  const check = spawnSync(process.execPath, ['--check', strippedPath], { encoding: 'utf8' })
  assert.equal(check.status, 0, `the stripped template must still parse: ${check.stderr}`)
  assert.deepEqual([...extractInterpolations(stripped)], [...extractInterpolations(original)], 'the fallback-free interpolation census, with occurrence counts, is unchanged by the strip')
  const bytes = Buffer.byteLength(stripped, 'utf8')
  assert.ok(bytes + ARGS_HEADROOM_BYTES <= SCRIPT_BYTE_CAP, `stripped template is ${bytes} bytes; it must leave at least ${ARGS_HEADROOM_BYTES} bytes under the ${SCRIPT_BYTE_CAP}-byte cap for the args loader prelude`)
})

// (s) Indent strip (plan 2026-11-04-late-defects-fixed-in-run, Task 1.1; PIN-16, PIN-17, PIN-18,
// PIN-26). The strip also drops the leading spaces and tabs of every line that STARTS in the top-level
// code frame; a line that starts inside a string continuation, a template literal, a `${…}` body or a
// block comment keeps every byte, and every line survives. Four independent oracles prove it on the
// shipped template: (a) the line-for-line oracle, judged by lineStartFrames below (its own state
// machine, not the scanner under test); (b) the prompt-byte oracle over every pt span (ptSpanRanges,
// a third state machine) and every plain template literal (lineStartFrames' blocks); (c) idempotence
// and `node --check`; (d) the harness row, which runs workflow-template.test-harness.mjs under
// WAR_TEMPLATE_STRIPPED=1 and proves the bytes it executes are the staged ones. Each shipped-template
// row first asserts the strip removed indent at all (stripRemovedIndent), so every row is red on a
// scanner that strips no indent. The fixture arms carry hand-written expected bytes, one arm per
// scanner branch, and each `indent-strip: mutant <branch>` row edits the exported scanner's source in
// memory, loads it, and proves its arm's oracle fails while the unmutated copy passes it.

// lineStartFrames(text): the frame each line STARTS in — 'top' (top-level code), 'interp' (code in a
// `${…}` body), 'template', 'string' (a `\`-continued string) or 'block' (a block comment) — plus the
// [start, end) offsets of every top-level template literal (a nested literal rides inside its
// enclosing one). Built on the comment, string and template arms of extractTopLevelTemplateLiterals in
// prompt-surface-budgets.test.mjs, which is proven clean on the shipped template there. Like that
// scanner it has no regex arm, so it judges the shipped template only; the fixture arms below hold
// regex literals and are judged by their hand-written expected bytes instead.
function lineStartFrames (text) {
  const frames = ['top']
  const blocks = []
  const stack = [{ t: 'code', depth: 0 }]
  let mode = '' // '' | 'line' | 'block' | "'" | '"'
  let open = -1
  const now = () => mode === 'block' ? 'block' : mode === "'" || mode === '"' ? 'string'
    : stack[stack.length - 1].t === 'tpl' ? 'template' : stack.length === 1 ? 'top' : 'interp'
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const top = stack[stack.length - 1]
    if (mode === 'line') { if (c === '\n') { mode = ''; frames.push(now()) } continue }
    if (mode === 'block') {
      if (c === '*' && text[i + 1] === '/') { mode = ''; i++ } else if (c === '\n') frames.push(now())
      continue
    }
    if (mode) { // inside a ' or " string
      if (c === '\\') { i++; if (text[i] === '\n') frames.push(now()); continue }
      if (c === mode) mode = ''
      else if (c === '\n') { mode = ''; frames.push(now()) }
      continue
    }
    if (top.t === 'tpl') {
      if (c === '\\') { i++; if (text[i] === '\n') frames.push(now()); continue }
      if (c === '`') { stack.pop(); if (stack.length === 1) blocks.push([open, i + 1]); continue }
      if (c === '$' && text[i + 1] === '{') { stack.push({ t: 'code', depth: 0 }); i++; continue }
      if (c === '\n') frames.push(now())
      continue
    }
    if (c === '\n') { frames.push(now()); continue }
    if (c === '/' && text[i + 1] === '/') { mode = 'line'; i++; continue }
    if (c === '/' && text[i + 1] === '*') { mode = 'block'; i++; continue }
    if (c === "'" || c === '"') { mode = c; continue }
    if (c === '`') { if (stack.length === 1) open = i; stack.push({ t: 'tpl' }); continue }
    if (stack.length > 1) {
      if (c === '{') top.depth++
      else if (c === '}') { if (top.depth === 0) stack.pop(); else top.depth-- }
    }
  }
  return { frames, blocks, clean: stack.length === 1 && (mode === '' || mode === 'line') }
}

// The leading-whitespace bytes the strip removed from lines it did not blank. Zero on a scanner that
// strips no indent, so a shipped-template row that asserts it is red there.
const stripRemovedIndent = (original, stripped) => {
  const a = original.split('\n')
  const b = stripped.split('\n')
  let bytes = 0
  for (let k = 0; k < a.length; k++) if (b[k] !== '' && a[k] !== b[k]) bytes += a[k].length - b[k].length
  return bytes
}

// Oracle (a), line for line: an unchanged line is fine unless it starts in the top-level code frame
// with leading whitespace (the strip missed it); a blanked line was `//`-led and starts in code; any
// other changed line equals its original with only its leading spaces and tabs removed, and starts in
// the top-level code frame. The frames are also identical on both copies.
function assertIndentOracle (original, stripped) {
  const a = original.split('\n')
  const b = stripped.split('\n')
  assert.equal(b.length, a.length, 'every line survives the strip (PIN-17)')
  const fa = lineStartFrames(original)
  const fb = lineStartFrames(stripped)
  assert.ok(fa.clean && fb.clean, 'the frame scan stays in sync on both copies')
  assert.equal(fa.frames.length, a.length, 'one frame per line')
  assert.deepEqual(fb.frames, fa.frames, 'every line starts in the same frame before and after the strip')
  let indented = 0
  for (let k = 0; k < a.length; k++) {
    const at = `line ${k + 1} (${fa.frames[k]})`
    if (a[k] === b[k]) {
      assert.ok(fa.frames[k] !== 'top' || !/^[ \t]/.test(a[k]), `${at}: a top-level code line kept its leading indent: ${JSON.stringify(a[k].slice(0, 80))}`)
      continue
    }
    if (b[k] === '' && /^[ \t]*\/\//.test(a[k])) {
      assert.ok(fa.frames[k] === 'top' || fa.frames[k] === 'interp', `${at}: a \`//\`-led line was blanked outside code`)
      continue
    }
    assert.equal(b[k], a[k].replace(/^[ \t]+/, ''), `${at}: changed beyond its leading whitespace`)
    assert.equal(fa.frames[k], 'top', `${at}: lost its indent outside the top-level code frame: ${JSON.stringify(a[k].slice(0, 80))}`)
    indented++
  }
  return { indented }
}

// Oracle (b), literal bytes: every pt span (ptSpanRanges, nested spans included) and every top-level
// template literal (lineStartFrames' blocks — so every plain literal and every literal nested in one)
// keeps its bytes. From its opener to the end of its first line, and on every later line it spans,
// nothing changes; the one exception is a `//`-led line inside a `${…}` body, which the comment strip
// blanks (a code comment, never prompt prose). For a pt span the body is judged by ptSpanRanges' own
// expression offsets; for a template literal by the frame lineStartFrames reports.
function assertLiteralBytesKept (original, stripped) {
  const a = original.split('\n')
  const b = stripped.split('\n')
  assert.equal(b.length, a.length, 'every line survives the strip (PIN-17)')
  const starts = [0]
  for (let i = 0; i < stripped.length; i++) if (stripped[i] === '\n') starts.push(i + 1)
  const lineAt = (off) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= off) lo = mid; else hi = mid - 1 } return lo }
  const commentBlank = (k) => b[k] === '' && /^[ \t]*\/\//.test(a[k])
  const keep = (start, end, label, inBody) => {
    const l0 = lineAt(start)
    const l1 = lineAt(end - 1)
    const c0 = start - starts[l0]
    const shift = a[l0].length - b[l0].length
    assert.equal(b[l0].slice(c0), a[l0].slice(c0 + shift), `${label} (line ${l0 + 1}): a byte moved on the opening line`)
    for (let k = l0 + 1; k <= l1; k++) {
      if (a[k] === b[k]) continue
      assert.ok(commentBlank(k) && inBody(k), `${label}: line ${k + 1} changed inside the literal: ${JSON.stringify(a[k].slice(0, 80))} → ${JSON.stringify(b[k].slice(0, 80))}`)
    }
  }
  assert.ok(!/\/\/[^\n]*\bpt`/.test(stripped), 'no comment-seeded pt` byte-run survives the strip, so ptSpanRanges reads real prompt spans only')
  const spans = ptSpanRanges(stripped, { nested: true })
  for (const sp of spans) keep(sp.start, sp.end, `pt span at line ${lineAt(sp.start) + 1}`, (k) => sp.exprs.some(([x, y]) => starts[k] > x && starts[k] < y))
  const { frames, blocks, clean } = lineStartFrames(stripped)
  assert.ok(clean, 'the template-literal scan stays in sync on the stripped copy')
  for (const [s, e] of blocks) keep(s, e, `template literal at line ${lineAt(s) + 1}`, (k) => frames[k] === 'interp')
  const plain = blocks.filter(([s]) => !/\bpt$/.test(stripped.slice(Math.max(0, s - 3), s)))
  return { spans: spans.length, blocks: blocks.length, plain: plain.length }
}

// Fixture arms, one per scanner branch. Each holds a line the strip must keep whole and a top-level
// line it must unindent, so the arm reds both on a scanner that strips no indent and on a scanner
// whose branch is broken.
const L = (...lines) => lines.join('\n') + '\n'
const INDENT_ARMS = {
  'single string': [
    L("const a = 'one ` tick'", '  foo()', "const b = 'two ` tick'", '  bar()'),
    L("const a = 'one ` tick'", 'foo()', "const b = 'two ` tick'", 'bar()')],
  'double string': [
    L('const a = "one ` tick"', '  foo()', 'const b = "two ` tick"', '  bar()'),
    L('const a = "one ` tick"', 'foo()', 'const b = "two ` tick"', 'bar()')],
  'backslash continuation': [
    L("const s = 'one \\", "  two'", '  after()'),
    L("const s = 'one \\", "  two'", 'after()')],
  'template literal': [
    L('const t = `one', '  two', '`', '  after()'),
    L('const t = `one', '  two', '`', 'after()')],
  'nested template': [
    L('const t = `a ${x ? `nested', '// a line inside a nested template', '  indented nested', "` : ''} b`", '  after()'),
    L('const t = `a ${x ? `nested', '// a line inside a nested template', '  indented nested', "` : ''} b`", 'after()')],
  'regex literal with a backtick': [
    L('const r = /[`]/g', '  after()', 'const r2 = /[`]/g', '  end()'),
    L('const r = /[`]/g', 'after()', 'const r2 = /[`]/g', 'end()')],
  'block comment with a backtick': [
    L('/* a ` tick', '  inside block', '*/', '  after()'),
    L('/* a ` tick', '  inside block', '*/', 'after()')],
  'line comment inside a template': [
    L('const t = `x', '// a line inside a template', '  indented', '`', '  after()'),
    L('const t = `x', '// a line inside a template', '  indented', '`', 'after()')],
  'interp frame': [
    L('const t = `a ${ { k: 1 }', '  .k } b`', '\t  after()'),
    L('const t = `a ${ { k: 1 }', '  .k } b`', 'after()')],
}
// The arm oracle: the strip's output equals the hand-written bytes, line count included.
const checkArm = (strip, [input, expected]) => {
  const out = strip(input)
  assert.equal(out.split('\n').length, input.split('\n').length, 'every line survives the strip (PIN-17)')
  assert.equal(out, expected)
}
for (const [branch, arm] of Object.entries(INDENT_ARMS)) {
  test(`indent-strip: fixture ${branch}`, () => {
    checkArm(stripFullLineComments, arm)
    assert.equal(stripFullLineComments(arm[1]), arm[1], 'the expected bytes are a fixed point of the strip')
  })
}

// Mutants (PIN-26): each row edits the exported scanner's source text at one anchor (exactly once),
// loads the edited copy in memory with new Function, and proves its arm's oracle fails, while the
// unedited copy, loaded the same way, passes it. Branch → [arm, anchor, replacement].
const STAGER_SRC = readFileSync(STAGER, 'utf8')
const loadScanner = (moduleText) => {
  const s = moduleText.indexOf('const REGEX_AFTER_WORD')
  const f = moduleText.indexOf('export function stripFullLineComments(')
  const e = moduleText.indexOf('\n}\n', f)
  assert.ok(s !== -1 && f > s && e > f, 'the scanner and its two constants are locatable in stage-workflow.mjs')
  return new Function(moduleText.slice(s, e + 2).replace('export function', 'function') + '\nreturn stripFullLineComments')()
}
const INDENT_MUTANTS = {
  'single string': ['single string', `c === "'" || c === '"'`, `c === '"'`],
  'double string': ['double string', `c === "'" || c === '"'`, `c === "'"`],
  'backslash continuation': ['backslash continuation', String.raw`if (src[j] === '\\') j++`, ''],
  'template literal': ['template literal', "stack.push({ type: 'template' })", ''],
  'nested template': ['nested template', "if (c === '`') {\n        stack.push", "if (c === '`' && !ctx.interp) {\n        stack.push"],
  'regex literal with a backtick': ['regex literal with a backtick', "if (c === '/' && (lastSig === ''", "if (false && c === '/' && (lastSig === ''"],
  'block comment with a backtick': ['block comment with a backtick', "if (c === '/' && c2 === '*') {", 'if (false) {'],
  'line comment inside a template': ['line comment inside a template', String.raw`if (c === '\\') { i += 2; continue }`,
    String.raw`if (c === '/' && c2 === '/' && src.slice(src.lastIndexOf('\n', i - 1) + 1, i).trim() === '') { const e = src.indexOf('\n', i); drop.push([src.lastIndexOf('\n', i - 1) + 1, e === -1 ? n : e]); i = e === -1 ? n : e; continue }
    if (c === '\\') { i += 2; continue }`],
  'interp frame': ['interp frame', 'stack.length === 1 && ', ''],
}
for (const [branch, [armName, anchor, replacement]] of Object.entries(INDENT_MUTANTS)) {
  test(`indent-strip: mutant ${branch}`, () => {
    const arm = INDENT_ARMS[armName]
    checkArm(loadScanner(STAGER_SRC), arm)
    assert.equal(STAGER_SRC.split(anchor).length - 1, 1, `the mutation anchor occurs exactly once in stage-workflow.mjs: ${anchor}`)
    const mutant = loadScanner(STAGER_SRC.split(anchor).join(replacement))
    assert.throws(() => checkArm(mutant, arm), assert.AssertionError, `the ${branch} mutant must fail its arm's oracle`)
  })
}

const SHIPPED = readFileSync(TEMPLATE, 'utf8')
const shippedStripped = () => {
  const stripped = stripFullLineComments(SHIPPED)
  const removed = stripRemovedIndent(SHIPPED, stripped)
  assert.ok(removed > 10000, `non-vacuity: the strip removed ${removed} bytes of leading indent from the shipped template's code lines`)
  return stripped
}
test('indent-strip: line-for-line oracle on the shipped template', () => {
  const { indented } = assertIndentOracle(SHIPPED, shippedStripped())
  assert.ok(indented > 3000, `non-vacuity: ${indented} code lines lost their indent`)
})
test('indent-strip: prompt-byte oracle over every pt span and every plain template literal', () => {
  const { spans, blocks, plain } = assertLiteralBytesKept(SHIPPED, shippedStripped())
  assert.ok(spans > 300, `non-vacuity: ${spans} pt spans judged`)
  assert.ok(blocks > 300 && plain > 20, `non-vacuity: ${blocks} template literals judged, ${plain} of them untagged`)
})
test('indent-strip: idempotent on the shipped template and every fixture arm', () => {
  const stripped = shippedStripped()
  assert.equal(stripFullLineComments(stripped), stripped, 'strip(strip(x)) === strip(x) on the shipped template')
  for (const [input] of Object.values(INDENT_ARMS)) assert.equal(stripFullLineComments(stripFullLineComments(input)), stripFullLineComments(input))
})
test('indent-strip: node --check parses the staged form', () => {
  const p = join(scratch('stage-indent-check-'), 'stripped.js')
  writeFileSync(p, shippedStripped())
  const check = spawnSync(process.execPath, ['--check', p], { encoding: 'utf8' })
  assert.equal(check.status, 0, `the indent-stripped template must parse: ${check.stderr}`)
})
test('indent-strip: the fallback-free interpolation census is unchanged', () => {
  const census = [...extractInterpolations(shippedStripped())]
  assert.ok(census.length > 50, `non-vacuity: ${census.length} interpolation chains`)
  assert.deepEqual(census, [...extractInterpolations(SHIPPED)], 'occurrence counts included')
})
// The args preflight (`assert-args-complete.mjs --template <staged path>`) reads top-level bindings by
// their column-0 position, and the indent strip moves every top-level-frame line to column 0. On a
// template holding an indented function-local `const z = A.zz`, the stripped copy would bind a field
// the raw template never binds — the fixture below is that template, and it must fail this oracle.
const assertArgsFieldCensusUnchanged = (original) => {
  const stripped = stripFullLineComments(original)
  assert.deepEqual([...unguardedTopLevelKeys(stripped)], [...unguardedTopLevelKeys(original)], 'the column-0 top-level binding set is unchanged on the staged form')
  assert.deepEqual(extractArgsFields(stripped), extractArgsFields(original), 'the args preflight field set is unchanged on the staged form')
}
test('indent-strip: the args-field census is unchanged', () => {
  shippedStripped() // non-vacuity: the strip removed indent from the shipped template at all
  assert.ok(unguardedTopLevelKeys(SHIPPED).size > 5 && extractArgsFields(SHIPPED).length > 10, 'non-vacuity: the shipped template binds args fields')
  assertArgsFieldCensusUnchanged(SHIPPED)
  const indentedLocal = 'const A = args\nconst p = A.planSlug\nfunction f () {\n  const z = A.zz\n  return pt`${p} ${z}`\n}\n'
  assert.deepEqual(extractArgsFields(indentedLocal), ['planSlug'], 'the raw fixture binds only the column-0 field')
  assert.deepEqual(extractArgsFields(stripFullLineComments(indentedLocal)), ['planSlug', 'zz'], 'the stripped fixture binds the function-local field too')
  assert.throws(() => assertArgsFieldCensusUnchanged(indentedLocal), /binding set is unchanged/, 'an indented function-local `const z = A.zz` is refused')
})
test('indent-strip: NAME_ANCHOR and ARGS_FALLBACK_ANCHOR substitute on the staged form', () => {
  const dir = scratch('stage-indent-anchor-')
  const slug = 'indent-anchor'
  const { stdout } = runStager([TEMPLATE, dir, slug, '1', '--args', writeArgs(dir, { k: 1 })])
  const stagedPath = stdout.trim()
  const staged = readFileSync(stagedPath, 'utf8')
  const stripped = shippedStripped()
  assert.equal(staged.split('\n').length, SHIPPED.split('\n').length + 1, 'only the one loader line is added')
  assert.match(staged, new RegExp(`\\nname: '${deriveName(slug, '1')}',\\n`), 'the name substitution lands on the unindented meta line')
  assert.equal(staged.split(`\n})() ${argsFallbackRewrite(argsSiblingPath(stagedPath))}\n`).length - 1, 1, 'the args fallback is rewritten exactly once, on its column-0 line')
  const restored = restoreArgs(staged
    .split(`name: '${deriveName(slug, '1')}'`).join(NAME_ANCHOR)
    .split(deriveDescription(slug, '1')).join(DESCRIPTION_ANCHOR), stagedPath)
  assert.equal(restored, stripped, 'reversing the substitutions restores the indent-stripped template')
})
test('indent-strip: the oracles refuse a synthetic corruption', () => {
  const code = 'const t = `one\n  kept\n`\nconst p = pt`a\n  prose ${x}`\n  f()\n'
  const good = 'const t = `one\n  kept\n`\nconst p = pt`a\n  prose ${x}`\nf()\n'
  assert.equal(stripFullLineComments(code), good, 'the real strip produces the copy both oracles accept')
  assertIndentOracle(code, good)
  assertLiteralBytesKept(code, good)
  assert.throws(() => assertIndentOracle(code, good.replace('\n  kept', '\nkept')), /outside the top-level code frame/, 'an unindented template line is refused')
  assert.throws(() => assertIndentOracle(code, code), /kept its leading indent/, 'a top-level line left indented is refused')
  assert.throws(() => assertIndentOracle(code, good.replace('f()', 'g()')), /beyond its leading whitespace/, 'a change past the indent is refused')
  assert.throws(() => assertLiteralBytesKept(code, good.replace('\n  kept', '\nkept')), /changed inside the literal/, 'a plain template literal line is refused')
  assert.throws(() => assertLiteralBytesKept(code, good.replace('\n  prose', '\nprose')), /changed inside the literal/, 'a pt span prose line is refused')
})

// (d) The harness row. A child process imports workflow-template.test-harness.mjs with and without
// WAR_TEMPLATE_STRIPPED=1 and reports what `build()` compiles. With the flag the compiled body is the
// staged bytes (the stager's own output with its substitutions reversed), not the raw template, and
// a mutated source a fixture passes is staged too; without it the body is the raw template. The
// exported `src` stays raw either way, for the source-reading tests.
const HARNESS = join(HERE, 'workflow-template.test-harness.mjs')
const probeHarness = (flag) => {
  const code = `const h = await import(${JSON.stringify(pathToFileURL(HARNESS).href)})
const { stripFullLineComments } = await import(${JSON.stringify(pathToFileURL(STAGER).href)})
const { readFileSync } = await import('node:fs')
const raw = readFileSync(${JSON.stringify(TEMPLATE)}, 'utf8').replace(/^export const meta/m, 'const meta')
const body = h.build().toString()
const mutated = h.src + '\\n;void 0\\n'
process.stdout.write('\\nPROBE ' + JSON.stringify({ srcRaw: h.src === raw, raw: body.includes(h.src), staged: body.includes(stripFullLineComments(h.src)), mutatedStaged: h.build(mutated).toString().includes(stripFullLineComments(mutated)), body }) + '\\n')`
  const env = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  if (flag) env.WAR_TEMPLATE_STRIPPED = '1'; else delete env.WAR_TEMPLATE_STRIPPED
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', env, maxBuffer: 1 << 26 })
  assert.equal(r.status, 0, r.stderr)
  return JSON.parse(r.stdout.split('\nPROBE ').pop())
}
// The compile-site census over the harness source. The probe above proves build() alone; the other
// sites that compile a `src`-derived slice (inlineHelpers, makeDispatch, registrySlice, grabSchema,
// mergeResultSchema) are proven by text: each site is a `new Function(` / `new AsyncFunction(` call,
// named by the column-0 declaration that encloses it, and read from the call to the next blank line
// (makeDispatch's runForm calls sit on the lines after its opener). A site outside the exempt list
// must wrap runForm; an exempt site must not, so the list cannot go stale silently. The two exempt
// sites evaluate a pt literal, whose bytes oracle (b) proves the strip never moves. The same window
// rule runs over every sibling workflow-template.*.test.mjs file: a test-local compile of a
// src-derived slice (an engine slice, an extracted arrow, a regex literal) imports runForm from the
// harness and wraps it, so under the flag it runs the staged form too. No test-local site evaluates a
// pt literal, so that census has no exempt list, and a site is named by file and line.
const HARNESS_COMPILE_EXEMPT = {
  evalPt: 'a pt literal whose bytes oracle (b) proves invariant',
  evalTemplateConst: 'a pt literal whose bytes oracle (b) proves invariant',
}
const compileSiteWindows = (text) => {
  const sites = []
  const re = /new (?:Async)?Function\(/g
  let m
  while ((m = re.exec(text))) {
    const stop = text.indexOf('\n\n', m.index)
    const next = text.slice(re.lastIndex).search(/new (?:Async)?Function\(/)
    const ends = [stop, next === -1 ? -1 : re.lastIndex + next, text.length].filter((e) => e !== -1)
    sites.push({ index: m.index, line: text.slice(0, m.index).split('\n').length, window: text.slice(m.index, Math.min(...ends)) })
  }
  return sites
}
const harnessCompileSites = (text) => compileSiteWindows(text).map(({ index, window }) => {
  const decl = [...text.slice(0, index).matchAll(/^(?:const|let|function) ([A-Za-z_$][\w$]*)/gm)].pop()
  assert.ok(decl, `a compile site at offset ${index} sits under a column-0 declaration`)
  return { name: decl[1], window }
})
const TEST_FILE_RE = /^workflow-template\..*\.test\.mjs$/
const testFileTexts = () => readdirSync(HERE).filter((f) => TEST_FILE_RE.test(f)).sort().map((f) => [f, readFileSync(join(HERE, f), 'utf8')])
const assertTestFilesCompileStaged = (texts) => {
  let seen = 0
  for (const [file, text] of texts) {
    for (const { line, window } of compileSiteWindows(text)) {
      seen++
      assert.ok(window.includes('runForm('), `${file}:${line} compiles a src-derived slice and must wrap it in runForm(...)`)
    }
  }
  return seen
}
const assertHarnessCompilesStaged = (text) => {
  const sites = harnessCompileSites(text)
  assert.deepEqual(sites.map((s) => s.name).sort(), ['build', 'evalPt', 'evalTemplateConst', 'grabSchema', 'inlineHelpers', 'makeDispatch', 'mergeResultSchema', 'registrySlice'], 'the harness compile-site census is closed: a new site wraps runForm or joins HARNESS_COMPILE_EXEMPT')
  for (const { name, window } of sites) {
    const wraps = window.includes('runForm(')
    if (name in HARNESS_COMPILE_EXEMPT) assert.ok(!wraps, `${name} is exempt (${HARNESS_COMPILE_EXEMPT[name]}) and compiles the raw slice`)
    else assert.ok(wraps, `${name} compiles a src-derived slice and must wrap it in runForm(...)`)
  }
}
test('indent-strip: harness runs the staged form', () => {
  const harnessText = readFileSync(HARNESS, 'utf8')
  assertHarnessCompilesStaged(harnessText)
  // Red proofs, one per window shape: build's call sits on the opener line; makeDispatch's calls sit
  // on the lines after its opener, so both are dropped to prove the window reads past that line.
  for (const [site, calls] of [['build', ['runForm(source)']], ['makeDispatch', ['${runForm(semBlock)}', '${runForm(dispatchBlock)}']]]) {
    let dropped = harnessText
    for (const call of calls) {
      assert.equal(harnessText.split(call).length - 1, 1, `the mutation anchor occurs exactly once in the harness: ${call}`)
      dropped = dropped.replace(call, call.replace(/runForm\((\w+)\)/, '$1'))
    }
    assert.throws(() => assertHarnessCompilesStaged(dropped), new RegExp(`${site} compiles a src-derived slice`), `dropping ${site}'s runForm calls reds the census`)
  }
  // The test-file census: every site wraps, the census is non-vacuous, and each test file with a site
  // imports runForm. Red proofs, both window shapes: the first site whose runForm sits on the opener
  // line and the first whose runForm sits on a later line each lose their wrapper.
  const texts = testFileTexts()
  assert.ok(assertTestFilesCompileStaged(texts) > 0, 'non-vacuity: at least one test-file-local compile site exists')
  for (const [file, text] of texts) {
    if (compileSiteWindows(text).length) assert.match(text, /^  runForm,$/m, `${file} imports runForm from the harness`)
  }
  const shapes = { opener: null, later: null }
  for (const [file, text] of texts) {
    for (const site of compileSiteWindows(text)) {
      const at = site.window.indexOf('runForm(')
      const shape = site.window.slice(0, at).includes('\n') ? 'later' : 'opener'
      if (!shapes[shape]) shapes[shape] = { file, text, site }
    }
  }
  for (const [shape, hit] of Object.entries(shapes)) {
    assert.ok(hit, `a test-file-local site with runForm on the ${shape} line exists for the red proof`)
    const { file, text, site } = hit
    const dropped = text.slice(0, site.index) + site.window.replace('runForm(', '(') + text.slice(site.index + site.window.length)
    assert.throws(() => assertTestFilesCompileStaged([[file, dropped]]), new RegExp(`${file.replace(/\./g, '\\.')}:${site.line} compiles a src-derived slice`), `dropping the ${shape}-line runForm at ${file}:${site.line} reds the census`)
  }
  const on = probeHarness(true)
  assert.ok(on.srcRaw, 'the exported src stays the raw template for source-reading tests')
  assert.ok(on.staged && !on.raw, 'under the flag build() compiles the staged form, not the raw template')
  assert.ok(on.mutatedStaged, 'under the flag a fixture-mutated source is staged before it runs')
  const dir = scratch('stage-indent-harness-')
  const slug = 'harness-probe'
  const staged = readFileSync(runStager([TEMPLATE, dir, slug, '1']).stdout.trim(), 'utf8')
    .split(`name: '${deriveName(slug, '1')}'`).join(NAME_ANCHOR)
    .split(deriveDescription(slug, '1')).join(DESCRIPTION_ANCHOR)
    .replace(/^export const meta/m, 'const meta')
  assert.ok(stripRemovedIndent(SHIPPED, staged) > 10000, 'non-vacuity: the stager output is indent-stripped')
  assert.ok(on.body.includes(staged), 'the executed bytes are the stager\'s staged bytes')
  const off = probeHarness(false)
  assert.ok(off.raw && !off.staged, 'without the flag build() compiles the raw template')
})

// The closed census of workflow-template tests that cannot pass on the staged form and so skip under
// WAR_TEMPLATE_STRIPPED=1. It is EMPTY: every such test passes on the staged form, because `src`
// stays raw for the source-reading tests and only execution runs staged. The row is default-deny on
// two signals: the flag may be read in exactly one place (the harness's STAGED_RUN line), and no
// `{ skip:` option or `.skip(` call may sit within SKIP_WINDOW lines of a `runForm` or `STAGED_RUN` read
// (a skip keyed on `runForm(src) !== src` names no flag). A test that starts skipping on either
// signal reds here until it joins this census with its own `indent-strip: census …` row. The skip
// scan is a helper over `[file, lines]` pairs, so its red proofs run on synthetic sources: at the
// pin no live test file carries a `.skip(` or `{ skip:` at all, and the live assertion alone is a
// match against an empty result.
const STAGED_SKIP_CENSUS = []
const SKIP_WINDOW = 3
const skipsNearStaged = (sources) => sources.flatMap(([f, lines]) => lines.flatMap((line, i) =>
  (/\{\s*skip\s*:|\.skip\(/.test(line) && lines.slice(Math.max(0, i - SKIP_WINDOW), i + SKIP_WINDOW + 1).some((l) => /runForm|STAGED_RUN/.test(l))) ? [`${f}:${i + 1}: ${line.trim()}`] : []))
test('indent-strip: census of tests skipped on the staged form is closed', () => {
  const files = readdirSync(HERE).filter((f) => /^workflow-template\..+\.test\.mjs$/.test(f) || f === 'workflow-template.test-harness.mjs').sort()
  assert.ok(files.length > 10, `non-vacuity: ${files.length} template test files scanned`)
  const sources = files.map((f) => [f, readFileSync(join(HERE, f), 'utf8').split('\n')])
  const reads = sources.flatMap(([f, lines]) => lines.filter((line) => line.includes('WAR_TEMPLATE_STRIPPED') && !/^\s*\/\//.test(line)).map((line) => `${f}: ${line.trim()}`))
  assert.deepEqual(reads, ["workflow-template.test-harness.mjs: const STAGED_RUN = process.env.WAR_TEMPLATE_STRIPPED === '1'"], 'the flag is read only by the harness switch, so no test skips under it')
  assert.deepEqual(skipsNearStaged(sources), [], `no \`{ skip:\` or \`.skip(\` sits within ${SKIP_WINDOW} lines of a runForm or STAGED_RUN read, so no test skips on another staged-form signal`)
  assert.deepEqual(STAGED_SKIP_CENSUS, [], 'no test is skipped on the staged form')
})
// Red proofs for the skip scan on synthetic sources, one per arm the scan branches on: the `{ skip:`
// option beside a STAGED_RUN read, the `.skip(` call under a runForm call at the window's last line
// and one line past it (the boundary, zero hits), the same pair with the runForm call under the skip
// (the window reads both ways), a skip with no signal near it (zero hits, so the skip pattern alone
// is not a hit), and a signal with no skip near it (zero hits).
test('indent-strip: skip-signal scan lists a skip near a staged-form signal and nothing past the window', () => {
  const pad = (n) => Array.from({ length: n }, (_, k) => `  const pad${k} = ${k}`)
  const optionSkip = ['f.mjs', ["test('x', { skip: STAGED_RUN }, () => {})"]]
  assert.deepEqual(skipsNearStaged([optionSkip]), ["f.mjs:1: test('x', { skip: STAGED_RUN }, () => {})"], 'a `{ skip: STAGED_RUN }` option on the same line as the signal is one hit')
  const skipUnder = (gap) => ['g.mjs', ['const fn = runForm(src)', ...pad(gap - 1), "test.skip('y', () => {})"]]
  assert.deepEqual(skipsNearStaged([skipUnder(SKIP_WINDOW)]), [`g.mjs:${SKIP_WINDOW + 1}: test.skip('y', () => {})`], `a \`.skip(\` call ${SKIP_WINDOW} lines under a runForm call is one hit, the window's last line`)
  assert.deepEqual(skipsNearStaged([skipUnder(SKIP_WINDOW + 1)]), [], `a \`.skip(\` call ${SKIP_WINDOW + 1} lines under a runForm call is zero hits, the window boundary`)
  const skipOver = (gap) => ['j.mjs', ["test.skip('y', () => {})", ...pad(gap - 1), 'const fn = runForm(src)']]
  assert.deepEqual(skipsNearStaged([skipOver(SKIP_WINDOW)]), ["j.mjs:1: test.skip('y', () => {})"], `a \`.skip(\` call ${SKIP_WINDOW} lines over a runForm call is one hit, the window reads forward too`)
  assert.deepEqual(skipsNearStaged([skipOver(SKIP_WINDOW + 1)]), [], `a \`.skip(\` call ${SKIP_WINDOW + 1} lines over a runForm call is zero hits, the forward boundary`)
  assert.deepEqual(skipsNearStaged([['h.mjs', [...pad(2), "test.skip('z', () => {})", ...pad(2)]]]), [], 'a `.skip(` call with no signal within the window is zero hits')
  assert.deepEqual(skipsNearStaged([['i.mjs', ['const fn = runForm(src)', ...pad(SKIP_WINDOW + 2)]]]), [], 'a signal with no skip near it is zero hits')
})

// (q) Size floor (#2099). Matchers anchor on narrow fragments built from the imported constant
// (spec §8 — never the full message bytes, never a hand-copied number). Arms: an over-cap fresh
// stage exits non-zero, names the stripped-template size, writes nothing; comment bytes do not count;
// an over-cap --args payload is named as such, as the args sibling's size (D38); the boundary is `at or under dispatches, over
// refuses` (exactly SCRIPT_BYTE_CAP bytes stages, one more refuses); the live 0.21.11 shape — the
// shipped template plus an over-size-class args payload — stages under the cap; and a pre-existing
// over-cap staged file is refused (naming --discard-injections) rather than reused, byte-untouched.
const CAP_FRAGMENT = new RegExp(`over the Workflow tool's ${SCRIPT_BYTE_CAP}-byte scriptPath cap`)
const padFixture = (dir, name, padBytes) => {
  const p = join(dir, name)
  writeFileSync(p, MINIMAL_TEMPLATE + `export const pad = '${'x'.repeat(padBytes)}'\n`)
  return p
}
test('(q) over-cap fresh stage: exits non-zero, names the sizes, writes nothing; comment bulk does not count; an args payload is named', () => {
  const dir = scratch('stage-cap-')
  const over = runStager([padFixture(dir, 'padded.js', SCRIPT_BYTE_CAP), dir, 'cap-slug', '1'], { expectFail: true })
  assert.notEqual(over.status, 0, 'an over-cap staged copy must not exit 0')
  assert.match(over.stderr, CAP_FRAGMENT)
  assert.match(over.stderr, /\(stripped template \d+ bytes;/, 'the size floor labels the comment- and indent-stripped size as the stripped template')
  assert.doesNotMatch(over.stderr, /args/, 'the staged copy carries no args, so its size floor names none')
  assert.ok(!existsSync(join(dir, deriveName('cap-slug', '1') + '.js')), 'nothing is written on refusal')

  const commented = join(dir, 'commented.js')
  writeFileSync(commented, MINIMAL_TEMPLATE + `// ${'x'.repeat(SCRIPT_BYTE_CAP)}\n`)
  const ok = runStager([commented, dir, 'comment-slug', '1'])
  assert.ok(Buffer.byteLength(readFileSync(ok.stdout.trim(), 'utf8'), 'utf8') < 1024, 'the comment bulk was stripped, not counted')

  const withTail = join(dir, 'with-tail.js')
  writeFileSync(withTail, MINIMAL_TEMPLATE + `const A = typeof args === 'object' ? args ${ARGS_FALLBACK_ANCHOR}\n`)
  const argsOver = runStager([withTail, dir, 'args-cap-slug', '1', '--args', writeArgs(dir, { pad: 'x'.repeat(SCRIPT_BYTE_CAP) })], { expectFail: true })
  assert.notEqual(argsOver.status, 0)
  assert.match(argsOver.stderr, CAP_FRAGMENT)
  assert.match(argsOver.stderr, /args sibling script would be \d+ bytes/, 'the over-cap file is named as the args sibling')
  assert.match(argsOver.stderr, /args JSON [1-9]\d* bytes/, 'the args payload is named with its own non-zero size')
  assert.ok(!existsSync(join(dir, deriveName('args-cap-slug', '1') + '.js')), 'nothing is written on refusal')
  assert.ok(!existsSync(join(dir, deriveName('args-cap-slug', '1') + ARGS_SIBLING_SUFFIX)), 'no args sibling either')
})

test('(q) cap boundary: exactly SCRIPT_BYTE_CAP bytes stages, one byte more refuses', () => {
  const dir = scratch('stage-cap-edge-')
  const probe = runStager([padFixture(dir, 'probe.js', 1000), dir, 'edge-slug', '1'])
  const overhead = Buffer.byteLength(readFileSync(probe.stdout.trim(), 'utf8'), 'utf8') - 1000
  const atCap = runStager([padFixture(dir, 'at-cap.js', SCRIPT_BYTE_CAP - overhead), dir, 'edge-slug', '1', '--force'])
  assert.equal(Buffer.byteLength(readFileSync(atCap.stdout.trim(), 'utf8'), 'utf8'), SCRIPT_BYTE_CAP, 'a staged copy of exactly the cap is written')
  const overCap = runStager([padFixture(dir, 'over-cap.js', SCRIPT_BYTE_CAP - overhead + 1), dir, 'edge-slug', '1', '--force'], { expectFail: true })
  assert.notEqual(overCap.status, 0, 'one byte over the cap refuses')
  assert.match(overCap.stderr, CAP_FRAGMENT)
})

test('(q) the live 0.21.11 shape: the shipped template plus a ~104.5 KB --args payload stages under the cap', () => {
  const live = scratch('stage-cap-live-')
  const { stdout } = runStager([TEMPLATE, live, 'live-slug', '1', '--args', writeArgs(live, { phase: { id: 1 }, pad: 'x'.repeat(107008) })])
  assert.ok(Buffer.byteLength(readFileSync(stdout.trim(), 'utf8'), 'utf8') <= SCRIPT_BYTE_CAP)
  assert.ok(Buffer.byteLength(readFileSync(argsSiblingPath(stdout.trim()), 'utf8'), 'utf8') <= SCRIPT_BYTE_CAP, 'and so does its args sibling')
})

test('(q) write-if-absent refuses a pre-existing staged file over the cap, naming --discard-injections, file untouched', () => {
  const dir = scratch('stage-cap-reuse-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  const stale = `// stale over-cap stage\n${'x'.repeat(SCRIPT_BYTE_CAP)}\n`
  writeFileSync(stagedPath, stale)
  const r = runStager([tpl, dir, 'slug', '1'], { expectFail: true })
  assert.notEqual(r.status, 0)
  assert.match(r.stderr, /existing staged file/)
  assert.match(r.stderr, CAP_FRAGMENT)
  assert.match(r.stderr, /restage it with --discard-injections/)
  assert.doesNotMatch(r.stderr, /--force/, 'a sidecar-less over-cap file would refuse --force, so the remedy never names it')
  assert.equal(readFileSync(stagedPath, 'utf8'), stale, 'the refused file is left byte-untouched')
  const forced = runStager([tpl, dir, 'slug', '1', DISCARD_FLAG])
  assert.ok(Buffer.byteLength(readFileSync(forced.stdout.trim(), 'utf8'), 'utf8') <= SCRIPT_BYTE_CAP, '--discard-injections restages a fresh, under-cap copy')
})

// (t) Digest sidecar (#2345, PIN-10). Every write leaves `<staged>.sha256` holding the digest of the
// written bytes; --force overwrites only a file whose sidecar matches; a hand-edited file or a file
// with no sidecar refuses --force with exit 1 naming DISCARD_FLAG, file byte-untouched; DISCARD_FLAG
// overwrites regardless. The flag and the suffix come from the stager's exports, never a literal.
const DISCARD_FRAGMENT = new RegExp(DISCARD_FLAG)
const stagedFixture = () => {
  const dir = scratch('stage-sidecar-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = runStager([tpl, dir, 'slug', '1']).stdout.trim()
  return { dir, tpl, stagedPath }
}
test('(t) --force over a hand-edited file exits 1 naming --discard-injections', () => {
  const { dir, tpl, stagedPath } = stagedFixture()
  const edited = readFileSync(stagedPath, 'utf8') + 'export const injected = 1 // an approved stage\n'
  writeFileSync(stagedPath, edited)
  const sidecar = readFileSync(stagedPath + SIDECAR_SUFFIX, 'utf8')
  const r = runStager([tpl, dir, 'slug', '1', '--force'], { expectFail: true })
  assert.equal(r.status, 1)
  assert.match(r.stderr, DISCARD_FRAGMENT)
  assert.match(r.stderr, /differs from its \.sha256 digest sidecar/)
  assert.equal(r.stdout, '', 'no staged path is printed on refusal')
  assert.equal(readFileSync(stagedPath, 'utf8'), edited, 'the refused file is left byte-untouched')
  assert.equal(readFileSync(stagedPath + SIDECAR_SUFFIX, 'utf8'), sidecar, 'the sidecar is left byte-untouched')
})
test('(t) --force with no sidecar exits 1', () => {
  const dir = scratch('stage-nosidecar-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const stagedPath = join(dir, deriveName('slug', '1') + '.js')
  writeFileSync(stagedPath, '// a pre-sidecar stage\n')
  const r = runStager([tpl, dir, 'slug', '1', '--force'], { expectFail: true })
  assert.equal(r.status, 1)
  assert.match(r.stderr, DISCARD_FRAGMENT)
  assert.match(r.stderr, /has no \.sha256 digest sidecar/)
  assert.equal(readFileSync(stagedPath, 'utf8'), '// a pre-sidecar stage\n', 'the refused file is left byte-untouched')
  assert.ok(!existsSync(stagedPath + SIDECAR_SUFFIX), 'no sidecar is written on refusal')
})
test('(t) --discard-injections overwrites', () => {
  const { dir, tpl, stagedPath } = stagedFixture()
  writeFileSync(stagedPath, '// hand-edited stage\n')
  const sideless = join(dir, deriveName('slug', '2') + '.js')
  writeFileSync(sideless, '// no sidecar\n')
  for (const [phase, p] of [['1', stagedPath], ['2', sideless]]) {
    const r = runStager([tpl, dir, 'slug', phase, DISCARD_FLAG])
    assert.equal(r.stdout.trim(), p)
    const staged = readFileSync(p, 'utf8')
    assert.ok(staged.includes(`name: '${deriveName('slug', phase)}'`), 'a fresh substitution replaced the file')
    assert.equal(readFileSync(p + SIDECAR_SUFFIX, 'utf8').trim(), sha256(staged), 'the overwrite wrote a matching sidecar')
  }
})
test('(t) every write leaves a matching sidecar', () => {
  const dir = scratch('stage-sidecar-all-')
  const tpl = join(dir, 'tpl.js')
  writeFileSync(tpl, MINIMAL_TEMPLATE)
  const withTail = join(dir, 'with-tail.js')
  writeFileSync(withTail, MINIMAL_TEMPLATE + `const A = typeof args === 'object' ? args ${ARGS_FALLBACK_ANCHOR}\n`)
  const runs = [
    [tpl, dir, 'slug', '1'], // fresh stage
    [tpl, dir, 'slug', '1', '--force'], // --force over a clean stage
    // Each payload gets its own args file, so the fresh stage embeds { a: 1 } and only a real
    // --force re-embed can make the phase-2 file read { a: 2 }.
    [withTail, dir, 'slug', '2', '--args', writeArgs(scratch('stage-args1-'), { a: 1 })], // fresh --args stage
    [withTail, dir, 'slug', '2', '--force', '--args', writeArgs(scratch('stage-args2-'), { a: 2 })], // --force re-embed
    [tpl, dir, 'slug', '3', DISCARD_FLAG], // --discard-injections with nothing there
  ]
  for (const [i, args] of runs.entries()) {
    const p = runStager(args).stdout.trim()
    assert.equal(readFileSync(p + SIDECAR_SUFFIX, 'utf8'), sha256(readFileSync(p, 'utf8')) + '\n', `sidecar matches after: ${args.slice(2).join(' ')}`)
    if (args.includes('--args')) {
      const s = argsSiblingPath(p)
      assert.equal(readFileSync(s + SIDECAR_SUFFIX, 'utf8'), sha256(readFileSync(s, 'utf8')) + '\n', `args sibling sidecar matches after: ${args.slice(2).join(' ')}`)
    }
    if (i === 2) assert.match(readFileSync(argsSiblingPath(p), 'utf8'), /"a":1/, 'the fresh --args stage wrote the first args to the sibling')
  }
  assert.match(readFileSync(join(dir, deriveName('slug', '2') + ARGS_SIBLING_SUFFIX), 'utf8'), /"a":2/, 'the --force re-embed over a clean stage took the new args')
})

// staged-script doc (#2345, operator ruling 3, 2026-11-08): the three doc surfaces that state the
// --force rule name the override flag and the sidecar suffix in one grammar (`override flag
// `<flag>`` and `` `<staged><suffix>` ``), extracted here and compared with the stager's exports; the
// GLOSSARY **Provenance stamp** entry's `stamp key `<key>`` equals the template's planFile key; and
// the old always-overwrites wording is absent from each surface that carried it (whitespace-normalized,
// because the GLOSSARY entries soft-wrap mid-phrase).
test("staged-script doc: names the stager's override flag and sidecar suffix", () => {
  const root = join(HERE, '..', '..', '..')
  const read = (rel) => readFileSync(join(root, rel), 'utf8')
  const norm = (t) => t.replace(/\s+/g, ' ')
  const between = (text, start, end, label) => {
    const a = text.indexOf(start)
    assert.ok(a !== -1, `${label}: start marker not found: ${start}`)
    const b = text.indexOf(end, a + start.length)
    assert.ok(b !== -1, `${label}: end marker not found: ${end}`)
    return text.slice(a, b)
  }
  const doc = read('skills/war/references/staged-script.md')
  const adr = read('docs/adr/0037-run-scoped-staged-phase-scripts.md')
  const decision3 = between(adr, '\n3. **', '\n4. **', 'ADR 0037 decision 3')
  const amendment = decision3.split('\n\n').find((p) => p.trimStart().startsWith('**Amendment (2026-11-08'))
  assert.ok(amendment, 'ADR 0037 decision 3 carries no 2026-11-08 amendment paragraph')
  const glossary = read('GLOSSARY.md')
  const stagedEntry = between(glossary, '**Staged phase script**:', '**Staged-script sidecar**:', 'GLOSSARY staged-copy entry')
  const sidecarEntry = between(glossary, '**Staged-script sidecar**:', '**Provenance stamp**:', 'GLOSSARY sidecar entry')
  const stampEntry = between(glossary, '**Provenance stamp**:', '\n### ', 'GLOSSARY Provenance stamp entry')
  const surfaces = { 'staged-script.md': doc, 'ADR 0037 decision 3 amendment': amendment, 'GLOSSARY staged-copy entry': stagedEntry, 'GLOSSARY sidecar entry': sidecarEntry }
  for (const [label, text] of Object.entries(surfaces)) {
    const flags = [...norm(text).matchAll(/override flag `(--[a-z-]+)`/g)].map((m) => m[1])
    const suffixes = [...norm(text).matchAll(/`<staged>(\.[a-z0-9]+)`/g)].map((m) => m[1])
    assert.ok(flags.length > 0, `${label}: no \`override flag \`<flag>\`\` restatement — the guard is fail-closed`)
    assert.ok(suffixes.length > 0, `${label}: no \`<staged><suffix>\` restatement — the guard is fail-closed`)
    for (const f of flags) assert.equal(f, DISCARD_FLAG, `${label}: names override flag ${f}, the stager exports ${DISCARD_FLAG}`)
    for (const x of suffixes) assert.equal(x, SIDECAR_SUFFIX, `${label}: names sidecar suffix ${x}, the stager exports ${SIDECAR_SUFFIX}`)
  }
  const tpl = readFileSync(TEMPLATE, 'utf8')
  const tplKey = tpl.match(/if \(typeof row\.(\w+) === 'string' && row\.\1\) \{\s*\n\s*if \(ownPlanBase && baseOf\(row\.\1\)/)
  assert.ok(tplKey, 'could not locate the provenance stamp read in workflow-template.js rowText')
  const stampKeys = [...norm(stampEntry).matchAll(/stamp key `(\w+)`/g)].map((m) => m[1])
  assert.ok(stampKeys.length > 0, 'GLOSSARY Provenance stamp entry: no `stamp key `<key>`` restatement')
  for (const k of stampKeys) assert.equal(k, tplKey[1], `GLOSSARY Provenance stamp entry names key ${k}, the template reads ${tplKey[1]}`)
  const retired = {
    'staged-script.md': [doc, ['any injected stage in the old file is lost', 'naming `--force`']],
    'ADR 0037 decision 3': [decision3, ['the only path that overwrites', 'refuses with an error naming `--force`']],
    'GLOSSARY.md': [glossary, ['a deliberate `--force` overwrites it', 'refused with an error naming `--force`']],
  }
  for (const [label, [text, phrases]] of Object.entries(retired)) {
    for (const phrase of phrases) assert.ok(!norm(text).includes(phrase), `${label} still carries the old always-overwrites wording: ${phrase}`)
  }
})

// (r) Cap doc pins (#2099). Every doctrine surface that restates the scriptPath cap writes it in one
// grammar — `<n>-byte `scriptPath` cap` — and this arm extracts each restatement and compares it to
// the imported SCRIPT_BYTE_CAP (the DOC_TIER_PINS discipline from war-config.test.mjs: extraction
// plus equality, never a hand-copied number). A bare rendering of the number outside that grammar is
// banned on the same surfaces, so a restatement cannot slip out from under the pin; the one other
// permitted rendering is the stager's quoted stderr message (`<n>-byte scriptPath cap`, no backticks,
// no thousands separator), which the ban's arithmetic counts separately. README.md, CHANGELOG.md and
// docs/learnings/ are release-slot or narrative prose and stay out.
const DOC_CAP_PINS = ['GLOSSARY.md', 'skills/war/references/staged-script.md', 'docs/adr/0037-run-scoped-staged-phase-scripts.md']
test('(r) DOC_CAP_PINS: every prose restatement of the scriptPath cap equals SCRIPT_BYTE_CAP, and no bare rendering escapes the grammar', () => {
  const rendered = SCRIPT_BYTE_CAP.toLocaleString('en-US')
  for (const rel of DOC_CAP_PINS) {
    const text = readFileSync(join(HERE, '..', '..', '..', rel), 'utf8')
    const restatements = [...text.matchAll(/([\d,]+)-byte `scriptPath` cap/g)].map((m) => m[1])
    assert.ok(restatements.length > 0, `${rel}: no scriptPath-cap restatement found — the pin is fail-closed`)
    for (const n of restatements) assert.equal(n, rendered, `${rel}: a scriptPath-cap restatement says ${n}, SCRIPT_BYTE_CAP renders ${rendered}`)
    const bare = (text.match(new RegExp(`\\b(${rendered}|${SCRIPT_BYTE_CAP})\\b`, 'g')) || []).length
    assert.equal(bare, restatements.length + (text.match(new RegExp(`${SCRIPT_BYTE_CAP}-byte scriptPath cap`, 'g')) || []).length, `${rel}: the cap is rendered outside the pinned grammar — bind it or point at SCRIPT_BYTE_CAP`)
  }
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
