# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Workflows](https://code.claude.com/docs/en/workflows)-based multi-agent orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary. Fresh workers implement, independent auditor panels review, a serial refinery gates every merge: the code that lands is **production-grade**, even when it lands while you sleep.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown), built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**. WAR keeps Gas Town's worker / auditor / refinery roles, **absorbs the witness's live coordination into the Workflow itself**, and adds a **servitor** that records each phase's learnings.

## Why WAR

Multi-agent parallelism is table stakes now. WAR's bet is different: **verification discipline you can reproduce.**

- **Audits are the product.** Every task's diff faces a roster of 1–5 independent, **read-only** auditor seats — each reviewing through a distinct lens (`correctness`, `cascading-impact`, `plan-faithfulness`, `security`, …), each judging the same pinned SHA. Findings are severity-tagged, Critical/Major block, and approval is **unanimous**; then a serial refinery rebases, re-runs your gate, and merges. Nothing lands on the say-so of the agent that wrote it. Paired with your CI/CD, this is what makes agent-written code **production-grade** instead of merely plausible.
- **Plans in, intent honored.** WAR executes plans, not vibes. The pipeline grills the ambiguity out *before* anything spawns — `/war-strategy` + Grill Me interview a spec into a plan, `/red-team` adversarially **proves** the plan's claims in throwaway sandboxes — and the plan's **Commander's Intent** (purpose, method, checkable end state) rides into every worker and auditor prompt: the plan slice is the floor, your intent is the ceiling.
- **Deterministic where it counts.** The coordination — phase loop, dependency waves, serial merge queue, severity gate — is knowable up front, so it lives in a deterministic, resumable Workflow script rather than emergent agent negotiation ([why](skills/war/references/design.md#why-a-workflow-not-the-agent-teams-feature)). Same plan, same shape; git is the resume authority ([ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md)).
- **Runs compound.** After each phase, a write-scoped servitor records durable learnings under a provenance ladder (`agent-unverified` < `code-verified` < `user-confirmed`), verifying each referent against the codebase before writing. The loop closes the other way too: at each phase launch the Lead **prefetches the most relevant prior lessons** and pushes them into the worker and auditor prompts, so past pitfalls arrive as context before the mistake repeats. `/lessons-learned` keeps the store honest against the live repo over time. By default the store stays local to your machine; turn on `commitLearnings` (via `/war-room`) to commit distilled, lint-scrubbed lessons under `docs/learnings/` so they travel with the repo and compound across your team. Your fiftieth run knows what your fifth one learned. *(Retrieval and publication use a zero-dependency Node ≥ 24 CLI — `node:sqlite`'s in-memory FTS index; on older Node the memory features simply no-op and the run proceeds unaffected.)*
- **Nothing but the plugin.** Stock, generally-available Claude Code primitives — `Workflow`, `Agent`, git worktrees, `gh`. No server, no daemon, no framework, no experimental flags. Every Claude Code release makes WAR stronger, not obsolete.
- **Built for overnight.** Queue plans with `/war-campaign` in the evening; the audit gate + your CI hold the line unattended; wake up to stacked, ready-to-review PRs.

## What it does

Given a plan like [docs/plans/2026-06-18-war-room.md](https://github.com/Ljferrer/WorkAuditRefine/blob/master/docs/plans/2026-06-18-war-room.md), `/war` will:

1. **Decompose** the plan into one or more phase(s) → task DAG and propose it to you as GitHub issues — all phase **epics up front**, task **sub-issues just-in-time** per phase. *You approve before anything spawns.*
2. For each phase, run a **Workflow** that:
   - **Works** — fresh worker agents implement each task in isolated git worktrees, writing the plan's mapped tests.
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA). Each task convenes its own **roster** of 1–5 distinct-lens seats, each at its own depth; the default roster is the trio (`correctness`, `cascading-impact`, `plan-faithfulness`) at `deep`.
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

### Recommended Auxiliary Plugins

These plugins improve the quality of code generated by the WAR agentic workflow:

1. **Required** [Grill Me](https://github.com/mattpocock/skills/tree/main#quickstart-30-second-setup)
2. [Everything Claude Code](https://github.com/affaan-m/ecc#step-1-install-the-plugin-recommended)
3. [Superpowers](https://github.com/obra/superpowers#installation)
4. [Andrej Karpathy Skills](https://github.com/multica-ai/andrej-karpathy-skills#install)
5. [Ponytail](https://github.com/DietrichGebert/ponytail#install)

## Usage

The command set, in the order you'll run it: **`/war-help`** orients you → **`/war-room`** configures a run → **`/war-strategy`** structures the spec and the plan (and converts spec → plan) → **`/red-team`** hardens the plan → **`/war`** executes it → **`/war-review`** tallies what the run cost and flags any friction. Scaling up: **`/survey-corps`** turns open issues and hot memories into specs → **`/war-machine`** turns specs into plans + a roadmap → **`/war-campaign`** runs the plans back-to-back unattended → **`/aftermath`** cleans up the debris → **`/lessons-learned`** keeps the accumulated memory honest.

### Get oriented (`/war-help`)

New to WAR, or just want a refresher? Run the orientation card:

```
/war-help
```

It prints a one-screen map — what WAR is, the command set, the five roles, how a run flows, and the
prerequisites — then offers deep-dive links and a handoff to `/war-strategy`. Design notes:
[`docs/specs/2026-07-01-war-companion-skills-design.md`](docs/specs/2026-07-01-war-companion-skills-design.md#5-war-help--the-orientation-card).

### Configure a run (`/war-room`)

By default WAR runs opus workers on `max` effort and opus auditors on `xhigh`, and under `rosterPolicy: auto` the Lead composes each task's audit roster from the lens catalog — 1–5 seats, each at its own depth with a one-line rationale — at the approval gate (a triggered lone seat later widens toward the auditor's own nomination, or the default roster if it names none). To change that — pick models per role, put a worker on **ultrathink**, shape the roster (seats, lenses, per-seat depth) or its seeding policy — run the companion skill first:

```
/war-room
```

Or invoke it in natural language — e.g. *"To the war room!"*.

It interviews you (starting from a **balanced / thorough / economy** preset, then only the overrides you ask for), validates your choices, and writes `.claude/war/config.json`. `/war` auto-discovers that file on its next run (or pass `--config <path>`). **No config file → today's defaults, unchanged.** Design notes: [`docs/specs/2026-06-18-war-room-design.md`](docs/specs/2026-06-18-war-room-design.md).

**What "today's defaults" actually are.** With no config file WAR runs the built-in `DEFAULTS`: opus workers on `max` effort, opus auditors on `xhigh`, `rosterPolicy: auto` (the Lead composes each task's roster), the pre-merge ace-fix on, and a 3-round fix budget. For **memory** the defaults are `retrieval: true` with `topK: 10` (prefetch the ten most relevant lessons into each seat's prompt) and **`commitLearnings: false`** — distilled `project`-typed lessons stay local to your machine unless you opt in via `/war-room` (see [Tidy the memory](#tidy-the-memory-lessons-learned) for the publication pitch). The three presets move the whole profile at once: **`balanced`** *is* the defaults, **`thorough`** widens rosters and deepens effort (and pumps tokens), and **`economy`** pins the cheaper knobs it always had — sonnet across every role, a solo roster, a 2-round budget, and ace off. `/war-room` only ever asks about the overrides you want *on top of* the chosen preset.

**For best results** I recommend using:

```
/war-room thorough preset
```

> NOTE: This configuration absolutely pumps tokens.

### Author a plan (`/war-strategy`)

**Spec ≠ plan — the *what* vs. the *how*.** A **design spec** (`docs/specs/`) is the ratified decision record for a change — problem, pivotal constraints, numbered decisions with alternatives considered, affected surfaces, test intent. It answers *what changes and why*, and carries no dispatch structure — `/war` cannot execute one. An **implementation plan** (`docs/plans/`) is the executable artifact `/war` consumes — phases and tasks with exact file sets, `requiresTest`, `deps`, and target repo. It answers *how*: who does what, in which order, against which files. Every plan opens with a **Commander's Intent** — **Purpose** (why), **Method** (how you envision winning), **End state** (numbered, individually *checkable* conditions) — drafted from your answers, confirmed by you explicitly, and threaded into every worker and auditor prompt: the plan slice is the floor, your intent is the ceiling. Full glossary: [`CONTEXT.md`](CONTEXT.md).

**Structure a spec or plan.** Bare invoke loads the authoring primer — the WAR-shaped spec/plan/roadmap templates plus the code-boundary decomposition rule in one sentence: file-disjoint tasks in a phase, a dependency crossing a phase edge, one task per repo, release as its own trailing phase — then routes you to your installed grilling skill to actually interview you (its dependency check points you at the **Grill Me** install under [Recommended Auxiliary Plugins](#recommended-auxiliary-plugins) when that skill isn't installed):

```
/war-strategy
```

**Convert a spec into a plan.** Bring it an existing draft — a design spec, rough plan, roadmap, or design doc — and it reviews the artifact for war-shape gaps, interviews you gap-by-gap, and applies the structural fixes. Given a spec, it authors the war-shaped implementation plan into `docs/plans/` itself (drafting the plan's Commander's Intent from your answers and echoing it back for explicit confirmation):

```
/war-strategy docs/specs/design.md
```

**Pipeline doctrine:** war-strategy **converts**; `/red-team` **validates** plans and never converts (see
[`CONTEXT.md`](CONTEXT.md)). Design notes:
[`docs/specs/2026-07-01-war-companion-skills-design.md`](docs/specs/2026-07-01-war-companion-skills-design.md#6-war-strategy--the-authoring-primer).

### Harden a plan (`/red-team`)

Before you hand a plan to `/war`, attack it. `/red-team <plan-file>` reads the plan, runs a universal spine of adversarial checks plus probes tailored to the plan, and **proves** the plan's claims by running its tests/edits/commands in throwaway sandboxes — never touching your repo. It then grills you on every blocker and patches the plan in place until it is **CLEARED**, leaving a report under `docs/red-team/`.

`/red-team` **validates plans; it never converts a spec into one** (war-strategy **converts**, red-team **ratifies** — see [`CONTEXT.md`](CONTEXT.md)). Have a design spec instead of a plan? Bring it to [`/war-strategy`](#author-a-plan-war-strategy) first, then red team the resulting plan.

Or invoke it in natural language — e.g. *"Red team my plan at docs/..."*. Design notes: [`docs/specs/2026-06-18-red-team-design.md`](docs/specs/2026-06-18-red-team-design.md).

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
| `--ace` | no | on via config `run.ace` (economy preset: off) | Fix auditor-flagged Minor/Nit findings on the spot: an approved task's `absorb`-routed findings get one pre-merge ace commit + a full panel re-audit at the new SHA, instead of being filed as `war-followup` issues. Never blocks a land — on any regression the ace commit is reverted and the originally-approved work lands anyway. (`/war-campaign` passes `--afk --ace` by default.) |
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

`--erwin` pauses after clustering so you approve the proposed groups before synthesis. Bare invoke is fully autonomous end to end, so the step stays cron-able.

### Turn specs into plans (`/war-machine`)

The middle step of the pipeline: `/war-machine` consumes the freshest survey manifest (or the spec paths you pass), runs a drafter + adversarial-grill agent pair per spec strictly serially, writes the implementation plans to `docs/plans/` and a campaign roadmap to `docs/roadmaps/`, and prints the `/war-campaign` handoff — it **never launches the campaign and never red-teams**. It relies on `/war-strategy`'s templates and conversion doctrine rather than forking them.

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
the campaign re-anchors where it left off. Design notes:
[`docs/specs/2026-07-01-war-companion-skills-design.md`](docs/specs/2026-07-01-war-companion-skills-design.md#7-war-campaign--the-hopper).

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
- **`/lessons-learned tighten`** — the **repeatable shrink** pass that manages the projection's size. The projection's two-column, per-cell-capped rendering already keeps any single row from blowing the budget, so `MEMORY.md` is never again one lesson-write from the hard render-refuse ceiling; `tighten` is what keeps the *whole* file under the softer 17,000 B advisory line as the corpus keeps growing — Phase 0 and the render `WARN` both point here once you cross it. It ranks eviction candidates by ascending usage (least-queried first) behind hard floors — never `user-confirmed`, never a ≥2-inbound concept hub, never a lesson under 14 days old — then presents the full candidate list as one **strike-list gate**: a single ask, slug · hits · tier · age · inbound · bytes, never a row-by-row negotiation. Approved local strikes go through the same staged swap as the housekeeping pass above; approved repo strikes land on a dedicated branch as a **reviewed PR**. If the approved set still leaves the file over target, it reports the shortfall loudly instead of re-asking.
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

> **Grill Me — author the input plan with [`/grill-me`](https://github.com/mattpocock/skills/tree/main).** `/war` is only as good as the plan it executes. Matt Pocock's `/grill-me` & `/grill-with-docs` skills interview you relentlessly down every branch of the design tree, resolving each decision one at a time, until the plan is unambiguous and cleanly phase-decomposable — exactly the shape WAR needs to fan out workers and auditors. `/war-strategy`'s dependency check links here when Grill Me isn't installed.

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

## Releasing

A version bump **must** update all four version slots across three files together (`marketplace.json` carries two) — Claude Code dispatches plugin updates by the `marketplace.json` version string, so a stale `marketplace.json` makes a release a silent no-op (release-drift / mirrored-value pattern):

| File | Field(s) to bump |
|---|---|
| `.claude-plugin/plugin.json` | `version` |
| `.claude-plugin/marketplace.json` | `metadata.version` **and** `plugins[0].version` |
| `README.md` | the `## Status` line/paragraph |

## Status

**0.14.57** — `/lessons-learned seed`: a portable, versioned lesson corpus WAR ships as a plugin asset, plus a contribution flow that grows it without PR access. `docs/seed/seed.tar.gz` + `seed-manifest.json` carry the 29 scrubbed war-game lessons as the initial corpus (each redaction-lint-clean, zero `[[wikilinks]]`), packed by the tested `seed-pack.mjs` asset script; the manifest mirrors the tarball member-for-member — member set, uncompressed bytes, and sha256 — under an equality test. Dual caps are test-enforced: the seed set holds ≤ 50 members and ≤ 1,500,000 B uncompressed, the archive ≤ 500 members and ≤ 100 MB, with operator-gated overflow eviction to `docs/seed/archive/` (archive overflow refuses loudly). The new `seed` mode unpacks the plugin-shipped tarball, asks the operator for a destination (`docs/learnings/` vs the local memory root), skips slug collisions, stamps each placed lesson `metadata.seededFrom`, lints fail-closed before any repo-root write, and re-renders `MEMORY.md`. The bare `/lessons-learned` pass now nominates portable candidates — inside WorkAuditRefine as gated seed-set additions, from any foreign repo as gated, slug-deduped, redaction-lint-withheld `seed-candidate` issues on `Ljferrer/WorkAuditRefine` carrying the full lesson body — and the WAR-repo pass sweeps those open issues for gated ingestion, re-packing and closing each accepted issue citing the commit. `README.md`, the `war-help` orientation card, and `CONTEXT.md` document the seed mode and contribution flow, and a new ADR records the decision. `version-slots.test.mjs` keeps all four version slots in lock-step.

## License

MIT © Ljferrer
