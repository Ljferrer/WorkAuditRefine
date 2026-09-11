# Snipe report

## Scope

- Committed scope: merge-base 668e4ff990f1c689fcf9710768c3d73c2601920c...ec949bb9dda7d7358a74905e49b6518a671af0fb
- Revision: `ec949bb9dda7d7358a74905e49b6518a671af0fb` (base `668e4ff990f1c689fcf9710768c3d73c2601920c`)
- Review coverage: complete
- Configured seat profile: `gpt-5.6-sol` / `high` (actual model identity not independently verified)

## Seat outcomes

- Seat 1 · correctness: completed — validated; verdict approve; confidence high
- Seat 2 · cascading-impact: completed — validated; verdict approve; confidence high
- Seat 3 · test-fidelity: completed — validated; verdict approve; confidence high
- Seat 4 · security: completed — validated; verdict approve; confidence high

## Findings

### Minor · Flat mismatch replies can produce incomplete pin-transfer receipts

- Seats: 1 (correctness)
- Location: `skills/war/assets/workflow-template.js:4169`
- Evidence: The flattened `PIN_TRANSFER` schema now accepts `{status:'mismatch', rebased_tip:'…'}` without either patch ID. The consumer safely computes both values in `pinProof` and performs the full re-audit, but `probeRow` records `prePatchId` and `postPatchId` from the incomplete `pinProbe`, yielding null fields after approval. This contradicts the documented invariant in `skills/war/references/schemas.md` that every merge receipt retains both patch IDs so it can be re-verified without replaying the rebase.
- Proposed correction: Populate mismatch receipt patch IDs from the independently computed `pinProof` (or normalize missing probe fields from that proof before constructing the receipt), and add a regression using a schema-valid mismatch reply without patch-ID fields that asserts the receipt contains both computed IDs.
- Disposition: absorb (classification only)
### Minor · PIN_TRANSFER compatibility check is green-by-schema-deletion

- Seats: 3 (test-fidelity)
- Location: `skills/war/assets/workflow-template.test.mjs`
- Evidence: The new runPhase check only rejects top-level allOf/anyOf/oneOf properties. It does not verify the repair's declared invariant that PIN_TRANSFER remains a flat object schema requiring status and preserving its status enum and evidence properties. Existing pin-transfer behavioral fixtures feed responses directly through the mock agent without evaluating opts.schema, and PIN_TRANSFER is absent from EVALUATED_SCHEMAS. Replacing PIN_TRANSFER with {} would therefore pass the new compatibility check and consumer tests while removing the live dispatch's declared wire contract.
- Proposed correction: Add a focused assertion against the schema on an actual pin-transfer dispatch: require type object, required ['status'], the six legal status values, and the retained evidence-property keys, while continuing to reject root combinators. Alternatively, add PIN_TRANSFER to EVALUATED_SCHEMAS and exercise missing, unknown, and legal status values.
- Disposition: absorb (classification only)

No fixes, issue filing, PR comments, extra seats, or follow-up actions were performed.

Repair handoff: apply the packaged #2097 repair discipline only when the user separately authorizes fixes; suggested line edits are not the whole defect class.

