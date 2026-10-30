---
name: git-revert-no-commit-folds-a-staged-index-into-the-commit-so-guard-the-index-and-check-write-tree
description: "git revert --no-commit skips the dirty-index refusal, so staged content rides into the revert commit"
metadata:
  node_type: memory
  type: project
  keywords:
    - revert --no-commit
    - dirty index
    - staged leftovers
    - write-tree
    - rangeRevertScript
    - INDEX-DIRTY
    - TREE-MISMATCH
    - range revert
  provenance: code-verified
  slug: git-revert-no-commit-folds-a-staged-index-into-the-commit-so-guard-the-index-and-check-write-tree
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-1
  tags:
    - git
    - engine
    - ace-ladder
    - revert
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T13:13:08.610Z
---

# `git revert --no-commit` commits whatever is staged

**Fact.** A committing `git revert --no-edit <sha>` refuses a dirty index.
`git revert --no-commit <a>..HEAD` does not refuse: git-revert(1) says the index need not match HEAD.
The revert starts from the current index, so staged leftovers fold into the next `git commit`.
A script that then echoes a success token reports a tree that is not the one it claims.

**How it surfaced.** Phase 1 of `2026-10-28-blocked-ace-and-merge-provenance` moved the engine revert from a tip-only `revert --no-edit` to a range `revert --no-commit <approved>..HEAD`.
Round 1 audit raised it as a Major (security, then correctness and cascading-impact).
The broken guarantee was PIN-17: the revert tree equals the last approved tree.
The real trigger is a dead worker that ran `git add` before its commit failed.
A `git checkout -- .` cleanup does not unstage, so the staged content survives it.
The revert tip then became the next probe's PRE, so the leaked content sat outside every delta-scale diff.

**The fix that landed (two guards, different jobs).**
- Before the revert: `git diff --cached --quiet HEAD` fails ⇒ print `INDEX-DIRTY`, touch nothing.
- After the revert, before the commit: commit only if `git write-tree` equals `<approved>^{tree}`, else print `TREE-MISMATCH`.
- Check `write-tree` (the index the commit would record), not `HEAD^{tree}` after the fact, so a bad tree is never committed.
- Every consumer prompt maps both tokens to its not-ok arm.

**Test lesson.** The first real-git fixture proved tree equality on a clean index only, so it could not fail on this bug.
Add a fixture that stages a foreign file first, and assert no success token and an unchanged HEAD.
See [[weak-test-assertion-passes-without-feature-being-exercised]].

**Locate-cue (verify still present before acting).** Found at `skills/war/assets/workflow-template.js` @ phase 1 landed tip b0c2e25: `rangeRevertScript` with the `INDEX-DIRTY` and `write-tree` arms.
The fixtures are the three `2485/ES12 real git:` tests, one each in `skills/war/assets/workflow-template.git-2.test.mjs`, `workflow-template.git-3.test.mjs` and `workflow-template.engine-1.test.mjs`.
The same trap applies to `git cherry-pick -n` and any other `--no-commit` sequencer verb (agent-unverified generalization).
