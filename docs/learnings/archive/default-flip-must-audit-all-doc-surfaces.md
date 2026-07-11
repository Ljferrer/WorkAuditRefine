---
name: default-flip-must-audit-all-doc-surfaces
description: "Default flip: sweep ALL doc surfaces; assert old absent"
metadata: 
  node_type: memory
  type: project
  keywords: [stale prose, config table, schema example, old value absent, cross-reference drift, copy-annotate, scope narrowing, guardrail wording]
  slug: default-flip-must-audit-all-doc-surfaces
  phase: F06/p2-t3
  tags: 
    - documentation
    - defaults
    - plan-completeness
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Default-flip task: authoritative surface ≠ all documentary surfaces

**Rule:** a default (or guardrail statement) lives on at least four surface types — the authoritative preset/config table, field-reference prose ("the current default is X"), illustrative JSON/schema examples, and consuming skill files that copy-annotate it. A fifth: inbound cross-references in sibling sections of the SAME doc. A gate that only asserts the NEW value's presence in the authoritative table passes while the rest go stale — it must also assert the OLD value is ABSENT.

**How to apply:** a "flip/narrow default X" task must enumerate all surface types (or state "update all references across the design doc and any skill that annotates it"). Same discipline when a statement's *scope* is narrowed (carved exception), not just when its value flips.

Instances, all resolved/historical: F06/p2-t3 `covenPolicy` `auto`→`all` left prose/JSON/SKILL.md at `auto`; #310 T1's §5.4 reword stranded §5.6's cross-ref (worktree-sync caveat: [[land-local-follower-ref-can-lag-sync-before-next-phase]]); catalog-auto-roster task2 carved a `thorough`-preset exception into design.md §8 while SKILL.md kept the flat `<3x` guardrail.

Related: [[plan-affected-file-list-doc-completeness-vs-correctness]], [[source-comment-lags-emitted-prompt-after-rewrite]]

> archived 2026-07-11: resolved — moved to archive
