---
name: a-doc-shape-test-that-takes-the-first-regex-match-binds-the-wrong-row-when-a-second-line-reuses-the-shape
description: A doc-shape test that reads the first regex match binds the wrong row if a new doc line reuses that shape
metadata:
  node_type: memory
  type: project
  keywords:
    - first match
    - regex
    - schemas.md
    - dispatchModels
    - doc shape test
    - pointer line
    - DISPATCH_MODEL_KEYS
    - row shape
  provenance: code-verified
  slug: a-doc-shape-test-that-takes-the-first-regex-match-binds-the-wrong-row-when-a-second-line-reuses-the-shape
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-3
  tags:
    - tests
    - docs
    - schemas
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T00:25:06.033Z
---

The test `dispatchModels — schemas.md keys match` in `skills/war/assets/workflow-template.recovery.test.mjs` reads the documented row with a non-global `match`.
Its regex is `^\s*dispatchModels: \[ \{ ([^}]*) \} \],` with the `m` flag.
It compares the captured keys with the engine literal `DISPATCH_MODEL_KEYS` in `skills/war/assets/workflow-template.js`.
The one documented row lives in `skills/war/references/schemas.md`, in the `handoff` block of § Workflow per-phase return.

The trap: `schemas.md` also holds a `## Run manifest` jsonc block, and it sits earlier in the file.
If you add a `dispatchModels: [ { ... } ],` line there, the test binds that line first and compares the wrong keys.

Rule: a pointer line for the same field in another block must use a different shape, for example `dispatchModels: [ ... ] | null` with a comment that points at the handoff row.
General rule: before you add a second doc line for a field, grep the tests for a first-match regex on that field.

At the phase-3 landed tip the run-manifest block in `schemas.md` still has no `dispatchModels` line (an auditor noted this, and nobody added it).
Whoever adds it must follow the shape rule above.

Locate-cue: verify still present before acting. Found in `skills/war/assets/workflow-template.recovery.test.mjs` and `skills/war/references/schemas.md` @ phase 3 (landed tip 8bc95782).

Related: [[weak-test-assertion-passes-without-feature-being-exercised]]
