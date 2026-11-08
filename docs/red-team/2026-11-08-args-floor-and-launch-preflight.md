# Red Team — docs/plans/2026-11-08-args-floor-and-launch-preflight.md (2026-11-08)
**Verdict:** ADJUDICATED — every blocker and needsDecision was patched in the plan and stamped, not re-verified by a probe re-run.
**Rounds:** 1

## Attack surface
Spine: claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility, intent-vs-plan. Bespoke: red-at-base, baseline-suites-green, floor-slice-fidelity, staged-cap-headroom, anchor-check-constructs, default-flip-old-absent, unguarded-new-mirror, guard-split-deps-edge, touched-doc-fact-coverage, backstop-and-judge-legitimacy, sibling-plan-interplay. Executed in sandbox: executable-proof, red-at-base, baseline-suites-green, floor-slice-fidelity, staged-cap-headroom, default-flip-old-absent. Artifact kind: `impl-plan`. Seed rounds: 0. Round limit: 3 (default).
Fallback: none.

Gate: 17 probes, 17 on target, 0 dropped. 6 pass, 2 fail, 9 warn.

## Executed proof
- baseline-suites-green → the suites the plan names are green at the measured base (throwaway `git clone --no-hardlinks`).
- floor-slice-fidelity → the plan's floor-block slice matches the template construct it names.
- staged-cap-headroom → arm (p) room was 459 B at 279a0d4a. Re-measured by the patch at a0051623: 64 B.
- red-at-base → End states 21 to 25 are red at the base as declared. The E24 doc check was too loose (Minor, patched).
- default-flip-old-absent → the old `--force` phrases survive on surfaces the plan did not guard (fail, patched under operator ruling 3).
- executable-proof → the E14, E17 and E24 greps passed on text that does not carry the claim (Minor, patched to anchored case-insensitive greps).

## Findings
### Blockers (all stamped `adjudicated: true`)
- [Major] coverage-vs-source: Evidence consumed had no per-issue rows for #2673, #2674, #2675, #2677, and #2328 was never recorded as read. Resolution: rows added, #2328 recorded as read with why it does not cover #2674.
- [Major] dependency-feasibility: the SKILL.md size guardrail used the literal 64,911 B, but the file is 65,051 B at a0051623. Resolution: the guardrail measures the file at the phase base (`git merge-base HEAD origin/master`).
- [Major] intent-vs-plan: the Binding guardrail did not name the `tokenRe` underscore-boundary change. Resolution: the guardrail names it, plus the FLOOR_BINDINGS clause for the sibling's eighth bound name.
- [Major] intent-vs-plan: Purpose and Method did not cover End states 22 to 25. Resolution: operator ruling 1, one sentence added to each.
- [Major] default-flip-old-absent: T1.3 flips the `--force` default but no check proves the old phrases absent on every surface. Resolution: operator ruling 3, E13 guards three surfaces plus GLOSSARY.md with OLD-absent asserts, and new End state 26 (owner T1.4) covers SKILL.md.

### needsDecision (all stamped `adjudicated: true`)
- touched-doc-fact-coverage, GLOSSARY **Staged-script sidecar** term: bound by the E13 guard (ruling 3).
- touched-doc-fact-coverage, GLOSSARY **Provenance stamp** term: the `planFile` key is bound to the template. The red-team form stays a pointer to schemas.md (operator ruling, see below).
- touched-doc-fact-coverage, SKILL.md staging `--force` sentence: de-mirrored, it names no flag or suffix and points at staged-script.md (ruling 4).
- touched-doc-fact-coverage, staged-script.md `exit 1 ⇒` and dispatch-shape sentences: de-mirrored on the #1776 presence pins plus E24's grep (ruling 4).
- backstop-and-judge-legitimacy, End state 8: `judge:` converted to a `check:` that reuses the E1 test (ruling 2).

### Minor (open notes, not gating)
- The E14, E17 and E24 greps were unanchored and case-sensitive. Patched.
- Header scope, T1.1 and T1.2 served lists, and the measured-base line drifted from the End states. Patched.
- The ADR 0037 `3. **` heading line must stay for the stager doc test's extractor. Kept.
- PIN-12 said "seven bound names". Patched to include any FLOOR_BINDINGS name.

## Resolutions applied (grill decisions)
- Purpose and Method do not cover E22 to E25 → widen both (ruling 1) → Commander's Intent.
- End state 8 is judged but commandable → convert to a check reusing the E1 fixture (ruling 2) → End state 8, T1.1.
- Old `--force` phrases survive → GLOSSARY.md joins the E13 guard with OLD-absent asserts on every surface (ruling 3) → End state 13, End state 26, T1.3, T1.4.
- SKILL.md and staged-script.md restate stager facts → de-mirror on the existing presence pins (ruling 4) → A25, T1.3, T1.4.
- Ruling 3 applied in part for GLOSSARY Provenance stamp → keep the red-team form as a pointer to schemas.md, so T1.3 stays in wave 1 → A25, T1.3.
- Ruling 3 needs ADR 0037 decision 3 reworded → allow the in-place rewrite of the body clause and the 2026-09-06 amendment. Decision 2 and the #2300 amendment stay byte-unchanged → T1.3.

## Adjudications
- SKILL.md size ceiling = `git show <phase base>:skills/war/SKILL.md | wc -c` supersedes the literal 64,911 B — Constraint 4, End state 16 — operator-ratified (2026-11-08)
- GLOSSARY Provenance stamp binds only `planFile`, red-team form is a pointer to schemas.md supersedes "binds the provenance-stamp forms" — A25, T1.3 — operator-ratified (2026-11-08)
- ADR 0037 decision 3 body and its 2026-09-06 amendment are reworded in place supersedes append-only amendment practice for this ADR — T1.3 — operator-ratified (2026-11-08)

## Residual risk
- Staged-template room under arm (p) is 64 B at a0051623. T1.2 spends about 33 B, which leaves about 31 B. Sibling plans fund their own bytes. Re-measure at launch.
- The patch did not re-run `node --test` in a sandbox. Red-at-base facts were re-checked by `git show` greps only (TRIAL-6).
- Escape guard exit 1 after the run was a foreign delta: branch `fix/2615-fingerprint-d8-wall-time`, created by another session's item-34 worktree inside the run window. Provenance cleared as foreign, recorded, not deleted. No probe-authored residue.
