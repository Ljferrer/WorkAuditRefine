# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Agent Teams](https://code.claude.com/docs/en/agent-teams) + [Workflows](https://code.claude.com/docs/en/workflows) orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown), built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**. WAR keeps Gas Town's worker / auditor / refinery roles, **absorbs the witness's live coordination into the Workflow itself**, and adds a **scribe** that records each phase's learnings.

## What it does

Given a plan like `docs/implement/implementation_plan_A.md`, `/war` will:

1. **Decompose** the plan into a phase → task DAG and propose it to you as GitHub issues — all phase **epics up front**, task **sub-issues just-in-time** per phase. *You approve before anything spawns.*
2. For each phase, run a **Workflow** that:
   - **Works** — fresh worker agents implement each task in isolated git worktrees, writing the plan's mapped tests.
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA; a coven of 3 with diverse lenses for high-blast-radius tasks).
   - **Refines** — a serial merge queue rebases, re-runs the gate (`tests/lint`), and lands approved tasks on a per-phase integration branch.
   - **Records** — after the phase lands, a write-scoped scribe captures durable learnings into memory.
3. **Lands** each phase onto your working branch as one `--no-ff` commit, pushes, and **checks in with you**.
4. Opens **one PR** from the working branch to the landing branch at the end.

Run autonomously inside a phase; gated by you between phases (`--afk` to loosen).

## Install

```
/plugin marketplace add Ljferrer/WorkAuditRefine
/plugin install work-audit-refine@work-audit-refine
```

Then: `/war docs/implement/implementation_plan_A.md`

## Roles → Gas Town lineage

| WAR | Gas Town | Built on |
|---|---|---|
| Lead (your chat) | Mayor | the main Claude Code session |
| Worker | Polecat | `war-worker` — `Agent` (sonnet) in a git worktree |
| Auditor | Nun (Refinery audit gate) | `war-auditor` — read-only `Agent` (opus), Read/Grep/Glob only |
| Refinery (merge queue) | Refinery | `war-merge` `Agent` + the serial Workflow merge loop |
| Scribe | `bd remember` | `war-scribe` — write-scoped `Agent` (sonnet); records per-phase learnings to memory |
| Witness | Witness | *no standalone agent* — its live coordination is absorbed by the Workflow's control flow + hooks |

See [`skills/war/references/design.md`](skills/war/references/design.md) for the full architecture.

## Status

v0.2.1 — early. Adds the `war-scribe` per-phase learnings wrap-up and all-epics-up-front issue timing.

## License

MIT © Ljferrer
