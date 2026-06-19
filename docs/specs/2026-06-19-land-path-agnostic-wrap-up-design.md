# Land-path-agnostic Wrap-up — Design

**Status:** proposed (targets **v0.4.1**, a fix). Spec of record for making the `war-servitor` Wrap-up run for **every** phase that lands, regardless of *who* performed the land.

Related: the per-phase engine [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js), the Lead runbook [`skills/war/SKILL.md`](../../skills/war/SKILL.md), architecture [`skills/war/references/design.md`](../../skills/war/references/design.md).

## 1. Problem

The Wrap-up (durable-learnings capture by `war-servitor`) only runs when the **per-phase Workflow itself** performs the land. Its guard is:

```js
// workflow-template.js — Wrap-up
if (landResult && landResult.status === 'landed' && learningsTarget) {
  servitorResult = await agent(/* war-servitor */)
}
```

But the Land stage is intentionally **held** when a hard escalation is open:

```js
// workflow-template.js — Land
const hardEscalation = escalated.some(e => ['escalate','audit-blocked','conflict'].includes(e.reason))
if (landed.length && !hardEscalation) {
  landResult = await agent(/* war-refiner: land integration → working */)
} else if (hardEscalation) {
  log(`Holding the land for phase ${ph.id}: … need the Lead's decision.`)
}
```

On the escalation path the workflow returns with `landResult === null`. The Lead surfaces the escalation, the user decides, and the **Lead performs the land manually** (a top-level `war-refiner` Agent, outside the workflow) — this is by design (the human owns the land boundary). But because no *in-workflow* land occurred, `landResult` stays `null`, the Wrap-up guard is false, and **the servitor never runs**. The phase lands with **zero learnings captured**.

This is worst exactly where it hurts most: escalation-driven fixes (a design decision the human had to make, plus the fix that followed) are the **highest-signal** learnings the servitor exists to record, and they are precisely the ones silently dropped.

### Observed instance
A Phase 6 (`P6`) HTTP-surface run held its land on an escalation; the Lead landed `integration/phase-6` → `dev/planA` via a standalone "Land P6 HTTP surface to dev/planA" Agent and ran the gate (`pytest`) outside the workflow. The Workflow's **Land** and **Wrap-up** phases both showed *"No agents ran in this phase."* — the single cause (in-workflow land held) producing two empty phases.

### Secondary gap (same root)
When `landed.length === 0 && !hardEscalation` (e.g., the lone approved task's merge returned `gate_failed`), the Land `if/else if` falls through to **neither branch**: no land, **no log**, no escalation surfaced. The land is skipped *silently*, which reads downstream as "nothing to land" when in fact something failed.

## 2. Goal / Non-goals

**Goal.** Establish and enforce the invariant: **every phase that lands captures durable learnings exactly once**, via `war-servitor`, regardless of whether the Workflow auto-landed it or the Lead landed it on the escalation path. Make the Land outcome observable in all cases.

**Non-goals.**
- Changing *who* performs the land. The Lead keeps ownership of the land on the escalation path — that human-in-the-loop boundary is intentional and stays.
- Auto-landing on escalation. We are not loosening the `hardEscalation` hold.
- Reworking the servitor's content rules, scope mechanism, or cadence (still once per landed phase, write-scoped to `learningsTarget`).

## 3. Design

Reframe Wrap-up from *"a stage welded to the in-workflow land"* to *"an obligation owned by the Lead's per-phase loop, satisfied by exactly one servitor pass per landed phase."* Two small changes plus a contract.

### 3a. Template change — surface the wrap-up material and the land decision
The Workflow currently returns `{ phase, landed, escalated, minorsFiled, landResult, servitorResult }`. Two additions:

1. **Return `auditLog`.** The servitor needs the phase's verdicts + findings + escalations. Today `auditLog` is internal to the run; the Lead cannot feed a post-land servitor without it. Add `auditLog` to the returned object.
2. **Make the land decision explicit (never silent).** Replace the `if / else if` with an exhaustive decision that always logs and always returns a reason, e.g. a `landDecision` field with one of: `"landed"`, `"held:escalation"`, `"held:nothing-merged"`. The third case (the secondary gap) now logs `Holding the land for phase N: no task merged cleanly (see escalations).` and routes to the Lead's hold path like any other hold.

The auto-land path is otherwise unchanged: when the Workflow lands, it still runs Wrap-up in-flow and returns a populated `servitorResult` (so the Lead does nothing further).

### 3b. Runbook change — Lead completes the Wrap-up after a manual land
Add to [`SKILL.md`](../../skills/war/SKILL.md) the per-phase escalation/manual-land path:

> After you resolve the escalation with the user and the manual land lands `integration/phase-N` → working with a green gate, **if the Workflow did not already wrap up** (`servitorResult` is absent), spawn `war-servitor` to capture learnings — write-scoped by `WAR_WORKTREE=<learningsTarget>` — fed the returned `auditLog`, the `escalated` list, and **the resolution decision** (what the user decided and how the fix went). This is the same capture the in-flow Wrap-up performs, just Lead-driven; it mirrors the Lead-driven manual land.

The Lead already knows `learningsTarget` (from Setup) and holds the Workflow's return value, so all inputs are in hand. The servitor is invoked exactly as the in-flow stage does (same `agentType`, same `SERVITOR_RESULT` schema, same write-scope), only as a direct `Agent` call rather than a Workflow `agent()` call.

### 3c. The contract (idempotency)
The Lead enforces, per phase: **at most one servitor wrap-up runs, and at least one runs whenever the phase lands.**

- Workflow auto-landed (`landDecision === "landed"`, `servitorResult` populated) → **Lead does nothing** (already wrapped up).
- Workflow held, Lead lands manually → **Lead runs the servitor** (post-land, gate green).
- Phase never lands (escalation unresolved / abandoned) → **no wrap-up** (correct — nothing landed).

The guard against double-capture is simple: the Lead runs the post-land servitor **only when the Workflow's `servitorResult` is absent.**

## 4. Affected files
- `skills/war/assets/workflow-template.js` — add `auditLog` to the return; make the Land decision exhaustive (`landDecision` + a log on every branch, including the no-merge case). ~6–10 lines.
- `skills/war/SKILL.md` — add the post-manual-land Wrap-up step to the per-phase / Checkpoint flow, with the once-per-phase guard. Update the invariant list to state the land-path-agnostic Wrap-up rule.
- `skills/war/references/design.md` — note the invariant under §4 (Per-phase flow) / §10 amendments; record a `v0.4.1` amendment.
- `skills/war/references/schemas.md` — document the augmented Workflow return shape (`auditLog`, `landDecision`) if return shape is specified there.

## 5. Validation criteria
- A phase landed via the **escalation/manual** path produces **exactly one** `war-servitor` pass, writing learnings to `learningsTarget`. (Reproduces the observed `P6` scenario → now non-empty.)
- A phase auto-landed by the Workflow still produces exactly one wrap-up, in-flow — **no double capture** (Lead's guard holds).
- The Land decision is **never silent**: every run logs `landed` / `held:escalation` / `held:nothing-merged`, and a `gate_failed` lone task surfaces as a hold, not a no-op.
- `workflow-template.js` still passes the AsyncFunction syntax-check (the template is not standalone Node):
  `node -e "const s=require('fs').readFileSync(p,'utf8').replace(/^export const meta/m,'const meta');new (Object.getPrototypeOf(async function(){}).constructor)('agent','parallel','pipeline','log','phase','args','budget',s)"`
- The augmented return object is documented and consumed by the SKILL.md runbook (no orphaned field).

## 6. Alternatives considered
- **(B) Template second pass / `landedExternally` arg.** The Lead re-invokes the per-phase Workflow (or a wrap-up-only Workflow) after the manual land; the template detects an already-landed phase and runs only Wrap-up. *Rejected:* spinning up a whole Workflow run to spawn one servitor is heavyweight, and the `auditLog`/escalation state still has to be passed in as args — so it adds a code path and a new arg for no real benefit over a direct `Agent` call by the Lead.
- **(D) Capture-on-hold.** Run a servitor at the moment the land is held, before returning to the Lead. *Rejected:* at hold time the resolution is unknown — the user's decision and the fix outcome (the most valuable learnings) haven't happened yet. It would capture only half the story.
- **Approach A (chosen).** Lead-driven post-land Wrap-up. Mirrors the already-intended Lead-owned manual land, keeps the template simple, and captures learnings when the decision + fix are freshest in the Lead's hands.

## 7. Open decisions
1. **Version label.** Recommend **v0.4.1** (a fix; behavior gap + additive return fields, backward compatible). Confirm vs. v0.5.0.
2. **`landDecision` granularity.** Three values (`landed` / `held:escalation` / `held:nothing-merged`) proposed; confirm whether a finer reason (e.g. distinguishing `gate_failed` from `conflict` in the no-merge case) is worth the extra branch, given `escalated[].reason` already carries it.
