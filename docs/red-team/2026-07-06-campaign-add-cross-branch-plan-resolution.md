# Red-team report — Campaign add cross-branch plan resolution

- **Plan:** [`docs/plans/2026-07-06-campaign-add-cross-branch-plan-resolution.md`](../plans/2026-07-06-campaign-add-cross-branch-plan-resolution.md)
- **Source of truth:** [`docs/specs/2026-07-01-war-companion-skills-design.md`](../specs/2026-07-01-war-companion-skills-design.md) §7
- **Repo:** `.claude/worktrees/peaceful-hamilton-2230cc` (worktree; plan under repo — no foreign-repo warning)
- **Date:** 2026-07-06
- **Verdict:** **CLEARED** (round 1: BLOCKED → 3 blockers patched; round 2 fresh full pass: re-BLOCKED,
  caught 2 self-inflicted regressions + 1 pre-existing → patched → verified by inspection of the probes'
  own proven resolutions)

## Attack surface

- **9 probes** first pass: 6 spine (claims-vs-reality, executable-proof, coverage-vs-source,
  consistency-placeholders, dependency-feasibility, intent-vs-plan) + 3 bespoke
  (sweep-twoline-executed, materialize-commit-handoff, path-form-consistency).
- Coverage whole: **9/9 on-target, 0 off-target, 0 dropped.** Provision: `[]` (plugin/docs repo, no install).
- First-pass gate: **4 pass / 3 fail / 2 warn → BLOCKED.**
- Re-verify pass: **3 affected probes** re-run against the patched plan.

## Executed proof (the load-bearing result)

`sweep-twoline-executed` (executed, throwaway `cp -R` sandbox): ran the existing suite (**29 green**
baseline), **reproduced** the two-line-drop breakage on current `sweep()` — it `.trim()`s the whole blob
and feeds `<path>\nref: origin/master` to `extractFilesFromPlanFile` → `readFileSync` ENOENT — then applied
the plan's exact minimal change (sweep first-line parse, `addToInbox` `opts.ref`, `--ref` CLI) plus the 4
mapped tests → **33 pass**, legacy drop byte-identical, and each mapped test verified to **fail when the
feature is deleted** (weak-assertion discipline). **Task 1 is buildable exactly as written.**

## Findings → resolutions applied

All three blockers clustered on one root: the materialization mechanism (End-state #3, the feature's actual
payload) lived entirely in Lead prose with gaps. None touched Task 1.

1. **Materialization had no lifecycle home / no executable owner** (Major, CONFIRMED). Spec §7.1 jumped Sweep
   → Provision with no insertion point for the promised contract; no test/executable owner.
   → **Fixed:** Task 2 inserts an explicit **Materialize** lifecycle step (SKILL.md + mirrored spec §7.1)
   between Sweep and Provision; Task 1 gains **test 5** (`sweep` throws on a still-missing path) as the
   fail-loud executable owner. Anchors verified present.

2. **Commit-to-`dev/<slug>` handoff promised but unscheduled** (CONFIRMED). Materialized file was untracked
   in the Lead checkout; Task 2's edits only touched step 1 → `/war` worker worktrees (off `dev/<slug>`)
   would never see it → silent runtime failure.
   → **Fixed:** Task 2 now explicitly amends **SKILL.md step 2 + spec §7.1 step 2 (Provision)** to `git add`
   + commit the materialized plan and pulled references onto `dev/<slug>` after branch creation, before
   `/war`. Step-1/step-2 anchors verified present in both files.

3. **Path form** (CONFIRMED). Drop stored an absolute path (`path.resolve`) but git object paths are
   repo-relative; `add` from a foreign cwd resolved against the wrong root.
   → **Fixed:** add-resolution protocol anchors to `git rev-parse --show-toplevel` (never the add-chat cwd),
   defines one repo-relative token `rel` reused by `git cat-file -e <ref>:<rel>` and `git show <ref>:<rel>`,
   keeps line-1 absolute as `toplevel/rel` (Task 1 byte-identical). **Re-verify: pass.**

## Round 2 — fresh full pass (re-triggered) → 3 more, patched

A second full 9-probe pass on the round-1-patched plan returned **BLOCKED** (5 pass / 3 fail / 1 warn), all
on-target — proving the value of a clean-slate re-run. Two findings were **regressions from my round-1
patch**:

1. **Materialize placement contradiction** (claims-vs-reality + materialize-commit-lifecycle, CONFIRMED). My
   round-1 wording called it "a step *between* Sweep and Provision" while the body said it "runs *before*
   sweep." The design forces **before sweep** (`sweep` reads the plan file via `extractFilesFromPlanFile`).
   → **Fixed:** reframed as a Materialize action at the head of step 1, *before* the `sweep` call
   (`[Materialize → sweep() → next]`), everywhere the plan mentions it.
2. **Test 5 was vacuous** (sweep-twoline-executed, Major, executed-proof). The probe *empirically* showed a
   bare `assert.throws(() => sweep(...))` on a missing path passes on ANY throw — it mutated sweep to
   silently swallow the missing file and test 5 still passed, because `assertOrderable`'s "unparseable
   footprint" guard throws instead of the ENOENT backstop.
   → **Fixed:** test 5 now requires `assert.throws(() => sweep(dir), /ENOENT|no such file/)`; the probe
   verified this goes RED when the backstop is deleted.
3. **CLI form conflict** (consistency-placeholders, pre-existing, missed in round 1). Task 1 said `--ref`
   flag; the invocation said positional `[<ref>]`.
   → **Fixed:** stated as two layers — positional at the skill CLI, `--ref` when the Lead shells out to the
   helper.

Round-2 fixes were verified by inspection (deterministic prose-consistency) plus the executed probe's own
proven test-5 resolution, rather than a third full workflow (cost-proportionality).

## Ratified (plan's own open decisions)

- Reference-scan precision — **as proposed** (backticked path-shaped tokens + in-repo markdown links;
  `[[wikilinks]]` excluded). Mirrors the existing `isPathShaped` heuristic; no new surface.
- Warn on delivering-commit touching extra files — **out of scope (YAGNI)**, as proposed.

## Residual risk / notes

- **Materialization stays Lead prose** (per the ratified git-free-helper deviation). Its correctness now rests
  on the SKILL.md recipe being followed *and* the fail-loud backstop (Task 1 test 5), not on a green
  git-integration test. Acceptable given the deviation; the backstop makes a skipped materialization loud.
- **Re-verify adjudication (transparency):** the `materialize-commit-handoff` re-verify probe returned `fail`
  reporting the live SKILL.md/spec "lack the Materialize step / commit directive." This was adjudicated a
  **precondition-vs-deliverable false positive** — those are Task 2's *proposed* edits (not yet executed);
  the real preconditions (step-1/step-2 anchors) exist and the edits are scheduled. Discarded per the skill's
  invariant that proposed-change absence is never a finding.
- **Version slots** (Task 3): no cross-slot consistency test exists (known — memory
  `version-slots-no-cross-slot-consistency-test`); the patch bump touches `plugin.json` ×1, `marketplace.json`
  ×2, README `## Status` by hand. Self-discovers the live version (correct per
  `stacked-release-plan-version-literal-lags-operator-target`).
