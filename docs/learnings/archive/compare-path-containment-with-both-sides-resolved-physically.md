---
name: compare-path-containment-with-both-sides-resolved-physically
description: "A path-containment check must resolve both sides with pwd -P; on macOS mktemp paths under /var alias /private/var and a one-sided resolve gives a false result"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: compare-path-containment-with-both-sides-resolved-physically
  phase: 2026-08-02-redteam-doctrine-and-guards/phase-2 task 2.1 (End state 3)
  created: 2026-08-02
  tags:
    - red-team
    - escape-guard
    - macOS
    - mktemp
  keywords:
    - pwd -P
    - physical path
    - /private/var
    - macOS mktemp
    - symlink alias
    - path containment
    - realpath
    - both sides
---

# Resolve both sides of a path-containment compare physically

**Rule:** resolve both sides of a path-containment compare physically (`cd && pwd -P`) before
comparing. For a file that may not exist yet, resolve its parent dir and reattach the basename.

**Why:** on macOS, `mktemp -d` returns a path under `/var/folders/…`, which is a symlink alias of
`/private/var/folders/…`. Checking one side logically and the other physically gives a false
result. In `assert-no-repo-escape.sh`, the guard refuses a `--snapshot`/`--baseline` artifact path
inside the target repo's working tree (so the porcelain-dirty check does not trip on its own
artifact). A one-sided `pwd -P` made the guard's own in-tree containment case go red, or would let
the mirror-image alias bypass containment entirely.

**How to apply:**

```sh
repo_norm=$(cd "$repo_dir" && pwd -P)
art_norm=$(cd "$(dirname "$artifact")" && pwd -P)/$(basename "$artifact")
```

The artifact file need not exist yet in snapshot mode, so `cd` into its parent first. Mixing `pwd`
and `pwd -P` across the two sides of one comparison is a silent, environment-dependent false
result.

Split from [[escape-guard-ref-diff-must-scope-heads-and-tags-not-remotes]].

> archived 2026-08-15: resolved — moved to archive
