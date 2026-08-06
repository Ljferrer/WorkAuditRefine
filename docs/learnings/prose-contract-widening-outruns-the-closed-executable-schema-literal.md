---
name: prose-contract-widening-outruns-the-closed-executable-schema-literal
description: "Widening the prose contract in schemas.md with a new field (e.g. endStateAttestations on AuditVerdict) does not widen the closed `properties` enumeration in the executable JSON-schema literal (workflow-template.js's AUDIT_VERDICT/MERGE_RESULT consts) that StructuredOutput actually enforces — and a producer task's plan slice can name the prompt/registry work without naming the schema literal itself"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: prose-contract-widening-outruns-the-closed-executable-schema-literal
  phase: 2026-08-05-precision-chain-and-loop-breaker/1.2
  tags: 
    - schemas.md
    - workflow-template.js
    - StructuredOutput
    - AUDIT_VERDICT
    - MERGE_RESULT
    - contract-layer
    - doc-cascade
    - defined-but-not-yet-emitted
  keywords: 
    - endStateAttestations
    - AUDIT_VERDICT properties
    - closed schema literal
    - StructuredOutput drops undeclared field
    - schemas.md widening
    - executable schema literal lag
    - producer task cross-link
    - acceptance_criteria_covered
    - id vs verbatim condition text keyspace
    - contract layer drift
  created: 2026-08-05
  modified: 2026-08-06T00:59:12.797Z
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
---

# schemas.md is the prose contract; workflow-template.js's `const AUDIT_VERDICT`/`MERGE_RESULT` are the executable one — widening only the first is a silent no-op for a StructuredOutput-driven agent

**What happened (code-verified — found at `skills/war/assets/workflow-template.js` line 70,
verify still present before acting; landed tip `47f7bc0d37319c0aa7222fd9b1445c7abf7c5ec5`):**
Task 1.2 widened `skills/war/references/schemas.md`'s prose description of `AuditVerdict` to
add `endStateAttestations?` — a channel gate-audit seats will use, per plan, to attest
per-condition End-state status. `const AUDIT_VERDICT` in `workflow-template.js` is the
literal actually passed as `schema` to `agent()` (StructuredOutput), and at the landed tip
it is a closed `properties` enumeration — `seat, lens, audit_sha, verdict, findings,
tests_verified, confidence, escalate_reason, widen` — with no `endStateAttestations`
member. The producer of that literal (Task 3.2, a later phase) never had "add the property
to the AUDIT_VERDICT const" named in its plan slice; the slice named the shared
`endStateBlock` prompt const, registry rows, artifact naming, and the `unverified` mapping,
but not the schema literal. Until Task 3.2 lands and widens it, every gate-audit-family
seat is **structurally unable** to return the field even if prompted to — an agent driven
by StructuredOutput against a closed schema silently drops (or never generates) a property
absent from that schema, which would make D8's own rule ("a condition with no attestation
row from any seat ⇒ `unverified`") fire universally and invisibly.

**The general pattern:** this repo's contract layer has (at least) three distinct surfaces
that must move together and don't share a single source of truth: (1) the **prose contract**
in `schemas.md` (what a human/plan author reads), (2) the **executable schema literal**
(the `const X = { type: 'object', properties: {...} }` passed to `agent()` in
`workflow-template.js`, which is what the LLM's structured-output enforcement actually
sees), and (3) the **standing agent card's `## Return` enumeration** (`agents/*.md` — see
[[doc-return-contract-enumeration-must-add-new-optional-field-same-commit]] for that pairing
specifically). A plan task widening surface (1) does not imply (2) or (3) move with it, and
a plan slice can name the prompt work a producer task must do without naming the schema
literal it must also touch — because the schema literal is easy to treat as "generated"
infrastructure rather than a contract surface in its own right.

**A sibling instance in the same diff:** `acceptance_criteria_covered` was redefined in the
same task's schemas.md widening as `["<end-state id>"]` — numeric/ordinal End-state ids —
while every other End-state channel this same diff defines (`endStateAttestations[].condition`,
the handoff `endState` rows, gate-audit `plan_ref`) keys on the **verbatim condition text**.
The only per-phase carrier of claimed conditions (`phase.endState`, widened to `{ condition,
tag, check }` rows) carries no `id` field, so the two keyspaces have no defined join —
a future consumer (Task 3.2's cross-check) is handed two channels for "the same fact" keyed
differently, with the mapping left to be invented at implementation time. Same root cause:
a contract-layer prose widening creates a new consumer requirement without the executable
detail (here, a join/mapping) that would make it mechanizable.

**How to apply:** when a plan task widens `schemas.md`'s prose description of a JSON
contract, grep `workflow-template.js` for the same-named `const X = { ... properties: {...
} }` literal in the same commit — a closed `properties` object silently rejects/ignores an
undeclared field under StructuredOutput. If the literal's producer is a **later** task
(the "defined-but-not-yet-emitted" pattern is itself sanctioned, per
[[doc-return-contract-enumeration-must-add-new-optional-field-same-commit]]'s sibling case),
name the schema-literal edit explicitly in that later task's plan slice — don't rely on "the
prompt work" language to imply it. When two contract fields represent the same concept with
different keyspaces (id vs. verbatim text), state the join in the contract doc itself, not
just in each field's own description.

Related: [[doc-return-contract-enumeration-must-add-new-optional-field-same-commit]] (the
adjacent agent-card-Return-line pairing of the same three-surface problem);
[[doc-promises-ledger-field-the-schema-contract-never-defines]] (archived, resolved — a
sibling prose-vs-prose contract gap inside schemas.md itself, not prose-vs-executable-literal);
[[template-defers-runtime-values-to-agent-via-literal-placeholder]] (a different
workflow-template.js authoring constraint — no shell, agent-resolved placeholders — worth
knowing when touching the same file's schema consts).
