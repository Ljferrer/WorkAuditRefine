---
name: mirrored-prose-row-parenthetical-inversion
description: "Mirror parenthetical describes error's code, not the row's own; inversion fixed"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: mirrored-prose-row-parenthetical-inversion
  phase: submodule-inc1/T3
  tags: 
    - documentation
    - prose-mirror
    - exit-codes
    - schemas
    - nit
    - audit-finding
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# Mirrored prose row parenthetical inversion

**Rule:** the `(exit N from the script, not exit M)` slot in a status-row bullet describes what `error` looks like relative to this status — ask "which code does `error` have?", never "which code does this row have?". If the source row and the new row share the same exit code, the parenthetical is IDENTICAL in both; template-copying the sibling and swapping the numbers inverts the slot's meaning.

Fixed: the `submodule-blocked` bullet in `skills/war/references/schemas.md` now reads `(git/ref problem — exit 2 from the script, not exit 1; submodule-blocked is exit 1)`.

**Why:** the swapped numbers read plausibly and every authoritative surface (refiner.md, workflow-template.js) stays correct, so only the prose drifts — easy to miss, rated Minor.
**How to apply:** when cloning a sibling prose row, rewrite (don't mechanically invert) any contrast parenthetical against the counterpart's actual code.
Related: [[verbatim-mirror-directive-context-mismatch-at-destination]]

> archived 2026-07-04: resolved — moved to archive
