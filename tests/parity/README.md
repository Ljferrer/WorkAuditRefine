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

P01/P02 require explicit commit, approval, gate and integration events. A repair
must descend from the initial Major audit; integration must descend from both
current-revision approving audits and the successful gate. Audit verdicts and
finding identities are retained, not inferred from a claimed approval count.
Gate artifacts bind a fixture-owned command, exact tested revision and exit.
Every artifact is compared, including its digest. Digests in this contract are
for semantic evidence, not arbitrary runtime-specific log bytes; adapters must
retain raw diagnostics separately rather than drop meaningful differences.

## T3: physical failure fixtures

`git-fixture.mjs` provisions unique temporary Git repositories and a local bare
remote with reflog recording, fixture-local identity/config/hooks/templates and
file-only Git transport. `startFixtureProcess` owns detached process groups,
captures bounded output, kills them on timeout and direct-parent exit, and exposes
an exact named checkpoint. Test cleanup waits for owned processes before removing
the temporary root. This requires permission to start/kill local process groups
and bind a loopback service; a denied test is a failure, not an allowed skip.

`fixture-process.mjs` is deliberately a tiny **fixture driver**, not a substitute
WAR recovery implementation. The parent observes a real push, verifies the remote
tip and absent ledger, sends SIGKILL, then launches a fresh process. That process
reads the fixture pins, persisted ledger and bare Git state. The test independently
checks the repaired ledger, retained remote SHA, reflog update count and push log
across repeated restarts. Unknown Git state and malformed ledger fail closed.
T3 establishes this physical observation seam; binding the production adapter and
recovery decisions after the engine campaign remains T5–T7 work. These tests do
not promote P13 to actual runtime/production recovery certification.

`issue-service.mjs` listens only on an ephemeral loopback port, records requests
and persists rows before deliberately withholding one response. A bounded client
times out; a new client resolves the correlation with GET and makes no second
POST. The service does not deduplicate creates, so duplicate client behavior is
observable. It never contacts GitHub or the active issue tracker. HTTPS/SSH Git
probes are explicitly rejected before network transport. This is test isolation,
not an OS security sandbox for arbitrary untrusted fixture code.

Failure controls additionally cover hangs, output overflow, inherited-pipe
descendants, stale ledger, unknown foreign commits, and assertion-killed
mutations. Evidence is inspected before temporary cleanup; collector stdout and
stderr logs retain test results, but fixture directories are not release artifacts.
