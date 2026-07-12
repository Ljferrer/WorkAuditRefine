# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

📚 **Durable engineering lessons live in `docs/learnings/`** — one fact per Markdown file, provenance-tagged frontmatter. Before changing a subsystem, read the lessons that name it (plain Read/Grep, or ranked retrieval via the `work-audit-refine` plugin's `war-memory` query).

In this repo the plugin ships at `skills/_shared/`, so that ranked query is `node skills/_shared/war-memory.mjs query '<terms>' --repo docs/learnings` (needs Node >= 24; plain Read/Grep works without it).

## What this repo is

WAR (Work · Audit · Refine) — a Claude Code **plugin**; this repo *is* the plugin (`.claude-plugin/plugin.json` + `skills/` + `agents/` + `hooks/`). It orchestrates multi-phase plan execution with worker / auditor / refinery / servitor agents over git worktrees and GitHub issues. There is no application build: developing here means editing skill prose (`skills/*/SKILL.md`), the per-phase Workflow engine (`skills/war/assets/workflow-template.js`), shell hooks/floors, the memory CLI, and their tests. `CONTEXT.md` is the glossary (ubiquitous language); `docs/adr/` (0001–0022) records the binding decisions.

## Commands

Node ≥ 24 required (`node:sqlite`/FTS5). No package.json, no Makefile, no top-level runner.

```bash
# All JS tests (quoted glob REQUIRED — a directory arg fails on Node 24)
node --test 'skills/**/*.test.mjs'

# One JS test / one shell test (shell tests are bash-3.2-safe and cwd-independent)
node --test skills/war/assets/war-config.test.mjs
bash hooks/validate-worktree-scope.test.sh

# All shell tests — anchor to hooks/ and skills/; a repo-root find picks up
# ~100 stale duplicates under .claude/worktrees/
for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done

# Redaction lint (exactly what CI runs — the only thing CI runs)
node skills/_shared/war-memory.mjs lint docs/learnings/

# Memory queries / index render — ALWAYS pass --local; the cwd fallback
# silently creates a stray ./memory dir in the repo
node skills/_shared/war-memory.mjs query '<terms>' --repo docs/learnings
node skills/_shared/war-memory.mjs render-index --local "$CLAUDE_MEMORY_LOCAL" --repo docs/learnings
```

Local plugin iteration: `claude --plugin-dir /path/to/WorkAuditRefine`, then `/reload-plugins` after each edit (local paths resolve to version `unknown`, so reloads always pick up changes).

**Releasing:** a version bump must update all four slots together or the release is a silent no-op — `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no badge). `skills/war/assets/version-slots.test.mjs` locks the four slots in lock-step (fail-closed — a partial bump is a red test, and it also guards the README Releasing prose against the "three files" undersell). Version literals inside plans/roadmaps are non-authoritative — resolve the next free patch from the slots at land time.

## The pipeline is gospel: spec → plan → red-team → war

**A spec is not a plan.** A **design spec** (`docs/specs/YYYY-MM-DD-<slug>-design.md`) is the ratified *decision record* — problem, pivotal constraints, resolved design tree, mechanics, surface changes, validation criteria. It answers *what changes and why* and carries **no dispatch structure**; `/war` cannot execute one. An **implementation plan** (`docs/plans/YYYY-MM-DD-<slug>.md`, same slug, no `-design` suffix) is the *executable artifact*: `## Commander's Intent` (Purpose / Method / numbered individually-checkable End state — plan slice is the floor, intent is the ceiling), `## Build order`, per-task `Files:` / `Plan slice:` / `requiresTest` / `requiresPackaging` / `deps` / `target repo`, and a required `## Deferred validations (backstops)` section (explicit `None` allowed).

Roles are strict: **`/grill-with-docs` authors the spec** (interview-driven, from the required Grill Me auxiliary plugin — `/war-strategy` never authors a spec from scratch, its bare invoke loads the templates and routes to the grilling skill); **`/war-strategy` converts** (spec → plan; reviews drafts for war-shape gaps); **`/red-team` validates and never converts** (proves plan claims in throwaway sandboxes; report at `docs/red-team/YYYY-MM-DD-<plan-slug>.md`; patches the plan in place until CLEARED); **`/war` executes**. Outer loop: `/survey-corps` (issues → specs + `.claude/aot/` manifest) → `/war-machine` (specs → plans + roadmap; never launches, never red-teams) → `/war-campaign` (stack-and-plow stacked PRs, ADR 0011) → `/aftermath` (evidence-gated cleanup). `/war-campaign` and `/aftermath` are never auto-invoked (`disable-model-invocation: true`). Templates live inline in `skills/war-strategy/SKILL.md` §2, locked by its structure test.

**Code-boundary decomposition** (how plans are carved): (1) parallel tasks in a phase must be file-disjoint — same-file tasks rebase-conflict at the serial merge; (2) dependency ⇒ `deps` wave edge in the same phase (worker's first act is a rebase onto the integration tip), phase edges only for what must be *landed* first; (3) one task = one repo (submodule content + gitlink bump = two tasks, two phases); (4) release/version bump is its own trailing phase. Never use deps/waves to dodge a same-file collision.

## Execution architecture (what a /war phase actually does)

Every task worktree is cut from one **frozen phase base** (the integration tip at the Provision barrier) — waves order *when* workers run, never *what base they see*. Per phase: Provision (refiner-owned worktrees, `run.provision` steps; failure = `env-blocked`, worker never spawned) → Work+Audit per wave (fresh workers implement; a 1–5 seat, distinct-lens, read-only auditor roster judges the pinned SHA; Critical/Major block; approval is **unanimous** on one `audit_sha`; bounded fix rounds share `run.roundLimit`=3) → Refine (serial merge queue: rebase in the task worktree, floors, gate, merge) → post-merge gate-audit (`execution-evidence` lens) → Land (push-first CAS in the run-scoped `_refinery` worktree — the push *is* the CAS; never force-push; `land_stale` ≠ `conflict`) → phase-close coherence sweep (fail-open polish of `absorb` findings) → servitor records learnings → machine-readable `handoff` block.

Enum discipline: task status `merged` is terminal; `landed` is phase-level only. `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` are canonical in `skills/war/assets/land-decision.mjs` and **hand-mirrored** inside `workflow-template.js` (the Workflow sandbox cannot import) — change both copies and the drift-guard test together. Never add `held:workflow-error` to `HARD_ESCALATION_REASONS` (ADR 0005). Floor scripts exit 0/1/2: 1 = the named route (`no-test`, `unpackaged`), 2 = git error and must never collapse into the floor status.

Resume: **git branch state > issue labels > `ledger.json`** (ADR 0008). Repair records toward git, never git toward records; an unexplained commit halts. Dead phases resume, never re-run.

Prompt surfaces are split: standing instructions in `agents/*.md`, dispatched prompts string-built in `workflow-template.js` — a change to auditor/refiner behavior must update **both in the same commit** (they drift silently otherwise).

## Guard architecture (hooks/)

Confinement is by `agent_type`, capability-first (ADR 0002): **auditor** — no writes at all; Bash fail-closed to an allowlisted read-only git verb set (`validate-auditor-git.sh`; `fetch` deliberately excluded; one `-C <path>` peeled without widening verbs); **worker** — writes only under a `.war-task`-marked worktree ancestor (sibling-worktree writes are an accepted residual), Bash writes only advisorily warned; **servitor** — no Bash at all (the primary confinement), Write/Edit only into the local memory root (repo-root publication is a Lead Gate-2 promotion), and mutation of any pre-existing untagged memory file is denied, and every new fact Write must carry a valid `metadata.provenance` (`validate-servitor-provenance.sh`); **refiner/main** — the scope hook fail-opens: refinery isolation is *prompt-enforced*, backstopped by `refinery-surface.test.sh`. A `..` path segment is denied for everyone. Merge-path floors (`assert-test-in-diff.sh`, `assert-packaging-in-diff.sh`, `assert-no-submodule-mutation.sh`) run refiner-side pre-merge; their discovery patterns must mirror `resolveGate` in `war-config.mjs`.

## The memory system (two-root, files-canonical)

One durable lesson = one Markdown file: `name`/`description` + nested `metadata:` (`type`, `provenance`, `keywords`). Two roots (ADR 0015): the **local root** (`~/.claude/projects/<project-slug>/memory/`, untracked, personal) and the **repo root** (`docs/learnings/`, committable, human-reviewed). Routing is `metadata.type`: `project` → repo root iff `memory.commitLearnings` (default false — opt in via `/war-room`) *and* the fail-closed redaction lint passes (home paths, emails, handles, credential shapes → demoted to local, reported, never dropped); `user`/`feedback`/untyped → local, always.

- **Provenance ladder** (ADR 0007): `user-confirmed` > `code-verified` > `agent-unverified` — records *how established*, drives recall ranking and archive-eviction order. The servitor verifies referents on write (found → `code-verified`; absent → `agent-unverified` + absence note).
- **`MEMORY.md` is a generated projection** — written only by `war-memory render-index` into the local root, atomically; never hand-edit it, never commit it. Budgets: hard 200 lines / 24,400 bytes (render refuses), advisory 17,000 bytes. Projection size is driven by frontmatter `description` lines, not lesson bodies.
- **Temperature is location**: hot = root, cold = `archive/` — archived lessons stay queryable forever; archiving is a move + note, **never a deletion**. Archive by explicit slug, never `archive --candidates` (it archives *all* budget candidates).
- **Retrieval**: FTS5 index built in-memory per invocation (nothing on disk to commit or corrupt); `metadata.keywords` weigh ~8× body — a lesson without keywords is under-retrievable. `keywords` must be nested under `metadata:` (a top-level `keywords:` is silently not indexed).
- **In a run**: the Lead prefetches top-K lessons per seat into worker/auditor/servitor prompts at phase launch (fails open); the servitor writes new lessons post-land; with `commitLearnings` opted in (off by default), the Lead lints and commits `docs(learnings): phase N`. `/lessons-learned` is the housekeeping pass (staging copy + atomic swap via `safe-swap.sh`); its `migrate`/`evict` modes adopt/undo the repo root.
- The pointer line at the top of this file is **ratified and byte-identical across surfaces** — never reword it.

## Known traps

- `docs/learnings/` on a branch/PR not yet merged ⇒ `render-index --local`-only silently drops every `[repo]` row — pass `--repo` whenever the dir exists.
- Plans and specs share a slug but different suffixes; `/red-team` greps the plan's source-spec line — keep it.
- Findings route by auditor-owned `disposition` (`absorb`/`follow-up`/`note`), orthogonal to severity; `absorb` is never a default. A validation in neither the gate, a floor, nor the backstops section may not be waived in prose — escalate (ADR 0017).
- Intent is never Lead-invented; the sole synthetic-intent exception is `/war-machine --afk`'s `## AI-Commander's Intent` heading, and any heading-extraction surface must recognize **both** intent headings (ADR 0014).
- Anchor references by named construct, not line number — line numbers rot across the serial merge queue.
