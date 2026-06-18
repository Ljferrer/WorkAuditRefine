export const meta = {
  name: 'war-phase',
  description: 'WAR per-phase execution: Work, Audit, Refine, Land, then Wrap-up learnings for one phase.',
  phases: [
    { title: 'Work' },
    { title: 'Audit' },
    { title: 'Refine' },
    { title: 'Land' },
    { title: 'Wrap-up' },
  ],
}

// ---------------------------------------------------------------------------
// args (passed by the Lead — see ../references/schemas.md):
//   { phase: { id, title, integrationBranch, workingBranch },
//     plan:  { file, gate },          // gate = a shell command, run BY agents (this script has no shell/fs)
//     tasks: [ { id, issue, title, branch, worktree, deps:[id],
//                lenses:["correctness","cascading-impact","plan-faithfulness"], coven:bool, planSlice } ],
//     learningsTarget,                // the scribe's only writable path (memory dir or docs/learnings/)
//     roundLimit: 3 }
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

const SCRIBE_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } },
  memory_index_updated: { type: 'boolean' } } }

const { phase: ph, plan, tasks, learningsTarget, roundLimit = 3 } = args
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
    + `Verify the mapped acceptance-criteria tests EXIST and PASS (catch "green by deletion").`
  if (peers && peers.length) {
    p += `\n\nREBUTTAL ROUND — your panel split. Re-judge in light of your peers below, then re-emit your final verdict:\n`
      + peers.map(s => `- ${s.seat} (${s.lens}) → ${s.verdict}: ${(s.findings || []).map(f => `[${f.severity}] ${f.title}`).join('; ') || 'no findings'}`).join('\n')
  }
  return p
}

async function auditRound(task, peers) {
  const lenses = task.coven ? task.lenses : [task.lenses[0]]
  const depth = task.coven ? 'deep' : 'neighbors'
  return (await parallel(lenses.map(lens => () =>
    agent(auditPrompt(task, lens, depth, peers), {
      agentType: 'war-auditor', phase: 'Audit',
      label: `audit:${task.id}:${lens}${peers ? ':rebut' : ''}`, model: 'opus', schema: AUDIT_VERDICT })
  ))).filter(Boolean)
}

log(`Phase ${ph.id} "${ph.title}": ${tasks.length} task(s) → ${ph.integrationBranch}`)

let guard = 0
while (done.size < tasks.length && guard++ < tasks.length + 2) {
  const wave = nextWave()
  if (!wave.length) { log(`No runnable tasks remain — the rest are blocked behind escalations.`); break }

  // ---- WORK + AUDIT each task in the wave concurrently ----
  const results = await parallel(wave.map(task => async () => {
    const impl = await agent(
      `Set up the worktree and implement WAR task ${task.id}.\n`
      + `Create a git worktree at ${task.worktree} on branch ${task.branch} cut from the tip of ${ph.integrationBranch}; `
      + `export WAR_WORKTREE=${task.worktree}; cd there; work only inside it.\n`
      + `Sub-issue #${task.issue} — ${task.title}\nPlan slice: ${task.planSlice}\nPlan file: ${plan.file}\nGate: ${plan.gate}`,
      { agentType: 'war-worker', phase: 'Work', label: `work:${task.id}`, model: 'sonnet', schema: WORKER_RESULT })

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

      if (!task.coven && seats.length === 1 &&                   // auto-escalate 1→coven
          (seats[0].confidence === 'low' || (seats[0].findings || []).some(f => f.severity === 'Critical'))) {
        task.coven = true
        log(`Task ${task.id}: escalating to a coven (Critical or low confidence on the lone seat).`)
      }

      const b = blockingOf(seats)                                // batched FIX_NEEDED → fresh fix-worker
      await agent(
        `FIX_NEEDED for WAR task ${task.id}. Work in the existing worktree ${task.worktree} (branch ${task.branch}); export WAR_WORKTREE=${task.worktree}.\n`
        + `Resolve ALL of these blocking findings, keep the gate green, commit and push:\n`
        + b.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n'),
        { agentType: 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, model: 'sonnet', schema: WORKER_RESULT })
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
        { agentType: 'war-merge', phase: 'Refine', label: `merge:${r.task.id}`, model: 'sonnet', schema: MERGE_RESULT })
      if (mr && mr.status === 'merged') landed.push(r.task.id)
      else escalated.push({ task: r.task.id, reason: mr ? mr.status : 'merge_failed', detail: mr })
    } else {
      escalated.push({ task: r.task.id, reason: r.verdict, blocked: r.blocked })
    }
  }
}

// ---- LAND — only when no hard escalation is open; else hold for the Lead ----
let landResult = null
const hardEscalation = escalated.some(e => ['escalate', 'audit-blocked', 'conflict'].includes(e.reason))
if (landed.length && !hardEscalation) {
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Run the gate (${plan.gate}); push ${ph.workingBranch}.`,
    { agentType: 'war-merge', phase: 'Land', label: `land:phase-${ph.id}`, model: 'sonnet', schema: MERGE_RESULT })
} else if (hardEscalation) {
  log(`Holding the land for phase ${ph.id}: ${escalated.length} escalation(s) need the Lead's decision.`)
}

// ---- WRAP-UP — capture durable learnings (war-scribe, write-scoped to learningsTarget) ----
let scribeResult = null
if (landResult && landResult.status === 'landed' && learningsTarget) {
  scribeResult = await agent(
    `Wrap up learnings for WAR phase ${ph.id} "${ph.title}" (landed on ${ph.workingBranch}).\n`
    + `Your only writable path (also set as WAR_WORKTREE): ${learningsTarget}.\n`
    + `Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + `Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + `Escalations: ${JSON.stringify(escalated)}\n`
    + `Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.`,
    { agentType: 'war-scribe', phase: 'Wrap-up', label: `wrap-up:phase-${ph.id}`, model: 'sonnet', schema: SCRIBE_RESULT })
}

return { phase: ph.id, landed, escalated, minorsFiled, landResult, scribeResult }
