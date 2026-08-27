---
name: git-plain-pathspec-cwd-relative-vs-git-show-blob-top-of-tree-relative
description: "A shell floor script that both `git diff -- <path>` filters AND `git show <rev>:<path>` blob-reads the SAME repo-root-relative path string is inconsistent unless the diff pathspec is top-anchored (`:(top)<path>`) — git resolves a plain pathspec against the CURRENT DIRECTORY prefix, while a `rev:path` blob read is always top-of-tree relative, so a subdirectory invocation silently matches nothing on the diff side and the floor exits 0 (bypassed) though the show side would have worked fine"
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

# `git diff -- <path>` is cwd-relative; `git show rev:<path>` is not — pin both consistently

**Code-verified** at landed tip `8b1e0ea6d9db99a8042ebaf34766f8c5c7780617` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, read via the run-scoped `_refinery`
worktree matched by landed-tip grounding rung 2 (`_refinery28`'s `gitdir` physical path contains
the plan slug and its `HEAD` equals the threaded landed tip exactly):
`<repo-root>/.claude/war-worktrees/2026-08-25-engine-reliability-and-filing-fidelity-2026-08-26/_refinery/`.

`skills/war/assets/assert-budget-raise-cited.sh` (a new merge-path floor mirroring
`assert-test-in-diff.sh`'s shape) uses a repo-root-relative constant `BUDGET_FILE` in two places:
a fast-path `git diff --name-only "$base...$branch" -- "$BUDGET_FILE"` filter, and later a
`git show "$rev:$BUDGET_FILE"` blob read. **These two resolve the same string two different
ways.** A plain pathspec passed to `git diff` (and most other git commands that accept
pathspecs) is resolved against the **current working directory prefix** — invoked from any
subdirectory of the worktree, the repo-root-relative pathspec matches nothing, `touched` comes
back empty, and the floor exits 0 at the fast-path guard — the exact fail-open class the floor
exists to close. The `rev:path` blob-read form used by `git show` is **always** resolved against
the top of the tree regardless of cwd, so that half of the script would have worked fine even
from a subdirectory — the inconsistency is invisible until the two paths are compared.

**The fix (present at the landed tip, line 103):** anchor the pathspec with git's `:(top)` magic
— `$git_cmd diff --name-only "$base...$branch" -- ":(top)$BUDGET_FILE"` — which forces
top-of-tree resolution regardless of invocation cwd, matching the `git show` half. Safe under
`git -C <root>` too (the sibling `--repo`-driven test harness always invokes from the repo root,
so a cwd-dependence bug like this can pass its entire test suite and still be live in
production if production ever invokes from a subdirectory).

**Pattern to watch for:** any script that filters a `git diff`/`git log` by a fixed
repo-root-relative path string AND separately reads a blob at `rev:<same path>` needs the
diff-side pathspec top-anchored (`:(top)<path>`) or both sides converted to be cwd-relative
consistently — never assume "the path string is the same, so the resolution is the same." A
test suite driven exclusively through `--repo <dir>`/`git -C <dir>` (which always lands at the
repo root) will not exercise cwd sensitivity — add a fixture invoking from a subdirectory of the
target repo if this shape recurs.

**Locate-cue (verify still present before acting):**
`skills/war/assets/assert-budget-raise-cited.sh`, the "Fast path" comment block, the
`git diff --name-only ... -- ":(top)$BUDGET_FILE"` line (~line 103).
