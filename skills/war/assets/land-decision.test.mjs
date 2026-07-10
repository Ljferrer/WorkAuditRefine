import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
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

// ---- D8: per-mode HARD_ESCALATION_REASONS reachability drift-guard (#639) ----
// HARD_ESCALATION_REASONS is ONE array shared by the merge-task AND land-phase modes — canonical in
// land-decision.mjs, hand-mirrored in workflow-template.js (ADR 0005; never split/narrow — the
// inline-mirror↔export drift-guard lives in war-config.test.mjs, NOT here). 'no-test'/'unpackaged' are
// emitted only by merge-task floor prompts and are inert in the land-phase
// `HARD_ESCALATION_REASONS.includes(landResult.status)` check — historically guarded by a hand-written
// unreachability COMMENT one prompt-drift away from a silent hard escalation (spec risk #6). These tests
// pin that per-mode split mechanically; the hand-written comment at the `.includes(landResult.status)`
// site STAYS as narration (grill Q7, ratified — this task reads/parses workflow-template.js, never edits it).

// The two reasons a land-phase prompt must NEVER emit (only merge-task floor prompts do); either one
// emitted by a land prompt would become a hard escalation reachable via landResult.status.
const MERGE_TASK_FLOOR_ONLY = ['no-test', 'unpackaged']
// The land-phase-reachable subset (Task 2.1 / spec §4 D8): every hard reason that can drive
// held:escalation at land-decision time — carried in `escalated[]` from the work/audit/merge phases
// (escalate/audit-blocked/conflict/dep-failed/gate-evidence/unrunnable-deps) or emitted by the land
// prompt itself (land_stale). It is exactly HARD_ESCALATION_REASONS minus the two merge-task-floor reasons.
const LAND_PHASE_REACHABLE = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps']

// The land-dispatch block: from the relandDiscrimination helper (which emits land_stale) through the end
// of the `if (landDecision === 'landed')` land-prompt branches. `block` = land-phase prompts; `outside`
// = the rest of the Workflow (merge-task prompts live here).
function landDispatchSlice() {
  const wf = readAsset('workflow-template.js')
  const start = wf.indexOf('const relandDiscrimination =')
  const end = wf.indexOf("} else if (landDecision === 'held:escalation')")
  assert.ok(start >= 0 && end > start, 'land-dispatch block anchors must resolve in workflow-template.js')
  return { block: wf.slice(start, end), outside: wf.slice(0, start) + wf.slice(end) }
}
// The status: literals the land prompts instruct the refiner to return (landResult.status / reLand.status
// — the exact values the `.includes(landResult.status)` check sees).
function landPhaseEmittedStatuses() {
  return uniqSort([...landDispatchSlice().block.matchAll(/status:\s*(['"])([a-z0-9:_-]+)\1/g)].map((m) => m[2]))
}

test('D8: the land phase emits exactly {landed, land_stale, gate_failed, error, submodule-pr} as status literals', () => {
  const emitted = landPhaseEmittedStatuses()
  assert.ok(emitted.length > 0, 'no status literals extracted from the land-dispatch block — the anchor rotted (non-vacuous guard)')
  assert.deepEqual(emitted, uniqSort(['landed', 'land_stale', 'gate_failed', 'error', 'submodule-pr']),
    'the land-phase-emitted status set drifted — a new land status must be classified for per-mode reachability before this pin is updated')
})

test('D8: no-test/unpackaged are reachable from merge-task prompts but NOT from any land-phase prompt', () => {
  const { block, outside } = landDispatchSlice()
  for (const r of MERGE_TASK_FLOOR_ONLY) {
    const lit = new RegExp(`status:\\s*(['"])${r}\\1`)
    assert.ok(!lit.test(block),
      `a land-phase prompt emits status:'${r}' — it would become a hard escalation via HARD_ESCALATION_REASONS.includes(landResult.status); the shared array is REUSED intact (ADR 0005), never narrowed, so the guard must be here, not a comment`)
    assert.ok(lit.test(outside),
      `status:'${r}' is no longer emitted by any merge-task prompt — its HARD_ESCALATION_REASONS membership is now dead; re-check ADR 0005 before touching the shared array`)
  }
})

test('D8: the land-phase-reachable subset is HARD_ESCALATION_REASONS minus the two merge-task-floor reasons', () => {
  // Partition pin: the shared array is exactly the land-phase-reachable subset ∪ the merge-task-floor pair,
  // with no third class — a new HARD_ESCALATION_REASONS member fails this until its per-mode reachability
  // is classified into one bucket (this is what "pins the land-phase-reachable subset" means, spec §4 D8).
  assert.deepEqual(uniqSort(HARD_ESCALATION_REASONS), uniqSort([...LAND_PHASE_REACHABLE, ...MERGE_TASK_FLOOR_ONLY]))
  assert.deepEqual(uniqSort(HARD_ESCALATION_REASONS.filter((r) => !MERGE_TASK_FLOOR_ONLY.includes(r))), uniqSort(LAND_PHASE_REACHABLE))
  // Tie the parse to the `.includes(landResult.status)` mechanism: the ONLY hard reason a land prompt
  // directly emits is land_stale, and it is in the pinned subset.
  const landEmittedHard = landPhaseEmittedStatuses().filter((s) => HARD_ESCALATION_REASONS.includes(s))
  assert.deepEqual(landEmittedHard, ['land_stale'],
    'a land prompt now emits a hard-escalation status other than land_stale — confirm it is intended and add it to LAND_PHASE_REACHABLE')
  for (const r of landEmittedHard) assert.ok(LAND_PHASE_REACHABLE.includes(r), `land prompt emits hard reason '${r}' absent from LAND_PHASE_REACHABLE`)
})

// ---- D9: phase/task status-enum level-separation doc-contract (#639) ----
// The task-status enum (todo|working|audited|merged|escalated|blocked) and the landDecision enum are
// disjoint level-namespaces: 'merged' is the TASK terminal; 'landed'/'held:*' are PHASE-level only
// (phase-vs-task-status-enum-leakage). Both are sourced FRESH from schemas.md so the guard tracks enum
// growth (a new held:* member, etc.) with no hardcoded literal. It fails when a phase-level landDecision
// token appears in a task-level `status` equality/label context (or, vice-versa, a task token in a
// `landDecision` equality/assignment) across agents/*.md + schemas.md. Anchored on status/landDecision
// EQUALITY or the issue-label form — NOT a bare word — so it does not false-trip on war-worker.md's
// "dep task's landed SHA" narration, nor on the refiner's legitimate MergeResult `status: "landed"`
// returns (colon-space-quote object literals, which are neither equality nor label form).
// ponytail: known ceiling — a legit MergeResult equality (`mr.status === 'landed'`) added to agent PROSE
// would false-flag; today these two surfaces carry only returns + enum declarations, none present.
const AGENTS_DIR = join(HERE, '../../../agents')
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function taskStatusEnumFromSchemas() {
  const line = readAsset('../references/schemas.md').split('\n').find((l) => /status:\s*"todo"\s*\|\s*"working"\s*\|\s*"audited"/.test(l))
  assert.ok(line, 'schemas.md task-status enum line (anchor: status: "todo"|"working"|"audited"…) not found')
  return uniqSort([...line.matchAll(/"([a-z][a-z-]*)"/g)].map((m) => m[1]))
}
function landDecisionEnumFromSchemas() {
  const line = readAsset('../references/schemas.md').split('\n').find((l) => l.includes('landDecision:') && l.includes('|'))
  assert.ok(line, 'schemas.md landDecision enum line (anchor: landDecision: "…" | …) not found')
  return uniqSort([...line.matchAll(/"(landed|held:[a-z-]+)"/g)].map((m) => m[1]))
}

// Enum-level leak detector over one text blob. phaseOnly = landDecision tokens ∉ task-status enum;
// taskOnly = task-status tokens ∉ landDecision enum. Both derived fresh, so the guard follows enum growth.
function detectEnumLeaks(text, phaseOnly, taskOnly) {
  const hits = []
  const patterns = [
    // a phase-level landDecision token used as a task-level `status` value (equality)…
    [new RegExp(`\\bstatus\\s*===?\\s*['"\\\`]?(${phaseOnly.map(reEsc).join('|')})\\b`, 'g'), 'phase-token-in-status-equality'],
    // …or as a task-level `status:` issue-label
    [new RegExp(`\\bstatus:(${phaseOnly.map(reEsc).join('|')})\\b`, 'g'), 'phase-token-as-status-label'],
    // vice-versa: a task-level status token used in a landDecision equality/assignment
    [new RegExp(`\\blandDecision\\s*(?:===?|:)\\s*['"\\\`]?(${taskOnly.map(reEsc).join('|')})\\b`, 'g'), 'task-token-in-landDecision'],
  ]
  for (const [re, kind] of patterns) for (const m of text.matchAll(re)) hits.push({ kind, token: m[1], match: m[0].trim() })
  return hits
}

test('D9: schemas.md sources disjoint task-status and landDecision enums (the leak-guard premise)', () => {
  const task = taskStatusEnumFromSchemas()
  const land = landDecisionEnumFromSchemas()
  assert.ok(task.length >= 6 && task.includes('working') && task.includes('audited'), 'task-status enum extraction grabbed the wrong line')
  assert.ok(land.length >= 7 && land.includes('landed'), 'landDecision enum extraction grabbed the wrong line')
  assert.deepEqual(task.filter((t) => land.includes(t)), [], 'task-status and landDecision enums must be level-disjoint (the premise of "phase-only" vs "task-only")')
})

test('D9: no phase/task status-enum leak across agents/*.md + schemas.md (current tree)', () => {
  const task = taskStatusEnumFromSchemas()
  const land = landDecisionEnumFromSchemas()
  const phaseOnly = land.filter((t) => !task.includes(t))
  const taskOnly = task.filter((t) => !land.includes(t))
  assert.ok(phaseOnly.length > 0 && taskOnly.length > 0, 'level-exclusive token sets must be non-empty for the guard to bite (non-vacuous)')
  const surfaces = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).map((f) => ['agents/' + f, readFileSync(join(AGENTS_DIR, f), 'utf8')])
  surfaces.push(['schemas.md', readAsset('../references/schemas.md')])
  const leaks = []
  for (const [name, text] of surfaces) for (const h of detectEnumLeaks(text, phaseOnly, taskOnly)) leaks.push({ file: name, ...h })
  assert.deepEqual(leaks, [], `phase/task status-enum leak(s) found:\n${leaks.map((l) => `  ${l.file}: [${l.kind}] ${l.match}`).join('\n')}`)
})

test('D9: the leak-guard catches injected leaks and does not false-trip on narration', () => {
  const task = taskStatusEnumFromSchemas()
  const land = landDecisionEnumFromSchemas()
  const phaseOnly = land.filter((t) => !task.includes(t))
  const taskOnly = task.filter((t) => !land.includes(t))
  const bite = (s) => detectEnumLeaks(s, phaseOnly, taskOnly).length > 0
  // injected leaks — each MUST be caught (delete the detector ⇒ these fail: the guard's teeth)
  assert.ok(bite("a task whose `status === 'landed'` is treated as done"), 'phase token in a task-status equality must flag')
  assert.ok(bite('the issue label `status:held:escalation` on a task'), 'phase token as a task-status label must flag')
  assert.ok(bite("the phase `landDecision === 'merged'` was recorded"), 'task token in a landDecision equality must flag (vice-versa)')
  // must NOT false-trip — the spec §8 open-risk cases
  assert.ok(!bite("Resolve the dep submodule task's landed SHA from the ledger"), 'bare "landed SHA" narration (war-worker.md §deps) must not flag')
  assert.ok(!bite('On push success → return `status: "landed"` with the new working SHA'), 'a legitimate MergeResult `status: "landed"` return must not flag')
  assert.ok(!bite('status: "todo"|"running"|"landed"|"blocked"'), 'a phase-status enum union containing "landed" must not flag')
})
