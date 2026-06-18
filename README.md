# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Agent Teams](https://code.claude.com/docs/en/agent-teams) + [Workflows](https://code.claude.com/docs/en/workflows) orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown): same roles (worker / auditor / refinery / witness), but built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**.

## What it does

Given a plan like `docs/implement/implementation_plan_A.md`, `/war` will:

1. **Decompose** the plan into a phase → task DAG and propose it to you as GitHub issues (epic per phase, sub-issue per task). *You approve before anything spawns.*
2. For each phase, run a **Workflow** that:
   - **Works** — fresh worker agents implement each task in isolated git worktrees, writing the plan's mapped tests.
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA; a coven of 3 with diverse lenses for high-blast-radius tasks).
   - **Refines** — a serial merge queue rebases, re-runs the gate (`tests/lint`), and lands approved tasks on a per-phase integration branch.
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
| Worker | Polecat | `Agent` in a git worktree |
| Auditor | Nun (Refinery audit gate) | read-only `Agent` (Read/Grep/Glob only) |
| Refine / merge queue | Refinery | serial Workflow stage + a merge `Agent` |
| Witness | Witness | the Workflow's control flow + lifecycle hooks |

See [`skills/war/references/design.md`](skills/war/references/design.md) for the full architecture.

## Status

v0.2.0 — early. Adds the `war-scribe` per-phase learnings wrap-up and all-epics-up-front issue timing.

## License

MIT © Ljferrer
