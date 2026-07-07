# Red Team — doc-rot remediation (2026-07-06)
**Verdict:** CLEARED-WITH-NOTES — one real ambiguity found and patched (Task 6's self-tripping rename verification); every other audited surface verified truthful against code.

Source of truth: none (no standalone spec — a code-verified `/init` session inventory converted by `/war-strategy`). `coverage-vs-source` correctly N/A.

## Attack surface
- **Spine (4):** claims-vs-reality, consistency-placeholders, dependency-feasibility, intent-vs-plan.
  Dropped: `coverage-vs-source` (no source spec), `executable-proof` (plan ships no literal runnable artifact).
- **Bespoke (3):** `snippet-fidelity` (13 verbatim "before"/anchor snippets), `truth-audit` (8 derived claims about existing code/config), `baseline-suites-green` (executed).
- **Executed in sandbox:** `baseline-suites-green`.
- **Coverage:** 7/7 probes on-target, 0 off-target, 0 dropped — coverage whole (not INCOMPLETE).
- **Backstops:** `## Deferred validations (backstops)` = `None` — a valid, complete declaration; backstop-legitimacy check passes trivially.

## Executed proof
- **baseline-suites-green** (throwaway sandbox copy, Node v24) — the four "must stay green" suites the plan names all green at baseline: `war-config.test.mjs`, lessons-learned doc-contract, `validate-worktree-scope.test.sh`, `assert-test-in-diff.test.sh`. PASS, findings `[]`.
- **truth-audit** (analyzed, PASS) — every derived premise the plan leans on checks out: `DEFAULTS.agents.worker.model = opus`; `--resolve-gate` is actually implemented in `war-config.mjs` (so documenting it in usage is truthful, not fabricated); `resolveGate()`'s `*.test.sh` loop currently lacks a `.claude/` exclusion (the fix is real, not a no-op); ADR-0016 references ADR-0011 as the campaign model; the 3 named inbound roadmap refs are the only ones outside the plan; the doc-contract test pins none of the old phrasing; `references/migration.md` already states exit-non-zero; all four release slots hold one consistent version.
- **intent-vs-plan** (PASS) — all 9 End-state conditions are individually checkable, each maps to a claiming task, and collectively they suffice for the Purpose.
- **dependency-feasibility** (PASS) — Phase-1's six tasks are file-disjoint (no same-file rebase collision), ordering is sound, Phase 2 (release) correctly trails.

## Findings

### Major / needsDecision — RESOLVED
- **[needsDecision] Task 6 verification was self-tripping.** As authored: *"a repo-wide grep for the old basename must return zero hits outside git history."* This is **unsatisfiable** — the doc-rot plan itself (lines 31, 123–124) and this red-team report legitimately name the old basename `2026-07-02-clean-audit-series` in prose, so a raw-string grep can never reach zero. A worker following it literally would either falsely fail Task 6 or edit the historical plan's prose to force the grep down. It also **contradicted End-state #8's own correct wording** ("zero broken references repo-wide").
  - *Evidence:* repo-wide grep confirms old-basename hits are confined to (a) the 3 named inbound plans — real links to update — and (b) the doc-rot plan's own Task 6 / End-state text (prose, not links). Matches the memory learnings [[release-blurb-describing-a-rename-trips-the-renames-own-absence-guard]] and [[enumerated-file-list-absence-guard-for-rename-with-legitimate-history]]. The plan already guards Task 7's release blurb against this exact trap (line 145–147) but hadn't applied the same awareness to Task 6's own check.
  - *Resolution (operator: "scope to broken links"):* patched Task 6's Plan slice to verify **zero broken references** — the 3 updated inbound links resolve to the renamed file and no markdown link / backticked path repo-wide still points to the old path — while explicitly carving out non-link prose in the plan, this report, and git history.

### Minor / notes (auto-noted)
- **Probe-instrumentation artifact (not a plan defect).** The two `fail` probes (`claims-vs-reality`, `consistency-placeholders`) recorded ~13 precondition *confirmations* as severity-less findings (e.g. "design.md §2 still says sonnet", "dead `warned` still present", "usage string missing `--resolve-gate`"). These are precisely the drift the plan fixes and the deliverables not yet applied — **not** defects under the scaffold's precondition-vs-deliverable contract. Because the findings lacked a `severity` on a non-`pass` probe, the gate fail-closed them into `needsDecision` (BLOCKED). Adjudicated as non-defects by the Lead, corroborated by the four clean `pass` probes.
- **snippet-fidelity WARN — refuted.** One probe claimed `skills/lessons-learned/SKILL.md:15` already reads "exits non-zero" (implying Task 4 is a no-op). Refuted by the adversarial-confirm and by direct read: line 15 reads *"on older Node every verb no-ops with a message."* Task 4's premise is correct; no change to the plan.

## Resolutions applied (grill decisions)
- Task 6 self-tripping verification → operator chose **scope to broken links** → patched Task 6 Plan slice in `docs/plans/2026-07-06-doc-rot-remediation.md`.

## Residual risk
- **No-standalone-spec deviation — RATIFIED.** The plan's Notes ask `/red-team` to ratify running without a design spec. Legitimate: this is a docs-truthing plan converted by `/war-strategy` from a code-verified session inventory; `coverage-vs-source` is correctly inapplicable and `intent-vs-plan` (operator-confirmed intent) passes. No spec required.
- The two `fail` probes' output shape (ReportFindings-style, no `severity`) is a harness quirk when analyzed probes run as `Explore` agents; their findings were adjudicated by hand. Not a plan risk.
