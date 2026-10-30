// Real-git boundary tests: merges, reverts, probes and fixtures that spawn git (part 2 of 6)
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


// Reporter-format premise pin (round-3 fix-forward adjudication): the enumeration-conditional above
// rests on a factual premise about this repo's own gate output — a piped `node --test` run reports
// test TITLES plus an aggregate summary and never enumerates test file paths (Lead-verified against a
// captured gate log: 0 path hits while the file's own tests were green in the same log). Pin the
// premise LIVE against the actual runner on the current Node, not by fixture prose: generate a real
// node-format log and grep it exactly the way a seat would. If this test ever reds because the piped
// reporter began enumerating paths, the premise changed — revisit the enumeration-conditional in
// mappedTestsLine/authMappedLine and war-auditor.md's checklist bullet (the HARD trigger could widen).
test('reporter-format premise (D7, round-3): a piped node --test run emits titles + aggregate summary WITHOUT the test file path — a zero-hit grep for a .mjs mapped path proves nothing about whether its suite ran', () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-node-reporter-premise-'))
  const mjsMappedPath = join(dir, 'wibble.premise.test.mjs')
  try {
    writeFileSync(mjsMappedPath, "import { test } from 'node:test'\nimport assert from 'node:assert'\ntest('premise-pin sentinel title', () => { assert.equal(1, 1) })\n")
    // Strip the parent runner's NODE_TEST_CONTEXT: the gate invokes node --test TOP-LEVEL (piped), and
    // an inherited child-v8 context would silence the child's human-format stdout entirely — the probe
    // must reproduce the gate's own invocation shape, not this suite's runner-child shape.
    const env = { ...process.env }
    delete env.NODE_TEST_CONTEXT
    // D7 premise-probe hardening (#1343-4/6): bounded (timeout) and loud on env trouble — a spawn
    // failure or a wedged child (run.error: ENOENT, ETIMEDOUT kill, …) is its OWN named condition,
    // never allowed to impersonate a reporter-format premise change via a bare status assert.
    const run = spawnSync(process.execPath, ['--test', mjsMappedPath], { encoding: 'utf8', env, timeout: 60_000 })
    const log = (run.stdout || '') + (run.stderr || '')
    assert.ok(!run.error, `premise probe failed to spawn or wedged — a spawn/env failure, NOT a premise change: ${run.error}`)
    assert.equal(run.status, 0, `the premise fixture suite is green (presence guard — the run below provably executed); got status ${run.status}, stderr tail: ${(run.stderr || '').slice(-200)}`)
    assert.ok(log.includes('premise-pin sentinel title'), 'the piped reporter emits test TITLES — the suite provably ran and is visible in the log')
    assert.match(log, /tests 1\b/, '…plus the aggregate summary')
    assert.ok(!log.includes('wibble.premise.test.mjs'),
      'PREMISE: the piped node reporter does NOT enumerate test file paths — the .mjs mapped-path grep yields zero hits even though the suite provably ran, so absence-from-log is a non-enumerating-half SOFT cannot-confirm, never the HARD trigger')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

// Normal replies must establish Git state just as a lost reply must. These fixtures return raw
// MergeResults and obtain confirmation from actual local/remote refs, independently of the engine.
for (const site of ['task', 'land']) for (const shape of ['minimal', 'nonexistent', 'wrong-tip', 'valid', 'false-failure', 'whitespace', 'false-failure-whitespace']) {
  test('normal merge Git certainty: real ' + site + ' ' + shape, async () => {
    const dir = mkdtempSync(join(tmpdir(), 'war-normal-merge-'))
    const run = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
    const git = (...args) => { const r = run(...args); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
    const target = site === 'land' ? 'working' : 'integration', source = site === 'land' ? 'integration' : 'task'
    try {
      git('init', '-b', target); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid')
      writeFileSync(join(dir, 'base'), 'base'); git('add', 'base'); git('commit', '-m', 'base'); const base = git('rev-parse', 'HEAD')
      git('init', '--bare', join(dir, 'origin.git')); git('remote', 'add', 'origin', join(dir, 'origin.git')); git('push', 'origin', target)
      git('checkout', '-b', source); writeFileSync(join(dir, 'own.test.js'), shape.includes('whitespace') ? 'module.exports = \"accepted task\"' : 'accepted task'); git('add', 'own.test.js'); git('commit', '-m', 'accepted task'); const tip = git('rev-parse', 'HEAD'); git('checkout', target)
      const patch = () => { const r = spawnSync('git', ['patch-id', '--stable'], { input: git('diff', base, source) + '\n', encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.split(' ')[0] }
      const before = { base_sha: base, remote_sha: base, source_sha: tip, patch_id: patch(), content_id: fixtureContentId(dir, base, source) }
      const label = site === 'land' ? 'land:phase-3' : 'merge:t1'
      const merge = p => { if (site === 'land') git('merge', '--no-ff', source, '-m', 'merge'); else gitTaskMerge(run, source, branchOfPrompt(p)); git('push', 'origin', target) }
      let confirmed = 0, recovered = 0, reported
      const { out, calls } = await runPhase(PROVISION_ARGS({ tasks: SINGLE_TASK, run: { roundLimit: 2 } }), (p, o) => {
        if (o.label === label) {
          if (shape.includes('whitespace')) { git('checkout', source); writeFileSync(join(dir, 'own.test.js'), 'module.exports = \"accepted  task\"'); git('add', 'own.test.js'); git('commit', '-m', 'whitespace mutation'); git('checkout', target) }
          if (shape === 'valid' || shape === 'false-failure' || shape.includes('whitespace')) merge(p)
          const head = git('rev-parse', target)
          reported = { mode: site === 'land' ? 'land-phase' : 'merge-task', status: shape.startsWith('false-failure') ? 'gate_failed' : site === 'land' ? 'landed' : 'merged' }
          if (shape !== 'minimal') reported[site === 'land' ? 'working_sha' : 'integration_sha'] = shape === 'nonexistent' ? 'deadbeef' : shape === 'wrong-tip' ? tip : head.slice(0, 10)
          return reported
        }
        return defaultImpl(p, o)
      }, { rawMergeResults: true,
        'merge-snapshot': (p, o) => o.label === (site === 'land' ? 'git-snapshot:phase-3' : 'git-snapshot:t1') ? before : NEW_SEAT_DEFAULTS['merge-snapshot'],
        'merge-confirm': (p, o) => {
          if (o.label !== 'git-confirm:' + label) return NEW_SEAT_DEFAULTS['merge-confirm'](p)
          confirmed++
          const claimed = reported[site === 'land' ? 'working_sha' : 'integration_sha']
          const resolved = typeof claimed === 'string' ? run('rev-parse', '--verify', '--end-of-options', claimed + '^{commit}') : null
          return { local_sha: git('rev-parse', target), remote_sha: git('--git-dir=' + join(dir, 'origin.git'), 'rev-parse', target), source_tip: git('rev-parse', source), reported_sha: resolved?.status === 0 ? resolved.stdout.trim() : null,
            base_is_ancestor: run('merge-base', '--is-ancestor', base, target).status === 0, patch_id: patch(), content_id: fixtureContentId(dir, base, source), parents: git('show', '-s', '--format=%P', target).split(' '),
            ...(site === 'task' ? gitTaskFacts(run, base, source, target) : {}) }
        },
        'merge-reconcile': (p, o) => {
          assert.ok(o.label.startsWith('git-reconcile:' + label), 'only the uncertain target is maintained')
          recovered++
          const local = git('rev-parse', target), remote = git('--git-dir=' + join(dir, 'origin.git'), 'rev-parse', target)
          if (!shape.startsWith('false-failure')) return { outcome: 'unmerged', ...before, source_tip: git('rev-parse', source), patch_id: patch(), content_id: fixtureContentId(dir, base, source), local_sha: local, remote_sha: remote }
          return { outcome: site === 'land' ? 'landed' : 'merged', ...before, content_id: fixtureContentId(dir, base, source), local_sha: local, remote_sha: remote, source_tip: git('rev-parse', source), base_is_ancestor: run('merge-base', '--is-ancestor', base, target).status === 0,
            parents: git('show', '-s', '--format=%P', target).split(' '), ...(site === 'task' ? gitTaskFacts(run, base, source, target) : {}),
            result: { mode: site === 'land' ? 'land-phase' : 'merge-task', status: site === 'land' ? 'landed' : 'merged', [site === 'land' ? 'working_sha' : 'integration_sha']: local, gate_log_path: fixtureGatePath(p) } }
        },
      })
      if (shape.includes('whitespace')) assert.equal(patch(), before.patch_id, 'stable patch IDs cannot distinguish significant whitespace in a string literal')
      const success = shape === 'valid' || shape === 'false-failure'
      assert.equal(site === 'land' ? out.landDecision === 'landed' : out.landed.includes('t1'), success, 'completion follows actual Git')
      assert.equal(confirmed, 1, 'every normal reply gets fresh Git confirmation')
      assert.equal(recovered, shape === 'valid' ? 0 : shape.includes('whitespace') ? 2 : 1, 'only unconfirmed reports need maintenance')
      if (!success) assert.ok(!calls.some(isServitor), 'no completed-phase wrap-up after unproved success')
      else assert.equal(git('--git-dir=' + join(dir, 'origin.git'), 'show', target + ':own.test.js'), 'accepted task')
      if (shape === 'false-failure' && site === 'land') assert.equal(git('rev-list', '--count', '--merges', target), '1', 'no duplicate phase commit')
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
}

test('exact Git diff identity never accepts a failed Git read as an empty diff', () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-exact-diff-error-'))
  try {
    const failed = spawnSync('bash', ['-c', exactGitDiffRecipe, 'git-content-id', 'missing-base', 'missing-tip'], { cwd: dir, encoding: 'utf8' })
    assert.notEqual(failed.status, 0, 'hash-object succeeding on empty input cannot hide the upstream Git failure')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('2485/ES12 real git: a non-descendant tip reads NOT-DESCENDANT before any index check, a reverted index that is not the approved tree is never committed (TREE-MISMATCH), and the replay refuses it (INDEX-DIRTY)', async () => {
  const repo = rangeRevertRepo(), { dir, git } = repo
  try {
    const { runScript } = await captureRangeRevertScript(repo)
    const preRevertTip = git('rev-parse', 'HEAD')
    // A root that does not descend from the approved tip, with a dirty index on top: the history arm
    // wins over the worktree arm (NOT-DESCENDANT is the merge-slot backstop's row, INDEX-DIRTY is not).
    git('checkout', '-q', '--orphan', 'other'); git('commit', '-q', '-m', 'foreign root')
    writeFileSync(join(dir, 'z.js'), 'staged'); git('add', 'z.js')
    let run = runScript()
    assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /NOT-DESCENDANT/); assert.doesNotMatch(run.stdout, /RANGE-REVERTED|INDEX-DIRTY/)
    assert.equal(git('rev-parse', 'HEAD^{tree}'), git('rev-parse', preRevertTip + '^{tree}'), 'nothing committed above the foreign root')
    git('rm', '-q', '--cached', 'z.js'); rmSync(join(dir, 'z.js')); git('checkout', '-q', 'task'); assert.equal(git('rev-parse', 'HEAD'), preRevertTip)
    // TREE-MISMATCH: from a clean index a linear range revert always rebuilds the approved tree, so the
    // arm is reached through a PATH shim that lies about `write-tree` alone — every other verb, and
    // every oracle below, is real git. A deleted tree check would commit and print RANGE-REVERTED here.
    const bin = join(dir, 'bin'); mkdirSync(bin)
    const realGit = spawnSync('which', ['git'], { encoding: 'utf8' }).stdout.trim()
    writeFileSync(join(bin, 'git'), '#!/bin/sh\nfor a in "$@"; do [ "$a" = write-tree ] && { echo 0000000000000000000000000000000000000000; exit 0; }; done\nexec ' + JSON.stringify(realGit) + ' "$@"\n', { mode: 0o755 })
    run = runScript({ PATH: bin + ':' + process.env.PATH })
    assert.equal(run.status, 0, run.stderr); assert.match(run.stdout, /TREE-MISMATCH/); assert.doesNotMatch(run.stdout, /RANGE-REVERTED/)
    assert.equal(git('rev-parse', 'HEAD'), preRevertTip, 'no commit: HEAD is unchanged')
    assert.equal(spawnSync('git', ['diff', '--cached', '--quiet', 'HEAD'], { cwd: dir }).status, 1, 'the reverted index is staged, not committed')
    // The replay without the shim: the staged revert result is refused, never blindly committed.
    run = runScript()
    assert.match(run.stdout, /INDEX-DIRTY/); assert.doesNotMatch(run.stdout, /RANGE-REVERTED/); assert.equal(git('rev-parse', 'HEAD'), preRevertTip)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// Positive control for es6Phase's merge-reconcile handler: a correct merge whose reply is lost after the
// push reaches reconciliation and is accepted, so each refusal below depends on its predicate clause.
test('2485/ES6 real git: a correct merge whose reply is lost after the push reaches merge-reconcile and is recorded git-reconciled:merged (positive control)', async () => {
  const repo = es6Repo()
  try {
    const { out, calls } = await es6Phase(repo, p => { rebaseTask(repo); bash(repo.dir, mergeCommandOf(p)) }, { throwAfterPush: true })
    assert.ok(calls.some(c => c.opts.dispatchKind === 'merge-reconcile'), 'the lost reply enters reconciliation')
    assert.equal(runTrailerRead(repo, calls.find(c => c.opts.dispatchKind === 'merge-reconcile').prompt), 'WAR-Task: task', 'the reconcile prompt\'s trailer read runs in bash and reads the exact trailer')
    assert.ok(out.auditLog.some(r => r.verdict === 'git-reconciled:merged' && r.site === 'merge:t1'), 'reconcileMerge accepts the correct merge commit')
    assert.ok(out.landed.includes('t1'), JSON.stringify(out.escalated))
  } finally { rmSync(repo.dir, { recursive: true, force: true }) }
})

test('2485/ES6 real git: an inexact WAR-Task trailer on the merge commit is refused by confirmMerge and reconcileMerge', async () => {
  const repo = es6Repo()
  try {
    const { out, calls, facts } = await es6Phase(repo, p => { rebaseTask(repo); bash(repo.dir, mergeCommandOf(p).replace('--trailer "WAR-Task: task"', '--trailer "War-Task: task"')) })
    const f = facts()
    assert.equal(f.trailer.replace(/\n+$/, ''), 'War-Task: task', 'git parses the trailer but the key is not exact')
    assert.equal(f.tree.target, f.tree.source); assert.equal(f.base_is_ancestor, true); assert.equal(f.parents[1], repo.git('rev-parse', 'task'), 'only the trailer clause fails')
    assertRefused(out, calls, 'inexact trailer')
  } finally { rmSync(repo.dir, { recursive: true, force: true }) }
})

test('2485/ES17 absorb-charge seed counts Ace-Charge on a merged task through its merge commit M^1..M^2', async () => {
  const { prompt, cmd } = await absorbReadOf()
  assert.ok(prompt.includes('a merged branch reads M^1..M^2 of its first-parent WAR-Task merge commit M'), 'the prompt names the merged-branch range')
  assert.match(refinerMd, /over `M\^1\.\.M\^2` of its first-parent `WAR-Task` merge commit `M` once merged/, 'the card names the same range')
  assert.ok(cmd.includes('rev-list --first-parent --merges "$tip..'), 'the merge walk is bounded below by the task tip')
  const { dir, git, run, commit } = absorbFixture()
  const branch = 'war/wtprov-a/p3-t1'
  try {
    git('checkout', '-b', branch)
    commit('one', 'ace one\n\nAce-Charge: t1:1'); commit('two', 'ace two\n\nAce-Charge: t1:2'); commit('fix', 'untrailered floor fix')
    // Unmerged: the integration..branch range carries the charges.
    assert.equal(highestFor(readCharges(cmd, dir, branch), 't1'), 2, 'an unmerged branch reads integration..branch')
    git('checkout', 'integration/wtprov-a/phase-3'); commit('sibling', 'sibling work')
    gitTaskMerge(run, branch, branch); commit('later', 'later sibling\n\nAce-Charge: t1:9')
    // Red baseline: the pre-#2485 range is empty once the branch is merged, so it seeds a plausible 0.
    assert.equal(git('log', "--format=%(trailers:key=Ace-Charge,valueonly)", 'integration/wtprov-a/phase-3..' + branch), '', 'the old range reads nothing on a merged branch')
    assert.equal(highestFor(readCharges(cmd, dir, branch), 't1'), 2, 'a merged branch reads M^1..M^2 of its merge commit, not the later first-parent commit')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
