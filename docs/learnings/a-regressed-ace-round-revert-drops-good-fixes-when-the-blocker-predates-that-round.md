---
name: a-regressed-ace-round-revert-drops-good-fixes-when-the-blocker-predates-that-round
description: "A regressed ace round is reverted whole even when its blocker came from an earlier round, so check where the blocker entered"
metadata:
  node_type: memory
  type: project
  keywords:
    - ace ladder
    - forward-revert
    - collateral revert
    - Ignore-for-now
    - git log -S
    - regression attribution
    - absorb loss
    - fix round
  provenance: agent-unverified
  slug: a-regressed-ace-round-revert-drops-good-fixes-when-the-blocker-predates-that-round
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-1
  tags:
    - war
    - ace-ladder
    - audit
    - process
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T13:13:40.146Z
---

# A whole-round ace revert can discard good fixes and keep the blocker

**Status.** Every fact below comes from the phase-1 audit log, not from git objects (the servitor has no Bash).
The landed-tip read confirms only that the lost items exist again at the tip.

**What the log shows (task 1.1).**
- Ace round a2 (2bf73e66) carried four unrelated absorb fixes, then the next re-audit blocked on a Major.
- The engine forward-reverted all of a2 (64ba4682). Round a3 (b9d71094) was later reverted the same way (e423309d).
- At b9d71094, three seats said the Major predated a2. They cited `git log -S` showing the rule entered at 7706016e, a round-0 commit.
- The a3 fixer's Ignore-for-now said "the a2 revert removed the change the Major sat on". Seats called that premise false at the pin.
- The reverts put back four gaps that a2 had closed: an `aceStage` catch with no range registration, multi-commit regressions that still bisect, a null `revert_range` key, and an unused parameter.
- Those items came back as fresh findings in later rounds and in the phase-close polish.

**Second Ignore-for-now trap in the same run.** Several fixers deferred stale doc sentences as "owned by Task N".
Seats checked Task N's slice and found it never named those sentences. The deferral had no owner.
Polish fixed most of them, so the deferral cost rounds but lost nothing at land.

**Hypothesis (agent-unverified).** The engine's revert unit is the whole ace round, so it cannot tell which round introduced a blocker.
If the blocker is older than the round, the revert removes good fixes and the blocker stays.
The ladder then re-raises both, which costs rounds.

**How to apply.**
- When a round regresses, find where the blocking construct entered (`git log -S '<construct>'`) before you accept "this round caused it".
- If the blocker is older, treat the reverted round's fixes as lost work and re-queue them by name.
- Before you accept "Task N owns it", read Task N's plan slice for the exact sentence.
- Check every Ignore-for-now premise against the pinned blob, not the commit body.

**Locate-cue (verify still present before acting).** At landed tip b0c2e25, `skills/war/assets/workflow-template.js` holds the re-landed items: `registerRangeRevert(r, null)` in the ace catch arms, `multiRegressWhy` and `tipStranded`.

Related: [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]], [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[a-dispatch-context-key-that-names-an-action-must-ride-only-the-dispatches-that-run-it]].
