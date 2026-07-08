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
//   { phase: { id, title, integrationBranch, workingBranch, epicIssue?, endState?: [condition] },
//              // endState: the Commander's-Intent End-state conditions THIS phase claims (Lead-mapped);
//              // checked by the gate-audit pass — later-phase conditions are out-of-scope there, never a hold
//     plan:  { file, gate, testPattern },  // gate = a shell command, run BY agents (this script has no
//                                     // shell/fs). testPattern = the run's pinned overrides.testPattern
//                                     // (string|null; absent ⇒ null — the plan.gate precedent), appended
//                                     // VERBATIM as the assert-test-in-diff.sh `--pattern '<value>'` arg at
//                                     // both merge-task sites; null ⇒ bare, byte-identical to today.
//     tasks: [ { id, issue, title, branch, worktree, deps:[id],
//                roster:[{ lens, depth? }], planSlice, requiresTest?, requiresPackaging? } ],  // roster: 1–5 distinct-lens audit seats; depth omitted → 'deep'.
//                                     // requiresTest/requiresPackaging default true; false (Lead-set) skips that pre-merge floor with a logged, never-silent skip.
//     learningsTarget,                // read-path resolved repo root — the worker self-query `--repo` flag AND
//                                     // the Lead's Gate-2 promotion destination. NOT a servitor write path.
//     memoryLocalRoot,                // absolute local memory root — the servitor's ONLY writable path;
//                                     // OMITTED when Setup's memory probe reported memory disabled ⇒ Wrap-up skipped
//     intent,                         // Commander's Intent, extracted VERBATIM by the Lead from the plan's
//                                     // `## Commander's Intent` OR `## AI-Commander's Intent` section (either
//                                     // heading; string|null; null/absent ⇒ literal behavior, ADR 0013)
//     memory: { byTask: {<id>: {worker, seats: {<lens>: block}}}, servitor },  // Lead-prefetched prior-lesson
//                                     // blocks (spec §4.5), threaded like intent; concatenated at the worker/
//                                     // auditor/fix-worker/add-test/servitor sites. Empty/absent ⇒ byte-identical.
//     agentPrefix,                    // optional namespace prefix for agent types (default: 'work-audit-refine:')
//     agents: { worker|auditor|refiner|servitor: { model, effort } },  // from .claude/war/config.json (resolved by the Lead); defaults below
//     audit:  { roster, rosterPolicy, autoEscalate },                  // rosterPolicy 'auto' = Lead composes each task.roster from the catalog (Lead-side); audit.roster is the widening FALLBACK roster (auditor-nominated-or-default, D4); autoEscalate used here
//     run:    { roundLimit, afk },                                     // afk is Lead-side; roundLimit used here
//     backstops }                     // array|null of { check, why, runner, source:'plan'|'auto', aiDeclared? } — every
//                                     // validation this phase deferred (Lead is the single normalization point: plan-declared
//                                     // + Setup auto-recorded merged here). Passed through UNTOUCHED into handoff.backstops[].
//                                     // null = legacy plan with no backstop section. Empty/absent ⇒ handoff.backstops = null.
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
  findings: { type: 'array', items: { type: 'object', required: ['severity'], properties: {
    severity: { enum: ['Critical', 'Major', 'Minor', 'Nit'] }, title: { type: 'string' }, file: { type: 'string' },
    line: { type: 'number' }, rationale: { type: 'string' }, suggested_fix: { type: 'string' }, plan_ref: { type: 'string' },
    // Disposition routing (ADR 0013): auditor-owned, orthogonal to severity. Omitted → severity default
    // (Minor → follow-up, Nit → note; 'absorb' is never defaulted). phaseClose:true routes an absorb to
    // the phase-close queue. autoFixable is DEPRECATED — legacy alias for disposition:'absorb', honored
    // one release, removed next release.
    disposition: { enum: ['absorb', 'follow-up', 'note'] }, phaseClose: { type: 'boolean' },
    autoFixable: { type: 'boolean' } } } },
  tests_verified: { type: 'object' }, confidence: { enum: ['high', 'medium', 'low'] }, escalate_reason: { type: 'string' },
  // widen (D4): optional catalog lenses a lone seat nominates for auto-escalate widening; honored only
  // on the lone-seat trigger (resolveWidenSource validates whole-field), ignored elsewhere. Not required.
  widen: { type: 'array', items: { type: 'string' } } } }

const MERGE_RESULT = { type: 'object', required: ['mode', 'status'], properties: {
  mode: { enum: ['merge-task', 'land-phase'] },
  status: { enum: ['merged', 'landed', 'gate_failed', 'conflict', 'error', 'land_stale', 'no-test', 'unpackaged', 'submodule-blocked', 'submodule-pr'] },
  branch: { type: 'string' }, integration_sha: { type: 'string' }, working_sha: { type: 'string' },
  conflict_files: { type: 'array' }, gate_output: { type: 'string' },
  // gate_failure_class (spec §6 / ADR 0019): the on-failure classification the refiner returns
  // ALONGSIDE status:'gate_failed'. ABSENT ⇒ 'introduced' (the permanent fail-safe). Orthogonal to
  // status — NO status enum value, HARD_ESCALATION_REASONS member, or KNOWN_LAND_DECISIONS member is
  // added or changed (land-decision.mjs untouched, ADR 0005). gate_failing_ids/gate_base_sha carry the
  // classified failing-identifier set + classification base sha on a 'baseline' result — the Workflow's
  // baselineDebt key, the source:'auto' backstop check string, and the baseline-proceed prompt read them.
  gate_failure_class: { enum: ['introduced', 'baseline', 'environment'] },
  gate_failing_ids: { type: 'array' }, gate_base_sha: { type: 'string' },
  pr_number: { type: 'number' }, pr_remote: { type: 'string' } } }

// memory_index_updated retired (spec §4.6, D4 deleted): the servitor no longer maintains the index —
// the Lead runs `render-index` post-servitor (Gate 2). The servitor only writes/updates lesson files.
const SERVITOR_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } } } }

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
// Commander's Intent (ADR 0013): extracted VERBATIM by the Lead from the plan's `## Commander's
// Intent` or `## AI-Commander's Intent` section (either heading) and threaded as args.intent
// (string|null). null/absent ⇒ intentClause is '' and every prompt below is byte-identical to an
// intent-less run (criterion 10) — literal behavior.
const intent = (typeof A.intent === 'string' && A.intent) ? A.intent : null
// memoryLocalRoot (spec §4, decision B): the absolute local memory root — the servitor's ONLY writable
// path (learningsTarget is retained above untouched as the read-path repo root feeding
// workerSelfQueryRepoFlag + the Lead's Gate-2 promotion, NOT a servitor write path). Threaded like
// intent/testPattern. null/absent ⇒ Setup's memory probe reported memory disabled ⇒ the Wrap-up
// self-skips with a logged line (fail-open, never a dispatch at an unanchored target).
const memoryLocalRoot = (typeof A.memoryLocalRoot === 'string' && A.memoryLocalRoot) ? A.memoryLocalRoot : null
// Backstops (spec §4.4): the Lead is the single normalization point — plan-declared entries + Setup
// auto-recorded entries are merged Lead-side into args.backstops (array|null of
// { check, why, runner, source: 'plan'|'auto', aiDeclared? }). The Workflow passes these Lead-normalized
// entries through UNTOUCHED into handoff.backstops[] (rendered as the "Unexecuted backstops" line at
// land). A legacy plan with no backstop section → null (surfaced note). Never mutate; never re-normalize.
// SOLE EXCEPTION (spec §6 / ADR 0019): the Workflow itself appends its OWN source:'auto'
// baseline-gate-debt entries (autoBaselineBackstops below) — the only Workflow-authored backstop
// entries; Lead-normalized entries stay untouched. handoff.backstops is the two concatenated
// (mergedBackstops at land): null promotes to a one-entry array when a baseline debt is recorded.
const backstops = Array.isArray(A.backstops) ? A.backstops : null
// Test-floor pattern (spec §6 / ADR 0019): the Lead threads the run's pinned overrides.testPattern into
// args.plan.testPattern exactly like plan.gate (string|null; absent ⇒ null — the plan.gate precedent).
// A non-empty string is appended VERBATIM as the assert-test-in-diff.sh `--pattern '<value>'` argument at
// BOTH merge-task invocation sites (initial + floor-retry); null ⇒ testPatternArg is '' so both dispatched
// prompts are byte-identical to a testPattern-less run (criterion 2). The floor's *.test.sh union is
// script-side (Phase 1, assert-test-in-diff.sh) — never re-stated per prompt. The glob-safe charset is
// validated in war-config.mjs, never here (the value is embedded single-quoted into an agent shell line).
const testPattern = (plan && typeof plan.testPattern === 'string' && plan.testPattern) ? plan.testPattern : null
const testPatternArg = testPattern ? ` --pattern '${testPattern}'` : ''
const intentClause = intent
  ? `\nCOMMANDER'S INTENT (the operator's purpose — your ceiling; the plan slice is your floor):\n${intent}\n`
  : ''
// Prior-lessons memory (spec §4.5): the Lead prefetches per-seat lesson blocks (one batched
// `war-memory query --queries` invocation at phase launch) and threads a map here as args.memory —
// `{ byTask: {<id>: {worker, seats: {<lens>: block}}}, servitor }`. The template FOLLOWS the
// intentClause threading pattern: concatenate a memoryClause at the worker, auditor, fix-worker,
// add-test and servitor spawn sites. ace / gate-audit / polish-sweep get NONE (their input is a
// specific finding or an executed gate output, not a fresh implementation problem). Each `block` is
// the CLI's ready-to-inject text; an empty/absent block ⇒ '' ⇒ the prompt is byte-identical to a
// memory-less run (criterion 10). Retrieval fails open: a missing map is not an error.
const memory = (A.memory && typeof A.memory === 'object') ? A.memory : {}
const memoryByTask = (memory.byTask && typeof memory.byTask === 'object') ? memory.byTask : {}
const memClause = block => (typeof block === 'string' && block) ? `\n${block}\n` : ''
const workerMemClause = taskId => memClause((memoryByTask[taskId] || {}).worker)
const auditorMemClause = (taskId, lens) => memClause(((memoryByTask[taskId] || {}).seats || {})[lens])
const servitorMemClause = () => memClause(memory.servitor)
// Phase-scoped End-state claims (ADR 0013): the intent's numbered End-state conditions THIS phase
// claims (Lead-mapped). Verified by the gate-audit pass; a later-phase condition is out-of-scope
// there, never a hold.
const endStateClaims = Array.isArray(ph && ph.endState)
  ? ph.endState.filter(c => typeof c === 'string' && c) : []
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
// Worktree PATH is phase-scoped (D): `${worktreeRoot}/${runId}/p${ph.id}-${t.id}` mirrors taskBranch,
// so the same taskId under two phase ids of one run never collides on a stale sibling worktree (#583).
// `_refinery` and the polish worktree stay run-scoped/phase-scoped per their own literals below.
const taskWorktree = t => t.worktree || ((worktreeRoot && runId) ? `${worktreeRoot}/${runId}/p${ph.id}-${t.id}` : t.worktree)
// Per-role spawn opts: model always; effort only when non-default (omit = inherit session).
// Mirror of war-config.mjs spawnOpts/validateRoster/widenRoster/resolveWidenSource — the Workflow sandbox can't import. Keep in sync.
const ROLE_MODEL = { worker: 'opus', auditor: 'opus', refiner: 'sonnet', servitor: 'sonnet' }
const spawn = role => {
  const a = agents[role] || {}
  const model = a.model || ROLE_MODEL[role]
  return a.effort && a.effort !== 'default' ? { model, effort: a.effort } : { model }
}
// Roster validation (D8): 1–5 seats, non-empty string lens, depth absent or neighbors|deep, lenses distinct.
const validateRoster = roster => {
  const errors = []
  if (!Array.isArray(roster) || roster.length < 1 || roster.length > 5) {
    errors.push(`roster must be an array of 1-5 seats (got ${JSON.stringify(roster)})`)
    return { valid: false, errors }
  }
  const seen = []
  roster.forEach((seat, i) => {
    if (seat === null || typeof seat !== 'object' || Array.isArray(seat)) { errors.push(`roster[${i}] must be an object { lens, depth? }`); return }
    if (typeof seat.lens !== 'string' || !seat.lens) errors.push(`roster[${i}].lens must be a non-empty string`)
    else if (seen.includes(seat.lens)) errors.push(`roster[${i}].lens "${seat.lens}" duplicates an earlier seat (lenses must be distinct)`)
    else seen.push(seat.lens)
    if (seat.depth !== undefined && seat.depth !== 'neighbors' && seat.depth !== 'deep') errors.push(`roster[${i}].depth must be "neighbors" or "deep" when present (got ${JSON.stringify(seat.depth)})`)
  })
  return { valid: errors.length === 0, errors }
}
// Lone-seat auto-escalation union (D5): keep the existing seats, append default entries whose
// lenses are absent (at their configured depths), cap 5 — union, never replacement.
const widenRoster = (roster, defaultRoster) => {
  const out = [...roster]
  for (const seat of defaultRoster || []) {
    if (out.length >= 5) break
    if (!out.some(s => s.lens === seat.lens)) out.push(seat)
  }
  return out
}
// Lone-seat widening SOURCE (D4): a valid auditor nomination is a non-empty array of distinct,
// non-empty strings, none reserved (strict whole-field). Valid → nominated lenses @ deep,
// source 'nominated'; else → defaultRoster verbatim, source 'default'. Feeds widenRoster.
const RESERVED_LENSES = ['execution-evidence', 'pin-validity']
const resolveWidenSource = (nominated, defaultRoster) => {
  const valid = Array.isArray(nominated) && nominated.length > 0 &&
    nominated.every(l => typeof l === 'string' && l.length > 0 && !RESERVED_LENSES.includes(l)) &&
    new Set(nominated).size === nominated.length
  return valid
    ? { source: 'nominated', seats: nominated.map(lens => ({ lens, depth: 'deep' })) }
    : { source: 'default', seats: defaultRoster }
}
// audit.roster (args) is the union-widening default roster (D5). A default seat with an omitted
// depth normalizes to 'deep' (D2) — the same rule the per-task phase-start normalization applies.
const defaultRoster = (Array.isArray(audit.roster) ? audit.roster : []).map(s =>
  (s && typeof s === 'object' && !Array.isArray(s) && s.depth === undefined) ? { ...s, depth: 'deep' } : s)
const done = new Set()
const succeeded = new Set()
// Hoisted above try{} so the catch block can reference them even when the derivation throw fires
// before any wave runs (temporal dead zone guard — red-team T1-confirmed).
const landed = [], escalated = [], minorsFiled = [], auditLog = []
// Disposition routing (ADR 0013): minorsFiled receives ONLY disposition:'follow-up' findings;
// notes receives disposition:'note' findings (phase report + servitor feed — memory candidates,
// never issues).
const notes = []
// --ace provenance (D3): aced findings recorded as { task, finding, sha } — a return ATTRIBUTE, not a
// status/escalation (D6). Under disposition routing (ADR 0013) `aced` also records the phase-close
// sweep's absorbed findings at the polish sha.
const aced = []
// Phase-close queue (ADR 0012): absorb findings the per-task ace cannot reach (phaseClose:true or a
// release-slot filename) — drained by the phase-close coherence sweep at the integrated tip.
const phaseCloseQueue = []
const mergedTasksForGateAudit = []   // collect {taskId, gateOutput, acceptanceCriteria, gateHeadSha, baselineDebt?} for post-merge gate-audit pass (F04 R3)
// Baseline gate debt (spec §6 / ADR 0019): the in-run record of pre-existing gate failures this phase
// consciously proceeds over. `baselineDebt` is keyed on (failing-identifier set, base sha) — a later
// failure whose identifiers are COVERED by a recorded entry classifies 'baseline' directly (no repeated
// base re-run), and threading the list into every subsequent merge/land prompt lets the refiner
// short-circuit. `autoBaselineBackstops` holds EXACTLY ONE source:'auto' backstop entry per unique key
// (the SOLE Workflow-authored backstop entries), concatenated onto the Lead-normalized args.backstops at
// land. recordBaselineDebt() dedups both in one step.
const baselineDebt = []
const autoBaselineBackstops = []

try {

// Entry validation (H, widened per operator decision 4). If ANY task lacks an explicit
// branch/worktree the derivation must consume the top-level trio + phase.id — so validate them ONCE
// here, at the top of the try{} body (before the per-task derivation loop), so a missing input dies
// at ENTRY with the exact absent keys named (→ held:workflow-error via the catch, git untouched),
// rather than N per-task derivation throws (#586). Two DISTINCT classes: the missing-trio-keys list,
// and a missing phase.id — the silent `pundefined-` branch/worktree derivation class the trio check
// alone would leave open. Zero tasks ⇒ vacuously no throw. The per-task derivation throw below stays
// as the belt-and-suspenders backstop.
if ((tasks || []).some(t => !t.branch || !t.worktree)) {
  const missingTrio = [['planSlug', planSlug], ['runId', runId], ['worktreeRoot', worktreeRoot]]
    .filter(([, v]) => !v).map(([k]) => k)
  const phaseIdMissing = ph == null || ph.id === undefined || ph.id === null || ph.id === ''
  const problems = []
  if (missingTrio.length) problems.push(`workflow-template: requires top-level { planSlug, runId, worktreeRoot } — missing: [${missingTrio.join(', ')}]`)
  if (phaseIdMissing) problems.push(`phase.id is missing (derivation would produce 'pundefined-' branch/worktree names)`)
  if (problems.length) throw new Error(`${problems.join('; ')} (or supply explicit branch/worktree per task)`)
}

for (const t of (tasks || [])) {
  t.branch = taskBranch(t); t.worktree = taskWorktree(t)
  if (!t.branch || !t.worktree) {
    throw new Error(`task ${t.id}: cannot derive branch/worktree — supply planSlug+runId+worktreeRoot or explicit branch/worktree`)
  }
  // Phase-start roster assertion (D8): normalize omitted depth → 'deep' (D2), then validate LOUD.
  // No runtime default roster, no truncation — a broken roster throws into the catch below →
  // held:workflow-error (a silent fallback would mask a Lead-side seeding bug as a narrower audit).
  if (Array.isArray(t.roster)) {
    t.roster = t.roster.map(s =>
      (s && typeof s === 'object' && !Array.isArray(s) && s.depth === undefined) ? { ...s, depth: 'deep' } : s)
  }
  const rv = validateRoster(t.roster)
  if (!rv.valid) throw new Error(`task ${t.id}: invalid roster — ${rv.errors.join('; ')}`)
}

// --- Repo-derived provisioning (Part B) ------------------------------------
// provisionStep runs the pinned run.provision list, IN ORDER, inside one task worktree — a refiner
// seat in the Provision phase (the refiner owns provisioning; ADR 0001). It returns ok:true on full
// success or the env-blocked outcome ({ taskId, failedCommand, exitCode, stderrTail, provisionSource
// } — schemas.md) for the FIRST failing step. The caller skips the worker (and keeps the worktree)
// on ok:false. With an empty list provisioning is a no-op: ok:true with no agent dispatched.
async function provisionStep(task) {
  if (!provisionList.length) return { ok: true }
  // provision mode (agents/war-refiner.md ## provision): per-task provision-run — env-outcome return.
  const out = await agent(
    `PROVISION the worktree for WAR task ${task.id} before its worker runs. cd into ${task.worktree} `
    + `(the refiner's Provision barrier already created it) and run these provisioning commands IN ORDER, `
    + `inside that worktree:\n`
    + provisionList.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + `\n`
    + `These steps make the worktree gate-ready (derived from the repo's own setup; source: ${provisionSource}). `
    + `Run them verbatim; do NOT free-author other commands. If EVERY step exits 0, return { ok: true }. `
    + `If a step exits NON-ZERO, STOP at that first failure and return the env-blocked outcome — `
    + `{ ok: false, taskId: "${task.id}", failedCommand: "<the command>", exitCode: <code>, stderrTail: "<tail of its stderr>", provisionSource: "${provisionSource}" } — `
    + `where failedCommand is the failing step VERBATIM (copy it exactly from the list above — the Workflow's evidence gate matches it against the dispatched list, and a paraphrased or invented command fails closed to held:workflow-error). `
    + `do NOT continue and do NOT remove the worktree (it is kept for inspection). This is environment setup, not the artifact under test: a failure is an env-block, never a code defect.`,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision-run:${task.id}`, schema: ENV_OUTCOME, ...spawn('refiner') })
  if (out && out.ok === true) return { ok: true }
  // Evidence gate (C, tightened): an env-blocked classification is honored ONLY with execution
  // evidence — an ok:false whose failedCommand trim-matches one of the dispatched provisionList steps
  // (exact array membership, never substring) AND whose exitCode is a NUMBER ≠ 0 (an ok:false with
  // exit 0 is incoherent). Then return today's soft env-blocked shape from the REAL result fields
  // (downstream byte-preserved: reason env-blocked, worker unspawned, worktree kept, siblings proceed).
  // Anything else — missing result, refusal prose, foreign/absent failedCommand, non-numeric or zero
  // exitCode — is NOT trustworthy execution evidence: throw so the catch routes it to
  // held:workflow-error (no fabricated env-block). The old provisionList[0] / synthetic exitCode / the
  // synthetic no-result stderrTail fabrication is DELETED (the gate throws instead of inventing fields).
  const trimmed = out && typeof out.failedCommand === 'string' ? out.failedCommand.trim() : null
  const matchesStep = trimmed != null && provisionList.some(c => c.trim() === trimmed)
  if (out && out.ok === false && matchesStep && typeof out.exitCode === 'number' && out.exitCode !== 0) {
    return { ok: false, taskId: task.id, failedCommand: out.failedCommand,
      exitCode: out.exitCode, stderrTail: out.stderrTail, provisionSource }
  }
  throw new Error(`task ${task.id}: the provision-run:${task.id} dispatch returned no execution evidence — an env-blocked classification requires a failedCommand matching a dispatched run.provision step and a numeric non-zero exitCode; got ${JSON.stringify(out)}`)
}
// Prompt fragment threaded into the worker AND fix-worker: both run in the SAME worktree, so both
// must be told the pinned provision list (idempotent — re-running it is safe; D-Validation).
const provisionClause = provisionList.length
  ? `\nThis worktree was provisioned with (source: ${provisionSource}); re-run them if the env looks unset before you drive the gate:\n`
    + provisionList.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
  : ''

const blockingOf = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'Major')
const minorsOf   = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit')
// Disposition classification (ADR 0013): auditor-owned routing, orthogonal to severity. Defaults
// when omitted: Minor → 'follow-up', Nit → 'note'; 'absorb' is NEVER defaulted. Legacy
// autoFixable:true reads as 'absorb' for one release (deprecated — removed next release).
const dispositionOf = f =>
  (f.disposition === 'absorb' || f.disposition === 'follow-up' || f.disposition === 'note') ? f.disposition
  : f.autoFixable === true ? 'absorb'
  : f.severity === 'Minor' ? 'follow-up' : 'note'
// Terminal-disposition demotion ladder (ADR 0013): demote one step toward durability, never drop
// silently — EVERY demotion is log()ged. Arms: failed absorb → follow-up; non-approve-branch
// findings → follow-up (filed with the escalation); held-phase phaseCloseQueue → follow-up;
// fileless absorb → severity default.
const demote = (f, to, why) => {
  log(`Disposition demotion: [${f.severity}] "${f.title}" (task ${f.task}) → ${to} — ${why}.`)
  ;(to === 'note' ? notes : minorsFiled).push(f)
}
// --ace release-slot STRING backstop only (D4). The sandbox can't read files, so the ORCHESTRATOR's
// one enforceable refusal is the release-slot filename check; the AUDITOR (which reads code) owns the
// mechanical / non-load-bearing / no-ponytail-line refusals via finding.disposition. Narrowed to the
// two pure version-slot JSONs (ADR 0013): README/shared-file absorb findings are no longer refused —
// they route to phaseCloseQueue. Requires a file — a fileless finding is never ace-eligible (it takes
// the severity-default demotion instead).
const aceEligible = f => f.file && !/(?:plugin\.json|marketplace\.json)$/.test(f.file)
const allApprove = (seats, expected) => seats.length === expected && seats.every(s => s.verdict === 'approve')
const isSplit    = seats => seats.some(s => s.verdict === 'approve') && seats.some(s => s.verdict === 'request_changes')
// → reason string if the worker did not deliver (null/dead or self-reported blocked), else null
// ponytail: applied at the worker-dispatch sites in T2 (not dead code — defined-but-not-yet-emitted-plan-slice-pattern)
const blockedReason = r => !r ? 'worker returned no result'
  : (r.status === 'blocked' ? (r.blocked_reason || 'worker returned no result') : null)
const nextWave   = () => tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => succeeded.has(d)))

// Force-with-lease carve-out (ADR 0012). ONE canonical sentence, mirrored VERBATIM in
// agents/war-worker.md (standing surface) — the two surfaces are independent and both load-bearing;
// the both-surfaces unit test byte-compares this string. Keep them identical in the same commit.
const FORCE_WITH_LEASE_RULE = 'You may `git push --force-with-lease` ONLY your own task branch, and ONLY after a dispatch-rebase diverged it from its pushed remote — never any other ref, never for any other reason.'
// Dep-wave visibility (ADR 0012): a deps-bearing SAME-REPO task sees its merged dep content by
// rebasing onto the integration branch FIRST. Scoped by taskType — 'gitlink-bump' is EXCLUDED (its
// dep merged into the SUBMODULE repo's integration branch; this clause would assert a merge that
// happened in a different repo). Dep-less tasks are untouched: the frozen phase base stays HARD for
// same-wave parallel tasks.
const depClause = task => ((task.deps || []).length > 0 && task.taskType !== 'gitlink-bump')
  ? `DEPS ALREADY MERGED: this task declares deps [${(task.deps || []).join(', ')}] whose content is already merged into ${ph.integrationBranch}. `
    + `FIRST ACTION — before reading or writing anything else — run \`git -C ${task.worktree} rebase ${ph.integrationBranch}\` so your base includes the merged dep content (a first-dispatch task branch has zero commits of its own, so this rebase is a pure fast-forward). `
    + `If the rebase CONFLICTS (possible only on a resume with existing commits): abort it and return status:"blocked" with the conflict files in blocked_reason — NEVER resolve the conflict yourself. `
    + FORCE_WITH_LEASE_RULE + `\n`
  : ''
// Worker-facing intent block (ADR 0013): the generic intent clause plus the worker's licensed-
// judgment sentence. Empty when intent is absent (byte-compatible prompts, criterion 10).
const workerIntentClause = intent
  ? intentClause + `Use the intent to resolve ambiguity in your slice; intent-consistent deviation is in-band — note it in your result.\n`
  : ''
// Worker self-query line (spec §4.5): workers alone gain a standing license to query the memory CLI
// mid-task when they hit something unfamiliar (they have Bash; no other role gains anything). ONE
// canonical sentence, mirrored in agents/war-worker.md (standing surface) — always present (not
// intent/memory-gated), so it does NOT threaten the byte-identical-empty-map property.
// Read-path repo root (learnings-read-path plan T1): when the run threads a repo root (learningsTarget,
// the Lead's resolved repo root when commitLearnings is on), the example invocation carries
// `--repo <root>` so a worker's self-query walks the published corpus, not just the local root. Absent
// a threaded root the fragment is '' ⇒ the line stays byte-identical to a memory-less run (criterion 10).
const workerSelfQueryRepoFlag = (typeof learningsTarget === 'string' && learningsTarget) ? ` --repo ${learningsTarget}` : ''
const WORKER_MEMORY_SELF_QUERY_LINE = `\nYou MAY run \`node <plugin>/skills/_shared/war-memory.mjs query '<terms>'${workerSelfQueryRepoFlag}\` mid-task when you hit something unfamiliar — it never writes a lesson, and without a \`--local\` root it appends no query log (the CLI never guesses one from the cwd).\n`

// ---- Gate-failure classification (spec §6 / ADR 0019) ----------------------
// classOf reads the refiner-reported gate_failure_class off a gate_failed MergeResult; an ABSENT or
// unrecognized value ⇒ 'introduced' (the permanent fail-safe — reverting baseline-proceed is just
// deleting the classification prose, and absent-class routing is byte-identical to today). Only
// 'baseline' and 'environment' branch away from today's soft escalation.
const classOf = mr => (mr && (mr.gate_failure_class === 'baseline' || mr.gate_failure_class === 'environment'))
  ? mr.gate_failure_class : 'introduced'
const debtIds = ids => (Array.isArray(ids) ? ids : (ids ? [ids] : [])).map(String)
// recordBaselineDebt: dedup on (sorted failing-identifier set, base sha). On a NEW key it records the
// debt AND appends EXACTLY ONE source:'auto' backstop entry; a known key is a no-op (no repeated base
// re-run, no duplicate entry — two tasks with the same identifiers cost one entry + one base re-run).
const recordBaselineDebt = (ids, baseSha) => {
  const idset = debtIds(ids), base = String(baseSha || '')
  const key = JSON.stringify([[...idset].sort(), base])
  if (baselineDebt.some(d => d.key === key)) return
  baselineDebt.push({ key, ids: idset, baseSha: base })
  autoBaselineBackstops.push({
    check: `baseline gate debt: ${idset.join(', ') || '(see gate_output)'} — pre-existing at ${base || '(base sha unrecorded)'}`,
    why: "gate failure classified gate_failure_class:'baseline' — proven pre-existing at the classification base (not introduced by this phase); the phase proceeded over it (spec §6 / ADR 0019)",
    runner: 'target repo CI / operator',
    source: 'auto',
  })
}
// baselineDebtClause: threaded into every subsequent merge/land dispatch so the refiner classifies a
// COVERED failure 'baseline' directly, no repeated base re-run. Empty list ⇒ '' (byte-identical to a
// debt-less run — a phase with no recorded debt dispatches unchanged prompts).
const baselineDebtClause = () => baselineDebt.length
  ? `\nKNOWN BASELINE GATE DEBT (pre-existing failures this phase already classified — if your gate failure's failing identifiers are COVERED by one of these, classify gate_failure_class:'baseline' DIRECTLY, report the covered identifiers in gate_failing_ids, and do NOT re-run the base):\n`
    + baselineDebt.map((d, i) => `  ${i + 1}. [${d.ids.join(', ')}] — pre-existing at ${d.baseSha || '(base sha unrecorded)'}`).join('\n') + '\n'
  : ''
// reattachClause: every merge/land prompt's _refinery step BEGINS with this idempotent re-attach, so a
// dispatch that died mid-classification (classification detaches _refinery to re-run the base) cannot
// strand the serial queue detached (the re-attached-by-default _refinery, spec §6 / ADR 0019).
const reattachClause = refineryP =>
  `HYGIENE (idempotent): begin by re-attaching _refinery to the integration branch — \`git -C ${refineryP} checkout ${ph.integrationBranch}\` — so a prior dispatch that died mid-classification cannot leave _refinery detached.\n`
// classificationClause: the gate-failure classification PROCEDURE, mirrored (per-site base) into the
// initial merge-task prompt, the floor-retry re-merge prompt, THE LAND PROMPT, and agents/war-refiner.md
// (both-surfaces rule, same commit). baseDesc names the per-site classification base.
const classificationClause = (refineryP, baseDesc) =>
  `\nGATE-FAILURE CLASSIFICATION (spec §6 / ADR 0019 — on gate failure, BEFORE returning gate_failed): re-run ONLY the failing gate at the classification base — ${baseDesc} — by detaching _refinery there (\`git -C ${refineryP} checkout --detach <that base>\`), re-running the failing gate, then RE-ATTACHING _refinery to ${ph.integrationBranch} before you return (\`git -C ${refineryP} checkout ${ph.integrationBranch}\`). Set gate_failure_class: (1) the base is RED with the SAME failing identifiers ⇒ 'baseline'; (2) the base is GREEN AND the failure does NOT reproduce on a second run at the task tip in a FRESH environment (fresh TMPDIR/shell) ⇒ 'environment' (reproducibility — NOT file-disjointness — is the trigger; a diff-disjoint but reproducing failure is a normal introduced regression and stays 'introduced'); (3) otherwise ⇒ 'introduced'. This is JUDGMENT, not parsing — carry the base-run evidence in gate_output UNCURATED. On a 'baseline' classification also report the classified failing identifiers in gate_failing_ids (array) and the classification base sha in gate_base_sha. ABSENT class ⇒ treated as 'introduced' (the permanent fail-safe).\n`

function auditPrompt(task, lens, depth, peers, workerTests) {
  let p = `Audit WAR task ${task.id} through the "${lens}" lens at depth ${depth}.\n`
    + `Sub-issue #${task.issue}. Plan slice: ${task.planSlice}. Plan file: ${plan.file}.\n`
    + `Run \`git diff ${ph.integrationBranch}...${task.branch}\` (three-dot = merge-base..head = exactly what this task added) for the authoritative change set; re-run it each round (a fix-worker may have pushed). `
    + `Use allowlist-safe git forms: --name-status, --stat, --format=oneline, A...B, HEAD^. `
    + `Avoid %-format strings (e.g. --pretty=format:%H) and @{} reflog syntax — those are denied by the read-only guard.\n`
    + `Then read candidate files under ${task.worktree}/ for neighbor/deep context.\n`
    + `Verify the mapped acceptance-criteria tests EXIST and are not weakened or skipped (anti-cheat: catch "green by deletion" and test-integrity erosion). You cannot execute the gate — the refiner runs the gate. Your job is to confirm tests exist in the diff and are uncompromised.`
    // Latitude + disposition + calibration + cost-claim rules (ADR 0013) — mirrored VERBATIM in
    // agents/war-auditor.md (standing surface, same commit); the both-surfaces unit tests assert the
    // shared sentences on both.
    + `\nLATITUDE RULE: the plan slice is the floor, the Commander's Intent is the ceiling — intent-consistent work beyond the literal slice is APPROVE (judge it on its own correctness), never a plan-faithfulness violation; only deviations that contradict the intent or the slice block. No intent threaded means judge against the plan slice alone, as before.`
    + `\nDISPOSITION RULE: every Minor/Nit finding carries a disposition — absorb (mechanical, intent-consistent, safe to fix this phase; set phaseClose:true when the fix needs the integrated tip or touches a shared/slot-adjacent file), follow-up (substantive work beyond this phase — MUST state why it is not absorbable), or note (informational; phase report + servitor feed, never an issue). Omitted disposition defaults: Minor becomes follow-up, Nit becomes note; absorb is never a default.`
    + `\nCALIBRATION RULE: judge on evidence only — never soften, downgrade, or drop a finding because peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in the current diff. The pull to soften peaks right after your own finding is challenged — that is the highest-risk moment.`
    + `\nCOST-CLAIM RULE: a finding justified by a cost — "too slow", "too expensive", "too complex" — must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost claim caps the finding at Minor.`
    + intentClause + auditorMemClause(task.id, lens)
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
  // Seats come straight from task.roster (validated at phase start: 1–5 distinct lenses, per-seat
  // depth already normalized). Labels audit:<task>:<lens> are distinct because lenses are distinct.
  const roster = task.roster
  const expected = roster.length
  const runSeat = seat => agent(auditPrompt(task, seat.lens, seat.depth, peers, workerTests), {
    agentType: NS + 'war-auditor', phase: 'Audit',
    label: `audit:${task.id}:${seat.lens}${peers ? ':rebut' : ''}`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  // Initial parallel run
  let results = await parallel(roster.map(seat => () => runSeat(seat)))
  // Re-run only the dropped (null) seats — re-keyed on roster entries (lens+depth) — up to 2 retry passes
  for (let retry = 0; retry < 2; retry++) {
    const dropped = roster.filter((_, i) => results[i] == null)
    if (!dropped.length) break
    const retried = await parallel(dropped.map(seat => () => runSeat(seat)))
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
  // Submodule tasks: thread the target repo + base into the Provision prompt so the refiner knows
  // to initialize the submodule checkout (git submodule update --init) before running ensure-integration
  // against the submodule's base (not the superproject working branch). DP3: no script change.
  const submodTasks = tasks.filter(t => t.taskType === 'submodule')
  const submodNote = submodTasks.length
    ? `\nSUBMODULE TASKS in this phase: ${submodTasks.map(t =>
        `task ${t.id} targets repo "${t.targetRepo || '<targetRepo>'}" at base "${t.targetBase || '<targetBase>'}"`
      ).join(', ')}. `
      + `Before running ensure-integration for these tasks, ensure the submodule checkout is initialized: `
      + `\`git submodule update --init --recursive\` in the superproject, so the submodule worktree at `
      + `"${submodTasks[0] && submodTasks[0].targetRepo || '<targetRepo>'}" exists. `
      + `Run ensure-integration and ensure-worktree cwd-scoped to each submodule task's targetRepo path (not the superproject).`
    : ''
  // provision mode (agents/war-refiner.md ## provision): git-topology barrier — env-outcome return.
  const barrierOut = await agent(
    `Provision the worktree topology for WAR phase ${ph.id} "${ph.title}" by running ${SCRIPT}. `
    + `Do NOT free-author git; only run these subcommands, fail loud on ANY non-zero exit — treat every non-zero exit as a halt, do NOT special-case a single code (a foreign integration branch exits 3; a diverged local/origin base halts with its own distinct non-zero exit) — and return the env-outcome JSON: \`{ ok: true }\` only when every subcommand exited 0; on the FIRST non-zero exit return \`{ ok: false, failedCommand: "<the exact provision-worktrees.sh subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr — the script's die text>" }\`.\n`
    + `1. FROM THE MAIN CHECKOUT (${mainCheckout || 'the main repo checkout — your current working directory'}, NOT a task worktree): `
    + `provision-worktrees.sh ensure-exclude — this excludes \`.claude/\` in the parent checkout so the nested task worktrees do not surface as untracked there (probe E2).\n`
    + `2. provision-worktrees.sh ensure-integration ${planSlug || '<plan-slug>'} ${ph.id} ${ph.workingBranch}${owned} — reuse the plan-namespaced integration branch ${ph.integrationBranch} if it is already ours (the --owned-file ledger); else DERIVE the cut base against origin (ADR 0008): the script fetches origin/${ph.workingBranch} and reconciles the local ${ph.workingBranch} — equal or ahead → cut from local; behind → cut from the ORIGIN tip plus a guarded follower fast-forward (skipped with a warning when ${ph.workingBranch} is checked out in a worktree); a fetch failure or missing origin → cut from local with a stderr warning (today's offline behavior). DIVERGED (neither SHA an ancestor of the other) is a HALT: the script dies non-zero carrying BOTH SHAs and the two repair directions, and creates no branch. On that die — or ANY non-zero exit — return the \`{ ok: false, … }\` env-outcome carrying the die text in \`stderrTail\` and STOP: never pick a side, never retry with a different base. The phase never starts; I surface the die message like today's foreign-branch halt.\n`
    + `3. Capture the resulting integration tip (TIP="$(git rev-parse ${ph.integrationBranch})"), then for EACH task run ensure-worktree at the integration tip captured in step 3 (idempotent; reuse if present, conservative heal if the dir went missing):\n${ensures}\n`
    + `Each ensure-worktree creates the worktree on its plan-namespaced branch off the integration tip and drops a .war-task marker. After this barrier every task worktree exists and the workers can run.\n`
    + `4. provision-worktrees.sh ensure-refinery-worktree ${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery ${ph.integrationBranch} — create (or re-attach) the Refinery's dedicated worktree on the integration branch. The Refinery performs every merge in this run-scoped worktree, never the Lead's main checkout.`
    + submodNote,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision:phase-${ph.id}`, schema: ENV_OUTCOME, ...spawn('refiner') })
  // No topology ⇒ nothing in the phase can run — a hard stop is correct here, evidence or not (B/C).
  // !ok or a missing result throws with the stderrTail (which carries the script's die text — incl. a
  // foreign-branch exit 3 or a diverged exit 7) → held:workflow-error via the catch.
  if (!barrierOut || barrierOut.ok !== true) {
    throw new Error(`phase ${ph.id}: the provision:phase-${ph.id} git-topology barrier did not return { ok: true } — the phase cannot start: ${(barrierOut && barrierOut.stderrTail) || 'no result / no env-outcome returned'}`)
  }
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

    // Submodule and gitlink-bump tasks get extra dispatch context (new dispatch sites, T4 plan §(f)).
    // ponytail: inline branch — avoids a helper for two taskType variants
    let workerExtraCtx = ''
    if (task.taskType === 'submodule') {
      workerExtraCtx = `\nTARGET REPO: ${task.targetRepo || '<targetRepo>'} — this is a submodule task. `
        + `Your worktree is rooted inside the submodule checkout at ${task.targetRepo || '<targetRepo>'}; `
        + `the submodule base is "${task.targetBase || '<targetBase>'}". `
        + `Implement, write mapped tests in the submodule repo, gate green, commit, push ${task.branch}.`
    } else if (task.taskType === 'gitlink-bump') {
      // Find the dep submodule task for the submodule path. The dep's landed SHA is a CROSS-PHASE
      // value the worker resolves from the ledger (war-worker.md T7) — emit the placeholder here.
      const depSubmodTask = tasks.find(t => (task.deps || []).includes(t.id) && t.taskType === 'submodule')
      const depSha = '<dep-submodule-landed-sha>'
      const submodPath = depSubmodTask ? (depSubmodTask.targetRepo || '<submodule-path>') : '<submodule-path>'
      workerExtraCtx = `\nGITLINK-BUMP task: pin the superproject gitlink to the dep submodule task's landed SHA. `
        + `Dep submodule task landed SHA: ${depSha}. Submodule path: ${submodPath}. `
        + `Run: git -C ${mainCheckout || '<superproject>'} add ${submodPath} — stage the submodule at the dep SHA, then commit the bump.`
    }
    const impl = await agent(
      depClause(task)
      + `Implement WAR task ${task.id} in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}, cut from ${ph.integrationBranch}).\n`
      + `The refiner's Provision barrier already created this worktree and its .war-task marker — do NOT create it yourself and do NOT set any worktree env var. cd into ${task.worktree} and work only inside it; commit and push ${task.branch}.\n`
      + `Sub-issue #${task.issue} — ${task.title}\nPlan slice: ${task.planSlice}\nPlan file: ${plan.file}\nGate: ${plan.gate}${workerIntentClause}`
      + WORKER_MEMORY_SELF_QUERY_LINE + workerMemClause(task.id) + provisionClause + workerExtraCtx,
      { agentType: NS + 'war-worker', phase: 'Work', label: `work:${task.id}`, schema: WORKER_RESULT, ...spawn('worker') })

    const why = blockedReason(impl); if (why) return { task, verdict: 'escalate', seats: [], expected: 0, blocked: why }

    let round = 0, verdict = null, seats = [], expected = 0, blocked = null
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

      if (audit.autoEscalate !== false && task.roster.length === 1 &&   // lone-seat widening (D4/D5; config can disable)
          (seats[0].confidence === 'low' || (seats[0].findings || []).some(f => f.severity === 'Critical'))) {
        // Widening source (D4): the lone seat may nominate catalog lenses via `widen`; a valid
        // nomination widens toward those seats @ deep, else the trio-union default roster. Never silent.
        const widen = resolveWidenSource(seats[0].widen, defaultRoster)
        task.roster = widenRoster(task.roster, widen.seats)
        const src = widen.source === 'nominated' ? 'nominated' : 'default fallback'
        log(`Task ${task.id}: lone-seat widening (Critical or low confidence; source: ${src}) — roster is now [${task.roster.map(s => s.lens).join(', ')}].`)
      }

      const b = blockingOf(seats)                                // batched FIX_NEEDED → fresh fix-worker
      const fix = await agent(
        `FIX_NEEDED for WAR task ${task.id}. Work in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
        + `Resolve ALL of these blocking findings, keep the gate green, commit and push:\n`
        + b.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n')
        + workerMemClause(task.id) + provisionClause,
        { agentType: NS + 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
      const fixWhy = blockedReason(fix); if (fixWhy) { verdict = 'escalate'; blocked = fixWhy; break }
      round++
    }
    if (verdict === null) verdict = 'audit-blocked'
    return { task, verdict, seats, expected, round, blocked }
  }))

  // ---- REFINE — serial merge of approved tasks (THE merge queue) ----
  // ponytail: guard the agent-emitted pin at the copy site, not via a schema `pattern` —
  //           the model must still be able to emit the '(integration_sha …)' sentinel legitimately.
  const pinOrSentinel = s =>
    (typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)) ? s : '(integration_sha unrecorded/malformed)'
  // landMerged: the shared merged-task landing step (initial merge, floor-retry re-merge, and the
  // baseline-proceed re-merge all funnel through it). requiresTest:false ⇒ the gate-audit HARD path is
  // vacuous — skip + LOG (never silent). taskDebt (spec §6 / ADR 0019): a baseline-merged task carries
  // its classified failing identifiers so the gate-audit prompt won't read a pre-existing base failure
  // as a provably-unrun mapped test; empty/absent ⇒ the field is omitted (byte-identical entry).
  const landMerged = (task, mr, taskDebt) => {
    landed.push(task.id); succeeded.add(task.id)
    if (task.requiresTest === false) {
      log(`gate-audit: skipping ${task.id} (requiresTest:false — no mapped tests, HARD path vacuous)`)
    } else {
      mergedTasksForGateAudit.push({ taskId: task.id, gateOutput: mr.gate_output, acceptanceCriteria: task.planSlice,
        gateHeadSha: pinOrSentinel(mr.integration_sha),
        ...(Array.isArray(taskDebt) && taskDebt.length ? { baselineDebt: taskDebt } : {}) })
    }
  }
  for (const r of results.filter(Boolean)) {
    // Carry the audit-loop round counter onto the task object so the no-test sub-loop
    // continues the SHARED budget (not a fresh counter — that would double the allowance).
    r.task.fixRounds = r.round ?? 0
    // Classify-at-collection (ADR 0013): each Minor/Nit routes ONCE, by disposition — replacing the
    // old eager minorsFiled push + aced-splice. Routed per verdict branch below.
    const taskMinors = minorsOf(r.seats || []).map(f => ({ task: r.task.id, ...f }))
    auditLog.push({ task: r.task.id, verdict: r.verdict, findings: (r.seats || []).flatMap(s => s.findings || []), blocked: r.blocked, requested: r.expected, returned: (r.seats || []).length, fixRounds: r.task.fixRounds })
    done.add(r.task.id)
    if (r.verdict === 'approve') {
      // Disposition routing (ADR 0013). absorb splits further: fileless → severity default
      // (demotion); --ace off → follow-up (demotion — absorb execution rides run.ace, per-task ace
      // AND phase-close sweep alike); eligible → per-task ace exactly as today; phaseClose:true or
      // a release-slot filename → phaseCloseQueue (the sweep's feed).
      const aceable = []
      for (const f of taskMinors) {
        const d = dispositionOf(f)
        if (d === 'follow-up') minorsFiled.push(f)
        else if (d === 'note') notes.push(f)
        else if (!f.file) demote(f, f.severity === 'Minor' ? 'follow-up' : 'note', 'fileless absorb takes the severity default (never ace-eligible)')
        else if (!run.ace) demote(f, 'follow-up', 'absorb requires --ace (off this run)')
        else if (!f.phaseClose && aceEligible(f)) aceable.push(f)
        else phaseCloseQueue.push(f)
      }
      // --ace: opt-in, fail-closed pre-merge polish of absorb-disposition findings. Single attempt (D1/D2/D5).
      // Sits at the TOP of the approve branch, BEFORE the merge dispatch: the ace worker commits one fix,
      // a fresh auditRound re-audits at the new sha; if re-approved the merge runs on the polished tip,
      // else the merge dispatch forward-reverts the ace commit (D2 — NEVER escalate; the approved work still lands).
      let aceSha = null
      if (blockingOf(r.seats).length === 0 && aceable.length && r.task.fixRounds < roundLimit) {
        const ace = await agent(
          `ADVISORY POLISH (--ace) for WAR task ${r.task.id}. Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
          + `This task is ALREADY APPROVED. These are auditor-flagged absorb-disposition Minor/Nit findings — apply the smallest mechanical fix for EACH, keep the gate green, and make EXACTLY ONE commit whose message cites each finding's title + rationale:\n`
          + aceable.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n') + '\n'
          + `Make ONE commit only (the panel re-audits it at the new sha; on regression it is forward-reverted). Do NOT touch version/release slots. Commit and push ${r.task.branch}.`
          + intentClause + provisionClause,
          { agentType: NS + 'war-worker', phase: 'Audit', label: `ace:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
        const aceWhy = blockedReason(ace)
        // WORKER_RESULT's commit field is `head_sha` (NOT `sha` — no worker result carries `.sha`).
        // Guard on a TRUTHY head_sha: a falsy sha would make r.aceReverted falsy (revert clause never
        // fires) AND emit a `git revert --no-edit ` with no arg (fails → escalate). Both defeat the
        // never-blocks-a-land invariant. A blocked/head_sha-less ace falls through to the plain merge.
        if (!aceWhy && typeof ace.head_sha === 'string' && ace.head_sha) {
          r.task.fixRounds++
          aceSha = ace.head_sha /* the single ace commit */
          const { seats: reSeats, expected: reExpected } = await auditRound(r.task, null, null)   // re-pin + re-audit at the new sha (D1)
          if (allApprove(reSeats, reExpected) && blockingOf(reSeats).length === 0) {
            r.seats = reSeats                          // merge proceeds on the polished tip
            r.aceSha = aceSha
            // aced provenance (D3): the findings this ace commit resolved. No splice needed —
            // classify-at-collection never eagerly filed them.
            for (const f of aceable) aced.push({ task: f.task, finding: f, sha: aceSha })
            // Route the re-audit round's OWN Minor/Nits too (never drop silently): the single ace
            // attempt is spent, so a fresh absorb here takes the failed-absorb demotion.
            for (const f of minorsOf(reSeats).map(x => ({ task: r.task.id, ...x }))) {
              const d = dispositionOf(f)
              if (d === 'follow-up') minorsFiled.push(f)
              else if (d === 'note') notes.push(f)
              else demote(f, 'follow-up', 'failed absorb — the single ace attempt is already spent (re-audit round finding)')
            }
          } else {
            r.aceReverted = aceSha                     // D2: merge dispatch prepends `git revert --no-edit <aceSha>`; never escalate
            aceSha = null
            // Demotion arm: failed absorb (re-audit regression → forward-revert) → follow-up.
            for (const f of aceable) demote(f, 'follow-up', 'failed absorb — ace re-audit regressed; the ace commit is forward-reverted')
          }
        } else {
          // aceWhy or falsy head_sha: fall through to the normal merge on the un-aced approved tip
          // (never hold). Demotion arm: failed absorb (ace blocked / no usable head_sha) → follow-up.
          for (const f of aceable) demote(f, 'follow-up', `failed absorb — ${aceWhy || 'ace worker returned no usable head_sha'}`)
        }
      } else if (aceable.length) {
        // Demotion arm: failed absorb — ace unavailable (open blocking findings or exhausted fix
        // budget) → follow-up. Never dropped silently.
        for (const f of aceable) demote(f, 'follow-up', 'failed absorb — ace unavailable (open blocking findings or exhausted fix budget)')
      }
      const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
      const requiresTest = r.task.requiresTest !== false  // default true; false only when explicitly set
      // requiresPackaging (spec §4.2): gates the assert-packaging-in-diff.sh floor, INDEPENDENT of
      // requiresTest (like the submodule floor, decoupled from the test flag). Default true; false
      // only when explicitly set. A false skip is LOGGED, never silent (the requiresTest:false idiom).
      const requiresPackaging = r.task.requiresPackaging !== false
      if (!requiresPackaging) log(`packaging-floor: skipping ${r.task.id} (requiresPackaging:false — assert-packaging-in-diff.sh not run for this task)`)
      // For a submodule task: thread targetRepo (the submodule checkout) + targetBase so the refiner
      // runs the rebase/merge/gate cwd-scoped to the submodule repo (DP3 — no script change needed).
      const isSubmodTask = r.task.taskType === 'submodule'
      const submodMergeNote = isSubmodTask && r.task.targetRepo
        ? `\nSUBMODULE TASK: this merge-task operates INSIDE the submodule repo, not the superproject. `
          + `Submodule checkout (targetRepo): ${r.task.targetRepo}. Submodule base: ${r.task.targetBase || '<targetBase>'}. `
          + `Run rebase and gate cwd-scoped to ${r.task.targetRepo}; the _refinery merge fast-forwards the submodule integration branch.`
        : ''
      // D2 forward-revert: on an ace re-audit regression the merge dispatch PREPENDS one clause — in the
      // TASK worktree, `git -C <worktree> revert --no-edit <aceSha>` BEFORE the rebase. Emitted ONLY when
      // r.aceReverted is a non-empty string (belt-and-suspenders, never unconditional). This CANNOT introduce
      // a new escalate: aceSha is the single ace commit = the task-branch TIP at revert time, so its revert is
      // the clean inverse of HEAD and cannot conflict; the tree returns to the originally-approved state and the
      // rebase+gate+merge behaves exactly as it would have un-aced. Ace never turns a mergeable task into a hold.
      const aceRevertClause = (typeof r.aceReverted === 'string' && r.aceReverted)
        ? `FORWARD-REVERT (--ace regression): the ace polish commit regressed on re-audit. In the TASK worktree, run `
          + `\`git -C ${r.task.worktree} revert --no-edit ${r.aceReverted}\` (forward-only, classifier-safe — it is the clean inverse of the task-branch tip, cannot conflict) `
          + `BEFORE the rebase step (a), so the merge runs on the reverted-to-approved tip. Do NOT reset --hard. The originally-approved work still lands.\n`
        : ''
      const mr = await agent(
        `Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
        + aceRevertClause
        + reattachClause(refineryPath)
        + `IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
        + `  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
        + `CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
        + `rebase --onto does NOT dodge this constraint — it is equally refused.\n`
        + `  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
        + `Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
        + classificationClause(refineryPath, `the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
        + baselineDebtClause()
        + `On success, populate gate_output in the returned MergeResult with the executed gate output (stdout+stderr) so the post-merge gate-audit pass can review it as execution evidence. Do NOT curate or excerpt — each *.test.sh runner emits a single aggregate PASS line, so a partial paste reads as an under-run; include the complete *.test.sh runner list or state the total runner count. `
        + `Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip.`
        + ` Before the _refinery merge step (b), run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (REGARDLESS of requiresTest — a submodule touch is refused whether or not the task needs a test; the relax-flag is only threaded for a declared gitlink-bump task). Exit 1 → return { mode: 'merge-task', status: 'submodule-blocked' } — do NOT merge. Exit 2 → return { mode: 'merge-task', status: 'error' }.`
        + (requiresTest
          ? ` Also before step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop.`
          : ` requiresTest:false — skip the assert-test-in-diff.sh check and proceed directly to the rebase+merge.`)
        + (requiresPackaging
          ? ` Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} to verify the task diff adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.`
          : ` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
        + submodMergeNote,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}`, schema: MERGE_RESULT, ...spawn('refiner') })

      // submodule-blocked: immediate hard escalate, 0 fix rounds (refuse-all, like env-blocked).
      // ponytail: reuses existing 'escalate' reason (DP3 — no new HARD_ESCALATION_REASONS member, no land-decision.mjs cascade)
      if (mr && mr.status === 'submodule-blocked') {
        escalated.push({ task: r.task.id, reason: 'escalate', detail: `${r.task.id} touches a submodule; WAR is single-repo as of v0.7.8` })
        auditLog.push({ task: r.task.id, verdict: 'submodule-blocked', findings: [], fixRounds: 0 })
        continue
      }

      // Combined floor-retry sub-loop: bounded fix-worker + full re-audit on EITHER floor status
      // (no-test OR unpackaged). NOT a blind copy of the old no-test-only loop — a retry merge here
      // hard-escalated any unexpected status verbatim, so a task tripping BOTH floors (adds a source
      // file with no test AND no COPY) would clear one and hard-escalate on the other, never getting
      // its bounded fix (spec §4.2). One loop, both floors, shared budget, until both pass or exhaust.
      // Every dispatched retry-merge re-instructs ALL floor invocations (test + packaging + submodule),
      // keeping the dispatched prompts in sync with the standing war-refiner.md steps.
      // ponytail: requiresTest:false / requiresPackaging:false tasks never enter (that floor's status is never returned)
      const FLOOR_STATUSES = ['no-test', 'unpackaged']
      if (mr && FLOOR_STATUSES.includes(mr.status)) {
        let floorMr = mr
        let reAuditFailed = false
        while (floorMr && FLOOR_STATUSES.includes(floorMr.status) && r.task.fixRounds < roundLimit) {
          // Dispatch a fix-worker keyed to the CURRENT tripped floor, in the SAME worktree.
          const isNoTest = floorMr.status === 'no-test'
          const fixPrompt = isNoTest
            ? `ADD_TEST for WAR task ${r.task.id}. The refiner's merge-task check (assert-test-in-diff.sh) found no test file in the diff. `
              + `Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + `Add a mapped test for this task (the test must exercise the slice described in: ${r.task.planSlice}), keep the gate green, commit and push.`
            : `PACKAGE_IT for WAR task ${r.task.id}. The refiner's merge-task check (assert-packaging-in-diff.sh) flagged an added/renamed file a Dockerfile's enumerated COPYs miss. `
              + `Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + `Resolve it for the slice described in: ${r.task.planSlice}. add the COPY or dockerignore it — never delete the file to satisfy the floor. Keep the gate green, commit and push.`
          const floorFix = await agent(
            fixPrompt + workerMemClause(r.task.id) + provisionClause,
            { agentType: NS + 'war-worker', phase: 'Audit', label: `${isNoTest ? 'add-test' : 'package-it'}:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
          // Floor-specific verdict tokens: no-test keeps its historical strings (regression guard #268);
          // unpackaged uses the parallel package-it form. status ('no-test'|'unpackaged') prefixes both.
          const blockedVerdict = isNoTest ? 'no-test:add-test-blocked' : 'unpackaged:package-it-blocked'
          const floorFixWhy = blockedReason(floorFix)
          if (floorFixWhy) {
            // Blocked fix-worker — escalate with reason and break the floor-retry sub-loop
            escalated.push({ task: r.task.id, reason: 'escalate', blocked: floorFixWhy })
            auditLog.push({ task: r.task.id, verdict: blockedVerdict, findings: [], blocked: floorFixWhy, fixRounds: r.task.fixRounds })
            floorMr = null
            reAuditFailed = true
            break
          }
          r.task.fixRounds++

          // RE-RUN the full audit panel for this task (not a re-wave — localized sub-loop). The floor
          // cannot judge whether dockerignoring the file (or the added test) was RIGHT; the panel can.
          let reSeats, reExpected
          ;({ seats: reSeats, expected: reExpected } = await auditRound(r.task, null, null))
          const reVerdict = reSeats.length < reExpected ? 'audit-blocked'
            : reSeats.some(s => s.verdict === 'escalate') ? 'escalate'
            : allApprove(reSeats, reExpected) ? 'approve' : 'request_changes'

          if (reVerdict !== 'approve') {
            // Vacuous or wrong fix — escalate, do not merge
            escalated.push({ task: r.task.id, reason: 'escalate', blocked: `${floorMr.status}: re-audit did not approve after the floor fix` })
            auditLog.push({ task: r.task.id, verdict: `${floorMr.status}:re-audit-failed`, findings: (reSeats || []).flatMap(s => s.findings || []), fixRounds: r.task.fixRounds })
            floorMr = null
            reAuditFailed = true
            break
          }

          // Re-attempt the serial merge — re-instructs ALL floor invocations (test + packaging + submodule).
          floorMr = await agent(
            `Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + `IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
            + `  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
            + `CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
            + `rebase --onto does NOT dodge this constraint — it is equally refused.\n`
            + `  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
            + `Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
            + `On success, populate gate_output in the returned MergeResult with the executed gate output (stdout+stderr) so the post-merge gate-audit pass can review it as execution evidence. Do NOT curate or excerpt — each *.test.sh runner emits a single aggregate PASS line, so a partial paste reads as an under-run; include the complete *.test.sh runner list or state the total runner count. `
            + `Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip. `
            + classificationClause(refineryPath, `the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
            + baselineDebtClause()
            + (requiresTest
              ? `Before the _refinery merge step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff now contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop. `
              : `requiresTest:false — skip the assert-test-in-diff.sh check. `)
            + (requiresPackaging
              ? `Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} to verify the task diff now adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.`
              : `requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`),
            { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}:floor-retry:r${r.task.fixRounds}`, schema: MERGE_RESULT, ...spawn('refiner') })
        }

        if (!reAuditFailed && floorMr && FLOOR_STATUSES.includes(floorMr.status)) {
          // Budget exhausted — hard escalation with reason = whichever floor is still tripping (both HARD).
          escalated.push({ task: r.task.id, reason: floorMr.status, fixRounds: r.task.fixRounds })
          auditLog.push({ task: r.task.id, verdict: `${floorMr.status}:exhausted`, fixRounds: r.task.fixRounds, findings: [] })
          continue
        }

        // Null-deref guard: both reAuditFailed=true sites set floorMr=null; skip before the unconditional floorMr.status deref below.
        if (reAuditFailed) continue

        // Use the successful re-merge result for the landed path below (D7 guard rides landMerged: a
        // requiresTest:false task cannot reach this sub-loop via the test floor, but the skip is logged
        // there for prompt-contract reachability).
        if (floorMr.status === 'merged') {
          landMerged(r.task, floorMr)
        } else {
          escalated.push({ task: r.task.id, reason: floorMr.status ?? 'merge_failed', detail: floorMr })
        }
        continue
      }

      if (mr && mr.status === 'merged') {
        // D7 skip + gate-audit push (incl. baseline debt when present) ride landMerged.
        landMerged(r.task, mr)
      }
      else if (mr && mr.status === 'gate_failed') {
        // ---- Gate-failure classification routing (spec §6 / ADR 0019) ----
        // The refiner re-ran the failing gate at the phase integration base and returned
        // gate_failure_class (classOf ⇒ 'introduced' when ABSENT — the permanent fail-safe). Routes
        // recovery WITHOUT touching any status enum, HARD_ESCALATION_REASONS, or KNOWN_LAND_DECISIONS
        // (land-decision.mjs untouched, ADR 0005). Merge-time gate_failed is a SOFT escalation — there
        // is NO audit-stage fix-worker loop at this site (the stale war-refiner.md step-3 FIX_NEEDED
        // sentence is corrected in the same commit).
        const cls = classOf(mr)
        if (cls === 'environment') {
          // 'environment': soft escalate reusing reason 'env-blocked' (0 fix rounds, worktree kept,
          // siblings proceed; detail = the MergeResult — a gate-time env-block, NOT the provision
          // ENV_OUTCOME shape). No new reason string, no enum change.
          escalated.push({ task: r.task.id, reason: 'env-blocked', detail: mr })
        } else if (cls === 'baseline') {
          // 'baseline': record the debt (deduped) + ONE source:'auto' backstop, then dispatch ONE
          // baseline-proceed re-merge naming the classified ids. Route its result normally; a 2nd
          // gate_failed routes by class with 'baseline' treated as 'introduced' (bounded — no 2nd re-dispatch).
          recordBaselineDebt(mr.gate_failing_ids, mr.gate_base_sha)
          const bp = await agent(
            `BASELINE-PROCEED re-merge for WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + `The prior merge-task gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the phase integration base, NOT introduced by this task: ${(mr.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
            + `  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}.\n`
            + `  (b) Run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that pre-existing set is a real regression → return { mode: 'merge-task', status: 'gate_failed' } classifying the NEW failure, and do NOT merge.\n`
            + `  (c) If the ONLY failures are the pre-existing baseline set, MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), git merge ${r.task.branch}, push, return { mode: 'merge-task', status: 'merged', integration_sha: <tip> }.`
            + ` Before the merge, run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (exit 1 → submodule-blocked; exit 2 → error).`
            + (requiresTest
              ? ` Also run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} (exit 1 → no-test; exit 2 → error).`
              : ` requiresTest:false — skip the assert-test-in-diff.sh check.`)
            + (requiresPackaging
              ? ` Also run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} (exit 1 → unpackaged; exit 2 → error).`
              : ` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`),
            { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}:baseline-proceed`, schema: MERGE_RESULT, ...spawn('refiner') })
          if (bp && bp.status === 'merged') landMerged(r.task, bp, (mr.gate_failing_ids || []))
          else if (bp && bp.status === 'gate_failed' && classOf(bp) === 'environment') escalated.push({ task: r.task.id, reason: 'env-blocked', detail: bp })
          else if (bp && bp.status === 'gate_failed') escalated.push({ task: r.task.id, reason: 'gate_failed', detail: bp })   // introduced OR baseline→introduced (bounded)
          // A submodule mutation surfaced by the baseline-proceed floor is HARD (mirror the primary
          // submodule-blocked path — a soft escalation must never let a submodule touch ride a land).
          else if (bp && bp.status === 'submodule-blocked') escalated.push({ task: r.task.id, reason: 'escalate', detail: `${r.task.id} touches a submodule (surfaced on the baseline-proceed re-merge)` })
          else escalated.push({ task: r.task.id, reason: bp ? bp.status : 'merge_failed', detail: bp })
        } else {
          // 'introduced' / absent ⇒ BYTE-IDENTICAL to today's soft escalation (reason gate_failed,
          // detail = the MergeResult; soft — gate_failed is not in HARD_ESCALATION_REASONS).
          escalated.push({ task: r.task.id, reason: mr.status, detail: mr })
        }
      }
      else escalated.push({ task: r.task.id, reason: mr ? mr.status : 'merge_failed', detail: mr })
    } else {
      // Demotion arm (ADR 0013): findings on a task that never reaches the approve branch demote to
      // follow-up and are filed WITH the escalation — the old eager-push behavior, now stated.
      for (const f of taskMinors) {
        if (dispositionOf(f) === 'follow-up') minorsFiled.push(f)
        else demote(f, 'follow-up', `task never reached the approve branch (verdict: ${r.verdict}) — filed with the escalation`)
      }
      if (r.verdict === 'env-blocked') {
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
}

// ---- POST-MERGE GATE-AUDIT PASS (F04 R3) — parallel, AFTER serial merge queue, BEFORE Land decision ----
// A read-only war-auditor (lens: execution-evidence) reviews the executed gate output from each merged
// task to close the "auditor can't verify PASS" gap with real execution evidence (not just integrity-by-reading).
// Default outcome: SOFT note (does not hold the land). Hard only if a mapped test is provably unrun
// (present in diff but absent / 0-count in gate_output) — Open decision #1 (resolved: operationally defined).
// End-state check (ADR 0013, phase-scoped): rides this pass when it runs. Empty when the phase
// claims no conditions — the gate-audit prompt stays byte-identical to today (criterion 10).
const endStateBlock = endStateClaims.length
  ? `\nEND-STATE CHECK (phase-scoped): this phase claims the Commander's-Intent End-state condition(s) below. Three cases, mirroring the provably-unrun/SOFT split: `
    + `(1) a condition provably UNMET by the landed content at the CONFIRMED integration tip is HARD — record a Critical/Major finding (gate-evidence lane, holds the land); `
    + `(2) a condition you cannot verify, or a tip you cannot confirm, is a SOFT note (Minor/Nit), never a hold; `
    + `(3) a condition owned by a LATER phase is out-of-scope — record a Nit finding whose title contains "out-of-scope", NEVER a hold. `
    + `Set plan_ref on EVERY End-state finding to the condition text VERBATIM (the handoff block keys endState statuses on it).\n`
    + endStateClaims.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + '\n'
  : ''
if (mergedTasksForGateAudit.length > 0) {
  const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
  // ponytail: reuse the _refinery worktree — already checked out on ph.integrationBranch at the integration tip
  //           after the serial merge queue and before Land/teardown; loop-scoped :308 refineryPath is out of scope here
  await parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria, gateHeadSha, baselineDebt: taskDebt }) => async () => {
    // Baseline-debt line (spec §6 / ADR 0019): a baseline-merged task carries its classified failing
    // identifiers so a pre-existing base failure in the gate output is NOT read as a provably-unrun
    // mapped test (which would fake a HARD hold). Empty/absent debt ⇒ '' ⇒ byte-identical prompt.
    const debtLine = (Array.isArray(taskDebt) && taskDebt.length)
      ? `\nBASELINE GATE DEBT: this task was merged over PRE-EXISTING base failures classified gate_failure_class:'baseline' — the failing identifiers below are pre-existing at the classification base, NOT evidence a mapped test did not run. A gate-output failure matching one of these is base debt, never a provably-unrun mapped test: ${taskDebt.join(', ')}.\n`
      : ''
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
      + `First, validate the gate-HEAD pin is a real object. Run (read-only git, permitted):\n`
      + `    git -C ${refineryPath} cat-file -t ${gateHeadSha}\n`
      + `If that command fails (non-zero exit, or the guard refuses it because the pin is the '(integration_sha …)' sentinel), `
      + `the pin is malformed/synthetic: record the SOFT cannot-confirm note (same required fields below) and skip the `
      + `rev-parse comparison — never a HARD finding.\n`
      + `Then confirm your evidence is pinned to the integration tip. Run (read-only git, permitted):\n`
      + `    git -C ${refineryPath} rev-parse HEAD\n`
      + `and compare the printed sha against the gate-HEAD sha ${gateHeadSha}. Equal ⇒ pin CONFIRMED. `
      + `Different, or the command cannot run (git unavailable / rev-parse fails) ⇒ you CANNOT confirm the pin.\n`
      + `If CONFIRMED, then confirm the mapped acceptance-criteria test is present in the files at that tip `
      + `(read-only git / Read in ${refineryPath}), not merely inferred from the gate output text; record a `
      + `HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE CONFIRMED INTEGRATION TIP.\n`
      + `If you CANNOT confirm (the printed sha differs from the gate-HEAD sha or the command cannot run), record a SOFT note, `
      + `never a HARD finding (the stale-tip defusing rule). The SOFT note MUST state: the observed HEAD sha `
      + `(or "rev-parse failed"), the expected gate-HEAD sha ${gateHeadSha}, and the reason — "gate-audit `
      + `worktree not at the integration tip — execution evidence unreliable, downgraded to SOFT, not a land-halt".\n`
      + `Return your reviewed audit_sha so the Lead can compare it to the gate-HEAD sha.\n`
      + `Review the executed gate output below and the task's mapped acceptance criteria to confirm the mapped tests actually ran and passed.\n`
      + debtLine
      + `Acceptance criteria / plan slice: ${acceptanceCriteria || '(see plan file)'}\n`
      + `Executed gate output:\n${gateOutput || '(no gate output recorded)'}\n`
      + endStateBlock + intentClause
      + `\nDefault: SOFT. Hard only when provably unrun.`,
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
} else if (endStateClaims.length > 0) {
  // Roster-D7 preserved (Open decision 2): nothing to gate-audit per task, but this phase CLAIMS
  // End-state conditions — spawn ONE End-state-only seat at the confirmed tip, so a docs-only
  // phase cannot skip its own claimed conditions. The per-task pass's cost saving stands.
  log(`gate-audit: mergedTasksForGateAudit is empty but this phase claims ${endStateClaims.length} End-state condition(s) — spawning ONE End-state-only seat at the confirmed tip (D7 cost saving preserved for the per-task pass).`)
  const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
  const esVerdict = await agent(
    `END-STATE-ONLY GATE-AUDIT for WAR phase ${ph.id} (lens: execution-evidence). `
    + `You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
    + `${refineryPath} (the _refinery worktree).\n`
    + `Confirm the tip first: run \`git -C ${refineryPath} rev-parse HEAD\` (read-only git, permitted) and report it as your audit_sha. `
    + `If the command cannot run, every condition below is unverifiable — SOFT notes only, never a hold.\n`
    + endStateBlock + intentClause,
    { agentType: NS + 'war-auditor', phase: 'Audit',
      label: `gate-audit:phase-${ph.id}:end-state`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  if (esVerdict) {
    const findings = esVerdict.findings || []
    const isHard = findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
    auditLog.push({ task: `phase-${ph.id}-end-state`, verdict: `gate-audit:${esVerdict.verdict}`, findings, gateEvidence: true, hard: isHard, auditSha: esVerdict.audit_sha })
    if (isHard) escalated.push({ task: `phase-${ph.id}-end-state`, reason: 'gate-evidence', detail: esVerdict })
  }
}

// ---- POST-LOOP SWEEP: any task still not in done[] has unresolvable deps (ghost dep) ----
// 'unrunnable-deps' is produced only here (the scheduler's post-loop ghost-dep sweep) but is a hard
// hold, so it is ALSO in land-decision.mjs's canonical HARD_ESCALATION_REASONS — the two mirrors are
// identical (L1: the former intentional divergence is removed).
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
// landDecision mirrors land-decision.mjs — the Workflow sandbox can't import. Keep in sync. The Workflow
// emits a SUPERSET of decideLand's 3 outputs (6 emitted: those 3 + held:submodule-pr, held:land-failed,
// and the catch block's held:workflow-error); all 6 ⊆ the KNOWN_LAND_DECISIONS export.
// HARD_ESCALATION_REASONS mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
let landResult = null
const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged']
const hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
let landDecision = (landed.length && !hardEscalation) ? 'landed'
  : hardEscalation ? 'held:escalation'
  : 'held:nothing-merged'
const refineryLandPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`

// ---- PHASE-CLOSE COHERENCE SWEEP (ADR 0012) — after the land decision is computed, before the ----
// ---- land dispatch. Fail-open: the sweep may only improve the tip — a re-approved polish merges ----
// at the serial queue's tail and the single land below proceeds on the polished tip; anything else
// DISCARDS and the pre-polish tip lands exactly as it would have (a discarded sweep recomputes
// NOTHING). Gated on a would-land phase with a non-empty phaseCloseQueue. NO owned-refs
// registration (Open decision 4) — bookkeeping is a Lead-side ledger entry + the handoff block.
let polishStatus = 'skipped'
if (phaseCloseQueue.length > 0 && landDecision !== 'landed') {
  // Demotion arm (ADR 0013): a held phase never dispatches the sweep — drain the queue.
  log(`phase-close sweep: the phase is ${landDecision} — the sweep never dispatches; draining ${phaseCloseQueue.length} queued finding(s) to follow-up.`)
  for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'held phase — the phase-close sweep never dispatched')
} else if (phaseCloseQueue.length > 0) {
  const rvSweep = validateRoster(defaultRoster)
  if (!rvSweep.valid) {
    // Fail-open, never a hold: without a valid config default audit.roster the mandatory full-panel
    // re-audit cannot convene (the Lead may NOT downgrade it — Open decision 1). Skip + drain.
    log(`phase-close sweep: the config default audit.roster is unusable (${rvSweep.errors.join('; ')}) — sweep skipped; draining the queue to follow-up.`)
    for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'sweep skipped — no valid default audit.roster for the mandatory full-panel re-audit')
  } else {
    const polishBranch = `war/${planSlug || '<plan-slug>'}/p${ph.id}-polish`
    // Phase-scoped polish worktree path (D): p<ph.id>-polish mirrors the taskWorktree shape (was the
    // run-scoped `_polish`); the polish branch already carried the p<N>- shape.
    const polishWorktree = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/p${ph.id}-polish`
    // Pseudo-task (Open decision 1): sweep roster = the config default audit.roster, normalized like
    // any task roster; issue = the phase epic; planSlice = the sweep charter.
    const polishTask = { id: `p${ph.id}-polish`, issue: ph.epicIssue || `<phase-${ph.id}-epic>`,
      title: `phase-close coherence sweep (phase ${ph.id})`, branch: polishBranch, worktree: polishWorktree,
      roster: defaultRoster,
      planSlice: `drain the phase-close queue (${phaseCloseQueue.length} finding(s)) + cross-task coherence at the integrated tip of ${ph.integrationBranch}` }
    // 1. Provision the polish worktree at the POST-MERGE integrated tip via the existing ensure-worktree.
    // provision mode (agents/war-refiner.md ## provision): phase-close polish worktree — env-outcome return.
    const polishProv = await agent(
      `Provision the phase-close POLISH worktree for WAR phase ${ph.id} by running provision-worktrees.sh. Do NOT free-author git; run exactly:\n`
      + `  provision-worktrees.sh ensure-worktree ${polishWorktree} ${polishBranch} "$(git -C ${refineryLandPath} rev-parse ${ph.integrationBranch})"\n`
      + `— the polish worktree is cut at the POST-MERGE integrated tip (idempotent; reuse if present). Return the env-outcome JSON: \`{ ok: true }\` when the ensure-worktree subcommand exits 0; on a non-zero exit return \`{ ok: false, failedCommand: "<the exact subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr>" }\`.`,
      { agentType: NS + 'war-refiner', phase: 'Refine', label: `polish-worktree:phase-${ph.id}`, schema: ENV_OUTCOME, ...spawn('refiner') })
    if (!polishProv || polishProv.ok !== true) {
      // Fail-open, never a hold (B/C): the polish worktree provisioning failed — skip the sweep
      // worker/panel/merge entirely and drain the queue to follow-up, exactly mirroring the
      // invalid-roster arm above. polishStatus stays 'skipped'; the pre-polish tip lands unchanged.
      log(`phase-close sweep: the polish worktree provisioning returned no env-outcome ok (${(polishProv && polishProv.stderrTail) || 'no result'}) — sweep skipped; draining the queue to follow-up.`)
      for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'sweep skipped — the polish worktree provisioning did not return { ok: true }')
    } else {
    // 2. ONE war-worker dispatch: the queued findings VERBATIM + the intent + the merged tasks' plan slices.
    const mergedSlices = tasks.filter(t => succeeded.has(t.id)).map(t => `- ${t.id}: ${t.planSlice}`).join('\n')
    const sweep = await agent(
      `PHASE-CLOSE COHERENCE SWEEP for WAR phase ${ph.id} "${ph.title}". Work in the ALREADY-PROVISIONED polish worktree at ${polishWorktree} (branch ${polishBranch}, cut at the post-merge integrated tip of ${ph.integrationBranch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
      + intentClause
      + `Fix ONLY the queued findings below — NO ad-hoc seam hunting (the bounded, enumerated scope is what makes discard-on-reject a sufficient guard), NEVER touch version/release-slot literals, make EXACTLY ONE commit whose message cites each finding's title, keep the gate (${plan.gate}) green, and push ${polishBranch}.\n`
      + `Queued findings (verbatim):\n`
      + phaseCloseQueue.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (task ${f.task}${f.file ? `, ${f.file}` : ''}${f.line ? ':' + f.line : ''}) — ${f.rationale || ''}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n') + `\n`
      + `Merged tasks' plan slices (context for cross-task coherence at the integrated tip):\n${mergedSlices || '(none)'}`
      + provisionClause,
      { agentType: NS + 'war-worker', phase: 'Work', label: `polish:phase-${ph.id}`, schema: WORKER_RESULT, ...spawn('worker') })
    // 3. Full auditRound panel re-audit at the polish SHA — same unanimity rules as any task.
    const sweepWhy = blockedReason(sweep)
    let sweepApproved = false
    if (!sweepWhy) {
      const { seats: pSeats, expected: pExpected } = await auditRound(polishTask, null, sweep && sweep.tests ? sweep.tests : null)
      sweepApproved = allApprove(pSeats, pExpected) && blockingOf(pSeats).length === 0
      auditLog.push({ task: polishTask.id, verdict: sweepApproved ? 'approve' : 'polish-rejected', findings: pSeats.flatMap(s => s.findings || []), requested: pExpected, returned: pSeats.length })
    }
    // 4. Re-approved → the refiner merges the polish branch at the serial merge queue's tail; the
    //    single land below then proceeds on the polished tip. Anything else → DISCARD (fail-open).
    let pmr = null
    if (sweepApproved) {
      // The polish-sweep merge is CLASS-EXEMPT by design (spec §6 / ADR 0019): a polish gate failure
      // fail-open DISCARDS (the pre-polish tip lands unchanged — see the discard arm below), so no
      // gate-failure classification is dispatched here. The idempotent _refinery re-attach IS still
      // included (hygiene — heals a prior dispatch that died mid-classification detached).
      pmr = await agent(
        `Merge WAR polish branch ${polishBranch} into ${ph.integrationBranch} at the serial merge queue's tail. mode=merge-task.\n`
        + reattachClause(refineryLandPath)
        + `  (a) REBASE in the POLISH worktree: git -C ${polishWorktree} rebase ${ph.integrationBranch} (the branch was cut at the integrated tip, so this is normally a no-op).\n`
        + `  (b) MERGE in _refinery: cd ${refineryLandPath} (on ${ph.integrationBranch}), then git merge ${polishBranch} (fast-forward merge). Push.\n`
        + `Run the gate (${plan.gate}) after the rebase in the polish worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)). The polish commit is a coherence sweep, not a mapped-test task — skip assert-test-in-diff.sh AND skip the packaging floor assert-packaging-in-diff.sh (a coherence sweep has no task fields to consult). This sweep is class-exempt — on gate failure return gate_failed (no classification); the Workflow fail-open DISCARDS. On conflict return conflict; never force.`,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:p${ph.id}-polish`, schema: MERGE_RESULT, ...spawn('refiner') })
    }
    if (sweepApproved && pmr && pmr.status === 'merged') {
      polishStatus = 'merged'
      const polishSha = (typeof sweep.head_sha === 'string' && sweep.head_sha) ? sweep.head_sha : '(polish sha unrecorded)'
      log(`phase-close sweep MERGED at ${polishSha} — the land proceeds on the polished tip; ${phaseCloseQueue.length} queued finding(s) absorbed.`)
      for (const f of phaseCloseQueue.splice(0)) aced.push({ task: f.task, finding: f, sha: polishSha })
    } else {
      // DISCARD: the polish branch + _polish worktree are LEFT IN PLACE (never-lose-unmerged-commits;
      // reaping is a human act). The queue demotes to follow-up; the pre-polish tip lands exactly as
      // it would have — a discarded sweep recomputes NOTHING (no re-gate, no land-decision change).
      polishStatus = 'discarded'
      log(`phase-close sweep DISCARDED (${sweepWhy || (sweepApproved ? `polish merge returned ${pmr && pmr.status || 'no result'}` : 'the panel did not re-approve')}) — polish branch ${polishBranch} and worktree ${polishWorktree} left in place; queue demotes to follow-up.`)
      auditLog.push({ task: polishTask.id, verdict: 'polish-discarded', branch: polishBranch, findings: [], blocked: sweepWhy || null })
      for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'phase-close sweep discarded — the polish branch never merged; the pre-polish tip lands')
    }
    }
  }
}

if (landDecision === 'landed') {
  // For a submodule phase: thread targetRepo + targetBase so the refiner knows to perform a
  // submodule-aware land (2A CAS inside the submodule repo, or 2B PR-and-hold on the submodule remote).
  const submodLandTask = tasks.find(t => t.taskType === 'submodule')
  const submodLandNote = submodLandTask && submodLandTask.targetRepo
    ? `\nSUBMODULE PHASE: this phase includes a submodule task. Target repo: ${submodLandTask.targetRepo}. `
      + `Submodule base: ${submodLandTask.targetBase || '<targetBase>'}. `
      + `For the submodule land: attempt 2A — push-first CAS land-advance INSIDE ${submodLandTask.targetRepo} against ${submodLandTask.targetBase || '<targetBase>'}. `
      + `If the submodule is not WAR-owned or 2A is unavailable, open a PR on the submodule remote and return { mode: "land-phase", status: "submodule-pr", pr_number: <n>, pr_remote: "<remote>" } (2B PR-and-hold).`
    : ''
  landResult = await agent(
    `Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + `Perform the land entirely inside the _refinery worktree at ${refineryLandPath} (spec §5.3, push-first CAS):\n`
    + reattachClause(refineryLandPath)
    + `  1. In ${refineryLandPath}: detach HEAD at origin/${ph.workingBranch} (`
    + `\`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`). `
    + `This is the detached land — never checkout the working branch by name in _refinery.\n`
    + `  2. Merge: \`git -C ${refineryLandPath} merge --no-ff ${ph.integrationBranch}\` (one phase commit). Run the gate (${plan.gate}) with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed.\n`
    + classificationClause(refineryLandPath, `the detached origin/${ph.workingBranch} tip the merge lands onto (\`git -C ${refineryLandPath} rev-parse origin/${ph.workingBranch}\`) — a stacked working branch carries prior plans' content the phase integration base lacks, so the land uses the working tip, NOT the integration base`)
    + baselineDebtClause()
    + `  3. Push-first CAS: run \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\` where <merge-sha> is HEAD in _refinery after the merge.\n`
    + `     - On clean push success (exit 0 from land-advance): the land succeeded. Return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }.\n`
    + `     - On reland exit code (rejected push — origin/${ph.workingBranch} moved): re-fetch origin/${ph.workingBranch}, re-merge, re-run gate, retry land-advance. `
    + `Repeat up to roundLimit (${roundLimit}) times total. If the reland loop exhausts roundLimit attempts, return { mode: 'land-phase', status: 'land_stale' } — `
    + `this is a topology exhaustion (CAS failure), NOT a content conflict.\n`
    + `     - On escalate exit code from land-advance (any non-rejection push error): return { mode: 'land-phase', status: 'error' }.\n`
    + `Never use --force push. Never merge or push from the Lead's main checkout.`
    + submodLandNote,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
  // 2B submodule PR-and-hold: the refiner opened a PR on the submodule remote and returned
  // status:'submodule-pr'. Return held:submodule-pr DIRECTLY — like held:workflow-error, this
  // bypasses decideLand/HARD_ESCALATION_REASONS. The PR ref is captured for the Lead's gh-resume.
  // ponytail: direct return pattern mirrors held:workflow-error (DP2 — no HARD_ESCALATION_REASONS cascade)
  if (landResult && landResult.status === 'submodule-pr') {
    escalated.push({ task: `phase-${ph.id}-land`, reason: 'submodule-pr', pr_number: landResult.pr_number, pr_remote: landResult.pr_remote, detail: landResult })
    landDecision = 'held:submodule-pr'
  } else
  // If the land agent returns land_stale (CAS-exhaustion), treat it as a hard escalation.
  // #236: 'no-test' is structurally UNREACHABLE here — no land-phase prompt emits it (land statuses
  // are only landed/land_stale/gate_failed/error/submodule-pr, and submodule-pr is short-circuited by
  // its own direct-return guard above this check). The array is REUSED from the merge-task escalation
  // path where 'no-test' IS load-bearing, so it is kept intact, not narrowed (the drift-guard in
  // war-config.test.mjs pins the inline array to the canonical export incl. 'no-test').
  if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
    landDecision = 'held:escalation'
  } else if (landResult && landResult.status === 'gate_failed' && classOf(landResult) === 'environment') {
    // 'environment' land gate failure (spec §6 / ADR 0019): the land failed environmentally, not by a
    // code defect. Soft-escalate reusing reason 'env-blocked'; the Lead re-runs the land (an
    // environmental failure passes on retry — held:land-failed). No enum change; detail = the MergeResult.
    escalated.push({ task: `phase-${ph.id}-land`, reason: 'env-blocked', detail: landResult })
    landDecision = 'held:land-failed'
  } else if (landResult && landResult.status === 'gate_failed' && classOf(landResult) === 'baseline') {
    // 'baseline' land gate failure: record the debt (deduped) + ONE source:'auto' backstop, then
    // dispatch ONE baseline-proceed re-land naming the classified ids. Route its result normally (a 2nd
    // gate_failed routes by class with 'baseline' treated as 'introduced' — bounded, no 2nd re-dispatch).
    recordBaselineDebt(landResult.gate_failing_ids, landResult.gate_base_sha)
    const reLand = await agent(
      `BASELINE-PROCEED re-land for WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff. mode=land-phase.\n`
      + reattachClause(refineryLandPath)
      + `The prior land gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the detached origin/${ph.workingBranch} tip, NOT introduced by this phase: ${(landResult.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
      + `  1. Detach at origin/${ph.workingBranch}: \`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`.\n`
      + `  2. Merge --no-ff ${ph.integrationBranch}; run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that set is a real regression → return { mode: 'land-phase', status: 'gate_failed' } classifying the NEW failure.\n`
      + `  3. Push-first CAS: \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\`. Reland up to roundLimit (${roundLimit}); land_stale on exhaustion; error on a non-rejection push error. On success return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }. Never --force.`,
      { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}:baseline-proceed`, schema: MERGE_RESULT, ...spawn('refiner') })
    if (reLand && reLand.status === 'landed') {
      landResult = reLand
      landDecision = 'landed'
      log(`Phase ${ph.id} landed via baseline-proceed re-land (proceeded over recorded baseline gate debt; the deduped source:'auto' backstop rides handoff.backstops + the final PR). Opportunistic resync as on any landed phase.`)
    } else if (reLand && HARD_ESCALATION_REASONS.includes(reLand.status)) {
      escalated.push({ task: `phase-${ph.id}-land`, reason: reLand.status, detail: reLand })
      landDecision = 'held:escalation'
    } else if (reLand && reLand.status === 'gate_failed' && classOf(reLand) === 'environment') {
      escalated.push({ task: `phase-${ph.id}-land`, reason: 'env-blocked', detail: reLand })
      landDecision = 'held:land-failed'
    } else {
      // introduced OR baseline→introduced (bounded) OR error → held:land-failed (Lead re-runs).
      escalated.push({ task: `phase-${ph.id}-land`, reason: reLand ? reLand.status : 'error', detail: reLand })
      landDecision = 'held:land-failed'
    }
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

// ---- WRAP-UP — capture durable learnings (war-servitor, write-scoped to the local memory root) ----
// Gate (spec §4, decision B): dispatch only when the phase landed AND memoryLocalRoot was threaded. An
// absent memoryLocalRoot (Setup's memory probe reported memory disabled / a legacy args shape) self-skips
// with a logged line — fail-open, never a crash, never a dispatch at an unanchored target. learningsTarget
// is deliberately NOT in this condition anymore: it is the read-path repo root, not a servitor write path.
let servitorResult = null
if (landResult && landResult.status === 'landed' && memoryLocalRoot) {
  servitorResult = await agent(
    `Wrap up learnings for WAR phase ${ph.id} "${ph.title}" (landed on ${ph.workingBranch}).\n`
    + `Your ONLY writable path (your capability allowlist holds no Bash — Write/Edit only — and the PreToolUse scope hook gates those by agent_type to the local memory root): ${memoryLocalRoot}.\n`
    + `Every lesson file — regardless of metadata.type — is written under that local root. type: project marks a lesson PROMOTABLE (the Lead's Gate 2 promotes it into the repo root); NEVER write into any docs/learnings/ directory yourself — repo-root publication is the Lead's job, not yours.\n`
    + `Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + `Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + `Escalations: ${JSON.stringify(escalated)}\n`
    + `Noted findings (disposition 'note' — MEMORY CANDIDATES, not issues; weigh each against the admission checklist below): ${JSON.stringify(notes)}\n`
    + intentClause + servitorMemClause()
    + `Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.\n`
    + `\n`
    + `Memory admission checklist — follow ALL three disciplines before every write:\n`
    + `D1 DEDUP BEFORE WRITE: Glob the memory dir and read MEMORY.md. Read related candidate files. If an existing covering file exists, update that file in place — do not duplicate — BUT only when it bears a nested metadata.provenance value; a covering file WITHOUT one is user-authored, never edit it — write a new file and [[slug]]-cross-link it. Create a new file only when no existing file covers the fact. RECURRENCE ON A REPO LESSON: when the covering lesson lives in the repo root (docs/learnings/), write the updated FULL COPY into your local root under the SAME slug with type: project (a prior promotion's metadata.promoted-stamped local copy, when present, is the canonical recurrence-edit target and is provenance-tagged so the mutation guard allows the edit); the Lead's Gate-2 promotion then OVERWRITES the same-slug repo file (overwrite-on-promote is the ratified update mechanism). Cross-link related facts with [[slug]] references.\n`
    + `D2 TIER PRECEDENCE: A higher tier supersedes a lower; a user-confirmed fact outranks any agent write; never overwrite a higher-tier fact with a lower-tier one. A contradicting fact supersedes an existing memory only if it is at the same or higher tier — update or replace the stale file and note the supersession inline with the tier that wins. Only a provenance-tagged file is supersession-editable; to contradict an UNTAGGED (user-authored) file, write a NEW file carrying the supersession note inline and leave the old file untouched.\n`
    + `D3 VERIFY-ON-WRITE: Before recording any fact that names a file, flag, function, or symbol: use Read/Grep to confirm the referent currently exists. Referent found → tag metadata.provenance: code-verified and include the cue "verify still present before acting — found at <path> @ phase X". Referent absent → keep metadata.provenance: agent-unverified and add an absence-note: "referent not found @ phase X — verify before acting". Do not write snapshot facts that will rot silently.\n`
    + `\n`
    + `Provenance tagging — tag EVERY memory file you write with metadata.provenance (nested under metadata:, next to type:). Use only the three canonical tiers: agent-unverified (default — the input is LLM-authored audit monologue), code-verified (D3 referent confirmed via Read/Grep), user-confirmed (operator/user explicitly confirmed). Retire legacy agent-observed: treat it as agent-unverified and never emit it going forward.\n`
    + `\n`
    + `RETURN: every path in your ServitorResult files_written MUST be an ABSOLUTE path under ${memoryLocalRoot} (the Lead's Gate-2 reconciliation is an absolute-prefix check; a relative or out-of-root path fails the phase loud).`,
    { agentType: NS + 'war-servitor', phase: 'Wrap-up', label: `wrap-up:phase-${ph.id}`, schema: SERVITOR_RESULT, ...spawn('servitor') })
} else if (landResult && landResult.status === 'landed' && !memoryLocalRoot) {
  log(`Phase ${ph.id} landed but no memoryLocalRoot was threaded (memory disabled / legacy args) — Wrap-up skipped; no servitor dispatched.`)
}

// ---- HANDOFF BLOCK (ADR 0013) — the machine-readable debt map the next phase's decompose reads.
// Emitted on 'landed' AND 'held:escalation' (degraded — an escalated phase still hands off; the next
// decompose needs the debt map most exactly then). OMITTED on 'held:workflow-error' (infra death —
// the ledger + issues are the record; there is no trustworthy return to render) and on the other
// holds (nothing landed to hand off).
let handoff = null
if (landDecision === 'landed' || landDecision === 'held:escalation') {
  // tipSha: the landed working sha; degraded → the last confirmed merge tip; else null.
  const lastPinned = [...mergedTasksForGateAudit].reverse().find(m => /^[0-9a-f]{7,40}$/.test(m.gateHeadSha || ''))
  const tipSha = (landResult && landResult.status === 'landed' && typeof landResult.working_sha === 'string' && landResult.working_sha)
    ? landResult.working_sha
    : (lastPinned ? lastPinned.gateHeadSha : null)
  // absorbed: aced provenance grouped by commit sha → [{ sha, findings: [title] }].
  const bySha = {}
  for (const a of aced) (bySha[a.sha] = bySha[a.sha] || []).push(a.finding && a.finding.title)
  // endState: statuses keyed on the gate-audit seats' plan_ref (VERBATIM condition text). No
  // gate-audit ran ⇒ nothing verified ⇒ every claim is 'deferred', never a silent 'met'.
  const gateFindings = auditLog.filter(e => e && e.gateEvidence).flatMap(e => e.findings || [])
  const gateAuditRan = auditLog.some(e => e && e.gateEvidence)
  // Binding is whitespace/case-insensitive (#452): seats are told VERBATIM, but a plan_ref that
  // drifts only in whitespace/case must still bind its condition — never a silent 'met'.
  const normRef = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase()
  handoff = {
    tipSha,
    polish: polishStatus,
    absorbed: Object.entries(bySha).map(([sha, findings]) => ({ sha, findings })),
    followUps: minorsFiled.map(m => ({ issue: m.issue ?? null, reason: [m.title, m.rationale].filter(Boolean).join(' — ') || '(untitled finding)' })),
    notes: notes.map(n => ({ task: n.task, title: n.title })),
    endState: endStateClaims.map(condition => {
      if (!gateAuditRan) return { condition, status: 'deferred' }
      const rel = gateFindings.filter(f => f && normRef(f.plan_ref) === normRef(condition))
      const status = rel.some(f => f.severity === 'Critical' || f.severity === 'Major') ? 'unmet'
        : rel.some(f => /out-of-scope/i.test(`${f.title || ''} ${f.rationale || ''}`)) ? 'out-of-scope'
        : rel.length ? 'deferred'
        : 'met'
      return { condition, status }
    }),
    // backstops (spec §4.4 + §6): the Lead-normalized args.backstops entries pass through UNTOUCHED;
    // the SOLE Workflow exception is the source:'auto' baseline-gate-debt entries this phase appended
    // (ADR 0019). null promotes to a one-entry array when a baseline debt was recorded against a legacy
    // no-backstop plan; with no auto entries, mergedBackstops IS the original args.backstops (untouched).
    backstops: autoBaselineBackstops.length
      ? [...(Array.isArray(backstops) ? backstops : []), ...autoBaselineBackstops]
      : backstops,
    intentPresent: intent !== null,
  }
}

return { phase: ph.id, landed, escalated, minorsFiled, aced, notes, landResult, servitorResult, auditLog, landDecision, ...(handoff ? { handoff } : {}) }
} catch (err) {
  // A dead phase that self-reports. landed/escalated are whatever accumulated before the throw;
  // teardown is NOT run (git state kept for resume/inspection). NO handoff block here (ADR 0013):
  // infra death has no trustworthy return to render — the ledger + issues are the record.
  return { phase: ph.id, landed, escalated, minorsFiled, aced, notes, landResult: null,
           servitorResult: null, auditLog,
           landDecision: 'held:workflow-error',
           workflowError: { message: String(err && err.message || err), stack: err && err.stack } }
}
