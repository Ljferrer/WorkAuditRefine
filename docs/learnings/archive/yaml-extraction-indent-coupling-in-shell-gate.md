---
name: yaml-extraction-indent-coupling-in-shell-gate
description: "Sibling awk indent tokens widen together [RESOLVED]"
metadata:
  node_type: memory
  slug: yaml-extraction-indent-coupling-in-shell-gate
  phase: memory-provenance/p1-t1
  type: project
  tags:
    - shell
    - yaml
    - gate-design
    - robustness
    - fail-closed
    - provenance
  files:
    - hooks/validate-servitor-provenance.sh
  relates:
    - "[[awk-sed-exit-zero-on-no-match-comment-trap]]"
    - "[[frontmatter-tools-negation-check-single-line-only]]"
  created: 2026-06-29
  originSessionId: memory-provenance-war-servitor
---

# Sibling awk tokens sharing one indent assumption must all widen together [RESOLVED]

**Rule:** when two awk/sed tokens in one pipeline encode the same assumption (e.g. "indent is exactly N spaces") in different clauses — a match pattern AND a block-exit guard — grep for ALL occurrences before declaring a fix complete; widening one and leaving a sibling narrow reproduces the bug for a different input shape (tab vs wider-space). Prefer `[[:space:]]`-flexible patterns unless the exact indent IS the invariant; mis-indent should fail closed. Load-bearing test needs 3 ACCEPT fixtures (2-space, 4-space, tab).

Fixed/landed in the `metadata.provenance` awk extraction of `hooks/validate-servitor-provenance.sh` (#247, servitor-provenance-gate-robustness t1): both the match pattern and the `found && /^[^[:space:]]/{exit}` guard are whitespace-flexible.

**Why:** a well-intentioned indent refactor would otherwise silently lock out all servitor writes.
**How to apply:** before shipping a pattern widening, grep the same script for every token carrying the assumption; fixture each indent shape.

Related: [[frontmatter-tools-negation-check-single-line-only]] — same root: flat grep/awk patterns vs structured YAML.
