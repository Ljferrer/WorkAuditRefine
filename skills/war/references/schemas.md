# WAR data contracts

Every agent returns **only** its JSON object (no prose). The Workflow passes these as the `schema` to `agent()`, so the StructuredOutput tool validates and the model retries on mismatch.

## WorkerResult — `war-worker` and fix-workers
```jsonc
{ task_id, branch, worktree, head_sha,
  status: "implemented" | "blocked",
  tests: { added: ["path"], command: "uv run pytest ...", passed: true },
  acceptance_criteria_covered: ["criterion_id"],
  files_changed: ["path"],
  notes: "anything the auditor should know",
  blocked_reason?: "present iff status==blocked — the ambiguity/contradiction" }
```

## AuditVerdict — `war-auditor` (one per seat per round)
```jsonc
{ seat: "seat-1",
  lens: "correctness" | "cascading-impact" | "plan-faithfulness" | "<domain>",
  audit_sha: "<sha reviewed — verdict is pinned to it>",
  verdict: "approve" | "request_changes" | "escalate",
  findings: [ { severity: "Critical"|"Major"|"Minor"|"Nit",
                title, file, line?, rationale, suggested_fix?, plan_ref? } ],
  tests_verified: { exist: true, pass: true },   // anti-cheat
  confidence: "high" | "medium" | "low",          // low → widen to coven
  escalate_reason?: "present iff verdict==escalate — the plan is wrong/underspecified" }
```

## MergeResult — `war-refiner`
```jsonc
{ mode: "merge-task" | "land-phase",
  status: "merged" | "landed" | "gate_failed" | "conflict" | "error",
  branch, integration_sha?, working_sha?, conflict_files?, gate_output? }
```

## Gate rule (applied over AuditVerdicts)
- any open **Critical/Major** (any seat) → **blocks** → batched `FIX_NEEDED`
- any **escalate** → **halts** to the Lead
- **all `approve`**, no open Critical/Major, **same `audit_sha`** → merge-eligible (**convergent unanimity** — if HEAD moves, every seat re-confirms against the new SHA)
- split (mixed approve / request_changes) → **one rebuttal round** (each seat re-judges seeing peers' findings) → unanimous-approve | agreed-block (FIX_NEEDED) | still-split (escalate)

## ledger.json — run state at `.claude/teams/<run-id>/`
```jsonc
{ run_id, plan_file, working_branch, landing_branch, gate, created_at,
  phases: [ { id, title, epic_issue, integration_branch,
    status: "todo"|"running"|"landed"|"blocked",
    tasks: [ { id, issue, title, branch, worktree, deps: ["id"],
      lenses: ["correctness","cascading-impact","plan-faithfulness"], coven: false, plan_slice,
      status: "todo"|"working"|"audited"|"merged"|"escalated"|"blocked",
      audit_sha?, verdict?, merge_sha? } ],
    report?, escalations: [], minors_filed: ["issue#"] } ],
  pr_url? }
```

## GitHub conventions
- **Epic issue per phase**; **sub-issue per task** (GitHub sub-issues).
- Labels: `phase:<N>`, `status:todo|working|audited|merged|escalated|blocked`, `audit:1|coven`.
- **Minor/Nit** findings → new follow-up issues labeled `war-followup`, linked to the phase epic.
- Phase reports + escalations → **comments on the phase epic issue** (durable, human-visible).

## ServitorResult — `war-servitor` (once per phase, after land)
```jsonc
{ phase, target: "<learnings target path>",
  files_written: ["path"],
  learnings: [ { title, why } ],
  memory_index_updated: true }   // true if MEMORY.md (or docs/learnings index) was updated
```
The servitor writes ONLY under `learningsTarget` (the worktree-scope hook keys on its `agent_type` and confines it to the learnings path-pattern `*/.claude/projects/*/memory/*` or `*/docs/learnings/*`, [ADR 0002](../../../docs/adr/0002-scope-by-agent-type.md)); it never touches source, branches, PRs, or issues.

## Run config — `.claude/war/config.json` (optional)
Produced by `/war-room`, consumed by `/war`'s Setup. The schema, defaults, presets, and validation are owned by [`../assets/war-config.mjs`](../assets/war-config.mjs) (`--fill-defaults` to resolve a file, `--preset <name>` to emit a preset, `--stdin` to validate piped JSON). Absent this file, `/war` uses built-in defaults (pre-v0.3.0 behavior).
```jsonc
{ version: 1, profile: "balanced" | "thorough" | "economy" | "<custom>",
  agents: {                                  // model ∈ opus|sonnet|haiku|fable; effort ∈ default|low|medium|high|xhigh|max ("default" = inherit session)
    worker:   { model, effort },             // worker config also drives fix-workers
    auditor:  { model, effort },
    refiner:  { model, effort },
    servitor: { model, effort } },
  audit: {
    covenSize,                               // integer >= 1 — seats when a coven convenes
    lenses: ["correctness","cascading-impact","plan-faithfulness"],
    covenPolicy: "auto" | "all" | "solo",    // seeds per-task coven flags at the decompose gate
    autoEscalate: true },                    // 1->coven on a Critical/low-confidence lone seat; set false (with covenPolicy:"solo") to pin one auditor
  run: { roundLimit, afk },                  // roundLimit >= 1; afk = default for /war --afk
  overrides: { gate, workingBranch, landingBranch, learningsTarget } }  // null = let /war auto-detect
```
These reach the per-phase Workflow as `args.agents`, `args.audit`, `args.run` (the Lead threads them in after resolving the file); `overrides` are applied by the Lead during Setup. See [`../assets/workflow-template.js`](../assets/workflow-template.js).

## Workflow per-phase args contract
`args` may be passed as a **plain object or a JSON string**; the template auto-parses a string so the Lead need not manually inline structured data.

Optional `agentPrefix` (default `"work-audit-refine:"`) — the template auto-namespaces every `agentType` seat under this prefix via `const NS = args.agentPrefix ?? 'work-audit-refine:'`. Pass a different string to override; the Lead no longer needs manual namespacing workarounds.

Auditors receive the **absolute `task.worktree` path** so they can `Read` candidate files directly in the task's isolated checkout rather than the main repo tree.

### Provisioning args (refiner-owned worktree lifecycle)
The refiner's **Provision** barrier ([ADR 0001](../../../docs/adr/0001-explicitly-managed-worktrees.md)) and the per-task branch/worktree derivation read these fields off `args`:

| field | meaning |
|---|---|
| `planSlug` | plan-slug for the **plan-namespaced** branch names ([ADR 0003](../../../docs/adr/0003-plan-namespaced-branches.md)). The template derives each task's branch as `war/<planSlug>/p<phase>-<task>`. |
| `runId` | run id segment in the worktree **path** (`<worktreeRoot>/<runId>/<task>`); keeps concurrent runs' directories collision-free even when branch names share a slug. |
| `worktreeRoot` | absolute dir that holds the per-run worktrees (e.g. `<repo>/.claude/worktrees`). |
| `mainCheckout` | absolute path of the parent checkout — the cwd the barrier runs `ensure-exclude` from (probe E2: the `.claude/` exclude must be written in the **main** checkout, not a task worktree). |
| `ownedFile` | path to the run's owned-refs ledger, threaded to `ensure-integration --owned-file`; a `integration/<slug>/phase-N` that exists but is **not** in this ledger is a foreign collision → the script exits non-zero (fail-loud), distinguishing a resume from a cross-plan clash. |

`runDir` (= `.claude/teams/<runId>`) is the run-scope for `provision-worktrees.sh` teardown.

> **Footgun — `undefined` in prompts.** Branch/worktree are derived as
> `t.branch || (planSlug ? "war/<planSlug>/p<phase>-<task>" : t.branch)` and
> `t.worktree || ((worktreeRoot && runId) ? "<worktreeRoot>/<runId>/<task>" : t.worktree)`.
> If the Lead supplies **neither** a per-task `branch`/`worktree` on the task object **nor** the
> `planSlug` / `worktreeRoot` + `runId` args, the fallback is `undefined` and JS interpolation bakes
> the literal string `"undefined"` into the worker/auditor/refiner prompts (an unprovisionable branch
> name and a bogus path). Always thread `planSlug`, `runId`, and `worktreeRoot` (or set explicit
> `task.branch`/`task.worktree`).

## Workflow per-phase return

The per-phase Workflow returns:
```jsonc
{ phase,                              // phase id
  landed: ["task_id"],                // tasks merged onto the integration branch
  escalated: [ { task, reason, ... } ],
  minorsFiled: [ { task, ...finding } ],
  landResult,                         // MergeResult of the in-flow land, or null if held
  servitorResult,                     // ServitorResult, or null if the Workflow did not land/wrap up
  auditLog: [ { task, verdict, findings, blocked } ],   // fed to a Lead-driven wrap-up on the held path
  landDecision: "landed" | "held:escalation" | "held:nothing-merged" }
```
When `landDecision` is a `held:*` value the land was **not** performed in-flow; the Lead lands manually and then runs `war-servitor` (see SKILL.md). `held:nothing-merged` means no task merged cleanly and no hard escalation was raised (e.g. a lone `gate_failed`) — surfaced explicitly rather than silently skipped.
