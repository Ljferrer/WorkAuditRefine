// Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 1 of 6)
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


for (const result of ['approve', 'block', 'repeat-mismatch']) {
  test('audit pin integrity #2141: real Git confirmation and a fresh full roster: ' + result, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-audit-pin-'))
    const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    try {
      git('init', '-b', 'task'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'a'), 'base'); git('add', '.'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD')
      writeFileSync(join(dir, 'a'), 'task'); git('commit', '-am', 'task'); const tip = git('rev-parse', 'HEAD')
      const tasks = [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir, roster: [{ lens: 'correctness' }, { lens: 'security' }] }]
      let reconciled = false, lookups = 0
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks }), (p, o) => {
        if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: base }
        if ((o.label || '').startsWith('audit:t1:')) return { seat: o.label, lens: o.label.split(':')[2],
          verdict: result === 'block' ? 'request_changes' : 'approve',
          audit_sha: reconciled && result === 'repeat-mismatch' ? base : tip,
          findings: result === 'block' ? [{ severity: 'Major', title: 'task bug', file: 'a', rationale: 'actual tip violates acceptance' }] : [] }
        return defaultImpl(p, o)
      }, { 'audit-pin': (p, o) => {
        assert.equal(o.model, lookups ? 'opus' : 'sonnet')
        assert.match(p, /No edits, checkout, merge, push or rebase/)
        const command = p.match(/git rev-parse --verify (\S+)\./)[1]
        reconciled = true; lookups++
        return { head_sha: git('rev-parse', '--verify', command), pins: fixturePinRequest(p).map(sha => git('rev-parse', '--verify', sha + '^{commit}')) }
      } })
      assert.equal(calls.filter(c => c.opts.dispatchKind === 'audit-pin').length, 2, 'each panel has a bounded read-only verification')
      assert.equal(calls.filter(c => (c.opts.label || '').startsWith('audit:t1:')).length, 4, 'both seats run anew once')
      assert.equal(out.landed.includes('t1'), result === 'approve', 'only unanimous review of confirmed Git tip can merge')
      assert.equal(git('rev-parse', 'HEAD'), tip, 'reconciliation is read-only')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

for (const kind of ['local-ahead', 'unpublished-seed', 'published-seed', 'local-behind', 'maintenance-death-after-ff', 'maintenance-false-success']) {
  test('Git target preflight: real ' + kind, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-target-preflight-'))
    const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    const remote = ref => git('ls-remote', 'origin', 'refs/heads/' + ref).split(/\s/)[0] || null
    const patch = (base, tip) => { const r = spawnSync('git', ['patch-id', '--stable'], { input: git('diff', base, tip) + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.trim().split(' ')[0] }
    try {
      git('init', '-b', 'integration'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD'); git('branch', 'working')
      git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', 'working')
      if (!kind.endsWith('seed')) git('push', 'origin', 'integration')
      git('checkout', '-b', 'task'); writeFileSync(join(dir, 'task.test.js'), 'approved task'); git('add', 'task.test.js'); git('commit', '-m', 'current task'); const taskTip = git('rev-parse', 'HEAD')
      git('checkout', 'integration')
      if (kind !== 'published-seed') { writeFileSync(join(dir, 'prior'), 'prior target content'); git('add', 'prior'); git('commit', '-m', 'prior target content') }
      const advanced = git('rev-parse', 'integration')
      if (['local-behind', 'maintenance-death-after-ff', 'maintenance-false-success'].includes(kind)) {
        git('push', 'origin', 'integration'); git('checkout', '--detach', base); git('update-ref', 'refs/heads/integration', base, advanced); git('checkout', 'integration')
      }
      const initialRemote = remote('integration')
      const snapshot = p => ({ base_sha: git('rev-parse', 'integration'), source_sha: git('rev-parse', 'task'), remote_sha: remote('integration'), seed_sha: remote(p.match(/also query origin's exact refs\/heads\/([^ ]+) and return seed_sha/)[1]), patch_id: patch(git('merge-base', 'integration', 'task'), 'task'), content_id: fixtureContentId(dir, git('merge-base', 'integration', 'task'), 'task') })
      let maintenance = 0, mergeCalls = 0
      const { out, calls } = await runPhase(PROVISION_ARGS({ phase: { id: 3, title: 'P3', integrationBranch: 'integration', workingBranch: 'working' }, tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { roundLimit: 2 } }), (p, o) => {
        if (o.label === 'merge:t1') {
          mergeCalls++; git('checkout', 'task'); git('rebase', 'integration'); git('checkout', 'integration'); gitTaskMerge(run, 'task', branchOfPrompt(p)); git('push', 'origin', 'integration')
          return { mode: 'merge-task', status: 'merged', integration_sha: git('rev-parse', 'integration'), gate_sha: git('rev-parse', 'task') }
        }
        return defaultImpl(p, o)
      }, { 'pin-snapshot': snapshot,
        'target-reconcile': (p, o) => {
          maintenance++; assert.equal(o.model, 'opus'); assert.ok(p.includes('Never publish local-only integration commits'))
          if (kind === 'local-behind' || kind === 'maintenance-death-after-ff') {
            git('fetch', 'origin', 'integration'); git('merge', '--ff-only', 'origin/integration')
            if (kind === 'maintenance-death-after-ff') throw new Error('529 response died after local follower fast-forward')
          }
          return { detail: 'maintenance returned; only the fresh Git read can decide readiness' }
        },
        'merge-snapshot': (p, o) => o.label === 'git-snapshot:t1' ? snapshot(p) : NEW_SEAT_DEFAULTS['merge-snapshot'],
        'merge-confirm': (p, o) => {
          if (o.label !== 'git-confirm:merge:t1') return NEW_SEAT_DEFAULTS['merge-confirm'](p)
          const before = JSON.parse(p.match(/Immutable pre-dispatch snapshot: (.+?)\. Reported result:/)[1])
          return { local_sha: git('rev-parse', 'integration'), remote_sha: remote('integration'), source_tip: git('rev-parse', 'task'), reported_sha: git('rev-parse', 'integration'), base_is_ancestor: run('merge-base', '--is-ancestor', before.base_sha, 'integration').status === 0, patch_id: patch(before.base_sha, 'task'), content_id: fixtureContentId(dir, before.base_sha, 'task'),
            ...gitTaskFacts(run, before.base_sha, 'task', 'integration') }
        },
      })
      const accepted = ['published-seed', 'local-behind', 'maintenance-death-after-ff'].includes(kind)
      assert.equal(out.landed.includes('t1'), accepted, 'unaccounted local history cannot piggyback on the current task')
      assert.equal(mergeCalls, accepted ? 1 : 0)
      if (!accepted) { assert.equal(remote('integration'), initialRemote, 'no unaccounted content is published'); assert.equal(git('rev-parse', 'task'), taskTip, 'refusal precedes the pin-transfer rebase'); assert.ok(!calls.some(c => c.opts.dispatchKind === 'pin-transfer')) }
      assert.equal(maintenance, kind === 'published-seed' ? 0 : 1, 'bounded maintenance gets a chance before hold')
      if (kind === 'maintenance-death-after-ff') assert.ok(out.auditLog.every(r => r.verdict !== 'git-target:unreconciled' || r.before.base_sha === base), 'a lost maintenance reply is resolved by re-reading actual Git')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

for (const site of ['task', 'land']) for (const route of ['baseline', 'environment']) for (const response of ['normal', 'lost']) for (const changed of [false, true]) test(`known failure source boundary: ${site} ${route} ${response} changed=${changed}`, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-failed-source-'))
  const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
  const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  const target = site === 'task' ? 'integration' : 'working', source = site === 'task' ? 'task' : 'integration'
  const label = site === 'task' ? 'merge:t1' : 'land:phase-3', retryLabel = label + ':' + route + '-proceed'
  const patch = (base, tip) => { const r = spawnSync('git', ['patch-id', '--stable'], { input: git('diff', base, tip) + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.trim().split(' ')[0] }
  const remote = () => git('ls-remote', 'origin', 'refs/heads/' + target).split(/\s/)[0]
  let retries = 0, maintenance = 0, beforeFailure
  try {
    git('init', '-b', target); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD')
    git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', target)
    git('checkout', '-b', source); writeFileSync(join(dir, 'owned.js'), 'module.exports = "approved value"\n'); git('add', 'owned.js'); git('commit', '-m', 'approved source'); const approved = git('rev-parse', source)
    git('checkout', target)
    if (site === 'task') { writeFileSync(join(dir, 'sibling'), 'published sibling'); git('add', 'sibling'); git('commit', '-m', 'sibling'); git('push', 'origin', target) }
    const targetBefore = git('rev-parse', target)
    const snapshot = () => ({ base_sha: git('rev-parse', target), source_sha: git('rev-parse', source), remote_sha: remote(), patch_id: patch(git('merge-base', target, source), source), content_id: fixtureContentId(dir, git('merge-base', target, source), source) })
    const proof = before => {
      const ownBase = git('merge-base', before.base_sha, source)
      return { local_sha: git('rev-parse', target), remote_sha: remote(), source_tip: git('rev-parse', source), patch_id: patch(ownBase, source), content_id: fixtureContentId(dir, ownBase, source), base_is_ancestor: run('merge-base', '--is-ancestor', before.base_sha, target).status === 0, parents: git('show', '-s', '--format=%P', target).split(' '),
        ...(site === 'task' ? gitTaskFacts(run, before.base_sha, source, target) : {}) }
    }
    const failure = { mode: site === 'task' ? 'merge-task' : 'land-phase', status: 'gate_failed', gate_failure_class: route, gate_failing_ids: ['existing-test'], gate_base_sha: base, gate_output: 'classified existing failure' }
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, run: { roundLimit: 2 } }), (p, o) => {
      if (o.label === label) {
        beforeFailure = snapshot(); git('checkout', source)
        if (site === 'task') git('rebase', target)
        if (changed) { writeFileSync(join(dir, 'owned.js'), 'module.exports = "approved  value"\n'); git('add', 'owned.js'); git('commit', '-m', 'significant source drift') }
        git('checkout', target)
        assert.equal(git('rev-parse', target), targetBefore); assert.equal(remote(), targetBefore)
        if (response === 'lost') throw new Error('529 lost failure response')
        return failure
      }
      if (o.label === retryLabel) {
        retries++; git('checkout', target); if (site === 'task') gitTaskMerge(run, source, branchOfPrompt(p)); else git('merge', '--no-ff', source, '-m', 'proceed'); git('push', 'origin', target)
        return { mode: failure.mode, status: site === 'task' ? 'merged' : 'landed', [site === 'task' ? 'integration_sha' : 'working_sha']: git('rev-parse', target), ...(site === 'task' ? { gate_sha: git('rev-parse', source) } : {}), gate_log_path: fixtureGatePath(p) }
      }
      return defaultImpl(p, o)
    }, { rawMergeResults: true,
      'merge-snapshot': (p, o) => p.includes('for ' + label + '.') || p.includes('for ' + retryLabel + '.') ? snapshot() : NEW_SEAT_DEFAULTS['merge-snapshot'],
      'merge-confirm': (p, o) => {
        if (!o.label.startsWith('git-confirm:' + label)) return NEW_SEAT_DEFAULTS['merge-confirm'](p)
        const before = JSON.parse(p.match(/Immutable pre-dispatch snapshot: (.+?)\. Reported result:/)[1]), reported = JSON.parse(p.match(/Reported result: ([^\n]+?)\.\n/)[1])
        const r = reported.claimed ? run('rev-parse', '--verify', reported.claimed + '^{commit}') : null
        return { ...proof(before), reported_sha: r?.status === 0 ? r.stdout.trim() : null }
      },
      'merge-reconcile': p => {
        maintenance++
        const before = JSON.parse(p.match(/Immutable pre-dispatch Git snapshot: (.+?)\. Prior response:/)[1])
        return { outcome: 'unmerged', base_sha: before.base_sha, source_sha: before.source_sha, ...proof(before), result: failure }
      },
    })
    assert.ok(beforeFailure, 'the actual operation was dispatched')
    assert.equal(patch(git('merge-base', targetBefore, source), source), beforeFailure.patch_id, 'both source states retain the same lossy patch ID')
    assert.equal(out.landed.includes('t1') && out.landDecision === 'landed', !changed, 'source-only mutation cannot acquire approval from a known failure or an unmerged reply')
    assert.equal(retries, changed ? 0 : 1, 'no proceed dispatch adopts unapproved source as a fresh expected snapshot')
    if (changed) { assert.ok(maintenance > 0); assert.equal(git('rev-parse', target), targetBefore); assert.equal(remote(), targetBefore) }
    if (!changed && site === 'task') assert.notEqual(git('rev-parse', source), approved, 'a content-preserving rebase remains an ordinary recoverable failure')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES3 dead probe after a blocked result that made no commit lands the approved tip through the empty-range arm in real git', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-empty-range-'))
  const git = (...a) => { const r = spawnSync('git', a, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  try {
    git('init', '-q', '-b', 'task'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'x.js'), 'approved'); git('add', 'x.js'); git('commit', '-q', '-m', 'approved task')
    const approved = git('rev-parse', 'HEAD')
    let script = null
    const { out } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { ace: true } }), (p, o) => {
      if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: approved }
      if (seatOf(o) === 'war-worker') return { task_id: 't1', status: 'blocked', blocked_reason: 'made no commit' }
      if (o.label === 'audit:t1:correctness') return { seat: o.label, lens: 'correctness', verdict: 'approve', audit_sha: approved, findings: [nit({ file: 'x.js' })], confidence: 'high' }
      return defaultImpl(p, o)
    }, { 'tip-probe': INFRA, 'pin-transfer': p => { script = rangeRevertScriptOf(p); return { status: 'error' } } })
    assert.ok(script, 'the dead probe registered a range revert on the pin-transfer probe')
    const run = spawnSync('bash', ['-c', script], { cwd: dir, encoding: 'utf8' })
    assert.equal(run.status, 0, run.stderr)
    assert.match(run.stdout, /RANGE-CLEAN/, 'HEAD equals the approved tip: the revert and the commit are skipped')
    assert.equal(git('rev-parse', 'HEAD'), approved, 'the tip is unchanged — the approved tip lands')
    assert.ok(out.landed.includes('t1') && !(out.escalated || []).some(e => e && e.task === 't1'), 't1 lands, never a hold')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// The merge-slot revert, then a floor fix, against real git (#2485 PIN-5). The registered range rides
// the pin-transfer probe and the primary merge as revert_range, and those two dispatches run the
// revert. The floor-retry re-merge runs after that revert landed and after a floor fix committed above
// the still-ancestor approved commit (a no-op rebase), so its snapshot must predict the branch's own
// patch: a context that still named revert_range would predict the approved patch, fail confirmMerge on
// the merge it just pushed and hold the task. Every snapshot and confirm seat here follows the
// dispatched prompt against the real repo, so the land itself is the oracle, never the context builder.
test('2485/ES3 dead probe, then a done-unmet floor in real git: the floor-retry re-merge takes the plain context, confirms the floor fix and lands', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-floor-retry-'))
  const { run, git, remote, patch } = realGitTools(dir)
  try {
    git('init', '-q', '-b', 'integration'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-q', '-m', 'base'); git('branch', 'working')
    git('init', '-q', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', '-q', 'origin', 'integration', 'working')
    // The task sits on the integration tip itself, so every rebase below is a no-op and the approved
    // commit stays an ancestor of the branch tip.
    git('checkout', '-q', '-b', 'task'); writeFileSync(join(dir, 'deliverable.test.js'), 'approved'); git('add', 'deliverable.test.js'); git('commit', '-q', '-m', 'task\n\nWAR-Task: task')
    const approved = git('rev-parse', 'HEAD'); git('push', '-q', 'origin', 'task'); git('checkout', '-q', 'integration')
    // A snapshot seat that follows the dispatched prompt: the approved commit's patch when the context
    // names revert_range and that commit is an ancestor of the source tip, else the branch's own patch.
    const snapshot = p => {
      const ctx = snapshotContextOf(p)
      const tip = ctx.revert_range && run('merge-base', '--is-ancestor', ctx.revert_range.approved, 'task').status === 0 ? ctx.revert_range.approved : 'task'
      const base = git('merge-base', 'integration', tip)
      return { base_sha: git('rev-parse', 'integration'), source_sha: git('rev-parse', 'task'), remote_sha: remote(), patch_id: patch(base, tip), content_id: fixtureContentId(dir, base, tip) }
    }
    const commitOnTask = (file, text) => { git('checkout', '-q', 'task'); writeFileSync(join(dir, file), text); git('add', file); git('commit', '-q', '-m', text); return git('rev-parse', 'HEAD') }
    let audits = 0, floorFix = null
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir, doneWhen: DU_CMD }], run: { roundLimit: 2, ace: true } }), (p, o) => {
      if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: approved }
      if (o.label === 'ace:polish:t1:a1') return { task_id: 't1', status: 'implemented', head_sha: commitOnTask('deliverable.test.js', 'unjudged ace'), ace_diff_files: ['deliverable.test.js'], files_changed: ['deliverable.test.js'] }
      if (isMakePassWorker({ opts: o })) { floorFix = commitOnTask('task-one.acceptance.test.mjs', 'floor fix'); return { task_id: 't1', status: 'implemented', head_sha: floorFix, files_changed: ['task-one.acceptance.test.mjs'] } }
      if (o.label === 'audit:t1:correctness') { audits++; return { seat: o.label, lens: 'correctness', verdict: 'approve', audit_sha: git('rev-parse', 'task'), findings: audits === 1 ? [nit({ file: 'deliverable.test.js' })] : [], confidence: 'high' } }
      if (o.label === 'merge:t1') return { mode: 'merge-task', status: 'done-unmet' }
      if (/^merge:t1:floor-retry:/.test(o.label || '')) { git('checkout', '-q', 'integration'); gitTaskMerge(run, 'task', branchOfPrompt(p)); git('push', '-q', 'origin', 'integration'); return { mode: 'merge-task', status: 'merged', integration_sha: git('rev-parse', 'integration'), gate_sha: git('rev-parse', 'task') } }
      return defaultImpl(p, o)
    }, {
      'tip-probe': probeAt('polish', INFRA),
      'pin-snapshot': snapshot,
      'merge-snapshot': (p, o) => o.label === 'git-snapshot:t1' ? snapshot(p) : NEW_SEAT_DEFAULTS['merge-snapshot'],
      'pin-transfer': p => {
        git('checkout', '-q', 'task')
        const rv = spawnSync('bash', ['-c', rangeRevertScriptOf(p)], { cwd: dir, encoding: 'utf8' })
        assert.equal(rv.status, 0, rv.stderr); assert.match(rv.stdout, /RANGE-REVERTED/, 'the dead probe\'s range is reverted at the merge slot')
        git('rebase', '-q', 'integration')
        return { status: 'error' }
      },
      'pin-confirm': p => realGitPinConfirm(dir, p),
      'merge-confirm': (p, o) => /^git-confirm:merge:t1/.test(o.label || '') ? realGitMergeConfirm(dir, p) : NEW_SEAT_DEFAULTS['merge-confirm'](p),
    })
    const snapshotBefore = label => { const i = calls.findIndex(c => c.opts.label === label); assert.ok(i > 0, label + ' dispatched'); return snapshotContextOf(calls.slice(0, i).reverse().find(c => c.opts.dispatchKind === 'merge-snapshot').prompt) }
    const retry = calls.find(c => /^merge:t1:floor-retry:/.test(c.opts.label || ''))
    assert.ok(retry, 'the done-unmet floor routes a floor-retry re-merge')
    // Control arm: the two revert-carrying dispatches name the range (the approved sha; a tip never read from Git).
    assert.deepEqual(snapshotContextOf(calls.find(c => c.opts.label === 'git-pin-snapshot:t1').prompt).revert_range, { approved, tip: null }, 'the pin-transfer snapshot names the registered range')
    assert.deepEqual(snapshotBefore('merge:t1').revert_range, { approved, tip: null }, 'the primary merge snapshot names the registered range')
    assert.match(calls.find(c => c.opts.label === 'merge:t1').prompt, /FORWARD-REVERT \(--ace\)[^\n]*the pre-revert tip was never read from Git/, 'the primary merge carries the revert clause')
    // The finding: the floor-retry carries no clause, so its snapshot context names no range.
    assert.ok(!retry.prompt.includes('FORWARD-REVERT'), 'the floor-retry re-merge carries no revert clause: the revert is history')
    assert.ok(!Object.hasOwn(snapshotBefore(retry.opts.label), 'revert_range'), 'the floor-retry snapshot context carries no revert_range key')
    assert.ok(!calls.some(c => c.opts.dispatchKind === 'merge-reconcile'), 'git confirmed the floor-retry merge outright: no uncertain-merge reconciliation')
    assertLandedReverted(out, 'floor-retry after the merge-slot revert')
    assert.equal(remote(), git('rev-parse', 'integration'), 'origin integration is the task merge commit: the merge landed')
    assert.equal(git('rev-parse', 'integration^2'), floorFix, 'the merge commit\'s second parent is the floor-fix tip')
    assert.equal(git('rev-parse', floorFix + '^^{tree}'), git('rev-parse', approved + '^{tree}'), 'the floor fix sits on the engine revert, whose tree is the approved tree')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES6 real git: an unrebased merge (the snapshot base is not an ancestor of the task tip) is refused by confirmMerge and reconcileMerge', async () => {
  const repo = es6Repo()
  try {
    // The task carries the sibling's content through its own commit, so the merge tree still equals the
    // task tree and only the rebased-ancestry clause can refuse it.
    repo.git('checkout', '-q', 'task'); repo.git('checkout', 'integration', '--', 'sibling'); repo.git('commit', '-q', '-m', 'sibling copy'); repo.git('checkout', '-q', 'integration')
    const { out, calls, facts } = await es6Phase(repo, p => bash(repo.dir, mergeCommandOf(p)))
    const f = facts()
    assert.equal(f.base_is_ancestor, false, 'the base is not an ancestor of the task tip')
    assert.equal(f.tree.target, f.tree.source); assert.equal(f.trailer.replace(/\n+$/, ''), 'WAR-Task: task'); assert.equal(f.parents[1], repo.git('rev-parse', 'task'), 'only the ancestry clause fails')
    assertRefused(out, calls, 'unrebased merge')
  } finally { rmSync(repo.dir, { recursive: true, force: true }) }
})

test('2485/ES6 real git: a mutating prepare-commit-msg hook has no effect on the merge commit made by the dispatched spelling, and alters it without core.hooksPath=/dev/null (proven red)', async () => {
  const hook = repo => { const h = join(repo.dir, '.git', 'hooks', 'prepare-commit-msg'); mkdirSync(dirname(h), { recursive: true }); writeFileSync(h, '#!/bin/sh\nprintf "\\nHooked: yes\\nWAR-Task: hooked\\n" >> "$1"\n', { mode: 0o755 }) }
  const guarded = es6Repo()
  try {
    hook(guarded)
    const { out, facts } = await es6Phase(guarded, p => { rebaseTask(guarded); bash(guarded.dir, mergeCommandOf(p)) })
    assert.equal(facts().trailer.replace(/\n+$/, ''), 'WAR-Task: task', 'the hook never ran on the engine commit')
    assert.doesNotMatch(guarded.git('log', '-1', '--format=%B', 'integration'), /Hooked/, 'the message carries no hook text')
    assert.ok(out.landed.includes('t1'), 'the guarded merge lands')
  } finally { rmSync(guarded.dir, { recursive: true, force: true }) }
  const bare = es6Repo()
  try {
    hook(bare)
    const { out, calls, facts } = await es6Phase(bare, p => { rebaseTask(bare); bash(bare.dir, mergeCommandOf(p).replaceAll('-c core.hooksPath=/dev/null ', '')) })
    assert.notEqual(facts().trailer.replace(/\n+$/, ''), 'WAR-Task: task', 'without the hooksPath override the hook rewrites the trailer block even under --no-verify')
    assertRefused(out, calls, 'hook-altered merge')
  } finally { rmSync(bare.dir, { recursive: true, force: true }) }
})

test('2485/ES17 a failed merge walk fails the absorb-charge read and never seeds a plausible 0', async () => {
  const { cmd } = await absorbReadOf()
  const { dir, git, run, commit } = absorbFixture()
  const branch = 'war/wtprov-a/p3-t1', bin = join(dir, '.bin')
  const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim()
  try {
    git('checkout', '-b', branch); commit('one', 'ace one\n\nAce-Charge: t1:3')
    git('checkout', 'integration/wtprov-a/phase-3'); gitTaskMerge(run, branch, branch)
    mkdirSync(bin)
    writeFileSync(join(bin, 'git'), `#!/usr/bin/env node
const { spawnSync } = require('node:child_process')
const args = process.argv.slice(2)
if (args.includes('rev-list') && args.includes('--first-parent') && args.includes('--merges')) process.exit(128)
process.exit(spawnSync(${JSON.stringify(realGit)}, args, { stdio: 'inherit' }).status ?? 128)
`, { mode: 0o755 })
    const env = { ...process.env, PATH: bin + ':' + process.env.PATH }
    const fill = c => c.replace(`<that task's worktree>`, dir).replace(`<that task's branch>`, branch)
    const r = spawnSync('bash', ['-c', fill(cmd)], { encoding: 'utf8', env })
    assert.notEqual(r.status, 0, 'a failed merge walk fails the read: ' + r.stdout)
    // Proven red: the pre-capture `for m in $(...)` spelling swallows the failure and exits 0.
    const old = cmd.replace(/ms=\$\((git [^)]*)\) && for m in \$ms;/, 'for m in $($1);')
    assert.notEqual(old, cmd, 'the capture spelling is present to revert')
    assert.equal(spawnSync('bash', ['-c', fill(old)], { encoding: 'utf8', env }).status, 0, 'the uncaptured walk hides the failure')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES15 real git: after the barrier writes the marker in a linked worktree, git status --porcelain is empty and the marker names the HEAD tree', async () => {
  const { calls } = await runPhase(withProvision(), defaultImpl)
  const p = calls.find(c => c.opts.label === 'provision-run:_refinery').prompt
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-es15-'))
  const run = (cwd, cmd) => spawnSync('bash', ['-c', cmd], { cwd, encoding: 'utf8' })
  try {
    const repo = join(dir, 'repo'), wt = join(dir, '_refinery')
    mkdirSync(repo)
    assert.equal(run(repo, 'git init -q -b integration && git config user.name F && git config user.email f@example.invalid && echo a > a && git add a && git commit -qm base').status, 0)
    assert.equal(run(repo, `git worktree add -q --detach ${wt} integration`).status, 0)
    const w = run(wt, markerWriterOf(p))
    assert.equal(w.status, 0, w.stderr)
    assert.equal(run(wt, 'git status --porcelain --untracked-files=all').stdout, '', 'the marker is excluded: the worktree stays clean')
    assert.equal(run(repo, 'git status --porcelain --untracked-files=all').stdout, '', 'the main checkout stays clean too')
    const tree = run(wt, 'git rev-parse HEAD^{tree}').stdout.trim()
    assert.equal(readFileSync(join(wt, '.war/provision_tree'), 'utf8'), 'provision_tree: ' + tree + '\n', 'one line, the HEAD tree')
    assert.equal(run(wt, markerTestOf(p)).status, 0, 'the reader test passes on the provisioned tree')
    assert.equal(run(wt, markerWriterOf(p)).status, 0, 'the writer is idempotent')
    const exclude = run(wt, 'cat "$(git rev-parse --git-path info/exclude)"').stdout
    assert.equal(exclude.split('\n').filter(l => l === '.war/').length, 1, '.war/ is excluded once')
    assert.equal(run(wt, 'echo b > b && git add b && git commit -qm next').status, 0)
    assert.notEqual(run(wt, markerTestOf(p)).status, 0, 'a changed tree fails the reader test')
    // A step that rewrites a tracked file (a lockfile) and leaves build output: the dispatched restore
    // spelling, run in the worktree, cleans the tracked tree and keeps the untracked output.
    const restore = PROVISION_CLEAN_SENTENCE.match(/via `([^`]+)` in that worktree/)[1]
    assert.equal(run(wt, 'echo rewritten > a && mkdir -p build && touch build/out').status, 0)
    assert.notEqual(run(wt, 'git status --porcelain -uno').stdout, '', 'without the restore the tracked tree is dirty')
    assert.equal(run(wt, restore).status, 0)
    assert.equal(run(wt, 'git status --porcelain -uno').stdout, '', 'the restore leaves no tracked change')
    assert.equal(run(wt, 'test -f build/out').status, 0, 'untracked build output survives the restore')
    assert.equal(run(wt, markerWriterOf(p)).status, 0)
    assert.equal(run(wt, markerTestOf(p)).status, 0, 'the marker written after the restore names the HEAD tree')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
