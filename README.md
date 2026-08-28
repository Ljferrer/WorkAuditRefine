# WorkAuditRefine

**WAR — Work · Audit · Refine.** A Claude-native [Workflows](https://code.claude.com/docs/en/workflows)-based multi-agent orchestration skill that executes a detailed, multi-phase implementation plan end-to-end — and stops to check in with you at every phase boundary. Fresh workers implement, independent auditor panels review, a serial refinery gates every merge: the code that lands is **production-grade**, even when it lands while you sleep.

It's a portable, dependency-free re-imagining of [Steve Yegge's Gas Town](https://github.com/gastownhall/gastown), built on Claude Code's own primitives — `Agent`, the `Workflow` tool, git worktrees, and GitHub issues — with **no Go binary, no Dolt, no beads**. WAR keeps Gas Town's worker / auditor / refinery roles, **absorbs the witness's live coordination into the Workflow itself**, and adds a **servitor** that records each phase's learnings.

## Why WAR

Multi-agent parallelism is table stakes now. WAR's bet is different: **verification discipline you can reproduce.**

- **Audits are the product.** Every task's diff faces a roster of 1–5 independent, **read-only** auditor seats — each reviewing through a distinct lens (`correctness`, `cascading-impact`, `plan-faithfulness`, `simplicity`, `performance`, …), each judging the same pinned SHA. Findings are severity-tagged, Critical/Major block, and approval is **unanimous**; then a serial refinery rebases, re-runs your gate, and merges. Nothing lands on the say-so of the agent that wrote it. Paired with your CI/CD, this is what makes agent-written code **production-grade** instead of merely plausible.
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
   - **Audits** — independent, read-only auditor seats review each task (severity-tagged findings; Critical/Major block; unanimous on one SHA). Each task convenes its own **roster** of 1–5 distinct-lens seats, each at its own depth; the default roster is five seats (`correctness`, `cascading-impact`, `plan-faithfulness`, `simplicity`, `performance`) at `deep`.
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

The command set, in the order you'll run it: **`/war-help`** orients you → **`/war-room`** configures a run → **`/war-strategy`** interviews you to a merged plan (and converts existing drafts) → **`/red-team`** hardens the plan → **`/war`** executes it → **`/war-review`** tallies what the run cost and flags any friction. Scaling up: **`/survey-corps`** turns open issues and hot memories into specs → **`/war-machine`** turns specs into merged plans + a roadmap → **`/war-campaign`** runs the plans back-to-back unattended → **`/aftermath`** cleans up the debris → **`/lessons-learned`** keeps the accumulated memory honest.

### Get oriented (`/war-help`)

New to WAR, or just want a refresher? Run the orientation card:

```
/war-help
```

It prints a one-screen map — what WAR is, the command set, the five roles, how a run flows, and the
prerequisites — then offers deep-dive links and a handoff to `/war-strategy`. Doctrine:
[`skills/war-help/SKILL.md`](skills/war-help/SKILL.md).

### Configure a run (`/war-room`)

By default WAR runs opus workers at session effort and sonnet auditors on `max`, and under `rosterPolicy: auto` the Lead composes each task's audit roster from the lens catalog — 1–5 seats, each at its own depth with a one-line rationale — at the approval gate (a triggered lone seat later widens toward the auditor's own nomination, or the default roster if it names none). To change that — pick models per role, put a worker on **ultrathink**, shape the roster (seats, lenses, per-seat depth) or its seeding policy — run the companion skill first:

```
/war-room
```

Or invoke it in natural language — e.g. *"To the war room!"*.

It interviews you (starting from a **balanced / thorough / economy** preset, then only the overrides you ask for), validates your choices, and writes `.claude/war/config.json`. `/war` auto-discovers that file on its next run (or pass `--config <path>`). **No config file → today's defaults, unchanged.** Doctrine: [`skills/war-room/SKILL.md`](skills/war-room/SKILL.md); the config schema's single tested source of truth is [`skills/war/assets/war-config.mjs`](skills/war/assets/war-config.mjs).

**What "today's defaults" actually are.** With no config file WAR runs the built-in `DEFAULTS`: opus workers at session (`default`) effort, sonnet auditors on `max`, a sonnet refiner on `high` and a sonnet servitor on `xhigh`, a fable fix-worker on `low`, `rosterPolicy: auto` (the Lead composes each task's roster) over a 5-seat default roster, the pre-merge ace-fix on, and a 6-round fix budget. For **memory** the defaults are `retrieval: true` with `topK: 10` (prefetch the ten most relevant lessons into each seat's prompt) and **`commitLearnings: false`** — distilled `project`-typed lessons stay local to your machine unless you opt in via `/war-room` (see [Tidy the memory](#tidy-the-memory-lessons-learned) for the publication pitch). The three presets move the whole profile at once: **`balanced`** *is* the defaults, **`thorough`** widens rosters and deepens effort (and pumps tokens), and **`economy`** pins the cheaper knobs it always had — sonnet across every role, a solo roster over its own pinned four-lens pool, a 2-round budget, and ace off. `/war-room` only ever asks about the overrides you want *on top of* the chosen preset.

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
| Worker | Polecat | `war-worker` — `Agent` (opus) in a git worktree |
| Auditor | *none* — the "Nun" (a Refinery audit gate) was the author's own idea that never made it into Gas Town; WAR builds it first-class | `war-auditor` — read-only `Agent` (sonnet); file tools plus a fail-closed guard restricting Bash to read-only git |
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

**0.20.1** — engine reliability and filing fidelity (plan `2026-08-25-engine-reliability-and-filing-fidelity`): WAR runs can now pace their agent fan-out on rate-limited accounts (`run.maxParallel`), a prompt-budget ceiling can only be raised by a merge diff carrying an operator-citable Budget-Raise trailer, and a ladder of the engine's known silent failure modes — vacuous phase endstates, mangled endstate-check artifacts, lossy follow-up consolidation, dispatch deaths, the gate-outruns-the-land-timeout race — now fails loud or carries full fidelity instead of quietly degrading. Compatibility scope: with `run.maxParallel` absent the fan-out path is byte-identical to before (default-path census row); no land-path enum widened (the `KNOWN_LAND_DECISIONS` doc-parity rows and the MERGE_RESULT status pin stay green); the auditor guard's allowlist, exit codes, and routing are byte-unchanged (only the chain-operator deny message's rule-class naming moved); and floor scripts keep the 0/1/2 exit contract with 2 never collapsing into the floor status. Deferred to the plan's named backstops: wall-clock pacing under a live rate-limited run (the unit tests prove batching/ordering semantics, not window spend), the endstate transport under a live land barrier, and the older-`gh` degradation branch on a real pre-`--reason` binary. Release scope: the 0.20.0 → 0.20.1 window is this campaign's own stack — its docs-only ride-alongs are the campaign's plan, red-team report, per-phase `docs(learnings)` commits, and one operator-ratified plan amendment; no code change rode along unbumped.

- **Throttle + budget floor (#1722, #1723, #1727, #1728, #1730)** — `war-config.mjs` accepts `run.maxParallel` as an integer ≥ 1 (default absent, anything else refused); when set, the wave, audit-roster, dropped-seat-retry, and gate-audit fan-outs each dispatch through the `batched` helper — at most N task thunks concurrent, group k+1 starting only after group k settles. A merge diff raising any `hard:`/`advisory:` ceiling constant in `prompt-surface-budgets.test.mjs` without a Budget-Raise trailer routes `budget-uncited` (exit 1; a trailerless ratchet-down passes; git error exits 2), and the floor directive is asserted on both the refiner card and the dispatched merge-task prompt.
- **Entry belt + endstate transport (#1746, #1747, #1819, #1779)** — a launch omitting any fallback-free pt args field exits 1 naming the field before any dispatch (`assert-args-complete.mjs`), and `campaign-ledger record` refuses a bare `--status`/`--branch`/`--sha`/`--stopPoint` before any `record()` call; a plan `check:` literal carrying a dollar-brace run, an embedded backtick, or two mandatory commands is reproduced byte-verbatim into the executed `.cmd` artifact with every command run and full stdout teed — or the artifact fails loudly.
- **Filing fidelity (#1784, #1785)** — when two distinct findings collapse, the merged-away row's title and rationale reach the filing prompt, issue body, handoff `followUps`, and log, with seat+task attribution in `seats[]` (the `'unattributed'` terminal arm preserved); an auditor-supplied string `seats` renders without throwing; a gate-audit-family `ask` parks on `asks[]` with a validated real `audit_sha`; a `:rebut`-suffixed seat label extracts the true lens; and `auditEvidenceOf` returns a real landed sha for a merged `requiresTest:false` task.
- **Land, phase-close, aceBisect (#1794, #1795, #1808, #1809)** — a gate outrunning the land dispatch's tool timeout yields the in-band segmented-land marker with a bounded re-dispatch, never a dispatch death; a `held:land-failed` phase still produces the follow-up filing dispatch (or the explicit unfiled-followups handoff block); a zero-task phase never attests its land-barrier endstate green; a dead phase-close polish dispatch stamps every demoted finding with its drain cause, and `provisionStep`'s provision-run, the polish-worktree provision, and the sweep dispatches classify env-died soft (a provision-barrier death deliberately stays `held:workflow-error` — tag only, no local catch); on a sanctioned recovery relaunch, worktree-name-shaped `preMerged` ids skip the merged set and the provision barrier auto-frees a clean same-plan prior-generation worktree holder (a dirty holder still dies loud with its path named); the aceBisect preflight mandates exact-value trailer equality and culprit attribution survives `./`-prefix/path-form drift.
- **Peripheral floors (#1820, #1821, #1822, #1818)** — an auditor command denied for a chain operator is named by the chain-operator rule class rather than the glob rule (decision and exit code byte-unchanged); `--close-epic` still closes the epic when `gh issue close --reason` is unsupported — degraded, loud; a die-guard message ending in a `$var` interpolation is covered via a distinguishing-prefix stderr assertion; and `provision-worktrees.sh` fixes its four reuse-hygiene gaps and names the holding worktree path when a worktree add fails over a held branch.

Earlier release notes live in [CHANGELOG.md](CHANGELOG.md).

## License

MIT © Ljferrer
