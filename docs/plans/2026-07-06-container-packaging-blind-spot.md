# Container-packaging blind spot — packaging floor, opt-in docker gate, ratified backstops

Implements [the ratified spec](../specs/2026-07-06-container-packaging-blind-spot-design.md)
([ADR 0017](../adr/0017-packaging-floor-docker-gate-ratified-backstops.md)). Spec, ADR, and the
four CONTEXT.md glossary entries are already committed (PR #519); this plan builds the mechanisms.

## Commander's Intent

- Purpose: WAR-merged work must never again ship a broken container image while a prose waiver
  hides the un-run check — packaging errors are caught pre-merge or visibly deferred, never
  silently waived.
- Method: three layers, deterministic core first, reusing existing idioms over new machinery: a
  tested shell floor in the refiner's merge path (ADR 0006 mold); docker build as an
  operator-accepted extension of the existing declared gate — degrading to a recorded backstop when
  the daemon is unreachable, so environment never reads as broken code; and backstops as ratified,
  machine-readable, land-time-visible plan artifacts. No new config keys; fail-closed wherever
  judgment is uncertain.
- End state:
  1. `assert-packaging-in-diff.sh` exists; its suite covers the incident repro (added file beside
     enumerated COPYs → exit 1) and every clearance path, green.
  2. `unpackaged` is a merge outcome in both `HARD_ESCALATION_REASONS` mirrors; drift guard green.
  3. A task tripping both floors routes bounded fixes via the combined sub-loop — never an
     immediate hard escalation on the second floor's status.
  4. `/war` Setup offers docker build when Dockerfiles exist and the daemon answers; unreachable →
     an auto-recorded backstop entry.
  5. The plan template requires `## Deferred validations (backstops)`; the structure test locks it;
     AI-declared sections render their marker.
  6. Phase reports and the final PR render "Unexecuted backstops"; the handoff block carries
     `backstops[]`.
  7. Release landed across the four canonical slots.

## Build order (for /war)

1. Phase 1 — Packaging floor & enum wiring
2. Phase 2 — Backstops & authoring surfaces
3. Phase 3 — Release

## Phase 1 — Packaging floor & enum wiring

### Task 1: The floor guard + its suite
  - Files: skills/war/assets/assert-packaging-in-diff.sh,
    skills/war/assets/assert-packaging-in-diff.test.sh
  - Plan slice: implement spec §4.1 exactly. Interface + 0/1/2 exit contract mirror
    `assert-test-in-diff.sh` (`<integrationBranch> <taskBranch>`, three-dot `--name-status` diff,
    **A and R target paths only**). Dockerfile discovery: `Dockerfile` / `Dockerfile.*` /
    `*.Dockerfile`, excluding `node_modules/` and `.git/` — one discovery expression, reused later
    by Task 6's Setup prose. Flag F→D when: D's dir is an ancestor of (or equals) F's dir; D has ≥1
    literal-file COPY/ADD source resolving into F's dir; no COPY/ADD source in any stage covers F
    (literal, wildcard glob, or directory copy incl. `COPY . .`); and the context root's
    `.dockerignore` does not exclude F under the supported subset (literal paths, dir prefixes,
    single-segment `*`, `**`; unparseable lines incl. `!` negations = NOT excluding). `COPY --from`
    sources ignored. Context = the Dockerfile's own dir, with the ponytail ceiling comment from the
    spec. Exit 1 lists flagged `F → D` pairs on stdout. Suite: every spec §10.1 case, each failing
    without the feature (incident repro; `.dockerignore` clearance; wildcard coverage; whole-dir
    coverage; `COPY --from` ignored; no Dockerfile → 0; bad ref → 2; unparseable ignore line →
    still 1).
  - requiresTest: true
  - deps: []
  - target repo: superproject

### Task 2: Workflow wiring + enum widening (both mirrors, one task)
  - Files: skills/war/assets/workflow-template.js, skills/war/assets/workflow-template.test.mjs,
    skills/war/assets/land-decision.mjs, skills/war/assets/land-decision.test.mjs
  - Plan slice: spec §4.2. (a) `requiresPackaging` resolution (`r.task.requiresPackaging !== false`)
    with the logged-never-silent skip, alongside the existing `requiresTest` resolution. (b) Floor
    invocation instruction added to **every** dispatched merge prompt — the main merge-task prompt
    AND each floor-retry merge prompt (the template has more than one; keep dispatched prompts in
    sync with the standing war-refiner.md steps). (c) Replace the no-test-only sub-loop with **one
    combined floor-retry sub-loop**: a retry merge returning *either* floor status (`no-test` or
    `unpackaged`) routes another bounded fix-worker (fix prompt for `unpackaged`: "add the COPY or
    dockerignore it — never delete the file") + full re-audit + re-merge on the **shared**
    `fixRounds` budget, until both floors pass or budget exhausts. (d) `unpackaged` added to
    `HARD_ESCALATION_REASONS` in BOTH hand-mirrored copies (workflow-template.js and
    land-decision.mjs) + the drift guard, same task, same commit. (e) Polish-merge prompt gains the
    explicit packaging-floor skip next to its existing `assert-test-in-diff.sh` skip. (f)
    `args.backstops` (array|null of `{check, why, runner, source: 'plan'|'auto', aiDeclared?}`)
    passed through untouched into `handoff.backstops[]` on `landed` and `held:escalation`. Tests:
    spec §10.2–3 including the both-floors-tripped case (bounded fixes, no immediate hard
    escalation) and the polish skip.
  - requiresTest: true
  - deps: [1]
  - target repo: superproject

### Task 3: Refiner contract prose
  - Files: agents/war-refiner.md
  - Plan slice: merge-task gains the packaging-floor step (run `assert-packaging-in-diff.sh
    <integrationBranch> <taskBranch>` in the task worktree when `requiresPackaging`; exit 0
    continue, exit 1 → status `unpackaged` do-NOT-merge, exit 2 → status `error` — never
    misclassified); MergeResult status enum gains `unpackaged`; the step-5 note that today counts
    "two fail-closed pre-merge gates" is reworded for three. **Placement (pinned by /red-team):**
    insert the packaging floor immediately after the step-4 test-floor check and before the step-5
    submodule-mutation check — the two `assert-*-in-diff.sh` coverage floors stay adjacent — and
    extend step 5's "order-independent … both fail-closed pre-merge gates" note to name all three.
    Order is semantically free (any failing exit blocks the step-6 merge); the pin is for readable,
    grouped floors.
  - requiresTest: false
  - deps: []
  - target repo: superproject

### Task 4: Schemas
  - Files: skills/war/references/schemas.md
  - Plan slice: task field `requiresPackaging` (boolean, default true, Lead-set at decompose);
    MergeResult status `unpackaged`; handoff block `backstops[]` with the entry shape
    `{check, why, runner, source: 'plan'|'auto', aiDeclared?}`. Field-before-emitter is deliberate
    here — the owning emitter task is Task 2, same phase.
  - requiresTest: false
  - deps: []
  - target repo: superproject

## Phase 2 — Backstops & authoring surfaces

### Task 5: Plan template + structure test
  - Files: skills/war-strategy/SKILL.md, skills/war-strategy/war-strategy-structure.test.sh
  - Plan slice: the plan template (§2) gains the required section
    `## Deferred validations (backstops)` — entry shape *check · why deferred · runner*, literal
    `None` allowed — plus the AI-declared heading variant
    (`## Deferred validations (backstops — AI-declared)`) and the per-task
    `requiresPackaging: true|false` field line. The structure test locks the section heading and
    the new field line into the template fence.
  - requiresTest: true
  - deps: []
  - target repo: superproject

### Task 6: Lead orchestration prose
  - Files: skills/war/SKILL.md
  - Plan slice: spec §4.3 + §4.4 Lead side. Setup gate-detection extension: discover Dockerfiles
    (same expression as Task 1), probe `docker info`; reachable → propose appending
    `docker build -f <dockerfile> <its dir>` per Dockerfile to the declared base (operator
    confirms/trims; recorded in `overrides.gate`; also offer `docker info` as first
    `run.provision` step); unreachable → auto-record the backstop entry *"docker build (daemon
    unavailable at setup)"*; `--afk`: include all buildable when the daemon answers, auto-backstop
    otherwise. Decompose step: set `requiresPackaging` per task (default true). Backstop
    extraction: the Lead is the single normalization point — parse plan entries (unparseable line
    carried whole as `check`, never dropped), merge Setup auto-recorded entries, mark
    `aiDeclared: true` from the AI-declared heading, thread as `args.backstops` (array|null);
    legacy plan without the section → `null` + the "no backstop section" report note; interactive
    runs ask at the approval gate. Never-waive rule: a validation in neither the gate, a floor, nor
    the backstop section is never waived in prose — escalate. Phase report template + final-PR
    instructions gain the mandatory "Unexecuted backstops" line (AI-declared entries render their
    marker).
  - requiresTest: false
  - deps: []
  - target repo: superproject

### Task 7: Red-team ratification lens
  - Files: skills/red-team/SKILL.md
  - Plan slice: backstop-legitimacy check — per declared entry: is the deferral justified; does a
    cheap pre-merge proxy exist (e.g. the packaging floor covers the COPY half of a deferred
    "docker build"); are runner + timing named. AI-declared sections are flagged for explicit
    operator attention. Failures route the normal plan-patch loop.
  - requiresTest: false
  - deps: []
  - target repo: superproject

### Task 8: AFK drafter provenance
  - Files: skills/war-machine/SKILL.md
  - Plan slice: the `--afk` drafter authors the backstop section under the AI-declared heading
    variant (the ADR 0014 provenance rule applied to waivers) — never the plain operator-ratified
    heading.
  - requiresTest: false
  - deps: []
  - target repo: superproject

### Task 9: Campaign aggregation
  - Files: skills/war-campaign/assets/campaign-ledger.mjs,
    skills/war-campaign/assets/campaign-ledger.test.mjs, skills/war-campaign/SKILL.md
  - Plan slice: ledger entries carry each plan's `backstops[]` (from the handoff block); campaign
    wrap-up renders the aggregate — every validation the whole campaign deferred, AI-declared
    marked. Tests: aggregation across plans; absent field tolerated (in-flight ledgers predate the
    field).
  - requiresTest: true
  - deps: []
  - target repo: superproject

## Phase 3 — Release

### Task 10: Version bump + Status
  - Files: .claude-plugin/plugin.json, .claude-plugin/marketplace.json, README.md
  - Plan slice: **relational bump — do not hard-code a literal**: read the current version from the
    slots at execution time and bump the patch component (+0.0.1). Four canonical slots:
    `plugin.json` version, `marketplace.json` both version fields, `README.md` `## Status`
    replace-in-place (never left empty; no badge). Status blurb: state guard semantics precisely —
    the floor *refuses merging diffs that add files a Dockerfile's enumerated COPYs miss*, not
    "verifies images"; avoid quoting retired tokens.
  - requiresTest: false
  - deps: []
  - target repo: superproject

## Deferred validations (backstops)

  - End-to-end floor + docker-gate exercise against a real Dockerfile repo (the incident replay in
    anger) · why deferred: this repo has no Dockerfile, so the floor is exercisable only via its
    fixture suite here · runner: the first `/war` run on a container-shipping target repo after
    release.

## Notes / conscious deviations   (ratify in /red-team)

- Spec, ADR 0017, and the CONTEXT.md glossary entries are already committed (PR #519); no task
  re-authors them. The glossary briefly leads the implementation — operator-accepted in the
  grilling session.
- This plan's own tasks use `requiresTest` only — `requiresPackaging` cannot govern the run that
  introduces it.
- The backstop section above is dogfooding: it predates Task 5's template requirement but follows
  the ratified shape.
- Version is relational (+0.0.1) by operator instruction — no literal to go stale if plans stack.
- Mid-run docker-daemon death still reads `gate_failed` (spec §8 accepted residual; the `docker
  info` provision pin only classifies pre-spawn absence).

## Open decisions                 (resolved by /red-team 2026-07-06)

- **Packaging-floor step ordering** → **RESOLVED.** Pinned in Task 3: the floor runs immediately
  after the step-4 test-floor check, before the step-5 submodule-mutation check; the step-5
  order-independent note extends to all three. Order is semantically free — the pin only groups the
  two `assert-*-in-diff.sh` coverage floors for readability.
- **`campaign-ledger.mjs` schema-version note** → **RESOLVED: not needed.** Task 9's absent-field
  tolerance is the established pattern for in-flight ledgers that predate a new field (tolerate
  absence on read); an explicit schema-version marker would add surface for no behavioral gain. A
  format-versioning scheme, if ever wanted, is a separate ledger concern out of this plan's scope.
