// Late defects fixed in the run — the ace stops blaming itself for what was there before (part 4)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 5.1 (D3/D4/D10/D11/D12/D14/D23, PIN-3/PIN-4/PIN-10/
// PIN-11/PIN-12/PIN-14/PIN-23): a red ace gate runs the gate once at the pre-ace tip and proceeds over
// ids that were red there too; a regressed ace re-audit asks a pre-ace probe per blocker before any
// revert; a merged baseline red becomes one behavior late defect per run; the sweep and terminal workers
// read the debt list; and a resolved null at the aceBisect subset and re-entry sites reads env-died.
// Section (e), #2629: the aceBisect subset and aceReentry re-audits probe too, each against its own
// pre-dispatch tip.
// The gate-site census at the end of this file (plan 2026-11-08-shell-floors-tests-and-lint T2.4, #2658)
// fails when a ${plan.gate} dispatch carries no background rule and has no exemption row.
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
  PT_ARGS,
  ptImpl,
  blockedWith,
  revertAwarePinSeats,
  movedProbe,
  RANGE_TIP,
  mergeRangeRevert,
  ACE_FILE,
  unprefixed,
  NEW_SEAT_DEFAULTS,
  probeAt,
  workerMd,
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

test('late-defect: ace base — a new failing id, a dead, green or unplaced base check and a red with no ids each keep the forward-revert', async () => {
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
  // A base red that does not place itself at the pre-ace tip licenses nothing: each of the two
  // aceBaseIds echo clauses (isSha, pinMismatch) has its own case and its own mutant.
  const keep = 'b.gate_green === false && isSha(b.head_sha) && !pinMismatch(b.head_sha, preAceSha) ? debtIds('
  assert.ok(src.includes(keep), 'the mutation target is the live base echo clause')
  // The fixture's pre-ace tip is deadbeef, so another sha must differ from it.
  for (const [head_sha, why, clause] of [['abcdef12', 'a base red at another sha', ' && !pinMismatch(b.head_sha, preAceSha)'], [undefined, 'a base red with no echo', ' && isSha(b.head_sha)']]) {
    const seats = { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': () => ({ gate_green: false, head_sha, gate_failing_ids: [DOCKER] }) }
    const placed = await reverts(seats, why)
    assert.equal(placed.filter(kindOf('ace-base-gate')).length, 1, why + ': presence, the base ran and named every id')
    // Red at base: without the clause the unplaced base red licenses the ace tip.
    const mutant = await runPhase(ACE_ARGS(), recordSplit(), seats, src.replace(keep, keep.replace(clause, '')))
    assert.ok((mutant.out.aced || []).length, why + ': the mutant aces over a base red it cannot place')
  }
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

// A base gate that outruns the turn backgrounds like the ace gate (#2326/#2329): the segment pair
// re-dispatches before the ids are read, and a segment reply, even a spent one, names no base ids.
const BASE_SEGMENT = { gate_green: false, gate_segment: 'incomplete', segment_note: 'docker build at layer 4' }
const baseSeq = (...replies) => { let n = 0; return p => { const x = replies[Math.min(n++, replies.length - 1)]; return typeof x === 'function' ? x(p) : x } }
test('late-defect: ace base — a backgrounded base gate re-dispatches on the segment pair, then proceeds over; a spent segment names no ids', async () => {
  const { out, calls, logs } = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseSeq(BASE_SEGMENT, baseRed([DOCKER])) })
  const base = calls.filter(kindOf('ace-base-gate'))
  assert.deepEqual(base.map(labelOf), ['ace-base-gate:t1', 'ace-base-gate:t1:segment-2'], 'one bounded re-dispatch, labelled with its segment')
  assert.ok(base[0].prompt.includes("Return { gate_green: false, gate_segment: 'incomplete', gate_log_path: '<the path>', segment_note: '<the step you reached>' }") && /run_in_background/.test(base[0].prompt), 'the base prompt carries the background rule and its return pair')
  assert.match(base[0].prompt, /mktemp -d "[^"]*\/\.war\/gate-ace-base-t1\.[^"]*-1\.XXXXXX"/, 'and its own gate capture key')
  assert.ok(unprefixed(base[1].prompt).startsWith('SEGMENTED-GATE CONTINUATION (ace-base-gate:t1)') && base[1].prompt.includes(unprefixed(base[0].prompt)), 'the continuation carries the full base prompt')
  assert.ok(logged(logs, 'ace-base-gate:t1: segmented gate (docker build at layer 4)'), 'the segment note is logged')
  // The throwaway worktree outlives a backgrounded base gate: the first prompt asks for its path in
  // segment_note, the shared continuation threads that note, and the base check's own body owns the
  // reuse and the removal (one worktree per base).
  const REUSE = 'A continuation reuses the worktree the prior segment_note names instead of adding one, and removes it once that log is complete.'
  assert.ok(base[0].prompt.includes('If you background the gate, keep it and put its path in segment_note. ' + REUSE), 'the base prompt asks for the worktree path in segment_note and owns its reuse and removal')
  assert.ok(base[1].prompt.includes('Prior segment_note: docker build at layer 4.\n') && base[1].prompt.includes(REUSE), 'the continuation threads the prior note, and its base body carries the removal')
  const bare = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseSeq({ gate_green: false, gate_segment: 'incomplete' }, baseRed([DOCKER])) })
  assert.ok(bare.calls.filter(kindOf('ace-base-gate'))[1].prompt.includes('Prior segment_note: none.'), 'a segment with no note renders none, never undefined')
  // The read-only ace gate check shares aceSegments and runs in the task worktree, so a note that names
  // that worktree must never reach a removal order. Oracle: no sentence of the continuation pairs a
  // worktree with a removal or a reuse.
  const ACE_SEGMENT = { gate_green: false, gate_segment: 'incomplete', segment_note: 'pytest at 13% in the task worktree' }
  const removalIn = prompt => prompt.split(/(?<=\.)\s/).filter(s => /worktree/i.test(s) && /\b(remov|reus)/i.test(s))
  const aceCont = async source => (await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': baseSeq(ACE_SEGMENT, aceRed([DOCKER])), 'ace-base-gate': baseRed([DOCKER]) }, source))
    .calls.find(c => labelOf(c) === 'ace-gate:t1:a1:segment-2')
  const cont = await aceCont()
  assert.ok(cont && unprefixed(cont.prompt).startsWith('SEGMENTED-GATE CONTINUATION (ace-gate:t1:a1)') && cont.prompt.includes('Prior segment_note: pytest at 13% in the task worktree.\n'), 'the ace gate continuation threads its prior note')
  assert.deepEqual(removalIn(cont.prompt), [], 'the ace gate continuation carries no worktree removal or reuse order')
  // Red at base: put the reuse and removal clause back in the shared continuation and the oracle sees it.
  const shared = "Prior segment_note: ${prior.segment_note || 'none'}.\\n` + body,"
  assert.ok(src.includes(shared), 'the mutation target is the live shared continuation')
  const leak = await aceCont(src.replace(shared, "Prior segment_note: ${prior.segment_note || 'none'}. Reuse any worktree it names, add none, and remove it once that log is complete.\\n` + body,"))
  assert.ok(removalIn(leak.prompt).length, 'the mutant ace gate continuation carries a removal order')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === 'tidy import' && a.sha === 'ace00001'), 'one proceed-over: the absorb aces')
  assert.ok(!/FORWARD-REVERT/.test(calls.find(isMergeTask).prompt), 'nothing is forward-reverted')
  // Red at base: without the segment loop the first reply names no ids, so the ace tip reverts.
  const loop = 'aceBaseGates.set(preAceSha, aceSegments('
  assert.ok(src.includes(loop), 'the mutation target is the live base dispatch')
  const once = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': baseSeq(BASE_SEGMENT, baseRed([DOCKER])) }, src.replace(loop, 'aceBaseGates.set(preAceSha, ((b, o) => dispatchSite(b, o))('))
  assert.equal(once.calls.filter(kindOf('ace-base-gate')).length, 1, 'the mutant dispatches once')
  assert.match(once.calls.find(isMergeTask).prompt, /FORWARD-REVERT/, 'and forward-reverts the ace tip')
  // A spent segment budget that echoes the pre-ace tip and the ids still licenses nothing.
  const spent = { 'ace-gate': aceRed([DOCKER]), 'ace-base-gate': p => ({ ...BASE_SEGMENT, ...baseRed([DOCKER])(p), gate_segment: 'incomplete' }) }
  const args = () => ACE_ARGS({ run: { ...ACE_ARGS().run, roundLimit: 2 } })
  const dry = await runPhase(args(), recordSplit(), spent)
  assert.equal(dry.calls.filter(kindOf('ace-base-gate')).length, 3, 'the initial base check + exactly roundLimit (2) re-dispatches')
  assert.ok(!(dry.out.aced || []).length, 'a spent base segment aces nothing')
  assert.match(dry.calls.find(isMergeTask).prompt, /FORWARD-REVERT/, 'and the ace tip is forward-reverted')
  // Red at base: without the segment clause the spent reply licenses the ace tip.
  const seg = '!deathOf(b) && !aceIsSegment(b) && b.gate_green === false'
  assert.ok(src.includes(seg), 'the mutation target is the live segment clause')
  const mutant = await runPhase(args(), recordSplit(), spent, src.replace(seg, '!deathOf(b) && b.gate_green === false'))
  assert.ok((mutant.out.aced || []).length, 'the mutant aces over a gate that never finished')
})

// ---- (b) the pre-ace probe: Obelisks t1, a Nit noted by the first panel returns as a Major ----
const LOCK_ABSORB = nit({ title: 'cache key spelled twice', file: 'src/lock.js', disposition: 'absorb' })
const LOCK_NOTE = { severity: 'Nit', title: 'stale lock read', file: 'src/lock.js', rationale: 'the lock is read before the refresh', disposition: 'note' }
const LOCK_MAJOR = { severity: 'Major', title: 'stale lock read', file: 'src/lock.js', rationale: 'the lock is read before the refresh, so a second writer wins', suggested_fix: 'refresh the lock before the read' }
const obelisk = (majors = [LOCK_MAJOR]) => lateOk(buildSeqImpl({
  'audit:t1:correctness': [approveWith('audit:t1:correctness', [LOCK_ABSORB, LOCK_NOTE]),
    { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings: majors }],
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
  const rec = "recordAceTransfer(r, tip, 'probe-cleared',"
  assert.ok(src.includes(rec), 'the mutation target is the live ledger call')
  assert.equal(pinOf((await probeRun({ exists: 'yes', evidence: 'x' }, src.replace(rec, "(() => {})(r, tip, 'probe-cleared',"))).out).length, 0, 'the mutant writes no row')
  // Red at base: without the probe the Major names the absorb's file as culprit and reverts it (the Obelisks outcome).
  const site = 'const reSeats = await preAceProbe(r, ra, preAce, aceSha)'
  assert.ok(src.includes(site), 'the mutation target is the live probe call')
  const mutant = await probeRun({ exists: 'yes', evidence: 'x' }, src.replace(site, 'const reSeats = ra.seats'))
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

// One seat, two Majors on the absorb's file: the probe clears only the yes blocker, so ADR 0054's
// revert still sees the no blocker. Both answer orders run, so no order-bound mutant passes.
const LOCK_TWICE = { severity: 'Major', title: 'lock released twice', file: 'src/lock.js', rationale: 'release() runs in the catch and in the finally', suggested_fix: 'release the lock once, in the finally' }
const mixedRun = (yesAt, source) => runPhase(ACE_ARGS(), obelisk([LOCK_MAJOR, LOCK_TWICE]),
  { 'pre-ace-probe': (p, o) => ({ exists: o.label === 'pre-ace-probe:t1:' + yesAt ? 'yes' : 'no', evidence: 'read at the pre-ace tip' }) }, source)
test('late-defect: probe — mixed answers: the yes blocker gets a late fix, the no blocker still forward-reverts, and the seat is not cleared', async () => {
  const probeCleared = o => (o.pinTransfers || []).filter(t => t.mode === 'probe-cleared')
  for (const [yesAt, yes, no] of [[1, LOCK_MAJOR, LOCK_TWICE], [2, LOCK_TWICE, LOCK_MAJOR]]) {
    const why = 'yes at blocker ' + yesAt
    const { out, calls, logs } = await mixedRun(yesAt)
    assert.deepEqual(calls.filter(kindOf('pre-ace-probe')).map(labelOf), ['pre-ace-probe:t1:1', 'pre-ace-probe:t1:2'], why + ': one probe per blocker')
    const lf = lateFixOf(calls)
    assert.deepEqual(lf.map(labelOf), ['late-fix:t1:r1'], why + ': the yes blocker queues one late fix')
    assert.ok(lf[0].prompt.includes(yes.suggested_fix) && !lf[0].prompt.includes(no.title), why + ': for the yes blocker only')
    assert.ok(logged(logs, 'late-fix pass: queued [Major] "' + yes.title + '"', 'pre-ace probe: yes'), why + ': the queue log names the yes answer')
    assert.ok(!logged(logs, 'late-fix pass: queued [Major] "' + no.title + '"'), why + ': the no blocker never queues')
    assert.ok(regressed(out), why + ': the no blocker still drives demote:absorb-regressed')
    assert.match(calls.find(isMergeTask).prompt, /FORWARD-REVERT/, why + ': and the ace tip is forward-reverted')
    // The seat stays request_changes: a probeCleared approval is the only source of a probe-cleared row.
    assert.equal(probeCleared(out).length, 0, why + ': the seat is not probe-cleared, so no probe-cleared row')
  }
  // Red at base: a mutant that clears the seat on any yes merges over the no blocker.
  const cleared = 'const cleared = kept.length < (s.findings || []).length && !blockingOf([{ findings: kept }]).length'
  assert.ok(src.includes(cleared), 'the mutation target is the live cleared rule')
  const anyYes = await mixedRun(1, src.replace(cleared, 'const cleared = kept.length < (s.findings || []).length; if (cleared) kept.length = 0'))
  assert.ok(!regressed(anyYes.out) && probeCleared(anyYes.out).length === 1, 'the any-yes mutant clears the seat and keeps the absorb')
  // Red at base: a mutant that probes only the first blocker dispatches one probe.
  const gate = "if (b.severity !== 'Critical' && b.severity !== 'Major') { kept.push(b); continue }"
  assert.ok(src.includes(gate), 'the mutation target is the live per-blocker gate')
  const firstOnly = await mixedRun(2, src.replace(gate, "if (r.probeN || (b.severity !== 'Critical' && b.severity !== 'Major')) { kept.push(b); continue }"))
  assert.equal(firstOnly.calls.filter(kindOf('pre-ace-probe')).length, 1, 'the first-only mutant probes one blocker')
  assert.equal(lateFixOf(firstOnly.calls).length, 0, 'and the second blocker\'s yes never reaches the late-fix pass')
})

// A regressed two-commit range (the 2485/ES2 fixture): the probe runs before ADR 0054's whole-range
// revert, so a yes blocker keeps the absorbs and the default no answer keeps today's range revert.
const RANGE_MAJOR = { severity: 'Major', title: 'range broke it', file: ACE_FILE, rationale: 'regressed', suggested_fix: 'restore the guard' }
const rangeRun = (seats, source) => runPhase(PT_ARGS(), lateOk(ptImpl([nit({ file: ACE_FILE })], blockedWith(RANGE_TIP), {
  seatOver: (lens, sha) => sha === RANGE_TIP && lens === 'correctness' ? { verdict: 'request_changes', findings: [RANGE_MAJOR] } : {} })),
  revertAwarePinSeats(RANGE_TIP, { 'tip-probe': movedProbe(RANGE_TIP, { count: 2 }), ...seats }), source)
const rangeReverted = logs => logged(logs, 'the ace range of 2 commits regressed on re-audit')
test('late-defect: probe — a regressed two-commit range whose blocker answers yes keeps the absorbs; the default no keeps the whole-range revert', async () => {
  const yes = { 'pre-ace-probe': { exists: 'yes', evidence: 'there before' } }
  const { out, calls, logs } = await rangeRun(yes)
  assert.deepEqual(calls.filter(kindOf('pre-ace-probe')).map(labelOf), ['pre-ace-probe:t1:1'], 'presence: the range blocker is probed')
  assert.doesNotMatch(calls.find(isMergeTask).prompt, mergeRangeRevert(RANGE_TIP), 'yes: the merge does not revert the range')
  assert.ok(!rangeReverted(logs), 'yes: no range-regressed route')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === 'tidy import'), 'yes: the absorb stays aced')
  assert.deepEqual(lateFixOf(calls).map(labelOf), ['late-fix:t1:r1'], 'yes: the blocker queues a late fix')
  const no = await rangeRun({})
  assert.equal(no.calls.filter(kindOf('pre-ace-probe')).length, 1, 'no: presence, the default answer ran')
  assert.match(no.calls.find(isMergeTask).prompt, mergeRangeRevert(RANGE_TIP), 'no: the merge forward-reverts the whole range')
  assert.ok(rangeReverted(no.logs), 'no: the rows route as a regressed range')
  assert.equal(lateFixOf(no.calls).length, 0, 'no: no late fix')
  // Red at base: a probe skipped on the multi-commit arm reverts the range over a yes blocker.
  const site = 'const reSeats = await preAceProbe('
  assert.ok(src.includes(site), 'the mutation target is the live probe condition')
  const mutant = await rangeRun(yes, src.replace(site, 'const reSeats = aceProbe.count > 1 ? ra.seats : await preAceProbe('))
  assert.match(mutant.calls.find(isMergeTask).prompt, mergeRangeRevert(RANGE_TIP), 'the mutant reverts the range')
  assert.equal(lateFixOf(mutant.calls).length, 0, 'and the yes blocker gets no late fix')
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

test('late-defect: baseline — a land red on ids the per-task baseline row already took, at the same or another base sha, adds no second row', async () => {
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
  // The common topology: the land base equals the per-task classification base (the working branch
  // did not move), so recordBaselineDebt dedups the land red and the debt list does not grow.
  const sameBase = () => ({ ...landRed(), gate_base_sha: baselineMerge.gate_base_sha })
  const sameDied = clsImpl({ mergeResult: merge, landResult: sameBase })
  const diedPhase = source => runPhase({ ...TWO, finalPhase: false }, lateOk((p, o) => labelOf({ opts: o }) === 'merge:t1:baseline-proceed' ? (() => { throw new Error('socket hang up') })() : sameDied(p, o)), {}, source)
  const same = await diedPhase()
  assert.equal(lateFixOf(same.calls).length, 0, 'presence: same base, no per-task baseline row was queued')
  assert.ok(same.out.carriedTasks.some(t => t.title === 'baseline gate red: ' + BASE_IDS[0]), 'a same-base land red still carries')
  // The mirror: at the same base, ids the per-task row took still add no second row.
  assert.deepEqual(rows(await phase(sameBase)), ['late-fix:t1:r1'], 'same base, taken ids: exactly one row')
  // Red at base: the debt-length test drops the same-base land red.
  const site = '!(landIds.length && landIds.every(id => took.some(d => d.ids.includes(id))))'
  assert.ok(src.includes('if (' + site + ') {'), 'the mutation target is the live guard')
  const lengthGate = await diedPhase(src.replace('if (' + site + ') {', 'if (baselineDebt.length > debtBefore && ' + site + ') {'))
  assert.ok(!lengthGate.out.carriedTasks.some(t => /^baseline gate red: /.test(t.title)), 'the length-gated mutant carries nothing')
  // Red at base: without the took test the land red carries a duplicate.
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

// ---- (e) the pre-ace probe at the aceBisect subset and aceReentry re-audits (#2629) ----
// Each site probes against its own pre-dispatch tip: the subset against the post-revert tip (preSub),
// the re-entry batch against the last approved tip (preRe). Only the later site's probe answers yes.
// In the subset row the batch probe answers no and keeps today's culprit arm. In the re-entry row the
// batch re-audit approves, so no batch probe runs.
const PRE_MAJOR = { severity: 'Major', title: 'unbounded retry', file: 'skills/b.js', rationale: 'the retry loop has no cap', suggested_fix: 'cap the retry at three tries' }
const yesAt = tip => p => ({ exists: String(p).includes('before the ace commit ' + tip) ? 'yes' : 'no', evidence: 'read at the pre-ace tip' })
const preMajorSeat = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings: [PRE_MAJOR] }
const REVERT_TIP = 'feed0001'.padEnd(40, '0')
const probedAt = (calls, tip) => calls.filter(kindOf('pre-ace-probe')).filter(c => c.prompt.includes('before the ace commit ' + tip))
const subsetProbeRun = source => runPhase(ACE_ARGS(), lateOk(buildSeqImpl({
  'audit:t1:correctness': [bApprove([FA, FB]), bRegress('skills/a.js'), preMajorSeat],
  'ace:polish:t1:a1': [bWorker('ace00001')],
  'ace:subset:t1:a2': [bWorker('5ab00001')],
}, aceBase([FA, FB]))), { 'pre-ace-probe': yesAt('5ab00001'), 'ace-revert': { ok: true, tip_sha: REVERT_TIP } }, source)

test('late-defect: probe — the aceBisect subset re-audit probes against its own pre-subset tip, so a yes blocker keeps the subset absorb and gets a late fix', async () => {
  const { out, calls, logs } = await subsetProbeRun()
  assert.deepEqual(calls.filter(kindOf('pre-ace-probe')).map(labelOf), ['pre-ace-probe:t1:1', 'pre-ace-probe:t1:2'], 'the batch blocker and the subset blocker each get one probe, with distinct labels')
  const sub = probedAt(calls, '5ab00001')
  assert.equal(sub.length, 1, 'one probe at the subset tip')
  assert.equal(shaIn(sub[0].prompt, /at the pre-ace tip ([0-9a-f]{7,40})/), REVERT_TIP, 'it reads the post-revert tip the subset was cut from (preSub)')
  assert.ok(sub[0].prompt.includes('BLOCKER: 1. [Major] unbounded retry (skills/b.js)'), 'the prompt names the subset blocker')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === FB.title && a.sha === '5ab00001'), 'the subset absorb stays aced at the subset tip')
  assert.ok(!((demotionOf(out, FB.title) || {}).demoteReason || '').startsWith('demote:absorb-regressed'), 'the subset absorb is not forward-reverted')
  assert.deepEqual(lateFixOf(calls).map(labelOf), ['late-fix:t1:r1'], 'the blocker joins the late-fix pass')
  assert.ok(lateFixOf(calls)[0].prompt.includes(PRE_MAJOR.suggested_fix), 'with its fix')
  assert.ok(logged(logs, 'late-fix pass: queued [Major] "unbounded retry"', 'pre-ace probe: yes'), 'the queue log names the probe answer')
  assert.ok((out.pinTransfers || []).some(t => t.mode === 'probe-cleared' && t.sha === '5ab00001'), 'the probe-cleared approval writes its pinTransfers row at the subset tip')
  // Red at base: without the subset call the blocker reverts the subset absorb and gets no late fix.
  const site = 'const subSeats = await preAceProbe(r, sa, preSub, subSha)'
  assert.ok(src.includes(site), 'the mutation target is the live subset call')
  const mutant = await subsetProbeRun(src.replace(site, 'const subSeats = sa.seats'))
  assert.equal(probedAt(mutant.calls, '5ab00001').length, 0, 'the mutant probes nothing at the subset tip')
  assert.ok(((demotionOf(mutant.out, FB.title) || {}).demoteReason || '').startsWith('demote:absorb-regressed'), 'the mutant forward-reverts the subset absorb')
  assert.equal(lateFixOf(mutant.calls).length, 0, 'and the blocker gets no late fix')
})

const reentryProbeRun = source => runPhase(ACE_ARGS(), lateOk(buildSeqImpl({
  'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'first', file: 'skills/first.js' })]),
    approveWith('audit:t1:correctness', [nit({ title: 'second', file: 'skills/second.js' })]),
    { ...preMajorSeat, findings: [{ ...PRE_MAJOR, file: 'skills/second.js' }] }],
  'ace:polish:t1:a1': [bWorker('ace00001')],
  'ace:reentry:t1:a2': [bWorker('ace00002')],
}, aceBase([nit({ title: 'first', file: 'skills/first.js' })]))), { 'pre-ace-probe': yesAt('ace00002') }, source)

test('late-defect: probe — the aceReentry re-audit probes against its own pre-dispatch tip, so a yes blocker keeps the re-entry absorb and gets a late fix', async () => {
  const { out, calls, logs } = await reentryProbeRun()
  const re = probedAt(calls, 'ace00002')
  assert.deepEqual(re.map(labelOf), ['pre-ace-probe:t1:1'], 'one probe at the re-entry tip, and the approving batch re-audit dispatched none')
  assert.equal(shaIn(re[0].prompt, /at the pre-ace tip ([0-9a-f]{7,40})/), 'ace00001', 'it reads the last approved tip the re-entry batch was cut from (preRe), not the first pre-ace tip')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === 'second' && a.sha === 'ace00002'), 'the re-entry absorb stays aced at the re-entry tip')
  assert.ok(!((demotionOf(out, 'second') || {}).demoteReason || '').startsWith('demote:absorb-regressed'), 'the re-entry absorb is not forward-reverted')
  assert.ok(!mergeRangeRevert('ace00002').test(calls.find(isMergeTask).prompt), 'the merge does not revert the re-entry tip')
  assert.deepEqual(lateFixOf(calls).map(labelOf), ['late-fix:t1:r1'], 'the blocker joins the late-fix pass')
  assert.ok(logged(logs, 'late-fix pass: queued [Major] "unbounded retry"', 'pre-ace probe: yes'), 'the queue log names the probe answer')
  assert.ok((out.pinTransfers || []).some(t => t.mode === 'probe-cleared' && t.sha === 'ace00002'), 'the probe-cleared approval writes its pinTransfers row at the re-entry tip')
  // Red at base: without the re-entry call the blocker reverts the re-entry absorb and gets no late fix.
  const site = 'const reS = await preAceProbe(r, rr, preRe, reSha)'
  assert.ok(src.includes(site), 'the mutation target is the live re-entry call')
  const mutant = await reentryProbeRun(src.replace(site, 'const reS = rr.seats'))
  assert.equal(probedAt(mutant.calls, 'ace00002').length, 0, 'the mutant probes nothing at the re-entry tip')
  assert.ok(((demotionOf(mutant.out, 'second') || {}).demoteReason || '').startsWith('demote:absorb-regressed'), 'the mutant forward-reverts the re-entry absorb')
  assert.equal(lateFixOf(mutant.calls).length, 0, 'and the blocker gets no late fix')
})

// ---- (f) plan 2026-11-08-engine-findings-ace-and-late-fix T3.1 ----
// D11: an ace gate red with no head_sha and no ids is unjudged, so it re-dispatches as a segment.
// D35: a judged red gets one more gate run before the revert (a re-ask for ids, or a fresh re-run).
// D24: a moved tip without the trailers its prompt asked for is logged. D34: an empty ace reply with
// an unmoved tip re-dispatches once. D36: a tip probe that misses only a tree field is re-asked once.
const UNJUDGED = { gate_green: false, gate_output: 'INCOMPLETE, not a failure: pytest was still running' }
const aceGreen = p => ({ gate_green: true, head_sha: shaIn(p, /at the ace tip ([0-9a-f]{7,40})/) })
const gateLabelsAt = (calls, label) => calls.filter(kindOf('ace-gate')).map(labelOf).filter(l => l.startsWith(label))
const redLogged = logs => logs.some(l => typeof l === 'string' && /ace-gate t1: (red|RED) at ace tip/.test(l))
const tidyAced = out => (out.aced || []).some(a => a.finding && a.finding.title === 'tidy import' && a.sha === 'ace00001')
const reverted = calls => /FORWARD-REVERT/.test(calls.find(isMergeTask).prompt)
const D11_PREDICATE = "(res.gate_segment === 'incomplete' || (!isSha(res.head_sha) && !debtIds(res.gate_failing_ids).length))"
const preD11 = () => src.replace(D11_PREDICATE, "res.gate_segment === 'incomplete'")
// The D35 second run, cut: a judged red reverts on its first reply (the pre-D35 arm).
const D35_FIRST = 'const first = await aceGateJudge(r, aceTipSha, g)\n    if (first) return first\n'
const preD35 = () => src.replace(D35_FIRST, D35_FIRST + '    return { green: false, died: null }\n')

test('ace gate: an unjudged reply re-dispatches, never RED — a later green keeps the ace', async () => {
  const run = source => runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': baseSeq(UNJUDGED, aceGreen) }, source)
  const { out, calls, logs } = await run()
  assert.deepEqual(gateLabelsAt(calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:segment-2'], 'the unjudged reply re-dispatches once as a segment continuation')
  const cont = calls.find(c => labelOf(c) === 'ace-gate:t1:a1:segment-2')
  assert.ok(unprefixed(cont.prompt).startsWith('SEGMENTED-GATE CONTINUATION (ace-gate:t1:a1)') && cont.prompt.includes('unjudged (a red with no head_sha and no gate_failing_ids)'), 'the continuation names the unjudged arm')
  assert.ok(!redLogged(logs), 'the unjudged reply is never logged RED')
  assert.ok(tidyAced(out), 'the later green keeps the ace')
  assert.ok(!reverted(calls), 'nothing is forward-reverted')
  // Red at base: with the pre-D11 predicate the unjudged reply is a judged red.
  assert.ok(src.includes(D11_PREDICATE), 'the mutation target is the live D11 predicate')
  const mutant = await run(preD11())
  assert.ok(redLogged(mutant.logs), 'the mutant reads the unjudged reply as a red')
  assert.deepEqual(gateLabelsAt(mutant.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:rerun'], 'and re-runs it as a red, never as a segment')
})

test('ace gate: an unjudged reply at every attempt takes died', async () => {
  const args = () => ACE_ARGS({ run: { ...ACE_ARGS().run, roundLimit: 2 } })
  const run = source => runPhase(args(), recordSplit(), { 'ace-gate': UNJUDGED }, source)
  const { out, calls, logs } = await run()
  assert.equal(gateLabelsAt(calls, 'ace-gate:t1:a1').length, 3, 'the first check plus exactly roundLimit (2) re-dispatches')
  assert.ok(!tidyAced(out), 'nothing is aced at a tip no gate judged')
  assert.ok(reverted(calls), 'the ace tip forward-reverts (the died route)')
  assert.ok(logged(logs, 'ace-gate t1: segmented-gate budget exhausted'), 'the spent bound is logged')
  assert.ok(logged(logs, 'failed absorb', 'never finished within roundLimit 2'), 'the row reaches the sweep naming the unfinished gate')
  assert.ok(!redLogged(logs), 'never logged RED')
  // Red at base: the pre-D11 predicate logs the unjudged reply RED.
  assert.ok(redLogged((await run(preD11())).logs), 'the mutant logs RED')
})

test('ace gate: a judged red still reverts once its re-run reproduces — an ids red and a provision-failure red', async () => {
  // Arm 1: an ids red with head_sha; the new id is not red at the pre-ace tip, so the gate re-runs once.
  const ids = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed(['test_split_offsets']), 'ace-base-gate': baseRed([DOCKER]) })
  assert.deepEqual(gateLabelsAt(ids.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:rerun'], 'ids red: exactly one fresh re-run')
  assert.ok(unprefixed(ids.calls.find(c => labelOf(c) === 'ace-gate:t1:a1:rerun').prompt).startsWith('ACE GATE RE-RUN (D35)'), 'ids red: the re-run prompt names itself')
  assert.ok(!tidyAced(ids.out) && reverted(ids.calls), 'ids red: the reproduced red forward-reverts')
  assert.ok(logged(ids.logs, 'ace-gate t1: RED at ace tip ace00001', 'the D35 re-run: docker build failed'), 'ids red: the revert log carries both outputs')
  // Arm 2: a provision-failure red (head_sha, provision_failed, no ids, the step in gate_output).
  const provArgs = () => ACE_ARGS({ run: { ...ACE_ARGS().run, provision: ['pnpm install --frozen-lockfile'] } })
  const provRed = p => ({ gate_green: false, head_sha: shaIn(p, /at the ace tip ([0-9a-f]{7,40})/), provision_failed: true, gate_output: 'pnpm install --frozen-lockfile exited 1' })
  const prov = await runPhase(provArgs(), recordSplit(), { 'ace-gate': provRed })
  const first = prov.calls.find(c => labelOf(c) === 'ace-gate:t1:a1')
  assert.ok(first.prompt.includes('a failing provision step is NOT green: return { gate_green: false, head_sha: ace00001, gate_output: <the failed step>, provision_failed: true }'), 'provision: the prompt asks a judged provision red')
  assert.deepEqual(gateLabelsAt(prov.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:rerun'], 'provision: exactly one fresh re-run and no re-ask for ids')
  assert.equal(prov.calls.filter(kindOf('ace-base-gate')).length, 0, 'provision: no ids, so no base run')
  assert.ok(!tidyAced(prov.out) && reverted(prov.calls), 'provision: the reproduced red forward-reverts')
  assert.ok(logged(prov.logs, 'RED at ace tip ace00001 — pnpm install --frozen-lockfile exited 1'), 'provision: the log names the failed step')
})

test('ace gate: a judged red re-runs once before the revert — a flaky red proceeds, a reproduced red reverts, a head_sha-only red is re-asked for ids', async () => {
  // Arm 1: red, then green on the re-run: proceeds with the flaky log.
  const flakyRun = source => runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': baseSeq(aceRed(['test_lock_timeout']), aceGreen) }, source)
  const flaky = await flakyRun()
  assert.deepEqual(gateLabelsAt(flaky.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:rerun'], 'flaky: one re-run')
  assert.ok(logged(flaky.logs, 'ace-gate t1: the first red did not reproduce (flaky) — proceeding'), 'flaky: logged')
  assert.ok(tidyAced(flaky.out) && !reverted(flaky.calls), 'flaky: the ace stands')
  // Red at base: without the D35 run the first red reverts a good ace.
  assert.ok(src.includes(D35_FIRST), 'the mutation target is the live first-judgment return')
  const cut = await flakyRun(preD35())
  assert.deepEqual(gateLabelsAt(cut.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1'], 'the mutant runs the gate once')
  assert.ok(!tidyAced(cut.out) && reverted(cut.calls), 'and reverts the good ace')
  // Arm 2: red, then red: reverts.
  const twice = await runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': aceRed(['test_lock_timeout']) })
  assert.equal(gateLabelsAt(twice.calls, 'ace-gate:t1:a1').length, 2, 'reproduced: at most two gate runs per ace tip')
  assert.ok(!tidyAced(twice.out) && reverted(twice.calls), 'reproduced: the red reverts')
  // Arm 3: a red with head_sha and no ids is re-asked once for its ids; here they were red at the pre-ace tip too.
  const noIds = p => ({ gate_green: false, head_sha: shaIn(p, /at the ace tip ([0-9a-f]{7,40})/), gate_output: '2 failed' })
  const reaskRun = source => runPhase(ACE_ARGS(), recordSplit(), { 'ace-gate': baseSeq(noIds, aceRed([DOCKER])), 'ace-base-gate': baseRed([DOCKER]) }, source)
  const reask = await reaskRun()
  assert.deepEqual(gateLabelsAt(reask.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:ids'], 're-ask: one dispatch asking for the ids')
  const ask = unprefixed(reask.calls.find(c => labelOf(c) === 'ace-gate:t1:a1:ids').prompt)
  assert.ok(ask.startsWith('ACE GATE RE-ASK (D35): the prior red at ace00001 named no gate_failing_ids.'), 're-ask: the prompt names the missing ids')
  assert.ok(logged(reask.logs, 'no gate_failing_ids, so the gate is re-asked once for them (D35)'), 're-ask: logged')
  assert.ok(tidyAced(reask.out), 're-ask: the returned ids were red at the pre-ace tip, so the ace proceeds over them')
  // The red reproduced (its ids were red at the pre-ace tip too), so the proceed-over is never logged flaky.
  const FLAKY = "if (second && second.green && g2 && g2.gate_green === true) log("
  assert.ok(!logged(reask.logs, 'did not reproduce (flaky)'), 're-ask: a proceed-over second judgment is never logged flaky')
  assert.ok(src.includes(FLAKY), 'the mutation target is the live flaky-log guard')
  const looseFlaky = await reaskRun(src.replace(FLAKY, 'if (second && second.green) log('))
  assert.ok(logged(looseFlaky.logs, 'did not reproduce (flaky)'), 'the mutant logs the reproduced red as flaky')
  // Red at base: without the re-ask branch the head_sha-only red is re-run, never asked for its ids.
  const REASK = "const reask = g.gate_green === false && g.provision_failed !== true && isSha(g.head_sha) && !debtIds(g.gate_failing_ids).length"
  assert.ok(src.includes(REASK), 'the mutation target is the live re-ask test')
  const noAsk = await reaskRun(src.replace(REASK, 'const reask = false'))
  assert.deepEqual(gateLabelsAt(noAsk.calls, 'ace-gate:t1:a1'), ['ace-gate:t1:a1', 'ace-gate:t1:a1:rerun'], 'the mutant re-runs without asking for ids')
})

test('ace re-entry: a moved tip without its trailers is logged by name and still charged', async () => {
  const bare = probeAt('reentry', (p, o, w) => ({ ...NEW_SEAT_DEFAULTS['tip-probe'](p, o, w), tip_trailers: { aceSubset: '', aceCharge: '' } }))
  const run = source => runPhase(ACE_ARGS(), reentryImpl(), { 'tip-probe': bare }, source)
  const { out, calls, logs } = await run()
  const GAP = 'lacks Ace-Subset (expected "Ace-Subset: t1:reentry:a2:skills/second.js") and Ace-Charge (expected "Ace-Charge: t1:2"), which its prompt asked for'
  assert.ok(logged(logs, 'ace-reentry t1: the moved tip ', GAP, "a relaunch's ABSORB-CHARGE READ will not count this commit"), 'the log names each missing trailer, the sha and the expected value')
  assert.ok(!logged(logs, 'ace t1: the moved tip '), 'the batch probe carried no tip_trailers, so nothing is logged for it')
  assert.ok(calls.find(kindOf('tip-probe')).prompt.includes('Also return tip_trailers: { aceSubset, aceCharge }'), 'the tip probe asks for the trailers')
  assert.deepEqual(calls.filter(kindOf('ace-gate')).map(labelOf), ['ace-gate:t1:a1', 'ace-gate:t1:a2'], 'absorbRounds still increments: the re-entry gate runs at slot 2')
  assert.equal(calls.filter(c => isAuditor(c) && /^audit:t1:/.test(labelOf(c))).length, 3, 'the re-audit still dispatches at the re-entry tip')
  assert.ok((out.aced || []).some(a => a.finding && a.finding.title === 'second'), 'the re-entry absorb still aces')
  // Red at base: without the re-entry log call the moved tip is charged in silence.
  const site = "trailerGapLog('ace-reentry ' + r.task.id, reProbe,"
  assert.ok(src.includes(site), 'the mutation target is the live re-entry log call')
  const mutant = await run(src.replace(site, "(() => {})('ace-reentry ' + r.task.id, reProbe,"))
  assert.ok(!logged(mutant.logs, GAP), 'the mutant logs nothing')
  // A tip that carries Ace-Charge and lacks only Ace-Subset: the charge read still counts it, so the
  // log ends at the proceed clause.
  const subsetOnly = probeAt('reentry', (p, o, w) => ({ ...NEW_SEAT_DEFAULTS['tip-probe'](p, o, w), tip_trailers: { aceSubset: '', aceCharge: 't1:2' } }))
  const subRun = source => runPhase(ACE_ARGS(), reentryImpl(), { 'tip-probe': subsetOnly }, source)
  const sub = await subRun()
  assert.ok(logged(sub.logs, 'ace-reentry t1: the moved tip ', 'lacks Ace-Subset (expected "Ace-Subset: t1:reentry:a2:skills/second.js"), which its prompt asked for. The charge and re-audit proceed (D24).'), 'a subset-only gap logs the proceed clause alone')
  assert.ok(!logged(sub.logs, 'ABSORB-CHARGE READ will not count'), 'a subset-only gap never claims the charge read skips the commit')
  const CLAUSE = "(gaps.some(([, key]) => key === 'aceCharge') ? '; a relaunch\\'s ABSORB-CHARGE READ will not count this commit' : '')"
  assert.ok(src.includes(CLAUSE), 'the mutation target is the live charge-clause guard')
  const always = await subRun(src.replace(CLAUSE, "'; a relaunch\\'s ABSORB-CHARGE READ will not count this commit'"))
  assert.ok(logged(always.logs, 'ABSORB-CHARGE READ will not count'), 'the mutant claims the charge read skips the commit')
})

test('ace dispatch: an empty reply with an unmoved tip re-dispatches once', async () => {
  // deaths: how many leading polish dispatches die before the worker answers.
  const deadFirst = (deaths, base) => { let n = 0; return (p, o) => { if (labelOf({ opts: o }) === 'ace:polish:t1:a1' && n++ < deaths) throw new Error('socket hang up'); return base(p, o) } }
  const polishCalls = calls => calls.filter(c => labelOf(c) === 'ace:polish:t1:a1')
  const run = (deaths, source) => runPhase(ACE_ARGS(), deadFirst(deaths, recordSplit()), {}, source)
  const once = await run(1)
  assert.equal(polishCalls(once.calls).length, 2, 'the empty reply re-dispatches the same prompt once')
  assert.equal(polishCalls(once.calls)[1].prompt, polishCalls(once.calls)[0].prompt, 'the same prompt')
  assert.ok(logged(once.logs, 'ace t1: the polish dispatch returned nothing and left no commit — re-dispatching once (D34).'), 'the retry is logged')
  assert.deepEqual(gateLabelsAt(once.calls, 'ace-gate:t1:a'), ['ace-gate:t1:a1'], 'charged once: the retry costs no absorb slot')
  assert.ok(tidyAced(once.out), 'the second reply moves the tip and is aced')
  // Control: two empty replies route the rows to the sweep after exactly two dispatches.
  const twice = await run(2)
  assert.equal(polishCalls(twice.calls).length, 2, 'exactly two dispatches')
  assert.equal(twice.calls.filter(kindOf('ace-gate')).length, 0, 'nothing to gate')
  assert.ok(!tidyAced(twice.out) && logged(twice.logs, 'Re-entry routing', 'tidy import', 'failed absorb'), 'the rows route to the sweep as a failed absorb')
  // Red at base: without the retry the first empty reply sends the rows to the sweep.
  const RETRY = "if (deathOf(w) && tipClass(probe) === 'unchanged' && probe.count === 0) {"
  assert.ok(src.includes(RETRY), 'the mutation target is the live retry test')
  const mutant = await run(1, src.replace(RETRY, 'if (false) {'))
  assert.equal(polishCalls(mutant.calls).length, 1, 'the mutant dispatches once')
  assert.ok(!tidyAced(mutant.out), 'and aces nothing')
})

test('tip probe: a reply without approved_tree is re-asked once', async () => {
  const probeSeq = (...shapes) => { let n = 0; return probeAt('polish', (p, o, w) => shapes[Math.min(n++, shapes.length - 1)](NEW_SEAT_DEFAULTS['tip-probe'](p, o, w))) }
  const dropTree = ({ approved_tree, ...rest }) => rest
  const probes = calls => calls.filter(c => labelOf(c) === 'tip-probe:polish:t1:a1')
  const run = (seats, source) => runPhase(ACE_ARGS(), recordSplit(), { 'tip-probe': seats }, source)
  const fixed = await run(probeSeq(dropTree, x => x))
  assert.equal(probes(fixed.calls).length, 2, 'one re-ask')
  assert.ok(unprefixed(probes(fixed.calls)[1].prompt).startsWith('TIP PROBE RE-ASK: your prior reply had no usable approved_tree.'), 'the re-ask names the missing field')
  assert.ok(logged(fixed.logs, 'tip-probe:polish:t1:a1: the tip probe returned no approved_tree — re-asking once, naming the field (D36).'), 'the re-ask is logged')
  assert.ok(tidyAced(fixed.out) && !reverted(fixed.calls), 'a complete second reply classes moved: the ace stands')
  const partial = await run(probeSeq(dropTree))
  assert.equal(probes(partial.calls).length, 2, 'a second partial reply gets no third ask')
  assert.ok(logged(partial.logs, 'tip-probe:polish:t1:a1: the tip probe returned no usable Git read (PIN-5).'), 'a second partial reply is unusable')
  assert.ok(!tidyAced(partial.out), 'and nothing is aced')
  // Red at base: without the retry a reply missing only approved_tree reads as no Git read.
  const SITE = 'probeApproved: approvedShaOf(r), label, partialRetry: true })'
  assert.ok(src.includes(SITE), 'the mutation target is the live retry opt-in')
  const mutant = await run(probeSeq(dropTree, x => x), src.replace(SITE, 'probeApproved: approvedShaOf(r), label })'))
  assert.equal(probes(mutant.calls).length, 1, 'the mutant asks once')
  assert.ok(!tidyAced(mutant.out), 'and loses the good ace')
})

// Gate-site census (plan 2026-11-08-shell-floors-tests-and-lint T2.4, PIN-17, #2658). A default-deny
// static census over the engine text: every non-comment ${plan.gate} interpolation is a gate site. Its
// builder is the innermost assignment whose statement is still open at the site (statement extent by
// indentation). A row keys on that builder name plus the site's leading literal ('Gate:' or 'Run the
// gate'), never on a line number. A row either names the carrier the site's statement reaches, or is
// exempt with a reason. A carrier passes only if its token sits in the builder's statement, or in every
// statement that consumes the builder by name (mergeSplitClause rides two segmentedMerge calls, and
// landPrompt is an argument of its segmentedLand call). Only code lines count: a comment never vouches.
// Carriers: aceBgRule rides the ace gate checks, segmentedMerge appends segmentedGateClause, and
// segmentedLand appends segmentedLandClause, a backgroundGateRule call. An unlisted site, a stale row,
// a count mismatch under a key, or a missing carrier token reds the census.
{
  const CARRIERS = {
    aceBgRule: /\baceBgRule\b/,
    segmentedGateClause: /\bsegmentedMerge\(/,
    backgroundGateRule: /\bsegmentedLand\(/,
  }
  const FIX = 'FIX_GATE_RULE site: a fix dispatch runs only its touched tests, and the engine gates the new tip'
  const GATE_SITES = [
    { builder: 'aceBaseIds', lead: 'Gate:', carries: 'aceBgRule' },
    { builder: 'bodyOf', lead: 'Gate:', carries: 'aceBgRule' },
    // aceBisect's subset, aceReentry's batch and aceStage's polish commit, each `const { w: <name> }`.
    { builder: 'sw', lead: 'Gate:', exempt: 'ace subset, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'rw', lead: 'Gate:', exempt: 'ace re-entry, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'ace', lead: 'Gate:', exempt: 'ace polish, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'impl', lead: 'Gate:', exempt: 'worker WORK dispatch: the worker card owns the run_in_background rule', card: 'run_in_background' },
    { builder: 'fix', lead: 'Gate:', exempt: FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'mergeSplitClause', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'floorFixHead', lead: 'Gate:', exempt: FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'ep', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'bp', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'evidence', lead: 'Run the gate', exempt: 'fail-open evidence re-run: a missing or unstamped integratedTipGate reads SOFT cannot-confirm, never a red merge' },
    { builder: 'w', lead: 'Gate:', exempt: 'late-fix worker, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'mr', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'sweep', lead: 'Gate:', exempt: 'polish sweep worker, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'pmr', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'tw', lead: 'Gate:', exempt: 'terminal pass worker, ' + FIX, proof: /\bFIX_GATE_RULE\b/ },
    { builder: 'tmr', lead: 'Run the gate', carries: 'segmentedGateClause' },
    { builder: 'landPrompt', lead: 'Run the gate', carries: 'backgroundGateRule' },
    // The environment-proceed and baseline-proceed re-lands are two `const reLand` statements.
    { builder: 'reLand', lead: 'Run the gate', sites: 2, carries: 'backgroundGateRule' },
  ]
  const gateSiteCensus = (text, rows) => {
    const lines = text.split('\n')
    const indentOf = l => l.match(/^ */)[0].length
    const isComment = l => /^\s*\/\//.test(l)
    // A plain binding names itself. A destructured one names its first local binding ({ w: sw } => sw).
    const ASSIGN = /^\s*(?:(?:const|let|var)\s+)?(?:([A-Za-z_$][\w$]*)|\{\s*(?:[\w$]+\s*:\s*)?([\w$]+)[^}]*\})\s*=(?![=>])/
    // A statement opened at line j runs until the next code line indented no deeper than line j.
    const endOf = j => {
      for (let k = j + 1; k < lines.length; k++) {
        if (lines[k].trim() && !isComment(lines[k]) && indentOf(lines[k]) <= indentOf(lines[j])) return k
      }
      return lines.length
    }
    // A body is code lines only: a comment that names a carrier never vouches for it.
    const codeOf = (from, to) => lines.slice(from, to).filter(l => !isComment(l)).join('\n')
    const builderAt = i => {
      for (let j = i; j >= 0; j--) {
        const m = !isComment(lines[j]) && lines[j].match(ASSIGN)
        if (m && endOf(j) > i) return { name: m[1] || m[2], start: j, end: endOf(j), body: codeOf(j, endOf(j)) }
      }
      return { name: '<none>', start: i, end: i + 1, body: '' }
    }
    // A use is the builder name concatenated (`+ <name>`) or passed as a call argument (`(<name>` or
    // `, <name>`), and each use is one home. More than one use in one statement (the arms of a ternary)
    // splits it: a use's home runs from that use to the next one, so one arm cannot vouch for another.
    const consumers = name => {
      const USE = new RegExp('(?:\\+|\\(|,)\\s*' + name + '\\b')
      const uses = lines.flatMap((l, i) => !isComment(l) && USE.test(l) ? [{ i, st: builderAt(i) }] : [])
      return uses.map(({ i, st }) => {
        const same = uses.filter(u => u.st.start === st.start)
        const at = same.findIndex(u => u.i === i)
        const from = at === 0 ? st.start : i
        const to = at === same.length - 1 ? st.end : same[at + 1].i
        return { name: st.name, body: codeOf(from, to) }
      })
    }
    const sites = []
    lines.forEach((l, i) => {
      if (isComment(l) || !l.includes('${plan.gate}')) return
      const pre = l.slice(0, l.indexOf('${plan.gate}'))
      const lead = /Gate: $/.test(pre) ? 'Gate:' : /run the (?:FULL )?gate \($/i.test(pre) ? 'Run the gate' : '<unknown lead>'
      sites.push({ ...builderAt(i), lead })
    })
    const problems = []
    const keyOf = r => (r.builder || r.name) + ' | ' + r.lead
    for (const key of new Set(sites.map(keyOf))) {
      const found = sites.filter(s => keyOf(s) === key)
      const row = rows.find(r => keyOf(r) === key)
      if (!row) { problems.push('unclassified gate site: ' + key); continue }
      if (found.length !== (row.sites || 1)) problems.push(key + ': ' + found.length + ' site(s) found, the row lists ' + (row.sites || 1))
      const token = row.carries ? CARRIERS[row.carries] : row.proof
      if (row.carries && !token) problems.push(key + ': unknown carrier ' + row.carries)
      if (!row.carries && !row.exempt) problems.push(key + ': a row needs carries or an exempt reason')
      for (const s of token ? found : []) {
        const homes = token.test(s.body) ? [s] : consumers(s.name)
        if (!homes.length || !homes.every(h => token.test(h.body))) problems.push(key + ': no ' + (row.carries || token.source) + ' in its statement')
      }
    }
    for (const r of rows) if (!sites.some(s => keyOf(s) === keyOf(r))) problems.push('stale row: ' + keyOf(r))
    // Per builder, the rows' site total equals the sites found under that builder.
    for (const b of new Set(sites.map(s => s.name))) {
      const listed = rows.filter(r => r.builder === b).reduce((n, r) => n + (r.sites || 1), 0)
      const found = sites.filter(s => s.name === b).length
      if (listed && listed !== found) problems.push(b + ': rows list ' + listed + ' site(s), ' + found + ' found')
    }
    return { sites, problems }
  }

  test('gate-site census: every plan.gate dispatch is classified', () => {
    const { sites, problems } = gateSiteCensus(src, GATE_SITES)
    assert.deepEqual(problems, [], 'every gate site has a row whose carrier or exemption holds')
    assert.ok(sites.length > 0 && sites.every(s => s.lead !== '<unknown lead>'), 'every site has a known leading literal')
    for (const r of GATE_SITES.filter(r => r.card)) assert.ok(workerMd.includes(r.card), r.builder + ': the worker card carries ' + r.card)
  })

  test('gate-site census: an unclassified synthetic site reds', () => {
    const tail = '\nconst syntheticGateSite = async () => {\n  await dispatchSite(\n    pt`SYNTHETIC`\n    + pt`Gate: ${plan.gate}\\n`,\n    {})\n}\n'
    assert.deepEqual(gateSiteCensus(src + tail, GATE_SITES).problems, ['unclassified gate site: syntheticGateSite | Gate:'], 'an unlisted site reds')
    // A commented-out site is not a site.
    assert.deepEqual(gateSiteCensus(src + '\n// Gate: ${plan.gate}\n', GATE_SITES).problems, [], 'a comment line is skipped')
    // A row without its carrier token reds: the ace gate check loses aceBgRule.
    const DROP = '      + aceBgRule\n'
    assert.ok(src.includes(DROP), 'the mutation target is the live ace gate check carrier')
    assert.deepEqual(gateSiteCensus(src.replace(DROP, '\n'), GATE_SITES).problems, ['bodyOf | Gate:: no aceBgRule in its statement'], 'a dropped carrier reds')
    // A carrier named only in a comment reds too: comment lines are not part of a statement body.
    assert.deepEqual(gateSiteCensus(src.replace(DROP, '      // + aceBgRule\n'), GATE_SITES).problems, ['bodyOf | Gate:: no aceBgRule in its statement'], 'a commented-out carrier reds')
    // A carrier reached through a call argument: the land prompt loses its segmentedLand dispatch. The
    // comment above the helper still names segmentedLand(, and the mutant adds a comment that names it
    // inside the consuming statement. Neither comment may vouch for the row.
    const LAND = 'segmentedLand(landPrompt,'
    assert.ok(src.includes(LAND), 'the mutation target is the live initial land dispatch')
    assert.deepEqual(gateSiteCensus(src.replace(LAND, 'dispatchSite(landPrompt,\n    // was segmentedLand(\n'), GATE_SITES).problems, ['landPrompt | Run the gate: no backgroundGateRule in its statement'], 'a land prompt that loses segmentedLand reds')
    // The mirror arm: a re-land whose statement opens on another dispatch reds once per mutated site.
    const RELAND = 'const reLand = await segmentedLand('
    assert.equal(src.split(RELAND).length - 1, GATE_SITES.find(r => r.builder === 'reLand').sites, 'the mutation target is every live re-land dispatch')
    assert.deepEqual(gateSiteCensus(src.replace(RELAND, 'const reLand = await dispatchSite('), GATE_SITES).problems, ['reLand | Run the gate: no backgroundGateRule in its statement'], 'a re-land that loses segmentedLand reds')
    // The segmentedMerge carrier family: the evidence-proceed merge loses its segmentedMerge dispatch.
    const EP = 'const ep = routedMr(await segmentedMerge('
    assert.equal(src.split(EP).length - 1, 1, 'the mutation target is the live evidence-proceed merge dispatch')
    assert.deepEqual(gateSiteCensus(src.replace(EP, 'const ep = routedMr(await dispatchSite('), GATE_SITES).problems, ['ep | Run the gate: no segmentedGateClause in its statement'], 'a merge that loses segmentedMerge reds')
    // The consumers() arm split: one floorFixHead arm loses FIX_GATE_RULE, and a sibling arm may not vouch for it.
    const ARM = 'never weaken, skip, or delete a test to force it green. Commit and push. ${FIX_GATE_RULE}'
    assert.equal(src.split(ARM).length - 1, 1, 'the mutation target is the live done-unmet floor-fix arm')
    assert.deepEqual(gateSiteCensus(src.replace(ARM, ARM.replace(' ${FIX_GATE_RULE}', '')), GATE_SITES).problems, ['floorFixHead | Gate:: no \\bFIX_GATE_RULE\\b in its statement'], 'an arm that loses FIX_GATE_RULE reds')
  })
}
