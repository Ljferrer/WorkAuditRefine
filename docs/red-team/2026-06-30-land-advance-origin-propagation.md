# Red Team — land-advance-origin-propagation (#251) (2026-06-30)
**Verdict:** CLEARED — 3 CONFIRMED Major blockers found in the plan's own test recipes; all patched in place and re-verified green in throwaway sandboxes.

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke: snippet-fidelity (analyzed), readback-tdd (executed), cwd-pin-tdd (executed).
Executed in sandbox: executable-proof, readback-tdd, cwd-pin-tdd — each in a `cp -R` copy of the repo; the source worktree was never mutated. Provision: none (no `.war-provision.json`).

## Executed proof
- **readback-tdd** (Phase 1): with the *patched* T2.5 recipe — RED pre-fix (no-op push exits 0, local follower advances, both assertions fail), GREEN post-fix (exit 3, local unchanged). Full suite 166/166 → 2 RED pre-fix → 168/168 post-fix; T2.1–T2.4 green throughout.
- **cwd-pin-tdd** (Phase 2): with the *patched* backtick-anchored negative assertion — RED pre-pin (rendered prompt carries a backtick-led bare `provision-worktrees.sh land-advance dev/…`), GREEN post-pin; existing `/land-advance/` match stays green; 2A submodule note (no `provision-worktrees.sh ` prefix) cannot satisfy/trip either assertion (Task-5 fixture is the non-submodule path).
- Live anchors (claims-vs-reality + manual pre-flight): all "before" snippets present verbatim at tip — `cmd_land_advance` push-success block, bare step-3 string, 2A note, `HARD_ESCALATION_REASONS` excludes `'error'`, `error||gate_failed → held:land-failed`, README `## Status` `**0.8.0** … Builds on v0.7.8.`, four version slots all `0.8.0`.

## Findings
### Major (all CONFIRMED, all resolved)
- **[Major] Phase 1 Step 1 T2.5 recipe never reproduces the no-op push (blockers #1 executable-proof + #2 readback-tdd, same root cause).** "Produce NEW_SHA5 in clone1 as T2.2 does" commits on clone1's default branch and advances ambient `HEAD` off the seed; the subsequent call then does a *real ff push* that moves origin, the readback sees `origin == new_sha`, and the case exits 0 — so T2.5 fails on both assertions **even with the fix present** (line-78 parenthetical "the seed leaves clone1's checkout on the SEED commit" is false). Evidence: literal recipe with fix applied → exit 0 (asserts 3), local advanced. → **Resolution:** patched the recipe to capture `SEED5` and `git -C "$C1_5" checkout -q "$SEED5"` before the call; corrected the parenthetical and the Step-2 narrative.
- **[Major] Phase 2 Step 1 negative assertion is vacuous (blocker #3 cwd-pin-tdd).** The "no bare call remains" regex keys on the literal `${ph.workingBranch}`, but the test inspects the *rendered* prompt where it is already interpolated to `dev/…`, so `!regex.test(p)` is unconditionally true (the exact `weak-test-assertion` trap the plan cites two lines above). → **Resolution:** re-keyed the negative assertion to a backtick-anchored regex on the rendered command text (`/`provision-worktrees\.sh land-advance /`), which goes RED pre-pin / GREEN post-pin; updated surrounding prose.

## Resolutions applied (grill decisions — `--afk`, all needsDecision:false, probe-proven)
- Phase 1 Step 1 recipe: capture `SEED5`; add `git -C "$C1_5" checkout -q "$SEED5"`; fix the false parenthetical → plan §"Phase 1 > Task 1 > Step 1".
- Phase 1 Step 2 narrative: clarify no-op push + update-ref follower advance; add the missing-checkout failure mode → plan §"Phase 1 > Task 1 > Step 2".
- Phase 2 Step 1: replace the vacuous `${ph.workingBranch}`-keyed negative assertion with a backtick-anchored one; update the precision note → plan §"Phase 2 > Task 2 > Step 1".

## Residual risk
- **Discarded misfire (tracked):** `snippet-fidelity` returned 6 "change not yet applied" findings (the plan's proposed edits reported as missing). These are not defects — the plan hasn't run yet — and the gate dropped them (no `severity`). Root cause filed as **Ljferrer/WorkAuditRefine#311** (red-team probes don't separate before/precondition snippets from the proposed after-state deliverable). No bearing on this plan's verdict.
- **Open question carried by the plan (operator to adjudicate, no code change):** the v0.8.0 submodule 2A path invokes `land-advance INSIDE ${submodLandTask.targetRepo}`; Phase-1's shared readback now also governs that path. Confirm the 2A invocation passes a working-branch ref `ls-remote` can resolve on the submodule remote (else a spurious `exit 3`). Documented in the plan's Phase-2 NOTE; not touched by this fix.
