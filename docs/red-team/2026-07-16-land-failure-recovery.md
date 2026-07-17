# Red-team report — 2026-07-16-land-failure-recovery

**Verdict: CLEARED** (after one grill→patch→re-verify round).
Plan: `docs/plans/2026-07-16-land-failure-recovery.md`
Source spec: `docs/specs/2026-07-16-land-failure-recovery-design.md`
Artifact kind: `impl-plan`. Run: `--afk` (campaign 2026-07-16-engine-integrity-and-sweep-debt, plan 1/5).

## Attack surface

8 probes round 1: 6 spine lenses (claims-vs-reality, executable-proof, coverage-vs-source,
consistency-placeholders, dependency-feasibility, intent-vs-plan) + 2 bespoke
(anchor-preconditions, baseline-repro). Mandatory `ff-topology` **not derived** — the plan anchors
no per-task evidence on git merge-commit topology (its End states are test-run + source-grep based;
the recovery prose's `merge --no-ff` / `--is-ancestor` are manual-land steps, not per-task
merge-topology evidence). Drift-guard spine probes: `unguarded-new-mirror` **pass** (the new
stage-workflow.mjs↔template-meta mirror ships its guard in the same task — Task 1.1 End state 8's
imported-constant anchor test); `default-flip-old-absent` **vacuous** (no default-flip task).
Backstop-legitimacy check: both `## Deferred validations (backstops)` entries legitimate (concrete
deferral reason + named runner/timing; not the AI-declared heading, so no operator-attention Minor).

## Executed proof

Round 1: 8 probes, 2 executed in throwaway sandboxes. Baseline claims proven green at base
(land-decision.test.mjs, workflow-template.test.mjs, version-slots.test.mjs; workflowEmitted() = 6
values; the §4.3 held:land-failed bullet carries no `resumeFromRunId` token today — the
provably-red precondition holds; every Land-phase mock returns a routed `mode:'land-phase'` status,
so the zero-flip claim holds). Round 2 (re-verify): 4 probes (the 2 blocker-producing spine lenses
+ 2 bespoke), all **pass**, gate CLEARED (4/4 on-target).

## Findings and resolutions applied

Two Major, adversarially-CONFIRMED blockers — both in the §4.3 `held:land-failed` region, both
patched in place:

1. **Drift-guard pin anchored on the wrong literal (Major, executable-proof + both bespoke).** End
   state 4 and Task 1.2 specified extracting the SKILL.md bullet by its `` **`held:land-failed`** ``
   bold header "ending at the next `- **` bullet header". That compact-wrap literal is *schemas.md*'s
   form (line 321) and does not occur in SKILL.md (`grep -c` → 0); SKILL.md's real header (line 142)
   is `` - **`held:land-failed` — root-cause-branched auto-recover, else hold.** `` (2-space indent,
   phrase-wrapping bold). And "next `- **`" truncates the region at the nested `    - **(a)`
   sub-bullet, so the pin would be **red-forever / vacuous** — it could never see the new (c) +
   anti-`resumeFromRunId` clause. **Resolution:** patched End state 4 and Task 1.2's drift-guard-pin
   prose to anchor on the real 2-space `` - **`held:land-failed` `` token-only prefix and terminate at
   the next **same-indent** 2-space `- **` sibling (`- **Escalation-completion land`, line 147), so
   the region spans lines 142–146. Re-verified: pass.

2. **Adding root cause (c) leaves the bullet's enumerations self-contradictory (Major,
   consistency-placeholders).** The live bullet opens "**Two independent root causes auto-recover**"
   (line 142), with "Green-gate guard (both branches)" (145) and "Every other cause stays a hold —
   … neither the collided checkout nor absent on origin" (146). Task 1.2 added an auto-recovering (c)
   but never updated these three counts — executed literally it ships self-contradictory recovery
   prose, and no test guards the counts. **Resolution:** added an explicit "Enumeration coherence
   (mandatory, same edit)" obligation to Task 1.2 — update "Two" → "Three", soften "both end in a
   single land-advance" to admit (c)'s step-0 already-landed *record* path, retitle "Green-gate guard
   (both branches)" to all three branches, and extend the "Every other cause stays a hold" exclusion
   to also exclude the dead-land-agent case; flagged as a plan-faithfulness obligation (untested).
   Re-verified: pass.

## Residual risk

The Minor anchor-drift variants of finding 1 (from the two bespoke probes) resolved with the same
patch. No residual open questions; no `needsDecision` survived.

## Adjudications

None affecting authoritative values (no version/release-slot literal changed). The three plan
patches are prose corrections to Task 1.2 and End states 4–5.
