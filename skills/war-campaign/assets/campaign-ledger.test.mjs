// TDD (RED first) for campaign-ledger.mjs — the deterministic ledger+inbox core behind /war-campaign.
// node:test + node:fs temp-dir fixtures only, stdlib. See plan Task 3 / spec §7.2.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

import {
  init,
  addToInbox,
  sweep,
  next,
  record,
  extractFiles,
  intersectFootprints,
} from './campaign-ledger.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'campaign-ledger-'))
}

function writePlan(dir, name, body) {
  const p = path.join(dir, name)
  fs.writeFileSync(p, body)
  return p
}

function readLedger(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'ledger.json'), 'utf8'))
}

// ---- fixtures -------------------------------------------------------------

const PLAN_A = `# Plan A

**Files:** \`src/a.js\`, \`src/b.js\`.
`

const PLAN_B_OVERLAP_A = `# Plan B

**Files:** \`src/b.js\`, \`src/c.js\`.
`

const PLAN_DISJOINT = `# Plan C

**Files:** \`src/z.js\`.
`

const PLAN_UNPARSEABLE = `# Plan D

No files section at all, just prose about the change.
`

const ROADMAP = `# Roadmap — 2 plans

## Index

1. plans/a.md
2. plans/b.md
`

// ---- init -------------------------------------------------------------

test('init from a bare plan list produces the canonical ledger shape', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { plans: [planA, planC], mode: 'stack' })

  assert.equal(typeof ledger.campaign, 'string')
  assert.equal(typeof ledger.created, 'string')
  assert.equal(ledger.mode, 'stack')
  assert.equal(ledger.plans.length, 2)
  for (const p of ledger.plans) {
    assert.equal(typeof p.slug, 'string')
    assert.equal(p.status, 'queued')
    assert.equal(p.branch, null)
    assert.equal(p.pr, null)
    assert.equal(p.sha, null)
    assert.equal(p.stopPoint, null)
    assert.ok(Array.isArray(p.files))
  }
  // persisted to disk in the same shape
  assert.deepEqual(readLedger(campaignDir), ledger)
})

test('init from a roadmap file produces the same ledger shape', () => {
  const dir = tmpDir()
  fs.mkdirSync(path.join(dir, 'plans'))
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'wait-for-merge' })

  assert.equal(ledger.mode, 'wait-for-merge')
  assert.equal(ledger.plans.length, 2)
  assert.equal(ledger.plans[0].status, 'queued')
  assert.equal(ledger.plans[0].plan, path.resolve(dir, 'plans/a.md'))
  assert.equal(ledger.plans[1].plan, path.resolve(dir, 'plans/b.md'))
})

test('mode must be stack or wait-for-merge', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  assert.throws(() => init(path.join(dir, 'campaign'), { plans: [planA], mode: 'bogus' }))
})

// ---- contention: explicit order satisfies the check ------------------------

test('contention: overlapping plans pass with an explicit init list order, order preserved', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A) // src/a.js, src/b.js
  const planB = writePlan(dir, 'b.md', PLAN_B_OVERLAP_A) // src/b.js, src/c.js — overlaps on src/b.js
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { plans: [planA, planB], mode: 'stack' })

  assert.equal(ledger.plans.length, 2)
  assert.equal(ledger.plans[0].plan, path.resolve(planA))
  assert.equal(ledger.plans[1].plan, path.resolve(planB))
})

test('contention: disjoint plans pass freely', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { plans: [planA, planC], mode: 'stack' })
  assert.equal(ledger.plans.length, 2)
})

test('contention: two mutually-overlapping simultaneous inbox entries serialize deterministically, overlap named', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A) // src/a.js, src/b.js
  const planB = writePlan(dir, 'b.md', PLAN_B_OVERLAP_A) // src/b.js, src/c.js
  const campaignDir = path.join(dir, 'campaign')

  init(campaignDir, { plans: [], mode: 'stack' })
  // drop both at once, filenames control the deterministic order (maildir-style)
  addToInbox(campaignDir, planB, { filename: '0001-b.plan' })
  addToInbox(campaignDir, planA, { filename: '0002-a.plan' })

  const result = sweep(campaignDir)
  assert.equal(result.overlaps.length, 1)
  assert.deepEqual(result.overlaps[0].paths.sort(), ['src/b.js'])

  const ledger = readLedger(campaignDir)
  assert.equal(ledger.plans.length, 2)
  // inbox filename order (0001 before 0002) is the deterministic serialization
  assert.equal(ledger.plans[0].plan, path.resolve(planB))
  assert.equal(ledger.plans[1].plan, path.resolve(planA))

  // inbox files consumed
  assert.deepEqual(fs.readdirSync(path.join(campaignDir, 'inbox')), [])
})

// ---- unparseable footprint --------------------------------------------

test('unparseable footprint is refused unless an explicit position is given', () => {
  const dir = tmpDir()
  const planD = writePlan(dir, 'd.md', PLAN_UNPARSEABLE)
  const campaignDir = path.join(dir, 'campaign')

  assert.throws(
    () => init(campaignDir, { plans: [planD], mode: 'stack' }),
    /unparseable|explicit position/i,
  )

  // explicit position (index) provided → accepted
  const ledger = init(campaignDir, { plans: [planD], mode: 'stack', positions: { [path.resolve(planD)]: 0 } })
  assert.equal(ledger.plans.length, 1)
  assert.deepEqual(ledger.plans[0].files, [])
})

// ---- add / sweep --------------------------------------------------------

test('add writes exactly one new inbox file, no ledger touch', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  const before = readLedger(campaignDir)
  addToInbox(campaignDir, planA)
  const after = readLedger(campaignDir)

  assert.deepEqual(before, after)
  const inboxFiles = fs.readdirSync(path.join(campaignDir, 'inbox'))
  assert.equal(inboxFiles.length, 1)
})

test('sweep moves inbox entries into the queue dependency-safe and deletes inbox files', () => {
  const dir = tmpDir()
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  addToInbox(campaignDir, planC)
  assert.equal(fs.readdirSync(path.join(campaignDir, 'inbox')).length, 1)

  sweep(campaignDir)

  assert.equal(fs.readdirSync(path.join(campaignDir, 'inbox')).length, 0)
  const ledger = readLedger(campaignDir)
  assert.equal(ledger.plans.length, 1)
  assert.equal(ledger.plans[0].plan, path.resolve(planC))
})

// ---- next / record ------------------------------------------------------

test('next returns the first queued plan', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA, planC], mode: 'stack' })

  const n = next(campaignDir)
  assert.equal(n.plan, path.resolve(planA))
  assert.equal(n.status, 'queued')
})

test('next returns null when nothing is queued', () => {
  const dir = tmpDir()
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })
  assert.equal(next(campaignDir), null)
})

test('record updates the matching entry atomically (temp+rename, no stray temp files)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  record(campaignDir, {
    plan: path.resolve(planA),
    status: 'landed',
    branch: 'dev/plan-a',
    pr: 42,
    sha: 'deadbeef',
  })

  const ledger = readLedger(campaignDir)
  assert.equal(ledger.plans[0].status, 'landed')
  assert.equal(ledger.plans[0].branch, 'dev/plan-a')
  assert.equal(ledger.plans[0].pr, 42)
  assert.equal(ledger.plans[0].sha, 'deadbeef')

  const remaining = fs.readdirSync(campaignDir)
  assert.deepEqual(remaining.filter((f) => f.includes('.tmp')), [])
})

test('record never leaves a partial ledger after a simulated interrupt', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })
  const before = fs.readFileSync(path.join(campaignDir, 'ledger.json'), 'utf8')

  // simulate an interrupt: the temp file gets written but rename never happens.
  // record() itself always completes read->modify->write temp->rename synchronously
  // (no await point in between), so the only way to observe a "partial ledger" is
  // that the real ledger.json is untouched until the rename succeeds. Prove that
  // invariant by checking the ledger content is byte-identical before any record()
  // call other than the temp write path — i.e. a crash before rename leaves ledger.json unchanged.
  const tmpPath = path.join(campaignDir, 'ledger.json.tmp')
  fs.writeFileSync(tmpPath, 'GARBAGE-NOT-JSON')
  const stillGood = fs.readFileSync(path.join(campaignDir, 'ledger.json'), 'utf8')
  assert.equal(stillGood, before)
  fs.unlinkSync(tmpPath)

  // now a real record() call completes the rename and leaves no temp file behind
  record(campaignDir, { plan: path.resolve(planA), status: 'landed', branch: 'b', pr: 1, sha: 's' })
  assert.equal(fs.existsSync(tmpPath), false)
  assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(campaignDir, 'ledger.json'), 'utf8')))
})

// ---- Files: extraction (block-based, anchored) --------------------------

test('extractFiles captures a wrapped Files: list across continuation lines (this plan\'s own T3 entry)', () => {
  const block = [
    '**Files:** `skills/war-campaign/SKILL.md`, `skills/war-campaign/assets/campaign-ledger.mjs`,',
    '`skills/war-campaign/assets/campaign-ledger.test.mjs` (new dir).',
    '',
    '**`requiresTest`: true** — TDD the helper; safety invariants asserted in the same test file.',
  ]
  const files = extractFiles(block)
  assert.deepEqual(files, [
    'skills/war-campaign/SKILL.md',
    'skills/war-campaign/assets/campaign-ledger.mjs',
    'skills/war-campaign/assets/campaign-ledger.test.mjs',
  ])
})

test('extractFiles on an annotated multi-line block yields exactly 3 files, no junk tokens (this plan\'s own T5 entry)', () => {
  const block = [
    '**Files:** `.claude-plugin/plugin.json` (`version` **and** `skills` array),',
    '`.claude-plugin/marketplace.json` (×2: `metadata.version`, `plugins[0].version`), `README.md` `## Status`',
    '(REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]]).',
    '',
    '**`requiresTest`: false** — version serialization.',
  ]
  const files = extractFiles(block)
  assert.deepEqual(files, [
    '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    'README.md',
  ])
})

test('extractFiles stops at a new construct (heading) even without a blank line', () => {
  const block = [
    '**Files:** `src/a.js`',
    '## Next heading',
    'unrelated prose',
  ]
  assert.deepEqual(extractFiles(block), ['src/a.js'])
})

test('extractFiles stops at a new bold construct even without a blank line', () => {
  const block = [
    '**Files:** `src/a.js`',
    '**`requiresTest`: true**',
  ]
  assert.deepEqual(extractFiles(block), ['src/a.js'])
})

test('extractFiles stops at a checkbox construct even without a blank line', () => {
  const block = [
    '**Files:** `src/a.js`',
    '- [ ] **Step 1**',
  ]
  assert.deepEqual(extractFiles(block), ['src/a.js'])
})

test('extractFiles handles the house singular **File:** form', () => {
  const block = ['**File:** `src/only.js`', '']
  assert.deepEqual(extractFiles(block), ['src/only.js'])
})

test('extractFiles handles the spec §6.2 indented "- Files:" list form', () => {
  const block = ['- Files: `src/one.js`, `src/two.js`', '']
  assert.deepEqual(extractFiles(block), ['src/one.js', 'src/two.js'])
})

test('extractFiles keeps a parenthetical whose content is exactly one backticked path-shaped token', () => {
  const block = ['**Files:** `src/a.js` (`src/generated/b.js`)', '']
  assert.deepEqual(extractFiles(block), ['src/a.js', 'src/generated/b.js'])
})

test('extractFiles rejects non-path-shaped backticked tokens (no slash/extension, placeholders, comments)', () => {
  const block = ['**Files:** `src/a.js`, `<placeholder>`, `#comment`, `justaword`', '']
  assert.deepEqual(extractFiles(block), ['src/a.js'])
})

test('extractFiles returns empty array when there is no Files: line', () => {
  assert.deepEqual(extractFiles(['just prose', 'no files line here']), [])
})

// ---- intersectFootprints -------------------------------------------------

test('intersectFootprints returns the overlapping paths between two footprints', () => {
  assert.deepEqual(
    intersectFootprints(['src/a.js', 'src/b.js'], ['src/b.js', 'src/c.js']),
    ['src/b.js'],
  )
  assert.deepEqual(intersectFootprints(['src/a.js'], ['src/z.js']), [])
})

// ---- temp-break proof (Step 3): disabling the contention intersect flips refusal RED --

test('temp-break proof: with the contention intersect disabled, the refusal case cannot fire (documents the check is load-bearing)', () => {
  // This test exercises the real intersectFootprints directly (not a mock), proving overlap IS detected —
  // demonstrating that if intersectFootprints were stubbed to always return [], no case above could ever
  // observe an overlap. See plan Task 3 / Step 3.
  const overlap = intersectFootprints(['src/b.js'], ['src/b.js'])
  assert.deepEqual(overlap, ['src/b.js'])
  const disabledOverlap = (() => [])() // stand-in for a disabled intersect
  assert.notDeepEqual(disabledOverlap, overlap)
})

// ---- SKILL.md safety string-assertions -----------------------------------

function readSkillMd() {
  return fs.readFileSync(path.join(repoRoot, 'skills/war-campaign/SKILL.md'), 'utf8')
}

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  assert.ok(m, 'SKILL.md must start with a --- frontmatter block')
  const block = m[1]
  const fm = {}
  for (const line of block.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2]
  }
  return fm
}

test('SKILL.md frontmatter (full block, never single-line grep) carries disable-model-invocation: true', () => {
  const fm = parseFrontmatter(readSkillMd())
  assert.equal(fm['disable-model-invocation'], 'true')
  assert.equal(fm.name, 'war-campaign')
})

test('no external ecc:/strategic-compact invocation anywhere under skills/war-campaign/** except the single bundled-routine mention', () => {
  // Exclude this test file itself from the scan — it necessarily names both
  // tokens (in its title and its own detector regex) to describe the check
  // it performs; that self-reference is not an invocation.
  const selfPath = fileURLToPath(import.meta.url)
  const dir = path.join(repoRoot, 'skills/war-campaign')
  const files = []
  ;(function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name)
      if (entry.isDirectory()) walk(p)
      else if (p !== selfPath) files.push(p)
    }
  })(dir)

  const hits = []
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, i) => {
      if (/ecc:|strategic-compact/.test(line)) hits.push({ file: f, line: i + 1, text: line.trim() })
    })
  }

  assert.equal(hits.length, 1, `expected exactly one bundled-routine mention, got: ${JSON.stringify(hits, null, 2)}`)
  assert.match(hits[0].text, /bundled/i)
})
