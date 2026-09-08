# Parity foundation

Run `node --test tests/parity/*.test.mjs` using the dedicated
`codex-snipe-port` environment. The baseline collector also discovers these tests
through its reviewed census. No production engine entry point is changed here.

## T2: contract records, not runtime certification

`catalog.mjs` names P01–P26 from the reviewed parity plan, their stimulus,
scripted role outcomes, required evidence kinds, runtime applicability and minimum
eventual evidence. Each row selects one explicit deterministic fixture; it does
not claim to enumerate every legal engine result or all malformed-input variants.
`fixtures.mjs` independently authors positive records without importing the
catalog or engine. Their artifact digests are synthetic references, not verified
artifact files. Production bindings and real host evidence remain T5–T7 work.

`compareObservations(claude, codex, {left: fixture, right: fixture})` first checks
each side against the independent scenario oracle, then compares observations.
The caller must supply fixture context created independently of runtime output:
case/source identity and commit roles with exact SHAs, tree IDs and ordered parent
roles. Do not construct expected pins from an agent's claimed expected revision.

The result explicitly says `contract-simulation` and
`runtimeCompatibility: not-established`. Passing does **not** satisfy catalog
minimum evidence, prove an artifact exists, or certify either adapter/host.

Known decision fields and versions are closed: unknown top-level or fact fields
fail, rather than vanishing. Unknown event metadata is retained for comparison;
unknown event kinds fail. Artifacts must contain every required evidence kind
with a digest. Severity/disposition, retries, gate exit, missing evidence and
permissions remain literal assertions; equal bugs on both sides do not pass.

Within-run audit/gate pins are exact before normalization. Across independently
constructed fixtures, revision fields become commit roles only after validation;
tree IDs and ordered ancestry must match. Parallel task completion and audit-seat
array order are incidental; causal predecessors and task identities are not.
Raw temporary paths, timestamps and generated session IDs are not accepted as
decision fields. Adapter bindings should keep that diagnostic material separately
and emit semantic event IDs here; arbitrary strings are never globally rewritten.

Negative controls exercise shared stale approvals, a shared wrong candidate,
missing evidence, every selected expected fact, unknown schemas, causal gaps,
capacity overflow, independent commit identities, and tree/ancestry differences.
Disposable mutations prove the independent oracle, pin, evidence, graph, schema
and causal guards fail assertions when removed.
