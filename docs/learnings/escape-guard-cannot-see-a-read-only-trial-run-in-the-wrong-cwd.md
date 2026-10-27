---
name: escape-guard-cannot-see-a-read-only-trial-run-in-the-wrong-cwd
description: A read-only trial run from the real checkout leaves the escape guard clean and the base check green
metadata:
  node_type: memory
  type: project
  keywords:
    - escape guard
    - assert-no-repo-escape
    - fork trial
    - cwd reset
    - wrong cwd
    - read-only trial
    - false settled
    - clone root
    - Bash cwd
    - same Bash call
  provenance: code-verified
  slug: escape-guard-cannot-see-a-read-only-trial-run-in-the-wrong-cwd
  phase: 2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (task 1.1)
  tags:
    - war
    - fork-trials
    - escape-guard
    - interview
    - attestation
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:35:41.242Z
---

# The escape guard cannot see a read-only trial that ran in the wrong cwd

**The blind spot.** `skills/red-team/assets/assert-no-repo-escape.sh` detects new refs and new files on
the real checkout, once before and once after a trial. A read-only trial command writes nothing there.
The base attestation compares the clone sha to the checkout sha, and they are equal. So a read-only
command that ran in the real checkout passes both checks.

**Why it can happen.** The Bash cwd resets between calls. A `cd <clone>` in one call does not hold in
the next. In bare invoke the private draft is overlaid into the clone only, so the real checkout lacks
it. A command that reads the draft then reads the wrong tree, and the row could record a false
`settled`. The `/red-team` lane has a prevention layer (a `git -C <sandbox>` scope lock). The trial
doctrine had none.

**Evidence trail.** The correctness seat found this by reading the doctrine, as a Minor in round 2
of task 1.1. No trial run exhibited it, so this is a predicted failure. No refuting reading of the
guard or the attestation was found.

**The fix is prose only.** `fork-trials.md` now says to run each command from the clone root in the
same Bash call that defines the cap, for example `cd <scratchpad>/trial-<n> && cap <s> bash -c
'<command>'`. The fenced row command keeps no `cd`. No structure-test pin covers that sentence, and
no check detects a wrong-cwd read-only trial.

**How to apply.** If you build a mechanical trial runner, bind the cwd in code. If you edit the
doctrine, keep the same-call sentence. A write-detecting guard plus a sha check is not proof that the
command read the clone.

**Locate-cue (verify still present before acting).** `skills/war-strategy/references/fork-trials.md`,
search `Clone-root-relative commands`. Grounded at the phase-1 integration tip via the run-scoped
`_refinery` worktree (rung 2). The finding was resolved in a fix round before land, so this records
the pattern and the remaining residual.

Related: [[fork-trial-base-attestation-must-compare-the-clone-to-the-checkouts-own-head]],
[[failed-cd-in-a-compound-command-runs-the-rest-in-the-main-checkout]].
