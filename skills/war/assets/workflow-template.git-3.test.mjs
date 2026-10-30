// Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 3 of 6)
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


test('gate artifact isolation: actual dispatched mktemp command isolates same-tip attempts from an old writer', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-gate-isolation-'))
  try {
    const args = PROVISION_ARGS({ tasks: SINGLE_TASK })
    const { calls } = await runPhase(args, defaultImpl)
    const prompt = calls.find(isMergeT1).prompt
    const command = prompt.match(/`(mktemp -d "[^"\n]+gate-t1\.[^"\n]+\.XXXXXX")`/)[1]
    // Substitute only the fixture root; execute the producer's actual allocation command twice.
    const template = command.match(/"([^"\n]+)"/)[1]
    mkdirSync(join(dir, '.war'))
    const allocate = () => {
      const r = spawnSync('sh', ['-c', command.replace(template, join(dir, '.war/gate-t1.XXXXXX'))], { encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr)
      return join(r.stdout.trim(), 'gate.log')
    }
    const old = allocate(), fresh = allocate()
    assert.notEqual(old, fresh)
    writeFileSync(old, 'tip_sha: deadbeef\n')
    writeFileSync(fresh, 'tip_sha: deadbeef\ncurrent run RED\nexit_code: 1\n')
    // A previous background process finally exits green at the same SHA.
    writeFileSync(old, 'old run GREEN\nexit_code: 0\n', { flag: 'a' })
    assert.equal(readFileSync(fresh, 'utf8'), 'tip_sha: deadbeef\ncurrent run RED\nexit_code: 1\n')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

for (const kind of ['nonexistent', 'ambiguous', 'abbreviated']) for (const repair of [false, true]) {
  test('Git-backed audit approval: ' + kind + ', repair=' + repair, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-pin-proof-'))
    const gitResult = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    const git = (...args) => { const r = gitResult(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    try {
      git('init', '-b', 'task'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'a'), 'actual task'); git('add', 'a'); git('commit', '-m', 'task')
      let tip = git('rev-parse', 'HEAD'), reported = kind === 'nonexistent' ? 'deadbeef' : tip.slice(0, 10)
      if (kind === 'ambiguous') {
        // Fixed real Git commit objects sharing a seven-digit prefix. Revalidate their
        // actual IDs in Git; the test never mines a fresh collision at runtime.
        assert.equal(git('rev-parse', 'HEAD^{tree}'), "b60b822872295187c5f548f6efb1a3d5ef55501c")
        const objects = [
        {
                "body": "tree b60b822872295187c5f548f6efb1a3d5ef55501c\nauthor Fixture <fixture@example.invalid> 1 +0000\ncommitter Fixture <fixture@example.invalid> 1 +0000\n\ncollision 8366\n",
                "sha": "385b7374ca58a448e5ef8c2bed35827ed7ace683"
        },
        {
                "body": "tree b60b822872295187c5f548f6efb1a3d5ef55501c\nauthor Fixture <fixture@example.invalid> 1 +0000\ncommitter Fixture <fixture@example.invalid> 1 +0000\n\ncollision 12861\n",
                "sha": "385b7375d0d573234748c255bbae40d176630e62"
        }
]
        for (const object of objects) {
          const r = spawnSync('git', ['hash-object', '-t', 'commit', '-w', '--stdin'], { cwd: dir, input: object.body, encoding: 'utf8' })
          assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim(), object.sha)
        }
        assert.notEqual(objects[0].sha, objects[1].sha)
        assert.equal(objects[0].sha.slice(0, 7), objects[1].sha.slice(0, 7))
        tip = objects[1].sha; reported = tip.slice(0, 7); git('update-ref', 'refs/heads/task', tip)
      }
      assert.equal(gitResult('rev-parse', '--verify', reported + '^{commit}').status === 0, kind === 'abbreviated')
      let panels = 0
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: [{ ...SINGLE_TASK[0], branch: 'task', worktree: dir }] }), (p, o) => {
        if (isWorker({ opts: o })) return { status: 'implemented', task_id: 't1', head_sha: reported }
        if (o.label === 'audit:t1:correctness') return seatAt(o.label, 'correctness', ++panels > 1 && repair ? tip : reported)
        return defaultImpl(p, o)
      }, { rawTaskAuditPins: true, 'audit-pin': p => {
        const branch = p.match(/resolve branch (\S+) with git/)[1]
        return { head_sha: git('rev-parse', '--verify', branch + '^{commit}'), pins: fixturePinRequest(p).map(value => {
          if (typeof value !== 'string' || !/^[0-9a-f]{7,40}$/.test(value)) return null
          const r = gitResult('rev-parse', '--verify', '--end-of-options', value + '^{commit}')
          return r.status === 0 ? r.stdout.trim() : null
        }) }
      } })
      assert.equal(out.landed.includes('t1'), kind === 'abbreviated' || repair)
      assert.equal(calls.filter(c => c.opts.dispatchKind === 'audit-pin').length, kind === 'abbreviated' ? 1 : 2)
      assert.ok(out.auditLog.some(r => r.headSha === tip), 'full Git identity retained as review evidence')
      assert.equal(git('rev-parse', 'task'), tip, 'verification never mutates Git')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

for (const scenario of ['sibling-after-reverted-owner', 'sibling-before-reverted-owner', 'tagged-revert-beside-sibling', 'unowned-overlap', 'owned-revision', 'earlier-owned-path-lost', 'later-owned-path-lost', 'restored-path-lost', 'restored-path-preserved', 'restored-path-only', 'unowned-empty-bookkeeping', 'unowned-late-contribution', 'tagged-merge-only-loss', 'owned-cancelled-beside-earlier-sibling', 'owned-cancelled-alone']) {
  test('recovery owned footprint: ' + scenario, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-owned-footprint-'))
    const git = (...args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    const commit = (message, owner = 'task') => { git('add', '-A'); git('commit', '-m', message + (owner ? '\n\nWAR-Task: ' + owner : '')); return git('rev-parse', 'HEAD') }
    const put = (path, body) => writeFileSync(join(dir, path), body)
    try {
      git('init', '-b', 'working'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      put('base', 'base'); if (scenario === 'unowned-overlap') put('deliverable', 'base\nbase\n'); commit('base', null); git('checkout', '-b', 'integration')
      if (scenario.startsWith('restored-path')) { put('obsolete', 'sibling file'); commit('sibling addition', 'other-task') }
      if (['sibling-before-reverted-owner', 'owned-cancelled-beside-earlier-sibling'].includes(scenario)) { put('sibling', 'unrelated'); commit('sibling before task', 'other-task') }
      git('checkout', '-b', 'task')
      if (scenario.startsWith('restored-path')) git('rm', 'obsolete')
      if (scenario !== 'restored-path-only') put('deliverable', 'owned\nbase\n')
      const first = commit('owned work')
      if (['sibling-after-reverted-owner', 'tagged-revert-beside-sibling'].includes(scenario)) { put('sibling', 'unrelated'); commit('sibling after task', 'other-task') }
      if (scenario.includes('reverted-owner') || scenario === 'tagged-revert-beside-sibling' || scenario.startsWith('owned-cancelled-')) {
        git('revert', '--no-edit', first)
        if (scenario === 'tagged-revert-beside-sibling' || scenario.startsWith('owned-cancelled-')) git('commit', '--amend', '-m', 'revert owned work\n\nWAR-Task: task')
      }
      if (scenario === 'unowned-overlap') {
        put('deliverable', 'owned\nsibling\n'); commit('unowned overlap', 'other-task')
        put('deliverable', 'base\nsibling\n'); commit('owned work cancelled beside sibling')
      }
      if (scenario === 'owned-revision') { put('deliverable', 'revised owned work'); commit('owned revision') }
      if (scenario.endsWith('owned-path-lost')) { put('second', 'second owned path'); commit('second owned change') }
      if (scenario === 'unowned-empty-bookkeeping') git('commit', '--allow-empty', '-m', 'bookkeeping')
      if (scenario === 'unowned-late-contribution') { put('unowned', 'uncertain contribution'); commit('unowned later work', 'other-task') }
      if (scenario === 'tagged-merge-only-loss') {
        git('checkout', '-b', 'side'); put('side-work', 'owned side work'); commit('owned side')
        git('checkout', 'task'); put('main-work', 'owned main work'); commit('owned main')
        git('merge', '--no-ff', '--no-commit', 'side'); put('merge-only', 'required resolution'); commit('owned merge')
      }
      git('checkout', 'integration'); gitTaskMerge((...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }), 'task', 'task')
      if (scenario === 'tagged-merge-only-loss') { git('rm', 'merge-only'); commit('lose merge resolution', 'other-task') }
      if (scenario === 'earlier-owned-path-lost') { git('rm', 'deliverable'); commit('later loss', 'other-task') }
      if (scenario === 'later-owned-path-lost') { git('rm', 'second'); commit('later loss', 'other-task') }
      if (scenario === 'restored-path-lost') { put('obsolete', 'sibling file'); commit('undo task deletion', 'other-task') }
      // The merge commit owns the whole task branch (#2485 D14): sibling-trailered, untrailered and
      // reverting commits inside it no longer refuse, and a net-zero task proves. Only owned-path
      // content lost at integration after the merge still refuses.
      const preserved = !['earlier-owned-path-lost', 'later-owned-path-lost', 'restored-path-lost', 'tagged-merge-only-loss'].includes(scenario)
      const r = spawnSync('bash', [join(here, 'task-integrated.sh'), 'task', 'integration', 'working'], { cwd: dir, encoding: 'utf8' })
      assert.equal(r.status, preserved ? 0 : 1, r.stdout + r.stderr)
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, recovery: { sanctioned: true } }), barrierEnv({ ok: true, preMerged: r.status === 0 ? ['t1'] : [] }))
      assert.equal(calls.some(c => c.opts.label === 'work:t1'), !preserved)
      assert.equal(out.auditLog.some(row => row.verdict === 'recovered:pre-merged'), preserved)
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

test('2485/ES12 real git: a staged index refuses the range revert (INDEX-DIRTY) with no commit, a clean index releases it, and an unstaged edit on an untouched file never blocks it', async () => {
  const repo = rangeRevertRepo(), { dir, git, approved } = repo
  try {
    const { runScript } = await captureRangeRevertScript(repo)
    const preRevertTip = git('rev-parse', 'HEAD'), approvedTree = git('rev-parse', approved + '^{tree}')
    // The seats' case: a foreign file staged by a dead or rogue ace worker (the dead-attempt
    // `git checkout -- .` restores the worktree FROM the index, so staged content survives it).
    // `revert --no-commit` would fold it into the engine commit; the gate refuses before the revert.
    writeFileSync(join(dir, 'z.js'), 'smuggled'); git('add', 'z.js')
    let run = runScript()
    assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /INDEX-DIRTY/); assert.doesNotMatch(run.stdout, /RANGE-REVERTED/)
    assert.equal(git('rev-parse', 'HEAD'), preRevertTip, 'no revert commit: HEAD is unchanged')
    assert.ok(!git('ls-tree', '--name-only', 'HEAD').split('\n').includes('z.js'), 'no commit carries the staged file')
    assert.equal(git('diff', '--cached', '--name-only'), 'z.js', 'the staged content is left in place for a human, never discarded')
    // The mirror arm: a staged edit to a file INSIDE the range is refused the same way.
    git('rm', '-q', '--cached', 'z.js'); rmSync(join(dir, 'z.js'))
    writeFileSync(join(dir, 'x.js'), 'staged edit'); git('add', 'x.js')
    run = runScript()
    assert.match(run.stdout, /INDEX-DIRTY/); assert.doesNotMatch(run.stdout, /RANGE-REVERTED/); assert.equal(git('rev-parse', 'HEAD'), preRevertTip)
    // The release: a path checkout (never --hard) cleans the index, and the same script reverts. The
    // boundary the gate must not cross rides along: an UNSTAGED edit to a tracked file the range never
    // touched is not index content, so the revert proceeds, commits the approved tree, and the edit stays.
    git('checkout', '-q', 'HEAD', '--', 'x.js'); writeFileSync(join(dir, 'w.js'), 'unstaged edit')
    run = runScript()
    assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /RANGE-REVERTED/)
    assert.equal(git('rev-parse', 'HEAD^'), preRevertTip, 'one forward commit on top of the range')
    assert.equal(git('rev-parse', 'HEAD^{tree}'), approvedTree, 'the revert tree equals the last approved tree')
    assert.equal(git('log', '-1', '--format=%(trailers:key=WAR-Task,valueonly)'), 'task')
    assert.equal(readFileSync(join(dir, 'w.js'), 'utf8'), 'unstaged edit'); assert.equal(git('diff', '--name-only'), 'w.js', 'the unstaged edit is untouched, in the worktree only')
    assert.equal(spawnSync('git', ['diff', '--cached', '--quiet', 'HEAD'], { cwd: dir }).status, 0, 'and nothing is staged after the commit')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES6 real git: the exact dispatched merge spelling makes one --no-ff merge commit over [snapshot base, rebased tip] with the exact trailer, and the engine confirms it (A2)', async () => {
  const repo = es6Repo()
  try {
    let command = null
    const { out, calls, base, facts } = await es6Phase(repo, p => { command = mergeCommandOf(p); rebaseTask(repo); bash(repo.dir, command) })
    assert.equal(command, 'git -c core.hooksPath=/dev/null merge --no-ff --no-commit task && git -c core.hooksPath=/dev/null commit --no-verify -m "Merge WAR task t1 (task)" --trailer "WAR-Task: task"', 'the dispatched spelling, byte for byte')
    assert.ok(out.landed.includes('t1'), JSON.stringify(out.escalated))
    assert.ok(out.auditLog.some(r => r.verdict === 'git-confirmed:merged' && r.site === 'merge:t1'), 'confirmMerge accepts the merge commit')
    assert.ok(!calls.some(c => c.opts.dispatchKind === 'merge-reconcile'), 'no reconciliation: the reply is confirmed outright')
    const f = facts()
    assert.deepEqual(f.parents, [base(), repo.git('rev-parse', 'task')], 'parents are [snapshot base, rebased task tip]')
    assert.equal(f.base_is_ancestor, true); assert.equal(f.tree.target, f.tree.source, 'the merge tree is the task tree')
    assert.equal(f.trailer.replace(/\n+$/, ''), 'WAR-Task: task', 'one exact WAR-Task trailer')
    const confirm = calls.find(c => c.opts.label === 'git-confirm:merge:t1')
    assert.equal(runTrailerRead(repo, confirm.prompt), 'WAR-Task: task', 'the dispatched trailer read runs in bash and reads the exact trailer')
    assert.equal(repo.remote(), repo.git('rev-parse', 'integration'))
  } finally { rmSync(repo.dir, { recursive: true, force: true }) }
})

test('2485/ES8 real git: a gate_sha that differs from the merge commit second parent yields the sentinel gateHeadSha in the confirm and reconcile arms; a matching gate_sha is kept', async () => {
  const SENTINEL = '(integration_sha unrecorded/malformed)'
  for (const [why, opts, want] of [['confirm match', {}, 'tip'], ['confirm mismatch', { gateSha: 'base' }, SENTINEL], ['reconcile mismatch', { gateSha: 'base', throwAfterPush: true }, SENTINEL]]) {
    const repo = es6Repo()
    try {
      const base = repo.git('rev-parse', 'integration')
      const { out, calls } = await es6Phase(repo, p => { rebaseTask(repo); bash(repo.dir, mergeCommandOf(p)) }, { ...opts, gateSha: opts.gateSha && base })
      assert.ok(out.landed.includes('t1'), why + ': the task never holds on the gate_sha check')
      assert.equal(repo.git('rev-parse', 'integration^1'), base, why + ': the reported gate_sha is a real commit, the first parent, never the second')
      assert.equal(gateHeadShaOf(evPromptOf(calls), 't1'), want === 'tip' ? repo.git('rev-parse', 'integration^2') : want, why)
    } finally { rmSync(repo.dir, { recursive: true, force: true }) }
  }
})

// ES13 field shape (the Aligned recovery): the pin-transfer probe already rebased the task branch, so merge
// step (a) is a no-op, and the gate needs a dependency a sibling merged. Real git, the dispatched spellings.
test('2485/ES13 field shape: probe rebases, step (a) is a no-op, the gate needs a sibling dependency — the step (a) clause re-runs provision by the tree and the gate goes green', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-2485-es13-'))
  const run = (cwd, cmd) => spawnSync('bash', ['-c', cmd], { cwd, encoding: 'utf8' })
  const ok = (cwd, cmd) => { const r = run(cwd, cmd); assert.equal(r.status, 0, cmd + '\n' + r.stderr); return r.stdout.trim() }
  try {
    const step = 'mkdir -p vendor && for d in $(cat deps 2>/dev/null); do touch "vendor/$d"; done'
    const gate = 'test -f vendor/lib'
    const { calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, run: { provision: [step], provisionSource: 'ci' } }), defaultImpl)
    const prov = calls.find(c => c.opts.label === 'provision-run:t1').prompt
    const merge = calls.find(c => c.opts.label === 'merge:t1').prompt
    // Step (a) order: the re-run clause sits after the rebase-or-skip step and before (b) and every floor.
    const a = merge.indexOf('(a) REBASE'), clause = merge.indexOf('PROVISION RE-RUN'), b = merge.indexOf('(b) MERGE'), floor = merge.indexOf('assert-no-submodule-mutation.sh')
    assert.ok(a !== -1 && a < clause && clause < b && clause < floor, 'the clause follows step (a) and precedes (b) and the floors')
    const clauseText = merge.slice(clause)
    assert.ok(clauseText.includes('  1. ' + step), 'the clause lists the run.provision step verbatim')
    // A repo: integration at base, the task worktree provisioned (marker written) at base.
    const repo = join(dir, 'repo'), wt = join(dir, 'task-wt')
    mkdirSync(repo)
    ok(repo, "git init -q -b integration && git config user.name F && git config user.email f@example.invalid && printf 'vendor/\\n' > .gitignore && git add .gitignore && git commit -qm base")
    ok(repo, `git worktree add -q -b task ${wt} integration`)
    ok(wt, "printf 'x\\n' > own && git add own && git commit -qm task")
    ok(wt, step); ok(wt, markerWriterOf(prov))
    assert.equal(run(wt, markerTestOf(clauseText)).status, 0, 'the marker test reads the provisioned tree')
    // A sibling lands a dependency on integration; the pin-transfer probe rebases the task branch.
    ok(repo, "printf 'lib\\n' > deps && git add deps && git commit -qm sibling")
    ok(wt, 'git rebase -q integration')
    // Merge step (a): the merge-base test says the rebase is already done — a no-op.
    assert.equal(run(wt, 'git merge-base --is-ancestor integration task').status, 0, 'step (a) skips: the probe already rebased')
    assert.notEqual(run(wt, gate).status, 0, 'without a re-run the gate is red: the sibling dependency is not provisioned')
    // The clause: the tree differs from the marker, so the steps re-run, then the marker is rewritten.
    assert.notEqual(run(wt, markerTestOf(clauseText)).status, 0, 'the marker test sees the changed tree though step (a) did nothing')
    ok(wt, step); ok(wt, markerWriterOf(clauseText))
    assert.equal(run(wt, gate).status, 0, 'after the tree-keyed re-run the gate is green')
    assert.equal(run(wt, markerTestOf(clauseText)).status, 0, 'the rewritten marker names the gated tree')
    assert.equal(ok(wt, 'git status --porcelain'), '', 'the marker never dirties the worktree')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
