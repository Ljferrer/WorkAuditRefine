# Red Team — dead-phase-halt (M1) (2026-06-29)
**Verdict:** CLEARED-WITH-NOTES — two real defects found, reproduced, and patched into the plan (a temporal-dead-zone
`ReferenceError` in the §4.1 catch, and an existing test #71 the change inverts); the 5 "claims-vs-reality" Criticals
were Lead-adjudicated as the known not-yet-implemented misfire, not defects.

## Attack surface
- **Spine (5):** claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
- **Bespoke (4):** `structure-anchors` (line anchors :91/:94/:472 + SKILL :39/:43-46 + #6 teardown position),
  `baseline-repro` (uncaught-rejection-today + harness existence), `escalation-semantics` (HARD_ESCALATION_REASONS /
  decideLand reasoning), `version-enum-baseline` (four version slots @ 0.7.2 + schemas enum).
- **Executed in sandbox:** executable-proof, baseline-repro, version-enum-baseline (each `cp -R` to a throwaway temp
  dir; the real repo was never mutated). Coverage whole: 9/9 probes on-target, 0 off-target, 0 dropped.

## Executed proof
- **executable-proof (Opus):** applied the plan's §4.1 wrap verbatim to a sandbox copy and drove the forced `:94`
  throw → `THREW (uncaught rejection): landed is not defined` (the catch references accumulators still in their TDZ).
  Proved the fix: hoisting `const landed/escalated/minorsFiled/auditLog` above `try {` → `RETURNED … held:workflow-error`
  (Test 1 GREEN). Then ran the full `.mjs` suite with the hoisted impl → `tests 272 / pass 271 / fail 1` (existing #71).
  All 10 `*.test.sh` runners PASS.
- **baseline-repro (Opus):** confirmed there is **no** enclosing try/catch today (the `:94` throw escapes) and the
  `runPhase`/`buildSeqImpl`/`new AsyncFunction` harness exists and is drivable. `status:pass`.
- **version-enum-baseline (Opus):** all four canonical slots read `0.7.2`; schemas.md `landDecision` enum currently
  lists 3 values (so the 6-value extension, incl. the pre-existing `held:land-failed` doc gap, is real). `status:pass`.

## Findings
### Critical
- [Critical · REAL · patched] **§4.1 catch references accumulators in the temporal dead zone.** The catch returns
  `{ landed, escalated, minorsFiled, …, auditLog }`, but those `const` declarations sit *inside* the wrapped body
  (near `:107-108`), *after* the `:94` throw point. On the early throw the catch runs while they are in their TDZ →
  `ReferenceError: landed is not defined`, **no envelope returned**, Test 1 fails RED→RED. Evidence: reproduced
  `THREW (uncaught rejection): landed is not defined`; proven fix returns the envelope. **Resolution:** plan patched —
  T1 Files + Step 3 now require **hoisting** the four accumulator declarations above `try {` (landResult/servitorResult
  stay literal `null`, no hoist). This was the single most important catch: without it a worker following the plan
  literally ships a catch that throws on the very surface (#1) it is meant to handle.

### Major
- [Major · REAL · patched] **Existing test #71 is the exact inverse of the new behavior; the "additive / suite stays
  green" claim is false.** `#71` (`workflow-template.test.mjs:1107`, `task missing branch/worktree AND derivation args
  throws with a clear message`) uses `assert.rejects` to require the `:94` throw to **propagate**; the new catch
  converts it to a **returned** `held:workflow-error` envelope, so #71 fails `Missing expected rejection`
  (`272/271/1`). Matches memory `fail-closed-gate-silently-redirects-existing-failure-tests`. **Resolution:** plan
  patched — T1 Files + Step 1 (new Test 3) + Step 4 + Test-plan table + Regression-guard now list #71 and require
  rewriting it to assert the **envelope shape** (kept specific, not "did not throw"), and correct the "additive /
  stays green" wording.

### Minor
- [Minor · patched] **Anchor drift `:472` → `:474`.** `:472` is the servitor agent-call brace; the final phase
  `return` is `:474`. Plan re-anchors by named construct anyway; literal updated to `:474` for drift-resistance.
- [Minor · patched] **escalation-semantics note overstated the mechanism.** The plan said adding `workflow-error` to
  `HARD_ESCALATION_REASONS` "would make `decideLand` return `held:escalation` and clobber the direct set" — but the
  exported `decideLand()` is **never called by the template** (the logic is mirrored **inline** near `:413-415`), and
  the catch returns directly, exiting the whole function. The *conclusion* (leave `HARD_ESCALATION_REASONS` alone) is
  right; the *reason* was imprecise. Step 3 note rewritten to the separation-of-concerns framing (conflating the
  exceptional direct-return path with the normal-path machinery), not a present clobber.
- [Minor · note, no patch needed] **#6 teardown is not an observable `agent()` call.** Teardown is inline; the suite
  already has the structural idiom `cleanup = calls.find(c => /…teardown…/.test(c.prompt)); assert.ok(!cleanup)`. The
  plan's DP2 already allows the structural fallback; Test 2 now points at this exact idiom.

## Resolutions applied (grill decisions — autonomous, no operator halt)
- 5× claims-vs-reality Criticals ("try/catch not in repo", "SKILL :39 has 4 values", "Checkpoint lacks §4.2/§4.3",
  "schemas enum has 3 values", "version still 0.7.2") → **adjudicated as the not-yet-implemented misfire**
  (`redteam-claims-vs-reality-misfires-on-impl-plans`): these describe work the plan exists to perform; the live repo
  *should* lack them pre-implementation. **Non-defects — no patch.** (version-enum-baseline independently confirmed the
  0.7.2 baseline is correct, not a regression.)
- TDZ Critical → hoist instruction added to T1 Files + Step 3.
- #71 Major → #71 rewrite added across T1 Files / Step 1 / Step 4 / Test plan / Regression guard.
- 2 actionable Minors → anchor `:474` + escalation-semantics note precision patched.

## Residual risk
- The fix for both REAL findings was **proven in-band** by the same `executable-proof` probe that found them (the
  hoist returns the envelope; the #71 rewrite is the stated fix). No separate re-verify probe was run; `/war`'s own
  gate is the backstop (no hoist → Test 1 RED; no #71 rewrite → `.mjs` suite RED).
- T2 (SKILL.md/schemas.md prose) and criteria #2-5,7 remain prose-verified by design (DP2; no deterministic Lead-side
  harness) — unchanged by this red-team.
- Coverage was whole (no INCOMPLETE); no off-target/dropped probes.
