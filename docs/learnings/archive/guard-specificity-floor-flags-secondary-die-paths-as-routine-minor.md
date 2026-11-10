---
name: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
description: "assert-guard-specificity-in-diff.sh routinely flags secondary/defensive die-guards as Minor/follow-up when only the exit code (not the message) is asserted, or a case is missing entirely — AND its coverage rule (a same-diff test line must contain the WHOLE source message literal) makes even an honest, distinguishing partial-substring stderr assertion of a die message with an unexpandable trailing $var tail unsatisfiable, so a genuinely well-tested guard can still be stamped 'uncovered' (a floor ceiling, not a real gap)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: guard-specificity-floor-flags-secondary-die-paths-as-routine-minor
  phase: github-issue-lifecycle-and-run-bookkeeping-mechanization/t1.1+t1.2+t1.6 + red-team-plan-vs-state-grading-and-probe-sandboxing/t1.3 + 2026-08-06-escape-guard-exit-contract/1.1
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
    - unexpandable variable tail
    - full message literal
    - honest partial substring
    - floor ceiling
  tags: 
    - gate-audit
    - test-fidelity
    - shell
    - floor-script
  related: 
    - "[[guard-specificity-extract-msg-mis-extraction-shapes]]"
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
  created: 2026-07-09
  modified: 2026-08-15T06:42:36.673Z
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
---

# Guard-specificity floor: secondary/defensive die-guards routinely land as Minor/follow-up "uncovered"

`assert-guard-specificity-in-diff.sh` (verify still present before acting — found at
`skills/war/assets/assert-guard-specificity-in-diff.sh`) is an advisory-only
gate-audit floor (ADR 0005 — never mints a MergeResult status, never blocks a merge) that flags a
new `die`/stderr guard as "uncovered" unless a same-diff test asserts the guard's message
substring, not just the exit code.

**Recurrences 1-5 (one line each):**

1. `gh-preflight.sh`: two tooling guards asserted exit code 2 only; the usage error and "auth switch failed" paths had no test.
2. `assert-issues-filed.sh`: network/bad-JSON/preflight-mismatch exit-2 cases asserted exit code only; the epic-issue-verification branch had no test.
3. `snap-shared-docs.sh`: no arg-parse guard (usage, `--repo`, `..`-traversal) or exit-2 tooling guard had same-diff coverage.
4. `assert-no-repo-escape.sh`: `run_guard()` ran under `>/dev/null 2>&1`, so all 9 stderr messages were unasserted and 4 arg-parse dies had no case; graded Minor, `absorb`.
5. `assert-packaging-in-diff.sh` usage die and `assert-no-submodule-mutation.sh` blob-read die: no stderr assertion; the second was a plan-ratified deferred validation.

Every instance graded **Minor (or lower), non-load-bearing** — the plan's explicitly
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
reasonably left uncovered.

**How to apply (auditing):** this pattern is expected friction, not evidence of a weak
implementation — grade Minor/follow-up (never Critical/Major) when the plan's named acceptance
criteria are all met and covered; see [[guard-specificity-extract-msg-mis-extraction-shapes]] for
the floor's own extraction-heuristic ceiling (a separate, orthogonal source of false
positives/negatives on top of this genuine-gap pattern). The routine gap and a plan-ratified
deferral look identical in gate-audit output: before grading, check whether the plan slice or its
End-state explicitly discusses the specific guard; if so, cite the ratification and grade
Nit/informational rather than Minor/follow-up.

## Recurrence 6 — the floor's own coverage rule makes a well-tested guard un-satisfiable when its message has an unexpandable variable tail

This recurrence is a **different shape** from recurrences 1-5: this is not a missing or
exit-code-only assertion — the test case does its best honest job and the floor still stamps it
"uncovered."

A task added one new die guard to `skills/red-team/assets/assert-no-repo-escape.sh`:
`[ -s "$baseline_file" ] || die "--baseline file is zero bytes (a truncated or failed snapshot
write — infra error, never a pass): $baseline_file" 2`. The suite's case 28
(`skills/red-team/assets/assert-no-repo-escape.test.sh`) runs the guard through the harness's
`run_guard_err` (captures stderr, unlike the discard-everything `run_guard_args`) and asserts
`grep -qF -- 'zero bytes (a truncated or failed snapshot write' "$ERR28"` — a real, distinctive,
failable substring that pins WHICH die produced the exit 2 (verified: it would fail if the
`-e`/`-f`/`-r` die produced the 2 instead).

In `assert-guard-specificity-in-diff.sh` (`extract_msg` then the `case
"$test_added" in *"$gmsg"*) ;; *) uncovered=...` loop), the floor records the message as the
**entire** source literal — including the trailing `: $baseline_file` — because `extract_msg`
only truncates at a `%` or drops a bare-variable message, neither of which applies here. Coverage
then requires that whole literal, **including the unexpandable `$baseline_file` variable
reference**, to appear verbatim as a substring of an added test line. No honest test asserting
against *captured runtime stderr* can ever contain that literal `$baseline_file` text (stderr
carries the expanded path, not the variable name), so this specific die guard's message can
**never** satisfy the floor's coverage rule no matter how good the test is. The floor therefore
exits 1 and stamps the guard "uncovered" even though case 28 is a strictly stronger test than
"exit code only."

**Refines the guidance further:** recurrences 1-5 established "no message assertion at all" and
"exit-code-only assertion" as the routine, expected gap. This recurrence establishes a **third,
narrower class**: a die message containing an interpolated variable in its trailing text is a
**structural** floor ceiling, not an authoring gap — even the best-possible test (a distinctive
prefix substring against captured stderr) cannot clear it. When auditing, before grading an
"uncovered" stamp as a routine Minor/follow-up authoring gap, check whether the underlying source
message has a trailing `$var`/`${var}` reference; if so, and the same-diff test already asserts a
real prefix/distinctive substring against captured stderr, grade it as an accepted floor ceiling
(Nit/informational, evidence-only) rather than a coverage gap to fix — padding the test with the
literal, never-emitted `$var` text purely to satisfy the substring rule would be gaming the floor,
not improving coverage.

**Locate-cue (verify still present before acting):** the die guard at
`skills/red-team/assets/assert-no-repo-escape.sh` (the `-s "$baseline_file"` line inside the
`--baseline`-only arg-parse validation block); the covering test at
`skills/red-team/assets/assert-no-repo-escape.test.sh`, case 28 (search `EMPTY28`); the floor's
coverage loop at `skills/war/assets/assert-guard-specificity-in-diff.sh` (search `uncovered=`).

> archived 2026-08-25: resolved — moved to archive
