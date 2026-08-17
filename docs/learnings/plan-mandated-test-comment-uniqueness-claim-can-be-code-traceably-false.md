---
name: plan-mandated-test-comment-uniqueness-claim-can-be-code-traceably-false
description: "RESOLVED: plan-mandated uniqueness prose can be code-traceably false; disposition is note, not absorb"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-24-land-advance-exit-contract-truth@phase-1
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

Related: [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (same family — plan-mandated
literal prose can go stale/inaccurate by construction; disposition `note`, never a fix demand);
[[closure-rationale-infeasibility-claim-needs-code-trace-not-assertion]] (same construct family —
`cmd_land_advance`'s declared-backstop un-fixturable arms; a different claim, same "trace before
trusting" discipline).

## Recurrence 1 (2026-07-24, plan `2026-07-24-runbook-and-standing-record-coherence`, Task 1.6)

The campaign carry-over: this plan's Task 1.6 (operator-ratified "Auditor-suggested shape") corrected
the exact sentence flagged above — the T2.9 census in
`skills/war/assets/provision-worktrees.test.sh` no longer claims a single "only SILENT exit-3 route";
it now names both silent routes ("the push-path silent ones (the push-error branch and the post-push
origin-readback mismatch) print nothing, while the rest die LOUDLY..."). **Code-verified** at the
landed tip `3f136c0327713487768aed59f986b665b07f9cb6` (read via the `_refinery` worktree matching that
SHA, gitdir physical path containing this plan's slug —
`.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`): the
corrected paragraph is live at `skills/war/assets/provision-worktrees.test.sh` (search "route
identity rests on (b)+(c)+(d) TOGETHER").

**New wrinkle:** the correction's retained conclusion clause — "route identity rests on (b)+(c)+(d)
TOGETHER" — no longer *follows* from the corrected two-silent-routes premise the way it did under the
old (false) uniqueness premise. None of (b) ls-remote-succeeds, (c) token-distinctness-by-name, or
(d) die-text-absence individually or jointly separates the two *silent* exit-3 routes from each
other (both print nothing, both pass (d)'s die-text-absence check). What actually forecloses the
post-push readback-mismatch arm for T2.9's own fixture is (c)'s empirical fact that the identical
push is pre-receive-DECLINED (`push_rc != 0`, proven by the direct-push probe), plus (e)'s
origin-tip-unchanged check — neither of which the retained inference sentence names as the
discriminator. Two auditor seats (Nit, `note`) again confirmed this stays non-blocking: the text is
still byte-for-byte the plan's own mandated ("Auditor-suggested") shape, and floors (i)/(iii)/(v) are
satisfied regardless of the inference's rigor.

**Pattern reinforced:** correcting a plan-mandated claim's *headline* falsehood (the uniqueness claim)
does not guarantee the claim's supporting *inference* becomes rigorous too — a census/comment can be
factually accurate about *what exists* (two silent routes) while its own "therefore X follows"
sentence quietly stops following from what it now lists. Audit disposition stays `note`: the plan's
mandated wording is latitude the worker must follow, not a worker defect, and rewording the inference
belongs to a future doc-truth pass explicitly scoped to it — not to the task that fixed the
uniqueness claim.

**Resolved in the live census:** the T2.9 case-comment block (immediately preceding
`PAIR9="$(setup_origin_pair)"` in `skills/war/assets/provision-worktrees.test.sh`) now proves route
identity in TWO steps — (b)+(d) exclude the LOUD routes; (c)+(e) then discriminate between the two
silent ones — explicitly naming (c) push-declined and (e) origin-tip-unchanged as the
discriminators. Both the headline uniqueness falsehood and the non-following-inference wrinkle are
fixed; both former anchor search strings are gone from the file. The durable rule above stands.
