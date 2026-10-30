// Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 4 of 6)
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


for (const site of ['land:phase-3', 'land:phase-3:environment-proceed', 'land:phase-3:baseline-proceed']) {
  test('Git reconciliation: ' + site + ' post-push response loss reuses the actual phase commit', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-land-reconcile-'))
    const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    try {
      git('init', '-b', 'working'); git('config', 'user.name', 'WAR Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base')
      const base = git('rev-parse', 'HEAD')
      git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', 'working')
      git('checkout', '-b', 'integration'); writeFileSync(join(dir, 'deliverable'), 'phase'); git('add', 'deliverable'); git('commit', '-m', 'phase task')
      const source = git('rev-parse', 'HEAD'); git('checkout', 'working')
      const diff = git('diff', base, source)
      const patch = spawnSync('git', ['patch-id', '--stable'], { input: diff + '\n', encoding: 'utf8' }).stdout.split(' ')[0]
      const snapshot = { base_sha: base, source_sha: source, remote_sha: base, patch_id: patch, content_id: fixtureContentId(dir, base, source) }
      let landedSha
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK }), (p, o) => {
        if (o.label === site) {
          git('merge', '--no-ff', 'integration', '-m', 'land phase'); git('push', 'origin', 'working')
          landedSha = git('rev-parse', 'working')
          throw new Error('socket hang up after push')
        }
        if (o.label === 'land:phase-3' && site !== o.label) return { mode: 'land-phase', status: 'gate_failed', gate_failure_class: site.includes('environment') ? 'environment' : 'baseline', gate_failing_ids: ['old-test'], gate_base_sha: base }
        return defaultImpl(p, o)
      }, { 'merge-snapshot': snapshot, 'merge-reconcile': (p) => {
        assert.ok(p.includes('LAND RECOVERY'))
        assert.ok(p.includes('never make a second phase commit'))
        const parents = git('show', '-s', '--format=%P', 'working').split(' ')
        return { outcome: 'landed', ...snapshot, base_is_ancestor: spawnSync('git', ['merge-base', '--is-ancestor', base, 'working'], { cwd: dir }).status === 0, source_tip: source, local_sha: git('rev-parse', 'working'), remote_sha: git('--git-dir=' + join(dir, 'origin.git'), 'rev-parse', 'working'), parents,
          result: { mode: 'land-phase', status: 'landed', working_sha: landedSha, gate_log_path: fixtureGatePath(p) } }
      } })
      assert.ok(landedSha); assert.equal(out.landDecision, 'landed'); assert.equal(out.landResult.working_sha, landedSha)
      assert.equal(git('rev-list', '--count', '--merges', 'working'), '1', 'the original phase commit is reused')
      assert.ok(out.auditLog.some(r => r.verdict === 'git-reconciled:landed' && r.site === site))
      assert.equal(calls.filter(c => c.opts.dispatchKind === 'merge-reconcile').length, 1)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

test('pin-transfer integrity #2154: the producer transfers approval to the real rebased task tip', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-transfer-tip-'))
  const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  try {
    git('init', '-b', 'integration'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
    writeFileSync(join(dir, 'base'), 'base'); git('add', '.'); git('commit', '-m', 'base')
    git('checkout', '-b', 'task'); writeFileSync(join(dir, 'own'), 'own'); git('add', '.'); git('commit', '-m', 'own')
    git('checkout', 'integration'); writeFileSync(join(dir, 'sibling'), 'sibling'); git('add', '.'); git('commit', '-m', 'sibling'); git('checkout', 'task')
    const { out } = await runPhase(PROVISION_ARGS({
      phase: { id: 3, title: 'P3', integrationBranch: 'integration', workingBranch: 'working' },
      tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }],
    }), defaultImpl, { 'pin-transfer': p => {
      git('rebase', 'integration')
      const ref = p.match(/\(3\) TIP=rev-parse (\S+)/)[1]
      return { status: 'transferred', rebased_tip: git('rev-parse', ref), pre_rebase_patch_id: 'same', post_rebase_patch_id: 'same' }
    } })
    const actual = git('rev-parse', 'task'); assert.notEqual(actual, git('rev-parse', 'integration'))
    assert.equal(out.pinTransfers.find(p => p.kind === 'merge').rebasedTip, actual, 'approval receipt names the reviewed task content, not its integration base')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// Real history and final tree contents are independent of both the mutator's enum and cherry.
for (const kind of ['merge-lost', 'linear-reverted', 'merge-preserved', 'linear-identical', 'linear-sibling']) {
  test('upstream content proof: real ' + kind, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-upstream-content-'))
    const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    const resolve = value => { if (typeof value !== 'string' || !/^[0-9a-f]{7,40}$/.test(value)) return null; const r = run('rev-parse', '--verify', '--end-of-options', value + '^{commit}'); return r.status === 0 ? r.stdout.trim() : null }
    const remote = () => git('ls-remote', 'origin', 'refs/heads/integration').split(/\s/)[0]
    const patch = (a, b) => { const r = spawnSync('git', ['patch-id', '--stable'], { input: git('diff', a, b) + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.trim().split(' ')[0] }
    try {
      git('init', '-b', 'integration'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD'); git('branch', 'working')
      git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', 'integration', 'working')
      git('checkout', '-b', 'task'); writeFileSync(join(dir, 'a'), 'a'); git('add', 'a'); git('commit', '-m', 'task a'); const commits = [git('rev-parse', 'HEAD')]
      if (kind.startsWith('merge-')) {
        git('checkout', '-b', 'side', base); writeFileSync(join(dir, 'b'), 'b'); git('add', 'b'); git('commit', '-m', 'task b'); commits.push(git('rev-parse', 'HEAD'))
        git('checkout', 'task'); git('merge', '--no-ff', '--no-commit', 'side'); writeFileSync(join(dir, 'merge-only'), 'approved resolution'); git('add', 'merge-only'); git('commit', '-m', 'merge result')
      }
      const approved = git('rev-parse', 'task'); git('checkout', 'integration')
      for (const [i, commit] of commits.entries()) { git('cherry-pick', '--no-commit', commit); git('commit', '-m', 'independent equivalent ' + i) }
      if (kind === 'linear-reverted') git('revert', '--no-edit', 'HEAD')
      if (kind === 'merge-preserved') { writeFileSync(join(dir, 'merge-only'), 'approved resolution'); git('add', 'merge-only'); git('commit', '-m', 'published resolution') }
      if (kind === 'linear-sibling') { writeFileSync(join(dir, 'sibling'), 'published sibling'); git('add', 'sibling'); git('commit', '-m', 'published sibling') }
      git('push', 'origin', 'integration'); const published = remote()
      const snapshot = () => ({ base_sha: git('rev-parse', 'integration'), source_sha: git('rev-parse', 'task'), remote_sha: remote(), patch_id: patch(git('merge-base', 'integration', 'task'), 'task'), content_id: fixtureContentId(dir, git('merge-base', 'integration', 'task'), 'task') })
      let audits = 0, proofs = 0, proofPrompt
      const preserved = !['merge-lost', 'linear-reverted'].includes(kind)
      const sameTree = ['linear-identical', 'merge-preserved'].includes(kind)
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { roundLimit: 2 } }), (p, o) => {
        if (isWorker({ opts: o })) return { task_id: 't1', status: 'implemented', head_sha: approved }
        if (o.label === 'audit:t1:correctness') {
          audits++
          if (audits > 1) {
            assert.ok(p.includes('PIN CONTENT RE-AUDIT'), 'an empty integration diff is not the audit basis')
            assert.ok(p.includes('git diff ' + base + ' ' + approved), 'inspect the original approved task diff')
            assert.ok(p.includes('git diff ' + approved + ' ' + published), 'inspect content removed or changed since approval')
          }
          const present = run('cat-file', '-e', 'task:' + (kind.startsWith('merge-') ? 'merge-only' : 'a')).status === 0
          return { seat: o.label, lens: 'correctness', verdict: audits === 1 || present ? 'approve' : 'request_changes', audit_sha: git('rev-parse', 'task'), findings: audits > 1 && !present ? [{ severity: 'Major', title: 'approved deliverable is missing', rationale: 'The original task content is absent at the published tip.' }] : [] }
        }
        return defaultImpl(p, o)
      }, { rawTaskAuditPins: true,
        'audit-pin': p => ({ head_sha: git('rev-parse', 'task'), pins: fixturePinRequest(p).map(resolve) }),
        'pin-snapshot': snapshot,
        'pin-transfer': () => {
          const pre = patch(base, approved); git('checkout', 'task'); git('rebase', 'integration')
          assert.equal(git('rev-parse', 'task'), published, 'Git drops the cherry-matched history, including merge-only content')
          return { status: 'already_upstream', rebased_tip: published, dispatch_base: base, pre_rebase_patch_id: pre, post_rebase_patch_id: '', already_upstream_commits: commits }
        },
        'pin-confirm': p => {
          proofs++; proofPrompt = p
          const before = JSON.parse(p.match(/Immutable BEFORE: (.+?)\. REPORTED PINS:/)[1]), pins = JSON.parse(p.match(/REPORTED PINS: ([^\n]+)/)[1]).map(resolve)
          const ownBase = git('merge-base', before.base_sha, before.source_sha), lines = git('cherry', before.base_sha, before.source_sha)
          const proof = { head_sha: git('rev-parse', 'task'), head_tree: git('rev-parse', 'task^{tree}'), local_sha: git('rev-parse', 'integration'), remote_sha: remote(), content_sha: before.source_sha,
            approved_tree: git('rev-parse', pins[0] + '^{tree}'), content_tree: git('rev-parse', before.source_sha + '^{tree}'), dispatch_base: ownBase, pins,
            pre_content_id: fixtureContentId(dir, ownBase, before.source_sha), post_content_id: fixtureContentId(dir, 'integration', 'task'), pre_patch_id: patch(ownBase, before.source_sha), post_patch_id: patch('integration', 'task'), target_ancestor: run('merge-base', '--is-ancestor', 'integration', 'task').status === 0,
            post_empty: run('diff', '--quiet', 'integration', 'task').status === 0, task_count: Number(git('rev-list', '--count', ownBase + '..' + before.source_sha)), cherry: lines.split('\n').map(line => ({ sign: line[0], sha: line.slice(2) })) }
          assert.equal(proof.cherry.length, commits.length)
          assert.equal(proof.task_count, kind.startsWith('merge-') ? 3 : 1, 'merge commits are omitted by cherry, linear-reverted is not a count mismatch')
          assert.equal(proof.head_tree === proof.approved_tree, sameTree)
          return proof
        },
      })
      assert.equal(out.landed.includes('t1'), preserved, 'completion requires the approved content or a fresh acceptance judgment')
      assert.equal(audits, sameTree ? 1 : 2)
      assert.ok(!calls.some(isMergeTask), 'an already published tip never triggers an empty content merge')
      assert.equal(remote(), published)
      assert.equal(out.pinTransfers.some(r => r.mode === 'already_upstream'), sameTree)
      assert.equal(out.pinTransfers.some(r => r.kind === 'merge' && r.mode === 'mismatch'), kind === 'linear-sibling')
      assert.equal(proofs, kind === 'linear-sibling' ? 2 : 1, 're-read shared Git refs after the fresh panel before completion')
      assert.ok(proofPrompt.includes('head_tree from head_sha^{tree}'), 'the verifier must read the final tree object from Git')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

test('2485/ES6 real git: an evil merge (the merge commit tree is not the task tree) is refused by confirmMerge and reconcileMerge', async () => {
  const repo = es6Repo()
  try {
    const { out, calls, facts } = await es6Phase(repo, p => {
      rebaseTask(repo)
      const [mergeStep, commitStep] = mergeCommandOf(p).split(' && ')
      bash(repo.dir, mergeStep); writeFileSync(join(repo.dir, 'evil'), 'content no panel judged'); repo.git('add', 'evil'); bash(repo.dir, commitStep)
    })
    const f = facts()
    assert.notEqual(f.tree.target, f.tree.source, 'the merge tree differs from the task tree')
    assert.equal(f.trailer.replace(/\n+$/, ''), 'WAR-Task: task'); assert.equal(f.base_is_ancestor, true); assert.equal(f.parents[1], repo.git('rev-parse', 'task'), 'only the tree clause fails')
    assertRefused(out, calls, 'evil merge')
  } finally { rmSync(repo.dir, { recursive: true, force: true }) }
})

test('2485/ES10 a repeated reconcile on an existing merge commit whose second parent is the task tip and whose trailer is exact reports merged and makes no second merge', async () => {
  const repo = es6Repo(), { dir, git, remote, patch } = repo
  try {
    let attempts = 0, reconcilePrompt = null
    const snapshot = () => { const fork = git('merge-base', 'integration', 'task'); return { base_sha: git('rev-parse', 'integration'), source_sha: git('rev-parse', 'task'), remote_sha: remote(), patch_id: patch(fork, 'task'), content_id: fixtureContentId(dir, fork, 'task') } }
    const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }], run: { roundLimit: 3 } }), (p, o) => {
      if (o.label === 'merge:t1') { rebaseTask(repo); bash(dir, mergeCommandOf(p)); git('push', '-q', 'origin', 'integration'); throw new Error('read ECONNRESET after push') }
      return defaultImpl(p, o)
    }, {
      'merge-snapshot': (p, o) => o.label === 'git-snapshot:t1' ? snapshot() : NEW_SEAT_DEFAULTS['merge-snapshot'],
      'merge-reconcile': p => {
        attempts++; reconcilePrompt = p
        // Every attempt replays the ORIGINAL OPERATION under the never-move rule: the task tip is already an
        // ancestor of the integration tip, so no attempt makes a second merge commit.
        gitTaskMerge(repo.run, 'task', 'task')
        if (attempts === 1) throw new Error('529 reconcile reply lost')
        const before = JSON.parse(p.match(/Immutable pre-dispatch Git snapshot: (.+?)\. Prior response:/)[1]), local = git('rev-parse', 'integration')
        return { outcome: 'merged', base_sha: before.base_sha, source_sha: before.source_sha, local_sha: local, remote_sha: remote(), source_tip: git('rev-parse', 'task'), patch_id: patch(before.base_sha, 'task'), content_id: fixtureContentId(dir, before.base_sha, 'task'),
          ...gitTaskFacts(repo.run, before.base_sha, 'task', 'integration'), result: { mode: 'merge-task', status: 'merged', integration_sha: local, gate_sha: git('rev-parse', 'task'), gate_log_path: fixtureGatePath(p) } }
      },
    })
    assert.equal(attempts, 2, 'the reconcile repeated')
    assert.match(reconcilePrompt, /an existing such merge commit IS the merge: report it merged and never make a second merge/, 'the task-arm reconcile prompt names the existing merge commit')
    assert.match(reconcilePrompt, /whose parents are exactly \[snapshot base_sha, current source tip\][^.]*WAR-Task trailer is exactly `WAR-Task: task`/, 'and accepts only the predicate')
    assert.ok(out.auditLog.some(r => r.verdict === 'git-reconciled:merged' && r.site === 'merge:t1'), 'the existing merge commit reports merged')
    assert.ok(out.landed.includes('t1'))
    assert.equal(git('rev-list', '--count', '--merges', 'integration'), '1', 'exactly one merge commit — no second merge')
    assert.equal(git('rev-parse', 'integration^2'), git('rev-parse', 'task'), 'its second parent is the task tip')
    assert.equal(calls.filter(c => c.opts.label === 'merge:t1').length, 1, 'the primary mutation is never restarted')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES17 a foreign task\'s Ace-Charge never counts toward this task\'s seed', async () => {
  const { prompt, cmd } = await absorbReadOf()
  assert.ok(prompt.includes("whose task id is that task's (a charge naming another task id never counts)"), 'the prompt rules out a foreign charge')
  assert.ok(refinerMd.includes("another task's id never"), 'the card rules out a foreign charge')
  const { dir, git, run, commit } = absorbFixture()
  const t1 = 'war/wtprov-a/p3-t1', t2 = 'war/wtprov-a/p3-t2'
  try {
    git('checkout', '-b', t1); commit('own', 'ace\n\nAce-Charge: t1:1'); commit('picked', 'cherry-picked from t2\n\nAce-Charge: t2:5')
    git('checkout', 'integration/wtprov-a/phase-3'); gitTaskMerge(run, t1, t1)
    git('checkout', '-b', t2); commit('t2', 't2 ace\n\nAce-Charge: t2:7'); git('checkout', 'integration/wtprov-a/phase-3'); gitTaskMerge(run, t2, t2)
    const values = readCharges(cmd, dir, t1)
    assert.ok(values.includes('t2:5') && !values.includes('t2:7'), 'the range is t1\'s own merge commit, and it carries the foreign value')
    assert.equal(highestFor(values, 't1'), 1, 'the foreign t2:5 charge does not raise t1\'s seed')
    assert.equal(highestFor(readCharges(cmd, dir, t2), 't2'), 7, 't2 reads its own merge commit')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
