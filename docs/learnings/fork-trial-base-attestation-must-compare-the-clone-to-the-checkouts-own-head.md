---
name: fork-trial-base-attestation-must-compare-the-clone-to-the-checkouts-own-head
description: "A trial base check against the plan's cited base fails every convert-mode and stacked-branch trial"
metadata:
  node_type: memory
  type: project
  keywords:
    - fork trial
    - base attestation
    - base mismatch
    - infra-failed
    - convert mode
    - WIP commit
    - rev-parse HEAD
    - comparand
    - fork-trials.md
  provenance: code-verified
  slug: fork-trial-base-attestation-must-compare-the-clone-to-the-checkouts-own-head
  phase: 2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (task 1.1)
  tags:
    - war
    - fork-trials
    - interview
    - attestation
    - plan-faithfulness
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:34:40.113Z
---

# A trial's base attestation must compare the clone to the checkout's own HEAD

**What happened.** The first draft of `skills/war-strategy/references/fork-trials.md` stamped a trial
`infra-failed — base mismatch` when the clone's `rev-parse HEAD` differed from "the base the plan's
claims cite". Plan D15 says only that a trial's base is the sha observed in the clone. It names no
comparand. The worker supplied one, and it could not be met.

**Why it fails.** Convert mode makes a WIP commit of the draft before the clone. The clone HEAD is then
the WIP sha. A WIP commit cannot be cited inside the draft it contains. A bare-invoke checkout that
sits ahead of the cited master sha fails the same way. The one retry clones the same HEAD and fails
again. An `infra-failed` row backs only `[assumed:]`, so no convert-mode trial could ever settle a fact.

**Evidence trail.** Three audit seats (correctness, plan-faithfulness, cascading-impact) reached this
by reading the doctrine, as a Major in round 1. No trial run exhibited it. The fix round was checked
again in round 2 and round 3, and the Major did not recur.

**The fixed rule.** Read `git -C <repo> rev-parse HEAD` before the clone, and again after any
convert-mode WIP commit. Compare the clone's HEAD to that value. The row records the clone sha as
`base: <sha>`. The doctrine now says a plan's earlier measurement base is never the comparand.

**How to apply.** When a doctrine compares an observed value to an expected one, walk the procedure's
own earlier steps first. Ask whether a step (WIP commit, overlay, rebase) makes the expected value
unreachable. Do this for each invocation mode before you ratify the comparand.

**Open note, unruled.** A settled row's `base:` can be a local WIP sha that a later `/red-team` replay
cannot reach (backstop B1). Treat a missing base at replay as a transport failure, not a refutation.

**Locate-cue (verify still present before acting).** `skills/war-strategy/references/fork-trials.md`,
search `**Base attestation.**`. Grounded at the phase-1 integration tip via the run-scoped `_refinery`
worktree (rung 2). The finding itself was resolved in a fix round before land, so this records the
pattern, not a live defect.

Related: [[audit-log-finding-can-be-stale-by-land-time]],
[[escape-guard-cannot-see-a-read-only-trial-run-in-the-wrong-cwd]].
