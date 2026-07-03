# Catalog-composed `auto` rosters + thorough-by-default run config — Design

**Status:** proposed — operator-ratified 2026-07-03 (six-decision grilling interview; one
recommendation overridden at D4, see Alternatives). Targets **+0.1.0 over the land-time base**
(other specs may land concurrently; the Release task resolves the actual base at land time — the
operator is the version authority, never a stale plan literal; memory
`stacked-release-plan-version-literal-lags-operator-target`).
**Severity: Major (behavioral — run-config defaults flip + audit-seeding redesign + additive
verdict schema).**

**Source:** operator request — make **every** predefined lens available to **any** audit, with the
Lead choosing which seats (1–5, per-seat depth) each task actually convenes; and flip the run-config
defaults to the operator's standing stance (cost is not a constraint; memory
`cost-not-a-concern-max-20x`): worker opus/max, auditor opus/xhigh, refiner+servitor sonnet/default,
`rosterPolicy: auto`.

## Problem — `auto` is a binary the operator didn't ask for, and the defaults encode a caution the operator doesn't hold

The landed variable-audit-roster design (2026-07-02) gave tasks a 1–5 seat roster with per-seat
depth, an 8-lens documented catalog, and an open lens namespace — the Lead can already hand-edit
any task's roster with any lens at the decompose gate. But the **seeding guidance** for
`rosterPolicy: 'auto'` is binary: *"flag high-blast-radius tasks for the full roster, leaf/low-risk
get solo"* ([skills/war/SKILL.md](../../skills/war/SKILL.md) step 2). The config `audit.roster`
(the trio) is the only panel `auto` ever composes toward, so five of the eight catalog lenses
(`security`, `performance`, `simplicity`, `usability`, `test-fidelity`) are reachable only by
unprompted hand-editing — the catalog is a menu nobody is told to order from. Separately,
`DEFAULTS` in [war-config.mjs](../../skills/war/assets/war-config.mjs) carry sonnet workers and
session-effort auditors — the *economy-leaning* end of what the presets offer — while the operator
runs every WAR at or above the `thorough` preset. Defaults should encode the operator's actual
default, and the preset ladder should stay honest around it.

## Decisions

- **D1 — `auto` = Lead-composed from the full catalog; `all`/`solo` unchanged.** Under
  `rosterPolicy: 'auto'`, the Lead composes **each task's roster from the full documented lens
  catalog** ([war-auditor.md](../../agents/war-auditor.md) `## Review through your lens` — the trio
  plus `security`, `performance`, `simplicity`, `usability`, `test-fidelity`, plus mintable domain
  lenses): **1–5 distinct-lens seats, per-seat depth stated explicitly** (`deep` | `neighbors`),
  chosen to fit the task's nature, with a **one-line selection rationale per task** shown in the
  decompose table at the approval gate (the human already approves rosters there; under `--afk` the
  Lead self-adjudicates as everywhere else). The binary full-vs-solo heuristic is deleted from the
  seeding prose. **Menu shape is catalog-as-menu** (operator-ratified): no schema change, no
  config-side lens list — availability is the documented contract of `auto`, which matches the
  landed D6 stance that the catalog is documentation, not validation, and keeps the open namespace.
  `all` (full config roster on every task) and `solo` (one first-lens seat @ neighbors) keep their
  exact current meanings as pins. The pure-docs guidance (propose solo `correctness@neighbors`)
  survives as a composition heuristic inside `auto`. Reserved lenses (`execution-evidence`,
  `pin-validity`) remain never roster-selectable. Omitted depth still normalizes to `deep`
  (safety net only — under `auto` the Lead writes depth explicitly so the decompose table is
  self-documenting).
- **D2 — Default `rosterPolicy` flips `'all'` → `'auto'`.** Lead-composed selection becomes the
  default behavior; `all` remains one `/war-room` answer away for operators who want the same panel
  on every task. `rosterPolicy` stays Lead-side-only (the template consumes rosters, never the
  policy — verified: its only template appearance is the args docstring comment), so D1+D2 are
  prose + one `DEFAULTS` literal.
- **D3 — `thorough` becomes the default profile; `balanced` is redefined as the explicit middle
  tier.** `DEFAULTS.agents` → worker `{ model: 'opus', effort: 'max' }`, auditor
  `{ model: 'opus', effort: 'xhigh' }`, refiner + servitor `{ model: 'sonnet', effort: 'default' }`
  (unchanged); `DEFAULTS.profile` → `'thorough'`. Presets:
  - `thorough` → `{ profile: 'thorough' }` — the **empty partial** (the default IS thorough). Note
    the behavior delta vs the old preset: auditor effort `high` → `xhigh`, and `rosterPolicy`
    `'all'` → inherited `'auto'`.
  - `balanced` → `{ profile: 'balanced', agents: { worker: { model: 'sonnet', effort: 'default' },
    auditor: { model: 'opus', effort: 'default' } }, audit: { rosterPolicy: 'all' } }` — today's
    middle ground, now pinned explicitly since it no longer matches `DEFAULTS`.
  - `economy` → **verbatim unchanged** (it already pins everything it relies on).
  The ladder stays honest: economy < balanced < thorough(=default), and the default profile's name
  tells the truth. Migration note: `/war-room` writes `--fill-defaults` (self-describing) configs,
  so **existing config files keep their pinned behavior**; only hand-written *partial* configs
  inherit the heavier fill — intended.
- **D4 — Lone-seat widening draws from the catalog via auditor nomination; trio union is the
  fallback.** (Operator overrode the keep-as-is recommendation, then ratified the nomination
  mechanism.) The trigger is unchanged — `autoEscalate !== false`, `task.roster.length === 1`,
  seat returns a Critical finding or `confidence: 'low'`; a multi-seat roster is never
  second-guessed. What changes is the widening **source**: the `AuditVerdict` gains an **optional
  `widen: string[]`** field — the lone seat names the catalog lenses its finding calls for ("this
  smells like injection → `security`, `cascading-impact`"). Mechanics (the constraint that forced
  this shape: widening happens inside the deterministic Workflow sandbox — the Lead is outside it
  mid-run, so the picker must be the auditor or a rule):
  - A new pure helper **`resolveWidenSource(nominated, defaultRoster)`** (canonical in
    `war-config.mjs`, mirrored inline in the template) returns `{ source, seats }`. The nomination
    is valid iff it is a non-empty array of **distinct, non-empty strings, none in
    `RESERVED_LENSES`** (`['execution-evidence', 'pin-validity']`, newly exported). Valid →
    `seats = nominated.map(lens => ({ lens, depth: 'deep' }))` (thorough-by-default depth),
    `source: 'nominated'`. Absent, empty, or invalid **in any entry** (strict whole-field — no
    per-entry salvage) → `seats = defaultRoster` (the config `audit.roster`), `source: 'default'`
    — byte-identical to today's tested path.
  - The template's auto-escalate block becomes
    `task.roster = widenRoster(task.roster, resolveWidenSource(seats[0].widen, defaultRoster).seats)`
    and the narrator log **names the source** (`nominated` vs `default fallback`) — never silent.
  - `widenRoster` itself is **untouched** (union keeps the Lead's seat, dedupes, caps at 5). A
    nomination containing the seat's own lens is legal — the union dedupes it.
  - The `AUDIT_VERDICT` schema addition is lenient (`widen: { type: 'array', items: { type:
    'string' } }`, not required); the strict semantics live in `resolveWidenSource`. Any seat may
    emit `widen`; the template **honors it only on the lone-seat trigger** — elsewhere it is
    ignored (harmless). [war-auditor.md](../../agents/war-auditor.md) documents when and how to
    nominate.
- **D5 — `audit.roster` default stays the trio @ `deep`.** Its two remaining jobs: the seed for
  `rosterPolicy: 'all'` and the **fallback** widening pool for D4. "All predefined lenses
  available" is carried entirely by D1's `auto` contract, not by this field — the 1–5 validation,
  `validateRoster`, and its mirror are untouched.
- **D6 — Version is an increment, not a literal.** The Release task bumps **+0.1.0 over whatever
  the four canonical slots hold at land time** (behavioral defaults flip + additive verdict schema
  ⇒ minor bump pre-1.0). Slots: `plugin.json` `version`, `marketplace.json` `metadata.version` +
  `plugins[0].version`, `README.md` `## Status` (replace-in-place). Other run knobs unchanged:
  `roundLimit: 3`, `afk: false`, `ace: false`, `autoEscalate: true`.

## Solution shape

**Task 1 — code + tests, atomic (`requiresTest: true`).** One task, four files (the F07
drift-guards in `war-config.test.mjs` extract and execute the **template's** inline mirror text, so
canonical + mirror must move together; same-file serial tasks rebase-conflict — memory
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`):

- [`skills/war/assets/war-config.mjs`](../../skills/war/assets/war-config.mjs) — `DEFAULTS`
  (agents worker/auditor, `profile: 'thorough'`, `audit.rosterPolicy: 'auto'`); `PRESETS`
  (`thorough` → empty partial, `balanced` → explicit middle, `economy` untouched); export
  `RESERVED_LENSES`; add `resolveWidenSource`; extend the file-header + mirror comments.
  `validate()`, `validateRoster`, `widenRoster`, `spawnOpts`, provision logic, `resolveGate`, CLI:
  **untouched**.
- [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) —
  `AUDIT_VERDICT` gains optional `widen`; the auto-escalate block routes through the inline
  `resolveWidenSource`/`RESERVED_LENSES` mirror and logs the source; the args-docstring comment
  (line ~28) re-words `rosterPolicy` (auto = Lead-composed from catalog) and the widening note;
  the combined mirror-marker comment gains `resolveWidenSource` (marker **count** stays stable —
  one combined line, per the landed D9 discipline).
- [`skills/war/assets/war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) — per
  Test plan below.
- [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs)
  — per Test plan below.

**Task 2 — doc surfaces (`requiresTest: false`), depends on Task 1.** Mirrors the final landed
mechanism; every surface under *Affected files — docs*. No behavioral tests (prose; the full gate
is the regression guard).

**Task 3 — release (`requiresTest: false`), depends on Tasks 1–2.** Resolve the land-time base
from the four slots, bump **+0.1.0**, replace-in-place (D6).

Dogfooding note: under D1, Tasks 2 and 3 are canonical `auto`-composed solo
`correctness@neighbors` candidates — the Lead's rationale line writes itself.

## Affected files

**Code (Task 1):** the four files above.

**Docs (Task 2):**

- [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — decompose **step 2** (delete the binary
  full-vs-solo heuristic; `auto` = compose 1–5 seats from the full catalog, explicit per-seat
  depth, one-line rationale per task; note `auto` is now the default policy; keep the pure-docs
  solo proposal as a heuristic within it); the **Audits** bullet and the **models/effort** bullet
  (~line 101: new defaults — worker opus/`max` (ultrathink), auditor opus/`xhigh`; widening
  re-worded to nominated-or-default).
- [`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md) — step 1 preset descriptions
  re-tiered (**thorough is the default/empty partial and is presented first**; balanced = explicit
  middle with `rosterPolicy: all`; economy unchanged); the `audit.roster`/`rosterPolicy` override
  bullet describes `auto` as "full catalog, Lead's pick, 1–5 seats + rationale"; the solo-pin
  reminder re-worded (*a Critical/low-confidence lone seat still widens — with its own nominated
  lenses or the default roster's — so also set `audit.autoEscalate: false` to pin one auditor*).
  Grep the file for stale default phrasing (memory `wire-key-rename-misses-prose-placeholders`).
- [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — AuditVerdict
  block: add optional `widen` line; `confidence` trailing comment (`low → lone seat union-widens`
  → nominated-or-default); run-config block: agents defaults, `rosterPolicy` default `"auto"` +
  its comment, `audit.roster` comment ("also the union-widening **fallback**"), `autoEscalate`
  comment (nominated-first).
- [`skills/war/references/design.md`](../../skills/war/references/design.md) — Workers bullet
  (line ~12, `(sonnet)` → opus-by-default); decision-table row 8 (widening source); §3 audit
  description (line ~48); the defaults line (~81) **including re-wording the "Target < 3×
  single-agent cost" sentence** — stale under opus/max-by-default (the operator's stance is
  quality-first; keep the target only if re-scoped to the economy/balanced tiers); configurable
  knobs bullet (~108, `rosterPolicy` default).
- [`agents/war-auditor.md`](../../agents/war-auditor.md) — document `widen` nomination: when your
  verdict carries a Critical or `confidence: 'low'`, you MAY nominate catalog lenses
  (`widen: ["security", ...]`) to join a re-audit if you are a lone seat; never reserved lenses;
  the orchestrator honors it only on a lone seat; omitting it falls back to the default roster.
  Return-contract line gains the optional field.
- [`README.md`](../../README.md) — line ~159 ("By default WAR runs sonnet workers and opus
  auditors at the session's effort…" → new defaults + auto-composed seeding); the role table's
  Worker row (`(sonnet)` → `(opus)`); sweep for other default-model mentions at task time.
- [`.tours/architect-war-system.tour`](../../.tours/architect-war-system.tour) — the audit-gating
  step's `autoEscalate` gotcha sentence (union-widens with **nominated catalog lenses, falling
  back to** the default roster's); re-pin any `workflow-template.js` anchors Task 1 shifts
  (memory `tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it`
  — verify the sentence against the landed code, not this spec).
- [`CONTEXT.md`](../../CONTEXT.md) — `### Audit` glossary: `rosterPolicy` entry (~263: `auto`
  re-described, now the default) and the auto-escalation entry (nominated-or-default).

**Release (Task 3):** the four canonical version slots (D6).

**Explicitly untouched:** `validateRoster`/`widenRoster` (semantics and mirrors),
`land-decision.mjs`(+test), `HARD_ESCALATION_REASONS`, the gate-audit pass and its reserved seat,
provision logic, hooks, `agents/war-{worker,refiner,servitor,setup-scout}.md` (model names live in
config, not agent files), `skills/red-team/**` (separate lens namespace), and historical
`docs/{specs,plans,red-team}/*.md` (land-time records — including the 2026-07-02
variable-audit-roster spec this design amends; its doc-contract test on the **historical**
2026-06-18 spec is likewise untouched).

## Test plan

Gate: the resolved self-discovering multi-runner — `node --test 'skills/**/*.test.mjs'` plus every
discovered `*.test.sh`. New assertions follow the unique-token discipline (assert on tokens only
the new code can produce, paired with presence guards — memory
`weak-test-assertion-passes-without-feature-being-exercised`).

**war-config.test.mjs:**

1. **RED→GREEN defaults flip:** `DEFAULTS.profile === 'thorough'`; worker `{opus, max}`; auditor
   `{opus, xhigh}`; refiner/servitor `{sonnet, default}`; `audit.rosterPolicy === 'auto'`;
   `audit.roster` still the trio @ `deep`. (Rewrites the existing DEFAULTS assertions — rename
   test titles in the same commit; memory `relaxed-assertion-test-title-must-update-together`.)
2. **RED→GREEN presets re-tiered:** `presetConfig('thorough')` deep-equals
   `fillDefaults({ profile: 'thorough' })`; `presetConfig('balanced')` → worker sonnet/default,
   auditor opus/default, `rosterPolicy: 'all'`, roster trio; `presetConfig('economy')` assertions
   unchanged-green.
3. **RED→GREEN `resolveWidenSource`:** `['security']` → `source:'nominated'`, seats
   `[{security, deep}]`, order preserved for multi-entry; each invalid shape falls back to
   `source:'default'` + `defaultRoster` verbatim: reserved entry (`execution-evidence`), duplicate
   entries, empty-string entry, non-string entry, `[]`, `undefined`, non-array. A nomination
   containing the caller's own lens → still `nominated`; the subsequent `widenRoster` union
   dedupes (assert the composed roster).
4. **F07 drift-guards:** extract the template's inline `resolveWidenSource` (and `RESERVED_LENSES`)
   mirror via the existing `new Function` pattern; `deepEqual` behavior against the canonical
   exports across case 3's inputs; `LOGIC_MIRROR_REGISTRY` + the marker-count sanity expectation
   updated in the same commit.
5. **Unchanged-behavior guards:** existing `validate()`, `validateRoster`, `widenRoster`, and
   removed/renamed-key courtesy-error tests stay green untouched.

**workflow-template.test.mjs (existing `runPhase`/`seatOf`/`buildSeqImpl` harness):**

6. **RED→GREEN nominated widening:** lone seat returns Critical + `widen: ['security']` → the
   re-audit convenes exactly `[<original lens>, security@deep]` (assert the security seat's
   `auditPrompt` carries `deep`, with a presence guard on the prompt first) and the narrator log
   contains the `nominated` token.
7. **RED→GREEN strict fallback:** lone seat returns Critical + `widen: ['execution-evidence']` →
   the re-audit roster equals today's trio union and the log contains the `default` fallback
   token — never a partial salvage of the invalid nomination.
8. **RED→GREEN non-lone ignore:** a 2-seat roster where one seat emits `widen` + Critical → no
   widening occurs (roster length unchanged going into the fix round).
9. **Re-anchored absent-widen path:** the existing lone-seat trio-union auto-escalate test stays
   green with `widen` absent (it IS the fallback path; re-title if its assertion text names the
   old mechanism).
10. **Schema optionality guard:** a verdict without `widen` still validates against
    `AUDIT_VERDICT` (presence-guard style — the field is optional, not required).

## Alternatives considered

- **Config-side menu field (`audit.catalog`) / roster-as-priority-list.** Rejected at interview —
  duplicates the doc catalog and can go stale against it; the priority-list variant makes `all`
  silently truncate and forks the per-task vs config caps (D1: catalog-as-menu, no schema change).
- **Collapse `rosterPolicy` to `auto` only.** Rejected — `all` ("same panel every task") and
  `solo` (economy) are useful pins, and deleting them breaks existing configs for no mechanism
  saving (D1).
- **`auto` without the per-task rationale line.** Rejected — one prose line per task at a gate the
  human already reads buys selection traceability at zero mechanism cost (D1).
- **Keep trio-union-only widening (the authored recommendation).** Operator overrode: the lone
  seat knows *what kind* of problem it found; a fixed trio wastes that signal (D4).
- **A dedicated selector-agent call for widening.** Rejected — one extra mid-audit round-trip, a
  new prompt+schema to maintain, and a new failure mode, versus a field on a verdict that already
  exists (D4).
- **Full-catalog union on escalation.** Rejected — always convenes a max panel when one added lens
  would do (D4).
- **Lenient per-entry filtering of `widen`.** Rejected — strict whole-field keeps the failure mode
  binary and the fallback byte-identical to the already-tested path (D4).
- **`balanced` absorbs the new defaults / a new above-default tier.** Rejected — a "balanced"
  profile that is objectively maximal is a standing misnomer; inventing a heavier-than-thorough
  tier keeps ladder shape nobody asked for (D3).

## Out of scope / Deferred

- **Gate-audit pass** — its reserved `execution-evidence` seat and `requiresTest:false` auto-skip
  are unchanged.
- **`roundLimit` / `afk` / `ace` / `autoEscalate` defaults** — unchanged (D6).
- **No seeding helper in code** — `auto` composition stays prose-driven at the decompose gate,
  human-approved (unchanged landed stance).
- **`AUDIT_VERDICT` otherwise unchanged** — `widen` is the only addition; no depth field, no
  consumer reshuffle.
- **Red-team lenses** (`skills/red-team/references/lenses.md`) — separate namespace, no
  interaction.
- **Historical specs** — keep their wording as land-time records.

## Decision ↔ surface traceability

| Decision | Landed by |
|---|---|
| D1 `auto` = catalog-composed + rationale | Task 2 (war SKILL.md step 2, war-room, CONTEXT.md, README) |
| D2 default `rosterPolicy: auto` | Task 1 (`DEFAULTS` + test 1), Task 2 (schemas.md, design.md, war-room) |
| D3 thorough-by-default + preset re-tier | Task 1 (`DEFAULTS`/`PRESETS` + tests 1–2), Task 2 (war-room presets, README, design.md defaults line incl. cost-target re-word) |
| D4 auditor-nominated widening | Task 1 (`RESERVED_LENSES` + `resolveWidenSource` + mirror + `AUDIT_VERDICT.widen` + tests 3–4, 6–10), Task 2 (war-auditor.md, schemas.md, tour, design.md row 8/§3) |
| D5 trio stays as seed + fallback | Task 1 (test 1 roster assertion; no code change), Task 2 (schemas.md roster comment) |
| D6 +0.1.0 release | Task 3 |
