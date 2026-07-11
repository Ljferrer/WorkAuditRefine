# War-room config expansion — opt-in learnings publication + model granularity

## 1. Context — the gap / problem

Three configuration gaps, all surfacing through `/war-room` and `war-config.mjs`, resolved
together because they edit the same files:

1. **Repo-root learnings publication is opt-out.** `memory.commitLearnings` defaults `true`, so a
   user who never visits `/war-room` publishes distilled lessons into `docs/learnings/` without an
   explicit choice. Publication should be a conscious opt-in.
2. **Nothing decides the `/red-team` sub-agent model.** The verification Workflow's `agent()` calls
   carry no `model` opt — every probe and confirm inherits the session model, and no config
   surface can change that.
3. **Worker model selection is one-size-per-run.** `agents.worker.{model,effort}` drives every
   worker — a pure documentation task burns the same opus/fable spawn as a core engine task, and
   fix-round/`--ace` follow-up work cannot run *stronger* than the first pass (the economy user's
   "sonnet first pass, opus fixer" is inexpressible).

Ratified in the grill session of 2026-07-11.

## 2. Pivotal constraints

- **Local-root memory writes stay always-on.** Only repo publication flips; the servitor keeps
  writing local lessons every phase and prefetch keeps retrieving them.
- **Normal-complexity workers keep today's model/effort in all three presets** — the docs tier is
  additive, never a repricing of existing behavior.
- **Absent config = today's behavior** for red-team (inherit session) and fix work (inherit
  worker) — byte-for-byte back-compat when the new keys are absent.
- The validator rejects unknown keys (existing `memory.*` precedent) — every new key is a schema
  change in `war-config.mjs`, its single source of truth.
- The workflow-template hand-mirrors config defaults (the sandbox cannot import) — any new
  mirrored default needs its mirror-registry row in the same task (ADR 0025 discipline; red-team's
  `unguarded-new-mirror` probe enforces it).
- A default flip must prove the OLD value **absent** across every enumerated doc surface, not just
  the new value present (red-team's `default-flip-old-absent` probe; lesson:
  `doc-truth-sweep-must-check-presets-not-just-defaults`).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Which root goes opt-in | **Repo publication only**: flip `memory.commitLearnings` default `true` → `false`. Local-root writes untouched. |
| 2 | Preset semantics after the flip | **All three presets inherit `false`** (economy's now-redundant pin is removed); `/war-room` gains a **standing interview step** that offers the opt-in with the value pitch ("lessons travel with the repo, human-reviewed like code"). Opt-in is a conscious per-config choice regardless of preset. |
| 3 | `/lessons-learned migrate` under an off flag | **Ask; accept → set in-place; decline → abort.** On accept, migrate writes `commitLearnings: true` itself through the `war-config.mjs` validator path (creating a minimal `--fill-defaults` config if the file is absent) and proceeds. On decline: "nothing migrated — re-run after opting in." No half-adopted state. |
| 4 | Red-team model knob | **`agents.redteam: { model, effort }`** in the run config, interviewed by `/war-room` like other roles. `/red-team` reads it **fail-open**: absent → today's inherit-session behavior. One setting for all red-team sub-agents (probes + confirms). |
| 5 | Docs-only classification | **Mechanical, Lead-computed at dispatch**: a task is docs-tier iff **every** `Files:` entry matches `*.md`. Mixed tasks stay normal tier. No plan-schema change. (Accepted: load-bearing prose like SKILL.md rides the cheap tier; auditors still review at full strength.) |
| 6 | Config shape for worker tiers | **Nested under worker**: `agents.worker` gains optional sub-blocks `docs: { model, effort }` and `fix: { model, effort }`. One role, three tiers; the 4-role preset matrix stays intact. The `fix` block covers **both** audit-round fix-workers and `--ace` pre-merge fix work. |
| 7 | Tier preset defaults | **`docs` = sonnet/default-effort in DEFAULTS, all presets inherit** (yes: thorough's fable workers drop to sonnet on pure-doc tasks). **`fix` ships absent everywhere** — pure opt-in at `/war-room`, whose interview names the bump with the sonnet→opus example. |

## 4. Mechanics

**A. commitLearnings flip** (`war-config.mjs` + `/war-room` + `/lessons-learned`):

- `DEFAULTS.memory.commitLearnings` → `false`; delete the economy preset's redundant pin.
- `/war-room` flow: the current publication *announcement* becomes an explicit **ask** (a standing
  step, not override-only): present the value pitch, record the answer. The fail-closed redaction
  lint guards publication either way (unchanged).
- `/lessons-learned migrate`: before any staging work, resolve the effective flag from
  `.claude/war/config.json` (absent file = defaults = `false`). If `false` → ask (decision 3).
  The accept-path write goes through the validator (`--stdin --fill-defaults`, temp-file + move —
  the same never-truncate discipline `/war-room` uses). `evict`'s existing "also set
  `commitLearnings: false`?" ask is unchanged.

**B. Red-team model** (`war-config.mjs` + `/war-room` + `/red-team` + its workflow scaffold):

- Schema: optional `agents.redteam` block; when present, `model` ∈ the existing model enum,
  `effort` ∈ the existing effort enum. It is **not** a phase role: it joins the validator, not
  `ROLES`/the per-phase spawn path — the preset × role matrix is unchanged. Presets do not set it.
- `/red-team` Step 3 (Workflow launch): read the run config fail-open (missing file, invalid file,
  or absent block → no model opts, today's behavior). When present, pass model/effort through
  `args` into the scaffold, which applies them to every `agent()` call (probes, confirms).
- `/war-room` interview: `agents.redteam` becomes a nameable dimension with the same
  model/effort vocabulary as other roles.

**C. Worker tiers** (`war-config.mjs` + `workflow-template.js` + `/war-room`):

- Schema: `agents.worker.docs` (present in DEFAULTS: `{ model: 'sonnet', effort: 'default' }`)
  and `agents.worker.fix` (absent by default). Validation mirrors the parent role's enums;
  unknown sub-keys rejected.
- Dispatch: the Workflow's per-role spawn-opts helper gains tier awareness for the worker role
  only — first-pass worker spawns use `docs` when the task's `Files:` list is all-`*.md`
  (decision 5), fix-round and `--ace` spawns use `fix` when set, else the base worker config.
  The tier predicate lives beside the spawn-opts helper; the hand-mirrored defaults inside
  `workflow-template.js` gain a mirror-registry row in `workflow-template.test.mjs` in the same
  task (Pivotal constraint).
- The enumerated (preset, role, model, effort) matrix export stays 4 roles; a sibling export
  enumerates the worker tiers per preset so the doc-honesty audit lens has a canonical source for
  tier facts too (same pattern, new rows).

## 5. Surface changes

- `skills/war/assets/war-config.mjs` — DEFAULTS, presets, validator (new keys), tier matrix
  export; `skills/war/assets/war-config.test.mjs` — coverage for every new key/default.
- `skills/war/assets/workflow-template.js` — tier-aware worker spawn opts + docs-tier predicate;
  `skills/war/assets/workflow-template.test.mjs` — mirror-registry row(s) + tier dispatch tests.
- `skills/war-room/SKILL.md` — commitLearnings ask (invert the announcement), `agents.redteam`
  dimension, worker `docs`/`fix` tier interview prose.
- `skills/red-team/SKILL.md` + `skills/red-team/assets/workflow-scaffold.js` — fail-open config
  read; thread model/effort args into `agent()` calls.
- `skills/lessons-learned/SKILL.md` — migrate's flag check + ask/abort flow.
- `skills/war/references/schemas.md` — run-config field reference rows for every new key.
- Doc surfaces for the default flip (OLD-value-absent enumeration): `README.md`
  (`/lessons-learned` section and any commitLearnings mention), `CLAUDE.md` memory section,
  `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`, `war-config.mjs` comments.
- Release: version bump rides its own trailing phase — next free patch above the live base across
  all four slots.

## 6. New domain terms (CONTEXT.md)

- **Docs tier** — the worker spawn tier for a task whose `Files:` list is entirely `*.md`;
  mechanically classified at dispatch, configured at `agents.worker.docs`, default sonnet.
- **Fix bump** — the optional stronger model/effort (`agents.worker.fix`) applied to fix-round and
  `--ace` worker spawns; absent = fix work inherits the base worker config.

## 7. Recommended ADRs

One candidate: **learnings publication is opt-in** (the commitLearnings flip). It meets the bar
weakly — reversible in one line, but surprising to a future reader who finds `docs/learnings/`
thriving in some repos and absent in others, and it *is* a real trade-off (compounding team memory
vs. publication-by-surprise). Recommend a short ADR; the model-granularity work needs none.

## 8. Open risks / implementation notes

- The war-room prose currently *asserts* the old default ("default `true`") — the flip's gate
  must grep the OLD claim to absence on every surface in §5, not merely add the new one.
- `agents.redteam` must not collide with the `ROLES`-driven matrix test — assert the matrix still
  enumerates exactly the four phase roles.
- The docs-tier predicate is evaluated against the plan's `Files:` list, not the diff — a docs
  task that drifts into code mid-flight is caught by audit, not by re-tiering; note this in the
  war-room prose.
- `/red-team` runs outside `/war` — its config read must tolerate a repo with no `.claude/war/`
  at all (the common case for foreign-repo verification via `--repo`).
- Naming: `docs`/`fix` sub-keys must not collide with war-memory provenance vocabulary (lesson:
  `new-findings-tag-must-avoid-war-memory-provenance-vocabulary-collision`) — both clear.

## 9. Non-goals / deferred

- No per-probe red-team model split (probe vs confirm) — one knob.
- No gating of local-root memory writes — repo publication only.
- No plan-schema `complexity:` field — classification is mechanical.
- No preset repricing beyond the docs tier (normal workers untouched; economy keeps `fix` absent).
- No haiku-tier auto-selection heuristics.

## 10. Validation criteria

1. `war-config.mjs --preset <each>` emits `commitLearnings: false` for all three presets; the
   string asserting the old default is absent from every §5 doc surface (grep OLD-absent, not just
   NEW-present).
2. `migrate` with the flag off and a decline → exits with nothing staged, nothing written;
   with an accept → `.claude/war/config.json` validates and carries `commitLearnings: true`, then
   migration proceeds.
3. A config with `agents.redteam: { model: 'sonnet', effort: 'low' }` → the red-team scaffold's
   spawned agents carry those opts; with the block absent → spawned agents carry **no** model opt
   (inherit-session, today's behavior byte-for-byte).
4. Dispatch tests: a task whose `Files:` are all `*.md` spawns its first-pass worker with the
   `docs` tier; a mixed-files task spawns the base worker config; with `fix` set, a fix-round and
   an `--ace` dispatch both carry the `fix` tier; with `fix` absent, both carry the base config.
5. The validator rejects: unknown `agents.worker` sub-keys, unknown `agents.redteam` keys, and any
   legacy key regression — with actionable error strings.
6. The mirror-registry test binds every newly hand-mirrored default in `workflow-template.js` to
   its canonical `war-config.mjs` source and fails when either side drifts.
