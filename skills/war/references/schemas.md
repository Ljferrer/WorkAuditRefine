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

## MergeResult — `war-merge`
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

## ScribeResult — `war-scribe` (once per phase, after land)
```jsonc
{ phase, target: "<learnings target path>",
  files_written: ["path"],
  learnings: [ { title, why } ],
  memory_index_updated: true }   // true if MEMORY.md (or docs/learnings index) was updated
```
The scribe writes ONLY under `learningsTarget` (enforced by the worktree-scope hook with `WAR_WORKTREE=<learningsTarget>`); it never touches source, branches, PRs, or issues.
