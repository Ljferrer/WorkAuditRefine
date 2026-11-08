// Late defects fixed in the run — carry intake: args.seededTasks (part 5)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 6.1 (D9, PIN-9): a carriedTasks row the prior phase
// returned comes back as args.seededTasks. Entry validation checks each row and the #1413 provenance
// floor; a refused row holds at entry with zero spawns. Each row becomes one task (Files: the defect's
// file, the slice the defect and its fix, requiresTest true, the origin task's roster), unless another
// task in the phase owns the file: then the defect joins that task's slice, so the phase stays
// file-disjoint. A seeded task that runs out of fix rounds follows the late-fix cap rule (PIN-20).
import { test } from 'node:test'
import {
  assert,
  src,
  schemasMd,
  runPhase,
  seatOf,
  defaultImpl,
  isWorker,
  PROVISION_ARGS,
  PROVISION_LIST,
  GA_MAJOR,
  LATE_FIX_ARGS,
  lateFixImpl,
} from './workflow-template.test-harness.mjs'

const labelOf = c => c.opts.label || ''
const workerOf = (calls, id) => calls.find(c => isWorker(c) && labelOf(c) === 'work:' + id)
// The next phase of the PROVISION_ARGS fixture plan, with one ordinary task t9 on its own file.
const P4 = { id: 4, title: 'P4', integrationBranch: 'integration/wtprov-a/phase-4', workingBranch: 'dev/wtprov-a' }
const T9 = (over = {}) => ({ id: 't9', issue: 109, title: 'Task nine', planSlice: 'slice 9', roster: [{ lens: 'test-fidelity' }], files: ['src/z.js'], ...over })
const NEXT = (seededTasks, over = {}) => PROVISION_ARGS({ phase: P4, tasks: [T9()], seededTasks, ...over })
// One carried row as the late-fix pass stamps it (the GA_MAJOR replay of AutoIndex f65e7e37).
const ROW = (over = {}) => ({ ...GA_MAJOR(), task: 't1', seat: 'gate-audit:t1:execution-evidence', findingClass: 'behavior', fixRounds: 2,
  planSlug: 'wtprov-a', roster: [{ lens: 'correctness', depth: 'deep' }], carriedFrom: { phase: 3, reason: 'the fix budget is spent' }, ...over })

test('late-defect: carry round trip — a carriedTasks row from a spent non-final late fix seeds one task in the next phase', async () => {
  const prior = await runPhase(LATE_FIX_ARGS({ run: { roundLimit: 2 }, finalPhase: false }), lateFixImpl({ rejects: 99 }))
  assert.equal(prior.out.carriedTasks.length, 1, 'presence guard: the prior phase carried one row')
  const carried = JSON.parse(JSON.stringify(prior.out.carriedTasks))
  assert.deepEqual(carried[0].roster, [{ lens: 'correctness', depth: 'deep' }], 'the carried row names the origin task roster')
  const { out, calls, logs } = await runPhase(NEXT(carried), defaultImpl)
  const w = workerOf(calls, 'seed-1')
  assert.ok(w, 'the seeded task runs its own worker')
  assert.ok(w.prompt.includes(GA_MAJOR().title) && w.prompt.includes(GA_MAJOR().suggested_fix), 'the slice is the defect and its fix')
  assert.ok(w.prompt.includes('/abs/repo/.claude/worktrees/run-2026/p4-seed-1') && w.prompt.includes('war/wtprov-a/p4-seed-1'), 'the branch and worktree derive like any task')
  const seats = calls.filter(c => seatOf(c.opts) === 'war-auditor' && /^audit:seed-1:/.test(labelOf(c))).map(labelOf)
  assert.deepEqual(seats, ['audit:seed-1:correctness'], 'the roster is the origin task roster')
  assert.ok(calls.some(c => labelOf(c) === 'gate-audit:seed-1:execution-evidence'), 'requiresTest: true sends it to the gate-audit pass')
  assert.ok(out.landed.includes('seed-1') && out.landed.includes('t9'), 'both tasks merge')
  assert.equal(out.landDecision, 'landed')
  assert.ok(logs.some(l => /^seeded task seed-1: the carried late defect \[Major\] "mapped test never ran" of task t1 \(src\/a\.test\.js\)/.test(l)), 'the synthesis is logged')
  // A seed whose origin task sits in this phase and has no stamped roster borrows that task's roster.
  const own = await runPhase(NEXT([ROW({ task: 't9', roster: undefined })]), defaultImpl)
  assert.deepEqual(own.calls.filter(c => /^audit:seed-1:/.test(labelOf(c))).map(labelOf), ['audit:seed-1:test-fidelity'])
  // No stamped roster and no origin in the phase: the audit.roster fallback, logged.
  const dflt = await runPhase(NEXT([ROW({ roster: undefined })], { audit: { roster: [{ lens: 'security' }] } }), defaultImpl)
  assert.deepEqual(dflt.calls.filter(c => /^audit:seed-1:/.test(labelOf(c))).map(labelOf), ['audit:seed-1:security'])
  assert.ok(dflt.logs.some(l => l.includes('(roster: audit.roster)')), 'the fallback is logged')
  // Absent seeds: byte-identical task list (control).
  const none = await runPhase(NEXT(undefined), defaultImpl)
  assert.ok(!none.calls.some(c => /seed-/.test(labelOf(c))), 'no seed, no seeded task')
  // A plan task already named seed-1: the seed id takes the -1 suffix, so no two tasks share an id.
  const clash = await runPhase(NEXT([ROW()], { tasks: [{ ...T9(), id: 'seed-1' }] }), defaultImpl)
  const sw = workerOf(clash.calls, 'seed-1-1')
  assert.ok(sw && sw.prompt.includes(GA_MAJOR().suggested_fix), 'the seed runs as seed-1-1 with the defect slice')
  assert.ok(!workerOf(clash.calls, 'seed-1').prompt.includes(GA_MAJOR().suggested_fix), 'the plan task seed-1 keeps its own slice')
  // Red proof by mutation: without the suffix loop the seed reuses the plan task id.
  const loop = "while (tasks.some(t => t.id === id)) id += '-1'"
  assert.ok(src.includes(loop), 'the mutation target is the live suffix loop')
  const noLoop = await runPhase(NEXT([ROW()], { tasks: [{ ...T9(), id: 'seed-1' }] }), defaultImpl, {}, src.replace(loop, ''))
  assert.ok(!workerOf(noLoop.calls, 'seed-1-1'), 'the mutant mints no seed-1-1')
})

// A seeded task that merges and then draws a late defect carries that defect under the seed's first
// origin task (t.seed.task), never its seed id, on both carry arms: the late-fix pass (a gate-audit
// Major whose fix budget runs out) and carryLate (a baseline red first found at the land gate).
test('late-defect: carry seed origin — a late defect on a merged seeded task carries under the first origin task', async () => {
  const lf = lateFixImpl({ rejects: 99 })
  const gaSeedOnly = (p, o) => /^gate-audit:t9:/.test(o.label || '') ? defaultImpl(p, o) : lf(p, o)
  const landRed = { mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['test_land_only'], gate_base_sha: 'landbase1', gate_output: 'red at origin too' }
  const landRedImpl = (p, o) => (o.label || '') === 'land:phase-4' ? landRed : defaultImpl(p, o)
  const arms = source => Promise.all([
    runPhase(NEXT([ROW({ fixRounds: 0 })], { run: { roundLimit: 2 }, finalPhase: false }), gaSeedOnly, {}, source),
    runPhase(NEXT([ROW()], { tasks: [], finalPhase: false }), landRedImpl, {}, source),
  ])
  const [pass, late] = await arms()
  assert.ok(pass.calls.some(c => /^late-fix:seed-1:r2$/.test(labelOf(c))), 'presence guard: the late-fix pass spent the seed budget')
  assert.deepEqual(pass.out.carriedTasks.map(t => [t.title, t.task, t.raisedTask]), [[GA_MAJOR().title, 't1', 'seed-1']], 'the late-fix pass carries under t1 and keeps the raiser')
  assert.deepEqual(late.out.carriedTasks.map(t => [t.title, t.task]), [['baseline gate red: test_land_only', 't1']], 'carryLate carries under t1')
  // Control: a plan task origin keeps its own id.
  const plan = await runPhase(NEXT(undefined, { finalPhase: false }), landRedImpl)
  assert.deepEqual(plan.out.carriedTasks.map(t => t.task), ['t9'], 'a plan task origin carries under its own id')
  // Red proof by mutation: a carryTaskOf that returns the seed id drops t1 on both arms.
  const helper = 'const carryTaskOf = t => t.seed ? t.seed.task : t.id'
  assert.ok(src.includes(helper), 'the mutation target is the live helper')
  const [mPass, mLate] = await arms(src.replace(helper, 'const carryTaskOf = t => t.id'))
  assert.equal(mPass.out.carriedTasks[0].task, 'seed-1', 'the mutant late-fix pass carries the seed id')
  assert.equal(mLate.out.carriedTasks[0].task, 'seed-1', 'the mutant carryLate carries the seed id')
})

test('late-defect: carry fold — a seeded row whose file another task owns joins that task slice, so the phase stays file-disjoint', async () => {
  const { out, calls, logs } = await runPhase(NEXT([ROW()], { tasks: [T9({ files: ['./src/a.test.js'] })] }), defaultImpl)
  assert.ok(!calls.some(c => /seed-/.test(labelOf(c))), 'no seeded task is made')
  const w = workerOf(calls, 't9')
  assert.ok(w.prompt.includes('CARRIED DEFECT (PIN-9)') && w.prompt.includes(GA_MAJOR().suggested_fix), 'the defect and its fix ride the owner slice')
  assert.ok(w.prompt.includes('slice 9'), 'the owner keeps its own slice')
  assert.ok(logs.some(l => l.includes('joins task t9') && l.includes('(src/a.test.js)')), 'the fold is logged')
  assert.equal(out.landDecision, 'landed')
  // Two seeds on one unowned file: the first becomes a task, the second joins its slice.
  const two = await runPhase(NEXT([ROW(), ROW({ title: 'second defect', suggested_fix: 'fix the second' })]), defaultImpl)
  assert.ok(workerOf(two.calls, 'seed-1'), 'the first seed is a task')
  assert.ok(!workerOf(two.calls, 'seed-2'), 'the second is not')
  assert.ok(workerOf(two.calls, 'seed-1').prompt.includes('fix the second'), 'it rides the first seed slice')
  // A fileless row (the baseline row) cannot collide, so it is always its own task.
  const fileless = await runPhase(NEXT([ROW({ file: null, title: 'baseline gate red: x' }), ROW({ file: null, title: 'baseline gate red: y' })]), defaultImpl)
  assert.ok(workerOf(fileless.calls, 'seed-1') && workerOf(fileless.calls, 'seed-2'), 'two fileless seeds, two tasks')
  // Red proof by mutation: without the owner check both rows become tasks on one file.
  const check = 'owner = file && tasks.find('
  assert.ok(src.includes(check), 'the mutation target is the live owner check')
  const mutated = await runPhase(NEXT([ROW(), ROW({ title: 'second defect' })]), defaultImpl, {}, src.replace(check, 'owner = null && tasks.find('))
  assert.ok(workerOf(mutated.calls, 'seed-1') && workerOf(mutated.calls, 'seed-2'), 'the mutant makes two tasks on one file')
})

test('late-defect: carry entry — a malformed seededTasks row holds at entry with zero spawns', async () => {
  const good = ROW()
  for (const [bad, msg, over] of [
    ['nope', 'args.seededTasks must be an array of carried rows'],
    [['x'], 'args.seededTasks[0] must be a finding row object'],
    [[{ ...good, title: '' }], 'args.seededTasks[0].title must be a non-empty string'],
    [[{ ...good, severity: undefined }], 'args.seededTasks[0].severity must be a non-empty string'],
    [[{ ...good, file: 5 }], 'args.seededTasks[0].file must be a repo-relative path string or null'],
    [[{ ...good, task: undefined }], 'args.seededTasks[0].task is malformed'],
    [[{ ...good, findingClass: 'style' }], 'args.seededTasks[0].findingClass is malformed'],
    [[{ ...good, suggested_fix: 7 }], 'args.seededTasks[0].suggested_fix is malformed'],
    [[{ ...good, roster: 'correctness' }], 'args.seededTasks[0].roster is malformed'],
    [[good], 'beside an args.tasks array', { tasks: undefined }],
    [[{ ...good, planSlug: 'other-plan' }], 'args.seededTasks carries a planSlug provenance stamp naming a foreign plan (other-plan)'],
    [[{ ...good, planSlug: undefined }], "args.seededTasks contains none of the run's own plan-slug tokens"],
    [[{ ...good, roster: undefined }], 'args.seededTasks[0] has no roster'],
    [[{ ...good, roster: [{ lens: 'a' }, { lens: 'a' }] }], 'task seed-1: invalid roster'],
  ]) {
    const r = await runPhase(NEXT(bad, over), defaultImpl)
    assert.equal(r.out.landDecision, 'held:workflow-error', JSON.stringify(bad) + ' is refused at entry')
    assert.ok(r.out.workflowError.message.includes(msg), 'the refusal names the field: ' + msg + ' — got ' + r.out.workflowError.message)
    assert.equal(r.calls.length, 0, 'zero agents')
  }
  // A seed-only phase needs plan.file like any tasks-bearing launch.
  const planless = await runPhase(NEXT([good], { tasks: [], plan: { gate: 'make gate' } }), defaultImpl)
  assert.equal(planless.out.landDecision, 'held:workflow-error')
  assert.ok(planless.out.workflowError.message.includes('requires plan.file'))
  // A foreign plan path inside the row prose launches (the seededPhaseClose discipline, #2208).
  const path = await runPhase(NEXT([{ ...good, rationale: 'see docs/plans/other-plan.md' }]), defaultImpl)
  assert.equal(path.out.landDecision, 'landed')
})

// The seeded task audit never clears: each fix makes a new sha and a new blocker, so the loop reaches
// the cap (#2330) and never the PIN-29 unchanged-survivor hold. Task t9 approves, or escalates.
const capImpl = ({ t9 = 'approve' } = {}) => {
  let fixes = 0
  return (prompt, opts) => {
    const label = labelOf({ opts })
    if (seatOf(opts) === 'war-worker' && /^fix:seed-1:/.test(label)) return { task_id: 'seed-1', status: 'implemented', head_sha: 'f1ced00' + (++fixes), tests: { unit: 1 } }
    if (/^audit:seed-1:/.test(label)) {
      const sha = (prompt.match(/AUDIT PIN: the worker reports commit ([0-9a-f]+)/) || [])[1] || 'deadbeef'
      return { seat: label, lens: 'correctness', audit_sha: sha, verdict: 'request_changes', confidence: 'high',
        findings: [{ severity: 'Major', title: 'blocker at ' + sha, file: 'src/a.test.js', rationale: 'r', suggested_fix: 'fix it' }] }
    }
    if (t9 === 'escalate' && /^audit:t9:/.test(label)) return { seat: label, lens: 'test-fidelity', verdict: 'escalate', escalate_reason: 'a decision fork', findings: [], confidence: 'high' }
    return defaultImpl(prompt, opts)
  }
}
const holdsOf = (out, reason) => (out.escalated || []).filter(e => e && e.reason === reason)

test('late-defect: carry cap — a seeded task out of fix rounds carries again on a non-final phase and holds late-defect on the final phase', async () => {
  const nonFinal = await runPhase(NEXT([ROW()], { run: { roundLimit: 2 }, finalPhase: false }), capImpl())
  assert.deepEqual(nonFinal.calls.filter(c => /^fix:seed-1:/.test(labelOf(c))).map(labelOf), ['fix:seed-1:r1', 'fix:seed-1:r2'], 'presence guard: the seed spends its rounds')
  assert.deepEqual(holdsOf(nonFinal.out, 'audit-blocked'), [], 'no audit-blocked hold for a seeded task')
  assert.equal(nonFinal.out.landDecision, 'landed', 't9 lands')
  assert.equal(nonFinal.out.carriedTasks.length, 1, 'the defect carries again, never dropped (PIN-1)')
  const row = nonFinal.out.carriedTasks[0]
  assert.equal(row.title, GA_MAJOR().title)
  assert.equal(row.task, 't1', 'the origin task survives the round trip')
  assert.equal(row.fixRounds, 2)
  assert.deepEqual(row.roster, ROW().roster)
  assert.equal(row.carriedFrom.phase, 4)
  assert.match(row.carriedFrom.reason, /seeded task seed-1 ran out of fix rounds/)
  const final = await runPhase(NEXT([ROW()], { run: { roundLimit: 2 } }), capImpl())
  assert.equal(final.out.landDecision, 'held:escalation')
  const held = holdsOf(final.out, 'late-defect')
  assert.equal(held.length, 1, 'the final phase holds for a Lead ruling')
  assert.equal(held[0].task, 'seed-1')
  assert.equal(held[0].fixRounds, 2)
  assert.deepEqual(holdsOf(final.out, 'audit-blocked'), [])
  assert.deepEqual(final.out.carriedTasks, [], 'the final phase never carries')
  // The seed hold is recorded before the late-fix pass: with a gate-audit Major queued on t9, the
  // final phase dispatches no late fix, and the Major still holds late-defect (never dropped, PIN-1).
  const capRule = src.slice(src.indexOf('// Seeded-task cap rule'), src.indexOf('// ---- BEHAVIOR-ROW SORT'))
  assert.ok(capRule.includes('for (const { task: t, why } of seedCapped) {'), 'the cap-rule loop sits directly above the sort')
  const gaArm = source => {
    const cap = capImpl(), ga = lateFixImpl()
    return runPhase(NEXT([ROW()], { run: { roundLimit: 2 } }), (p, o) => /^(gate-audit|late-fix):/.test(labelOf({ opts: o })) ? ga(p, o) : cap(p, o), {}, source)
  }
  const ga = await gaArm()
  assert.ok(ga.calls.some(c => labelOf(c) === 'gate-audit:t9:execution-evidence'), 'presence guard: the gate-audit seat ran on t9')
  assert.deepEqual(ga.calls.filter(c => /^late-fix:/.test(labelOf(c))).map(labelOf), [], 'no late-fix worker is dispatched on a phase that holds')
  assert.deepEqual(holdsOf(ga.out, 'late-defect').map(e => e.task).sort(), ['seed-1', 't9'], 'the seed and the queued Major both hold')
  assert.equal(ga.out.landDecision, 'held:escalation')
  // Red proof by mutation: the loop moved back below the late-fix pass dispatches late fixes again.
  const mutant = src.replace(capRule, '').replace('await lateFixPass()\n', 'await lateFixPass()\n' + capRule)
  assert.notEqual(mutant, src, 'the mutation applies')
  const gaMut = await gaArm(mutant)
  assert.ok(gaMut.calls.some(c => /^late-fix:t9:/.test(labelOf(c))), 'the mutant dispatches a late fix on the held final phase')
  // A non-final phase that another hard reason holds records the hold too (the late-fix pass rule).
  const both = await runPhase(NEXT([ROW()], { run: { roundLimit: 2 }, finalPhase: false }), capImpl({ t9: 'escalate' }))
  assert.equal(holdsOf(both.out, 'late-defect').length, 1, 'held, not carried away from the Lead')
  assert.deepEqual(both.out.carriedTasks, [])
  // Control: an ordinary task at the cap keeps its audit-blocked hold.
  const plain = await runPhase(NEXT(undefined, { tasks: [{ ...T9(), id: 'seed-1', roster: [{ lens: 'correctness' }] }], run: { roundLimit: 2 }, finalPhase: false }), capImpl())
  assert.equal(holdsOf(plain.out, 'audit-blocked').length, 1, 'a plan task still holds audit-blocked')
  assert.deepEqual(plain.out.carriedTasks, [])
  // The floor arm: the seed merge trips no-test at every attempt while its add-test worker keeps
  // returning implemented, so the floor sub-loop reaches roundLimit and the cap rule takes the seed.
  const floorImpl = (p, o) => seatOf(o) === 'war-refiner' && o.phase === 'Refine' && /^merge:seed-1(:|$)/.test(labelOf({ opts: o }))
    ? { mode: 'merge-task', status: 'no-test' } : defaultImpl(p, o)
  const floorArms = source => Promise.all([
    runPhase(NEXT([ROW()], { run: { roundLimit: 2 }, finalPhase: false }), floorImpl, {}, source),
    runPhase(NEXT([ROW()], { run: { roundLimit: 2 } }), floorImpl, {}, source),
  ])
  const [fNon, fFinal] = await floorArms()
  assert.deepEqual(fNon.calls.filter(c => /^add-test:seed-1:/.test(labelOf(c))).map(labelOf), ['add-test:seed-1:r1', 'add-test:seed-1:r2'], 'presence guard: the floor sub-loop spends the seed rounds')
  assert.equal(fNon.out.carriedTasks.length, 1, 'the floor-capped seed carries again (PIN-1)')
  assert.match(fNon.out.carriedTasks[0].carriedFrom.reason, /the no-test floor still trips/)
  assert.deepEqual(holdsOf(fNon.out, 'no-test'), [], 'no no-test hold for a seeded task')
  assert.deepEqual(holdsOf(fFinal.out, 'late-defect').map(e => e.task), ['seed-1'], 'the final phase holds the floor-capped seed for a Lead ruling')
  assert.deepEqual(holdsOf(fFinal.out, 'no-test'), [])
  // Red proof by mutation: without the seed branch the floor arm escalates with its floor status.
  const floorArm = 'if (r.task.seed) seedCapped.push({ task: r.task, why: \'the \' + floorMr.status + \' floor still trips\' })\n          else '
  assert.ok(src.includes(floorArm), 'the mutation target is the live floor-arm seed branch')
  const [mNon, mFinal] = await floorArms(src.replace(floorArm, ''))
  assert.deepEqual(mNon.out.carriedTasks, [], 'the mutant carries nothing')
  assert.equal(holdsOf(mNon.out, 'no-test').length, 1, 'the mutant escalates the seed as no-test')
  assert.deepEqual(holdsOf(mFinal.out, 'late-defect'), [], 'the mutant final phase holds no late-defect')
})

// A seeded task that ends env-died or env-blocked carries its seed row on its escalation record
// (#2641, PIN-1), so the Lead can re-thread it at the recovery relaunch. It never re-carries on
// carriedTasks, because the relaunch would then run the defect twice.
const softOf = (out, id) => (out.escalated || []).find(e => e && e.task === id)
const diesOn = id => (p, o) => { if ((o.label || '') === 'work:' + id) throw new Error('API error: session limit reached'); return defaultImpl(p, o) }
const provRedOn = id => (p, o) => seatOf(o) === 'war-refiner' && o.dispatchKind === 'provision-run' && (o.label || '') === 'provision-run:' + id
  ? { ok: false, taskId: id, failedCommand: PROVISION_LIST[0], exitCode: 1, stderrTail: 'ERR_LOCKFILE', provisionSource: 'ci' } : defaultImpl(p, o)
const PROV = { run: { provision: PROVISION_LIST, provisionSource: 'ci' }, finalPhase: false }
const softArms = source => Promise.all([
  runPhase(NEXT([ROW()], { finalPhase: false }), diesOn('seed-1'), {}, source),
  runPhase(NEXT([ROW()], PROV), provRedOn('seed-1'), {}, source),
])

test('late-defect: carry soft env — an env-died seed escalation carries its seed row and the phase still lands', async () => {
  const [died] = await softArms()
  const e = softOf(died.out, 'seed-1')
  assert.equal(e && e.reason, 'env-died', 'presence guard: the seed escalates env-died')
  assert.deepEqual(e.seed, ROW(), 'the record carries the threaded seed row')
  assert.equal(died.out.landDecision, 'landed', 'a soft escalation still lands the phase')
  assert.ok(died.out.landed.includes('t9'), 't9 merges')
  assert.deepEqual(died.out.carriedTasks, [], 'never re-carried on carriedTasks')
})

test('late-defect: carry soft env — an env-blocked seed escalation carries its seed row too', async () => {
  const [, blocked] = await softArms()
  const e = softOf(blocked.out, 'seed-1')
  assert.equal(e && e.reason, 'env-blocked', 'presence guard: the seed escalates env-blocked')
  assert.deepEqual(e.seed, ROW(), 'the record carries the threaded seed row')
  assert.equal(blocked.out.landDecision, 'landed')
  assert.deepEqual(blocked.out.carriedTasks, [])
})

test('late-defect: carry soft env — a plain task soft escalation has no seed field', async () => {
  const [died, blocked] = await Promise.all([
    runPhase(NEXT(undefined, { finalPhase: false }), diesOn('t9')),
    runPhase(NEXT(undefined, PROV), provRedOn('t9')),
  ])
  for (const [out, reason] of [[died.out, 'env-died'], [blocked.out, 'env-blocked']]) {
    const e = softOf(out, 't9')
    assert.equal(e && e.reason, reason, 'presence guard: t9 escalates ' + reason)
    assert.ok(!('seed' in e), 'a plain task record has no seed field')
  }
  // A seed's hard record (the final-phase late-defect hold) gets no stamp: only soft reasons do.
  const hard = await runPhase(NEXT([ROW()], { run: { roundLimit: 2 } }), capImpl())
  const held = holdsOf(hard.out, 'late-defect')
  assert.equal(held.length, 1, 'presence guard: the seed holds late-defect')
  assert.ok(!('seed' in held[0]), 'a hard record has no seed field')
})

test('late-defect: carry docs — schemas.md documents args.seededTasks, its row shape and the provenance floor', () => {
  const argsDoc = schemasMd.slice(schemasMd.indexOf('## Workflow per-phase args contract'), schemasMd.indexOf('## Workflow per-phase return'))
  const row = (argsDoc.match(/^Optional `seededTasks`[^\n]*/m) || [''])[0]
  assert.ok(row, 'schemas.md carries an Optional `seededTasks` row')
  for (const key of ['title', 'severity', 'suggested_fix', 'file', 'task', 'findingClass', 'roster', 'planSlug', 'carriedTasks', 'requiresTest: true', 'PIN-9', 'late-defect'])
    assert.ok(row.includes(key), 'the seededTasks row names ' + key)
  // The id rule the row restates is bound to the engine's mint and suffix loop.
  assert.ok(src.includes("let id = 'seed-' + (i + 1)") && src.includes("while (tasks.some(t => t.id === id)) id += '-1'"), 'the engine mints a 1-based seed id with a -1 collision suffix')
  assert.ok(row.includes('id `seed-<1-based row index>` (a `-1` suffix is appended while the id collides with another task id)'), 'the row states the 1-based id and the -1 suffix')
  assert.ok(!row.includes('`seed-<row index>`'), 'the row never names a bare row-index id')
  assert.match(schemasMd, /`ruledAsks`, `seededPhaseClose`, or `seededTasks` arg/, 'the provenance floor row lists seededTasks')
  assert.ok(src.includes("if (A.seededTasks != null) {"), 'the engine validates args.seededTasks at entry')
  assert.match(src, /^\/\/ {5}seededTasks\?,/m, 'the args header names seededTasks')
})
