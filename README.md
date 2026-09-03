# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Workflows](https://code.claude.com/docs/en/workflows)-based multi-agent orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary. Fresh workers implement, independent auditor panels review, a serial refinery gates every merge: the code that lands is **production-grade**, even when it lands while you sleep.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown), built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**. WAR keeps Gas Town's worker / auditor / refinery roles, **absorbs the witness's live coordination into the Workflow itself**, and adds a **servitor** that records each phase's learnings.

## TL;DR

Sixty seconds, five commands:

```
/snipe                                 # quick audit of your current branch — 1 read-only seat, lens picked for the diff
/snipe 3 correctness,security,auto     # 3 seats: two pinned lenses + one Lead-picked
```

- **`/snipe`** — quite possibly the most lightweight-and-useful skill in the plugin: a one-shot audit of whatever you have right now, by WAR's own read-only auditor seats (opus/`high` by default, [configurable](#quick-audit-snipe)), verdicts reported straight in chat. No plan, no worktrees, no side effects — findings that *would* block a phase are labeled as such, and nothing is gated or filed without you.
- **The real thing** — `/war-strategy` interviews you into a merged plan, `/red-team` adversarially proves it, `/war <plan>` executes it with fresh workers, independent auditors, and a serial merge queue, checking in at every phase boundary. The first two stand alone, too: a `/war-strategy` plan is a complete, evidence-tagged decision record any agent (or human) can implement — you don't have to run a full war to get value from the interview.
- **Overnight** — `/war-campaign` queues plans and plows them into stacked PRs while you sleep; `/aftermath` sweeps up after the merge.
- **Tuning** — `/war-room` writes the run config (models, effort, audit roster); `/lessons-learned` keeps the compounding memory honest.
- **Lost?** — `/war-help` prints the orientation card.

## Why WAR

Multi-agent parallelism is table stakes now. WAR's bet is different: **verification discipline you can reproduce.**

- **Audits are the product.** Every task's diff faces a roster of 1–5 independent, **read-only** auditor seats — each reviewing through a distinct lens (`correctness`, `cascading-impact`, `plan-faithfulness`, `security`, …), each judging the same pinned SHA. Findings are severity-tagged, Critical/Major block, and approval is **unanimous**; then a serial refinery rebases, re-runs your gate, and merges. Nothing lands on the say-so of the agent that wrote it. Paired with your CI/CD, this is what makes agent-written code **production-grade** instead of merely plausible.
- **Plans in, intent honored.** WAR executes plans, not vibes. The pipeline grills the ambiguity out *before* anything spawns — `/war-strategy` interviews you to one merged plan (decision record + decomposed phases in a single artifact), `/red-team` adversarially **proves** the plan's claims in throwaway sandboxes — and the plan's **Commander's Intent** (purpose, method, checkable end state) rides into every worker and auditor prompt: the plan slice is the floor, your intent is the ceiling.
- **Deterministic where it counts.** The coordination — phase loop, dependency waves, serial merge queue, severity gate — is knowable up front, so it lives in a deterministic, resumable Workflow script rather than emergent agent negotiation ([why](skills/war/references/design.md#why-a-workflow-not-the-agent-teams-feature)). Same plan, same shape; git is the resume authority ([ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md)).
- **Runs compound.** After each phase, a write-scoped servitor records durable learnings under a provenance ladder (`agent-unverified` < `code-verified` < `user-confirmed`), verifying each referent against the codebase before writing. The loop closes the other way too: at each phase launch the Lead **prefetches the most relevant prior lessons** and pushes them into the worker and auditor prompts, so past pitfalls arrive as context before the mistake repeats. `/lessons-learned` keeps the store honest against the live repo over time. By default the store stays local to your machine; turn on `commitLearnings` (via `/war-room`) to commit distilled, lint-scrubbed lessons under `docs/learnings/` so they travel with the repo and compound across your team. Your fiftieth run knows what your fifth one learned. *(Retrieval and publication use a zero-dependency Node ≥ 24 CLI — `node:sqlite`'s in-memory FTS index; on older Node the memory features simply no-op and the run proceeds unaffected.)*
- **Nothing but the plugin.** Stock, generally-available Claude Code primitives — `Workflow`, `Agent`, git worktrees, `gh`. No server, no daemon, no framework, no experimental flags. Every Claude Code release makes WAR stronger, not obsolete.
- **Built for overnight.** Queue plans with `/war-campaign` in the evening; the audit gate + your CI hold the line unattended; wake up to stacked, ready-to-review PRs.

## What it does

Given a plan like [docs/plans/2026-06-18-war-room.md](https://github.com/Ljferrer/WorkAuditRefine/blob/master/docs/plans/2026-06-18-war-room.md), `/war` will:

1. **Decompose** the plan into one or more phase(s) → task DAG and propose it to you as GitHub issues — all phase **epics up front**, task **sub-issues just-in-time** per phase. *You approve before anything spawns.*
2. For each phase, run a **Workflow** that:
   - **Works** — fresh worker agents implement each task in isolated git worktrees, writing the plan's mapped tests.
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA). Each task convenes its own **roster** of 1–5 distinct-lens seats, each at its own depth; the default roster is the quartet (`correctness`, `cascading-impact`, `plan-faithfulness`, `security`) at `deep`.
   - **Refines** — a serial merge queue rebases, re-runs the gate (`tests/lint`), and lands approved tasks on a per-phase integration branch.
   - **Records** — after the phase lands, a write-scoped servitor captures durable learnings into memory (and at each phase's launch the Lead prefetches the most relevant prior lessons into the worker/auditor prompts).
3. **Lands** each phase onto your working branch as one `--no-ff` commit, pushes, and **checks in with you**.
4. Opens **one PR** from the working branch to the landing branch at the end.

Run autonomously inside a phase; gated by you between phases (`--afk` to loosen).

## Install

Add the marketplace:

```
/plugin marketplace add Ljferrer/WorkAuditRefine
```

Install the plugin:

```
/plugin install work-audit-refine@work-audit-refine
```

### Updating

When a new version ships, pull it into your install.

Git-pull the marketplace:

```
/plugin marketplace update work-audit-refine
```

It automatically bumps your install to the new version. Changes apply to the next session — or run `/reload-plugins` to force a reload without restarting.

> **Authors — bump the version or the update is a silent no-op.** Claude Code caches plugins by the `version` string in [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json), so pushing new commits without bumping it leaves every consumer on the cached copy. While iterating locally, skip the round-trip: launch with `claude --plugin-dir /path/to/WorkAuditRefine` and run `/reload-plugins` after each edit — local paths resolve to version `unknown`, so every reload picks up your latest files.

### Recommended Auxiliary Plugin

[**Grill Me**](https://github.com/mattpocock/skills/tree/main#quickstart-30-second-setup) — one install covers `grill-with-docs`, `grilling`, and `domain-modeling`.

**Why we recommend it.** WAR owns its interview doctrine in-repo ([`skills/war-strategy/references/plan-interview.md`](skills/war-strategy/references/plan-interview.md)), so bare `/war-strategy` runs the plan-authoring interview itself — one interview to completion, one merged plan — with no auxiliary skill installed. Matt Pocock's Grill Me family is the recommended front door on top of that doctrine: its interviewing voice walks you down every branch of the design tree, resolving one decision at a time, and when the family is installed `/war-strategy` offers that route and binds it to the same merged deliverable via its HANDOFF DIRECTIVE. Install it for the interviewing style; skip it and nothing in the pipeline degrades.

Other plugins run happily alongside WAR — no part of the pipeline depends on them.

## Usage

The command set, in the order you'll run it: **`/war-help`** orients you → **`/war-room`** configures a run → **`/war-strategy`** interviews you to a merged plan (and converts existing drafts) → **`/red-team`** hardens the plan → **`/war`** executes it → **`/war-review`** tallies what the run cost and flags any friction. Scaling up: **`/survey-corps`** turns open issues and hot memories into specs → **`/war-machine`** turns specs into merged plans + a roadmap → **`/war-campaign`** runs the plans back-to-back unattended → **`/aftermath`** cleans up the debris → **`/lessons-learned`** keeps the accumulated memory honest. Standing apart from the pipeline: **`/snipe`**, the one-shot quick audit you can fire at any moment, no plan required.

### Get oriented (`/war-help`)

New to WAR, or just want a refresher? Run the orientation card:

```
/war-help
```

It prints a one-screen map — what WAR is, the command set, the five roles, how a run flows, and the
prerequisites — then offers deep-dive links and a handoff to `/war-strategy`. Doctrine:
[`skills/war-help/SKILL.md`](skills/war-help/SKILL.md).

### Quick audit (`/snipe`)

The lightest skill in the plugin: convene 1–5 of WAR's own read-only auditor seats against whatever you have right now, get their verdicts in chat, done. No plan, no worktrees, no merge queue, no filing — the audit machinery alone, on demand.

```
/snipe [<target>] [<seats 1-5>] [<lens[,lens...]>]
```

```
/snipe                                  # 1 seat, lens picked by the Lead for the diff's shape
/snipe 3                                # 3 seats, all Lead-picked
/snipe correctness,security             # exactly those 2 seats
/snipe 3 correctness,auto               # 3 seats: correctness pinned + 2 Lead-picked
/snipe origin/master..HEAD 2 security   # explicit range, 2 seats, security pinned + 1 Lead-picked
```

**Arguments** (both trailing, order-tolerant — anything before them is the target):

- **Seat count** — a trailing integer `1`–`5`; default `1`. Effective seats = `min(5, max(integer, lens tokens, 1))` — a lens list longer than the integer wins.
- **Lenses** — trailing comma-separated list; `auto` entries are seats whose lens the Lead picks itself, with a one-line rationale each. Default all-`auto`. Duplicate lenses and the reserved built-ins (`execution-evidence`, `pin-validity`) are refused. A bare single word counts as a lens only when it's `auto` or a catalog lens — `master` is a target, `correctness` is a lens.
- **Target** — a ref range, PR number, or path list. Default: the current branch against its merge-base with the default branch. A dirty working tree (with no explicit target) is audited as-is and the whole report is marked **advisory** — there's no stable SHA to pin.

**Seats** spawn in parallel as the same read-only `war-auditor` agents a phase convenes — standing card, `agent_type` guard confinement, severity + disposition vocabulary — always at `deep` depth, at the model/effort from your run config: `agents.snipe` (default `opus`/`high`), falling back to `agents.auditor` on an explicit `null`. Override it via `/war-room` or by hand in `.claude/war/config.json`.

**The report** is informational — nothing is gated: per-seat verdicts, findings ranked by severity with Critical/Major labeled *would block in a phase*, and every `ask`-disposition finding surfaced for your ruling. `/snipe` never fixes, never files; you decide what to absorb, file, or drop. Output is directly comparable to in-run audit verdicts — same card, same lenses, same vocabulary — which is what separates it from a generic code review.

Never auto-invoked. Doctrine: [`skills/snipe/SKILL.md`](skills/snipe/SKILL.md); argument grammar owned by [`skills/snipe/assets/snipe-args.mjs`](skills/snipe/assets/snipe-args.mjs).

### Configure a run (`/war-room`)

By default WAR runs opus workers at session effort and sonnet auditors on `max`, and under `rosterPolicy: auto` the Lead composes each task's audit roster from the lens catalog — 1–5 seats, each at its own depth with a one-line rationale — at the approval gate (a triggered lone seat later widens toward the auditor's own nomination, or the default roster if it names none). To change that — pick models per role, put a worker on **ultrathink**, shape the roster (seats, lenses, per-seat depth) or its seeding policy — run the companion skill first:

```
/war-room
```

Or invoke it in natural language — e.g. *"To the war room!"*.

It interviews you (starting from a **balanced / thorough / economy** preset, then only the overrides you ask for), validates your choices, and writes `.claude/war/config.json`. `/war` auto-discovers that file on its next run (or pass `--config <path>`). **No config file → today's defaults, unchanged.** Doctrine: [`skills/war-room/SKILL.md`](skills/war-room/SKILL.md); the config schema's single tested source of truth is [`skills/war/assets/war-config.mjs`](skills/war/assets/war-config.mjs).

**What "today's defaults" actually are.** With no config file WAR runs the built-in `DEFAULTS`: opus workers on `default` effort, sonnet auditors on `max`, `rosterPolicy: auto` (the Lead composes each task's roster), the pre-merge ace-fix on, and a 6-round fix budget (`run.roundLimit`). For **memory** the defaults are `retrieval: true` with `topK: 10` (prefetch the ten most relevant lessons into each seat's prompt) and **`commitLearnings: false`** — distilled `project`-typed lessons stay local to your machine unless you opt in via `/war-room` (see [Tidy the memory](#tidy-the-memory-lessons-learned) for the publication pitch). The three presets move the whole profile at once: **`balanced`** *is* the defaults, **`thorough`** swaps in its own five deep lenses on opus auditor seats, lifts worker and auditor to `max` effort and refiner and red-team to `xhigh` (servitor alone moves to opus at `default` effort), and pumps tokens, and **`economy`** pins the cheaper knobs it always had — sonnet on every top-level role, a solo roster, a 2-round budget, and ace off. `/war-room` only ever asks about the overrides you want *on top of* the chosen preset.

### Author a plan (`/war-strategy`)

**One interview, one merged artifact.** The pipeline's execution artifact is a single **merged plan** (`docs/plans/`): Part 1 is the ratified decision record — problem, pivotal constraints, resolved design tree, assumptions ledger, every claim of fact evidence-tagged — and Part 2 is the dispatch structure `/war` consumes — phases and tasks with exact file sets, `requiresTest`, `deps`, and target repo. The plan carries its own *what* and its own *how*. A **design spec** (`docs/specs/`) is an *input shape* only — how `/survey-corps` synthesis and externally-brought drafts arrive; it carries no dispatch structure, so `/war` cannot execute one, and `/war-strategy` converts it into the merged plan. Every plan opens with a **Commander's Intent** — **Purpose** (why), **Method** (how you envision winning), **End state** (numbered, individually *checkable* conditions) — drafted from your answers, confirmed by you explicitly, and threaded into every worker and auditor prompt: the plan slice is the floor, your intent is the ceiling. Full glossary: [`CONTEXT.md`](CONTEXT.md).

**Author a plan by interview.** Bare invoke runs the plan-authoring interview itself, per the in-repo doctrine [`skills/war-strategy/references/plan-interview.md`](skills/war-strategy/references/plan-interview.md) — recon, a walk down the design tree with an evidence tag on every resolved decision, a pre-mortem, and two echo-back gates — terminating only on one merged plan in `docs/plans/`. When the Grill Me family is installed (see [Recommended Auxiliary Plugin](#recommended-auxiliary-plugin)) it offers that front door and binds it to the same merged deliverable; when it isn't, the interview runs all the same:

```
/war-strategy
```

**Convert an existing draft.** Bring it a design spec, rough plan, roadmap, or design doc — it reviews the artifact for war-shape gaps (untagged factual claims, a missing assumptions ledger, untagged End states, `requiresTest: true` without `Done when:`, same-file collisions, …), interviews you gap-by-gap under the same question contract, and converts the artifact into the merged shape in `docs/plans/` (drafting the plan's Commander's Intent from your answers and echoing it back for explicit confirmation):

```
/war-strategy docs/specs/design.md
```

**Pipeline doctrine:** war-strategy **authors and converts**; `/red-team` **validates** plans and never converts (see
[`CONTEXT.md`](CONTEXT.md)). Doctrine: [`skills/war-strategy/SKILL.md`](skills/war-strategy/SKILL.md) and the
interview doctrine at [`skills/war-strategy/references/plan-interview.md`](skills/war-strategy/references/plan-interview.md).

### Harden a plan (`/red-team`)

Before you hand a plan to `/war`, attack it. `/red-team <plan-file>` reads the plan, runs a universal spine of adversarial checks plus probes tailored to the plan, and **proves** the plan's claims by running its tests/edits/commands in throwaway sandboxes — never touching your repo. It then grills you on every blocker and patches the plan in place until it reaches a proceed verdict — **CLEARED**, or **ADJUDICATED** when a patched blocker was not re-verified by a probe re-run ([ADR 0043](docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md)) — leaving a report under `docs/red-team/`.

`/red-team` **validates plans; it never converts a spec into one** (war-strategy **converts**, red-team **ratifies** — see [`CONTEXT.md`](CONTEXT.md)). Have a design spec instead of a plan? Bring it to [`/war-strategy`](#author-a-plan-war-strategy) first, then red team the resulting plan.

Or invoke it in natural language — e.g. *"Red team my plan at docs/..."*. Doctrine: [`skills/red-team/SKILL.md`](skills/red-team/SKILL.md).

### Go to war (`/war`)

The main command:

```
/war <plan-file> [--working <branch>] [--landing <branch>] [--afk] [--ace] [--config <path>]
```

Or invoke it in natural language — e.g. *"Go to war on issues #20 & #22"*.

**Prerequisites:** a clean git working tree, a GitHub remote, and authenticated `gh` — WAR files issues and opens a PR on your behalf, and refuses to start on a dirty tree. No experimental flags or `settings.json` changes are required — `/war` runs on the stock `Workflow` and `Agent` tools, not the experimental agent-teams feature ([why WAR uses Workflows instead](skills/war/references/design.md#why-a-workflow-not-the-agent-teams-feature)).

**Arguments:**

| Argument | Required | Default | What it does |
|---|---|---|---|
| `<plan-file>` | yes | — | Path to the multi-phase plan to execute, e.g. `docs/plans/implementation_plan_A.md`. |
| `--working <branch>` | no | current branch | Branch each phase lands on, one `--no-ff` commit per phase. |
| `--landing <branch>` | no | repo's default branch | Branch the final PR targets. |
| `--afk` | no | off | Don't stop at phase boundaries — post a report + push notification and keep going. Hard escalations still halt. |
| `--ace` | no | on via config `run.ace` (economy preset: off) | Fix auditor-flagged Minor/Nit findings on the spot: an approved task's `absorb`-routed findings get one pre-merge ace commit, gated by the task gate and re-audited at the new SHA, instead of being filed as `war-followup` issues. A regression enters a bounded bisection ladder: the re-audit's named culprits are excised first, the rest is bisected into subset commits, and each surviving subset lands while every failed subset forward-reverts and its findings demote to `war-followup`. Never blocks a land — if nothing survives, the originally-approved work lands anyway. (`/war-campaign` passes `--afk --ace` by default.) |
| `--config <path>` | no | `.claude/war/config.json` if present | Use a specific run config (per-role model/effort, roster policy, …) produced by `/war-room`. |

**Example:**

```
/war docs/plans/implementation_plan_A.md --working dev/planA --landing master
```

**What happens when you run it:**

1. **Setup** — WAR confirms the repo/`gh` state, detects your **gate command** (`uv sync && ruff check && pytest`, your `package.json` lint/test scripts, or it asks once), and picks a **learnings target** for the servitor. No phase ever runs without a gate.
2. **Decompose + approve** — it reads the plan, proposes a phase → task DAG as a GitHub-issues preview, and **waits for your approval.** Nothing spawns until you say go; all phase epics are filed up front, task sub-issues just-in-time per phase.
3. **Per phase** — the Lead prefetches relevant prior lessons into the seat prompts → workers implement each task in isolated worktrees → read-only auditors review the pinned SHA (Critical/Major findings block; approval is unanimous) → a serial refinery rebases, re-runs the gate, and merges → a write-scoped servitor records durable learnings.
4. **Checkpoint** — the phase lands on `--working` as one `--no-ff` commit and is pushed; WAR posts a phase report and **checks in with you** before the next phase (skipped under `--afk`; hard escalations halt regardless).
5. **Finish** — after the last phase, it opens **one PR** from `--working` → `--landing` and reports the URL.

**Resuming:** every run writes a ledger at `.claude/teams/<run-id>/ledger.json` — the richest resume record, reconciled toward git on resume (git branch state is the authority, [ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md)). If a run is interrupted, re-invoke `/war` with the same plan to continue from the ledger + open issues.

### Review the run (`/war-review`)

Once a run lands, see what it cost — and whether WAR itself hit any friction worth filing back to the plugin:

```
/war-review [--run <runId>] [--scavenge [<plan-slug>]]
```

It reads the newest run manifest `/war` leaves under `.claude/war/runs/` (or the one you pin with `--run`), mines the referenced workflow transcripts, and renders the full telemetry set — workflows and sub-agents by role, tool calls, tokens (in/out/cache when available), wall-clock total and per phase, audit rounds against the limit, findings by severity and disposition, tasks by terminal status, relands, lessons, and issues — both in chat and saved to `<runId>-review.md` beside the manifest. Anything it can't source renders `n/a`; it never fabricates a number.

It closes on **friction** — `held:*` escalations, `env-blocked` tasks, reland loops, round-limit exhaustion, dropped agents, guard denials, sweep failures — each row backed by evidence, with a verdict of **clean** or **friction found (N)**. On friction it drafts **one** issue against the plugin's own repo (resolved from its metadata) and files it **only on your explicit confirm**. `--scavenge` reconstructs a pre-manifest run best-effort from session artifacts, labeled as scavenged.

### Turn issues into specs (`/survey-corps`)

Your backlog is raw material. Before the issue sweep, `/survey-corps` mines both memory roots — hot lessons that name open, actionable defects become `memory-mined` issues, lint-guarded (redaction hits withheld, never scrubbed) and slug-deduped against open **and** closed issues so nothing sensitive or already-filed is re-filed. It then sweeps the repo's open GitHub issues (run-bookkeeping labels dropped, `war-followup` debt first-class), fans out a reader agent per issue, clusters the summaries into coherent groups, and synthesizes **one war-shaped design spec per group** into `docs/specs/` — then verifies every swept issue is claimed or explicitly deferred. It commits nothing; it hands off to `/war-machine` via an uncommitted survey manifest.

```
/survey-corps [--erwin]
```

`--erwin` adds two human gates: one before filing any mined issue (you approve the drafted batch) and one after clustering (you approve the proposed groups before synthesis). Bare invoke is fully autonomous end to end, so the step stays cron-able.

### Turn specs into plans (`/war-machine`)

The middle step of the pipeline: `/war-machine` consumes the freshest survey manifest (or the spec paths you pass), runs a drafter + adversarial-grill agent pair per spec strictly serially, writes the merged plans to `docs/plans/` and a campaign roadmap to `docs/roadmaps/`, and prints the `/war-campaign` handoff — it **never launches the campaign and never red-teams**. It relies on `/war-strategy`'s templates and conversion doctrine rather than forking them.

```
/war-machine [spec-paths…] [--afk]
```

Interactive by default (it interviews you lightly, including the Commander's Intent echo-back per plan); `--afk` makes it cron-able — it authors a provenance-marked **AI-Commander's Intent** block instead ([ADR 0014](docs/adr/0014-ai-commanders-intent.md)) and its closing commit leaves the tree clean for `/war`.

### Run a campaign (`/war-campaign`)

Once you have several plans, run them back-to-back, unattended, in one chat:

```
/war-campaign <plan…|roadmap-path> [--wait-for-merge]   # start
/war-campaign                                           # resume the latest unfinished campaign
/war-campaign add <plan-path>                           # from any chat — drop a plan into the queue
```

Each plan is hardened (`/red-team`) and executed (`/war … --afk --ace`) in turn, stacking each plan's branch on the
prior plan's tip and its PR on the prior plan's branch — so later plans see earlier plans' code without a
human merging overnight (the **stack-and-plow** model, [ADR 0011](docs/adr/0011-campaign-stack-and-plow-branch-model.md)). `--wait-for-merge` switches to the linear alternative: wait for each PR to merge before
basing the next plan off fresh `master`.

**`/war-campaign` never auto-invokes** — you must run it explicitly. A plan that can't be hardened or hard-halts
**halts the whole campaign** (halt-and-hold) rather than letting later plans build on incomplete work; every
plan below the failure has already landed as its own stacked PR, merged **bottom-up**. To ride out overnight
context compaction, the Lead keeps a write-ahead `CAMPAIGN-STATE.md` resume brief current before each long
wait, and a campaign-gated `SessionStart(compact|clear|resume)` hook re-injects it into the fresh window so
the campaign re-anchors where it left off. Doctrine: [`skills/war-campaign/SKILL.md`](skills/war-campaign/SKILL.md);
the branch model is [ADR 0011](docs/adr/0011-campaign-stack-and-plow-branch-model.md).

### Clean up (`/aftermath`)

WAR campaigns leave debris — stray integration and task branches, orphaned run worktrees, done-but-open bookkeeping issues, survey-swept issues whose PRs merged. `/aftermath` deletes or closes **only what a checkable evidence chain proves is safe**, with git as the source of truth at every gate (ancestry and reachability checked against `git ls-remote` truth, never a ledger claim alone). Anything without a complete chain — including any unmerged branch — is **reported, never touched**, and anything an active run or campaign ledger references is out of scope.

```
/aftermath [--afk] [--scorched-earth]
```

Bare invoke = categorized dry-run report → one confirm → execute the safe list. `--afk` skips the confirm and executes only the provably-safe class. It never auto-triggers — a deleting verb must never fire because a sentence pattern-matched. `--scorched-earth` widens the candidates to every local branch and worktree (interactively still report → one confirm).

> **⚠️ `/aftermath --afk --scorched-earth` is dangerously destructive.** The combo widens cleanup to all local branches and worktrees and force-deletes unmerged work with no human review. Only a non-negotiable protected core survives it.

### Tidy the memory (`/lessons-learned`)

**Why WAR carries its own memory.** A one-shot agent forgets everything the instant a run ends; WAR's premise is the opposite — *runs compound*. After each landed phase a write-scoped **servitor** distills what the run actually taught — a floor discovery set that has to mirror the gate, a line-number reference that rots across the merge queue, a plan-shape trap — into one-fact Markdown files under a **provenance ladder** (`agent-unverified` < `code-verified` < `user-confirmed`), which records *how* each fact was established and drives both recall ranking and eviction order. The servitor **verifies every referent against the live repo before writing**, so a lesson that names a function or flag is checked to still exist. The loop closes the other way at launch: the Lead runs a full-text query per worker and auditor seat and **prefetches the top lessons straight into their prompts**, so a past pitfall lands as context *before* the mistake repeats. That machinery — retrieval ranking, referent verification, provenance-ordered eviction, a byte-budgeted index — is why this is a purpose-built store and not a `NOTES.md`: it is what keeps *what run #5 learned* findable and trustworthy by run #50. (Design: [ADR 0007](docs/adr/0007-memory-provenance.md) provenance, [ADR 0015](docs/adr/0015-files-canonical-memory-with-derived-index.md) two-root.)

**Two roots, and when lessons commit.** Every lesson routes by its `metadata.type`. `user` / `feedback` / untyped lessons are *yours* — they stay in the **local root** (`~/.claude/projects/<project>/memory/`, untracked, never leaves your machine). A `project`-typed lesson — a durable fact about *this codebase* — can be committed to the **repo root** (`docs/learnings/`) so it travels with the repo and compounds across your whole team, not just your laptop. That publication is `memory.commitLearnings`, and it defaults to **`false`** — the store stays on your machine until you opt in via `/war-room`. Turn it on and a lesson about the code travels with the repo, human-reviewed like code, worth more shared than siloed — so the fiftieth run *anyone* does knows what the fifth one learned. Commit is guarded, not blind: a **fail-closed redaction lint** scrubs every candidate for home paths, emails, handles, and credential shapes, and anything it trips is **demoted to the local root and reported — never dropped, never silently published**. So once you opt in, the rule is *"share what's about the code, keep what's about you,"* erring toward local whenever it's unsure.

Over many runs the store still accretes fixed-bug warnings, drifted references, and bloated per-release logs. `/lessons-learned` does a **full housekeeping pass** over it:

```
/lessons-learned
```

It fans out agents to **verify every memory against the live repo**, classifies each as still-relevant vs. stale (`current` / `anchor-drift` / `resolved` / `superseded` / `dated-done` / `stale`), then **compresses, re-anchors, retires, and merges** the topic files and **regenerates** the `MEMORY.md` index (a derived projection — nobody hand-edits it) — telling you how full the index is against its budget and **reporting at every phase**.

It is **fault-tolerant to interruption** (a closed laptop mid-run). The live memory store is never mutated in place: the pass **backs up** to a tarball, does all work in a `.staging` copy, **verifies** index↔file integrity and link health, and only then performs a single **atomic swap** — with a `recover` path if it dies between steps. The deterministic backup / stage / verify / swap / recover logic lives in [`skills/lessons-learned/assets/safe-swap.sh`](skills/lessons-learned/assets/safe-swap.sh).

**Graduation candidates — when a lesson has earned an enforced guard.** The same pass now watches for lessons that keep *recurring*. As it reads each memory it tallies the re-trigger count from that lesson's recurrence annotations, and flags any lesson that has fired **≥ 2 times *and* encodes a machine-checkable invariant** — a greppable pattern, a diff property, an enum mirror, a string-presence rule — as a **graduation candidate**: a fact the pipeline keeps relearning that is now worth promoting from *advisory memory* into an *enforced guard*. The report lists each with its slug, recurrence count, and a one-line proposed enforcement shape (a hook, a merge floor, a drift-guard test, or a lint). It is strictly **flag-only** — the pass never writes the guard and never files an issue; it surfaces which repeatedly-relearned lessons are worth mechanizing and leaves the decision to you. A lesson that recurs but encodes a *judgment call*, with no mechanical invariant, is deliberately left off. (This closes the compounding loop one turn further: the memory system notices its own recurring failures and nominates them for hardening.)

Four more modes go beyond the routine pass above. `migrate` and `evict` are one-time moves that manage the two-root split itself; `tighten` and `seed` are both repeatable — `tighten` shrinks the projection, `seed` imports the portable corpus:

- **`/lessons-learned migrate`** — the **adoption** playbook for a store that predates the repo root. In place of the housekeeping pass it retypes the `untyped` bucket (agent-assisted), archives `[RESOLVED]` lessons, backfills retrieval keywords, and splits the operator-confirmed `project`-typed lessons out of your local root into `docs/learnings/`, opening a **reviewed PR** so a human approves exactly which lessons go public (the redaction lint runs fail-closed on that PR). Run it once when you decide to start sharing a repo's accumulated memory.
- **`/lessons-learned evict [slug…]`** — the **undo**. It returns repo-root lessons to the local root (temperature preserved — repo `archive/` lands in local `archive/`), re-renders the projection local-only, and opens a **reviewed deletion PR**. It also **asks whether to set `commitLearnings: false`** — skip that flip and the next landed phase simply republishes `docs/learnings/`, making the eviction temporary.
- **`/lessons-learned tighten`** — the **repeatable shrink** pass that manages the projection's size. The projection's two-column, per-cell-capped rendering already keeps any single row from blowing the budget, so `MEMORY.md` is never again one lesson-write from the hard render-refuse ceiling; `tighten` is what keeps the *whole* file under the softer 17,000 B advisory line as the corpus keeps growing — Phase 0 and the render `WARN` both point here once you cross it. It ranks eviction candidates by ascending usage (least-queried first) behind hard floors — never `user-confirmed`, never a ≥2-inbound concept hub, never a lesson under 8 days old — then presents the full candidate list as one **strike-list gate**: a single ask, slug · hits · tier · age · inbound · bytes, never a row-by-row negotiation. Approved local strikes go through the same staged swap as the housekeeping pass above; approved repo strikes land on a dedicated branch as a **reviewed PR**. If the approved set still leaves the file over target, it reports the shortfall loudly instead of re-asking.
- **`/lessons-learned seed`** — the **one-command warm-seed**: it unpacks the plugin-shipped portable corpus (`docs/seed/seed.tar.gz`) into your choice of `docs/learnings/` or the local memory root, skipping any slug already present and stamping each placed lesson `metadata.seededFrom`. The corpus itself is capped — **≤ 50 members and ≤ 1,500,000 B** uncompressed, with an archive tier (≤ 500 members / ≤ 100 MB) for operator-gated overflow — so it ships small enough to live inside the plugin cache. Anyone can grow it back without push access: the bare pass nominates portable lessons, re-packing in-WAR candidates directly behind one operator gate and opening a redaction-linted `seed-candidate` issue on the plugin's own repo for everything else, which a later WAR-repo pass sweeps and ingests.

Or invoke any of these in natural language — e.g. *"Do a lessons-learned pass on this repo's memory."*

## Note from Author

This is the workflow WAR exists for: **queue plans in the evening, sleep, review PRs over coffee.**

The first overnight run (2026/06/25-26) was a hand-written `/loop` over five plans. It orchestrated **272 subagents** across **28 phases**, consumed **14.1M tokens**, and I woke up to **5 ready-to-merge PRs** for this repo — the main context window stayed under 90% capacity (@1.0M) **without any compactions**. No CRITICAL/MAJOR problems were escalated to me while I slept; 8 follow-up issues were filed for the MINOR/NIT bugs that arose during implementation.

That hand-written loop is now one command:

```
/war-campaign docs/plans/<plan-1>.md docs/plans/<plan-2>.md ...
```

It hardens each plan (`/red-team`), executes it (`/war … --afk`), stacks each plan's PR on the previous plan's branch, and halts the whole line rather than let later plans build on a failure. If your plans are fleshed out enough, they get implemented overnight — and the multi-lens audit gate + your CI/CD are why you can trust what landed while nobody was watching. For the AI Vampires who don't sleep because they're coding all night: you don't have to anymore. It codes while you sleep; you just review.

> **Grill Me — the recommended front door for the plan interview.** `/war` is only as good as the plan it executes. WAR owns its interview doctrine in-repo — bare `/war-strategy` runs the plan-authoring interview itself, terminating only on one merged plan — and Matt Pocock's [`/grill-me`](https://github.com/mattpocock/skills/tree/main) & `/grill-with-docs` skills are the recommended voice on top: they interview you relentlessly down every branch of the design tree, resolving each decision one at a time, until the plan is unambiguous and cleanly phase-decomposable — exactly the shape WAR needs to fan out workers and auditors. When the family is installed, `/war-strategy` offers that route and binds it to the same merged deliverable.

### Pro Tip

Run this sequence of commands:

```
/survey-corps      # issues + memories → grouped design specs + survey manifest
/war-machine       # specs → implementation plans + roadmap (interviews you lightly)
/war-campaign docs/roadmaps/<date>-<slug>-roadmap.md
/aftermath         # evidence-gated cleanup of branches, worktrees, issues
```

Every step has an autonomous mode — `/war-machine --afk`, `/war-campaign` (unattended by default: it passes `--afk --ace` to each `/war` itself; there are no operator `--afk`/`--ace` flags on its own invocation), `/aftermath --afk` — so the sequence remains cron-able end to end (a nightly cron job or scheduled task). The clean-tree prerequisite is owned by `/war-machine --afk`'s closing commit: `/war` refuses a dirty tree, so the autonomous path cannot leave specs/plans/roadmap uncommitted.

## Roles → Gas Town lineage

| WAR | Gas Town | Built on |
|---|---|---|
| Lead (your chat) | Mayor | the main Claude Code session |
| Worker | Polecat | `war-worker` — `Agent` (sonnet) in a git worktree |
| Auditor | *none* — the "Nun" (a Refinery audit gate) was the author's own idea that never made it into Gas Town; WAR builds it first-class | `war-auditor` — read-only `Agent` (opus); file tools plus a fail-closed guard restricting Bash to read-only git |
| Refinery (merge queue) | Refinery | `war-refiner` — `Agent` + the serial Workflow merge loop |
| Servitor | `bd remember` | `war-servitor` — write-scoped `Agent` (sonnet); records per-phase learnings to memory |
| -- | Witness | *no standalone agent* — its live coordination is absorbed by the Workflow's control flow + hooks |

See [`skills/war/references/design.md`](skills/war/references/design.md) for the full architecture.

## Workflows, not Agent Teams

WAR runs on the generally-available `Workflow` + `Agent` tools — **not** Claude Code's experimental [Agent Teams](https://code.claude.com/docs/en/agent-teams) feature — because its coordination (phase loop, dependency waves, serial merge queue, severity gate) is knowable up front, so it belongs in a deterministic script rather than emergent agent negotiation.

| | **Workflow of subagents** (what WAR uses) | **Agent Teams** |
|---|---|---|
| Control flow lives in | your orchestration script (deterministic) | the agents' judgment (emergent) |
| Agents are | ephemeral: prompt in → result out | long-lived, named, addressable peers |
| Inter-agent comms | none — funnels through the orchestrator | direct `SendMessage` between teammates |
| Human steering mid-run | no (runs to completion) | yes (converse with a running teammate) |
| Task graph | fixed when you write the script | grows dynamically (shared task list) |
| Determinism / resume | high (same script+args → same shape; journal-resumable) | low (model-driven coordination) |
| Gating | GA, no flag | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

Rule of thumb: **scripted, reproducible coordination → Workflow; emergent or interactive coordination → Teams.** Full rationale: [design.md §2](skills/war/references/design.md#why-a-workflow-not-the-agent-teams-feature).

## Reply Standard hooks

The plugin ships a family of output-discipline hooks (`hooks/reply-standard/`). The core pair — `card.py`, `meter.py`, and `card.md` — was created by [@kem_glitch](https://www.instagram.com/kem_glitch) on Instagram ([original Claude artifact](https://claude.ai/code/artifact/7e14d97c-7d12-421e-ad68-1f1f4c22b954)) and those three files are included byte-for-byte per their instructions; the seat pair and the gate wrappers are WAR-authored:

- `card.py` (`UserPromptSubmit`) prints the Reply Standard card (`card.md`) beside each prompt you submit — the whole card, the Shape half, or one line, routed deterministically by the prompt's shape — and opens by naming the previous reply's violations when the meter recorded any.
- `meter.py` (`Stop`) scores each finished main-loop reply with SimpleEnglish's STE counters ([AminBlg/SimpleEnglish](https://github.com/AminBlg/SimpleEnglish), MIT) plus two house counts, appending one JSON row per turn to `meter.log` beside the script. It never blocks.

The card and meter above fire in the main conversation only — `UserPromptSubmit` does not fire for a subagent's spawn prompt, and a subagent's turn-end is `SubagentStop`, not `Stop`. WAR's phase seats get their own pair instead: a `SubagentStart` hook hands each spawning `work-audit-refine:war-*` agent the **seat edition** of the card (`subagent-card.md` — the Prose half plus an exactness-overrides-style clause; the main-loop Shape rules are dropped because they fight WAR contracts) via the documented `additionalContext` JSON output. Each seat also receives a role addendum when `subagent-card.war-<role>.md` exists — worker, auditor, refiner, and servitor ship one — and a `SubagentStop` hook scores the seat's final reply into `subagent-meter.log` with `agent_type` attribution, reusing `meter.py`'s counters byte-for-byte. Separate log, so the main-loop feedback prefix never quotes a seat row. The WAR **Lead** does run in the main conversation, so the gate also skips the card for any prompt whose first token is a WAR command (`/war`, the `/war-*` family, `/red-team`, `/survey-corps`, `/aftermath`, `/lessons-learned`) — orchestration turns are never style-pressured; the meter still scores them.

**Toggle:** on by default; a thin gate wrapper (`gate.py`) in front of the byte-for-byte scripts reads the WAR run config of the project the session runs in, so `{"hooks": {"replyStandard": false}}` in `.claude/war/config.json` turns the whole family off. The read is fail-open (no config, or an unreadable one, means on), and `/war-room` can write the key like any other override.

**Requires `python3` on `PATH`** — Python is used only by these plugin hooks (this family and the Vale hook below). Without it, a shell shim (`gate.sh`) makes both hooks silent no-ops instead of a hook error on every prompt and stop, mirroring how the memory features no-op on older Node.

**Log location (know before you rely on the loop):** the scripts write `card.log`/`meter.log` (and the seat meter `subagent-meter.log`) beside themselves — in the plugin install directory. Three consequences: the logs are shared across every project and concurrent session (the "previous reply broke the standard" prefix can be sourced from a different session), they grow unbounded and `card.py` re-reads `meter.log` whole on every prompt, and the path is version-scoped so each plugin update starts them fresh. Changing this needs an upstream log-dir override, not an edit here.

### Vale Markdown lint (`hooks/vale-md/`)

The same simplification aim, carried onto Markdown surfaces — and unlike the card/meter pair, this one reaches WAR's phase subagents: `PostToolUse` fires inside subagents, so a worker editing a plan, doc, or skill sees the same advisory line the operator would.

- `vale-md.py` (`PostToolUse` on `Edit`/`Write`, harness-filtered to `.md` paths by per-handler `if` rules so non-Markdown edits never spawn a process) runs [Vale](https://vale.sh) over the edited file when its path ends in `.md`, using a self-contained profile beside the script, chosen by `hooks.valeStyle` (default `workAuditRefine`); every style is vendored in the plugin, so no synced packages and no network at lint time. When Vale reports findings, the hook returns one `additionalContext` line naming the count and the top three rules. It never blocks, and the line itself cautions the agent never to reword ratified, byte-pinned, or drift-guarded literals to satisfy a style rule.
- The house rules are the Reply Standard card's, recast for docs: `SentenceLength` (over 25 words), `SlopWords`, `LatinAbbrev`, and `Dashes` (shipped but disabled in every profile that carries the house rules — em dashes are this repo's own house style).

**Toggle:** on by default; `{"hooks": {"valeMarkdown": false}}` in `.claude/war/config.json` turns it off, read fail-open by the script itself (`null` = unset, the default applies). **Requires the `vale` binary** (`brew install vale`) — without it, or without `python3`, the hook is a silent no-op.

**Styles (`hooks.valeStyle`):** nine profiles ship vendored — `workAuditRefine` (the default: this repo's own fork, the four house rules plus a tuned cut of the Google style — sixteen Google rules disabled: thirteen that judged entrenched repo voice in the prototype sweep, plus `Google.Spelling` since the card mandates British, `Google.Latin` as a house twin, and `Google.WordList`, a substitution list that fires on ratified vocabulary like "CLI"), `google` (raw upstream Google, untouched), `microsoftFork` (house rules plus a Microsoft Writing Style Guide cut tuned on the same rationale — including `Microsoft.Contractions`, which recommends the contractions the card bans), `house` (the four house rules alone), and `writeGood`, `proselint`, `alex`, `readability`, `redhat` (house rules plus that package, near-stock). Each vendored-standard profile header pins its upstream source, version, and license (`styles/<Name>/LICENSE`). A tenth value, `custom`, reads the project's own `.claude/war/vale/.vale.ini` (written by the `/war-room` interview) and fail-opens to `workAuditRefine` when absent. Unknown values also mean the default; subordinate to `valeMarkdown` — when that is `false`, nothing runs.

## Releasing

A version bump **must** update all four version slots across three files together (`marketplace.json` carries two) — Claude Code dispatches plugin updates by the `marketplace.json` version string, so a stale `marketplace.json` makes a release a silent no-op (release-drift / mirrored-value pattern):

| File | Field(s) to bump |
|---|---|
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `metadata.version` **and** `plugins[0].version` |
| `README.md` | the `## Status` line/paragraph |

### Status-blurb authoring checklist

Run this over the `## Status` paragraph before landing a release. Overclaims here are semantic —
no lint can judge them — and they are this repo's most frequent recurring release-prose defect,
so the checklist is the guard:

1. **Bound every absolute.** Before writing "every", "all", "never", or an "X is Y too" claim,
   confirm the enclosing scope word ("those `try` regions", "that lock", "the body") really does
   bound every instance the absolute covers. A quantifier inherits the region's boundary in the
   writer's head, not on the page — and the excluded cases are usually the ones that fire before
   the region is entered.
2. **Repeat the guard's own scope word.** When a guard's code comment already declares a narrower
   reach than your sentence — a token-literal match, a `case` arm's *pattern* rather than its
   body, one named field rather than every line — the blurb repeats that same scoping noun.
   Dropping it silently promotes a narrow true claim to a broad false one, even when the artifact
   you are paraphrasing got it right.
3. **Trigger surface, not topology.** Say what property of a *diff* makes a guard refuse, never
   the shape of the repo it happens to run in.
4. **Conditional side effects carry their condition.** A diagnostic behind its own runtime `if` is
   "prints X **when** Y" — never a bare "prints X" with the trigger left implicit.
5. **Scoped labels name their scope.** Reserve a bare "No behavior change:" for a release that
   ships literally none; otherwise name what the label actually covers ("No routing or enum
   change:"), or a skim-reader gets a headline that contradicts the paragraph's own first
   sentence.
6. **Appositives restate their subject.** A trailing "…, itself unchanged" binds by proximity to
   the nearest noun. Name the subject outright whenever the sentence lists both something this
   release changed and something it did not.
7. **Work scope is not release scope.** A claim about what *this plan's work* touched must not
   read as a claim about the *release window* — the two differ whenever unbumped landings rode
   along; a window that absorbed unbumped landings names them or scopes the sentence.
8. **Provenance.** Every item above is a distilled recurrence of
   `docs/learnings/release-blurb-overstates-guard-semantics.md` — read it when a blurb claim feels
   stronger than the evidence you have.

## Status

**0.21.8** — authoring doctrine and lint coherence (plan `2026-08-25-authoring-doctrine-and-lint-coherence`): the authoring-side verification machinery becomes internally coherent, so an author can actually trigger the twice-read rule and the guards cover the clauses they claim. Four mechanisms land.

- **‡ settles as a row marker (#1963, #1964, #1965)** — `plan-interview.md`'s ratified-pin ledger section defines `‡` once, normatively: an operator-applied mark, appended to the pin id or the landing-class cell at ratification, orthogonal to the landing class, whose consequence is the twice-read. Both twice-read clauses now key on that marker — the doctrine's own and `strategy-verifier.md`'s charter — and the retired `landing class is a duty` phrasing is gone from all three doctrine surfaces. `skills/war-strategy/SKILL.md`'s template law gains the mirror sentence, and the Example A and Example B design trees are rewritten to the floored shape: PIN ids, a Landing-class column, at least one ‡-marked row, and an Evidence-consumed block per example.
- **Four surgical lint fixes plus a ‡ inventory (#1966)** — in `plan-literal-lint.mjs`, a bare `slice` cell with no named task falls back to anywhere-citation instead of fanning out per task; a `WAIVE-1a` row is reported as malformed ("letter suffixes are illegal") instead of being silently admitted or silently invisible; a decoy bold guardrails or end-state mark before the intent section no longer redirects citation targets, and the no-intent path still yields null marks; and a ‡-marked cell — leading, trailing, and the `PIN-<n>‡→<class>` arrow-pair form — parses into its real class and is section-checked. A new report-only inventory emits exactly one advisory row per ‡-marked pin, and none on an unmarked tree. The lint stays exit-0 report-only, and `--strict` still exits 0 on a ‡-marked plan with no other hits. Every fix carries a red-at-base fixture in `plan-literal-lint.test.mjs`.
- **Structure suites reach the clauses they guard (#1967, #1968)** — `war-strategy-structure.test.sh` gains pins for the WAIVE right-delimited-id clause, the gate-1 scope clause, and the ‡ definition clause, the charter-side and `SKILL.md`-side ‡ new-present pins, and the OLD-absent twins for the retired phrase; the two doctrine-scoped positive controls report under their own helper name; and the tag-set atom's SKILL-side extraction is bounded at its call site, so it terminates at an indented sibling bullet inside the merged-plan fence, leaving `MEQ_BOUND` and every other atom's window byte-untouched. `/war-machine`'s drafter evidence clause gains its degraded arm — an absent section is a vacuous pass, an unreachable issue a named note that fails open under `--afk` — pinned in `war-pipeline-structure.test.sh`.
- **Red-team confinement, patch doctrine, and escape guard (#1969, #1970, #1971)** — the analyzed scope-lock string in `workflow-scaffold.js` carves out the Evidence-artifacts `gh` read that the lens probe it dispatches requires. `references/loop-budget.md`'s patch-style section carries the four-surface same-patch sweep and red-at-base re-execution rule, with the ADR-0042 trigger pointer on `skills/red-team/SKILL.md` Step 5, and doc-guards for both in `red-team-gate.test.mjs`. `assert-no-repo-escape.sh` now detects a new non-allowlisted gitignored **file** against the snapshot's recorded file-level ignored set, including one created inside a pre-existing ignored directory, while pre-existing ignored residue and a new path under the run-authored allowlist stay clean. The 0/1/2 exit contract is preserved, with infra (2) always outranking escape (1): a zero-byte baseline that coincides with a live escape-tripping fixture exits 2.

Release scope: beyond the three `war-strategy` doctrine surfaces and their structure suite, the plan-literal lint and its suite, the `war-machine` drafter clause and pipeline suite, the red-team scaffold, escape guard, doc surfaces and gate suite with their tests, this plan with its red-team report, the `docs(learnings)` commits, and the version slots, no engine, hook, `war-config.mjs`, or agent-card surface changed in this window.

Earlier release notes live in [CHANGELOG.md](CHANGELOG.md).

## License

MIT © Ljferrer
