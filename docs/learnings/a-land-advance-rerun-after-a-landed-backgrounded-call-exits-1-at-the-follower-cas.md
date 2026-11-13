---
name: a-land-advance-rerun-after-a-landed-backgrounded-call-exits-1-at-the-follower-cas
description: A land-advance rerun after a landed backgrounded call exits 1. Check ls-remote first
metadata:
  node_type: memory
  type: project
  keywords:
    - land-advance
    - rerun
    - backgrounded call
    - update-ref CAS
    - exit 1
    - phantom land failure
    - follower ref
    - idempotent
  provenance: code-verified
  slug: a-land-advance-rerun-after-a-landed-backgrounded-call-exits-1-at-the-follower-cas
  phase: 2026-11-08-pipeline-skills-and-memory-tooling/phase-1
  tags:
    - land
    - refiner
    - provision-worktrees
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T04:26:28.376Z
---

**Fact.** In phase 1 the refiner's first `land-advance` call went to the background, and its push landed.
The refiner then ran `land-advance` again in the foreground.
The second push of the same sha succeeded as a no-op.
Its follower step then ran `git update-ref refs/heads/<working> <new-sha> <pre-push-local>`.
That CAS failed because the local ref already held `<new-sha>`, so the call died with exit 1.
The die text calls this "unexpected" and says "manual intervention required", but the land was real.

**How to apply.**
- If a land call goes to the background, wait for it. Do not start a second land call.
- If a land call exits 1 on the update-ref CAS text, read `git ls-remote origin <working>` and the local ref first.
- If both equal the merge sha, the land is done. Treat it as landed, never as a failure.
- A durable fix would accept a local ref that already equals `<new-sha>` before the CAS. That fix is not in the code at this phase.

**Locate-cue.** Verify still present before acting: the success arm of `land_advance` in `skills/war/assets/provision-worktrees.sh`, the `update-ref failed after successful push` die. Found @ phase 1, tip 759b2c9e.

Related: [[land-local-follower-ref-can-lag-sync-before-next-phase]], [[a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3]] (the exit 3 sibling, archived).
