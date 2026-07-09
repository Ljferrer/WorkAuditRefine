# Drift-guard discipline — implementation plan

**Source spec:** `docs/specs/2026-07-08-drift-guards-for-mirrored-and-asserted-facts-design.md`
**Slug:** `drift-guards-for-mirrored-and-asserted-facts` (shares the spec's slug, drops `-design`).
**Repo version at authoring:** 0.14.14 — version literals below are non-authoritative; resolve the next free patch from the four release slots at land time.

## Commander's Intent

**Purpose.** Every fact WAR duplicates across surfaces or asserts in prose about a canonical code construct carries a mechanical guard binding it to its canonical source — extraction + equality, never presence — so surface drift turns the gate red instead of waiting for a manual doc sweep.

**Method.** One new fail-closed `version-slots.test.mjs` locks the four release slots in lock-step. Generalize the fragmented existing guards into two explicit registries in `workflow-template.test.mjs`: a **mirror registry** (canonical export ↔ inline sandbox mirror, one equality row each — `HARD_ESCALATION_REASONS`, the `landDecision` set, the four roster helpers) and a **both-surfaces directive registry** (standing `agents/*.md` ↔ dispatched prompts, **including the inline gate-audit seats** outside `auditPrompt()`). Replace the presence-only pointer check with byte-identity across the three pointer surfaces; export a `(preset, role, model, effort)` matrix from `war-config.mjs` with a completeness test; bind SKILL.md `shell out to <module> <verb>` referents to real dispatch cases; bind the `held:*` classifier example lists to their routing predicates; rewrite tour step 17 to invariant-style prose (no snapshot counts, no line numbers). Facts that resist cheap mechanization become explicit auditor-lens duties (ADR policy-table under-attribution, comment-lag — **prompt-directive only, no advisory script**, operator-ratified) and pipeline rules (two `/war-strategy` plan-authoring rules; two `/red-team` spine probes). The registries are the deliberate ceiling — no AST scanner (`// ponytail:` it). ADR 0025 ratifies the doctrine.

**End state** (each individually checkable):
1. `skills/war/assets/version-slots.test.mjs` passes with all four slots aligned; manually bumping `plugin.json#version` alone makes it fail under `node --test 'skills/**/*.test.mjs'`; a `## Status` paragraph naming a different version also fails. Root resolved from `import.meta.url`, never `process.cwd()`. (spec criterion 1)
2. Editing the inline `HARD_ESCALATION_REASONS`, the inline `landDecision` value set, or any mirrored roster helper in `workflow-template.js` to diverge from its canonical export makes the mirror-registry test fail; the registry lists at least those six rows. (spec criterion 3)
3. Removing a registered correctness-critical directive from either `agents/war-auditor.md` or its dispatched prompt — **including the inline gate-audit seat prompts** — makes the both-surfaces registry test fail; the ADR-policy-table obligation appears on both surfaces. (spec criterion 4)
4. Changing the pointer line's wording in `skills/war/SKILL.md` (or `skills/lessons-learned/references/migration.md`) but not `CLAUDE.md` makes the byte-identity test fail — a mutation today's presence-only check passes. (spec criterion 5)
5. Adding a `PRESETS` entry or a new role without the enumerated matrix covering it makes the matrix-completeness test fail; the matrix covers every current preset (`thorough`, `economy`, `balanced`) × every role (`worker`/`auditor`/`refiner`/`servitor`). (spec criterion 7)
6. A SKILL.md line phrasing `aggregateBackstops` (or any export lacking a dispatch case) as `shell out to campaign-ledger.mjs <verb>` makes the doc/CLI consistency test fail; every real shell-out referent resolves to a dispatch case. (spec criterion 8)
7. Listing infra-death under `held:workflow-error` in `skills/war/SKILL.md` makes the classifier-binding test fail; the shipped doc (already aligned) passes. (spec criterion 9, rescoped: test-only)
8. `.tours/architect-war-system.tour` step 17 carries **no numeric snapshot count and no line-number reference**; it describes the mirror invariant and names the registry guard that holds it; a grep in the doc-contracts test asserts the count/line-ref forms are absent. (spec criterion 10, retargeted to the live rot)
9. `skills/war-strategy/SKILL.md` carries the two plan-authoring rules (new-mirror ⇒ registry row same task; default-flip ⇒ enumerate surfaces + assert OLD absent) and `war-strategy-structure.test.sh` stays green. (spec criterion 6, authoring half)
10. The `/red-team` spine carries the two probes (unguarded new mirror; default-flip gate asserting only NEW-present). (spec criterion 6, validation half)
11. The comment-lag directive (grep touched files for the old behavior's concrete terms before commit) appears in both the dispatched worker prompt in `workflow-template.js` and `agents/war-worker.md`. (spec decision 9, prompt-directive-only per operator)
12. `node --test 'skills/**/*.test.mjs'`, every `hooks/` + `skills/` `*.test.sh`, and `war-memory.mjs lint docs/learnings/` pass with all new/extended guards present. (spec criterion 11)
13. `docs/adr/0025-drift-guard-discipline.md` exists, states the discipline, names the registry ceiling; `CONTEXT.md` carries the five new terms. (spec criterion 12; ADR number rescoped from the spec's stale 0023)
14. The four release slots move together to the resolved next patch.

## Build order (for /war)

### Phase 1 — Guards, registries, doctrine

Eight file-disjoint tasks, no intra-phase deps — run in parallel.

**Task 1.1 — Version-slot lock-step test (D1 + the surviving half of D7)**
- Files: `skills/war/assets/version-slots.test.mjs` (new)
- Plan slice: Framework-free `node:test`. Resolve repo root from `import.meta.url` (subagent cwd is the main repo; cwd resets between bash calls — never `process.cwd()`). Read `.claude-plugin/plugin.json` → `version`; `.claude-plugin/marketplace.json` → `metadata.version` and `plugins[0].version`; `README.md` → the paragraph under `## Status` (regex-extract the leading version token by construct). Assert all three JSON strings `===` each other and the Status token equals them. Fail-closed. **Rescope note (operator-ratified):** spec decision #7's phantom-badge prose fix is dropped — the token "badge" and the imagined release-template surface do not exist anywhere in `skills/` (verified at conversion); only this lock-step test survives from D7. Do not invent a template to fix.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject (this repo)

**Task 1.2 — Preset matrix + pointer byte-identity (D4, D6)**
- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: **(D6)** Export a helper from `war-config.mjs` enumerating the full `(preset, role, model, effort)` matrix — `DEFAULTS.agents` deep-merged with every `PRESETS[name].agents` partial (reuse `presetConfig()`'s merge, don't re-implement). Add a `war-config.test.mjs` completeness test: the matrix covers every `PRESETS` key × every role, so a new preset/role cannot introduce an unwatched literal. **(D4)** In the same test file, replace the presence-only pointer posture with a cross-surface byte-identity test: extract the ratified pointer-line substring from `CLAUDE.md`, `skills/war/SKILL.md`, and `skills/lessons-learned/references/migration.md` (locate by construct — the "Durable engineering lessons live" anchor) and assert byte-equality across all three. Scope extraction to those canonical surfaces only — never changelog/release-blurb prose (the recorded quoting trap: a blurb quoting old wording must not trip the guard). The existing Gate-2 pointer-duty test (#534) is orthogonal and stays.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.3 — Doc/CLI shell-out consistency test (D11)**
- Files: `skills/_shared/doc-cli-consistency.test.mjs` (new)
- Plan slice: Framework-free test, repo root from `import.meta.url`. Grep all `skills/*/SKILL.md` for `shell out to <module>.mjs <verb>` referents and backtick CLI-verb forms (`node <path>/<module>.mjs <verb>`). For each named module (`campaign-ledger.mjs` — dispatch `init/add/sweep/next/record`; `war-memory.mjs`; `war-config.mjs`; `safe-swap.sh`), extract its real dispatch cases by construct (the `case '<verb>':` arms / the shell dispatch) and assert every prose verb resolves to a case. `aggregateBackstops` — an export with **no** CLI case, which the campaign SKILL.md already labels "a module export, not a CLI subcommand" — must never appear phrased as a shell-out; the test locks that sentence's truth. Delete-and-trace: injecting a fake verb into a fixture prose string makes the check fail.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.4 — Skill-doc contracts test + tour rewrite (D10 test-only, D12 retargeted)**
- Files: `skills/war/assets/skill-doc-contracts.test.mjs` (new), `.tours/architect-war-system.tour`
- Plan slice: **(D10 — rescope note, operator-ratified:** the SKILL.md example lists are ALREADY aligned to the routing predicates — the tree says "Class examples (aligned with the routing predicate)" and infra-death routes `held:phase-incomplete`; build only the regression-binding test, no prose fix.**)** The test extracts the `held:*` routing predicates from `skills/war/SKILL.md` (the Checkpoint classification ladder — locate by the `status !== "completed"` / known-set constructs, not line numbers) as source of truth and asserts each class's inline example list maps to its predicate: infra-death (timeout/killed/non-completed) under `held:phase-incomplete`, never `held:workflow-error`. **(D12 — retargeted, operator-ratified:** the spec's target phrase "differ by exactly one entry" is already gone; the LIVE rot is step 17's "lists **8** reasons — the same 8" snapshot count and its "`workflow-template.js` (≈841)" line-number reference.**)** Rewrite tour step 17 (the step whose `file` is `land-decision.mjs`) to mechanism-style narrative: the constants are hand-mirrored because the sandbox can't import, and *the mirror-registry drift-guard in `workflow-template.test.mjs` holds them identical* — no member counts, no line numbers, no "≈" refs. The same test greps step 17's description asserting no `\d+ reasons`/`same \d+`/`≈\d+` forms. Tour edit and its asserting test land in this one task (the test would be red without the edit).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.5 — The two registries + both-surfaces duties (D2, D3, D8, D9, D12-auditor-half)**
- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`, `agents/war-auditor.md`, `agents/war-worker.md`
- Plan slice: All mirror pairs, one task (standing-vs-dispatched coverage split). **(D2 — mirror registry)** In `workflow-template.test.mjs`, generalize the scattered membership checks into a registry array of `{ canonical, extractInline }` rows, one equality assertion per row: `HARD_ESCALATION_REASONS` (deepEqual, regex-extracted inline array vs the `land-decision.mjs` export), the `landDecision` known set vs `KNOWN_LAND_DECISIONS`, and the four mirrored roster helpers (`spawnOpts`/`validateRoster`/`widenRoster`/`resolveWidenSource` — the "Mirror of war-config.mjs …" comment block). Const rows assert deepEqual on parsed literals; helper rows assert **behavioral equivalence on an enumerated fixture-input set** (run canonical and inline on the same inputs, deepEqual the outputs — function mirrors can't byte-compare safely). `// ponytail:` the registry is the deliberate ceiling; no AST scanner. Existing overlapping checks (e.g. "inline includes land_stale") are absorbed, not duplicated. Keep `land-decision.test.mjs`'s own guards untouched (different file, plan-1/-2 contention). **(D3 — both-surfaces registry)** Generalize the existing T1 both-surfaces pattern into a registry of correctness-critical directives, each row naming its standing surface and its dispatched surface(s) — token-anchored, case-tolerant (`-i`, mid-sentence anchors), never full-line bytes — **including rows asserted against the inline gate-audit seat prompt strings** (`execution-evidence`, end-state) extracted from template `src`, which sit outside `auditPrompt()`. Seed rows: the existing T1 servitor mutation-guard/recurrence-flow directives (migrated into registry form), the D8 obligation, the D9 directive, the D12 narrative duty (below). **(D8)** Add the ADR-policy-table obligation to the doc-honesty lens in `agents/war-auditor.md` AND the dispatched doc-honesty prompt: when a task changes a mechanism attribution, check the ADR chosen-option/policy-table row for that mechanism (grep misses under-attribution — this is a lens duty, not a grep). **(D9 — prompt-directive only, operator-ratified; no advisory script)** Add to the dispatched worker prompt AND `agents/war-worker.md`: before commit, grep your touched files for the old behavior's concrete terms (retired values, old approach names, stale counts) and update lagging comments/JSDoc; the auditor's cascading-impact lens keeps the standing duty. **(D12 auditor half)** Add the mechanism-style-narrative duty to the doc-honesty lens (both surfaces): narrative docs assert invariants and the guard that holds them, never snapshot counts. Registry tests and their clause edits land together in this task — the registry is red without the clauses.
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.6 — /war-strategy plan-authoring rules (D4.9a/b)**
- Files: `skills/war-strategy/SKILL.md`, `skills/war-strategy/war-strategy-structure.test.sh`
- Plan slice: Add the two rules to the conversion guidance (§3/§4, near the code-boundary decomposition rule): (a) a task that lands a new inline mirror of a canonical export MUST land its mirror-registry row in the same task — an unguarded mirror is a plan defect; (b) a default-flip/scope-narrow task MUST enumerate every doc surface carrying the old value and its gate MUST assert the OLD value **absent** across them (NEW-present alone is the recorded failure). Update `war-strategy-structure.test.sh` in the same diff so the locked template/structure assertions stay green (the structure test is the guard for this very file — extend it to pin the two new rules by token anchor).
- requiresTest: true
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.7 — /red-team spine probes (D4.9)**
- Files: `skills/red-team/SKILL.md`, `skills/red-team/references/lenses.md`
- Plan slice: Add two universal-spine probes (locate the spine section by construct in SKILL.md; mirror the lens wording in `references/lenses.md` where the lens catalog lives): (1) "does every new inline mirror introduced by this plan carry a matching mirror-registry row?" — prove by grepping the plan's file list for `workflow-template.js` edits adding consts vs registry rows; (2) "does every default-flip gate assert OLD-absent across the enumerated surfaces, not just NEW-present?" — prove in sandbox by leaving one stale surface and checking the gate goes red. Both patched into the plan until CLEARED, per red-team doctrine (validate, never convert).
- requiresTest: false (prose surfaces; no designated test file — see backstops)
- requiresPackaging: false
- deps: none
- target repo: superproject

**Task 1.8 — Doctrine docs: ADR 0025 + CONTEXT.md terms**
- Files: `docs/adr/0025-drift-guard-discipline.md` (new), `CONTEXT.md`
- Plan slice: Author the ADR per spec §7 (retitled to **0025** — the spec's "0023" predates plans 1–2 claiming 0023/0024; re-resolve against `docs/adr/` at land time): presence-only and well-formedness-only checks let mirrored constants, both-surface directives, byte-identical doc text, version slots, and prose code-claims rot silently; decision: extraction + equality against the canonical source, registries as the deliberate ceiling, auditor-lens duties where mechanization is not cheap; consequences: mirror + registry row = one task (the /war-strategy rule + red-team probe), four version slots gain lock-step. No change to ADR 0005/0006/0013/0017 — a drift-guard is a gate member (ADR 0017-preferred mechanical enforcement). Add the five CONTEXT.md terms verbatim from spec §6: **Drift-guard**, **Canonical source vs mirror site**, **Mirror registry**, **Both-surfaces directive registry**, **Mechanism-style narrative**.
- requiresTest: false (docs only)
- requiresPackaging: false
- deps: none
- target repo: superproject

### Phase 2 — Release bump (trailing)

Phase edge on Phase 1.

**Task 2.1 — Version bump across the four slots**
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Resolve the next free patch from the four slots at land time (authoring baseline 0.14.14 — non-authoritative; this campaign's earlier plans will have advanced it). Update in lockstep: `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place, no badge). Note: **Task 1.1's new lock-step test is live by this phase** — a partial bump now fails the gate mechanically, which is this plan proving its own thesis. Keep the Status blurb plain (never quote a retired token — the recorded absence-guard trap).
- requiresTest: false (metadata only)
- requiresPackaging: false
- deps: none (single task)
- target repo: superproject

## Deferred validations (backstops)

- **Registry-row absence for future mirrors** — a NEW mirror added without a registry row is not mechanically detectable (the registry can't know what it doesn't list) · why deferred: auto-detection is the rejected AST scanner (spec §9) · runner: the Task 1.6 `/war-strategy` rule at every conversion + the Task 1.7 red-team probe at every red-team, from this plan onward.
- **Default-flip OLD-absent rule (D5)** — per-change by nature, no standing test possible · why deferred: the "old value" only exists at flip time · runner: `/war-strategy` plan shape + red-team spine probe (Tasks 1.6/1.7).
- **Comment-lag directive is prompt-enforced (D9)** · why deferred: operator ratified prompt-directive-only — no script can enumerate per-change retired terms · runner: the auditor's cascading-impact lens each run; first live `/war` run exercises the worker directive.
- **Preset matrix ≠ prose correctness (D6 residual)** — the matrix guarantees every preset/role is *watched*, not that prose consulted it · why deferred: prose reading is a judgment act · runner: the doc-honesty auditor consuming the matrix each run.

## Notes / conscious deviations

- **Three operator-ratified rescopes against the spec's letter (2026-07-08 conversion volley):** (a) D7's phantom-badge prose fix **dropped** — no such token or template surface exists in the tree; (b) D10's example-list fix **already landed** — test-only; (c) D12 **retargeted** — the spec's quoted phrase is gone, the live rot is step 17's "8 reasons — the same 8" count and "≈841" line ref. All twelve spec *decisions* stand; only three tasks' factual premises were corrected (recorded pattern: plan-rescope-note-supersedes-stale-spec-surgery-list).
- **D9 is prompt-directive-only** (operator-ratified): a warn-but-always-pass `.test.sh` is a poor gate citizen — the gate is pass/fail, floors are 0/1/2, and an always-green script is unread noise.
- **ADR number is 0025**, not the spec's 0023 — plans 1 and 2 of this campaign claim 0023/0024. Routine, re-resolved at land time.
- **Cross-plan contention (for the roadmap table):** shares `workflow-template.js`, `workflow-template.test.mjs` with plans 1–2; `agents/war-auditor.md` with plan 2; `CONTEXT.md`, `docs/adr/`, and the three release-slot files with both. `skills/war/SKILL.md` is deliberately **not edited** by this plan (rescope (b) made D10 test-only), avoiding plan-1 contention there. `land-decision.mjs` is **read** as canonical, never edited (plan 2 owns its header comment). Roadmap serializes; this plan rebases onto both.
- **Both-surfaces registry seed rows self-decided** (drafter latitude): existing T1 servitor rows migrated + the three new duties (D8, D9, D12). Later plans add rows per the Task 1.6 rule — the registry grows by row, never by scanner.
- **Helper-mirror rows use behavioral equivalence on fixture inputs**, not byte comparison — function mirrors legitimately differ in whitespace/comments; what must not drift is behavior. Const rows stay `deepEqual` on parsed literals.
- **`skills/_shared/` placement for the doc/CLI test**: it spans multiple skills' SKILL.md files and multiple modules' dispatch tables — repo-scope concern, `_shared` home, still inside the `skills/**/*.test.mjs` gate glob.
- **`requiresPackaging: false` on every task** — this repo ships no Dockerfile; the packaging floor is vacuous here.

## Open decisions

None — resolved interactively at conversion (operator volley, 2026-07-08): intent approved as-is; rescopes (a)/(b)/(c) accepted; D9 prompt-directive-only.
