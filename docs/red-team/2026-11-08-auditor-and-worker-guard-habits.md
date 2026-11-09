# Red Team — docs/plans/2026-11-08-auditor-and-worker-guard-habits.md (2026-11-08)
**Verdict:** ADJUDICATED — every blocker and needsDecision was patched in the plan and stamped, not re-verified by a probe re-run.
**Rounds:** 1

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: red-at-base, anchor-check, stacked-base-drift, budget-headroom, default-flip-old-absent, hook-row-git-and-bash32. Executed in sandbox: executable-proof, red-at-base, budget-headroom, default-flip-old-absent. Lead-run drift-guard probes: unguarded-new-mirror (vacuous: T1.6 adds prompt constants, not mirrors of a canonical export), guard-split-deps-edge (pass: T1.6 carries `deps: [1.1, 1.5]`), touched-doc-fact-coverage (pass: the /war-review class list and the D8 table are explicit backstop defers). Artifact kind: `impl-plan`. Seed rounds: 0. Round limit: 3 (default). Measured base: `c255269f` (the predecessor plan 2026-11-08-args-floor-and-launch-preflight landed). Mode: `--afk` campaign, Lead self-adjudicated.
Fallback: none.

Gate: 12 probes, 12 on target, 0 dropped. 2 pass, 4 fail, 6 warn.

## Executed proof
- red-at-base → every `check:` End state is red at `c255269f` as declared (pass).
- budget-headroom → card hard-line headroom matches the plan's eviction arithmetic within a few bytes (Minor notes only).
- executable-proof → the T1.5 and End state 15 to 18 prose greps were case-sensitive and single-line, so a re-cased or re-wrapped correct edit fails them, and a re-cased stale phrase passes the absence guard (Major, patched).
- default-flip-old-absent → with End state 15 green, four surfaces still state the main-checkout-only run root: `skills/war-review/SKILL.md` § 1 (wrapped across a line), two `GLOSSARY.md` entries, and the `run-manifest.md` hot-half sentence (Major, patched).
- Lead re-execution after the patch: every new or changed End state 9, 15 and T1.5 Done-when command was run in the plan worktree at `c255269f`. Each presence check prints 0 and each absence check prints a non-zero count, so all are red at base.

## Findings
### Blockers (all stamped `adjudicated: true`)
- [Critical] dependency-feasibility, [Major] claims-vs-reality, [Major] stacked-base-drift (one root): the staged-template cap has 30 B of room at `c255269f`, not 459 B, and T1.6 adds several hundred bytes of prompt constants with no funding and no `stage-workflow.test.mjs` run. Resolution: new T1.6 step (0) and `stage-workflow.test.mjs` in its Done-when.
- [Major] executable-proof: case-sensitive one-line prose greps in T1.5 and End states 15 to 18. Resolution: `grep -ci`, `host[- ]guard`, `run[- ]root`, and `tr '\n' ' '` joins for the absence checks.
- [Major] intent-vs-plan: the Purpose promises a worker is never blocked by the host guard, but backstop row 4 reads only Edit/Write denials. Resolution: backstop row 4 also reads host-guard git refusals for every worker kind and every refiner and auditor seat, and a hit files the A11 fallback as a follow-up.
- [Major] default-flip-old-absent: End state 15 was NEW-present-only for four surfaces. Resolution: T1.5 names the four surfaces plus `sweep-exclusion.md`, End state 15 asserts each absent, and the sweep runs case-insensitive and multiline-safe over `GLOSSARY.md` and `README.md` too.

### needsDecision (all stamped `adjudicated: true`)
- The template-cap root above (three probes).
- coverage-vs-source: the refiner eviction target is the paragraph that already holds the section's pointer and its no-merge, no-push rules. Resolution: do not evict it; take the `## Post-merge evidence dispatch` opener (428 B) or another tier-2 paragraph with no prohibition.
- coverage-vs-source, consistency-placeholders: the auditor card passes 400 B net growth with no named eviction. Resolution: one tier-2 paragraph with no prohibition, into a `references/` file behind a trigger pointer, named in the commit body.
- intent-vs-plan: the host-guard git question above.

### Minor (open notes, not gating)
- `GLOSSARY.md` has 51 B free at `c255269f`, not 455 B, so the A20 fallback is the expected path. Patched in A20 and T1.5.
- `run-manifest.md` carries no `$MAIN/.claude/war/runs` anchor. Its hot-half sentence is now named in T1.5.
- End state 9's `-B6` window missed most of the comment block. Patched to `-B12` and case-insensitive.
- Constraint 8's `git branch -d x` row was not git-valid by its own definition. Patched: the fixture creates and merges `x` first.
- The T1.3 PR red-proof sentence described the wrong row, and the `--prune` branch would call `bounded()` and `safe_aid()` before they are defined. Patched.
- The TRIAL-2 reach walk stopped at E22. Patched to cover E23 to E28.
- End state 6's red-at-base basis grep hit `WMX*` variable names. Patched to the label-anchored grep.
- Predecessor follow-ups #2733 and #2736 sit on files this plan owns. Absorbed: T1.6 rewords the `word-bounded` comment, T1.5 deletes the `defined-but-not-yet-emitted` parenthetical.
- Context still quotes `skills/war/SKILL.md` at 64,911 B. The file grew when the predecessor landed. T1.5's 300 B growth cap is measured from its own phase base, so no task acts on the stale figure.
- Worker card net headroom after T1.6 is about 38 B, as the plan states.

## Resolutions applied (grill decisions, self-adjudicated under `--afk`)
- Template cap → T1.6 injects `AUTHORITY_LINE`, `TOOL ORDER:` and `WORKER_WRITE_TOOL_RULE` once each in `dispatch()`, keeps each constant short and pointing at its card, moves the two trailing `//` comments (289 B) onto full lines, never lowers `ARGS_HEADROOM_BYTES`, and exits PLAN-DEFECT if the growth cannot fit → T1.6 step (0), T1.6 Done when, Notes.
- Prose greps → case-insensitive, hyphen-tolerant and multiline-safe → End states 9, 15 to 18, T1.5 Done when.
- Host-guard git refusals → widen backstop row 4 → Deferred validations.
- Stale run-root surfaces → T1.5 slice, Files and End state 15.
- Card evictions → T1.6 step (5).

## Adjudications
- T1.6 funds its staged-template growth inside the 30 B room by central `dispatch()` injection and comment moves, never by lowering `ARGS_HEADROOM_BYTES`, supersedes "the staged-template cap (459 B of room at 279a0d4a) … unchanged" — T1.6, Notes — AI-declared
- Backstop row 4 reads host-guard git refusals for every worker kind and every refiner and auditor seat, superseding "host-guard Edit/Write denials" only — Deferred validations row 4 — AI-declared
- The refiner card keeps the `## Land-barrier endstate-check dispatch` second paragraph, superseding the PIN-17 and T1.6 (5) eviction of it — T1.6 — AI-declared

## Residual risk
- The template room is 30 B at `c255269f`. If T1.6 cannot fund its growth, it exits PLAN-DEFECT, and the phase holds for a ruling. Plans 3, 4 and 5 add engine bytes against the same cap.
- The Purpose's host-guard promise for git rests on a backstop. No in-repo test can feed the desktop host guard.
- The two executed blockers were closed by the Lead's own re-execution at base, not a probe re-run.
- Escape guard exit 0 after the run. No probe-authored residue, no foreign delta.
