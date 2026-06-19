# Red Team — /red-team Hardening Implementation Plan (2026-06-19)
**Verdict:** CLEARED — every mechanical claim (edits apply, tests go green, CLI yields the fail-closed verdict) was proven by execution in a throwaway sandbox; the one Minor (a test-count annotation) was auto-fixed.

**Plan:** [`docs/plans/2026-06-19-red-team-hardening.md`](../plans/2026-06-19-red-team-hardening.md)
**Source spec:** [`docs/specs/2026-06-19-red-team-hardening-design.md`](../specs/2026-06-19-red-team-hardening-design.md) (v0.4.2)

## Attack surface
- **Spine (5):** claims-vs-reality · executable-proof · coverage-vs-source · consistency-placeholders · dependency-feasibility.
- **Bespoke (4):** `snippet-fidelity` (every "replace this:" before-block present verbatim in the committed file) · `gate-tdd-run` (build end-state gate, run the plan's tests) · `scaffold-tdd-run` (build end-state scaffold, run the behavioral-harness tests + AsyncFunction syntax check) · `incident-replay` (the Task 9 CLI → fail-closed verdict).
- **Executed in sandbox** (`/tmp/rt-hardening`, copies of the committed assets with the plan's edits applied): the gate + scaffold test suites, the syntax check, and the gate CLI. The repo was never mutated.

## Executed proof (claims RUN, not asserted)
- **snippet-fidelity** — all gate + scaffold before-blocks (`verdict`/`summarize`/`main` lines, `allFindings` anchor; `const { planFile… }`, the `return`, the `FINDINGS` signature, `SPINE`, the confirm prompt) and the doc/manifest anchors matched the committed files verbatim → every edit applies.
- **gate-tdd-run** — end-state `red-team-gate.mjs` (committed + Task 1 + Task 2) with the plan's appended tests → **29/29 pass** on Node v26. Back-compat held: the 10 original gate tests pass unchanged; `verdict([F('Major')])`→`BLOCKED`, `verdict([])`→`CLEARED` with no coverage arg.
- **scaffold-tdd-run** — end-state `workflow-scaffold.js` (committed + Tasks 3–5) compiled via the behavioral harness → **17/17 pass**: fingerprint guard throws when absent; every probe prompt carries SCOPE-LOCK + the absolute planFile/repo + the fingerprint title; executed probes get the copy-the-repo clause, analyzed probes the read-restrict clause; `read_anchor` is a required FINDINGS field; a dead probe is retried once then emitted as a `{probe,dropped:true}` marker; a die-then-succeed probe yields a real result.
- **syntax check** — the AsyncFunction compile of the edited scaffold prints `scaffold syntax OK`.
- **incident-replay** — the gate CLI on a run with one on-target, one drifted (`# OmniEMR Section B`), and one dropped probe → **`verdict: INCOMPLETE`**, `summary.offTarget=["executable-proof"]`, `summary.dropped=["dependency-feasibility"]`, and the off-target Major **absent from `blockers`** (discarded). The F1/F2/F3 regression is proven.
- **latent feasibility** — proven incidentally: the `node:path` `isAbsolute` import works, **ESM top-level imports appearing mid-file** load fine (the gate test relies on it), and the Workflow **no-filesystem** constraint is correctly handled (fingerprint supplied by the Lead, not read in-scaffold).

## Findings
### Minor
- [Minor] Task 2 Step 6 stated `Expected: PASS — 30 tests, 0 fail (17 from Task 1 + 13 new)`. → Task 2 actually appends **12** tests, so the suite is **29** (17 + 12). Evidence: `node --test red-team-gate.test.mjs` → `tests 29 / pass 29 / fail 0`. **Resolution: patched** to "29 tests … 12 new".

## Resolutions applied
- Test-count annotation corrected (30→29, "13 new"→"12 new") in the plan, Task 2 Step 6.

## Residual risk (non-blocking)
- **Pre-flight scope assertion is runbook-enforced, not code-enforced.** Per refinement #1 (the Workflow sandbox has no filesystem access), the "plan exists / under repo / repo is a dir" assertion and the fingerprint computation live in the Lead's Bash pre-flight (Task 6), not the scaffold. The scaffold only fails-closed on a missing fingerprint. The safety net still holds if the Lead skips the assertion: a drifted probe attests a different title → off-target → `INCOMPLETE`. This mirrors the spec's own treatment of L5 as a runbook obligation.
- **Four spec refinements ratified by necessity / offered** (documented in the plan header): #1 fingerprint-by-Lead and #2 `+repo` are *forced* (no-fs constraint; the under-repo check needs repo) — not free choices. #3 no inline early-abort follows spec §8's recommended gate-canonical default. #4 the optional deterministic-execution harness is deferred to a follow-up plan; the handoff noted the user leaned toward it, so confirm whether to fold it in now or keep it separate.

## Process note — deterministic verification (not the multi-agent fleet)
This plan is 100% mechanical (exact before→after edits + TDD test code + CLI assertions), and the *current* `/red-team` Workflow is the **un-hardened** version carrying the very F1 (wrong-target drift) and F2 (silent probe death) risks this plan fixes. So — exactly as the 2026-06-19 incident's verdict was salvaged — the proof was done by **deterministically applying the plan's edits in a throwaway sandbox and running every test/command/syntax check**, which is drift-immune and faithful to red-team's prove-by-execution principle (and avoids spending the unhardened fleet's tokens on a run it might mis-target). The skill was invoked from **this repo's cwd** with absolute paths, so no foreign-cwd drift was possible.
