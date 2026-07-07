# Audit calibration & lesson graduation

Source spec: `docs/specs/2026-07-06-audit-calibration-and-graduation-design.md`

## Commander's Intent

- **Purpose:** Continuously improve WAR by adopting the three vetted gaps from the
  CODING-AGENT-RULES review — auditor anti-softening, cost-claim discipline, and lesson
  graduation — exactly where each bites, without diluting WAR's stronger existing mechanisms.
- **Method:** Gap-set-only adoption. Auditor rules ride the always-present base prompt and its
  standing mirror (both surfaces, same commit, byte-locked by both-surfaces tests); the graduation
  check rides the `/lessons-learned` housekeeping pass. Everything fail-open: the cost cap
  demotes, the graduation check flags, nothing stalls a run or auto-files. No wholesale rules
  import anywhere.
- **End state:**
  1. Every built audit prompt (initial, rebuttal, post-fix re-audit) contains the CALIBRATION
     RULE and COST-CLAIM RULE sentences.
  2. `agents/war-auditor.md` mirrors both rules; two new both-surfaces tests fail on drift of
     either surface.
  3. `skills/lessons-learned/SKILL.md` records recurrence trails (Phase 2), emits a Graduation
     candidates subsection (Phase 3), and surfaces it in the final report (Phase 7), flag-only.
  4. Full JS suite green (`node --test 'skills/**/*.test.mjs'`).
  5. Version bumped across all four release slots as the trailing phase.

## Build order (for /war)

1. Phase 1 — Auditor calibration rules + graduation check (2 tasks, parallel, file-disjoint)
2. Phase 2 — Release (version bump, trailing)

## Phase 1 — Auditor calibration rules + graduation check

### Task 1: Calibration + cost-claim rules on both auditor surfaces, with drift-guard tests

- Files: `skills/war/assets/workflow-template.js`, `agents/war-auditor.md`,
  `skills/war/assets/workflow-template.test.mjs`
- Plan slice: Append the two canonical sentences from spec §4.1 and §4.2 — CALIBRATION RULE
  (judge on evidence only; never soften/downgrade/drop a finding because peers disagreed or a fix
  was attempted; downgrade only with a stated reason grounded in the current diff; the pull to
  soften peaks right after your own finding is challenged) and COST-CLAIM RULE (a finding
  justified by a cost must name a magnitude — ms, MB, LOC, call count, or complexity class; an
  unquantifiable cost claim caps the finding at Minor) — to the LATITUDE/DISPOSITION rules block
  inside `auditPrompt()` in `workflow-template.js`. Mirror both, sentence-case headings and
  identical shared mid-sentence text, into `agents/war-auditor.md`: calibration rule in the
  `## Latitude and disposition (ADR 0013)` section, cost-claim rule adjacent to the
  `Critical | Major | Minor | Nit` severity contract. Add two both-surfaces tests to
  `workflow-template.test.mjs` following the existing auditor latitude/disposition both-surfaces
  test block (shared-sentence assertion against the built `auditPrompt()` output — one initial
  round, one rebuttal-round dispatch — AND the standing file; case-tolerant mid-sentence
  anchors). Gate-audit inline prompts are deliberately untouched (spec §4.1 scope note).
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 2: Graduation check in /lessons-learned

- Files: `skills/lessons-learned/SKILL.md`
- Plan slice: Per spec §4.3. Phase 2 (Investigate staleness): investigators additionally record
  each lesson's recurrence trail from the `phase` field's free-text recurrence annotations.
  Phase 3 (Plan): new **Graduation candidates** subsection — any lesson with ≥2 recorded
  re-triggers whose content describes a machine-checkable invariant (greppable pattern, diff
  property, enum mirror, string presence) is listed with lesson slug, recurrence count, and a
  one-line proposed enforcement shape (hook / floor / drift-guard test / lint). Phase 7 (final
  report): surface the candidates list verbatim. State the flag-only constraint in the same
  section: the pass never implements enforcement and never auto-files; the operator decides.
- requiresTest: false — prose-only skill instruction change; no test surface exists for
  SKILL.md files (validation is spec §10 criterion 3, checked by audit + red-team)
- requiresPackaging: true
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 3: Version bump (all four slots)

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump the version in all four slots together — `plugin.json` `version`,
  `marketplace.json` `metadata.version` AND `plugins[0].version`, and the `README.md`
  `## Status` line (replace-in-place, no badge). Resolve the next free patch number from the
  slots at land time — any version literal in this plan or the spec is non-authoritative.
  One-line release note naming the auditor calibration rules and the graduation check; do not
  quote retired/guarded tokens.
- requiresTest: false — release-slot bump; no test surface
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Behavioral efficacy of the CALIBRATION RULE (do rebuttal/re-audit rounds actually soften less)
  · why deferred: only observable across subsequent WAR runs' audit verdicts, not in any in-run
  gate · runner: operator observation + servitor lesson capture over future runs; revisit at the
  next `/lessons-learned` pass.

## Notes / conscious deviations

- The `CONTEXT.md` **Graduation candidate** term already landed with the spec (PR #560) — no
  task here re-touches it.
- Gate-audit seats (`execution-evidence`, `end-state`) receive the new rules via the
  `agents/war-auditor.md` standing surface only; their inline-built prompts are deliberately
  unchanged (spec §4.1).
- Spec and plan ride PR #560; run `/red-team` and `/war` against a tree that contains both
  (after #560 merges, or stacked off its branch per ADR 0011).
- Ponytail's subagent injection is an accepted standing layer (spec D9/constraint 5) — auditors
  will see both it and the new calibration rule; no decoupling work is in scope.

## Open decisions

None — resolved by the 2026-07-06 grilling session and the spec's design tree.
