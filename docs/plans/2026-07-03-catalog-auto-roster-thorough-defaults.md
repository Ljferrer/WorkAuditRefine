# Catalog-composed `auto` rosters + thorough-by-default run config — Implementation Plan

**Source spec:** [docs/specs/2026-07-03-catalog-auto-roster-thorough-defaults.md](../specs/2026-07-03-catalog-auto-roster-thorough-defaults.md)
(operator-ratified 2026-07-03, decisions **D1–D6**). The spec is the decision record; this plan is the
executable decomposition. On any conflict, the spec's Decisions section wins and the deviation is logged.

## Commander's Intent

*(operator-confirmed verbatim, 2026-07-03 — intent ceiling, plan floor)*

- **Purpose:** Every predefined audit lens is available to every task, with the Lead composing the seats
  that actually convene — and WAR's out-of-box defaults match the operator's real stance: thorough,
  quality-first, cost is not a constraint.
- **Method:** Flip the defaults and re-tier the presets inside the tested config module (mirror discipline
  intact); redefine `auto` as Lead-composed catalog selection — 1–5 seats, explicit per-seat depth,
  one-line rationale per task — at the already-human-approved decompose gate; widen a triggered lone seat
  by auditor nomination, falling back strictly to the existing trio union. Guardrails: no surgery on
  roster validation; every fallback path stays byte-identical to already-tested behavior; docs describe
  only the landed mechanism.
- **End state:**
  1. `--preset thorough` deep-equals filled `DEFAULTS`: worker opus/`max`, auditor opus/`xhigh`,
     refiner+servitor sonnet/`default`, `rosterPolicy: auto`, trio roster @ `deep`.
  2. `balanced` pins worker sonnet/`default` + auditor opus/`default` + `rosterPolicy: all`;
     `economy` byte-unchanged.
  3. A triggered lone seat with a valid `widen` nomination re-audits with the nominated seats @ `deep`;
     absent/invalid nominations take the trio-union path; the log names the source either way.
  4. `resolveWidenSource` + `RESERVED_LENSES` exported, mirrored inline, F07 drift-guarded; the full
     resolved gate is green.
  5. All eight doc surfaces state the new defaults and the `auto` catalog contract; no surface still
     claims sonnet workers or `all`-by-default.
  6. The four version slots carry +0.1.0 over the land-time base.

## Build order (for /war)

1. **Phase 1 — mechanism + doc sweep** (two waves: Task 1 code+tests → Task 2 docs, `deps: [1]`)
2. **Phase 2 — release** (Task 3)

Rationale (code-boundary rule): the doc sweep needs Task 1's code **merged to the integration tip** — a
wave edge, not a phase edge (the Task 2 worker rebases and sees the merged mechanism). Release touches
the shared slot files and lands last as its own trailing phase. `README.md` is the only file shared
across the plan (Task 2 prose vs Task 3 `## Status` slot) — cross-**phase**, serialized by the phase
edge, never a same-phase collision. Task 1 ∩ Task 2 file sets = ∅.

## Phase 1 — defaults flip + nominated widening + doc sweep

### Task 1 — config defaults, presets, auditor-nominated widening (code + tests, atomic)

**Files:** `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`,
`skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`

**`requiresTest`: true** · proposed roster: the trio @ `deep` · deps: none · target repo: superproject.

Atomic (canonical + inline mirror must move in one commit — the F07 drift-guards in
`war-config.test.mjs` extract and execute the **template's** mirror text; same-file serial tasks
rebase-conflict).

- **`war-config.mjs`** (spec D2/D3/D5): `DEFAULTS.agents.worker` → `{ model: 'opus', effort: 'max' }`,
  `DEFAULTS.agents.auditor` → `{ model: 'opus', effort: 'xhigh' }` (refiner/servitor unchanged);
  `DEFAULTS.profile` → `'thorough'`; `DEFAULTS.audit.rosterPolicy` → `'auto'`; `DEFAULTS.audit.roster`
  **unchanged** (trio @ `deep`). `PRESETS`: `thorough` → `{ profile: 'thorough' }` (empty partial);
  `balanced` → `{ profile: 'balanced', agents: { worker: { model: 'sonnet', effort: 'default' },
  auditor: { model: 'opus', effort: 'default' } }, audit: { rosterPolicy: 'all' } }`; `economy`
  **verbatim unchanged**.
- **`war-config.mjs`** (spec D4): export `RESERVED_LENSES = ['execution-evidence', 'pin-validity']`;
  add `resolveWidenSource(nominated, defaultRoster)` → `{ source: 'nominated'|'default', seats }` —
  nomination valid iff non-empty array of distinct non-empty strings, none reserved (strict
  **whole-field**, no per-entry salvage); valid → `seats = nominated.map(lens => ({ lens, depth:
  'deep' }))`; else `seats = defaultRoster` verbatim. Extend the file-header mirror comment.
- **`workflow-template.js`** (spec D4): `AUDIT_VERDICT.properties` gains optional
  `widen: { type: 'array', items: { type: 'string' } }` (NOT added to `required`); the lone-seat
  auto-escalate block (the `audit.autoEscalate !== false && task.roster.length === 1` guard) becomes
  `task.roster = widenRoster(task.roster, resolveWidenSource(seats[0].widen, defaultRoster).seats)`
  with the narrator log naming the source (`nominated` vs `default fallback`); inline
  `resolveWidenSource`/`RESERVED_LENSES` mirror added beside the existing mirrors; the **combined**
  mirror-marker comment gains `resolveWidenSource` (marker **count** stays stable); args-docstring
  comment re-words `rosterPolicy` (`auto` = Lead-composed from the catalog) and the widening note.
  `widenRoster`, `validateRoster`, `spawnOpts`, gate-audit pass, `MERGE_RESULT`,
  `HARD_ESCALATION_REASONS`: **untouched**.
- **Tests — spec Test plan items 1–10, mapped:** `war-config.test.mjs` items 1–5 (defaults flip;
  presets re-tiered; `resolveWidenSource` matrix incl. reserved/duplicate/empty-string/non-string/
  `[]`/`undefined`/non-array fallbacks + own-lens dedupe via `widenRoster`; F07 extract-and-compare
  drift-guard + `LOGIC_MIRROR_REGISTRY` + marker-count updated same commit; unchanged-behavior
  guards). `workflow-template.test.mjs` items 6–10 (nominated widening with per-seat `deep` token +
  `nominated` log token; strict fallback on reserved entry with `default` log token; non-lone ignore;
  absent-widen path re-anchored; `widen` optionality). Unique-token discipline throughout; renamed
  assertions rename their test titles in the same commit.
- Gate: the resolved self-discovering multi-runner (`node --test 'skills/**/*.test.mjs'` + every
  `*.test.sh`). Suggested commit:
  `feat(war): thorough-by-default config, catalog-composed auto rosters, auditor-nominated widening`.

### Task 2 — doc sweep (eight surfaces, mirrors the landed mechanism)

**Files:** `skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`,
`skills/war/references/design.md`, `agents/war-auditor.md`, `README.md`,
`.tours/architect-war-system.tour`, `CONTEXT.md`

**`requiresTest`: false** · proposed roster: solo `{ lens: 'correctness', depth: 'neighbors' }`
(the pure-docs heuristic this very spec ratifies) · deps: [Task 1] · target repo: superproject.

Surface-by-surface slice = the spec's **Affected files — docs** section, verbatim authority; re-verify
every claim against the **merged Task 1 tip**, not this plan (memory
`tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it`). Highlights:
war SKILL.md decompose step 2 (delete binary full-vs-solo; `auto` = 1–5 catalog seats + explicit depth +
one-line rationale; pure-docs proposal survives as a heuristic) and the models/effort bullet; war-room
presets re-tiered (**thorough presented first as the default**), `auto` override prose, solo-pin
reminder re-worded (nominated-or-default); schemas.md AuditVerdict `widen` line + defaults/comments;
design.md rows/§3/defaults line **including re-scoping the "Target < 3× single-agent cost" sentence**;
war-auditor.md `widen` nomination contract (never reserved; honored only on a lone seat); README
defaults phrasing + Worker table row; tour auto-escalate gotcha sentence + re-pin shifted anchors;
CONTEXT.md `### Audit` glossary (`rosterPolicy` default + nominated-or-default widening) — do **not**
touch the `### Authoring pipeline` block (landed separately with the spec's PR).

## Phase 2 — release

### Task 3 — bump the four canonical slots

**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status`
slot **only**).

**`requiresTest`: false** · proposed roster: solo `{ lens: 'correctness', depth: 'neighbors' }` ·
deps: none (the phase edge does the ordering) · target repo: superproject.

Resolve the land-time base from the four slots (`plugin.json` `version`, `marketplace.json`
`metadata.version` + `plugins[0].version`, `README.md` `## Status` replace-in-place — they must agree;
disagreement → escalate, never guess), bump **+0.1.0**, replace in place. Blurb stays scoped to what
landed (memory `release-blurb-overstates-guard-semantics`): thorough-by-default config,
catalog-composed `auto` rosters, auditor-nominated lone-seat widening.

## Decision ↔ task traceability

| Spec decision | Task |
|---|---|
| D1 `auto` = catalog-composed + rationale | Task 2 (prose-only — `rosterPolicy` is Lead-side) |
| D2 default `rosterPolicy: auto` | Task 1 (`DEFAULTS`), Task 2 (docs) |
| D3 thorough-by-default + preset re-tier | Task 1 (`DEFAULTS`/`PRESETS` + tests), Task 2 (docs) |
| D4 auditor-nominated widening | Task 1 (all four files), Task 2 (docs) |
| D5 trio stays as seed + fallback | Task 1 (assertion only), Task 2 (comment re-word) |
| D6 +0.1.0 release | Task 3 |

## Notes / conscious deviations (ratify in /red-team)

- **Two phases, not the spec sketch's three serial tasks** (operator-ratified at conversion): docs ride
  wave 2 of Phase 1 via `deps: [1]` — they need the mechanism merged, not landed.
- **This run executes under the currently-landed defaults** (the new ones land *with* this plan) — the
  proposed per-task rosters above use today's vocabulary and are proposals for the decompose gate.
- **`README.md` cross-phase share** (Task 2 prose vs Task 3 slot) is deliberate and serialized by the
  phase edge.
- **design.md cost-target re-scope** in Task 2 is spec-ratified collateral, not scope creep.
- **No version literal in this plan is authoritative** — Task 3 resolves the base at land time (spec D6);
  the operator is the version authority.

## Open decisions (resolved by /red-team)

- None. All six decisions were operator-ratified at the 2026-07-03 grilling; the only deferred value is
  the land-time version base (D6, by design).
