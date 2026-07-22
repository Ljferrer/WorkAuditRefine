# Red-team report — `/lessons-learned seed` (portable seed corpus, warm-seeding, issue-borne contribution)

- **Plan:** `docs/plans/2026-07-22-lessons-learned-seed.md`
- **Source spec:** `docs/specs/2026-07-22-lessons-learned-seed-design.md`
- **Repo verified:** session worktree level with `origin/master` @ `f890e8b` (= the base `dev/2026-07-22-lessons-learned-seed` was cut from; identical plan content)
- **Date:** 2026-07-22
- **artifactKind:** `impl-plan`
- **Run:** Workflow `wf_ec25c14c-174` (task `w2pajv2zq`) · model `opus` · effort `high` · 7 agents, 0 errors, 456,729 subagent tokens

## Verdict: **CLEARED**

Gate output (`red-team-gate.mjs`): 7 probes / 7 pass / 0 fail / 0 warn · onTarget 7 / offTarget 0 / dropped 0 · **0 blockers, 0 needsDecision, 0 minors**. Post-run escape guard (`assert-no-repo-escape.sh`) exit 0 — no probe leaked its throwaway sandbox.

## Attack surface

| Probe | Kind | Technique | Status |
|---|---|---|---|
| claims-vs-reality | spine | analyzed | pass |
| executable-proof | spine | executed | pass |
| coverage-vs-source | spine | analyzed | pass |
| consistency-placeholders | spine | analyzed | pass |
| dependency-feasibility | spine | analyzed | pass |
| intent-vs-plan | spine | analyzed | pass |
| anchor-load-bearing-preconditions | bespoke | analyzed | pass |

- **Executed proof:** 1 executed probe (`executable-proof`) ran the plan's runnable artifacts in a throwaway `mktemp` copy of `skills/ docs/ CONTEXT.md README.md .claude-plugin/`; real repo untouched.
- **`ff-topology`:** not applicable — the plan anchors no per-task evidence on git merge-commit topology (`^1`, `--first-parent`, three-dot floor base, or "merge commit" prose). Not run (correct).

## Bespoke precondition verification (`anchor-load-bearing-preconditions`) — all pass

Every existing-code precondition the plan's edits/imports attach to was confirmed present verbatim:
1. `skills/_shared/war-memory.mjs` exports `lint` (L83) and `findNearDupes` (L532) — call shapes match Task 1.1's use.
2. `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` present, `doc-contract:`-prefix convention, `import.meta.url` repo-root idiom (Task 1.2 mirror / Task 2.2 extend).
3. `skills/lessons-learned/SKILL.md` `## tighten mode` section (L45) + verbatim sentinel **"Any other argument text (or none) means a normal housekeeping pass."** (L121) — Task 2.2's insertion window (seed mode section slots between them) is valid.
4. `skills/war-help/SKILL.md` present; orientation card mentions `/lessons-learned` (Task 2.4 anchor).
5. `skills/war/assets/version-slots.test.mjs` present; four version slots exist as described (Task 3.1 arbiter).
6. `CONTEXT.md` `### Memory` section (L948) present (Task 2.3 anchor).
7. `resolveGate` exported from `skills/war/assets/war-config.mjs` (L356).

## Lead-run doctrine checks

- **Drift-guard `unguarded-new-mirror`** — VACUOUS (auto-pass): no task edits `workflow-template.js` or adds a new inline mirror of a `land-decision.mjs`/`war-config.mjs` canonical export.
- **Drift-guard `default-flip-old-absent`** — VACUOUS (auto-pass): no default-flip / scope-narrow task. Task 3.1 is a coordinated four-slot version bump already lock-step-guarded by `version-slots.test.mjs` (a stale OLD slot fails the test).
- **Backstop-legitimacy check** — plan carries `## Deferred validations (backstops — AI-declared)` (5 entries). Each is legitimate: concrete deferral justification, no over-broad deferral (each names its fixture / doc-contract proxy where one exists), named runner + timing. No `needsDecision`. Per ADR 0014, each earns one advisory Minor (below).

## Findings / Resolutions applied

None. No Critical/Major/needsDecision surfaced; plan not patched.

## Residual risk — AI-declared backstops (operator attention, ADR 0014)

The plan's Commander's Intent was operator-confirmed on 2026-07-22, but its deferred validations were self-adjudicated in an unattended pass (AI-declared heading variant). Each of the 5 deferred validations is a legitimate deferral, flagged here for operator awareness — an AI drafted the waiver; no human has ratified it. Human upgrade path: `/war-strategy docs/plans/2026-07-22-lessons-learned-seed.md`.

1. First live `/lessons-learned seed` on a fresh repo (destination-ask UX, PR delivery, projection-warn surfacing) — runner: operator, first post-release warm-seed.
2. Live agent-mode behaviors of spec §10 criteria 3(b)/5/6/7 (collision skip, `seededFrom` stamp, nomination exclusions, mode lint-refusal) — directives doc-contract-locked in Task 2.2; runner: operator, first live warm-seed + first nomination.
3. First foreign-repo `seed-candidate` filing (live `gh` auth, label auto-create, real-search dedup) — runner: operator, first foreign-repo nomination.
4. Ingestion sweep against a real contributed issue (fenced-lesson extraction from a third-party body) — runner: operator, first WAR-repo bare pass after a `seed-candidate` issue exists.
5. Archive caps at real scale (≤ 500 / ≤ 100 MB refuse path) — fixture-covered now (criterion 2); runner: operator if the archive ever approaches the cap.

## Adjudications

None — no authoritative value (version/release-slot literal or otherwise) was changed during this red-team.
