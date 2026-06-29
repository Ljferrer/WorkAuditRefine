# A dead phase halts the DAG — fail-closed, split by recoverability

**Status:** accepted (design ratified; implementation tracked by the spec below)

The Lead acts on each phase Workflow's returned `{ …, landDecision }` envelope, and every halt rule
keys on a field *inside* a success-shaped return. A phase Workflow that throws, times out, or
returns null/garbage carries no `landDecision` — so under `--afk` the Lead read it as "nothing
landed, move on" and **silently advanced the DAG past a phase that never ran its audit/merge gates**
(agent-architecture audit finding M1, 2026-06-29). A future reader will ask why dead-phase handling
is split into two outcome terms and why recovery resumes rather than re-runs; this records it. Full
mechanics: [the design spec](../specs/2026-06-29-dead-phase-halt-design.md).

## Decision

A **dead phase** — a Workflow that did not return a usable land decision — is a recognized outcome
that **always halts the DAG**; the Lead never advances on an unrecognized result. Four sub-decisions:

1. **Fail-closed detection.** A phase result is accepted only if the task-notification is `completed`
   **and** `landDecision` is in the known set; every other shape (non-completed, null, unparseable,
   unknown `landDecision`) halts. Mirrors the auditor git guard's fail-closed posture (ADR-0002).

2. **Two outcome terms, split by recoverability.** `held:phase-incomplete` (the Workflow did not run
   to completion — an *infrastructure* cause a bounded resume may fix) vs `held:workflow-error` (it
   completed-with-error or self-reported a caught exception — an *artifact* cause a resume cannot
   fix). The split exists because the two drive **different behavior** (auto-resume vs immediate
   halt); collapsing them would erase the infra-vs-code signal the human needs to triage.

3. **Completed-ness is the discriminator.** Classification keys solely on whether the Workflow ran to
   completion — the one signal the Lead reliably has — not on parsing the cause (timeout vs OOM vs
   bug). Mis-classification is **safe in both directions** (a wasted bounded resume, or a halt
   instead of a self-heal); neither advances un-gated, so a precise cause oracle is unnecessary.

4. **Recover by resume, bounded by `roundLimit`.** A retryable dead phase auto-resumes the same run
   via `resumeFromRunId` (which replays cached work and re-runs only the dead tail), **never** a
   fresh re-run (not task-idempotent — `done`/`succeeded` are per-run, so a fresh invocation
   re-spawns already-merged tasks). The bound is `run.roundLimit`, now WAR's **canonical retry
   budget** across fix-worker rounds, the land reland-CAS, and phase-resume.

## Considered options

- **One outcome term + a cause field (rejected).** Simpler vocabulary, but the two surfaces drive
  genuinely different recovery (resume vs halt), so the distinction belongs in the outcome itself,
  not a secondary field a reader might ignore.
- **Fail-open denylist (rejected).** Halt only on enumerated bad signals. Re-opens M1 for any failure
  shape not enumerated — the exact class of bug being fixed.
- **Cause-precise classification (rejected).** Map timeout/OOM/bug each to an outcome. Fragile
  (depends on the harness exposing stable cause strings) for no gain, since mis-classification is
  already safe.
- **Fresh re-run instead of resume (rejected).** A fresh phase invocation re-spawns workers for tasks
  that already merged before the death. `resumeFromRunId` is the only safe re-attempt.
- **A dedicated phase-retry config knob (rejected).** Another hand-mirrored constant across the
  no-import sandbox boundary; `run.roundLimit` already expresses "bounded retry."

## Consequences

- The loudest real failure (a phase that throws/times out) becomes the loudest *observed* failure
  instead of the quietest — closing the success-envelope-only blind spot in the halt logic.
- `held:workflow-error` is set directly by the Workflow's top-level `catch` (or synthesized by the
  Lead on a broken envelope) and **bypasses `decideLand()`**; it must **not** be added to
  `HARD_ESCALATION_REASONS`, or the normal-completion path would recompute it to `held:escalation`
  and clobber the direct set.
- A dead phase **preserves its git state and skips teardown** (worktrees, integration branch,
  `_refinery`) — required for resume and matching the env-blocked "keep for inspection" contract.
- The `landDecision` vocabulary grows from four to six values; `SKILL.md`, `references/schemas.md`,
  and `CONTEXT.md` carry the two new terms.
- Killed-Lead (process death) resume is unchanged and out of scope — that remains the ledger +
  open-issues replay (`design.md §6`). `resumeFromRunId` is same-session only, so a dead *Lead*
  degrades to a terminal halt, never a silent advance.

## References

- Design spec: [`docs/specs/2026-06-29-dead-phase-halt-design.md`](../specs/2026-06-29-dead-phase-halt-design.md)
  — full mechanics, surface changes, validation criteria.
- Audit finding **M1** (2026-06-29 agent-architecture audit) — the originating defect.
- [ADR-0002](0002-scope-by-agent-type.md) — the fail-closed posture precedent (auditor git guard).
