# Survey-debt campaign (2026-08-25) — 4 plans (Rev 2, 2026-08-27)

Rev 2 renders the live campaign ledger after plan 1 landed (release 0.20.1, PR #1847 merged
to master) and the operator's 2026-08-27 `/war-strategy` interview inserted the
core-problem plan ahead of the remaining queue. Original conversion provenance (Rev 1):
`/war-machine` from the 2026-08-25 survey manifest (`.claude/aot/2026-08-25-survey.json`;
specs `docs/specs/2026-08-25-*-design.md`). Landing order stays **strictly serial** —
every plan carries a trailing directive-form release phase over the same four version
slots plus the CHANGELOG head entry, so no two plans may be in flight at once.

Rev 2 deltas (operator-ratified 2026-08-27):
- **Plan 1 LANDED** — 0.20.1 (nine phases; recoveries p3 r2/r3, p8 r4; red-team
  ADJUDICATED r1; follow-ups #1749–#1843 filed, five since closed as fixed-in-flight).
- **New plan 2, in-run-finding-resolution** — the core-problem plan (mechanical findings
  die in-run): budget-bounded ace re-entry, absorb-by-citation, disposition widenings,
  four ask-machinery folds. Retires enhancements #1731/#1838/#1845/#1846 and follow-ups
  #1810/#1789/#1790/#1813/#1812 in one run. **Ordering ruling:** it runs before the
  former plans 2/3 — the old plan 2 is file-disjoint and "deliberately waits one run —
  core-fix-first per operator"; the old plan 3 has a real footprint collision and must
  follow it anyway.
- **Plan 4 (was 3) AMENDED** (fold batch 2, 2026-08-27): 27 engine-reliability
  `war-followup`s folded in (issues 45 → 72; Phase 1 grew 8 → 10 tasks; End states
  23–26). Its authoritative copy is the campaign-ledger path (survey worktree) — the
  master copy is pre-amendment. A post-plan-2 **re-amendment is already scheduled**:
  plan 2 re-authors the #1812 boundary homes, so plan 4's #1812 fold rows retire then.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [engine-reliability-and-filing-fidelity](../plans/2026-08-25-engine-reliability-and-filing-fidelity.md) | `skills/war/assets/workflow-template.js` + `.test.mjs`, `war-config.mjs` + `.test.mjs`, `provision-worktrees.sh`, merge floors (`assert-*.sh`), `prompt-surface-budgets.test.mjs`, `campaign-ledger.mjs`, auditor git guard, `skills/war/SKILL.md`, `schemas.md`, `agents/war-refiner.md`, ADR 0013 | **LANDED 0.20.1** (PR #1847) | ask-disposition campaign landed |
| 2 | [in-run-finding-resolution](../plans/2026-08-27-in-run-finding-resolution.md) | `skills/war/assets/workflow-template.js` + `.test.mjs`, `agents/war-auditor.md`, `skills/war/references/disposition-eligibility.md`, ADR 0013, `schemas.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `design.md`, `skills/war-review/SKILL.md`, `skill-doc-contracts.test.mjs` | next free MINOR (directive) | 1 |
| 3 | [authoring-doctrine-and-lint-coherence](../plans/2026-08-25-authoring-doctrine-and-lint-coherence.md) | `skills/war-strategy/**` (plan-interview.md, strategy-verifier.md, SKILL.md §2, plan-literal-lint.mjs + test, war-strategy-structure.test.sh), `skills/war-machine/SKILL.md` + `war-pipeline-structure.test.sh`, `skills/red-team/**` (workflow-scaffold.js + test, assert-no-repo-escape.sh + cases, loop-budget.md, lenses.md, SKILL.md) | next free patch (directive) | 2 (ordering only — file-disjoint; the deferral is the recorded core-fix-first ruling) |
| 4 | [doc-truth-and-drift-guard-debt](../plans/2026-08-25-doc-truth-and-drift-guard-debt.md) (amended 2026-08-27; re-amendment scheduled post-plan-2) | `CHANGELOG.md`, `README.md`, `.tours/`, `CONTEXT.md` (+ `glossary-cold.md` eviction target), `docs/adr/0013|0018|0026|0047`, `docs/learnings/` (2 lessons), `worker-servitor-edges.md`, `resume-and-recovery.md`, `design.md`, `budget-raise-floor.md`, `budget-rebaseline.md`, `CLAUDE.md`, `provision-worktrees.sh` (comments), `skill-doc-contracts.test.mjs`, `reference-link-integrity.test.mjs`, `doc-cli-consistency.test.mjs`, `workflow-template.js` (comments) + `.test.mjs` | next free patch (directive) | 3 |

## Dependency spine (strict landing order)

```
ask-disposition campaign — LANDED 2026-08-25 (0.20.0, master 40afddb)
        ▼
  1  engine-reliability-and-filing-fidelity — LANDED 2026-08-27 (0.20.1, PR #1847)
        ▼
  2  in-run-finding-resolution              ← next at campaign resume
        │ lands (advances the four slots + CHANGELOG head, MINOR)
        ▼
  3  authoring-doctrine-and-lint-coherence
        │ lands (advances the four slots + CHANGELOG head)
        ▼
  4  doc-truth-and-drift-guard-debt         ← re-amended after plan 2 lands
```

Plan 2 must precede plan 4 by footprint (they share `workflow-template.js`/`.test.mjs`,
ADR 0013, `schemas.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `design.md`,
`skill-doc-contracts.test.mjs`); it precedes plan 3 by operator ruling alone (file-disjoint —
core-fix-first). Each release phase resolves "next free patch/MINOR above the live
integration base at land time"; version literals authored early are non-authoritative by
house rule.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status`), `CHANGELOG.md` (head entry) | 2, 3, 4 | Release-slot stack: every remaining plan bumps all four slots + appends the CHANGELOG head. Serial landing + the directive form is the resolution. |
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 2, 4 | Plan 2 rewrites the disposition/ace routing + fixtures; plan 4 makes comment-only truth edits and census/pin work. Serial 2 → 4; plan 4's fold slices carry re-verify-at-base duties for exactly this reason. |
| `docs/adr/0013` | 2, 4 | Plan 2's dated amendment re-authors the ace-boundary narration (#1812's ADR home); plan 4's fold rows for #1812 retire at its re-amendment. Serial 2 → 4 + the scheduled re-amendment is the resolution. |
| `schemas.md`, `CONTEXT.md`, `skills/war/SKILL.md`, `design.md` | 2, 4 | Plan 2 owns the boundary-prose homes + new glossary terms; plan 4 owns the unrelated stale-row sweep (fold batch 2). Row-disjoint by design, but plan 4 re-verifies at its base and its #1812 rows are dropped at re-amendment. |
| `skill-doc-contracts.test.mjs` | 2, 4 | Plan 2 adds the new-boundary guard rows (the flip ships the guard); plan 4's Phase 2 Task 2 re-scopes D36/D37/D40 keys. Different D-rows; serial 2 → 4, plan 4 anchors against plan 2's landed bytes. |
| `skills/war-machine/war-pipeline-structure.test.sh` | 3, 4 | Plan 3 touches D9/D10/drafter pins; plan 4 adds the war-review ratified-rows pair (#1656). Serial 3 → 4. (Plan 2's war-review telemetry row is prose in `skills/war-review/SKILL.md`, lock-step with any key that reads it.) |
| `CONTEXT.md` byte budget | 2, 4 | Plan 2 adds two glossary terms; plan 4 evicts to `glossary-cold.md` (#1651) with re-measure-at-base arithmetic — stated in plan 4 for exactly this reason. |

## Issue → spec → plan chain

| Spec | Plan | Issues |
|------|------|--------|
| `docs/specs/2026-08-25-engine-reliability-and-filing-fidelity-design.md` | plan 1 (LANDED) | #1552, #1586, #1671, #1430, #1666, #1480, #1679, #1680, #1681, #1672, #1476, #1456, #1560, #1561, #1562, #1597, #1592, #1589, #1575, #1574, #1571, #1659, #1660, #1577, #1435, #1421, #1688 + folded #1691–#1694, #1696, #1704 (all closed at land or since) |
| (no spec — `/war-strategy` interview, 2026-08-27) | plan 2 `docs/plans/2026-08-27-in-run-finding-resolution.md` | enhancements #1731, #1838, #1845, #1846 + folded #1810, #1789, #1790, #1813, #1812 |
| `docs/specs/2026-08-25-authoring-doctrine-and-lint-coherence-design.md` | plan 3 | #1641, #1637, #1640, #1642, #1638, #1639, #1643, #1682, #1655, #1684, #1685, #1650, #1674, #1397, #1396 |
| `docs/specs/2026-08-25-doc-truth-and-drift-guard-debt-design.md` | plan 4 (amended 2026-08-27) | Rev-1 set #1662 … #1689 + ask-campaign folds #1695, #1705–#1709 + fold batch 2 (27 issues): #1737, #1738, #1740–#1744, #1752, #1764, #1765, #1766, #1769, #1771, #1772, #1791, #1793, #1800, #1801, #1802, #1804, #1812*, #1814, #1817, #1832, #1841–#1843 (*#1812 retires at the post-plan-2 re-amendment — plan 2 owns it) |
