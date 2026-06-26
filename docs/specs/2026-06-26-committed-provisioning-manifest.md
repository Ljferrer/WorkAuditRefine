## Committed repo provisioning manifest (Part B · D4)

**Goal:** give a target repo a *committed, level-1-authority provisioning manifest* that both flagship skills honor — the scout reads it ahead of CI/onboarding/structural and emits `provisionSource: 'manifest'`; the red-team executed probes run the same list. This closes the last deferred decision (D4) of the worktree-provisioning Part B spec.

**Closes:** [#51](https://github.com/Ljferrer/WorkAuditRefine/issues/51) — *Part B follow-up: first-class committed repo provisioning manifest (D4)*.

**One-line summary:** Define a tiny committed manifest (`.war-provision.json` at repo root), add a tested `readManifest()` reader to `skills/_shared/provision.mjs`, wire it into the scout as authority tier 1 (above CI) so it emits `provisionSource:'manifest'`, honor it on the red-team executed-probe path, document the contract in `schemas.md` (flipping the "deferred to #51" note), and add a golden fixture.

> **Baseline / drift note (2026-06-26).** The live repo is **v0.6.5** (`.claude-plugin/plugin.json`), past the stacked audit-remediation series — NOT the v0.5.1 of the Part B plan that filed #51. This feature ships **v0.6.6** (per-feature +0.0.1). The Part B groundwork (`PROVISION_SOURCES` already includes `'manifest'`; `resolveProvision`; the scout; `env-blocked`; the red-team `provisionDirective`) is **complete and live** — `'manifest'` is a *reserved-but-unemitted* enum value today. This spec is design-first: **Phase 0 (in this doc) must be ratified via `/red-team` before `/war`**, because the only undecided pieces are format + location + authority semantics; everything downstream is plumbing onto an existing seam.

---

## 1. Problem statement

Issue #51 is the Part B spec's decision **D4** — explicitly deferred ([docs/specs/2026-06-25-worktree-provisioning-design.md §B.3.6](../specs/2026-06-25-worktree-provisioning-design.md), "Optional deeper layer — a committed repo manifest both skills read (level 1 made first-class); larger surface, sequenced last"). The plumbing was built; the manifest tier was not. Per sub-item:

| # | Sub-item | Verified root cause | Current evidence (file:anchor) |
|---|----------|--------------------|--------------------------------|
| 51.1 | Define manifest format + schema | No format ever chosen; D4 deferred the design | Part B spec §B.3.6; no manifest file or schema anywhere in the tree |
| 51.2 | Choose file location + naming | Same — deferred | spec §B.3.1 lists "a committed manifest" as authority (1) but names no path |
| 51.3 | Implement manifest reading in `provision.mjs` (or sibling) | The module has only `validateProvision` + `structuralFallback`; **no manifest reader** | [skills/_shared/provision.mjs](../../skills/_shared/provision.mjs) — module top comment lists exactly two helpers; no read logic |
| 51.4 | Wire manifest as scout authority tier 1 (before CI) | Scout reads only explicit→ci→onboarding→structural; manifest tier never added | [agents/war-setup-scout.md:44-88](../../agents/war-setup-scout.md) — "Algorithm — descending authority" has tiers 1-4 = explicit/ci/onboarding/structural; **no manifest tier** |
| 51.5 | Update `workflow-scaffold.js` for red-team executed probes | The scaffold runs a passed-in `provision` list but has no manifest awareness; a manifest-only repo provisions in `/war` but not `/red-team` unless the Lead happens to pass the list | [skills/red-team/assets/workflow-scaffold.js:36](../../skills/red-team/assets/workflow-scaffold.js) (`provision = []` arg) + L46-59 (`provisionDirective`) — list comes only from `args.provision` |
| 51.6 | Document manifest contract in `schemas.md` | `'manifest'` is listed in `PROVISION_SOURCES` but `schemas.md` still marks it **deferred / not-emitted** | [skills/war/references/schemas.md:95](../../skills/war/references/schemas.md) — "`manifest` … is **deferred to issue #51** — reserved in the enum but not yet emitted by any scout tier" |
| 51.7 | Add manifest-reading golden fixture | Only CI/submodule/pnpm fixtures exist; no manifest fixture | [skills/_shared/fixtures/provision/](../../skills/_shared/fixtures/provision/) — `ci-submodule-repo`, `pnpm-repo`, `submodule-repo`, `EXPECTED.md`; no manifest case |

**Reserved-but-live anchors** (the enum already admits the value, so adding emission is non-breaking):
- [skills/war/assets/war-config.mjs:17](../../skills/war/assets/war-config.mjs) — `PROVISION_SOURCES = ['explicit', 'manifest', 'ci', 'onboarding', 'structural', 'none']`
- [war-config.mjs:14-16](../../skills/war/assets/war-config.mjs) — comment: `'manifest'/'ci'/'onboarding'/'structural' = scouted (descending authority)`
- [war-config.test.mjs:140-153](../../skills/war/assets/war-config.test.mjs) — `PROVISION_SOURCES enum has the expected members` + `each provisionSource enum member is accepted` already exercise `'manifest'` as a *valid config value*; this feature makes it an *emitted* value.

---

## 2. Design / approach

### Phase 0 decisions (ratify in `/red-team` before `/war`)

**D-FORMAT — JSON.** The manifest is **JSON** (`.war-provision.json`), not YAML or shell.
- *Rationale:* the whole provisioning system is already JSON-native (`run.provision` is a JSON `string[]`; `war-config.mjs` and `provision.mjs` are dependency-free ESM with no YAML parser; the plugin has **no npm deps** by policy — adding a YAML lib violates that). Shell is rejected because the manifest must be *read and validated*, not *executed* — sourcing arbitrary shell to "get the list" reintroduces exactly the code-execution surface the scout design avoids.
- *Rejected:* YAML (needs a parser dep), `.sh`/Makefile (executable = unsafe to read, conflates declare with run — the same anti-goal the Part B spec rejected for `overrides.gate`).

**D-SCHEMA — minimal, mirrors `ScoutResult`.** The manifest is an object:
```jsonc
{ "provision": ["<shell cmd>", ...],   // ordered; required; [] is valid (declares "no steps")
  "rationale": "why these, in this order" }   // optional; free text, surfaced to the operator
```
The committed `provision` array is validated by the **existing** `validateProvision` (array of non-empty trimmed strings). `source` is **not** a manifest field — it is assigned by the reader (`'manifest'`), never self-declared, so a repo cannot lie about its authority tier. Unknown top-level keys → **fail-loud** (typo protection; matches `war-config.mjs validate()` house style of one clear error per offender). See Open Question on strictness.

**D-LOCATION — `.war-provision.json` at the repo root.** Sibling to `.gitmodules`/`package.json`.
- *Rationale:* repo-root is glob-discoverable with zero path assumptions; it is *tracked* (committed) — unlike `.claude/`, which WAR adds to `.git/info/exclude` (Part A D6, [spec §A.D6](../specs/2026-06-25-worktree-provisioning-design.md)), so a manifest under `.claude/` would mix a tracked file into an excluded dir. The `.war-` prefix names the owner unambiguously and avoids implying GitHub-only semantics.
- *Rejected:* `.claude/provision.json` (excluded-dir collision above); `.github/provision.json` (implies GitHub Actions coupling — the manifest is CI-agnostic).

**D-AUTHORITY — manifest is scout tier 1, below explicit operator intent, above CI.** Final order:

| Tier | Source | Reader |
|------|--------|--------|
| 0 | explicit operator `run.provision` (non-empty) | `resolveProvision` short-circuits — never scouted ([war-config.mjs:129-138](../../skills/war/assets/war-config.mjs)) |
| **1** | **`.war-provision.json` manifest** | **`readManifest` (new) → `source:'manifest'`** |
| 2 | `.github/workflows/*.yml` (CI) | scout |
| 3 | onboarding (`.devcontainer`/Makefile/package.json/README) | scout |
| 4 | structural floor (`structuralFallback`) | scout / module |

This matches the Part B spec exactly: §B.3.1 already names "(1) **explicit operator intent** (`run.provision` or a committed manifest — authoritative, stop)" — the manifest was always intended at the top. We split that conflated tier so an *operator* override (tier 0, in config) still beats a *committed* manifest (tier 1, in the repo): the operator running the tool wins over what the repo author committed. The scout reads the manifest **deterministically** (it is JSON, not a fuzzy signal) — so reading + validating the manifest belongs in the **module** (`readManifest`), and the scout merely *prefers* it.

**D-EMIT — `provisionSource: 'manifest'`.** When the manifest yields a list, the scout returns `source: 'manifest'`. This requires *widening the scout's emitted enum* from `{explicit, ci, onboarding, structural}` to `{explicit, manifest, ci, onboarding, structural}` — the config enum already allows it; this is the change that flips schemas.md L95's "not yet emitted by any scout tier."

### Per-item fix

- **51.1 / 51.2 (format + location):** decided above (D-FORMAT, D-LOCATION). Recorded in this spec's Decision record + schemas.md (51.6).
- **51.3 (reader):** add `readManifest(repoDir)` to [provision.mjs](../../skills/_shared/provision.mjs) — a third tiny helper alongside `validateProvision`/`structuralFallback`. It reads `<repoDir>/.war-provision.json`, returns `{ found:false }` when absent (so callers fall through), and `{ found:true, provision, rationale }` when present, **after** running the bytes through `JSON.parse` + `validateProvision` + the strict-key check. Malformed JSON / failed validation / unknown keys → `{ found:true, ok:false, errors:[…] }` so the caller surfaces a clear error rather than silently falling through to CI (a present-but-broken manifest must fail loud, not be ignored). Reuses `existsSync`/`join`/`readFileSync` already imported or trivially addable. **Structural fallback preserved:** `readManifest` is additive; `structuralFallback` is unchanged and still the tier-4 floor.
- **51.4 (scout wiring):** add a **tier 1 `manifest`** section to [war-setup-scout.md](../../agents/war-setup-scout.md)'s "Algorithm — descending authority" (renumber CI→2 already there). The scout instruction: *after* checking explicit intent, read `.war-provision.json` via the module's `readManifest`; if `found && ok`, honor its `provision` **verbatim** with `source:'manifest'` and a rationale citing the manifest; if `found && !ok`, **stop and report the validation errors** (do not fall through); if `!found`, continue to CI. Update the agent's `## Return` enum and frontmatter `description` to include `manifest`.
- **51.5 (red-team path):** the red-team **Lead** reads the manifest via the shared `readManifest` and threads the resolved list into the scaffold's existing `provision` arg — so a manifest-only repo provisions identically in `/war` and `/red-team`. The [workflow-scaffold.js](../../skills/red-team/assets/workflow-scaffold.js) `provisionDirective` (L53-59) is **unchanged** (it already runs whatever list it's given); the wiring is in [skills/red-team/SKILL.md:26](../../skills/red-team/SKILL.md) (the step that assembles `args.provision`) + a scaffold-level comment documenting manifest provenance. Back-compat: no manifest → `provision` stays `[]` → byte-for-byte identical Workflow ([scaffold L52 back-compat contract](../../skills/red-team/assets/workflow-scaffold.js)).
- **51.6 (schemas.md):** flip [schemas.md:95](../../skills/war/references/schemas.md) — remove "deferred to issue #51 … not yet emitted"; add a **manifest contract** subsection under §ScoutResult documenting the file (`.war-provision.json`), its JSON schema, the authority position (tier 1, above CI, below explicit operator `run.provision`), the `source:'manifest'` tag, and the assigned-not-declared rule. Widen the documented scout-emitted enum to include `manifest`.
- **51.7 (fixture):** add `skills/_shared/fixtures/provision/manifest-repo/` containing `.war-provision.json` (a 2-step list) **and** a competing `.github/workflows/test.yml` (a *different* install) so the golden proves manifest **wins over CI**. Document the expected result in `EXPECTED.md`. Because `readManifest` is deterministic JSON parsing (unlike the LLM scout), it also gets **unit-test** coverage in `provision.test.mjs` against this fixture — closing the "no automated test for the scout" gap for the manifest tier specifically.

### #85 note

Issue #85 is **not in this group** (`issuesCovered: [51]`); no #85 solution/decision doc is consolidated here. (The task brief's generic "for #85" clause does not apply — this group's only issue is #51.)

---

## 3. Decision record

- **Scope boundary — the manifest is read, never executed.** It declares a `string[]`; the existing `run.provision` run-loop (refiner Provision barrier for `/war`; `provisionDirective` for `/red-team`) executes it. No new execution path.
- **Back-compat guarantee — purely additive.** `'manifest'` is already a valid `PROVISION_SOURCES` member; no enum widening in config, no breaking validation change. A repo with **no** `.war-provision.json` behaves exactly as today (scout falls through to CI; red-team gets `provision:[]`). Existing fixtures and tests are untouched except for additions.
- **Authority — operator (tier 0) > manifest (tier 1) > CI (tier 2).** A committed manifest beats what the scout would *derive*, but an operator who explicitly pins `run.provision` still wins (the human running the tool overrides the repo author). Enforced by `resolveProvision`'s existing short-circuit being upstream of the scout.
- **`source` is assigned, not self-declared.** The manifest carries no `source` field; the reader stamps `'manifest'`. A repo cannot claim a higher tier.
- **Fail-loud on a broken manifest.** A present-but-invalid manifest (bad JSON, failed `validateProvision`, unknown key) **stops** with errors — it does not silently fall through to CI. Defense-in-depth: the manifest is the highest derived authority, so a malformed one must be visible, not masked.
- **Defense-in-depth reuse.** Validation reuses `validateProvision` (already trusted, already tested) rather than a parallel validator; the manifest list is guarded by the same primitive that guards every other provision source.
- **No npm deps.** JSON-only keeps the dependency-free ESM constraint intact.
- **Out of scope:** manifest *generation* (writing a `.war-provision.json` for a repo), manifest schema *versioning*, per-phase manifests. Single repo-root manifest, single shape.

---

## 4. Phase → task decomposition (WAR fan-out)

Strict TDD: each task pairs a failing test with its change. Tasks are sized for parallel workers; serial deps noted. One-task-per-phase where tasks share a file (per memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

### Phase 0 — Design ratification (no code)
The Phase 0 decisions above (format=JSON, location=`.war-provision.json`@root, authority=tier-1) are ratified via `/red-team` on this spec. **Gate to Phase 1: red-team CLEARED.** No task; the artifact is this doc.

### Phase 1 — `readManifest` reader + unit tests + fixture
**Task 1.1 — `readManifest()` in the shared module.**
- **Files:** modify [skills/_shared/provision.mjs](../../skills/_shared/provision.mjs); test [skills/_shared/provision.test.mjs](../../skills/_shared/provision.test.mjs).
- **Test (failing first):** new `readManifest` describe block —
  - absent file → `{ found:false }` (throwaway dir via the existing `makeRepo` helper, [provision.test.mjs:18-25](../../skills/_shared/provision.test.mjs)).
  - valid manifest `{provision:['git submodule update --init --recursive','pnpm install --frozen-lockfile'],rationale:'…'}` → `{ found:true, ok:true, provision:[…2…], rationale:'…' }`.
  - empty `{provision:[]}` → `found:true, ok:true, provision:[]` (valid "no steps").
  - malformed JSON → `found:true, ok:false`, `errors` non-empty.
  - `provision` failing `validateProvision` (e.g. `['ok','  ']`) → `ok:false`, error matches `/provision\[1\].*non-empty/` (mirror [war-config.test.mjs:135-139](../../skills/war/assets/war-config.test.mjs)).
  - unknown top-level key (`{provision:[],bogus:1}`) → `ok:false`, error names `bogus`.
- **Change:** implement `readManifest(repoDir)` per D-SCHEMA; reuse `validateProvision`; add `readFileSync` import.
- **Closes:** 51.3.

**Task 1.2 — manifest golden fixture + manifest-beats-CI unit test.**
- **Files:** new `skills/_shared/fixtures/provision/manifest-repo/.war-provision.json`; new `…/manifest-repo/.github/workflows/test.yml` (a *different* install, to prove precedence); modify [EXPECTED.md](../../skills/_shared/fixtures/provision/EXPECTED.md); test in [provision.test.mjs](../../skills/_shared/provision.test.mjs).
- **Test (failing first):** `readManifest(FIXTURES/'manifest-repo')` → `found:true, ok:true`, `provision` deepEquals the manifest's list (NOT the CI install) — proving the reader prefers the committed manifest. Assert on the **unique** manifest command string (avoid the weak-assertion trap, memory `weak-test-assertion-passes-without-feature-being-exercised`).
- **Change:** add fixture files; append a `## Golden — manifest-repo` section to `EXPECTED.md` documenting that authority resolves to `manifest` over the present CI workflow.
- **Closes:** 51.7 (+ supports 51.1/51.2 by making the format/location concrete).
- **Dep:** Task 1.1 (uses `readManifest`).

### Phase 2 — Scout tier-1 wiring + `provisionSource:'manifest'`
**Task 2.1 — scout reads the manifest as authority tier 1.**
- **Files:** modify [agents/war-setup-scout.md](../../agents/war-setup-scout.md).
- **Test (failing first):** the scout has no `node:test` (LLM agent), so the gate is the **structural fixture golden** (EXPECTED.md, Task 1.2) **plus** a doc-assertion test added to a `.test.sh` runner or `provision.test.mjs` that greps the agent file: assert `war-setup-scout.md` contains a `manifest` tier described as **above** CI (assert ordering: the `manifest` heading appears before the `ci` heading in the algorithm section), and that the `## Return` enum + frontmatter `description` list `manifest`. (Mirror the doc-scan prior-art from memory `frontmatter-tools-negation-check-single-line-only` / `source-comment-lags-emitted-prompt-after-rewrite` — scan the emitted text, not a comment.)
- **Change:** insert "### 1. `explicit`" unchanged; add "### 2. `manifest` — `.war-provision.json`" (renumber ci→3 etc., OR keep numeric labels and insert manifest as the new tier between explicit and ci with prose making the order explicit). The tier instructs: read via `readManifest`; `found&&ok` → honor verbatim, `source:'manifest'`; `found&&!ok` → stop + report errors; `!found` → fall to CI. Update `## Return` enum to `"explicit" | "manifest" | "ci" | "onboarding" | "structural"` and the frontmatter `description`'s "(explicit intent → CI → …)" to "(explicit intent → manifest → CI → …)".
- **Closes:** 51.4.
- **Dep:** Task 1.1 (references `readManifest`).

### Phase 3 — red-team executed-probe path
**Task 3.1 — red-team honors the manifest.**
- **Files:** modify [skills/red-team/SKILL.md](../../skills/red-team/SKILL.md) (the `args.provision` assembly step, L26); add a provenance comment in [skills/red-team/assets/workflow-scaffold.js](../../skills/red-team/assets/workflow-scaffold.js) near L46-52; test = the existing scaffold test suite (`*.test.mjs` for the scaffold, if present) asserting back-compat (`provision:[]` → no `PROVISION FIRST` block) is preserved.
- **Test (failing first):** if a scaffold `.test.mjs` exists, add: with a non-empty `provision`, an `executed` probe's emitted scope-lock contains `PROVISION FIRST` + each command (mirror [scaffold L53-59](../../skills/red-team/assets/workflow-scaffold.js)); with `provision:[]`, it does **not** (back-compat). The SKILL.md change is doc; assert via a doc-scan that SKILL.md step 3 instructs reading `.war-provision.json` via `readManifest` and passing the result as `provision`.
- **Change:** SKILL.md — instruct the red-team Lead to read the manifest (shared `readManifest`) and thread the list into `args.provision` (same way `/war` pins it), so manifest-only repos provision in both skills. Scaffold gets a comment documenting the manifest as one valid provenance of `args.provision`; **no behavioral scaffold change** (it already runs the list).
- **Closes:** 51.5.
- **Dep:** Task 1.1.

### Phase 4 — schemas.md contract doc + release
**Task 4.1 — flip the "deferred" note; document the manifest contract.**
- **Files:** modify [skills/war/references/schemas.md](../../skills/war/references/schemas.md).
- **Test (failing first):** doc-scan assertion (in a `.test.sh` or the config test) that schemas.md **no longer** contains "deferred to issue #51" / "not yet emitted by any scout tier" near the ScoutResult section, AND **does** contain a manifest-contract block naming `.war-provision.json` and `source: "manifest"` and the authority phrase "above CI" / "below explicit". (Anchor on the unique manifest-contract string, drift-resistant per memory `prune-assertion-substring-token-drift`.)
- **Change:** rewrite [schemas.md:94-96](../../skills/war/references/schemas.md): widen the scout-emitted enum to include `manifest`; add a `### Provisioning manifest (.war-provision.json)` subsection with the JSON schema, authority tier (1, above CI, below explicit operator intent), the assigned-not-declared `source` rule, and the fail-loud-on-broken contract. Update the inline comment at [schemas.md:24](../../skills/war/references/schemas.md) only if wording drifts (it already lists `manifest` in the enum).
- **Closes:** 51.6.

**Task 4.2 — version bump v0.6.6 (new feature, minor patch) + full gate green.**
- **Files:** the README-documented bump list — `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`, README `## Status` (REPLACE-in-place) (per memory `release-bump-slots-canonical-no-badge` / `release-status-is-replace-slot-not-empty-field`).
- **Test:** the full self-discovering gate green (Test plan §6).
- **Closes:** release; no #51 sub-item but required to ship.

---

## 5. Test plan

**Gate (for `/war`)** — full multi-runner, self-discovering (memory `gate-under-covers-after-cross-branch-merge-new-runner`, `node-breadth-assertion-test-js-overclaims`). Quote the node glob (unquoted under-covers on bash 3.2):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```
(Equivalently `war-config.mjs --resolve-gate` over the declared node command, [war-config.mjs:155-162](../../skills/war/assets/war-config.mjs).)

**Specific assertions / prior-art mirrored:**
- `provision.test.mjs` (new `readManifest` block): absent→`{found:false}`; valid→list+rationale; empty list valid; malformed JSON→`ok:false`; bad entry→`ok:false` with `/provision\[1\].*non-empty/` (mirrors [war-config.test.mjs:135-139](../../skills/war/assets/war-config.test.mjs) and the existing `validateProvision` tests at [provision.test.mjs:33-49](../../skills/_shared/provision.test.mjs)); unknown key→`ok:false` naming the key.
- `provision.test.mjs` (manifest-repo fixture): `readManifest` returns the **manifest** list, not the competing CI install — asserted on the unique manifest command (manifest-beats-CI precedence proof).
- Doc-scan tests: scout agent lists `manifest` tier **before** `ci`, in `## Return` enum, and in frontmatter `description`; schemas.md drops "deferred to issue #51" and adds the manifest-contract block; red-team SKILL.md step 3 reads `.war-provision.json`.
- Scaffold (if `*.test.mjs` present): non-empty `provision` → `PROVISION FIRST` emitted; `[]` → not emitted (back-compat).
- `war-config.test.mjs` unchanged and green — the `PROVISION_SOURCES`/`each provisionSource enum member is accepted` tests ([war-config.test.mjs:140-153](../../skills/war/assets/war-config.test.mjs)) already cover `manifest` as a valid value; this feature does not alter them.

---

## 6. Out of scope + open questions

**Out of scope:** manifest *generation* tooling; manifest schema *versioning*/migration; per-phase or per-package manifests; YAML/TOML support; any change to `structuralFallback`'s contents (the floor stays tiny — extending it remains an anti-goal); changing the `env-blocked` / `warn` failure semantics (a failed manifest *command* still routes through the existing run-loop outcomes unchanged).

**Open questions:** see the `openQuestions` field — manifest filename confirmation (`.war-provision.json` vs `.claude/` vs `.github/`); manifest-vs-operator precedence confirmation; strict-unknown-key behavior; and whether the red-team Lead vs the scaffold reads the manifest.

---

## 7. Coverage table

| Issue / sub-item | Closed by |
|------------------|-----------|
| 51.1 Define manifest format + schema | Phase 0 (D-FORMAT, D-SCHEMA) ratified; concretized by Task 1.2 fixture; documented Task 4.1 |
| 51.2 File location + naming | Phase 0 (D-LOCATION) ratified; concretized Task 1.2; documented Task 4.1 |
| 51.3 Implement manifest reading in `provision.mjs` | Task 1.1 (`readManifest`) |
| 51.4 Scout authority tier 1 (before CI) + `provisionSource:'manifest'` | Task 2.1 |
| 51.5 `workflow-scaffold.js` red-team executed-probe path | Task 3.1 |
| 51.6 Document contract in `schemas.md` (authority, source tag; flip deferred) | Task 4.1 |
| 51.7 Manifest-reading golden fixture | Task 1.2 |
| (release) v0.6.6 ship | Task 4.2 |
