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
