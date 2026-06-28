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
// auditors receive the absolute worktree path and self-serve the change set via read-only git (git diff <integrationBranch>...<task.branch>, three-dot); no main-checkout baseline.
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
  status: { enum: ['merged', 'landed', 'gate_failed', 'conflict', 'error', 'land_stale'] },
  branch: { type: 'string' }, integration_sha: { type: 'string' }, working_sha: { type: 'string' },
  conflict_files: { type: 'array' }, gate_output: { type: 'string' } } }

const SERVITOR_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } },
  memory_index_updated: { type: 'boolean' } } }

// Per-task provision-run result (Part B). The refiner runs the pinned run.provision list inside the
// task worktree: ok:true when every step exits 0; otherwise the env-blocked task-outcome shape from
// ../references/schemas.md ({ taskId, failedCommand, exitCode, stderrTail, provisionSource }) for the
// FIRST failing step. NOT a WorkerResult — no worker ran. The barrier skips the worker on ok:false.
const ENV_OUTCOME = { type: 'object', required: ['ok'], properties: {
  ok: { type: 'boolean' },
  taskId: { type: 'string' }, failedCommand: { type: 'string' }, exitCode: { type: 'number' },
  stderrTail: { type: 'string' }, provisionSource: { type: 'string' } } }

const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
const { phase: ph, plan, tasks, learningsTarget, agents = {}, audit = {}, run = {} } = A
const NS = A.agentPrefix ?? 'work-audit-refine:'
const roundLimit = run.roundLimit ?? 3
// Repo-derived provisioning (Part B). The Lead resolves run.provision from war-config.mjs
// (resolveProvision: explicit list verbatim, else scouted) and threads it here. This is a MIRROR of
// war-config.mjs's run.provision/run.provisionSource reads — that module is the tested source of
// truth; keep these field names in sync. The barrier runs these commands, in order, inside each task
// worktree before the worker; a failure short-circuits to an env-blocked task outcome (no worker).
const provisionList = Array.isArray(run.provision) ? run.provision : []
const provisionSource = run.provisionSource || 'none'

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
for (const t of (tasks || [])) {
  t.branch = taskBranch(t); t.worktree = taskWorktree(t)
  if (!t.branch || !t.worktree) {
    throw new Error(`task ${t.id}: cannot derive branch/worktree — supply planSlug+runId+worktreeRoot or explicit branch/worktree`)
  }
}
// Per-role spawn opts: model always; effort only when non-default (omit = inherit session).
// Mirror of war-config.mjs spawnOpts/covenSeats — the Workflow sandbox can't import. Keep in sync.
const ROLE_MODEL = { worker: 'sonnet', auditor: 'opus', refiner: 'sonnet', servitor: 'sonnet' }
const spawn = role => {
  const a = agents[role] || {}
  const model = a.model || ROLE_MODEL[role]
  return a.effort && a.effort !== 'default' ? { model, effort: a.effort } : { model }
}
const done = new Set()
const succeeded = new Set()
const landed = [], escalated = [], minorsFiled = [], auditLog = []
const mergedTasksForGateAudit = []   // collect {taskId, gateOutput, acceptanceCriteria, gateHeadSha} for post-merge gate-audit pass (F04 R3)

// --- Repo-derived provisioning (Part B) ------------------------------------
// provisionStep runs the pinned run.provision list, IN ORDER, inside one task worktree — a refiner
// seat in the Provision phase (the refiner owns provisioning; ADR 0001). It returns ok:true on full
// success or the env-blocked outcome ({ taskId, failedCommand, exitCode, stderrTail, provisionSource
// } — schemas.md) for the FIRST failing step. The caller skips the worker (and keeps the worktree)
// on ok:false. With an empty list provisioning is a no-op: ok:true with no agent dispatched.
async function provisionStep(task) {
  if (!provisionList.length) return { ok: true }
  const out = await agent(
    `PROVISION the worktree for WAR task ${task.id} before its worker runs. cd into ${task.worktree} `
    + `(the refiner's Provision barrier already created it) and run these provisioning commands IN ORDER, `
    + `inside that worktree:\n`
    + provisionList.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + `\n`
    + `These steps make the worktree gate-ready (derived from the repo's own setup; source: ${provisionSource}). `
    + `Run them verbatim; do NOT free-author other commands. If EVERY step exits 0, return { ok: true }. `
    + `If a step exits NON-ZERO, STOP at that first failure and return the env-blocked outcome — `
    + `{ ok: false, taskId: "${task.id}", failedCommand: "<the command>", exitCode: <code>, stderrTail: "<tail of its stderr>", provisionSource: "${provisionSource}" } — `
    + `do NOT continue and do NOT remove the worktree (it is kept for inspection). This is environment setup, not the artifact under test: a failure is an env-block, never a code defect.`,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision-run:${task.id}`, schema: ENV_OUTCOME, ...spawn('refiner') })
  // A missing/typeless result is treated as a hard env-block (worker stays unspawned, fail loud).
  if (!out || out.ok !== true) {
    return { ok: false, taskId: task.id,
      failedCommand: (out && out.failedCommand) || provisionList[0],
      exitCode: (out && typeof out.exitCode === 'number') ? out.exitCode : 1,
      stderrTail: (out && out.stderrTail) || 'provision-run returned no result',
      provisionSource }
  }
  return { ok: true }
}
// Prompt fragment threaded into the worker AND fix-worker: both run in the SAME worktree, so both
// must be told the pinned provision list (idempotent — re-running it is safe; D-Validation).
const provisionClause = provisionList.length
  ? `\nThis worktree was provisioned with (source: ${provisionSource}); re-run them if the env looks unset before you drive the gate:\n`
    + provisionList.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
  : ''

const blockingOf = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'Major')
const minorsOf   = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit')
const allApprove = (seats, expected) => seats.length === expected && seats.every(s => s.verdict === 'approve')
const isSplit    = seats => seats.some(s => s.verdict === 'approve') && seats.some(s => s.verdict === 'request_changes')
const nextWave   = () => tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => succeeded.has(d)))

function auditPrompt(task, lens, depth, peers, workerTests) {
  let p = `Audit WAR task ${task.id} through the "${lens}" lens at depth ${depth}.\n`
    + `Sub-issue #${task.issue}. Plan slice: ${task.planSlice}. Plan file: ${plan.file}.\n`
    + `Run \`git diff ${ph.integrationBranch}...${task.branch}\` (three-dot = merge-base..head = exactly what this task added) for the authoritative change set; re-run it each round (a fix-worker may have pushed). `
    + `Use allowlist-safe git forms: --name-status, --stat, --format=oneline, A...B, HEAD^. `
    + `Avoid %-format strings (e.g. --pretty=format:%H) and @{} reflog syntax — those are denied by the read-only guard.\n`
    + `Then read candidate files under ${task.worktree}/ for neighbor/deep context.\n`
    + `Verify the mapped acceptance-criteria tests EXIST and are not weakened or skipped (anti-cheat: catch "green by deletion" and test-integrity erosion). You cannot execute the gate — the refiner runs the gate. Your job is to confirm tests exist in the diff and are uncompromised.`
  if (workerTests) {
    p += `\n\nWorker-reported tests summary (cross-check claim vs diff): ${JSON.stringify(workerTests)}`
  }
  if (peers && peers.length) {
    p += `\n\nREBUTTAL ROUND — your panel split. Re-judge in light of your peers below, then re-emit your final verdict:\n`
      + peers.map(s => `- ${s.seat} (${s.lens}) → ${s.verdict}: ${(s.findings || []).map(f => `[${f.severity}] ${f.title}`).join('; ') || 'no findings'}`).join('\n')
  }
  return p
}

async function auditRound(task, peers, workerTests) {
  const baseLenses = task.lenses && task.lenses.length ? task.lenses : ['correctness', 'cascading-impact', 'plan-faithfulness']
  const lenses = !task.coven
    ? [baseLenses[0]]
    : Array.from({ length: audit.covenSize || baseLenses.length }, (_, i) => baseLenses[i % baseLenses.length])
  const depth = task.coven ? 'deep' : 'neighbors'
  const expected = lenses.length
  const runLens = lens => agent(auditPrompt(task, lens, depth, peers, workerTests), {
    agentType: NS + 'war-auditor', phase: 'Audit',
    label: `audit:${task.id}:${lens}${peers ? ':rebut' : ''}`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  // Initial parallel run
  let results = await parallel(lenses.map(lens => () => runLens(lens)))
  // Re-run only the dropped (null) lenses, up to 2 retry passes
  for (let retry = 0; retry < 2; retry++) {
    const dropped = lenses.filter((_, i) => results[i] == null)
    if (!dropped.length) break
    const retried = await parallel(dropped.map(lens => () => runLens(lens)))
    let ri = 0
    results = results.map(r => r != null ? r : retried[ri++])
  }
  const seats = results.filter(Boolean)
  return { seats, expected }
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
// PART B (now wired): the git-topology barrier above creates every task worktree up front. The
// repo-derived per-task `run.provision` list then runs INSIDE the work wave below, after the
// worktree exists and BEFORE that task's worker is spawned (provisionStep). A failing step short-
// circuits to an `env-blocked` task outcome — the worker is NOT spawned and the worktree is KEPT for
// inspection (schemas.md / SKILL.md). This is an ADDITION layered on the Part-A barrier, not a
// rewrite. (The setup-scout that DERIVES the list is war-room Setup's job, not the barrier's.)
if (tasks.length) {
  const SCRIPT = '${CLAUDE_PLUGIN_ROOT}/skills/war/assets/provision-worktrees.sh'
  const owned = ownedFile ? ` --owned-file ${ownedFile}` : ''
  const ensures = tasks.map(t =>
    `   provision-worktrees.sh ensure-worktree ${t.worktree} ${t.branch} "$TIP"`).join('\n')
  await agent(
    `Provision the worktree topology for WAR phase ${ph.id} "${ph.title}" by running ${SCRIPT}. `
    + `Do NOT free-author git; only run these subcommands, fail loud on any non-zero exit (a foreign integration branch exits 3), and report a MergeResult.\n`
    + `1. FROM THE MAIN CHECKOUT (${mainCheckout || 'the main repo checkout — your current working directory'}, NOT a task worktree): `
    + `provision-worktrees.sh ensure-exclude — this excludes \`.claude/\` in the parent checkout so the nested task worktrees do not surface as untracked there (probe E2).\n`
    + `2. provision-worktrees.sh ensure-integration ${planSlug || '<plan-slug>'} ${ph.id} ${ph.workingBranch}${owned} — reuse the plan-namespaced integration branch ${ph.integrationBranch} if it is already ours (the --owned-file ledger), else cut it at ${ph.workingBranch}.\n`
    + `3. Capture the resulting integration tip (TIP="$(git rev-parse ${ph.integrationBranch})"), then for EACH task run ensure-worktree at the integration tip captured in step 3 (idempotent; reuse if present, conservative heal if the dir went missing):\n${ensures}\n`
    + `Each ensure-worktree creates the worktree on its plan-namespaced branch off the integration tip and drops a .war-task marker. After this barrier every task worktree exists and the workers can run.\n`
    + `4. provision-worktrees.sh ensure-refinery-worktree ${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery ${ph.integrationBranch} — create (or re-attach) the Refinery's dedicated worktree on the integration branch. The Refinery performs every merge in this run-scoped worktree, never the Lead's main checkout.`,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
}

let guard = 0
while (done.size < tasks.length && guard++ < tasks.length + 2) {
  // ---- DEP-BLOCK PRE-CHECK — placement is load-bearing (plan §Phase 3, Step 3) ----
  // Runs BEFORE nextWave() and BEFORE the break guard. Reads done/succeeded (not wave).
  // Adds dep-blocked tasks to done so nextWave() correctly excludes them; the break guard
  // only fires when nothing genuinely remains. done.size grows → loop terminates.
  for (const t of tasks) {
    const deps = t.deps || []
    if (!done.has(t.id) && deps.length && deps.every(d => done.has(d)) && !deps.every(d => succeeded.has(d))) {
      const failedDeps = deps.filter(d => !succeeded.has(d))
      escalated.push({ task: t.id, reason: 'dep-failed', failedDeps })
      auditLog.push({ task: t.id, verdict: 'dep-failed', failedDeps, findings: [] })
      done.add(t.id)
    }
  }
  const wave = nextWave()
  if (!wave.length) { log(`No runnable tasks remain — the rest are blocked behind escalations.`); break }

  // ---- WORK + AUDIT each task in the wave concurrently ----
  const results = await parallel(wave.map(task => async () => {
    // PROVISION (Part B): run the pinned run.provision list inside this task's worktree FIRST. A
    // failing step → env-blocked: the worker is NOT spawned and the worktree is KEPT (schemas.md).
    const env = await provisionStep(task)
    if (!env.ok) {
      return { task, verdict: 'env-blocked', seats: [], expected: 0, envOutcome: {
        taskId: env.taskId, failedCommand: env.failedCommand, exitCode: env.exitCode,
        stderrTail: env.stderrTail, provisionSource: env.provisionSource } }
    }

    const impl = await agent(
      `Implement WAR task ${task.id} in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}, cut from ${ph.integrationBranch}).\n`
      + `The refiner's Provision barrier already created this worktree and its .war-task marker — do NOT create it yourself and do NOT set any worktree env var. cd into ${task.worktree} and work only inside it; commit and push ${task.branch}.\n`
      + `Sub-issue #${task.issue} — ${task.title}\nPlan slice: ${task.planSlice}\nPlan file: ${plan.file}\nGate: ${plan.gate}${provisionClause}`,
      { agentType: NS + 'war-worker', phase: 'Work', label: `work:${task.id}`, schema: WORKER_RESULT, ...spawn('worker') })

    if (!impl || impl.status === 'blocked') {
      return { task, verdict: 'escalate', seats: [], expected: 0, blocked: (impl && impl.blocked_reason) || 'worker returned no result' }
    }

    let round = 0, verdict = null, seats = [], expected = 0
    const workerTests = impl && impl.tests ? impl.tests : null
    while (round < roundLimit) {
      ;({ seats, expected } = await auditRound(task, null, workerTests))      // independent — no cross-talk
      if (seats.length < expected) { verdict = 'audit-blocked'; break }   // persistent shortfall after retries
      if (seats.some(s => s.verdict === 'escalate')) { verdict = 'escalate'; break }
      if (allApprove(seats, expected)) { verdict = 'approve'; break }

      if (isSplit(seats) && seats.length > 1) {                  // one rebuttal round on a split
        ;({ seats, expected } = await auditRound(task, seats, workerTests))
        if (seats.length < expected) { verdict = 'audit-blocked'; break } // persistent shortfall after retries
        if (seats.some(s => s.verdict === 'escalate')) { verdict = 'escalate'; break }
        if (allApprove(seats, expected)) { verdict = 'approve'; break }
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
        + b.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n') + provisionClause,
        { agentType: NS + 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
      round++
    }
    if (verdict === null) verdict = 'audit-blocked'
    return { task, verdict, seats, expected }
  }))

  // ---- REFINE — serial merge of approved tasks (THE merge queue) ----
  for (const r of results.filter(Boolean)) {
    minorsFiled.push(...minorsOf(r.seats || []).map(f => ({ task: r.task.id, ...f })))
    auditLog.push({ task: r.task.id, verdict: r.verdict, findings: (r.seats || []).flatMap(s => s.findings || []), blocked: r.blocked, requested: r.expected, returned: (r.seats || []).length })
    done.add(r.task.id)
    if (r.verdict === 'approve') {
      const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
      const mr = await agent(
        `Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
        + `IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
        + `  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
        + `CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
        + `rebase --onto does NOT dodge this constraint — it is equally refused.\n`
        + `  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
        + `Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
        + `On success, populate gate_output in the returned MergeResult with the executed gate output (stdout+stderr) so the post-merge gate-audit pass can review it as execution evidence. `
        + `Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip.`,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
      if (mr && mr.status === 'merged') {
        landed.push(r.task.id); succeeded.add(r.task.id)
        mergedTasksForGateAudit.push({ taskId: r.task.id, gateOutput: mr.gate_output, acceptanceCriteria: r.task.planSlice,
          gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)' }) // ponytail: sentinel, not mr.working_sha — working_sha is land-only (war-refiner.md), dead on a merge result
      }
      else escalated.push({ task: r.task.id, reason: mr ? mr.status : 'merge_failed', detail: mr })
    } else if (r.verdict === 'env-blocked') {
      // Provision failure (Part B): the worker never ran and the worktree is kept. Surface the
      // env-blocked outcome for the Lead (0 FIX rounds; siblings proceed — SKILL.md). It is a SOFT
      // escalation: NOT in HARD_ESCALATION_REASONS, so the phase still lands whatever else passed.
      log(`Task ${r.task.id}: env-blocked — provision step "${r.envOutcome.failedCommand}" exited ${r.envOutcome.exitCode}. Worktree kept; worker not spawned.`)
      escalated.push({ task: r.task.id, reason: 'env-blocked', outcome: r.envOutcome })
    } else {
      escalated.push({ task: r.task.id, reason: r.verdict, blocked: r.blocked })
    }
  }
}

// ---- POST-MERGE GATE-AUDIT PASS (F04 R3) — parallel, AFTER serial merge queue, BEFORE Land decision ----
// A read-only war-auditor (lens: execution-evidence) reviews the executed gate output from each merged
// task to close the "auditor can't verify PASS" gap with real execution evidence (not just integrity-by-reading).
// Default outcome: SOFT note (does not hold the land). Hard only if a mapped test is provably unrun
// (present in diff but absent / 0-count in gate_output) — Open decision #1 (resolved: operationally defined).
if (mergedTasksForGateAudit.length > 0) {
  const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
  // ponytail: reuse the _refinery worktree — already checked out on ph.integrationBranch at the integration tip
  //           after the serial merge queue and before Land/teardown; loop-scoped :308 refineryPath is out of scope here
  await parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria, gateHeadSha }) => async () => {
    const gateAuditVerdict = await agent(
      `POST-MERGE GATE-AUDIT for WAR task ${taskId} (lens: execution-evidence). `
      + `You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
      + `${refineryPath} (the _refinery worktree) and the gate ran at gate-HEAD sha ${gateHeadSha}.\n`
      + `Gate-HEAD sha (the rebased integration tip the gate ran at): ${gateHeadSha}.\n`
      + `If you cannot confirm the executed gate output corresponds to the current integration tip `
      + `(gate-HEAD sha above vs the phase integration tip), record a SOFT note, never a HARD finding — `
      + `a stale gate output (gate-HEAD sha != integration tip) cannot be a provably-unrun land-halt. `
      + `This SOFT-downgrade applies ONLY to the cannot-confirm case; a mapped test provably unrun AT the `
      + `confirmed gate-HEAD sha stays HARD.\n`
      + `First confirm your evidence is pinned to the integration tip by running EXACTLY this bracket test:\n`
      + `    [ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]\n`
      + `Exit 0 ⇒ pin CONFIRMED (your worktree is at the integration tip). Non-zero exit — including git `
      + `unavailable or rev-parse failing — ⇒ you CANNOT confirm the pin.\n`
      + `If CONFIRMED, then confirm the mapped acceptance-criteria test is present in the files at that tip `
      + `(read-only git / Read in ${refineryPath}), not merely inferred from the gate output text; record a `
      + `HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE CONFIRMED INTEGRATION TIP.\n`
      + `If you CANNOT confirm (the bracket test is non-zero or the command cannot run), record a SOFT note, `
      + `never a HARD finding (the stale-tip defusing rule). The SOFT note MUST state: the observed HEAD sha `
      + `(or "rev-parse failed"), the expected gate-HEAD sha ${gateHeadSha}, and the reason — "gate-audit `
      + `worktree not at the integration tip — execution evidence unreliable, downgraded to SOFT, not a land-halt".\n`
      + `Return your reviewed audit_sha so the Lead can compare it to the gate-HEAD sha.\n`
      + `Review the executed gate output below and the task's mapped acceptance criteria to confirm the mapped tests actually ran and passed.\n`
      + `Acceptance criteria / plan slice: ${acceptanceCriteria || '(see plan file)'}\n`
      + `Executed gate output:\n${gateOutput || '(no gate output recorded)'}\n\n`
      + `Default: SOFT. Hard only when provably unrun.`,
      { agentType: NS + 'war-auditor', phase: 'Audit',
        label: `gate-audit:${taskId}:execution-evidence`, schema: AUDIT_VERDICT, ...spawn('auditor') })
    // gate-evidence findings are SOFT (do not hold the land) UNLESS a mapped test is provably unrun (hard).
    // Hard case: the auditor records a Critical or Major finding on the execution-evidence lens, indicating
    // a mapped acceptance-criteria test present in the pre-merge diff is absent/0-count in the gate output.
    // Per Open decision #1 (resolved: operationally defined) — severity Critical/Major signals provably-unrun.
    if (gateAuditVerdict) {
      const findings = gateAuditVerdict.findings || []
      const isHardGateEvidence = findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
      // Distinguish hard vs soft in the auditLog so the Lead can adjudicate even if already held.
      auditLog.push({ task: taskId, verdict: `gate-audit:${gateAuditVerdict.verdict}`, findings, gateEvidence: true, hard: isHardGateEvidence, gateHeadSha, auditSha: gateAuditVerdict.audit_sha })
      if (isHardGateEvidence) {
        // HARD: a provably-unrun mapped test → push gate-evidence to escalated so the land is held.
        escalated.push({ task: taskId, reason: 'gate-evidence', detail: gateAuditVerdict })
      }
    }
  }))
}

// ---- POST-LOOP SWEEP: any task still not in done[] has unresolvable deps (ghost dep) ----
// scheduler-local addition — 'unrunnable-deps' is NOT in land-decision.mjs (intentional divergence).
for (const t of tasks) {
  if (!done.has(t.id)) {
    const deps = t.deps || []
    const missing = deps.filter(d => !tasks.some(x => x.id === d))
    escalated.push({ task: t.id, reason: 'unrunnable-deps', missingDeps: missing, deps })
    auditLog.push({ task: t.id, verdict: 'unrunnable-deps', missingDeps: missing, findings: [], requested: 0, returned: 0 })
    done.add(t.id)
  }
}

// ---- LAND — only when no hard escalation is open; else hold for the Lead ----
// landDecision mirrors land-decision.mjs (decideLand) — the Workflow sandbox can't import. Keep in sync.
// HARD_ESCALATION_REASONS mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
let landResult = null
const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps']
const hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
let landDecision = (landed.length && !hardEscalation) ? 'landed'
  : hardEscalation ? 'held:escalation'
  : 'held:nothing-merged'
const refineryLandPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
if (landDecision === 'landed') {
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Perform the land entirely inside the _refinery worktree at ${refineryLandPath} (spec §5.3, push-first CAS):\n`
    + `  1. In ${refineryLandPath}: detach HEAD at origin/${ph.workingBranch} (`
    + `\`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`). `
    + `This is the detached land — never checkout the working branch by name in _refinery.\n`
    + `  2. Merge: \`git -C ${refineryLandPath} merge --no-ff ${ph.integrationBranch}\` (one phase commit). Run the gate (${plan.gate}) with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed.\n`
    + `  3. Push-first CAS: run \`provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\` where <merge-sha> is HEAD in _refinery after the merge.\n`
    + `     - On clean push success (exit 0 from land-advance): the land succeeded. Return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }.\n`
    + `     - On reland exit code (rejected push — origin/${ph.workingBranch} moved): re-fetch origin/${ph.workingBranch}, re-merge, re-run gate, retry land-advance. `
    + `Repeat up to roundLimit (${roundLimit}) times total. If the reland loop exhausts roundLimit attempts, return { mode: 'land-phase', status: 'land_stale' } — `
    + `this is a topology exhaustion (CAS failure), NOT a content conflict.\n`
    + `     - On escalate exit code from land-advance (any non-rejection push error): return { mode: 'land-phase', status: 'error' }.\n`
    + `Never use --force push. Never merge or push from the Lead's main checkout.`,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
  // If the land agent returns land_stale (CAS-exhaustion), treat it as a hard escalation.
  if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
    landDecision = 'held:escalation'
  } else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed')) {
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
    landDecision = 'held:land-failed'
  } else if (landResult && landResult.status === 'landed') {
    // ---- OPPORTUNISTIC RESYNC (§5.4): ff-only, on-branch, clean-guard ----
    // After a landed result, the Lead attempts to advance its own cwd to the new working tip.
    // Rules: advance ONLY if the local working branch is a ff-descendant of the new tip AND
    // HEAD is on-branch (not detached) AND the working tree is clean. Else SKIP — never force,
    // never block (truth is origin/<workingBranch>; the human reconciles). This is a resync,
    // not a gated operation. The Lead runs this after land-advance succeeds.
    log(`Phase ${ph.id} landed. Attempting opportunistic resync of cwd to origin/${ph.workingBranch} (ff-only, on-branch, clean-guard — skip if any condition fails; never force).`)
  }
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
    + `Your only writable path (your capability allowlist holds no Bash — Write/Edit only — and the PreToolUse scope hook gates those by agent_type to the learnings target): ${learningsTarget}.\n`
    + `Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + `Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + `Escalations: ${JSON.stringify(escalated)}\n`
    + `Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.\n`
    + `\n`
    + `Memory admission checklist — follow ALL four disciplines before every write:\n`
    + `D1 DEDUP BEFORE WRITE: Glob the memory dir and read MEMORY.md. Read related candidate files. If an existing covering file exists, update that file in place — do not duplicate. Create a new file only when no existing file covers the fact.\n`
    + `D2 CORRECTION PRIORITY: A fact that contradicts an existing memory supersedes it — update or replace the stale file and note the supersession. User corrections outrank agent assertions.\n`
    + `D3 VERIFY-CUE: Any fact naming a file, function, flag, or line must include the cue "verify still present before acting" — do not write snapshot facts that will rot.\n`
    + `D4 INDEX HYGIENE: Update the MEMORY.md row in place (find and replace the existing row — do not append a duplicate row). Cross-link related facts with [[slug]] references.`,
    { agentType: NS + 'war-servitor', phase: 'Wrap-up', label: `wrap-up:phase-${ph.id}`, schema: SERVITOR_RESULT, ...spawn('servitor') })
}

return { phase: ph.id, landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }
