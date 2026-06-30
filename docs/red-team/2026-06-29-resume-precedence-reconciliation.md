# Red Team — resume-precedence-reconciliation (L2) (2026-06-29)

**Verdict:** CLEARED-WITH-NOTES — the strongest-grounded plan in the stack. **All six bespoke probes pass**, and
claims-vs-reality / coverage-vs-source / executable-proof all pass. The gate mechanically returned `BLOCKED` on a
**single `needsDecision`** that is a verified **spec-staleness misfire** (the plan is correct; the *spec* row is stale)
— adjudicated and documented, not a plan defect. Two doc-polish Minors patched. **Zero Majors, zero real blockers.**
The plan's load-bearing claim — *git can only lag, never be wrong, because the push-first CAS never `--force`es a
shared branch* — was independently verified against `provision-worktrees.sh` and is corroborated by this very run's
recurring origin-lag (issue #251): origin **lagged**, it was never **wrong**.

## Attack surface
- **Spine (5):** claims-vs-reality, executable-proof (executed), coverage-vs-source, consistency-placeholders,
  dependency-feasibility.
- **Bespoke (6):** `adr-0008-canonical-parity`, `abc-disposition-fidelity`, `merge-sha-reachability-claim`,
  `git-monotonicity-load-bearing-claim`, `same-file-section-disjoint`, `version-baseline`.
- Coverage whole: expected 11 / on-target 11 / 0 off-target / 0 dropped. pass 9, warn 2, fail 0.
- **Executed:** executable-proof ran the full gate in a throwaway `git worktree --detach` off `8d7ecac` — green,
  proving the doc baseline is sound and the (docs-only) diff would break nothing.

## Verified (the load-bearing claims all held)
- **ADR-0008 is the canonical precedence source** the three Phase-1 tasks mirror — it states `git branch state >
  GitHub issue labels > ledger.json` with the monotonicity rationale; the three tasks target disjoint files and mirror
  the ADR (not each other), so they cannot drift on the precedence claim. (`adr-0008-canonical-parity`: pass)
- **A/B/C dispositions are faithful** to the spec/ADR — A (ledger ahead → trust git, revert) / B (git ahead → trust
  git, mark merged) / C (unexplained → **HALT**, no auto-repair), repair **one-way toward git**. (`abc-disposition-fidelity`: pass)
- **`merge_sha` field exists** in the `schemas.md` ledger.json shape (`:70`); the "advisory, authoritative only when
  reachable" annotation is consistent with the never-`--force` CAS. (`merge-sha-reachability-claim`: pass)
- **Git monotonicity holds** — no `--force` / `reset --hard` on a shared branch anywhere in `provision-worktrees.sh`
  land-advance. (`git-monotonicity-load-bearing-claim`: pass)
- **Construct anchors all survive M1/M2/M3** and L2's sections are disjoint from prior edits — SKILL.md resume step 5
  + `## Checkpoint`; design.md `## 6. State & resume`; schemas.md `## ledger.json`. (`same-file-section-disjoint`: pass)
- **Version baseline** — all four slots at v0.7.5; T4 → v0.7.6. (`version-baseline`: pass)

## Findings (all Minor / misfire — patched or adjudicated)
- **[needsDecision · MISFIRE · adjudicated] Spec §5 row 4 says edit CONTEXT.md.** The plan correctly excludes it
  (line 16: terms already landed) — verified present at `CONTEXT.md:138-150`, derived from ADR-0008. The **spec row is
  the stale artifact**, not the plan. Added an explicit Out-of-scope note recording the spec-staleness + the deliberate
  exclusion. No substantive plan change; the plan was already right.
- **[Minor · patched] Test-plan file list omitted README.md.** Line 120 said `*.md (SKILL/design/schemas)` but T4
  also edits `README.md ## Status`. Patched to `*.md (SKILL/design/schemas/README) + the four release slots
  (plugin.json, marketplace.json ×2, README ## Status)`.
- **[Minor · patched] Criterion #6 ("no code changed") unassigned + imprecise** (the four release slots include
  `.json`, so "diff is `*.md` only" wasn't strictly true). Reframed as a **gate-verified** property (docs + the four
  release slots; suite stays green), closed at every task's Step 3 and T4's release gate.

## Residual risk
- **Spec §5 row 4 (CONTEXT.md)** is stale and should be struck in a separate spec-hygiene pass (the plan already
  excludes CONTEXT.md; not L2's job).
- **No tested `verify-resume.sh`, no transactional ledger** — both rejected in ADR-0008 (YAGNI; git's monotonicity is
  the real safety net). The pre-flight is a Lead checklist, not enforced code. Accepted ceiling; revisit if a real
  mid-window crash is ever observed to bite.
- **Docs-only** — by design (spec §8.6) the gate cannot assert on prose; the six validation criteria are prose-verified
  by the per-task audits (plan-faithfulness against ADR-0008).
