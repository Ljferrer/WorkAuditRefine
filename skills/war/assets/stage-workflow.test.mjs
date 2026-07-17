import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join, isAbsolute } from 'node:path'
import { execFileSync } from 'node:child_process'
import { NAME_ANCHOR, DESCRIPTION_ANCHOR, deriveName, deriveDescription } from './stage-workflow.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const STAGER = join(HERE, 'stage-workflow.mjs')
const TEMPLATE = join(HERE, 'workflow-template.js')

// Run the real stager CLI as a subprocess. We assert on the STAGED TEXT it writes and the exported
// pure functions — we NEVER import()/execute a staged copy or the shipped template, because the
// template's top-level body IS a phase run.
function runStager(args, { expectFail = false } = {}) {
  try {
    const stdout = execFileSync(process.execPath, [STAGER, ...args], { encoding: 'utf8' })
    return { stdout, status: 0 }
  } catch (err) {
    if (!expectFail) throw err
    return { stdout: err.stdout || '', stderr: err.stderr || '', status: err.status }
  }
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
  for (const anchor of [NAME_ANCHOR, DESCRIPTION_ANCHOR]) {
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
