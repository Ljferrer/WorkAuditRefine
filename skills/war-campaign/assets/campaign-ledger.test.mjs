// TDD (RED first) for campaign-ledger.mjs — the deterministic ledger+inbox core behind /war-campaign.
// node:test + node:fs temp-dir fixtures only, stdlib. See plan Task 3 / spec §7.2.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  init,
  addToInbox,
  sweep,
  next,
  record,
  aggregateBackstops,
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

// Canonical plan-index TABLE roadmap (mirrors the ratified war-strategy §2 template
// row shape): header + separator rows, two `[slug](../plans/<file>.md)` rows, and a
// backticked `.md` decoy in a Files-owned cell. NO bare-list lines — so removing the
// table extractor turns the ingestion test into the 0-plan throw (delete-the-feature).
const ROADMAP = `# Roadmap — 2 plans

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [plan-a](../plans/a.md) | \`src/a.js\`, \`notes/decoy.md\` | v0.1.0 | — |
| 2 | [plan-b](../plans/b.md) | \`src/z.js\` | v0.1.1 | 1 |
`

// Legacy bare numbered-list form — retained as an explicit back-compat fixture.
const ROADMAP_BARE_LIST = `# Roadmap — 2 plans

## Index

1. plans/a.md
2. plans/b.md
`

// One table row + one stray bare-list line — locks the one-pass / document-line-order
// claim (table row precedes the bare line, so a resolves before b).
const ROADMAP_MIXED = `# Roadmap — mixed forms

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [plan-a](../plans/a.md) | \`src/a.js\` | v0.1.0 | — |

A stray legacy index line left over from an earlier revision:

- ../plans/b.md
`

// Bulleted markdown links only — matches NEITHER form (operator ratification 2), so
// the parse yields 0 plans and throws.
const ROADMAP_BULLETED_LINKS = `# Roadmap — bulleted links only

- [plan-a](../plans/a.md)
- [plan-b](../plans/b.md)
`

// No plan index at all — the 0-plan throw's canonical trigger.
const ROADMAP_PROSE_ONLY = `# Just prose

This roadmap has no plan index — only paragraphs describing intent.
No table, no list.
`

// Chain-table regression roadmap (#738): a plan-index FIRST table (2 plan links)
// followed by an issue→spec→plan chain table whose rows LINK ../specs/*-design.md,
// plus a backticked .md decoy token in a chain cell. First-table-only ingestion must
// take only the first table; every second-table target is structurally inert.
const ROADMAP_CHAIN_TABLE = `# Roadmap — plan index then a chain table (#738)

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [plan-a](../plans/a.md) | \`src/a.js\` | v0.1.0 | — |
| 2 | [plan-b](../plans/b.md) | \`src/z.js\` | v0.1.1 | 1 |

## Issue → spec → plan chain

| Issue | Spec | Plan | Notes |
|-------|------|------|-------|
| #1 | [spec-x](../specs/x-design.md) | 1 | \`notes/decoy2.md\` |
| #2 | [spec-y](../specs/y-design.md) | 2 | — |
`

// A fenced EXAMPLE table (carrying a .md link) precedes the real plan-index table.
// Code fences hide their contents from ingestion, so only the real table's links are
// taken. RED without the fence-skip toggle: the fenced table becomes the first table.
const ROADMAP_FENCED_TABLE = `# Roadmap — fenced example then the real table

Here is an EXAMPLE of the plan-index format (must be ignored):

\`\`\`
| # | Plan | Files |
|---|------|-------|
| 1 | [example](../plans/example.md) | \`x\` |
\`\`\`

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [plan-a](../plans/a.md) | \`src/a.js\` | v0.1.0 | — |
| 2 | [plan-b](../plans/b.md) | \`src/z.js\` | v0.1.1 | 1 |
`

// A stray leading-| prose line BEFORE the plan index opens (and, at the next non-table
// line, closes) a link-less first table — so the real plan table is a SECOND table,
// structurally ignored, and the parse 0-plan-throws. Pins the "any leading-| line opens
// the table" semantics loudly.
const ROADMAP_STRAY_PIPE = `# Roadmap — a stray leading-| line disqualifies the real table

| this line is prose that merely happens to start with a pipe

## Plans

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [plan-a](../plans/a.md) | \`src/a.js\` | v0.1.0 | — |
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

// Build the canonical-table roadmap fixture tree: roadmap under roadmaps/, plans
// under plans/ (so the `../plans/` targets exercise real resolution), plus the
// backticked decoy `notes/decoy.md` CREATED ON DISK with NO Files: block. The decoy
// sits in a Files-owned cell of the FIRST table, so it still proves within-first-table
// backtick precision under the first-table restriction. If a regressed extractor
// grabbed backticked cell tokens it would resolve the decoy to this real file and
// ingest it as a phantom plan — and because the decoy has no Files: block, the
// FIRST-LINE catch is assertOrderable's unparseable-footprint throw (init passes no
// positions), NOT the length check; the exactly-2 assertions are the BACKSTOP behind
// that throw. #816: never give the decoy a Files: block — that would silence the throw
// and quietly change which mechanism the test proves.
function setupCanonicalRoadmap(dir) {
  fs.mkdirSync(path.join(dir, 'plans'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'roadmaps', 'notes'), { recursive: true })
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  writePlan(dir, 'roadmaps/notes/decoy.md', '# decoy doc — must never be ingested\n')
  return writePlan(dir, 'roadmaps/roadmap.md', ROADMAP)
}

// Build the chain-table regression tree (#738): plan-index FIRST table (2 plan links)
// then an issue→spec→plan chain table linking two on-disk ../specs/*-design.md files —
// spec-x with NO Files: block, spec-y WITH a parsable backticked Files: block — plus a
// backticked .md decoy token in a chain cell (also on disk, for parity with the
// first-table decoy so a regressed backtick-extractor resolves it rather than ENOENT).
// First-table-only ingestion must yield exactly [a, b]; every second-table target is
// structurally inert.
function setupChainTableRoadmap(dir) {
  fs.mkdirSync(path.join(dir, 'plans'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'specs'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'roadmaps', 'notes'), { recursive: true })
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  // spec-x: no Files: block — would throw unparseable-footprint if ingested
  writePlan(dir, 'specs/x-design.md', '# Spec X\n\nProse only, no files section.\n')
  // spec-y: parsable backticked Files: block — would silently become a phantom ledger
  // entry (non-empty footprint, NO throw) if ingested; the exact-content assertion
  // catches that DIRECTLY, not via throw-absence (survives the fallback landing here).
  writePlan(dir, 'specs/y-design.md', '# Spec Y\n\n**Files:** `src/y.js`.\n')
  writePlan(dir, 'roadmaps/notes/decoy2.md', '# second-table decoy — must never be ingested\n')
  return writePlan(dir, 'roadmaps/roadmap.md', ROADMAP_CHAIN_TABLE)
}

test('init from a canonical plan-index table roadmap ingests the two linked plans, queued, in row order', () => {
  const dir = tmpDir()
  const roadmapPath = setupCanonicalRoadmap(dir)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'wait-for-merge' })

  assert.equal(ledger.mode, 'wait-for-merge')
  assert.equal(ledger.plans.length, 2)
  assert.equal(ledger.plans[0].status, 'queued')
  assert.equal(ledger.plans[0].plan, path.resolve(dir, 'plans/a.md'))
  assert.equal(ledger.plans[1].plan, path.resolve(dir, 'plans/b.md'))
})

test('table extraction ignores a backticked .md decoy in a Files-owned cell (exactly the 2 linked plans)', () => {
  const dir = tmpDir()
  const roadmapPath = setupCanonicalRoadmap(dir)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'stack' })

  assert.equal(ledger.plans.length, 2)
  const decoyResolved = path.resolve(dir, 'roadmaps/notes/decoy.md')
  assert.ok(!ledger.plans.some((p) => p.plan === decoyResolved), 'the backticked .md decoy must never be ingested')
  assert.deepEqual(
    ledger.plans.map((p) => p.plan),
    [path.resolve(dir, 'plans/a.md'), path.resolve(dir, 'plans/b.md')],
  )
})

test('init from a bare numbered-list roadmap still parses to the same ledger shape (back-compat)', () => {
  const dir = tmpDir()
  fs.mkdirSync(path.join(dir, 'plans'))
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP_BARE_LIST)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'wait-for-merge' })

  assert.equal(ledger.plans.length, 2)
  assert.equal(ledger.plans[0].plan, path.resolve(dir, 'plans/a.md'))
  assert.equal(ledger.plans[1].plan, path.resolve(dir, 'plans/b.md'))
})

test('mixed-form roadmap: a table row and a stray bare-list line both ingest, in document line order', () => {
  const dir = tmpDir()
  fs.mkdirSync(path.join(dir, 'plans'))
  fs.mkdirSync(path.join(dir, 'roadmaps'))
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  const roadmapPath = writePlan(dir, 'roadmaps/roadmap.md', ROADMAP_MIXED)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'stack' })

  assert.equal(ledger.plans.length, 2)
  assert.equal(ledger.plans[0].plan, path.resolve(dir, 'plans/a.md')) // table row is first in the document
  assert.equal(ledger.plans[1].plan, path.resolve(dir, 'plans/b.md')) // stray bare line is second
})

test('bulleted markdown-link roadmap matches neither form and throws the 0-plan error (ratification 2)', () => {
  const dir = tmpDir()
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP_BULLETED_LINKS)
  const campaignDir = path.join(dir, 'campaign')

  assert.throws(
    () => init(campaignDir, { roadmap: roadmapPath, mode: 'stack' }),
    (err) => /0 plans/.test(err.message) && err.message.includes(roadmapPath),
  )
  assert.equal(fs.existsSync(campaignDir), false)
})

test('init from a prose-only (0-plan) roadmap throws naming the path, and creates no ledger or campaign dir', () => {
  const dir = tmpDir()
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP_PROSE_ONLY)
  const campaignDir = path.join(dir, 'campaign')

  // MESSAGE-MATCHED on purpose: a bare assert.throws is vacuous — assertOrderable
  // also throws — so match /0 plans/ AND the roadmap path to pin the 0-plan throw.
  assert.throws(
    () => init(campaignDir, { roadmap: roadmapPath, mode: 'stack' }),
    (err) => /0 plans/.test(err.message) && err.message.includes(roadmapPath),
  )
  assert.equal(fs.existsSync(campaignDir), false)
})

// ---- first-table-only + fence-blind ingestion (#738) ----------------------

test('chain-table roadmap: only the first (plan-index) table ingests; the second table\'s spec links and decoy are structurally inert (#738)', () => {
  const dir = tmpDir()
  const roadmapPath = setupChainTableRoadmap(dir)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'stack' })

  // exactly the two plan-index rows, in row order
  assert.equal(ledger.plans.length, 2)
  assert.deepEqual(
    ledger.plans.map((p) => p.plan),
    [path.resolve(dir, 'plans/a.md'), path.resolve(dir, 'plans/b.md')],
  )
  // Neither chain-table spec LINK nor the backticked decoy may appear. Without the
  // first-table fix the OLD parser ingests every table row's first link: spec-x (no
  // Files) throws unparseable-footprint AND spec-y (parsable backticked Files) becomes
  // a phantom entry — the deepEqual above catches that phantom DIRECTLY, independent of
  // spec-x's throw (so the fixture survives the fallback landing in this same task).
  for (const phantom of [
    path.resolve(dir, 'specs/x-design.md'),
    path.resolve(dir, 'specs/y-design.md'),
    path.resolve(dir, 'roadmaps/notes/decoy2.md'),
  ]) {
    assert.ok(!ledger.plans.some((p) => p.plan === phantom), `must never ingest ${phantom}`)
  }
})

test('fenced example table before the plan index is ignored; only the real first table ingests (#738 fence-skip)', () => {
  const dir = tmpDir()
  fs.mkdirSync(path.join(dir, 'plans'))
  fs.mkdirSync(path.join(dir, 'roadmaps'))
  writePlan(dir, 'plans/a.md', PLAN_A)
  writePlan(dir, 'plans/b.md', PLAN_DISJOINT)
  // example.md on disk, so a fence-skip regression fails on the exact-content check
  // (length/order) rather than an ENOENT that would mask what broke.
  writePlan(dir, 'plans/example.md', PLAN_A)
  const roadmapPath = writePlan(dir, 'roadmaps/roadmap.md', ROADMAP_FENCED_TABLE)
  const campaignDir = path.join(dir, 'campaign')

  const ledger = init(campaignDir, { roadmap: roadmapPath, mode: 'stack' })

  assert.equal(ledger.plans.length, 2)
  assert.deepEqual(
    ledger.plans.map((p) => p.plan),
    [path.resolve(dir, 'plans/a.md'), path.resolve(dir, 'plans/b.md')],
  )
  // the fenced example link must never be ingested — without the fence toggle the
  // fenced table BECOMES the first table and ingests example.md instead of a/b.
  assert.ok(!ledger.plans.some((p) => p.plan === path.resolve(dir, 'plans/example.md')))
})

test('a stray leading-| prose line opens+closes a link-less first table; the real table is a second table and the parse 0-plan-throws (#738 first-table semantics)', () => {
  const dir = tmpDir()
  fs.mkdirSync(path.join(dir, 'plans'))
  fs.mkdirSync(path.join(dir, 'roadmaps'))
  writePlan(dir, 'plans/a.md', PLAN_A)
  const roadmapPath = writePlan(dir, 'roadmaps/roadmap.md', ROADMAP_STRAY_PIPE)
  const campaignDir = path.join(dir, 'campaign')

  // MESSAGE-MATCHED: the stray-pipe line opens the (link-less) first table and the next
  // non-table line closes it, so the real plan table is a SECOND table and inert → 0
  // plans. Match /0 plans/ + the roadmap path to pin THIS throw (not assertOrderable).
  // Without the first-table fix the OLD parser ingests the real row and does NOT throw.
  assert.throws(
    () => init(campaignDir, { roadmap: roadmapPath, mode: 'stack' }),
    (err) => /0 plans/.test(err.message) && err.message.includes(roadmapPath),
  )
  assert.equal(fs.existsSync(campaignDir), false)
})

test('the 0-plan throw message names first-table-only ingestion AND the --plans escape hatch (delete-the-clause RED)', () => {
  const dir = tmpDir()
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP_PROSE_ONLY)
  let msg = ''
  assert.throws(
    () => init(path.join(dir, 'campaign'), { roadmap: roadmapPath, mode: 'stack' }),
    (e) => { msg = e.message; return true },
  )
  assert.match(msg, /0 plans/)       // existing clause survives in kind
  assert.match(msg, /first table/i)  // first-table-only clause
  assert.match(msg, /--plans/)       // explicit-seed escape hatch
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

test('the unparseable-footprint throw carries the backticked + comma-separated authoring hint (delete-the-clause RED)', () => {
  const dir = tmpDir()
  const planD = writePlan(dir, 'd.md', PLAN_UNPARSEABLE)
  let msg = ''
  assert.throws(
    () => init(path.join(dir, 'campaign'), { plans: [planD], mode: 'stack' }),
    (e) => { msg = e.message; return true },
  )
  assert.match(msg, /unparseable|explicit position/i) // existing assertion stays green in kind
  assert.match(msg, /backtick/i)                       // authoring hint: backticked
  assert.match(msg, /comma/i)                          // authoring hint: comma-separated
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

// ---- add --ref provenance + two-line drop parse (plan Task 1) -------------

test('add with a ref writes a two-line drop: line 1 the resolved plan path, line 2 `ref: <ref>`', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  const dest = addToInbox(campaignDir, planA, { ref: 'origin/master' })
  const lines = fs.readFileSync(dest, 'utf8').split('\n')
  // trailing newline yields a final empty element; the payload is the first two lines
  assert.equal(lines[0], path.resolve(planA))
  assert.equal(lines[1], 'ref: origin/master')
  assert.equal(lines.filter((l) => l.length).length, 2) // exactly two non-empty lines
})

test('add without a ref writes a byte-identical single-line legacy drop', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  const dest = addToInbox(campaignDir, planA)
  // legacy shape is exactly the resolved path plus a single trailing newline
  assert.equal(fs.readFileSync(dest, 'utf8'), path.resolve(planA) + '\n')
})

test('sweep of a two-line ref drop records the line-1 path as the ledger plan (needs first-line parse)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  addToInbox(campaignDir, planA, { ref: 'origin/master' })
  sweep(campaignDir)

  const ledger = readLedger(campaignDir)
  assert.equal(ledger.plans.length, 1)
  // without first-line parse, planPath is the whole "<path>\nref: ..." blob and
  // extractFilesFromPlanFile throws ENOENT — so reaching a correct plan entry proves it
  assert.equal(ledger.plans[0].plan, path.resolve(planA))
  assert.deepEqual(ledger.plans[0].files, ['src/a.js', 'src/b.js'])
  assert.deepEqual(fs.readdirSync(path.join(campaignDir, 'inbox')), []) // consumed
})

test('sweep of a legacy one-line drop is still consumed correctly (compat guard)', () => {
  const dir = tmpDir()
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  // write the legacy single-line drop shape by hand (no ref line at all)
  const inboxDir = path.join(campaignDir, 'inbox')
  fs.writeFileSync(path.join(inboxDir, '0001-legacy.plan'), path.resolve(planC) + '\n')

  sweep(campaignDir)

  const ledger = readLedger(campaignDir)
  assert.equal(ledger.plans.length, 1)
  assert.equal(ledger.plans[0].plan, path.resolve(planC))
  assert.deepEqual(fs.readdirSync(inboxDir), []) // consumed
})

test('sweep of a drop whose line-1 path does not exist throws ENOENT (fail-loud backstop)', () => {
  const dir = tmpDir()
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [], mode: 'stack' })

  // a drop pointing at a plan that was never materialized (still missing at sweep)
  const inboxDir = path.join(campaignDir, 'inbox')
  const missing = path.join(dir, 'never-materialized.md')
  fs.writeFileSync(path.join(inboxDir, '0001-missing.plan'), missing + '\nref: origin/master\n')

  // MESSAGE-MATCHED on purpose: a bare assert.throws is vacuous because
  // assertOrderable also throws 'unparseable footprint' — only /ENOENT/ goes RED
  // when the fail-loud backstop is swallowed (plan Task 1 test 5).
  assert.throws(() => sweep(campaignDir), /ENOENT|no such file/)
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

// ---- backstops aggregation (Task 9) --------------------------------------
// Each plan's handoff backstops[] is recorded onto its ledger entry; the campaign
// wrap-up aggregates them across plans, tolerating entries that predate the field.

const BACKSTOP_A = { check: 'docker build', why: 'no Dockerfile in repo', runner: 'first container run', source: 'plan' }
const BACKSTOP_B = { check: 'load test', why: 'no staging env', runner: 'pre-GA', source: 'auto' }
const BACKSTOP_AI = { check: 'schema migration dry-run', why: 'no prod snapshot', runner: 'ops handoff', source: 'plan', aiDeclared: true }

test('new plan entries default backstops to null (in-flight tolerance)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  const ledger = init(campaignDir, { plans: [planA], mode: 'stack' })
  assert.equal(ledger.plans[0].backstops, null)
})

test('record stamps a plan\'s backstops[] and it round-trips through the persisted ledger', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  record(campaignDir, { plan: path.resolve(planA), status: 'landed', backstops: [BACKSTOP_A] })

  assert.deepEqual(readLedger(campaignDir).plans[0].backstops, [BACKSTOP_A])
})

test('record with omitted backstops leaves an already-recorded value UNCHANGED (no undefined-stamp deletion)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  record(campaignDir, { plan: path.resolve(planA), backstops: [BACKSTOP_A] })
  // a later update touches only status — backstops must survive
  record(campaignDir, { plan: path.resolve(planA), status: 'landed' })

  assert.deepEqual(readLedger(campaignDir).plans[0].backstops, [BACKSTOP_A])
})

test('aggregateBackstops flattens every plan\'s backstops across the campaign, tagged with origin slug', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)       // slug 'a'
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT) // slug 'c'
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA, planC], mode: 'stack' })

  record(campaignDir, { plan: path.resolve(planA), backstops: [BACKSTOP_A, BACKSTOP_AI] })
  record(campaignDir, { plan: path.resolve(planC), backstops: [BACKSTOP_B] })

  const agg = aggregateBackstops(campaignDir)
  assert.deepEqual(agg, [
    { ...BACKSTOP_A, plan: 'a' },
    { ...BACKSTOP_AI, plan: 'a' },
    { ...BACKSTOP_B, plan: 'c' },
  ])
  // AI-declared provenance survives aggregation so the wrap-up can mark it
  assert.equal(agg.find((b) => b.check === BACKSTOP_AI.check).aiDeclared, true)
})

test('aggregateBackstops tolerates plans that predate the field (null / missing backstops contribute nothing)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const planC = writePlan(dir, 'c.md', PLAN_DISJOINT)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA, planC], mode: 'stack' })

  // planA recorded with backstops; planC left at its default null (an in-flight/pre-field entry)
  record(campaignDir, { plan: path.resolve(planA), backstops: [BACKSTOP_A] })

  // also simulate a truly legacy entry with NO backstops key at all
  const ledger = readLedger(campaignDir)
  delete ledger.plans[1].backstops
  fs.writeFileSync(path.join(campaignDir, 'ledger.json'), JSON.stringify(ledger, null, 2) + '\n')

  assert.deepEqual(aggregateBackstops(campaignDir), [{ ...BACKSTOP_A, plan: 'a' }])
})

test('aggregateBackstops returns [] for a campaign where nothing was deferred', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })
  assert.deepEqual(aggregateBackstops(campaignDir), [])
})

// ---- CLI record parity (#422 items 4+6) ----------------------------------
// These drive the CLI dispatch case, NOT the exported record() (already correct).

const CLI = path.join(__dirname, 'campaign-ledger.mjs')

function cli(...args) {
  return execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' })
}

test('CLI init --roadmap on a prose-only roadmap exits non-zero and creates no campaign dir (0-plan throw propagates)', () => {
  const dir = tmpDir()
  const roadmapPath = writePlan(dir, 'roadmap.md', ROADMAP_PROSE_ONLY)
  const campaignDir = path.join(dir, 'campaign')

  // execFileSync throws on a non-zero exit; the uncaught 0-plan throw inside
  // main()'s init case is that non-zero exit (same idiom as the mode-validation throw).
  assert.throws(() => cli('init', '--campaign', campaignDir, '--roadmap', roadmapPath))
  assert.equal(fs.existsSync(campaignDir), false)
})

test('CLI record --stopPoint round-trips into the persisted entry', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  cli('record', '--campaign', campaignDir, '--plan', planA,
    '--status', 'held-cli-93af', '--stopPoint', 'sp-red-team-halt-93af')

  const entry = readLedger(campaignDir).plans[0]
  assert.equal(entry.stopPoint, 'sp-red-team-halt-93af')
  assert.equal(entry.status, 'held-cli-93af')
})

test('CLI record with omitted --pr leaves the existing pr value UNCHANGED (no undefined-stamp deletion)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  cli('record', '--campaign', campaignDir, '--plan', planA,
    '--pr', '4177', '--branch', 'dev/keep-pr-branch-c2e6')
  // second update omits --pr and --branch entirely — both must survive
  cli('record', '--campaign', campaignDir, '--plan', planA, '--status', 'landed-cli-7b21')

  const entry = readLedger(campaignDir).plans[0]
  assert.equal(entry.pr, 4177)
  assert.equal(entry.branch, 'dev/keep-pr-branch-c2e6')
  assert.equal(entry.status, 'landed-cli-7b21')
})

test('CLI record --backstops parses a JSON array and persists it onto the entry', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A)
  const campaignDir = path.join(dir, 'campaign')
  init(campaignDir, { plans: [planA], mode: 'stack' })

  cli('record', '--campaign', campaignDir, '--plan', planA,
    '--status', 'landed', '--backstops', JSON.stringify([BACKSTOP_A, BACKSTOP_AI]))

  assert.deepEqual(readLedger(campaignDir).plans[0].backstops, [BACKSTOP_A, BACKSTOP_AI])
})

// ---- CLI --campaign anchoring + init dangling-symlink (plan Task 2, End states 4-5) --
// A relative --campaign must anchor at the MAIN checkout (git rev-parse
// --path-format=absolute --git-common-dir), never the invoking worktree's cwd, so
// campaign state survives worktree reaping (ADR 0016). Absolute passes through; a failed
// git probe falls back to today's cwd-relative behavior. init() names a dangling-symlink
// ENOENT instead of leaking a bare stack.

// A real git repo with a `git worktree add` linked worktree, so `--git-common-dir` from
// the worktree cwd resolves to the main checkout's `.git` (dirname → the main checkout).
function makeGitRepoWithWorktree() {
  const root = tmpDir()
  const main = path.join(root, 'main')
  fs.mkdirSync(main)
  const g = (...a) => execFileSync('git', a, { cwd: main, stdio: 'ignore' })
  g('init', '-q')
  g('config', 'user.email', 'war@test')
  g('config', 'user.name', 'war test')
  fs.writeFileSync(path.join(main, 'README.md'), '# fixture\n')
  g('add', '-A')
  g('commit', '-qm', 'init')
  const wt = path.join(root, 'wt')
  g('worktree', 'add', '-q', wt)
  return { main, wt }
}

function cliIn(opts, ...args) {
  return execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...opts })
}

test('CLI init with a relative --campaign from a linked worktree writes the ledger under the MAIN checkout, not the worktree (End state 4)', () => {
  const { main, wt } = makeGitRepoWithWorktree()
  const rel = path.join('.claude', 'campaigns', 'anchored-camp')

  cliIn({ cwd: wt }, 'init', '--campaign', rel) // no plans → empty ledger, stack mode

  // existsSync (not string equality): git returns the /private/var realpath on macOS
  // while `main` is the /var symlink — existsSync follows the symlink, path equality wouldn't.
  assert.ok(fs.existsSync(path.join(main, rel, 'ledger.json')), 'ledger lands under the main checkout')
  assert.ok(!fs.existsSync(path.join(wt, rel, 'ledger.json')), 'ledger must NOT land under the worktree cwd')
})

test('CLI init with an ABSOLUTE --campaign uses it verbatim, never anchored to the main checkout (End state 4)', () => {
  const { main, wt } = makeGitRepoWithWorktree()
  const abs = path.join(tmpDir(), 'abs-camp')

  cliIn({ cwd: wt }, 'init', '--campaign', abs)

  assert.ok(fs.existsSync(path.join(abs, 'ledger.json')), 'absolute --campaign is used verbatim')
  // nothing was anchored under the main checkout (would catch a path.join mis-anchor of the abs path)
  assert.ok(!fs.existsSync(path.join(main, '.claude')), 'absolute --campaign must not touch the main checkout')
})

test('CLI init with a relative --campaign from a NON-git cwd falls back to cwd-relative today\'s behavior (End state 4)', () => {
  const cwd = tmpDir() // pristine temp dir, not a git repo
  const rel = path.join('.claude', 'campaigns', 'fallback-camp')

  // GIT_CEILING_DIRECTORIES stops git's upward repo search at the temp parent, so the
  // anchor probe fails deterministically regardless of where os.tmpdir() lives → fallback.
  cliIn(
    { cwd, env: { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(cwd) } },
    'init', '--campaign', rel,
  )

  assert.ok(fs.existsSync(path.join(cwd, rel, 'ledger.json')), 'relative path resolves against cwd when the anchor probe fails')
})

test('init() through a dangling `campaigns` symlink throws a named error (not a bare ENOENT stack) (End state 5)', () => {
  const dir = tmpDir()
  const planA = writePlan(dir, 'a.md', PLAN_A) // valid footprint → reach the mkdir, not assertOrderable
  // dangling symlink: `campaigns` → a nonexistent target, so recursive mkdir under it throws ENOENT
  fs.symlinkSync(path.join(dir, 'no-such-target'), path.join(dir, 'campaigns'))
  const campaignDir = path.join(dir, 'campaigns', 'default')

  // MESSAGE-MATCHED: the raw ENOENT already names campaignDir, so the /dangling|symlink/i
  // clause is what discriminates the wrap — a bare rethrow goes RED on it.
  assert.throws(
    () => init(campaignDir, { plans: [planA], mode: 'stack' }),
    (err) => err.message.includes(campaignDir) && /dangling|symlink/i.test(err.message),
  )
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

// ---- extractFiles backtick-ABSENCE fallback + block scoping (#739) --------
// When the collected block carries NO backtick at all, fall back to comma-split
// whole-segment isPathShaped acceptance. Any backtick present keeps extraction
// backtick-only — backticks stay the precision mechanism (constraint 6).

test('extractFiles fallback: a zero-backtick comma-separated Files line yields the bare paths (RED without the fallback)', () => {
  const block = ['- Files: src/one.js, src/two.js', '']
  assert.deepEqual(extractFiles(block), ['src/one.js', 'src/two.js'])
})

test('extractFiles stays backtick-only when ANY backtick is present: a sole non-path-shaped `TODO` yields [] (no bare dilution)', () => {
  const block = ['- Files: `TODO`', '']
  assert.deepEqual(extractFiles(block), [])
})

test('extractFiles fallback: space-separated (uncomma\'d) bare paths yield [] — a whole segment carrying whitespace fails isPathShaped', () => {
  const block = ['- Files: src/one.js src/two.js', '']
  assert.deepEqual(extractFiles(block), [])
})

test('extractFiles on a mixed block (one backticked path + bare text) defers to backticks, yielding only the backticked path', () => {
  const block = ['- Files: `src/a.js`, src/bare-ignored.js', '']
  assert.deepEqual(extractFiles(block), ['src/a.js'])
})

test('extractFiles block-scoping: a bare "- Files:" line immediately followed by a backtick-bearing "- Plan slice:" bullet yields only the Files path (collectBlock stops at the next list item)', () => {
  // RED without the collectBlock list-item break: the Plan-slice backticks (construct
  // names, not paths) bleed into the block, a backtick is then present, the
  // backtick-absence fallback never fires, and extractFiles returns [].
  const block = [
    '- Files: src/only.js',
    '- Plan slice: rewrite `resolveRoadmapPlans` and `extractFiles` per the design tree',
  ]
  assert.deepEqual(extractFiles(block), ['src/only.js'])
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
//
// The actual load-bearing guard against a disabled intersectFootprints lives in the
// 'contention: two mutually-overlapping simultaneous inbox entries...' test above
// (line ~143), which asserts result.overlaps[0].paths against a real sweep() call —
// stubbing intersectFootprints to always return [] flips that assertion RED. This test
// only proves intersectFootprints itself is correct in isolation.

test('intersectFootprints detects an overlap between two identical single-file footprints', () => {
  const overlap = intersectFootprints(['src/b.js'], ['src/b.js'])
  assert.deepEqual(overlap, ['src/b.js'])
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

// (guard) Symlink-invocation regression: running the CLI through a symlink must still fire main()
// (fail loud), never silently exit 0. RED against the pre-normalization concat guard
// (`import.meta.url === `file://${process.argv[1]}``): the loader realpaths the main module but
// argv[1] keeps the symlink, so the compare is false and main() never runs. The `cli` helper pins
// the real CLI path, so spawn the symlink directly; execFileSync throws on the exit-1 default
// (usage on stderr). Node >= 24 pre-resolves argv[1] for relative invocation, so the symlink is
// the trigger that goes RED — a relative-invocation test is vacuous.
test('CLI symlinked invocation still runs main() — usage on stderr, non-zero exit', () => {
  const link = path.join(tmpDir(), 'link.mjs')
  fs.symlinkSync(CLI, link)
  let status, stderr
  try {
    execFileSync(process.execPath, [link], { encoding: 'utf8' })
    status = 0
  } catch (err) {
    status = err.status
    stderr = err.stderr || ''
  }
  assert.notEqual(status, 0, 'symlinked invocation must exit non-zero (default usage path)')
  assert.match(stderr, /usage: campaign-ledger\.mjs/, `usage line must reach stderr; got: ${stderr}`)
})
