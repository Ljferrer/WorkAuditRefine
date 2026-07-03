# Catalog-composed `auto` rosters + auditor-nominated widening — Implementation Plan (RE-SCOPED)

**Source spec:** [docs/specs/2026-07-03-catalog-auto-roster-thorough-defaults.md](../specs/2026-07-03-catalog-auto-roster-thorough-defaults.md)
(operator-ratified 2026-07-03, decisions **D1–D6**). The spec is the decision record; this plan is the
executable decomposition.

## RE-SCOPE NOTE (operator-decided 2026-07-03, mid-campaign)
The config defaults/preset flip (spec **D2/D3/D5**) **already landed on master via PR #472** (`328cfda`:
`DEFAULTS.agents.worker`=opus/max, `auditor`=opus/xhigh, `audit.rosterPolicy`=`auto`; the **model-tiering**
defaults prose across README / war-room SKILL.md / war SKILL.md / schemas.md updated to match — but #472 did
**not** touch the `auto`-*semantics* prose, which still reads as the old binary/blast-radius `auto` +
trio-only widening on every surface). PR #472's tiering choices are **kept as-is** (this plan does NOT
re-flip them, does NOT touch `DEFAULTS`/`PRESETS`). This
plan is re-scoped to only the parts #472 did **not** deliver:
- **D4 — auditor-nominated lone-seat widening** (new code + tests): the genuinely-novel mechanism.
- **D1 — `auto` = Lead-composed catalog selection** (docs-only; `rosterPolicy` is Lead-side): master's
  war SKILL.md still describes the *old* binary `auto` (full-roster-vs-one-seat); redefine it as 1–5
  catalog seats + per-seat depth + one-line rationale.
- **D6 — +0.1.0 release.**
Dropped as already-landed-differently (kept as #472's): D2 default rosterPolicy, D3 thorough-by-default +
preset re-tier, D5 trio-as-DEFAULTS (the trio is already `DEFAULTS.audit.roster` on master).

## Commander's Intent
- **Purpose:** Every predefined audit lens is available to every task, with the Lead composing the seats
  that convene; a triggered lone seat widens by *auditor nomination*, falling back to the trio union.
- **Method:** Add `resolveWidenSource` + `RESERVED_LENSES` to the tested config module (mirror discipline
  intact) and wire the lone-seat auto-escalate block to it; redefine `auto` as Lead-composed catalog
  selection in the docs. No surgery on roster validation; every fallback path stays byte-identical to
  already-tested behavior; docs describe only the landed mechanism.
- **End state:**
  1. `resolveWidenSource(nominated, defaultRoster)` + `RESERVED_LENSES` are exported from
     `war-config.mjs`, mirrored inline in `workflow-template.js`, and F07 drift-guarded (marker count
     stable); the full resolved gate is green.
  2. A triggered lone seat with a valid `widen` nomination re-audits with the nominated seats @ `deep`;
     absent/invalid nominations take the trio-union (`defaultRoster`) path; the narrator log names the
     source (`nominated` vs `default fallback`) either way.
  3. `DEFAULTS`/`PRESETS` are **unchanged from master's #472 state** (no re-flip); `widenRoster`,
     `validateRoster`, `spawnOpts`, gate-audit pass, `MERGE_RESULT`, `HARD_ESCALATION_REASONS` untouched.
  4. The doc surfaces state the `auto` = catalog-composed contract (1–5 seats + depth + rationale) and
     the auditor-nominated-or-default widening; no surface still describes the old binary `auto` or the
     old trio-only autoEscalate.
  5. The four version slots carry +0.1.0 over the land-time base.

## Build order (for /war)
1. **Phase 1 — widening mechanism + doc sweep** (two waves: Task 1 code+tests → Task 2 docs, `deps: [1]`)
2. **Phase 2 — release** (Task 3)

Rationale (code-boundary rule): the doc sweep needs Task 1's mechanism merged to the integration tip (a
wave edge). Task 1 ∩ Task 2 file sets = ∅. `README.md` is shared only across the **phase** edge
(Task 2 prose vs Task 3 `## Status` slot).

## Phase 1 — auditor-nominated widening + doc sweep

### Task 1 — auditor-nominated lone-seat widening (code + tests, atomic)
**Files:** `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`,
`skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`

**`requiresTest`: true** · proposed roster: the trio @ `deep` · deps: none · target repo: superproject.

Atomic (canonical + inline mirror move in one commit — the F07 drift-guards in `war-config.test.mjs`
extract and execute the template's mirror text).

- **`war-config.mjs` (spec D4) — additive only, DO NOT touch `DEFAULTS`/`PRESETS` (kept as #472's):**
  export `RESERVED_LENSES = ['execution-evidence', 'pin-validity']`; add
  `resolveWidenSource(nominated, defaultRoster)` → `{ source: 'nominated'|'default', seats }` — nomination
  valid iff a non-empty array of distinct non-empty strings, none reserved (strict **whole-field**, no
  per-entry salvage); valid → `seats = nominated.map(lens => ({ lens, depth: 'deep' }))`; else
  `seats = defaultRoster` verbatim. Extend the file-header mirror comment to list `resolveWidenSource`.
- **`workflow-template.js` (spec D4):** `AUDIT_VERDICT.properties` gains optional
  `widen: { type: 'array', items: { type: 'string' } }` (NOT added to `required`); the lone-seat block
  (`if (audit.autoEscalate !== false && task.roster.length === 1 …)`, ~:446) becomes
  `task.roster = widenRoster(task.roster, resolveWidenSource(seats[0].widen, defaultRoster).seats)` with
  the narrator log naming the source (`nominated` vs `default fallback`); add an inline
  `resolveWidenSource`/`RESERVED_LENSES` mirror beside the existing mirrors; the **combined**
  mirror-marker comment gains `resolveWidenSource` (marker **count** stays stable); re-word the
  args-docstring `rosterPolicy` note (`auto` = Lead-composed from the catalog) + the widening note.
  `widenRoster`, `validateRoster`, `spawnOpts`, gate-audit pass, `MERGE_RESULT`,
  `HARD_ESCALATION_REASONS`, and all `DEFAULTS`-derived values: **untouched**.
- **Tests (spec Test-plan items 3–10, mapped):** `war-config.test.mjs` — `resolveWidenSource` matrix
  (reserved / duplicate / empty-string / non-string / `[]` / `undefined` / non-array → fallback; valid →
  per-seat `deep`; own-lens dedupe via `widenRoster`); F07 extract-and-compare drift-guard +
  `LOGIC_MIRROR_REGISTRY` + marker-count updated same commit. `workflow-template.test.mjs` — nominated
  widening (per-seat `deep` + `nominated` log token); strict fallback on a reserved entry (`default` log
  token); non-lone seat ignores `widen`; absent-`widen` path re-anchored; `widen` optionality. Unique-token
  discipline; renamed assertions rename their test titles in the same commit. **Do NOT add
  defaults-flip/preset tests — #472 owns those; leave its war-config.test.mjs cases intact.**
- Gate: the resolved self-discovering multi-runner. Suggested commit:
  `feat(war): auditor-nominated lone-seat widening (resolveWidenSource + RESERVED_LENSES)`.

### Task 2 — doc sweep: catalog-`auto` + nominated widening (surfaces #472 left)
**Files:** `skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`,
`skills/war/references/design.md`, `agents/war-auditor.md`, `README.md`,
`.tours/architect-war-system.tour`, `CONTEXT.md`

**`requiresTest`: false** · proposed roster: solo `{ lens: 'correctness', depth: 'neighbors' }` ·
deps: [Task 1] · target repo: superproject.

Re-verify every claim against the **merged Task 1 tip**, not this plan. **#472 already updated the
*model-tiering* defaults prose (opus workers, thorough preset, `rosterPolicy: auto` default) across README,
war-room SKILL.md, war SKILL.md, schemas.md — do NOT re-assert or duplicate that model-tiering wording. But
#472 did NOT fix the `auto`-*semantics* or the widening prose: touch ONLY those `auto`-semantics + widening
clauses, wherever they live — including in README and war-room SKILL.md.**
- **war/SKILL.md:** decompose step 2 — replace the old binary `auto` description (full-roster-vs-one-seat)
  with `auto` = 1–5 catalog seats + explicit per-seat depth + one-line rationale (D1); the pure-docs solo
  proposal survives as a heuristic. The models/effort line (~:101) — re-word the `autoEscalate` widening
  clause to auditor-**nominated**-or-default (currently says trio-union only).
- **war-room/SKILL.md:** the `rosterPolicy: auto` line(s) (~:12–13) — replace the old blast-radius
  `1–3 / 1–5 seats` wording with `auto` = Lead-composed 1–5 catalog seats + per-seat depth + one-line
  rationale (D1); the solo-pin/widening reminder (~:22) — re-word from trio-union-only to auditor-
  **nominated**-or-default. Do **not** touch #472's model-tiering preset prose (opus workers / thorough-first).
- **README.md:** the audit-roster sentence (~:141, `auto-seeds … 1–3 seats by blast radius`) — re-word to
  catalog-composed `auto` + nominated-or-default widening. **Prose only**; do **not** touch `## Status`
  (Task 3 owns it) or #472's worker-tiering sentence.
- **schemas.md:** add the `AuditVerdict.widen` line (optional lens-name array; honored only on a lone
  seat; never reserved).
- **design.md:** the widening rows/§; re-scope the "Target < 3× single-agent cost" sentence (spec-ratified
  collateral).
- **war-auditor.md:** the `widen` nomination contract (array of lens names; never a reserved lens; honored
  only on a lone seat; nomination vs trio-union fallback).
- **.tour (`architect-war-system.tour`):** update the auto-escalate gotcha sentence to nominated widening;
  re-pin any shifted anchors.
- **CONTEXT.md `### Audit` glossary:** `auto` = catalog-composed + auditor-nominated-or-default widening.
  Do **not** touch the `### Authoring pipeline` block (landed with #469).

## Phase 2 — release
### Task 3 — bump the four canonical slots
**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status` slot only).
**`requiresTest`: false** · proposed roster: solo `{ lens: 'correctness', depth: 'neighbors' }` · deps: none.
Resolve the land-time base from the four slots (they must agree; disagreement → escalate, never guess),
bump **+0.1.0**, replace in place. Blurb scoped to what landed: catalog-composed `auto` rosters +
auditor-nominated lone-seat widening.

## Notes / conscious deviations (ratified in /red-team)
- **Re-scoped mid-campaign (operator-decided):** D2/D3/D5 config flip already landed via #472 with
  different tiering; this plan keeps #472's config verbatim and delivers only D4 (widening) + D1 (docs) +
  D6 (release). End-state conditions 1–2 of the original plan (thorough≡DEFAULTS, preset re-tier) are
  intentionally dropped.
- **No version literal is authoritative** — Task 3 resolves the base at land time (D6).

## Open decisions (resolved by /red-team)
- None. The one substantive open item (plan-vs-#472 config conflict) was operator-resolved 2026-07-03:
  keep #472, re-scope to widening-only.
