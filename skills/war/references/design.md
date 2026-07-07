# WAR — Design

**Status:** Active. A portable, Claude-native re-implementation of Gas Town's worker/auditor/refinery/witness model, built only on Claude Code primitives (`Agent`, the `Workflow` tool, git worktrees, GitHub issues) — no Go binary, no Dolt, no beads. The shipped version lives in [`.claude-plugin/plugin.json`](../../../.claude-plugin/plugin.json).

This document is the spec of record. The runnable surface is [`../SKILL.md`](../SKILL.md); the agents are in `agents/`; the per-phase engine is [`../assets/workflow-template.js`](../assets/workflow-template.js).

## 1. Topology
`Human ↔ Lead (main session = Mayor) ↔ Workflow → { war-worker, war-auditor, war-refiner }`. The Lead orchestrates, gates, and talks to the human; it **never edits code**. There is no separate orchestrator agent and no standalone Witness agent — those functions live in the Workflow's control flow and lifecycle hooks.

## 2. Substrate — hybrid
- **Workflow spine, one run per phase.** Holds the phase loop and *is* the serial merge queue (one merge at a time, by construction). The script has no shell/fs access — every git/test action is performed by a spawned agent.
- **Workers** = worktree-isolated `Agent`s (per-role model from `war-config.mjs` DEFAULTS; e.g. the current worker default is opus/`max`), one fresh per task.
- **Auditors** = read-only `Agent`s (per-role model from `war-config.mjs` DEFAULTS); independent by default, with **one rebuttal round** on a split (realized inside the Workflow by re-spawning each seat with its peers' findings — a portable stand-in for live peer messaging).
- **Witness dissolved** into the Workflow + hooks + Lead.

### Why a Workflow, not the Agent Teams feature
WAR's coordination is **knowable in advance** — a phase loop, dependency waves, a serial merge queue, a severity gate — so it belongs in a deterministic script, not emergent agent negotiation. The `Workflow` tool delivers exactly that, plus what WAR leans on: reproducible structure, resume with one authority + two advisory records (§6), schema-validated audit verdicts, lean **ephemeral** agents (spawn → one job → return → die, no idle inbox-pollers), and **no experimental flag** — it runs on the stock `Workflow` + `Agent` tools.

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
| 7 | Audit verdict | Severity-tagged; Critical/Major block, Minor/Nit route by auditor-owned **disposition** (absorb/follow-up/note — ADR 0013), `escalate`→halt; **unanimous on one SHA** |
| 8 | Auditor count | Per-task **roster** of 1–5 distinct-lens seats (per-seat depth); default trio at `deep`; a lone seat on Critical/low-confidence union-widens toward its own `widen` nomination (valid → those lenses at `deep`), else the default roster's lenses |
| 9 | Witness | Dissolved into Workflow + hooks + Lead |
| 10 | State/resume | One authority (git) + two advisory records (GitHub issues + JSON ledger(+md)); Workflow resume journal is off-ladder |
| 11 | Stage graph | Wave-by-wave with barriers; serial merges = the queue; explicit named worktrees |
| 12 | Audit independence | Independent parallel + one rebuttal round on splits → approve / FIX_NEEDED / escalate |
| 13 | Worker bar | Acceptance-criteria-driven, tests included, anti-cheat test-existence check |
| 14 | Ledger format | JSON authoritative + derived markdown |
| 15 | Workflow gen | Fixed parameterized template + per-phase patches reviewed at the gate |
| 16 | Lens catalog | Open namespace: trio (correctness/cascading-impact/plan-faithfulness) + security/performance/simplicity/usability/test-fidelity + mintable domain lenses; `execution-evidence`/`pin-validity` reserved for built-in passes, never roster-selectable |
| 17 | Patch gate | Reviewed at the DAG-approval gate |
| 18 | Run config | `/war-room` interviews → `.claude/war/config.json`; `/war` auto-discovers + validates (`war-config.mjs`); per-role model/effort, audit roster + roster policy, roundLimit, afk; **global per-role**, seeds the gate (doesn't replace it) |

## 4. Per-phase flow
1. **Cut** `integration/phase-N` off the working branch.
2. **Work (waves):** topologically sort the phase's tasks into dependency waves (usually one). Per wave, fan out one `war-worker` per task into a named mutable worktree branched off the integration tip; the worker implements, writes/extends the plan's mapped tests, runs the gate green, commits, pushes. **Frozen-base scope note (ADR 0012):** the frozen phase base is HARD **for same-wave parallel tasks only** — a same-repo task with declared `deps` rebases its worktree onto the integration branch as its worker's first action (dep-wave visibility; a first-dispatch rebase is a pure fast-forward, a resume-with-commits conflict returns `blocked`). `gitlink-bump` tasks are excluded (their dep merged in the submodule repo).
3. **Audit (per task):** independent read-only seats review the pinned `audit_sha` — one seat per entry in the task's **roster** (1–5 distinct lenses, per-seat depth; default: the trio at `deep`). A lone seat hitting a Critical or low confidence union-widens (`autoEscalate`) — toward its own `widen` nomination when valid (those lenses at `deep`), else the default roster's lenses (the byte-identical trio-union fallback). Gate over verdicts: any open Critical/Major blocks; any `escalate` halts; all `approve` on one SHA = merge-eligible. A split triggers one rebuttal round → approve / agreed-block / still-split-escalate.
4. **Fix loop:** a block routes a batched `FIX_NEEDED` to a fresh fix-worker on the *same* worktree; re-audit against the new SHA; ≤ `round_limit=3` then `audit-blocked`.
5. **Refine (serial):** `war-refiner` rebases each approved task onto the integration tip, re-runs the gate, merges — one at a time. This sequencing *is* the merge queue.
6. **Land:** `war-refiner` merges `integration/phase-N` → working `--no-ff` (one phase commit), pushes working. Held if a hard escalation is open.
7. **Checkpoint:** Lead posts the phase report (also mirrored as a comment on the phase epic issue) and waits for your go (or notifies + proceeds under `--afk`).

## 5. Escalate (halt) vs resolve in-band
- **Escalate** — the plan is wrong/underspecified: plan contradicts the code or itself; a named interface/file the plan assumes is absent or different; an ambiguity with >1 non-equivalent resolution; an ADR-worthy deviation; `audit-blocked` (round_limit); an unresolvable rebase conflict.
- **In-band** (handled silently by workers/auditors): bugs, style, missing tests, local refactors, neighbor-impact fixes.

## 6. State & resume

**One authority, two durable advisory records** ([ADR-0008](../../../docs/adr/0008-git-is-the-resume-source-of-truth.md)).

**Precedence: git branch state > GitHub issue labels > `ledger.json`.**

- **Git branch state** — the de-facto authority. The refiner's push-first CAS never `--force`es a shared branch, so the integration/working branches are monotonic: a recorded merge is real *iff* its SHA is reachable on the branch. Git can only *lag* (a crash before push), never be *wrong*.
- **GitHub issues** — human-visible task truth (labels in [`schemas.md`](schemas.md)). Remote-durable and human-visible; survive a local wipe. Advisory: repaired toward git on resume.
- **`ledger.json`** (`.claude/teams/<run-id>/`, uncommitted) — DAG, worktree/branch map, SHAs, verdicts, escalations. The richest record but the weakest authority — local, uncommitted, written by no code, a **lagging view**. A rendered `ledger.md` is the eyeball view. Advisory: repaired toward git on resume.
- **Workflow `resumeFromRunId`** — **off-ladder**: an intra-phase replay cache, not a landed-state record. A resumed phase re-runs the gate and the push-first CAS, so a stale cached "merged" is caught at re-land and never trusted. No reconciliation is defined for it.

Before resuming, the Lead runs the **Resume reconciliation pre-flight** (see `SKILL.md` Resume section): a read-only cross-check that repairs the lagging layers toward git and halts on any unexplained commit (class C). Repair is one-way — records are rewritten toward git; no step mutates git to match a record.

**Submodule remote as co-source-of-truth** ([ADR-0010](../../../docs/adr/0010-submodule-landing-authority.md)). The same monotonicity argument holds for the submodule remote: the submodule's own push-first CAS never force-pushes its branch, so the gitlink SHA recorded in the ledger is authoritative *iff* it is reachable on the submodule remote. The reconciliation pre-flight extends to verify this: a ledger-recorded gitlink SHA that is *not* reachable on the submodule remote is treated as class A (the pin never landed — re-queue the bump task). The ledger gains submodule PR/SHA fields; these are advisory, authoritative-when-reachable — the same rule as `merge_sha` ([`schemas.md`](schemas.md)).

Durable product artifacts: phase reports/escalations → epic-issue comments; ADR-worthy deviations → `docs/adr/`.

## 7. Branch & worktree model
- One mutable worktree per task (worker + its fix-workers share it; it persists until the task lands so kick-backs can fix in place). Cleaned up after the task merges.
- Auditors read files through Read/Grep/Glob and compute the diff through read-only git Bash (no checkout to mutate); read-only is guaranteed by the tool restriction plus a fail-closed PreToolUse guard (`hooks/validate-auditor-git.sh`) that denies any Bash beyond allowlisted read-only git subcommands.
- Integration branch removed after the phase lands; worktrees of escalated/blocked tasks are kept for inspection.

## 8. Cost & models
Per-role models are the `war-config.mjs` DEFAULTS (the authority — `DEFAULTS.agents.<role>.model`), never restated here as literals that rot; e.g. the current defaults run `war-worker`/fix at opus/`max` and `war-refiner` at sonnet. `war-auditor` runs at the auditor default; Lead = session model. Concurrency = the Workflow default (`min(16, cores−2)`). The **< 3× single-agent cost** target holds for the cheaper tiers (economy/balanced); the quality-first `thorough` preset (fable/`max` workers, opus/`max` auditors, a 5-lens `auto` pool) deliberately trades cost for depth and is expected to exceed it.

## 9. Harness notes (ECC / OmniEMR first run)
- **GateGuard** present-and-retry: workers/refiners present the requested facts then retry the identical Bash/Write op.
- **No `temperature`** on current Opus/Fable — any SDK call a worker writes must omit it.
- We may run *inside* a Claude worktree already; nested worktrees off the working branch use absolute paths and avoid `.claude/worktrees/` collisions.

## 10. What WAR keeps / drops / changes vs Gas Town
- **Keeps:** the four roles, the Nun gate's fail-closed convergent unanimity + severity + the multi-lens roster + plan-faithfulness, integration-branch waves + `--no-ff` land, GUPP propulsion, the read-only-by-construction auditor.
- **Drops:** the Go orchestrator, Dolt/beads, `gt mail`/nudge, the standalone Witness/Deacon daemons, tmux session management.
- **Changes:** durable state → GitHub issues + a JSON ledger; propulsion → Workflow control flow (no polling); auditor read-only → tool restriction (Read/Grep/Glob + a fail-closed guard restricting Bash to read-only git) instead of detached-checkout-push-unset; the merge queue → a serial Workflow loop instead of batch-then-bisect.

## 11. Validation criteria
- Lead never edits code (only orchestrates/gates). · Auditors cannot write/commit/push. · A task can't merge with an open Critical/Major, without a green gate, or before unanimous audit on one SHA. · "Green by deletion" is caught and escalated. · A killed Lead resumes from ledger + issues. · Each phase lands as one `--no-ff` commit; the run ends in exactly one PR. · `/cost` < 3× a single-agent baseline.

## 12. Deferred (post-v1)
Batch-then-bisect merge queue · live-SendMessage audit debate · multiple concurrent phases · multi-repo · per-task GitHub PRs as the review surface · learned roster seeding (flagging high-blast-radius tasks from history).

## 13. v0.2.0 amendments
- **Issue timing:** file **all phase epics up front** at the approval gate (full scope before any teammate launches), but break each phase into **task sub-issues just-in-time** at that phase's start — so later phases absorb earlier phases' learnings and plan drift, while still honoring "write all issues before launching any teammates" at the epic level.
- **New role — `war-servitor`** (sonnet): after a phase *lands*, a single write-mode pass captures **durable learnings** into the **learnings target** (the agent-memory dir `~/.claude/projects/<proj>/memory/` with `MEMORY.md` if present, else committed `docs/learnings/phase-N.md`). It is fed the phase's audit log + escalations. Auditors stay **read-only**; the servitor is the only reviewer-side writer, and its writes are confined to `learningsTarget` by its capability allowlist (no Bash — only Read/Grep/Glob/Write/Edit), with the PreToolUse scope hook gating the residual Write/Edit paths by `agent_type` to the learnings path-pattern ([ADR 0002](../../../docs/adr/0002-scope-by-agent-type.md)). Cadence: **once per phase** (not per task). Captures signal only — gotchas, plan↔code mismatches, deviations+why, patterns — never routine "implemented X" notes.
- **Roles table** now includes Servitor (→ Gas Town's `bd remember`).
- **Flow** gains a **Wrap-up** stage after Land; the Workflow returns `servitorResult` alongside `{ landed, escalated, minorsFiled, landResult }`.

## 14. v0.3.0 amendments
- **New skill — `/war-room`** (conversation-only): interviews the user from a preset (balanced/thorough/economy) plus targeted overrides, and writes a run config to `.claude/war/config.json`. It never decomposes a plan or launches `/war`.
- **Config surface.** `skills/war/assets/war-config.mjs` owns the schema, defaults, presets, and validation (a single tested source of truth, used by both skills). The `/war` Lead loads and validates the config in Setup, applies non-null `overrides`, and threads `agents` / `audit` / `run` into the per-phase Workflow `args`. `workflow-template.js` reads those instead of hardcoded model literals.
- **Configurable knobs:** per-role `model` (opus/sonnet/haiku/fable) and `effort` (default…max, where `max` = "ultrathink"); `roster` (1–5 distinct-lens seats, per-seat depth) with `rosterPolicy` (auto/all/solo) seeding per-task rosters; `autoEscalate` (set `false` with `rosterPolicy: "solo"` to pin exactly one auditor); `roundLimit`; `afk`.
- **Backward compatible.** No config file → byte-for-byte the pre-v0.3.0 behavior (`effort: "default"` passes no effort opt; built-in model defaults unchanged).

## 15. v0.4.0 amendments
- **New sibling skill — `/red-team`** (completes the trilogy): `/war-room` configures a run → **`/red-team` hardens the plan** → `/war` executes it. It runs *before* `/war`, attacking the input plan so WAR fans out over claims that have been **proven, not assumed**. Conversation-driven + Workflow-backed; **not** part of `/war`'s per-phase engine, which is unchanged.
- **Spine + bespoke probes.** Derives a universal spine of adversarial lenses (claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility) plus plan-tailored probes, and **proves** each claim by running the plan's tests/edits/commands in **throwaway sandboxes** (temp dirs / git worktrees) — never touching the target repo. Analysis lenses use the read-only `Explore` agent; execution probes run isolated.
- **Prove-don't-assert (`adversarial-confirm`).** A blocking finding is **downgraded to a warning unless an independent confirm agent reproduces it** — the Nun gate's fail-closed-on-evidence discipline applied to plan verification, surfaced as the named `adversarial-confirm` Workflow stage.
- **Outcome:** grills the user on every blocker, patches the plan **in place** until **CLEARED**, and leaves a report under `docs/red-team/`.
- **Surface.** `skills/red-team/` — `assets/red-team-gate.mjs` (verdict + severity-classify logic, tested), `assets/workflow-scaffold.js` (copy-per-plan Workflow: spine + probes + adversarial-confirm), `references/lenses.md`, `SKILL.md` runbook. Design notes: [`red-team-design.md`](../../../docs/specs/2026-06-18-red-team-design.md). v0.4.0 is purely additive (new front-end skill + version bump).

## 16. v0.4.1 amendments
- **Land-path-agnostic Wrap-up.** The servitor's Wrap-up is now an obligation satisfied **once per landed phase regardless of who lands it**, not a stage welded to the in-flow land. The template surfaces `landDecision` (`landed` | `held:escalation` | `held:nothing-merged`) and the `auditLog` in its return; on a `held:*` decision the Lead lands manually (the human-owned boundary, unchanged) and then runs `war-servitor` itself with the returned `auditLog` + escalations + resolution. Guard: run only when `servitorResult` is absent (no double-capture).
- **No silent land.** The previously-unlogged `landed.length === 0 && !hardEscalation` case is now `held:nothing-merged` with an explicit log; the land decision is observable in every run. The hard-escalation hold set (`escalate`/`audit-blocked`/`conflict`) is unchanged — `gate_failed`/`error` still do not, by themselves, block a land that has other merged tasks.
- **decideLand** is the canonical, unit-tested decision (`assets/land-decision.mjs`), mirrored inline in `assets/workflow-template.js` (the Workflow sandbox can't import) — keep in sync, same pattern as `ROLE_MODEL`.

## 17. v0.6.0 amendments
- **Refinery now operates in `_refinery`.** Every `war-refiner` merge — the integration-side of merge-task and the working-branch land — runs inside a run-scoped **refinery worktree** at `<worktreeRoot>/<runId>/_refinery`. The refiner never runs `git merge`, `git checkout`, `git update-ref`, or `git push` against the Lead's main checkout. See [ADR-0004](../../../docs/adr/0004-refinery-merges-in-a-worktree.md).
- **Land is push-first (the CAS).** The working branch is checked out in the Lead's cwd and cannot be checked out again, so the land runs in a **detached** `_refinery` at the working tip. The `git push` (no `--force`) is the atomic compare-and-swap against shared truth; the local `refs/heads/<working>` is advanced as a follower only on push success.
- **`land_stale` joins the hard-escalation set.** When same-branch land contention exhausts `roundLimit` relands, the result is `land_stale` — a distinct hard-escalation status for CAS-topology failure, held for the Lead. It is not `conflict` (which is a merge-text failure). Added to `HARD_ESCALATION_REASONS` in `land-decision.mjs` and mirrored inline in `workflow-template.js`.
- **§12 scope update.** "Multiple concurrent runs in one repo" (previously fully deferred) is now **partially in-scope**: the Refinery's write surface is isolated so two runs on different working branches land without contention and without serialization. Multi-repo and concurrent-phases remain deferred.

## 18. Clean-handoff amendments (ADR 0012/0013)

- **Disposition routing (ADR 0013) — classify-at-collection.** Every Minor/Nit finding routes **once**, by auditor-owned `disposition`, orthogonal to severity: `absorb` (mechanical, intent-consistent — executed in-phase), `follow-up` (files a `war-followup` issue; the auditor must state why it is not absorbable), `note` (phase report + servitor feed, never an issue). Omitted → Minor becomes follow-up, Nit becomes note; `absorb` is never defaulted; legacy `autoFixable:true` reads as `absorb` for one release (deprecated). `minorsFiled` receives only `follow-up`; a new `notes` array receives `note`. This **replaced** the old eager `minorsFiled` push + aced-splice mechanics. The **terminal-disposition demotion ladder** guarantees zero unrouted findings on every exit path: demote one step toward durability, never drop silently, every demotion logged — failed absorb → follow-up; findings on a task that never reaches the approve branch → follow-up, filed with the escalation; a held phase's queue → drained to follow-up; a fileless absorb → its severity default. The ace's orchestrator backstop **narrowed** to the two pure version-slot JSONs (`plugin.json`/`marketplace.json`); README and other shared files route to the sweep instead of being refused.
- **Phase-close coherence sweep (ADR 0012) — fail-open, at the integrated tip.** Runs **after** the land decision is computed and **before** the land dispatch, iff `landDecision === 'landed'` and the `phaseCloseQueue` is non-empty. The refiner provisions a `_polish` worktree (branch `war/<slug>/p<N>-polish`) at the post-merge integrated tip via the existing `ensure-worktree`; **one** war-worker drains the queue verbatim (one commit, gate green, no version-slot literals, no ad-hoc seam hunting); the **full config-default roster** re-audits the polish SHA under the same unanimity rules (the Lead may not downgrade it). Re-approved → merged at the serial queue's tail, the land proceeds on the polished tip, the queue is recorded on `aced` at the polish SHA. Anything else → **discard**: branch + worktree left in place (reaping is a human act), queue demoted to follow-up, the pre-polish tip lands exactly as it would have — a discarded sweep recomputes nothing. Bookkeeping is a Lead-side task-grade ledger entry + the handoff block; **no owned-refs registration** (the spec's §4.5.5 described machinery that does not exist).
- **Intent threading + handoff (ADR 0013).** `args.intent` (the plan's `## Commander's Intent` or `## AI-Commander's Intent` — either heading, Lead-extracted verbatim, never Lead-invented except by `/war-machine --afk` (ADR 0014), string|null) threads into worker, auditor, ace/sweep, gate-audit, and servitor prompts — plan slice = floor, intent = ceiling; `null` ⇒ byte-identical intent-less prompts (literal behavior). The gate-audit pass additionally checks the phase's claimed End-state conditions at the confirmed tip (provably unmet → HARD; unverifiable → SOFT; later-phase → out-of-scope, never a hold; when no task is gate-auditable but conditions are claimed, ONE End-state-only seat spawns). The return gains `notes` and — on `landed`/`held:escalation` only — the machine-readable `handoff` block (see `schemas.md`).
