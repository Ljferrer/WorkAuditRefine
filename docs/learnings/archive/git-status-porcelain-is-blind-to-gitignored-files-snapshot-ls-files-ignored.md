---
name: git-status-porcelain-is-blind-to-gitignored-files-snapshot-ls-files-ignored
description: "git status --porcelain never reports gitignored paths, so a dirty-tree or escape guard must snapshot ls-files --others --ignored and diff it"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: git-status-porcelain-is-blind-to-gitignored-files-snapshot-ls-files-ignored
  phase: 2026-08-25-authoring-doctrine-and-lint-coherence/phase-3 task 3.3
  created: 2026-08-02
  tags:
    - red-team
    - escape-guard
    - dirty-tree
  keywords:
    - git status --porcelain
    - gitignored
    - ls-files --others --ignored
    - escape guard
    - dirty tree
    - ignored-files snapshot
    - IGNORED_ALLOWLIST
---

# `git status --porcelain` is blind to gitignored files

**Rule:** a porcelain-based dirty-tree check misses writes to ignored paths. Snapshot
`git ls-files --others --ignored --exclude-standard` (file level), diff it against a baseline, and
route each path as allowlisted, pre-existing, or a new leak.

**Why:** `git status --porcelain` does not report ignored paths. A probe that leaks a write into
`node_modules/`, a `*.log`, or another gitignored path is invisible to a porcelain-based residue
check. It also adds no ref, so a ref-diff cannot see it either.

**How to apply:** `skills/red-team/assets/assert-no-repo-escape.sh` now records a
`# ignored-files v1` snapshot of `git ls-files --others --ignored --exclude-standard` beside the ref
snapshot, and `--baseline` mode diffs the live ignored set against it. Use the file-level form, not
`--porcelain --ignored`, which collapses whole directories. Route three ways:
- A new ignored file vs. the baseline escapes (exit 1, naming it), even inside a directory the
  baseline already recorded as ignored.
- Pre-existing ignored residue that predates the snapshot is baselined, never refused.
- A small `IGNORED_ALLOWLIST` of glob patterns covers paths the run itself legitimately writes
  (for example its own `.claude/red-team/` scratch).

If you port any dirty-tree guard, do not assume `--porcelain` is a complete check.

Split from [[escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes]].

> archived 2026-08-15: resolved — moved to archive
