---
name: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
description: "assert-guard-specificity-in-diff.sh routinely flags secondary/defensive die-guards as Minor/follow-up when only the exit code (not the message) is asserted, or a case is missing entirely"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization@phase-1
  provenance: code-verified
  slug: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
  phase: github-issue-lifecycle-and-run-bookkeeping-mechanization/t1.1+t1.2+t1.6 + red-team-plan-vs-state-grading-and-probe-sandboxing/t1.3
  keywords: 
    - guard-specificity
    - assert-guard-specificity-in-diff.sh
    - uncovered guard
    - stderr message assertion
    - same-diff test
    - die guard
    - exit code only
    - follow-up finding
    - defensive path
    - assert-no-repo-escape.sh
    - escape guard
  tags: 
    - gate-audit
    - test-fidelity
    - shell
    - floor-script
  related: 
    - "[[guard-specificity-extract-msg-mis-extraction-shapes]]"
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
  created: 2026-07-09
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Guard-specificity floor: secondary/defensive die-guards routinely land as Minor/follow-up "uncovered"

`assert-guard-specificity-in-diff.sh` (verify still present before acting — found at
`skills/war/assets/assert-guard-specificity-in-diff.sh` in this checkout) is an advisory-only
gate-audit floor (ADR 0005 — never mints a MergeResult status, never blocks a merge) that flags a
new `die`/stderr guard as "uncovered" unless a same-diff test asserts the guard's message
substring, not just the exit code.

**Recurring pattern, 3 instances in one phase alone** (`github-issue-lifecycle-and-run-bookkeeping-
mechanization`, phase 1 gate-audit):

- **t1.1** (`gh-preflight.sh`): the load-bearing fail-loud mismatch guard WAS message-asserted, but
  two tooling guards (api-read-failure, empty-login) asserted exit code 2 only, and two guards had
  **zero** test coverage — the zero-arg usage error and the "auth switch failed" path (the stub
  never drove the switch to fail).
- **t1.2** (`assert-issues-filed.sh`): the three primary verdict-route guards were message-asserted,
  but the network/bad-JSON/preflight-mismatch exit-2 cases asserted exit code only, and the entire
  epic-issue-verification branch (mirroring the well-tested task-issue branch) had no test at all.
- **t1.6** (`snap-shared-docs.sh`): both primary REFUSE guards were message-asserted, but none of
  the arg-parse guards (usage, `--repo` validation, `..`-traversal) or exit-2 tooling guards
  (scratch-worktree creation, checkout/add/merge/push failures) had same-diff coverage.
- **4th recurrence** (`red-team-plan-vs-state-grading-and-probe-sandboxing`/t1.3,
  `assert-no-repo-escape.sh`, the new post-run escape guard): the load-bearing exit-code contract
  (0/1/2, the floor-family boundary the SKILL.md caller routes on) was fully covered and green, but
  `run_guard()` in the test harness ran the guard under `>/dev/null 2>&1`, so all 9 die/escape
  stderr messages were unasserted and the 4 argument-parsing die paths had no test case (message OR
  exit code) at all. Graded Minor, disposition `absorb` (not `follow-up` this time — same-file,
  mechanical, no version slot / ponytail comment touched, so cheap enough to fold into the same
  task rather than defer). Referent not found in this checkout @ phase
  red-team-plan-vs-state-grading-and-probe-sandboxing/t1.3 (worktree predates that branch's merge) —
  verify `skills/red-team/assets/assert-no-repo-escape.sh` and its `.test.sh` before citing specifics.

Every instance graded **Minor, disposition `follow-up`, non-load-bearing** — the plan's explicitly
enumerated acceptance-criteria test cases were always present and correct; the gap is always on
guards the plan's test spec did not name (defensive/secondary paths).

**Why durable:** this is not a one-off defect but the floor operating as designed against a common
authoring gap — new shell scripts tend to get solid coverage on the primary happy-path and the one
named negative case, but skip same-diff message assertions (or any test at all) for tooling-error
and argument-parse guards. Expect this Minor/follow-up finding on **any** new shell script with
more than 2-3 die guards, every time the test suite is scoped tightly to the plan's named cases.

**How to apply (authoring):** when writing a new floor/gate shell script with die/exit-2 guards
beyond the plan-named acceptance cases, add cheap same-diff cases for the deterministically
fixture-triggerable ones (usage errors, `--flag` validation, `..`-traversal, a stubbed-tool-failure
case) asserting the stderr message substring, not just the exit code — this preempts the routine
follow-up finding. Guards that require sabotaging real tooling (mid-operation git failures) are
reasonably left uncovered per the same-diff scope precedent above.

**How to apply (auditing):** this pattern is expected friction, not evidence of a weak
implementation — grade Minor/follow-up (never Critical/Major) when the plan's named acceptance
criteria are all met and covered; see [[guard-specificity-extract-msg-mis-extraction-shapes]] for
the floor's own extraction-heuristic ceiling (a separate, orthogonal source of false
positives/negatives on top of this genuine-gap pattern).

## Recurrence 5 — packaging floor + submodule floor (phase "Floor fixes", plan `2026-07-12-floor-script-correctness`, landed `dev/2026-07-12-floor-script-correctness`, 2026-07-12)

Two more instances, both gate-audit findings (`gateEvidence:true`), both Minor-or-lower, both
`note`/non-blocking, confirming the pattern generalizes beyond the four scripts named in the
origin instances:

- **Task 1** (`assert-packaging-in-diff.sh`): the arg-count usage die (line ~89) gained a new
  `[--advise-vacuous]` token in its message this diff; no same-diff test asserts the exact usage
  substring. Graded Minor — cosmetic help-text change to a pre-existing secondary die-path, the
  new feature itself (cases 18-22) is thoroughly covered.
- **Task 3 gate-audit** (`assert-no-submodule-mutation.sh`): the new exit-2 blob-read-failure die
  guard (`die "git config --blob failed reading '$branch:.gitmodules'" 2`) has no same-diff test
  asserting its stderr — but this one is the **plan-ratified deferred validation** (the plan slice
  explicitly sanctioned deferring it, backstopped by a documented /red-team sandbox probe), so it
  is expected-and-approved, not merely the routine gap.

**Refined guidance:** the routine version of this finding (a defensive/secondary die-guard added
incidentally alongside a plan-named feature, with no test spec calling for it) and the
plan-ratified-deferral version (a guard the plan itself named as intentionally untested, with a
documented reason) look identical in the gate-audit output — both show as an "uncovered" guard.
Before grading, check whether the plan slice or its End-state explicitly discusses the specific
guard; if so, cite the ratification and grade Nit/informational rather than Minor/follow-up.

> archived 2026-07-11: resolved — moved to archive (recurrence 5 added 2026-07-12; still archived, not restored)
