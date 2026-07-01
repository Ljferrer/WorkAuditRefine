# landDecision known-set drift-guard — canonical export + behavioral-and-doc parity Implementation Plan (issue #271)

**Goal:** close the silent `held:X` → `held:workflow-error` trap by binding the 7-member `landDecision` known-set to a single canonical export and a drift-guard that checks it **behaviorally** (the code's emitted values) **and** across **all 4 documentation surfaces**. Add `KNOWN_LAND_DECISIONS` to [`land-decision.mjs`](../../skills/war/assets/land-decision.mjs), the guard suite to the existing [`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs), and correct one imprecise comment in [`workflow-template.js`](../../skills/war/assets/workflow-template.js). **No prose edit to `SKILL.md`/`schemas.md`** — the 4 surfaces already agree at HEAD; the guard *freezes* that agreement.

**Source spec:** [`docs/specs/2026-07-01-landdecision-drift-guard-design.md`](../specs/2026-07-01-landdecision-drift-guard-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source** (this slug = landOrder 8 = **v0.8.8**).
Memory hooks: [[plan-array-literal-lags-canonical-export]] (mirror the `HARD_ESCALATION_REASONS` precedent), [[shared-status-enum-widening-silently-widens-land-path]], [[held-workflow-error-infra-death-prose-mismatch]], [[plan-line-number-refs-stale-use-construct-locator]] (all anchors by construct), [[gate-under-covers-after-cross-branch-merge-new-runner]], [[version-slots-no-cross-slot-consistency-test]] (#release).

**Ratify with `/red-team` before `/war`** — this is a behavioral spec (adds a guard around a control-flow-critical enum). Run `/red-team` on this plan first.

## Coordination

- **Target version:** **v0.8.8** (roadmap landOrder 8, severity MED). Bumps `0.8.7 → 0.8.8`.
- **Integration base:** the **landed tip of Spec 7 (`--ace`, v0.8.7)**. **Standalone fallback:** if run off a different tip (e.g. current master), re-baseline the release to the **next free patch off the live tip** by construct, and drop the prior-tip pin — the version literal is **not** authoritative ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). The two code edits (export + guard + comment) are baseline-independent.
- **File-independence:** this spec's only shared surface with the stack is the four version slots and a **1-line comment** in `workflow-template.js` (disjoint from specs 1/2/4/6/7 regions — rebase-trivial). `land-decision.mjs` / `land-decision.test.mjs` are an isolated lane.
- **Four-slot serial land (replace-in-place, no badge):** `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status`. All four read `0.8.8` after the release task; verify by hand ([[version-slots-no-cross-slot-consistency-test]]).
- **Commit boundaries:** one task per commit. Two tasks: T1 (guard) + T2 (release). One-task-per-phase (T1 and the release touch different files; serial).

## Operator decisions — RESOLVED (bake in exactly)

- **Canonical set = 7 members**, exact literal: `['landed', 'held:escalation', 'held:nothing-merged', 'held:land-failed', 'held:phase-incomplete', 'held:workflow-error', 'held:submodule-pr']`.
- **Behavioral + doc-parity** (not doc-grep only): assert the Workflow's emitted `landDecision` literals (from `workflow-template.js`) **⊆** the export, `decideLand`'s 3 outputs **⊆** the export, and each of the **4** doc surfaces **==** the export.
- **`held:phase-incomplete` is canonical-but-not-emitted** by the Workflow (Lead-classified when `status !== 'completed'`). Assert it ∈ export **and** ∉ the Workflow-emitted set (pins the intentional gap).
- **Extraction robustness:** anchor each doc surface by a **stable phrase**, tokenize backtick `` `landed` ``/`` `held:*` `` within that region, assert **non-empty** + `deepEqual`. Never a lazy `[\s\S]+?` capture. Pin `KNOWN_LAND_DECISIONS.length === 7` + no dupes.
- **Guard lives in `land-decision.test.mjs`** (co-located with `decideLand` + the export), NOT `war-config.test.mjs`.
- **Comment fix:** `workflow-template.js` ~L553 "mirrors land-decision.mjs (decideLand)" → the Workflow emits a **superset** of `decideLand` (6 vs 3). No behavioral change.
- **No `SKILL.md`/`schemas.md` prose edit** — they agree at HEAD; the guard freezes agreement.

---

## Phase 1 — the drift-guard (export + behavioral-and-doc parity + comment fix)

### Task 1 — Add `KNOWN_LAND_DECISIONS` + the drift-guard suite; fix the mirror comment (#271)

**Files:** [`skills/war/assets/land-decision.mjs`](../../skills/war/assets/land-decision.mjs) (add export), [`skills/war/assets/land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs) (add suite), [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) (1-line comment). Anchor by construct — the export beside `HARD_ESCALATION_REASONS`; the Workflow's landDecision block (`let landDecision = …` through the `return {…landDecision}`, ~L553-645 at authoring); the comment line `landDecision mirrors land-decision.mjs (decideLand)`.

**`requiresTest`: true** — the drift-guard suite IS the deliverable.

- [ ] **Step 1 — RED: write the guard suite first.** Add a `test(...)` block in `land-decision.test.mjs` that `import`s `KNOWN_LAND_DECISIONS` from `land-decision.mjs` and asserts `length === 7` + no dupes. Run `node --test --test-name-pattern='KNOWN_LAND_DECISIONS' skills/war/assets/land-decision.test.mjs` → **RED** (export undefined / import yields `undefined` → assertion throws).
- [ ] **Step 2 — GREEN: add the export.** Add `export const KNOWN_LAND_DECISIONS = ['landed','held:escalation','held:nothing-merged','held:land-failed','held:phase-incomplete','held:workflow-error','held:submodule-pr']` beside `HARD_ESCALATION_REASONS`, with the explanatory comment (superset of decideLand's 3 + Workflow's 6; `held:phase-incomplete` Lead-classified). Re-run → count-pin **GREEN**.
- [ ] **Step 3 — add the behavioral ⊆ assertions.** (a) Read `workflow-template.js`; extract the string literals assigned to `landDecision` **within the landDecision block** (anchor on that block, not a whole-file `'held:*'` scrape — comments would match). Assert the extracted set is exactly the 6 emitted values and all ∈ `KNOWN_LAND_DECISIONS`. (b) Assert `decideLand`'s 3 output literals ∈ the export. Run → **GREEN** (both subsets hold at HEAD).
- [ ] **Step 4 — add the 4-surface doc-parity assertions.** For each surface, extract by its stable phrase and `deepEqual` (order-insensitive) to `KNOWN_LAND_DECISIONS`, asserting non-empty first:
  - `SKILL.md` return-contract line — anchor `` `landDecision` ∈ ``.
  - `SKILL.md` §4.2 classifier — anchor `not in the known set`.
  - `schemas.md` enum union — anchor the `landDecision: "landed" | …` line.
  - `schemas.md` per-value bullets — anchor `The full \`landDecision\` enum:` then the `- **\`held:*\`**` bullet headers.
  Run → **GREEN** (all 4 agree at HEAD).
- [ ] **Step 5 — add the non-emitted assertion.** Assert `held:phase-incomplete` ∈ `KNOWN_LAND_DECISIONS` **and** ∉ the Workflow-emitted set from Step 3a.
- [ ] **Step 6 — prove load-bearing (temp-break + revert; the surfaces are green-from-start).** (a) Temporarily append `'held:bogus'` to the export → the 4 doc-parity assertions go **RED** (surfaces lack it); revert. (b) Temporarily add a `landDecision = 'held:bogus'` line in the Workflow block → the behavioral ⊆ assertion goes **RED**; revert. (c) Temporarily delete one value from any one doc surface → that surface's assertion **RED**; revert. Confirms every branch is load-bearing, not vacuous ([[printf-json-escaping-vacuous-test-case]]).
- [ ] **Step 7 — fix the mirror comment.** Reword `workflow-template.js` ~L553 to: the Workflow emits a **superset** of `decideLand` (6 emitted vs decideLand's 3); keep-in-sync note stays. No behavioral change.
- [ ] **Step 8 — full self-discovering gate → green.** Then commit — `feat(war): add KNOWN_LAND_DECISIONS export + behavioral/doc drift-guard; fix superset comment (#271)`.
- **Closes #271.** The known-set is now bound to a canonical export, guarded behaviorally + across all 4 doc surfaces.

---

## Phase 2 — Release v0.8.8

### Task 2 — Bump the four canonical version slots + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json`; `.claude-plugin/marketplace.json` (×2); `README.md` `## Status` (REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]], [[release-status-is-replace-slot-not-empty-field]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.7 → 0.8.8`** (or next free patch off the live tip — standalone fallback). Update README `## Status` "Builds on vX" to the new prior version; status copy: *landDecision known-set drift-guard — canonical `KNOWN_LAND_DECISIONS` export, behavioral ⊆ + 4-surface doc-parity.* Verify all four by hand.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.8 — landDecision known-set drift-guard (#271)`.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- `node --test 'skills/**/*.test.mjs'` — quote the glob (bash 3.2 under-covers unquoted, [[node-breadth-assertion-test-js-overclaims]]). `land-decision.test.mjs` is one of these suites.
- The `for`-loop self-discovers every `*.test.sh` runner — never a hardcoded count ([[task-prompt-suite-count-stale-after-stacking]]). Run **all** post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Coverage

| Issue | Task | Kind | Closure |
|---|---|---|---|
| #271 | Task 1 (Phase 1) | export + drift-guard + comment | canonical `KNOWN_LAND_DECISIONS`; behavioral ⊆ (Workflow emits + decideLand) + 4-surface doc-parity; superset comment fixed; load-bearing proven by temp-break |
| *(release)* | Task 2 (Phase 2) | version bump | four slots `0.8.7 → 0.8.8` (fallback: next free patch off live tip) |

## Deliberate simplifications (ponytail)

- **One impl task, not three.** The export + guard + comment are one TDD-coherent unit (the test imports the export; the comment is the same file family's model). Splitting them adds audit rounds without independent value.
- **No `SKILL.md`/`schemas.md` prose edit.** They agree at HEAD; editing them would be churn. The guard's job is to *freeze* agreement, not restate it.
- **Green-from-start surfaces proven by temp-break.** A true RED-first is impossible when guarding already-correct docs; the temp-break+revert (Step 6) is the repo's standard load-bearing proof.
