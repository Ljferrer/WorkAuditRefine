// Late defects fixed in the run — sweep-side behavior routing (part 3)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
// Plan 2026-11-04-late-defects-fixed-in-run, Task 4.1 (D19/D21/D22, PIN-19/PIN-21/PIN-22): before the
// late-fix pass, each behavior row on phaseCloseQueue is sorted by the owner of its file. A stacked-owned
// or unowned file sends it to the late-fix pass; a parallel-owned, task-owned or release-slot file demotes
// it demote:exclusion-set with a stated reason. Cosmetic rows keep today's sweep routes. A behavior row
// first raised by the sweep panel or the terminal seat carries on carriedTasks (non-final) or files
// "raised after the late-fix pass" (final).
import { test } from 'node:test'
import {
  assert,
  src,
  runPhase,
  seatOf,
  SWEEP_ARGS,
  p4Base,
  nit,
  buildSeqImpl,
  demotionOf,
  polishPromptOf,
  terminalImpl,
  terminalCalls,
  carriedOf,
  isLateFixWorker,
  registrySlice,
} from './workflow-template.test-harness.mjs'

const labelOf = c => c.opts.label || ''
const lateWorkers = calls => calls.filter(isLateFixWorker)
// lateWrap: the late-fix worktree provision answers ok (p4Base and sweepBase answer only the
// Provision-phase and polish worktrees); every other dispatch rides the base impl.
const lateWrap = base => (prompt, opts) =>
  (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'late-fix-worktree') ? { ok: true } : base(prompt, opts)
// The Aligned t5-2 row: a seat set absorb + phaseClose:true with a full fix, on a file plan 2 lists.
const T52 = (over = {}) => nit({ severity: 'Minor', title: 'wrong exit code on the stale branch', file: 'src/sync.js', rationale: 'the stale arm returns 0, so the caller treats a stale branch as clean',
  suggested_fix: 'return 2 from the stale arm', disposition: 'absorb', phaseClose: true, findingClass: 'behavior', autoFixable: undefined, ...over })
const PLAN2 = mode => ({ slug: 'plan-two', files: ['src/sync.js'], ...(mode === undefined ? {} : { mode }) })
const t52Run = (row, sweepExclude, over = {}) => runPhase(SWEEP_ARGS({ sweepExclude, ...over }), lateWrap(p4Base({ queued: [row] })))

test('late-defect: exclusion t5-2 — a behavior absorb on a stacked-owned file joins the late-fix pass and is not filed (Aligned t5-2 replay)', async () => {
  const { out, calls, logs } = await t52Run(T52(), [PLAN2('stacked')])
  assert.equal(out.landDecision, 'landed', 'the fixed row lands with the phase')
  assert.ok(!demotionOf(out, T52().title), 'the row is not demoted demote:exclusion-set, so it is never filed')
  const w = lateWorkers(calls)
  assert.deepEqual(w.map(labelOf), ['late-fix:t1:r1'], 'one late-fix round on the origin task')
  assert.ok(w[0].prompt.includes(T52().title) && w[0].prompt.includes(T52().suggested_fix), 'the defect and its fix ride the late-fix prompt')
  assert.ok(!/FIX-ROUND FENCE:[^\n]*src\/sync\.js/.test(w[0].prompt), 'a stacked-owned file is outside the late-fix fence, so the worker may edit it')
  assert.ok(calls.some(c => labelOf(c) === 'merge:p3-latefix-1'), 'the late fix merges')
  assert.ok(!polishPromptOf(calls).includes(T52().title), 'the sweep never receives the behavior row')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('late-fix pass: queued [Minor] "' + T52().title + '"') && l.includes('a stacked file')), 'the join is logged naming the stacked owner')
  // Red proof by mutation: without the sort the row demotes at the sweep-time exclusion set (the t5-2 outcome).
  const sortCall = "queueLateRow(f, f.task, f.seat, f.sha, 'a behavior row on '"
  assert.ok(src.includes(sortCall), 'the mutation target is the live sort route')
  const mutated = await runPhase(SWEEP_ARGS({ sweepExclude: [PLAN2('stacked')] }), lateWrap(p4Base({ queued: [T52()] })), {}, src.replace(sortCall, "kept.push(f) || (f, f.task, f.seat, f.sha, 'a behavior row on '"))
  assert.match((demotionOf(mutated.out, T52().title) || {}).demoteReason || '', /^demote:exclusion-set — /, 'the mutant files the bug, as t5-2 did')
  assert.equal(lateWorkers(mutated.calls).length, 0, 'and runs no late fix')
})

test('late-defect: exclusion cosmetic — a cosmetic row on the same stacked-owned file still demotes demote:exclusion-set, and a classless row does too', async () => {
  for (const row of [T52({ findingClass: 'cosmetic' }), T52({ findingClass: undefined })]) {
    const { out, calls } = await t52Run(row, [PLAN2('stacked')])
    const d = demotionOf(out, row.title)
    assert.ok(d && /^demote:exclusion-set — sweep exclusion set: src\/sync\.js is owned by plan plan-two/.test(d.demoteReason), 'today\'s sweep-time demote stands for ' + row.findingClass)
    assert.equal(lateWorkers(calls).length, 0, 'no late fix for a ' + row.findingClass + ' row')
  }
})

test('late-defect: exclusion unowned — a behavior row on a file nobody owns joins the late-fix pass', async () => {
  const row = T52({ file: 'src/free.js' })
  const { out, calls } = await t52Run(row, [PLAN2('parallel')])
  assert.deepEqual(lateWorkers(calls).map(labelOf), ['late-fix:t1:r1'])
  assert.ok(!demotionOf(out, row.title), 'never filed')
  // The no-sweepExclude launch: still unowned, still fixed.
  const bare = await t52Run(row, undefined)
  assert.deepEqual(lateWorkers(bare.calls).map(labelOf), ['late-fix:t1:r1'])
})

test('late-defect: exclusion owned — a parallel, an absent-mode, a task-owned and a release-slot file each demote the behavior row with a stated reason and run no late fix', async () => {
  for (const [mode, label] of [['parallel', 'parallel'], [undefined, 'absent mode']]) {
    const { out, calls } = await t52Run(T52(), [PLAN2(mode)])
    const d = demotionOf(out, T52().title)
    assert.ok(d, label + ': the row demotes')
    assert.equal(d.demoteReason, 'demote:exclusion-set — behavior row: src/sync.js is owned by plan plan-two (parallel: its branch edits it), so no late fix here', label + ': the reason names the owner and why')
    assert.equal(lateWorkers(calls).length, 0, label + ': no late fix')
  }
  // A parallel owner wins over a stacked owner of the same file.
  const both = await t52Run(T52(), [PLAN2('stacked'), { slug: 'plan-three', files: ['./src/sync.js'] }])
  assert.match(demotionOf(both.out, T52().title).demoteReason, /owned by plan plan-three \(parallel/, 'any non-stacked owner demotes')
  // Task-owned: t2 never merges (a soft red gate), so its Files: own the file this phase.
  const tasks = [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], files: ['src/sync.js'] }]
  const impl = lateWrap(buildSeqImpl({ 'merge:t2': [{ mode: 'merge-task', status: 'gate_failed', gate_output: 'red' }] }, p4Base({ queued: [T52()] })))
  const owned = await runPhase(SWEEP_ARGS({ tasks }), impl)
  assert.ok(owned.out.landed.includes('t1') && !owned.out.landed.includes('t2'), 'presence guard: t1 merged, t2 did not')
  assert.equal(demotionOf(owned.out, T52().title).demoteReason, 'demote:exclusion-set — behavior row: src/sync.js is owned by task t2 (not merged: its relaunch edits it), so no late fix here')
  assert.equal(lateWorkers(owned.calls).length, 0)
  // Release slot: a seeded behavior row on plugin.json (a release-slot absorb is refused at birth).
  const slot = T52({ file: '.claude-plugin/plugin.json', title: 'slot row', task: 't1', planSlug: 'wtprov-a' })
  const rs = await runPhase(SWEEP_ARGS({ seededPhaseClose: [slot] }), lateWrap(p4Base()))
  assert.equal((demotionOf(rs.out, 'slot row') || {}).demoteReason, 'demote:exclusion-set — behavior row: .claude-plugin/plugin.json is owned by the release slot, so no late fix here')
  assert.equal(lateWorkers(rs.calls).length, 0)
})

test('late-defect: exclusion mode validation — a mode outside stacked and parallel refuses the launch at entry with zero agents', async () => {
  for (const mode of ['bogus', null, 1]) {
    const { out, calls } = await t52Run(T52(), [{ slug: 'plan-two', files: ['src/sync.js'], mode }])
    assert.equal(out.landDecision, 'held:workflow-error', 'refused for ' + JSON.stringify(mode))
    assert.ok(String(out.workflowError && out.workflowError.message).includes('args.sweepExclude[0].mode must be stacked or parallel'), 'the message names the field')
    assert.equal(calls.length, 0)
  }
  for (const mode of ['stacked', 'parallel']) {
    const { out } = await t52Run(T52(), [PLAN2(mode)])
    assert.equal(out.landDecision, 'landed', mode + ' is legal')
  }
})

test('late-defect: exclusion fence — the late-fix fence keeps a parallel entry\'s files and drops a stacked entry\'s files', async () => {
  const row = T52({ file: 'src/free.js' })
  const { calls } = await t52Run(row, [PLAN2('stacked'), { slug: 'plan-four', files: ['docs/p4.md'], mode: 'parallel' }])
  const w = lateWorkers(calls)[0]
  assert.ok(w, 'presence guard: the late fix ran')
  assert.match(w.prompt, /FIX-ROUND FENCE:[^\n]*docs\/p4\.md/, 'the parallel file is fenced')
  assert.ok(!/FIX-ROUND FENCE:[^\n]*src\/sync\.js/.test(w.prompt), 'the stacked file is not')
})

test('late-defect: exclusion sweep-raised — a polish-panel behavior absorb carries on carriedTasks on a non-final phase and files "raised after the late-fix pass" on the final phase; a cosmetic one keeps the terminal queue', async () => {
  const pb = { severity: 'Minor', title: 'polish-panel behavior', file: 'docs/y.md', rationale: 'the polish diff inverts a guard', suggested_fix: 'restore the guard', disposition: 'absorb', findingClass: 'behavior' }
  const nonFinal = await runPhase(SWEEP_ARGS({ finalPhase: false }), lateWrap(terminalImpl({ polishFindings: [pb] })))
  const ct = (nonFinal.out.carriedTasks || []).find(r => r.title === pb.title)
  assert.ok(ct, 'the row rides carriedTasks')
  assert.equal(ct.task, 't1', 'under its origin task (the lowest-id merged task), not the polish pseudo task')
  assert.equal(ct.findingClass, 'behavior')
  assert.ok(ct.carriedFrom && /raised after the late-fix pass/.test(ct.carriedFrom.reason), 'the carry names why')
  assert.ok(!carriedOf(nonFinal.out, pb.title) && !demotionOf(nonFinal.out, pb.title), 'neither the sweep carry nor a filed row')
  assert.ok(!terminalCalls(nonFinal.calls).some(c => c.prompt.includes(pb.title)), 'never a terminal-pass input')
  const final = await runPhase(SWEEP_ARGS({ finalPhase: true }), lateWrap(terminalImpl({ polishFindings: [pb] })))
  assert.equal((demotionOf(final.out, pb.title) || {}).demoteReason, 'demote:sweep-discarded — raised after the late-fix pass (polish panel, final phase)')
  assert.equal(final.out.landDecision, 'landed', 'never a hold (ADR 0012)')
  // A discarded sweep (the approved polish merge conflicts): the same filter routes the row before the discard arm.
  const discardImpl = base => (prompt, opts) => (opts.label || '') === 'merge:p3-polish' ? { mode: 'merge-task', status: 'conflict' } : base(prompt, opts)
  const discard = await runPhase(SWEEP_ARGS({ finalPhase: false }), discardImpl(lateWrap(terminalImpl({ polishFindings: [pb] }))))
  assert.ok(discard.out.auditLog.some(e => e.verdict === 'polish-discarded'), 'presence guard: the sweep was discarded')
  assert.ok((discard.out.carriedTasks || []).some(r => r.title === pb.title), 'carried on carriedTasks from the discard arm too')
  assert.ok(!carriedOf(discard.out, pb.title), 'never the sweep carry')
  // Cosmetic control: today's route — the terminal pass takes it.
  const cosmetic = await runPhase(SWEEP_ARGS({ finalPhase: false }), lateWrap(terminalImpl({ polishFindings: [{ ...pb, findingClass: 'cosmetic' }] })))
  assert.ok(terminalCalls(cosmetic.calls).some(c => c.prompt.includes(pb.title)), 'a cosmetic sweep-raised absorb rides the terminal pass')
  assert.deepEqual(cosmetic.out.carriedTasks, [], 'and never carriedTasks')
})

test('late-defect: exclusion terminal-raised — a terminal-seat behavior absorb carries on carriedTasks on a non-final phase and files demote:terminal-pass "raised after the late-fix pass" on the final phase', async () => {
  const tb = { severity: 'Minor', title: 'terminal-seat behavior', file: 'docs/t.md', rationale: 'the terminal commit drops a branch', suggested_fix: 'restore the branch', disposition: 'absorb', findingClass: 'behavior' }
  const nonFinal = await runPhase(SWEEP_ARGS({ finalPhase: false }), lateWrap(terminalImpl({ terminalFindings: [tb] })))
  assert.ok(terminalCalls(nonFinal.calls).length === 1, 'presence guard: the terminal pass ran')
  const ct = (nonFinal.out.carriedTasks || []).find(r => r.title === tb.title)
  assert.ok(ct && ct.task === 't1' && /raised after the late-fix pass by the terminal seat/.test(ct.carriedFrom.reason), 'carried under the origin task')
  assert.ok(!carriedOf(nonFinal.out, tb.title), 'not the sweep carry')
  const final = await runPhase(SWEEP_ARGS({ finalPhase: true }), lateWrap(terminalImpl({ terminalFindings: [tb] })))
  assert.match((demotionOf(final.out, tb.title) || {}).demoteReason || '', /^demote:terminal-pass — raised after the late-fix pass \(terminal seat at 7e4a1a10, final phase\)$/)
  // A behavior note is never a note: it carries the same way.
  const note = await runPhase(SWEEP_ARGS({ finalPhase: false }), lateWrap(terminalImpl({ terminalFindings: [{ ...tb, disposition: 'note' }] })))
  assert.ok((note.out.carriedTasks || []).some(r => r.title === tb.title), 'a behavior note carries')
  assert.ok(!(note.out.notes || []).some(n => n.title === tb.title), 'never a note')
})

test('late-defect: exclusion late-fix re-audit — a behavior row born at a late-fix re-audit never reaches the sweep: it carries (non-final) or files (final)', async () => {
  const born = { severity: 'Minor', title: 're-audit behavior', file: 'docs/r.md', rationale: 'the late fix misses a sibling arm', suggested_fix: 'fix the sibling arm', disposition: 'absorb', phaseClose: true, findingClass: 'behavior' }
  const impl = base => (prompt, opts) => /^audit:p3-latefix-/.test(opts.label || '')
    ? { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [born], confidence: 'high' } : base(prompt, opts)
  const nonFinal = await runPhase(SWEEP_ARGS({ finalPhase: false }), impl(lateWrap(p4Base({ queued: [T52({ file: 'src/free.js' })] }))))
  assert.ok(lateWorkers(nonFinal.calls).length === 1, 'presence guard: the late fix ran')
  assert.ok((nonFinal.out.carriedTasks || []).some(r => r.title === born.title), 'carried on carriedTasks')
  assert.ok(!polishPromptOf(nonFinal.calls).includes(born.title), 'never a sweep input')
  const final = await runPhase(SWEEP_ARGS({ finalPhase: true }), impl(lateWrap(p4Base({ queued: [T52({ file: 'src/free.js' })] }))))
  assert.equal((demotionOf(final.out, born.title) || {}).demoteReason, 'demote:exclusion-set — raised after the late-fix pass (late-fix re-audit, final phase)')
})

test('late-defect: exclusion late-fix corroboration — a late-fix re-audit re-raise of the sorted row finds it on the late-fix rows, never the unresolvable log', async () => {
  const row = T52({ file: 'src/free.js' })
  const seatsOf = label => /^audit:p3-latefix-/.test(label) ? { seat: label, lens: 'correctness', verdict: 'approve', findings: [row], confidence: 'high' } : null
  const run = s => runPhase(SWEEP_ARGS({ finalPhase: false }), lateWrap(p4Base({ queued: [row], seatsOf })), {}, s)
  const unresolved = logs => logs.some(l => typeof l === 'string' && l.includes('no surviving record found for re-mint "' + row.title + '"'))
  const { calls, logs } = await run()
  assert.equal(lateWorkers(calls).length, 1, 'presence guard: the sorted row took the late-fix pass')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('re-entry REFUSED: re-audit re-mint of "' + row.title + '"')), 'presence guard: the re-raise hits remintBlock')
  assert.ok(!unresolved(logs), 'the re-raise corroborates onto the late-fix row')
  // Red proof by mutation: without the lateSrcRows push the re-raise falls through to the unresolvable log.
  const push = '  lateSrcRows.push(row)\n'
  assert.ok(src.includes(push), 'the mutation target is the live push')
  assert.ok(unresolved((await run(src.replace(push, ''))).logs), 'the mutant loses the corroboration')
})

test('late-defect: exclusion held phase —a held phase skips the sort: the behavior row rides carriedPhaseClose for the relaunch and runs no late fix', async () => {
  const impl = lateWrap(buildSeqImpl({ 'merge:t1': [{ mode: 'merge-task', status: 'conflict' }] }, p4Base({ queued: [T52()] })))
  const { out, calls, logs } = await runPhase(SWEEP_ARGS({ sweepExclude: [PLAN2('stacked')] }), impl)
  assert.notEqual(out.landDecision, 'landed', 'presence guard: the phase holds')
  assert.equal(lateWorkers(calls).length, 0, 'no late fix on a held phase')
  assert.ok(carriedOf(out, T52().title), 'the row rides carriedPhaseClose, so the relaunch sorts it again')
  assert.ok(logs.some(l => typeof l === 'string' && l.startsWith('behavior-row sort skipped: ')), 'the skip is logged')
})

test('late-defect: exclusion corroboration — a re-mint of a row carryLate carried finds it on carriedTasks under its raiser key', () => {
  const h = registrySlice()
  const row = { severity: 'Minor', task: 'p3-polish', title: 'carried behavior', file: 'docs/c.md', seat: 'audit:p3-polish:correctness', findingClass: 'behavior' }
  h.carriedTasks.push({ ...row, task: 't1', raisedTask: 'p3-polish', carriedFrom: { phase: 3, reason: 'raised after the late-fix pass by the polish panel' } })
  const hit = h.corroborateSurvivor({ ...row, seat: 'audit:p3-polish:security' })
  assert.ok(hit && hit.task === 't1', 'the carried row is the survivor, though its task is now the origin task')
  assert.deepEqual(hit.seats, ['audit:p3-polish:correctness (task t1)', 'audit:p3-polish:security (task p3-polish)'], 'the second seat joins its seats list')
})
