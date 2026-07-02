# Variable audit roster + gate-audit auto-skip — Design

**Status:** proposed — operator-ratified 2026-07-02 (eight-decision grilling interview). Targets
**+0.1.0 over the land-time base** (base is v0.9.0 as of authoring; other specs are landing
concurrently, so the Release task resolves the actual base at land time — the operator is the version
authority, never a stale plan literal; memory `stacked-release-plan-version-literal-lags-operator-target`).
**Severity: Major (behavioral — audit-stage redesign).**

**Source:** operator request — let the Lead reduce per-task audit severity: variable 1–5 auditor
seats with Lead-chosen lenses, and stop paying 3 deep auditors + a post-merge gate-audit seat for a
README-only task. The operator's proposed "Lead can turn off the audit-gate" was **pushed back on and
replaced** by a derived auto-skip (D7 below) — ratified.

## Problem — seat count, lens choice, and depth are welded together by three overlapping knobs, and the gate-audit runs even when its only HARD path is vacuous

Per-task audit breadth today is controlled by `task.coven` (a per-task boolean), `audit.covenSize`
(a global integer, default 3), and `audit.lenses` / `task.lenses` (a string list). The seat roster is
derived in `covenSeats()` ([war-config.mjs](../../skills/war/assets/war-config.mjs), mirrored inline
in [workflow-template.js](../../skills/war/assets/workflow-template.js) at the `baseLenses` block in
the audit round) by **modulo rotation**: `covenSize: 5` over 3 lenses convenes two duplicate seats —
same lens, same model, same prompt — near-zero marginal signal under a unanimity rule whose entire
value is perspective diversity (`gastown-design-params.md` marks perspective-diversity **[HARD]**).
Depth is derived task-wide from the boolean (`task.coven ? 'deep' : 'neighbors'`), so a Lead cannot
convene, say, `correctness@deep` beside `plan-faithfulness@neighbors`. And the knobs can contradict
each other (`covenSize: 5`, three lenses) with no validation catching it.

Separately, the post-merge gate-audit pass (the `if (mergedTasksForGateAudit.length > 0)` block)
spawns an `execution-evidence` seat for **every** merged task. Its land-holding (HARD) gate is
**severity-keyed code** (`isHardGateEvidence` — any Critical/Major finding → `gate-evidence` →
`held:escalation`); the contract that a finding may go Critical/Major **only** when "a mapped
acceptance-criteria test is provably unrun at the confirmed gate-HEAD sha" is **prompt-enforced**,
not code-enforced (memory `gate-evidence-severity-not-verdict-gates-hard-path`). A
`requiresTest:false` task (pure docs, config, VERIFY no-ops) has **no mapped tests**, so for such a
task the pass is vacuous **by contract** — it can only legitimately return SOFT — yet a seat that
mis-grades a Major would still mechanically hold the land. So the pass on a docs task is pure cost
*plus* a false-positive land-halt risk, and the regression safety for a docs task never came from
this pass anyway: the refiner still runs the full resolved gate at merge, and the pre-merge audit
still reviews the diff.

## Decisions

- **D1 — Collapse to a per-task audit roster.** A task's audit is one field: `task.roster`, an
  **ordered list of 1–5 distinct-lens seats**. Seat count *is* the roster's length — `task.coven`
  (boolean) and `audit.covenSize` are **deleted**, and the modulo rotation dies with them. Rulings
  stay **unanimous on one SHA**, so **even seat counts are legal** — nothing votes by majority, so
  there is no tie to break; the split → one-rebuttal-round → escalate machinery is already
  seat-count-agnostic. Duplicate lenses in one roster are **invalid** (diversity is the value; a
  duplicate seat buys ~nothing).
- **D2 — Depth rides on each seat, heterogeneous within a roster.** A roster entry is
  `{ lens: string, depth?: 'neighbors' | 'deep' }`; omitted depth normalizes to **`deep`**
  (preserving F06's thorough-by-default stance). The task-wide `task.coven ? 'deep' : 'neighbors'`
  derivation is removed; `auditPrompt` already accepts `(task, lens, depth, …)` so only its call
  sites change.
- **D3 — Renames + deletions, no back-compat (operator-ratified YAGNI).** `audit.lenses` →
  **`audit.roster`** (the default roster), `task.lenses`/`task.coven` → **`task.roster`**,
  `audit.covenPolicy` → **`audit.rosterPolicy`** (values unchanged: `all | auto | solo`), exported
  constant `COVEN_POLICIES` → **`ROSTER_POLICIES`**. No string-entry shorthand, no deprecation shims,
  no accepted-but-ignored keys. One courtesy each, not a compat layer: `validate()` emits a crisp
  error when it sees `audit.covenSize`, `audit.lenses`, or `audit.covenPolicy` — *"removed/renamed —
  run `/war-room` to regenerate the config"* (one `errors.push` line per key). Pre-1.0, four GitHub
  stars: a broken config is regenerated, not migrated.
- **D4 — Seeding + the docs-only downgrade are Lead-proposed, human-approved.** `rosterPolicy` seeds
  task rosters at the decompose gate: `all` (default) → the full config `audit.roster` on every task;
  `solo` → `[{ lens: <first config lens>, depth: 'neighbors' }]` (the seeder stamps the downgrade,
  preserving today's economy behavior); `auto` → Lead flags high-blast-radius tasks for the full
  roster, leaf/low-risk get solo. The Lead may hand-edit any task's roster at the gate (that *is* the
  operator's requested control), subject to the same human approval that already gates `requiresTest`.
  **No automatic coupling to `requiresTest`** — "needs no test" ≠ "needs little review" (a one-line
  CI/hook config edit is `requiresTest:false` *and* high blast radius). SKILL.md decompose guidance
  instead: *for pure-docs tasks, propose a solo `{ lens: 'correctness', depth: 'neighbors' }` roster*
  — chosen over `plan-faithfulness` because the dominant recorded docs failure is prose that
  misdescribes the system (memories `release-blurb-overstates-guard-semantics`,
  `mirrored-prose-row-parenthetical-inversion`, `prose-cross-ref-direction-contradicts-physical-layout`).
- **D5 — `autoEscalate` fires only on a lone seat and widens by union.** The boolean
  `audit.autoEscalate` (default `true`) **stays**. It fires **only when `task.roster.length === 1`**
  and the seat returns a Critical finding or `confidence: 'low'` — a multi-seat roster the human
  approved is never second-guessed (unanimity + rebuttal already cover it, and any Critical blocks
  regardless). Widening is **union, not replacement**: keep the existing seat, append the default
  `audit.roster` entries whose lenses are not already present (at their configured depths), cap at 5.
  This fixes a latent bug in passing: today a solo `lenses: ['security']` task escalates into
  `covenSize` seats **all rotating through that one lens** — three identical `security` seats, the
  Lead's chosen lens diluted into redundancy instead of joined by diverse peers. The full widened
  roster then re-audits fresh at the pinned SHA (convergent unanimity unchanged).
- **D6 — Lens catalog: open namespace, documented menu, two reserved lenses.** Validation stays
  "any non-empty distinct strings" — **no enum** — so domain lenses (`healthcare-safety`, …) can be
  minted freely. [war-auditor.md](../../agents/war-auditor.md) `## Review through your lens` grows
  into the documented catalog, each with a one-line focus: `correctness`, `cascading-impact`,
  `plan-faithfulness` (the trio, unchanged), **`security`** (trust boundaries, injection, secrets,
  unsafe ops), **`performance`** (complexity, hot paths, queries, allocation — the strongest
  universal add-on: fully judgeable from a static diff), **`simplicity`** (over-engineering, dead
  flexibility, YAGNI violations), **`usability`** (interface ergonomics — API/CLI shape, error
  messages, naming; explicitly **not** rendered-GUI UX, which a read-only diff auditor cannot judge),
  **`test-fidelity`** (do the tests actually exercise the claimed behavior — assertion strength,
  vacuous passes; deeper than, and not a replacement for, the every-seat anti-cheat duty, which is
  unchanged). `execution-evidence` and `pin-validity` are documented as **reserved** — bound to the
  gate-audit pass and the gitlink-bump pre-flight respectively, never roster-selectable (an
  `execution-evidence` roster seat would review a `gate_output` that does not exist at pre-merge
  audit time). Default `audit.roster` stays the trio at `deep` (F06 unchanged).
- **D7 — The gate-audit pass auto-skips `requiresTest:false` tasks; no operator knob.** Replaces the
  operator's proposed Lead-flippable off-switch (pushback accepted): the skip is **derived**, not
  configured, so it cannot be mis-set on a task that does have mapped tests — the one place the pass
  is not vacuous. Implementation: **both** `mergedTasksForGateAudit.push` sites (the merge-success
  path *and* the no-test-recovery path) are guarded — a `requiresTest === false` task is **not
  pushed** and the skip is **`log()`ged**
  (`gate-audit: skipping <task> (requiresTest:false — no mapped tests, HARD path vacuous)`) — never
  silent (no-silent-caps rule). The no-test-recovery site *should* be unreachable for
  `requiresTest:false` tasks, but only by **prompt contract** (the merge-task dispatch instructs the
  refiner to skip the test-floor check; `MERGE_RESULT`'s status enum still permits `'no-test'` for
  any task — memory `red-team-env-gap-warn-is-agent-directive-not-code-enforced`), so its guard is
  belt-and-suspenders, stated in the guard's comment; `requiresTest` is already in scope at both
  sites, so the second guard is free. Absent-field semantics stay fail-closed: only an **explicit**
  `false` skips; a task missing the field defaults `requiresTest:true` and is gate-audited.
- **D8 — Fail-closed roster enforcement; the template never clamps.** Config-side: `validate()`
  enforces `audit.roster` (array of 1–5; each entry an object with non-empty string `lens`; `depth`
  absent or ∈ {`neighbors`,`deep`}; lens names distinct). Workflow-side: the template asserts every
  `task.roster` at **phase start** (same rules, after normalizing omitted depths to `deep`) and
  **throws loud** on violation — caught by the existing catch → `held:workflow-error`, the
  terminal dead-phase outcome for a broken artifact. No runtime default roster, no truncation to 5:
  a silent fallback would mask a Lead-side seeding bug as a quietly narrower audit.
- **D9 — Mirror discipline: `covenSeats` dies; two small pure functions replace it.**
  `war-config.mjs` (the tested source of truth) gains **`validateRoster(roster)`** (the D8 rules;
  returns errors; also used by `validate()` for `audit.roster`) and **`widenRoster(roster,
  defaultRoster)`** (the D5 union, cap 5) — both **mirrored inline** in `workflow-template.js` (the
  sandbox can't import), replacing the `covenSeats` mirror. The F07 drift-guards in
  `war-config.test.mjs` that extract-and-compare the inline `covenSeats` mirror are rewritten for the
  two new functions; the `LOGIC_MIRROR_REGISTRY` entry and the mirror-marker comment (one combined
  `// Mirror of war-config.mjs spawnOpts/validateRoster/widenRoster …` line, keeping the meta-guard's
  exact marker count stable) are updated **in the same commit** (memory
  `relaxed-assertion-test-title-must-update-together` applies to guards too). Roster *seeding* stays
  prose-driven Lead-side (SKILL.md step 2, as coven seeding is today) — no seeding helper (YAGNI; the
  Lead is an agent following the skill, and the human approves the result).
- **D10 — Version is an increment, not a literal.** The Release task bumps **+0.1.0 over whatever
  the four canonical slots hold at land time** (schema-breaking change ⇒ minor bump pre-1.0; it also
  honestly signals "regenerate your config via `/war-room`"). Slots: `plugin.json` `version`,
  `marketplace.json` `metadata.version` + `plugins[0].version`, `README.md` `## Status`
  (replace-in-place). No version literal anywhere in this spec is authoritative.

## Cross-spec stacking — clean-handoff (2026-07-02)

[war-clean-handoff-design.md](2026-07-02-war-clean-handoff-design.md) (proposed, unimplemented —
zero `disposition` hits in the template as of this writing) plans edits to the **same constructs**:
`auditPrompt`, the gate-audit pass, `war-auditor.md`, and the audit-round dispatch. The two specs are
**orthogonal in meaning** (roster = *who convenes*; clean-handoff = *what they judge against and how
findings route*) but **collide textually**. Declared order: **whichever lands second re-anchors by
named construct, not line numbers** (memory `plan-line-number-refs-stale-use-construct-locator`), and
each takes +0.1.0 over the base it actually lands on. Recommended order: **this spec first** — it is
the smaller schema-level change, and clean-handoff's "full panel re-audit" prose then inherits roster
vocabulary instead of the reverse retrofit. If clean-handoff lands first, this spec's Task 2 doc
sweep additionally re-words any newly-landed coven/panel phrasing it introduced.

## Solution shape

**Task 1 — code + tests, atomic (`requiresTest: true`).** One task, four files:
[war-config.mjs](../../skills/war/assets/war-config.mjs),
[war-config.test.mjs](../../skills/war/assets/war-config.test.mjs),
[workflow-template.js](../../skills/war/assets/workflow-template.js),
[workflow-template.test.mjs](../../skills/war/assets/workflow-template.test.mjs). Atomic because the
F07 drift-guards in `war-config.test.mjs` extract and execute the **template's** inline mirror text —
splitting canonical from mirror across tasks would leave every intermediate state red (and same-file
serial tasks rebase-conflict; memory `war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

- `war-config.mjs`: `DEFAULTS.audit` → `{ roster: [trio @ deep], rosterPolicy: 'all', autoEscalate:
  true }`; `COVEN_POLICIES` → `ROSTER_POLICIES`; `validate()` swaps the covenSize/lenses/covenPolicy
  rules for `validateRoster(au.roster)` + `rosterPolicy` enum + the three removed/renamed-key
  courtesy errors (D3); **delete `covenSeats`**, add `validateRoster` + `widenRoster` (D9); update the
  file-header mirror comment. `PRESETS` need only the `covenPolicy` → `rosterPolicy` key rename
  (`thorough`/`economy` set policy only, no roster). Note: `deepMerge` replaces arrays wholesale, so
  a partial config's `roster` **replaces** the default roster — correct; no per-index merge surprise.
- `workflow-template.js`: args-docstring header (task `roster:[{lens,depth?}]`, audit
  `{ roster, rosterPolicy, autoEscalate }`); **phase-start roster assertion** over `args` tasks
  (normalize omitted depth → `deep`, then the D8 rules; throw loud); audit-round dispatch iterates
  `task.roster` seats directly — `runLens(seat)` threads `seat.lens` **and `seat.depth`** into
  `auditPrompt` (per-seat depth replaces the task-wide `task.coven ? 'deep' : 'neighbors'`); the
  auto-escalate block replaces `task.coven = true` with the `widenRoster` union mirror (D5); the
  dropped-seat retry loop keys on roster entries (lens+depth pairs) instead of lens strings; **both**
  `mergedTasksForGateAudit.push` sites gain the D7 skip + `log()`; the mirror-marker comment is
  updated (D9). `AUDIT_VERDICT` is **unchanged**.
- Tests: see Test plan.

**Task 2 — doc surfaces (`requiresTest: false`), depends on Task 1.** Mirrors the **final** landed
mechanism (same discipline as the gate-audit spec's Task 3): every surface below under *Affected
files — docs*. No behavioral tests (prose; the full gate is the regression guard).

**Task 3 — release (`requiresTest: false`), depends on Tasks 1–2.** Resolve the land-time base from
the four slots, bump **+0.1.0**, replace-in-place (D10).

Dogfooding note: under this very design, Tasks 2 and 3 are the canonical solo-roster
(`correctness@neighbors`) + gate-audit-auto-skip candidates the operator asked for.

## Affected files

**Code (Task 1):**

- [`skills/war/assets/war-config.mjs`](../../skills/war/assets/war-config.mjs) — `DEFAULTS.audit`,
  `PRESETS` (key rename only), `ROSTER_POLICIES`, `validate()` audit block, delete `covenSeats`, add
  `validateRoster`/`widenRoster`, header mirror comment. `spawnOpts`, provision logic, `resolveGate`,
  CLI: untouched.
- [`skills/war/assets/war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) — rewrite
  the audit-validation tests (covenSize/lenses tests → roster tests + removed/renamed-key error
  tests); delete **every `covenSeats`-invoking test — grep, don't count** (the `covenSeats` unit-test
  block *plus* the F06 `covenSeats`-correctness test under the F06 section; memory
  `task-prompt-suite-count-stale-after-stacking`) **and the `covenSeats` import**; delete the five
  F07 `covenSeats`/fallback-lenses drift-guards; **delete the F06 doc-contract tests that pin
  coven-era tokens in live docs** (the `schemas.md documents new covenPolicy default` and war-room
  `full 3-lens`/`full panel` balanced-description assertions) — one-shot F06 migration guards this
  spec supersedes; they must go in **Task 1**, not Task 2 (rewritten-to-roster they'd be red while
  the docs still say coven, and left alone they'd turn Task 2's doc rename red — the only green
  ordering is delete-then-rename); the doc-contract test reading the **historical** 2026-06-18 spec
  survives untouched. Add `validateRoster`/`widenRoster` unit tests + their F07 extract-and-compare
  drift-guards; update `LOGIC_MIRROR_REGISTRY` and the marker-count sanity expectation to the
  post-edit truth.
- [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) — per
  Task 1 above. `HARD_ESCALATION_REASONS`, `land-decision.mjs`, `MERGE_RESULT`, `AUDIT_VERDICT`:
  untouched.
- [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs)
  — rewrite coven/lenses/depth tests to roster semantics; new tests per Test plan.

**Docs (Task 2):**

- [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — decompose step 2 (seed **rosters** from
  `rosterPolicy`; hand-edit at the gate; the D4 pure-docs solo-roster guidance lands **here**, beside
  the `requiresTest` step it parallels); the per-phase **Audits** bullet (1–5 distinct-lens seats,
  per-seat depth, unanimity incl. even counts); the invariants bullet naming `autoEscalate`
  (solo→union widening, not "1→coven"); the models/effort bullet's coven phrasing.
- [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — ledger task fields
  (`roster: [{lens, depth}]` replaces `lenses`/`coven`); run-config audit block (+ the F06 cost note
  re-worded to roster); labels line: `audit:1|coven` → **`audit:<seatCount>`** (Lead-side label; the
  template emits no labels — verified); the AuditVerdict `confidence` field's trailing comment
  (`low → widen to coven` → `low → lone seat union-widens`) — comment-only; the schema shape stays
  unchanged per D1/D5.
- [`skills/war/references/design.md`](../../skills/war/references/design.md) — decision-table rows 8
  (auditor count → roster), 16 (coven lenses → lens catalog + reserved), 18 (run-config knobs);
  §3 audit description; the configurable-knobs bullet; the "Keeps:" bullet's `severity + coven +
  plan-faithfulness` phrase and the non-goals `learned coven-flagging` entry (both re-worded to
  roster — "coven" survives only as prose for a ≥2-seat roster, per the CONTEXT.md glossary).
- [`skills/war/references/gastown-design-params.md`](../../skills/war/references/gastown-design-params.md)
  — Nun-gate seats/tiered-depth/perspective-diversity bullets re-worded to roster + per-seat depth.
- [`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md) — the YAML **frontmatter
  `description`** (`coven policy + size` / "how many auditors WAR convenes" → roster phrasing;
  memory `wire-key-rename-misses-prose-placeholders`: grep the same file for stragglers); preset
  descriptions (incl. their embedded `covenPolicy: all/solo` literals); the overrides list
  (`audit.roster` objects, `rosterPolicy`); the interview beat presents the roster as a seat list
  (lens + depth each); the solo-pin reminder re-worded (*`rosterPolicy:"solo"` alone does not pin
  one auditor — a Critical/low-confidence lone seat still union-widens; also set
  `audit.autoEscalate: false`*).
- [`agents/war-auditor.md`](../../agents/war-auditor.md) — Inputs: lens line gains the open-namespace
  note + reserved pair; depth line notes depth is per-seat. `## Review through your lens` becomes the
  D6 catalog (five new one-line entries beside the trio; no restructure, no new top-level heading).
- [`README.md`](../../README.md) — the Audits bullet (three-seat-panel phrasing → roster); the
  `--config` argument-table row (`coven policy` → `roster policy`); the *Configure a run
  (`/war-room`)* section intro ("decides coven size at the approval gate … fix the coven policy" →
  roster phrasing).
- [`.tours/architect-war-system.tour`](../../.tours/architect-war-system.tour) — the tour steps
  describing the audit mechanism: the auto-escalate step ("widens a lone seat into a full coven" →
  lone-seat union widening) and the default-panel step ("the default coven is three independent
  unanimous seats" → default roster, trio at `deep`); re-pin any `workflow-template.js` step anchors
  Task 1's edits shift.
- [`CONTEXT.md`](../../CONTEXT.md) — **already landed with this spec**: the `### Audit` glossary
  section (roster, seat, lens, depth, coven-as-prose, rosterPolicy, auto-escalation, gate-audit pass).

**Release (Task 3):** the four canonical version slots (D10).

**Explicitly untouched:** `land-decision.mjs`(+test), `provision*`, `assert-*.sh`, hooks,
`agents/war-{worker,refiner,servitor,setup-scout}.md`, `skills/red-team/**` (its
`references/lenses.md` is the **red-team spine's** lens set — a different namespace that happens to
share the word; no interaction), and historical `docs/{specs,plans,red-team}/*.md` — all three keep
their coven-era wording as land-time records (one doc-contract test reads the historical 2026-06-18
spec and therefore survives Task 1's deletions).

## Test plan

Gate: the resolved self-discovering multi-runner —
`node --test 'skills/**/*.test.mjs'` plus every discovered `*.test.sh`. New assertions follow the
unique-token discipline (assert on tokens only the new code can produce, paired with presence guards
— memory `weak-test-assertion-passes-without-feature-being-exercised`).

**war-config.test.mjs:**

1. **RED→GREEN `validateRoster`:** accepts 1–5 distinct entries (depth present or absent); rejects
   `[]`, 6 entries, duplicate lenses, empty/non-string lens, `depth: 'shallow'`, non-object entries.
2. **RED→GREEN `validate()` swap:** `DEFAULTS` still validates; `audit.covenSize` /
   `audit.lenses` / `audit.covenPolicy` presence each yields an error naming the key and
   `/war-room`; `rosterPolicy: 'never'` rejected; `autoEscalate: 'yes'` still rejected (unchanged
   rule).
3. **RED→GREEN `widenRoster`:** solo `[{security,deep}]` + default trio → 4 seats, `security` first,
   no duplicate, appended seats carry default depths; solo `[{correctness,neighbors}]` + trio → 3
   seats (union dedupes, original depth preserved on the kept seat); cap: 1 + a 5-lens default → 5
   seats, never 6.
4. **F07 drift-guards:** extract the template's inline `validateRoster` and `widenRoster` mirrors
   (the existing `new Function` extraction pattern) and `deepEqual` behavior against the canonical
   exports across the same cases; registry + marker-count sanity updated in the same commit.

**workflow-template.test.mjs (existing `runPhase`/`seatOf`/`buildSeqImpl` harness):**

5. **RED→GREEN per-seat depth threading:** a 2-seat roster `[{correctness,deep},
   {plan-faithfulness,neighbors}]` → each seat's `auditPrompt` contains **its own** depth token
   (assert `depth deep` in the correctness prompt AND `depth neighbors` in the plan-faithfulness
   prompt, with `assert.ok` presence guards on both prompts first).
6. **RED→GREEN seat count = roster length:** 1-seat roster spawns exactly 1 audit agent; a 5-seat
   roster spawns 5 (labels `audit:<task>:<lens>` distinct).
7. **RED→GREEN auto-escalate union:** solo seat returns Critical → re-audit spawns the union roster
   (original lens present exactly once, default lenses appended, ≤5); `autoEscalate: false` → no
   widening; a **2-seat** roster returning `confidence:'low'` → no widening (lone-seat guard).
8. **RED→GREEN phase-start assertion:** a task roster with duplicate lenses (and, separately, 6
   entries) → the phase returns `held:workflow-error` (the throw is caught), never a clamped audit.
9. **RED→GREEN gate-audit auto-skip:** a merged `requiresTest:false` task spawns **no**
   `gate-audit:` agent and the narrator log contains the skip line; a sibling `requiresTest:true`
   task in the same phase **is** gate-audited (unchanged); a task with `requiresTest` **absent** is
   gate-audited (fail-closed default).
10. **Unchanged-behavior guards** (re-anchored by real construct names, memory
    `plan-line-number-refs-stale-use-construct-locator`): the existing gate-audit HARD/SOFT
    severity-keying tests, the *allApprove requires the full panel* test, the coven
    quorum-integrity/dropped-seat block, and the block→approve-on-next-round audit-loop test (the
    rebuttal path lives inside it — there is no separately-titled rebuttal test) stay green under
    roster inputs (mechanical rewrite of their task fixtures from `lenses`/`coven` to `roster`).

## Alternatives considered

- **Per-task `covenSize` integer beside a lens list.** Rejected — keeps the modulo-duplication wart
  and two knobs that can contradict; duplicate-lens seats buy ~nothing under unanimity (D1).
- **Depth as a task-wide field.** Rejected — heterogeneous per-seat depth is the operator's explicit
  ask (D2); a task-wide field is the current boolean wearing a new name.
- **Lead-flippable gate-audit off-switch (the original request).** Rejected after pushback,
  operator-ratified — the switch is dead config for docs tasks (HARD path already vacuous) and a
  footgun on code tasks (the one place the pass has teeth). Derived skip instead (D7).
- **Back-compat string-lens shorthand + accepted-but-ignored `covenSize`.** Rejected — operator
  ruled YAGNI pre-1.0; `/war-room` regenerates. Crisp validation errors are the whole migration (D3).
- **Automatic solo-roster on `requiresTest:false`.** Rejected — welds audit breadth to a field that
  means "needs no test", not "low risk"; CI/hook config edits are the counterexample (D4).
- **A closed lens enum in `validate()`.** Rejected — domain lenses must stay mintable; the catalog
  is documentation, not validation (D6).
- **Replacement (not union) widening on auto-escalate.** Rejected — discards the Lead's chosen lens
  exactly when scrutiny should widen around it (D5).

## Out of scope / Deferred

- **`AUDIT_VERDICT` unchanged** — no `depth` field (the Lead reads depth from the roster; no
  consumer needs it structurally — same ponytail rationale as the gate-audit spec's D1).
- **Gate-audit seat is not roster-configurable** — one reserved `execution-evidence` seat, as today.
- **`HARD_ESCALATION_REASONS` / `land-decision.mjs` untouched** — `gate-evidence` hardness and
  membership unchanged; no drift against the per-member `.includes()` assertions.
- **No seeding helper in code** — `rosterPolicy` seeding stays prose-driven at the decompose gate.
- **Red-team lenses** (`skills/red-team/references/lenses.md`) — separate namespace, no interaction.
- **Historical specs** — prior `docs/specs/*.md` keep their coven-era wording as land-time records.

## Decision ↔ surface traceability

| Decision | Landed by |
|---|---|
| D1/D2 roster + per-seat depth | Task 1 (config schema + template dispatch), Task 2 (all doc surfaces) |
| D3 renames/deletions + courtesy errors | Task 1 (`war-config.mjs` + tests), Task 2 (schemas.md, war-room) |
| D4 seeding + docs-only guidance | Task 2 (SKILL.md decompose step 2) |
| D5 lone-seat union widening | Task 1 (template block + `widenRoster` + tests 3/7) |
| D6 lens catalog + reserved | Task 2 (war-auditor.md, design.md row 16) |
| D7 gate-audit auto-skip | Task 1 (capture guard + log + test 9), Task 2 (SKILL.md/README phrasing) |
| D8 fail-closed enforcement | Task 1 (`validateRoster` + phase-start assertion + tests 1/8) |
| D9 mirror discipline | Task 1 (drift-guards + registry + marker, test 4) |
| D10 +0.1.0 release | Task 3 |
