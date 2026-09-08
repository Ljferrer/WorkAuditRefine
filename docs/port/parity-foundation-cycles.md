# Parity foundation T1–T3 execution record

Goal: #2159, through T3 only. Base: `8fd30f30f4b565532269ceb768d4c7427d43089f`.
No production engine edits, live CI activation or branch-protection changes.

## Audit protocol

Each three-seat Snipe panel consumes one of at most 12 cycles, including an
incomplete panel. Use the installed #2220 package and the operator-selected
`gpt-5.6-sol / medium` profile. Audit after each phase and each repair round.
Stop at 12 panels regardless of findings; disclose unfinished work. Before that
bound, completion requires T1–T3 evidence and a complete panel with no findings
above Nit. Zero findings also meets that severity condition.

Auditors remain read-only. The enclosing user request authorizes this coordinator
to fix verified absorbable findings and file follow-ups. Record each panel's pin,
seat outcomes, defect classes, dispositions, repairs, regression evidence, and
recurrences. Apply the full returned repair guidance before edits. Preserve real
operator decisions; do not turn an ask into an invented ruling.

The #2097 assessment will distinguish observed behavior from causal claims: there
is no randomized no-guidance control, and changed tasks/models can affect results.
Measure named-site versus sibling/consumer coverage, new defects in repairs,
repeated or reversed fixes, false positives, and rounds—not only approvals.

## T1 evidence in progress

- Discovered suites from tracked paths, never recursive worktree traversal.
- Negative controls: omitted/missing/empty inventory; nonzero shell status with
  retained output and continued collection; empty JS and unapproved skips.
- Initial discovery and collection were developed incrementally with observed
  failures before implementation. Full existing-suite collection is pending.

## Panels

### Cycle 1 — T1 initial collector

- Pin: `5a23f20`, compared with the goal base.
- Seats: correctness, test-coverage, cascading-impact; all `gpt-5.6-sol / medium`.
- Full baseline run was explicitly disclosed as pending in the operator concern.
- Before panel results, baseline execution exposed an independent collector bug:
  sanitized environment plus inherited PATH selected a home-dependent Node shim.
  The fix pins the already-running Node directory first; a shim fixture failed
  before the change and passed afterward, also checking secret non-forwarding.
- Added CLI nonzero-exit and bounded-output evidence while the panel runs.
- All seats completed with validated request-changes verdicts: seven Major and
  two Minor findings, with overlapping reports of shell and revision defects.
  No follow-up or ask dispositions. Grouped repairs: non-vacuous shell evidence
  and stderr skips; before/after revision/index/content binding; successful-parent
  descendant cleanup; a reviewed CLI census; environment/process negative controls.
- Shell no-op/stderr, moving-HEAD/content, and CLI deletion fixtures were observed
  failing before repair. The expanded collector suite passes 14 tests, including
  seven targeted guard removals that each produce assertion failures. A real
  redirected descendant is checked by heartbeat and process state after its parent
  exits. The mutation harness initially inherited Node's test context and silently
  ran no selected cases; the meta-test exposed this, and clearing that context made
  the mutations execute and fail for their intended assertions.
- Baseline run 1: 62 suites, 12 failed, with the inspected failures tracing to the
  Node shim. Run 2 (runtime fix): only the collector's now-fixed output-limit
  diagnostic and the legacy all-tests-under-skills assertion failed. That assertion
  already excluded the Codex suites; it now independently checks the reviewed
  baseline census. Production WAR gate behavior is unchanged.
- Raw evidence directory: `/private/tmp/war-parity-t1.bSBgQm/` (local, not a durable
  artifact). Repair verification against the complete baseline remains pending.
- Early behavioral observation: auditors identified sibling output channels and
  process completion paths, not just the original test cases. This did not prevent
  substantial defects in the initial implementation; no convergence claim yet.

### Cycle 2 — T1 class-closure review

- Pin: `56fc1be`, compared with the goal base; same seats and profile as cycle 1.
- Raw audit and clean-baseline evidence: `/private/tmp/war-parity-cycle2.Y4YJEJ/`.
- Clean baseline passed all 62 suites: 3,262 passing observed Node cases/shell
  assertion rows and four explicitly allowed host skips; source/index/content
  unchanged. Counts combine the reported units, not a claim of unique scenarios.
- All seats completed: correctness and test-coverage requested changes;
  cascading-impact approved. Two Major findings and one absorbable Minor; no
  follow-ups or asks. The repair's unframed content hash permitted redistributed
  bytes to collide; the prior tests independently proved neither index nor
  content digests; cleanup-error rejection had no dedicated negative witness.
- Repaired with per-file digest/length framed records. Added already-dirty tracked
  and untracked content probes, index-only changes with stable worktree/HEAD/path
  membership, a cleanup-error fixture, and a two-file framing collision. The first
  collision fixture accidentally put another file between the pair; that passing
  fixture was rejected, filenames corrected, and the collision observed red before
  fixing the hash. This is evidence of validation iteration, not an oscillating
  operator policy or a new audit round.
- 18 collector tests pass, including eleven targeted assertion-killed mutations.
  Four new mutations independently remove index digest, content digest, framing,
  and cleanup-error rejection. No claim that the first repair was complete merely
  because its tests passed; this round found new-code defects in the same class.
- T2's first independent stale-approval oracle and full scenario catalog are in
  progress, not yet committed or declared complete. T3 has not started.

### Cycle 3 — T1 lifecycle sibling and evidence review

- Pin: `e88c18e`, compared with the goal base; same seats/profile. All completed.
- Correctness and test-coverage requested changes; cascading-impact approved.
  Two Major and two absorbable Minor findings; no asks or follow-ups.
- Runtime defect: a descendant inheriting output pipes prevented `close` from
  firing, delaying successful-parent cleanup until timeout. The previous fixture
  redirected those pipes. Cleanup now starts on direct-child `exit`; `close`
  retains responsibility for final output/descriptor/result accounting. The real
  inherited-pipe fixture failed before the fix and passes afterward.
- Coverage gaps: zero-exit failure rows, mode-only drift, and tracked symlink
  rejection. Added stdout/stderr and FAIL/not-ok mirrors, a permissions-only
  change with stable bytes/index/path membership, and a symlink-target sentinel.
  Targeted mutations independently remove their load-bearing guards.
- This is another one-recursion-too-shallow recurrence in process completion and
  new evidence fields. It is not policy oscillation: no prior fix was reversed.
- Raw panel: `/private/tmp/war-parity-cycle3.SZX4Gs/audit-result.json`. Three of
  12 panels used. T2 work remains separate WIP; T3 has not started.

### Cycle 4 — T1 repaired collector acceptance

- Pin: `b51ff7d075eac4b4f4fcef67329197136d2508cc`, compared with the goal base.
- Same three lenses and operator-selected profile. All completed, validated,
  high-confidence approvals; complete coverage and no validated findings.
- Collector tests: 22 passing, including fourteen assertion-killed mutations.
  The prior full baseline is pinned to cycle 2; final integrated baseline remains
  required after T2/T3. No claim of fresh full-suite evidence at this pin.
- Raw panel: `/private/tmp/war-parity-cycle4.bThjt6/audit-result.json`.
  Four of 12 panels used. T1 review converged; T2 remains work in progress and
  T3 is not implemented, so the campaign is not complete.

## T2 initial evidence

- All P01–P26 catalog rows have independently authored positive records. Each
  selected expected fact is corrupted on both sides in negative controls; every
  required artifact kind is removed in turn. These are contract simulations,
  not real adapter/host or artifact-file verification (bindings deferred T5–T7).
- Candidate identities are supplied by a separate fixture context. A shared
  wrong-candidate regression failed before that guard. Cross-fixture SHA
  normalization first failed on differing raw identities, then passed by commit
  role with exact within-run pins and tree/ordered-ancestry comparison intact.
- Parallel completion ordering passes without erasing dependency edges. Unknown
  top-level decisions and extra/missing/cyclic events fail. No arbitrary global
  text replacement or unknown-decision dropping is used.
- Eleven oracle tests pass, including six independently assertion-killed guard
  removals. T2's narrowed contract-simulation evidence is explicit in its README;
  no production engine function supplies expected decisions.

### Cycle 5 — T2 evidence relationships

- Pin `b32a6d786ec01c60d9049af7ff24da7a1c58fc5f`; all three seats completed with
  high-confidence request-changes verdicts and complete coverage. Four Major
  entries overlap in two classes: approval/integration causality and artifact
  binding/comparison. One Minor note preserves the final-baseline obligation.
  No follow-up or ask dispositions.
- Verified shared rejecting audits and divergent valid artifact digests both
  passed the previous oracle; regression assertions failed before repair.
  Counts and booleans did not establish evidence relationships. Swept P01/P02
  together, bound initial Major findings and current audit verdicts, required
  causal edges through repair/approval/gate/integration, and bound P01/P02/P07 gate
  command/revision/exit. All artifact kinds now participate in comparison.
- Fourteen oracle tests pass, with sixteen assertion-killed mutations. Edge
  mirrors retain counts and summaries while removing each approval/gate/repair
  predecessor. The new exact-kind check made the old artifact-presence conjunct
  redundant; its surviving mutation exposed that, so it was replaced with the
  independently necessary digest guard instead of manufacturing a pass.
- Consequence: P02 gains gate evidence and blocking-audit identity; synthetic
  fixtures and comparison consumers move together. These remain contract
  simulations with production bindings deferred, not real artifact verification.
- Raw panel: `/private/tmp/war-parity-cycle5.wtes5E/audit-result.json`.
  Five of twelve panels used. T3 fixture work is separate/uncommitted.

### Cycle 6 — T2 repaired evidence acceptance (running)

- Pin `6ad0c91`; same three lenses/profile. Launched after the cycle-5 repair.
  The pinned scope excludes the T3 work developed concurrently.
- Raw result location: `/private/tmp/war-parity-cycle6.lhIt8I/audit-result.json`.
  Six of twelve panels used; do not treat an outstanding panel as approval.

## T3 initial evidence

- Seven fixture tests pass, including six assertion-killed mutations. A real
  process is SIGKILLed at after-push/before-record; a new process repairs persisted
  ledger state from local bare Git. Remote reflog and push-log checks prove no
  duplicate landing across two restarts. This driver is not the production engine.
- Loopback fake service persists before withholding a response; a new client
  recovers by correlation GET, with one POST total and no server-side dedup.
  Malformed ledger, unknown remote state, and network transport refusal have
  explicit negative evidence. Malformed ledger initially passed without a read;
  the regression failed before adding persisted-state validation.
- Hangs/output limits and inherited-pipe descendants are real processes with
  owned group cleanup. The descendant signals readiness only after a heartbeat
  write, avoiding a sleep-based readiness assumption. Temporary state is checked
  before cleanup; tests make no real GitHub or production remote requests.
- Mutation witnesses: repeated landing, unknown-tip refusal, ledger read,
  successful-parent cleanup, output bound, and correlation lookup. Every removed
  guard causes the selected assertion test to fail, not an initialization error.
- Consequence: one new reviewed baseline suite; no adapter/engine/hook/workflow
  changes. Production binding and actual host compatibility remain deferred.
