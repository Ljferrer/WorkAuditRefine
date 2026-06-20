# WAR — Design

**Status:** v0.4.1. A portable, Claude-native re-implementation of Gas Town's worker/auditor/refinery/witness model, built only on Claude Code primitives (`Agent`, the `Workflow` tool, git worktrees, GitHub issues) — no Go binary, no Dolt, no beads.

This document is the spec of record. The runnable surface is [`../SKILL.md`](../SKILL.md); the agents are in `agents/`; the per-phase engine is [`../assets/workflow-template.js`](../assets/workflow-template.js).

## 1. Topology
`Human ↔ Lead (main session = Mayor) ↔ Workflow → { war-worker, war-auditor, war-refiner }`. The Lead orchestrates, gates, and talks to the human; it **never edits code**. There is no separate orchestrator agent and no standalone Witness agent — those functions live in the Workflow's control flow and lifecycle hooks.

## 2. Substrate — hybrid
- **Workflow spine, one run per phase.** Holds the phase loop and *is* the serial merge queue (one merge at a time, by construction). The script has no shell/fs access — every git/test action is performed by a spawned agent.
- **Workers** = worktree-isolated `Agent`s (sonnet), one fresh per task.
- **Auditors** = read-only `Agent`s (opus); independent by default, with **one rebuttal round** on a split (realized inside the Workflow by re-spawning each seat with its peers' findings — a portable stand-in for live peer messaging).
- **Witness dissolved** into the Workflow + hooks + Lead.

### Why a Workflow, not the Agent Teams feature
WAR's coordination is **knowable in advance** — a phase loop, dependency waves, a serial merge queue, a severity gate — so it belongs in a deterministic script, not emergent agent negotiation. The `Workflow` tool delivers exactly that, plus what WAR leans on: reproducible structure, three-layer resume (issues + ledger + Workflow journal, §6), schema-validated audit verdicts, lean **ephemeral** agents (spawn → one job → return → die, no idle inbox-pollers), and **no experimental flag** — it runs on the stock `Workflow` + `Agent` tools.

The experimental **Agent Teams** feature (gated by `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) buys three things WAR doesn't need: direct teammate-to-teammate `SendMessage`, mid-run human steering of a single long-lived agent, and dynamic task-claiming off a shared list. WAR realizes auditor disagreement as a **Workflow rebuttal round** (re-spawn each seat with its peers' findings, §2) instead of live messaging; the only capability genuinely given up is *live* SendMessage debate, parked in §12.

A Workflow also can't *be* a team's Lead — it's a script with no inbox, and its `agent()` children aren't addressable teammates; it coordinates ephemeral subagents by call-and-return, full stop. The two are distinct substrates, and the human Lead session is the only place they'd mix. Rule of thumb: **scripted, reproducible coordination → Workflow; emergent or interactive coordination → Teams.** WAR is firmly the former.

## 3. The resolved decision tree
| # | Decision | Resolution |
|---|---|---|
| 1 | Lead topology | Main session = Lead/Mayor; your chat is the Lead's chat |
| 2 | Build vs drive | Native re-implementation, gastown-*informed* (GitHub issues, no gt/beads) |
| 3 | Substrate | Hybrid: Workflow spine + team-style debate only on audit splits |
| 4 | Decomposition | Lead proposes phase→task DAG → **you approve** → epic/phase + sub-issue/task |
| 5 | Branch model | Per-phase `integration/phase-N`; task worktrees off it; `--no-ff` land→working; one PR working→landing |
| 6 | Autonomy | Auto within a phase, **gate at phase boundaries**, hard escalations always halt; `--afk` flips the gate |
| 7 | Audit verdict | Severity-tagged; Critical/Major block, Minor→follow-up, `escalate`→halt; **unanimous on one SHA** |
| 8 | Auditor count | 1 default; coven of 3 for high blast radius; auto-escalate 1→3 on Critical/low-confidence |
| 9 | Witness | Dissolved into Workflow + hooks + Lead |
| 10 | State/resume | 3-layer: GitHub issues + JSON ledger(+md) + Workflow resume journal |
| 11 | Stage graph | Wave-by-wave with barriers; serial merges = the queue; explicit named worktrees |
| 12 | Audit independence | Independent parallel + one rebuttal round on splits → approve / FIX_NEEDED / escalate |
| 13 | Worker bar | Acceptance-criteria-driven, tests included, anti-cheat test-existence check |
| 14 | Ledger format | JSON authoritative + derived markdown |
| 15 | Workflow gen | Fixed parameterized template + per-phase patches reviewed at the gate |
| 16 | Coven lenses | Fixed core trio (correctness/cascading-impact/plan-faithfulness) + context swap |
| 17 | Patch gate | Reviewed at the DAG-approval gate |
| 18 | Run config | `/war-room` interviews → `.claude/war/config.json`; `/war` auto-discovers + validates (`war-config.mjs`); per-role model/effort, coven policy/size, roundLimit, afk; **global per-role**, seeds the gate (doesn't replace it) |

## 4. Per-phase flow
1. **Cut** `integration/phase-N` off the working branch.
2. **Work (waves):** topologically sort the phase's tasks into dependency waves (usually one). Per wave, fan out one `war-worker` per task into a named mutable worktree branched off the integration tip; the worker implements, writes/extends the plan's mapped tests, runs the gate green, commits, pushes.
3. **Audit (per task):** independent read-only seats review the pinned `audit_sha`. 1 seat (`neighbors` depth) by default; a coven of 3 (`deep`, diverse lenses) for flagged tasks; auto-escalate 1→3 on a Critical or low confidence. Gate over verdicts: any open Critical/Major blocks; any `escalate` halts; all `approve` on one SHA = merge-eligible. A split triggers one rebuttal round → approve / agreed-block / still-split-escalate.
4. **Fix loop:** a block routes a batched `FIX_NEEDED` to a fresh fix-worker on the *same* worktree; re-audit against the new SHA; ≤ `round_limit=3` then `audit-blocked`.
5. **Refine (serial):** `war-refiner` rebases each approved task onto the integration tip, re-runs the gate, merges — one at a time. This sequencing *is* the merge queue.
6. **Land:** `war-refiner` merges `integration/phase-N` → working `--no-ff` (one phase commit), pushes working. Held if a hard escalation is open.
7. **Checkpoint:** Lead posts the phase report (also mirrored as a comment on the phase epic issue) and waits for your go (or notifies + proceeds under `--afk`).

## 5. Escalate (halt) vs resolve in-band
- **Escalate** — the plan is wrong/underspecified: plan contradicts the code or itself; a named interface/file the plan assumes is absent or different; an ambiguity with >1 non-equivalent resolution; an ADR-worthy deviation; `audit-blocked` (round_limit); an unresolvable rebase conflict.
- **In-band** (handled silently by workers/auditors): bugs, style, missing tests, local refactors, neighbor-impact fixes.

## 6. State & resume (three-layer)
- **GitHub issues** — human-visible task truth (labels in [`schemas.md`](schemas.md)).
- **`ledger.json`** (`.claude/teams/<run-id>/`, uncommitted) — DAG, worktree/branch map, SHAs, verdicts, escalations; a fresh Lead resumes from ledger + open issues. A rendered `ledger.md` is the eyeball view.
- **Workflow `resumeFromRunId`** — mid-phase resume.
- Durable product artifacts: phase reports/escalations → epic-issue comments; ADR-worthy deviations → `docs/adr/`.

## 7. Branch & worktree model
- One mutable worktree per task (worker + its fix-workers share it; it persists until the task lands so kick-backs can fix in place). Cleaned up after the task merges.
- Auditors read the diff/repo through Read/Grep/Glob (no checkout to mutate); read-only is guaranteed by the tool restriction, not a hook.
- Integration branch removed after the phase lands; worktrees of escalated/blocked tasks are kept for inspection.

## 8. Cost & models
`war-worker`/fix/`war-refiner` = sonnet; `war-auditor` = opus; Lead = session model. Concurrency = the Workflow default (`min(16, cores−2)`). Target < 3× single-agent cost.

## 9. Harness notes (ECC / OmniEMR first run)
- **GateGuard** present-and-retry: workers/refiners present the requested facts then retry the identical Bash/Write op.
- **No `temperature`** on current Opus/Fable — any SDK call a worker writes must omit it.
- We may run *inside* a Claude worktree already; nested worktrees off the working branch use absolute paths and avoid `.claude/worktrees/` collisions.

## 10. What WAR keeps / drops / changes vs Gas Town
- **Keeps:** the four roles, the Nun gate's fail-closed convergent unanimity + severity + coven + plan-faithfulness, integration-branch waves + `--no-ff` land, GUPP propulsion, the read-only-by-construction auditor.
- **Drops:** the Go orchestrator, Dolt/beads, `gt mail`/nudge, the standalone Witness/Deacon daemons, tmux session management.
- **Changes:** durable state → GitHub issues + a JSON ledger; propulsion → Workflow control flow (no polling); auditor read-only → tool restriction (Read/Grep/Glob) instead of detached-checkout-push-unset; the merge queue → a serial Workflow loop instead of batch-then-bisect.

## 11. Validation criteria
- Lead never edits code (only orchestrates/gates). · Auditors cannot write/commit/push. · A task can't merge with an open Critical/Major, without a green gate, or before unanimous audit on one SHA. · "Green by deletion" is caught and escalated. · A killed Lead resumes from ledger + issues. · Each phase lands as one `--no-ff` commit; the run ends in exactly one PR. · `/cost` < 3× a single-agent baseline.

## 12. Deferred (post-v1)
Batch-then-bisect merge queue · live-SendMessage audit debate · multiple concurrent phases · multi-repo · per-task GitHub PRs as the review surface · learned coven-flagging.

## 13. v0.2.0 amendments
- **Issue timing:** file **all phase epics up front** at the approval gate (full scope before any teammate launches), but break each phase into **task sub-issues just-in-time** at that phase's start — so later phases absorb earlier phases' learnings and plan drift, while still honoring "write all issues before launching any teammates" at the epic level.
- **New role — `war-servitor`** (sonnet): after a phase *lands*, a single write-mode pass captures **durable learnings** into the **learnings target** (the agent-memory dir `~/.claude/projects/<proj>/memory/` with `MEMORY.md` if present, else committed `docs/learnings/phase-N.md`). It is fed the phase's audit log + escalations. Auditors stay **read-only**; the servitor is the only reviewer-side writer, and its writes are confined to `learningsTarget` by reusing the worktree-scope hook (its `WAR_WORKTREE` = the target). Cadence: **once per phase** (not per task). Captures signal only — gotchas, plan↔code mismatches, deviations+why, patterns — never routine "implemented X" notes.
- **Roles table** now includes Servitor (→ Gas Town's `bd remember`).
- **Flow** gains a **Wrap-up** stage after Land; the Workflow returns `servitorResult` alongside `{ landed, escalated, minorsFiled, landResult }`.

## 14. v0.3.0 amendments
- **New skill — `/war-room`** (conversation-only): interviews the user from a preset (balanced/thorough/economy) plus targeted overrides, and writes a run config to `.claude/war/config.json`. It never decomposes a plan or launches `/war`.
- **Config surface.** `skills/war/assets/war-config.mjs` owns the schema, defaults, presets, and validation (a single tested source of truth, used by both skills). The `/war` Lead loads and validates the config in Setup, applies non-null `overrides`, and threads `agents` / `audit` / `run` into the per-phase Workflow `args`. `workflow-template.js` reads those instead of hardcoded model literals.
- **Configurable knobs:** per-role `model` (opus/sonnet/haiku/fable) and `effort` (default…max, where `max` = "ultrathink"); `covenPolicy` (auto/all/solo) seeding per-task covens; `covenSize`; `autoEscalate` (set `false` with `covenPolicy: "solo"` to pin exactly one auditor); `roundLimit`; `afk`.
- **Backward compatible.** No config file → byte-for-byte the pre-v0.3.0 behavior (`effort: "default"` passes no effort opt; built-in model defaults unchanged).

## 15. v0.4.0 amendments
- **New sibling skill — `/red-team`** (completes the trilogy): `/war-room` configures a run → **`/red-team` hardens the plan** → `/war` executes it. It runs *before* `/war`, attacking the input plan so WAR fans out over claims that have been **proven, not assumed**. Conversation-driven + Workflow-backed; **not** part of `/war`'s per-phase engine, which is unchanged.
- **Spine + bespoke probes.** Derives a universal spine of adversarial lenses (claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility) plus plan-tailored probes, and **proves** each claim by running the plan's tests/edits/commands in **throwaway sandboxes** (temp dirs / git worktrees) — never touching the target repo. Analysis lenses use the read-only `Explore` agent; execution probes run isolated.
- **Prove-don't-assert (`adversarial-confirm`).** A blocking finding is **downgraded to a warning unless an independent confirm agent reproduces it** — the Nun gate's fail-closed-on-evidence discipline applied to plan verification, surfaced as the named `adversarial-confirm` Workflow stage.
- **Outcome:** grills the user on every blocker, patches the plan **in place** until **CLEARED**, and leaves a report under `docs/red-team/`.
- **Surface.** `skills/red-team/` — `assets/red-team-gate.mjs` (verdict + severity-classify logic, tested), `assets/workflow-scaffold.js` (copy-per-plan Workflow: spine + probes + adversarial-confirm), `references/lenses.md`, `SKILL.md` runbook. Design notes: [`red-team-design.md`](../../../docs/specs/2026-06-18-red-team-design.md). v0.4.0 is purely additive (new front-end skill + version bump).
