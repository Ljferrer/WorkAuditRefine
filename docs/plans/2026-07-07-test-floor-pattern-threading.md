# Test-floor pattern threading — operator-declared `overrides.testPattern`

Spec: [2026-07-07-test-floor-pattern-threading-design.md](../specs/2026-07-07-test-floor-pattern-threading-design.md)

## Commander's Intent

- Purpose: end the guaranteed false "no-test" floor on cross-repo WAR runs — make the floor
  pattern an operator-declared repo fact while preserving floor⊆gate.
- Method: thread a charset-validated `overrides.testPattern` from config → Lead →
  `plan.testPattern` args → all three prompt sites + the refiner standing instruction
  (same-commit two-surface sync); war-room scouts from a per-language case-glob table and the
  operator confirms; decisive zero-match preflight warns interactive / hard-stops afk; the floor
  script stays byte-identical.
- End state:
  1. `war-config.test.mjs` green with the new validation cases (null + valid set accepted;
     empty / quote / `$()` / backtick / newline rejected).
  2. `workflow-template.test.mjs` proves all 3 prompt sites carry `--pattern` when
     `plan.testPattern` is set, and compose byte-identical when null.
  3. `workflow-template.js` and `agents/war-refiner.md` updated in the same commit; doc-contract
     tests lock the `--pattern` clause in `war-refiner.md` and the preflight clause in
     `skills/war/SKILL.md`.
  4. `skills/war-room/SKILL.md` carries the scout+confirm step and the dialect-correct
     per-language table (root+nested pair for prefix conventions; no `**/` tokens).
  5. `schemas.md` documents `plan.testPattern`; `CONTEXT.md` defines "Floor pattern"; a new ADR
     records operator-declared-never-inferred.
  6. Plugin version bumped; full gate green at the landing tip.

## Build order (for /war)

1. Phase 1 — Mechanics + prose (two waves)
2. Phase 2 — Release

## Phase 1 — Mechanics + prose

### Task 1.1: Template threading + refiner standing instruction

- Files: `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`
- Plan slice: spec §4 (workflow-template.js + war-refiner.md). Args doc gains
  `plan: { file, gate, testPattern? }`. Three prompt sites: merge-task prompt and retry prompt
  append the exact single-quoted ` --pattern '<value>'` to the composed
  `assert-test-in-diff.sh` command line when `plan.testPattern` is set; the ADD_TEST fixPrompt
  gains, when set, the clause "the floor pattern is `'<value>'` — the added test file's path must
  match it". Null/absent ⇒ every composed prompt byte-identical to today. `agents/war-refiner.md`
  step 4 gains: run with the `--pattern` override when the dispatched merge-task prompt carries
  one — never invent a pattern yourself. Tests in `workflow-template.test.mjs`: with a pattern
  set, all three prompts carry it (merge, retry, ADD_TEST clause); with null, prompts are
  byte-identical to the pre-change composition. CLAUDE.md same-commit rule is why the standing
  instruction rides this task, not the docs task.
- requiresTest: true
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 1.2: Operator-facing prose + docs surfaces

- Files: `skills/war/SKILL.md`, `skills/war-room/SKILL.md`, `skills/war/references/schemas.md`,
  `CONTEXT.md`, `docs/adr/0019-test-floor-pattern-operator-declared.md` (number may float —
  use next free), `skills/war/assets/assert-test-in-diff.sh` (comment-only)
- Plan slice: spec §4 (Lead + war-room) and §5–§7. `skills/war/SKILL.md`: Lead threads resolved
  `overrides.testPattern` into every phase Workflow's args as `plan.testPattern`; zero-match
  preflight before phase-1 dispatch (null pattern + ≥1 `requiresTest` task + zero files matching
  the default floor set with its exclusions ⇒ interactive: loud warning + suggested fix, proceed
  only on operator say-so; afk: hard-stop before any dispatch). `skills/war-room/SKILL.md`:
  scout+confirm interview step + the per-language suggestion table from spec §4 verbatim
  (dialect-correct; includes the honest in-file-test limit note). `schemas.md`: document
  `plan.testPattern?` in the args schema (keep `schemas-manifest.test.sh` green). `CONTEXT.md`:
  add the "Floor pattern" term (spec §6). New ADR per spec §7. `assert-test-in-diff.sh`:
  header comment gains one pointer line to `overrides.testPattern` — no behavior change, byte
  identity of logic verified by the untouched `assert-test-in-diff.test.sh`.
- requiresTest: false — prose/docs only; the machine locks for these surfaces are the
  doc-contract tests added by Task 1.3 (deliberate, logged; see Notes)
- requiresPackaging: true
- deps: []
- target repo: superproject

### Task 1.3: Config schema + validation + doc-contract locks

- Files: `skills/war/assets/war-config.mjs`, `skills/war/assets/war-config.test.mjs`
- Plan slice: spec §4 (war-config.mjs). `DEFAULTS.overrides.testPattern = null`; `validate()`:
  non-null ⇒ string, trimmed non-empty, every space-separated token non-empty, whole value
  matches `^[A-Za-z0-9*?./_ -]+$`. Presets untouched. Tests in `war-config.test.mjs`:
  (a) validation — null accepted, `"*.test.ts *.test.tsx"` accepted, and `""`, `"a'b"`,
  `"$(rm -rf)"`, backtick-bearing, newline-bearing values rejected; (b) doc-contract locks for
  the prose landed by 1.1/1.2 — `agents/war-refiner.md` names the threaded `--pattern`,
  `skills/war/SKILL.md` contains the zero-match preflight clause (follow the existing
  doc-contract idiom in this file, e.g. the `--resolve-gate` and prefetch `--repo` locks).
- requiresTest: true
- requiresPackaging: true
- deps: [1.1, 1.2] — the doc-contract tests assert prose that must already be merged; worker
  rebases onto the integration tip and sees both
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version bump

- Files: `.claude-plugin/plugin.json`
- Plan slice: bump `version` 0.14.9 → 0.15.0 (minor: new public config field). No CHANGELOG.md
  exists in this repo — plugin.json is the only release slot file.
- requiresTest: false — one-line version literal; no logic surface
- requiresPackaging: true
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- End-to-end repro flip on Otto refs (spec §10.1: composed `--pattern '*.test.ts *.test.tsx'`
  exits 0 against `f3f2b87…war/2026-07-07-war-engine-port/p1-1.2`; bare exits 1) · why deferred:
  needs the Otto repo and its branches — unreachable from this repo's gate · runner: operator,
  after release lands — the §1 red/green command; the next Otto WAR run exercises it live.
- Zero-match preflight behavior (spec §10.4: afk refuses to dispatch, interactive warns) · why
  deferred: the preflight is Lead prose executed at run time, not a unit-testable asset — the
  doc-contract test locks only its presence · runner: first /war run on a null-`testPattern`
  repo with no default-set matches.
- war-room scout+confirm UX (spec §10.8 table dialect is fixture-checkable, but the interview
  flow is prose) · why deferred: no harness for interactive interview steps · runner: next
  /war-room invocation on a vitest-convention repo — expect the table's suggested pattern.

## Notes / conscious deviations

- Task 1.2 is `requiresTest: false` by design: its diff is prose/docs, and this repo's floor
  set (`skills/**/*.test.mjs`, `**/*.test.sh`) cannot match documentation. The machine lock for
  that prose lands one wave later as 1.3's doc-contract tests — a deliberate ordering, mirrored
  on the plan's own subject matter.
- The ADR number 0019 may float if another ADR lands first (same class as the
  floating-migration-index lesson); the worker uses the next free number and the spec's §7
  content verbatim.
- Live-run remediation for the in-flight Otto war-engine-port run (spec §8) is operator action
  in the Otto repo — out of this plan's scope.
- `assert-test-in-diff.sh` and `assert-test-in-diff.test.sh` logic stays byte-identical; the
  only touch is a comment-only header pointer (Task 1.2).

## Open decisions

None — all four design branches (pattern source; field design; populating + preflight
semantics; live-run remediation scope) were operator-resolved in the grill; see spec §3.
