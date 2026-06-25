import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(here, 'workflow-template.js'), 'utf8').replace(/^export const meta/m, 'const meta')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const build = () => new AsyncFunction('agent', 'parallel', 'pipeline', 'log', 'phase', 'args', 'budget', src)

// --- Behavioral harness (mirrors red-team workflow-scaffold.test.mjs) ----------------------
// Run the template with a mock `agent` that records every { prompt, opts } in call order, plus a
// faithful `parallel` (run all thunks). We drive a happy-path phase (work→approve→merge→land→wrap)
// so the whole prompt surface — Provision barrier, worker, fix-worker, auditor — is exercised.
const fakeParallel = async (thunks) => Promise.all(thunks.map((t) => t()))

// agentImpl(prompt, opts) returns the role's result. Defaults: worker implemented, auditor approve,
// refiner merged/landed, servitor a result — so the in-flow land + wrap-up both fire.
async function runPhase(args, agentImpl) {
  const calls = []
  const logs = []
  const fn = build()
  const agent = async (prompt, opts = {}) => { calls.push({ prompt, opts }); return agentImpl(prompt, opts) }
  const log = (m) => logs.push(m)
  const out = await fn(agent, fakeParallel, async () => [], log, () => {}, args, { total: null })
  return { out, calls, logs }
}

const seatOf = (opts) => (opts.agentType || '').split(':').pop()
const defaultImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef' }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

// Two-task phase. branch/worktree are intentionally LEFT OFF the task objects: the template must
// derive them from planSlug + runId + worktreeRoot (assertion 4). integrationBranch is supplied by
// the Lead (plan-namespaced) and stays the single audit/merge target.
const PROVISION_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a' },
  plan: { file: 'docs/plans/wtprov-A.md', gate: 'make gate' },
  planSlug: 'wtprov-a',
  runId: 'run-2026',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  runDir: '/abs/repo/.claude/teams/run-2026',
  ownedFile: '/abs/repo/.claude/teams/run-2026/owned-refs',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', lenses: ['correctness'], deps: ['t1'] },
  ],
  learningsTarget: '/abs/learnings',
  ...over,
})

const idx = (calls, pred) => calls.findIndex(pred)
const isProvision = (c) => c.opts.phase === 'Provision'
const isWorker = (c) => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Work'
const isFixWorker = (c) => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit'
const isAuditor = (c) => seatOf(c.opts) === 'war-auditor'

test("meta declares a 'Provision' phase ahead of 'Work'", () => {
  // The exported meta lists the stages the Workflow runs; the new barrier must be declared.
  const mProv = src.indexOf("title: 'Provision'")
  const mWork = src.indexOf("title: 'Work'")
  assert.ok(mProv !== -1, "meta.phases includes a 'Provision' stage")
  assert.ok(mProv < mWork, "'Provision' is declared before 'Work'")
})

test('a Provision barrier runs BEFORE any worker fan-out (assertion 2)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const provIdx = idx(calls, isProvision)
  const workIdx = idx(calls, isWorker)
  assert.notEqual(provIdx, -1, 'a Provision phase/stage exists')
  assert.notEqual(workIdx, -1, 'a worker is dispatched')
  assert.ok(provIdx < workIdx, 'the Provision barrier precedes the first worker (barrier ordering)')
  // It is the refiner that owns provisioning (ADR 0001), not a worker.
  assert.equal(seatOf(calls[provIdx].opts), 'war-refiner', 'the Provision barrier is a refiner seat')
})

test('the Provision barrier calls the script: ensure-integration then ensure-worktree per task (assertion 2)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const prov = calls.find(isProvision)
  const p = prov.prompt
  assert.match(p, /provision-worktrees\.sh/, 'the barrier invokes the provisioning script')
  assert.match(p, /ensure-integration/, 'the barrier runs ensure-integration')
  assert.match(p, /ensure-worktree/, 'the barrier runs ensure-worktree')
  // ensure-worktree must run for EACH task in the phase (both worktree paths appear).
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/t1'), 'ensure-worktree for task t1 path')
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/t2'), 'ensure-worktree for task t2 path')
  // Ordering inside the barrier prompt: ensure-integration is mentioned before the per-task adds.
  assert.ok(p.indexOf('ensure-integration') < p.indexOf('ensure-worktree'),
    'ensure-integration is sequenced before ensure-worktree')
})

test('carry-forward A — ensure-exclude is run from the MAIN checkout (probe E2)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /ensure-exclude/, 'the barrier runs ensure-exclude')
  assert.ok(p.includes('/abs/repo'), 'the barrier names the main checkout')
  // The prompt must tie ensure-exclude to the main checkout, not a task worktree.
  assert.match(p, /main checkout|parent checkout|main repo/i,
    'ensure-exclude is explicitly bound to the main/parent checkout (cwd contract)')
})

test('carry-forward B — ensure-integration is passed --owned-file <run-ledger> (foreign→exit 3 guard)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /--owned-file/, 'ensure-integration receives --owned-file')
  assert.ok(p.includes('/abs/repo/.claude/teams/run-2026/owned-refs'), 'the ownership ledger path is threaded')
})

test('the worker prompt no longer self-creates the worktree (assertion 1)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w = calls.find(isWorker).prompt
  assert.ok(!/git worktree add/.test(w), 'worker prompt does NOT contain "git worktree add"')
  assert.ok(!/export WAR_WORKTREE/.test(w), 'worker prompt does NOT contain "export WAR_WORKTREE"')
  assert.match(w, /already[- ]provisioned/i, 'worker is told the worktree is already provisioned')
})

test('the worker prompt still receives the absolute task.worktree path (assertion 3)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w = calls.find(isWorker).prompt
  assert.ok(w.includes('/abs/repo/.claude/worktrees/run-2026/t1'), 'worker prompt carries the absolute worktree path')
})

test('the fix-worker (FIX_NEEDED) prompt also drops self-create + WAR_WORKTREE, keeps task.worktree (assertion 1)', async () => {
  // Force one audit round that blocks (a Major), then approves on the rebuttal/next round, so a
  // fix-worker is dispatched and we can inspect its prompt.
  let auditRounds = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor') {
      auditRounds++
      // First seat invocation blocks with a Major; subsequent ones approve.
      return auditRounds <= 1
        ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'fix me', file: 'a.js', rationale: 'because' }] }
        : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    return defaultImpl(prompt, opts)
  }
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
  ] }), impl)
  const fix = calls.find(isFixWorker)
  assert.ok(fix, 'a fix-worker was dispatched on the blocking finding')
  const f = fix.prompt
  assert.ok(!/git worktree add/.test(f), 'fix-worker prompt does NOT contain "git worktree add"')
  assert.ok(!/export WAR_WORKTREE/.test(f), 'fix-worker prompt does NOT contain "export WAR_WORKTREE"')
  assert.ok(f.includes('/abs/repo/.claude/worktrees/run-2026/t1'), 'fix-worker prompt carries the absolute worktree path')
  assert.match(f, /already[- ]provisioned/i, 'fix-worker is told the worktree is already provisioned')
})

test('the auditor prompt still receives the absolute task.worktree path (assertion 3)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor).prompt
  assert.ok(a.includes('/abs/repo/.claude/worktrees/run-2026/t1'), 'auditor prompt carries the absolute worktree path')
})

test('plan-slug + run-id are threaded into branch/path construction (assertion 4)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // Branch derived as war/<planSlug>/p<phase>-<task> (matches teardown-phase regex war/<slug>/p<N>-*).
  const w = calls.find(isWorker).prompt
  assert.ok(w.includes('war/wtprov-a/p3-t1'), 'worker branch is war/<slug>/p<N>-<task>, derived from planSlug')
  // Worktree path carries the run-id segment.
  assert.ok(w.includes('/run-2026/'), 'worktree path carries the run-id')
  // The merge prompt (refiner) sees the same derived branch.
  const merge = calls.find((c) => seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Refine')
  assert.ok(merge.prompt.includes('war/wtprov-a/p3-t1'), 'merge prompt uses the derived branch')
})

test('Provision barrier shape stays OPEN for Part B — no run.provision / env-blocked / setup-scout wired in executable code', () => {
  // Seam guard: this plan builds the barrier only. Part B (per-task provision list, env-blocked
  // verdict, setup-scout) must NOT be WIRED yet — keep it an addition, not a rewrite. We strip
  // comments first (mirrors the red-team scaffold survival checks) so the seam may be DOCUMENTED in
  // prose while staying absent from executable code.
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  // Part B threads a per-task list at args.run.provision; guard that exact access (dot or bracket),
  // NOT the word "provision" generally (the barrier's own `phase:'Provision'` / `provision:phase-…`
  // label are legitimate Part-A wiring).
  assert.ok(!/run\.provision|run\[['"]provision['"]\]|provision:\s*\[/.test(code), 'the run.provision list is not consumed in Part A')
  assert.ok(!/env-blocked|env_blocked/.test(code), 'the env-blocked verdict is not wired in Part A')
  assert.ok(!/setup-scout|setupScout/.test(code), 'the setup-scout is not wired in Part A')
})

test('template body still compiles as an async function (syntax check)', () => {
  assert.doesNotThrow(build)
})

test('empty phase returns the augmented shape and the NAMED no-merge hold', async () => {
  const fn = build()
  const agent = async () => { throw new Error('no agent should run for an empty phase') }
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t()))
  const pipeline = async () => []
  const noop = () => {}
  const args = {
    phase: { id: 6, title: 'P6', integrationBranch: 'integration/phase-6', workingBranch: 'dev/planA' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    tasks: [],
    learningsTarget: null,
  }
  const out = await fn(agent, parallel, pipeline, noop, noop, args, { total: null })
  assert.equal(out.landDecision, 'held:nothing-merged')   // was a silent skip before
  assert.deepEqual(out.auditLog, [])                       // now returned for a Lead-driven wrap-up
  assert.equal(out.landResult, null)
  assert.equal(out.servitorResult, null)
  assert.deepEqual(out.landed, [])
})
