---
name: ""
description: "case glob misses leading ../; use the full .. equivalence class"
metadata: 
  node_type: memory
  type: project
  keywords: [parent directory escape, case statement glob, sandbox escape, directory climbing, false negative, equivalence class]
  slug: dotdot-pattern-misses-leading-relative-traversal
  phase: 1b (F06 ..-rejection)
  severity: Nit
  tags: 
    - scope-hook
    - glob-pattern
    - path-traversal
    - coverage-gap
  related: "[[scope-hook-servitor-pattern-residuals]], [[dotdot-guard-applies-to-all-agent-types]]"
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

**RESOLVED (instance) — kept as concept anchor.** The shell case pattern `*/../*|*/..` catches embedded and trailing `..` but misses a leading-relative `../` (and bare `..`); to reject all `..` traversal use the full equivalence class `".." | "../*" | *"/../"* | *"/.."`, or document why an adjacent mechanism already denies relative paths.

> archived 2026-07-15: resolved — moved to archive
