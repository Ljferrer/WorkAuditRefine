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
  assert.ok(merge && /git merge war\/wtprov-a\/p3-latefix-1 \(fast-forward merge\)/.test(merge.prompt), 'the refiner fast-forwards the late-fix branch in _refinery')
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
    g('checkout', '-q', '-b', 'side'); put('side', 's'); g('commit', '-q', '-m', 'side')
    g('checkout', '-q', 'integration/wtprov-a/phase-3'); g('merge', '-q', '--no-ff', '-m', 'Merge side\n\nLate-Fix: t1:7', 'side')
    put('src-a', 'fix 3'); g('commit', '-q', '-m', 'late fix 3\n\nLate-Fix: t1:3')
    const filled = cmd.replace("<that task's repo>", dir).replace('<M>', M)
    const r = spawnSync('bash', ['-c', filled], { encoding: 'utf8', env })
    assert.equal(r.status, 0, r.stderr)
    const values = r.stdout.split('\n').map(s => s.trim()).filter(Boolean)
    assert.equal(highestFor(values, 't1'), 3, 'single-parent first-parent commits after M only: the pre-merge t1:9 and the merge commit t1:7 never count, another task never counts')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('late-defect: hold — the docs name the pass, the hold, carriedTasks and the trailer, and point at land-decision.mjs for the reason list', () => {
  assert.match(schemasMd, /carriedTasks: \[/, 'schemas.md documents the carriedTasks return')
  assert.match(schemasMd, /late-fix pass/i)
  assert.match(schemasMd, /Late-Fix: <task id>:<n>/)
  assert.match(schemasMd, /`late-defect`[^\n]*land-decision\.mjs/, 'the hold points at the export for the reason list')
  assert.match(refinerMd, /dispatchKind: late-fix-worktree/, 'the refiner card names the late-fix worktree kind')
  assert.ok(src.includes("dispatchKind: 'late-fix-worktree'"), 'the dispatched provision carries the same kind')
})
