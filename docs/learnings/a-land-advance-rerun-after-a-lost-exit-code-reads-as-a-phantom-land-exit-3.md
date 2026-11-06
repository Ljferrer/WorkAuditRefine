---
name: a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3
description: "A land-advance rerun after a fully successful push exits 3 as a phantom land, so read ls-remote instead of rerunning"
metadata:
  node_type: memory
  type: project
  keywords:
    - land-advance
    - phantom land
    - exit 3
    - lost exit code
    - rerun land
    - already-landed reconciliation
    - ls-remote
    - follower ref
    - cmd_land_advance
    - EX_FOREIGN
  provenance: code-verified
  slug: a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3
  phase: 2026-11-04-late-defects-fixed-in-run/phase-7
  tags:
    - land
    - refiner
    - recovery
    - cas
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-06T04:53:43.477Z
---

# A land-advance rerun after a lost exit code reads as a phantom land (exit 3)

`cmd_land_advance` in `skills/war/assets/provision-worktrees.sh` reads the pre-push origin tip first.
If origin equals `<new-sha>` and the local follower `refs/heads/<working>` also equals it, the script dies with exit 3 (phantom land).
If origin equals `<new-sha>` and the follower lags or is absent, it reconciles the follower and exits 0 (already landed).

A fully successful first run pushes and then advances the follower.
So a second run of the same `land-advance` call always hits the phantom arm and exits 3.

**Observed:** at phase 7 the first `land-advance` run pushed `280aaa82`, but the refiner lost its exit code.
The refiner reported the cause as "a shell quirk". That cause is unverified.
The rerun exited 3. The refiner then read `git ls-remote`, saw origin at `280aaa82`, and correctly returned `landed`.

**How to apply:**
- If a land-advance exit code is lost, do not rerun it to learn the result.
- Read `git ls-remote origin refs/heads/<working>` and the local follower instead.
- If both equal the merge sha, the land completed. Return `landed`.
- If a rerun already exited 3 with the phantom message, check ls-remote before you return `error`. Exit 3 here is benign.
- The exit-0 already-landed path covers only a push that landed before the follower update ran.

The D4 retry prose in `skills/war/references/refiner-recovery.md` says the retry "exits 0 via Task 1.1's already-landed reconciliation".
That holds for its own case (a push that landed while the client saw an error, so the follower lags).
It does not cover a lost exit code after a full success.

Locate cue: verify still present before acting. Found the phantom and already-landed arms in `cmd_land_advance` (`skills/war/assets/provision-worktrees.sh`) at landed tip `280aaa82`, read through the run's `_refinery` worktree.

Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[land-advance-push-first-cas-rejected-token]], [[reland-loop-contender-less-transient-vs-real-divergence]].
