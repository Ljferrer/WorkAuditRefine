---
name: context-md-doctrine-mirror-can-land-without-a-skill-doc-contracts-drift-guard-row
description: "CONTEXT.md glossary prose that restates canonical ADR doctrine is guarded by a…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: context-md-doctrine-mirror-can-land-without-a-skill-doc-contracts-drift-guard-row
  phase: 2026-08-06-war-strategy-mirror-guards/phase-2 (task 2.2 gate-audit + phase-close polish)
  keywords: 
    - CONTEXT.md
    - skill-doc-contracts.test.mjs
    - ADR 0025
    - mirror registry
    - drift guard
    - D26
    - D28
    - D29
    - glossary mirror
    - doc cascade
    - Intent ceiling
  tags: 
    - doc-cascade
    - adr-0025
    - testing
    - pattern
  created: 2026-08-18
  originSessionId: db0604c4-3009-475d-8db8-5d92ff291ce2
  modified: 2026-08-18T07:59:29.222Z
---

# A CONTEXT.md doctrine mirror needs its own drift-guard row — nothing adds it for you

## The gap (code-verified at repo root, `skills/war/assets/skill-doc-contracts.test.mjs`)

This repo already has the correct idiom for guarding a CONTEXT.md glossary entry against drifting
away from the ADR it restates — construct-anchored extraction (bolded term → next bolded term or
`### ` heading, never a whole-file scan), a non-vacuity assert on the entry's `_Avoid_` line, and
token-anchored regex keys checked on **both** the glossary block and the normalized ADR text.
Confirmed present: `D19` (`**Adjudication**` term ↔ provenance-discipline doctrine), `D26`
(the three audit-evidence glossary terms ↔ ADR 0041), `D28` (compressed glossary entries ↔
canonical-home pointers), `D29` (ADR 0042 hot/cold + budget doctrine mirrored across CONTEXT.md,
CLAUDE.md, and the budget-suite formula). Each of these rows landed in **the same task** that
created or amended the mirror it guards — that is the stated convention (`D26`'s own header
comment: "a new mirror ships its drift guard in the same task — this row is that guard").

Grepping the same file for `0013` or `Intent ceiling` returns **no hits**. CONTEXT.md's
`**Intent ceiling / plan floor**:` entry (around line 658) already independently restates ADR
0013 doctrine and predates this phase — so the gap is not new to Phase 2, but Phase 2 (#1431)
both amended ADR 0013 (a new `## Amendment (2026-08-17)` section) and, per this phase's own audit
findings, extended the same CONTEXT.md entry to describe the Mechanism-latitude / Binding-
guardrails reading — and landed with **no** new drift-guard row. The finding was routed
`disposition: follow-up` (not absorbed), i.e. left open rather than fixed in-phase.

## Why this recurs

The repo's *other* mirror-guard mechanism — the runtime D3-style registry inside
`workflow-template.test.mjs` that binds a standing agent card to its dispatched prompt twin — only
covers **standing-card / dispatched-prompt pairs**. It structurally cannot see a glossary entry.
`skill-doc-contracts.test.mjs`'s rows are the *only* mechanism that can guard a CONTEXT.md ↔ ADR
mirror, and each row is hand-authored per entry — there is no default-deny census that flags an
*unguarded* new mirror the way `D30`'s exact-multiset idiom flags an unguarded new dispatch-args
site elsewhere in the same file.

## How to apply

When a task amends an ADR **and** also restates the change in a CONTEXT.md glossary entry, do not
assume the restatement is guarded — grep `skills/war/assets/skill-doc-contracts.test.mjs` for a
row keyed to that entry (search the entry's bolded term or the ADR number) before treating the
edit as complete. If no row exists, either author one in the same task using the D26/D28/D29
idiom (construct-anchored extraction, non-vacuity assert, token-anchored keys checked against both
surfaces) or explicitly file the gap as a follow-up so it is not silently lost — as happened here.
