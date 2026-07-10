import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { HARD_ESCALATION_REASONS, KNOWN_LAND_DECISIONS } from './land-decision.mjs'
import { spawnOpts, validateRoster, widenRoster, resolveWidenSource, ROLES } from './war-config.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const auditorMd = readFileSync(join(here, '../../../agents/war-auditor.md'), 'utf8')
const refinerMd = readFileSync(join(here, '../../../agents/war-refiner.md'), 'utf8')
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
  // Provision dispatches now return the ENV_OUTCOME shape: the git-topology barrier (provision:phase-<id>)
  // AND the per-task provision-run (provision-run:<id>) are both phase 'Provision', and the phase-close
  // polish-worktree:<id> dispatch is phase 'Refine'. Default all three to { ok: true } so happy-path
  // tests reach the worker / run the sweep. (Tested BEFORE the generic refiner branch below.)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-refiner' && /^polish-worktree:/.test(opts.label || '')) return { ok: true }
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
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
  ],
  learningsTarget: '/abs/learnings',
  memoryLocalRoot: '/abs/memory-local',
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
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'), 'ensure-worktree for task t1 path')
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/p3-t2'), 'ensure-worktree for task t2 path')
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
  assert.ok(w.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'), 'worker prompt carries the absolute worktree path')
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
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const fix = calls.find(isFixWorker)
  assert.ok(fix, 'a fix-worker was dispatched on the blocking finding')
  const f = fix.prompt
  assert.ok(!/git worktree add/.test(f), 'fix-worker prompt does NOT contain "git worktree add"')
  assert.ok(!/export WAR_WORKTREE/.test(f), 'fix-worker prompt does NOT contain "export WAR_WORKTREE"')
  assert.ok(f.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'), 'fix-worker prompt carries the absolute worktree path')
  assert.match(f, /already[- ]provisioned/i, 'fix-worker is told the worktree is already provisioned')
})

test('the auditor prompt still receives the absolute task.worktree path (assertion 3)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor).prompt
  assert.ok(a.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'), 'auditor prompt carries the absolute worktree path')
})

test('the servitor (Wrap-up) prompt no longer names WAR_WORKTREE and carries the absolute local memory root (clean-surface)', async () => {
  // The retired env var must not appear in the servitor prompt: the worktree-scope hook confines the
  // servitor by agent_type, not by an env-var the prompt sets (ADR 0002). The happy-path harness lands
  // + wraps up, so a servitor seat is dispatched and its prompt is inspectable. It must hand the
  // servitor its absolute LOCAL memory root (memoryLocalRoot — the sole writable path), not the
  // learningsTarget (that is the read-path repo root, no longer a servitor write path).
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  assert.ok(!/WAR_WORKTREE/.test(wrap.prompt), 'servitor prompt does NOT contain WAR_WORKTREE')
  assert.ok(wrap.prompt.includes('/abs/memory-local'), 'servitor prompt carries the absolute local memory root')
})

// ---------------------------------------------------------------------------
// Task 1 (servitor-learnings-write-path): memoryLocalRoot threading + Wrap-up rewrite (End-state 1–2)
// ---------------------------------------------------------------------------

test('T1 — Wrap-up prompt: writable-path clause names memoryLocalRoot and does NOT name docs/learnings (scoped anchor)', async () => {
  // The servitor's ONLY writable path is the absolute local memory root. The writable-path CLAUSE must
  // name it and must NOT name docs/learnings — even though the prompt DELIBERATELY carries a "never write
  // into any docs/learnings/" prohibition elsewhere, so a whole-prompt absence grep would be wrong.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  // Extract the writable-path clause (the line naming the sole writable path), never the whole prompt.
  const clause = wrap.prompt.split('\n').find(l => /writable path/i.test(l))
  assert.ok(clause, 'the Wrap-up prompt carries a writable-path clause')
  assert.ok(clause.includes('/abs/memory-local'), 'the writable-path clause names the absolute local memory root')
  assert.doesNotMatch(clause, /docs\/learnings/, 'the writable-path clause does NOT name docs/learnings (scoped anchor)')
  // The prohibition (a separate line) IS present — proving the scoped anchor is necessary.
  assert.match(wrap.prompt, /never write into any docs\/learnings/i,
    'the prompt still carries the "never write into any docs/learnings/" prohibition (separate clause)')
})

test('T1 — Wrap-up prompt: carries the D1/D2 mutation-guard, recurrence-flow, and absolute files_written tokens', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Mutation guard (D1): a covering file without nested metadata.provenance is user-authored, never edited.
  assert.match(p, /metadata\.provenance/, 'prompt names metadata.provenance (mutation-guard discriminator)')
  assert.match(p, /user-authored/i, 'prompt marks an untagged covering file as user-authored')
  assert.match(p, /never edit/i, 'prompt directs never to edit the user-authored file')
  // Recurrence-on-a-repo-lesson flow: same slug + overwrite-on-promote.
  assert.match(p, /same slug/i, 'prompt states the recurrence copy uses the same slug')
  assert.match(p, /overwrite/i, 'prompt states the Gate-2 promotion overwrites the same-slug repo file (overwrite-on-promote)')
  // Absolute files_written demand.
  assert.match(p, /files_written[^.]{0,80}absolute/i, 'prompt demands absolute paths in files_written')
})

test('T1 — Wrap-up gate: memoryLocalRoot absent + landed → NO servitor dispatch + a logged skip line (delete-the-feature)', async () => {
  // The gate is `landed && memoryLocalRoot`. With memoryLocalRoot null (memory disabled / legacy args)
  // and a landed phase (learningsTarget still present), NO servitor seat fires and the skip is logged.
  // Fails if the gate reverts to `landed && learningsTarget` (a servitor would then be dispatched).
  const { calls, logs } = await runPhase(PROVISION_ARGS({ memoryLocalRoot: null }), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(!wrap, 'NO servitor seat is dispatched when memoryLocalRoot is absent')
  const skip = logs.find(l => typeof l === 'string' && /Wrap-up skipped/i.test(l) && /memoryLocalRoot/i.test(l))
  assert.ok(skip, 'a skip line naming the missing memoryLocalRoot is logged (never silent)')
})

// T1 — both-surfaces drift guard (servitor mutation-guard / recurrence-flow / absolute-path contracts)
// was MIGRATED into the D3 both-surfaces directive registry at the end of this file (the servitor row,
// plus the servitor-migration negative-absence checks). Kept as one generalized registry, not a
// per-directive test — see 'D3 — both-surfaces directive registry'.

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
  assert.ok(pr.prompt.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'), 'provision-run runs inside the task worktree')
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
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
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
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/p3-t1'),
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
  // Decision 2: step 3 runs land-advance inside _refinery (cwd-pin), matching steps 1-2.
  // Only the `_refinery` alternate is real: `${refineryLandPath}` is interpolated into the rendered prompt
  // (its value ends in `/_refinery`), so the literal `${refineryLandPath}` never appears in `p` (interpolated-literal trap, class #311).
  assert.match(p, /cd .*_refinery.* && provision-worktrees\.sh land-advance/,
    'land prompt step 3 pins land-advance to the _refinery worktree (cd ${refineryLandPath} && …)')
  // No BARE backtick-led `provision-worktrees.sh land-advance` remains. Key on the RENDERED text: pre-pin the
  // step-3 line reads ``run `provision-worktrees.sh land-advance <branch> …``` (backtick immediately before the
  // command); the pin turns it into ``run `cd <…>/_refinery && provision-worktrees.sh land-advance …``` (backtick now
  // precedes `cd`, the command is preceded by `&& `). Do NOT key on `${ph.workingBranch}` — it is already interpolated
  // in `p`, so a regex containing that literal never matches and the assertion is vacuous.
  assert.ok(!/`provision-worktrees\.sh land-advance /.test(p),
    'no bare backtick-led provision-worktrees.sh land-advance remains (step 3 must be cwd-pinned: cd ${refineryLandPath} && …)')
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

// 'Task 5 — HARD_ESCALATION_REASONS inline includes land_stale' was ABSORBED into the D2 mirror
// registry (end of file): the HARD_ESCALATION_REASONS row deepEquals the full inline array against the
// land-decision.mjs export, which subsumes any single-member 'includes land_stale' check.

test('Task 5 — land_stale holds the land (hard escalation)', async () => {
  // A phase where a task lands but another has reason:'land_stale' → held:escalation.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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

// Single-task args for audit tests (no deps, three-seat roster pins the panel size).
const AUDIT_ARGS = (over = {}) => ({
  ...PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness' }, { lens: 'cascading-impact' }, { lens: 'plan-faithfulness' }] },
  ] }),
  ...over,
})

// A 3-seat roster so all 3 lenses convene; autoEscalate off (a multi-seat roster never widens anyway).
const COVEN_ARGS = (over = {}) => AUDIT_ARGS({
  ...over,
  tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness' }, { lens: 'cascading-impact' }, { lens: 'plan-faithfulness' }] },
  ],
  audit: { autoEscalate: false },
})

test('Task 2 — transient drop recovers: 3-seat roster, one seat returns null first call then approves on retry → full panel', async () => {
  // The per-label call-sequence harness drives 'audit:t1:cascading-impact' to return null on call 1,
  // then return an approve verdict on call 2 (retry). The round should still see 3 approved seats.
  const approveVerdictFor = (label) => ({ seat: label, lens: 'cascading-impact', verdict: 'approve', findings: [], confidence: 'high' })
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, approveVerdictFor('audit:t1:cascading-impact')] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
  // A 3-seat roster where one seat never returns → shortfall logged as { requested:3, returned:2 }.
  const impl = buildSeqImpl(
    { 'audit:t1:cascading-impact': [null, null, null] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    { id: 't1', issue: 201, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 202, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['t1'] },
    { id: 't3', issue: 203, title: 'Task three', planSlice: 'slice 3', roster: [{ lens: 'correctness' }] },
  ],
  learningsTarget: null,
  ...over,
})

// Base impl for DAG tests: provision always ok, t1 defaults to escalate (worker returns blocked),
// t2/t3 default to implemented+approve+merged. The caller can override specific pieces.
const dagBaseImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true } // topology barrier: env-outcome
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
  // STRUCTURAL assertion: key on the actual threaded values (unit=5, integration=2), not on words
  // that appear in the base boilerplate regardless of whether the summary was injected
  // (memory: weak-test-assertion-passes-without-feature-being-exercised).
  // JSON.stringify({unit:5,integration:2}) → {"unit":5,"integration":2}
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditCalls = calls.filter(isAuditor)
  assert.ok(auditCalls.length > 0, 'at least one auditor call was made')
  const auditPromptText = auditCalls[0].prompt
  // Both values must be present in the serialized summary that was threaded into the prompt.
  assert.match(auditPromptText, /"?unit"?\s*[:=]\s*5/,
    'audit prompt must carry the threaded unit:5 value from the worker tests summary')
  assert.match(auditPromptText, /"?integration"?\s*[:=]\s*2/,
    'audit prompt must carry the threaded integration:2 value from the worker tests summary')
})

test('Task 4 — post-merge gate-audit pass: a war-auditor with lens execution-evidence is spawned after the merge queue', async () => {
  // The post-merge gate-audit pass spawns read-only war-auditor seats with lens 'execution-evidence'
  // for each merged task, AFTER the refine loop completes and BEFORE the Land decision.
  // We use PROVISION_ARGS (t2 deps t1) with both merging, so two merged tasks → two gate-audit seats.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
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

test('#71 — task missing branch/worktree AND derivation args RETURNS held:workflow-error envelope (not a rejection)', async () => {
  // After the top-level try/catch the derivation throw is caught and returned as the
  // held:workflow-error envelope — the call no longer propagates the rejection.
  // (Was: assert.rejects — rewritten per plan step 1 Test 3 / fail-closed-gate pattern.)
  const badArgs = {
    phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    // No planSlug, no runId, no worktreeRoot — derivation is impossible
    tasks: [
      { id: 'tX', issue: 99, title: 'Missing derivation args', planSlice: 'slice X', roster: [{ lens: 'correctness' }] },
      // No explicit branch, no explicit worktree
    ],
    learningsTarget: null,
  }
  const fn = build()
  const agentNeverCalled = async () => { throw new Error('agent must not be called when derivation fails') }
  const out = await fn(agentNeverCalled, fakeParallel, async () => [], () => {}, () => {}, badArgs, { total: null })
  // Must RETURN the held:workflow-error envelope — not throw / reject
  assert.equal(out.landDecision, 'held:workflow-error',
    `landDecision must be 'held:workflow-error'; got: ${JSON.stringify(out.landDecision)}`)
  assert.ok(out.workflowError && typeof out.workflowError === 'object', 'workflowError must be an object')
  assert.ok(out.workflowError.message && out.workflowError.message.length > 0,
    `workflowError.message must be non-empty; got: ${JSON.stringify(out.workflowError && out.workflowError.message)}`)
  // Entry validation (H) now fires FIRST (top of try{}), superseding the per-task derivation throw for
  // the all-missing case: the message names the absent trio keys, not the task id. (Was: includes('tX').)
  assert.ok(/requires top-level \{ planSlug, runId, worktreeRoot \}/.test(out.workflowError.message),
    `workflowError.message must name the missing trio; got: "${out.workflowError.message}"`)
  for (const k of ['planSlug', 'runId', 'worktreeRoot'])
    assert.ok(out.workflowError.message.includes(k), `message names the absent key ${k}`)
})

test('#71 — task with explicit branch AND worktree does NOT throw (carry-forward)', async () => {
  // A task that already has explicit branch + worktree must work fine even without derivation args.
  const explicitArgs = {
    phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'docs/plans/x.md', gate: 'true' },
    // No planSlug, no runId, no worktreeRoot — but the task has explicit paths
    tasks: [
      { id: 'tY', issue: 100, title: 'Explicit paths', planSlice: 'slice Y', roster: [{ lens: 'correctness' }],
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
//   D2 — TIER PRECEDENCE: a higher tier supersedes a lower; a user-confirmed fact outranks any agent write
//   D3 — VERIFY-ON-WRITE: verify the referent is still present before acting (facts naming a file/flag/line)
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

test('F05 — Wrap-up prompt: instructs TIER PRECEDENCE (contradicting fact supersedes stale; user outranks)', async () => {
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

test('F05 — Wrap-up prompt: instructs VERIFY-ON-WRITE (file/flag/line facts must be stamped with verify cue)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  // Must instruct that facts naming a file/flag/line include a "verify still present before acting" cue (D3)
  assert.match(p, /verify.{0,40}still.{0,40}present|verify.{0,40}before.{0,40}act/i,
    'Wrap-up prompt must instruct "verify still present before acting" cue for file/flag/line facts (D3)')
})

test('F05/criterion 11 — Wrap-up prompt: D4 INDEX HYGIENE is DELETED (no "update the MEMORY.md row" directive)', async () => {
  // Inverted (memory-sqlite-substrate T4): index maintenance is no longer the servitor's job — the
  // Lead runs `render-index` post-servitor (Gate 2). The D4 row-in-place directive must be GONE.
  // MEMORY.md may still be named for read-only dedup, and [[slug]] cross-links survive under D1 — the
  // thing that must be absent is the "update/maintain the MEMORY.md ROW" index-hygiene instruction.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wrap = calls.find(isServitor)
  assert.ok(wrap, 'a servitor (Wrap-up) seat was dispatched on the happy path')
  const p = wrap.prompt
  assert.doesNotMatch(p, /D4/,
    'Wrap-up prompt must not carry a D4 discipline (index hygiene deleted)')
  assert.doesNotMatch(p, /MEMORY\.md row|row in[- ]place|update the MEMORY\.md/i,
    'Wrap-up prompt must not instruct updating the MEMORY.md row in place (D4 index hygiene deleted)')
  assert.doesNotMatch(p, /four disciplines/i,
    'Wrap-up prompt must say three disciplines, not four (D4 gone)')
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

test('F05 — war-servitor.md: admission checklist includes TIER PRECEDENCE (D2)', () => {
  assert.match(servitorMd, /supersede|contradict|overrides?|replac/i,
    'war-servitor.md must instruct that a contradicting fact supersedes the stale entry (D2)')
  assert.match(servitorMd, /user.{0,40}outrank|user.{0,40}correction|correction.{0,40}outrank/i,
    'war-servitor.md must state that user corrections outrank agent assertions (D2)')
})

test('F05 — war-servitor.md: admission checklist includes VERIFY-ON-WRITE (D3)', () => {
  assert.match(servitorMd, /verify.{0,40}still.{0,40}present|verify.{0,40}before.{0,40}act/i,
    'war-servitor.md must include "verify still present before acting" cue for file/flag/line facts (D3)')
})

test('F05/criterion 11 — war-servitor.md: D4 INDEX HYGIENE is DELETED (index is a generated projection)', () => {
  // Inverted (memory-sqlite-substrate T4): the servitor no longer maintains MEMORY.md — it is a
  // generated projection the Lead re-renders (spec §4.6). The D4 discipline and the row-in-place
  // directive must be GONE from both surfaces. [[slug]] cross-links survive (folded into D1), so the
  // absence assertion targets the "MEMORY.md ROW" index-hygiene directive specifically.
  assert.doesNotMatch(servitorMd, /^\s*\*\*D4/m,
    'war-servitor.md must not carry a D4 discipline heading (index hygiene deleted)')
  assert.doesNotMatch(servitorMd, /MEMORY\.md row|row in[- ]place|update the MEMORY\.md row/i,
    'war-servitor.md must not instruct updating the MEMORY.md row in place (D4 deleted)')
  assert.doesNotMatch(servitorMd, /four disciplines/i,
    'war-servitor.md must say three disciplines, not four (D4 gone)')
  // The append-pointer instruction in the Inputs section must also be gone (Task 4).
  assert.doesNotMatch(servitorMd, /append a one-line pointer to `?MEMORY\.md/i,
    'war-servitor.md Inputs section must not tell the servitor to append a pointer to MEMORY.md')
})

test('F05/keywords placement — war-servitor.md frontmatter example nests keywords under metadata (T1 CLI reads metadata.keywords only)', () => {
  // Cross-task contract (spec §4.2): the CLI's frontmatter parser (skills/_shared/war-memory.mjs
  // lessonRecord) reads keywords ONLY from frontmatter.metadata.keywords and feeds it into the FTS5
  // keywords column at BM25 weight 8.0. A top-level `keywords:` lands in frontmatter.keywords, is
  // never read, and the highest-weighted retrieval signal is silently dropped. The frontmatter
  // EXAMPLE the servitor copies must therefore nest keywords under metadata:, not at the top level.
  assert.doesNotMatch(servitorMd, /^keywords:/m,
    'war-servitor.md frontmatter example must NOT place keywords: at the top level (unindexed by the CLI)')
  assert.match(servitorMd, /^  keywords:/m,
    'war-servitor.md frontmatter example must nest keywords: under metadata: at 2-space indent (metadata.keywords)')
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
      { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
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
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') {
      return { task_id: 't1', status: 'blocked', blocked_reason: 'forced block for test' }
    }
    return defaultImpl(prompt, opts)
  }
  const { out } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const entry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(entry, 'an auditLog entry exists for t1 (worker-blocked)')
  assert.strictEqual(entry.requested, 0, 'auditLog.requested is 0 (not undefined) for worker-blocked early-return (#113)')
})

// ---------------------------------------------------------------------------
// Task 3b (#115) — post-loop unrunnable-deps sweep
// ---------------------------------------------------------------------------

test('#115 — post-loop sweep: task with ghost dep is escalated as unrunnable-deps and land held', async () => {
  // t1 runs and merges; t2 has deps:['ghost'] where 'ghost' is not in tasks[].
  // Post-loop sweep must catch t2 and push unrunnable-deps escalation → landDecision held:escalation.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc1234', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], deps: ['ghost'] },
  ] }), impl)

  // escalated must contain the unrunnable-deps entry for t2
  const esc = (out.escalated || []).find(e => e.task === 't2' && e.reason === 'unrunnable-deps')
  assert.ok(esc, 'escalated must contain {task:"t2", reason:"unrunnable-deps"}')
  assert.deepEqual(esc.missingDeps, ['ghost'], 'missingDeps must list the ghost dep')

  // auditLog must have t2 entry with verdict unrunnable-deps and requested===0
  const entry = (out.auditLog || []).find(e => e && e.task === 't2' && e.verdict === 'unrunnable-deps')
  assert.ok(entry, 'auditLog must have t2 entry with verdict:unrunnable-deps')
  assert.strictEqual(entry.requested, 0, 'auditLog.requested is 0 for unrunnable-deps')

  // land is held due to hard escalation
  assert.strictEqual(out.landDecision, 'held:escalation', 'landDecision must be held:escalation when unrunnable-deps present')
})

test('#115 — post-loop sweep back-compat: valid-deps phase produces no spurious unrunnable-deps', async () => {
  // Normal two-task phase where t2 depends on t1 (which exists). No ghost deps → no unrunnable-deps entries.
  const { out } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const spurious = (out.escalated || []).filter(e => e.reason === 'unrunnable-deps')
  assert.deepEqual(spurious, [], 'no unrunnable-deps escalations in a valid-deps phase')
  const spuriousLog = (out.auditLog || []).filter(e => e && e.verdict === 'unrunnable-deps')
  assert.deepEqual(spuriousLog, [], 'no unrunnable-deps auditLog entries in a valid-deps phase')
})

// ---------------------------------------------------------------------------
// Task 2 (#193): gate-audit seat pinned to _refinery integration tip + stale-tip SOFT-downgrade
// PROVISION_ARGS supplies worktreeRoot:'/abs/repo/.claude/worktrees' + runId:'run-2026'
// so the reconstructed _refinery path is '/abs/repo/.claude/worktrees/run-2026/_refinery'.
// ---------------------------------------------------------------------------

const gateAuditImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
  if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label?.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'sha-abc123unique' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

const gateAuditCalls = (calls) => calls.filter(c =>
  seatOf(c.opts) === 'war-auditor' &&
  (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
)

test('#193 T2-1 — pinned _refinery path interpolated into gate-audit prompt', async () => {
  // PROVISION_ARGS supplies worktreeRoot:'/abs/repo/.claude/worktrees' + runId:'run-2026'
  // The reconstructed path '/abs/repo/.claude/worktrees/run-2026/_refinery' must appear
  // in the gate-audit prompt. It is ABSENT at HEAD (loop-scoped refineryPath never reaches this pass).
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const gaPrompts = gateAuditCalls(calls)
  assert.ok(gaPrompts.length > 0, 'gate-audit seats were dispatched')
  const p = gaPrompts[0].prompt
  assert.ok(p.includes('/abs/repo/.claude/worktrees/run-2026/_refinery'),
    'gate-audit prompt must include the reconstructed _refinery path (worktreeRoot/runId/_refinery)')
})

test('#193 T2-2 — HEAD-confirm bare rev-parse pin instruction present in gate-audit prompt', async () => {
  // The prompt must instruct the seat to run the bare, guard-permitted print-and-compare
  //     git -C <refineryPath> rev-parse HEAD
  // then compare the printed sha (NOT the guard-denied bracket form [ "$(git -C ... ]).
  // p is the EMITTED prompt, so ${refineryPath} is already interpolated — assert the same
  // interpolated fixture path #193 T2-1 asserts (/abs/repo/.claude/worktrees/run-2026/_refinery).
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const gaPrompts = gateAuditCalls(calls)
  assert.ok(gaPrompts.length > 0, 'gate-audit seats were dispatched')
  const p = gaPrompts[0].prompt
  assert.ok(p.includes('rev-parse HEAD'),
    'gate-audit prompt must contain the rev-parse HEAD instruction')
  assert.ok(p.includes('git -C /abs/repo/.claude/worktrees/run-2026/_refinery rev-parse HEAD'),
    'gate-audit prompt must contain the bare git -C <refineryPath> rev-parse HEAD command')
  assert.ok(!p.includes('[ "$(git -C'),
    'gate-audit prompt must NOT contain the guard-denied bracket comparison [ "$(git -C ...')
})

test('#193 T2-3 — "you cannot run commands" is removed from gate-audit prompt', async () => {
  // The old wording 'you cannot run commands' must no longer appear in the gate-audit prompt
  // after the rewrite to a pinned read-only auditor.
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const gaPrompts = gateAuditCalls(calls)
  assert.ok(gaPrompts.length > 0, 'gate-audit seats were dispatched')
  const p = gaPrompts[0].prompt
  assert.ok(!p.includes('you cannot run commands'),
    'gate-audit prompt must NOT contain "you cannot run commands" after the T2 rewrite')
})

test('#193 T2-4 — read-at-tip instruction: seat reads mapped test in pinned worktree files', async () => {
  // The prompt must instruct the seat to confirm the mapped acceptance-criteria test is
  // PRESENT IN THE FILES at the confirmed tip (not merely inferred from gate output text).
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const gaPrompts = gateAuditCalls(calls)
  assert.ok(gaPrompts.length > 0, 'gate-audit seats were dispatched')
  const p = gaPrompts[0].prompt
  assert.ok(p.includes('present in the files at that tip'),
    'gate-audit prompt must instruct reading the mapped test in the pinned worktree files at the confirmed tip')
})

test('#193 T2-5 — hardness preserved: Critical gate-evidence finding still holds the land after T2 rewrite', async () => {
  // The prompt rewrite must not change the escalation wiring.
  // A Critical gate-evidence finding must still yield held:escalation.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
                 findings: [{ severity: 'Critical', title: 'mapped test provably unrun',
                              file: 'test/foo.test.js', rationale: 'test absent at confirmed tip' }],
                 confidence: 'high', audit_sha: 'auditsha-pinned' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'sha-abc123unique' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation',
    'Critical gate-evidence finding must still hold the land after T2 prompt rewrite')
  const gateEsc = (out.escalated || []).find(e => e && e.reason === 'gate-evidence')
  assert.ok(gateEsc, 'escalated[] must contain a gate-evidence entry')
})

test('#193 T2-6 — SOFT-default preserved: Minor gate-evidence finding does not hold the land after T2 rewrite', async () => {
  // A Minor gate-audit finding must still yield landDecision==='landed' after the rewrite.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'request_changes',
                 findings: [{ severity: 'Minor', title: 'soft gate note', file: '', rationale: 'soft' }],
                 confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'sha-abc123unique' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'landed',
    'Minor gate-evidence finding (soft) must NOT hold the land after T2 prompt rewrite')
})

// ---------------------------------------------------------------------------
// Task 1 (Phase 1 — #193): gate-HEAD sha (integration_sha) provenance
// Thread integration_sha from MergeResult through the post-merge gate-audit
// capture into the prompt and auditLog so the seat/Lead can confirm the gate
// ran at the integration tip.
// ---------------------------------------------------------------------------

const makeGateAuditImpl = (mergeOver = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
  if (seat === 'war-auditor') return { seat: opts.label, lens: opts.label || 'correctness', verdict: 'approve', findings: [], confidence: 'high', tests_verified: { exist: true } }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', ...mergeOver }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

test('#193 T1-1 — sha threading: gate-HEAD sha (integration_sha) reaches the gate-audit prompt', async () => {
  // Stub integration_sha with a unique valid-hex value (pinOrSentinel passes hex through);
  // assert the gate-audit prompt carries it.
  // This transitively proves the destructure pulled gateHeadSha (DP7 / plan §F9).
  const impl = makeGateAuditImpl({ integration_sha: 'c0ffee1234' })
  const { calls } = await runPhase(PROVISION_ARGS(), impl)
  const gateAuditCalls = calls.filter(c =>
    seatOf(c.opts) === 'war-auditor' &&
    (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
  )
  assert.ok(gateAuditCalls.length > 0, 'at least one gate-audit seat is spawned')
  const prompt = gateAuditCalls[0].prompt
  assert.ok(prompt.includes('c0ffee1234'),
    `gate-audit prompt must include the integration_sha 'c0ffee1234'; got: "${prompt.slice(0, 400)}"`)
})

test('#193 T1-2 — defusing directive: SOFT-on-cannot-confirm directive present in gate-audit prompt', async () => {
  // The prompt must include the unique substring 'corresponds to the current integration tip'
  // (verified absent at HEAD before implementing — this test goes RED first).
  const impl = makeGateAuditImpl({ integration_sha: 'sha-abc123unique' })
  const { calls } = await runPhase(PROVISION_ARGS(), impl)
  const gateAuditCalls = calls.filter(c =>
    seatOf(c.opts) === 'war-auditor' &&
    (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
  )
  assert.ok(gateAuditCalls.length > 0, 'at least one gate-audit seat is spawned')
  const prompt = gateAuditCalls[0].prompt
  assert.ok(prompt.includes('corresponds to the current integration tip'),
    `gate-audit prompt must include the SOFT-on-cannot-confirm directive; got: "${prompt.slice(0, 600)}"`)
})

test('#193 T1-3 — sentinel on absent sha: absent integration_sha interpolates sentinel, never "undefined"', async () => {
  // When the merged MergeResult has no integration_sha, the gate-audit prompt must include
  // the sentinel string '(integration_sha unrecorded/malformed)' — never the literal string 'undefined'.
  const impl = makeGateAuditImpl({}) // no integration_sha
  const { calls } = await runPhase(PROVISION_ARGS(), impl)
  const gateAuditCalls = calls.filter(c =>
    seatOf(c.opts) === 'war-auditor' &&
    (c.prompt.includes('execution-evidence') || (c.opts.label || '').includes('execution-evidence'))
  )
  assert.ok(gateAuditCalls.length > 0, 'at least one gate-audit seat is spawned')
  const prompt = gateAuditCalls[0].prompt
  assert.ok(prompt.includes('(integration_sha unrecorded/malformed)'),
    `absent integration_sha must yield sentinel '(integration_sha unrecorded/malformed)'; got: "${prompt.slice(0, 400)}"`)
  assert.ok(!prompt.includes('undefined'),
    `prompt must NEVER contain the literal string 'undefined'; got: "${prompt.slice(0, 400)}"`)
})

test('#193 T1-4 — sha rides into the auditLog (gateHeadSha + auditSha)', async () => {
  // Drive the HARD case (Critical finding) with integration_sha stubbed; assert the auditLog
  // gate-evidence entry carries gateHeadSha === 'c0ffee1234' and auditSha === 'auditsha-xyz789'.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
                 findings: [{ severity: 'Critical', title: 'mapped test provably unrun',
                              file: 'test/foo.test.js', rationale: 'absent in gate output' }],
                 confidence: 'high', audit_sha: 'auditsha-xyz789' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'c0ffee1234' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  const auditEntry = (out.auditLog || []).find(e => e && e.gateEvidence)
  assert.ok(auditEntry, 'auditLog must have a gateEvidence entry')
  assert.equal(auditEntry.gateHeadSha, 'c0ffee1234',
    'auditLog gate-evidence entry must carry gateHeadSha from the merged MergeResult')
  assert.equal(auditEntry.auditSha, 'auditsha-xyz789',
    'auditLog gate-evidence entry must carry auditSha from the gate-audit seat verdict')
})

test('#193 T1-5 — hardness preserved: Critical finding WITH integration_sha still holds the land', async () => {
  // Regression: adding gateHeadSha must not change the hard-path escalation wiring.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5, integration: 2 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
                 findings: [{ severity: 'Critical', title: 'mapped test provably unrun',
                              file: 'test/foo.test.js', rationale: 'absent in gate output' }],
                 confidence: 'high', audit_sha: 'auditsha-xyz789' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land'
        ? { mode: 'land-phase', status: 'landed' }
        : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'sha-abc123unique' }
    }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation',
    'Critical gate-evidence finding must hold the land (held:escalation) — hardness must not regress')
  const gateEsc = (out.escalated || []).find(e => e && e.reason === 'gate-evidence')
  assert.ok(gateEsc, 'escalated[] must contain a gate-evidence entry')
})

test('#393 D1 — pinOrSentinel: extract-and-eval unit cases (hex passes, non-hex collapses to sentinel)', () => {
  // Extract the pinOrSentinel arrow from the template source (same extract-and-eval
  // technique as L3 T1). The sentinel literal anchors the terminal branch.
  const match = src.match(/const pinOrSentinel\s*=\s*(s\s*=>[\s\S]+?'\(integration_sha unrecorded\/malformed\)')/)
  assert.ok(match, "src must contain a 'const pinOrSentinel = s => …' arrow definition")
  // eslint-disable-next-line no-new-func
  const pinOrSentinel = new Function(`return (${match[1]})`)()
  const SENTINEL = '(integration_sha unrecorded/malformed)'
  assert.equal(pinOrSentinel('deadbeef'), 'deadbeef', 'valid short hex passes through')
  assert.equal(pinOrSentinel(undefined), SENTINEL, 'absent sha collapses to sentinel')
  assert.equal(pinOrSentinel(''), SENTINEL, 'empty string collapses to sentinel')
  assert.equal(pinOrSentinel('8478834b3c9e0e8b3c9e0e8b…'), SENTINEL,
    "the issue's ellipsis-tailed repeating value is non-hex → sentinel")
  // Documents the D1/D2 split: a valid-SHAPE fake deliberately passes D1 (the regex cannot
  // distinguish a fake 40-hex from a real one); the cat-file -t pin-check (D2) rejects it.
  assert.equal(pinOrSentinel('8478834b3c9e0e8b3c9e0e8b'), '8478834b3c9e0e8b3c9e0e8b',
    'pure-hex 24-char value passes through — D2 (cat-file), not D1, catches well-shaped fakes')
})

test('#393 D2 — cat-file -t pin existence check present in gate-audit prompt', async () => {
  // Mirror #193 T2-2: the emitted gate-audit prompt must instruct the seat to run
  //     git -C <refineryPath> cat-file -t <gateHeadSha>
  // BEFORE the rev-parse comparison. Value-independent: assert the interpolated command form.
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const gaPrompts = gateAuditCalls(calls)
  assert.ok(gaPrompts.length > 0, 'gate-audit seats were dispatched')
  const p = gaPrompts[0].prompt
  assert.ok(p.includes('git -C /abs/repo/.claude/worktrees/run-2026/_refinery cat-file -t'),
    'gate-audit prompt must contain the git -C <refineryPath> cat-file -t pin existence check')
})

// ---------------------------------------------------------------------------
// M1 — Dead-phase halt: top-level try/catch returns held:workflow-error
// ---------------------------------------------------------------------------

test('M1 criterion #1 — in-script derivation throw is caught and RETURNS held:workflow-error (not a rejection)', async () => {
  // Drive with args that force the derivation throw: no planSlug, no runId, no worktreeRoot,
  // and the task has neither explicit branch nor explicit worktree.
  const badArgs = {
    phase: { id: 9, title: 'DeadPhase', integrationBranch: 'integration/dead/phase-9', workingBranch: 'dev/dead' },
    plan: { file: 'docs/plans/dead.md', gate: 'true' },
    tasks: [{ id: 'tDead', issue: 0, title: 'Underivable', planSlice: 'none', roster: [{ lens: 'correctness' }] }],
    learningsTarget: null,
  }
  const fn = build()
  const agentShouldNotRun = async () => { throw new Error('agent must not be called on derivation failure') }
  // Must RETURN — not reject
  const out = await fn(agentShouldNotRun, fakeParallel, async () => [], () => {}, () => {}, badArgs, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error',
    `landDecision must be 'held:workflow-error'; got: ${JSON.stringify(out.landDecision)}`)
  assert.ok(out.workflowError && typeof out.workflowError === 'object', 'workflowError must be an object')
  assert.ok(typeof out.workflowError.message === 'string' && out.workflowError.message.length > 0,
    `workflowError.message must be a non-empty string; got: ${JSON.stringify(out.workflowError && out.workflowError.message)}`)
  // stack is present (may be undefined in minified builds, but the template always sets it)
  assert.ok('stack' in out.workflowError, 'workflowError must have a stack property')
})

test('M1 criterion #6 — catch after a mid-phase throw skips teardown (structural: no teardown agent call recorded)', async () => {
  // NON-vacuous: inject the throw via a mock agent that succeeds for the topology barrier and
  // for the first worker, then throws on the auditor. This is a point past which teardown would
  // otherwise run, making the "no teardown" assertion non-vacuous (plan DP2 vacuity trap).
  let workerRan = false
  const throwAfterWorkerImpl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-worker') { workerRan = true; return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} } }
    // auditor seat = first agent() past the worker, before any merge; workerRan===true guarantees the catch is reached mid-flow — the non-vacuous injection point (supersedes historical 'after a merge' prose).
    if (seat === 'war-auditor') throw new Error('injected-auditor-throw-after-worker')
    // refiner merge path — should not be reached since auditor throws first
    if (seat === 'war-refiner') return { mode: 'merge-task', status: 'merged' }
    return {}
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), throwAfterWorkerImpl)
  assert.ok(workerRan, 'worker must have run before the injected throw (non-vacuous setup)')
  assert.equal(out.landDecision, 'held:workflow-error',
    `landDecision must be 'held:workflow-error'; got: ${JSON.stringify(out.landDecision)}`)
  assert.ok(out.workflowError && out.workflowError.message.includes('injected-auditor-throw-after-worker'),
    `workflowError.message must surface the injected error; got: ${JSON.stringify(out.workflowError && out.workflowError.message)}`)
  // Structural teardown check: teardown is not an observable agent() call in this template
  // (red-team confirmed — only inline cleanup). Use the suite's structural idiom.
  const cleanup = calls.find(c => /remove-worktree|worktree remove|teardown|clean ?up/i.test(c.prompt))
  assert.ok(!cleanup, `no teardown/cleanup agent call must be recorded on the catch path; found: ${cleanup && JSON.stringify(cleanup.prompt)}`)
})

// ---------------------------------------------------------------------------
// M2 — no-test REFINE sub-loop + HARD_ESCALATION_REASONS += no-test
// ---------------------------------------------------------------------------

// Single-task args for no-test tests (requiresTest:true by default)
const NO_TEST_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: true }],
  ...over,
})

// Helper: isAddTestWorker — fix-worker dispatched by the no-test sub-loop
const isAddTestWorker = (c) => seatOf(c.opts) === 'war-worker' && /add-test:/.test(c.opts.label || '')

test('M2 Test 1 — no-test catch: fix-worker dispatched then full audit panel re-spawns then re-merge attempted', async () => {
  // Drive: merge-task returns no-test on first call, then merged on second call (after fix + re-audit).
  // Re-audit returns approve. Assert fix-worker dispatched, auditor seats re-spawned, re-merge attempted.
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') { return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' } }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      // First merge attempt returns no-test; second (re-merge after fix) returns merged
      return mergeCallCount === 1
        ? { mode: 'merge-task', status: 'no-test' }
        : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(NO_TEST_ARGS(), impl)

  // A fix-worker (add-test) must be dispatched — unique token 'add-test:' in label
  const addTestCall = calls.find(isAddTestWorker)
  assert.ok(addTestCall, 'add-test fix-worker must be dispatched on no-test result')
  assert.match(addTestCall.prompt, /ADD_TEST|assert-test-in-diff|no test/i,
    'add-test fix-worker prompt must reference the no-test issue (unique token)')

  // Audit panel must re-spawn after the fix (>1 auditor call = initial audit + re-audit)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length >= 2,
    `audit panel must re-spawn after the fix-worker (expected >=2 auditor calls, got ${auditCalls.length})`)

  // A second merge attempt must occur
  assert.ok(mergeCallCount >= 2, `re-merge must be attempted after re-audit (mergeCallCount=${mergeCallCount})`)

  // Task must land (re-audit approved + re-merge succeeded)
  assert.ok(out.landed.includes('t1'), 't1 must land after no-test fix + re-audit + re-merge')
})

test('M2 Test 1b — vacuous added test (re-audit returns blocking finding) does NOT merge — escalates', async () => {
  // Drive: merge-task returns no-test; fix-worker dispatched; re-audit returns request_changes
  // (vacuous test — auditor finds the test does not exercise the slice).
  // Assert: task escalates, does not land.
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') {
      // Initial audit: approve. Re-audit (after add-test fix): request_changes with a unique finding.
      const isReAudit = mergeCallCount >= 1
      return isReAudit
        ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'vacuous-test-does-not-exercise-slice', file: 'x.test.mjs', rationale: 'test is vacuous' }] }
        : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      return { mode: 'merge-task', status: 'no-test' }  // always no-test
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(NO_TEST_ARGS(), impl)

  // Task must NOT land
  assert.ok(!out.landed.includes('t1'), 't1 must NOT land when re-audit finds the test vacuous')
  // Must be escalated with reason 'escalate' — EXACTLY ONE entry for t1 (double-escalation check)
  const t1Escalations = (out.escalated || []).filter(e => e && e.task === 't1')
  assert.equal(t1Escalations.length, 1, 'must have EXACTLY ONE escalated entry for t1 (no double-escalation)')
  assert.equal(t1Escalations[0].reason, 'escalate', "escalated entry must have reason==='escalate' (not 'no-test')")
  // The 'no-test:exhausted' auditLog verdict must NOT appear — budget was not exhausted
  const exhaustedLog = (out.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'no-test:exhausted')
  assert.ok(!exhaustedLog, "auditLog must NOT contain verdict 'no-test:exhausted' when re-audit failed before budget exhaustion (double-escalation guard)")
  // Vacuous path must complete cleanly — not crash into held:workflow-error
  assert.equal(out.landDecision, 'held:escalation', 'vacuous re-audit must hold cleanly as held:escalation (escalate is a HARD reason), not held:workflow-error')
  assert.ok(!out.workflowError, 'vacuous path must not throw a workflow error')
})

test('M2 Test 2 — shared budget: audit fixes + no-test fixes together <= roundLimit; exhaustion escalates {reason:"no-test"}', async () => {
  // Drive with roundLimit:2. t1 audit uses 1 fix round (audit-fix at round 0). Then no-test
  // sub-loop has 1 round left (fixRounds=1 at entry). After one no-test fix, fixRounds=2 >= roundLimit →
  // next no-test still → budget exhausted → escalate {reason:'no-test'}.
  // Observe carry via auditLog[].fixRounds.
  const SHARED_BUDGET_ARGS = NO_TEST_ARGS({ run: { roundLimit: 2 } })
  let auditRound2 = 0
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-worker' && opts.phase === 'Audit') return { task_id: 't1', status: 'implemented', head_sha: 'abc2', tests: {} }
    if (seat === 'war-auditor') {
      auditRound2++
      // First audit call: request_changes (causes 1 fix round in audit loop)
      // Subsequent (re-audit after fix, and re-audit in no-test sub-loop): approve
      return auditRound2 === 1
        ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'audit-fix-finding', file: 'a.js', rationale: 'fix needed' }] }
        : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCount++
      // All merge attempts return no-test → exhaust budget
      return { mode: 'merge-task', status: 'no-test' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(SHARED_BUDGET_ARGS, impl)

  // Must NOT land — budget exhausted
  assert.ok(!out.landed.includes('t1'), 't1 must not land when budget exhausted')

  // escalated must contain a no-test reason (hard escalation on budget exhaustion)
  const noTestEsc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'no-test')
  assert.ok(noTestEsc, 'escalated must contain {task:"t1", reason:"no-test"} on budget exhaustion')

  // landDecision must be held (no-test is a HARD_ESCALATION_REASON)
  assert.equal(out.landDecision, 'held:escalation', 'landDecision must be held:escalation when no-test budget exhausted')

  // Observe fixRounds carry via auditLog[].fixRounds — the initial audit entry must show fixRounds >= 1
  // (it used at least 1 fix round in the audit loop)
  const auditEntry = (out.auditLog || []).find(e => e && e.task === 't1' && typeof e.fixRounds === 'number')
  assert.ok(auditEntry, 'auditLog must have a t1 entry with fixRounds field')
  assert.ok(auditEntry.fixRounds >= 1,
    `auditLog fixRounds must carry the audit-loop count (>=1); got ${auditEntry.fixRounds}`)
})

test('M2 Test 2b — requiresTest:false task routes straight to merge; no fix-worker / re-audit re-spawn', async () => {
  // A task with requiresTest:false must never return no-test from the merge-task — the refiner
  // skips the assert-test-in-diff.sh check. The sub-loop never fires.
  const EXEMPT_ARGS = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false }],
  })
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(EXEMPT_ARGS, impl)

  // No add-test fix-worker dispatched
  const addTestCall = calls.find(isAddTestWorker)
  assert.ok(!addTestCall, 'requiresTest:false must not trigger an add-test fix-worker')

  // Merge prompt must mention requiresTest:false / skip the check
  const mergeCall = calls.find(isMergeTask)
  assert.ok(mergeCall, 'a merge-task is dispatched')
  assert.match(mergeCall.prompt, /requiresTest:false|skip.*assert-test|assert-test.*skip/i,
    'merge-task prompt must state requiresTest:false and skip the assert-test-in-diff.sh check')

  // Task lands normally
  assert.ok(out.landed.includes('t1'), 'requiresTest:false task lands without no-test sub-loop')
})

// ---------------------------------------------------------------------------
// L3 T1 — blockedReason predicate unit test (extract-and-eval totality proof)
// The predicate is a named const inside the template source. We extract it via
// regex, eval it, and assert the four cases from the spec §7.3.
// ---------------------------------------------------------------------------

test('L3 T1 — blockedReason predicate is total: extract-and-eval all four cases', () => {
  // Extract the arrow definition from the template source. The predicate is an
  // internal const — not a module export — so we use extract-and-eval (the same
  // technique as the AsyncFunction harness) to exercise the real predicate code.
  // The colon anchors the terminal `: null)` branch so an interior `null)` (a
  // future `|| null)` / `?? null)`) cannot truncate the lazy capture.
  const match = src.match(/const blockedReason\s*=\s*(r\s*=>[\s\S]+?:\s*null\))/)
  assert.ok(match, 'src must contain a "const blockedReason = r => …" arrow definition')
  // eslint-disable-next-line no-new-func
  const blockedReason = new Function(`return (${match[1]})`)()
  // Case 1: null/dead worker → 'worker returned no result'
  assert.equal(blockedReason(null), 'worker returned no result',
    'blockedReason(null) must return "worker returned no result"')
  // Case 2: blocked with reason
  assert.equal(blockedReason({ status: 'blocked', blocked_reason: 'x' }), 'x',
    'blockedReason({status:"blocked", blocked_reason:"x"}) must return "x"')
  // Case 3: blocked without reason → fallback message
  assert.equal(blockedReason({ status: 'blocked' }), 'worker returned no result',
    'blockedReason({status:"blocked"}) must return "worker returned no result"')
  // Case 4: non-blocked status → null (no problem)
  assert.equal(blockedReason({ status: 'implemented' }), null,
    'blockedReason({status:"implemented"}) must return null')
})

// 'M2 Test 3 — drift-guard: both HARD_ESCALATION_REASONS mirrors equal including no-test' was ABSORBED
// into the D2 mirror registry (end of file): the HARD_ESCALATION_REASONS row does the identical
// order-insensitive deepEqual of the inline array against the canonical export, no-test included.

test('#237 — both merge-task dispatch prompts split exit-1 (no-test) from exit-2 (error), no non-zero collapse', () => {
  // Both merge-task dispatch prompt strings contain an `assert-test-in-diff.sh ... <clause>` sentence.
  // The clause must mirror war-refiner.md step 4: exit 1 → no-test (do NOT merge), exit 2 → error
  // (git/ref error, never no-test). A bare `exits non-zero` collapse mis-routes a transient exit-2
  // bad-ref into no-test. Slice each prompt's assert-test-in-diff clause out of src and assert
  // per-prompt so the sibling prompt / adjacent submodule clause cannot satisfy an assertion.
  // Anchor each slice on its unique leading phrase, NOT `.match()` source order:
  // Prompt A renders `to verify the task diff contains`, Prompt B `to verify the task diff now
  // contains` — so `to verify the task diff contains` is disjoint from B (B inserts `now`) and
  // `now contains` is disjoint from A. Isolation no longer depends on A preceding B in src
  // ([[regex-slice-disambiguation-relies-on-match-order-not-anchoring]], #326).
  const prompts = {
    // Prompt A: requiresTest-branch merge prompt (unique phrase `to verify the task diff contains`).
    'A (requiresTest branch)':
      src.match(/run assert-test-in-diff\.sh[^`]*to verify the task diff contains[^`]*/),
    // Prompt B: no-test-retry merge prompt (unique phrase `now contains`).
    'B (no-test retry)':
      src.match(/run assert-test-in-diff\.sh[^`]*now contains[^`]*/),
  }
  for (const [name, m] of Object.entries(prompts)) {
    assert.ok(m, `merge-task prompt ${name}: assert-test-in-diff clause not found in src`)
    const clause = m[0]
    assert.ok(clause.includes('exit 1'), `prompt ${name}: must name 'exit 1' (no-test path)`)
    assert.ok(clause.includes('no-test'), `prompt ${name}: exit-1 path must return 'no-test'`)
    assert.ok(clause.includes('exit 2'), `prompt ${name}: must name 'exit 2' (git/ref error path)`)
    assert.ok(clause.includes('error'), `prompt ${name}: exit-2 path must return 'error'`)
    // Load-bearing negative: the collapse phrasing must be gone (a bare `no-test` match would pass
    // against both old and new text — the negative is what proves exit-2 no longer routes to no-test).
    assert.ok(!clause.includes('exits non-zero'),
      `prompt ${name}: must NOT collapse exit codes with 'exits non-zero'`)
  }
})

// ---------------------------------------------------------------------------
// Phase 2 Task 1 (#574/#596) — thread overrides.testPattern → assert-test-in-diff.sh --pattern
// (both dispatched merge-task sites) + Provision-prompt base-derivation prose + war-refiner.md mirror.
// Validation 2 (byte-identical when null) + the --pattern half of validation 6 (drift guard).
// ---------------------------------------------------------------------------

// Drive the no-test → add-test fix → re-audit(approve) → re-merge flow so BOTH the initial merge-task
// prompt AND the floor-retry re-merge prompt are dispatched (first Refine call = no-test, second = merged).
async function runNoTestLoop(over) {
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      return mergeCallCount === 1 ? { mode: 'merge-task', status: 'no-test' } : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  return runPhase(NO_TEST_ARGS(over), impl)
}
// The two merge-task prompts are disambiguated by label: the initial merge is `merge:t1`, the floor-retry
// re-merge is `merge:t1:floor-retry:r<n>` — the only Refine-phase 'floor-retry' seat in this flow.
const mergePromptsOf = (calls) => {
  const merges = calls.filter(isMergeTask)
  return {
    initial: merges.find(c => !/floor-retry/.test(c.opts.label || '')),
    floorRetry: merges.find(c => /floor-retry/.test(c.opts.label || '')),
  }
}

test('testPattern threading (validation 2): set ⇒ BOTH merge prompts carry the exact --pattern arg; set-minus-arg is byte-identical to the bare prompt', async () => {
  const PAT = '*.test.ts *.test.tsx'
  const ARG = ` --pattern '${PAT}'`
  const PLAN_PAT = { file: 'docs/plans/wtprov-A.md', gate: 'make gate', testPattern: PAT }

  const bare = mergePromptsOf((await runNoTestLoop()).calls)
  const pat = mergePromptsOf((await runNoTestLoop({ plan: PLAN_PAT })).calls)

  assert.ok(bare.initial && bare.floorRetry, 'both merge prompts (initial + floor-retry) dispatched in the bare no-test loop')
  assert.ok(pat.initial && pat.floorRetry, 'both merge prompts (initial + floor-retry) dispatched with testPattern set')

  // set ⇒ the exact --pattern '<value>' rides the assert-test-in-diff.sh invocation right after the task
  // branch (anchored on ` to verify …` so the arg's INSERTION POINT is proven, no branch string coupling).
  assert.ok(pat.initial.prompt.includes(`${ARG} to verify the task diff contains`),
    'initial merge prompt: --pattern rides assert-test-in-diff.sh immediately after the task branch')
  assert.ok(pat.floorRetry.prompt.includes(`${ARG} to verify the task diff now contains`),
    'floor-retry re-merge prompt: --pattern rides assert-test-in-diff.sh immediately after the task branch')

  // unset ⇒ NO --pattern anywhere in either prompt (bare).
  assert.ok(!bare.initial.prompt.includes('--pattern'), 'null ⇒ initial merge prompt is bare (no --pattern)')
  assert.ok(!bare.floorRetry.prompt.includes('--pattern'), 'null ⇒ floor-retry re-merge prompt is bare (no --pattern)')

  // byte-identical: removing the single inserted arg restores the bare prompt EXACTLY (the *.test.sh
  // union is script-side from Phase 1, never re-stated per prompt — so nothing else differs).
  assert.equal(pat.initial.prompt.replace(ARG, ''), bare.initial.prompt,
    'initial merge prompt: set minus the --pattern arg is byte-identical to bare')
  assert.equal(pat.floorRetry.prompt.replace(ARG, ''), bare.floorRetry.prompt,
    'floor-retry re-merge prompt: set minus the --pattern arg is byte-identical to bare')
})

test('testPattern drift-guard (validation 6, --pattern half): war-refiner.md step 4 carries the --pattern / overrides.testPattern tokens (token-anchored, case-tolerant)', () => {
  // Token-anchored, NOT full-line bytes (shared-string-constant-quote-literal-byte-anchor-fragility) and
  // case-tolerant (prompt-only-clause-grep-guard-must-tolerate-sentence-case). The standing clause names
  // NO concrete runtime value by design — it cannot know it — so only these two tokens are load-bearing.
  assert.match(refinerMd, /--pattern/i,
    'war-refiner.md step 4 names the --pattern argument (standing mirror of the dispatched prompt)')
  assert.match(refinerMd, /overrides\.testPattern/i,
    "war-refiner.md step 4 attributes --pattern to the run's pinned overrides.testPattern")
})

test('Provision prompt (part c): step 2 describes the origin-derived base + divergence HALT, treating ANY non-zero exit as a halt (not exit-3-only)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /ensure-integration/, 'step 2 runs ensure-integration')
  assert.match(p, /fetch(es)? origin/i, 'step 2 describes fetching origin before cutting the base (ADR 0008 derivation)')
  assert.match(p, /diverg/i, 'step 2 names the diverged local/origin base case')
  // The divergence die is a distinct non-zero exit (p1t2 uses exit 7): the prompt must treat ANY non-zero
  // exit as a halt, never special-case exit 3 (provision-divergence-die-exit-7-unenumerated).
  assert.match(p, /any non-zero exit/i, 'the provision prompt treats ANY non-zero exit as a halt (does not special-case exit 3)')
  assert.match(p, /never pick a side/i, 'divergence: report the die in the MergeResult, never pick a side, never retry with a different base')
})

// ---------------------------------------------------------------------------
// L3 T2 — blocked fix escalates early + initial-worker behavior preserved
// buildSeqImpl harness: fresh instance per test, label→results queue, .shift() per call.
// ---------------------------------------------------------------------------

// Single-task args for L3 tests (one lens, high roundLimit so early-break is observable)
const L3_ARGS = (over = {}) => PROVISION_ARGS({
  run: { roundLimit: 5 },
  tasks: [{ id: 't1', issue: 101, title: 'L3 task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})

test('L3 T2 Test 1 — blocked fix-worker escalates on round r, not after roundLimit rounds', async () => {
  // Plan §7.1,2: a fix-worker returning {status:'blocked', blocked_reason:'X'} on round r < roundLimit
  // must yield verdict:'escalate', blocked:'X' in the task result, AND the auditLog entry carries
  // blocked:'X'. The loop must run EXACTLY r+1 fix dispatches (the initial audit + 1 fix = 2 total
  // work-seat dispatches when r=0), NOT roundLimit dispatches.
  //
  // Load-bearing assertion: deleting the 'fix:t1:r1' binding makes the loop re-audit and approve+land
  // (the auditor returns 'approve' once fixDispatchCount>0), so the early-escalate is skipped and the
  // blocked:'X' field is absent — assert on the unique token 'X'.
  let fixDispatchCount = 0
  const impl = buildSeqImpl(
    // The fix-worker (label fix:t1:r1) returns blocked with the unique token 'X'
    { 'fix:t1:r1': [{ task_id: 't1', status: 'blocked', blocked_reason: 'X' }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
      if (seat === 'war-worker' && opts.phase === 'Audit') {
        fixDispatchCount++
        // If we reach a second fix dispatch the test is wrong (shouldn't happen if implementation is correct)
        return { task_id: 't1', status: 'implemented', head_sha: 'abc2', tests: {} }
      }
      if (seat === 'war-auditor') {
        // First audit: request_changes with a Major finding to trigger the fix-worker
        if (fixDispatchCount === 0) {
          return { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'needs-fix', file: 'a.js', rationale: 'fix needed' }] }
        }
        return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      }
      if (seat === 'war-refiner') {
        return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out, calls } = await runPhase(L3_ARGS(), impl)

  // 1. verdict must be 'escalate' (not 'audit-blocked' from exhaustion)
  // Check via auditLog and escalated
  const t1Esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(t1Esc, 'escalated must have an entry for t1')
  assert.equal(t1Esc.reason, 'escalate', 'escalation reason must be "escalate" (not "audit-blocked")')
  assert.equal(t1Esc.blocked, 'X', 'escalated entry must carry blocked:"X" (the unique token from the fix-worker)')

  // 2. auditLog entry carries blocked:'X'
  const logEntry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(logEntry, 'auditLog must have a t1 entry')
  assert.equal(logEntry.blocked, 'X', 'auditLog entry must carry blocked:"X" (reason flows from fix-worker)')

  // 3. The loop ran exactly 1 fix dispatch (r=0, r+1=1 fix dispatch), NOT roundLimit (5) dispatches
  const fixCalls = calls.filter(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit')
  assert.equal(fixCalls.length, 1,
    `loop must run EXACTLY 1 fix dispatch on blocked (not ${fixCalls.length}); if 5 the binding is missing`)

  // 4. landDecision must be held:escalation (escalate ∈ HARD_ESCALATION_REASONS)
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation when fix-worker blocks (escalate is a HARD reason)')
})

test('#268 — blocked add-test worker escalates via Site 3 (no-test:add-test-blocked)', async () => {
  // Plan §'Phase 5 — #268': RETROFIT regression guard for Site 3 (the `if (addFixWhy) { … }` body in
  // the no-test sub-loop). Drive: merge-task refiner returns { status:'no-test' } (enter the sub-loop) →
  // initial audit approved → the BLOCKED add-test worker on label 'add-test:t1:r1' returns
  // { status:'blocked', blocked_reason:'Y' }. blockedReason(addFix) === 'Y' is truthy, so Site 3 fires:
  // one escalated {reason:'escalate', blocked:'Y'}, one auditLog {verdict:'no-test:add-test-blocked',
  // blocked:'Y'}, no 'no-test:exhausted' (we break before the budget-exhausted arm), t1 does not land,
  // landDecision === 'held:escalation' (escalate ∈ HARD_ESCALATION_REASONS).
  //
  // Field name MUST be blocked_reason (the blockedReason predicate reads r.blocked_reason at production
  // ~:159). A wrong key ('blocked') makes blockedReason falsy, the Site-3 branch never fires, and the
  // test passes by exercising the WRONG path (memory weak-test-assertion-passes-without-feature-being-exercised).
  //
  // Load-bearing on the unique token 'no-test:add-test-blocked' (zero occurrences in this file before
  // #268). Proven by transient deletion of the Site-3 escalated.push + auditLog.push (the `if (addFixWhy)`
  // body): the two token/blocked assertions go RED (memory retrofit-site-existing-tests-as-regression-guard).
  const impl = buildSeqImpl(
    {
      // First merge-task returns no-test → enter the no-test sub-loop.
      'merge:t1': [{ mode: 'merge-task', status: 'no-test' }],
      // The add-test worker (label add-test:t1:r1 for t1 on the first round) is BLOCKED with token 'Y'.
      'add-test:t1:r1': [{ task_id: 't1', status: 'blocked', blocked_reason: 'Y' }],
    },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out } = await runPhase(L3_ARGS(), impl)

  // 1. Exactly one escalated entry for t1 with {reason:'escalate', blocked:'Y'}.
  const t1Esc = (out.escalated || []).filter(e => e && e.task === 't1')
  assert.equal(t1Esc.length, 1, 'exactly one escalated entry for t1')
  assert.equal(t1Esc[0].reason, 'escalate', 'escalated reason must be "escalate"')
  assert.equal(t1Esc[0].blocked, 'Y', 'escalated entry must carry blocked:"Y" (the unique token from the blocked add-test worker)')

  // 2. Exactly one auditLog entry with {verdict:'no-test:add-test-blocked', blocked:'Y'} — the load-bearing token.
  const t1AddBlocked = (out.auditLog || []).filter(e => e && e.task === 't1' && e.verdict === 'no-test:add-test-blocked')
  assert.equal(t1AddBlocked.length, 1, 'exactly one auditLog entry with verdict "no-test:add-test-blocked" (Site 3)')
  assert.equal(t1AddBlocked[0].blocked, 'Y', 'the Site-3 auditLog entry must carry blocked:"Y"')

  // 3. NO 'no-test:exhausted' verdict — we break at Site 3 before the budget-exhausted arm.
  const exhausted = (out.auditLog || []).filter(e => e && e.verdict === 'no-test:exhausted')
  assert.equal(exhausted.length, 0, 'no "no-test:exhausted" verdict (Site 3 breaks before the budget-exhausted arm)')

  // 4. t1 does NOT land.
  assert.ok(!(out.landed || []).includes('t1'), 't1 must not land after a blocked add-test worker')

  // 5. landDecision === 'held:escalation' (escalate ∈ HARD_ESCALATION_REASONS).
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation when the add-test worker blocks (escalate is a HARD reason)')
})

test('L3 T2 Test 2 — blocked initial-worker behavior preserved: escalate with expected:0, seats:[], reason', async () => {
  // Plan §7.4: the initial-worker guard rewrite (using blockedReason) must be behavior-preserving.
  // A blocked/dead initial worker must still yield verdict:'escalate', expected:0, seats:[], and the reason.
  // We test both: null result and status:'blocked' with a reason.

  // Case A: worker returns {status:'blocked', blocked_reason:'initial-block-reason'}
  const implBlocked = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') {
      return { task_id: 't1', status: 'blocked', blocked_reason: 'initial-block-reason' }
    }
    if (seat === 'war-refiner') {
      return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    }
    return {}
  }
  const { out: outA } = await runPhase(L3_ARGS(), implBlocked)
  const escA = (outA.escalated || []).find(e => e && e.task === 't1')
  assert.ok(escA, 'blocked initial worker must surface an escalated entry')
  assert.equal(escA.reason, 'escalate', 'escalation reason must be "escalate"')
  assert.equal(escA.blocked, 'initial-block-reason', 'escalated entry must carry blocked:"initial-block-reason"')
  // auditLog entry must carry expected:0 (not undefined) and seats:[] / returned:0
  const logA = (outA.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(logA, 'auditLog must have a t1 entry')
  assert.strictEqual(logA.requested, 0, 'auditLog.requested must be 0 (not undefined) for blocked initial worker')
  assert.strictEqual(logA.returned, 0, 'auditLog.returned must be 0 for blocked initial worker (no audit seats)')

  // Case B: worker returns null (dead worker)
  const implNull = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return null
    if (seat === 'war-refiner') {
      return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    }
    return {}
  }
  const { out: outB } = await runPhase(L3_ARGS(), implNull)
  const escB = (outB.escalated || []).find(e => e && e.task === 't1')
  assert.ok(escB, 'null initial worker must surface an escalated entry')
  assert.equal(escB.reason, 'escalate', 'escalation reason must be "escalate" for null worker')
  assert.equal(escB.blocked, 'worker returned no result', 'null worker escalation must carry the default reason')
})

// ---------------------------------------------------------------------------
// Submodule-support Increment 1 — T2 (sub-issue #280)
// Tests for submodule-blocked routing in the REFINE section.
// buildSeqImpl harness: fresh instance per test, label→results queue, .shift() per call.
// ---------------------------------------------------------------------------

test('T2 #280 Test 1 — merge-task submodule-blocked → immediate escalate with 0 fix-worker dispatches', async () => {
  // A merge-task returning status:'submodule-blocked' must:
  //   (a) cause an escalated entry with reason:'escalate' carrying the submodule detail token
  //   (b) dispatch ZERO fix-workers (it is NOT the no-test loop — refuse-all, like env-blocked)
  //   (c) hold the land (escalate ∈ HARD_ESCALATION_REASONS)
  //
  // Load-bearing: the unique token 'touches a submodule' can only appear in the escalated detail
  // when the submodule-blocked branch is taken. If that branch is deleted the test fails because
  // the escalated entry either vanishes or carries a different reason/detail.
  const impl = buildSeqImpl(
    { 'merge:t1': [{ mode: 'merge-task', status: 'submodule-blocked' }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    }
  )
  const { out, calls } = await runPhase(L3_ARGS(), impl)

  // (a) escalated entry with reason:'escalate' carrying the submodule detail
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc, 'escalated must have an entry for t1')
  assert.equal(esc.reason, 'escalate', 'submodule-blocked routes to reason:"escalate" (reuses existing member, no cascade)')
  assert.ok(typeof esc.detail === 'string' && esc.detail.includes('touches a submodule'),
    'escalated detail must carry unique token "touches a submodule"')

  // (b) ZERO fix-worker dispatches (not the no-test loop)
  const fixCalls = calls.filter(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit')
  assert.equal(fixCalls.length, 0,
    'submodule-blocked must dispatch 0 fix-workers (refuse-all, not the no-test loop)')

  // (c) land held
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation (escalate is a HARD_ESCALATION_REASON)')
})

test('T2 #280 Test 2 — submodule-blocked escalation rides existing "escalate" member; land-decision.mjs + drift-guard untouched', () => {
  // Assert the escalation reuses the existing 'escalate' HARD_ESCALATION_REASON (DP3).
  // No new member was added — HARD_ESCALATION_REASONS is unchanged, no land-decision.mjs cascade.

  // Verify HARD_ESCALATION_REASONS still contains 'escalate' (the existing member being reused)
  const herMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS found in workflow-template.js')
  const herParsed = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.ok(herParsed.includes('escalate'),
    'HARD_ESCALATION_REASONS contains "escalate" (the existing member reused by submodule-blocked)')

  // Verify 'submodule-blocked' is NOT a member of HARD_ESCALATION_REASONS (it routes via 'escalate')
  assert.ok(!herParsed.includes('submodule-blocked'),
    '"submodule-blocked" must NOT appear in HARD_ESCALATION_REASONS (routes via existing "escalate", no cascade)')

  // Verify 'submodule-blocked' IS in the MERGE_RESULT status enum
  const mrMatch = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(mrMatch, 'MERGE_RESULT with status enum found in workflow-template.js')
  const mrParsed = JSON.parse(mrMatch[1].replace(/'/g, '"'))
  assert.ok(mrParsed.includes('submodule-blocked'),
    'MERGE_RESULT status enum includes "submodule-blocked"')
})

// ---------------------------------------------------------------------------
// T4 #297 — Submodule support Increment 2: engine extensions
// buildSeqImpl harness: fresh instance per test (memory buildseqimpl-harness-for-multi-call-lens-tests).
// ---------------------------------------------------------------------------

// Args for a phase that has a submodule task and a gitlink-bump task.
// The submodule task has taskType:'submodule' and targetRepo (the submodule checkout path).
// The bump task has taskType:'gitlink-bump' and is declared (declared:true).
const SUBMOD_PHASE_ARGS = (over = {}) => ({
  phase: { id: 5, title: 'SubmodPhase', integrationBranch: 'integration/submod-test/phase-5', workingBranch: 'dev/submod-test' },
  plan: { file: 'docs/plans/submod-test.md', gate: 'node --test' },
  planSlug: 'submod-test',
  runId: 'run-submod-2026',
  worktreeRoot: '/abs/repo/.claude/worktrees',
  mainCheckout: '/abs/repo',
  tasks: [
    { id: 'tsub', issue: 301, title: 'Submodule task', planSlice: 'submod slice',
      roster: [{ lens: 'correctness' }], taskType: 'submodule',
      targetRepo: '/abs/submodule-checkout', targetBase: 'main' },
    { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
      roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true, deps: ['tsub'] },
  ],
  learningsTarget: null,
  ...over,
})

test('T4 #297 Test 1 — 2B submodule land → held:submodule-pr, PR ref captured, returned DIRECTLY (not via decideLand)', async () => {
  // A submodule phase where the land agent returns status:'submodule-pr' (2B: branch pushed, PR opened).
  // The engine must:
  //   (a) map it to landDecision:'held:submodule-pr' (unique token — distinct from held:escalation)
  //   (b) capture the PR ref (pr_number, pr_remote) in the ledger (escalated or landResult)
  //   (c) return DIRECTLY — NOT routed through decideLand/HARD_ESCALATION_REASONS
  //       (proof: 'submodule-pr' must NOT appear in HARD_ESCALATION_REASONS; the held:submodule-pr
  //        is set directly like held:workflow-error, bypassing the decideLand branch)
  //
  // Load-bearing: deleting the 2B direct-return branch causes landDecision to remain 'landed' or
  // 'held:escalation' (not 'held:submodule-pr'), failing the unique-token assertion.
  const PR_NUMBER = 42
  const PR_REMOTE = 'git@github.com:org/submodule.git'
  const impl = buildSeqImpl(
    // The land agent for the submodule phase returns submodule-pr (2B)
    { [`land:phase-5`]: [{ mode: 'land-phase', status: 'submodule-pr', pr_number: PR_NUMBER, pr_remote: PR_REMOTE }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc', tests: { unit: 1 } }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'submodule-pr', pr_number: PR_NUMBER, pr_remote: PR_REMOTE }
      if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
      return {}
    }
  )
  const ARGS = SUBMOD_PHASE_ARGS()
  // Run with a single submodule task only (no bump dep) to keep the land path simple
  const args = { ...ARGS, tasks: [ARGS.tasks[0]] }
  const { out } = await runPhase(args, impl)

  // (a) landDecision must be 'held:submodule-pr' — unique token
  assert.equal(out.landDecision, 'held:submodule-pr',
    'a submodule-pr land result must yield landDecision:"held:submodule-pr"')

  // (b) PR ref must be captured somewhere in the output (escalated or landResult)
  const hasRef = (out.escalated || []).some(e => e && (e.pr_number === PR_NUMBER || (e.detail && e.detail.pr_number === PR_NUMBER)))
    || (out.landResult && out.landResult.pr_number === PR_NUMBER)
  assert.ok(hasRef,
    'PR ref (pr_number=42) must be captured in escalated[] or landResult so the Lead can resume')

  // (c) 'submodule-pr' must NOT appear in HARD_ESCALATION_REASONS (direct return, no cascade)
  const herMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(herMatch, 'HARD_ESCALATION_REASONS found in workflow-template.js')
  const herParsed = JSON.parse(herMatch[1].replace(/'/g, '"'))
  assert.ok(!herParsed.includes('submodule-pr'),
    '"submodule-pr" must NOT appear in HARD_ESCALATION_REASONS (held:submodule-pr is set directly, not via decideLand)')

  // (c) 'submodule-pr' must be in the MERGE_RESULT status enum (new status value)
  const mrMatch2 = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(mrMatch2, 'MERGE_RESULT with status enum found')
  const mrParsed2 = JSON.parse(mrMatch2[1].replace(/'/g, '"'))
  assert.ok(mrParsed2.includes('submodule-pr'),
    'MERGE_RESULT status enum must include "submodule-pr" (the 2B refiner result)')
})

test('T4 #297 Test 2 — declared gitlink-bump merge-task passes --declared to assert-no-submodule-mutation.sh', async () => {
  // A task with taskType:'gitlink-bump' and declared:true must have '--declared' threaded into its
  // merge-task prompt so that assert-no-submodule-mutation.sh allows the legitimate pin move.
  // A non-declared task must NOT receive --declared (the guard remains strict).
  //
  // Load-bearing: deleting the --declared thread causes the merge-task prompt to lack the flag,
  // and the unique token '--declared' assertion fails. A non-declared task with '--declared' would
  // equally fail (false-positive assertion).
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
    return {}
  }

  // Case A: declared bump task — must carry --declared
  const bumpArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
        roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true },
    ],
  })
  const { calls: callsA } = await runPhase(bumpArgs, impl)
  const mergeCallA = callsA.find(c => isMergeTask(c) && /tbump/.test(c.opts.label || ''))
  assert.ok(mergeCallA, 'a merge-task is dispatched for the bump task')
  // Load-bearing order check: script CLI is `<base> <branch> [--declared]` — flag must follow BOTH positionals.
  // A bare substring check passes even when --declared precedes the refs (broken ordering).
  assert.match(mergeCallA.prompt, /assert-no-submodule-mutation\.sh\s+\S+\s+\S+\s+--declared/,
    'declared gitlink-bump merge-task prompt must pass --declared AFTER both positional refs to assert-no-submodule-mutation.sh')

  // Case B: regular (non-declared, non-bump) task — must NOT carry --declared
  const regularArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'treg', issue: 303, title: 'Regular task', planSlice: 'reg slice', roster: [{ lens: 'correctness' }] },
    ],
  })
  const { calls: callsB } = await runPhase(regularArgs, impl)
  const mergeCallB = callsB.find(c => isMergeTask(c) && /treg/.test(c.opts.label || ''))
  assert.ok(mergeCallB, 'a merge-task is dispatched for the regular task')
  assert.ok(!mergeCallB.prompt.includes('--declared'),
    'a non-declared regular task merge-task must NOT include "--declared"')
})

test('T4 #297 Test 3 — blocked gitlink-bump worker escalates early via blockedReason', async () => {
  // A gitlink-bump worker returning {status:'blocked', blocked_reason:'bump-blocked-reason'} must:
  //   (a) be escalated early with reason:'escalate' and blocked:'bump-blocked-reason' (the unique token)
  //   (b) dispatch ZERO fix-workers (the bump worker is a new dispatch site, same early-escalate path)
  //   (c) hold the land (escalate ∈ HARD_ESCALATION_REASONS)
  //
  // Load-bearing: the unique token 'bump-blocked-reason' only appears in escalated.blocked when the
  // blockedReason predicate is applied to the bump worker result. Deleting the blockedReason call
  // causes the loop to continue into audits, losing the early-escalate path and the unique token.
  const impl = buildSeqImpl(
    // The bump worker returns blocked with the unique token
    { 'work:tbump': [{ task_id: 'tbump', status: 'blocked', blocked_reason: 'bump-blocked-reason' }] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: opts.label?.split(':')[1] || 't', status: 'implemented', head_sha: 'abc', tests: { unit: 1 } }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
      if (seat === 'war-servitor') return { phase: 5, target: 't', learnings: [] }
      return {}
    }
  )
  // Use only the bump task (no submodule dep to simplify) — bump task only
  const bumpOnlyArgs = SUBMOD_PHASE_ARGS({
    tasks: [
      { id: 'tbump', issue: 302, title: 'Gitlink bump task', planSlice: 'bump slice',
        roster: [{ lens: 'correctness' }], taskType: 'gitlink-bump', declared: true },
    ],
  })
  const { out, calls } = await runPhase(bumpOnlyArgs, impl)

  // (a) escalated with unique reason token
  const esc = (out.escalated || []).find(e => e && e.task === 'tbump')
  assert.ok(esc, 'escalated must have an entry for the blocked bump worker (tbump)')
  assert.equal(esc.reason, 'escalate', 'blocked bump worker routes to reason:"escalate" (blockedReason predicate)')
  assert.equal(esc.blocked, 'bump-blocked-reason',
    'escalated entry must carry blocked:"bump-blocked-reason" (unique token from the blocked bump worker)')

  // (b) ZERO fix-workers dispatched after the early escalate
  const fixCalls = calls.filter(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit')
  assert.equal(fixCalls.length, 0,
    'a blocked bump worker must dispatch 0 fix-workers (early escalate, same path as initial-worker block)')

  // (b2) the bump worker prompt carries bump-specific context (new dispatch site, not generic worker)
  // Load-bearing: the 'GITLINK-BUMP' token only appears when the gitlink-bump dispatch branch runs.
  // Deleting the taskType==='gitlink-bump' branch causes the prompt to be the generic worker form, losing the token.
  const bumpWorkerCall = calls.find(c => isWorker(c) && /tbump/.test(c.opts.label || ''))
  assert.ok(bumpWorkerCall, 'a worker call is dispatched for the bump task (tbump)')
  assert.ok(bumpWorkerCall.prompt.includes('GITLINK-BUMP'),
    'the gitlink-bump worker prompt must include the "GITLINK-BUMP" dispatch-site token (not the generic worker form)')

  // (c) land held
  assert.equal(out.landDecision, 'held:escalation',
    'landDecision must be held:escalation when the bump worker blocks (escalate is a HARD reason)')
})

test('T4 #297 Test 4 — targetRepo/targetBase threaded into merge-task, land, worker, and Provision prompts for a submodule task', async () => {
  // The engine must carry targetRepo + targetBase from the submodule task into:
  //   (a) the merge-task prompt (so the refiner runs rebase/gate inside the submodule repo)
  //   (b) the land prompt (so the refiner knows the submodule target for 2A/2B)
  //   (c) the worker prompt (so the submodule-task worker is told its target repo)
  //   (d) the Provision prompt (so the refiner initializes the submodule checkout)
  //
  // Load-bearing: the unique token '/abs/submodule-checkout' only appears in these prompts when
  // the production code reads task.targetRepo. Deleting the threading causes each assertion to fail.
  const TARGET_REPO = '/abs/submodule-checkout'
  const TARGET_BASE = 'main'

  const capturedPrompts = {}
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    const label = opts.label || ''
    // Capture prompts keyed by label
    capturedPrompts[label] = prompt
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 'tsub', status: 'implemented', head_sha: 'abc123', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged', integration_sha: 'int-sha-001' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 5, target: 'tsub', learnings: [] }
    return {}
  }

  // Single submodule task (no gitlink-bump dep) so we reach land
  const args = SUBMOD_PHASE_ARGS({ tasks: [SUBMOD_PHASE_ARGS().tasks[0]] })
  const { calls } = await runPhase(args, impl)

  // (a) merge-task prompt carries targetRepo and targetBase
  const mergeCall = calls.find(c => isMergeTask(c) && /tsub/.test(c.opts.label || ''))
  assert.ok(mergeCall, 'a merge-task is dispatched for the submodule task (tsub)')
  assert.ok(mergeCall.prompt.includes(TARGET_REPO),
    `merge-task prompt must include targetRepo "${TARGET_REPO}" so the refiner runs merge cwd-scoped to the submodule`)
  assert.ok(mergeCall.prompt.includes(TARGET_BASE),
    `merge-task prompt must include targetBase "${TARGET_BASE}" for the submodule integration base`)

  // (b) land prompt carries targetRepo and targetBase
  const landCall = calls.find(isLand)
  assert.ok(landCall, 'a land dispatch is made (phase lands with the submodule task merged)')
  assert.ok(landCall.prompt.includes(TARGET_REPO),
    `land prompt must include targetRepo "${TARGET_REPO}" so the refiner knows the 2A/2B submodule target`)
  assert.ok(landCall.prompt.includes(TARGET_BASE),
    `land prompt must include targetBase "${TARGET_BASE}" for the 2A/2B submodule land`)

  // (c) worker prompt carries targetRepo
  const workerCall = calls.find(c => isWorker(c) && /tsub/.test(c.opts.label || ''))
  assert.ok(workerCall, 'a worker is dispatched for the submodule task (tsub)')
  assert.ok(workerCall.prompt.includes(TARGET_REPO),
    `worker prompt must include targetRepo "${TARGET_REPO}" so the submodule-task worker is told its target repo`)

  // (d) Provision (topology) prompt carries targetRepo
  const provCall = calls.find(c => isProvisionTopology(c))
  assert.ok(provCall, 'a topology Provision barrier is dispatched')
  assert.ok(provCall.prompt.includes(TARGET_REPO),
    `Provision prompt must include targetRepo "${TARGET_REPO}" so the refiner initializes the submodule checkout`)
})

// ---------------------------------------------------------------------------
// Task 3 (Phase 2 — ace-nit-autofix): the pre-merge --ace sub-loop
// STRICT TDD, CONTROL-FLOW-CRITICAL. One buildSeqImpl-driven case per criterion.
// The ace sub-loop sits at the TOP of the `if (r.verdict === 'approve')` branch, BEFORE the merge
// dispatch: a single ace-fix worker commits a nit fix, a fresh auditRound re-audits at the new sha,
// and on regression the merge dispatch forward-reverts (never escalates). `aced` is a return
// ATTRIBUTE — NO new MERGE_RESULT.status / HARD_ESCALATION_REASONS member (D6).
// ---------------------------------------------------------------------------

const isAce = (c) => seatOf(c.opts) === 'war-worker' && /^ace:/.test(c.opts.label || '')
// A single-task phase (no deps) so the ace sub-loop path is the only thing under test.
const ACE_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  run: { ace: true },
  ...over,
})
// A Minor/Nit finding shape the auditor emits. autoFixable + file drive aceEligible.
const nit = (over = {}) => ({ severity: 'Nit', title: 'tidy import', file: 'skills/war/assets/x.js',
  rationale: 'unused import', autoFixable: true, ...over })
// Auditor verdict carrying the given findings (default: one auto-fixable nit).
const approveWith = (label, findings) => ({ seat: label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' })
// Base impl for ace tests: provision ok, worker implemented, refiner merged/landed, servitor a result.
// The AUDITOR is intentionally NOT defaulted here — each test drives it via buildSeqImpl per label so
// the first (work-wave) round and the second (ace re-audit) round can differ.
const aceBase = (findingsFirstRound = [nit()]) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-auditor') return approveWith(opts.label, findingsFirstRound)
  if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

test('Task 3 — default-off: run.ace unset ⇒ no ace dispatch, an absorb nit demotes to follow-up (minorsFiled), aced empty', async () => {
  // run.ace omitted → absorb execution is unavailable (per-task ace AND sweep alike); the legacy
  // autoFixable nit reads as absorb and takes the logged demotion to follow-up (ADR 0013 ladder).
  const { out, calls, logs } = await runPhase(ACE_ARGS({ run: {} }), aceBase([nit()]))
  assert.ok(!calls.some(isAce), 'no ace worker is dispatched when run.ace is unset')
  const filed = (out.minorsFiled || []).find(m => m && m.task === 't1' && m.title === 'tidy import')
  assert.ok(filed, 'the absorb nit demotes to follow-up (minorsFiled) when --ace is off')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('tidy import')),
    'the --ace-off demotion is log()ged (never silent)')
  assert.ok(!out.aced || out.aced.length === 0, 'aced is empty/absent when run.ace is off')
  assert.ok(out.landed.includes('t1'), 't1 still lands on the default-off path')
})

test('Task 3 — eligibility gate: run.ace on ⇒ a legacy-autoFixable (absorb) nit dispatches an ace worker; an unflagged Nit routes to notes (severity default), never dispatched', async () => {
  // Two nits: one autoFixable (legacy absorb — aced), one without the flag (disposition omitted ⇒
  // Nit default 'note' under ADR 0013 routing). buildSeqImpl drives the auditor to approve+2-nits
  // on round 1, then approve-clean on the ace re-audit round.
  const flagged = nit({ title: 'aced nit', file: 'skills/war/assets/x.js' })
  const unflagged = nit({ title: 'plain nit', file: 'skills/war/assets/y.js', autoFixable: false })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [flagged, unflagged]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([flagged, unflagged]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const ace = calls.find(isAce)
  assert.ok(ace, 'an ace worker is dispatched for the autoFixable nit')
  assert.ok(ace.prompt.includes('aced nit'), 'the ace worker prompt lists the autoFixable finding')
  assert.ok(!ace.prompt.includes('plain nit'), 'the non-autoFixable nit is NOT handed to the ace worker')
  // the unflagged Nit routes to notes (severity default); the aced one is in neither list.
  const notedPlain = (out.notes || []).find(n => n && n.title === 'plain nit')
  assert.ok(notedPlain, 'the unflagged Nit routes to notes (omitted disposition ⇒ Nit → note)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'plain nit'), 'the unflagged Nit is NOT in minorsFiled (nothing defaults into an issue)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'aced nit'), 'the aced nit is NOT in minorsFiled')
})

test('Task 3 — re-audit at the new sha: after a successful ace-fix a fresh auditRound runs, then the merge dispatch follows it', async () => {
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit()]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([nit()]))
  const { calls } = await runPhase(ACE_ARGS(), impl)
  const aceIdx = calls.findIndex(isAce)
  assert.ok(aceIdx !== -1, 'an ace worker ran')
  // A re-audit (auditor seat) happens AFTER the ace worker and BEFORE the merge dispatch.
  const postAceAudit = calls.findIndex((c, i) => i > aceIdx && isAuditor(c))
  const mergeIdx = calls.findIndex(isMergeTask)
  assert.ok(postAceAudit !== -1, 'a fresh audit round runs after the ace-fix')
  assert.ok(postAceAudit < mergeIdx, 'the merge dispatch follows the re-audit (runs on the post-fix tip)')
  // Exactly one ace worker per task (single attempt).
  assert.equal(calls.filter(isAce).length, 1, 'exactly one ace worker dispatched (single attempt)')
})

test('Task 3 — never blocks a land via forward-revert: a regressing ace re-audit ⇒ merge prompt carries git revert, task lands, NOT escalated', async () => {
  // Re-audit round 2 returns a NEW Major (regression). The task must still land its approved work:
  // the merge dispatch prepends `git revert --no-edit <aceSha>` and the task appears in landed[],
  // in neither escalated[] nor with any hard reason.
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit()]),
                               { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
                                 confidence: 'high', findings: [{ severity: 'Major', title: 'ace broke it', file: 'x.js', rationale: 'regressed' }] }] },
    aceBase([nit()]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const merge = calls.find(isMergeTask)
  assert.ok(merge, 'a merge-task dispatch still happens (the approved work still lands)')
  assert.match(merge.prompt, /git\s+-C\b[^\n]*revert\s+--no-edit\s+deadbeef/,
    'the merge prompt prepends `git -C <worktree> revert --no-edit <aceSha>` on regression')
  assert.ok(out.landed.includes('t1'), 'the task still lands its originally-approved work')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), 't1 is NOT in escalated (never blocks a land)')
  assert.notEqual(out.landDecision, 'held:escalation', 'the ace regression does NOT hold the land')
})

test('Task 3 — release-slot refusal narrowed (criterion 1/2): plugin.json / marketplace.json absorb nits are never aced per-task — they route to the phase-close queue', async () => {
  // The two pure version-slot JSONs keep the hard string refusal; the refused absorb no longer
  // falls through to minorsFiled — it feeds the phase-close sweep (criterion 2). Without a config
  // default audit.roster the sweep skips fail-open and drains the queue to follow-up, so the
  // finding surfaces in minorsFiled ONLY via the logged demotion.
  for (const file of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']) {
    const slotNit = nit({ title: 'slot nit', file })
    const impl = buildSeqImpl(
      { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [slotNit]),
                                 approveWith('audit:t1:correctness', [])] },
      aceBase([slotNit]))
    const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
    assert.ok(!calls.some(isAce), `no ace worker for a release-slot nit (${file}) even with autoFixable:true`)
    assert.ok(!out.aced || !out.aced.some(a => a && a.finding && a.finding.title === 'slot nit'), `the release-slot nit (${file}) is NOT aced`)
    assert.ok(logs.some(l => typeof l === 'string' && l.includes('sweep skipped')),
      `the slot nit (${file}) reached the phase-close queue (sweep skipped without a default roster — fail-open drain)`)
    assert.ok((out.minorsFiled || []).some(m => m && m.title === 'slot nit'),
      `the drained slot nit (${file}) demotes to follow-up (never dropped silently)`)
  }
})

test('Task 3 — README.md absorb nit is NO LONGER refused (criterion 1): it aces per-task under run.ace', async () => {
  const readmeNit = nit({ title: 'readme nit', file: 'README.md' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [readmeNit]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([readmeNit]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const ace = calls.find(isAce)
  assert.ok(ace, 'an ace worker IS dispatched for a README.md absorb nit (routed, not refused)')
  assert.ok(ace.prompt.includes('readme nit'), 'the ace prompt lists the README finding')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'readme nit'), 'the README nit is aced')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'readme nit'), 'the README nit is NOT filed')
})

test('Task 3 — ponytail / no-flag refusal: a Nit without autoFixable/disposition (auditor own refusal) routes to notes, not aced', async () => {
  const plain = nit({ title: 'no flag', autoFixable: false })
  const { out, calls } = await runPhase(ACE_ARGS(), aceBase([plain]))
  assert.ok(!calls.some(isAce), 'no ace worker dispatched for a nit without autoFixable:true')
  assert.ok((out.notes || []).some(n => n && n.title === 'no flag'), 'the no-flag Nit routes to notes (severity default)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'no flag'), 'the no-flag Nit does NOT default into an issue')
})

test('Task 3 — budget single-attempt: ace dispatches at most once per task; a second attempt is not made (shares fixRounds)', async () => {
  // Even if the ace re-audit surfaces another autoFixable nit, ace runs ONCE — no re-ace loop.
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'first' })]),
                               approveWith('audit:t1:correctness', [nit({ title: 'second' })])] },
    aceBase([nit({ title: 'first' })]))
  const { calls } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 1, 'ace is dispatched at most once per task (single attempt, no re-ace)')
})

test('Task 3 — provenance aced list: an aced nit appears on return.aced with { task, finding, sha }, and is NOT in minorsFiled', async () => {
  const acedNit = nit({ title: 'aced me', file: 'skills/war/assets/z.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [acedNit]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([acedNit]))
  const { out } = await runPhase(ACE_ARGS(), impl)
  assert.ok(Array.isArray(out.aced), 'the return carries an aced array')
  const entry = out.aced.find(a => a && a.finding && a.finding.title === 'aced me')
  assert.ok(entry, 'the aced nit appears on the aced list')
  assert.equal(entry.task, 't1', 'aced entry carries the task id')
  assert.equal(entry.sha, 'deadbeef', 'aced entry carries the ace commit sha (head_sha)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'aced me'), 'the aced nit is NOT in minorsFiled')
})

test('Task 3 — no-enum-leak: no new MERGE_RESULT.status member and no new HARD_ESCALATION_REASONS member (aced is an attribute only)', () => {
  // MERGE_RESULT.status enum must be exactly the expected set (no 'aced'/'ace-reverted' member).
  // 'unpackaged' is the packaging-floor outcome added by the container-packaging plan (Task 2) —
  // mirroring 'no-test', a legitimate merge outcome, NOT an ace leak.
  const mMatch = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(mMatch, 'MERGE_RESULT status enum found')
  const statuses = JSON.parse(mMatch[1].replace(/'/g, '"'))
  assert.deepEqual(statuses.sort(),
    ['conflict', 'error', 'gate_failed', 'land_stale', 'landed', 'merged', 'no-test', 'unpackaged', 'submodule-blocked', 'submodule-pr'].sort(),
    'MERGE_RESULT.status enum is the expected set — no ace member leaked in (unpackaged is the packaging-floor outcome)')
  // HARD_ESCALATION_REASONS inline literal must be exactly the canonical 9 (no ace member).
  const hMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(hMatch, 'HARD_ESCALATION_REASONS found')
  const hard = JSON.parse(hMatch[1].replace(/'/g, '"'))
  assert.deepEqual(hard.sort(),
    ['audit-blocked', 'conflict', 'dep-failed', 'escalate', 'gate-evidence', 'land_stale', 'no-test', 'unpackaged', 'unrunnable-deps'].sort(),
    'HARD_ESCALATION_REASONS is the expected set — aced is a return attribute, not an escalation reason (unpackaged is a packaging-floor hard reason)')
})

// ---------------------------------------------------------------------------
// Variable audit roster (#434): per-task roster dispatch, per-seat depth,
// lone-seat auto-escalation widening (D4 auditor-nominated-or-default; D5 union), phase-start
// assertion (D8), and the gate-audit auto-skip on requiresTest:false (D7).
// ---------------------------------------------------------------------------

const ROSTER_TRIO = [
  { lens: 'correctness', depth: 'deep' },
  { lens: 'cascading-impact', depth: 'deep' },
  { lens: 'plan-faithfulness', depth: 'deep' },
]
const isRegularAudit = (c) => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:')

test('roster — per-seat depth threading: each seat auditPrompt carries its OWN depth token', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness', depth: 'deep' }, { lens: 'plan-faithfulness', depth: 'neighbors' }] },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const corr = calls.find(c => (c.opts.label || '') === 'audit:t1:correctness')
  const pf = calls.find(c => (c.opts.label || '') === 'audit:t1:plan-faithfulness')
  // Presence guards FIRST — a missing seat must fail here, not pass a vacuous lookup below.
  assert.ok(corr, 'a correctness seat was dispatched (presence guard)')
  assert.ok(pf, 'a plan-faithfulness seat was dispatched (presence guard)')
  assert.ok(corr.prompt.includes('"correctness" lens at depth deep'),
    'the correctness seat prompt carries ITS OWN depth (deep)')
  assert.ok(pf.prompt.includes('"plan-faithfulness" lens at depth neighbors'),
    'the plan-faithfulness seat prompt carries ITS OWN depth (neighbors)')
})

test('roster — omitted depth normalizes to deep (D2) in the emitted auditPrompt', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const corr = calls.find(c => (c.opts.label || '') === 'audit:t1:correctness')
  assert.ok(corr, 'a correctness seat was dispatched (presence guard)')
  assert.ok(corr.prompt.includes('at depth deep'), 'omitted depth must normalize to deep')
  assert.ok(!corr.prompt.includes('at depth undefined'), 'no undefined depth leaks into the audit prompt')
})

test('roster — seat count equals roster length: a 1-seat roster spawns exactly 1 audit agent', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const audits = calls.filter(isRegularAudit)
  assert.equal(audits.length, 1, 'exactly one audit seat for a 1-seat roster')
  assert.equal(audits[0].opts.label, 'audit:t1:correctness')
})

test('roster — seat count equals roster length: a 5-seat roster spawns 5 distinct-labelled audit agents', async () => {
  const FIVE = ['correctness', 'cascading-impact', 'plan-faithfulness', 'security', 'performance']
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: FIVE.map(l => ({ lens: l, depth: 'deep' })) },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const audits = calls.filter(isRegularAudit)
  assert.equal(audits.length, 5, 'exactly five audit seats for a 5-seat roster')
  const labels = audits.map(c => c.opts.label)
  assert.equal(new Set(labels).size, 5, 'the five audit:<task>:<lens> labels are DISTINCT (no modulo duplicates)')
  for (const l of FIVE) assert.ok(labels.includes(`audit:t1:${l}`), `label audit:t1:${l} present`)
})

test('roster — auto-escalate default fallback: a solo Critical with NO widen nomination convenes the trio-union roster (original lens once, defaults appended, ≤5)', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'security', depth: 'deep' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: true },
  })
  const impl = buildSeqImpl(
    { 'audit:t1:security': [
        // No `widen` field on the verdict → resolveWidenSource falls back to defaultRoster (trio union).
        { seat: 'audit:t1:security', lens: 'security', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Critical', title: 'lone-seat critical', file: 'a.js', rationale: 'bad' }] },
        { seat: 'audit:t1:security', lens: 'security', verdict: 'approve', findings: [], confidence: 'high' },
      ] },
    defaultImpl)
  const { out, calls, logs } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  assert.equal(labels.filter(l => l === 'audit:t1:security').length, 2,
    'the original security lens convenes once per round (kept once in the union, never duplicated)')
  for (const l of ['correctness', 'cascading-impact', 'plan-faithfulness']) {
    assert.equal(labels.filter(x => x === `audit:t1:${l}`).length, 1, `default lens ${l} appended exactly once (union)`)
  }
  assert.equal(new Set(labels).size, 4, '4 distinct seats total (1 + 3 defaults, ≤5)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('lone-seat widening') && l.includes('source: default fallback')),
    'the widening is narrated and names the fallback source (default fallback)')
  assert.ok(out.landed.includes('t1'), 'the widened panel approved and the task landed')
})

test('roster — autoEscalate:false: a solo Critical does NOT widen the roster', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'security', depth: 'deep' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: false },
  })
  const impl = buildSeqImpl(
    { 'audit:t1:security': [
        { seat: 'audit:t1:security', lens: 'security', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Critical', title: 'lone-seat critical', file: 'a.js', rationale: 'bad' }] },
        { seat: 'audit:t1:security', lens: 'security', verdict: 'approve', findings: [], confidence: 'high' },
      ] },
    defaultImpl)
  const { calls } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  assert.ok(labels.includes('audit:t1:security'), 'the solo seat convened (presence guard)')
  assert.ok(labels.every(l => l === 'audit:t1:security'),
    'no default lenses convene when autoEscalate is false (no widening)')
})

test('roster — lone-seat guard: a 2-seat roster at low confidence does NOT widen', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: true },
  })
  const lowMajor = (label, lens) => ({ seat: label, lens, verdict: 'request_changes', confidence: 'low',
    findings: [{ severity: 'Major', title: 'low-confidence major', file: 'a.js', rationale: 'unsure' }] })
  const approve = (label, lens) => ({ seat: label, lens, verdict: 'approve', findings: [], confidence: 'high' })
  const impl = buildSeqImpl(
    {
      'audit:t1:correctness': [lowMajor('audit:t1:correctness', 'correctness'), approve('audit:t1:correctness', 'correctness')],
      'audit:t1:security': [lowMajor('audit:t1:security', 'security'), approve('audit:t1:security', 'security')],
    },
    defaultImpl)
  const { calls } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  assert.ok(labels.includes('audit:t1:correctness') && labels.includes('audit:t1:security'),
    'both roster seats convened (presence guard)')
  assert.ok(!labels.includes('audit:t1:cascading-impact') && !labels.includes('audit:t1:plan-faithfulness'),
    'an approved multi-seat roster is never second-guessed (no union widening on a 2-seat roster)')
})

test('roster — auto-escalate nominated widening: a lone seat naming valid catalog lenses re-audits with THOSE seats @ deep + itself, log names "nominated"', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'security', depth: 'deep' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: true },
  })
  const impl = buildSeqImpl(
    { 'audit:t1:security': [
        // The lone seat NOMINATES catalog lenses via `widen`; resolveWidenSource accepts (distinct,
        // non-reserved) and widens toward performance+usability @ deep — NOT the trio default roster.
        { seat: 'audit:t1:security', lens: 'security', verdict: 'request_changes', confidence: 'low',
          widen: ['performance', 'usability'],
          findings: [{ severity: 'Critical', title: 'smells like a perf+ux issue', file: 'a.js', rationale: 'bad' }] },
        { seat: 'audit:t1:security', lens: 'security', verdict: 'approve', findings: [], confidence: 'high' },
      ] },
    defaultImpl)  // performance/usability seats auto-approve via defaultImpl
  const { out, calls, logs } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  // The nominated lenses convene; the trio defaults (correctness/cascading-impact/plan-faithfulness) do NOT.
  assert.equal(labels.filter(l => l === 'audit:t1:performance').length, 1, 'nominated performance lens convenes exactly once')
  assert.equal(labels.filter(l => l === 'audit:t1:usability').length, 1, 'nominated usability lens convenes exactly once')
  assert.equal(labels.filter(l => l === 'audit:t1:security').length, 2, 'the lone security seat is kept (once per round)')
  assert.ok(!labels.includes('audit:t1:cascading-impact') && !labels.includes('audit:t1:plan-faithfulness'),
    'the trio default roster does NOT convene under a valid nomination (nominated source, not fallback)')
  assert.equal(new Set(labels).size, 3, '3 distinct seats: security + performance + usability (nominated + kept)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('lone-seat widening') && l.includes('source: nominated')),
    'the widening is narrated and names the nominated source')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('source: default fallback')),
    'a valid nomination is NEVER logged as the default fallback')
  assert.ok(out.landed.includes('t1'), 'the widened panel approved and the task landed')
})

test('roster — auto-escalate strict fallback: a lone seat whose widen contains a RESERVED lens takes the trio-union path, log names "default fallback"', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'security', depth: 'deep' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: true },
  })
  const impl = buildSeqImpl(
    { 'audit:t1:security': [
        // One reserved lens ('pin-validity') among an otherwise-valid nomination → strict WHOLE-FIELD
        // reject → resolveWidenSource falls back to the trio default roster (no per-entry salvage).
        { seat: 'audit:t1:security', lens: 'security', verdict: 'request_changes', confidence: 'high',
          widen: ['performance', 'pin-validity'],
          findings: [{ severity: 'Critical', title: 'lone-seat critical', file: 'a.js', rationale: 'bad' }] },
        { seat: 'audit:t1:security', lens: 'security', verdict: 'approve', findings: [], confidence: 'high' },
      ] },
    defaultImpl)
  const { out, calls, logs } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  // Fallback → the TRIO convenes, the (otherwise-valid) 'performance' nomination is discarded whole-field.
  for (const l of ['correctness', 'cascading-impact', 'plan-faithfulness']) {
    assert.equal(labels.filter(x => x === `audit:t1:${l}`).length, 1, `trio default lens ${l} convenes (fallback)`)
  }
  assert.ok(!labels.includes('audit:t1:performance'),
    'the whole nomination is rejected — the valid "performance" entry is NOT salvaged when a reserved lens is present')
  assert.equal(new Set(labels).size, 4, '4 distinct seats: security + trio (fallback union), performance discarded')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('lone-seat widening') && l.includes('source: default fallback')),
    'a reserved-lens nomination is narrated as the default fallback')
  assert.ok(out.landed.includes('t1'), 'the fallback panel approved and the task landed')
})

test('roster — non-lone seat ignores widen: a 2-seat roster whose first seat emits widen does NOT widen', async () => {
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }] }],
    audit: { roster: ROSTER_TRIO, rosterPolicy: 'all', autoEscalate: true },
  })
  // Both seats low-confidence with widen nominations — but a MULTI-seat roster is never second-guessed,
  // so `widen` is honored ONLY on the lone-seat trigger and ignored here (harmless).
  const lowWithWiden = (label, lens) => ({ seat: label, lens, verdict: 'request_changes', confidence: 'low',
    widen: ['performance', 'usability'],
    findings: [{ severity: 'Critical', title: 'crit', file: 'a.js', rationale: 'bad' }] })
  const approve = (label, lens) => ({ seat: label, lens, verdict: 'approve', findings: [], confidence: 'high' })
  const impl = buildSeqImpl(
    {
      'audit:t1:correctness': [lowWithWiden('audit:t1:correctness', 'correctness'), approve('audit:t1:correctness', 'correctness')],
      'audit:t1:security': [lowWithWiden('audit:t1:security', 'security'), approve('audit:t1:security', 'security')],
    },
    defaultImpl)
  const { calls, logs } = await runPhase(args, impl)
  const labels = calls.filter(isRegularAudit).map(c => c.opts.label)
  assert.ok(labels.includes('audit:t1:correctness') && labels.includes('audit:t1:security'),
    'both roster seats convened (presence guard)')
  assert.ok(!labels.includes('audit:t1:performance') && !labels.includes('audit:t1:usability'),
    'a nominated widen on a NON-lone roster is ignored — no widening happens')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('lone-seat widening')),
    'no lone-seat widening is narrated for a multi-seat roster')
})

test('roster — widen is optional in AUDIT_VERDICT: it is NOT a required field', () => {
  // Prove `widen` is declared as a property but is NOT in AUDIT_VERDICT.required.
  const reqMatch = src.match(/const AUDIT_VERDICT = \{ type: 'object', required: (\[[^\]]*\])/)
  assert.ok(reqMatch, "AUDIT_VERDICT required[] not found")
  const required = JSON.parse(reqMatch[1].replace(/'/g, '"'))
  assert.ok(!required.includes('widen'), 'widen must NOT be in AUDIT_VERDICT.required (optional field)')
  assert.ok(/widen: \{ type: 'array', items: \{ type: 'string' \} \}/.test(src),
    'widen must be declared as an optional { type: array, items: string } property')
})

test('roster — phase-start assertion: duplicate lenses → held:workflow-error, never a clamped audit', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: [{ lens: 'correctness' }, { lens: 'correctness' }] },
  ] })
  const fn = build()
  const agentNeverCalled = async () => { throw new Error('agent must not be called when the roster assertion fails') }
  const out = await fn(agentNeverCalled, fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error',
    'a duplicate-lens roster must yield held:workflow-error (loud, not clamped)')
  assert.ok(out.workflowError && out.workflowError.message.includes('t1'), 'the error names the task')
  assert.match(out.workflowError.message, /duplicat/i, 'the error names the duplicate-lens violation')
})

test('roster — phase-start assertion: 6 entries → held:workflow-error (no truncation)', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
      roster: ['a', 'b', 'c', 'd', 'e', 'f'].map(l => ({ lens: l })) },
  ] })
  const fn = build()
  const agentNeverCalled = async () => { throw new Error('agent must not be called when the roster assertion fails') }
  const out = await fn(agentNeverCalled, fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error',
    'a 6-seat roster must yield held:workflow-error (no truncation)')
  assert.match(out.workflowError.message, /1-5/, 'the error names the 1-5 seat bound')
})

test('roster — phase-start assertion: a task with NO roster → held:workflow-error (no runtime default)', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1' },
  ] })
  const fn = build()
  const agentNeverCalled = async () => { throw new Error('agent must not be called when the roster assertion fails') }
  const out = await fn(agentNeverCalled, fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error',
    'an absent roster must yield held:workflow-error — no silent runtime default roster')
  assert.ok(out.workflowError.message.includes('t1'), 'the error names the task')
})

test('D7 — gate-audit auto-skip: a merged requiresTest:false task spawns NO gate-audit seat and the skip is logged', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false },
    { id: 't2', issue: 102, title: 'Code task', planSlice: 'slice 2', roster: [{ lens: 'correctness' }], requiresTest: true },
  ] })
  const { out, calls, logs } = await runPhase(args, gateAuditImpl)
  const ga = calls.filter(c => (c.opts.label || '').startsWith('gate-audit:'))
  assert.ok(ga.some(c => c.opts.label === 'gate-audit:t2:execution-evidence'),
    'the sibling requiresTest:true task IS gate-audited (presence guard)')
  assert.ok(!ga.some(c => (c.opts.label || '').startsWith('gate-audit:t1')),
    'no gate-audit seat spawns for the requiresTest:false task (HARD path vacuous by contract)')
  const skipLine = logs.find(l => typeof l === 'string' && l.includes('gate-audit: skipping t1'))
  assert.ok(skipLine, 'the narrator log carries the gate-audit skip line (never silent)')
  assert.ok(skipLine.includes('requiresTest:false'), 'the skip line names the requiresTest:false contract')
  assert.ok(out.landed.includes('t1') && out.landed.includes('t2'), 'both tasks still land')
})

test('D7 — gate-audit fail-closed: requiresTest ABSENT → the task IS gate-audited', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] })
  const { calls, logs } = await runPhase(args, gateAuditImpl)
  assert.ok(calls.some(c => c.opts.label === 'gate-audit:t1:execution-evidence'),
    'an absent requiresTest field stays fail-closed (gate-audited)')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('gate-audit: skipping')),
    'no skip line is logged when requiresTest is absent')
})

// ---------------------------------------------------------------------------
// Clean handoff (#441, ADR 0012/0013): disposition routing, phase-close sweep,
// dep-wave visibility, intent threading, end-state check, handoff block.
// ---------------------------------------------------------------------------

const workerMd = readFileSync(join(here, '../../../agents/war-worker.md'), 'utf8')
// A bare finding with NO autoFixable and NO disposition (severity default applies).
const bare = (over = {}) => ({ severity: 'Nit', title: 'bare', file: 'skills/war/assets/b.js', rationale: 'r', ...over })

// --- Disposition routing (criteria 1/2/3) ---

test('disposition defaults (criterion 3): omitted+Minor → minorsFiled, omitted+Nit → notes, absorb never defaulted', async () => {
  const minor = bare({ severity: 'Minor', title: 'minor default' })
  const nitF = bare({ severity: 'Nit', title: 'nit default' })
  const { out, calls } = await runPhase(ACE_ARGS(), aceBase([minor, nitF]))
  // run.ace is ON in ACE_ARGS — yet neither dispositionless finding aces (absorb is never a default).
  assert.ok(!calls.some(isAce), 'no ace dispatch for dispositionless findings even under run.ace (absorb never defaulted)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'minor default'), 'omitted+Minor → minorsFiled (follow-up default)')
  assert.ok(!(out.notes || []).some(n => n && n.title === 'minor default'), 'the Minor is not in notes')
  assert.ok((out.notes || []).some(n => n && n.title === 'nit default'), 'omitted+Nit → notes (note default)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'nit default'), 'the Nit does not default into an issue')
})

test('explicit dispositions route and override the severity default', async () => {
  const fu = bare({ severity: 'Nit', title: 'explicit follow-up', disposition: 'follow-up', rationale: 'needs new tests — beyond phase scope' })
  const nt = bare({ severity: 'Minor', title: 'explicit note', disposition: 'note' })
  const { out } = await runPhase(ACE_ARGS(), aceBase([fu, nt]))
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'explicit follow-up'), 'a Nit with disposition follow-up files (overrides its note default)')
  assert.ok((out.notes || []).some(n => n && n.title === 'explicit note'), 'a Minor with disposition note is noted (overrides its follow-up default)')
  assert.ok(!(out.notes || []).some(n => n && n.title === 'explicit follow-up'), 'no double-routing (follow-up not in notes)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'explicit note'), 'no double-routing (note not in minorsFiled)')
})

test('disposition:absorb (successor of legacy autoFixable) dispatches the ace worker under run.ace', async () => {
  const ab = bare({ title: 'absorb me', disposition: 'absorb' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [ab]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([ab]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  assert.ok(calls.some(isAce), 'disposition:absorb dispatches the ace worker (no autoFixable needed)')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'absorb me'), 'the absorb finding is aced')
})

test('AUDIT_VERDICT tightening: finding items require severity; disposition/phaseClose/autoFixable declared (autoFixable deprecated)', () => {
  const m = src.match(/findings:\s*\{\s*type:\s*'array',\s*items:\s*\{\s*type:\s*'object',\s*required:\s*\[([^\]]*)\]/)
  assert.ok(m, 'finding items carry a required array')
  assert.match(m[1], /'severity'/, "finding items required includes 'severity'")
  const dm = src.match(/disposition:\s*\{\s*enum:\s*(\[[^\]]*\])/)
  assert.ok(dm, 'disposition enum is declared on finding items')
  assert.deepEqual(JSON.parse(dm[1].replace(/'/g, '"')).sort(), ['absorb', 'follow-up', 'note'], 'disposition enum is absorb|follow-up|note')
  assert.match(src, /phaseClose:\s*\{\s*type:\s*'boolean'\s*\}/, 'phaseClose declared boolean')
  assert.match(src, /autoFixable:\s*\{\s*type:\s*'boolean'\s*\}/, 'autoFixable declared boolean')
  assert.match(src, /autoFixable is DEPRECATED/, 'the deprecation is documented at the schema literal')
})

test('aceEligible (criterion 1): regex is exactly the two version-slot JSONs and the f.file truthiness guard is KEPT', () => {
  assert.ok(src.includes('const aceEligible = f => f.file && !/(?:plugin\\.json|marketplace\\.json)$/.test(f.file)'),
    'aceEligible keeps the f.file guard and narrows the regex to plugin.json|marketplace.json')
  assert.ok(!src.includes('|README\\.md)$/'), 'README.md is no longer in the refusal regex')
})

// --- Terminal-disposition demotion ladder ---

test('demotion ladder: a fileless absorb takes the severity default (logged, never dropped)', async () => {
  const fMinor = { severity: 'Minor', title: 'fileless minor', rationale: 'r', disposition: 'absorb' }
  const fNit = { severity: 'Nit', title: 'fileless nit', rationale: 'r', disposition: 'absorb' }
  const { out, calls, logs } = await runPhase(ACE_ARGS(), aceBase([fMinor, fNit]))
  assert.ok(!calls.some(isAce), 'a fileless finding is never ace-eligible')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'fileless minor'), 'fileless absorb Minor → follow-up (severity default)')
  assert.ok((out.notes || []).some(n => n && n.title === 'fileless nit'), 'fileless absorb Nit → note (severity default)')
  assert.ok(logs.filter(l => typeof l === 'string' && l.includes('fileless absorb')).length >= 2, 'both demotions are log()ged')
})

test('demotion ladder: a blocked ace worker demotes the aceable findings to follow-up (logged); the task still lands', async () => {
  const ab = nit({ title: 'wanted absorb' })
  const impl = buildSeqImpl(
    { 'ace:t1:r1': [{ task_id: 't1', status: 'blocked', blocked_reason: 'boom' }] },
    aceBase([ab]))
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'wanted absorb'), 'failed absorb → follow-up')
  assert.ok(!(out.aced || []).some(a => a && a.finding && a.finding.title === 'wanted absorb'), 'the blocked-ace finding is NOT aced')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('failed absorb')), 'the demotion is log()ged')
  assert.ok(out.landed.includes('t1'), 'the approved work still lands (ace never blocks a land)')
})

test('demotion ladder: an ace re-audit regression demotes the aceable findings to follow-up (forward-revert arm, logged)', async () => {
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'regressed absorb' })]),
                               { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
                                 confidence: 'high', findings: [{ severity: 'Major', title: 'ace broke it', file: 'x.js', rationale: 'regressed' }] }] },
    aceBase([nit({ title: 'regressed absorb' })]))
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'regressed absorb'), 'the regressed absorb demotes to follow-up')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('forward-reverted')), 'the demotion log names the forward-revert')
})

test('demotion ladder: findings on a never-approved task demote to follow-up and file with the escalation (logged)', async () => {
  const impl = (prompt, opts) => {
    if (seatOf(opts) === 'war-auditor') {
      return { seat: opts.label, lens: 'correctness', verdict: 'escalate', escalate_reason: 'plan wrong', confidence: 'high',
        findings: [{ severity: 'Nit', title: 'nit on escalated task', rationale: 'r' }] }
    }
    return aceBase([])(prompt, opts)
  }
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.escalated || []).some(e => e && e.task === 't1'), 't1 escalated (presence guard)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'nit on escalated task'),
    'the Nit (note default) demotes to follow-up on the non-approve path — filed with the escalation')
  assert.ok(!(out.notes || []).some(n => n && n.title === 'nit on escalated task'), 'it does NOT land in notes')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('never reached the approve branch')), 'the demotion is log()ged')
})

// --- Dep-wave visibility (criterion 4) + force-with-lease carve-out ---

test('dep-wave visibility (criterion 4): rebase-first clause is PREPENDED iff deps non-empty (same-repo)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)   // t1 dep-less, t2 deps:['t1']
  const w1 = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:t1')
  const w2 = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:t2')
  assert.ok(w1 && w2, 'both workers dispatched (presence guard)')
  assert.ok(!w1.prompt.includes('DEPS ALREADY MERGED'), 'a dep-less task carries NO rebase-first clause (frozen phase base stands)')
  assert.ok(w2.prompt.startsWith('DEPS ALREADY MERGED'), 'the deps-bearing task PREPENDS the clause')
  assert.ok(w2.prompt.includes('git -C /abs/repo/.claude/worktrees/run-2026/p3-t2 rebase integration/wtprov-a/phase-3'),
    'the clause names the concrete rebase-first command')
  assert.match(w2.prompt, /status:"blocked"/, 'conflict → status:blocked')
  assert.match(w2.prompt, /NEVER resolve/, 'the worker never resolves the conflict')
})

test('dep-wave visibility: a gitlink-bump task with deps gets NO rebase-first clause (cross-repo dep — taskType scoping)', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tsub', issue: 301, title: 'Sub task', planSlice: 's1', roster: [{ lens: 'correctness' }],
      taskType: 'submodule', targetRepo: 'vendor/lib', targetBase: 'main' },
    { id: 'tbump', issue: 302, title: 'Bump task', planSlice: 's2', roster: [{ lens: 'correctness' }],
      taskType: 'gitlink-bump', deps: ['tsub'] },
  ] })
  const { calls } = await runPhase(args, defaultImpl)
  const wb = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:tbump')
  assert.ok(wb, 'the gitlink-bump worker dispatched (presence guard)')
  assert.ok(!wb.prompt.includes('DEPS ALREADY MERGED'),
    'a gitlink-bump task is EXCLUDED — its dep merged into the submodule repo, not this integration branch')
})

test('force-with-lease carve-out: IDENTICAL wording in agents/war-worker.md and the dispatched dep clause', async () => {
  const RULE = 'You may `git push --force-with-lease` ONLY your own task branch, and ONLY after a dispatch-rebase diverged it from its pushed remote — never any other ref, never for any other reason.'
  assert.ok(workerMd.includes(RULE), 'war-worker.md carries the canonical carve-out sentence (standing surface)')
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w2 = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:t2')
  assert.ok(w2, 'the deps-bearing worker dispatched (presence guard)')
  assert.ok(w2.prompt.includes(RULE), 'the dispatched dep clause carries the SAME sentence byte-for-byte')
})

// --- Auditor surfaces (criterion 8): latitude + disposition rules on BOTH surfaces ---

test('latitude + disposition rules (criterion 8): war-auditor.md AND auditPrompt carry the same rule sentences', async () => {
  const LATITUDE = "the plan slice is the floor, the Commander's Intent is the ceiling — intent-consistent work beyond the literal slice is APPROVE (judge it on its own correctness), never a plan-faithfulness violation; only deviations that contradict the intent or the slice block. No intent threaded means judge against the plan slice alone, as before."
  const DISPO = 'every Minor/Nit finding carries a disposition — absorb (mechanical, intent-consistent, safe to fix this phase; set phaseClose:true when the fix needs the integrated tip or touches a shared/slot-adjacent file), follow-up (substantive work beyond this phase — MUST state why it is not absorbable), or note (informational; phase report + servitor feed, never an issue). Omitted disposition defaults: Minor becomes follow-up, Nit becomes note; absorb is never a default.'
  assert.ok(auditorMd.includes(LATITUDE), 'war-auditor.md carries the latitude rule (standing surface)')
  assert.ok(auditorMd.includes(DISPO), 'war-auditor.md carries the disposition rule (standing surface)')
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  assert.ok(a.prompt.includes(LATITUDE), 'auditPrompt carries the latitude rule (dispatched surface)')
  assert.ok(a.prompt.includes(DISPO), 'auditPrompt carries the disposition rule (dispatched surface)')
})

// The shared mid-sentence fragments are byte-identical across the two surfaces; only the heading
// case differs (CALIBRATION RULE / Calibration rule). Anchor on the shared body so the test is
// case-tolerant per the prompt-only-clause-grep lesson. Each assertion fails if EITHER surface
// drops the sentence.
const CALIBRATION_SHARED = 'judge on evidence only — never soften, downgrade, or drop a finding because peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in the current diff. The pull to soften peaks right after your own finding is challenged — that is the highest-risk moment.'
const COST_CLAIM_SHARED = 'a finding justified by a cost — "too slow", "too expensive", "too complex" — must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost claim caps the finding at Minor.'

test('calibration + cost-claim rules (spec §4.1/§4.2): war-auditor.md AND initial-round auditPrompt carry the same rule sentences', async () => {
  assert.ok(auditorMd.includes(CALIBRATION_SHARED), 'war-auditor.md carries the calibration rule (standing surface)')
  assert.ok(auditorMd.includes(COST_CLAIM_SHARED), 'war-auditor.md carries the cost-claim rule (standing surface)')
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  assert.ok(a.prompt.includes(CALIBRATION_SHARED), 'initial auditPrompt carries the calibration rule (dispatched surface)')
  assert.ok(a.prompt.includes(COST_CLAIM_SHARED), 'initial auditPrompt carries the cost-claim rule (dispatched surface)')
})

test('calibration + cost-claim rules (spec §4.1/§4.2): the REBUTTAL-round auditPrompt also carries both rules (base-prompt coverage)', async () => {
  // A split two-seat panel (one approve, one request_changes) forces a rebuttal-round re-dispatch of
  // auditPrompt with peers; the rules live in the always-present base prompt, so the rebuttal seats
  // must carry them too.
  const impl = (prompt, opts) => {
    if (seatOf(opts) === 'war-auditor') {
      return (opts.label || '').includes('security')
        ? { seat: opts.label, lens: 'security', verdict: 'request_changes', confidence: 'high',
            findings: [{ severity: 'Major', title: 'split me', file: 'a.js', rationale: 'because' }] }
        : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    return defaultImpl(prompt, opts)
  }
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }, { lens: 'security' }] },
  ] }), impl)
  const rebuttal = calls.filter(isAuditor).find(c => c.prompt.includes('REBUTTAL ROUND'))
  assert.ok(rebuttal, 'a rebuttal-round auditPrompt was dispatched (presence guard)')
  assert.ok(rebuttal.prompt.includes(CALIBRATION_SHARED), 'rebuttal-round auditPrompt carries the calibration rule')
  assert.ok(rebuttal.prompt.includes(COST_CLAIM_SHARED), 'rebuttal-round auditPrompt carries the cost-claim rule')
})

// Task 1.4 — Stale-looking-but-correct calibration (spec criterion 4/5, ADR 0030): the four rule
// bodies live in agents/war-auditor.md AND are mirrored into auditPrompt(). Anchor on ONE
// casing/position-stable MID-SENTENCE phrase per rule (never a quote/backtick-bearing byte literal —
// shared-string-constant-quote-literal-byte-anchor-fragility) and assert it on BOTH surfaces, so the
// test fails if EITHER surface drops a rule. Plus a floor-lock: each rule retains its
// "only when the live artifact confirms" qualifier (guards the amnesty floor against silent widening).
const CALIBRATION_RULE_ANCHORS = [
  /diverging from the candidate on a line range/i,          // rule 1 — literal-vs-candidate drift
  /a reference dangling at a task tip/i,                     // rule 2 — dangling cross-slice ref
  /naming a file the diff never touches/i,                  // rule 3 — untouched plan file-list entry
  /a grep sweep is a floor, not a ceiling/i,                // rule 4 — grep-sweep floor
]

test('stale-looking-but-correct calibration (Task 1.4): war-auditor.md AND auditPrompt carry all four rule anchors', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  for (const re of CALIBRATION_RULE_ANCHORS) {
    assert.match(auditorMd, re, `war-auditor.md carries calibration rule ${re} (standing surface)`)
    assert.match(a.prompt, re, `auditPrompt carries calibration rule ${re} (dispatched surface)`)
  }
})

test('stale-looking-but-correct calibration (Task 1.4): the "only when the live artifact confirms" qualifier survives per rule on BOTH surfaces', async () => {
  // One qualifier occurrence per rule (four) locks the confirmation floor — a silent widening into
  // unconditional amnesty would drop these and fail here.
  const QUALIFIER = /only when the live artifact confirms/gi
  assert.ok((auditorMd.match(QUALIFIER) || []).length >= 4,
    'war-auditor.md carries the confirmation qualifier at least once per rule (>= 4)')
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  assert.ok((a.prompt.match(QUALIFIER) || []).length >= 4,
    'auditPrompt carries the confirmation qualifier at least once per rule (>= 4)')
})

// --- Intent threading (criterion 10) ---

test('intent absent (criterion 10): no intent block anywhere; intent:null and intent-absent runs are byte-identical', async () => {
  const { calls: absent } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const { calls: nulled } = await runPhase(PROVISION_ARGS({ intent: null }), defaultImpl)
  assert.equal(absent.length, nulled.length, 'same dispatch count')
  for (let i = 0; i < absent.length; i++) {
    assert.equal(absent[i].prompt, nulled[i].prompt, `prompt #${i} is byte-identical between intent-absent and intent:null`)
  }
  for (const c of absent) {
    assert.ok(!c.prompt.includes("COMMANDER'S INTENT"), 'no intent block leaks when intent is absent')
  }
  // F2 (#452): absence must equal the real pre-intent bytes, not a vacuous empty prompt — the
  // worker prompt still carries a known stable substring that exists independently of intent.
  const worker = absent.find(isWorker)
  assert.ok(worker, 'worker dispatched (presence guard)')
  assert.ok(worker.prompt.includes('ALREADY-PROVISIONED worktree'),
    'the intent-absent worker prompt carries the stable pre-intent substring')
})

test('intent present: threaded into worker, auditor, ace, gate-audit and servitor prompts; handoff.intentPresent true', async () => {
  const INTENT = 'Purpose: ship the wibble.\nEnd state: 1. wibble shipped.'
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'intent nit' })]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([nit({ title: 'intent nit' })]))
  const { out, calls } = await runPhase(ACE_ARGS({ intent: INTENT }), impl)
  const worker = calls.find(c => (c.opts.label || '') === 'work:t1')
  assert.ok(worker, 'worker dispatched (presence guard)')
  assert.ok(worker.prompt.includes("COMMANDER'S INTENT") && worker.prompt.includes('ship the wibble'), 'worker prompt carries the intent block')
  assert.ok(worker.prompt.includes('intent-consistent deviation is in-band — note it in your result'), 'worker prompt carries the licensed-judgment sentence')
  const auditor = calls.find(c => (c.opts.label || '') === 'audit:t1:correctness')
  assert.ok(auditor && auditor.prompt.includes('ship the wibble'), 'auditPrompt carries the intent')
  const ace = calls.find(isAce)
  assert.ok(ace && ace.prompt.includes('ship the wibble'), 'the ace dispatch carries the intent')
  const ga = calls.filter(c => (c.opts.label || '').startsWith('gate-audit:'))
  assert.ok(ga.length > 0 && ga.every(c => c.prompt.includes('ship the wibble')), 'the gate-audit pass carries the intent')
  const servitor = calls.find(isServitor)
  assert.ok(servitor && servitor.prompt.includes('ship the wibble'), 'the servitor wrap-up carries the intent')
  assert.ok(out.handoff && out.handoff.intentPresent === true, 'handoff.intentPresent is true')
})

test('servitor wrap-up gains the notes array — memory candidates, not issues', async () => {
  const noteF = bare({ title: 'memory candidate' })   // Nit, no disposition → note
  const { calls } = await runPhase(ACE_ARGS(), aceBase([noteF]))
  const s = calls.find(isServitor)
  assert.ok(s, 'servitor dispatched (presence guard)')
  assert.ok(s.prompt.includes('memory candidate'), 'the noted finding reaches the servitor prompt')
  assert.match(s.prompt, /MEMORY CANDIDATES, not issues/, 'notes are framed as memory candidates, not issues')
})

// --- args.memory prior-lessons threading (memory-sqlite-substrate T4, spec §4.5, criterion 10) ---
// The Lead prefetches per-seat lesson blocks and threads them as args.memory
// ({ byTask: {<id>: {worker, seats:{<lens>:block}}}, servitor }). The template concatenates a
// memoryClause at FIVE sites (worker, auditor, fix-worker, add-test, servitor) — following the
// intentClause pattern — and at NONE of ace/gate-audit/polish/refiner. Distinctive sentinels per
// site let each assertion target exactly the intended prompt.
const WORKER_MEM = 'PRIOR-LESSONS-WORKER-t1 [wm1] (code-verified): implementer pitfall block'
const AUDIT_MEM  = 'PRIOR-LESSONS-AUDITOR-t1-correctness [am1] (agent-unverified): lens lesson block'
const SERV_MEM   = 'PRIOR-LESSONS-SERVITOR [sm1] (code-verified): memory dedup capture block'
const MEMORY_MAP = { byTask: { t1: { worker: WORKER_MEM, seats: { correctness: AUDIT_MEM } } }, servitor: SERV_MEM }

test('memory: worker, auditor and servitor prompts carry their prefetched lesson block (5-site coverage 1/2)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS({ memory: MEMORY_MAP, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] }), defaultImpl)
  const worker = calls.find(c => (c.opts.label || '') === 'work:t1')
  assert.ok(worker && worker.prompt.includes(WORKER_MEM), 'worker prompt carries its worker memory block')
  const auditor = calls.find(c => (c.opts.label || '') === 'audit:t1:correctness')
  assert.ok(auditor && auditor.prompt.includes(AUDIT_MEM), 'auditor prompt carries its per-lens memory block')
  const servitor = calls.find(isServitor)
  assert.ok(servitor && servitor.prompt.includes(SERV_MEM), 'servitor wrap-up carries the phase servitor memory block')
})

test('memory: fix-worker (FIX_NEEDED) prompt carries the worker lesson block — NEW injection point (5-site 2/2a)', async () => {
  // Block-then-approve the sole seat so a FIX_NEEDED fix-worker is dispatched.
  let auditN = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return ++auditN <= 1
      ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Major', title: 'fix me', file: 'a.js', rationale: 'because' }] }
      : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    return defaultImpl(prompt, opts)
  }
  const { calls } = await runPhase(PROVISION_ARGS({ memory: MEMORY_MAP, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const fix = calls.find(isFixWorker)
  assert.ok(fix, 'a fix-worker was dispatched on the blocking finding')
  assert.ok(fix.prompt.includes(WORKER_MEM), 'FIX_NEEDED fix-worker prompt carries the worker memory block (new injection point)')
})

test('memory: add-test worker prompt carries the worker lesson block — NEW injection point (5-site 2/2b)', async () => {
  // no-test merge result → add-test fix-worker; then approve+merge+land. Mirror the M2 no-test harness:
  // requiresTest:true task, refiner merge gated on phase 'Refine'.
  let mergeN = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return ++mergeN === 1
      ? { mode: 'merge-task', status: 'no-test' }
      : { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(PROVISION_ARGS({ memory: MEMORY_MAP, tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: true },
  ] }), impl)
  const addTest = calls.find(isAddTestWorker)
  assert.ok(addTest, 'an add-test worker was dispatched on the no-test result')
  assert.ok(addTest.prompt.includes(WORKER_MEM), 'add-test worker prompt carries the worker memory block (new injection point)')
})

test('memory: ace / gate-audit / refiner get NO memoryClause (criterion 10 temp-break)', async () => {
  // The ace harness lands + wraps and also spawns gate-audit + refiner merge/land seats. NONE of the
  // three prospective memory sentinels may leak into those prompts.
  const { calls } = await runPhase(ACE_ARGS({ memory: MEMORY_MAP }),
    aceBase([nit({ title: 'absorb me' })]))
  const ace = calls.find(isAce)
  assert.ok(ace, 'an ace worker was dispatched (presence guard)')
  const leak = s => s.includes(WORKER_MEM) || s.includes(AUDIT_MEM) || s.includes(SERV_MEM)
  assert.ok(!leak(ace.prompt), 'ace prompt carries NO memory block')
  const ga = calls.filter(c => (c.opts.label || '').startsWith('gate-audit:'))
  assert.ok(ga.length > 0, 'a gate-audit pass ran (presence guard)')
  assert.ok(ga.every(c => !leak(c.prompt)), 'no gate-audit prompt carries a memory block')
  const refiners = calls.filter(c => seatOf(c.opts) === 'war-refiner')
  assert.ok(refiners.every(c => !leak(c.prompt)), 'no refiner (provision/merge/land) prompt carries a memory block')
})

test('memory: polish sweep worker gets NO memoryClause (criterion 10 temp-break)', async () => {
  // Drive a phase-close queue so the sweep worker fires; assert no memory sentinel leaks into it.
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [{ severity: 'Minor', title: 'shared', file: 'README.md', rationale: 'r', disposition: 'absorb', phaseClose: true }]),
                               approveWith('audit:t1:correctness', [])] },
    sweepBase([]))
  const { calls } = await runPhase(SWEEP_ARGS({ memory: MEMORY_MAP, run: { ace: true } }), impl)
  const sweep = calls.find(c => /^polish:/.test(c.opts.label || '') && seatOf(c.opts) === 'war-worker')
  assert.ok(sweep, 'a polish sweep worker was dispatched (presence guard)')
  assert.ok(!(sweep.prompt.includes(WORKER_MEM) || sweep.prompt.includes(AUDIT_MEM) || sweep.prompt.includes(SERV_MEM)),
    'polish sweep prompt carries NO memory block')
})

test('memory: empty/absent map ⇒ prompts byte-identical to a memory-less run (criterion 10)', async () => {
  const { calls: absent } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const { calls: emptyMap } = await runPhase(PROVISION_ARGS({ memory: { byTask: {}, servitor: '' } }), defaultImpl)
  assert.equal(absent.length, emptyMap.length, 'same dispatch count')
  for (let i = 0; i < absent.length; i++) {
    assert.equal(absent[i].prompt, emptyMap[i].prompt, `prompt #${i} byte-identical between memory-absent and empty-map`)
  }
  // And the always-present worker self-query line does not by itself introduce a memory block.
  const w = absent.find(isWorker)
  assert.ok(w && !w.prompt.includes('PRIOR-LESSONS'), 'memory-absent worker prompt carries no lesson block')
})

test('memory: worker self-query line present in dispatched prompt AND mirrored in war-worker.md (both surfaces)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w = calls.find(isWorker)
  assert.ok(w, 'worker dispatched (presence guard)')
  // The canonical self-query sentence — same core clause in both surfaces.
  const CORE = "skills/_shared/war-memory.mjs query '<terms>'"
  assert.ok(w.prompt.includes(CORE), 'dispatched worker prompt carries the may-run-CLI self-query line')
  const workerMd = readFileSync(join(here, '../../../agents/war-worker.md'), 'utf8')
  assert.ok(workerMd.includes(CORE), 'agents/war-worker.md mirrors the self-query line (standing surface)')
  // The self-query line is NOT gated by intent/memory — it is byte-stable regardless of args.memory.
})

// learnings-read-path plan T1: the worker self-query example carries `--repo <resolved repo root>`
// when the run threads a repo root (learningsTarget), so a worker's mid-task query walks the published
// corpus and not just the local root. Absent a threaded root the line stays byte-identical to today.
test('memory: worker self-query line carries --repo <resolved root> when a repo root is threaded (T1)', async () => {
  const REPO_ROOT = '/abs/repo/docs/learnings'
  const { calls } = await runPhase(PROVISION_ARGS({ learningsTarget: REPO_ROOT }), defaultImpl)
  const w = calls.find(isWorker)
  assert.ok(w, 'worker dispatched (presence guard)')
  // (a) the resolved root appears via the --repo flag on the self-query invocation.
  assert.ok(w.prompt.includes(`query '<terms>' --repo ${REPO_ROOT}`),
    'dispatched worker self-query line interpolates --repo <resolved repo root>')
  // Delete-the-feature: dropping the interpolation (fragment always '') makes the exact --repo
  // substring vanish, so this assertion is what fails if the emission is reverted.
})

test('memory: worker self-query line is byte-identical to the pre-feature baseline when no repo root is threaded (T1)', async () => {
  // (b) learningsTarget absent (null) ⇒ no --repo fragment, and the sentence equals the canonical form.
  const { calls } = await runPhase(PROVISION_ARGS({ learningsTarget: null }), defaultImpl)
  const w = calls.find(isWorker)
  assert.ok(w, 'worker dispatched (presence guard)')
  assert.ok(!w.prompt.includes('--repo'), 'no --repo fragment when no repo root is threaded')
  const CANONICAL = "You MAY run `node <plugin>/skills/_shared/war-memory.mjs query '<terms>'` mid-task when you hit something unfamiliar — it never writes a lesson, and without a `--local` root it appends no query log (the CLI never guesses one from the cwd)."
  assert.ok(w.prompt.includes(CANONICAL),
    'absent a repo root the self-query line is byte-identical to the pre-feature sentence')
})

test('criterion 11 — ServitorResult schema no longer carries memory_index_updated', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const servitor = calls.find(isServitor)
  assert.ok(servitor && servitor.opts.schema, 'servitor spawn carries a schema')
  const props = servitor.opts.schema.properties || {}
  assert.ok(!('memory_index_updated' in props),
    'SERVITOR_RESULT.properties must not carry memory_index_updated (index maintenance moved to render-index)')
  // The surviving shape still requires phase/target/learnings.
  assert.deepEqual(servitor.opts.schema.required, ['phase', 'target', 'learnings'],
    'ServitorResult still requires phase/target/learnings')
  // Source-text guard: the field name is gone from the template entirely.
  assert.ok(!/memory_index_updated\s*:/.test(src),
    'workflow-template.js no longer defines a memory_index_updated schema property')
})

// --- Phase-close coherence sweep (criteria 2 + 5, ADR 0012) ---

// Sweep harness: run.ace on (absorb execution rides it) + a config default audit.roster (the
// sweep's mandatory full panel — Open decision 1). Single task t1 keeps the flow observable.
const SWEEP_ARGS = (over = {}) => ACE_ARGS({ audit: { roster: [{ lens: 'correctness' }] }, ...over })
// Base impl: the t1 work-round audit emits `queued`; gate-audit and the polish panel approve clean.
const sweepBase = (queued) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  // The phase-close polish worktree provisioning now returns the env-outcome shape.
  if (seat === 'war-refiner' && /^polish-worktree:/.test(opts.label || '')) return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented',
    head_sha: (opts.label || '').startsWith('polish:') ? 'polishsha' : 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-auditor') {
    const label = opts.label || ''
    const f = label.includes(':t1:') && !label.startsWith('gate-audit:') ? queued : []
    return { seat: label, lens: 'correctness', verdict: 'approve', findings: f, confidence: 'high' }
  }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', working_sha: 'abcdef99' }
    : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const queuedAbsorb = () => nit({ title: 'dangling link', file: 'docs/x.md', disposition: 'absorb', phaseClose: true })

test('phase-close sweep (criteria 2+5): phaseClose absorb → queue → sweep on a would-land phase; re-approved polish merges at the queue tail before the land', async () => {
  const { out, calls } = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  // 1. provisioning via the existing ensure-worktree at the integrated tip
  const prov = calls.find(c => (c.opts.label || '') === 'polish-worktree:phase-3')
  assert.ok(prov, 'the polish worktree is provisioned (presence guard)')
  assert.ok(prov.prompt.includes('ensure-worktree /abs/repo/.claude/worktrees/run-2026/p3-polish war/wtprov-a/p3-polish'),
    'existing ensure-worktree subcommand, p<N>-polish path, war/<slug>/p<N>-polish branch')
  // 2. ONE worker dispatch: queued findings verbatim + the sweep charter constraints
  const pw = calls.find(c => (c.opts.label || '') === 'polish:phase-3')
  assert.ok(pw, 'ONE sweep worker is dispatched')
  assert.ok(pw.prompt.includes('dangling link'), 'the queued finding is handed over verbatim')
  assert.match(pw.prompt, /NEVER touch version\/release-slot literals/, 'version-slot literals are off-limits')
  assert.match(pw.prompt, /EXACTLY ONE commit/, 'one commit only')
  assert.match(pw.prompt, /NO ad-hoc seam hunting/, 'queue-only discovery model')
  assert.ok(pw.prompt.includes('slice 1'), "the merged tasks' plan slices ride along")
  // 3. full default-roster panel re-audit at the polish sha
  assert.ok(calls.some(c => (c.opts.label || '') === 'audit:p3-polish:correctness'),
    'the config-default roster panel re-audits the polish')
  // 4. merge at the serial queue tail, BEFORE the single land dispatch
  const mergeIdx = calls.findIndex(c => (c.opts.label || '') === 'merge:p3-polish')
  const landIdx = calls.findIndex(isLand)
  assert.ok(mergeIdx !== -1, 'the refiner merges the re-approved polish')
  assert.ok(landIdx !== -1 && mergeIdx < landIdx, 'the polish merge precedes the single land (land proceeds on the polished tip)')
  // bookkeeping: absorbed at the polish sha; nothing defaults into an issue
  assert.equal(out.handoff.polish, 'merged')
  assert.ok(out.handoff.absorbed.some(a => a && a.sha === 'polishsha' && (a.findings || []).includes('dangling link')),
    'the queued finding is absorbed at the polish sha')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'dangling link'), 'the absorbed finding is not filed')
  assert.ok(out.landed.includes('t1'), 't1 landed')
})

test('phase-close sweep discard (criterion 5): a rejected polish is DISCARDED — never merged, land proceeds on the pre-polish tip, queue demotes to follow-up', async () => {
  const impl = buildSeqImpl(
    { 'audit:p3-polish:correctness': [{ seat: 'p', lens: 'correctness', verdict: 'request_changes', confidence: 'high',
        findings: [{ severity: 'Major', title: 'sweep broke it', file: 'docs/x.md', rationale: 'r' }] }] },
    sweepBase([queuedAbsorb()]))
  const { out, calls, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.ok(calls.some(c => (c.opts.label || '') === 'polish:phase-3'), 'the sweep worker ran (presence guard)')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'merge:p3-polish'), 'a rejected polish is NEVER merged')
  assert.ok(calls.some(isLand), 'the land still dispatches — a discarded sweep never blocks the land')
  assert.equal(out.landDecision, 'landed', 'the phase lands on the pre-polish tip')
  assert.equal(out.handoff.polish, 'discarded', 'the handoff records the discard')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'dangling link'), 'the queued finding demotes to follow-up (stays routed)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('DISCARDED')), 'the discard is log()ged (branch + worktree left in place)')
  const discardEntry = (out.auditLog || []).find(e => e && e.verdict === 'polish-discarded')
  assert.ok(discardEntry && discardEntry.branch === 'war/wtprov-a/p3-polish', 'the polish branch name is recorded (reaping is a human act)')
})

test('phase-close sweep: a held phase never dispatches the sweep — queue drains to follow-up; handoff degrades with polish:skipped', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'conflict' }
    return sweepBase([queuedAbsorb()])(prompt, opts)
  }
  const { out, calls, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation', 'the merge conflict holds the phase (presence guard)')
  assert.ok(!calls.some(c => (c.opts.label || '').startsWith('polish')), 'no polish dispatches on a held phase')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'dangling link'), 'the queue drains to follow-up (never dropped)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('draining')), 'the held-phase drain is log()ged')
  assert.ok(out.handoff, 'handoff still emitted on held:escalation (degraded)')
  assert.equal(out.handoff.polish, 'skipped')
})

test('phase-close sweep: an empty queue skips the sweep entirely — polish:skipped, zero polish dispatches', async () => {
  const { out, calls } = await runPhase(SWEEP_ARGS(), sweepBase([]))
  assert.ok(!calls.some(c => (c.opts.label || '').startsWith('polish')), 'no polish dispatches with an empty queue')
  assert.equal(out.handoff.polish, 'skipped')
})

test('phase-close sweep: the sweep dispatch carries the intent when present', async () => {
  const { calls } = await runPhase(SWEEP_ARGS({ intent: 'Purpose: wibble.' }), sweepBase([queuedAbsorb()]))
  const pw = calls.find(c => (c.opts.label || '') === 'polish:phase-3')
  assert.ok(pw, 'sweep worker dispatched (presence guard)')
  assert.ok(pw.prompt.includes('Purpose: wibble.'), 'the sweep prompt carries the intent')
})

// --- End-state check (criterion 11) ---

const ES_CONDS = ['condition A: the wibble exists at the tip', 'condition B: later-phase thing']
const ES_ARGS = (over = {}) => PROVISION_ARGS({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ES_CONDS },
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
// Gate-audit seats return `findings`; everything else rides gateAuditImpl.
const esImpl = (findings) => (prompt, opts) => {
  if ((opts.label || '').startsWith('gate-audit:')) {
    const hard = findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
    return { seat: opts.label, lens: 'execution-evidence', verdict: hard ? 'request_changes' : 'approve', confidence: 'high', findings }
  }
  return gateAuditImpl(prompt, opts)
}

test('end-state check rides the gate-audit prompt (criterion 11): three cases + verbatim plan_ref keying', async () => {
  const { calls } = await runPhase(ES_ARGS(), gateAuditImpl)
  const ga = gateAuditCalls(calls)
  assert.ok(ga.length > 0, 'gate-audit dispatched (presence guard)')
  const p = ga[0].prompt
  assert.match(p, /END-STATE CHECK \(phase-scoped\)/, 'the end-state block rides the gate-audit prompt')
  assert.ok(p.includes('condition A: the wibble exists at the tip'), 'the claimed conditions are enumerated')
  assert.match(p, /provably UNMET[\s\S]*CONFIRMED integration tip[\s\S]*Critical\/Major/, 'case 1: provably-unmet at the confirmed tip → HARD')
  assert.match(p, /cannot verify[\s\S]*SOFT note/, 'case 2: unverifiable/tip-unconfirmable → SOFT')
  assert.match(p, /LATER phase[\s\S]*out-of-scope[\s\S]*NEVER a hold/, 'case 3: later-phase condition → out-of-scope, never a hold')
  assert.match(p, /plan_ref[\s\S]*VERBATIM/, 'findings key on the condition text via plan_ref')
})

test('end-state check: NO claims ⇒ the gate-audit prompt carries no end-state block (byte-compatible)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  const ga = gateAuditCalls(calls)
  assert.ok(ga.length > 0, 'gate-audit dispatched (presence guard)')
  for (const c of ga) assert.ok(!c.prompt.includes('END-STATE CHECK'), 'no end-state block without claims')
})

test('end-state HARD case (criterion 11): a provably-unmet condition (Critical, plan_ref-keyed) holds the land; handoff marks it unmet', async () => {
  const impl = esImpl([{ severity: 'Critical', title: 'condition provably unmet at tip', plan_ref: ES_CONDS[0], rationale: 'grep found nothing' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation', 'provably-unmet is HARD — the land is held')
  assert.ok((out.escalated || []).some(e => e && e.reason === 'gate-evidence'), 'the hold rides the gate-evidence lane')
  assert.ok(out.handoff, 'handoff emitted on held:escalation (degraded)')
  const a = out.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a && a.status, 'unmet', 'the unmet condition is marked unmet in the handoff')
})

test('end-state SOFT case (criterion 11): an unverifiable condition (Minor note) never holds the land; handoff marks it deferred', async () => {
  const impl = esImpl([{ severity: 'Minor', title: 'cannot confirm tip', plan_ref: ES_CONDS[0], rationale: 'rev-parse failed' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'a SOFT end-state note does not hold the land')
  const a = out.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a && a.status, 'deferred', 'the unverifiable condition is deferred')
  const b = out.handoff.endState.find(e => e.condition === ES_CONDS[1])
  assert.equal(b && b.status, 'met', 'a claimed condition the seats raised nothing against is met')
})

test('end-state out-of-scope case (criterion 11): a later-phase condition is marked out-of-scope, never a hold', async () => {
  const impl = esImpl([{ severity: 'Nit', title: 'out-of-scope — owned by a later phase', plan_ref: ES_CONDS[1], rationale: 'phase 4 claims it' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'out-of-scope never holds')
  const b = out.handoff.endState.find(e => e.condition === ES_CONDS[1])
  assert.equal(b && b.status, 'out-of-scope')
})

test('end-state plan_ref binding (F1 #452): whitespace/case-drifted plan_ref still binds → unmet; a non-matching plan_ref does NOT bind', async () => {
  // Drift all three ways at once: leading/trailing whitespace, internal whitespace, letter-case.
  const drifted = `  ${ES_CONDS[0].toUpperCase().replace(/ /g, '  ')} `
  const impl = esImpl([{ severity: 'Critical', title: 'condition provably unmet at tip', plan_ref: drifted, rationale: 'grep found nothing' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.ok(out.handoff, 'handoff emitted (presence guard)')
  const a = out.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a && a.status, 'unmet', 'a whitespace/case-drifted plan_ref binds its condition — never a silent met')
  // Anti-vacuous guard: a genuinely different plan_ref must NOT bind — the normalizer catches
  // near-misses only, not everything.
  const impl2 = esImpl([{ severity: 'Critical', title: 'unrelated finding', plan_ref: 'condition Z: something else entirely', rationale: 'nope' }])
  const { out: out2 } = await runPhase(ES_ARGS(), impl2)
  assert.ok(out2.handoff, 'handoff emitted (presence guard)')
  const a2 = out2.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a2 && a2.status, 'met', 'a genuinely non-matching plan_ref does not bind — the condition stays met')
})

test('end-state-only seat (criterion 11 / D7): empty mergedTasksForGateAudit ∧ ≥1 claimed condition → ONE seat, logged', async () => {
  const args = ES_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] })
  const { out, calls, logs } = await runPhase(args, gateAuditImpl)
  const seats = calls.filter(c => (c.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.equal(seats.length, 1, 'exactly ONE End-state-only seat spawns')
  assert.match(seats[0].prompt, /END-STATE-ONLY GATE-AUDIT/, 'the seat is end-state-only')
  assert.ok(seats[0].prompt.includes(ES_CONDS[0]), 'the claimed conditions ride the seat prompt')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('End-state-only seat')), 'the spawn is log()ged')
  assert.ok(out.landed.includes('t1'), 'the docs-only phase still lands')
})

test('end-state-only seat: NOT spawned when the phase claims no conditions (D7 skip stays intact)', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] })
  const { calls } = await runPhase(args, gateAuditImpl)
  assert.ok(!calls.some(c => (c.opts.label || '').includes(':end-state')), 'no End-state-only seat without claims')
})

// --- Handoff block (criterion 6) ---

test('handoff block (criterion 6): a landed phase emits { tipSha, polish, absorbed, followUps, notes, endState, intentPresent }', async () => {
  const minorF = { severity: 'Minor', title: 'needs new tests', rationale: 'thin wiring', file: 'x.js' }
  const nitF = { severity: 'Nit', title: 'honest comment', rationale: 'covers invariant', file: 'y.js' }
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve',
      findings: (opts.label || '').startsWith('gate-audit:') ? [] : [minorF, nitF], confidence: 'high' }
    if (seat === 'war-refiner') return opts.phase === 'Land'
      ? { mode: 'land-phase', status: 'landed', working_sha: 'abc1234def' }
      : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
    if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
    return {}
  }
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }] })
  const { out } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'landed')
  const h = out.handoff
  assert.ok(h, 'handoff present on landed')
  assert.equal(h.tipSha, 'abc1234def', 'tipSha is the landed working sha')
  assert.equal(h.polish, 'skipped', 'no queue → polish skipped')
  assert.deepEqual(h.absorbed, [], 'nothing absorbed')
  assert.deepEqual(h.followUps, [{ issue: null, reason: 'needs new tests — thin wiring' }],
    'followUps carry { issue, reason } — issue is null until the Lead files it')
  assert.deepEqual(h.notes, [{ task: 't1', title: 'honest comment' }], 'notes carry { task, title }')
  assert.deepEqual(h.endState, [], 'no claims → empty endState')
  assert.equal(h.intentPresent, false, 'intentPresent false without args.intent')
  assert.ok(Array.isArray(out.notes) && out.notes.length === 1, 'the notes array also rides the return top-level')
})

test('handoff OMITTED on held:workflow-error (infra death — no trustworthy return to render)', async () => {
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's' }] })   // no roster → phase-start throw
  const fn = build()
  const out = await fn(async () => ({}), fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error', 'the roster assertion threw (presence guard)')
  assert.ok(!('handoff' in out), 'no handoff key on held:workflow-error')
})

test('handoff absorbed grouping: per-task ace absorbs group by commit sha as [{ sha, findings: [title] }]', async () => {
  const a1 = nit({ title: 'ace one', file: 'skills/war/assets/x.js' })
  const a2 = nit({ title: 'ace two', file: 'skills/war/assets/y.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [a1, a2]),
                               approveWith('audit:t1:correctness', [])] },
    aceBase([a1, a2]))
  const { out } = await runPhase(ACE_ARGS(), impl)
  assert.ok(out.handoff, 'handoff present (landed)')
  const grp = out.handoff.absorbed.find(g => g && g.sha === 'deadbeef')
  assert.ok(grp, 'one absorbed group at the ace commit sha')
  assert.deepEqual([...grp.findings].sort(), ['ace one', 'ace two'], 'both findings cite the same sha')
})

// ---------------------------------------------------------------------------
// Container-packaging Task 2 (#527): packaging floor wiring + unpackaged enum +
// combined floor-retry sub-loop + polish skip + args.backstops pass-through.
// Spec §10.2–3. Each new assertion fails without its feature (delete-it-mentally).
// ---------------------------------------------------------------------------

// Single-task args, requiresPackaging left default (true) so the floor engages.
const PKG_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
const isPackageItWorker = (c) => seatOf(c.opts) === 'war-worker' && /package-it:/.test(c.opts.label || '')

test('pkg §4.2 — main merge prompt invokes assert-packaging-in-diff.sh with the unpackaged/exit-1, error/exit-2 contract', async () => {
  // The default (requiresPackaging true) merge prompt must instruct the packaging floor exactly like
  // the test floor: exit 1 → unpackaged (do NOT merge), exit 2 → error (never unpackaged).
  const { calls } = await runPhase(PKG_ARGS(), defaultImpl)
  const merge = calls.find(isMergeTask)
  assert.ok(merge, 'a merge-task is dispatched')
  const p = merge.prompt
  assert.match(p, /assert-packaging-in-diff\.sh integration\/wtprov-a\/phase-3 war\/wtprov-a\/p3-t1/,
    'merge prompt runs assert-packaging-in-diff.sh <integrationBranch> <taskBranch>')
  // Slice the packaging clause out and assert the exit-code split (disjoint from the test-floor clause,
  // which never names 'unpackaged').
  const clause = p.match(/run assert-packaging-in-diff\.sh[^]*?package-it loop\./)
  assert.ok(clause, 'the packaging-floor clause is present in the merge prompt')
  assert.ok(clause[0].includes('exit 1') && clause[0].includes("status: 'unpackaged'"),
    "exit 1 → status:'unpackaged' (do NOT merge)")
  assert.ok(clause[0].includes('exit 2') && clause[0].includes("status: 'error'"),
    "exit 2 → status:'error', never 'unpackaged'")
})

test('pkg §4.2 — unpackaged routes a bounded fix-worker + full re-audit + re-merge; task lands', async () => {
  // Drive: merge-task returns unpackaged on call 1, merged on call 2 (after package-it fix + re-audit).
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      return mergeCallCount === 1
        ? { mode: 'merge-task', status: 'unpackaged' }
        : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(PKG_ARGS(), impl)
  // A package-it fix-worker must be dispatched (unique label token 'package-it:').
  const pkgFix = calls.find(isPackageItWorker)
  assert.ok(pkgFix, 'a package-it fix-worker must be dispatched on an unpackaged result')
  // The anti-cheat instruction must be in the fix prompt (delete-it-mentally: drop the branch → no such prompt).
  assert.match(pkgFix.prompt, /add the COPY or dockerignore it — never delete the file/,
    'the package-it fix prompt carries the anti-cheat instruction (add the COPY or dockerignore it — never delete the file)')
  // Full re-audit must re-spawn (>=2 regular audit calls).
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length >= 2, `audit panel must re-spawn after the package-it fix (got ${auditCalls.length})`)
  // A second merge must be attempted, and the task lands.
  assert.ok(mergeCallCount >= 2, `re-merge must be attempted after re-audit (mergeCallCount=${mergeCallCount})`)
  assert.ok(out.landed.includes('t1'), 't1 lands after unpackaged fix + re-audit + re-merge')
})

test('pkg §4.2 — unpackaged budget exhaustion → hard escalation {reason:"unpackaged"} → held:escalation', async () => {
  // roundLimit:1: one package-it fix round, then the re-merge still returns unpackaged → exhausted.
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') { mergeCount++; return { mode: 'merge-task', status: 'unpackaged' } }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PKG_ARGS({ run: { roundLimit: 1 } }), impl)
  assert.ok(!out.landed.includes('t1'), 't1 must not land when the packaging budget is exhausted')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'unpackaged')
  assert.ok(esc, 'escalated must contain {task:"t1", reason:"unpackaged"} on budget exhaustion')
  assert.equal(out.landDecision, 'held:escalation',
    'unpackaged is a HARD_ESCALATION_REASON → held:escalation')
  // The exhausted verdict is recorded (auditLog).
  const exhaustedLog = (out.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'unpackaged:exhausted')
  assert.ok(exhaustedLog, "auditLog records verdict 'unpackaged:exhausted'")
})

test('pkg §4.2 — requiresPackaging:false skips the floor with a LOGGED (never silent) skip; no package-it worker', async () => {
  const EXEMPT = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresPackaging: false }],
  })
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls, logs } = await runPhase(EXEMPT, impl)
  // Merge prompt must state the skip.
  const merge = calls.find(isMergeTask)
  assert.match(merge.prompt, /requiresPackaging:false — skip the assert-packaging-in-diff\.sh check/,
    'merge prompt states requiresPackaging:false and skips the packaging floor')
  // The skip must be LOGGED (never silent) — this is the load-bearing assertion (delete the log line → RED).
  assert.ok(logs.some(m => /packaging-floor: skipping t1 \(requiresPackaging:false/.test(m)),
    'a requiresPackaging:false skip is logged (never silent)')
  // No package-it fix-worker (the floor never ran).
  assert.ok(!calls.find(isPackageItWorker), 'requiresPackaging:false → no package-it fix-worker')
  assert.ok(out.landed.includes('t1'), 'the requiresPackaging:false task still lands')
})

test('pkg §4.2 — BOTH floors tripped: combined sub-loop gives each a bounded fix, no immediate hard escalate on the second', async () => {
  // The core cross-floor property (spec §4.2): merge returns no-test → add-test fix + re-audit →
  // re-merge returns unpackaged → package-it fix + re-audit → re-merge returns merged → lands.
  // A no-test-only loop would hard-escalate verbatim on the unpackaged re-merge status (never fixing it).
  // Load-bearing: BOTH an add-test AND a package-it worker must be dispatched, and the task lands.
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    // Count only merge attempts (label merge:…) — NOT the post-merge evidence:phase-<id> refiner dispatch.
    if (seat === 'war-refiner' && opts.phase === 'Refine' && /^merge:/.test(opts.label || '')) {
      mergeCount++
      if (mergeCount === 1) return { mode: 'merge-task', status: 'no-test' }      // first floor
      if (mergeCount === 2) return { mode: 'merge-task', status: 'unpackaged' }   // second floor, on the retry merge
      return { mode: 'merge-task', status: 'merged' }                             // both cleared
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(PKG_ARGS(), impl)
  // Both fix-workers were dispatched — one per floor (the combined loop routed each).
  assert.ok(calls.find(isAddTestWorker), 'an add-test fix-worker was dispatched for the no-test floor')
  assert.ok(calls.find(isPackageItWorker), 'a package-it fix-worker was dispatched for the unpackaged floor (NOT an immediate hard escalate)')
  // The unpackaged re-merge status did NOT immediately hard-escalate: t1 lands, and there is no
  // unpackaged/no-test escalation entry.
  assert.ok(out.landed.includes('t1'), 't1 lands after bounded fixes for BOTH floors')
  const floorEsc = (out.escalated || []).find(e => e && e.task === 't1' && (e.reason === 'unpackaged' || e.reason === 'no-test'))
  assert.ok(!floorEsc, 'neither floor status hard-escalated — the combined loop fixed both')
  assert.equal(mergeCount, 3, 'three merge attempts: initial + one retry per floor')
})

test('pkg §4.2 — both floors tripped but budget too small: the SECOND floor exhausts as a hard reason (not a crash)', async () => {
  // roundLimit:1 — the no-test fix uses the one round; the re-merge returns unpackaged with the budget
  // spent → the sub-loop exits with the still-tripping floor (unpackaged) as the hard escalation reason.
  // Guards that the combined loop terminates cleanly on the second floor rather than looping forever.
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCount++
      return mergeCount === 1 ? { mode: 'merge-task', status: 'no-test' } : { mode: 'merge-task', status: 'unpackaged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PKG_ARGS({ run: { roundLimit: 1 } }), impl)
  assert.ok(!out.landed.includes('t1'), 't1 must not land')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'unpackaged')
  assert.ok(esc, 'the still-tripping SECOND floor (unpackaged) is the hard escalation reason at exhaustion')
  assert.equal(out.landDecision, 'held:escalation', 'held:escalation on exhaustion')
  assert.ok(!out.workflowError, 'the combined loop terminates cleanly — no workflow error')
})

test('pkg §4.2 — retry-merge prompt re-instructs ALL floor invocations (test + packaging kept in sync with standing steps)', async () => {
  // The floor-retry merge prompt must re-instruct BOTH assert-test-in-diff.sh AND
  // assert-packaging-in-diff.sh (dispatched-vs-standing coverage-split lesson).
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') { mergeCount++; return mergeCount === 1 ? { mode: 'merge-task', status: 'unpackaged' } : { mode: 'merge-task', status: 'merged' } }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(PKG_ARGS(), impl)
  const retry = calls.find(c => /floor-retry/.test(c.opts.label || ''))
  assert.ok(retry, 'a floor-retry merge is dispatched')
  assert.match(retry.prompt, /assert-test-in-diff\.sh/, 'retry-merge re-instructs the test floor')
  assert.match(retry.prompt, /assert-packaging-in-diff\.sh/, 'retry-merge re-instructs the packaging floor')
})

test('pkg §4.2 — drift-guard: both HARD_ESCALATION_REASONS mirrors include unpackaged and are equal', () => {
  const match = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(match, 'inline HARD_ESCALATION_REASONS found in workflow-template.js')
  const inline = JSON.parse(match[1].replace(/'/g, '"'))
  assert.ok(inline.includes('unpackaged'), "inline HARD_ESCALATION_REASONS must include 'unpackaged'")
  assert.ok(HARD_ESCALATION_REASONS.includes('unpackaged'), "canonical HARD_ESCALATION_REASONS must include 'unpackaged'")
  assert.deepEqual([...inline].sort(), [...HARD_ESCALATION_REASONS].sort(),
    'inline and canonical HARD_ESCALATION_REASONS must be equal including unpackaged (drift-guard)')
})

test('pkg §4.2 — MERGE_RESULT inline enum includes unpackaged', () => {
  const match = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(match, 'MERGE_RESULT status enum found')
  const parsed = JSON.parse(match[1].replace(/'/g, '"'))
  assert.ok(parsed.includes('unpackaged'), 'MERGE_RESULT status enum includes unpackaged')
})

test('pkg §4.2 — polish-merge prompt carries the explicit packaging-floor skip (next to the test-floor skip)', async () => {
  // Force a phaseClose finding so the phase-close coherence sweep dispatches a polish merge; its
  // prompt must explicitly skip BOTH assert-test-in-diff.sh and assert-packaging-in-diff.sh.
  const pcNit = { severity: 'Nit', title: 'phase-close coherence', file: 'skills/war/assets/x.js', rationale: 'tip-level', disposition: 'absorb', phaseClose: true }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [pcNit]), approveWith('audit:t1:correctness', [])] },
    (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-refiner' && /^polish-worktree:/.test(opts.label || '')) return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: {} }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    })
  const { calls } = await runPhase(ACE_ARGS({ audit: { roster: ROSTER_TRIO } }), impl)
  const polishMerge = calls.find(c => /merge:.*polish/.test(c.opts.label || ''))
  assert.ok(polishMerge, 'a polish merge is dispatched (phase-close sweep)')
  assert.match(polishMerge.prompt, /skip assert-test-in-diff\.sh/, 'polish merge skips the test floor')
  assert.match(polishMerge.prompt, /skip the packaging floor assert-packaging-in-diff\.sh|assert-packaging-in-diff\.sh/,
    'polish merge explicitly skips the packaging floor (delete the clause → no packaging-floor mention in the polish prompt)')
})

test('pkg §4.4 — args.backstops passes through UNTOUCHED into handoff.backstops[] on a landed phase', async () => {
  const BACKSTOPS = [
    { check: 'docker build -f app/Dockerfile app', why: 'no daemon at setup', runner: 'CI', source: 'auto' },
    { check: 'integration smoke', why: 'out of scope', runner: 'nightly', source: 'plan', aiDeclared: true },
  ]
  const { out } = await runPhase(PKG_ARGS({ backstops: BACKSTOPS }), defaultImpl)
  assert.equal(out.landDecision, 'landed', 'phase lands')
  assert.ok(out.handoff, 'handoff present on landed')
  assert.deepEqual(out.handoff.backstops, BACKSTOPS,
    'handoff.backstops[] is args.backstops passed through untouched (same entries, same order, aiDeclared preserved)')
})

test('pkg §4.4 — args.backstops also rides handoff on held:escalation (degraded phase still hands off the debt map)', async () => {
  const BACKSTOPS = [{ check: 'docker build', why: 'daemon unavailable at setup', runner: 'CI', source: 'auto' }]
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'land_stale' }  // hard → held:escalation
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PKG_ARGS({ backstops: BACKSTOPS }), impl)
  assert.equal(out.landDecision, 'held:escalation', 'land_stale holds → held:escalation')
  assert.ok(out.handoff, 'handoff still emitted on held:escalation (degraded)')
  assert.deepEqual(out.handoff.backstops, BACKSTOPS, 'handoff.backstops[] carried on held:escalation')
})

test('pkg §4.4 — a legacy plan with no args.backstops → handoff.backstops is null (surfaced-note default)', async () => {
  const { out } = await runPhase(PKG_ARGS(), defaultImpl)  // no backstops threaded
  assert.ok(out.handoff, 'handoff present')
  assert.equal(out.handoff.backstops, null, 'absent args.backstops → handoff.backstops null (never undefined/[])')
})

// ---------------------------------------------------------------------------
// Phase 3 Task 1 (#598) — gate_failure_class: schema + classification procedure + class routing
// (both surfaces, same commit). Validation 5 (routing: three classes + absent fail-safe, each
// assertion fails if the classification branch is deleted) + validation 6 (drift guard + gate-audit
// debt line). The refiner is MOCKED, so the classification itself (base re-run/judgment) is exercised
// upstream; these tests pin the WORKFLOW routing that reads the returned gate_failure_class.
// ---------------------------------------------------------------------------
const schemasMd = readFileSync(join(here, '../references/schemas.md'), 'utf8')
const CLS_ARGS = (over = {}) => ({
  phase: { id: 3, title: 'P3-cls', integrationBranch: 'integration/cls/phase-3', workingBranch: 'dev/cls' },
  plan: { file: 'docs/plans/cls.md', gate: 'make gate' },
  planSlug: 'cls', runId: 'run-cls', worktreeRoot: '/abs/repo/.claude/worktrees',
  runDir: '/abs/repo/.claude/teams/run-cls', ownedFile: '/abs/repo/.claude/teams/run-cls/owned-refs',
  mainCheckout: '/abs/repo',
  tasks: [{ id: 't1', issue: 301, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  learningsTarget: '/abs/learnings',
  ...over,
})
// A refiner impl parameterized by what the initial merge / land returns; baseline-proceed re-dispatches
// (labels ending :baseline-proceed) return merged/landed so the phase can proceed.
const clsImpl = ({ mergeResult, landResult } = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  const label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true } // barrier + provision-run: env-outcome
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc', tests: {} }
  if (seat === 'war-auditor') return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner' && opts.phase === 'Refine') {
    if (/:baseline-proceed$/.test(label)) return { mode: 'merge-task', status: 'merged', integration_sha: 'beef1234beef' }
    return mergeResult ? mergeResult(label) : { mode: 'merge-task', status: 'merged' }
  }
  if (seat === 'war-refiner' && opts.phase === 'Land') {
    if (/:baseline-proceed$/.test(label)) return { mode: 'land-phase', status: 'landed', working_sha: 'cafe5678cafe' }
    return landResult ? landResult(label) : { mode: 'land-phase', status: 'landed' }
  }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}

test('#598 validation 5 — schema: the three gate_failure_class values appear in BOTH the inline MERGE_RESULT constant and references/schemas.md', () => {
  const m = src.match(/gate_failure_class\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(m, 'MERGE_RESULT inline constant declares a gate_failure_class enum')
  for (const v of ['introduced', 'baseline', 'environment']) {
    assert.ok(m[1].includes(`'${v}'`), `inline MERGE_RESULT gate_failure_class enum includes '${v}'`)
    assert.ok(schemasMd.includes(v), `references/schemas.md names the '${v}' class value`)
  }
  assert.match(schemasMd, /gate_failure_class/, 'references/schemas.md documents the gate_failure_class field')
  // No new MergeResult status value / HARD_ESCALATION_REASONS member / KNOWN_LAND_DECISIONS member.
  const landDecMjs = readFileSync(join(here, './land-decision.mjs'), 'utf8')
  assert.ok(!/gate_failure_class|baseline|environment/.test(landDecMjs), 'land-decision.mjs is UNTOUCHED by the classification feature (ADR 0005)')
})

test("#598 validation 5 — merge 'environment' → soft escalate reason 'env-blocked', NO fix-worker; fails if the classification branch is deleted", async () => {
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky timeout at task tip; base green; not reproduced' }) })
  const { out, calls } = await runPhase(CLS_ARGS(), impl)
  const env = out.escalated.find(e => e && e.task === 't1' && e.reason === 'env-blocked')
  assert.ok(env, "gate_failed+'environment' soft-escalates reusing reason 'env-blocked' (delete the environment branch ⇒ reason is 'gate_failed' ⇒ this fails)")
  assert.equal(env.detail && env.detail.gate_failure_class, 'environment', 'detail is the MergeResult (a gate-time env-block, not the provision ENV_OUTCOME shape)')
  assert.ok(!calls.some(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit'), 'NO fix-worker prompt is built for a merge-time gate_failed (soft escalation, not a fix loop)')
  assert.ok(!out.landed.includes('t1'), 'the environment-classified task did NOT merge')
  assert.ok(!calls.some(c => /:baseline-proceed$/.test(c.opts.label || '')), 'environment never dispatches a baseline-proceed')
})

test("#598 validation 5+6 — merge 'baseline' → ONE baseline-proceed re-merge, merge proceeds, ONE deduped source:'auto' backstop; two same-id tasks ⇒ one entry + debt threaded (no 2nd base re-run)", async () => {
  const IDS = ['pytest:test_legacy_a', 'ruff:E501:old.py']
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: IDS, gate_base_sha: 'base9999', gate_output: 'base RED with the same ids — pre-existing' }) })
  const { out, calls } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const bp = calls.filter(c => /:baseline-proceed$/.test(c.opts.label || ''))
  assert.equal(bp.length, 2, 'one baseline-proceed re-merge dispatched per baseline-classified task (delete the baseline branch ⇒ 0 ⇒ this fails)')
  assert.ok(out.landed.includes('t1') && out.landed.includes('t2'), 'both baseline tasks merged (baseline-proceed proceeded over the recorded debt)')
  assert.equal(out.landDecision, 'landed', 'the phase lands over the recorded baseline debt')
  const auto = (out.handoff.backstops || []).filter(b => b && b.source === 'auto')
  assert.equal(auto.length, 1, "exactly ONE deduped source:'auto' baseline backstop entry (two tasks, same ids ⇒ one entry)")
  assert.match(auto[0].check, /baseline gate debt/, 'the auto entry check names it baseline gate debt')
  assert.ok(auto[0].check.includes(IDS[0]) && auto[0].check.includes('base9999'), 'the check string carries the classified identifiers + base sha')
  // Debt reuse: the SECOND task's initial merge prompt threads the KNOWN BASELINE GATE DEBT recorded
  // from the first — so the refiner classifies baseline directly, no repeated base re-run.
  const t1Init = calls.find(c => (c.opts.label || '') === 'merge:t1')
  const t2Init = calls.find(c => (c.opts.label || '') === 'merge:t2')
  assert.ok(t1Init && !/KNOWN BASELINE GATE DEBT/.test(t1Init.prompt), "t1's initial merge has no known debt yet (empty ⇒ no clause)")
  assert.ok(t2Init && /KNOWN BASELINE GATE DEBT/.test(t2Init.prompt), "t2's initial merge threads the debt recorded from t1 (classify baseline directly — no 2nd base re-run)")
})

test('#598 validation 5 — merge absent class → byte-identical to today (soft escalation reason gate_failed, held:nothing-merged, no env-blocked, no baseline-proceed)', async () => {
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_output: 'boom' }) })  // NO gate_failure_class
  const { out, calls } = await runPhase(CLS_ARGS(), impl)
  const esc = out.escalated.find(e => e && e.task === 't1' && e.reason === 'gate_failed')
  assert.ok(esc, "absent class ⇒ today's soft escalation (reason gate_failed, detail = the MergeResult)")
  assert.equal(out.landDecision, 'held:nothing-merged', 'a lone gate_failed with no class → held:nothing-merged (byte-identical to today)')
  assert.ok(!out.escalated.some(e => e && e.reason === 'env-blocked'), 'absent class never routes env-blocked')
  assert.ok(!calls.some(c => /:baseline-proceed$/.test(c.opts.label || '')), 'absent class never dispatches a baseline-proceed')
})

test("#598 validation 5 — land 'environment' → reason 'env-blocked', held:land-failed; fails if the classification branch is deleted", async () => {
  const impl = clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky at land; base green; not reproduced' }) })
  const { out } = await runPhase(CLS_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed', 'environment land gate_failed → held:land-failed')
  const esc = out.escalated.find(e => e && String(e.task).includes('-land') && e.reason === 'env-blocked')
  assert.ok(esc, "land 'environment' ⇒ reason 'env-blocked' (delete the environment branch ⇒ reason 'gate_failed' ⇒ this fails)")
})

test("#598 validation 5 — land 'baseline' → ONE baseline-proceed re-land, phase lands, ONE source:'auto' backstop from the land site", async () => {
  const IDS = ['pytest:test_pre_existing']
  const impl = clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: IDS, gate_base_sha: 'wbase77', gate_output: 'working tip RED, same ids' }) })
  const { out, calls } = await runPhase(CLS_ARGS(), impl)
  assert.ok(calls.some(c => /^land:phase-3:baseline-proceed$/.test(c.opts.label || '')), 'a baseline-proceed re-land is dispatched (delete the baseline branch ⇒ none ⇒ this fails)')
  assert.equal(out.landDecision, 'landed', 'the phase lands over the recorded baseline debt at the land site')
  const auto = (out.handoff.backstops || []).filter(b => b && b.source === 'auto')
  assert.equal(auto.length, 1, "exactly one source:'auto' baseline backstop entry from the land site")
  assert.ok(auto[0].check.includes(IDS[0]) && auto[0].check.includes('wbase77'), 'the land backstop check carries the ids + base sha')
})

test('#598 validation 6 — gate-audit debt line: a baseline-merged task threads its debt into the inline gate-audit prompt; a clean-merged task prompt carries NO debt line (empty ⇒ byte-identical)', async () => {
  const IDS = ['pytest:test_pre_existing_x']
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    const label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: label, lens: label.startsWith('gate-audit:') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      if (/^merge:t1:baseline-proceed$/.test(label)) return { mode: 'merge-task', status: 'merged', integration_sha: 'aaaa1111aaaa' }
      if (/^merge:t1$/.test(label)) return { mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: IDS, gate_base_sha: 'b1', gate_output: 'base red same ids' }
      return { mode: 'merge-task', status: 'merged', integration_sha: 'bbbb2222bbbb' } // t2 clean
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
    return {}
  }
  const { calls } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const t1GA = calls.find(c => isAuditor(c) && /^gate-audit:t1:/.test(c.opts.label || ''))
  const t2GA = calls.find(c => isAuditor(c) && /^gate-audit:t2:/.test(c.opts.label || ''))
  assert.ok(t1GA, 'a gate-audit seat is spawned for the baseline-merged task t1')
  assert.ok(/BASELINE GATE DEBT/.test(t1GA.prompt), "the baseline-merged task's gate-audit prompt carries the conditional debt line")
  assert.ok(t1GA.prompt.includes(IDS[0]), 'the debt line names the classified identifiers (a matching failure is base debt, not a provably-unrun mapped test)')
  assert.ok(t2GA, 'a gate-audit seat is spawned for the clean-merged task t2')
  assert.ok(!/BASELINE GATE DEBT/.test(t2GA.prompt), 'a clean-merged task carries NO debt line (empty debt ⇒ byte-identical prompt)')
})

test('#598 validation 6 — drift-guard: war-refiner.md names the three class values, the base re-run step, and the reproducibility predicate (token-anchored, case-tolerant)', () => {
  for (const v of ['introduced', 'baseline', 'environment']) assert.match(refinerMd, new RegExp(v, 'i'), `war-refiner.md names the '${v}' class value`)
  assert.match(refinerMd, /gate_failure_class/i, 'war-refiner.md names the gate_failure_class field')
  assert.match(refinerMd, /classification base/i, 'war-refiner.md names the classification base (the base re-run target)')
  assert.match(refinerMd, /re-?run.{0,40}(failing )?gate/i, 'war-refiner.md describes re-running the failing gate at the base')
  assert.match(refinerMd, /reproduc/i, 'war-refiner.md names the reproducibility predicate (the environment trigger)')
  assert.match(refinerMd, /fresh (TMPDIR|environment)/i, 'war-refiner.md names the fresh-environment trigger')
  assert.match(refinerMd, /integration base/i, 'war-refiner.md names the merge-task classification base (phase integration base)')
  assert.match(refinerMd, /origin\/<working>/i, 'war-refiner.md names the land-phase classification base (detached origin/<working> tip)')
  assert.match(refinerMd, /KNOWN BASELINE GATE DEBT|debt reuse/i, 'war-refiner.md names the baseline-debt reuse threading')
})

// t1.8 — hermetic-gate READER CONTRACT: a gate_failed bearing a recognized stderr precondition marker
// (REL_GUARD_PRECONDITION_FAILED) classifies 'environment', never 'introduced', carried uncurated in
// gate_output. Both-surfaces drift assert (token-anchored, case-tolerant): war-refiner.md AND the
// dispatched merge/land prompts (the classificationClause) must both carry the rule (spec §9 / criterion 9).
const markerEnvRe = /REL_GUARD_PRECONDITION_FAILED[\s\S]{0,320}environment|environment[\s\S]{0,320}REL_GUARD_PRECONDITION_FAILED/i
test('t1.8 — precondition-marker reader contract lands on BOTH surfaces (war-refiner.md + dispatched merge/land prompts)', async () => {
  // Surface 1 — the standing refiner card.
  assert.match(refinerMd, /REL_GUARD_PRECONDITION_FAILED/, 'war-refiner.md names the live precondition-marker token')
  assert.match(refinerMd, /precondition[- ]marker/i, 'war-refiner.md names the precondition-marker rule (case-tolerant mid-sentence)')
  assert.match(refinerMd, /stderr/i, 'war-refiner.md says to consult stderr, not just TAP stdout')
  assert.match(refinerMd, markerEnvRe, "war-refiner.md ties the marker to the 'environment' classification")
  assert.match(refinerMd, /never.{0,40}introduced|introduced.{0,40}never/i, "war-refiner.md says the marker is NEVER 'introduced'")

  // Surface 2 — the dispatched merge + land prompts (both carry classificationClause).
  const { calls } = await runPhase(CLS_ARGS(), clsImpl())
  const merge = calls.find(c => (c.opts.label || '') === 'merge:t1')
  const land = calls.find(isLand)
  for (const [name, p] of [['merge', merge.prompt], ['land', land.prompt]]) {
    assert.match(p, /REL_GUARD_PRECONDITION_FAILED/, `the ${name} prompt names the precondition-marker token`)
    assert.match(p, /precondition[- ]marker/i, `the ${name} prompt names the precondition-marker rule`)
    assert.match(p, /stderr/i, `the ${name} prompt says to consult stderr`)
    assert.match(p, markerEnvRe, `the ${name} prompt ties the marker to 'environment'`)
  }
})

// t1.8 — PATH CONTRACT (spec §9 / criterion 10): the done-reporting step fails loud when a worker reports
// an ABSOLUTE files_changed path OUTSIDE its injected worktree root. The throw is caught by the phase-level
// guard and surfaced as held:workflow-error (a hard halt — the phase does NOT land). Fixture drives the real
// phase, so deleting the assertReportedPathsInWorktree call at the worker-done site turns this GREEN→RED (not
// a weak assertion). In-worktree absolute paths and relative paths pass.
test('t1.8 — path contract: an out-of-worktree absolute files_changed path fails loud → held:workflow-error (fixture)', async () => {
  const badImpl = (prompt, opts) => {
    if (seatOf(opts) === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {},
      files_changed: ['/abs/repo/skills/war/assets/workflow-template.js'] }  // absolute, OUTSIDE the task worktree
    return clsImpl()(prompt, opts)
  }
  const { out } = await runPhase(CLS_ARGS(), badImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'an out-of-worktree absolute path halts the phase (does not land)')
  assert.match(out.workflowError.message, /path-contract violation/, 'the workflow-error carries the path-contract violation message')
  assert.ok(!out.landed || !out.landed.includes('t1'), 'the offending task did NOT land')
})

test('t1.8 — path contract: in-worktree absolute + relative files_changed paths pass (positive control)', async () => {
  const goodImpl = (prompt, opts) => {
    if (seatOf(opts) === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {},
      files_changed: ['/abs/repo/.claude/worktrees/run-cls/p3-t1/skills/x.js', 'agents/war-refiner.md'] }
    return clsImpl()(prompt, opts)
  }
  const { out } = await runPhase(CLS_ARGS(), goodImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'in-worktree absolute + relative paths satisfy the contract (no workflow-error)')
})

test('#598 — the initial merge + land prompts begin with the idempotent _refinery re-attach and carry the classification procedure (per-site base)', async () => {
  const { calls } = await runPhase(CLS_ARGS(), clsImpl())
  const merge = calls.find(c => (c.opts.label || '') === 'merge:t1')
  const land = calls.find(isLand)
  assert.ok(/re-attaching _refinery to the integration branch/i.test(merge.prompt), 'the initial merge prompt begins with the idempotent _refinery re-attach')
  assert.ok(/checkout integration\/cls\/phase-3/.test(merge.prompt), 'the re-attach names the integration-branch checkout')
  assert.ok(/re-attaching _refinery to the integration branch/i.test(land.prompt), 'the land prompt carries the idempotent _refinery re-attach')
  for (const v of ['introduced', 'baseline', 'environment']) {
    assert.ok(merge.prompt.includes(`'${v}'`), `the initial merge prompt names the '${v}' class`)
    assert.ok(land.prompt.includes(`'${v}'`), `the land prompt names the '${v}' class`)
  }
  assert.match(merge.prompt, /the phase integration base/, 'the merge classification base is the phase integration base')
  assert.match(land.prompt, /detached origin\/dev\/cls tip/, 'the land classification base is the detached origin/<working> tip')
})

test('#598 — the floor-retry re-merge prompt also carries the classification procedure + re-attach (mirrored into ALL merge sites)', async () => {
  const { floorRetry } = mergePromptsOf((await runNoTestLoop()).calls)
  assert.ok(floorRetry, 'a floor-retry re-merge is dispatched')
  assert.ok(/re-attaching _refinery to the integration branch/i.test(floorRetry.prompt), 'the floor-retry re-merge begins with the idempotent _refinery re-attach')
  assert.match(floorRetry.prompt, /GATE-FAILURE CLASSIFICATION/, 'the floor-retry re-merge carries the classification procedure')
  for (const v of ['introduced', 'baseline', 'environment']) assert.ok(floorRetry.prompt.includes(`'${v}'`), `the floor-retry re-merge names the '${v}' class`)
})

test('#598 — the polish-sweep merge is CLASS-EXEMPT (no classification clause) but still re-attaches _refinery; the exemption is stated in a code comment', async () => {
  const { calls } = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  const polishMerge = calls.find(c => (c.opts.label || '') === 'merge:p3-polish')
  assert.ok(polishMerge, 'the polish merge is dispatched (phase-close sweep)')
  assert.ok(/re-attaching _refinery to the integration branch/i.test(polishMerge.prompt), 'the polish merge still begins with the idempotent _refinery re-attach (hygiene)')
  assert.ok(!/GATE-FAILURE CLASSIFICATION/.test(polishMerge.prompt), 'the polish merge is class-exempt — it carries NO gate-failure classification procedure (fail-open discard suffices)')
  assert.match(polishMerge.prompt, /class-exempt/i, 'the polish merge prompt states it is class-exempt')
  assert.match(src, /CLASS-EXEMPT by design/i, 'the code comment records the polish-sweep class-exemption (never a coverage gap)')
})

// ===========================================================================
// run-lifecycle robustness (#582/#583/#586) — entry validation, phase-scoped
// keying, provision evidence gate, barrier/polish env-outcome, both-surfaces.
// ===========================================================================

// A phase with one derivation-needing task but no explicit branch/worktree, parameterized by the
// top-level args under test. `runCounting` records how many agents were dispatched (zero-agents proof).
const NEEDS_DERIVATION_TASK = [{ id: 'tA', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] }]
async function runCounting(args) {
  let agentCalls = 0
  const fn = build()
  const agent = async () => { agentCalls++; return {} }
  const out = await fn(agent, fakeParallel, async () => [], () => {}, () => {}, args, { total: null })
  return { out, agentCalls }
}

test('run-lifecycle §1 entry validation (a): no trio → held:workflow-error names all three keys; zero agents', async () => {
  const args = { phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'x', gate: 'true' }, tasks: NEEDS_DERIVATION_TASK, learningsTarget: null }
  const { out, agentCalls } = await runCounting(args)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.match(out.workflowError.message, /requires top-level \{ planSlug, runId, worktreeRoot \}/)
  for (const k of ['planSlug', 'runId', 'worktreeRoot']) assert.ok(out.workflowError.message.includes(k), `names ${k}`)
  assert.match(out.workflowError.message, /or supply explicit branch\/worktree per task/)
  assert.equal(agentCalls, 0, 'zero agents dispatched on an entry-validation throw')
})

test('run-lifecycle §1 entry validation (b): only runId missing → missing list is exactly [runId]; zero agents', async () => {
  const args = { phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'x', gate: 'true' }, planSlug: 'x', worktreeRoot: '/abs/repo/.claude/worktrees',
    tasks: NEEDS_DERIVATION_TASK, learningsTarget: null }
  const { out, agentCalls } = await runCounting(args)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.match(out.workflowError.message, /missing: \[runId\]/, 'the missing LIST is exactly [runId]')
  assert.equal(agentCalls, 0)
})

test('run-lifecycle §1 entry validation (c): trio absent but every task carries explicit branch+worktree → no throw, run proceeds', async () => {
  const args = { phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    plan: { file: 'x', gate: 'true' },
    tasks: [{ id: 'tE', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }],
      branch: 'war/x/p1-tE', worktree: '/abs/repo/.claude/worktrees/run-abc/p1-tE' }],
    learningsTarget: null }
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'no entry-validation throw when explicit paths are supplied')
  assert.ok(calls.some(isWorker), 'the run proceeds — a worker is dispatched')
})

test('run-lifecycle §1 entry validation (d): trio present, phase.id absent → held:workflow-error names phase.id DISTINCTLY from the trio class; zero agents', async () => {
  const args = { phase: { title: 'P', integrationBranch: 'i', workingBranch: 'w' },  // NO id
    plan: { file: 'x', gate: 'true' }, planSlug: 'x', runId: 'r', worktreeRoot: '/abs',
    tasks: NEEDS_DERIVATION_TASK, learningsTarget: null }
  const { out, agentCalls } = await runCounting(args)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.match(out.workflowError.message, /phase\.id is missing/, 'names the phase.id class')
  assert.match(out.workflowError.message, /pundefined-/, 'names the silent pundefined- derivation class')
  assert.ok(!/requires top-level/.test(out.workflowError.message), 'the trio class is NOT reported (trio is present) — the two classes are distinct')
  assert.equal(agentCalls, 0)
})

test('run-lifecycle §2 phase-scoped keying: same taskId under two phase ids → distinct worktree paths (delete-the-feature)', async () => {
  const mk = (id) => PROVISION_ARGS({
    phase: { id, title: `P${id}`, integrationBranch: `integration/wtprov-a/phase-${id}`, workingBranch: 'dev/wtprov-a' },
    tasks: [{ id: 'tS', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] }] })
  const a = await runPhase(mk(3), defaultImpl)
  const b = await runPhase(mk(4), defaultImpl)
  const p3 = a.calls.find(isWorker).prompt
  const p4 = b.calls.find(isWorker).prompt
  // Delete-the-feature: on the OLD phase-blind derivation both would be `run-2026/tS`, so these fail.
  assert.ok(p3.includes('/abs/repo/.claude/worktrees/run-2026/p3-tS'), 'phase 3 worktree carries p3-')
  assert.ok(p4.includes('/abs/repo/.claude/worktrees/run-2026/p4-tS'), 'phase 4 worktree carries p4-')
  assert.ok(!p3.includes('/run-2026/tS ') && !p3.includes('/run-2026/tS\n'), 'phase-blind path is gone')
})

test('run-lifecycle §2 phase-scoped keying: explicit t.worktree still wins over the derivation', async () => {
  const args = PROVISION_ARGS({ tasks: [{ id: 'tW', issue: 1, title: 't', planSlice: 's',
    roster: [{ lens: 'correctness' }], worktree: '/custom/explicit/path', branch: 'war/wtprov-a/p3-tW' }] })
  const w = (await runPhase(args, defaultImpl)).calls.find(isWorker).prompt
  assert.ok(w.includes('/custom/explicit/path'), 'the explicit worktree wins')
  assert.ok(!w.includes('run-2026/p3-tW'), 'the derived path is NOT used when explicit is supplied')
})

const SINGLE_PROV = (over = {}) => withProvision({ tasks: [{ id: 't1', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] }], ...over })

test('run-lifecycle §3 evidence gate: an evidence-bearing ok:false → soft env-blocked (byte-preserved), worker unspawned, phase not held:workflow-error', async () => {
  const impl = (p, o) => isProvisionRun({ opts: o })
    ? { ok: false, taskId: 't1', failedCommand: PROVISION_LIST[0], exitCode: 1, stderrTail: 'ERR_LOCKFILE', provisionSource: 'ci' }
    : defaultImpl(p, o)
  const { out, calls } = await runPhase(SINGLE_PROV(), impl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'evidence-bearing env-block is NOT held:workflow-error')
  const eb = (out.escalated || []).find(e => e && e.reason === 'env-blocked' && e.task === 't1')
  assert.ok(eb, 'a soft env-blocked escalation is surfaced')
  assert.equal(eb.outcome.failedCommand, PROVISION_LIST[0], 'the real failedCommand rides the outcome')
  assert.equal(eb.outcome.exitCode, 1)
  assert.ok(!calls.some(c => isWorker(c) && /task t1\b/.test(c.prompt)), 'the worker is NOT spawned')
})

for (const [name, bad] of [
  ['no result (null)', null],
  ['refusal prose (ok:false, no failedCommand)', { ok: false, stderrTail: 'I will not run this' }],
  ['foreign failedCommand (not a dispatched step)', { ok: false, failedCommand: 'rm -rf /', exitCode: 1, stderrTail: 'x' }],
  ['incoherent exitCode:0 with a matching failedCommand', { ok: false, failedCommand: PROVISION_LIST[0], exitCode: 0, stderrTail: 'x' }],
  ['non-numeric exitCode', { ok: false, failedCommand: PROVISION_LIST[0], exitCode: 'boom', stderrTail: 'x' }],
]) {
  test(`run-lifecycle §3 evidence gate: ${name} → held:workflow-error naming the task + provision-run (no fabricated env-block)`, async () => {
    const impl = (p, o) => isProvisionRun({ opts: o }) ? bad : defaultImpl(p, o)
    const { out } = await runPhase(SINGLE_PROV(), impl)
    assert.equal(out.landDecision, 'held:workflow-error', `${name} must NOT fabricate an env-block`)
    assert.ok(out.workflowError.message.includes('t1'), 'the message names the task id')
    assert.ok(out.workflowError.message.includes('provision-run'), 'the message names the provision-run label')
    assert.ok(!(out.escalated || []).some(e => e && e.reason === 'env-blocked'), 'no env-blocked escalation is invented')
  })
}

test('run-lifecycle §3 the provision-run fabrication literal is deleted from the template source', () => {
  assert.ok(!src.includes('provision-run returned no result'), "'provision-run returned no result' appears nowhere in the template")
})

test('run-lifecycle §4 barrier + polish provisioning dispatch schema is ENV_OUTCOME (not MERGE_RESULT)', async () => {
  const { calls } = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  const barrier = calls.find(isProvisionTopology)
  const polishProv = calls.find(c => (c.opts.label || '') === 'polish-worktree:phase-3')
  for (const [n, c] of [['barrier', barrier], ['polish-worktree', polishProv]]) {
    assert.ok(c, `${n} is dispatched`)
    assert.deepEqual(c.opts.schema.required, ['ok'], `${n} schema.required is ['ok'] (ENV_OUTCOME)`)
    const props = c.opts.schema.properties || {}
    assert.ok(!('mode' in props) && !('status' in props), `${n} schema is not MERGE_RESULT`)
    assert.ok('failedCommand' in props && 'exitCode' in props && 'stderrTail' in props, `${n} schema carries the env-outcome fields`)
  }
})

test('run-lifecycle §4 barrier ok:false → held:workflow-error carrying the stderrTail; no worker dispatched', async () => {
  const impl = (p, o) => isProvisionTopology({ opts: o })
    ? { ok: false, failedCommand: 'provision-worktrees.sh ensure-integration wtprov-a 3 dev/wtprov-a', exitCode: 3, stderrTail: 'FOREIGN INTEGRATION BRANCH die text' }
    : defaultImpl(p, o)
  const { out, calls } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.ok(out.workflowError.message.includes('FOREIGN INTEGRATION BRANCH die text'), 'the stderrTail (die text) rides the message')
  assert.ok(!calls.some(isWorker), 'the barrier throw aborts the phase before any worker fans out')
})

test('run-lifecycle §4 polish worktree provisioning ok:false → fail-open: sweep skipped, queue → follow-up, phase still lands (never a hold)', async () => {
  const impl = (p, o) => (o.label || '') === 'polish-worktree:phase-3'
    ? { ok: false, stderrTail: 'no disk' }
    : sweepBase([queuedAbsorb()])(p, o)
  const { out, calls } = await runPhase(SWEEP_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'the phase still lands — a polish provisioning failure never holds')
  assert.equal(out.handoff.polish, 'skipped', 'polishStatus stays skipped (mirrors the invalid-roster arm)')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'polish:phase-3'), 'the sweep worker is NOT dispatched')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'merge:p3-polish'), 'no polish merge is dispatched')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'dangling link'), 'the queued finding drains to follow-up')
})

test('run-lifecycle §5 both-surfaces drift guard: war-refiner.md names the provision mode, the three labels, the env-outcome fields, the submodule p<phase>-<task> path, and the frontmatter blurb (token-anchored, case-tolerant)', () => {
  assert.match(refinerMd, /## provision/i, 'the standing card has a ## provision section')
  // the three dispatch labels wherever the dispatched prompts name them
  assert.match(refinerMd, /provision:phase-<id>/i, 'names the git-topology barrier label')
  assert.match(refinerMd, /provision-run:<taskId>/i, 'names the per-task provision-run label')
  assert.match(refinerMd, /polish-worktree:/i, 'names the polish-worktree label')
  // env-outcome return + fields
  assert.match(refinerMd, /env-outcome/i, 'names the env-outcome return')
  for (const f of ['failedCommand', 'exitCode', 'stderrTail']) assert.match(refinerMd, new RegExp(f, 'i'), `names the env-outcome field ${f}`)
  assert.match(refinerMd, /never\b[\s\S]{0,16}(out-of-mode|decline)/i, 'states a provision dispatch is never declined')
  // submodule worktree add path mirrors the template derivation shape
  assert.match(refinerMd, /p<phase>-<taskId>/i, 'the submodule step-4 worktree path carries the p<phase>-<taskId> shape')
  // frontmatter description (the agent-catalog blurb) names the provision mode + env-outcome return
  const fm = refinerMd.split('---')[1] || ''
  assert.match(fm, /provision mode/i, 'the frontmatter blurb names the provision mode')
  assert.match(fm, /env-outcome/i, 'the frontmatter blurb names the env-outcome return')
  // the dispatched-prompt side: the three site comments name the standing-card provision mode
  assert.ok((src.match(/provision mode \(agents\/war-refiner\.md ## provision\)/gi) || []).length >= 3,
    'each of the three provision dispatch sites carries a comment naming the standing-card provision mode')
})

test('run-lifecycle §5 schemas.md presence lock: provisioning-args + footgun carry p<phase>-<task>; ENV_OUTCOME is the uniform provision return with the evidence-gate rule', () => {
  assert.ok(schemasMd.includes('<worktreeRoot>/<runId>/p<phase>-<task>'), 'the runId row / footgun carry the p<phase>-<task> path shape')
  assert.match(schemasMd, /ENV_OUTCOME/, 'schemas.md documents the ENV_OUTCOME shape')
  assert.match(schemasMd, /uniform return for all three .{0,20}provision/i, 'ENV_OUTCOME is stated as the uniform return for all three provision dispatches')
  assert.match(schemasMd, /evidence gate/i, 'schemas.md states the evidence-gate rule')
  assert.match(schemasMd, /entry validation/i, 'schemas.md notes the entry validation naming the missing keys + phase.id')
})

// ---------------------------------------------------------------------------
// Task 1.2 (#637) — reland-loop transient-vs-divergence discrimination, both surfaces.
// On the FINAL failed CAS attempt the land prompt runs `git rev-list --left-right --count
// <merge-sha>...origin/<working>` (the merge sha it tried to push vs. the freshly-fetched origin
// tip, NEVER the lagging local follower): a right count of 0 (contender-less transient) buys
// exactly ONE extra push-first attempt beyond roundLimit; a nonzero right count (real contender
// commits) is land_stale immediately. The discrimination is emitted in BOTH the in-flow land prompt
// AND the baseline-proceed re-land prompt, and grep-parallel with agents/war-refiner.md §land-phase.
// The three plain-text anchors below appear VERBATIM in all three surfaces (mirror-drift guard, spec
// §8; memory: standing-instruction-vs-dispatched-prompt-coverage-split). They are markup-free in the
// .md source (no backtick/bold inside the span) so a raw-string includes() matches byte-for-byte.
// ---------------------------------------------------------------------------
const RELAND_DISC_CMD = 'git rev-list --left-right --count <merge-sha>...origin/'                     // A1: discrimination command core (working branch follows)
const RELAND_DISC_BUDGET = 'exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once' // A2: the explicit-+1 budget sentence
const RELAND_DISC_DIVERGE = 'nonzero right count'                                                     // A3: the real-divergence signal

test('Task 1.2 — in-flow land prompt carries the rev-list discrimination + explicit-+1 budget + land_stale-only-on-nonzero-right-count', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const land = calls.find(isLand)
  assert.ok(land, 'a land-phase (Land) refiner seat is dispatched')
  const p = land.prompt
  // (1) the rev-list --left-right --count <merge-sha>...origin/<working> discrimination, working interpolated.
  assert.ok(p.includes(RELAND_DISC_CMD), 'in-flow land prompt runs rev-list --left-right --count <merge-sha>...origin/<working>')
  assert.ok(p.includes('dev/wtprov-a'), 'the discrimination command names origin/<workingBranch> (interpolated), not the local follower')
  assert.match(p, /git fetch origin dev\/wtprov-a/, 'a fresh fetch precedes the rev-list discrimination')
  assert.match(p, /NEVER the local follower refs\/heads\/dev\/wtprov-a/, 'the discrimination pins origin, explicitly NOT the lagging local follower')
  // (2) the explicit-+1-then-land_stale budget.
  assert.ok(p.includes(RELAND_DISC_BUDGET), 'in-flow land prompt states the explicit +1 (once, not a slot inside roundLimit) budget')
  assert.match(p, /Right count 0[\s\S]*?buys exactly one extra push-first attempt[\s\S]*?if that extra attempt also fails, return \{ mode: 'land-phase', status: 'land_stale' \}/,
    'right count 0 buys exactly one extra attempt, then land_stale only if that extra attempt also fails')
  // (3) land_stale ONLY on a nonzero right count — the immediate-surrender branch.
  assert.ok(p.includes(RELAND_DISC_DIVERGE), 'in-flow land prompt names the nonzero-right-count divergence branch')
  assert.match(p, /a nonzero right count \(real contender commits on origin\) is a real divergence: return \{ mode: 'land-phase', status: 'land_stale' \} immediately/,
    'a nonzero right count returns land_stale immediately, with no extra attempt')
  // no new status/enum: a resolved transient returns 'landed' (ADR 0005 — no new status member).
  assert.match(p, /A transient that resolves returns status: 'landed'/, 'a resolved transient returns landed, not a new status')
  assert.ok(p.includes('no new status'), 'the prompt states no new status is introduced by the recovery path')
})

test('Task 1.2 — baseline-proceed re-land prompt carries the identical discrimination (both JS land surfaces)', async () => {
  // A land gate failure classified 'baseline' dispatches the baseline-proceed re-land; its prompt must
  // carry the same discrimination — the mirror-drift hazard is intra-file too (two land prompts).
  const impl = clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' }) })
  const { calls } = await runPhase(CLS_ARGS(), impl)
  const bp = calls.find(c => /^land:phase-3:baseline-proceed$/.test(c.opts.label || ''))
  assert.ok(bp, 'a baseline-proceed re-land is dispatched')
  const p = bp.prompt
  assert.ok(p.includes(RELAND_DISC_CMD), 'baseline-proceed re-land prompt runs the rev-list discrimination')
  assert.ok(p.includes('dev/cls'), 'the discrimination names origin/<workingBranch> (interpolated)')
  assert.ok(p.includes(RELAND_DISC_BUDGET), 'baseline-proceed re-land prompt states the identical explicit-+1 budget')
  assert.ok(p.includes(RELAND_DISC_DIVERGE), 'baseline-proceed re-land prompt names the nonzero-right-count divergence branch')
  assert.match(p, /return \{ mode: 'land-phase', status: 'land_stale' \} immediately/, 'baseline-proceed re-land: nonzero right count → land_stale immediately')
})

test('Task 1.2 — grep parity: agents/war-refiner.md §land-phase carries the byte-identical discrimination strings the JS prompts emit', () => {
  // Standing-vs-dispatched coverage split: the same three plain-text anchors the land prompts emit
  // must appear VERBATIM in the standing card so the surfaces cannot drift (spec §8, grill Q5/Q11).
  assert.ok(refinerMd.includes(RELAND_DISC_CMD), 'war-refiner.md §land-phase runs rev-list --left-right --count <merge-sha>...origin/')
  assert.ok(refinerMd.includes(RELAND_DISC_BUDGET), 'war-refiner.md §land-phase states the identical explicit-+1 budget sentence')
  assert.ok(refinerMd.includes(RELAND_DISC_DIVERGE), 'war-refiner.md §land-phase names the nonzero-right-count divergence branch')
  // the discrimination must appear for BOTH the superproject land and the submodule-2A land variant.
  assert.ok((refinerMd.match(/git rev-list --left-right --count <merge-sha>\.\.\.origin\//g) || []).length >= 2,
    'the discrimination command is present in BOTH the superproject and submodule-2A land variants')
  // never anchored on the lagging local follower.
  assert.match(refinerMd, /NEVER the local follower/, 'war-refiner.md pins the discrimination to origin, never the lagging local follower')
})

test('Task 1.2 — a stale-then-resolved land (final status:landed) reaches the servitorResult dispatch (no new status/enum)', async () => {
  // The +1 recovery is prompt-level (the refiner runs it internally, then returns a MergeResult). A
  // transient that resolves returns status:'landed', so it flows through the ORDINARY landed path:
  // no new status, no HARD_ESCALATION_REASONS member, and the existing servitorResult gate
  // (landResult.status === 'landed' && memoryLocalRoot) spawns the servitor with no Lead intervention.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-refiner' && /^polish-worktree:/.test(opts.label || '')) return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    // Simulate the refiner resolving a contender-less transient on the +1 attempt: it returns landed.
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed', working_sha: 'cafef00d', notes: 'resolved a contender-less transient on the +1 attempt (right count 0)' }
    if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'a resolved transient lands normally — no held:escalation')
  assert.notEqual(out.servitorResult, null, 'the landed path spawns the servitor (servitorResult non-null) with no Lead intervention')
  assert.ok(!out.escalated.some(e => e && String(e.task).includes('-land')),
    'no land escalation is recorded for a resolved transient (no land_stale reaches HARD_ESCALATION_REASONS)')
})

// ---------------------------------------------------------------------------
// audit-gate-verdict-fidelity Task 1.3 — pin-equality gate (D2) + verdict-hard (D8)
// End-state criteria 3 (mismatch demotion) and 9 (finding-less escalate is HARD at both sites),
// plus the auditPrompt AUDIT-PIN-line presence/fail-open assert and the auditRound (work-wave)
// demotion enforcement. observedHead is absent in this phase (Task 2.1 stamps it), so the gate-audit
// seat's pin-equality expectation falls back to gateHeadSha — the live path until Phase 2 lands.
// ---------------------------------------------------------------------------

const ONE_TASK = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] }] })
// A gate-audit seat that returns a HARD (escalate + Critical) verdict pinned to `auditSha`; the refiner
// stamps a well-formed integration_sha '1111111111' so gateHeadSha is well-formed (pinMismatch can fire).
const gateAuditPinImpl = (auditSha) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5 } }
  if (seat === 'war-auditor') {
    if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'escalate',
               findings: [{ severity: 'Critical', title: 'mapped test provably unrun', file: 'test/foo.test.js', rationale: 'absent at tip' }],
               confidence: 'high', audit_sha: auditSha }
    }
    return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  }
  if (seat === 'war-refiner') {
    return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: '1111111111' }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

test('T1.3 criterion 3 (D2) — gate-audit seat whose audit_sha ≠ the pin is demoted (pin-mismatch, findings excluded from the HARD path); a matching-sha control stays HARD', async () => {
  // MISMATCH: audit_sha '2222222222' ≠ gateHeadSha '1111111111' (both well-formed, neither a prefix) ⇒
  // the seat judged a different tree ⇒ its escalate+Critical is demoted, land is NOT held.
  const { out: mm } = await runPhase(ONE_TASK(), gateAuditPinImpl('2222222222'))
  assert.equal(mm.landDecision, 'landed',
    'a pin-mismatched gate-audit seat cannot hold the land (findings demoted to SOFT)')
  assert.ok(!(mm.escalated || []).some(e => e && e.reason === 'gate-evidence'),
    'a pin-mismatched seat contributes NO gate-evidence escalation')
  const mmEntry = (mm.auditLog || []).find(e => e && e.gateEvidence)
  assert.ok(mmEntry, 'the gate-evidence auditLog entry (the SOFT absence-note) exists')
  assert.equal(mmEntry.pinMismatch, true, 'the auditLog entry is tagged pin-mismatch')
  assert.equal(mmEntry.hard, false, 'the pin-mismatched entry is SOFT (hard:false)')
  assert.equal(mmEntry.auditSha, '2222222222', 'the note carries the seat sha it reviewed')
  assert.equal(mmEntry.expectedPin, '1111111111', 'the note carries the expected pin (both SHAs recorded)')
  assert.ok((mmEntry.findings || []).every(f => f.pinMismatch === true), 'every finding is tagged pin-mismatch')

  // CONTROL: audit_sha '1111111111' == gateHeadSha ⇒ NOT a mismatch ⇒ the escalate+Critical stays HARD.
  // Delete-and-trace: removing the `!mismatch &&` demotion guard would flip the MISMATCH run to
  // held:escalation too, failing the `landed` assertion above — so the demotion is load-bearing.
  const { out: ctl } = await runPhase(ONE_TASK(), gateAuditPinImpl('1111111111'))
  assert.equal(ctl.landDecision, 'held:escalation',
    'a matching-sha gate-audit seat keeps the HARD hold (provably-unrun / escalate)')
  assert.ok((ctl.escalated || []).some(e => e && e.reason === 'gate-evidence'),
    'the matching-sha control pushes gate-evidence to escalated')
  const ctlEntry = (ctl.auditLog || []).find(e => e && e.gateEvidence)
  assert.equal(ctlEntry.hard, true, 'the matching-sha entry is HARD (hard:true)')
  assert.ok(!ctlEntry.pinMismatch, 'the matching-sha entry is NOT tagged pin-mismatch')
})

test('T1.3 (D2) — work-wave auditRound demotes a pin-mismatched seat: a blocking finding on the wrong tree neither blocks nor spawns a fix-worker; a matching-pin control DOES block', async () => {
  // The worker commits at 'deadbeef' (the dispatched pin). A seat returning a Major on a DIFFERENT tree
  // ('cafe1234') is demoted inside auditRound: verdict→approve, finding→non-blocking Nit; the task approves
  // and lands with no fix-worker. The auditLog carries the SOFT pin-mismatch note.
  const workWaveImpl = (auditSha) => (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
               findings: [{ severity: 'Major', title: 'wrong-tree blocker', file: 'a.js', rationale: 'reviewed a stale tree' }],
               audit_sha: auditSha }
    }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged', gate_output: 'ok' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out: mm, calls: mmCalls } = await runPhase(ONE_TASK(), workWaveImpl('cafe1234'))
  assert.equal(mm.landDecision, 'landed', 'a pin-mismatched work-wave blocker is demoted — the task approves and lands')
  assert.ok(!mmCalls.some(isFixWorker), 'NO fix-worker is dispatched for a demoted (wrong-tree) blocking finding')
  assert.ok((mm.auditLog || []).some(e => e && e.pinMismatch === true && e.task === 't1'),
    'a SOFT pin-mismatch absence-note is pushed to auditLog for the work-wave seat')

  // Delete-and-trace control: the SAME Major with a MATCHING audit_sha ('deadbeef') is NOT demoted, so it
  // blocks and a fix-worker IS dispatched (proving the demotion — not some other path — suppressed it above).
  const { calls: ctlCalls } = await runPhase(ONE_TASK(), workWaveImpl('deadbeef'))
  assert.ok(ctlCalls.some(isFixWorker), 'a matching-pin blocking finding is NOT demoted — a fix-worker is dispatched')
})

test('T1.3 criterion 9 (D8) — a finding-less gate-audit escalate holds the land at the per-task site; an approve control does not; HARD_ESCALATION_REASONS byte-unchanged in both mirrors', async () => {
  // Per-task gate-audit seat returns verdict:'escalate' with ZERO Critical/Major findings and no audit_sha
  // (⇒ no pin-mismatch demotion). D8's verdict disjunct makes it HARD.
  const esc = (verdict) => (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 5 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict, findings: [], confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out: held } = await runPhase(ONE_TASK(), esc('escalate'))
  assert.equal(held.landDecision, 'held:escalation',
    'a finding-less gate-audit escalate holds the land (D8: verdict === escalate is HARD)')
  assert.ok((held.escalated || []).some(e => e && e.reason === 'gate-evidence'),
    'the finding-less escalate pushes gate-evidence to escalated')
  const { out: ok } = await runPhase(ONE_TASK(), esc('approve'))
  assert.equal(ok.landDecision, 'landed', 'a finding-less approve control does NOT hold the land')

  // criterion 9: HARD_ESCALATION_REASONS byte-unchanged in BOTH mirrors (D8 reuses 'gate-evidence', no new member — ADR 0005).
  const inline = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(inline, 'inline HARD_ESCALATION_REASONS found in workflow-template.js')
  assert.deepEqual(JSON.parse(inline[1].replace(/'/g, '"')), HARD_ESCALATION_REASONS,
    'the inline mirror byte-equals the land-decision.mjs export — no member added, gate-evidence reused')
  assert.ok(HARD_ESCALATION_REASONS.includes('gate-evidence'), 'gate-evidence is the reused HARD reason')
})

test('T1.3 criterion 9 (D8) — a finding-less escalate ALSO holds the land at the end-state-only site (empty merge set, phase claims a condition); approve control lands', async () => {
  // requiresTest:false ⇒ the merged task is skipped for the per-task gate-audit ⇒ mergedTasksForGateAudit
  // is empty ⇒ the End-state-only seat runs. It is EXEMPT from D2 (no observed tip) but gets D8's disjunct.
  const endStateEsc = (verdict) => (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: {} }
    if (seat === 'war-auditor') {
      // Only the End-state-only seat matches (its prompt names the execution-evidence lens).
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('end-state')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict, findings: [], confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const ES_ARGS = (verdict) => PROVISION_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ['condition A holds at the tip'] },
    tasks: [{ id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }], requiresTest: false }],
  })
  const { out: held, calls } = await runPhase(ES_ARGS('escalate'), endStateEsc('escalate'))
  // Guard: the end-state-only seat actually ran (empty per-task merge set).
  assert.ok(calls.some(c => (c.opts.label || '').includes('end-state')), 'the End-state-only seat was dispatched (empty per-task merge set)')
  assert.equal(held.landDecision, 'held:escalation',
    'a finding-less End-state-only escalate holds the land (D8 disjunct on the end-state seat)')
  assert.ok((held.escalated || []).some(e => e && e.reason === 'gate-evidence' && String(e.task).includes('end-state')),
    'the end-state gate-evidence escalation is recorded')
  const { out: ok } = await runPhase(ES_ARGS('approve'), endStateEsc('approve'))
  assert.equal(ok.landDecision, 'landed', 'a finding-less End-state approve control lands')
})

test('T1.3 (D2) — auditPrompt carries the AUDIT PIN line naming the worker head_sha; a malformed/absent pin threads no line (fail-open)', async () => {
  const isWorkAudit = (c) => isAuditor(c) && !c.prompt.includes('execution-evidence')
  // Well-formed pin ('deadbeef' from defaultImpl) ⇒ the AUDIT PIN line is present and names the sha.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wa = calls.find(isWorkAudit)
  assert.ok(wa, 'a work-wave audit seat was dispatched')
  assert.match(wa.prompt, /AUDIT PIN:/, 'the work-wave auditPrompt carries the AUDIT PIN line')
  assert.ok(wa.prompt.includes('deadbeef'), 'the AUDIT PIN line names the worker head_sha (deadbeef)')
  assert.match(wa.prompt, /return the sha you actually reviewed as `audit_sha`/,
    'the AUDIT PIN line requires the seat to echo the reviewed sha as audit_sha')

  // Fail-open: a malformed head_sha is not a well-formed SHA ⇒ NO pin threaded ⇒ NO AUDIT PIN line.
  const badPin = (prompt, opts) => seatOf(opts) === 'war-worker'
    ? { task_id: 't', status: 'implemented', head_sha: 'not-a-sha', tests: { unit: 1 } }
    : defaultImpl(prompt, opts)
  const { calls: c2 } = await runPhase(PROVISION_ARGS(), badPin)
  const wa2 = c2.find(isWorkAudit)
  assert.ok(wa2, 'a work-wave audit seat was dispatched (malformed-pin run)')
  assert.ok(!wa2.prompt.includes('AUDIT PIN:'),
    'a malformed head_sha threads no pin ⇒ no AUDIT PIN line (fail-open, byte-compatible)')
})

// ===========================================================================
// Task 2.1 (#649) — evidence-pipeline wiring: post-merge evidence dispatch,
// artifact capture (D5), integrated-tip re-run + authoritative seat (D4),
// pin-status/guard token consumption (D1), release-baseline clause (D3),
// and the standing auditor/refiner duty mirrors (D6/D7).
// ===========================================================================

// Faithful evidence-dispatch mock: returns an EVIDENCE_RESULT for the evidence:phase-<id> dispatch
// (perTask tokens + integratedTipGate), CONFIRMED tips (observedHead == the merge integration_sha 'aaaa1111'
// so the seats' audit_sha matches the pin — no demotion, happy-path land). Merge returns a per-task
// gate_log_path so the artifact-path threading is observable.
const evidenceImpl = (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return {
    perTask: [
      { taskId: 't1', pin_status: 'CONFIRMED', pin_evidence: 'tip == gate-HEAD', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
      { taskId: 't2', pin_status: 'BENIGN-ADVANCE', pin_evidence: 'intervening: docs/readme.md', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
    ],
    integratedTipGate: { gate_output: 'INTEGRATED TIP GATE: all suites passed', tip_sha: 'aaaa1111' },
  }
  if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high', audit_sha: 'aaaa1111' }
  if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
  if (seat === 'war-refiner') {
    const m = /^merge:(t\d)/.exec(label)
    return { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'aaaa1111',
      gate_log_path: m ? `/abs/repo/.claude/worktrees/run-2026/_refinery/.war/gate-${m[1]}.log` : undefined }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}

test('T2.1 criterion 2 (D1) — gate-audit seat CONSUMES the stamped PIN STATUS token; the mandatory hand-run cat-file→rev-parse recipe is GONE (spot-verify stays optional)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)
  const p = gateAuditCalls(calls)[0].prompt
  // token consumption present
  assert.ok(p.includes('PIN STATUS:'), 'the gate-audit prompt threads a PIN STATUS token')
  assert.ok(p.includes('Consume the stamped token; do NOT reconstruct the proof'),
    'the seat is told to consume the stamped token, not reconstruct the proof')
  assert.ok(p.includes('CONFIRMED'), 'the CONFIRMED/BENIGN-ADVANCE ⇒ HARD-at-tip semantics are stated')
  // the mandatory hand-run recipe framings are DELETED (delete-and-trace: restoring the recipe fails these)
  assert.ok(!p.includes('First, validate the gate-HEAD pin is a real object'),
    'the mandatory cat-file recipe framing is deleted')
  assert.ok(!p.includes('Then confirm your evidence is pinned to the integration tip'),
    'the mandatory rev-parse-compare recipe framing is deleted')
  assert.ok(!p.includes('and compare the printed sha against the gate-HEAD sha'),
    'the hand-run compare instruction is deleted')
  // an OPTIONAL read-only spot-verify is permitted (the plan explicitly allows the verbs)
  assert.ok(/MAY spot-verify with a SINGLE read-only/.test(p), 'a read-only spot-verify is permitted but optional')
})

test('T2.1 criterion 6 (D5) — the gate-audit seat carries the captured-artifact path + missing-artifact⇒SOFT rule; the merge tees to .war/gate-<taskId>.log and returns gate_log_path; the anti-excerpt prose is gone from ALL surfaces', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)
  const ga = gateAuditCalls(calls)[0].prompt
  assert.ok(ga.includes('GATE LOG ARTIFACT:'), 'the gate-audit prompt threads the captured gate-log artifact')
  assert.ok(ga.includes('/_refinery/.war/gate-t1.log'), 'the threaded artifact path is the merge-returned gate_log_path')
  assert.ok(/MISSING artifact[\s\S]*SOFT cannot-confirm/.test(ga), 'a missing artifact ⇒ SOFT cannot-confirm for the HARD path')
  assert.ok(/authoritative execution evidence/i.test(ga), 'the captured artifact is the authoritative HARD-path evidence')
  // the initial merge prompt tees to the artifact and returns gate_log_path
  const mergeCall = calls.find(c => seatOf(c.opts) === 'war-refiner' && /^merge:t1$/.test(c.opts.label || ''))
  assert.ok(mergeCall, 'a merge dispatch for t1 was made')
  assert.ok(/tee the FULL step-2 gate stdout\+stderr to .*\.war\/gate-t1\.log/.test(mergeCall.prompt),
    'the merge prompt tees the full gate output to the .war artifact')
  assert.ok(mergeCall.prompt.includes('gate_log_path'), 'the merge prompt returns the artifact path in gate_log_path')
  // MERGE_RESULT schema declares gate_log_path
  assert.match(src, /gate_log_path:\s*\{\s*type:\s*'string'\s*\}/, 'MERGE_RESULT declares gate_log_path')
  // the retired anti-excerpt prose is ABSENT from all population surfaces (both dispatched merge prompts + standing file)
  assert.ok(!src.includes('Do NOT curate or excerpt'),
    'the anti-excerpt prose is gone from ALL workflow-template.js dispatched prompts (replaced by the capture clause)')
  assert.ok(!refinerMd.includes('curate or excerpt'), 'the anti-excerpt prose is gone from war-refiner.md step 7')
  const captureUses = (src.match(/gateCaptureClause\(refineryPath, r\.task\.id\)/g) || []).length
  assert.equal(captureUses, 2, 'the gate-capture clause replaces the anti-excerpt prose at BOTH dispatched merge sites (initial + floor-retry)')
})

test('T2.1 criterion 6 (D5) — fail-open: absent artifact + absent pin token ⇒ the SOFT cannot-confirm rule is still in the prompt and the phase still LANDS (never a hold)', async () => {
  // Evidence dispatch returns a bare {} (no perTask), merge returns no gate_log_path ⇒ both tokens absent.
  const failOpen = (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && /^evidence:/.test(label)) return {}
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'aaaa1111' } // no gate_log_path
    return gateAuditImpl(prompt, opts)
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), failOpen)
  const p = gateAuditCalls(calls)[0].prompt
  assert.ok(p.includes('(no pin-status token — the evidence dispatch produced none)'),
    'an absent pin token renders the fail-open placeholder, not "undefined"')
  assert.ok(p.includes('(no gate-log artifact path recorded)'), 'an absent artifact renders the fail-open placeholder')
  assert.ok(!p.includes('undefined'), 'the fail-open prompt never contains the literal "undefined"')
  assert.ok(/MISSING artifact[\s\S]*SOFT cannot-confirm/.test(p), 'the missing-artifact⇒SOFT rule is present even when everything is absent')
  assert.equal(out.landDecision, 'landed', 'fail-open: no tokens ⇒ no hold, the phase lands')
})

test('T2.1 criterion 4 (D3) — the release-baseline / stacked-lag clause is on BOTH surfaces (emitted auditPrompt + war-auditor.md), case-insensitive mid-sentence', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const wa = calls.find(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(wa, 'a work-wave audit seat was dispatched')
  // emitted auditPrompt surface
  assert.ok(/expected stacked-release lag, not a scope error/i.test(wa.prompt),
    'the emitted auditPrompt carries the stacked-release-lag clause (mid-sentence, grep -i)')
  assert.ok(wa.prompt.includes('${integrationBranch}...${task.branch}'),
    'the emitted auditPrompt names the three-dot merge-base baseline literally')
  // standing surface (byte-identical body)
  assert.ok(/expected stacked-release lag, not a scope error/i.test(auditorMd),
    'war-auditor.md carries the byte-identical stacked-release-lag clause')
  assert.ok(auditorMd.includes('${integrationBranch}...${task.branch}'),
    'war-auditor.md names the three-dot merge-base baseline literally')
})

// Task 1.5 — the version-precedence / adjudication clause is on BOTH surfaces (emitted auditPrompt when
// adjudications are threaded + war-auditor.md standing card), anchored on a STABLE mid-sentence phrase
// (never a quote-bearing byte literal — the recorded anchor-fragility lesson).
test('Task 1.5 — the version-precedence adjudication clause is on BOTH surfaces (threaded auditPrompt + war-auditor.md), mid-sentence anchors', async () => {
  const adj = [{ adjudicated: '0.14.18', supersedes: '0.14.14' }, 'a bare preformatted adjudication row']
  const { calls } = await runPhase(PROVISION_ARGS({ adjudications: adj }), defaultImpl)
  const wa = calls.find(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(wa, 'a work-wave audit seat was dispatched')
  // emitted auditPrompt surface — mid-sentence anchors (no quote bytes)
  assert.ok(wa.prompt.includes('task instruction > red-team adjudication > plan body literal'),
    'the threaded auditPrompt carries the version-precedence ordering (mid-sentence anchor)')
  assert.ok(wa.prompt.includes('a value matching the adjudication is correct even when it differs from the plan body literal'),
    'the threaded auditPrompt carries the adjudication-wins clause (mid-sentence anchor)')
  // the threaded rows render below the clause
  assert.ok(wa.prompt.includes('0.14.18 (supersedes plan literal: 0.14.14)'),
    'an object row renders adjudicated value + superseded plan literal')
  assert.ok(wa.prompt.includes('a bare preformatted adjudication row'),
    'a string row renders verbatim')
  // standing surface (byte-identical sentence body)
  assert.ok(auditorMd.includes('task instruction > red-team adjudication > plan body literal'),
    'war-auditor.md carries the byte-identical version-precedence ordering')
  assert.ok(auditorMd.includes('a value matching the adjudication is correct even when it differs from the plan body literal'),
    'war-auditor.md carries the byte-identical adjudication-wins clause')
})

test('Task 1.5 back-compat — empty/absent adjudications ⇒ NO version-precedence clause and a byte-identical auditPrompt to today', async () => {
  const seatP = calls => (calls.find(c => isAuditor(c) && !c.prompt.includes('execution-evidence')) || {}).prompt
  const { calls: absent } = await runPhase(PROVISION_ARGS(), defaultImpl)              // arg entirely absent
  const { calls: empty } = await runPhase(PROVISION_ARGS({ adjudications: [] }), defaultImpl)  // empty array
  const pAbsent = seatP(absent), pEmpty = seatP(empty)
  assert.ok(pAbsent && pEmpty, 'both runs dispatched a work-wave audit seat')
  assert.ok(!pAbsent.includes('VERSION-PRECEDENCE RULE'),
    'no adjudications ⇒ the version-precedence clause is absent (back-compat)')
  assert.equal(pEmpty, pAbsent,
    'an empty adjudications array yields a byte-identical prompt to the arg-absent run')
  // Delete-and-trace: with adjudications threaded, the same seat DOES carry the clause (proves the
  // control is meaningful, not vacuously passing because the clause never emits).
  const { calls: threaded } = await runPhase(PROVISION_ARGS({ adjudications: ['x'] }), defaultImpl)
  assert.ok(seatP(threaded).includes('VERSION-PRECEDENCE RULE'),
    'threading a non-empty adjudications array DOES emit the clause (delete-and-trace)')
})

test('T2.1 criterion 5 (D4) — an INTRA-PHASE-DEP phase: the evidence dispatch re-runs the integrated tip AND one authoritative execution-evidence seat consumes it', async () => {
  // PROVISION_ARGS: t2 deps t1, both superproject ⇒ intra-dep.
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)
  const ev = calls.find(c => seatOf(c.opts) === 'war-refiner' && /^evidence:phase-/.test(c.opts.label || ''))
  assert.ok(ev, 'an evidence:phase-<id> refiner dispatch was made')
  assert.ok(/INTRA-PHASE-DEP phase/.test(ev.prompt), 'the intra-dep phase instructs the integrated-tip gate re-run')
  assert.ok(ev.prompt.includes('gate-phase-3.log'), 'the integrated-tip re-run tees to gate-phase-<id>.log')
  const auth = calls.find(c => isAuditor(c) && /:integrated-tip$/.test(c.opts.label || ''))
  assert.ok(auth, 'ONE authoritative integrated-tip execution-evidence seat was dispatched')
  assert.ok(auth.prompt.includes('INTEGRATED TIP GATE: all suites passed'),
    'the authoritative seat consumes the integrated-tip captured gate output')
  assert.ok(/LAND-AUTHORITATIVE/.test(auth.prompt), 'the authoritative seat is told the integrated-tip run is land-authoritative')
})

test('T2.1 criterion 5 (D4) — a NO-intra-dep phase dispatches no integrated-tip re-run and no authoritative seat; its per-task gate-audit prompts are byte-identical to the intra-dep phase', async () => {
  const noDepTasks = [
    { id: 't1', issue: 101, title: 'T1', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'T2', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },  // NO deps
  ]
  const { calls: noDep } = await runPhase(PROVISION_ARGS({ tasks: noDepTasks }), evidenceImpl)
  const ev = noDep.find(c => seatOf(c.opts) === 'war-refiner' && /^evidence:phase-/.test(c.opts.label || ''))
  assert.ok(ev, 'the evidence dispatch still runs (pin-status + guard-specificity per task)')
  assert.ok(/No intra-phase same-repo dep edge/.test(ev.prompt), 'a no-dep phase instructs NO integrated-tip re-run')
  assert.ok(!/INTRA-PHASE-DEP phase/.test(ev.prompt), 'the intra-dep re-run clause is absent on a no-dep phase')
  assert.ok(!noDep.some(c => /:integrated-tip$/.test(c.opts.label || '')), 'NO authoritative integrated-tip seat on a no-dep phase')
  // per-task gate-audit prompts byte-identical to the intra-dep phase (same tasks + same stamped tokens)
  const depTasks = noDepTasks.map((t, i) => i === 1 ? { ...t, deps: ['t1'] } : t)
  const { calls: dep } = await runPhase(PROVISION_ARGS({ tasks: depTasks }), evidenceImpl)
  const perTaskGA = cs => cs.filter(c => isAuditor(c) && /^gate-audit:t\d:execution-evidence$/.test(c.opts.label || '')).map(c => c.prompt).sort()
  assert.deepEqual(perTaskGA(noDep), perTaskGA(dep),
    'per-task gate-audit prompts are byte-identical between no-dep and intra-dep phases (D4 only ADDS the authoritative seat)')
})

test('T2.1 (D1×D2) — the stamped observedHead drives pin-equality: a BENIGN-ADVANCE seat whose audit_sha == observedHead (≠ gateHeadSha) stays HARD; without the stamp it would demote (delete-and-trace)', async () => {
  // gateHeadSha 'aaaa1111', observed tip 'bbbb2222' (BENIGN-ADVANCE). The seat returns audit_sha == the
  // observed tip and a Critical finding. WITH the stamp, pin == observedHead == audit_sha ⇒ no demotion ⇒ HARD hold.
  const stamped = (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-refiner' && /^evidence:/.test(label)) return {
      perTask: [{ taskId: 't1', pin_status: 'BENIGN-ADVANCE', observedHead: 'bbbb2222', guard_specificity: 'covered' },
                { taskId: 't2', pin_status: 'BENIGN-ADVANCE', observedHead: 'bbbb2222', guard_specificity: 'covered' }] }
    if (seat === 'war-auditor') {
      if (label.includes('execution-evidence')) return { seat: label, lens: 'execution-evidence', verdict: 'escalate',
        findings: [{ severity: 'Critical', title: 'mapped test provably unrun', file: 'x.test.js', rationale: 'absent' }], confidence: 'high', audit_sha: 'bbbb2222' }
      return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'aaaa1111' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out: held } = await runPhase(PROVISION_ARGS(), stamped)
  assert.equal(held.landDecision, 'held:escalation',
    'audit_sha == the stamped observedHead ⇒ NOT a mismatch ⇒ the Critical stays HARD (BENIGN-ADVANCE is not demoted)')
  // Delete-and-trace: WITHOUT the stamp (evidence returns no perTask), observedHead falls back to gateHeadSha
  // 'aaaa1111'; audit_sha 'bbbb2222' != 'aaaa1111' ⇒ MISMATCH ⇒ demoted to SOFT ⇒ the phase LANDS.
  const unstamped = (prompt, opts) => seatOf(opts) === 'war-refiner' && /^evidence:/.test(opts.label || '')
    ? {} : stamped(prompt, opts)
  const { out: lands } = await runPhase(PROVISION_ARGS(), unstamped)
  assert.equal(lands.landDecision, 'landed',
    'without the stamped observedHead the same seat mismatches gateHeadSha and demotes to SOFT — proving the stamp is load-bearing')
})

test('T2.1 both-surfaces — the refiner post-merge evidence-dispatch duty is in war-refiner.md AND the emitted evidence-dispatch prompt', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)
  const ev = calls.find(c => seatOf(c.opts) === 'war-refiner' && /^evidence:phase-/.test(c.opts.label || ''))
  assert.ok(ev, 'the evidence dispatch fired')
  // dispatched surface
  assert.ok(ev.prompt.includes('gate-pin-status.sh'), 'the evidence dispatch runs gate-pin-status.sh')
  assert.ok(ev.prompt.includes('assert-guard-specificity-in-diff.sh'), 'the evidence dispatch runs assert-guard-specificity-in-diff.sh')
  assert.ok(ev.prompt.includes('preMergeTip'), 'the evidence dispatch threads the fast-forward preMergeTip base')
  assert.ok(ev.prompt.includes('--mapped'), 'the pin-status call passes the task-own --mapped set')
  // standing surface
  assert.ok(refinerMd.includes('Post-merge evidence dispatch'), 'war-refiner.md carries the post-merge evidence-dispatch section')
  assert.ok(refinerMd.includes('gate-pin-status.sh') && refinerMd.includes('assert-guard-specificity-in-diff.sh'),
    'war-refiner.md names both floor scripts')
  assert.ok(/fast-forward/.test(refinerMd), 'war-refiner.md states the fast-forward pre-merge-base idiom')
})

test('T2.1 both-surfaces — the execution-evidence checklist + guard-specificity duty live in war-auditor.md (standing surface); the stale spawn-prompt-only sentence is updated', () => {
  assert.ok(auditorMd.includes('gate-audit checklist'), 'war-auditor.md has the named execution-evidence gate-audit checklist')
  assert.ok(/delete-and-trace/i.test(auditorMd), 'the checklist carries the mandatory delete-and-trace / temp-break-RED duty')
  assert.ok(/Pair every positive assertion with a negative absence assert/i.test(auditorMd),
    'the checklist carries the pair-positive-with-negative-absence duty')
  assert.ok(auditorMd.includes('Consume the stamped `pin_status`'), 'the checklist directs consuming the stamped pin_status')
  assert.ok(/missing artifact ⇒ SOFT/i.test(auditorMd), 'the checklist carries the missing-artifact ⇒ SOFT rule')
  // test-fidelity lens duties (D6/D7 judgment side)
  assert.ok(auditorMd.includes('Guard-assertion specificity'), 'the test-fidelity lens carries the guard-assertion-specificity duty')
  assert.ok(auditorMd.includes('Guard-masking'), 'the test-fidelity lens carries the guard-masking flag')
  // the stale reserved-lens sentence ("instructions arrive in those passes' spawn prompts") is updated
  assert.ok(!auditorMd.includes("their instructions arrive in those passes' spawn prompts and in the Submodule pre-flight above"),
    'the stale "arrive in spawn prompts" sentence was updated (the checklist now lives in the standing file)')
})

test('T2.1 (D1/D8) — the escalate reservation ("NEVER escalate" on a cannot-confirm) is on BOTH gate-audit prompt sites: per-task AND end-state-only', async () => {
  // per-task site
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)
  const perTask = gateAuditCalls(calls).find(c => /^gate-audit:t\d:execution-evidence$/.test(c.opts.label || ''))
  assert.ok(perTask, 'a per-task gate-audit seat was dispatched')
  assert.ok(/NEVER 'escalate'/.test(perTask.prompt), 'the per-task prompt reserves escalate away from the cannot-confirm case')
  // end-state-only site (requiresTest:false ⇒ empty per-task merge set ⇒ end-state-only seat)
  const esArgs = PROVISION_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ['condition A holds at the tip'] },
    tasks: [{ id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }], requiresTest: false }],
  })
  const { calls: esCalls } = await runPhase(esArgs, gateAuditImpl)
  const es = esCalls.find(c => (c.opts.label || '').includes('end-state'))
  assert.ok(es, 'the end-state-only seat was dispatched')
  assert.ok(/NEVER 'escalate'/.test(es.prompt), 'the end-state-only prompt reserves escalate away from the cannot-confirm case')
})

// ===========================================================================
// D2 — MIRROR REGISTRY (drift-guards-for-mirrored-and-asserted-facts, ADR 0025)
// ---------------------------------------------------------------------------
// Every value/helper the Workflow sandbox mirrors inline in workflow-template.js (it cannot import) is
// bound here to its canonical export, one equality assertion per row. Const rows deepEqual/subset parsed
// literals; helper rows assert BEHAVIORAL equivalence on an enumerated fixture-input set — function
// mirrors legitimately differ in whitespace/comments, so behavior (not bytes) is what must not drift.
// The inline `spawn` is a CURRIED `role => …` closing over `agents` with a ROLE_MODEL fallback, so its
// canonical side adapts inputs to `spawnOpts(config, role)`.
// ponytail: this registry IS the deliberate ceiling — a new inline mirror lands its row here in the same
// task (the /war-strategy new-mirror authoring rule), never an AST scanner.

const parseInlineArray = (re) => {
  const m = src.match(re)
  assert.ok(m, `inline array literal not found for ${re}`)
  return JSON.parse(m[1].replace(/'/g, '"'))
}
// All distinct 'landed'/'held:*' string literals in the template's EXECUTABLE code (comments stripped so
// a prose example can't count). landDecision is assigned 6 of the 7 KNOWN values (never the Lead-only
// 'held:phase-incomplete'), with no single inline array to deepEqual — hence the subset check.
// ponytail: whole-file literal scan is the ceiling; a '//' inside a code string could truncate a line,
// but no landDecision literal sits after one in this file — good enough, no tokenizer.
const extractLandDecisionLiterals = () => {
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
  return [...new Set([...code.matchAll(/'(landed|held:[a-z0-9-]+)'/g)].map(m => m[1]))]
}
// Eval the inline roster-helper mirror block (defined INSIDE the template fn body) in isolation, with an
// injected `agents` (the only free var the inline `spawn` closes over). Exposes the four inline helpers.
const inlineHelperBlock = (() => {
  const s = src.indexOf('const ROLE_MODEL =')
  const e = src.indexOf('const defaultRoster')
  return { ok: s !== -1 && e > s, block: s !== -1 && e > s ? src.slice(s, e) : '' }
})()
const inlineHelpers = (agents = {}) =>
  new Function('agents', inlineHelperBlock.block + '\nreturn { spawn, validateRoster, widenRoster, resolveWidenSource }')(agents)

const AGENTS_FIXTURES = [
  {},                                                                          // all omitted → ROLE_MODEL/DEFAULTS fallback
  { worker: { model: 'sonnet', effort: 'high' }, auditor: { model: 'fable', effort: 'default' },
    refiner: { model: 'opus' }, servitor: { model: 'haiku', effort: 'max' } }, // explicit mix
  { worker: { effort: 'low' } },                                               // effort only, model omitted
  { auditor: { model: 'sonnet', effort: 'default' } },                         // effort:'default' ⇒ omitted
]
const RTRIO = [
  { lens: 'correctness', depth: 'deep' },
  { lens: 'cascading-impact', depth: 'deep' },
  { lens: 'plan-faithfulness', depth: 'deep' },
]
const VALIDATE_ROSTER_CASES = [
  [{ lens: 'correctness' }],                                                   // valid 1-seat
  [{ lens: 'correctness', depth: 'deep' }, { lens: 'security', depth: 'neighbors' }], // valid 2-seat
  [],                                                                          // too few
  [{ lens: 'a' }, { lens: 'b' }, { lens: 'c' }, { lens: 'd' }, { lens: 'e' }, { lens: 'f' }], // too many (6)
  'not-an-array',                                                              // non-array
  [{ depth: 'deep' }],                                                         // missing lens
  [{ lens: 'x' }, { lens: 'x' }],                                              // duplicate lens
  [{ lens: 'x', depth: 'sideways' }],                                          // bad depth
  [null],                                                                      // null seat
  [{ lens: '' }],                                                              // empty lens
]
const WIDEN_ROSTER_CASES = [
  [[{ lens: 'a' }], RTRIO],                                                     // union append
  [[{ lens: 'a' }, { lens: 'b' }, { lens: 'c' }, { lens: 'd' }, { lens: 'e' }], [{ lens: 'f' }]], // cap 5
  [[{ lens: 'correctness' }], RTRIO],                                          // dedup by lens
  [[{ lens: 'a' }], []],                                                       // empty default
  [[{ lens: 'a' }], undefined],                                                // undefined default
]
const RESOLVE_WIDEN_CASES = [
  [['security', 'cascading-impact'], RTRIO],                                   // valid nomination
  [['security', 'execution-evidence'], RTRIO],                                 // reserved lens → default
  [['dup', 'dup'], RTRIO],                                                     // duplicate → default
  [[], RTRIO],                                                                 // empty → default
  ['nope', RTRIO],                                                             // non-array → default
  [null, RTRIO],                                                               // null → default
  [[''], RTRIO],                                                               // empty string → default
]

test('D2 mirror registry — every inline sandbox mirror in workflow-template.js equals its canonical export', () => {
  assert.ok(inlineHelperBlock.ok, 'the inline roster-helper mirror block is locatable in src (const ROLE_MODEL .. const defaultRoster)')
  const MIRROR_REGISTRY = [
    { name: 'HARD_ESCALATION_REASONS', mode: 'deepEqual',
      canonical: HARD_ESCALATION_REASONS,
      extractInline: () => parseInlineArray(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/) },
    { name: 'landDecision known set', mode: 'subset',
      canonical: KNOWN_LAND_DECISIONS,
      extractInline: extractLandDecisionLiterals },
    { name: 'spawnOpts (inline curried spawn=role=>…)', mode: 'behavioral',
      cases: AGENTS_FIXTURES.flatMap(a => ROLES.map(r => [a, r])),
      inline: ([agents, role]) => inlineHelpers(agents).spawn(role),
      canonical: ([agents, role]) => spawnOpts({ agents }, role) },
    { name: 'validateRoster', mode: 'behavioral',
      cases: VALIDATE_ROSTER_CASES.map(r => [r]),
      inline: ([roster]) => inlineHelpers().validateRoster(roster),
      canonical: ([roster]) => validateRoster(roster) },
    { name: 'widenRoster', mode: 'behavioral',
      cases: WIDEN_ROSTER_CASES,
      inline: ([roster, def]) => inlineHelpers().widenRoster(roster, def),
      canonical: ([roster, def]) => widenRoster(roster, def) },
    { name: 'resolveWidenSource', mode: 'behavioral',
      cases: RESOLVE_WIDEN_CASES,
      inline: ([nom, def]) => inlineHelpers().resolveWidenSource(nom, def),
      canonical: ([nom, def]) => resolveWidenSource(nom, def) },
  ]
  assert.ok(MIRROR_REGISTRY.length >= 6, 'the mirror registry lists at least the six required rows (HARD_ESCALATION_REASONS, landDecision, and the four roster helpers)')
  for (const row of MIRROR_REGISTRY) {
    if (row.mode === 'deepEqual') {
      const inline = row.extractInline()
      assert.deepEqual([...inline].sort(), [...row.canonical].sort(),
        `${row.name}: inline mirror deepEquals the canonical export (order-insensitive)`)
    } else if (row.mode === 'subset') {
      const inline = row.extractInline()
      assert.ok(inline.length >= 6,
        `${row.name}: the extractor found at least the 6 emitted literals (sanity — got ${JSON.stringify(inline)})`)
      for (const v of inline) {
        assert.ok(row.canonical.includes(v), `${row.name}: inline literal '${v}' is a member of the canonical known set`)
      }
    } else {
      for (const args of row.cases) {
        assert.deepEqual(row.inline(args), row.canonical(args),
          `${row.name}: inline and canonical agree on ${JSON.stringify(args)}`)
      }
    }
  }
})

// ===========================================================================
// D3 — BOTH-SURFACES DIRECTIVE REGISTRY (ADR 0025)
// ---------------------------------------------------------------------------
// Each correctness-critical directive duplicated across a standing agents/*.md card and its dispatched
// prompt(s). Token-anchored, case-tolerant — never full-line bytes (the surfaces phrase the shared
// discipline differently). Includes rows asserted against the INLINE gate-audit seat prompts
// (execution-evidence + end-state) sliced from template src — those sit OUTSIDE auditPrompt(), so a base
// auditPrompt clause never reaches them; they inherit a shared directive only via the standing card.
// ponytail: this registry IS the deliberate ceiling — a new both-surfaces directive lands its row here in
// the same task (the /war-strategy new-mirror authoring rule), never an AST scanner.
const sliceSrc = (startTok, endTok) => {
  const s = src.indexOf(startTok)
  const e = src.indexOf(endTok, s)
  assert.ok(s !== -1 && e > s, `src slice "${startTok}" .. "${endTok}" is locatable`)
  return src.slice(s, e)
}

test('D3 — both-surfaces directive registry: every correctness-critical directive is on its standing card AND its dispatched prompt(s)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const workerP = (calls.find(isWorker) || {}).prompt
  const auditP = (calls.find(c => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:')) || {}).prompt
  const servitorP = (calls.find(isServitor) || {}).prompt
  assert.ok(workerP && auditP && servitorP, 'worker, regular auditor, and servitor prompts all dispatched (presence guard)')
  // The two inline gate-audit seat prompts sit OUTSIDE auditPrompt() — slice them from src by construct.
  const gateAuditExecSrc = sliceSrc('POST-MERGE GATE-AUDIT', 'gate-audit:${taskId}:execution-evidence')
  const gateAuditEndStateSrc = sliceSrc('END-STATE-ONLY GATE-AUDIT', 'gate-audit:phase-${ph.id}:end-state')

  const REGISTRY = [
    { name: 'servitor memory discipline (mutation-guard + recurrence-flow + absolute files_written)',
      surfaces: [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]],
      anchors: [/metadata\.provenance/i, /user-authored/i, /never edit/i, /same slug/i, /overwrite/i,
                /files_written[\s\S]{0,120}absolute|absolute[\s\S]{0,120}files_written/i] },
    { name: 'ADR policy-table under-attribution (D8)',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/ADR/i, /policy.table/i, /attribution/i] },
    { name: 'comment-lag review duty (D9, auditor cascading-impact)',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/comment/i, /lag/i, /retired/i] },
    { name: 'mechanism-style narrative (D12)',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/invariant/i, /guard that holds/i, /snapshot|line.number/i] },
    { name: 'preset-matrix consumption (D6)',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/preset/i, /matrix/i] },
    { name: 'gate-audit inline seat: finding-less escalate is a HARD hold (execution-evidence + end-state, outside auditPrompt)',
      surfaces: [['war-auditor.md', auditorMd],
                 ['inline gate-audit execution-evidence seat (src)', gateAuditExecSrc],
                 ['inline gate-audit end-state seat (src)', gateAuditEndStateSrc]],
      anchors: [/finding-less/i, /HARD hold/i] },
    { name: 'comment-lag directive (D9, worker prompt)',
      surfaces: [['war-worker.md', workerMd], ['worker prompt', workerP]],
      anchors: [/comment/i, /lag/i, /retired/i] },
    // Task 1.4 (capture grounding): the servitor finding-match clause lives in D3 on the standing card AND
    // in the D3 block of the memClause-built Wrap-up prompt — both must carry it (spec criterion 7).
    { name: 'servitor finding-match check (audit-log-sourced facts ground on the landed tip)',
      surfaces: [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]],
      anchors: [/finding-match/i, /named construct/i, /pattern, not live instance/i, /agent-unverified/i] },
    // Task 1.4 (capture grounding): the auditor committed-tree-grounding clause lives on the standing card
    // AND in the auditPrompt()-built dispatched prompt — both must carry it (spec criterion 8).
    { name: 'auditor committed-tree grounding for no-op claims (git show <audit_sha>:<path>, grep advisory)',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/committed-tree grounding/i, /verify-and-close/i, /git show <audit_sha>:<path>/i, /advisory only/i, /git grep/i] },
  ]
  assert.ok(REGISTRY.length >= 8, 'the registry lists the migrated servitor row, the D8/D9/D12/D6 duties, the gate-audit seat row, and the two Task 1.4 capture-grounding rows')
  for (const row of REGISTRY) {
    for (const [sName, sText] of row.surfaces) {
      for (const re of row.anchors) {
        assert.match(sText, re, `${row.name}: "${sName}" carries ${re}`)
      }
    }
  }
  // Servitor-migration completeness (migrated from the former T1 both-surfaces test): the standing card
  // shed the retired routing tokens, and the template args header no longer describes learningsTarget loosely.
  assert.doesNotMatch(servitorMd, /phase-<N>\.md/i, 'war-servitor.md no longer names the phase-<N>.md aggregate file')
  assert.doesNotMatch(servitorMd, /else:\s*append|else\b.{0,20}append to/i, 'war-servitor.md no longer carries an "else: append" routing arm')
  assert.doesNotMatch(src, /memory dir or docs\/learnings/i, 'template args header no longer says "(memory dir or docs/learnings/)"')
})
