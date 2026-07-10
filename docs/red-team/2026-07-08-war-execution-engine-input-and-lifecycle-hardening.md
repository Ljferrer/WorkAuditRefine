# Red-team report — war-execution-engine-input-and-lifecycle-hardening

**Plan:** `docs/plans/2026-07-08-war-execution-engine-input-and-lifecycle-hardening.md`
**Source spec:** `docs/specs/2026-07-08-war-execution-engine-input-and-lifecycle-hardening-design.md`
**Repo baseline:** `dev/2026-07-08-war-execution-engine-input-and-lifecycle-hardening` @ `af171d4` (stacked on plans 1–8)
**Run:** `wf_4eb46eb9-894` · **Date:** 2026-07-10

## Verdict: **CLEARED-WITH-NOTES**

16 probes — 12 pass, 1 fail, 3 warn. One **Major** (dependency-feasibility, confirmed) resolved by an in-place plan patch; five **Minor** count/coverage findings corrected in the same pass. No blockers survive.

## Findings & resolutions applied

**F1 — Major (dependency-feasibility, probe fail).** Task 1.2(B) instructed "wrap the `const A = …` parse in the existing entry `try{}` and throw a named error → the existing catch routes `held:workflow-error`." But `const A` (L123) and `const { phase: ph } = A` (L124) sit **above** the try (L298), and both the normal return (L1611) and the catch (L1616) render `phase: ph.id`. Verified directly against `af171d4`: a scalar arg (`args='null'`) makes the guard throw **before** `ph` is assigned, so the catch's `ph.id` is a **secondary `TypeError`** (or a `ReferenceError` if the destructure moves into the try and `ph` becomes block-scoped) — *not* the clean `held:workflow-error` End state 2 promises. The codebase already hoists catch-referenced vars above the try (`landed`/`escalated`, L275 comment), but not `ph`.

**Resolution (AFK).** Patched Task 1.2(B): move the parse + destructure to the top of the try, hoist `let phaseId = null` above the try (mirroring the existing hoist idiom), set `phaseId = ph?.id ?? null` after a successful guard, and change **both** return sites' `phase:` field from `ph.id` to `phaseId`. A scalar/malformed arg now renders a clean `held:workflow-error` with `phase: null`, never a secondary crash. End state 2 updated accordingly. Re-verified by inspection against the actual entry try/catch structure; the fix aligns the plan with the same temporal-dead-zone hoist the code already uses.

**F2–F6 — Minor (count + coverage).**
- **Non-awaited `runSeat` spawn (executable-proof).** Task 1.2(C)'s "rename every `await agent(`" mechanically misses the auditor-seat dispatch `const runSeat = seat => agent(auditPrompt(...), {...})` at ~L582 (no `await`), so `auditPrompt()`'s interpolated fields would escape the undefined-render guard — contradicting the plan's "every interpolated field" intent. **Patched:** Task 1.2(C) + Method now say "every `agent(` spawn site (awaited or not — incl. the non-awaited `runSeat`)".
- **Spawn-site count.** Plan said "17 at conversion / verified"; actual = 19 `await agent(` + 1 non-awaited = ~20. **Patched** to ~20 (count marked non-authoritative) in Method, Task 1.2(C), and Notes delta 4.
- **Die count.** Task 1.4(E) said "17 sites carrying 3/4/5/6/7"; actual = 18. **Patched** to 18 (count non-authoritative), and added a note that code 3 is overloaded (`ensure-integration` foreign-branch dies AND `land-advance` no-advance dies both catalogue to `EX_FOREIGN`=3 — halt-semantics identical; the grep-assertion enforces catalogued constants, not per-site semantic uniqueness).

## Verified (held at the tip)

Scaffold args-parse block (Task 1.1); `war-config.mjs` `isObj` + `memory`-block idiom + `KNOWN_OVERRIDES` loop (Task 1.3); provision-worktrees `cmd_ensure_exclude`/`cmd_ensure_integration`/coded dies (Task 1.4); `inject-campaign-state.sh` `xargs ls -t` + fail-open guards (Task 1.5); **ADR-0005 enum discipline** — the plan routes to the *existing* `held:workflow-error` and adds no enum member, and does not add it to `HARD_ESCALATION_REASONS` (verified in `land-decision.mjs`); ADR 0034 next-free + 0013/0003/0005/0008 present (Task 1.7); the args-guard both-sites drift-guard ships in Task 1.2 with the correct Task 1.1 wave-edge dep; backstop-legitimacy — all 4 deferrals justified with named runners (one an explicitly-accepted residual recorded in ADR 0034).

## Residual risk

- Four ratified backstops carried into the `/war` handoff (undefined-render false-positive burn-in; live `--reclaim-empty-orphan` on a real half-run orphan; `ensure-exclude` explicit-arg live wiring; concurrent same-plan runs vs reclaim — accepted residual per ADR 0034) — each a legitimate deferral with a named runner.
