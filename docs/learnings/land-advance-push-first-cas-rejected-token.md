---
name: land-advance-push-first-cas-rejected-token
description: "CAS reject = [rejected] token; exit 0/2/3/6 contract (6 = wrong-HEAD precheck)"
metadata: 
  node_type: memory
  type: project
  keywords: [compare-and-swap, non-fast-forward, exit code contract, reland, follower ref, ls-remote verify, concurrent runs, wrong-HEAD precheck]
  slug: land-advance-push-first-cas-rejected-token
  phase: clandiso/phase-1
  tasks: t2
  date: 2026-06-25
  tags: 
    - land-advance
    - CAS
    - git-push
    - shell
    - exit-codes
  related: 
    - - provision-ownership-ledger-gates-create-not-teardown
  originSessionId: 4f3e4595-5aaa-40b5-9004-183f4bb53936
---

# land-advance: push-first CAS; classify on `[rejected]` not `non-fast-forward`

**Rule:** `cmd_land_advance` (skills/war/assets/provision-worktrees.sh) pushes first with the named-source form (`git push origin HEAD:refs/heads/<working>`), then advances the local follower ref only after an exit-0 push AND `git ls-remote origin` confirms origin holds `<new-sha>`. Classify a rejected push by the `[rejected]` token — never by `"non-fast-forward"`, which is not reliably emitted; never infer success from absence of `[rejected]` alone.

**Exit contract:** 0 = pushed + local CAS ok; 2 = `[rejected]` seen, another run won — reland; 3 = any other failure, an unresolvable HEAD/<new-sha>, or origin != new_sha after push — escalate / land_stale; 6 = wrong-HEAD precheck refusal (invoked from a worktree whose HEAD is not the merge sha) — nothing pushed, local and origin refs untouched, never a reland.

**Spec residual:** `docs/specs/2026-06-25-concurrent-run-land-isolation-design.md` §5.3 still shows the superseded bare-SHA push + `non-fast-forward` classification; the code is authoritative.

**Why:** keying on the wrong token misroutes CAS losses between reland and escalate.
**How to apply:** wire callers to the 0/2/3/6 contract from the script's header comment; trust only `[rejected]` + exit codes.
Related: [[phase-land-stale-spurious-cas-recovery]], [[land-local-follower-ref-can-lag-sync-before-next-phase]]
