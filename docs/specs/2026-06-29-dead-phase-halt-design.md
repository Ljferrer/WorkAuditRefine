# Dead-phase halt — never advance the DAG past a phase that didn't run

**Status:** proposed (design) — from the 2026-06-29 agent-architecture audit (finding M1), resolved by grilling

WAR's Lead launches one phase Workflow ([`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js)) per phase and acts on its returned envelope `{ landed, escalated, …, landDecision }`. **Every halt rule keys on a field _inside_ a success-shaped return** — the in-Workflow `hardEscalation` check ([`workflow-template.js:409-410`](../../skills/war/assets/workflow-template.js#L409)) reads `escalated[].reason`, and the Lead's "hard escalations always halt" rule ([`SKILL.md:44`](../../skills/war/SKILL.md#L44)) fires on three named reasons. If the phase Workflow instead **throws, times out, or returns null/garbage**, there is no `landDecision` to read. Under `--afk` the Checkpoint rule is "post + `PushNotification`, then proceed", so the lazy reading of an empty result is _"nothing landed, move on"_ — **silently advancing the DAG past a phase that never ran its audit/merge gates.** This is the inverse of a loud failure, and it is the one confirmed defect whose failure mode can ship un-audited code.

The asymmetry is the tell: **agent-level** nulls are already handled ([`:130`](../../skills/war/assets/workflow-template.js#L130), [`:264`](../../skills/war/assets/workflow-template.js#L264)); only the **phase-level** dead Workflow is not.

## 1. Context — the three failure surfaces

A "dead phase" is not one thing. Three distinct surfaces produce an unusable result, and **they do not share a detection mechanism**:

| # | Surface | Concrete example | Only catchable by |
|---|---|---|---|
| 1 | In-script uncaught throw | the `throw` at [`:94`](../../skills/war/assets/workflow-template.js#L94) (underivable branch/worktree), or any latent script bug | a top-level `try/catch` _inside_ the script |
| 2 | Infra death / timeout / hang | sandbox OOM, wall-clock timeout, the Workflow tool itself failing, the script never returning | only the Lead, reading a non-`completed` task-notification |
| 3 | Shape-invalid / null return | the script returns, but `landDecision` is missing / garbage / `null` | the Lead, validating the returned envelope |

No single mechanism covers all three: an in-script `catch` cannot fire if the sandbox is dead (#2), and a Lead-side rule is the only thing that observes #2 at all. **The design therefore needs both mechanisms, and they cover disjoint surfaces — not redundancy.**

## 2. The pivotal constraint — resume, not re-run

Re-running a dead phase is **not** idempotent at the task level. `done`/`succeeded` are fresh in-memory Sets each run ([`:105-106`](../../skills/war/assets/workflow-template.js#L105)) and `nextWave()` starts from empty, so a **fresh** re-invocation re-spawns workers for _every_ task — including ones that already merged into the integration branch before the phase died. Only git _provisioning_ is idempotent (`ensure-*` reuses), not the work/audit/merge.

The harness's `Workflow({resumeFromRunId})` is the correct recovery primitive: it replays cached completed `agent()` results and re-runs only the dead tail. This is both safe (no re-spawn of merged tasks) and convergent (a deterministic throw re-hits the same throw on resume and falls through to terminal). **Resume requires the dead phase's git state (worktrees, integration branch, `_refinery`) to remain on disk** so the cached results stay consistent with reality.

## 3. Resolved design tree

| # | Decision | Choice | Rejected alternative |
|---|---|---|---|
| 1 | Scope | All three surfaces, **both** mechanisms (in-script `catch` + Lead rule) | Lead-only (loses exception detail); in-script-only (blind to #2) |
| 2 | Detection posture | **Fail-closed allowlist** — a result is "good" only if `completed` **and** `landDecision ∈` the known set; anything else halts | Fail-open denylist — re-opens M1 for any un-enumerated failure shape |
| 3 | Vocabulary | **Split by recoverability**: `held:phase-incomplete` (retryable) vs `held:workflow-error` (terminal) | One term + cause field (the split drives different behavior, so it earns two terms) |
| 4 | Retryable behavior | **Bounded auto-resume** via `resumeFromRunId` under `--afk`, then halt | Always-halt-label-only (no autonomy); fresh re-run (re-spawns merged tasks) |
| 5 | Classification | **Completed-ness discriminator** — not-`completed` → retryable; `completed`-but-broken or self-reported-exception → terminal | Cause parsing (fragile; mis-classification is safe anyway, so it buys little) |
| 6 | Retry budget | **`run.roundLimit`** (default 3), reused; resume unavailable → terminal | Hardcoded `N=1`; a new config knob (another mirrored constant) |
| 7 | Exhaustion end-state | **Stays `held:phase-incomplete` (retries-exhausted)** → HARD halt | Convert to `held:workflow-error` (erases the infra-vs-code signal the human needs) |
| 8 | State on death | **Preserve all git state, skip teardown** (forced by #2/#4 + the env-blocked "keep for inspection" philosophy, [`SKILL.md:46`](../../skills/war/SKILL.md#L46)) | Run teardown — would break resume and destroy inspection evidence |

**Mis-classification is safe in both directions** (decision 5): calling a terminal failure "retryable" wastes one bounded resume then halts; calling a transient blip "terminal" halts instead of self-healing. Neither errs toward M1's danger (an un-gated advance). That is what frees the discriminator from needing a precise cause oracle.

## 4. Mechanics

### 4.1 In-script mechanism — top-level `try/catch` (surfaces #1, #3)

Wrap the phase body — from the task branch/worktree derivation ([`:91`](../../skills/war/assets/workflow-template.js#L91), so even the `:94` throw is caught) through the final `return` ([`:472`](../../skills/war/assets/workflow-template.js#L472)) — in a single `try/catch`. On catch:

```js
} catch (err) {
  // A dead phase that self-reports. Partial landed/escalated are whatever
  // accumulated before the throw; teardown is NOT run (state kept for resume/inspection).
  return { phase: ph.id, landed, escalated, minorsFiled, landResult: null,
           servitorResult: null, auditLog,
           landDecision: 'held:workflow-error',
           workflowError: { message: String(err && err.message || err), stack: err && err.stack } }
}
```

This converts an uncaught rejection (which the Lead would see only as a non-`completed` notification, i.e. misclassified retryable) into a **terminal, self-reported** result carrying the exception — the only surface where the script can hand the human a stack trace.

> `held:workflow-error` is set **directly** by the catch, bypassing `decideLand()` ([`land-decision.mjs:13`](../../skills/war/assets/land-decision.mjs#L13)). It must **not** be added to `HARD_ESCALATION_REASONS` — that set governs the _normal-completion_ hold computation; wiring `workflow-error` into it would make `decideLand` return `held:escalation` and clobber the direct set. The two dead-phase terms are a layer _above_ the escalation machinery, not members of it.

### 4.2 Lead-side mechanism — fail-closed envelope check (surfaces #2, #3)

On each phase Workflow notification, before any "land / hold / advance" reasoning, the Lead classifies (fail-closed):

```
KNOWN_LAND_DECISIONS = { landed, held:escalation, held:nothing-merged,
                         held:land-failed, held:phase-incomplete, held:workflow-error }

if notification.status != "completed":
    → held:phase-incomplete            # surface #2 — did not run to completion (RETRYABLE)
elif result missing / unparseable / landDecision ∉ KNOWN_LAND_DECISIONS:
    → held:workflow-error              # surface #3 — completed but broken (TERMINAL)
else:
    → result.landDecision              # normal handling, incl. the catch's held:workflow-error
```

### 4.3 Outcome handling

- **`held:workflow-error` (terminal)** — HARD halt **regardless of `--afk`**. Do not advance the DAG. Preserve worktrees + integration branch. Surface the `workflowError` (or "completed with no recognized landDecision") to the human with `PushNotification`. Recovery is human-driven (fix the DAG/args/script bug, then resume or re-decompose).
- **`held:phase-incomplete` (retryable)** —
  - **`--afk`:** auto-resume via `Workflow({scriptPath, resumeFromRunId})` up to `run.roundLimit` total attempts. Log each attempt. On a `landed`/`held:*`-recognized result, resume into normal handling. On exhaustion **or** if `resumeFromRunId` is unavailable → HARD halt, reported as `held:phase-incomplete` **(retries-exhausted)** + `PushNotification`. **Never** fall back to a fresh re-run.
  - **interactive:** surface immediately with **"resume?"** as the recommended action; do not auto-resume.
- **Both:** the run does not proceed to the next phase. A self-healed retry does **not** wake the human (log only); only a final halt notifies.

## 5. Surface changes

| File | Change |
|---|---|
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | Top-level `try/catch` (§4.1) wrapping `:91`→`:472`; return `held:workflow-error` + `workflowError` on catch. No teardown in the catch. |
| [`skills/war/SKILL.md`](../../skills/war/SKILL.md) | Update the return-contract line (`:39`) to add `held:phase-incomplete` and `held:workflow-error` to the `landDecision` set. Add the §4.2 fail-closed classification + §4.3 handling to the Checkpoint section (`:43-46`), explicit that terminal/exhausted halt **regardless of `--afk`** and a dead phase **never advances the DAG**. |
| [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) | Extend the `landDecision` enum docs to the full 6-value set (also closes the pre-existing `held:land-failed` doc-completeness gap noted in the audit's mirror residual). |
| [`docs/adr/0005-dead-phase-halts-the-dag.md`](../adr/0005-dead-phase-halts-the-dag.md) | **Written** (accepted) — ratifies decisions 2/3/5/6 (fail-closed, two-term split, completed-ness discriminator, `roundLimit` as the canonical retry budget). |
| [`CONTEXT.md`](../../CONTEXT.md) | On ratification, add the §6 terms. |

`land-decision.mjs` / `HARD_ESCALATION_REASONS` are **unchanged** (see the §4.1 note).

## 6. New domain terms (for CONTEXT.md)

**Dead phase**:
A phase whose Workflow did not return a usable land decision — it failed to complete (timed out, sandbox died, never returned), self-reported a caught exception, or returned an unrecognized result. Categorically distinct from a phase that completed and *held* its land (`held:escalation` / `held:nothing-merged` / `held:land-failed`). A dead phase **never advances the DAG** and preserves its git state.
_Avoid_: failed phase, crashed phase, errored phase (each names only one of the three surfaces).

**`held:phase-incomplete`** (retryable dead phase):
The phase Workflow did not run to completion (a non-`completed` notification). A bounded resume of the same run may finish it, so the Lead auto-resumes (afk) up to the retry budget before halting. Distinct from `held:workflow-error` because the cause is *infrastructure*, not the artifact.
_Avoid_: timeout (only one cause), retry (the mechanism, not the outcome).

**`held:workflow-error`** (terminal dead phase):
The phase Workflow completed-with-error (broken/`null` return) or self-reported a caught exception; a resume cannot fix it. The Lead halts for the human regardless of mode.
_Avoid_: crash, exception (name only one surface).

**Retry budget** (clarification of an existing term):
`run.roundLimit` (default 3) is WAR's **canonical bounded-retry budget**. It now bounds *three* loops: fix-worker rounds, the land-phase reland CAS, and phase-resume attempts. One knob, one mental model.

## 7. Open risks / implementation notes

- **`resumeFromRunId` is same-session only.** If the **Lead's own process** died (not just the sandbox), this mechanism is unavailable — that is the killed-Lead resume story (`design.md §6`, ledger + open-issues replay), explicitly **out of scope** here. The §4.3 "resume unavailable → terminal halt" branch is the safe degradation.
- **A hang has no in-script catch.** The script never returns, so only the Lead's not-`completed` detection (§4.2) sees it — confirming the two mechanisms are complementary, not overlapping.
- **`landDecision` is an unvalidated bare field.** The fail-closed check (§4.2) is the Lead's prose responsibility; there is no schema gate on the Workflow return. A tiny envelope validator is possible but deferred (the prose allowlist is the floor).
- **Partial merges survive a terminal halt.** A dead phase may have merged some tasks into the integration branch before dying; the branch is preserved for the human to inspect/resume. This is the same "keep for inspection" contract as env-blocked.
- **Resume after a non-completed notification** assumes the harness still holds the run journal. If the journal is gone, treat as resume-unavailable → terminal.

## 8. Non-goals / deferred

- Killed-Lead (process death) resume — covered by the existing ledger replay (`design.md §6`).
- Cause-precise classification (timeout vs OOM vs bug) — rejected (decision 5); the completed-ness discriminator is sufficient and robust.
- A dedicated phase-retry config knob — reuses `run.roundLimit` (decision 6).
- Task-level idempotency for fresh re-runs — sidestepped by using `resumeFromRunId` instead.
- A schema gate on the Workflow return envelope — deferred (§7).

## 9. Validation criteria

1. **In-script throw is caught.** Forcing the `:94` derivation throw (omit `planSlug`+`runId`+explicit branch) yields a returned `{ landDecision: 'held:workflow-error', workflowError }`, **not** an unhandled rejection / non-`completed` notification.
2. **Fail-closed on a non-`completed` notification.** Simulate a failed/killed phase Workflow → the Lead classifies `held:phase-incomplete`, never "nothing landed, advance."
3. **Fail-closed on a garbage return.** A result with `landDecision: 'banana'` (or `null`) → `held:workflow-error`, HARD halt.
4. **Bounded auto-resume.** A retryable phase auto-resumes ≤ `roundLimit` times under `--afk`, then halts as `held:phase-incomplete (retries-exhausted)`; a phase that recovers on resume proceeds normally and does **not** notify the human.
5. **Terminal halts regardless of mode.** `held:workflow-error` halts the DAG even under `--afk`.
6. **State preserved.** After any dead phase, the task worktrees and integration branch are still present (teardown did not run).
7. **No fresh re-run.** Recovery only ever uses `resumeFromRunId`; resume-unavailable degrades to a terminal halt, never a fresh phase invocation.
