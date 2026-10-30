// Submodule and gitlink tests (part 1 of 3)
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


// ---------------------------------------------------------------------------
// Submodule-support Increment 1 — T2 (sub-issue #280)
// Tests for submodule-blocked routing in the REFINE section.
// buildSeqImpl harness: fresh instance per test, label→results queue, .shift() per call.
// ---------------------------------------------------------------------------

test('T2 #280 Test 1 — merge-task submodule-blocked → immediate escalate with 0 fix-worker dispatches', async () => {
  // A merge-task returning status:'submodule-blocked' must:
  //   (a) cause an escalated entry with reason:'escalate' carrying the submodule detail token
  //   (b) dispatch ZERO fix-workers (it is NOT the no-test loop — refuse-all, like env-blocked)
  //   (c) hold the land (escalate ∈ HARD_ESCALATION_REASONS)
  //
  // Load-bearing: the unique token 'touches a submodule' can only appear in the escalated detail
  // when the submodule-blocked branch is taken. If that branch is deleted the test fails because
  // the escalated entry either vanishes or carries a different reason/detail.
  const impl = buildSeqImpl(
    { 'merge:t1': [{ mode: 'merge-task', status: 'submodule-blocked' }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc0000', tests: {} }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out, calls } = await runPhase(L3_ARGS(), impl)

  // (a) escalated entry with reason:'escalate' carrying the submodule detail
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && !e.verdict?.startsWith('audit-pin:'))
  assert.ok(esc, 'escalated must have an entry for t1')
  assert.equal(esc.reason, 'escalate', 'submodule-blocked routes to reason:"escalate" (reuses existing member, no cascade)')
  assert.ok(typeof esc.detail === 'string' && esc.detail.includes('touches a submodule'),
    'escalated detail must carry unique token "touches a submodule"')

  // (b) ZERO fix-worker dispatches (not the no-test loop)
  const fixCalls = calls.filter(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit')
  assert.equal(fixCalls.length, 0,
    'submodule-blocked must dispatch 0 fix-workers (refuse-all, not the no-test loop)')

  // (c) land held
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation (escalate is a HARD_ESCALATION_REASON)')
})

test('T2 #280 Test 2 — submodule-blocked escalation rides existing "escalate" member; land-decision.mjs + drift-guard untouched', () => {
  // Assert the escalation reuses the existing 'escalate' HARD_ESCALATION_REASON (DP3).
  // No new member was added — HARD_ESCALATION_REASONS is unchanged, no land-decision.mjs cascade.

  // Verify HARD_ESCALATION_REASONS still contains 'escalate' (the existing member being reused)
  const herMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS found in workflow-template.js')
  const herParsed = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.ok(herParsed.includes('escalate'),
    'HARD_ESCALATION_REASONS contains "escalate" (the existing member reused by submodule-blocked)')

  // Verify 'submodule-blocked' is NOT a member of HARD_ESCALATION_REASONS (it routes via 'escalate')
  assert.ok(!herParsed.includes('submodule-blocked'),
    '"submodule-blocked" must NOT appear in HARD_ESCALATION_REASONS (routes via existing "escalate", no cascade)')

  // Verify 'submodule-blocked' IS in the MERGE_RESULT status enum
  const mrMatch = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(mrMatch, 'MERGE_RESULT with status enum found in workflow-template.js')
  const mrParsed = JSON.parse(mrMatch[1].replace(/'/g, '"'))
  assert.ok(mrParsed.includes('submodule-blocked'),
    'MERGE_RESULT status enum includes "submodule-blocked"')
})

test('T4 #297 Test 1 — 2B submodule land → held:submodule-pr, PR ref captured, returned DIRECTLY (not via decideLand)', async () => {
  // A submodule phase where the land agent returns status:'submodule-pr' (2B: branch pushed, PR opened).
  // The engine must:
  //   (a) map it to landDecision:'held:submodule-pr' (unique token — distinct from held:escalation)
  //   (b) capture the PR ref (pr_number, pr_remote) in the ledger (escalated or landResult)
  //   (c) return DIRECTLY — NOT routed through decideLand/HARD_ESCALATION_REASONS
  //       (proof: 'submodule-pr' must NOT appear in HARD_ESCALATION_REASONS; the held:submodule-pr
  //        is set directly like held:workflow-error, bypassing the decideLand branch)
  //
  // Load-bearing: deleting the 2B direct-return branch causes landDecision to remain 'landed' or
  // 'held:escalation' (not 'held:submodule-pr'), failing the unique-token assertion.
  const PR_NUMBER = 42
  const PR_REMOTE = 'git@github.com:org/submodule.git'
  const impl = buildSeqImpl(
    // The land agent for the submodule phase returns submodule-pr (2B)
    { [`land:phase-5`]: [{ mode: 'land-phase', status: 'submodule-pr', pr_number: PR_NUMBER, pr_remote: PR_REMOTE }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc0000', tests: { unit: 1 } }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
      if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'submodule-pr', pr_number: PR_NUMBER, pr_remote: PR_REMOTE }
      if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
      return {}
    }
  )
  const ARGS = SUBMOD_PHASE_ARGS()
  // Run with a single submodule task only (no bump dep) to keep the land path simple
  const args = { ...ARGS, tasks: [ARGS.tasks[0]] }
  const { out } = await runPhase(args, impl)

  // (a) landDecision must be 'held:submodule-pr' — unique token
  assert.equal(out.landDecision, 'held:submodule-pr',
    'a submodule-pr land result must yield landDecision:"held:submodule-pr"')

  // (b) PR ref must be captured somewhere in the output (escalated or landResult)
  const hasRef = (out.escalated || []).some(e => e && (e.pr_number === PR_NUMBER || (e.detail && e.detail.pr_number === PR_NUMBER)))
    || (out.landResult && out.landResult.pr_number === PR_NUMBER)
  assert.ok(hasRef,
    'PR ref (pr_number=42) must be captured in escalated[] or landResult so the Lead can resume')

  // (c) 'submodule-pr' must NOT appear in HARD_ESCALATION_REASONS (direct return, no cascade)
  const herMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS found in workflow-template.js')
  const herParsed = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.ok(!herParsed.includes('submodule-pr'),
    '"submodule-pr" must NOT appear in HARD_ESCALATION_REASONS (held:submodule-pr is set directly, not via decideLand)')

  // (c) 'submodule-pr' must be in the MERGE_RESULT status enum (new status value)
  const mrMatch2 = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(mrMatch2, 'MERGE_RESULT with status enum found')
  const mrParsed2 = JSON.parse(mrMatch2[1].replace(/'/g, '"'))
  assert.ok(mrParsed2.includes('submodule-pr'),
    'MERGE_RESULT status enum must include "submodule-pr" (the 2B refiner result)')
})

test('T4 #297 Test 2 — declared gitlink-bump merge-task passes --declared to assert-no-submodule-mutation.sh', async () => {
  // A task with taskType:'gitlink-bump' and declared:true must have '--declared' threaded into its
  // merge-task prompt so that assert-no-submodule-mutation.sh allows the legitimate pin move.
  // A non-declared task must NOT receive --declared (the guard remains strict).
  //
  // Load-bearing: deleting the --declared thread causes the merge-task prompt to lack the flag,
  // and the unique token '--declared' assertion fails. A non-declared task with '--declared' would
  // equally fail (false-positive assertion).
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc0000', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
    return {}
  }

  // Case A: declared bump task — must carry --declared
  const bumpArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
        roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true },
    ],
  })
  const { calls: callsA } = await runPhase(bumpArgs, impl)
  const mergeCallA = callsA.find(c => isMergeTask(c) && /tbump/.test(c.opts.label || ''))
  assert.ok(mergeCallA, 'a merge-task is dispatched for the bump task')
  // Load-bearing order check: script CLI is `<base> <branch> [--declared]` — flag must follow BOTH positionals.
  // A bare substring check passes even when --declared precedes the refs (broken ordering).
  assert.match(mergeCallA.prompt, /assert-no-submodule-mutation\.sh\s+\S+\s+\S+\s+--declared/,
    'declared gitlink-bump merge-task prompt must pass --declared AFTER both positional refs to assert-no-submodule-mutation.sh')

  // Case B: regular (non-declared, non-bump) task — must NOT carry --declared
  const regularArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'treg', issue: 303, title: 'Regular task', planSlice: 'reg slice', roster: [{ lens: 'correctness' }] },
    ],
  })
  const { calls: callsB } = await runPhase(regularArgs, impl)
  const mergeCallB = callsB.find(c => isMergeTask(c) && /treg/.test(c.opts.label || ''))
  assert.ok(mergeCallB, 'a merge-task is dispatched for the regular task')
  assert.ok(!mergeCallB.prompt.includes('--declared'),
    'a non-declared regular task merge-task must NOT include "--declared"')
})

test('T4 #297 Test 3 — blocked gitlink-bump worker escalates early via blockedReason', async () => {
  // A gitlink-bump worker returning {status:'blocked', blocked_reason:'bump-blocked-reason'} must:
  //   (a) be escalated early with reason:'escalate' and blocked:'bump-blocked-reason' (the unique token)
  //   (b) dispatch ZERO fix-workers (the bump worker is a new dispatch site, same early-escalate path)
  //   (c) hold the land (escalate ∈ HARD_ESCALATION_REASONS)
  //
  // Load-bearing: the unique token 'bump-blocked-reason' only appears in escalated.blocked when the
  // blockedReason predicate is applied to the bump worker result. Deleting the blockedReason call
  // causes the loop to continue into audits, losing the early-escalate path and the unique token.
  const impl = buildSeqImpl(
    // The bump worker returns blocked with the unique token
    { 'work:tbump': [{ task_id: 'tbump', status: 'blocked', blocked_reason: 'bump-blocked-reason' }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc0000', tests: { unit: 1 } }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
      if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
      if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
      return {}
    }
  )
  // Use only the bump task (no submodule dep to simplify) — bump task only
  const bumpOnlyArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
        roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true },
    ],
  })
  const { out, calls } = await runPhase(bumpOnlyArgs, impl)

  // (a) escalated with unique reason token
  const esc = (out.escalated || []).find(e => e && e.task === 'tbump')
  assert.ok(esc, 'escalated must have an entry for the blocked bump worker (tbump)')
  assert.equal(esc.reason, 'escalate', 'blocked bump worker routes to reason:"escalate" (blockedReason predicate)')
  assert.equal(esc.blocked, 'bump-blocked-reason',
    'escalated entry must carry blocked:"bump-blocked-reason" (unique token from the blocked bump worker)')

  // (b) ZERO fix-workers dispatched after the early escalate
  const fixCalls = calls.filter(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit')
  assert.equal(fixCalls.length, 0,
    'a blocked bump worker must dispatch 0 fix-workers (early escalate, same path as initial-worker block)')

  // (b2) the bump worker prompt carries bump-specific context (new dispatch site, not generic worker)
  // Load-bearing: the 'GITLINK-BUMP' token only appears when the gitlink-bump dispatch branch runs.
  // Deleting the taskType==='gitlink-bump' branch causes the prompt to be the generic worker form, losing the token.
  const bumpWorkerCall = calls.find(c => isWorker(c) && /tbump/.test(c.opts.label || ''))
  assert.ok(bumpWorkerCall, 'a worker call is dispatched for the bump task (tbump)')
  assert.ok(bumpWorkerCall.prompt.includes('GITLINK-BUMP'),
    'the gitlink-bump worker prompt must include the "GITLINK-BUMP" dispatch-site token (not the generic worker form)')

  // (c) land held
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation when the bump worker blocks (escalate is a HARD reason)')
})

test('T4 #297 Test 4 — targetRepo/targetBase threaded into merge-task, land, worker, and Provision prompts for a submodule task', async () => {
  // The engine must carry targetRepo + targetBase from the submodule task into:
  //   (a) the merge-task prompt (so the refiner runs rebase/gate inside the submodule repo)
  //   (b) the land prompt (so the refiner knows the submodule target for 2A/2B)
  //   (c) the worker prompt (so the submodule-task worker is told its target repo)
  //   (d) the Provision prompt (so the refiner initializes the submodule checkout)
  //
  // Load-bearing: the unique token '/abs/submodule-checkout' only appears in these prompts when
  // the production code reads task.targetRepo. Deleting the threading causes each assertion to fail.
  const TARGET_REPO = '/abs/submodule-checkout'
  const TARGET_BASE = 'main'

  const capturedPrompts = {}
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    const label = opts.label || ''
    // Capture prompts keyed by label
    capturedPrompts[label] = prompt
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 'tsub', status: 'implemented', head_sha: 'abc1234', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged', integration_sha: 'ab001001' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 5, target: 'tsub', learnings: [] }
    return {}
  }

  // Single submodule task (no gitlink-bump dep) so we reach land
  const args = SUBMOD_PHASE_ARGS({ tasks: [SUBMOD_PHASE_ARGS().tasks[0]] })
  const { calls } = await runPhase(args, impl)

  // (a) merge-task prompt carries targetRepo and targetBase
  const mergeCall = calls.find(c => isMergeTask(c) && /tsub/.test(c.opts.label || ''))
  assert.ok(mergeCall, 'a merge-task is dispatched for the submodule task (tsub)')
  assert.ok(mergeCall.prompt.includes(TARGET_REPO),
    `merge-task prompt must include targetRepo "${TARGET_REPO}" so the refiner runs merge cwd-scoped to the submodule`)
  assert.ok(mergeCall.prompt.includes(TARGET_BASE),
    `merge-task prompt must include targetBase "${TARGET_BASE}" for the submodule integration base`)

  // (b) land prompt carries targetRepo and targetBase
  const landCall = calls.find(isLand)
  assert.ok(landCall, 'a land dispatch is made (phase lands with the submodule task merged)')
  assert.ok(landCall.prompt.includes(TARGET_REPO),
    `land prompt must include targetRepo "${TARGET_REPO}" so the refiner knows the 2A/2B submodule target`)
  assert.ok(landCall.prompt.includes(TARGET_BASE),
    `land prompt must include targetBase "${TARGET_BASE}" for the 2A/2B submodule land`)

  // (c) worker prompt carries targetRepo
  const workerCall = calls.find(c => isWorker(c) && /tsub/.test(c.opts.label || ''))
  assert.ok(workerCall, 'a worker is dispatched for the submodule task (tsub)')
  assert.ok(workerCall.prompt.includes(TARGET_REPO),
    `worker prompt must include targetRepo "${TARGET_REPO}" so the submodule-task worker is told its target repo`)

  // (d) Provision (topology) prompt carries targetRepo
  const provCall = calls.find(c => isProvisionTopology(c))
  assert.ok(provCall, 'a topology Provision barrier is dispatched')
  assert.ok(provCall.prompt.includes(TARGET_REPO),
    `Provision prompt must include targetRepo "${TARGET_REPO}" so the refiner initializes the submodule checkout`)
})

for (const pairedPath of [undefined, './vendor/lib/']) test('dep-wave visibility: a gitlink-bump task with deps gets NO rebase-first clause (cross-repo dep — taskType scoping): ' + pairedPath, async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tsub', issue: 301, title: 'Sub task', planSlice: 's1', roster: [{ lens: 'correctness' }],
      taskType: 'submodule', targetRepo: 'vendor/lib', targetBase: 'main' },
    { id: 'tbump', issue: 302, title: 'Bump task', planSlice: 's2', roster: [{ lens: 'correctness' }],
      taskType: 'gitlink-bump', targetRepo: pairedPath, deps: ['tsub'] },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const wb = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:tbump')
  assert.ok(wb, 'the gitlink-bump worker dispatched (presence guard)')
  assert.equal(args.tasks[0].targetRepo, '/abs/repo/vendor/lib')
  assert.equal(args.tasks[1].targetRepo, pairedPath === undefined ? undefined : '/abs/repo/vendor/lib')
  assert.ok(wb.prompt.includes('git -C /abs/repo add /abs/repo/vendor/lib'), 'the gitlink consumer receives the resolved submodule path')
  assert.ok(!wb.prompt.includes('DEPS ALREADY MERGED: this task declares deps'),   // clause form, not the bare token (the worker rules name it as prose)
    'a gitlink-bump task is EXCLUDED — its dep merged into the submodule repo, not this integration branch')
})

test("pkg §4.2 — retry-merge prompt re-instructs ALL floor invocations (test + packaging + submodule + done-when kept in sync with standing steps; the done-when arm is asserted by 'done-when floor threading (Task 2.3)' — this fixture is doneWhen-less)", async () => {
  // The floor-retry merge prompt must re-instruct assert-test-in-diff.sh, assert-packaging-in-diff.sh,
  // assert-no-submodule-mutation.sh AND — for a doneWhen-bearing task — assert-done-when.sh
  // (dispatched-vs-standing coverage-split lesson). The enumeration is a twice-applied #1114
  // survey-derived correction: this test's own "ALL floor invocations" claim (and the two adjacent
  // engine comments that word it identically — now 'test + packaging + submodule + done-when')
  // enumerated two of the three floors when the submodule arm joined, and Task 2.3 re-applied the
  // correction when the done-when floor made it four. The done-when arm is NOT asserted here — this
  // fixture's task carries no doneWhen, so doneWhenFloorClause renders '' on the retry prompt; its
  // arbiter is the 'done-when floor threading (Task 2.3)' test, whose doneWhen-bearing fixture drives
  // the same floor-retry re-merge site and asserts /assert-done-when\.sh/ on it.
  // Non-vacuity (#1246): the test and packaging predicates carry the `run ` verb prefix, and that prefix is
  // the whole discriminator. A BARE filename regex greens on EITHER arm of the requiresTest /
  // requiresPackaging ternaries — the run arm and the `skip the assert-…-in-diff.sh check` arm share the
  // filename byte-run — so it passed even when the floor was being skipped, exercising nothing. The sibling
  // assert-no-submodule-mutation.sh predicate stays a bare filename regex on purpose: that invocation is
  // UNCONDITIONAL in the floor-retry prompt, so it has no like-worded skip arm to be confused with. (No
  // "re-run" wording is pinned by that predicate — it is itself bare and its message is inert prose; the
  // absent skip arm, not a verb, is what makes it discriminating.)
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc0000', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner' && opts.phase === 'Refine') { mergeCount++; return mergeCount === 1 ? { mode: 'merge-task', status: 'unpackaged' } : { mode: 'merge-task', status: 'merged' } }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(PKG_ARGS(), impl)
  const retry = calls.find(c => /floor-retry/.test(c.opts.label || ''))
  assert.ok(retry, 'a floor-retry merge is dispatched')
  assert.match(retry.prompt, /run assert-test-in-diff\.sh/, 'retry-merge re-instructs the test floor')
  assert.match(retry.prompt, /run assert-packaging-in-diff\.sh/, 'retry-merge re-instructs the packaging floor')
  assert.match(retry.prompt, /assert-no-submodule-mutation\.sh/, 'retry-merge re-instructs the submodule floor (unconditional per war-refiner.md step 6 — "always")')
})

test('#1032 — the floor-retry re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  // no-test → add-test fix-worker → unanimous re-audit → floor-retry re-merge (runNoTestLoop's flow).
  const { calls } = await runNoTestLoop({ tasks: [submodRetryTask()] })
  assertSubmodScoped(mergePromptsOf(calls).floorRetry, 'the floor-retry re-merge (merge:t1:floor-retry:r<n>)')
})

test('#1032 — the environment-proceed re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ mergeResult: envMergeResult }))
  assertSubmodScoped(calls.find(c => /^merge:t1:environment-proceed$/.test(c.opts.label || '')), 'the environment-proceed re-merge')
})

test('#1032 — the baseline-proceed re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED with the same ids — pre-existing' }) })
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), impl)
  assertSubmodScoped(calls.find(c => /^merge:t1:baseline-proceed$/.test(c.opts.label || '')), 'the baseline-proceed re-merge')
})

test('#1114 — the environment-proceed RE-LAND prompt carries the submodule land note (SUBMODULE PHASE + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ landResult: envLandResult }))
  assertSubmodLandScoped(calls.find(c => /^land:phase-3:environment-proceed$/.test(c.opts.label || '')), 'the environment-proceed re-land')
})

test('#1114 — the baseline-proceed RE-LAND prompt carries the submodule land note (SUBMODULE PHASE + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ landResult: baselineLandFail }))
  assertSubmodLandScoped(calls.find(c => /^land:phase-3:baseline-proceed$/.test(c.opts.label || '')), 'the baseline-proceed re-land')
})

test('#1114 — the polish merge prompt runs the submodule floor, always BARE (a coherence sweep is never a declared gitlink bump)', async () => {
  const { calls } = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  const polishMerge = calls.find(c => (c.opts.label || '') === 'merge:p3-polish')
  assert.ok(polishMerge, 'the polish merge is dispatched (phase-close sweep)')
  assert.match(polishMerge.prompt, /assert-no-submodule-mutation\.sh\s+integration\/wtprov-a\/phase-3\s+war\/wtprov-a\/p3-polish/,
    'the polish merge prompt invokes the submodule floor on <integrationBranch> <polishBranch> (delete the append ⇒ no invocation ⇒ RED)')
  assert.ok(!polishMerge.prompt.includes('--declared'),
    'the invocation is BARE — the gitlink-bump relax flag never appears anywhere in the polish prompt')
  // The reworded skip rationale still skips the three task-field-gated floors (collateral pin, #819/§4.2).
  assert.match(polishMerge.prompt, /skip assert-test-in-diff\.sh/, 'the polish merge still skips the test floor')
  assert.match(polishMerge.prompt, /skip the packaging floor assert-packaging-in-diff\.sh/, 'the polish merge still skips the packaging floor')
  assert.match(polishMerge.prompt, /skip the done-when floor assert-done-when\.sh/, 'the polish merge still skips the done-when floor (Task 2.3)')
})

test('#1114 — the floor-retry re-merge prompt runs the submodule floor WITH the gitlink-bump --declared conditional (both arms)', async () => {
  const bare = mergePromptsOf((await runNoTestLoop()).calls).floorRetry
  assert.ok(bare, 'a floor-retry re-merge is dispatched (non-declared task)')
  assert.match(bare.prompt, /assert-no-submodule-mutation\.sh\s+integration\/wtprov-a\/phase-3\s+war\/wtprov-a\/p3-t1/,
    'the floor-retry re-merge invokes the submodule floor on <integrationBranch> <taskBranch> (delete the insert ⇒ RED)')
  assert.ok(!bare.prompt.includes('--declared'),
    'a non-declared task gets the BARE floor at the floor-retry re-merge (the conditional is real, never static)')

  const declared = mergePromptsOf((await runNoTestLoop({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: true, taskType: 'gitlink-bump', declared: true },
  ] })).calls).floorRetry
  assert.ok(declared, 'a floor-retry re-merge is dispatched (declared gitlink-bump task)')
  assert.match(declared.prompt, /assert-no-submodule-mutation\.sh\s+\S+\s+\S+\s+--declared/,
    'a declared gitlink-bump task threads --declared AFTER both positional refs, so the retry does not refuse its own legitimate pin move')
})

test('#1114 — a floor-retry re-merge returning submodule-blocked escalates HARD (reason:"escalate"), never the soft status fallback', async () => {
  // Mirrors T2 #280 Test 1's routing assertions one dispatch later: the FIRST merge trips the test floor
  // and the floor-retry re-merge is what surfaces the submodule mutation. Load-bearing: without the
  // explicit arm the result falls to `reason: floorMr.status` — 'submodule-blocked' is NOT in
  // HARD_ESCALATION_REASONS, so the phase would LAND minus the task with a soft escalation.
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc0000', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: fixtureAuditPin(prompt) }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCallCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }
      : { mode: 'merge-task', status: 'submodule-blocked' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(NO_TEST_ARGS(), impl)
  assert.ok(calls.some(c => /floor-retry/.test(c.opts.label || '')), 'the floor-retry re-merge was dispatched (the route under test is reached)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && !e.verdict?.startsWith('audit-pin:'))
  assert.ok(esc, 'escalated must carry an entry for t1')
  assert.equal(esc.reason, 'escalate',
    'a floor-retry submodule-blocked escalates via the existing HARD "escalate" member, never the soft `reason: floorMr.status` fallback')
  assert.ok(typeof esc.detail === 'string' && esc.detail.includes('floor-retry re-merge'),
    'the detail names the floor-retry surface (distinct from the primary / environment-proceed / baseline-proceed arms)')
  assert.ok((out.auditLog || []).some(e => e && e.task === 't1' && e.verdict === 'submodule-blocked'),
    'the audit log records the submodule-blocked verdict (mirroring the primary arm)')
  assert.equal(out.landDecision, 'held:escalation', 'the phase HOLDS — a submodule touch never rides a land')
  assert.ok(!out.landed.includes('t1'), 't1 does not land')
})

test('#1114 — a RE-LAND returning submodule-pr yields held:submodule-pr with the PR ref captured (BOTH re-land routes)', async () => {
  const SUBMOD_PR = { mode: 'land-phase', status: 'submodule-pr', pr_number: 77, pr_remote: 'git@github.com:org/submodule.git' }
  // environment-proceed: clsImpl's landProceed hook drives the re-land's own result.
  const env = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }),
    clsImpl({ landResult: envLandResult, landProceed: () => SUBMOD_PR }))
  // baseline-proceed: that label has no clsImpl hook — relabel-wrap the impl (the established pattern).
  const baseImpl = clsImpl({ landResult: baselineLandFail })
  const base = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }),
    (prompt, opts) => /^land:phase-3:baseline-proceed$/.test(opts.label || '') ? SUBMOD_PR : baseImpl(prompt, opts))

  for (const [where, r] of [['environment-proceed', env], ['baseline-proceed', base]]) {
    assert.equal(r.out.landDecision, 'held:submodule-pr',
      `the ${where} re-land's submodule-pr must yield held:submodule-pr — the held:land-failed else would mislabel the hold`)
    const esc = (r.out.escalated || []).find(e => e && e.reason === 'submodule-pr')
    assert.ok(esc, `the ${where} re-land pushes an escalated entry with reason:"submodule-pr"`)
    assert.equal(esc.pr_number, SUBMOD_PR.pr_number, `the ${where} re-land captures pr_number for the Lead's gh-resume`)
    assert.equal(esc.pr_remote, SUBMOD_PR.pr_remote, `the ${where} re-land captures pr_remote for the Lead's gh-resume`)
    // #1245 — the ONE observable change of the re-land arm-symmetry fix, asserted behaviorally (the D6
    // pin at the end of this file is the source-shape half). Before it, the phase returned the STALE
    // first gate_failed attempt here while the escalation said submodule-pr; now it returns the
    // dispatched re-land result, matching the shape the initial land has by construction.
    assert.equal(r.out.landResult && r.out.landResult.status, 'submodule-pr',
      `the ${where} re-land's returned land result IS the dispatched submodule-pr result, never the stale earlier attempt`)
    assert.equal(r.out.landResult.pr_number, SUBMOD_PR.pr_number,
      `the ${where} re-land's returned land result carries the PR ref, as the initial land's does`)
  }
})

test('#1114 — a polish merge returning submodule-blocked routes the EXISTING fail-open DISCARD arm (no new hold)', async () => {
  const base = sweepBase([queuedAbsorb()])
  const impl = (prompt, opts) => (opts.label || '') === 'merge:p3-polish'
    ? { mode: 'merge-task', status: 'submodule-blocked' }
    : base(prompt, opts)
  const { out, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.equal(out.handoff.polish, 'discarded', 'the sweep DISCARDS — the pre-polish tip lands unchanged')
  assert.equal(out.landDecision, 'landed', 'fail-open: a blocked polish is never a hold')
  assert.ok((out.escalated || []).every(e => !e || e.reason !== 'escalate'),
    'no escalation is minted for a blocked polish (the discard arm is the whole routing — no routing edit was needed)')
  assert.ok(logs.some(l => /phase-close sweep DISCARDED/.test(l) && /submodule-blocked/.test(l)),
    'the discard log names the returned status — the Lead sees WHY before re-dispatching')
})

test('run-lifecycle §5 both-surfaces drift guard: war-refiner.md names the provision mode, the three labels, the env-outcome fields, and the frontmatter blurb; refiner-recovery.md carries the evicted submodule p<phase>-<task> path (token-anchored, case-tolerant)', () => {
  assert.match(refinerMd, /## provision/i, 'the standing card has a ## provision section')
  // the three dispatch labels wherever the dispatched prompts name them
  assert.match(refinerMd, /provision:phase-<id>/i, 'names the git-topology barrier label')
  assert.match(refinerMd, /provision-run:<taskId>/i, 'names the per-task provision-run label')
  assert.match(refinerMd, /polish-worktree:/i, 'names the polish-worktree label')
  // env-outcome return + fields
  assert.match(refinerMd, /env-outcome/i, 'names the env-outcome return')
  for (const f of ['failedCommand', 'exitCode', 'stderrTail']) assert.match(refinerMd, new RegExp(f, 'i'), `names the env-outcome field ${f}`)
  assert.match(refinerMd, /never\b[\s\S]{0,16}(out-of-mode|decline)/i, 'states a provision dispatch is never declined')
  // submodule worktree add path mirrors the template derivation shape — read relocated to
  // references/refiner-recovery.md (Task 4.1 evicted the submodule-as-repo provisioning recipe there)
  assert.match(refinerRecoveryMd, /p<phase>-<taskId>/i, 'the submodule step-4 worktree path carries the p<phase>-<taskId> shape (refiner-recovery.md, evicted from the card)')
  // frontmatter description (the agent-catalog blurb) names the provision mode + env-outcome return
  const fm = refinerMd.split('---')[1] || ''
  assert.match(fm, /provision mode/i, 'the frontmatter blurb names the provision mode')
  assert.match(fm, /env-outcome/i, 'the frontmatter blurb names the env-outcome return')
  // the dispatched-prompt side: the three site comments name the standing-card provision mode
  assert.ok((src.match(/provision mode \(agents\/war-refiner\.md ## provision\)/gi) || []).length >= 3,
    'each of the three provision dispatch sites carries a comment naming the standing-card provision mode')
})

test('filing-floor — a submodule task\'s diff probe resolves its base against the submodule base (targetBase), never the superproject integration branch that does not exist in that checkout (#2057)', async () => {
  const { calls } = await runPhase(SUBMOD_PHASE_ARGS({ run: { ace: true } }), floorImpl([]), PROBE)
  const p = calls.find(c => c.opts.dispatchKind === 'diff-probe' && c.opts.label === 'diff-probe:tsub')
  assert.ok(p, 'the submodule task\'s probe dispatched')
  assert.ok(p.prompt.includes('merge-base main '), 'the range base is the submodule base (targetBase: main)')
  assert.ok(!p.prompt.includes('merge-base integration/submod-test/phase-5'), 'never the superproject integration branch')
  const q = calls.find(c => c.opts.dispatchKind === 'diff-probe' && c.opts.label === 'diff-probe:tbump')
  assert.ok(q, "the gitlink-bump task's probe dispatched (presence guard — never a vacuous negative arm)")
  assert.ok(q.prompt.includes('merge-base integration/submod-test/phase-5'), 'a non-submodule task keeps the integration-branch base')
})

test('held-carry — default-deny census: carriedPhaseClose is present on EVERY Workflow-emitted hold class (escalation, nothing-merged, land-failed, submodule-pr, workflow-error from the catch block) and is [] on landed', async () => {
  const refine = status => (prompt, opts) => seatOf(opts) === 'war-refiner' && opts.phase === 'Refine' ? { mode: 'merge-task', status } : sweepBase([])(prompt, opts)
  const land = result => (prompt, opts) => seatOf(opts) === 'war-refiner' && opts.phase === 'Land' ? result : sweepBase([])(prompt, opts)
  const runs = {
    'landed': await runPhase(SWEEP_ARGS(), sweepBase([])),
    'held:escalation': await runPhase(SWEEP_ARGS(), refine('conflict')),
    'held:nothing-merged': await runPhase(SWEEP_ARGS(), refine('gate_failed')),
    'held:land-failed': await runPhase(SWEEP_ARGS(), land({ mode: 'land-phase', status: 'error' })),
    'held:submodule-pr': await runPhase(SWEEP_ARGS(), land({ mode: 'land-phase', status: 'submodule-pr', pr_number: 7, pr_remote: 'org/sub' })),
    'held:workflow-error': await runPhase(SWEEP_ARGS({ finalPhase: 'nope' }), sweepBase([])),
  }
  for (const [expected, r] of Object.entries(runs)) {
    assert.equal(r.out.landDecision, expected, expected + ': the fixture reaches its hold class (presence guard)')
    assert.ok(Array.isArray(r.out.carriedPhaseClose), expected + ': carriedPhaseClose is present as an array on the phase return')
    if (expected === 'landed') assert.deepEqual(r.out.carriedPhaseClose, [], 'landed with nothing carried ⇒ []')
  }
  // Default-deny: every Workflow-emitted member of the canonical enum is covered above; the one
  // Lead-side member (held:phase-incomplete — a non-completed notification, never a Workflow return) is the ruled exclusion.
  const workflowEmitted = KNOWN_LAND_DECISIONS.filter(d => d !== 'held:phase-incomplete')
  assert.deepEqual(Object.keys(runs).sort(), [...workflowEmitted].sort(), 'the census covers exactly the Workflow-emitted land decisions')
})

for (const route of ['floor', 'environment', 'baseline']) test('submodule Git context survives task retry: ' + route, async () => {
  const tasks = [submodRetryTask()]
  const args = route === 'floor' ? NO_TEST_ARGS({ tasks }) : CLS_ARGS({ tasks })
  const result = route === 'floor' ? await runNoTestLoop({ tasks }) : await runPhase(args, clsImpl({ mergeResult: route === 'environment' ? envMergeResult : () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999' }) }))
  const suffix = route === 'floor' ? 'floor-retry:r' : route + '-proceed'
  const call = result.calls.find(c => c.opts.dispatchKind === 'merge-snapshot' && c.prompt.includes('for merge:t1:' + suffix))
  assert.ok(call, 'the retry snapshots Git before mutation')
  const c = JSON.parse(call.prompt.match(/Context: (.+?)\. Before any/)[1])
  assert.equal(c.repo, SUBMOD_RETRY_REPO); assert.equal(c.source, result.calls.find(x => x.opts.dispatchKind === 'pin-snapshot').prompt.match(/"source":"([^"]+)"/)[1])
  assert.equal(c.target, args.phase.integrationBranch); assert.equal(c.seed, 'main')
})
for (const submodule of [true, false]) test('phase Git context carries the seed through polish, terminal and land: ' + submodule, async () => {
  const original = SWEEP_ARGS(), args = submodule ? SWEEP_ARGS({ tasks: original.tasks.map(t => ({ ...t, taskType: 'submodule', targetRepo: SUBMOD_RETRY_REPO, targetBase: 'main' })) }) : original
  const { out, calls } = await runPhase(args, terminalImpl())
  assert.equal(out.landDecision, 'landed')
  for (const label of ['merge:p3-polish', 'merge:p3-terminal', 'land:phase-3']) {
    const call = calls.find(c => c.opts.dispatchKind === 'merge-snapshot' && c.prompt.includes('for ' + label + '.'))
    assert.ok(call, label + ' snapshots its own Git context')
    const c = JSON.parse(call.prompt.match(/Context: (.+?)\. Before any/)[1])
    if (label.startsWith('land:')) { assert.equal(c.repo, submodule ? SUBMOD_RETRY_REPO : args.worktreeRoot + '/' + args.runId + '/_refinery'); assert.equal(c.target, submodule ? 'main' : args.phase.workingBranch) }
    else { assert.equal(c.repo, args.worktreeRoot + '/' + args.runId + '/_refinery'); assert.equal(c.target, args.phase.integrationBranch); assert.equal(c.seed, submodule ? 'main' : args.phase.workingBranch) }
  }
})

for (const kind of ['unchanged', 'sibling', 'reverted', 'removed', 'changed', 'empty-final', 'rename-restored', 'odd-sibling', 'odd-changed', 'gitlink', 'gitlink-only', 'mode-changed', 'external-masks-change', 'subdirectory']) {
  test('recovery current-content proof: real ' + kind, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-recovery-content-'))
    const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    const commit = message => { git('add', '-A'); git('commit', '-m', message) }
    try {
      git('init', '-b', 'working'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      mkdirSync(join(dir, 'nested')); writeFileSync(join(dir, 'nested', 'base'), 'base'); writeFileSync(join(dir, 'original'), 'original'); commit('base'); const base = git('rev-parse', 'HEAD')
      if (kind.startsWith('gitlink')) { git('update-index', '--add', '--cacheinfo', '160000,' + base + ',module'); git('commit', '-m', 'base gitlink') }
      git('branch', 'integration'); git('checkout', '-b', 'task')
      const file = kind.startsWith('odd-') ? ':(glob)*\n odd file' : 'deliverable'
      writeFileSync(join(dir, file), 'approved work')
      if (kind === 'rename-restored') git('mv', 'original', 'renamed')
      if (kind.startsWith('gitlink')) { git('update-index', '--cacheinfo', '160000,' + git('rev-parse', 'HEAD') + ',module'); git('config', 'diff.ignoreSubmodules', 'all') }
      // Add the ordinary file separately so an ignore-submodules default cannot hide the entire task.
      if (kind !== 'gitlink-only') git('add', '--', file)
      git('commit', '-m', 'task work'); const approved = git('rev-parse', 'HEAD')
      if (kind === 'empty-final') git('revert', '--no-edit', approved)
      git('checkout', 'integration'); gitTaskMerge((...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }), 'task', 'task')
      if (kind === 'reverted') git('revert', '--no-edit', approved)
      if (kind === 'removed') { git('rm', file); git('commit', '-m', 'remove task work') }
      if (kind === 'changed' || kind === 'odd-changed' || kind === 'external-masks-change' || kind === 'subdirectory') { writeFileSync(join(dir, file), 'lost accepted behavior'); commit('alter task work') }
      if (kind === 'sibling' || kind === 'odd-sibling') { writeFileSync(join(dir, kind === 'odd-sibling' ? 'sibling\n odd file' : 'sibling'), 'unrelated work'); commit('sibling work') }
      if (kind === 'rename-restored') { writeFileSync(join(dir, 'original'), 'original'); commit('restore task-deleted source') }
      if (kind === 'gitlink') { git('update-index', '--cacheinfo', '160000,' + base + ',module'); git('commit', '-m', 'revert required gitlink') }
      if (kind === 'external-masks-change') {
        const driver = join(dir, 'diff-driver')
        writeFileSync(driver, '#!/bin/sh\ntest "$(cat "$2")" = "approved work"\n', { mode: 0o755 })
        git('config', 'diff.external', driver); git('config', 'diff.trustExitCode', 'true')
      }
      if (kind === 'mode-changed') { git('update-index', '--chmod=+x', file); git('commit', '-m', 'change required file mode') }
      const result = spawnSync('bash', [join(here, 'task-integrated.sh'), 'task', 'integration', 'working'], { cwd: kind === 'subdirectory' ? join(dir, 'nested') : dir, encoding: 'utf8' })
      // empty-final nets to zero: its merge commit is the proof, so it proves (#2485 D14).
      const preserved = ['unchanged', 'sibling', 'odd-sibling', 'gitlink-only', 'empty-final'].includes(kind)
      assert.equal(result.status, preserved ? 0 : 1, result.stdout + result.stderr)
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, recovery: { sanctioned: true } }), barrierEnv({ ok: true, preMerged: result.status === 0 ? ['t1'] : [] }))
      assert.equal(out.auditLog.some(r => r.verdict === 'recovered:pre-merged'), preserved)
      assert.equal(calls.some(c => c.opts.label === 'work:t1'), !preserved, 'unproved current content returns to work/audit rather than halting provisioning')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}


for (const spelling of ['relative', 'relative-dots', 'absolute', 'absolute-dots']) test('submodule absolute gate artifacts: ' + spelling, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-submodule-path-')), parent = join(dir, 'parent'), expectedRepo = join(parent, 'vendor', 'lib')
  mkdirSync(expectedRepo, { recursive: true })
  const targetRepo = spelling === 'relative' ? 'vendor/lib' : spelling === 'relative-dots' ? './vendor/../vendor/lib/' : spelling === 'absolute' ? expectedRepo : expectedRepo + '/../lib/./'
  const paths = new Map()
  try {
    const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout: parent, tasks: [submodRetryTask({ targetRepo })], recovery: { sanctioned: true } }), (p, o) => {
      const label = (o.label || '').replace(/:segment-\d+$/, '')
      if (['merge:t1', 'land:phase-3'].includes(label)) {
        if (!paths.has(label)) {
          // Use Node's path resolver and a real file as the independent absolute-path producer.
          const path = resolvePath(parent, fixtureGatePath(p)); assert.ok(path.startsWith(expectedRepo + '/.war/'), 'allocation remains inside the expected fixture repo'); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, 'gate ran\nexit_code:0\n'); paths.set(label, path)
          return { mode: label.startsWith('land:') ? 'land-phase' : 'merge-task', status: 'error', [label.startsWith('land:') ? 'land_segment' : 'gate_segment']: 'incomplete', gate_log_path: path }
        }
        return { ...defaultImpl(p, o), gate_log_path: paths.get(label) }
      }
      return defaultImpl(p, o)
    })
    assert.equal(out.landDecision, 'landed')
    for (const [label, path] of paths) {
      assert.ok(path.startsWith(expectedRepo + '/.war/'))
      assert.ok(calls.find(c => c.opts.label === label + ':segment-2')?.prompt.includes('Prior gate_log_path: ' + path), label + ' retains its absolute artifact')
      assert.equal(readFileSync(path, 'utf8'), 'gate ran\nexit_code:0\n')
    }
    const taskAudit = calls.find(c => c.opts.label === 'gate-audit:t1:execution-evidence')
    assert.ok(taskAudit?.prompt.includes('read the FULL captured gate log at ' + paths.get('merge:t1')), 'the post-merge hard execution check receives the authoritative artifact')
    const snapshots = calls.filter(c => ['pin-snapshot', 'merge-snapshot', 'merge-confirm'].includes(c.opts.dispatchKind))
    assert.ok(snapshots.length)
    for (const c of snapshots) assert.equal(JSON.parse(c.prompt.match(/Context: (.+?)\. (?:Before any|Immutable|Observed)/)[1]).repo, expectedRepo)
    const barrier = calls.find(isProvision).prompt
    assert.equal(JSON.parse(barrier.match(/RECOVERY TASK PROOFS: ([^\n]+)/)[1])[0].repo, expectedRepo)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

for (const [targetRepo, mainCheckout, field] of [
  [undefined, '/abs/repo', 'targetRepo'], [null, '/abs/repo', 'targetRepo'], ['', '/abs/repo', 'targetRepo'], [42, '/abs/repo', 'targetRepo'], ['vendor/\0lib', '/abs/repo', 'targetRepo'],
  ['vendor/lib', undefined, 'mainCheckout'], ['vendor/lib', null, 'mainCheckout'], ['vendor/lib', 42, 'mainCheckout'], ['vendor/lib', 'relative-root', 'mainCheckout'], ['vendor/lib', '/abs/\0repo', 'mainCheckout'],
]) test('submodule repo validation: target=' + JSON.stringify(targetRepo) + ' main=' + JSON.stringify(mainCheckout), async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout, tasks: [submodRetryTask({ targetRepo })] }), defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.equal(calls.length, 0, 'invalid path context refuses before any agent or Git mutation')
  assert.match(out.workflowError.message, new RegExp('requires .*' + field), 'diagnostic identifies the missing path contract')
})

test('absolute submodule repo does not require mainCheckout for resolution', async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout: undefined, tasks: [submodRetryTask()] }), defaultImpl)
  assert.equal(out.landDecision, 'landed')
  assert.ok(calls.some(isWorker))
})


for (const repos of [['vendor/lib', '/abs/repo/vendor/lib'], ['/abs/repo/vendor/lib', './vendor/lib/']]) test('submodule path aliases retain same-repo integrated evidence: ' + repos[0], async () => {
  const args = PROVISION_ARGS()
  args.tasks = args.tasks.map((t, i) => ({ ...t, taskType: 'submodule', targetRepo: repos[i], targetBase: 'main' }))
  const { calls } = await runPhase(args, evidenceImpl)
  const evidence = calls.find(c => c.opts.dispatchKind === 'evidence')
  assert.ok(evidence.prompt.includes('INTRA-PHASE-DEP phase'), 'equivalent repo spellings retain the integrated gate obligation')
  const audit = calls.find(c => /:integrated-tip$/.test(c.opts.label || ''))
  assert.ok(audit?.prompt.includes('GATE LOG ARTIFACT: read the FULL captured integrated-tip gate log at ' + fixtureGatePath(evidence.prompt)))
})

for (const targetRepo of ['.', './', 'vendor/..', '../sibling', '../repo-other/module', '../../outside']) for (const taskType of ['submodule', 'gitlink-bump']) test('relative repository containment refuses ' + taskType + ': ' + targetRepo, async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout: '/abs/repo', tasks: [submodRetryTask({ taskType, targetRepo })] }), defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.equal(calls.length, 0, 'a relative repository escape refuses before any dispatch')
  assert.match(out.workflowError.message, /strict descendant of mainCheckout/)
})

for (const [mainCheckout, targetRepo, expected] of [
  ['/abs/repo', 'vendor/../module', '/abs/repo/module'],
  ['/abs/other/../repo/.', './vendor/module', '/abs/repo/vendor/module'],
  ['/', 'module', '/module'],
  ['/abs/repo', '/outside/module', '/outside/module'],
]) for (const taskType of ['submodule', 'gitlink-bump']) test('repository containment preserves valid input: ' + taskType + ' ' + mainCheckout + ' ' + targetRepo, async () => {
  const task = submodRetryTask({ taskType, targetRepo })
  const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout, tasks: [task] }), defaultImpl)
  assert.equal(out.landDecision, 'landed')
  assert.ok(calls.some(isWorker))
  assert.equal(task.targetRepo, expected, 'paired metadata and submodule inputs share normalization')
  if (taskType === 'submodule') assert.ok(calls.some(c => c.prompt.includes(expected)), 'submodule consumers receive the normalized repository')
})
for (const targetRepo of ['.', 'module/..', '..']) test('relative repository containment refuses root equality: ' + targetRepo, async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ mainCheckout: '/', tasks: [submodRetryTask({ targetRepo })] }), defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error'); assert.equal(calls.length, 0)
  assert.match(out.workflowError.message, /strict descendant of mainCheckout/)
})

test('#2300: explicit submodule worktree cannot reuse a previous launch gate log', async () => {
  const args = runId => PT_ARGS({ runId,
    tasks: [{ ...PT_ARGS().tasks[0], branch: 'war/x/p1-t1', worktree: '/abs/shared-task', targetRepo: '/abs/submodule' }] })
  const first = await runPhase(args('launch-one'), evidenceImpl)
  const priorPath = fixtureGatePath(first.calls.find(isMergeTask).prompt)
  assert.ok(priorPath)
  const second = await runPhase(args('launch-two'), (p, o) => {
    const result = evidenceImpl(p, o)
    return isMergeTask({ opts: o }) ? { ...result, gate_log_path: priorPath } : result
  })
  const consumers = second.calls.filter(c => /^gate-audit:|^evidence:|^endstate-check:/.test(c.opts.label || ''))
  assert.ok(consumers.length)
  assert.ok(consumers.every(c => !c.prompt.includes(priorPath)), 'old launch evidence is never forwarded')
  assert.ok(consumers.some(c => c.prompt.includes('no captured artifact')), 'stale capture is reported absent')
})


test('#2300: canonical fresh-run producer separates same-day same-phase submodule attempts', async () => {
  const mint = () => {
    const r = spawnSync(process.execPath, [join(here, 'new-run-id.mjs')], { encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    const id = r.stdout.trim()
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    return id
  }
  // Same logical plan/day/phase and shared Git paths; IDs come from the actual Lead command.
  const firstId = mint(), secondId = mint()
  assert.notEqual(firstId, secondId)
  const args = runId => PT_ARGS({ runId,
    tasks: [{ ...PT_ARGS().tasks[0], branch: 'war/x/p1-t1', worktree: '/abs/shared-task', targetRepo: '/abs/submodule' }] })
  const dir = mkdtempSync(join(tmpdir(), 'war-fresh-launch-'))
  try {
    const stage = id => {
      const runDir = join(dir, id)
      mkdirSync(runDir)
      const payload = join(runDir, 'args.json')
      writeFileSync(payload, JSON.stringify(args(id)))
      const r = spawnSync(process.execPath, [join(here, 'stage-workflow.mjs'), join(here, 'workflow-template.js'),
        runDir, 'wtprov-a', '3', '--args', payload], { encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr)
      return readFileSync(r.stdout.trim(), 'utf8').replace(/^export const meta/m, 'const meta')
    }
    const firstSource = stage(firstId), secondSource = stage(secondId)
    const first = await runPhase(undefined, evidenceImpl, {}, firstSource)
    const replay = await runPhase(undefined, evidenceImpl, {}, firstSource)
    const priorPath = fixtureGatePath(first.calls.find(isMergeTask).prompt)
    assert.equal(fixtureGatePath(replay.calls.find(isMergeTask).prompt), priorPath, 'same-journal identity stays deterministic')
    const second = await runPhase(undefined, (p, o) => {
      const r = evidenceImpl(p, o)
      return isMergeTask({ opts: o }) ? { ...r, gate_log_path: priorPath } : r
    }, {}, secondSource)
    const consumers = second.calls.filter(c => /^gate-audit:|^evidence:|^endstate-check:/.test(c.opts.label || ''))
    assert.ok(consumers.length && consumers.every(c => !c.prompt.includes(priorPath)), 'a fresh same-phase attempt rejects the prior gate artifact')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
