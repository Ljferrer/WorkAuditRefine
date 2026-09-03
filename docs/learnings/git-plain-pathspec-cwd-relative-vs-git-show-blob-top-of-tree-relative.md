---
name: git-plain-pathspec-cwd-relative-vs-git-show-blob-top-of-tree-relative
description: "A plain `git diff -- <path>` pathspec is cwd-relative but `git show rev:<path>` is top-of-tree; anchor the diff side with `:(top)<path>`."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - git pathspec
    - cwd-relative
    - top-of-tree
    - ":(top)"
    - git diff --name-only
    - git show rev:path
    - fail-open floor
    - subdirectory invocation
    - assert-budget-raise-cited.sh
    - merge-path floor
  provenance: code-verified
  slug: git-plain-pathspec-cwd-relative-vs-git-show-blob-top-of-tree-relative
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/2.1
  tags: 
    - war
    - git
    - shell
    - floor-script
    - gotcha
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-08-26T10:18:58.559Z
---

# `git diff -- <path>` is cwd-relative; `git show rev:<path>` is not. Pin both consistently

**Rule:** a plain pathspec given to `git diff` (or any pathspec-taking git command) resolves
against the current working directory prefix. A `rev:path` blob read (`git show`) always
resolves against the top of the tree. A script that uses the same repo-root-relative path
string in both places is inconsistent unless the diff side is top-anchored with git's
`:(top)<path>` magic, or both sides are made cwd-relative together.

**Why it matters:** `skills/war/assets/assert-budget-raise-cited.sh` filters
`git diff --name-only "$base...$branch" -- "$BUDGET_FILE"` on a fast path and later reads
`git show "$rev:$BUDGET_FILE"`. Invoked from a subdirectory, the unanchored diff matched
nothing, `touched` came back empty, and the floor exited 0 at the fast-path guard. That is
the fail-open class the floor exists to close. The `git show` half would have worked from
anywhere, so the bug was invisible until the two paths were compared.

**The fix (in place):** the fast-path line reads
`git diff --name-only "$base...$branch" -- ":(top)$BUDGET_FILE"`, with a comment block above
it naming the `:(top)` anchor.

**How to apply:** any script that both filters `git diff` / `git log` by a fixed
repo-root-relative path and reads a blob at `rev:<same path>` needs the diff-side pathspec
top-anchored. Never assume "same string, same resolution". A test harness driven only through
`--repo <dir>` / `git -C <dir>` always runs at the repo root and will not exercise cwd
sensitivity; add a fixture that invokes from a subdirectory if this shape recurs.

**Locate-cue:** `skills/war/assets/assert-budget-raise-cited.sh`, the "Fast path" comment
block and the `":(top)$BUDGET_FILE"` diff line.
