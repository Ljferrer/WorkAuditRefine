---
name: dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash
description: "A bare git status hash misses a second edit to a dirty file, so fingerprint blob hashes from a -z status"
metadata:
  node_type: memory
  type: project
  keywords:
    - worktree fingerprint
    - git status porcelain
    - hash-object
    - stdin-paths
    - symlink
    - readlink
    - no-filters
    - status -z
    - tamper detection
    - content-sensitive
  provenance: code-verified
  slug: dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2
  tags:
    - war
    - hooks
    - git
    - audit
    - fingerprint
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-23T09:44:20.056Z
---

# To detect change in a dirty worktree, hash content, not just the status text

**Rule.** `git status --porcelain` text is identical before and after a second edit to an already-modified file. Fingerprint HEAD, the `-z` status bytes, and a blob hash of every path status lists.

**Plan deviation, approved as latitude (ADR-worthy only if the slice wording is ever tightened).** The plan slice said to hash `git status --porcelain=v1 -uall`. The landed `fingerprint` in `hooks/audit-tree-fingerprint.sh` hashes more. The plan-faithfulness seat approved it as intent-consistent work above the slice floor.

**The details that cost the rounds** (all in `blob_lines` and `fingerprint`):
- Use `status -z`. The newline form C-quotes a path with a space, a double quote, a backslash or a control byte, even under `core.quotePath=false`, and such a path cannot then be hashed.
- A rename or copy record carries its source path as an extra NUL field. Skip that field and name the new path.
- Use `git hash-object --no-filters`. A clean filter would run (git-lfs writes under `.git/lfs`), and an eol filter would hide a line-ending-only edit.
- Batch with `--stdin-paths`, one call per worktree. That reader ends a path at a newline, strips a trailing CR, and C-unquotes a line starting with a double quote (it dies on a raw name). Give such paths their own `hash-object -- <path>` call.
- Test `-L` before `-f`. `hash-object` follows a symlink and reads the target. A retarget to a same-content file would then go undetected, and a link to a directory reads as absent. Hash `link-` plus the sha256 of `readlink` text instead. A security-seat Minor found this; the fix landed before the tip.

**Locate-cue (verify still present before acting).** `blob_lines` and `fingerprint` in `hooks/audit-tree-fingerprint.sh` (rows c1 to c13 in its test), found at landed tip d66961d9 on `dev/2026-10-20-rea-artifact-evidence`. Row c11's label claims "target never read" but only proves a retarget escalates. No row pins the never-read half.

Related: [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].
