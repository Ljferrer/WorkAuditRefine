# Red-team report — guard-floor-and-scope-hook-coverage-completeness

**Plan:** `docs/plans/2026-07-08-guard-floor-and-scope-hook-coverage-completeness.md`
**Source spec:** `docs/specs/2026-07-08-guard-floor-and-scope-hook-coverage-completeness-design.md`
**Repo baseline:** `dev/2026-07-08-guard-floor-and-scope-hook-coverage-completeness` @ `b63b762` (stacked on plans 1–6)
**Run:** `wf_5beb4a06-14b` · **Date:** 2026-07-09

## Verdict: **CLEARED-WITH-NOTES**

One **Major** (confirmed by 6 probes, one `needsDecision`) surfaced an inverted premise in Task 1.3 and was resolved by an in-place plan patch (rescope, not drop). No blockers survived.

## Attack surface

15 probes — 6 spine + 9 bespoke (delta-claim anchors + drift-guard + backstop-legitimacy). **9 pass, 6 fail** (all six fails were the *same* Task 1.3 issue). Executed: 2 (`executable-proof` ran the guard suite; `anchor-resolvegate-output` ran the gate resolver). On-target: 15/15. Off-target/dropped: 0.

## Findings & resolutions applied

**F1 — Major / needsDecision (claims-vs-reality, executable-proof, consistency-placeholders, dependency-feasibility, intent-vs-plan, baseline-switch-origin-comment-only).** Task 1.3, End-state 3, the Method paragraph, and Notes conversion-delta #1 all asserted that `skills/war/assets/refinery-surface.test.sh` has **no** `switch origin/` scan (comment-only) and that the spec's "ABSENCE CHECK 2 + 3 closed" claim was "false against the tree" — directing the worker to *add* the switch-scan arm as ABSENCE CHECK 3.

**Reality (verified directly by the Lead against `b63b762`, not merely trusted from the probe):** `refinery-surface.test.sh` already carries a **live, green ABSENCE CHECK 3** scanning `switch origin/` (lines ~210–234: `grep -n 'switch origin/' … | grep -v '--detach'`, fail arm "BARE SWITCH DETECTED"), mirroring ABSENCE CHECK 2 (`checkout origin/`, lines ~155–178) exactly; the file header (lines 10–11) already names both verbs. The `executable-proof` probe *ran* the suite and got two green `ok - absence check` lines (checkout + switch). The spec was accurate; the plan's "operator-ratified delta" inverted it. As written, Task 1.3 would no-op or add a **duplicate/colliding** ABSENCE CHECK 3.

**Resolution (AFK self-adjudication — reduce, not drop).** The Lead confirmed the one genuinely-absent piece: there is **no enumerating verb-class maintenance comment** (the "equivalence class is `checkout | switch`; a new equivalent verb must be added to BOTH the comment and the scan" standing reference — the anchor Task 1.9's CONTEXT.md "Verb equivalence class" term points to). Patched in place:
- **Task 1.3 slice** rewritten: the `switch origin/` scan already exists and is green — **do not re-add**; the residual work is only the enumerating verb-class maintenance comment atop the git-surface absence block. `requiresTest` → **false** (comment-only, behavior byte-unchanged).
- **End-state 3, Method, Notes delta #1** corrected to state both scans already exist/pass and the spec's ABSENCE CHECK 2+3 claim was accurate; the retraction is recorded in Notes delta #1 as an explicit RED-TEAM CORRECTION.

Re-verified against the tree by inspection: both scans present + green, enumerating comment absent, plan now aligned with primary evidence. The task retains real, non-duplicate work and preserves the CONTEXT.md anchor.

## Passed (notable)

All other delta/anchor claims held at the tip: the pre-`case` `*/../*|*/..` reject arm (Task 1.1); `war-pipeline-structure.test.sh` carries the `war-survey-corps` guard (Task 1.4 delta 3); `war-config.mjs validate()` charset guard + null default (Task 1.5); `resolveGate` output emits the `find … -not -path` clause excluding node_modules/.git/.claude + `skills/**/*.test.mjs` (Task 1.6); `REL_GUARD_PRECONDITION_FAILED` is a real emitted marker (Task 1.8 delta 4); ADR 0017 target exists and 0031 is the next free number (Task 1.9); Task 1.8's mirror ships its both-surfaces drift assert in the same task (drift-guard pass); default-flip-old-absent vacuous. Backstop-legitimacy: all 4 deferrals justified with named runners.

## Residual risk

- Four ratified backstops carried into the `/war` handoff (stderr-marker prompt-layer rule; path-contract convention for unconfined agents; meta-guard allowlist discipline; guard-suite hermeticity across environments) — each a legitimate deferral with a named runner.
