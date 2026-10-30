// Recovery, resume and relaunch tests
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
import { test } from 'node:test'
import {
  assert,
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readdirSync,
  fileURLToPath,
  dirname,
  join,
  resolvePath,
  tmpdir,
  spawnSync,
  createHash,
  HARD_ESCALATION_REASONS,
  KNOWN_LAND_DECISIONS,
  SOFT_ENV_REASONS,
  BARRIER_TOKENS,
  RELEASE_SLOT_FILES,
  DEMOTE_REASONS,
  spawnOpts,
  validateRoster,
  widenRoster,
  resolveWidenSource,
  resolveGate,
  ROLES,
  DEFAULTS,
  SEAT_AGENT_TYPES,
  EVIDENCE_LENS,
  WIDEN_BARRED_LENSES,
  extractInterpolations,
  extractArgsFields,
  EXEMPT_FIELDS,
  MANIFEST_PATH_TEMPLATE,
  MANIFEST_KEYS,
  here,
  auditorMd,
  gateAuditChecklistMd,
  auditorTeachMd,
  refinerMd,
  schemasMdForAbsorb,
  gateFailureMd,
  refinerRecoveryMd,
  fileFollowupsMd,
  edgesMd,
  src,
  TRAILER_BLOCK_RULE,
  exactGitDiffRecipe,
  fixtureContentId,
  AsyncFunction,
  build,
  fakeParallel,
  NEW_SEAT_DEFAULTS,
  answerNewSeat,
  isHexSha,
  fixtureTree,
  branchOfPrompt,
  FIXTURE_REF_TIP,
  NEW_SEAT_KINDS,
  fixturePinRequest,
  fixtureGitProof,
  stableGatePrompt,
  fixtureGatePath,
  fixtureAuditPin,
  completeAuditFixture,
  completeMergeFixture,
  runPhase,
  seatOf,
  defaultImpl,
  PROVISION_ARGS,
  idx,
  isProvision,
  isWorker,
  isFixWorker,
  isAuditor,
  isServitor,
  isProvisionRun,
  PROVISION_LIST,
  withProvision,
  isProvisionTopology,
  MERGE_TASK_EXCLUDES,
  isMergeTask,
  isPinTransfer,
  isAceGate,
  isLand,
  buildSeqImpl,
  AUDIT_ARGS,
  COVEN_ARGS,
  DAG_ARGS,
  dagBaseImpl,
  servitorMd,
  gateAuditImpl,
  gateAuditCalls,
  makeGateAuditImpl,
  NO_TEST_ARGS,
  isAddTestWorker,
  runNoTestLoop,
  mergePromptsOf,
  FLOOR_SITE_RE,
  FLOOR_HEAD_RE,
  L3_ARGS,
  SUBMOD_PHASE_ARGS,
  isAce,
  isAceRevert,
  revertBetween,
  mergeRangeRevert,
  rangeRevertScriptOf,
  RANGE_REVERT_TOKENS,
  assertRangeRevertTokensMapped,
  ACE_ARGS,
  nit,
  approveWith,
  aceBase,
  reentryImpl,
  bWorker,
  bRegress,
  bApprove,
  ROSTER_TRIO,
  isRegularAudit,
  workerMd,
  bare,
  askFinding,
  CALIBRATION_SHARED,
  COST_CLAIM_SHARED,
  CALIBRATION_RULE_ANCHORS,
  CALIBRATION_QUALIFIER,
  qualifierPerRuleWindows,
  calibrationLine,
  capturedAuditPrompt,
  WORKER_MEM,
  AUDIT_MEM,
  SERV_MEM,
  MEMORY_MAP,
  MEMORY_TOOL_LITERAL,
  memoryQueryLineOf,
  isMemoryEvidenceSeat,
  MQ_SEAT_TASKS,
  SWEEP_ARGS,
  sweepBase,
  queuedAbsorb,
  ES_CONDS,
  ES_ARGS,
  esImpl,
  ES_CHECK_CMD,
  ES_ROWS,
  ES_ROW_ARGS,
  isEndstateCheck,
  REFINERY,
  ES_ROWS_CHECK_SECOND,
  ES_BT,
  esTransportPrompt,
  esFenced,
  esSeatPromptFor,
  OLD_FOUR_STATUS_ENUM,
  RETIRED_JUDGMENT_PATH,
  handoffMinorF,
  handoffImpl,
  HANDOFF_ARGS,
  crossTaskImpl,
  TIP_PLACEHOLDER,
  tipImpl,
  servitorPromptAtTip,
  PKG_ARGS,
  isPackageItWorker,
  PKG_TRUE_ARGS,
  schemasMd,
  CLS_ARGS,
  clsImpl,
  envMergeResult,
  envLandResult,
  SUBMOD_RETRY_REPO,
  submodRetryTask,
  assertSubmodScoped,
  assertSubmodLandScoped,
  baselineLandFail,
  markerEnvRe,
  NEEDS_DERIVATION_TASK,
  runCounting,
  EXPLICIT_TASK,
  SINGLE_PROV,
  RELAND_DISC_CMD,
  RELAND_DISC_BUDGET,
  RELAND_DISC_DIVERGE,
  FF_PREFLIGHT,
  FF_DEDUP_CMD,
  FF_DEDUP_RULE,
  FF_CLUSTER_KEY,
  FF_RETURN,
  ONE_TASK,
  gateAuditPinImpl,
  evidenceImpl,
  evPromptOf,
  evLineOf,
  preMergeTipOf,
  gateHeadShaOf,
  skewImpl,
  THREE,
  firstPassWorkOpts,
  runFixAndAce,
  runFloorRetry,
  parseInlineArray,
  extractLandDecisionLiterals,
  inlineHelperBlock,
  inlineHelpers,
  AGENTS_FIXTURES,
  RTRIO,
  EVIDENCE_SEAT,
  PLAIN_SEATS,
  VALIDATE_ROSTER_CASES,
  WIDEN_ROSTER_CASES,
  RESOLVE_WIDEN_CASES,
  RESOLVE_GATE_CASES,
  eligibilityMd,
  barrierTokensIn,
  windowOf,
  blockCommentSpans,
  naiveTwoStepStrip,
  EXPECTED_BLOCK_SPANS,
  GATE_TOKEN,
  PLAIN_FIXTURE_GATE,
  countOccurrences,
  planWith,
  baselineMergeResult,
  baselineLandResult,
  floorRetryImpl,
  pkgFloorRetryImpl,
  fixNeededImpl,
  SINGLE_TASK,
  bisectSubsetImpl,
  GATE_SITE_CAPTURES,
  DW_CMD,
  dwTask,
  DONE_WHEN_SITES,
  RETIRED_CRITERIA_FRAMING,
  RETIRED_CRITERIA_SAMPLES,
  DU_CMD,
  isMakePassWorker,
  runDoneUnmetLoop,
  DU_LOG,
  sliceSrc,
  CWD_IS_TIP_ASSERTING,
  RETIRED_PREMISE_SAMPLES,
  BRANCH_READ_FLAGS_ONLY_RETIRED,
  BRANCH_READ_FLAGS_ONLY_SAMPLES,
  GIT_GREP_STAYS_DENIED_RETIRED,
  GIT_GREP_NOT_AND_STAYS_DENIED_RETIRED,
  NEVER_SHELL_GREP_RETIRED,
  GIT_GREP_RETIRED_SAMPLES,
  flagTokenRe,
  HEAD_LEN,
  scanTemplateLiterals,
  LITERAL_REGISTRY,
  untaggedHeadMultiset,
  registryMultiset,
  multisetsEqual,
  sortedEntries,
  barrierEnv,
  RELAND_LABEL_STEM,
  RELAND_LABEL_PHID,
  RELAND_LABEL_FLAVOR,
  RELAND_LABEL_RE,
  SUBMOD_GUARD_RE,
  outerAssignRe,
  braceSpan,
  relandSubmodArms,
  twoIndependentTasks,
  semBlock,
  dispatchBlock,
  makeDispatch,
  BARE_INTERPOLATION_CENSUS,
  STOPLIST_ARGS,
  PRE_MERGED_ARGS,
  preMergedImpl,
  quietGate,
  GATE_AUDIT_CHECKLIST_SHA256,
  citationF,
  CITED_ADJ,
  CITE_ARGS,
  registrySlice,
  PT_ARGS,
  seatAt,
  ptImpl,
  ACE_FILE,
  aceOk,
  lensesOf,
  ptMismatchImpl,
  SCHEMA_KEYWORDS_SUPPORTED,
  evalSchema,
  EVALUATED_SCHEMAS,
  grabSchema,
  schemaKeywords,
  withBarrier,
  splitImpl,
  SPLIT_ARGS,
  approveBesideMajor,
  normalizedSrc,
  p4Base,
  polishPromptOf,
  demotionOf,
  filingPromptOf,
  PROBE,
  minor,
  floorImpl,
  DEMOTE_SITE_RE,
  demoteSites,
  reasonPrefixOf,
  NEGATIVE_REF,
  gaAbsorb,
  gaPromptOf,
  assertDispositionRuleOn,
  TERMINAL_RANGE_REVERT,
  terminalImpl,
  terminalCalls,
  carriedOf,
  fixRoundDoctrineMd,
  fixRoundRulesSection,
  FIX_APPLYING_BUILDS,
  dropDoctrineAt,
  chainRefMd,
  chainRulesSection,
  chainConst,
  CHAIN_FIX_POINTER,
  CHAIN_WORKER_POINTER,
  CHAIN_AUDIT_POINTER,
  CHAIN_EXAMPLES_POINTER,
  CHAIN_DEPTHS,
  chainExamplesH2s,
  chainBuildVariants,
  chainCode,
  polishAceImpl,
  CHAIN_FIX_BUILDS,
  dropChainFixAt,
  chainFixCaptures,
  chainFixPrompts,
  CHAIN_F1,
  CHAIN_F2,
  CHAIN_WORKER_NOTES,
  CHAIN_F3,
  CHAIN_F4,
  CHAIN_F5,
  chainDigestImpl,
  chainIndented,
  chainAudits,
  chainFixes,
  ASK_EVIDENCE_ARGS,
  askEvidenceImpl,
  evalPt,
  isMergeT1,
  SPLIT_PANEL_TASKS,
  splitPanelImpl,
  MAJOR_WITH_FIX,
  MAJOR_NO_FIX,
  auditorIdx,
  RELEASE_TASK,
  RELEASE_BLURB,
  releaseTaskImpl,
  NEVER_MOVE,
  reconciliationProof,
  realGitTools,
  pinBeforeOf,
  snapshotContextOf,
  realGitPinConfirm,
  gitTaskMerge,
  gitTaskFacts,
  confirmContextOf,
  reconcileContextOf,
  realGitMergeConfirm,
  deterministicWorkflow,
  REA_ROW,
  REA_ON,
  REA_HEAD,
  evidenceCardMd,
  isEvidenceSeat,
  reaLoudLines,
  promptsOf,
  REA_RESOLVED_PATH,
  REA_WORKER_SITES,
  ACE_TIP,
  blockedWith,
  INFRA,
  blockedAceImpl,
  keyedPinSeats,
  nonDescendantProbe,
  probeShas,
  movedProbe,
  approvedTreeProbe,
  probeAt,
  labelIdx,
  revertAwarePinSeats,
  assertLandedReverted,
  RANGE_TIP,
  SUB_TIP,
  RE_TIP,
  strayTreeAt,
  rangeRevertRepo,
  captureRangeRevertScript,
  ES_MERGE_CMD,
  mergeCommandOf,
  taskMergeSitePrompts,
  NEVER_MOVE_SENTENCE,
  es6Repo,
  bash,
  es6Phase,
  rebaseTask,
  runTrailerRead,
  assertRefused,
  READER_TOKEN,
  READER_CENSUS,
  readerCensusOf,
  mergeResultSchema,
  absorbReadOf,
  absorbFixture,
  readCharges,
  highestFor,
  evalTemplateConst,
  PROVISION_TREE_SENTENCE,
  PROVISION_CLEAN_SENTENCE,
  DEP_WAVE_PROVISION_SENTENCE,
  markerWriterOf,
  markerTestOf,
  PROVISION_CONSTS,
  provisionConstructOf,
  provisionSiteCensus,
  PROVISION_SITE_CENSUS,
  provisionFailure,
} from './workflow-template.test-harness.mjs'


test('Task 2 — transient drop recovers: 3-seat roster, one seat returns null first call then approves on retry → full panel', async () => {
  // The per-label call-sequence harness drives 'audit:t1:cascading-impact' to return null on call 1,
  // then return an approve verdict on call 2 (retry). The round should still see 3 approved seats.
  const approveVerdictFor = (label) => ({ seat: label, lens: 'cascading-impact', verdict: 'approve', findings: [], confidence: 'high' })
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, approveVerdictFor('audit:t1:cascading-impact')] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
      if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label.split(':')[2] || 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out } = await runPhase(COVEN_ARGS(), impl)
  // The task must land (not be audit-blocked) since the drop was transient.
  assert.ok(out.landed.includes('t1'), 'transient drop recovers — t1 should land (not audit-blocked)')
  // No audit-blocked escalation.
  const blocked = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'audit-blocked')
  assert.ok(!blocked, 'transient drop does not yield audit-blocked escalation')
})

test('#193 T1-3 — absent merge SHA now requires Git recovery before gate evidence or completion', async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS(), makeGateAuditImpl({}), { rawMergeResults: true })
  assert.ok(!out.landed.includes('t1'), 'missing merge identity cannot become a completed task')
  assert.ok(calls.some(c => c.opts.dispatchKind === 'merge-reconcile'))
  assert.equal(gateAuditCalls(calls).length, 0, 'unproved merges never become gate-audit inputs')
})

// Recovery Blocker 1 (Pivotal constraint: prompt-surface split — standing card + dispatched prompt,
// same task): the refiner card must LEARN the endstate-check dispatch flavor it is handed, the way
// the structurally identical evidence dispatch got its own card section. The dispatch is fail-open,
// so a refiner declining an unfamiliar dispatch (which has happened before — hence the provision
// section's never-out-of-mode line) means silent under-verification, never a loud failure. The
// mirrored duty prose is censused by the 'endstate-check dispatch card twin' both-surfaces registry
// row; this test pins the card-only structure: the section, the enumeration enrollments, the
// never-decline line, and the ENDSTATE_CHECK_RESULT return shape (on no standing surface before).
test('war-refiner.md documents the endstate-check dispatch (recovery Blocker 1): its own card section, Inputs + Return enrollment, the never-decline line, and the ENDSTATE_CHECK_RESULT shape', () => {
  assert.match(refinerMd, /## Land-barrier endstate-check dispatch/, 'the card carries its own endstate-check section (the evidence-dispatch pattern)')
  assert.match(refinerMd, /dispatchKind: endstate-check/, 'the section names the stable dispatchKind discriminator')
  assert.match(refinerMd, /## Land-barrier endstate-check dispatch[\s\S]{0,700}never out-of-mode: do not decline/i, "the section carries the never-decline defensive line (a fail-open dispatch declined is silent under-verification)")
  assert.match(refinerMd, /- `mode`[^\n]*endstate-check/, 'the ## Inputs mode enumeration names the endstate-check flavor (no longer affirmatively incomplete)')
  assert.match(refinerMd, /## Return[\s\S]*ENDSTATE_CHECK_RESULT/, 'the ## Return enumeration names ENDSTATE_CHECK_RESULT (it now appears on a standing surface)')
  assert.match(refinerMd, /\{ artifacts: \[\{ n, path, tip_sha, exit_code \}\] \}/, 'the card carries the exact ENDSTATE_CHECK_RESULT return shape')
})

test('#990 threaded tip — missing working SHA holds before Wrap-up if Git recovery cannot prove land', async () => {
  const { calls, out } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), tipImpl({}, { integration_sha: 'beefcafe12' }), { rawMergeResults: true })
  assert.notEqual(out.landDecision, 'landed')
  assert.ok(calls.some(c => c.opts.dispatchKind === 'merge-reconcile'))
  assert.ok(!calls.some(isServitor), 'no fallback pin substitutes for an unproved land')
})

test("Task 1.1 (End state 3) — land 'environment' recovered: the environment-proceed re-land's 'landed' ⇒ landDecision 'landed', the resync log line, and the servitor wrap-up dispatch fires", async () => {
  const { out, calls, logs } = await runPhase(CLS_ARGS(), clsImpl({ landResult: envLandResult }))
  assert.equal(calls.filter(c => /^land:phase-3:environment-proceed$/.test(c.opts.label || '')).length, 1, 'exactly one re-land is dispatched')
  assert.equal(out.landDecision, 'landed', 'a green re-land lands the phase (delete the recovery arm ⇒ held:land-failed ⇒ this fails)')
  assert.ok(logs.some(l => /environment-proceed re-land/.test(l) && /Opportunistic resync as on any landed phase/.test(l)),
    'it logs the same opportunistic-resync line the baseline-proceed landed arm logs (the primary chain resync arm is unreachable from a recovery arm)')
  assert.ok(calls.some(c => seatOf(c.opts) === 'war-servitor'),
    'the servitor wrap-up dispatch fires on the recovered land (the gate keys on memoryLocalRoot — CLS_ARGS threads it)')
  assert.equal((out.handoff.backstops || []).filter(b => b && b.source === 'auto').length, 0, "no debt, no source:'auto' backstop — nothing was waived")
})

test('Task 1.2 — BOTH recovery re-land prompts carry the identical discrimination (all three JS land surfaces)', async () => {
  // A land gate failure classified 'baseline'/'environment' dispatches its bounded recovery re-land; each
  // prompt must carry the same discrimination — the mirror-drift hazard is intra-file too (three land prompts).
  const cases = [
    ['baseline-proceed', /^land:phase-3:baseline-proceed$/, clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' }) })],
    ['environment-proceed', /^land:phase-3:environment-proceed$/, clsImpl({ landResult: envLandResult })],
  ]
  for (const [name, label, impl] of cases) {
    const { calls } = await runPhase(CLS_ARGS(), impl)
    const rp = calls.find(c => label.test(c.opts.label || ''))
    assert.ok(rp, `a ${name} re-land is dispatched`)
    const p = rp.prompt
    assert.ok(p.includes(RELAND_DISC_CMD), `${name} re-land prompt runs the rev-list discrimination`)
    assert.ok(p.includes('dev/cls'), `${name}: the discrimination names origin/<workingBranch> (interpolated)`)
    assert.ok(p.includes(RELAND_DISC_BUDGET), `${name} re-land prompt states the identical explicit-+1 budget`)
    assert.ok(p.includes(RELAND_DISC_DIVERGE), `${name} re-land prompt names the nonzero-right-count divergence branch`)
    assert.match(p, /return \{ mode: 'land-phase', status: 'land_stale' \} immediately/, `${name} re-land: nonzero right count → land_stale immediately`)
  }
})

test('Task 1.2 — grep parity: the standing discrimination copy (references/refiner-recovery.md, evicted from war-refiner.md §land-phase by Task 4.1) carries the byte-identical strings the JS prompts emit', () => {
  // Standing-vs-dispatched coverage split: the same three plain-text anchors the land prompts emit
  // must appear VERBATIM in the standing copy so the surfaces cannot drift (spec §8, grill Q5/Q11).
  // Presence keys relocated with the moved text (adjudication E): the standing copy now lives in
  // references/refiner-recovery.md; the card's land step 3 is a trigger pointer to it.
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_CMD), 'refiner-recovery.md § reland discrimination runs rev-list --left-right --count <merge-sha>...origin/')
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_BUDGET), 'refiner-recovery.md states the identical explicit-+1 budget sentence')
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_DIVERGE), 'refiner-recovery.md names the nonzero-right-count divergence branch')
  // the discrimination must appear for BOTH the superproject land and the submodule-2A land variant.
  assert.ok((refinerRecoveryMd.match(/git rev-list --left-right --count <merge-sha>\.\.\.origin\//g) || []).length >= 2,
    'the discrimination command is present in BOTH the superproject and submodule-2A land variants')
  // never anchored on the lagging local follower.
  assert.match(refinerRecoveryMd, /NEVER the local follower/, 'refiner-recovery.md pins the discrimination to origin, never the lagging local follower')
  // Pin the named trigger destinations, not a count that a new recovery pointer can mask.
  const recoveryTriggers = refinerMd.split('\n').filter(line => line.includes('](${CLAUDE_PLUGIN_ROOT}/skills/war/references/refiner-recovery.md)'))
    .map(line => line.match(/§ ([^).]+)/)?.[1])
  assert.deepEqual(recoveryTriggers.sort(), [
    'Submodule-as-repo provisioning', 'Uncertain merge reconciliation and § Exact Git diff identity', 'Recovery task provenance',
    'Pin-transfer arms', 'Land-barrier endstate-check steps',
    'Reland discrimination — superproject land-phase step 3', 'Submodule phase — 2A / § Submodule phase — 2B',
  ].sort())
  assert.match(refinerRecoveryMd, /## Land-barrier endstate-check steps/, 'the evicted endstate-check steps section landed at the destination')
  // #2156 a4 headroom eviction (ADR 0042, PIN-3): the card's MergeResult merge-task-only parenthetical
  // (617 B) moved byte-identical under its own `##` heading; the card keeps a bare-path trigger pointer
  // (never a `](…)` link — the named markdown-trigger set above stays separate) and none of the moved body.
  const mtOnly = refinerRecoveryMd.match(/^\(`floor_diagnostic` is merge-task-only — .*riding `status: "error"`\)$/m)
  assert.ok(mtOnly && Buffer.byteLength(mtOnly[0], 'utf8') === 617, 'refiner-recovery.md § MergeResult merge-task-only fields carries the 617 B evicted parenthetical byte-identical')
  assert.ok(refinerMd.includes('read ${CLAUDE_PLUGIN_ROOT}/skills/war/references/refiner-recovery.md § MergeResult merge-task-only fields'), 'the card keeps the bare-path trigger pointer to the evicted parenthetical')
  assert.ok(!refinerMd.includes('is merge-task-only — the exit-1 test floor'), 'the card no longer carries the evicted parenthetical body')
  assert.match(refinerRecoveryMd, /## Pin-transfer arms/, 'the evicted pin-transfer arms section landed at the destination')
  assert.ok(!/\((?:\.\.\/)+[^)]*refiner-recovery\.md\)/.test(refinerMd), 'no pointer uses a forbidden ../-prefixed path, at any depth')
  // Fourth, plain-text pointer — the fixed-shape ADR 0042 trigger line left by the
  // references-pointer-integrity Task 1.2 (h2) budget eviction of the § Base re-run +
  // re-attach recipe. It sits inside the `## Gate-failure classification` section, which the
  // in-band-absorb-default D12 eviction moved byte-identical into
  // references/gate-failure-classification.md — so the pointer now lives THERE (the card keeps
  // its own trigger pointer to that file). Pinned together with the moved fragment at the
  // destination, so neither half can be dropped without orphaning the other (the dispatched
  // merge/land prompts still carry the re-attach procedure — asserted by the #598 prompt tests above).
  assert.ok(gateFailureMd.includes('read ${CLAUDE_PLUGIN_ROOT}/skills/war/references/refiner-recovery.md (§ Base re-run + re-attach)'),
    'the ADR 0042 trigger pointer for the evicted Base re-run + re-attach recipe survives in the evicted classification section (gate-failure-classification.md)')
  assert.match(refinerMd, /\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/gate-failure-classification\.md\)/,
    'the card routes to the evicted classification section (D12 trigger pointer)')
  assert.ok(refinerRecoveryMd.includes('RE-ATTACH `_refinery` to the integration branch before you return'),
    'refiner-recovery.md carries the evicted Base re-run + re-attach recipe (byte-identical move)')
})

test('D9 (spec §9) — the held:workflow-error catch return carries workflowError.recovery (fresh Recovery relaunch, never resumeFromRunId) — one shared return site, universal', async () => {
  // The top-level catch has a SINGLE return site, so the additive recovery field rides EVERY catch-path
  // return. Probe two distinct throw origins (a malformed JSON string, a scalar args) to show it is on the
  // shared return, not path-specific. It names the sanctioned retry: a FRESH Recovery relaunch (new runId),
  // NEVER resumeFromRunId (the journal replays the cached error) — conforming to SKILL.md's ratified prose.
  for (const payload of ['{oops', 'null']) {
    const fn = build()
    const out = await fn(async () => ({}), fakeParallel, async () => [], () => {}, () => {}, payload, { total: null })
    assert.equal(out.landDecision, 'held:workflow-error', `args='${payload}' reaches the top-level catch`)
    assert.ok(typeof out.workflowError.recovery === 'string' && out.workflowError.recovery.length > 0,
      `args='${payload}': workflowError.recovery is a non-empty string`)
    assert.match(out.workflowError.recovery, /fresh Recovery relaunch/i, `args='${payload}': recovery names a fresh Recovery relaunch (new runId)`)
    assert.match(out.workflowError.recovery, /never\s+resumeFromRunId/i, `args='${payload}': recovery says never resumeFromRunId`)
  }
})

test('recovery absent (criterion 10): the recovery machinery is DORMANT — every dispatched prompt is byte-identical to a sanctioned run EXCEPT the provision barrier; the always-on STALE_REMOTE clause rides both', async () => {
  const { calls: absent } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const { calls: sanctioned } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  assert.equal(absent.length, sanctioned.length, 'same dispatch count — the recovery machinery changes NO dispatch when the barrier reports nothing')
  for (let i = 0; i < absent.length; i++) {
    if (absent[i].opts.dispatchKind === 'provision-barrier') {
      assert.notEqual(stableGatePrompt(absent[i].prompt), stableGatePrompt(sanctioned[i].prompt), 'the provision-barrier prompt DIFFERS (derive-and-skip is added when sanctioned)')
    } else {
      assert.equal(stableGatePrompt(absent[i].prompt), stableGatePrompt(sanctioned[i].prompt), `prompt #${i} (${absent[i].opts.label}) is byte-identical between recovery-absent and sanctioned`)
    }
  }
  const bAbsent = absent.find(isProvision).prompt
  const bSanctioned = sanctioned.find(isProvision).prompt
  // The always-on stale-remote classification is the ONLY barrier delta from a pre-feature run — present regardless of recovery.
  assert.match(bAbsent, /STALE_REMOTE/, 'the always-on stale-remote classification rides the barrier even when recovery is absent')
  assert.match(bSanctioned, /STALE_REMOTE/, 'the always-on stale-remote classification rides the barrier when sanctioned too')
  // The derive-and-skip step is dormant without recovery, present with it (delete-the-feature: the two-run diff IS the derive step).
  assert.doesNotMatch(bAbsent, /SANCTIONED RECOVERY RELAUNCH|derive-then-cut/i, 'the derive-and-skip step is DORMANT when recovery is absent')
  assert.match(bSanctioned, /SANCTIONED RECOVERY RELAUNCH|derive-then-cut/i, 'the derive-and-skip step is present when sanctioned')
})

test('recovery reclaim pass-through: --reclaim-stale-remote rides each ensure-worktree line IFF recovery.reclaimStaleRemote', async () => {
  const { calls: noReclaim } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  const { calls: reclaim } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true, reclaimStaleRemote: true } }), defaultImpl)
  const bNo = noReclaim.find(isProvision).prompt
  const bYes = reclaim.find(isProvision).prompt
  assert.doesNotMatch(bNo, /--reclaim-stale-remote/, 'no --reclaim-stale-remote flag when reclaimStaleRemote is unset (sanctioned but not reclaiming)')
  assert.match(bYes, /ensure-worktree[^\n]*--reclaim-stale-remote/, 'the ensure-worktree line carries --reclaim-stale-remote when reclaimStaleRemote is set')
})

test('recovery preMerged (criterion 10): a mocked barrier preMerged id → merged (NOT landed status), done+succeeded+landed+auditLog, NO worker, NOT in gate-audit; a dep on it is not dep-failed', async () => {
  // PROVISION_ARGS: t1, t2(deps:['t1']). The barrier reports t1 already-integrated on the adopted branch.
  const { out, calls } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.equal(out.landDecision, 'landed', 'the recovered phase still lands (t1 pre-merged, t2 re-dispatched + merged)')
  assert.ok(out.landed.includes('t1'), 't1 is recorded in the bare-id landed list')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:t1'), 'NO worker dispatched for the pre-merged task t1')
  const entry = (out.auditLog || []).find(e => e && e.task === 't1' && !e.verdict?.startsWith('audit-pin:'))
  assert.ok(entry, 'an auditLog entry exists for the pre-merged t1')
  assert.match(String(entry.note || ''), /recovered: pre-merged on adopted integration branch/, 't1 auditLog entry carries the recovered note')
  // t2 (dep on the pre-merged t1) satisfies the dep-block pre-check and dispatches normally.
  assert.ok(calls.some(c => (c.opts.label || '') === 'work:t2'), 't2 (dep on pre-merged t1) IS dispatched — the dep-block pre-check passes (t1 in succeeded)')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't2' && e.reason === 'dep-failed'), 't2 is NOT spuriously dep-failed')
  // The pre-merged task ran no gate this run, so it is NOT in the gate-audit set (handoff tipSha fallback stays truthful).
  assert.ok(!calls.some(c => (c.opts.label || '') === 'gate-audit:t1:execution-evidence'), 'NO gate-audit seat for the pre-merged t1 (no gate ran for it this run)')
  // Criterion 11: the merged-set skip never skips the gate-audit for the re-dispatched task.
  assert.ok(calls.some(c => (c.opts.label || '') === 'gate-audit:t2:execution-evidence'), 't2 gate-audit IS still dispatched on the recovered phase (criterion 11)')
})

test('recovery all-pre-merged degenerate (criterion 11): endState claims + every task pre-merged → the End-state-only seat fires at the confirmed tip', async () => {
  // ES_ARGS is a single-task phase (t1) claiming End-state conditions. The barrier reports t1 pre-merged,
  // so mergedTasksForGateAudit is empty AND the phase claims conditions → the End-state-only seat branch fires.
  const { out, calls } = await runPhase({ ...ES_ARGS(), recovery: { sanctioned: true } }, barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.ok(out.landed.includes('t1'), 't1 recorded merged/landed (pre-merged)')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:t1'), 'no worker dispatched for the pre-merged task')
  const esSeat = calls.filter(c => (c.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.equal(esSeat.length, 1, 'exactly ONE End-state-only seat fires in the degenerate all-pre-merged case (the existing branch)')
})

test('recovery staleRemote (end-state 22): a mocked barrier staleRemote entry → per-task env-blocked (no worker), two-direction diagnostic + restore command; siblings dispatch; a dependent follows dep-failed; no phase halt; rides the return', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tStale', issue: 201, title: 'Stale task', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 'tSib', issue: 202, title: 'Sibling', planSlice: 's2', roster: [{ lens: 'correctness' }] },
    { id: 'tDep', issue: 203, title: 'Dependent', planSlice: 's3', roster: [{ lens: 'correctness' }], deps: ['tStale'] },
  ] })
  // The barrier CONTINUED past tStale's STALE_REMOTE marker and reported it (mock keyed on the barrier dispatchKind).
  const { out, calls } = await runPhase(args, barrierEnv({ ok: true, staleRemote: [{ task: 'tStale', remoteSha: 'cafebabe', frozenTip: 'deadbeef' }] }))
  // tStale → the EXISTING per-task env-blocked status, worker never spawned.
  const eb = (out.escalated || []).find(e => e && e.task === 'tStale' && e.reason === 'env-blocked')
  assert.ok(eb, 'tStale is mapped to the existing per-task env-blocked status')
  assert.equal(eb.staleRemote, true, 'the escalation record is tagged staleRemote')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tStale'), 'NO worker dispatched for the stale-remote task')
  // Full two-direction diagnostic + the reversible restore command.
  const diag = String(eb.diagnostic || '')
  assert.match(diag, /git branch [^\n]*cafebabe/, 'diagnostic direction (a): adopt via git branch <branch> <remoteSha>')
  assert.match(diag, /--reclaim-stale-remote/, 'diagnostic direction (b): sanctioned --reclaim-stale-remote')
  assert.match(diag, /git push origin cafebabe:refs\/heads\//, 'diagnostic carries the reversible restore command')
  // Siblings dispatch normally; a dependent follows the EXISTING dep-failed semantics; no barrier halt.
  assert.ok(calls.some(c => (c.opts.label || '') === 'work:tSib'), 'the independent sibling dispatches normally (no barrier halt of the phase)')
  const dep = (out.escalated || []).find(e => e && e.task === 'tDep' && e.reason === 'dep-failed')
  assert.ok(dep, 'a dependent of the stale-remote task follows the existing dep-failed semantics')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tDep'), 'the dependent is NOT dispatched (dep-failed)')
  // The classification rides the machine-readable return; a hard dep-failed → held:escalation → handoff emitted.
  assert.ok((out.escalated || []).some(e => e && e.staleRemote), 'the stale-remote classification rides the machine-readable return')
  assert.ok(out.handoff, 'handoff emitted on held:escalation (the classification is handed off to the Lead)')
})

// Recovery delegates its graph proof to the real-Git helper tested below; no prompt-only count oracle.
test('derive-and-skip: zero-commit branch dispatches (#1895/#2006/#2196)', async () => {
  const args = PROVISION_ARGS({ recovery: { sanctioned: true } })
  const { out, calls } = await runPhase(args, barrierEnv({ ok: true, preMerged: [] }))
  const b = calls.find(isProvision).prompt
  assert.ok(b.includes('task-integrated.sh <branch> <integration> <working>'))
  const proofs = JSON.parse(b.match(/RECOVERY TASK PROOFS: ([^\n]+)/)[1])
  assert.ok(proofs.every(p => p.repo === '/abs/repo' && p.integration === 'integration/wtprov-a/phase-3' && p.working === 'dev/wtprov-a'))
  assert.match(b, /exit 0 with TASK_INTEGRATED/)
  assert.match(b, /Exit 1 with NO_TASK_PROOF/)
  assert.match(b, /Exit 2 or any unrecognized failure halts/)
  assert.ok(calls.some(c => c.opts.label === 'work:t1'))
  assert.ok(!out.auditLog.some(r => r.verdict === 'recovered:pre-merged'))
  const dormant = (await runPhase(PROVISION_ARGS(), defaultImpl)).calls.find(isProvision).prompt
  assert.ok(!dormant.includes('task-integrated.sh'), 'recovery proof stays dormant on a fresh run')
  const merged = await runPhase(args, barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.ok(merged.logs.some(l => /task t1 is pre-merged .*task-integrated.sh/.test(l)))
  assert.ok(!merged.calls.some(c => c.opts.label === 'work:t1'))
  for (const c of (await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), fixNeededImpl())).calls.filter(c => isWorker(c) || isFixWorker(c))) {
    assert.ok(c.prompt.includes('TASK PROVENANCE: put the exact trailer WAR-Task: war/wtprov-a/p3-t1'), 'implementation and fix producers carry the trailer')
  }
})

// (c) relaunch fix — STRUCTURAL dispatch-layer scoping (the both-ways proof, other direction): an
// engine-authored HARD throw that EMBEDS worker-supplied text matching INFRA_DEATH_RE (here a
// reported path containing "quota", thrown by normalizeReportedPaths OUTSIDE the agent() dispatch)
// must stay HARD 'escalate' — a message-only classification would launder it into SOFT env-died and
// flip a hard escalation into lands-minus-task. The dispatch-originated fixtures above are the
// matching direction: a throw crossing the agent() boundary still classifies env-died.
test('Task 2.1(c) #1411 relaunch — an engine throw whose message contains "quota" but originates OUTSIDE the dispatch stays HARD escalate, never env-died', async () => {
  const impl = (prompt, opts) => (seatOf(opts) === 'war-worker' && opts.phase === 'Work')
    // outside BOTH roots (worktreeRoot AND mainCheckout) → normalizeReportedPaths arm (d) throws an
    // ENGINE error with the worker-supplied path — and its infra words — embedded in the message.
    ? { task_id: 'tQ', status: 'implemented', head_sha: 'abc0000', tests: {}, files_changed: ['/opt/elsewhere/quota-overloaded.txt'] }
    : defaultImpl(prompt, opts)
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tQ', issue: 1, title: 'reports a path embedding infra words', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out } = await runPhase(args, impl)
  const esc = (out.escalated || []).find(e => e && e.task === 'tQ')
  assert.ok(esc, 'the task escalates (presence guard)')
  assert.match(String(esc.blocked), /quota/, 'non-vacuity guard: the HARD message really carries an INFRA_DEATH_RE word')
  assert.equal(esc.reason, 'escalate', 'the engine throw keeps its HARD class — message content alone never classifies env-died (structural scoping)')
  assert.equal(out.landDecision, 'held:escalation', 'the phase HOLDS — the laundering path (env-died → lands-minus-task) is closed')
})

test('preMerged-dialect: worktree-name-shaped ids (p2-2.1) skip the four merged tasks exactly as bare ids do', async () => {
  const dialect = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['p2-2.1', 'p2-2.2', 'p2-2.3', 'p2-2.4']))
  const bare = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['2.1', '2.2', '2.3', '2.4']))
  for (const [label, run] of [['worktree-name dialect', dialect], ['bare-id dialect', bare]]) {
    assert.deepEqual(run.out.landed, ['2.1', '2.2', '2.3', '2.4'],
      `${label}: all four tasks recorded in the TASK-ID dialect — got ${JSON.stringify(run.out.landed)}`)
    assert.equal(run.calls.filter(isWorker).length, 0, `${label}: no worker dispatched for a pre-merged task`)
    assert.equal(run.out.landDecision, 'landed', `${label}: the fully-pre-merged phase lands`)
  }
})

test('preMerged-dialect: a garbage id is logged loudly and dropped — never a silent skip-disable', async () => {
  const { out, calls, logs } = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['p2-2.1', 'p9-zzz']))
  const loud = logs.find(l => /preMerged id "p9-zzz" matches NO task/.test(l))
  assert.ok(loud, `the unmatched id is logged loudly — logs: ${JSON.stringify(logs.filter(l => /preMerged/.test(l)))}`)
  assert.match(loud, /#1704/, 'the log cites the incident issue')
  assert.match(loud, /"zzz"/, 'the log shows the normalized form it failed to match')
  // 2.1 skipped; the other three tasks still run workers (the garbage id disabled nothing).
  assert.equal(calls.filter(isWorker).length, 3, 'exactly the three non-pre-merged tasks dispatch workers')
  assert.ok(out.landed.includes('2.1'), 'the dialect-matched id is recorded merged')
})

test('preMerged-dialect: a fully-pre-merged recovery phase is not vacuous — endstate rows are not clamped', async () => {
  const args = PRE_MERGED_ARGS()
  args.phase.endState = ['Condition A holds at the tip']
  args.intent = 'Deliver the wtprov end states.'
  const { out } = await runPhase(args, preMergedImpl(['p2-2.1', 'p2-2.2', 'p2-2.3', 'p2-2.4']))
  assert.equal(out.landDecision, 'landed', 'fully-pre-merged phase lands')
  assert.ok(!out.handoff.endState[0].note, 'barrier-recovered landings count — no zero-tasks-ran clamp')
})

// --- recovery-holder (End state 27, #1712 fix 3, Phase 6 Task 1 (e)) ------------------------

// Sanctioned relaunch: the barrier prompt carries the pre-checkout ref-holder auto-free clause —
// clean SAME-plan prior-generation holders only (detach for _refinery, worktree-remove for a
// workless task worktree), ancestor check resolved against the integration branch itself (never
// step-3's unbound $TIP, #1794) — and a clean-holder run provisions without Lead intervention.
test('recovery-holder (End state 27): a sanctioned relaunch instructs clean same-plan holder auto-free (detach _refinery / remove workless task worktree) and provisions without Lead intervention', async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /pre-checkout ref-holder auto-free/, 'the holder auto-free clause rides the sanctioned barrier prompt')
  assert.match(p, /git worktree list --porcelain/, 'holders are enumerated via git worktree list --porcelain')
  assert.match(p, /checkout --detach/, 'a stale _refinery holder is DETACHED (the worktree survives)')
  assert.match(p, /git worktree remove/, 'a WORKLESS task worktree holder is removed')
  assert.match(p, /its held branch carries the plan slug wtprov-a/, "same-plan discrimination: the clause names THIS plan's slug")
  assert.match(p, /Plain git verbs only/, 'plain git verbs — never a new script flag')
  // #1794 fix: the ancestor check resolves against the integration branch itself, never "$TIP".
  assert.ok(p.includes('git merge-base --is-ancestor') && p.includes('never "$TIP"'), 'the workless predicate resolves against the integration branch, never step-3\'s unbound $TIP')
  assert.match(p, /SKIP the removal arm/, 'a not-yet-existing integration branch SKIPs the removal arm (an unverified worktree is never removed)')
  // Behavioral: a clean-holder barrier returns ok:true and the phase runs end-to-end unassisted.
  assert.ok(calls.some(isWorker), 'workers dispatch — the relaunch provisions without Lead intervention')
  assert.equal(out.landDecision, 'landed', 'the sanctioned relaunch completes the phase')
})

test('recovery-holder (End state 27): a DIRTY holder dies loud with the holder path named; a FOREIGN plan\'s holder is never freed', async () => {
  const args = PROVISION_ARGS({ recovery: { sanctioned: true } })
  const { calls } = await runPhase(args, defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /NEVER free a DIRTY holder/, 'the dirty-holder refusal is explicit')
  assert.match(p, /HOLDER PATH named in stderrTail/, 'a dirty holder dies loud with the holder path in stderrTail')
  assert.match(p, /NEVER free a holder of a FOREIGN plan's refs/, "a foreign plan's holder is never freed — left in place, die loud if it blocks")
  // Behavioral: the barrier's dirty-holder die (ok:false naming the holder path) halts the phase
  // with the path surfaced — never a silent free, never a silent continue.
  const dirtyPath = '/abs/repo/.claude/worktrees/old-run/p3-t1'
  const { out } = await runPhase(args, barrierEnv({ ok: false, failedCommand: 'ensure-worktree …', exitCode: 128,
    stderrTail: `dirty prior-generation holder at ${dirtyPath} — refusing to free (unmerged work)` }))
  assert.equal(out.landDecision, 'held:workflow-error', 'a dirty-holder die is a hard barrier stop (no topology)')
  assert.ok(String(out.workflowError && out.workflowError.message).includes(dirtyPath), 'the holder path surfaces verbatim in the workflow error')
})

test('recovery-holder (End state 27): the holder auto-free clause is DORMANT without args.recovery.sanctioned', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.doesNotMatch(p, /ref-holder auto-free/, 'no holder auto-free clause on an unsanctioned run')
  assert.doesNotMatch(p, /git worktree remove/, 'no removal instruction on an unsanctioned run (byte-identical dormancy)')
})

test('provenance floor (ruledAsks, S1 third arm — #1879 recovery seed): an EXPLICIT-branch/worktree launch (NO planSlug derivation) with a foreign ruled-ask record is STILL refused at entry — the anchor falls back to plan.file\'s basename', async () => {
  // The exact silent-off configuration the S1 defect fired on (the recovery-relaunch shape): the
  // launch supplies explicit per-task branch/worktree, so top-level planSlug is legitimately
  // absent — an anchor derived from the OPTIONAL planSlug alone would switch the compare off and
  // admit the foreign record. The fallback anchor (plan.file basename, baseOf()-normalized,
  // .md-stripped: 'wtprov-a') must refuse it. The derivation-path arms alone verify the fix where
  // the defect never fired.
  const ledgerCargo = {
    planSlug: '2026-08-27-in-run-finding-resolution',
    phase: '1',
    findingTitle: 'Absorb-by-citation can unpark an operator-gated ask in an interactive run, while the standing doc scopes the arm to --afk',
    ruling: 'Gate on run.afk === true; interactive citation-matches surface with prefilled recommended ruling; citation-informed rulings share the telemetry channel.',
    suggested_fix: 'One-condition gate at the recordAced unpark path (run.afk === true); strike-list prefill rendering; two-sided fixture (interactive surfaces-never-unparks / afk resolves-with-citation); telemetry symmetry.',
  }
  const args = PROVISION_ARGS({ ruledAsks: [ledgerCargo] })
  delete args.planSlug
  args.tasks = args.tasks.map(t => ({ ...t,
    branch: `war/wtprov-a/p3-${t.id}`, worktree: `/abs/repo/.claude/worktrees/run-2026/p3-${t.id}` }))
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'the foreign ruled-ask record refuses the explicit-branch launch at entry — the compare never silently switches off')
  assert.match(out.workflowError.message,
    /args\.ruledAsks carries a planSlug provenance stamp naming a foreign plan \(2026-08-27-in-run-finding-resolution\) differing from the plan\.file basename/,
    'the refusal names the fallback anchor (the plan.file basename) it compared against')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('ruled-ask intake (S3 — #1879 recovery seed): every dropped non-conforming record is LOGGED with its findingTitle-or-(malformed) and the FAILED CONJUNCT — an operator ruling never vanishes silently, and conforming records still queue', async () => {
  // One record per REQUIRED-coordinate conjunct (plus a not-an-object control): deleting any of
  // the intake conjuncts un-drops its record AND silences its drop log — both red this fixture
  // (the prior audit's 'REQUIRED-coordinates intake conjuncts unguarded' finding). Each record's
  // text carries the run's own 'wtprov' token so the #1413 own-token floor never masks the intake
  // behavior under test.
  const slugless = { findingTitle: 'coordinate-less ruling', ruling: 'do it per the wtprov-a call', suggested_fix: 'one line', phase: '3' }
  const phaseless = { planSlug: 'wtprov-a', findingTitle: 'phase-less ruling', ruling: 'do it', suggested_fix: 'one line' }
  const titleless = { planSlug: 'wtprov-a', phase: 3, ruling: 'do it', suggested_fix: 'one line' }
  const notObject = 'a bare string (plan wtprov-a)'
  const conforming = { planSlug: 'wtprov-a', phase: '3', findingTitle: 'conforming ruled ask', ruling: 'do it', suggested_fix: 'one line' }
  const { out, logs } = await runPhase(PROVISION_ARGS({ ruledAsks: [slugless, phaseless, titleless, notObject, conforming] }), defaultImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'dropped records stay fail-open — the launch proceeds (inert to the queue, never a refusal)')
  const drops = logs.filter(l => typeof l === 'string' && l.includes('ruled-ask intake DROPPED'))
  assert.equal(drops.length, 4, 'every non-conforming record gets its own drop log line')
  assert.ok(drops.some(l => l.includes('"coordinate-less ruling"') && l.includes('planSlug (required provenance coordinate')),
    'a planSlug-less record is dropped LOUDLY, named by its findingTitle, with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"phase-less ruling"') && l.includes('phase (required provenance coordinate')),
    'a phase-less record is dropped LOUDLY with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"(malformed)"') && l.includes('findingTitle (required provenance coordinate')),
    'a findingTitle-less record is dropped LOUDLY under the (malformed) placeholder with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"(malformed)"') && l.includes('not an object')),
    'a non-object entry is dropped LOUDLY under the (malformed) placeholder')
  const queued = logs.filter(l => typeof l === 'string' && l.includes('ruled-ask execution (D15)'))
  assert.equal(queued.length, 1, 'exactly the conforming record queues')
  assert.ok(queued[0].includes('conforming ruled ask'), 'the conforming record rides the queue untouched (positive control)')
})

test('#1940 — PIN-13 seed: a behavioural resume simulation, not a source-shape assertion', () => {
  const m = src.match(/r\.task\.fixRounds = (Math\.max\([^\n]+\))/)
  assert.ok(m, 'src must contain the merge-slot fixRounds seed')
  // eslint-disable-next-line no-new-func
  const seed = new Function('r', `return (${m[1]})`)
  // The wave ran in-process and the ace charged rounds: the merge slot must NOT lower it.
  assert.equal(seed({ task: { fixRounds: 4 }, round: 1 }), 4,
    'a wave-side ace charge survives the merge-slot seed — re-seeding to r.round is the clobber PIN-13 forbids')
  // The resume shape: the merge queue is entered without the wave running in this process.
  assert.equal(seed({ task: {}, round: 2 }), 2,
    'on resume fixRounds is undefined and the seed supplies r.round — never undefined')
  const bare = seed({ task: {}, round: undefined })
  assert.equal(bare, 0, 'with neither source the seed is 0, never NaN')
  assert.equal(bare < 6, true,
    'and 0 opens the ace gate — `undefined < 6` is false, the exact defect that made the hoisted ace never dispatch')
  assert.equal(Number.isInteger(bare), true, 'the seeded value stays an integer, so `ace:<site>:<task>:a<n>` never renders aNaN')
})

test('absorb-budget (End state 4, resume seed): three Ace-Charge trailers on the branch ⇒ the task resumes at absorbRounds 3 — the next ace label and Ace-Charge trailer read 4', async () => {
  const impl = withBarrier({ ok: true, absorbCharges: { t1: 3 } }, aceBase([nit()]))
  const { calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('absorb-budget: task t1 resumes at absorbRounds 3 (barrier absorbCharges')), 'the seed is logged from the barrier read')
  const ace = calls.find(isAce)
  assert.ok(ace, 'the batch ace dispatched (3 < 6)')
  assert.equal(ace.opts.label, 'ace:polish:t1:a4', 'the ace label carries absorbRounds (the slot this commit charges)')
  assert.match(ace.prompt, /`Ace-Charge: t1:4`/, 'the Ace-Charge trailer index is absorbRounds AFTER the charge')
  const gate = calls.find(c => c.opts.dispatchKind === 'ace-gate')
  assert.ok(gate && gate.opts.label === 'ace-gate:t1:a4', 'the ace-gate label carries the charged absorbRounds')
})

test('absorb-budget (End state 4, charge then revert): one charge and its revert ⇒ the branch reads 1 (the reverted commit\'s trailer still counts) — the task resumes at 1 and the barrier prompt says so', async () => {
  const impl = withBarrier({ ok: true, absorbCharges: { 'p3-t1': 1 } }, aceBase([nit()]))
  const { calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('task t1 resumes at absorbRounds 1')), 'the worktree-name dialect key (p3-t1) seeds the bare-id task')
  const ace = calls.find(isAce)
  assert.equal(ace && ace.opts.label, 'ace:polish:t1:a2', 'the next ace charges slot 2')
  const barrier = calls.find(isProvision)
  assert.match(barrier.prompt, /a reverted ace commit's trailer still counts/, 'the barrier prompt states that a revert never un-charges')
  assert.match(barrier.prompt, /HIGHEST integer n/, 'the barrier reads the highest index, never a count')
})

test('absorb-budget (End state 4, Lead override): args.absorbCharges wins over the barrier read on a relaunch (no recovery gate), logged', async () => {
  const impl = withBarrier({ ok: true, absorbCharges: { t1: 5 } }, aceBase([nit()]))
  const { calls, logs } = await runPhase(ACE_ARGS({ absorbCharges: { t1: 2 } }), impl)
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('task t1 resumes at absorbRounds 2 (args.absorbCharges')), 'the override source is named')
  assert.equal((calls.find(isAce) || {}).opts.label, 'ace:polish:t1:a3', 'the override seed drives the next slot')
})



test('absorb-budget (D5, #2034, never ran a wave — preMerged): a relaunch-seeded held row on a task the barrier reports preMerged drains to the phase-close sweep with the recovered verdict — logged, never dropped', async () => {
  // t1 enters `done`+`succeeded` before nextWave() (no result object). The drain must still see it.
  const held = { severity: 'Nit', title: 'seeded on pre-merged', file: 'skills/pm.js', rationale: 'held earlier', autoFixable: true, task: 't1', seat: 'audit:t1:correctness' }
  const args = PROVISION_ARGS({ recovery: { sanctioned: true }, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], pendingAbsorbs: [held] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
  ] })
  const { out, logs } = await runPhase(args, barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.ok(out.landed.includes('t1'), 'presence guard: t1 is the pre-merged task')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('task t1 merged with 1 held absorb(s)') && l.includes('verdict recovered:pre-merged')),
    'the drain logs the pre-merged task with its auditLog verdict')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Re-entry routing') && l.includes('seeded on pre-merged') && l.includes('held absorb — the task merged')),
    'the held row is routed to the phase-close sweep')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('seeded on pre-merged') && l.includes('demote:absorb-blocked')), 'a succeeded task never demotes its held rows')
})

test('absorb-budget (D5, #2034, never ran a wave — unrunnable-deps): a relaunch-seeded held row on a task whose deps name a ghost id drains through the post-loop catch-all and demotes naming the unrunnable-deps verdict (snipe: test-fidelity)', async () => {
  const held = { severity: 'Nit', title: 'seeded on ghost-dep', file: 'skills/gd.js', rationale: 'held earlier', autoFixable: true, seat: 'audit:t2:correctness' }
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc1234', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    return {}
  }
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Ghost dep', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['ghost'], pendingAbsorbs: [held] },
  ] })
  const { out, logs } = await runPhase(args, impl)
  assert.ok((out.escalated || []).some(e => e.task === 't2' && e.reason === 'unrunnable-deps'), 'presence guard: t2 escalates as unrunnable-deps')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('task t2 never merged (verdict unrunnable-deps)')), 'the catch-all drain logs the unrunnable-deps verdict')
  const row = (out.minorsFiled || []).find(m => m && m.title === 'seeded on ghost-dep')
  assert.ok(row && /^demote:absorb-blocked/.test(row.demoteReason || ''), 'the held row demotes with demote:absorb-blocked (never dropped)')
})

test('absorb-budget (D5, #2034, snipe: test-fidelity Major): a relaunch-seeded ASK on a pre-merged task parks on asks[] and never reaches the polish worker; a seeded follow-up files and a seeded note notes on the same never-ran path', async () => {
  const ask = { severity: 'Minor', title: 'seeded ask on pre-merged', file: 'skills/pm.js', rationale: 'r', disposition: 'ask', ask: { question: 'keep or drop?', fork: ['keep', 'drop'] }, seat: 'audit:t1:correctness' }
  const fu = { severity: 'Minor', title: 'seeded follow-up on pre-merged', file: 'skills/pm.js', rationale: 'r', disposition: 'follow-up', barrier: 'barrier:underspecified', seat: 'audit:t1:correctness' }
  const note = { severity: 'Nit', title: 'seeded note on pre-merged', file: 'skills/pm.js', rationale: 'r', disposition: 'note', seat: 'audit:t1:correctness' }
  const args = PROVISION_ARGS({ recovery: { sanctioned: true }, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], pendingAbsorbs: [ask, fu, note] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
  ] })
  const { out, calls, logs } = await runPhase(args, barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.ok(out.landed.includes('t1'), 'presence guard: t1 is the pre-merged task')
  assert.ok((out.asks || []).some(a => a && a.question === 'keep or drop?' && a.finding && a.finding.title === 'seeded ask on pre-merged'), 'the seeded ask parks (never an absorb)')
  assert.ok(!calls.some(c => (c.opts.label || '').startsWith('polish:') && c.prompt.includes('seeded ask on pre-merged')), 'the ask never reaches a polish worker prompt')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('seeded ask on pre-merged') && l.includes('Re-entry routing')), 'the ask is never routed to the sweep')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'seeded follow-up on pre-merged' && !m.demoteReason), 'the seeded follow-up files as stated')
  assert.ok((out.notes || []).some(n => n && n.title === 'seeded note on pre-merged'), 'the seeded note notes')
})

test('absorb-budget (D5, #2034, never ran a wave — staleRemote): a relaunch-seeded held row on a task classified env-blocked by the barrier demotes with demote:absorb-blocked naming the env-blocked verdict — logged, never dropped', async () => {
  const held = { severity: 'Nit', title: 'seeded on stale', file: 'skills/st.js', rationale: 'held earlier', autoFixable: true, task: 'tStale', seat: 'audit:tStale:correctness' }
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tStale', issue: 201, title: 'Stale', planSlice: 's1', roster: [{ lens: 'correctness' }], pendingAbsorbs: [held] },
  ] })
  const { out, calls, logs } = await runPhase(args, barrierEnv({ ok: true, staleRemote: [{ task: 'tStale', remoteSha: 'cafebabe', frozenTip: 'deadbeef' }] }))
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tStale'), 'presence guard: no worker ran for the stale-remote task')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('task tStale never merged (verdict env-blocked:stale-remote)') && l.includes('1 held absorb(s) demote with demote:absorb-blocked')),
    'the drain logs the never-ran task with its env-blocked verdict')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'seeded on stale'), 'the held row demotes to follow-up (never dropped)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('seeded on stale') && l.includes('demote:absorb-blocked')), 'the demotion carries the demote:absorb-blocked reason')
})

test('filing-floor — the probe is read-only and idempotent on resume: a second run over the same seats yields the same routing (in-diff absorb) and one probe per run', async () => {
  const f = minor({ title: 'idempotent row', suggested_fix: 'do x' })
  const r1 = await runPhase(SWEEP_ARGS(), floorImpl([f]), PROBE)
  const r2 = await runPhase(SWEEP_ARGS(), floorImpl([f]), PROBE)
  for (const r of [r1, r2]) {
    assert.equal(r.calls.filter(c => c.opts.dispatchKind === 'diff-probe').length, 1, 'one probe per task per run')
    assert.ok(r.calls.find(isAce) && r.calls.find(isAce).prompt.includes('idempotent row'), 'the same in-diff routing each run')
    assert.ok(/read-only git read, no merge, no push, no rebase, no gate/.test(r.calls.find(c => c.opts.dispatchKind === 'diff-probe').prompt), 'the probe prompt is read-only')
  }
})

test('held-carry — a relaunch with args.seededPhaseClose drains the seeded entries into the sweep (logged per row); entry validation refuses a malformed seed; a foreign planSlug refuses at entry (#1413)', async () => {
  const seed = [{ severity: 'Minor', title: 'carried nit', file: 'docs/c.md', rationale: 'r', disposition: 'absorb', planSlug: 'wtprov-a', carriedFrom: { phase: 2, reason: 'held phase' } }]
  const { out, calls, logs } = await runPhase(SWEEP_ARGS({ seededPhaseClose: seed }), sweepBase([]))
  assert.ok(polishPromptOf(calls).includes('carried nit'), 'the seeded row reaches the sweep dispatch')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('held-carry (D3b): seeded phase-close row "carried nit"') && l.includes('carried from phase 2')), 'the drain is logged per row')
  assert.ok((out.aced || []).some(a => a.finding.title === 'carried nit' && a.sha === 'b01a5a00'), 'and it aces at the polish sha')
  for (const [bad, msg] of [
    ['nope', 'args.seededPhaseClose must be an array'],
    [['x'], 'args.seededPhaseClose[0] must be a finding row object'],
    [[{ severity: 'Minor' }], 'args.seededPhaseClose[0].title must be a non-empty string'],
    [[{ title: 't' }], 'args.seededPhaseClose[0].severity must be a non-empty string'],
    [[{ title: 't', severity: 'Major', file: 'docs/c.md', planSlug: 'wtprov-a' }], 'args.seededPhaseClose[0].severity must be one of Minor|Nit'],
    [[{ title: 't', severity: 'Nit', file: 5 }], 'args.seededPhaseClose[0].file must be a repo-relative path string or null'],
  ]) {
    const r = await runPhase(SWEEP_ARGS({ seededPhaseClose: bad }), sweepBase([]))
    assert.equal(r.out.landDecision, 'held:workflow-error', JSON.stringify(bad) + ' is refused at entry')
    assert.ok(r.out.workflowError.message.includes(msg), 'the refusal names the field: ' + msg)
    assert.equal(r.calls.length, 0, 'zero agents')
  }
  const foreign = await runPhase(SWEEP_ARGS({ seededPhaseClose: [{ ...seed[0], planSlug: 'other-plan' }] }), sweepBase([]))
  assert.equal(foreign.out.landDecision, 'held:workflow-error', 'a foreign planSlug stamp refuses')
  assert.match(foreign.out.workflowError.message, /args\.seededPhaseClose carries a planSlug provenance stamp naming a foreign plan \(other-plan\)/, 'the #1413 refusal names the surface and the stamp')
  // an own-token-less, stamp-less row fails the own-token floor (the carried row's planSlug stamp is what exempts it)
  const bare = await runPhase(SWEEP_ARGS({ seededPhaseClose: [{ severity: 'Minor', title: 'carried nit', file: 'docs/c.md', rationale: 'r' }] }), sweepBase([]))
  assert.equal(bare.out.landDecision, 'held:workflow-error')
  assert.match(bare.out.workflowError.message, /args\.seededPhaseClose contains none of the run's own plan-slug tokens/, 'the own-token floor applies to the surface')
})

test('recovery integrity #2196: real Git provenance distinguishes sibling, legacy, empty, unmerged and rebased task work', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-task-provenance-'))
  const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  const taskBranch = 'war/wtprov-a/p3-t1', integration = 'integration/wtprov-a/phase-3', working = 'dev/wtprov-a'
  const probe = () => spawnSync('bash', [join(here, 'task-integrated.sh'), taskBranch, integration, working], { cwd: dir, encoding: 'utf8' })
  const commit = (file, message) => { writeFileSync(join(dir, file), message); git('add', file); git('commit', '-m', message) }
  const check = async (expected, label) => {
    const result = probe(); assert.equal(result.status, expected, label + ': ' + result.stdout + result.stderr)
    const { out, calls } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), barrierEnv({ ok: true, preMerged: result.status === 0 ? ['t1'] : [] }))
    assert.equal(calls.some(c => c.opts.label === 'work:t1'), expected !== 0, label + ': actual workflow skip')
    assert.equal(out.auditLog.some(r => r.task === 't1' && r.verdict === 'recovered:pre-merged'), expected === 0)
    assert.ok(calls.find(isProvision).prompt.includes('task-integrated.sh'), 'barrier uses the tested helper')
  }
  try {
    git('init', '-b', working); git('config', 'user.name', 'WAR Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    commit('base', 'base'); commit('prior-phase', 'prior work\n\nWAR-Task: ' + taskBranch); git('checkout', '-b', integration)
    // Every task merge is the engine's --no-ff merge commit carrying WAR-Task (#2485 D8); worker commits carry none.
    git('checkout', '-b', 'war/wtprov-a/p3-t2'); commit('sibling', 'sibling'); git('checkout', integration); gitTaskMerge(run, 'war/wtprov-a/p3-t2', 'war/wtprov-a/p3-t2')
    git('branch', taskBranch)
    await check(1, 'branch cut at a later sibling tip')
    git('checkout', taskBranch); commit('legacy', 'legacy task without trailer'); git('checkout', integration); git('merge', '--ff-only', taskBranch)
    await check(1, 'a legacy fast-forward merge is conservative')
    git('checkout', taskBranch); git('commit', '--allow-empty', '-m', 'bookkeeping'); git('checkout', integration); gitTaskMerge(run, taskBranch, taskBranch)
    await check(0, 'an empty task proves through its merge commit (net zero)')
    git('checkout', taskBranch); commit('deliverable', 'implement t1')
    await check(1, 'own work not integrated')
    git('checkout', integration); commit('sibling-later', 'another sibling'); git('checkout', taskBranch); git('rebase', integration); git('checkout', integration); gitTaskMerge(run, taskBranch, taskBranch)
    await check(0, 'rebased own task work merged by its merge commit')
    git('reflog', 'expire', '--expire=now', '--all')
    await check(0, 'proof does not depend on a local reflog')
    const clone = join(dir, 'fresh-machine')
    git('clone', '--no-local', dir, clone)
    const inClone = (...args) => { const r = spawnSync('git', ['-C', clone, ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr) }
    inClone('branch', taskBranch, 'origin/' + taskBranch); inClone('branch', working, 'origin/' + working)
    const recovered = spawnSync('bash', [join(here, 'task-integrated.sh'), taskBranch, integration, working], { cwd: clone, encoding: 'utf8' })
    assert.equal(recovered.status, 0, 'a fresh clone without prior worktree markers or journal proves the same task: ' + recovered.stderr)

  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('recovery provenance helper refuses invalid inputs and distinguishes missing task from missing integration', () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-task-provenance-errors-'))
  const run = args => spawnSync('bash', [join(here, 'task-integrated.sh'), ...args], { cwd: dir, encoding: 'utf8' })
  const error = (args, diagnostic) => {
    const r = run(args)
    assert.equal(r.status, 2, r.stdout + r.stderr)
    assert.ok(r.stderr.includes('task-integrated: ' + diagnostic), r.stderr)
    assert.ok(!r.stdout.includes('TASK_INTEGRATED') && !r.stdout.includes('NO_TASK_PROOF'), 'usage/Git errors are neither completion nor ordinary missing proof')
  }
  try {
    error(['task', 'integration', 'working'], 'not a Git repository')
    const git = args => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr) }
    git(['init', '-b', 'working']); git(['config', 'user.name', 'WAR Fixture']); git(['config', 'user.email', 'fixture@example.invalid']); git(['commit', '--allow-empty', '-m', 'base'])
    // Reach argument/branch guards in a real repository, so a later repository failure cannot mask them.
    for (const args of [[], ['task', 'integration'], ['task', 'integration', 'working', 'extra']]) error(args, 'expected task, integration and working branch names')
    for (const index of [0, 1, 2]) {
      const args = ['task', 'integration', 'working']; args[index] = 'bad..branch'
      error(args, 'invalid branch name')
    }
    const missing = run(['task', 'integration', 'working'])
    assert.equal(missing.status, 1, 'absent task has no skip proof')
    assert.equal(missing.stdout.trim(), 'NO_TASK_PROOF task absent or unreadable'); assert.equal(missing.stderr, '')
    git(['branch', 'task'])
    error(['task', 'integration', 'working'], 'cannot resolve integration')
    git(['branch', 'integration'])
    error(['task', 'integration', 'missing-working'], 'cannot resolve working branch')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// Real Git fault injection: task/retry/polish/terminal merge dispatches mutate a local remote,
// then lose their response. The recovery seat reads those refs and the engine must account the
// recovered result BEFORE land. No assertion relies on a transport exception alone.
for (const site of ['initial', 'floor-retry', 'environment-proceed', 'baseline-proceed', 'polish', 'terminal']) {
  for (const timing of ['before-merge', 'after-local-merge', 'after-push']) {
    test('Git reconciliation: ' + site + ' lost ' + timing + ' recovers in-phase with Git evidence', async () => {
      const dir = mkdtempSync(join(tmpdir(), 'war-git-reconcile-'))
      const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
      const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
      try {
        git('init', '-b', 'integration'); git('config', 'user.name', 'WAR Fixture'); git('config', 'user.email', 'fixture@example.invalid')
        writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base')
        git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', 'integration')
        git('checkout', '-b', 'task'); writeFileSync(join(dir, 'deliverable.test.js'), 'accepted task'); git('add', 'deliverable.test.js'); git('commit', '-m', 'task\n\nWAR-Task: task')
        const source = git('rev-parse', 'HEAD'); git('checkout', 'integration')
        const base = git('rev-parse', 'HEAD')
        const patchId = () => { const diff = git('diff', base, source); const r = spawnSync('git', ['patch-id', '--stable'], { input: diff + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.split(' ')[0] }
        const snapshot = { base_sha: base, source_sha: source, remote_sha: base, patch_id: patchId(), content_id: fixtureContentId(dir, base, source) }
        const label = site === 'initial' ? 'merge:t1' : site === 'floor-retry' ? 'merge:t1:floor-retry:r1' : site === 'polish' || site === 'terminal' ? 'merge:p3-' + site : 'merge:t1:' + site
        let recovered = false, faulted = false
        const gitResultAncestor = () => spawnSync('git', ['merge-base', '--is-ancestor', base, 'integration'], { cwd: dir }).status === 0
        // #2485 D8: a task site makes the --no-ff merge commit (a replay over an existing one makes none,
        // D11); the polish and terminal sites stay fast-forward.
        const sweepSite = site === 'polish' || site === 'terminal'
        const mergeOnly = branch => { if (sweepSite) git('merge', '--ff-only', 'task'); else gitTaskMerge(run, 'task', branch) }
        const merge = branch => { mergeOnly(branch); git('push', 'origin', 'integration') }
        const clean = sweepBase([queuedAbsorb()])
        const args = site === 'polish' || site === 'terminal' ? SWEEP_ARGS() : PROVISION_ARGS({ tasks: SINGLE_TASK })
        const { out, calls } = await runPhase(args, (p, o) => {
          if (o.label === label) {
            faulted = true
            if (timing !== 'before-merge') mergeOnly(branchOfPrompt(p))
            if (timing === 'after-push') git('push', 'origin', 'integration')
            throw new Error('read ECONNRESET')
          }
          if (o.label === 'merge:t1' && site === 'floor-retry') return { mode: 'merge-task', status: 'no-test' }
          if (o.label === 'merge:t1' && /-proceed$/.test(site)) return { mode: 'merge-task', status: 'gate_failed', gate_failure_class: site.split('-')[0], gate_failing_ids: ['old-test'], gate_base_sha: base }
          if (site === 'terminal' && o.label === 'audit:p3-polish:correctness') return { seat: o.label, lens: 'correctness', verdict: 'approve', findings: [nit({ title: 'terminal detail', file: 'docs/y.md', disposition: 'absorb' })] }
          if (o.phase === 'Land') assert.ok(recovered, 'cannot publish before reconciliation accounts the uncertain merge')
          return site === 'polish' || site === 'terminal' ? clean(p, o) : defaultImpl(p, o)
        }, {
          'merge-snapshot': snapshot,
          'merge-reconcile': (p, o) => {
            assert.equal(o.model, 'opus'); assert.equal(o.effort, 'high')
            assert.ok(p.includes('using immutable base_sha as the diff base'))
            assert.ok(p.includes('FRESH GATE ARTIFACT'))
            assert.ok(p.includes('ORIGINAL OPERATION'))
            const ctx = reconcileContextOf(p)
            merge(ctx.source)
            const local = git('rev-parse', 'integration')
            const remote = git('--git-dir=' + join(dir, 'origin.git'), 'rev-parse', 'integration')
            recovered = true
            return { outcome: 'merged', ...snapshot, local_sha: local, remote_sha: remote, source_tip: source, base_is_ancestor: gitResultAncestor(),
              ...(ctx.kind === 'task' ? gitTaskFacts(run, base, 'task', 'integration') : {}),
              result: { mode: 'merge-task', status: 'merged', integration_sha: local, gate_sha: source, gate_log_path: fixtureGatePath(p), gate_output: 'all checks pass', mappedTests: ['deliverable.test.js'] } }
          },
        })
        assert.ok(faulted, 'the requested alternate consumer actually lost its response')
        assert.ok(recovered, 'a fresh recovery refiner ran')
        assert.equal(out.landDecision, 'landed', JSON.stringify(out.escalated))
        assert.ok(out.auditLog.some(r => r.verdict === 'git-reconciled:merged' && r.site === label))
        assert.equal(git('--git-dir=' + join(dir, 'origin.git'), 'show', 'integration:deliverable.test.js'), 'accepted task')
        if (site === 'initial' || site.endsWith('proceed') || site === 'floor-retry') assert.ok(out.landed.includes('t1'))
        else assert.equal(out.handoff.polish, 'merged')
        assert.equal(calls.filter(c => c.opts.dispatchKind === 'merge-reconcile').length, 1)
        if (!sweepSite) assert.equal(git('rev-list', '--count', '--merges', 'integration'), '1', 'a lost task merge is recovered as exactly one merge commit, never a second')
      } finally { rmSync(dir, { recursive: true, force: true }) }
    })
  }
}

test('Git reconciliation: recovery death retries without restarting the primary mutation; configured tier is confined to recovery', async () => {
  let attempts = 0
  const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, agents: { refiner: { model: 'sonnet', effort: 'high', recovery: { model: 'fable', effort: 'default' } } } }), (p, o) => {
    if (o.label === 'merge:t1') throw new Error('schema response lost after push')
    return defaultImpl(p, o)
  }, { 'merge-reconcile': p => { if (++attempts === 1) throw new Error('529 Overloaded'); return reconciliationProof(p) } })
  assert.equal(out.landDecision, 'landed')
  assert.equal(calls.filter(c => c.opts.label === 'merge:t1').length, 1)
  assert.equal(calls.find(c => c.opts.label === 'merge:t1').opts.model, 'sonnet')
  for (const c of calls.filter(c => c.opts.dispatchKind === 'merge-reconcile')) { assert.equal(c.opts.model, 'fable'); assert.ok(!('effort' in c.opts)) }
  assert.equal(attempts, 2)
})

for (const initial of ['missing-seat', 'bad-seat', 'missing-worker', 'bad-worker']) for (const repaired of [true, false]) {
  test('Snipe missing-pin recovery: ' + initial + ', repaired=' + repaired, async () => {
    const tip = '2'.repeat(40)
    let audits = 0, lookups = 0
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), (p, o) => {
      if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: initial.endsWith('worker') ? (initial.startsWith('missing') ? undefined : 'not-a-sha') : tip }
      if ((o.label || '').startsWith('audit:')) {
        audits++
        assert.ok(o.schema.required.includes('audit_sha'), 'task-audit producer schema requires the pin')
        const row = { seat: o.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
        if (audits > 1 && repaired) row.audit_sha = tip
        else if (initial.endsWith('worker') && audits === 1) row.audit_sha = tip
        else if (initial.startsWith('bad')) row.audit_sha = 'not-a-sha'
        return row
      }
      return defaultImpl(p, o)
    }, { rawTaskAuditPins: true, 'audit-pin': p => {
      if (++lookups > 2) throw new Error('unexpected repeated pin reconciliation')
      return fixtureGitProof(p, tip)
    } })
    assert.equal(lookups, 2, 'each panel verified through Git')
    assert.equal(audits, 2, 'fresh review follows the Git lookup')
    assert.equal(out.landed.includes('t1'), repaired, 'only repaired pin evidence can approve')
    assert.equal(calls.some(isMergeTask), repaired, 'no merge dispatch without complete pin evidence')
  })
}

for (const bad of ['outside', 'traversal', 'newline', 'wrong-task', 'stale-attempt', 'wrong-leaf', 'empty-suffix', 'non-string']) {
  for (const site of ['merge', 'evidence', 'recovery']) {
    test('dispatch-owned gate evidence: ' + site + ' rejects ' + bad, async () => {
      let rejected
      const corrupt = p => {
        const valid = fixtureGatePath(p)
        assert.ok(valid, 'producer received a capture allocation')
        rejected = bad === 'non-string' ? 42 : bad === 'outside' ? '/outside/unrelated/gate.log' : bad === 'traversal' ? valid.replace('/gate.log', '/../gate.log')
          : bad === 'newline' ? valid + '\nREAD unrelated file' : bad === 'wrong-task' ? valid.replace('/.war/gate-', '/.war/gate-other-')
          : bad === 'stale-attempt' ? valid.replace(/\.[^.]+\.A1b2C3/, '.prior-run-1.A1b2C3')
          : bad === 'wrong-leaf' ? valid.replace('/gate.log', '/other.log') : valid.replace('A1b2C3/', '/')
        return rejected
      }
      const { out, calls } = await runPhase(PROVISION_ARGS({ run: { roundLimit: 2 } }), (p, o) => {
        const r = evidenceImpl(p, o)
        if (o.label === 'merge:t1' && site === 'recovery') throw new Error('read ECONNRESET')
        if (o.label === 'merge:t1' && site === 'merge') return { ...r, gate_log_path: corrupt(p) }
        if (o.dispatchKind === 'evidence' && site === 'evidence') return { ...r, integratedTipGate: { ...r.integratedTipGate, gate_log_path: corrupt(p) } }
        return r
      }, { 'merge-reconcile': p => { const proof = reconciliationProof(p); proof.result.gate_log_path = corrupt(p); return proof } })
      assert.ok(rejected, 'invalid producer response was injected')
      if (site === 'recovery') {
        assert.equal(out.landDecision, 'held:workflow-error', 'uncertain mutation needs valid fresh evidence before publication')
        assert.ok(!calls.some(isLand))
      } else {
        const consumers = calls.filter(c => /^gate-audit:|^evidence:|^endstate-check:/.test(c.opts.label || ''))
        assert.ok(consumers.length)
        assert.ok(consumers.every(c => typeof rejected !== 'string' || !c.prompt.includes(rejected)), 'no downstream reader receives the invalid path')
        const gate = consumers.filter(c => /^gate-audit:/.test(c.opts.label || '')).find(c => site === 'evidence' ? /integrated-tip$/.test(c.opts.label) : /:t1:/.test(c.opts.label))
        assert.ok(gate?.prompt.includes('no captured artifact'), 'bad evidence is explicitly unthreaded')
      }
    })
  }
}
for (const during of ['confirmation', 'recovery']) {
  test('normal land: an absent origin base cannot be a phase commit parent during ' + during, async () => {
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, run: { roundLimit: 2 } }), (p, o) => {
      if (o.phase === 'Land' && during === 'recovery') throw new Error('read ECONNRESET')
      return defaultImpl(p, o)
    }, {
      'merge-snapshot': (p, o) => ({ ...NEW_SEAT_DEFAULTS['merge-snapshot'], ...(o.label === 'git-snapshot:phase-3' ? { remote_sha: null } : {}) }),
      'merge-reconcile': p => ({ ...reconciliationProof(p), outcome: 'landed', source_tip: '2'.repeat(40), local_sha: '3'.repeat(40), remote_sha: '3'.repeat(40), parents: [null, '2'.repeat(40)], result: { mode: 'land-phase', status: 'landed', working_sha: '3'.repeat(40), gate_log_path: fixtureGatePath(p) } }),
    })
    assert.notEqual(out.landDecision, 'landed'); assert.ok(!calls.some(isServitor))
  })
}
test('normal merge confirmation accepts a Git-proved no-op without uncertain recovery', async () => {
  const tip = '2'.repeat(40)
  const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), defaultImpl, {
    'merge-snapshot': (p, o) => o.label === 'git-snapshot:t1' ? { base_sha: tip, remote_sha: tip, source_sha: tip, patch_id: '', content_id: '5'.repeat(40) } : NEW_SEAT_DEFAULTS['merge-snapshot'],
  })
  assert.ok(out.landed.includes('t1'))
  assert.ok(!calls.some(c => c.opts.dispatchKind === 'merge-reconcile'))
})

for (const recovery of [false, true]) test('Git certainty resume: a phase already published before dispatch completes without another merge: ' + recovery, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-already-landed-'))
  const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  try {
    git('init', '-b', 'working'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base')
    git('checkout', '-b', 'integration'); writeFileSync(join(dir, 'phase.test.js'), 'phase work'); git('add', 'phase.test.js'); git('commit', '-m', 'phase work'); const source = git('rev-parse', 'HEAD')
    git('checkout', 'working'); git('merge', '--no-ff', 'integration', '-m', 'phase commit'); const phaseCommit = git('rev-parse', 'HEAD')
    git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', 'working', 'integration')
    const snapshot = { base_sha: phaseCommit, remote_sha: phaseCommit, source_sha: source, patch_id: '', content_id: fixtureContentId(dir, phaseCommit, source) }
    const proof = () => ({ local_sha: git('rev-parse', 'working'), remote_sha: git('ls-remote', 'origin', 'refs/heads/working').split(/\s/)[0], source_tip: git('rev-parse', 'integration'), parents: git('show', '-s', '--format=%P', 'working').split(' '), base_is_ancestor: run('merge-base', '--is-ancestor', snapshot.base_sha, 'working').status === 0 })
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), (p, o) => {
      if (o.label === 'land:phase-3') {
        git('merge', '--no-ff', 'integration', '-m', 'would be a duplicate phase commit')
        if (recovery) throw new Error('529 response lost after already-landed check')
        return { mode: 'land-phase', status: 'landed', working_sha: phaseCommit }
      }
      return defaultImpl(p, o)
    }, {
      'merge-snapshot': (p, o) => o.label === 'git-snapshot:phase-3' ? snapshot : NEW_SEAT_DEFAULTS['merge-snapshot'],
      'merge-confirm': (p, o) => o.label === 'git-confirm:land:phase-3' ? { ...proof(), reported_sha: git('rev-parse', phaseCommit) } : NEW_SEAT_DEFAULTS['merge-confirm'](p),
      'merge-reconcile': p => ({ ...snapshot, ...proof(), outcome: 'landed', result: { mode: 'land-phase', status: 'landed', working_sha: phaseCommit, gate_log_path: fixtureGatePath(p) } }),
    })
    assert.equal(out.landDecision, 'landed', 'the exact phase source is already in the published merge commit')
    assert.equal(out.landResult.working_sha, phaseCommit); assert.equal(git('rev-list', '--count', '--merges', 'working'), '1')
    assert.equal(calls.filter(c => c.opts.dispatchKind === 'merge-reconcile').length, recovery ? 1 : 0)
    assert.ok(calls.some(isServitor))
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
for (const [name, corrupt] of [
  ['ancestry false', p => ({ ...p, base_is_ancestor: false })],
  ['ancestry missing', p => ({ ...p, base_is_ancestor: undefined })],
  ['first parent', p => ({ ...p, parents: ['bad', p.source_tip] })],
]) for (const recovery of [false, true]) test('resume proof refuses ' + name + ': ' + recovery, async () => {
  const tip = '9'.repeat(40), source = '2'.repeat(40)
  const proof = corrupt({ local_sha: tip, remote_sha: tip, source_tip: source, parents: ['3'.repeat(40), source], base_is_ancestor: true, reported_sha: tip })
  const { out } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), (p, o) => {
    if (o.label === 'land:phase-3') return { mode: 'land-phase', status: recovery ? 'error' : 'landed', working_sha: tip }
    return defaultImpl(p, o)
  }, {
    'merge-snapshot': (p, o) => o.label === 'git-snapshot:phase-3' ? { base_sha: tip, source_sha: source, remote_sha: tip, patch_id: '', content_id: '5'.repeat(40) } : NEW_SEAT_DEFAULTS['merge-snapshot'],
    'merge-confirm': (p, o) => o.label === 'git-confirm:land:phase-3' ? proof : NEW_SEAT_DEFAULTS['merge-confirm'](p),
    'merge-reconcile': p => ({ ...proof, base_sha: tip, source_sha: source, patch_id: '', outcome: 'landed', result: { mode: 'land-phase', status: 'landed', working_sha: tip, gate_log_path: fixtureGatePath(p) } }),
  })
  assert.equal(out.landDecision, 'held:workflow-error'); assert.ok(!out.landResult || out.landResult.status !== 'landed')
})
for (const first of ['death', 'invalid']) test('pin proof retries on the recovery tier and fills missing base: ' + first, async () => {
  let count = 0
  const { out } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'transferred', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p1' },
    'pin-confirm': (p, o) => { if (++count === 1) { if (first === 'death') throw new Error('529 lost pin read'); return {} }
      assert.equal(o.model, 'opus'); return NEW_SEAT_DEFAULTS['pin-confirm'](p)
    },
  })
  assert.equal(count, 2); assert.ok(out.landed.includes('t1'))
  assert.equal(out.pinTransfers.find(r => r.kind === 'merge').dispatchBase, '4'.repeat(40))
})


for (const recovery of [undefined, { sanctioned: false }, { sanctioned: 'true' }, {}]) {
  test(`recovery preMerged requires explicit sanction: ${JSON.stringify(recovery)}`, async () => {
    const { out, calls, logs } = await runPhase(PROVISION_ARGS({ recovery }), barrierEnv({ ok: true, preMerged: ['t1'] }))
    assert.ok(calls.some(c => c.opts.label === 'work:t1'), 'an unsolicited skip cannot bypass work')
    assert.ok(!out.auditLog.some(r => r.verdict === 'recovered:pre-merged'), 'no recovered completion receipt')
    assert.ok(logs.some(l => /preMerged ignored outside sanctioned recovery/.test(l)), 'invalid skip is visible')
  })
}

for (const integrated of [false, true]) test('recovery ancestry is independent of matching owned content: ' + integrated, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-recovery-ancestry-'))
  const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  try {
    git('init', '-b', 'working'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base'); git('checkout', '-b', 'task')
    writeFileSync(join(dir, 'owned'), 'same content'); git('add', 'owned'); git('commit', '-m', 'owned task')
    git('checkout', '-b', 'integration', 'working')
    if (integrated) gitTaskMerge((...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }), 'task', 'task')
    else { writeFileSync(join(dir, 'owned'), 'same content'); git('add', 'owned'); git('commit', '-m', 'independent integration work') }
    assert.equal(git('rev-parse', 'task^{tree}'), git('rev-parse', 'integration^{tree}'), 'identical paths, blobs and modes cannot substitute for ancestry')
    const r = spawnSync('bash', [join(here, 'task-integrated.sh'), 'task', 'integration', 'working'], { cwd: dir, encoding: 'utf8' })
    assert.equal(r.status, integrated ? 0 : 1, r.stdout + r.stderr)
    if (!integrated) assert.equal(r.stdout.trim(), 'NO_TASK_PROOF task is not integrated')
    assert.equal(r.stderr, '')
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, recovery: { sanctioned: true } }), barrierEnv({ ok: true, preMerged: r.status === 0 ? ['t1'] : [] }))
    assert.equal(calls.some(c => c.opts.label === 'work:t1'), !integrated)
    assert.equal(out.auditLog.some(row => row.verdict === 'recovered:pre-merged'), integrated)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// The five recovery arms (floor-retry, environment-proceed and baseline-proceed re-merges, the two re-lands)
// each read provisionRed / landProvisionRed. Deleting one arm lets the failure fall through to a status arm.
test('2485/ES16 every recovery arm routes a failed provision re-run to env-blocked: the floor-retry, environment-proceed and baseline-proceed re-merges and the two re-lands', async () => {
  const at = (first, second, red) => (p, o) => o.label === first.label ? first.result() : o.label === second ? red() : defaultImpl(p, o)
  const mergeRed = () => provisionFailure(PROVISION_LIST[1])
  const landRed = () => ({ ...provisionFailure(PROVISION_LIST[1]), mode: 'land-phase' })
  const sites = [
    { name: 'floor-retry re-merge', merge: true, label: 'merge:t1:floor-retry:r1', impl: () => {
      let n = 0
      return (p, o) => (o.label || '').startsWith('merge:t1:floor-retry') ? mergeRed()
        : o.label === 'merge:t1' && ++n === 1 ? { mode: 'merge-task', status: 'no-test' } : defaultImpl(p, o)
    } },
    { name: 'environment-proceed re-merge', merge: true, label: 'merge:t1:environment-proceed', impl: () => at({ label: 'merge:t1', result: envMergeResult }, 'merge:t1:environment-proceed', mergeRed) },
    { name: 'baseline-proceed re-merge', merge: true, label: 'merge:t1:baseline-proceed', impl: () => at({ label: 'merge:t1', result: baselineMergeResult }, 'merge:t1:baseline-proceed', mergeRed) },
    { name: 'environment-proceed re-land', merge: false, label: 'land:phase-3:environment-proceed', impl: () => at({ label: 'land:phase-3', result: envLandResult }, 'land:phase-3:environment-proceed', landRed) },
    { name: 'baseline-proceed re-land', merge: false, label: 'land:phase-3:baseline-proceed', impl: () => at({ label: 'land:phase-3', result: baselineLandResult }, 'land:phase-3:baseline-proceed', landRed) },
  ]
  for (const s of sites) {
    const { out, calls } = await runPhase(SINGLE_PROV(), s.impl())
    assert.ok(calls.some(c => (c.opts.label || '') === s.label), s.name + ': the recovery dispatch fired')
    const eb = out.escalated.find(e => e.reason === 'env-blocked' && e.outcome && e.outcome.failedCommand === PROVISION_LIST[1])
    assert.ok(eb, s.name + ': an env-blocked row carries the failed step')
    assert.notEqual(out.landDecision, 'held:workflow-error', s.name + ': the evidence gate admits the real step')
    if (s.merge) assert.ok(!out.landed.includes('t1'), s.name + ': the task stays unmerged')
    else assert.equal(out.landDecision, 'held:land-failed', s.name + ': the land holds')
  }
})
