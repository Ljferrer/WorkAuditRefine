# Red Team — late defects fixed in the run (2026-11-04)
**Verdict:** ADJUDICATED — every blocker is patched in the plan and closed by ruling, with no probe re-proof of the patches
**Rounds:** 1

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source (merged arm, the plan is its own source), consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: anchor-check, command-diff, strip-feasibility, edits-compose, ff-topology, default-flip-old-absent, drift-guard-doctrine (unguarded-new-mirror, guard-split-deps-edge, touched-doc-fact-coverage, and the judge-tag grading rule). Executed in sandbox: executable-proof, command-diff, strip-feasibility, ff-topology, default-flip-old-absent. Artifact kind: `tdd-plan`.
Fallback: none.

Coverage: 13 of 13 probes on target, none dropped. Escape guard: snapshot 0, baseline 0.

## Executed proof
- Release floor: a four-slot bump with `requiresTest: true` made `assert-test-in-diff.sh` exit 1 (the `no-test` route).
- Strip prototype: the indent strip passed `node --check`. Run against the stripped form, the engine suite showed 30 failures at base. Every one was a source-shape test: 21 need comments, 9 need indent. No behavior failure appeared.
- Measurements: the stripped template and the 1,009 B room reproduced. The prompt-literal share measured about 161,034 B against a 172,032 B hard line.
- Synthetic topology repo: a fast-forwarded late-fix commit made `task-integrated.sh`'s owned-path rule refuse the origin task, and git kept no record tying the fix to its charge.
- One scanner mutant (the block-comment branch disabled) flipped a fixture result. A committed mutant row can therefore decide End state 2.

## Findings
### Major
- [Major] The late-fix pass ran before the sweep, but behavior rows also surface at the sweep's exclusion drain → the Aligned t5-2 row never reached the pass. Resolution: sort behavior rows before the pass and the land decision (PIN-21).
- [Major] The `sweepExclude` mode had no source → D19 could never fire in a real campaign. Resolution: the one-liner emits `mode: 'stacked'`, bound by a doc row (PIN-22).
- [Major] #2555's guard mostly exists already (`dispatchSite`, `deathOf`) → the Context line was false. Resolution: narrowed to the null label only, and the HARD rethrow stays (PIN-23).
- [Major] `findingClass` values had no canonical home → a mirror with no guard. Resolution: `FINDING_CLASSES` export plus mirror-registry row (PIN-24).
- [Major] A fast-forwarded late fix cannot be tied to its task → a relaunch loses the charge, and `task-integrated.sh` refuses. Resolution: the `Late-Fix: <task id>:<n>` trailer, with the owned-path rule extended (PIN-25).
- [Major] End state 2 was judged once from a commit body, but a committed check could decide it → resolved with mutant rows (PIN-26).
- [Major] Task 7.1 had `requiresTest: true` with a test-free diff → set to `false`, and its Done-when command stays.
- [Major] The End state 1 census mechanism was not named, so its check stayed red after a correct strip → the harness now runs the staged form while source tests read the raw template. Any leftover census test skips under the flag and has its own fail-proof row.
- [Major] Several Files lists were missing files their slices must edit:
  - `EXPECTED_MJES` registration (`war-config.test.mjs`)
  - the references placement census and link-integrity tests
  - the harness and `fix-round-doctrine.md` for the late-fix build
  - `schemas.md` and the entry-shape pin for `sweepExclude`
  - `task-integrated.sh` and recovery docs

  Resolution: all added.
- [Major] Doc surfaces still taught the old rules → Tasks 4.1 and 6.2 now list them, with OLD-absent rows. The surfaces: the disposition-note sentences in SKILL.md, design.md, gastown-design-params.md and CONTEXT.md, the sibling-owned example in backward-chain-examples.md, and disposition-eligibility.md.
- [Major] Touched-doc facts had no guard, de-mirror or defer choice → a Drift-guard coverage table now sits in Part 1.
- [Major] The Evidence block lacked #2150's artifact rows → added.

### Minor
- Context item 4 overstated the polish claim: the merges already carry `sweepDebtClause`. Reworded, and Task 5.1(c) now reuses `debtList` / `namedDebt`.
- The End state 14 version compare was wrong for minor bumps. Fixed with an ordered compare.
- The Task 1.1 wording now names the top-level code frame, so `${}` bodies keep their indent.
- The budget owner for an integrated-tip or end-state late defect was not named. It is now the task whose `Files:` hold the file, else the lowest-id merged task.
- A land-gate baseline red now carries, or is filed with a stated reason on the final phase.
- The late-fix build carries the doctrine, scope and fence clauses, and no chain clause.
- `DEMOTE_REASONS` does not change. The plan says so.
- ADR 0058 also amends ADR 0026.
- Pivotal constraints now carry the prompt-literal budget (about 11 KB of room).

## Resolutions applied (grill decisions)
- Sweep order → A: sort behavior rows before the pass. A post-sweep behavior row carries, or is filed on the final phase. ADR 0012's never-hold rule stands. → D21, Task 4.1, End state 6.
- Mode source → the one-liner emits `stacked`, and an absent mode reads `parallel` → D19, D22, Task 4.1, End state 6, A2 retired.
- #2555 → null label only → D14, D23, Task 5.1(d), End state 12.
- Class enum → canonical `FINDING_CLASSES` export → D24, Task 2.1.
- Late-fix proof → `Late-Fix` trailer → D25, Task 3.1, End state 15.
- Strip mutant proof → committed mutant rows → D26, Task 1.1, End state 2.

## Adjudications
- `requiresTest: false` supersedes `requiresTest: true` on Task 7.1 — the release diff carries no test file, so the floor routes `no-test` — AI-declared
- End state 2 `check:` (committed `indent-strip: mutant` rows) supersedes the `HARD at audit_sha` commit-body row — operator-ratified (2026-11-04)

## Residual risk
- The patches are adjudicated, not re-proved by a probe run. The changed End-state checks were re-run red at base (TRIAL-5).
- The plan-literal lint flags `task-integrated.test.sh` in End state 15 and the Task 3.1 Done-when line. This is a single named check, not a gate suite list, and it is kept on purpose.
- The census size (30 at base) may shrink once the harness helpers accept zero indent. End state 1 still requires zero unexplained stripped-form failures.
- A1 still holds: if Phases 2 to 6 grow the code or prompt text past the freed room, a later task must compress in-task.
