# Drift-guard discipline: every duplicated or asserted fact carries a test binding it to its canonical source

Addresses (memory lessons): version-slots-no-cross-slot-consistency-test, run-provision-config-not-yet-mirrored-into-template, standing-instruction-vs-dispatched-prompt-coverage-split, gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity, default-flip-must-audit-all-doc-surfaces, doc-truth-sweep-must-check-presets-not-just-defaults, release-bump-slots-canonical-no-badge, adr-policy-table-entry-vs-mechanism-attribution, source-comment-lags-emitted-prompt-after-rewrite, held-workflow-error-infra-death-prose-mismatch, uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand, tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it

> Design spec — a ratified decision record. It carries **no** dispatch structure (no phases, tasks, waves, `deps`); `/war` cannot execute it. `/war-strategy` converts it to an implementation plan.
>
> Source-spec slug: `drift-guards-for-mirrored-and-asserted-facts` · Current version at authoring: **0.14.14**.

## 1. Context — the gap / problem

WAR is riddled with facts stated in one surface that live canonically in another, and that silently rot against ground truth because **nothing binds the copy to its source**. The failure is uniform: a green gate, a green audit, and a green `node --test` run all pass identically whether the two surfaces agree or have drifted, because every existing check is either *presence-only* ("this surface contains the anchor phrase") or *well-formedness-only* ("this JSON parses"). Drift is invisible until a manual doc sweep re-diffs the referents by hand — the exact labor this repo keeps paying.

The twelve recorded frictions are one class seen through twelve lenses:

- **Inlined constants with no import path.** The Workflow sandbox cannot `import`, so `HARD_ESCALATION_REASONS` and `KNOWN_LAND_DECISIONS` are hand-mirrored from `skills/war/assets/land-decision.mjs` into `skills/war/assets/workflow-template.js`; `war-config.mjs` helpers (`spawnOpts`/`validateRoster`/`widenRoster`) are mirrored the same way. Where a `deepEqual` drift-guard exists it holds (M2 Test 3 in `workflow-template.test.mjs`); where a mirror lands *without* its guard in the same task, drift re-opens — the recorded root cause of [run-provision-config-not-yet-mirrored-into-template]. Convention ("mirror + guard are one unit of work") is doctrine, not enforcement.
- **Two behavior surfaces per agent.** Correctness-critical directives live in `agents/*.md` (standing) **and** in prompts string-built in `workflow-template.js` (dispatched); a change to one never propagates to the other, and gate-audit seats build prompts inline, bypassing `auditPrompt()` coverage entirely — [standing-instruction-vs-dispatched-prompt-coverage-split], [gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage].
- **Presence-not-identity doc contracts.** When a plan mandates byte-identical text across N surfaces (the CLAUDE.md pointer line, a CLI example, a version string), per-task tests assert each surface merely *contains* an anchor phrase — catching removal, never divergence between copies — [gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity].
- **Default-flip and preset doc rot.** A default/scope flip updates the authoritative config table but a gate that asserts only the NEW value passes while field prose, schema examples, and consuming SKILL.md copies keep the OLD value — [default-flip-must-audit-all-doc-surfaces]. Doc-truth sweeps re-verify `DEFAULTS.agents` prose but miss `PRESETS[name].agents` literals, which drift on an independent schedule — [doc-truth-sweep-must-check-presets-not-just-defaults].
- **Four version slots bumped by convention.** `plugin.json#version`, `marketplace.json#metadata.version`, `marketplace.json#plugins[0].version`, and `README.md ## Status` move together only by hand; the gate's JSON well-formedness check is version-agnostic, so a partial bump is a silent internally-inconsistent release reported green — [version-slots-no-cross-slot-consistency-test]. The reused release-plan template compounds it by emitting a phantom "bump the README badge" step (there is no badge), a "populate an EMPTY Status" framing false on every release after the first, and a "three files" sentence that undersells the four slots — [release-bump-slots-canonical-no-badge].
- **Prose asserting code facts with no guard.** ADR policy-table rows lag when mechanism attribution is restructured, because grep patterns tuned to catch over-strong CLAIMS structurally miss UNDER-attribution — [adr-policy-table-entry-vs-mechanism-attribution]. Comments/JSDoc naming a rewritten function's old behavior survive green (tests assert output, never comments) — [source-comment-lags-emitted-prompt-after-rewrite]. A `held:*` classifier's inline example list contradicted its own routing predicate (infra-death listed as terminal `held:workflow-error` while the predicate routes it retryable `held:phase-incomplete`) — [held-workflow-error-infra-death-prose-mismatch]. A uniform "shell out to X.mjs `<verb>`" doc idiom mislabeled an in-process export (`aggregateBackstops`) as a CLI subcommand — [uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]. Tour prose froze a quantitative structural claim ("these two arrays differ by exactly one entry, deliberately") with no drift-guard; it read authoritative while being false — [tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it].

**The decision this spec ratifies:** any fact duplicated across surfaces, or asserted in prose about a canonical code construct, must carry a mechanical test that binds it to its canonical source — extraction + equality, not presence. Where a fact resists a cheap mechanical bind (grep cannot see under-attribution; narrative counts rot), the resolution is either to *rewrite the fact so it can't rot* (describe the invariant, not the snapshot) or to make the obligation an explicit, checkable auditor-lens duty rather than a hope.

## 2. Pivotal constraints

- **Framework-free, gate-carried.** New tests are `node:test`/`assert` `.test.mjs` or bash-3.2-safe `.test.sh`, co-located with the surface, so they run under the existing `node --test 'skills/**/*.test.mjs'` and shell-test invocations. No new dependency (no package.json exists), no new runner. CI runs only the redaction lint today — enforcement must ride the local `node --test` gate that `/war`'s refiner and floors already exercise.
- **Canonical source is code where code exists.** `land-decision.mjs` exports, `war-config.mjs` `DEFAULTS`/`PRESETS`, `campaign-ledger.mjs` dispatch table, the JSON version slots — these are ground truth; the guard reads them, never a second hand-typed copy.
- **Anchor by construct, never line number** (repo law) — every guard locates its target by regex/name extraction, mirroring the existing HARD_ESCALATION_REASONS guard that "locates the inline array by regex extraction rather than line number." Line numbers rot across the serial merge queue.
- **Extraction, not presence.** A drift-guard that only asserts a substring is *present* is the very anti-pattern being retired. Guards must extract the literal from each surface and assert equality (`deepEqual` / string `===`).
- **Fail-closed where a fact gates a release or a hard-halt; fail-open (advisory) where a miss is cosmetic.** A partial version bump and a classifier-example/predicate contradiction are correctness-bearing → hard test failure. A stale nearby comment is doc debt → an advisory lint may warn without blocking, matching the existing worker Bash-write warn posture.
- **Some facts can't be cheaply mechanized — say so, don't fake it.** A generic detector of "every inline copy of any canonical export anywhere" is a research project (ADR-worthy scope creep). The ratified stance is an **explicit mirror registry** (a listed set of source→mirror pairs, each guarded) plus doctrine + a red-team probe — not a magic AST scanner. `// ponytail:` the registry as the deliberate ceiling.
- **Respect existing ADRs.** ADR 0006 (deterministic test floor), ADR 0013 (disposition routing), ADR 0017 (validation must live in gate/floor/backstops or escalate — a drift-guard is a *gate* member) all bound how these tests attach. A drift-guard is not a prose waiver; it is mechanical enforcement, which ADR 0017 prefers.

## 3. Resolved design tree (decision → resolution)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | How to catch a partial version bump ([version-slots-no-cross-slot-consistency-test]) | One framework-free `version-slots.test.mjs` reads both JSON files + `README.md`, asserts `plugin.json.version === marketplace.metadata.version === marketplace.plugins[0].version` and that the `## Status` paragraph contains that exact string. Fail-closed on `node --test`. |
| 2 | How to make "mirror + drift-guard = one unit" enforceable, not doctrinal ([run-provision-config-not-yet-mirrored-into-template]) | An **explicit mirror registry** test: one `.test.mjs` listing every (canonical export, inline mirror site) pair, each asserting `deepEqual`/byte-identity via regex extraction (extending the existing HARD_ESCALATION_REASONS guard to cover KNOWN_LAND_DECISIONS and the `war-config.mjs` helper mirrors). A plan-authoring rule (§4) + a red-team spine probe forbid landing a new mirror without a registry entry. No auto-AST scanner. |
| 3 | How to bind the standing-.md vs dispatched-prompt split ([standing-instruction-vs-dispatched-prompt-coverage-split]) | Extend the existing both-surfaces drift guard (`workflow-template.test.mjs` T1) to a registry of correctness-critical directives, asserting each appears in BOTH `agents/*.md` and the dispatched prompt **including the gate-audit inline seats** currently outside `auditPrompt()`. Token-anchored, case-tolerant (never full-line bytes), matching the established idiom. |
| 4 | How to catch drift between N byte-identical text copies ([gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity]) | When Commander's Intent mandates byte-identical text (the pointer line, a CLI example), generate ONE cross-surface consistency test that extracts the literal substring from each surface and asserts equality — owned by the last-landing mirrored task or a phase-closing task, replacing N independent anchor-phrase checks. Seed it with the CLAUDE.md pointer line across CLAUDE.md / `skills/war/SKILL.md` / `skills/lessons-learned/references/migration.md`. |
| 5 | How to stop default-flip doc rot ([default-flip-must-audit-all-doc-surfaces]) | Default-flip / scope-narrow gates must additionally assert the OLD value is **ABSENT** across all surface types (config table, field prose, schema examples, annotating skills, sibling cross-refs); the plan task must enumerate every surface as in-scope. Ratified as a `/war-strategy` plan-authoring rule + a red-team probe, not a standing test (the "old value" is per-change). |
| 6 | How to stop preset literals rotting while defaults stay correct ([doc-truth-sweep-must-check-presets-not-just-defaults]) | A `war-config` doc-truth guard that mechanically enumerates `DEFAULTS.agents` **and** every `PRESETS[name].agents.<role>.{model,effort}` and asserts any prose config claim naming a role-model is checked against the matching source (not defaults-only). Practically: the guard exports the full (preset, role, model, effort) matrix for the doc-honesty auditor + a `.test.mjs` asserting the matrix is complete so a new preset can't add an unwatched literal. |
| 7 | How to lock release-slot lock-step + kill the phantom-badge template prose ([release-bump-slots-canonical-no-badge]) | Fold the four-slot lock-step assertion into decision #1's test (the release drift-guard). Separately fix the reused release-plan template **at source**: drop the badge step, reword "populate empty Status" → "replace-in-place and verify baseline", say "three files / four slots". A `.test.sh`/`.test.mjs` greps the release-plan template surface asserting the phantom-badge token is ABSENT and the four-slot wording present. |
| 8 | How to catch ADR policy-table under-attribution ([adr-policy-table-entry-vs-mechanism-attribution]) | Grep can't see under-attribution → make it an explicit **doc-honesty auditor-lens obligation**: whenever a task changes a mechanism attribution, the lens must check the ADR chosen-option / policy-table row for that mechanism. Encoded in `agents/war-auditor.md` (standing) and mirrored into the dispatched doc-honesty prompt (per decision #3). |
| 9 | How to catch comments lagging a rewrite ([source-comment-lags-emitted-prompt-after-rewrite]) | An **advisory** post-rewrite lint step (a `.test.sh` or a worker-prompt directive) that greps a touched file for the old behavior's concrete terms (literal indent counts, retired values, old approach names) before commit. Advisory (warn), because "old term" is per-change; the auditor's cascading-impact lens carries the standing obligation. |
| 10 | How to bind a classifier's inline example list to its routing predicate ([held-workflow-error-infra-death-prose-mismatch]) | Treat classifier example lists as verifiable: the `held:*` routing predicates in `skills/war/SKILL.md` §4.2/§4.3 become the source of truth; a `.test.mjs` (or the both-surfaces registry) asserts each class's inline example maps to its predicate — infra-death must appear under `held:phase-incomplete`, never `held:workflow-error`. |
| 11 | How to stop a doc idiom mislabeling an export as a CLI verb ([uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]) | A doc/CLI consistency `.test.mjs` that extracts every `shell out to <module>.mjs <verb>` referent from SKILL.md files and asserts each `<verb>` has a matching `case`/subcommand in that module's dispatch table; `aggregateBackstops` (an export with no CLI case) must therefore NOT be phrased as a shell-out. |
| 12 | How to stop tour/narrative prose freezing a false structural count ([tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]) | Adopt a **mechanism-style narrative convention**: narrative docs describe the invariant ("these two arrays are kept identical by a drift-guard"), never the snapshot count ("differ by exactly one entry"). Where a real invariant exists, anchor the tour step to the drift-guard that already watches those arrays (decision #2), so the prose cannot assert a count that rots. Fix tour step 17 to match. |

## 4. Mechanics (per component / role)

### 4.1 Version / release drift-guard — new test co-located at repo scope
- **Where:** a new `.test.mjs` discoverable by `node --test 'skills/**/*.test.mjs'` (place under `skills/war/assets/` alongside the other gate tests, resolving repo root from `import.meta.url` so it reads the four slots at the top of the tree).
- **What it reads (canonical):** `.claude-plugin/plugin.json` → `version`; `.claude-plugin/marketplace.json` → `metadata.version` and `plugins[0].version`; `README.md` → the paragraph under `## Status`.
- **Assertions:** all three parsed version strings `===` each other; the `## Status` paragraph contains that exact string (regex-extract the bolded leading version token, assert equality). Fail-closed. This is the exact hardening the memory lesson specifies ("no test parses both JSONs and asserts version equality … Gap still open as of v0.14.2").
- **Release template fix (decision #7):** the reused release-plan template prose is edited at source (drop badge step; "replace-in-place and verify baseline"; "three files / four slots"). A grep test asserts the retired `badge` token is absent and the corrected wording present — the same *retire-token-via-clean-surface-gate-test* idiom already used elsewhere.

### 4.2 Mirror registry — extend the existing `deepEqual` drift-guard
- **Canonical:** `skills/war/assets/land-decision.mjs` exports `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`; `skills/war/assets/war-config.mjs` exports the roster helpers.
- **Mirror sites:** the inline `HARD_ESCALATION_REASONS` const and the `landDecision`/`spawnOpts`/`validateRoster`/`widenRoster` mirrors in `skills/war/assets/workflow-template.js` (the sandbox can't import — the architectural tax the tour's step 17 names).
- **Mechanics:** `workflow-template.test.mjs` already has M2 Test 3 (`deepEqual` inline vs canonical `HARD_ESCALATION_REASONS`, regex-extracted). Generalize into a small **registry** array of `{ canonicalExport, extractFromTemplate }` pairs, one `deepEqual` per pair, so adding a mirror means adding one registry row — and a red-team spine probe + a `/war-strategy` rule make an unguarded new mirror a plan defect. `// ponytail:` the registry is the deliberate ceiling; no generic AST scanner.

### 4.3 Both-surfaces directive registry — extend T1
- **Surfaces:** `agents/war-auditor.md`, `agents/war-refiner.md`, `agents/war-worker.md`, `agents/war-servitor.md` (standing) vs the dispatched prompt fragments in `workflow-template.js`, **including the gate-audit inline seats** (`execution-evidence`, `end-state`) that build prompts inline outside `auditPrompt()`.
- **Mechanics:** extend the existing T1 pattern (token-anchored, case-tolerant, comments stripped) with a registry of correctness-critical directives, each asserted present in BOTH the standing card and every dispatched surface that must carry it. The ADR-policy-table auditor obligation (decision #8) and the mechanism-style narrative rule ride this registry as directive rows.

### 4.4 Cross-surface byte-identity test — pointer line & CLI examples
- **Mechanics:** one test extracts the literal pointer-line substring from CLAUDE.md, `skills/war/SKILL.md`, and `skills/lessons-learned/references/migration.md` and asserts byte-equality across all copies (replacing the existing presence-only `war-config.test.mjs` pointer check, which asserts the phrase is *present* in SKILL.md but not that it *matches* CLAUDE.md). The CLAUDE.md pointer line is "ratified and byte-identical across surfaces" per repo law — this test is what actually enforces that law.

### 4.5 Preset-vs-default doc-truth matrix
- **Canonical:** `war-config.mjs` `DEFAULTS.agents` + `PRESETS[name].agents` partials (deep-merged by `presetConfig()`).
- **Mechanics:** a helper that enumerates the full `(preset, role, model, effort)` matrix (defaults included), plus a `.test.mjs` asserting the matrix covers every `PRESETS` key and every role — so a newly added preset cannot introduce an unwatched role-model literal. The doc-honesty auditor lens consults the matrix instead of re-reading only `DEFAULTS`.

### 4.6 Doc/CLI shell-out consistency test
- **Canonical:** each module's CLI dispatch table (e.g. `campaign-ledger.mjs` `switch (cmd)` → `init/add/sweep/next/record`; `war-config.mjs`, `safe-swap.sh`, `war-memory.mjs`).
- **Mechanics:** a `.test.mjs` greps SKILL.md files for `shell out to <module>.mjs <verb>` (and backtick CLI-verb forms), and asserts each `<verb>` matches a dispatch case in that module. `aggregateBackstops` — `export function aggregateBackstops(campaignDir)` in `campaign-ledger.mjs`, deliberately *not* a CLI case — must correspondingly never be phrased as a shell-out (the campaign SKILL.md already says "it is a module export, not a CLI subcommand"; the test locks that).

### 4.7 Classifier example ↔ predicate binding
- **Mechanics:** a `.test.mjs` asserting the `held:*` class-example lists in `skills/war/SKILL.md` §4.2/§4.3 map to their routing predicates (infra-death → retryable `held:phase-incomplete`, never terminal `held:workflow-error`). Sources of truth are the predicates; the doc examples are the checked copy.

### 4.8 Auditor-lens obligations & advisory lints (facts that resist cheap mechanization)
- **ADR policy-table (decision #8):** standing obligation added to the doc-honesty auditor lens in `agents/war-auditor.md`, mirrored into the dispatched prompt — because grep for over-strong claims structurally misses under-attribution (e.g. ADR 0002's chosen-option row still crediting the hook after allowlist-primary framing landed).
- **Comment-lag (decision #9):** an advisory post-rewrite grep lint / worker-prompt directive (warn, don't block) for retired concrete terms in a touched file; the auditor's cascading-impact lens holds the standing duty.
- **Mechanism-style narrative (decision #12):** a `/war-strategy` + auditor convention that narrative docs assert invariants, not snapshot counts; tour step 17 rewritten to reference the drift-guard rather than a "6 vs 7" count.

### 4.9 Plan-authoring & red-team enforcement (making doctrine mechanical)
- `/war-strategy` gains two plan-shape rules: (a) a task that lands a new mirror of a canonical export MUST land its registry entry in the same task; (b) a default-flip/scope-narrow task MUST enumerate every doc surface and its gate MUST assert the OLD value absent.
- `/red-team`'s universal spine gains probes: "does every new inline mirror have a matching drift-guard?" and "does every default-flip gate assert OLD-absent, not just NEW-present?" — proven in sandbox, patched into the plan until CLEARED.

## 5. Surface changes (files touched)

Grouped by kind; a plan will carve these into file-disjoint tasks (code-boundary decomposition).

**New test files (framework-free, ride `node --test`):**
- `skills/war/assets/version-slots.test.mjs` — decisions #1, #7 (four-slot lock-step + release-template token check).
- Cross-surface pointer-line byte-identity test (decision #4) — extend `skills/war/assets/war-config.test.mjs` (which owns today's presence-only pointer check) rather than add a file.
- Doc/CLI shell-out consistency test (decision #6/#11) — new `.test.mjs` (e.g. under `skills/_shared/` or `skills/war-campaign/assets/`).
- Preset-vs-default matrix completeness test (decision #6) — extend `skills/war/assets/war-config.test.mjs`.
- Classifier example ↔ predicate test (decision #10) — extend `skills/war/assets/workflow-template.test.mjs` or a small new test near `skills/war/SKILL.md`.

**Extended existing tests:**
- `skills/war/assets/workflow-template.test.mjs` — generalize M2 Test 3 into the mirror registry (decision #2); extend T1 into the both-surfaces directive registry incl. gate-audit inline seats (decision #3).

**Source / prose fixes:**
- `skills/war/assets/war-config.mjs` — export the preset-role-model matrix helper (decision #6).
- `skills/war/SKILL.md` — release-plan template prose (drop badge, "replace-in-place", "three files / four slots") (decision #7); classifier example lists aligned to predicates (decision #10).
- `agents/war-auditor.md` — doc-honesty lens: ADR policy-table obligation, mechanism-style-narrative obligation, comment-lag duty (decisions #8, #9, #12); mirrored into the dispatched prompt in `workflow-template.js`.
- `.tours/architect-war-system.tour` — step 17 rewritten to reference the drift-guard, not a snapshot count (decision #12).
- `skills/war-strategy/SKILL.md` — the two plan-authoring rules (decision #4.9); templates are locked by its structure test, so that test updates in the same task.
- `skills/red-team/SKILL.md` (+ spine asset) — the two new spine probes (decision #4.9).

**Docs:**
- `CONTEXT.md` — new terms (§6).
- `docs/adr/` — one new ADR (§7).

## 6. New domain terms (CONTEXT.md)

- **Drift-guard** — a mechanical test that extracts a fact from a non-canonical surface and asserts equality (`deepEqual` / byte-`===`) against its canonical source. Distinguished from a **presence check**, which only asserts an anchor phrase exists and is explicitly *not* a drift-guard.
- **Canonical source vs mirror site** — the single authoritative definition of a fact (a code export, a JSON field, a routing predicate) vs any hand-maintained copy of it (an inline sandbox mirror, a doc claim, a tour count).
- **Mirror registry** — the explicit, listed set of (canonical export → mirror site) pairs, each carrying a drift-guard. The ratified alternative to an automatic mirror-detector; adding a mirror means adding a registry row.
- **Both-surfaces directive registry** — the listed set of correctness-critical directives asserted present in BOTH an agent's standing `.md` and its dispatched prompt (incl. gate-audit inline seats).
- **Mechanism-style narrative** — a doc convention: describe the invariant and the guard that holds it, never a snapshot count/divergence that rots (extends the existing "cite the section that DEFINES a mechanism" discipline to narrative/tour prose).

## 7. Recommended ADRs

- **ADR 0023 — Drift-guard discipline for duplicated and asserted facts.** Context: presence-only and well-formedness-only checks let mirrored constants, both-surface directives, byte-identical doc text, version slots, and prose code-claims rot silently. Decision: any duplicated/asserted fact carries a mechanical drift-guard binding it to its canonical source (extraction + equality); where a fact resists cheap mechanization, rewrite it to an invariant or make the check an explicit auditor-lens obligation. Consequences: mirror + drift-guard land as one task (`/war-strategy` rule + red-team probe); the mirror registry is the deliberate ceiling over an AST scanner; four version slots gain a lock-step test. Supersedes the byte-identity-by-convention posture of the pointer-line and version-slot conventions in CLAUDE.md/`## Commands`.

One ADR is sufficient; the twelve resolutions are one policy. No change to ADR 0006/0013/0017 — this operates within them (a drift-guard is a gate member, satisfying ADR 0017's "live in gate/floor/backstops or escalate").

## 8. Open risks / implementation notes

- **Test-at-repo-root reachability.** The version-slots test lives under `skills/` (so `node --test 'skills/**/*.test.mjs'` finds it) but reads files at the repo top — it must resolve root from `import.meta.url`, not `process.cwd()` (subagent cwd is the main repo, not the session worktree; cwd resets between bash calls). Note this in the plan's task.
- **Registry maintenance is itself a convention.** The mirror registry and both-surfaces registry can go stale if someone adds a mirror without a row — that is exactly why decision #2 pairs the registry with a `/war-strategy` rule and a red-team spine probe. Mechanical detection of the *absence* of a registry row is the residual gap; `// ponytail:` accept it, upgrade to an AST scan only if the pattern recurs after this lands.
- **Byte-identity vs deliberate quoting.** A byte-identity guard on a pointer line is fragile to a release blurb that *quotes* the old wording (the recorded rename/absence-guard trap). Scope the extraction to the canonical surfaces only; exclude changelog/release-blurb prose (mirror the existing absence-guard subtree-anchoring lesson).
- **Advisory vs blocking calibration.** Comment-lag (decision #9) is advisory to avoid a blocking check that fires on every incidental rename; if it proves too noisy or too silent, the auditor lens is the backstop. Everything release- or hard-halt-bearing (decisions #1, #10) is blocking.
- **Gate-audit inline seats.** Extending the both-surfaces registry to the inline gate-audit prompts requires those prompts to expose their directive text to the test without executing a Workflow — extract from the template source string, consistent with how T1 already reads `src`.
- **Preset matrix completeness ≠ prose correctness.** The matrix test guarantees every preset/role is *watched*; it does not by itself read the prose. The doc-honesty auditor consuming the matrix is what closes prose drift — a mechanical assist to a human-lens duty, not a full replacement.

## 9. Non-goals / deferred

- **No generic AST/import-graph scanner** that auto-discovers every inline copy of every canonical export. Explicit registries + doctrine + red-team probes are the ratified ceiling; revisit only on recurrence.
- **No CI change.** CI runs only the redaction lint; these guards ride the local `node --test` gate the refiner and `/war` already exercise. Wiring CI to run the full suite is a separate decision.
- **No cross-repo/submodule surface** — this spec covers WAR's own surfaces; drift-guards for submodule-content docs are out of scope.
- **No retroactive sweep of all existing prose** for latent drift beyond the twelve named surfaces — the discipline is forward-looking plus the enumerated seeds; a full doc-truth sweep remains the `/lessons-learned`/manual pass it is today.
- **Not a new lint CLI or shared drift-guard framework** — each guard is a few lines of `assert` co-located with its surface; a shared helper is introduced only if three-plus guards duplicate non-trivial extraction logic.

## 10. Validation criteria (concrete, testable)

Each criterion is independently checkable and becomes a numbered End-state condition in the plan.

1. **Version lock-step, fail-closed.** With all four slots at `0.14.14`, `version-slots.test.mjs` passes; manually bumping `plugin.json#version` to `0.14.15` while leaving the other three makes it **fail** under `node --test 'skills/**/*.test.mjs'`; likewise a `## Status` paragraph naming a different version fails.
2. **Release-template prose cleaned.** The release-plan template surface in `skills/war/SKILL.md` contains no phantom "badge" instruction, says "three files / four slots" (not "three version-of-truth files"), and frames Status as "replace-in-place / verify baseline" (not "populate an EMPTY Status"); a grep test asserts the retired token absent and the corrected wording present.
3. **Mirror registry catches an unguarded divergence.** Editing the inline `HARD_ESCALATION_REASONS` (or `KNOWN_LAND_DECISIONS`) in `workflow-template.js` to differ from the `land-decision.mjs` export makes the registry test fail; the registry lists at least the HARD_ESCALATION_REASONS, KNOWN_LAND_DECISIONS, and roster-helper mirrors.
4. **Both-surfaces registry covers gate-audit inline seats.** Removing a registered correctness-critical directive from either `agents/war-auditor.md` or the dispatched (incl. inline gate-audit) prompt makes the both-surfaces test fail; the ADR-policy-table obligation appears in both surfaces.
5. **Pointer-line byte-identity.** Changing the pointer line's wording/emoji in `skills/war/SKILL.md` but not `CLAUDE.md` makes the cross-surface identity test fail (today's presence-only check passes that mutation).
6. **Default-flip OLD-absent rule is enforced in plan shape.** A `/war-strategy`-converted plan for a default flip enumerates every doc surface and its gate asserts the OLD value absent; `/red-team`'s spine flags a plan that asserts only NEW-present.
7. **Preset matrix completeness.** Adding a new `PRESETS` entry (or a new role) without adding it to the enumerated matrix makes the matrix-completeness test fail; the matrix covers every current preset (`thorough`, `economy`, …) × every role (`worker`/`auditor`/`refiner`/`servitor`).
8. **Shell-out ↔ CLI consistency.** A SKILL.md line phrasing `aggregateBackstops` (or any export lacking a dispatch case) as `shell out to campaign-ledger.mjs <verb>` makes the doc/CLI consistency test fail; every real `shell out to X.mjs <verb>` referent resolves to a dispatch case.
9. **Classifier example ↔ predicate.** Listing infra-death under `held:workflow-error` in `skills/war/SKILL.md` makes the classifier-binding test fail; the shipped doc lists it under `held:phase-incomplete`.
10. **Tour narrative carries no rotting count.** `.tours/architect-war-system.tour` step 17 describes the drift-guard invariant, asserts no fixed "N-vs-M entries" count, and (grep) the retired "differ by exactly one entry" framing is absent.
11. **Whole suite green.** `node --test 'skills/**/*.test.mjs'` and every `hooks`/`skills` `*.test.sh` pass with all new/extended guards present; the redaction lint (`war-memory.mjs lint docs/learnings/`) is unaffected.
12. **ADR ratified.** `docs/adr/0023-*.md` exists, states the drift-guard discipline, names the mirror-registry ceiling, and is referenced by CONTEXT.md's new terms.
