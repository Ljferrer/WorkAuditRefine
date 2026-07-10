---
name: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
description: "assert-guard-specificity-in-diff.sh routinely flags secondary/defensive die-guards as Minor/follow-up when only the exit code (not the message) is asserted, or a case is missing entirely"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
  phase: github-issue-lifecycle-and-run-bookkeeping-mechanization/t1.1+t1.2+t1.6
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
