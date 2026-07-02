# Variable audit roster + gate-audit auto-skip — Implementation Plan

**Goal:** collapse the three overlapping audit knobs (`task.coven`, `audit.covenSize`, `audit.lenses`) into
one per-task `task.roster` (1–5 distinct-lens seats, per-seat depth), auto-skip the gate-audit pass where its
HARD path is vacuous by contract (`requiresTest:false`), fail-closed everywhere — and release **+0.1.0 over
the land-time base**. Decomposed by **code boundary**: one atomic code task, one doc-mirror task behind a
phase edge, one trailing release task.

**Source spec:** [`docs/specs/2026-07-02-variable-audit-roster-design.md`](../specs/2026-07-02-variable-audit-roster-design.md)
(operator-ratified 2026-07-02, decisions D1–D10). This plan carries the spec's task slices and ten-point test
plan, **plus survey-derived corrections that override the spec where they conflict** — each listed under
Notes/conscious deviations. Second plan in the clean-audit series (nits → **roster** → clean-handoff); see
[`docs/roadmaps/2026-07-02-clean-audit-series.md`](../roadmaps/2026-07-02-clean-audit-series.md).

Memory hooks: [[plan-line-number-refs-stale-use-construct-locator]] (every reference below anchors by
construct; `~:N` is a courtesy hint only), [[relaxed-assertion-test-title-must-update-together]] (marker,
registry, guard titles move in one commit), [[weak-test-assertion-passes-without-feature-being-exercised]]
(unique-token + presence-guard discipline), [[task-prompt-suite-count-stale-after-stacking]] (grep
`covenSeats`, don't count), [[wire-key-rename-misses-prose-placeholders]] (grep each doc file for
stragglers), [[stacked-release-plan-version-literal-lags-operator-target]] +
[[release-bump-slots-canonical-no-badge]] (T3), [[war-branch-base-off-latest-master-not-prior-tip]],
[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]] (why D7's second guard exists).

## Commander's Intent

- **Purpose:** audit breadth is priced per task by the Lead — seat count, lens choice, and depth become one
  legible per-task roster, so a README-only task stops paying for three deep seats plus a vacuous gate-audit
  pass, without weakening any HARD gate.
- **Method:** collapse the three overlapping knobs (`task.coven`, `audit.covenSize`, `audit.lenses`) into
  `task.roster` (1–5 distinct-lens seats, per-seat depth); Lead proposes and the human approves at the
  decompose gate; lone-seat auto-escalation widens by union around the Lead's chosen lens; the gate-audit
  pass auto-skips only where its HARD path is vacuous by contract (`requiresTest:false`); fail-closed
  validation everywhere — no clamps, no silent fallbacks, no back-compat shims.
- **End state:** (1) a task convenes 1–5 distinct-lens seats with per-seat depth; duplicates rejected loud at
  phase start; (2) a docs-only task costs one `neighbors` seat and zero gate-audit, with the skip `log()`ged,
  never silent; (3) a `covenSize`/`lenses`/`covenPolicy` config fails validation with a crisp
  regenerate-via-`/war-room` error; (4) a lone seat hitting Critical or low confidence is joined by diverse
  peers, never diluted into duplicates; (5) unanimity-on-one-SHA, the rebuttal round, and every HARD
  escalation path behave exactly as before for multi-seat rosters.

## Build order (for /war)

- **Topology:** 3 phases, strictly serial (dependency ⇒ phase edge). Phase 1 = T1 code atomic; Phase 2 = T2
  docs (mirrors the *landed* T1 mechanism); Phase 3 = T3 release.
- **Version:** **+0.1.0 over whatever the four canonical slots hold at land time** (schema-breaking pre-1.0).
  No literal in this plan is authoritative — the operator is the version authority.
- **Integration base:** latest `origin/master` at run start (the nit-sweep plan lands first in the series).
- **File map:** T1 → `skills/war/assets/{war-config.mjs, war-config.test.mjs, workflow-template.js,
  workflow-template.test.mjs}`. T2 → doc surfaces only (listed in the task). T3 → the four version slots.
  No same-file overlap across phases except none — fully disjoint.
- **Gate reach:** all edits land in existing `*.test.mjs` files already inside the
  `node --test 'skills/**/*.test.mjs'` glob — the self-discovering gate needs no edits. Run the **full**
  resolved gate (all `.test.mjs` + every discovered `*.test.sh`) before every commit.
- **Run mechanics (important):** this run executes the **pre-T1** (v0.9.0-era) template — task audit
  annotations below use the **old schema** (`lenses`/`coven`), and T2/T3 still get gate-audited during THIS
  run; the D7 auto-skip benefits future runs.
- **Land-time verifier note:** `war-config.test.mjs` can show one spurious failure in a main checkout with
  stale untracked run worktrees under `.claude/war/` (the node-test breadth meta-test's `walkFiles` prune is
  basename-keyed) — an environment artifact; do not misattribute it to this change; re-run from a clean tree.

---

## Phase 1 — roster schema + template dispatch + gate-audit skip (one atomic task)

### Task 1 — code + tests, atomic

**Files:** `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`,
`skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`.

**`requiresTest`: true** · **`coven`: true** (full trio) · deps: none · target repo: superproject.

Atomic because the F07 drift-guards in `war-config.test.mjs` extract and execute the **template's** inline
mirror text — splitting canonical from mirror leaves every intermediate state red, and same-file serial
tasks rebase-conflict ([[war-phase-up-front-provisioning-conflicts-same-file-serial-tasks]]).

- [ ] **Step 1 — `war-config.mjs`.** `DEFAULTS.audit` (currently at ~:28) → `{ roster: [trio @ deep],
  rosterPolicy: 'all', autoEscalate: true }`; `COVEN_POLICIES` (~:12) → `ROSTER_POLICIES` (values unchanged:
  `all | auto | solo`); `validate()`'s audit block (~:90) swaps the covenSize/lenses/covenPolicy rules for
  `validateRoster(au.roster)` + `rosterPolicy` enum + three removed/renamed-key courtesy errors — one
  `errors.push` per legacy key (`covenSize`/`lenses`/`covenPolicy`), each naming the key and *"run
  `/war-room` to regenerate the config"* (D3; legacy keys survive `fillDefaults`, so detect on `c.audit`
  directly). **Delete `covenSeats`** (~:143); add **`validateRoster(roster)`** (D8 rules: array of 1–5;
  each entry an object with non-empty string `lens`; `depth` absent or ∈ {`neighbors`,`deep`}; lenses
  distinct) and **`widenRoster(roster, defaultRoster)`** (D5 union: keep existing seats, append default
  entries whose lenses are absent at their configured depths, cap 5). `PRESETS` (~:39): `covenPolicy` →
  `rosterPolicy` key rename only (verified: no preset sets lenses or covenSize). Update the file-header
  mirror comment. Note: `deepMerge` replaces arrays wholesale (verified), so a partial config's `roster`
  replaces the default — correct, no per-index surprise. `spawnOpts`, provision logic, `resolveGate`, CLI:
  untouched.
- [ ] **Step 2 — `workflow-template.js`.** Args-docstring header (~:15–27): tasks gain
  `roster: [{lens, depth?}]` (replacing `lenses`/`coven`), audit becomes `{ roster, rosterPolicy,
  autoEscalate }` — **`audit.roster` is a NEW args field, not a rename**: the template never receives
  `audit.lenses` today (the fallback is a hardcoded trio literal in `auditRound`'s `baseLenses`, ~:189);
  thread `audit.roster` through the docstring and into the template — it is `widenRoster`'s `defaultRoster`
  argument in the auto-escalate block. **Phase-start roster assertion** over `args` tasks (normalize omitted
  depth → `deep`, then the D8 rules; **throw loud** — caught by the existing catch → `held:workflow-error`;
  no runtime default, no truncation). `auditRound` dispatch iterates `task.roster` seats directly —
  `runLens(seat)` (sole `auditPrompt` call site, ~:195) threads `seat.lens` **and `seat.depth`** into
  `auditPrompt` (which already takes `(task, lens, depth, …)` — only call sites change, D2); the task-wide
  `task.coven ? 'deep' : 'neighbors'` derivation dies. The auto-escalate block (~:332) replaces
  `task.coven = true` with the `widenRoster` union mirror (fires only when `task.roster.length === 1`;
  widened roster convenes on the next while-loop iteration, as today) — `auditRound` has **four call sites**
  (initial ~:319, rebuttal ~:325, ace re-audit ~:386, no-test-recovery re-audit ~:481), each recomputing the
  roster fresh, so the mutation propagates automatically. The dropped-seat retry re-keys on **roster entries
  (lens+depth)** instead of positional lens strings; per-seat labels `audit:<task>:<lens>` become distinct
  (the duplicate-label wart dies with modulo rotation). **Both** `mergedTasksForGateAudit.push` sites (~:523
  no-test-recovery, ~:533 merge-success) gain the D7 guard: a task with **explicit** `requiresTest === false`
  is not pushed and the skip is `log()`ged (`gate-audit: skipping <task> (requiresTest:false — no mapped
  tests, HARD path vacuous)`); absent field stays fail-closed (gate-audited). `const requiresTest` (~:408) is
  in scope at both sites (code-verified); the no-test-recovery guard is belt-and-suspenders (prompt-contract
  reachability), stated in its comment. **Mirror co-location:** define the `validateRoster` + `widenRoster`
  inline mirrors ADJACENTLY under ONE combined marker (`// Mirror of war-config.mjs
  spawnOpts/validateRoster/widenRoster — the Workflow sandbox can't import. Keep in sync.`, replacing the
  current spawnOpts/covenSeats marker at ~:93) even though their call sites are distant — keeps the
  meta-guard marker count stable at 4. `AUDIT_VERDICT`, `MERGE_RESULT`, `HARD_ESCALATION_REASONS`,
  `land-decision.mjs`: untouched.
- [ ] **Step 3 — `war-config.test.mjs`.** Rewrite the audit-validation tests (covenSize/lenses →
  roster + removed/renamed-key error tests), **including the four F06 preset/default `covenPolicy`
  assertions** (fillDefaults default + economy/thorough/balanced presets, ~:514–541) → `rosterPolicy` —
  they invoke `fillDefaults`/`presetConfig`, not `covenSeats`, so the covenSeats sweep misses them; **grep
  `covenPolicy` in this file too**. Delete **every `covenSeats`-invoking test — grep, don't count**
  (the unit block + the F06 correctness test) **and the `covenSeats` import**. Delete **SIX dying
  drift-guards, not five**: the five F07 `covenSeats`/fallback-lenses guards PLUS the older non-F07 guard
  titled `drift-guard: inline fallback lenses in workflow-template.js matches DEFAULTS.audit.lenses (#6 Nit
  1)` (~:303) — it contains no `covenSeats` token, so the spec's grep sweep misses it. **FOUR F06
  doc-contract tests in play, not three — delete three (the two spec-named + the FOURTH README test); the
  historical-spec survivor stays**: the two spec-named (`schemas.md documents new covenPolicy default`,
  war-room `full 3-lens`/`full panel` balanced-description) + a FOURTH,
  `F06 — doc-contract: README states independent, unanimous, multi-lens panel` (~:559, reads live README) —
  same superseded-one-shot-migration-guard rationale; delete in **T1** (delete-then-rename is the only green
  ordering). Add `validateRoster`/`widenRoster` unit tests + their F07 extract-and-compare drift-guards (the
  existing `new Function` extraction pattern); update `LOGIC_MIRROR_REGISTRY` and the marker-count sanity
  expectation to post-edit truth **in the same commit** (registry keys match markers via `includes`; registry
  values must exist as literal `test('` prefixes). While editing the marker-count test: its title/comments
  claim markers at template lines 69/93/367/368 — real lines are 70/93/624/627 — **reword to
  construct-anchored phrasing, no line numbers** (don't-leave-work, operator-ratified).
- [ ] **Step 4 — `workflow-template.test.mjs`.** Rewrite coven/lenses/depth tests to roster semantics; new
  tests per the ten-point plan below (existing `runPhase`/`seatOf`/`buildSeqImpl` harness,
  [[buildseqimpl-harness-for-multi-call-lens-tests]]).
- [ ] **Step 5 — Ten-point test plan** (unique-token + presence-guard discipline throughout):
  1. **RED→GREEN `validateRoster`:** accepts 1–5 distinct entries (depth present or absent); rejects `[]`,
     6 entries, duplicate lenses, empty/non-string lens, `depth: 'shallow'`, non-object entries.
  2. **RED→GREEN `validate()` swap:** `DEFAULTS` still validates; `covenSize`/`lenses`/`covenPolicy`
     presence each errors naming the key + `/war-room`; `rosterPolicy: 'never'` rejected;
     `autoEscalate: 'yes'` still rejected.
  3. **RED→GREEN `widenRoster`:** solo `[{security,deep}]` + trio → 4 seats, `security` first, no
     duplicate, appended seats carry default depths; solo `[{correctness,neighbors}]` + trio → 3 seats
     (union dedupes, kept seat keeps its depth); cap: 1 + a 5-lens default → 5, never 6.
  4. **F07 drift-guards:** extract both inline mirrors, `deepEqual` against canonical exports across the
     same cases; registry + marker-count updated same commit.
  5. **RED→GREEN per-seat depth threading:** 2-seat roster `[{correctness,deep},
     {plan-faithfulness,neighbors}]` → each seat's `auditPrompt` contains **its own** depth token, with
     `assert.ok` presence guards on both prompts first.
  6. **RED→GREEN seat count = roster length:** 1-seat roster spawns exactly 1 audit agent; 5-seat spawns 5
     (labels `audit:<task>:<lens>` distinct).
  7. **RED→GREEN auto-escalate union:** solo Critical → re-audit spawns the union roster (original lens
     once, defaults appended, ≤5); `autoEscalate: false` → no widening; a 2-seat roster at
     `confidence:'low'` → no widening (lone-seat guard).
  8. **RED→GREEN phase-start assertion:** duplicate lenses (and separately 6 entries) →
     `held:workflow-error`, never a clamped audit.
  9. **RED→GREEN gate-audit auto-skip:** merged `requiresTest:false` task spawns no `gate-audit:` agent
     and the narrator log carries the skip line; sibling `requiresTest:true` task IS gate-audited;
     `requiresTest` **absent** → gate-audited (fail-closed).
  10. **Unchanged-behavior guards** (re-anchor by construct name): the gate-audit HARD/SOFT severity-keying
      tests, *allApprove requires the full panel*, the coven quorum-integrity/dropped-seat block, and the
      test titled `the fix-worker (FIX_NEEDED) prompt also drops self-create + WAR_WORKTREE, keeps
      task.worktree (assertion 1)` — its harness comment reads *approves on the rebuttal/next round*; the
      rebuttal path lives inside it, no separately-titled rebuttal test — stay green under roster inputs
      (mechanical fixture rewrite `lenses`/`coven` → `roster`).
- [ ] **Step 6 — Full self-discovering gate → green.** Commit —
  `feat(war): per-task audit roster (1–5 distinct-lens seats, per-seat depth) + gate-audit auto-skip on requiresTest:false`.

---

## Phase 2 — doc surfaces (mirrors the landed mechanism)

### Task 2 — doc sweep

**Files:** `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/references/design.md`,
`skills/war/references/gastown-design-params.md`, `skills/war-room/SKILL.md`, `agents/war-auditor.md`,
`README.md`, `.tours/architect-war-system.tour`.

**`requiresTest`: false** · **`coven`: false** (solo — this task is the dogfooding case D4 describes) ·
deps: Task 1 · target repo: superproject.

No behavioral tests (prose; the full gate is the regression guard). Per file
([[wire-key-rename-misses-prose-placeholders]] — grep each file for coven/lenses/covenSize stragglers):

- [ ] **`skills/war/SKILL.md`** — decompose step 2: seed **rosters** from `rosterPolicy` (`all` → full
  config roster every task; `solo` → `[{first config lens, neighbors}]`; `auto` → Lead flags
  high-blast-radius for full roster), hand-edit at the gate, the D4 pure-docs guidance (*propose a solo
  `{ lens: 'correctness', depth: 'neighbors' }` roster*) beside the `requiresTest` step; note the SECOND
  autoEscalate-coven parenthetical inside decompose step 2 (~:28) — sweep it. Per-phase **Audits** bullet
  (1–5 distinct-lens seats, per-seat depth, unanimity incl. even counts). The invariants `autoEscalate`
  bullet (solo→union widening, not "1→coven") and the models/effort bullet's coven phrasing are **ONE
  bullet** (~:99) — one edit, not two.
- [ ] **`skills/war/references/schemas.md`** — ledger task fields: `roster: [{lens, depth}]` replaces
  `lenses`/`coven`; run-config audit block + F06 cost note re-worded; labels line `audit:1|coven` →
  `audit:<seatCount>` (Lead-side label; the template emits no labels — verified); AuditVerdict `confidence`
  trailing comment `low → widen to coven` → `low → lone seat union-widens` (comment-only; schema shape
  unchanged per D1/D5).
- [ ] **`skills/war/references/design.md`** — decision-table rows 8 (auditor count → roster), 16 (coven
  lenses → lens catalog + reserved), 18 (run-config knobs); §3 audit description; configurable-knobs bullet;
  the "Keeps:" bullet's `severity + coven + plan-faithfulness` phrase and the non-goals `learned
  coven-flagging` entry ("coven" survives only as prose for a ≥2-seat roster, per CONTEXT.md glossary).
- [ ] **`skills/war/references/gastown-design-params.md`** — Nun-gate seats / tiered-depth /
  perspective-diversity bullets → roster + per-seat depth.
- [ ] **`skills/war-room/SKILL.md`** — frontmatter `description` (`coven policy + size` / "how many auditors
  WAR convenes" → roster phrasing); preset descriptions incl. embedded `covenPolicy: all/solo` literals
  (~:12–14); overrides list (~:19: `audit.roster` seat objects, `rosterPolicy`); interview beat presents the
  roster as a seat list (lens + depth each); solo-pin reminder re-worded (*`rosterPolicy:"solo"` alone does
  not pin one auditor — a Critical/low-confidence lone seat still union-widens; also set
  `audit.autoEscalate: false`*).
- [ ] **`agents/war-auditor.md`** (root path — `skills/war/agents/` does not exist) — Inputs lens line gains
  the open-namespace note + the reserved pair (`execution-evidence`, `pin-validity` — gate-audit pass and
  gitlink-bump pre-flight, never roster-selectable); depth line notes per-seat. `## Review through your
  lens` (currently 5 bullets, ~:43) becomes the D6 catalog: the trio unchanged + `security`, `performance`,
  `simplicity`, `usability` (not rendered-GUI UX), `test-fidelity` (deeper than, not replacing, the
  every-seat anti-cheat duty) — one-line focus each; no restructure, no new top-level heading. The two
  non-trio bullets present today are **subsumed, not lost** (red-team clarification): `domain` → the
  Inputs open-namespace note (domain lenses stay mintable, D6); `execution-evidence` → the reserved-pair
  note — their removal from the catalog bullets is deliberate replacement, not an omission.
- [ ] **`README.md`** — Audits bullet (three-seat-panel → roster); `--config` table row (`coven policy` →
  `roster policy`); *Configure a run (`/war-room`)* section intro → roster phrasing. Anchor by construct.
- [ ] **`.tours/architect-war-system.tour`** — **FULL refresh (operator-ratified over the spec's narrower
  wording):** re-pin ALL stale `workflow-template.js` step anchors against the post-T1 file (six of seven
  are already wrong at v0.9.0); **REWRITE step 17** — its "6 vs 7 reasons, deliberate divergence" claim is
  false (both mirrors list 8 identical reasons; no divergence comment exists); plus the two audit-wording
  steps the spec names (auto-escalate → lone-seat union widening; default-panel → default roster, trio at
  `deep`).
- [ ] **`CONTEXT.md`** — **no work**: the `### Audit` glossary section already landed with the spec.
- [ ] **Grep-verify + full gate green.** Commit —
  `docs(war): roster vocabulary across skill, references, war-room, auditor card, README, tour`.

---

## Phase 3 — Release

### Task 3 — bump the four canonical slots

**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status` only).

**`requiresTest`: false** · **`coven`: false** · deps: Tasks 1–2 · target repo: superproject.

- [ ] **Step 1 —** resolve the land-time base from the four slots (`plugin.json` `version`,
  `marketplace.json` `metadata.version` + `plugins[0].version`, README `## Status`), bump **+0.1.0**,
  replace-in-place, no badge. Status copy: *Variable audit roster — per-task 1–5 distinct-lens seats with
  per-seat depth, lone-seat union auto-escalation, gate-audit auto-skip on `requiresTest:false`; legacy
  coven config keys fail validation (regenerate via `/war-room`).* Verify all four by hand
  ([[version-slots-no-cross-slot-consistency-test]]).
- [ ] **Step 2 — Full self-discovering gate → green.** Commit —
  `chore(release): variable audit roster + gate-audit auto-skip (+0.1.0)`.

---

## Decision ↔ task traceability

| Decision | Landed by |
|---|---|
| D1/D2 roster + per-seat depth | T1 (config schema + template dispatch), T2 (all doc surfaces) |
| D3 renames/deletions + courtesy errors | T1 (`war-config.mjs` + tests), T2 (schemas.md, war-room) |
| D4 seeding + docs-only guidance | T2 (SKILL.md decompose step 2) |
| D5 lone-seat union widening | T1 (auto-escalate block + `widenRoster` + tests 3/7) |
| D6 lens catalog + reserved pair | T2 (war-auditor.md, design.md row 16) |
| D7 gate-audit auto-skip | T1 (both push-site guards + log + test 9), T2 (SKILL.md/README phrasing) |
| D8 fail-closed enforcement | T1 (`validateRoster` + phase-start assertion + tests 1/8) |
| D9 mirror discipline | T1 (co-located mirrors, drift-guards + registry + marker, test 4) |
| D10 +0.1.0 release | T3 |

## Notes / conscious deviations (ratify in /red-team)

Survey-derived corrections — each **overrides the spec** where they conflict:

- **`audit.roster` is a NEW args field, not a rename** — the template never receives `audit.lenses` today
  (hardcoded trio literal in `auditRound`; args.audit documented as `{covenSize, covenPolicy, autoEscalate}`).
  T1 threads it through docstring + template as `widenRoster`'s default.
- **SIX dying drift-guards, not five** — the non-F07 `inline fallback lenses … (#6 Nit 1)` guard has no
  `covenSeats` token; the spec's grep sweep misses it. Enumerated explicitly in T1 step 3.
- **FOURTH F06 doc-contract deletion (three total, not two)** — the README `independent, unanimous,
  multi-lens panel` test also reads live docs and is a superseded one-shot migration guard; its survival to
  date is an accident of a disjunction. Deleted in T1 with the two spec-named deletions (the historical-spec
  survivor stays).
- **Mirror co-location** — `validateRoster` + `widenRoster` mirrors defined adjacently under ONE combined
  marker despite distant call sites, keeping the meta-guard marker count at 4.
- **Meta-guard stale line refs** — the marker-count test's title/comments cite lines 69/93/367/368 (real:
  70/93/624/627); reworded to construct-anchored phrasing while T1 already edits that test
  (don't-leave-work, operator-ratified).
- **T2 tour scope is a FULL refresh** (operator-ratified over the spec's narrower wording) — all stale
  anchors re-pinned + step 17 rewritten (its divergence claim is factually false at v0.9.0).
- **T2 SKILL.md precision** — autoEscalate + models/effort coven phrasing are ONE bullet; a second
  autoEscalate parenthetical hides inside decompose step 2 — both swept.
- **Auditor standing file is root `agents/war-auditor.md`** — no `skills/war/agents/` exists.
- **Run mechanics** — this run executes the pre-T1 template: T2/T3 are still gate-audited during THIS run;
  task annotations above use the old (`lenses`/`coven`) schema.
- **Cross-spec stacking** — clean-handoff lands second and re-anchors by construct. Collision inventory it
  must re-anchor against post-roster: `auditRound`, `auditPrompt`, the combined mirror-marker comment, both
  `mergedTasksForGateAudit.push` sites, `agents/war-auditor.md`, `skills/war/SKILL.md`,
  `references/schemas.md`, `references/design.md`.
- **Explicitly untouched:** `land-decision.mjs`(+test), `provision*`, `assert-*.sh`, hooks,
  `agents/war-{worker,refiner,servitor,setup-scout}.md`, `skills/red-team/**` (its `lenses.md` is the
  red-team spine's namespace — zero overlap with WAR lenses, verified), historical
  `docs/{specs,plans,red-team}/*.md` (land-time records; the historical-2026-06-18-spec doc-contract test
  survives T1's deletions).

## Open decisions (resolved by /red-team)

All resolved in the 2026-07-02 grilling interview — recorded so /red-team ratifies rather than re-opens:

- **Gate-audit off-switch → derived skip (D7).** Operator's Lead-flippable switch rejected after pushback,
  ratified: derived from `requiresTest:false` so it cannot be mis-set on a task with mapped tests; explicit
  `false` only, absent field fail-closed.
- **No back-compat (D3).** No shorthand, no shims, no accepted-but-ignored keys — crisp validation errors
  ARE the migration. Pre-1.0, `/war-room` regenerates.
- **No `requiresTest` → roster coupling (D4).** "Needs no test" ≠ "needs little review" (one-line CI/hook
  edits are the counterexample); docs-solo is SKILL.md guidance, human-approved at the gate.
- **Docs-solo lens = `correctness`, not `plan-faithfulness` (D4).** The dominant recorded docs failure is
  prose misdescribing the system ([[release-blurb-overstates-guard-semantics]],
  [[mirrored-prose-row-parenthetical-inversion]], [[prose-cross-ref-direction-contradicts-physical-layout]]).
- **Union widening, not replacement (D5).** Replacement discards the Lead's chosen lens exactly when
  scrutiny should widen around it; fires only on `roster.length === 1` — an approved multi-seat roster is
  never second-guessed.
- **Duplicates invalid; even counts legal (D1).** Rulings are unanimous on one SHA — no majority arithmetic
  anywhere (survey-verified), so no tie exists; duplicate seats buy ~nothing.
- **Omitted depth → `deep` (D2).** Preserves F06 thorough-by-default.
- **No lens enum (D6).** Domain lenses stay mintable; the catalog is documentation, not validation.
  `execution-evidence`/`pin-validity` documented reserved.
- **No clamps, no runtime default roster (D8).** A silent fallback masks a Lead-side seeding bug as a
  quietly narrower audit; broken artifact → `held:workflow-error`.
- **No seeding helper (D9).** Seeding stays prose-driven Lead-side; the human approves the result. YAGNI.
- **Fourth F06 test deletion + tour full refresh + meta-guard reword** — the survey-derived deviations
  above, operator-ratified under "don't leave any work on the table".
- **Version = increment (D10).** +0.1.0 over the land-time base; operator is the version authority.
