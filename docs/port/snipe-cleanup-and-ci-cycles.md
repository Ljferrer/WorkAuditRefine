# Snipe cleanup and T4 checkpoint record

Scope: #2235 production cleanup containment, then #2159 T4 branch-only CI
preparation. Base `146e20effe0ff2a9d2739aaf6ccc304bd5899490` on `codex-port`.
Each item gets its own branch and PR; the second descends from the first. Both PR
bases remain `codex-port`, so the second initially includes the first's commits.
No merges, installed-plugin changes, live workflow activation or required-check
changes are authorized by this implementation experiment.

The operator selected `gpt-5.6-sol / medium`; each checkpoint uses three installed
Snipe seats. Seven panels total is a hard bound, including incomplete panels.
No panel has launched yet. Final outcomes belong in the PRs and #2097 report.

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
