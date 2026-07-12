# Survey-corps memory mining — lessons become issues before the sweep

Source spec: [docs/specs/2026-07-11-survey-corps-memory-mining-design.md](../specs/2026-07-11-survey-corps-memory-mining-design.md)

## Commander's Intent

- **Purpose:** lesson-recorded debt stops being invisible — `/survey-corps` turns qualifying
  memories into real issues before its sweep, so the pipeline can spec and fix them.
- **Method:** extend the survey with a Step 0 mining stage: both memory roots' hot sets,
  open-actionable-defects only (live-tree verified), issue bodies lint-guarded by the existing
  fail-closed redaction lint (hit → withheld, never scrubbed), slug-deduped against open **and**
  closed issues (never re-file), filed autonomously with the `memory-mined` label; `--erwin`
  gains a pre-filing pause. Prose-only change — no manifest schema change, no new tests;
  validation rides declared backstops.
- **End state:**
  1. `skills/survey-corps/SKILL.md` carries a Step 0 (Mine) with the full mechanics: enumerate
     both hot roots → verify referents → draft with a greppable `Lesson: <slug>` body line →
     dedup (open+closed) → redaction lint → file with `memory-mined` → report every mined lesson
     as `filed #N` / `withheld: redaction` / `previously adjudicated (#N)` / `skipped: <reason>`.
  2. `--erwin` is documented as two pauses: pre-filing and the existing post-clustering gate;
     bare invoke stays autonomous end to end.
  3. The closing coverage report includes a Mining section accounting for every mined lesson —
     no silent drops.
  4. README describes the survey as issues **and memories** → specs.
  5. Release lands as its own trailing phase: next free patch above the live base, all four
     slots together.

## Build order (for /war)

1. **Phase 1 — survey prose** (two parallel, file-disjoint tasks)
2. **Phase 2 — release** (trailing, shared slot files)

## Phase 1 — survey prose

### Task 1: SKILL.md — Step 0 (Mine)

- Files: `skills/survey-corps/SKILL.md`
- Plan slice: implement spec §4 in the skill prose.
  - **Frontmatter description**: extend to name memory mining (memories *and* issues → specs) so
    skill routing catches mining-intent invocations.
  - **New step `### 0. Mine`**, inserted before the existing `### 1. Sweep` heading (numbering
    from 0 avoids renumbering the existing steps). Contents, per spec §4 mechanics:
    1. Enumerate hot lessons from **both roots** — repo root `docs/learnings/` and the local
       root, resolved the same way `render-index` resolves it; `archive/` excluded in both.
    2. Reader fan-out (may ride the skill's existing Workflow authorization): per lesson, verify
       the referent against the live tree and classify — actionable / resolved-or-stale /
       process-recipe / excluded-type (`user`/`feedback`). Only **open actionable defects**
       proceed (not `[RESOLVED]`, not superseded; recurrence counters boost priority in the
       body, never eligibility).
    3. Draft the issue: title from the lesson `description`; body = defect statement, a fixed
       greppable citation line `Lesson: <slug>` plus the lesson path, provenance tier,
       recurrence note if any. Quote lesson bodies minimally (titles can leak too).
    4. Dedup: search issues **open AND closed** for the slug. Open hit → skip (the normal sweep
       covers it). Closed hit → skip, report `previously adjudicated (#N)`. A closed-as-fixed
       issue whose lesson still verifies live → stale-lesson signal *reported* for
       `/lessons-learned`, never acted on here.
    5. Lint: run every drafted body (title included) through the fail-closed redaction lint
       (`war-memory.mjs lint`). **[RED-TEAM CORRECTION — Major, proven]** `war-memory.mjs lint`
       reads **files/directories only — it does NOT read stdin** (`cmdLint` `fs.statSync`s each
       path arg or defaults to the local root); piping a body in returns a false `clean` and would
       file a leaking issue. So the mechanism is: **write the drafted body (title + body) to a
       temp `.md` file, then run `war-memory.mjs lint <tmpfile>`** (exit 1 / any reported hit →
       redaction hit) and delete the temp file. Hit → NOT filed; report `withheld: redaction`. No
       auto-scrub. (Equivalent: import the module's exported `lint(text)` function directly — same
       fail-closed detector.)
    6. File survivors with the `memory-mined` label (create the label on the target repo if
       absent); all gh writes ride the existing gh-preflight (`overrides.ghUser`) discipline.
    7. Report rows for **every** mined lesson: `filed #N` / `withheld: redaction` /
       `previously adjudicated (#N)` / `skipped: <not-actionable reason>`.
  - **`--erwin`**: document the second pause — under the flag the run pauses **before filing**
    (present the drafted issue batch, file only approved ones) in addition to the existing
    post-clustering gate. Bare invoke files autonomously (stays cron-able).
  - **Coverage report**: the closing report gains a **Mining** section rendering the Step 0.7
    rows ahead of the existing issue→spec table.
  - **Sweep untouched**: the run-bookkeeping label filter is unchanged; `memory-mined` passes
    through and mined issues enter the sweep as ordinary open issues.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: README — pipeline blurb

- Files: `README.md`
- Plan slice: update every README surface that describes `/survey-corps` as issues-only —
  anchor by construct, not line number:
  - the **command-set overview sentence** (the "`/survey-corps` turns open issues into specs"
    clause in the pipeline walk-through paragraph),
  - the **`### Turn issues into specs (/survey-corps)`** section — one added sentence naming
    memory mining: hot lessons from both roots become `memory-mined` issues (lint-guarded,
    slug-deduped) before the sweep.
  **[RED-TEAM CORRECTION]** the earlier draft named a third "quick-reference command block" anchor —
  README has **no** such block (its only command enumeration is the `## Usage` overview sentence
  above; the rest are per-command `###` subsections). Do NOT hunt for a command table; the two
  anchors above carry the mention.
  Grep is a floor: after the token sweep for `survey-corps` in README, hand-scan the same-scope
  pipeline prose for same-meaning siblings ("issues → specs" phrasings that don't name the
  skill) and list each straggler as a survey-derived correction.
  Do **not** touch the `## Status` line (release owns it, Phase 2).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — release

### Task 1: version bump

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

- Spec §10 criteria 1–6 (fixture lesson → filed with label + citation line, zero duplicates on
  re-run; closed-slug → `previously adjudicated`; redacted local lesson → `withheld: redaction`,
  nothing created; `[RESOLVED]`/`user`-typed → `skipped`; `--erwin` files nothing before
  approval; bare-invoke end-to-end sweep inclusion + Mining report completeness)
  · why deferred: every criterion exercises live `gh` writes and the run-time Workflow fan-out —
  not reachable by this repo's pre-merge gate (no gh sandbox in the floors)
  · runner: the first bare and first `--erwin` `/survey-corps` runs on this repo after merge;
  the operator eyeballs the Mining report rows against the criteria.

## Notes / conscious deviations

- No structure test added for `skills/survey-corps/SKILL.md` (the skill ships no tests today and
  its prose is not mirrored on any other surface) — both prose tasks take the `no-test` route
  deliberately; behavioral validation rides the backstops above.
- Both drift-guard authoring rules are vacuous here: no new inline mirror (`workflow-template.js`
  untouched — the survey Workflow is authored at run time), no default flip.
- README is touched in Phase 1 (blurb) and Phase 2 (`## Status`) — cross-phase, landed-first
  edge; the tasks name disjoint constructs within the file.
- **[RED-TEAM CORRECTION] Spec §6's CONTEXT.md terms (`Memory mining`, `memory-mined`) already
  exist verbatim in the live tree** (`CONTEXT.md` lines ~1125/1133, added with the grill-session
  spec edits), so no CONTEXT.md task is needed — the §6 surface is accounted for, not silently
  dropped.

## Open decisions

None — the design tree was resolved in the 2026-07-11 grill session (see the source spec).
