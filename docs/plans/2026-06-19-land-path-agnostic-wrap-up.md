# Land-path-agnostic Wrap-up — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is also `/war`-executable — the **Build order** below maps tasks to WAR phases.

**Goal:** Make the `war-servitor` Wrap-up capture learnings for **every** phase that lands — including the escalation/manual-land path where the in-workflow Wrap-up never fires — and make the Land decision observable (never a silent skip).

**Architecture:** Extract the land/hold decision into a pure, unit-tested module ([`land-decision.mjs`](../../skills/war/assets/land-decision.mjs)) and mirror it inline in the Workflow template (the Workflow sandbox cannot `import`, same pattern as the existing `ROLE_MODEL`/`spawnOpts` mirror). The template returns the decision (`landDecision`) and the `auditLog` so the Lead can complete the Wrap-up itself after a manual land. The "run the servitor on every landed phase, exactly once" obligation is owned by the Lead runbook ([`SKILL.md`](../../skills/war/SKILL.md)). The in-flow auto-land path is unchanged.

**Tech Stack:** Node.js ES modules (`.mjs`), `node:test` + `node:assert/strict` (colocated `*.test.mjs`, no package.json); the Workflow template is plain JS run by the Claude Code Workflow tool.

**Source of truth:** [`docs/specs/2026-06-19-land-path-agnostic-wrap-up-design.md`](../specs/2026-06-19-land-path-agnostic-wrap-up-design.md) (v0.4.1).

**Build order (for `/war`):**
- **Phase 1 — Behavior:** Task 1 → Task 2 (Task 2 depends on Task 1's logic; the mirror must stay in sync).
- **Phase 2 — Docs & release:** Task 3, Task 4, Task 5 (independent; may run in parallel).
- **Phase 3 — Verify:** Task 6 (depends on all).

---

### Task 1: `land-decision.mjs` — the pure land/hold decision

**Files:**
- Create: `skills/war/assets/land-decision.mjs`
- Test: `skills/war/assets/land-decision.test.mjs`

- [ ] **Step 1: Write the failing test**

`skills/war/assets/land-decision.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decideLand, HARD_ESCALATION_REASONS } from './land-decision.mjs'

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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /path/to/WorkAuditRefine && node --test skills/war/assets/land-decision.test.mjs`
Expected: FAIL — `Cannot find module './land-decision.mjs'`.

- [ ] **Step 3: Write the minimal implementation**

`skills/war/assets/land-decision.mjs`:
```js
// Pure land/hold decision for the WAR per-phase Workflow.
// MIRRORED inline in ./workflow-template.js (the Workflow sandbox can't import) — keep in sync.
//
// Reasons that HOLD the land for the Lead (a hard escalation). gate_failed/error are
// deliberately NOT here: they leave nothing merged, surfaced as 'held:nothing-merged'.
export const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict']

// landed:    array of task ids merged onto the integration branch this phase
// escalated: array of { reason, ... } for tasks that did not merge
// → 'landed' | 'held:escalation' | 'held:nothing-merged'
export function decideLand({ landed = [], escalated = [] } = {}) {
  const hard = escalated.some((e) => HARD_ESCALATION_REASONS.includes(e && e.reason))
  if (landed.length && !hard) return 'landed'
  if (hard) return 'held:escalation'
  return 'held:nothing-merged'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test skills/war/assets/land-decision.test.mjs`
Expected: PASS — 9 tests, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add skills/war/assets/land-decision.mjs skills/war/assets/land-decision.test.mjs
git commit -m "feat(war): extract decideLand — pure, tested land/hold decision"
```

---

### Task 2: Wire `decideLand` into the template; return `auditLog` + `landDecision`

**Files:**
- Modify: `skills/war/assets/workflow-template.js` (the LAND block + the final `return`)
- Test: `skills/war/assets/workflow-template.test.mjs`

- [ ] **Step 1: Write the failing integration test**

`skills/war/assets/workflow-template.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, 'workflow-template.js'), 'utf8').replace(/^export const meta/m, 'const meta')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const build = () => new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', src)

test('template body still compiles as an async function (syntax check)', () => {
  assert.doesNotThrow(build)
})

test('empty phase returns the augmented shape and the NAMED no-merge hold', async () => {
  const fn = build()
  const agent = async () => { throw new Error('no agent should run for an empty phase') }
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t()))
  const pipeline = async () => []
  const noop = () => {}
  const args = {
    phase: { id: 6, title: 'P6', integrationBranch: 'integration/phase-6', workingBranch: 'dev/planA' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    tasks: [],
    learningsTarget: null,
  }
  const out = await fn(agent, parallel, pipeline, noop, noop, args, { total: null })
  assert.equal(out.landDecision, 'held:nothing-merged')   // was a silent skip before
  assert.deepEqual(out.auditLog, [])                       // now returned for a Lead-driven wrap-up
  assert.equal(out.landResult, null)
  assert.equal(out.servitorResult, null)
  assert.deepEqual(out.landed, [])
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test skills/war/assets/workflow-template.test.mjs`
Expected: FAIL — the second test fails because `out.landDecision` and `out.auditLog` are `undefined` (the current template returns neither).

- [ ] **Step 3: Replace the LAND block**

In `skills/war/assets/workflow-template.js`, replace this block:
```js
// ---- LAND — only when no hard escalation is open; else hold for the Lead ----
let landResult = null
const hardEscalation = escalated.some(e => ['escalate', 'audit-blocked', 'conflict'].includes(e.reason))
if (landed.length && !hardEscalation) {
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Run the gate (${plan.gate}); push ${ph.workingBranch}.`,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
} else if (hardEscalation) {
  log(`Holding the land for phase ${ph.id}: ${escalated.length} escalation(s) need the Lead's decision.`)
}
```
with:
```js
// ---- LAND — only when no hard escalation is open; else hold for the Lead ----
// landDecision mirrors land-decision.mjs (decideLand) — the Workflow sandbox can't import. Keep in sync.
let landResult = null
const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict']
const hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
const landDecision = (landed.length && !hardEscalation) ? 'landed'
  : hardEscalation ? 'held:escalation'
  : 'held:nothing-merged'
if (landDecision === 'landed') {
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Run the gate (${plan.gate}); push ${ph.workingBranch}.`,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
} else if (landDecision === 'held:escalation') {
  log(`Holding the land for phase ${ph.id}: ${escalated.length} escalation(s) need the Lead's decision.`)
} else {
  log(`Holding the land for phase ${ph.id}: no task merged cleanly (see escalations) — the Lead must resolve and land.`)
}
```

- [ ] **Step 4: Augment the return**

In the same file, replace the final return:
```js
return { phase: ph.id, landed, escalated, minorsFiled, landResult, servitorResult }
```
with:
```js
return { phase: ph.id, landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }
```

- [ ] **Step 5: Run the integration test + the syntax check**

Run: `node --test skills/war/assets/workflow-template.test.mjs`
Expected: PASS — 2 tests, 0 fail.

Run the standalone syntax check (belt-and-suspenders; the project's canonical template check):
```bash
node -e "const s=require('fs').readFileSync('skills/war/assets/workflow-template.js','utf8').replace(/^export const meta/m,'const meta');new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','log','phase','args','budget',s);console.log('template OK')"
```
Expected: prints `template OK`.

- [ ] **Step 6: Commit**

```bash
git add skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs
git commit -m "feat(war): template returns auditLog + landDecision; name the no-merge hold"
```

---

### Task 3: SKILL.md — return-shape, the Lead-driven Wrap-up step, and the invariant

**Files:**
- Modify: `skills/war/SKILL.md` (the per-phase return bullet, the Checkpoint section, the Invariants list)

- [ ] **Step 1: Update the documented return shape**

Replace:
```
- returns `{ landed, escalated, minorsFiled, landResult, servitorResult }`.
```
with:
```
- returns `{ landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }` — `landDecision` ∈ `landed` | `held:escalation` | `held:nothing-merged`; `servitorResult` is null unless the Workflow landed the phase itself.
```

- [ ] **Step 2: Add the Lead-driven Wrap-up to the Checkpoint section**

In the `## Checkpoint (between phases)` section, append this bullet after the existing paragraph:
```
- **Capture learnings on every landed phase (exactly once).** The Workflow only wraps up when it lands the phase itself (`landDecision === 'landed'`, `servitorResult` populated). When it returns a `held:*` decision and you land the phase manually (the escalation path), then **after your manual land's gate is green** spawn `war-servitor` yourself — write-scoped via `WAR_WORKTREE=<learningsTarget>` — fed the returned `auditLog`, `escalated`, and the resolution (what the user decided and how the fix went). Run it only if `servitorResult` is absent (never double-capture).
```

- [ ] **Step 3: Add the invariant**

In the `## Invariants (never violate)` list, add:
```
- **Every landed phase captures learnings exactly once**, by whichever path landed it: the in-flow Wrap-up when the Workflow lands (`landDecision === 'landed'`), else a Lead-driven `war-servitor` pass after a manual land. Skip if `servitorResult` is already set.
```

- [ ] **Step 4: Verify references resolve**

Run: `grep -n "auditLog\|landDecision" skills/war/SKILL.md`
Expected: matches in the return-shape bullet, the Checkpoint bullet, and the invariant (≥ 3 lines) — no orphaned field.

- [ ] **Step 5: Commit**

```bash
git add skills/war/SKILL.md
git commit -m "docs(war): runbook — Lead completes the Wrap-up on every landed phase"
```

---

### Task 4: schemas.md return contract + design.md amendment

**Files:**
- Modify: `skills/war/references/schemas.md` (new return-contract subsection)
- Modify: `skills/war/references/design.md` (new v0.4.1 amendment)

- [ ] **Step 1: Document the Workflow per-phase return in schemas.md**

After the `## Workflow per-phase args contract` section, append:
~~~markdown
## Workflow per-phase return

The per-phase Workflow returns:
```jsonc
{ phase,                              // phase id
  landed: ["task_id"],                // tasks merged onto the integration branch
  escalated: [ { task, reason, ... } ],
  minorsFiled: [ { task, ...finding } ],
  landResult,                         // MergeResult of the in-flow land, or null if held
  servitorResult,                     // ServitorResult, or null if the Workflow did not land/wrap up
  auditLog: [ { task, verdict, findings, blocked } ],   // fed to a Lead-driven wrap-up on the held path
  landDecision: "landed" | "held:escalation" | "held:nothing-merged" }
```
When `landDecision` is a `held:*` value the land was **not** performed in-flow; the Lead lands manually and then runs `war-servitor` (see SKILL.md). `held:nothing-merged` means no task merged cleanly and no hard escalation was raised (e.g. a lone `gate_failed`) — surfaced explicitly rather than silently skipped.
~~~

- [ ] **Step 2: Add the v0.4.1 amendment to design.md**

Append a new section at the end of `skills/war/references/design.md`:
```markdown
## 15. v0.4.1 amendments
- **Land-path-agnostic Wrap-up.** The servitor's Wrap-up is now an obligation satisfied **once per landed phase regardless of who lands it**, not a stage welded to the in-flow land. The template surfaces `landDecision` (`landed` | `held:escalation` | `held:nothing-merged`) and the `auditLog` in its return; on a `held:*` decision the Lead lands manually (the human-owned boundary, unchanged) and then runs `war-servitor` itself with the returned `auditLog` + escalations + resolution. Guard: run only when `servitorResult` is absent (no double-capture).
- **No silent land.** The previously-unlogged `landed.length === 0 && !hardEscalation` case is now `held:nothing-merged` with an explicit log; the land decision is observable in every run. The hard-escalation hold set (`escalate`/`audit-blocked`/`conflict`) is unchanged — `gate_failed`/`error` still do not, by themselves, block a land that has other merged tasks.
- **decideLand** is the canonical, unit-tested decision (`assets/land-decision.mjs`), mirrored inline in `assets/workflow-template.js` (the Workflow sandbox can't import) — keep in sync, same pattern as `ROLE_MODEL`.
```

- [ ] **Step 3: Verify**

Run: `grep -n "landDecision\|held:nothing-merged" skills/war/references/schemas.md skills/war/references/design.md`
Expected: matches in both files.

- [ ] **Step 4: Commit**

```bash
git add skills/war/references/schemas.md skills/war/references/design.md
git commit -m "docs(war): document the per-phase return + v0.4.1 land-path-agnostic wrap-up"
```

---

### Task 5: Version bump to v0.4.1

**Files:**
- Modify: `.claude-plugin/plugin.json` (`version`)
- Modify: `README.md` (`## Status`)
- Modify: `skills/war/references/design.md` (the `**Status:**` line)

- [ ] **Step 1: Bump the plugin version**

In `.claude-plugin/plugin.json`, change `"version": "0.4.0"` to `"version": "0.4.1"`.

- [ ] **Step 2: Update README Status**

In `README.md` under `## Status`, replace the current version paragraph with:
```
v0.4.1 — early. Fix: the `war-servitor` Wrap-up now captures learnings for **every** phase that lands, including the escalation/manual-land path (the in-flow Wrap-up only ran when the Workflow landed the phase itself); the per-phase land decision is now observable (`landDecision`) instead of silently skipped. Adds `/red-team` (v0.4.0) and completes the war-room → red-team → war trilogy.
```

- [ ] **Step 3: Update the design.md Status line**

In `skills/war/references/design.md`, update the `**Status:**` line to begin `**Status:** v0.4.1.` (keep the rest of the sentence).

- [ ] **Step 4: Verify the manifest parses and the version is consistent**

Run:
```bash
node -e "const v=require('./.claude-plugin/plugin.json').version; if(v!=='0.4.1'){throw new Error('version='+v)}; console.log('plugin.json OK', v)"
grep -c "v0.4.1" README.md skills/war/references/design.md
```
Expected: prints `plugin.json OK 0.4.1`; each file reports ≥ 1 match.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/plugin.json README.md skills/war/references/design.md
git commit -m "chore: bump to v0.4.1 (land-path-agnostic wrap-up)"
```

---

### Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `node --test skills/war/assets/ skills/red-team/assets/`
Expected: all tests pass, including the new `land-decision.test.mjs` and `workflow-template.test.mjs`; no regressions in `war-config.test.mjs`.

- [ ] **Step 2: Re-run the template syntax check**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/war/assets/workflow-template.js','utf8').replace(/^export const meta/m,'const meta');new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','log','phase','args','budget',s);console.log('template OK')"
```
Expected: `template OK`.

- [ ] **Step 3: Consistency sweep — mirror in sync, no orphaned fields**

Run:
```bash
grep -n "HARD_ESCALATION_REASONS = \['escalate', 'audit-blocked', 'conflict'\]" skills/war/assets/land-decision.mjs skills/war/assets/workflow-template.js
grep -rn "auditLog\|landDecision" skills/war/SKILL.md skills/war/references/schemas.md
```
Expected: the hard-escalation list matches in **both** `land-decision.mjs` and `workflow-template.js` (mirror in sync); `auditLog`/`landDecision` are documented in SKILL.md and schemas.md.

- [ ] **Step 4: Acceptance criteria (from the spec)**

Confirm, via the passing tests above:
- A `held:*` phase returns `auditLog` + a named `landDecision` (Task 2 test) → the Lead can run the post-land servitor (SKILL.md, Task 3).
- The auto-land path is unchanged (`landDecision === 'landed'` still triggers the in-flow land + wrap-up).
- The no-merge case is `held:nothing-merged`, never a silent skip (Task 1 + Task 2 tests).
- Version is `0.4.1` across plugin.json / README / design.md (Task 5 verify).
