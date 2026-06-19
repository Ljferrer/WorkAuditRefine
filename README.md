# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Workflows](https://code.claude.com/docs/en/workflows)-based multi-agent orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown), built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**. WAR keeps Gas Town's worker / auditor / refinery roles, **absorbs the witness's live coordination into the Workflow itself**, and adds a **servitor** that records each phase's learnings.

## What it does

Given a plan like `docs/implement/implementation_plan_A.md`, `/war` will:

1. **Decompose** the plan into a phase → task DAG and propose it to you as GitHub issues — all phase **epics up front**, task **sub-issues just-in-time** per phase. *You approve before anything spawns.*
2. For each phase, run a **Workflow** that:
   - **Works** — fresh worker agents implement each task in isolated git worktrees, writing the plan's mapped tests.
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA; a coven of 3 with diverse lenses for high-blast-radius tasks).
   - **Refines** — a serial merge queue rebases, re-runs the gate (`tests/lint`), and lands approved tasks on a per-phase integration branch.
   - **Records** — after the phase lands, a write-scoped servitor captures durable learnings into memory.
3. **Lands** each phase onto your working branch as one `--no-ff` commit, pushes, and **checks in with you**.
4. Opens **one PR** from the working branch to the landing branch at the end.

Run autonomously inside a phase; gated by you between phases (`--afk` to loosen).

> **Best practice — author the input plan with [`/grill-me`](https://github.com/mattpocock/skills/tree/main).** WAR is only as good as the plan it executes. Matt Pocock's `/grill-me` skill interviews you relentlessly down every branch of the design tree, resolving each decision one at a time, until the plan is unambiguous and cleanly phase-decomposable — exactly the shape WAR needs to fan out workers and auditors.

## Install

```
/plugin marketplace add Ljferrer/WorkAuditRefine
/plugin install work-audit-refine@work-audit-refine
```

### Updating

When a new version ships, pull it into your install:

```
/plugin marketplace update work-audit-refine        # git-pull the marketplace
/plugin update work-audit-refine@work-audit-refine  # bump your install to the new version
```

Changes apply to the current session — or run `/reload-plugins` to force a reload without restarting.

> **Authors — bump the version or the update is a silent no-op.** Claude Code caches plugins by the `version` string in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json), so pushing new commits without bumping it leaves every consumer on the cached copy. While iterating locally, skip the round-trip: launch with `claude --plugin-dir /path/to/WorkAuditRefine` and run `/reload-plugins` after each edit — local paths resolve to version `unknown`, so every reload picks up your latest files.

## Usage

```
/war <plan-file> [--working <branch>] [--landing <branch>] [--afk]
```

**Prerequisites:** a clean git working tree, a GitHub remote, and authenticated `gh` — WAR files issues and opens a PR on your behalf, and refuses to start on a dirty tree. No experimental flags or `settings.json` changes are required — `/war` runs on the stock `Workflow` and `Agent` tools, not the experimental agent-teams feature.

**Arguments:**

| Argument | Required | Default | What it does |
|---|---|---|---|
| `<plan-file>` | yes | — | Path to the multi-phase plan to execute, e.g. `docs/implement/implementation_plan_A.md`. |
| `--working <branch>` | no | current branch | Branch each phase lands on, one `--no-ff` commit per phase. |
| `--landing <branch>` | no | repo's default branch | Branch the final PR targets. |
| `--afk` | no | off | Don't stop at phase boundaries — post a report + push notification and keep going. Hard escalations still halt. |

**Example:**

```
/war docs/implement/implementation_plan_A.md --working dev/planA --landing master
```

**What happens when you run it:**

1. **Setup** — WAR confirms the repo/`gh` state, detects your **gate command** (`uv sync && ruff check && pytest`, your `package.json` lint/test scripts, or it asks once), and picks a **learnings target** for the servitor. No phase ever runs without a gate.
2. **Decompose + approve** — it reads the plan, proposes a phase → task DAG as a GitHub-issues preview, and **waits for your approval.** Nothing spawns until you say go; all phase epics are filed up front, task sub-issues just-in-time per phase.
3. **Per phase** — workers implement each task in isolated worktrees → read-only auditors review the pinned SHA (Critical/Major findings block; approval is unanimous) → a serial refinery rebases, re-runs the gate, and merges → a write-scoped servitor records durable learnings.
4. **Checkpoint** — the phase lands on `--working` as one `--no-ff` commit and is pushed; WAR posts a phase report and **checks in with you** before the next phase (skipped under `--afk`; hard escalations halt regardless).
5. **Finish** — after the last phase, it opens **one PR** from `--working` → `--landing` and reports the URL.

**Resuming:** every run writes a ledger at `.claude/teams/<run-id>/ledger.json` (the resumable source of truth). If a run is interrupted, re-invoke `/war` with the same plan to continue from the ledger + open issues.

## Roles → Gas Town lineage

| WAR | Gas Town | Built on |
|---|---|---|
| Lead (your chat) | Mayor | the main Claude Code session |
| Worker | Polecat | `war-worker` — `Agent` (sonnet) in a git worktree |
| Auditor | Nun (Refinery audit gate) | `war-auditor` — read-only `Agent` (opus), Read/Grep/Glob only |
| Refinery (merge queue) | Refinery | `war-refiner` `Agent` + the serial Workflow merge loop |
| Servitor | `bd remember` | `war-servitor` — write-scoped `Agent` (sonnet); records per-phase learnings to memory |
| -- | Witness | *no standalone agent* — its live coordination is absorbed by the Workflow's control flow + hooks |

See [`skills/war/references/design.md`](skills/war/references/design.md) for the full architecture.

## Status

v0.2.3 — early. Fixes plugin manifest validation (explicit `agents` file list; removed redundant `hooks` reference so the standard `hooks/hooks.json` auto-loads without duplication).

## License

MIT © Ljferrer
