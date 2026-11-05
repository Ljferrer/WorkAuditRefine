// Late defects fixed in the run — the ace stops blaming itself for what was there before (part 4)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 5.1 (D3/D4/D10/D11/D12/D14/D23, PIN-3/PIN-4/PIN-10/
// PIN-11/PIN-12/PIN-14/PIN-23): a red ace gate runs the gate once at the pre-ace tip and proceeds over
// ids that were red there too; a regressed ace re-audit asks a pre-ace probe per blocker before any
// revert; a merged baseline red becomes one behavior late defect per run; the sweep and terminal workers
// read the debt list; and a resolved null at the aceBisect subset and re-entry sites reads env-died.
import { test } from 'node:test'
import {
  assert,
  src,
  auditorMd,
  refinerMd,
  findingClassMd,
  runPhase,
  seatOf,
  isAuditor,
  isMergeTask,
  isAce,
  buildSeqImpl,
  ACE_ARGS,
  nit,
  approveWith,
  aceBase,
  reentryImpl,
  bWorker,
  bRegress,
  bApprove,
  SWEEP_ARGS,
  sweepBase,
  queuedAbsorb,
  CLS_ARGS,
  clsImpl,
  envMergeResult,
  polishPromptOf,
  demotionOf,
  terminalImpl,
  terminalCalls,
  isLateFixWorker,
  DEBT_IDS,
  DEBT_BASE,
  debtSeed,
} from './workflow-template.test-harness.mjs'

const labelOf = c => c.opts.label || ''
const kindOf = kind => c => c.opts.dispatchKind === kind
const shaIn = (prompt, re) => (String(prompt).match(re) || [])[1]
const logged = (logs, ...parts) => logs.some(l => typeof l === 'string' && parts.every(p => l.includes(p)))
const lateOk = base => (p, o) => o.dispatchKind === 'late-fix-worktree' ? { ok: true } : base(p, o)

// ---- (a) the ace base gate: AutoIndex record-split, a standing docker red ----
const DOCKER = 'docker build: record-split image'
const aceRed = (ids) => p => ({ gate_green: false, head_sha: shaIn(p, /at the ace tip ([0-9a-f]{7,40})/), gate_failing_ids: ids, gate_output: 'docker build failed: COPY src/ missing' })
const baseRed = (ids) => p => ({ gate_green: false, head_sha: shaIn(p, /at the pre-ace tip ([0-9a-f]{7,40})/), gate_failing_ids: ids, gate_output: 'docker build failed: COPY src/ missing' })
const recordSplit = () => buildSeqImpl({ 'ace:polish:t1:a1': [bWorker('ace00001')] }, aceBase([nit()]))

test('late-defect: ace base — record-split replay: a standing docker red at the pre-ace tip counts green, so the absorb aces and the task merges unreverted', async () => {
  const { out, calls, logs } = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseRed([DOCKER]) })
  const gate = calls.find(kindOf('ace-gate'))
  assert.ok(gate.prompt.includes('gate_failing_ids: [<each failing test id>]'), 'the ace gate check asks for the failing ids on red')
  const base = calls.filter(kindOf('ace-base-gate'))
  assert.equal(base.length, 1, 'one gate run at the pre-ace tip')
  const pre = shaIn(base[0].prompt, /at the pre-ace tip ([0-9a-f]{7,40})/)
  assert.ok(pre && pre !== 'ace00001', 'the base check names the pre-ace tip, never the ace tip')
  assert.equal(seatOf(base[0].opts), 'war-refiner')
  assert.ok(base[0].prompt.includes('worktree add --detach') && base[0].prompt.includes('Gate: make gate'), 'it runs the gate in a throwaway worktree at that tip')
  assert.ok(calls.some(c => isAuditor(c) && c.prompt.includes('ace00001')), 'the re-audit runs at the ace tip')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === 'tidy import' && a.sha === 'ace00001'), 'the absorb aces at the ace tip')
  assert.ok(!/FORWARD-REVERT/.test(calls.find(isMergeTask).prompt), 'nothing is forward-reverted')
  assert.ok(logged(logs, 'ace-gate t1: proceeds over [' + DOCKER + ']', 'red at the pre-ace tip ' + pre), 'the log names the proceed-over and the base')
  assert.ok(out.landed.includes('t1'))
  // Red at base: without the base arm the standing red forward-reverts the batch (the #2150 outcome).
  const arm = 'if (ids.length && isSha(g.head_sha) && !pinMismatch(g.head_sha, aceTipSha) && ids.every(id => baseIds.includes(id))) {'
  assert.ok(src.includes(arm), 'the mutation target is the live base arm')
  const mutant = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseRed([DOCKER]) }, src.replace(arm, 'if (false) {'))
  assert.ok(!(mutant.out.aced || []).length, 'the mutant aces nothing')
  assert.match(mutant.calls.find(isMergeTask).prompt, /FORWARD-REVERT/, 'and forward-reverts the ace tip')
})

test('late-defect: ace base — a new failing id, a dead base check and a red with no ids each keep the forward-revert', async () => {
  const reverts = async (seats, why) => {
    const { out, calls } = await runPhase(ACE_ARGS(), recordSplit(), seats)
    assert.ok(!(out.aced || []).length, why + ': nothing is aced')
    assert.match(calls.find(isMergeTask).prompt, /FORWARD-REVERT/, why + ': the ace tip is forward-reverted')
    assert.ok(out.landed.includes('t1'), why + ': the approved pre-ace tip still merges')
    return calls
  }
  const fresh = await reverts({ 'ace-gate': aceRed([DOCKER, 'test_split_offsets']), 'ace-base-gate': baseRed([DOCKER]) }, 'a new id')
  assert.equal(fresh.filter(kindOf('ace-base-gate')).length, 1, 'the base ran, and the new id still reverts (PIN-4)')
  await reverts({ 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': () => { throw new Error('socket hang up') } }, 'a dead base check')
  await reverts({ 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': p => ({ gate_green: true, head_sha: shaIn(p, /at the pre-ace tip ([0-9a-f]{7,40})/) }) }, 'a green base')
  const bare = await reverts({ 'ace-gate': aceRed(undefined), 'ace-base-gate': baseRed([DOCKER]) }, 'a red with no ids')
  assert.equal(bare.filter(kindOf('ace-base-gate')).length, 0, 'no ids, nothing to compare: no base run')
})

test('late-defect: ace base — the proceed-over needs the ace red to echo the ace tip: a red at another sha or with no echo still forward-reverts', async () => {
  const echo = 'isSha(g.head_sha) && !pinMismatch(g.head_sha, aceTipSha) && ids.every('
  assert.ok(src.includes(echo), 'the mutation target is the live echo clause')
  for (const [ace, why] of [[p => ({ ...aceRed([DOCKER])(p), head_sha: 'abcdef12' }), 'a mismatched head_sha'], [p => ({ ...aceRed([DOCKER])(p), head_sha: undefined }), 'no head_sha']]) {
    const seats = { 'ace-gate': ace, 'ace-base-gate': baseRed([DOCKER]) }
    const { out, calls } = await runPhase(ACE_ARGS(), recordSplit(), seats)
    assert.equal(calls.filter(kindOf('ace-base-gate')).length, 1, why + ': presence, the base ran and matched every id')
    assert.ok(!(out.aced || []).length, why + ': nothing is aced')
    assert.match(calls.find(isMergeTask).prompt, /FORWARD-REVERT/, why + ': the ace tip is forward-reverted')
    assert.ok(calls.find(kindOf('ace-gate')).prompt.includes('return { gate_green: false, head_sha: ace00001, gate_failing_ids: [<each failing test id>] }'), why + ': the red arm of the ace gate prompt asks for the echo')
    // Red at base: without the echo clause the red at another sha licenses the ace tip.
    const mutant = await runPhase(ACE_ARGS(), recordSplit(), seats, src.replace(echo, 'ids.every('))
    assert.ok((mutant.out.aced || []).length, why + ': the mutant aces over an unplaced red')
  }
})

test('late-defect: ace base — the base result is cached per pre-ace sha, so the re-entry gate reuses it', async () => {
  const impl = buildSeqImpl({ 'ace:polish:t1:a1': [bWorker('ace00001')], 'ace:reentry:t1:a2': [bWorker('ace00002')] }, reentryImpl())
  const { out, calls } = await runPhase(ACE_ARGS(), impl, { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseRed([DOCKER]) })
  assert.equal(calls.filter(kindOf('ace-gate')).length, 2, 'two red ace gates: the batch and the re-entry')
  assert.equal(calls.filter(kindOf('ace-base-gate')).length, 1, 'one base run serves both')
  const aced = (out.aced || []).map(a => a.finding && a.finding.title)
  assert.ok(aced.includes('first') && aced.includes('second'), 'both batches ace over the standing red')
})

// ---- (b) the pre-ace probe: Obelisks t1, a Nit noted by the first panel returns as a Major ----
const LOCK_ABSORB = nit({ title: 'cache key spelled twice', file: 'src/lock.js', disposition: 'absorb' })
const LOCK_NOTE = { severity: 'Nit', title: 'stale lock read', file: 'src/lock.js', rationale: 'the lock is read before the refresh', disposition: 'note' }
const LOCK_MAJOR = { severity: 'Major', title: 'stale lock read', file: 'src/lock.js', rationale: 'the lock is read before the refresh, so a second writer wins', suggested_fix: 'refresh the lock before the read' }
const obelisk = () => lateOk(buildSeqImpl({
  'audit:t1:correctness': [approveWith('audit:t1:correctness', [LOCK_ABSORB, LOCK_NOTE]),
    { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings: [LOCK_MAJOR] }],
  'ace:polish:t1:a1': [bWorker('ace00001')],
}, (p, o) => seatOf(o) === 'war-auditor' ? approveWith(o.label, []) : aceBase([])(p, o)))
const probeRun = (answer, source) => runPhase(ACE_ARGS(), obelisk(), { 'pre-ace-probe': answer }, source)
const regressed = out => ((demotionOf(out, LOCK_ABSORB.title) || {}).demoteReason || '').startsWith('demote:absorb-regressed')
const lateFixOf = calls => calls.filter(isLateFixWorker)

test('late-defect: probe — Obelisks t1 replay, yes: the blocker existed at the pre-ace tip, so the absorb stays aced and the blocker gets a late fix', async () => {
  const { out, calls, logs } = await probeRun({ exists: 'yes', evidence: 'src/lock.js:12 reads the lock before refresh() at the pre-ace tip' })
  const probes = calls.filter(kindOf('pre-ace-probe'))
  assert.deepEqual(probes.map(labelOf), ['pre-ace-probe:t1:1'], 'one probe seat for the one blocker')
  assert.equal(seatOf(probes[0].opts), 'war-auditor', 'a read-only auditor seat answers it')
  const pre = shaIn(probes[0].prompt, /at the pre-ace tip ([0-9a-f]{7,40})/)
  assert.ok(pre && pre !== 'ace00001' && probes[0].prompt.includes('before the ace commit ace00001'), 'it reads the pre-ace tip, not the ace tip')
  assert.ok(probes[0].prompt.includes('BLOCKER: 1. [Major] stale lock read (src/lock.js)'), 'the prompt names the blocker')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === LOCK_ABSORB.title && a.sha === 'ace00001'), 'the absorb stays aced at the ace tip (PIN-3)')
  assert.ok(!regressed(out), 'no absorb is forward-reverted for a defect it did not add')
  assert.ok(!/FORWARD-REVERT/.test(calls.find(isMergeTask).prompt), 'the ace tip merges')
  const lf = lateFixOf(calls)
  assert.deepEqual(lf.map(labelOf), ['late-fix:t1:r1'], 'the blocker joins the late-fix pass on the origin task')
  assert.ok(lf[0].prompt.includes(LOCK_MAJOR.title) && lf[0].prompt.includes(LOCK_MAJOR.suggested_fix), 'with its fix')
  assert.ok(logged(logs, 'late-fix pass: queued [Major] "stale lock read"', 'pre-ace probe: yes'), 'the queue log names the probe answer')
  assert.equal(out.landDecision, 'landed', 'the late fix lands with the phase')
  const pinOf = o => (o.pinTransfers || []).filter(t => t.mode === 'probe-cleared')
  const pin = pinOf(out)
  assert.equal(pin.length, 1, 'the probe-cleared approval writes one pinTransfers row')
  assert.deepEqual({ task: pin[0].task, kind: pin[0].kind, sha: pin[0].sha, seats: pin[0].seats.map(x => x.lens + '=' + x.outcome + '@' + x.sha) },
    { task: 't1', kind: 'ace', sha: 'ace00001', seats: ['correctness=re-ran@ace00001'] }, 'naming the ace sha and every seat')
  // Red at base: without the ledger call the approval is accounted with no row.
  const rec = "recordAceTransfer(r, aceSha, 'probe-cleared',"
  assert.ok(src.includes(rec), 'the mutation target is the live ledger call')
  assert.equal(pinOf((await probeRun({ exists: 'yes', evidence: 'x' }, src.replace(rec, "(() => {})(r, aceSha, 'probe-cleared',"))).out).length, 0, 'the mutant writes no row')
  // Red at base: without the probe the Major names the absorb's file as culprit and reverts it (the Obelisks outcome).
  const site = ': await preAceProbe(r, auditSeats, preAce, aceSha)'
  assert.ok(src.includes(site), 'the mutation target is the live probe call')
  const mutant = await probeRun({ exists: 'yes', evidence: 'x' }, src.replace(site, ': auditSeats'))
  assert.ok(regressed(mutant.out), 'the mutant forward-reverts the absorb')
  assert.equal(lateFixOf(mutant.calls).length, 0, 'and the Major gets no late fix')
})

test('late-defect: probe — no reverts as today; unknown, a malformed answer and a dead seat revert and still queue the blocker as a behavior late defect', async () => {
  const no = await probeRun({ exists: 'no', evidence: 'the ace commit added the early read' })
  assert.ok(regressed(no.out), 'no: the absorb is forward-reverted (today\'s culprit arm)')
  assert.equal(lateFixOf(no.calls).length, 0, 'no: the ace added it, the revert removes it, no late fix')
  for (const [answer, why] of [[{ exists: 'unknown', evidence: 'the read moved files' }, 'unknown'], [{ exists: 'maybe' }, 'malformed'], [() => { throw new Error('socket hang up') }, 'dead']]) {
    const { out, calls, logs } = await probeRun(answer)
    assert.ok(regressed(out), why + ': today\'s revert')
    assert.match(calls.find(isMergeTask).prompt, /FORWARD-REVERT/, why + ': the merge forward-reverts the ace tip')
    const lf = lateFixOf(calls)
    assert.deepEqual(lf.map(labelOf), ['late-fix:t1:r1'], why + ': the blocker still joins the late-fix pass (PIN-11)')
    assert.ok(lf[0].prompt.includes(LOCK_MAJOR.suggested_fix), why + ': with its fix')
    assert.ok(logged(logs, 'pre-ace probe: unknown'), why + ': it queues as unknown')
  }
})

// A wave-side probe row can name a task that later fails to merge on a soft route. The pass then
// demotes it, so no other task's budget fixes a defect that is not on the integration branch.
test('late-defect: probe — a yes row whose origin task never merges demotes demote:exclusion-set, and no other task gets its late fix', async () => {
  const two = ACE_ARGS({ finalPhase: false, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },
  ] })
  const impl = (base = obelisk()) => (p, o) => labelOf({ opts: o }) === 'merge:t1' ? (() => { throw new Error('socket hang up') })() : base(p, o)
  const run = source => runPhase(two, impl(), { 'pre-ace-probe': { exists: 'yes', evidence: 'there before' } }, source)
  const { out, calls, logs } = await run()
  assert.ok(logged(logs, 'pre-ace probe t1: "stale lock read"', '— yes'), 'presence: the probe answered yes')
  assert.ok(out.landed.includes('t2') && !out.landed.includes('t1'), 'presence: t1 died at its merge and t2 merged')
  assert.equal(lateFixOf(calls).length, 0, 'no late fix runs on t2 for t1\'s defect')
  const d = demotionOf(out, LOCK_MAJOR.title)
  assert.ok(d && d.demoteReason === 'demote:exclusion-set — origin task t1 did not merge; its relaunch re-audits it', 'the row demotes with the reason')
  assert.ok(!out.carriedTasks.some(t => t.title === LOCK_MAJOR.title), 'and is not carried under t2')
  // Red at base: without the arm the pass charges t2.
  const arm = 'if (own && !succeeded.has(own.id)) {'
  assert.ok(src.includes(arm), 'the mutation target is the live arm')
  const mutant = await run(src.replace(arm, 'if (false) {'))
  assert.deepEqual(lateFixOf(mutant.calls).map(labelOf), ['late-fix:t2:r1'], 'the mutant fixes t1\'s defect on t2\'s budget')
})

test('late-defect: probe — a clean re-audit dispatches no probe, and the auditor card points at the probe rules', async () => {
  const { calls } = await runPhase(ACE_ARGS(), buildSeqImpl({ 'ace:polish:t1:a1': [bWorker('ace00001')] }, aceBase([nit()])))
  assert.ok(calls.some(isAce), 'presence: the ace ran')
  assert.equal(calls.filter(kindOf('pre-ace-probe')).length, 0, 'an approving re-audit needs no probe')
  assert.match(auditorMd, /^When dispatched as a PRE-ACE PROBE, read \[finding-class\.md\]\([^)]*references\/finding-class\.md\) § Pre-ace probe/m, 'the card carries one trigger pointer to the probe rules')
  const rules = findingClassMd.slice(findingClassMd.indexOf('\n## Pre-ace probe\n'), findingClassMd.indexOf('\n## Moved from the auditor card\n'))
  for (const k of ["`{ exists: 'yes' | 'no' | 'unknown', evidence }`", '`yes`: the same defect is there at the pre-ace tip', '`no`: the ace commit added it', '`unknown`: git cannot settle it', 'git show <pre-ace sha>:<file>'])
    assert.ok(rules.includes(k), 'finding-class.md § Pre-ace probe names: ' + k)
  assert.ok(src.includes("{ exists: 'yes' | 'no' | 'unknown', evidence: '<the lines you read>' }"), 'the dispatched probe prompt asks the same shape')
})

test('late-defect: ace base — the refiner card and the dispatched prompt both ask for gate_failing_ids on a red ace gate', () => {
  assert.ok(refinerMd.includes('The ace gate check (`ace-gate`) and its pre-ace base check (`ace-base-gate`) change no branch; on red, return each failing test id in `gate_failing_ids`.'), 'the card names it')
  assert.equal(src.split('gate_failing_ids: [<each failing test id>]').length - 1, 2, 'the ace gate and the base check prompts both ask for it')
})

// ---- (c) baseline reds ----
const BASE_IDS = ['docker build: record-split image']
const baselineMerge = { mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: BASE_IDS, gate_base_sha: 'base9999', gate_output: 'red at the base too' }
const TWO = CLS_ARGS({ tasks: [
  { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
  { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
] })

test('late-defect: baseline — two tasks merged over one baseline red make ONE behavior late defect, whose merge never proceeds over the ids it fixes', async () => {
  const impl = lateOk(clsImpl({ mergeResult: label => /^merge:t\d$/.test(label) ? baselineMerge : { mode: 'merge-task', status: 'merged' } }))
  const { out, calls, logs } = await runPhase(TWO, impl)
  assert.ok(out.landed.includes('t1') && out.landed.includes('t2'), 'both tasks merge over the debt')
  const lf = lateFixOf(calls)
  assert.deepEqual(lf.map(labelOf), ['late-fix:t1:r1'], 'one late defect per run, on the first task merged over it')
  assert.ok(lf[0].prompt.includes('baseline gate red: ' + BASE_IDS[0]), 'the late-fix prompt names the red ids')
  assert.ok(logged(logs, 'late-fix pass: queued [Major] "baseline gate red: ' + BASE_IDS[0] + '" (baseline)'), 'queued from the baseline seat')
  const m = calls.find(c => labelOf(c) === 'merge:p3-latefix-1')
  assert.ok(m && !m.prompt.includes('BASELINE-PROCEED'), 'the baseline fix merge never proceeds over the debt it fixes')
  assert.equal(out.landDecision, 'landed', 'the fixed red lands')
  assert.equal((out.handoff.backstops || []).filter(b => b && b.source === 'auto').length, 1, 'the deduped backstop still records the debt')
})

test('late-defect: baseline — an environment red keeps its backstop route and makes no late defect', async () => {
  const { out, calls } = await runPhase(CLS_ARGS(), lateOk(clsImpl({ mergeResult: label => label === 'merge:t1' ? envMergeResult() : { mode: 'merge-task', status: 'merged' } })))
  assert.ok(calls.some(c => /:environment-proceed$/.test(labelOf(c))), 'presence: the environment-proceed re-merge ran')
  assert.equal(lateFixOf(calls).length, 0, 'an environment red has no in-repo fix (A6)')
  assert.equal(out.landDecision, 'landed')
})

test('late-defect: baseline — a baseline red first recorded at the land gate carries on a non-final phase and files on the final phase, naming why', async () => {
  const landRed = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['test_land_only'], gate_base_sha: 'landbase1', gate_output: 'red at origin too' })
  const why = 'found at the land gate after the late-fix pass'
  const nonFinal = await runPhase(CLS_ARGS({ finalPhase: false }), clsImpl({ landResult: landRed }))
  assert.equal(nonFinal.out.landDecision, 'landed', 'the baseline-proceed re-land lands')
  const row = nonFinal.out.carriedTasks.find(t => t.title === 'baseline gate red: test_land_only')
  assert.ok(row && row.findingClass === 'behavior' && row.task === 't1' && row.carriedFrom.reason === why, 'one carried behavior row under the merged task, with the reason')
  assert.ok(!demotionOf(nonFinal.out, row.title), 'carried, not filed')
  const final = await runPhase(CLS_ARGS(), clsImpl({ landResult: landRed }))
  const filed = demotionOf(final.out, 'baseline gate red: test_land_only')
  assert.ok(filed && filed.rationale.includes(why), 'the final phase files it with the reason')
  assert.ok(!final.out.carriedTasks.length, 'and carries nothing')
  assert.equal(lateFixOf(final.calls).length, 0, 'no late fix runs after the land gate')
})

test('late-defect: baseline — a land red on ids the per-task baseline row already took, at another base sha, adds no second row', async () => {
  const landRed = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: BASE_IDS, gate_base_sha: 'landbase1', gate_output: 'red at origin too' })
  const merge = label => label === 'merge:t1' ? baselineMerge : { mode: 'merge-task', status: 'merged' }
  const phase = (landResult, source) => runPhase(CLS_ARGS({ finalPhase: false }), lateOk(clsImpl({ mergeResult: merge, landResult })), {}, source)
  const rows = r => [...lateFixOf(r.calls).map(labelOf), ...r.out.carriedTasks.filter(t => /^baseline gate red: /.test(t.title)).map(t => 'carried:' + t.title), ...(r.out.minorsFiled || []).filter(m => /^baseline gate red: /.test(m.title)).map(m => 'filed:' + m.title)]
  const run = await phase(landRed)
  assert.ok(run.calls.some(c => /^land:.*baseline-proceed$/.test(labelOf(c))), 'presence: the land gate went red and re-landed over the debt')
  assert.deepEqual(rows(run), ['late-fix:t1:r1'], 'exactly one row: the per-task late fix, never a second carried row')
  // The mirror: an id the per-task row never took still carries.
  const fresh = await phase(() => ({ ...landRed(), gate_failing_ids: [...BASE_IDS, 'test_land_only'] }))
  assert.ok(fresh.out.carriedTasks.some(t => t.title === 'baseline gate red: ' + BASE_IDS[0] + ', test_land_only'), 'a new land id still carries')
  // The empty input: a land red with no ids is never covered, so it still carries.
  const noIds = await phase(() => ({ ...landRed(), gate_failing_ids: undefined }))
  assert.ok(noIds.out.carriedTasks.some(t => t.title === 'baseline gate red: (see gate_output)'), 'an id-less land red still carries')
  // The neighbor state: per-task debt whose baseline-proceed merge died queued no late row, so the
  // same ids red at the land gate still carry.
  const died = clsImpl({ mergeResult: merge, landResult: landRed })
  const untaken = await runPhase({ ...TWO, finalPhase: false }, lateOk((p, o) => labelOf({ opts: o }) === 'merge:t1:baseline-proceed' ? (() => { throw new Error('socket hang up') })() : died(p, o)))
  assert.ok(!untaken.out.landed.includes('t1') && untaken.out.landed.includes('t2'), 'presence: the baseline-proceed merge died and t2 merged')
  assert.equal(lateFixOf(untaken.calls).length, 0, 'presence: no per-task baseline row was queued')
  assert.ok(untaken.out.carriedTasks.some(t => t.title === 'baseline gate red: ' + BASE_IDS[0]), 'so the land red carries')
  // Red at base: the bare length test carries a duplicate.
  const site = '!(landIds.length && landIds.every(id => took.some(d => d.ids.includes(id))))'
  assert.ok(src.includes(site), 'the mutation target is the live guard')
  assert.equal(rows(await phase(landRed, src.replace(site, 'true'))).length, 2, 'the mutant adds a second row')
})

test('late-defect: baseline — the PHASE-CLOSE COHERENCE SWEEP and TERMINAL PASS workers carry the debt list, and a debt-free phase leaves both prompts unchanged', async () => {
  const head = 'KNOWN BASELINE GATE DEBT: a red on only these pre-existing ids is not yours, so still commit and push:\n  1. [' + DEBT_IDS.join(', ') + '] — pre-existing at ' + DEBT_BASE + '\n'
  const sweep = await runPhase(SWEEP_ARGS(), debtSeed(sweepBase([queuedAbsorb()])))
  assert.ok(polishPromptOf(sweep.calls).includes(head), 'the sweep worker reads the debt list')
  const bare = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  assert.ok(polishPromptOf(bare.calls) && !polishPromptOf(bare.calls).includes('KNOWN BASELINE GATE DEBT'), 'no debt, no clause')
  assert.equal(polishPromptOf(sweep.calls).replace(head, ''), polishPromptOf(bare.calls).replace(head, ''), 'the clause is the only byte the debt adds')
  const term = terminalCalls((await runPhase(SWEEP_ARGS(), debtSeed(terminalImpl()))).calls)
  assert.equal(term.length, 1, 'presence: the terminal pass ran')
  assert.ok(term[0].prompt.includes(head), 'the terminal worker reads the debt list')
  const termBare = terminalCalls((await runPhase(SWEEP_ARGS(), terminalImpl())).calls)
  assert.ok(!termBare[0].prompt.includes('KNOWN BASELINE GATE DEBT'), 'no debt, no terminal clause')
})

// ---- (d) the bisect guard: #2555 at the aceBisect subset and re-entry sites ----
const FA = nit({ title: 'culprit nit', file: 'skills/a.js' })
const FB = nit({ title: 'salvaged nit', file: 'skills/b.js' })
const subsetImpl = (subset) => buildSeqImpl({
  'audit:t1:correctness': [bApprove([FA, FB]), bRegress('skills/a.js'), bApprove()],
  'ace:polish:t1:a1': [bWorker('ace00001')],
  'ace:subset:t1:a2': [subset],
}, aceBase([FA, FB]))

test('late-defect: bisect guard — a resolved null at the subset dispatch is labeled env-died, never "worker returned no result"', async () => {
  const { out, calls, logs } = await runPhase(ACE_ARGS(), subsetImpl(null))
  assert.ok(calls.some(c => labelOf(c) === 'ace:subset:t1:a2'), 'presence: the subset dispatched')
  assert.ok(logged(logs, 'ace:subset:t1:a2 dispatch resolved null (env-died)'), 'the null is labeled env-died at the site')
  assert.ok(logged(logs, '"salvaged nit"', 'failed absorb — ace:subset:t1:a2 dispatch resolved null (env-died)', 'bisection abandoned'), 'the abandon reason carries the label')
  assert.ok(!logged(logs, 'worker returned no result'), 'never the HARD-sounding generic reason')
  assert.ok(out.landed.includes('t1'), 'the approved work still lands')
  // Red at base: without the guard the null reads blockedReason's generic text.
  const site = "deathOf(sw) || nullDied(sw, aceLabel(r, 'subset')) || blockedReason(sw)"
  assert.ok(src.includes(site), 'the mutation target is the live subset guard')
  const mutant = await runPhase(ACE_ARGS(), subsetImpl(null), {}, src.replace(site, 'deathOf(sw) || blockedReason(sw)'))
  assert.ok(logged(mutant.logs, 'worker returned no result'), 'the mutant reads the generic reason')
})

test('late-defect: bisect guard — a resolved null at the re-entry dispatch is labeled env-died too', async () => {
  const impl = buildSeqImpl({ 'ace:reentry:t1:a2': [null] }, reentryImpl())
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok(calls.some(c => labelOf(c) === 'ace:reentry:t1:a2'), 'presence: the re-entry batch dispatched')
  assert.ok(logged(logs, '"second"', 'failed absorb — ace:reentry:t1:a2 dispatch resolved null (env-died)', 're-entry abandoned'), 'the abandon reason carries the env-died label')
  assert.ok(!logged(logs, 'worker returned no result'))
  assert.ok(out.landed.includes('t1'))
})

test('late-defect: bisect guard — a non-infra throw at the subset dispatch still rethrows HARD (PIN-23): no env-died label, the ace stage fails open', async () => {
  const thrower = subsetImpl(null)
  const impl = (p, o) => labelOf({ opts: o }) === 'ace:subset:t1:a2' ? (() => { throw new Error('schema mismatch: status is not a string') })() : thrower(p, o)
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok(logged(logs, 'engine error in the wave-side ace stage — schema mismatch: status is not a string'), 'the throw reached the ace stage catch unclassified')
  assert.ok(!logged(logs, 'env-died'), 'a non-infra throw is never labeled env-died')
  assert.ok(out.landed.includes('t1'), 'the ace stage fails open, so the approved work lands')
})
