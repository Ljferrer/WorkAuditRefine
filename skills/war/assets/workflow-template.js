// COUPLING (ADR 0037): stage-workflow.mjs mirrors the meta.name and meta.description literals below as
// its NAME_ANCHOR / DESCRIPTION_ANCHOR exports (its own byte copy — the Workflow sandbox cannot import
// this module). Change a byte in either field below and you MUST update stage-workflow.mjs in lock-step;
// the imported-constant anchor guard in stage-workflow.test.mjs is the arbiter. This comment stays
// REFERENTIAL — it never restates either anchor's bytes, which would trip that exactly-once guard.
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
//   { phase: { id, title, integrationBranch, workingBranch, epicIssue?, endState?: [row|condition] },
//              // endState: the Commander's-Intent End-state conditions THIS phase claims (Lead-mapped),
//              // widened rows { condition, tag, check } (schemas.md; parsed Lead-side per Task 3.1) — a
//              // legacy bare-string entry normalizes to { condition, tag: null, check: null }, the
//              // judgment path (End state 9). check:-tagged rows are EXECUTED once per phase by the
//              // land-barrier endstate-check dispatch (D2/F5); all rows are verified artifact-first by
//              // the gate-audit pass — conditions owned by a later phase, OR by a deps-chained
//              // sibling task of THIS phase not yet landed at the audit's scope, are out-of-scope there,
//              // never a hold
//     plan:  { file, gate, testPattern },  // gate = a shell command, run BY agents (this script has no
//                                     // shell/fs). testPattern = the per-phase-RESOLVED overrides.testPattern
//                                     // the Lead threads at this phase's launch (string|null; absent ⇒ null
//                                     // — the plan.gate precedent), appended VERBATIM as the
//                                     // assert-test-in-diff.sh `--pattern '<value>'` arg at every dispatched
//                                     // merge-task floor invocation site; null ⇒ bare, byte-identical to today.
//     tasks: [ { id, issue, title, branch, worktree, deps:[id],
//                roster:[{ lens, depth? }], planSlice, doneWhen?, files:[<repo-relative plan paths>], requiresTest?, requiresPackaging?, pendingAbsorbs? } ],  // roster: 1–5 distinct-lens audit seats; depth omitted → 'deep'.
//                                     // pendingAbsorbs = RELAUNCH-SEED ONLY ([finding rows] held by a blocker-held batch ace at a prior launch); aceStage folds
//                                     // them into the next approve's ace batch through the same routing chain as fresh rows. Absent ⇒ nothing folds.
//                                     // planSlice = the task charter (REQUIRED non-empty string — the entry-validation
//                                     // TASK-FIELD class (D5) refuses a missing/empty slice at intake naming the field).
//                                     // doneWhen = the task's `Done when:` acceptance command (string|null; absent/null ⇒ legacy —
//                                     // doneWhenClause AND doneWhenFloorClause render '' — every prompt is byte-identical to a
//                                     // doneWhen-less run and the assert-done-when.sh floor never runs, End state 9; any
//                                     // OTHER present type is refused at intake by the same TASK-FIELD class, never coerced).
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
//     ghUser,                         // optional expected gh account for the file-followups preflight (from
//                                     // overrides.ghUser; string, default '' — gh-preflight.sh's documented no-op)
//     agents: { worker|auditor|refiner|servitor: { model, effort } },  // from .claude/war/config.json (resolved by the Lead); defaults below.
//                                     // worker may also carry { docs?, fix? } { model, effort } sub-tiers: docs = the all-*.md first-pass tier (opus default), fix = the fix-round + --ace tier (absent ⇒ inherit worker).
//     audit:  { roster, rosterPolicy, autoEscalate },                  // rosterPolicy 'auto' = Lead composes each task.roster from the catalog (Lead-side); audit.roster is the widening FALLBACK roster (auditor-nominated-or-default, D4); autoEscalate used here
//     absorbCharges?,                 // optional { <task>: n } Lead override of the barrier's Ace-Charge read at a relaunch — read unconditionally
//                                     // (no recovery gate); wins over the barrier map, logged; a non-object map is logged and ignored.
//     run:    { roundLimit, absorbRounds, maxParallel, afk },          // roundLimit used here; absorbRounds = the per-task absorb budget (the ace
//                                     // ladder's own meter, D5; absent ⇒ 6, the DEFAULTS.run.absorbRounds mirror); afk gates recordAced's
//                                     // citation unpark (#1879 RULING 1 — otherwise Lead-side)
//                                     // maxParallel (optional positive integer) is the GLOBAL ceiling on agent dispatches
//                                     // in flight across the whole run, held by one counting semaphore at the leaf dispatch
//                                     // seam; absent/null ⇒ agent() is called straight through, a byte-identical dispatch path
//     backstops }                     // array|null of { check, why, runner, source:'plan'|'auto', aiDeclared? } — every
//                                     // validation this phase deferred (Lead is the single normalization point: plan-declared
//                                     // + Setup auto-recorded merged here). Passed through UNTOUCHED into handoff.backstops[].
//                                     // null = legacy plan with no backstop section. Empty/absent ⇒ handoff.backstops = null.
// auditors receive the absolute worktree path and self-serve the change set via read-only git (git diff <integrationBranch>...<task.branch>, three-dot); no main-checkout baseline.
// The Lead may inject APPROVED extra stages ONLY by editing the run-scoped, per-phase STAGED copy — the
// stage-workflow.mjs output under $MAIN/.claude/war/runs/<runId>/ (ADR 0037), which is the sanctioned
// home for approved stage injection — never the shipped file itself; never free-author the core loop.
// ---------------------------------------------------------------------------

const WORKER_RESULT = { type: 'object', required: ['task_id', 'status'], properties: {
  task_id: { type: 'string' }, branch: { type: 'string' }, worktree: { type: 'string' }, head_sha: { type: 'string' },
  status: { enum: ['implemented', 'blocked'] },
  tests: { type: 'object' }, acceptance_criteria_covered: { type: 'array' }, files_changed: { type: 'array' },
  // ace_diff_files (#1913, D3/PIN-18 — the mappedTests precedent): the GIT-derived changed-file list of
  // an ace commit, filled by the ace/bisection/re-entry worker from `git diff --name-only <preAceTip>
  // <aceSha>`. It is the ONLY input to the delta-scaled re-audit's subset rule; the agent's own
  // files_changed is a CROSS-CHECK, never the source. OPTIONAL — absent or empty routes the FULL panel
  // (fail-closed), so every non-ace worker result stays byte-identical to today.
  ace_diff_files: { type: 'array' },
  notes: { type: 'string' }, blocked_reason: { type: 'string' } } }

// BARRIER_TOKENS mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
// The seat's structured `barrier` enum (in-band-absorb-default D1, PIN-1/PIN-2): three follow-up
// barriers plus barrier:trade-off, an ask route. The AUDIT_VERDICT finding schema and the dispatched
// DISPOSITION RULE render from this ONE array; the auditor card sentence and disposition-eligibility.md
// list the same four by hand, and the D2 mirror-registry `barrier-list` rows bind all of them.
const BARRIER_TOKENS = ['barrier:release-slot', 'barrier:underspecified', 'barrier:rationale-comment', 'barrier:trade-off']
// RELEASE_SLOT_FILES mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
// The two pure version-slot JSONs (in-band-absorb-default D2, PIN-3/PIN-11) refused from the per-task
// ace, the sweep, and the terminal pass. aceEligible and the sweep exclusion set match on the BASENAMES
// derived from this list through the one releaseSlotBasename helper below (sub/dir/plugin.json refused,
// plugin.json.bak not); the `sweep-exclude` mirror-registry row binds this copy to the export.
const RELEASE_SLOT_FILES = ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']
// DEMOTE_REASONS mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
// The closed prefix enum every engine follow-up demotion cites (in-band-absorb-default D13, PIN-15):
// demote() validates each follow-up reason against it and on a miss prepends 'demote:unclassified'
// (a member) with a loud log, never a throw. The `demote-census` mirror-registry row binds this copy.
const DEMOTE_REASONS = ['demote:absorb-regressed', 'demote:absorb-blocked', 'demote:fileless', 'demote:task-unapproved', 'demote:sweep-skipped', 'demote:sweep-discarded', 'demote:terminal-pass', 'demote:exclusion-set', 'demote:release-slot', 'demote:floor-skipped', 'demote:ask-unruled-afk', 'demote:unclassified']
const AUDIT_VERDICT = { type: 'object', required: ['seat', 'lens', 'verdict', 'findings', 'confidence'], properties: {
  seat: { type: 'string' }, lens: { type: 'string' }, audit_sha: { type: 'string' },
  verdict: { enum: ['approve', 'request_changes', 'escalate'] },
  findings: { type: 'array', items: { type: 'object', required: ['severity'], properties: {
    severity: { enum: ['Critical', 'Major', 'Minor', 'Nit'] }, title: { type: 'string' }, file: { type: 'string' },
    line: { type: 'number' }, rationale: { type: 'string' }, suggested_fix: { type: 'string' }, plan_ref: { type: 'string' },
    // Disposition routing (ADR 0013): auditor-owned, orthogonal to severity. Omitted → the engine
    // default: a fully specified Minor/Nit (non-empty suggested_fix) on a task whose diff probe ran
    // reads absorb (in-diff) or absorb + phaseClose:true (out-of-diff); otherwise the severity default
    // (Minor → follow-up, Nit → note; 'ask' is never defaulted) — dispositionOf, in-band-absorb-default
    // D1/D4. phaseClose:true routes an absorb to the phase-close queue.
    // autoFixable is DEPRECATED — legacy alias for disposition:'absorb', honored one release, removed next release.
    disposition: { enum: ['absorb', 'follow-up', 'note', 'ask'] }, phaseClose: { type: 'boolean' },
    // barrier (in-band-absorb-default D1): OPTIONAL, the structured reason a fully specified finding
    // routes follow-up instead of the absorb default — one of the inline BARRIER_TOKENS mirror; prose
    // is never a barrier. barrier:trade-off is meant for ask (the intake floor reroutes it to ask when
    // the ask field is present). A barrierless seat follow-up is rerouted to absorb by the same floor.
    barrier: { enum: BARRIER_TOKENS },
    autoFixable: { type: 'boolean' },
    // ask (#1550, ADR 0013 amendment 2026-08-25): the question+fork field — MANDATORY on a
    // disposition:'ask' finding (the items-level if/then below, mirroring the top-level
    // escalate-boundary conditional): question is the decision needed, fork the two branches the
    // operator rules between at the Checkpoint strike-list gate. Minor/Nit-only by construction:
    // dispositionOf is reachable only through the severity filter — Critical/Major findings route
    // via blockingOf and never carry a disposition.
    ask: { type: 'object', required: ['question', 'fork'], properties: {
      question: { type: 'string', minLength: 1 },
      fork: { type: 'array', items: { type: 'string' }, minItems: 2 } } },
    // citation (in-run-finding-resolution D6, absorb-by-citation): OPTIONAL on a disposition:'absorb'
    // finding whose NAMED trade-off is covered by a threaded standing adjudication row — `row` is the
    // row's identifying text, `rationale` the one-line match rationale. The engine stamps both into
    // the ace/re-entry commit message and the `aced` record, and the re-audit panel for a
    // citation-resolved batch is explicitly charged with citation soundness. Ambiguity is NO-match:
    // park the ask instead (match strictness, PIN-6). CONTRACT (both prompt layers mirror it): a
    // citation-carrying absorb KEEPS the parked ask's `ask` field verbatim (question + fork) — the
    // schema mandates `ask` only on disposition:'ask', so the echo is what lets recordAced's
    // content-key match resolve the parked record under `--afk`, or attach the Checkpoint prefill
    // interactively (a miss is logged in either mode, never a silent no-op).
    citation: { type: 'object', required: ['row'], properties: {
      row: { type: 'string', minLength: 1 }, rationale: { type: 'string' } } },
    // citationUnsound (D6 soundness duty): set true on a BLOCKING re-audit finding whose rationale
    // names why a cited standing row does NOT cover the batch finding's named trade-off — the batch
    // is forward-reverted and the citation-carrying finding demotes naming the mismatch.
    citationUnsound: { type: 'boolean' } },
    if: { properties: { disposition: { const: 'ask' } }, required: ['disposition'] },
    then: { required: ['ask'] } } },
  tests_verified: { type: 'object' }, confidence: { enum: ['high', 'medium', 'low'] }, escalate_reason: { type: 'string' },
  // widen (D4): optional catalog lenses a lone seat nominates for auto-escalate widening; honored only
  // on the lone-seat trigger (resolveWidenSource validates whole-field), ignored elsewhere. Not required.
  widen: { type: 'array', items: { type: 'string' } },
  // scopeBreach (#1913, PIN-18): a delta-scaled re-audit seat re-ran `git diff --name-only` itself and
  // found a changed file OUTSIDE the ace worker's claimed ace_diff_files set. Optional, absent by
  // default. It refuses the seat-approval transfer and re-runs the FULL panel — it is never a finding
  // severity and never a status; the two file arrays come from one agent, so the seat is the
  // independent checker that keeps the subset rule honest.
  scopeBreach: { type: 'boolean' },
  // endStateAttestations (D8, precision-chain Task 3.2): the POSITIVE End-state channel — returned by
  // the three gate-audit-family seats ONLY (per-task (post-merge), integrated-tip, end-state-only;
  // the shared endStateBlock carries the requirement), one row per claimed condition: condition VERBATIM (the
  // plan_ref key), status met|unmet|unverified, evidence citing what the seat actually READ (the teed
  // per-condition artifact for a check:-tagged condition, the captured gate log for a gate:-tagged one,
  // the named observable for a judged one) — never a bare verdict. Ordinary roster seats never carry
  // it. Findings stay DEFECT-ONLY (findings carry defects; attestation rides endStateAttestations — two
  // separate contracts): a status claim never rides a finding.
  endStateAttestations: { type: 'array', items: { type: 'object', properties: {
    condition: { type: 'string' }, status: { enum: ['met', 'unmet', 'unverified'] }, evidence: { type: 'string' } } } } },
  // ESCALATE-BOUNDARY intake contract (gate-audit-finding-routing Task 2.1, #1410 fix 1): a non-empty
  // escalate_reason is required when verdict is escalate — the if/then conditional below. Enforcement
  // arm RECORDED by the Task 2.1 worker probe (2026-08-15, code-read of the running agent({schema})
  // layer, harness v2.1.228): the layer Ajv-compiles this FULL schema (allErrors) and a non-conforming
  // StructuredOutput return throws a schema-mismatch that re-prompts the seat (bounded conform-or-retry)
  // — so the conditional IS enforced at intake. The layer's separate strict-schema deriver (keyword
  // allowlist, no if/then) already falls back to non-strict on this schema today (tests_verified has no
  // properties), so the retry loop was and stays the enforcement point: a persistently non-conforming
  // seat falls into the existing dropped-seat → audit-blocked lane (seats.length < expected), so there
  // is no NEW hold path (A8, #1410) — a reason-less escalate already held as held:escalation; the
  // outcome class is unchanged. Prose mirrors (same commit): agents/war-auditor.md verdict list
  // + Return shape, the dispatched auditPrompt ESCALATE-BOUNDARY clause, the schemas.md AuditVerdict row.
  if: { properties: { verdict: { const: 'escalate' } }, required: ['verdict'] },
  then: { properties: { escalate_reason: { type: 'string', minLength: 1 } }, required: ['escalate_reason'] } }

const MERGE_RESULT = { type: 'object', required: ['mode', 'status'], properties: {
  mode: { enum: ['merge-task', 'land-phase'] },
  status: { enum: ['merged', 'landed', 'gate_failed', 'conflict', 'error', 'land_stale', 'no-test', 'unpackaged', 'done-unmet', 'submodule-blocked', 'submodule-pr'] },
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
  // floor_diagnostic (spec §6 / D6): the VERBATIM stderr of an exit-1 assert-test-in-diff.sh run — the
  // near-miss diagnostic (the diff carries test-shaped files the ACTIVE pattern set does not match).
  // merge-task only. FAIL-OPEN ADVISORY: it is interpolated into the ADD_TEST fix prompt and the no-test
  // exhaustion detail and is NEVER routed on — absent/empty ⇒ every consumer is byte-identical to a
  // diagnostic-less run. Orthogonal to status exactly like gate_failure_class — NO status enum value,
  // HARD_ESCALATION_REASONS member, or KNOWN_LAND_DECISIONS member is added or changed (land-decision.mjs
  // and both hand-mirrored enum blocks byte-untouched, ADR 0005).
  floor_diagnostic: { type: 'string' },
  // mappedTests (precision-chain D7, Task 2.3): ALL test paths assert-test-in-diff.sh matched in the
  // task diff, captured from its exit-0 stdout (one per line — Task 2.2's accumulating scan).
  // merge-task only, OPTIONAL (fail-open — absent ⇒ the gate-audit seat keeps its SOFT cannot-confirm
  // path). The gate-audit pass greps these paths against the captured gate log (the mappedTestsLine
  // threaded into the per-task seat, Task 3.2), making the HARD "provably unrun mapped test"
  // determination mechanical — HARD only where the log ENUMERATES test file paths (the round-3
  // enumeration-conditional; a titles-only node-reporter half degrades SOFT, never a false hold).
  mappedTests: { type: 'array' },
  // done_when_log_path (done-when-floor-wiring D3/D4): the ABSOLUTE path of the .war/done-when-<taskId>.log
  // artifact the merge-task tees the done-when floor's combined stdout+stderr to — gate_log_path's
  // done-when sibling, read with the floor's own exit status preserved across the tee (D14). merge-task
  // only, OPTIONAL, returned on the floor's exit-1 (done-unmet) branch. FAIL-OPEN ADVISORY: its only
  // consumers are the MAKE_DONE_PASS fix prompt (which names the path — the fix-worker reads the file)
  // and the done-unmet exhaustion detail, and it is NEVER routed on — absent ⇒ every consumer is
  // byte-/shape-identical to an artifact-less run. Orthogonal to status exactly like gate_failure_class —
  // NO status enum value, HARD_ESCALATION_REASONS member, or KNOWN_LAND_DECISIONS member is added or
  // changed (land-decision.mjs and both hand-mirrored enum blocks byte-untouched, ADR 0005).
  done_when_log_path: { type: 'string' },
  // floor_route (Budget-Raise floor, engine-reliability Phase 2 Task 2): the in-band budget-uncited
  // route marker — the literal 'budget-uncited' riding status:'no-test' when assert-budget-raise-cited.sh
  // exits 1 (an uncited prompt-surface ceiling raise). merge-task only, OPTIONAL. Orthogonal to status
  // exactly like gate_failure_class — NO status enum value, HARD_ESCALATION_REASONS member, or
  // KNOWN_LAND_DECISIONS member is added or changed (the red-team adjudication rules MERGE_RESULT status
  // widening outside the pre-authorization; the segmented-land precedent: an in-band field, never a
  // status member). Absent ⇒ every consumer is byte-identical to a budget-floor-less run (set-minus).
  floor_route: { enum: ['budget-uncited'] },
  // land_segment (Phase 6 Task 1 (a), A6 REVISED): the in-band segmented-land marker — the literal
  // 'incomplete' riding status:'error' when the land dispatch is FORCED to return before the land
  // completes (the gate outran the tool timeout). land-phase only, OPTIONAL. Orthogonal to status
  // exactly like floor_route — NO status enum value, HARD_ESCALATION_REASONS member, or
  // KNOWN_LAND_DECISIONS member is added or changed (land-decision.mjs untouched, ADR 0005). The
  // Workflow re-dispatches the land while the marker persists (FLOOR_STATUSES retry-loop idiom,
  // bounded by roundLimit); exhaustion routes the ridden status ('error' → held:land-failed).
  // segment_note: free-text progress note — rendered into the continuation log line only, never routed on.
  land_segment: { enum: ['incomplete'] },
  segment_note: { type: 'string' },
  pr_number: { type: 'number' }, pr_remote: { type: 'string' } } }

// GATE_CHECK (#1913, PIN-12; arm-split #1951): the read-only gate run at an ace tip. No audit
// approval — re-run or transferred — is ever accounted at a SHA the gate never passed, so every
// ace-family commit is gated BEFORE its re-audit. The GREEN arm requires head_sha at the validator
// (if/then): a terse green reply is re-asked at the tool layer, never reverted. The red arm stays
// sha-free. Fail-CLOSED on the evidence (absent/malformed ⇒ not green) and fail-OPEN on the task
// (a red gate forward-reverts the ace tip and the approved pre-ace tip still merges, PIN-2).
const GATE_CHECK = { type: 'object', required: ['gate_green'], properties: {
  gate_green: { type: 'boolean' }, head_sha: { type: 'string' }, gate_output: { type: 'string' } },
  if: { properties: { gate_green: { const: true } } },
  then: { required: ['gate_green', 'head_sha'] } }

// PIN_TRANSFER (#1913, D2/PIN-1/PIN-7/PIN-14/PIN-16): the merge slot's mechanical pin-transfer probe —
// a conflict-free rebase plus `git patch-id --stable` equality of the TASK'S OWN diff, computed
// dispatchBase→tip BEFORE the rebase and integration-tip→tip after. Deliberately its OWN schema, not a
// widening of MERGE_RESULT: no status enum value, HARD_ESCALATION_REASONS member, or
// KNOWN_LAND_DECISIONS member changes, and no pin-transfer outcome ever rides an in-band field on a
// hard-escalating wire status (PIN-6). Statuses: 'transferred' (patch-ids equal — the panel pin carries
// to the rebased tip), 'mismatch' (unequal — that ONE task falls back to the in-lock full-panel
// re-audit, today's behaviour, PIN-1), 'already_upstream' (empty post-rebase diff whose pre-rebase task
// commits every cherry-match upstream, PIN-16), 'empty-unmatched' (empty diff with zero task commits,
// unmatched patches, or an empty pre-rebase patch-id — fails CLOSED to a hard escalation, #1895),
// 'conflict', and 'error' (fail-open: the ordinary merge dispatch runs unchanged).
const PIN_TRANSFER = { type: 'object', required: ['status'], properties: {
  status: { enum: ['transferred', 'mismatch', 'already_upstream', 'empty-unmatched', 'conflict', 'error'] },
  rebased_tip: { type: 'string' }, pre_rebase_patch_id: { type: 'string' }, post_rebase_patch_id: { type: 'string' },
  already_upstream_commits: { type: 'array' }, conflict_files: { type: 'array' }, detail: { type: 'string' } } }

// DIFF_PROBE_RESULT (in-band-absorb-default D4, PIN-6): the per-task refiner `diff-probe` dispatch's
// return — `diff_files`, the GIT-derived changed-file list of the task branch
// (`git diff --name-only <dispatchBase>..<tip>` in the task worktree, one repo-relative path per
// entry), read by dispositionOf's engine default and the intake filing floor. Its OWN schema (the
// PIN_TRANSFER precedent): no MergeResult status, HARD_ESCALATION_REASONS member, or
// KNOWN_LAND_DECISIONS member changes. ALL fields optional (fail-open): a dead dispatch, a thrown
// dispatch, or a return without a diff_files array leaves the probe ABSENT — logged — and the task
// keeps the old severity default with the floor skipped (its filed rows carry demote:floor-skipped).
// Worker files_changed is never the source (deterministic: git-derived only).
const DIFF_PROBE_RESULT = { type: 'object', properties: {
  diff_files: { type: 'array', items: { type: 'string' } }, detail: { type: 'string' } } }

// EVIDENCE_RESULT (D1/D4/D6): the shape of the ONE consolidated post-merge refiner "evidence dispatch"
// (label evidence:phase-<id>). perTask stamps the gate-pin-status.sh proof (pin_status + observedHead =
// the _refinery tip the proof was computed against — the gate-audit seat's pin-equality expectation) and
// the assert-guard-specificity-in-diff.sh advisory-evidence token per merged task. integratedTipGate is
// populated ONLY on an intra-phase-dep phase (a re-run of plan.gate at the final integration tip — the
// land-authoritative execution evidence feeding the D4 authoritative seat); its gate_log_path is the
// ABSOLUTE teed path of that integrated-tip gate log — the authoritative seat's HARD-path artifact
// (absent ⇒ SOFT cannot-confirm, mirroring the per-task gate_log_path; D5). phase_diff_files
// (in-band-absorb-default D15): the git-derived changed-file list of the whole phase —
// `git diff --name-only <phaseBase>..<integrationTip>` — read by the gate-audit floor pass's note arm
// (a gate-audit `note` with a suggested_fix in a touched file reroutes to absorb + phaseClose:true);
// absent ⇒ that arm skips with a log while the follow-up arm still reroutes. ALL fields optional: a
// failed/absent dispatch ⇒ no tokens ⇒ seats keep today's SOFT cannot-confirm path (fail-open, never a hold).
const EVIDENCE_RESULT = { type: 'object', properties: {
  phase_diff_files: { type: 'array' },
  perTask: { type: 'array', items: { type: 'object', properties: {
    taskId: { type: 'string' },
    pin_status: { enum: ['CONFIRMED', 'BENIGN-ADVANCE', 'STALE-MISMATCH', 'ERROR'] },
    pin_evidence: { type: 'string' }, observedHead: { type: 'string' },
    guard_specificity: { enum: ['covered', 'uncovered', 'ERROR'] }, guard_evidence: { type: 'string' } } } },
  integratedTipGate: { type: 'object', properties: { gate_output: { type: 'string' }, tip_sha: { type: 'string' }, gate_log_path: { type: 'string' } } } } }

// ENDSTATE_CHECK_RESULT (D2/F5, precision-chain Task 3.2): the land-barrier endstate-check dispatch's
// return — ADVISORY only. The gate-audit-family seats verify from the TEED per-condition artifacts at
// their deterministic paths (.war/endstate-<phaseId>-<n>.log, each stamped with the tip SHA it ran
// at), never from this return. ALL fields optional (fail-open): a failed/absent dispatch leaves each
// artifact missing, unreadable, or STALE-BUT-READABLE (.war/ is git-excluded and ensure-worktree
// reuses a present worktree untouched, so a resume replay lands on prior-run residue), and the seats
// attest those conditions 'unverified' — a missing/unreadable artifact and a stamped tip_sha that
// mismatches the confirmed tip both map there; never 'met', never a block. So does an artifact that
// is present, readable, and correctly tip-stamped but whose red is ENVIRONMENTAL (#1395 — a
// setup/collection/import failure: ModuleNotFoundError, pytest setup ERROR, usage/collection exit
// codes — rather than an evaluated-false condition): it attests 'unverified', NEVER 'unmet' — a met
// condition is never attested unmet for want of environment prep. Two record-only artifact states
// (A3 intake lint / byte-verify) also map to 'unverified': an `intake_lint:`-stamped artifact (the
// check literal was UNSUPPORTED by the .cmd transport — the row was never executed, its exit_code
// line reads `unsupported`, hence exit_code below admits a string) and a `cmd_bytes_mismatch:`-stamped
// artifact (the written .cmd failed the byte-for-byte verify — the row was not executed as declared).
const ENDSTATE_CHECK_RESULT = { type: 'object', properties: {
  artifacts: { type: 'array', items: { type: 'object', properties: {
    n: { type: 'number' }, path: { type: 'string' }, tip_sha: { type: 'string' }, exit_code: {} } } } } }

// FOLLOWUP_FILING_RESULT (D1/D2, #1331): the file-followups dispatch's return — ADVISORY only. The
// Workflow stamps minorsFiled[n-1].issue from each returned row carrying an in-range 1-based n AND a
// numeric issue; out-of-range/non-numeric/absent rows are ignored. ALL fields optional (fail-open,
// the ENDSTATE_CHECK_RESULT framing): a dead/absent dispatch, a failed preflight, or a non-conforming
// return leaves every handoff.followUps[] issue null — one log() line, landDecision untouched, never
// a hold; the Checkpoint floor (skills/war/SKILL.md § Checkpoint) is the catch (D2).
const FOLLOWUP_FILING_RESULT = { type: 'object', properties: {
  filed: { type: 'array', items: { type: 'object', properties: {
    n: { type: 'number' }, issue: {} } } },
  // clusters[] manifest (Task 2.1, #1566): the agent's own clustering record — ordinals are the
  // 1-based POST-COLLAPSE row numbers it grouped into one filed issue. Advisory like `filed`: the
  // engine asserts partition (every ordinal in exactly one cluster — clustering only merges the
  // engine's collapsed rows, never splits one), and distinct issues filed ≤ post-collapse rows;
  // violations get ONE log() line (fail-open, the non-conforming-return arm's sibling), never a hold.
  clusters: { type: 'array', items: { type: 'object', properties: {
    ordinals: { type: 'array', items: { type: 'number' } }, issue: {} } } } } }

// memory_index_updated retired (spec §4.6, D4 deleted): the servitor no longer maintains the index —
// the Lead runs `render-index` post-servitor (Gate 2). The servitor only writes/updates lesson files.
const SERVITOR_RESULT = { type: 'object', required: ['phase', 'target', 'learnings'], properties: {
  phase: {}, target: { type: 'string' }, files_written: { type: 'array' },
  learnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, why: { type: 'string' } } } } } }

// Per-task provision-run result (Part B). The refiner runs the pinned run.provision list inside the
// task worktree: ok:true when every step exits 0; otherwise the env-blocked task-outcome shape from
// ../references/schemas.md ({ taskId, failedCommand, exitCode, stderrTail, provisionSource }) for the
// FIRST failing step. NOT a WorkerResult — no worker ran. The barrier skips the worker on ok:false.
// The provision-BARRIER return (dispatchKind 'provision-barrier') additionally carries three OPTIONAL
// arrays: preMerged — task ids whose local branch is an ancestor of the frozen integration tip
// (already-integrated on an adopted branch; the derive-and-skip step, armed only under
// args.recovery.sanctioned — recovery mechanics, spec §4.2/§4.4); staleRemote — per-task stale-remote
// classifications ({ task, remoteSha, frozenTip }) captured from an ensure-worktree exit carrying the
// STALE_REMOTE marker (always-on classification, never recovery-gated); worktreeHygiene (D20, #1381) —
// reuse-path hygiene findings ([{ task, path, action: "repaired"|"detected", detail }]) captured from
// WORKTREE_HYGIENE marker lines an ensure-worktree REUSE emits (the STALE_REMOTE marker-capture idiom),
// carried on an ok: true return beside staleRemote. worktreeHygiene is visibility only, fail-open: ONE
// log() summary line when non-empty, no auditLog entry, no routing change, never a hold — the barrier
// never halts on it. All three absent on a plain barrier with nothing to report. A fourth OPTIONAL
// field, absorbCharges (absorb-budget, D5) — { <task>: n }, the HIGHEST `Ace-Charge: <task>:<n>`
// trailer index on each task branch (one `git log` trailer read per task, allowed beside the named
// commands) — seeds r.task.absorbRounds on a relaunch; absent or malformed ⇒ 0 with a loud log.
const ENV_OUTCOME = { type: 'object', required: ['ok'], properties: {
  ok: { type: 'boolean' },
  taskId: { type: 'string' }, failedCommand: { type: 'string' }, exitCode: { type: 'number' },
  stderrTail: { type: 'string' }, provisionSource: { type: 'string' },
  preMerged: { type: 'array' }, staleRemote: { type: 'array' }, worktreeHygiene: { type: 'array' },
  absorbCharges: { type: 'object' } } }

const done = new Set()
const succeeded = new Set()
// Hoisted above try{} so the catch block can reference them even when the derivation throw fires
// before any wave runs (temporal dead zone guard — red-team T1-confirmed).
const landed = [], escalated = [], minorsFiled = [], auditLog = []
// Disposition routing (ADR 0013): minorsFiled receives ONLY disposition:'follow-up' findings;
// notes receives disposition:'note' findings (phase report + servitor feed — memory candidates,
// never issues).
const notes = []
// pinTransfers (#1913, PIN-7/PIN-10/PIN-14): the run-level pin-transfer ledger. One row per accounted
// transfer — the wave-side ace rounds (kind:'ace') and the merge slot's rebase probe (kind:'merge') —
// naming the mode, the SHAs, and EVERY seat as transferred or re-ran with its own sha, so unanimity
// survives in transferred form and a later audit can re-verify without replaying the rebase.
const pinTransfers = []
// asks (#1550, ADR 0013 amendment 2026-08-25): parked disposition:'ask' records — decision-shaped
// Minor/Nit questions awaiting the operator's ruling at the Checkpoint strike-list gate. Rides the
// top-level return beside minorsFiled and the handoff's ninth (lossy) `asks` key; NEVER consumed by
// the follow-up consolidation or the file-followups dispatch below (an unruled ask is never filed).
const asks = []
// --ace provenance (D3): aced findings recorded as { task, finding, sha } — a return ATTRIBUTE, not a
// status/escalation (D6). Under disposition routing (ADR 0013) `aced` also records the phase-close
// sweep's absorbed findings at the polish sha.
const aced = []
// Phase-close queue (ADR 0012): absorb findings the per-task ace cannot reach (phaseClose:true or a
// release-slot filename) — drained by the phase-close coherence sweep at the integrated tip.
const phaseCloseQueue = []
const mergedTasksForGateAudit = []   // collect {taskId, gateOutput, acceptanceCriteria, gateHeadSha, gateLogPath, preMergeTip, mappedTests?, claimedEndStateIds?, baselineDebt?} for post-merge gate-audit pass (F04 R3)
// #806: the last REAL integration_sha any landMerged() call recorded (incl. requiresTest:false tasks,
// which never enter mergedTasksForGateAudit). Each gate-audit entry stamps the tracker's value from
// BEFORE its own task's update — its true immediate predecessor tip in serial merge order — so a
// requiresTest:false interleave no longer over-populates the successor's --mapped diff range. A sentinel
// integration_sha leaves the tracker at the last REAL sha (feeding the sentinel forward would poison the
// successor's `git diff <preMergeTip> <gateHeadSha>` into a guaranteed exit-2 ERROR — the [i-1].gateHeadSha
// chain this replaces had exactly that defect). Null until the first real land ⇒ evItems falls back to phaseBaseCmd.
let lastLandedTip = null
// Per-task landed sha (Phase 5 Task 1): the REAL integration_sha each landMerged() call recorded, keyed
// by task id — retained for EVERY landed task, because a requiresTest:false task never enters
// mergedTasksForGateAudit (the D7 skip) and so never gets a gate-audit auditLog entry: without this map
// auditEvidenceOf's pinned-sha lookup renders 'unrecorded' for such a task's filed follow-ups. Real hex
// shas only (the isSha test) — a sentinel integration_sha is never retained here.
const landedShaByTask = new Map()
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

// D8 (spec §8): wrap ONLY the string arm's JSON.parse in a dedicated try/catch that re-throws a NAMED,
// self-diagnosing Error — the payload length in characters, the engine's OWN parse message (position only
// when the engine supplies one; JSC supplies none, so it is never fabricated), and a bounded ~60-char head
// snippet. It routes to the existing top-level held:workflow-error catch (no new enum member, no new return
// route — ADR 0005; never add held:workflow-error to HARD_ESCALATION_REASONS). The object arm and the
// ADR 0034 non-null-object guard below are untouched.
const A = typeof args === 'string' ? (() => {
  try {
    return JSON.parse(args)
  } catch (parseErr) {
    const head = args.length > 60 ? args.slice(0, 60) + '…' : args
    throw new Error(`workflow-template: args is a string but not valid JSON (${args.length} chars): ${(parseErr && parseErr.message) || parseErr}. head: ${JSON.stringify(head)}`)
  }
})() : (args || {})
// COUPLING (ADR 0037, #1134): stage-workflow.mjs mirrors the ternary's object-arm fallback tail above
// as its ARGS_FALLBACK_ANCHOR export and rewrites it, at stage time and only under `--args <file>`, so
// a staged copy falls back to an EMBEDDED_ARGS prelude when the assembled phase args are too large to
// ride the Workflow tool call. Change a byte in that tail and you MUST update stage-workflow.mjs in
// lock-step; the imported-constant anchor guard in stage-workflow.test.mjs is the arbiter. This comment
// stays REFERENTIAL: it never restates the tail's bytes (that would trip the exactly-once guard), and
// never the rewritten form or the prelude's declaration line either — those bytes would ride verbatim
// into every staged copy and falsify the no-flag staged-output negative.
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
// ghUser (#1331, ADR 0026): the expected gh account the file-followups dispatch preflights against —
// threaded by the Lead from overrides.ghUser. Default '' is gh-preflight.sh's documented no-op
// (exit 0, gh never invoked), so an unconfigured run pays nothing and no handle rides committed prose.
const ghUser = (typeof A.ghUser === 'string') ? A.ghUser : ''
// Hand-mirrored fallback of DEFAULTS.run.roundLimit (war-config.mjs) — the sandbox cannot import;
// keep the two literals in lock-step. 6 is the fix-round budget: blocking fix rounds and the
// merge-floor retry loop only (PIN-7) — no ace-side commit charges it any more.
const roundLimit = run.roundLimit ?? 6
// absorbRounds (absorb-budget, D5): the per-task absorb meter — the ace ladder's OWN round budget,
// charged once per ace-side COMMIT (batch ace, re-entry batch, bisection subset; the terminal pass
// reserves a charge site) and read by all three ace gates as `r.task.absorbRounds < absorbRounds`.
// Reverts, re-audit panels, and fix rounds never charge it. Mirror of DEFAULTS.run.absorbRounds in war-config.mjs — keep in sync (drift-guarded in war-config.test.mjs).
const absorbRounds = run.absorbRounds ?? 6
// maxParallel (#1722, reshaped #1897): the GLOBAL agent-dispatch ceiling for rate-limited accounts —
// threaded exactly like roundLimit from run.maxParallel, but with NO numeric fallback:
// absent/null/malformed ⇒ null ⇒ dispatch() below calls agent() straight through, a byte-identical
// dispatch path (binding guardrail — an unconfigured run pays nothing). Set ⇒ at most maxParallel
// agent dispatches are in flight at once ACROSS THE WHOLE RUN, not per fan-out site: the old per-site
// throttle composed multiplicatively across nested fan-outs (wave × audit roster ⇒ ~N² in flight).
const maxParallel = (Number.isInteger(run.maxParallel) && run.maxParallel > 0) ? run.maxParallel : null
// makeSemaphore(n): a hand-rolled counting semaphore (free-permit counter + FIFO waiter queue) — the
// sandbox cannot import. n absent/null/malformed ⇒ every acquire resolves immediately and release is a
// no-op, so the unconfigured path never touches the counter. release() hands the permit STRAIGHT to the
// head waiter when one is queued (never back to the pool), so permits + in-flight is invariant and a
// waiter can never be passed over. permits/waiting are read-only views for the drain assertions.
function makeSemaphore(n) {
  const cap = (Number.isInteger(n) && n > 0) ? n : null
  let permits = cap
  const waiters = []
  return {
    get permits() { return permits },
    get waiting() { return waiters.length },
    acquire() {
      if (cap === null) return Promise.resolve()
      if (permits > 0) { permits--; return Promise.resolve() }
      return new Promise(resolve => waiters.push(resolve))
    },
    release() {
      if (cap === null) return
      const next = waiters.shift()
      if (next) next()
      else permits++
    },
  }
}
const dispatchSemaphore = makeSemaphore(maxParallel)
// dispatch(prompt, opts): the ONE leaf agent-dispatch seam (PIN-4). EVERY agent() call in this file
// goes through here — workers, auditors, aces, fix workers, refiners, servitors, gate-audit seats — so
// one counter caps them all. The permit is taken immediately around the leaf agent() call and released
// in a `finally`, so a rejected or thrown dispatch never leaks one (a leaked permit lowers the observed
// peak, so a peak ≤ N assertion alone cannot catch it — the tests assert the drain too). No enclosing
// slot (wave thunk, merge slot, audit round) ever holds a permit while it awaits a nested dispatch
// (PIN-15), so the ceiling can never deadlock a run whose wave width exceeds it.
async function dispatch(prompt, opts) {
  if (maxParallel === null) return agent(prompt, opts)
  await dispatchSemaphore.acquire()
  try { return await agent(prompt, opts) } finally { dispatchSemaphore.release() }
}
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
// Test-floor pattern (spec §6 / ADR 0019): the Lead threads the per-phase-RESOLVED overrides.testPattern
// into args.plan.testPattern exactly like plan.gate (string|null; absent ⇒ null — the plan.gate precedent;
// pinned at Setup, and under --afk a sanity-floor-rejected Setup proposal is re-checked at each phase
// launch and can be adopted monotonically — so this value is resolved per phase, not once per run).
// A non-empty string is appended VERBATIM as the assert-test-in-diff.sh `--pattern '<value>'` argument at
// EVERY dispatched merge-task floor invocation site; null ⇒ testPatternArg is '' so every dispatched
// prompt is byte-identical to a testPattern-less run (criterion 2). The floor's *.test.sh union is
// script-side (Phase 1, assert-test-in-diff.sh) — never re-stated per prompt. The glob-safe charset is
// validated in war-config.mjs, never here (the value is embedded single-quoted into an agent shell line).
const testPattern = (plan && typeof plan.testPattern === 'string' && plan.testPattern) ? plan.testPattern : null
const testPatternArg = testPattern ? ` --pattern '${testPattern}'` : ''
// Partial-phase recovery (spec §4.2/§4.4): a Lead-supplied top-level arg armed ONLY on a sanctioned
// recovery relaunch (the war skill's references/resume-and-recovery.md runbook). Shape { sanctioned: true, reclaimStaleRemote?: boolean }.
// Absent / non-sanctioned ⇒ THREE recovery-gated barrier arms are DORMANT, not one: (1) the
// derive-and-skip step (deriveSkipClause — a task branch already an ancestor of the frozen tip is
// reported preMerged and its ensure-worktree skipped, the §4.2 relaunch prompt delta); (2) the
// pre-checkout ref-holder auto-free (holderFreeClause, #1712 fix 3 — clean prior-generation holders of
// THIS plan's own refs only, carrying TWO refusal arms: a DIRTY holder and a FOREIGN plan's holder are
// never freed, each dying loud with the holder path named in stderrTail); (3) the
// --reclaim-stale-remote pass-through. Dormant, every dispatched prompt is byte-identical to a
// non-recovery run APART FROM the barrier prompt's TWO always-on clauses — the §4.4 stale-remote
// classification and the D20 worktree-hygiene capture (default behavior, not recovery machinery).
// A resumeFromRunId replay / accidental same-named local branch never triggers
// derivation. Normalized to null unless sanctioned === true, so a malformed value is inert.
const recovery = (A.recovery && typeof A.recovery === 'object' && !Array.isArray(A.recovery) && A.recovery.sanctioned === true)
  ? { sanctioned: true, reclaimStaleRemote: A.recovery.reclaimStaleRemote === true }
  : null
const intentClause = intent
  ? pt`\nCOMMANDER'S INTENT (the operator's purpose — your ceiling; the plan slice is your floor):\n${intent}\n`
  : ''
// Adjudications (Task 1.5, ADR 0032; producers widened by audit-adjudication-threading Task 1.1,
// widened again — Checkpoint ask rulings — by ask-disposition Task 1.1, ADR 0013 amendment
// 2026-08-25). THREE producers feed this arg, never one or two: the Lead assembles rows from the
// red-team report's `## Adjudications` block for this plan (docs/red-team/<plan-slug>.md) AND from
// its own scope adjudications made at the decompose gate or at an escalation AND from the
// Checkpoint ask rulings — each ruled ask minted as an adjudication row at the strike-list gate —
// the latter two per `skills/war/SKILL.md`, then
// threads the accumulated set here as args.adjudications (array|null of { adjudicated, supersedes }
// objects or preformatted strings) — a Lead-read arg, like intent. FOLLOWS the intentClause threading
// pattern: empty/absent ⇒ adjudicationClause is '' ⇒ every prompt below is byte-identical to a
// no-adjudication run (back-compat, spec constraint 4). The clause carries TWO rules — version
// precedence (task instruction > red-team adjudication > plan body literal) and adjudication-match
// (a matching finding is a confirmation note, never an escalation) — and is emitted at the roster-seat
// auditPrompt AND at the three gate-audit-family seats (per-task (post-merge), integrated-tip, end-state-only).
// Both sentence bodies are mirrored VERBATIM in agents/war-auditor.md (the both-surfaces drift test
// asserts both surfaces).
const adjudications = Array.isArray(A.adjudications)
  ? A.adjudications.filter(r => r && (typeof r === 'string' || typeof r === 'object')) : []
const adjRow = r => typeof r === 'string' ? r
  // pt-tagged prompt-feeding row (adjudicationClause → auditPrompt): every interpolation is guarded/defaulted
  // (r.adjudicated/r.value ?? '', r.supersedes ternary-gated) — a behavioral no-op tag for census uniformity.
  : pt`${r.adjudicated ?? r.value ?? ''}${r.supersedes ? pt` (supersedes plan literal: ${r.supersedes})` : ''}`
const adjudicationClause = adjudications.length
  ? pt`\nVERSION-PRECEDENCE RULE: the authoritative version is task instruction > red-team adjudication > plan body literal. Before scoring a version/release-slot mismatch as a defect, consult the adjudicated rows below; a value matching the adjudication is correct even when it differs from the plan body literal.\nADJUDICATION-MATCH RULE: a finding whose substance matches an adjudicated row below is a confirmation note, never an escalation — cite the matching row; the delta is pre-adjudicated and not re-litigable this run. A candidate that deviates from BOTH the plan and the adjudicated row is not a match — judge it normally.\n`
    + adjudications.map(r => pt`- ${adjRow(r)}`).join('\n') + '\n'
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
// claims (Lead-mapped), as the WIDENED rows { condition, tag, check } (schemas.md; Lead-parsed per
// Task 3.1). A legacy bare-string entry normalizes to { condition, tag: null, check: null } — the
// judgment path (End state 9) — so consumers never see a raw string. check:-tagged rows are EXECUTED
// once per phase by the land-barrier endstate-check dispatch (D2/F5, below); every row is verified
// artifact-first by the gate-audit pass; a condition owned by a LATER phase — or by a deps-chained
// sibling task of THIS phase not yet landed at the audit's scope — is out-of-scope there, never a hold.
const endStateRows = Array.isArray(ph && ph.endState)
  ? ph.endState
      .map(c => (typeof c === 'string' ? { condition: c, tag: null, check: null } : c))
      .filter(r => r && typeof r === 'object' && !Array.isArray(r) && typeof r.condition === 'string' && r.condition)
      .map(r => ({ condition: r.condition, tag: (typeof r.tag === 'string' && r.tag) ? r.tag : null,
        check: (typeof r.check === 'string' && r.check) ? r.check : null }))
  : []
// endStateClaims: the verbatim condition texts — the prompt-enumeration + handoff key set (row order
// is claim order; a row's 1-based index is its artifact number <n>).
const endStateClaims = endStateRows.map(r => r.condition)
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
// Mirror of war-config.mjs spawnOpts/validateRoster/widenRoster/resolveWidenSource/resolveGate — the Workflow sandbox can't import. Keep in sync.
const ROLE_MODEL = { worker: 'opus', auditor: 'sonnet', refiner: 'sonnet', servitor: 'sonnet' }
const spawn = role => {
  const a = agents[role] || {}
  const model = a.model || ROLE_MODEL[role]
  return a.effort && a.effort !== 'default' ? { model, effort: a.effort } : { model }
}
// Worker sub-tier SANDBOX fallbacks. docs is bound to DEFAULTS.agents.worker.docs by the D2 registry
// row in workflow-template.test.mjs (opus by default). fix (the fix-round + --ace tier) is NOT listed
// here even though DEFAULTS/presets now default it: its authoring default is applied by fillDefaults
// BEFORE the resolved config reaches this sandbox, so at this layer an absent fix ⇒ inherit the base
// worker (the correct fallback for a partial/hand-passed config — nothing to bind).
const WORKER_TIER_DEFAULTS = { docs: { model: 'opus', effort: 'default' } }
// spawnWorker(tier): worker spawn opts for a sub-tier ('docs'|'fix') — the configured agents.worker[tier]
// block when present, else WORKER_TIER_DEFAULTS[tier] (docs), else the base worker (fix absent ⇒ inherit;
// a null/absent tier ⇒ base). A partial tier block falls back to ITS tier's default model (docs⇒opus),
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
// resolveGate (F12, idempotent) — inline copy of war-config.mjs resolveGate (named in the block-head marker
// above; the D2 registry row in workflow-template.test.mjs behaviorally binds it to the canonical export).
// GATE_DISCOVERY_TOKEN is the SAME substring used to BUILD the discovery clause AND to detect it, so composer
// and detector cannot drift; a declaredGate already carrying it is returned UNCHANGED (idempotent composition).
const GATE_DISCOVERY_TOKEN = `-name '*.test.sh'`
const resolveGate = (declaredGate) => {
  const discovery = [
    `for f in $(find . -type f ${GATE_DISCOVERY_TOKEN} -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/*' | sort);`,
    `do printf '\\n== gate(bash): %s ==\\n' "$f" && bash "$f" || exit 1; done`,
  ].join(' ')
  if (!declaredGate) return discovery
  if (declaredGate.includes(GATE_DISCOVERY_TOKEN)) return declaredGate
  return `${declaredGate} && ${discovery}`
}
// audit.roster (args) is the union-widening default roster (D5). A default seat with an omitted
// depth normalizes to 'deep' (D2) — the same rule the per-task phase-start normalization applies.
const defaultRoster = (Array.isArray(audit.roster) ? audit.roster : []).map(s =>
  (s && typeof s === 'object' && !Array.isArray(s) && s.depth === undefined) ? { ...s, depth: 'deep' } : s)


// Entry validation (H, widened per operator decision 4 + #740; plan.file class added by #1430).
// FOUR problem classes — (1) derivation, (2) phase-field, (3) plan-file, (4) task-field, each named
// below — feed ONE hoisted `problems` aggregation and a SINGLE throw here, at the top
// of the try{} body — before any pt-tagged interpolation and before git is touched — so a missing
// input dies at ENTRY with every absent key named (→ held:workflow-error via the catch, git
// untouched), not opaquely deep inside prompt construction (#586, #740, #1430).
//   (1) DERIVATION class — the missing-trio-keys list + a missing phase.id (the silent `pundefined-`
//       branch/worktree derivation class). Consumed ONLY when a task lacks an explicit branch/worktree,
//       so it is guarded by that `some(...)` check: zero tasks / all-explicit ⇒ this class vacuously
//       adds nothing (the vacuous-no-throw rule applies to THIS class only). The per-task derivation
//       throw below stays as the belt-and-suspenders backstop.
//   (2) PHASE-FIELD class — ph.title / ph.workingBranch / ph.integrationBranch, each interpolated
//       fallback-free through the `pt` tag in the Provision-barrier / depClause / merge / land /
//       classification / phase-close prompts REGARDLESS of whether tasks carry explicit paths. So this
//       class is UNCONDITIONAL — a DEFENSIVE FAIL-FAST that names every absent phase field HERE at entry
//       (→ held:workflow-error via the catch) instead of throwing opaquely deep inside pt-tagged prompt
//       construction. Guarded access only (`ph` nullish ⇒ all three named); no earlier ph-field deref can
//       pre-empt this message (phaseId uses `ph?.id`, endStateRows guards `ph && ph.endState`,
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
//   (3) PLAN-FILE class (#1430) — plan.file, its OWN problem class (never inside missingTrio: that
//       class is gated behind a derivation-needing task, while every dispatched worker/fix prompt
//       interpolates plan.file regardless of explicit paths). Gated behind a NON-EMPTY task list
//       (/red-team 2026-08-16): the two ratified plan-less zero-task launch shapes (the
//       gate-composition no-op and the claims-bearing endStateBlock) stay legal — a phase that
//       dispatches no worker needs no plan file. The trio and phase-field messages above stay
//       byte-unchanged (the exact-equality aggregate fixture + the LITERAL_REGISTRY census row pin
//       them); this push is a plain string, so the census is untouched. The observed incident (plan 5
//       phase 1) spawned Provision first and drained every task to escalate — this refusal is
//       at-entry, zero agent spawns.
if ((tasks || []).length > 0 && !(plan && typeof plan.file === 'string' && plan.file)) {
  problems.push('workflow-template: requires plan.file — the launch carries tasks but no plan.file (every worker/fix prompt interpolates it); thread plan: { file: "docs/plans/<slug>.md" } (#1430)')
}
//   (4) TASK-FIELD class (D5, engine-reliability) — per-task shape validation at args intake.
//       task.planSlice is the task's charter, interpolated into every worker/auditor/fix prompt: a
//       missing/empty slice dispatches a charter-less worker (the vacuous-phase family of silent
//       degradations), so refuse at entry naming the task and field. task.doneWhen is string|null by
//       contract (the Done when: acceptance command; null/absent = legacy) — any other present type
//       is a malformed launch, refused naming the field, never coerced. Messages are
//       concatenation-built (census-safe — the #931 LITERAL_REGISTRY stays byte-unchanged); the
//       prompt-site `?? '<unset>'` fallbacks below stay as defense-in-depth behind this belt.
for (const t of (tasks || [])) {
  const tid = (t && t.id !== undefined && t.id !== null && t.id !== '') ? String(t.id) : '<missing-id>'
  if (!t || typeof t.planSlice !== 'string' || !t.planSlice.trim()) {
    problems.push('workflow-template: task ' + tid + ' is missing planSlice — a present non-empty string is required (every worker/auditor prompt interpolates it as the task charter) (D5)')
  }
  if (t && t.doneWhen !== undefined && t.doneWhen !== null && typeof t.doneWhen !== 'string') {
    problems.push('workflow-template: task ' + tid + ' has a non-string doneWhen (' + typeof t.doneWhen + ') — doneWhen is the Done when: acceptance command: a string when present, null/absent for legacy (D5)')
  }
}
//   (5) SWEEP-EXCLUDE class (in-band-absorb-default D2/D6) — args.sweepExclude is the Lead's campaign
//       contention list: absent/null (no ledger — one log line at sweep time) or an array of
//       { slug: string, files: string[] } entries. Any other shape is a malformed launch, refused at
//       entry naming the entry index and field — never coerced, never a guessed exclusion set.
if (A.sweepExclude !== undefined && A.sweepExclude !== null) {
  if (!Array.isArray(A.sweepExclude)) problems.push('workflow-template: args.sweepExclude must be an array of { slug, files[] } entries or absent (got ' + typeof A.sweepExclude + ') (D2)')
  else A.sweepExclude.forEach((e, i) => {
    if (!e || typeof e !== 'object' || Array.isArray(e)) { problems.push('workflow-template: args.sweepExclude[' + i + '] must be an object { slug, files[] } (D2)'); return }
    if (typeof e.slug !== 'string' || !e.slug) problems.push('workflow-template: args.sweepExclude[' + i + '].slug must be a non-empty string — the demotion reason names the owning plan by it (D2)')
    if (!Array.isArray(e.files) || !e.files.every(f => typeof f === 'string')) problems.push('workflow-template: args.sweepExclude[' + i + '].files must be an array of repo-relative path strings (D2)')
  })
}
if (problems.length) throw new Error(`${problems.join('; ')}${derivationProblem ? ' (or supply explicit branch/worktree per task)' : ''}`)

// ---- Args provenance floor (#1413, recalibrated D6 / #1666 signal 1) — fail-closed, at entry ----
// A dispatched seat can recover from a wrong plan slice by reading the plan file; the assembled
// intent/backstops/adjudications have NO seat-side recovery path — a cross-plan leak (the plan-3
// incident: a plan-A launch carrying plan-B's intent, 13 × escape / 0 × done-when) starts clean and
// stays green. So refuse at entry (held:workflow-error via the catch): (1) an arg naming a
// docs/plans/<slug>.md identifier differing from plan.file is foreign; (2) an arg containing NONE of
// the run's own plan-slug tokens (the slug's non-date words, from planSlug + the plan.file basename)
// fails the own-token floor. D6 recalibration (the #1666 both-directions miscalibration):
//   - the scan is scoped to INTENT-BEARING text only — the intent string, and per-row check/why
//     (backstops) / adjudicated/value (adjudications) / ruling+suggested_fix+findingTitle
//     (ruledAsks, #1879 RULING 2) fields — never a whole-surface JSON.stringify,
//     whose schema KEY names ("check","why","source":"plan") let a foreign row vacuously satisfy the
//     own-token floor;
//   - own-token matching is WORD-BOUNDARY (\b), behind a stoplist of generic tokens — a slug word
//     like 'and' or 'test' proves nothing, and a substring hit inside a larger word proves nothing;
//   - EXEMPT rows: source:'auto' rows (Workflow/Setup-authored, never a Lead-assembled cross-plan
//     surface), predecessor citations (the `supersedes` field is the citation channel — excluded
//     from the scan), and Lead-stamped `planFile` provenance rows naming THIS plan (a planFile
//     stamp naming a FOREIGN plan is the leak itself and refuses directly).
// Each floor applies ONLY when its arg has scannable intent-bearing text (an intent-less launch —
// and a surface whose rows are all exempt — stays legal; the ratified absent-⇒-byte-identical
// contract), the foreign check only when plan.file is present, and the own-token floor is skipped
// when no distinctive token is derivable (fail-open, never a guessed refusal). Messages are
// concatenation-built (census-safe — the #931 LITERAL_REGISTRY stays byte-unchanged).
{
  const provenanceProblems = []
  // Generic-token stoplist (D6): English glue + WAR-universal vocabulary that appears in virtually
  // any run's intent/backstops regardless of plan — a match on one proves no provenance.
  const PROVENANCE_TOKEN_STOPLIST = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'over', 'not', 'all',
    'war', 'plan', 'plans', 'phase', 'phases', 'task', 'tasks', 'test', 'tests', 'fix', 'fixes', 'docs',
    'run', 'runs', 'gate', 'gates', 'audit', 'merge', 'land', 'issue', 'issues', 'release', 'follow'])
  const ownTokens = [...new Set([planSlug, (plan && typeof plan.file === 'string') ? plan.file.replace(/^.*\//, '').replace(/\.md$/i, '') : null]
    .filter(Boolean)
    .flatMap(s => String(s).toLowerCase().split(/[^a-z0-9]+/))
    .filter(w => w.length >= 3 && !/^\d+$/.test(w) && !PROVENANCE_TOKEN_STOPLIST.has(w)))]
  const ownPlanBase = (plan && typeof plan.file === 'string' && plan.file) ? plan.file.replace(/^.*\//, '').toLowerCase() : null
  const baseOf = p => String(p).replace(/^.*\//, '').toLowerCase()
  // Per-row intent-bearing extraction: { text, exempt } | { foreignStamp } (see the exemption
  // enumeration above). A string row is its own text (the preformatted adjudication shape). An
  // EXEMPT row is never scanned for refusal, but its intent-bearing text still COUNTS as own-token
  // evidence for the surface — exemption means "never causes a refusal", not "cannot prove
  // provenance" (a source:'auto' row stamped with the run's own slug token vouches for a generic
  // Lead-normalized sibling row, the #1666 false-refusal direction).
  const rowText = row => {
    if (typeof row === 'string') return { text: row, exempt: false }
    if (!row || typeof row !== 'object') return { text: '', exempt: true }
    const text = ['check', 'why', 'adjudicated', 'value']
      .map(k => (typeof row[k] === 'string') ? row[k] : '').filter(Boolean).join('\n')
    if (row.source === 'auto') return { text, exempt: true }
    if (typeof row.planFile === 'string' && row.planFile) {
      if (ownPlanBase && baseOf(row.planFile) !== ownPlanBase) return { foreignStamp: row.planFile }
      return { text, exempt: true }
    }
    return { text, exempt: false }
  }
  // Ruled-ask rows (#1879 RULING 2 — args.ruledAsks JOINS the floor): per-row intent-bearing text
  // is the ruling + suggested_fix + finding-title fields (the same rowText discipline as
  // backstops/adjudications), and the record shape's REQUIRED planSlug coordinate is the
  // planFile-stamp analog read as a FIELD, never prose — a slug naming a foreign plan refuses
  // directly; the run's own slug exempts the row (so a token-less short ruling still LAUNCHES —
  // fail-open preserved — and the own-token fail-open arm stays rare because the shape requires
  // the coordinate). Scans the RAW arg, not the intake-filtered ruledAsks, so a foreign record
  // the intake would drop as malformed is still refused at entry.
  // ANCHOR (#1879 recovery seed S1): NEVER the OPTIONAL top-level planSlug alone — an
  // explicit-branch/worktree launch omits it, and the compare must not silently switch off. The
  // fallback is the sibling rowText floor's guaranteed-present anchor, ownPlanBase (plan.file's
  // basename), baseOf()-normalized on BOTH sides with the .md suffix stripped. When NO anchor is
  // derivable (planSlug-less AND plan-less launch) the row is NOT exempted — but that arm is
  // OPERATIONALLY EMPTY, not a second line of defense: ownTokens derives from those same two
  // values, so it is [] in exactly that configuration and the own-token floor short-circuits
  // fail-open (#1893). The anchor IS the guard here; a launch with neither planSlug nor plan.file
  // is already refused for a tasks-bearing DAG by the entry belt (#1430).
  const slugAnchorOf = s => baseOf(s).replace(/\.md$/i, '')
  const ruledAskAnchor = planSlug ? slugAnchorOf(planSlug) : (ownPlanBase ? slugAnchorOf(ownPlanBase) : null)
  const ruledAskRowText = row => {
    if (typeof row === 'string') return { text: row, exempt: false }  // a string row is its own scannable text (the sibling rowText discipline)
    if (!row || typeof row !== 'object') return { text: '', exempt: true }
    const text = ['ruling', 'suggested_fix', 'findingTitle', 'title']
      .map(k => (typeof row[k] === 'string') ? row[k] : '').filter(Boolean).join('\n')
    if (typeof row.planSlug === 'string' && row.planSlug && ruledAskAnchor) {
      if (slugAnchorOf(row.planSlug) !== ruledAskAnchor) return { foreignStamp: row.planSlug, stampNoun: 'planSlug', stampAnchor: planSlug ? 'the run planSlug' : 'the plan.file basename' }
      return { text, exempt: true }
    }
    return { text, exempt: false }
  }
  const provenanceSurfaces = [
    ['intent', intent ? [{ text: intent, exempt: false }] : []],
    ['backstops', Array.isArray(backstops) ? backstops.map(rowText) : []],
    ['adjudications', adjudications.map(rowText)],
    ['ruledAsks', Array.isArray(A.ruledAsks) ? A.ruledAsks.map(ruledAskRowText) : []],
  ]
  for (const [argName, rows] of provenanceSurfaces) {
    const stamped = rows.find(r => r.foreignStamp)
    if (stamped) {
      provenanceProblems.push('workflow-template: args.' + argName + ' carries a ' + (stamped.stampNoun || 'planFile') + ' provenance stamp naming a foreign plan (' + stamped.foreignStamp + ') differing from ' + (stamped.stampAnchor || 'plan.file') + ' — a cross-plan args leak; refused at entry (#1413)')
      continue
    }
    // scanText: non-exempt rows only (the refusal surface). evidenceText: every row's intent-bearing
    // text (own-token satisfaction may come from an exempt row).
    const scanText = rows.filter(r => !r.exempt && r.text).map(r => r.text).join('\n')
    const evidenceText = rows.filter(r => r.text).map(r => r.text).join('\n')
    if (!scanText) continue
    const planIds = scanText.match(/docs\/plans\/[A-Za-z0-9._/-]+\.md/g) || []
    const foreignIds = ownPlanBase ? planIds.filter(id => baseOf(id) !== ownPlanBase) : []
    if (foreignIds.length) {
      provenanceProblems.push('workflow-template: args.' + argName + ' names a foreign docs/plans identifier (' + foreignIds[0] + ') differing from plan.file — a cross-plan args leak; refused at entry (#1413)')
    } else if (ownTokens.length && !ownTokens.some(t => new RegExp('\\b' + t + '\\b', 'i').test(evidenceText))) {
      provenanceProblems.push('workflow-template: args.' + argName + " contains none of the run's own plan-slug tokens [" + ownTokens.join(', ') + '] — a cross-plan args leak; refused at entry (#1413)')
    }
  }
  if (provenanceProblems.length) throw new Error(provenanceProblems.join('; '))
}

// Ruled-ask execution (D15(b), PIN-17/PIN-18 — the final-phase polish-style vehicle): the Lead
// threads interactively-ruled asks whose fixes are FULLY SPECIFIED as args.ruledAsks
// ([{ task?, file?, line?, suggested_fix, ruling, planSlug, phase, findingTitle }] — suggested_fix
// and ruling required, plus the REQUIRED provenance coordinates (#1879 RULING 2): planSlug (source
// plan slug), phase, findingTitle — the #1413 args-provenance floor ABOVE reads these FIELDS, not
// prose, so a channel record is floor-compatible by construction). Intake ordering + the floor's
// precedence: the floor screens the RAW args.ruledAsks FIRST (and this block deliberately sits
// AFTER it, so no foreign record's prose is journaled before the refusal) — a coordinate-less
// record whose intent-bearing text carries none of the run's own plan-slug tokens is REFUSED at
// entry before this intake filter ever sees it; the drop-and-log fail-open arm below covers only
// records that clear the floor: such a non-conforming entry is DROPPED and LOGGED with its
// findingTitle-or-'(malformed)' and the failed conjunct — inert to the queue, fail-open, never
// silent: an operator ruling never vanishes silently (#1879 S3). Each conforming record
// rides the phase-close sweep — exactly the
// polish-style dispatch D15 names: fresh worktree at the working tip, one ace-eligibility commit,
// full panel re-audit, the existing merge/land primitives, bounded at ONE round by construction.
// Filing-on-non-execution (PIN-17): a sweep discard/skip/drain demotes the entry to follow-up with
// the ruling in its rationale, so the filed issue records the ruling — an issue is filed ONLY on
// cannot-execute or execution-failure, never silently, never as default litter. The
// decompose-injection arm (a next phase exists) is Lead doctrine (skills/war/SKILL.md
// § Checkpoint), not engine machinery.
// Per-record intake gate: returns null on a conforming record, else the NAME of the first failed
// conjunct — the drop log names it so the operator can repair the record shape (#1879 S3).
const ruledAskIntakeReject = x => {
  if (!x || typeof x !== 'object') return 'not an object'
  if (!(typeof x.suggested_fix === 'string' && x.suggested_fix)) return 'suggested_fix (required non-empty string)'
  if (!(typeof x.ruling === 'string' && x.ruling)) return 'ruling (required non-empty string)'
  if (!(typeof x.planSlug === 'string' && x.planSlug)) return 'planSlug (required provenance coordinate, #1879 RULING 2)'
  if (!((typeof x.phase === 'string' && x.phase) || typeof x.phase === 'number')) return 'phase (required provenance coordinate, #1879 RULING 2)'
  if (!(typeof x.findingTitle === 'string' && x.findingTitle)) return 'findingTitle (required provenance coordinate, #1879 RULING 2)'
  return null
}
const ruledAsks = []
for (const x of (Array.isArray(A.ruledAsks) ? A.ruledAsks : [])) {
  const failedConjunct = ruledAskIntakeReject(x)
  if (failedConjunct) {
    log('ruled-ask intake DROPPED a non-conforming record ("' + ((x && typeof x === 'object' && typeof x.findingTitle === 'string' && x.findingTitle) ? x.findingTitle : '(malformed)') + '") — failed conjunct: ' + failedConjunct + ' — an operator ruling never vanishes silently; repair the record shape and re-thread (#1879 S3).')
    continue
  }
  ruledAsks.push(x)
}
// Container-level loudness (the same 'never vanishes silently' invariant, one level up): a
// present-but-non-array args.ruledAsks (a single record threaded unwrapped, or a {records:[...]}
// container) would otherwise degrade to zero rows with no log line at either consumer.
if (!Array.isArray(A.ruledAsks) && A.ruledAsks != null) {
  log('ruled-ask intake IGNORED a non-array args.ruledAsks (' + typeof A.ruledAsks + ') — the channel takes an array of records; an operator ruling never vanishes silently (#1879 S3).')
}
for (const ra of ruledAsks) {
  log('ruled-ask execution (D15): "' + ra.findingTitle + '" queued for the phase-close polish dispatch — operator ruling: ' + ra.ruling)
  phaseCloseQueue.push({ severity: 'Minor', disposition: 'absorb', phaseClose: true, ruledAsk: true,
    task: ra.task ?? 'ruled-ask', title: ra.findingTitle, file: ra.file ?? null,
    ...(ra.line != null ? { line: ra.line } : {}),
    rationale: 'ruled ask (operator ruling: ' + ra.ruling + ')', suggested_fix: ra.suggested_fix })
}

// GATE COMPOSITION POINT (engine-owned, ADR 0036): normalize plan.gate ONCE here, immediately after entry
// validation and before ANY gate-bearing dispatch site interpolates ${plan.gate}. resolveGate is
// idempotent, so this composes harmlessly even when the Lead already pre-resolved via --resolve-gate (the belt;
// this engine normalization is the suspenders — a missed pre-resolution can no longer ship a shell-blind gate).
// GUARDED: `plan` is entry-validated ONLY on a tasks-bearing launch (#1430's plan.file class), so an absent
// plan on a plan-less ZERO-TASK phase is still a reachable state and a NO-OP here — distinct from a null/absent
// plan.gate, which composes to the discovery-only clause. An unconditional plan.gate= would TypeError into
// held:workflow-error on that reachable state.
if (plan) plan.gate = resolveGate(plan.gate)

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
  // dispatchAgent (Phase 6 Task 1 (c)): a post-spawn harness death of THIS dispatch is TAGGED at the
  // dispatch layer, so the wave thunk's catch classifies it env-died SOFT (#1411) — not HARD escalate.
  const out = await dispatchAgent(
    pt`PROVISION the worktree for WAR task ${task.id} before its worker runs. cd into ${task.worktree} `
    + pt`(the refiner's Provision barrier already created it) and run these provisioning commands IN ORDER, `
    + pt`inside that worktree:\n`
    // pt-tagged prompt-feeding row builder: ${c ?? '<step>'} is absence-tolerant (run.provision elements
    // are not per-task-schema-guaranteed; a placeholder over a phase-killing throw — Q17/ADR 0034).
    + provisionList.map((c, i) => pt`  ${i + 1}. ${c ?? '<step>'}`).join('\n') + pt`\n`
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
    // pt-tagged prompt-feeding row builder (threaded into worker/fix/ace/polish prompts); ${c ?? '<step>'}
    // absence-tolerant (this clause is built at init — top-level-catch context; placeholder over a throw).
    + provisionList.map((c, i) => pt`  ${i + 1}. ${c ?? '<step>'}`).join('\n')
  : ''

const blockingOf = seats => seats.flatMap(s => s.findings || []).filter(f => f.severity === 'Critical' || f.severity === 'Major')
// auditShaOrSentinel (#1693, Phase 5 Task 1): validates the seat-echoed audit_sha before it is stamped
// as a finding's `sha` — a malformed/free-text value (a ref expression, prose, an empty string) becomes
// the sentinel, never an operator-facing asks[].sha pin; an ABSENT sha stays null (the absence-tolerant
// contract parkAsk's `?? null` and the handoff projection already pin). Deliberately a SELF-CONTAINED
// sibling copy of the isSha/pinOrSentinel hex test (the #393 extract-and-eval convention keeps each such
// arrow self-contained; pinOrSentinel is wave-loop-scoped and its sentinel is integration_sha-specific,
// so it is NOT reusable here) — the sibling-copy drift guard lands deps-edged in the fixtures task.
const auditShaOrSentinel = s => s == null ? null : (typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s) ? s : '(audit_sha unrecorded/malformed)')
// minorsOf returns seat-stamped COPIES (never the seat's own finding objects): each Minor/Nit carries
// the raising seat's id so the pre-filing follow-up consolidation (Task 2.1, #1566) can build merged
// rows' seats[] corroboration list, plus the seat's echoed audit_sha — validated through
// auditShaOrSentinel (#1693) — as `sha` so a parked ask carries its provenance pin (#1550).
// Explicit finding-level `seat`/`sha` (spread last) win. `lens` (#1913) rides alongside: the roster is
// keyed by LENS, so the delta-scaled re-audit's originating-seat selection needs the raising seat's lens,
// not its free-form seat id, to pick the roster entries that re-run (D3/PIN-10).
const minorsOf   = seats => seats.flatMap(s => (s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit').map(f => ({ seat: s.seat, lens: s.lens, sha: auditShaOrSentinel(s.audit_sha), ...f })))
// Disposition classification (ADR 0013; ask member #1550): auditor-owned routing, orthogonal to
// severity. The ask arm precedes the absorb chain (D7 order-census). 'ask' is NEVER defaulted — an
// ask exists only when the seat set disposition:'ask' explicitly. Omitted disposition (in-band-
// absorb-default D1/D4, the diff-probe default): `diff` is the task's git-derived diff_files Set
// (null when the probe failed or never ran — the polish pseudo-task, the escalation arm). A fully
// specified finding (non-empty suggested_fix) on a probed task reads 'absorb' — and when its file is
// OUTSIDE the diff the classifier stamps phaseClose:true on the row so the absorb rides the sweep
// (the one side effect here; every caller keeps its single-arg-shaped routing chain). Otherwise the
// old severity default: Minor → 'follow-up', Nit → 'note'. Legacy autoFixable:true reads as
// 'absorb' for one release (deprecated — removed next release).
const dispositionOf = (f, diff) => {
  if (f.disposition === 'ask') return 'ask'
  if (f.disposition === 'absorb' || f.disposition === 'follow-up' || f.disposition === 'note') return f.disposition
  if (f.autoFixable === true) return 'absorb'
  if (diff instanceof Set && typeof f.suggested_fix === 'string' && f.suggested_fix.trim()) {
    if (!(typeof f.file === 'string' && f.file && diff.has(aceRelPath(f.file)))) f.phaseClose = true
    return 'absorb'
  }
  return f.severity === 'Minor' ? 'follow-up' : 'note'
}
// Diff-probe registry (in-band-absorb-default D4, PIN-6): task id → the aceRelPath-normalized Set of
// the task branch's git-derived diff_files (the per-task refiner diff-probe dispatch), or null when
// the probe failed / never ran. Stamped in the wave thunk before the seats convene; read by
// dispositionOf (through diffFilesOf) and the intake floor. The polish pseudo-task and the escalation
// arm never register — null there, the old default. Never worker files_changed.
const diffFilesByTask = new Map()
const diffFilesOf = t => { const v = diffFilesByTask.get(t && t.id); return v instanceof Set ? v : null }
const floorSkipLogged = new Set()
// Intake filing floor (in-band-absorb-default D4, PIN-6): runs right after dispositionOf at every
// task-seat routing site, before any row is filed — SEAT ROWS ONLY (a demote()-stamped engineFiled
// row passes through untouched: an engine demotion with no barrier is never rerouted). Deterministic
// inputs only: the task's git-derived diff_files and BARRIER_TOKENS membership — never prose
// matching, never a size estimate. Arms: a seat-set `follow-up` with no barrier (or a token outside
// the enum) ⇒ 'absorb' — in-diff it joins the task's own ace batch; out-of-diff it rides
// phaseClose:true to the sweep; `barrier:trade-off` with the `ask` field ⇒ 'ask', without it ⇒ keep
// 'follow-up' with the "trade-off without ask fields" log (never a schema throw); any other barrier
// ⇒ file as stated; a seat `note` whose file is in diff_files with a non-empty suggested_fix ⇒
// 'absorb' ("note with a specified fix rerouted"); every other row keeps its classification. Probe
// ABSENT (diff null) ⇒ the old default stands, the task's skip is logged once, and each seat row
// filed for that task carries floorSkipped (rendered demote:floor-skipped on the issue-body prefix
// line; the escalation arm and the sweep panel's polish pseudo-task stamp the same flag, each with
// its own log line) — never demote:floor-skipped from the gate-audit pass, which has its own floor.
const intakeFloor = (f, d, diff) => {
  if (f.engineFiled === true) return d
  if (!(diff instanceof Set)) {
    if (f.task != null && !floorSkipLogged.has(f.task)) {
      floorSkipLogged.add(f.task)
      log('intake floor SKIPPED for task ' + f.task + ': no diff-probe result (the probe failed or never ran) — the old severity default stands and this task\'s filed seat rows carry demote:floor-skipped (D4).')
    }
    if (d === 'follow-up') f.floorSkipped = true
    return d
  }
  const inDiff = typeof f.file === 'string' && f.file.length > 0 && diff.has(aceRelPath(f.file))
  const fix = typeof f.suggested_fix === 'string' && f.suggested_fix.trim().length > 0
  const barrier = BARRIER_TOKENS.includes(f.barrier) ? f.barrier : null
  if (f.disposition === 'follow-up') {
    if (!barrier) {
      if (!inDiff) f.phaseClose = true
      log('intake floor REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (task ' + (f.task ?? '?') + ') follow-up carried no barrier tag' + (typeof f.barrier === 'string' ? ' (unknown token "' + f.barrier + '")' : '') + ' → absorb' + (inDiff ? ' (in-diff: joins the task\'s ace batch)' : ' + phaseClose:true (out-of-diff: rides the sweep)') + ' — follow-up is legal only with a BARRIER_TOKENS member (D4).')
      return 'absorb'
    }
    if (barrier === 'barrier:trade-off') {
      if (f.ask && typeof f.ask === 'object' && typeof f.ask.question === 'string' && f.ask.question) {
        log('intake floor REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (task ' + (f.task ?? '?') + ') barrier:trade-off with the ask field → ask (parked for the Checkpoint ruling, D4).')
        return 'ask'
      }
      log('intake floor: [' + f.severity + '] "' + (f.title ?? '') + '" (task ' + (f.task ?? '?') + ') trade-off without ask fields — kept follow-up as stated (barrier:trade-off is an ask route; carry the ask field to park it, D4).')
      return 'follow-up'
    }
    return 'follow-up'   // any other barrier: filed as stated
  }
  if (f.disposition === 'note' && inDiff && fix) {
    log('intake floor REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (task ' + (f.task ?? '?') + ') note with a specified fix rerouted → absorb (a note that names a fix in a touched file is applied, D4).')
    return 'absorb'
  }
  return d
}
// Cross-round ASK content identity (#1810, D8 property floor): the key is STABLE across
// rounds for the SAME ask (minorsOf re-mints a fresh copy of every Minor/Nit per round, and
// seat/sha churn never changes the key) AND DISTINGUISHES distinct asks on the same task
// (distinct questions → distinct keys). Tuple choice is implementer latitude (D8 floors the
// property, not the tuple): task + the parkAsk question derivation. parkAsk-ONLY — the FINDING
// registries key on the richer remintKey tuple below (registry-coverage fix: a question-derived
// key under-distinguishes same-question findings on different files).
const askContentKey = f => (f.task ?? '') + '\u0000' + ((f.ask && f.ask.question) || f.title || '(question unrecorded)')
// aceRelPath (#1813, culprit-path form D12): repo-relative normalization with any leading `./` run
// stripped, so a `./`-prefixed report and a bare plan path attribute identically. Non-strings pass
// through untouched (callers filter them as falsy). File scope (hoisted out of the wave loop,
// in-band-absorb-default Phase 3): remintKey, the ace grouping key, the culprit compare, both
// `Ace-Subset` trailer builds, and recordAcedTouched all normalize through this one helper.
const aceRelPath = p => typeof p === 'string' ? p.replace(/^(?:\.\/)+/, '') : p
// Cross-round FINDING re-mint identity (registry-coverage fix, D8 property floor): the FINDING
// registries (acedKeys / revertedKeys / filedKeys / queuedKeys) key on the richer tuple
// task + aceRelPath-normalized file + title — stable across rounds for the same finding
// (seat/sha churn and `./`-form path drift never change the key — the file-scope aceRelPath
// above) while distinguishing distinct same-task findings by file AND title. The
// question-derived askContentKey stays parkAsk-only.
const remintKey = f => (f.task ?? '') + '\u0000'
  + (typeof f.file === 'string' ? aceRelPath(f.file) : '') + '\u0000'
  + (f.title ?? '')
// asks[] parking (#1550, D1 — the ask channel): a disposition:'ask' Minor/Nit parks in the run
// artifact and is ruled by the operator at the Checkpoint strike-list gate — NEVER filed unruled
// (the follow-up consolidation and the file-followups dispatch read minorsFiled only), never
// dropped. Exactly-once membership by CONTENT identity (#1810 — the old object-identity check
// false-missed minorsOf's per-round fresh copies, parking a persisting ask once per round): every
// route into asks[] — the six dispositionOf-site ask arms (the gate-audit floor pass among them,
// in-band-absorb-default D15: the three gate-audit-family seats' rows route through that ONE
// producer, so its ask arm is a census member like any seat's), AND the demote() ask refusal —
// funnels through here, so one finding can never park twice. A content collision MERGES as corroboration and is log()ged (#1790 — never a silent
// drop): the colliding raiser lands on the surviving record's `corroborators` list. Record floor:
// question + fork (the decision needed + the two branches, from the finding's schema-mandatory
// `ask` field; absence-tolerant fallbacks — fail-open, never a throw) plus task/seat/sha
// provenance; `finding` keeps the full row (the handoff block projects a lossy subset without it).
const parkAsk = f => {
  const key = askContentKey(f)
  const dup = asks.find(a => a.key === key)
  if (dup) {
    dup.corroborators = Array.isArray(dup.corroborators) ? dup.corroborators : []
    dup.corroborators.push({ seat: f.seat ?? null, sha: f.sha ?? null })
    log('ask collision merged as corroboration: "' + dup.question + '" (task ' + (f.task ?? '?') + ') re-raised by ' + (f.seat ?? 'an unattributed seat') + ' — one parked record survives, the re-raise recorded on its corroborators list (never a silent drop, #1790).')
    return
  }
  asks.push({ key, task: f.task ?? null, seat: f.seat ?? null, sha: f.sha ?? null,
    question: (f.ask && f.ask.question) || f.title || '(question unrecorded)',
    fork: (f.ask && Array.isArray(f.ask.fork)) ? f.ask.fork : [],
    finding: f })
}
// Terminal-disposition demotion ladder (ADR 0013): demote one step toward durability, never drop
// silently — EVERY demotion is log()ged. Arms (each follow-up reason leads with its DEMOTE_REASONS
// prefix, in-band-absorb-default D13): a forward-reverted ace/subset/re-entry batch's findings
// (demote:absorb-regressed — the fix itself broke a re-audit: named culprits, an all-culprit batch,
// an ambiguous-and-atomic batch, a finally-failing subset at the depth/split floor, a regressed
// re-entry batch; a reverted finding never re-enters, the oscillation bound); non-approve-branch
// findings (demote:task-unapproved, filed with the escalation); a held absorb (r.task.pendingAbsorbs)
// on a task that ends escalated, audit-blocked, or never merged (demote:absorb-blocked); a held phase
// or an unusable sweep roster / polish provisioning (demote:sweep-skipped); a discarded sweep
// (demote:sweep-discarded) and a sweep-raised absorb at its terminal arms (demote:terminal-pass /
// demote:sweep-discarded); a fileless absorb (demote:fileless, severity default); a release-slot
// absorb at birth (demote:release-slot); a sweep-time exclusion-set hit (demote:exclusion-set). A
// FAILED ATTEMPT never demotes: an untouched-file ace row, a dead ace/subset/re-entry worker's rows,
// and a red gate at an ace-family tip route to the sweep (routeToSweep, phaseClose:true) — the ace
// attempt did not happen, so the sweep is the next rung. A FRESH absorb born at a re-audit re-enters
// the ladder (routeReauditMinors → aceReentry, absorb-budget-bounded) or routes phaseClose:true to
// the sweep when the budget is spent (D1/D2, #1731); with run.ace off every defaulted absorb routes
// phaseClose:true to the sweep (D14, PIN-16) — the old ace-off demotion is retired.
// RUNTIME PREFIX VALIDATION (D13, PIN-15): every follow-up reason must lead with a DEMOTE_REASONS
// member; a miss prepends 'demote:unclassified' and logs the site loudly — never a throw, so the
// issue body's prefix line is never blank. Every demoted row is stamped engineFiled: true (the intake
// floor reads seat rows only and skips stamped rows) and carries its reason as demoteReason.
// ASK REFUSAL (#1550, D1): demote() refuses an ask unconditionally and LOUDLY — an ask is ruled by
// the operator at the Checkpoint strike-list gate, never demoted into debt (minorsFiled) or an
// observation (notes) by machinery. log() + re-route onto asks[] (exactly-once by content identity
// via parkAsk), NEVER a throw: held:workflow-error omits the handoff, so a throw here would destroy
// the very parked records the refusal exists to protect (this sentence is the standing guard
// against a future "harden it to a throw" cleanup). The sole lawful ask→follow-up conversion is the
// Checkpoint --afk no-match arm (Lead-side, question preserved) — never a demote() bypass flag.
// FORWARD-REVERT REGISTRATION: a demote on a forward-revert arm passes { reverted: true } so the
// finding's content key lands in revertedKeys — the oscillation bound's enforcement registry (a
// forward-reverted finding never re-enters; routeReauditMinors consults the set).
const demote = (f, to, why, opts) => {
  if (f.disposition === 'ask') {
    log('Disposition demotion REFUSED (ask): [' + f.severity + '] "' + f.title + '" (task ' + f.task + ') — an ask is ruled at the Checkpoint, never demoted (' + why + '); re-routed onto asks[].')
    parkAsk(f)
    return
  }
  if (to === 'follow-up' && !DEMOTE_REASONS.some(p => typeof why === 'string' && why.startsWith(p))) {
    log('DEMOTE_REASONS MISS (unclassified engine demotion, D13): the follow-up reason "' + why + '" for [' + f.severity + '] "' + f.title + '" (task ' + f.task + ') carries no DEMOTE_REASONS prefix — prepending demote:unclassified; classify this demote() site (a /war-review defect signal).')
    why = 'demote:unclassified — ' + why
  }
  log(`Disposition demotion: [${f.severity}] "${f.title}" (task ${f.task}) → ${to} — ${why}.`)
  f.engineFiled = true
  f.demoteReason = why
  ;(to === 'note' ? notes : minorsFiled).push(f)
  if (to !== 'note') filedKeys.add(remintKey(f))   // the filed funnel (End state 6) — a demoted follow-up is a filed record
  if (opts && opts.reverted) revertedKeys.add(remintKey(f))
}
// --ace release-slot STRING backstop only (D4). The sandbox can't read files, so the ORCHESTRATOR's
// one enforceable refusal is the release-slot filename check; the AUDITOR (which reads code) owns the
// barrier refusals via finding.disposition + barrier. The refusal is the two pure version-slot JSONs
// (ADR 0013, RELEASE_SLOT_FILES): README/shared-file absorb findings are never refused — they route
// to the ace or the phaseCloseQueue. releaseSlotBasename derives the basenames from the inline
// RELEASE_SLOT_FILES mirror (in-band-absorb-default D2) — ONE helper shared by aceEligible and the
// sweep exclusion set, so the refusal keeps its breadth in any directory (sub/dir/plugin.json refused,
// plugin.json.bak not). Requires a file — a fileless finding is never ace-eligible (it takes the
// severity-default demotion instead). A release-slot absorb demotes where it is born
// (demote:release-slot, owner "the release slot") — never the ace, never the sweep (PIN-11).
const aceEligible = f => f.file && !isReleaseSlotFile(f.file)
const releaseSlotBasename = p => (typeof p === 'string' ? aceRelPath(p) : '').replace(/^.*\//, '')
const RELEASE_SLOT_BASENAMES = new Set(RELEASE_SLOT_FILES.map(releaseSlotBasename))
const isReleaseSlotFile = p => typeof p === 'string' && p.length > 0 && RELEASE_SLOT_BASENAMES.has(releaseSlotBasename(p))
const demoteReleaseSlot = f => demote(f, 'follow-up', 'demote:release-slot — release-slot absorb refused at birth: ' + aceRelPath(f.file) + ' is owned by the release slot (RELEASE_SLOT_FILES; never the ace, never the sweep, PIN-11)')
// aced-record funnel (#1810 double-file arm, D8): every aced push records the finding's content key
// so a later-round re-mint of an ALREADY-ABSORBED finding can never also file (no finding lands in
// both `aced` and `minorsFiled`). A citation-resolved absorb (D6) additionally stamps the citation
// (row-id + match rationale) onto the durable `aced` record and — ONLY when run.afk === true
// (#1879 RULING 1, the one-condition gate) — RESOLVES the matching parked ask: logged, never a
// silent unpark (the ask's question was answered by execution, not demotion). INTERACTIVE runs
// never auto-unpark past a present operator: the matched ask STAYS PARKED and gains a
// `citationPrefill` (matched row + match rationale + executed sha + recommended ruling) that the
// handoff's asks projection carries onto the Checkpoint strike list — one-confirm ergonomics; a
// confirm-via-prefill records as a citation-informed ruling in the SAME telemetry channel as an
// --afk resolution (the aced record's citation stamp, which both modes write). A citation absorb
// whose content keys match NO parked record logs the miss too (never a silent no-op).
const acedKeys = new Set()
// forward-revert funnel (the oscillation bound, A1): every finding demoted on a forward-revert arm
// (aceReentry's regressed batch; aceBisect's culprit, whole-batch, and depth/split-floor demotions)
// records its content key here (via demote's { reverted: true } opt) so routeReauditMinors can
// refuse a content-identical re-mint — a forward-reverted finding never re-enters; its demoted
// follow-up record in minorsFiled is the durable home (no second file, no aced∩minorsFiled overlap).
const revertedKeys = new Set()
// filed funnel (End state 6, the OTHER direction): every follow-up that lands in minorsFiled on a
// path with a later re-audit window records its content key here, so a re-mint of an ALREADY-FILED
// finding — re-raised as absorb (the D3 widening's re-audit default) or as follow-up again — never
// re-enters the ladder and never files a second record: the filed record is the durable home; the
// re-mint is corroboration (logged). Stamped at the three sites a later same-task re-audit can see:
// the round-1 approve-branch follow-up arm, routeReauditMinors' follow-up arm, and demote()'s
// minorsFiled push. The escalation-arm and phase-close-sweep DIRECT pushes are NOT stamped — no
// later re-audit runs for that task/phase, so no re-mint window exists there (their demote()-routed
// siblings stamp anyway; a superfluous key is harmless — the registry is only consulted at re-audit
// routing and re-entry drain).
const filedKeys = new Set()
// queued funnel (registry-coverage fix): every finding queued for the phase-close sweep (EVERY
// phaseCloseQueue entry point — routeToSweep, the round-1 approve arm's direct push, and the
// gate-audit floor pass's routeToSweep calls; the ruledAsks intake is the seeded exception), for
// budget-bounded re-entry (r.reentryQueue), or HELD for the next ace batch (the batch-ace
// blocker hold onto r.task.pendingAbsorbs) records its remintKey here, so a content-identical
// re-mint at a later re-audit never queues a SECOND record — the queued record stands (logged,
// never silent). Consulted LAST in remintBlock (aced/reverted/filed reasons are more specific);
// aceReentry's drain deletes the drained entries' keys before its re-check (a drained finding is
// no longer queued — the drain-time re-filter must judge it on the OTHER registries alone).
const queuedKeys = new Set()
const fileFollowUp = f => { minorsFiled.push(f); filedKeys.add(remintKey(f)) }
const recordAced = (f, sha, extra) => {
  acedKeys.add(remintKey(f))
  if (extra && extra.citation) {
    // Widened unpark match (both derivations): the parked record's key came from the round-1 ask's
    // `question`; the citation-carrying absorb's key derives from its own `ask.question` OR `title`
    // (the prompt contract asks the seat to echo the parked `ask` field verbatim, but the schema
    // makes `ask` mandatory only on disposition:'ask' — so match against every derivation the
    // citation shape can carry, and LOG a miss: an executed-but-still-parked ask is never silent).
    const keys = new Set([askContentKey(f)])
    if (typeof f.title === 'string' && f.title) keys.add(askContentKey({ task: f.task, title: f.title }))
    if (f.ask && f.ask.question) keys.add(askContentKey({ task: f.task, ask: { question: f.ask.question } }))
    const i = asks.findIndex(a => keys.has(a.key))
    if (i !== -1) {
      if (run.afk === true) {
        asks.splice(i, 1)
        log('parked ask resolved by citation (row "' + extra.citation.row + '"): "' + (f.title ?? '(untitled)') + '" (task ' + (f.task ?? '?') + ') executed as an absorb at ' + sha + ' — the aced record carries row-id + match rationale.')
      } else {
        // Interactive (#1879 RULING 1): surface, never auto-unpark past a present operator. The
        // prefill's `row` is the MATCHED THREADED standing row's bytes (citationOf.threadedRow,
        // #1879 recovery seed S2) — what the operator confirms from is the row itself, never the
        // seat's citation string (a paraphrase would make the one-keystroke confirm ratify a
        // description of a row rather than the row).
        const threaded = (typeof extra.citation.threadedRow === 'string' && extra.citation.threadedRow) ? extra.citation.threadedRow : extra.citation.row
        asks[i].citationPrefill = { row: threaded, rationale: extra.citation.rationale, sha,
          recommendedRuling: 'standing row "' + threaded + '" covers this trade-off; confirm?' }
        log('parked ask citation-matched (row "' + extra.citation.row + '"): "' + (f.title ?? '(untitled)') + '" (task ' + (f.task ?? '?') + ') executed as an absorb at ' + sha + ' — INTERACTIVE run: the ask STAYS PARKED and surfaces on the Checkpoint strike list with the matched row + a prefilled recommended ruling (one-confirm; never auto-unparked past a present operator). A confirm-via-prefill records as a citation-informed ruling in the same telemetry channel: the aced record already carries row-id + match rationale.')
      }
    } else {
      log('citation absorb executed with NO matching parked ask (row "' + extra.citation.row + '"): "' + (f.title ?? '(untitled)') + '" (task ' + (f.task ?? '?') + ') aced at ' + sha + ' but no asks[] record matched its content key — if the trade-off question is parked under other wording, the operator still rules it at the Checkpoint (logged, never a silent no-op).')
    }
  }
  aced.push({ task: f.task, finding: f, sha, ...(extra || {}) })
}
// Sweep routing (D2 ladder rung; in-band-absorb-default D13/D14/D15): the phase-close sweep is the
// vehicle when the ace ladder cannot dispatch (spent budget, ace off, a failed attempt — an untouched
// file, a dead worker, a red gate at the ace tip), for an out-of-diff absorb, and for the gate-audit
// family's absorbs — logged, never silent; the sweep-time exclusion set and a sweep discard demote
// downstream. Release-slot rows never enter here (demoteReleaseSlot at birth, PIN-11).
const routeToSweep = (f, why) => {
  log('Re-entry routing: [' + f.severity + '] "' + (f.title ?? '') + '" (task ' + (f.task ?? '?') + ') → phaseClose sweep — ' + why + '.')
  queuedKeys.add(remintKey(f))
  phaseCloseQueue.push({ ...f, phaseClose: true })
}
// Re-audit-born finding routing (D1/D2/D3, #1731 — replaces the retired "the ladder never opens
// for fresh findings" demotions): fresh Minor/Nits raised at ANY re-audit (the plain batch
// re-audit, a bisection subset's re-audit, a re-entry batch's own re-audit, or the merge-slot
// pin-transfer MISMATCH re-audit) route by disposition; a fresh ELIGIBLE absorb queues on
// r.reentryQueue for budget-bounded RE-ENTRY (aceReentry dispatches it while absorbRounds <
// run.absorbRounds). phaseClose absorbs route to the sweep (a release-slot absorb demotes at birth),
// and so does EVERY absorb under the noReentry opt (the merge-slot caller, whose re-entry queue has
// no drain left) or with run.ace off (D14). BOTH the follow-up and absorb arms consult the content-key registries
// (#1810 + the oscillation bound, A1): a re-mint of an already-aced finding is corroboration,
// never a second (filed) record and never a re-queue; a re-mint of a FORWARD-REVERTED finding
// never re-enters (its demoted follow-up record in minorsFiled stands) and never files twice.
// Content-key re-mint suppression (shared by BOTH arms below AND re-checked at aceReentry's drain):
// returns the reason string when the finding's remintKey is already aced, forward-reverted, filed as
// a follow-up in an earlier round, or queued for the sweep / re-entry — the caller logs the
// suppression, merges the raising seat onto the surviving row (corroborateSurvivor), and skips
// (corroboration / the oscillation bound / the filed or queued record stands), never files a second
// record and never re-queues. queuedKeys is consulted LAST — the terminal-outcome reasons win.
const remintBlock = f => {
  const k = remintKey(f)
  if (acedKeys.has(k)) return 'corroboration of the aced record (content-key identity, #1810)'
  if (revertedKeys.has(k)) return 'a forward-reverted finding never re-enters (the oscillation bound, A1); its demoted follow-up record stands'
  if (filedKeys.has(k)) return 'already filed as a follow-up in an earlier round (content-key identity); the filed record stands — a re-mint never also aces (End state 6)'
  if (queuedKeys.has(k)) return 'already queued for the phase-close sweep / re-entry, or held for the next ace batch, this phase — the queued record stands'
  return null
}
// Cross-seat corroboration (registry-coverage fix): a re-mint remintBlock refuses whose surviving
// record lives in minorsFiled (or on an aced record's finding) merges the SECOND seat onto the
// surviving row's seats list — never dropped, never double-filed. Entry shape mirrors the filing
// consolidation's seatRef contract (seat+task, both when present; that block is scoped below, so
// the shape is inlined here — change both together). The survivor's own ref seeds the list so the
// handoff's seats rendering never loses the first raiser.
const seatRefOf = f => f.seat != null
  ? (f.task != null ? f.seat + ' (task ' + f.task + ')' : f.seat)
  : (f.task != null ? 'task ' + f.task : 'unattributed')
const corroborateSurvivor = f => {
  const k = remintKey(f)
  const hit = minorsFiled.find(m => remintKey(m) === k)
    || (aced.find(a => a && a.finding && remintKey(a.finding) === k) || {}).finding
    || phaseCloseQueue.find(q => remintKey(q) === k)
  if (!hit) return
  if (!Array.isArray(hit.seats)) hit.seats = [seatRefOf(hit)]
  const ref = seatRefOf(f)
  if (!hit.seats.includes(ref)) hit.seats.push(ref)
}
const routeReauditMinors = (r, seats, opts) => {
  // noReentry (#1931): the caller is PAST the wave side, so r.reentryQueue has no drain left —
  // aceReentry is wave-side only. The absorb-eligible arm then routes to the phase-close sweep
  // instead of the re-entry queue, with the caller's reason. Every other arm is unchanged, so a
  // merge-slot re-audit's findings walk the SAME disposition ladder every wave-side site uses.
  const noReentry = (opts && opts.noReentry) || null
  r.reentryQueue = r.reentryQueue || []
  const diff = diffFilesOf(r.task)
  for (const f of minorsOf(seats).map(x => ({ task: r.task.id, ...x }))) {
    const d = intakeFloor(f, dispositionOf(f, diff), diff)
    const b = (d === 'follow-up' || d === 'absorb') ? remintBlock(f) : null
    if (d === 'ask') parkAsk(f)                     // ask precedes the absorb chain (#1550, D7)
    else if (d === 'follow-up') {
      if (b) { log('re-audit re-mint of "' + (f.title ?? '') + '" (task ' + r.task.id + ') — ' + b + '; not filed (logged, never silent).'); corroborateSurvivor(f) }
      else fileFollowUp(f)
    }
    else if (d === 'note') notes.push(f)
    else if (b) { log('re-entry REFUSED: re-audit re-mint of "' + (f.title ?? '') + '" (task ' + r.task.id + ') — ' + b + '; never re-queued (logged, never silent).'); corroborateSurvivor(f) }
    else if (!f.file) demote(f, f.severity === 'Minor' ? 'follow-up' : 'note', 'demote:fileless — fileless absorb takes the severity default (never ace-eligible)')
    else if (!aceEligible(f)) demoteReleaseSlot(f)                                                     // release-slot absorb demotes at birth (D2, PIN-11)
    else if (!run.ace) routeToSweep(f, 'ace off this run (run.ace false) — the per-task ladder never dispatches; the sweep is the vehicle (D14)')
    else if (!f.phaseClose) {
      if (noReentry) routeToSweep(f, noReentry)                                                          // no drain left — the sweep is the vehicle
      else { queuedKeys.add(remintKey(f)); r.reentryQueue.push(f) }                                      // born at a re-audit — re-enters (D1)
    }
    else routeToSweep(f, 'phaseClose absorb born at a re-audit — the sweep is its vehicle')
  }
}
const allApprove = (seats, expected) => seats.length === expected && seats.every(s => s.verdict === 'approve')
const isSplit    = seats => seats.some(s => s.verdict === 'approve') && seats.some(s => s.verdict === 'request_changes')
// → reason string if the worker did not deliver (null/dead or self-reported blocked), else null
// ponytail: applied at the worker-dispatch sites in T2 (not dead code — defined-but-not-yet-emitted-plan-slice-pattern)
const blockedReason = r => !r ? 'worker returned no result'
  : (r.status === 'blocked' ? (r.blocked_reason || 'worker returned no result') : null)
// Infra-death classification (#1411): a POST-SPAWN harness death (API/quota/transport — the seat
// spawned, then the harness died out from under it) is an environment event, not a code defect. The
// classification is scoped STRUCTURALLY, never by message text alone (relaunch fix): dispatchAgent
// TAGS a throw that crossed the dispatch boundary at the wave thunk's direct agent() dispatches,
// provisionStep's provision-run (classified by the wave-thunk catch), the polish-worktree provision
// and the sweep dispatch (each with its own local catch), and the provision-barrier (tag only — no
// local catch, so its death stays held:workflow-error) (Phase 6 Task 1 (c));
// infraDeathCause classifies 'env-died' (a SOFT_ENV_REASONS member
// beside env-blocked — the mirror at the land decision) ONLY for a TAGGED throw whose message
// matches this pattern set, propagating the harness cause verbatim into `blocked`
// ('worker died: <cause>'). An error thrown anywhere ELSE in the thunk — a pt prompt build,
// normalizeReportedPaths, the auditRound collection — keeps its HARD class REGARDLESS of message
// content: an engine-authored throw that EMBEDS worker-supplied text (a task title, a reported path
// containing e.g. "quota"/"rate limit"/"overloaded") must never be laundered into SOFT env-died,
// which would flip a hard escalation into lands-minus-task. Heuristic by construction WITHIN the
// dispatch layer: an unmatched dispatch-layer death keeps today's generic 'escalate' (fail-safe — a
// false negative lands in the LOUDER class, never a lost task). A null agent() return with no throw
// stays 'worker returned no result' — no cause is visible there to propagate. (The prompt arguments
// are evaluated BEFORE dispatchAgent is entered, so a pt undefined-interpolation throw stays
// untagged by construction.)
const INFRA_DEATH_RE = /session limit|rate limit|quota|overloaded|529|econnreset|econnrefused|etimedout|socket hang up|api connection|transport error/i
const dispatchAgent = async (prompt, opts) => {
  try { return await dispatch(prompt, opts) }
  catch (err) {
    const e = err instanceof Error ? err : new Error(String(err))
    e.warDispatchDeath = true   // structural provenance: the throw originated at the agent() dispatch layer
    throw e
  }
}
const infraDeathCause = err => {
  if (!err || err.warDispatchDeath !== true) return null   // structural scope: dispatch-layer throws only
  const m = String(err.message || err || '')
  return INFRA_DEATH_RE.test(m) ? m : null
}
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
// judgment sentence and the latitude-clause arm (#1431, ADR 0013 Amendment 2026-08-17) — the arm is
// unconditional prose whose BEHAVIOR fires only when the threaded intent carries an explicit
// `Mechanism latitude:` clause; mirrored VERBATIM in agents/war-worker.md (same commit; the D3
// latitude registry row anchors both surfaces from a latitude-bearing-intent fixture).
// Empty when intent is absent (byte-compatible prompts, criterion 10).
const workerIntentClause = intent
  ? intentClause + pt`Use the intent to resolve ambiguity in your slice; intent-consistent deviation is in-band — note it in your result. When the threaded intent carries an explicit \`Mechanism latitude:\` clause, a mechanism substitution that satisfies the binding guardrails and the End states is in-band work, not a deviation to note for adjudication and never a follow-up issue; note the substitution in your result like any other in-band call.\n`
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
// Done-when threading (precision-chain D6, Task 1.3 — prompt truth): the task's `Done when:` acceptance
// command rides the six TASK-SCOPED worker-family dispatched prompts — the primary dispatch plus the
// five fix-family prompts (FIX_NEEDED, ADD_TEST, PACKAGE_IT, MAKE_DONE_PASS, ace) — as a `Done when:` line beside the
// Gate: command, so no task-scoped prompt says keep-the-gate-green without carrying the commands that
// define green (the phase-close sweep is phase-scoped, carries no task doneWhen, and already names the
// gate inline). Absent/null/empty
// ⇒ '' (the set-minus pattern): a legacy plan with no `Done when:` bullets dispatches prompts
// byte-identical to a doneWhen-less run (End state 9). Prompt truth only — the floor that EXECUTES the
// command at merge is the assert-done-when.sh floor (refiner-side; doneWhenFloorClause below), never this clause.
const doneWhenClause = task => (task && typeof task.doneWhen === 'string' && task.doneWhen)
  ? pt`\nDone when: ${task.doneWhen}`
  : ''
// Done-when floor (precision-chain D1/D11, Task 2.3 — the done-unmet route): the refiner EXECUTES the
// task's `Done when:` acceptance command at merge via assert-done-when.sh — file-threaded (--cmd-file,
// executed from the file, never interpolated into another script), in the task worktree, AFTER the gate.
// The run is teed to the .war/done-when-<taskId>.log evidence artifact with the FLOOR's own exit status
// read across the capture (done-when-floor-wiring D3/D14: redirect-then-read $?, or ${PIPESTATUS[0]}
// when piping — never the tee pipeline's status), and exit 1 returns the artifact's ABSOLUTE path in
// done_when_log_path alongside the status. Exit 1 is the done-unmet route (a red command or a timeout)
// and routes the bounded make-this-command-pass fix sub-loop; exit 2 is a git/env error and NEVER
// collapses into the floor status. The clause also pins the D7 precedence: the floor is fail-closed on
// every merge-task dispatch, a baseline-proceed included — a red done-when never rides the baseline
// carve-out. Absent/null/empty
// doneWhen ⇒ '' (the set-minus pattern) — a legacy task dispatches byte-identical merge prompts and the
// floor never runs (End state 9). Rides every merge-task dispatch (initial, floor-retry re-merge,
// environment-proceed, baseline-proceed), keeping the dispatched prompts in sync with war-refiner.md.
const doneWhenFloorClause = (task, refineryPath) => (task && typeof task.doneWhen === 'string' && task.doneWhen)
  ? pt` After the gate, run the done-when floor: write the task's Done when: acceptance command — BYTE-VERBATIM, exactly: ${task.doneWhen} — to ${refineryPath}/.war/done-when-${task.id}.cmd (ensure .war/ is git-excluded inside _refinery, the step you already do for the gate log), then run assert-done-when.sh ${task.worktree} --cmd-file ${refineryPath}/.war/done-when-${task.id}.cmd (file-threaded — never interpolate the command into another script) with its combined stdout+stderr teed to the evidence artifact ${refineryPath}/.war/done-when-${task.id}.log, reading the FLOOR's OWN exit status across that capture (D14): run \`assert-done-when.sh … > ${refineryPath}/.war/done-when-${task.id}.log 2>&1\` and read \`$?\`, or if piping to tee, read \`\${PIPESTATUS[0]}\` — never the tee pipeline's status (a naive \`… 2>&1 | tee\` reports tee's 0 for a red AND an exit-2 floor). Branch on that captured code: exit 0 → the acceptance command is green; continue. exit 1 (the command exited red or timed out) → return { mode: 'merge-task', status: 'done-unmet', done_when_log_path: ${refineryPath}/.war/done-when-${task.id}.log } — the teed artifact's ABSOLUTE path rides the return; do NOT merge. The floor is fail-closed on EVERY merge-task dispatch, including a baseline-proceed: a red done-when is never proceeded over as baseline debt. exit 2 (a git/env error — bad worktree, missing/unreadable command file) → return { mode: 'merge-task', status: 'error' }, never 'done-unmet' — a transient git/env error must not spin a pointless make-this-command-pass loop.`
  : ''
// A1 redefinition (precision-chain D9): acceptance_criteria_covered is the task's CLAIMED End-state ids
// — the numbered Commander's Intent End-state conditions the task claims — no longer plan-slice
// acceptance-criteria prose. ONE canonical rule sentence, mirrored in agents/war-worker.md's Return
// section (standing surface; the both-surfaces registry test anchors the shared tokens — keep the
// surfaces in sync in the same commit). Consumer: the post-merge gate-audit pass cross-checks the
// reported ids (Task 3.2 — defined here, consumed there).
const ACCEPTANCE_IDS_RULE = "Report acceptance_criteria_covered as the task's claimed End-state ids — the numbered End-state conditions from the plan's Commander's Intent that this task claims to satisfy (empty when the task claims none). Each id is the condition's 1-based ordinal in the intent's numbered End-state list, rendered as a string (\"7\"), resolving to that condition's verbatim text (the plan_ref / endStateAttestations.condition key); the post-merge gate-audit pass cross-checks the field."

// ---- Gate-failure classification (spec §6 / ADR 0019) ----------------------
// classOf reads the refiner-reported gate_failure_class off a gate_failed MergeResult; an ABSENT or
// unrecognized value ⇒ 'introduced' (the permanent fail-safe — reverting baseline-proceed is just
// deleting the classification prose, and absent-class routing is byte-identical to today). Only
// 'baseline' and 'environment' branch away from today's soft escalation.
const classOf = mr => (mr && (mr.gate_failure_class === 'baseline' || mr.gate_failure_class === 'environment'))
  ? mr.gate_failure_class : 'introduced'
// floorDiagOf: the optional MERGE_RESULT.floor_diagnostic (the test floor's verbatim exit-1 stderr —
// the near-miss diagnostic), normalized to null unless it is a NON-EMPTY string. Fail-open advisory:
// its only consumers are the ADD_TEST fix prompt and the floor-exhaustion detail, and null ⇒ both are
// byte-/shape-identical to a diagnostic-less run. Never routed on, never a status.
const floorDiagOf = mr => (mr && typeof mr.floor_diagnostic === 'string' && mr.floor_diagnostic) ? mr.floor_diagnostic : null
// doneWhenLogOf (done-when-floor-wiring D5): the optional MERGE_RESULT.done_when_log_path (the done-when
// floor's teed evidence artifact — its ABSOLUTE path), normalized to null unless it is a NON-EMPTY
// string. floorDiagOf's done-when sibling, conditioned ONLY on the floor result's field. Fail-open
// advisory: its only consumers are the MAKE_DONE_PASS fix prompt (which names the PATH, never the
// content — the fix-worker reads the file) and the done-unmet exhaustion detail, and null ⇒ both are
// byte-/shape-identical to an artifact-less run. Never routed on, never a status.
const doneWhenLogOf = mr => (mr && typeof mr.done_when_log_path === 'string' && mr.done_when_log_path) ? mr.done_when_log_path : null
// routedMr (Budget-Raise floor, engine-reliability Phase 2 Task 2): the WIRE carries the Budget-Raise
// floor's exit-1 route as status:'no-test' + floor_route:'budget-uncited' (the in-band marker — the
// MERGE_RESULT status enum is never widened; red-team pre-authorization). The Workflow routes on a
// NORMALIZED internal status 'budget-uncited' so the floor sub-loop's verdict/log/prompt surfaces name
// the real tripped floor without touching the wire schema. floor_route absent ⇒ identity (set-minus:
// every budget-floor-less result flows through byte-identical). Workflow-internal only — the routed
// status is never returned to a refiner and never re-enters a MERGE_RESULT.
const routedMr = mr => (mr && mr.status === 'no-test' && mr.floor_route === 'budget-uncited')
  ? { ...mr, status: 'budget-uncited' } : mr
const debtIds = ids => (Array.isArray(ids) ? ids : (ids ? [ids] : [])).map(String)
// recordBaselineDebt: dedup by SUBSET-CONTAINMENT with an EMPTY-set carve-out (#798). A NON-EMPTY
// id-set that is a subset (⊆) of some existing entry's ids at the SAME base sha is a no-op — already
// covered, one-entry-one-backstop (a later COVERED failure adds nothing; a non-subset set, incl. a
// strict SUPERSET, records normally). An EMPTY id-set (absent/empty gate_failing_ids ⇒ debtIds()=[])
// keeps EXACT-key dedup: [] is a subset of EVERY set, so naive containment would silently stop recording
// the '(see gate_output)' entry whenever ANY entry exists at that base — a behavior change never ratified;
// empty dedups only against another empty at the same base. On a recorded entry it appends EXACTLY ONE
// source:'auto' backstop. Two tasks with the same identifiers cost one entry + one base re-run.
const recordBaselineDebt = (ids, baseSha) => {
  const idset = debtIds(ids), base = String(baseSha || '')
  const key = JSON.stringify([[...idset].sort(), base])
  const covered = idset.length
    ? baselineDebt.some(d => d.baseSha === base && idset.every(id => d.ids.includes(id)))   // ⊆ an existing entry at the same base
    : baselineDebt.some(d => d.key === key)                                                 // empty: exact-empty-vs-empty only
  if (covered) return
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
    + baselineDebt.map((d, i) => pt`  ${i + 1}. [${d.ids.join(', ')}] — pre-existing at ${d.baseSha || '(base sha unrecorded)'}`).join('\n') + '\n'
  : ''
// reattachClause: every merge/land prompt's _refinery step BEGINS with this idempotent re-attach, so a
// dispatch that died mid-classification (classification detaches _refinery to re-run the base) cannot
// strand the serial queue detached (the re-attached-by-default _refinery, spec §6 / ADR 0019).
const reattachClause = refineryP =>
  pt`HYGIENE (idempotent): begin by re-attaching _refinery to the integration branch — \`git -C ${refineryP} checkout ${ph.integrationBranch}\` — so a prior dispatch that died mid-classification cannot leave _refinery detached.\n`
// classificationClause: the gate-failure classification PROCEDURE, mirrored (per-site base) into every
// dispatched prompt whose refiner must classify a gate failure. Never enumerate those sites here: the
// classification-site drift guard in workflow-template.test.mjs is the arbiter of the site list (it counts
// this helper's call-paren occurrences in this file — writing that byte-run into this comment reds it; a
// prose count or a bare site list would not, so count-free here is convention, not mechanism).
// agents/war-refiner.md is the standing mirror (both-surfaces rule, same commit). baseDesc names the
// per-site classification base.
const classificationClause = (refineryP, baseDesc) =>
  pt`\nGATE-FAILURE CLASSIFICATION (spec §6/§9 / ADR 0019 — on gate failure, BEFORE returning gate_failed): PRECONDITION-MARKER SHORT-CIRCUIT — consult the gate STDERR, not just the TAP stdout: if it carries a recognized precondition marker (e.g. \`REL_GUARD_PRECONDITION_FAILED\`, emitted when a guard's meta-test cannot isolate a clean scratch dir), the gate could not establish its own preconditions ⇒ classify gate_failure_class:'environment' DIRECTLY (never 'introduced'), carry that marker line UNCURATED in gate_output, and skip the base re-run. Otherwise re-run ONLY the failing gate at the classification base — ${baseDesc} — by detaching _refinery there (\`git -C ${refineryP} checkout --detach <that base>\`), re-running the failing gate, then RE-ATTACHING _refinery to ${ph.integrationBranch} before you return (\`git -C ${refineryP} checkout ${ph.integrationBranch}\`). Set gate_failure_class: (1) the base is RED with the SAME failing identifiers ⇒ 'baseline'; (2) the base is GREEN AND the failure does NOT reproduce on a second run at the task tip in a FRESH environment (fresh TMPDIR/shell) ⇒ 'environment' (reproducibility — NOT file-disjointness — is the trigger; a diff-disjoint but reproducing failure is a normal introduced regression and stays 'introduced'); (3) otherwise ⇒ 'introduced'. This is JUDGMENT, not parsing — carry the base-run evidence in gate_output UNCURATED. On a 'baseline' classification also report the classified failing identifiers in gate_failing_ids (array) and the classification base sha in gate_base_sha. ABSENT class ⇒ treated as 'introduced' (the permanent fail-safe).\n`

// gateCaptureClause (D5): the merge-task gate-output capture directive — threaded into the dispatched
// merge-task prompts whose evidence contract REQUIRES the captured fully-green gate for the post-merge
// gate-audit (ADR 0024). Never enumerate those sites here: the captureUses drift guard in
// workflow-template.test.mjs is the arbiter of the site list. Deliberately NOT every merge-task prompt —
// a prompt with a different evidence contract carries no clause (both-surfaces rule; agents/war-refiner.md's
// final merge step (step 8) is the standing mirror, same commit). It STRUCTURALLY REPLACES the retired anti-excerpt prose: the
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

// DISPOSITION RULE clause (in-band-absorb-default D1/D15, PIN-17) — ONE shared const, rendered from
// the inline BARRIER_TOKENS mirror. Appended to the roster-seat auditPrompt() AND to the three
// gate-audit-family dispatches (per-task, integrated-tip, end-state), which sit outside auditPrompt():
// routeGateAuditRows reads `disposition`, `barrier`, and `suggested_fix` off their rows, so the seats
// must be told the rule the floor enforces (standing card + dispatched prompt, same commit, PIN-12).
// The card sentence in agents/war-auditor.md byte-mirrors it (the `barrier-list` registry rows).
const DISPOSITION_RULE_CLAUSE = pt`\nDISPOSITION RULE: every Minor/Nit finding carries a disposition — absorb (mechanical, intent-consistent, safe to fix this phase; set phaseClose:true when the fix needs the integrated tip or touches a shared/slot-adjacent file), follow-up (substantive work beyond this phase — MUST state why it is not absorbable), note (informational; phase report + servitor feed, never an issue; a note that names a fix in a touched file is applied), or ask (a decision-shaped Minor/Nit only the operator can rule — MUST carry the \`ask\` field: \`question\` naming the decision needed plus \`fork\` naming the two branches; parked unruled and ruled at the Checkpoint, never filed unruled). A fully specified Minor/Nit defaults to absorb when its file is in the task diff, and to absorb + phaseClose:true when its file is outside the task diff — set that disposition yourself; the engine's diff-probe floor applies the same default when you omit it. On such a finding, follow-up is legal only with a barrier cited in the structured \`barrier\` field, one of ${BARRIER_TOKENS.join(', ')} (barrier:trade-off routes ask, never follow-up); a scope argument is never a barrier, and the why-not-absorbable prose stays free text. Omitted disposition defaults: a fully specified Minor/Nit becomes absorb, otherwise Minor becomes follow-up and Nit becomes note; ask is never a default.`

function auditPrompt(task, lens, depth, peers, workerTests, pin) {
  let p = pt`Audit WAR task ${task.id} through the "${lens}" lens at depth ${depth}.\n`
    // ${(plan && plan.file) ?? '<unset>'} (#1430 defense-in-depth): the entry-validation plan.file
    // class makes an undefined here unreachable on a tasks-bearing launch; the guard matches the
    // gate-audit site's form so a bare ${plan.file} pt-throw can never recur at this site.
    // ${task.planSlice ?? '<unset>'} (D5 defense-in-depth): the entry-validation TASK-FIELD class
    // refuses a missing/empty planSlice at intake, so '<unset>' is unreachable on a validated
    // launch — the fallback exists so no prompt-build site interpolates bare.
    + pt`Sub-issue #${task.issue ?? '<unset>'}. Plan slice: ${task.planSlice ?? '<unset>'}. Plan file: ${(plan && plan.file) ?? '<unset>'}.\n`
    + pt`Run \`git diff ${ph.integrationBranch}...${task.branch}\` (three-dot = merge-base..head = exactly what this task added) for the authoritative change set; re-run it each round (a fix-worker may have pushed). `
    // READ-ONLY GIT GUARD CONTRACT (D5, spec §5) — mirrored as the "## Read-only git guard contract"
    // section in agents/war-auditor.md (same commit); the D3 both-surfaces registry row anchors the
    // shared tokens (one bare git / no pipes / ls-tree / Grep tool / value-carrying / bare read flags) on
    // BOTH surfaces AND asserts the
    // retired partial teach (the old pretty-format / reflog fragments) is absent from both (red-team
    // adjudication, ADR 0025). The verb list mirrors the hook's unlisted-verb deny enumeration in
    // hooks/validate-auditor-git.sh. The branch two-arm flag enumeration below has a STRICTER arbiter:
    // the D6 extraction-equality test in workflow-template.test.mjs reads the hook's own branch deny
    // string and asserts every flag token it lists onto BOTH mirror surfaces — the hook string is
    // canonical, these mirrors are followers, so a hook-side flag change REDs the mirrors.
    + pt`READ-ONLY GIT GUARD CONTRACT: run one bare git command per Bash call from the read-verb allowlist (diff, log, show, merge-base, rev-parse, status, ls-files, ls-tree, cat-file, blame, branch) — no pipes, chaining, redirects, quotes, globs, braces, or substitution: compose nothing, and filter or search the output with the Read/Grep/Glob tools instead. Non-git shell reads (ls, cat, wc, …) always deny — use Read/Glob, or git ls-files / git ls-tree to list tree contents. branch admits read forms only, in two arms: value-carrying flags =-attached (--contains=<rev>, --no-contains=<rev>, --merged=<rev>, --no-merged=<rev>, --points-at=<rev>, --sort=<key>), and bare read flags (--list, --all, -a, --remotes, -r, --show-current, --verbose, -v, -vv); a bare name, a space-form value (--contains <rev>), or any write flag denies. git grep stays denied — the Grep tool is the sweep channel. Avoid @{} reflog (braces are denied) — use git log -g instead.\n`
    // SEARCH-TOOLING RULE (gate-audit-finding-routing Task 2.1(c), #1412 fix 3) — mirrored as a bullet
    // in the "## Read-only git guard contract" section of agents/war-auditor.md (same commit); the D3
    // both-surfaces registry row anchors the zero-hit `metacharacter` token on BOTH auditor surfaces.
    // Seat doctrine only — the guard-message half (the denial naming the rule that fired) is Task 2.2's,
    // in hooks/validate-auditor-git.sh; the guard's allowlist and deny decisions are byte-unchanged.
    + pt`SEARCH-TOOLING RULE: search with the Grep/Glob tools, never shell grep or git grep — the git guard refuses glob/alternation metacharacters (*, \\|), not just command chains.\n`
    + pt`Then read candidate files under ${task.worktree}/ for neighbor/deep context.\n`
    + pt`Verify the mapped acceptance-criteria tests EXIST and are not weakened or skipped (anti-cheat: catch "green by deletion" and test-integrity erosion). You cannot execute the gate — the refiner runs the gate. Your job is to confirm tests exist in the diff and are uncompromised.`
    // Latitude + disposition + calibration + cost-claim rules (ADR 0013) — mirrored VERBATIM in
    // agents/war-auditor.md (standing surface, same commit); the both-surfaces unit tests assert the
    // shared sentences on both. The latitude-clause arm (#1431, ADR 0013 Amendment 2026-08-17) is
    // always-rendered prose whose BEHAVIOR fires only when the threaded intent carries an explicit
    // `Mechanism latitude:` clause; the D3 latitude registry row anchors it on both auditor surfaces.
    + pt`\nLATITUDE RULE: the plan slice is the floor, the Commander's Intent is the ceiling — intent-consistent work beyond the literal slice is APPROVE (judge it on its own correctness), never a plan-faithfulness violation; only deviations that contradict the intent or the slice block. No intent threaded means judge against the plan slice alone, as before. When the threaded intent carries an explicit \`Mechanism latitude:\` clause, read "contradicts the slice" against the binding guardrails, not against every pinned mechanism literal in the slice: a substitution inside the enumerated latitude that holds the guardrails and End states is APPROVE, never a plan-faithfulness finding; a substitution that breaches a guardrail or an End state blocks exactly as before.`
    // The barrier list renders from the inline BARRIER_TOKENS mirror (in-band-absorb-default D1);
    // the card sentence spells the same four by hand — the `barrier-list` registry rows bind them.
    // Shared with the three gate-audit-family seats (D15, PIN-17) — see DISPOSITION_RULE_CLAUSE.
    + DISPOSITION_RULE_CLAUSE
    // DISPOSITION WIDENINGS (in-run-finding-resolution D3/D4/D5) — standing home:
    // skills/war/references/disposition-eligibility.md carries the same three rules (same commit;
    // the auditor card's live trigger pointer covers the standing leg). The dispatched block is
    // pinned by the `disposition-prompt-widened` fixture in workflow-template.test.mjs.
    + pt`\nDISPOSITION WIDENINGS: (1) a mechanical, fully-specified finding born at a re-audit DEFAULTS to absorb — it re-enters the ace ladder while the task's absorb budget remains (absorbRounds < run.absorbRounds), and the phase-close sweep is its vehicle when that budget is spent (set phaseClose:true when the fix wants the integrated tip); follow-up stays correct only with a barrier tag (unspecified → barrier:underspecified, release-slot → barrier:release-slot; decision-shaped routes ask via barrier:trade-off); a finding whose file is outside the task diff routes absorb + phaseClose:true, and the engine exclusion set demotes a foreign-owned file naming its owner. (2) a fully-specified NEW-test (or test-harness) addition in a task-owned test file is a legitimate absorb — "needs a new test" is not by itself a why-not-absorbable reason (adding only; never delete or weaken tests). (3) a finding whose fix is fully specified but entails a behavior change with a nameable trade-off routes ask (the trade-off IS the fork), not follow-up — and when a threaded adjudication row covers that NAMED trade-off (never merely its topic), set disposition:'absorb' with the \`citation\` field (\`row\` + one-line match \`rationale\`) AND KEEP the parked ask's \`ask\` field verbatim (question + fork) on the citation-carrying finding — the engine matches the parked record by that content key (resolved under --afk; interactively it stays parked and surfaces at the Checkpoint with a prefilled recommended ruling); ambiguity is NO-match: park the ask.`
    // FINDING-PATH FORM (D12) — dispatched-prompt only, no standing-card behavior change: finding
    // `file` values feed exact-string routing compares (ace culprit attribution normalizes only a
    // leading `./` run), so the re-audit prompt mandates the repo-relative form at the source.
    + pt`\nFINDING-PATH FORM: report every finding's \`file\` as a repo-relative path — never absolute, never \`./\`-prefixed; these values feed exact-string routing compares downstream.`
    // ESCALATE-BOUNDARY CONTRACT (gate-audit-finding-routing Task 2.1(a)+(b), #1410 fixes 1+2) —
    // mirrored on agents/war-auditor.md (the verdict list's escalate bullet + the Return shape line)
    // and in the schemas.md AuditVerdict row (same commit); the D3 both-surfaces registry row anchors
    // the zero-hit tokens (required when / however severe) on BOTH auditor surfaces. The intake side
    // is the AUDIT_VERDICT if/then conditional above (enforcement arm recorded at that literal): the
    // schema layer re-prompts a reason-less escalate; a persistently non-conforming seat falls into
    // the existing dropped-seat → audit-blocked lane — no NEW hold path (A8, #1410).
    + pt`\nESCALATE-BOUNDARY CONTRACT: a non-empty \`escalate_reason\` naming the missing plan decision is required when \`verdict\` is \`escalate\` (the schema layer re-prompts a reason-less escalate). A blocking finding whose \`suggested_fix\` is a concrete in-file edit needing no new plan decision is \`request_changes\` by construction, however severe — if you cannot name the missing plan decision in \`escalate_reason\`, you are looking at a fixable bug.`
    + pt`\nCALIBRATION RULE: judge on evidence only — never soften, downgrade, or drop a finding because peers disagreed or because a fix was attempted; downgrade only with a stated reason grounded in the current diff. The pull to soften peaks right after your own finding is challenged — that is the highest-risk moment.`
    // #811 BYTE-COUPLED SURFACE (JS comment — NOT emitted into the prompt): this quote-bearing COST-CLAIM
    // RULE literal is byte-identical to agents/war-auditor.md's Cost-claim rule line AND the test's
    // COST_CLAIM_SHARED anchor. Any quote-style lint MUST run identically across ALL THREE in one commit —
    // canonicalizing quotes on one surface alone silently breaks the byte-identity guards (shared-string-
    // constant-quote-literal lesson; CALIBRATION_RULE_ANCHORS precedent). A lint most plausibly starts here.
    + pt`\nCOST-CLAIM RULE: a finding justified by a cost — "too slow", "too expensive", "too complex" — must name a magnitude (ms, MB, LOC, call count, or complexity class). An unquantifiable cost claim caps the finding at Minor.`
    // RELEASE-BASELINE RULE (D3) — verbatim-mirrored in agents/war-auditor.md (same commit). The literal
    // ${integrationBranch}...${task.branch} is escaped so the emitted prose byte-matches the static mirror.
    + pt`\nRELEASE-BASELINE RULE: judge a release/version-bump diff against the three-dot \`\${integrationBranch}...\${task.branch}\` merge-base set (exactly what this task added), never against a main checkout; an N-step main-lag when N stacked plans have not yet landed on main is the expected stacked-release lag, not a scope error.`
    // STALE-LOOKING-BUT-CORRECT CALIBRATION (Task 1.4, ADR 0030) — the full four rule bodies live in
    // the "### Stale-looking-but-correct calibration" subsection of agents/war-auditor.md (the standing
    // card); this dispatched copy is a TOKEN SKELETON (prompt-surface simplification, spec §4.3/§4.4 —
    // the D4 tiered-copies precedent): it must keep the four CALIBRATION_RULE_ANCHORS mid-sentence
    // phrases IN ORDER, one "only when the live artifact confirms" qualifier per rule window, and stay
    // on ONE line (the qualifier-window tests in workflow-template.test.mjs slice it as a single line).
    // Reaches the inline gate-audit seats ONLY via the standing card (THIS clause is not emitted there;
    // adjudicationClause below and the EVIDENCE PRECEDENCE skeleton (ADR 0041) are the clauses that
    // also ride those seats directly).
    + pt`\nSTALE-LOOKING-BUT-CORRECT CALIBRATION: four authoring patterns read as drifted but are correct-by-construction — each demotes only on live-artifact confirmation, never blanket amnesty (full rule bodies: the "### Stale-looking-but-correct calibration" subsection of agents/war-auditor.md, the auditor standing card): (1) a plan literal diverging from the candidate on a line range, a suite count or enumeration, or a version bump is a Nit at most — never a hold — only when the live artifact confirms the candidate correct (the enclosing construct, the \`resolveGate\` self-discovery gate, or the worktree release baseline; absent that confirmation, judge the divergence on its merits). (2) a reference dangling at a task tip is a defect only if the plan lacks the produced-in-Task-N cross-link; with it present, a Nit or note — a hold only when the live artifact confirms the referent genuinely absent at the landed tip. (3) a plan file-list naming a file the diff never touches is a finding only when the live artifact confirms the guard has no other real home — grep the sibling or precedent first. (4) a grep sweep is a floor, not a ceiling — a surviving sibling is the worker's omission only when the live artifact confirms the plan's same-scope manual title and comment survey covered it; a straggler outside the swept scope is a survey-derived correction, not a regression.`
    // CASCADING-IMPACT DOC CASCADE (D8/D9/D12/D6, ADR 0025) — full check bodies live on the
    // cascading-impact lens bullet in agents/war-auditor.md (the standing card); this dispatched copy
    // is a TOKEN SKELETON (prompt-surface simplification, spec §4.3/§4.4) that must keep every
    // D8/D9/D12/D6 registry-row anchor token (policy-table/attribution, comment/lag/retired,
    // invariant/guard that holds/snapshot|line-number, preset/matrix) — the both-surfaces registry
    // test anchors them on BOTH surfaces. Reaches the inline gate-audit seat ONLY via the standing card.
    + pt`\nCASCADING-IMPACT DOC CASCADE (when your lens is cascading-impact, ADR 0025): a diff that changes a mechanism's behavior or attribution cascades into the docs and mirrors that describe it — the drift a name-grep misses. Four checks (full bodies: the cascading-impact lens bullet in agents/war-auditor.md): (1) ADR policy-table attribution — read the mechanism's chosen-option / policy-table row (under-attribution is invisible to a grep); (2) mechanism-style narrative — assert the invariant and name the guard that holds it, never a snapshot member-count or line-number reference; (3) comment-lag — the touched files leave no lagging comment/JSDoc naming the OLD behavior's retired values or stale counts; (4) preset matrix — a new PRESETS entry or role is covered by the enumerated matrix exported from war-config.mjs.`
    // COMMITTED-TREE GROUNDING (spec §8, ADR 0029) — the full paragraph lives in agents/war-auditor.md
    // (the standing card); this dispatched copy is a TOKEN SKELETON (prompt-surface simplification,
    // spec §4.3/§4.4) that must keep the both-surfaces registry row's anchor tokens (committed-tree
    // grounding / verify-and-close / git show <audit_sha>:<path> / advisory only / git grep). The auditor
    // git allowlist is NOT widened — git show/git log are already read-only allowlisted, git grep stays denied.
    + pt`\nCOMMITTED-TREE GROUNDING (verify-and-close / already-done no-op claims): ground the claim against the pinned audit_sha, NOT the mutable working tree — read the blob with \`git show <audit_sha>:<path>\`, and pick the history verb per claim shape (\`git log -S<token>\` for "when did the occurrence count change", \`git log -G<regex>\` for content-pattern change; presence at the tip is git show, never -S). A working-tree grep is ADVISORY ONLY, never the sole basis for approving a no-op claim; the git allowlist is NOT widened — git show/log are already allowlisted, git grep stays denied. Full paragraph: the Committed-tree grounding section of agents/war-auditor.md.`
    // EVIDENCE PRECEDENCE SKELETON (ADR 0041) — the full four claim-shape ladders live in the
    // "## Evidence precedence" section of agents/war-auditor.md (same commit; standing/dispatched
    // split, progressive disclosure: skeleton only in the hot path). The identical skeleton line is
    // ALSO inlined at each of the three gate-audit-family seats below (they sit OUTSIDE auditPrompt
    // and inherit nothing from it); the five-surface evidence-precedence registry row in
    // workflow-template.test.mjs anchors the shared tokens on the card + all four dispatched
    // surfaces, so a one-sided edit of any single copy REDs.
    + pt`\nEVIDENCE PRECEDENCE (ADR 0041): classify each claim by shape — content-at-pin, execution, history, or authority — and judge it at the highest rung of that shape's ladder (full ladders + floor rules: the "## Evidence precedence" section of agents/war-auditor.md, the auditor standing card). The working tree and the worker done-report are never the top rung of any ladder; prefetched lessons are never evidence — re-ground a lesson-derived claim at the pin before it appears in a finding.`
    // VERSION-PRECEDENCE + ADJUDICATION-MATCH RULES (Task 1.5, ADR 0032) — appended alongside intentClause;
    // both sentence bodies are mirrored VERBATIM in agents/war-auditor.md (standing surface, same commit);
    // the both-surfaces test anchors a mid-sentence phrase from each on both. This clause ALSO rides the
    // three gate-audit-family seats directly (see their sites below), not only the standing card.
    // Empty/absent adjudications ⇒ '' ⇒ byte-identical to today.
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
      // pt-tagged prompt-feeding rows (auditPrompt, thunk-catch): seat/lens/verdict/severity are AUDIT_VERDICT-required
      // (construction-guaranteed → bare); ${f.title ?? ''} absence-tolerant (title is a schema-optional finding field).
      + peers.map(s => pt`- ${s.seat} (${s.lens}) → ${s.verdict}: ${(s.findings || []).map(f => pt`[${f.severity}] ${f.title ?? ''}`).join('; ') || 'no findings'}`).join('\n')
  }
  return p
}

// `extra` (D6): an optional pre-built prompt clause appended to every seat's prompt this round —
// today's sole producer is citationSoundnessClause (a citation-resolved batch's re-audit charge).
// Absent ⇒ '' ⇒ every prompt is byte-identical to a clause-less round (the intentClause pattern).
// `rosterOverride` (#1913, D3): an optional NON-EMPTY subset of task.roster — the originating seats of a
// footprint-subset ace diff. Absent/empty/non-array ⇒ the full task.roster, so every pre-existing caller
// is byte-identical. `expected` is the size of the roster ACTUALLY dispatched, so allApprove still means
// unanimity over the seats that ran; the seats that did not run have their approvals TRANSFERRED to the
// new sha by the caller, with per-seat provenance (PIN-10).
async function auditRound(task, peers, workerTests, pin, extra, rosterOverride) {
  // Seats come straight from task.roster (validated at phase start: 1–5 distinct lenses, per-seat
  // depth already normalized). Labels audit:<task>:<lens> are distinct because lenses are distinct.
  const roster = (Array.isArray(rosterOverride) && rosterOverride.length) ? rosterOverride : task.roster
  const expected = roster.length
  const runSeat = seat => dispatch(auditPrompt(task, seat.lens, seat.depth, peers, workerTests, pin) + (extra || ''), {
    agentType: NS + 'war-auditor', phase: 'Audit',
    label: `audit:${task.id}:${seat.lens}${peers ? ':rebut' : ''}`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  // Initial fan-out — one parallel() call, unsliced: the global dispatch semaphore holds the ceiling
  // at the leaf agent() seam inside runSeat, so this site takes no permit of its own (PIN-15).
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
  // is silently lost) AND STRIP its routing metadata (disposition — the ask member included — + legacy
  // autoFixable) so the demoted finding falls to the Nit default disposition (note) and can NEVER enter
  // aceable / ride --ace (#805). The pinMismatch strip is a NON-dispositionOf disposition sink (#1550, D7
  // — its own order-census row): a pin-mismatched seat's disposition:'ask' never parks on asks[] — a
  // question raised against a different tree than the worker's committed tip is not a ruling-worthy fork,
  // so it falls to note with the rest of the stripped routing metadata. Also,
  // neutralize the verdict to a non-blocking 'approve' so it can neither escalate nor block a merge, and push
  // a SOFT absence-note (task, seat, both SHAs) to auditLog. Fail-open: absent or malformed pin OR audit_sha
  // ⇒ no demotion (today's behavior). The strip is at this single collection site — NO new filter at the
  // approve-branch routing loop; a wrong-tree seat's convergent unanimity on one audit_sha stays doctrine,
  // out of D2's slice (plan Notes).
  for (const s of seats) {
    if (!pinMismatch(s.audit_sha, pin)) continue
    auditLog.push({ task: task.id, seat: s.seat, verdict: `pin-mismatch:${s.verdict}`, pinMismatch: true,
      auditSha: s.audit_sha, expectedPin: pin, findings: [],
      note: `pin-mismatch: seat reviewed ${s.audit_sha} but the dispatched pin is ${pin} — findings demoted to SOFT, not a land-halt` })
    s.findings = (s.findings || []).map(({ disposition, autoFixable, ...f }) => ({ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }))
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
  // its own direct-invocation contract, Task 1). This and the WORKTREE_HYGIENE capture clause below
  // are the always-on deltas between a recovery-absent barrier prompt and today.
  const staleRemoteClause = pt`STALE-REMOTE CLASSIFICATION (per task, always-on): if a task's ensure-worktree exits NON-ZERO and its output carries the \`STALE_REMOTE\` marker line, do NOT halt the barrier — capture { task: "<that task's id>", remoteSha: "<the marker's remote SHA>", frozenTip: "$TIP" } into a \`staleRemote\` array on the env-outcome and CONTINUE provisioning the remaining tasks. The marker token is the key, never the numeric exit code. Any OTHER non-zero ensure-worktree exit — one WITHOUT the marker — remains a barrier failure exactly as the fail-loud rule above.\n`
  // Reuse-path hygiene capture (D20, #1381) — always-on, visibility only. The barrier keys on the
  // WORKTREE_HYGIENE marker TOKEN emitted by ensure-worktree's reuse path (the STALE_REMOTE
  // marker-capture idiom); the captured array rides the ok: true return and NEVER halts the barrier,
  // reorders tasks, or changes routing.
  const worktreeHygieneClause = pt`WORKTREE-HYGIENE CAPTURE (per task, always-on): an ensure-worktree REUSE may emit \`WORKTREE_HYGIENE\` marker lines (a repaired or detected dirty-submodule state on a reused worktree). Capture each as { task: "<that task's id>", path: "<the marker's submodule path>", action: "repaired"|"detected", detail: "<the marker's detail>" } into a \`worktreeHygiene\` array on the ok: true env-outcome, beside \`staleRemote\` — the markers ride a zero exit: visibility only, never halt the barrier on them and never skip or reorder tasks.\n`
  // Absorb-budget relaunch seed (D5): the ONE git read allowed beyond the named subcommands — a
  // per-task `git log` trailer read of `Ace-Charge: <task>:<n>` on the task branch. The HIGHEST
  // index (never a count) so a cherry-pick or duplicate trailer never double-charges; a reverted
  // ace commit's trailer still counts (the revert carries no charge trailer). Always-on; absent or
  // malformed ⇒ the engine seeds 0 with a loud log naming the task.
  const absorbChargesClause = pt`ABSORB-CHARGE READ (per task, always-on — the ONE git read allowed beside the named subcommands): after each task's ensure-worktree, run \`git -C <that task's worktree> log --format='%(trailers:key=Ace-Charge,valueonly)' ${ph.integrationBranch}..<that task's branch>\` (the integration branch by name — never "$TIP", which an agent shell does not carry across calls: an unset TIP reads as HEAD..<branch>, empty in the task worktree, and returns a plausible 0) and take the HIGHEST integer n across the \`<task id>:<n>\` trailer values whose task id is that task's — the trailer's task-id segment is the BARE task id (the branch's \`p<phase>-<id>\` suffix, e.g. \`2.1\` for \`p2-2.1\`), never the worktree or branch name, and a value whose id segment matches under that normalization counts (never a count of trailers — a cherry-pick or duplicate trailer must not double-charge; a reverted ace commit's trailer still counts). Return \`absorbCharges: { "<task id>": <highest n, or 0 when the range carries no Ace-Charge trailer> }\` on the ok: true env-outcome, one entry per task. A failing read is NOT a barrier failure: omit that task's entry (the engine seeds 0 and logs it loudly) and continue.\n`
  // Recovery-gated derive-and-skip (§4.2) — DORMANT unless args.recovery.sanctioned. When armed, a task
  // whose local branch is already an ancestor of the frozen tip is reported preMerged and its
  // ensure-worktree is SKIPPED. Deriving before cutting means a fresh cut can never pollute the ancestry
  // check (the "vacuous on a first run" property is true by ordering, not luck). A task branch that
  // exists but is NOT an ancestor (the escalated task's half-done branch) takes the existing-branch
  // reuse path — prior commits kept, no reset (spec §8).
  const deriveSkipClause = recovery
    ? pt`SANCTIONED RECOVERY RELAUNCH — derive-then-cut: the step-3 ensure-worktree list above is conditional under this relaunch. For EACH task, FIRST check whether its local branch exists AND \`git merge-base --is-ancestor <that task's branch> "$TIP"\` holds (already-integrated on the adopted integration branch). On TRUE, report the task id in a \`preMerged\` array on the env-outcome and SKIP that task's ensure-worktree entirely — no worktree is needed for a task that will not run, and deriving before cutting means a fresh cut can never pollute the ancestry check. On FALSE or an absent local branch, run that task's ensure-worktree as listed${reclaimFlag ? ' (each carries the --reclaim-stale-remote flag under this sanctioned relaunch)' : ''}. A local branch that exists but is NOT an ancestor takes the ordinary existing-branch reuse path (prior commits kept, no reset).\n`
    : ''
  // Recovery holder auto-free (#1712 fix 3, Phase 6 Task 1 (e)) — DORMANT unless args.recovery.sanctioned,
  // like deriveSkipClause. Plain git verbs only, no new script flag: a CLEAN prior-generation holder of
  // THIS plan's refs is auto-freed (detach for _refinery, worktree remove for a workless task worktree);
  // a dirty holder still dies loud with the holder path named; a foreign plan's holder is never freed.
  // Ordering: this clause runs BEFORE steps 2–4, so step 3's TIP binding does not exist yet — unlike
  // deriveSkipClause (a step-3 sub-clause where "$TIP" is live), the workless-worktree ancestor check
  // resolves the integration branch itself, guarded on the branch existing (a fresh cut has none).
  const holderFreeClause = recovery
    ? pt`SANCTIONED RECOVERY RELAUNCH — pre-checkout ref-holder auto-free (#1712 fix 3): BEFORE steps 2–4, run \`git worktree list --porcelain\` ONCE and, for EVERY ref this relaunch checks out (${ph.integrationBranch} for _refinery, each task branch in step 3), check whether a prior-generation worktree still holds it. Auto-free ONLY a CLEAN prior-generation holder of THIS plan's own refs (its held branch carries the plan slug ${planSlug || '<plan-slug>'}): for a stale _refinery holding ${ph.integrationBranch}, run \`git -C <holder-path> checkout --detach\` (detach — the worktree survives); for a WORKLESS task worktree (empty \`git -C <holder-path> status --porcelain\` AND \`git merge-base --is-ancestor <that holder's branch> ${ph.integrationBranch}\` holds — no unmerged work), run \`git worktree remove <holder-path>\`. This clause runs BEFORE step 3, so step 3's TIP is NOT yet bound here — resolve the ancestor check against ${ph.integrationBranch} directly (never "$TIP"), and when ${ph.integrationBranch} does not yet exist SKIP the removal arm entirely: a fresh cut has no prior-generation holder of it, and an unverified worktree is never removed. Plain git verbs only — never a new script flag. NEVER free a DIRTY holder (non-empty status --porcelain): die loud — return the \`{ ok: false, … }\` env-outcome with the HOLDER PATH named in stderrTail. NEVER free a holder of a FOREIGN plan's refs: leave it in place, and if it blocks a checkout, die loud the same way naming its path.\n`
    : ''
  // Submodule tasks: thread the target repo + base into the Provision prompt so the refiner knows
  // to initialize the submodule checkout (git submodule update --init) before running ensure-integration
  // against the submodule's base (not the superproject working branch). DP3: no script change.
  const submodTasks = tasks.filter(t => t.taskType === 'submodule')
  const submodNote = submodTasks.length
    ? pt`\nSUBMODULE TASKS in this phase: ${submodTasks.map(t =>
        // pt-tagged prompt-feeding interior (nested in the barrier prompt): t.id is entry-validated (bare);
        // targetRepo/targetBase carry their own || defaults — a nested literal is a first-class census entry.
        pt`task ${t.id} targets repo "${t.targetRepo || '<targetRepo>'}" at base "${t.targetBase || '<targetBase>'}"`
      ).join(', ')}. `
      + pt`Before running ensure-integration for these tasks, ensure the submodule checkout is initialized: `
      + pt`\`git submodule update --init --recursive\` in the superproject, so the submodule worktree at `
      + pt`"${submodTasks[0] && submodTasks[0].targetRepo || '<targetRepo>'}" exists. `
      + pt`Run ensure-integration and ensure-worktree cwd-scoped to each submodule task's targetRepo path (not the superproject).`
    : ''
  // provision mode (agents/war-refiner.md ## provision): git-topology barrier — env-outcome return.
  // dispatchKind: 'provision-barrier' (DISTINCT from the per-task 'provision-run' — mocks/isProvision key on it).
  // dispatchAgent, tagging ONLY (Phase 6 Task 1 (c) enumerates the routed sites; the barrier is not one):
  // there is NO local catch here, so ANY barrier-dispatch death — infra-tagged or not — rethrows into the
  // top-level catch → held:workflow-error with the workflowError { message, stack, recovery } payload,
  // exactly the documented terminal class (resume-and-recovery.md § Checkpoint outcome handling: no git
  // topology ⇒ nothing in the phase can run). The tag still rides the error so the surfaced message
  // carries dispatch-layer provenance.
  const barrierOut = await dispatchAgent(
    pt`Provision the worktree topology for WAR phase ${ph.id} "${ph.title}" by running ${SCRIPT}. `
    + pt`Do NOT free-author git; only run these subcommands, fail loud on ANY non-zero exit — do NOT special-case a numeric code (a foreign integration branch exits 3; a diverged local/origin base halts with its own distinct non-zero exit) — with ONE marker-keyed carve-out: a per-task worktree-creation exit whose output carries the \`STALE_REMOTE\` marker line is CLASSIFIED per task (step 3's classify-and-continue clause) and does NOT halt the barrier; the marker token is the key, never the numeric code. Return the env-outcome JSON: \`{ ok: true }\` when every subcommand exited 0 (optionally carrying the step-3 \`preMerged\` / \`staleRemote\` / \`worktreeHygiene\` arrays and the \`absorbCharges\` map); on the FIRST non-zero exit WITHOUT the STALE_REMOTE marker return \`{ ok: false, failedCommand: "<the exact provision-worktrees.sh subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr — the script's die text>" }\`.\n`
    + pt`1. FROM THE MAIN CHECKOUT (${mainCheckout || 'the main repo checkout — your current working directory'}, NOT a task worktree): `
    + pt`provision-worktrees.sh ensure-exclude ${mainCheckout || '<mainCheckout>'} — pass the main checkout EXPLICITLY as the target repo (the optional <repo-dir> positional); ensure-exclude then writes the exclude into that repo's git dir regardless of your cwd. This excludes \`.claude/\` in the parent checkout so the nested task worktrees do not surface as untracked there (probe E2).\n`
    + pt`2. provision-worktrees.sh ensure-integration ${planSlug || '<plan-slug>'} ${ph.id} ${ph.workingBranch}${owned} — reuse the plan-namespaced integration branch ${ph.integrationBranch} if it is already ours (the --owned-file ledger); else DERIVE the cut base against origin (ADR 0008): the script fetches origin/${ph.workingBranch} and reconciles the local ${ph.workingBranch} — equal or ahead → cut from local; behind → cut from the ORIGIN tip plus a guarded follower fast-forward (skipped with a warning when ${ph.workingBranch} is checked out in a worktree); a fetch failure or missing origin → cut from local with a stderr warning (today's offline behavior). DIVERGED (neither SHA an ancestor of the other) is a HALT: the script dies non-zero carrying BOTH SHAs and the two repair directions, and creates no branch. On that die — or ANY non-zero exit — return the \`{ ok: false, … }\` env-outcome carrying the die text in \`stderrTail\` and STOP: never pick a side, never retry with a different base. The phase never starts; I surface the die message like today's foreign-branch halt.\n`
    + pt`3. Capture the resulting integration tip (TIP="$(git rev-parse ${ph.integrationBranch})"), then for EACH task run ensure-worktree at the integration tip captured in step 3 (idempotent; reuse if present, conservative heal if the dir went missing):\n${ensures}\n`
    + deriveSkipClause
    + holderFreeClause
    + staleRemoteClause
    + worktreeHygieneClause
    + absorbChargesClause
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
  // task are honored (git > any Lead-assembled arg) — but the match normalizes BOTH id dialects first
  // (#1704): the barrier may report the WORKTREE-NAME dialect (`p<phase>-<id>`, e.g. `p2-2.1`) while
  // tasks carry bare ids (`2.1`) — strip the prefix on both sides before comparing. An id matching no
  // task even after normalization is LOGGED loudly and dropped — never a silent skip-disable (a silent
  // drop re-dispatches a merged task next resume). Records key on the MATCHED task's own id, so
  // done/succeeded/landed stay in the task-id dialect. Labels/ledger are Lead-reconciled toward git (ADR 0008).
  const preMergedIdOf = id => { const m = String(id).match(/^p\d+-(.+)$/); return m ? m[1] : String(id) }
  for (const raw of (Array.isArray(barrierOut.preMerged) ? barrierOut.preMerged : [])) {
    const norm = preMergedIdOf(raw)
    const t = tasks.find(t => preMergedIdOf(t.id) === norm)
    if (!t) {
      log('recovery: barrier preMerged id ' + JSON.stringify(raw) + ' matches NO task in this phase even after dialect normalization (→ ' + JSON.stringify(norm) + ') — entry dropped LOUDLY, no skip-disable applied (#1704).')
      continue
    }
    const id = t.id
    if (done.has(id)) continue
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
  // ---- D20 (#1381) Lead-visibility carrier: reuse-path worktree hygiene ----
  // The barrier captured WORKTREE_HYGIENE marker lines into the optional worktreeHygiene array
  // ([{ task, path, action: "repaired"|"detected", detail }]). Visibility only, fail-open by design:
  // ONE census-safe (concatenation-built) run-log summary line when non-empty — no auditLog entry,
  // no routing change, never a hold; schemas.md's ENV_OUTCOME bullet carries the Lead's phase-report duty.
  const hygieneRows = Array.isArray(barrierOut.worktreeHygiene) ? barrierOut.worktreeHygiene : []
  if (hygieneRows.length > 0) {
    log('worktree hygiene (D20, #1381): ' + hygieneRows.map(h =>
      ((h && h.action) || 'detected') + ' ' + ((h && h.path) || '<path>') + ' (task ' + ((h && h.task) || '<task>') + ')'
      + ((h && h.detail) ? ' — ' + h.detail : '')).join('; ')
      + ' — visibility only; no routing change, the barrier never halts on it.')
  }
  // ---- absorb-budget relaunch seed (D5) ----
  // r.task.absorbRounds seeds from the barrier's absorbCharges map — the highest `Ace-Charge`
  // trailer index git holds on the task branch (git > any in-memory count, ADR 0008). Both id
  // dialects match (the preMergedIdOf normalization). A Lead override (args.absorbCharges, read
  // unconditionally — never gated on args.recovery) wins over the barrier read, logged. Absent map, missing entry, or a
  // malformed value ⇒ 0 with a loud log naming the task — never silent, never a hold.
  const chargesOf = m => (m && typeof m === 'object' && !Array.isArray(m)) ? m : null
  const chargeMaps = [['args.absorbCharges', chargesOf(A.absorbCharges)], ['barrier absorbCharges', chargesOf(barrierOut.absorbCharges)]]
  // A malformed WHOLE override map (an array, a string, a number) is never a silent skip: log its
  // shape and fall through to the barrier read (a Lead override typo must not read as "none threaded").
  if (A.absorbCharges && !chargesOf(A.absorbCharges)) log('absorb-budget: args.absorbCharges is not an object map (' + (Array.isArray(A.absorbCharges) ? 'array' : typeof A.absorbCharges) + ') — ignored; the barrier absorbCharges read is used instead.')
  for (const t of tasks) {
    if (done.has(t.id)) continue   // pre-merged / stale-remote tasks never run the ace ladder — no 0-seed warning for them
    let seeded = false
    const causes = []   // per-source cause for the 0-seed log: a map present but lacking the task, or a matched entry that failed the integer check
    for (const [srcName, m] of chargeMaps) {
      if (!m) continue
      const key = Object.keys(m).find(k => preMergedIdOf(k) === preMergedIdOf(t.id))
      const n = key === undefined ? undefined : m[key]
      if (Number.isInteger(n) && n >= 0) {
        t.absorbRounds = n
        log('absorb-budget: task ' + t.id + ' resumes at absorbRounds ' + n + ' (' + srcName + ' — the highest Ace-Charge trailer index on the task branch).')
        seeded = true
        break
      }
      if (key !== undefined) log('absorb-budget: ' + srcName + ' entry for task ' + t.id + ' is malformed (' + JSON.stringify(n) + ') — ignored.')
      causes.push(srcName + (key !== undefined ? ' entry for the task was malformed' : ' map lacks the task'))
    }
    if (!seeded) {
      t.absorbRounds = 0
      log('absorb-budget: NO usable absorbCharges entry for task ' + t.id + ' (' + (causes.length ? causes.join('; ') : 'barrier returned no absorbCharges map') + ') — seeding absorbRounds 0 (a relaunch may under-count spent ace commits; the Lead may override via args.absorbCharges).')
    }
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

  // ---- ACE BISECTION (regression-recovery ladder on a failed --ace batch; D1–D4/D6) ----
  // Order (D2, culprit-first): named culprits are excised (demoted) and the remainder re-applies as
  // ONE subset; blind halving is reserved for AMBIGUOUS attribution. Subsets apply SERIALLY at the
  // tip with a hard depth cap of 2 (batch=0 → halves=1 → quarters=2; no run.* knob), and same-file
  // findings never split across subsets (D3). Budget (D4, re-anchored by D5): the batch charged one
  // absorbRounds slot; each SUBSET COMMIT charges one more; reverts are uncharged; panels stay
  // unmetered; fixRounds is never charged here (PIN-7); subset commits dispatch only while
  // absorbRounds < run.absorbRounds, and a spent budget mid-bisection routes the still-queued
  // (never re-audited) subsets to the phase-close sweep as absorbs (logged — by design). Only FINALLY-
  // failing subsets demote (unsplittable, or a depth-2 regressor).
  // THE LOOP OWNS IN-LOOP FORWARD-REVERTS: each failed commit is reverted at the tip before the next
  // subset commits — the revert step rides the NEXT subset dispatch, conditional on HEAD still being
  // the failed sha, so no sha is ever reverted twice. A FINAL failed tip has no successor dispatch:
  // it alone rides r.aceReverted into the merge dispatch's revert clause. Every exit either absorbs
  // or demotes-and-logs, and the merge always runs — the ladder never holds or escalates a mergeable
  // task. Resume idempotency (D6): every subset commit carries a deterministic `Ace-Subset:` trailer
  // and every subset dispatch preflights the bisection range (never the tip alone) for it.
  // Culprit-path form (D12): BOTH sides of the culprit `has()` compare are normalized through the
  // file-scope aceRelPath (repo-relative, leading `./` run stripped — #1813), as are the grouping
  // key and the `Ace-Subset` trailer builds below.
  // Same-file grouping: one group per aceRelPath-normalized f.file (#1813 — a `./`-form and a
  // bare-form report of the same file land in ONE group, so same-file findings never split across
  // subsets, the D3 invariant), insertion-ordered; halving splits the GROUP list.
  const aceGroups = findings => {
    const m = new Map()
    for (const f of findings) { const k = aceRelPath(f.file); if (!m.has(k)) m.set(k, []); m.get(k).push(f) }
    return [...m.values()]
  }
  const aceHalve = findings => {
    const g = aceGroups(findings)
    if (g.length < 2) return null                        // atomic — cannot split without breaking D3
    const mid = Math.ceil(g.length / 2)
    return [g.slice(0, mid).flat(), g.slice(mid).flat()]
  }
  // Citation extraction (D6, absorb-by-citation): a well-formed `citation` on a finding — `row`
  // (the standing adjudication row's identifying text) + optional one-line match `rationale`.
  // Malformed/absent ⇒ null (fail-open — the finding rides as a plain absorb, no stamp).
  // ROW-EXISTENCE FLOOR (trust boundary): a seat-asserted `citation` is the only thing standing
  // between a claim and the removal of an operator-gated ask from the Checkpoint channel, so the
  // cited row must be a MEMBER of the threaded adjudications set the engine already holds — exact
  // or containment match against adjRow(r). Existence is mechanical set-membership, not the A2
  // matching judgment (which stays with the re-audit panel); a fabricated/mis-transcribed row
  // fails open to a PLAIN absorb (no stamp, no unpark) and the refusal is logged once per row.
  const refusedCitationRows = new Set()
  const citationOf = f => {
    if (!(f && f.citation && typeof f.citation === 'object' && typeof f.citation.row === 'string' && f.citation.row)) return null
    const row = f.citation.row
    // threadedRow (#1879 recovery seed S2): the MATCHED threaded standing row's own bytes — the
    // strike-list prefill renders THIS, never the seat's citation string (a paraphrase would turn
    // the operator's one-keystroke confirm into ratifying a description of a row, not the row).
    let threadedRow = null
    const member = adjudications.some(r => { const t = adjRow(r); if (typeof t === 'string' && t.length > 0 && (t === row || t.includes(row) || row.includes(t))) { threadedRow = t; return true } return false })
    if (!member) {
      if (!refusedCitationRows.has(row)) {
        refusedCitationRows.add(row)
        log('citation REFUSED (row-existence floor): cited row "' + row + '" matches no threaded standing adjudication row — the finding rides as a PLAIN absorb (no stamp, no ask unpark). Existence is mechanical set-membership; the soundness judgment stays with the re-audit panel (A2).')
      }
      return null
    }
    return { row, threadedRow, rationale: (typeof f.citation.rationale === 'string' && f.citation.rationale) || '(no match rationale recorded)' }
  }
  // Shared unsound-citation lookup (D6 naming duty, PIN-7): pairs a batch finding's citation with a
  // blocking re-audit finding flagged citationUnsound so EVERY demote path fed by a regressed
  // re-audit — the round-1 batch regression (aceBisect's culprit / whole-batch arms), a failing
  // bisection subset at the depth/split floor, and a regressed re-entry batch — names the mismatch.
  const unsoundReason = (seats, f) => {
    const c = citationOf(f)
    if (!c) return null
    const u = blockingOf(seats || []).find(b => b && b.citationUnsound === true)
    return u ? 'citation (row "' + c.row + '") judged UNSOUND by the re-audit panel: ' + (u.rationale || u.title || '(mismatch unnamed)') : null
  }
  // Shared ace-finding prompt row (batch / bisection-subset / re-entry dispatches): title/file/
  // rationale are schema-optional → absence-tolerant; a citation-resolved finding (D6) renders its
  // row-id + match rationale so the ace commit message carries the durable citation stamp.
  const aceFindingRow = (f, i) => pt`${i + 1}. [${f.severity}] ${f.title ?? ''} (${f.file ?? ''}${f.line ? ':' + f.line : ''}) — ${f.rationale ?? ''}${f.suggested_fix ? pt` → ${f.suggested_fix}` : ''}${citationOf(f) ? pt` [absorb-by-citation: row "${citationOf(f).row}" — ${citationOf(f).rationale}]` : ''}`
  // Absorb-budget helpers (D5): every ace-side dispatch label carries the task's absorbRounds
  // (`ace:<task>:a<n>`, n = the slot this commit would charge), and every ace-side COMMIT carries
  // the `Ace-Charge: <task>:<n>` trailer, n = absorbRounds AFTER the charge — the git-derived
  // relaunch seed the barrier reads back (highest index). Reverts carry no charge trailer.
  // Concatenation-built (census-safe).
  const aceLabel = r => 'ace:' + r.task.id + ':a' + (r.task.absorbRounds + 1)
  const aceChargeOf = r => r.task.id + ':' + (r.task.absorbRounds + 1)
  // Shared conditional forward-revert step (bisection subsets + re-entry batches): emitted only
  // while a failed predecessor commit is still unreverted at the tip.
  const aceRevertStep = (worktree, sha) => sha
    ? pt`FIRST, only if \`git -C ${worktree} rev-parse HEAD\` is still ${sha}: forward-revert that failed prior ace commit — \`git -C ${worktree} revert --no-edit ${sha}\` (tip-only clean inverse); a moved HEAD is already reverted — SKIP (a sha is never reverted twice). Never reset --hard.\n`
    : ''
  // Shared ace-diff-files charge (#1913, D3/PIN-18): every ace-family worker prompt asks for the
  // GIT-derived changed-file list of its single commit. It is the delta-scale input; files_changed stays
  // the worker's own report and is only cross-checked against it.
  const ACE_DIFF_FILES_CLAUSE = pt`\nAlso return \`ace_diff_files\`: the exact output of \`git diff --name-only HEAD^ HEAD\` run after your ONE commit — the git-derived changed-file list of that commit, one repo-relative path per array entry. It scales the re-audit (a diff confined to the findings' own files re-runs only the seats that raised them, and the other seats' approvals transfer to your new sha), so report it from git, never from memory. Absent, empty, or disagreeing with files_changed re-runs the full panel.`
  // Citation-soundness re-audit charge (D6, PIN-7): appended to the panel prompt whenever the batch
  // under re-audit contains citation-resolved findings — the panel, not the engine, judges the match
  // (A2: standing-row matching is panel judgment, never engine-side NLP).
  // The clause ENUMERATES its subjects (finding title + cited row + match rationale — the same
  // values aceFindingRow renders into the worker prompt/commit message) so the panel judges from
  // its own prompt, never from a commit message it is not directed to read.
  const citationSoundnessClause = batch => {
    const cited = batch.filter(f => citationOf(f))
    return cited.length
      ? pt`\nCITATION SOUNDNESS (absorb-by-citation): this batch contains citation-resolved findings — verify each cited standing adjudication row covers the finding's NAMED trade-off, not merely its topic; ambiguity is NO-match. An unsound citation is a BLOCKING finding: set \`citationUnsound: true\` and name the mismatch in the rationale — the batch is forward-reverted and the finding demotes naming the mismatch. The citation-resolved findings under judgment:\n`
        + cited.map((f, i) => pt`${i + 1}. "${f.title ?? '(untitled)'}" cites row "${citationOf(f).row}" — match rationale: ${citationOf(f).rationale}`).join('\n')
      : ''
  }
  // ---- PIN-12: THE GATE RUNS AT THE ACE TIP BEFORE ANY RE-AUDIT OR TRANSFER ----
  // A read-only refiner runs the task gate (and the task's Done when: command) at the ace tip. Only a
  // green gate lets the round proceed to its re-audit, so no approval — re-run or transferred — is ever
  // accounted at a SHA the gate never passed. Fail-CLOSED on evidence: an absent, malformed or dead
  // result is NOT green. Fail-OPEN on the task (PIN-2): a red gate forward-reverts the ace tip and the
  // approved pre-ace tip merges; it is never a fix loop and never a hold.
  const aceGateGreen = async (r, sha) => {
    const g = await dispatch(
      pt`ACE GATE CHECK for WAR task ${r.task.id} at the ace tip ${sha}. READ-ONLY: run the gate, change nothing — never commit, revert, push or rebase.\n`
      + pt`In the ALREADY-PROVISIONED task worktree ${r.task.worktree} (branch ${r.task.branch}), first confirm \`git -C ${r.task.worktree} rev-parse HEAD\` is ${sha}; a moved HEAD is NOT green.\n`
      + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
      + pt`Run it from inside that worktree with TMPDIR set to a freshly-created, .war-task-free directory (e.g. TMPDIR=$(cd / && mktemp -d)). Return { gate_green: true, head_sha: ${sha} } ONLY when the gate and any Done when: command are FULLY green; otherwise { gate_green: false } with the failing tail in gate_output. This gate licenses the pin transfer at this sha — no approval is ever accounted at a sha the gate never passed.`,
      { agentType: NS + 'war-refiner', phase: 'Audit', dispatchKind: 'ace-gate',
        label: 'ace-gate:' + r.task.id + ':a' + r.task.absorbRounds, schema: GATE_CHECK, ...spawn('refiner') })
    // #1935: the echoed head_sha is EVIDENCE, not decoration — compare it. The prompt above asks the
    // refiner to confirm HEAD and echo the sha it gated, so an echo naming a DIFFERENT commit means the
    // gate ran somewhere else and licenses nothing. Reuses pinMismatch, so abbreviated-vs-full names
    // the same commit and still compares equal.
    // Closed by #1951 — the schema retries terseness (GATE_CHECK's if/then makes head_sha required on
    // the green arm, so the validator re-asks a bare green reply), and the engine fails closed on
    // whatever slips past (belt and braces; the PIN-2 forward-revert only fires on a reply the
    // validator already re-asked for). pinMismatch stays fail-open by contract (D2) — isSha carries
    // the presence half here, never a pinMismatch change.
    if (g && g.gate_green === true && isSha(g.head_sha) && !pinMismatch(g.head_sha, sha)) return true
    const gateWhy = !g || g.gate_green !== true
      ? ((g && g.gate_output) || 'no usable gate_green evidence returned')
      : !isSha(g.head_sha)
        ? 'gate_green was true but no usable head_sha was echoed — nothing places the gate at this ace tip'
        : 'gate_green was true but the echoed head_sha ' + g.head_sha + ' names a different commit — the gate did not run at this ace tip'
    log('ace-gate ' + r.task.id + ': RED at ace tip ' + sha + ' — ' + gateWhy + '. No re-audit runs and no approval transfers (PIN-12); the ace tip is forward-reverted and the approved pre-ace tip merges (PIN-2).')
    return false
  }
  // ---- DELTA-SCALED RE-AUDIT + SEAT-APPROVAL TRANSFER (D3, PIN-10, PIN-18) ----
  // The scale input is the GIT-derived ace file set (`ace_diff_files`), never the agent's files_changed
  // self-report — that is only a cross-check. Subset of the findings' own file set ⇒ only the
  // ORIGINATING seats re-run and every other seat's approval transfers to the new sha. Absent/empty git
  // set, a files_changed mismatch, a file outside the footprint, or a re-audit seat that detects a file
  // outside the claimed set ⇒ the FULL panel re-runs (fail-closed, PIN-18).
  const aceRelSet = arr => new Set((Array.isArray(arr) ? arr : []).map(aceRelPath).filter(p => typeof p === 'string' && p.length > 0))
  const aceScope = (r, w, findings) => {
    const git = aceRelSet(w && w.ace_diff_files)
    if (!git.size) return { roster: null, why: 'the git-derived ace file set (ace_diff_files) is absent or empty' }
    const claimed = aceRelSet(w && w.files_changed)
    if (claimed.size && ([...git].some(f => !claimed.has(f)) || [...claimed].some(f => !git.has(f))))
      return { roster: null, why: 'the files_changed cross-check disagrees with the git-derived ace file set' }
    const footprint = aceRelSet(findings.map(f => f.file))
    const outside = [...git].filter(f => !footprint.has(f)).sort()
    if (outside.length) return { roster: null, why: 'the ace diff touches file(s) outside the findings footprint: ' + outside.join(', ') }
    const lenses = new Set(findings.filter(f => git.has(aceRelPath(f.file))).map(f => f.lens).filter(Boolean))
    const sub = (r.task.roster || []).filter(s => lenses.has(s.lens))
    if (!sub.length) return { roster: null, why: 'no roster seat matched an originating lens' }
    if (sub.length === (r.task.roster || []).length) return { roster: null, why: 'every roster seat originated a finding inside the ace footprint' }
    return { roster: sub, why: 'the git-derived ace file set is a subset of the findings footprint — only the originating seat(s) re-run' }
  }
  // #1944: an ace commit can fix only SOME of its batch's findings (partial worker compliance), yet
  // every listed finding used to be recorded aced — and an aced finding is NEVER filed as a follow-up,
  // so the untouched one's defect went untracked. That is the silent-finding-loss class, in the
  // bookkeeping path rather than the routing path. Demotion is gated on POSITIVE evidence only: a
  // non-empty git-derived file set that lacks this finding's file. An absent/empty git set, or a
  // fileless finding, keeps today's behaviour — the full panel already re-approved that tip, and
  // demoting on missing evidence would manufacture follow-ups instead of recording real misses.
  const recordAcedTouched = (findings, sha, w) => {
    const git = aceRelSet(w && w.ace_diff_files)
    // Demotion needs a non-empty INTERSECTION between the git set and the batch's own footprint
    // (#1954 — containment reopened the #1944 loss on a MIXED footprint: findings a+c, commit
    // touching a+b left c recorded aced). An empty intersection is missing evidence — the
    // whole-batch dialect disagreement and the PURE cross-file fix (finding on A, fix in B) both
    // land there and never demote. RESIDUAL, ruled (#1954): the overlap arm accepts two known
    // false positives — a MIXED cross-file fix (A fixed in place, C genuinely fixed in companion
    // file B) and a per-seat path dialect (f.file comes from different seats, one form can miss
    // while another matches). Both over-file a follow-up for done work; a spurious follow-up is
    // preferred to a silent aced miss, never lost work.
    // RESIDUAL, ruled: the no-intersection arm records aced on the full panel's re-approval
    // alone — a panel approving the tip does not verify each queued finding was fixed (the sweep
    // polish arm's ruled residual, same shape).
    const footprint = aceRelSet(findings.map(f => f.file))
    const overlap = git.size > 0 && [...git].some(p => footprint.has(p))
    for (const f of findings) {
      if (overlap && typeof f.file === 'string' && f.file && !git.has(aceRelPath(f.file))) {
        // Failed ATTEMPT, not a failed fix (D13): the sweep is the next rung — never a follow-up.
        routeToSweep(f, 'failed absorb — the ace commit at ' + sha + ' never touched ' + aceRelPath(f.file) + ' (partial batch fix); a finding is never recorded aced without evidence the commit reached its file')
        continue
      }
      recordAced(f, sha, citationOf(f) ? { citation: citationOf(f) } : null)
    }
  }
  // Seat-detected excess (PIN-18): the two file arrays come from the SAME agent, so the independent
  // checker is the re-audit seat — it re-runs the diff itself (read-only git, inside the auditor guard)
  // and flags scopeBreach when anything falls outside the claimed set.
  const aceScopeClause = (scope, w, r, sha) => scope.roster
    ? pt`\nDELTA-SCALED RE-AUDIT (pin transfer, PIN-18): only the seat(s) that raised the findings this ace commit resolved are re-running; every other seat's approval transfers to ${sha} unchanged. The ace worker CLAIMS it changed exactly these files: ${[...aceRelSet(w && w.ace_diff_files)].sort().join(', ')}. Run \`git -C ${r.task.worktree} diff --name-only ${sha}^ ${sha}\` YOURSELF and compare (the ace commit is always exactly ONE commit, so its parent IS the pre-ace tip) — never widen the claimed set on trust. If ANY changed file falls outside that claimed set, set \`scopeBreach: true\` on your verdict and name the file: the transfer is refused and the FULL panel re-runs.`
    : ''
  const aceSeatRows = (ran, carried, sha) => [
    ...ran.map(s => ({ seat: s.seat, lens: s.lens, outcome: 're-ran', sha: auditShaOrSentinel(s.audit_sha) })),
    ...carried.map(s => ({ seat: s.seat, lens: s.lens, outcome: 'transferred', sha, approvedAt: s.transferredFrom })),
  ]
  const recordAceTransfer = (r, sha, mode, why, ran, carried) => {
    const seats = aceSeatRows(ran, carried, sha)
    pinTransfers.push({ task: r.task.id, kind: 'ace', mode, why, sha, seats })
    log('ace-scope ' + r.task.id + ' @ ' + sha + ': ' + mode + ' — ' + why + '; seats: ' + (seats.map(x => (x.lens || x.seat) + '=' + x.outcome).join(', ') || '(none)'))
  }
  // aceReaudit: the ONE re-audit seam every ace-family round (batch, bisection subset, re-entry batch)
  // goes through — gate first (PIN-12), then the delta-scaled panel with per-seat transfer provenance.
  // Returns { red: true } when the gate was not green: the caller forward-reverts and demotes.
  const aceReaudit = async (r, sha, findings, w) => {
    if (!(await aceGateGreen(r, sha))) return { red: true, seats: [], expected: 0 }
    const prior = (r.seats || []).slice()
    const scope = aceScope(r, w, findings)
    const { seats, expected } = await auditRound(r.task, null, null, sha,
      citationSoundnessClause(findings) + aceScopeClause(scope, w, r, sha), scope.roster)
    if (!scope.roster) { recordAceTransfer(r, sha, 'full-panel', scope.why, seats, []); return { red: false, seats, expected } }
    if (seats.some(s => s && (s.scopeBreach === true || (s.findings || []).some(f => f && f.scopeBreach === true)))) {
      log('ace-scope ' + r.task.id + ': a re-audit seat detected a file outside the claimed ace_diff_files set — the subset transfer is REFUSED and the FULL panel re-runs at ' + sha + ' (PIN-18).')
      const full = await auditRound(r.task, null, null, sha, citationSoundnessClause(findings))
      recordAceTransfer(r, sha, 'full-panel', 'seat-detected file outside the claimed ace_diff_files set (PIN-18)', full.seats, [])
      return { red: false, seats: full.seats, expected: full.expected }
    }
    const ran = new Set(scope.roster.map(s => s.lens))
    // Carried approvals ride with EMPTY findings: their Minor/Nits were already routed once at the
    // pre-ace collection, and re-minting them here would only be refused by the content-key registries.
    const carried = prior.filter(s => s && !ran.has(s.lens) && s.verdict === 'approve')
      .map(s => ({ ...s, findings: [], audit_sha: sha, pinTransferred: true, transferredFrom: auditShaOrSentinel(s.audit_sha) }))
    recordAceTransfer(r, sha, 'subset', scope.why, seats, carried)
    return { red: false, seats: [...seats, ...carried], expected: (r.task.roster || []).length }
  }
  const aceBisect = async (r, aceable, batchSha, regressionSeats) => {
    // Culprit attribution: a regression blocking finding NAMES a culprit when its file matches an
    // aceable finding's file (parsing-shape latitude; both sides aceRelPath-normalized). Empty
    // attribution is ambiguous (blind halving); total attribution leaves nothing to salvage — the
    // batch finally fails whole.
    const culpritFiles = new Set(blockingOf(regressionSeats).map(f => aceRelPath(f.file)).filter(Boolean))
    const culprits = aceable.filter(f => culpritFiles.has(aceRelPath(f.file)))
    const rest = aceable.filter(f => !culpritFiles.has(aceRelPath(f.file)))
    let queue
    // Every demote below sits on a forward-revert arm ({ reverted: true } — the oscillation-bound
    // registry) and, when the regressed panel flagged citationUnsound, a citation-carrying
    // finding's reason NAMES the mismatch (unsoundReason — the D6 naming duty holds on the
    // round-1-batch path, not only the re-entry path).
    if (culprits.length && rest.length) {
      for (const f of culprits) { const ur = unsoundReason(regressionSeats, f); demote(f, 'follow-up', 'demote:absorb-regressed — failed absorb — named culprit of the ace re-audit regression (culprit-first excision); the batch commit is forward-reverted' + (ur ? '; ' + ur : ''), { reverted: true }) }
      queue = [{ findings: rest, depth: 1 }]
    } else if (culprits.length) {
      // every batch finding is a named culprit — nothing to salvage; the batch finally fails whole.
      for (const f of aceable) { const ur = unsoundReason(regressionSeats, f); demote(f, 'follow-up', 'demote:absorb-regressed — failed absorb — ace re-audit regressed and named every batch finding as culprit; the ace commit is forward-reverted' + (ur ? '; ' + ur : ''), { reverted: true }) }
      r.aceReverted = batchSha
      return
    } else {
      const halves = aceHalve(aceable)
      if (!halves) {
        // ambiguous AND atomic (one file group): the batch is its own final subset — demote whole.
        for (const f of aceable) { const ur = unsoundReason(regressionSeats, f); demote(f, 'follow-up', 'demote:absorb-regressed — failed absorb — ace re-audit regressed; the ace commit is forward-reverted' + (ur ? '; ' + ur : ''), { reverted: true }) }
        r.aceReverted = batchSha
        return
      }
      queue = halves.map(fs => ({ findings: fs, depth: 1 }))
    }
    let pendingRevert = batchSha                         // failed tip commit not yet reverted in-loop
    while (queue.length) {
      const sub = queue.shift()
      // Absorb-budget stop (D5): subset commits dispatch only while absorbRounds < run.absorbRounds
      // — the ace ladder's OWN meter, never fixRounds (the merge-floor retry loop keeps its whole
      // roundLimit, PIN-7). A spent budget mid-bisection routes this subset and every still-queued
      // one — none re-audited yet — to the phase-close sweep as absorbs (routeToSweep, phaseClose:
      // true), no follow-up, no prefix; a subset that already failed its own re-audit kept its
      // demote on the arm below. Logged, naming the counter.
      if (r.task.absorbRounds >= absorbRounds) {
        log('ace-bisect ' + r.task.id + ': ladder stopped — absorbRounds ' + r.task.absorbRounds + ' reached run.absorbRounds (' + absorbRounds + '); the still-queued subsets route to the phase-close sweep as absorbs')
        for (const q of [sub, ...queue.splice(0)])
          for (const f of q.findings) routeToSweep(f, 'absorb budget spent mid-bisection (absorbRounds ' + r.task.absorbRounds + ' reached run.absorbRounds ' + absorbRounds + '); the subset was never re-audited')
        break
      }
      // Deterministic trailer value (shape latitude): task id + the subset's sorted file set —
      // concatenation-built (census-safe), stable across resume replays. Files are aceRelPath-
      // normalized (#1813) so a `./`-form report never mints a trailer diverging from its bare twin.
      const trailer = r.task.id + ':' + [...new Set(sub.findings.map(f => aceRelPath(f.file)))].sort().join(',')
      const aceCharge = aceChargeOf(r)                   // `Ace-Charge: <task>:<n>` — n = absorbRounds after this commit's charge
      const revertStep = aceRevertStep(r.task.worktree, pendingRevert)
      const sw = await dispatch(
        pt`ACE BISECTION SUBSET for WAR task ${r.task.id} (a regressed --ace batch re-applied in subsets). Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — never create it; cd there.\n`
        + revertStep
        + pt`PREFLIGHT (resume idempotency): scan the BISECTION RANGE (e.g. \`git -C ${r.task.worktree} log --format='%H %(trailers:key=Ace-Subset,valueonly)' ${batchSha}^..HEAD\`) — never the tip alone; compare each extracted trailer value (whitespace-trimmed) to \`${trailer}\` by EXACT whole-string equality — never a prefix or substring match (a subset's trailer value can be a strict prefix of a later, wider sibling's); on an exact-equal match, return that commit's sha as head_sha WITHOUT committing.\n`
        + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
        + pt`Apply the smallest mechanical fix for EACH finding below, keep the gate green, and make EXACTLY ONE commit citing each finding's title + rationale, its message ENDING with the trailer lines \`Ace-Subset: ${trailer}\` and \`Ace-Charge: ${aceCharge}\` as its OWN final paragraph, separated from the body by a blank line — git parses trailers only in a distinct final block (the panel re-audits the new sha; a regression is forward-reverted):\n`
        // pt-tagged prompt-feeding rows (subset prompt, top-level-catch): f.severity is construction-
        // guaranteed (sub.findings ⊆ aceable); the shared aceFindingRow builder is absence-tolerant.
        + sub.findings.map(aceFindingRow).join('\n') + '\n'
        + pt`Dead attempt: discard UNCOMMITTED changes in THIS worktree only (git checkout -- .) — never any shared ref or history rewrite. No version/release-slot edits. Commit and push ${r.task.branch}.`
        + ACE_DIFF_FILES_CLAUSE + intentClause + provisionClause,
        { agentType: NS + 'war-worker', phase: 'Audit', label: aceLabel(r), schema: WORKER_RESULT, ...spawnWorker('fix') })
      const swWhy = blockedReason(sw)
      if (swWhy || typeof sw.head_sha !== 'string' || !sw.head_sha) {
        // No usable commit — uncharged; the tip state is unknowable, so the ladder abandons here
        // (never holds): this subset and every queued one route to the sweep (a failed ATTEMPT, D13 —
        // the rows stay absorbs), and the conditional revert clauses (dispatch-side and merge-side)
        // keep any already-performed revert from repeating.
        for (const q of [sub, ...queue.splice(0)])
          for (const f of q.findings) routeToSweep(f, 'failed absorb — ' + (swWhy || 'subset worker returned no usable head_sha') + '; bisection abandoned, remaining subsets route to the sweep')
        break
      }
      r.task.absorbRounds++                              // each subset COMMIT charges one absorb slot (D4/D5) — never fixRounds
      pendingRevert = null                               // the dispatched revert step cleared the failed predecessor
      const subSha = sw.head_sha
      // Gate at the subset tip FIRST (PIN-12), then the delta-scaled panel (D3/PIN-10). A red gate is
      // not a regression to bisect further: the subset is forward-reverted and its findings demote.
      const { red: subRed, seats: subSeats, expected: subExpected } = await aceReaudit(r, subSha, sub.findings, sw)   // re-pin + re-audit (unmetered)
      if (subRed) {
        pendingRevert = subSha
        for (const f of sub.findings) routeToSweep(f, 'failed absorb — the task gate was RED at the subset ace tip, so no re-audit ran and no approval could be accounted there (PIN-12); the subset commit is forward-reverted')
        continue
      }
      if (allApprove(subSeats, subExpected) && blockingOf(subSeats).length === 0) {
        r.seats = subSeats                               // merge proceeds on this approved subset tip
        r.aceSha = subSha
        recordAcedTouched(sub.findings, subSha, sw)   // #1944: only what the subset commit touched
        // Route the re-audit round's OWN Minor/Nits (never drop silently): a fresh absorb born at
        // this subset re-audit queues for budget-bounded RE-ENTRY (aceReentry runs after the
        // bisection resolves — D1, #1731).
        routeReauditMinors(r, subSeats)
      } else {
        pendingRevert = subSha                           // reverted by the NEXT dispatch, or the merge clause if final
        // Fold (#1694): the FAILING subset's re-audit round's OWN Minor/Nits route by disposition
        // too, mirroring the approved arm — an ask parks, never drops; a fresh absorb queues for
        // budget-bounded re-entry (D1, #1731 — born at a re-audit, it re-enters after the bisection).
        // Blocking findings stay untouched — they are this arm's regression signal, not routable.
        routeReauditMinors(r, subSeats)
        const halves = sub.depth < 2 ? aceHalve(sub.findings) : null
        if (halves) queue.unshift(...halves.map(fs => ({ findings: fs, depth: sub.depth + 1 })))
        else for (const f of sub.findings) { const ur = unsoundReason(subSeats, f); demote(f, 'follow-up', 'demote:absorb-regressed — failed absorb — subset regressed on re-audit at the depth/split floor; the subset commit is forward-reverted' + (ur ? '; ' + ur : ''), { reverted: true }) }
      }
    }
    if (pendingRevert) r.aceReverted = pendingRevert     // final failed tip not yet reverted in-loop
  }
  // ---- ACE RE-ENTRY (D1/D2, #1731 — the ladder RE-OPENS for fresh absorbs born at a re-audit) ----
  // Budget-bounded, NO new round type and NO new status member: each re-entry round is another
  // ace-style batch on the same machinery — same eligibility, the same `Ace-Subset` trailer
  // discipline (deterministic value carrying the existing round index), the same tip-preflight
  // idempotency (PIN-15: range scan, EXACT whole-string equality, never the tip alone), the same
  // forward-revert posture. The absorb budget is the SOLE bound (PIN-1 — no echo cap, no
  // shrinking rule): re-entry batches dispatch only while absorbRounds < run.absorbRounds — the
  // same gate the batch ace and the bisection subsets read (D5). Budget-spent findings route
  // phaseClose:true (the sweep rung, logged); a regressed re-entry batch is
  // forward-reverted and its findings demote — a forward-reverted finding NEVER re-enters (the
  // oscillation bound, A1) — while the regressed re-audit's own fresh absorbs may still re-enter
  // (born at a re-audit) until the budget stops the loop. Every demotion logged, nothing silent
  // (PIN-2). A citation-resolved finding (D6) is executed through this vehicle: its prompt row and
  // commit message carry the row-id + match rationale, the re-audit panel is charged with citation
  // soundness, and on approval the aced record carries the citation.
  const aceReentry = async (r) => {
    let pendingRevert = r.aceReverted || null            // take over any not-yet-reverted failed tip
    if (pendingRevert) r.aceReverted = null
    while ((r.reentryQueue || []).length) {
      if (r.task.absorbRounds >= absorbRounds) {
        log('ace-reentry ' + r.task.id + ': budget-blocked — absorbRounds ' + r.task.absorbRounds + ' reached run.absorbRounds (' + absorbRounds + '); the fresh absorb(s) route phaseClose:true (the sweep is the fallback rung).')
        for (const f of r.reentryQueue.splice(0)) routeToSweep(f, 'budget-blocked re-entry (absorbRounds reached run.absorbRounds)')   // still queued (sweep queue now) — routeToSweep re-stamps queuedKeys
        break
      }
      // Drain-time registry re-check (the oscillation bound, A1 + End state 6): the registries
      // mutate BETWEEN queue time and drain time — on the batch-regressed arm routeReauditMinors
      // runs before aceBisect's { reverted: true } demotes land, and on the failing-subset arm the
      // route precedes the depth/split-floor demote — so a content-identical re-mint can already be
      // sitting on the queue when its key enters revertedKeys (or acedKeys/filedKeys). Queue-time
      // remintBlock alone cannot see that; re-filter every entry through the SAME helper here so a
      // forward-reverted (or already-aced/already-filed) finding never re-enters regardless of arm
      // ordering. Each refusal is logged (never silent); an emptied batch skips the dispatch.
      const drained = r.reentryQueue.splice(0)
      for (const f of drained) queuedKeys.delete(remintKey(f))
      const batch = drained.filter(f => {
        const b = remintBlock(f)
        if (b) { log('re-entry REFUSED at drain: "' + (f.title ?? '') + '" (task ' + r.task.id + ') — ' + b + '; never dispatched (logged, never silent).'); corroborateSurvivor(f); return false }
        return true
      })
      if (!batch.length) continue
      // Same trailer discipline as a bisection subset, with the absorbRounds index folded in (D5 —
      // re-anchored off fixRounds, which ace commits no longer move) so successive re-entry rounds
      // over the same file set stay distinct across resume replays.
      const trailer = r.task.id + ':reentry:a' + (r.task.absorbRounds + 1) + ':' + [...new Set(batch.map(f => aceRelPath(f.file)))].sort().join(',')
      const aceCharge = aceChargeOf(r)
      const reentryRange = r.reentryBase ? pt`${r.reentryBase}^..HEAD` : pt`HEAD~30..HEAD`
      const rw = await dispatch(
        pt`ACE RE-ENTRY BATCH for WAR task ${r.task.id} (fresh absorb findings born at a re-audit — the ladder re-opens, budget-bounded). Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — never create it; cd there.\n`
        + aceRevertStep(r.task.worktree, pendingRevert)
        + pt`PREFLIGHT (resume idempotency): scan the range (e.g. \`git -C ${r.task.worktree} log --format='%H %(trailers:key=Ace-Subset,valueonly)' ${reentryRange}\`) — never the tip alone; compare each extracted trailer value (whitespace-trimmed) to \`${trailer}\` by EXACT whole-string equality — never a prefix or substring match; on an exact-equal match, return that commit's sha as head_sha WITHOUT committing.\n`
        + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
        + pt`Apply the smallest mechanical fix for EACH finding below, keep the gate green, and make EXACTLY ONE commit citing each finding's title + rationale (an absorb-by-citation row's cited row-id + match rationale included), its message ENDING with the trailer lines \`Ace-Subset: ${trailer}\` and \`Ace-Charge: ${aceCharge}\` as its OWN final paragraph, separated from the body by a blank line (the panel re-audits the new sha; a regression is forward-reverted):\n`
        + batch.map(aceFindingRow).join('\n') + '\n'
        + pt`Dead attempt: discard UNCOMMITTED changes in THIS worktree only (git checkout -- .) — never any shared ref or history rewrite. No version/release-slot edits. Commit and push ${r.task.branch}.`
        + ACE_DIFF_FILES_CLAUSE + intentClause + provisionClause,
        { agentType: NS + 'war-worker', phase: 'Audit', label: aceLabel(r), schema: WORKER_RESULT, ...spawnWorker('fix') })
      const rwWhy = blockedReason(rw)
      if (rwWhy || typeof rw.head_sha !== 'string' || !rw.head_sha) {
        // No usable commit — uncharged; abandon (never hold): this batch and the queue route to the
        // sweep (a failed ATTEMPT, D13 — the rows stay absorbs; routeToSweep re-stamps queuedKeys).
        for (const f of [...batch, ...r.reentryQueue.splice(0)]) {
          queuedKeys.delete(remintKey(f))
          routeToSweep(f, 'failed absorb — ' + (rwWhy || 're-entry worker returned no usable head_sha') + '; re-entry abandoned')
        }
        break
      }
      r.task.absorbRounds++                              // each re-entry COMMIT charges one absorb slot (D5) — never fixRounds
      pendingRevert = null                               // the dispatched revert step cleared the failed predecessor
      const reSha = rw.head_sha
      const { red: reRed, seats: reS, expected: reE } = await aceReaudit(r, reSha, batch, rw)
      if (reRed) {
        pendingRevert = reSha
        for (const f of batch) routeToSweep(f, 'failed absorb — the task gate was RED at the re-entry ace tip, so no re-audit ran and no approval could be accounted there (PIN-12); the re-entry commit is forward-reverted')
        continue
      }
      if (allApprove(reS, reE) && blockingOf(reS).length === 0) {
        r.seats = reS                                    // merge proceeds on this approved re-entry tip
        r.aceSha = reSha
        recordAcedTouched(batch, reSha, rw)           // #1944: only what the re-entry commit touched
        routeReauditMinors(r, reS)                       // fresh absorbs born HERE re-enter (loop continues)
      } else {
        pendingRevert = reSha                            // reverted by the NEXT dispatch, or the merge clause if final
        // Unsound-citation naming (D6): a blocking re-audit finding flagged citationUnsound names
        // the mismatch — the shared unsoundReason helper carries it into the demote reason so the
        // durable record explains the revert (same duty as aceBisect's regression arms). Each
        // demote registers on revertedKeys ({ reverted: true }) — the oscillation bound's registry.
        for (const f of batch) {
          const ur = unsoundReason(reS, f)
          demote(f, 'follow-up', 'demote:absorb-regressed — failed absorb — ' + (ur
            ? ur + '; the re-entry commit is forward-reverted'
            : 're-entry batch regressed on re-audit; the re-entry commit is forward-reverted (a forward-reverted finding never re-enters)'), { reverted: true })
        }
        routeReauditMinors(r, reS)                       // the regressed round's own fresh absorbs may still re-enter
      }
    }
    if (pendingRevert) r.aceReverted = pendingRevert     // final failed tip rides the merge dispatch's revert clause
  }
  // ---- WAVE-SIDE ACE STAGE (#1913, A1) ----
  // The disposition routing and the WHOLE --ace ladder — batch dispatch, gate at the ace tip, re-audit,
  // aceBisect, aceReentry — used to sit inside the serial merge queue, so every ace re-audit was paid
  // for under the integration lock. They run HERE instead: inside the wave thunk, per task, at that
  // task's panel-approved tip, concurrent across tasks and finished BEFORE the merge queue starts. The
  // routing and ladder bodies are unchanged; only the slot moved. Budget (D5, PIN-7): the wave thunk
  // seeds task.fixRounds from the audit loop's round count before calling this, but NO ace commit
  // charges it — every ace-side commit charges task.absorbRounds, the ladder's own meter (seeded by
  // the barrier's absorbCharges read, 0 on a fresh branch); the merge slot's fixRounds seed stays
  // never-lowering so a resume that enters the merge queue without this stage still has a defined
  // budget (PIN-13). Fail-open (PIN-2): an engine error inside the stage is caught, logged, and the
  // approved task still merges its pre-ace tip.
  const aceStage = async (r) => {
    // Classify-at-collection (ADR 0013), now classified wave-side: each Minor/Nit routes ONCE, by
    // disposition. Minted once and stashed on r so the merge queue never re-mints the same findings.
    const taskMinors = minorsOf(r.seats || []).map(f => ({ task: r.task.id, ...f }))
    r.taskMinors = taskMinors
    if (r.verdict !== 'approve') return          // the non-approve demotion arm stays at the merge slot
    try {
      // Disposition routing (ADR 0013; ask arm #1550 — parked for the Checkpoint ruling gate,
      // never aced, never filed). dispositionOf reads the task's diff probe (D4) and the intake
      // floor runs right after it (seat rows only). absorb splits further: fileless → severity
      // default (demotion); a release-slot filename → demote at birth (D2, PIN-11); run.ace off →
      // the sweep, phaseClose:true (D14 — the per-task ladder is what run.ace gates); eligible →
      // per-task ace exactly as today; phaseClose:true → phaseCloseQueue (the sweep's feed).
      const aceable = []
      const diff = diffFilesOf(r.task)
      for (const f of taskMinors) {
        const d = intakeFloor(f, dispositionOf(f, diff), diff)
        if (d === 'ask') parkAsk(f)                 // ask precedes the absorb chain (#1550, D7)
        else if (d === 'follow-up') fileFollowUp(f) // stamps filedKeys (End state 6) — a later re-audit re-mint never also aces
        else if (d === 'note') notes.push(f)
        else if (!f.file) demote(f, f.severity === 'Minor' ? 'follow-up' : 'note', 'demote:fileless — fileless absorb takes the severity default (never ace-eligible)')
        else if (!aceEligible(f)) demoteReleaseSlot(f)
        else if (!run.ace) routeToSweep(f, 'ace off this run (run.ace false) — the per-task ladder never dispatches; the sweep is the vehicle (D14)')
        else if (!f.phaseClose) aceable.push(f)
        else { queuedKeys.add(remintKey(f)); phaseCloseQueue.push(f) }   // stamps queuedKeys — a later re-audit re-mint never queues twice
      }
      // Held absorbs (D5): rows held on r.task.pendingAbsorbs by an earlier blocker-held batch join
      // THIS approve's aceable set (deduped by content key against the fresh rows), logged.
      // ponytail: the in-phase path is deliberately unwired — aceStage runs ONCE per task (the wave
      // thunk calls it at the audit-loop exit and the task then enters `done`), and the hold arm that
      // writes r.task.pendingAbsorbs sits at the bottom of this same call, so no in-run hold reaches
      // this fold; its only live producer is relaunch-seeded args.tasks[].pendingAbsorbs, and the
      // end-of-queue held-absorb drain owns every in-run held row.
      // Trust boundary: that seeded producer reaches no entry validation, so every held row passes
      // the SAME routing chain as a fresh row above (fileless, aceEligible, run.ace, phaseClose)
      // before it may join aceable — a seeded release-slot row never rides an ace batch (PIN-11)
      // and a seeded row never dispatches an ace worker with run.ace off (PIN-16).
      const heldRows = Array.isArray(r.task.pendingAbsorbs) ? r.task.pendingAbsorbs.splice(0) : []
      for (const f of heldRows) {
        queuedKeys.delete(remintKey(f))   // no longer held — the dedup below judges it (the aceReentry drain's stamp-and-clear idiom)
        // The collision may be a fresh row OR an earlier held copy already folded — worded cause-neutrally.
        if (aceable.some(a => remintKey(a) === remintKey(f))) { log('absorb-budget: held absorb "' + (f.title ?? '') + '" (task ' + r.task.id + ') is a duplicate of a row already in this approve\'s ace batch — the held copy is dropped.'); continue }
        if (!f.file) demote(f, f.severity === 'Minor' ? 'follow-up' : 'note', 'demote:fileless — fileless held absorb takes the severity default (never ace-eligible)')
        else if (!aceEligible(f)) demoteReleaseSlot(f)
        else if (!run.ace) routeToSweep(f, 'held absorb with ace off this run (run.ace false) — the per-task ladder never dispatches; the sweep is the vehicle (D14)')
        else if (!f.phaseClose) {
          log('absorb-budget: held absorb "' + (f.title ?? '') + '" (task ' + r.task.id + ') joins this approve\'s ace batch (r.pendingAbsorbs → aceable).')
          aceable.push(f)
        } else {
          log('absorb-budget: held absorb "' + (f.title ?? '') + '" (task ' + r.task.id + ') is phaseClose:true — routed to the phase-close sweep, never the ace batch.')
          queuedKeys.add(remintKey(f)); phaseCloseQueue.push(f)
        }
      }
      // --ace: opt-in, fail-closed pre-merge polish of absorb-disposition findings. The BATCH attempt is
      // unchanged (one commit, one re-audit — the happy path is byte-identical): the ace worker commits one
      // fix, a fresh auditRound re-audits at the new sha; if re-approved the merge runs on the polished tip.
      // A re-audit REGRESSION now enters the bounded aceBisect ladder (culprit-first excision, then
      // halving to depth 2) instead of demoting the whole batch — NEVER escalate; the approved work still lands.
      // Sits at the TOP of the WAVE-SIDE ace stage, per task, at the panel-approved tip — it no longer
      // runs inside the serial merge queue, so no re-audit is paid for under the integration lock (#1913).
      // Gate (D5): the batch ace reads the absorb budget — absorbRounds < run.absorbRounds — never
      // fixRounds (a task at its fixRounds ceiling with absorb budget free still aces, PIN-7).
      let aceSha = null
      const openBlockers = blockingOf(r.seats).length
      if (openBlockers === 0 && aceable.length && r.task.absorbRounds < absorbRounds) {
        const aceCharge = aceChargeOf(r)
        const ace = await dispatch(
          pt`ADVISORY POLISH (--ace) for WAR task ${r.task.id}. Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
          // Prompt truth (D6): keep-the-gate-green prompts carry the gate command + the task's
          // Done when: clause (absent ⇒ '' — legacy byte-identity, End state 9).
          + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
          + pt`This task is ALREADY APPROVED. These are auditor-flagged absorb-disposition Minor/Nit findings — apply the smallest mechanical fix for EACH, keep the gate green, and make EXACTLY ONE commit whose message cites each finding's title + rationale:\n`
          // pt-tagged prompt-feeding rows (ace prompt, top-level-catch): f.severity is construction-guaranteed (aceable =
          // minorsOf/absorb → Minor/Nit only, bare); the shared aceFindingRow builder is absence-tolerant
          // (and renders a citation-resolved row's row-id + match rationale, D6).
          + aceable.map(aceFindingRow).join('\n') + '\n'
          + pt`Make ONE commit only, its message ENDING with the trailer line \`Ace-Charge: ${aceCharge}\` as its OWN final paragraph, separated from the body by a blank line — git parses trailers only in a distinct final block (the panel re-audits it at the new sha; on regression it is forward-reverted). Do NOT touch version/release slots. Commit and push ${r.task.branch}.`
          + ACE_DIFF_FILES_CLAUSE + intentClause + provisionClause,
          { agentType: NS + 'war-worker', phase: 'Audit', label: aceLabel(r), schema: WORKER_RESULT, ...spawnWorker('fix') })
        const aceWhy = blockedReason(ace)
        // WORKER_RESULT's commit field is `head_sha` (NOT `sha` — no worker result carries `.sha`).
        // Guard on a TRUTHY head_sha: a falsy sha would make r.aceReverted falsy (revert clause never
        // fires) AND emit a `git revert --no-edit ` with no arg (fails → escalate). Both defeat the
        // never-blocks-a-land invariant. A blocked/head_sha-less ace falls through to the plain merge.
        if (!aceWhy && typeof ace.head_sha === 'string' && ace.head_sha) {
          r.task.absorbRounds++                          // the batch ace COMMIT charges one absorb slot (D5) — fixRounds untouched (PIN-7)
          aceSha = ace.head_sha /* the batch ace commit */
          r.reentryBase = ace.head_sha                 // re-entry preflight range anchor (PIN-15)
          // Gate at the ace tip first (PIN-12), then the delta-scaled panel with per-seat transfer
          // provenance (D3/PIN-10/PIN-18) — the shared ace re-audit seam.
          const { red: batchRed, seats: reSeats, expected: reExpected } = await aceReaudit(r, aceSha, aceable, ace)
          if (batchRed) {
            // A red gate is not a regression to bisect: nothing was judged at this tip, so there is
            // nothing to attribute. Forward-revert it and route the rows to the sweep (a failed
            // ATTEMPT, D13 — the rows stay absorbs) — never a fix loop, never a hold.
            r.aceReverted = aceSha
            aceSha = null
            for (const f of aceable) routeToSweep(f, 'failed absorb — the task gate was RED at the ace tip, so no re-audit ran and no approval could be accounted there (PIN-12); the ace commit is forward-reverted')
          } else if (allApprove(reSeats, reExpected) && blockingOf(reSeats).length === 0) {
            r.seats = reSeats                          // merge proceeds on the polished tip
            r.aceSha = aceSha
            // aced provenance (D3): the findings this ace commit resolved. No splice needed —
            // classify-at-collection never eagerly filed them. A citation-resolved finding's aced
            // record carries the citation (D6).
            recordAcedTouched(aceable, aceSha, ace)  // #1944: only what the ace commit touched
            // Route the re-audit round's OWN Minor/Nits too (never drop silently): a fresh absorb
            // born at this re-audit queues for budget-bounded RE-ENTRY (D1, #1731 — the ladder
            // re-opens; aceReentry dispatches it below).
            routeReauditMinors(r, reSeats)
          } else {
            aceSha = null
            // Fold (#1694): the REGRESSED re-audit round's OWN Minor/Nits route by disposition too,
            // mirroring the approved arm — an ask parks, never drops; a fresh absorb queues for
            // budget-bounded re-entry (D1, #1731). Blocking findings stay
            // untouched: they are the ladder's culprit-attribution input below.
            routeReauditMinors(r, reSeats)
            // Regression (D1/D2): the bounded bisection ladder replaces the whole-batch demotion — it
            // owns the in-loop forward-reverts and sets r.aceSha / r.aceReverted / r.seats as it resolves.
            await aceBisect(r, aceable, ace.head_sha, reSeats)
          }
          // Budget-bounded RE-ENTRY (D1/D2, #1731): fresh absorbs born at any of this task's
          // re-audits (batch, bisection subsets, or a re-entry round's own) queued on
          // r.reentryQueue — the ladder re-opens for them here, after the batch/bisection resolved,
          // while absorbRounds < run.absorbRounds (the absorb budget is the sole bound, D5).
          if (r.reentryQueue && r.reentryQueue.length) await aceReentry(r)
        } else {
          // aceWhy or falsy head_sha: fall through to the normal merge on the un-aced approved tip
          // (never hold). A failed ATTEMPT (ace blocked / no usable head_sha) routes the rows to the
          // sweep as absorbs (D13) — the old text stays as the log line, never a follow-up.
          for (const f of aceable) routeToSweep(f, 'failed absorb — ' + (aceWhy || 'ace worker returned no usable head_sha'))
        }
      } else if (aceable.length && openBlockers === 0) {
        // Spent absorb budget, no open blockers (D5): the aceable rows ride to the phase-close sweep
        // as absorbs (routeToSweep, phaseClose:true) — the next rung, never a follow-up. Logged,
        // naming the counter.
        log('absorb-budget: task ' + r.task.id + ' has absorbRounds ' + r.task.absorbRounds + ' at run.absorbRounds (' + absorbRounds + ') — no ace batch dispatches; ' + aceable.length + ' aceable row(s) route to the phase-close sweep.')
        for (const f of aceable) routeToSweep(f, 'absorb budget spent (absorbRounds ' + r.task.absorbRounds + ' reached run.absorbRounds ' + absorbRounds + ') — no ace batch for this task')
      } else if (aceable.length) {
        // Open Critical/Major blockers (D5): the aceable rows are HELD on the task
        // (r.task.pendingAbsorbs, deduped by content key) and join the aceable set at the next
        // approve; a task that ends escalated, audit-blocked, or never merged demotes them with
        // demote:absorb-blocked (the merge-queue drain below). Never dropped silently.
        r.task.pendingAbsorbs = Array.isArray(r.task.pendingAbsorbs) ? r.task.pendingAbsorbs : []
        for (const f of aceable) {
          if (r.task.pendingAbsorbs.some(h => remintKey(h) === remintKey(f))) continue
          queuedKeys.add(remintKey(f))   // stamps queuedKeys — a merge-slot re-mint never queues a second copy beside the held one
          r.task.pendingAbsorbs.push(f)
        }
        log('absorb-budget: task ' + r.task.id + ' carries ' + openBlockers + ' open blocking finding(s) — ' + aceable.length + ' aceable row(s) HELD on r.pendingAbsorbs (' + r.task.pendingAbsorbs.length + ' held in all) for the next approve\'s ace batch.')
      }
    } catch (err) {
      // PIN-2, restated at the new slot: the ace never turns a mergeable task into a hold. A thrown
      // engine error inside the stage is logged with its verbatim cause and the approved tip merges.
      log('ace-stage ' + r.task.id + ': engine error in the wave-side ace stage — ' + ((err && err.message) || String(err)) + '; the approved tip merges unchanged (fail-open, PIN-2).')
    }
  }
  // ---- WORK + AUDIT each task in the wave concurrently (the global dispatch semaphore caps the
  // agent dispatches underneath at maxParallel when set; this slot itself holds no permit, PIN-15) ----
  const results = await parallel(wave.map(task => async () => {
    // Wave-loop invariant (spec constraint 4, #742): a task dispatched into a work wave MUST terminate
    // in exactly ONE collected result — it may never re-enter the wave because of an engine-side throw.
    // The live `parallel` NULLS a rejected thunk, so results.filter(Boolean) drops it → done.add never
    // runs → nextWave() re-dispatches a COMPLETED, pushed, gate-green task every iteration (~660k
    // tokens/round) until the post-loop ghost-dep sweep mislabels it unrunnable-deps. So catch EVERY
    // engine error across the WHOLE thunk body (provisionStep — whose dispatch-layer infra deaths
    // classify env-died SOFT, Phase 6 Task 1 (c) — + the pt-tagged worker/fix prompt builds +
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
      const impl = await dispatchAgent(
        depClause(task)
        + pt`Implement WAR task ${task.id} in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}, cut from ${ph.integrationBranch}).\n`
        + pt`The refiner's Provision barrier already created this worktree and its .war-task marker — do NOT create it yourself and do NOT set any worktree env var. cd into ${task.worktree} and work only inside it; commit and push ${task.branch}.\n`
        // ${(plan && plan.file) ?? '<unset>'} (#1430 defense-in-depth — the second of the two
        // formerly-undefended sites; see the auditPrompt site's comment for the rationale).
        // ${task.planSlice ?? '<unset>'} (D5 defense-in-depth): planSlice is entry-validated
        // (TASK-FIELD class), so '<unset>' is unreachable on a validated launch. ${task.title} stays
        // deliberately BARE — it is the pinned in-thunk pt-throw trigger (criterion 3's fixture) and a
        // registered member of the remaining-bare-interpolation census.
        + pt`Sub-issue #${task.issue ?? '<unset>'} — ${task.title}\nPlan slice: ${task.planSlice ?? '<unset>'}\nPlan file: ${(plan && plan.file) ?? '<unset>'}\nGate: ${plan.gate}${doneWhenClause(task)}${workerIntentClause}`
        + WORKER_MEMORY_SELF_QUERY_LINE + workerMemClause(task.id) + provisionClause + workerExtraCtx
        + '\n' + COMMENT_LAG_RULE + '\n' + PLAN_DEFECT_RULE + '\n' + FILES_CHANGED_RULE + '\n' + ACCEPTANCE_IDS_RULE,
        { agentType: NS + 'war-worker', phase: 'Work', label: `work:${task.id}`, schema: WORKER_RESULT, ...spawnWorker(isDocsTask(task) ? 'docs' : null) })

      const why = blockedReason(impl); if (why) return { task, verdict: 'escalate', seats: [], expected: 0, blocked: why }
      impl.files_changed = normalizeReportedPaths(impl.files_changed, task.worktree, task.id)   // path contract (this spec): normalize main-rooted, escalate any other absolute
      // A1 (Task 3.2): stamp the worker's claimed End-state ids (acceptance_criteria_covered — the
      // A1 redefinition) on the task; landMerged threads them into the gate-audit entry, where the
      // per-task seat cross-checks them against its endStateAttestations rows. Absent/malformed ⇒ null.
      task.claimedEndStateIds = Array.isArray(impl.acceptance_criteria_covered) ? impl.acceptance_criteria_covered : null

      // DIFF PROBE (in-band-absorb-default D4, PIN-6): ONE refiner dispatch per task between the
      // worker's green return and the seat convene — `git diff --name-only <dispatchBase>..<tip>` in
      // the task worktree, the dispatch base being the merge-base of the integration branch and the
      // tip (the frozen phase base every worktree was cut from). Read-only and idempotent on resume
      // (the same range yields the same list; a replay re-dispatches harmlessly). Its diff_files feed
      // dispositionOf's engine default and the intake filing floor; worker files_changed is never the
      // source. FAIL-OPEN: a dead/thrown dispatch or a return without a diff_files array leaves the
      // probe ABSENT — logged here — and the task keeps the old severity default with the floor
      // skipped (its filed seat rows carry demote:floor-skipped). Never a hold, never a fix loop.
      {
        const tip = (typeof impl.head_sha === 'string' && impl.head_sha) ? impl.head_sha : 'HEAD'
        let probe = null
        try {
          probe = await dispatch(
            pt`DIFF PROBE for WAR task ${task.id} (you are the refiner; a read-only git read, no merge, no push, no rebase, no gate). `
            + pt`In the task worktree ${task.worktree} (branch ${task.branch}) run EXACTLY: git -C ${task.worktree} diff --name-only $(git -C ${task.worktree} merge-base ${ph.integrationBranch} ${tip})..${tip} — the dispatch base is the merge-base of the integration branch and the task tip. `
            + pt`Return { diff_files: [<one repo-relative path per line of that output, verbatim>] } — the GIT-derived changed-file list of the task branch; never the worker's own file report. Idempotent: re-running on a resume yields the same list. On any git error return { detail: "<the error>" } with NO diff_files — the engine keeps its old default for this task (fail-open); never block.`,
            { agentType: NS + 'war-refiner', phase: 'Audit', label: 'diff-probe:' + task.id, dispatchKind: 'diff-probe', schema: DIFF_PROBE_RESULT, ...spawn('refiner') })
        } catch (err) {
          log('diff-probe:' + task.id + ' dispatch threw — ' + ((err && err.message) || String(err)) + '; the probe is ABSENT for this task (fail-open).')
        }
        if (probe && Array.isArray(probe.diff_files)) {
          diffFilesByTask.set(task.id, aceRelSet(probe.diff_files))
          log('diff-probe:' + task.id + ' recorded ' + diffFilesByTask.get(task.id).size + ' changed file(s) at ' + tip + ' — dispositionOf and the intake floor read them (D4).')
        } else {
          diffFilesByTask.set(task.id, null)
          log('diff-probe:' + task.id + ' returned no diff_files (' + (probe && probe.detail ? probe.detail : 'dead dispatch or non-conforming return') + ') — the probe is ABSENT: the old severity default stands and the intake floor skips this task (D4, fail-open).')
        }
      }

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
          // nomination widens toward those seats @ deep, else the union with the default roster. Never silent.
          const widen = resolveWidenSource(seats[0].widen, defaultRoster)
          task.roster = widenRoster(task.roster, widen.seats)
          const src = widen.source === 'nominated' ? 'nominated' : 'default fallback'
          log(`Task ${task.id}: lone-seat widening (Critical or low confidence; source: ${src}) — roster is now [${task.roster.map(s => s.lens).join(', ')}].`)
        }

        const b = blockingOf(seats)                                // batched FIX_NEEDED → fresh fix-worker
        const fix = await dispatchAgent(
          pt`FIX_NEEDED for WAR task ${task.id}. Work in the ALREADY-PROVISIONED worktree at ${task.worktree} (branch ${task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
          // Prompt truth (D6): keep-the-gate-green prompts carry the gate command + the task's
          // Done when: clause (absent ⇒ '' — legacy byte-identity, End state 9).
          + pt`Gate: ${plan.gate}${doneWhenClause(task)}\n`
          + pt`Resolve ALL of these blocking findings, keep the gate green, commit and push:\n`
          // pt-tagged prompt-feeding rows (fix prompt, thunk-catch): f.severity is construction-guaranteed (b =
          // blockingOf → Critical/Major only, bare); title/file/rationale are schema-optional → ?? '' absence-tolerant.
          + b.map((f, i) => pt`${i + 1}. [${f.severity}] ${f.title ?? ''} (${f.file ?? ''}${f.line ? ':' + f.line : ''}) — ${f.rationale ?? ''}${f.suggested_fix ? pt` → ${f.suggested_fix}` : ''}`).join('\n')
          + workerMemClause(task.id) + provisionClause,
          { agentType: NS + 'war-worker', phase: 'Audit', label: `fix:${task.id}:r${round + 1}`, schema: WORKER_RESULT, ...spawnWorker('fix') })
        const fixWhy = blockedReason(fix); if (fixWhy) { verdict = 'escalate'; blocked = fixWhy; break }
        pin = fix && fix.head_sha   // D2: re-pin to the fix-worker's new tip for the next round's audit
        round++
      }
      if (verdict === null) verdict = 'audit-blocked'
      const r = { task, verdict, seats, expected, round, blocked }
      // Budget seed at the audit-loop exit (PIN-5/PIN-13): fixRounds records the blocking fix rounds
      // the merge-floor retry loop later continues from; the hoisted ace stage below never charges it
      // (D5 — ace commits charge absorbRounds), and the merge slot only never-lowers this seed.
      task.fixRounds = round
      r.preAceRounds = round
      // absorbRounds (D5): belt only — the barrier seed loop already assigns every task in `tasks` an
      // integer (the wave loop iterates that same array), so this line holds only if a future caller
      // reaches the wave thunk without that loop; it keeps the counter an integer, never undefined (pt).
      if (!Number.isInteger(task.absorbRounds) || task.absorbRounds < 0) task.absorbRounds = 0
      // WAVE-SIDE ACE (#1913): disposition routing + the whole ace ladder, per task, at the
      // panel-approved tip — concurrent across tasks, and finished before the merge queue opens.
      await aceStage(r)
      return r
    } catch (err) {
      // The caught engine error is the ONLY evidence trail — carried verbatim, uncurated, in blocked.
      // (#1411, structurally scoped — relaunch fix) A post-spawn API/quota/transport death classifies
      // 'env-died' (SOFT — the env-blocked sibling) ONLY when the throw is TAGGED as originating at
      // the agent() dispatch layer (dispatchAgent); the harness cause propagates verbatim. Every
      // OTHER engine error keeps today's HARD 'escalate' regardless of message content — an
      // engine-authored throw embedding worker-supplied infra words is never laundered SOFT.
      // (#1430 (iii), rescoped by /red-team 2026-08-16) A pt undefined-interpolation
      // throw gets an APPENDED diagnostic hint only — classification byte-unchanged (criterion 3's
      // in-thunk contract; a rethrow would be NULLed by `parallel` and silently drop the task, the
      // #742 wave-loop invariant). Hint + cause strings are concatenation-built (census-safe).
      const infraCause = infraDeathCause(err)
      if (infraCause) return { task, verdict: 'env-died', seats: [], expected: 0, blocked: 'worker died: ' + infraCause }
      const ptHint = String((err && err.message) || '').includes('undefined interpolation after')
        ? ' — if this interpolation names a launch arg, entry validation should have refused it — check the args file'
        : ''
      return { task, verdict: 'escalate', seats: [], expected: 0, blocked: `engine error during work/audit: ${err.message}` + ptHint }
    }
  }))

  // ---- REFINE — serial merge of approved tasks (THE merge queue) ----
  // ponytail: guard the agent-emitted pin at the copy site, not via a schema `pattern` —
  //           the model must still be able to emit the '(integration_sha …)' sentinel legitimately.
  const pinOrSentinel = s =>
    (typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)) ? s : '(integration_sha unrecorded/malformed)'
  // landMerged: the shared merged-task landing step (initial merge, floor-retry re-merge, the
  // baseline-proceed re-merge, and the environment-proceed re-merge all funnel through it). requiresTest:false ⇒ the gate-audit HARD path is
  // vacuous — skip + LOG (never silent). taskDebt (spec §6 / ADR 0019): a baseline-merged task carries
  // its classified failing identifiers so the gate-audit prompt won't read a pre-existing base failure
  // as a provably-unrun mapped test; empty/absent ⇒ the field is omitted (byte-identical entry).
  const landMerged = (task, mr, taskDebt) => {
    landed.push(task.id); succeeded.add(task.id)
    // #806: capture this task's TRUE immediate predecessor tip (the tracker's value BEFORE this task's
    // own update) — the successor's --mapped diff range starts there, even across a requiresTest:false skip.
    const predTip = lastLandedTip
    if (task.requiresTest === false) {
      log(`gate-audit: skipping ${task.id} (requiresTest:false — no mapped tests, HARD path vacuous)`)
    } else {
      mergedTasksForGateAudit.push({ taskId: task.id, gateOutput: mr.gate_output, acceptanceCriteria: task.planSlice,
        gateHeadSha: pinOrSentinel(mr.integration_sha), gateLogPath: mr.gate_log_path, preMergeTip: predTip,
        // mappedTests (D7, Task 3.2) + claimedEndStateIds (A1): both OPTIONAL, omitted when absent/empty
        // (fail-open — the seat prompt is byte-identical to today without them).
        ...(Array.isArray(mr.mappedTests) && mr.mappedTests.length ? { mappedTests: mr.mappedTests } : {}),
        ...(Array.isArray(task.claimedEndStateIds) && task.claimedEndStateIds.length ? { claimedEndStateIds: task.claimedEndStateIds } : {}),
        ...(Array.isArray(taskDebt) && taskDebt.length ? { baselineDebt: taskDebt } : {}) })
    }
    // Update the tracker AFTER capturing predTip, and ONLY on a real integration_sha (isSha === the
    // pinOrSentinel hex test); a sentinel leaves it at the last REAL sha. requiresTest:false tasks update
    // it too. The per-task landedShaByTask retention (Phase 5 Task 1) rides the same guard: it is
    // auditEvidenceOf's fallback so a merged requiresTest:false task (no gate-audit entry — the D7 skip
    // above) never renders 'unrecorded' as its filed follow-ups' pinned sha.
    if (isSha(mr.integration_sha)) { lastLandedTip = mr.integration_sha; landedShaByTask.set(task.id, mr.integration_sha) }
  }
  for (const r of results.filter(Boolean)) {
    // Carry the audit-loop round counter onto the task object so the no-test sub-loop continues the
    // SHARED budget (not a fresh counter — that would double the allowance). NEVER-LOWERING (PIN-13):
    // the wave thunk seeds fixRounds from the audit-loop round count; fixRounds counts blocking fix
    // rounds and floor retries only, and ace commits charge absorbRounds instead (PIN-7), so no ace
    // commit charges this counter and on every in-process path it already equals r.round here. The
    // Math.max is a resume-only defence: a resume can enter the merge queue with the wave never
    // having run in-process (r.task.fixRounds relaunch-seeded, r.round undefined), and the seed must
    // never lower that carried count. The assignment STAYS — on that resume r.round ?? 0 is the only
    // other defined seed there is.
    r.task.fixRounds = Math.max(Number.isInteger(r.task.fixRounds) ? r.task.fixRounds : 0, r.round ?? 0)
    // Classify-at-collection (ADR 0013): each Minor/Nit routes ONCE, by disposition. The approve arm's
    // routing now happens WAVE-SIDE inside aceStage, which stashes the once-minted rows on r.taskMinors;
    // the fallback re-mints only for a result that never reached the stage (env-blocked, an early
    // escalate), whose seats are empty anyway.
    const taskMinors = r.taskMinors ?? minorsOf(r.seats || []).map(f => ({ task: r.task.id, ...f }))
    // Ace-free audit-round provenance (#1913): r.preAceRounds freezes the audit-loop exit count ahead
    // of the merge-floor retry loop's own fixRounds increments, so the filed-issue "audit round" is the
    // count the seats saw; the ace ladder charges absorbRounds, never fixRounds (PIN-7).
    auditLog.push({ task: r.task.id, verdict: r.verdict, findings: (r.seats || []).flatMap(s => s.findings || []), blocked: r.blocked, requested: r.expected, returned: (r.seats || []).length, fixRounds: r.preAceRounds ?? r.task.fixRounds })
    done.add(r.task.id)
    if (r.verdict === 'approve') {
      const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
      const requiresTest = r.task.requiresTest !== false  // default true; false only when explicitly set
      // requiresPackaging (spec §4.2): gates the assert-packaging-in-diff.sh floor, INDEPENDENT of
      // requiresTest (like the submodule floor, decoupled from the test flag). Default true; false
      // only when explicitly set. A false skip is LOGGED, never silent (the requiresTest:false idiom).
      const requiresPackaging = r.task.requiresPackaging !== false
      if (!requiresPackaging) log(`packaging-floor: skipping ${r.task.id} (requiresPackaging:false — assert-packaging-in-diff.sh not run for this task)`)
      // TWO predicates on ONE field, deliberately (spec §4.B.2, #819). requiresPackaging (!== false)
      // decides whether the floor RUNS — fail-closed default true, so it runs for every task the Lead
      // did not exempt. advisePackagingVacuous (=== true) decides whether the run threads --advise-vacuous,
      // and fires ONLY on an EXPLICIT requiresPackaging:true declaration. Collapsing them into one
      // !== false predicate would thread the advisory onto every defaulted task in every non-docker repo —
      // re-noising the gate-audit evidence for exactly the tasks #819's anti-noise requirement leaves silent.
      const advisePackagingVacuous = r.task.requiresPackaging === true
      // For a submodule task: thread targetRepo (the submodule checkout) + targetBase so the refiner
      // runs the rebase/merge/gate cwd-scoped to the submodule repo (DP3 — no script change needed).
      const isSubmodTask = r.task.taskType === 'submodule'
      const submodMergeNote = isSubmodTask && r.task.targetRepo
        ? pt`\nSUBMODULE TASK: this merge-task operates INSIDE the submodule repo, not the superproject. `
          + pt`Submodule checkout (targetRepo): ${r.task.targetRepo}. Submodule base: ${r.task.targetBase || '<targetBase>'}. `
          + pt`Run rebase and gate cwd-scoped to ${r.task.targetRepo}; the _refinery merge fast-forwards the submodule integration branch.`
        : ''
      // D2 forward-revert: r.aceReverted is set ONLY for a FINAL failed ace tip no later dispatch
      // reverted in-loop (aceBisect reverts every non-final failed subset before the next commits), so
      // the merge dispatch PREPENDS one clause — in the TASK worktree, `git -C <worktree> revert
      // --no-edit <sha>` BEFORE the rebase. Emitted ONLY when r.aceReverted is a non-empty string
      // (belt-and-suspenders, never unconditional). This CANNOT introduce a new escalate: the reverted
      // sha is the task-branch TIP at revert time, so its revert is the clean inverse of HEAD and cannot
      // conflict; the tree returns to the last approved state (the original tip, or the last approved
      // subset tip) and the rebase+gate+merge behaves as it would have on that state. The HEAD guard
      // keeps the clause idempotent across dispatch replays — no sha is ever reverted twice. Ace never
      // turns a mergeable task into a hold.
      const aceRevertClause = (typeof r.aceReverted === 'string' && r.aceReverted)
        ? pt`FORWARD-REVERT (--ace regression): the final ace commit regressed on re-audit. ONLY if \`git -C ${r.task.worktree} rev-parse HEAD\` is still ${r.aceReverted} (moved HEAD = already reverted; SKIP — a sha is never reverted twice), in the TASK worktree run `
          + pt`\`git -C ${r.task.worktree} revert --no-edit ${r.aceReverted}\` (forward-only, classifier-safe — it is the clean inverse of the task-branch tip, cannot conflict) `
          + pt`BEFORE the rebase step (a), so the merge runs on the reverted-to-approved tip. Do NOT reset --hard. The approved work still lands.\n`
        : ''
      // ---- PIN TRANSFER AT THE MERGE SLOT (#1913, D2 / PIN-1 / PIN-7 / PIN-14 / PIN-16) ----
      // The panel approved a tip; the merge slot needs the same content, not the same sha. One refiner
      // probe does the conflict-free rebase and then compares `git patch-id --stable` of the TASK'S OWN
      // diff — dispatchBase→tip before the rebase, integration-tip→tip after. Equal patch-ids mean the
      // rebase carried the approved content unchanged, so the audit pin TRANSFERS to the rebased tip and
      // no panel re-convenes. Unequal means the rebase changed this task's own diff, so that ONE task
      // falls back to the in-lock full-panel re-audit — today's behaviour, byte for byte (PIN-1).
      // The PIN-16 already_upstream arm runs FIRST, on PRE-rebase legs, and an empty pre-rebase patch-id
      // fails closed to a hard escalation: `git patch-id --stable` prints nothing on an empty diff, so
      // empty-equals-empty must never read as a transfer. Its own schema, never a MERGE_RESULT status
      // member, so no hard escalation can be downgraded by an in-band field (PIN-6).
      const pinProbe = await dispatch(
        pt`PIN TRANSFER probe for WAR task ${r.task.id} (branch ${r.task.branch}) against ${ph.integrationBranch}. Rebase and measure only — do NOT merge, do NOT push the integration branch, do NOT run the gate or any floor.\n`
        + aceRevertClause
        + pt`  (1) BEFORE the rebase, all in the TASK worktree ${r.task.worktree} (git -C ${r.task.worktree}): BASE=merge-base ${ph.integrationBranch} ${r.task.branch}; N=rev-list --count $BASE..${r.task.branch} (the task's own commit count); PRE=diff $BASE..${r.task.branch} piped to git patch-id --stable, first field (an EMPTY diff prints NOTHING, so PRE is then empty); CHERRY=cherry ${ph.integrationBranch} ${r.task.branch} (leading - = a task commit already upstream by patch, + = unmatched; git cherry names TASK commits, never upstream equivalents).\n`
        + pt`  (2) REBASE in the TASK worktree: git -C ${r.task.worktree} rebase ${ph.integrationBranch}. The task branch is checked out there, so the rebase cannot run in _refinery. On CONFLICT: abort it and return { status: 'conflict', conflict_files: [...] } — never force, never resolve.\n`
        + pt`  (3) TIP=rev-parse ${ph.integrationBranch} (the integration tip the rebase landed on); POST=diff $TIP..${r.task.branch} piped to git patch-id --stable, first field (empty on an empty diff).\n`
        + pt`  (4) ARM ORDER — already_upstream FIRST. Post-rebase diff EMPTY and N > 0 and EVERY CHERRY line starting '-' and PRE non-empty: return { status: 'already_upstream', rebased_tip: $TIP, pre_rebase_patch_id: $PRE, post_rebase_patch_id: $POST, already_upstream_commits: [the task commit SHAs CHERRY listed] } — the content is already on the integration branch, nothing to merge.\n`
        + pt`  (5) Post-rebase diff EMPTY AND (N is 0, OR any CHERRY line starts '+', OR PRE is EMPTY) — the empty post-rebase diff is the shared precondition for all three legs, so this is never an unscoped 3-way OR: return { status: 'empty-unmatched', detail: '<which leg failed>' } — fail closed; never already_upstream, never a transfer.\n`
        + pt`  (6) Otherwise compare patch-ids, returning rebased_tip: $TIP, pre_rebase_patch_id: $PRE, post_rebase_patch_id: $POST either way: PRE non-empty and PRE == POST → status 'transferred' (the rebase carried this task's own diff unchanged, so the audit pin transfers); PRE != POST → status 'mismatch' (the full panel re-audits the rebased tip before the merge).\n`
        + pt`  (7) Any git/env error you cannot classify → { status: 'error', detail: '<the error>' }; the ordinary merge dispatch then runs unchanged.`,
        { agentType: NS + 'war-refiner', phase: 'Refine', dispatchKind: 'pin-transfer',
          label: 'pin-transfer:' + r.task.id, schema: PIN_TRANSFER, ...spawn('refiner') })   // concatenation-built (census-safe)
      const probeStatus = (pinProbe && typeof pinProbe.status === 'string') ? pinProbe.status : 'error'
      // PIN-10 destination convention, mirroring aceSeatRows: a row's `sha` is the sha the approval is
      // now accounted AT — the probe's rebased integration tip, in EVERY mode. It is never the seat's
      // pre-rebase audit_sha; that origin rides `approvedAt` on a transferred row, exactly as
      // aceSeatRows keeps `transferredFrom` there. A re-ran row carries no `approvedAt`: it was
      // re-audited at that same rebased tip, so it has no earlier origin to preserve.
      // `seatsSrc` lets the 'mismatch' arm pass the FRESHLY-returned rbSeats; every other arm falls
      // back to the pre-rebase panel in r.seats, whose approvals are the ones transferring.
      const probeRow = (mode, seatsSrc) => ({ task: r.task.id, kind: 'merge', mode,
        reauditedTip: r.aceSha || (r.seats || []).map(s => s.audit_sha).find(isSha) || null,
        rebasedTip: pinProbe && pinProbe.rebased_tip || null,
        prePatchId: pinProbe && pinProbe.pre_rebase_patch_id || null,
        postPatchId: pinProbe && pinProbe.post_rebase_patch_id || null,
        seats: (seatsSrc || r.seats || []).map(s => mode === 'mismatch'
          ? ({ seat: s.seat, lens: s.lens, outcome: 're-ran', sha: (pinProbe && pinProbe.rebased_tip) || null })
          : ({ seat: s.seat, lens: s.lens, outcome: 'transferred', sha: (pinProbe && pinProbe.rebased_tip) || null, approvedAt: auditShaOrSentinel(s.audit_sha) })) })
      if (probeStatus === 'conflict') {
        escalated.push({ task: r.task.id, reason: 'conflict', detail: { note: 'the pin-transfer rebase conflicted — the task branch cannot replay onto the integration tip', conflict_files: (pinProbe && pinProbe.conflict_files) || [] } })
        auditLog.push({ task: r.task.id, verdict: 'conflict', findings: [], fixRounds: r.task.fixRounds })
        continue
      }
      if (probeStatus === 'empty-unmatched') {
        // #1895 fail-closed: an empty post-rebase diff with zero task commits, unmatched patches, or an
        // empty pre-rebase patch-id is NEVER recorded merged — a never-started branch is vacuously an
        // ancestor, and recording it merged is the silent-success failure mode this arm exists to refuse.
        escalated.push({ task: r.task.id, reason: 'escalate', detail: { note: 'pin transfer refused: the post-rebase task diff is empty but the already_upstream legs did not all hold (zero task commits, an unmatched patch, or an empty pre-rebase patch-id)', probe: pinProbe } })
        auditLog.push({ task: r.task.id, verdict: 'pin-transfer:empty-unmatched', findings: [], fixRounds: r.task.fixRounds })
        continue
      }
      if (probeStatus === 'already_upstream') {
        const commits = Array.isArray(pinProbe.already_upstream_commits) ? pinProbe.already_upstream_commits : []
        pinTransfers.push({ ...probeRow('already_upstream'), alreadyUpstreamCommits: commits })
        log('pin-transfer ' + r.task.id + ': already_upstream — every task commit cherry-matched upstream (' + (commits.join(', ') || 'commits unrecorded') + '); recorded merged at the integration tip ' + (pinProbe.rebased_tip || '(unrecorded)') + ' with no panel and no content merge (PIN-16).')
        landMerged(r.task, { mode: 'merge-task', status: 'merged', integration_sha: pinProbe.rebased_tip })
        continue
      }
      if (probeStatus === 'mismatch') {
        // PIN-1 degrade-to-today: the rebase changed this task's own diff, so the pin cannot transfer.
        // The FULL panel re-audits the rebased tip IN the lock, exactly as the pre-#1913 engine did.
        log('pin-transfer ' + r.task.id + ': patch-id MISMATCH (' + (pinProbe.pre_rebase_patch_id || '(empty)') + ' → ' + (pinProbe.post_rebase_patch_id || '(empty)') + ') — the full panel re-audits the rebased tip ' + (pinProbe.rebased_tip || '(unrecorded)') + ' in the lock before the merge (PIN-1).')
        const { seats: rbSeats, expected: rbExpected } = await auditRound(r.task, null, null, pinProbe.rebased_tip)
        pinTransfers.push(probeRow('mismatch', rbSeats))
        // Route this re-audit's OWN Minor/Nits by disposition, on BOTH exit paths (#1931), exactly
        // as the six wave-side ace re-audit sites do — an ask parks, a follow-up files, a note
        // records, an absorb routes. Placed before the approve/escalate branch so no exit path
        // drops a finding. noReentry: the merge queue is past the wave side, so aceReentry can
        // never drain r.reentryQueue again; an absorb-eligible finding takes the phase-close sweep
        // instead. Blocking findings stay untouched — the escalate arm below owns them.
        routeReauditMinors(r, rbSeats, { noReentry: 'merge-slot pin-transfer mismatch re-audit — the wave side is over, so re-entry can never dispatch; the sweep is the vehicle' })
        if (allApprove(rbSeats, rbExpected) && blockingOf(rbSeats).length === 0) {
          r.seats = rbSeats
        } else {
          escalated.push({ task: r.task.id, reason: 'escalate', detail: { note: 'the in-lock full-panel re-audit of the rebased tip did not re-approve after a pin-transfer patch-id mismatch', rebased_tip: pinProbe.rebased_tip } })
          auditLog.push({ task: r.task.id, verdict: 'pin-transfer:re-audit-failed', findings: (rbSeats || []).flatMap(s => s.findings || []), fixRounds: r.task.fixRounds })
          continue
        }
      } else if (probeStatus === 'transferred') {
        pinTransfers.push(probeRow('transferred'))
        log('pin-transfer ' + r.task.id + ': patch-ids EQUAL (' + (pinProbe.pre_rebase_patch_id || '(unrecorded)') + ') — the panel pin transfers to the rebased tip ' + (pinProbe.rebased_tip || '(unrecorded)') + '; no panel re-convenes in the lock.')
      } else {
        log('pin-transfer ' + r.task.id + ': probe returned no usable status — the ordinary merge dispatch runs unchanged (fail-open).')
      }
      const mr = routedMr(await dispatch(
        pt`Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
        + aceRevertClause
        + reattachClause(refineryPath)
        + pt`IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
        + pt`  (a) REBASE in the TASK worktree — skip ONLY per your card step 1 merge-base test, no other signal (#1941): git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
        + pt`CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
        + pt`rebase --onto does NOT dodge this constraint — it is equally refused.\n`
        + pt`  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
        + pt`Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
        + classificationClause(refineryPath, pt`the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
        + baselineDebtClause()
        + gateCaptureClause(refineryPath, r.task.id)
        + pt`Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip.`
        + pt` Before the _refinery merge step (b), run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (REGARDLESS of requiresTest — a submodule touch is refused whether or not the task needs a test; the relax-flag is only threaded for a declared gitlink-bump task). Exit 1 → return { mode: 'merge-task', status: 'submodule-blocked' } — do NOT merge. Exit 2 → return { mode: 'merge-task', status: 'error' }.`
        + pt` Also before step (b), run assert-budget-raise-cited.sh ${ph.integrationBranch} ${r.task.branch} (ALWAYS — it exits 0 on its own when the diff touches no prompt-surface budget ceiling). Exit 1 (a hard:/advisory: ceiling raise in prompt-surface-budgets.test.mjs with no Budget-Raise trailer on any commit in the range) → return { mode: 'merge-task', status: 'no-test', floor_route: 'budget-uncited' } — the in-band budget-uncited route (the status enum is never widened) — do NOT merge; the required commit trailer form is \`Budget-Raise: ADR-0042 <surface> +<bytes>\`, and a legitimate ceiling change routes through the operator re-baseline pass (skills/war/references/budget-rebaseline.md) — a worker instead funds growth UNDER the ceiling. Exit 2 (a git/ref error) → return { mode: 'merge-task', status: 'error' }, never the budget-uncited route — the exit-1-vs-2 split mirrors the test floor.`
        + (requiresTest
          ? pt` Also before step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop. On that exit 1 path ONLY, ALSO capture the script's stderr VERBATIM (the near-miss diagnostic) into floor_diagnostic alongside status:'no-test' — never edited, never summarised; empty/absent stderr ⇒ omit floor_diagnostic. It is fail-open advisory context, never a routing input. On exit 0, capture the script's stdout — ALL matched test paths, one per line — into mappedTests (an array of those paths) on the returned MergeResult; the gate-audit pass greps them against the captured gate log (D7).`
          : pt` requiresTest:false — skip the assert-test-in-diff.sh check and proceed directly to the rebase+merge.`)
        + (requiresPackaging
          ? pt` Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${advisePackagingVacuous ? ' --advise-vacuous' : ''} to verify the task diff adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' } — do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.${advisePackagingVacuous ? ' The --advise-vacuous flag may print one informational advisory line on stderr when the packaging run is structurally vacuous under the ADR-0017-ratified scope — exit 0 still means PROCEED; never treat the advisory as an error or report it as a finding.' : ''}`
          : pt` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
        + doneWhenFloorClause(r.task, refineryPath)
        + submodMergeNote,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}`, schema: MERGE_RESULT, ...spawn('refiner') }))

      // submodule-blocked: immediate hard escalate, 0 fix rounds (refuse-all, like env-blocked).
      // ponytail: reuses existing 'escalate' reason (DP3 — no new HARD_ESCALATION_REASONS member, no land-decision.mjs cascade)
      if (mr && mr.status === 'submodule-blocked') {
        escalated.push({ task: r.task.id, reason: 'escalate', detail: `${r.task.id} touches a submodule; undeclared submodule touches are refused at merge — declared submodule targets route through the submodule router (paired submodule + gitlink-bump tasks)` })
        auditLog.push({ task: r.task.id, verdict: 'submodule-blocked', findings: [], fixRounds: 0 })
        continue
      }

      // Combined floor-retry sub-loop: bounded fix-worker + full re-audit on ANY floor status
      // (no-test, unpackaged, done-unmet — or the budget-uncited route, which rides status:'no-test'
      // as the in-band floor_route marker). NOT a blind copy of the old no-test-only loop — a retry
      // merge here hard-escalated any unexpected status verbatim, so a task tripping SEVERAL floors
      // (adds a source file with no test AND no COPY) would clear one and hard-escalate on the other,
      // never getting its bounded fix (spec §4.2). One loop, all floors, shared budget, until all pass
      // or exhaust. done-unmet (precision-chain D1, Task 2.3) routes the make-this-command-pass fix —
      // the no-test pattern; exhaustion escalates reason 'done-unmet' via the generic tail below.
      // Every dispatched retry-merge re-instructs ALL floor invocations (test + packaging + submodule
      // + budget-raise + done-when), keeping the dispatched prompts in sync with the standing war-refiner.md steps.
      // ponytail: requiresTest:false / requiresPackaging:false / doneWhen-less tasks never enter (that floor's status is never returned);
      // a diff touching no prompt-surface budget ceiling never returns the budget-uncited route either.
      // 'budget-uncited' here is the routedMr-NORMALIZED internal status (wire: status:'no-test' +
      // floor_route:'budget-uncited' — no MERGE_RESULT enum widening), so the budget route shares this
      // sub-loop exactly like the sibling floors.
      const FLOOR_STATUSES = ['no-test', 'unpackaged', 'done-unmet', 'budget-uncited']
      if (mr && FLOOR_STATUSES.includes(mr.status)) {
        let floorMr = mr
        let reAuditFailed = false
        while (floorMr && FLOOR_STATUSES.includes(floorMr.status) && r.task.fixRounds < roundLimit) {
          // Dispatch a fix-worker keyed to the CURRENT tripped floor, in the SAME worktree.
          const isNoTest = floorMr.status === 'no-test'
          const isDoneUnmet = floorMr.status === 'done-unmet'
          // budget-uncited: the routedMr-normalized internal status for the Budget-Raise floor's exit-1
          // route (wire: status:'no-test' + floor_route marker — no enum widening).
          const isBudgetUncited = floorMr.status === 'budget-uncited'
          // Near-miss diagnostic (D6): present ⇒ one appended pt-tagged paragraph quoting it VERBATIM;
          // absent ⇒ '' so the ADD_TEST prompt is byte-identical to a diagnostic-less run (set-minus).
          const nearMissDiag = floorDiagOf(floorMr)
          const nearMissClause = nearMissDiag
            ? pt`\nNEAR-MISS DIAGNOSTIC (verbatim stderr from the exit 1 assert-test-in-diff.sh run):\n${nearMissDiag}\nReconcile the diff's test files against the ACTIVE pattern named above BEFORE adding anything — the mapped test may already exist under a path that pattern does not match. When it does, a second test is the wrong fix: report blocked naming the mismatch rather than adding a duplicate test.`
            : ''
          // Done-when evidence (done-when-floor-wiring D5): present ⇒ ONE appended sentence naming the
          // captured artifact PATH (never the content — bounded prompt size; the fix-worker reads the
          // file); absent ⇒ '' so the MAKE_DONE_PASS prompt is byte-identical to an artifact-less run
          // (set-minus purity — the doneWhenLogOf normalizer conditions on nothing else).
          const doneWhenLog = doneWhenLogOf(floorMr)
          const doneWhenLogClause = doneWhenLog
            ? pt`\nThe red run's full output is captured at ${doneWhenLog}; read it before re-running.`
            : ''
          // Prompt truth (D6): all floor-fix prompts carry the gate command + the task's Done when:
          // clause (absent ⇒ '' — legacy byte-identity, End state 9).
          const fixPrompt = isNoTest
            ? pt`ADD_TEST for WAR task ${r.task.id}. The refiner's merge-task check (assert-test-in-diff.sh) found no test file in the diff. `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
              + pt`Add a mapped test for this task (the test must exercise the slice described in: ${r.task.planSlice ?? '<unset>'}), keep the gate green, commit and push.`
              + nearMissClause
            : isDoneUnmet
            ? pt`MAKE_DONE_PASS for WAR task ${r.task.id}. The refiner's merge-task check (assert-done-when.sh) ran the task's own Done when: acceptance command and it exited red (or timed out). `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
              + pt`Make this command pass: fix the implementation for the slice described in: ${r.task.planSlice ?? '<unset>'} until the Done when: command above exits 0 — never weaken, skip, or delete a test to force it green. Keep the gate green, commit and push.`
              + doneWhenLogClause
            : isBudgetUncited
            ? pt`CITE_BUDGET for WAR task ${r.task.id}. The refiner's merge-task check (assert-budget-raise-cited.sh) found a hard:/advisory: ceiling RAISE in skills/war/assets/prompt-surface-budgets.test.mjs with no Budget-Raise trailer in the range (the budget-uncited route). `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
              + pt`Resolve it for the slice described in: ${r.task.planSlice ?? '<unset>'}. PREFER un-raising the ceiling and funding the growth under it (ADR 0042 — evict cold prose to references/ behind a trigger pointer); a ceiling change is an operator act via the re-baseline pass (skills/war/references/budget-rebaseline.md), and a sanctioned raise must carry a commit trailer of the exact form \`Budget-Raise: ADR-0042 <surface> +<bytes>\` — never raise a ceiling silently. Commit and push, keeping the gate green.`
            : pt`PACKAGE_IT for WAR task ${r.task.id}. The refiner's merge-task check (assert-packaging-in-diff.sh) flagged an added/renamed file a Dockerfile's enumerated COPYs miss. `
              + pt`Work in the ALREADY-PROVISIONED worktree at ${r.task.worktree} (branch ${r.task.branch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
              + pt`Gate: ${plan.gate}${doneWhenClause(r.task)}\n`
              + pt`Resolve it for the slice described in: ${r.task.planSlice ?? '<unset>'}. add the COPY or dockerignore it — never delete the file to satisfy the floor. Keep the gate green, commit and push.`
          const floorFix = await dispatch(
            fixPrompt + workerMemClause(r.task.id) + provisionClause,
            // #817: spawnWorker('fix') makes the add-test/package-it/make-pass floor retry tier-aware, uniform with
            // the fix:/ace: fix-follow-up classes (absent agents.worker.fix ⇒ inherit-base — byte-identical).
            { agentType: NS + 'war-worker', phase: 'Audit', label: `${isNoTest ? 'add-test' : isDoneUnmet ? 'make-pass' : isBudgetUncited ? 'cite-budget' : 'package-it'}:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawnWorker('fix') })
          // Floor-specific verdict tokens: no-test keeps its historical strings (regression guard #268);
          // unpackaged/done-unmet/budget-uncited use the parallel forms — the budget-uncited ROUTE name
          // (not the wire status) prefixes its tokens, so the audit log names the real tripped floor.
          const blockedVerdict = isNoTest ? 'no-test:add-test-blocked' : isDoneUnmet ? 'done-unmet:make-pass-blocked' : isBudgetUncited ? 'budget-uncited:cite-budget-blocked' : 'unpackaged:package-it-blocked'
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

          // Re-attempt the serial merge — re-instructs ALL floor invocations (test + packaging + submodule + budget-raise + done-when).
          floorMr = routedMr(await dispatch(
            pt`Merge WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + pt`IMPORTANT — merge-task is split across two worktrees (spec §5.2, red-team-verified):\n`
            + pt`  (a) REBASE in the TASK worktree — skip ONLY per your card step 1 merge-base test, no other signal (#1941): git -C ${r.task.worktree} rebase ${ph.integrationBranch}. `
            + pt`CRITICAL: cannot rebase in ${refineryPath} — the task branch is checked out in ${r.task.worktree} and git rebase is refused on a branch checked out in another worktree. `
            + pt`rebase --onto does NOT dodge this constraint — it is equally refused.\n`
            + pt`  (b) MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), then git merge ${r.task.branch} (fast-forward merge of the now-rebased task branch into the integration branch). Push.\n`
            + pt`Run the gate (${plan.gate}) after the rebase in the task worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the task worktree. On gate failure return gate_failed; on conflict return conflict; never force. `
            + gateCaptureClause(refineryPath, r.task.id)
            + pt`Also populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip. `
            + classificationClause(refineryPath, pt`the phase integration base — the cut point of ${ph.integrationBranch}, i.e. \`git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch}\``)
            + baselineDebtClause()
            + pt`Before the _refinery merge step (b), re-run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} — the floor fix-worker pushed new commits, so the check runs afresh REGARDLESS of requiresTest (the relax-flag is only threaded for a declared gitlink-bump task). Exit 1 → return { mode: 'merge-task', status: 'submodule-blocked' }, do NOT merge; exit 2 → return { mode: 'merge-task', status: 'error' }. `
            + pt`Also before step (b), re-run assert-budget-raise-cited.sh ${ph.integrationBranch} ${r.task.branch} (ALWAYS — a fresh Budget-Raise trailer or an un-raised ceiling on the new commits now counts). Exit 1 → return { mode: 'merge-task', status: 'no-test', floor_route: 'budget-uncited' } — the in-band budget-uncited route; do NOT merge; the trailer form is \`Budget-Raise: ADR-0042 <surface> +<bytes>\` (operator re-baseline pass: skills/war/references/budget-rebaseline.md). Exit 2 → return { mode: 'merge-task', status: 'error' }, never the budget-uncited route. `
            + (requiresTest
              ? pt`Before the _refinery merge step (b), run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} to verify the task diff now contains at least one test file. Branch on the exit code: exit 1 (no test in the diff) → return { mode: 'merge-task', status: 'no-test' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'no-test' — a transient bad-ref must not spin a pointless add-test loop. On that exit 1 path ONLY, ALSO capture the script's stderr VERBATIM (the near-miss diagnostic) into floor_diagnostic alongside status:'no-test' — never edited, never summarised; empty/absent stderr ⇒ omit floor_diagnostic. It is fail-open advisory context, never a routing input. On exit 0, capture the script's stdout — ALL matched test paths, one per line — into mappedTests (an array of those paths) on the returned MergeResult; the gate-audit pass greps them against the captured gate log (D7). `
              : pt`requiresTest:false — skip the assert-test-in-diff.sh check. `)
            + (requiresPackaging
              ? pt`Also before step (b), run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${advisePackagingVacuous ? ' --advise-vacuous' : ''} to verify the task diff now adds no file a Dockerfile's enumerated COPYs miss. Branch on the exit code: exit 1 (a flagged file → Dockerfile pair) → return { mode: 'merge-task', status: 'unpackaged' }, do NOT merge; exit 2 (a git/ref error — bad ref, fatal git failure) → return { mode: 'merge-task', status: 'error' }, never 'unpackaged' — a transient bad-ref must not spin a pointless package-it loop.${advisePackagingVacuous ? ' The --advise-vacuous flag may print one informational advisory line on stderr when the packaging run is structurally vacuous under the ADR-0017-ratified scope — exit 0 still means PROCEED; never treat the advisory as an error or report it as a finding.' : ''}`
              : pt`requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
            + doneWhenFloorClause(r.task, refineryPath)
            + submodMergeNote,
            { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}:floor-retry:r${r.task.fixRounds}`, schema: MERGE_RESULT, ...spawn('refiner') }))
        }

        if (!reAuditFailed && floorMr && FLOOR_STATUSES.includes(floorMr.status)) {
          // Budget exhausted — hard escalation with reason = whichever floor is still tripping (all
          // HARD: no-test/unpackaged/done-unmet are HARD_ESCALATION_REASONS members; the routed
          // budget-uncited status maps to the existing hard reason 'escalate' below, never a new member).
          // The LAST result's near-miss diagnostic rides both entries as `detail` when present (a
          // string-valued detail is legal — this key is already shape-heterogeneous per route: the
          // merge-failure route below pushes the whole MergeResult object). Absent ⇒ no `detail` key at
          // all, so both entries are shape-identical to a diagnostic-less run. The LAST result's
          // done_when_log_path rides both entries the same way (the exhaustedDiag pattern —
          // done-when-floor-wiring D6): present ⇒ a done_when_log_path key, absent ⇒ none.
          const exhaustedDiag = floorDiagOf(floorMr)
          const exhaustedDoneWhenLog = doneWhenLogOf(floorMr)
          // budget-uncited exhaustion: 'budget-uncited' is a Workflow-internal routed status, NOT a
          // HARD_ESCALATION_REASONS member (no enum widening) — it escalates via the existing hard
          // reason 'escalate' (the submodule-blocked DP3 precedent) with the route named in detail,
          // so an uncited ceiling raise can never soft-land a phase minus the task.
          const isBudgetExhaustion = floorMr.status === 'budget-uncited'
          const exhaustedBudgetDetail = !exhaustedDiag && isBudgetExhaustion
            ? { detail: 'budget-uncited: a prompt-surface budget ceiling raise still lacks its Budget-Raise trailer after ' + r.task.fixRounds + ' fix round(s)' } : {}
          escalated.push({ task: r.task.id, reason: isBudgetExhaustion ? 'escalate' : floorMr.status, fixRounds: r.task.fixRounds, ...(exhaustedDiag ? { detail: exhaustedDiag } : exhaustedBudgetDetail), ...(exhaustedDoneWhenLog ? { done_when_log_path: exhaustedDoneWhenLog } : {}) })
          auditLog.push({ task: r.task.id, verdict: `${floorMr.status}:exhausted`, fixRounds: r.task.fixRounds, findings: [], ...(exhaustedDiag ? { detail: exhaustedDiag } : exhaustedBudgetDetail), ...(exhaustedDoneWhenLog ? { done_when_log_path: exhaustedDoneWhenLog } : {}) })
          continue
        }

        // Null-deref guard: both reAuditFailed=true sites set floorMr=null; skip before the unconditional floorMr.status deref below.
        if (reAuditFailed) continue

        // Use the successful re-merge result for the landed path below (D7 guard rides landMerged: a
        // requiresTest:false task cannot reach this sub-loop via the test floor, but the skip is logged
        // there for prompt-contract reachability).
        if (floorMr.status === 'merged') {
          landMerged(r.task, floorMr)
        }
        // A submodule mutation surfaced by the floor-retry re-merge's submodule floor is HARD (mirror the
        // primary submodule-blocked path — a soft escalation must never let a submodule touch ride a land).
        // Explicit arm, NOT the generic fallback below: 'submodule-blocked' is not in HARD_ESCALATION_REASONS,
        // so `reason: floorMr.status` would route it SOFT and the phase would land minus the task, silently.
        else if (floorMr.status === 'submodule-blocked') {
          escalated.push({ task: r.task.id, reason: 'escalate', detail: `${r.task.id} touches a submodule (surfaced on the floor-retry re-merge)` })
          auditLog.push({ task: r.task.id, verdict: 'submodule-blocked', findings: [], fixRounds: r.task.fixRounds })
        }
        else {
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
        // (land-decision.mjs untouched, ADR 0005). There is NO audit-stage fix-worker loop at this site:
        // recovery is a bounded REFINER re-dispatch per class ('environment' → one environment-proceed,
        // 'baseline' → one baseline-proceed), never a fix round. Merge-time gate_failed stays a SOFT
        // escalation for 'introduced'/absent; only environment-proceed EXHAUSTION is HARD.
        const cls = classOf(mr)
        if (cls === 'environment') {
          // 'environment': BOUNDED retry, not an immediate escalation. The refiner already proved the
          // failure does NOT reproduce in a fresh env, so dispatch EXACTLY ONE environment-proceed
          // re-merge whose gate must go FULLY GREEN in a fresh .war-task-free TMPDIR + fresh shell —
          // nothing is waived (no proceed-over, no debt, no source:'auto' backstop). Exhaustion (a 2nd
          // 'environment' classification) is HARD via the existing reason 'escalate': an approved task
          // must never be silently dropped from a landed phase by a transient. Bounded at ONE — no
          // chaining (a 2nd result classified 'baseline' routes as 'introduced'), no enum change.
          const ep = await dispatch(
            pt`ENVIRONMENT-PROCEED re-merge for WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + pt`The prior merge-task gate failure was classified gate_failure_class:'environment' — a TRANSIENT environment failure, proven NOT to reproduce at the task tip in a fresh environment, NOT a defect introduced by this task. This is the bounded environment-proceed retry: exactly ONE re-run, and the gate must come back fully green — never a proceed-over.\n`
            + pt`  (a) REBASE in the TASK worktree — skip ONLY per your card step 1 merge-base test (#1941): git -C ${r.task.worktree} rebase ${ph.integrationBranch}.\n`
            + pt`  (b) Run the gate (${plan.gate}) in a FRESH shell with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)). The gate MUST GO FULLY GREEN: this is a clean re-run, NOT a proceed-over — nothing is waived, no failure is proceeded past, no debt is recorded. ANY remaining failure → return { mode: 'merge-task', status: 'gate_failed' } classifying it afresh in gate_failure_class, and do NOT merge.\n`
            + gateCaptureClause(refineryPath, r.task.id)
            + pt`  (c) On a fully green gate, MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), git merge ${r.task.branch}, push, return { mode: 'merge-task', status: 'merged', integration_sha: <tip> } — populate integration_sha with the rebased integration tip the gate ran against, so the gate-audit pass can confirm the gate ran at the integration tip.`
            + pt` Before the merge, run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (exit 1 → submodule-blocked; exit 2 → error).`
            // ponytail: routedMr is deliberately NOT applied to ep — the un-normalized 'no-test' IS a
            // HARD_ESCALATION_REASONS member here, while the normalized 'budget-uncited' is not;
            // normalizing would flip this hold from HARD to SOFT (the submodule-blocked explicit-arm
            // precedent above).
            + pt` Also run assert-budget-raise-cited.sh ${ph.integrationBranch} ${r.task.branch} (ALWAYS; exit 1 → return { mode: 'merge-task', status: 'no-test', floor_route: 'budget-uncited' } — the in-band budget-uncited route, trailer form \`Budget-Raise: ADR-0042 <surface> +<bytes>\`; exit 2 → status: 'error', never the budget-uncited route).`
            + (requiresTest
              ? pt` Also run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} (exit 1 → no-test; exit 2 → error; exit 0 → capture the script's stdout — ALL matched test paths, one per line — into mappedTests on the returned MergeResult). On that exit 1 path ONLY, ALSO capture the script's stderr VERBATIM (the near-miss diagnostic) into floor_diagnostic alongside status:'no-test' — never edited, never summarised; empty/absent stderr ⇒ omit floor_diagnostic. It is fail-open advisory context, never a routing input.`
              : pt` requiresTest:false — skip the assert-test-in-diff.sh check.`)
            + (requiresPackaging
              ? pt` Also run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${advisePackagingVacuous ? ' --advise-vacuous' : ''} (exit 1 → unpackaged; exit 2 → error).${advisePackagingVacuous ? ' The --advise-vacuous flag may print one informational advisory line on stderr (structurally-vacuous packaging run under the ADR-0017-ratified scope) — exit 0 still means PROCEED, never a finding.' : ''}`
              : pt` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
            + doneWhenFloorClause(r.task, refineryPath)
            + submodMergeNote,
            { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:${r.task.id}:environment-proceed`, schema: MERGE_RESULT, ...spawn('refiner') })
          if (ep && ep.status === 'merged') landMerged(r.task, ep)
          else if (ep && ep.status === 'gate_failed' && classOf(ep) === 'environment') escalated.push({ task: r.task.id, reason: 'escalate', detail: { note: 'environment-class gate failure persisted through the bounded environment-proceed re-merge — approved task unmerged; the phase must not complete without it', result: ep } })
          else if (ep && ep.status === 'gate_failed') escalated.push({ task: r.task.id, reason: ep.status, detail: ep })   // introduced OR baseline→introduced (bounded)
          // A submodule mutation surfaced by the environment-proceed floor is HARD (mirror the primary
          // submodule-blocked path — a soft escalation must never let a submodule touch ride a land).
          else if (ep && ep.status === 'submodule-blocked') escalated.push({ task: r.task.id, reason: 'escalate', detail: `${r.task.id} touches a submodule (surfaced on the environment-proceed re-merge)` })
          else escalated.push({ task: r.task.id, reason: ep ? ep.status : 'merge_failed', detail: ep })
        } else if (cls === 'baseline') {
          // 'baseline': record the debt (deduped) + ONE source:'auto' backstop, then dispatch ONE
          // baseline-proceed re-merge naming the classified ids. Route its result normally; a 2nd
          // gate_failed routes by class with 'baseline' treated as 'introduced' (bounded — no 2nd re-dispatch).
          recordBaselineDebt(mr.gate_failing_ids, mr.gate_base_sha)
          const bp = await dispatch(
            pt`BASELINE-PROCEED re-merge for WAR task ${r.task.id} (branch ${r.task.branch}) into ${ph.integrationBranch}. mode=merge-task.\n`
            + reattachClause(refineryPath)
            + pt`The prior merge-task gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the phase integration base, NOT introduced by this task: ${(mr.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
            + pt`  (a) REBASE in the TASK worktree — skip ONLY per your card step 1 merge-base test (#1941): git -C ${r.task.worktree} rebase ${ph.integrationBranch}.\n`
            + pt`  (b) Run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that pre-existing set is a real regression → return { mode: 'merge-task', status: 'gate_failed' } classifying the NEW failure, and do NOT merge.\n`
            + pt`  (c) If the ONLY failures are the pre-existing baseline set, MERGE in _refinery: cd ${refineryPath} (on ${ph.integrationBranch}), git merge ${r.task.branch}, push, return { mode: 'merge-task', status: 'merged', integration_sha: <tip> }.`
            + pt` Before the merge, run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${r.task.branch}${r.task.taskType === 'gitlink-bump' && r.task.declared ? ' --declared' : ''} (exit 1 → submodule-blocked; exit 2 → error).`
            // ponytail: routedMr is deliberately NOT applied to bp — the un-normalized 'no-test' IS a
            // HARD_ESCALATION_REASONS member here, while the normalized 'budget-uncited' is not;
            // normalizing would flip this hold from HARD to SOFT (the submodule-blocked explicit-arm
            // precedent above).
            + pt` Also run assert-budget-raise-cited.sh ${ph.integrationBranch} ${r.task.branch} (ALWAYS; exit 1 → return { mode: 'merge-task', status: 'no-test', floor_route: 'budget-uncited' } — the in-band budget-uncited route, trailer form \`Budget-Raise: ADR-0042 <surface> +<bytes>\`; exit 2 → status: 'error', never the budget-uncited route).`
            + (requiresTest
              ? pt` Also run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${testPatternArg} (exit 1 → no-test; exit 2 → error; exit 0 → capture the script's stdout — ALL matched test paths, one per line — into mappedTests on the returned MergeResult). On that exit 1 path ONLY, ALSO capture the script's stderr VERBATIM (the near-miss diagnostic) into floor_diagnostic alongside status:'no-test' — never edited, never summarised; empty/absent stderr ⇒ omit floor_diagnostic. It is fail-open advisory context, never a routing input.`
              : pt` requiresTest:false — skip the assert-test-in-diff.sh check.`)
            + (requiresPackaging
              ? pt` Also run assert-packaging-in-diff.sh ${ph.integrationBranch} ${r.task.branch}${advisePackagingVacuous ? ' --advise-vacuous' : ''} (exit 1 → unpackaged; exit 2 → error).${advisePackagingVacuous ? ' The --advise-vacuous flag may print one informational advisory line on stderr (structurally-vacuous packaging run under the ADR-0017-ratified scope) — exit 0 still means PROCEED, never a finding.' : ''}`
              : pt` requiresPackaging:false — skip the assert-packaging-in-diff.sh check.`)
            + doneWhenFloorClause(r.task, refineryPath)
            + submodMergeNote,
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
      // follow-up and are filed WITH the escalation — the old eager-push behavior, now stated. An
      // ask still parks (#1550): the question survives the escalation for the Checkpoint gate,
      // never filed unruled with it.
      if (taskMinors.length) log('intake floor not run on the escalation arm for task ' + r.task.id + ' — filed seat rows carry demote:floor-skipped (D4).')
      for (const f of taskMinors) {
        const d = dispositionOf(f, null)   // no floor on the escalation arm: nothing lands this phase for the task
        if (d === 'ask') parkAsk(f)                 // ask precedes the absorb chain (#1550, D7)
        else if (d === 'follow-up') { f.floorSkipped = true; minorsFiled.push(f) }   // no intake floor ran here: stamp the floor-skip so the filed row carries demote:floor-skipped (logged once above)
        else demote(f, 'follow-up', 'demote:task-unapproved — task never reached the approve branch (verdict: ' + r.verdict + ') — filed with the escalation')
      }
      if (r.verdict === 'env-blocked') {
        // Provision failure (Part B): the worker never ran and the worktree is kept. Surface the
        // env-blocked outcome for the Lead (0 FIX rounds; siblings proceed — SKILL.md). It is a SOFT
        // escalation: NOT in HARD_ESCALATION_REASONS, so the phase still lands whatever else passed.
        log(`Task ${r.task.id}: env-blocked — provision step "${r.envOutcome.failedCommand}" exited ${r.envOutcome.exitCode}. Worktree kept; worker not spawned.`)
        escalated.push({ task: r.task.id, reason: 'env-blocked', outcome: r.envOutcome })
      } else if (r.verdict === 'env-died') {
        // (#1411) Post-spawn infra death — SOFT (a SOFT_ENV_REASONS member, the env-blocked sibling):
        // siblings proceed and the phase lands minus this task; the escalation record carries the
        // harness cause for the Recovery-relaunch re-run. Never a hard escalation (ADR 0005's
        // infra-stays-soft precedent). Log is concatenation-built (census-safe).
        log('Task ' + r.task.id + ': env-died — ' + (r.blocked || 'post-spawn harness death') + '. Soft: siblings proceed; the phase lands minus this task; re-run it via the Recovery-relaunch runbook after the environment resets.')
        escalated.push({ task: r.task.id, reason: 'env-died', blocked: r.blocked })
      } else {
        // Wave-collector escalation (worker-authored blocked text: the initial worker's why or a
        // blocked audit-round fix-worker's reason). defectClassOf tags defectClass:'plan' iff the
        // blocked text is sentinel-prefixed; absent otherwise (§4.3, orthogonal to reason).
        escalated.push({ task: r.task.id, reason: r.verdict, blocked: r.blocked, ...defectClassOf(r.blocked) })
      }
    }
  }
  // ---- Held-absorb drain (D5): rows held on r.task.pendingAbsorbs never met a later approve ----
  // A task that ends escalated, audit-blocked, or never merged demotes its held rows with
  // demote:absorb-blocked (a DEMOTE_REASONS member); a task that merged with rows
  // still held (a seat approved beside its own blocking finding) sends them to the phase-close
  // sweep as absorbs — the merged tip is the sweep's base, so nothing is dropped. Logged.
  for (const r of results.filter(Boolean)) {
    const held = Array.isArray(r.task.pendingAbsorbs) ? r.task.pendingAbsorbs.splice(0) : []
    if (!held.length) continue
    if (succeeded.has(r.task.id)) {
      log('absorb-budget: task ' + r.task.id + ' merged with ' + held.length + ' held absorb(s) and no later approve — routing them to the phase-close sweep.')
      for (const f of held) routeToSweep(f, 'held absorb — the task merged before a later approve could ace it')
    } else {
      log('absorb-budget: task ' + r.task.id + ' never merged (verdict ' + r.verdict + ') — ' + held.length + ' held absorb(s) demote with demote:absorb-blocked.')
      for (const f of held) demote(f, 'follow-up', 'demote:absorb-blocked — held absorb on a task that never merged (verdict ' + r.verdict + '; open blocking findings held the ace batch and no later approve came)')
    }
  }
}

// ---- POST-MERGE GATE-AUDIT PASS (F04 R3) — parallel, AFTER serial merge queue, BEFORE Land decision ----
// A read-only war-auditor (lens: execution-evidence) reviews the executed gate output from each merged
// task to close the "auditor can't verify PASS" gap with real execution evidence (not just integrity-by-reading).
// Default outcome: SOFT note (does not hold the land). Hard only if a mapped test is provably unrun
// (present in diff but absent / 0-count in gate_output) — Open decision #1 (resolved: operationally defined).
// refineryPath (hoisted, Task 3.2): ONE shared _refinery path for the land barrier — the endstate-check
// dispatch, the shared endStateBlock's artifact/gate-log paths, and both gate-audit arms below reuse it
// (already checked out on ph.integrationBranch at the integration tip after the serial merge queue and
// before Land/teardown; the merge loop's own block-scoped refineryPath is out of scope here).
const refineryPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`
// phaseDiffFiles (in-band-absorb-default D15): the phase's git-derived changed-file Set from the
// evidence dispatch's phase_diff_files (`git diff --name-only <phaseBase>..<integrationTip>`), read
// by the gate-audit floor pass's note arm. null until the evidence dispatch stamps it; stays null on
// a failed/absent dispatch or the end-state-only arm (that note arm then skips with a log).
let phaseDiffFiles = null
// gateAuditRows (D15): the three gate-audit-family seats' Minor/Nit rows, seat-stamped, collected
// for the ONE task-less floor pass below (routeGateAuditRows) — the family's single producer.
const gateAuditRows = []

// ---- LAND-BARRIER ENDSTATE-CHECK DISPATCH (D2/F5, precision-chain Task 3.2) ----
// Runs ONCE per phase at the INTEGRATED TIP: after the serial merge queue's last merge, BEFORE any
// gate-audit seat spawns. UNCONDITIONAL on merge outcomes — it runs in the mergedTasksForGateAudit-empty
// arm too (a requiresTest:false-only phase still executes its claimed checks; the end-state-only seat
// consumes the artifacts). Refiner-executed (ADR 0002 — auditors are read-only: seats READ the teed
// artifacts, never run commands). Command hygiene per A3/D11: file-threaded (each check command is
// executed FROM its .cmd file, never interpolated into another script), a timeout, execution confined
// to the integrated-tip checkout; a red/hung check fails only its own artifact — never this dispatch,
// never the (already finished) merge queue. One artifact per claimed check:-tagged condition at
// <refineryPath>/.war/endstate-<phaseId>-<n>.log (n = the condition's 1-based claim number), each
// stamped with the tip SHA it ran at. FAIL-OPEN: a failed/absent dispatch and a missing, unreadable,
// or STALE artifact (stamped tip_sha mismatching the confirmed tip — prior-run .war/ residue a resume
// replay lands on) all mean the seats attest 'unverified' — never 'met', never a block. Skipped (no
// dispatch) when no claimed row carries a
// check command — a claims-less or judgment-only phase dispatches nothing (byte-compat, End state 9).
const endStateCheckRows = endStateRows
  .map((r, i) => ({ n: i + 1, check: r.check }))
  .filter(r => r.check)
if (endStateCheckRows.length > 0) {
  // Quoting-agnostic .cmd transport (A3, endstate-artifact-fidelity Task 4.1): each check literal is
  // threaded to the refiner inside a FENCED block whose fence length EXCEEDS the longest backtick run
  // inside the literal (min 3) — content backticks can never read as the fence, and the refiner COPIES
  // bytes between the fences instead of re-quoting (re-quoting was the 'bad substitution' bug: a
  // single-quoted ${...} plan literal re-emitted double-quoted dies in bash parameter expansion).
  // Intake lint (loud, never a silent half-run): a literal the fenced byte transport cannot carry
  // faithfully — empty/whitespace-only, or containing control bytes other than newline/tab (e.g. a
  // bare \r) — is marked unsupported AT DISPATCH: log()ged here, and its prompt row directs an
  // artifact recording the lint verdict INSTEAD of execution. Everything bash-runnable (compound,
  // pipeline, multi-command, multi-line) is supported: the .cmd file executes as a whole.
  // BACKTICK is built via charCode 96 — a raw backtick in a regex literal here desyncs the #931
  // census scanner and the budget suite's pinned extraction (neither models regex literals).
  const BACKTICK = String.fromCharCode(96)
  for (const r of endStateCheckRows) {
    let longestRun = 0
    for (let run = 0, i = 0; i < r.check.length; i++) {
      run = r.check[i] === BACKTICK ? run + 1 : 0
      if (run > longestRun) longestRun = run
    }
    r.fence = BACKTICK.repeat(Math.max(3, longestRun + 1))
    r.unsupported = !r.check.trim() ? 'empty/whitespace-only check literal'
      : /[\u0000-\u0008\u000B-\u001F\u007F]/.test(r.check) ? 'control bytes (other than newline/tab) in the check literal'
      : null
    if (r.unsupported) log(`endstate-check intake-lint: condition ${r.n}'s check literal is UNSUPPORTED by the .cmd transport (${r.unsupported}) — the row is dispatched as record-only: its artifact records the lint verdict, the command is never half-run.`)
  }
  // provision-before-checks (#1395 fix 2): the run.provision steps provisioned the TASK worktrees,
  // never _refinery — so a check needing that environment (installed deps, a built venv) reds
  // ENVIRONMENTALLY at the land barrier and the seats then read a MET condition as red. The
  // dispatched refiner applies the same pinned list in _refinery FIRST, fail-open: a red step is
  // recorded into each artifact's preamble and every check still runs — no new hold path. The steps
  // run in the SHARED _refinery worktree, so the clause carries a cleanliness contract (relaunch
  // fix): tracked files a step mutates are restored before any check runs — the land dispatch merges
  // and checks out in this same worktree, and the do-NOT-edit-tracked-files rule above must hold at
  // the end of provisioning too. Empty
  // provision list ⇒ '' (set-minus: the dispatched prompt is byte-identical to a provision-less run).
  const endstateProvisionClause = provisionList.length
    ? pt`provision-before-checks (#1395, fail-open): FIRST run the phase's provision steps IN ORDER inside ${refineryPath} (the same pinned list the task worktrees got; source: ${provisionSource}):\n`
      // pt-tagged prompt-feeding row builder: ${c ?? '<step>'} absence-tolerant (the provisionClause precedent).
      + provisionList.map((c, i) => pt`  ${i + 1}. ${c ?? '<step>'}`).join('\n') + pt`\n`
      + pt`A provision step exiting non-zero NEVER blocks: record it as a \`provision_red: <step> (exit <code>)\` line in each artifact's preamble (after the tip_sha line) and STILL run every check below — a provision failure never fails this dispatch and never holds the land.\n`
      + pt`Provision steps must leave the worktree CLEAN before any check runs: restore tracked files via \`git -C ${refineryPath} checkout -- .\` after any step that mutates them (untracked build output is fine) — the land dispatch merges and checks out in this SAME shared _refinery worktree, so the do-NOT-edit-tracked-files rule above holds at the end of provisioning too.\n`
    : ''
  log(`endstate-check: dispatching the land-barrier check — ${endStateCheckRows.length} claimed check:-tagged End-state condition(s) execute ONCE at the integrated tip, before any gate-audit seat spawns (D2/F5).`)
  await dispatch(
    pt`ENDSTATE-CHECK DISPATCH for WAR phase ${ph.id} (the land-barrier check; you are the refiner). `
    + pt`cwd = ${refineryPath} (the _refinery worktree, on ${ph.integrationBranch} at the FINAL integration tip after the serial merge queue). `
    + pt`Execute EVERY claimed check:-tagged End-state condition's command below ONCE at this tip. Do NOT merge, push, rebase, or edit tracked files — the gate-audit seats verify from the artifacts you tee (they are read-only and never run commands, ADR 0002).\n`
    + pt`First ensure .war/ is git-excluded inside _refinery — append the line \`.war/\` (once) to the path printed by \`git -C ${refineryPath} rev-parse --git-path info/exclude\`.\n`
    + endstateProvisionClause
    + pt`For EACH condition row below, its check literal rides in a FENCED block: the fence is the row's own line of backticks, whose length was chosen to EXCEED every backtick run inside the literal — a backtick run INSIDE the content is NEVER the fence; only the exact fence line opens and closes the block. Write the bytes BETWEEN the fence lines BYTE-VERBATIM to the row's .cmd file: copy bytes — never re-quote, never re-escape, never substitute (a single-quoted \${...} run is literal bytes and must survive exactly). VERIFY before executing: re-read the written .cmd and compare it byte-for-byte against the fenced literal; on ANY mismatch record a \`cmd_bytes_mismatch: written .cmd bytes != declared check literal\` line in the artifact (after the tip_sha line), do NOT execute any re-quoted/corrected variant, and MOVE ON — the row fails LOUDLY via its artifact, never silently. Then execute the file AS A WHOLE, FROM THE FILE (file-threaded — e.g. \`bash <cmd-file>\`; never interpolate its content into another script; A3/D11 hygiene), under a timeout, teeing the FULL stdout+stderr of the ENTIRE command line to its .log artifact — a compound/pipeline/multi-command check runs END-TO-END with every command's output captured, never a half-run. STAMP each artifact with the tip SHA it ran at: the FIRST line is \`tip_sha: <output of git -C ${refineryPath} rev-parse HEAD>\`, then the command's captured output, then a final \`exit_code: <code>\` line. The tip_sha stamp is LOAD-BEARING: the seats compare it against the confirmed tip and attest a stale (mismatched) artifact 'unverified'. A red, hung, or timed-out command still gets its artifact (whatever it produced, plus its exit/timeout note) — record it and MOVE ON to the next condition; a failing check NEVER fails this dispatch. A row marked INTAKE-LINTED UNSUPPORTED below is record-only: do NOT execute it — write its artifact exactly as its row directs (the lint verdict recorded, never a half-run).\n`
    // pt-tagged prompt-feeding row builder (endstate-check dispatch, top-level-catch): r.n is a derived
    // map index (always defined), r.check is filter-guaranteed non-empty, r.fence/r.unsupported are
    // stamped by the intake-lint loop above (fence always defined; unsupported null when clean).
    + endStateCheckRows.map(r => r.unsupported
      ? pt`  - ${r.n} · cmd-file: ${refineryPath}/.war/endstate-${ph.id}-${r.n}.cmd · artifact: ${refineryPath}/.war/endstate-${ph.id}-${r.n}.log · INTAKE-LINTED UNSUPPORTED (${r.unsupported}): record-only — write the artifact with its tip_sha first line, then \`intake_lint: unsupported check literal (${r.unsupported}) — row not executed\`, then \`exit_code: unsupported\`; never execute or repair the literal.`
      : pt`  - ${r.n} · cmd-file: ${refineryPath}/.war/endstate-${ph.id}-${r.n}.cmd · artifact: ${refineryPath}/.war/endstate-${ph.id}-${r.n}.log · check literal (the .cmd bytes) fenced below:\n${r.fence}\n${r.check}\n${r.fence}`
    ).join('\n') + '\n'
    + pt`Return { artifacts: [{ n, path, tip_sha, exit_code }] } — one row per condition. On any failure return what you have — a partial/empty result is FAIL-OPEN (the seats read the teed artifacts at the enumerated paths and attest anything unreadable — or stale, its stamped tip_sha mismatching the confirmed tip — 'unverified', never 'met'); never block.`,
    { agentType: NS + 'war-refiner', phase: 'Refine', label: `endstate-check:phase-${ph.id}`, dispatchKind: 'endstate-check', schema: ENDSTATE_CHECK_RESULT, ...spawn('refiner') })
}

// End-state check (ADR 0013, phase-scoped): rides the gate-audit pass when it runs. TWO channels per
// claimed condition (D8, Task 3.2): findings stay DEFECT-ONLY (the three cases below), and the seat
// ALSO returns one POSITIVE endStateAttestations row per condition — artifact-first (the teed
// per-condition artifacts for check:-tagged rows, the captured gate logs for gate:-tagged rows, named
// observables for judged rows). Shared const: all three gate-audit-family seats (per-task (post-merge),
// integrated-tip, end-state-only) concatenate it, so all three return rows. Empty when the phase
// claims no conditions — the gate-audit prompt stays byte-identical to today (criterion 10).
const endStateBlock = endStateClaims.length
  ? pt`\nEND-STATE CHECK (phase-scoped): this phase claims the Commander's-Intent End-state condition(s) below. Three cases, mirroring the provably-unrun/SOFT split: `
    + pt`(1) a condition provably UNMET by the landed content at the CONFIRMED integration tip is HARD — record a Critical/Major finding (gate-evidence lane, holds the land); `
    + pt`(2) a condition you cannot verify, or a tip you cannot confirm, is a SOFT note (Minor/Nit), never a hold; `
    // GUARDED interpolation is MANDATORY here: `plan` is entry-validated only on a tasks-bearing
    // launch (#1430), and this const is built at TOP-LEVEL scope (outside the work thunk) whenever the
    // phase claims conditions — a bare ${plan.file} would throw phase-wide (held:workflow-error) on a
    // plan-less ZERO-TASK claims-bearing phase (still legal), and `pt` throws on an undefined value by contract.
    + pt`(3) a condition owned by a LATER phase — or by a deps-chained sibling task of THIS phase not yet landed at your audit's scope (map each numbered condition to the task slice that owns it before scoring — read the plan at ${(plan && plan.file) ?? '<unset>'} in the checked-out tree for the per-task Plan slice and deps edges) — is out-of-scope for THIS audit — record a Nit finding whose title contains "out-of-scope", NEVER a hold. `
    + pt`Set plan_ref on EVERY End-state finding to the condition text VERBATIM (the handoff block keys endState statuses on it).\n`
    + pt`ATTESTATION (D8 — the positive channel, artifact-first): ALSO return endStateAttestations — one row per claimed condition below, { condition (the text VERBATIM), status: met | unmet | unverified, evidence } — status PLUS the evidence you actually read, never a bare verdict. A check:-tagged condition has an EXECUTED artifact at the path listed beside it (teed by the land-barrier endstate-check dispatch, its first line the tip SHA it ran at) — Read the artifact, COMPARE its stamped tip_sha against the confirmed tip, and attest from it; a missing/unreadable artifact — and equally a STALE-BUT-READABLE one, its stamped tip_sha mismatching the confirmed tip (prior-run .war/ residue a resume replay lands on) — is status 'unverified', never 'met'; readable is not sufficient. An artifact that is present, readable, and correctly tip-stamped but RED for ENVIRONMENTAL reasons — a setup/collection/import failure (ModuleNotFoundError, pytest setup ERROR, usage/collection exit codes) rather than the condition evaluating false — attests 'unverified', NEVER 'unmet': a met condition is never attested unmet for want of environment prep (#1395). A gate:-tagged condition attests from the gate evidence as ACTUALLY CAPTURED — the per-task gate logs (${refineryPath}/.war/gate-<taskId>.log) plus the integrated-tip gate log (${refineryPath}/.war/gate-phase-${ph.id}.log) when one was produced — never from prose; with no captured gate evidence, attest 'unverified'. A judged (untagged) condition attests from named observables at the confirmed tip. Cross-check any worker-claimed End-state ids threaded on this prompt (A1) against your rows. Findings stay defect-only — attestation rides endStateAttestations, never a finding; a condition NO seat attests lands 'unverified' in the handoff, never 'met'.\n`
    // pt-tagged prompt-feeding row builder (endStateBlock → gate-audit prompt, top-level-catch): every
    // interpolation is guarded — r.condition is filter-guaranteed non-empty, tag/check normalize to
    // null and render behind ternaries, ph.id rides the same pt contract as the seat prompts.
    + endStateRows.map((r, i) => pt`  ${i + 1}. ${r.condition}${r.tag ? pt` [${r.tag}]` : ''}${r.check ? pt` — executed artifact: ${refineryPath}/.war/endstate-${ph.id}-${i + 1}.log` : ''}`).join('\n') + '\n'
  : ''
if (mergedTasksForGateAudit.length > 0) {
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
  // FAST-FORWARD (linear single-parent chain, NO per-task merge commit), so the base is the task's TRUE
  // immediate predecessor tip in serial merge order — the stamped preMergeTip landMerged() captured (#806),
  // which correctly spans a requiresTest:false interleave (that skipped task lands but never enters this
  // list, yet its real integration tip IS the successor's base) — or, for the FIRST landed task, the phase
  // integration base (a shell substitution the refiner resolves). NOT the previous LIST entry's gateHeadSha
  // (over-counts across a requiresTest:false skip / can be a sentinel), NOT <merge>^1 (void: no merge commit),
  // and NOT the post-merge integration tip (an empty three-dot no-op).
  const phaseBaseCmd = `$(git -C ${refineryPath} merge-base ${ph.integrationBranch} ${ph.workingBranch})`
  const evItems = mergedTasksForGateAudit.map((m) => ({
    taskId: m.taskId, gateHeadSha: m.gateHeadSha,
    // A null/absent stamp (the first landed task, or a barrier-recovery preMerged residual) falls back to
    // the SAME phaseBaseCmd const — byte-identity by reference, never a re-typed literal.
    preMergeTip: m.preMergeTip || phaseBaseCmd }))
  const evidence = await dispatch(
    pt`EVIDENCE DISPATCH for WAR phase ${ph.id} (mode=merge-task post-merge evidence; you are the refiner). `
    + pt`cwd = ${refineryPath} (the _refinery worktree, on ${ph.integrationBranch} at the FINAL integration tip after the serial merge queue). `
    + pt`This is a READ-ONLY proof computation — do NOT merge, push, rebase, or edit. Run the two floor scripts (siblings of assert-test-in-diff.sh, invoked the same bare way) per merged task and return the tokens.\n`
    + pt`observedHead — the _refinery tip you compute every proof against — is \`git -C ${refineryPath} rev-parse HEAD\`; return it per task.\n`
    + pt`For EACH merged task below (taskId · gateHeadSha · preMergeTip):\n`
    // pt-tagged prompt-feeding row builder (evidence dispatch, top-level-catch): e.taskId is task.id (entry-validated,
    // bare), e.preMergeTip is constructed with a || phaseBaseCmd fallback; ${e.gateHeadSha ?? …} absence-tolerant.
    + evItems.map(e => pt`  - ${e.taskId} · gateHeadSha=${e.gateHeadSha ?? '<gateHeadSha>'} · preMergeTip=${e.preMergeTip}`).join('\n') + '\n'
    + pt`  1. PIN STATUS — run: gate-pin-status.sh <gateHeadSha> $(git -C ${refineryPath} rev-parse HEAD) --mapped "$(git -C ${refineryPath} diff --name-only <preMergeTip> <gateHeadSha>)". `
    + pt`The --mapped set is THIS task's OWN changed files (the <preMergeTip>..<gateHeadSha> range — exactly what the task brought in under fast-forward topology), NOT the global gate-discovery set. Record pin_status = CONFIRMED (exit 0, equal shas) | BENIGN-ADVANCE (exit 0, tip descends gateHeadSha and no mapped file changed in between) | STALE-MISMATCH (exit 1, a mapped file changed or not an ancestor) | ERROR (exit 2, git/ref error or the '(integration_sha …)' sentinel), plus pin_evidence (the script's printed intervening/offending file list or error text).\n`
    + pt`  2. GUARD SPECIFICITY — run: assert-guard-specificity-in-diff.sh <preMergeTip> <gateHeadSha> (SAME pre-merge base). Record guard_specificity = covered (exit 0) | uncovered (exit 1 — capture the printed uncovered guard message + defining file as guard_evidence) | ERROR (exit 2).\n`
    + (intraDep
      ? pt`INTRA-PHASE-DEP phase (a same-repo dep edge exists): ALSO re-run the FULL gate (${plan.gate}) ONCE at the final integration tip in ${refineryPath} with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)), tee its full stdout+stderr to ${refineryPath}/.war/gate-phase-${ph.id}.log, and return integratedTipGate = { gate_output: <the full captured output>, tip_sha: $(git -C ${refineryPath} rev-parse HEAD), gate_log_path: ${refineryPath}/.war/gate-phase-${ph.id}.log } (the ABSOLUTE teed path) — the land-authoritative execution evidence, the captured log being the authoritative HARD-path artifact for the integrated-tip seat. Ensure .war/ is git-excluded (append \`.war/\` once to the path printed by \`git -C ${refineryPath} rev-parse --git-path info/exclude\`).\n`
      : pt`No intra-phase same-repo dep edge on this phase: do NOT re-run the gate; omit integratedTipGate.\n`)
    + pt`  3. PHASE DIFF — run: git -C ${refineryPath} diff --name-only ${phaseBaseCmd}..$(git -C ${refineryPath} rev-parse HEAD) and return its lines as phase_diff_files (one repo-relative path per entry) — the phase's git-derived changed-file list, read by the gate-audit floor pass; absent ⇒ that pass's note arm skips.\n`
    + pt`Return { perTask: [{ taskId, pin_status, pin_evidence, observedHead, guard_specificity, guard_evidence }], phase_diff_files, integratedTipGate? }. On any failure, return what you have — a partial/empty result is FAIL-OPEN (seats fall back to today's SOFT cannot-confirm path); never block.`,
    { agentType: NS + 'war-refiner', phase: 'Refine', label: `evidence:phase-${ph.id}`, dispatchKind: 'evidence', schema: EVIDENCE_RESULT, ...spawn('refiner') })
  // phase_diff_files (D15): stamped when the dispatch returned an array; otherwise null + one log line.
  if (evidence && Array.isArray(evidence.phase_diff_files)) phaseDiffFiles = new Set(evidence.phase_diff_files.filter(p => typeof p === 'string' && p.length > 0).map(aceRelPath))
  else log('evidence:phase-' + ph.id + ' returned no phase_diff_files — the gate-audit floor pass\'s note arm skips (the follow-up arm still reroutes; fail-open, D15).')
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
  await parallel(mergedTasksForGateAudit.map(({ taskId, gateOutput, acceptanceCriteria, gateHeadSha, observedHead, gateLogPath, pinStatus, pinEvidence, guardSpecificity, guardEvidence, mappedTests, claimedEndStateIds, baselineDebt: taskDebt }) => async () => {
    // Baseline-debt line (spec §6 / ADR 0019): a baseline-merged task carries its classified failing
    // identifiers so a pre-existing base failure in the gate output is NOT read as a provably-unrun
    // mapped test (which would fake a HARD hold). Empty/absent debt ⇒ '' ⇒ byte-identical prompt.
    const debtLine = (Array.isArray(taskDebt) && taskDebt.length)
      ? pt`\nBASELINE GATE DEBT: this task was merged over PRE-EXISTING base failures classified gate_failure_class:'baseline' — the failing identifiers below are pre-existing at the classification base, NOT evidence a mapped test did not run. A gate-output failure matching one of these is base debt, never a provably-unrun mapped test: ${taskDebt.join(', ')}.\n`
      : ''
    // D1 seat token consumption: the pin proof is a STAMPED token (gate-pin-status.sh, from the evidence
    // dispatch), not a hand-run recipe. guardLine surfaces the advisory guard-specificity evidence.
    const pinStatusLine = pinStatus
      // nested pt-tagged interior (first-class census entry): ${pinEvidence} is ternary-guarded.
      ? pt`${pinStatus}${pinEvidence ? pt` (cited evidence: ${pinEvidence})` : ''}`
      : '(no pin-status token — the evidence dispatch produced none)'
    const artifactLine = gateLogPath || '(no gate-log artifact path recorded)'
    // mappedTestsLine (D7, Task 3.2): the floor-matched test paths (MergeResult.mappedTests) make the
    // HARD provably-unrun trigger MECHANICAL — the seat greps each path against the CAPTURED gate log.
    // Enumeration-conditional (round-3 fix-forward adjudication): absence is HARD only where the log
    // ENUMERATES test file paths (e.g. the bash half's per-file headers); a piped `node --test` run
    // reports test titles + an aggregate summary and never per-file paths, so a zero-hit .mjs grep is
    // SOFT cannot-confirm — never a false land-hold (the reporter-format premise is pinned live by the
    // test suite's 'reporter-format premise' test).
    // Absent/empty ⇒ '' (byte-identical prompt — the seat keeps today's SOFT cannot-confirm posture).
    const mappedTestsLine = (Array.isArray(mappedTests) && mappedTests.length)
      ? pt`\nMAPPED TESTS (D7 — the mechanical HARD trigger): the test floor matched these test paths in this task's diff (MergeResult.mappedTests):\n`
        // pt-tagged prompt-feeding row builder (mapped-tests → gate-audit prompt): ${p2 ?? ''} absence-tolerant.
        + mappedTests.map(p2 => pt`  - ${p2 ?? ''}`).join('\n') + '\n'
        + pt`Grep EACH mapped path against the CAPTURED gate log artifact (artifact-first). A mapped path absent — or present with 0 executed tests — at a CONFIRMED/BENIGN-ADVANCE pin is the HARD provably-unrun finding ONLY when the captured log ENUMERATES test file paths for that path's suite half (e.g. the bash suite half's per-file \`== gate(bash): <path> ==\` headers; a \`node --test\` run reports test TITLES plus an aggregate summary, never per-file paths). A zero-hit grep against a non-enumerating half (e.g. a .mjs mapped path vs the node-reporter output) proves nothing about that path: SOFT cannot-confirm, never a hold. A captured log whose bash half ABORTED (the discovery loop exits on the first red suite — a red suite's header with no later headers after it) is truncated: a mapped path after the abort point is SOFT cannot-confirm, never HARD.\n`
      : ''
    // claimedIdsLine (A1, Task 3.2): the worker-claimed End-state ids, cross-checked by this seat
    // against its endStateAttestations rows. Empty/absent — or a claims-less phase — ⇒ '' (byte-identical).
    const claimedIdsLine = (endStateClaims.length && Array.isArray(claimedEndStateIds) && claimedEndStateIds.length)
      ? pt`\nWORKER-CLAIMED END-STATE IDS (A1): the worker reported acceptance_criteria_covered = [${claimedEndStateIds.join(', ')}] — cross-check these claimed ids against your endStateAttestations rows: a claimed condition your evidence cannot support is attested honestly (unmet/unverified, never met-by-claim), and a substantive claim-vs-evidence mismatch is a finding (severity yours).\n`
      : ''
    const guardLine = guardSpecificity
      // nested pt-tagged interior (first-class census entry): ${guardEvidence} is ternary-guarded.
      ? pt`\nGUARD SPECIFICITY (stamped by the same evidence dispatch): ${guardSpecificity}${guardEvidence ? pt` — ${guardEvidence}` : ''}. An 'uncovered' token means a new die/stderr guard was added whose exact stderr message NO same-diff test asserts — emit a test-fidelity finding citing the guard message (severity/disposition are yours, ADR 0013). 'covered' / 'ERROR' / absent ⇒ no guard finding on this axis.\n`
      : ''
    const gateAuditVerdict = await dispatch(
      pt`POST-MERGE GATE-AUDIT for WAR task ${taskId} (lens: execution-evidence). `
      + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
      + pt`${refineryPath} (the _refinery worktree) and the gate ran at gate-HEAD sha ${gateHeadSha}.\n`
      + pt`Gate-HEAD sha (the rebased integration tip the gate ran at): ${gateHeadSha}.\n`
      + pt`PIN STATUS: ${pinStatusLine}. A stamped CONFIRMED or BENIGN-ADVANCE token IS the pin proof — the refiner's evidence dispatch already computed it (gate-pin-status.sh) against the observed _refinery tip ${observedHead || gateHeadSha}. Consume the stamped token; do NOT reconstruct the proof — you MAY spot-verify with a SINGLE read-only \`git -C ${refineryPath} cat-file -t <sha>\` or \`git -C ${refineryPath} rev-parse HEAD\` only if you doubt it.\n`
      + pt`CONFIRMED (observed tip == gate-HEAD) or BENIGN-ADVANCE (observed tip descends gate-HEAD and NONE of this task's own files changed in the intervening range) ⇒ the tree you judge corresponds to the current integration tip; a mapped acceptance-criteria test provably unrun AT that confirmed tip stays HARD.\n`
      + pt`STALE-MISMATCH / ERROR / an absent pin-status token ⇒ you CANNOT confirm the executed gate output corresponds to the current integration tip: record a SOFT note, never a HARD finding (the stale-tip defusing rule). The SOFT note MUST state: the observed HEAD sha (or "rev-parse failed"), the expected gate-HEAD sha ${gateHeadSha}, and the reason — "gate-audit worktree not at the integration tip — execution evidence unreliable, downgraded to SOFT, not a land-halt".\n`
      + pt`In ANY cannot-confirm / STALE-MISMATCH / ERROR case KEEP verdict at 'approve' or 'request_changes' WITH the SOFT note — NEVER 'escalate' (escalate is reserved for a plan that is wrong or underspecified; a finding-less escalate is treated as a HARD hold, so it must never be used to signal a stale/unconfirmable tip).\n`
      + pt`GATE LOG ARTIFACT: read the FULL captured gate log at ${artifactLine} (read-only Read) — this captured file, NOT the inline gate output below, is the AUTHORITATIVE execution evidence for a HARD provably-unrun determination. A MISSING artifact (no path, or the file cannot be read) ⇒ SOFT cannot-confirm for the HARD path (never a HARD finding); the inline gate output stays readable as NON-AUTHORITATIVE context.\n`
      + mappedTestsLine
      + guardLine
      + pt`If the pin is CONFIRMED/BENIGN-ADVANCE, confirm the mapped acceptance-criteria test is present in the files at that tip `
      + pt`(read-only git / Read in ${refineryPath}), not merely inferred from the gate output text; record a `
      + pt`HARD gate-evidence finding for a MISSING mapped test ONLY when it is genuinely absent AT THE CONFIRMED INTEGRATION TIP and the captured artifact confirms on an ENUMERATING half that it did not run (the present-but-unrun path is governed by the MAPPED TESTS block above).\n`
      + pt`Return the sha you actually reviewed as audit_sha (it should equal the observed tip ${observedHead || gateHeadSha}); the Lead compares it to the dispatched pin — a differing well-formed sha demotes your findings to SOFT (you judged a different tree).\n`
      + debtLine
      + pt`Acceptance criteria / plan slice: ${acceptanceCriteria || '(see plan file)'}\n`
      + pt`Executed gate output (NON-AUTHORITATIVE context — the captured artifact above is authoritative for the HARD path):\n${gateOutput || '(no gate output recorded)'}\n`
      + claimedIdsLine
      // adjudicationClause rides this seat directly (Task 1.1): a gate-time ruling reaches the gate-audit
      // pass, so a pre-adjudicated delta is a confirmation note here too. Empty set ⇒ '' ⇒ byte-identical.
      + endStateBlock + intentClause + adjudicationClause
      // Evidence-precedence skeleton (ADR 0041) rides this seat directly, same as adjudicationClause
      // — this seat sits outside auditPrompt(); the five-surface registry row anchors it here.
      + pt`\nEVIDENCE PRECEDENCE (ADR 0041): classify each claim by shape — content-at-pin, execution, history, or authority — and judge it at the highest rung of that shape's ladder (full ladders + floor rules: the "## Evidence precedence" section of agents/war-auditor.md, the auditor standing card). The working tree and the worker done-report are never the top rung of any ladder; prefetched lessons are never evidence — re-ground a lesson-derived claim at the pin before it appears in a finding.`
      // DISPOSITION RULE (D15, PIN-17) rides this seat directly — its Minor/Nit rows route through
      // routeGateAuditRows, so the seat is told the rule the floor enforces (shared const, same commit).
      + DISPOSITION_RULE_CLAUSE
      + pt`\nDefault: SOFT. Hard only when provably unrun.`,
      { agentType: NS + 'war-auditor', phase: 'Audit',
        label: `gate-audit:${taskId}:execution-evidence`, schema: AUDIT_VERDICT, ...spawn('auditor') })
    // gate-evidence findings are SOFT (do not hold the land) UNLESS a mapped test is provably unrun (hard).
    // Hard case: the auditor records a Critical or Major finding on the execution-evidence lens per its
    // governing instruction for the path (survey-derived correction, #1372): the MAPPED TESTS block governs
    // present-but-unrun (enumeration-conditional, truncation-aware); the conjunctive clause governs a
    // MISSING mapped test (genuinely absent at the confirmed tip, artifact-confirmed on an enumerating half).
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
      // #805 EXEMPT from the auditRound disposition-strip: this stamp is annotation-only (no disposition/
      // autoFixable drop) — `!mismatch` already gates the ENTIRE HARD disjunct below, and a pin-mismatched
      // seat's Minor/Nits never reach the gate-audit floor pass (the `!mismatch` gate on the row
      // collection below); gate-audit rows never enter aceable (populated solely at the per-task approve
      // branch) — their absorbs ride the sweep queue. Not the same bug half-fixed.
      const findings = mismatch ? rawFindings.map(f => ({ ...f, pinMismatch: true })) : rawFindings
      // D8: severity OR verdict gates the hard path — a finding-less `verdict === 'escalate'` is HARD by
      // design (defence-in-depth against a silent finding-less escalate landing); Minor/Nit stay SOFT-by-
      // default. A pin-mismatched seat is NEVER hard (fail-open): !mismatch gates the whole disjunct.
      const isHardGateEvidence = !mismatch &&
        (gateAuditVerdict.verdict === 'escalate' || rawFindings.some(f => f.severity === 'Critical' || f.severity === 'Major'))
      // Distinguish hard vs soft (and pin-mismatch) in the auditLog so the Lead can adjudicate even if held.
      // A mismatch entry is the SOFT absence-note (task, seat, both SHAs: auditSha vs expectedPin).
      auditLog.push({ task: taskId, verdict: `gate-audit:${gateAuditVerdict.verdict}`, findings, gateEvidence: true, hard: isHardGateEvidence,
        ...(mismatch ? { pinMismatch: true, expectedPin: pin } : {}), gateHeadSha, auditSha: gateAuditVerdict.audit_sha,
        // endStateAttestations (D8, Task 3.2): the seat's positive-channel rows ride the log entry —
        // the handoff derivation consumes them (a pin-mismatched entry's rows are EXCLUDED there: the
        // seat judged a different tree, so its conditions fall to 'unverified', never a silent 'met').
        ...(Array.isArray(gateAuditVerdict.endStateAttestations) ? { endStateAttestations: gateAuditVerdict.endStateAttestations } : {}) })
      // Gate-audit-family routing (in-band-absorb-default D15, PIN-17 — the #1692 record-only sink
      // is RETIRED for Minor/Nits): auditLog keeps the record (above) and stops being the only
      // destination. This seat's Minor/Nit rows are collected, seat-stamped, for the ONE task-less
      // floor pass (routeGateAuditRows) that runs after every gate-audit seat and before the sweep —
      // absorbs ride the sweep queue under the exclusion set, a barrierless follow-up reroutes there,
      // an ask still parks (exactly-once via parkAsk, #1550/#1790). A pin-mismatched seat's rows never
      // route (same doctrine as the pinMismatch strip: a finding raised against a different tree than
      // the judged tip is not routable).
      if (!mismatch) for (const f of findings) {
        if (f.severity === 'Minor' || f.severity === 'Nit') gateAuditRows.push({ ...f, task: taskId, seat: 'gate-audit:' + taskId + ':execution-evidence', lens: 'execution-evidence', sha: auditShaOrSentinel(gateAuditVerdict.audit_sha) })
      }
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
      // pt-tagged prompt-feeding row builder (integrated-tip authVerdict prompt, top-level-catch): m.taskId is
      // task.id (entry-validated, bare); m.acceptanceCriteria carries its own || '(see plan file)' default.
      .map(m => pt`- ${m.taskId}: ${m.acceptanceCriteria || '(see plan file)'}`).join('\n') || '(see plan file)'
    // #818: the captured integrated-tip gate log is the AUTHORITATIVE HARD-path artifact for THIS seat
    // (mirroring the per-task GATE LOG ARTIFACT clause); an absent path ⇒ SOFT cannot-confirm (fail-open —
    // an in-flight refiner returning integratedTipGate without gate_log_path lands SOFT, never an error).
    const authArtifactLine = integratedTip.gate_log_path || '(no gate-log artifact path recorded)'
    // Mapped-tests union (D7, Task 3.2): the dep-crossing tasks' floor-matched paths, grepped against
    // the integrated-tip gate log the same mechanical way — including the round-3 enumeration-conditional
    // (mappedTestsLine's twin: absence is HARD only where the log enumerates test file paths; a
    // non-enumerating half is SOFT). Empty ⇒ '' (byte-identical prompt).
    const authMapped = mergedTasksForGateAudit
      .filter(m => depCrossingIds.has(m.taskId))
      .flatMap(m => Array.isArray(m.mappedTests) ? m.mappedTests : [])
    const authMappedLine = authMapped.length
      ? pt`\nMAPPED TESTS (D7 — the mechanical HARD trigger): the test floor matched these test paths across the dep-crossing tasks' diffs (MergeResult.mappedTests):\n`
        // pt-tagged prompt-feeding row builder (mapped-tests → integrated-tip prompt): ${p2 ?? ''} absence-tolerant.
        + authMapped.map(p2 => pt`  - ${p2 ?? ''}`).join('\n') + '\n'
        + pt`Grep EACH mapped path against the CAPTURED integrated-tip gate log (artifact-first). A mapped path absent — or present with 0 executed tests — is the HARD provably-unrun finding ONLY when the captured log ENUMERATES test file paths for that path's suite half (e.g. the bash suite half's per-file \`== gate(bash): <path> ==\` headers; a \`node --test\` run reports test TITLES plus an aggregate summary, never per-file paths). A zero-hit grep against a non-enumerating half (e.g. a .mjs mapped path vs the node-reporter output) proves nothing about that path: SOFT cannot-confirm, never a hold. A captured log whose bash half ABORTED (the discovery loop exits on the first red suite — a red suite's header with no later headers after it) is truncated: a mapped path after the abort point is SOFT cannot-confirm, never HARD.\n`
      : ''
    const authVerdict = await dispatch(
      pt`INTEGRATED-TIP GATE-AUDIT for WAR phase ${ph.id} (lens: execution-evidence — AUTHORITATIVE). `
      + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at ${refineryPath} at the FINAL integration tip ${integratedTip.tip_sha || '(tip sha unrecorded)'}, and the FULL gate was re-run there after the serial merge queue — this integrated-tip run is LAND-AUTHORITATIVE over the per-branch gates for the intra-phase dep tasks (their branches were gated before their dep's content landed).\n`
      + pt`Judge the union of the dep-crossing tasks' mapped acceptance criteria against this integrated-tip evidence. Record a HARD gate-evidence finding (Critical/Major) ONLY when a mapped test is provably unrun at this tip; a cannot-confirm is SOFT, never a hold; NEVER 'escalate' for a stale/unconfirmable tip (escalate is reserved for a wrong/underspecified plan).\n`
      + pt`GATE LOG ARTIFACT: read the FULL captured integrated-tip gate log at ${authArtifactLine} (read-only Read) — this captured file, NOT the inline gate output below, is the AUTHORITATIVE execution evidence for a HARD provably-unrun determination. A MISSING artifact (no path, or the file cannot be read) ⇒ SOFT cannot-confirm for the HARD path (never a HARD finding); the inline gate output stays readable as NON-AUTHORITATIVE context.\n`
      + authMappedLine
      + pt`Return the sha you reviewed as audit_sha (it should equal ${integratedTip.tip_sha || 'the integration tip'}).\n`
      + pt`Dep-crossing tasks' acceptance criteria:\n${authCriteria}\n`
      + pt`Integrated-tip gate output (NON-AUTHORITATIVE context — the captured artifact above is authoritative for the HARD path):\n${integratedTip.gate_output}\n`
      // adjudicationClause rides this seat directly (Task 1.1) — same reason as the per-task seat above.
      + endStateBlock + intentClause + adjudicationClause
      // Evidence-precedence skeleton (ADR 0041) rides this AUTHORITATIVE seat directly, same as
      // adjudicationClause — outside auditPrompt(); the five-surface registry row anchors it here.
      + pt`\nEVIDENCE PRECEDENCE (ADR 0041): classify each claim by shape — content-at-pin, execution, history, or authority — and judge it at the highest rung of that shape's ladder (full ladders + floor rules: the "## Evidence precedence" section of agents/war-auditor.md, the auditor standing card). The working tree and the worker done-report are never the top rung of any ladder; prefetched lessons are never evidence — re-ground a lesson-derived claim at the pin before it appears in a finding.`
      // DISPOSITION RULE (D15, PIN-17) rides this seat directly — its Minor/Nit rows route through
      // routeGateAuditRows, so the seat is told the rule the floor enforces (shared const, same commit).
      + DISPOSITION_RULE_CLAUSE
      + pt`\nDefault: SOFT. Hard only when provably unrun.`,
      { agentType: NS + 'war-auditor', phase: 'Audit',
        label: `gate-audit:phase-${ph.id}:integrated-tip`, schema: AUDIT_VERDICT, ...spawn('auditor') })
    if (authVerdict) {
      const findings = authVerdict.findings || []
      // Same gate-evidence lane as the end-state seat: severity OR the D8 verdict disjunct gates HARD.
      const isHard = authVerdict.verdict === 'escalate' || findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
      auditLog.push({ task: `phase-${ph.id}-integrated-tip`, verdict: `gate-audit:${authVerdict.verdict}`, findings, gateEvidence: true, hard: isHard, authoritative: true, auditSha: authVerdict.audit_sha,
        // endStateAttestations (D8, Task 3.2) — no pin demotion on this seat (it judges the CONFIRMED final tip).
        ...(Array.isArray(authVerdict.endStateAttestations) ? { endStateAttestations: authVerdict.endStateAttestations } : {}) })
      // Gate-audit-family routing (D15, PIN-17): same collection as the per-task seat above — the
      // Minor/Nit rows ride to the ONE floor pass (routeGateAuditRows), seat-stamped; auditLog keeps
      // the record. The retired #1692 record-only sink no longer applies.
      for (const f of findings) {
        if (f.severity === 'Minor' || f.severity === 'Nit') gateAuditRows.push({ ...f, task: 'phase-' + ph.id + '-integrated-tip', seat: 'gate-audit:phase-' + ph.id + ':integrated-tip', lens: 'execution-evidence', sha: auditShaOrSentinel(authVerdict.audit_sha) })
      }
      if (isHard) escalated.push({ task: `phase-${ph.id}-integrated-tip`, reason: 'gate-evidence', detail: authVerdict })
    }
  }
} else if (endStateClaims.length > 0) {
  // Roster-D7 preserved (Open decision 2): nothing to gate-audit per task, but this phase CLAIMS
  // End-state conditions — spawn ONE End-state-only seat at the confirmed tip, so a docs-only
  // phase cannot skip its own claimed conditions. The per-task pass's cost saving stands.
  log(`gate-audit: mergedTasksForGateAudit is empty but this phase claims ${endStateClaims.length} End-state condition(s) — spawning ONE End-state-only seat at the confirmed tip (D7 cost saving preserved for the per-task pass).`)
  const esVerdict = await dispatch(
    pt`END-STATE-ONLY GATE-AUDIT for WAR phase ${ph.id} (lens: execution-evidence). `
    + pt`You are a READ-ONLY auditor with read-only git. The phase integration branch is checked out at `
    + pt`${refineryPath} (the _refinery worktree).\n`
    + pt`Confirm the tip first: run \`git -C ${refineryPath} rev-parse HEAD\` (read-only git, permitted) and report it as your audit_sha. `
    + pt`If the command cannot run, every condition below is unverifiable — SOFT notes only, never a hold.\n`
    + pt`In any cannot-confirm case KEEP verdict at 'approve' or 'request_changes' WITH the SOFT note — NEVER 'escalate' (a finding-less escalate is a HARD hold, reserved for a wrong/underspecified plan; it must never signal an unconfirmable tip).\n`
    // adjudicationClause rides this seat directly (Task 1.1) — same reason as the two seats above.
    + endStateBlock + intentClause + adjudicationClause
    // Evidence-precedence skeleton (ADR 0041) rides this seat directly, same as adjudicationClause
    // — outside auditPrompt(); the five-surface registry row anchors it here.
    + pt`\nEVIDENCE PRECEDENCE (ADR 0041): classify each claim by shape — content-at-pin, execution, history, or authority — and judge it at the highest rung of that shape's ladder (full ladders + floor rules: the "## Evidence precedence" section of agents/war-auditor.md, the auditor standing card). The working tree and the worker done-report are never the top rung of any ladder; prefetched lessons are never evidence — re-ground a lesson-derived claim at the pin before it appears in a finding.`
    // DISPOSITION RULE (D15, PIN-17) rides this seat directly — same reason as the two seats above.
    + DISPOSITION_RULE_CLAUSE,
    { agentType: NS + 'war-auditor', phase: 'Audit',
      label: `gate-audit:phase-${ph.id}:end-state`, schema: AUDIT_VERDICT, ...spawn('auditor') })
  if (esVerdict) {
    const findings = esVerdict.findings || []
    // D8: severity OR a finding-less `verdict === 'escalate'` gates the hard path (identical disjunct to the
    // per-task gate-audit site); Minor/Nit stay SOFT-by-default. This end-state-only seat (nothing merged) is
    // EXEMPT from the D2 pin-equality demotion — no evidence dispatch supplies its observed tip, so fail-open
    // (no pin, no demotion). Its own prompt already SOFT-downgrades a tip it cannot confirm.
    const isHard = esVerdict.verdict === 'escalate' || findings.some(f => f.severity === 'Critical' || f.severity === 'Major')
    auditLog.push({ task: `phase-${ph.id}-end-state`, verdict: `gate-audit:${esVerdict.verdict}`, findings, gateEvidence: true, hard: isHard, auditSha: esVerdict.audit_sha,
      // endStateAttestations (D8, Task 3.2) — this seat consumes the land-barrier artifacts too (the
      // requiresTest:false-only arm); no pin demotion (its prompt already SOFT-downgrades an unconfirmed tip).
      ...(Array.isArray(esVerdict.endStateAttestations) ? { endStateAttestations: esVerdict.endStateAttestations } : {}) })
    // Gate-audit-family routing (D15, PIN-17): same collection as the two seats above — the Minor/Nit
    // rows ride to the ONE floor pass (routeGateAuditRows), seat-stamped; auditLog keeps the record.
    // The retired #1692 record-only sink no longer applies.
    for (const f of findings) {
      if (f.severity === 'Minor' || f.severity === 'Nit') gateAuditRows.push({ ...f, task: 'phase-' + ph.id + '-end-state', seat: 'gate-audit:phase-' + ph.id + ':end-state', lens: 'execution-evidence', sha: auditShaOrSentinel(esVerdict.audit_sha) })
    }
    if (isHard) escalated.push({ task: `phase-${ph.id}-end-state`, reason: 'gate-evidence', detail: esVerdict })
  }
}

// ---- GATE-AUDIT FLOOR PASS (in-band-absorb-default D15, PIN-17) — task-less, after every gate-audit
// seat and BEFORE the sweep. The three gate-audit-family seats' Minor/Nit rows route like any seat's,
// through the family's ONE producer (a dispositionOf site with its ask arm first — the D7 order
// census): ask ⇒ park (#1550, exactly-once); absorb ⇒ absorb + phaseClose:true into phaseCloseQueue,
// stamped with the seat label (the sweep drains it under the exclusion set); a seat follow-up with no
// barrier ⇒ absorb + phaseClose:true with NO diff check (the sweep is the only lane left); a
// barrier:trade-off follow-up with the ask field ⇒ ask, without it ⇒ keep follow-up with the
// trade-off-without-ask log; any other barrier ⇒ filed as stated; a seat note whose suggested_fix is
// non-empty and whose file is in phase_diff_files ⇒ absorb + phaseClose:true; phase_diff_files ABSENT
// ⇒ the note arm skips with a log while the follow-up arm still reroutes, and NO demote:floor-skipped
// comes from this pass; an omitted-disposition fully specified row reads absorb (dispositionOf over
// the phase diff), an unspecified one keeps the severity default; with phase_diff_files ABSENT an
// omitted-disposition fully specified row STILL reads absorb + phaseClose:true (the sweep is the only
// lane left, no diff check — the end-state-only arm never stamps phase_diff_files, so without this
// arm a Minor would file barrierless, breaching PIN-17). A release-slot file demotes at birth
// (demote:release-slot, PIN-11). auditLog keeps every record — it is no longer the only sink.
const routeGateAuditRows = () => {
  if (!gateAuditRows.length) return
  const noteArmSkipped = phaseDiffFiles === null
  if (noteArmSkipped) log('gate-audit floor pass: phase_diff_files absent — the note arm skips (a gate-audit note keeps its classification); the follow-up arm still reroutes (D15).')
  for (const f of gateAuditRows.splice(0)) {
    const fix = typeof f.suggested_fix === 'string' && f.suggested_fix.trim().length > 0
    const barrier = BARRIER_TOKENS.includes(f.barrier) ? f.barrier : null
    let d = dispositionOf(f, phaseDiffFiles)
    if (d === 'ask') { parkAsk(f); continue }       // ask precedes the absorb chain (#1550, D7)
    if (noteArmSkipped && f.disposition == null && fix) {   // no diff ⇒ specified omitted row still absorbs (D15, PIN-17; header comment)
      d = 'absorb'; f.phaseClose = true
      log('gate-audit floor pass REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (' + f.seat + ') omitted disposition with a specified fix, phase_diff_files absent → absorb + phaseClose:true (no diff check; D15).')
    }
    if (f.disposition === 'follow-up') {
      if (!barrier) { d = 'absorb'; f.phaseClose = true; log('gate-audit floor pass REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (' + f.seat + ') follow-up carried no barrier tag → absorb + phaseClose:true (the sweep is the only lane left; follow-up is legal only with a BARRIER_TOKENS member, D15).') }
      else if (barrier === 'barrier:trade-off') {
        if (f.ask && typeof f.ask === 'object' && typeof f.ask.question === 'string' && f.ask.question) { log('gate-audit floor pass REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (' + f.seat + ') barrier:trade-off with the ask field → ask (parked, D15).'); parkAsk(f); continue }
        log('gate-audit floor pass: [' + f.severity + '] "' + (f.title ?? '') + '" (' + f.seat + ') trade-off without ask fields — kept follow-up as stated (D15).')
      }
    } else if (f.disposition === 'note' && fix && !noteArmSkipped && typeof f.file === 'string' && f.file && phaseDiffFiles.has(aceRelPath(f.file))) {
      d = 'absorb'; f.phaseClose = true
      log('gate-audit floor pass REROUTED: [' + f.severity + '] "' + (f.title ?? '') + '" (' + f.seat + ') note with a specified fix rerouted → absorb + phaseClose:true (its file is in phase_diff_files, D15).')
    }
    // Content-key registries (the dedup-registry law): a per-task seat re-raising a finding the
    // roster panel already aced, filed, or queued on the same task is corroboration — merged onto
    // the surviving record, logged, never a second record and never a re-queue. Computed from the
    // POST-floor disposition (after the follow-up and note arms above), matching routeReauditMinors.
    const b = (d === 'follow-up' || d === 'absorb') ? remintBlock(f) : null
    if (b) { log('gate-audit floor pass: re-mint of "' + (f.title ?? '') + '" (' + f.seat + ') — ' + b + '; not re-routed (logged, never silent).'); corroborateSurvivor(f); continue }
    if (d === 'follow-up') fileFollowUp(f)
    else if (d === 'note') notes.push(f)
    else if (!f.file) demote(f, f.severity === 'Minor' ? 'follow-up' : 'note', 'demote:fileless — fileless gate-audit absorb takes the severity default (never sweep-eligible)')
    else if (!aceEligible(f)) demoteReleaseSlot(f)
    else routeToSweep(f, 'gate-audit-family absorb (' + f.seat + ') — the sweep is the family\'s vehicle (D15)')
  }
}
routeGateAuditRows()

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
const HARD_ESCALATION_REASONS = ['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test', 'unpackaged', 'done-unmet']
// SOFT_ENV_REASONS mirrors land-decision.mjs export — the Workflow sandbox can't import. Keep in sync.
// The soft environment family (#1411): env-blocked (provision failure — worker never spawned) and
// env-died (post-spawn API/quota/transport death). NEVER members of HARD_ESCALATION_REASONS
// (ADR 0005's infra-stays-soft precedent): the phase lands minus those tasks — a retryable
// interruption for the Recovery-relaunch runbook, never a hard escalation; a phase where nothing
// merged still reads held:nothing-merged by construction.
const SOFT_ENV_REASONS = ['env-blocked', 'env-died']
const hardEscalation = escalated.some(e => HARD_ESCALATION_REASONS.includes(e && e.reason))
let landDecision = (landed.length && !hardEscalation) ? 'landed'
  : hardEscalation ? 'held:escalation'
  : 'held:nothing-merged'
// Retryable-interruption visibility (#1411): when every escalation is soft-environment, say so —
// concatenation-built (census-safe), never a routing change (the landDecision above is already computed).
{
  const softEnvEscalated = escalated.filter(e => e && SOFT_ENV_REASONS.includes(e.reason))
  if (softEnvEscalated.length > 0 && !hardEscalation) {
    log('Phase ' + ph.id + ': ' + softEnvEscalated.length + ' soft environment escalation(s) [' + softEnvEscalated.map(e => e.reason + ':' + e.task).join(', ') + '] — a retryable interruption, never a hard escalation: '
      + (landed.length ? 'the phase lands minus those tasks' : 'nothing merged — held:nothing-merged')
      + '; re-run them via the Recovery-relaunch runbook after the environment resets.')
  }
}
const refineryLandPath = `${worktreeRoot || '<worktreeRoot>'}/${runId || '<runId>'}/_refinery`

// ---- PHASE-CLOSE COHERENCE SWEEP (ADR 0012) — after the land decision is computed, before the ----
// ---- land dispatch. Fail-open: the sweep may only improve the tip — a re-approved polish merges ----
// at the serial queue's tail and the single land below proceeds on the polished tip; anything else
// DISCARDS and the pre-polish tip lands exactly as it would have (a discarded sweep recomputes
// NOTHING). Gated on a would-land phase with a non-empty phaseCloseQueue. NO owned-refs
// registration (Open decision 4) — bookkeeping is a Lead-side ledger entry + the handoff block.
// Drain-cause stamp (Phase 6 Task 1 (d)): when a phase-close DISPATCH DIES (polish-worktree
// provision or the sweep worker — a tagged env-died throw, or a dead dispatch returning nothing),
// every finding the resulting drain demotes carries WHICH dispatch died and WHY it was demoted — an
// in-band field on the finding row (rides minorsFiled and the escalation records; the field name is
// mechanism latitude), replacing the flat untriaged dump. Ordinary non-death drains (held phase,
// invalid roster, panel non-approval) stay unstamped — they were never "a dispatch died".
const stampDrainCause = (f, dispatch, why) => { f.drainCause = { dispatch, why }; return f }
let polishStatus = 'skipped'
if (phaseCloseQueue.length > 0 && landDecision !== 'landed') {
  // Demotion arm (ADR 0013): a held phase never dispatches the sweep — drain the queue.
  log(`phase-close sweep: the phase is ${landDecision} — the sweep never dispatches; draining ${phaseCloseQueue.length} queued finding(s) to follow-up.`)
  for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'demote:sweep-skipped — held phase — the phase-close sweep never dispatched')
} else if (phaseCloseQueue.length > 0) {
  // ---- SWEEP EXCLUSION SET (in-band-absorb-default D2/D6, PIN-3) — built at sweep time, before the
  // dispatch: the files of every args.sweepExclude entry (campaign contention, owner = the plan slug)
  // ∪ the Files: of every task whose status is not merged this phase (owner = the task id) ∪
  // RELEASE_SLOT_FILES (owner = "the release slot"; a release-slot row is already refused at birth,
  // so this arm catches only a seeded/ruled-ask row). aceRelPath on BOTH sides. A queued absorb whose
  // file is in the set demotes to follow-up naming the owner (demote:exclusion-set / demote:release-slot);
  // the seat never decides exclusion. First owner wins per path (construction order is latitude).
  {
    const excl = new Map()
    const claim = (p, owner) => { const k = aceRelPath(p); if (typeof k === 'string' && k && !excl.has(k)) excl.set(k, owner) }
    if (Array.isArray(A.sweepExclude)) {
      let n = 0
      for (const e of A.sweepExclude) for (const p of e.files) { claim(p, 'plan ' + e.slug); n++ }
      if (n === 0) log('campaign contention set empty for ' + A.sweepExclude.length + ' entries (args.sweepExclude present; no files) — the in-phase and release-slot arms still run.')
    } else log('no campaign contention set threaded (args.sweepExclude absent) — the in-phase and release-slot arms still run.')
    for (const t of (tasks || [])) if (!succeeded.has(t.id)) for (const p of (Array.isArray(t.files) ? t.files : [])) claim(p, 'task ' + t.id)
    for (const p of RELEASE_SLOT_FILES) claim(p, 'the release slot')
    const kept = []
    for (const f of phaseCloseQueue.splice(0)) {
      const owner = (typeof f.file === 'string' && f.file) ? (excl.get(aceRelPath(f.file)) ?? (isReleaseSlotFile(f.file) ? 'the release slot' : null)) : null
      if (owner === null) { kept.push(f); continue }
      queuedKeys.delete(remintKey(f))
      if (owner === 'the release slot') demote(f, 'follow-up', 'demote:release-slot — sweep exclusion set: ' + aceRelPath(f.file) + ' is owned by the release slot; the sweep never touches it')
      else demote(f, 'follow-up', 'demote:exclusion-set — sweep exclusion set: ' + aceRelPath(f.file) + ' is owned by ' + owner + ' this phase; the sweep never touches it')
    }
    phaseCloseQueue.push(...kept)
  }
}
// Not an `else if` of the chain above: the exclusion-set drain there may have emptied the queue,
// so the sweep arm re-tests both conditions on the drained queue.
if (phaseCloseQueue.length > 0 && landDecision === 'landed') {
  const rvSweep = validateRoster(defaultRoster)
  if (!rvSweep.valid) {
    // Fail-open, never a hold: without a valid config default audit.roster the mandatory full-panel
    // re-audit cannot convene (the Lead may NOT downgrade it — Open decision 1). Skip + drain.
    log(`phase-close sweep: the config default audit.roster is unusable (${rvSweep.errors.join('; ')}) — sweep skipped; draining the queue to follow-up.`)
    for (const f of phaseCloseQueue.splice(0)) demote(f, 'follow-up', 'demote:sweep-skipped — sweep skipped — no valid default audit.roster for the mandatory full-panel re-audit')
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
    // dispatchAgent + catch (Phase 6 Task 1 (c)): a POST-SPAWN harness death of this dispatch classifies
    // env-died SOFT — the sweep is fail-open, so the death falls into the existing not-ok skip-and-drain
    // arm below (polishProv null), with the drain cause stamped on each demoted finding (d). A non-infra
    // throw rethrows into the top-level catch → held:workflow-error, exactly as before.
    let polishProv = null
    let polishProvDeath = null
    try {
    polishProv = await dispatchAgent(
      pt`Provision the phase-close POLISH worktree for WAR phase ${ph.id} by running provision-worktrees.sh. Do NOT free-author git; run exactly:\n`
      + pt`  provision-worktrees.sh ensure-worktree ${polishWorktree} ${polishBranch} "$(git -C ${refineryLandPath} rev-parse ${ph.integrationBranch})"\n`
      + pt`— the polish worktree is cut at the POST-MERGE integrated tip (idempotent; reuse if present). Return the env-outcome JSON: \`{ ok: true }\` when the ensure-worktree subcommand exits 0; on a non-zero exit return \`{ ok: false, failedCommand: "<the exact subcommand line>", exitCode: <code>, stderrTail: "<tail of its stderr>" }\`.`,
      { agentType: NS + 'war-refiner', phase: 'Refine', label: `polish-worktree:phase-${ph.id}`, dispatchKind: 'polish-worktree', schema: ENV_OUTCOME, ...spawn('refiner') })
    } catch (err) {
      const c = infraDeathCause(err)
      if (!c) throw err
      polishProvDeath = 'polish-worktree:phase-' + ph.id + ' provision dispatch died post-spawn (env-died): ' + c
      log('phase-close sweep: ' + polishProvDeath + ' — an environment event; fail-open, the not-ok drain arm below handles it.')
    }
    if (!polishProv || polishProv.ok !== true) {
      // Fail-open, never a hold (B/C): the polish worktree provisioning failed — skip the sweep
      // worker/panel/merge entirely and drain the queue to follow-up, exactly mirroring the
      // invalid-roster arm above. polishStatus stays 'skipped'; the pre-polish tip lands unchanged.
      // Dispatch-death drains (env-died throw OR a dead dispatch returning nothing) stamp the drain
      // cause on each demoted finding (d); a returned-but-not-ok env-outcome stays unstamped.
      const provDrainCause = polishProvDeath || (!polishProv ? 'polish-worktree:phase-' + ph.id + ' provision dispatch died (returned no result)' : null)
      log(`phase-close sweep: the polish worktree provisioning returned no env-outcome ok (${(polishProv && polishProv.stderrTail) || polishProvDeath || 'no result'}) — sweep skipped; draining the queue to follow-up.`)
      for (const f of phaseCloseQueue.splice(0)) {
        if (provDrainCause) stampDrainCause(f, 'polish-worktree:phase-' + ph.id, provDrainCause)
        demote(f, 'follow-up', 'demote:sweep-skipped — ' + (provDrainCause || 'sweep skipped — the polish worktree provisioning did not return { ok: true }'))
      }
    } else {
    // 2. ONE war-worker dispatch: the queued findings VERBATIM + the intent + the merged tasks' plan slices.
    // pt-tagged prompt-feeding row builder (sweep prompt, top-level-catch, fail-open polish): t.id entry-validated
    // (bare); ${t.planSlice ?? …} absence-tolerant (Q17/ADR 0034) — since D5's entry-validation
    // TASK-FIELD class refuses a missing planSlice at intake, this fallback is defense-in-depth only.
    const mergedSlices = tasks.filter(t => succeeded.has(t.id)).map(t => pt`- ${t.id}: ${t.planSlice ?? '(no slice)'}`).join('\n')
    // dispatchAgent + catch (Phase 6 Task 1 (c)): a POST-SPAWN harness death of the sweep dispatch
    // classifies env-died SOFT — sweep stays null, so blockedReason() routes the existing fail-open
    // DISCARD arm (sweepWhy), with the drain cause stamped on each demoted finding (d). A non-infra
    // throw rethrows into the top-level catch → held:workflow-error, exactly as before.
    let sweep = null
    let sweepDeath = null
    try {
    sweep = await dispatchAgent(
      pt`PHASE-CLOSE COHERENCE SWEEP for WAR phase ${ph.id} "${ph.title}". Work in the ALREADY-PROVISIONED polish worktree at ${polishWorktree} (branch ${polishBranch}, cut at the post-merge integrated tip of ${ph.integrationBranch}) — do NOT create it yourself and do NOT set any worktree env var; cd there.\n`
      + intentClause
      + pt`Fix ONLY the queued findings below — NO ad-hoc seam hunting (the bounded, enumerated scope is what makes discard-on-reject a sufficient guard), NEVER touch version/release-slot literals, make EXACTLY ONE commit whose message cites each finding's title, keep the gate (${plan.gate}) green, and push ${polishBranch}.\n`
      + pt`Queued findings (verbatim):\n`
      // pt-tagged prompt-feeding rows (sweep prompt, top-level-catch, fail-open polish): f.severity is a required
      // finding field (bare); title/task ?? absence-tolerant; file/rationale/suggested_fix already guarded/defaulted.
      + phaseCloseQueue.map((f, i) => pt`${i + 1}. [${f.severity}] ${f.title ?? ''} (task ${f.task ?? '?'}${f.file ? pt`, ${f.file}` : ''}${f.line ? ':' + f.line : ''}) — ${f.rationale || ''}${f.suggested_fix ? pt` → ${f.suggested_fix}` : ''}`).join('\n') + pt`\n`
      + pt`Merged tasks' plan slices (context for cross-task coherence at the integrated tip):\n${mergedSlices || '(none)'}`
      + provisionClause,
      // #817: this dispatch is DELIBERATELY non-tiered — the phase-close sweep is a fresh phase-scope
      // coherence worker over absorb findings, NOT a per-task fix follow-up, so it inherits the base worker,
      // never agents.worker.fix. (The three fix-follow-up classes — fix:/ace:/add-test:|package-it: — are
      // tier-aware via spawnWorker('fix'); this one intentionally is not. The only other non-tiered base
      // spawn is the fallback inside spawnWorker itself — the tier resolver, definitionally correct.)
      { agentType: NS + 'war-worker', phase: 'Work', label: `polish:phase-${ph.id}`, schema: WORKER_RESULT, ...spawn('worker') })
    } catch (err) {
      const c = infraDeathCause(err)
      if (!c) throw err
      sweepDeath = 'polish:phase-' + ph.id + ' sweep dispatch died post-spawn (env-died): ' + c
      log('phase-close sweep: ' + sweepDeath + ' — an environment event; fail-open, the DISCARD arm below handles it.')
    }
    // 3. Full auditRound panel re-audit at the polish SHA — same unanimity rules as any task.
    const sweepWhy = sweepDeath || blockedReason(sweep)
    let sweepApproved = false
    // Sweep-raised finding routing (D1/D2, #1377): the re-audit panel's Minor/Nit findings, hoisted
    // out of the `if (!sweepWhy)` block (pSeats is block-scoped there) so BOTH terminal arms below
    // can route them through the disposition ladder — nothing sweep-raised may enter `aced`,
    // `aceable`, or `phaseCloseQueue` (the sweep is the phase's terminal fix round; there is no later
    // round to land an absorb). Critical/Major keep today's visibility: they block re-approval and
    // ride the `polish-rejected`/`polish-discarded` auditLog entries. Vacuous arms: blocked (sweepWhy
    // — no panel convened), skipped (invalid roster / failed provisioning — the sweep never
    // dispatched), and held (the held-phase drain above) never reach these arms with a convened
    // panel, so no sweep-raised findings exist there and this stays empty.
    let sweepMinors = []
    if (!sweepWhy) {
      const { seats: pSeats, expected: pExpected } = await auditRound(polishTask, null, sweep && sweep.tests ? sweep.tests : null, sweep && sweep.head_sha)
      sweepApproved = allApprove(pSeats, pExpected) && blockingOf(pSeats).length === 0
      sweepMinors = minorsOf(pSeats).map(f => ({ task: polishTask.id, ...f }))
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
      pmr = await dispatch(
        pt`Merge WAR polish branch ${polishBranch} into ${ph.integrationBranch} at the serial merge queue's tail. mode=merge-task.\n`
        + reattachClause(refineryLandPath)
        + pt`  (a) REBASE in the POLISH worktree: git -C ${polishWorktree} rebase ${ph.integrationBranch} (the branch was cut at the integrated tip, so this is normally a no-op).\n`
        + pt`  (b) MERGE in _refinery: cd ${refineryLandPath} (on ${ph.integrationBranch}), then git merge ${polishBranch} (fast-forward merge). Push.\n`
        + pt`Run the gate (${plan.gate}) after the rebase in the polish worktree; run the gate with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)). The polish commit is a coherence sweep, not a mapped-test task — skip assert-test-in-diff.sh AND skip the packaging floor assert-packaging-in-diff.sh AND skip the done-when floor assert-done-when.sh: those three are task-field-gated and a coherence sweep has no task fields to consult. The submodule floor and the Budget-Raise floor are NOT among the skips — both are unconditional, consult no task fields, and still run (invocations below). This sweep is class-exempt — on gate failure return gate_failed (no classification); the Workflow fail-open DISCARDS. On conflict return conflict; never force.`
        + pt` Before the _refinery merge step (b), run assert-no-submodule-mutation.sh ${ph.integrationBranch} ${polishBranch} — always BARE: a coherence sweep is never a declared gitlink bump, so the relax-flag is never threaded here. Exit 1 → return { mode: 'merge-task', status: 'submodule-blocked' }, do NOT merge; exit 2 → return { mode: 'merge-task', status: 'error' }.`
        + pt` Also run assert-budget-raise-cited.sh ${ph.integrationBranch} ${polishBranch} (ALWAYS — it is unconditional and consults no task fields; exit 1 → return { mode: 'merge-task', status: 'no-test', floor_route: 'budget-uncited' }, do NOT merge — the Workflow fail-open DISCARDS the sweep; exit 2 → return { mode: 'merge-task', status: 'error' }).`,
        { agentType: NS + 'war-refiner', phase: 'Refine', label: `merge:p${ph.id}-polish`, schema: MERGE_RESULT, ...spawn('refiner') })
    }
    if (sweepApproved && pmr && pmr.status === 'merged') {
      polishStatus = 'merged'
      const polishSha = (typeof sweep.head_sha === 'string' && sweep.head_sha) ? sweep.head_sha : '(polish sha unrecorded)'
      log(`phase-close sweep MERGED at ${polishSha} — the land proceeds on the polished tip; ${phaseCloseQueue.length} queued finding(s) absorbed.`)
      // RESIDUAL, ruled (#1944-class): every queued finding is recorded aced on the panel's
      // re-approval alone — no per-finding evidence the polish commit reached its file. The
      // recordAcedTouched comment cross-references this ruling.
      for (const f of phaseCloseQueue.splice(0)) recordAced(f, polishSha)
      // TERMINAL-PASS CHARGE SITE (reserved, D5 / Phase 5): the one-hop terminal pass after the
      // polish merge charges the polish task's absorbRounds here and carries an `Ace-Charge`
      // trailer on its single commit — telemetry, never a gate. No dispatch yet.
      // Merged-arm routing (#1377): sweep-raised Minor/Nits route by disposition — an absorb (incl.
      // fileless) demotes because the sweep is the phase's terminal fix round; absorb has no later
      // round. A sweep-raised ask still parks (#1550) — the Checkpoint gate has no terminal round.
      if (sweepMinors.length) log('intake floor not run on the merged sweep arm for the polish pseudo-task ' + polishTask.id + ' (no diff probe) — filed seat rows carry demote:floor-skipped (D4).')
      for (const f of sweepMinors) {
        const d = dispositionOf(f, null)   // the polish pseudo-task has no diff probe — the old default
        if (d === 'ask') parkAsk(f)                 // ask precedes the absorb chain (#1550, D7)
        else if (d === 'follow-up') { f.floorSkipped = true; minorsFiled.push(f) }   // no intake floor ran here: stamp the floor-skip so the filed row carries demote:floor-skipped (logged once above)
        else if (d === 'note') notes.push(f)
        else demote(f, 'follow-up', "demote:terminal-pass — sweep-raised absorb — the phase-close sweep is the phase's terminal fix round; absorb has no later round to land")
      }
    } else {
      // DISCARD: the polish branch + _polish worktree are LEFT IN PLACE (never-lose-unmerged-commits;
      // reaping is a human act). The queue demotes to follow-up; the pre-polish tip lands exactly as
      // it would have — a discarded sweep recomputes NOTHING (no re-gate, no land-decision change).
      polishStatus = 'discarded'
      log(`phase-close sweep DISCARDED (${sweepWhy || (sweepApproved ? `polish merge returned ${pmr && pmr.status || 'no result'}` : 'the panel did not re-approve')}) — polish branch ${polishBranch} and worktree ${polishWorktree} left in place; queue demotes to follow-up.`)
      auditLog.push({ task: polishTask.id, verdict: 'polish-discarded', branch: polishBranch, findings: [], blocked: sweepWhy || null })
      // Dispatch-death drains stamp the drain cause (d): the env-died throw (sweepDeath) or a dead
      // dispatch that returned nothing; a live sweep discarded on panel/merge grounds stays unstamped.
      const sweepDrainCause = sweepDeath || (!sweep ? 'polish:phase-' + ph.id + ' sweep dispatch died (returned no result)' : null)
      for (const f of phaseCloseQueue.splice(0)) {
        if (sweepDrainCause) stampDrainCause(f, 'polish:phase-' + ph.id, sweepDrainCause)
        demote(f, 'follow-up', 'demote:sweep-discarded — ' + (sweepDrainCause ? sweepDrainCause + ' — the polish branch never merged; the pre-polish tip lands' : 'phase-close sweep discarded — the polish branch never merged; the pre-polish tip lands'))
      }
      // Discard-arm routing (#1377): sweep-raised Minor/Nits route through the same ladder — an
      // absorb demotes because the polish branch never merged (nothing to absorb into). A blocked
      // sweep (sweepWhy) reaches here with NO panel convened, so sweepMinors is empty — vacuous.
      // A sweep-raised ask still parks (#1550): the ruling gate is Lead-side, not branch-bound.
      if (sweepMinors.length) log('intake floor not run on the discard sweep arm for the polish pseudo-task ' + polishTask.id + ' (no diff probe) — filed seat rows carry demote:floor-skipped (D4).')
      for (const f of sweepMinors) {
        const d = dispositionOf(f, null)   // the polish pseudo-task has no diff probe — the old default
        if (d === 'ask') parkAsk(f)                 // ask precedes the absorb chain (#1550, D7)
        else if (d === 'follow-up') { f.floorSkipped = true; minorsFiled.push(f) }   // no intake floor ran here: stamp the floor-skip so the filed row carries demote:floor-skipped (logged once above)
        else if (d === 'note') notes.push(f)
        else demote(f, 'follow-up', 'demote:sweep-discarded — sweep-raised absorb — the phase-close sweep was discarded; the polish branch never merged')
      }
    }
    }
  }
}

// Reland-loop transient-vs-divergence discrimination (Task 1.2 / D4). BYTE-PARALLEL with
// skills/war/references/refiner-recovery.md (the standing copy — evicted from war-refiner.md
// §land-phase by Task 4.1, which left a trigger pointer on the card; grep parity — the
// mirror-drift hazard, spec §8): both surfaces
// state the identical discrimination AND the identical +1 budget. Shared here so all three land prompts
// (in-flow, baseline-proceed re-land, environment-proceed re-land) cannot drift from each other. A resolved
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
  // Segmented-land marker instruction (Phase 6 Task 1 (a), A6 REVISED): an IN-BAND field riding the
  // existing 'error' status (the floor_route precedent) — never a new MERGE_RESULT status member or
  // KNOWN_LAND_DECISIONS member (land-decision.mjs untouched, ADR 0005). The bounded re-dispatch loop
  // below follows the FLOOR_STATUSES retry-loop idiom (the merge-task floor sub-loop's shape).
  const segmentedLandClause =
    pt`\nSEGMENTED LAND (tool-timeout survival): if you are FORCED to return before the land completes — e.g. the gate run outruns your tool timeout mid-step — do NOT classify the partial run (an interrupted gate is INCOMPLETE, not gate_failed): return { mode: 'land-phase', status: 'error', land_segment: 'incomplete', segment_note: '<the step you reached>' }. The land_segment marker rides the existing 'error' status — never a new status member — and the Workflow re-dispatches this land to run to completion; every step above is idempotent (re-detach, re-merge, re-gate), so a continuation is always safe.`
  const landPrompt =
    pt`Land WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff (one phase commit). mode=land-phase.\n`
    + pt`Perform the land entirely inside the _refinery worktree at ${refineryLandPath} (spec §5.3, push-first CAS):\n`
    + reattachClause(refineryLandPath)
    + pt`  1. In ${refineryLandPath}: detach HEAD at origin/${ph.workingBranch} (`
    + pt`\`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`). `
    + pt`This is the detached land — never checkout the working branch by name in _refinery.\n`
    + pt`  2. Merge: \`git -C ${refineryLandPath} merge --no-ff ${ph.integrationBranch}\` (one phase commit). Run the gate (${plan.gate}) with TMPDIR set to a freshly-created, .war-task-free directory (created outside any worktree — e.g. TMPDIR=$(cd / && mktemp -d)), so any meta-test that materialises scratch dirs isolates from the worktree's .war-task marker; the gate's cwd stays the _refinery land worktree. On gate failure return gate_failed.\n`
    + classificationClause(refineryLandPath, pt`the detached origin/${ph.workingBranch} tip the merge lands onto (\`git -C ${refineryLandPath} rev-parse origin/${ph.workingBranch}\`) — a stacked working branch carries prior plans' content the phase integration base lacks, so the land uses the working tip, NOT the integration base`)
    + baselineDebtClause()
    + pt`  3. Push-first CAS: run \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\` where <merge-sha> is HEAD in _refinery after the merge.\n`
    + pt`     - On clean push success (exit 0 from land-advance): the land succeeded. Return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }.\n`
    + pt`     - On reland exit code (rejected push — origin/${ph.workingBranch} moved): re-fetch origin/${ph.workingBranch}, re-merge, re-run gate, retry land-advance. `
    + pt`Repeat up to roundLimit (${roundLimit}) times total.\n`
    + relandDiscrimination(ph.workingBranch)
    + pt`     - On escalate exit code from land-advance (any non-rejection push error): return { mode: 'land-phase', status: 'error' }.\n`
    + pt`Never use --force push. Never merge or push from the Lead's main checkout.`
    + submodLandNote
    + segmentedLandClause
  landResult = await dispatch(landPrompt,
    { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}`, schema: MERGE_RESULT, ...spawn('refiner') })
  // ---- SEGMENTED-LAND BOUNDED RE-DISPATCH (Phase 6 Task 1 (a), A6 REVISED) ----
  // The land dispatch survives a gate outrunning the tool timeout via the in-band
  // land_segment:'incomplete' marker on the land-phase result. Re-dispatch while the marker persists,
  // bounded by roundLimit (the FLOOR_STATUSES retry-loop idiom — the land dispatch had no retry loop
  // before this; new wiring following that existing shape). Exhaustion falls through to the routing
  // chain below, where the final still-incomplete result routes by its RIDDEN status ('error' →
  // held:land-failed — the Lead re-runs the land per SKILL.md §4.3). Log lines are
  // concatenation-built (census-safe).
  let landSegments = 0
  while (landResult && landResult.land_segment === 'incomplete' && landSegments < roundLimit) {
    landSegments++
    log('Phase ' + ph.id + ': segmented land — the land dispatch returned the in-band land_segment:\'incomplete\' marker (' + (typeof landResult.segment_note === 'string' && landResult.segment_note ? landResult.segment_note : 'no segment note') + '); re-dispatching the land to run to completion (segment ' + (landSegments + 1) + ', bounded by roundLimit ' + roundLimit + ').')
    landResult = await dispatch(
      pt`SEGMENTED-LAND CONTINUATION for WAR phase ${ph.id}: a prior land dispatch returned mid-land with land_segment: 'incomplete' (its gate outran the tool timeout). Every step below is idempotent — a merge already performed re-resolves clean, a green gate re-runs green — so run the FULL sequence to completion.\n` + landPrompt,
      // label is concatenation-built (census-safe — #931): the registry lives in Task 2's file.
      { agentType: NS + 'war-refiner', phase: 'Land', label: 'land:phase-' + ph.id + ':segment-' + (landSegments + 1), schema: MERGE_RESULT, ...spawn('refiner') })
  }
  if (landResult && landResult.land_segment === 'incomplete') {
    log('Phase ' + ph.id + ': segmented-land budget exhausted after ' + roundLimit + ' re-dispatch(es) — the final still-incomplete result routes by its ridden status below (error → held:land-failed; the Lead re-runs the land).')
  }
  // 2B submodule PR-and-hold: the refiner opened a PR on the submodule remote and returned
  // status:'submodule-pr'. Return held:submodule-pr DIRECTLY — like held:workflow-error, this
  // bypasses decideLand/HARD_ESCALATION_REASONS. The PR ref is captured for the Lead's gh-resume.
  // ponytail: direct return pattern mirrors held:workflow-error (DP2 — no HARD_ESCALATION_REASONS cascade)
  if (landResult && landResult.status === 'submodule-pr') {
    escalated.push({ task: `phase-${ph.id}-land`, reason: 'submodule-pr', pr_number: landResult.pr_number, pr_remote: landResult.pr_remote, detail: landResult })
    landDecision = 'held:submodule-pr'
  } else
  // If the land agent returns land_stale (CAS-exhaustion), treat it as a hard escalation.
  // #236: 'no-test'/'unpackaged'/'done-unmet' are structurally UNREACHABLE here — no land-phase
  // prompt emits them (land statuses are only landed/land_stale/gate_failed/error/submodule-pr, and
  // submodule-pr is short-circuited by its own direct-return guard above this check). The array is
  // REUSED from the merge-task escalation path where those floor statuses ARE load-bearing, so it is
  // kept intact, not narrowed. land-decision.test.mjs's MERGE_TASK_FLOOR_ONLY partition pin is the
  // mechanical arbiter of that set (the drift-guard in war-config.test.mjs pins the inline array to
  // the canonical export).
  if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult.status, detail: landResult })
    landDecision = 'held:escalation'
  } else if (landResult && landResult.status === 'gate_failed' && classOf(landResult) === 'environment') {
    // 'environment' land gate failure (spec §6 / ADR 0019): the land failed transiently, not by a code
    // defect. BOUNDED retry — dispatch EXACTLY ONE environment-proceed re-land whose gate must go FULLY
    // GREEN in a fresh env (no proceed-over, no debt, no source:'auto' backstop). Exhaustion (a 2nd
    // 'environment' classification) falls back to today's reason 'env-blocked' + held:land-failed, with
    // the retry provably spent — the Lead re-runs the land. Bounded at ONE: no chaining into
    // baseline-proceed. No enum change; every landDecision literal below is already emitted.
    const reLand = await dispatch(
      pt`ENVIRONMENT-PROCEED re-land for WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff. mode=land-phase.\n`
      + reattachClause(refineryLandPath)
      + pt`The prior land gate failure was classified gate_failure_class:'environment' — a TRANSIENT environment failure, proven NOT to reproduce in a fresh environment, NOT a defect introduced by this phase. This is the bounded environment-proceed retry: exactly ONE re-run, and the gate must come back fully green — never a proceed-over.\n`
      + pt`  1. Detach at origin/${ph.workingBranch}: \`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`.\n`
      + pt`  2. Merge --no-ff ${ph.integrationBranch}; run the gate (${plan.gate}) in a FRESH shell with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)). The gate MUST GO FULLY GREEN: this is a clean re-run, NOT a proceed-over — nothing is waived, no failure is proceeded past, no debt is recorded. ANY remaining failure → return { mode: 'land-phase', status: 'gate_failed' } classifying it afresh in gate_failure_class.\n`
      + pt`  3. Push-first CAS: \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\`. Reland up to roundLimit (${roundLimit}); error on a non-rejection push error. On success return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }. Never --force.\n`
      + relandDiscrimination(ph.workingBranch)
      + submodLandNote,
      { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}:environment-proceed`, schema: MERGE_RESULT, ...spawn('refiner') })
    // 2B submodule PR-and-hold, newly reachable from this re-land now that it carries the submodule-phase
    // land note: mirror the initial land's direct-return guard. Without this arm the return would fall to
    // the held:land-failed else, mislabelling the hold AND losing the PR ref the Lead's gh-resume reads.
    // #1245: the reassignment below completes that mirror. The initial land holds it BY CONSTRUCTION (its
    // dispatch result IS landResult), so its 2B hold returns the submodule-pr MergeResult with pr_number /
    // pr_remote readable; this arm dispatches into its own receiver, so without the hand-off the phase
    // would return the STALE first (gate_failed) attempt while the escalation record says submodule-pr.
    // Inert on every other path: the tipSha anchor, the Wrap-up servitor gate and the handoff block are
    // all status:'landed' / landDecision-gated and read identically before and after. The count-keyed
    // arm-symmetry pin in workflow-template.test.mjs is the arbiter: a re-land arm added without this
    // reassignment goes red there.
    if (reLand && reLand.status === 'submodule-pr') {
      landResult = reLand
      escalated.push({ task: `phase-${ph.id}-land`, reason: 'submodule-pr', pr_number: reLand.pr_number, pr_remote: reLand.pr_remote, detail: reLand })
      landDecision = 'held:submodule-pr'
    } else if (reLand && reLand.status === 'landed') {
      landResult = reLand
      landDecision = 'landed'
      log(`Phase ${ph.id} landed via environment-proceed re-land (the transient environment-class gate failure did not recur; the gate went FULLY green — nothing waived, no debt recorded). Opportunistic resync as on any landed phase.`)
    } else if (reLand && HARD_ESCALATION_REASONS.includes(reLand.status)) {
      escalated.push({ task: `phase-${ph.id}-land`, reason: reLand.status, detail: reLand })
      landDecision = 'held:escalation'
    } else if (reLand && reLand.status === 'gate_failed' && classOf(reLand) === 'environment') {
      // Bound exhausted: the ONE retry is spent — today's route, now with a proven-non-transient failure.
      escalated.push({ task: `phase-${ph.id}-land`, reason: 'env-blocked', detail: reLand })
      landDecision = 'held:land-failed'
    } else {
      // introduced OR baseline→introduced (bounded, no chaining) OR error → held:land-failed (Lead re-runs).
      escalated.push({ task: `phase-${ph.id}-land`, reason: reLand ? reLand.status : 'error', detail: reLand })
      landDecision = 'held:land-failed'
    }
  } else if (landResult && landResult.status === 'gate_failed' && classOf(landResult) === 'baseline') {
    // 'baseline' land gate failure: record the debt (deduped) + ONE source:'auto' backstop, then
    // dispatch ONE baseline-proceed re-land naming the classified ids. Route its result normally (a 2nd
    // gate_failed routes by class with 'baseline' treated as 'introduced' — bounded, no 2nd re-dispatch).
    recordBaselineDebt(landResult.gate_failing_ids, landResult.gate_base_sha)
    const reLand = await dispatch(
      pt`BASELINE-PROCEED re-land for WAR phase ${ph.id}: merge ${ph.integrationBranch} into ${ph.workingBranch} with --no-ff. mode=land-phase.\n`
      + reattachClause(refineryLandPath)
      + pt`The prior land gate failure was classified gate_failure_class:'baseline' — these failing identifiers are PRE-EXISTING at the detached origin/${ph.workingBranch} tip, NOT introduced by this phase: ${(landResult.gate_failing_ids || []).join(', ') || '(see gate_output)'}.\n`
      + pt`  1. Detach at origin/${ph.workingBranch}: \`git -C ${refineryLandPath} fetch origin ${ph.workingBranch} && git -C ${refineryLandPath} checkout --detach origin/${ph.workingBranch}\`.\n`
      + pt`  2. Merge --no-ff ${ph.integrationBranch}; run the gate (${plan.gate}) with a fresh TMPDIR (TMPDIR=$(cd / && mktemp -d)); PROCEED over EXACTLY those pre-existing baseline failures and populate gate_output UNCURATED. A NEW failure whose identifiers are NOT in that set is a real regression → return { mode: 'land-phase', status: 'gate_failed' } classifying the NEW failure.\n`
      + pt`  3. Push-first CAS: \`cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\`. Reland up to roundLimit (${roundLimit}); error on a non-rejection push error. On success return { mode: 'land-phase', status: 'landed', working_sha: '<merge-sha>' }. Never --force.\n`
      + relandDiscrimination(ph.workingBranch)
      + submodLandNote,
      { agentType: NS + 'war-refiner', phase: 'Land', label: `land:phase-${ph.id}:baseline-proceed`, schema: MERGE_RESULT, ...spawn('refiner') })
    // 2B submodule PR-and-hold, newly reachable from this re-land now that it carries the submodule-phase
    // land note: mirror the initial land's direct-return guard (same rationale as environment-proceed).
    // #1245: including the reassignment below — same arm-symmetry duty, same inertness on every other path.
    if (reLand && reLand.status === 'submodule-pr') {
      landResult = reLand
      escalated.push({ task: `phase-${ph.id}-land`, reason: 'submodule-pr', pr_number: reLand.pr_number, pr_remote: reLand.pr_remote, detail: reLand })
      landDecision = 'held:submodule-pr'
    } else if (reLand && reLand.status === 'landed') {
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
  } else {
    // ---- TERMINAL ELSE (spec decision 2; ADR 0005 reuse) — the land dispatch returned NO routable
    // result: a DEAD land agent (returned null — the observed transient-API 529 repro: the run
    // completed, landResult:null, handoff present) OR a non-null result whose status matched no routed
    // arm above. Route the EXISTING held:land-failed — no new enum member, land-decision.mjs untouched,
    // the emitted-superset comment above `let landResult = null` stays at 6. The Lead re-runs the land
    // per SKILL.md §4.3 root cause (c) dead land agent.
    // PARTITION NOTE: a land dispatch that THROWS routes held:workflow-error via the top-level catch
    // (HARD, no re-land) — that catch owns the thrown case; THIS arm owns only the returned-but-unrouted
    // case (the two partition the failure space, no overlap). The fallback reason mirrors the
    // baseline-proceed re-land's `reLand ? reLand.status : 'error'` idiom and is escalation metadata
    // only, never an enum member (a flat 'error' for the non-null unrouted case is equally acceptable —
    // spec §8 latitude).
    escalated.push({ task: `phase-${ph.id}-land`, reason: landResult ? String(landResult.status || 'error') : 'error', detail: landResult })
    landDecision = 'held:land-failed'
    log(`Phase ${ph.id}: dead or unrouted land dispatch (no routable land result) — held:land-failed; the Lead re-runs the land per SKILL.md §4.3.`)
  }
} else if (landDecision === 'held:escalation') {
  log(`Holding the land for phase ${ph.id}: ${escalated.length} escalation(s) need the Lead's decision.`)
} else {
  log(`Holding the land for phase ${ph.id}: no task merged cleanly (see escalations) — the Lead must resolve and land.`)
}

// ---- LANDED-TIP ANCHOR (hoisted; spec D1) — computed ONCE here, at TOP LEVEL between the land
// section's close and the Wrap-up gate, and consumed by BOTH the Wrap-up dispatch below and the
// handoff block further down (one source of truth, zero new tip semantics). Deliberately NOT inside
// the Wrap-up 'if': the handoff block also emits on held:escalation, where landResult can be NULL
// (land never dispatched) and an in-gate const would be undeclared there — the dereference would hit
// the top-level catch and turn the degraded path that most needs a handoff into held:workflow-error.
// The computation moved VERBATIM (its own landResult && … null-guard retained, truthy-string check on
// working_sha unchanged — no new SHA-shape validation), so handoff.tipSha is byte-identical to the
// pre-hoist value.
// tipSha: the landed working sha; degraded → the last confirmed merge tip; else null.
const lastPinned = [...mergedTasksForGateAudit].reverse().find(m => /^[0-9a-f]{7,40}$/.test(m.gateHeadSha || ''))
const tipSha = (landResult && landResult.status === 'landed' && typeof landResult.working_sha === 'string' && landResult.working_sha)
  ? landResult.working_sha
  : (lastPinned ? lastPinned.gateHeadSha : null)
// Pre-resolved BEFORE any interpolation: the pt tag throws on undefined and a bare null would render
// the literal "null" — the null case becomes the NAMED placeholder the grounding ladder's step 4
// routes on (ADR 0034; working_sha is contract-promised but not schema-required in MERGE_RESULT).
const landedTipAnchor = tipSha || 'landed tip unrecorded — ground via the gate-audit auditSha entries in your audit-log input'

// ---- WRAP-UP — capture durable learnings (war-servitor, write-scoped to the local memory root) ----
// Gate (spec §4, decision B): dispatch only when the phase landed AND memoryLocalRoot was threaded. An
// absent memoryLocalRoot (Setup's memory probe reported memory disabled / a legacy args shape) self-skips
// with a logged line — fail-open, never a crash, never a dispatch at an unanchored target. learningsTarget
// is deliberately NOT in this condition anymore: it is the read-path repo root, not a servitor write path.
let servitorResult = null
if (landResult && landResult.status === 'landed' && memoryLocalRoot) {
  servitorResult = await dispatch(
    pt`Wrap up learnings for WAR phase ${ph.id} "${ph.title}" (landed on ${ph.workingBranch}).\n`
    + pt`Landed tip: ${landedTipAnchor} on ${ph.workingBranch} (plan slug: ${planSlug || '<plan-slug>'}). This anchor — NOT your working directory — is what every referent read grounds on; see LANDED-TIP GROUNDING below.\n`
    + pt`Your ONLY writable path (your capability allowlist holds no Bash — Write/Edit only — and the PreToolUse scope hook gates those by agent_type to the local memory root): ${memoryLocalRoot}.\n`
    + pt`Every lesson file — regardless of metadata.type — is written under that local root. type: project marks a lesson PROMOTABLE (the Lead's Gate 2 promotes it into the repo root); NEVER write into any docs/learnings/ directory yourself — repo-root publication is the Lead's job, not yours.\n`
    + pt`Landed tasks: ${landed.join(', ') || 'none'}.\n`
    + pt`Audit log (verdicts + findings): ${JSON.stringify(auditLog)}\n`
    + pt`Escalations: ${JSON.stringify(escalated)}\n`
    + pt`Noted findings (disposition 'note' — MEMORY CANDIDATES, not issues; weigh each against the admission checklist below): ${JSON.stringify(notes)}\n`
    + intentClause + servitorMemClause()
    + pt`Capture only DURABLE, reusable learnings (gotchas, plan/code mismatches, deviations + why, patterns). Skip routine notes.\n`
    + pt`\n`
    // Prompt-surface simplification (Task 5.1): the five discipline blocks below are TOKEN SKELETONS —
    // the surviving canonical copy of each full text is the named agents/war-servitor.md section (the
    // standing card the dispatched servitor already carries). Every registry / both-surfaces anchor
    // token survives in place; the shrink removed only unanchored connective prose, never an anchor.
    + pt`Memory admission checklist — your standing card (agents/war-servitor.md, ## Memory admission checklist) carries the FULL text of the three disciplines; this skeleton keeps the decisive rules — follow ALL three before every write:\n`
    + pt`D1 DEDUP BEFORE WRITE: Glob the memory dir and read MEMORY.md (read-only) plus related candidates; if an existing covering file exists, update it in place rather than duplicating — BUT only when it bears a nested metadata.provenance value; a covering file WITHOUT one is user-authored — never edit it; write a new [[slug]]-cross-linked file instead. RECURRENCE ON A REPO LESSON: write the updated FULL COPY into your local root under the SAME slug with type: project; the Lead's Gate-2 promotion then OVERWRITES the same-slug repo file (overwrite-on-promote).\n`
    + pt`D2 TIER PRECEDENCE: a contradicting fact supersedes the stale entry only at the same or higher tier; user corrections outrank agent assertions; only a provenance-tagged file is supersession-editable — to contradict an UNTAGGED (user-authored) file, write a NEW file carrying the supersession note and leave the old file untouched.\n`
    + pt`D3 VERIFY-ON-WRITE: before recording any fact that names a file, flag, function, or symbol, confirm the referent via Read/Grep — found → tag metadata.provenance: code-verified plus the cue "verify still present before acting"; absent → keep metadata.provenance: agent-unverified plus an absence-note. PATH HYGIENE (both arms): every path written anywhere in lesson content is repo-relative for any referent tracked in this repo, or one of the three placeholders <repo-root> / <session-worktree> / <local-memory-root> for out-of-tree locations — never an absolute path rooted at a home directory or a checkout location (the fail-closed Gate-2 redaction lint demotes any type: project lesson carrying one). CARVE-OUT: path hygiene governs lesson content only — the ServitorResult files_written return contract (see RETURN below) still requires ABSOLUTE paths. Do not write snapshot facts that will rot silently.\n`
    + pt`LANDED-TIP GROUNDING — run this BEFORE any D3 verify-on-write read and before the FINDING-MATCH CHECK below. Your working directory is NOT assumed to be the committed tip (Refine reaps the task worktrees at phase close). Ground every referent read on the threaded Landed tip above via the card's four-rung ladder (### Landed-tip grounding), taking the FIRST rung that holds: (1) PREFLIGHT — resolve your cwd's .git and compare HEAD to the threaded tip; (2) WORKTREE LOOKUP — enumerate <repo-root>/.git/worktrees/* and match each entry by its gitdir PHYSICAL PATH containing this plan's slug, NEVER the bare entry name; (3) REF CHECK — a ref with NO live worktree is a dead end for Read (no Bash): spend no rounds on it; (4) GATE-AUDIT FALLBACK — trust the pinned auditSha verdicts (gateEvidence: true) in your audit-log input, and record anything else at metadata.provenance: agent-unverified with the checkout-topology evidence in the absence-note (which rung failed, and what your cwd HEAD actually was). NEVER assert a plan/code mismatch from a lagging view.\n`
    + pt`FINDING-MATCH CHECK (audit-log-sourced facts): a fix round may have removed an observed defect before land. Before recording a finding as a LIVE gotcha, re-Grep/Read the NAMED CONSTRUCT (the specific defect, not merely the file it lived in) at the landed tip — ground the read via LANDED-TIP GROUNDING above. Match → tag metadata.provenance: code-verified with the locate-cue. No match → record only the GENERIC PATTERN at metadata.provenance: agent-unverified with the note "audit finding resolved in a fix round before land — recorded as pattern, not live instance", and NEVER name the file/line as a current instance.\n`
    + pt`\n`
    + pt`Provenance tagging — tag EVERY memory file you write with metadata.provenance (nested under metadata:, next to type:). Use only the three canonical tiers: agent-unverified (default — the input is LLM-authored audit monologue), code-verified (D3 referent confirmed via Read/Grep), user-confirmed (operator/user explicitly confirmed). Retire legacy agent-observed: treat it as agent-unverified and never emit it going forward.\n`
    + pt`\n`
    + pt`RETURN: every path in your ServitorResult files_written MUST be an ABSOLUTE path under ${memoryLocalRoot} (the Lead's Gate-2 reconciliation is an absolute-prefix check; a relative or out-of-root path fails the phase loud).`,
    { agentType: NS + 'war-servitor', phase: 'Wrap-up', label: `wrap-up:phase-${ph.id}`, schema: SERVITOR_RESULT, ...spawn('servitor') })
} else if (landResult && landResult.status === 'landed' && !memoryLocalRoot) {
  log(`Phase ${ph.id} landed but no memoryLocalRoot was threaded (memory disabled / legacy args) — Wrap-up skipped; no servitor dispatched.`)
}

// ---- FILE-FOLLOWUPS DISPATCH (D1/D2/D3, #1331) — the Workflow files its own follow-up-routed
// findings. Consumes minorsFiled ONLY — parked asks[] records are structurally excluded from this
// consolidation and this filing dispatch (#1550: an unruled ask is NEVER filed; ruled asks file
// Lead-side at the Checkpoint with filing parity). Fires on BOTH handoff-emitting paths (landed AND
// held:escalation) AND on held:land-failed (Phase 6 Task 1 (b): a failed land must never silently
// un-run the filing — merged tasks' follow-up debt exists regardless of the land outcome; no handoff
// emits there, so the stamped issue numbers ride the top-level return's minorsFiled instead),
// only when minorsFiled is non-empty; placed AFTER the land decision resolves and BEFORE the handoff assembly so the
// stamped issue numbers reach the assembly's `issue: m.issue ?? null` mapping (the assembly itself
// is byte-unchanged). Refiner-executed — the Bash-capable seat that already performs gh writes; the
// options mirror the endstate-check dispatch idiom (D18). FAIL-OPEN (D2): a dead/thrown dispatch, a
// failed preflight, or a non-conforming return leaves unmatched entries issue: null with ONE log()
// line — landDecision untouched, never a hold; the Checkpoint floor (skills/war/SKILL.md
// § Checkpoint) is the catch. Dedup-first (D3) makes a resume/relaunch re-dispatch safe: an
// open-issue match gets this batch's finding as a corroboration comment (the retired-token sweep's
// dedup idiom) and reuses the existing issue number, never a duplicate. Consolidation-first
// (Task 2.1, #1566): minorsFiled is deterministically collapsed above before the rows render, and
// the agent clusters the survivors by file + root cause — one issue per cluster, so several rows
// may share one issue number (ordinal→issue stamping semantics unchanged).
// mergedRowsOf (D9's class, Phase 5 Task 1 fix round): `merged` rides minorsOf's wholesale spread
// like any other auditor key (the finding items schema is non-strict — the AUDIT_VERDICT comment
// records the deriver fallback), so ELEMENTS are auditor-controlled too, not just the container. An
// element-level deref (`x.seat`) on an auditor-supplied `merged: [null]` at the consolidation log
// line or the handoff followUps projection sits OUTSIDE the local filing try — caught only by the
// top-level held:workflow-error catch, converting a LANDED phase and destroying the handoff. Guard
// element shape at every read: array-normalize the container, drop non-object elements. Hoisted
// above BOTH consumer blocks (the filing block's braces close before the handoff assembly opens).
const mergedRowsOf = m => (Array.isArray(m.merged) ? m.merged : []).filter(x => x && typeof x === 'object')
if ((landDecision === 'landed' || landDecision === 'held:escalation' || landDecision === 'held:land-failed') && minorsFiled.length > 0) {
  // ---- FOLLOW-UP CONSOLIDATION (Task 2.1, #1566; D8 seat discrimination + merged[] fidelity, Phase 5
  // Task 1): deterministic pre-filing collapse of minorsFiled, in place (the handoff assembly below
  // reads the collapsed rows — cross-seat duplicates become ONE followUps entry). Key: same `file` +
  // `line` within ±FOLLOWUP_LINE_WINDOW; normalized-title fallback ONLY when `line` is absent on both
  // rows (a lined row never collapses into a lineless one). Fileless rows never collapse, and TWO ROWS
  // FROM THE SAME SEAT never collapse (D8 — a collapse is cross-seat corroboration; a seat repeating
  // itself is not corroboration, so the survivor's seats[] entries are distinct by construction).
  // First occurrence is the representative; merged rows carry a seats[] corroboration list (seatRef —
  // seat+task, both when present) AND a merged[] sub-list preserving each merged-away row's title and
  // rationale (rendered through the filing prompt, the issue-body instruction, handoff followUps, and
  // the consolidation log line — nothing merges away silently); a non-collapsed row renders its single
  // raising seat via seatRef (End state 9 — the lens is in hand on every row).
  const FOLLOWUP_LINE_WINDOW = 10
  const normTitle = t => String(t ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  // Concatenation-built strings throughout this block (census-safe — #931).
  // seatRef (D8): seat+task when both are present; seat alone; 'task <id>' fallback; the
  // 'unattributed' terminal arm for seatless, taskless rows is a LIVE contract the filing prompt's
  // Evidence-artifacts clause names verbatim — any change to this arm changes that clause (and its
  // file-followups.md mirror) in the same commit.
  const seatRef = f => f.seat != null
    ? (f.task != null ? f.seat + ' (task ' + f.task + ')' : f.seat)
    : (f.task != null ? 'task ' + f.task : 'unattributed')
  // Array.isArray (not truthiness): auditor-supplied JSON can carry a non-array `seats` key — a
  // string would throw on .push/.includes below, and a throw here is caught only by the TOP-LEVEL
  // held:workflow-error catch (the sole try enclosing this block), converting a LANDED phase into
  // held:workflow-error.
  const seatsOf = c => Array.isArray(c.seats) ? c.seats : [seatRef(c)]
  const collapsed = []
  for (const f of minorsFiled) {
    const hit = f.file ? collapsed.find(c => !seatsOf(c).includes(seatRef(f)) && c.file === f.file
      && (Number.isFinite(c.line) && Number.isFinite(f.line)
        ? Math.abs(c.line - f.line) <= FOLLOWUP_LINE_WINDOW
        : c.line == null && f.line == null && normTitle(c.title) === normTitle(f.title))) : null
    if (hit) {
      hit.seats = seatsOf(hit)
      hit.seats.push(seatRef(f))
      // merged[] (D8): the merged-away row's title and rationale survive on the representative —
      // absence-tolerant defaults (schema-optional fields), never a throw. mergedRowsOf normalizes
      // the container AND drops auditor-supplied non-object elements at the single write point.
      hit.merged = mergedRowsOf(hit)
      hit.merged.push({ seat: seatRef(f), title: f.title ?? '(untitled finding)', rationale: f.rationale ?? '(no rationale recorded)' })
    } else collapsed.push(f)
  }
  if (collapsed.length < minorsFiled.length) {
    const mergedAway = collapsed.filter(c => mergedRowsOf(c).length)
      .map(c => mergedRowsOf(c).map(x => '[' + (x.seat ?? '(seat unrecorded)') + '] "' + (x.title ?? '(untitled finding)') + '" — ' + (x.rationale ?? '(no rationale recorded)')).join('; ') + ' (into "' + (c.title ?? '(untitled finding)') + '")').join(' | ')
    log('file-followups consolidation: ' + minorsFiled.length + ' follow-up rows collapsed to ' + collapsed.length + ' (file + ±' + FOLLOWUP_LINE_WINDOW + '-line window; title fallback when line absent; same-seat rows never collapse). Merged-away rows preserved on their survivors: ' + mergedAway)
    minorsFiled.splice(0, minorsFiled.length, ...collapsed)
  }
  // Agent-resolved '${CLAUDE_PLUGIN_ROOT}' literal idiom (the provision barrier's SCRIPT const
  // precedent): the single quotes on this line are JS STRING DELIMITERS — they are what keep the
  // ${...} literal out of the #931 untagged-backtick census, and they are never part of the string's
  // value. The prompt line below interpolates the path BARE (the canonical SKILL.md form) so the
  // dispatched refiner's shell expands $CLAUDE_PLUGIN_ROOT — emitting POSIX single quotes around the
  // path would suppress that expansion and 127 the preflight on a literal filename.
  const PREFLIGHT = '${CLAUDE_PLUGIN_ROOT}/skills/_shared/gh-preflight.sh'
  // ---- EVIDENCE ARTIFACTS (Task 3.2, PIN-14, #1658): per-task audit evidence rendered into the
  // candidate rows so each filed issue can carry its `## Evidence artifacts` section (the issue-side
  // evidence duty, ADR 0044 amendment) — all read from the auditLog already in hand at filing time:
  // the audit round from the task's audit-verdict entry's fixRounds, the pinned sha from its
  // post-merge gate-audit entry's gateHeadSha (the engine-stamped integration tip the task's gate
  // ran at — the landed tree that still carries the unabsorbed finding). A merged requiresTest:false
  // task has NO gate-audit entry (the D7 skip) — its pinned sha falls back to the landedShaByTask
  // retention landMerged stamped (its real landed integration tip), so a merged task never renders
  // 'unrecorded' (Phase 5 Task 1). Fail-open: a task with neither (e.g. a never-merged task filing
  // on the held:escalation path) renders 'unrecorded' — never invented, never a throw. A gate-audit
  // pseudo-task (`phase-<id>-integrated-tip` / `phase-<id>-end-state`, routeGateAuditRows) has no
  // auditLog entry under that id and no landedShaByTask key either — the row builder below falls
  // back to the row's own sanitized `sha` (auditShaOrSentinel) when this helper reads 'unrecorded'.
  const auditEvidenceOf = t => {
    const v = auditLog.find(e => e && e.task === t && typeof e.fixRounds === 'number')
    const g = auditLog.find(e => e && e.task === t && e.gateEvidence && typeof e.gateHeadSha === 'string' && e.gateHeadSha)
    return { round: v ? String(v.fixRounds) : 'unrecorded', sha: g ? g.gateHeadSha : (landedShaByTask.get(t) ?? 'unrecorded') }
  }
  // filedByOf (D13, PIN-15): the row's fixed-line prefix value — the DEMOTE_REASONS member leading an
  // engine-demoted row's reason (demote() guarantees one), demote:floor-skipped for a seat row the
  // intake floor never judged (a failed or absent diff probe, the escalation arm, or the sweep
  // panel's polish pseudo-task), else the seat's barrier tag (or 'none' when the seat cited none).
  const filedByOf = m => m.engineFiled === true
    ? ((DEMOTE_REASONS.find(p => typeof m.demoteReason === 'string' && m.demoteReason.startsWith(p))) || 'demote:unclassified')
    : m.floorSkipped === true ? 'demote:floor-skipped'
    : 'seat-filed (barrier: ' + (typeof m.barrier === 'string' && m.barrier ? m.barrier : 'none') + ')'
  let filingOut = null
  try {
    filingOut = await dispatch(
      pt`FILE-FOLLOWUPS DISPATCH for WAR phase ${ph.id} (you are the refiner; this is a gh-write batch — no merge, no push, never touch git state). `
      + pt`The follow-up-disposition audit findings below survived this phase unabsorbed; file each as a GitHub issue so nothing drops silently (ADR 0013).\n`
      + pt`FIRST the account preflight (ADR 0026): run ${PREFLIGHT} "${ghUser}" — an empty-string arg is its documented no-op (exit 0). On exit 2 (tooling error) or exit 3 (account mismatch): return what you have and file NOTHING.\n`
      + pt`THEN dedup (D3): run \`gh issue list --label war-followup --state open\` once; a row below matching an open issue (exact title, or same file + same root cause) is already filed — post this batch's finding as a corroboration comment on the existing issue, never a new issue, and reuse that existing issue number for the row.\n`
      + pt`THEN cluster the remaining candidate rows by file + root cause (the engine already collapsed same-file line-window duplicates; each row carries its file, line, and any seats corroboration) and file ONE \`war-followup\`-labelled issue per cluster, in row order — title from the cluster's lead row; body carrying, per member row, the why-not-absorbable reason, the task id, its seats as corroboration, and — when the row carries merged corroborations — each merged-away finding's title and rationale (the engine preserved them on the surviving row; they must reach the issue body, never drop)${ph.epicIssue ? pt`, and a reference to the phase epic #${ph.epicIssue}` : ''}.\n`
      // Evidence-artifacts emission clause (Task 3.2, PIN-14, #1658): the filed issues' evidence
      // duty — values are COPIED from the candidate rows below (the engine renders them per row from
      // the auditLog via auditEvidenceOf above), never reconstructed by the filing agent.
      // Lens extraction is the FAMILY-PREFIX rule (#1789) — standing mirror:
      // skills/war/references/file-followups.md (same commit; the lens-suffix fixture pins both legs).
      // Demote-reason prefix line (in-band-absorb-default D13, PIN-15) — standing mirror:
      // skills/war/references/file-followups.md (same commit). Every engine-filed issue body carries
      // its DEMOTE_REASONS prefix on a FIXED line; a seat-filed row carries its barrier tag, and a
      // seat row the intake floor never judged carries demote:floor-skipped.
      + pt`EACH filed issue's body carries, as its FIRST line, \`Demote-Reason: <value>\` copied verbatim from the row's \`filed-by\` field below — the engine's \`demote:<reason>\` prefix on an engine-demoted row, \`demote:floor-skipped\` on a seat row the intake floor never judged (a failed or absent diff probe, the escalation arm, or the sweep panel's polish pseudo-task), or \`seat-filed (barrier: <tag>)\` otherwise; a clustered issue lists one such line per member row.\n`
      + pt`EACH filed issue's body additionally ends with an \`## Evidence artifacts\` section carrying, per member row: the pinned sha (the integration tip the row's task was gate-audited at) — for a \`requiresTest:false\` task this is its landed integration tip (never gate-audited, the D7 skip) — the file path with its line when present, the raising seat lenses (from the row's seats list — every row renders one, the corroboration list on a merged row or the single raising seat otherwise; each seat entry's lens follows the FAMILY-PREFIX rule: a seat label whose FIRST \`:\`-segment is \`gate-audit\` yields the lens \`execution-evidence\` whatever its trailing segments (a phase-level segment like \`phase-1\` or a dispatch suffix like \`integrated-tip\`/\`end-state\` is never a lens); otherwise the lens is the trailing \`:<lens>\` segment, read before any \` (task <id>)\` attribution suffix — and a trailing \`:rebut\` is a dispatch label, never the lens: take the segment before it; a bare \`task <id>\`/'unattributed' entry verbatim), and the audit round — every value copied verbatim from the candidate rows below (\`unrecorded\` stays \`unrecorded\`, never invented). On the dedup arm, carry the same evidence lines inside the corroboration comment instead.\n`
      // pt-tagged prompt-feeding row builder (file-followups dispatch): title/rationale are
      // schema-optional and task is routing-stamped → ?? defaults (never a phase-killing throw here).
      // The title span is DELIMITED (quoted, `title:`-prefixed) so the dedup instruction's
      // exact-title match keys on the finding's own title — never the whole composite row, whose
      // leading ordinal would make dedup order-dependent across a relaunch. file/line/seats render
      // per row (Task 2.1) so the agent CAN cluster by file — title/task/rationale alone made
      // file-clustering impossible. seats gate is Array.isArray, NOT truthiness (D9, Phase 5 Task 1):
      // an auditor-supplied STRING seats key is truthy with a length, and String.prototype.join does
      // not exist — a truthiness gate would throw here and kill the whole batch; Array.isArray sends
      // the row down the seatRef fallback instead. merged[] (D8) renders per row so the filing agent
      // carries each merged-away title+rationale into the issue body.
      + minorsFiled.map((m, i) => { const ev = auditEvidenceOf(m.task); const pin = (ev.sha === 'unrecorded' && typeof m.sha === 'string' && m.sha) ? m.sha : ev.sha; return pt`  ${i + 1}. title: "${m.title ?? '(untitled finding)'}" · task ${m.task ?? '<task>'}${m.file ? pt` · file ${m.file}${m.line != null ? pt`:${m.line}` : ''}` : ''}${Array.isArray(m.seats) && m.seats.length ? pt` · seats: ${m.seats.join(', ')}` : pt` · seats: ${seatRef(m)}`}${mergedRowsOf(m).length ? pt` · merged corroborations: ${mergedRowsOf(m).map(x => '[' + (x.seat ?? '(seat unrecorded)') + '] "' + (x.title ?? '(untitled finding)') + '" — ' + (x.rationale ?? '(no rationale recorded)')).join('; ')}` : ''} · why not absorbable: ${m.rationale ?? '(no rationale recorded)'} · filed-by: ${filedByOf(m)} · audit round ${ev.round} · pinned sha ${pin}` }).join('\n') + '\n'
      + pt`Return ONLY { filed: [{ n, issue }], clusters: [{ ordinals, issue }] } — filed: n the row's 1-based ordinal above, issue the filed / commented-on / reused issue number (null when unfiled; every row of one cluster shares its issue number); clusters: your clustering manifest — every ordinal above in exactly ONE cluster's ordinals array (merge rows only, never split one). A partial/empty result is FAIL-OPEN: unmatched entries stay issue: null in the handoff and the Checkpoint floor catches them; never block.`,
      { agentType: NS + 'war-refiner', phase: 'Land', label: 'file-followups:phase-' + ph.id, dispatchKind: 'file-followups', schema: FOLLOWUP_FILING_RESULT, ...spawn('refiner') })
  } catch (err) {
    // Fail-open (D2): a THROWN filing dispatch must never convert a resolved land decision into
    // held:workflow-error — fall to the same dead-dispatch path as a null return (one log() below).
    filingOut = null
  }
  // Stamping (D2): each returned row with an in-range integer n AND a numeric issue stamps
  // minorsFiled[n-1].issue; out-of-range/non-numeric/absent rows are ignored. The handoff assembly's
  // `issue: m.issue ?? null` (byte-unchanged below) then renders the stamped values.
  const filedRows = (filingOut && Array.isArray(filingOut.filed)) ? filingOut.filed : null
  if (filedRows) {
    for (const row of filedRows) {
      if (!row || typeof row !== 'object' || !Number.isInteger(row.n)) continue
      if (row.n < 1 || row.n > minorsFiled.length || typeof row.issue !== 'number') continue
      minorsFiled[row.n - 1].issue = row.issue
    }
    // clusters[] manifest asserts (Task 2.1, #1566) — FAIL-OPEN, the non-conforming-return arm's
    // sibling: any violation gets ONE log() line; stamping above is already honored row-by-row,
    // landDecision untouched, never a hold. Asserted: (1) every post-collapse ordinal appears in
    // exactly one cluster (partition — the agent may only MERGE the engine's collapsed rows; an
    // ordinal in two clusters IS a split, an uncovered ordinal a drop); (2) distinct issue numbers
    // filed ≤ post-collapse rows (clustering can only shrink the issue count).
    const problems = []
    const clusters = Array.isArray(filingOut.clusters) ? filingOut.clusters : null
    if (!clusters) problems.push('clusters[] manifest missing from the filing return')
    else {
      const seen = new Map()
      for (const cl of clusters) for (const o of (cl && Array.isArray(cl.ordinals)) ? cl.ordinals : []) seen.set(o, (seen.get(o) || 0) + 1)
      for (let n = 1; n <= minorsFiled.length; n++) if ((seen.get(n) || 0) !== 1) problems.push('ordinal ' + n + ' appears in ' + (seen.get(n) || 0) + ' clusters (must be exactly one)')
      for (const o of seen.keys()) if (!Number.isInteger(o) || o < 1 || o > minorsFiled.length) problems.push('unknown ordinal ' + JSON.stringify(o))
    }
    const distinctIssues = new Set(filedRows.filter(r => r && typeof r.issue === 'number').map(r => r.issue)).size
    if (distinctIssues > minorsFiled.length) problems.push(distinctIssues + ' distinct issues filed exceed the ' + minorsFiled.length + ' post-collapse rows')
    if (problems.length) log('file-followups clusters manifest violation: ' + problems.join('; ') + ' — fail-open (stamped rows stand; landDecision untouched; the Checkpoint floor is the catch).')
  } else {
    log('file-followups: dead dispatch or non-conforming return — every unmatched handoff.followUps entry stays issue: null (fail-open, D2; the Checkpoint floor is the catch); landDecision untouched.')
  }
}

// ---- HANDOFF BLOCK (ADR 0013) — the machine-readable debt map the next phase's decompose reads.
// Emitted on 'landed' AND 'held:escalation' (degraded — an escalated phase still hands off; the next
// decompose needs the debt map most exactly then). OMITTED on 'held:workflow-error' (infra death —
// the ledger + issues are the record; there is no trustworthy return to render) and on the other
// holds (nothing landed to hand off).
let handoff = null
if (landDecision === 'landed' || landDecision === 'held:escalation') {
  // tipSha + lastPinned are HOISTED above the Wrap-up gate (see LANDED-TIP ANCHOR) — the Wrap-up
  // dispatch threads the same value. This block consumes them unchanged: Wrap-up fires only on
  // 'landed', a strict subset of this block's emit conditions, so the hoist widens nothing.
  // absorbed: aced provenance grouped by commit sha → [{ sha, findings: [title] }].
  const bySha = {}
  for (const a of aced) (bySha[a.sha] = bySha[a.sha] || []).push(a.finding && a.finding.title)
  // endState (D8, Task 3.2 — the FIVE-status set met | unmet | unverified | deferred | out-of-scope):
  // statuses keyed on the VERBATIM condition text, derived from TWO channels. Findings stay defect-only
  // (plan_ref-keyed; severity drives unmet/out-of-scope/deferred exactly as before) and rule first — a
  // Critical/Major can never be laundered by a met attestation. Then the POSITIVE endStateAttestations
  // channel: attested unmet > attested met > 'unverified'. A condition with NO attestation row from any
  // seat is 'unverified', NEVER a silent 'met'; a pin-mismatched per-task entry's rows are excluded
  // (the seat judged a different tree — its conditions fall to 'unverified'). Whole-pass absence stays
  // all-'deferred': no gate-audit ran ⇒ nothing verified ⇒ every claim is 'deferred', never a silent 'met'
  // — EXCEPT on a vacuous phase (tasks declared, zero landed), where the D5 clamp below runs FIRST and
  // lands every claim 'unverified' with the zero-tasks-ran note, never 'deferred' and never green.
  const gateEntries = auditLog.filter(e => e && e.gateEvidence)
  const gateFindings = gateEntries.flatMap(e => e.findings || [])
  const gateAttestations = gateEntries.filter(e => !e.pinMismatch)
    .flatMap(e => Array.isArray(e.endStateAttestations) ? e.endStateAttestations : [])
  const gateAuditRan = gateEntries.length > 0
  // Vacuous-phase clamp (D5, End state 10): this phase DECLARED tasks but ZERO landed — the tip
  // carries no work from this phase, so the land-barrier endstate must NEVER attest green: checks
  // executed at the unchanged tip (and any seat 'met' attestation read from them) prove nothing
  // about work the phase did not do. Every claimed condition lands 'unverified' with the
  // zero-tasks-ran note — clamped BEFORE both derivation channels. A deliberate zero-task
  // claims-bearing launch (tasks.length === 0, the ratified endStateBlock shape) is NOT vacuous
  // and keeps the two-channel derivation; landed includes barrier-recovered preMerged tasks, so a
  // fully-pre-merged recovery phase is not vacuous either.
  const vacuousPhase = (tasks || []).length > 0 && landed.length === 0
  if (vacuousPhase && endStateClaims.length) {
    log('endstate: vacuous phase — ' + (tasks || []).length + ' task(s) declared, zero landed: every claimed End-state condition lands unverified with the zero-tasks-ran note; the land-barrier endstate never attests green on a vacuous phase (D5).')
  }
  // Binding is whitespace/case-insensitive (#452): seats are told VERBATIM, but a plan_ref that
  // drifts only in whitespace/case must still bind its condition — never a silent 'met'.
  const normRef = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase()
  handoff = {
    tipSha,
    polish: polishStatus,
    absorbed: Object.entries(bySha).map(([sha, findings]) => ({ sha, findings })),
    // merged (D8, Phase 5 Task 1): a consolidated row's merged-away titles+rationales ride the
    // handoff entry too (ADDITIVE key, present only on rows the collapse merged into) — the debt
    // map carries full fidelity, nothing merges away silently. Read through mergedRowsOf (element
    // shape guard): this projection maps EVERY minorsFiled row and sits outside any local try — an
    // auditor-supplied `merged: [null]` deref here would convert a LANDED phase into
    // held:workflow-error and destroy this very handoff.
    // demoteReason / barrier / floorSkipped (in-band-absorb-default D4/D13, ADDITIVE keys — no exact-key
    // handoff validator exists): the filing provenance filedByOf renders on the prompt reaches the
    // machine-readable handoff too, so the Checkpoint can tell an engine demotion from a seat-filed row.
    followUps: minorsFiled.map(m => ({ issue: m.issue ?? null, reason: [m.title, m.rationale].filter(Boolean).join(' — ') || '(untitled finding)',
      ...(typeof m.demoteReason === 'string' && m.demoteReason ? { demoteReason: m.demoteReason } : {}),
      ...(typeof m.barrier === 'string' && m.barrier ? { barrier: m.barrier } : {}),
      ...(m.floorSkipped === true ? { floorSkipped: true } : {}),
      ...(mergedRowsOf(m).length ? { merged: mergedRowsOf(m).map(x => ({ seat: x.seat ?? '(seat unrecorded)', title: x.title ?? '(untitled finding)', rationale: x.rationale ?? '(no rationale recorded)' })) } : {}) })),
    // asks (#1550 — the NINTH handoff key, ADDITIVE beside the follow-ups row; no exact-key
    // validator exists or is introduced): the LOSSY projection of the parked unruled ask records —
    // question + fork + task/seat/sha provenance, minus the full finding row (the top-level
    // return's asks[] keeps it). This key is the Checkpoint strike-list ruling gate's input; the
    // absolute advance floor reads it (skills/war/SKILL.md § Checkpoint). A citation-matched ask
    // in an INTERACTIVE run additionally carries its `citationPrefill` (matched row + rationale +
    // executed sha + recommended ruling, #1879 RULING 1) so the strike list renders the
    // one-confirm prefill row.
    asks: asks.map(a => ({ task: a.task, seat: a.seat, sha: a.sha, question: a.question, fork: a.fork,
      ...(a.citationPrefill ? { citationPrefill: a.citationPrefill } : {}) })),
    notes: notes.map(n => ({ task: n.task, title: n.title })),
    endState: endStateClaims.map(condition => {
      // Vacuous-phase clamp first (D5, End state 10): 'unverified' + note, never green — evaluated
      // BEFORE gateAuditRan so an end-state-only seat's 'met' attestation on a vacuous tip cannot land.
      if (vacuousPhase) return { condition, status: 'unverified', note: 'zero tasks ran this phase (vacuous phase) — attestation withheld (D5)' }
      if (!gateAuditRan) return { condition, status: 'deferred' }
      const rel = gateFindings.filter(f => f && normRef(f.plan_ref) === normRef(condition))
      const att = gateAttestations.filter(a => a && normRef(a.condition) === normRef(condition))
      // Five-status ternary chain (D8): finding arms first (severity is evaluated BEFORE the
      // out-of-scope title/rationale arm, #1082), then the attestation arms; the terminal arm is
      // 'unverified' — no attestation row from any seat maps there, never to 'met'.
      const status = rel.some(f => f.severity === 'Critical' || f.severity === 'Major') ? 'unmet'
        : rel.some(f => /out-of-scope/i.test(`${f.title || ''} ${f.rationale || ''}`)) ? 'out-of-scope'
        : rel.length ? 'deferred'
        : att.some(a => a.status === 'unmet') ? 'unmet'
        : att.some(a => a.status === 'met') ? 'met'
        : 'unverified'
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

return { phase: phaseId, landed, escalated, minorsFiled, asks, aced, notes, pinTransfers, landResult, servitorResult, auditLog, landDecision, ...(handoff ? { handoff } : {}) }
} catch (err) {
  // A dead phase that self-reports. landed/escalated are whatever accumulated before the throw;
  // teardown is NOT run (git state kept for resume/inspection). NO handoff block here (ADR 0013):
  // infra death has no trustworthy return to render — the ledger + issues are the record.
  return { phase: phaseId, landed, escalated, minorsFiled, asks, aced, notes, pinTransfers, landResult: null,
           servitorResult: null, auditLog,
           landDecision: 'held:workflow-error',
           // recovery (D9, spec §9): an ADDITIVE field naming the sanctioned retry — held:workflow-error is
           // Lead/infra-side, so it retries via a FRESH Recovery relaunch (new runId), NEVER resumeFromRunId
           // (the journal replays the cached error). Conforms to the ratified "Resume vs. recovery
           // relaunch" prose (skills/war/references/resume-and-recovery.md). Existing consumers read
           // workflowError.message/stack and are unaffected.
           workflowError: { message: String(err && err.message || err), stack: err && err.stack,
             recovery: 'held:workflow-error is Lead/infra-side — retry via a fresh Recovery relaunch (new runId), never resumeFromRunId (the journal replays the cached error).' } }
}
