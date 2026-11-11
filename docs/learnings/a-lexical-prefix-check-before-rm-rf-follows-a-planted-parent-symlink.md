---
name: a-lexical-prefix-check-before-rm-rf-follows-a-planted-parent-symlink
description: "A lexical prefix check before rm -rf follows a symlinked parent. Compare cd -P"
metadata:
  node_type: memory
  type: project
  keywords:
    - prune
    - rm -rf
    - symlink
    - physical path
    - cd -P
    - record tree
    - audit-fingerprints
    - lexical check
  provenance: code-verified
  slug: a-lexical-prefix-check-before-rm-rf-follows-a-planted-parent-symlink
  phase: 2026-11-08-auditor-and-worker-guard-habits/phase-1
  tags:
    - hooks
    - security
    - testing
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T06:10:11.687Z
---

Task 1.3 added `--prune` to the fingerprint hook, which runs `rm -rf` on record directories.
The first draft checked only that the path sat lexically under the record tree and refused a symlinked leaf.
A worker can write under `$MAIN/.claude/war`, so a planted link at the tree or a parent made `--prune --stale` delete elsewhere.

Fix that landed: compare `cd -P` of the tree with the physical `$MAIN` plus the tree suffix, and exit 2 on a mismatch.

Test trap from the next round: the first symlink row linked the last component in both arms.
A weaker `[ -L "$_pr" ]` guard would pass that row, so it did not prove the parent-link case.
The fix made the tree a real directory under a linked parent, and asserted exit 2 with the old directory still present.
A symlink oracle must isolate each link position the guard claims to cover.

Locate-cue (verify still present before acting): the `is not a real record tree` infra exit in the `--prune` branch of `hooks/audit-tree-fingerprint.sh`, and the PR7 row in `hooks/audit-tree-fingerprint.marks.test.sh` (#2823 split the suite). Found at landed tip 242704f4 @ phase 1.
