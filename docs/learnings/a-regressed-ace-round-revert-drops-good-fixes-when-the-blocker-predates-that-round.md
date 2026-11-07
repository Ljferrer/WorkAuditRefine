---
name: a-regressed-ace-round-revert-drops-good-fixes-when-the-blocker-predates-that-round
description: "A regressed ace round is reverted whole even when its blocker came from an earlier round, so check where the blocker entered"
metadata:
  promoted: dev/2026-10-28-blocked-ace-and-merge-provenance@phase-1
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
    - pre-ace probe
    - preAceProbe
    - pre-existing blocker
    - dropped test rows
  provenance: agent-unverified
  slug: a-regressed-ace-round-revert-drops-good-fixes-when-the-blocker-predates-that-round
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-1 + 2026-11-04-late-defects-fixed-in-run/phase-5 (task 5.1, update)
  tags:
    - war
    - ace-ladder
    - audit
    - process
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-11-05T23:48:36.976Z
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

## Update: the batch re-audit now probes first (2026-11-04-late-defects-fixed-in-run, phase 5, task 5.1)

**What changed (code-verified at landed tip 86335b32).**
- `preAceProbe` in `skills/war/assets/workflow-template.js` dispatches one read-only probe seat per Critical/Major blocker of a regressed batch re-audit.
- The probe asks one question: does this blocker already exist at the pre-ace tip?
- `yes`: the absorbs stay aced, the blocker joins the late-fix pass, and a `probe-cleared` row goes to `pinTransfers`.
- `no`: today's revert. `unknown` or a dead seat: today's revert, and the blocker still queues as a behavior late defect.
- The whole-range revert of a multi-commit ace sees only blockers the probe did not clear.
- The seat rules live in `skills/war/references/finding-class.md`.

**What is still open.**
- Closed by #2629: the `aceBisect` subset and `aceReentry` re-audits probe too, each against its own pre-dispatch tip (`preSub`, `preRe`).
- A probe-cleared blocker is not remembered. A later subset or re-entry re-audit that re-raises it probes it again, and `queueLateRow` drops the duplicate row. A re-raise outside the ace ladder still reverts with no probe.
- A dead or `unknown` probe can spend the origin's whole `fixRounds` on a defect the revert removed. On the final phase that becomes a `late-defect` hold. The plan (PIN-11) chose this cost.

**Second trap in this phase: a forward-revert takes the round's test rows too.**
Forward-revert 810087f2 removed two guard rows that ace bc249a64 had added: "a base red at another sha" and "mixed answers".
The next re-ace did not restore them, and its commit body did not list them under Ignore for now.
A test-fidelity seat found the gap by diffing the test file against the reverted commit.
Both rows are back at the landed tip. Audit finding resolved in a fix round before land, recorded as pattern, not live instance.
Rule: after a forward-revert, diff the reverted commit's test files against the re-ace and re-add each row by name.

Locate-cue (phase 5, widened by #2629): verify still present before acting. #2629 (commit 7b362c8d) added the `subSeats` and `reS` calls of `preAceProbe` and their two `late-defect: probe` rows. `preAceProbe` and its call on the `reSeats` line in `workflow-template.js`, and the `late-defect: probe` rows in `skills/war/assets/workflow-template.late-defect-4.test.mjs`, found @ landed tip 86335b32.

Related: [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]], [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[a-dispatch-context-key-that-names-an-action-must-ride-only-the-dispatches-that-run-it]], [[turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held]].
