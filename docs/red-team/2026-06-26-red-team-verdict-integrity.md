# Red-Team Report — Red-Team Verdict Integrity (#49 · #50 · #85)

**Plan:** `docs/plans/2026-06-26-red-team-verdict-integrity.md` · **Spec:** `docs/specs/2026-06-26-red-team-verdict-integrity.md`
**Date:** 2026-06-26 · **Verdict:** **CLEARED-WITH-NOTES** (1 Major blocker found → patched → resolved)

> Run note: the scaffold was patched parse-if-string (#49) in the scratch copy so the verification Workflow could
> launch — this very plan fixes that bug in the repo. The launch succeeded, confirming the #49 fix is correct.

## Attack surface
6 probes, all on-target (coverage whole: expected 6 / on-target 6 / off-target 0 / dropped 0). 5 analyzed + 1 executed.
Spine: claims-vs-reality (pass), executable-proof (**fail → blocker**), coverage-vs-source (pass), consistency-placeholders
(pass), dependency-feasibility (pass). Bespoke: current-state-anchors (pass — all four cited "before" states match HEAD).

## Executed proof
`executable-proof` copied the repo to a sandbox and applied the plan's **verbatim** gate snippets. Baseline
`node --test skills/red-team/assets/*.test.mjs` = 51/51 green; after the patch the full gate = **229 tests / 1 fail**
(then the `&&` short-circuits, so no `*.test.sh` runs → gate RED). All other artifacts verified green in isolation:
#49 stringified-args threads + malformed→guard + object byte-for-byte; #50 gate pass-Critical→CLEARED /
fail-Critical→BLOCKED / needsDecision-from-pass→BLOCKED / bare-Major→BLOCKED + bucket counts; #50 probe wording +
schema `description` present.

## Findings & resolutions applied
- **[Major — RESOLVED] Plan's gate change inverts an existing test it never lists for modification.**
  `red-team-gate.test.mjs:159-162` (`'verdict BLOCKED on full coverage with an on-target Major'`) builds its Major via
  the `onResult` helper (`:105-106`), which **hardcodes `status:'pass'`**. The new `&& f.probeStatus !== 'pass'` filter
  correctly demotes that Major → `CLEARED`, so the assertion fails and the gate goes red. The plan's back-compat list
  only covered *bare* findings.
  **Resolution:** patched Task 2.1 Step 1 — the existing test is added to the edit set and updated so the on-target
  Major rides a **non-pass (`status:'fail'`) probe**, still asserting `BLOCKED` for a genuine defect (preserves intent
  under the status-aware contract). Verified the fix uses the already-proven `fail`-path→BLOCKED behavior; it is the
  only existing test the filter inverts (other `onResult` coverage tests carry no blocker-severity findings).

## Residual risk (notes — non-blocking)
- **[needsDecision → refuted]** OQ2 description-location: the adversarial-confirm stage refuted the claim — the plan
  already resolves OQ2 to "`description` on the `findings` array" and Task 3.1 keys the test on
  `properties.findings.description`. No action; the plan is internally consistent.
- **[Minor]** coverage-vs-source filed 13 confirmations as Minor findings (the #50 bug this plan fixes, observed live) —
  none are defects; all confirm the plan maps the spec faithfully. Adjudicated as noise, not blockers.
- **[Minor]** `README.md` for the version bump is the **repo-root** README (not `skills/red-team/README.md`, which
  doesn't exist) — the release task targets the root `## Status` slot, consistent with the other plans.

**Terminal verdict: CLEARED-WITH-NOTES.** Ready for `/war`.
