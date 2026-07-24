---
name: plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false
description: "A plan can mandate literal test-comment prose asserting an 'only'/uniqueness claim that a code trace of the live function shows is false — it lands uncorrected anyway because the checkable End state is a structural absence-grep, not a content-accuracy check, and the right audit disposition is 'note', not 'absorb', since fixing the wording would deviate from the plan's explicit mandate"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false
  phase: "land-advance-exit-contract-truth/Phase 1, Task 1.2 (#1037)"
  keywords: 
    - T2.9
    - census comment
    - only silent exit-3 route
    - uniqueness claim
    - count-free invariant
    - route identity
    - provision-worktrees.test.sh
    - cmd_land_advance
    - readback mismatch
    - audit disposition note vs absorb
    - plan-mandated wording
  tags: 
    - war
    - audit-pipeline
    - test-coverage
    - calibration
    - provision-worktrees
    - plan-fidelity
  created: 2026-07-24
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-24T20:53:07.444Z
---

# A plan-mandated "only silent route" claim in a test comment can be false by code trace — still `note`, never `absorb`

**What happened (code-verified — `skills/war/assets/provision-worktrees.test.sh`'s T2.9 block comment
and `skills/war/assets/provision-worktrees.sh`'s `cmd_land_advance`, confirmed via the `p1-1.2` task
worktree — gitdir physical path `<repo-root>/.git/worktrees/p1-1.2` containing this plan's slug, HEAD
`14122d4176ff8afc6cd4b210f93fecf316b55a38`, matching the phase's gate-audit `auditSha`/`gateHeadSha`
with `gateEvidence: true`):** plan `2026-07-24-land-advance-exit-contract-truth` Task 1.2 replaced the
T2.9 census's stale "shared by T2.3/T2.6" sentence with a count-free invariant (issue #1037's
anti-rot goal): "Exit 3 is shared by multiple routes, every one of which dies LOUDLY with
route-naming text — except this one: the push-error branch is the only SILENT exit-3 route (...)".
Tracing `cmd_land_advance` shows a **second** silent (die-less) `exit 3`: the post-push
origin-readback-mismatch arm, `[ "$actual" = "$new_sha" ] || exit 3` on the push-**success** path
(distinct from the push-**error** branch the comment names) — an adjacent comment in the script
itself declares this arm a deliberate, un-fixturable backstop. So both the universal "every other
route dies loudly" claim and the "only silent" claim are strictly false against the live code.

**Why it landed uncorrected anyway:** the plan's own Task 1.2 slice and End-state-4 both mandate this
exact wording verbatim ("the push-error branch is the only **silent** exit-3 route"). End-state-4's
floor only checks that the old `shared by T2.3/T2.6` string is gone and that the replacement
paragraph is case-ID-token-free (`grep 'T2\.'` returns zero over the sentence-scoped span) — it never
checks the invariant's factual accuracy. Two auditor findings (Minor + a duplicate Nit) independently
traced the same code and correctly dispositioned it `note`, not `absorb`: rewording would deviate
from the plan's explicitly mandated text (the Lead's call to make, not a worker's to override
unilaterally), and the readback-mismatch arm is unreachable for T2.9's own fixture anyway (T2.9's
discriminator (c) proves `push_rc != 0`, so the push-success-path readback-mismatch branch never
fires there) — so the (b)+(c)+(d) route-identity logic the census exists to support stays sound
regardless of the prose overclaim.

**The pattern:** when a plan's task slice mandates literal prose for a checkable End state, and that
prose later proves inaccurate against a code trace, "the End state's structural check passed" and
"the prose is accurate" are two different facts — check both. The correct audit disposition for a
plan-mandated inaccuracy is `note` (informational, non-blocking), never `absorb`/auto-fix; a
rewording (e.g. naming both push-path silent routes instead of claiming uniqueness) belongs to a
future doc-truth pass explicitly scoped to the wording, not the landing task.

**Anchors (verify still present before acting):** the T2.9 block comment's invariant sentence in
`skills/war/assets/provision-worktrees.test.sh` (search `the only SILENT exit-3 route`); the
post-push readback-mismatch line in `cmd_land_advance`,
`skills/war/assets/provision-worktrees.sh` (search `[ "$actual" = "$new_sha" ] || exit 3`).

Related: [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (same family — plan-mandated
literal prose can go stale/inaccurate by construction; disposition `note`, never a fix demand);
[[closure-rationale-infeasibility-claim-needs-code-trace-not-assertion]] (same construct family —
`cmd_land_advance`'s declared-backstop un-fixturable arms; a different claim, same "trace before
trusting" discipline).
