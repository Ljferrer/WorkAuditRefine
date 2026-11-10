---
name: wire-key-rename-misses-prose-placeholders
description: "Rename wire key -> grep <old_name> prose [RESOLVED]"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: wire-key-rename-misses-prose-placeholders
  phase: submod-inc2/T5
  tags: 
    - rename
    - wire-contract
    - prose-consistency
    - agent-contracts
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# Wire-key rename must also update angle-bracket placeholders in prose

**Rule:** when renaming a returned wire key, updating the formal Return/schema line is not enough — **grep the same file** for angle-bracket variants of the old name (`<old_name>`, `<old-name>`, bare `old_name`). Descriptive prose (resume procedures, CLI examples) encodes the field name as a value placeholder that a schema-only diff review won't catch; readers infer the returned field still uses the old name.

Fixed/landed: the T5 `submodule_remote` → `pr_remote` instance — `agents/war-refiner.md` and `workflow-template.js` use `pr_remote`/`<pr_remote>` throughout at HEAD, zero old-key hits.

**Why:** placeholders don't break the wire contract, so nothing fails loudly; the drift misleads the next caller. **How to apply:** after any return-field rename, grep the edited file (and its consumers) for all casing/delimiter variants of the old key.

Related: [[default-flip-must-audit-all-doc-surfaces]], [[source-comment-lags-emitted-prompt-after-rewrite]]
