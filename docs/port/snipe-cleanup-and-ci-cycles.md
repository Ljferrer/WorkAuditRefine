# Snipe cleanup and T4 checkpoint record

Scope: #2235 production cleanup containment, then #2159 T4 branch-only CI
preparation. Base `146e20effe0ff2a9d2739aaf6ccc304bd5899490` on `codex-port`.
Each item gets its own branch and PR; the second descends from the first. Both PR
bases remain `codex-port`, so the second initially includes the first's commits.
No merges, installed-plugin changes, live workflow activation or required-check
changes are authorized by this implementation experiment.

The operator selected `gpt-5.6-sol / medium`; each checkpoint uses three installed
Snipe seats. Seven panels total is a hard bound, including incomplete panels.
Two panels have completed. Final outcomes belong in the PRs and #2097 report.

## Initial cleanup repair

- Root cause: a one-shot group killer rethrew non-ESRCH errors from event/timer
  callbacks. Consumers also waited exclusively for close after requesting cleanup.
  The issue's direct discovery probe was rerun and failed with uncaught EPERM
  before edits; it passed after the initial repair.
- Sweep: discovery completion/error/timeout/output/cancel, seat success/failure/
  timeout/output/cancel, direct-child exit, and the additional submodule Git
  consumer. A shared stop/completion observation returns bounded cleanup evidence;
  consumers inspect it before success. Submodule catch/fallback/disposal paths
  now preserve uncertainty, stop further preparation and retain review objects.
- Regression matrix: actual subprocesses and inherited descendants, injected
  denial or missing close, original terminal reasons and healthy peer retention.
  Test-owned rescue cleans injected survivors after checking the returned result;
  production code does not retry denial. Submodule injection checks cessation and
  retained objects. The OS cause of the original spontaneous EPERM remains unknown.
- Test-construction corrections: the first output fixture did not exceed the
  runner's default output limit; the next hanging fixture used an unresolved
  promise without an active handle and exited. The tests now set an explicit
  output limit and keep a real timer active. These were fixture defects, not
  additional production findings or audit cycles.
- All 35 affected runner/submodule tests pass. Seven mutations independently
  remove denial containment, the drain bound, exit cleanup, group identity,
  discovery refusal, seat refusal or retained-object protection; each fails a
  behavioral assertion rather than initialization. Full baseline and checkpoint
  results remain pending; targeted tests are not a complete approval.

## Panel 1 and recursive repair

Scope `146e20e..edc6c1d`; correctness / test-coverage / cascading-impact,
all complete and stable: A / RC / RC, two Major and two Minor findings.
All four were accepted, including both Minor findings in the open cleanup class.

- Natural exits in the non-group branch were incorrectly treated as failed kill
  attempts. Real discovery/seat/preparation consumers under a forced non-group
  transport failed before the fix and pass afterward; a live child's refused
  signal still fails. POSIX descendant group cleanup remains unchanged.
- A semantic late-metadata fixture now denies cleanup after object copies, rather
  than guessing another Git-call ordinal. It proves no later Git operation or
  auditor launch and retained objects. Removing that exact catch guard is red.
- Git close-promise races lost already-observed exit evidence. An exit-7 parent
  with inherited pipes proved the missing field before repair. The failed result
  now carries exit/signal observations without waiting indefinitely for close;
  an unavailable original execFile error remains unavailable, not invented.
- Catalog terminal reasons and direct-exit seat status/code are asserted exactly.
  The mutation suite also removes original-cause preservation, non-group exit
  protection and Git exit evidence. All eleven mutations fail assertions.
- Consequence: shared lifecycle behavior, submodule diagnostics and test evidence
  changed; no retries, profile changes, package inventory changes or engine edits.
  All 37 affected tests pass. The non-group test is a transport-branch simulation,
  not a claim of native Windows host acceptance.
- Fixture correction: the semantic panel test initially provided a nonexistent
  auditor executable and stopped at resolution. It now supplies an executable
  sentinel and asserts it never launches. This was not a production regression.

## Panel 2: reader lifetime crosses preparation ownership

Scope `146e20e..7a4f080`; same lenses/profile, complete and stable:
RC / A / A. One Major accepted. The prior sweep covered preparation cleanup and
seat cleanup separately but missed their conjunction: uncertain auditor readers
still need the successfully prepared object stores.

The combined gitlink/seat regression failed with a missing object repository
before repair. Denied signals and missing close now retain readable pinned blobs,
valid peers and a reported `retainedRoot`; normal success and confirmed failed
exits still dispose. Unknown worker failure conservatively retains stores. The
shared preparation return now exposes its owned root, and the report/acceptance
prose no longer unconditionally claim disposal. A mutation removing uncertain
reader retention must fail the combined behavioral assertion. This is a concrete
shortcoming of the earlier fixer sweep despite its injected discipline, not a
pre-existing finding merely rediscovered under another title.

Verification: 48 runner/submodule/result cases passed, followed by the added
unknown-worker regression and all thirteen cleanup mutations passing. A mutation
of the conservative initial retention state also fails its assertion. The
descendant cancellation fixture now observes its PID marker before aborting;
its bounded three-second timeout remains enforced and its focused test passes.
The cleanup matrix also uses a three-second fixture budget (previously 700 ms)
and prints the unexpected original cause on failure. Production timeouts did not
change. An earlier overlapping run failed the success fixture's cause assertion;
that diagnostic lacked the actual cause, so startup contention is a hypothesis,
not a proven OS diagnosis.

An intermediate clean baseline at T4 checkpoint `ad18b81` retained two failures:
Git scope capture ETIMEDOUT and a missing descendant PID marker. It recorded
unchanged source, 65 suites, 3309 passes, two failures and four named skips. It ran
alongside another process-heavy suite. Final acceptance requires a fresh baseline
without competing local suites; this failed report is not replaced by the later
targeted passes. No scope-capture deadline was weakened.

## Panel 4: incomplete review with three absorb findings

Scope `146e20e..0e7f3fb`, complete coverage and stable scope. Correctness and
test-coverage approved; cascading-impact timed out. This is incomplete, not clean.
The three validated Minor findings were accepted: assert exact cleanup messages
and their projections; assert normal `retainedRoot: null` and disposal reporting;
correct the mandatory submodule reference's stale unconditional removal promise.
The earlier prose sweep searched disposal/retention terms but missed "removed" in
that active reference. The reference correction preserves fetch/retry/checkout
authority boundaries and passes the skill validator. Fifteen cleanup mutations
now fail behavioral assertions, including generic-message and stale-root changes.
The focused cleanup/disposal/mutation tests pass; no production behavior changed
in this checkpoint. Full baseline diagnosis remains open for the request fixture.
