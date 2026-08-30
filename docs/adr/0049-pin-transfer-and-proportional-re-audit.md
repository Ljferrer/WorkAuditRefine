# Pin transfer and proportional re-audit — verification cost follows the risk class

**Status:** accepted (ratified by
[the plan](../plans/2026-08-30-engine-concurrency-and-pin-transfer.md), decisions D1/D2/D3/D6,
pins PIN-4/PIN-9/PIN-10/PIN-15; originating incidents: issues #1913 and #1897)

A WAR phase paid full-panel audit cost for work that carried no new audit risk. Two shapes of
that waste composed. In the measured phase, about 22 of 33 minutes of merge-queue wall-clock was
panel re-audit serialised inside the integration lock, most of it re-reading content the panel
had already approved (issue #1913). At the same time `run.maxParallel` throttled each fan-out
site on its own, so nested wave and roster fan-outs multiplied to roughly N² agents in flight —
7 observed at N=4 (issue #1897). The first defect spends verification where none is owed. The
second lets the engine spend concurrency it never agreed to. Both are the same question asked
twice: what does this unit of work actually cost to verify, and who is allowed to spend it.

## Decision

**Verification cost is proportional to risk class.** An approval is a claim about a diff, not
about a SHA, so it may be carried to a new SHA whenever a mechanical predicate proves the diff
did not change in a way the approving seat judged. Carrying it is **pin transfer**. Concurrency
is the same principle on the spending side: one counter, not one per site. Three forms follow.

### 1. Seat-approval transfer — the footprint-subset ace diff

After a wave-side advisory-polish (`--ace`) commit, the orchestrator compares the commit's
**git-derived** changed-file list against the file set of the findings the panel already judged.
When the changed set is a subset of that footprint, only the seats that raised those findings
re-run. Every other seat's approval transfers to the ace SHA unchanged. Any file outside the
footprint re-runs the full panel, and so does an absent or empty git set, a `files_changed`
cross-check mismatch, or a re-running seat that detects a file outside the claimed set (D3,
PIN-18). The agent's self-report is a cross-check, never the source.

The rule is stated to the seat itself, in the standing auditor card
([`agents/war-auditor.md`](../../agents/war-auditor.md), the `## Pin transfer` section): "only
the seats that raised those findings re-run; every other seat's approval transfers to the new
sha unchanged", and the re-running seat owes an independent check — "run `git diff --name-only
<sha>^ <sha>` yourself and compare", setting `scopeBreach: true` on excess. The engine mirrors
that duty into the dispatched delta-scaled re-audit prompt
([`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js), the
`DELTA-SCALED RE-AUDIT` clause).

### 2. Rebase pin transfer — the patch-id-equal, conflict-free rebase

At the merge slot the refiner requires a conflict-free rebase, then compares
`git patch-id --stable` of the **task's own diff**: dispatchBase→tip before the rebase, and
integration-tip→tip after. Equal patch-ids mean the rebase carried the approved content
unchanged, so the whole panel's pin transfers to the rebased tip and no panel re-convenes in the
lock. A mismatch falls back to the in-lock full-panel re-audit for that one task — today's
behaviour, byte for byte (D2, PIN-1). The record stores `reauditedTip`, `rebasedTip` and both
patch-ids, so a later audit re-verifies the transfer without replaying the rebase (PIN-14).

The literal predicate first proposed — a whole-tree `git diff <reauditedTip> <rebasedTip>` — was
replaced with patch equality on the operator's confirmation, because the rebased tree contains
every earlier task's merged changes and so is non-empty for every task after the first.

One arm precedes the equality test. If the post-rebase task diff is empty, the task had at least
one commit at the pre-rebase tip, and `git cherry` matches every task commit upstream, the task
records `merged` with an `already_upstream` provenance field naming the matched task commits —
no panel and no content merge (PIN-16). Its git legs run against the pre-rebase task tip. An
empty diff with zero task commits, an unmatched patch, or an empty pre-rebase patch-id fails
**closed** to a hard escalation: `git patch-id --stable` prints nothing on an empty diff, so
empty-equals-empty must never transfer a pin (#1895).

The canonical arms and wire shape live in the `PIN_TRANSFER` schema and the merge-slot
pin-transfer region of `workflow-template.js`; the ledger is `pinTransfers` there. The merge-floor
retry loop is out of scope and stays in-lock and full-panel (D4).

### 3. Global dispatch semaphore — one ceiling for the whole run

`run.maxParallel` is a **global** ceiling: at most N agent dispatches in flight across the entire
run, not per fan-out site. One counting semaphore (`makeSemaphore`) sits at the single leaf
dispatch seam (`dispatch()` in `workflow-template.js`), through which every agent call passes —
workers, auditors, aces, fix workers, refiners, servitors, gate-audit seats. Per-site `batched()`
calls retire or sit under it, never beside it (D1, PIN-4).

Two semantics are load-bearing. The permit is taken immediately around the leaf `agent()` call
and released in a `finally`, so a rejected or thrown dispatch never leaks one. No enclosing slot
— wave thunk, merge slot, audit round — ever holds a permit while it awaits a nested dispatch, so
the ceiling can never deadlock a run whose wave width exceeds N (PIN-15). With the knob absent,
`dispatch()` calls `agent()` straight through and the path is byte-identical to an unconfigured
run today (PIN-3).

### Guardrails that bound all three forms

- **No approval is ever accounted at a SHA the task gate did not pass.** The gate runs at the ace
  tip before any re-audit or transfer; a red gate forward-reverts the ace commit, the task merges
  its approved pre-ace tip, and findings demote per their dispositions — never a hold (PIN-12,
  PIN-2).
- **Unanimity survives in transferred form.** The `pinTransfers` ledger names every seat as
  transferred or re-ran, with its own SHA (PIN-10).
- **No soft markers.** A pin-transfer outcome never rides an in-band field on a hard-escalating
  wire status, and `PIN_TRANSFER` is its own schema rather than a widening of `MERGE_RESULT`, so
  no status enum, `HARD_ESCALATION_REASONS` member, or `KNOWN_LAND_DECISIONS` member moves for it
  (PIN-6).
- **Degrade-to-today.** Every refusal path — footprint excess, patch-id mismatch, probe error —
  lands on current behaviour, so the worst case is what the engine already did (PIN-1).

## Considered options

- **Re-audit every SHA, always (rejected — the status quo).** Correct, and the measured cost is
  two thirds of merge-queue wall-clock spent re-reading approved content inside a serial lock.
- **Transfer a pin on a bare conflict-free rebase (rejected).** A clean rebase proves no textual
  conflict, not that the task's own diff survived unchanged. Patch equality proves the property
  the approval actually rests on.
- **Let a seat judge whether its approval carries (rejected).** Transfer is mechanical by design.
  A judgment call here would ask a seat to reason about other seats' footprints, and the auditor
  card says so plainly: transfer "is mechanical, never a judgment call you are asked to make".
- **Keep the per-site throttle and lower N (rejected).** The composition is multiplicative, so
  the true ceiling stays unpredictable at every nesting depth, and lowering N throttles the
  shallow sites hardest. One counter at one seam is the only shape that states a ceiling truly.

## Relationship to prior ADRs

- [ADR 0013](0013-commanders-intent-and-disposition-routing.md) — disposition routing owns what
  happens to findings a transfer or a reverted ace leaves behind; this ADR changes who re-reads,
  never how a finding routes.
- [ADR 0017](0017-packaging-floor-docker-gate-ratified-backstops.md) — no check, gate, floor or
  backstop is waived by any transfer form; a refused transfer restores the full panel rather than
  skipping it.
- [ADR 0041](0041-audit-evidence-precedence.md) — the per-claim-shape evidence ladder; the
  gate-green precondition here is the evidence a transferred approval rests on.
