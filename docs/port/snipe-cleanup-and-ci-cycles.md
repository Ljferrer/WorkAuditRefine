# Snipe cleanup and T4 checkpoint record

Scope: #2235 production cleanup containment, then #2159 T4 branch-only CI
preparation. Base `146e20effe0ff2a9d2739aaf6ccc304bd5899490` on `codex-port`.
Each item gets its own branch and PR; the second descends from the first. Both PR
bases remain `codex-port`, so the second initially includes the first's commits.
No merges, installed-plugin changes, live workflow activation or required-check
changes are authorized by this implementation experiment.

The operator selected `gpt-5.6-sol / medium`; each checkpoint uses three installed
Snipe seats. Seven panels total is a hard bound, including incomplete panels.
This log records all six panels in chronological order. A means approve; RC means
request changes. Incomplete panels count against the budget and are not clean.

| Panel | Pinned scope | Correctness / test-coverage / cascading-impact | Validated findings |
|---|---|---|---|
| 1 | `146e20e..edc6c1d` | A / RC / RC | Two Major, two Minor |
| 2 | `146e20e..7a4f080` | RC / A / A | One Major |
| 3 | `7a4f080..ad18b81` | A / A / timeout — incomplete | None |
| 4 | `146e20e..0e7f3fb` | A / A / timeout — incomplete | Three Minor |
| 5 | `0e7f3fb..3cbc1a0` | A / A / RC | One Major, one Minor |
| 6 | `146e20e..23f24d3` | A / A / A | None |

All six scopes were stable with complete coverage. Seat timeouts still made panels
3 and 4 incomplete. All four Major and six Minor findings were accepted and repaired.

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

## T4 initial preparation

- Added an inert workflow under `scripts/ci`, never `.github/workflows`; its
  unprivileged Linux/macOS matrix runs the existing complete collector and
  uploads diagnostics even on failure. `WAR CI` always checks the explicit
  mandatory job and both platform reports. No ruleset or campaign changes.
- The final gate checks revision, clean stable snapshots, environment, reviewed
  census, suite outcomes/counts, named skips and regular diagnostic files.
  Entirely opt-in host suites remain allowed skips, not runtime certification.
  A regression exposed the initial draft incorrectly requiring a passing case
  in an entirely skipped live suite; the corrected policy has a positive mirror.
  An unknown skip with absent reason cannot compare equal to an absent policy.
- Eight focused tests pass, including malformed/missing/failed evidence, the real
  CLI exit status, independent Claude entry inventory and parsed YAML wiring.
  Five disposable production guard removals fail behavioral assertions; seven
  altered workflow variants are rejected. Actionlint 1.7.12 passes the template.
  The package policy reuses the existing standalone Codex package test rather
  than adding another builder. Hosted execution and T5–T8 remain unproven.
- Environment correction: `conda run` inherited a host PATH placing system Python
  before the dedicated environment. A PyYAML install inadvertently targeted user
  Python 3.9; that newly installed package was uninstalled and its absence checked.
  The dedicated environment already contained PyYAML. Tests now explicitly put
  its bin directory first; no base-environment package was changed.

## Panel 3: incomplete T4 review

Panel 3 (`7a4f080..ad18b81`) had stable scope and complete coverage, with two
validated approvals and a cascading-impact timeout. No validated finding was
returned; it was incomplete, not clean. It counted against the seven-panel bound.

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

## Panel 5: T4 inventory and evidence corrections

Panel 5 (`0e7f3fb..3cbc1a0`) reviewed the restacked checkpoint with the same
permissions/profile and a 15-minute bound. It completed, stable, A / A / RC.

One Major and one Minor were accepted. The Claude entry inventory ignored added
manifest surfaces; its oracle now explicitly reviews the manifest key set, with
commands/MCP/LSP/output-style/unknown-key negative controls. The report gate
accepted malformed termination flags; it now permits only omitted or true, with
positive mirrors and string/null/numeric rejection. Both regressions were red
before the guards. Six final-gate guard mutations fail behavioral assertions.
Consequence: stricter validation of branch-only evidence and future manifest
changes; no installed package, Claude engine, workflow activation or ruleset edit.

## Panel 6: combined-stack acceptance

Exact scope `146e20effe0ff2a9d2739aaf6ccc304bd5899490..23f24d36cf61bdbbfa34e2b8f1c56c07bbef04e1`.
Correctness, test-coverage and cascading-impact all completed with validated
approvals and high reported confidence. Coverage was complete, scope was stable,
and no validated findings were returned. The configured auditor profile remained
`gpt-5.6-sol / medium`; actual model identity was not independently verified.
The coordinator used host-bundled Node 24.19.0, and auditor permissions remained
read-only. This panel used the same 15-minute bound as panel 5.

The fresh clean baseline at that exact head completed all 65 suites: 3,317 tests,
3,313 passes, zero failures, four named skips, zero cancelled and zero todo.
Source/index/content remained unchanged. It used host-bundled Node 24.19.0 and
the dedicated `codex-snipe-port` conda Python environment, not the base environment.

This does not erase earlier failed baselines. Besides the two-failure run recorded
above, a later baseline at `3cbc1a0` had 3,312 passes, one request-fixture timeout
and four named skips across 65 suites. The unchanged request suite passed 29/29
with the host-bundled runtime after failing with NVM Node 24.17.0. A process sample
observed its wrapper at macOS `_dyld_start` before Node initialization; this did not
establish the OS cause. Speculative source/fixture changes were reverted, and no
scope deadline was weakened. Runtime packaging and minor version both changed,
so neither is independently proven causal.

## Final accounting and review handoff

Six panels used 18 seats: 16 validated outcomes (12 approvals and four requests
for changes), plus two timeouts. Severity counts include test-proof and inventory
guard defects, not exclusively production runtime regressions. The operator paused
at Round 6 and later resumed. Acceptance evidence was rechecked against unchanged
code; the seventh permitted panel was not needed and was not launched.

- Cleanup PR: [#2262](https://github.com/Ljferrer/WorkAuditRefine/pull/2262),
  head `a8580b56282e6abda1abad42ad4215e2ab17ae52`.
- CI PR: [#2261](https://github.com/Ljferrer/WorkAuditRefine/pull/2261),
  audited implementation head `23f24d36cf61bdbbfa34e2b8f1c56c07bbef04e1`, stacked
  above cleanup. Both target `codex-port`; review/merge cleanup first.
- Detailed experiment analysis: [#2097 report](https://github.com/Ljferrer/WorkAuditRefine/issues/2097#issuecomment-5590223257).

This chronological documentation update follows the audited implementation; it
is not part of the tested SHA and does not represent another audit cycle. Hosted
Linux/macOS execution, native Windows behavior, the original spontaneous EPERM
cause, T5–T8 certification and workflow/ruleset activation remain unproven or out
of scope. No installed plugin or engine campaign changes were made.
