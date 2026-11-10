---
name: plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false
description: "A plan can mandate literal test-comment prose asserting an 'only'/uniqueness claim that a code trace of the live function shows is false — it lands uncorrected anyway because the checkable End state is a structural absence-grep, not a content-accuracy check, and the right audit disposition is 'note', not 'absorb', since fixing the wording would deviate from the plan's explicit mandate"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false
  phase: "land-advance-exit-contract-truth/Phase 1, Task 1.2 (#1037) +1 recurrence (runbook-and-standing-record-coherence/Phase 1, Task 1.6, 2026-07-24)"
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
    - route identity rests on
    - inference no longer follows
    - two silent exit-3 routes
  tags: 
    - war
    - audit-pipeline
    - test-coverage
    - calibration
    - provision-worktrees
    - plan-fidelity
  created: 2026-07-24
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-25T06:17:55.101Z
---

# A plan-mandated "only silent route" claim in a test comment can be false by code trace — still `note`, never `absorb`

**Status: RESOLVED.** The live T2.9 census now proves route identity in two steps and names the
real discriminators. The durable rule below stands.

**The rule:** when a plan's task slice mandates literal prose for a checkable End state, and that
prose later proves inaccurate against a code trace, "the End state's structural check passed" and
"the prose is accurate" are two different facts — check both. A structural check passing is not
prose accuracy. The correct audit disposition for a plan-mandated inaccuracy is `note`
(informational, non-blocking), never `absorb`/auto-fix; a rewording belongs to a future doc-truth
pass explicitly scoped to the wording, not the landing task.

**What happened:** plan `2026-07-24-land-advance-exit-contract-truth` Task 1.2 replaced the T2.9
census comment in `skills/war/assets/provision-worktrees.test.sh` with a count-free invariant that
called the push-error branch "the only SILENT exit-3 route". A trace of `cmd_land_advance` in
`skills/war/assets/provision-worktrees.sh` showed a **second** silent `exit 3`: the post-push
origin-readback-mismatch arm on the push-**success** path. The plan mandated the wording verbatim,
and End-state-4's floor only checked that the old string was gone and the new paragraph was
case-ID-token-free — never its factual accuracy. Auditors traced the code and correctly disposed it
`note`: rewording would deviate from the plan's mandated text, which is the Lead's call.

**Why:** fixing the headline falsehood does not make the supporting inference rigorous. A later
task corrected the census to name both silent routes, but kept a "route identity rests on
(b)+(c)+(d) TOGETHER" conclusion that no longer followed from the corrected premise. Auditors again
disposed it `note`, since it was the plan's own mandated shape.

**Resolved in the live census:** the T2.9 case-comment block (immediately preceding
`PAIR9="$(setup_origin_pair)"` in `skills/war/assets/provision-worktrees.test.sh`) now proves route
identity in TWO steps — (b)+(d) exclude the LOUD routes; (c)+(e) then discriminate between the two
silent ones — explicitly naming (c) push-declined and (e) origin-tip-unchanged as the
discriminators. Both the headline uniqueness falsehood and the non-following-inference wrinkle are
fixed.

**Former anchors (both search strings are now gone from the file):** the T2.9 block comment's
invariant sentence in `skills/war/assets/provision-worktrees.test.sh` (search
`the only SILENT exit-3 route`, later "route identity rests on (b)+(c)+(d) TOGETHER"); the
post-push readback-mismatch line in `cmd_land_advance`, `skills/war/assets/provision-worktrees.sh`
(search `[ "$actual" = "$new_sha" ] || exit 3`).

Related: [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (same family — plan-mandated
literal prose can go stale/inaccurate by construction; disposition `note`, never a fix demand);
[[closure-rationale-infeasibility-claim-needs-code-trace-not-assertion]] (same construct family —
`cmd_land_advance`'s declared-backstop un-fixturable arms; a different claim, same "trace before
trusting" discipline).

> archived 2026-08-30: resolved — moved to archive
