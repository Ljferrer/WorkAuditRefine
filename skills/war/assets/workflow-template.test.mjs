import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const auditorMd = readFileSync(join(here, '../../../agents/war-auditor.md'), 'utf8')
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
  // Part B: the per-task provision-run is a refiner seat in phase 'Provision' — default it to success
  // ({ ok:true }) so happy-path tests reach the worker. (Tested BEFORE the topology-barrier refiner
  // branch below, which also matches seat 'war-refiner'.)
  if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
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
const isServitor = (c) => seatOf(c.opts) === 'war-servitor'

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

test('the servitor (Wrap-up) prompt no longer names WAR_WORKTREE (Task 6 clean-surface)', async () => {
  // The retired env var must not appear in the servitor prompt: the worktree-scope hook confines the
  // servitor by agent_type, not by an env-var the prompt sets (ADR 0002). The happy-path harness lands
  // + wraps up, so a servitor seat is dispatched and its prompt is inspectable. It must still hand the
  // servitor its absolute learnings target, just without the stale (also set as WAR_WORKTREE) clause.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  assert.ok(!/WAR_WORKTREE/.test(wrap.prompt), 'servitor prompt does NOT contain WAR_WORKTREE')
  assert.ok(wrap.prompt.includes('/abs/learnings'), 'servitor prompt still carries the absolute learnings target')
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

test('Part B seam is now FILLED — run.provision is consumed and env-blocked is wired (was the Part-A seam guard)', () => {
  // Part A left this barrier OPEN with a seam guard asserting run.provision / env-blocked were NOT
  // yet wired. Part B FILLS that seam (this is the planned inversion, not a deleted guard): the
  // refiner barrier now reads the pinned run.provision list and emits env-blocked on a failed step.
  // We strip comments first so the assertion reads executable code only (mirrors the red-team
  // scaffold survival checks) — prose mentions don't count.
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/run\.provision|run\[['"]provision['"]\]/.test(code), 'the run.provision list is now consumed in executable code')
  assert.ok(/env-blocked|env_blocked/.test(code), 'the env-blocked outcome is now wired in executable code')
  // The setup-scout is still NOT wired here — that lives in war-room Setup (Task 7), not the barrier.
  assert.ok(!/setup-scout|setupScout/.test(code), 'the setup-scout is still not wired in the barrier (it lives in war-room Setup)')
})

// --- Part B: per-task run.provision execution in the refiner barrier ------------------------
// A pinned run.provision list runs, IN ORDER, inside each task worktree AFTER the worktree exists
// and BEFORE the worker is spawned. On the first failing step the barrier emits an `env-blocked`
// task outcome ({ taskId, failedCommand, exitCode, stderrTail, provisionSource } — schemas.md) and
// the worker is NOT spawned and the worktree is KEPT. On success the worker runs as normal. The
// per-task provision step is a refiner seat in phase 'Provision' labelled provision-run:<taskId>.
const isProvisionRun = (c) => c.opts.phase === 'Provision' && /^provision-run:/.test(c.opts.label || '')
const PROVISION_LIST = ['pnpm install --frozen-lockfile', 'git submodule update --init --recursive']
const withProvision = (over = {}) =>
  PROVISION_ARGS({ run: { provision: PROVISION_LIST, provisionSource: 'ci' }, ...over })

test('run.provision runs (per task) BEFORE that task\'s worker is spawned (Part B)', async () => {
  const { calls } = await runPhase(withProvision(), defaultImpl)
  const provRunIdx = idx(calls, isProvisionRun)
  const workIdx = idx(calls, isWorker)
  assert.notEqual(provRunIdx, -1, 'a per-task provision-run step is dispatched')
  assert.notEqual(workIdx, -1, 'a worker is dispatched')
  assert.ok(provRunIdx < workIdx, 'the provision-run step precedes the first worker')
  const pr = calls[provRunIdx]
  assert.equal(seatOf(pr.opts), 'war-refiner', 'the provision-run step is a refiner seat (refiner owns provisioning)')
  // The pinned commands are threaded into the prompt, in order, to be run inside the worktree.
  for (const cmd of PROVISION_LIST) assert.ok(pr.prompt.includes(cmd), `provision-run prompt carries the command: ${cmd}`)
  assert.ok(pr.prompt.indexOf(PROVISION_LIST[0]) < pr.prompt.indexOf(PROVISION_LIST[1]), 'commands are threaded in order')
  assert.ok(pr.prompt.includes('/abs/repo/.claude/worktrees/run-2026/t1'), 'provision-run runs inside the task worktree')
})

test('a failing provision step → env-blocked outcome, worker NOT spawned, worktree KEPT (Part B)', async () => {
  // The provision-run agent reports the env-blocked shape for t1.
  // NOTE (Task 3 F02 update): PROVISION_ARGS includes t2 with deps:['t1']. Because t1 is env-blocked
  // (not succeeded), t2 is now flagged dep-failed (hard escalation) — the land IS held. env-blocked
  // itself is a soft escalation, but a downstream dep-failed (from Task 3's succeeded-gate) makes
  // the land held. Siblings with NO dep on t1 would still proceed; only true dependents are blocked.
  const impl = (prompt, opts) => {
    if (isProvisionRun({ opts }) && (opts.label || '').includes('t1')) {
      return { ok: false, taskId: 't1', failedCommand: 'pnpm install --frozen-lockfile',
               exitCode: 1, stderrTail: 'ERR_PNPM_NO_LOCKFILE', provisionSource: 'ci' }
    }
    return defaultImpl(prompt, opts)
  }
  const { out, calls } = await runPhase(withProvision(), impl)
  // (a) the worker for t1 is NOT spawned.
  const t1Worker = calls.find((c) => isWorker(c) && c.prompt.includes('task t1'))
  assert.ok(!t1Worker, 'the worker for the env-blocked task t1 is NOT spawned')
  // (b) an env-blocked outcome is surfaced (escalated like any other) with the exact schema shape.
  const eb = (out.escalated || []).find((e) => e && e.reason === 'env-blocked')
  assert.ok(eb, 'an env-blocked escalation is surfaced for the Lead')
  assert.equal(eb.task, 't1', 'the env-blocked outcome names the failed task')
  const o = eb.outcome || eb.detail || eb
  assert.equal(o.taskId, 't1', 'env-blocked outcome carries taskId')
  assert.equal(o.failedCommand, 'pnpm install --frozen-lockfile', 'env-blocked outcome carries failedCommand')
  assert.equal(o.exitCode, 1, 'env-blocked outcome carries exitCode')
  assert.equal(o.stderrTail, 'ERR_PNPM_NO_LOCKFILE', 'env-blocked outcome carries stderrTail')
  assert.equal(o.provisionSource, 'ci', 'env-blocked outcome carries provisionSource')
  // (c) the worktree is KEPT — no teardown/cleanup/remove agent is dispatched for t1.
  const cleanup = calls.find((c) => /remove-worktree|worktree remove|teardown|clean ?up/i.test(c.prompt))
  assert.ok(!cleanup, 'the env-blocked worktree is KEPT (no cleanup/teardown is dispatched)')
  // (Task 3 F02): t2 has deps:['t1']; t1 env-blocked → t2 is dep-failed (hard escalation) → land held.
  // env-blocked alone is soft; the dep-failed consequence is hard. Tasks independent of t1 would land.
  const t2DepFailed = (out.escalated || []).find((e) => e && e.task === 't2' && e.reason === 'dep-failed')
  assert.ok(t2DepFailed, 'dep-failed escalation for t2 (its dep t1 env-blocked, not succeeded) (Task 3 F02)')
})

test('a successful provision step → the worker IS spawned (Part B)', async () => {
  // defaultImpl returns the success shape ({ ok:true }) for the provision-run agent.
  const { calls } = await runPhase(withProvision(), (p, o) =>
    isProvisionRun({ opts: o }) ? { ok: true } : defaultImpl(p, o))
  const t1Worker = calls.find((c) => isWorker(c) && c.prompt.includes('task t1'))
  assert.ok(t1Worker, 'a successful provision-run lets the worker spawn')
})

test('the resolved run.provision list also reaches the fix-worker setup (Part B)', async () => {
  // Force one blocking audit round so a fix-worker is dispatched; its setup must re-run the same
  // pinned provision list (the fix-worker works in the same worktree and needs the same env).
  let auditRounds = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (isProvisionRun({ opts })) return { ok: true }
    if (seat === 'war-auditor') {
      auditRounds++
      return auditRounds <= 1
        ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'fix me', file: 'a.js', rationale: 'because' }] }
        : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    return defaultImpl(prompt, opts)
  }
  const { calls } = await runPhase(withProvision({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
  ] }), impl)
  const fix = calls.find(isFixWorker)
  assert.ok(fix, 'a fix-worker was dispatched on the blocking finding')
  for (const cmd of PROVISION_LIST) assert.ok(fix.prompt.includes(cmd), `fix-worker setup carries the provision command: ${cmd}`)
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

// ---------------------------------------------------------------------------
// Task 5: _refinery worktree wiring — barrier, merge-task, land, resync
// ---------------------------------------------------------------------------

// Helper: find the provision-topology (non provision-run) refiner seat.
const isProvisionTopology = (c) =>
  c.opts.phase === 'Provision' && seatOf(c.opts) === 'war-refiner' &&
  !/^provision-run:/.test(c.opts.label || '')
const isMergeTask = (c) =>
  seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Refine'
const isLand = (c) =>
  seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Land'

test('Task 5 — Provision barrier mentions ensure-refinery-worktree', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const prov = calls.find(isProvisionTopology)
  assert.ok(prov, 'a topology-level Provision barrier is dispatched')
  assert.match(prov.prompt, /ensure-refinery-worktree/,
    'the barrier instructs ensure-refinery-worktree')
  // Must reference the _refinery path under worktreeRoot/runId
  assert.ok(prov.prompt.includes('/abs/repo/.claude/worktrees/run-2026') &&
            prov.prompt.includes('_refinery'),
    'the barrier names the _refinery path under worktreeRoot/runId')
  // Must mention the integration branch as the second argument
  assert.ok(prov.prompt.includes('integration/wtprov-a/phase-3'),
    'the barrier passes the integrationBranch to ensure-refinery-worktree')
})

test('Task 5 — merge-task prompt: rebase runs git -C in the TASK worktree, merge runs in _refinery', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const merge = calls.find(isMergeTask)
  assert.ok(merge, 'a merge-task (Refine) refiner seat is dispatched')
  const p = merge.prompt
  // Must mention git -C <taskWorktree> rebase (rebase in the task worktree, not _refinery)
  assert.match(p, /git\s+-C\b.*rebase/,
    'merge-task prompt mentions git -C <worktree> rebase (rebase in the task worktree)')
  // The task worktree path must appear near the rebase instruction
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/t1'),
    'task worktree path is referenced in the merge-task prompt')
  // Must instruct merging in _refinery
  assert.match(p, /_refinery/,
    'merge-task prompt mentions _refinery for the merge step')
  // Must state that rebase cannot run in _refinery
  assert.match(p, /cannot.{0,50}rebase.{0,80}_refinery|_refinery.{0,80}cannot.{0,50}rebase/i,
    'merge-task prompt states rebase cannot run in _refinery')
  // Must state rebase --onto does not dodge it
  assert.match(p, /rebase\s+--onto.{0,60}(not|does not|doesn.t|cannot)/i,
    'merge-task prompt states rebase --onto does not dodge the constraint')
  // Must instruct git merge <task.branch> (merge from the task branch into integration in _refinery)
  assert.match(p, /git\s+merge\b.*war\/wtprov-a\/p3-t1/,
    'merge-task prompt mentions git merge of the task branch in _refinery')
})

test('Task 5 — land prompt: detached at origin/<working>, land-advance, reland loop, land_stale on exhaustion', async () => {
  // Need to trigger land — use defaultImpl which returns {status:'landed'} so land fires.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const land = calls.find(isLand)
  assert.ok(land, 'a land-phase (Land) refiner seat is dispatched')
  const p = land.prompt
  // Detached checkout at origin/<workingBranch>
  assert.match(p, /detach|detached/i,
    'land prompt mentions detached checkout')
  assert.ok(p.includes('origin/') && p.includes('dev/wtprov-a'),
    'land prompt references origin/<workingBranch>')
  assert.ok(p.includes('_refinery'),
    'land prompt operates in _refinery')
  // push-first CAS via land-advance
  assert.match(p, /land-advance/,
    'land prompt mentions land-advance for the push-first CAS')
  // reland loop bounded by roundLimit
  assert.match(p, /reland/i,
    'land prompt mentions reland')
  assert.ok(p.includes('roundLimit') || /round.{0,10}limit/i.test(p),
    'land prompt references roundLimit for the bounded reland loop')
  // land_stale on exhaustion
  assert.match(p, /land_stale/,
    'land prompt returns land_stale on exhaustion of reland attempts')
})

test('Task 5 — MERGE_RESULT inline enum includes land_stale', () => {
  // The template mirrors MERGE_RESULT status enum inline (the Workflow sandbox can't import).
  // Extract the MERGE_RESULT status enum values from the template source.
  const match = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(match, 'MERGE_RESULT with a status enum found in workflow-template.js')
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  assert.ok(parsed.includes('land_stale'),
    'MERGE_RESULT status enum includes land_stale')
})

test('Task 5 — HARD_ESCALATION_REASONS inline includes land_stale', () => {
  // The inline mirror in the template must now match the canonical export (4 items after Task 5).
  const match = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(match, 'HARD_ESCALATION_REASONS found in workflow-template.js')
  const normalized = match[1].replace(/'/g, '"')
  const parsed = JSON.parse(normalized)
  assert.ok(parsed.includes('land_stale'),
    'inline HARD_ESCALATION_REASONS includes land_stale')
})

test('Task 5 — land_stale holds the land (hard escalation)', async () => {
  // A phase where a task lands but another has reason:'land_stale' → held:escalation.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'land_stale' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation',
    'land_stale is a hard escalation → land is held')
})

test('Task 5 — land step gate_failed → landDecision held:land-failed + escalated reason gate_failed (#99)', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'gate_failed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed',
    'gate_failed land step → landDecision held:land-failed')
  const landEsc = out.escalated.find(e => e.task && e.task.includes('-land'))
  assert.ok(landEsc, 'escalated entry exists for the land step')
  assert.equal(landEsc.reason, 'gate_failed', 'escalated reason is gate_failed')
})

test('Task 5 — land step error → landDecision held:land-failed + escalated reason error (#99)', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'error' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed',
    'error land step → landDecision held:land-failed')
  const landEsc = out.escalated.find(e => e.task && e.task.includes('-land'))
  assert.ok(landEsc, 'escalated entry exists for the land step')
  assert.equal(landEsc.reason, 'error', 'escalated reason is error')
})

test('Task 5 — source-text: else-if for error/gate_failed demote to held:land-failed is present (#99)', () => {
  assert.match(src, /else if \(landResult && \(landResult\.status === 'error' \|\| landResult\.status === 'gate_failed'\)\)/,
    'source contains the else-if branch for error/gate_failed → held:land-failed')
  assert.match(src, /landDecision = 'held:land-failed'/,
    "source sets landDecision to 'held:land-failed'")
})

test('Task 5 — opportunistic resync: after landed, Lead runs ff-only clean-guard resync (prompt check)', async () => {
  // The wrap-up or a final step must reference the ff-only resync against the Lead cwd.
  // We verify the template source describes the resync logic (it is in the land flow or as a comment
  // describing what the Lead does next — not a separate agent seat, but wired as inline instructions
  // or a post-land log/prompt).
  // The key tokens from §5.4: ff-only (or fast-forward), on-branch, clean (or clean-guard), advance.
  const { calls, logs } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // Either a log message or an agent prompt after the land seat must reference the resync.
  const landIdx = calls.findIndex(isLand)
  const postLandCalls = calls.slice(landIdx + 1)
  const allPostText = [
    ...postLandCalls.map(c => c.prompt),
    ...logs,
  ].join('\n')
  // The template source itself must also contain the resync wording (as inline instruction text).
  const srcHasResync = /ff.only|fast.forward/i.test(src) &&
                       /resync|re-sync/i.test(src) &&
                       /clean/i.test(src)
  const postHasResync = /ff.only|fast.forward/i.test(allPostText) ||
                        /resync|re-sync/i.test(allPostText)
  assert.ok(srcHasResync || postHasResync,
    'template describes the ff-only clean-guard resync after a landed result')
})

// ---------------------------------------------------------------------------
// Task 2 (Phase 2 — F11): Coven quorum integrity — retry dropped seats, never approve a shrunk panel
// ---------------------------------------------------------------------------

// Per-label call-sequence harness helper.
// Build an agentImpl that dispatches call-sequence overrides keyed by label, falling back to a base impl.
// seqMap: { '<label>': [result0, result1, ...] } — each call to that label pops the first entry.
// The call-sequence entries can be null (simulating a dropped seat) or a verdict object.
function buildSeqImpl(seqMap, fallback) {
  const queues = {}
  for (const [label, seq] of Object.entries(seqMap)) {
    queues[label] = [...seq]
  }
  return (prompt, opts) => {
    const label = opts.label || ''
    if (Object.prototype.hasOwnProperty.call(queues, label) && queues[label].length > 0) {
      return queues[label].shift()
    }
    return fallback(prompt, opts)
  }
}

// Single-task args for audit tests (no deps, single lens via lenses:[...]).
const AUDIT_ARGS = (over = {}) => ({
  ...PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'] },
  ] }),
  ...over,
})

// coven=true so all 3 lenses are used; covenSize: 3 to pin panel size.
const COVEN_ARGS = (over = {}) => AUDIT_ARGS({
  ...over,
  tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      lenses: ['correctness', 'cascading-impact', 'plan-faithfulness'], coven: true },
  ],
  audit: { covenSize: 3, autoEscalate: false },
})

test('Task 2 — transient drop recovers: 3-lens coven, one lens returns null first call then approves on retry → full panel', async () => {
  // The per-label call-sequence harness drives 'audit:t1:cascading-impact' to return null on call 1,
  // then return an approve verdict on call 2 (retry). The round should still see 3 approved seats.
  const approveVerdictFor = (label) => ({ seat: label, lens: 'cascading-impact', verdict: 'approve', findings: [], confidence: 'high' })
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, approveVerdictFor('audit:t1:cascading-impact')] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
      if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label.split(':')[2] || 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out } = await runPhase(COVEN_ARGS(), impl)
  // The task must land (not be audit-blocked) since the drop was transient.
  assert.ok(out.landed.includes('t1'), 'transient drop recovers — t1 should land (not audit-blocked)')
  // No audit-blocked escalation.
  const blocked = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'audit-blocked')
  assert.ok(!blocked, 'transient drop does not yield audit-blocked escalation')
})

test('Task 2 — persistent drop → audit-blocked: a lens that returns null on ALL attempts (initial + 2 retries)', async () => {
  // 'audit:t1:cascading-impact' returns null every time (never recovers even after retries).
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, null, null] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
      if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label.split(':')[2] || 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out } = await runPhase(COVEN_ARGS(), impl)
  // The task must be audit-blocked (persistent drop → quorum shrunk → never approve).
  assert.ok(!out.landed.includes('t1'), 'persistent drop → t1 does not land')
  const blocked = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'audit-blocked')
  assert.ok(blocked, 'persistent drop → audit-blocked escalation for t1')
})

test('Task 2 — allApprove requires the full panel: even all-approve seats are rejected if count < expected', () => {
  // This test directly verifies the allApprove(seats, expected) signature in the template source.
  // The current (pre-fix) allApprove is seats => seats.length > 0 && every(approve).
  // The new allApprove must be (seats, expected) => seats.length === expected && every(approve).
  // We verify this by checking the template source for the new signature pattern.
  assert.match(src, /allApprove\s*=\s*\(\s*seats\s*,\s*expected\s*\)/,
    'allApprove has a two-argument signature (seats, expected)')
  assert.match(src, /seats\.length\s*===\s*expected/,
    'allApprove checks seats.length === expected (not just > 0)')
})

test('Task 2 — auditLog records requested and returned on a persistent drop', async () => {
  // A 3-seat coven where one seat never returns → shortfall logged as { requested:3, returned:2 }.
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, null, null] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
      if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label.split(':')[2] || 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out } = await runPhase(COVEN_ARGS(), impl)
  const entry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(entry, 'an auditLog entry exists for t1')
  assert.equal(entry.requested, 3, 'auditLog.requested = 3 (full expected panel)')
  assert.equal(entry.returned, 2, 'auditLog.returned = 2 (one seat persistently dropped)')
})

test('Task 2 — auditRound return shape is { seats, expected } (not a bare array)', () => {
  // Verify the template source unpacks auditRound at both call sites using destructuring.
  // The plan mandates: ;({ seats, expected } = await auditRound(task, null)) at round-loop call site,
  // and similarly for the rebuttal call.
  assert.match(src, /\{\s*seats\s*,\s*expected\s*\}\s*=\s*await\s+auditRound/,
    'auditRound return value is destructured as { seats, expected }')
})

// ---------------------------------------------------------------------------
// Task 3 (Phase 3 — F02): Scheduler succeeded-gate
// A failed predecessor must block its true dependents; only a merged task succeeds.
// ---------------------------------------------------------------------------

// 3-task DAG: t2 depends on t1, t3 is independent.
// This is the canonical harness for Task 3 behavioral tests.
const DAG_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/aschi/phase-3', workingBranch: 'dev/aschi' },
  plan: { file: 'docs/plans/aschi.md', gate: 'make gate' },
  planSlug: 'aschi',
  runId: 'run-dag',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 't1', issue: 201, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
    { id: 't2', issue: 202, title: 'Task two', planSlice: 'slice 2', lenses: ['correctness'], deps: ['t1'] },
    { id: 't3', issue: 203, title: 'Task three', planSlice: 'slice 3', lenses: ['correctness'] },
  ],
  learningsTarget: null,
  ...over,
})

// Base impl for DAG tests: provision always ok, t1 defaults to escalate (worker returns blocked),
// t2/t3 default to implemented+approve+merged. The caller can override specific pieces.
const dagBaseImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
  if (seat === 'war-worker') {
    // Force t1 to escalate (worker returns blocked)
    if (/task t1\b/i.test(prompt) || (opts.label || '').includes(':t1')) {
      return { task_id: 't1', status: 'blocked', blocked_reason: 'forced escalation for test' }
    }
    return { task_id: 'tx', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 3, integration: 1 } }
  }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

test('Task 3 — failed predecessor blocks dependent: t1 escalates → t2 never spawns a worker, t3 still runs', async () => {
  const { out, calls } = await runPhase(DAG_ARGS(), dagBaseImpl)
  // t2 must never have a worker spawned (it depends on t1 which escalated)
  const t2Worker = calls.find(c => isWorker(c) && /task t2\b/i.test(c.prompt))
  assert.ok(!t2Worker, 't2 worker is NOT spawned when t1 escalated')
  // t3 is independent — it must still run
  const t3Worker = calls.find(c => isWorker(c) && /task t3\b/i.test(c.prompt))
  assert.ok(t3Worker, 't3 (independent) worker IS spawned despite t1 failing')
  // t2 must be in escalated with reason dep-failed naming t1
  const t2Esc = (out.escalated || []).find(e => e && e.task === 't2')
  assert.ok(t2Esc, 't2 appears in escalated[]')
  assert.equal(t2Esc.reason, 'dep-failed', 't2 escalation reason is dep-failed')
  assert.ok((t2Esc.failedDeps || []).includes('t1'), 't2 dep-failed names t1 as the failed dep')
})

test('Task 3 — dep-failed task appears in escalated with correct shape', async () => {
  const { out } = await runPhase(DAG_ARGS(), dagBaseImpl)
  const t2Esc = (out.escalated || []).find(e => e && e.task === 't2' && e.reason === 'dep-failed')
  assert.ok(t2Esc, 't2 is in escalated with reason dep-failed')
  assert.ok(Array.isArray(t2Esc.failedDeps), 't2 dep-failed carries failedDeps array')
  assert.ok(t2Esc.failedDeps.includes('t1'), 'failedDeps includes t1')
})

test('Task 3 — phase land is held when a dep-failed escalation exists', async () => {
  const { out } = await runPhase(DAG_ARGS(), dagBaseImpl)
  // dep-failed is a HARD_ESCALATION_REASON, so the land must be held
  assert.equal(out.landDecision, 'held:escalation',
    'phase land is held:escalation when dep-failed is present')
})

test('Task 3 — env-blocked predecessor blocks true dependent (env-blocked is not success)', async () => {
  // t1 returns env-blocked (provision failure); t2 should be dep-failed, not spawn a worker.
  // A provision list is required to trigger the provision-run agent path (empty list is a no-op ok:true).
  const dagWithProvision = {
    ...DAG_ARGS(),
    run: { provision: ['npm install'], provisionSource: 'ci' },
  }
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) {
      // t1 provision fails; t2/t3 provision succeeds
      if ((opts.label || '').includes('t1')) {
        return { ok: false, taskId: 't1', failedCommand: 'npm install', exitCode: 1, stderrTail: 'err', provisionSource: 'ci' }
      }
      return { ok: true }
    }
    if (seat === 'war-worker') return { task_id: 'tx', status: 'implemented', head_sha: 'deadbeef' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(dagWithProvision, impl)
  // t2 must NOT spawn a worker (its dep t1 env-blocked, not succeeded)
  const t2Worker = calls.find(c => isWorker(c) && /task t2\b/i.test(c.prompt))
  assert.ok(!t2Worker, 't2 worker is NOT spawned when t1 is env-blocked (env-blocked is not success)')
  // t2 must be dep-failed
  const t2Esc = (out.escalated || []).find(e => e && e.task === 't2' && e.reason === 'dep-failed')
  assert.ok(t2Esc, 't2 is dep-failed when its dep env-blocked (env-blocked is not a success)')
})

test('Task 3 — success unblocks: t1 merged → t2 runs normally', async () => {
  // t1 succeeds (merged); t2 depends on t1 and should then run
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 'tx', status: 'implemented', head_sha: 'deadbeef' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(DAG_ARGS(), impl)
  // t2 should spawn a worker (t1 merged = succeeded)
  const t2Worker = calls.find(c => isWorker(c) && /task t2\b/i.test(c.prompt))
  assert.ok(t2Worker, 't2 worker IS spawned after t1 merges (succeeded)')
  // t1 and t2 should both land
  assert.ok(out.landed.includes('t1'), 't1 is in landed[]')
  assert.ok(out.landed.includes('t2'), 't2 is in landed[]')
  // No dep-failed escalations
  const depFailed = (out.escalated || []).find(e => e && e.reason === 'dep-failed')
  assert.ok(!depFailed, 'no dep-failed escalations when all deps succeed')
})

test('Task 3 — termination: done.size reaches tasks.length with no spin (dep-failed adds to done without worker)', async () => {
  // Even with t1 failing (t2 dep-failed), done must eventually cover all 3 tasks so the loop exits
  const { out } = await runPhase(DAG_ARGS(), dagBaseImpl)
  // All 3 tasks must appear in either landed or escalated (done tracks them all)
  const allDone = new Set([...(out.landed || []), ...(out.escalated || []).map(e => e && e.task)])
  assert.ok(allDone.has('t1'), 't1 is accounted for (escalated as escalate)')
  assert.ok(allDone.has('t2'), 't2 is accounted for (dep-failed, added to done without worker)')
  assert.ok(allDone.has('t3'), 't3 is accounted for (landed or escalated)')
})

test('Task 3 — succeeded set exists in template source and gates nextWave', () => {
  // Structural: verify the template declares `succeeded` and uses it in nextWave
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/const\s+succeeded\s*=\s*new\s+Set\s*\(\s*\)/.test(code),
    'template declares `const succeeded = new Set()`')
  assert.ok(/succeeded\.add/.test(code),
    'template calls succeeded.add(...)')
  assert.ok(/succeeded\.has/.test(code),
    'template uses succeeded.has(...) — the gate for nextWave/dep-block')
})

// ---------------------------------------------------------------------------
// Task 4 (Phase 4 — F04): Auditor anti-cheat + post-merge gate-audit pass
// ---------------------------------------------------------------------------

test('Task 4 — war-auditor.md does NOT contain the literal "EXIST and PASS"', () => {
  // The auditor can only verify test EXISTENCE + integrity (not weakened/skipped); it cannot run them.
  // The refiner runs the gate. The literal "EXIST and PASS" must be gone from the agent doc.
  assert.ok(!auditorMd.includes('EXIST and PASS'),
    'war-auditor.md must not contain the literal "EXIST and PASS" — auditor verifies existence + integrity only')
})

test('Task 4 — war-auditor.md states the refiner runs the gate', () => {
  // The doc must clarify that the refiner (not the auditor) actually executes/runs the gate.
  assert.match(auditorMd, /refiner/i,
    'war-auditor.md must mention the refiner (which runs the gate)')
})

test('Task 4 — war-auditor.md still directs the auditor to verify test existence + integrity (anti-cheat)', () => {
  // Must still catch "green by deletion" — just not claim to execute tests.
  assert.match(auditorMd, /exist|existence/i,
    'war-auditor.md must still direct the auditor to verify test existence')
  // The integrity check (not weakened / not skipped) must be present
  assert.match(auditorMd, /weaken|skip|integrity/i,
    'war-auditor.md must mention weakening or skipping (anti-cheat integrity check)')
})

test('Task 4 — auditPrompt does NOT contain "EXIST and PASS" in generated prompt', async () => {
  // The auditPrompt function must no longer embed the literal "EXIST and PASS".
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(isAuditor)
  assert.ok(auditCalls.length > 0, 'at least one auditor call was made')
  for (const c of auditCalls) {
    assert.ok(!c.prompt.includes('EXIST and PASS'),
      `audit prompt must not say "EXIST and PASS": got "${c.prompt.slice(0, 200)}"`)
  }
})

test('Task 4 — auditPrompt threads the worker tests summary into the generated prompt', async () => {
  // The mock worker returns tests:{unit:5,integration:2}; the audit prompt must carry that info
  // so the auditor can cross-check the claim vs the diff.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(isAuditor)
  assert.ok(auditCalls.length > 0, 'at least one auditor call was made')
  // The prompt must reference the worker's tests summary (unit/integration counts or the object)
  const auditPromptText = auditCalls[0].prompt
  assert.ok(
    /unit|integration|tests/i.test(auditPromptText),
    'audit prompt must thread in the worker-reported tests summary'
  )
})

test('Task 4 — post-merge gate-audit pass: a war-auditor with lens execution-evidence is spawned after the merge queue', async () => {
  // The post-merge gate-audit pass spawns read-only war-auditor seats with lens 'execution-evidence'
  // for each merged task, AFTER the refine loop completes and BEFORE the Land decision.
  // We use PROVISION_ARGS (t2 deps t1) with both merging, so two merged tasks → two gate-audit seats.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label || 'correctness', verdict: 'approve', findings: [], confidence: 'high', tests_verified: { exist: true } }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(PROVISION_ARGS(), impl)
  // The gate-audit seats must have lens 'execution-evidence' (check via prompt or label)
  const gateAuditCalls = calls.filter(c =>
    seatOf(c.opts) === 'war-auditor' &&
    (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
  )
  assert.ok(gateAuditCalls.length > 0,
    'at least one post-merge gate-audit seat with lens execution-evidence must be spawned')
})

test('Task 4 — post-merge gate-audit prompt references the executed gate output', async () => {
  // The gate-audit seat prompt must include the gate output from the refiner's merged result.
  const GATE_OUT = 'ok 5 tests passed\n1 suite, 5 assertions'
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label || 'correctness', verdict: 'approve', findings: [], confidence: 'high', tests_verified: { exist: true } }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: GATE_OUT }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(PROVISION_ARGS(), impl)
  const gateAuditCalls = calls.filter(c =>
    seatOf(c.opts) === 'war-auditor' &&
    (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
  )
  assert.ok(gateAuditCalls.length > 0, 'gate-audit seats exist')
  const gateAuditPrompt = gateAuditCalls[0].prompt
  assert.ok(gateAuditPrompt.includes(GATE_OUT),
    'gate-audit prompt must include the executed gate output from the refiner')
})

test('Task 4 — post-merge gate-audit does NOT block the land (soft by default)', async () => {
  // The gate-audit pass is parallel and AFTER the serial merge queue; it must not hold the land.
  // Even if a gate-audit seat returns a non-approve verdict, landDecision is still 'landed'.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') {
      // Gate-audit seats return a non-approve verdict (soft finding)
      if ((c => c.prompt && c.prompt.includes('execution-evidence'))({ prompt: prompt })) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'request_changes',
                 findings: [{ severity: 'Minor', title: 'gate-evidence soft', file: '', rationale: 'soft' }],
                 confidence: 'high', tests_verified: { exist: true } }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high', tests_verified: { exist: true } }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  // The land must still proceed (gate-audit is soft — does not hold the land)
  assert.equal(out.landDecision, 'landed',
    'post-merge gate-audit is soft (default) and must not hold the land')
})

test('Task 4 — post-merge gate-audit HARD case: Critical/Major finding holds the land (held:escalation)', async () => {
  // A gate-audit seat returning a Critical/Major gate-evidence finding → landDecision==='held:escalation'.
  // This is the "provably unrun" path from Open decision #1 (resolved: operationally defined).
  // A Minor finding (soft) must NOT hold the land; only Critical/Major triggers the hard path.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') {
      // Gate-audit seats return a Critical gate-evidence finding (provably-unrun mapped test).
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
                 findings: [{ severity: 'Critical', title: 'mapped test provably unrun',
                              file: 'test/foo.test.js', rationale: 'test present in diff but 0-count in gate output' }],
                 confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  // The land must be HELD (a provably-unrun mapped test is a hard gate-evidence escalation)
  assert.equal(out.landDecision, 'held:escalation',
    'Critical gate-evidence finding (provably unrun) must hold the land (held:escalation)')
  // The escalated array must contain a gate-evidence reason
  const gateEscalation = (out.escalated || []).find(e => e && e.reason === 'gate-evidence')
  assert.ok(gateEscalation, 'escalated[] must contain a gate-evidence entry for the hard case')
  // The auditLog must record hard:true for the finding
  const auditEntry = (out.auditLog || []).find(e => e && e.gateEvidence)
  assert.ok(auditEntry, 'auditLog must have a gateEvidence entry')
  assert.equal(auditEntry.hard, true, 'auditLog gate-evidence entry must be marked hard:true for Critical/Major findings')
})

test('Task 4 — post-merge gate-audit HARD case: Major finding also holds the land', async () => {
  // Major severity (not just Critical) is also a provably-unrun signal per the operationally-defined convention.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 3 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'request_changes',
                 findings: [{ severity: 'Major', title: 'mapped test absent in gate output',
                              file: 'test/bar.test.js', rationale: 'test in diff but absent from gate_output' }],
                 confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 3 tests passed' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation',
    'Major gate-evidence finding (provably unrun) must also hold the land (held:escalation)')
  const gateEscalation = (out.escalated || []).find(e => e && e.reason === 'gate-evidence')
  assert.ok(gateEscalation, 'escalated[] must contain a gate-evidence entry for Major severity')
})

test('Task 4 — post-merge gate-audit is PARALLEL (runs over all merged tasks, not one-by-one inline)', async () => {
  // Structural: the template source must use parallel(...) for the gate-audit pass
  // (after the refine for-loop, before the Land decision).
  // The gate-audit pass label or prompt contains 'execution-evidence' and is dispatched via parallel.
  // We confirm by checking the source contains a pattern combining parallel and execution-evidence.
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(/execution.evidence/.test(code),
    'template source must reference execution-evidence lens (gate-audit pass)')
  // The gate-audit pass must use parallel() — check for parallel(...) surrounding the gate-audit agent calls.
  assert.ok(/parallel\s*\(/.test(code) && /execution.evidence/.test(code),
    'template uses parallel() for the gate-audit pass')
})

test('Task 4 — schemas.md: AuditVerdict.tests_verified means existence+integrity, not execution', () => {
  // schemas.md must be updated to clarify that tests_verified means existence+integrity, not execution.
  const schemasMd = readFileSync(
    join(here, '../references/schemas.md'), 'utf8'
  )
  // The tests_verified field comment must NOT say "pass: true" means the auditor ran them,
  // OR it must have a clarifying note that it means existence+integrity (not execution).
  // We check: either the pass:true field is gone, or there is a clarifying note.
  const hasIntegrityNote = /integrity|existence.*not.*execut|not.*execut.*existence|auditor.*cannot.*execut|refiner.*runs.*gate/i.test(schemasMd)
  assert.ok(hasIntegrityNote,
    'schemas.md must clarify that tests_verified means existence+integrity verified, not executed by the auditor')
})

test('Task 4 — MERGE_RESULT schema already permits gate_output (no schema change needed)', () => {
  // gate_output is already optional in the inline MERGE_RESULT schema.
  // A merged result with gate_output:'...' must be schema-valid.
  // We verify by checking the template source includes gate_output in the MERGE_RESULT properties.
  assert.match(src, /gate_output/,
    'MERGE_RESULT schema includes gate_output as an optional field')
  // It must NOT be in the required array
  const mergeResultSection = src.match(/const\s+MERGE_RESULT\s*=[\s\S]*?(?=\n\nconst )/)
  if (mergeResultSection) {
    const section = mergeResultSection[0]
    // gate_output must NOT be in required array
    const requiredMatch = section.match(/required\s*:\s*\[([^\]]*)\]/)
    if (requiredMatch) {
      assert.ok(!requiredMatch[1].includes('gate_output'),
        'gate_output is optional in MERGE_RESULT (not in required array)')
    }
  }
})

// ---------------------------------------------------------------------------
// Task 4 (F10): integration-tip placeholder resolution — global guard
// Both the Provision-prompt per-task ensure-worktree line AND the refine-loop
// rebase instruction must resolve to concrete refs; no bare <integration-tip>
// must appear anywhere in the emitted template text.
// ---------------------------------------------------------------------------

test('F10 — global guard: no bare <integration-tip> appears anywhere in the emitted template (both occurrences)', async () => {
  // This test covers BOTH locations:
  //   (1) Provision-prompt per-task ensure-worktree line (~line 211)
  //   (2) refine-loop rebase instruction (~line 307)
  // The entire set of emitted prompts (all agent calls) must be free of the literal <integration-tip>.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const allPromptText = calls.map(c => c.prompt).join('\n')
  assert.ok(!allPromptText.includes('<integration-tip>'),
    'no bare <integration-tip> must appear in any emitted prompt (covers both Provision and refine-loop)')
})

test('F10 — Provision prompt step 3: emits TIP capture command and per-task ensure-worktree uses "$TIP"', async () => {
  // Step 3 of the Provision prompt must:
  //   (a) emit a TIP capture: TIP="$(git rev-parse <integrationBranch>)"
  //   (b) each per-task ensure-worktree line references "$TIP" (not <integration-tip>)
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const prov = calls.find(isProvision)
  assert.ok(prov, 'a Provision barrier is dispatched')
  const p = prov.prompt
  // Step 3 must instruct capturing TIP via git rev-parse of the integrationBranch
  assert.match(p, /TIP\s*=\s*["`'$\(].*git\s+rev-parse/,
    'Provision step 3 emits TIP="$(git rev-parse <integrationBranch>)" capture')
  // The per-task ensure-worktree lines must reference "$TIP", not a bare placeholder
  assert.ok(p.includes('"$TIP"'),
    'per-task ensure-worktree lines reference "$TIP" (not a bare <integration-tip>)')
  // Still must NOT contain the bare placeholder
  assert.ok(!p.includes('<integration-tip>'),
    'Provision prompt must NOT contain bare <integration-tip>')
})

test('F10 — refine-loop rebase instruction: uses concrete integrationBranch ref, not <integration-tip>', async () => {
  // The merge-task (Refine) prompt's rebase instruction must reference ph.integrationBranch
  // directly (a concrete ref like integration/wtprov-a/phase-3), not the bare <integration-tip>.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const merge = calls.find(isMergeTask)
  assert.ok(merge, 'a merge-task (Refine) refiner seat is dispatched')
  const p = merge.prompt
  // Must NOT contain the bare placeholder
  assert.ok(!p.includes('<integration-tip>'),
    'merge-task (Refine) prompt must NOT contain bare <integration-tip> — use ph.integrationBranch')
  // Must contain the concrete integration branch ref (from PROVISION_ARGS)
  assert.ok(p.includes('integration/wtprov-a/phase-3'),
    'merge-task (Refine) rebase instruction must reference the concrete integrationBranch ref')
})

// ---------------------------------------------------------------------------
// Task 5 (#71): throw on undefined branch/worktree derivation
// A task with neither explicit branch/worktree nor the derivation args
// (planSlug/runId/worktreeRoot) must cause the template to THROW with a clear
// message naming the task, instead of silently interpolating "undefined".
// ---------------------------------------------------------------------------

test('#71 — task missing branch/worktree AND derivation args throws with a clear message', async () => {
  // Build args where planSlug/runId/worktreeRoot are ALL absent and the task has neither
  // explicit branch nor explicit worktree. The template must throw before any agent runs.
  const badArgs = {
    phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    // No planSlug, no runId, no worktreeRoot — derivation is impossible
    tasks: [
      { id: 'tX', issue: 99, title: 'Missing derivation args', planSlice: 'slice X', lenses: ['correctness'] },
      // No explicit branch, no explicit worktree
    ],
    learningsTarget: null,
  }
  const fn = build()
  const agentNeverCalled = async () => { throw new Error('agent must not be called when derivation fails') }
  await assert.rejects(
    () => fn(agentNeverCalled, fakeParallel, async () => [], () => {}, () => {}, badArgs, { total: null }),
    (err) => {
      // Must be an Error (not just a rejection)
      assert.ok(err instanceof Error, 'thrown value is an Error')
      // Must name the task id in the message
      assert.ok(err.message.includes('tX'), `error message must name the task id "tX"; got: "${err.message}"`)
      // Must mention branch/worktree derivation
      assert.match(err.message, /branch|worktree/i,
        `error message must mention branch or worktree; got: "${err.message}"`)
      // Must mention how to fix (supply planSlug/runId/worktreeRoot or explicit branch/worktree)
      assert.match(err.message, /planSlug|explicit branch|explicit worktree|supply/i,
        `error message must hint at the fix; got: "${err.message}"`)
      return true
    },
    'template must throw when a task has neither explicit branch/worktree nor derivation args'
  )
})

test('#71 — task with explicit branch AND worktree does NOT throw (carry-forward)', async () => {
  // A task that already has explicit branch + worktree must work fine even without derivation args.
  const explicitArgs = {
    phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    // No planSlug, no runId, no worktreeRoot — but the task has explicit paths
    tasks: [
      { id: 'tY', issue: 100, title: 'Explicit paths', planSlice: 'slice Y', lenses: ['correctness'],
        branch: 'war/x/p1-tY', worktree: '/abs/repo/.claude/worktrees/run-abc/tY' },
    ],
    learningsTarget: null,
  }
  // Must not throw — explicit branch/worktree satisfies the assertion.
  await assert.doesNotReject(
    () => runPhase(explicitArgs, defaultImpl),
    'template must NOT throw when the task has explicit branch and worktree'
  )
})

test('#71 — task with only planSlug+runId+worktreeRoot (no explicit) does NOT throw (derivation succeeds)', async () => {
  // PROVISION_ARGS already supplies planSlug/runId/worktreeRoot; tasks have no explicit branch/worktree.
  // The derivation fills them in → no throw.
  await assert.doesNotReject(
    () => runPhase(PROVISION_ARGS(), defaultImpl),
    'template must NOT throw when derivation args are present (planSlug+runId+worktreeRoot)'
  )
})

// ---------------------------------------------------------------------------
// Task 5 (Phase 3 — F05): servitor memory-admission checklist
// The Wrap-up prompt and war-servitor.md must instruct four disciplines:
//   D1 — DEDUP BEFORE WRITE: Glob memory dir + read MEMORY.md + read candidates → update existing covering file
//   D2 — CORRECTION PRIORITY: contradicting fact supersedes stale file; user corrections outrank agent assertions
//   D3 — VERIFY-CUE: a fact naming a file/flag/line is phrased with "verify still present before acting"
//   D4 — INDEX HYGIENE: update MEMORY.md row in place; [[slug]] cross-links
// ---------------------------------------------------------------------------

const servitorMd = readFileSync(join(here, '../../../agents/war-servitor.md'), 'utf8')

test('F05 — Wrap-up prompt: instructs DEDUP BEFORE WRITE (Glob memory dir + read candidates)', async () => {
  // The Wrap-up servitor prompt must tell the servitor to scan/glob the memory dir and read
  // existing candidates BEFORE writing, to avoid duplicate entries.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Must instruct Glob/scan of the memory dir (D1)
  assert.match(p, /glob|scan/i,
    'Wrap-up prompt must instruct Glob/scan of the memory dir (D1 dedup before write)')
  // Must mention updating an existing covering file (not just creating new)
  assert.match(p, /update.*exist|exist.*covering|covering.*file/i,
    'Wrap-up prompt must instruct updating an existing covering file rather than duplicating (D1)')
})

test('F05 — Wrap-up prompt: instructs CORRECTION PRIORITY (contradicting fact supersedes stale; user outranks)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Must state that a contradicting fact supersedes the stale file (D2)
  assert.match(p, /supersede|contradict|overrides?|replac/i,
    'Wrap-up prompt must instruct that a contradicting fact supersedes the stale entry (D2 correction priority)')
  // Must state that user corrections outrank agent assertions (D2)
  assert.match(p, /user.{0,40}outrank|user.{0,40}correction|correction.{0,40}outrank/i,
    'Wrap-up prompt must state that user corrections outrank agent assertions (D2)')
})

test('F05 — Wrap-up prompt: instructs VERIFY-CUE (file/flag/line facts must be stamped with verify cue)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Must instruct that facts naming a file/flag/line include a "verify still present before acting" cue (D3)
  assert.match(p, /verify.{0,40}still.{0,40}present|verify.{0,40}before.{0,40}act/i,
    'Wrap-up prompt must instruct "verify still present before acting" cue for file/flag/line facts (D3)')
})

test('F05 — Wrap-up prompt: instructs INDEX HYGIENE (update MEMORY.md row in place; [[slug]] cross-links)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Must instruct updating MEMORY.md row in place (D4) — not appending duplicates
  assert.match(p, /MEMORY\.md.{0,60}in[- ]place|in[- ]place.{0,60}MEMORY\.md|update.{0,60}MEMORY\.md/i,
    'Wrap-up prompt must instruct updating the MEMORY.md row in place (D4 index hygiene)')
  // Must mention [[slug]] cross-links (D4)
  assert.ok(p.includes('[[') || /slug.*cross.?link|cross.?link.*slug/i.test(p),
    'Wrap-up prompt must mention [[slug]] cross-links (D4)')
})

test('F05 — war-servitor.md: has a "Memory admission" checklist section (inlined, no separate file)', () => {
  // The checklist must be in war-servitor.md itself (not in a separate servitor-memory.md).
  assert.match(servitorMd, /memory admission/i,
    'war-servitor.md must contain a "Memory admission" section/heading')
})

test('F05 — war-servitor.md: admission checklist includes DEDUP BEFORE WRITE (D1)', () => {
  assert.match(servitorMd, /glob|scan/i,
    'war-servitor.md admission checklist must instruct Glob/scan of memory dir (D1)')
  assert.match(servitorMd, /update.*exist|exist.*covering|covering.*file/i,
    'war-servitor.md must instruct updating an existing covering file (D1)')
})

test('F05 — war-servitor.md: admission checklist includes CORRECTION PRIORITY (D2)', () => {
  assert.match(servitorMd, /supersede|contradict|overrides?|replac/i,
    'war-servitor.md must instruct that a contradicting fact supersedes the stale entry (D2)')
  assert.match(servitorMd, /user.{0,40}outrank|user.{0,40}correction|correction.{0,40}outrank/i,
    'war-servitor.md must state that user corrections outrank agent assertions (D2)')
})

test('F05 — war-servitor.md: admission checklist includes VERIFY-CUE (D3)', () => {
  assert.match(servitorMd, /verify.{0,40}still.{0,40}present|verify.{0,40}before.{0,40}act/i,
    'war-servitor.md must include "verify still present before acting" cue for file/flag/line facts (D3)')
})

test('F05 — war-servitor.md: admission checklist includes INDEX HYGIENE (D4)', () => {
  assert.match(servitorMd, /MEMORY\.md.{0,60}in[- ]place|in[- ]place.{0,60}MEMORY\.md|update.{0,60}MEMORY\.md/i,
    'war-servitor.md must instruct updating the MEMORY.md row in place (D4)')
  assert.ok(servitorMd.includes('[[') || /slug.*cross.?link|cross.?link.*slug/i.test(servitorMd),
    'war-servitor.md must mention [[slug]] cross-links (D4)')
})

// ---------------------------------------------------------------------------
// Task 1 (Phase 1 — F03): Auditor computes its own integration-branch diff
// The auditPrompt must direct the auditor to run git diff A...B (three-dot)
// and must NOT name the "main repo checkout" / "baseline copies" as the diff source.
// war-auditor.md must list Bash in its frontmatter tools.
// ---------------------------------------------------------------------------

test('F03 — auditPrompt: contains three-dot git diff instruction (git diff integrationBranch...task.branch)', async () => {
  // The emitted audit prompt must instruct the auditor to run
  // git diff <integrationBranch>...<task.branch> (three-dot = merge-base..head).
  // Filter to regular audit calls only (not gate-audit execution-evidence seats).
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length > 0, 'at least one regular auditor call was made')
  for (const c of auditCalls) {
    // Must contain the three-dot pattern with the actual branch values from PROVISION_ARGS
    const p = c.prompt
    assert.ok(
      /git\s+diff\b[^`\n]*\.\.\.[^`\n]*/.test(p),
      `audit prompt must contain "git diff ...A...B..." (three-dot); got: "${p.slice(0, 300)}"`
    )
    // The integrationBranch and task.branch must appear in the diff instruction
    assert.ok(
      p.includes('integration/wtprov-a/phase-3'),
      `audit prompt must reference the integrationBranch in the diff command; got: "${p.slice(0, 300)}"`
    )
    assert.ok(
      /war\/wtprov-a\/p3-t[12]/.test(p),
      `audit prompt must reference the task.branch in the diff command; got: "${p.slice(0, 300)}"`
    )
  }
})

test('F03 — auditPrompt: does NOT contain "main repo checkout" prose (baseline is computed, not provided)', async () => {
  // The emitted audit prompt must no longer name the "main repo checkout" or "baseline copies"
  // as the diff source. The auditor computes the diff itself via git.
  // Filter to regular audit calls only (not gate-audit execution-evidence seats).
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length > 0, 'at least one regular auditor call was made')
  for (const c of auditCalls) {
    const p = c.prompt
    assert.ok(
      !/main repo checkout/.test(p),
      `audit prompt must NOT contain "main repo checkout"; got: "${p.slice(0, 300)}"`
    )
    assert.ok(
      !/baseline copies/.test(p),
      `audit prompt must NOT contain "baseline copies"; got: "${p.slice(0, 300)}"`
    )
    assert.ok(
      !/compare.*against.*baseline|baseline.*compare/i.test(p),
      `audit prompt must NOT instruct comparing against baseline copies; got: "${p.slice(0, 300)}"`
    )
  }
})

test('F03 — auditPrompt: steers auditor to allowlist-safe git forms (mentions avoid for %-format and @{} reflog)', async () => {
  // The prompt must steer the auditor away from disallowed git forms.
  // It must warn about %-format strings and @{} reflog (Task-2 guard denies those chars).
  // The prompt may mention them as things to avoid (negative examples), but must not
  // positively recommend them without an avoidance qualifier.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // Filter to regular audit calls only (not gate-audit execution-evidence seats)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length > 0, 'at least one regular auditor call was made')
  for (const c of auditCalls) {
    const p = c.prompt
    // The prompt must mention avoidance of % or @{} (either as "Avoid" or "denied")
    assert.ok(
      /avoid|denied|not.*use|do not use/i.test(p),
      `audit prompt must warn the auditor about disallowed git forms (avoid/denied); got: "${p.slice(0, 400)}"`
    )
    // Must NOT positively recommend @{} reflog (without avoidance context)
    // Check: @{ only appears in context of avoidance (the word "avoid" or "denied" nearby)
    const atBraceIdx = p.indexOf('@{')
    if (atBraceIdx !== -1) {
      const ctx = p.slice(Math.max(0, atBraceIdx - 80), atBraceIdx + 20)
      assert.ok(
        /avoid|denied|not.*use/i.test(ctx),
        `@{} in audit prompt must only appear in avoidance context; got context: "${ctx}"`
      )
    }
  }
})

test('F03 — auditPrompt: instructs re-running diff each round (fix-worker may have pushed)', async () => {
  // The prompt must tell the auditor to re-run the diff each round (since a fix-worker may push).
  // Filter to regular audit calls only (not gate-audit execution-evidence seats).
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length > 0, 'at least one regular auditor call was made')
  const p = auditCalls[0].prompt
  assert.ok(
    /re.?run|each round|fix.?worker.{0,60}push|push.{0,60}fix.?worker/i.test(p),
    `audit prompt must instruct re-running the diff each round (fix-worker may have pushed); got: "${p.slice(0, 400)}"`
  )
})

test('F03 — war-auditor.md: frontmatter tools list includes Bash', () => {
  // The auditor gains a Bash capability (limited to read-only git by the Task-2 guard).
  // Its frontmatter must list Bash alongside Read, Grep, Glob.
  assert.match(auditorMd, /^tools:.*\bBash\b/m,
    'war-auditor.md frontmatter must include Bash in the tools list')
})

test('F03 — war-auditor.md: inputs describe computing the diff (not "path provided")', () => {
  // The old wording said "path provided". The new wording must say the auditor computes it.
  assert.ok(
    !/path provided/i.test(auditorMd),
    'war-auditor.md must NOT say "path provided" for the diff input'
  )
  assert.match(auditorMd, /compute|run.*git diff|git diff.*run/i,
    'war-auditor.md must instruct the auditor to compute the diff via git')
})

test('F03 — war-auditor.md: states only read-only git is allowed (a guard denies anything else)', () => {
  // Must mention that a guard denies non-read-only git operations.
  assert.match(auditorMd, /guard|read.?only/i,
    'war-auditor.md must mention the read-only guard')
})

test('F03 — schemas.md: AuditVerdict.tests_verified clarifies existence/integrity not execution (F03 + F04 combined)', () => {
  // Already covered by the F04 Task-4 test above; this test adds F03's requirement:
  // schemas.md must NOT reference any DiffResult artifact (the auditor self-serves; no artifact).
  const schemasMd = readFileSync(join(here, '../references/schemas.md'), 'utf8')
  assert.ok(
    !/DiffResult/.test(schemasMd),
    'schemas.md must NOT contain "DiffResult" (the auditor self-serves the diff; no artifact schema needed)'
  )
})

// ---------------------------------------------------------------------------
// Task 1 (Phase 1 — #113): expected:0 on env-blocked and worker-blocked early-returns
// Both early-return paths in the work-wave parallel map must carry expected:0 so the
// auditLog entry (which unconditionally reads r.expected) records 0 instead of undefined.
// ---------------------------------------------------------------------------

test('#113 — env-blocked early-return: auditLog entry has requested===0 (not undefined)', async () => {
  // Drive a task where the per-task provision step fails (env-blocked). The early-return object
  // must carry expected:0 so auditLog.push({ requested: r.expected }) records 0, not undefined.
  const dagWithProvision = {
    ...PROVISION_ARGS({ tasks: [
      { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
    ] }),
    run: { provision: ['npm install'], provisionSource: 'ci' },
  }
  const impl = (prompt, opts) => {
    if (isProvisionRun({ opts })) {
      return { ok: false, taskId: 't1', failedCommand: 'npm install', exitCode: 1,
               stderrTail: 'ERR', provisionSource: 'ci' }
    }
    return defaultImpl(prompt, opts)
  }
  const { out } = await runPhase(dagWithProvision, impl)
  const entry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(entry, 'an auditLog entry exists for t1 (env-blocked)')
  assert.strictEqual(entry.requested, 0, 'auditLog.requested is 0 (not undefined) for env-blocked early-return (#113)')
})

test('#113 — worker-blocked early-return: auditLog entry has requested===0 (not undefined)', async () => {
  // Drive a task where the worker returns status:'blocked'. The early-return object must carry
  // expected:0 so auditLog.push({ requested: r.expected }) records 0, not undefined.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision' && /^provision-run:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') {
      return { task_id: 't1', status: 'blocked', blocked_reason: 'forced block for test' }
    }
    return defaultImpl(prompt, opts)
  }
  const { out } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', lenses: ['correctness'] },
  ] }), impl)
  const entry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(entry, 'an auditLog entry exists for t1 (worker-blocked)')
  assert.strictEqual(entry.requested, 0, 'auditLog.requested is 0 (not undefined) for worker-blocked early-return (#113)')
})
