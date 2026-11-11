---
name: a-new-handoff-key-leaves-the-glossary-clean-handoff-list-stale-and-its-literal-regex-test-stays-green
description: A new engine handoff key leaves the GLOSSARY Clean handoff key list stale while its literal test stays green
metadata:
  node_type: memory
  type: project
  keywords:
    - handoff block
    - Clean handoff
    - GLOSSARY
    - key list
    - D37a
    - skill-doc-contracts
    - dispatchModels
    - doc drift
  provenance: code-verified
  slug: a-new-handoff-key-leaves-the-glossary-clean-handoff-list-stale-and-its-literal-regex-test-stays-green
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-3
  tags:
    - docs
    - glossary
    - handoff
    - tests
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T00:25:13.090Z
---

The **Clean handoff** entry in `GLOSSARY.md` lists the handoff block keys inline.
The D37a test in `skills/war/assets/skill-doc-contracts.test.mjs` pins that list with a hard-coded regex, `{ tipSha, polish, absorbed, followUps, asks, notes, endState, intentPresent, backstops }`.
The test does not read the engine's handoff object in `skills/war/assets/workflow-template.js`.
So a new handoff key leaves the glossary list short, and the test stays green.

Phase 3 (task 3.1) added `dispatchModels` to the handoff.
An auditor raised the glossary gap as a phase-close absorb Nit.
At the phase-3 landed tip the glossary list and the regex still name nine keys, without `dispatchModels`.

Rule: if you add a key to the handoff object, update the GLOSSARY list and the D37a regex and its "9-key" message in one commit.
Naming the key in the glossary does not restate the record shape, so the single doc home in `skills/war/references/schemas.md` still holds.

Locate-cue: verify still present before acting. Found in `GLOSSARY.md` (**Clean handoff**) and `skills/war/assets/skill-doc-contracts.test.mjs` (D37a) @ phase 3 (landed tip 8bc95782).

Related: [[default-flip-must-audit-all-doc-surfaces]], [[a-doc-shape-test-that-takes-the-first-regex-match-binds-the-wrong-row-when-a-second-line-reuses-the-shape]]
