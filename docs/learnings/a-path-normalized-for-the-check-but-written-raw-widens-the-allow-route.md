---
name: a-path-normalized-for-the-check-but-written-raw-widens-the-allow-route
description: A guard that checks a normalized path while the write lands at the raw path widens its allow route
metadata:
  node_type: memory
  type: project
  keywords:
    - norm_path
    - backslash
    - windows path
    - posix
    - scope hook
    - allow route
    - path normalization
    - servitor fence
  provenance: code-verified
  slug: a-path-normalized-for-the-check-but-written-raw-widens-the-allow-route
  phase: 2026-11-08-auditor-and-worker-guard-habits/phase-1
  tags:
    - hooks
    - security
    - guards
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T06:10:05.047Z
---

Task 1.2 added `norm_path` so Windows-form paths match the scope globs.
It turns every `\` into `/` and a drive `C:` into `/c`.
On macOS or Linux a `\` is a filename byte, not a separator.
So the check read one path while Write created a different file at the raw path.

Example from the security seat: a worker Write to `/repo/.claude\war-worktrees\run\p1-1.2\x` normalized into a `.war-task` worktree and passed.
The real file was a new backslash-named file in the main checkout root.
The same shape let the servitor create a file outside its memory root.
The ADR 0002 addendum first claimed the change "widens no allow route", which was false.

Fix that landed: keep `raw_path` before normalization, and call `posix_backslash_deny` first in the worker and servitor arms.
It denies a raw path that holds `\` and does not start with a drive `X:`.
A test-fidelity seat then found WP2 and WP3 no longer pinned `norm_path` ahead of the `..` reject, because the new deny caught them first.
The fix added a drive-form order oracle row, so a new early deny needs a fresh oracle for each order it hides (see [[an-early-exit-guard-added-under-existing-tests-hollows-their-negative-assertions]]).

General rule: if a guard rewrites a path to check it, prove the rewrite is the identity on the host OS, or deny every input the rewrite changes.

Locate-cue (verify still present before acting): `norm_path`, `raw_path` and `posix_backslash_deny` in `hooks/validate-worktree-scope.sh`. Found at landed tip 242704f4 @ phase 1.
