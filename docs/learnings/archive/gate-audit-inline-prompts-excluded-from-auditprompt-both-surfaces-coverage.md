---
name: gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage
description: "A new auditor directive must reach every inline gate-audit prompt, not just auditPrompt(); each new directive needs its own both-surfaces registry row"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.5
  keywords: 
    - gate-audit
    - auditPrompt
    - inline prompt
    - execution-evidence
    - end-state
    - both-surfaces registry
    - D3 registry
    - standing instruction
    - ADR 0025
    - gate_log_path
    - integratedTipGate
    - authoritative seat
  tags: 
    - war
    - auditor
    - prompt-architecture
    - workflow-template
    - gate-audit
    - coverage-gap
    - resolved
  files: 
    - skills/war/assets/workflow-template.test.mjs
    - agents/war-auditor.md
  relates: 
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[mirror-registry-verification-mode-by-construct-kind]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# RESOLVED: the two inline gate-audit seat prompts are now a first-class row in the both-surfaces registry

**Durable pattern (still applies to FUTURE directives not yet registered):** when a base-prompt
rule is added to a shared prompt-builder function, enumerate every call site that builds a
*different* prompt for the same agent type. Going forward in this codebase, that specific
enumeration duty is now partially mechanized for the D8/D9/D12 doc-cascade family via the D3
registry below — but a genuinely NEW directive still needs its own row added to `REGISTRY` in
`workflow-template.test.mjs` (the registry is the deliberate ceiling, not an AST scanner: `//
ponytail:` comment at its head).

**What changed (code-verified — `skills/war/assets/workflow-template.test.mjs`, D3 registry test
`'D3 — both-surfaces directive registry…'`; verify still present before acting):** the prior
lesson recorded that `execution-evidence` and `end-state` gate-audit seats build prompts
**inline**, bypassing `auditPrompt()`, so new base-prompt clauses reached them only via the
standing `agents/war-auditor.md` surface — "prompt drift risk," not a bug, but unmechanized. The
drift-guards phase (ADR 0025) closes that gap for the correctness-critical directives it targets:
the D3 registry adds a row `'gate-audit inline seat: finding-less escalate is a HARD hold …'` whose
`surfaces` are `[war-auditor.md, gateAuditExecSrc, gateAuditEndStateSrc]` — the latter two are
sliced directly out of `workflow-template.js` source by construct (`sliceSrc('POST-MERGE
GATE-AUDIT', …)` / `sliceSrc('END-STATE-ONLY GATE-AUDIT', …)`), **not** built via `auditPrompt()`.
The registry then asserts the same anchors (`/finding-less/i`, `/HARD hold/i`) match on all three
surfaces.

**The residual nuance (still true, Nit-level):** the slice start token is the **comment header**
above each inline prompt, not the prompt string itself, so the matched region is wider than the
prompt alone. This is currently benign (no false-positive occurrence of the anchor tokens in the
wider comment region) but is a known precision ceiling, not a defect.

**Instance:** the integrated-tip authoritative gate-audit seat (a fourth, distinct inline call site)
once had no `gate_log_path` field in `EVIDENCE_RESULT.integratedTipGate`, so `agents/war-auditor.md`'s
"Read the captured gate-log artifact at the threaded path" directive was unsatisfiable there and the
seat always fell to SOFT cannot-confirm (fixed, #818).

> archived 2026-07-11: resolved — moved to archive
