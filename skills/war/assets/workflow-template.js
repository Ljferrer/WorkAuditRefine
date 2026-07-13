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
//                roster:[{ lens, depth? }], planSlice, files:[<repo-relative plan paths>], requiresTest?, requiresPackaging? } ],  // roster: 1–5 distinct-lens audit seats; depth omitted → 'deep'.
//                                     // requiresTest/requiresPackaging default true; false (Lead-set) skips that pre-merge floor with a logged, never-silent skip.
//                                     // files = the plan's `Files:` list (plan paths, NOT the worker's diff — the diff doesn't exist at dispatch); an all-*.md task runs its first-pass worker on the docs tier. Absent/empty ⇒ base worker tier (fail-safe).
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
//     agents: { worker|auditor|refiner|servitor: { model, effort } },  // from .claude/war/config.json (resolved by the Lead); defaults below.
//                                     // worker may also carry { docs?, fix? } { model, effort } sub-tiers: docs = the all-*.md first-pass tier (sonnet default), fix = the fix-round + --ace tier (absent ⇒ inherit worker).
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
  // gate_log_path (D5): the ABSOLUTE path of the .war/gate-<taskId>.log artifact the merge-task tees
  // the full step-2 gate stdout+stderr to. Optional (fail-open — absent ⇒ the gate-audit seat's HARD
  // provably-unrun determination has no captured file ⇒ SOFT cannot-confirm, never a hold). The captured
  // artifact — NOT the possibly-curated inline gate_output — is the authoritative HARD-path evidence.
  gate_log_path: { type: 'string' },
  pr_number: { type: 'number' }, pr_remote: { type: 'string' } } }

// EVIDENCE_RESULT (D1/D4/D6): the shape of the ONE consolidated post-merge refiner "evidence dispatch"
// (label evidence:phase-<id>). perTask stamps the gate-pin-status.sh proof (pin_status + observedHead =
// the _refinery tip the proof was computed against — the gate-audit seat's pin-equality expectation) and
// the assert-guard-specificity-in-diff.sh advisory-evidence token per merged task. integratedTipGate is
// populated ONLY on an intra-phase-dep phase (a re-run of plan.gate at the final integration tip — the
// land-authoritative execution evidence feeding the D4 authoritative seat). ALL fields optional: a
// failed/absent dispatch ⇒ no tokens ⇒ seats keep today's SOFT cannot-confirm path (fail-open, never a hold).
const EVIDENCE_RESULT = { type: 'object', properties: {
  perTask: { type: 'array', items: { type: 'object', properties: {
    taskId: { type: 'string' },
    pin_status: { enum: ['CONFIRMED', 'BENIGN-ADVANCE', 'STALE-MISMATCH', 'ERROR'] },
    pin_evidence: { type: 'string' }, observedHead: { type: 'string' },
    guard_specificity: { enum: ['covered', 'uncovered', 'ERROR'] }, guard_evidence: { type: 'string' } } } },
  integratedTipGate: { type: 'object', properties: { gate_output: { type: 'string' }, tip_sha: { type: 'string' } } } } }

// memory_index_updated retired (spec §4.6, D4 deleted): the servitor no longer maintains the index —
// the Lead runs `render-index` post-servitor (Gate 2). The servitor only writes/updates lesson files.
const SERVITOR_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } } } }

// Per-task provision-run result (Part B). The refiner runs the pinned run.provision list inside the
// task worktree: ok:true when every step exits 0; otherwise the env-blocked task-outcome shape from
// ../references/schemas.md ({ taskId, failedCommand, exitCode, stderrTail, provisionSource }) for the
// FIRST failing step. NOT a WorkerResult — no worker ran. The barrier skips the worker on ok:false.
// The provision-BARRIER return (dispatchKind 'provision-barrier') additionally carries two OPTIONAL
// arrays (recovery mechanics, spec §4.2/§4.4): preMerged — task ids whose local branch is an ancestor
// of the frozen integration tip (already-integrated on an adopted branch; the derive-and-skip step,
// armed only under args.recovery.sanctioned); staleRemote — per-task stale-remote classifications
// ({ task, remoteSha, frozenTip }) captured from an ensure-worktree exit carrying the STALE_REMOTE
// marker (always-on classification, never recovery-gated). Both absent on a plain non-recovery barrier.
const ENV_OUTCOME = { type: 'object', required: ['ok'], properties: {
  ok: { type: 'boolean' },
  taskId: { type: 'string' }, failedCommand: { type: 'string' }, exitCode: { type: 'number' },
  stderrTail: { type: 'string' }, provisionSource: { type: 'string' },
  preMerged: { type: 'array' }, staleRemote: { type: 'array' } } }

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

// pt — tagged prompt template (ADR 0034, Option B — operator-ratified 2026-07-10). Checks each
// interpolated VALUE for identity === undefined at prompt-BUILD time (before spawn) and throws naming
// the adjacent literal fragment — generalizing the #586 derivation-path fix to EVERY interpolated field
// (a missing required prompt input dies before an agent is spawned, never renders a raw "undefined").
// ZERO false positives by construction: only VALUES are checked, never the surrounding prose — a DEFINED
// string whose text contains the word "undefined" (a finding title, a quoted code snippet, a test name)
// can never trip it. Optional interpolated fields must carry an explicit `?? '<unset>'` default so a
// legitimately-absent field renders a placeholder instead of throwing. Every prompt-rendering template
// literal (spawn-site + prompt-builder helper) is `pt`-tagged. Output is byte-identical to the untagged
// template literal (same ToString coercion), so the both-surfaces byte-compare guards are unaffected.
const pt = (strings, ...vals) => {
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === undefined) throw new Error(`workflow-template prompt: undefined interpolation after "…${strings[i].slice(-40)}" — a required prompt input is missing`)
  }
  return strings.reduce((out, s, i) => out + s + (i < vals.length ? vals[i] : ''), '')
}

// phaseId hoisted above try{} (like the accumulators): the catch dereferences it to render the
// held:workflow-error phase field even when a scalar/malformed arg throws before ph is assigned.
let phaseId = null

try {

const A = typeof args === 'string' ? JSON.parse(args) : (args || {})
// Non-null-object args guard (ADR 0034, hand-mirrored in skills/red-team/assets/workflow-scaffold.js —
// the Workflow sandbox cannot import; a both-sites drift test pins both). A scalar/array parse result
// ('null'/'true'/'5', arrays) is not a usable args object: THROW a named error routing to the existing
// held:workflow-error via the catch (never a new enum member — ADR 0005), so a malformed args value
// lands in the same clean class instead of a raw destructure TypeError. (Only 'null' actually crashed
// the destructure pre-guard; 'true'/'5' destructured to all-undefined — the guard makes all three uniform.)
if (typeof A !== 'object' || A === null || Array.isArray(A)) {
  throw new Error(`workflow-template: args must be a JSON object, got ${A === null ? 'null' : Array.isArray(A) ? 'array' : typeof A}`)
}
const { phase: ph, plan, tasks, learningsTarget, agents = {}, audit = {}, run = {} } = A
// Hoisted phaseId (declared above try) assigned now that ph exists: BOTH return sites render
// `phase: phaseId`, so the catch renders a clean phase:null on a scalar/malformed arg that throws
// before ph is assigned — never a secondary TypeError dereferencing an unassigned ph.
phaseId = ph?.id ?? null
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
// Partial-phase recovery (spec §4.2/§4.4): a Lead-supplied top-level arg armed ONLY on a sanctioned
// recovery relaunch (SKILL.md runbook). Shape { sanctioned: true, reclaimStaleRemote?: boolean }.
// Absent / non-sanctioned ⇒ the barrier's derive-and-skip step and the --reclaim-stale-remote
// pass-through are DORMANT and every dispatched prompt is byte-identical to a non-recovery run APART
// FROM the barrier prompt's always-on §4.4 stale-remote classification clause (default behavior, not
// recovery machinery). A resumeFromRunId replay / accidental same-named local branch never triggers
// derivation. Normalized to null unless sanctioned === true, so a malformed value is inert.
const recovery = (A.recovery && typeof A.recovery === 'object' && !Array.isArray(A.recovery) && A.recovery.sanctioned === true)
  ? { sanctioned: true, reclaimStaleRemote: A.recovery.reclaimStaleRemote === true }
  : null
const intentClause = intent
  ? pt`\nCOMMANDER'S INTENT (the operator's purpose — your ceiling; the plan slice is your floor):\n${intent}\n`
  : ''
// Red-team adjudications (Task 1.5, ADR 0032): the Lead reads the red-team report's `## Adjudications`
// block for this plan (docs/red-team/<plan-slug>.md) and threads its rows here as args.adjudications
// (array|null of { adjudicated, supersedes } objects or preformatted strings) — a Lead-read arg, like
// intent. FOLLOWS the intentClause threading pattern: empty/absent ⇒ adjudicationClause is '' ⇒ every
// auditPrompt below is byte-identical to a no-adjudication run (back-compat, spec constraint 4).
// Version precedence: task instruction > red-team adjudication > plan body literal. The clause sentence
// body is mirrored VERBATIM in agents/war-auditor.md (the both-surfaces drift test asserts both).
const adjudications = Array.isArray(A.adjudications)
  ? A.adjudications.filter(r => r && (typeof r === 'string' || typeof r === 'object')) : []
const adjRow = r => typeof r === 'string' ? r
  : `${r.adjudicated ?? r.value ?? ''}${r.supersedes ? ` (supersedes plan literal: ${r.supersedes})` : ''}`
const adjudicationClause = adjudications.length
  ? pt`\nVERSION-PRECEDENCE RULE: the authoritative version is task instruction > red-team adjudication > plan body literal. Before scoring a version/release-slot mismatch as a defect, consult the adjudicated rows below; a value matching the adjudication is correct even when it differs from the plan body literal.\n`
    + adjudications.map(r => `- ${adjRow(r)}`).join('\n') + '\n'
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
const memClause = block => (typeof block === 'string' && block) ? pt`\n${block}\n` : ''
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
// Worker sub-tier defaults, hand-mirrored from DEFAULTS.agents.worker (war-config.mjs) and bound to
// the canonical source by the D2 registry row in workflow-template.test.mjs. docs dispatches all-*.md
// tasks (sonnet by default); fix (the fix-round + --ace tier) has NO default block — absent ⇒ inherit
// the base worker — so it is not listed here (nothing to bind).
const WORKER_TIER_DEFAULTS = { docs: { model: 'sonnet', effort: 'default' } }
// spawnWorker(tier): worker spawn opts for a sub-tier ('docs'|'fix') — the configured agents.worker[tier]
// block when present, else WORKER_TIER_DEFAULTS[tier] (docs), else the base worker (fix absent ⇒ inherit;
// a null/absent tier ⇒ base). A partial tier block falls back to ITS tier's default model (docs⇒sonnet),
// matching war-config's fillDefaults deep-merge. Effort only when non-default (omit = inherit session).
const spawnWorker = tier => {
  if (!tier) return spawn('worker')
  const w = agents.worker || {}
  const dflt = WORKER_TIER_DEFAULTS[tier]
  const cfg = w[tier]
  const a = (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) ? cfg : (dflt || w)
  const model = a.model || (dflt && dflt.model) || ROLE_MODEL.worker
  return a.effort && a.effort !== 'default' ? { model, effort: a.effort } : { model }
}
// docs-tier predicate (plan 1.2): a task is docs-tier iff its plan Files: list (task.files — the plan
// file list, NOT the worker's reported diff) is non-empty and EVERY entry is a *.md path. Fail-safe:
// an absent OR empty files list ⇒ FALSE (base worker tier) — an undefined/empty list must never
// vacuously read as all-*.md and misclassify a non-doc task as docs.
const isDocsTask = t => Array.isArray(t.files) && t.files.length > 0 && t.files.every(f => typeof f === 'string' && f.endsWith('.md'))
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


// Entry validation (H, widened per operator decision 4 + #740). TWO problem classes feed ONE hoisted
// `problems` aggregation and a SINGLE throw here, at the top of the try{} body — before any pt-tagged
// interpolation and before git is touched — so a missing input dies at ENTRY with every absent key
// named (→ held:workflow-error via the catch, git untouched), not opaquely deep inside prompt
// construction (#586, #740).
//   (1) DERIVATION class — the missing-trio-keys list + a missing phase.id (the silent `pundefined-`
//       branch/worktree derivation class). Consumed ONLY when a task lacks an explicit branch/worktree,
//       so it is guarded by that `some(...)` check: zero tasks / all-explicit ⇒ this class vacuously
//       adds nothing (the vacuous-no-throw rule applies to THIS class only). The per-task derivation
//       throw below stays as the belt-and-suspenders backstop.
//   (2) PHASE-FIELD class — ph.title / ph.workingBranch / ph.integrationBranch, each interpolated
//       fallback-free through the `pt` tag in the Provision-barrier / depClause / merge / land /
//       classification / phase-close prompts REGARDLESS of whether tasks carry explicit paths. So this
//       class is UNCONDITIONAL — even a zero-task phase builds the Provision-barrier prompt from these
//       fields. Guarded access only (`ph` nullish ⇒ all three named); no earlier ph-field deref can
//       pre-empt this message (phaseId uses `ph?.id`, endStateClaims guards `ph && ph.endState`,
//       taskBranch/taskWorktree are lazy arrows evaluated after validation).
// The `(or supply explicit branch/worktree per task)` suffix is appended ONLY when a derivation-class
// problem fired — it is a lie for the phase-field class (an explicit branch/worktree cannot supply a
// missing ph.title).
const problems = []
let derivationProblem = false
if ((tasks || []).some(t => !t.branch || !t.worktree)) {
  const missingTrio = [['planSlug', planSlug], ['runId', runId], ['worktreeRoot', worktreeRoot]]
    .filter(([, v]) => !v).map(([k]) => k)
  const phaseIdMissing = ph == null || ph.id === undefined || ph.id === null || ph.id === ''
  if (missingTrio.length) { problems.push(`workflow-template: requires top-level { planSlug, runId, worktreeRoot } — missing: [${missingTrio.join(', ')}]`); derivationProblem = true }
  if (phaseIdMissing) { problems.push(`phase.id is missing (derivation would produce 'pundefined-' branch/worktree names)`); derivationProblem = true }
}
const missingPhaseFields = [['title', ph == null ? undefined : ph.title], ['workingBranch', ph == null ? undefined : ph.workingBranch], ['integrationBranch', ph == null ? undefined : ph.integrationBranch]]
  .filter(([, v]) => v == null || v === '').map(([k]) => k)
if (missingPhaseFields.length) problems.push(`workflow-template: requires phase { title, workingBranch, integrationBranch } — missing: [${missingPhaseFields.join(', ')}]`)
if (problems.length) throw new Error(`${problems.join('; ')}${derivationProblem ? ' (or supply explicit branch/worktree per task)' : ''}`)

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
  // dispatchKind: 'provision-run' (stable discriminator — mocks/handlers/audits key on it, not the label prefix).
  const out = await agent(
    pt`PROVISION the worktree for WAR task ${task.id} before its worker runs. cd into ${task.worktree} `
    + pt`(the refiner's Provision barrier already created it) and run these provisioning commands IN ORDER, `
    + pt`inside that worktree:\n`
    + provisionList.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + pt`\n`
    + pt`These steps make the worktree gate-ready (derived from the repo's own setup; source: ${provisionSource}). `
    + pt`Run them verbatim; do NOT free-author other commands. If EVERY step exits 0, return { ok: true }. `
    + pt`If a step exits NON-ZERO, STOP at that first failure and return the env-blocked outcome — `
    + pt`{ ok: false, taskId: "${task.id}", failedCommand: "<the command>", exitCode: <code>, stderrTail: "<tail of its stderr>", provisionSource: "${provisionSource}" } — `
    + pt`where failedCommand is the failing step VERBATIM (copy it exactly from the list above — the Workflow's evidence gate matches it against the dispatched list, and a paraphrased or invented command fails closed to held:workflow-error). `
    + pt`do NOT continue and do NOT remove the worktree (it is kept for inspection). This is environment setup, not the artifact under test: a failure is an env-block, never a code defect.`,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision-run:${task.id}`, dispatchKind: 'provision-run', schema: ENV_OUTCOME, ...spawn('refiner') })
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
  ? pt`\nThis worktree was provisioned with (source: ${provisionSource}); re-run them if the env looks unset before you drive the gate:\n`
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
// Reported-path normalize-or-throw (this spec: launch-entry-validation; provenance: the former path
// contract at spec §9 / criterion 10). General workflow agents are unconfined by design — the confined
// war-worker main-checkout write is already scope-hook-denied, so a main-rooted files_changed entry is a
// REPORTING artifact, not evidence of a real off-worktree write. For each reported string:
//   (a) relative → pass through (worktree-relative by the cd contract);
//   (b) absolute under THIS task's worktree → pass;
//   (b2) absolute under worktreeRoot (when truthy) but NOT under this task's worktree → THROW: a
//        sibling-worktree checkout; normalizing against mainCheckout would fabricate a nonsense
//        worktree-relative path rooted in the wrong worktree, so it stays a loud failure (grill Q7);
//   (c) absolute under mainCheckout (only when truthy) → rewrite to the worktree-relative remainder and
//        log() a warning naming the task + original path; mainCheckout falsy ⇒ this arm is DISABLED
//        (never a guessed root — the path falls through to (d));
//   (d) any other absolute → THROW the named path-contract error.
// The (b2)/(d) throws are caught by the thunk-wide catch below → verdict:'escalate' (held:escalation),
// NOT a silent drop. The caller REASSIGNS impl.files_changed to the returned array, so the normalized
// form is the only form any downstream consumer sees (edits-land-in-main-not-session-worktree).
const normalizeReportedPaths = (files, worktree, taskId) => (files || []).map(f => {
  if (typeof f !== 'string' || !f.startsWith('/')) return f                                   // (a) relative → pass
  if (f === worktree || f.startsWith(worktree + '/')) return f                                // (b) this worktree → pass
  if (worktreeRoot && (f === worktreeRoot || f.startsWith(worktreeRoot + '/'))) {             // (b2) sibling worktree → throw
    throw new Error(`worker path-contract violation: reported file "${f}" is an absolute path under worktreeRoot ${worktreeRoot} but OUTSIDE this task's worktree ${worktree} — a sibling-worktree checkout; normalizing would fabricate a nonsense worktree-relative path`)
  }
  if (mainCheckout && (f === mainCheckout || f.startsWith(mainCheckout + '/'))) {              // (c) main-checkout-rooted → rewrite + warn
    const rel = f === mainCheckout ? '' : f.slice(mainCheckout.length + 1)
    log(`Task ${taskId}: normalized main-checkout-rooted files_changed path "${f}" → "${rel}" (worktree-relative). NB: a Bash-mediated REAL main-checkout write is a known residual — it leaves the file out of the branch diff, which the audit catches at the pinned sha.`)
    return rel
  }
  throw new Error(`worker path-contract violation: reported file "${f}" is an absolute path outside the task worktree ${worktree} — a write outside .claude/worktrees/<name>/ escapes the isolated checkout`)  // (d) other absolute → throw
})
const nextWave   = () => tasks.filter(t => !done.has(t.id) && (t.deps || []).every(d => succeeded.has(d)))

// Force-with-lease carve-out (ADR 0012). ONE canonical sentence, mirrored VERBATIM in
// agents/war-worker.md (standing surface) — the two surfaces are independent and both load-bearing;
// the both-surfaces unit test byte-compares this string. Keep them identical in the same commit.
const FORCE_WITH_LEASE_RULE = 'You may `git push --force-with-lease` ONLY your own task branch, and ONLY after a dispatch-rebase diverged it from its pushed remote — never any other ref, never for any other reason.'
// files_changed worktree-relative contract (this spec: launch-entry-validation). ONE canonical sentence,
// mirrored VERBATIM beside agents/war-worker.md's WorkerResult return line (standing surface); the
// dedicated both-surfaces byte-compare test anchors this string. Authored WITHOUT backtick or quote-mark
// tokens (shared-string-constant-quote-literal-byte-anchor-fragility). The engine enforces it in
// normalizeReportedPaths: a main-checkout-rooted report is normalized, any other absolute escalates.
const FILES_CHANGED_RULE = 'Report every files_changed path as worktree-relative — never an absolute path and never one rooted in the main checkout — so no downstream consumer ever sees a path that escapes the isolated worktree.'
// Comment-lag directive (D9, ADR 0025). ONE canonical sentence, mirrored in agents/war-worker.md
// (standing surface); the auditor's cascading-impact lens carries the standing review duty. The
// both-surfaces registry test anchors the shared tokens — keep the surfaces in sync in the same commit.
const COMMENT_LAG_RULE = "Before you commit, grep your touched files for the OLD behavior's concrete terms — retired values, old approach names, stale counts — and update any lagging comment/JSDoc so no comment still describes the pre-change behavior."
// Plan-defect sentinel (spec §4.3, ADR 0005). ONE shared JS constant used by BOTH the worker-prompt
// sentence (PLAN_DEFECT_RULE below) AND the escalation-record check (defectClassOf). The contract is a
// strict, case-sensitive `startsWith` at position 0 — no trim, no case folding; the worker is
// instructed to PREFIX blocked_reason — and the sentinel is LEFT inside blocked_reason (raw worker text
// is the evidence trail, never stripped). defectClass is metadata ORTHOGONAL to the escalation reason:
// it never enters decideLand, HARD_ESCALATION_REASONS, or KNOWN_LAND_DECISIONS (the negative guard is
// Task 3's land-decision.test.mjs); it rides the escalation record into the machine-readable return.
const PLAN_DEFECT_SENTINEL = 'PLAN-DEFECT:'
// defectClassOf: set defectClass:'plan' iff the worker-authored blocked text starts with the sentinel;
// ABSENT otherwise (never 'implementation' by default — absence keeps prior-run records shape-compatible
// and asserts no classification nobody made). Spread into EVERY escalation push whose record carries
// worker-authored blocked text (the wave-collector site + the floor sub-loop's blocked-fix-worker site);
// engine-authored blocked strings can never carry the sentinel, so they need no exclusion logic.
const defectClassOf = blocked => (typeof blocked === 'string' && blocked.startsWith(PLAN_DEFECT_SENTINEL)) ? { defectClass: 'plan' } : {}
// Plan-defect worker-prompt sentence (spec §4.3), mirrored in agents/war-worker.md's "Stop and escalate
// instead of guessing" section (both-surfaces registry test anchors a mid-sentence fragment). Always
// present in the dispatched worker prompt (not intent/memory/recovery-gated). The literal sentinel is
// interpolated from PLAN_DEFECT_SENTINEL so the token stays single-sourced.
const PLAN_DEFECT_RULE = pt`When a block's root cause is a plan or spec defect — the plan contradicts the code, a specced construct cannot exist as described, or an ambiguity has no intent-consistent resolution — prefix your blocked_reason with the literal token ${PLAN_DEFECT_SENTINEL} (kept inside the reason as evidence, never stripped) so the escalation is classified defectClass:'plan'.`
// Stale-prior-attempt push-handoff sentence (spec §4.4), mirrored in agents/war-worker.md's "Dep-wave
// rebase + force-with-lease carve-out" section (both-surfaces registry test anchors a mid-sentence
// fragment). A SEPARATE sentence adjacent to FORCE_WITH_LEASE_RULE — that rule stays byte-identical (its
// existing byte-compare test is untouched). Names `--force-with-lease` only to FORBID widening it
// (criterion 15): this is prompt prose, never an executable git invocation.
const STALE_PRIOR_ATTEMPT_RULE = 'A non-fast-forward push rejection where the remote task branch was never merged and shares only an older base is a stale prior attempt — do not rebase onto it, merge it, or widen `--force-with-lease`; escalate with the remote tip SHA and the divergence base in blocked_reason.'
// Dep-wave visibility (ADR 0012): a deps-bearing SAME-REPO task sees its merged dep content by
// rebasing onto the integration branch FIRST. Scoped by taskType — 'gitlink-bump' is EXCLUDED (its
// dep merged into the SUBMODULE repo's integration branch; this clause would assert a merge that
// happened in a different repo). Dep-less tasks are untouched: the frozen phase base stays HARD for
// same-wave parallel tasks.
const depClause = task => ((task.deps || []).length > 0 && task.taskType !== 'gitlink-bump')
  ? pt`DEPS ALREADY MERGED: this task declares deps [${(task.deps || []).join(', ')}] whose content is already merged into ${ph.integrationBranch}. `
    + pt`FIRST ACTION — before reading or writing anything else — run \`git -C ${task.worktree} rebase ${ph.integrationBranch}\` so your base includes the merged dep content (a first-dispatch task branch has zero commits of its own, so this rebase is a pure fast-forward). `
    + pt`If the rebase CONFLICTS (possible only on a resume with existing commits): abort it and return status:"blocked" with the conflict files in blocked_reason — NEVER resolve the conflict yourself. `
    + FORCE_WITH_LEASE_RULE + ' ' + STALE_PRIOR_ATTEMPT_RULE + pt`\n`
  : ''
// Worker-facing intent block (ADR 0013): the generic intent clause plus the worker's licensed-
// judgment sentence. Empty when intent is absent (byte-compatible prompts, criterion 10).
const workerIntentClause = intent
  ? intentClause + pt`Use the intent to resolve ambiguity in your slice; intent-consistent deviation is in-band — note it in your result.\n`
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
const WORKER_MEMORY_SELF_QUERY_LINE = pt`\nYou MAY run \`node <plugin>/skills/_shared/war-memory.mjs query '<terms>'${workerSelfQueryRepoFlag}\` mid-task when you hit something unfamiliar — it never writes a lesson, and without a \`--local\` root it appends no query log (the CLI never guesses one from the cwd).\n`

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
  ? pt`\nKNOWN BASELINE GATE DEBT (pre-existing failures this phase already classified — if your gate failure's failing identifiers are COVERED by one of these, classify gate_failure_class:'baseline' DIRECTLY, report the covered identifiers in gate_failing_ids, and do NOT re-run the base):\n`
    + baselineDebt.map((d, i) => `  ${i + 1}. [${d.ids.join(', ')}] — pre-existing at ${d.baseSha || '(base sha unrecorded)'}`).join('\n') + '\n'
  : ''
// reattachClause: every merge/land prompt's _refinery step BEGINS with this idempotent re-attach, so a
// dispatch that died mid-classification (classification detaches _refinery to re-run the base) cannot
// strand the serial queue detached (the re-attached-by-default _refinery, spec §6 / ADR 0019).
const reattachClause = refineryP =>
  pt`HYGIENE (idempotent): begin by re-attaching _refinery to the integration branch — \`git -C ${refineryP} checkout ${ph.integrationBranch}\` — so a prior dispatch that died mid-classification cannot leave _refinery detached.\n`
// classificationClause: the gate-failure classification PROCEDURE, mirrored (per-site base) into the
// initial merge-task prompt, the floor-retry re-merge prompt, THE LAND PROMPT, and agents/war-refiner.md
// (both-surfaces rule, same commit). baseDesc names the per-site classification base.
const classificationClause = (refineryP, baseDesc) =>
  pt`\nGATE-FAILURE CLASSIFICATION (spec §6/§9 / ADR 0019 — on gate failure, BEFORE returning gate_failed): PRECONDITION-MARKER SHORT-CIRCUIT — consult the gate STDERR, not just the TAP stdout: if it carries a recognized precondition marker (e.g. \`REL_GUARD_PRECONDITION_FAILED\`, emitted when a guard's meta-test cannot isolate a clean scratch dir), the gate could not establish its own preconditions ⇒ classify gate_failure_class:'environment' DIRECTLY (never 'introduced'), carry that marker line UNCURATED in gate_output, and skip the base re-run. Otherwise re-run ONLY the failing gate at the classification base — ${baseDesc} — by detaching _refinery there (\`git -C ${refineryP} checkout --detach <that base>\`), re-running the failing gate, then RE-ATTACHING _refinery to ${ph.integrationBranch} before you return (\`git -C ${refineryP} checkout ${ph.integrationBranch}\`). Set gate_failure_class: (1) the base is RED with the SAME failing identifiers ⇒ 'baseline'; (2) the base is GREEN AND the failure does NOT reproduce on a second run at the task tip in a FRESH environment (fresh TMPDIR/shell) ⇒ 'environment' (reproducibility — NOT file-disjointness — is the trigger; a diff-disjoint but reproducing failure is a normal introduced regression and stays 'introduced'); (3) otherwise ⇒ 'introduced'. This is JUDGMENT, not parsing — carry the base-run evidence in gate_output UNCURATED. On a 'baseline' classification also report the classified failing identifiers in gate_failing_ids (array) and the classification base sha in gate_base_sha. ABSENT class ⇒ treated as 'introduced' (the permanent fail-safe).\n`

// gateCaptureClause (D5): the merge-task gate-output capture directive — mirrored into the initial
// merge-task prompt AND the floor-retry re-merge prompt (both-surfaces rule; agents/war-refiner.md step 7
// is the standing mirror, same commit). It STRUCTURALLY REPLACES the retired anti-excerpt prose: the
// refiner tees the FULL step-2 gate stdout+stderr to an absolute artifact file and returns its path, so
// the gate-audit seat's HARD provably-unrun determination reads the CAPTURED file, never a possibly-
// curated inline paste. .war/ is git-excluded inside _refinery so the clean-surface posture holds.
const gateCaptureClause = (refineryP, taskId) =>
  pt`On success, populate gate_output in the returned MergeResult with the executed gate output (stdout+stderr) — the post-merge gate-audit pass reads it as NON-AUTHORITATIVE context only. Additionally, tee the FULL step-2 gate stdout+stderr to the artifact file ${refineryP}/.war/gate-${taskId}.log (an ABSOLUTE path — the subagent cwd is the main repo, not _refinery) and return that absolute path in gate_log_path; the gate-audit seat reads this captured file as the AUTHORITATIVE execution evidence, and a HARD provably-unrun finding is minted ONLY against the captured file. First ensure .war/ is git-excluded inside _refinery — append the line \`.war/\` (once) to the path printed by \`git -C ${refineryP} rev-parse --git-path info/exclude\` — so the artifact never dirties the merge/push clean surface. `
// SHA format guard (D2): a well-formed abbreviated-or-full git object name, shared by the pin-equality
// gate below (pinMismatch). pinOrSentinel keeps its own identical-shape literal on purpose — its #393
// extract-and-eval unit test evals that arrow in isolation, so it must not reference this helper.
const isSha = s => typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)
// Pin-equality mismatch (D2): true ONLY when the seat's audit_sha AND its dispatched pin are BOTH
// well-formed SHAs and neither is a prefix of the other (abbreviated-vs-full is NOT a mismatch — the
// same commit named at two lengths must still compare equal). Absent/malformed on either side ⇒ false
// (fail-open — no demotion, today's behavior). A mismatch means the seat judged a DIFFERENT tree.
const pinMismatch = (auditSha, pin) => {
  if (!isSha(auditSha) || !isSha(pin)) return false
  const [lo, hi] = auditSha.length <= pin.length ? [auditSha, pin] : [pin, auditSha]
  return !hi.startsWith(lo)
}

function auditPrompt(task, lens, depth, peers, workerTests, pin) {
  let p = pt`Audit WAR task ${task.id} through the "${lens}" lens at depth ${depth}.\n`
    + pt`Sub-issue #${task.issue ?? '<unset>'}. Plan slice: ${task.planSlice}. Plan file: ${plan.file}.\n`
    + pt`Run \`git diff ${ph.integrationBranch}...${task.branch}\` (three-dot = merge-base..head = exactly what this task added) for the authoritative change set; re-run it each round (a fix-worker may have pushed). `
    + pt`Use allowlist-safe git forms: --name-status, --stat, --format=oneline, A...B, HEAD^. `
    + pt`Avoid %-format strings (e.g. --pretty=format:%H) and @{} reflog syntax — those are denied by the read-only guard.\n`
    + pt`Then read candidate files under ${task.worktree}/ for neighbor/deep context.\n`
    + pt`Verify the mapped acceptance-criteria tests EXIST and are not weakened or skipped (anti-cheat: catch "green by deletion" and test-integrity erosion). You cannot execute the gate — the refiner runs the gate. Your job is to confirm tests exist in the diff and are uncompromised.`
    // Latitude + disposition + calibration + cost-claim rules (ADR 0013) — mirrored VERBATIM in
    // agents/war-auditor.md (standing surface, same commit); the both-surfaces unit tests assert the
    // shared sentences on both.
    + pt`\nLATITUDE RULE: the plan slice is the floor, the Commander's Intent is the ceiling — intent-consistent work beyond the literal slice is APPROVE (judge it on its own correctness), never a plan-faithfulness violation; only deviations that contradict the intent or the slice block. No intent threaded means judge against the plan slice alone, as before.`
    + pt`\nDISPOSITION RULE: every Minor/Nit finding carries a disposition — absorb (mechanical, intent-consistent, safe to fix this phase; set phaseClose:true when the fix needs the integrated tip or touches a shared/slot-adjacent file), follow-up (substantive work beyond this phase — MUST state why it is not absorbable), or note (informational; phase report + servitor feed, never an issue). Omitted disposition defaults: Minor becomes follow-up, Nit becomes note; absorb is never a default.`
    + pt`\nCALIBRATION RULE: judge on evidence only — never soften, downgrade, or drop a finding because peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in the current diff. The pull to soften peaks right after your own finding is challenged — that is the highest-risk moment.`
    + pt`\nCOST-CLAIM RULE: a finding justified by a cost — "too slow", "too expensive", "too complex" — must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost claim caps the finding at Minor.`
    // RELEASE-BASELINE RULE (D3) — verbatim-mirrored in agents/war-auditor.md (same commit). The literal
    // ${integrationBranch}...${task.branch} is escaped so the emitted prose byte-matches the static mirror.
    + pt`\nRELEASE-BASELINE RULE: judge a release/version-bump diff against the three-dot \`\${integrationBranch}...\${task.branch}\` merge-base set (exactly what this task added), never against a main checkout; an N-step main-lag when N stacked plans have not yet landed on main is the expected stacked-release lag, not a scope error.`
    // STALE-LOOKING-BUT-CORRECT CALIBRATION (Task 1.4, ADR 0030) — the four rule bodies are mirrored
    // VERBATIM in the "### Stale-looking-but-correct calibration" subsection of agents/war-auditor.md
    // (same commit; prompt-surface split rule); the both-surfaces drift test anchors a mid-sentence
    // phrase per rule on BOTH surfaces and locks the "only when the live artifact confirms" qualifier.
    // Reaches the inline gate-audit seats ONLY via the standing card (auditPrompt clauses do not).
    + pt`\nSTALE-LOOKING-BUT-CORRECT CALIBRATION: four authoring patterns read as drifted but are correct-by-construction — each demotes only when the live artifact confirms the candidate (a confirmation-gated floor, never blanket amnesty): (1) a plan literal diverging from the candidate on a line range, a suite count or enumeration, or a version bump is a Nit at most — never a hold — only when the live artifact confirms the candidate correct: the enclosing construct (the locator symbol or comment header), the self-discovery gate (\`resolveGate\` in \`war-config.mjs\`), or the worktree release baseline; absent that confirmation, judge the divergence on its merits. (2) a reference dangling at a task tip — a field, constant, or prose ref not yet emitted — is a defect only if the plan lacks the defined-but-not-yet-emitted, produced-in-Task-N cross-link; with that cross-link present and the referent confirmed at the post-merge integration tip it is a Nit or note, and you treat it as a hold only when the live artifact confirms the referent is genuinely absent at that landed tip. (3) a plan file-list naming a file the diff never touches is a finding only when the live artifact confirms the guard has no other real home — grep the sibling or precedent first; a location gap or a drift-guard-forced cascade touch elsewhere is a faithful deviation (Nit), and you block only on a claim demonstrably untrue at the tip. (4) a grep sweep is a floor, not a ceiling — treat a surviving sibling as the worker's omission only when the live artifact confirms the plan carried the same-scope manual title and comment survey and the sibling fell inside it; a straggler outside the swept scope is a survey-derived correction, not a regression.`
    // CASCADING-IMPACT DOC CASCADE (D8/D9/D12/D6, ADR 0025) — verbatim-parallel to the cascading-impact
    // lens bullet in agents/war-auditor.md (same commit); the both-surfaces registry test anchors the
    // shared tokens on BOTH surfaces. Reaches the inline gate-audit seat ONLY via the standing card.
    + pt`\nCASCADING-IMPACT DOC CASCADE (when your lens is cascading-impact, ADR 0025): a diff that changes a mechanism's behavior or attribution cascades into the docs and mirrors that describe it — the drift a name-grep misses. Check: (1) ADR policy-table attribution — confirm the mechanism's ADR chosen-option / policy-table row was updated in the same diff (read the row; under-attribution is invisible to a grep); (2) mechanism-style narrative — a narrative doc must assert the invariant and name the guard that holds it, never a snapshot member-count or line-number reference that rots silently; (3) comment-lag — the touched files leave no lagging comment/JSDoc naming the OLD behavior's retired values, old approach names, or stale counts; (4) preset matrix — a new PRESETS entry or role is covered by the enumerated (preset, role, model, effort) matrix exported from war-config.mjs (consult it — an unwatched literal is a finding).`
    // COMMITTED-TREE GROUNDING (spec §8, ADR 0029) — verbatim-mirrored in agents/war-auditor.md (same
    // commit); the both-surfaces registry test anchors the shared tokens on BOTH surfaces. The auditor git
    // allowlist is NOT widened — git show/git log are already read-only allowlisted, git grep stays denied.
    + pt`\nCOMMITTED-TREE GROUNDING (verify-and-close / already-done no-op claims): a claim that the diff is a no-op because the base tree already covers the requirement must be grounded against the pinned audit_sha, NOT the mutable working tree — read the blob with \`git show <audit_sha>:<path>\` (an allowlisted read verb), and for history-shaped questions ("when did this count change?", "was this token ever removed?") use \`git log -S<token>\` / \`git log -G<regex>\` — pick the verb per claim shape (-S answers "when did the occurrence count change", NOT "is the token present at the path" — for presence at the tip use git show). A working-tree grep is ADVISORY ONLY, never the sole basis for approving a no-op claim. The auditor git allowlist is NOT widened for this: git show and git log are already allowlisted, git grep is not and stays denied.`
    // VERSION-PRECEDENCE RULE (Task 1.5, ADR 0032) — appended alongside intentClause; the sentence body is
    // mirrored VERBATIM in agents/war-auditor.md (standing surface, same commit); the both-surfaces test
    // anchors a mid-sentence phrase on both. Empty/absent adjudications ⇒ '' ⇒ byte-identical to today.
    + intentClause + adjudicationClause + auditorMemClause(task.id, lens)
  // AUDIT PIN (D2): name the worker's committed tip and require the seat to echo the sha it ACTUALLY
  // reviewed as audit_sha. A well-formed audit_sha ≠ this pin means the seat judged a different tree —
  // its findings are demoted (pin-mismatch), never a block (enforced at the auditRound collection site
  // below). Absent/malformed pin ⇒ NO line (fail-open; prompt stays byte-identical to a pin-less run).
  // agents/war-auditor.md already lists audit_sha as a dispatched input, so no standing-surface edit rides.
  if (isSha(pin)) {
    p += pt`\nAUDIT PIN: the tree under audit is the worker's latest commit ${pin}. Judge the diff AT THAT sha and return the sha you actually reviewed as \`audit_sha\`; if your audit_sha differs from ${pin} your findings are treated as reviewing a different tree — demoted to SOFT, never a block.`
  }
  if (workerTests) {
    p += pt`\n\nWorker-reported tests summary (cross-check claim vs diff): ${JSON.stringify(workerTests)}`
  }
  if (peers && peers.length) {
    p += pt`\n\nREBUTTAL ROUND — your panel split. Re-judge in light of your peers below, then re-emit your final verdict:\n`
      + peers.map(s => `- ${s.seat} (${s.lens}) → ${s.verdict}: ${(s.findings || []).map(f => `[${f.severity}] ${f.title}`).join('; ') || 'no findings'}`).join('\n')
  }
  return p
}

async function auditRound(task, peers, workerTests, pin) {
  // Seats come straight from task.roster (validated at phase start: 1–5 distinct lenses, per-seat
  // depth already normalized). Labels audit:<task>:<lens> are distinct because lenses are distinct.
  const roster = task.roster
  const expected = roster.length
  const runSeat = seat => agent(auditPrompt(task, seat.lens, seat.depth, peers, workerTests, pin), {
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
  // Pin-equality demotion (D2), the single collection-site enforcement feeding allApprove/blockingOf/the
  // escalate check: a seat whose well-formed audit_sha differs from its well-formed dispatched pin reviewed
  // a DIFFERENT tree than the worker's committed tip — its findings cannot be trusted for the HARD path.
  // Tag pin-mismatch, drop each finding to a non-blocking Nit (SOFT; original severity preserved so nothing
  // is silently lost), neutralize the verdict to a non-blocking 'approve' so it can neither escalate nor
  // block a merge, and push a SOFT absence-note (task, seat, both SHAs) to auditLog. Fail-open: absent or
  // malformed pin OR audit_sha ⇒ no demotion (today's behavior). Demotion is findings/verdict-only — a
  // wrong-tree seat's convergent unanimity on one audit_sha stays doctrine, out of D2's slice (plan Notes).
  for (const s of seats) {
    if (!pinMismatch(s.audit_sha, pin)) continue
    auditLog.push({ task: task.id, seat: s.seat, verdict: `pin-mismatch:${s.verdict}`, pinMismatch: true,
      auditSha: s.audit_sha, expectedPin: pin, findings: [],
      note: `pin-mismatch: seat reviewed ${s.audit_sha} but the dispatched pin is ${pin} — findings demoted to SOFT, not a land-halt` })
    s.findings = (s.findings || []).map(f => ({ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }))
    s.verdict = 'approve'
  }
  return { seats, expected }
}

log(`Phase ${ph.id} "${ph.title}": ${tasks.length} task(s) → ${ph.integrationBranch}`)

// ---- PROVISION — refiner-owned worktree barrier (D3, ADR 0001) ----
// The refiner provisions the whole phase's git topology via provision-worktrees.sh BEFORE any
// worker fans out, so workers never touch shared git state (E1 proved a worker can't even scope
// itself). Runs the script's idempotent "ensure" subcommands; a resume is a no-op. Carry-forward
// from Phase 2's coven:
//   (A) ensure-exclude is passed the main checkout EXPLICITLY as its <repo-dir> target (Task 1.4's
//       optional positional): it writes the exclude into that repo's git dir regardless of cwd. The
//       intent is to exclude `.claude/` in the PARENT checkout so nested worktrees don't show as
//       untracked there (probe E2). Still dispatched from the main checkout (belt-and-suspenders).
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
  // --reclaim-stale-remote is threaded onto every ensure-worktree line ONLY on a sanctioned recovery
  // relaunch that opts into reclaim (§4.4); absent it, the flag never appears (byte-identical to today).
  const reclaimFlag = (recovery && recovery.reclaimStaleRemote) ? ' --reclaim-stale-remote' : ''
  const ensures = tasks.map(t =>
    `   provision-worktrees.sh ensure-worktree ${t.worktree} ${t.branch} "$TIP"${reclaimFlag}`).join('\n')
  // Always-on stale-remote classification (§4.4) — present regardless of args.recovery (the probe is
  // DEFAULT behavior, not recovery machinery — end states 10/22). The barrier keys on the STALE_REMOTE
  // marker TOKEN, never the numeric exit code (live-artifact rule; the script's dedicated exit code is
  // its own direct-invocation contract, Task 1). This is the ONLY delta between a recovery-absent
  // barrier prompt and today.
  const staleRemoteClause = pt`STALE-REMOTE CLASSIFICATION (per task, always-on): if a task's ensure-worktree exits NON-ZERO and its output carries the \`STALE_REMOTE\` marker line, do NOT halt the barrier — capture { task: "<that task's id>", remoteSha: "<the marker's remote SHA>", frozenTip: "$TIP" } into a \`staleRemote\` array on the env-outcome and CONTINUE provisioning the remaining tasks. The marker token is the key, never the numeric exit code. Any OTHER non-zero ensure-worktree exit — one WITHOUT the marker — remains a barrier failure exactly as the fail-loud rule above.\n`
  // Recovery-gated derive-and-skip (§4.2) — DORMANT unless args.recovery.sanctioned. When armed, a task
  // whose local branch is already an ancestor of the frozen tip is reported preMerged and its
  // ensure-worktree is SKIPPED. Deriving before cutting means a fresh cut can never pollute the ancestry
  // check (the "vacuous on a first run" property is true by ordering, not luck). A task branch that
  // exists but is NOT an ancestor (the escalated task's half-done branch) takes the existing-branch
  // reuse path — prior commits kept, no reset (spec §8).
  const deriveSkipClause = recovery
    ? pt`SANCTIONED RECOVERY RELAUNCH — derive-then-cut: the step-3 ensure-worktree list above is conditional under this relaunch. For EACH task, FIRST check whether its local branch exists AND \`git merge-base --is-ancestor <that task's branch> "$TIP"\` holds (already-integrated on the adopted integration branch). On TRUE, report the task id in a \`preMerged\` array on the env-outcome and SKIP that task's ensure-worktree entirely — no worktree is needed for a task that will not run, and deriving before cutting means a fresh cut can never pollute the ancestry check. On FALSE or an absent local branch, run that task's ensure-worktree as listed${reclaimFlag ? ' (each carries the --reclaim-stale-remote flag under this sanctioned relaunch)' : ''}. A local branch that exists but is NOT an ancestor takes the ordinary existing-branch reuse path (prior commits kept, no reset).\n`
    : ''
  // Submodule tasks: thread the target repo + base into the Provision prompt so the refiner knows
  // to initialize the submodule checkout (git submodule update --init) before running ensure-integration
  // against the submodule's base (not the superproject working branch). DP3: no script change.
  const submodTasks = tasks.filter(t => t.taskType === 'submodule')
  const submodNote = submodTasks.length
    ? pt`\nSUBMODULE TASKS in this phase: ${submodTasks.map(t =>
        `task ${t.id} targets repo "${t.targetRepo || '<targetRepo>'}" at base "${t.targetBase || '<targetBase>'}"`
      ).join(', ')}. `
      + pt`Before running ensure-integration for these tasks, ensure the submodule checkout is initialized: `
      + pt`\`git submodule update --init --recursive\` in the superproject, so the submodule worktree at `
      + pt`"${submodTasks[0] && submodTasks[0].targetRepo || '<targetRepo>'}" exists. `
      + pt`Run ensure-integration and ensure-worktree cwd-scoped to each submodule task's targetRepo path (not the superproject).`
    : ''
  // provision mode (agents/war-refiner.md ## provision): git-topology barrier — env-outcome return.
  // dispatchKind: 'provision-barrier' (DISTINCT from the per-task 'provision-run' — mocks/isProvision key on it).
  const barrierOut = await agent(
    pt`Provision the worktree topology for WAR phase ${ph.id} "${ph.title}" by running ${SCRIPT}. `
    + pt`Do NOT free-author git; only run these subcommands, fail loud on ANY non-zero exit — do NOT special-case a numeric code (a foreign integration branch exits 3; a diverged local/origin base halts with its own distinct non-zero exit) — with ONE marker-keyed carve-out: a per-task worktree-creation exit whose output carries the \`STALE_REMOTE\` marker line is CLASSIFIED per task (step 3's classify-and-continue clause) and does NOT halt the barrier; the marker token is the key, never the numeric code. Return the env-outcome JSON: \`{ ok: true }\` when every subcommand exited 0 (optionally carrying the step-3 \`preMerged\` / \`staleRemote\` arrays); on the FIRST non-zero exit WITHOUT the STALE_REMOTE marker return \`{ ok: false, failedCommand: "<the exact provision-worktrees.sh subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr — the script's die text>" }\`.\n`
    + pt`1. FROM THE MAIN CHECKOUT (${mainCheckout || 'the main repo checkout — your current working directory'}, NOT a task worktree): `
    + pt`provision-worktrees.sh ensure-exclude ${mainCheckout || '<mainCheckout>'} — pass the main checkout EXPLICITLY as the target repo (the optional <repo-dir> positional); ensure-exclude then writes the exclude into that repo's git dir regardless of your cwd. This excludes \`.claude/\` in the parent checkout so the nested task worktrees do not surface as untracked there (probe E2).\n`
    + pt`2. provision-worktrees.sh ensure-integration ${planSlug || '<plan-slug>'} ${ph.id} ${ph.workingBranch}${owned} — reuse the plan-namespaced integration branch ${ph.integrationBranch} if it is already ours (the --owned-file ledger); else DERIVE the cut base against origin (ADR 0008): the script fetches origin/${ph.workingBranch} and reconciles the local ${ph.workingBranch} — equal or ahead → cut from local; behind → cut from the ORIGIN tip plus a guarded follower fast-forward (skipped with a warning when ${ph.workingBranch} is checked out in a worktree); a fetch failure or missing origin → cut from local with a stderr warning (today's offline behavior). DIVERGED (neither SHA an ancestor of the other) is a HALT: the script dies non-zero carrying BOTH SHAs and the two repair directions, and creates no branch. On that die — or ANY non-zero exit — return the \`{ ok: false, … }\` env-outcome carrying the die text in \`stderrTail\` and STOP: never pick a side, never retry with a different base. The phase never starts; I surface the die message like today's foreign-branch halt.\n`
    + pt`3. Capture the resulting integration tip (TIP="$(git rev-parse ${ph.integrationBranch})"), then for EACH task run ensure-worktree at the integration tip captured in step 3 (idempotent; reuse if present, conservative heal if the dir went missing):\n${ensures}\n`
    + deriveSkipClause
    + staleRemoteClause
    + pt`Each ensure-worktree creates the worktree on its plan-namespaced branch off the integration tip and drops a .war-task marker. After this barrier every task worktree exists and the workers can run.\n`
    + pt`4. provision-worktrees.sh ensure-refinery-worktree ${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery ${ph.integrationBranch} — create (or re-attach) the Refinery's dedicated worktree on the integration branch. The Refinery performs every merge in this run-scoped worktree, never the Lead's main checkout.`
    + submodNote,
    { agentType: NS + 'war-refiner', phase: 'Provision', label: `provision:phase-${ph.id}`, dispatchKind: 'provision-barrier', schema: ENV_OUTCOME, ...spawn('refiner') })
  // No topology ⇒ nothing in the phase can run — a hard stop is correct here, evidence or not (B/C).
  // !ok or a missing result throws with the stderrTail (which carries the script's die text — incl. a
  // foreign-branch exit 3 or a diverged exit 7) → held:workflow-error via the catch.
  if (!barrierOut || barrierOut.ok !== true) {
    throw new Error(`phase ${ph.id}: the provision:phase-${ph.id} git-topology barrier did not return { ok: true } — the phase cannot start: ${(barrierOut && barrierOut.stderrTail) || 'no result / no env-outcome returned'}`)
  }
  // ---- RECOVERY: barrier-derived merged-set skip (§4.2) ----
  // The provision-barrier refiner ran the git-ancestry checks (the Workflow sandbox has no shell/fs) and
  // returned preMerged: task ids whose local branch is an ancestor of the frozen integration tip —
  // already-integrated on the adopted branch. Record each as terminal `merged` (NEVER `landed` — that is
  // phase-level) with the recovered note; enter done + succeeded (so a dep-block pre-check on the
  // re-dispatched task passes — no spurious dep-failed) and the bare-id landed list; one auditLog entry;
  // NO worker dispatch. Deliberately NOT pushed to mergedTasksForGateAudit — no gate ran for it this run,
  // and the handoff tipSha fallback reads that list, which must stay truthful. Only ids matching a real
  // task are honored (git > any Lead-assembled arg). Labels/ledger are Lead-reconciled toward git (ADR 0008).
  for (const id of (Array.isArray(barrierOut.preMerged) ? barrierOut.preMerged : [])) {
    if (done.has(id) || !tasks.some(t => t.id === id)) continue
    done.add(id); succeeded.add(id); landed.push(id)
    auditLog.push({ task: id, verdict: 'recovered:pre-merged', findings: [], note: 'recovered: pre-merged on adopted integration branch' })
    log(`recovery: task ${id} is pre-merged on the adopted integration branch (ancestor of the frozen tip) — recorded merged, no worker dispatched.`)
  }
  // ---- §4.4 stale-remote classification → per-task env-blocked (always-on, never a phase halt) ----
  // The barrier CONTINUED past a per-task ensure-worktree exit carrying the STALE_REMOTE marker and
  // returned each as { task, remoteSha, frozenTip }. Map each to the EXISTING per-task env-blocked status
  // (worker never spawned) with the full two-direction diagnostic — (a) adopt via `git branch`, (b) a
  // sanctioned --reclaim-stale-remote — plus the reversible restore command. env-blocked is SOFT: siblings
  // dispatch normally; a dependent of a blocked task follows the existing dep-failed semantics (the task is
  // in `done` but NOT `succeeded`). ADR 0021's all-or-nothing topology barrier is untouched — this is env
  // classification, the same family as run.provision failures. The record rides the machine-readable return.
  for (const sr of (Array.isArray(barrierOut.staleRemote) ? barrierOut.staleRemote : [])) {
    if (!sr || typeof sr !== 'object' || done.has(sr.task) || !tasks.some(t => t.id === sr.task)) continue
    const br = (tasks.find(t => t.id === sr.task) || {}).branch || '<branch>'
    const remoteSha = sr.remoteSha || '<remote-sha>'
    const frozenTip = sr.frozenTip || '<frozen-tip>'
    const diagnostic = `stale prior attempt: the remote task branch ${br} tip ${remoteSha} is not an ancestor of the frozen integration tip ${frozenTip} — a prior run's torn-down attempt blocks the identically-named relaunch push. Two recovery directions: (a) adopt via \`git branch ${br} ${remoteSha}\` then relaunch, or (b) a sanctioned recovery relaunch (args.recovery.reclaimStaleRemote) threading \`--reclaim-stale-remote\`, which deletes the stale remote after three mechanical proofs then cuts fresh. Restore the deleted ref anytime before remote GC with \`git push origin ${remoteSha}:refs/heads/${br}\`.`
    done.add(sr.task)
    escalated.push({ task: sr.task, reason: 'env-blocked', staleRemote: true, remoteSha, frozenTip, diagnostic })
    auditLog.push({ task: sr.task, verdict: 'env-blocked:stale-remote', findings: [], requested: 0, returned: 0, blocked: diagnostic })
    log(`Task ${sr.task}: env-blocked — stale remote task branch ${br} (${remoteSha}) is not an ancestor of the frozen tip ${frozenTip}. Worker not spawned; siblings proceed. Recover by adopt-or-reclaim + relaunch.`)
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
    // Wave-loop invariant (spec constraint 4, #742): a task dispatched into a work wave MUST terminate
    // in exactly ONE collected result — it may never re-enter the wave because of an engine-side throw.
    // The live `parallel` NULLS a rejected thunk, so results.filter(Boolean) drops it → done.add never
    // runs → nextWave() re-dispatches a COMPLETED, pushed, gate-green task every iteration (~660k
    // tokens/round) until the post-loop ghost-dep sweep mislabels it unrunnable-deps. So catch EVERY
    // engine error across the WHOLE thunk body (provisionStep + the pt-tagged worker/fix prompt builds +
    // normalizeReportedPaths + auditRound) and return a HARD 'escalate' (already in
    // HARD_ESCALATION_REASONS): the collection loop threads blocked verbatim, so the phase holds
    // :escalation with the true diagnostic instead of silently looping.
    try {
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
        workerExtraCtx = pt`\nTARGET REPO: ${task.targetRepo || '<targetRepo>'} — this is a submodule task. `
          + pt`Your worktree is rooted inside the submodule checkout at ${task.targetRepo || '<targetRepo>'}; `
          + pt`the submodule base is "${task.targetBase || '<targetBase>'}". `
          + pt`Implement, write mapped tests in the submodule repo, gate green, commit, push ${task.branch}.`
      } else if (task.taskType === 'gitlink-bump') {
        // Find the dep submodule task for the submodule path. The dep's landed SHA is a CROSS-PHASE
        // value the worker resolves from the ledger (war-worker.md T7) — emit the placeholder here.
        const depSubmodTask = tasks.find(t => (task.deps || []).includes(t.id) && t.taskType === 'submodule')
        const depSha = '<dep-submodule-landed-sha>'
        const submodPath = depSubmodTask ? (depSubmodTask.targetRepo || '<submodule-path>') : '<submodule-path>'
        workerExtraCtx = pt`\nGITLINK-BUMP task: pin the superproject gitlink to the dep submodule task's landed SHA. `
          + pt`Dep submodule task landed SHA: ${depSha}. Submodule path: ${submodPath}. `
          + pt`Run: git -C ${mainCheckout || '<superproject>'} add ${submodPath} — stage the submodule at the dep SHA, then commit the bump.`
      }
      const impl = await agent(
        depClause(task)
        + pt`Implement WAR task ${task.id} in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}, cut from ${ph.integrationBranch}).\n`
        + pt`The refiner's Provision barrier already created this worktree and its .war-task marker — do NOT create it yourself and do NOT set any worktree env var. cd into ${task.worktree} and work only inside it; commit and push ${task.branch}.\n`
        + pt`Sub-issue #${task.issue ?? '<unset>'} — ${task.title}\nPlan slice: ${task.planSlice}\nPlan file: ${plan.file}\nGate: ${plan.gate}${workerIntentClause}`
        + WORKER_MEMORY_SELF_QUERY_LINE + workerMemClause(task.id) + provisionClause + workerExtraCtx
        + '\n' + COMMENT_LAG_RULE + '\n' + PLAN_DEFECT_RULE + '\n' + FILES_CHANGED_RULE,
        { agentType: NS + 'war-worker', phase: 'Work', label: `work:${task.id}`, schema: WORKER_RESULT, ...spawnWorker(isDocsTask(task) ? 'docs' : null) })

      const why = blockedReason(impl); if (why) return { task, verdict: 'escalate', seats: [], expected: 0, blocked: why }
      impl.files_changed = normalizeReportedPaths(impl.files_changed, task.worktree, task.id)   // path contract (this spec): normalize main-rooted, escalate any other absolute

      let round = 0, verdict = null, seats = [], expected = 0, blocked = null
      const workerTests = impl && impl.tests ? impl.tests : null
      let pin = impl && impl.head_sha   // D2: the worker's committed tip — the pin each audit seat's audit_sha must match
      while (round < roundLimit) {
        ;({ seats, expected } = await auditRound(task, null, workerTests, pin))      // independent — no cross-talk
        if (seats.length < expected) { verdict = 'audit-blocked'; break }   // persistent shortfall after retries
        if (seats.some(s => s.verdict === 'escalate')) { verdict = 'escalate'; break }
        if (allApprove(seats, expected)) { verdict = 'approve'; break }

        if (isSplit(seats) && seats.length > 1) {                  // one rebuttal round on a split
          ;({ seats, expected } = await auditRound(task, seats, workerTests, pin))
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
          pt`FIX_NEEDED for WAR task ${task.id}. Work in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
          + pt`Resolve ALL of these blocking findings, keep the gate green, commit and push:\n`
          + b.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n')
          + workerMemClause(task.id) + provisionClause,
          { agentType: NS + 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, schema: WORKER_RESULT, ...spawnWorker('fix') })
        const fixWhy = blockedReason(fix); if (fixWhy) { verdict = 'escalate'; blocked = fixWhy; break }
        pin = fix && fix.head_sha   // D2: re-pin to the fix-worker's new tip for the next round's audit
        round++
      }
      if (verdict === null) verdict = 'audit-blocked'
      return { task, verdict, seats, expected, round, blocked }
    } catch (err) {
      // The caught engine error is the ONLY evidence trail — carried verbatim, uncurated, in blocked.
      return { task, verdict: 'escalate', seats: [], expected: 0, blocked: `engine error during work/audit: ${err.message}` }
    }
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
        gateHeadSha: pinOrSentinel(mr.integration_sha), gateLogPath: mr.gate_log_path,
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
          pt`ADVISORY POLISH (--ace) for WAR task ${r.task.id}. Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
          + pt`This task is ALREADY APPROVED. These are auditor-flagged absorb-disposition Minor/Nit findings — apply the smallest mechanical fix for EACH, keep the gate green, and make EXACTLY ONE commit whose message cites each finding's title + rationale:\n`
          + aceable.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (${f.file}${f.line ? ':' + f.line : ''}) — ${f.rationale}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n') + '\n'
          + pt`Make ONE commit only (the panel re-audits it at the new sha; on regression it is forward-reverted). Do NOT touch version/release slots. Commit and push ${r.task.branch}.`
          + intentClause + provisionClause,
          { agentType: NS + 'war-worker', phase: 'Audit', label: `ace:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawnWorker('fix') })
        const aceWhy = blockedReason(ace)
        // WORKER_RESULT's commit field is `head_sha` (NOT `sha` — no worker result carries `.sha`).
        // Guard on a TRUTHY head_sha: a falsy sha would make r.aceReverted falsy (revert clause never
        // fires) AND emit a `git revert --no-edit ` with no arg (fails → escalate). Both defeat the
        // never-blocks-a-land invariant. A blocked/head_sha-less ace falls through to the plain merge.
        if (!aceWhy && typeof ace.head_sha === 'string' && ace.head_sha) {
          r.task.fixRounds++
          aceSha = ace.head_sha /* the single ace commit */
          const { seats: reSeats, expected: reExpected } = await auditRound(r.task, null, null, aceSha)   // re-pin + re-audit at the new sha (D1/D2)
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
        ? pt`\nSUBMODULE TASK: this merge-task operates INSIDE the submodule repo, not the superproject. `
          + pt`Submodule checkout (targetRepo): ${r.task.targetRepo}. Submodule base: ${r.task.targetBase || '<targetBase>'}. `
          + pt`Run rebase and gate cwd-scoped to ${r.task.targetRepo}; the _refinery merge fast-forwards the submodule integration branch.`
        : ''
      // D2 forward-revert: on an ace re-audit regression the merge dispatch PREPENDS one clause — in the
      // TASK worktree, `git -C <worktree> revert --no-edit <aceSha>` BEFORE the rebase. Emitted ONLY when
      // r.aceReverted is a non-empty string (belt-and-suspenders, never unconditional). This CANNOT introduce
      // a new escalate: aceSha is the single ace commit = the task-branch TIP at revert time, so its revert is
      // the clean inverse of HEAD and cannot conflict; the tree returns to the originally-approved state and the
      // rebase+gate+merge behaves exactly as it would have un-aced. Ace never turns a mergeable task into a hold.
      const aceRevertClause = (typeof r.aceReverted === 'string' && r.aceReverted)
        ? pt`FORWARD-REVERT (--ace regression): the ace polish commit regressed on re-audit. In the TASK worktree, run `
          + pt`\`git -C ${r.task.worktree} revert --no-edit ${r.aceReverted}\` (forward-only, classifier-safe — it is the clean inverse of the task-branch tip, cannot conflict) `
          + pt`BEFORE the rebase step (a), so the merge runs on the reverted-to-approved tip. Do NOT reset --hard. The originally-approved work still lands.\n`
        : ''
      const mr = await agent(
        pt`Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
        + aceRevertClause
        + reattachClause(refineryPath)
        + pt`IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
        + pt`  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
        + pt`CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
        + pt`rebase --onto does NOT dodge this constraint — it is equally refused.\n`
        + pt`  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
        + pt`Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
        + classificationClause(refineryPath, pt`the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
        + baselineDebtClause()
        + gateCaptureClause(refineryPath, r.task.id)
        + pt`Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip.`
        + pt` Before the _refinery merge step (b), run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (REGARDLESS of requiresTest — a submodule touch is refused whether or not the task needs a test; the relax-flag is only threaded for a declared gitlink-bump task). Exit 1 → return { mode: 'merge-task', status: 'submodule-blocked' } — do NOT merge. Exit 2 → return { mode: 'merge-task', status: 'error' }.`
        + (requiresTest
          ? pt` Also before step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop.`
          : pt` requiresTest:false — skip the assert-test-in-diff.sh check and proceed directly to the rebase+merge.`)
        + (requiresPackaging
          ? pt` Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} to verify the task diff adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.`
          : pt` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
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
            ? pt`ADD_TEST for WAR task ${r.task.id}. The refiner's merge-task check (assert-test-in-diff.sh) found no test file in the diff. `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Add a mapped test for this task (the test must exercise the slice described in: ${r.task.planSlice}), keep the gate green, commit and push.`
            : pt`PACKAGE_IT for WAR task ${r.task.id}. The refiner's merge-task check (assert-packaging-in-diff.sh) flagged an added/renamed file a Dockerfile's enumerated COPYs miss. `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Resolve it for the slice described in: ${r.task.planSlice}. add the COPY or dockerignore it — never delete the file to satisfy the floor. Keep the gate green, commit and push.`
          const floorFix = await agent(
            fixPrompt + workerMemClause(r.task.id) + provisionClause,
            { agentType: NS + 'war-worker', phase: 'Audit', label: `${isNoTest ? 'add-test' : 'package-it'}:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
          // Floor-specific verdict tokens: no-test keeps its historical strings (regression guard #268);
          // unpackaged uses the parallel package-it form. status ('no-test'|'unpackaged') prefixes both.
          const blockedVerdict = isNoTest ? 'no-test:add-test-blocked' : 'unpackaged:package-it-blocked'
          const floorFixWhy = blockedReason(floorFix)
          if (floorFixWhy) {
            // Blocked floor fix-worker (worker-authored blocked text) — escalate and break the
            // floor-retry sub-loop. defectClassOf tags defectClass:'plan' on a sentinel-prefixed
            // reason (a fix-round plan defect is as plan-shaped as a first-round one; §4.3).
            escalated.push({ task: r.task.id, reason: 'escalate', blocked: floorFixWhy, ...defectClassOf(floorFixWhy) })
            auditLog.push({ task: r.task.id, verdict: blockedVerdict, findings: [], blocked: floorFixWhy, fixRounds: r.task.fixRounds })
            floorMr = null
            reAuditFailed = true
            break
          }
          r.task.fixRounds++

          // RE-RUN the full audit panel for this task (not a re-wave — localized sub-loop). The floor
          // cannot judge whether dockerignoring the file (or the added test) was RIGHT; the panel can.
          let reSeats, reExpected
          ;({ seats: reSeats, expected: reExpected } = await auditRound(r.task, null, null, floorFix && floorFix.head_sha))
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
            pt`Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + pt`IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
            + pt`  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
            + pt`CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
            + pt`rebase --onto does NOT dodge this constraint — it is equally refused.\n`
            + pt`  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
            + pt`Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
            + gateCaptureClause(refineryPath, r.task.id)
            + pt`Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip. `
            + classificationClause(refineryPath, pt`the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
            + baselineDebtClause()
            + (requiresTest
              ? pt`Before the _refinery merge step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff now contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop. `
              : pt`requiresTest:false — skip the assert-test-in-diff.sh check. `)
            + (requiresPackaging
              ? pt`Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} to verify the task diff now adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.`
              : pt`requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`),
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
            pt`BASELINE-PROCEED re-merge for WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + pt`The prior merge-task gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the phase integration base, NOT introduced by this task: ${(mr.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
            + pt`  (a) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}.\n`
            + pt`  (b) Run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that pre-existing set is a real regression → return { mode: 'merge-task', status: 'gate_failed' } classifying the NEW failure, and do NOT merge.\n`
            + pt`  (c) If the ONLY failures are the pre-existing baseline set, MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), git merge ${r.task.branch}, push, return { mode: 'merge-task', status: 'merged', integration_sha: <tip> }.`
            + pt` Before the merge, run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (exit 1 → submodule-blocked; exit 2 → error).`
            + (requiresTest
              ? pt` Also run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} (exit 1 → no-test; exit 2 → error).`
              : pt` requiresTest:false — skip the assert-test-in-diff.sh check.`)
            + (requiresPackaging
              ? pt` Also run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch} (exit 1 → unpackaged; exit 2 → error).`
              : pt` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`),
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
        // Wave-collector escalation (worker-authored blocked text: the initial worker's why or a
        // blocked audit-round fix-worker's reason). defectClassOf tags defectClass:'plan' iff the
        // blocked text is sentinel-prefixed; absent otherwise (§4.3, orthogonal to reason).
        escalated.push({ task: r.task.id, reason: r.verdict, blocked: r.blocked, ...defectClassOf(r.blocked) })
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
  ? pt`\nEND-STATE CHECK (phase-scoped): this phase claims the Commander's-Intent End-state condition(s) below. Three cases, mirroring the provably-unrun/SOFT split: `
    + pt`(1) a condition provably UNMET by the landed content at the CONFIRMED integration tip is HARD — record a Critical/Major finding (gate-evidence lane, holds the land); `
    + pt`(2) a condition you cannot verify, or a tip you cannot confirm, is a SOFT note (Minor/Nit), never a hold; `
    + pt`(3) a condition owned by a LATER phase is out-of-scope — record a Nit finding whose title contains "out-of-scope", NEVER a hold. `
    + pt`Set plan_ref on EVERY End-state finding to the condition text VERBATIM (the handoff block keys endState statuses on it).\n`
    + endStateClaims.map((c, i) => `  ${i + 1}. ${c}`).join('\n') + '\n'
  : ''
if (mergedTasksForGateAudit.length > 0) {
  const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
  // ponytail: reuse the _refinery worktree — already checked out on ph.integrationBranch at the integration tip
  //           after the serial merge queue and before Land/teardown; loop-scoped :308 refineryPath is out of scope here

  // ---- D1/D4/D6 — ONE consolidated post-merge evidence dispatch (refiner, in _refinery) ----
  // dispatchKind: 'evidence' (stable discriminator — the evidence dispatch plan 2 added, tagged for parity).
  // Stamps per merged task: the gate-pin-status.sh proof (pin_status + observedHead = the _refinery tip the
  // proof ran against — the gate-audit seat's pin-equality expectation, D2) and the guard-specificity
  // advisory token. On an INTRA-PHASE-DEP phase between SAME-REPO tasks it ALSO re-runs plan.gate once at
  // the final integration tip (the land-authoritative execution evidence feeding the D4 authoritative seat).
  // ALL fail-open: a failed/absent dispatch ⇒ no tokens ⇒ every seat keeps today's SOFT cannot-confirm path.
  // sameRepo: a superproject task (incl. a gitlink-bump, whose diff lands in the superproject) is one repo;
  // a submodule-content task is keyed by its targetRepo. A dep spanning repos (submodule content → gitlink
  // bump) has integration tips in different repos, so it does NOT trigger the single-repo integrated re-run.
  const repoOf = t => t.taskType === 'submodule' ? (t.targetRepo || '<submodule>') : '<superproject>'
  const sameRepo = (a, b) => repoOf(a) === repoOf(b)
  const intraDep = tasks.some(t => (t.deps || []).some(d => tasks.some(x => x.id === d && sameRepo(x, t))))
  // Per-task pre-merge base for the task's own changed-file set + the guard floor. Per-task merges are
  // FAST-FORWARD (linear single-parent chain, NO per-task merge commit), so the base is the PREVIOUS merged
  // task's gateHeadSha in serial order (mergedTasksForGateAudit is pushed in merge order) — or, for the
  // FIRST merged task, the phase integration base (a shell substitution the refiner resolves). NOT <merge>^1
  // (void: no merge commit) and NOT the post-merge integration tip (an empty three-dot no-op).
  const phaseBaseCmd = `$(git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch})`
  const evItems = mergedTasksForGateAudit.map((m, i) => ({
    taskId: m.taskId, gateHeadSha: m.gateHeadSha,
    preMergeTip: i === 0 ? phaseBaseCmd : mergedTasksForGateAudit[i - 1].gateHeadSha }))
  const evidence = await agent(
    pt`EVIDENCE DISPATCH for WAR phase ${ph.id} (mode=merge-task post-merge evidence; you are the refiner). `
    + pt`cwd = ${refineryPath} (the _refinery worktree, on ${ph.integrationBranch} at the FINAL integration tip after the serial merge queue). `
    + pt`This is a READ-ONLY proof computation — do NOT merge, push, rebase, or edit. Run the two floor scripts (siblings of assert-test-in-diff.sh, invoked the same bare way) per merged task and return the tokens.\n`
    + pt`observedHead — the _refinery tip you compute every proof against — is \`git -C ${refineryPath} rev-parse HEAD\`; return it per task.\n`
    + pt`For EACH merged task below (taskId · gateHeadSha · preMergeTip):\n`
    + evItems.map(e => `  - ${e.taskId} · gateHeadSha=${e.gateHeadSha} · preMergeTip=${e.preMergeTip}`).join('\n') + '\n'
    + pt`  1. PIN STATUS — run: gate-pin-status.sh <gateHeadSha> $(git -C ${refineryPath} rev-parse HEAD) --mapped "$(git -C ${refineryPath} diff --name-only <preMergeTip> <gateHeadSha>)". `
    + pt`The --mapped set is THIS task's OWN changed files (the <preMergeTip>..<gateHeadSha> range — exactly what the task brought in under fast-forward topology), NOT the global gate-discovery set. Record pin_status = CONFIRMED (exit 0, equal shas) | BENIGN-ADVANCE (exit 0, tip descends gateHeadSha and no mapped file changed in between) | STALE-MISMATCH (exit 1, a mapped file changed or not an ancestor) | ERROR (exit 2, git/ref error or the '(integration_sha …)' sentinel), plus pin_evidence (the script's printed intervening/offending file list or error text).\n`
    + pt`  2. GUARD SPECIFICITY — run: assert-guard-specificity-in-diff.sh <preMergeTip> <gateHeadSha> (SAME pre-merge base). Record guard_specificity = covered (exit 0) | uncovered (exit 1 — capture the printed uncovered guard message + defining file as guard_evidence) | ERROR (exit 2).\n`
    + (intraDep
      ? pt`INTRA-PHASE-DEP phase (a same-repo dep edge exists): ALSO re-run the FULL gate (${plan.gate}) ONCE at the final integration tip in ${refineryPath} with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)), tee its full stdout+stderr to ${refineryPath}/.war/gate-phase-${ph.id}.log, and return integratedTipGate = { gate_output: <the full captured output>, tip_sha: $(git -C ${refineryPath} rev-parse HEAD) } — the land-authoritative execution evidence. Ensure .war/ is git-excluded (append \`.war/\` once to the path printed by \`git -C ${refineryPath} rev-parse --git-path info/exclude\`).\n`
      : pt`No intra-phase same-repo dep edge on this phase: do NOT re-run the gate; omit integratedTipGate.\n`)
    + pt`Return { perTask: [{ taskId, pin_status, pin_evidence, observedHead, guard_specificity, guard_evidence }], integratedTipGate? }. On any failure, return what you have — a partial/empty result is FAIL-OPEN (seats fall back to today's SOFT cannot-confirm path); never block.`,
    { agentType: NS + 'war-refiner', phase: 'Refine', label: `evidence:phase-${ph.id}`, dispatchKind: 'evidence', schema: EVIDENCE_RESULT, ...spawn('refiner') })
  // Merge the stamped tokens back onto the per-task entries (fail-open: a non-EVIDENCE_RESULT shape — e.g. a
  // stray MergeResult — has no perTask, so nothing is stamped and the seats keep today's behavior).
  if (evidence && Array.isArray(evidence.perTask)) {
    const byId = new Map(evidence.perTask.map(p => [p && p.taskId, p]))
    for (const m of mergedTasksForGateAudit) {
      const p = byId.get(m.taskId)
      if (!p) continue
      m.observedHead = p.observedHead; m.pinStatus = p.pin_status; m.pinEvidence = p.pin_evidence
      m.guardSpecificity = p.guard_specificity; m.guardEvidence = p.guard_evidence
    }
  }
  // observedHead: the _refinery tip the gate-audit seat actually judges, stamped per task by the evidence
  // dispatch above. It is the pin-equality expectation for the gate-audit seat (D2) — NOT gateHeadSha:
  // under BENIGN-ADVANCE the observed tip legitimately differs from gateHeadSha, so checking
  // seat-vs-gateHeadSha would demote exactly the benign case. Absent (evidence dispatch failed/produced no
  // token) ⇒ fall back to gateHeadSha (fail-open — today's behavior).
  await parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria, gateHeadSha, observedHead, gateLogPath, pinStatus, pinEvidence, guardSpecificity, guardEvidence, baselineDebt: taskDebt }) => async () => {
    // Baseline-debt line (spec §6 / ADR 0019): a baseline-merged task carries its classified failing
    // identifiers so a pre-existing base failure in the gate output is NOT read as a provably-unrun
    // mapped test (which would fake a HARD hold). Empty/absent debt ⇒ '' ⇒ byte-identical prompt.
    const debtLine = (Array.isArray(taskDebt) && taskDebt.length)
      ? pt`\nBASELINE GATE DEBT: this task was merged over PRE-EXISTING base failures classified gate_failure_class:'baseline' — the failing identifiers below are pre-existing at the classification base, NOT evidence a mapped test did not run. A gate-output failure matching one of these is base debt, never a provably-unrun mapped test: ${taskDebt.join(', ')}.\n`
      : ''
    // D1 seat token consumption: the pin proof is a STAMPED token (gate-pin-status.sh, from the evidence
    // dispatch), not a hand-run recipe. guardLine surfaces the advisory guard-specificity evidence.
    const pinStatusLine = pinStatus
      ? pt`${pinStatus}${pinEvidence ? ` (cited evidence: ${pinEvidence})` : ''}`
      : '(no pin-status token — the evidence dispatch produced none)'
    const artifactLine = gateLogPath || '(no gate-log artifact path recorded)'
    const guardLine = guardSpecificity
      ? pt`\nGUARD SPECIFICITY (stamped by the same evidence dispatch): ${guardSpecificity}${guardEvidence ? ` — ${guardEvidence}` : ''}. An 'uncovered' token means a new die/stderr guard was added whose exact stderr message NO same-diff test asserts — emit a test-fidelity finding citing the guard message (severity/disposition are yours, ADR 0013). 'covered' / 'ERROR' / absent ⇒ no guard finding on this axis.\n`
      : ''
    const gateAuditVerdict = await agent(
      pt`POST-MERGE GATE-AUDIT for WAR task ${taskId} (lens: execution-evidence). `
      + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
      + pt`${refineryPath} (the _refinery worktree) and the gate ran at gate-HEAD sha ${gateHeadSha}.\n`
      + pt`Gate-HEAD sha (the rebased integration tip the gate ran at): ${gateHeadSha}.\n`
      + pt`PIN STATUS: ${pinStatusLine}. A stamped CONFIRMED or BENIGN-ADVANCE token IS the pin proof — the refiner's evidence dispatch already computed it (gate-pin-status.sh) against the observed _refinery tip ${observedHead || gateHeadSha}. Consume the stamped token; do NOT reconstruct the proof — you MAY spot-verify with a SINGLE read-only \`git -C ${refineryPath} cat-file -t <sha>\` or \`git -C ${refineryPath} rev-parse HEAD\` only if you doubt it.\n`
      + pt`CONFIRMED (observed tip == gate-HEAD) or BENIGN-ADVANCE (observed tip descends gate-HEAD and NONE of this task's own files changed in the intervening range) ⇒ the tree you judge corresponds to the current integration tip; a mapped acceptance-criteria test provably unrun AT that confirmed tip stays HARD.\n`
      + pt`STALE-MISMATCH / ERROR / an absent pin-status token ⇒ you CANNOT confirm the executed gate output corresponds to the current integration tip: record a SOFT note, never a HARD finding (the stale-tip defusing rule). The SOFT note MUST state: the observed HEAD sha (or "rev-parse failed"), the expected gate-HEAD sha ${gateHeadSha}, and the reason — "gate-audit worktree not at the integration tip — execution evidence unreliable, downgraded to SOFT, not a land-halt".\n`
      + pt`In ANY cannot-confirm / STALE-MISMATCH / ERROR case KEEP verdict at 'approve' or 'request_changes' WITH the SOFT note — NEVER 'escalate' (escalate is reserved for a plan that is wrong or underspecified; a finding-less escalate is treated as a HARD hold, so it must never be used to signal a stale/unconfirmable tip).\n`
      + pt`GATE LOG ARTIFACT: read the FULL captured gate log at ${artifactLine} (read-only Read) — this captured file, NOT the inline gate output below, is the AUTHORITATIVE execution evidence for a HARD provably-unrun determination. A MISSING artifact (no path, or the file cannot be read) ⇒ SOFT cannot-confirm for the HARD path (never a HARD finding); the inline gate output stays readable as NON-AUTHORITATIVE context.\n`
      + guardLine
      + pt`If the pin is CONFIRMED/BENIGN-ADVANCE, confirm the mapped acceptance-criteria test is present in the files at that tip `
      + pt`(read-only git / Read in ${refineryPath}), not merely inferred from the gate output text; record a `
      + pt`HARD gate-evidence finding ONLY when the mapped test is genuinely absent AT THE CONFIRMED INTEGRATION TIP and the captured artifact confirms it did not run.\n`
      + pt`Return the sha you actually reviewed as audit_sha (it should equal the observed tip ${observedHead || gateHeadSha}); the Lead compares it to the dispatched pin — a differing well-formed sha demotes your findings to SOFT (you judged a different tree).\n`
      + debtLine
      + pt`Acceptance criteria / plan slice: ${acceptanceCriteria || '(see plan file)'}\n`
      + pt`Executed gate output (NON-AUTHORITATIVE context — the captured artifact above is authoritative for the HARD path):\n${gateOutput || '(no gate output recorded)'}\n`
      + endStateBlock + intentClause
      + pt`\nDefault: SOFT. Hard only when provably unrun.`,
      { agentType: NS + 'war-auditor', phase: 'Audit',
        label: `gate-audit:${taskId}:execution-evidence`, schema: AUDIT_VERDICT, ...spawn('auditor') })
    // gate-evidence findings are SOFT (do not hold the land) UNLESS a mapped test is provably unrun (hard).
    // Hard case: the auditor records a Critical or Major finding on the execution-evidence lens, indicating
    // a mapped acceptance-criteria test present in the pre-merge diff is absent/0-count in the gate output.
    // Per Open decision #1 (resolved: operationally defined) — severity Critical/Major signals provably-unrun.
    if (gateAuditVerdict) {
      const rawFindings = gateAuditVerdict.findings || []
      // D2 pin-equality: the gate-audit seat's expected tip is observedHead (the tree it judged, stamped by
      // the evidence dispatch above); fall back to gateHeadSha when absent (fail-open — the evidence dispatch
      // failed/produced no token). Under BENIGN-ADVANCE the tip legitimately differs from gateHeadSha, so
      // equality is measured against observedHead, never gateHeadSha. A well-formed audit_sha differing from a
      // well-formed pin means the seat judged a different tree — tag pin-mismatch, EXCLUDE from the HARD path.
      const pin = observedHead || gateHeadSha
      const mismatch = pinMismatch(gateAuditVerdict.audit_sha, pin)
      const findings = mismatch ? rawFindings.map(f => ({ ...f, pinMismatch: true })) : rawFindings
      // D8: severity OR verdict gates the hard path — a finding-less `verdict === 'escalate'` is HARD by
      // design (defence-in-depth against a silent finding-less escalate landing); Minor/Nit stay SOFT-by-
      // default. A pin-mismatched seat is NEVER hard (fail-open): !mismatch gates the whole disjunct.
      const isHardGateEvidence = !mismatch &&
        (gateAuditVerdict.verdict === 'escalate' || rawFindings.some(f => f.severity === 'Critical' || f.severity === 'Major'))
      // Distinguish hard vs soft (and pin-mismatch) in the auditLog so the Lead can adjudicate even if held.
      // A mismatch entry is the SOFT absence-note (task, seat, both SHAs: auditSha vs expectedPin).
      auditLog.push({ task: taskId, verdict: `gate-audit:${gateAuditVerdict.verdict}`, findings, gateEvidence: true, hard: isHardGateEvidence,
        ...(mismatch ? { pinMismatch: true, expectedPin: pin } : {}), gateHeadSha, auditSha: gateAuditVerdict.audit_sha })
      if (isHardGateEvidence) {
        // HARD: a provably-unrun mapped test OR a finding-less escalate → push gate-evidence to escalated so the land is held.
        escalated.push({ task: taskId, reason: 'gate-evidence', detail: gateAuditVerdict })
      }
    }
  }))
  // ---- D4 — authoritative integrated-tip seat (intra-phase same-repo dep phase only) ----
  // On an intra-dep phase the evidence dispatch re-ran the FULL gate at the final integration tip; that
  // captured output is LAND-AUTHORITATIVE over the per-branch gates for the dep-crossing tasks (their
  // branches were gated before their dep's content landed). Dispatch ONE extra execution-evidence seat that
  // judges the union of the dep-crossing tasks' mapped criteria against it; findings route through the SAME
  // gate-evidence lane (severity OR the D8 verdict disjunct, identical to the end-state seat). The per-task
  // seats still ran (advisory for those tasks). FAIL-OPEN: no captured integrated-tip output ⇒ NO seat (the
  // per-task SOFT path already covers it). No pin-equality here — the seat judges the CONFIRMED final tip.
  const integratedTip = evidence && evidence.integratedTipGate
  if (intraDep && integratedTip && integratedTip.gate_output) {
    const depCrossingIds = new Set(tasks
      .filter(t => (t.deps || []).some(d => tasks.some(x => x.id === d && sameRepo(x, t)))
        || tasks.some(o => (o.deps || []).some(d => d === t.id && sameRepo(t, o))))
      .map(t => t.id))
    const authCriteria = mergedTasksForGateAudit
      .filter(m => depCrossingIds.has(m.taskId))
      .map(m => `- ${m.taskId}: ${m.acceptanceCriteria || '(see plan file)'}`).join('\n') || '(see plan file)'
    const authVerdict = await agent(
      pt`INTEGRATED-TIP GATE-AUDIT for WAR phase ${ph.id} (lens: execution-evidence — AUTHORITATIVE). `
      + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at ${refineryPath} at the FINAL integration tip ${integratedTip.tip_sha || '(tip sha unrecorded)'}, and the FULL gate was re-run there after the serial merge queue — this integrated-tip run is LAND-AUTHORITATIVE over the per-branch gates for the intra-phase dep tasks (their branches were gated before their dep's content landed).\n`
      + pt`Judge the union of the dep-crossing tasks' mapped acceptance criteria against this integrated-tip evidence. Record a HARD gate-evidence finding (Critical/Major) ONLY when a mapped test is provably unrun at this tip; a cannot-confirm is SOFT, never a hold; NEVER 'escalate' for a stale/unconfirmable tip (escalate is reserved for a wrong/underspecified plan).\n`
      + pt`Return the sha you reviewed as audit_sha (it should equal ${integratedTip.tip_sha || 'the integration tip'}).\n`
      + pt`Dep-crossing tasks' acceptance criteria:\n${authCriteria}\n`
      + pt`Integrated-tip gate output (AUTHORITATIVE — the land-decisive execution evidence):\n${integratedTip.gate_output}\n`
      + endStateBlock + intentClause
      + pt`\nDefault: SOFT. Hard only when provably unrun.`,
      { agentType: NS + 'war-auditor', phase: 'Audit',
        label: `gate-audit:phase-${ph.id}:integrated-tip`, schema: AUDIT_VERDICT, ...spawn('auditor') })
    if (authVerdict) {
      const findings = authVerdict.findings || []
      // Same gate-evidence lane as the end-state seat: severity OR the D8 verdict disjunct gates HARD.
      const isHard = authVerdict.verdict === 'escalate' || findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
      auditLog.push({ task: `phase-${ph.id}-integrated-tip`, verdict: `gate-audit:${authVerdict.verdict}`, findings, gateEvidence: true, hard: isHard, authoritative: true, auditSha: authVerdict.audit_sha })
      if (isHard) escalated.push({ task: `phase-${ph.id}-integrated-tip`, reason: 'gate-evidence', detail: authVerdict })
    }
  }
} else if (endStateClaims.length > 0) {
  // Roster-D7 preserved (Open decision 2): nothing to gate-audit per task, but this phase CLAIMS
  // End-state conditions — spawn ONE End-state-only seat at the confirmed tip, so a docs-only
  // phase cannot skip its own claimed conditions. The per-task pass's cost saving stands.
  log(`gate-audit: mergedTasksForGateAudit is empty but this phase claims ${endStateClaims.length} End-state condition(s) — spawning ONE End-state-only seat at the confirmed tip (D7 cost saving preserved for the per-task pass).`)
  const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
  const esVerdict = await agent(
    pt`END-STATE-ONLY GATE-AUDIT for WAR phase ${ph.id} (lens: execution-evidence). `
    + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
    + pt`${refineryPath} (the _refinery worktree).\n`
    + pt`Confirm the tip first: run \`git -C ${refineryPath} rev-parse HEAD\` (read-only git, permitted) and report it as your audit_sha. `
    + pt`If the command cannot run, every condition below is unverifiable — SOFT notes only, never a hold.\n`
    + pt`In any cannot-confirm case KEEP verdict at 'approve' or 'request_changes' WITH the SOFT note — NEVER 'escalate' (a finding-less escalate is a HARD hold, reserved for a wrong/underspecified plan; it must never signal an unconfirmable tip).\n`
    + endStateBlock + intentClause,
    { agentType: NS + 'war-auditor', phase: 'Audit',
      label: `gate-audit:phase-${ph.id}:end-state`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  if (esVerdict) {
    const findings = esVerdict.findings || []
    // D8: severity OR a finding-less `verdict === 'escalate'` gates the hard path (identical disjunct to the
    // per-task gate-audit site); Minor/Nit stay SOFT-by-default. This end-state-only seat (nothing merged) is
    // EXEMPT from the D2 pin-equality demotion — no evidence dispatch supplies its observed tip, so fail-open
    // (no pin, no demotion). Its own prompt already SOFT-downgrades a tip it cannot confirm.
    const isHard = esVerdict.verdict === 'escalate' || findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
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
    // dispatchKind: 'polish-worktree' (stable discriminator — keyed by mocks/handlers, not the label prefix).
    const polishProv = await agent(
      pt`Provision the phase-close POLISH worktree for WAR phase ${ph.id} by running provision-worktrees.sh. Do NOT free-author git; run exactly:\n`
      + pt`  provision-worktrees.sh ensure-worktree ${polishWorktree} ${polishBranch} "$(git -C ${refineryLandPath} rev-parse ${ph.integrationBranch})"\n`
      + pt`— the polish worktree is cut at the POST-MERGE integrated tip (idempotent; reuse if present). Return the env-outcome JSON: \`{ ok: true }\` when the ensure-worktree subcommand exits 0; on a non-zero exit return \`{ ok: false, failedCommand: "<the exact subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr>" }\`.`,
      { agentType: NS + 'war-refiner', phase: 'Refine', label: `polish-worktree:phase-${ph.id}`, dispatchKind: 'polish-worktree', schema: ENV_OUTCOME, ...spawn('refiner') })
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
      pt`PHASE-CLOSE COHERENCE SWEEP for WAR phase ${ph.id} "${ph.title}". Work in the ALREADY-PROVISIONED polish worktree at ${polishWorktree} (branch ${polishBranch}, cut at the post-merge integrated tip of ${ph.integrationBranch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
      + intentClause
      + pt`Fix ONLY the queued findings below — NO ad-hoc seam hunting (the bounded, enumerated scope is what makes discard-on-reject a sufficient guard), NEVER touch version/release-slot literals, make EXACTLY ONE commit whose message cites each finding's title, keep the gate (${plan.gate}) green, and push ${polishBranch}.\n`
      + pt`Queued findings (verbatim):\n`
      + phaseCloseQueue.map((f, i) => `${i + 1}. [${f.severity}] ${f.title} (task ${f.task}${f.file ? `, ${f.file}` : ''}${f.line ? ':' + f.line : ''}) — ${f.rationale || ''}${f.suggested_fix ? ` → ${f.suggested_fix}` : ''}`).join('\n') + pt`\n`
      + pt`Merged tasks' plan slices (context for cross-task coherence at the integrated tip):\n${mergedSlices || '(none)'}`
      + provisionClause,
      { agentType: NS + 'war-worker', phase: 'Work', label: `polish:phase-${ph.id}`, schema: WORKER_RESULT, ...spawn('worker') })
    // 3. Full auditRound panel re-audit at the polish SHA — same unanimity rules as any task.
    const sweepWhy = blockedReason(sweep)
    let sweepApproved = false
    if (!sweepWhy) {
      const { seats: pSeats, expected: pExpected } = await auditRound(polishTask, null, sweep && sweep.tests ? sweep.tests : null, sweep && sweep.head_sha)
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
        pt`Merge WAR polish branch ${polishBranch} into ${ph.integrationBranch} at the serial merge queue's tail. mode=merge-task.\n`
        + reattachClause(refineryLandPath)
        + pt`  (a) REBASE in the POLISH worktree: git -C ${polishWorktree} rebase ${ph.integrationBranch} (the branch was cut at the integrated tip, so this is normally a no-op).\n`
        + pt`  (b) MERGE in _refinery: cd ${refineryLandPath} (on ${ph.integrationBranch}), then git merge ${polishBranch} (fast-forward merge). Push.\n`
        + pt`Run the gate (${plan.gate}) after the rebase in the polish worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)). The polish commit is a coherence sweep, not a mapped-test task — skip assert-test-in-diff.sh AND skip the packaging floor assert-packaging-in-diff.sh (a coherence sweep has no task fields to consult). This sweep is class-exempt — on gate failure return gate_failed (no classification); the Workflow fail-open DISCARDS. On conflict return conflict; never force.`,
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

// Reland-loop transient-vs-divergence discrimination (Task 1.2 / D4). BYTE-PARALLEL with
// agents/war-refiner.md §land-phase (grep parity — the mirror-drift hazard, spec §8): both surfaces
// state the identical discrimination AND the identical +1 budget. Shared here so the in-flow land
// prompt and the baseline-proceed re-land prompt cannot drift from each other either. A resolved
// transient returns 'landed' — NO new status/enum member — so the existing servitorResult gate fires.
const relandDiscrimination = (working) =>
  pt`     - On the FINAL failed CAS attempt (after roundLimit rejected pushes), before returning land_stale, discriminate a contender-less transient from a real divergence: run \`git fetch origin ${working} && git rev-list --left-right --count <merge-sha>...origin/${working}\` — the merge sha the loop just tried to push vs. the freshly-fetched origin tip, NEVER the local follower refs/heads/${working} (it lags). Right count 0 (contender-less transient: every commit on the fetched origin tip is already contained in the merge sha, so no competing commit exists and the rejection cannot be a lost CAS) buys exactly one extra push-first attempt beyond roundLimit exhaustion (an explicit +1, once — not a slot inside roundLimit): re-fetch, re-detach at origin/${working}, re-merge --no-ff, re-gate, land-advance; if that extra attempt also fails, return { mode: 'land-phase', status: 'land_stale' } (topology exhaustion / CAS failure, NOT a content conflict). Otherwise a nonzero right count (real contender commits on origin) is a real divergence: return { mode: 'land-phase', status: 'land_stale' } immediately, with no extra attempt. A transient that resolves returns status: 'landed' — no new status, so the servitor wrap-up fires automatically.\n`

if (landDecision === 'landed') {
  // For a submodule phase: thread targetRepo + targetBase so the refiner knows to perform a
  // submodule-aware land (2A CAS inside the submodule repo, or 2B PR-and-hold on the submodule remote).
  const submodLandTask = tasks.find(t => t.taskType === 'submodule')
  const submodLandNote = submodLandTask && submodLandTask.targetRepo
    ? pt`\nSUBMODULE PHASE: this phase includes a submodule task. Target repo: ${submodLandTask.targetRepo}. `
      + pt`Submodule base: ${submodLandTask.targetBase || '<targetBase>'}. `
      + pt`For the submodule land: attempt 2A — push-first CAS land-advance INSIDE ${submodLandTask.targetRepo} against ${submodLandTask.targetBase || '<targetBase>'}. `
      + pt`If the submodule is not WAR-owned or 2A is unavailable, open a PR on the submodule remote and return { mode: "land-phase", status: "submodule-pr", pr_number: <n>, pr_remote: "<remote>" } (2B PR-and-hold).`
    : ''
  landResult = await agent(
    pt`Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + pt`Perform the land entirely inside the _refinery worktree at ${refineryLandPath} (spec §5.3, push-first CAS):\n`
    + reattachClause(refineryLandPath)
    + pt`  1. In ${refineryLandPath}: detach HEAD at origin/${ph.workingBranch} (`
    + pt`\`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`). `
    + pt`This is the detached land — never checkout the working branch by name in _refinery.\n`
    + pt`  2. Merge: \`git -C ${refineryLandPath} merge --no-ff ${ph.integrationBranch}\` (one phase commit). Run the gate (${plan.gate}) with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed.\n`
    + classificationClause(refineryLandPath, pt`the detached origin/${ph.workingBranch} tip the merge lands onto (\`git -C ${refineryLandPath} rev-parse origin/${ph.workingBranch}\`) — a stacked working branch carries prior plans' content the phase integration base lacks, so the land uses the working tip, NOT the integration base`)
    + baselineDebtClause()
    + pt`  3. Push-first CAS: run \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\` where <merge-sha> is HEAD in _refinery after the merge.\n`
    + pt`     - On clean push success (exit 0 from land-advance): the land succeeded. Return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }.\n`
    + pt`     - On reland exit code (rejected push — origin/${ph.workingBranch} moved): re-fetch origin/${ph.workingBranch}, re-merge, re-run gate, retry land-advance. `
    + pt`Repeat up to roundLimit (${roundLimit}) times total.\n`
    + relandDiscrimination(ph.workingBranch)
    + pt`     - On escalate exit code from land-advance (any non-rejection push error): return { mode: 'land-phase', status: 'error' }.\n`
    + pt`Never use --force push. Never merge or push from the Lead's main checkout.`
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
      pt`BASELINE-PROCEED re-land for WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff. mode=land-phase.\n`
      + reattachClause(refineryLandPath)
      + pt`The prior land gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the detached origin/${ph.workingBranch} tip, NOT introduced by this phase: ${(landResult.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
      + pt`  1. Detach at origin/${ph.workingBranch}: \`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`.\n`
      + pt`  2. Merge --no-ff ${ph.integrationBranch}; run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that set is a real regression → return { mode: 'land-phase', status: 'gate_failed' } classifying the NEW failure.\n`
      + pt`  3. Push-first CAS: \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\`. Reland up to roundLimit (${roundLimit}); error on a non-rejection push error. On success return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }. Never --force.\n`
      + relandDiscrimination(ph.workingBranch),
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
    pt`Wrap up learnings for WAR phase ${ph.id} "${ph.title}" (landed on ${ph.workingBranch}).\n`
    + pt`Your ONLY writable path (your capability allowlist holds no Bash — Write/Edit only — and the PreToolUse scope hook gates those by agent_type to the local memory root): ${memoryLocalRoot}.\n`
    + pt`Every lesson file — regardless of metadata.type — is written under that local root. type: project marks a lesson PROMOTABLE (the Lead's Gate 2 promotes it into the repo root); NEVER write into any docs/learnings/ directory yourself — repo-root publication is the Lead's job, not yours.\n`
    + pt`Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + pt`Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + pt`Escalations: ${JSON.stringify(escalated)}\n`
    + pt`Noted findings (disposition 'note' — MEMORY CANDIDATES, not issues; weigh each against the admission checklist below): ${JSON.stringify(notes)}\n`
    + intentClause + servitorMemClause()
    + pt`Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.\n`
    + pt`\n`
    + pt`Memory admission checklist — follow ALL three disciplines before every write:\n`
    + pt`D1 DEDUP BEFORE WRITE: Glob the memory dir and read MEMORY.md. Read related candidate files. If an existing covering file exists, update that file in place — do not duplicate — BUT only when it bears a nested metadata.provenance value; a covering file WITHOUT one is user-authored, never edit it — write a new file and [[slug]]-cross-link it. Create a new file only when no existing file covers the fact. RECURRENCE ON A REPO LESSON: when the covering lesson lives in the repo root (docs/learnings/), write the updated FULL COPY into your local root under the SAME slug with type: project (a prior promotion's metadata.promoted-stamped local copy, when present, is the canonical recurrence-edit target and is provenance-tagged so the mutation guard allows the edit); the Lead's Gate-2 promotion then OVERWRITES the same-slug repo file (overwrite-on-promote is the ratified update mechanism). Cross-link related facts with [[slug]] references.\n`
    + pt`D2 TIER PRECEDENCE: A higher tier supersedes a lower; a user-confirmed fact outranks any agent write; never overwrite a higher-tier fact with a lower-tier one. A contradicting fact supersedes an existing memory only if it is at the same or higher tier — update or replace the stale file and note the supersession inline with the tier that wins. Only a provenance-tagged file is supersession-editable; to contradict an UNTAGGED (user-authored) file, write a NEW file carrying the supersession note inline and leave the old file untouched.\n`
    + pt`D3 VERIFY-ON-WRITE: Before recording any fact that names a file, flag, function, or symbol: use Read/Grep to confirm the referent currently exists. Referent found → tag metadata.provenance: code-verified and include the cue "verify still present before acting — found at skills/war/assets/workflow-template.js @ phase X". Referent absent → keep metadata.provenance: agent-unverified and add an absence-note: "referent not found @ phase X — verify before acting". PATH HYGIENE (both arms): any path written anywhere in the lesson file — body, description, metadata.keywords, locate-cues, and absence-notes, for every lesson type (the Gate-2 lint scans the whole file, and type is mutable across recurrence-updates and promotion) — is written repo-relative for any referent tracked in this repo (e.g. skills/war/assets/workflow-template.js), or as one of three placeholders for out-of-tree locations: <repo-root> for the root of the inspected checkout (an untracked under-checkout location like .claude/worktrees/…, or when the root itself is the fact — this replaces the servitor's absolute cwd prefix); <session-worktree> for a path meaningful only inside the ephemeral session/task worktree; <local-memory-root> for a file under the local memory root (the memory-about-memory case, legitimate in a locate-cue). A referent living in another repo (a cross-repo campaign) is written relative to that repo, prefixed with that repo's name. It is never an absolute path rooted at a home directory or a checkout location: that checkout path is incidental, and the fail-closed Gate-2 redaction lint demotes any type: project lesson carrying one. CARVE-OUT: this path-hygiene rule governs lesson content only — the ServitorResult.files_written return contract (see RETURN below) still requires ABSOLUTE paths and is unchanged. Do not write snapshot facts that will rot silently.\n`
    + pt`FINDING-MATCH CHECK (audit-log-sourced facts): an audit finding in your input is agent monologue about a defect that WAS observed — a fix round may have removed it before land. Before recording such a finding as a LIVE gotcha, re-Grep/Read the NAMED CONSTRUCT (the specific defect, not merely the file it lived in) at the landed tip (your post-land working tree IS the committed tip — no new capability needed). Match → tag metadata.provenance: code-verified with the locate-cue. No match (resolved in a fix round before land) → record only the GENERIC PATTERN at metadata.provenance: agent-unverified with the note "audit finding resolved in a fix round before land — recorded as pattern, not live instance", and NEVER name the file/line as a current instance.\n`
    + pt`\n`
    + pt`Provenance tagging — tag EVERY memory file you write with metadata.provenance (nested under metadata:, next to type:). Use only the three canonical tiers: agent-unverified (default — the input is LLM-authored audit monologue), code-verified (D3 referent confirmed via Read/Grep), user-confirmed (operator/user explicitly confirmed). Retire legacy agent-observed: treat it as agent-unverified and never emit it going forward.\n`
    + pt`\n`
    + pt`RETURN: every path in your ServitorResult files_written MUST be an ABSOLUTE path under ${memoryLocalRoot} (the Lead's Gate-2 reconciliation is an absolute-prefix check; a relative or out-of-root path fails the phase loud).`,
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

return { phase: phaseId, landed, escalated, minorsFiled, aced, notes, landResult, servitorResult, auditLog, landDecision, ...(handoff ? { handoff } : {}) }
} catch (err) {
  // A dead phase that self-reports. landed/escalated are whatever accumulated before the throw;
  // teardown is NOT run (git state kept for resume/inspection). NO handoff block here (ADR 0013):
  // infra death has no trustworthy return to render — the ledger + issues are the record.
  return { phase: phaseId, landed, escalated, minorsFiled, aced, notes, landResult: null,
           servitorResult: null, auditLog,
           landDecision: 'held:workflow-error',
           workflowError: { message: String(err && err.message || err), stack: err && err.stack } }
}
