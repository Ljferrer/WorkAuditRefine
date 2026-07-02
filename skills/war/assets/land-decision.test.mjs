import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { decideLand, HARD_ESCALATION_REASONS, KNOWN_LAND_DECISIONS } from './land-decision.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const readAsset = (rel) => readFileSync(join(HERE, rel), 'utf8')

test('lands when something merged and no hard escalation', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [] }), 'landed')
})
test('holds on escalate', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'escalate' }] }), 'held:escalation')
})
test('holds on audit-blocked even with a merged task', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'audit-blocked' }] }), 'held:escalation')
})
test('holds on conflict', () => {
  assert.equal(decideLand({ landed: [], escalated: [{ reason: 'conflict' }] }), 'held:escalation')
})
test('nothing-merged when nothing landed and no hard escalation (formerly the silent skip)', () => {
  assert.equal(decideLand({ landed: [], escalated: [{ reason: 'gate_failed' }] }), 'held:nothing-merged')
})
test('nothing-merged on a totally empty phase', () => {
  assert.equal(decideLand({ landed: [], escalated: [] }), 'held:nothing-merged')
})
test('gate_failed/error are NOT hard escalations (preserve existing land semantics)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'gate_failed' }] }), 'landed')
  assert.ok(!HARD_ESCALATION_REASONS.includes('gate_failed'))
  assert.ok(!HARD_ESCALATION_REASONS.includes('error'))
})
test('tolerates null/garbage escalation entries', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [null, {}] }), 'landed')
})
test('defaults to nothing-merged with no args', () => {
  assert.equal(decideLand(), 'held:nothing-merged')
})
test('holds on land_stale (CAS-exhaustion is a hard escalation, distinct from content conflict)', () => {
  assert.equal(decideLand({ escalated: [{ reason: 'land_stale' }] }), 'held:escalation')
})
test('dep-failed is a hard escalation reason (F02 foundation)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'dep-failed' }] }), 'held:escalation')
  assert.ok(HARD_ESCALATION_REASONS.includes('dep-failed'))
})
test('gate-evidence is a hard escalation reason (F04 R3: provably-unrun mapped test holds the land)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'gate-evidence' }] }), 'held:escalation')
  assert.ok(HARD_ESCALATION_REASONS.includes('gate-evidence'))
})
test('unrunnable-deps is a hard escalation reason (L1: mirrors unified — a ghost-dep task holds the land)', () => {
  assert.equal(decideLand({ landed: ['t1'], escalated: [{ reason: 'unrunnable-deps' }] }), 'held:escalation')
  assert.ok(HARD_ESCALATION_REASONS.includes('unrunnable-deps'))
})

// ---- KNOWN_LAND_DECISIONS drift-guard (#271) ----
// Binds the 7-member landDecision known-set to one canonical export and freezes agreement
// BEHAVIORALLY (the Workflow's emitted literals + decideLand's outputs ⊆ the export) AND across
// all 4 doc surfaces (SKILL.md ×2, schemas.md ×2 == the export). See docs/plans/2026-07-01-landdecision-drift-guard.md.

test('KNOWN_LAND_DECISIONS is exactly the 7-member canonical set with no dupes', () => {
  assert.equal(KNOWN_LAND_DECISIONS.length, 7)
  assert.equal(new Set(KNOWN_LAND_DECISIONS).size, 7)
})

const uniqSort = (a) => [...new Set(a)].sort()
const known = new Set(KNOWN_LAND_DECISIONS)

// Step 3a — the Workflow's emitted landDecision literals, sliced to the landDecision block so comment
// tokens ('held:submodule-pr'/'held:workflow-error' in prose) and prompt-string tokens ('status: landed')
// OUTSIDE the block cannot pollute. Two-part extraction, both anchored to `landDecision`:
//   (1) same-line `landDecision <op> 'lit'` (= or :) — catches the 4 direct assignments + catch,
//   (2) the ternary assignment statement `let landDecision = …` up to the stable following `const refineryLandPath`
//       (bounded lookahead, NOT an open capture) — catches the 3 ternary branches.
function workflowEmitted() {
  const wf = readAsset('workflow-template.js')
  const blkStart = wf.indexOf('// landDecision mirrors land-decision.mjs')
  const blkEnd = wf.indexOf("landDecision: 'held:workflow-error'")
  assert.ok(blkStart >= 0 && blkEnd > blkStart, 'landDecision block anchors must resolve in workflow-template.js')
  const block = wf.slice(blkStart, blkEnd + 200)
  const direct = [...block.matchAll(/landDecision\s*(?:=(?![=])|:)\s*(['"])(landed|held:[a-z-]+)\1/g)].map((m) => m[2])
  const tern = block.match(/let landDecision =[\s\S]*?(?=\n\s*const )/)
  assert.ok(tern, 'the `let landDecision = …` ternary statement must be locatable')
  const ternLits = [...tern[0].matchAll(/(['"])(landed|held:[a-z-]+)\1/g)].map((m) => m[2])
  return uniqSort([...direct, ...ternLits])
}

test('behavioral ⊆: the Workflow emits exactly the 6 landDecision values, all ∈ KNOWN_LAND_DECISIONS', () => {
  const emitted = workflowEmitted()
  assert.deepEqual(emitted, uniqSort([
    'landed', 'held:escalation', 'held:nothing-merged', 'held:submodule-pr', 'held:land-failed', 'held:workflow-error',
  ]), 'the Workflow-emitted set drifted from the expected 6')
  for (const v of emitted) assert.ok(known.has(v), `Workflow emits ${v} but it is not in KNOWN_LAND_DECISIONS`)
})

test("behavioral ⊆: decideLand's 3 outputs are all ∈ KNOWN_LAND_DECISIONS", () => {
  const ld = readAsset('land-decision.mjs')
  const fn = ld.slice(ld.indexOf('export function decideLand'))
  const outs = uniqSort([...fn.matchAll(/return\s+(['"])(landed|held:[a-z-]+)\1/g)].map((m) => m[2]))
  assert.deepEqual(outs, uniqSort(['landed', 'held:escalation', 'held:nothing-merged']))
  for (const v of outs) assert.ok(known.has(v), `decideLand returns ${v} but it is not in KNOWN_LAND_DECISIONS`)
})

// Step 4 — doc-parity across all 4 surfaces: extract by a STABLE PHRASE, tokenize the backtick/quoted
// `landed`/`held:*` values in that region, assert non-empty, then order-insensitive deepEqual to the export.
const wantSorted = uniqSort(KNOWN_LAND_DECISIONS)

test('doc-parity (a): SKILL.md return-contract line == KNOWN_LAND_DECISIONS', () => {
  const line = readAsset('../SKILL.md').split('\n').find((l) => l.includes('`landDecision` ∈'))
  assert.ok(line, 'SKILL.md return-contract line (anchor: `landDecision` ∈) not found')
  const toks = uniqSort([...line.matchAll(/`(landed|held:[a-z-]+)`/g)].map((m) => m[1]))
  assert.ok(toks.length > 0, 'no landDecision tokens extracted from the SKILL.md return-contract line')
  assert.deepEqual(toks, wantSorted)
})

test("doc-parity (b): SKILL.md §4.2 classifier known-set == KNOWN_LAND_DECISIONS", () => {
  const line = readAsset('../SKILL.md').split('\n').find((l) => l.includes('not in the known set'))
  assert.ok(line, 'SKILL.md §4.2 classifier line (anchor: not in the known set) not found')
  const toks = uniqSort([...line.matchAll(/`(landed|held:[a-z-]+)`/g)].map((m) => m[1]))
  assert.ok(toks.length > 0, 'no landDecision tokens extracted from the SKILL.md §4.2 classifier line')
  assert.deepEqual(toks, wantSorted)
})

test('doc-parity (c): schemas.md enum union line == KNOWN_LAND_DECISIONS', () => {
  const line = readAsset('../references/schemas.md').split('\n').find((l) => l.includes('landDecision:') && l.includes('|'))
  assert.ok(line, 'schemas.md enum union line (anchor: landDecision: "…" | …) not found')
  const toks = uniqSort([...line.matchAll(/"(landed|held:[a-z-]+)"/g)].map((m) => m[1]))
  assert.ok(toks.length > 0, 'no landDecision tokens extracted from the schemas.md enum union line')
  assert.deepEqual(toks, wantSorted)
})

test('doc-parity (d): schemas.md per-value bullet headers == KNOWN_LAND_DECISIONS', () => {
  const schemas = readAsset('../references/schemas.md')
  const dStart = schemas.indexOf('The full `landDecision` enum:')
  assert.ok(dStart >= 0, 'schemas.md per-value bullets anchor (The full `landDecision` enum:) not found')
  const bullets = []
  for (const l of schemas.slice(dStart).split('\n').slice(1)) {
    const m = l.match(/^- \*\*`(landed|held:[a-z-]+)`\*\*/)
    if (m) bullets.push(m[1])
    else if (l.trim() === '') continue
    else break
  }
  assert.ok(bullets.length > 0, 'no per-value bullet headers extracted from schemas.md')
  assert.deepEqual(uniqSort(bullets), wantSorted)
})

// Step 5 — the intentional gap: held:phase-incomplete is canonical (Lead-classified when a phase
// notification is non-'completed') but NOT emitted by the Workflow.
test('held:phase-incomplete is ∈ KNOWN_LAND_DECISIONS but ∉ the Workflow-emitted set (Lead-classified)', () => {
  assert.ok(known.has('held:phase-incomplete'))
  assert.ok(!workflowEmitted().includes('held:phase-incomplete'))
})
