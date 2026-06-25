export const meta = {
  name: 'war-phase',
  description: 'WAR per-phase execution: Work, Audit, Refine, Land, then Wrap-up learnings for one phase.',
  phases: [
    { title: 'Provision' },
    { title: 'Work' },
    { title: 'Audit' },
    { title: 'Refine' },
    { title: 'Land' },
    { title: 'Wrap-up' },
  ],
}

// ---------------------------------------------------------------------------
// args (passed by the Lead — see ../references/schemas.md):
//   args may arrive as an object OR a JSON string (auto-parsed at the top of this file).
//   { phase: { id, title, integrationBranch, workingBranch },
//     plan:  { file, gate },          // gate = a shell command, run BY agents (this script has no shell/fs)
//     tasks: [ { id, issue, title, branch, worktree, deps:[id],
//                lenses:["correctness","cascading-impact","plan-faithfulness"], coven:bool, planSlice } ],
//     learningsTarget,                // the servitor's only writable path (memory dir or docs/learnings/)
//     agentPrefix,                    // optional namespace prefix for agent types (default: 'work-audit-refine:')
//     agents: { worker|auditor|refiner|servitor: { model, effort } },  // from .claude/war/config.json (resolved by the Lead); defaults below
//     audit:  { covenSize, covenPolicy, autoEscalate },                // covenPolicy seeds task.coven Lead-side; covenSize/autoEscalate used here
//     run:    { roundLimit, afk } }                                    // afk is Lead-side; roundLimit used here
// auditors receive the absolute worktree path and compare candidate files there against baseline at the main repo checkout.
// The Lead may inject APPROVED extra stages by editing a copy of this file; never free-author the core loop.
// ---------------------------------------------------------------------------

const WORKER_RESULT = { type: 'object', required: ['task_id', 'status'], properties: {
  task_id: { type: 'string' }, branch: { type: 'string' }, worktree: { type: 'string' }, head_sha: { type: 'string' },
  status: { enum: ['implemented', 'blocked'] },
  tests: { type: 'object' }, acceptance_criteria_covered: { type: 'array' }, files_changed: { type: 'array' },
  notes: { type: 'string' }, blocked_reason: { type: 'string' } } }

const AUDIT_VERDICT = { type: 'object', required: ['seat', 'lens', 'verdict', 'findings', 'confidence'], properties: {
  seat: { type: 'string' }, lens: { type: 'string' }, audit_sha: { type: 'string' },
  verdict: { enum: ['approve', 'request_changes', 'escalate'] },
  findings: { type: 'array', items: { type: 'object', properties: {
    severity: { enum: ['Critical', 'Major', 'Minor', 'Nit'] }, title: { type: 'string' }, file: { type: 'string' },
    line: { type: 'number' }, rationale: { type: 'string' }, suggested_fix: { type: 'string' }, plan_ref: { type: 'string' } } } },
  tests_verified: { type: 'object' }, confidence: { enum: ['high', 'medium', 'low'] }, escalate_reason: { type: 'string' } } }

const MERGE_RESULT = { type: 'object', required: ['mode', 'status'], properties: {
  mode: { enum: ['merge-task', 'land-phase'] },
  status: { enum: ['merged', 'landed', 'gate_failed', 'conflict', 'error'] },
  branch: { type: 'string' }, integration_sha: { type: 'string' }, working_sha: { type: 'string' },
  conflict_files: { type: 'array' }, gate_output: { type: 'string' } } }

const SERVITOR_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } },
  memory_index_updated: { type: 'boolean' } } }

const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const { phase: ph, plan, tasks, learningsTarget, agents = {}, audit = {}, run = {} } = A
const NS = A.agentPrefix ?? 'work-audit-refine:'
const roundLimit = run.roundLimit ?? 3

// --- Worktree topology (refiner-owned; ADR 0001/0003) ----------------------
// Branches are plan-namespaced and worktree PATHS carry the run-id (see the plan's "run-id vs
// plan-slug" note + provision-worktrees.sh teardown regex `war/<slug>/p<N>-*`). We DERIVE each
// task's branch/worktree from `planSlug` + `runId` here so the refiner's Provision barrier and the
// worker/auditor prompts agree on one set of paths. A task that already carries an explicit
// branch/worktree (older Lead, or a hand-patched DAG) keeps it — the derivation only fills gaps.
const planSlug = A.planSlug
const runId = A.runId
const worktreeRoot = A.worktreeRoot              // absolute dir that holds per-run worktrees
const mainCheckout = A.mainCheckout              // absolute path of the parent checkout (cwd for ensure-exclude)
const ownedFile = A.ownedFile                    // run ledger of owned refs (--owned-file); foreign→exit 3 guard
// (A.runDir = .claude/teams/<run-id> is the run-scope for provision-worktrees teardown; that wiring
//  lands with the teardown call, not this Provision barrier — left on `A` for the future seam.)
const taskBranch = t => t.branch || (planSlug ? `war/${planSlug}/p${ph.id}-${t.id}` : t.branch)
const taskWorktree = t => t.worktree || ((worktreeRoot && runId) ? `${worktreeRoot}/${runId}/${t.id}` : t.worktree)
for (const t of (tasks || [])) { t.branch = taskBranch(t); t.worktree = taskWorktree(t) }
// Per-role spawn opts: model always; effort only when non-default (omit = inherit session).
// Mirror of war-config.mjs spawnOpts/covenSeats — the Workflow sandbox can't import. Keep in sync.
const ROLE_MODEL = { worker: 'sonnet', auditor: 'opus', refiner: 'sonnet', servitor: 'sonnet' }
const spawn = role => {
  const a = agents[role] || {}
  const model = a.model || ROLE_MODEL[role]
  return a.effort && a.effort !== 'default' ? { model, effort: a.effort } : { model }
}
const done = new Set()
const landed = [], escalated = [], minorsFiled = [], auditLog = []

const blockingOf = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'Major')
const minorsOf   = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit')
const allApprove = seats => seats.length > 0 && seats.every(s => s.verdict === 'approve')
const isSplit    = seats => seats.some(s => s.verdict === 'approve') && seats.some(s => s.verdict === 'request_changes')
const nextWave   = () => tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => done.has(d)))

function auditPrompt(task, lens, depth, peers) {
  let p = `Audit WAR task ${task.id} through the "${lens}" lens at depth ${depth}.\n`
    + `Review the diff of ${task.branch} vs ${ph.integrationBranch} (the single target). Sub-issue #${task.issue}.\n`
    + `Plan slice: ${task.planSlice}. Plan file: ${plan.file}.\n`
    + `CANDIDATE files are in the task worktree at: ${task.worktree}/\n`
    + `BASELINE files are in the main repo checkout (your current working directory / the integration base).\n`
    + `Read candidate files under ${task.worktree}/ and compare them against the corresponding baseline copies at the main repo checkout to determine what changed.\n`
    + `Verify the mapped acceptance-criteria tests EXIST and PASS (catch "green by deletion").`
  if (peers && peers.length) {
    p += `\n\nREBUTTAL ROUND — your panel split. Re-judge in light of your peers below, then re-emit your final verdict:\n`
      + peers.map(s => `- ${s.seat} (${s.lens}) → ${s.verdict}: ${(s.findings || []).map(f => `[${f.severity}] ${f.title}`).join('; ') || 'no findings'}`).join('\n')
  }
  return p
}

async function auditRound(task, peers) {
  const baseLenses = task.lenses && task.lenses.length ? task.lenses : ['correctness', 'cascading-impact', 'plan-faithfulness']
  const lenses = !task.coven
    ? [baseLenses[0]]
    : Array.from({ length: audit.covenSize || baseLenses.length }, (_, i) => baseLenses[i % baseLenses.length])
  const depth = task.coven ? 'deep' : 'neighbors'
  return (await parallel(lenses.map(lens => () =>
    agent(auditPrompt(task, lens, depth, peers), {
      agentType: NS + 'war-auditor', phase: 'Audit',
      label: `audit:${task.id}:${lens}${peers ? ':rebut' : ''}`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  ))).filter(Boolean)
}

log(`Phase ${ph.id} "${ph.title}": ${tasks.length} task(s) → ${ph.integrationBranch}`)

// ---- PROVISION — refiner-owned worktree barrier (D3, ADR 0001) ----
// The refiner provisions the whole phase's git topology via provision-worktrees.sh BEFORE any
// worker fans out, so workers never touch shared git state (E1 proved a worker can't even scope
// itself). Runs the script's idempotent "ensure" subcommands; a resume is a no-op. Carry-forward
// from Phase 2's coven:
//   (A) ensure-exclude MUST run FROM THE MAIN CHECKOUT — it resolves its target repo from cwd, and
//       the intent is to exclude `.claude/` in the PARENT checkout so nested worktrees don't show
//       as untracked there (probe E2). It is NOT run inside a task worktree.
//   (B) ensure-integration is passed --owned-file <run-ledger> so a resume recognizes this run's own
//       integration branch as owned (a foreign, unrecorded branch → exit 3 / fail loud).
// SEAM WITH PART B (do NOT build here): this barrier is exactly where the repo-derived per-task
// `run.provision` list will later run (after each worktree exists, before the worker drives the
// gate). Keep the per-task loop below as the insertion point — Part B threads a provision step per
// task here; it is an ADDITION, not a rewrite. We do NOT wire run.provision / the env-blocked
// verdict / the setup-scout in this plan.
if (tasks.length) {
  const SCRIPT = '${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh'
  const owned = ownedFile ? ` --owned-file ${ownedFile}` : ''
  const ensures = tasks.map(t =>
    `   provision-worktrees.sh ensure-worktree ${t.worktree} ${t.branch} <integration-tip>`).join('\n')
  await agent(
    `Provision the worktree topology for WAR phase ${ph.id} "${ph.title}" by running ${SCRIPT}. `
    + `Do NOT free-author git; only run these subcommands, fail loud on any non-zero exit (a foreign integration branch exits 3), and report a MergeResult.\n`
    + `1. FROM THE MAIN CHECKOUT (${mainCheckout || 'the main repo checkout — your current working directory'}, NOT a task worktree): `
    + `provision-worktrees.sh ensure-exclude — this excludes \`.claude/\` in the parent checkout so the nested task worktrees do not surface as untracked there (probe E2).\n`
    + `2. provision-worktrees.sh ensure-integration ${planSlug || '<plan-slug>'} ${ph.id} ${ph.workingBranch}${owned} — reuse the plan-namespaced integration branch ${ph.integrationBranch} if it is already ours (the --owned-file ledger), else cut it at ${ph.workingBranch}.\n`
    + `3. Capture the resulting integration tip (\`git rev-parse ${ph.integrationBranch}\`), then for EACH task run ensure-worktree at the integration tip (idempotent; reuse if present, conservative heal if the dir went missing):\n${ensures}\n`
    + `Each ensure-worktree creates the worktree on its plan-namespaced branch off the integration tip and drops a .war-task marker. After this barrier every task worktree exists and the workers can run.`,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
}

let guard = 0
while (done.size < tasks.length && guard++ < tasks.length + 2) {
  const wave = nextWave()
  if (!wave.length) { log(`No runnable tasks remain — the rest are blocked behind escalations.`); break }

  // ---- WORK + AUDIT each task in the wave concurrently ----
  const results = await parallel(wave.map(task => async () => {
    const impl = await agent(
      `Implement WAR task ${task.id} in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}, cut from ${ph.integrationBranch}).\n`
      + `The refiner's Provision barrier already created this worktree and its .war-task marker — do NOT create it yourself and do NOT set any worktree env var. cd into ${task.worktree} and work only inside it; commit and push ${task.branch}.\n`
      + `Sub-issue #${task.issue} — ${task.title}\nPlan slice: ${task.planSlice}\nPlan file: ${plan.file}\nGate: ${plan.gate}`,
      { agentType: NS + 'war-worker', phase: 'Work', label: `work:${task.id}`, schema: WORKER_RESULT, ...spawn('worker') })

    if (!impl || impl.status === 'blocked') {
      return { task, verdict: 'escalate', seats: [], blocked: (impl && impl.blocked_reason) || 'worker returned no result' }
    }

    let round = 0, verdict = null, seats = []
    while (round < roundLimit) {
      seats = await auditRound(task, null)                       // independent — no cross-talk
      if (seats.some(s => s.verdict === 'escalate')) { verdict = 'escalate'; break }
      if (allApprove(seats)) { verdict = 'approve'; break }

      if (isSplit(seats) && seats.length > 1) {                  // one rebuttal round on a split
        seats = await auditRound(task, seats)
        if (seats.some(s => s.verdict === 'escalate')) { verdict = 'escalate'; break }
        if (allApprove(seats)) { verdict = 'approve'; break }
        if (isSplit(seats)) { verdict = 'escalate'; break }      // still deadlocked → human tiebreak
      }

      if (audit.autoEscalate !== false && !task.coven && seats.length === 1 &&   // auto-escalate 1→coven (config can disable)
          (seats[0].confidence === 'low' || (seats[0].findings || []).some(f => f.severity === 'Critical'))) {
        task.coven = true
        log(`Task ${task.id}: escalating to a coven (Critical or low confidence on the lone seat).`)
      }

      const b = blockingOf(seats)                                // batched FIX_NEEDED → fresh fix-worker
      await agent(
        `FIX_NEEDED for WAR task ${task.id}. Work in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
        + `Resolve ALL of these blocking findings, keep the gate green, commit and push:\n`
        + b.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n'),
        { agentType: NS + 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
      round++
    }
    if (verdict === null) verdict = 'audit-blocked'
    return { task, verdict, seats }
  }))

  // ---- REFINE — serial merge of approved tasks (THE merge queue) ----
  for (const r of results.filter(Boolean)) {
    minorsFiled.push(...minorsOf(r.seats || []).map(f => ({ task: r.task.id, ...f })))
    auditLog.push({ task: r.task.id, verdict: r.verdict, findings: (r.seats || []).flatMap(s => s.findings || []), blocked: r.blocked })
    done.add(r.task.id)
    if (r.verdict === 'approve') {
      const mr = await agent(
        `Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
        + `Rebase onto the integration tip first; run the gate (${plan.gate}); on gate failure return gate_failed; on conflict return conflict; never force.`,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
      if (mr && mr.status === 'merged') landed.push(r.task.id)
      else escalated.push({ task: r.task.id, reason: mr ? mr.status : 'merge_failed', detail: mr })
    } else {
      escalated.push({ task: r.task.id, reason: r.verdict, blocked: r.blocked })
    }
  }
}

// ---- LAND — only when no hard escalation is open; else hold for the Lead ----
// landDecision mirrors land-decision.mjs (decideLand) — the Workflow sandbox can't import. Keep in sync.
let landResult = null
const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict']
const hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
const landDecision = (landed.length && !hardEscalation) ? 'landed'
  : hardEscalation ? 'held:escalation'
  : 'held:nothing-merged'
if (landDecision === 'landed') {
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Run the gate (${plan.gate}); push ${ph.workingBranch}.`,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
} else if (landDecision === 'held:escalation') {
  log(`Holding the land for phase ${ph.id}: ${escalated.length} escalation(s) need the Lead's decision.`)
} else {
  log(`Holding the land for phase ${ph.id}: no task merged cleanly (see escalations) — the Lead must resolve and land.`)
}

// ---- WRAP-UP — capture durable learnings (war-servitor, write-scoped to learningsTarget) ----
let servitorResult = null
if (landResult && landResult.status === 'landed' && learningsTarget) {
  servitorResult = await agent(
    `Wrap up learnings for WAR phase ${ph.id} "${ph.title}" (landed on ${ph.workingBranch}).\n`
    + `Your only writable path (also set as WAR_WORKTREE): ${learningsTarget}.\n`
    + `Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + `Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + `Escalations: ${JSON.stringify(escalated)}\n`
    + `Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.`,
    { agentType: NS + 'war-servitor', phase: 'Wrap-up', label: `wrap-up:phase-${ph.id}`, schema: SERVITOR_RESULT, ...spawn('servitor') })
}

return { phase: ph.id, landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }
