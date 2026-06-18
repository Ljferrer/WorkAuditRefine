---
name: war
description: Execute a detailed multi-phase implementation plan with a team of agents — Work, Audit, Refine, then capture learnings. Breaks plan phases into GitHub issues, then per phase spins up fresh worker agents in isolated git worktrees, independent read-only auditors (severity-gated, unanimous), a serial refine/merge queue, and a write-scoped scribe that wraps phase learnings into memory; lands each phase on a working branch and opens one PR to a landing branch at the end. Use when the user runs `/war <plan>`, wants to autonomously implement a multi-phase plan or spec, or mentions WAR, gastown-style orchestration, or a worker/auditor/refinery/witness team.
---

# WAR — Work · Audit · Refine

You are the **Lead** (the Mayor). You orchestrate and gate; you **never implement code yourself**. WAR is a Claude-native re-implementation of Gas Town's worker/auditor/refinery/witness model built on `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — no Go binary, no Dolt, no beads.

Full architecture: [references/design.md](references/design.md). Data contracts: [references/schemas.md](references/schemas.md). Gas Town lineage + tunables: [references/gastown-design-params.md](references/gastown-design-params.md).

## Quick start
```
/war <plan-file> [--working <branch>] [--landing <branch>] [--afk]
```
Example: `/war docs/implement/implementation_plan_A.md --working dev/planA --landing master`

## Setup (once)
1. Confirm a clean git repo with a GitHub remote and `gh` auth. Ask for the **working** and **landing** branches if not given (default working = current branch; landing = the repo's default branch).
2. Detect the **gate command**: `pyproject.toml` → `uv sync && ruff check && pytest`; `package.json` → its lint/test scripts; else **ask once** and record it. Never run a phase without a gate.
3. Determine the **learnings target** for the scribe: the agent-memory dir if present (`~/.claude/projects/<proj>/memory/` with `MEMORY.md`), else `docs/learnings/`. Record it.
4. Create the run ledger `.claude/teams/<run-id>/ledger.json` (+ a rendered `ledger.md`). It is the resumable source of truth; on resume, read it + open issues and continue.

## Decompose + approve — GATE (before any teammate launches)
1. Read the plan. Extract **phases** (prefer an explicit build-order/phase section, e.g. a "Build order"; else top-level sections) and propose the phase→task DAG.
2. Flag high-blast-radius tasks for a **coven** (3 auditors); leaf/low-risk tasks get 1.
3. Present the DAG to the user as an issues preview **and any per-phase Workflow patches** you intend to inject. **Wait for approval/edits.**
4. On approval, file **all phase epics up front** (labels `phase:N`, `status:todo`) so the full scope exists before any teammate launches. Break each phase into **task sub-issues just-in-time** at that phase's start (so later phases absorb learnings/drift). Record everything in the ledger.

## Per phase (in DAG order)
Run **one Workflow per phase** from [assets/workflow-template.js](assets/workflow-template.js), passing the approved phase DAG + config (incl. `learningsTarget`) as the Workflow `args`. **Do not free-author orchestration** — use the template; only inject stages the user approved at the gate. The Workflow:
- cuts `integration/phase-N` off the working branch;
- **Works** — fresh `war-worker` agents (one per task) in per-task worktrees off the integration tip, wave by wave (barrier between dependency waves);
- **Audits** — independent read-only `war-auditor` seats review the pinned SHA. **Critical/Major block**; Minor/Nit → follow-up issues; approval **unanimous on one SHA** (re-confirm when HEAD moves). A split → **one rebuttal round** → resolve or escalate. Coven uses the trio (correctness / cascading-impact / plan-faithfulness), swapping one for a domain lens (healthcare-safety, security) on flagged code;
- **Refines** — `war-merge` rebases each approved task onto the integration tip, re-runs the gate, and merges **serially** (the queue). A gate/audit failure routes a batched `FIX_NEEDED` to a fresh fix-worker on the same worktree (≤ `round_limit=3`, then escalate `audit-blocked`);
- **Lands** — `war-merge` merges `integration/phase-N` → working `--no-ff` (one phase commit) and pushes working;
- **Wraps up** — once the phase lands, `war-scribe` (write-scoped to `learningsTarget`) records durable learnings to memory;
- returns `{ landed, escalated, minorsFiled, landResult, scribeResult }`.

Then update issues + ledger, and **mirror the phase report + escalations as a comment on the phase epic issue**.

## Checkpoint (between phases)
Post a phase report — *landed (task→issue#, SHA) · minor issues filed · learnings captured · escalations needing your decision (with options) · deferred/blocked · gate result + working pushed@SHA · next phase?* — and **wait for the user's go**. Under `--afk`: post + `PushNotification`, then proceed. **Hard escalations (audit-blocked, unresolvable conflict, plan-contradiction) always halt regardless of mode.** Promote any ADR-worthy deviation to a real `docs/adr/` entry.

## Finish
When all phases land, open **one PR** working → landing, body summarizing phases landed, learnings, escalations resolved, and follow-up issues filed. Report the PR URL.

## Invariants (never violate)
- The Lead never edits code — only decomposes, gates, surfaces escalations, talks to the human. Keep your own context lean: push detail into the ledger + issues, not your chat history.
- `war-auditor` is read-only (Read/Grep/Glob only); `war-scribe` is the only reviewer-side role that writes, and only to `learningsTarget` (enforced by the worktree-scope hook via `WAR_WORKTREE`); workers stay inside their worktree; `war-merge` owns **all** merges, one at a time, never `--force`/`reset --hard` on shared branches.
- Never merge a task with an open Critical/Major finding, without a passing gate, or before unanimous audit. Never merge un-audited. Never let a worker satisfy the gate by deleting/skipping tests.
- Models: `war-worker`/fix/`war-merge`/`war-scribe` = sonnet; `war-auditor` = opus. Target < 3× single-agent cost.
