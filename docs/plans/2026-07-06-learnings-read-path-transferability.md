# Learnings read-path & transferability — repo-root on every memory read, cloner bootstrap, systemic CLAUDE.md pointer

## Commander's Intent

- **Purpose:** Repo-published learnings must actually reach every consumer — WAR agents mid-run, housekeeping passes, and the plain Claude Code sessions of any fresh cloner — instead of being written to a repo root that nothing reads back.
- **Method:** Wire the repo root into every memory *read* path with explicit `--repo` flags (env exports do not survive the harness's per-call shells); seed a cloner's local projection idempotently at both entry points (WAR Setup and `/lessons-learned` Phase 0); make the CLAUDE.md pointer systemic so non-WAR coders inherit the lessons ambiently; change **no** write paths — publication stays behind the existing lint + PR-review gates, and the servitor's scope is untouched.
- **End state:**
  1. With `commitLearnings` resolved true: Gate 2 `render-index`, the phase-launch prefetch queries, and the worker self-query line (the `workflow-template.js` emission **and** the `agents/war-worker.md` mirror) all pass `--repo` with the resolved repo root.
  2. A `/lessons-learned` housekeeping pass on a repo-adopted store preserves `[repo]` rows, with a check that fails if the render loses repo-root awareness.
  3. With `docs/learnings/` present and a local projection lacking `[repo]` rows, WAR Setup **and** `/lessons-learned` Phase 0 each seed the projection idempotently.
  4. The migrate playbook's Step 5 and Gate 2's first publication ensure an append-if-absent CLAUDE.md pointer in the target repo (riding the same reviewed PR); WorkAuditRefine gains its own CLAUDE.md pointing at `docs/learnings/`.
  5. All four version slots read the next free patch (baseline **0.14.4** off master @ 0.14.3; re-baseline at land time if master moves — the operator target and worktree baseline are authoritative, never this literal).
  6. Test floor green; each changed prose clause is covered by a gate check that fails if the clause is removed.

## Build order (for /war)

1. Phase 1 — read-path wiring + onboarding (4 file-disjoint tasks, one wave)
2. Phase 2 — release (trailing)

Base: latest `master` (PR #512 merged; `docs/learnings/` does not exist yet in this repo — every read-path change must fail open on an absent repo root, which `walkCorpus` already guarantees by skipping non-existent roots).

## Phase 1 — read-path wiring + onboarding

### Task 1: worker self-query line gains the repo root
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-worker.md`
- Plan slice: the emitted worker self-query line (`WORKER_MEMORY_SELF_QUERY_LINE`) currently shows `war-memory.mjs query '<terms>'`, which walks only the local root. Extend the emission so the example invocation includes `--repo <resolved repo root>` when the run's memory args carry a repo root (the template already receives `learningsTarget`); when no repo root is threaded, the line stays byte-identical to today (empty-memory ⇒ byte-identical prompts is an existing criterion — preserve it). Mirror the same `--repo` form in the standing `agents/war-worker.md` self-query sentence (standing-instruction and dispatched-prompt surfaces drift independently — update both in this task).
- Mapped tests: `workflow-template.test.mjs` — (a) worker prompt contains `--repo` + the resolved root when memory args include it; (b) prompt is byte-identical to the no-memory baseline when absent. Delete-the-feature check: dropping the interpolation must fail (a).
- requiresTest: true
- deps: []
- target repo: superproject

### Task 2: Lead read paths in `skills/war/SKILL.md` — Setup seed, prefetch `--repo`, Gate 2 `--repo` + pointer duty
- Files: `skills/war/SKILL.md`
- Plan slice, three clauses in the one file:
  1. **Setup (step 4, after two-root resolution):** when the resolved repo root exists on disk and the local `MEMORY.md` is missing or lacks `[repo]`-marked rows, run `war-memory.mjs render-index --local <local> --repo <resolved repo root>` once (idempotent seed — a fresh cloner's first `/war` sees repo lessons before phase 1 dispatches). Skipped when memory was disabled at the Node probe.
  2. **Prefetch:** the batched `query --queries <file>` invocation gains `--repo <resolved repo root>` (only when the repo root resolved; retrieval keeps failing open).
  3. **Gate 2:** the post-servitor `render-index` gains `--repo <resolved repo root>`; and when `commitLearnings` is on, the repo root has content, and the target repo's `CLAUDE.md` lacks the pointer line — append the one-line pointer (create `CLAUDE.md` if absent, never rewrite existing content) and include it in the same `docs(learnings): phase N` commit so it rides the reviewed phase PR.
  All three clauses use the **resolved** repo root (which honors `overrides.learningsTarget`), never a hardcoded `docs/learnings`.
- Mapped tests: extend the existing prose-gate suite that greps `skills/war/SKILL.md` (worker: self-discover which suite guards this file rather than assuming a name or count): assert `--repo` appears in the prefetch clause and the Gate 2 render clause, and the append-if-absent pointer duty exists. Each grep must fail if its clause is removed.
- requiresTest: true
- deps: []
- target repo: superproject

### Task 3: `/lessons-learned` repo-awareness — Phase 0 bootstrap, repo-aware renders, playbook pointer
- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/references/migration.md`
- Plan slice:
  1. **Phase 0 (inventory):** detect the repo root (`docs/learnings/` in the audited repo, or the configured override); report its file count alongside the local inventory. When it is non-empty and the local projection lacks `[repo]` rows, run the same idempotent seed render as WAR Setup and say so in the Phase 0 report.
  2. **Repo-aware renders:** every `render-index` the skill runs (Phase 5 projection; the migrate/evict modes already pass it) gains `--repo <repo root>` when the repo root exists — otherwise a housekeeping pass on a repo-adopted store silently drops every `[repo]` row from the regenerated projection. Add this exact failure mode to **Common mistakes**. (`safe-swap.sh verify` is already `[repo]`-row-aware — no change there.)
  3. **Playbook pointer:** migration.md Step 5 gains a sub-step — ensure the target repo's `CLAUDE.md` carries the one-line `docs/learnings/` pointer (append-if-absent, same reviewed PR). The Evict section gets one sentence: the pointer is left in place by default (harmless when the dir empties); removing it is a call to make in the eviction PR.
- Mapped tests: prose-gate greps as in Task 2 (self-discover the guarding suite): `--repo` present in the Phase 5 render clause; the Common-mistakes bullet exists; Step 5 pointer sub-step exists.
- requiresTest: true
- deps: []
- target repo: superproject

### Task 4: WorkAuditRefine's own `CLAUDE.md`
- Files: `CLAUDE.md` (new)
- Plan slice: minimal, a few lines — durable engineering lessons live in `docs/learnings/` (one-fact-per-file markdown, provenance-tagged frontmatter); consult them before modifying the subsystems they name; ranked retrieval via `node skills/_shared/war-memory.mjs query '<terms>' --repo docs/learnings` (Node ≥ 24; plain Read/Grep works without it). Keep it short — this file loads into every session's context for every cloner. Do not restate README content.
- Mapped tests: none enforceable (new standalone doc; nothing imports it).
- requiresTest: false
- deps: []
- target repo: superproject

## Phase 2 — release

### Task 5: release bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots to the next free patch (baseline 0.14.4 — re-verify against the landed integration tip at execution time; the plan literal is not authoritative). README `## Status` is replace-in-place, never emptied; blurb states precisely what landed: memory reads pass the resolved repo root (`--repo`), WAR Setup and `/lessons-learned` seed a fresh clone's projection, and learnings publication ensures a `CLAUDE.md` pointer in the target repo. Do not overstate (no "guarantees"; the seed is conditional on `docs/learnings/` existing).
- Mapped tests: none (version slots; the known absent cross-slot consistency test is a standing gap and out of scope here).
- requiresTest: false
- deps: []
- target repo: superproject

## Notes / conscious deviations

- **Fail-open is load-bearing:** `walkCorpus` skips non-existent roots, so passing `--repo` when `docs/learnings/` is absent is harmless by design — verified in `skills/_shared/war-memory.mjs` (§4.3 comment). No conditional plumbing beyond "did the root resolve".
- **Env-var mechanism rejected:** `export CLAUDE_MEMORY_REPO` at Setup does not survive across the Lead's Bash invocations (harness shells don't persist state); explicit `--repo` per invocation is the reliable in-run mechanism. `CLAUDE_MEMORY_REPO` remains a documented option for interactive sessions only.
- **CLAUDE.md append is a tracked-file write to the target repo** — deliberately confined to append-if-absent and always riding the reviewed `docs(learnings)` commit/PR; never rewrites or reorders existing operator content.
- **Dated specs stay dated:** the 2026-07-03 memory-substrate spec/plan are historical records; this plan supersedes their silence on the read path. Optional follow-up (not a task): a short ADR "the resolved repo root rides every memory read" if `/red-team` thinks the decision needs a durable record.
- Same-file discipline: all `skills/war/SKILL.md` edits live in Task 2; all `/lessons-learned` surfaces in Task 3; no two Phase-1 tasks share a file.

## Open decisions (resolved by /red-team)

1. Exact one-line wording of the CLAUDE.md pointer (Tasks 2/3/4 must emit the **same** line — pick it once during ratification).
2. Should the Setup seed also run when `memory.retrieval` is false but the repo root exists? Recommendation: yes — the projection serves non-WAR sessions too; the seed is a render, not a retrieval.
