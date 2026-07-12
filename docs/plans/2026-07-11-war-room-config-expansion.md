# War-room config expansion — opt-in learnings publication + model granularity

Source spec: [docs/specs/2026-07-11-war-room-config-expansion-design.md](../specs/2026-07-11-war-room-config-expansion-design.md)

## Commander's Intent

- **Purpose:** lessons publication becomes a conscious opt-in, and model spend becomes
  controllable where it's actually differentiated — red-team sub-agents, docs-only workers, and
  fix/ace follow-up.
- **Method:** flip `memory.commitLearnings` to `false` across DEFAULTS and all three presets with
  a standing `/war-room` opt-in ask; add optional `agents.redteam` read fail-open by `/red-team`;
  nest `docs` (sonnet default) and `fix` (absent = inherit) tiers under `agents.worker` with a
  mechanical all-`*.md` predicate. Absent new keys reproduce today's behavior byte-for-byte;
  every new/extended inline mirror ships its registry row in the same task; the flip ships an
  OLD-absent sweep plus a permanent doc-claim guard.
- **End state:**
  1. All three presets emit `commitLearnings: false`; `/war-room` asks the opt-in explicitly
     with the value pitch.
  2. `migrate` under an off flag asks: accept → writes `true` via the validator path (creating a
     minimal config if absent) and proceeds; decline → aborts with nothing staged.
  3. `agents.redteam { model, effort }` validates; `/red-team` threads it into every
     probe/confirm spawn; absent block → no model opts (inherit-session, today's behavior).
  4. `agents.worker.docs` defaults sonnet everywhere; all-`*.md` tasks dispatch first-pass
     workers on it; `agents.worker.fix`, when set, drives both fix-round and `--ace` spawns,
     absent inherits worker.
  5. Every hand-mirrored tier default in `workflow-template.js` is bound to its canonical
     `war-config.mjs` source by a registry row.
  6. No surface claims the retired `true` default; a mechanical guard binds the documented
     default to `DEFAULTS.memory.commitLearnings`.
  7. Release lands as its own trailing phase: next free patch above the live base, all four
     slots.

## Build order (for /war)

1. **Phase 1 — engine/config code** (three tasks; one wave edge)
2. **Phase 2 — skill & doc prose** (five parallel, file-disjoint tasks)
3. **Phase 3 — default-flip sweep + doc-claim guard** (one task)
4. **Phase 4 — release** (trailing, shared slot files)

Decomposition note: features (commitLearnings flip / red-team model / worker tiers) collide on
shared files, so tasks are carved **by file family** — each shared file appears in exactly one
task per phase, carrying all three features' changes to that file.

## Phase 1 — engine/config code

### Task 1.1: war-config schema — flip + redteam + worker tiers

- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice:
  - **Flip**: `DEFAULTS.memory.commitLearnings` → `false`; delete the economy preset's
    now-redundant `memory` pin; update the file-local comment block describing the memory
    defaults (it currently asserts the old behavior — comments lag rewritten code; grep the old
    term in the same diff).
  - **Red-team knob**: optional `agents.redteam` block — when present, `model` must be in the
    existing model enum and `effort` in the existing effort enum; unknown sub-keys rejected with
    actionable errors (the `memory.*` unknown-key precedent). It is **not** a phase role: it
    joins validation only — `ROLES` and the enumerated (preset, role, model, effort) matrix stay
    four roles (assert that in the test). Presets never set it.
  - **Worker tiers**: `agents.worker.docs` present in `DEFAULTS` as
    `{ model: 'sonnet', effort: 'default' }` (all presets inherit); `agents.worker.fix` absent by
    default, validated when present. Validation mirrors the parent role enums; unknown sub-keys
    rejected. Add a sibling canonical export enumerating the effective worker tiers per preset
    (the doc-honesty lens consults it, mirroring the existing matrix pattern).
  - **Tests** (mapped: `war-config.test.mjs`): every new default, every preset emission
    (`commitLearnings: false` on all three), validator acceptance/rejection for `redteam` and
    the worker sub-blocks, matrix-stays-four-roles, tier-export coverage. Delete-feature check:
    each new assertion fails when its feature is mentally removed.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: workflow-template — tier-aware worker dispatch

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice:
  - Extend the per-role spawn-opts helper (the `ROLE_MODEL` neighborhood — locate by construct,
    not line): worker spawns become tier-aware. First-pass worker dispatch uses the `docs` tier
    iff **every** entry in the task's `Files:` list matches `*.md`; fix-round and `--ace` fix
    dispatches use the `fix` tier when configured, else the base worker config. Non-worker roles
    unchanged.
  - The tier defaults hand-mirrored into the template (the sandbox cannot import) extend the
    existing inline mirror; **the same task appends the mirror-registry row(s)** in
    `workflow-template.test.mjs` binding the inline tier defaults to the canonical
    `war-config.mjs` export (the registry test is the arbiter; never restate the literal here).
  - **Tests** (mapped: `workflow-template.test.mjs`): all-`*.md` task → docs-tier spawn opts;
    mixed-files task → base worker opts; `fix` set → fix-round AND ace dispatches carry it;
    `fix` absent → both carry base worker opts; registry row(s) fail on either-side drift.
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.3: red-team scaffold — thread model/effort args

- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: the scaffold accepts optional model/effort via its `args` and applies them to
  **every** `agent()` call (probes and adversarial confirms). Absent args → the `agent()` calls
  carry **no** model/effort opts — today's inherit-session behavior byte-for-byte (assert the
  spawned-opts shape in both branches in the mapped test).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — skill & doc prose

### Task 2.1: war-room SKILL.md — ask, redteam dimension, tier interview

- Files: `skills/war-room/SKILL.md`
- Plan slice: all three features' war-room prose in one task (single owner of the file):
  - Invert the commitLearnings **announcement** into a **standing opt-in ask** (its own flow
    step, not override-only): present the value pitch ("lessons travel with the repo,
    human-reviewed like code"), record the answer; remove the old default-`true` claim.
  - Add `agents.redteam` as a nameable override dimension (same model/effort vocabulary; note
    it is read fail-open by `/red-team`, absent = inherit session).
  - Add the worker tier interview: `agents.worker.docs` (default sonnet; mechanical predicate —
    a task is docs-tier iff every `Files:` entry matches `*.md`; evaluated against the plan's
    file list, not the diff) and `agents.worker.fix` (absent = inherit; name the sonnet→opus
    example; covers fix rounds **and** `--ace`).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.2: lessons-learned — migrate ask/abort flow

- Files: `skills/lessons-learned/SKILL.md`, `skills/lessons-learned/lessons-learned-doc-contract.test.mjs`
- Plan slice: `migrate` gains a pre-flight: resolve the effective flag from
  `.claude/war/config.json` (absent file = defaults = `false`). If `false` → ask. Accept →
  write `memory.commitLearnings: true` through the `war-config.mjs` validator path
  (`--stdin --fill-defaults`, temp-file + move — the never-truncate discipline), creating a
  minimal config when the file is absent, then proceed. Decline → abort: "nothing migrated —
  re-run after opting in"; nothing staged. `evict`'s existing flip-back ask is unchanged, but
  reword any clause that *justifies* it by the old default. Extend the doc-contract test where
  it locks affected clauses (mapped test).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.3: red-team SKILL.md — fail-open config read

- Files: `skills/red-team/SKILL.md`
- Plan slice: document the config read at the Workflow-launch step: resolve
  `.claude/war/config.json` fail-open — missing file, invalid file, or absent `agents.redteam`
  block → no model opts (today's behavior); present → pass model/effort into the scaffold via
  `args`. Must tolerate a repo with no `.claude/war/` at all (foreign-repo verification via
  `--repo` is the common case).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.4: schemas.md — run-config field reference

- Files: `skills/war/references/schemas.md`
- Plan slice: update the run-config § — the `memory` row's `commitLearnings` clause states the
  new default and drops the economy-pins-false clause (now redundant); add rows for
  `agents.redteam` (optional; absent = red-team inherits session) and `agents.worker.docs` /
  `agents.worker.fix` (dotted paths; docs default sonnet; fix absent = inherit worker; covers
  fix rounds and ace).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2.5: README + CLAUDE.md — retire the old default's claims

- Files: `README.md`, `CLAUDE.md`
- Plan slice: rewrite every commitLearnings default claim — anchor by section, not line:
  - README intro bullet (**"Runs compound."**): already says "by default the store stays local;
    turn on `commitLearnings`" — after the flip this is finally true; keep, tighten if needed.
  - README **"What 'today's defaults' actually are"**: the defaults sentence currently asserts
    `commitLearnings: true` and economy pinning `false` — restate as `false` everywhere,
    opt-in via `/war-room`.
  - README **"Two roots, and why lessons commit by default"**: the section **heading itself**
    asserts the old value — retitle (e.g. "Two roots, and when lessons commit") and rewrite the
    defaults-to-true rationale into the opt-in pitch.
  - README `/lessons-learned` **evict** bullet: drop the "because `commitLearnings` defaults to
    `true`" justification clause.
  - CLAUDE.md memory section: the routing sentence's "(default true)" and the in-a-run bullet —
    restate the new default.
  Do **not** touch the README `## Status` line (release owns it, Phase 4).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — default-flip sweep + doc-claim guard

### Task 3.1: OLD-absent sweep + permanent guard

- Files: `skills/war/assets/war-config.test.mjs`, `README.md`, `CLAUDE.md`,
  `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`,
  `skills/lessons-learned/SKILL.md`
- Plan slice: rule-6 closure over the landed Phase-1/2 work.
  - **Sweep**: grep the retired claim across every enumerated surface (`commitLearnings`
    default-`true` phrasings, "economy pins false", "defaults toward sharing" rationale). Grep
    is a floor: hand-scan the same-scope prose for same-meaning siblings (headings, rationale
    clauses, and comment blocks that encode the old behavior without the token) and fix each
    straggler as a survey-derived correction. A surface with zero stragglers is a **verified
    no-op, which is success** — the file list enumerates the audit scope, not promised diffs.
  - **Permanent guard** (mapped: `war-config.test.mjs`): a doc-claim drift guard binding the
    documented default to `DEFAULTS.memory.commitLearnings` by extraction + equality — read the
    schemas.md `memory` row's stated default and assert it equals the canonical value, and
    assert the retired-value claim matches zero surfaces in the enumerated doc set. Fails when
    either side drifts; tolerant of sentence case (use case-insensitive, mid-sentence anchors).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — release

### Task 4.1: version bump

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump the **next free patch above the live base at land time** across all four
  slots together — `plugin.json` `version`, `marketplace.json` `metadata.version` **and**
  `plugins[0].version`, and the `README.md` `## Status` line (replace-in-place, no badge).
  Version literals anywhere in this plan are non-authoritative; resolve from the slots at land
  time (stacked predecessors may have consumed patches).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- **Live red-team model threading** (spec §10.3's runtime half): a real `/red-team` run with
  `agents.redteam` set observably spawns probes on the configured model
  · why deferred: spawn opts on live Workflow agents are only observable in a real run — the
  mapped scaffold test proves the opts shape, not the harness's model selection
  · runner: the first `/red-team` run after merge in a repo with the block set; operator checks
  the run header/agent models.
- **Live docs-tier + fix-bump dispatch** (spec §10.4's runtime half): a real `/war` phase
  dispatches an all-`*.md` task's worker on the docs tier and a fix round on the fix tier
  · why deferred: same live-spawn observability limit; template tests prove opts derivation only
  · runner: the first `/war` run after merge on a plan containing a pure-doc task.
- **Interactive migrate ask** (spec §10.2's interactive half): the accept/decline flow in a real
  session · why deferred: operator interaction cannot run pre-merge · runner: the first
  `/lessons-learned migrate` invocation post-merge.

## Notes / conscious deviations

- **Rule 6 is satisfied by Phase 3, not by a single flip task**: the OLD-value surfaces are
  owned by five parallel Phase-2 tasks, so one task cannot enumerate them without merging the
  whole phase. The dedicated sweep + the permanent extraction-equality guard close the gap the
  rule exists for (a stale surface sailing through green).
- Phase-3's file list is an **audit scope** — surfaces already clean after Phase 2 are verified
  no-ops, not missing work.
- `agents.redteam` deliberately joins the validator but not `ROLES`/the preset matrix — it is
  consumed by `/red-team`, not the per-phase spawn path; the matrix-stays-four-roles assertion
  in Task 1.1 locks that boundary.
- README/`CLAUDE.md` and `war-config.test.mjs` are each touched in two phases (2→3, 1→3) —
  cross-phase landed-first edges, no same-phase collisions.

## Open decisions

None — the design tree was resolved in the 2026-07-11 grill session (see the source spec). The
spec's §7 ADR candidate (opt-in publication) may be authored at implementation time; it does not
gate this plan.
