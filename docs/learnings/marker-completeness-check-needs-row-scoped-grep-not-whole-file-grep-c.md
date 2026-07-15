---
name: marker-completeness-check-needs-row-scoped-grep-not-whole-file-grep-c
description: "A text-marker completeness/drop detector must grep structurally-scoped rows, not whole-file grep -c — the marker literal can legitimately appear outside the target row and produce a false PASS"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: marker-completeness-check-needs-row-scoped-grep-not-whole-file-grep-c
  phase: lessons-learned-repo-projection-integrity/1.1
  keywords: 
    - grep -c false pass
    - whole-file grep
    - row-scoped predicate
    - marker literal in prose
    - completeness detector design
    - wholesale-drop check
    - do_verify
    - repo row
    - false positive lint
    - text marker
  tags: 
    - shell
    - lint-design
    - drift-guard
    - pattern
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

**Pattern (from `docs/plans/2026-07-14-lessons-learned-repo-projection-integrity.md`, Notes —
"Row-scoped `[repo]` predicate", agent-authored plan rationale, not independently code-verified
at the landed tip: this servitor's session worktree — `<session-worktree>` — was checked out on
an unrelated branch and never showed the new check; only the PRE-existing Rule 2 pattern below
was directly confirmed present).**

When a check must detect "did every instance of marker `X` disappear from a generated document,"
a whole-file `grep -c 'X' file` is the wrong predicate whenever the document can legitimately
*mention* the marker string in a context that is not itself a target instance — e.g. a summary
cell or prose sentence describing "the `[repo]` row" as a concept, not carrying one. A surviving
non-target mention satisfies the whole-file count even after every real target instance is gone:
a false PASS in exactly the direction the check exists to close.

**Fix:** scope the grep to the same structural extraction the rest of the tool already uses to
define "a row" — e.g. `grep -E '^\|' | grep '\[\[' | grep -c '\[repo\]'` (require the line to
first look like a table row before testing the marker), never a bare `grep -c '\[repo\]'` over
the whole file. This repo's own precedent for the *row* pattern (verified present in
`skills/lessons-learned/assets/safe-swap.sh`'s `do_verify`, the `.ll_local_idx` extraction pipe
excluding `[repo]`-marked rows — `grep -E '^\|' "$mem" | grep '\[\[' | grep -v '\[repo\]'`) is the
model to mirror for a *new* same-marker completeness check, rather than inventing a whole-file
shortcut.

**When to apply:** any lint/gate/drift-guard whose pass condition is "marker count > 0" or
"marker count == expected" over a document that also contains natural-language descriptions of
the very marker being counted (a memory/lesson file describing its own bug is the concrete
recurring case in this repo — the campaign's own lesson about `[repo]`-row drops is itself a
document containing the literal string `[repo]`).

Related: [[archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it]] (the concrete
defect this row-scoped check was built to close).
