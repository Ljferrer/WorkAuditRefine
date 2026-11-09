// Late defects fixed in the run — the late-fix pass, the gate-audit route and the hold (part 2)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 3.1 (D5/D8/D13/D20/D25, PIN-5/PIN-8/PIN-13/PIN-20/PIN-25):
// a gate-audit Critical/Major with a suggested_fix gets a bounded late fix on the origin task's
// fixRounds before land; a spent fix holds the final phase (late-defect) or carries on carriedTasks;
// each late-fix commit carries `Late-Fix: <task id>:<n>`, which a relaunch reads back.
import { test } from 'node:test'
import {
  assert,
  src,
  schemasMd,
  refinerMd,
  refinerRecoveryMd,
  runPhase,
  PROVISION_ARGS,
  defaultImpl,
  barrierEnv,
  isLand,
  highestFor,
  fixRoundRulesSection,
  GA_MAJOR,
  LATE_TASK,
  LATE_FIX_ARGS,
  isLateFixWorker,
  lateFixImpl,
  spawnSync,
  mkdtempSync,
  writeFileSync,
  rmSync,
  join,
  tmpdir,
  PROBE,
  polishPromptOf,
  demotionOf,
  EVIDENCE_LENS,
  EVIDENCE_SEAT,
  REA_ON,
  REA_RESOLVED_PATH,
} from './workflow-template.test-harness.mjs'

const labelOf = c => c.opts.label || ''
const lateWorkers = calls => calls.filter(isLateFixWorker)
const lateHolds = out => (out.escalated || []).filter(e => e && e.reason === 'late-defect')
const gateHolds = out => (out.escalated || []).filter(e => e && e.reason === 'gate-evidence')
// A requiresTest:false phase that claims an End-state condition, so the end-state-only seat runs.
const ES_PHASE = { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ['condition A holds at the tip'] }

test('late-defect: gate-audit f65e7e37 replay — a Major with a full suggested_fix goes to the late-fix pass, the approved fix lands with fixRounds counted, and the phase lands', async () => {
  const { out, calls } = await runPhase(LATE_FIX_ARGS(), lateFixImpl())
  assert.equal(out.landDecision, 'landed', 'the fixed defect no longer holds the land')
  assert.deepEqual(gateHolds(out), [], 'no gate-evidence hold: the Major had a fix (PIN-5)')
  assert.deepEqual(lateHolds(out), [], 'no late-defect hold: the fix landed')
  assert.deepEqual(out.carriedTasks, [], 'carriedTasks is present and empty')
  const prov = calls.find(c => c.opts.dispatchKind === 'late-fix-worktree')
  assert.ok(prov, 'the refiner cut a late-fix worktree')
  assert.equal(labelOf(prov), 'late-fix-worktree:p3-latefix-1')
  assert.match(prov.prompt, /provision-worktrees\.sh ensure-worktree \/abs\/repo\/\.claude\/worktrees\/run-2026\/p3-latefix-1 war\/wtprov-a\/p3-latefix-1 "\$\(git -C \/abs\/repo\/\.claude\/worktrees\/run-2026\/_refinery rev-parse integration\/wtprov-a\/phase-3\)"/, 'cut at the integrated tip')
  const workers = lateWorkers(calls)
  assert.equal(workers.length, 1, 'one late-fix round')
  const w = workers[0]
  assert.equal(labelOf(w), 'late-fix:t1:r1')
  assert.equal(w.opts.phase, 'Work')
  assert.ok(w.prompt.includes('Late-Fix: t1:1'), 'the commit trailer names the origin task and the round (PIN-25)')
  assert.ok(w.prompt.includes(GA_MAJOR().title) && w.prompt.includes(GA_MAJOR().suggested_fix), 'the defect and its fix ride the prompt verbatim')
  assert.ok(w.prompt.includes(fixRoundRulesSection()), 'FIX_ROUND_DOCTRINE_CLAUSE rides it')
  assert.ok(w.prompt.includes('FIX-ROUND SCOPE:'), 'FIX_ROUND_SCOPE_CLAUSE rides it')
  assert.ok(!w.prompt.includes('BACKWARD-CHAIN FIX') && !w.prompt.includes('BACKWARD-CHAIN WORK'), 'no chain clause')
  const reaudit = calls.find(c => labelOf(c) === 'audit:p3-latefix-1:correctness')
  assert.ok(reaudit, 'the origin task roster re-audits the late-fix sha')
  assert.ok(reaudit.prompt.includes('abcdef1'), 'at the new tip')
  const merge = calls.find(c => labelOf(c) === 'merge:p3-latefix-1')
  assert.ok(merge && merge.prompt.includes('git merge --ff-only war/wtprov-a/p3-latefix-1; if it is not a fast-forward, return conflict and do not merge.'), 'the refiner fast-forwards the late-fix branch in _refinery, so no merge commit hides its Late-Fix trailer')
  assert.ok(!/git merge war\/wtprov-a\/p3-latefix-1\b/.test(merge.prompt), 'no plain git merge of the late-fix branch')
  assert.ok(merge.prompt.includes('if any line carries no t1:<n> value, return conflict naming that commit and do not merge.'), 'every fast-forwarded commit must carry the origin Late-Fix trailer, so resume never meets a bare one')
  assert.ok(merge.prompt.indexOf('Before step (b), run git -C /abs/repo/.claude/worktrees/run-2026/p3-latefix-1 log ') < merge.prompt.indexOf('(b) MERGE in _refinery'), 'the trailer check runs before the fast-forward')
  assert.ok(merge.prompt.includes('Run the gate (make gate'), 'the gate runs before the merge')
  const order = [prov, w, reaudit, merge, calls.find(isLand)].map(c => calls.indexOf(c))
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'provision, fix, re-audit, merge, then land')
  const row = out.auditLog.find(e => e.verdict === 'late-fix:approve')
  assert.ok(row && row.task === 't1' && row.fixRounds === 1 && row.lateFix === 'p3-latefix-1', 'the fix round is counted on the origin task (PIN-8)')
})

test('late-defect: gate-audit fix-less — a Major with no suggested_fix keeps the gate-evidence hold and no late-fix worker runs', async () => {
  const { out, calls } = await runPhase(LATE_FIX_ARGS(), lateFixImpl({ gaFindings: [GA_MAJOR({ suggested_fix: '  ' })] }))
  assert.equal(out.landDecision, 'held:escalation')
  assert.equal(gateHolds(out).length, 1, 'the gate-evidence hold stands')
  assert.equal(lateWorkers(calls).length, 0, 'nothing joined the late-fix queue')
  // A mixed seat (one blocker with a fix, one without) still holds: the fix-less blocker is hard.
  const mixed = await runPhase(LATE_FIX_ARGS(), lateFixImpl({ gaFindings: [GA_MAJOR(), GA_MAJOR({ title: 'second', suggested_fix: undefined })] }))
  assert.equal(mixed.out.landDecision, 'held:escalation')
  assert.equal(gateHolds(mixed.out).length, 1)
  assert.equal(lateWorkers(mixed.calls).length, 0, 'a held phase runs no late fix')
})

test('late-defect: gate-audit escalate — an escalate verdict keeps the gate-evidence hold even when its Major carries a fix', async () => {
  const { out, calls } = await runPhase(LATE_FIX_ARGS(), lateFixImpl({ gaVerdict: 'escalate' }))
  assert.equal(out.landDecision, 'held:escalation')
  assert.equal(gateHolds(out).length, 1)
  assert.equal(lateWorkers(calls).length, 0)
})

test('late-defect: gate-audit end-state seat — a fixable blocker belongs to the task whose Files: hold its file, else to the lowest-id merged task', async () => {
  const tasks = [LATE_TASK({ id: '3.10', requiresTest: false, files: ['src/b.js'] }), LATE_TASK({ id: '3.2', requiresTest: false, files: ['src/c.js'] })]
  const owned = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks }), lateFixImpl({ gaFindings: [GA_MAJOR({ file: 'src/b.js' })] }))
  assert.ok(owned.calls.some(c => labelOf(c) === 'gate-audit:phase-3:end-state'), 'the end-state-only seat ran')
  assert.deepEqual(lateWorkers(owned.calls).map(labelOf), ['late-fix:3.10:r1'], 'the file owner is the origin task')
  assert.equal(owned.out.landDecision, 'landed')
  const unowned = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks }), lateFixImpl({ gaFindings: [GA_MAJOR({ file: 'docs/z.md' })] }))
  assert.deepEqual(lateWorkers(unowned.calls).map(labelOf), ['late-fix:3.2:r1'], 'an unowned file falls to the lowest-id merged task (3.2 < 3.10)')
})

// tipImpl: the evidence dispatch answers an integratedTipGate (the evidenceImpl shape), so the
// integrated-tip seat runs on the intra-dep PROVISION_ARGS phase (t2 deps t1). That seat returns
// `tip`; every per-task gate-audit seat returns `perTask`. Everything else rides lateFixImpl.
const TIP_GATE = { gate_output: 'INTEGRATED TIP GATE: all suites passed', tip_sha: 'aaaa1111', gate_log_path: '/abs/repo/.claude/teams/run-2026/.war/gate-tip.log' }
const gaSeat = (label, findings) => ({ seat: label, lens: 'execution-evidence', verdict: findings.length ? 'request_changes' : 'approve', findings, confidence: 'high' })
const tipImpl = ({ tip = [GA_MAJOR()], perTask = [] } = {}) => {
  const base = lateFixImpl()
  return (p, o) => {
    const label = labelOf({ opts: o })
    if (/^evidence:/.test(label)) return { perTask: [], integratedTipGate: TIP_GATE }
    if (label === 'gate-audit:phase-3:integrated-tip') return gaSeat(label, tip)
    if (/^gate-audit:/.test(label)) return gaSeat(label, perTask)
    return base(p, o)
  }
}
const TIP_ROUTE = "      else queueLateFix(authVerdict, 'phase-' + ph.id + '-integrated-tip', 'gate-audit:phase-' + ph.id + ':integrated-tip')\n"

test('late-defect: gate-audit integrated-tip seat — a fixable blocker joins the late-fix pass, a fix-less one holds gate-evidence', async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS(), tipImpl())
  assert.ok(calls.some(c => labelOf(c) === 'gate-audit:phase-3:integrated-tip'), 'presence guard: the integrated-tip seat ran')
  assert.deepEqual(lateWorkers(calls).map(labelOf), ['late-fix:t1:r1'], 'the blocker joins the late-fix pass under the lowest-id merged task')
  assert.deepEqual(gateHolds(out), [], 'a blocker with a fix never holds gate-evidence (PIN-5)')
  assert.equal(out.landDecision, 'landed')
  // Fix-less control: the same seat with a blank suggested_fix holds, and no late fix runs.
  const fixless = await runPhase(PROVISION_ARGS(), tipImpl({ tip: [GA_MAJOR({ suggested_fix: '' })] }))
  assert.equal(fixless.out.landDecision, 'held:escalation')
  assert.deepEqual(gateHolds(fixless.out).map(e => e.task), ['phase-3-integrated-tip'], 'one gate-evidence hold on the integrated-tip pseudo task')
  assert.equal(lateWorkers(fixless.calls).length, 0, 'no late-fix worker runs')
  // Red proof by mutation: without the integrated-tip route the fixable blocker is neither held nor
  // queued, and the phase lands with the defect unfixed (a PIN-1 breach the rows above catch).
  assert.ok(src.includes(TIP_ROUTE), 'the mutation target is the live route line')
  const mutated = await runPhase(PROVISION_ARGS(), tipImpl(), {}, src.replace(TIP_ROUTE, ''))
  assert.equal(lateWorkers(mutated.calls).length, 0, 'the mutant runs no late fix')
  assert.deepEqual(gateHolds(mutated.out), [], 'and holds nothing')
  assert.equal(mutated.out.landDecision, 'landed', 'so it lands the defect unfixed')
})

test('late-defect: gate-audit dedup — one defect raised by several gate-audit seats runs one late fix, and distinct defects still run one each', async () => {
  // Both per-task seats (t1, t2) raise the same Major: one late fix, and the drop is logged.
  const two = await runPhase(PROVISION_ARGS(), lateFixImpl())
  assert.equal(two.calls.filter(c => /^gate-audit:t\d:execution-evidence$/.test(labelOf(c))).length, 2, 'presence guard: both per-task seats ran')
  assert.deepEqual(lateWorkers(two.calls).map(labelOf), ['late-fix:t1:r1'], 'exactly one late-fix worker')
  assert.equal(two.out.landDecision, 'landed')
  assert.ok(two.logs.some(l => /^late-fix pass: \[Major\] "mapped test never ran" \(gate-audit:t\d:execution-evidence\) duplicates the row gate-audit:t\d:execution-evidence already queued/.test(l)), 'the dropped copy is logged, never silent')
  // The integrated-tip seat and both per-task seats raise it: still one late fix.
  const three = await runPhase(PROVISION_ARGS(), tipImpl({ tip: [GA_MAJOR()], perTask: [GA_MAJOR()] }))
  assert.deepEqual(lateWorkers(three.calls).map(labelOf), ['late-fix:t1:r1'], 'one late fix across the per-task and integrated-tip seats')
  assert.equal(three.logs.filter(l => /^late-fix pass: .* duplicates the row /.test(l)).length, 2, 'two dropped copies, each logged')
  // Mirror: distinct titles are distinct defects, so each runs its own late fix.
  const distinct = await runPhase(PROVISION_ARGS(), tipImpl({ tip: [GA_MAJOR({ title: 'other defect' })], perTask: [] }))
  assert.equal(lateWorkers(distinct.calls).length, 1, 'presence guard: the tip-only defect runs once')
  const both = await runPhase(PROVISION_ARGS({ tasks: [PROVISION_ARGS().tasks[0]] }), lateFixImpl({ gaFindings: [GA_MAJOR(), GA_MAJOR({ title: 'other defect' })] }))
  assert.deepEqual(lateWorkers(both.calls).map(labelOf), ['late-fix:t1:r1', 'late-fix:t1:r2'], 'two distinct defects run two late fixes')
  // Identical copies render once in the late-fix worker prompt.
  const fixOnce = lateWorkers(two.calls)[0].prompt.split(GA_MAJOR().suggested_fix).length - 1
  assert.equal(fixOnce, 1, 'an identical dropped copy adds no second row')
  // Red proof by mutation: without the duplicate check the per-task pair runs two late fixes.
  const check = 'const dup = blankText(f.file) ? null : lateFixQueue.find(q => lateKeyOf(q) === lateKeyOf(f))'
  assert.ok(src.includes(check), 'the mutation target is the live duplicate check')
  const mutated = await runPhase(PROVISION_ARGS(), lateFixImpl(), {}, src.replace(check, 'const dup = null'))
  assert.equal(lateWorkers(mutated.calls).length, 2, 'the mutant runs the same defect twice')
})

// perSeatImpl: each per-task gate-audit seat returns its own findings (`byTask[<task id>]`).
const perSeatImpl = byTask => {
  const base = lateFixImpl()
  return (p, o) => {
    const m = /^gate-audit:(t\d):execution-evidence$/.exec(labelOf({ opts: o }))
    return m ? gaSeat(o.label, byTask[m[1]] || []) : base(p, o)
  }
}

test('late-defect: gate-audit dedup — a fileless title from two tasks queues twice, and a same-file copy with another fix rides the one late-fix prompt', async () => {
  // A bare title cannot show that two tasks' rows are one defect, so each queues on its own.
  const fileless = { t1: [GA_MAJOR({ file: undefined, line: undefined, suggested_fix: 'fix A in t1' })], t2: [GA_MAJOR({ file: '', line: undefined, suggested_fix: 'fix B in t2' })] }
  const two = await runPhase(PROVISION_ARGS(), perSeatImpl(fileless))
  assert.deepEqual(lateWorkers(two.calls).map(labelOf), ['late-fix:t1:r1', 'late-fix:t2:r1'], 'two late fixes, one per origin task')
  assert.ok(lateWorkers(two.calls)[0].prompt.includes('fix A in t1') && lateWorkers(two.calls)[1].prompt.includes('fix B in t2'), 'each worker sees its own fix')
  assert.ok(!two.logs.some(l => / duplicates the row /.test(l)), 'no drop is logged')
  // Mirror: the same file + title with different fixes is one defect, and the one prompt carries both fixes.
  const sameFile = { t1: [GA_MAJOR({ suggested_fix: 'fix A in t1' })], t2: [GA_MAJOR({ suggested_fix: 'fix B in t2', rationale: 'another reading' })] }
  const one = await runPhase(PROVISION_ARGS(), perSeatImpl(sameFile))
  assert.deepEqual(lateWorkers(one.calls).map(labelOf), ['late-fix:t1:r1'], 'one late fix')
  const wp = lateWorkers(one.calls)[0].prompt
  assert.ok(wp.includes('fix A in t1') && wp.includes('fix B in t2') && wp.includes('another reading'), 'the dropped copy fix and rationale reach the worker')
  // Red proofs by mutation: the fileless guard and the copy render each go red on their own.
  const guard = 'const dup = blankText(f.file) ? null : lateFixQueue'
  assert.ok(src.includes(guard), 'the mutation target is the live fileless guard')
  const noGuard = await runPhase(PROVISION_ARGS(), perSeatImpl(fileless), {}, src.replace(guard, 'const dup = lateFixQueue'))
  assert.equal(lateWorkers(noGuard.calls).length, 1, 'without the guard the fileless pair collapses')
  const render = "lfCopies.map((s, i) => queuedFindingRow({ ...s, task: f.task }, i)).join('\\n')"
  assert.ok(src.includes(render), 'the mutation target is the live copy render')
  const survivorOnly = await runPhase(PROVISION_ARGS(), perSeatImpl(sameFile), {}, src.replace(render, 'queuedFindingRow(f, 0)'))
  assert.ok(!lateWorkers(survivorOnly.calls)[0].prompt.includes('fix B in t2'), 'without the render the dropped fix never reaches the worker')
})

test('late-defect: gate-audit evidence seat — the late-fix re-audit evidence seat reads the origin manifest the late-fix worker writes', async () => {
  const tasks = [LATE_TASK({ roster: [{ lens: 'correctness' }, EVIDENCE_SEAT] })]
  const { calls } = await runPhase(LATE_FIX_ARGS({ tasks, run: { evidence: true }, ...REA_ON }), lateFixImpl())
  const seat = calls.find(c => labelOf(c) === 'audit:p3-latefix-1:' + EVIDENCE_LENS)
  assert.ok(seat, 'presence guard: the origin roster evidence seat re-audits the late fix')
  assert.ok(seat.prompt.includes('git show <audit_sha>:' + REA_RESOLVED_PATH), 'the seat reads the origin task manifest')
  assert.ok(lateWorkers(calls)[0].prompt.includes(REA_RESOLVED_PATH), 'the worker writes the same path')
  assert.ok(!seat.prompt.includes('p3-latefix-1.<sha12>.manifest.json'), 'never the pseudo task path no one writes')
  // Red proof by mutation: without the stamp the seat reads the pseudo task path.
  const stamp = 'roster: origin.roster, manifestTask: origin,'
  assert.ok(src.includes(stamp), 'the mutation target is the live stamp')
  const mutated = await runPhase(LATE_FIX_ARGS({ tasks: [LATE_TASK({ roster: [{ lens: 'correctness' }, EVIDENCE_SEAT] })], run: { evidence: true }, ...REA_ON }), lateFixImpl(), {}, src.replace(stamp, 'roster: origin.roster,'))
  assert.ok(mutated.calls.find(c => labelOf(c) === 'audit:p3-latefix-1:' + EVIDENCE_LENS).prompt.includes('p3-latefix-1.<sha12>.manifest.json'), 'the mutant names the pseudo task manifest')
})

test('late-defect: gate-audit no origin — a fixable End-state blocker on a phase where nothing merged keeps the gate-evidence hold, and no late-fix worker runs', async () => {
  // A zero-task claims-bearing launch: nothing merged and no origin task. (A phase whose tasks ran and
  // none merged no longer spawns the end-state-only seat at all — D8, #2532.)
  const impl = lateFixImpl()
  const run = code => runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks: [] }), impl, {}, code)
  const { out, calls, logs } = await run()
  assert.ok(calls.some(c => labelOf(c) === 'gate-audit:phase-3:end-state'), 'presence guard: the end-state-only seat ran')
  assert.deepEqual(gateHolds(out).map(e => e.task), ['phase-3-end-state'], 'one gate-evidence hold on the end-state pseudo task')
  assert.equal(lateWorkers(calls).length, 0, 'no late-fix worker runs')
  assert.ok(logs.some(l => /has no merged origin task — it keeps the gate-evidence hold/.test(l)), 'the route is logged')
  // Red proof by mutation: a bare continue drops the defect with no record (a PIN-1 breach).
  const push = "      escalated.push({ task: f.task, reason: 'gate-evidence', detail: f })\n      continue\n"
  assert.ok(src.includes(push), 'the mutation target is the live hold')
  const mutated = await run(src.replace(push, '      continue\n'))
  assert.deepEqual(gateHolds(mutated.out), [], 'the mutant records nothing')
})

test('late-defect: gate-audit end-state handoff — a fixed End-state blocker lands unverified with a note, never unmet', async () => {
  const cond = ES_PHASE.endState[0]
  const tasks = [LATE_TASK({ requiresTest: false })]
  const esImpl = (findings, extra = {}) => {
    const base = lateFixImpl(extra)
    return (p, o) => labelOf({ opts: o }) === 'gate-audit:phase-3:end-state'
      ? { ...gaSeat(o.label, findings), endStateAttestations: [{ condition: cond, status: 'unmet', evidence: 'the mapped test never ran' }] }
      : base(p, o)
  }
  const fixed = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks }), esImpl([GA_MAJOR({ plan_ref: cond })]))
  assert.equal(fixed.out.landDecision, 'landed')
  assert.deepEqual(lateWorkers(fixed.calls).map(labelOf), ['late-fix:t1:r1'], 'presence guard: the late fix ran')
  // attestedAt (D28): this seat names no audit_sha and the row has no check artifact, so it is null.
  assert.deepEqual(fixed.out.handoff.endState, [{ condition: cond, status: 'unverified', note: 'fixed by the late-fix pass (p3-latefix-1) after the gate-audit; not re-attested', attestedAt: null }])
  assert.ok(schemasMd.includes('`fixed by the late-fix pass (<id>) after the gate-audit; not re-attested`'), 'schemas.md restates the note the engine emits')
  // Mirror: a spent late fix never merged, so the blocker stays unmet on the held phase.
  const spent = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks, run: { roundLimit: 2 } }), esImpl([GA_MAJOR({ plan_ref: cond })], { rejects: 99 }))
  assert.equal(spent.out.landDecision, 'held:escalation')
  assert.equal(spent.out.handoff.endState[0].status, 'unmet', 'an unfixed blocker stays unmet')
  // Mirror: the fixed blocker carries no plan_ref, so the seat's unmet attestation is not its row.
  const unbound = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks }), esImpl([GA_MAJOR()]))
  assert.equal(unbound.out.landDecision, 'landed')
  assert.equal(unbound.out.handoff.endState[0].status, 'unmet', 'an unmet attestation no late-fixed row explains stays unmet')
  // Red proof by mutation: without the late-fixed arm the fixed blocker reads unmet.
  const arm = 'if (hardRel.length && hardRel.every(fixedOf)'
  assert.ok(src.includes(arm), 'the mutation target is the live arm')
  const mutated = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks }), esImpl([GA_MAJOR({ plan_ref: cond })]), {}, src.replace(arm, 'if (false'))
  assert.equal(mutated.out.handoff.endState[0].status, 'unmet', 'the mutant marks the fixed End state unmet')
})

test('late-defect: hold — on the final phase a spent late fix holds held:escalation with reason late-defect, and the branch never merges', async () => {
  const { out, calls } = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 3 } }), lateFixImpl({ rejects: 99 }))
  assert.equal(out.landDecision, 'held:escalation')
  const held = lateHolds(out)
  assert.equal(held.length, 1)
  assert.equal(held[0].task, 't1')
  assert.equal(held[0].fixRounds, 3, 'the hold carries the spent fixRounds')
  assert.match(held[0].detail, /the fix budget is spent/)
  assert.match(held[0].detail, /war\/wtprov-a\/p3-latefix-1 stays unmerged, the pre-fix tip lands/)
  assert.deepEqual(lateWorkers(calls).map(labelOf), ['late-fix:t1:r1', 'late-fix:t1:r2', 'late-fix:t1:r3'], 'one round per budget slot, never past run.roundLimit')
  assert.ok(lateWorkers(calls)[1].prompt.includes('PRIOR ROUND: round 1 at abcdef1') && lateWorkers(calls)[1].prompt.includes('fix incomplete'), 'the next round sees the blocker')
  assert.ok(!calls.some(c => labelOf(c) === 'merge:p3-latefix-1'), 'an unapproved branch is never merged')
  assert.deepEqual(gateHolds(out), [])
  assert.deepEqual(out.carriedTasks, [], 'the final phase never carries')
  // Two defects: the first late fix merges, the second spends the budget and holds. The handoff
  // tipSha names the late-fix merge, which integration already carries, not t1's task merge commit.
  const LF_SHA = '3'.repeat(40)
  const implOf = () => {
    const base = lateFixImpl({ gaFindings: [GA_MAJOR(), GA_MAJOR({ title: 'second defect', file: 'src/b.test.js' })] })
    return (p, o) => /^audit:p3-latefix-2:/.test(labelOf({ opts: o }))
      ? { seat: o.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings: [{ severity: 'Major', title: 'fix incomplete', file: 'src/a.js', rationale: 'r', suggested_fix: 'add the missing row' }] }
      : base(p, o)
  }
  const two = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 3 } }), implOf())
  assert.equal(two.out.landDecision, 'held:escalation')
  assert.ok(two.calls.some(c => labelOf(c) === 'merge:p3-latefix-1'), 'presence guard: the first late fix merged')
  assert.deepEqual(lateHolds(two.out).map(e => e.detail.includes('"second defect"')), [true], 'the second defect holds')
  assert.equal(two.out.handoff.tipSha, LF_SHA, 'the handoff tipSha is the late-fix merge sha')
  // Red proof by mutation: without the tracker update the handoff names the pre-late-fix merge commit.
  const line = 'if (isSha(mr.integration_sha)) lastLandedTip = mr.integration_sha\n'
  assert.ok(src.includes(line), 'the mutation target is the live tracker update')
  const mutated = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 3 } }), implOf(), {}, src.replace(line, '\n'))
  assert.ok(mutated.out.handoff.tipSha && mutated.out.handoff.tipSha !== LF_SHA, 'the mutant names a stale tip')
})

test('late-defect: hold — on a non-final phase a spent late fix lands the phase and returns one carriedTasks row', async () => {
  const { out } = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 2 }, finalPhase: false }), lateFixImpl({ rejects: 99 }))
  assert.equal(out.landDecision, 'landed')
  assert.deepEqual(lateHolds(out), [])
  assert.equal(out.carriedTasks.length, 1)
  const row = out.carriedTasks[0]
  assert.equal(row.task, 't1', 'the origin task')
  assert.equal(row.title, GA_MAJOR().title)
  assert.equal(row.file, GA_MAJOR().file)
  assert.equal(row.suggested_fix, GA_MAJOR().suggested_fix)
  assert.equal(row.findingClass, 'behavior')
  assert.equal(row.fixRounds, 2)
  assert.equal(row.planSlug, 'wtprov-a', 'planSlug-stamped for the #1413 floor')
  assert.equal(row.carriedFrom.phase, 3)
  assert.match(row.carriedFrom.reason, /the fix budget is spent/)
})

test('late-defect: hold — a failed late-fix worktree provision stops the defect, which holds on the final phase and carries on a non-final one', async () => {
  const failProv = () => { const base = lateFixImpl(); return (p, o) => o.dispatchKind === 'late-fix-worktree' ? { ok: false, stderrTail: 'boom' } : base(p, o) }
  const { out, calls } = await runPhase(LATE_FIX_ARGS(), failProv())
  assert.ok(calls.some(c => c.opts.dispatchKind === 'late-fix-worktree'), 'presence guard: the provision ran')
  assert.equal(lateWorkers(calls).length, 0, 'no worker runs in an unprovisioned worktree')
  assert.equal(out.landDecision, 'held:escalation')
  const held = lateHolds(out)
  assert.equal(held.length, 1)
  assert.match(held[0].detail, /the late-fix worktree did not provision \(boom\)/)
  assert.doesNotMatch(held[0].detail, /stays unmerged/, 'no branch was cut, so none stays unmerged')
  const carried = await runPhase(LATE_FIX_ARGS({ finalPhase: false }), failProv())
  assert.equal(carried.out.landDecision, 'landed')
  assert.equal(carried.out.carriedTasks.length, 1, 'a non-final phase carries the stopped defect')
  assert.match(carried.out.carriedTasks[0].carriedFrom.reason, /did not provision \(boom\)/)
  // Red proof by mutation: without the stop the worker runs in the unprovisioned worktree.
  const stop = "      if (!cut) stop = 'the late-fix worktree did not provision ("
  assert.ok(src.includes(stop), 'the mutation target is the live stop')
  const mutated = await runPhase(LATE_FIX_ARGS(), failProv(), {}, src.replace(stop, "      if (false) stop = '("))
  assert.ok(lateWorkers(mutated.calls).length > 0, 'the mutant dispatches a worker into the unprovisioned worktree')
})

test('late-defect: hold — a dead late-fix worker or a dead late-fix re-audit stops the defect after one round, and the hold names the death', async () => {
  const deadAt = re => { const base = lateFixImpl(); return (p, o) => { if (re.test(labelOf({ opts: o }))) throw new Error('API error: 529 Overloaded'); return base(p, o) } }
  const args = () => LATE_FIX_ARGS({ run: { roundLimit: 4 } })
  const worker = await runPhase(args(), deadAt(/^late-fix:/))
  assert.equal(lateWorkers(worker.calls).length, 1, 'exactly one late-fix worker runs into the dead API')
  assert.equal(worker.out.landDecision, 'held:escalation')
  const wHeld = lateHolds(worker.out)
  assert.equal(wHeld.length, 1)
  assert.match(wHeld[0].detail, /the late-fix worker died \(.*529 Overloaded/, 'the hold names the death')
  assert.doesNotMatch(wHeld[0].detail, /the fix budget is spent/, 'never the spent-budget reason')
  assert.equal(wHeld[0].fixRounds, 1, 'the round charged its slot, and only that one')
  // Mirror: a re-audit seat that dies through auditRound's retries stops the defect the same way.
  const seat = await runPhase(args(), deadAt(/^audit:p\d+-latefix-/))
  assert.equal(lateWorkers(seat.calls).length, 1, 'exactly one late-fix worker before the dead re-audit')
  assert.ok(!seat.calls.some(c => labelOf(c) === 'merge:p3-latefix-1'), 'a dead re-audit never merges')
  const sHeld = lateHolds(seat.out)
  assert.equal(sHeld.length, 1)
  assert.match(sHeld[0].detail, /the late-fix re-audit died \(.*529 Overloaded/, 'the hold names the re-audit death')
  assert.doesNotMatch(sHeld[0].detail, /the fix budget is spent/)
  // Red proofs by mutation: without each stop the pass spends the whole budget on the dead API.
  const wStop = "      if (wDied) { stop = 'the late-fix worker died (' + wDied + ')'; break }\n"
  assert.ok(src.includes(wStop), 'the mutation target is the live worker stop')
  const wMut = await runPhase(args(), deadAt(/^late-fix:/), {}, src.replace(wStop, ''))
  assert.equal(lateWorkers(wMut.calls).length, 4, 'the mutant dispatches roundLimit workers into the dead API')
  assert.match(lateHolds(wMut.out)[0].detail, /the fix budget is spent/, 'and holds on the spent-budget reason')
  const sStop = "      if (died) { stop = 'the late-fix re-audit died (' + died + ')'; break }\n"
  assert.ok(src.includes(sStop), 'the mutation target is the live re-audit stop')
  const sMut = await runPhase(args(), deadAt(/^audit:p\d+-latefix-/), {}, src.replace(sStop, ''))
  assert.equal(lateWorkers(sMut.calls).length, 4, 'the mutant re-dispatches roundLimit workers past each dead re-audit')
})

test('late-defect: hold — a red late-fix gate takes another round, a conflict stops the pass, and a phase another hard reason holds never runs it', async () => {
  const red = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 2 } }), lateFixImpl({ mergeStatus: 'gate_failed' }))
  assert.equal(lateWorkers(red.calls).length, 2, 'gate_failed takes the next round')
  assert.equal(lateHolds(red.out).length, 1)
  const conflict = await runPhase(LATE_FIX_ARGS(), lateFixImpl({ mergeStatus: 'conflict' }))
  assert.equal(lateWorkers(conflict.calls).length, 1, 'a conflict stops the loop')
  assert.match(lateHolds(conflict.out)[0].detail, /the late-fix merge returned conflict/)
  // t2's seat holds on a fix-less Major (gate-evidence) before the pass, so the pass never runs for t1's fixable one.
  const tasks = [LATE_TASK(), LATE_TASK({ id: 't2', issue: 102, files: ['src/d.js'] })]
  const base = lateFixImpl()
  const impl = (p, o) => labelOf({ opts: o }) === 'gate-audit:t2:execution-evidence'
    ? { seat: o.label, lens: 'execution-evidence', verdict: 'request_changes', findings: [GA_MAJOR({ title: 'fix-less', suggested_fix: '' })], confidence: 'high' }
    : base(p, o)
  const held = await runPhase(PROVISION_ARGS({ tasks, finalPhase: false }), impl)
  assert.equal(held.out.landDecision, 'held:escalation')
  assert.equal(lateWorkers(held.calls).length, 0, 'the pass never runs on a held phase')
  assert.equal(gateHolds(held.out).length, 1, 'the fix-less blocker holds on gate-evidence')
  assert.equal(lateHolds(held.out).length, 1, 'the queued defect rides a late-defect hold, never dropped')
  assert.equal(lateHolds(held.out)[0].task, 't1')
  assert.match(lateHolds(held.out)[0].detail, /the phase already holds/)
  assert.deepEqual(held.out.carriedTasks, [], 'a held phase never carries the defect away from the Lead')
})

test('late-defect: charge — each late-fix round charges the origin task fixRounds, and the trailer index follows the charge', async () => {
  const { out, calls } = await runPhase(LATE_FIX_ARGS(), lateFixImpl({ rejects: 1 }))
  assert.equal(out.landDecision, 'landed')
  const ws = lateWorkers(calls)
  assert.deepEqual(ws.map(labelOf), ['late-fix:t1:r1', 'late-fix:t1:r2'])
  assert.ok(ws[0].prompt.includes('`Late-Fix: t1:1`') && ws[1].prompt.includes('`Late-Fix: t1:2`'))
  assert.deepEqual(out.auditLog.filter(e => e.lateFix).map(e => [e.verdict, e.fixRounds]), [['late-fix:rejected', 1], ['late-fix:approve', 2]])
})

test('late-defect: charge — a relaunch rebuilds fixRounds from the barrier lateFixCharges read, so the late fix resumes the spent budget', async () => {
  // Fresh args per run: the engine writes fixRounds onto the task object it was handed.
  const run = env => runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks: [LATE_TASK()], recovery: { sanctioned: true } }), (p, o) => o.dispatchKind === 'provision-barrier' ? env : lateFixImpl({ rejects: 99 })(p, o))
  const resumed = await run({ ok: true, preMerged: ['t1'], lateFixCharges: { 'p3-t1': 5 } })
  assert.ok(resumed.logs.some(l => /late-fix charge: task t1 resumes at fixRounds 5/.test(l)), 'the seed is logged')
  assert.deepEqual(lateWorkers(resumed.calls).map(labelOf), ['late-fix:t1:r6'], 'one round left under run.roundLimit 6')
  assert.ok(lateWorkers(resumed.calls)[0].prompt.includes('Late-Fix: t1:6'))
  assert.equal(lateHolds(resumed.out)[0].fixRounds, 6)
  const barrier = resumed.calls.find(c => c.opts.dispatchKind === 'provision-barrier')
  assert.ok(barrier.prompt.includes('LATE-FIX CHARGE READ (per preMerged task)'), 'the recovery barrier asks for the read')
  // The barrier prompt documents the bare task-id key, so the bare key seeds exactly like the p<phase>- key.
  const bare = await run({ ok: true, preMerged: ['t1'], lateFixCharges: { t1: 5 } })
  assert.ok(bare.logs.some(l => /late-fix charge: task t1 resumes at fixRounds 5/.test(l)), 'the bare key seeds')
  assert.deepEqual(lateWorkers(bare.calls).map(labelOf), ['late-fix:t1:r6'], 'the bare key leaves one round')
  // Mirror: another task's key never seeds this task.
  const foreign = await run({ ok: true, preMerged: ['t1'], lateFixCharges: { t2: 5 } })
  assert.ok(!foreign.logs.some(l => /late-fix charge: task t1 /.test(l)), 'a foreign key never seeds or logs for t1')
  assert.equal(lateWorkers(foreign.calls)[0].opts.label, 'late-fix:t1:r1')
  // A malformed value (string, fraction, zero, null) never seeds, and the drop is logged.
  for (const bad of ['5', 2.5, 0, null]) {
    const m = await run({ ok: true, preMerged: ['t1'], lateFixCharges: { 'p3-t1': bad } })
    assert.ok(m.logs.some(l => l.includes('late-fix charge: task t1 lateFixCharges value ' + JSON.stringify(bad) + ' is malformed — fixRounds not seeded (logged, never silent).')), 'malformed ' + JSON.stringify(bad) + ' is logged')
    assert.ok(!m.logs.some(l => /late-fix charge: task t1 resumes/.test(l)), 'malformed ' + JSON.stringify(bad) + ' never seeds')
    assert.equal(lateWorkers(m.calls)[0].opts.label, 'late-fix:t1:r1')
  }
  // The seed never lowers a higher count the task already holds.
  const higher = await runPhase(PROVISION_ARGS({ phase: ES_PHASE, tasks: [LATE_TASK({ fixRounds: 6 })], recovery: { sanctioned: true } }), (p, o) => o.dispatchKind === 'provision-barrier' ? { ok: true, preMerged: ['t1'], lateFixCharges: { 'p3-t1': 5 } } : lateFixImpl({ rejects: 99 })(p, o))
  assert.ok(higher.logs.some(l => /late-fix charge: task t1 resumes at fixRounds 6/.test(l)), 'the higher count stays')
  assert.deepEqual(lateWorkers(higher.calls), [], 'no round left under run.roundLimit 6')
  assert.equal(lateHolds(higher.out)[0].fixRounds, 6)
  // Control: no charge read ⇒ a fresh budget, so the first trailer is t1:1.
  const fresh = await run({ ok: true, preMerged: ['t1'] })
  assert.equal(lateWorkers(fresh.calls)[0].opts.label, 'late-fix:t1:r1')
  const plain = await runPhase(LATE_FIX_ARGS(), defaultImpl)
  assert.ok(!plain.calls.find(c => c.opts.dispatchKind === 'provision-barrier').prompt.includes('LATE-FIX CHARGE READ'), 'a non-recovery barrier never asks')
})

test('late-defect: charge — the barrier read spelling, run through bash on a real repo, reads the highest index of the task\'s own single-parent commits after its merge commit', async () => {
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [LATE_TASK()], recovery: { sanctioned: true } }), barrierEnv({ ok: true }))
  const prompt = calls.find(c => c.opts.dispatchKind === 'provision-barrier').prompt
  const cmd = prompt.match(/LATE-FIX CHARGE READ \(per preMerged task\): [^`]*`([^`]+)`/)[1]
  const dir = mkdtempSync(join(tmpdir(), 'late-fix-charge-'))
  const env = { ...process.env, HOME: dir, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'F', GIT_AUTHOR_EMAIL: 'f@example.invalid', GIT_COMMITTER_NAME: 'F', GIT_COMMITTER_EMAIL: 'f@example.invalid' }
  const g = (...a) => { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8', env }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  const put = (f, t) => { writeFileSync(join(dir, f), t + '\n'); g('add', '-A') }
  try {
    g('init', '-q', '-b', 'integration/wtprov-a/phase-3'); put('base', 'b'); g('commit', '-q', '-m', 'base')
    g('checkout', '-q', '-b', 'war/wtprov-a/p3-t1'); put('src-a', 'task'); g('commit', '-q', '-m', 'task work\n\nLate-Fix: t1:9')
    g('checkout', '-q', 'integration/wtprov-a/phase-3'); g('merge', '-q', '--no-ff', '-m', 'Merge t1\n\nWAR-Task: war/wtprov-a/p3-t1', 'war/wtprov-a/p3-t1')
    const M = g('rev-parse', 'HEAD')
    put('src-a', 'fix 1'); g('commit', '-q', '-m', 'late fix 1\n\nLate-Fix: t1:2')
    put('other', 'x'); g('commit', '-q', '-m', 'sibling late fix\n\nLate-Fix: t2:8')
    g('checkout', '-q', '-b', 'side'); put('side', 's'); g('commit', '-q', '-m', 'side\n\nLate-Fix: t1:8')
    g('checkout', '-q', 'integration/wtprov-a/phase-3'); g('merge', '-q', '--no-ff', '-m', 'Merge side\n\nLate-Fix: t1:7', 'side')
    put('src-a', 'fix 3'); g('commit', '-q', '-m', 'late fix 3\n\nLate-Fix: t1:3')
    const filled = cmd.replace("<that task's repo>", dir).replace('<M>', M)
    const r = spawnSync('bash', ['-c', filled], { encoding: 'utf8', env })
    assert.equal(r.status, 0, r.stderr)
    const values = r.stdout.split('\n').map(s => s.trim()).filter(Boolean)
    assert.equal(highestFor(values, 't1'), 3, 'single-parent first-parent commits after M only: the pre-merge t1:9, the side-branch t1:8 and the merge commit t1:7 never count, another task never counts')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('late-defect: charge — the late-fix merge trailer check spelling, run through bash on a real repo, names a fast-forwarded commit with no Late-Fix trailer', async () => {
  const { calls } = await runPhase(LATE_FIX_ARGS(), lateFixImpl())
  const prompt = calls.find(c => labelOf(c) === 'merge:p3-latefix-1').prompt
  const m = prompt.match(/Before step \(b\), run (git -C \S+ log --format='[^']+' \S+); if any line carries no t1:<n> value/)
  assert.ok(m, 'the merge prompt carries the trailer check')
  const dir = mkdtempSync(join(tmpdir(), 'late-fix-trailer-'))
  const env = { ...process.env, HOME: dir, GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 'F', GIT_AUTHOR_EMAIL: 'f@example.invalid', GIT_COMMITTER_NAME: 'F', GIT_COMMITTER_EMAIL: 'f@example.invalid' }
  const g = (...a) => { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8', env }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim() }
  try {
    g('init', '-q', '-b', 'integration/wtprov-a/phase-3'); g('commit', '-q', '--allow-empty', '-m', 'base')
    g('checkout', '-q', '-b', 'war/wtprov-a/p3-latefix-1'); g('commit', '-q', '--allow-empty', '-m', 'late fix\n\nLate-Fix: t1:1')
    const fix = g('rev-parse', 'HEAD')
    g('commit', '-q', '--allow-empty', '-m', 'split')
    const bare = g('rev-parse', 'HEAD')
    const r = spawnSync('bash', ['-c', m[1].replace('/abs/repo/.claude/worktrees/run-2026/p3-latefix-1', dir)], { encoding: 'utf8', env })
    assert.equal(r.status, 0, r.stderr)
    const lines = new Map(r.stdout.split('\n').filter(Boolean).map(l => [l.slice(0, 40), l.slice(41).trim()]))
    assert.equal(lines.size, 2, 'one line per commit in integration..lfBranch')
    assert.equal(lines.get(fix), 't1:1', 'the trailered commit shows its bare value')
    assert.equal(lines.get(bare), '', 'the bare commit shows no value, so the refiner can name it')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// The late-fix re-audit's own Minor/Nit rows (PIN-1: a late defect is never dropped). lateReauditImpl
// answers the late-fix re-audit per round: `rows[i]` rides round i+1, request_changes (one Major) for
// the first `rejects` rounds, approve after. Everything else rides lateFixImpl.
const LF_SWEEP_ARGS = (over = {}) => LATE_FIX_ARGS({ audit: { roster: [{ lens: 'correctness' }] }, run: { ace: true }, ...over })
const lfRow = (over = {}) => ({ severity: 'Minor', title: 'lf row', file: 'src/a.js', rationale: 'r', ...over })
const LF_ASK = lfRow({ title: 'lf ask', disposition: 'ask', ask: { question: 'keep or drop the row?', fork: ['keep', 'drop'] } })
const LF_FOLLOW_UP = lfRow({ title: 'lf follow-up', disposition: 'follow-up', barrier: 'barrier:underspecified' })
const LF_NOTE = lfRow({ title: 'lf note', severity: 'Nit', disposition: 'note', findingClass: 'cosmetic' })
const LF_ABSORB = lfRow({ title: 'lf absorb', disposition: 'absorb', suggested_fix: 'rename the row' })
const lateReauditImpl = (rows, { rejects = 0 } = {}) => {
  const base = lateFixImpl()
  let round = 0
  return (p, o) => {
    if (!/^audit:p\d+-latefix-/.test(labelOf({ opts: o }))) return base(p, o)
    const n = ++round
    const minors = rows[n - 1] || []
    return n <= rejects
      ? { seat: o.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Major', title: 'fix incomplete', file: 'src/a.js', rationale: 'r', suggested_fix: 'add the missing row' }, ...minors] }
      : { seat: o.label, lens: 'correctness', verdict: 'approve', confidence: 'high', findings: minors }
  }
}
const askOf = (out, title) => (out.asks || []).filter(a => a && a.finding && a.finding.title === title)
const noteOf = (out, title) => (out.notes || []).filter(n => n && n.title === title)
const isRouted = (out, title) => askOf(out, title).length > 0 || !!demotionOf(out, title) || noteOf(out, title).length > 0

test('late-defect: route — the late-fix re-audit Minor/Nit rows walk the shared ladder under the origin task: an ask parks, a follow-up files, a note notes, an absorb rides the sweep, and none stays only in auditLog', async () => {
  const { out, calls, logs } = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl([[LF_ASK, LF_FOLLOW_UP, LF_NOTE, LF_ABSORB]]), PROBE)
  assert.equal(out.landDecision, 'landed')
  const row = out.auditLog.find(e => e.verdict === 'late-fix:approve')
  assert.deepEqual(row.findings.map(f => f.title), ['lf ask', 'lf follow-up', 'lf note', 'lf absorb'], 'the auditLog row still records the round')
  const parked = askOf(out, 'lf ask')
  assert.equal(parked.length, 1, 'the ask is parked for the Checkpoint ruling')
  assert.equal(parked[0].task, 't1', 'under the origin task, never the latefix pseudo id')
  assert.equal(parked[0].question, 'keep or drop the row?')
  const filed = demotionOf(out, 'lf follow-up')
  assert.ok(filed && filed.task === 't1' && filed.barrier === 'barrier:underspecified', 'the barrier follow-up is filed on the origin task')
  assert.equal(noteOf(out, 'lf note').length, 1, 'the cosmetic note keeps its route (notes)')
  assert.ok(polishPromptOf(calls).includes('lf absorb'), 'the absorb rides the phase-close sweep')
  assert.ok(!demotionOf(out, 'lf absorb') && noteOf(out, 'lf absorb').length === 0 && askOf(out, 'lf absorb').length === 0, 'the absorb is neither filed, noted nor parked')
  assert.ok(logs.some(l => /Re-entry routing: \[Minor\] "lf absorb" \(task t1\) → phaseClose sweep — born at the late-fix re-audit of p3-latefix-1 for task t1/.test(l)), 'the sweep route names the late-fix re-audit as the row\'s birthplace')
  for (const t of ['lf ask', 'lf follow-up', 'lf note']) assert.ok(!polishPromptOf(calls).includes(t), `"${t}" never joins the sweep`)
})

test('late-defect: route — a rejected late-fix round routes its Minor/Nit rows too, a re-raise in the next round corroborates the first record, and dropping the route call leaves every row unrouted', async () => {
  // Round 1 rejects with the four rows; round 2 approves and raises the ask and the follow-up again.
  const rows = [[LF_ASK, LF_FOLLOW_UP, LF_NOTE, LF_ABSORB], [LF_ASK, LF_FOLLOW_UP]]
  const { out, calls, logs } = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl(rows, { rejects: 1 }), PROBE)
  assert.equal(out.landDecision, 'landed')
  assert.deepEqual(lateWorkers(calls).map(labelOf), ['late-fix:t1:r1', 'late-fix:t1:r2'])
  assert.equal(askOf(out, 'lf ask').length, 1, 'one parked ask survives both rounds')
  assert.ok(logs.some(l => /ask collision merged as corroboration: "keep or drop the row\?" \(task t1\)/.test(l)), 'the round-2 re-raise is recorded as corroboration')
  assert.equal((out.minorsFiled || []).filter(m => m && m.title === 'lf follow-up').length, 1, 'one filed follow-up, never a second record')
  assert.ok(logs.some(l => /re-audit re-mint of "lf follow-up" \(task t1\)/.test(l)), 'the round-2 re-raise is logged as a re-mint')
  assert.equal(noteOf(out, 'lf note').length, 1, 'the rejected round\'s note reaches notes')
  assert.ok(polishPromptOf(calls).includes('lf absorb'), 'the rejected round\'s absorb rides the sweep')
  // Red proof by mutation: the engine without the route call records the rows only in auditLog.
  const call = 'routeReauditMinors(lfRecord, seats, { noReentry: lfNoReentry, diff: lfDiff && new Set([...(diffFilesOf(origin) || []), ...lfDiff]) })'
  assert.ok(src.includes(call), 'the mutation target is the live route call')
  const mutated = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl([[LF_ASK, LF_FOLLOW_UP, LF_NOTE, LF_ABSORB]]), PROBE, src.replace(call, ''))
  assert.equal(mutated.out.landDecision, 'landed', 'the mutant still lands, so a green land never proves the route')
  assert.equal(mutated.out.auditLog.find(e => e.verdict === 'late-fix:approve').findings.length, 4, 'the mutant still records the rows in auditLog')
  for (const t of ['lf ask', 'lf follow-up', 'lf note', 'lf absorb']) assert.ok(!isRouted(mutated.out, t) && !polishPromptOf(mutated.calls).includes(t), `without the route call "${t}" is dropped — the rows above prove the call`)
})

test('late-defect: route — a preMerged origin task has no wave record, and the late-fix re-audit rows still route under it', async () => {
  const args = PROVISION_ARGS({ phase: ES_PHASE, tasks: [LATE_TASK()], audit: { roster: [{ lens: 'correctness' }] }, recovery: { sanctioned: true } })
  const base = lateReauditImpl([[LF_ASK, LF_FOLLOW_UP]])
  const impl = (p, o) => o.dispatchKind === 'provision-barrier' ? { ok: true, preMerged: ['t1'] } : base(p, o)
  const { out, calls } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'landed')
  assert.ok(!calls.some(c => /^audit:t1:/.test(labelOf(c))), 'no wave audit ran, so the origin has no wave record')
  assert.deepEqual(lateWorkers(calls).map(labelOf), ['late-fix:t1:r1'])
  assert.equal(askOf(out, 'lf ask').length, 1, 'the ask parks under the preMerged origin')
  assert.equal(askOf(out, 'lf ask')[0].task, 't1')
  const filed = demotionOf(out, 'lf follow-up')
  assert.ok(filed && filed.task === 't1', 'the follow-up files under the preMerged origin')
})

// #2622 (operator ruling 2026-11-08): each late-fix round runs its own diff probe, and the re-audit
// rows judge in-diff against the union of the origin's probe and the late-fix probe. A failed
// late-fix probe falls back to the origin's probe alone. LF_PROBES answers the wave probe with the
// origin's file and the late-fix probe (label diff-probe:p3-latefix-1) with `lf`.
const LF_PROBES = lf => ({ 'diff-probe': (p, o) => o.label === 'diff-probe:p3-latefix-1' ? lf : { diff_files: ['src/a.js'] } })
const LF_NOTE_FIX = (title, file) => lfRow({ title, file, severity: 'Nit', disposition: 'note', findingClass: 'cosmetic', suggested_fix: 'reword the line' })
const lfProbeCalls = calls => calls.filter(c => c.opts.label === 'diff-probe:p3-latefix-1')

test('late-defect: route #2622 — a late-fix round probes its own diff, so a note with a fix on a late-fix-only file is absorbed, and an origin-file note keeps its in-diff route', async () => {
  const rows = [[LF_NOTE_FIX('lf only note', 'src/lf-only.js'), LF_NOTE_FIX('lf origin note', 'src/a.js')]]
  const { out, calls, logs } = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl(rows), LF_PROBES({ diff_files: ['./src/lf-only.js'] }))
  assert.equal(out.landDecision, 'landed')
  const probes = lfProbeCalls(calls)
  assert.equal(probes.length, 1, 'one late-fix probe per late-fix round')
  assert.match(probes[0].prompt, /git -C \S+\/p3-latefix-1 diff --name-only integration\/\S+\.\.\.abcdef1 /, 'the probe diffs the integration branch to the round head_sha in the late-fix worktree')
  for (const t of ['lf only note', 'lf origin note']) {
    assert.ok(polishPromptOf(calls).includes(t), `"${t}" rides the sweep as an absorb`)
    assert.equal(noteOf(out, t).length, 0, `"${t}" does not stay a note`)
  }
  assert.ok(logs.some(l => /intake floor REROUTED: \[Nit\] "lf only note" \(task t1\)/.test(l)), 'the intake floor names the reroute')
})

test('late-defect: route #2622 — a preMerged origin has no probe, and the late-fix probe still lets a barrier-less follow-up reroute to absorb without floorSkipped', async () => {
  const args = PROVISION_ARGS({ phase: ES_PHASE, tasks: [LATE_TASK()], audit: { roster: [{ lens: 'correctness' }] }, recovery: { sanctioned: true } })
  const base = lateReauditImpl([[lfRow({ title: 'lf bare follow-up', disposition: 'follow-up', suggested_fix: 'drop the dead branch' })]])
  const impl = (p, o) => o.dispatchKind === 'provision-barrier' ? { ok: true, preMerged: ['t1'] } : base(p, o)
  const { out, calls } = await runPhase(args, impl, LF_PROBES({ diff_files: ['src/a.js'] }))
  assert.equal(out.landDecision, 'landed')
  assert.ok(!calls.some(c => c.opts.label === 'diff-probe:t1'), 'the preMerged origin ran no wave probe')
  assert.equal(lfProbeCalls(calls).length, 1)
  const filed = (out.minorsFiled || []).filter(m => m && m.title === 'lf bare follow-up')
  assert.equal(filed.length, 0, 'the barrier-less follow-up is not filed')
  assert.ok(polishPromptOf(calls).includes('lf bare follow-up'), 'it reroutes to absorb and rides the sweep')
})

test('late-defect: route #2622 — schemas.md and refiner-recovery.md name the late-fix round probe beside the per-task one', () => {
  assert.match(refinerRecoveryMd, /## Diff probe\n[^]*?one \*\*`diff-probe:<late-fix id>`\*\* per round[^\n]*\(#2622\)/, 'the refiner § Diff probe names the late-fix probe')
  assert.match(schemasMd, /## DiffProbeResult[^\n]*per late-fix round, after its re-audit\)/, 'the heading names both sites')
  assert.match(schemasMd, /one `diff-probe:<late-fix id>` per round[^\n]*\(#2622\)/, 'the paragraph names the late-fix probe and the ruling')
  assert.ok(src.includes("await probeDiff(lfTask, ph.integrationBranch, w.head_sha)"), 'the engine dispatches the probe the docs describe')
})

test('late-defect: route #2622 — a failed late-fix probe falls back to the origin probe, logged, and a mutant without the fallback reroutes wrong', async () => {
  const rows = [[LF_NOTE_FIX('lf only note', 'src/lf-only.js'), LF_NOTE_FIX('lf origin note', 'src/a.js')]]
  const failed = LF_PROBES({ detail: 'fatal: bad revision' })
  const { out, calls, logs } = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl(rows), failed)
  assert.equal(out.landDecision, 'landed')
  assert.equal(lfProbeCalls(calls).length, 1, 'the late-fix probe ran')
  assert.ok(logs.some(l => /^p3-latefix-1: no late-fix probe, so task t1's probe, if any, judges in-diff\.$/.test(l)), 'the fallback is logged')
  assert.equal(noteOf(out, 'lf only note').length, 1, 'today\'s route: a late-fix-only file is out of diff, so the note stays a note')
  assert.ok(polishPromptOf(calls).includes('lf origin note'), 'today\'s route: an origin-file note is in diff and absorbs')
  // Red proof by mutation: an empty set in place of the fallback puts the origin file out of diff.
  const call = 'diff: lfDiff && new Set([...(diffFilesOf(origin) || []), ...lfDiff])'
  assert.ok(src.includes(call), 'the mutation target is the live union')
  const mutated = await runPhase(LF_SWEEP_ARGS(), lateReauditImpl(rows), failed, src.replace(call, 'diff: new Set(lfDiff || [])'))
  assert.equal(noteOf(mutated.out, 'lf origin note').length, 1, 'without the fallback the origin-file note stays a note')
})

test('late-defect: hold — the docs name the pass, the hold, carriedTasks and the trailer, and point at land-decision.mjs for the reason list', () => {
  assert.match(schemasMd, /carriedTasks: \[/, 'schemas.md documents the carriedTasks return')
  assert.match(schemasMd, /late-fix pass/i)
  assert.match(schemasMd, /Late-Fix: <task id>:<n>/)
  assert.match(schemasMd, /`late-defect`[^\n]*land-decision\.mjs/, 'the hold points at the export for the reason list')
  assert.match(refinerMd, /dispatchKind: late-fix-worktree/, 'the refiner card names the late-fix worktree kind')
  assert.ok(src.includes("dispatchKind: 'late-fix-worktree'"), 'the dispatched provision carries the same kind')
})
