---
name: war
description: Execute a detailed multi-phase implementation plan with a team of agents — Work, Audit, Refine, then capture learnings. Breaks plan phases into GitHub issues, then per phase spins up fresh worker agents in isolated git worktrees, independent read-only auditors (severity-gated, unanimous), a serial refine/merge queue, and a write-scoped servitor that wraps phase learnings into memory; lands each phase on a working branch and opens one PR to a landing branch at the end. Use when the user runs `/war <plan>`, wants to autonomously implement a multi-phase plan or spec, or mentions WAR, gastown-style orchestration, or a worker/auditor/refinery/witness team.
---

# WAR — Work · Audit · Refine

You are the **Lead** (the Mayor). You orchestrate and gate; you **never implement code yourself**. WAR is a Claude-native re-implementation of Gas Town's worker/auditor/refinery/witness model built on `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — no Go binary, no Dolt, no beads.

Full architecture: [references/design.md](references/design.md). Data contracts: [references/schemas.md](references/schemas.md). Gas Town lineage + tunables: [references/gastown-design-params.md](references/gastown-design-params.md).

## Quick start
```
/war <plan-file> [--working <branch>] [--landing <branch>] [--afk] [--config <path>]
```
Example: `/war docs/implement/implementation_plan_A.md --working dev/planA --landing master`

## Setup (once)
1. **Load the run config (if any).** If `.claude/war/config.json` exists (or the user passed `--config <path>`), resolve it: `node ${CLAUDE_PLUGIN_ROOT}/skills/war/assets/war-config.mjs <path> --fill-defaults`. If it exits non-zero, **stop and show the errors** (don't run with a broken config). Announce `using config from <path> (profile: <profile>)`. The resolved config supplies `agents`, `audit`, `run`, and any non-null `overrides`. With **no** config file, use built-in defaults — identical to pre-v0.3.0 behavior. The config is produced by `/war-room`.
2. Confirm a clean git repo with a GitHub remote and `gh` auth. Ask for the **working** and **landing** branches if not given (default working = current branch; landing = the repo's default branch). A non-null `overrides.workingBranch` / `overrides.landingBranch` wins over asking.
3. Detect the **gate command**: `pyproject.toml` → `uv sync && ruff check && pytest`; `package.json` → its lint/test scripts; else **ask once** and record it. A non-null `overrides.gate` wins. Never run a phase without a gate.
4. Determine the **learnings target** for the servitor: a non-null `overrides.learningsTarget` wins; else the agent-memory dir if present (`~/.claude/projects/<proj>/memory/` with `MEMORY.md`), else `docs/learnings/`. Record it.
5. Create the run ledger `.claude/teams/<run-id>/ledger.json` (+ a rendered `ledger.md`). It is the resumable source of truth; on resume, read it + open issues and continue.

## Decompose + approve — GATE (before any teammate launches)
1. Read the plan. Extract **phases** (prefer an explicit build-order/phase section, e.g. a "Build order"; else top-level sections) and propose the phase→task DAG.
2. Seed each task's coven from `audit.covenPolicy`: `all` → every task a coven (`covenSize` seats); `solo` → every task a single seat; `auto` (default) → flag high-blast-radius tasks for a **coven**, leaf/low-risk get 1. You can still edit any task's coven at this gate. (`autoEscalate` still widens a lone seat to a coven at runtime on a Critical/low-confidence finding unless it is `false`.)
3. Present the DAG to the user as an issues preview **and any per-phase Workflow patches** you intend to inject. **Wait for approval/edits.**
4. On approval, file **all phase epics up front** (labels `phase:N`, `status:todo`) so the full scope exists before any teammate launches. Break each phase into **task sub-issues just-in-time** at that phase's start (so later phases absorb learnings/drift). Record everything in the ledger.

## Per phase (in DAG order)
Run **one Workflow per phase** from [assets/workflow-template.js](assets/workflow-template.js), passing the approved phase DAG + config (incl. `learningsTarget`, and **`agents` / `audit` / `run`** from the resolved run config) as the Workflow `args`. **Do not free-author orchestration** — use the template; only inject stages the user approved at the gate. The shipped template accepts `args` as either a plain object or a JSON string (it auto-parses strings), and auto-namespaces all agent seats under the `work-audit-refine:` prefix — override by setting `args.agentPrefix` — so the Lead no longer needs manual namespacing or args-inlining workarounds. The Workflow:
- cuts `integration/phase-N` off the working branch;
- **Works** — fresh `war-worker` agents (one per task) in per-task worktrees off the integration tip, wave by wave (barrier between dependency waves);
- **Audits** — independent read-only `war-auditor` seats review the pinned SHA. **Critical/Major block**; Minor/Nit → follow-up issues; approval **unanimous on one SHA** (re-confirm when HEAD moves). A split → **one rebuttal round** → resolve or escalate. Coven uses the trio (correctness / cascading-impact / plan-faithfulness), swapping one for a domain lens (healthcare-safety, security) on flagged code;
- **Refines** — `war-refiner` rebases each approved task onto the integration tip, re-runs the gate, and merges **serially** (the queue). A gate/audit failure routes a batched `FIX_NEEDED` to a fresh fix-worker on the same worktree (≤ `round_limit=3`, then escalate `audit-blocked`);
- **Lands** — `war-refiner` merges `integration/phase-N` → working `--no-ff` (one phase commit) and pushes working;
- **Wraps up** — once the phase lands, `war-servitor` (write-scoped to `learningsTarget`) records durable learnings to memory;
- returns `{ landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }` — `landDecision` ∈ `landed` | `held:escalation` | `held:nothing-merged`; `servitorResult` is null unless the Workflow landed the phase itself.

Then update issues + ledger, and **mirror the phase report + escalations as a comment on the phase epic issue**.

## Checkpoint (between phases)
Post a phase report — *landed (task→issue#, SHA) · minor issues filed · learnings captured · escalations needing your decision (with options) · deferred/blocked · gate result + working pushed@SHA · next phase?* — and **wait for the user's go**. Under `--afk`: post + `PushNotification`, then proceed. **Hard escalations (audit-blocked, unresolvable conflict, plan-contradiction) always halt regardless of mode.** Promote any ADR-worthy deviation to a real `docs/adr/` entry.
- **Capture learnings on every landed phase (exactly once).** The Workflow only wraps up when it lands the phase itself (`landDecision === 'landed'`, `servitorResult` populated). When it returns a `held:*` decision and you land the phase manually (the escalation path), then **after your manual land's gate is green** spawn `war-servitor` yourself with `learningsTarget` set to the resolved target (the worktree-scope hook confines it there by `agent_type`) — fed the returned `auditLog`, `escalated`, and the resolution (what the user decided and how the fix went). Run it only if `servitorResult` is absent (never double-capture).
- **`env-blocked` task outcome (provision failure).** When the refiner's Provision barrier reports an `env-blocked` outcome for a task (a pinned `run.provision` command failed, so the worktree never became gate-ready and the worker was **never spawned** — see [references/schemas.md](references/schemas.md)): **halt that task and escalate it** to the user with the `failedCommand`, `exitCode`, `stderrTail`, and `provisionSource`. Burn **0 FIX rounds** — this is a broken *environment*, not broken code, so a fix-worker round would be pointless (`round_limit` does not apply). **Keep the worktree** as-is for inspection (do **not** clean it up). **Sibling tasks proceed** — an `env-blocked` task does not block the rest of the wave; the phase lands whatever else passed, and the blocked task is surfaced in the phase report like any other escalation.

## Finish
When all phases land, open **one PR** working → landing, body summarizing phases landed, learnings, escalations resolved, and follow-up issues filed. Report the PR URL.

## Invariants (never violate)
- The Lead never edits code — only decomposes, gates, surfaces escalations, talks to the human. Keep your own context lean: push detail into the ledger + issues, not your chat history.
- `war-auditor` is read-only (Read/Grep/Glob only); `war-servitor` is the only reviewer-side role that writes, and only to `learningsTarget` (the worktree-scope hook keys on `agent_type` and confines the servitor to the learnings path-pattern, [ADR 0002](../../docs/adr/0002-scope-by-agent-type.md)); workers stay inside their worktree (the same hook confines a `war-worker` write to a dir bearing a `.war-task` marker); `war-refiner` owns **all** merges, one at a time, never `--force`/`reset --hard` on shared branches. The **refiner**, not the worker, also owns worktree provisioning — it runs `provision-worktrees.sh` to cut the **plan-namespaced** integration branch and `git worktree add` each task ([ADR 0001](../../docs/adr/0001-explicitly-managed-worktrees.md), [ADR 0003](../../docs/adr/0003-plan-namespaced-branches.md)).
- Never merge a task with an open Critical/Major finding, without a passing gate, or before unanimous audit. Never merge un-audited. Never let a worker satisfy the gate by deleting/skipping tests.
- Models/effort come from the resolved run config (`/war-room`); **defaults** are `war-worker`/fix/`war-refiner`/`war-servitor` = sonnet and `war-auditor` = opus, all at session effort. `audit.autoEscalate` (default on) still widens a lone seat to a coven on a Critical/low-confidence finding. Target < 3× single-agent cost.
- **Every landed phase captures learnings exactly once**, by whichever path landed it: the in-flow Wrap-up when the Workflow lands (`landDecision === 'landed'`), else a Lead-driven `war-servitor` pass after a manual land. Skip if `servitorResult` is already set.
