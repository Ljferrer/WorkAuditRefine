import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { HARD_ESCALATION_REASONS, KNOWN_LAND_DECISIONS, SOFT_ENV_REASONS } from './land-decision.mjs'
import { spawnOpts, validateRoster, widenRoster, resolveWidenSource, resolveGate, ROLES, DEFAULTS } from './war-config.mjs'
import { extractInterpolations, extractArgsFields, EXEMPT_FIELDS } from './assert-args-complete.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const auditorMd = readFileSync(join(here, '../../../agents/war-auditor.md'), 'utf8')
// UNION surface (prompt-surface simplification, adjudication I): Task 3.1 evicted the guard-contract
// teach prose from the card into this reference file — every OLD-absent key over the card scans it too.
const auditorTeachMd = readFileSync(join(here, '../references/auditor-teach.md'), 'utf8')
const refinerMd = readFileSync(join(here, '../../../agents/war-refiner.md'), 'utf8')
// UNION/relocated surface (prompt-surface simplification, adjudications E+I): Task 4.1 evicted the
// submodule-as-repo provisioning recipe, the superproject reland discrimination (land step 3), and the
// 2A/2B submodule land arms from the card into this reference file — presence keys over the moved text
// relocate their read here; every OLD-absent key over the card scans it too.
const refinerRecoveryMd = readFileSync(join(here, '../references/refiner-recovery.md'), 'utf8')
// UNION surface (prompt-surface simplification, adjudication I): Task 5.1 evicted the worker/servitor
// tier>=2 blocks from the cards into this reference file — every OLD-absent key over the card scans it too.
const edgesMd = readFileSync(join(here, '../references/worker-servitor-edges.md'), 'utf8')
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
// #1913 seat defaults. The wave-side ace tip's PIN-12 gate check (dispatchKind 'ace-gate') and the
// merge slot's pin-transfer probe (dispatchKind 'pin-transfer') are refiner seats with their OWN
// schemas, so the many fixtures that answer "any Refine-phase refiner" with a MergeResult would feed
// them a shape they cannot read. The harness normalizes ONLY non-conforming answers: a fixture that
// returns a conforming shape drives the seat exactly as it wrote it, and every other fixture gets the
// neutral default — a green ace gate, and a fail-open pin-transfer probe whose ordinary merge dispatch
// then runs unchanged. PIN_TRANSFER's status enum is mirrored here; the drift-guard test below pins it.
const PIN_TRANSFER_STATUSES = ['transferred', 'mismatch', 'already_upstream', 'empty-unmatched', 'conflict', 'error']
const NEW_SEAT_DEFAULTS = {
  // A green gate at the ace tip, and a fail-open pin-transfer probe whose caller then runs the
  // ordinary merge dispatch unchanged — so every pre-#1913 fixture behaves exactly as it did.
  'ace-gate': { gate_green: true },
  'pin-transfer': { status: 'error' },
}
// runPhase(args, agentImpl, seats): `seats` drives the two #1913 refiner seats — a value, or a
// (prompt, opts) function. They are answered from `seats`, never from agentImpl, precisely because the
// existing fixtures answer "any Refine-phase refiner" with a MergeResult (several by COUNTING merge
// calls); routing the new seats through them would feed a shape they cannot read and consume their
// counters. The dispatches are still recorded in `calls`, so ordering and prompt assertions see them.
const answerNewSeat = (seats, prompt, opts) => {
  const o = seats[opts.dispatchKind]
  return typeof o === 'function' ? o(prompt, opts) : (o ?? NEW_SEAT_DEFAULTS[opts.dispatchKind])
}

async function runPhase(args, agentImpl, seats = {}) {
  const calls = []
  const logs = []
  const fn = build()
  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts })
    if (opts.dispatchKind === 'ace-gate' || opts.dispatchKind === 'pin-transfer') return answerNewSeat(seats, prompt, opts)
    return agentImpl(prompt, opts)
  }
  const log = (m) => logs.push(m)
  const out = await fn(agent, fakeParallel, async () => [], log, () => {}, args, { total: null })
  return { out, calls, logs }
}

const seatOf = (opts) => (opts.agentType || '').split(':').pop()
const defaultImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  // Provision dispatches now return the ENV_OUTCOME shape: the git-topology barrier
  // (dispatchKind 'provision-barrier') AND the per-task provision-run (dispatchKind 'provision-run')
  // are both phase 'Provision', and the phase-close polish worktree (dispatchKind 'polish-worktree')
  // is phase 'Refine'. Default all three to { ok: true } so happy-path tests reach the worker / run the
  // sweep. Key on opts.dispatchKind — the stable discriminator, NOT a label-prefix regex (spec criterion 8).
  // (Tested BEFORE the generic refiner branch below.)
  if (seat === 'war-refiner' && (opts.dispatchKind === 'provision-barrier' || opts.dispatchKind === 'provision-run')) return { ok: true }
  if (seat === 'war-refiner' && opts.dispatchKind === 'polish-worktree') return { ok: true }
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
// isProvision keys on the stable dispatchKind discriminator (the phase git-topology BARRIER),
// never a label-prefix regex (spec criterion 8).
const isProvision = (c) => c.opts.dispatchKind === 'provision-barrier'
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
  // Strip LINE comments ONLY (dropped the block pass, #929). A block-comment strip
  // (/\/\*[\s\S]*?\*\//g) mis-reads the resolveGate discovery string's glob literals
  // ('*/node_modules/*' etc. carry /* and */) as block-comment delimiters and cascades over
  // executable code — deleting the refine/gate-audit/land core through the file's only real block
  // comment (/* the batch ace commit */). This site's tokens — run.provision / env-blocked /
  // setup-scout — live only in executable code and prose, never in a block comment, so line-only
  // is sufficient. NEW sensitivity of dropping the block pass: block-comment PROSE is now visible to
  // these asserts — in particular the negative `!setup-scout` assert would false-FAIL if a future
  // block comment carried `setup-scout` prose. The blockCommentSpans census below (near
  // MIRROR_REGISTRY) is the bound: any new block comment reds it and forces this re-check.
  const code = src.replace(/\/\/[^\n]*/g, '')
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
// per-task provision step is a refiner seat in phase 'Provision' carrying dispatchKind 'provision-run'.
// Keys on the stable dispatchKind discriminator, never a label-prefix regex (spec criterion 8).
const isProvisionRun = (c) => c.opts.dispatchKind === 'provision-run'
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

test('criterion 8 — the phase barrier and the per-task provision-run carry DISTINCT opts.dispatchKind', async () => {
  const { calls } = await runPhase(withProvision(), defaultImpl)
  const barrier = calls.find(isProvision)
  const provRun = calls.find(isProvisionRun)
  assert.ok(barrier, 'the git-topology barrier is dispatched (dispatchKind provision-barrier)')
  assert.ok(provRun, 'a per-task provision-run is dispatched (dispatchKind provision-run)')
  assert.equal(barrier.opts.dispatchKind, 'provision-barrier', 'barrier carries dispatchKind provision-barrier')
  assert.equal(provRun.opts.dispatchKind, 'provision-run', 'provision-run carries dispatchKind provision-run')
  // Distinctness — collapsing the two kinds to one literal fails this assert (delete-the-feature).
  assert.notEqual(barrier.opts.dispatchKind, provRun.opts.dispatchKind,
    'barrier and provision-run kinds are distinct (mocks/handlers/audits discriminate on dispatchKind, not the label)')
  // The mock + isProvision + isProvisionRun key on dispatchKind — no label-prefix regex survives in them.
  assert.ok(!/\/\^provision-run:/.test(defaultImpl.toString()), 'defaultImpl carries no provision-run label-prefix regex')
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
// A merge-task dispatch is a Refine-phase refiner seat that is NOT one of the phase's other
// Refine-phase refiner dispatches: the post-merge evidence seat, the phase-close polish worktree, and
// the #1913 pin-transfer probe (which rebases and measures patch-ids but never merges). Keyed on
// dispatchKind, the stable discriminator, never a label-prefix regex.
const isMergeTask = (c) =>
  seatOf(c.opts) === 'war-refiner' && c.opts.phase === 'Refine' &&
  !['pin-transfer', 'polish-worktree', 'evidence'].includes(c.opts.dispatchKind)
const isPinTransfer = (c) => c.opts.dispatchKind === 'pin-transfer'
const isAceGate = (c) => c.opts.dispatchKind === 'ace-gate'
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

// ---- Task 1.2 — terminal-else arm: a DEAD or unrouted land dispatch routes held:land-failed ----
// The load-bearing pair in (i)/(ii) is `landDecision` + the single `-land` escalation; delete the
// terminal else and `landDecision` reads the pre-dispatch 'landed' (the exact bug the feature closes).
test('Task 1.2 (i) — dead land agent: Land mock returns null → held:land-failed, one -land escalation reason error', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return null  // DEAD land agent — the observed transient-API 529 repro (run completed, landResult:null)
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed',
    'a null land result routes held:land-failed, NEVER the pre-dispatch landed')
  const landEsc = out.escalated.filter(e => e.task && e.task.endsWith('-land'))
  assert.equal(landEsc.length, 1, 'exactly one -land escalation pushed (single-push proof)')
  assert.equal(landEsc[0].reason, 'error', 'a null land result escalates with reason error')
  // Regression context (pre-existing behavior — the wrap-up gate already skips the servitor on a
  // non-landed result; green even without the arm, so NOT the load-bearing assertion).
  assert.equal(out.servitorResult, null, 'no servitor result on a dead land')
  assert.equal(calls.filter(c => seatOf(c.opts) === 'war-servitor').length, 0, 'zero war-servitor dispatches on a dead land')
})

test('Task 1.2 (ii) — unrouted land status: Land mock returns a bogus status → held:land-failed, never landed', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc' }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'merged' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'bogus' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed',
    'an unrecognized land status routes held:land-failed, never landed')
  const landEsc = out.escalated.filter(e => e.task && e.task.endsWith('-land'))
  assert.equal(landEsc.length, 1, 'exactly one -land escalation pushed')
  assert.equal(landEsc[0].reason, 'bogus', 'the unrouted escalation reason echoes the returned status')
})

test('Task 1.2 (iii) — source-text: the terminal else carries the discriminating landResult fallback (line-scoped, #929)', () => {
  // Line-scoped raw-source match — NO block-comment strip (lesson
  // glob-literal-fools-block-comment-strip-regex-in-structural-tests, #929). The terminal else's push
  // carries the unique token `landResult ? String(landResult.status || 'error') : 'error'`; the
  // baseline-proceed sibling fallback reads `reLand ? reLand.status : 'error'` (different receiver), so
  // this pin cannot silently migrate to the wrong chain. Red: terminal else deleted or moved out of the
  // primary land routing chain.
  const token = "reason: landResult ? String(landResult.status || 'error') : 'error'"
  const hits = src.split('\n').filter(l => l.includes(token))
  assert.equal(hits.length, 1, 'exactly one terminal-else land fallback line carrying the discriminating landResult token')
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
  // Structural: verify the template declares `succeeded` and uses it in nextWave.
  // Strip LINE comments only. A block-comment strip (/\/\*[\s\S]*?\*\//g) mis-reads the resolveGate
  // discovery string's glob literals ('*/node_modules/*' etc. carry /* and */) as block-comment
  // delimiters and cascades over executable code (the ADR 0036 inline gate-composition mirror added
  // that string to this file). succeeded.add/.has/`const succeeded = new Set()` appear only in
  // executable code — never a real block comment — so line-only stripping is sufficient and robust.
  const code = src.replace(/\/\/[^\n]*/g, '')
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
  // Strip LINE comments ONLY (dropped the block pass, #929). The block-comment strip
  // (/\/\*[\s\S]*?\*\//g) mis-reads the resolveGate discovery string's glob literals ('*/…/*') as
  // block-comment delimiters and cascades over the refine/gate-audit core it is meant to inspect —
  // deleting exactly the execution-evidence / parallel( tokens asserted here. Those tokens live only
  // in executable code, never a block comment, so line-only is sufficient. NEW sensitivity of
  // dropping the block pass: these are POSITIVE asserts, so a future block comment carrying
  // `execution-evidence`/`parallel(` prose could false-PASS them; the blockCommentSpans census below
  // (near MIRROR_REGISTRY) bounds it — any new block comment reds the census and forces this re-check.
  const code = src.replace(/\/\/[^\n]*/g, '')
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

test('F03 — auditPrompt: teaches the read-only git guard contract (one bare git per Bash call, no composition, Grep-tool sweep channel), keeps @{} in avoidance context', async () => {
  // The prompt teaches the D5 read-only git guard contract (Task 1.2, spec §5): one bare git command per
  // Bash call from the read-verb allowlist, no pipes/chaining/redirects/quotes/globs/braces/substitution,
  // the Grep tool as the repo-wide sweep channel, and @{} reflog kept in avoidance context (braces are
  // denied). The guard's grammar is widened (~/%, ls-tree, read-form branch) — no longer the narrow
  // "%-format denied" teach, so the anchors moved to the contract's distinctive fragments.
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // Filter to regular audit calls only (not gate-audit execution-evidence seats)
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length > 0, 'at least one regular auditor call was made')
  for (const c of auditCalls) {
    const p = c.prompt
    // The contract's distinctive fragments must be present (re-anchored off the retired %-format teach).
    assert.match(p, /one bare git/i, `audit prompt must teach one bare git command per Bash call; got: "${p.slice(0, 400)}"`)
    assert.match(p, /no pipes/i, `audit prompt must ban composition (no pipes/chaining/…); got: "${p.slice(0, 400)}"`)
    assert.match(p, /Grep tool/i, `audit prompt must name the Grep tool as the repo-wide sweep channel; got: "${p.slice(0, 400)}"`)
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

test('M1 criterion #6 — catch after a mid-phase throw in the serial merge queue (outside the work thunk) skips teardown (structural: no teardown agent call recorded)', async () => {
  // Retitled + re-pointed (wave-loop invariant, #742): an INSIDE-thunk throw (worker/auditor/fix/provision)
  // is now caught as a per-task escalate, so the top-level try/catch handles only OUTSIDE-thunk throws — the
  // serial merge queue, land, gate-audit, phase-close. The mock succeeds for the topology barrier, the first
  // worker, and the auditor (approve), then throws on the serial MERGE (phase Refine, run AFTER the wave loop
  // OUTSIDE the thunk). The merge is the first such point past the worker, so workerRan===true keeps the "no
  // teardown" assertion non-vacuous (plan DP2 vacuity trap).
  let workerRan = false
  const throwAtMergeImpl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') { workerRan = true; return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} } }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    // merge (phase Refine) runs in the serial merge queue AFTER the wave loop, OUTSIDE the work thunk →
    // its throw reaches the top-level try/catch → held:workflow-error (an inside-thunk throw would escalate).
    if (seat === 'war-refiner' && opts.phase === 'Refine') throw new Error('injected-merge-throw-after-worker')
    if (seat === 'war-refiner') return { mode: 'merge-task', status: 'merged' }
    return {}
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), throwAtMergeImpl)
  assert.ok(workerRan, 'worker must have run before the injected throw (non-vacuous setup)')
  assert.equal(out.landDecision, 'held:workflow-error',
    `landDecision must be 'held:workflow-error'; got: ${JSON.stringify(out.landDecision)}`)
  assert.ok(out.workflowError && out.workflowError.message.includes('injected-merge-throw-after-worker'),
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
// Phase 2 Task 1 (#574/#596) — thread the per-phase-resolved overrides.testPattern →
// assert-test-in-diff.sh --pattern at every dispatched merge-task floor invocation site (the site set
// grows under stacking — the #1046 drift-guard below DISCOVERS it; no count is asserted in prose)
// + Provision-prompt base-derivation prose + war-refiner.md mirror.
// Validation 2 (byte-identical when null) + the --pattern half of validation 6 (drift guard).
// ---------------------------------------------------------------------------

// Drive the no-test → add-test fix → re-audit(approve) → re-merge flow so BOTH the initial merge-task
// prompt AND the floor-retry re-merge prompt are dispatched (first Refine call = no-test, second = merged).
// firstMerge (optional) overrides the FIRST Refine result — the no-test MergeResult the floor-retry
// sub-loop consumes — so a test can ride extra advisory fields (e.g. floor_diagnostic) on it. Omitted ⇒
// today's bare { mode:'merge-task', status:'no-test' }, so every pre-existing caller is unchanged.
async function runNoTestLoop(over, firstMerge) {
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      mergeCallCount++
      return mergeCallCount === 1 ? (firstMerge || { mode: 'merge-task', status: 'no-test' }) : { mode: 'merge-task', status: 'merged' }
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
    'war-refiner.md step 4 attributes --pattern to the per-phase-resolved overrides.testPattern')
})

// ---------------------------------------------------------------------------
// #1046 — MERGE_RESULT.floor_diagnostic: the test floor's verbatim exit-1 stderr (the near-miss
// diagnostic), captured at every dispatched floor site, interpolated into the ADD_TEST fix prompt and
// the no-test exhaustion detail. Fail-open advisory — never routed on, no status enum change.
// ---------------------------------------------------------------------------

// The requiresTest-TRUE arm of each dispatched assert-test-in-diff.sh site, DISCOVERED from the template
// source: the invocation head (script + both ref interpolations + ${testPatternArg}) through to the
// ENCLOSING `pt` template literal's OWN CLOSING BACKTICK — a negated-backtick capture class, so a match
// can never cross into a neighbouring template and swallow it (#1050: the retired terminator anchored on
// the requiresTest:false skip arm's line shape instead of the invocation's own grammar, so a 5th site
// written inline was swallowed into its neighbour). The skip arms and the prose mentions (the ADD_TEST
// description, the polish-merge skip) stay excluded BY CONSTRUCTION — they carry no ${testPatternArg}.
//
// Paired below with a source-derived count cross-check (discovered === raw invocation heads). THREE
// residuals, all on the record for the next editor:
//   1. Inline-backtick truncation — FAIL-CLOSED. A future floor arm embedding an inline backtick BEFORE
//      its capture tokens truncates that site's capture and reds the per-site arms: a loud false red
//      forcing a deliberate re-anchor, never a silent pass.
//   2. Head-shape divergence — ACCEPTED silent escape. A site whose invocation head diverges from the
//      canonical `${ph.integrationBranch} ${r.task.branch}${testPatternArg}` interpolation escapes BOTH
//      sides of the equality, so the equality holds. Mitigation: that head IS the invocation grammar
//      every dispatched site copies (all sites at this base are byte-identical heads).
//   3. Mid-file unenclosed head — the regex has NO notion of enclosure: it scans from the head to the
//      NEXT backtick anywhere in the source, and 402 backticks follow the last floor site at this base.
//      An unenclosed head placed mid-file is therefore spuriously DISCOVERED with a junk capture, the
//      cross-check reads 5 === 5 and stays GREEN, and the red arrives from the per-site token arms
//      instead — a junk capture carries none of floor_diagnostic / stderr / verbatim. Fail-closed and
//      loud, never a silent pass, which is why the cross-check is a COMPANION to the per-site arms and
//      never a replacement for them. (Only past every remaining backtick — end of source — does the
//      equality itself red: discovered 4, raw 5.)
//
// Ratified-floor reconciliation: plan 3's End state 5 and the merge-land-resilience adjudication pin this
// guard as a `>= 3` non-vacuity floor plus per-site arms, "never harden it to an exact count". That floor
// is RETAINED below byte-unchanged, and the cross-check is not the prohibited hardening — both of its
// sides derive from the same `src` string, so a genuinely new dispatched site grows them together and no
// literal exists to rot.
const FLOOR_SITE_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}([^`]*)`/g
// The same invocation head with no capture and no terminator — the cross-check's raw side.
const FLOOR_HEAD_RE = /assert-test-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}\$\{testPatternArg\}/g

test('#1046 floor_diagnostic drift-guard (validation 6, both surfaces): EVERY dispatched assert-test-in-diff.sh site instructs verbatim-stderr capture into floor_diagnostic scoped to exit 1; war-refiner.md step 4 carries the same tokens', () => {
  // DISCOVER the sites instead of hardcoding a count — the dispatched-site set grows under stacking
  // (four at this base: initial merge, floor-retry re-merge, environment-proceed, baseline-proceed).
  // The bound is a >= 3 NON-VACUITY floor, never an exact count: an exact count re-breaks on the next
  // site added and invites a stale-number fix instead of a real one.
  const sites = [...src.matchAll(FLOOR_SITE_RE)]
  assert.ok(sites.length >= 3,
    `expected >= 3 dispatched assert-test-in-diff.sh sites rendering \${testPatternArg} in the template source (non-vacuity floor); found ${sites.length}`)
  // Source-derived count cross-check (#1050): every raw invocation head in `src` must have been
  // DISCOVERED with its capture. Both sides derive from the same source string — a new dispatched site
  // grows them together, so there is no literal to rot (see the reconciliation in FLOOR_SITE_RE's
  // comment). Reads 4 === 4 at this base.
  const rawCount = [...src.matchAll(FLOOR_HEAD_RE)].length
  assert.equal(sites.length, rawCount,
    `a dispatched floor site escaped discovery — its capture instruction is unchecked: ${sites.length} discovered vs ${rawCount} raw assert-test-in-diff.sh invocation heads in the template source`)
  sites.forEach((m, i) => {
    const arm = m[1]
    const where = `dispatched floor site #${i + 1} of ${sites.length}`
    assert.match(arm, /floor_diagnostic/, `${where} must name the floor_diagnostic capture field`)
    assert.match(arm, /stderr/i, `${where} must name stderr as the capture source`)
    assert.match(arm, /verbatim/i, `${where} must demand the stderr VERBATIM (never edited or summarised)`)
    // Exit-1-SCOPED: the capture must sit in the same clause as an exit-1 mention. A capture instructed
    // unconditionally — or on the exit-2 (git/ref error) route — is exactly the defect this anchors against.
    assert.match(arm, /exit 1[^]{0,240}floor_diagnostic/i,
      `${where} must scope the floor_diagnostic capture to the exit 1 path`)
  })

  // Standing surface (both-surfaces rule): the same instruction in war-refiner.md step 4's exit-1 bullet.
  // Scoped to that bullet so the tokens cannot be satisfied by unrelated prose elsewhere in the file
  // (step 4 already said "verbatim" about the --pattern arg — an unscoped grep would pass vacuously).
  const step4 = refinerMd.match(/\*\*Test-floor check\*\*[^]*?(?=\n\d+\. \*\*Packaging-floor check\*\*)/)
  assert.ok(step4, 'war-refiner.md carries a **Test-floor check** step delimited by the packaging-floor step')
  const exit1 = step4[0].match(/\*\*exit 1\*\*[^]*?(?=\n\s*-\s*\*\*exit 2\*\*)/)
  assert.ok(exit1, 'war-refiner.md step 4 carries an **exit 1** bullet')
  assert.match(exit1[0], /floor_diagnostic/, "war-refiner.md step 4's exit-1 bullet names floor_diagnostic")
  assert.match(exit1[0], /stderr/i, "war-refiner.md step 4's exit-1 bullet names stderr as the capture source")
  assert.match(exit1[0], /verbatim/i, "war-refiner.md step 4's exit-1 bullet demands the stderr verbatim")
})

test('#1046 schema lock: MERGE_RESULT gains OPTIONAL floor_diagnostic — an orthogonal field, never a status value (ADR 0005); the status enum is pinned to the schemas.md union (done-unmet joined via Task 2.3)', () => {
  const mr = src.match(/const\s+MERGE_RESULT\s*=[^]*?(?=\n\n)/)
  assert.ok(mr, 'MERGE_RESULT literal found in workflow-template.js')
  assert.match(mr[0], /floor_diagnostic:\s*\{\s*type:\s*'string'\s*\}/,
    'MERGE_RESULT declares floor_diagnostic: { type: \'string\' }')
  assert.ok(!/required:\s*\[[^\]]*floor_diagnostic/.test(mr[0]),
    'floor_diagnostic is OPTIONAL — never added to MERGE_RESULT.required (fail-open advisory)')
  const enumMatch = mr[0].match(/status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(enumMatch, 'MERGE_RESULT status enum found')
  assert.deepEqual(
    JSON.parse(enumMatch[1].replace(/'/g, '"')),
    ['merged', 'landed', 'gate_failed', 'conflict', 'error', 'land_stale', 'no-test', 'unpackaged', 'done-unmet', 'submodule-blocked', 'submodule-pr'],
    'the status enum is exactly the schemas.md union — floor_diagnostic adds NO status value; done-unmet is the sole precision-chain Task 2.3 addition (F2 two-slot precedent), mirrored in HARD_ESCALATION_REASONS via the D2 registry row')
})

test('#1046 ADD_TEST fixPrompt: a non-empty floor_diagnostic is quoted VERBATIM and instructs reconciling against the ACTIVE pattern; absent ⇒ byte-identical to a diagnostic-less run', async () => {
  const DIAG = "near-miss: runner/x.test.mjs is test-shaped but the active pattern set ('*.test.ts') does not match it"
  const addTestPrompt = (calls) => calls.find(isAddTestWorker).prompt

  const withDiag = addTestPrompt((await runNoTestLoop(undefined,
    { mode: 'merge-task', status: 'no-test', floor_diagnostic: DIAG })).calls)
  const without = addTestPrompt((await runNoTestLoop()).calls)

  assert.ok(withDiag.includes(DIAG),
    'the ADD_TEST prompt quotes the diagnostic VERBATIM (byte-for-byte, never summarised)')
  assert.match(withDiag, /reconcile[^]{0,200}ACTIVE pattern/i,
    "the ADD_TEST prompt instructs reconciling the diff's test files against the ACTIVE pattern")
  assert.match(withDiag, /report blocked naming the mismatch rather than adding a duplicate test/i,
    'the ADD_TEST prompt names the blocked-not-duplicate outcome when the test already exists under an unmatched path')

  // Set-minus byte-identity: removing the appended near-miss paragraph restores the diagnostic-less
  // prompt EXACTLY — nothing else in the prompt is conditioned on the field (criterion 5's absent half).
  const clause = withDiag.match(/\nNEAR-MISS DIAGNOSTIC[^]*?adding a duplicate test\./)
  assert.ok(clause, 'the appended paragraph is delimited (NEAR-MISS DIAGNOSTIC … adding a duplicate test.)')
  assert.equal(withDiag.replace(clause[0], ''), without,
    'floor_diagnostic absent ⇒ the ADD_TEST prompt is byte-identical to the diagnostic-bearing prompt minus the appended paragraph')
  assert.ok(!without.includes('NEAR-MISS DIAGNOSTIC'),
    'the diagnostic-less ADD_TEST prompt carries no near-miss residue at all')
})

test('#1046 no-test exhaustion: the LAST diagnostic rides both the escalated entry and the no-test:exhausted auditLog entry as detail; absent ⇒ neither entry grows a detail key', async () => {
  const DIAG = "near-miss: skills/x/y.spec.mjs unmatched by the active pattern set ('*.test.mjs')"
  // roundLimit 1: initial merge (no-test, NO diagnostic) → one add-test round → floor-retry re-merge
  // (no-test, WITH the diagnostic) → fixRounds hits the limit → exhaustion. The detail must be the
  // LAST result's diagnostic, so a first-result read would be RED here.
  const drive = (diag) => {
    let merges = 0
    return runPhase(NO_TEST_ARGS({ run: { roundLimit: 1 } }), (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
      if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
      if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
      if (seat === 'war-refiner' && opts.phase === 'Refine') {
        merges++
        return (merges > 1 && diag)
          ? { mode: 'merge-task', status: 'no-test', floor_diagnostic: diag }
          : { mode: 'merge-task', status: 'no-test' }
      }
      if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
      if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
      return {}
    })
  }

  const { out } = await drive(DIAG)
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'no-test')
  const log = (out.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'no-test:exhausted')
  assert.ok(esc, 'budget exhaustion escalates {task:"t1", reason:"no-test"}')
  assert.ok(log, "auditLog records verdict 'no-test:exhausted'")
  assert.equal(esc.detail, DIAG, "the escalated entry carries the LAST no-test result's diagnostic as detail")
  assert.equal(log.detail, DIAG, "the no-test:exhausted auditLog entry carries the same diagnostic as detail")

  const { out: bare } = await drive(null)
  const bareEsc = (bare.escalated || []).find(e => e && e.task === 't1' && e.reason === 'no-test')
  const bareLog = (bare.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'no-test:exhausted')
  assert.ok(bareEsc && bareLog, 'the diagnostic-less run still exhausts the same way')
  assert.ok(!('detail' in bareEsc),
    'floor_diagnostic absent ⇒ the escalated entry grows NO detail key (shape-identical to a diagnostic-less run)')
  assert.ok(!('detail' in bareLog),
    'floor_diagnostic absent ⇒ the auditLog entry grows NO detail key (shape-identical to a diagnostic-less run)')
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
// dispatch: the BATCH ace worker commits one fix, a fresh auditRound re-audits at the new sha (the
// happy path is byte-identical to the single-attempt era), and a re-audit regression enters the
// bounded aceBisect ladder (its own test section below) — never an escalation. `aced` is a return
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
  // Exactly one ace worker on the happy path (one commit, one re-audit — byte-identical to today).
  assert.equal(calls.filter(isAce).length, 1, 'exactly one ace worker dispatched on the happy path (bisection never opens without a regression)')
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

// ---------------------------------------------------------------------------
// Ace RE-ENTRY (in-run-finding-resolution Task 1.1, D1/D2/#1731): the ladder RE-OPENS for fresh
// absorbs born at a re-audit — budget-bounded (fixRounds < roundLimit − 2, the floor-retry
// reserve is the SOLE bound), same machinery (Ace-Subset trailer + tip-preflight idempotency,
// PIN-15), forward-revert posture preserved (a reverted finding never re-enters).
// ---------------------------------------------------------------------------

// Drives: round-1 absorb → batch ace → re-audit approves WITH a fresh absorb → ONE re-entry batch
// → its re-audit approves clean. (Also reused by the D6 gate-command sweep and Done-when sites.)
const reentryImpl = () => buildSeqImpl(
  { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'first', file: 'skills/first.js' })]),
                             approveWith('audit:t1:correctness', [nit({ title: 'second', file: 'skills/second.js' })]),
                             approveWith('audit:t1:correctness', [])] },
  aceBase([nit({ title: 'first', file: 'skills/first.js' })]))

test('ace-reentry (End state 1, plain re-audit): a fresh absorb born at the approving batch re-audit re-enters as an ace-style batch — aced, not demoted; trailer + preflight discipline ride the dispatch', async () => {
  const { out, calls, logs } = await runPhase(ACE_ARGS(), reentryImpl())
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 2, 'batch + exactly ONE re-entry batch dispatched (the ladder re-opened once)')
  const re = aces[1]
  assert.ok(re.prompt.includes('ACE RE-ENTRY BATCH'), 'the second dispatch is the re-entry vehicle')
  assert.ok(re.prompt.includes('second') && !re.prompt.includes('first,'), 'the re-entry batch carries the fresh finding')
  // PIN-15: the re-entry dispatch inherits the Ace-Subset trailer discipline (round index folded
  // into the deterministic value) and the tip-preflight idempotency (range scan, exact equality).
  assert.match(re.prompt, /`Ace-Subset: t1:reentry:r2:skills\/second\.js`/, 'the trailer value carries task id + round index + sorted file set')
  assert.ok(re.prompt.includes('EXACT whole-string equality') && re.prompt.includes('never the tip alone'),
    'the re-entry PREFLIGHT mandates the range scan with exact whole-string trailer equality (PIN-15)')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'second'), 'the re-audit-born absorb is ACED (executed in-run)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'second'), 'the re-audit-born absorb is NOT filed (the retired demotion is gone)')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('never opens')), 'no retired-boundary demotion log remains')
  assert.ok(out.landed.includes('t1'), 't1 lands on the re-entered tip')
})

test('ace-reentry (End state 1, bisection-subset re-audit): a fresh absorb born at a SUBSET re-audit re-enters after the bisection resolves', async () => {
  const f1 = nit({ title: 'f1 nit', file: 'skills/f1.js' })
  const f2 = nit({ title: 'f2 nit', file: 'skills/f2.js' })
  const fresh = nit({ title: 'subset-born nit', file: 'skills/fresh.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [
      bApprove([f1, f2]),
      bRegress('zz-unrelated.js'),          // batch regresses, ambiguous ⇒ halves [f1] [f2]
      bApprove([fresh]),                    // subset [f1] approves WITH a fresh absorb
      bApprove(),                           // subset [f2] approves clean
      bApprove(),                           // the re-entry batch's own re-audit approves clean
    ],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
    'ace:t1:r3': [bWorker('sub00002')],
    'ace:t1:r4': [bWorker('reen0001')],
  }, aceBase([f1, f2]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 4, 'batch + two subsets + ONE re-entry batch (the subset-born absorb re-entered)')
  assert.ok(aces[3].prompt.includes('ACE RE-ENTRY BATCH') && aces[3].prompt.includes('subset-born nit'),
    'the fourth dispatch is the re-entry vehicle carrying the subset-born finding')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'subset-born nit' && a.sha === 'reen0001'),
    'the subset-born absorb aced at the re-entry sha')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'subset-born nit'), 'the subset-born absorb is NOT filed')
  assert.ok(out.landed.includes('t1'), 't1 lands')
})

test('ace-reentry (End state 1, forward-revert posture): a REGRESSING re-entry batch is forward-reverted, its finding demotes and NEVER re-enters (no further ace dispatch for it) — even when the regressed round RE-RAISES it as an absorb', async () => {
  // The regressed re-entry re-audit ALSO re-raises the just-reverted finding as a fresh absorb
  // (content-identical re-mint — minorsOf mints fresh objects, so object identity cannot catch
  // it): the revertedKeys registry must refuse the re-queue, or the finding oscillates — a third
  // ace dispatch, then recordAced landing it in BOTH aced and minorsFiled (End states 1 + 6).
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [nit({ title: 'first', file: 'skills/first.js' })]),
                               approveWith('audit:t1:correctness', [nit({ title: 'second', file: 'skills/second.js' })]),
                               { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
                                 confidence: 'high', findings: [{ severity: 'Major', title: 'reentry broke it', file: 'zz.js', rationale: 'regressed' },
                                                                nit({ title: 'second', file: 'skills/second.js' })] }] },
    aceBase([nit({ title: 'first', file: 'skills/first.js' })]))
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 2, 'batch + ONE re-entry — the reverted finding never re-dispatches despite the re-raise (the oscillation bound, enforced by content key)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('forward-reverted finding never re-enters')),
    'the demotion names the forward-revert posture (logged, never silent)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('re-entry REFUSED') && l.includes('second')),
    'the content-identical re-mint of the reverted finding is REFUSED re-entry, logged (never silent)')
  assert.equal((out.minorsFiled || []).filter(m => m && m.title === 'second').length, 1,
    'the reverted re-entry finding demotes to follow-up exactly ONCE (the re-mint never files a second record)')
  assert.ok(!(out.aced || []).some(x => x && x.finding && x.finding.title === 'second'),
    'the reverted finding never lands in aced — aced and minorsFiled stay disjoint (End state 6)')
  const merge = calls.find(isMergeTask)
  assert.match(merge.prompt, /revert\s+--no-edit\s+deadbeef/,
    'the final failed re-entry tip rides the merge dispatch revert clause (forward-revert posture verbatim)')
  assert.ok(out.landed.includes('t1'), 't1 still lands its approved work')
})

test('ace-reentry (End state 1 + 6, batch-regressed arm): a batch finding re-raised as an absorb AT the regressing batch re-audit never re-enters — the drain-time remintBlock re-check catches the route-before-revert ordering', async () => {
  // The batch-regressed arm queues re-audit-born absorbs BEFORE aceBisect's { reverted: true }
  // demotes land (routeReauditMinors runs first, then await aceBisect): a content-identical
  // re-mint of a batch finding is already on r.reentryQueue when its key enters revertedKeys, so
  // queue-time remintBlock alone cannot refuse it. aceReentry's DRAIN-time re-check must — or the
  // finding oscillates: a second ace dispatch, then recordAced landing it in BOTH aced and
  // minorsFiled (End states 1 + 6). Single-file batch ⇒ aceHalve returns null ⇒ whole-batch
  // demote, no subset dispatches — the only ace call is the batch itself.
  const first = () => nit({ title: 'first', file: 'skills/first.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [first()]),
                               { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
                                 confidence: 'high', findings: [{ severity: 'Major', title: 'batch broke it', file: 'zz-unrelated.js', rationale: 'regressed' },
                                                                first()] }] },
    aceBase([first()]))
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 1, 'ONLY the batch ace dispatched — the re-raised batch finding never re-enters despite being queued before the forward-revert registration')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('re-entry REFUSED at drain') && l.includes('first')),
    'the drain-time re-check refuses the queued re-mint, logged (never silent)')
  assert.equal((out.minorsFiled || []).filter(m => m && m.title === 'first').length, 1,
    'the reverted batch finding demotes to follow-up exactly ONCE')
  assert.ok(!(out.aced || []).some(x => x && x.finding && x.finding.title === 'first'),
    'the reverted finding never lands in aced — aced ∩ minorsFiled = ∅ (End state 6)')
  assert.ok(out.landed.includes('t1'), 't1 still lands its approved work')
})

test('ace-reentry (End state 1, reserve gate): re-entry dispatches only while fixRounds < roundLimit − 2 — at the reserve the fresh absorb routes phaseClose:true instead (logged)', async () => {
  // roundLimit 3 ⇒ reserve boundary 1. The batch ace charges the only slot; the re-audit-born
  // absorb finds the reserve line and routes to the sweep queue (no second ace dispatch). Without
  // a default audit.roster the sweep skips fail-open and drains — the finding surfaces via the
  // logged demotion, proving the sweep queue (not minorsFiled directly) was its route.
  const { out, calls, logs } = await runPhase(ACE_ARGS({ run: { ace: true, roundLimit: 3 } }), reentryImpl())
  assert.equal(calls.filter(isAce).length, 1, 'only the batch ace dispatched — the reserve blocks re-entry (the NEW < roundLimit − 2 gate)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('reserve-blocked') && l.includes('roundLimit−2 (1)')),
    'the reserve stop is logged with the boundary value')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Re-entry routing') && l.includes('second')),
    'the reserve-blocked absorb routes phaseClose:true toward the sweep (logged, never silent)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('sweep skipped')), 'the finding reached the phase-close queue (drained fail-open without a roster)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'second'), 'the drained finding demotes to follow-up (nothing dropped)')
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
    ['conflict', 'error', 'gate_failed', 'land_stale', 'landed', 'merged', 'no-test', 'unpackaged', 'done-unmet', 'submodule-blocked', 'submodule-pr'].sort(),
    'MERGE_RESULT.status enum is the expected set — no ace member leaked in (unpackaged is the packaging-floor outcome; done-unmet is the done-when-floor outcome, precision-chain Task 2.3)')
  // HARD_ESCALATION_REASONS inline literal must be exactly the canonical 10 (no ace member).
  const hMatch = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(hMatch, 'HARD_ESCALATION_REASONS found')
  const hard = JSON.parse(hMatch[1].replace(/'/g, '"'))
  assert.deepEqual(hard.sort(),
    ['audit-blocked', 'conflict', 'dep-failed', 'escalate', 'gate-evidence', 'land_stale', 'no-test', 'unpackaged', 'done-unmet', 'unrunnable-deps'].sort(),
    'HARD_ESCALATION_REASONS is the expected set — aced is a return attribute, not an escalation reason (unpackaged/done-unmet are merge-task floor hard reasons)')
})

// ---------------------------------------------------------------------------
// Ace bisection (realized-absorb-rate Task 1.1, D1–D4/D6): the regression-recovery
// ladder on a failed --ace batch. Culprit-first excision → blind halving only on
// ambiguous attribution → serial subsets at the tip, depth cap 2, same-file findings
// never split; batch = 1 fixRounds slot, +1 per subset commit, reverts uncharged,
// exhaustion demotes the remainder by design; the loop owns in-loop forward-reverts
// and only a FINAL failed tip rides the merge dispatch's revert clause.
// ---------------------------------------------------------------------------

const bWorker = (sha) => ({ task_id: 't1', status: 'implemented', head_sha: sha, tests: { unit: 1 } })
// A regressing re-audit verdict whose Major names the given file (culprit attribution input).
const bRegress = (file) => ({ seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
  confidence: 'high', findings: [{ severity: 'Major', title: 'regressed', file, rationale: 'broke' }] })
const bApprove = (findings = []) => approveWith('audit:t1:correctness', findings)

test('bisection — culprit-first excision: a named culprit demotes, the remainder re-applies as ONE subset (no blind halving), and the subset dispatch owns the in-loop revert of the failed batch', async () => {
  const fa = nit({ title: 'culprit nit', file: 'skills/a.js' })
  const fb = nit({ title: 'salvaged nit', file: 'skills/b.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa, fb]), bRegress('skills/a.js'), bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
  }, aceBase([fa, fb]))
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 2, 'batch + exactly ONE remainder subset — culprit-first, blind halving reserved for ambiguous attribution')
  assert.ok(aces[1].prompt.includes('salvaged nit') && !aces[1].prompt.includes('culprit nit'),
    'the remainder subset re-applies ONLY the non-culprit findings')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'culprit nit'), 'the named culprit demotes to follow-up')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('culprit-first excision')), 'the culprit demotion is logged with the excision reason')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'salvaged nit' && a.sha === 'sub00001'),
    'the salvaged remainder aces at its subset sha')
  assert.match(aces[1].prompt, /revert --no-edit ace00001/, 'the subset dispatch forward-reverts the failed batch commit at the tip (in-loop)')
  const merge = calls.find(isMergeTask)
  assert.ok(!merge.prompt.includes('FORWARD-REVERT'), 'the merge carries NO revert clause — the failed batch was already reverted in-loop (no sha reverted twice)')
  assert.ok(out.landed.includes('t1'), 't1 lands')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), 'the ladder never escalates a mergeable task')
})

test('bisection — all findings named culprits: nothing to salvage, the whole batch finally fails (no subset dispatch), merge reverts the batch', async () => {
  const fa = nit({ title: 'a nit', file: 'skills/a.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa]), bRegress('skills/a.js')],
    'ace:t1:r1': [bWorker('ace00001')],
  }, aceBase([fa]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 1, 'no subset dispatch — total culprit attribution leaves nothing to salvage')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'a nit'), 'the culprit batch demotes to follow-up')
  assert.match(calls.find(isMergeTask).prompt, /revert\s+--no-edit\s+ace00001/, 'the merge reverts the final failed batch tip')
})

test('bisection — ambiguous attribution blind-halves: serial subsets at the tip, round-encoded distinct ace labels, Ace-Subset trailer + bisection-range preflight + worktree-local dirt clause on every subset dispatch (End state 2)', async () => {
  const fa = nit({ title: 'fa nit', file: 'skills/fa.js' })
  const fb = nit({ title: 'fb nit', file: 'skills/fb.js' })
  const impl = buildSeqImpl({
    // regression names a file NO aceable finding touches ⇒ ambiguous ⇒ blind halving
    'audit:t1:correctness': [bApprove([fa, fb]), bRegress('zz-unrelated.js'), bApprove(), bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
    'ace:t1:r3': [bWorker('sub00002')],
  }, aceBase([fa, fb]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 3, 'batch + two blind halves, applied serially')
  const labels = aces.map(c => c.opts.label)
  assert.deepEqual(labels, ['ace:t1:r1', 'ace:t1:r2', 'ace:t1:r3'],
    'ace labels stay distinct and round-encoded (the ace:<task>:r<n> scheme extends to subsets)')
  for (const c of aces.slice(1)) {
    assert.match(c.prompt, /Ace-Subset: t1:/, 'every subset dispatch mandates the Ace-Subset:-keyed deterministic trailer')
    assert.match(c.prompt, /ace00001\^\.\.HEAD/, 'the preflight scans the bisection range since the pre-batch base')
    assert.ok(c.prompt.includes('never the tip alone'), 'the preflight is range-scoped, never tip-only')
    assert.ok(c.prompt.includes('WITHOUT committing'), 'a preflight hit returns the existing sha without committing')
    assert.ok(c.prompt.includes('in THIS worktree only') && c.prompt.includes('never any shared ref'),
      'the dead-attempt dirt clause is worktree-local only — never any shared ref')
    assert.ok(c.prompt.includes('keep the gate green') && c.prompt.includes('make gate'),
      'the subset prompt keeps the gate green and carries the gate command (prompt truth, D6)')
  }
  // subset ordering: each half lists exactly its own findings (same-file grouping preserved)
  assert.ok(aces[1].prompt.includes('fa nit') && !aces[1].prompt.includes('fb nit'), 'half 1 carries only its findings')
  assert.ok(aces[2].prompt.includes('fb nit') && !aces[2].prompt.includes('fa nit'), 'half 2 carries only its findings')
  // both halves approved ⇒ both aced at their own shas (handoff grouping by sha still works)
  assert.ok((out.aced || []).some(a => a.finding.title === 'fa nit' && a.sha === 'sub00001'), 'half 1 aced at its sha')
  assert.ok((out.aced || []).some(a => a.finding.title === 'fb nit' && a.sha === 'sub00002'), 'half 2 aced at its sha')
  // half 2's dispatch carries NO revert step (half 1 approved — nothing pending)
  assert.ok(!/revert --no-edit sub00001/.test(aces[2].prompt), 'an approved subset is never reverted')
  assert.ok(!calls.find(isMergeTask).prompt.includes('FORWARD-REVERT'), 'no merge revert clause — the final tip is approved')
})

test('bisection — depth cap 2 and only finally-failing subsets demote: a regressing MULTI-GROUP depth-2 subset demotes WHOLE (no third split — the cap, not singleton atomicity, stops it) and the NEXT dispatch reverts it', async () => {
  // FIVE distinct file groups: halves [f1,f2,f3] / [f4,f5]; depth-2 halves of the first are
  // [f1,f2] / [f3]. [f1,f2] is deliberately MULTI-group at depth 2 — without the depth cap,
  // aceHalve would happily split it again (two more ace:t1:r* dispatches); with the cap it
  // demotes whole. Four distinct-file findings can never exercise the cap: every depth-2
  // subset is a singleton aceHalve refuses to split anyway.
  const f1 = nit({ title: 'f1 nit', file: 'skills/f1.js' })
  const f2 = nit({ title: 'f2 nit', file: 'skills/f2.js' })
  const f3 = nit({ title: 'f3 nit', file: 'skills/f3.js' })
  const f4 = nit({ title: 'f4 nit', file: 'skills/f4.js' })
  const f5 = nit({ title: 'f5 nit', file: 'skills/f5.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [
      bApprove([f1, f2, f3, f4, f5]),
      bRegress('zz-unrelated.js'),   // batch regresses, ambiguous ⇒ halves [f1,f2,f3] [f4,f5]
      bRegress('zz-unrelated.js'),   // [f1,f2,f3] regresses at depth 1 ⇒ splits to [f1,f2] [f3] (depth 2)
      bRegress('zz-unrelated.js'),   // [f1,f2] regresses at depth 2 ⇒ FINAL demote WHOLE (depth cap — still splittable)
      bApprove(),                    // [f3] approves
      bApprove(),                    // [f4,f5] approves
    ],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],   // [f1,f2,f3]
    'ace:t1:r3': [bWorker('sub00002')],   // [f1,f2]
    'ace:t1:r4': [bWorker('sub00003')],   // [f3]
    'ace:t1:r5': [bWorker('sub00004')],   // [f4,f5]
  }, aceBase([f1, f2, f3, f4, f5]))
  // roundLimit 9: the ladder is budget-unconstrained here so the depth mechanics alone are under test.
  const { out, calls, logs } = await runPhase(ACE_ARGS({ run: { ace: true, roundLimit: 9 } }), impl)
  const aces = calls.filter(isAce)
  // dispatches: batch, [f1,f2,f3], [f1,f2], [f3], [f4,f5] — and NOTHING after the depth-2
  // regression: without the cap, [f1] and [f2] would each get their own dispatch (7 total).
  assert.equal(aces.length, 5, 'batch + 4 subset dispatches — the depth-2 multi-group regressor demotes whole, no third split')
  assert.ok(aces[2].prompt.includes('f1 nit') && aces[2].prompt.includes('f2 nit') && !aces[2].prompt.includes('f3 nit'),
    'the regressing depth-1 subset split into [f1,f2] and [f3]')
  // in-loop reverts: [f1,f2]'s dispatch reverts the failed [f1,f2,f3] commit; [f3]'s dispatch reverts the failed [f1,f2] commit
  assert.match(aces[2].prompt, /revert --no-edit sub00001/, 'the next dispatch reverts the failed depth-1 subset at the tip')
  assert.match(aces[3].prompt, /revert --no-edit sub00002/, 'the next dispatch reverts the failed depth-2 subset at the tip')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'f1 nit'), 'the finally-failing depth-2 subset demotes (f1)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'f2 nit'), 'the finally-failing depth-2 subset demotes (f2)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('f1 nit') && l.includes('depth/split floor')),
    'f1\'s demotion is logged with the depth/split-floor reason')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('f2 nit') && l.includes('depth/split floor')),
    'f2\'s demotion is logged with the depth/split-floor reason')
  assert.ok((out.aced || []).some(a => a.finding.title === 'f3 nit' && a.sha === 'sub00003'), 'the sibling subset still aces — only finally-failing subsets demote')
  assert.ok((out.aced || []).some(a => a.finding.title === 'f4 nit' && a.sha === 'sub00004'), 'the untouched depth-1 half still aces')
  assert.ok(out.landed.includes('t1'), 't1 lands')
})

test('bisection — a final failed tip not yet reverted in-loop rides the merge revert clause, exactly once, HEAD-guarded', async () => {
  const fa = nit({ title: 'fa nit', file: 'skills/fa.js' })
  const fb = nit({ title: 'fb nit', file: 'skills/fb.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa, fb]), bRegress('zz.js'), bApprove(), bRegress('zz.js')],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],   // half 1 approves
    'ace:t1:r3': [bWorker('sub00002')],   // half 2 (a singleton — atomic) regresses: FINAL failed tip
  }, aceBase([fa, fb]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const merge = calls.find(isMergeTask)
  assert.match(merge.prompt, /revert\s+--no-edit\s+sub00002/, 'the merge revert clause names the final failed subset tip')
  assert.ok(merge.prompt.includes('rev-parse HEAD'), 'the merge revert is HEAD-guarded (idempotent — a sha is never reverted twice)')
  assert.ok(!merge.prompt.includes('revert --no-edit ace00001') && !merge.prompt.includes('revert --no-edit sub00001'),
    'no other sha rides the merge revert clause (in-loop reverts already handled the batch; the approved half is never reverted)')
  assert.ok((out.aced || []).some(a => a.finding.title === 'fa nit' && a.sha === 'sub00001'), 'the approved half stays aced — the merge runs on a tip whose failed subsets are reverted')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'fb nit'), 'the finally-failing half demotes')
  assert.ok(out.landed.includes('t1'), 't1 lands')
})

test('bisection — budget: each subset COMMIT charges one fixRounds slot; the floor-retry reserve (roundLimit − 2) demotes the remaining subsets to follow-up (logged, by design) and the task still lands', async () => {
  const fa = nit({ title: 'fa nit', file: 'skills/fa.js' })
  const fb = nit({ title: 'fb nit', file: 'skills/fb.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa, fb]), bRegress('zz.js'), bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
  }, aceBase([fa, fb]))
  // roundLimit 4 ⇒ subset boundary roundLimit − 2 = 2 (Open decision 4): batch charges slot 1,
  // subset 1 charges slot 2 — subset 2 finds the reserve line reached (2 slots kept for the
  // merge-floor retry loop).
  const { out, calls, logs } = await runPhase(ACE_ARGS({ run: { ace: true, roundLimit: 4 } }), impl)
  assert.equal(calls.filter(isAce).length, 2, 'batch + one subset — the second subset is never dispatched (floor-retry reserve reached)')
  assert.ok((out.aced || []).some(a => a.finding.title === 'fa nit' && a.sha === 'sub00001'), 'the committed subset aces')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'fb nit'), 'the un-dispatched remainder demotes to follow-up')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('reserved for the merge-floor retry loop')), 'the reserve-exhausted branch logs why the ladder stopped')
  assert.ok(out.landed.includes('t1'), 't1 lands')
  const audEntry = out.auditLog.find(e => e && e.task === 't1' && e.verdict === 'approve')
  assert.ok(audEntry, 'presence guard: the t1 approve entry exists')
})

test('bisection — same-file findings never split across subsets (D3): two findings in one file regress as an ATOMIC batch (no subset dispatch); grouped halving keeps a file whole', async () => {
  // Atomic arm: two absorbs in the SAME file, ambiguous regression ⇒ no lawful split ⇒ whole batch demotes.
  const s1 = nit({ title: 'same one', file: 'skills/same.js' })
  const s2 = nit({ title: 'same two', file: 'skills/same.js' })
  const atomicImpl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([s1, s2]), bRegress('zz.js')],
    'ace:t1:r1': [bWorker('ace00001')],
  }, aceBase([s1, s2]))
  const atomic = await runPhase(ACE_ARGS(), atomicImpl)
  assert.equal(atomic.calls.filter(isAce).length, 1, 'no subset dispatch — a single file group cannot split (D3)')
  assert.ok(['same one', 'same two'].every(t => (atomic.out.minorsFiled || []).some(m => m && m.title === t)),
    'the atomic batch demotes whole')
  assert.match(atomic.calls.find(isMergeTask).prompt, /revert\s+--no-edit\s+ace00001/, 'the merge reverts the atomic failed batch')
  // Grouped arm: two same-file findings + one other file ⇒ halves are [same,same] and [other].
  const o1 = nit({ title: 'other one', file: 'skills/other.js' })
  const groupedImpl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([s1, s2, o1]), bRegress('zz.js'), bApprove(), bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
    'ace:t1:r3': [bWorker('sub00002')],
  }, aceBase([s1, s2, o1]))
  const grouped = await runPhase(ACE_ARGS(), groupedImpl)
  const gAces = grouped.calls.filter(isAce)
  assert.equal(gAces.length, 3, 'batch + two halves')
  assert.ok(gAces[1].prompt.includes('same one') && gAces[1].prompt.includes('same two') && !gAces[1].prompt.includes('other one'),
    'the same-file findings travel together in one subset')
  assert.ok(gAces[2].prompt.includes('other one'), 'the other file forms the second half')
})

test('bisection — a blocked/sha-less subset worker abandons the ladder: this and every queued subset demote (logged), the pending failed tip rides the merge revert clause, the task still lands', async () => {
  const fa = nit({ title: 'fa nit', file: 'skills/fa.js' })
  const fb = nit({ title: 'fb nit', file: 'skills/fb.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa, fb]), bRegress('zz.js')],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [{ task_id: 't1', status: 'blocked', blocked_reason: 'boom' }],
  }, aceBase([fa, fb]))
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 2, 'the ladder abandons after the blocked subset — no further subset dispatch')
  assert.ok(['fa nit', 'fb nit'].every(t => (out.minorsFiled || []).some(m => m && m.title === t)),
    'the blocked subset AND the queued remainder demote to follow-up')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('bisection abandoned')), 'the abandonment demotion is logged')
  assert.match(calls.find(isMergeTask).prompt, /revert\s+--no-edit\s+ace00001/,
    'the failed batch tip (never reverted in-loop — the blocked dispatch proves nothing) rides the HEAD-guarded merge revert clause')
  assert.ok(out.landed.includes('t1'), 't1 lands — the ladder never blocks a land')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), 't1 is not escalated')
})

// ---------------------------------------------------------------------------
// ace-trailer regression rows (Phase 7 Task 2, End state 11 — D12 trailer equality,
// culprit-path normalization, Open decision 4 floor-retry reserve, #1694 fold):
// the PREFLIGHT/commit mandates are prompt-enforced (the subset worker performs the
// compare), so the exact-equality and final-paragraph rows pin the dispatched prompt
// literals against a fixture whose sibling trailers ARE in strict-prefix relation;
// path attribution and the reserve boundary are engine behavior and get functional rows.
// ---------------------------------------------------------------------------

test('bisection ace-trailer — a sibling strict-prefix trailer pair never matches under exact-value comparison: every subset dispatch mandates EXACT whole-string equality (never prefix/substring) and the final-paragraph trailer block', async () => {
  // Files chosen so the two halves' deterministic trailer values are in STRICT-PREFIX relation
  // ('t1:skills/aa.js' vs 't1:skills/aa.js.bak') — the exact collision class a prefix/substring
  // preflight compare would false-hit on resume.
  const f1 = nit({ title: 'aa nit', file: 'skills/aa.js' })
  const f2 = nit({ title: 'bak nit', file: 'skills/aa.js.bak' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([f1, f2]), bRegress('zz-unrelated.js'), bApprove(), bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],
    'ace:t1:r3': [bWorker('sub00002')],
  }, aceBase([f1, f2]))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 3, 'batch + two blind halves (presence guard for the two subset prompts under test)')
  // Fixture negative control: the sibling trailer values really are a strict-prefix pair — the
  // exact-equality mandate is the ONLY thing keeping them distinguishable.
  const trailerOf = c => { const m = c.prompt.match(/`Ace-Subset: ([^`]+)`/); return m && m[1] }
  const [ta, tb] = [trailerOf(aces[1]), trailerOf(aces[2])]
  assert.equal(ta, 't1:skills/aa.js', 'half 1 carries its own full deterministic trailer value')
  assert.equal(tb, 't1:skills/aa.js.bak', 'half 2 carries its own full deterministic trailer value')
  assert.ok(tb.startsWith(ta) && tb !== ta, 'fixture control: the pair IS a strict prefix — exact-value comparison is load-bearing')
  for (const c of aces.slice(1)) {
    assert.ok(c.prompt.includes('EXACT whole-string equality'),
      'the PREFLIGHT mandates exact whole-string trailer-value equality (D12)')
    assert.ok(c.prompt.includes('never a prefix or substring match'),
      'the PREFLIGHT forbids prefix/substring trailer matching — a strict-prefix sibling never matches')
    assert.ok(c.prompt.includes('OWN final paragraph, separated from the body by a blank line'),
      'the commit instruction mandates the Ace-Subset trailer as its own blank-line-separated final paragraph (git parses trailers only in a distinct final block)')
  }
  // Both halves ace at their own shas — the strict-prefix pair resolved to distinct commits.
  assert.ok((out.aced || []).some(a => a.finding.title === 'aa nit' && a.sha === 'sub00001'), 'half 1 aced at its sha')
  assert.ok((out.aced || []).some(a => a.finding.title === 'bak nit' && a.sha === 'sub00002'), 'half 2 aced at its sha')
})

test('bisection ace-trailer — culprit-path form (D12): a `./`-prefixed regression path and a bare aceable path attribute identically, in BOTH directions, and the audit prompt mandates repo-relative finding paths', async () => {
  // Direction 1: the REGRESSION finding is ./-prefixed, the aceable finding is bare.
  const mkImpl = (aceFile, regressFile) => {
    const fa = nit({ title: 'culprit nit', file: aceFile })
    const fb = nit({ title: 'salvaged nit', file: 'skills/b.js' })
    return buildSeqImpl({
      'audit:t1:correctness': [bApprove([fa, fb]), bRegress(regressFile), bApprove()],
      'ace:t1:r1': [bWorker('ace00001')],
      'ace:t1:r2': [bWorker('sub00001')],
    }, aceBase([fa, fb]))
  }
  for (const [aceFile, regressFile, dir] of [
    ['skills/a.js', './skills/a.js', './-prefixed regression vs bare aceable'],
    ['./skills/a.js', 'skills/a.js', 'bare regression vs ./-prefixed aceable'],
  ]) {
    const { out, calls } = await runPhase(ACE_ARGS(), mkImpl(aceFile, regressFile))
    // Without aceRelPath normalization the compare misses ⇒ ambiguous blind halving (3 ace calls,
    // no culprit demotion) — this count is the discriminating assertion.
    assert.equal(calls.filter(isAce).length, 2,
      `${dir}: culprit-first excision fires (batch + ONE remainder subset — never blind halving)`)
    assert.ok((out.minorsFiled || []).some(m => m && m.title === 'culprit nit'),
      `${dir}: the path-form-drifted culprit still demotes to follow-up`)
    assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'salvaged nit' && a.sha === 'sub00001'),
      `${dir}: the non-culprit remainder still aces`)
    // The re-audit dispatches carry the source-side mandate closing the drift class at origin
    // (auditPrompt seats only — the gate-audit family builds its own prompt, out of scope here).
    const audits = calls.filter(c => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:'))
    assert.ok(audits.length && audits.every(c => c.prompt.includes('FINDING-PATH FORM')
      && c.prompt.includes('never `./`-prefixed')),
      `${dir}: every audit dispatch (re-audits included) mandates repo-relative, never ./-prefixed finding paths`)
  }
})

test('bisection ace-trailer — floor-retry reserve (Open decision 4): the subset ladder stops at roundLimit − 2 mid-queue, leaving the merge-floor retry loop its 2 reserved slots; the stop is logged and the remainder demotes', async () => {
  // roundLimit 5 ⇒ subset boundary 3. Charges: batch (1) → half [f1,f2] (2) regresses and splits
  // → depth-2 [f1] (3) approves → [f2] and the untouched half [f3,f4] find the reserve line
  // reached: exactly 2 of 5 slots remain for the merge-floor retry loop.
  const f1 = nit({ title: 'f1 nit', file: 'skills/f1.js' })
  const f2 = nit({ title: 'f2 nit', file: 'skills/f2.js' })
  const f3 = nit({ title: 'f3 nit', file: 'skills/f3.js' })
  const f4 = nit({ title: 'f4 nit', file: 'skills/f4.js' })
  const impl = buildSeqImpl({
    'audit:t1:correctness': [
      bApprove([f1, f2, f3, f4]),
      bRegress('zz-unrelated.js'),   // batch regresses, ambiguous ⇒ halves [f1,f2] [f3,f4]
      bRegress('zz-unrelated.js'),   // [f1,f2] regresses ⇒ splits to [f1] [f2] ahead of [f3,f4]
      bApprove(),                    // [f1] approves — the third and final charged slot
    ],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],   // [f1,f2]
    'ace:t1:r3': [bWorker('sub00002')],   // [f1]
  }, aceBase([f1, f2, f3, f4]))
  const { out, calls, logs } = await runPhase(ACE_ARGS({ run: { ace: true, roundLimit: 5 } }), impl)
  // Without the reserve (a bare < roundLimit gate) [f2] would dispatch a 4th ace call.
  assert.equal(calls.filter(isAce).length, 3, 'batch + two subsets — the ladder stops AT roundLimit − 2, never draws the reserved slots')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('reached roundLimit−2 (3)')
    && l.includes('2 slots stay reserved for the merge-floor retry loop')),
    'the reserve-exhausted branch logs the boundary value and why the ladder stopped')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'f1 nit' && a.sha === 'sub00002'),
    'the subset committed inside the budget still aces')
  assert.ok(['f2 nit', 'f3 nit', 'f4 nit'].every(t => (out.minorsFiled || []).some(m => m && m.title === t)),
    'the mid-queue remainder — the split sibling AND the untouched half — demotes to follow-up')
  assert.ok(out.landed.includes('t1'), 't1 still lands')
})

test('bisection ace-trailer — fold (#1694): an ask raised by the ace-regression re-audit round parks on asks[], never drops', async () => {
  const fa = nit({ title: 'a nit', file: 'skills/a.js' })
  const askMinor = { severity: 'Minor', title: 'regress-round ask', file: 'skills/q.js',
    rationale: 'decision needed', disposition: 'ask', ask: { question: 'keep or revert?', fork: ['keep', 'revert'] } }
  const regressWithAsk = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
    confidence: 'high', findings: [{ severity: 'Major', title: 'regressed', file: 'skills/a.js', rationale: 'broke' }, askMinor] }
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([fa]), regressWithAsk],
    'ace:t1:r1': [bWorker('ace00001')],
  }, aceBase([fa]))
  const { out } = await runPhase(ACE_ARGS(), impl)
  const parked = (out.asks || []).find(a => a && a.question === 'keep or revert?')
  assert.ok(parked, 'the ace-regression round\'s ask parks on asks[]')
  assert.equal(parked.task, 't1', 'the parked ask carries task attribution')
  assert.deepEqual(parked.fork, ['keep', 'revert'], 'the parked ask carries the fork verbatim')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'regress-round ask')
    && !(out.notes || []).some(n => n && n.title === 'regress-round ask'),
    'the ask is neither demoted into minorsFiled nor dropped into notes')
  // The regression signal itself is untouched: the all-culprit batch still fails whole.
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'a nit'), 'the culprit batch finding still demotes (the ask routing never eats the ladder input)')
  assert.ok(out.landed.includes('t1'), 't1 still lands')
})

test('bisection ace-trailer — fold (#1694): an ask raised by a FAILING bisection subset\'s re-audit parks on asks[], never drops', async () => {
  const f1 = nit({ title: 'f1 nit', file: 'skills/f1.js' })
  const f2 = nit({ title: 'f2 nit', file: 'skills/f2.js' })
  const subRegressWithAsk = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
    confidence: 'high', findings: [
      { severity: 'Major', title: 'sub regressed', file: 'zz-unrelated.js', rationale: 'broke' },
      { severity: 'Nit', title: 'subset ask', file: 'skills/w.js', rationale: 'decision needed',
        disposition: 'ask', ask: { question: 'split further?', fork: ['yes', 'no'] } },
    ] }
  const impl = buildSeqImpl({
    'audit:t1:correctness': [bApprove([f1, f2]), bRegress('zz-unrelated.js'), subRegressWithAsk, bApprove()],
    'ace:t1:r1': [bWorker('ace00001')],
    'ace:t1:r2': [bWorker('sub00001')],   // [f1] — regresses with the ask riding the re-audit
    'ace:t1:r3': [bWorker('sub00002')],   // [f2] — approves
  }, aceBase([f1, f2]))
  const { out } = await runPhase(ACE_ARGS(), impl)
  const parked = (out.asks || []).find(a => a && a.question === 'split further?')
  assert.ok(parked, 'the failing subset\'s re-audit ask parks on asks[]')
  assert.equal(parked.task, 't1', 'the parked ask carries task attribution')
  assert.deepEqual(parked.fork, ['yes', 'no'], 'the parked ask carries the fork verbatim')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'subset ask')
    && !(out.notes || []).some(n => n && n.title === 'subset ask'),
    'the ask is neither demoted into minorsFiled nor dropped into notes')
  // The failing-subset arm's own mechanics are untouched by the routing.
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'f1 nit'), 'the finally-failing singleton subset still demotes at the depth/split floor')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'f2 nit' && a.sha === 'sub00002'), 'the sibling subset still aces')
  assert.ok(out.landed.includes('t1'), 't1 still lands')
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
  // run.ace is ON in ACE_ARGS — yet neither dispositionless finding aces (absorb and ask are never defaults).
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
  // The four-member enum, ORDER PINNED (End state 1, #1550): ask joins as the fourth member —
  // the deepEqual is on the literal array, not a sorted copy, so a reorder reds too.
  assert.deepEqual(JSON.parse(dm[1].replace(/'/g, '"')), ['absorb', 'follow-up', 'note', 'ask'], "disposition enum is exactly ['absorb','follow-up','note','ask']")
  assert.match(src, /phaseClose:\s*\{\s*type:\s*'boolean'\s*\}/, 'phaseClose declared boolean')
  assert.match(src, /autoFixable:\s*\{\s*type:\s*'boolean'\s*\}/, 'autoFixable declared boolean')
  assert.match(src, /autoFixable is DEPRECATED/, 'the deprecation is documented at the schema literal')
})

// The question+fork field (End state 1, #1550 — PIN-1's mandatory-field guardrail): the finding
// items schema declares `ask` { question, fork } and makes it REQUIRED exactly when
// disposition:'ask' via an items-level if/then (the top-level escalate-boundary conditional's
// idiom — same Ajv layer, same bounded conform-or-retry enforcement arm).
test('#1550 — the AUDIT_VERDICT finding items carry the mandatory question+fork `ask` field with the required-when-ask if/then conditional', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const aud = calls.find(c => isAuditor(c) && (c.opts.label || '').startsWith('audit:'))
  assert.ok(aud && aud.opts.schema, 'a roster audit dispatch carries a schema (presence guard)')
  const items = aud.opts.schema.properties.findings.items
  const askField = items.properties.ask
  assert.ok(askField, 'finding items declare the ask field')
  assert.equal(askField.type, 'object', 'ask is an object')
  assert.deepEqual(askField.required, ['question', 'fork'], 'the ask object requires question AND fork')
  assert.equal(askField.properties.question.minLength, 1, 'question is non-empty (minLength 1)')
  assert.equal(askField.properties.fork.minItems, 2, 'fork carries the two branches (minItems 2)')
  assert.equal(items.if && items.if.properties.disposition.const, 'ask', "the items-level if arm triggers exactly on disposition 'ask'")
  assert.deepEqual(items.if.required, ['disposition'], 'the if arm requires disposition present (no vacuous trigger)')
  assert.deepEqual(items.then && items.then.required, ['ask'], "the then arm makes the ask field required on a disposition:'ask' finding")
})

// ---------------------------------------------------------------------------
// Phase 2 Task 2.1 (#1410 fix 1) — the escalate-boundary INTAKE contract. Enforcement arm recorded
// by the worker probe (2026-08-15, code-read of the running agent({schema}) layer, harness v2.1.228):
// the layer Ajv-compiles the FULL dispatched schema (allErrors) and a non-conforming StructuredOutput
// return throws a schema-mismatch that re-prompts the seat (bounded conform-or-retry) — so the
// AUDIT_VERDICT if/then conditional IS the validation-layer observable: an escalate verdict without a
// non-empty escalate_reason is rejected at intake and re-prompted. The layer's strict-schema deriver
// (keyword allowlist, no if/then) already fell back to non-strict on this schema (tests_verified has
// no properties), so the conditional adds no strict-mode regression, never drops a seat, and adds no
// hold path (A8).
// ---------------------------------------------------------------------------

test('Task 2.1 intake contract (#1410): the dispatched AUDIT_VERDICT carries the required-when-escalate if/then conditional — an escalate verdict without a non-empty escalate_reason is schema-rejected', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const aud = calls.find(c => isAuditor(c) && (c.opts.label || '').startsWith('audit:'))
  assert.ok(aud && aud.opts.schema, 'a roster audit dispatch carries a schema (presence guard)')
  const s = aud.opts.schema
  assert.equal(s.if && s.if.properties && s.if.properties.verdict && s.if.properties.verdict.const, 'escalate',
    "the if arm triggers exactly on verdict 'escalate'")
  assert.deepEqual(s.if.required, ['verdict'], 'the if arm requires verdict present (no vacuous trigger)')
  assert.deepEqual(s.then && s.then.required, ['escalate_reason'], 'the then arm makes escalate_reason required')
  assert.equal(s.then.properties.escalate_reason.minLength, 1, 'non-empty: minLength 1 in the then arm')
  assert.equal(s.properties.escalate_reason.type, 'string',
    'escalate_reason stays a declared top-level string property (optional outside the escalate arm)')
  // The same constant rides every dispatch site — the roster seats and the three gate-audit-family
  // seats all pass `schema: AUDIT_VERDICT`, so the conditional reaches all of them.
  assert.ok((src.match(/schema: AUDIT_VERDICT/g) || []).length >= 4,
    'all four AUDIT_VERDICT dispatch sites (roster + three gate-audit-family seats) share the constant')
  assert.match(src, /if: \{ properties: \{ verdict: \{ const: 'escalate' \} \}, required: \['verdict'\] \}/,
    'the conditional lives inside the AUDIT_VERDICT literal (source pin)')
})

test('Task 2.1 (#1410): required-when-escalate is stated on the prose surfaces; the escalate_reason? optional marker is retired (End state 15 greps, encoded)', () => {
  for (const [name, text] of [['war-auditor.md', auditorMd], ['references/schemas.md', schemasMd]]) {
    assert.match(text, /required when/i, `${name} states the required-when-escalate contract (NEW-present)`)
    assert.ok(!text.includes('escalate_reason?'), `${name} no longer carries the escalate_reason? optional marker (OLD-absent)`)
  }
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

// ---------------------------------------------------------------------------
// The ask channel (#1550, ADR 0013 amendment 2026-08-25 — End states 1+2):
// disposition:'ask' parks on asks[] at every dispositionOf site (ask arm preceding the absorb
// chain, default-deny order-census), demote() refuses an ask loudly, unruled asks are excluded
// from consolidation/filing, and the handoff carries the ninth (lossy) asks key.
// ---------------------------------------------------------------------------

// A well-formed ask finding (the schema-mandatory question+fork field present).
const askFinding = (over = {}) => ({ severity: 'Minor', title: 'mirror or point', file: 'docs/x.md',
  rationale: 'a policy call only the operator can make', disposition: 'ask',
  ask: { question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source'] }, ...over })

test('#1550 ask parking (approve path): an ask parks on asks[] with question+fork+provenance — never aced, never filed, never noted; the task still lands', async () => {
  const fu = bare({ severity: 'Minor', title: 'real follow-up', rationale: 'needs new tests — beyond phase scope' })
  const { out, calls } = await runPhase(ACE_ARGS(), aceBase([askFinding(), fu]))
  assert.ok(!calls.some(isAce), 'an ask never dispatches the ace worker, even under run.ace')
  assert.equal((out.asks || []).length, 1, 'exactly one parked ask rides the top-level return (beside minorsFiled)')
  const a = out.asks[0]
  assert.equal(a.task, 't1', 'the parked ask carries its task')
  assert.equal(a.seat, 'audit:t1:correctness', 'the parked ask carries its raising seat (minorsOf stamp)')
  assert.equal(a.sha, null, 'no echoed audit_sha ⇒ sha null (absence-tolerant, never a throw)')
  assert.equal(a.question, 'mirror the value or point at the source?', 'the parked ask carries the question (the decision needed)')
  assert.deepEqual(a.fork, ['mirror the value', 'point at the source'], 'the parked ask carries the fork (the two branches)')
  assert.ok(a.finding && a.finding.title === 'mirror or point', 'the full finding row rides the return-side record')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'mirror or point'), 'the ask is NOT in minorsFiled (never filed unruled)')
  assert.ok(!(out.notes || []).some(n => n && n.title === 'mirror or point'), 'the ask is NOT in notes')
  assert.ok(out.landed.includes('t1'), 'an open ask never blocks the land (parked, not held)')
  // Exclusion from the file-followups dispatch (End state 2): the filing prompt renders the
  // follow-up row and NOT the parked ask.
  const filing = calls.find(c => c.opts.dispatchKind === 'file-followups')
  assert.ok(filing, 'the filing dispatch fired (minorsFiled non-empty — presence guard, non-vacuous exclusion)')
  assert.ok(filing.prompt.includes('real follow-up'), 'the follow-up row IS in the filing prompt')
  assert.ok(!filing.prompt.includes('mirror or point') && !filing.prompt.includes('mirror the value or point at the source?'),
    'the parked ask is EXCLUDED from the file-followups dispatch (never filed unruled)')
  // The ninth handoff key (lossy projection, ADDITIVE — adjacent to the follow-ups row).
  const h = out.handoff
  assert.ok(h, 'handoff present on landed')
  assert.deepEqual(h.asks, [{ task: 't1', seat: 'audit:t1:correctness', sha: null,
    question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source'] }],
    'handoff.asks is the LOSSY projection — question + fork + task/seat/sha, no finding row')
  assert.ok(!('finding' in h.asks[0]), 'the handoff projection drops the full finding (lossy by design)')
  const keys = Object.keys(h)
  assert.equal(keys.indexOf('asks'), keys.indexOf('followUps') + 1,
    'the asks key sits adjacent to the followUps row (additive ninth key — no exact-key validator)')
  assert.ok(!h.followUps.some(f => /mirror or point/.test(f.reason || '')), 'handoff.followUps excludes the ask')
})

test('#1550 ask parking (non-approve path): an ask on an escalated task parks — never demoted into minorsFiled with the escalation', async () => {
  const impl = (prompt, opts) => {
    if (seatOf(opts) === 'war-auditor') {
      return { seat: opts.label, lens: 'correctness', verdict: 'escalate', escalate_reason: 'plan wrong', confidence: 'high',
        findings: [askFinding({ title: 'ask on escalated task' })] }
    }
    return aceBase([])(prompt, opts)
  }
  const { out } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.escalated || []).some(e => e && e.task === 't1'), 't1 escalated (presence guard)')
  assert.ok((out.asks || []).some(a => a && a.finding && a.finding.title === 'ask on escalated task'),
    'the ask parks on asks[] even on the never-approved path (the question survives the escalation)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'ask on escalated task'),
    'the ask is NOT filed with the escalation (never filed unruled)')
  assert.ok(!(out.notes || []).some(n => n && n.title === 'ask on escalated task'), 'the ask is NOT in notes')
})

// demote() ask refusal (End state 1) — unit-tested on the EXTRACTED engine functions (the
// dispositionOf → parkAsk → demote slice evaluated with harness accumulators), because with the
// ask arm first at every routing site no runPhase flow can reach demote() with an ask: the
// refusal is the defense-in-depth backstop, exercised here directly.
test('#1550 — demote() refuses an ask loudly: log + exactly-once asks[] membership by finding identity, never minorsFiled/notes, never a throw', () => {
  const sliceStart = src.indexOf('const dispositionOf')
  const sliceEnd = src.indexOf('const aceEligible')
  assert.ok(sliceStart !== -1 && sliceEnd > sliceStart, 'the dispositionOf→demote engine slice is locatable')
  const harness = new Function('log', 'notes', 'minorsFiled', 'asks',
    src.slice(sliceStart, sliceEnd) + '\nreturn { dispositionOf, parkAsk, demote }')
  const logs = [], notes = [], minorsFiled = [], asks = []
  const { dispositionOf, parkAsk, demote } = harness(m => logs.push(m), notes, minorsFiled, asks)
  assert.equal(dispositionOf(askFinding()), 'ask', "dispositionOf classifies an explicit disposition:'ask' as ask")
  assert.equal(dispositionOf({ severity: 'Minor', title: 'no explicit' }), 'follow-up', 'ask is NEVER defaulted (Minor keeps its follow-up default)')
  const f = askFinding({ task: 't9' })
  assert.doesNotThrow(() => demote(f, 'follow-up', 'a would-be demotion'), 'the refusal NEVER throws (a throw would destroy the parked records on held:workflow-error)')
  assert.equal(asks.length, 1, 'the refused ask re-routes onto asks[]')
  assert.equal(asks[0].question, f.ask.question, 'the re-routed record carries the question')
  demote(f, 'note', 'a second would-be demotion')
  parkAsk(f)
  assert.equal(asks.length, 1, 'exactly-once membership by finding identity — refusal and parkAsk dedup to ONE record')
  assert.deepEqual(minorsFiled, [], 'a refused ask NEVER lands in minorsFiled')
  assert.deepEqual(notes, [], 'a refused ask NEVER lands in notes')
  const refusal = logs.find(l => typeof l === 'string' && l.includes('REFUSED (ask)'))
  assert.ok(refusal, 'the refusal is log()ged loudly')
  assert.ok(refusal.includes('a would-be demotion'), 'the refusal log carries the demotion reason (why)')
  // Control (delete-and-trace): a non-ask demotion still routes through the ladder normally.
  demote({ severity: 'Nit', title: 'plain', task: 't9', disposition: 'absorb' }, 'note', 'control')
  assert.ok(notes.some(n => n.title === 'plain'), 'a non-ask demotion still routes (the refusal is ask-scoped)')
  // Absence-tolerant fallback (fail-open, never a throw): a fork-less finding missing the
  // schema-mandatory `ask` field still parks intact — question falls back to the title, fork to [].
  parkAsk({ severity: 'Minor', title: 'no ask field', task: 't9' })
  const parked = asks.find(a => a.question === 'no ask field')
  assert.ok(parked, 'a finding without an `ask` field parks with question falling back to f.title (fail-open, never dropped)')
  assert.deepEqual(parked.fork, [], 'a finding without an `ask` field parks with fork falling back to []')
})

// Default-deny order-census (End states 1+2, D7 — the floored domain): exactly five dispositionOf
// call sites, each carrying an explicit ask arm that PRECEDES its absorb chain, plus the
// pinMismatch strip as the extra row (a non-dispositionOf disposition sink, comment-named).
// A NEW dispositionOf call site reds the count until it joins this census with its own ask arm.
test('#1550 (D7) — ask order-census: five dispositionOf sites with ask preceding the absorb chain, default-deny, plus the comment-named pinMismatch strip row', () => {
  // The classifier itself: the ask arm precedes the absorb chain inside dispositionOf.
  const defStart = src.indexOf('const dispositionOf')
  const def = src.slice(defStart, src.indexOf('const parkAsk', defStart))
  assert.ok(def.indexOf("'ask'") !== -1, 'dispositionOf carries the ask member')
  assert.ok(def.indexOf("=== 'ask'") < def.indexOf("'absorb'"), 'the classifier checks ask before the absorb chain')
  // Call-site domain discovery (default-deny): every dispositionOf( occurrence in the source.
  const sites = []
  for (let i = src.indexOf('dispositionOf('); i !== -1; i = src.indexOf('dispositionOf(', i + 1)) sites.push(i)
  // 8 → 5 (in-run-finding-resolution Task 1.1, D1): the four re-audit-round routing loops (batch
  // approved/regressed + the two bisection-subset arms) consolidated into the ONE shared
  // routeReauditMinors helper (its dispositionOf site carries the ask arm first, then the re-entry
  // queue as its absorb chain) — an ask raised at any re-audit still parks, never drops.
  assert.equal(sites.length, 5,
    `the floored order-census domain is exactly FIVE dispositionOf call sites (found ${sites.length}) — a new site must join this census with its own ask arm preceding its absorb chain`)
  const ABSORB_CHAIN = /demote\(|aceable\.push|phaseCloseQueue\.push/
  for (const i of sites) {
    const slice = src.slice(i, i + 700)
    const askIdx = slice.indexOf("=== 'ask'")
    assert.ok(askIdx !== -1, `dispositionOf site @${i}: carries an explicit ask arm`)
    const parkIdx = slice.indexOf('parkAsk(')
    assert.ok(parkIdx !== -1, `dispositionOf site @${i}: the ask arm parks via parkAsk (exactly-once funnel)`)
    const chain = slice.search(ABSORB_CHAIN)
    assert.ok(chain !== -1, `dispositionOf site @${i}: the absorb chain is locatable (demote/aceable/phaseCloseQueue)`)
    assert.ok(askIdx < chain && parkIdx < chain, `dispositionOf site @${i}: the ask arm PRECEDES the absorb chain (D7 order)`)
  }
  // The pinMismatch strip row: a NON-dispositionOf disposition sink — the destructure that drops
  // routing metadata must exist exactly once and its comment must name the ask member (a
  // pin-mismatched seat's ask never parks; it falls to the Nit note default with the strip).
  const strips = src.split("({ disposition, autoFixable, ...f })").length - 1
  assert.equal(strips, 1, 'exactly ONE pinMismatch strip site (the single collection-site enforcement)')
  const stripIdx = src.indexOf("({ disposition, autoFixable, ...f })")
  const stripComment = src.slice(Math.max(0, stripIdx - 2000), stripIdx)
  assert.ok(/the ask member included/.test(stripComment) && /never parks/.test(stripComment),
    "the pinMismatch strip comment NAMES the ask member and states a pin-mismatched ask never parks (the census's ninth row)")
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

test('files_changed contract (end state 8): IDENTICAL wording in agents/war-worker.md and the dispatched worker prompt', async () => {
  const RULE = 'Report every files_changed path as worktree-relative — never an absolute path and never one rooted in the main checkout — so no downstream consumer ever sees a path that escapes the isolated worktree.'
  assert.ok(workerMd.includes(RULE), 'war-worker.md carries the canonical files_changed contract sentence (standing surface)')
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w = calls.find(isWorker)
  assert.ok(w, 'a worker dispatched (presence guard)')
  assert.ok(w.prompt.includes(RULE), 'the dispatched worker prompt carries the SAME sentence byte-for-byte (both-surfaces rule, one commit)')
})

// --- Auditor surfaces (criterion 8): latitude + disposition rules on BOTH surfaces ---

test('latitude + disposition rules (criterion 8): war-auditor.md AND auditPrompt carry the same rule sentences', async () => {
  const LATITUDE = "the plan slice is the floor, the Commander's Intent is the ceiling — intent-consistent work beyond the literal slice is APPROVE (judge it on its own correctness), never a plan-faithfulness violation; only deviations that contradict the intent or the slice block. No intent threaded means judge against the plan slice alone, as before."
  const DISPO = 'every Minor/Nit finding carries a disposition — absorb (mechanical, intent-consistent, safe to fix this phase; set phaseClose:true when the fix needs the integrated tip or touches a shared/slot-adjacent file), follow-up (substantive work beyond this phase — MUST state why it is not absorbable), note (informational; phase report + servitor feed, never an issue), or ask (a decision-shaped Minor/Nit only the operator can rule — MUST carry the `ask` field: `question` naming the decision needed plus `fork` naming the two branches; parked unruled and ruled at the Checkpoint, never filed unruled). Omitted disposition defaults: Minor becomes follow-up, Nit becomes note; absorb and ask are never defaults.'
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
// #811 QUOTE-LINT ANCHOR: COST_CLAIM_SHARED is a quote-bearing byte literal COUPLED across THREE surfaces —
// (1) the COST-CLAIM RULE literal in auditPrompt() / workflow-template.js, (2) agents/war-auditor.md's
// Cost-claim rule line, (3) this test's own copy below. The presence tests below byte-compare all three, so
// any quote-style lint (straight↔curly, escaping) MUST run identically across ALL THREE in ONE commit or it
// silently breaks the byte-identity guard here (shared-string-constant-quote-literal lesson; a JS pointer
// comment mirrors this at the workflow-template.js literal; CALIBRATION_RULE_ANCHORS precedent).
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

// Per-rule qualifier lock (spec §4.A, #693). Locate the four CALIBRATION_RULE_ANCHORS SEQUENTIALLY —
// anchor i searched from anchor i-1's match end — so a rule REORDER surfaces as a distinct
// 'anchor-missing' status (the out-of-order anchor is not found searching forward), never as a
// mis-sliced window misread as qualifier drift. Window i = [anchor i start, anchor i+1 start); window
// 4 runs to the first `\n#` heading after anchor 4, else end-of-text — so on the standing card window 4
// deliberately spans rule 5's qualifier-free line (it stops before `## Verdict`), and on the isolated
// dispatched line (no `\n#`) it stops at the clause end. Per rule the helper returns { status: 'ok' |
// 'qualifier-missing' | 'anchor-missing', anchor, start, end }; the [start,end) offsets feed the
// companion mutation test's window-scoped splice surgery. It never throws — anchor PRESENCE is the
// sibling anchor test's job; a missing anchor yields 'anchor-missing' (its message names the anchor).
//
// Ceiling (broadened from spec §8, naming the real ceiling): this guard is blind to any QUALIFIER-FREE
// rule insertion — rule 5 (the deliberately-unwired marker) already demonstrates that by design. A
// QUALIFIER-BEARING rule inserted BETWEEN two anchors would land in the preceding rule's window and
// could mask that rule's drop. Both are accepted ceilings; the tripwire for any anchored-rule change is
// the CALIBRATION_RULE_ANCHORS array and its sibling anchor test above.
const CALIBRATION_QUALIFIER = /only when the live artifact confirms/i
function qualifierPerRuleWindows(text) {
  const starts = []
  let from = 0
  for (const re of CALIBRATION_RULE_ANCHORS) {
    const m = text.slice(from).match(re)          // non-global anchors: .match on a slice is safe
    if (m) { starts.push(from + m.index); from += m.index + m[0].length }
    else { starts.push(-1) }                       // leave `from` so a later anchor can still match forward
  }
  return CALIBRATION_RULE_ANCHORS.map((re, i) => {
    if (starts[i] < 0) return { status: 'anchor-missing', anchor: String(re), start: -1, end: -1 }
    const start = starts[i]
    let end
    if (i < CALIBRATION_RULE_ANCHORS.length - 1 && starts[i + 1] >= 0) {
      end = starts[i + 1]
    } else {
      const h = text.indexOf('\n#', start)
      end = h >= 0 ? h : text.length
    }
    const status = CALIBRATION_QUALIFIER.test(text.slice(start, end)) ? 'ok' : 'qualifier-missing'
    return { status, anchor: String(re), start, end }
  })
}

// Dispatched surface = the SINGLE calibration line isolated from the captured auditor prompt: split on
// `\n`, take the one line matching anchor 1. Running the window helper on that line ALONE puts window
// 4's end-of-text terminator exactly at the clause end, so no trailing prompt clause (CASCADING-IMPACT)
// or memory-prefetch text can ever feed window 4 (resolves the spec §3-vs-§4.A window-4 terminator
// ambiguity without any byte-literal anchor on the trailing clause).
function calibrationLine(prompt) {
  const line = prompt.split('\n').find((l) => CALIBRATION_RULE_ANCHORS[0].test(l))
  assert.ok(line, 'auditPrompt carries the calibration clause on a single line (isolation guard)')
  return line
}

async function capturedAuditPrompt() {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const a = calls.find(isAuditor)
  assert.ok(a, 'an auditor was dispatched (presence guard)')
  return a.prompt
}

test('stale-looking-but-correct calibration (Task 1.4): the "only when the live artifact confirms" qualifier survives per rule on BOTH surfaces', async () => {
  // Per rule, not aggregate-count (#693): each of the four rule windows must carry the confirmation
  // qualifier on BOTH surfaces. A silent widening that drops the qualifier from ONE rule (unconditional
  // amnesty) turns that rule's window qualifier-missing — the retired aggregate occurrence count could
  // not see it: five real occurrences minus one silent drop still cleared the four-rule floor. The
  // intro-line qualifier sits before anchor 1 on the standing card, so it is outside every window and
  // never pads a rule; the dispatched skeleton's intro carries no qualifier occurrence at all.
  const standing = qualifierPerRuleWindows(auditorMd)
  standing.forEach((r, i) => assert.equal(r.status, 'ok',
    `war-auditor.md rule ${i + 1} window ${r.anchor} carries the confirmation qualifier (standing surface)`))
  const dispatched = qualifierPerRuleWindows(calibrationLine(await capturedAuditPrompt()))
  dispatched.forEach((r, i) => assert.equal(r.status, 'ok',
    `auditPrompt rule ${i + 1} window ${r.anchor} carries the confirmation qualifier (dispatched surface)`))
})

test('stale-looking-but-correct calibration (Task 1.4): the per-rule qualifier lock discriminates each rule on BOTH surfaces (delete-the-feature)', async () => {
  // Permanent companion mutation test (Case 10e idiom, spec §4.A.3). For each rule position and each
  // surface, splice out every qualifier occurrence STRICTLY INSIDE that rule's [start,end) window and
  // assert the helper reports EXACTLY that rule qualifier-missing and the other three still ok. The
  // complement (other-three-stay-ok) is load-bearing (weak-test-assertion-passes-without-feature-being-
  // exercised): it proves the helper is not an all-missing stub, that window 4 cannot borrow a qualifier
  // from trailing text, and that the standing card's intro-line qualifier (pre-anchor-1, outside every
  // window; the dispatched skeleton carries none) can never rescue a rule. Initial-round capture only —
  // a deliberate scope cut matching the sibling anchor test;
  // the rebuttal-round base prompt is already covered by the CALIBRATION_SHARED rebuttal test.
  const QUALIFIER_ALL = /only when the live artifact confirms/gi
  const surfaces = [
    ['war-auditor.md (standing)', auditorMd],
    ['auditPrompt (dispatched)', calibrationLine(await capturedAuditPrompt())],
  ]
  for (const [label, text] of surfaces) {
    const base = qualifierPerRuleWindows(text)
    base.forEach((r, i) => assert.equal(r.status, 'ok', `${label}: rule ${i + 1} ok before mutation (precondition)`))
    for (let target = 0; target < base.length; target++) {
      const { start, end } = base[target]
      const mutated = text.slice(0, start) + text.slice(start, end).replace(QUALIFIER_ALL, '') + text.slice(end)
      const after = qualifierPerRuleWindows(mutated)
      assert.equal(after[target].status, 'qualifier-missing',
        `${label}: removing rule ${target + 1}'s window qualifier reports that rule qualifier-missing`)
      after.forEach((r, i) => { if (i !== target) assert.equal(r.status, 'ok',
        `${label}: rule ${i + 1} stays ok when only rule ${target + 1}'s qualifier is removed (complement — no cross-window borrow, intro never rescues)`) })
    }
  }
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
  // The trailing (plan wtprov-a) token satisfies the #1413 own-token provenance floor (Task 2.1(d)).
  const INTENT = 'Purpose: ship the wibble.\nEnd state: 1. wibble shipped. (plan wtprov-a)'
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

// Sweep-raised finding routing (End states 1+2, #1377): the re-audit panel's OWN Minor/Nit findings
// (raised against the polish diff itself) route through the disposition ladder at both terminal arms.
// Delete-the-feature trace (recorded per the plan's check): with the two routing loops removed from
// workflow-template.js's merged/discard arms, sweepMinors is never consumed — the absorb finding never
// reaches demote(), so the 'Disposition demotion' log assert fails; minorsFiled never receives either
// sweep-raised finding, so the minorsFiled and handoff.followUps asserts fail; only the aced-is-queue-
// only invariant would stay green, and it cannot green the tests alone.
test('sweep-raised finding routing (End state 1, #1377): a MERGED sweep re-audit Minor/absorb demotes through the ladder (terminal-round reason) to minorsFiled + followUps; disposition:follow-up files WITHOUT demotion; aced carries only the queued findings', async () => {
  const sweepAbsorb = { severity: 'Minor', title: 'sweep-raised absorb', file: 'docs/y.md', rationale: 'introduced by the polish diff', disposition: 'absorb' }
  const sweepFollowUp = { severity: 'Minor', title: 'sweep-raised follow-up', file: 'docs/z.md', rationale: 'substantive work', disposition: 'follow-up' }
  const sweepNote = { severity: 'Nit', title: 'sweep-raised note', file: 'docs/w.md', rationale: 'informational', disposition: 'note' }
  const impl = buildSeqImpl(
    { 'audit:p3-polish:correctness': [approveWith('audit:p3-polish:correctness', [sweepAbsorb, sweepFollowUp, sweepNote])] },
    sweepBase([queuedAbsorb()]))
  const { out, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.equal(out.handoff.polish, 'merged', 'the sweep merged (presence guard — an approve verdict with Minor/Nit findings still re-approves)')
  // absorb → demote(…, 'follow-up', …): the ladder is the vehicle, the reason names the terminal round.
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('sweep-raised absorb') && l.includes('terminal fix round')),
    "the sweep-raised absorb takes the LOGGED demotion naming the sweep as the phase's terminal fix round (never dropped silently)")
  const filedAbsorb = (out.minorsFiled || []).find(m => m && m.title === 'sweep-raised absorb')
  assert.ok(filedAbsorb && filedAbsorb.task === 'p3-polish', 'the demoted absorb lands in minorsFiled, task-stamped with the polish pseudo-task id')
  // follow-up → filed directly, no demotion log line for it.
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'sweep-raised follow-up'), 'a disposition:follow-up sweep finding files to minorsFiled')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('sweep-raised follow-up')),
    'the follow-up finding routes WITHOUT a demotion (it is already at its durable disposition)')
  // note → notes.
  assert.ok((out.notes || []).some(n => n && n.title === 'sweep-raised note'), 'a disposition:note sweep finding routes to notes')
  // handoff observable: followUps derive from minorsFiled.
  assert.ok((out.handoff.followUps || []).some(fu => fu && /sweep-raised absorb/.test(fu.reason || '')), 'the handoff followUps observable carries the demoted absorb')
  assert.ok((out.handoff.followUps || []).some(fu => fu && /sweep-raised follow-up/.test(fu.reason || '')), 'the handoff followUps observable carries the filed follow-up')
  // Invariant: aced carries ONLY the queued findings absorbed at the polish sha — nothing sweep-raised.
  assert.equal((out.aced || []).length, 1, 'aced carries exactly the one queued finding')
  assert.equal(out.aced[0].finding.title, 'dangling link', 'aced is queue-only — the queued finding, absorbed at the polish sha')
  assert.ok(!(out.aced || []).some(a => a && a.finding && /^sweep-raised/.test(a.finding.title || '')), 'nothing sweep-raised rides aced')
  assert.ok(!(out.handoff.absorbed || []).some(a => (a.findings || []).some(t => /^sweep-raised/.test(t))), 'nothing sweep-raised rides the handoff absorbed observable')
})

test("sweep-raised finding routing — discard arm (End state 2, #1377): a rejected sweep routes its re-audit Minor/Nits through the same ladder with the unmerged-branch reason; the polish-rejected auditLog entry pins verdict + findings payload", async () => {
  const sweepAbsorb = { severity: 'Minor', title: 'sweep-raised absorb', file: 'docs/y.md', rationale: 'introduced by the polish diff', disposition: 'absorb' }
  const impl = buildSeqImpl(
    { 'audit:p3-polish:correctness': [{ seat: 'p', lens: 'correctness', verdict: 'request_changes', confidence: 'high', findings: [sweepAbsorb] }] },
    sweepBase([queuedAbsorb()]))
  const { out, calls, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.ok(!calls.some(c => (c.opts.label || '') === 'merge:p3-polish'), 'the rejected polish is never merged (presence guard)')
  assert.equal(out.handoff.polish, 'discarded', 'the sweep discards (presence guard)')
  assert.equal(out.landDecision, 'landed', 'the phase still lands on the pre-polish tip — routing is filing, never a new hold path')
  // The sweep-raised absorb demotes with the discard-arm reason (the polish branch never merged).
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('sweep-raised absorb') && l.includes('never merged')),
    'the discard-arm demotion is log()ged with the unmerged-branch reason')
  const filed = (out.minorsFiled || []).find(m => m && m.title === 'sweep-raised absorb')
  assert.ok(filed && filed.task === 'p3-polish', 'the sweep-raised absorb lands in minorsFiled, task-stamped with the polish pseudo-task id')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'dangling link'), 'the queued finding still demotes to follow-up (the queue arm is untouched)')
  assert.ok(!(out.aced || []).length, 'nothing is aced on the discard arm')
  // polish-rejected auditLog entry shape (P2 conversion-verified gap — zero pre-existing asserts at base):
  // the verdict literal plus the findings payload ride the entry, so Critical/Major (and any Minor/Nit)
  // sweep-raised findings keep their auditLog visibility on the terminal arm.
  const rejected = (out.auditLog || []).find(e => e && e.verdict === 'polish-rejected')
  assert.ok(rejected, "the 'polish-rejected' auditLog entry is recorded")
  assert.equal(rejected.task, 'p3-polish', 'the entry is keyed to the polish pseudo-task')
  assert.ok((rejected.findings || []).some(f => f && f.title === 'sweep-raised absorb'), "the entry carries the panel's findings payload")
  assert.equal(rejected.requested, 1, 'the entry records the requested seat count')
  assert.equal(rejected.returned, 1, 'the entry records the returned seat count')
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
  // The wtprov token satisfies the #1413 own-token provenance floor (Task 2.1(d)).
  const { calls } = await runPhase(SWEEP_ARGS({ intent: 'Purpose: wibble the wtprov.' }), sweepBase([queuedAbsorb()]))
  const pw = calls.find(c => (c.opts.label || '') === 'polish:phase-3')
  assert.ok(pw, 'sweep worker dispatched (presence guard)')
  assert.ok(pw.prompt.includes('Purpose: wibble the wtprov.'), 'the sweep prompt carries the intent')
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
  // Case 3 owns TWO owners (#1082). ONE ordered regex, CASE-BOUNDED: anchored on the literal `(3)`
  // case marker fused to its `LATER phase` owner, lazy spans, terminating on case (3)'s own
  // `NEVER a hold` — so the window is exactly case 3's text, never a whole-prompt `[\s\S]*` span that
  // would let the tokens co-occur across unrelated prompt regions. Never two independent presence
  // checks: dropping EITHER owner must break this single pin.
  assert.match(p, /\(3\) a condition owned by a LATER phase[^]*?deps-chained sibling task[^]*?out-of-scope[^]*?NEVER a hold/,
    'case 3: a later-phase OR not-yet-landed deps-chained-sibling condition → out-of-scope, never a hold')
  assert.match(p, /plan_ref[\s\S]*VERBATIM/, 'findings key on the condition text via plan_ref')
})

test('End-state ownership carve-out (#1082): the standing war-auditor.md card carries the same two-owner rule', () => {
  // Standing surface of the split-surface discipline (ADR 0025) — the dispatched twin is pinned in the
  // criterion-11 prompt test above. Same shape: ONE ordered regex bounded inside the bullet it polices,
  // anchored from the lead-in through the bullet's own terminal hold clause.
  assert.match(auditorMd,
    /\*\*End-state ownership mapping:\*\*[^]*?later phase[^]*?sibling task in this phase[^]*?out-of-scope[^]*?never a Critical\/Major hold/,
    'war-auditor.md execution-evidence checklist carries the two-owner End-state ownership mapping duty')
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
  // D8 (Task 3.2): silence is no longer 'met' — a condition with neither a finding nor an attestation
  // row from any seat lands 'unverified' (met now requires a positive attestation with evidence).
  assert.equal(b && b.status, 'unverified', 'a claimed condition no seat attests is unverified, never a silent met')
})

test('end-state out-of-scope case (criterion 11): a later-phase condition is marked out-of-scope, never a hold', async () => {
  const impl = esImpl([{ severity: 'Nit', title: 'out-of-scope — owned by a later phase', plan_ref: ES_CONDS[1], rationale: 'phase 4 claims it' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'out-of-scope never holds')
  const b = out.handoff.endState.find(e => e.condition === ES_CONDS[1])
  assert.equal(b && b.status, 'out-of-scope')
})

test('end-state out-of-scope case (#1082): a condition owned by a not-yet-landed deps-chained SIBLING task is marked out-of-scope, never a hold', async () => {
  // The second owner the carve-out added. Same route as the later-phase case above (added BESIDE it,
  // never over it): the `out-of-scope` title token keys the handoff derivation — ZERO routing changes.
  const impl = esImpl([{ severity: 'Nit', title: 'out-of-scope — owned by deps-chained sibling task', plan_ref: ES_CONDS[1], rationale: 'task 1.2 (deps:[1.1]) owns it; not landed at this audit_sha' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'a sibling-owned condition never holds the land')
  const b = out.handoff.endState.find(e => e.condition === ES_CONDS[1])
  assert.equal(b && b.status, 'out-of-scope')
})

test('end-state derivation arm order (#1082): a Critical finding merely MENTIONING out-of-scope still derives unmet and holds', async () => {
  // NEGATIVE pin on the handoff derivation: the `severity === Critical || Major` arm is evaluated BEFORE
  // the `/out-of-scope/i` title-or-rationale arm, so a hold-severity finding can never launder itself into
  // 'out-of-scope' by naming the token. Delete the severity arm and this case goes RED.
  const impl = esImpl([{ severity: 'Critical', title: 'condition provably unmet at tip', plan_ref: ES_CONDS[0], rationale: 'considered whether this is out-of-scope for a sibling task — it is not; grep found nothing' }])
  const { out } = await runPhase(ES_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation', 'severity wins — the land is held')
  const a = out.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a && a.status, 'unmet', 'a Critical finding derives unmet even when its rationale mentions out-of-scope')
})

test('endStateBlock guarded plan.file (#1082): a plan-less phase that CLAIMS End-state conditions still dispatches (never held:workflow-error)', async () => {
  // `endStateBlock` is built at TOP-LEVEL scope (outside the work thunk) whenever endStateClaims is
  // non-empty, `plan` is entry-validated only on a TASKS-BEARING launch (#1430 — this zero-task
  // shape stays a ratified legal launch), and `pt` throws on an
  // undefined interpolated value BY CONTRACT — so a bare ${plan.file} in case (3) would throw phase-wide
  // into held:workflow-error on this reachable state. The sibling `gate composition point (ADR 0036) —
  // plan-less / zero-task phase` test carries NO endState key, so it cannot see this route: the
  // `${(plan && plan.file) ?? '<unset>'}` guard's SOLE coverage is here (the rendered-prompt pins above
  // cannot see the source literal either).
  const args = {
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/x/phase-3', workingBranch: 'dev/x', endState: ES_CONDS },
    planSlug: 'x', runId: 'run-x', worktreeRoot: '/abs/repo/.claude/worktrees',
    tasks: [],   // zero tasks — the End-state-only seat route
    // NB: NO `plan` key — an ABSENT plan object, with claims that force endStateBlock to render.
  }
  const { out, calls } = await runPhase(args, gateAuditImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error',
    'the guarded interpolation renders a placeholder instead of throwing — a bare ${plan.file} would regress this to held:workflow-error, phase-wide')
  const seats = calls.filter(c => (c.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.equal(seats.length, 1, 'the End-state-only seat still dispatches')
  assert.match(seats[0].prompt, /read the plan at <unset> in the checked-out tree/,
    'the absent plan path renders the explicit <unset> placeholder')
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
  // near-misses only, not everything. Post-D8 the unbound condition lands 'unverified' (no attestation
  // row in this fixture), proving non-binding without the retired silent-'met' terminal.
  const impl2 = esImpl([{ severity: 'Critical', title: 'unrelated finding', plan_ref: 'condition Z: something else entirely', rationale: 'nope' }])
  const { out: out2 } = await runPhase(ES_ARGS(), impl2)
  assert.ok(out2.handoff, 'handoff emitted (presence guard)')
  const a2 = out2.handoff.endState.find(e => e.condition === ES_CONDS[0])
  assert.equal(a2 && a2.status, 'unverified', 'a genuinely non-matching plan_ref does not bind — the condition derives from its own (absent) evidence, not the stray finding')
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

// ===========================================================================
// LAND-BARRIER ENDSTATE-CHECK & ARTIFACT-FIRST GATE-AUDIT (precision-chain Task 3.2 — D2/F5, D7, D8, A1)
// ---------------------------------------------------------------------------
// The widened phase.endState rows ({ condition, tag, check } — schemas.md; bare strings normalize to
// the judgment path, End state 9). check:-tagged rows are EXECUTED once per phase by the refiner's
// endstate-check dispatch at the integrated tip — after the serial merge queue's last merge, before any
// gate-audit seat spawns, UNCONDITIONALLY (the mergedTasksForGateAudit-empty arm included) — teeing one
// tip-SHA-stamped artifact per condition to _refinery/.war/endstate-<phaseId>-<n>.log. The gate-audit
// pass goes artifact-first: seats grep MergeResult.mappedTests against the captured gate log, read the
// per-condition artifacts, cross-check the worker-claimed End-state ids (A1), and return one
// endStateAttestations row per claimed condition; the handoff maps a condition with no attestation row
// from any seat to 'unverified', never 'met'.
const ES_CHECK_CMD = 'node --test skills/war/assets/wibble.acceptance.test.mjs'
const ES_ROWS = [
  { condition: 'condition A: the wibble suite is green', tag: 'check:', check: ES_CHECK_CMD },
  { condition: 'condition B: the gate covers the wobble', tag: 'gate:', check: null },
  'condition C: judged observable holds',   // legacy bare string mixed in — normalizes to the judgment path
]
const ES_ROW_ARGS = (over = {}) => PROVISION_ARGS({
  phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ES_ROWS },
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  ...over,
})
const isEndstateCheck = (c) => c.opts.dispatchKind === 'endstate-check'
const REFINERY = '/abs/repo/.claude/worktrees/run-2026/_refinery'

test('endstate-check dispatch (End state 6, D2/F5): ONE refiner dispatch at the integrated tip — after the last merge, before any gate-audit seat — executes every claimed check: command, file-threaded, teeing tip-SHA-stamped per-condition artifacts', async () => {
  const { calls, logs } = await runPhase(ES_ROW_ARGS(), gateAuditImpl)
  const es = calls.filter(isEndstateCheck)
  assert.equal(es.length, 1, 'exactly ONE endstate-check dispatch per phase')
  const c = es[0]
  assert.equal(seatOf(c.opts), 'war-refiner', 'the dispatch is a refiner (ADR 0002 — auditors are read-only and never run commands)')
  assert.equal(c.opts.label, 'endstate-check:phase-3', 'the dispatch label is endstate-check:phase-<id>')
  const p = c.prompt
  assert.ok(p.includes(`${REFINERY}/.war/endstate-3-1.log`), 'the artifact path carries the endstate-<phaseId>-<n>.log naming under _refinery/.war/')
  assert.ok(p.includes(`${REFINERY}/.war/endstate-3-1.cmd`), 'the command is file-threaded to a .cmd sibling')
  assert.ok(p.includes(ES_CHECK_CMD), 'the claimed check: command rides the dispatch verbatim')
  assert.match(p, /FROM THE FILE/i, 'file-threaded — executed from the file, never interpolated into another script (A3/D11)')
  assert.match(p, /timeout/i, 'the dispatch names the timeout arm')
  assert.match(p, /tip_sha/, 'each artifact is stamped with the tip SHA it ran at')
  assert.match(p, /rev-parse HEAD/, 'the stamp is the integrated tip (rev-parse HEAD)')
  assert.match(p, /NEVER fails this dispatch/i, 'a red/hung check fails only its own artifact, never the dispatch')
  assert.ok(!p.includes('endstate-3-2'), 'only check:-tagged rows execute — gate:/judged conditions get no artifact row')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('endstate-check:')), 'the dispatch is log()ged (never silent)')
  // Ordering: after the serial merge queue, before the gate-audit seats.
  const esIdx = idx(calls, isEndstateCheck)
  const mergeIdx = idx(calls, x => seatOf(x.opts) === 'war-refiner' && x.opts.phase === 'Refine' && (x.opts.label || '').startsWith('merge:'))
  const gaIdx = idx(calls, x => (x.opts.label || '').startsWith('gate-audit:'))
  assert.ok(mergeIdx !== -1 && gaIdx !== -1, 'merge-task + gate-audit dispatches present (presence guard)')
  assert.ok(esIdx > mergeIdx, "the dispatch runs AFTER the serial merge queue's merge")
  assert.ok(esIdx < gaIdx, 'the dispatch runs BEFORE the gate-audit seats spawn')
})

// Reordered fixture (absorb polish): the sole check:-tagged row is NOT first. The writer
// (endStateCheckRows: map-then-filter) and the reader (endStateBlock's row builder) derive the
// artifact number <n> from two INDEPENDENT expressions over the same full endStateRows list — here
// both must yield n=2. A renumbering refactor of either side (e.g. filter-then-map, which yields
// n=1 for the sole check row) reds the assertion pair below.
const ES_ROWS_CHECK_SECOND = [ES_ROWS[1], ES_ROWS[0], ES_ROWS[2]]   // [gate, check, bare]

test('artifact-index binding: a check row NOT first derives the SAME full-list n=2 in the dispatch (writer) AND on seat enumeration row 2 (reader) — reds on any renumbering divergence between the two builders', async () => {
  const { calls } = await runPhase(ES_ROW_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a', endState: ES_ROWS_CHECK_SECOND },
  }), gateAuditImpl)
  const es = calls.find(isEndstateCheck)
  assert.ok(es, 'endstate-check dispatch present (presence guard)')
  const p = es.prompt
  assert.ok(p.includes(`${REFINERY}/.war/endstate-3-2.cmd`), 'writer: the dispatch derives n from the full-list 1-based index — the second-position check row tees endstate-3-2.cmd')
  assert.ok(p.includes(`${REFINERY}/.war/endstate-3-2.log`), 'writer: …and its endstate-3-2.log artifact')
  assert.ok(!p.includes('endstate-3-1'), 'writer: filter-then-map would renumber the sole check row to n=1 — the seat would then read a path the dispatch never tees')
  const seat = gateAuditCalls(calls)[0]
  assert.ok(seat, 'per-task gate-audit seat present (presence guard)')
  assert.ok(seat.prompt.includes(`  2. ${ES_ROWS[0].condition} [check:] — executed artifact: ${REFINERY}/.war/endstate-3-2.log`),
    'reader: the SAME artifact path rides seat enumeration row 2 — the two independent derivations stay bound')
})

test('endstate-check dispatch is UNCONDITIONAL (D2): the mergedTasksForGateAudit-empty arm still executes its claimed checks, and the End-state-only seat consumes the artifacts', async () => {
  const args = ES_ROW_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] })
  const { calls } = await runPhase(args, gateAuditImpl)
  const esIdx = idx(calls, isEndstateCheck)
  assert.notEqual(esIdx, -1, 'a requiresTest:false-only phase STILL executes its claimed checks (the empty arm is not a skip)')
  const seat = calls.find(x => (x.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.ok(seat, 'the End-state-only seat spawns (presence guard)')
  assert.ok(esIdx < calls.indexOf(seat), 'the dispatch precedes the End-state-only seat')
  assert.ok(seat.prompt.includes(`${REFINERY}/.war/endstate-3-1.log`), 'the End-state-only seat consumes the per-condition artifact (the shared endStateBlock carries the path)')
})

test('endstate-check dispatch: NOT dispatched for bare-string (judgment-path) claims or a claims-less phase (End state 9 byte-compat)', async () => {
  const { calls } = await runPhase(ES_ARGS(), gateAuditImpl)   // ES_CONDS are bare strings
  assert.ok(!calls.some(isEndstateCheck), 'bare-string claims normalize to the judgment path — nothing to execute, no dispatch')
  const { calls: c2 } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  assert.ok(!c2.some(isEndstateCheck), 'a claims-less phase dispatches nothing')
})

// ===========================================================================
// QUOTING-AGNOSTIC .CMD TRANSPORT (endstate-artifact-fidelity Task 4.2 — A3, End state 6)
// ---------------------------------------------------------------------------
// The three mined shapes ride the dispatched prompt inside FENCED blocks the refiner copies
// byte-verbatim into the row's .cmd file — never re-quoted (the 'bad substitution' bug: a
// single-quoted ${...} plan literal re-emitted double-quoted dies in bash parameter expansion),
// never truncated at an inner backtick run (the fence length always exceeds the longest run inside
// the literal), and a multi-command check executes end-to-end with FULL stdout+stderr teed — plus
// the loud-failure contract: written .cmd bytes != the declared literal ⇒ a recorded
// cmd_bytes_mismatch contradiction on the artifact, never a silently "corrected" execution.
const ES_BT = '`'
// One check:-tagged row carrying the shape under test; the transport prompt is shape-driven, so each
// fixture threads its own literal through the same single-row phase.
const esTransportPrompt = async (check) => {
  const { calls } = await runPhase(ES_ROW_ARGS({
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
      endState: [{ condition: 'condition T: the transport shape survives', tag: 'check:', check }] },
  }), gateAuditImpl)
  const es = calls.find(isEndstateCheck)
  assert.ok(es, 'endstate-check dispatch present (presence guard)')
  return es.prompt
}
// The row builder's exact fenced rendering: fence line, literal bytes, fence line.
const esFenced = (fence, check) => `fenced below:\n${fence}\n${check}\n${fence}`

test('endstate-transport shape 1 (End state 6, A3): a single-quoted literal containing a ${...} run rides the fenced block byte-verbatim — copy-bytes contract, never re-quoted', async () => {
  // Double-quoted JS string: the ${plan.file} bytes below are LITERAL, exactly as a plan's check: row
  // carries them (the historical 'bad substitution' shape — see the endstate-check-cmd-artifact lesson).
  const check = "grep -F 'Plan file: ${plan.file}' docs/plans/wtprov-A.md"
  const p = await esTransportPrompt(check)
  assert.ok(p.includes(esFenced(ES_BT.repeat(3), check)), 'the literal rides the fenced block byte-verbatim — single quotes and the ${...} run intact, min-3 fence')
  assert.ok(p.includes('never re-quote'), 'the copy-bytes instruction forbids re-quoting (the bad-substitution bug)')
  assert.ok(p.includes('a single-quoted ${...} run is literal bytes and must survive exactly'), 'the ${...} survival clause is explicit — the refiner never substitutes')
})

test('endstate-transport shape 2 (End state 6, A3): an embedded-backtick literal is fenced LONGER than its longest inner run — no truncation at the inner backticks', async () => {
  // Inner run of THREE backticks (a fenced-code-span mention inside the literal) ⇒ the transport must
  // pick a 4-backtick fence; a content run can then never read as the fence and the tail after the
  // run survives (the .cmd-capture-truncates-at-embedded-backtick lesson).
  const check = `grep -F '${ES_BT.repeat(3)}mermaid' docs/specs/wtprov-A-design.md`
  const p = await esTransportPrompt(check)
  assert.ok(p.includes(esFenced(ES_BT.repeat(4), check)), 'the fence is FOUR backticks — exceeding the inner 3-run — and the literal (inner backticks + the bytes after them) rides untruncated')
  assert.ok(!p.includes(esFenced(ES_BT.repeat(3), check)), 'the inner run is never treated as the fence (a 3-fence around this literal would truncate at the content run)')
  assert.ok(p.includes('a backtick run INSIDE the content is NEVER the fence'), 'the prompt states the fence rule — only the exact fence line opens and closes the block')
})

test('endstate-transport shape 3 (End state 6, A3/D11): a two-command check rides whole — both halves in the fenced block, executed as one file end-to-end, FULL stdout+stderr teed', async () => {
  const twoCmd = "node --test skills/war/assets/wibble.acceptance.test.mjs && grep -c 'wobble' skills/war/assets/wibble.log"
  const p = await esTransportPrompt(twoCmd)
  assert.ok(p.includes(esFenced(ES_BT.repeat(3), twoCmd)), 'BOTH halves of the compound check ride the fenced block — the literal is never split or half-carried')
  assert.match(p, /execute the file AS A WHOLE, FROM THE FILE/i, 'the .cmd executes as one file — every command of a multi-command check runs')
  assert.match(p, /FULL stdout\+stderr of the ENTIRE command line/i, 'the artifact tees the full stdout+stderr of the whole command line')
  assert.match(p, /END-TO-END/, 'compound/pipeline checks are captured end-to-end')
  assert.match(p, /never a half-run/i, 'the half-run failure mode is named and forbidden')
})

test('endstate-transport loud-failure row (End state 6): declared literal != written .cmd bytes ⇒ the artifact records the cmd_bytes_mismatch contradiction — never a corrected execution, never silent', async () => {
  const p = await esTransportPrompt(ES_CHECK_CMD)
  assert.match(p, /VERIFY before executing/i, 'the refiner re-reads the written .cmd and compares byte-for-byte before executing')
  assert.ok(p.includes('cmd_bytes_mismatch: written .cmd bytes != declared check literal'), 'a mismatch is RECORDED on the artifact as the named contradiction line')
  assert.match(p, /do NOT execute any re-quoted\/corrected variant/i, 'a mismatched row is never repaired-and-run — the contradiction stands')
  assert.match(p, /fails LOUDLY via its artifact, never silently/i, 'the failure mode is loud by contract')
})

test('endstate-transport intake-lint: a whitespace-only check literal is INTAKE-LINTED UNSUPPORTED at dispatch — record-only row, log()ged, never a fenced execution row', async () => {
  // Runs the same single-check-row phase as esTransportPrompt, but inline: this fixture also needs
  // the workflow's log() lines (the lint must be LOUD at dispatch, never a silent row divergence).
  const linted = async (check) => {
    const { calls, logs } = await runPhase(ES_ROW_ARGS({
      phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
        endState: [{ condition: 'condition U: unsupported literal', tag: 'check:', check }] },
    }), gateAuditImpl)
    const es = calls.find(isEndstateCheck)
    assert.ok(es, 'endstate-check dispatch present (presence guard)')
    return { p: es.prompt, logs }
  }
  // The '(' suffix targets the ROW arm's verdict rendering — the shared boilerplate's own
  // 'A row marked INTAKE-LINTED UNSUPPORTED below…' sentence (paren-less) never matches it.
  const ws = await linted('   ')
  assert.ok(ws.p.includes('INTAKE-LINTED UNSUPPORTED (empty/whitespace-only check literal)'), 'a whitespace-only literal renders the record-only row arm, naming its lint verdict')
  assert.ok(ws.p.includes('exit_code: unsupported'), "the record-only row directs the artifact's terminal `exit_code: unsupported` line")
  assert.ok(!ws.p.includes('fenced below:'), 'NEGATIVE: the linted row never renders an executable fenced block — record-only, never a half-run')
  assert.ok(ws.logs.some(l => typeof l === 'string' && l.includes('endstate-check intake-lint:')), 'the lint is log()ged at dispatch — loud, never silent')
  const cb = await linted('echo hi\r')   // bare \r — a control byte other than newline/tab
  assert.ok(cb.p.includes('INTAKE-LINTED UNSUPPORTED (control bytes (other than newline/tab) in the check literal)'), 'a control-byte literal takes the SAME record-only arm')
  // Anti-vacuous pair: a clean literal must NOT take the lint arm — deleting the control-byte
  // regex (or inverting the trim() test) reds here, not just on the positive halves above.
  const clean = await esTransportPrompt(ES_CHECK_CMD)
  assert.ok(!clean.includes('INTAKE-LINTED UNSUPPORTED ('), 'anti-vacuous: a clean literal never takes the lint arm')
  assert.ok(clean.includes('fenced below:'), 'anti-vacuous: a clean literal rides a fenced execution row')
})

// Recovery Blocker 1 (Pivotal constraint: prompt-surface split — standing card + dispatched prompt,
// same task): the refiner card must LEARN the endstate-check dispatch flavor it is handed, the way
// the structurally identical evidence dispatch got its own card section. The dispatch is fail-open,
// so a refiner declining an unfamiliar dispatch (which has happened before — hence the provision
// section's never-out-of-mode line) means silent under-verification, never a loud failure. The
// mirrored duty prose is censused by the 'endstate-check dispatch card twin' both-surfaces registry
// row; this test pins the card-only structure: the section, the enumeration enrollments, the
// never-decline line, and the ENDSTATE_CHECK_RESULT return shape (on no standing surface before).
test('war-refiner.md documents the endstate-check dispatch (recovery Blocker 1): its own card section, Inputs + Return enrollment, the never-decline line, and the ENDSTATE_CHECK_RESULT shape', () => {
  assert.match(refinerMd, /## Land-barrier endstate-check dispatch/, 'the card carries its own endstate-check section (the evidence-dispatch pattern)')
  assert.match(refinerMd, /dispatchKind: endstate-check/, 'the section names the stable dispatchKind discriminator')
  assert.match(refinerMd, /## Land-barrier endstate-check dispatch[\s\S]{0,700}never out-of-mode: do not decline/i, "the section carries the never-decline defensive line (a fail-open dispatch declined is silent under-verification)")
  assert.match(refinerMd, /- `mode`[^\n]*endstate-check/, 'the ## Inputs mode enumeration names the endstate-check flavor (no longer affirmatively incomplete)')
  assert.match(refinerMd, /## Return[\s\S]*ENDSTATE_CHECK_RESULT/, 'the ## Return enumeration names ENDSTATE_CHECK_RESULT (it now appears on a standing surface)')
  assert.match(refinerMd, /\{ artifacts: \[\{ n, path, tip_sha, exit_code \}\] \}/, 'the card carries the exact ENDSTATE_CHECK_RESULT return shape')
})

test('endStateAttestations requirement lands in the shared endStateBlock (End state 7, D8): the per-task seat and the End-state-only seat carry the attestation contract; the shared const rides exactly the three gate-audit-family sites', async () => {
  const { calls } = await runPhase(ES_ROW_ARGS(), gateAuditImpl)
  const perTask = gateAuditCalls(calls)[0]
  assert.ok(perTask, 'per-task gate-audit seat dispatched (presence guard)')
  const esOnly = (await runPhase(ES_ROW_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 's', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] }), gateAuditImpl)).calls.find(x => (x.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.ok(esOnly, 'End-state-only seat dispatched (presence guard)')
  for (const [name, p] of [['per-task seat', perTask.prompt], ['end-state-only seat', esOnly.prompt]]) {
    assert.match(p, /endStateAttestations/, `${name}: names the positive channel`)
    assert.match(p, /one row per claimed condition/i, `${name}: one attestation row per claimed condition`)
    assert.match(p, /never a bare verdict/i, `${name}: status + evidence, never a bare verdict`)
    assert.match(p, /met \| unmet \| unverified/, `${name}: the attestation status set`)
    assert.match(p, /as ACTUALLY CAPTURED/i, `${name}: gate:-tagged conditions attest from the gate evidence as actually captured`)
    assert.ok(p.includes('.war/gate-phase-3.log'), `${name}: names the integrated-tip gate log among the captured gate evidence`)
    assert.ok(p.includes('[check:]'), `${name}: the check row is tag-annotated in the enumeration`)
    assert.ok(p.includes(`${REFINERY}/.war/endstate-3-1.log`), `${name}: the check row carries its executed artifact path`)
    assert.match(p, /lands 'unverified' in the handoff, never 'met'/, `${name}: states the no-attestation ⇒ unverified mapping`)
  }
  const sites = (src.match(/\+ endStateBlock \+ intentClause \+ adjudicationClause/g) || []).length
  assert.equal(sites, 3, 'the shared endStateBlock const rides exactly the three gate-audit-family seats (per-task (post-merge), integrated-tip, end-state-only) — the attestation requirement reaches all three from ONE const')
})

test('mappedTests grep (End state 7, D7): a merge returning mappedTests threads the paths + the mechanical grep-the-captured-log instruction into the per-task seat; absent ⇒ no block (fail-open)', async () => {
  const MAPPED = ['skills/war/assets/wibble.test.mjs', 'skills/war/assets/wobble.test.sh']
  const withMapped = (prompt, opts) => {
    if (seatOf(opts) === 'war-refiner' && opts.phase === 'Refine' && (opts.label || '').startsWith('merge:'))
      return { mode: 'merge-task', status: 'merged', gate_output: 'ok 5 tests passed', integration_sha: 'c0ffee1234', gate_log_path: '/abs/gate.log', mappedTests: MAPPED }
    return gateAuditImpl(prompt, opts)
  }
  const { calls } = await runPhase(PROVISION_ARGS(), withMapped)
  const ga = gateAuditCalls(calls)
  assert.ok(ga.length > 0, 'gate-audit seats dispatched (presence guard)')
  const p = ga[0].prompt
  assert.match(p, /MAPPED TESTS \(D7/, 'the mapped-tests block is threaded')
  for (const m of MAPPED) assert.ok(p.includes(m), `the mapped path ${m} rides the seat prompt`)
  assert.match(p, /Grep EACH mapped path against the CAPTURED gate log/i, 'the grep instruction makes the HARD trigger mechanical against the captured artifact')
  assert.match(p, /provably-unrun/i, 'the mechanical trigger names the HARD provably-unrun finding')
  // Round-3 fix-forward adjudication: the HARD trigger is ENUMERATION-CONDITIONAL — computable only
  // where the captured log names test file paths. An unconditional absent-from-log ⇒ HARD rule
  // false-holds every .mjs-mapped task (this repo's dominant case): the node half of the gate emits
  // titles + an aggregate summary only (premise pinned live by the reporter-format test below).
  assert.match(p, /ONLY when the captured log ENUMERATES test file paths/i, 'the HARD trigger is enumeration-conditional — a zero-hit grep is HARD only where the log names file paths')
  assert.match(p, /never per-file paths/i, 'the node-reporter titles-only fact is stated to the seat')
  assert.match(p, /SOFT cannot-confirm, never a hold/i, 'a zero-hit grep against a non-enumerating half degrades SOFT — the fail-safe direction, never a false land-hold')
  // Truncation clause (D4, #1343-3): an early-aborted bash half (the discovery loop's || exit 1 exits
  // on the first red suite) leaves an enumerating-LOOKING log that is truncated — a mapped path after
  // the abort point must degrade SOFT, never mint a false HARD land-hold.
  assert.match(p, /ABORTED/, 'the truncation clause names the early-aborted bash half')
  assert.match(p, /truncated/i, 'the truncation clause states the log is truncated, not non-enumerating')
  assert.match(p, /after the abort point/i, 'a mapped path after the abort point is SOFT cannot-confirm, never HARD')
  // Rescoped conjunctive clause (D3, #1372): a standing pin — a revert to the old unconditional
  // sentence (the contradiction #1372 exists to close) must red HERE, not only in this phase's
  // one-shot endstate-check greps. Single-surface by construction: the standing card carries no
  // conjunctive twin (plan Context 2), so this per-task-prompt presence assert is the whole guard.
  assert.match(p, /HARD gate-evidence finding for a MISSING mapped test/, 'the conjunctive clause is scoped to the MISSING-test case')
  assert.ok(p.includes('governed by the MAPPED TESTS block above'), 'and defers the present-but-unrun path to the MAPPED TESTS block by name')
  // Consumer-side banner coupling (D6, #1343-5): the per-file banner literal the seats grep for is
  // pinned against resolveGate's LIVE output (the producer) AND on both seat surfaces here — so the
  // seat-facing literal cannot drift from what the gate actually prints.
  const BANNER = '== gate(bash): '
  const live = resolveGate('node --test x')
  assert.ok(live.includes(BANNER), "resolveGate's live output carries the per-file banner literal (producer side)")
  assert.ok(live.includes('%s'), "resolveGate's live output interpolates the per-file path (%s) into the banner")
  assert.ok(p.includes(BANNER), 'the per-task seat prompt carries the matching banner literal')
  assert.ok(auditorMd.includes(BANNER), 'agents/war-auditor.md carries the matching banner literal (standing card)')
  // Fail-open: no mappedTests token on the MergeResult ⇒ no block (the SOFT cannot-confirm posture kept).
  // The absence probe keys on the BLOCK HEADER literal: the rescoped conjunctive clause (D3, #1372)
  // defers to the MAPPED TESTS block BY NAME in every per-task prompt, so a bare 'MAPPED TESTS'
  // substring probe would false-trip on the deferral parenthetical, not the threaded block.
  const { calls: c2 } = await runPhase(PROVISION_ARGS(), gateAuditImpl)
  assert.ok(!gateAuditCalls(c2)[0].prompt.includes('MAPPED TESTS (D7'), "no mappedTests ⇒ no threaded block — the SOFT cannot-confirm posture kept")
})

// Reporter-format premise pin (round-3 fix-forward adjudication): the enumeration-conditional above
// rests on a factual premise about this repo's own gate output — a piped `node --test` run reports
// test TITLES plus an aggregate summary and never enumerates test file paths (Lead-verified against a
// captured gate log: 0 path hits while the file's own tests were green in the same log). Pin the
// premise LIVE against the actual runner on the current Node, not by fixture prose: generate a real
// node-format log and grep it exactly the way a seat would. If this test ever reds because the piped
// reporter began enumerating paths, the premise changed — revisit the enumeration-conditional in
// mappedTestsLine/authMappedLine and war-auditor.md's checklist bullet (the HARD trigger could widen).
test('reporter-format premise (D7, round-3): a piped node --test run emits titles + aggregate summary WITHOUT the test file path — a zero-hit grep for a .mjs mapped path proves nothing about whether its suite ran', () => {
  const dir = mkdtempSync(join(tmpdir(), 'war-node-reporter-premise-'))
  const mjsMappedPath = join(dir, 'wibble.premise.test.mjs')
  try {
    writeFileSync(mjsMappedPath, "import { test } from 'node:test'\nimport assert from 'node:assert'\ntest('premise-pin sentinel title', () => { assert.equal(1, 1) })\n")
    // Strip the parent runner's NODE_TEST_CONTEXT: the gate invokes node --test TOP-LEVEL (piped), and
    // an inherited child-v8 context would silence the child's human-format stdout entirely — the probe
    // must reproduce the gate's own invocation shape, not this suite's runner-child shape.
    const env = { ...process.env }
    delete env.NODE_TEST_CONTEXT
    // D7 premise-probe hardening (#1343-4/6): bounded (timeout) and loud on env trouble — a spawn
    // failure or a wedged child (run.error: ENOENT, ETIMEDOUT kill, …) is its OWN named condition,
    // never allowed to impersonate a reporter-format premise change via a bare status assert.
    const run = spawnSync(process.execPath, ['--test', mjsMappedPath], { encoding: 'utf8', env, timeout: 60_000 })
    const log = (run.stdout || '') + (run.stderr || '')
    assert.ok(!run.error, `premise probe failed to spawn or wedged — a spawn/env failure, NOT a premise change: ${run.error}`)
    assert.equal(run.status, 0, `the premise fixture suite is green (presence guard — the run below provably executed); got status ${run.status}, stderr tail: ${(run.stderr || '').slice(-200)}`)
    assert.ok(log.includes('premise-pin sentinel title'), 'the piped reporter emits test TITLES — the suite provably ran and is visible in the log')
    assert.match(log, /tests 1\b/, '…plus the aggregate summary')
    assert.ok(!log.includes('wibble.premise.test.mjs'),
      'PREMISE: the piped node reporter does NOT enumerate test file paths — the .mjs mapped-path grep yields zero hits even though the suite provably ran, so absence-from-log is a non-enumerating-half SOFT cannot-confirm, never the HARD trigger')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('authMappedLine twin (D7, round-3): the integrated-tip AUTHORITATIVE seat threads the dep-crossing mapped-path union with the SAME enumeration-conditional HARD trigger as the per-task seat', async () => {
  // evidenceImpl's PROVISION_ARGS default is intra-dep (t2 deps t1, same repo) and returns
  // integratedTipGate — wrap its merges to carry mappedTests so authMappedLine renders live.
  const withMapped = (prompt, opts) => {
    const r = evidenceImpl(prompt, opts)
    if (r && r.mode === 'merge-task' && r.status === 'merged') r.mappedTests = ['skills/war/assets/wibble.test.mjs']
    return r
  }
  const { calls } = await runPhase(PROVISION_ARGS(), withMapped)
  const auth = calls.find(c => isAuditor(c) && /:integrated-tip$/.test(c.opts.label || ''))
  assert.ok(auth, 'authoritative integrated-tip seat dispatched (presence guard)')
  const p = auth.prompt
  assert.match(p, /MAPPED TESTS \(D7/, 'the mapped-tests union block is threaded')
  assert.ok(p.includes('skills/war/assets/wibble.test.mjs'), "the dep-crossing tasks' mapped path rides the seat prompt")
  assert.match(p, /CAPTURED integrated-tip gate log/i, 'the grep target is the integrated-tip captured artifact')
  assert.match(p, /ONLY when the captured log ENUMERATES test file paths/i, 'the twin carries the enumeration-conditional — a per-task-only fix would false-hold through this seat instead')
  assert.match(p, /SOFT cannot-confirm, never a hold/i, 'the twin degrades SOFT on a non-enumerating half')
  // Truncation clause (D4, #1343-3) — the twin carries it too: a per-task-only clause would let a
  // truncated (early-aborted) integrated-tip log mint the false HARD through this seat instead.
  assert.match(p, /ABORTED/, 'the twin names the early-aborted bash half')
  assert.match(p, /truncated/i, 'the twin states the truncated-log condition')
  assert.match(p, /after the abort point/i, 'the twin degrades a post-abort mapped path SOFT, never HARD')
})

test('A1 cross-check (Task 3.2): the worker-claimed End-state ids (acceptance_criteria_covered) reach the per-task gate-audit seat; empty/absent ⇒ no block', async () => {
  const withIds = (prompt, opts) => seatOf(opts) === 'war-worker'
    ? { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: {}, acceptance_criteria_covered: ['6', '7'] }
    : gateAuditImpl(prompt, opts)
  const { calls } = await runPhase(ES_ROW_ARGS(), withIds)
  const p = gateAuditCalls(calls)[0].prompt
  assert.match(p, /WORKER-CLAIMED END-STATE IDS \(A1\)/, 'the claimed-ids block is threaded')
  assert.ok(p.includes('acceptance_criteria_covered = [6, 7]'), 'the claimed ids ride the prompt verbatim')
  assert.match(p, /cross-check/i, 'the seat cross-checks the claims against its attestation rows')
  const { calls: c2 } = await runPhase(ES_ROW_ARGS(), gateAuditImpl)
  assert.ok(!gateAuditCalls(c2)[0].prompt.includes('WORKER-CLAIMED'), 'no claimed ids ⇒ no block (fail-open)')
})

test("handoff unverified mapping (End state 7, D8): attested met/unmet drive the handoff; a condition NO seat attests lands 'unverified', never 'met'; a pin-mismatched seat's rows are excluded", async () => {
  const att = (rows, audit_sha) => (prompt, opts) => {
    if (seatOf(opts) === 'war-refiner' && opts.phase === 'Refine' && (opts.label || '').startsWith('merge:'))
      return { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'c0ffee1234' }
    if ((opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', confidence: 'high', findings: [],
        endStateAttestations: rows, ...(audit_sha ? { audit_sha } : {}) }
    return gateAuditImpl(prompt, opts)
  }
  const rows = [
    { condition: ES_ROWS[0].condition, status: 'met', evidence: 'artifact endstate-3-1.log: tip-stamped, suite green' },
    { condition: ES_ROWS[1].condition, status: 'unmet', evidence: 'captured gate log lacks the wobble suite' },
    // condition C: NO attestation row from any seat.
  ]
  const { out } = await runPhase(ES_ROW_ARGS(), att(rows))
  assert.equal(out.landDecision, 'landed', 'attestations report — only findings hold the land (two-contract rule)')
  const st = Object.fromEntries(out.handoff.endState.map(e => [e.condition, e.status]))
  assert.equal(st[ES_ROWS[0].condition], 'met', 'an attested-met condition (evidence cited) lands met')
  assert.equal(st[ES_ROWS[1].condition], 'unmet', 'an attested-unmet condition lands unmet')
  assert.equal(st['condition C: judged observable holds'], 'unverified', "no attestation row from any seat ⇒ 'unverified' — never a silent 'met'")
  // Pin-mismatch exclusion: the seat judged a DIFFERENT tree — its met row must not land met.
  const { out: out2 } = await runPhase(ES_ROW_ARGS(), att([
    { condition: ES_ROWS[0].condition, status: 'met', evidence: 'judged the wrong tree' },
  ], 'beefbeef1234'))
  const a2 = out2.handoff.endState.find(e => e.condition === ES_ROWS[0].condition)
  assert.equal(a2 && a2.status, 'unverified', "a pin-mismatched seat's met attestation is excluded — the condition falls to 'unverified'")
})

test("handoff endState assembly (Task 3.2): the derivation + assembly comment carry the five-status set, and the ternary chain's terminal arm is 'unverified', never 'met'", () => {
  const s = src.indexOf('// endState (D8, Task 3.2')
  const e = src.indexOf('backstops:', s)
  assert.ok(s !== -1 && e > s, 'the endState assembly block is locatable')
  const block = src.slice(s, e)
  assert.match(block, /met \| unmet \| unverified \| deferred \| out-of-scope/, 'the assembly comment names the FIVE-status set')
  for (const lit of ["'met'", "'unmet'", "'unverified'", "'deferred'", "'out-of-scope'"])
    assert.ok(block.includes(lit), `the derivation carries ${lit}`)
  assert.match(block, /: att\.some\(a => a\.status === 'met'\) \? 'met'\s*\n\s*: 'unverified'/,
    "the terminal arm is 'unverified' — silence can never derive 'met'")
})

// Task 3.2's doc-claim row (Task 1.2's OLD-absent owner — the war-config.test.mjs schemas-guard
// pattern): schemas.md's handoff endState row was rewritten in place to the five-status set; the old
// four-status-only enumeration (unmet directly followed by deferred — no unverified) stays retired.
const OLD_FOUR_STATUS_ENUM = /"met"\s*\|\s*"unmet"\s*\|\s*"deferred"\s*\|\s*"out-of-scope"/i
test('doc-claim (Task 3.2): ../references/schemas.md carries the five-status endState enumeration; the old four-status-only enumeration is absent, case-insensitively', () => {
  const schemasMd = readFileSync(join(here, '../references/schemas.md'), 'utf8')
  assert.match(schemasMd, /"met"\s*\|\s*"unmet"\s*\|\s*"unverified"\s*\|\s*"deferred"\s*\|\s*"out-of-scope"/i,
    'the five-status enumeration (with unverified) is present')
  assert.doesNotMatch(schemasMd, OLD_FOUR_STATUS_ENUM,
    'the retired four-status-only enumeration is absent from schemas.md')
  // Unwired negative reference (both-ways proof): the pre-change bytes DO match the guard. FIXTURE —
  // never re-introduced into a live surface.
  assert.match('endState: [ { condition, status: "met" | "unmet" | "deferred" | "out-of-scope" } ]', OLD_FOUR_STATUS_ENUM,
    'negative reference: the retired enumeration matches the guard (the doesNotMatch above is non-vacuous)')
})

// design.md (Task 3.2): the intent-threading + handoff bullet is artifact-first now; the old
// judgment-path description (the arrow-chain parenthetical) and the "Design notes: docs/specs/…"
// citation (spec-posterity rule, F7 / ADR 0046) are retired. Legacy docs/specs files keep the old
// wording as sanctioned posterity survivors — this guard scans the LIVE design.md only.
const RETIRED_JUDGMENT_PATH = /provably unmet\s*→\s*HARD;\s*unverifiable\s*→\s*SOFT/i
test('design.md (Task 3.2): the handoff bullet names the land-barrier dispatch, endStateAttestations, and the unverified mapping; the old judgment-path description and the docs/specs citation are retired', () => {
  const designMd = readFileSync(join(here, '../references/design.md'), 'utf8')
  assert.match(designMd, /artifact-first/i, 'the bullet describes artifact-first verification')
  assert.match(designMd, /land-barrier endstate-check dispatch/i, 'the bullet names the land-barrier endstate-check dispatch')
  assert.match(designMd, /endStateAttestations/, 'the bullet names the positive attestation channel')
  assert.match(designMd, /endstate-<phaseId>-<n>\.log/, 'the bullet carries the per-condition artifact naming')
  assert.match(designMd, /`unverified`, never `met`/, 'the bullet states the no-attestation ⇒ unverified mapping')
  assert.doesNotMatch(designMd, RETIRED_JUDGMENT_PATH, 'the old judgment-path description is retired, case-insensitively')
  // Unwired negative reference (both-ways proof): the pre-change bytes DO match the guard. FIXTURE.
  assert.match('(provably unmet → HARD; unverifiable → SOFT; a condition owned by a later phase', RETIRED_JUDGMENT_PATH,
    'negative reference: the retired description matches the guard (the doesNotMatch above is non-vacuous)')
  assert.ok(!/docs\/specs\//i.test(designMd), 'no docs/specs citation survives in design.md (spec-posterity rule, F7 / ADR 0046 — Task 5.4 owns the corpus-wide guard)')
})

// --- Handoff block (criterion 6) ---

// Shared criterion-6 fixture impl: one landed task with a follow-up-routed Minor + a note Nit.
// filingResult drives the file-followups mock (keyed on the STABLE dispatchKind discriminator,
// never the label prefix — spec criterion 8): a { filed } shape stamps; null simulates a DEAD
// filing dispatch; the phase-'Land' fallback below answers it with a non-conforming MergeResult
// when no filingResult branch is given (the D18 fail-open path generic fixtures ride).
const handoffMinorF = { severity: 'Minor', title: 'needs new tests', rationale: 'thin wiring', file: 'x.js' }
const handoffImpl = (filingResult) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return filingResult
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve',
    findings: (opts.label || '').startsWith('gate-audit:') ? [] : [handoffMinorF, { severity: 'Nit', title: 'honest comment', rationale: 'covers invariant', file: 'y.js' }], confidence: 'high' }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', working_sha: 'abc1234def' }
    : { mode: 'merge-task', status: 'merged', integration_sha: 'beefcafe12' }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const HANDOFF_ARGS = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }] })

// FLIPPED null-pin (End state 1, #1331): the Workflow now files follow-ups itself and stamps the
// returned issue numbers — the old "issue is null until the Lead files it" framing is retired.
// Delete-the-feature trace (recorded per the plan's check): with the stamping loop removed from
// workflow-template.js's FILE-FOLLOWUPS DISPATCH block (the `minorsFiled[row.n - 1].issue = row.issue`
// assignment), the filing mock's { filed: [{ n: 1, issue: 1234 }] } return is never applied, the
// handoff mapping's `issue: m.issue ?? null` renders null, and the deepEqual below fails with
// `issue: null !== 1234` — the flipped assertion cannot pass without the stamping.
test('handoff block (criterion 6): a landed phase emits { tipSha, polish, absorbed, followUps, notes, endState, intentPresent }', async () => {
  const { out } = await runPhase(HANDOFF_ARGS(), handoffImpl({ filed: [{ n: 1, issue: 1234 }] }))
  assert.equal(out.landDecision, 'landed')
  const h = out.handoff
  assert.ok(h, 'handoff present on landed')
  assert.equal(h.tipSha, 'abc1234def', 'tipSha is the landed working sha')
  assert.equal(h.polish, 'skipped', 'no queue → polish skipped')
  assert.deepEqual(h.absorbed, [], 'nothing absorbed')
  assert.deepEqual(h.followUps, [{ issue: 1234, reason: 'needs new tests — thin wiring' }],
    'followUps carry { issue, reason } — the file-followups dispatch stamped the filed issue number (D2)')
  assert.deepEqual(h.notes, [{ task: 't1', title: 'honest comment' }], 'notes carry { task, title }')
  assert.deepEqual(h.endState, [], 'no claims → empty endState')
  assert.equal(h.intentPresent, false, 'intentPresent false without args.intent')
  assert.ok(Array.isArray(out.notes) && out.notes.length === 1, 'the notes array also rides the return top-level')
})

test('file-followups fail-open (End state 2): a DEAD filing dispatch leaves every followUps issue null, landDecision unchanged, ONE log line — never a hold', async () => {
  const { out, logs } = await runPhase(HANDOFF_ARGS(), handoffImpl(null))
  assert.equal(out.landDecision, 'landed', 'landDecision untouched by the dead filing dispatch')
  assert.deepEqual(out.handoff.followUps, [{ issue: null, reason: 'needs new tests — thin wiring' }],
    'every unmatched followUps entry stays issue: null (fail-open — the Checkpoint floor is the catch)')
  assert.equal(logs.filter(l => typeof l === 'string' && l.startsWith('file-followups:')).length, 1,
    'exactly ONE fail-open log line for the dead/non-conforming filing dispatch')
})

test('file-followups no-dispatch (End state 3): an empty minorsFiled dispatches no filing step', async () => {
  const { calls, out } = await runPhase(PROVISION_ARGS(), defaultImpl)   // zero findings → minorsFiled empty
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed')
  assert.ok(!calls.some(c => c.opts.dispatchKind === 'file-followups' || /^file-followups:/.test(c.opts.label || '')),
    'no file-followups-labelled call when minorsFiled is empty')
})

test('file-followups on held:escalation (End state 3 companion): the dispatch fires on the degraded handoff path and stamps there too', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return { filed: [{ n: 1, issue: 4321 }] }
    if (seat === 'war-auditor' && (opts.label || '').startsWith('audit:t2'))
      return { seat: opts.label, lens: 'correctness', verdict: 'escalate', escalate_reason: 'plan ambiguity', findings: [], confidence: 'high' }
    return handoffImpl(undefined)(prompt, opts)
  }
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'T1', planSlice: 's', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'T2', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out, calls } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'held:escalation', 'presence guard: the degraded handoff-emitting path')
  assert.ok(calls.some(c => c.opts.dispatchKind === 'file-followups'), 'the filing dispatch fires on held:escalation too')
  assert.equal(out.handoff.followUps[0].issue, 4321, 'the stamped issue number rides the degraded handoff as well')
  // Prompt-content pins (the relaunch defect's regression guard): the emitted preflight line
  // interpolates the gh-preflight path BARE — POSIX single quotes around it would suppress
  // $CLAUDE_PLUGIN_ROOT expansion in the refiner's shell and 127 the ADR-0026 account guard
  // before the gh-write batch (the round-1 audit Major this suite previously never read).
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.ok(fp.includes('${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh "'),
    'the preflight line emits the plugin-root path BARE, directly followed by the double-quoted ghUser arg')
  assert.doesNotMatch(fp, /'\$\{CLAUDE_PLUGIN_ROOT\}[^']*gh-preflight\.sh'/,
    'no POSIX-single-quoted preflight path survives — re-adding the quotes suppresses expansion (delete-the-feature proof)')
  assert.match(fp, /war-followup/, 'the filing prompt names the war-followup label')
  assert.match(fp, /gh issue list --label war-followup --state open/,
    'the dedup-first instruction (D3) rides the prompt verbatim')
})

test('file-followups ordinal mismatch: out-of-range / non-integer n and non-numeric issue rows are ignored; in-range rows still stamp', async () => {
  const secondF = { severity: 'Minor', title: 'stale count', rationale: 'lagging comment', file: 'z.js' }
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups')
      return { filed: [{ n: 99, issue: 777 }, { n: 0, issue: 666 }, { n: 1.5, issue: 555 }, { n: 1, issue: 'not-a-number' }, { n: 2, issue: 888 }] }
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [handoffMinorF, secondF], confidence: 'high' }
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  assert.equal(out.handoff.followUps.length, 2, 'both follow-up findings ride the handoff')
  assert.equal(out.handoff.followUps[0].issue, null, 'the entry matched only by ignored rows (out-of-range/non-integer n, non-numeric issue) stays null')
  assert.equal(out.handoff.followUps[1].issue, 888, 'the in-range row still stamps — partial conformance is honored row-by-row')
})

// --- Follow-up consolidation + clusters manifest (Task 2.1, #1566) ---

test('follow-up consolidation (line-window hit): cross-seat same-file findings within the line window collapse to ONE row carrying seats[]; the filing rows render file, line, and seats; the prompt mandates corroboration comments and clustering', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:')) {
      const f = (opts.label || '').endsWith(':correctness')
        ? { severity: 'Minor', title: 'stale enum comment', rationale: 'lags the new arm', file: 'src/a.js', line: 100 }
        : { severity: 'Minor', title: 'comment misses the arm', rationale: 'same stale block', file: 'src/a.js', line: 105 }
      return { seat: opts.label, lens: 'x', verdict: 'approve', findings: [f], confidence: 'high' }
    }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return { filed: [{ n: 1, issue: 42 }], clusters: [{ ordinals: [1], issue: 42 }] }
    return handoffImpl(undefined)(prompt, opts)
  }
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }, { lens: 'cascading-impact' }] }] })
  const { out, calls, logs } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed')
  assert.equal(out.minorsFiled.length, 1, 'the two seats\' line-window duplicates (100 vs 105, same file) collapse to one row')
  assert.deepEqual(out.minorsFiled[0].seats, ['audit:t1:correctness (task t1)', 'audit:t1:cascading-impact (task t1)'],
    'the merged row carries a seats[] corroboration list naming both raising seats (seatRef renders seat+task, D8)')
  assert.equal(out.minorsFiled[0].issue, 42, 'ordinal→issue stamping keys on the POST-collapse row')
  assert.equal(out.handoff.followUps.length, 1, 'the handoff renders the collapsed row set (one followUps entry)')
  assert.ok(logs.some(l => typeof l === 'string' && l.startsWith('file-followups consolidation:')),
    'the collapse is log()ged (visibility, never a hold)')
  // Prompt-content pins: rows carry file/line + seats (file-clustering is impossible without them),
  // and the dedup arm routes open-issue matches as corroboration comments, never new issues.
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /file src\/a\.js:100/, 'the candidate row renders the finding\'s file and line')
  assert.match(fp, /seats: audit:t1:correctness \(task t1\), audit:t1:cascading-impact \(task t1\)/, 'the candidate row renders the seats[] corroboration list (seat+task, D8)')
  assert.match(fp, /corroboration comment on the existing issue, never a new issue/,
    'an open war-followup match gets a corroboration comment, never a new issue (the retired-token sweep dedup idiom)')
  assert.match(fp, /cluster the remaining candidate rows by file \+ root cause/, 'the prompt mandates file + root-cause clustering')
  assert.match(fp, /ONE `war-followup`-labelled issue per cluster/, 'one issue per cluster')
  assert.match(fp, /clusters: \[\{ ordinals, issue \}\]/, 'the return shape names the clusters[] manifest')
})

test('follow-up consolidation (title fallback + no-collapse controls): lineless normalized-title twins collapse; a lined row never merges into a lineless one; different files and out-of-window lines never collapse', async () => {
  // EVERY control row carries its OWN distinct seat: the collapse predicate short-circuits on the
  // D8 cross-seat term FIRST, so same-seat controls would be blocked by the seat check alone and
  // the file/line-window/title key would have ZERO delete-and-trace coverage (a vacuous pass —
  // deleting the `c.file === f.file && (...)` term from the predicate would leave this test green).
  // With distinct seats throughout, file/line/title is the SOLE discriminator for rows 3-6: delete
  // that term and all six rows collapse into one, and the length-5 assertion below goes red.
  const findings = [
    { severity: 'Minor', title: 'Stale count.', rationale: 'r1', file: 'z.js' },              // 1 — representative
    { severity: 'Minor', title: 'stale count', rationale: 'r2', file: 'z.js', seat: 'audit:t1:second-lens' },   // collapses into 1 (both lineless, normalized-equal titles, CROSS-seat — same-seat rows never collapse, D8)
    { severity: 'Minor', title: 'stale count', rationale: 'r3', file: 'z.js', line: 5, seat: 'audit:t1:third-lens' },      // control: lined vs lineless — NO collapse
    { severity: 'Minor', title: 'Stale count.', rationale: 'r4', file: 'other.js', seat: 'audit:t1:fourth-lens' },         // control: different file — NO collapse
    { severity: 'Minor', title: 'win a', rationale: 'r5', file: 'w.js', line: 1, seat: 'audit:t1:fifth-lens' },            // control pair: same file but
    { severity: 'Minor', title: 'win b', rationale: 'r6', file: 'w.js', line: 50, seat: 'audit:t1:sixth-lens' },           // lines beyond the ±10 window — NO collapse
  ]
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  assert.equal(out.minorsFiled.length, 5, 'six rows collapse to five: only the lineless normalized-title twins merge')
  const merged = out.minorsFiled.find(m => m.title === 'Stale count.' && m.file === 'z.js')
  assert.ok(merged && Array.isArray(merged.seats), 'the merged row carries seats[] (cross-seat corroboration, D8)')
  assert.ok(out.minorsFiled.some(m => m.title === 'stale count' && m.line === 5), 'the lined z.js row survives un-merged (title fallback fires ONLY when line is absent)')
  assert.ok(out.minorsFiled.some(m => m.file === 'other.js'), 'the different-file twin survives')
  assert.ok(['win a', 'win b'].every(t => out.minorsFiled.some(m => m.title === t)), 'out-of-window same-file rows survive')
})

test('follow-up consolidation (non-array seats guard): an auditor-supplied string `seats` key on a collapse-target row never throws — the guard normalizes it to seats[]; landDecision stays landed', async () => {
  const findings = [
    { severity: 'Minor', title: 'stale enum comment', rationale: 'r1', file: 'src/a.js', line: 100, seats: 'correctness' },
    { severity: 'Minor', title: 'comment misses the arm', rationale: 'r2', file: 'src/a.js', line: 105, seat: 'audit:t1:second-lens' },  // cross-seat (same-seat rows never collapse, D8)
  ]
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'the collapse never converts a LANDED phase into held:workflow-error (the string-seats row would throw on .push without the Array.isArray guard)')
  assert.equal(out.minorsFiled.length, 1, 'the line-window duplicates still collapse to one row')
  assert.ok(Array.isArray(out.minorsFiled[0].seats), 'the representative row\'s non-array seats key is normalized to a seats[] array')
})

test('follow-up consolidation (malformed merged elements guard): auditor-supplied `merged: [null, ...]` elements never throw at the consolidation log line or the handoff followUps projection — landDecision stays landed, elements are filtered/defaulted', async () => {
  const findings = [
    // Collapse-target representative carrying auditor junk in merged[]: null and a bare string are
    // dropped; the field-less object gets absence-tolerant defaults in the handoff projection.
    { severity: 'Minor', title: 'stale enum comment', rationale: 'r1', file: 'src/a.js', line: 100, merged: [null, 'junk', { title: 'pre-existing' }] },
    { severity: 'Minor', title: 'comment misses the arm', rationale: 'r2', file: 'src/a.js', line: 105, seat: 'audit:t1:second-lens' },  // cross-seat, in-window → merges into row 1
    // Never a collapse target (different file): its merged[] is never write-point-normalized, so it
    // reaches the unconditional handoff followUps projection raw — the read-site guard alone must hold.
    { severity: 'Minor', title: 'lone row', rationale: 'r3', file: 'src/b.js', line: 1, seat: 'audit:t1:third-lens', merged: [null] },
  ]
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, logs } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'malformed merged elements never convert a LANDED phase into held:workflow-error (both deref sites sit outside the local filing try — a bare x.seat on null would reach the top-level catch)')
  assert.equal(out.minorsFiled.length, 2, 'the in-window cross-seat pair still collapses; the other-file row survives')
  const rep = out.handoff.followUps.find(f => f.reason.startsWith('stale enum comment'))
  assert.ok(rep && Array.isArray(rep.merged), 'the collapse-target row carries a merged[] on its handoff entry')
  assert.deepEqual(rep.merged, [
    { seat: '(seat unrecorded)', title: 'pre-existing', rationale: '(no rationale recorded)' },
    { seat: 'audit:t1:second-lens (task t1)', title: 'comment misses the arm', rationale: 'r2' },
  ], 'null/string junk is dropped; the field-less object gets absence-tolerant defaults; the real merged-away row keeps full fidelity')
  const lone = out.handoff.followUps.find(f => f.reason.startsWith('lone row'))
  assert.ok(lone && !('merged' in lone), 'the never-collapsed row\'s all-junk merged[] filters to empty — the additive key is omitted, and the projection never threw')
  const cons = logs.find(l => typeof l === 'string' && l.startsWith('file-followups consolidation:'))
  assert.ok(cons && cons.includes('[(seat unrecorded)] "pre-existing" — (no rationale recorded)'),
    'the consolidation log line renders the surviving junk-adjacent element through the same defaults instead of throwing')
})

test('clusters manifest asserts (fail-open): a partition violation, a duplicate ordinal, and a missing manifest each get ONE violation log line; a conforming manifest logs none; landDecision untouched', async () => {
  const twoF = [handoffMinorF, { severity: 'Minor', title: 'stale count', rationale: 'lagging comment', file: 'z.js' }]
  const run = async (filingResult) => {
    const impl = (prompt, opts) => {
      const seat = seatOf(opts)
      if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return filingResult
      if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
        return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: twoF, confidence: 'high' }
      return handoffImpl(undefined)(prompt, opts)
    }
    return runPhase(HANDOFF_ARGS(), impl)
  }
  const viol = (logs) => logs.filter(l => typeof l === 'string' && l.startsWith('file-followups clusters manifest violation:'))
  // (a) uncovered ordinal (a dropped row IS a violation — every ordinal in exactly one cluster)
  const a = await run({ filed: [{ n: 1, issue: 1 }, { n: 2, issue: 2 }], clusters: [{ ordinals: [1], issue: 1 }] })
  assert.equal(a.out.landDecision, 'landed', 'landDecision untouched by the violation (fail-open)')
  assert.equal(viol(a.logs).length, 1, 'exactly ONE violation log line (uncovered ordinal)')
  assert.match(viol(a.logs)[0], /ordinal 2 appears in 0 clusters/, 'the line names the uncovered ordinal')
  assert.equal(a.out.handoff.followUps[1].issue, 2, 'stamping is still honored row-by-row despite the violation')
  // (b) duplicate ordinal (a split of an engine row — clustering may only merge)
  const b = await run({ filed: [{ n: 1, issue: 1 }, { n: 2, issue: 1 }], clusters: [{ ordinals: [1, 2], issue: 1 }, { ordinals: [2], issue: 1 }] })
  assert.equal(viol(b.logs).length, 1, 'exactly ONE violation log line (duplicate ordinal)')
  assert.match(viol(b.logs)[0], /ordinal 2 appears in 2 clusters/, 'the line names the split ordinal')
  // (c) missing manifest (legacy-shaped return)
  const c = await run({ filed: [{ n: 1, issue: 9 }, { n: 2, issue: 9 }] })
  assert.equal(viol(c.logs).length, 1, 'a missing clusters[] manifest is a logged violation')
  assert.match(viol(c.logs)[0], /manifest missing/, 'the line says the manifest is missing')
  // (d) conforming merge-only manifest: both rows in ONE cluster, one shared issue (several rows may
  // share one issue number — stamping semantics unchanged) — no violation line.
  const d = await run({ filed: [{ n: 1, issue: 7 }, { n: 2, issue: 7 }], clusters: [{ ordinals: [1, 2], issue: 7 }] })
  assert.equal(viol(d.logs).length, 0, 'a conforming manifest logs no violation')
  assert.deepEqual(d.out.handoff.followUps.map(f => f.issue), [7, 7], 'both rows share the cluster\'s one issue number')
  // (e) distinct issues filed > post-collapse rows: an out-of-range n row skips stamping but its
  // issue number still counts into distinctIssues — the filing floor (issues ≤ rows) must fire.
  const e = await run({ filed: [{ n: 1, issue: 1 }, { n: 2, issue: 2 }, { n: 99, issue: 3 }], clusters: [{ ordinals: [1], issue: 1 }, { ordinals: [2], issue: 2 }] })
  assert.equal(e.out.landDecision, 'landed', 'landDecision untouched (fail-open)')
  assert.equal(viol(e.logs).length, 1, 'exactly ONE violation log line (distinct issues exceed post-collapse rows)')
  assert.match(viol(e.logs)[0], /3 distinct issues filed exceed the 2 post-collapse rows/, 'the line carries both counts')
  assert.deepEqual(e.out.handoff.followUps.map(f => f.issue), [1, 2], 'in-range stamping is still honored; the out-of-range row never stamps')
  // (f) unknown ordinal: a cluster ordinal outside 1..rows (or non-integer) is named in the
  // violation line — it is not a partition member the per-row loop can see.
  const f = await run({ filed: [{ n: 1, issue: 1 }, { n: 2, issue: 1 }], clusters: [{ ordinals: [1, 2, 99], issue: 1 }] })
  assert.equal(viol(f.logs).length, 1, 'exactly ONE violation log line (unknown ordinal)')
  assert.match(viol(f.logs)[0], /unknown ordinal 99/, 'the line names the unknown ordinal')
})

// --- Evidence-artifacts emission (Task 3.2, PIN-14, #1658) ---

// Drift row binding the filing prompt's Evidence-artifacts emission clause (End state 9): the
// clustered filing prompt instructs each filed issue to end with an `## Evidence artifacts`
// section (pinned sha, seat lenses, audit round), the candidate rows render the engine-known
// values — fixRounds from the task's audit-verdict auditLog entry, gateHeadSha from its
// post-merge gate-audit entry, the raising seat via seatRef on EVERY row (the corroboration
// list on a merged row, the single minorsOf-stamped seat otherwise), all in hand at filing
// time — and the never-invented / 'unrecorded' fail-open rides the prompt verbatim.
test('filing-prompt Evidence-artifacts emission (Task 3.2, PIN-14): the clustered filing prompt mandates the `## Evidence artifacts` section and the candidate rows render the pinned sha + audit round', async () => {
  const { out, calls } = await runPhase(HANDOFF_ARGS(),
    handoffImpl({ filed: [{ n: 1, issue: 77 }], clusters: [{ ordinals: [1], issue: 77 }] }))
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  // The emission clause (the drift-guarded instruction text).
  assert.match(fp, /ends with an `## Evidence artifacts` section/, 'the clause mandates the section on each filed issue body')
  assert.match(fp, /pinned sha \(the integration tip the row's task was gate-audited at\)/, 'the clause names the pinned sha and states what it is')
  assert.match(fp, /raising seat lenses/, 'the clause names the seat lenses')
  assert.match(fp, /the audit round/, 'the clause names the audit round')
  assert.match(fp, /`unrecorded` stays `unrecorded`, never invented/, 'the copied-verbatim / never-invented fail-open rides the clause')
  assert.match(fp, /inside the corroboration comment instead/, 'the dedup arm carries the same evidence lines in the corroboration comment')
  // The candidate rows render the engine-known values the clause tells the agent to copy: the
  // harness's merge result integration_sha ('beefcafe12') is the task's gateHeadSha, and the
  // zero-fix-round approve path stamps fixRounds 0. Delete-the-feature proof: with the row
  // rendering removed, the clause's values have no source and these two pins fail.
  assert.match(fp, /audit round 0 · pinned sha beefcafe12/, 'the candidate row renders the auditLog-sourced audit round and pinned gateHeadSha')
  // Single-seat row (the dominant, non-collapsed shape — this fixture's one seat, one Minor):
  // the raising seat renders via the seatRef fallback, so End state 9's seat-lenses value is
  // emitted, never documented-around. The merged-row corroboration-list pin lives in the
  // Task-2.1 consolidation test above (seats: audit:t1:correctness (task t1),
  // audit:t1:cascading-impact (task t1)).
  assert.match(fp, /· seats: audit:t1:correctness \(task t1\) · why not absorbable/,
    'a non-collapsed row renders its single raising seat (seatRef fallback, seat+task — D8) in row position')
  assert.doesNotMatch(fp, /single raising seat is unrecorded/,
    "the retired 'no seats rendered ⇒ unrecorded' carve-out is gone — every row renders its seat")
})

test('filing-prompt Evidence-artifacts emission (fail-open): a never-merged task\'s row renders pinned sha unrecorded — never invented, never a throw', async () => {
  // A never-approved task files its demoted findings on the held:escalation path: its audit-verdict
  // auditLog entry stamps fixRounds (the audit round IS recorded), but no post-merge gate-audit
  // entry exists — the pinned-sha lookup takes the 'unrecorded' arm, exactly the vocabulary the
  // emission clause pins ('`unrecorded` stays `unrecorded`, never invented').
  const impl = (prompt, opts) => {
    if (seatOf(opts) === 'war-auditor') {
      return { seat: opts.label, lens: 'correctness', verdict: 'escalate', escalate_reason: 'plan wrong', confidence: 'high',
        findings: [{ severity: 'Nit', title: 'nit on escalated task', rationale: 'r' }] }
    }
    return aceBase([])(prompt, opts)
  }
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.escalated || []).some(e => e && e.task === 't1'), 't1 escalated, never merged (presence guard)')
  const filing = calls.find(c => c.opts.dispatchKind === 'file-followups')
  assert.ok(filing, 'the filing dispatch fires on the held:escalation path (presence guard)')
  assert.match(filing.prompt, /audit round 0 · pinned sha unrecorded/,
    'the never-merged task\'s row keeps its recorded audit round but renders pinned sha unrecorded (fail-open, never invented)')
})

// ---------------------------------------------------------------------------
// Phase 5 Task 2 (#1785) — consolidation fixtures: collapse fidelity (End state 7),
// string seats (End state 8), :rebut lens carve-out (End state 21), requiresTest:false
// evidence sha (End state 22), and the ask channel's sha provenance + gate-audit-family
// routing + audit-sha validator (End state 23; #1691/#1692/#1693).
// ---------------------------------------------------------------------------

// Cross-task consolidation impl: t1 and t2 each raise ONE Minor on the same file, lines 100/105
// (in the ±10 window) — a CROSS-seat, CROSS-task collapse. Gate-audit seats stay finding-less.
const crossTaskImpl = (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-auditor') {
    if ((opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
    const f = (opts.label || '').startsWith('audit:t1')
      ? { severity: 'Minor', title: 'stale enum comment', rationale: 'lags the new arm', file: 'src/a.js', line: 100 }
      : { severity: 'Minor', title: 'comment misses the arm', rationale: 'same stale block', file: 'src/a.js', line: 105 }
    return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [f], confidence: 'high' }
  }
  if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups')
    return { filed: [{ n: 1, issue: 42 }], clusters: [{ ordinals: [1], issue: 42 }] }
  return handoffImpl(undefined)(prompt, opts)
}

test('collapse-fidelity (End state 7): a cross-task cross-seat collapse carries the merged-away title+rationale through the filing prompt, the issue-body instruction, handoff followUps, and the consolidation log; seats[] renders seat+task per row', async () => {
  const { out, calls, logs } = await runPhase(PROVISION_ARGS(), crossTaskImpl)
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed')
  assert.equal(out.minorsFiled.length, 1, 'the cross-task line-window duplicates (t1@100, t2@105, same file) collapse to one row')
  // seats[] carries seat+task attribution on the CROSS-TASK collapse (D8 — both entries name their own task).
  assert.deepEqual(out.minorsFiled[0].seats,
    ['audit:t1:correctness (task t1)', 'audit:t2:correctness (task t2)'],
    'seats[] carries seat+task for BOTH tasks on a cross-task collapse')
  // merged[] fidelity: the merged-away row's title and rationale survive on the representative.
  assert.deepEqual(out.minorsFiled[0].merged,
    [{ seat: 'audit:t2:correctness (task t2)', title: 'comment misses the arm', rationale: 'same stale block' }],
    'the merged-away row\'s title and rationale ride the survivor\'s merged[] sub-list')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  // (1) the filing PROMPT renders the merged-away title+rationale on the candidate row…
  assert.ok(fp.includes('merged corroborations: [audit:t2:correctness (task t2)] "comment misses the arm" — same stale block'),
    'the candidate row renders the merged-away title and rationale (filing-prompt leg)')
  // (2) …and the ISSUE-BODY instruction mandates carrying them into the filed issue.
  assert.match(fp, /each merged-away finding's title and rationale \(the engine preserved them on the surviving row; they must reach the issue body, never drop\)/,
    'the issue-body instruction mandates the merged-away title+rationale reach the issue body')
  // (3) the HANDOFF followUps entry carries the merged[] projection.
  const rep = out.handoff.followUps.find(f => f.reason.startsWith('stale enum comment'))
  assert.ok(rep, 'the surviving row rides handoff.followUps')
  assert.deepEqual(rep.merged,
    [{ seat: 'audit:t2:correctness (task t2)', title: 'comment misses the arm', rationale: 'same stale block' }],
    'handoff.followUps carries the merged-away title and rationale (handoff leg)')
  // (4) the consolidation LOG line names the merged-away row verbatim.
  const cons = logs.find(l => typeof l === 'string' && l.startsWith('file-followups consolidation:'))
  assert.ok(cons && cons.includes('[audit:t2:correctness (task t2)] "comment misses the arm" — same stale block'),
    'the consolidation log line carries the merged-away title and rationale (log leg)')
})

test('collapse-fidelity (End state 7, same-seat control): two rows from the SAME seat on the same file within the line window never collapse', async () => {
  // Delete-the-feature: without the D8 cross-seat term in the collapse predicate, these two
  // same-seat rows are a textbook file + line-window hit and would collapse — the length-2
  // assertion goes red.
  const findings = [
    { severity: 'Minor', title: 'stale enum comment', rationale: 'r1', file: 'src/a.js', line: 100 },
    { severity: 'Minor', title: 'comment misses the arm', rationale: 'r2', file: 'src/a.js', line: 105 },
  ]
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor' && !(opts.label || '').startsWith('gate-audit:'))
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings, confidence: 'high' }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, logs } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  assert.equal(out.minorsFiled.length, 2, 'same-seat same-file rows within the window do NOT collapse (a seat repeating itself is not corroboration, D8)')
  assert.ok(out.minorsFiled.every(m => !('seats' in m) && !('merged' in m)),
    'neither surviving row gained a seats[]/merged[] corroboration list — no collapse happened at all')
  assert.ok(!logs.some(l => typeof l === 'string' && l.startsWith('file-followups consolidation:')),
    'no consolidation log line — the row count never shrank')
})

test('collapse-fidelity (End state 7, terminal arm): a seatless, taskless row still renders \'unattributed\' in the filing row', async () => {
  // Findings are auditor-controlled JSON: an explicit seat:null overrides the minorsOf seat stamp
  // and task:null overrides the routing task stamp (spread-last wins) — the seatRef terminal arm
  // is the live contract the Evidence-artifacts clause names verbatim.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high',
        findings: (opts.label || '').startsWith('gate-audit:') ? []
          : [{ severity: 'Minor', title: 'orphan row', rationale: 'r', file: 'q.js', seat: null, task: null }] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, calls } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: the seatless row never threw the filing block')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /"orphan row"[^\n]* · seats: unattributed/,
    'the seatless, taskless row renders the \'unattributed\' terminal arm in row position')
})

test('string-seats-fixture (End state 8): an auditor-supplied string `seats` on a NON-collapsing row renders via the Array.isArray fallback without throwing — landDecision stays landed', async () => {
  // Delete-the-feature: a truthiness gate on m.seats would take the seats-join branch for this
  // truthy, lengthful STRING — String.prototype.join does not exist and the row builder throws.
  // But the row builder is evaluated as an ARGUMENT to the filing `agent(...)` call inside the
  // filing block's own fail-open try, so the throw is caught locally (`filingOut = null`), the
  // dispatch never fires, and the phase still lands — landDecision is non-discriminating here.
  // The load-bearing pin is therefore the `calls.find(...).prompt` read below: with a truthiness
  // gate no file-followups dispatch exists and `.prompt` throws. Array.isArray sends the row down
  // the seatRef fallback so the dispatch fires and the row renders.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high',
        findings: (opts.label || '').startsWith('gate-audit:') ? []
          : [{ severity: 'Minor', title: 'string seats row', rationale: 'r', file: 'p.js', line: 3, seats: 'audit:bogus' }] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, calls } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase lands (the filing dispatch fails open by design — the load-bearing pin is the row render below)')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /"string seats row"[^\n]* · seats: audit:t1:correctness \(task t1\)/,
    'the row renders via the seatRef fallback (Array.isArray gate) — never the raw string, never a throw')
  assert.equal(out.handoff.followUps.length, 1, 'the row rides the handoff (projected from minorsFiled independently of the filing dispatch)')
})

test('rebut-lens (End state 21): a `:rebut`-suffixed seat label rides the filing row and the Evidence-artifacts clause carves the suffix out of lens extraction — prompt and file-followups.md mirror both carry the carve-out (drift row)', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      // Auditor-supplied seat label with the rebuttal-round dispatch suffix — minorsOf stamps it
      // onto the row verbatim, so the filing agent sees 'audit:t1:correctness:rebut (task t1)'.
      return { seat: 'audit:t1:correctness:rebut', lens: 'correctness', verdict: 'approve', confidence: 'high',
        findings: (opts.label || '').startsWith('gate-audit:') ? []
          : [{ severity: 'Minor', title: 'rebut-raised row', rationale: 'r', file: 'r.js' }] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, calls } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /"rebut-raised row"[^\n]* · seats: audit:t1:correctness:rebut \(task t1\)/,
    'the :rebut-suffixed seat label rides the candidate row (the carve-out has a live subject)')
  // The Evidence-artifacts clause instructs extracting the TRUE lens: the suffix is a dispatch
  // label, never the lens — the segment BEFORE it is the lens ('correctness' here, not 'rebut').
  assert.ok(fp.includes('a trailing `:rebut` is a dispatch label, never the lens: take the segment before it'),
    'the emitted Evidence-artifacts clause carries the :rebut lens carve-out verbatim')
  // Mirror drift row (standing/dispatched split): the standing file-followups.md carries the same
  // carve-out — em-dash variant of the same instruction.
  const ffMd = readFileSync(join(here, '../references/file-followups.md'), 'utf8')
  assert.ok(ffMd.includes('a trailing `:rebut` is a dispatch label, never the lens — take the segment before it'),
    'file-followups.md mirrors the :rebut lens carve-out (standing-surface leg of the split rule)')
})

test('evidence-sha (End state 22): auditEvidenceOf renders a REAL landed sha (never unrecorded) for a merged requiresTest:false task via the landedShaByTask retention', async () => {
  // The D7 skip means a requiresTest:false task has NO post-merge gate-audit auditLog entry —
  // before the retention, its pinned sha fell to 'unrecorded'. Delete-the-feature: remove the
  // landedShaByTask fallback from auditEvidenceOf and the pinned-sha pin below goes red.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [handoffMinorF], confidence: 'high' }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups')
      return { filed: [{ n: 1, issue: 9 }], clusters: [{ ordinals: [1], issue: 9 }] }
    return handoffImpl(undefined)(prompt, opts)
  }
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 's', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] })
  const { out, calls } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed')
  assert.ok(!calls.some(c => (c.opts.label || '').startsWith('gate-audit:t1')),
    'the D7 skip held — no gate-audit seat for the requiresTest:false task (the fallback, not a gate-audit entry, must source the sha)')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /pinned sha beefcafe12/,
    'the requiresTest:false task\'s row renders its REAL landed integration tip (landedShaByTask retention)')
  assert.doesNotMatch(fp, /pinned sha unrecorded/,
    'no row falls to the unrecorded arm — the merged task\'s sha is in hand')
})

test('ask-routing (End state 23, #1691): a parked ask from a seat echoing a REAL audit_sha carries that sha into asks[] and handoff.asks[].sha — the positive-value leg of the sha provenance pin', async () => {
  // The seat echoes the dispatched pin (the worker's committed tip 'deadbeef') as audit_sha, so
  // the pin-mismatch strip stays unhit and minorsOf stamps the validated sha onto the parked ask.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high', audit_sha: 'deadbeef',
        findings: (opts.label || '').startsWith('gate-audit:') ? [] : [askFinding()] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: an open ask never blocks the land')
  assert.equal((out.asks || []).length, 1, 'exactly one parked ask')
  assert.equal(out.asks[0].sha, 'deadbeef', 'asks[].sha carries the seat\'s real audit_sha verbatim (positive value, not null)')
  assert.equal(out.handoff.asks[0].sha, 'deadbeef', 'handoff.asks[].sha carries the same validated sha (the lossy projection preserves provenance)')
})

test('ask-routing (End state 23, #1692): a gate-audit-family seat\'s disposition:\'ask\' Minor reaches asks[] — the comment-named lane parks, never sinks', async () => {
  // The gate-audit seat echoes the pin (gateHeadSha = the merge result's integration_sha) as
  // audit_sha, so the pin-mismatch exclusion stays unhit and the ask parks with that sha.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor') {
      if ((opts.label || '').startsWith('gate-audit:'))
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', confidence: 'high',
          audit_sha: 'beefcafe12', findings: [askFinding({ title: 'gate-audit ask' })] }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard: a gate-audit Minor is SOFT — never a hold')
  const a = (out.asks || []).find(x => x && x.seat === 'gate-audit:t1:execution-evidence')
  assert.ok(a, 'the gate-audit-family ask parked on asks[] with the family\'s synthetic seat label')
  assert.equal(a.task, 't1', 'the parked ask carries the audited task')
  assert.equal(a.sha, 'beefcafe12', 'the parked ask carries the seat\'s pin-equal audit_sha')
  assert.equal(a.question, 'mirror the value or point at the source?', 'the question rides the record')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'gate-audit ask'),
    'the ask never enters minorsFiled (parked, not filed unruled)')
})

test('ask-routing (End state 23, #1693): a ref-expression/free-text audit_sha never reaches asks[].sha verbatim — the audit-sha sentinel renders; and the validator\'s regex cannot drift from isSha (sibling-copy drift row)', async () => {
  // pinMismatch fails open on a non-sha audit_sha (no strip), but auditShaOrSentinel refuses it:
  // the operator-facing asks[].sha gets the sentinel, never the raw ref expression.
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high', audit_sha: 'HEAD~2',
        findings: (opts.label || '').startsWith('gate-audit:') ? [] : [askFinding()] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  assert.equal((out.asks || []).length, 1, 'the ask still parks (the sentinel is a value fix, never a drop)')
  assert.equal(out.asks[0].sha, '(audit_sha unrecorded/malformed)',
    'a free-text audit_sha renders the sentinel on asks[].sha')
  assert.equal(out.handoff.asks[0].sha, '(audit_sha unrecorded/malformed)',
    'the handoff projection carries the sentinel too — HEAD~2 never reaches an operator-facing sha field')
  assert.ok(!JSON.stringify(out.asks).includes('HEAD~2') && !JSON.stringify(out.handoff.asks).includes('HEAD~2'),
    'the raw ref expression appears NOWHERE in the ask records (verbatim leak proof)')
  // Sibling-copy drift row: auditShaOrSentinel is a sanctioned self-contained copy of the isSha
  // hex test (#393 extract-and-eval convention) — extract both regex literals from the source and
  // pin them equal, so the copy can never silently drift from the canonical shape.
  const arrowLine = src.split('\n').find(l => l.startsWith('const auditShaOrSentinel'))
  const isShaLine = src.split('\n').find(l => l.startsWith('const isSha'))
  assert.ok(arrowLine, 'the auditShaOrSentinel validator arrow exists at module scope (declared above minorsOf)')
  assert.ok(isShaLine, 'the canonical isSha arrow exists')
  const rxOf = (line, name) => {
    const m = line.match(/\/([^/]+)\/\.test\(/)
    assert.ok(m, `${name} carries an inline regex-literal hex test`)
    return m[1]
  }
  assert.equal(rxOf(arrowLine, 'auditShaOrSentinel'), rxOf(isShaLine, 'isSha'),
    'the sanctioned sibling copy\'s regex source equals isSha\'s — the copy cannot drift')
  // Extract-and-eval unit cases on the validator itself (the #393 convention).
  const auditShaOrSentinel = new Function('return ' + arrowLine.replace(/^const auditShaOrSentinel = /, ''))()
  assert.equal(auditShaOrSentinel(null), null, 'null stays null (absence-tolerant)')
  assert.equal(auditShaOrSentinel('deadbeef'), 'deadbeef', 'a real hex sha passes verbatim')
  assert.equal(auditShaOrSentinel('HEAD~2'), '(audit_sha unrecorded/malformed)', 'a ref expression collapses to the sentinel')
  assert.equal(auditShaOrSentinel('origin/main'), '(audit_sha unrecorded/malformed)', 'a branch ref collapses to the sentinel')
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
// #990 — the LANDED-TIP ANCHOR is hoisted above the Wrap-up gate and THREADED into the servitor
// prompt. Same computation the handoff block used to own (the test above pins its semantics
// unchanged); these three pin the RENDERED value at each rung of its fallback chain:
// landed working_sha → last pinned gateHeadSha → the named placeholder. The placeholder rung is the
// ADR 0034 proof: `pt` throws on undefined, so the null case must be pre-resolved BEFORE interpolation.
// ---------------------------------------------------------------------------
const TIP_PLACEHOLDER = /landed tip unrecorded — ground via the gate-audit auditSha entries in your audit-log input/
// One-task happy path with the land + merge results injected, so each rung is reachable.
const tipImpl = (land, merge) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && (opts.dispatchKind === 'provision-barrier' || opts.dispatchKind === 'provision-run')) return { ok: true }
  if (seat === 'war-refiner' && opts.dispatchKind === 'polish-worktree') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef' }
  if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner') return opts.phase === 'Land'
    ? { mode: 'land-phase', status: 'landed', ...land }
    : { mode: 'merge-task', status: 'merged', ...merge }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
const servitorPromptAtTip = async (land, merge) => {
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }] })
  const { calls, out } = await runPhase(args, tipImpl(land, merge))
  assert.equal(out.landDecision, 'landed', 'presence guard: the phase landed, so the Wrap-up gate opens')
  const p = (calls.find(isServitor) || {}).prompt
  assert.ok(p, 'presence guard: a servitor was dispatched')
  return { p, out }
}

test('#990 threaded tip — a landed working_sha renders as the Wrap-up prompt Landed tip anchor', async () => {
  const { p, out } = await servitorPromptAtTip({ working_sha: 'abc1234def' }, { integration_sha: 'beefcafe12' })
  assert.match(p, /Landed tip: abc1234def on dev\/wtprov-a \(plan slug: wtprov-a\)/,
    'the prompt carries the landed sha, the working branch, and the plan slug (the worktree-lookup gitdir match)')
  assert.equal(out.handoff.tipSha, 'abc1234def', 'the hoisted computation still feeds handoff.tipSha — one source of truth')
})

test('#990 threaded tip — working_sha absent falls back to the last pinned gateHeadSha, never the string "undefined"', async () => {
  const { p, out } = await servitorPromptAtTip({}, { integration_sha: 'beefcafe12' })
  assert.match(p, /Landed tip: beefcafe12 on dev\/wtprov-a/, 'the documented fallback rung renders the last pinned gate head sha')
  assert.doesNotMatch(p, /Landed tip: undefined/, 'the pt undefined-guard stays unhit and no raw "undefined" reaches the prompt')
  assert.equal(out.handoff.tipSha, 'beefcafe12', 'handoff.tipSha takes the same rung — semantics unchanged by the hoist')
})

test('#990 threaded tip — no working_sha and no SHA-shaped pin renders the NAMED placeholder and the dispatch does not throw', async () => {
  const { p, out } = await servitorPromptAtTip({}, {})
  assert.match(p, TIP_PLACEHOLDER, 'the null tip is pre-resolved to the named placeholder BEFORE interpolation (ADR 0034)')
  assert.doesNotMatch(p, /Landed tip: (undefined|null)\b/, 'never the string "undefined", and never a bare "null" either')
  assert.equal(out.handoff.tipSha, null, 'handoff.tipSha stays null — the placeholder is a prompt-side resolution only')
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
// Explicit requiresPackaging:true — the ONLY shape that threads --advise-vacuous (#819). A defaulted
// (undefined) task runs the floor but withholds the advisory (advisePackagingVacuous === true only).
const PKG_TRUE_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresPackaging: true }],
  ...over,
})

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

test("pkg §4.2 — retry-merge prompt re-instructs ALL floor invocations (test + packaging + submodule + done-when kept in sync with standing steps; the done-when arm is asserted by 'done-when floor threading (Task 2.3)' — this fixture is doneWhen-less)", async () => {
  // The floor-retry merge prompt must re-instruct assert-test-in-diff.sh, assert-packaging-in-diff.sh,
  // assert-no-submodule-mutation.sh AND — for a doneWhen-bearing task — assert-done-when.sh
  // (dispatched-vs-standing coverage-split lesson). The enumeration is a twice-applied #1114
  // survey-derived correction: this test's own "ALL floor invocations" claim (and the two adjacent
  // engine comments that word it identically — now 'test + packaging + submodule + done-when')
  // enumerated two of the three floors when the submodule arm joined, and Task 2.3 re-applied the
  // correction when the done-when floor made it four. The done-when arm is NOT asserted here — this
  // fixture's task carries no doneWhen, so doneWhenFloorClause renders '' on the retry prompt; its
  // arbiter is the 'done-when floor threading (Task 2.3)' test, whose doneWhen-bearing fixture drives
  // the same floor-retry re-merge site and asserts /assert-done-when\.sh/ on it.
  // Non-vacuity (#1246): the test and packaging predicates carry the `run ` verb prefix, and that prefix is
  // the whole discriminator. A BARE filename regex greens on EITHER arm of the requiresTest /
  // requiresPackaging ternaries — the run arm and the `skip the assert-…-in-diff.sh check` arm share the
  // filename byte-run — so it passed even when the floor was being skipped, exercising nothing. The sibling
  // assert-no-submodule-mutation.sh predicate stays a bare filename regex on purpose: that invocation is
  // UNCONDITIONAL in the floor-retry prompt, so it has no like-worded skip arm to be confused with. (No
  // "re-run" wording is pinned by that predicate — it is itself bare and its message is inert prose; the
  // absent skip arm, not a verb, is what makes it discriminating.)
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
  assert.match(retry.prompt, /run assert-test-in-diff\.sh/, 'retry-merge re-instructs the test floor')
  assert.match(retry.prompt, /run assert-packaging-in-diff\.sh/, 'retry-merge re-instructs the packaging floor')
  assert.match(retry.prompt, /assert-no-submodule-mutation\.sh/, 'retry-merge re-instructs the submodule floor (unconditional per war-refiner.md step 6 — "always")')
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

// ---------------------------------------------------------------------------
// #819 — engine-side --advise-vacuous threading. A task that EXPLICITLY declares
// requiresPackaging:true threads ` --advise-vacuous` into all three dispatched packaging-floor
// invocations (initial merge, floor-retry, baseline-proceed); a defaulted (undefined) task runs
// the floor but OMITS the flag (advisePackagingVacuous === r.task.requiresPackaging === true, NOT
// the !== false floor-run default). Spec §4.B.2–4.
// ---------------------------------------------------------------------------

test('pkg #819 — explicit requiresPackaging:true threads --advise-vacuous into the initial merge prompt; a defaulted task omits it (delete-the-feature lock)', async () => {
  const { calls: trueCalls } = await runPhase(PKG_TRUE_ARGS(), defaultImpl)
  const trueMerge = trueCalls.find(isMergeTask)
  assert.ok(trueMerge, 'a merge-task is dispatched for the requiresPackaging:true task')
  assert.match(trueMerge.prompt, /assert-packaging-in-diff\.sh \S+ \S+ --advise-vacuous/,
    'requiresPackaging:true → the initial merge prompt threads --advise-vacuous immediately after the task branch')
  // Delete-the-feature lock (lesson weak-test-assertion-passes-without-feature-being-exercised):
  // a defaulted (undefined requiresPackaging) task must OMIT the flag. Collapsing the `=== true`
  // advisePackagingVacuous const into the `!== false` floor-run default makes a defaulted task carry
  // it → this REDs. The floor STILL runs for a defaulted task; only the advisory is withheld.
  const { calls: defCalls } = await runPhase(PKG_ARGS(), defaultImpl)
  const defMerge = defCalls.find(isMergeTask)
  assert.ok(defMerge, 'a merge-task is dispatched for the defaulted task')
  assert.match(defMerge.prompt, /assert-packaging-in-diff\.sh integration\/wtprov-a\/phase-3 war\/wtprov-a\/p3-t1 to verify/,
    'the defaulted task STILL runs the packaging floor (only the advisory is withheld)')
  assert.ok(!defMerge.prompt.includes('--advise-vacuous'),
    'a defaulted (undefined requiresPackaging) task OMITS --advise-vacuous')
})

test('pkg #819 — the floor-retry re-merge prompt threads --advise-vacuous for an explicit requiresPackaging:true task', async () => {
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
  const { calls } = await runPhase(PKG_TRUE_ARGS(), impl)
  const retry = calls.find(c => /floor-retry/.test(c.opts.label || ''))
  assert.ok(retry, 'a floor-retry re-merge is dispatched')
  assert.match(retry.prompt, /assert-packaging-in-diff\.sh \S+ \S+ --advise-vacuous/,
    'the floor-retry re-merge threads --advise-vacuous for a requiresPackaging:true task')
})

test('pkg #819 — the baseline-proceed re-merge prompt threads --advise-vacuous for an explicit requiresPackaging:true task', async () => {
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED with the same id — pre-existing' }) })
  const { calls } = await runPhase(CLS_ARGS({ tasks: [{ id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }], requiresPackaging: true }] }), impl)
  const bp = calls.find(c => /:baseline-proceed$/.test(c.opts.label || ''))
  assert.ok(bp, 'a baseline-proceed re-merge is dispatched')
  assert.match(bp.prompt, /assert-packaging-in-diff\.sh \S+ \S+ --advise-vacuous/,
    'the baseline-proceed re-merge threads --advise-vacuous for a requiresPackaging:true task')
})

test('pkg #819 — source-level: all four dispatched packaging-floor invocations carry the advisePackagingVacuous conditional flag (count === 4; a three-of-four thread or a static collapse is RED)', () => {
  // Extract each INVOCATION literal — the script name followed by its two ref interpolations. The
  // mentions ("skip the assert-packaging-in-diff.sh check", the PACKAGE_IT description, the log line,
  // the comment) never carry `${ph.integrationBranch} ${r.task.branch}` and are excluded. The optional
  // group must be present at EVERY site: a three-of-four thread leaves the count right but one m[1]
  // undefined (RED), and a static ` --advise-vacuous` (no conditional) fails to match
  // `${advisePackagingVacuous …}` → undefined (RED) — pivotal constraint 4 (silent drift between rounds).
  const invocations = [...src.matchAll(/assert-packaging-in-diff\.sh \$\{ph\.integrationBranch\} \$\{r\.task\.branch\}(\$\{advisePackagingVacuous[^}]*--advise-vacuous[^}]*\})?/g)]
  assert.equal(invocations.length, 4,
    'exactly four dispatched packaging-floor invocation literals (initial merge, floor-retry, baseline-proceed, environment-proceed)')
  for (const m of invocations) {
    assert.ok(m[1],
      `every dispatched packaging-floor invocation must thread the advisePackagingVacuous conditional flag immediately after the task branch (a three-of-four thread or a static-flag collapse is RED): "${m[0]}"`)
  }
})

test('pkg §4.4 — args.backstops passes through UNTOUCHED into handoff.backstops[] on a landed phase', async () => {
  // The wtprov token in a `why` satisfies the #1413 own-token provenance floor (Task 2.1(d)).
  const BACKSTOPS = [
    { check: 'docker build -f app/Dockerfile app', why: 'no daemon at setup (wtprov)', runner: 'CI', source: 'auto' },
    { check: 'integration smoke', why: 'out of scope', runner: 'nightly', source: 'plan', aiDeclared: true },
  ]
  const { out } = await runPhase(PKG_ARGS({ backstops: BACKSTOPS }), defaultImpl)
  assert.equal(out.landDecision, 'landed', 'phase lands')
  assert.ok(out.handoff, 'handoff present on landed')
  assert.deepEqual(out.handoff.backstops, BACKSTOPS,
    'handoff.backstops[] is args.backstops passed through untouched (same entries, same order, aiDeclared preserved)')
})

test('pkg §4.4 — args.backstops also rides handoff on held:escalation (degraded phase still hands off the debt map)', async () => {
  const BACKSTOPS = [{ check: 'docker build', why: 'daemon unavailable at setup (wtprov)', runner: 'CI', source: 'auto' }]
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
  // The servitor wrap-up gate keys on memoryLocalRoot (NOT learningsTarget) — a recovered-land test that
  // asserts the wrap-up dispatch fired needs it threaded, or the assertion reds on a correct implementation.
  memoryLocalRoot: '/abs/mem',
  ...over,
})
// A refiner impl parameterized by what the initial merge / land returns; the two bounded recovery
// re-dispatches (labels ending :baseline-proceed / :environment-proceed) return merged/landed by default
// so the phase can proceed. Pass mergeProceed/landProceed to drive the recovery dispatch's own result
// (the bound tests need a SECOND failure out of the environment-proceed re-run).
const clsImpl = ({ mergeResult, landResult, mergeProceed, landProceed } = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  const label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true } // barrier + provision-run: env-outcome
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'abc', tests: {} }
  if (seat === 'war-auditor') return { seat: label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner' && opts.phase === 'Refine') {
    if (/:environment-proceed$/.test(label)) return mergeProceed ? mergeProceed(label) : { mode: 'merge-task', status: 'merged', integration_sha: 'beef1234beef' }
    if (/:baseline-proceed$/.test(label)) return { mode: 'merge-task', status: 'merged', integration_sha: 'beef1234beef' }
    return mergeResult ? mergeResult(label) : { mode: 'merge-task', status: 'merged' }
  }
  if (seat === 'war-refiner' && opts.phase === 'Land') {
    if (/:environment-proceed$/.test(label)) return landProceed ? landProceed(label) : { mode: 'land-phase', status: 'landed', working_sha: 'cafe5678cafe' }
    if (/:baseline-proceed$/.test(label)) return { mode: 'land-phase', status: 'landed', working_sha: 'cafe5678cafe' }
    return landResult ? landResult(label) : { mode: 'land-phase', status: 'landed' }
  }
  if (seat === 'war-servitor') return { phase: 3, target: 't', learnings: [] }
  return {}
}
// The two environment-class first results that trigger the bounded environment-proceed dispatches.
const envMergeResult = () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky timeout at task tip; base green; not reproduced' })
const envLandResult = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'environment', gate_output: 'flaky at land; base green; not reproduced' })

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

// REWRITTEN IN PLACE (merge-land-resilience Task 1.1, End state 1): this case used to assert the retired
// ZERO-round route (immediate reason:'env-blocked', task never merged). The 'environment' class now buys
// exactly ONE environment-proceed re-merge; a green re-run merges the task and the phase lands. The
// surviving "environment never dispatches a BASELINE-proceed" assertion is still correct — the two
// recovery flavors never chain — and stays.
test("#598 validation 5 — merge 'environment' → ONE environment-proceed re-merge, task merges, NO fix-worker; fails if the classification branch is deleted", async () => {
  const { out, calls } = await runPhase(CLS_ARGS(), clsImpl({ mergeResult: envMergeResult }))
  const ep = calls.filter(c => /^merge:t1:environment-proceed$/.test(c.opts.label || ''))
  assert.equal(ep.length, 1, "gate_failed+'environment' dispatches EXACTLY ONE environment-proceed re-merge (revert the arm ⇒ 0 dispatches + an immediate env-blocked escalation ⇒ this fails)")
  assert.equal(seatOf(ep[0].opts), 'war-refiner', 'the environment-proceed re-merge is a refiner dispatch')
  assert.equal(ep[0].opts.phase, 'Refine', 'it runs in the Refine phase (the serial merge queue), not Audit')
  assert.ok(out.landed.includes('t1'), 'the recovered task MERGED — an approved task is not silently dropped by a transient')
  assert.equal(out.landDecision, 'landed', 'the phase lands with its deliverable')
  assert.ok(!out.escalated.some(e => e && e.task === 't1'), 'a recovered environment failure escalates nothing')
  assert.ok(!calls.some(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Audit'), 'NO fix-worker prompt is built for a merge-time gate_failed (bounded refiner retry, not a fix loop)')
  assert.ok(!calls.some(c => /:baseline-proceed$/.test(c.opts.label || '')), 'environment never dispatches a baseline-proceed')
  assert.equal((out.handoff.backstops || []).filter(b => b && b.source === 'auto').length, 0,
    "an environment-proceed waives NOTHING — no debt, no source:'auto' backstop (unlike baseline-proceed)")
})

test("Task 1.1 (End state 2) — a SECOND 'environment' classification out of the environment-proceed re-merge HARD-escalates reason 'escalate' ⇒ held:escalation, WITH merged siblings present", async () => {
  // t1 flakes persistently; t2 merges cleanly. The old behavior completed the phase minus t1 (soft
  // env-blocked); the bound now holds the phase so an approved deliverable is never silently dropped.
  const impl = clsImpl({
    mergeResult: (label) => /t1/.test(label) ? envMergeResult() : { mode: 'merge-task', status: 'merged', integration_sha: 'feed0001feed' },
    mergeProceed: envMergeResult,
  })
  const { out, calls } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  assert.equal(calls.filter(c => /^merge:t1:environment-proceed$/.test(c.opts.label || '')).length, 1,
    'the retry is BOUNDED at one — a second environment classification does NOT re-dispatch')
  const esc = out.escalated.find(e => e && e.task === 't1')
  assert.ok(esc, 't1 escalates')
  assert.equal(esc.reason, 'escalate', "exhaustion reuses the existing HARD reason 'escalate' (no new enum member)")
  assert.match(esc.detail.note, /environment-proceed/, 'the detail names the mechanism that was spent')
  assert.equal(esc.detail.result && esc.detail.result.gate_failure_class, 'environment', 'the detail carries the second MergeResult')
  assert.ok(out.landed.includes('t2'), 'the sibling merged — the hold is not "nothing merged"')
  assert.equal(out.landDecision, 'held:escalation',
    'with merged siblings present the phase HOLDS (it must not complete without the approved-but-unmerged task)')
  assert.ok(!calls.some(c => /^land:phase-3$/.test(c.opts.label || '')), 'a held phase never dispatches the land')
})

test("Task 1.1 (End state 4) — merge-site bounds: a baseline-proceed re-merge failing environment-class dispatches NO environment-proceed, and an environment-proceed's second failure classified 'baseline' routes as introduced with NO baseline-proceed", async () => {
  // (a) baseline-proceed → environment: today's route, no chaining into the new flavor.
  const a = await runPhase(CLS_ARGS(), (prompt, opts) => /^merge:t1:baseline-proceed$/.test(opts.label || '')
    ? envMergeResult()
    : clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999' }) })(prompt, opts))
  assert.equal(a.calls.filter(c => /:environment-proceed$/.test(c.opts.label || '')).length, 0,
    'a baseline-proceed result classified environment never chains into an environment-proceed')
  assert.ok(a.out.escalated.some(e => e && e.task === 't1' && e.reason === 'env-blocked'), "it keeps routing today's soft env-blocked escalation")
  // (b) environment-proceed → baseline: bounded, treated as 'introduced', no baseline-proceed dispatch.
  const b = await runPhase(CLS_ARGS(), clsImpl({
    mergeResult: envMergeResult,
    mergeProceed: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999' }),
  }))
  assert.equal(b.calls.filter(c => /:baseline-proceed$/.test(c.opts.label || '')).length, 0,
    "an environment-proceed's baseline-classified second failure never chains into a baseline-proceed (bounded, spec decision 4)")
  const esc = b.out.escalated.find(e => e && e.task === 't1')
  assert.equal(esc && esc.reason, 'gate_failed', "it routes as 'introduced' — today's SOFT escalation, not the HARD exhaustion route")
  assert.equal(b.out.landDecision, 'held:nothing-merged', 'the lone task never merged and the escalation is SOFT (not the HARD held:escalation the exhaustion route yields)')
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

test("#798 — SUBSET containment dedup: a SUPERSET then a strict-SUBSET report at the same base ⇒ exactly ONE source:'auto' backstop (the subset is COVERED)", async () => {
  const SUP = ['pytest:test_a', 'pytest:test_b', 'pytest:test_c']
  const SUB = ['pytest:test_a', 'pytest:test_b']   // ⊂ SUP, same base
  // t1 records the SUPERSET first; t2's strict-subset at the SAME base is contained ⇒ no-op (one-entry-one-backstop).
  const impl = clsImpl({ mergeResult: (label) => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline',
    gate_failing_ids: /t1/.test(label) ? SUP : SUB, gate_base_sha: 'basecommon', gate_output: 'base RED, pre-existing' }) })
  const { out } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  assert.ok(out.landed.includes('t1') && out.landed.includes('t2'), 'both baseline tasks merged over the recorded debt')
  const auto = (out.handoff.backstops || []).filter(b => b && b.source === 'auto')
  assert.equal(auto.length, 1, 'the subset report is CONTAINED by the superset entry at the same base ⇒ exactly one deduped backstop (exact-key dedup would have minted two)')
  assert.ok(auto[0].check.includes('pytest:test_c'), 'the single retained entry is the SUPERSET (recorded first, contains the later subset) — test_c is superset-only')
})

test("#798 — non-subset (strict SUPERSET arriving second) still RECORDS: subset-first then superset at the same base ⇒ TWO entries (only subset minting is collapsed)", async () => {
  const SUB = ['pytest:test_a']
  const SUP = ['pytest:test_a', 'pytest:test_b']   // ⊃ SUB — a non-subset of the existing entry
  const impl = clsImpl({ mergeResult: (label) => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline',
    gate_failing_ids: /t1/.test(label) ? SUB : SUP, gate_base_sha: 'basecommon', gate_output: 'base RED' }) })
  const { out } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const auto = (out.handoff.backstops || []).filter(b => b && b.source === 'auto')
  assert.equal(auto.length, 2, 'a strict SUPERSET arriving after a subset entry is NOT contained ⇒ records normally (spec §8: only subset minting is collapsed)')
})

test("#798 — EMPTY-set carve-out: an absent-gate_failing_ids baseline at a base already carrying a NON-EMPTY entry STILL records its own '(see gate_output)' backstop (empty dedups exact-empty-vs-empty ONLY)", async () => {
  const NONEMPTY = ['pytest:test_x']
  // t1 records a non-empty entry at 'baseZ'; t2 classifies 'baseline' with NO gate_failing_ids at the SAME base.
  // Under naive containment [] ⊆ everything would swallow it — the carve-out keeps exact-key dedup so it records.
  const impl = clsImpl({ mergeResult: (label) => /t1/.test(label)
    ? ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: NONEMPTY, gate_base_sha: 'baseZ', gate_output: 'base RED x' })
    : ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_base_sha: 'baseZ', gate_output: 'base RED (unenumerated)' }) })  // NO gate_failing_ids ⇒ debtIds()=[]
  const { out } = await runPhase(CLS_ARGS({ tasks: [
    { id: 't1', issue: 301, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 302, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const auto = (out.handoff.backstops || []).filter(b => b && b.source === 'auto')
  assert.equal(auto.length, 2, "the empty-id-set report is NOT swallowed by the non-empty entry (the carve-out keeps exact-key dedup for []) ⇒ its own entry records; naive containment would have yielded one")
  assert.ok(auto.some(b => /\(see gate_output\)/.test(b.check)), "the empty report records the '(see gate_output)' backstop")
  assert.ok(auto.some(b => b.check.includes('pytest:test_x')), 'the pre-existing non-empty entry is still present (both coexist)')
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

// REWRITTEN IN PLACE (merge-land-resilience Task 1.1, End state 3): this case used to assert the retired
// ZERO-round land route. The bound now spends exactly ONE environment-proceed re-land first; the
// held:land-failed + reason 'env-blocked' outcome survives only as the EXHAUSTION route asserted here.
test("#598 validation 5 — land 'environment' → ONE environment-proceed re-land; a SECOND environment classification exhausts the bound ⇒ reason 'env-blocked', held:land-failed", async () => {
  const { out, calls } = await runPhase(CLS_ARGS(), clsImpl({ landResult: envLandResult, landProceed: envLandResult }))
  assert.equal(calls.filter(c => /^land:phase-3:environment-proceed$/.test(c.opts.label || '')).length, 1,
    'EXACTLY ONE environment-proceed re-land (revert the arm ⇒ 0 dispatches ⇒ this fails; a chaining bug ⇒ 2 ⇒ this fails)')
  assert.equal(out.landDecision, 'held:land-failed', 'the exhausted bound falls back to held:land-failed (the Lead re-runs the land)')
  const esc = out.escalated.find(e => e && String(e.task).includes('-land') && e.reason === 'env-blocked')
  assert.ok(esc, "the second environment classification keeps reason 'env-blocked' — no new enum member")
  assert.equal(esc.detail && esc.detail.gate_failure_class, 'environment', 'the detail is the re-land MergeResult, not the first one')
})

test("Task 1.1 (End state 3) — land 'environment' recovered: the environment-proceed re-land's 'landed' ⇒ landDecision 'landed', the resync log line, and the servitor wrap-up dispatch fires", async () => {
  const { out, calls, logs } = await runPhase(CLS_ARGS(), clsImpl({ landResult: envLandResult }))
  assert.equal(calls.filter(c => /^land:phase-3:environment-proceed$/.test(c.opts.label || '')).length, 1, 'exactly one re-land is dispatched')
  assert.equal(out.landDecision, 'landed', 'a green re-land lands the phase (delete the recovery arm ⇒ held:land-failed ⇒ this fails)')
  assert.ok(logs.some(l => /environment-proceed re-land/.test(l) && /Opportunistic resync as on any landed phase/.test(l)),
    'it logs the same opportunistic-resync line the baseline-proceed landed arm logs (the primary chain resync arm is unreachable from a recovery arm)')
  assert.ok(calls.some(c => seatOf(c.opts) === 'war-servitor'),
    'the servitor wrap-up dispatch fires on the recovered land (the gate keys on memoryLocalRoot — CLS_ARGS threads it)')
  assert.equal((out.handoff.backstops || []).filter(b => b && b.source === 'auto').length, 0, "no debt, no source:'auto' backstop — nothing was waived")
})

test("Task 1.1 (End state 4) — land-site bounds: a baseline-proceed re-land failing environment-class dispatches NO environment-proceed, and an environment-proceed's second failure classified 'baseline' routes as introduced with NO baseline-proceed", async () => {
  // (a) baseline-proceed → environment keeps routing held:land-failed directly (no chaining).
  const a = await runPhase(CLS_ARGS(), (prompt, opts) => /^land:phase-3:baseline-proceed$/.test(opts.label || '')
    ? envLandResult()
    : clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' }) })(prompt, opts))
  assert.equal(a.calls.filter(c => /:environment-proceed$/.test(c.opts.label || '')).length, 0,
    'a baseline-proceed re-land classified environment never chains into an environment-proceed')
  assert.equal(a.out.landDecision, 'held:land-failed', 'it holds directly, exactly as before')
  // (b) environment-proceed → baseline is bounded: routed as 'introduced', no baseline-proceed dispatch.
  const b = await runPhase(CLS_ARGS(), clsImpl({
    landResult: envLandResult,
    landProceed: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' }),
  }))
  assert.equal(b.calls.filter(c => /:baseline-proceed$/.test(c.opts.label || '')).length, 0,
    "an environment-proceed re-land's baseline-classified second failure never chains into a baseline-proceed")
  assert.equal(b.out.landDecision, 'held:land-failed', 'it falls through to held:land-failed')
  const esc = b.out.escalated.find(e => e && String(e.task).includes('-land'))
  assert.equal(esc && esc.reason, 'gate_failed', "reason is the returned status, not 'env-blocked' (that arm is class-gated)")
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

// ---------------------------------------------------------------------------
// #1032 (recovery-re-merge-dispatch-coherence Task 1.1) — the submodule scoping note rides EVERY
// merge-task dispatch for a taskType:'submodule' task, not just the initial merge: the floor-retry
// re-merge, the environment-proceed re-merge and the baseline-proceed re-merge each append the same
// in-scope submodMergeNote as their final prompt segment. An unscoped re-dispatch would rebase and
// gate in the SUPERPROJECT — the defect these pin.
//
// SIBLING tests by design (never an extension of the T4 #297 threading test, whose header enumeration
// of the four threaded prompts stays accurate untouched). Each drives ONE recovery route through the
// harness that already stubs it and reads the captured prompt BY DISPATCH LABEL — never a source
// occurrence count (a source-regex count proves shape, not what the engine actually dispatched).
// Load-bearing: remove one route's `+ submodMergeNote` and exactly that route's test REDs; the note
// is '' off the submodule path, so no existing non-submodule prompt test moves either way.
// ---------------------------------------------------------------------------
const SUBMOD_RETRY_REPO = '/abs/submodule-checkout'
// The T4 #297 fixture SHAPE (taskType + targetRepo + targetBase) carried on the task id both harnesses
// already stub (t1), so neither harness needs an edit. requiresTest:true mirrors the plan-pinned
// floor-retry fixture (in production the test floor is what returns no-test); inside this harness it
// shapes only the dispatched prompt's requiresTest ternary, never route reachability — the sub-loop is
// entered on ANY floor status (no-test, unpackaged, or done-unmet), and runNoTestLoop's first Refine
// call returns no-test unconditionally.
const submodRetryTask = (over = {}) => ({
  id: 't1', issue: 301, title: 'Submodule task', planSlice: 'submod slice',
  roster: [{ lens: 'correctness' }], taskType: 'submodule',
  targetRepo: SUBMOD_RETRY_REPO, targetBase: 'main', requiresTest: true, ...over,
})
// Marker asserted WITH its colon: the phase-level "SUBMODULE TASKS in this phase:" note (a different
// prompt) would satisfy a bare `SUBMODULE TASK` substring — the colon pins the per-task merge note.
const assertSubmodScoped = (call, where) => {
  assert.ok(call, `${where} must be dispatched for a submodule task whose first merge tripped this route`)
  assert.ok(call.prompt.includes('SUBMODULE TASK:'),
    `${where}: prompt must carry the SUBMODULE TASK marker — without it the refiner re-merges in the superproject`)
  assert.ok(call.prompt.includes(SUBMOD_RETRY_REPO),
    `${where}: prompt must name the task's targetRepo "${SUBMOD_RETRY_REPO}" so rebase+gate run cwd-scoped to the submodule checkout`)
}

test('#1032 — the floor-retry re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  // no-test → add-test fix-worker → unanimous re-audit → floor-retry re-merge (runNoTestLoop's flow).
  const { calls } = await runNoTestLoop({ tasks: [submodRetryTask()] })
  assertSubmodScoped(mergePromptsOf(calls).floorRetry, 'the floor-retry re-merge (merge:t1:floor-retry:r<n>)')
})

test('#1032 — the environment-proceed re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ mergeResult: envMergeResult }))
  assertSubmodScoped(calls.find(c => /^merge:t1:environment-proceed$/.test(c.opts.label || '')), 'the environment-proceed re-merge')
})

test('#1032 — the baseline-proceed re-merge prompt carries the submodule scoping note (SUBMODULE TASK + targetRepo)', async () => {
  const impl = clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED with the same ids — pre-existing' }) })
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), impl)
  assertSubmodScoped(calls.find(c => /^merge:t1:baseline-proceed$/.test(c.opts.label || '')), 'the baseline-proceed re-merge')
})

// ---------------------------------------------------------------------------
// #1114 — submodule floor/note completion across the three remaining dispatch families (re-land, polish
// merge, floor-retry re-merge). SIBLINGS of the #1032 block above and bound by the same doctrine: each
// prompt test drives ONE route through the harness that already stubs it and reads the captured prompt BY
// DISPATCH LABEL (a source occurrence count proves shape, not what the engine dispatched); each routing
// test stubs the returned status and asserts the route the engine took.
// Load-bearing: delete an append/arm and exactly that route's test REDs — the notes are '' off the
// submodule path, so no existing non-submodule prompt test moves either way.
// ---------------------------------------------------------------------------

// The PHASE-level land note, asserted WITH its colon: the per-task merge note ("SUBMODULE TASK:") would
// satisfy a bare `SUBMODULE` substring — the colon + targetRepo pin the land note specifically.
const assertSubmodLandScoped = (call, where) => {
  assert.ok(call, `${where} must be dispatched for a submodule phase whose first land tripped this route`)
  assert.ok(call.prompt.includes('SUBMODULE PHASE:'),
    `${where}: prompt must carry the SUBMODULE PHASE marker — without it the phase is re-dispatched land-blind (no 2A CAS inside the submodule, no 2B PR-and-hold)`)
  assert.ok(call.prompt.includes(SUBMOD_RETRY_REPO),
    `${where}: prompt must name the phase's targetRepo "${SUBMOD_RETRY_REPO}" so the submodule land is scoped to the submodule checkout`)
}
const baselineLandFail = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' })

test('#1114 — the environment-proceed RE-LAND prompt carries the submodule land note (SUBMODULE PHASE + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ landResult: envLandResult }))
  assertSubmodLandScoped(calls.find(c => /^land:phase-3:environment-proceed$/.test(c.opts.label || '')), 'the environment-proceed re-land')
})

test('#1114 — the baseline-proceed RE-LAND prompt carries the submodule land note (SUBMODULE PHASE + targetRepo)', async () => {
  const { calls } = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }), clsImpl({ landResult: baselineLandFail }))
  assertSubmodLandScoped(calls.find(c => /^land:phase-3:baseline-proceed$/.test(c.opts.label || '')), 'the baseline-proceed re-land')
})

test('#1114 — the polish merge prompt runs the submodule floor, always BARE (a coherence sweep is never a declared gitlink bump)', async () => {
  const { calls } = await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()]))
  const polishMerge = calls.find(c => (c.opts.label || '') === 'merge:p3-polish')
  assert.ok(polishMerge, 'the polish merge is dispatched (phase-close sweep)')
  assert.match(polishMerge.prompt, /assert-no-submodule-mutation\.sh\s+integration\/wtprov-a\/phase-3\s+war\/wtprov-a\/p3-polish/,
    'the polish merge prompt invokes the submodule floor on <integrationBranch> <polishBranch> (delete the append ⇒ no invocation ⇒ RED)')
  assert.ok(!polishMerge.prompt.includes('--declared'),
    'the invocation is BARE — the gitlink-bump relax flag never appears anywhere in the polish prompt')
  // The reworded skip rationale still skips the three task-field-gated floors (collateral pin, #819/§4.2).
  assert.match(polishMerge.prompt, /skip assert-test-in-diff\.sh/, 'the polish merge still skips the test floor')
  assert.match(polishMerge.prompt, /skip the packaging floor assert-packaging-in-diff\.sh/, 'the polish merge still skips the packaging floor')
  assert.match(polishMerge.prompt, /skip the done-when floor assert-done-when\.sh/, 'the polish merge still skips the done-when floor (Task 2.3)')
})

test('#1114 — the floor-retry re-merge prompt runs the submodule floor WITH the gitlink-bump --declared conditional (both arms)', async () => {
  const bare = mergePromptsOf((await runNoTestLoop()).calls).floorRetry
  assert.ok(bare, 'a floor-retry re-merge is dispatched (non-declared task)')
  assert.match(bare.prompt, /assert-no-submodule-mutation\.sh\s+integration\/wtprov-a\/phase-3\s+war\/wtprov-a\/p3-t1/,
    'the floor-retry re-merge invokes the submodule floor on <integrationBranch> <taskBranch> (delete the insert ⇒ RED)')
  assert.ok(!bare.prompt.includes('--declared'),
    'a non-declared task gets the BARE floor at the floor-retry re-merge (the conditional is real, never static)')

  const declared = mergePromptsOf((await runNoTestLoop({ tasks: [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: true, taskType: 'gitlink-bump', declared: true },
  ] })).calls).floorRetry
  assert.ok(declared, 'a floor-retry re-merge is dispatched (declared gitlink-bump task)')
  assert.match(declared.prompt, /assert-no-submodule-mutation\.sh\s+\S+\s+\S+\s+--declared/,
    'a declared gitlink-bump task threads --declared AFTER both positional refs, so the retry does not refuse its own legitimate pin move')
})

test('#1114 — a floor-retry re-merge returning submodule-blocked escalates HARD (reason:"escalate"), never the soft status fallback', async () => {
  // Mirrors T2 #280 Test 1's routing assertions one dispatch later: the FIRST merge trips the test floor
  // and the floor-retry re-merge is what surfaces the submodule mutation. Load-bearing: without the
  // explicit arm the result falls to `reason: floorMr.status` — 'submodule-blocked' is NOT in
  // HARD_ESCALATION_REASONS, so the phase would LAND minus the task with a soft escalation.
  let mergeCallCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCallCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }
      : { mode: 'merge-task', status: 'submodule-blocked' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const { out, calls } = await runPhase(NO_TEST_ARGS(), impl)
  assert.ok(calls.some(c => /floor-retry/.test(c.opts.label || '')), 'the floor-retry re-merge was dispatched (the route under test is reached)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc, 'escalated must carry an entry for t1')
  assert.equal(esc.reason, 'escalate',
    'a floor-retry submodule-blocked escalates via the existing HARD "escalate" member, never the soft `reason: floorMr.status` fallback')
  assert.ok(typeof esc.detail === 'string' && esc.detail.includes('floor-retry re-merge'),
    'the detail names the floor-retry surface (distinct from the primary / environment-proceed / baseline-proceed arms)')
  assert.ok((out.auditLog || []).some(e => e && e.task === 't1' && e.verdict === 'submodule-blocked'),
    'the audit log records the submodule-blocked verdict (mirroring the primary arm)')
  assert.equal(out.landDecision, 'held:escalation', 'the phase HOLDS — a submodule touch never rides a land')
  assert.ok(!out.landed.includes('t1'), 't1 does not land')
})

test('#1114 — a RE-LAND returning submodule-pr yields held:submodule-pr with the PR ref captured (BOTH re-land routes)', async () => {
  const SUBMOD_PR = { mode: 'land-phase', status: 'submodule-pr', pr_number: 77, pr_remote: 'git@github.com:org/submodule.git' }
  // environment-proceed: clsImpl's landProceed hook drives the re-land's own result.
  const env = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }),
    clsImpl({ landResult: envLandResult, landProceed: () => SUBMOD_PR }))
  // baseline-proceed: that label has no clsImpl hook — relabel-wrap the impl (the established pattern).
  const baseImpl = clsImpl({ landResult: baselineLandFail })
  const base = await runPhase(CLS_ARGS({ tasks: [submodRetryTask()] }),
    (prompt, opts) => /^land:phase-3:baseline-proceed$/.test(opts.label || '') ? SUBMOD_PR : baseImpl(prompt, opts))

  for (const [where, r] of [['environment-proceed', env], ['baseline-proceed', base]]) {
    assert.equal(r.out.landDecision, 'held:submodule-pr',
      `the ${where} re-land's submodule-pr must yield held:submodule-pr — the held:land-failed else would mislabel the hold`)
    const esc = (r.out.escalated || []).find(e => e && e.reason === 'submodule-pr')
    assert.ok(esc, `the ${where} re-land pushes an escalated entry with reason:"submodule-pr"`)
    assert.equal(esc.pr_number, SUBMOD_PR.pr_number, `the ${where} re-land captures pr_number for the Lead's gh-resume`)
    assert.equal(esc.pr_remote, SUBMOD_PR.pr_remote, `the ${where} re-land captures pr_remote for the Lead's gh-resume`)
    // #1245 — the ONE observable change of the re-land arm-symmetry fix, asserted behaviorally (the D6
    // pin at the end of this file is the source-shape half). Before it, the phase returned the STALE
    // first gate_failed attempt here while the escalation said submodule-pr; now it returns the
    // dispatched re-land result, matching the shape the initial land has by construction.
    assert.equal(r.out.landResult && r.out.landResult.status, 'submodule-pr',
      `the ${where} re-land's returned land result IS the dispatched submodule-pr result, never the stale earlier attempt`)
    assert.equal(r.out.landResult.pr_number, SUBMOD_PR.pr_number,
      `the ${where} re-land's returned land result carries the PR ref, as the initial land's does`)
  }
})

test('#1114 — a polish merge returning submodule-blocked routes the EXISTING fail-open DISCARD arm (no new hold)', async () => {
  const base = sweepBase([queuedAbsorb()])
  const impl = (prompt, opts) => (opts.label || '') === 'merge:p3-polish'
    ? { mode: 'merge-task', status: 'submodule-blocked' }
    : base(prompt, opts)
  const { out, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.equal(out.handoff.polish, 'discarded', 'the sweep DISCARDS — the pre-polish tip lands unchanged')
  assert.equal(out.landDecision, 'landed', 'fail-open: a blocked polish is never a hold')
  assert.ok((out.escalated || []).every(e => !e || e.reason !== 'escalate'),
    'no escalation is minted for a blocked polish (the discard arm is the whole routing — no routing edit was needed)')
  assert.ok(logs.some(l => /phase-close sweep DISCARDED/.test(l) && /submodule-blocked/.test(l)),
    'the discard log names the returned status — the Lead sees WHY before re-dispatching')
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

// t1.8 — PATH CONTRACT (rewritten + retitled — relaxed-assertion lesson: the semantics moved from the
// phase-level catch to the wave-loop-invariant catch inside the thunk). normalizeReportedPaths turns a
// reported ABSOLUTE files_changed path OUTSIDE BOTH the task worktree AND the main checkout (arm d) into
// a throw, caught in the thunk → a per-task held:escalation (a hard halt — the phase does NOT land), the
// path-contract message riding the escalation's `blocked`. Fixture drives the real phase, so deleting the
// normalizeReportedPaths call at the worker-done site turns this GREEN→RED. In-worktree absolute + relative
// paths pass (positive control); a main-checkout-rooted path is NORMALIZED, not escalated (cases below).
test('t1.8 — path contract: an absolute files_changed path outside BOTH roots escalates the task → held:escalation (fixture)', async () => {
  const badImpl = (prompt, opts) => {
    if (seatOf(opts) === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {},
      files_changed: ['/opt/elsewhere/skills/war/assets/workflow-template.js'] }  // absolute, OUTSIDE the worktree AND the main checkout
    return clsImpl()(prompt, opts)
  }
  const { out } = await runPhase(CLS_ARGS(), badImpl)
  assert.equal(out.landDecision, 'held:escalation', 'an out-of-both-roots absolute path escalates the task (does not land)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
  assert.ok(esc, 'the offending task is escalated with reason escalate')
  assert.match(esc.blocked, /path-contract violation/, 'the escalation blocked carries the path-contract violation message')
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

// t1.8 — NORMALIZATION (end state 5). A main-checkout-rooted reported path is a REPORTING artifact (the
// confined war-worker's real main-checkout write is scope-hook-denied), so normalizeReportedPaths arm (c)
// rewrites it worktree-relative and warns — it does NOT escalate. mainCheckout unset ⇒ arm (c) disabled
// (never a guessed root) ⇒ the same path escalates. A path under worktreeRoot but in a SIBLING worktree
// throws (arm b2), never normalized (grill Q7 — normalizing would fabricate a nonsense relative path).
test('t1.8 — path contract normalization: a main-checkout-rooted files_changed path is REWRITTEN worktree-relative on the WorkerResult object + a warning names the task and original path; the phase proceeds', async () => {
  // The mock returns a SHARED object reference so the impl.files_changed reassignment is observable post-run.
  const workerResult = { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {},
    files_changed: ['/abs/repo/skills/war/assets/workflow-template.js', 'agents/war-refiner.md'] } // main-rooted + already-relative
  const impl = (prompt, opts) => seatOf(opts) === 'war-worker' ? workerResult : clsImpl()(prompt, opts)
  const { out, logs } = await runPhase(CLS_ARGS(), impl)
  assert.notEqual(out.landDecision, 'held:escalation', 'a main-rooted report is normalized, not escalated')
  assert.notEqual(out.landDecision, 'held:workflow-error', 'a main-rooted report does not fail loud')
  assert.deepEqual(workerResult.files_changed, ['skills/war/assets/workflow-template.js', 'agents/war-refiner.md'],
    'the reassignment rewrote the main-checkout-rooted path worktree-relative; the already-relative path is untouched')
  assert.ok(logs.some(l => l.includes('/abs/repo/skills/war/assets/workflow-template.js') && /normalized/i.test(l) && l.includes('t1')),
    'a warning log names the task id and the original main-rooted path')
})

test('t1.8 — path contract normalization: mainCheckout UNSET ⇒ a main-checkout-rooted path is NOT normalized — it escalates (arm c disabled, never a guessed root)', async () => {
  const impl = (prompt, opts) => seatOf(opts) === 'war-worker'
    ? { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {}, files_changed: ['/abs/repo/skills/war/assets/workflow-template.js'] }
    : clsImpl()(prompt, opts)
  const { out } = await runPhase(CLS_ARGS({ mainCheckout: undefined }), impl)
  assert.equal(out.landDecision, 'held:escalation', 'with mainCheckout unset the same path escalates (no normalization attempted)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
  assert.ok(esc && /path-contract violation/.test(esc.blocked), 'the escalation carries the path-contract message')
})

test('t1.8 — path contract normalization: an absolute path under worktreeRoot but in a SIBLING worktree THROWS → escalates, never normalizes (grill Q7)', async () => {
  const impl = (prompt, opts) => seatOf(opts) === 'war-worker'
    ? { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {}, files_changed: ['/abs/repo/.claude/worktrees/run-cls/p3-sibling/x.js'] }
    : clsImpl()(prompt, opts)
  const { out } = await runPhase(CLS_ARGS(), impl)
  assert.equal(out.landDecision, 'held:escalation', 'a sibling-worktree path escalates (never normalized to a nonsense worktree-relative path)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
  assert.ok(esc && /sibling-worktree checkout/.test(esc.blocked), 'the escalation names the sibling-worktree reason')
})

test('t1.8 — escalate-not-redispatch (end state 4): a worker mis-reporting an out-of-both-roots absolute path with mainCheckout SET escalates in EXACTLY one dispatch (live-mirroring parallel)', async () => {
  // liveParallel mirrors the REAL engine: a rejected thunk becomes null (NOT a propagated rejection).
  // Pre-fix (no thunk-wide catch) the normalizeReportedPaths throw nulls the thunk → results.filter(Boolean)
  // drops it → done.add never runs → nextWave() re-dispatches t1 EVERY wave iteration (the one-dispatch
  // clause is RED). fakeParallel's Promise.all would instead propagate + abort (one dispatch, vacuously
  // green) and mask the pre-fix re-dispatch — hence liveParallel here.
  const liveParallel = async (thunks) => Promise.all(thunks.map(t => t().catch(() => null)))
  const calls = []
  const fn = build()
  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts })
    return seatOf(opts) === 'war-worker'
      ? { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {}, files_changed: ['/opt/elsewhere/x.js'] } // outside BOTH roots; mainCheckout SET (/abs/repo)
      : clsImpl()(prompt, opts)
  }
  const out = await fn(agent, liveParallel, async () => [], () => {}, () => {}, CLS_ARGS(), { total: null })
  // 1. exactly ONE work dispatch (pre-fix the dropped thunk re-dispatches every wave iteration)
  assert.equal(calls.filter(c => (c.opts.label || '') === 'work:t1').length, 1, 'the task is dispatched to a worker EXACTLY once (no wave re-dispatch)')
  // 2. escalated entry reason 'escalate' with the path-contract message verbatim in blocked
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
  assert.ok(esc, 'the task escalates with reason escalate')
  assert.match(esc.blocked, /worker path-contract violation: reported file "\/opt\/elsewhere\/x\.js" is an absolute path outside the task worktree/, 'the path-contract message rides blocked verbatim')
  // 3. held:escalation
  assert.equal(out.landDecision, 'held:escalation', 'landDecision is held:escalation (escalate is HARD)')
  // 4. no unrunnable-deps anywhere (the dropped-thunk mislabel is gone)
  assert.ok(!(out.escalated || []).some(e => e && e.reason === 'unrunnable-deps'), 'no unrunnable-deps in escalated (the task was collected, not dropped)')
  assert.ok(!(out.auditLog || []).some(e => e && e.verdict === 'unrunnable-deps'), 'no unrunnable-deps in auditLog')
})

test('t1.8 — path contract: the retired path-contract assert token appears NOWHERE in the template source (renamed to normalizeReportedPaths)', () => {
  assert.ok(!src.includes('assertReportedPathsInWorktree'), 'assertReportedPathsInWorktree is fully retired from workflow-template.js (deleted-fabrication-literal precedent)')
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

// #740 — the UNCONDITIONAL phase-field entry class: ph.title / ph.workingBranch / ph.integrationBranch
// are interpolated fallback-free through the `pt` tag in the Provision-barrier / merge / land prompts
// REGARDLESS of whether tasks carry explicit paths, so a launch omitting any dies at ENTRY
// (held:workflow-error) — not opaquely deep inside prompt construction. The `(or supply explicit
// branch/worktree per task)` suffix is a LIE for this class (an explicit path cannot supply a missing
// ph.title) and must be ABSENT. EXPLICIT_TASK carries branch+worktree so the derivation class is silent.
const EXPLICIT_TASK = [{ id: 'tX', issue: 1, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }],
  branch: 'war/x/p1-tX', worktree: '/abs/repo/.claude/worktrees/run-x/p1-tX' }]
for (const field of ['title', 'workingBranch', 'integrationBranch']) {
  test(`run-lifecycle §1 entry validation (#740): explicit paths but phase.${field} absent → held:workflow-error names the phase-field class, NO derivation suffix; zero agents`, async () => {
    const phase = { id: 1, title: 'P1', workingBranch: 'dev/x', integrationBranch: 'integration/x/phase-1' }
    delete phase[field]
    const args = { phase, plan: { file: 'x', gate: 'true' }, planSlug: 'x', runId: 'r', worktreeRoot: '/abs',
      tasks: EXPLICIT_TASK, learningsTarget: null }
    const { out, agentCalls } = await runCounting(args)
    assert.equal(out.landDecision, 'held:workflow-error')
    assert.match(out.workflowError.message, /requires phase \{ title, workingBranch, integrationBranch \} — missing:/, 'names the phase-field class in the trio style')
    assert.match(out.workflowError.message, new RegExp(`missing: \\[[^\\]]*\\b${field}\\b`), `the missing list names ${field}`)
    assert.ok(!/or supply explicit branch\/worktree per task/.test(out.workflowError.message), 'the derivation suffix is NOT appended for the pure phase-field class (it would be a lie)')
    assert.ok(!/requires top-level/.test(out.workflowError.message), 'the trio class is NOT reported (paths are explicit)')
    assert.equal(agentCalls, 0, 'zero agents dispatched on the phase-field entry throw')
  })
}

test('run-lifecycle §1 entry validation (#740): phase nullish → one error naming ALL three phase fields; zero agents', async () => {
  const args = { phase: null, plan: { file: 'x', gate: 'true' }, planSlug: 'x', runId: 'r', worktreeRoot: '/abs',
    tasks: EXPLICIT_TASK, learningsTarget: null }
  const { out, agentCalls } = await runCounting(args)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.match(out.workflowError.message, /requires phase \{ title, workingBranch, integrationBranch \} — missing: \[title, workingBranch, integrationBranch\]/, 'all three phase fields named when phase is nullish (guarded access, no TypeError)')
  assert.ok(!/or supply explicit branch\/worktree per task/.test(out.workflowError.message), 'no derivation suffix on the pure phase-field class')
  assert.equal(agentCalls, 0)
})

test('run-lifecycle §1 entry validation (#740, criterion 2): trio absent AND phase.workingBranch absent → ONE aggregated message naming both classes WITH the derivation suffix', async () => {
  const args = { phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1' }, // workingBranch OMITTED; id+title+integration present
    plan: { file: 'x', gate: 'true' }, tasks: NEEDS_DERIVATION_TASK, learningsTarget: null } // trio OMITTED → derivation-needing
  const { out, agentCalls } = await runCounting(args)
  assert.equal(out.landDecision, 'held:workflow-error')
  assert.equal(out.workflowError.message,
    'workflow-template: requires top-level { planSlug, runId, worktreeRoot } — missing: [planSlug, runId, worktreeRoot]; workflow-template: requires phase { title, workingBranch, integrationBranch } — missing: [workingBranch] (or supply explicit branch/worktree per task)',
    'the two classes aggregate into a single throw; the suffix rides the present derivation-class problem')
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

// §3 no-evidence family (rewritten + retitled — relaxed-assertion lesson). The provision-run
// evidence-gate throw fires INSIDE the work thunk (provisionStep is the leading call), so the
// wave-loop-invariant catch converts it to a per-task held:escalation carrying the evidence-gate
// message verbatim in `blocked` — instead of the old harness-only held:workflow-error. Still NO
// fabricated env-block, and the worker is still never spawned (the throw precedes its dispatch).
for (const [name, bad] of [
  ['no result (null)', null],
  ['refusal prose (ok:false, no failedCommand)', { ok: false, stderrTail: 'I will not run this' }],
  ['foreign failedCommand (not a dispatched step)', { ok: false, failedCommand: 'rm -rf /', exitCode: 1, stderrTail: 'x' }],
  ['incoherent exitCode:0 with a matching failedCommand', { ok: false, failedCommand: PROVISION_LIST[0], exitCode: 0, stderrTail: 'x' }],
  ['non-numeric exitCode', { ok: false, failedCommand: PROVISION_LIST[0], exitCode: 'boom', stderrTail: 'x' }],
]) {
  test(`run-lifecycle §3 evidence gate: ${name} → held:escalation naming the task + provision-run in the escalation blocked (no fabricated env-block, no worker)`, async () => {
    const impl = (p, o) => isProvisionRun({ opts: o }) ? bad : defaultImpl(p, o)
    const { out, calls } = await runPhase(SINGLE_PROV(), impl)
    assert.equal(out.landDecision, 'held:escalation', `${name} escalates (escalate is a HARD reason), never a fabricated env-block`)
    const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
    assert.ok(esc, `${name}: the task escalates with reason 'escalate'`)
    assert.ok(esc.blocked.includes('t1'), 'the escalation blocked names the task id')
    assert.ok(esc.blocked.includes('provision-run'), 'the escalation blocked names the provision-run label')
    assert.ok(!(out.escalated || []).some(e => e && e.reason === 'env-blocked'), 'no env-blocked escalation is invented')
    assert.ok(!calls.some(isWorker), 'the worker is NOT spawned (the evidence-gate throw precedes the worker dispatch)')
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

test('run-lifecycle §5 both-surfaces drift guard: war-refiner.md names the provision mode, the three labels, the env-outcome fields, and the frontmatter blurb; refiner-recovery.md carries the evicted submodule p<phase>-<task> path (token-anchored, case-tolerant)', () => {
  assert.match(refinerMd, /## provision/i, 'the standing card has a ## provision section')
  // the three dispatch labels wherever the dispatched prompts name them
  assert.match(refinerMd, /provision:phase-<id>/i, 'names the git-topology barrier label')
  assert.match(refinerMd, /provision-run:<taskId>/i, 'names the per-task provision-run label')
  assert.match(refinerMd, /polish-worktree:/i, 'names the polish-worktree label')
  // env-outcome return + fields
  assert.match(refinerMd, /env-outcome/i, 'names the env-outcome return')
  for (const f of ['failedCommand', 'exitCode', 'stderrTail']) assert.match(refinerMd, new RegExp(f, 'i'), `names the env-outcome field ${f}`)
  assert.match(refinerMd, /never\b[\s\S]{0,16}(out-of-mode|decline)/i, 'states a provision dispatch is never declined')
  // submodule worktree add path mirrors the template derivation shape — read relocated to
  // references/refiner-recovery.md (Task 4.1 evicted the submodule-as-repo provisioning recipe there)
  assert.match(refinerRecoveryMd, /p<phase>-<taskId>/i, 'the submodule step-4 worktree path carries the p<phase>-<taskId> shape (refiner-recovery.md, evicted from the card)')
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
  assert.match(schemasMd, /entry validation/i, 'schemas.md notes the entry validation naming the missing keys + phase.id (legacy anchor)')
  // Widened (#740): a proximity-window anchor scoped to the Entry validation (H) blockquote proves the
  // unconditional phase-field class is documented THERE, not merely present somewhere in the file
  // (structure-test-check-f-locks-presence-anywhere-not-intended-location).
  assert.match(schemasMd, /Entry validation \(H\)[\s\S]{0,600}\btitle\b[\s\S]{0,60}workingBranch[\s\S]{0,60}integrationBranch/,
    'the Entry validation (H) blockquote documents the unconditional phase-field class (title, workingBranch, integrationBranch) within a bounded window of the heading token')
})

// ---------------------------------------------------------------------------
// Task 1.2 (#637) — reland-loop transient-vs-divergence discrimination, both surfaces.
// On the FINAL failed CAS attempt the land prompt runs `git rev-list --left-right --count
// <merge-sha>...origin/<working>` (the merge sha it tried to push vs. the freshly-fetched origin
// tip, NEVER the lagging local follower): a right count of 0 (contender-less transient) buys
// exactly ONE extra push-first attempt beyond roundLimit; a nonzero right count (real contender
// commits) is land_stale immediately. The discrimination is emitted in ALL THREE land prompts (in-flow,
// baseline-proceed re-land, environment-proceed re-land) via the shared relandDiscrimination helper, and
// grep-parallel with the standing copy in references/refiner-recovery.md (evicted from war-refiner.md
// §land-phase by Task 4.1; the card's land step 3 is a trigger pointer).
// The three plain-text anchors below appear VERBATIM in all four surfaces (mirror-drift guard, spec
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

test('Task 1.2 — BOTH recovery re-land prompts carry the identical discrimination (all three JS land surfaces)', async () => {
  // A land gate failure classified 'baseline'/'environment' dispatches its bounded recovery re-land; each
  // prompt must carry the same discrimination — the mirror-drift hazard is intra-file too (three land prompts).
  const cases = [
    ['baseline-proceed', /^land:phase-3:baseline-proceed$/, clsImpl({ landResult: () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_pre_existing'], gate_base_sha: 'wbase77' }) })],
    ['environment-proceed', /^land:phase-3:environment-proceed$/, clsImpl({ landResult: envLandResult })],
  ]
  for (const [name, label, impl] of cases) {
    const { calls } = await runPhase(CLS_ARGS(), impl)
    const rp = calls.find(c => label.test(c.opts.label || ''))
    assert.ok(rp, `a ${name} re-land is dispatched`)
    const p = rp.prompt
    assert.ok(p.includes(RELAND_DISC_CMD), `${name} re-land prompt runs the rev-list discrimination`)
    assert.ok(p.includes('dev/cls'), `${name}: the discrimination names origin/<workingBranch> (interpolated)`)
    assert.ok(p.includes(RELAND_DISC_BUDGET), `${name} re-land prompt states the identical explicit-+1 budget`)
    assert.ok(p.includes(RELAND_DISC_DIVERGE), `${name} re-land prompt names the nonzero-right-count divergence branch`)
    assert.match(p, /return \{ mode: 'land-phase', status: 'land_stale' \} immediately/, `${name} re-land: nonzero right count → land_stale immediately`)
  }
})

test('Task 1.2 — grep parity: the standing discrimination copy (references/refiner-recovery.md, evicted from war-refiner.md §land-phase by Task 4.1) carries the byte-identical strings the JS prompts emit', () => {
  // Standing-vs-dispatched coverage split: the same three plain-text anchors the land prompts emit
  // must appear VERBATIM in the standing copy so the surfaces cannot drift (spec §8, grill Q5/Q11).
  // Presence keys relocated with the moved text (adjudication E): the standing copy now lives in
  // references/refiner-recovery.md; the card's land step 3 is a trigger pointer to it.
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_CMD), 'refiner-recovery.md § reland discrimination runs rev-list --left-right --count <merge-sha>...origin/')
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_BUDGET), 'refiner-recovery.md states the identical explicit-+1 budget sentence')
  assert.ok(refinerRecoveryMd.includes(RELAND_DISC_DIVERGE), 'refiner-recovery.md names the nonzero-right-count divergence branch')
  // the discrimination must appear for BOTH the superproject land and the submodule-2A land variant.
  assert.ok((refinerRecoveryMd.match(/git rev-list --left-right --count <merge-sha>\.\.\.origin\//g) || []).length >= 2,
    'the discrimination command is present in BOTH the superproject and submodule-2A land variants')
  // never anchored on the lagging local follower.
  assert.match(refinerRecoveryMd, /NEVER the local follower/, 'refiner-recovery.md pins the discrimination to origin, never the lagging local follower')
  // the card still ROUTES to the standing copy: all four markdown trigger pointers (submodule
  // provisioning, land step 3, 2A/2B land arms, and the #1913 pin-transfer arms) must survive, each in the ratified
  // plugin-root-anchored family shape — a ](${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>)
  // target resolving against the plugin install root regardless of the dispatched seat's cwd
  // (ADR 0047, agent-card-pointer-skeleton-plugin-root-anchored; adjudication O(1) still
  // stands: a pointer is best-effort enrichment, decisive rules stay inline). Count-pinned:
  // presence-only would stay green if two pointers were dropped, orphaning their evicted sections.
  assert.equal((refinerMd.match(/\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/refiner-recovery\.md\)/g) || []).length, 4, 'all four plugin-root-anchored trigger pointers to refiner-recovery.md survive')
  assert.match(refinerRecoveryMd, /## Pin-transfer arms/, 'the evicted pin-transfer arms section landed at the destination')
  assert.ok(!/\((?:\.\.\/)+[^)]*refiner-recovery\.md\)/.test(refinerMd), 'no pointer uses a forbidden ../-prefixed path, at any depth')
  // Fourth, plain-text pointer — the fixed-shape ADR 0042 trigger line left by the
  // references-pointer-integrity Task 1.2 (h2) budget eviction of the § Base re-run +
  // re-attach recipe. Pinned together with the moved fragment at the destination, so neither
  // half can be dropped without orphaning the other (the dispatched merge/land prompts still
  // carry the re-attach procedure — asserted by the #598 prompt tests above).
  assert.ok(refinerMd.includes('read ${CLAUDE_PLUGIN_ROOT}/skills/war/references/refiner-recovery.md (§ Base re-run + re-attach)'),
    'the ADR 0042 trigger pointer for the evicted Base re-run + re-attach recipe survives on the card')
  assert.ok(refinerRecoveryMd.includes('RE-ATTACH `_refinery` to the integration branch before you return'),
    'refiner-recovery.md carries the evicted Base re-run + re-attach recipe (byte-identical move)')
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

test("#805 (D2) — a pin-mismatched ABSORB finding is STRIPPED of routing metadata: NO ace dispatch, the demoted finding keeps pinMismatch/originalSeverity but drops disposition/autoFixable; a matching-pin control DOES ace", async () => {
  // A work-wave correctness seat APPROVES with a Minor absorb finding (autoFixable + ace-eligible file) but
  // reviewed a DIFFERENT tree (audit_sha ≠ the worker pin 'deadbeef'). auditRound demotes it to a Nit AND strips
  // disposition+autoFixable ⇒ it falls to the Nit default disposition (note), never enters aceable ⇒ no ace worker.
  const absorbImpl = (auditSha) => (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') {
      if (prompt.includes('execution-evidence') || (opts.label || '').includes('execution-evidence')) {
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
      }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', confidence: 'high', audit_sha: auditSha,
        findings: [{ severity: 'Minor', title: 'absorb me', file: 'a.js', rationale: 'mechanical', disposition: 'absorb', autoFixable: true }] }
    }
    if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const ACE_ONE = () => PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] }], run: { ace: true } })

  // MISMATCH: audit_sha 'cafe1234' ≠ pin 'deadbeef' ⇒ demoted + stripped ⇒ never aceable.
  const { out: mm, calls: mmCalls } = await runPhase(ACE_ONE(), absorbImpl('cafe1234'))
  assert.ok(!mmCalls.some(c => /^ace:/.test(c.opts.label || '')),
    'a pin-mismatched absorb finding is stripped of its disposition ⇒ NO ace worker is dispatched')
  const demotedEntry = (mm.auditLog || []).find(e => e && e.task === 't1' && (e.findings || []).some(f => f.title === 'absorb me'))
  assert.ok(demotedEntry, 'the demoted finding is recorded in auditLog')
  const demoted = demotedEntry.findings.find(f => f.title === 'absorb me')
  assert.equal(demoted.pinMismatch, true, 'the demoted finding is tagged pinMismatch')
  assert.equal(demoted.originalSeverity, 'Minor', 'the original severity is preserved (nothing silently lost, ADR 0013)')
  assert.equal(demoted.severity, 'Nit', 'the finding is demoted to a non-blocking Nit')
  assert.ok(!('disposition' in demoted), 'the absorb disposition is STRIPPED (cannot route to ace)')
  assert.ok(!('autoFixable' in demoted), 'the legacy autoFixable is STRIPPED (cannot read back as absorb via the dispositionOf legacy path)')

  // CONTROL (delete-and-trace): the BYTE-SAME fixture with a MATCHING audit_sha ⇒ no demotion ⇒ the absorb
  // finding stays absorb ⇒ an ace worker IS dispatched. Proves the no-ace assertion above is load-bearing.
  const { calls: ctlCalls } = await runPhase(ACE_ONE(), absorbImpl('deadbeef'))
  assert.ok(ctlCalls.some(c => /^ace:/.test(c.opts.label || '')),
    'a matching-pin absorb finding is NOT demoted ⇒ it rides --ace (an ace worker IS dispatched)')
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
// gate_log_path AND integratedTipGate carries its own gate_log_path (#818) so both artifact-path threadings
// are observable.
const evidenceImpl = (prompt, opts) => {
  const seat = seatOf(opts), label = opts.label || ''
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return {
    perTask: [
      { taskId: 't1', pin_status: 'CONFIRMED', pin_evidence: 'tip == gate-HEAD', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
      { taskId: 't2', pin_status: 'BENIGN-ADVANCE', pin_evidence: 'intervening: docs/readme.md', observedHead: 'aaaa1111', guard_specificity: 'covered', guard_evidence: '' },
    ],
    integratedTipGate: { gate_output: 'INTEGRATED TIP GATE: all suites passed', tip_sha: 'aaaa1111', gate_log_path: '/abs/repo/.claude/worktrees/run-2026/_refinery/.war/gate-phase-3.log' },
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
  assert.ok(!refinerMd.includes('curate or excerpt'), 'the anti-excerpt prose is gone from war-refiner.md (the final merge step)')
  // UNION scan (adjudication I): Task 4.1 evicted card blocks into references/refiner-recovery.md —
  // the OLD-absent key scans the eviction destination too, never a relocated read.
  assert.ok(!refinerRecoveryMd.includes('curate or excerpt'), 'the anti-excerpt prose is absent from refiner-recovery.md (eviction destination)')
  const captureUses = (src.match(/gateCaptureClause\(refineryPath, r\.task\.id\)/g) || []).length
  assert.equal(captureUses, 3, 'the gate-capture clause replaces the anti-excerpt prose at ALL THREE dispatched merge sites (initial + floor-retry + environment-proceed) — the evidence chain must survive a retried merge')
})

// #1151 — the classification-site drift guard: the sibling of captureUses above, and the ARBITER the
// classificationClause header comment delegates its site list to (the #1034 gateCaptureClause treatment).
// The anchor is the bare call-paren, deliberately wider than a first-argument pin: a 4th site passing any
// other base variable still trips it, a line-wrapped argument list still matches (the wrap lands after the
// paren), and the definition cannot match (the source has " = (" between the name and the paren). Because
// it counts occurrences in workflow-template.js, writing the call-paren byte-run into that header comment
// would itself red this guard — the comment is kept count-free by convention; the call-paren byte-run is
// the part the guard mechanically forbids (a prose count or a bare site list re-added there stays green).
test('#1151 — classification-site drift guard: EXACTLY 3 classificationClause call sites in the template', () => {
  const classificationSites = (src.match(/classificationClause\(/g) || []).length
  assert.equal(classificationSites, 3,
    'the gate-failure classification clause is threaded at EXACTLY THREE dispatched sites — the initial merge-task prompt, the floor-retry re-merge prompt, and the land prompt. Adding or removing one is a deliberate RED: update the count AND this message together, and leave the header comment count-free (it names this guard as the arbiter of the site list).')
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
  // The (wtprov) suffix satisfies the #1413 own-token provenance floor; the substring asserts below still match.
  const adj = [{ adjudicated: '0.14.18', supersedes: '0.14.14' }, 'a bare preformatted adjudication row (wtprov)']
  const { calls } = await runPhase(PROVISION_ARGS({ adjudications: adj }), defaultImpl)
  const wa = calls.find(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(wa, 'a work-wave audit seat was dispatched')
  // emitted auditPrompt surface — mid-sentence anchors (no quote bytes)
  assert.ok(wa.prompt.includes('task instruction > red-team adjudication > plan body literal'),
    'the threaded auditPrompt carries the version-precedence ordering (mid-sentence anchor)')
  assert.ok(wa.prompt.includes('a value matching the adjudication is correct even when it differs from the plan body literal'),
    'the threaded auditPrompt carries the adjudication-wins clause (mid-sentence anchor)')
  // adjudication-match rule (Task 1.1) — two new mid-sentence anchors on the same threaded auditPrompt
  assert.ok(wa.prompt.includes('a confirmation note, never an escalation'),
    'the threaded auditPrompt carries the adjudication-match confirmation-note clause (mid-sentence anchor)')
  assert.ok(wa.prompt.includes('not re-litigable this run'),
    'the threaded auditPrompt carries the adjudication-match not-re-litigable clause (mid-sentence anchor)')
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
  // adjudication-match rule (Task 1.1) — the same two mid-sentence anchors on the standing card
  assert.ok(auditorMd.includes('a confirmation note, never an escalation'),
    'war-auditor.md carries the byte-identical adjudication-match confirmation-note clause')
  assert.ok(auditorMd.includes('not re-litigable this run'),
    'war-auditor.md carries the byte-identical adjudication-match not-re-litigable clause')
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
  const { calls: threaded } = await runPhase(PROVISION_ARGS({ adjudications: ['x (wtprov)'] }), defaultImpl)
  assert.ok(seatP(threaded).includes('VERSION-PRECEDENCE RULE'),
    'threading a non-empty adjudications array DOES emit the clause (delete-and-trace)')
})

// Task 1.1 (b) — the adjudication clause ALSO rides the gate-audit-family seats (three new emission
// sites). Exercised via the cheapest existing harness idiom: the end-state-only seat (empty per-task
// merge set from a requiresTest:false task + non-empty phase.endState). A threaded run carries the
// clause on that seat; an unthreaded run carries none of the new anchors.
test('Task 1.1 — a threaded gate-audit-family prompt carries the adjudication clause (end-state-only seat); unthreaded carries none', async () => {
  const esSeatP = (calls) => (calls.find(c => (c.opts.label || '') === 'gate-audit:phase-3:end-state') || {}).prompt
  const docsTask = [{ id: 't1', issue: 101, title: 'Docs task', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], requiresTest: false }]
  const { calls: threaded } = await runPhase(ES_ARGS({ tasks: docsTask, adjudications: ['a bare gate-time scope row (wtprov)'] }), gateAuditImpl)
  const pt = esSeatP(threaded)
  assert.ok(pt, 'the end-state-only gate-audit seat was dispatched (threaded run)')
  assert.ok(pt.includes('task instruction > red-team adjudication > plan body literal'),
    'the threaded gate-audit seat carries the version-precedence anchor')
  assert.ok(pt.includes('a confirmation note, never an escalation'),
    'the threaded gate-audit seat carries the adjudication-match anchor')
  assert.ok(pt.includes('a bare gate-time scope row'),
    'the threaded gate-audit seat renders the adjudicated row')
  const { calls: unthreaded } = await runPhase(ES_ARGS({ tasks: docsTask }), gateAuditImpl)
  const pu = esSeatP(unthreaded)
  assert.ok(pu, 'the end-state-only gate-audit seat was dispatched (unthreaded run)')
  assert.ok(!pu.includes('VERSION-PRECEDENCE RULE') && !pu.includes('ADJUDICATION-MATCH RULE'),
    'an unthreaded gate-audit seat carries none of the new adjudication anchors (back-compat)')
})

// Task 1.1 (e) — scoped single-producer absence test (End state 7, ADR 0025; widened two → three
// by ask-disposition Task 1.1, ADR 0013 amendment 2026-08-25). Scope ONLY the two
// surfaces present at this task's tip: the workflow-template.js adjudications header comment block and
// the war-auditor.md version-precedence bullet. Every sentence naming "red-team report" MUST also carry
// a second-producer fragment (a `skills/war/SKILL.md` reference and/or an `and/or` conjunction) AND the
// third-producer fragment (the Checkpoint ask rulings). Matcher
// discipline (the obvious `only`/`sole` spelling is PROVABLY VACUOUS — neither surface ever carried such
// a token, so an only-matcher passes on the very single-producer text it must reject): key on a
// red-team-report sentence MISSING its second/third-producer clause. Red-first proof: temp-reverting the
// header-comment rewrite drops `skills/war/SKILL.md` from that sentence → this test goes RED.
test('Task 1.1 (e) — no surviving single- or two-producer phrasing on the two Task 1.1 surfaces (scoped, red-team-report sentences name the second AND third producers)', () => {
  const between = (text, startTok, endTok) => {
    const s = text.indexOf(startTok)
    assert.ok(s !== -1, `scope start "${startTok}" is locatable`)
    const e = text.indexOf(endTok, s + startTok.length)
    assert.ok(e > s, `scope end "${endTok}" is locatable after the start`)
    return text.slice(s, e)
  }
  // Normalize a block to plain sentences: drop `//` comment markers, flatten newlines, split on `. `.
  // No period inside `docs/red-team/<plan-slug>.md)`, `skills/war/SKILL.md,` or `args.adjudications` is
  // followed by whitespace, so none of them splits mid-sentence.
  const sentences = (block) => block.replace(/\/\//g, ' ').replace(/\s+/g, ' ').split(/\.\s+/)
  const secondProducer = (s) => /skills\/war\/SKILL\.md/.test(s) || /and\/or/.test(s)
  const thirdProducer = (s) => /Checkpoint ask ruling/i.test(s)
  const surfaces = [
    ['workflow-template.js adjudications header', between(src, 'Adjudications (Task 1.5', '\nconst adjudications =')],
    ['war-auditor.md version-precedence bullet', between(auditorMd, '**Version-precedence rule:**', '**Adjudication-match rule:**')],
  ]
  for (const [name, block] of surfaces) {
    const hits = sentences(block).filter(s => /red-team report/i.test(s))
    // Non-vacuity guard: each scoped surface DOES name the red-team report (else the loop below is empty
    // and the test passes for the wrong reason — the negative-reference discipline, ADR 0025).
    assert.ok(hits.length >= 1, `${name}: at least one sentence names the red-team report (non-vacuity guard)`)
    for (const s of hits) {
      assert.ok(secondProducer(s),
        `${name}: a red-team-report sentence must also name the second producer (skills/war/SKILL.md and/or an and/or conjunction) — surviving single-producer phrasing: "${s.trim()}"`)
      assert.ok(thirdProducer(s),
        `${name}: a red-team-report sentence must also name the third producer (the Checkpoint ask rulings, #1550) — surviving two-producer phrasing: "${s.trim()}"`)
    }
  }
  // Producer-count comment lock-step (PIN-8's OLD-absent law: the retired literal was verified
  // present at this task's base a60221a; the widened literal is presence-pinned beside it).
  assert.ok(!src.includes('TWO producers feed this arg, never one'),
    'the retired two-producer count literal ("TWO producers feed this arg, never one") must be absent from workflow-template.js (OLD-absent)')
  assert.ok(src.includes('THREE producers feed this arg, never one or two'),
    'the widened producer-count literal ("THREE producers feed this arg, never one or two") is present (NEW-present, lock-step with the OLD-absent half)')
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

test('#818 — the INTEGRATED-TIP GATE-AUDIT seat threads integratedTipGate.gate_log_path with the captured-artifact-authoritative clause (modeled on the per-task seat)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), evidenceImpl)   // intra-dep (t2 deps t1) ⇒ the authoritative seat fires
  const auth = calls.find(c => isAuditor(c) && /:integrated-tip$/.test(c.opts.label || ''))
  assert.ok(auth, 'the authoritative integrated-tip seat was dispatched')
  assert.ok(auth.prompt.includes('GATE LOG ARTIFACT:'), 'the authoritative seat carries a GATE LOG ARTIFACT clause')
  assert.ok(auth.prompt.includes('/_refinery/.war/gate-phase-3.log'), 'the threaded path is integratedTipGate.gate_log_path')
  assert.ok(/authoritative execution evidence/i.test(auth.prompt), 'the captured integrated-tip log is the authoritative HARD-path evidence')
  assert.ok(/MISSING artifact[\s\S]*SOFT cannot-confirm/.test(auth.prompt), 'a missing artifact ⇒ SOFT cannot-confirm for the HARD path')
  assert.ok(!auth.prompt.includes('curate or excerpt'), 'the new clause does not reintroduce the retired anti-excerpt token (locked negative, all-surfaces)')
  // EVIDENCE_RESULT.integratedTipGate declares gate_log_path (one-line match, distinct from the MERGE_RESULT one)
  assert.match(src, /integratedTipGate: \{ type: 'object', properties: \{[^\n]*gate_log_path: \{ type: 'string' \}/,
    'EVIDENCE_RESULT.integratedTipGate declares gate_log_path')
})

test('#818 — fail-open: an integratedTipGate WITHOUT gate_log_path ⇒ the authoritative seat renders the SOFT missing-artifact fallback and the phase still LANDS', async () => {
  // Same intra-dep phase, but the evidence dispatch returns integratedTipGate with gate_output + tip_sha only.
  const noPathImpl = (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && /^evidence:/.test(label)) return {
      perTask: [ { taskId: 't1', pin_status: 'CONFIRMED', observedHead: 'aaaa1111', guard_specificity: 'covered' },
                 { taskId: 't2', pin_status: 'CONFIRMED', observedHead: 'aaaa1111', guard_specificity: 'covered' } ],
      integratedTipGate: { gate_output: 'INTEGRATED TIP GATE: all suites passed', tip_sha: 'aaaa1111' } }  // NO gate_log_path
    return evidenceImpl(prompt, opts)
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), noPathImpl)
  const auth = calls.find(c => isAuditor(c) && /:integrated-tip$/.test(c.opts.label || ''))
  assert.ok(auth, 'the authoritative seat still fires (integratedTipGate.gate_output present)')
  assert.ok(auth.prompt.includes('(no gate-log artifact path recorded)'), 'an absent gate_log_path renders the fail-open placeholder, not "undefined"')
  assert.ok(!auth.prompt.includes('undefined'), 'the fail-open authoritative prompt never contains the literal "undefined"')
  assert.ok(/MISSING artifact[\s\S]*SOFT cannot-confirm/.test(auth.prompt), 'the missing-artifact ⇒ SOFT rule is present even with no path')
  assert.equal(out.landDecision, 'landed', 'fail-open: no integrated-tip artifact ⇒ no hold, the phase lands')
})

test('#818 both-surfaces — war-refiner.md intra-phase-dep paragraph names gate_log_path in its integratedTipGate literal; the return-shape line stays field-free', () => {
  assert.match(refinerMd, /integratedTipGate:\s*\{ gate_output, tip_sha, gate_log_path \}/,
    "war-refiner.md's intra-phase-dep paragraph widened its integratedTipGate literal to the three-field shape (both-surfaces, same commit)")
  assert.ok(refinerMd.includes('integratedTipGate? }'),
    'the Return shape line keeps the bare integratedTipGate? (does not enumerate the object fields — verified byte-unchanged)')
})

test('#815 — durable source-count: workflow-template.js has EXACTLY 2 "cwd stays the task worktree" (merge-task sites) and EXACTLY 1 "cwd stays the _refinery land worktree" (land site) — the three near-identical clauses can never silently re-converge', () => {
  const taskWt = (src.match(/cwd stays the task worktree/g) || []).length
  const landWt = (src.match(/cwd stays the _refinery land worktree/g) || []).length
  assert.equal(taskWt, 2, 'exactly two merge-task gate clauses keep "cwd stays the task worktree" (initial merge + floor-retry re-merge)')
  assert.equal(landWt, 1, 'exactly one land gate clause reads "cwd stays the _refinery land worktree" (the land step-2 site names its TRUE cwd) — a one-time grep cannot guard the three clauses staying distinct')
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

// #806 — the evidence-dispatch preMergeTip is the task's TRUE immediate predecessor tip in serial merge
// order (the stamped lastLandedTip), NOT the previous LIST entry's gateHeadSha (which over-counts across a
// requiresTest:false skip and can carry a sentinel). Reads the evItems lines the evidence dispatch renders.
const evPromptOf = (calls) => (calls.find(c => seatOf(c.opts) === 'war-refiner' && /^evidence:phase-/.test(c.opts.label || '')) || {}).prompt || ''
const evLineOf = (evPrompt, taskId) => evPrompt.split('\n').find(l => new RegExp(`- ${taskId} · gateHeadSha=`).test(l)) || ''
const preMergeTipOf = (evPrompt, taskId) => { const m = evLineOf(evPrompt, taskId).match(/ · preMergeTip=(.*)$/); return m ? m[1] : null }
const gateHeadShaOf = (evPrompt, taskId) => { const m = evLineOf(evPrompt, taskId).match(/gateHeadSha=(.*) · preMergeTip=/); return m ? m[1] : null }
// Three dep-free tasks (one wave, serial merge order t1→t2→t3). `shas` maps merge label → integration_sha
// (absent ⇒ omitted from the MergeResult, forcing the sentinel gateHeadSha). requiresTest:false lives on
// the TASK (set via THREE), not the refiner mock.
const skewImpl = (shas) => (prompt, o) => {
  const seat = seatOf(o), label = o.label || ''
  if (seat === 'war-refiner' && o.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker') return { task_id: 't', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
  if (seat === 'war-refiner' && /^evidence:/.test(label)) return { perTask: [] }   // fail-open: no stamped tokens
  if (seat === 'war-refiner' && o.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
  if (seat === 'war-refiner') {
    const m = /^merge:(t\d)/.exec(label)
    const sha = m ? shas[m[1]] : undefined
    return { mode: 'merge-task', status: 'merged', gate_output: 'ok', ...(sha !== undefined ? { integration_sha: sha } : {}) }
  }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}
const THREE = (noTest = new Set()) => PROVISION_ARGS({ tasks: [
  { id: 't1', issue: 101, title: 'T1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
  { id: 't2', issue: 102, title: 'T2', planSlice: 's2', roster: [{ lens: 'correctness' }], ...(noTest.has('t2') ? { requiresTest: false } : {}) },
  { id: 't3', issue: 103, title: 'T3', planSlice: 's3', roster: [{ lens: 'correctness' }] },
] })

test("#806 — a requiresTest:false interleave: successor C's preMergeTip is B's integration sha (its TRUE predecessor tip), NOT A's gateHeadSha (the previous LIST entry)", async () => {
  // t1(gated)→t2(requiresTest:false)→t3(gated). t2 lands (updates the tracker) but is skipped from the
  // gate-audit list, so t3 is the SECOND list entry. Old code chained mergedTasks[0].gateHeadSha = t1's sha.
  const { calls } = await runPhase(THREE(new Set(['t2'])), skewImpl({ t1: 'aaaa1111', t2: 'bbbb2222', t3: 'cccc3333' }))
  const ev = evPromptOf(calls)
  assert.ok(ev, 'the evidence dispatch fired')
  assert.equal(preMergeTipOf(ev, 't3'), 'bbbb2222', "C's preMergeTip is B's (the requiresTest:false task's) integration sha — its true immediate predecessor tip")
  assert.notEqual(preMergeTipOf(ev, 't3'), 'aaaa1111', "NOT A's gateHeadSha (the previous LIST entry) — the over-count is fixed")
  assert.match(preMergeTipOf(ev, 't1'), /merge-base/, "the FIRST landed task falls back to the phaseBaseCmd merge-base substitution")
})

test("#806 — a sentinel integration_sha leaves the tracker at the last REAL sha: successor's preMergeTip is that real sha, never the '(integration_sha …)' sentinel", async () => {
  // t1(real)→t2(gated, NO integration_sha ⇒ sentinel gateHeadSha)→t3(real). The tracker skips the sentinel.
  const { calls } = await runPhase(THREE(new Set()), skewImpl({ t1: 'aaaa1111', t3: 'cccc3333' }))  // t2 omitted ⇒ sentinel
  const ev = evPromptOf(calls)
  assert.match(gateHeadShaOf(ev, 't2'), /integration_sha/, 'sanity: t2 has the sentinel gateHeadSha (no real integration_sha returned)')
  assert.equal(preMergeTipOf(ev, 't3'), 'aaaa1111', "C's preMergeTip is the last REAL sha (t1's), retained across the sentinel")
  assert.ok(!/integration_sha/.test(preMergeTipOf(ev, 't3')), "C's preMergeTip is NEVER the sentinel string (which would poison its diff range into a guaranteed exit-2 ERROR)")
})

test('#806 — no-skip control: all gated, all real shas ⇒ the chain is byte-identical to today (first=phaseBaseCmd, each successor=predecessor gateHeadSha)', async () => {
  const { calls } = await runPhase(THREE(new Set()), skewImpl({ t1: 'aaaa1111', t2: 'bbbb2222', t3: 'cccc3333' }))
  const ev = evPromptOf(calls)
  assert.match(preMergeTipOf(ev, 't1'), /merge-base/, 'first entry = the phaseBaseCmd merge-base substitution (unchanged)')
  assert.equal(preMergeTipOf(ev, 't2'), gateHeadShaOf(ev, 't1'), "t2's preMergeTip = t1's gateHeadSha (predecessor chain, unchanged)")
  assert.equal(preMergeTipOf(ev, 't3'), gateHeadShaOf(ev, 't2'), "t3's preMergeTip = t2's gateHeadSha (predecessor chain, unchanged)")
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
// Task 1.2 (war-room-config-expansion) — tier-aware worker dispatch + task.files plumbing
// ---------------------------------------------------------------------------
// First-pass workers dispatch on the docs tier for an all-*.md task (task.files = the plan Files:
// list, NOT the worker's diff); fix-round and --ace dispatch on the fix tier when configured, else
// the base worker. End-to-end (captures the real spawn opts at each dispatch label) so the predicate
// AND the wiring are exercised together — a reverted tier arg fails these.
// ---------------------------------------------------------------------------

// Run a single-task happy-path phase and return the first-pass worker's captured spawn opts.
// files === undefined ⇒ NO files field on the task (the absent-list fail-safe case).
// Threads an EXPLICIT agents config with distinct base/docs models (opus/sonnet) so the tier
// predicate stays observable by model — the DEFAULTS tiers are both opus, which would make the
// docs-vs-base distinction vacuous here (the D2 registry row pins the defaults mirror itself).
const firstPassWorkOpts = async (files) => {
  const task = { id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }],
    ...(files !== undefined ? { files } : {}) }
  const agents = { worker: { model: 'opus', docs: { model: 'sonnet', effort: 'default' } } }
  const { calls } = await runPhase(PROVISION_ARGS({ tasks: [task], agents }), defaultImpl)
  return (calls.find(c => c.opts.label === 'work:t1') || {}).opts || {}
}

test('Task 1.2 — docs tier: an all-*.md task dispatches its first-pass worker on the docs tier (sonnet); a non-*.md entry or an absent/empty files list stays base (opus, the fail-safe)', async () => {
  const allMd = await firstPassWorkOpts(['docs/a.md', 'skills/war/SKILL.md'])
  assert.equal(allMd.model, 'sonnet', 'all-*.md task → docs tier model (the configured agents.worker.docs)')
  assert.equal(allMd.effort, undefined, "docs effort is 'default' ⇒ omitted from spawn opts")

  const mixed = await firstPassWorkOpts(['docs/a.md', 'skills/war/assets/x.js'])
  assert.equal(mixed.model, 'opus', 'a single non-*.md entry keeps the base worker tier (opus)')

  const absent = await firstPassWorkOpts(undefined)   // task carries NO files field
  assert.equal(absent.model, 'opus', 'ABSENT files list ⇒ base worker tier (fail-safe: an undefined list never vacuously reads as all-*.md)')

  const empty = await firstPassWorkOpts([])
  assert.equal(empty.model, 'opus', 'EMPTY files list ⇒ base worker tier (fail-safe)')
})

// Drive a Major → fix-round → approve+absorb-nit → --ace → clean re-audit flow so BOTH the fix-round
// worker (fix:t1:r1) and the --ace worker (ace:t1:r2) dispatch in one phase. Returns captured opts.
const runFixAndAce = async (agentsCfg) => {
  const blockingMajor = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes', confidence: 'high',
    findings: [{ severity: 'Major', title: 'fix me', file: 'a.js', rationale: 'because' }] }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [blockingMajor, approveWith('audit:t1:correctness', [nit()]), approveWith('audit:t1:correctness', [])] },
    aceBase([]))
  const args = PROVISION_ARGS({
    tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }],   // no files ⇒ base first-pass
    run: { ace: true },
    agents: agentsCfg,
  })
  const { calls } = await runPhase(args, impl)
  const optsOf = (label) => (calls.find(c => c.opts.label === label) || {}).opts || {}
  return { work: optsOf('work:t1'), fix: optsOf('fix:t1:r1'), ace: optsOf('ace:t1:r2') }
}

test('Task 1.2 — fix tier set: the fix-round AND the --ace worker both dispatch on agents.worker.fix (and the base first-pass differs)', async () => {
  const { work, fix, ace } = await runFixAndAce({ worker: { model: 'sonnet', fix: { model: 'opus', effort: 'high' } } })
  assert.equal(work.model, 'sonnet', 'the base first-pass worker uses agents.worker (sonnet) — NOT the fix tier')
  assert.deepEqual({ model: fix.model, effort: fix.effort }, { model: 'opus', effort: 'high' }, 'the fix-round worker carries agents.worker.fix')
  assert.deepEqual({ model: ace.model, effort: ace.effort }, { model: 'opus', effort: 'high' }, 'the --ace worker carries agents.worker.fix')
})

test('Task 1.2 — fix tier absent: the fix-round AND the --ace worker both inherit the base worker (no fix block)', async () => {
  const { fix, ace } = await runFixAndAce({ worker: { model: 'sonnet' } })
  assert.equal(fix.model, 'sonnet', 'fix absent ⇒ the fix-round worker inherits the base worker model')
  assert.equal(fix.effort, undefined, 'base worker has no configured effort ⇒ omitted (inherit session)')
  assert.equal(ace.model, 'sonnet', 'fix absent ⇒ the --ace worker inherits the base worker model')
  assert.equal(ace.effort, undefined, 'base worker has no configured effort ⇒ omitted (inherit session)')
})

// #817 — the add-test/package-it floor-retry dispatch is now tier-aware (spawnWorker('fix')), uniform with
// the fix:/ace: fix-follow-up classes. Drive a no-test → add-test fix → re-audit(approve) → re-merge(merged)
// chain and capture the add-test worker's spawn opts, with and without an agents.worker.fix override.
const runFloorRetry = async (agentsCfg) => {
  let mergeCount = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }                                                   // first attempt trips the floor
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }    // re-merge after the add-test fix
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's', roster: [{ lens: 'correctness' }] }], agents: agentsCfg })
  const { calls } = await runPhase(args, impl)
  return (calls.find(c => /^add-test:t1/.test(c.opts.label || '')) || {}).opts || {}
}

test('#817 — floor-retry fix tier set: the add-test dispatch carries agents.worker.fix { model, effort } (spawnWorker(\'fix\'), not the base worker)', async () => {
  const opts = await runFloorRetry({ worker: { model: 'sonnet', fix: { model: 'opus', effort: 'high' } } })
  assert.deepEqual({ model: opts.model, effort: opts.effort }, { model: 'opus', effort: 'high' },
    'the add-test floor-retry worker dispatches on the configured fix tier — revert spawnWorker(\'fix\') → base and this fails')
})

test('#817 — floor-retry fix tier absent: the add-test dispatch inherits the base worker (no fix block ⇒ byte-identical to today)', async () => {
  const opts = await runFloorRetry({ worker: { model: 'sonnet' } })
  assert.equal(opts.model, 'sonnet', 'fix absent ⇒ the add-test worker inherits the base worker model (unchanged)')
  assert.equal(opts.effort, undefined, 'base worker has no configured effort ⇒ omitted (inherit session)')
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
// Strip LINE comments ONLY (dropped the block pass, #929): the block-comment strip
// (/\/\*[\s\S]*?\*\//g) mis-reads the resolveGate discovery string's glob literals ('*/…/*' carry /*
// and */) as block-comment delimiters and cascades over the executable land-routing code — deleting
// the very 'held:*' literals scanned here (a 'held:bogus' assigned inside the deleted span would slip
// past the landDecision-known-set membership check with NO red test, #929). 'landed'/'held:*' literals
// live only in executable code, never a block comment, so line-only is sufficient. Parameterized over
// `text` (default: live src) so the End-state-7 subset probe below runs on a mutated copy.
// ponytail: whole-file literal scan is the ceiling; the string-aware scanTemplateLiterals census below
// is the sanctioned upgrade (it recognizes comments only OUTSIDE strings) — this extractor stays the
// narrow landDecision-membership check, bounded by the blockCommentSpans / scanTemplateLiterals censuses.
const extractLandDecisionLiterals = (text = src) => {
  const code = text.replace(/\/\/[^\n]*/g, '')
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
  new Function('agents', inlineHelperBlock.block + '\nreturn { spawn, validateRoster, widenRoster, resolveWidenSource, WORKER_TIER_DEFAULTS, isDocsTask, resolveGate }')(agents)

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
// resolveGate (ADR 0036) case set: null/empty (discovery-only), plain (composes), and a PRE-COMPOSED input
// built from the CANONICAL resolveGate output — so a partial detector-token move (inline copy only) makes the
// inline mirror recompose while canonical returns it unchanged, and the behavioral row diverges (idempotence).
const RESOLVE_GATE_CASES = [
  null,                                                 // null → discovery clause alone
  '',                                                   // empty → discovery clause alone
  `node --test 'skills/**/*.test.mjs'`,                 // plain → composes declared && discovery
  resolveGate(`node --test 'skills/**/*.test.mjs'`),    // pre-composed FROM CANONICAL output → idempotent, unchanged
]

test('D2 mirror registry — every inline sandbox mirror in workflow-template.js equals its canonical export', () => {
  assert.ok(inlineHelperBlock.ok, 'the inline roster-helper mirror block is locatable in src (const ROLE_MODEL .. const defaultRoster)')
  const MIRROR_REGISTRY = [
    { name: 'HARD_ESCALATION_REASONS', mode: 'deepEqual',
      canonical: HARD_ESCALATION_REASONS,
      extractInline: () => parseInlineArray(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/) },
    // SOFT_ENV_REASONS (#1411, Task 2.1(c)(ii)): the soft environment pair (env-blocked, env-died),
    // canonical in land-decision.mjs, hand-mirrored beside the HARD mirror — extended here in the
    // same diff (the shared-enum-widening / #236 census discipline).
    { name: 'SOFT_ENV_REASONS', mode: 'deepEqual',
      canonical: SOFT_ENV_REASONS,
      extractInline: () => parseInlineArray(/const\s+SOFT_ENV_REASONS\s*=\s*(\[[^\]]+\])/) },
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
    // Worker sub-tier defaults (Task 1.2): the inline WORKER_TIER_DEFAULTS mirror bound to the canonical
    // DEFAULTS.agents.worker sub-tiers — value equality, never a restated literal. docs is the only
    // defaulted tier (fix has no default block: absent ⇒ inherit the base worker, nothing to mirror).
    { name: 'WORKER_TIER_DEFAULTS (inline ↔ DEFAULTS.agents.worker sub-tiers)', mode: 'behavioral',
      cases: [['docs']],
      inline: ([tier]) => inlineHelpers().WORKER_TIER_DEFAULTS[tier],
      canonical: ([tier]) => DEFAULTS.agents.worker[tier] },
    // resolveGate (ADR 0036): the engine's inline gate-composition mirror bound to the canonical war-config.mjs
    // resolveGate. Behavioral equality over null/empty, plain, and PRE-COMPOSED (built from canonical output),
    // so a partial detector-token move breaks idempotence and reds this row. Delete the inline resolveGate OR
    // its composition line and this row (and the enumerated exactly-once prompt asserts below) fail.
    { name: 'resolveGate (inline gate-composition ↔ canonical war-config.mjs, idempotent)', mode: 'behavioral',
      cases: RESOLVE_GATE_CASES.map(g => [g]),
      inline: ([g]) => inlineHelpers().resolveGate(g),
      canonical: ([g]) => resolveGate(g) },
  ]
  assert.ok(MIRROR_REGISTRY.length >= 9, 'the mirror registry lists at least the nine required rows (HARD_ESCALATION_REASONS, SOFT_ENV_REASONS, landDecision, the four roster helpers, the worker-tier-defaults row, and the resolveGate gate-composition row)')
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
// #929 — block-comment census (protects the MIRROR_REGISTRY's extractLandDecisionLiterals + the two
// narrowed source-text sites above). The three sites strip LINE comments ONLY. blockCommentSpans
// DELIBERATELY reproduces the naive two-step idiom's SUBJECT — the spans a block strip would delete —
// via matchAll (enumerating, not stripping): line-strip THEN the block-comment regex. A string-aware
// scan (scanTemplateLiterals below) sees ZERO of these fake spans, because the '/* */' sequences are
// inside the resolveGate discovery string's glob literals ('*/node_modules/*' etc.). Asserting the
// ORDERED EXACT list of spans as {head, tail} substring pairs (spans 0/1 are byte-identical, so ordered
// not counted-by-head) bounds the blindness both ways: a new block comment OR a new '/*'-bearing string
// literal ADDS a span (red), a removed/merged one drops it (red). Naive-strip string-blindness INSIDE the
// census is itself bounded by this exact equality — corruption either leaves the list identical (harmless)
// or changes it (loud red), never silently wrong. blockCommentSpans + scanTemplateLiterals are the ONLY
// sanctioned text-preparation idioms for future structural tests over workflow-template.js.
const blockCommentSpans = (text = src) =>
  [...text.replace(/\/\/[^\n]*/g, '').matchAll(/\/\*[\s\S]*?\*\//g)].map(m => m[0])
// The pre-#929 corrupt idiom, retained in ONE named place as the census's negative reference: the
// End-state 2/7 both-ways probes run it to PROVE it loses tokens the narrowed line-only prep keeps.
// NEVER used by a real structural assert (the three sites above are line-only). It is the block-STRIP
// form; the enumerating census (blockCommentSpans, above) uses the matchAll form.
const naiveTwoStepStrip = (text) => text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
// Re-derived at THIS dispatch base (the live naive idiom yields exactly three spans: two byte-identical
// 18-byte fake spans from the discovery glob literals + one giant span ending at the file's only real
// block comment, /* the batch ace commit */). {head, tail} substring pairs, ORDERED. A fourth
// find-exclusion glob would re-shuffle the pairing → red → conscious re-derivation.
const EXPECTED_BLOCK_SPANS = [
  { head: "/*' -not -path '*/", tail: "/*' -not -path '*/" },
  { head: "/*' -not -path '*/", tail: "/*' -not -path '*/" },
  { head: "/*' | sort);", tail: "/* the batch ace commit */" },
]

test('#929 block-comment census — the naive block-strip idiom yields exactly the enumerated ordered spans (live source)', () => {
  const spans = blockCommentSpans()
  assert.equal(spans.length, EXPECTED_BLOCK_SPANS.length,
    `the naive block-strip must yield exactly ${EXPECTED_BLOCK_SPANS.length} spans — got ${spans.length}. A NEW block comment or /*-bearing string literal ADDS a span; a removed/merged one drops it. BEFORE updating this expectation, re-check the narrowed strip sites' token sets (a new true block comment can now false-pass Task-4's positive asserts or false-fail Part-B's negative setup-scout assert).`)
  EXPECTED_BLOCK_SPANS.forEach((exp, i) => {
    assert.ok(spans[i].startsWith(exp.head) && spans[i].endsWith(exp.tail),
      `block span ${i} must be head=${JSON.stringify(exp.head)} … tail=${JSON.stringify(exp.tail)}; got head=${JSON.stringify(spans[i].slice(0, 24))} … tail=${JSON.stringify(spans[i].slice(-40))}`)
  })
})

test('#929 block-comment census — RED both ways: a new /* */ comment, a new /*-bearing string literal, and a removed span each change the ordered span list', () => {
  const live = blockCommentSpans(src).length
  assert.equal(live, 3, 'baseline sanity: three live spans')
  // (add) a genuine block comment → one more span
  assert.equal(blockCommentSpans(src + '\n/* injected census fixture */\n').length, live + 1,
    'adding a real block comment is a red test (one more span)')
  // (add) a /*-bearing STRING LITERAL — the naive idiom (which the census reproduces) counts it, string-blind
  assert.equal(blockCommentSpans(src + "\nconst censusDecoy = '/* not a comment */'\n").length, live + 1,
    'adding a /*-bearing string literal is a red test (the naive idiom is string-blind — that is the census subject)')
  // (remove) the file's only real block comment → the giant span loses its terminator → one fewer span
  assert.equal(blockCommentSpans(src.replace('/* the batch ace commit */', '// ace commit')).length, live - 1,
    'removing/merging a span is a red test (the delete direction) — its own fixture')
})

test('#929 false-fail mode dead — the narrowed line-only prep KEEPS a token the old two-step strip provably LOSES (End-state 2)', () => {
  // A token sandwiched between a '*/…/*'-style glob literal and a later real block comment — exactly the
  // #929 shape. The naive strip mis-reads the glob's /* … */ as a comment and swallows the token.
  const fixture = "keep '*/node_modules/*' LOSTTOKEN_929 '*/.git/*' keep /* real block */ keep"
  assert.ok(fixture.replace(/\/\/[^\n]*/g, '').includes('LOSTTOKEN_929'),
    'the narrowed line-only preparation KEEPS the token (prose/executable tokens survive)')
  assert.ok(!naiveTwoStepStrip(fixture).includes('LOSTTOKEN_929'),
    'the same fixture through the OLD two-step strip provably LOSES the token (the glob-literal /* … */ swallows it) — the #929 false-fail defect')
  // Coupling to the census: the token sits inside a naive block-comment span the census enumerates.
  assert.ok(blockCommentSpans(fixture).some(s => s.includes('LOSTTOKEN_929')),
    'the lost token is inside a blockCommentSpans-enumerated fake span (the census bounds exactly this blindness)')
})

test('#929 subset-row blindness closed — extractLandDecisionLiterals surfaces a held:bogus assigned inside the deleted span under line-only prep, and NOTHING under the old two-step prep (End-state 7)', () => {
  // Inject a landDecision = 'held:bogus' immediately before the ace marker — i.e. INSIDE the giant fake
  // span the naive block strip deletes. Under the narrowed line-only extractor it surfaces (and would then
  // fail the landDecision-known-set membership assert in MIRROR_REGISTRY); under the old prep it vanishes.
  const mutated = src.replace('/* the batch ace commit */', "landDecision = 'held:bogus' /* the batch ace commit */")
  assert.ok(extractLandDecisionLiterals(mutated).includes('held:bogus'),
    'the narrowed line-only extractor surfaces held:bogus (it would fail the known-set membership assert — the guard now fires)')
  const oldLiterals = [...new Set([...naiveTwoStepStrip(mutated).matchAll(/'(landed|held:[a-z0-9-]+)'/g)].map(m => m[1]))]
  assert.ok(!oldLiterals.includes('held:bogus'),
    'the old two-step preparation LOSES held:bogus (assigned inside the deleted 42k span) — the #929 subset-row gap this narrowing closes')
  // The MIRROR_REGISTRY subset row's >= 6 sanity floor and membership semantics are unchanged — only the
  // extractor's text preparation narrowed; the live extractor still returns its 6 real landDecision values.
  assert.ok(extractLandDecisionLiterals(src).length >= 6, 'the live extractor still finds at least the 6 emitted landDecision literals (unchanged semantics)')
})

// ===========================================================================
// GATE COMPOSITION POINT (ADR 0036) — enumerated exactly-once prompt evidence
// ---------------------------------------------------------------------------
// The engine normalizes plan.gate ONCE (`if (plan) plan.gate = resolveGate(plan.gate)`, immediately after
// entry validation), so every one of the SEVENTEEN gate-bearing dispatch sites interpolates the SAME composed
// gate. This enumerates all seventeen captures by label/dispatchKind — the count IS the anti-vacuity floor: a
// site an existing fixture cannot reach is added, never skipped, so deleting the composition line reds every
// arm. Anchors ONLY on the discovery-clause token; no assertion enumerates shell suites or states a count.
const GATE_TOKEN = `-name '*.test.sh'`   // a substring of resolveGate's find clause; absent from every fixed prompt prose
const PLAIN_FIXTURE_GATE = `node --test 'skills/**/*.test.mjs'`
const countOccurrences = (hay, needle) => hay.split(needle).length - 1
const planWith = (gate) => ({ file: 'docs/plans/wtprov-A.md', gate })
// A gate_failure_class:'baseline' first result routes the workflow to the baseline-proceed re-merge / re-land
// dispatch site (clsImpl returns merged/landed for the :baseline-proceed relabel, so the phase proceeds).
const baselineMergeResult = () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED same id — pre-existing' })
const baselineLandResult = () => ({ mode: 'land-phase', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED same id — pre-existing' })
// no-test → add-test → re-audit(approve) → re-merge(merged): reaches the floor-retry re-merge site. Fresh
// closure per run so the FIRST merge of each run trips the floor (requiresTest defaults true — no field needed).
const floorRetryImpl = () => {
  let mergeCount = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'no-test' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
}
// unpackaged → package-it → re-audit(approve) → re-merge(merged): reaches the PACKAGE_IT floor-fix site.
// The packaging twin of floorRetryImpl (requiresPackaging defaults true — no field needed).
const pkgFloorRetryImpl = () => {
  let mergeCount = 0
  return (prompt, opts) => {
    const seat = seatOf(opts), label = opts.label || ''
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return { seat: label, lens: label.includes('execution-evidence') ? 'execution-evidence' : 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') return (++mergeCount === 1)
      ? { mode: 'merge-task', status: 'unpackaged' }
      : { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'deadbeef' }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
}
// request_changes once → FIX_NEEDED fix-worker → re-audit(approve): reaches the FIX_NEEDED site.
// Fresh closure per run so the FIRST audit round of each run blocks.
const fixNeededImpl = () => {
  let auditN = 0
  return (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-auditor') return ++auditN <= 1
      ? { seat: opts.label, lens: 'correctness', verdict: 'request_changes', confidence: 'high',
          findings: [{ severity: 'Major', title: 'fix me', file: 'a.js', rationale: 'because' }] }
      : { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    return defaultImpl(prompt, opts)
  }
}
const SINGLE_TASK = [{ id: 't1', issue: 101, title: 'T', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }]
// Reaches ONE ace bisection subset dispatch (ace:t1:r2): batch ace → culprit regression (names ka) →
// the remainder [kb] re-applies as ONE subset. Fresh closure per run (buildSeqImpl queues pop).
const bisectSubsetImpl = () => buildSeqImpl({
  'audit:t1:correctness': [bApprove([nit({ title: 'ka', file: 'skills/ka.js' }), nit({ title: 'kb', file: 'skills/kb.js' })]),
                           bRegress('skills/ka.js'), bApprove()],
}, aceBase())
// The seventeen gate-bearing dispatch captures, enumerated by label/dispatchKind. Each drives the fixture that
// reaches its site with the given fixture gate and returns the captured prompt.
const GATE_SITE_CAPTURES = [
  { site: 'worker Gate: line (work:<task>)', find: (c) => c.find(isWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'merge:<task> rebase clause', find: (c) => c.find(x => /^merge:t\d+$/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'merge:<task>:floor-retry re-merge clause', find: (c) => c.find(x => /floor-retry/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), floorRetryImpl()) },
  { site: 'merge:<task>:baseline-proceed re-merge clause', find: (c) => c.find(x => /^merge:.*:baseline-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ mergeResult: baselineMergeResult })) },
  { site: 'evidence:phase-<id> intra-dep integrated-tip re-run', find: (c) => c.find(x => /^evidence:phase-/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'polish:phase-<id> keep-green clause', find: (c) => c.find(x => /^polish:phase-/.test(x.opts.label || '')),
    run: (gate) => runPhase(SWEEP_ARGS({ plan: planWith(gate) }), sweepBase([queuedAbsorb()])) },
  { site: 'merge:p<id>-polish re-merge clause', find: (c) => c.find(x => /^merge:p\d+-polish$/.test(x.opts.label || '')),
    run: (gate) => runPhase(SWEEP_ARGS({ plan: planWith(gate) }), sweepBase([queuedAbsorb()])) },
  { site: 'land:phase-<id> merge clause', find: (c) => c.find(x => /^land:phase-\d+$/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate) }), evidenceImpl) },
  { site: 'land:phase-<id>:baseline-proceed re-land clause', find: (c) => c.find(x => /^land:phase-\d+:baseline-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ landResult: baselineLandResult })) },
  // The two bounded environment-proceed recovery dispatches (merge-land-resilience Task 1.1) are equally
  // gate-bearing — each interpolates ${plan.gate} for its must-go-fully-green fresh-env re-run — so they are
  // ADDED here, never skipped (this array's own doctrine).
  { site: 'merge:<task>:environment-proceed re-merge clause', find: (c) => c.find(x => /^merge:.*:environment-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ mergeResult: envMergeResult })) },
  { site: 'land:phase-<id>:environment-proceed re-land clause', find: (c) => c.find(x => /^land:phase-\d+:environment-proceed$/.test(x.opts.label || '')),
    run: (gate) => runPhase(CLS_ARGS({ plan: planWith(gate) }), clsImpl({ landResult: envLandResult })) },
  // The four fix-family prompts (FIX_NEEDED, ADD_TEST, PACKAGE_IT, ace) became gate-bearing when
  // precision-chain Task 1.3 gave each a `Gate: ${plan.gate}` line (prompt truth, D6) — so they are
  // ADDED here, never skipped (this array's own doctrine).
  { site: 'FIX_NEEDED Gate: line (fix:<task>:r<n>)', find: (c) => c.find(x => /^fix:t1:/.test(x.opts.label || '')),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), fixNeededImpl()) },
  { site: 'ADD_TEST Gate: line (add-test:<task>:r<n>)', find: (c) => c.find(isAddTestWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), floorRetryImpl()) },
  { site: 'PACKAGE_IT Gate: line (package-it:<task>:r<n>)', find: (c) => c.find(isPackageItWorker),
    run: (gate) => runPhase(PROVISION_ARGS({ plan: planWith(gate), tasks: SINGLE_TASK }), pkgFloorRetryImpl()) },
  { site: 'ace Gate: line (ace:<task>:r<n>)', find: (c) => c.find(isAce),
    run: (gate) => runPhase(ACE_ARGS({ plan: planWith(gate) }), aceBase()) },
  // The ace bisection SUBSET dispatch (realized-absorb-rate Task 1.1) is the seventeenth gate-bearing
  // site — it interpolates the same plan.gate Gate: line as its fix-family siblings — so it is ADDED
  // here, never skipped (this array's own doctrine). bisectSubsetImpl (below) reaches it.
  { site: 'ace bisection subset Gate: line (ace:<task>:r<n>, n>=2)', find: (c) => c.find(x => /^ace:t1:r2$/.test(x.opts.label || '')),
    run: (gate) => runPhase(ACE_ARGS({ plan: planWith(gate) }), bisectSubsetImpl()) },
  // MAKE_DONE_PASS (precision-chain Task 2.3) is the fifth fix-family prompt and equally gate-bearing —
  // it interpolates the same plan.gate Gate: line as its floor-fix siblings — so it is ADDED here,
  // never skipped (this array's own doctrine). runDoneUnmetLoop is the fixture that reaches it.
  { site: 'MAKE_DONE_PASS Gate: line (make-pass:<task>:r<n>)', find: (c) => c.find(isMakePassWorker),
    run: (gate) => runDoneUnmetLoop({ plan: planWith(gate) }) },
]

test('gate composition point (ADR 0036) — the SEVENTEEN enumerated gate-bearing captures render the discovery token EXACTLY ONCE (plain), idempotently once (pre-composed), and the discovery-only clause (null)', async () => {
  assert.equal(GATE_SITE_CAPTURES.length, 17,
    'exactly seventeen gate-bearing dispatch sites are enumerated (anti-vacuity floor — a site an existing fixture cannot reach is ADDED, never skipped; the four fix-family sites joined via precision-chain Task 1.3, MAKE_DONE_PASS via Task 2.3, the ace bisection subset via realized-absorb-rate Task 1.1)')

  // Arm 1 — plain JS-only fixture gate ⇒ the discovery token appears EXACTLY ONCE per captured prompt.
  for (const cap of GATE_SITE_CAPTURES) {
    const { calls } = await cap.run(PLAIN_FIXTURE_GATE)
    const c = cap.find(calls)
    assert.ok(c, `site "${cap.site}" reached and captured (presence guard — the enumerated count is the floor)`)
    assert.equal(countOccurrences(c.prompt, GATE_TOKEN), 1,
      `site "${cap.site}": plain gate ⇒ the discovery token appears EXACTLY ONCE (delete the composition line ⇒ 0 ⇒ this fails)`)
    assert.ok(c.prompt.includes(PLAIN_FIXTURE_GATE),
      `site "${cap.site}": composition kept the declared base (it composed, did not replace)`)
  }

  // Arm 2 — pre-composed fixture gate ⇒ STILL exactly once (idempotence: no second discovery loop appended).
  const preComposed = resolveGate(PLAIN_FIXTURE_GATE)
  for (const cap of GATE_SITE_CAPTURES) {
    const { calls } = await cap.run(preComposed)
    const c = cap.find(calls)
    assert.ok(c, `site "${cap.site}" reached (pre-composed arm)`)
    assert.equal(countOccurrences(c.prompt, GATE_TOKEN), 1,
      `site "${cap.site}": pre-composed gate ⇒ the discovery token STILL appears exactly once (a second discovery loop would make it twice)`)
  }

  // Arm 3 — null/absent fixture gate ⇒ the discovery-ONLY clause (deliberate change from today's literal `null`).
  const discoveryOnly = resolveGate(null)
  for (const cap of GATE_SITE_CAPTURES) {
    const { calls } = await cap.run(null)
    const c = cap.find(calls)
    assert.ok(c, `site "${cap.site}" reached (null arm)`)
    assert.ok(c.prompt.includes(discoveryOnly),
      `site "${cap.site}": null gate ⇒ the discovery-only clause is rendered (not the literal string "null")`)
    assert.equal(countOccurrences(c.prompt, GATE_TOKEN), 1,
      `site "${cap.site}": null gate ⇒ the discovery token appears exactly once (the discovery-only clause)`)
  }
})

test('gate composition point (ADR 0036) — plan-less / zero-task phase: the GUARDED normalization is a no-op (clean held:nothing-merged, never held:workflow-error)', async () => {
  // `plan` is entry-validated only on a TASKS-BEARING launch (#1430 — this zero-task shape stays a
  // ratified legal launch), so the `if (plan)` guard MUST
  // make an absent plan a NO-OP. An unconditional `plan.gate = resolveGate(plan.gate)` would TypeError here
  // → the catch converts it to held:workflow-error; this arm proves the null-safe-by-mandate boundary
  // (distinct from a null plan.gate, which composes to the discovery-only clause). A plan-less zero-task
  // phase reaches no ${plan.gate} dispatch site.
  const args = {
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/x/phase-3', workingBranch: 'dev/x' },
    planSlug: 'x', runId: 'run-x', worktreeRoot: '/abs/repo/.claude/worktrees',
    tasks: [],   // zero tasks — no gate-bearing dispatch
    // NB: NO `plan` key — an ABSENT plan object (not a null plan.gate).
  }
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:nothing-merged',
    'a plan-less zero-task phase resolves cleanly to held:nothing-merged (the if(plan) guard no-op ran) — an unconditional plan.gate= would TypeError into held:workflow-error')
  assert.ok(!calls.some(c => (c.prompt || '').includes(GATE_TOKEN)),
    'no dispatch carries the discovery token — a plan-less zero-task phase reaches no gate-bearing site')
})

// ===========================================================================
// DONE-WHEN THREADING (precision-chain Task 1.3) — prompt-registry rows
// ---------------------------------------------------------------------------
// task.doneWhen (the plan's per-task `Done when:` acceptance command) rides the seven worker-family
// prompt sites (MAKE_DONE_PASS joined via Task 2.3; the ace bisection subset via realized-absorb-rate
// Task 1.1) as a `Done when:` line beside Gate:. The rows pin
// the two contract halves the plan
// names: (1) any prompt that says keep-the-gate-green carries the gate command (the D6 prompt-truth
// sweep), and (2) the absent ⇒ '' set-minus identity — a doneWhen-less run's prompts are
// byte-identical to a doneWhen-bearing run's prompts minus the single inserted clause (legacy
// byte-identity, End state 9). Fresh task objects per run (dwTask) — never the shared SINGLE_TASK —
// because these tests byte-compare prompts ACROSS runs.
const DW_CMD = 'node --test skills/war/assets/task-one.acceptance.test.mjs'
const dwTask = (over = {}) => ({ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], ...over })
const DONE_WHEN_SITES = [
  { site: 'primary worker dispatch (work:<task>)', find: (c) => c.find(isWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), defaultImpl) },
  { site: 'FIX_NEEDED fix prompt (fix:<task>:r<n>)', find: (c) => c.find(x => /^fix:t1:/.test(x.opts.label || '')),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), fixNeededImpl()) },
  { site: 'ADD_TEST floor-fix prompt (add-test:<task>:r<n>)', find: (c) => c.find(isAddTestWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), floorRetryImpl()) },
  { site: 'PACKAGE_IT floor-fix prompt (package-it:<task>:r<n>)', find: (c) => c.find(isPackageItWorker),
    run: (taskOver) => runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)] }), pkgFloorRetryImpl()) },
  { site: 'ace advisory-polish prompt (ace:<task>:r<n>)', find: (c) => c.find(isAce),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), aceBase()) },
  // The ace bisection SUBSET dispatch (realized-absorb-rate Task 1.1) is the seventh worker-family
  // site — doneWhenClause rides it beside its Gate: line like its siblings — ADDED, never skipped.
  { site: 'ace bisection subset prompt (ace:<task>:r<n>, n>=2)', find: (c) => c.find(x => /^ace:t1:r2$/.test(x.opts.label || '')),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), bisectSubsetImpl()) },
  // MAKE_DONE_PASS (Task 2.3) is the fifth fix-family prompt — doneWhenClause rides it like its
  // siblings, so its row is ADDED, never skipped. (Production only reaches it for a doneWhen-bearing
  // task — the floor never runs otherwise — but the mock drives the doneWhen-less arm too, proving
  // the set-minus identity holds even there.)
  { site: 'MAKE_DONE_PASS floor-fix prompt (make-pass:<task>:r<n>)', find: (c) => c.find(isMakePassWorker),
    run: (taskOver) => runDoneUnmetLoop({ taskOver }) },
  // The ace RE-ENTRY batch dispatch (in-run-finding-resolution Task 1.1) is the eighth
  // worker-family site — doneWhenClause rides it beside its Gate: line — ADDED, never skipped.
  { site: 'ace re-entry batch prompt (ace:<task>:r<n>, fresh re-audit absorb)',
    find: (c) => c.find(x => /^ace:t1:r2$/.test(x.opts.label || '') && (x.prompt || '').includes('ACE RE-ENTRY BATCH')),
    run: (taskOver) => runPhase(ACE_ARGS({ tasks: [dwTask(taskOver)] }), reentryImpl()) },
]

test("Done when threading (Task 1.3) — all eight worker-family sites carry the task's Done when: command beside the Gate: line; the worker card documents the input", async () => {
  assert.equal(DONE_WHEN_SITES.length, 8,
    'exactly eight worker-family Done-when sites are enumerated (anti-vacuity floor — a site is ADDED, never skipped)')
  // Adjacency (D7, #1334-5): the expected bytes are COMPOSED — the engine normalizes plan.gate
  // through resolveGate at entry (ADR 0036), so the prompt's Gate: line carries the resolved gate
  // and the Done when: clause must concatenate DIRECTLY after it (an index-precedence pair stayed
  // green with bytes between the two lines; this includes-check does not).
  const gateThenDoneWhen = 'Gate: ' + resolveGate(PROVISION_ARGS().plan.gate) + `\nDone when: ${DW_CMD}`
  for (const s of DONE_WHEN_SITES) {
    const { calls } = await s.run({ doneWhen: DW_CMD })
    const c = s.find(calls)
    assert.ok(c, `site "${s.site}" reached and captured (presence guard — seven sites is the floor)`)
    assert.ok(c.prompt.includes(`\nDone when: ${DW_CMD}`),
      `site "${s.site}" carries the task's Done when: command VERBATIM on its own line`)
    assert.ok(c.prompt.includes(gateThenDoneWhen),
      `site "${s.site}": the Done when: clause rides directly after the Gate: line`)
  }
  // Prompt-surface split (same task): the standing worker card documents the new input.
  assert.match(workerMd, /`Done when:` acceptance command/,
    'agents/war-worker.md documents the Done when: input (standing surface, same task as the dispatched line)')
})

test("Done when threading — absent ⇒ '' (set-minus): each site's doneWhen-less prompt is byte-identical to the doneWhen-bearing prompt minus the single inserted clause (legacy byte-identity, End state 9)", async () => {
  for (const s of DONE_WHEN_SITES) {
    const withCalls = (await s.run({ doneWhen: DW_CMD })).calls
    const withoutCalls = (await s.run({})).calls
    const wp = s.find(withCalls), wo = s.find(withoutCalls)
    assert.ok(wp && wo, `site "${s.site}" reached in both arms (presence guard)`)
    assert.equal(wp.prompt.replace(`\nDone when: ${DW_CMD}`, ''), wo.prompt,
      `site "${s.site}": set minus the Done when clause is byte-identical to the doneWhen-less prompt (nothing else conditions on the field)`)
    // Residue guard, two COMPLEMENTARY halves (D8 — neither subsumes the other): (1) occurrence-count
    // parity (site-agnostic) — the legacy arm carries exactly one fewer 'Done when:' token than the
    // doneWhen-bearing arm (the inserted clause's own); parity catches an asymmetric or vanished
    // clause. MAKE_DONE_PASS's two fixed-prose mentions appear in BOTH arms, so they cancel; any NEW
    // token appearing in one arm only breaks the parity. (2) line-anchored absolute absence — a
    // line-form '\nDone when:' token hardcoded into fixed prose present in BOTH arms cancels in the
    // parity count, and only the line-anchored !includes below catches that case.
    const count = (s2) => s2.split('Done when:').length - 1
    assert.equal(count(wo.prompt), count(wp.prompt) - 1,
      `site "${s.site}": the legacy path carries no inserted Done when: clause residue (occurrence parity: doneWhen-less = doneWhen-bearing minus the single inserted token)`)
    assert.ok(!wo.prompt.includes('\nDone when:'),
      `site "${s.site}": the doneWhen-less prompt carries NO line-anchored Done when: token at all (absolute absence — the hardcoded-in-both-arms case parity cancels)`)
  }
  // null, absent, and '' are the same legacy arm (the string|null contract): byte-identical
  // prompts. The '' arm pins the guard's TRUTHINESS half — Task 1.1's Decompose parser produces
  // this field, and a bare `Done when:` bullet is the plausible way an empty string arrives.
  // A NON-STRING doneWhen no longer reaches the clause's typeof guard: the entry-validation
  // TASK-FIELD class (D5, engine-reliability — superseding the #1334-1 silent-legacy tolerance for
  // this shape) refuses it at intake naming the task and field, before any dispatch.
  const nullP = DONE_WHEN_SITES[0].find((await DONE_WHEN_SITES[0].run({ doneWhen: null })).calls).prompt
  const absentP = DONE_WHEN_SITES[0].find((await DONE_WHEN_SITES[0].run({})).calls).prompt
  assert.equal(nullP, absentP, 'doneWhen:null and doneWhen-absent dispatch byte-identical worker prompts')
  assert.equal(DONE_WHEN_SITES[0].find((await DONE_WHEN_SITES[0].run({ doneWhen: '' })).calls).prompt, absentP,
    "doneWhen:'' dispatches the byte-identical legacy prompt (the guard's truthiness half)")
  const nonStringRun = await DONE_WHEN_SITES[0].run({ doneWhen: 5 })
  assert.equal(nonStringRun.out.landDecision, 'held:workflow-error',
    'doneWhen:5 (non-string) is refused at entry by the TASK-FIELD class (D5) — never silently coerced to the legacy arm')
  assert.match(nonStringRun.out.workflowError.message, /non-string doneWhen \(number\)/,
    'the refusal names the field and the offending type')
  assert.ok(!DONE_WHEN_SITES[0].find(nonStringRun.calls),
    'zero dispatches reach the worker site on the refused launch (the floor is at entry)')
})

test('prompt truth (D6) — every dispatched prompt that says keep-the-gate-green carries the gate command', async () => {
  // Reach all keep-green prompt classes (the five fix-family prompts — the ace bisection subset rides
  // the ace class — + the phase-close sweep); the sweep filter keys on the literal "keep the gate"
  // fragment, parenthetical-gate form included.
  const runs = [
    await runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), fixNeededImpl()),
    await runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), floorRetryImpl()),
    await runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), pkgFloorRetryImpl()),
    await runDoneUnmetLoop(),
    await runPhase(ACE_ARGS({ tasks: [dwTask()] }), aceBase()),
    await runPhase(ACE_ARGS({ tasks: [dwTask()] }), bisectSubsetImpl()),
    await runPhase(ACE_ARGS({ tasks: [dwTask()] }), reentryImpl()),
    await runPhase(SWEEP_ARGS(), sweepBase([queuedAbsorb()])),
  ]
  const keepGreen = runs.flatMap(r => r.calls).filter(c => /keep the gate\b/i.test(c.prompt || ''))
  for (const cls of [/^fix:/, /^add-test:/, /^package-it:/, /^make-pass:/, /^ace:/, /^polish:/]) {
    assert.ok(keepGreen.some(c => cls.test(c.opts.label || '')),
      `a keep-the-gate-green prompt of class ${cls} was captured (anti-vacuity floor)`)
  }
  for (const c of keepGreen) {
    assert.ok(c.prompt.includes('make gate'),
      `prompt "${c.opts.label}" says keep-the-gate-green AND carries the gate command`)
  }
  // Default-deny census (D6, #1334-4): the sweep above only reaches prompts its fixtures drive, so a
  // keep-green prompt added at a dispatch site no fixture reaches would silently evade it. Count the
  // space-form phrase over the template SOURCE in OCCURRENCE semantics (case-insensitive; the
  // keep-the-gate-green comment mentions are hyphenated and deliberately non-hits). Pin re-measured
  // at task time: 8 (the ace bisection subset prompt joined via realized-absorb-rate Task 1.1; the
  // ace RE-ENTRY batch prompt joined via in-run-finding-resolution Task 1.1 — its fixture rides
  // the sweep above).
  assert.equal((src.match(/keep the gate/gi) || []).length, 8,
    'a new keep-the-gate-green prompt must join the D6 sweep above — the space-form census over the template source moved; re-pin this count ONLY alongside extending the sweep fixtures to reach the new site')
})

// A1 (D9) — the RETIRED plan-slice-criteria framing, asserted absent from the standing worker card
// case-insensitively (the dispatched-prompt half never carried it; the card rewrote it this task).
// The POSITIVE half — both surfaces carry the claimed-End-state-ids redefinition — is the D3
// both-surfaces registry's A1 row below.
const RETIRED_CRITERIA_FRAMING = [/acceptance criteria[\s\S]{0,8}you own/i, /mapped acceptance criteria/i]
// Unwired negative reference (both-ways proof): the pre-change sentences in the card's OWN real bytes,
// indexed to the guard each must trip. FIXTURES — never re-introduced into a live surface.
const RETIRED_CRITERIA_SAMPLES = [
  ['Inputs bullet (pre-change bytes)', 'the **plan file** and the specific build-order step / acceptance criteria *you own*', 0],
  ['Do step 2 (pre-change bytes)', 'Implement the task to satisfy its slice of the plan and its mapped acceptance criteria.', 1],
]

test('A1 (Task 1.3) — the old plan-slice-criteria framing is retired from the worker card, case-insensitively', () => {
  for (const re of RETIRED_CRITERIA_FRAMING) {
    assert.doesNotMatch(workerMd, re,
      `war-worker.md: the retired plan-slice-criteria framing ${re} is absent (A1 — the field is claimed End-state ids now)`)
  }
  for (const [label, sample, i] of RETIRED_CRITERIA_SAMPLES) {
    assert.match(sample, RETIRED_CRITERIA_FRAMING[i],
      `negative reference (${label}): the retired framing DOES match its guard — the doesNotMatch above is non-vacuous`)
  }
})

// ===========================================================================
// DONE-UNMET ROUTE (precision-chain Task 2.3) — the done-when floor, wired
// ---------------------------------------------------------------------------
// F2's two-slot precedent: 'done-unmet' joins the MergeResult status enum AND FLOOR_STATUSES (plus both
// HARD_ESCALATION_REASONS mirrors — the D2 registry row and war-config.test.mjs's inline-mirror guard
// arbitrate those appends). The tests here pin the WIRING this task adds: the refiner merge-task dispatch
// runs assert-done-when.sh after the gate (file-threaded --cmd-file, exit 1 ⇒ done-unmet, exit 2 ⇒ error,
// never a collapse), captures assert-test-in-diff.sh exit-0 stdout into MergeResult.mappedTests (D7), a
// floor exit 1 routes the bounded make-this-command-pass sub-loop sharing run.roundLimit (the no-test
// pattern), exhaustion escalates 'done-unmet', and a doneWhen-less legacy task dispatches byte-identical
// floor-less merge prompts (End state 9). done-when-floor-wiring Task 1.1 grew the section: the clause's
// evidence capture (tee target + exit-1 done_when_log_path + the D14 exit-status-preservation shape),
// the MAKE_DONE_PASS evidence-path set-minus pair (D5), the exhaustion-detail carry/omit pair (D6), and
// the baseline-proceed precedence fixture (D7 — a red done-when is never proceeded over as baseline debt).
const DU_CMD = 'node --test skills/war/assets/task-one.acceptance.test.mjs'
const isMakePassWorker = (c) => seatOf(c.opts) === 'war-worker' && /make-pass:/.test(c.opts.label || '')
// done-unmet → make-pass fix → full re-audit(approve) → re-merge. Fresh closure per run (the
// floorRetryImpl pattern): first Refine call returns done-unmet — every call does under alwaysUnmet,
// driving budget exhaustion — otherwise the re-merge returns merged. Also the reachability fixture
// for the MAKE_DONE_PASS rows in GATE_SITE_CAPTURES (via `plan`) and DONE_WHEN_SITES (via `taskOver`)
// — function declaration, hoisted above both registries.
function runDoneUnmetLoop({ alwaysUnmet = false, roundLimit, plan, taskOver = { doneWhen: DU_CMD }, doneWhenLogPath } = {}) {
  let merges = 0
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'abc', tests: {} }
    if (seat === 'war-auditor') return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [], confidence: 'high' }
    if (seat === 'war-refiner' && opts.phase === 'Refine') {
      merges++
      // doneWhenLogPath (Task 1.1): when set, every done-unmet result carries the teed evidence
      // artifact's path — the presence arm of the D5/D6 set-minus pairs; absent ⇒ the field is omitted.
      return (alwaysUnmet || merges === 1)
        ? { mode: 'merge-task', status: 'done-unmet', ...(doneWhenLogPath ? { done_when_log_path: doneWhenLogPath } : {}) }
        : { mode: 'merge-task', status: 'merged' }
    }
    if (seat === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  return runPhase(PROVISION_ARGS({ tasks: [dwTask(taskOver)], ...(plan ? { plan } : {}), ...(roundLimit ? { run: { roundLimit } } : {}) }), impl)
}

test('done-unmet route (Task 2.3) — floor exit 1 routes the bounded make-this-command-pass sub-loop: MAKE_DONE_PASS fix-worker → full re-audit → re-merge → land', async () => {
  const { out, calls } = await runDoneUnmetLoop()
  const mp = calls.find(isMakePassWorker)
  assert.ok(mp, 'a make-pass fix-worker is dispatched on a done-unmet MergeResult (FLOOR_STATUSES gained done-unmet)')
  assert.match(mp.prompt, /MAKE_DONE_PASS/, 'the fix prompt is the MAKE_DONE_PASS class')
  assert.match(mp.prompt, /assert-done-when\.sh/, 'the fix prompt names the floor that tripped')
  assert.ok(mp.prompt.includes(`\nDone when: ${DU_CMD}`), "the fix prompt carries the task's Done when: command (prompt truth, D6)")
  assert.ok(mp.prompt.includes('Gate: make gate'), 'the fix prompt carries the gate command')
  assert.match(mp.prompt, /never weaken, skip, or delete/i, 'the fix prompt forbids weakening a test to force the command green')
  const auditCalls = calls.filter(c => isAuditor(c) && !c.prompt.includes('execution-evidence'))
  assert.ok(auditCalls.length >= 2, `the full audit panel re-spawns after the make-pass fix (got ${auditCalls.length} auditor calls)`)
  assert.ok(out.landed.includes('t1'), 't1 lands after done-unmet fix + re-audit + re-merge')
})

test('done-unmet exhaustion (Task 2.3) — shared run.roundLimit budget spent ⇒ hard escalation {reason:"done-unmet"}, auditLog done-unmet:exhausted, landDecision held:escalation', async () => {
  const { out } = await runDoneUnmetLoop({ alwaysUnmet: true, roundLimit: 1 })
  assert.ok(!out.landed.includes('t1'), 't1 must not land when the done-when floor still trips at budget exhaustion')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'done-unmet')
  assert.ok(esc, 'escalated carries {task:"t1", reason:"done-unmet"} on budget exhaustion')
  const log = (out.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'done-unmet:exhausted')
  assert.ok(log, "auditLog records verdict 'done-unmet:exhausted'")
  assert.equal(out.landDecision, 'held:escalation', 'done-unmet is a HARD escalation reason — the phase holds')
})

// The done-when evidence artifact path a doneWhenLogPath-bearing fixture threads (the presence arm of
// the D5/D6 set-minus pairs below) — shaped like the real _refinery-scoped teed path.
const DU_LOG = '/abs/repo/.claude/worktrees/run-1/_refinery/.war/done-when-t1.log'

test('MAKE_DONE_PASS evidence path (D5, Task 1.1) — the fix prompt names the captured artifact path when the floor result carries done_when_log_path, and is byte-identical when absent (set-minus)', async () => {
  const wp = (await runDoneUnmetLoop({ doneWhenLogPath: DU_LOG })).calls.find(isMakePassWorker)
  const wo = (await runDoneUnmetLoop()).calls.find(isMakePassWorker)
  assert.ok(wp && wo, 'make-pass fix prompts captured in both arms (presence guard)')
  const clause = `\nThe red run's full output is captured at ${DU_LOG}; read it before re-running.`
  assert.ok(wp.prompt.includes(clause),
    'the fix prompt names the captured artifact PATH (not the content — the fix-worker reads the file)')
  assert.equal(wp.prompt.replace(clause, ''), wo.prompt,
    'set minus the evidence clause ⇒ byte-identical to the artifact-less MAKE_DONE_PASS prompt (the doneWhenLogOf normalizer conditions on NOTHING else)')
  assert.ok(!wo.prompt.includes('captured at'),
    'the artifact-less fix prompt carries no evidence-clause residue at all')
})

test("done-unmet exhaustion detail (D6, Task 1.1) — the escalation and auditLog entries carry the LAST floor result's done_when_log_path when present, and are shape-identical when absent", async () => {
  const withLog = (await runDoneUnmetLoop({ alwaysUnmet: true, roundLimit: 1, doneWhenLogPath: DU_LOG })).out
  const esc = (withLog.escalated || []).find(e => e && e.task === 't1' && e.reason === 'done-unmet')
  const log = (withLog.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'done-unmet:exhausted')
  assert.ok(esc && log, 'exhaustion entries present in the artifact-bearing arm (presence guard)')
  assert.equal(esc.done_when_log_path, DU_LOG, "the escalation entry carries the last floor result's done_when_log_path")
  assert.equal(log.done_when_log_path, DU_LOG, "the auditLog entry carries the last floor result's done_when_log_path")
  const without = (await runDoneUnmetLoop({ alwaysUnmet: true, roundLimit: 1 })).out
  const esc2 = (without.escalated || []).find(e => e && e.task === 't1' && e.reason === 'done-unmet')
  const log2 = (without.auditLog || []).find(e => e && e.task === 't1' && e.verdict === 'done-unmet:exhausted')
  assert.ok(esc2 && log2, 'exhaustion entries present in the artifact-less arm (presence guard)')
  // Shape-identical when absent (the exhaustedDiag pattern): the artifact-bearing entry grows ONLY the
  // done_when_log_path key; the artifact-less entry carries NO such key at all.
  assert.deepEqual(Object.keys(esc).filter(k => k !== 'done_when_log_path'), Object.keys(esc2))
  assert.deepEqual(Object.keys(log).filter(k => k !== 'done_when_log_path'), Object.keys(log2))
  assert.ok(!('done_when_log_path' in esc2) && !('done_when_log_path' in log2),
    'absent field ⇒ neither exhaustion entry grows a done_when_log_path key')
})

test('done-when floor threading (Task 2.3) — both loop merge prompts run assert-done-when.sh after the gate: file-threaded --cmd-file under _refinery/.war/, exit 1 ⇒ done-unmet, exit 2 ⇒ error (never a collapse)', async () => {
  const { calls } = await runDoneUnmetLoop()
  const merges = calls.filter(isMergeTask)
  const sites = [
    ['initial merge', merges.find(c => !/floor-retry/.test(c.opts.label || ''))],
    ['floor-retry re-merge', merges.find(c => /floor-retry/.test(c.opts.label || ''))],
  ]
  for (const [name, c] of sites) {
    assert.ok(c, `${name} prompt captured`)
    assert.match(c.prompt, /assert-done-when\.sh/, `${name}: runs the done-when floor`)
    assert.match(c.prompt, /--cmd-file/, `${name}: the command is file-threaded (--cmd-file, never interpolated into another script)`)
    assert.ok(c.prompt.includes('.war/done-when-t1.cmd'), `${name}: the command file lives under _refinery/.war/`)
    assert.ok(c.prompt.includes(DU_CMD), `${name}: carries the task's Done when: command verbatim`)
    // Exit-code asserts run against the EXTRACTED clause, never the whole prompt: the pre-existing
    // test-floor prose also says "exit 2 … status: 'error'", so a whole-prompt match could stay green
    // with the done-when clause's own exit-2 branch deleted (the sibling clause-scoping idiom — cf. the
    // byte-identity test below, which owns this delimiter regex).
    const clause = c.prompt.match(/ After the gate, run the done-when floor:[^]*?make-this-command-pass loop\./)
    assert.ok(clause, `${name}: the done-when floor clause is delimited in the merge prompt`)
    assert.match(clause[0], /exit 1[^]{0,160}status: 'done-unmet'/, `${name}: exit 1 routes the done-unmet status (clause-scoped)`)
    assert.match(clause[0], /exit 2[^]{0,160}status: 'error'/, `${name}: exit 2 routes error (clause-scoped — the test-floor clause's own exit-2 prose cannot satisfy this)`)
    assert.match(clause[0], /never 'done-unmet'/, `${name}: exit 2 never collapses into the floor status (clause-scoped)`)
    // Evidence capture (done-when-floor-wiring Task 1.1): the clause tees the floor run to the .war/
    // evidence artifact, returns its path on the exit-1 branch, and preserves the FLOOR's own exit
    // status across the tee (D14/R2 — a naive `… 2>&1 | tee` reads tee's 0 for a red AND an exit-2
    // floor, so a status-swallowing tee would silently merge a task whose acceptance command failed).
    assert.ok(clause[0].includes('.war/done-when-t1.log'),
      `${name}: the tee target is the _refinery/.war/ done-when evidence artifact (clause-scoped)`)
    assert.match(clause[0], /status: 'done-unmet', done_when_log_path/,
      `${name}: exit 1 returns done_when_log_path alongside status 'done-unmet' (clause-scoped)`)
    assert.ok(/PIPESTATUS/.test(clause[0]) || /> [^\n]*2>&1[^]{0,160}\$\?/.test(clause[0]),
      `${name}: the clause carries the D14 exit-status-preservation shape (redirect-then-read $? or PIPESTATUS[0]) — a status-swallowing tee cannot land silently (R2)`)
    assert.ok(c.prompt.includes('Run the gate'),
      `${name}: the gate instruction anchor is present (D9 — a reword cannot turn the ordering comparison below vacuous via indexOf -1)`)
    assert.ok(c.prompt.indexOf('After the gate') > c.prompt.indexOf(`Run the gate`),
      `${name}: the done-when floor runs AFTER the gate instruction`)
  }
})

test("done-when floor legacy byte-identity (End state 9) — a doneWhen-less task's merge prompt is byte-identical to the doneWhen-bearing prompt minus the single floor clause", async () => {
  const wp = (await runPhase(PROVISION_ARGS({ tasks: [dwTask({ doneWhen: DU_CMD })] }), defaultImpl)).calls.find(isMergeTask).prompt
  const wo = (await runPhase(PROVISION_ARGS({ tasks: [dwTask()] }), defaultImpl)).calls.find(isMergeTask).prompt
  const clause = wp.match(/ After the gate, run the done-when floor:[^]*?make-this-command-pass loop\./)
  assert.ok(clause, 'the done-when floor clause is delimited in the doneWhen-bearing merge prompt')
  assert.equal(wp.replace(clause[0], ''), wo,
    'set minus the floor clause ⇒ byte-identical to the doneWhen-less merge prompt (nothing else conditions on the field)')
  assert.ok(!wo.includes('assert-done-when'), 'the legacy merge prompt carries no done-when floor residue at all')
})

test('done-when floor coverage (Task 2.3) — the floor clause rides all FOUR merge-task dispatch sites (initial, floor-retry, environment-proceed, baseline-proceed)', () => {
  const uses = (src.match(/\+ doneWhenFloorClause\(r\.task, refineryPath\)/g) || []).length
  assert.equal(uses, 4,
    `doneWhenFloorClause must ride every merge-task dispatch (initial + floor-retry + environment-proceed + baseline-proceed); found ${uses} call sites`)
  assert.match(src, /const doneWhenFloorClause = \(task, refineryPath\) =>/,
    'the doneWhenFloorClause helper exists (absent/null/empty doneWhen ⇒ the set-minus empty string)')
})

test("baseline-proceed precedence (D7, #1340 finding 10) — a baseline-classified first merge whose baseline-proceed returns done-unmet escalates HARD with ZERO fix rounds: reason 'done-unmet', no make-pass worker, held:escalation — a red done-when is never proceeded over as baseline debt", async () => {
  const { out, calls } = await runPhase(
    CLS_ARGS({ tasks: [{ id: 't1', issue: 301, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }], doneWhen: DU_CMD }] }),
    (prompt, opts) => /^merge:t1:baseline-proceed$/.test(opts.label || '')
      ? { mode: 'merge-task', status: 'done-unmet' }
      : clsImpl({ mergeResult: () => ({ mode: 'merge-task', status: 'gate_failed', gate_failure_class: 'baseline', gate_failing_ids: ['pytest:test_legacy'], gate_base_sha: 'base9999', gate_output: 'base RED with the same id — pre-existing' }) })(prompt, opts))
  assert.ok(!out.landed.includes('t1'),
    'the task must NOT land when its baseline-proceed returns done-unmet (the floor overrides the carve-out — D7)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'done-unmet')
  assert.ok(esc, "the escalation carries reason: 'done-unmet' (the HARD floor reason — never a waived baseline)")
  assert.ok(!calls.some(isMakePassWorker),
    'NO make-pass fix-worker is dispatched — the FLOOR_STATUSES sub-loop is entered only from the initial merge result, so a proceed-dispatch floor status escalates with zero fix rounds')
  assert.equal(out.landDecision, 'held:escalation',
    "done-unmet is a HARD escalation reason — the phase holds ('held:escalation') rather than landing the task as baseline debt")
})

test('mappedTests capture (D7, Task 2.3) — EVERY dispatched assert-test-in-diff.sh site instructs exit-0 stdout capture into MergeResult.mappedTests; the schema declares the optional field; war-refiner.md step 4 exit-0 bullet mirrors it', () => {
  const sites = [...src.matchAll(FLOOR_SITE_RE)]
  assert.ok(sites.length >= 3, `non-vacuity floor: >= 3 dispatched assert-test-in-diff.sh sites (found ${sites.length})`)
  sites.forEach((m, i) => {
    const arm = m[1]
    const where = `dispatched floor site #${i + 1} of ${sites.length}`
    assert.match(arm, /exit 0[^]{0,220}mappedTests/i, `${where}: the mappedTests capture is scoped to the exit 0 path`)
    assert.match(arm, /stdout[^]{0,160}mappedTests|mappedTests[^]{0,160}stdout/i, `${where}: stdout is the capture source`)
    assert.match(arm, /one per line|ALL matched test paths/i, `${where}: names the one-path-per-line accumulating-scan contract (Task 2.2)`)
  })
  // Schema slot: MERGE_RESULT declares mappedTests, OPTIONAL (fail-open — the gate-audit seat keeps SOFT cannot-confirm when absent).
  const mr = src.match(/const\s+MERGE_RESULT\s*=[^]*?(?=\n\n)/)
  assert.ok(mr, 'MERGE_RESULT literal found')
  assert.match(mr[0], /mappedTests:\s*\{\s*type:\s*'array'\s*\}/, "MERGE_RESULT declares mappedTests: { type: 'array' }")
  assert.ok(!/required:\s*\[[^\]]*mappedTests/.test(mr[0]), 'mappedTests is OPTIONAL — never added to MERGE_RESULT.required')
  // Sibling slot (done-when-floor-wiring, plan item (b)): MERGE_RESULT declares done_when_log_path, OPTIONAL —
  // the schema is the refiner subagent's output contract; an undeclared property is the silent-strip path.
  assert.match(mr[0], /done_when_log_path:\s*\{\s*type:\s*'string'\s*\}/, "MERGE_RESULT declares done_when_log_path: { type: 'string' }")
  assert.ok(!/required:\s*\[[^\]]*done_when_log_path/.test(mr[0]), 'done_when_log_path is OPTIONAL — never added to MERGE_RESULT.required')
  // Standing surface (both-surfaces rule): war-refiner.md step 4's exit-0 bullet carries the same capture.
  const step4 = refinerMd.match(/\*\*Test-floor check\*\*[^]*?(?=\n\d+\. \*\*Packaging-floor check\*\*)/)
  assert.ok(step4, 'war-refiner.md carries the **Test-floor check** step')
  const exit0 = step4[0].match(/\*\*exit 0\*\*[^]*?(?=\n\s*-\s*\*\*exit 1\*\*)/)
  assert.ok(exit0, "war-refiner.md step 4 carries an **exit 0** bullet")
  assert.match(exit0[0], /mappedTests/, "war-refiner.md step 4's exit-0 bullet names the mappedTests capture")
  assert.match(exit0[0], /stdout/i, "war-refiner.md step 4's exit-0 bullet names stdout as the capture source")
})

test('both surfaces (Task 2.3) — war-refiner.md documents the done-when floor step: assert-done-when.sh, --cmd-file threading, done-unmet on exit 1, exit 2 never collapses; the Return enum gains done-unmet + mappedTests', () => {
  const step = refinerMd.match(/\*\*Done-when floor check\*\*[^]*?(?=\n\d+\. )/)
  assert.ok(step, 'war-refiner.md carries a **Done-when floor check** step (numbered-step terminator)')
  assert.match(step[0], /assert-done-when\.sh/, 'the step names the floor script')
  assert.match(step[0], /--cmd-file/, 'the step names the file-threading contract')
  assert.match(step[0], /file-threaded/i, 'the step states the never-interpolated hygiene posture (D11)')
  assert.match(step[0], /timeout/i, 'the step names the timeout arm (a timeout is exit 1, the done-unmet route)')
  const exit1 = step[0].match(/\*\*exit 1\*\*[^]*?(?=\n\s*-\s*\*\*exit 2\*\*)/)
  assert.ok(exit1, 'the step carries an **exit 1** bullet')
  assert.match(exit1[0], /done-unmet/, 'exit 1 returns status done-unmet')
  assert.match(exit1[0], /make this command pass|make-this-command-pass/i, 'exit 1 names the bounded make-this-command-pass sub-loop (the no-test pattern)')
  assert.match(exit1[0], /run\.roundLimit/, 'the sub-loop shares run.roundLimit')
  const exit2 = step[0].match(/\*\*exit 2\*\*[^]*/)
  assert.ok(exit2, 'the step carries an **exit 2** bullet')
  assert.match(exit2[0], /(never|not)[^]{0,80}["'`]?done-unmet/i, 'exit 2 never collapses into the floor status')
  assert.match(refinerMd, /"unpackaged"` \| `"done-unmet"/, 'the Return merge-task status enum lists done-unmet')
  assert.match(refinerMd, /mappedTests\?/, 'the Return field list carries the optional mappedTests')
})

// ===========================================================================
// D3 — BOTH-SURFACES DIRECTIVE REGISTRY (ADR 0025)
// ---------------------------------------------------------------------------
// Each correctness-critical directive duplicated across a standing agents/*.md card and its dispatched
// prompt(s). Token-anchored, case-tolerant — never full-line bytes (the surfaces phrase the shared
// discipline differently). Includes rows asserted against the INLINE gate-audit seat prompts
// (execution-evidence + integrated-tip + end-state) sliced from template src — those sit OUTSIDE
// auditPrompt(), so MOST base auditPrompt clauses never reach them; they inherit those shared
// directives only via the standing card. The exceptions are adjudicationClause (a module-level const
// concatenated onto both auditPrompt AND the three gate-audit-family seats directly) and the
// evidence-precedence skeleton (ADR 0041, inlined at auditPrompt AND all three seats), so those rules
// reach the seats without the card — the rows below still assert the card too.
// ponytail: this registry IS the deliberate ceiling — a new both-surfaces directive lands its row here in
// the same task (the /war-strategy new-mirror authoring rule), never an AST scanner.
const sliceSrc = (startTok, endTok) => {
  const s = src.indexOf(startTok)
  const e = src.indexOf(endTok, s)
  assert.ok(s !== -1 && e > s, `src slice "${startTok}" .. "${endTok}" is locatable`)
  return src.slice(s, e)
}

// #990 — the RETIRED asserting cwd-is-tip premise, as a whole-string (never line-scoped) regex. It fires on
// "<working tree|working directory|cwd> <is|are|reflects> … committed tip" and is EXEMPTED by an immediately
// following negation, so the replacement prose ("is NOT assumed to be the committed tip", with or without
// markdown emphasis around the tokens) passes while any re-assertion reds.
const CWD_IS_TIP_ASSERTING = /(?:working tree|working directory|working dir|cwd)[\s*_`]{0,6}(?:\w+\s+){0,2}(?:is|are|reflects)\b(?![\s*_`]{0,6}not\b)[\s\S]{0,80}?committed tip/i
// Unwired negative reference (both-ways proof): the two premise sentences this task retired, verbatim from
// the pre-change surfaces, plus the "reflects" phrasing a naive "is the committed tip" grep misses. They are
// FIXTURES — never re-introduced into a live surface.
const RETIRED_PREMISE_SAMPLES = [
  ['war-servitor.md', 'at the landed tip (your post-land working tree *is* the committed tip, so this needs no new capability).'],
  ['servitor Wrap-up prompt', 'at the landed tip (your post-land working tree IS the committed tip — no new capability needed).'],
  ['reflects phrasing', 'the servitor runs after the merge, so its working tree already reflects the committed tip'],
  ['line-break-wrapping pairing (why the guard is whole-string, never line-scoped)',
    'your post-land working tree IS\nthe committed tip'],
]

// Task 1.2 (D5, spec §5; #1085/#1124) — the RETIRED branch mischaracterization: "=-attached read flags
// only", a blanket claim its own parenthetical contradicted with five BARE flags. Both mirrors now carry
// the hook's two-arm form instead. Backtick-tolerant because the .md writes `=`-attached (a backtick
// between = and -attached) where the JS prompt writes the plain =-attached — within THIS regex's matched
// span that backtick is the sole difference, so one optional-backtick pattern covers both surfaces.
const BRANCH_READ_FLAGS_ONLY_RETIRED = /=`?-attached read flags only/i
// Unwired negative reference (both-ways proof): the pre-change sentence in each surface's OWN real bytes.
// The full sentences diverge well past that backtick — bold markers, a backticked `branch`, a `git branch`
// prefix inside the first flag, "any write flag" vs "write flag" — so a hand-normalized common form would
// prove nothing about what actually lived on either surface. FIXTURES: never re-introduced into a live
// surface, and the sanctioned deliberate deposit named by End state 5's carve-out for the repo-wide grep.
const BRANCH_READ_FLAGS_ONLY_SAMPLES = [
  ['war-auditor.md bullet (pre-change bytes)',
    '- **`branch` takes `=`-attached read flags only** (`git branch --contains=<rev>`, `--merged=<rev>`, `--points-at=<rev>`, `--list`, `-a`, `-r`, `--show-current`, `-v`); a bare name or any write flag denies.'],
  ['auditPrompt() sentence (pre-change bytes)',
    'branch takes =-attached read flags only (--contains=<rev>, --merged=<rev>, --points-at=<rev>, --list, -a, -r, --show-current, -v); a bare name or write flag denies.'],
]

test('D3 — both-surfaces directive registry: every correctness-critical directive is on its standing card AND its dispatched prompt(s)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // The two bounded environment-proceed recovery prompts are only emitted on an environment-classified
  // gate failure — drive each with its own mock-classified fixture and capture the LIVE prompt text
  // (preferred over slicing src: it asserts what the refiner actually receives).
  const epMergeP = ((await runPhase(CLS_ARGS(), clsImpl({ mergeResult: envMergeResult }))).calls
    .find(c => /:environment-proceed$/.test(c.opts.label || '')) || {}).prompt
  const epLandP = ((await runPhase(CLS_ARGS(), clsImpl({ landResult: envLandResult }))).calls
    .find(c => /^land:phase-\d+:environment-proceed$/.test(c.opts.label || '')) || {}).prompt
  assert.ok(epMergeP && epLandP, 'both environment-proceed recovery prompts dispatched (presence guard)')
  const workerP = (calls.find(isWorker) || {}).prompt
  const auditP = (calls.find(c => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:')) || {}).prompt
  const servitorP = (calls.find(isServitor) || {}).prompt
  // Task 2.3 (done-when floor): the merge-task dispatch carries doneWhenFloorClause only for a
  // doneWhen-bearing task — capture that prompt from its own fixture run.
  const mergeP = ((await runPhase(PROVISION_ARGS({ tasks: [dwTask({ doneWhen: DU_CMD })] }), defaultImpl)).calls
    .find(isMergeTask) || {}).prompt
  assert.ok(workerP && auditP && servitorP && mergeP, 'worker, regular auditor, servitor, and doneWhen-bearing merge-task prompts all dispatched (presence guard)')
  // Task 2.2 (#1431, latitude clause): workerIntentClause renders ONLY on a threaded intent — the
  // registry's default workerP above comes from an intent-LESS fixture where the clause is '' — so
  // the latitude row's worker dispatched surface is captured from a latitude-bearing-intent fixture
  // run (the mergeP/esSeatP dedicated-fixture precedent). The intent body deliberately AVOIDS the
  // arm's own opener phrase ("explicit `Mechanism latitude:` clause"): the embedded intent bytes
  // alone can never green that anchor, so stripping the arm from the prompt literal reds the row
  // (delete-the-feature). The trailing plan token satisfies the #1413 own-token provenance floor.
  const LAT_INTENT = 'Purpose: ship the wtprov contract.\nMechanism latitude: the extraction idiom is implementer choice.\nBinding guardrails: the End states hold as written.\nEnd state: 1. shipped. (plan wtprov-a)'
  const latWorkerP = ((await runPhase(PROVISION_ARGS({ intent: LAT_INTENT }), defaultImpl)).calls
    .find(isWorker) || {}).prompt
  assert.ok(latWorkerP, 'latitude-bearing-intent worker prompt dispatched (presence guard, Task 2.2 row)')
  // Task 3.2 fixtures: a claims-bearing run (widened endState rows) whose merge returns mappedTests —
  // the per-task seat prompt then carries BOTH the shared endStateBlock attestation contract and the
  // mapped-tests grep block; the end-state-only seat (requiresTest:false fixture) carries the shared
  // endStateBlock too. (The integrated-tip seat concatenates the same endStateBlock const —
  // source-count-pinned at three sites by the shared-endStateBlock test.)
  const esMappedImpl = (prompt, opts) => {
    if (seatOf(opts) === 'war-refiner' && opts.phase === 'Refine' && (opts.label || '').startsWith('merge:'))
      return { mode: 'merge-task', status: 'merged', gate_output: 'ok', integration_sha: 'c0ffee1234', mappedTests: ['skills/war/assets/wibble.test.mjs'] }
    return gateAuditImpl(prompt, opts)
  }
  const esRunCalls = (await runPhase(ES_ROW_ARGS(), esMappedImpl)).calls
  const esSeatP = (gateAuditCalls(esRunCalls)[0] || {}).prompt
  // The endstate-check dispatch prompt from the same claims-bearing run — the recovery Blocker-1
  // card-twin row censuses it against war-refiner.md.
  const esCheckP = (esRunCalls.find(isEndstateCheck) || {}).prompt
  const esOnlyP = ((await runPhase(ES_ROW_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'Docs task', planSlice: 's', roster: [{ lens: 'correctness' }], requiresTest: false },
  ] }), gateAuditImpl)).calls.find(x => (x.opts.label || '') === 'gate-audit:phase-3:end-state') || {}).prompt
  assert.ok(esSeatP && esCheckP && esOnlyP, 'claims-bearing per-task + endstate-check + end-state-only prompts dispatched (presence guard, Task 3.2 rows)')
  // The inline gate-audit seat prompts sit OUTSIDE auditPrompt() — slice them from src by construct.
  const gateAuditExecSrc = sliceSrc('POST-MERGE GATE-AUDIT', 'gate-audit:${taskId}:execution-evidence')
  const gateAuditIntegratedTipSrc = sliceSrc('INTEGRATED-TIP GATE-AUDIT', 'gate-audit:phase-${ph.id}:integrated-tip')
  const gateAuditEndStateSrc = sliceSrc('END-STATE-ONLY GATE-AUDIT', 'gate-audit:phase-${ph.id}:end-state')

  // engine-reliability Phase 2 Task 4 (End state 18; red-team round 1 — the standing card half was
  // unguarded): the budget-raise row's trailer-form anchor is EXTRACTED from the floor script's
  // human-readable trailer-form lines — ALL occurrences (the header-comment usage line and the stderr
  // guidance line), collected and asserted byte-identical so neither script copy can silently diverge
  // from the anchor. The property held: a form change that breaks the skeleton fails the extraction
  // assert (or, moving only one copy, the identical-copies assert), and an ADR-number or token change
  // reds whichever prose surface still carries the old form. An EXTENSION that prefix-preserves the
  // skeleton is out of this row's reach — the machine-enforced TRAILER_RE inside the script is a
  // separate literal this row deliberately does not read.
  const budgetFloorSh = readFileSync(join(here, 'assert-budget-raise-cited.sh'), 'utf8')
  const trailerForms = budgetFloorSh.match(/Budget-Raise: ADR-\d+ <surface> \+<bytes>/g) || []
  assert.ok(trailerForms.length >= 2, 'assert-budget-raise-cited.sh carries the human-readable Budget-Raise trailer form in BOTH prose homes (header usage comment + stderr guidance — the budget-raise row extraction sources)')
  assert.strictEqual(new Set(trailerForms).size, 1, 'every human-readable trailer-form occurrence in assert-budget-raise-cited.sh is byte-identical (header-comment vs stderr-guidance drift)')
  const trailerFormRe = new RegExp(trailerForms[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  const REGISTRY = [
    { name: 'servitor memory discipline (mutation-guard + recurrence-flow + absolute files_written)',
      surfaces: [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]],
      anchors: [/metadata\.provenance/i, /user-authored/i, /never edit/i, /same slug/i, /overwrite/i,
                /files_written[\s\S]{0,120}absolute|absolute[\s\S]{0,120}files_written/i] },
    // servitor-redaction-at-source: D3 path-hygiene clause — lesson-content paths are repo-relative or
    // placeholder-based (<repo-root>/<session-worktree>/<local-memory-root>), never an absolute checkout
    // path, with an explicit files_written-stays-absolute carve-out. Both surfaces, one task; the
    // placeholder tokens and "governs lesson content only" fragment appear only in the new clause, so a
    // per-surface revert reds this row (End-state-7 delete-the-feature proof).
    { name: 'servitor path-hygiene (repo-relative / placeholder locate-cues; files_written stays absolute)',
      surfaces: [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]],
      anchors: [/repo-relative/i, /<repo-root>/i, /<session-worktree>/i, /<local-memory-root>/i,
                /never an absolute/i, /governs lesson content only[\s\S]{0,120}files_written/i] },
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
    // Task 1.2 (D5, spec §5): the read-only git guard contract lives in the "## Read-only git guard contract"
    // section of the standing card AND in the auditPrompt()-built dispatched prompt — both must carry it. The
    // anchors are the contract's distinctive fragments: a widened-verb token (/ls-tree/i), the composition-ban
    // tokens (/one bare git/i, /no pipes/i, /Grep tool/i), and — re-anchored by Task 1.2 (D4/D5, #1124) — the
    // two-arm branch characterization the mirrors adopted from the hook's own deny string (/value-carrying/i,
    // /bare read flags/i), which replaced the retired "=-attached read flags only" blanket claim. Reverting
    // either surface's block OR just its branch clause REDs this row (End-state-5 delete-the-feature proof).
    { name: 'read-only git guard contract (D5): one bare git per Bash call, no composition, ls-tree/branch read verbs, two-arm branch flags, Grep tool is the sweep channel',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/one bare git/i, /no pipes/i, /ls-tree/i, /Grep tool/i, /value-carrying/i, /bare read flags/i] },
    // #990 (D3/D4): the four-step landed-tip grounding ladder — the servitor grounds every referent read
    // on the THREADED landed tip, never on its own cwd. Anchor precondition (#990 plan): every token here
    // was verified ABSENT from both surfaces at the pre-change base, so a per-surface revert REDs this row.
    // Deliberately NOT /<session-worktree>/i: that token already lives in the card's D3 path-hygiene text
    // and is anchored by the path-hygiene row above — behind it, a ladder-only revert would stay green.
    { name: 'servitor landed-tip grounding ladder (preflight → gitdir-matched worktree lookup → ref-check dead end → gate-audit fallback)',
      surfaces: [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]],
      anchors: [/gitdir/i, /not assumed/i, /gate-audit fallback/i, /checkout-topology/i] },
    // merge-land-resilience Task 1.1: the bounded environment-proceed contract lives on the refiner's
    // standing card AND in both dispatched recovery prompts. Anchor precondition (red-team): /fresh TMPDIR/i
    // is NOT usable — it already appears at base on BOTH surfaces (the card's classification line, the
    // baseline-proceed prompts), so a revert of the new clause would stay green behind those hits. Every
    // token below was verified ABSENT from war-refiner.md AND workflow-template.js at the pre-change base,
    // so a per-surface revert REDs this row.
    { name: 'bounded environment-proceed recovery (exactly ONE re-run, fresh env, must come back fully green — never a proceed-over)',
      surfaces: [['war-refiner.md', refinerMd],
                 ['environment-proceed re-merge prompt', epMergeP],
                 ['environment-proceed re-land prompt', epLandP]],
      anchors: [/environment-proceed/i, /exactly one re-run/i, /fully green/i, /never a proceed-over/i] },
    // audit-evidence-precedence Task 1.2 (ADR 0041): full four claim-shape ladders on the standing card,
    // identical token skeleton on ALL FOUR dispatched surfaces — auditPrompt() plus the three
    // gate-audit-family seats (per-task (post-merge) / integrated-tip / end-state), which sit outside auditPrompt()
    // and inherit nothing from it. Anchor precondition (measured at the pre-change base): `content-at-pin`,
    // `never the top rung`, and `never evidence` were each verified ABSENT (0 occurrences) on BOTH
    // agents/war-auditor.md and workflow-template.js, so each alone discriminates a one-sided revert.
    // A bare `execution` (6 on the card / 21 in the template at base) or `history` (1 / 1) key is NOT
    // usable — the ordered four-shape chain anchor below pairs each ambiguous name with the base-absent
    // first shape name, so it cannot green on the pre-existing hits and a one-sided edit of any single
    // surface REDs this row. (The rung-body pairing suggested by the plan — e.g. pairing with the
    // gate-artifact rung fragment — is card-only by construction: End state 8(ii) requires the §4.1
    // rung-body tokens to measure 0 on the dispatched prompt surfaces, so a five-surface anchor cannot
    // carry them; the chain pairing is the five-surface-valid substitute — the rung bodies themselves
    // are covered by the card-only assert below the registry loop.)
    { name: 'evidence precedence (ADR 0041): four claim-shape ladders on the card, token skeleton on auditPrompt + all three gate-audit-family seats',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP],
                 ['inline gate-audit execution-evidence seat (src)', gateAuditExecSrc],
                 ['inline gate-audit integrated-tip seat (src)', gateAuditIntegratedTipSrc],
                 ['inline gate-audit end-state seat (src)', gateAuditEndStateSrc]],
      anchors: [/content-at-pin/i, /never the top rung/i, /never evidence/i, /## Evidence precedence/i,
                /content-at-pin[\s\S]{0,200}\bexecution\b[\s\S]{0,200}\bhistory\b[\s\S]{0,200}\bauthority\b/i] },
    // precision-chain Task 1.3 (A1/D9): acceptance_criteria_covered redefined as the task's CLAIMED
    // End-state ids on BOTH worker surfaces — the standing card's Return section and the primary
    // dispatch's ACCEPTANCE_IDS_RULE sentence. Anchor precondition: every phrase token below was absent
    // from both surfaces at the pre-change base EXCEPT /acceptance_criteria_covered/, which the card's
    // Return line has always carried (it discriminates a prompt-side revert only); the three phrase
    // anchors carry the both-ways proof (the old framing spoke of plan-slice acceptance
    // criteria — its OLD-absent guard is the RETIRED_CRITERIA_FRAMING test above). Consumer: Task 3.2's
    // gate-audit cross-check.
    { name: 'A1 acceptance_criteria_covered redefinition (claimed End-state ids; empty when none; gate-audit cross-checks)',
      surfaces: [['war-worker.md', workerMd], ['worker prompt', workerP]],
      anchors: [/acceptance_criteria_covered/, /claimed End-state ids/i, /empty when the task claims none/i, /gate-audit pass cross-checks/i] },
    // precision-chain Task 2.3 (ADR 0025): the done-when floor is duplicated across war-refiner.md step 7
    // and the dispatched merge-task prompts (doneWhenFloorClause) — this row censuses the newest mirror.
    // The dispatched surface here is the initial merge-task prompt; the floor-retry / environment-proceed /
    // baseline-proceed siblings append the SAME clause (source-count-pinned at 4 call sites by the
    // 'done-when floor coverage (Task 2.3)' test). done-when-floor-wiring Task 1.1 (D13) GREW the
    // directive in place — evidence capture (done_when_log_path) + the D7 baseline-proceed precedence —
    // so the EXISTING row's anchor array gains those two tokens (no new row, row-count floor untouched);
    // the precedence token had zero hits on either surface at the pre-change base, so it mechanically
    // pins the D7 sentence and cannot pass on pre-existing baseline-proceed prose (End state 8).
    { name: 'done-when floor (assert-done-when.sh after the gate; --cmd-file file-threading; exit 1 ⇒ done-unmet + done_when_log_path, exit 2 ⇒ error, never a collapse; a red done-when is never baseline debt)',
      surfaces: [['war-refiner.md', refinerMd], ['merge-task dispatch prompt', mergeP]],
      anchors: [/assert-done-when\.sh/i, /--cmd-file/i, /done-unmet/i, /never 'done-unmet'|not[^]{0,40}done-unmet/i,
                /done_when_log_path/i, /never proceeded over as baseline debt/i] },
    // precision-chain Task 3.2 (D8): the artifact-first attestation duty — the standing card's
    // execution-evidence checklist AND the dispatched shared endStateBlock (live prompts: per-task +
    // end-state-only seats; the integrated-tip seat concatenates the same const, source-count-pinned).
    // The artifact-naming anchor is a union — the card writes the placeholder form endstate-<phaseId>-<n>.log,
    // the dispatched prompts the interpolated endstate-3-1.log; every other token appears verbatim on all
    // three surfaces, so a per-surface revert reds this row.
    { name: 'artifact-first End-state attestation (D8, Task 3.2): one endStateAttestations row per claimed condition — status + evidence, never a bare verdict; unattested ⇒ unverified, never met',
      surfaces: [['war-auditor.md', auditorMd],
                 ['per-task gate-audit prompt (claims-bearing)', esSeatP],
                 ['end-state-only seat prompt (claims-bearing)', esOnlyP]],
      anchors: [/endStateAttestations/, /never a bare verdict/i, /met \| unmet \| unverified/,
                /endstate-(?:<phaseId>-<n>|\d+-\d+)\.log/i, /unverified[^.]{0,60}never ['`]?met/i] },
    // precision-chain Task 3.2 (D7): the mechanical mapped-tests grep — the standing card's checklist
    // bullet AND the dispatched mappedTestsLine (rendered only for a mappedTests-bearing merge; the
    // esSeatP fixture threads one). The HARD provably-unrun trigger reads the CAPTURED gate log and —
    // round-3 fix-forward adjudication — fires ONLY where that log ENUMERATES test file paths (the bash
    // half's per-file headers); the node half reports titles + an aggregate summary only, so a zero-hit
    // .mjs grep degrades SOFT cannot-confirm, never a false land-hold (premise pinned live by the
    // reporter-format test above). Every enumeration-conditional anchor below was verified absent from
    // both surfaces at the pre-change base, so a per-surface revert to the unconditional rule reds this row.
    // gate-audit-finding-routing Task 1.1 (D4/D5, #1343-3): the row GREW the three truncation anchors
    // (no new row; the floor-count assertion message below is untouched) — an early-ABORTED bash half
    // (the discovery loop exits on the first red suite) leaves a truncated log, and a mapped path after
    // the abort point is SOFT cannot-confirm, never HARD. All three tokens were zero-hit on both
    // anchored surfaces at this task's base (Context 7), so a per-surface revert of the clause reds this row.
    { name: 'mechanical mapped-tests grep (D7, Task 3.2 + round-3 enumeration-conditional): grep each MergeResult.mappedTests path against the captured gate log — absent/0-count at a confirmed pin is HARD only where the log enumerates test file paths; a non-enumerating half is SOFT cannot-confirm, never a hold',
      surfaces: [['war-auditor.md', auditorMd], ['per-task gate-audit prompt (mappedTests-bearing)', esSeatP]],
      anchors: [/mappedTests/, /grep each/i, /captured gate log/i, /0 executed tests/i, /provably-unrun/i,
                /ONLY when the captured log ENUMERATES test file paths/i, /aggregate summary/i,
                /never per-file paths/i, /non-enumerating/i, /SOFT cannot-confirm, never a hold/i,
                /ABORTED/, /truncated/i, /after the abort point/i] },
    // Task 3.2 recovery Blocker 1 (the Pivotal prompt-surface-split constraint): the endstate-check
    // dispatch flavor lands on the refiner's standing card AND the dispatched prompt — a card that
    // never learned the flavor invites a decline, and the dispatch is fail-open, so a decline is
    // SILENT under-verification (cf. the provision section's never-out-of-mode line, which exists
    // because a refiner declining an unfamiliar dispatch has happened before).
    { name: 'endstate-check dispatch card twin (recovery Blocker 1): file-threaded .cmd execution, load-bearing tip_sha stamp + exit_code line, red-check isolation, fail-open return — standing card + dispatched prompt',
      surfaces: [['war-refiner.md', refinerMd], ['endstate-check dispatch prompt', esCheckP]],
      anchors: [/endstate-check/i, /file-threaded/i, /byte-verbatim/i, /tip_sha/, /exit_code/,
                /load-bearing/i, /never fails this dispatch/i, /red, hung, or timed-out/i, /fail-open/i, /never block/i,
                // Phase 4 Task 4.1 mirrored transport directives (phase-close absorb): the fenced byte
                // transport, the byte-for-byte .cmd verify's loud-failure token, the intake-lint
                // record-only arm, and the whole-command-line end-to-end tee — all four land on the
                // card ("fenced block" / "cmd_bytes_mismatch" / "intake-linted"+"`intake_lint`" /
                // "runs end-to-end") and the dispatched prompt ("FENCED block" / "cmd_bytes_mismatch"
                // / "INTAKE-LINTED" / "END-TO-END"), so a per-surface reword or revert reds this row.
                /fenced/i, /cmd_bytes_mismatch/, /intake[_ -]lint/i, /end-to-end/i] },
    // Task 3.2 recovery Blocker 2 (stale-but-readable artifact): .war/ is git-excluded and
    // ensure-worktree reuses a present worktree untouched, so a resumeFromRunId replay lands on
    // prior-run artifact residue — READABLE but stamped with a prior tip. The seat MUST compare the
    // stamped tip_sha against the confirmed tip and attest 'unverified' on mismatch (the
    // missing/unreadable rule alone never fires on a stale-but-readable artifact). Pinned on the
    // card AND the shared endStateBlock (live prompts: per-task + end-state-only seats; the
    // integrated-tip seat concatenates the same const, source-count-pinned).
    { name: "stale-artifact tip_sha comparison (recovery Blocker 2): stamped tip_sha mismatching the confirmed tip ⇒ unverified, never met — readable is not sufficient",
      surfaces: [['war-auditor.md', auditorMd],
                 ['per-task gate-audit prompt (claims-bearing)', esSeatP],
                 ['end-state-only seat prompt (claims-bearing)', esOnlyP]],
      anchors: [/stamped `?tip_sha`?/, /stale-but-readable/i, /mismatch\w* the confirmed tip/i,
                /stale-but-readable[\s\S]{0,240}unverified/i, /readable is not sufficient/i] },
    // gate-audit-finding-routing Task 2.1 (#1410 fixes 1+2, #1412 fix 3): the escalate-boundary
    // contract — a non-empty escalate_reason required when verdict is escalate (intake side: the
    // AUDIT_VERDICT if/then conditional; enforcement arm recorded at that literal and by the intake-
    // contract test above), the by-construction discriminator (a blocking finding with a concrete
    // in-file suggested_fix needing no new plan decision is request_changes, however severe), and the
    // search-tooling rule (Grep/Glob tools, never shell grep/git grep — the guard refuses
    // glob/alternation metacharacters). Anchor precondition (Context 11, re-measured at this task's
    // base): `required when`, `however severe`, and `metacharacter` each count 0 on BOTH surfaces, so
    // a per-surface revert of any of the three sentences reds this row; `by construction`
    // (pre-existing in an unrelated workflow-template.js comment) and bare `escalate_reason` (1 hit
    // on all three prose surfaces at base) are rejected pins.
    { name: 'escalate-boundary contract (Task 2.1): required-when-escalate reason + by-construction discriminator + Grep-tool search rule — standing card + auditPrompt()',
      surfaces: [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/required when/i, /however severe/i, /metacharacter/i] },
    // Task 2.2 (#1431, ADR 0013 Amendment 2026-08-17): the latitude-clause reading on both runtime
    // seats — worker card + workerIntentClause (intent-gated: the dispatched surface is the
    // latitude-bearing fixture prompt above, never the intent-less workerP where the clause is ''),
    // auditor card + the always-rendered LATITUDE RULE arm in auditPrompt(). /mechanism latitude/i
    // and /binding guardrails/i were verified zero-at-base on all four surfaces; on the
    // latitude-bearing worker prompt alone the threaded intent itself carries those two headings, so
    // the third anchor pins the arm's own opener ("explicit `Mechanism latitude:` clause" — absent
    // from the fixture intent body by construction), keeping every surface red-able by a one-sided
    // strip of its arm (delete-the-feature; Red-proof 6).
    { name: 'latitude clause (#1431): an explicit Mechanism latitude: clause licenses in-band mechanism substitution bounded by the binding guardrails — worker card + latitude-bearing worker prompt, auditor card + auditPrompt()',
      surfaces: [['war-worker.md', workerMd], ['latitude-bearing worker prompt', latWorkerP],
                 ['war-auditor.md', auditorMd], ['auditPrompt()', auditP]],
      anchors: [/mechanism latitude/i, /binding guardrails/i, /explicit `Mechanism latitude:` clause/i] },
    // engine-reliability Phase 2 Task 4 (End state 18; red-team round 1 — the standing card half of
    // Task 2's wiring was unguarded): the budget-raise floor directive on war-refiner.md step 7 AND
    // the dispatched merge-task prompt (the floor is unconditional, so the dwTask-fixture mergeP
    // carries it — the done-when-floor row precedent). The trailer-form anchor is the literal
    // extracted from assert-budget-raise-cited.sh above (never a hand-copied form); the script name
    // appears on the card only inside step 7, so a card-side revert of the step reds this row even
    // though the MergeResult field-comment line also mentions the budget-uncited route.
    { name: "budget-raise floor (engine-reliability Phase 2 Task 4, End state 18): assert-budget-raise-cited.sh always runs pre-merge; trailer form extracted from the floor script; exit 1 ⇒ the budget-uncited fix-worker route, exit 2 ⇒ error, never the budget-uncited route",
      surfaces: [['war-refiner.md', refinerMd], ['merge-task dispatch prompt', mergeP]],
      anchors: [/assert-budget-raise-cited\.sh/, trailerFormRe,
                /exit 1[\s\S]{0,400}budget-uncited/i,
                /floor_route: ['"]budget-uncited['"]/,
                /exit 2[\s\S]{0,240}never the budget-uncited route/i] },
  ]
  assert.ok(REGISTRY.length >= 23, 'the registry lists the servitor memory-discipline row, the servitor path-hygiene row, the D8/D9(auditor)/D12/D6 auditor duties, the gate-audit seat row, the worker comment-lag row, the two Task 1.4 capture-grounding rows (servitor finding-match + auditor committed-tree), the Task 1.2 read-only git guard contract row, the #990 servitor landed-tip grounding ladder row, the bounded environment-proceed recovery row, the evidence-precedence five-surface row (ADR 0041), the A1 claimed-End-state-ids row (precision-chain Task 1.3), the done-when floor row (precision-chain Task 2.3), the two Task 3.2 rows (artifact-first attestation + mechanical mapped-tests grep), the two Task 3.2 recovery rows (endstate-check card twin + stale-artifact tip_sha comparison), the Task 2.1 escalate-boundary contract row (gate-audit-finding-routing Phase 2: required-when-escalate + discriminator + search-tooling), the Task 2.2 latitude-clause row (#1431: Mechanism latitude / binding guardrails on both runtime seats, worker surface from the latitude-bearing-intent fixture), and the budget-raise floor row (engine-reliability Phase 2 Task 4, End state 18: assert-budget-raise-cited.sh + script-extracted trailer form + exit-1 budget-uncited route + exit-2 error route, refiner card + merge-task dispatch prompt) — floor equals the true row count, no slack (#693)')
  for (const row of REGISTRY) {
    for (const [sName, sText] of row.surfaces) {
      for (const re of row.anchors) {
        assert.match(sText, re, `${row.name}: "${sName}" carries ${re}`)
      }
    }
  }
  // ADR 0041 ladder rung bodies — card-only by construction: End state 8(ii) forbids these tokens on the
  // dispatched surfaces, so the five-surface row above cannot carry them; assert them on the card alone
  // (the file's existing supplementary-assert idiom, cf. the CWD_IS_TIP_ASSERTING loop below).
  // #1246 — the `authority` ladder was the one claim shape with NO rung-body anchor here: the loop's four
  // PRE-EXISTING regexes covered content-at-pin (rungs 1 and 2), execution (rung 1) and history (rung 2),
  // so an authority-ladder rung could be deleted from the card with this loop still green. The appended
  // /Roadmap\/spec literals/i is authority rung 4, completing 4-of-4 claim-shape coverage. Absence census
  // RE-MEASURED at this task's base (never inherited from the rows above): `Roadmap/spec literals` counts
  // 0 in skills/war/assets/workflow-template.js — one count that covers auditPrompt() AND all three
  // gate-audit-family seat sources, because every one of those four dispatched surfaces is built in that
  // single file — and 1 in agents/war-auditor.md, the authority ladder's rung 4. So the new anchor is
  // card-only by the same construction as the existing four, and deleting that rung body REDs it.
  for (const re of [/Pinned blob/i, /Gate-evidence artifact/i, /advisory corroboration/i, /a claim to verify, never evidence/i,
    /Roadmap\/spec literals/i]) {
    assert.match(auditorMd, re,
      `war-auditor.md carries the spec §4.1 rung body ${re} — card-only by construction: End state 8(ii) forbids these tokens on the dispatched surfaces, so the five-surface row above cannot carry them`)
  }
  // Servitor-migration completeness (migrated from the former T1 both-surfaces test): the standing card
  // shed the retired routing tokens, and the template args header no longer describes learningsTarget loosely.
  // #990 premise absence (End state 5): the ASSERTING cwd-is-tip form is gone from BOTH servitor prompt
  // surfaces. Matched against the WHOLE surface string, never line-scoped — the retired pairing could wrap
  // a line break (the card's version does) and a line-based sweep would miss exactly the defect it polices.
  // The negation lookahead is what lets the NEW prose ("is NOT assumed to be the committed tip") pass while
  // the asserting form still reds; RETIRED_PREMISE_SAMPLES below is the unwired negative reference proving
  // the guard is not vacuous in the other direction.
  for (const [sName, sText] of [['war-servitor.md', servitorMd], ['servitor Wrap-up prompt', servitorP]]) {
    assert.doesNotMatch(sText, CWD_IS_TIP_ASSERTING,
      `${sName}: the asserting cwd-is-tip premise is absent (grounding is on the threaded landed tip — ADR 0029 amendment)`)
  }
  for (const [label, sample] of RETIRED_PREMISE_SAMPLES) {
    assert.match(sample, CWD_IS_TIP_ASSERTING,
      `negative reference (${label}): the retired asserting form DOES match the guard — the doesNotMatch above is non-vacuous`)
  }
  for (const [sName, sText] of [['war-servitor.md', servitorMd], ['worker-servitor-edges.md', edgesMd]]) {
    assert.doesNotMatch(sText, /phase-<N>\.md/i, `${sName} no longer names the phase-<N>.md aggregate file`)
    assert.doesNotMatch(sText, /else:\s*append|else\b.{0,20}append to/i, `${sName} no longer carries an "else: append" routing arm`)
  }
  assert.doesNotMatch(src, /memory dir or docs\/learnings/i, 'template args header no longer says "(memory dir or docs/learnings/)"')
  // Old-fragment absence (D5, spec criterion 6; red-team adjudication, ADR 0025 replacement-class drift):
  // the retired partial teach ('%-format' / 'reflog syntax') is GONE from BOTH prompt surfaces. A partial
  // edit that adds the new contract but leaves the stale teach co-present REDs here — this promotes the
  // criterion-6 `grep -rn '%-format'` from un-encoded prose to a RED-able assertion.
  // UNION extension (prompt-surface simplification, adjudication I): Task 3.1 evicted the
  // guard-contract teach into references/auditor-teach.md — the OLD-absent scan covers the
  // eviction destination too, never a relocated read.
  for (const [sName, sText] of [['war-auditor.md', auditorMd], ['auditPrompt()', auditP],
    ['references/auditor-teach.md', auditorTeachMd]]) {
    assert.doesNotMatch(sText, /%-format/, `${sName}: the retired '%-format' teach is absent (the D5 contract replaced it)`)
    assert.doesNotMatch(sText, /reflog syntax/, `${sName}: the retired 'reflog syntax' teach is absent (the D5 contract replaced it)`)
  }
  // #1080 retired-claim lock: the card used to claim this contract was "mirrored verbatim" into the
  // dispatched audit prompt. False — the two surfaces are deliberately different FORMATS, and what is
  // actually enforced is the D5 row above, which anchors shared TOKENS per surface (four at #1080, six
  // since Task 1.2 added the two-arm branch anchors). The mirror-architecture prose the lock polices now
  // lives in references/auditor-teach.md (Task 3.1 eviction), which names the D5 row as the shared-token
  // anchor and the D6 test below as the branch-flag arbiter; the UNION scan (adjudication I) keeps the
  // overclaim from silently returning on either the card or the eviction destination.
  for (const [sName, sText] of [['war-auditor.md', auditorMd],
    ['references/auditor-teach.md', auditorTeachMd]]) {
    assert.doesNotMatch(sText, /mirrored verbatim/i,
      `${sName}: the retired 'mirrored verbatim' guard-contract claim is absent — the D5 row's per-surface token anchors are what enforce the mirror (#1080)`)
  }
  // Task 1.2 (D5, spec §5; #1085/#1124) retired-claim lock: the blanket "=-attached read flags only" branch
  // characterization — self-contradicted by the five bare flags in its own parenthetical, and shed by the
  // hook's deny string on 2026-07-24 — is GONE from both mirror surfaces, which now carry the two-arm form
  // anchored by the D5 row above. The samples are the both-ways proof: each is asserted to MATCH, so the
  // absence checks cannot pass vacuously through a regex that stopped firing. UNION extension
  // (adjudication I): the Task 3.1 eviction destination joins the scan.
  for (const [sName, sText] of [['war-auditor.md', auditorMd], ['auditPrompt()', auditP],
    ['references/auditor-teach.md', auditorTeachMd]]) {
    assert.doesNotMatch(sText, BRANCH_READ_FLAGS_ONLY_RETIRED,
      `${sName}: the retired "=-attached read flags only" branch claim is absent (the two-arm characterization replaced it — #1124)`)
  }
  for (const [label, sample] of BRANCH_READ_FLAGS_ONLY_SAMPLES) {
    assert.match(sample, BRANCH_READ_FLAGS_ONLY_RETIRED,
      `negative reference (${label}): the retired claim DOES match the guard — the doesNotMatch above is non-vacuous`)
  }
})

// ---------------------------------------------------------------------------
// D6 (Task 1.2, spec §4) — EXTRACTION-EQUALITY drift lock for the branch flag enumeration.
// The hook's branch deny string is CANONICAL; both prompt mirrors are followers. This test reads the hook,
// extracts the flag tokens from the two parenthesized arms of that deny string, and asserts every one of
// them onto both mirror surfaces — so the next hook-side flag change REDs the mirrors instead of stranding
// them (the exact defect class #1124 records, which the D5 hand anchors alone could not catch).
// ---------------------------------------------------------------------------

// Token-boundary matcher: a naive substring check would pass VACUOUSLY for the short flags — `-a` is a
// substring of `--points-at=` and `--all`, `-r` of `--remotes`, `-v` of `--verbose` and `-vv` — so dropping
// one from a mirror would go unnoticed. Word/hyphen boundaries on both sides fix that, and admit the .md's
// backtick fencing (a backtick is neither \w nor -) without a markdown-specific special case.
const flagTokenRe = tok => new RegExp(`(?<![\\w-])${tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`)

test('D6 — branch flag enumeration: every token in the hook\'s canonical deny string reaches BOTH prompt mirrors (token-boundary matched)', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const auditP = (calls.find(c => isAuditor(c) && !(c.opts.label || '').startsWith('gate-audit:')) || {}).prompt
  assert.ok(auditP, 'a regular auditor prompt was dispatched (presence guard)')
  const hookSh = readFileSync(join(here, '../../../hooks/validate-auditor-git.sh'), 'utf8')
  const REPOINT = 're-point the extractor at the reshaped deny string in hooks/validate-auditor-git.sh'
  // The two arms, in the hook's own words. Anchored on the arm labels rather than on line position or on
  // the full deny sentence, so wording latitude around them does not false-red.
  // Slice the deny statement itself first, so the arm regex and the third-arm count below both read the
  // one canonical string rather than the whole file (`[^"]*` spans newlines, so a reflow does not false-red).
  const denyStmt = (hookSh.match(/deny "git branch admits read forms only:[^"]*"/) || [])[0]
  assert.ok(denyStmt, `hook branch deny string not locatable — ${REPOINT}`)
  const arms = denyStmt.match(/value-carrying flags =-attached \(([^)]*)\)[^(]*bare read flags \(([^)]*)\)/)
  assert.ok(arms, `hook branch deny string's two flag arms not locatable — ${REPOINT}`)
  // Third-arm guard. The two-arm regex above still matches when a THIRD labeled group is appended to the
  // deny string, so its flags would go unextracted and the mirrors would strand silently — the exact #1124
  // class D6 exists to RED. Counting the deny statement's own open parens is what catches that. (A prior
  // `arms.length === 3` check here was tautological: a non-global match with two capture groups is always
  // length 3 whenever it is truthy, so it could not fire under any input.)
  const groupCount = (denyStmt.match(/\(/g) || []).length
  assert.equal(groupCount, 2,
    `branch deny string carries ${groupCount} parenthesized flag groups, expected exactly two — a third arm's flags are never extracted; ${REPOINT}`)
  const groups = arms.slice(1).map(g => g.split(',').map(t => t.trim().replace(/<[^>]*>/g, '')).filter(Boolean))
  // A locatable anchor whose groups parse to nothing (reflowed enumeration, emptied arm) must fail LOUDLY —
  // an empty token list would otherwise make the per-token loop below a silent vacuous green.
  groups.forEach((g, i) => assert.ok(g.length > 0,
    `flag group ${i + 1} parsed to zero tokens — ${REPOINT}`))
  for (const tok of groups.flat()) {
    for (const [sName, sText] of [['war-auditor.md', auditorMd], ['auditPrompt()', auditP]]) {
      assert.match(sText, flagTokenRe(tok),
        `${sName}: the hook admits branch flag "${tok}" but the mirror does not enumerate it (token-boundary matched) — the mirrors follow the hook's deny string`)
    }
  }
})

// ---------------------------------------------------------------------------
// Task 1.2 — engine ingest guards: (B) the non-null-object args guard + hoisted phaseId,
// (C) the `pt` tagged-prompt undefined-interpolation guard. ADR 0034.
// ---------------------------------------------------------------------------

test("criterion 2 — a scalar args string ('null'/'true'/'5') RETURNS held:workflow-error naming the JSON-object guard, dispatches ZERO agents, renders phase:null", async () => {
  for (const scalar of ['null', 'true', '5']) {
    const fn = build()
    let dispatched = 0
    const agent = async () => { dispatched++; return {} }
    const out = await fn(agent, fakeParallel, async () => [], () => {}, () => {}, scalar, { total: null })
    // Named clean error → the existing catch routes held:workflow-error (no new enum member, ADR 0005).
    assert.equal(out.landDecision, 'held:workflow-error', `args='${scalar}' → held:workflow-error; got ${JSON.stringify(out.landDecision)}`)
    assert.match(out.workflowError.message, /args must be a JSON object/, `args='${scalar}' names the guard (delete-the-feature: reverting the guard changes this message to a raw destructure error)`)
    assert.equal(dispatched, 0, `args='${scalar}' dispatches zero agents (the guard throws at the top of the try, before any spawn)`)
    // The catch renders phase via the hoisted phaseId fallback — NEVER a secondary TypeError on an unassigned ph.
    assert.equal(out.phase, null, `args='${scalar}' renders phase:null via the hoisted phaseId fallback`)
    assert.doesNotMatch(out.workflowError.message, /Cannot (read|destructure)|is not defined|of (null|undefined)/,
      `args='${scalar}' is the NAMED guard error, not a secondary raw TypeError/ReferenceError on ph`)
  }
})

test("D8 (spec §8) — a malformed JSON STRING args ('{oops') RETURNS held:workflow-error whose message carries the payload char length + head snippet, dispatches ZERO agents, renders phase:null", async () => {
  // Sibling of the scalar-args criterion-2 test: the string arm's JSON.parse throws, and the D8 wrapper
  // re-throws a NAMED, self-diagnosing error routed to the existing held:workflow-error catch (no new enum
  // member, ADR 0005). Delete-the-feature: reverting the D8 try/catch lets the raw SyntaxError propagate
  // (still held:workflow-error at the top-level catch, but with no char-length / head-snippet self-diagnosis).
  const payload = '{oops'
  const fn = build()
  let dispatched = 0
  const agent = async () => { dispatched++; return {} }
  const out = await fn(agent, fakeParallel, async () => [], () => {}, () => {}, payload, { total: null })
  assert.equal(out.landDecision, 'held:workflow-error', `malformed JSON string → held:workflow-error; got ${JSON.stringify(out.landDecision)}`)
  assert.match(out.workflowError.message, /not valid JSON/, 'the message names the malformed-JSON class (the D8 diagnostic, not a raw uncaught parse throw)')
  assert.match(out.workflowError.message, new RegExp(`${payload.length} chars`), `the message carries the payload length in characters (${payload.length})`)
  assert.ok(out.workflowError.message.includes(payload), `the message carries the head snippet of the payload ("${payload}")`)
  assert.equal(dispatched, 0, 'zero agents dispatched (the string-arm parse throws at the top of the try, before any spawn)')
  assert.equal(out.phase, null, 'renders phase:null via the hoisted phaseId fallback (parse throws before ph is assigned)')
})

test('D9 (spec §9) — the held:workflow-error catch return carries workflowError.recovery (fresh Recovery relaunch, never resumeFromRunId) — one shared return site, universal', async () => {
  // The top-level catch has a SINGLE return site, so the additive recovery field rides EVERY catch-path
  // return. Probe two distinct throw origins (a malformed JSON string, a scalar args) to show it is on the
  // shared return, not path-specific. It names the sanctioned retry: a FRESH Recovery relaunch (new runId),
  // NEVER resumeFromRunId (the journal replays the cached error) — conforming to SKILL.md's ratified prose.
  for (const payload of ['{oops', 'null']) {
    const fn = build()
    const out = await fn(async () => ({}), fakeParallel, async () => [], () => {}, () => {}, payload, { total: null })
    assert.equal(out.landDecision, 'held:workflow-error', `args='${payload}' reaches the top-level catch`)
    assert.ok(typeof out.workflowError.recovery === 'string' && out.workflowError.recovery.length > 0,
      `args='${payload}': workflowError.recovery is a non-empty string`)
    assert.match(out.workflowError.recovery, /fresh Recovery relaunch/i, `args='${payload}': recovery names a fresh Recovery relaunch (new runId)`)
    assert.match(out.workflowError.recovery, /never\s+resumeFromRunId/i, `args='${payload}': recovery says never resumeFromRunId`)
  }
})

test('criterion 2 (both-sites drift-guard) — the non-null-object args guard is present at BOTH parse sites (template THROWS, scaffold falls back to {})', () => {
  const scaffoldSrc = readFileSync(join(here, '../../red-team/assets/workflow-scaffold.js'), 'utf8')
  // Template site: a scalar/array A THROWS a named error routing to held:workflow-error.
  assert.match(src, /typeof A !== 'object' \|\| A === null \|\| Array\.isArray\(A\)/, 'template carries the non-null-object args guard')
  assert.match(src, /args must be a JSON object/, 'template throws the named guard error (routes to held:workflow-error)')
  // Scaffold site: a scalar/array parse result NORMALIZES to {} (same posture as the catch) so the titleLine refusal fires.
  assert.match(scaffoldSrc, /typeof parsed === 'object' && parsed !== null && !Array\.isArray\(parsed\)/, 'scaffold carries the mirrored non-null-object guard (normalize-to-{})')
  // The mirrored discipline: both sites reject arrays as well as scalars (hand-mirrored — the sandbox cannot import).
  for (const [name, s] of [['template', src], ['scaffold', scaffoldSrc]])
    assert.match(s, /!?Array\.isArray/, `${name} guards against arrays too`)
})

test('criterion 3 — a pt-tagged prompt interpolating an undefined VALUE INSIDE the work thunk escalates the task (held:escalation, pt message in blocked, no worker dispatched)', async () => {
  // Rewritten + retitled: task.title is a REQUIRED worker-prompt input; omitting it makes ${task.title}
  // undefined. The pt tag throws at prompt-BUILD INSIDE the work thunk (before the agent() call), so the
  // wave-loop-invariant catch converts it to a per-task held:escalation carrying the pt message in
  // `blocked` — an INSIDE-thunk pt throw is a per-task escalate now, NOT held:workflow-error (that route
  // stays for OUTSIDE-thunk pt throws: the Provision-barrier / merge-land / gate-audit prompts).
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, planSlice: 'slice 1', roster: [{ lens: 'correctness' }],
      branch: 'war/wtprov-a/p3-t1', worktree: '/abs/repo/.claude/worktrees/run-2026/p3-t1' }, // title OMITTED → undefined inside the worker prompt build
  ] })
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:escalation', `undefined title inside the thunk → held:escalation; got ${JSON.stringify(out.landDecision)}`)
  const esc = (out.escalated || []).find(e => e && e.task === 't1' && e.reason === 'escalate')
  assert.ok(esc, 'the task escalates with reason escalate')
  assert.match(esc.blocked, /undefined interpolation after/, 'the pt guard message (the undefined interpolation + adjacent fragment) rides the escalation blocked')
  assert.ok(!calls.some(c => seatOf(c.opts) === 'war-worker' && c.opts.phase === 'Work'),
    'the worker whose prompt threw at build time is NEVER dispatched (pt throws before agent())')
})

test("criterion 3 (zero false positives) — a DEFINED interpolation whose text contains the word 'undefined' does NOT throw; the phase lands", async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 'handle the undefined case', planSlice: 'the value is undefined here', roster: [{ lens: 'correctness' }] },
  ] })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `defined 'undefined'-containing text must ship and land; got ${JSON.stringify(out.landDecision)}`)
  assert.ok(!out.workflowError, 'no workflow error — the value-identity check never scans prose, so "undefined" as TEXT can never trip it')
})

test('criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline template literal', () => {
  // Every prompt-rendering spawn-site literal is pt-tagged (or built by a tagged helper). A bare
  // `agent(`...`)` — a backtick right after the paren, only whitespace between — is the untagged-literal
  // footgun this floor forbids; untagging a spawn-site literal (delete-the-feature) reintroduces it.
  assert.doesNotMatch(src, /\bagent\(\s*`/, 'no agent() call passes a bare (untagged) inline template literal — all are pt-tagged or built by a tagged helper')
})

test('criterion 3 — the pt tag checks interpolated VALUES for identity === undefined (never scans prose text)', () => {
  assert.match(src, /const pt = \(strings, \.\.\.vals\) =>/, 'pt is defined as a tagged-template function near the top')
  assert.match(src, /vals\[i\] === undefined/, 'pt checks each interpolated VALUE for identity === undefined (value, never surrounding text)')
  assert.match(src, /undefined interpolation after/, 'pt throws naming the adjacent literal fragment (strings[i] tail)')
})

// ===========================================================================
// #931 — template-literal census (lifts the criterion-3 coverage floor above from "no bare agent(`" to a
// DEFAULT-DENY multiset over EVERY untagged template literal in the template). The pt guard's structural
// floor rejects only a bare backtick right after `agent(`; an untagged literal mid-concatenation, behind a
// variable, in a helper body, or nested inside a pt interpolation slips undefined into a prompt with the
// guard never consulted. scanTemplateLiterals is a string-aware single pass: it recognizes // and /* */
// comments OUTSIDE strings, single/double-quoted strings (backslash-aware; a string that does not close on
// its line THROWS), and template literals (backslash-aware, recursive ${} interiors — nested literals and
// each one's tagged/untagged distinction are FIRST-CLASS entries). It THROWS on EOF in any construct —
// fail-closed, never a silent narrowing. It is NOT a JS lexer.
// ponytail: the recorded ceiling is regex-literal ambiguity — a regex literal carrying an unbalanced
// quote/backtick DESYNCS the scanner, but LOUDLY via the unclosed-string/EOF throw, never silently; the
// upgrade path (a real lexer) is the rejected ceiling. `pt`-tagged = the identifier `pt` immediately
// precedes the backtick (verified in-file: `pt\`` carries no space).
const HEAD_LEN = 44
const scanTemplateLiterals = (text = src) => {
  const n = text.length
  const literals = []      // { head, tagged } per template literal (nested interiors included)
  const blockComments = [] // raw text of each TRUE (string-aware) block comment
  const isIdent = (c) => c !== undefined && /[A-Za-z0-9_$]/.test(c)
  const ptTagged = (b) => text.slice(b - 2, b) === 'pt' && !isIdent(text[b - 3])
  const scanString = (quote, start) => {
    let j = start + 1
    while (j < n) {
      const c = text[j]
      if (c === '\\') { j += 2; continue }
      if (c === '\n') throw new Error(`scanTemplateLiterals: unclosed ${quote}-string at line-end near ${JSON.stringify(text.slice(start, start + 40))} (fail-closed)`)
      if (c === quote) return j + 1
      j++
    }
    throw new Error(`scanTemplateLiterals: EOF inside ${quote}-string (fail-closed)`)
  }
  const skipLine = (start) => { let j = start + 2; while (j < n && text[j] !== '\n') j++; return j }
  const skipBlock = (start) => {
    let j = start + 2
    while (j < n) { if (text[j] === '*' && text[j + 1] === '/') return j + 2; j++ }
    throw new Error('scanTemplateLiterals: EOF inside block comment (fail-closed)')
  }
  const scanTemplate = (start, tagged) => {
    literals.push({ head: text.slice(start + 1, start + 1 + HEAD_LEN), tagged })
    let j = start + 1
    while (j < n) {
      const c = text[j]
      if (c === '\\') { j += 2; continue }
      if (c === '`') return j + 1
      if (c === '$' && text[j + 1] === '{') { j = scanInterp(j + 2); continue }
      j++
    }
    throw new Error('scanTemplateLiterals: EOF inside template literal (fail-closed)')
  }
  const scanInterp = (start) => {
    let j = start, depth = 1
    while (j < n) {
      const c = text[j]
      if (c === "'" || c === '"') { j = scanString(c, j); continue }
      if (c === '`') { j = scanTemplate(j, ptTagged(j)); continue }   // nested literal — first-class
      if (c === '/' && text[j + 1] === '/') { j = skipLine(j); continue }
      if (c === '/' && text[j + 1] === '*') { j = skipBlock(j); continue }
      if (c === '{') { depth++; j++; continue }
      if (c === '}') { depth--; if (depth === 0) return j + 1; j++; continue }
      j++
    }
    throw new Error('scanTemplateLiterals: EOF inside ${} interpolation (fail-closed)')
  }
  let i = 0
  while (i < n) {
    const c = text[i]
    if (c === '/' && text[i + 1] === '/') { i = skipLine(i); continue }
    if (c === '/' && text[i + 1] === '*') { const e = skipBlock(i); blockComments.push(text.slice(i, e)); i = e; continue }
    if (c === "'" || c === '"') { i = scanString(c, i); continue }
    if (c === '`') { i = scanTemplate(i, ptTagged(i)); continue }
    i++
  }
  return { literals, blockComments }
}

// The DEFAULT-DENY registry: the enumerated multiset of UNTAGGED template-literal 44-char heads
// (head + occurrence count), machine-derived once via the scanner at this dispatch base. HEADER RULE
// (grep-able, for auditors): a literal that FEEDS agent() prompt text is NEVER registered here — tag it
// with `pt`. Every row is VALUE-COMPOSITION, grouped by class rationale:
//   • the pt guard's OWN throw-message literal;
//   • validation / error / refusal messages (throws + escalation detail strings);
//   • git/shell command & flag builders — spliced into an already-`pt`-tagged carrier that guards the
//     spliced VALUE; every interpolation here is ternary-guarded or derived-and-validated, so no
//     undefined can render (the `pt` carrier is the prompt-safety boundary) — e.g. testPatternArg,
//     the resolveGate discovery/composition mirror (ADR 0036, untouchable), workerSelfQueryRepoFlag,
//     owned, the ensure-worktree list, the phaseBaseCmd merge-base;
//   • label / branch / worktree / path / verdict / reason builders — opts.label, t.branch, t.worktree,
//     the ×5 `${worktreeRoot || '<worktreeRoot>'}/…` path family, escalation task labels & reasons,
//     gate-audit/land verdict tokens (consumed as VALUES by pt-tagged carriers that guard them);
//   • log / note / detail lines (log() sinks, auditLog notes, escalation details, one out-of-scope
//     `.test()` predicate).
// Entries are in source-appearance order (which tracks the file's phase structure). Exact multiset
// equality below is red BOTH ways — a new untagged literal (any spawn site, helper operand, variable,
// or nested interior) AND a stale row whose literal was removed/renamed.
const LITERAL_REGISTRY = [
  ["workflow-template prompt: undefined interpol"],
  ["workflow-template: args is a string but not "],
  ["workflow-template: args must be a JSON objec"],
  [" --pattern '${testPattern}'` : ''\n// Partial"],
  ["war/${planSlug}/p${ph.id}-${t.id}` : t.branc"],
  ["${worktreeRoot}/${runId}/p${ph.id}-${t.id}` "],
  ["roster must be an array of 1-5 seats (got ${"],
  ["roster[${i}] must be an object { lens, depth"],
  ["roster[${i}].lens must be a non-empty string"],
  ["roster[${i}].lens \"${seat.lens}\" duplicates "],
  ["roster[${i}].depth must be \"neighbors\" or \"d"],
  ["-name '*.test.sh'`\nconst resolveGate = (decl"],
  ["for f in $(find . -type f ${GATE_DISCOVERY_T"],
  ["do printf '\\\\n== gate(bash): %s ==\\\\n' \"$f\" "],
  ["${declaredGate} && ${discovery}`\n}\n// audit."],
  ["workflow-template: requires top-level { plan"],
  ["phase.id is missing (derivation would produc"],
  ["workflow-template: requires phase { title, w"],
  ["${problems.join('; ')}${derivationProblem ? "],
  ["task ${t.id}: cannot derive branch/worktree "],
  ["task ${t.id}: invalid roster — ${rv.errors.j"],
  ["provision-run:${task.id}`, dispatchKind: 'pr"],
  ["task ${task.id}: the provision-run:${task.id"],
  ["Disposition demotion: [${f.severity}] \"${f.t"],
  ["worker path-contract violation: reported fil", 2],
  ["Task ${taskId}: normalized main-checkout-roo"],
  [" --repo ${learningsTarget}` : ''\nconst WORKE"],
  ["baseline gate debt: ${idset.join(', ') || '("],
  ["audit:${task.id}:${seat.lens}${peers ? ':reb"],
  ["pin-mismatch:${s.verdict}`, pinMismatch: tru"],
  ["pin-mismatch: seat reviewed ${s.audit_sha} b"],
  ["Phase ${ph.id} \"${ph.title}\": ${tasks.length"],
  [" --owned-file ${ownedFile}` : ''\n  // --recl"],
  ["   provision-worktrees.sh ensure-worktree ${"],
  ["provision:phase-${ph.id}`, dispatchKind: 'pr"],
  ["phase ${ph.id}: the provision:phase-${ph.id}"],
  ["recovery: task ${id} is pre-merged on the ad"],
  ["stale prior attempt: the remote task branch "],
  ["Task ${sr.task}: env-blocked — stale remote "],
  ["No runnable tasks remain — the rest are bloc"],
  ["work:${task.id}`, schema: WORKER_RESULT, ..."],
  ["Task ${task.id}: lone-seat widening (Critica"],
  ["fix:${task.id}:r${round + 1}`, schema: WORKE"],
  ["engine error during work/audit: ${err.messag"],
  ["gate-audit: skipping ${task.id} (requiresTes"],
  ["ace-bisect ${r.task.id}: ladder stopped — fi"],
  ["ace:${r.task.id}:r${r.task.fixRounds + 1}`, "],
  ["failed absorb — ${aceWhy || 'ace worker retu"],
  ["${worktreeRoot || '<worktreeRoot>'}/${runId ", 4],
  ["packaging-floor: skipping ${r.task.id} (requ"],
  ["merge:${r.task.id}`, schema: MERGE_RESULT, ."],
  ["${r.task.id} touches a submodule; undeclared"],
  ["${isNoTest ? 'add-test' : isDoneUnmet ? 'mak"],
  ["${floorMr.status}: re-audit did not approve "],
  ["${floorMr.status}:re-audit-failed`, findings"],
  ["merge:${r.task.id}:floor-retry:r${r.task.fix"],
  ["${floorMr.status}:exhausted`, fixRounds: r.t"],
  ["merge:${r.task.id}:environment-proceed`, sch"],
  ["merge:${r.task.id}:baseline-proceed`, schema"],
  ["${r.task.id} touches a submodule (surfaced o", 3],
  ["task never reached the approve branch (verdi"],
  ["Task ${r.task.id}: env-blocked — provision s"],
  ["endstate-check intake-lint: condition ${r.n}"],
  ["endstate-check: dispatching the land-barrier"],
  ["endstate-check:phase-${ph.id}`, dispatchKind"],
  ["$(git -C ${refineryPath} merge-base ${ph.int"],
  ["evidence:phase-${ph.id}`, dispatchKind: 'evi"],
  ["gate-audit:${taskId}:execution-evidence`, sc"],
  ["gate-audit:${gateAuditVerdict.verdict}`, fin"],
  ["gate-audit:phase-${ph.id}:integrated-tip`, s"],
  ["phase-${ph.id}-integrated-tip`, verdict: `ga"],
  ["gate-audit:${authVerdict.verdict}`, findings"],
  ["phase-${ph.id}-integrated-tip`, reason: 'gat"],
  ["gate-audit: mergedTasksForGateAudit is empty"],
  ["gate-audit:phase-${ph.id}:end-state`, schema"],
  ["phase-${ph.id}-end-state`, verdict: `gate-au"],
  ["gate-audit:${esVerdict.verdict}`, findings, "],
  ["phase-${ph.id}-end-state`, reason: 'gate-evi"],
  ["phase-close sweep: the phase is ${landDecisi"],
  ["phase-close sweep: the config default audit."],
  ["war/${planSlug || '<plan-slug>'}/p${ph.id}-p"],
  ["p${ph.id}-polish`, issue: ph.epicIssue || `<"],
  ["<phase-${ph.id}-epic>`,\n      title: `phase-"],
  ["phase-close coherence sweep (phase ${ph.id})"],
  ["drain the phase-close queue (${phaseCloseQue"],
  ["polish-worktree:phase-${ph.id}`, dispatchKin"],
  ["phase-close sweep: the polish worktree provi"],
  ["polish:phase-${ph.id}`, schema: WORKER_RESUL"],
  ["merge:p${ph.id}-polish`, schema: MERGE_RESUL"],
  ["phase-close sweep MERGED at ${polishSha} — t"],
  ["phase-close sweep DISCARDED (${sweepWhy || ("],
  ["polish merge returned ${pmr && pmr.status ||"],
  ["land:phase-${ph.id}`, schema: MERGE_RESULT, "],
  ["phase-${ph.id}-land`, reason: 'submodule-pr'", 3],
  ["phase-${ph.id}-land`, reason: landResult.sta", 2],
  ["phase-${ph.id}-land`, reason: 'env-blocked',", 2],
  ["land:phase-${ph.id}:environment-proceed`, sc"],
  ["Phase ${ph.id} landed via environment-procee"],
  ["land:phase-${ph.id}:baseline-proceed`, schem"],
  ["Phase ${ph.id} landed via baseline-proceed r"],
  ["phase-${ph.id}-land`, reason: reLand.status,", 2],
  ["phase-${ph.id}-land`, reason: reLand ? reLan", 2],
  ["Phase ${ph.id} landed. Attempting opportunis"],
  ["phase-${ph.id}-land`, reason: landResult ? S"],
  ["Phase ${ph.id}: dead or unrouted land dispat"],
  ["Holding the land for phase ${ph.id}: ${escal"],
  ["Holding the land for phase ${ph.id}: no task"],
  ["wrap-up:phase-${ph.id}`, schema: SERVITOR_RE"],
  ["Phase ${ph.id} landed but no memoryLocalRoot"],
  ["${f.title || ''} ${f.rationale || ''}`)) ? '"],
]

const untaggedHeadMultiset = (text) => {
  const m = new Map()
  for (const l of scanTemplateLiterals(text).literals) if (!l.tagged) m.set(l.head, (m.get(l.head) || 0) + 1)
  return m
}
const registryMultiset = () => {
  const m = new Map()
  for (const row of LITERAL_REGISTRY) m.set(row[0], (m.get(row[0]) || 0) + (row[1] ?? 1))
  return m
}
const multisetsEqual = (a, b) => {
  if (a.size !== b.size) return false
  for (const [h, c] of a) if (b.get(h) !== c) return false
  return true
}
const sortedEntries = (m) => [...m.entries()].sort((x, y) => x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0)

test('#931 template-literal census — the untagged-literal head multiset equals the registry EXACTLY, and every true block comment is backtick-free', () => {
  const actual = untaggedHeadMultiset(src)
  const expected = registryMultiset()
  const added = [...actual].filter(([h, c]) => expected.get(h) !== c).map(([h, c]) => `${JSON.stringify(h)}×${c} (registry has ${expected.get(h) ?? 0})`)
  const removed = [...expected].filter(([h, c]) => actual.get(h) !== c).map(([h, c]) => `${JSON.stringify(h)}×${c} (source has ${actual.get(h) ?? 0})`)
  assert.deepEqual(sortedEntries(actual), sortedEntries(expected),
    `untagged-literal registry drift — a literal that FEEDS agent() prompt text must be pt-tagged, NEVER registered here.\n  new/changed untagged literal(s): ${added.join('  |  ') || 'none'}\n  stale/missing registry row(s): ${removed.join('  |  ') || 'none'}`)
  // The census COUPLING (the precondition the block census's "line-only is safe" argument leans on):
  // every TRUE (string-aware) block comment is backtick-free, so a backtick can never hide in a comment.
  for (const bc of scanTemplateLiterals(src).blockComments)
    assert.ok(!bc.includes('`'), `every true block comment must be backtick-free (census coupling): ${JSON.stringify(bc.slice(0, 60))}`)
})

test('#931 template-literal census — RED paths (a)-(f): bare / var / operand / nested untagged literals red the multiset; an unclosed string/EOF THROWS; a backtick in a block comment breaks the coupling', () => {
  const censusGreen = (text) => multisetsEqual(untaggedHeadMultiset(text), registryMultiset())
  assert.ok(censusGreen(src), 'baseline: the live-source census is green')
  // (a) a bare untagged agent(`…`) spawn literal
  assert.ok(!censusGreen(src + '\nagent(`bare untagged spawn ${x}`)\n'), '(a) a bare untagged agent(`…`) literal reds the census')
  // (b) an untagged literal assigned to a variable then passed to agent(
  assert.ok(!censusGreen(src + '\nconst v = `untagged via var ${x}`\nagent(v)\n'), '(b) an untagged literal behind a variable then passed to agent() reds the census')
  // (c) an untagged operand inserted into a pt-concatenation (the auditPrompt shape)
  assert.ok(!censusGreen(src + '\nconst h = pt`a` + `untagged operand ${x}`\n'), '(c) an untagged operand in a pt concatenation reds the census')
  // (d) an untagged literal nested inside a pt literal's ${} (the submodNote/pinStatusLine/guardLine shape)
  assert.ok(!censusGreen(src + '\nconst z = pt`outer ${`inner untagged ${x}`}`\n'), '(d) an untagged literal nested in a pt ${} reds the census (nested literals are first-class — helper interiors can never be exempted by accident)')
  // (e) an unterminated literal / unclosed quoted string → the scanner THROWS (fail-closed, never a silent narrowing)
  assert.throws(() => scanTemplateLiterals(src + "\nconst bad = 'unclosed at end of line\n"), /unclosed .-string|EOF/, '(e) an unclosed quoted string THROWS (fail-closed)')
  assert.throws(() => scanTemplateLiterals(src + '\nconst bad = `unterminated ${x}'), /EOF/, '(e) an unterminated template literal THROWS (fail-closed)')
  // (f) a backtick edited into the /* the batch ace commit */ block comment → red via the backtick-free assertion (the designed coupling)
  const mutated = scanTemplateLiterals(src.replace('/* the batch ace commit */', '/* the batch ace `commit` */'))
  assert.ok(mutated.blockComments.some(b => b.includes('`')), '(f) a backtick in a true block comment is detected — breaks the coupling the block census leans on')
})

test('#931 registry hygiene — exact multiset equality reds a literal WITHOUT a row AND a row WITHOUT a literal (structural stale-row protection, both directions)', () => {
  // literal-without-row: a new untagged literal in the source with no registry entry.
  const orphanLiteral = untaggedHeadMultiset(src + '\nconst orphan = `orphan literal no registry row ${x}`\n')
  assert.ok(!multisetsEqual(orphanLiteral, registryMultiset()), 'a literal with no registry row reds the census (one direction)')
  // row-without-literal: a registry carrying a phantom row no live literal matches.
  const phantom = new Map(registryMultiset()); phantom.set('PHANTOM ROW — no live literal matches this head', 1)
  assert.ok(!multisetsEqual(untaggedHeadMultiset(src), phantom), 'a registry row whose literal was removed/renamed reds the census (the other direction) — the spec per-row deletion loop is subsumed by exact equality')
})

test('#931 / End-state 9 — the census fixture 5(a) matches the byte-unchanged criterion-3 coverage floor pattern', () => {
  // Cross-reference: this is the pattern from the test
  // `criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline template literal`
  // (byte-unchanged above). Re-declared here beside census fixture 5(a) to prove the floor and the census
  // agree on the footgun; the floor test itself is untouched.
  const FLOOR_PATTERN = /\bagent\(\s*`/
  const fixture5a = 'agent(`bare untagged spawn ${x}`)'
  assert.match(fixture5a, FLOOR_PATTERN, 'census fixture 5(a) is exactly the bare-untagged-literal footgun the criterion-3 floor forbids')
  assert.doesNotMatch(src, FLOOR_PATTERN, 'the criterion-3 coverage floor still holds over live src (no bare agent(` literal) — the census extends, never replaces, it')
})

// ---------------------------------------------------------------------------
// Partial-phase recovery (spec §4.2/§4.3/§4.4): args.recovery derive-and-skip merged set,
// PLAN-DEFECT: sentinel → defectClass metadata, always-on STALE_REMOTE classification → env-blocked.
// ---------------------------------------------------------------------------

// A barrier mock keyed on the STABLE dispatchKind discriminator ('provision-barrier'), never the label
// prefix (lesson provision-phase-mocks-must-match-on-label-not-just-phase / spec criterion 8). Returns
// the given env-outcome for the barrier; everything else rides defaultImpl.
const barrierEnv = (env) => (prompt, opts) =>
  (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'provision-barrier') ? env : defaultImpl(prompt, opts)

test('recovery absent (criterion 10): the recovery machinery is DORMANT — every dispatched prompt is byte-identical to a sanctioned run EXCEPT the provision barrier; the always-on STALE_REMOTE clause rides both', async () => {
  const { calls: absent } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const { calls: sanctioned } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  assert.equal(absent.length, sanctioned.length, 'same dispatch count — the recovery machinery changes NO dispatch when the barrier reports nothing')
  for (let i = 0; i < absent.length; i++) {
    if (absent[i].opts.dispatchKind === 'provision-barrier') {
      assert.notEqual(absent[i].prompt, sanctioned[i].prompt, 'the provision-barrier prompt DIFFERS (derive-and-skip is added when sanctioned)')
    } else {
      assert.equal(absent[i].prompt, sanctioned[i].prompt, `prompt #${i} (${absent[i].opts.label}) is byte-identical between recovery-absent and sanctioned`)
    }
  }
  const bAbsent = absent.find(isProvision).prompt
  const bSanctioned = sanctioned.find(isProvision).prompt
  // The always-on stale-remote classification is the ONLY barrier delta from a pre-feature run — present regardless of recovery.
  assert.match(bAbsent, /STALE_REMOTE/, 'the always-on stale-remote classification rides the barrier even when recovery is absent')
  assert.match(bSanctioned, /STALE_REMOTE/, 'the always-on stale-remote classification rides the barrier when sanctioned too')
  // The derive-and-skip step is dormant without recovery, present with it (delete-the-feature: the two-run diff IS the derive step).
  assert.doesNotMatch(bAbsent, /SANCTIONED RECOVERY RELAUNCH|derive-then-cut/i, 'the derive-and-skip step is DORMANT when recovery is absent')
  assert.match(bSanctioned, /SANCTIONED RECOVERY RELAUNCH|derive-then-cut/i, 'the derive-and-skip step is present when sanctioned')
})

test('recovery reclaim pass-through: --reclaim-stale-remote rides each ensure-worktree line IFF recovery.reclaimStaleRemote', async () => {
  const { calls: noReclaim } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  const { calls: reclaim } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true, reclaimStaleRemote: true } }), defaultImpl)
  const bNo = noReclaim.find(isProvision).prompt
  const bYes = reclaim.find(isProvision).prompt
  assert.doesNotMatch(bNo, /--reclaim-stale-remote/, 'no --reclaim-stale-remote flag when reclaimStaleRemote is unset (sanctioned but not reclaiming)')
  assert.match(bYes, /ensure-worktree[^\n]*--reclaim-stale-remote/, 'the ensure-worktree line carries --reclaim-stale-remote when reclaimStaleRemote is set')
})

test('recovery preMerged (criterion 10): a mocked barrier preMerged id → merged (NOT landed status), done+succeeded+landed+auditLog, NO worker, NOT in gate-audit; a dep on it is not dep-failed', async () => {
  // PROVISION_ARGS: t1, t2(deps:['t1']). The barrier reports t1 already-integrated on the adopted branch.
  const { out, calls } = await runPhase(PROVISION_ARGS(), barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.equal(out.landDecision, 'landed', 'the recovered phase still lands (t1 pre-merged, t2 re-dispatched + merged)')
  assert.ok(out.landed.includes('t1'), 't1 is recorded in the bare-id landed list')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:t1'), 'NO worker dispatched for the pre-merged task t1')
  const entry = (out.auditLog || []).find(e => e && e.task === 't1')
  assert.ok(entry, 'an auditLog entry exists for the pre-merged t1')
  assert.match(String(entry.note || ''), /recovered: pre-merged on adopted integration branch/, 't1 auditLog entry carries the recovered note')
  // t2 (dep on the pre-merged t1) satisfies the dep-block pre-check and dispatches normally.
  assert.ok(calls.some(c => (c.opts.label || '') === 'work:t2'), 't2 (dep on pre-merged t1) IS dispatched — the dep-block pre-check passes (t1 in succeeded)')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't2' && e.reason === 'dep-failed'), 't2 is NOT spuriously dep-failed')
  // The pre-merged task ran no gate this run, so it is NOT in the gate-audit set (handoff tipSha fallback stays truthful).
  assert.ok(!calls.some(c => (c.opts.label || '') === 'gate-audit:t1:execution-evidence'), 'NO gate-audit seat for the pre-merged t1 (no gate ran for it this run)')
  // Criterion 11: the merged-set skip never skips the gate-audit for the re-dispatched task.
  assert.ok(calls.some(c => (c.opts.label || '') === 'gate-audit:t2:execution-evidence'), 't2 gate-audit IS still dispatched on the recovered phase (criterion 11)')
})

test('recovery all-pre-merged degenerate (criterion 11): endState claims + every task pre-merged → the End-state-only seat fires at the confirmed tip', async () => {
  // ES_ARGS is a single-task phase (t1) claiming End-state conditions. The barrier reports t1 pre-merged,
  // so mergedTasksForGateAudit is empty AND the phase claims conditions → the End-state-only seat branch fires.
  const { out, calls } = await runPhase(ES_ARGS(), barrierEnv({ ok: true, preMerged: ['t1'] }))
  assert.ok(out.landed.includes('t1'), 't1 recorded merged/landed (pre-merged)')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:t1'), 'no worker dispatched for the pre-merged task')
  const esSeat = calls.filter(c => (c.opts.label || '') === 'gate-audit:phase-3:end-state')
  assert.equal(esSeat.length, 1, 'exactly ONE End-state-only seat fires in the degenerate all-pre-merged case (the existing branch)')
})

test('recovery staleRemote (end-state 22): a mocked barrier staleRemote entry → per-task env-blocked (no worker), two-direction diagnostic + restore command; siblings dispatch; a dependent follows dep-failed; no phase halt; rides the return', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tStale', issue: 201, title: 'Stale task', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: 'tSib', issue: 202, title: 'Sibling', planSlice: 's2', roster: [{ lens: 'correctness' }] },
    { id: 'tDep', issue: 203, title: 'Dependent', planSlice: 's3', roster: [{ lens: 'correctness' }], deps: ['tStale'] },
  ] })
  // The barrier CONTINUED past tStale's STALE_REMOTE marker and reported it (mock keyed on the barrier dispatchKind).
  const { out, calls } = await runPhase(args, barrierEnv({ ok: true, staleRemote: [{ task: 'tStale', remoteSha: 'cafebabe', frozenTip: 'deadbeef' }] }))
  // tStale → the EXISTING per-task env-blocked status, worker never spawned.
  const eb = (out.escalated || []).find(e => e && e.task === 'tStale' && e.reason === 'env-blocked')
  assert.ok(eb, 'tStale is mapped to the existing per-task env-blocked status')
  assert.equal(eb.staleRemote, true, 'the escalation record is tagged staleRemote')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tStale'), 'NO worker dispatched for the stale-remote task')
  // Full two-direction diagnostic + the reversible restore command.
  const diag = String(eb.diagnostic || '')
  assert.match(diag, /git branch [^\n]*cafebabe/, 'diagnostic direction (a): adopt via git branch <branch> <remoteSha>')
  assert.match(diag, /--reclaim-stale-remote/, 'diagnostic direction (b): sanctioned --reclaim-stale-remote')
  assert.match(diag, /git push origin cafebabe:refs\/heads\//, 'diagnostic carries the reversible restore command')
  // Siblings dispatch normally; a dependent follows the EXISTING dep-failed semantics; no barrier halt.
  assert.ok(calls.some(c => (c.opts.label || '') === 'work:tSib'), 'the independent sibling dispatches normally (no barrier halt of the phase)')
  const dep = (out.escalated || []).find(e => e && e.task === 'tDep' && e.reason === 'dep-failed')
  assert.ok(dep, 'a dependent of the stale-remote task follows the existing dep-failed semantics')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tDep'), 'the dependent is NOT dispatched (dep-failed)')
  // The classification rides the machine-readable return; a hard dep-failed → held:escalation → handoff emitted.
  assert.ok((out.escalated || []).some(e => e && e.staleRemote), 'the stale-remote classification rides the machine-readable return')
  assert.ok(out.handoff, 'handoff emitted on held:escalation (the classification is handed off to the Lead)')
})

test('worktreeHygiene capture (D20, #1381): a mocked barrier worktreeHygiene array → ONE run-log summary line; visibility only — no auditLog entry, no routing change, workers dispatch, the phase lands', async () => {
  const rows = [
    { task: 't1', path: 'vendor/lib', action: 'repaired', detail: 'stale index.lock removed; submodule force-updated at the recorded gitlink SHA' },
    { task: 't2', path: 'vendor/lib', action: 'detected', detail: 'dirty submodule at a non-matching SHA — not auto-repaired' },
  ]
  const { out, calls, logs } = await runPhase(PROVISION_ARGS(), barrierEnv({ ok: true, worktreeHygiene: rows }))
  const hygieneLogs = logs.filter(l => typeof l === 'string' && l.startsWith('worktree hygiene (D20'))
  assert.equal(hygieneLogs.length, 1, 'exactly ONE census-safe run-log summary line (the Lead-visibility carrier)')
  assert.match(hygieneLogs[0], /repaired vendor\/lib \(task t1\)/, 'the line names the repaired path + task')
  assert.match(hygieneLogs[0], /detected vendor\/lib \(task t2\)/, 'the line names the detected path + task')
  // Fail-open, visibility only: no auditLog entry, no escalation, both workers dispatch, the phase lands.
  assert.ok(!(out.auditLog || []).some(e => e && /hygiene/i.test(String(e.verdict || ''))), 'no auditLog entry for hygiene findings')
  assert.ok(!(out.escalated || []).some(e => e && /hygiene/i.test(String(e.reason || ''))), 'no escalation — never a hold')
  assert.ok(calls.some(c => (c.opts.label || '') === 'work:t1') && calls.some(c => (c.opts.label || '') === 'work:t2'),
    'both workers dispatch — the capture never blocks or reorders tasks')
  assert.equal(out.landDecision, 'landed', 'no routing change — the phase lands')
  // Absent/empty array ⇒ no summary line (the non-empty gate).
  const { logs: quietLogs } = await runPhase(PROVISION_ARGS(), barrierEnv({ ok: true }))
  assert.ok(!quietLogs.some(l => typeof l === 'string' && l.startsWith('worktree hygiene (D20')), 'no line when the array is absent')
})

test('defectClass (criterion 12, wave-collector site): a worker blocked_reason prefixed PLAN-DEFECT: → escalation record defectClass:plan; sentinel kept inside blocked_reason; reason unchanged', async () => {
  const impl = (prompt, opts) =>
    (seatOf(opts) === 'war-worker' && opts.phase === 'Work')
      ? { task_id: 't1', status: 'blocked', blocked_reason: 'PLAN-DEFECT: the plan names a construct that cannot exist as described' }
      : defaultImpl(prompt, opts)
  const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's1', roster: [{ lens: 'correctness' }] }] })
  const { out } = await runPhase(args, impl)
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc, 't1 escalated')
  assert.equal(esc.defectClass, 'plan', 'defectClass is "plan" (the sentinel matched at position 0)')
  assert.equal(esc.reason, 'escalate', 'the escalation reason is UNCHANGED — defectClass is orthogonal metadata, not a reason')
  assert.match(String(esc.blocked), /^PLAN-DEFECT:/, 'the sentinel is LEFT inside blocked_reason (raw worker text is evidence, never stripped)')
  assert.equal(out.landDecision, 'held:escalation', 'the plan-defect block still holds the land (escalate is HARD)')
})

test('defectClass (criterion 12): NO sentinel (or a non-position-0 / case / whitespace variant) → defectClass ABSENT (never "implementation" by default); reason unchanged', async () => {
  // Strict, case-sensitive startsWith at position 0 — no trim, no case folding.
  for (const reason of ['an ordinary implementation block', ' PLAN-DEFECT: has a leading space', 'plan-defect: lowercase', 'see PLAN-DEFECT: mid-string']) {
    const impl = (prompt, opts) =>
      (seatOf(opts) === 'war-worker' && opts.phase === 'Work')
        ? { task_id: 't1', status: 'blocked', blocked_reason: reason }
        : defaultImpl(prompt, opts)
    const args = PROVISION_ARGS({ tasks: [{ id: 't1', issue: 101, title: 'T', planSlice: 's1', roster: [{ lens: 'correctness' }] }] })
    const { out } = await runPhase(args, impl)
    const esc = (out.escalated || []).find(e => e && e.task === 't1')
    assert.ok(esc, `t1 escalated (reason="${reason}")`)
    assert.ok(!('defectClass' in esc), `defectClass is ABSENT for a non-sentinel reason "${reason}" (never "implementation" by default)`)
    assert.equal(esc.reason, 'escalate', 'the escalation reason is unchanged')
  }
})

test('defectClass (criterion 12, floor sub-loop site): a blocked add-test fix-worker prefixed PLAN-DEFECT: → escalation defectClass:plan', async () => {
  // merge:t1 → no-test enters the floor sub-loop; the add-test fix-worker blocks with the sentinel.
  const impl = buildSeqImpl(
    {
      'merge:t1': [{ mode: 'merge-task', status: 'no-test' }],
      'add-test:t1:r1': [{ task_id: 't1', status: 'blocked', blocked_reason: "PLAN-DEFECT: the plan's specced mapped test cannot exist as described" }],
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
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc, 't1 escalated from the floor sub-loop')
  assert.equal(esc.defectClass, 'plan', 'a fix-round plan defect is tagged defectClass:plan (as plan-shaped as a first-round one)')
  assert.equal(esc.reason, 'escalate', 'the floor-sub-loop escalation reason is unchanged')
})

test('defectClass: the PLAN-DEFECT: sentinel is a SINGLE shared JS constant used by BOTH the prompt sentence AND the check (single-source contract)', () => {
  assert.match(src, /const PLAN_DEFECT_SENTINEL = 'PLAN-DEFECT:'/, 'PLAN_DEFECT_SENTINEL is the one shared constant')
  assert.match(src, /\.startsWith\(PLAN_DEFECT_SENTINEL\)/, 'the check uses the shared constant (strict startsWith at position 0)')
  assert.match(src, /\$\{PLAN_DEFECT_SENTINEL\}/, 'the worker-prompt sentence interpolates the SAME constant (single-source token)')
  // defectClass must never leak into the land/escalation enums (ADR 0005 — Task 3 owns the negative guard).
  assert.ok(!HARD_ESCALATION_REASONS.includes('plan-defect') && !HARD_ESCALATION_REASONS.includes('plan'),
    'defectClass value is not a HARD_ESCALATION_REASONS member')
  assert.ok(!KNOWN_LAND_DECISIONS.includes('held:plan-defect') && !KNOWN_LAND_DECISIONS.includes('plan-defect'),
    'defectClass value is not a KNOWN_LAND_DECISIONS member')
})

// --- Both-surfaces token tests (criterion 14): the two new worker sentences + the refiner-card
// STALE_REMOTE carve-out are on their standing card AND their dispatched prompt (the D3-registry idiom:
// a casing/position-stable mid-sentence fragment, never a quote/backtick byte literal; delete-the-feature
// per surface proves the anchor is non-vacuous). Not new inline mirrors of a canonical export — no D2 row owed.

test('both-surfaces (criterion 14): the PLAN-DEFECT: sentinel sentence is on agents/war-worker.md AND the dispatched worker prompt; delete-the-feature per surface', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const w = calls.find(isWorker)
  assert.ok(w, 'a worker was dispatched (presence guard)')
  const FRAG = 'a specced construct cannot exist as described'   // mid-sentence, no quote/backtick byte literal
  const surfaces = [['war-worker.md', workerMd], ['dispatched worker prompt', w.prompt]]
  for (const [name, text] of surfaces) {
    assert.ok(text.includes(FRAG), `${name} carries the plan-defect sentinel sentence`)
    assert.ok(!text.split(FRAG).join('REMOVED').includes(FRAG), `${name}: deleting the sentence reds the anchor (non-vacuous)`)
    assert.ok(text.includes('PLAN-DEFECT:'), `${name} names the literal sentinel token the worker prefixes`)
  }
})

test('both-surfaces (criterion 14): the stale-prior-attempt push-handoff sentence is on agents/war-worker.md AND the dispatched dep-clause worker prompt; delete-the-feature per surface', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  // The sentence rides depClause (adjacent to FORCE_WITH_LEASE_RULE), so it is on a deps-bearing worker (work:t2).
  const w2 = calls.find(c => isWorker(c) && (c.opts.label || '') === 'work:t2')
  assert.ok(w2, 'the deps-bearing worker was dispatched (presence guard)')
  const FRAG = 'the remote task branch was never merged and shares only an older base is a stale prior attempt'
  const surfaces = [['war-worker.md', workerMd], ['dispatched dep-clause worker prompt', w2.prompt]]
  for (const [name, text] of surfaces) {
    assert.ok(text.includes(FRAG), `${name} carries the stale-prior-attempt sentence`)
    assert.ok(!text.split(FRAG).join('REMOVED').includes(FRAG), `${name}: deleting the sentence reds the anchor (non-vacuous)`)
  }
  // FORCE_WITH_LEASE_RULE stays byte-identical (its own byte-compare test is untouched) — the stale sentence is ADJACENT, not a rewrite.
  const RULE = 'You may `git push --force-with-lease` ONLY your own task branch, and ONLY after a dispatch-rebase diverged it from its pushed remote — never any other ref, never for any other reason.'
  assert.ok(w2.prompt.includes(RULE), 'the force-with-lease rule stays byte-identical adjacent to the new sentence')
})

test('both-surfaces (criterion/end-state 22): the STALE_REMOTE classify-and-continue carve-out is on agents/war-refiner.md AND the dispatched barrier prompt; delete-the-feature per surface', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const barrier = calls.find(isProvision)
  assert.ok(barrier, 'the barrier was dispatched (presence guard)')
  const ANCHORS = [/STALE_REMOTE/, /classify-and-continue/i, /marker token is the key, never the numeric/i, /staleRemote/]
  const surfaces = [['war-refiner.md', refinerMd], ['dispatched barrier prompt', barrier.prompt]]
  for (const [name, text] of surfaces) {
    for (const re of ANCHORS) assert.match(text, re, `${name} carries the STALE_REMOTE carve-out anchor ${re}`)
    // delete-the-feature: strip the carve-out's distinctive shared phrase (global) → the anchor reds.
    const mutated = text.replace(/marker token is the key, never the numeric/gi, 'REMOVED')
    assert.doesNotMatch(mutated, /marker token is the key, never the numeric/i, `${name}: removing the carve-out phrase reds the anchor (non-vacuous)`)
  }
})

// D20 (#1381), modelled on the STALE_REMOTE row above: the WORKTREE_HYGIENE capture is a deliberate
// cross-task literal coupling (the plan's D20 row is the canonical source of the marker token and the
// "repaired"|"detected" value set) — a presence grep is not a drift guard (ADR 0025), so both surfaces
// pin the token skeleton and a delete-the-feature per surface proves the anchors non-vacuous.
test('both-surfaces (D20, #1381): the WORKTREE_HYGIENE capture is on agents/war-refiner.md AND the dispatched barrier prompt; delete-the-feature per surface', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const barrier = calls.find(isProvision)
  assert.ok(barrier, 'the barrier was dispatched (presence guard)')
  const ANCHORS = [/WORKTREE_HYGIENE/, /worktreeHygiene/, /"repaired"\|"detected"/, /markers ride a zero exit/i]
  const surfaces = [['war-refiner.md', refinerMd], ['dispatched barrier prompt', barrier.prompt]]
  for (const [name, text] of surfaces) {
    for (const re of ANCHORS) assert.match(text, re, `${name} carries the WORKTREE_HYGIENE capture anchor ${re}`)
    // delete-the-feature: strip the capture's distinctive shared phrase (global) → the anchor reds.
    const mutated = text.replace(/markers ride a zero exit/gi, 'REMOVED')
    assert.doesNotMatch(mutated, /markers ride a zero exit/i, `${name}: removing the capture phrase reds the anchor (non-vacuous)`)
  }
})

// ---------------------------------------------------------------------------
// Task 5.1 (prompt-surface simplification): the worker/servitor cards' tier>=2
// blocks moved to skills/war/references/worker-servitor-edges.md. Relocated
// presence keys (adjudication E — the keys move with the text): one distinctive
// fragment per moved block must exist at the destination; each card must keep
// (a) a trigger pointer routing to the destination and (b) the decisive rule
// inline (foreign-target-repo lesson: a references/ pointer is best-effort
// enrichment on a non-plugin target repo, never the sole carrier of a
// blocking rule).
// ---------------------------------------------------------------------------
test('Task 5.1 — worker/servitor card evictions: destination carries the moved blocks; cards keep trigger pointers + decisive rules inline', () => {
  const edges = readFileSync(join(here, '../references/worker-servitor-edges.md'), 'utf8')
  for (const frag of [
    'the worktree is a standalone checkout of the submodule',       // worker §Submodule task mechanics
    "find the dep task's entry, read its `merge_sha`",              // worker §Gitlink-bump task mechanics (ledger step)
    'preserving the Container/Contents distinction',                // worker §Gitlink-bump commit step
    'This allowlist is the **primary confinement**',                // worker §Servitor confinement
    'never move a lesson between hot and `archive/`',               // servitor §Archived lessons
  ]) assert.ok(edges.includes(frag), `worker-servitor-edges.md carries the moved fragment: ${frag}`)
  // Trigger pointers route each card to the destination — the ratified plugin-root-anchored
  // family shape (ADR 0047, agent-card-pointer-skeleton-plugin-root-anchored): a
  // ](${CLAUDE_PLUGIN_ROOT}/skills/war/references/<file>) target resolving against the plugin
  // install root regardless of the dispatched seat's cwd, never `../`-prefixed. Adjudication
  // O(1) still stands: a pointer is best-effort enrichment, decisive rules stay inline.
  assert.equal((workerMd.match(/\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/worker-servitor-edges\.md\)/g) || []).length, 3,
    'war-worker.md carries all three plugin-root-anchored trigger pointers to worker-servitor-edges.md')
  assert.match(servitorMd, /\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/worker-servitor-edges\.md\)/,
    'war-servitor.md carries a plugin-root-anchored trigger pointer to worker-servitor-edges.md')
  // Shape-generic absence: NO references/ pointer on either card may be
  // ../-prefixed, at any depth (the anchored family shape carries no ../).
  assert.ok(!/\((?:\.\.\/)+[^)]*skills\/war\/references\/[^)]+\)/.test(workerMd),
    'war-worker.md: no references/ pointer uses a forbidden ../-prefixed path, at any depth')
  assert.ok(!/\((?:\.\.\/)+[^)]*skills\/war\/references\/[^)]+\)/.test(servitorMd),
    'war-servitor.md: no references/ pointer uses a forbidden ../-prefixed path, at any depth')
  // Guard-family extension to agents/war-auditor.md (references-pointer-link-truth Task 1.1;
  // source spec docs/specs/2026-08-02-references-pointer-link-truth-design.md §4.1): the
  // family pointer skeleton binds EVERY agent card, not just the two Task 5.1 touched, so the
  // same shape-generic ../-absence pattern applies to the auditor card. Paired with a
  // COUNT-pinned assert (the refiner-card idiom, not presence-only: a presence match stays
  // green when pointers are silently dropped). Update duty: a future plan that legitimately
  // adds an Nth auditor-teach.md pointer — or drops one — updates this count in the same diff
  // as the pointer change.
  assert.ok(!/\((?:\.\.\/)+[^)]*skills\/war\/references\/[^)]+\)/.test(auditorMd),
    'war-auditor.md: no references/ pointer uses a forbidden ../-prefixed path, at any depth')
  assert.equal((auditorMd.match(/\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/war\/references\/auditor-teach\.md\)/g) || []).length, 4,
    'war-auditor.md carries all four plugin-root-anchored trigger pointers to auditor-teach.md')
  // …and to war-refiner.md (family locality, ADR 0025/0031: the equivalence class is "agent
  // cards carrying skills/war/references/ pointers", and every member is asserted where the
  // family lives): this assert consolidates the pointer-shape family here, alongside the
  // pre-existing Task 1.2 grep-parity count-pin + ../-absence pair — a deliberate duplicate
  // for locality, not the sole hold. The refiner card's one ../-prefixed link is an ADR link
  // (`../docs/adr/0001-…`), which correctly resolves from agents/ and carries no
  // skills/war/references/ segment, so this pattern does not flag it.
  assert.ok(!/\((?:\.\.\/)+[^)]*skills\/war\/references\/[^)]+\)/.test(refinerMd),
    'war-refiner.md: no references/ pointer uses a forbidden ../-prefixed path, at any depth')
  // agents/war-setup-scout.md joined the family with its two links repaired in the same diff
  // (#1278; the deliberate exclusion is retired): both its skills/-targeting links carry the
  // anchored form — count-pinned, with the ../-absence widened to ANY skills/ path because its
  // provision.mjs link lives outside skills/war/references/.
  const setupScoutMd = readFileSync(join(here, '../../../agents/war-setup-scout.md'), 'utf8')
  assert.equal((setupScoutMd.match(/\]\(\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/[^)]+\)/g) || []).length, 2,
    'war-setup-scout.md carries both plugin-root-anchored links (provision.mjs + schemas.md)')
  assert.ok(!/\((?:\.\.\/)+[^)]*skills\/[^)]+\)/.test(setupScoutMd),
    'war-setup-scout.md: no skills/-targeting link uses a forbidden ../-prefixed path, at any depth')
  // OLD-shape-absent gate (default-flip discipline, war-strategy authoring rule 6): a
  // count-pin on the new form alone stays green when a stale bare pointer is ADDED beside the
  // pinned ones, so every card is also scanned for the retired bare link-target shape.
  for (const [cardName, cardText] of [['war-auditor.md', auditorMd], ['war-worker.md', workerMd],
    ['war-refiner.md', refinerMd], ['war-servitor.md', servitorMd], ['war-setup-scout.md', setupScoutMd]]) {
    assert.ok(!cardText.includes('](skills/'),
      cardName + ': carries the retired OLD-shape bare link target "](skills/" — the ratified family shape is "](${CLAUDE_PLUGIN_ROOT}/skills/…" (ADR 0047)')
  }
  // Decisive rules survive inline on the cards (pointer = enrichment, never sole carrier).
  assert.match(workerMd, /merge_sha/, 'war-worker.md keeps the ledger merge_sha authority rule inline')
  assert.match(workerMd, /gitlink-only/, 'war-worker.md keeps the gitlink-only diff rule inline')
  assert.match(workerMd, /own remote, not the superproject/,
    'war-worker.md keeps the submodule remote-identity check inline')
  assert.match(workerMd, /primary confinement/,
    'war-worker.md keeps the servitor primary-confinement summary inline')
  assert.match(servitorMd, /never move a lesson between hot and `archive\/`/,
    'war-servitor.md keeps the hot/archive temperature prohibition inline')
})

// ===========================================================================
// D6 (Task 1.2, #1245) — RE-LAND ARM SYMMETRY
// ---------------------------------------------------------------------------
// The initial land holds this property BY CONSTRUCTION: its dispatch result IS the
// outer land result, so a 2B PR-and-hold there leaves the PR ref readable on the phase
// return. Each re-land arm instead dispatches into its OWN local receiver, so it must
// reassign the outer variable by hand inside its 2B guard branch — an arm that only
// records the escalation leaves the phase returning the stale earlier attempt while the
// escalation record says otherwise.
//
// The key is a COUNT over SHAPE-DISCOVERED arms, never over hardcoded labels: a third
// re-land flavor carries a third label, so an extraction keyed on today's two literals
// could not see it and would read 2 === 2 forever no matter how many unmirrored arms
// were added — structurally vacuous, with none of the non-vacuity this pin is sold on.
// The discovery keys on the ':<flavor>-proceed' suffix, which by construction excludes
// the initial land's suffix-less label. The guard's OWN patterns are fragment-built (the
// stem + phase-id + flavor constants below), so a future sweep for a label or for the
// policed assignment cannot self-match on the guard's patterns. The file's
// known contiguous label copies live elsewhere — the #931 LITERAL_REGISTRY's dispatch-site
// rows (the two re-land arm rows included) quote each site's label bytes as their literal
// heads (named by construct; no label byte is quoted here) — and a sweep must account for
// those rows, not for this guard.
// ---------------------------------------------------------------------------
const RELAND_LABEL_STEM = String.raw`land:phase-`
const RELAND_LABEL_PHID = String.raw`\$\{ph\.id\}`
// ANY '-proceed' flavor — the shape key that makes a mirrored third arm discoverable.
const RELAND_LABEL_FLAVOR = String.raw`:[a-z][a-z-]*-proceed`
const RELAND_LABEL_RE = new RegExp(RELAND_LABEL_STEM + RELAND_LABEL_PHID + RELAND_LABEL_FLAVOR, 'g')
// The arm's 2B guard opener, identifier-GENERIC: the backreference binds one receiver
// name to itself, so whatever local name a future arm picks is the name its reassignment
// is then checked against.
const SUBMOD_GUARD_RE = new RegExp(
  String.raw`if \(\s*(\w+)\s*&&\s*\1\.status\s*===\s*'submodule-pr'\s*\)\s*\{`)
const outerAssignRe = (receiver) => new RegExp(String.raw`landResult\s*=\s*` + receiver + String.raw`\b`)

// End of a guard branch = its matching close brace. Template-literal `${…}` spans are
// themselves brace-balanced, so a plain depth count is exact over these bodies.
const braceSpan = (text, open) => {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}' && --depth === 0) return i + 1
  }
  return -1
}

// Region boundary (explicit): each arm's search region is right-bounded — it runs from its
// matched dispatch label to the next label match (end-of-text only for the last arm), so a
// guardless arm can never borrow a later sibling's guard (#1373/#1286 — the EOF-slice borrow).
// Within that bounded region, `region` ends at the arm's own 2B guard-branch close and
// `branch` is the guard branch alone — the body the reassignment duty is measured on.
// Parameterized over `text` (default: the live template) so the mutation probes below run
// the IDENTICAL extraction over a mutated copy.
const relandSubmodArms = (text = src) =>
  [...text.matchAll(RELAND_LABEL_RE)].map((m, i, all) => {
    const next = all[i + 1]
    const after = text.slice(m.index, next ? next.index : text.length)
    const g = after.match(SUBMOD_GUARD_RE)
    if (!g) return { label: m[0], guarded: false, region: null, branch: null, receiver: null, assigns: false }
    const open = g.index + g[0].length - 1
    const end = braceSpan(after, open)
    return {
      label: m[0],
      guarded: true,
      region: end === -1 ? null : after.slice(0, end),
      branch: end === -1 ? null : after.slice(g.index, end),
      receiver: g[1],
      assigns: end !== -1 && outerAssignRe(g[1]).test(after.slice(g.index, end)),
    }
  })

test('D6 (#1245) — re-land arm symmetry: every re-land 2B guard branch reassigns the outer land result, as the initial land does by construction', () => {
  const arms = relandSubmodArms()
  // >= 2 floor: a 0 === 0 or 1 === 1 degenerate green (extraction matching nothing after a
  // future label rename) is impossible.
  assert.ok(arms.length >= 2,
    `re-land dispatch discovery found ${arms.length} arm(s) in the template source; the engine dispatches at least two bounded re-land flavors (the environment-class and the baseline-class retry), so a lower count means the discovery shape stopped tracking the labels and every count keyed on it is degenerate`)
  const unguarded = arms.filter(a => !a.guarded)
  assert.equal(unguarded.length, 0,
    `a re-land arm dispatches with no 2B PR-and-hold guard branch following it, so the hold it takes cannot carry the PR ref: ${unguarded.map(a => a.label).join(', ')}`)
  const unlocatable = arms.filter(a => a.guarded && a.branch === null)
  assert.equal(unlocatable.length, 0,
    `a re-land 2B guard branch never closes — the extraction ran past the end of the arm's bounded region and its reassignment duty is unmeasured: ${unlocatable.map(a => a.label).join(', ')}`)
  const missing = arms.filter(a => !a.assigns)
  assert.equal(missing.length, 0,
    `re-land arm symmetry broken — ${arms.length - missing.length} of ${arms.length} re-land 2B guard branches reassign the outer land result to their own dispatched re-land result; these do not: ${missing.map(a => a.label).join(', ')}. The initial land is the model: its dispatch result IS the outer land result, so its 2B hold leaves the PR ref readable on the phase return. An arm that records only the escalation returns the stale earlier attempt instead. Every re-land arm owes that reassignment beside its escalation record.`)
})

test('D6 (#1245) — both ways: a third re-land arm mirrored from a live one WITHOUT the reassignment reds the count (the two-literal extraction this supersedes could not see it at all)', () => {
  const live = relandSubmodArms()
  const donor = live[0]
  assert.ok(donor && donor.region, 'a live re-land arm is available as the mirror donor')
  assert.ok(donor.assigns,
    `the mirror donor (${donor.label}) must itself be symmetric, else stripping its reassignment is not a real mutation and this probe proves nothing`)
  // Mirror the donor's OWN bytes under a third flavor and strip only the reassignment —
  // the exact regression this pin exists to catch. Fixture text only: it is appended to an
  // in-memory copy, never wired into a live surface and never written to disk.
  const thirdLabel = donor.label.replace(/-proceed$/, '-probe-proceed')
  const strippedRegion = donor.region
    .split(donor.label).join(thirdLabel)
    .replace(outerAssignRe(donor.receiver), '/* reassignment omitted (fixture) */')
  assert.ok(strippedRegion.includes(thirdLabel),
    'the fixture carries the third flavor, so it is discovered as a SEPARATE arm rather than shadowing the donor')
  assert.ok(!outerAssignRe(donor.receiver).test(strippedRegion),
    "the fixture strip actually removed the donor arm's reassignment")
  const mutated = src + '\n// D6 FIXTURE (never executed): a third re-land arm mirrored from a live one.\n' + strippedRegion + '\n'

  const arms = relandSubmodArms(mutated)
  assert.equal(arms.length, live.length + 1,
    `the shape-keyed discovery must SEE the mirrored third arm — expected ${live.length + 1} arms, found ${arms.length} (${arms.map(a => a.label).join(', ')}); an extraction keyed on today's two labels would have found only ${live.length}, which is the vacuity this key supersedes`)
  const unsym = arms.filter(a => !a.assigns).map(a => a.label)
  assert.equal(unsym.join('|'), thirdLabel,
    `exactly the mirrored arm must be reported unsymmetric — expected [${thirdLabel}], got [${unsym.join(', ')}]; if it is empty the live assertion above is vacuous, and if it names a live arm the fixture perturbed a real one`)
})

// D2 (#1373/#1286) — guardless-arm negative reference for the region bound above: a guardless arm
// placed BEFORE a guarded sibling is the exact shape the unbounded EOF slice mis-read as guarded
// (the borrow). Demonstrated-RED (recorded 2026-08-17): reverting `after` to the unbounded
// label-to-end-of-text slice in a scratch copy flipped this fixture arm to guarded:true — it
// borrowed the first live arm's 2B guard and receiver — and this test went red on the
// guarded:false assert; the bounded slice restored it green with every live arm byte-unchanged.
test('D2 (#1373/#1286) — both ways: a guardless -proceed arm spliced BEFORE the first live arm reports guarded:false; the bounded region never borrows the sibling guard that follows it', () => {
  const live = relandSubmodArms()
  const donor = live[0]
  assert.ok(donor && donor.label, 'a live re-land arm is available as the label donor')
  // Fixture-flavor hygiene (Context 9): the label is DERIVED at runtime from the donor's matched
  // bytes — no contiguous label literal enters this file — and its flavor is distinct from both
  // live flavors and from the mirrored '-probe-proceed' fixture in the test above.
  const guardlessLabel = donor.label.replace(/:[a-z][a-z-]*-proceed$/, ':guardless-proceed')
  assert.notEqual(guardlessLabel, donor.label, 'the flavor replace actually produced a new label')
  assert.ok(!live.some(a => a.label === guardlessLabel)
    && guardlessLabel !== donor.label.replace(/-proceed$/, '-probe-proceed'),
    'the guardless fixture flavor is distinct from both live arms and from the -probe-proceed fixture')
  // Splice a dispatch-label line with NO guard branch immediately BEFORE the first live label —
  // in-memory copy only, never wired into a live surface and never written to disk.
  const firstIdx = [...src.matchAll(RELAND_LABEL_RE)][0].index
  const fixture = '\n// D2 FIXTURE (never executed): a guardless re-land arm — no 2B guard branch in its region.\n'
    + 'const guardlessProbe = { label: `' + guardlessLabel + '` }\n'
  const mutated = src.slice(0, firstIdx) + fixture + src.slice(firstIdx)

  const arms = relandSubmodArms(mutated)
  assert.equal(arms.length, live.length + 1,
    `the discovery must SEE the spliced guardless arm — expected ${live.length + 1} arms, found ${arms.length} (${arms.map(a => a.label).join(', ')})`)
  assert.equal(arms[0].label, guardlessLabel,
    'the spliced fixture is discovered as the FIRST arm (it precedes every live arm)')
  const unguarded = arms.filter(a => !a.guarded).map(a => a.label)
  assert.equal(unguarded.join('|'), guardlessLabel,
    `exactly the guardless fixture arm reports guarded:false — got [${unguarded.join(', ')}]; a guarded:true read here is the EOF-slice borrow (#1373/#1286): the arm's region held no guard, so a guard match could only have come from PAST the next label`)
  assert.deepEqual(arms.slice(1), live,
    'every live arm is reported byte-unchanged — the fixture perturbed nothing outside its own region')
})

// ===========================================================================
// Phase 2 Task 2.1 — engine truth hardening (#1395 a/b, #1411 c, #1413 d, #1430 f, #1410 g)
// ---------------------------------------------------------------------------

// (a) #1395 fix 2 — provision-before-checks: the land-barrier endstate-check dispatch applies the
// phase's run.provision steps in _refinery BEFORE any check: command, fail-open (a red provision
// step records into the artifact preamble and every check still runs — no new hold path); a
// provision-less run dispatches a clause-free prompt (set-minus byte-compat).
test('Task 2.1(a) #1395 — endstate-check dispatch instructs provision-before-checks in _refinery BEFORE any check command, fail-open; provision-less prompt is clause-free', async () => {
  const PROV = ['pnpm install --frozen-lockfile']
  const { calls } = await runPhase(ES_ROW_ARGS({ run: { provision: PROV, provisionSource: 'ci' } }), gateAuditImpl)
  const es = calls.find(isEndstateCheck)
  assert.ok(es, 'endstate-check dispatch present (presence guard)')
  const p = es.prompt
  assert.match(p, /provision-before-checks/, 'the dispatch carries the provision-before-checks clause (#1395)')
  assert.ok(p.includes(PROV[0]), 'the pinned provision list rides the dispatch verbatim')
  const provIdx = p.indexOf('provision-before-checks')
  const cmdIdx = p.indexOf(`${REFINERY}/.war/endstate-3-1.cmd`)
  assert.ok(provIdx !== -1 && cmdIdx !== -1 && provIdx < cmdIdx,
    'the provision steps are instructed BEFORE the first check-command row (provision-before-checks ordering)')
  assert.match(p, /provision_red/, 'a red provision step is recorded into the artifact preamble (the provision_red line)')
  assert.match(p, /never fails this dispatch and never holds the land/i, 'fail-open — a provision red never fails the dispatch, never a new hold path')
  // Cleanliness contract (relaunch fix): the steps run in the SHARED _refinery worktree the land
  // dispatch later merges/checks-out in, so the clause requires tracked files restored BEFORE any
  // check runs — resolving the contradiction with the do-NOT-edit-tracked-files sentence above it.
  assert.match(p, /leave the worktree CLEAN before any check runs/,
    'the clause carries the cleanliness contract — provision steps restore the shared worktree before any check')
  assert.ok(p.includes(`git -C ${REFINERY} checkout -- .`),
    'the restore recipe is concrete: git checkout -- . in _refinery after steps that mutate tracked files')
  assert.match(p, /untracked build output is fine/, 'untracked build output is explicitly exempt (only tracked mutations are restored)')
  const cleanIdx = p.indexOf('leave the worktree CLEAN')
  assert.ok(cleanIdx !== -1 && cleanIdx < cmdIdx,
    'the cleanliness contract is stated BEFORE the first check-command row (clean before any check runs)')
  const { calls: c2 } = await runPhase(ES_ROW_ARGS(), gateAuditImpl)
  assert.ok(!c2.find(isEndstateCheck).prompt.includes('provision-before-checks'),
    'a provision-less run dispatches a clause-free prompt (set-minus byte-compat)')
})

// (b) #1395 fix 1 — environment-red attestation: the shared endStateBlock instructs the seats that
// an artifact present, readable, and correctly tip-stamped but red for ENVIRONMENTAL reasons attests
// 'unverified', never 'unmet'; and an attested-unverified env-red condition derives 'unverified' in
// the handoff (the engine never converts it to unmet).
test('Task 2.1(b) #1395 — the endStateBlock carries the environmental-red classification (unverified, never unmet); an env-red attestation derives unverified in the handoff', async () => {
  const impl = (prompt, opts) => {
    if ((opts.label || '').startsWith('gate-audit:')) {
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', confidence: 'high', findings: [],
        endStateAttestations: [{ condition: ES_ROWS[0].condition, status: 'unverified',
          evidence: 'artifact present, readable, correctly tip-stamped; red is environmental — ModuleNotFoundError: No module named wibble (setup failure, not an evaluated-false condition)' }] }
    }
    return gateAuditImpl(prompt, opts)
  }
  const { out, calls } = await runPhase(ES_ROW_ARGS(), impl)
  const seatP = gateAuditCalls(calls)[0].prompt
  assert.match(seatP, /RED for ENVIRONMENTAL reasons/, 'the shared endStateBlock names the environmental-red class')
  assert.match(seatP, /ModuleNotFoundError/, 'the classification names the observed environment-red shapes (import/setup/collection failures)')
  assert.ok(seatP.includes("attests 'unverified', NEVER 'unmet'"), "the instruction is explicit: 'unverified', NEVER 'unmet'")
  assert.ok(out.handoff, 'handoff emitted (presence guard)')
  const row = out.handoff.endState.find(e => e.condition === ES_ROWS[0].condition)
  assert.equal(row && row.status, 'unverified', 'an environment-red attestation lands unverified in the handoff — never unmet')
})

// (c) #1411 — infra-death classification: a post-spawn API/quota/transport death classifies
// 'env-died' (SOFT — the env-blocked sibling) with the harness cause propagated into blocked; the
// phase LANDS minus the dead task; an env-died-only phase is never a hard escalation.
test('Task 2.1(c) #1411 — a post-spawn infra death classifies env-died with the harness cause in blocked; the phase LANDS minus the dead task', async () => {
  const impl = (prompt, opts) => {
    if ((opts.label || '') === 'work:tDead') throw new Error('API error: session limit reached (resets 6pm)')
    return defaultImpl(prompt, opts)
  }
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tDead', issue: 1, title: 'dies post-spawn', planSlice: 's', roster: [{ lens: 'correctness' }] },
    { id: 'tLive', issue: 2, title: 'merges', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out, logs } = await runPhase(args, impl)
  const esc = (out.escalated || []).find(e => e && e.task === 'tDead')
  assert.ok(esc, 'the dead task escalates (presence guard)')
  assert.equal(esc.reason, 'env-died', 'the classification is env-died, not the generic escalate')
  assert.match(String(esc.blocked), /^worker died: /, 'blocked carries the worker-died prefix (#1411 fix 1 — cause propagation)')
  assert.match(String(esc.blocked), /session limit/, 'the harness failure cause is propagated verbatim')
  assert.equal(out.landDecision, 'landed', 'env-died is SOFT (a SOFT_ENV_REASONS member) — the phase LANDS minus the dead task')
  assert.ok(out.landed.includes('tLive') && !out.landed.includes('tDead'), 'the sibling lands; the dead task does not')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('env-died')), 'the classification is log()ged (never silent)')
})

test('Task 2.1(c) #1411 — an env-died-only phase (nothing merged) reads held:nothing-merged, never held:escalation', async () => {
  const impl = (prompt, opts) => {
    if (seatOf(opts) === 'war-worker' && opts.phase === 'Work') throw new Error('fetch failed: 529 overloaded (transport error)')
    return defaultImpl(prompt, opts)
  }
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 1, title: 'a', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'held:nothing-merged', 'infra deaths are never a hard escalation — nothing merged reads held:nothing-merged')
  assert.ok((out.escalated || []).length > 0 && out.escalated.every(e => e.reason === 'env-died'), 'every escalation is env-died')
})

// (c) relaunch fix — STRUCTURAL dispatch-layer scoping (the both-ways proof, other direction): an
// engine-authored HARD throw that EMBEDS worker-supplied text matching INFRA_DEATH_RE (here a
// reported path containing "quota", thrown by normalizeReportedPaths OUTSIDE the agent() dispatch)
// must stay HARD 'escalate' — a message-only classification would launder it into SOFT env-died and
// flip a hard escalation into lands-minus-task. The dispatch-originated fixtures above are the
// matching direction: a throw crossing the agent() boundary still classifies env-died.
test('Task 2.1(c) #1411 relaunch — an engine throw whose message contains "quota" but originates OUTSIDE the dispatch stays HARD escalate, never env-died', async () => {
  const impl = (prompt, opts) => (seatOf(opts) === 'war-worker' && opts.phase === 'Work')
    // outside BOTH roots (worktreeRoot AND mainCheckout) → normalizeReportedPaths arm (d) throws an
    // ENGINE error with the worker-supplied path — and its infra words — embedded in the message.
    ? { task_id: 'tQ', status: 'implemented', head_sha: 'abc', tests: {}, files_changed: ['/opt/elsewhere/quota-overloaded.txt'] }
    : defaultImpl(prompt, opts)
  const args = PROVISION_ARGS({ tasks: [
    { id: 'tQ', issue: 1, title: 'reports a path embedding infra words', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out } = await runPhase(args, impl)
  const esc = (out.escalated || []).find(e => e && e.task === 'tQ')
  assert.ok(esc, 'the task escalates (presence guard)')
  assert.match(String(esc.blocked), /quota/, 'non-vacuity guard: the HARD message really carries an INFRA_DEATH_RE word')
  assert.equal(esc.reason, 'escalate', 'the engine throw keeps its HARD class — message content alone never classifies env-died (structural scoping)')
  assert.equal(out.landDecision, 'held:escalation', 'the phase HOLDS — the laundering path (env-died → lands-minus-task) is closed')
})

// (c)(ii) drift-guard extension: SOFT_ENV_REASONS is canonical in land-decision.mjs, hand-mirrored in
// workflow-template.js (the D2 registry row deepEquals them); env-died is ABSENT from both
// HARD_ESCALATION_REASONS copies (ADR 0005's infra-stays-soft line, End state 29's hand-verify made mechanical).
test('Task 2.1(c)(ii) #1411 — SOFT_ENV_REASONS pins the pair in both copies; env-died is absent from both HARD_ESCALATION_REASONS literals', () => {
  assert.deepEqual(SOFT_ENV_REASONS, ['env-blocked', 'env-died'], 'canonical SOFT_ENV_REASONS pins the pair')
  const inlineSoft = src.match(/const\s+SOFT_ENV_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(inlineSoft, 'inline SOFT_ENV_REASONS mirror present in workflow-template.js')
  assert.deepEqual(JSON.parse(inlineSoft[1].replace(/'/g, '"')), SOFT_ENV_REASONS, 'the inline mirror equals the canonical export')
  assert.ok(!HARD_ESCALATION_REASONS.includes('env-died'), 'env-died is NEVER a HARD_ESCALATION_REASONS member (canonical copy)')
  const inlineHard = src.match(/const\s+HARD_ESCALATION_REASONS\s*=\s*(\[[^\]]+\])/)
  assert.ok(inlineHard, 'inline HARD_ESCALATION_REASONS mirror present (anchor guard)')
  assert.ok(!JSON.parse(inlineHard[1].replace(/'/g, '"')).includes('env-died'), 'env-died is NEVER in the inline HARD_ESCALATION_REASONS mirror')
})

// (d) #1413 — args provenance floor: refuse at entry, fail-closed, zero agent spawns.
test('Task 2.1(d) #1413 — a foreign-plan intent is refused at entry (foreign docs/plans identifier), zero agent spawns; a token-less intent fails the own-token floor', async () => {
  // The plan-3 leak shape: a plan-A launch (slug wtprov-a) carrying plan-B's intent (13 × escape, 0 × done-when).
  const leakIntent = 'Purpose: the escape-guard exit contract holds.\nEnd state: 1. docs/plans/2026-08-06-escape-guard-exit-contract.md fully landed.'
  const { out, agentCalls } = await runCounting(PROVISION_ARGS({ intent: leakIntent }))
  assert.equal(out.landDecision, 'held:workflow-error', 'the leak is refused at entry')
  assert.match(out.workflowError.message, /foreign docs\/plans/, 'the refusal names the foreign docs/plans identifier class')
  assert.match(out.workflowError.message, /escape-guard-exit-contract\.md/, 'the refusal cites the foreign identifier itself')
  assert.equal(agentCalls, 0, 'zero agents dispatched — the floor is at entry (#1413: refuse, never warn)')
  const { out: o2, agentCalls: a2 } = await runCounting(PROVISION_ARGS({ intent: 'Purpose: ship the completely unrelated gizmo.' }))
  assert.equal(o2.landDecision, 'held:workflow-error', 'a token-less intent is refused')
  assert.match(o2.workflowError.message, /plan-slug tokens/, 'the refusal names the own-token floor')
  assert.equal(a2, 0)
})

test('Task 2.1(d) #1413 — own-token intent accepted; intent-less launch stays legal; backstops/adjudications floors fire only when the arg is present and non-empty', async () => {
  const { out } = await runPhase(PROVISION_ARGS({ intent: 'Purpose: ship the wtprov contract.\nEnd state: 1. shipped.' }), defaultImpl)
  assert.equal(out.landDecision, 'landed', 'an own-token intent passes the floor and the phase runs')
  const { out: o2 } = await runPhase(PROVISION_ARGS(), defaultImpl)
  assert.equal(o2.landDecision, 'landed', 'an intent-less launch stays legal (the floor applies only when the arg is present)')
  const badBackstops = [{ check: 'run the leftover sweep', why: 'carried from docs/plans/2026-08-06-escape-guard-exit-contract.md', runner: 'CI', source: 'plan' }]
  const { out: o3, agentCalls } = await runCounting(PROVISION_ARGS({ backstops: badBackstops }))
  assert.equal(o3.landDecision, 'held:workflow-error', 'a backstops entry naming a foreign docs/plans identifier is refused at entry')
  assert.match(o3.workflowError.message, /args\.backstops/, 'the refusal names which arg leaked')
  assert.equal(agentCalls, 0)
  const { out: o4 } = await runCounting(PROVISION_ARGS({ adjudications: ['adopt 0.18.2 over the body literal'] }))
  assert.equal(o4.landDecision, 'held:workflow-error', 'a token-less adjudications set fails the own-token floor')
  assert.match(o4.workflowError.message, /args\.adjudications/, 'the refusal names which arg leaked')
})

// (f)(i) #1430 — required-input entry validation: plan.file is its own tasks-gated problem class.
test('Task 2.1(f)(i) #1430 — a tasks-bearing launch omitting plan.file is refused at entry naming it (distinct class, ZERO agent spawns); a plan without .file refuses identically', async () => {
  const base = { phase: { id: 1, title: 'P1', integrationBranch: 'integration/x/phase-1', workingBranch: 'dev/x' },
    planSlug: 'x', runId: 'r', worktreeRoot: '/abs', tasks: EXPLICIT_TASK, learningsTarget: null }  // NO plan key
  const { out, agentCalls } = await runCounting(base)
  assert.equal(out.landDecision, 'held:workflow-error', 'refused at entry')
  assert.match(out.workflowError.message, /requires plan\.file/, 'the distinct plan.file class names itself (#1430)')
  assert.ok(!/requires top-level/.test(out.workflowError.message), 'the trio class stays silent — distinct classes, the trio message byte-untouched')
  assert.equal(agentCalls, 0, 'ZERO agent spawns — the observed incident spawned Provision first (#1430)')
  const { out: o2, agentCalls: a2 } = await runCounting({ ...base, plan: { gate: 'true' } })
  assert.match(o2.workflowError.message, /requires plan\.file/, 'a plan object without .file is the same refusal')
  assert.equal(a2, 0)
})

// (f)(iii) #1430 (RESCOPED by /red-team 2026-08-16) — the pt-throw class gains an APPENDED diagnostic
// hint only; classification stays the per-task escalate (criterion 3's titled in-thunk contract,
// green unmodified above). Both-ways: a non-pt engine error carries no hint.
test('Task 2.1(f)(iii) #1430 — a pt prompt-build throw inside the thunk carries the args-defect hint (classification byte-unchanged); a non-pt engine error carries no hint (both-ways)', async () => {
  const args = PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, planSlice: 'slice 1', roster: [{ lens: 'correctness' }],
      branch: 'war/wtprov-a/p3-t1', worktree: '/abs/repo/.claude/worktrees/run-2026/p3-t1' }, // title OMITTED → pt throws at prompt build
  ] })
  const { out } = await runPhase(args, defaultImpl)
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc && esc.reason === 'escalate', 'classification byte-unchanged: a pt throw is still a per-task escalate (criterion 3)')
  assert.ok(String(esc.blocked).includes('entry validation should have refused it'), 'the escalate result CARRIES the diagnostic hint (#1430 fix 3, rescoped)')
  const impl = (prompt, opts) => (seatOf(opts) === 'war-worker' && opts.phase === 'Work')
    ? { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: {}, files_changed: ['/etc/passwd'] }
    : defaultImpl(prompt, opts)
  const { out: o2 } = await runPhase(PROVISION_ARGS({ tasks: [
    { id: 't1', issue: 101, title: 't', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] }), impl)
  const esc2 = (o2.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc2 && esc2.reason === 'escalate', "a non-pt engine error keeps today's per-task escalate (the #742 wave-loop invariant)")
  assert.ok(!String(esc2.blocked).includes('entry validation should have refused it'), 'no hint on a non-pt engine error — exactly one class gained the hint')
})

// (g) #1410 — the escalate_reason enforcement-claim truth fix across all three sites (schemas.md +
// the AUDIT_VERDICT literal comment + the ESCALATE-BOUNDARY coupling comment).
test('Task 2.1(g) #1410 — `never a dropped seat` retired from both surfaces; the existing-lane / no-NEW-hold-path wording present on both', () => {
  assert.ok(!src.includes('never a dropped seat'), 'workflow-template.js: the retired absolute is gone from BOTH comment constructs (OLD-absent)')
  assert.ok(!schemasMd.includes('never a dropped seat'), 'schemas.md: the retired absolute is gone (OLD-absent)')
  assert.ok((src.match(/dropped-seat → audit-blocked lane/g) || []).length >= 2,
    'workflow-template.js: both comment constructs carry the accurate existing-lane wording (NEW-present)')
  assert.match(src, /no NEW hold path/, 'workflow-template.js: the no-NEW-hold-path claim is present')
  assert.ok((schemasMd.match(/dropped-seat → audit-blocked lane/g) || []).length >= 2,
    'schemas.md: the escalate_reason bullet joins the severity bullet on the existing dropped-seat → audit-blocked lane (NEW-present)')
  assert.match(schemasMd, /no NEW hold path/, 'schemas.md: the no-NEW-hold-path claim is present')
})

// ---------------------------------------------------------------------------
// Task 1.1 (#1897) — the GLOBAL dispatch semaphore at the leaf agent seam (End states 1–2).
// Supersedes the retired per-site batched(thunks, n) throttle (#1722), which composed
// multiplicatively across nested fan-outs (wave × audit roster ⇒ ~N² agents in flight).
// ---------------------------------------------------------------------------

// Extract makeSemaphore + dispatch from src and bind them to a stub `agent`, so the tests drive the
// SHIPPED source, and can read the counter directly for the drain assertion (a leaked permit lowers
// the observed peak, so a peak ≤ N assertion alone cannot catch it).
const semBlock = (() => {
  const m = src.match(/function makeSemaphore\(n\) \{[\s\S]*?\n\}/)
  return m ? m[0] : null
})()
const dispatchBlock = (() => {
  const m = src.match(/async function dispatch\(prompt, opts\) \{[\s\S]*?\n\}/)
  return m ? m[0] : null
})()
const makeDispatch = (agent, maxParallel) => new Function('agent', 'maxParallel', `
  ${semBlock}
  const dispatchSemaphore = makeSemaphore(maxParallel)
  ${dispatchBlock}
  return { dispatch, dispatchSemaphore }
`)(agent, maxParallel)

test('semaphore: at most N agent dispatches in flight globally, permits hand FIFO to waiters, results unchanged', async () => {
  assert.ok(semBlock, 'the makeSemaphore(n) helper is locatable in workflow-template.js (feature-presence guard)')
  assert.ok(dispatchBlock, 'the dispatch(prompt, opts) leaf seam is locatable in workflow-template.js (feature-presence guard)')
  let active = 0, peak = 0
  const started = []
  const agent = async (prompt) => {
    active++; peak = Math.max(peak, active)
    started.push(prompt)
    await new Promise((r) => setTimeout(r, 2))
    active--
    return prompt
  }
  const { dispatch, dispatchSemaphore } = makeDispatch(agent, 3)
  const out = await Promise.all(Array.from({ length: 9 }, (_, i) => dispatch(i, {})))
  assert.equal(peak, 3, 'at most N=3 agent dispatches are ever concurrently in flight (9 dispatches, N=3)')
  assert.deepEqual(out, [0, 1, 2, 3, 4, 5, 6, 7, 8], 'every dispatch resolves with its own agent() result')
  assert.deepEqual(started, [0, 1, 2, 3, 4, 5, 6, 7, 8], 'queued dispatches start in FIFO order — no waiter is passed over')
  assert.equal(dispatchSemaphore.permits, 3, 'the counter drains back to N when the run settles')
  assert.equal(dispatchSemaphore.waiting, 0, 'the waiter queue is empty when the run settles')
})

test('semaphore: a REJECTED dispatch releases its permit in the finally — the counter drains back to N (leak guard)', async () => {
  const agent = async (prompt) => {
    await new Promise((r) => setTimeout(r, 1))
    if (prompt % 2 === 1) throw new Error(`boom ${prompt}`)
    return prompt
  }
  const { dispatch, dispatchSemaphore } = makeDispatch(agent, 2)
  const settled = await Promise.all(Array.from({ length: 6 }, (_, i) => dispatch(i, {}).catch(() => null)))
  assert.deepEqual(settled, [0, null, 2, null, 4, null], 'the rejection propagates to the caller unchanged (classification untouched)')
  assert.equal(dispatchSemaphore.permits, 2, 'after a run with three REJECTED dispatches the counter is back at N (no leaked permit)')
  assert.equal(dispatchSemaphore.waiting, 0, 'the waiter queue is empty (no dispatch is stranded behind a leaked permit)')
})

test('maxParallel-absent: dispatch calls agent() straight through and never touches the counter (End state 2)', async () => {
  // run.maxParallel absent ⇒ the threading const resolves null (no hand-mirrored numeric fallback,
  // unlike roundLimit) ⇒ dispatch takes the byte-identical path: one bare agent(prompt, opts) call,
  // no acquire, no release, no counter state.
  assert.ok(src.includes('const maxParallel = (Number.isInteger(run.maxParallel) && run.maxParallel > 0) ? run.maxParallel : null'),
    'run.maxParallel threads to null when absent/malformed — never a numeric default')
  assert.match(dispatchBlock, /if \(maxParallel === null\) return agent\(prompt, opts\)/,
    'the absent-knob branch is the FIRST statement of the seam — the semaphore is never entered')
  for (const n of [null, undefined, 0, -1, 2.5, '3']) {
    const seen = []
    const agent = async (prompt, opts) => { seen.push({ prompt, opts }); return prompt }
    // maxParallel is threaded exactly as the template computes it, so a malformed knob reaches null.
    const threaded = (Number.isInteger(n) && n > 0) ? n : null
    const { dispatch, dispatchSemaphore } = makeDispatch(agent, threaded)
    const opts = { agentType: 'x' }
    const out = await Promise.all([dispatch('a', opts), dispatch('b', opts), dispatch('c', opts)])
    assert.deepEqual(out, ['a', 'b', 'c'], `n=${String(n)}: results pass through unchanged`)
    assert.equal(seen.length, 3, `n=${String(n)}: every dispatch reached agent()`)
    assert.strictEqual(seen[0].opts, opts, `n=${String(n)}: the opts object itself is delegated untouched`)
    assert.equal(dispatchSemaphore.permits, null, `n=${String(n)}: the counter stays inert (cap null) — no throttle state exists`)
    assert.equal(dispatchSemaphore.waiting, 0, `n=${String(n)}: nothing ever queues on the absent-knob path`)
  }
})

test('dispatch-seam census: every agent() call is inside the leaf seam, the four fan-out sites call parallel() bare, and batched() is retired', () => {
  // Line-comment strip only, mirroring the Task 4 gate-audit structural test: the resolveGate glob
  // literals break a naive block-comment strip, and these tokens live only in executable code.
  const code = src.replace(/\/\/[^\n]*/g, '')
  // (a) Default-deny half: the ONLY code-level agent() calls in the whole template are the two inside
  // the dispatch body (the absent-knob straight-through call and the permit-held call). Any new bare
  // agent() call site — one that bypasses the global ceiling — reds this census.
  const agentCalls = (code.match(/\bagent\s*\(/g) || []).length
  const seamAgentCalls = (dispatchBlock.match(/\bagent\s*\(/g) || []).length
  assert.equal(seamAgentCalls, 2, 'the seam itself holds exactly two agent() calls (absent-knob branch + permit-held branch)')
  assert.equal(agentCalls, seamAgentCalls, 'no agent() call site exists outside the dispatch seam (PIN-4: one counter for all seats)')
  // (b) The permit is taken and released exactly once, at the seam — never by an enclosing slot (PIN-15).
  assert.equal((code.match(/dispatchSemaphore\.acquire\(\)/g) || []).length, 1, 'exactly one acquire() — at the leaf seam')
  assert.equal((code.match(/dispatchSemaphore\.release\(\)/g) || []).length, 1, 'exactly one release() — in the seam finally')
  assert.match(dispatchBlock, /finally \{ dispatchSemaphore\.release\(\) \}/, 'the release rides a finally, so a thrown dispatch never leaks a permit')
  // (c) The four fan-out sites now call the sandbox parallel() bare — the per-site slicing is retired.
  assert.ok(src.includes('await parallel(roster.map(seat => () => runSeat(seat)))'),
    'site 1: the seat-roster fan-out calls parallel() bare')
  assert.ok(src.includes('await parallel(dropped.map(seat => () => runSeat(seat)))'),
    'site 2: the dropped-seat retry calls parallel() bare')
  assert.ok(src.includes('await parallel(wave.map(task => async () => {'),
    'site 3: the per-wave work+audit fan-out calls parallel() bare')
  assert.ok(src.includes('await parallel(mergedTasksForGateAudit.map('),
    'site 4: the gate-audit pass calls parallel() bare')
  assert.equal((code.match(/\bparallel\s*\(/g) || []).length, 4, 'exactly four parallel() call sites (default-deny census)')
  // (d) The retired helper is gone: no batched() call and no batched() definition survives.
  assert.equal((code.match(/\bbatched\s*\(/g) || []).length, 0, 'batched() is retired — no call site and no definition remains')
  assert.ok(!/, maxParallel\)/.test(code), 'no fan-out site threads maxParallel any more — the ceiling lives at the seam')
  // (e) #742 invariant: the template never awaits a fan-out through Promise.all (the live parallel
  // NULLS a rejected thunk; Promise.all would reject group-wide and drop completed siblings).
  assert.ok(!/Promise\.all/.test(code), 'the template never uses Promise.all — only the sandbox parallel()')
  // (f) The in-file comment surfaces carry the GLOBAL wording, not the retired per-site wording.
  assert.ok(!/per-group fan-out throttle/.test(src), 'OLD-absent: the args-contract/#1722 per-group wording is retired')
  assert.ok(!/throttles every fan-out site/.test(src), 'OLD-absent: the args-contract per-site wording is retired')
  assert.ok(!/groups of n via batched/.test(src), 'OLD-absent: the args-contract batched() reference is retired')
  assert.ok(!/throttled into groups of maxParallel/.test(src), 'OLD-absent: the seat-roster site comment is retired')
  assert.ok(!/at most maxParallel at once when set/.test(src), 'OLD-absent: the wave site comment is retired')
  assert.match(src, /GLOBAL ceiling on agent dispatches/, 'NEW-present: the args-contract line states the global ceiling')
  assert.match(src, /GLOBAL agent-dispatch ceiling/, 'NEW-present: the threading comment states the global ceiling')
  assert.match(src, /not per fan-out site/, 'NEW-present: the threading comment names the retired per-site semantics')
  assert.match(src, /the ONE leaf agent-dispatch seam \(PIN-4\)/, 'NEW-present: the seam comment names the single dispatch seam')
  assert.ok((src.match(/PIN-15/g) || []).length >= 3, 'NEW-present: the enclosing-slot sites state that they hold no permit (PIN-15)')
})

test('global ceiling end-to-end: a live phase at wave width > N never exceeds N agents in flight, and completes (PIN-15)', async () => {
  // Three dep-free tasks in ONE wave: without the knob the nested wave × roster fan-outs overlap
  // freely; with the knob the single counter caps the whole run.
  const TASKS = [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },
    { id: 't3', issue: 103, title: 'Task three', planSlice: 'slice 3', roster: [{ lens: 'correctness' }] },
  ]
  // A liveish parallel: run the group concurrently and NULL a rejected thunk (the #742 mechanism).
  const liveish = async (thunks) => Promise.all(thunks.map((t) => Promise.resolve().then(t).catch(() => null)))
  const runInstrumented = async (args, agentImpl) => {
    let active = 0, peak = 0
    const fn = build()
    const agent = async (prompt, opts = {}) => {
      active++; peak = Math.max(peak, active)
      await new Promise((r) => setTimeout(r, 1))    // hold overlapping dispatches in flight together
      try { return agentImpl(prompt, opts) } finally { active-- }
    }
    const out = await fn(agent, liveish, async () => [], () => {}, () => {}, args, { total: null })
    return { out, peak }
  }
  const capped = await runInstrumented(PROVISION_ARGS({ tasks: TASKS, run: { maxParallel: 2 } }), defaultImpl)
  assert.ok(capped.peak <= 2, `with run.maxParallel: 2 the whole run never exceeds 2 agents in flight (observed ${capped.peak})`)
  assert.ok(capped.out && capped.out.handoff, 'the run COMPLETES at wave width 3 > N=2 — the ceiling never deadlocks it (PIN-15)')
  assert.deepEqual([...(capped.out.landed || [])].sort(), ['t1', 't2', 't3'], 'all three tasks still land — the ceiling changes timing, never outcomes')
  // Both-ways: the assertion is not vacuous — the SAME phase without the knob overlaps past 2.
  const free = await runInstrumented(PROVISION_ARGS({ tasks: TASKS }), defaultImpl)
  assert.ok(free.peak > 2, `without the knob the same phase overlaps past 2 in flight (observed ${free.peak}) — the cap is what holds it`)
  assert.deepEqual([...(free.out.landed || [])].sort(), ['t1', 't2', 't3'], 'the unconfigured run lands the same three tasks')
})

test('global ceiling end-to-end: a rejecting dispatch inside a capped run stays a per-task escalate, never a group-wide drop (#742)', async () => {
  const TASKS = [
    { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
    { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },
  ]
  const liveish = async (thunks) => Promise.all(thunks.map((t) => Promise.resolve().then(t).catch(() => null)))
  const fn = build()
  const agent = async (prompt, opts = {}) => {
    await new Promise((r) => setTimeout(r, 1))
    if (seatOf(opts) === 'war-worker' && opts.phase === 'Work' && /Task one/.test(String(prompt))) throw new Error('boom')
    return defaultImpl(prompt, opts)
  }
  const out = await fn(agent, liveish, async () => [], () => {}, () => {}, PROVISION_ARGS({ tasks: TASKS, run: { maxParallel: 1 } }), { total: null })
  assert.ok(out && out.handoff, 'the capped run still completes despite a rejected dispatch (no stranded permit)')
  assert.ok((out.escalated || []).some((e) => e && e.task === 't1'), 't1 escalates on its own')
  assert.ok((out.landed || []).includes('t2'), 't2 still lands — the sibling is never dropped with it')
})

// ---------------------------------------------------------------------------
// Phase 3 Task 2 (engine-reliability, #1747): bare-interpolation census + entry-belt,
// provenance-floor, vacuous-endstate, and preMerged-dialect fixtures.
// ---------------------------------------------------------------------------

// Default-deny census (D5): the EXACT set of fallback-free pure-member-chain interpolations inside
// the template's pt-tagged prompt spans, extracted by the same mechanics the assert-args-complete
// Lead preflight floor runs. Any NEW bare interpolation reds this census and forces an explicit
// classification: give the site a fallback/guard, or extend the floor's required/exempt sets (and
// this pin) in the same commit. Names only, not counts — a count pin would churn on every
// duplicate-site edit without changing the completeness contract.
//
// Hand-scan record (the census grep is a FLOOR, plan-mandated survey): the template's prompt-build
// regions were re-scanned case-insensitively for interpolations the purity pattern misses. Result:
// every rejected args-touching site carries an explicit ??/||/ternary fallback or rides the
// ternary-gated doneWhenClause helper — zero missed fallback-free sites, no survey-derived
// corrections. Known structural false-negative classes of the mechanical pattern (recorded, not
// silently absorbed): (a) bracket-indexed roots (`${tasks[0].id}`) are not admitted by the dotted
// chain regex — none exist in the template today; (b) an interpolation nested inside another
// expression's braces is seen only via the flat re-scan of the outer span text; (c) a task/phase
// object bound to a local outside the root whitelist (ph/plan/task/t/r.task) — e.g.
// `submodLandTask.targetRepo` — is censused but not mapped to an args field; harmless today
// (targetRepo is exempt and the site is ternary-gated), red-flagged here so a future non-exempt
// case is not silently unrequired. Escaped `\${…}`
// pairs are prompt PROSE (agent-resolved placeholders) and are dropped by the tokenizer — e.g. the
// release-baseline rule's `\${integrationBranch}...\${task.branch}` mirror text is not a live site.
const BARE_INTERPOLATION_CENSUS = [
  'PLAN_DEFECT_SENTINEL', 'PREFLIGHT', 'SCRIPT', 'artifactLine', 'authArtifactLine', 'authCriteria',
  'baseDesc', 'batchSha', 'block', 'depSha', 'depth', 'doneWhenLog', 'e.preMergeTip', 'e.taskId',
  'ensures', 'ev.round', 'ev.sha', 'f.file', 'f.severity', 'f.suggested_fix', 'gateHeadSha',
  'ghUser', 'guardEvidence', 'guardSpecificity', 'integratedTip.gate_output',
  'intent', 'landedTipAnchor', 'lens', 'm.file', 'm.line', 'm.taskId', 'memoryLocalRoot',
  'nearMissDiag', 'owned', 'ph.epicIssue', 'ph.id', 'ph.integrationBranch',
  'ph.title', 'ph.workingBranch', 'pin', 'pinEvidence', 'pinStatus', 'pinStatusLine', 'plan.gate',
  'polishBranch', 'polishWorktree', 'provisionSource', 'r.aceReverted', 'r.check', 'r.condition',
  'r.fence', 'r.n',
  // r.reentryBase (in-run-finding-resolution Task 1.1): ternary-gated at its single site (the
  // re-entry PREFLIGHT range falls back to HEAD~30..HEAD when absent) — construction-guaranteed.
  // reentryRange is that ternary's pt-built product (always a string). sha/worktree are the
  // aceRevertStep helper's params: sha is the truthiness gate itself (the clause renders only when
  // set) and worktree is r.task.worktree (entry-validated) at both call sites — the old inline
  // 'pendingRevert' row relocated into the helper.
  'r.reentryBase', 'reentryRange', 'sha', 'worktree',
  'r.supersedes', 'r.tag', 'r.task.branch', 'r.task.id', 'r.task.targetRepo',
  'r.task.worktree', 'r.unsupported', 'refineryLandPath', 'refineryP', 'refineryPath', 'roundLimit', 's.lens',
  's.seat', 's.verdict', 'submodLandTask.targetRepo', 'submodPath', 't.id', 'task.branch',
  'task.doneWhen', 'task.id', 'task.title', 'task.worktree', 'taskId', 'testPatternArg', 'trailer',
  'workerIntentClause', 'workerSelfQueryRepoFlag', 'working',
]

test('bare-interpolation census: the exact fallback-free pt-span interpolation set is pinned (default-deny)', () => {
  const actual = [...extractInterpolations(src).keys()].sort()
  const added = actual.filter(e => !BARE_INTERPOLATION_CENSUS.includes(e))
  const removed = BARE_INTERPOLATION_CENSUS.filter(e => !actual.includes(e))
  assert.deepEqual(actual, [...BARE_INTERPOLATION_CENSUS].sort(),
    `bare-interpolation census drifted — added: ${JSON.stringify(added)}; removed: ${JSON.stringify(removed)}. ` +
    'A NEW fallback-free interpolation must be classified: guard the site, or extend assert-args-complete.mjs and this pin together.')
})

test('bare-interpolation census: the args-field mapping matches the assert-args-complete floor exactly', () => {
  const fields = extractArgsFields(src)
  const expected = ['phase.epicIssue', 'phase.id', 'phase.integrationBranch', 'phase.title',
    'phase.workingBranch', 'plan.gate', 'tasks[].branch', 'tasks[].doneWhen', 'tasks[].id',
    'tasks[].targetRepo', 'tasks[].title', 'tasks[].worktree']
  const added = fields.filter(f => !expected.includes(f))
  const removed = expected.filter(f => !fields.includes(f))
  assert.deepEqual(fields, expected,
    `args-field set drifted — added: ${JSON.stringify(added)}; removed: ${JSON.stringify(removed)}`)
  // Every exemption the floor documents names a field this mapping actually yields (no dead rows).
  for (const f of EXEMPT_FIELDS.keys()) {
    assert.ok(fields.includes(f), `EXEMPT_FIELDS row ${f} is live in the extracted mapping`)
  }
})

// ---- Entry-validation fixtures (D5 TASK-FIELD class) --------------------------------------

test('entry validation: a task missing planSlice is refused at entry naming the task and field (zero spawns)', async () => {
  const args = PROVISION_ARGS()
  delete args.tasks[0].planSlice
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'missing planSlice refuses at entry')
  assert.match(out.workflowError.message, /task t1 is missing planSlice/, 'the message names the task and the field')
  assert.equal(calls.length, 0, `zero agents spawned on an entry refusal — got ${calls.length}`)
})

test('entry validation: an empty-string planSlice is refused exactly like an absent one', async () => {
  const args = PROVISION_ARGS()
  args.tasks[1].planSlice = '   '
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'blank planSlice refuses at entry')
  assert.match(out.workflowError.message, /task t2 is missing planSlice/, 'the message names the blank-slice task')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('entry validation: a non-string doneWhen is refused naming the field, never coerced', async () => {
  const args = PROVISION_ARGS()
  args.tasks[0].doneWhen = 42
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'non-string doneWhen refuses at entry')
  assert.match(out.workflowError.message, /task t1 has a non-string doneWhen \(number\)/, 'the message names the task, field, and offending type')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

// ---- #1413 provenance-floor fixtures (D6 recalibration) -----------------------------------
// PROVISION_ARGS carries planSlug 'wtprov-a' + plan.file 'docs/plans/wtprov-A.md', so the derived
// ownTokens are ['wtprov'] ('a' is sub-length, dates are numeric-only).

test('provenance floor: an intent naming a foreign docs/plans identifier is refused at entry (zero spawns)', async () => {
  const args = PROVISION_ARGS({ intent: 'Deliver the throttle per docs/plans/other-plan.md end state 3.' })
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'foreign plan id in intent refuses at entry')
  assert.match(out.workflowError.message, /args\.intent names a foreign docs\/plans identifier \(docs\/plans\/other-plan\.md\)/,
    'the refusal names the arg and the foreign identifier')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('provenance floor: own-token matching is word-boundary — a substring hit inside a larger word proves nothing', async () => {
  // 'wtprovision' CONTAINS 'wtprov' but not at a word boundary — the recalibrated floor refuses.
  const args = PROVISION_ARGS({ intent: 'Improve the wtprovisioning subsystem throughput.' })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'substring-only token evidence is refused')
  assert.match(out.workflowError.message, /contains none of the run's own plan-slug tokens \[wtprov\]/,
    'the refusal lists the own tokens that failed to match')
})

test('provenance floor: a word-boundary own-token hit passes (case-insensitive)', async () => {
  const args = PROVISION_ARGS({ intent: 'Deliver the WTPROV throttle end states without regressions.' })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `word-boundary token hit passes the floor — got ${out.landDecision}`)
})

test('provenance floor: stoplist — a slug of generic tokens derives no ownTokens, so the floor is skipped (fail-open)', async () => {
  // Every slug word is stoplisted or sub-length: ownTokens is empty ⇒ no refusal is ever guessed.
  const args = PROVISION_ARGS({
    planSlug: 'test-and-fix',
    plan: { file: 'docs/plans/test-and-fix.md', gate: 'make gate' },
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/test-and-fix/phase-3', workingBranch: 'dev/test-and-fix' },
    intent: 'Ship the improvements without breaking anything.',
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `generic-slug run is not falsely refused — got ${out.landDecision}`)
})

// Recorded blast radius (audit, r3): the source:'auto' exemption makes auto-stamped backstop text a
// TRUSTED, unscanned channel — a poisoned auto row would pass the provenance floor by construction.
// Accepted residual: auto rows are Setup-recorded and ride the Lead-assembled args channel, so the
// exemption trusts a Lead-supplied flag — bounded because intent is never exempt and a foreign
// planFile stamp still refuses.
test("provenance floor: a source:'auto' row is exempt from the scan — its foreign-looking text never refuses", async () => {
  const args = PROVISION_ARGS({
    backstops: [{ check: 'grep -F pattern docs/plans/foreign-thing.md', why: 'setup-recorded', runner: 'operator', source: 'auto' }],
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `auto-row foreign id is exempt — got ${out.landDecision}`)
})

test("provenance floor: an exempt row's text still vouches for a generic sibling row (the #1666 false-refusal direction)", async () => {
  const args = PROVISION_ARGS({
    backstops: [
      { check: 'run the smoke suite nightly', why: 'generic Lead-normalized row', runner: 'ci', source: 'plan' },
      { check: 'verify wtprov worktree layout', why: 'setup-recorded', runner: 'operator', source: 'auto' },
    ],
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed',
    `the auto row's own-token evidence covers the token-less plan row — got ${out.landDecision}`)
})

test('provenance floor: a predecessor citation (supersedes) is excluded from the scan', async () => {
  const args = PROVISION_ARGS({
    adjudications: [{ adjudicated: 'version 0.9.1 adjudicated for the wtprov release slot', supersedes: 'docs/plans/older-foreign-plan.md' }],
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `supersedes citation never refuses — got ${out.landDecision}`)
})

test('provenance floor: a Lead-stamped planFile row naming THIS plan is exempt', async () => {
  const args = PROVISION_ARGS({
    adjudications: [{ adjudicated: 'ruled: keep the legacy arm', planFile: 'docs/plans/wtprov-A.md' }],
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'landed', `own-plan planFile stamp is exempt — got ${out.landDecision}`)
})

test('provenance floor: a planFile stamp naming a FOREIGN plan is the leak itself and refuses directly', async () => {
  const args = PROVISION_ARGS({
    adjudications: [{ adjudicated: 'ruled: keep the wtprov legacy arm', planFile: 'docs/plans/some-other-plan.md' }],
  })
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'foreign planFile stamp refuses at entry')
  assert.match(out.workflowError.message, /planFile provenance stamp naming a foreign plan \(docs\/plans\/some-other-plan\.md\)/,
    'the refusal names the stamp and the foreign plan')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('provenance floor: a foreign docs/plans id inside a NON-exempt backstop row is still refused', async () => {
  const args = PROVISION_ARGS({
    backstops: [{ check: 'grep -F pattern docs/plans/foreign-thing.md', why: 'plan-declared', runner: 'ci', source: 'plan' }],
  })
  const { out } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'non-exempt foreign id still refuses (exemptions are narrow)')
  assert.match(out.workflowError.message, /args\.backstops names a foreign docs\/plans identifier/,
    'the refusal names args.backstops')
})

// ---- vacuous-endstate fixture (D5, End state 10) ------------------------------------------

test('vacuous-endstate: zero tasks landed with declared tasks — every claimed condition lands unverified, never green', async () => {
  const args = PROVISION_ARGS({
    intent: 'Deliver the wtprov end states.',
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
      endState: ['Condition A holds at the tip', 'Condition B holds at the tip'] },
    tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] }],
  })
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-worker') return { task_id: 't1', status: 'blocked', blocked_reason: 'forced block — vacuous-endstate fixture' }
    return defaultImpl(prompt, opts)
  }
  const { out, logs } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'held:escalation', 'the blocked task holds the phase (handoff still renders, degraded)')
  assert.deepEqual(out.landed, [], 'zero tasks landed')
  assert.ok(out.handoff, 'the degraded handoff block is present on held:escalation')
  assert.equal(out.handoff.endState.length, 2, 'every claimed condition gets a status row')
  for (const row of out.handoff.endState) {
    assert.equal(row.status, 'unverified', `vacuous phase clamps ${JSON.stringify(row.condition)} to unverified — got ${row.status}`)
    assert.match(row.note, /zero tasks ran this phase \(vacuous phase\)/, 'the row carries the zero-tasks-ran note')
  }
  assert.ok(logs.some(l => /vacuous phase — 1 task\(s\) declared, zero landed/.test(l)),
    'the vacuous-phase clamp logs loudly')
})

test('vacuous-endstate contrast: a phase whose tasks land is NOT clamped (no zero-tasks-ran note)', async () => {
  const args = PROVISION_ARGS({
    intent: 'Deliver the wtprov end states.',
    phase: { id: 3, title: 'P3', integrationBranch: 'integration/wtprov-a/phase-3', workingBranch: 'dev/wtprov-a',
      endState: ['Condition A holds at the tip'] },
  })
  // A gate-audit seat attests the condition met — a status the vacuous clamp could NEVER produce.
  const impl = (prompt, opts) => {
    if ((opts.label || '').startsWith('gate-audit:')) {
      return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', confidence: 'high', findings: [],
        gateEvidence: 'gate log read', endStateAttestations: [{ condition: 'Condition A holds at the tip', status: 'met', evidence: 'artifact read at tip' }] }
    }
    return defaultImpl(prompt, opts)
  }
  const { out } = await runPhase(args, impl)
  assert.equal(out.landDecision, 'landed', 'happy path lands')
  assert.ok(out.landed.length > 0, 'tasks landed')
  const row = out.handoff.endState[0]
  assert.equal(row.status, 'met', `a landed phase's attested condition lands met (the clamp did not fire) — got ${row.status}`)
  assert.ok(!row.note, `a landed phase's row carries no zero-tasks-ran note — got ${JSON.stringify(row.note)}`)
})

// ---- preMerged-dialect fixtures (fold #1704, End state 24) --------------------------------

const PRE_MERGED_ARGS = () => PROVISION_ARGS({
  phase: { id: 2, title: 'P2', integrationBranch: 'integration/wtprov-a/phase-2', workingBranch: 'dev/wtprov-a' },
  tasks: [
    { id: '2.1', issue: 201, title: 'Task 2.1', planSlice: 's1', roster: [{ lens: 'correctness' }] },
    { id: '2.2', issue: 202, title: 'Task 2.2', planSlice: 's2', roster: [{ lens: 'correctness' }] },
    { id: '2.3', issue: 203, title: 'Task 2.3', planSlice: 's3', roster: [{ lens: 'correctness' }] },
    { id: '2.4', issue: 204, title: 'Task 2.4', planSlice: 's4', roster: [{ lens: 'correctness' }] },
  ],
})

const preMergedImpl = (preMerged) => (prompt, opts) => {
  if (seatOf(opts) === 'war-refiner' && opts.dispatchKind === 'provision-barrier') return { ok: true, preMerged }
  return defaultImpl(prompt, opts)
}

test('preMerged-dialect: worktree-name-shaped ids (p2-2.1) skip the four merged tasks exactly as bare ids do', async () => {
  const dialect = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['p2-2.1', 'p2-2.2', 'p2-2.3', 'p2-2.4']))
  const bare = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['2.1', '2.2', '2.3', '2.4']))
  for (const [label, run] of [['worktree-name dialect', dialect], ['bare-id dialect', bare]]) {
    assert.deepEqual(run.out.landed, ['2.1', '2.2', '2.3', '2.4'],
      `${label}: all four tasks recorded in the TASK-ID dialect — got ${JSON.stringify(run.out.landed)}`)
    assert.equal(run.calls.filter(isWorker).length, 0, `${label}: no worker dispatched for a pre-merged task`)
    assert.equal(run.out.landDecision, 'landed', `${label}: the fully-pre-merged phase lands`)
  }
})

test('preMerged-dialect: a garbage id is logged loudly and dropped — never a silent skip-disable', async () => {
  const { out, calls, logs } = await runPhase(PRE_MERGED_ARGS(), preMergedImpl(['p2-2.1', 'p9-zzz']))
  const loud = logs.find(l => /preMerged id "p9-zzz" matches NO task/.test(l))
  assert.ok(loud, `the unmatched id is logged loudly — logs: ${JSON.stringify(logs.filter(l => /preMerged/.test(l)))}`)
  assert.match(loud, /#1704/, 'the log cites the incident issue')
  assert.match(loud, /"zzz"/, 'the log shows the normalized form it failed to match')
  // 2.1 skipped; the other three tasks still run workers (the garbage id disabled nothing).
  assert.equal(calls.filter(isWorker).length, 3, 'exactly the three non-pre-merged tasks dispatch workers')
  assert.ok(out.landed.includes('2.1'), 'the dialect-matched id is recorded merged')
})

test('preMerged-dialect: a fully-pre-merged recovery phase is not vacuous — endstate rows are not clamped', async () => {
  const args = PRE_MERGED_ARGS()
  args.phase.endState = ['Condition A holds at the tip']
  args.intent = 'Deliver the wtprov end states.'
  const { out } = await runPhase(args, preMergedImpl(['p2-2.1', 'p2-2.2', 'p2-2.3', 'p2-2.4']))
  assert.equal(out.landDecision, 'landed', 'fully-pre-merged phase lands')
  assert.ok(!out.handoff.endState[0].note, 'barrier-recovered landings count — no zero-tasks-ran clamp')
})

// ---------------------------------------------------------------------------
// Phase 6 Task 2 (#1795) — classification + drain-cause + segmented-land +
// filing-on-held + recovery-holder fixtures over the Task 6.1 mechanisms.
// Tokens: drain-cause (End state 9), filing-on-held (End state 20),
// segmented-land (End state 19), recovery-holder (End state 27).
// ---------------------------------------------------------------------------

// --- drain-cause (End state 9, Phase 6 Task 1 (c)+(d)) --------------------------------------

// (c) provisionStep: a POST-SPAWN infra death of the per-task provision-run dispatch crosses the
// dispatchAgent boundary TAGGED, so the wave thunk's catch classifies it env-died SOFT (#1411's
// class) — never the generic HARD escalate, and the worker for that task is never spawned.
test('drain-cause (End state 9): a provision-run dispatch death classifies env-died SOFT — worker never spawned, siblings land, never a hard escalation', async () => {
  const impl = (prompt, opts) => {
    if ((opts.label || '') === 'provision-run:tDead') throw new Error('fetch failed: 529 overloaded (transport error)')
    return defaultImpl(prompt, opts)
  }
  const args = withProvision({ tasks: [
    { id: 'tDead', issue: 1, title: 'provision-run dies', planSlice: 's', roster: [{ lens: 'correctness' }] },
    { id: 'tLive', issue: 2, title: 'merges', planSlice: 's', roster: [{ lens: 'correctness' }] },
  ] })
  const { out, calls } = await runPhase(args, impl)
  const esc = (out.escalated || []).find(e => e && e.task === 'tDead')
  assert.ok(esc, 'the dead task escalates (presence guard)')
  assert.equal(esc.reason, 'env-died', 'a provision-run dispatch death classifies env-died (SOFT), not escalate')
  assert.match(String(esc.blocked), /529 overloaded/, 'the harness cause propagates verbatim')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'work:tDead'), 'the worker for the dead-provision task is never spawned')
  assert.equal(out.landDecision, 'landed', 'env-died is SOFT — the phase lands minus the dead task')
  assert.ok(out.landed.includes('tLive') && !out.landed.includes('tDead'), 'the sibling lands; the dead task does not')
})

// (c) provision-BARRIER: routed through dispatchAgent for the structural TAG alone — NO local catch,
// so a barrier dispatch death rethrows into the top-level catch → held:workflow-error (no git
// topology ⇒ nothing in the phase can run). Adjudicated at Task 6.1's fix round (#1794): the plan
// slice's literal "barrier death classifies env-died soft" was superseded — env-died's
// lands-minus-task semantics are incoherent for a phase-wide no-topology failure, and
// held:workflow-error is the documented terminal class with a Recovery-relaunch entry point.
test('drain-cause (End state 9, adjudicated #1794): a provision-BARRIER dispatch death rethrows held:workflow-error with the dispatch-layer cause — nothing in the phase runs', async () => {
  const impl = (prompt, opts) => {
    if (opts.dispatchKind === 'provision-barrier') throw new Error('API error: rate limit reached (resets 6pm)')
    return defaultImpl(prompt, opts)
  }
  const { out, calls } = await runPhase(PROVISION_ARGS(), impl)
  assert.equal(out.landDecision, 'held:workflow-error', 'a barrier death is the terminal no-topology class — never env-died lands-minus-task')
  assert.ok(out.workflowError && /rate limit/.test(String(out.workflowError.message)), 'the harness cause surfaces verbatim in workflowError.message')
  assert.ok(!calls.some(isWorker), 'no worker ever dispatches — no topology, nothing can run')
  assert.ok(!(out.escalated || []).some(e => e && e.reason === 'env-died'), 'the barrier death never launders into a per-task env-died record')
})

// (c)+(d) polish-worktree provision death: env-died SOFT (fail-open — the sweep is skipped, the
// pre-polish tip lands), and every finding the drain demotes carries the drain-cause stamp naming
// WHICH dispatch died and WHY.
test('drain-cause (End state 9): a polish-worktree provision dispatch death fail-opens (sweep skipped, phase lands) and stamps the drain cause on each demoted finding', async () => {
  const impl = (prompt, opts) => {
    if (/^polish-worktree:/.test(opts.label || '')) throw new Error('socket hang up (api connection lost)')
    return sweepBase([queuedAbsorb()])(prompt, opts)
  }
  const { out, calls, logs } = await runPhase(SWEEP_ARGS(), impl)
  assert.ok(!calls.some(c => (c.opts.label || '') === 'polish:phase-3'), 'the sweep worker never dispatches (provisioning died)')
  assert.equal(out.landDecision, 'landed', 'env-died is SOFT and the sweep is fail-open — the pre-polish tip lands')
  assert.equal(out.handoff.polish, 'skipped', 'polishStatus degrades to skipped, never a hold')
  const row = (out.minorsFiled || []).find(m => m && m.title === 'dangling link')
  assert.ok(row, 'the queued finding demotes to follow-up (never dropped)')
  assert.ok(row.drainCause && typeof row.drainCause === 'object', 'the demoted finding carries the drain-cause stamp (in-band field)')
  assert.equal(row.drainCause.dispatch, 'polish-worktree:phase-3', 'the stamp names WHICH dispatch died')
  assert.match(String(row.drainCause.why), /env-died/, 'the stamp names WHY (env-died classification)')
  assert.match(String(row.drainCause.why), /socket hang up/, 'the harness cause rides the stamp verbatim')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('env-died') && l.includes('polish-worktree:phase-3')), 'the death is log()ged with the dispatch label (never silent)')
})

// (c)+(d) sweep dispatch death: env-died SOFT into the existing fail-open DISCARD arm, with the
// drain cause stamped on each demoted finding.
test('drain-cause (End state 9): a sweep dispatch death fail-opens into the DISCARD arm and stamps the drain cause on each demoted finding', async () => {
  const impl = (prompt, opts) => {
    if ((opts.label || '') === 'polish:phase-3') throw new Error('529 Overloaded')
    return sweepBase([queuedAbsorb()])(prompt, opts)
  }
  const { out, calls } = await runPhase(SWEEP_ARGS(), impl)
  assert.ok(calls.some(c => /^polish-worktree:/.test(c.opts.label || '')), 'the polish worktree provisioned (presence guard — the death is the SWEEP dispatch)')
  assert.ok(!calls.some(c => (c.opts.label || '') === 'merge:p3-polish'), 'a dead sweep is never merged')
  assert.equal(out.landDecision, 'landed', 'env-died is SOFT and the sweep is fail-open — the pre-polish tip lands')
  assert.equal(out.handoff.polish, 'discarded', 'the dead sweep takes the DISCARD arm')
  const row = (out.minorsFiled || []).find(m => m && m.title === 'dangling link')
  assert.ok(row, 'the queued finding demotes to follow-up (never dropped)')
  assert.equal(row.drainCause && row.drainCause.dispatch, 'polish:phase-3', 'the stamp names the sweep dispatch')
  assert.match(String(row.drainCause && row.drainCause.why), /env-died.*529 Overloaded/, 'the stamp carries the env-died class + the verbatim harness cause')
})

// (d) boundary discipline, both directions: a dead dispatch RETURNING NOTHING still stamps (it is a
// dispatch death, just a non-throwing one); an ordinary panel-reject discard — no dispatch died —
// stays UNSTAMPED (delete-the-feature control: the stamp is death-scoped, not a discard default).
test('drain-cause (End state 9): a sweep dispatch returning no result stamps; an ordinary panel-reject discard stays unstamped (death-scoped, never a discard default)', async () => {
  // Arm 1: sweep returns null (dead dispatch, no throw) → stamped.
  const dead = (prompt, opts) => (opts.label || '') === 'polish:phase-3' ? null : sweepBase([queuedAbsorb()])(prompt, opts)
  const { out: outDead } = await runPhase(SWEEP_ARGS(), dead)
  const rowDead = (outDead.minorsFiled || []).find(m => m && m.title === 'dangling link')
  assert.ok(rowDead && rowDead.drainCause && rowDead.drainCause.dispatch === 'polish:phase-3', 'a no-result sweep dispatch death stamps the drain cause')
  assert.match(String(rowDead.drainCause.why), /returned no result/, 'the stamp says the dispatch returned no result')
  // Arm 2: live sweep, panel rejects → ordinary discard, NO stamp.
  const reject = buildSeqImpl(
    { 'audit:p3-polish:correctness': [{ seat: 'p', lens: 'correctness', verdict: 'request_changes', confidence: 'high',
        findings: [{ severity: 'Major', title: 'sweep broke it', file: 'docs/x.md', rationale: 'r' }] }] },
    sweepBase([queuedAbsorb()]))
  const { out: outReject } = await runPhase(SWEEP_ARGS(), reject)
  const rowReject = (outReject.minorsFiled || []).find(m => m && m.title === 'dangling link')
  assert.ok(rowReject, 'the queued finding still demotes on an ordinary discard (presence guard)')
  assert.equal(rowReject.drainCause, undefined, 'an ordinary non-death drain is NEVER stamped — no dispatch died')
})

// --- filing-on-held (End state 20, Phase 6 Task 1 (b)) --------------------------------------

// held:land-failed still produces the file-followups dispatch — merged tasks' follow-up debt exists
// regardless of the land outcome. No handoff emits on held:land-failed, so the stamped issue
// numbers ride the top-level return's minorsFiled instead.
test('filing-on-held (End state 20): a held:land-failed phase still runs the file-followups dispatch — stamped issues ride the top-level minorsFiled (no handoff there)', async () => {
  const impl = (prompt, opts) => {
    if (opts.dispatchKind === 'file-followups') return { filed: [{ n: 1, issue: 777 }], clusters: [{ ordinals: [1], issue: 777 }] }
    if (seatOf(opts) === 'war-refiner' && opts.phase === 'Land') return { mode: 'land-phase', status: 'error' }
    return handoffImpl(null)(prompt, opts)
  }
  const { out, calls } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'held:land-failed', 'presence guard: the land error holds the phase')
  assert.ok(calls.some(c => c.opts.dispatchKind === 'file-followups'), 'the filing dispatch STILL fires on held:land-failed — never silently unrun')
  const row = (out.minorsFiled || []).find(m => m && m.title === 'needs new tests')
  assert.ok(row, 'the follow-up row survives on the top-level return')
  assert.equal(row.issue, 777, 'the stamped issue number rides minorsFiled (no handoff emits on held:land-failed)')
  assert.equal(out.handoff, undefined, 'held:land-failed emits NO handoff block — the top-level return is the record')
})

// --- segmented-land (End state 19, Phase 6 Task 1 (a), A6 REVISED) --------------------------

// The in-band land_segment:'incomplete' marker (riding the existing 'error' status) round-trips its
// bounded re-dispatch: the Workflow re-dispatches the SAME land prompt under a continuation header,
// following the FLOOR_STATUSES retry-loop idiom — never a dispatch death, never a new status member.
test('segmented-land (End state 19): the in-band land_segment marker round-trips ONE bounded re-dispatch to completion — the continuation lands and wrap-up fires', async () => {
  let landN = 0
  const impl = (prompt, opts) => {
    if (/^land:phase-3(:|$)/.test(opts.label || '')) {
      landN++
      return landN === 1
        ? { mode: 'land-phase', status: 'error', land_segment: 'incomplete', segment_note: 'gate mid-run at step 2' }
        : { mode: 'land-phase', status: 'landed', working_sha: 'abc1234def' }
    }
    return defaultImpl(prompt, opts)
  }
  const { out, calls, logs } = await runPhase(PROVISION_ARGS(), impl)
  const lands = calls.filter(c => /^land:phase-3(:|$)/.test(c.opts.label || ''))
  assert.equal(lands.length, 2, 'exactly one re-dispatch: initial land + one continuation')
  assert.equal(lands[1].opts.label, 'land:phase-3:segment-2', 'the continuation is labelled with its segment ordinal')
  assert.ok(lands[1].prompt.startsWith('SEGMENTED-LAND CONTINUATION'), 'the continuation prompt leads with the continuation header')
  assert.ok(lands[1].prompt.includes('idempotent'), 'the continuation states the idempotence contract (safe full re-run)')
  assert.ok(lands[1].prompt.includes('land-advance'), 'the FULL land prompt rides the continuation (run to completion, not a partial resume)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('segmented land') && l.includes('gate mid-run at step 2')), 'the segment_note is log()ged on the re-dispatch')
  assert.equal(out.landDecision, 'landed', 'the completed continuation lands the phase — the marker is survival wiring, never a dispatch death')
  assert.equal(out.handoff.tipSha, 'abc1234def', 'the handoff reads the continuation result')
  assert.ok(calls.some(isServitor), 'wrap-up (servitor) fires on the continuation-landed phase')
})

test('segmented-land (End state 19): a persisting marker is BOUNDED by roundLimit — exhaustion routes the ridden error status to held:land-failed, logged', async () => {
  const impl = (prompt, opts) =>
    /^land:phase-3(:|$)/.test(opts.label || '')
      ? { mode: 'land-phase', status: 'error', land_segment: 'incomplete', segment_note: 'still mid-gate' }
      : defaultImpl(prompt, opts)
  const { out, calls, logs } = await runPhase(PROVISION_ARGS({ run: { roundLimit: 2 } }), impl)
  const lands = calls.filter(c => /^land:phase-3(:|$)/.test(c.opts.label || ''))
  assert.equal(lands.length, 3, 'initial land + exactly roundLimit (2) re-dispatches — the FLOOR_STATUSES-idiom bound holds')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('segmented-land budget exhausted')), 'exhaustion is log()ged')
  assert.equal(out.landDecision, 'held:land-failed', 'the final still-incomplete result routes by its RIDDEN status (error → held:land-failed)')
  assert.ok((out.escalated || []).some(e => e && e.task === 'phase-3-land' && e.reason === 'error'), 'the escalation record carries the ridden status, never a segment enum member')
})

test('segmented-land (End state 19): NO enum widening — land_segment is an orthogonal optional field; KNOWN_LAND_DECISIONS and the MERGE_RESULT status enum carry no segment member', () => {
  // Verbatim membership pin: the pre-existing 'held:phase-incomplete' member legitimately contains
  // the substring 'incomplete' — so the widening check is exact-set, never substring-over-members.
  assert.deepEqual(KNOWN_LAND_DECISIONS, ['landed', 'held:escalation', 'held:nothing-merged',
    'held:land-failed', 'held:phase-incomplete', 'held:workflow-error', 'held:submodule-pr'],
    'KNOWN_LAND_DECISIONS is unwidened (land-decision.mjs untouched, ADR 0005) — no segment member')
  const enumMatch = src.match(/MERGE_RESULT[\s\S]*?status\s*:\s*\{\s*enum\s*:\s*(\[[^\]]+\])/)
  assert.ok(enumMatch, 'MERGE_RESULT status enum found')
  assert.ok(!enumMatch[1].includes('incomplete') && !enumMatch[1].includes('segment'), "the MERGE_RESULT status enum carries NO 'incomplete'/segment member — the marker rides status:'error'")
  const mr = src.match(/const\s+MERGE_RESULT\s*=[^]*?(?=\n\nconst )/)
  assert.ok(mr && /land_segment:\s*\{\s*enum:\s*\['incomplete'\]\s*\}/.test(mr[0]), "land_segment is declared as the orthogonal in-band field (enum ['incomplete'])")
  assert.ok(!/required[^\]]*land_segment/.test(mr[0]), 'land_segment is OPTIONAL — never required')
})

// --- recovery-holder (End state 27, #1712 fix 3, Phase 6 Task 1 (e)) ------------------------

// Sanctioned relaunch: the barrier prompt carries the pre-checkout ref-holder auto-free clause —
// clean SAME-plan prior-generation holders only (detach for _refinery, worktree-remove for a
// workless task worktree), ancestor check resolved against the integration branch itself (never
// step-3's unbound $TIP, #1794) — and a clean-holder run provisions without Lead intervention.
test('recovery-holder (End state 27): a sanctioned relaunch instructs clean same-plan holder auto-free (detach _refinery / remove workless task worktree) and provisions without Lead intervention', async () => {
  const { out, calls } = await runPhase(PROVISION_ARGS({ recovery: { sanctioned: true } }), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /pre-checkout ref-holder auto-free/, 'the holder auto-free clause rides the sanctioned barrier prompt')
  assert.match(p, /git worktree list --porcelain/, 'holders are enumerated via git worktree list --porcelain')
  assert.match(p, /checkout --detach/, 'a stale _refinery holder is DETACHED (the worktree survives)')
  assert.match(p, /git worktree remove/, 'a WORKLESS task worktree holder is removed')
  assert.match(p, /its held branch carries the plan slug wtprov-a/, "same-plan discrimination: the clause names THIS plan's slug")
  assert.match(p, /Plain git verbs only/, 'plain git verbs — never a new script flag')
  // #1794 fix: the ancestor check resolves against the integration branch itself, never "$TIP".
  assert.ok(p.includes('git merge-base --is-ancestor') && p.includes('never "$TIP"'), 'the workless predicate resolves against the integration branch, never step-3\'s unbound $TIP')
  assert.match(p, /SKIP the removal arm/, 'a not-yet-existing integration branch SKIPs the removal arm (an unverified worktree is never removed)')
  // Behavioral: a clean-holder barrier returns ok:true and the phase runs end-to-end unassisted.
  assert.ok(calls.some(isWorker), 'workers dispatch — the relaunch provisions without Lead intervention')
  assert.equal(out.landDecision, 'landed', 'the sanctioned relaunch completes the phase')
})

test('recovery-holder (End state 27): a DIRTY holder dies loud with the holder path named; a FOREIGN plan\'s holder is never freed', async () => {
  const args = PROVISION_ARGS({ recovery: { sanctioned: true } })
  const { calls } = await runPhase(args, defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.match(p, /NEVER free a DIRTY holder/, 'the dirty-holder refusal is explicit')
  assert.match(p, /HOLDER PATH named in stderrTail/, 'a dirty holder dies loud with the holder path in stderrTail')
  assert.match(p, /NEVER free a holder of a FOREIGN plan's refs/, "a foreign plan's holder is never freed — left in place, die loud if it blocks")
  // Behavioral: the barrier's dirty-holder die (ok:false naming the holder path) halts the phase
  // with the path surfaced — never a silent free, never a silent continue.
  const dirtyPath = '/abs/repo/.claude/worktrees/old-run/p3-t1'
  const { out } = await runPhase(args, barrierEnv({ ok: false, failedCommand: 'ensure-worktree …', exitCode: 128,
    stderrTail: `dirty prior-generation holder at ${dirtyPath} — refusing to free (unmerged work)` }))
  assert.equal(out.landDecision, 'held:workflow-error', 'a dirty-holder die is a hard barrier stop (no topology)')
  assert.ok(String(out.workflowError && out.workflowError.message).includes(dirtyPath), 'the holder path surfaces verbatim in the workflow error')
})

test('recovery-holder (End state 27): the holder auto-free clause is DORMANT without args.recovery.sanctioned', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isProvision).prompt
  assert.doesNotMatch(p, /ref-holder auto-free/, 'no holder auto-free clause on an unsanctioned run')
  assert.doesNotMatch(p, /git worktree remove/, 'no removal instruction on an unsanctioned run (byte-identical dormancy)')
})

// ---------------------------------------------------------------------------
// in-run-finding-resolution Task 1.1 — the remaining End-state fixture families:
// reaudit-sweep (2), new-test-absorb (3), citation-resolve (4), citation-unsound (5),
// ask-content-key (6), ask-collision + lens-suffix (7), ace-group-path (8),
// disposition-prompt-widened (10), ruled-ask-absorb (12).
// ---------------------------------------------------------------------------

// Quiet gate-audit fallback: the gate-audit-family lanes return clean approvals so their sink
// lane never re-raises the roster findings under test (ask-resolution fixtures need asks[] exact).
const quietGate = (base) => (prompt, opts) => {
  if (seatOf(opts) === 'war-auditor' && (opts.label || '').startsWith('gate-audit:'))
    return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', findings: [], confidence: 'high' }
  return base(prompt, opts)
}

test('reaudit-sweep (End state 2): a re-audit-born mechanical absorb, reserve-blocked, lands in the phase-close sweep — aced at the polish sha, NOT minorsFiled', async () => {
  // roundLimit 3 ⇒ reserve boundary 1: the batch ace spends the only slot, so the re-audit-born
  // absorb is reserve-blocked and routes phaseClose:true — the sweep is its vehicle (D2/D3).
  const first = nit({ title: 'first nit', file: 'skills/first.js' })
  const fresh = nit({ title: 'reaudit-born nit', file: 'skills/fresh.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [first]),
                               approveWith('audit:t1:correctness', [fresh])] },
    sweepBase([]))
  const { out, calls, logs } = await runPhase(SWEEP_ARGS({ run: { ace: true, roundLimit: 3 } }), impl)
  assert.equal(calls.filter(isAce).length, 1, 'only the batch ace dispatched (the reserve blocks re-entry)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('reserve-blocked')), 'the reserve stop is logged')
  const pw = calls.find(c => (c.opts.label || '') === 'polish:phase-3')
  assert.ok(pw && pw.prompt.includes('reaudit-born nit'), 'the reserve-blocked absorb reaches the phase-close sweep dispatch')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'reaudit-born nit' && a.sha === 'polishsha'),
    'the re-audit-born absorb is ACED at the polish sha (executed in-run via the sweep)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'reaudit-born nit'),
    'the re-audit-born absorb never lands in minorsFiled (the sweep, not the issue tracker, is its vehicle)')
  assert.ok(out.landed.includes('t1'), 't1 lands on the polished tip')
})

test('new-test-absorb (End state 3): a new-test addition in a task-owned test file is ace-eligible — it rides the ace batch and both prompt layers say so', async () => {
  const testNit = { severity: 'Minor', title: 'add missing negative test', file: 'skills/war/assets/war-config.test.mjs',
    rationale: 'the guard has no negative-control coverage', disposition: 'absorb',
    suggested_fix: 'add one negative-control test beside the positive fixture' }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [testNit]),
                               approveWith('audit:t1:correctness', [])] },
    quietGate(aceBase([testNit])))
  const { out, calls } = await runPhase(ACE_ARGS(), impl)
  const ace = calls.find(isAce)
  assert.ok(ace && ace.prompt.includes('add missing negative test'), 'the new-test absorb rides the ace batch (never refused for being a test addition)')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.title === 'add missing negative test'), 'the new-test absorb is aced')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'add missing negative test'), 'the new-test absorb is NOT filed')
  // Both prompt layers carry the eligibility widening (D4): dispatched DISPOSITION WIDENINGS block +
  // the standing disposition-eligibility.md home (End state 3's standing needle: 'new test').
  const auditPromptText = calls.find(c => (c.opts.label || '') === 'audit:t1:correctness').prompt
  assert.ok(/task-owned test file/.test(auditPromptText) && /not by itself a why-not-absorbable reason/.test(auditPromptText),
    'the dispatched auditor prompt carries the new-test eligibility rule')
  const eligMd = readFileSync(join(here, '../references/disposition-eligibility.md'), 'utf8')
  assert.ok(/new test/i.test(eligMd) && /task-owned test file/.test(eligMd),
    'the standing disposition-eligibility.md home carries the new-test eligibility rule')
})

test('disposition-prompt-widened (End state 10): the dispatched auditPrompt DISPOSITION block names re-audit-born default-absorb, new-test eligibility, and trade-off-ask routing; the standing home mirrors all three', async () => {
  const { calls } = await runPhase(PROVISION_ARGS(), defaultImpl)
  const p = calls.find(isAuditor).prompt
  assert.ok(p.includes('DISPOSITION WIDENINGS:'), 'the dispatched DISPOSITION WIDENINGS block is emitted on every roster seat')
  assert.ok(p.includes('born at a re-audit'), 'widening (1): re-audit-born default-absorb (D3)')
  assert.ok(p.includes('task-owned test file'), 'widening (2): new-test eligibility (D4)')
  assert.ok(p.includes('trade-off') && p.includes('routes ask'), 'widening (3): trade-off-ask routing (D5)')
  assert.ok(p.includes('citation') && p.includes('NO-match'), 'the citation arm and its ambiguity-is-no-match floor ride the dispatched block (D6, PIN-6)')
  // The DISPOSITION RULE sentence itself stays byte-untouched (the card byte-mirror) — the
  // widenings are a separate appended block.
  assert.ok(p.includes('absorb and ask are never defaults.'), 'the original DISPOSITION RULE sentence survives byte-untouched')
  const eligMd = readFileSync(join(here, '../references/disposition-eligibility.md'), 'utf8')
  assert.ok(/born at a re-audit/i.test(eligMd), "standing home carries the literal 'born at a re-audit' (End state 10 needle)")
  assert.ok(/trade-off/i.test(eligMd), 'standing home carries the trade-off routing rule')
})

// A citation-resolved finding: the seat matched the parked ask's NAMED trade-off to a threaded
// standing adjudication row and returns disposition:'absorb' + citation (A2 — panel judgment),
// KEEPING the parked ask's `ask` field verbatim (the resolve contract, both prompt layers). The
// TITLE deliberately DIFFERS from ask.question so the fixture discriminates: a resolve keyed on
// the title alone would miss the parked record (whose key derives from the round-1 question).
const citationF = () => ({ severity: 'Minor', title: 'mirrored value rides docs/x.md', file: 'docs/x.md',
  rationale: 'ruled by standing row', disposition: 'absorb',
  ask: { question: 'mirror the value or point at the source?', fork: ['mirror the value', 'point at the source'] },
  citation: { row: 'ADJ-7: doc facts point at the source, never mirror', rationale: 'the row rules the mirror-vs-point trade-off this ask names' },
  suggested_fix: 'replace the mirrored value with a source pointer' })
// Args for the citation family: the row-existence floor admits only citations whose `row` matches
// a THREADED adjudication row (exact/containment against adjRow), so these fixtures thread the
// standing set (the row text carries the run's own 'wtprov' slug token for the provenance floor).
const CITED_ADJ = ['ADJ-7: doc facts point at the source, never mirror — ruled at the wtprov decompose gate']
const CITE_ARGS = (over = {}) => ACE_ARGS({ adjudications: CITED_ADJ, ...over })

test('citation-resolve (End state 4, afk+match arm — #1879 RULING 1): under run.afk an absorb-by-citation finding executes via the re-entry vehicle — commit stamp + aced citation record + the parked ask resolves; the re-audit panel is charged with soundness', async () => {
  const a = nit({ title: 'plain nit', file: 'skills/a.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), a]),
                               approveWith('audit:t1:correctness', [citationF()]),
                               approveWith('audit:t1:correctness', [])] },
    quietGate(aceBase([askFinding(), a])))
  // run.afk === true is the ONE condition that lets the executed citation UNPARK the ask (#1879).
  const { out, calls, logs } = await runPhase(CITE_ARGS({ run: { ace: true, afk: true } }), impl)
  const aces = calls.filter(isAce)
  assert.equal(aces.length, 2, 'batch + the citation-resolved re-entry batch')
  assert.ok(aces[1].prompt.includes('ACE RE-ENTRY BATCH'), 'the citation absorb executes via the re-entry vehicle (D6)')
  assert.ok(aces[1].prompt.includes('[absorb-by-citation: row "ADJ-7: doc facts point at the source, never mirror" — the row rules the mirror-vs-point trade-off this ask names]'),
    'the dispatch row stamps row-id + match rationale so the ace commit message carries the citation (PIN-7 record floor)')
  const acedEntry = (out.aced || []).find(x => x && x.citation)
  assert.ok(acedEntry && acedEntry.citation.row === 'ADJ-7: doc facts point at the source, never mirror',
    'the durable aced record carries the row-id')
  assert.ok(acedEntry.citation.rationale.includes('mirror-vs-point'), 'the aced record carries the one-line match rationale')
  // The parked round-1 ask RESOLVES on the ECHOED ask.question key — the citation finding's title
  // deliberately differs from the question, so a title-keyed resolve would false-miss here.
  assert.equal((out.asks || []).length, 0, 'the parked ask is resolved by the executed citation absorb (echoed-ask content key, not title coincidence)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('parked ask resolved by citation')), 'the resolution is logged')
  // Soundness duty (PIN-7): the citation-resolved batch re-audit is explicitly charged, and the
  // charge ENUMERATES its subjects (title + cited row + match rationale) so the panel judges from
  // its own prompt, never from a commit message it is not directed to read.
  const t1Audits = calls.filter(c => (c.opts.label || '') === 'audit:t1:correctness')
  assert.ok(t1Audits[2] && t1Audits[2].prompt.includes('CITATION SOUNDNESS'),
    'the re-audit prompt for the citation-resolved batch carries the CITATION SOUNDNESS charge')
  assert.ok(t1Audits[2].prompt.includes('"mirrored value rides docs/x.md" cites row "ADJ-7: doc facts point at the source, never mirror" — match rationale: the row rules the mirror-vs-point trade-off this ask names'),
    'the soundness charge enumerates the citation payload (finding title + row-id + match rationale) into the panel prompt')
  assert.ok(!t1Audits[0].prompt.includes('CITATION SOUNDNESS'), 'a citation-less round carries no soundness clause (byte-identity preserved)')
})

test('citation-resolve (interactive+match arm, negative control — #1879 RULING 1): a citation-matched ask SURFACES with the matched row + prefilled recommended ruling and is NEVER auto-unparked past a present operator; telemetry symmetry holds (the aced record still carries the citation)', async () => {
  // Identical drive to the afk arm EXCEPT run.afk is absent (interactive) — the drift this
  // negative control would have caught: an unconditional unpark resolving the ask past the operator.
  const a = nit({ title: 'plain nit', file: 'skills/a.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), a]),
                               approveWith('audit:t1:correctness', [citationF()]),
                               approveWith('audit:t1:correctness', [])] },
    quietGate(aceBase([askFinding(), a])))
  const { out, logs } = await runPhase(CITE_ARGS(), impl)
  assert.equal((out.asks || []).length, 1, 'the citation-matched ask STAYS PARKED interactively — surfaced, never auto-unparked (one-confirm ergonomics)')
  const parked = out.asks[0]
  assert.ok(parked.citationPrefill, 'the parked ask carries the citationPrefill the strike list renders')
  // S2 (#1879 recovery seed): the prefill renders the MATCHED THREADED STANDING ROW's own bytes
  // (args.adjudications — the row citationOf matched), never the seat's citation string. The seat
  // string here is a strict PREFIX of the threaded row, so byte-equality against CITED_ADJ[0]
  // discriminates: rendering the seat's paraphrase would fail this assert.
  assert.equal(parked.citationPrefill.row, CITED_ADJ[0], "the prefill's row text equals the threaded standing row's bytes (never the seat's citation string)")
  assert.notEqual(parked.citationPrefill.row, citationF().citation.row, 'the seat citation string (a truncation of the row) is NOT what the operator confirms from')
  assert.ok(parked.citationPrefill.rationale.includes('mirror-vs-point'), 'the prefill carries the match rationale')
  assert.ok(/covers this trade-off; confirm\?$/.test(parked.citationPrefill.recommendedRuling), 'the prefill carries the pre-filled recommended ruling (one-confirm)')
  assert.ok(parked.citationPrefill.recommendedRuling.includes(CITED_ADJ[0]), 'the recommended ruling quotes the threaded row bytes too')
  assert.ok(parked.citationPrefill.sha, 'the prefill pins the executed absorb sha')
  const hAsk = out.handoff.asks.find(x => x.question === parked.question)
  assert.ok(hAsk && hAsk.citationPrefill && hAsk.citationPrefill.row === parked.citationPrefill.row,
    'the handoff asks projection carries the prefill onto the Checkpoint strike list (the ask record the handoff carries)')
  // Telemetry symmetry (#1879 RULING 1(4)): the aced/citation record — the /war-review
  // over-broad-row narrowing signal's source — is written in the interactive mode too.
  const acedEntry = (out.aced || []).find(x => x && x.citation)
  assert.ok(acedEntry && acedEntry.citation.row === 'ADJ-7: doc facts point at the source, never mirror',
    'the interactive execution records in the SAME telemetry channel (aced record with row-id + rationale)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('parked ask citation-matched') && l.includes('STAYS PARKED')),
    'the surface-instead-of-unpark path is logged')
  assert.ok(!logs.some(l => typeof l === 'string' && l.includes('parked ask resolved by citation')),
    'the afk resolution log never fires interactively')
})

test('citation-resolve (production shape, ask-less citation — mode-split pair, #1879 addition 2): a citation absorb WITHOUT the echoed ask field cannot silently no-op in EITHER mode — the miss is LOGGED, the parked ask survives, the aced record still carries the citation', async () => {
  // Mode-split repair (#1879 operator addition 2): under the run.afk gate an interactive run never
  // unparks, so an interactive-only 'parked ask survives' assertion is VACUOUS. The afk arm is the
  // decisive oracle — unpark is LIVE there, and the key miss must still block it; the interactive
  // arm additionally pins that a key-missed citation attaches NO prefill (nothing matched to
  // prefill). Never deleted — this pair is the mode-gate's regression net (oracle-duality law).
  for (const [mode, runOver] of [['interactive', {}], ['afk', { afk: true }]]) {
    const a = nit({ title: 'plain nit', file: 'skills/a.js' })
    const askless = citationF()
    delete askless.ask                                   // schema-minimal shape: `ask` is mandatory only on disposition:'ask'
    const impl = buildSeqImpl(
      { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), a]),
                                 approveWith('audit:t1:correctness', [askless]),
                                 approveWith('audit:t1:correctness', [])] },
      quietGate(aceBase([askFinding(), a])))
    const { out, logs } = await runPhase(CITE_ARGS({ run: { ace: true, ...runOver } }), impl)
    assert.ok((out.aced || []).some(x => x && x.citation && x.citation.row === 'ADJ-7: doc facts point at the source, never mirror'),
      `[${mode}] the ask-less citation absorb still aces with its citation stamp`)
    assert.equal((out.asks || []).length, 1, `[${mode}] the parked ask SURVIVES — with no echoed ask field and a differing title, no content key matches (never a coincidence-shaped unpark${mode === 'afk' ? '; decisive: afk unpark is live and the key miss blocks it' : ''})`)
    assert.ok(logs.some(l => typeof l === 'string' && l.includes('citation absorb executed with NO matching parked ask')),
      `[${mode}] the no-match case is LOGGED (never a silent no-op) — the operator still rules the parked question at the Checkpoint`)
    if (mode === 'interactive') assert.ok(!out.asks[0].citationPrefill,
      'a key-missed citation attaches NO prefill — the surviving ask surfaces plain (nothing was matched to confirm from)')
  }
})

test('citation row-existence floor (mode-split pair, #1879 addition 2): a FABRICATED row (no threaded adjudication membership) is refused in EITHER mode — plain absorb, no stamp, no unpark, no prefill, refusal logged', async () => {
  // Mode-split repair (#1879 operator addition 2): the interactive-only 'NEVER unparked' assertion
  // went vacuous under the run.afk gate (interactive never unparks, floor or no floor). The afk
  // arm is the decisive oracle — unpark is live and the row-existence floor must still block it.
  for (const [mode, runOver] of [['interactive', {}], ['afk', { afk: true }]]) {
    const fabricated = citationF()
    fabricated.citation = { row: 'ADJ-99: an adjudication row nobody threaded', rationale: 'fabricated' }
    const impl = buildSeqImpl(
      { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), fabricated]),
                                 approveWith('audit:t1:correctness', [])] },
      quietGate(aceBase([askFinding(), fabricated])))
    const { out, calls, logs } = await runPhase(CITE_ARGS({ run: { ace: true, ...runOver } }), impl)
    assert.ok(logs.some(l => typeof l === 'string' && l.includes('citation REFUSED (row-existence floor)') && l.includes('ADJ-99')),
      `[${mode}] the fabricated row is refused by the mechanical set-membership floor, logged with the row text`)
    const ace = calls.find(isAce)
    assert.ok(ace && !ace.prompt.includes('absorb-by-citation'), `[${mode}] the refused citation renders NO stamp in the dispatch row (plain absorb)`)
    const entry = (out.aced || []).find(x => x && x.finding && x.finding.title === 'mirrored value rides docs/x.md')
    assert.ok(entry && !entry.citation, `[${mode}] the aced record carries no citation for a fabricated row (fail-open to a plain absorb)`)
    assert.equal((out.asks || []).length, 1, `[${mode}] the parked ask is NEVER unparked by a fabricated citation — the operator keeps the question${mode === 'afk' ? ' (decisive: afk unpark is live and the floor blocks it)' : ''}`)
    if (mode === 'interactive') assert.ok(!out.asks[0].citationPrefill,
      'a floor-refused citation attaches NO prefill — a fabricated row must never render as a one-confirm prefill')
  }
})

test('citation-resolve (End state 4, ambiguity ⇒ no-match): an ask without a citation stays parked — never aced, never filed; a MALFORMED citation never stamps a row', async () => {
  // Ambiguity resolves to NO-match (PIN-6): the seat keeps disposition:'ask' — today's park path.
  const { out } = await runPhase(ACE_ARGS(), quietGate(aceBase([askFinding()])))
  assert.equal((out.asks || []).length, 1, 'the ambiguous-match ask parks exactly once')
  assert.ok(!(out.aced || []).some(x => x && x.citation), 'nothing aced with a citation')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'mirror or point'), 'the parked ask is never filed unruled')
  // Malformed-citation floor: a row-less citation object is inert (citationOf → null) — the finding
  // rides as a plain absorb with NO citation stamp on its aced record.
  const malformed = nit({ title: 'malformed citation nit', file: 'skills/m.js' })
  malformed.citation = { rationale: 'row missing' }
  const impl2 = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [malformed]),
                               approveWith('audit:t1:correctness', [])] },
    quietGate(aceBase([malformed])))
  const { out: out2, calls: calls2 } = await runPhase(ACE_ARGS(), impl2)
  assert.ok(!calls2.filter(isAce)[0].prompt.includes('absorb-by-citation'), 'a malformed citation renders NO stamp in the dispatch row')
  const entry2 = (out2.aced || []).find(x => x && x.finding && x.finding.title === 'malformed citation nit')
  assert.ok(entry2 && !entry2.citation, 'the aced record carries no citation for a malformed citation object (fail-open, never an invented row)')
})

test('citation-unsound (End state 5, mode-split pair — #1879 addition 2): the re-audit panel catches an unsound citation in EITHER mode — the batch forward-reverts and the finding demotes NAMING the mismatch; the parked ask survives', async () => {
  // Mode-split repair (#1879 operator addition 2): the interactive-only 'parked ask SURVIVES'
  // assertion went vacuous under the run.afk gate. The afk arm is the decisive oracle — unpark is
  // live there, and the unsound verdict's revert must still keep the question with the operator
  // (recordAced never fires on a reverted batch).
  for (const [mode, runOver] of [['interactive', {}], ['afk', { afk: true }]]) {
    const a = nit({ title: 'plain nit', file: 'skills/a.js' })
    const unsoundVerdict = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
      confidence: 'high', findings: [{ severity: 'Major', title: 'citation mismatch', file: 'docs/x.md',
        citationUnsound: true, rationale: 'the cited row covers log retention, not the mirror-vs-point call' }] }
    const impl = buildSeqImpl(
      { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), a]),
                                 approveWith('audit:t1:correctness', [citationF()]),
                                 unsoundVerdict] },
      quietGate(aceBase([askFinding(), a])))
    const { out, calls, logs } = await runPhase(CITE_ARGS({ run: { ace: true, ...runOver } }), impl)
    assert.equal(calls.filter(isAce).length, 2, `[${mode}] batch + the one re-entry attempt (bounded — no retry after the unsound verdict)`)
    const demoteLog = logs.find(l => typeof l === 'string' && l.includes('UNSOUND'))
    assert.ok(demoteLog, `[${mode}] the unsound-citation demotion is logged`)
    assert.ok(demoteLog.includes('ADJ-7: doc facts point at the source, never mirror'), `[${mode}] the demotion names the cited row`)
    assert.ok(demoteLog.includes('log retention, not the mirror-vs-point call'), `[${mode}] the demotion NAMES the mismatch (the panel finding rationale)`)
    assert.ok((out.minorsFiled || []).some(m => m && m.title === 'mirrored value rides docs/x.md'),
      `[${mode}] the unsound citation finding demotes to follow-up (never a silent drop)`)
    const merge = calls.find(isMergeTask)
    assert.match(merge.prompt, /revert\s+--no-edit\s+deadbeef/, `[${mode}] the unsound batch is forward-reverted at the merge (blocking ⇒ revert)`)
    assert.equal((out.asks || []).length, 1, `[${mode}] the parked ask SURVIVES an unsound execution — the question returns to the operator, never silently resolved${mode === 'afk' ? ' (decisive: afk unpark is live and the revert pre-empts it)' : ''}`)
    if (mode === 'interactive') assert.ok(!out.asks[0].citationPrefill,
      'an unsound (reverted) execution attaches NO prefill — recordAced never fired for the reverted batch')
    assert.ok(out.landed.includes('t1'), `[${mode}] t1 still lands its approved work`)
  }
})

test('citation-unsound (End state 5, round-1-batch path): a citation absorb riding the ROUND-1 batch ace that regresses with citationUnsound demotes NAMING the mismatch — the naming duty holds on every path, not only re-entry', async () => {
  // The citation-carrying absorb enters the round-1 aceable batch directly (it is a plain
  // disposition:'absorb' finding) — the FIRST path it meets. The regressed re-audit flags
  // citationUnsound; the single-file batch is ambiguous-and-atomic, so aceBisect demotes whole —
  // and the demote reason must carry the mismatch (the shared unsoundReason helper), not only the
  // generic bisection string.
  const unsoundVerdict = { seat: 'audit:t1:correctness', lens: 'correctness', verdict: 'request_changes',
    confidence: 'high', findings: [{ severity: 'Major', title: 'citation mismatch', file: 'zz-unrelated.js',
      citationUnsound: true, rationale: 'the cited row covers log retention, not the mirror-vs-point call' }] }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [citationF()]),
                               unsoundVerdict] },
    quietGate(aceBase([citationF()])))
  const { out, calls, logs } = await runPhase(CITE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 1, 'the round-1 batch ace only (single file group — ambiguous-and-atomic, no subsets)')
  const demoteLog = logs.find(l => typeof l === 'string' && l.includes('UNSOUND'))
  assert.ok(demoteLog, 'the round-1-batch unsound-citation demotion is logged with the mismatch')
  assert.ok(demoteLog.includes('ADJ-7: doc facts point at the source, never mirror'), 'the batch-path demotion names the cited row')
  assert.ok(demoteLog.includes('log retention, not the mirror-vs-point call'), 'the batch-path demotion NAMES the mismatch (the panel finding rationale)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'mirrored value rides docs/x.md'),
    'the citation finding demotes to follow-up on the batch path (never a silent drop)')
  assert.ok(!(out.aced || []).some(x => x && x.citation), 'nothing aced with a citation after the unsound batch revert')
  assert.ok(out.landed.includes('t1'), 't1 still lands its approved work')
})

test('ask-content-key (End state 6, cross-round stability): a persisting ask re-minted at the re-audit parks ONCE — the re-raise merges as corroboration, logged', async () => {
  const a = nit({ title: 'plain nit', file: 'skills/a.js' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [askFinding(), a]),
                               approveWith('audit:t1:correctness', [askFinding()])] },
    quietGate(aceBase([askFinding(), a])))
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.equal((out.asks || []).length, 1, 'ONE parked record for the persisting ask across two rounds (content-key identity beats minorsOf\'s fresh copies, #1810)')
  assert.equal((out.asks[0].corroborators || []).length, 1, 'the round-2 re-mint lands on the surviving record\'s corroborators list')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('merged as corroboration')), 'the collision is logged (never a silent drop, #1790)')
})

test('ask-content-key (End state 6, D8 property floor both directions): the key is stable across re-mints of the SAME finding AND distinguishes distinct findings on the same task', () => {
  const sliceStart = src.indexOf('const dispositionOf')
  const sliceEnd = src.indexOf('const aceEligible')
  const harness = new Function('log', 'notes', 'minorsFiled', 'asks',
    src.slice(sliceStart, sliceEnd) + '\nreturn { parkAsk, askContentKey }')
  const logs = [], asks = []
  const { parkAsk, askContentKey } = harness(m => logs.push(m), [], [], asks)
  const mint = (over = {}) => ({ severity: 'Minor', task: 't1', title: 'mirror or point', disposition: 'ask',
    ask: { question: 'mirror the value or point at the source?', fork: ['mirror', 'point'] }, ...over })
  // Direction 1 — stability: two FRESH COPIES (distinct objects, drifted seat/sha) share one key
  // and park once. Delete-the-feature: the old object-identity check parks both.
  const r1 = mint({ seat: 'audit:t1:correctness', sha: 'aaa1111' })
  const r2 = mint({ seat: 'audit:t1:correctness:rebut', sha: 'bbb2222' })
  assert.notEqual(r1, r2, 'fixture control: the two mints are distinct objects (object identity would false-miss)')
  assert.equal(askContentKey(r1), askContentKey(r2), 'the content key is STABLE across rounds for the same finding')
  parkAsk(r1); parkAsk(r2)
  assert.equal(asks.length, 1, 'one park per persisting finding across rounds')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('merged as corroboration')), 'the second mint merges as corroboration, logged')
  // Direction 2 — distinctness: a DIFFERENT finding on the SAME task never collapses.
  const other = mint({ title: 'keep or retire the contract?', ask: { question: 'keep or retire the contract?', fork: ['keep', 'retire'] } })
  assert.notEqual(askContentKey(r1), askContentKey(other), 'distinct findings on the same task get distinct keys')
  parkAsk(other)
  assert.equal(asks.length, 2, 'the distinct same-task finding parks as its own record (never collapsed)')
  // Same question on a DIFFERENT task is a different finding too (task is in the tuple).
  parkAsk(mint({ task: 't2' }))
  assert.equal(asks.length, 3, 'the same question on another task is its own record')
})

test('ask-content-key (End state 6, aced ∩ minorsFiled = ∅): a later-round re-mint of an ALREADY-ACED finding never also files — corroboration, logged', async () => {
  const a = nit({ title: 'absorbed once', file: 'skills/a.js' })
  // Round 2 re-mints the SAME finding content as a Minor follow-up (no disposition ⇒ Minor default).
  const remint = { severity: 'Minor', title: 'absorbed once', file: 'skills/a.js', rationale: 'still visible in a stale view' }
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [a]),
                               approveWith('audit:t1:correctness', [remint])] },
    quietGate(aceBase([a])))
  const { out, logs } = await runPhase(ACE_ARGS(), impl)
  assert.ok((out.aced || []).some(x => x && x.finding && x.finding.title === 'absorbed once'), 'the finding is aced (round-1 batch)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'absorbed once'),
    'no finding lands in BOTH aced and minorsFiled (#1810 double-file arm)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('corroboration of the aced record')),
    'the skipped re-mint is logged as corroboration (never silent)')
})

test('ask-content-key (End state 6, aced ∩ minorsFiled = ∅, REVERSE direction): a finding FILED as follow-up in round 1 and re-raised as an absorb at the re-audit is never aced — the filed record stands, the suppression is logged', async () => {
  // The other direction of the disjointness conjunct: round 1 files X as follow-up (minorsFiled)
  // alongside a separate absorb (so the batch ace and its re-audit run at all). The re-audit
  // re-mints X's content as an ABSORB — exactly the flip the DISPOSITION WIDENINGS doctrine
  // ('born at a re-audit DEFAULTS to absorb') produces. filedKeys must refuse the re-queue, or X
  // re-enters, aces, and lands in BOTH aced and minorsFiled — an issue filed for work the run
  // just executed.
  const filed = { severity: 'Minor', title: 'filed once', file: 'skills/filed.js', rationale: 'needs a real design pass', disposition: 'follow-up' }
  const absorbed = nit({ title: 'absorbed nit', file: 'skills/a.js' })
  const remintAsAbsorb = nit({ title: 'filed once', file: 'skills/filed.js', rationale: 'mechanical after all' })
  const impl = buildSeqImpl(
    { 'audit:t1:correctness': [approveWith('audit:t1:correctness', [filed, absorbed]),
                               approveWith('audit:t1:correctness', [remintAsAbsorb]),
                               approveWith('audit:t1:correctness', [])] },
    quietGate(aceBase([filed, absorbed])))
  const { out, calls, logs } = await runPhase(ACE_ARGS(), impl)
  assert.equal(calls.filter(isAce).length, 1, 'only the round-1 batch ace dispatched — the filed finding\'s absorb re-mint never re-enters the ladder')
  assert.equal((out.minorsFiled || []).filter(m => m && m.title === 'filed once').length, 1,
    'the follow-up stays filed exactly ONCE (the durable record stands)')
  assert.ok(!(out.aced || []).some(x => x && x.finding && x.finding.title === 'filed once'),
    'the re-minted absorb is never aced — the finding lands in exactly ONE of aced/minorsFiled (End state 6)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('re-entry REFUSED') && l.includes('filed once') && l.includes('already filed as a follow-up')),
    'the suppression is logged naming the filed record (never silent)')
  assert.ok((out.aced || []).some(x => x && x.finding && x.finding.title === 'absorbed nit'),
    'fixture control: the genuine absorb still aced (the refusal is key-scoped, not a blanket stop)')
})

// --- Registry-coverage fixes (attempt-1 audit Majors): remintKey re-key, queuedKeys, cross-seat merge ---
// Shared slice harness: dispositionOf → allApprove covers parkAsk/demote/the four registries/
// remintKey/remintBlock/corroborateSurvivor/routeToSweep/routeReauditMinors. minorsOf is defined
// ABOVE the slice, so a shape-faithful stub is injected (seat-stamped copies, Minor/Nit only).
const registrySlice = () => {
  const sliceStart = src.indexOf('const dispositionOf')
  const sliceEnd = src.indexOf('const allApprove')
  assert.ok(sliceStart !== -1 && sliceEnd > sliceStart, 'the dispositionOf→allApprove registry slice is locatable')
  const harness = new Function('log', 'notes', 'minorsFiled', 'asks', 'aced', 'phaseCloseQueue', 'minorsOf', 'run',
    src.slice(sliceStart, sliceEnd)
    + '\nreturn { askContentKey, remintKey, remintBlock, parkAsk, fileFollowUp, recordAced, routeToSweep, routeReauditMinors, corroborateSurvivor, queuedKeys }')
  const state = { logs: [], notes: [], minorsFiled: [], asks: [], aced: [], phaseCloseQueue: [] }
  const minorsOf = seats => seats.flatMap(s => (s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit').map(f => ({ seat: s.seat, sha: s.audit_sha ?? null, ...f })))
  const api = harness(m => state.logs.push(m), state.notes, state.minorsFiled, state.asks, state.aced, state.phaseCloseQueue, minorsOf, { ace: true })
  return { ...state, ...api }
}

test('ask-content-key (registry re-key, D8 both directions on the FINDING tuple): remintKey is stable across seat/sha churn and ./-path drift, and distinguishes same-task findings by file AND title — askContentKey stays parkAsk-only', () => {
  const h = registrySlice()
  const mint = (over = {}) => ({ severity: 'Minor', task: 't1', title: 'stale mirror', file: 'skills/a.js', disposition: 'absorb', ...over })
  // Direction 1 — stability: seat/sha churn and a `./`-form path never change the key.
  assert.equal(h.remintKey(mint({ seat: 'audit:t1:correctness', sha: 'aaa1111' })),
               h.remintKey(mint({ seat: 'audit:t1:style:rebut', sha: 'bbb2222' })),
               'seat/sha churn never changes the finding key')
  assert.equal(h.remintKey(mint({ file: './skills/a.js' })), h.remintKey(mint()),
               'a ./-form re-mint of the same file shares the key (the #1813 normalization)')
  // Direction 2 — distinctness: file and title are both in the tuple (the attempt-1 Major:
  // a question/title-only key collapsed same-title findings on DIFFERENT files).
  assert.notEqual(h.remintKey(mint()), h.remintKey(mint({ file: 'skills/b.js' })),
    'same title on a DIFFERENT file is a different finding (never collapsed)')
  assert.notEqual(h.remintKey(mint()), h.remintKey(mint({ title: 'other defect' })),
    'a different title on the same file is a different finding')
  assert.notEqual(h.remintKey(mint()), h.remintKey(mint({ task: 't2' })),
    'the same finding shape on another task is a different finding')
  // askContentKey stays the ASK channel's identity: same question on two files parks ONCE
  // (question identity), while the FINDING registries would distinguish the pair by file.
  const ask = f => ({ severity: 'Minor', task: 't1', title: 'mirror or point', disposition: 'ask',
    ask: { question: 'mirror the value or point at the source?', fork: ['mirror', 'point'] }, ...f })
  h.parkAsk(ask({ file: 'skills/a.js', seat: 's1' })); h.parkAsk(ask({ file: 'skills/b.js', seat: 's2' }))
  assert.equal(h.asks.length, 1, 'parkAsk keys on the question (askContentKey) — one parked record, the re-raise corroborates')
  assert.notEqual(h.remintKey(ask({ file: 'skills/a.js' })), h.remintKey(ask({ file: 'skills/b.js' })),
    'fixture control: the FINDING tuple distinguishes the same pair by file')
  // Engine pins: every FINDING registry stamp reads remintKey; parkAsk keeps askContentKey.
  assert.ok(src.includes('filedKeys.add(remintKey(f))'), 'filedKeys keys on remintKey')
  assert.ok(src.includes('revertedKeys.add(remintKey(f))'), 'revertedKeys keys on remintKey')
  assert.ok(src.includes('acedKeys.add(remintKey(f))'), 'acedKeys keys on remintKey')
  assert.ok(!src.includes('filedKeys.add(askContentKey'), 'no FINDING registry still keys on the ask tuple')
  const parkBody = src.slice(src.indexOf('const parkAsk'), src.indexOf('const parkAsk') + 400)
  assert.ok(parkBody.includes('askContentKey(f)'), 'parkAsk keeps the question-derived askContentKey')
})

test('reaudit-sweep (queued registry): a finding already queued for the sweep or re-entry never queues a SECOND record — the re-mint is refused with the queued reason, logged, and a distinct finding still queues', () => {
  const h = registrySlice()
  const f = { severity: 'Minor', task: 't1', title: 'stale count', file: 'skills/a.js', disposition: 'absorb', phaseClose: true, seat: 'audit:t1:correctness' }
  // Entry point 1 — routeToSweep stamps queuedKeys.
  h.routeToSweep({ ...f }, 'reserve-blocked re-entry (fixture)')
  assert.equal(h.phaseCloseQueue.length, 1, 'the finding queues for the sweep once')
  assert.ok(h.queuedKeys.has(h.remintKey(f)), 'routeToSweep stamps the queued registry')
  // A later re-audit re-mints the same content (fresh copy, drifted seat): never a second record.
  const r = { task: { id: 't1' } }
  h.routeReauditMinors(r, [{ seat: 'audit:t1:style', findings: [{ ...f, seat: undefined }] }])
  assert.equal(h.phaseCloseQueue.length, 1, 'the re-mint never queues a second sweep record')
  assert.equal((r.reentryQueue || []).length, 0, 'the re-mint never re-queues for re-entry either')
  assert.ok(h.logs.some(l => typeof l === 'string' && l.includes('already queued for the phase-close sweep / re-entry this phase — the queued record stands')),
    'the refusal is logged with the queued-registry reason (never silent)')
  // Entry point 2 — the re-entry queue arm stamps too: a fresh eligible absorb queues once.
  const g = { severity: 'Nit', task: 't1', title: 'lagging comment', file: 'skills/b.js', disposition: 'absorb' }
  h.routeReauditMinors(r, [{ seat: 'audit:t1:correctness', findings: [{ ...g }] }])
  assert.equal(r.reentryQueue.length, 1, 'the distinct finding still queues (the refusal is key-scoped)')
  assert.ok(h.queuedKeys.has(h.remintKey({ task: 't1', ...g })), 'the re-entry push stamps the queued registry')
  h.routeReauditMinors(r, [{ seat: 'audit:t1:style', findings: [{ ...g }] }])
  assert.equal(r.reentryQueue.length, 1, 'a re-mint of the queued re-entry finding never double-queues')
  // Engine pin: the round-1 approve arm's direct phaseCloseQueue push stamps queuedKeys too.
  assert.ok(src.includes('else { queuedKeys.add(remintKey(f)); phaseCloseQueue.push(f) }'),
    'the round-1 approve arm stamps queuedKeys at its direct sweep push')
  // Engine pin: the drain deletes drained keys BEFORE the re-check (a drained finding is no
  // longer queued — its own stamp must never refuse its own dispatch).
  assert.ok(src.includes('for (const f of drained) queuedKeys.delete(remintKey(f))'),
    'aceReentry drains delete the drained entries\' queued stamps before the registry re-check')
})

test('ask-content-key (cross-seat corroboration): a second seat re-minting a filed or aced finding merges onto the surviving row\'s seats list — never dropped, never double-filed', () => {
  const h = registrySlice()
  const r = { task: { id: 't1' } }
  // Filed direction: seat A files round 1; seat B re-mints at the re-audit.
  const fA = { severity: 'Minor', task: 't1', title: 'needs design pass', file: 'skills/a.js', seat: 'audit:t1:correctness', rationale: 'non-mechanical' }
  h.fileFollowUp(fA)
  h.routeReauditMinors(r, [{ seat: 'audit:t1:style', findings: [{ severity: 'Minor', title: 'needs design pass', file: 'skills/a.js', disposition: 'follow-up', rationale: 'still there' }] }])
  assert.equal(h.minorsFiled.length, 1, 'never double-filed — one surviving row')
  assert.deepEqual(h.minorsFiled[0].seats, ['audit:t1:correctness (task t1)', 'audit:t1:style (task t1)'],
    'the second seat merges onto the surviving row\'s seats list, seeded with the first raiser (seatRef shape)')
  // Aced direction: a re-mint of an aced finding lands its seat on the aced record's finding.
  const gA = { severity: 'Nit', task: 't1', title: 'stale comment', file: 'skills/b.js', seat: 'audit:t1:correctness' }
  h.recordAced(gA, 'abc1234')
  h.routeReauditMinors(r, [{ seat: 'audit:t1:evidence', findings: [{ severity: 'Nit', title: 'stale comment', file: 'skills/b.js', disposition: 'absorb' }] }])
  assert.equal((r.reentryQueue || []).length, 0, 'the aced re-mint never re-enters')
  assert.ok(!h.minorsFiled.some(m => m.title === 'stale comment'), 'the aced re-mint never files (aced ∩ minorsFiled = ∅ holds)')
  assert.ok(h.aced[0].finding.seats.includes('audit:t1:evidence (task t1)'),
    'the corroborating seat lands on the aced record\'s finding seats list')
  assert.ok(h.aced[0].finding.seats.includes('audit:t1:correctness (task t1)'), 'the original raiser survives on the list')
  // A same-round SAME-seat duplicate never fabricates corroboration (seats stay distinct).
  h.routeReauditMinors(r, [{ seat: 'audit:t1:evidence', findings: [{ severity: 'Nit', title: 'stale comment', file: 'skills/b.js', disposition: 'absorb' }] }])
  assert.equal(h.aced[0].finding.seats.filter(x => x === 'audit:t1:evidence (task t1)').length, 1,
    'a repeat by the SAME seat never duplicates its entry (corroboration is cross-seat)')
})

test('ask-collision (End state 7): every measured ask-drop sink merges a content collision as corroboration or logs it — one parametrized check over the THREE gate-audit sites plus a no-silent-discard negative control', async () => {
  // Parametrized source leg — the three structurally identical sites (per-task execution-evidence,
  // integrated-tip, end-state): each parks UNCONDITIONALLY through parkAsk (the collision handling
  // lives in the funnel); the retired `asks.some(` guard — the unlogged silent sink #1790 measured —
  // is absent from every site window.
  const SITES = [
    "':execution-evidence', sha: auditShaOrSentinel(gateAuditVerdict.audit_sha)",
    "':integrated-tip', sha: auditShaOrSentinel(authVerdict.audit_sha)",
    "':end-state', sha: auditShaOrSentinel(esVerdict.audit_sha)",
  ]
  for (const anchor of SITES) {
    const i = src.indexOf(anchor)
    assert.ok(i !== -1, `gate-audit ask site locatable: ${anchor}`)
    const window = src.slice(Math.max(0, i - 400), i)
    assert.ok(window.includes('parkAsk('), `site ${anchor}: parks through the parkAsk funnel`)
    assert.ok(!window.includes('asks.some('), `site ${anchor}: the arm-local silent-discard guard is retired (#1790)`)
  }
  // Lookbehind excludes `tasks.some(` (a different construct sharing the substring).
  assert.ok(!/(?<![A-Za-z])asks\.some\(/.test(src), 'NO asks.some( silent-discard guard survives anywhere in the template')
  // Behavioral leg (the reachable per-task site): a gate-audit re-raise of a roster-parked ask
  // MERGES as corroboration + log; a DISTINCT gate-audit ask still parks (no silent discard).
  const distinctAsk = askFinding({ title: 'gate-only question',
    ask: { question: 'capture or recompute the artifact?', fork: ['capture', 'recompute'] } })
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor') {
      if ((opts.label || '').startsWith('gate-audit:'))
        return { seat: opts.label, lens: 'execution-evidence', verdict: 'approve', confidence: 'high',
          audit_sha: 'beefcafe12', findings: [askFinding(), distinctAsk] }
      return { seat: opts.label, lens: 'correctness', verdict: 'approve', findings: [askFinding()], confidence: 'high' }
    }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, logs } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  assert.equal((out.asks || []).length, 2, 'two parked records: the merged collision + the distinct gate-audit ask')
  const merged = out.asks.find(x => x && x.question === 'mirror the value or point at the source?')
  assert.ok(merged && (merged.corroborators || []).some(c => c && c.seat === 'gate-audit:t1:execution-evidence'),
    'the gate-audit re-raise MERGED as corroboration on the roster-parked record (never dropped)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('merged as corroboration')), 'the collision is logged')
  // No-silent-discard negative control: the non-colliding gate-audit ask parks as its own record.
  assert.ok(out.asks.some(x => x && x.question === 'capture or recompute the artifact?'),
    'a NON-colliding gate-audit ask parks — the lane never silently discards')
})

test('lens-suffix (End state 7): lens extraction keys on the FAMILY PREFIX — gate-audit-family labels yield execution-evidence (never a phase segment); trailing-segment + :rebut strip otherwise — on BOTH mirror surfaces', async () => {
  const impl = (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-auditor')
      // A phase-level gate-audit-family seat label rides the filing row (the family-prefix rule's
      // live subject: trailing-segment extraction would wrongly yield 'integrated-tip').
      return { seat: 'gate-audit:phase-1:integrated-tip', lens: 'execution-evidence', verdict: 'approve', confidence: 'high',
        findings: (opts.label || '').startsWith('gate-audit:') ? []
          : [{ severity: 'Minor', title: 'family-prefix row', rationale: 'r', file: 'r.js' }] }
    if (seat === 'war-refiner' && opts.dispatchKind === 'file-followups') return null
    return handoffImpl(undefined)(prompt, opts)
  }
  const { out, calls } = await runPhase(HANDOFF_ARGS(), impl)
  assert.equal(out.landDecision, 'landed', 'presence guard')
  const fp = calls.find(c => c.opts.dispatchKind === 'file-followups').prompt
  assert.match(fp, /"family-prefix row"[^\n]* · seats: gate-audit:phase-1:integrated-tip \(task t1\)/,
    'the gate-audit-family seat label rides the candidate row (the rule has a live subject)')
  assert.ok(fp.includes('FAMILY-PREFIX rule') && fp.includes('yields the lens `execution-evidence`'),
    'the dispatched Evidence-artifacts clause carries the family-prefix rule (#1789)')
  assert.ok(fp.includes('a trailing `:rebut` is a dispatch label, never the lens: take the segment before it'),
    'the :rebut carve-out survives on the non-gate-audit arm')
  const ffMd = readFileSync(join(here, '../references/file-followups.md'), 'utf8')
  assert.ok(ffMd.includes('FAMILY-PREFIX rule') && ffMd.includes('yields the lens `execution-evidence`'),
    'file-followups.md mirrors the family-prefix rule (standing-surface leg, same commit)')
  assert.ok(ffMd.includes('a trailing `:rebut` is a dispatch label, never the lens — take the segment before it'),
    'file-followups.md keeps the :rebut carve-out on the otherwise-arm')
  // Reference implementation of the documented rule + the WRONG-YIELD negative control.
  const lensOf = entry => {
    const label = entry.split(' (task ')[0]
    const segs = label.split(':')
    if (segs[0] === 'gate-audit') return 'execution-evidence'
    const last = segs[segs.length - 1]
    return last === 'rebut' ? segs[segs.length - 2] : last
  }
  assert.equal(lensOf('gate-audit:phase-1:integrated-tip'), 'execution-evidence', 'family prefix wins for the phase-level label')
  assert.notEqual(lensOf('gate-audit:phase-1:integrated-tip'), 'phase-1', 'wrong-yield negative control: phase-1 is NEVER produced as a lens')
  assert.equal(lensOf('gate-audit:t1:execution-evidence'), 'execution-evidence', 'the per-task family label yields the same lens')
  assert.equal(lensOf('gate-audit:phase-2:end-state'), 'execution-evidence', 'the end-state family label yields the same lens')
  assert.equal(lensOf('audit:t1:correctness:rebut (task t1)'), 'correctness', 'the :rebut dispatch-label strip holds on the otherwise-arm')
  assert.equal(lensOf('audit:t1:correctness (task t1)'), 'correctness', 'plain trailing-segment extraction holds on the otherwise-arm')
})

test('ace-group-path (End state 8): aceGroups and the Ace-Subset trailer key on aceRelPath-normalized paths — a ./-form and bare-form pair of the same file lands in ONE subset', () => {
  const sliceStart = src.indexOf('const aceRelPath')
  const sliceEnd = src.indexOf('const citationOf')
  assert.ok(sliceStart !== -1 && sliceEnd > sliceStart, 'the aceRelPath→aceHalve engine slice is locatable')
  const { aceRelPath, aceGroups, aceHalve } = new Function(
    src.slice(sliceStart, sliceEnd) + '\nreturn { aceRelPath, aceGroups, aceHalve }')()
  const pair = [{ file: './skills/x.js', title: 'dot form' }, { file: 'skills/x.js', title: 'bare form' }]
  const groups = aceGroups(pair)
  assert.equal(groups.length, 1, 'the ./-form and bare-form pair groups as ONE file (never split across subsets, D3)')
  assert.equal(groups[0].length, 2, 'both findings ride the single group')
  assert.equal(aceHalve(pair), null, 'the normalized single-file group is ATOMIC — halving refuses to split it')
  assert.equal(aceRelPath('././skills/x.js'), 'skills/x.js', 'a repeated ./ run strips fully')
  // Delete-the-feature control: raw-file grouping splits the pair (the pre-#1813 defect shape).
  const rawGroups = new Map(); for (const f of pair) { if (!rawGroups.has(f.file)) rawGroups.set(f.file, []); rawGroups.get(f.file).push(f) }
  assert.equal(rawGroups.size, 2, 'fixture control: WITHOUT normalization the pair splits — the aceRelPath key is load-bearing')
  // Both trailer builds key on the normalized path too (#1813): the bisection-subset trailer and
  // the re-entry trailer.
  assert.ok(src.includes('sub.findings.map(f => aceRelPath(f.file))'), 'the bisection-subset Ace-Subset trailer normalizes through aceRelPath')
  assert.ok(src.includes('batch.map(f => aceRelPath(f.file))'), 'the re-entry Ace-Subset trailer normalizes through aceRelPath')
})

test('ruled-ask-absorb (End state 12): a threaded ruled ask executes via the phase-close polish dispatch — aced on merge; on non-execution it files WITH the ruling recorded (PIN-17)', async () => {
  // The record carries the REQUIRED provenance coordinates (#1879 RULING 2): planSlug (the run's
  // own), phase, findingTitle — the #1413 floor reads the fields, not the ruling prose.
  const ruled = { task: 't9', findingTitle: 'flip the retention default', file: 'docs/retention.md',
    planSlug: 'wtprov-a', phase: '2',
    suggested_fix: 'set the documented default to 30d and note the trade-off',
    ruling: 'adopt the 30d default (operator, 2026-08-27, strike-list gate)' }
  // Execution arm: valid default roster ⇒ the sweep vehicle runs — fresh worktree at the working
  // tip, one commit, full panel, existing merge primitives, bounded one round by construction.
  const { out, calls, logs } = await runPhase(SWEEP_ARGS({ ruledAsks: [ruled] }), sweepBase([]))
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('ruled-ask execution (D15)') && l.includes('adopt the 30d default')),
    'the ruled ask is queued loudly with its ruling')
  const pw = calls.find(c => (c.opts.label || '') === 'polish:phase-3')
  assert.ok(pw && pw.prompt.includes('flip the retention default') && pw.prompt.includes('operator ruling: adopt the 30d default'),
    'the polish dispatch carries the ruled fix AND the ruling verbatim')
  assert.ok(calls.some(c => (c.opts.label || '') === 'audit:p3-polish:correctness'), 'the full panel re-audits the ruled-ask commit')
  assert.ok((out.aced || []).some(a => a && a.finding && a.finding.ruledAsk === true && a.sha === 'polishsha'),
    'the executed ruled ask is ACED at the polish sha (in-run execution, no issue filed)')
  assert.ok(!(out.minorsFiled || []).some(m => m && m.title === 'flip the retention default'), 'nothing files on successful execution')
  // Filing-on-non-execution arm: no default audit.roster ⇒ the sweep cannot convene ⇒ the ruled ask
  // demotes to follow-up WITH the ruling in its rationale — the filed issue records the ruling.
  const { out: out2, logs: logs2 } = await runPhase(ACE_ARGS({ ruledAsks: [ruled], run: {} }), quietGate(aceBase([])))
  const filed = (out2.minorsFiled || []).find(m => m && m.title === 'flip the retention default')
  assert.ok(filed, 'a non-executed ruled ask files (cannot-execute — never silently dropped)')
  assert.ok(filed.rationale.includes('adopt the 30d default'), 'the filed row records the ruling verbatim (PIN-17)')
  assert.ok(logs2.some(l => typeof l === 'string' && l.includes('Disposition demotion') && l.includes('flip the retention default')),
    'the non-execution demotion is logged')
})

// ---- #1879 RULING 2 — args.ruledAsks joins the #1413 args-provenance floor ---------------
// Two-sided per the floor's incident class: a foreign (plan-B) ruled-ask record in a plan-A
// launch is REFUSED at entry; a token-less short ruling stamped with the run's own planSlug
// LAUNCHES (fail-open preserved — the floor reads the FIELD, not the prose).

test('provenance floor (ruledAsks, #1879 RULING 2): a foreign ruled-ask record — this run\'s real phase-1 ledger cargo — is REFUSED at entry in a plan-A launch (zero spawns)', async () => {
  // DOGFOOD test vector: the first ruled-ask record from THIS plan's own run ledger
  // (.claude/teams/2026-08-27-in-run-finding-resolution-2026-08-27/ledger.json ruledAsks[0]),
  // verbatim — the channel's first cargo validates the channel. Its planSlug names a plan
  // foreign to the fixture launch's 'wtprov-a', so the field-read refusal fires.
  const ledgerCargo = {
    planSlug: '2026-08-27-in-run-finding-resolution',
    phase: '1',
    findingTitle: 'Absorb-by-citation can unpark an operator-gated ask in an interactive run, while the standing doc scopes the arm to --afk',
    ruling: 'Gate on run.afk === true; interactive citation-matches surface with prefilled recommended ruling; citation-informed rulings share the telemetry channel.',
    suggested_fix: 'One-condition gate at the recordAced unpark path (run.afk === true); strike-list prefill rendering; two-sided fixture (interactive surfaces-never-unparks / afk resolves-with-citation); telemetry symmetry.',
    vehicle: 'decompose-injection: phase 2 task 2.0',
  }
  const { out, calls } = await runPhase(PROVISION_ARGS({ ruledAsks: [ledgerCargo] }), defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'a foreign ruled-ask record refuses the launch at entry')
  assert.match(out.workflowError.message,
    /args\.ruledAsks carries a planSlug provenance stamp naming a foreign plan \(2026-08-27-in-run-finding-resolution\) differing from the run planSlug/,
    'the refusal names the surface, the stamp kind (planSlug — a field, not prose), and the foreign slug')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('provenance floor (ruledAsks, #1879 RULING 2): a token-less short ruling stamped with the run\'s OWN planSlug LAUNCHES — fail-open preserved, the field exempts the row', async () => {
  // The ruling/suggested_fix/findingTitle text carries NO 'wtprov' token — under prose scanning
  // this row would false-refuse; the REQUIRED own-planSlug coordinate exempts it (field-read).
  const short = { planSlug: 'wtprov-a', phase: '3', findingTitle: 'short ruled ask',
    ruling: 'do it', suggested_fix: 'one line' }
  const { out, calls, logs } = await runPhase(PROVISION_ARGS({ ruledAsks: [short] }), defaultImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'the token-less own-slug record never refuses the launch')
  assert.ok(calls.length > 0, 'the phase actually runs (agents spawned)')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('ruled-ask execution (D15)') && l.includes('short ruled ask')),
    'the record passes the intake (the required coordinates are present) and queues loudly')
})

test('provenance floor (ruledAsks, S1 third arm — #1879 recovery seed): an EXPLICIT-branch/worktree launch (NO planSlug derivation) with a foreign ruled-ask record is STILL refused at entry — the anchor falls back to plan.file\'s basename', async () => {
  // The exact silent-off configuration the S1 defect fired on (the recovery-relaunch shape): the
  // launch supplies explicit per-task branch/worktree, so top-level planSlug is legitimately
  // absent — an anchor derived from the OPTIONAL planSlug alone would switch the compare off and
  // admit the foreign record. The fallback anchor (plan.file basename, baseOf()-normalized,
  // .md-stripped: 'wtprov-a') must refuse it. The derivation-path arms alone verify the fix where
  // the defect never fired.
  const ledgerCargo = {
    planSlug: '2026-08-27-in-run-finding-resolution',
    phase: '1',
    findingTitle: 'Absorb-by-citation can unpark an operator-gated ask in an interactive run, while the standing doc scopes the arm to --afk',
    ruling: 'Gate on run.afk === true; interactive citation-matches surface with prefilled recommended ruling; citation-informed rulings share the telemetry channel.',
    suggested_fix: 'One-condition gate at the recordAced unpark path (run.afk === true); strike-list prefill rendering; two-sided fixture (interactive surfaces-never-unparks / afk resolves-with-citation); telemetry symmetry.',
  }
  const args = PROVISION_ARGS({ ruledAsks: [ledgerCargo] })
  delete args.planSlug
  args.tasks = args.tasks.map(t => ({ ...t,
    branch: `war/wtprov-a/p3-${t.id}`, worktree: `/abs/repo/.claude/worktrees/run-2026/p3-${t.id}` }))
  const { out, calls } = await runPhase(args, defaultImpl)
  assert.equal(out.landDecision, 'held:workflow-error', 'the foreign ruled-ask record refuses the explicit-branch launch at entry — the compare never silently switches off')
  assert.match(out.workflowError.message,
    /args\.ruledAsks carries a planSlug provenance stamp naming a foreign plan \(2026-08-27-in-run-finding-resolution\) differing from the plan\.file basename/,
    'the refusal names the fallback anchor (the plan.file basename) it compared against')
  assert.equal(calls.length, 0, 'zero agents spawned')
})

test('ruled-ask intake (S3 — #1879 recovery seed): every dropped non-conforming record is LOGGED with its findingTitle-or-(malformed) and the FAILED CONJUNCT — an operator ruling never vanishes silently, and conforming records still queue', async () => {
  // One record per REQUIRED-coordinate conjunct (plus a not-an-object control): deleting any of
  // the intake conjuncts un-drops its record AND silences its drop log — both red this fixture
  // (the prior audit's 'REQUIRED-coordinates intake conjuncts unguarded' finding). Each record's
  // text carries the run's own 'wtprov' token so the #1413 own-token floor never masks the intake
  // behavior under test.
  const slugless = { findingTitle: 'coordinate-less ruling', ruling: 'do it per the wtprov-a call', suggested_fix: 'one line', phase: '3' }
  const phaseless = { planSlug: 'wtprov-a', findingTitle: 'phase-less ruling', ruling: 'do it', suggested_fix: 'one line' }
  const titleless = { planSlug: 'wtprov-a', phase: 3, ruling: 'do it', suggested_fix: 'one line' }
  const notObject = 'a bare string (plan wtprov-a)'
  const conforming = { planSlug: 'wtprov-a', phase: '3', findingTitle: 'conforming ruled ask', ruling: 'do it', suggested_fix: 'one line' }
  const { out, logs } = await runPhase(PROVISION_ARGS({ ruledAsks: [slugless, phaseless, titleless, notObject, conforming] }), defaultImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'dropped records stay fail-open — the launch proceeds (inert to the queue, never a refusal)')
  const drops = logs.filter(l => typeof l === 'string' && l.includes('ruled-ask intake DROPPED'))
  assert.equal(drops.length, 4, 'every non-conforming record gets its own drop log line')
  assert.ok(drops.some(l => l.includes('"coordinate-less ruling"') && l.includes('planSlug (required provenance coordinate')),
    'a planSlug-less record is dropped LOUDLY, named by its findingTitle, with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"phase-less ruling"') && l.includes('phase (required provenance coordinate')),
    'a phase-less record is dropped LOUDLY with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"(malformed)"') && l.includes('findingTitle (required provenance coordinate')),
    'a findingTitle-less record is dropped LOUDLY under the (malformed) placeholder with the failed conjunct')
  assert.ok(drops.some(l => l.includes('"(malformed)"') && l.includes('not an object')),
    'a non-object entry is dropped LOUDLY under the (malformed) placeholder')
  const queued = logs.filter(l => typeof l === 'string' && l.includes('ruled-ask execution (D15)'))
  assert.equal(queued.length, 1, 'exactly the conforming record queues')
  assert.ok(queued[0].includes('conforming ruled ask'), 'the conforming record rides the queue untouched (positive control)')
})

test('ruled-ask intake (S3, container level): a present-but-non-array args.ruledAsks — a single record threaded unwrapped — is IGNORED with one loud log line and zero records queue', async () => {
  // The plausible one-ruling typo: the record itself is conforming, but threaded unwrapped. The
  // whole channel is ignored — loudly, never silently (the container-level half of the S3
  // 'an operator ruling never vanishes silently' invariant). The wtprov-a slug keeps the #1413
  // floor out of the picture (a non-array surface maps to zero rows there anyway).
  const unwrapped = { planSlug: 'wtprov-a', phase: '3', findingTitle: 'x', ruling: 'y', suggested_fix: 'z' }
  const { out, logs } = await runPhase(PROVISION_ARGS({ ruledAsks: unwrapped }), defaultImpl)
  assert.notEqual(out.landDecision, 'held:workflow-error', 'a non-array container stays fail-open — the launch proceeds')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('ruled-ask intake IGNORED a non-array args.ruledAsks (object)')),
    'the ignored container gets one log line naming the received type')
  assert.equal(logs.filter(l => typeof l === 'string' && l.includes('ruled-ask execution (D15)')).length, 0,
    'zero records queue from a non-array container')
})

// ---------------------------------------------------------------------------
// #1913 — wave-side ace stage, delta-scaled re-audit, and pin transfer.
// The ace batch, its PIN-12 gate check, its re-audit and the bisection/re-entry
// ladders moved OUT of the serial merge queue into the wave thunk; the merge slot
// gained a mechanical pin-transfer probe. Covers End states 3, 4, 5, 6 and 9.
// ---------------------------------------------------------------------------

// Two-seat roster so a delta-scaled round can re-run ONE lens and transfer the other.
const PT_ARGS = (over = {}) => PROVISION_ARGS({
  tasks: [{ id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1',
    roster: [{ lens: 'correctness' }, { lens: 'security' }] }],
  run: { ace: true },
  ...over,
})
// An approving seat carrying `findings`, echoing the pin it was dispatched at.
const seatAt = (label, lens, sha, findings = []) => ({ seat: label, lens, audit_sha: sha, verdict: 'approve', findings, confidence: 'high' })
// The two-seat impl: round 1 raises `first` from the correctness seat only; every later round approves
// clean. `aceResult` is what the ace worker returns (head_sha + the git-derived ace_diff_files).
const ptImpl = (first, aceResult, over = {}) => (prompt, opts) => {
  const seat = seatOf(opts)
  if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
  if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
  if (seat === 'war-worker') return aceResult
  if (seat === 'war-auditor') {
    const lens = /security/.test(opts.label || '') ? 'security' : 'correctness'
    const sha = /ace00001/.test(prompt) ? 'ace00001' : 'deadbeef'
    const findings = (sha === 'deadbeef' && lens === 'correctness') ? first : []
    return { ...seatAt(opts.label, lens, sha, findings), ...(over.seatOver ? over.seatOver(lens, sha) : {}) }
  }
  if (seat === 'war-refiner') return opts.phase === 'Land' ? { mode: 'land-phase', status: 'landed' } : { mode: 'merge-task', status: 'merged' }
  if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
  return {}
}
const ACE_FILE = 'skills/war/assets/x.js'
const aceOk = (over = {}) => ({ task_id: 't1', status: 'implemented', head_sha: 'ace00001',
  ace_diff_files: [ACE_FILE], files_changed: [ACE_FILE], tests: { unit: 1 }, ...over })
const lensesOf = (calls, sha) => calls.filter(c => isAuditor(c) && c.prompt.includes(sha))
  .map(c => (c.opts.label || '').split(':').pop()).sort()

test('#1913 End state 3 — the ace batch, its gate check and its re-audit all dispatch on the WAVE side, before the first merge-task', async () => {
  // Two independent tasks, both acing. Every ace-family dispatch must precede EVERY merge-task
  // dispatch: the merge lock no longer pays for a re-audit. Delete the hoist and a merge lands
  // between one task's ace and the next task's, reding this.
  const args = PROVISION_ARGS({
    tasks: [
      { id: 't1', issue: 101, title: 'Task one', planSlice: 'slice 1', roster: [{ lens: 'correctness' }] },
      { id: 't2', issue: 102, title: 'Task two', planSlice: 'slice 2', roster: [{ lens: 'correctness' }] },
    ],
    run: { ace: true },
  })
  const { out, calls } = await runPhase(args, aceBase([nit()]))
  const aceIdx = calls.map((c, i) => [c, i]).filter(([c]) => isAce(c) || isAceGate(c)).map(([, i]) => i)
  const mergeIdx = calls.map((c, i) => [c, i]).filter(([c]) => isMergeTask(c)).map(([, i]) => i)
  assert.equal(aceIdx.length, 4, 'both tasks dispatch an ace worker and its gate check (2 tasks × 2)')
  assert.equal(mergeIdx.length, 2, 'both tasks reach the merge queue')
  assert.ok(Math.max(...aceIdx) < Math.min(...mergeIdx),
    'every ace-family dispatch precedes every merge-task dispatch — the whole ace path is wave-side')
  assert.deepEqual(out.landed.sort(), ['t1', 't2'], 'both tasks land')
})

test('#1913 End state 3 (PIN-5/PIN-13) — a wave-side ace round charges the SHARED fixRounds budget, so an ace run exhausts the floor-retry loop one round earlier', async () => {
  // A permanently-red no-test floor drains run.roundLimit. With --ace ON the batch ace has already
  // charged one slot wave-side, so exactly ONE FEWER add-test fix round is dispatched before
  // exhaustion. If the merge-slot seed re-seeded from r.round (rather than never-lowering), the two
  // runs would spend identical budgets and this goes red.
  const floorImpl = (findings) => (prompt, opts) => {
    const seat = seatOf(opts)
    if (seat === 'war-refiner' && opts.phase === 'Provision') return { ok: true }
    if (seat === 'war-worker' && opts.phase === 'Work') return { task_id: 't1', status: 'implemented', head_sha: 'deadbeef', tests: { unit: 1 } }
    if (seat === 'war-worker') return { task_id: 't1', status: 'implemented', head_sha: 'ace00001', ace_diff_files: [ACE_FILE], files_changed: [ACE_FILE], tests: { unit: 1 } }
    if (seat === 'war-auditor') return approveWith(opts.label, /ace00001/.test(prompt) ? [] : findings)
    if (seat === 'war-refiner' && opts.phase === 'Refine') return { mode: 'merge-task', status: 'no-test' }
    if (seat === 'war-refiner') return { mode: 'land-phase', status: 'landed' }
    if (seat === 'war-servitor') return { phase: 1, target: 't', learnings: [] }
    return {}
  }
  const addTests = (calls) => calls.filter(c => seatOf(c.opts) === 'war-worker' && /^add-test:/.test(c.opts.label || '')).length
  const withAce = await runPhase(ACE_ARGS({ run: { ace: true, roundLimit: 4 } }), floorImpl([nit()]))
  const noAce = await runPhase(ACE_ARGS({ run: { roundLimit: 4 } }), floorImpl([nit()]))
  assert.ok(withAce.calls.some(isAce), 'the --ace run really dispatched a wave-side ace')
  assert.ok(!noAce.calls.some(isAce), 'the control run dispatched no ace')
  assert.equal(addTests(withAce.calls), addTests(noAce.calls) - 1,
    'the ace round charged one slot of the SHARED budget: exactly one fewer floor-retry fix round')
  assert.ok((withAce.out.escalated || []).some(e => e && e.reason === 'no-test'), 'the floor still exhausts to the no-test escalation')
})

test('#1913 PIN-12/PIN-2 — a RED gate at the ace tip blocks the re-audit and the transfer: the ace commit is forward-reverted, the finding demotes, the task still lands', async () => {
  const { out, calls, logs } = await runPhase(ACE_ARGS(), aceBase([nit()]), { 'ace-gate': { gate_green: false, gate_output: 'FAIL: 1 test failed' } })
  assert.ok(calls.some(isAce), 'the ace worker ran')
  assert.ok(!calls.some(c => isAuditor(c) && c.prompt.includes('ace00001')), 'no re-audit is dispatched at a gate-red ace tip')
  assert.ok(!(out.aced || []).length, 'nothing is aced at a sha the gate never passed (PIN-12)')
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'tidy import'), 'the finding demotes to follow-up, never dropped')
  const merge = calls.find(isMergeTask)
  assert.match(merge.prompt, /FORWARD-REVERT/, 'the merge dispatch forward-reverts the gate-red ace tip')
  assert.ok(out.landed.includes('t1'), 'the approved pre-ace tip still merges — the ace never holds a task (PIN-2)')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), 'a red ace gate is never an escalation')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('ace-gate') && l.includes('RED')), 'the red gate is logged, never silent')
})

test('#1913 End states 4 + 6 — a footprint-SUBSET ace diff re-runs only the originating seat and TRANSFERS the other seat, with per-seat provenance', async () => {
  const { out, calls } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()))
  assert.deepEqual(lensesOf(calls, 'ace00001'), ['correctness'],
    'only the seat that raised the finding re-runs at the ace sha — the security seat does not')
  const row = (out.pinTransfers || []).find(p => p && p.kind === 'ace')
  assert.ok(row, 'the ace round records a pin-transfer row')
  assert.equal(row.mode, 'subset', 'the row records the subset mode')
  const byLens = Object.fromEntries(row.seats.map(s => [s.lens, s]))
  assert.equal(byLens.correctness.outcome, 're-ran', 'the originating seat is recorded as re-ran')
  assert.equal(byLens.security.outcome, 'transferred', 'the non-originating seat is recorded as transferred')
  assert.equal(byLens.security.sha, 'ace00001', 'the transferred approval is accounted AT the new sha (PIN-10)')
  assert.equal(byLens.security.approvedAt, 'deadbeef', 'and it names the sha the seat actually reviewed')
  assert.ok((out.aced || []).some(a => a && a.sha === 'ace00001'), 'the finding aces on the transferred unanimity')
  assert.ok(out.landed.includes('t1'), 't1 lands')
})

test('#1913 End state 4 (PIN-18) — every fail-closed arm re-runs the FULL panel: no git set, a file outside the footprint, a files_changed mismatch, and a seat-detected breach', async () => {
  const finding = nit({ file: ACE_FILE })
  const arms = [
    ['absent git set', aceOk({ ace_diff_files: undefined }), {}],
    ['empty git set', aceOk({ ace_diff_files: [] }), {}],
    ['a file outside the findings footprint', aceOk({ ace_diff_files: [ACE_FILE, 'skills/war/assets/other.js'], files_changed: [ACE_FILE, 'skills/war/assets/other.js'] }), {}],
    ['a files_changed cross-check mismatch', aceOk({ files_changed: [ACE_FILE, 'skills/war/assets/other.js'] }), {}],
    ['a seat-detected file outside the claimed set', aceOk(), { seatOver: (lens, sha) => (sha === 'ace00001' ? { scopeBreach: true } : {}) }],
  ]
  for (const [why, aceResult, over] of arms) {
    const { out, calls } = await runPhase(PT_ARGS(), ptImpl([finding], aceResult, over))
    assert.deepEqual(lensesOf(calls, 'ace00001').filter((l, i, a) => a.indexOf(l) === i).sort(), ['correctness', 'security'],
      `${why} ⇒ the FULL panel re-runs`)
    const row = (out.pinTransfers || []).find(p => p && p.kind === 'ace')
    assert.equal(row.mode, 'full-panel', `${why} ⇒ the row records the full-panel mode`)
    assert.ok(!row.seats.some(s => s.outcome === 'transferred'), `${why} ⇒ no approval transfers`)
  }
})

test('#1913 End states 5 + 7 — the merge slot TRANSFERS the pin on patch-id equality, recording reauditedTip, rebasedTip and BOTH patch-ids', async () => {
  const { out, calls } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'transferred', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p1' },
  })
  const probe = calls.find(isPinTransfer)
  assert.ok(probe, 'a pin-transfer probe is dispatched at the merge slot')
  assert.match(probe.prompt, /patch-id --stable/, 'the probe prompt names the patch-id measurement')
  assert.ok(calls.findIndex(isPinTransfer) < calls.findIndex(isMergeTask), 'the probe precedes the merge dispatch')
  const row = (out.pinTransfers || []).find(p => p && p.kind === 'merge')
  assert.ok(row, 'a merge-slot pin-transfer row is recorded')
  assert.equal(row.mode, 'transferred')
  assert.equal(row.rebasedTip, 'beef0001', 'rebasedTip is recorded (PIN-7)')
  assert.equal(row.reauditedTip, 'ace00001', 'reauditedTip is recorded (PIN-7)')
  assert.equal(row.prePatchId, 'p1'); assert.equal(row.postPatchId, 'p1')   // PIN-14: re-verifiable without replaying the rebase
  assert.ok(!calls.some(c => isAuditor(c) && c.prompt.includes('beef0001')), 'no panel re-convenes in the lock on a transfer')
  assert.ok(out.landed.includes('t1'), 't1 lands')
})

test('#1913 End state 5 (PIN-1) — a patch-id MISMATCH degrades to the in-lock FULL-panel re-audit of the rebased tip, then merges', async () => {
  const { out, calls, logs } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'mismatch', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p2' },
  })
  const reaudit = calls.filter(c => isAuditor(c) && c.prompt.includes('beef0001'))
  assert.equal(reaudit.length, 2, 'the FULL two-seat panel re-audits the rebased tip')
  assert.ok(calls.findIndex(c => isAuditor(c) && c.prompt.includes('beef0001')) < calls.findIndex(isMergeTask),
    'the in-lock re-audit precedes the merge dispatch')
  const row = (out.pinTransfers || []).find(p => p && p.kind === 'merge')
  assert.equal(row.mode, 'mismatch')
  assert.ok(row.seats.every(s => s.outcome === 're-ran'), 'no approval transfers on a mismatch — every seat re-ran')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('patch-id MISMATCH')), 'the mismatch is logged')
  assert.ok(out.landed.includes('t1'), 't1 still lands after the in-lock re-audit approves')
})

test('#1913 End state 5 (PIN-16 positive) — an empty post-rebase diff whose task commits all cherry-match upstream records already_upstream: no panel, no content merge', async () => {
  const { out, calls, logs } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'already_upstream', rebased_tip: 'facade01', pre_rebase_patch_id: 'p1',
      post_rebase_patch_id: '', already_upstream_commits: ['c0ffee1', 'c0ffee2'] },
  })
  assert.ok(!calls.some(isMergeTask), 'no merge-task dispatch — there is no content to merge')
  const row = (out.pinTransfers || []).find(p => p && p.kind === 'merge')
  assert.equal(row.mode, 'already_upstream')
  assert.deepEqual(row.alreadyUpstreamCommits, ['c0ffee1', 'c0ffee2'], 'the matched TASK commits are recorded')
  assert.equal(row.rebasedTip, 'facade01', 'rebasedTip is the integration tip')
  assert.ok(out.landed.includes('t1'), 't1 is recorded merged')
  assert.ok(!(out.escalated || []).some(e => e && e.task === 't1'), 'a genuinely-upstream task is not an escalation')
  assert.ok(logs.some(l => typeof l === 'string' && l.includes('already_upstream')), 'the arm is logged with its matched commits')
})

test('#1913 End state 5 (PIN-16 negative, #1895) — an empty diff with zero task commits or an empty pre-rebase patch-id ESCALATES, never merged', async () => {
  const { out, calls } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'empty-unmatched', detail: 'rev-list --count returned 0 — the task branch has no commits of its own' },
  })
  assert.ok(!calls.some(isMergeTask), 'no merge is dispatched')
  assert.ok(!out.landed.includes('t1'), 'a zero-commit branch is NEVER recorded merged (a never-started branch is vacuously an ancestor)')
  const esc = (out.escalated || []).find(e => e && e.task === 't1')
  assert.ok(esc, 't1 escalates')
  assert.equal(esc.reason, 'escalate', 'the refusal is HARD — a hard escalation is never downgraded by an in-band field (PIN-6)')
  assert.equal(out.landDecision, 'held:escalation', 'the phase holds rather than completing without the task')
})

// PIN-10 destination convention at the MERGE slot. A seat row's `sha` is the sha the approval is now
// accounted AT — the rebased tip — in every mode, mirroring aceSeatRows. The pre-rebase origin survives
// under `approvedAt` on a transferred row. A row recording the OLD audit_sha under `sha` would claim
// the approval still sits at a sha that is no longer the merged content.
test('#1913 End state 6 (PIN-10, merge slot) — every merge-slot seat row records the REBASED tip as its sha, keeping the pre-rebase audit sha under approvedAt', async () => {
  for (const [mode, probe] of [
    ['transferred', { status: 'transferred', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p1' }],
    ['already_upstream', { status: 'already_upstream', rebased_tip: 'facade01', pre_rebase_patch_id: 'p1', post_rebase_patch_id: '', already_upstream_commits: ['c0ffee1'] }],
  ]) {
    const { out } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), { 'pin-transfer': probe })
    const row = (out.pinTransfers || []).find(p => p && p.kind === 'merge')
    assert.ok(row && row.seats.length, mode + ': the merge-slot row carries seat rows')
    for (const s of row.seats) {
      assert.equal(s.outcome, 'transferred', mode + ': the seat transferred rather than re-ran')
      assert.equal(s.sha, row.rebasedTip, mode + ': the seat sha is the REBASED tip, not the pre-rebase audit_sha')
      assert.equal(s.approvedAt, 'ace00001', mode + ': the pre-rebase origin survives under approvedAt')
      assert.notEqual(s.approvedAt, s.sha, mode + ': origin and destination are distinct fields')
    }
  }
})

test('#1913 End state 6 (PIN-10, merge slot) — a MISMATCH row is built from the freshly re-audited seats and records the rebased tip', async () => {
  const { out } = await runPhase(PT_ARGS(), ptImpl([nit({ file: ACE_FILE })], aceOk()), {
    'pin-transfer': { status: 'mismatch', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p2' },
  })
  const row = (out.pinTransfers || []).find(p => p && p.kind === 'merge')
  assert.equal(row.mode, 'mismatch')
  assert.equal(row.seats.length, 2, 'both re-ran seats are recorded')
  for (const s of row.seats) {
    assert.equal(s.outcome, 're-ran', 'no approval transfers on a mismatch')
    assert.equal(s.sha, 'beef0001', 'the re-ran seat is accounted at the rebased tip it re-audited')
    assert.ok(!('approvedAt' in s), 'a re-ran seat has no earlier origin to preserve')
  }
})

// The merge-slot MISMATCH re-audit is a re-audit like any other, so its OWN fresh Minor/Nits must
// walk the same disposition ladder the six wave-side ace-family call sites use. Before #1931 the
// mismatch arm called auditRound and never routed: every fresh Minor/Nit it raised was dropped on
// the floor. The absorb arm needs the noReentry opt — aceReentry is wave-side only, so the merge
// slot's r.reentryQueue has no drain left and a queued absorb would strand just as silently.
// Seats echo the pin they were dispatched at, so no finding is stripped by the pin-mismatch guard.
const ptMismatchImpl = (reFindings) => (prompt, opts) => {
  if (seatOf(opts) !== 'war-auditor') return ptImpl([], aceOk())(prompt, opts)
  const lens = /security/.test(opts.label || '') ? 'security' : 'correctness'
  const sha = /beef0001/.test(prompt) ? 'beef0001' : 'deadbeef'
  return seatAt(opts.label, lens, sha, (sha === 'beef0001' && lens === 'correctness') ? reFindings : [])
}

test('#1913 PIN-1 (#1931) — the merge-slot MISMATCH re-audit routes its OWN fresh Minor/Nits by disposition: note, follow-up and ask each land, and the absorb takes the sweep (never the drainless re-entry queue)', async () => {
  const F = [
    { severity: 'Nit',   title: 'ms note',     file: ACE_FILE, disposition: 'note',      rationale: 'cosmetic' },
    { severity: 'Minor', title: 'ms followup', file: ACE_FILE, disposition: 'follow-up', rationale: 'later' },
    { severity: 'Minor', title: 'ms ask',      file: ACE_FILE, disposition: 'ask',       rationale: 'trade-off',
      ask: { question: 'which way at the merge slot?', fork: ['a', 'b'] } },
    { severity: 'Nit',   title: 'ms absorb',   file: ACE_FILE, disposition: 'absorb', autoFixable: true, rationale: 'tidy' },
  ]
  const { out, logs } = await runPhase(PT_ARGS(), ptMismatchImpl(F), {
    'pin-transfer': { status: 'mismatch', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p2' },
  })
  // Delete-and-trace: drop the routeReauditMinors call from the mismatch arm and all four fail.
  assert.ok((out.notes || []).some(n => n && n.title === 'ms note'),
    "the mismatch re-audit's note-disposition Nit reaches notes")
  assert.ok((out.minorsFiled || []).some(m => m && m.title === 'ms followup'),
    "its follow-up-disposition Minor is filed")
  assert.ok((out.asks || []).some(a => a && a.question === 'which way at the merge slot?'),
    "its ask-disposition Minor parks for the Checkpoint — an ask is never dropped")
  const sweepLog = (logs || []).filter(l => typeof l === 'string' && l.includes('ms absorb') && l.includes('phaseClose sweep'))
  assert.equal(sweepLog.length, 1, 'the absorb-disposition Nit routes to the phase-close sweep, exactly once')
  assert.match(sweepLog[0], /wave side is over/i,
    'the sweep routing names WHY re-entry is unavailable at the merge slot (logged, never silent)')
  assert.ok(out.landed.includes('t1'), 't1 still lands — routing the findings never holds the task')
})

test('#1913 PIN-1 (#1931) — the merge-slot MISMATCH re-audit routes its findings on the ESCALATE path too: a blocking finding holds the task, and the round\'s Minor/Nits are still accounted', async () => {
  // The route sits BEFORE the approve/escalate branch, so no exit path drops a finding.
  const F = [
    { severity: 'Critical', title: 'ms blocker',  file: ACE_FILE, rationale: 'broken' },
    { severity: 'Nit',      title: 'ms esc note', file: ACE_FILE, disposition: 'note', rationale: 'cosmetic' },
  ]
  const impl = (prompt, opts) => {
    if (seatOf(opts) !== 'war-auditor') return ptImpl([], aceOk())(prompt, opts)
    const lens = /security/.test(opts.label || '') ? 'security' : 'correctness'
    if (/beef0001/.test(prompt)) {
      return { seat: opts.label, lens, audit_sha: 'beef0001', verdict: 'request_changes',
        findings: lens === 'correctness' ? F : [], confidence: 'high' }
    }
    return seatAt(opts.label, lens, 'deadbeef', [])
  }
  const { out } = await runPhase(PT_ARGS(), impl, {
    'pin-transfer': { status: 'mismatch', rebased_tip: 'beef0001', pre_rebase_patch_id: 'p1', post_rebase_patch_id: 'p2' },
  })
  assert.ok((out.escalated || []).some(e => e && e.task === 't1'),
    'the failed in-lock re-audit escalates the task (blocking findings still own the hold)')
  assert.ok(!out.landed.includes('t1'), 't1 does not land')
  assert.ok((out.notes || []).some(n => n && n.title === 'ms esc note'),
    "the escalating round's own Nit is STILL routed — the escalate path drops nothing")
  assert.ok(!(out.notes || []).some(n => n && n.title === 'ms blocker'),
    'the blocking finding is untouched by the routing — it is the escalation input, not a Minor/Nit')
})

test('#1913 End state 9 — the pin-transfer rule is on BOTH prompt layers: the standing auditor card AND a pt-tagged dispatched prompt literal (never a comment only)', () => {
  assert.match(auditorMd, /pin[- ]transfer/i, 'the standing auditor card carries the transfer rule')
  assert.match(auditorMd, /scopeBreach/, 'and the card names the seat-detected refusal field the engine reads')
  // scanTemplateLiterals-based census: the token must sit inside a pt-TAGGED literal head — the
  // dispatched prompt text itself. A source-comment-only landing carries no tagged literal and reds.
  const tagged = scanTemplateLiterals(src).literals.filter(l => l.tagged && /pin[- ]transfer/i.test(l.head))
  assert.ok(tagged.length >= 2,
    'at least two pt-tagged dispatched-prompt literals name the pin transfer (the merge-slot probe and the delta-scaled re-audit charge)')
  // Runtime floor: the token really reaches a dispatched prompt, not just the source.
  assert.match(refinerMd, /pin-transfer probe/, 'the refiner card documents the probe it is dispatched to run')
})

test('#1913 PIN-13 — the merge-slot fixRounds seed never LOWERS the wave-side count, and the wave thunk owns the seed', () => {
  assert.match(src, /r\.task\.fixRounds = Math\.max\(/, 'the merge-slot seed is a never-lowering Math.max, not a re-seed')
  assert.match(src, /task\.fixRounds = round\n/, 'the wave thunk seeds the budget where the audit loop exits, before the hoisted ace')
})
