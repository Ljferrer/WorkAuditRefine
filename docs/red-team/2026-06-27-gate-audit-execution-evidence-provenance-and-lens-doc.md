# Red Team — Gate-audit Execution-Evidence: sha Provenance + Worktree-Pin + Lens Doc (2026-06-27)

**Verdict:** CLEARED-WITH-NOTES — all 5 Major blockers resolved (spec↔plan drift from the operator-ratified DP5/DP2 decisions + one plan-clarity gap); one out-of-scope residual accepted. Plan ready for `/war`.

Plan: [`docs/plans/2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md`](../plans/2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md) (#193 · #117, v0.7.1)
Source spec: [`docs/specs/2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md`](../specs/2026-06-27-gate-audit-execution-evidence-provenance-and-lens-doc.md)

## Attack surface
Spine (5): claims-vs-reality, executable-proof, coverage-vs-source, consistency-placeholders, dependency-feasibility.
Bespoke (3): `baseline-repro` (executed), `worktree-pin-feasibility` (analyzed — the crux design), `red-state-claims` (analyzed).
8 probes, 8 on-target, 0 dropped (coverage whole). Executed in throwaway sandboxes: `executable-proof`, `baseline-repro` (node v24.17.0; never touched the source worktree).

## Executed proof
- **baseline-repro** → node suite green in sandbox; the plan's "260 pass, 0 fail" baseline reproduced (no finding).
- **executable-proof** → the plan's runnable artifacts behave as claimed in a pristine sandbox copy.
- **worktree-pin-feasibility** → PASS. Confirmed `worktreeRoot`/`runId` are in module scope at the `if (mergedTasksForGateAudit.length > 0)` gate-audit pass (so the `${worktreeRoot}/${runId}/_refinery` reconstruction is valid there), the `refineryLandPath` (`:392`) reconstruction precedent matches, the gate-audit pass runs after the serial merge queue and before LAND/teardown (so `_refinery` exists at the integration tip), and `_refinery` is checked out on `ph.integrationBranch`. The worktree-pin design is sound.
- **red-state-claims** → PASS. All TDD red-states hold at HEAD (`'corresponds to the current integration tip'` absent; `'you cannot run commands'` present; `auditLog.push`/`mergedTasksForGateAudit.push` lack the new sha keys; no `rev-parse HEAD`/`_refinery` in the current prompt; `war-auditor.md:24` reads "EXIST and are not weakened or skipped", forbidden `EXIST and PASS` absent and guarded at `workflow-template.test.mjs:802`).

## Findings
### Major (all resolved)
- **[coverage-vs-source] Plan implements the worktree-pin (Task 2); spec deferred it.** The spec predated the operator's DP5 ratification (pin the worktree now). → **Resolved:** spec aligned — added **D6** promoting the worktree-pin to in-scope, removed the "deferred-with-note: worktree-pin" bullet, Coverage #193 → full (no deferral).
- **[coverage-vs-source] Plan Task 2 has behavioral tests; spec said "doc-only, no test warranted".** → **Resolved:** spec Test plan now lists the worktree-pin behavioral tests under Task 2; the no-test exemption is scoped to the #117 lens-doc (Task 3) only.
- **[consistency] Spec still said "fall back to `mr.working_sha`"; plan's DP2 uses a sentinel.** `working_sha` is land-only (dead on a merge result). → **Resolved:** spec (a) now `mr.integration_sha ?? '(integration_sha unrecorded)'`.
- **[consistency] Spec still named the unreachable `working_sha` regression test.** → **Resolved:** spec test #3 replaced with the sentinel test.
- **[consistency] Plan Task 2 `rev-parse HEAD == gateHeadSha` comparison was described vaguely** (no comparison mechanism / SOFT-note contents). → **Resolved:** plan now specifies the mechanical bracket test `[ "$(git -C ${refineryPath} rev-parse HEAD)" = "${gateHeadSha}" ]` (exit 0 ⇒ pin confirmed; non-zero/unrunnable ⇒ "cannot confirm" ⇒ SOFT note carrying observed HEAD, expected `gateHeadSha`, and the reason).

### Minor (resolved / accepted)
- **[consistency] Spec/plan "disjoint regions" wording for the G1↔G2 shared merge-task literal.** → **Resolved:** corrected to "adjacent lines in one template literal" in both docs; serial G1→G2 landing mandatory, G2 re-anchors by construct.
- **[consistency] schemas.md doc line ambiguous (annotate existing `integration_sha?` vs new field).** → **Resolved:** plan Task 1(d) now gives the exact prose annotation to the existing field (no new field).
- **[consistency] DP7 destructure-omission trap had no explicit test.** → **Resolved:** plan notes Test 1 (sha-in-prompt) transitively proves the destructure pulled `gateHeadSha` (token can't reach the prompt otherwise).
- **[consistency] EXIST-and-PASS guard checks `war-auditor.md` only, not runtime audit responses.** → **Accepted as out-of-scope residual.** The forbidden-token guard's scope is the standing instruction file by design; runtime-response policing is a separate concern not in #117/#193. Recorded, not patched.

### Spec task-decomposition alignment (round 2)
- The worktree-pin promotion initially folded the pin into the spec's Task 1 while the plan splits it as Task 2. → **Resolved:** spec Solution-shape / Affected-files / Test-plan re-decomposed to the plan's 3-task TDD model (Task 1 = sha provenance, Task 2 = worktree-pin, Task 3 = #117 lens doc, depends on 1–2). `coverage-vs-source` re-verified PASS.

## Resolutions applied (grill decisions)
The operator deferred plan-execution decisions to the Lead; no architectural decisions remained (DP1/DP5/DP9 were ratified earlier in the session). All Major blockers were spec↔plan drift from those ratified decisions and were resolved by aligning the committed spec to the plan + hardening the plan's F7. No blocker was escalated to the user.

## Residual risk
- EXIST-and-PASS runtime-response policing is not covered (file-level guard only) — accepted out-of-scope.
- Severity reminder: the worktree-pin reuses the existing `_refinery` worktree and the seat's existing read-only git — no new worktree, no tool/allowlist change, no new schema field (reuses `integration_sha` + `audit_sha`).
