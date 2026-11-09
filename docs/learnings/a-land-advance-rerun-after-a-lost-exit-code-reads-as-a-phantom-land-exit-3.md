---
name: a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3
description: "RESOLVED (#2657, D1): every land prompt now reads ls-remote and the follower on exit 3 before the error arm, and refiner-recovery.md names the PHANTOM LAND arm"
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
    - landConfirmArm
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
  modified: 2026-11-09T13:22:08.641Z
---

# A land-advance rerun after a lost exit code reads as a phantom land (exit 3)

**RESOLVED (#2657, D1, plan 2026-11-08, 2026-11-09).** The "How to apply" rule below is now the engine's `landConfirmArm`.
Every land prompt carries it at each exit-3 route: if `git ls-remote origin refs/heads/<working>` and `git rev-parse refs/heads/<working>` both print `<merge-sha>`, the refiner returns `landed`, else it takes the error arm.
`skills/war/references/refiner-recovery.md` carries the same rule, and its D4 clause now says the retry exits 0 only when the follower lags and that a follower already at `<merge-sha>` takes the script's PHANTOM LAND arm.
The sections below stay as the record from before the fix.

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

The D4 retry prose in `skills/war/references/refiner-recovery.md` used to say the retry "exits 0 via Task 1.1's already-landed reconciliation".
That held for its own case (a push that landed while the client saw an error, so the follower lags).
It did not cover a lost exit code after a full success. Plan 2026-11-08 D2 (#2657) rewrote the clause, see the top note.

Locate cue: verify still present before acting. Found the phantom and already-landed arms in `cmd_land_advance` (`skills/war/assets/provision-worktrees.sh`) at landed tip `280aaa82`, read through the run's `_refinery` worktree. Re-verified `landConfirmArm` in `skills/war/assets/workflow-template.js` and the Land confirm paragraph in `skills/war/references/refiner-recovery.md` at landed tip f8ea3b11 (plan 2026-11-08 phase 1). This local copy was synced to the repo copy that late-fix 7aed5190 wrote.

Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[land-advance-push-first-cas-rejected-token]], [[reland-loop-contender-less-transient-vs-real-divergence]], [[an-in-run-repo-lesson-edit-leaves-the-same-slug-local-copy-stale]].
