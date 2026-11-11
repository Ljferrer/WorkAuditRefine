// Task-class routing, ace edit class, sampled review, the lens pair and the worker tier (part 1 of 1)
// Part of the workflow-template test split: shared definitions live in workflow-template.test-harness.mjs.
// Read that file's header before adding a test here.
//
// Plan 2026-11-08-model-routing-and-prompt-byte-budgets, Task 4.1 (PIN-11, PIN-12, PIN-13, PIN-14, PIN-22,
// PIN-30, PIN-32; D11, D12, D13, D21, D22, D30). Every row drives the live template through runPhase, so
// the staged form runs under WAR_TEMPLATE_STRIPPED=1 too. The differential rows compare the live template
// with a copy whose three resolvers (routeWorker, routeSeat, routeAce) are swapped for the pre-existing
// spawnWorker and spawnSeat helpers, which this task does not change (D21): never a self-compare.
import { test } from 'node:test'
import {
  assert,
  src,
  runPhase,
  PROVISION_ARGS,
  ACE_ARGS,
  defaultImpl,
  seatOf,
  inlineHelpers,
  spawnOptsOf,
  buildSeqImpl,
  aceBase,
  approveWith,
  nit,
  withBarrier,
  MODEL_RANK,
  isMergeTask,
  aceOk,
  ACE_FILE,
} from './workflow-template.test-harness.mjs'

// The baseline: each resolver's definition line is replaced by the pre-existing helper it routes over.
// The original definition stays below under a dead name, so the copy still parses.
const SWAPS = [
  ['const routeWorker = (task, tier) => {', "const routeWorker = (task, tier) => spawnWorker(!tier && task.workerTier === 'lite' ? 'lite' : tier)\nconst routeWorkerLive = (task, tier) => {"],
  ['const routeSeat = (task, seat, rebut) => {', 'const routeSeat = (task, seat, rebut) => spawnSeat(seat, rebut)\nconst routeSeatLive = (task, seat, rebut) => {'],
  ['const routeAce = (task, rows) => {', "const routeAce = (task, rows) => spawnWorker('ace')\nconst routeAceLive = (task, rows) => {"],
]
const BASELINE = SWAPS.reduce((s, [from, to]) => {
  assert.equal(s.split(from).length, 2, `the template defines ${from} once`)
  return s.replace(from, to)
}, src)

const T = (over = {}) => ({ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }], ...over })
const AGENTS = { worker: { model: 'opus', lite: { model: 'sonnet', effort: 'high' }, fix: { model: 'fable', effort: 'high' }, ace: { model: 'sonnet', effort: 'medium' } }, auditor: { model: 'sonnet', effort: 'high' } }
const blockingMajor = label => ({ seat: label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
  findings: [{ severity: 'Major', title: 'fix me', suggested_fix: 'guard the missing value before reading it', file: 'a.js', rationale: 'because' }] })
// A work, audit, fix, re-audit, ace and re-audit flow, so the work:, fix:, ace: and audit: dispatches all run.
const fixAceImpl = () => buildSeqImpl(
  { 'audit:t1:correctness': [blockingMajor('audit:t1:correctness'), approveWith('audit:t1:correctness', [nit()]), approveWith('audit:t1:correctness', [])] },
  aceBase([]))
const optsOf = (calls, label) => {
  const c = calls.find(x => x.opts.label === label)
  assert.ok(c, `non-vacuity: ${label} dispatched (seen: ${calls.map(x => x.opts.label).join(', ')})`)
  return spawnOptsOf(c.opts)
}
const isSeat = c => seatOf(c.opts) === 'war-auditor' && /^audit:t1:/.test(c.opts.label || '')

// differential(args, impl): the dispatch-by-dispatch mismatches between the live template and BASELINE.
const differential = async (args, impl) => {
  const live = await runPhase(args, impl())
  const base = await runPhase(args, impl(), {}, BASELINE)
  const out = []
  if (live.calls.length !== base.calls.length) out.push(`dispatch count ${live.calls.length} vs ${base.calls.length}`)
  live.calls.forEach((c, i) => {
    const b = base.calls[i]
    if (!b) return
    if (c.opts.label !== b.opts.label) out.push(`#${i} label ${c.opts.label} vs ${b.opts.label}`)
    if (c.prompt !== b.prompt) out.push(`#${i} ${c.opts.label}: prompt bytes differ`)
    try { assert.deepEqual(spawnOptsOf(c.opts), spawnOptsOf(b.opts)) } catch { out.push(`#${i} ${c.opts.label}: spawn ${JSON.stringify(spawnOptsOf(c.opts))} vs ${JSON.stringify(spawnOptsOf(b.opts))}`) }
  })
  return { out, live }
}
const SCENARIOS = (routing, cls) => [
  [PROVISION_ARGS({ tasks: [T({ ...(cls ? { class: cls } : {}) })], run: { ace: true }, agents: AGENTS, ...(routing ? { routing } : {}) }), fixAceImpl],
  [PROVISION_ARGS({ tasks: [T({ workerTier: 'lite', roster: [{ lens: 'correctness', tier: 'high' }], ...(cls ? { class: cls } : {}) })], agents: AGENTS, ...(routing ? { routing } : {}) }), () => defaultImpl],
  [PROVISION_ARGS({ tasks: [T({ files: ['docs/a.md'], roster: [{ lens: 'correctness' }, { lens: 'security', tier: 'high' }], ...(cls ? { class: cls } : {}) })], agents: AGENTS, ...(routing ? { routing } : {}) }), () => defaultImpl],
]

// PIN-14, D21: with no routing key every dispatch spawns and renders exactly as the pre-existing helpers do.
test('routing absent — byte-identical', async () => {
  for (const cls of [null, 'routine']) {
    for (const [args, impl] of SCENARIOS(null, cls)) {
      const { out, live } = await differential(args, impl)
      assert.ok(live.calls.filter(c => seatOf(c.opts) === 'war-worker').length > 0 && live.calls.some(isSeat), 'non-vacuity: workers and seats dispatched')
      assert.deepEqual(out, [], `class ${cls}: the live template matches the pre-existing helpers dispatch by dispatch`)
    }
  }
  const { live } = await differential(...SCENARIOS(null, null)[0])
  for (const label of ['work:t1', 'fix:t1:r1', 'ace:polish:t1:a1']) assert.ok(live.calls.some(c => c.opts.label === label), `non-vacuity: ${label} is compared`)
})

// The mutation-red proof that the row above observes routing: set one class tier and the same comparison fails.
test('routing set — changes spawn opts', async () => {
  const routing = { classes: { routine: { worker: { model: 'haiku', effort: 'low' } } } }
  const { out, live } = await differential(...SCENARIOS(routing, 'routine')[0])
  assert.ok(out.some(m => /work:t1: spawn/.test(m)), `the differential reds on the routed work: dispatch (got ${JSON.stringify(out)})`)
  assert.deepEqual(optsOf(live.calls, 'work:t1'), { model: 'haiku', effort: 'low' }, 'the routine class tier spawns the worker')
  assert.equal(live.out.handoff.dispatchModels.find(r => r.label === 'work:t1').taskClass, 'routine', 'the dispatchModels row carries taskClass')
  // PIN-11: each role reads its own class tier. Read the worker tier for every role, or drop the auditor arm, → red.
  const TIERS = { fix: { model: 'haiku', effort: 'low' }, ace: { model: 'haiku', effort: 'medium' }, auditor: { model: 'haiku', effort: 'high' } }
  const [rolesArgs, rolesImpl] = SCENARIOS({ classes: { routine: TIERS } }, 'routine')[0]
  const roles = await runPhase(rolesArgs, rolesImpl())
  assert.deepEqual(optsOf(roles.calls, 'fix:t1:r1'), TIERS.fix, 'routing.classes.routine.fix spawns the fix round')
  assert.deepEqual(optsOf(roles.calls, 'ace:polish:t1:a1'), TIERS.ace, 'routing.classes.routine.ace spawns the ace commit')
  assert.deepEqual(optsOf(roles.calls, 'audit:t1:correctness'), TIERS.auditor, 'routing.classes.routine.auditor spawns the seat')
  // The floor retry is a fix-tier dispatch: spawn it through spawnWorker('fix') and the class fix tier is lost → red.
  let merges = 0
  const floor = await runPhase(PROVISION_ARGS({ tasks: [T({ class: 'routine' })], agents: AGENTS, routing: { classes: { routine: TIERS } } }),
    (p, o) => isMergeTask({ opts: o }) && ++merges === 1 ? { mode: 'merge-task', status: 'no-test' } : defaultImpl(p, o))
  assert.deepEqual(optsOf(floor.calls, 'add-test:t1:r1'), TIERS.fix, 'routing.classes.routine.fix spawns the add-test floor retry')
})

// D11: drop the boundary lift in routeSeat and the sonnet seats dispatch below opus → red.
test('boundary class — no seat below opus', async () => {
  for (const routing of [undefined, { classes: { boundary: { auditor: { model: 'sonnet', effort: 'high' } } } }]) {
    const tasks = [T({ class: 'boundary', roster: [{ lens: 'correctness' }, { lens: 'security', model: 'sonnet' }, { lens: 'plan-faithfulness', tier: 'low' }] })]
    const { calls, out } = await runPhase(PROVISION_ARGS({ tasks, agents: AGENTS, ...(routing ? { routing } : {}) }), defaultImpl)
    const seats = calls.filter(isSeat)
    assert.equal(seats.length, 3, 'non-vacuity: all three seats dispatched')
    for (const c of seats) assert.ok(MODEL_RANK.indexOf(c.opts.model) >= MODEL_RANK.indexOf('opus'), `${c.opts.label} runs ${c.opts.model}, never below opus`)
    assert.ok(out.handoff.dispatchModels.filter(r => /^audit:t1:/.test(r.label)).every(r => r.taskClass === 'boundary'), 'each seat row carries taskClass boundary')
  }
  const routine = await runPhase(PROVISION_ARGS({ tasks: [T({ class: 'routine' })], agents: AGENTS }), defaultImpl)
  assert.equal(routine.calls.find(isSeat).opts.model, 'sonnet', 'a routine seat keeps its tier')
})

const EXACT = { model: 'haiku', effort: 'low' }
const exactNit = (over = {}) => nit({ line: 3, suggested_fix: 'drop the unused import', ...over })
const aceRun = async (row, routing, charges) => {
  const impl = buildSeqImpl({ 'audit:t1:correctness': [approveWith('audit:t1:correctness', [row]), approveWith('audit:t1:correctness', [])] }, aceBase([]))
  const args = ACE_ARGS({ agents: AGENTS, ...(routing ? { routing } : {}) })
  const { calls } = await runPhase(args, charges === undefined ? impl : withBarrier({ ok: true, absorbCharges: { t1: charges } }, aceBase([row])))
  return calls
}

// D12: drop the exact arm in routeAce and the exact row keeps the ace tier → red.
test('ace edit class — exact row routes', async () => {
  const routing = { aceEdit: { exact: EXACT } }
  assert.deepEqual(optsOf(await aceRun(exactNit(), routing), 'ace:polish:t1:a1'), EXACT, 'an exact row (file, line, suggested_fix) runs on routing.aceEdit.exact')
  assert.deepEqual(optsOf(await aceRun(nit(), routing), 'ace:polish:t1:a1'), { model: 'sonnet', effort: 'medium' }, 'a row with no line is broad: the ace tier')
  assert.deepEqual(optsOf(await aceRun(exactNit({ suggested_fix: '' }), routing), 'ace:polish:t1:a1'), { model: 'sonnet', effort: 'medium' }, 'a row with no suggested_fix is broad')
  assert.deepEqual(optsOf(await aceRun(exactNit(), undefined), 'ace:polish:t1:a1'), { model: 'sonnet', effort: 'medium' }, 'no aceEdit key: the ace tier')
  // A mixed batch is broad: read rows.some for rows.every and the exact row routes the whole batch → red.
  const mixed = buildSeqImpl({ 'audit:t1:correctness': [approveWith('audit:t1:correctness', [exactNit(), nit({ title: 'tidy export', file: 'skills/war/assets/y.js' })]), approveWith('audit:t1:correctness', [])] }, aceBase([]))
  const { calls } = await runPhase(ACE_ARGS({ agents: AGENTS, routing }), mixed)
  const ace = calls.find(c => c.opts.label === 'ace:polish:t1:a1')
  assert.ok(ace && ace.prompt.includes('tidy import') && ace.prompt.includes('tidy export'), 'non-vacuity: both rows ride one ace batch')
  assert.deepEqual(spawnOptsOf(ace.opts), { model: 'sonnet', effort: 'medium' }, 'an exact row beside a broad row keeps the ace tier')
})

// aceSpawn: route charges 5 and 6 through routeAce and they leave the fix tier → red.
test('ace edit class — charges 5 and 6 stay on fix', async () => {
  const routing = { aceEdit: { exact: EXACT } }
  assert.deepEqual(optsOf(await aceRun(exactNit(), routing, 3), 'ace:polish:t1:a4'), EXACT, 'non-vacuity: charge 4 takes the exact tier')
  for (const seeded of [4, 5]) {
    assert.deepEqual(optsOf(await aceRun(exactNit(), routing, seeded), 'ace:polish:t1:a' + (seeded + 1)), { model: 'fable', effort: 'high' }, `charge ${seeded + 1} stays on agents.worker.fix`)
  }
})

const SAMPLE = { sampleOpusReview: 1 }
const sampledRun = async (over = {}, impl = defaultImpl) =>
  runPhase(PROVISION_ARGS({ tasks: [T()], agents: AGENTS, routing: SAMPLE, ...over }), impl)

// D13: drop the sampling call in the audit loop and no opus seat joins → red.
test('sampled review — adds one opus seat', async () => {
  const { calls, out } = await sampledRun()
  const seats = calls.filter(isSeat)
  assert.deepEqual(seats.map(c => c.opts.label), ['audit:t1:correctness', 'audit:t1:correctness:opus'], 'the roster seat ran and one opus seat joined')
  assert.equal(seats[0].opts.model, 'sonnet', 'the roster seat keeps its tier')
  assert.equal(seats[1].opts.model, 'opus', 'the sampled seat runs opus')
  assert.equal(out.landDecision, 'landed', 'a clean sampled seat lets the task land')
  // A sampled Major blocks: the task takes a fix round, and the re-audit re-runs both seats.
  const block = buildSeqImpl({ 'audit:t1:correctness:opus': [blockingMajor('audit:t1:correctness:opus')], 'audit:t1:correctness:opus:rebut': [blockingMajor('audit:t1:correctness:opus:rebut')] }, defaultImpl)
  const b = await sampledRun({}, block)
  assert.ok(b.calls.some(c => c.opts.label === 'audit:t1:correctness:opus:rebut'), 'the split rebuttal re-runs the sampled seat beside the roster')
  assert.ok(b.calls.some(c => c.opts.label === 'fix:t1:r1'), 'the sampled Major dispatched a fix round')
  assert.ok(b.calls.filter(c => c.opts.label === 'audit:t1:correctness').length >= 2, 'the roster seat re-ran after the fix: sampling removed no seat')
  // An all-opus panel is never sampled.
  const strong = await sampledRun({ tasks: [T({ roster: [{ lens: 'correctness', tier: 'high' }] })] })
  assert.ok(!strong.calls.some(c => /:opus$/.test(c.opts.label || '')), 'a panel with an opus seat gains none')
})

// FNV-1a over plan slug and task id: replace the hash with Math.random and the two runs disagree → red.
test('sampled review — stable replay', async () => {
  const tasks = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map((id, i) => T({ id, issue: 200 + i }))
  const sampledIds = async () => {
    const { calls } = await runPhase(PROVISION_ARGS({ tasks, agents: AGENTS, routing: { sampleOpusReview: 0.5 } }), defaultImpl)
    return calls.map(c => c.opts.label || '').filter(l => /^audit:[^:]+:correctness:opus$/.test(l)).map(l => l.split(':')[1]).sort()
  }
  const first = await sampledIds()
  assert.ok(first.length > 0 && first.length < tasks.length, `non-vacuity: a 0.5 share samples some tasks, not all (got ${first.join(',')})`)
  for (let i = 0; i < 3; i++) assert.deepEqual(await sampledIds(), first, 'the same inputs sample the same tasks')
})

// D13: read an absent share as anything but 0 and the opus seat joins → red.
test('sampled review — absent share samples nothing', async () => {
  for (const routing of [undefined, {}, { sampleOpusReview: 0 }, { sampleOpusReview: null }, { classes: {} }]) {
    const { calls } = await runPhase(PROVISION_ARGS({ tasks: [T()], agents: AGENTS, ...(routing !== undefined ? { routing } : {}) }), defaultImpl)
    assert.ok(calls.some(isSeat), 'non-vacuity: the roster seat ran')
    assert.ok(!calls.some(c => /:opus/.test(c.opts.label || '')), `${JSON.stringify(routing)}: no sampled seat`)
  }
})

// D22: drop the ':opus' key in keyOf and the two seats share one label → red.
test('sampled review — a same-lens seat gets a distinct label', async () => {
  const { calls } = await sampledRun()
  const labels = calls.filter(isSeat).map(c => c.opts.label)
  assert.equal(new Set(labels).size, labels.length, `every seat label is distinct (${labels.join(', ')})`)
  // A hand-paired roster (opus over sonnet on one lens) keys the later seat the same way and lands.
  const paired = await runPhase(PROVISION_ARGS({ tasks: [T({ roster: [{ lens: 'correctness', model: 'sonnet' }, { lens: 'correctness', model: 'opus' }] })], agents: AGENTS }), defaultImpl)
  assert.deepEqual(paired.calls.filter(isSeat).map(c => [c.opts.label, c.opts.model]), [['audit:t1:correctness', 'sonnet'], ['audit:t1:correctness:opus', 'opus']])
  assert.equal(paired.out.landDecision, 'landed', 'both paired seats count toward the unanimous approval')
})

// D22: append the seat with the partner's own model and the inline pair rule refuses it → red.
test('sampled review — seat passes the pair rule', async () => {
  const { calls } = await sampledRun()
  const [partner, sampled] = calls.filter(isSeat)
  assert.ok(sampled && /:opus$/.test(sampled.opts.label), 'non-vacuity: the sampled seat dispatched')
  const lens = 'correctness'
  const r = inlineHelpers(AGENTS).validateRoster([{ lens, model: partner.opts.model }, { lens, depth: 'deep', model: sampled.opts.model }])
  assert.deepEqual(r, { valid: true, errors: [] }, 'the appended seat validates under the inline copy beside its partner\'s resolved model')
})

// aceReaudit: drop the !s.sampled filter on the carried seats and the sampled seat transfers → red.
test('sampled review — an ace subset never carries the sampled seat', async () => {
  // The security seat raises the exact absorb row, so the subset re-runs security and carries correctness.
  const impl = (p, o) => {
    if (seatOf(o) !== 'war-auditor' || !/^audit:t1:/.test(o.label || '')) return aceBase([])(p, o)
    const lens = o.label.split(':')[2]
    const ace = /ace00001/.test(p)
    return { seat: o.label, lens, verdict: 'approve', confidence: 'high', audit_sha: ace ? 'ace00001' : 'deadbeef',
      findings: !ace && lens === 'security' && !/:opus/.test(o.label) ? [exactNit({ file: ACE_FILE })] : [] }
  }
  const worker = (p, o) => seatOf(o) === 'war-worker' && o.phase !== 'Work' ? aceOk() : impl(p, o)
  const tasks = [T({ roster: [{ lens: 'correctness' }, { lens: 'security' }] })]
  const { calls, out } = await runPhase(ACE_ARGS({ tasks, agents: AGENTS, routing: SAMPLE }), worker)
  assert.ok(calls.some(c => c.opts.label === 'audit:t1:correctness:opus'), 'non-vacuity: the sampled seat ran')
  const row = (out.pinTransfers || []).find(t => t && t.kind === 'ace')
  assert.equal(row && row.mode, 'subset', 'non-vacuity: the ace re-audit ran as a subset')
  assert.deepEqual(row.seats.map(s => [s.lens, s.outcome]).sort(), [['correctness', 'transferred'], ['security', 're-ran']], 'one seat re-ran, one transferred')
  assert.ok(!row.seats.some(s => s.seat === 'correctness:opus' || /:opus$/.test(s.seat || '')), 'no transfer row names the sampled seat')
})

// D30: read anything but the stamp (the retired all-*.md route) and one half reds.
test('worker tier — a lite stamp spawns the lite tier', async () => {
  const { calls, out } = await runPhase(PROVISION_ARGS({ tasks: [T({ workerTier: 'lite', files: ['src/a.js'] })], agents: AGENTS }), defaultImpl)
  assert.deepEqual(optsOf(calls, 'work:t1'), { model: 'sonnet', effort: 'high' }, 'a lite stamp spawns agents.worker.lite')
  const row = out.handoff.dispatchModels.find(r => r.label === 'work:t1')
  assert.deepEqual([row.model, row.effort], ['sonnet', 'high'], 'the dispatchModels row records the lite tier through model and effort')
  const both = await runPhase(PROVISION_ARGS({ tasks: [T({ workerTier: 'lite', class: 'routine' })], agents: AGENTS, routing: { classes: { routine: { worker: { model: 'haiku', effort: 'low' } } } } }), defaultImpl)
  assert.deepEqual(optsOf(both.calls, 'work:t1'), { model: 'sonnet', effort: 'high' }, 'workerTier wins over routing.classes.<class>.worker')
})

test('worker tier — an all-md task with no stamp spawns the base worker', async () => {
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [T({ files: ['docs/a.md', 'skills/war/SKILL.md'] })], agents: AGENTS }), defaultImpl)
  assert.deepEqual(optsOf(calls, 'work:t1'), { model: 'opus' }, 'an all-*.md file list alone never picks the lite worker')
})

// PIN-32: route a lite task's fix or ace round through the lite tier and this reds.
test('worker tier — fix and ace rounds keep their tiers', async () => {
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [T({ workerTier: 'lite' })], run: { ace: true }, agents: AGENTS }), fixAceImpl())
  assert.deepEqual(optsOf(calls, 'work:t1'), { model: 'sonnet', effort: 'high' }, 'non-vacuity: the first worker ran lite')
  assert.deepEqual(optsOf(calls, 'fix:t1:r1'), { model: 'fable', effort: 'high' }, 'the fix round keeps agents.worker.fix')
  assert.deepEqual(optsOf(calls, 'ace:polish:t1:a1'), { model: 'sonnet', effort: 'medium' }, 'the ace commit keeps agents.worker.ace')
})
