---
name: doc-return-contract-enumeration-must-add-new-optional-field-same-commit
description: "A standing agent doc's step-level instruction to return a new optional field can outrun its own '## Return' field-enumeration line in the same file"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: doc-return-contract-enumeration-must-add-new-optional-field-same-commit
  phase: test-floor-target-repo/1.2
  tags: 
    - doc-cascade
    - agents-md
    - schemas
    - MergeResult
    - phase-close-sweep
  created: 2026-07-23
  keywords: 
    - Return contract
    - MergeResult enumeration
    - war-refiner.md
    - optional field omitted
    - floor_diagnostic
    - intra-file drift
    - schemas.md mirror
    - prune the key
    - doc contract enumeration
    - phase-close absorb
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T09:25:15.764Z
---

# A doc's own '## Return' field-enumeration line can lag a new field its own step just mandated

**Pattern (audit finding resolved in a fix round before land — recorded as pattern, not a live
instance; the specific occurrence was caught and absorbed by this phase's own `p1-polish`
phase-close task):** a standing agent doc (`agents/war-refiner.md`-style) can, in one diff, add a
step-level instruction to capture and return a new optional field (e.g. "on that exit-1 path
ALSO capture the stderr into `floor_diagnostic`"), while the **same file's** `## Return` line —
which enumerates every field of the returned JSON contract as an authoritative allow-list
("return ONLY the `MergeResult` JSON: `{ mode, status, ... }`") — is left unedited. Because the
convention in these files is that every optional field appears in that one enumeration, an
omission reads as "this key is not part of the contract," and an agent literally following
"return ONLY {enumerated fields}" would prune the very key the step above just told it to set —
silently no-opping the whole feature the new step was written to add.

**Why it's easy to miss:** the two lines can be 100+ lines apart in the same file, the step-level
instruction is the one getting active edit attention (it's the "new mechanic" the task is
about), and nothing greps or drift-guards the enumeration line specifically — a
`skill-doc-contracts.test.mjs`-style row was explicitly declined for this exact field family in
this phase's own red-team adjudication (fail-open advisory field, not worth a permanent guard).

**How to apply:** whenever a plan task adds a new optional field to a dispatched agent's return
contract, grep the SAME standing doc file for its own `## Return`/field-enumeration line before
closing the task — if the file's convention is "every optional field is listed there," add it in
the same commit rather than relying on a later coherence sweep to catch the omission. Cheap,
single-grep check; the cost of missing it is a silently-dropped field on every future dispatch.

**Related:** [[standing-instruction-vs-dispatched-prompt-coverage-split]] (a different axis of
the same doc-cascade risk — standing `.md` vs. dispatched prompt string, rather than two sections
of one file). [[source-comment-lags-emitted-prompt-after-rewrite]] — same family, comment vs.
code rather than doc-section vs. doc-section.
