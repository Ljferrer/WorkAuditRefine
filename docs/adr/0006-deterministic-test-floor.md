# A deterministic test-floor guards every task that requires a test

**Status:** accepted (design ratified; implementation tracked by the spec below)

A worker is accepted on its `status` enum alone ([`workflow-template.js:264`](../../skills/war/assets/workflow-template.js#L264)); nothing in code checks that it wrote a test. So a worker can add **zero tests**, leave the inherited suite green, pass the refiner's gate (which proves the *suite* is green, not that *this slice* added a test), and the only floor is N parallel auditors each independently noticing the diff has no test (agent-architecture audit finding M2, 2026-06-29). A future reader will ask why a separate shell guard exists for something the auditors already review, and why the refiner re-audits a task after adding a test; this records it. Full mechanics: [the design spec](../specs/2026-06-29-worker-test-floor-design.md).

## Decision

Add a **deterministic test-floor**: a task that *requires* a test must change at least one test file in its diff, enforced in code, before it can merge. Five sub-decisions:

1. **Coarse floor, not precise mapping.** The floor asserts *a* test file changed, not that the *specific* mapped test is present. Precise mapping would need a structured per-task `mappedTests` field the plan provides only as free-text. The coarse floor catches "zero tests"; the auditor panel keeps the **semantic ceiling** (the right test, exercising the slice, not weakened/skipped). Floor + ceiling is the organizing split.

2. **A tested shell guard, not a prompt or a self-report.** Enforcement is `assert-test-in-diff.sh` with its own `.test.sh` — the same idiom as `validate-auditor-git.sh` / `provision-worktrees.sh`. The Workflow sandbox has no shell, so it cannot run `git diff` itself; the only field it can inspect directly is the worker's self-reported `files_changed` — circular, since that is the field a test-skipping worker gets wrong. The *script* is the code-gate; the agent that runs it is a thin runner.

3. **Run by the refiner at merge-task.** The refiner already has shell and runs the gate there; it runs the assertion alongside, pre-merge. No new agent type, no extra spawn. The auditor anti-cheat lens remains the earlier (now-redundant) catch, so nothing is unguarded.

4. **Fail-closed exemption.** A new per-task `requiresTest` boolean defaults `true`; the Lead sets it `false` at decompose for tasks that legitimately add no test (docs, config, a VERIFY-no-op whose scenario the base already covers). The opt-out is explicit and auditable, mirroring ADR-0002's fail-closed posture.

5. **`no-test` routes a bounded fix + full re-audit.** A floor miss is not a hard halt — it routes a fix-worker to add the test, then re-runs the **full** audit panel (the coarse floor cannot tell a real test from a vacuous one; the panel can), then re-merges, sharing the task's `roundLimit` budget. Exhaustion escalates `no-test` (a hard reason).

## Considered options

- **Precise per-task mapped-test (rejected).** Stronger, but requires a structured `mappedTests` field and re-decompose work; the auditor already owns "is it the right test."
- **A prompt instruction to the refiner / a Workflow-side `files_changed` check (rejected).** The first is still prompt-deep; the second trusts the worker's self-report — the actor that skipped the test.
- **A dedicated pre-audit check-seat (rejected).** Earlier catch, but one extra agent spawn per task per round; the refiner placement is free.
- **Immediate hard-escalate on `no-test` (rejected).** Simpler, but halts on a trivially-fixable omission; a bounded fix is more autonomous.
- **Re-run only floor + gate after the fix (rejected).** Cheaper, but the coarse floor cannot detect a vacuous added test (`test_nothing(): pass`) — re-opening green-by-weak-test, a sibling of the bug being fixed. The full re-audit is the guard.

## Consequences

- Test-presence stops being "every parallel auditor must catch it" and becomes a single deterministic floor; the auditor panel is a redundant earlier check, not the sole one.
- `MERGE_RESULT.status` gains `no-test`; `HARD_ESCALATION_REASONS` gains `no-test` (both hand-mirrored copies + the drift-guard); the task DAG gains `requiresTest`.
- The serial merge queue is preserved — the re-audit is a localized sub-loop inside the refiner's per-task handling, not a fold-back into the parallel work wave. A per-task `fixRounds` counter must carry from the audit loop into refine so the budget is shared, not doubled.
- The floor's test-file pattern must stay aligned with the resolved gate's test discovery, or a task could add a file the floor counts but the gate never runs.
- The coarse floor is deliberately weak by design; non-vacuity stays the auditor's semantic job, now backed by a deterministic floor.

## References

- Design spec: [`docs/specs/2026-06-29-worker-test-floor-design.md`](../specs/2026-06-29-worker-test-floor-design.md) — full mechanics, surface changes, validation criteria.
- Audit finding **M2** (2026-06-29 agent-architecture audit) — the originating defect.
- [ADR-0002](0002-scope-by-agent-type.md) — the fail-closed posture precedent.
