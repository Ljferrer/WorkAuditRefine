# Committed Repo Provisioning Manifest Implementation Plan (#51 · Part B D4)

**Goal:** give a target repo a *committed, level-1-authority provisioning manifest* (`.war-provision.json`) that both
flagship skills honor — the scout reads it ahead of CI/onboarding/structural and emits `provisionSource:'manifest'`;
the red-team executed probes run the same list. Closes the last deferred decision (D4) of the worktree-provisioning
Part B spec.

**Closes:** [#51](https://github.com/Ljferrer/WorkAuditRefine/issues/51) — first-class committed repo provisioning
manifest (D4).

**Scope (v0.7.0 — net-new feature, minor bump; PLAN 5 / final of the [open-issue remediation stack](2026-06-26-open-issue-remediation-roadmap.md)):**
define `.war-provision.json`, add a tested `readManifest()` to `skills/_shared/provision.mjs`, wire it into the scout
as authority tier 1 (above CI), honor it on the red-team executed-probe path, document the contract in `schemas.md`
(flipping the "deferred to #51" note), and add a golden fixture. The Part B groundwork is **already live**
(`PROVISION_SOURCES` reserves `'manifest'`; `resolveProvision`/scout/`env-blocked`/red-team `provisionDirective`
exist) — `'manifest'` is a *reserved-but-unemitted* enum value today, so this is **purely additive plumbing onto an
existing seam**.

**Operator decisions (2026-06-26, grill-with-docs — Phase 0 ratified):**
- **Location/name → `.war-provision.json` at the repo root** (operator-confirmed). Tracked, glob-discoverable,
  sibling to `.gitmodules`/`package.json`; the `.war-` prefix names the owner unambiguously and is CI-agnostic.
  **Rejected:** `.claude/provision.json` (WAR git-excludes `.claude/` per Part A D6 → a tracked file in an excluded
  dir); `.github/provision.json` (implies GitHub-Actions coupling).
- **Authority → operator (tier 0) > manifest (tier 1) > CI (tier 2)** (operator-confirmed). An operator who pins
  `run.provision` in config still wins (the human running the tool overrides the repo author); the committed manifest
  beats fuzzy CI-derivation. Matches Part B §B.3.1.
- **Format → JSON** (autonomous — *forced*). The plugin is dependency-free ESM by policy (no npm deps), so no YAML
  parser; shell is rejected because the manifest must be **read and validated, not executed** (sourcing shell to "get
  the list" reintroduces the code-execution surface the scout design avoids).
- **Schema → minimal, `source` assigned-not-declared** (autonomous). `{ "provision": string[] (required, ordered; []
  valid = "no steps"), "rationale"?: string }`. The committed `provision` array is validated by the **existing**
  `validateProvision` (non-empty trimmed strings). The manifest carries **no `source` field** — the reader stamps
  `'manifest'`, so a repo cannot lie about its authority tier.
- **Strictness → fail-loud** (autonomous). Unknown top-level keys, malformed JSON, or a failed `validateProvision`
  → the reader returns `{found:true, ok:false, errors:[…]}`; a present-but-broken manifest **stops with errors**, it
  does not silently fall through to CI (it's the highest derived authority — a malformed one must be visible).
- **Read-locus → the red-team Lead** reads the manifest via the shared `readManifest` and threads the list into the
  scaffold's existing `provision` arg (autonomous). The scaffold is **unchanged** (it already runs whatever list it's
  given) — mirrors how `/war` pins `run.provision` upstream of the Workflow.

**Architecture:** the manifest is **read, never executed** — it declares a `string[]`; the existing `run.provision`
run-loop (refiner Provision barrier for `/war`; `provisionDirective` for `/red-team`) executes it. No new execution
path. Reading + validating belongs in the **module** (`readManifest`, deterministic JSON), so the scout merely
*prefers* it. Validation reuses `validateProvision` (already trusted/tested), not a parallel validator.

**Dependency / ordering:** **plan 5 / last in the stack.** Touches `skills/_shared/provision.{mjs,test.mjs}`, new
fixtures, `agents/war-setup-scout.md`, `skills/red-team/SKILL.md` (+ a scaffold comment), `skills/war/references/schemas.md`.
**Phase 0 (design) MUST be ratified via `/red-team` on the spec before `/war`.** Net-new capability → **minor bump
v0.7.0** (lands on plan 4's v0.6.9). No file overlap with plans 1–4 except the four version slots.

**Tech stack:** dependency-free ESM (`provision.mjs`, `war-config.mjs`) under `node --test`; agent/skill/schema
markdown; JSON fixtures. No npm deps added.

**Gate (for `/war`):** the F12 self-discovering multi-runner (quote the node glob):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [spec](../specs/2026-06-26-committed-provisioning-manifest.md);
[Part B design §B.3.1/§B.3.6](../specs/2026-06-25-worktree-provisioning-design.md). Memory:
`run-provision-config-not-yet-mirrored-into-template`, `ci-submodule-fixture-omits-lockfile-to-force-ci-source`,
`provision-barrier-refiner-owned-not-worker-self-create`, `weak-test-assertion-passes-without-feature-being-exercised`.

## Build order (for `/war`)

- **Phase 0 — Design ratification (no code):** `/red-team` this plan/spec; **gate to Phase 1 = red-team CLEARED**
  (the manifest format/location/authority are now operator-confirmed; red-team stresses the contract).
- **Phase 1 — reader + fixture:** T1.1 (`readManifest`) → T1.2 (golden fixture + manifest-beats-CI test, dep T1.1).
- **Phase 2 — scout tier-1 wiring:** T2.1 (dep T1.1).
- **Phase 3 — red-team path:** T3.1 (dep T1.1).
- **Phase 4 — contract doc + release:** T4.1 (schemas.md) → T4.2 (v0.7.0).

Tasks 2.1 / 3.1 / 4.1 are parallel-eligible after T1.1 (distinct files); T1.2 also depends on T1.1.

---

## Phase 1 — `readManifest` reader + unit tests + fixture

### Task 1.1 — `readManifest()` in the shared module
**Files:** modify `skills/_shared/provision.mjs`; test `skills/_shared/provision.test.mjs`. **deps:** none.

- [ ] **Step 1 — Write failing tests** (new `readManifest` describe block; use the existing `makeRepo` throwaway-dir
  helper):
  - absent file → `{ found:false }`.
  - valid `{provision:['git submodule update --init --recursive','pnpm install --frozen-lockfile'],rationale:'…'}` →
    `{ found:true, ok:true, provision:[…2…], rationale:'…' }`.
  - empty `{provision:[]}` → `found:true, ok:true, provision:[]` (valid "no steps").
  - malformed JSON → `found:true, ok:false`, `errors` non-empty.
  - bad entry (`['ok','  ']`) → `ok:false`, error matches `/provision\[1\].*non-empty/` (mirror `validateProvision`
    tests + `war-config.test.mjs:135-139`).
  - unknown top-level key (`{provision:[],bogus:1}`) → `ok:false`, error **names** `bogus`.
  - **non-object JSON** — `null`, `[]`, `"x"`, `42` (each valid JSON but not an object) → `found:true, ok:false`
    with a clear "must be a JSON object" error (red-team 2026-06-26: `JSON.parse('null')` succeeds so the catch does
    NOT fire — without an explicit guard the unknown-key check `Object.keys(parsed)` throws an uncaught TypeError;
    `json-parse-catch-misses-valid-scalar`).
- [ ] **Step 2 — Run gate → fail** (no reader exists).
- [ ] **Step 3 — Implement `readManifest(repoDir)`:** read `<repoDir>/.war-provision.json`; absent → `{found:false}`;
  present → `JSON.parse` (catch → `ok:false`). **Then, BEFORE any key inspection, guard non-object JSON**
  (red-team 2026-06-26, `json-parse-catch-misses-valid-scalar`):
  `if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {found:true, ok:false, errors:['manifest must be a JSON object {provision, rationale?}']}`
  — `JSON.parse('null')`/`'[]'`/`'"x"'`/`'42'` all parse without throwing, so without this guard `Object.keys(parsed)`
  crashes. Then run the strict unknown-key check (only `provision`, `rationale` allowed) **and**
  `validateProvision(parsed.provision)` — run the unknown-key check **independently of** (not short-circuited by)
  validateProvision, so a manifest carrying its own `source` key is **always** rejected ("`source` assigned, not
  declared" — proven robust in red-team). Return `{found:true, ok:true, provision, rationale}` or
  `{found:true, ok:false, errors:[…]}`. Reuse `validateProvision`; add the `readFileSync` import.
  `structuralFallback` is **unchanged** (still the tier-4 floor; reader is additive).
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `feat(war): readManifest() reads & validates a committed .war-provision.json (#51)`
- **Closes:** 51.3.

### Task 1.2 — Manifest golden fixture + manifest-beats-CI unit test
**Files:** new `skills/_shared/fixtures/provision/manifest-repo/.war-provision.json` and
`…/manifest-repo/.github/workflows/test.yml` (a *different* install, to prove precedence); modify
`skills/_shared/fixtures/provision/EXPECTED.md`; test `skills/_shared/provision.test.mjs`. **deps:** Task 1.1.

- [ ] **Step 1 — Write failing test.** `readManifest(FIXTURES/'manifest-repo')` → `found:true, ok:true`, `provision`
  deepEquals the manifest's list. Assert on the **unique** manifest command string (avoid the weak-assertion trap,
  `weak-test-assertion-passes-without-feature-being-exercised`). **Precision (red-team 2026-06-26):** `readManifest`
  reads ONLY `.war-provision.json` and never consults `.github/workflows/`, so at the READER level this proves
  "returns the committed manifest list **verbatim**" — it is NOT itself the manifest-beats-CI proof. The competing CI
  workflow in the fixture is the input to the **scout-level** golden (Task 2.1), where the scout PREFERS the `manifest`
  tier over `ci`; keep the CI file for that golden. (Reader test ⇒ verbatim-return; precedence assertion lives at the
  scout.)
- [ ] **Step 2 — Run gate → fail.**
- [ ] **Step 3 — Implement.** Add the fixture files; append a `## Golden — manifest-repo` section to `EXPECTED.md`
  documenting that authority resolves to `manifest` over the present CI workflow.
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `test(war): manifest-repo golden fixture proves manifest beats CI (#51)`
- **Closes:** 51.7 (and concretizes 51.1/51.2).

---

## Phase 2 — Scout tier-1 wiring + `provisionSource:'manifest'`

### Task 2.1 — Scout reads the manifest as authority tier 1
**Files:** modify `agents/war-setup-scout.md`; doc-scan test in a `.test.sh` runner or `provision.test.mjs`.
**deps:** Task 1.1.

- [ ] **Step 1 — Write failing doc-scan test** (the scout is an LLM agent — no `node:test`; gate via emitted-text
  scan, mirroring `frontmatter-tools-negation-check-single-line-only`): assert `war-setup-scout.md` contains a
  `manifest` tier whose heading appears **before** the `ci` heading in the algorithm section, and that the `## Return`
  enum + frontmatter `description` list `manifest`.
- [ ] **Step 2 — Run gate → fail** (no manifest tier today).
- [ ] **Step 3 — Implement.** Insert a tier-1 `manifest` section into "Algorithm — descending authority" between
  `explicit` and `ci` (renumber CI→3 etc., or keep labels + make order explicit in prose): read `.war-provision.json`
  via the module's `readManifest`; `found&&ok` → honor `provision` **verbatim** with `source:'manifest'` + a rationale
  citing the manifest; `found&&!ok` → **stop and report the validation errors** (do not fall through); `!found` →
  continue to CI. Widen `## Return` to `"explicit" | "manifest" | "ci" | "onboarding" | "structural"` and update the
  frontmatter `description`'s authority chain to `explicit → manifest → CI → …`.
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `feat(war): scout reads .war-provision.json as authority tier 1 (above CI), emits source:'manifest' (#51)`
- **Closes:** 51.4.

---

## Phase 3 — Red-team executed-probe path

### Task 3.1 — Red-team honors the manifest (Lead reads it)
**Files:** modify `skills/red-team/SKILL.md` (the `args.provision` assembly step, ~:26); add a provenance comment in
`skills/red-team/assets/workflow-scaffold.js` near the `provisionDirective` (~:46-52). **deps:** Task 1.1.

- [ ] **Step 1 — Write failing tests.** Doc-scan: SKILL.md step assembling `args.provision` instructs the Lead to read
  `.war-provision.json` via the shared `readManifest` and thread the result as `provision`. If a scaffold `*.test.mjs`
  exists: with non-empty `provision`, an `executed` probe's scope-lock emits `PROVISION FIRST` + each command; with
  `provision:[]`, it does **not** (back-compat preserved).
- [ ] **Step 2 — Run gate → fail.**
- [ ] **Step 3 — Implement.** SKILL.md: instruct the red-team **Lead** to read the manifest (shared `readManifest`)
  and thread the list into `args.provision` exactly as `/war` pins it, so manifest-only repos provision identically in
  both skills. Add a scaffold comment documenting the manifest as one valid provenance of `args.provision`;
  **no behavioral scaffold change** (it already runs the list; `provision:[]` stays byte-for-byte back-compat).
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `feat(red-team): Lead reads .war-provision.json and provisions executed probes (#51)`
- **Closes:** 51.5.

---

## Phase 4 — Contract doc + release

### Task 4.1 — Flip the "deferred" note; document the manifest contract
**Files:** modify `skills/war/references/schemas.md` (~:94-96). **deps:** Task 1.1 (contract must match the reader).

- [ ] **Step 1 — Write failing doc-scan test** (in a `.test.sh` or the config test): schemas.md **no longer** contains
  "deferred to issue #51" / "not yet emitted by any scout tier" near ScoutResult, AND **does** contain a
  manifest-contract block naming `.war-provision.json`, `source: "manifest"`, and the authority phrase "above CI" /
  "below explicit". Anchor on the unique manifest-contract string (`prune-assertion-substring-token-drift`).
- [ ] **Step 2 — Run gate → fail.**
- [ ] **Step 3 — Implement.** Rewrite schemas.md §ScoutResult: widen the scout-emitted enum to include `manifest`; add
  a `### Provisioning manifest (.war-provision.json)` subsection with the JSON schema
  (`{provision:string[], rationale?:string}`), the authority tier (1, above CI, below explicit operator `run.provision`),
  the `source` assigned-not-declared rule, and the fail-loud-on-broken contract.
- [ ] **Step 4 — Run gate → pass.**
- [ ] **Step 5 — Commit** — `docs(war): document the .war-provision.json manifest contract; un-defer #51 in schemas.md`
- **Closes:** 51.6.

### Task 4.2 — Version bump v0.7.0 (minor — new feature) + full gate green
**Files:** `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` AND
`plugins[0].version` (both); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.6.9" lineage ok).

- [ ] **Step 1 — Bump all four slots to `0.7.0`** (minor — net-new capability; memory
  `release-bump-slots-canonical-no-badge`, `release-status-is-replace-slot-not-empty-field`). **Roadmap-assigned
  v0.7.0** (plan 5); take the next free minor if the stack order shifts. Status copy: committed
  `.war-provision.json` manifest as scout authority tier 1.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.0 — committed .war-provision.json provisioning manifest (#51)`

---

## Test plan

**Gate** = the self-discovering multi-runner above; run after every task, final green required.

- `provision.test.mjs` (`readManifest`): absent→`{found:false}`; valid→list+rationale; empty list valid; malformed
  JSON→`ok:false`; bad entry→`ok:false` w/ `/provision\[1\].*non-empty/`; unknown key→`ok:false` naming the key.
- `provision.test.mjs` (manifest-repo fixture): returns the **manifest** list, not the competing CI install
  (manifest-beats-CI precedence proof, asserted on the unique manifest command).
- Doc-scan: scout lists `manifest` **before** `ci` + in `## Return` enum + frontmatter; schemas.md drops "deferred to
  #51" and adds the manifest-contract block; red-team SKILL.md reads `.war-provision.json`.
- Scaffold back-compat (if `*.test.mjs` present): non-empty `provision`→`PROVISION FIRST` emitted; `[]`→not emitted.
- `war-config.test.mjs` unchanged and green — `PROVISION_SOURCES`/`each provisionSource enum member is accepted`
  already cover `manifest` as a valid value; this feature makes it *emitted*, not newly *valid*.

## Out of scope
- Manifest *generation* tooling; schema *versioning*/migration; per-phase/per-package manifests; YAML/TOML support.
- Any change to `structuralFallback`'s contents (the floor stays tiny) or to `env-blocked`/`warn` failure semantics
  (a failed manifest *command* routes through the existing run-loop outcomes unchanged).

## Notes / conscious deviations (ratify in `/red-team`)
- **Phase 0 is a real gate:** the format/location/authority are operator-confirmed, but the contract (fail-loud
  strictness, assigned-not-declared `source`, manifest-beats-CI) is stressed in `/red-team` before any code.
- **`source` assigned, not self-declared** — a repo cannot claim a higher authority tier via the manifest.
- **Purely additive:** no `.war-provision.json` → behaves exactly as today (scout → CI; red-team → `provision:[]`).
- **Red-team 2026-06-26 — design RATIFIED (CLEARED-WITH-NOTES). executable-proof built `readManifest` from the plan
  and all 6 cases passed; contract-stress confirmed the three contract pillars hold** (validateProvision-reuse error
  shape, `source`-key rejection = assigned-not-declared, fail-loud expressible at the scout call-site). **One real
  design hole patched:** Task 1.1 Step 3 now guards **non-object JSON** before the unknown-key check (`JSON.parse('null')`
  etc. parse without throwing → `Object.keys` would crash; `json-parse-catch-misses-valid-scalar`), with a matching
  Step-1 test case. **Precision patched:** Task 1.2's reader test proves "returns the manifest list verbatim", not
  "manifest beats CI" — the reader never reads CI; precedence is the **scout** golden (Task 2.1).
- **Version v0.7.0 ratified (red-team adjudication):** the roadmap assigns plan 5 → **v0.7.0** (minor, net-new
  capability) on plan 4's v0.6.9; the spec's v0.6.6 is the superseded standalone baseline (sandbox read v0.6.8 because
  plan-4's v0.6.9 release was still landing). Plan/roadmap authoritative over the spec literal
  (`redteam-adjudication-is-authoritative-version-source`); the "next free minor if the stack order shifts" hedge covers
  a re-ordering.
- **Phase-0 gate criterion (red-team note):** "gate to Phase 1" = red-team verdict **CLEARED or CLEARED-WITH-NOTES**
  (NOT `BLOCKED`/`INCOMPLETE`). This report is CLEARED-WITH-NOTES → Phase 1 is unlocked. **Phase-4 ordering:** T4.2
  (release) lands **after** T4.1 (schemas doc); T4.1 is parallel-eligible with T2.1/T3.1 after T1.1 (all distinct
  files), but the release is last. The `manifest`-tier "stop, do not fall through on `found&&!ok`" is an **agent
  prompt directive** in the scout, not code-enforced (`red-team-env-gap-warn-is-agent-directive-not-code-enforced`) —
  acceptable for a doc-scan-gated LLM tier.

## Open decisions — RESOLVED (grill-with-docs, 2026-06-26)
1. **Location/name → `.war-provision.json` at repo root** (operator-confirmed).
2. **Authority → operator > manifest > CI** (operator-confirmed).
3. **Format → JSON** (forced by no-npm-deps policy); **schema** minimal `{provision, rationale?}`, `source` assigned.
4. **Strictness → fail-loud** on unknown keys / bad JSON / failed validation.
5. **Read-locus → the red-team Lead** threads the manifest into the scaffold's existing `provision` arg (scaffold unchanged).
6. **Version** roadmap-assigned v0.7.0 (minor, plan 5); Release task takes the next free minor if the order shifts.
