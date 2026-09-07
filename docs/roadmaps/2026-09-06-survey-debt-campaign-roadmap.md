# Survey-debt campaign (2026-09-06) — 3 plans

Converted by `/war-machine` (interactive, operator rulings recorded per plan) from the 2026-09-06 survey manifest (`.claude/aot/2026-09-06-survey.json`; specs `docs/specs/2026-09-06-*-design.md`). Base at conversion: master `ffb3ab6` (0.21.10, PR #2065 merged); master advanced to 0.21.11 (`6be322d`) during conversion. Landing order is **strictly serial**: every plan carries a trailing directive-form release phase over the same four version slots plus the CHANGELOG head entry, so no two plans may be in flight at once. Each release phase resolves "next free patch above the live integration base at land time"; no plan carries a version literal.

**Launch precondition (not a plan):** #2099 — `skills/war/assets/workflow-template.js` is 525,209 B on master, over the Workflow tool's 524,288-byte script cap, so every `/war` launch dies at dispatch. Operator ruling 2026-09-06: fixed inline by a hotfix PR (comment-stripped staged copy in `stage-workflow.mjs`, a cap assertion with a named error, a test pinning the staged size with headroom for the ~104.5 KB args class). The campaign must not launch until that PR is on master.

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [engine-and-audit-verdict-integrity](../plans/2026-09-06-engine-and-audit-verdict-integrity.md) | `skills/war/assets/workflow-template.js` + `.test.mjs`, `land-decision.mjs` + `.test.mjs`, `war-config.mjs` + `.test.mjs`, `agents/war-auditor.md`, `agents/war-refiner.md`, `agents/war-worker.md`, `skills/snipe/SKILL.md`, `skills/war/references/{run-manifest,schemas,resume-and-recovery,file-followups,disposition-eligibility,design}.md`, `skills/war/SKILL.md`, `skills/war-review/SKILL.md`, `skills/war-room/SKILL.md`, `CONTEXT.md`, ADR 0013 (in-place edits + Decision-log lines) + one new ADR, `provision-worktrees.sh` (one die), `docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md` (#2093 in-place edit) | next free patch (directive) | #2099 hotfix on master |
| 2 | [shell-floors-guards-and-provisioning](../plans/2026-09-06-shell-floors-guards-and-provisioning.md) | `hooks/validate-auditor-git.sh` + `.test.sh`, `hooks/guard-conventions.test.sh`, `skills/war/assets/provision-worktrees.sh` + `.test.sh`, `assert-budget-raise-cited.sh`, `assert-done-when.sh`, `assert-issues-filed.sh`, `assert-guard-specificity-in-diff.sh` (+ tests), `assert-args-complete.mjs` + `.test.mjs`, `skills/war-campaign/assets/campaign-ledger.mjs` + `.test.mjs`, `skills/war/references/{auditor-teach,setup,refiner-recovery}.md`, `war-strategy-structure.test.sh`, ADR 0002/0031/0044 (in-place), prompt-line mirrors in `workflow-template.js` + registry rows | next free patch (directive) | 1 |
| 3 | [doc-truth-drift-guards-and-authoring-doctrine](../plans/2026-09-06-doc-truth-drift-guards-and-authoring-doctrine.md) | `docs/adr/*.md` (corpus migration + two new ADRs), `CONTEXT.md` (+ `glossary-cold.md` eviction), `skills/war/SKILL.md` (preflight eviction → new `references/args-preflight.md`), `skills/war-room/SKILL.md`, `skills/lessons-learned/SKILL.md`, `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`, `skills/war-strategy/references/{plan-interview,strategy-verifier,visual-projections}.md`, `plan-literal-lint.mjs` + `.test.mjs`, `skill-doc-contracts.test.mjs`, `reference-link-integrity.test.mjs`, `doc-cli-consistency.test.mjs`, `prompt-surface-budgets.test.mjs`, `version-slots.test.mjs`, `war-pipeline-structure.test.sh`, `war-strategy-structure.test.sh`, `README.md`, `CHANGELOG.md`, every living prose surface (Vale pass, Phase 6, ten file-disjoint tasks) | next free patch (directive) | 2 |

## Dependency spine (strict landing order)

```
#2099 hotfix PR — workflow-template.js under the 524,288 B script cap (hand-landed, outside the campaign)
        ▼
  1  engine-and-audit-verdict-integrity        (11 phases; Phase 1 evicts agents/war-refiner.md to ≥ 2,048 B headroom)
        │ lands (advances the four slots + CHANGELOG head)
        ▼
  2  shell-floors-guards-and-provisioning       (8 phases; PIN-28: no refiner-card edit before plan 1 Phase 1 has landed;
        │                                        Phase 7's ownTokens lock-step pin targets plan 1's post-Phase-4 expression)
        │ lands (advances the four slots + CHANGELOG head)
        ▼
  3  doc-truth-drift-guards-and-authoring-doctrine (7 phases; Phase 4 folds ADR 0013 after plan 1's in-place edits;
                                                    Phase 6 Vale pass sees every sibling pin landed)
```

Plan 2 follows plan 1 by footprint (`workflow-template.js` prompt lines rebase after plan 1's Phase 10 dispatch reshuffle; `agents/war-refiner.md` has 130 B of headroom until plan 1's eviction lands; the args-provenance mirror pins plan 1's Phase 4 expression). Plan 3 follows plan 2 by footprint (`skill-doc-contracts.test.mjs`, `war-strategy-structure.test.sh`, `auditor-teach.md`, `setup.md`, ADR 0044 Decision-log lines) and by ruling (the Vale pass lands last so its freeze list is complete by construction). Ordering caveats recorded in each plan's Pivotal constraints: plan 1's Phase 1 grows `skills/war/SKILL.md` (228 B headroom at conversion) and self-funds by ADR 0042 eviction; plan 3's Task 2.2 evicts the preflight span and is self-contained in either order; `QUALIFIED_HEADERS` is registered by plan 1 Task 1.1 and replaced by a directory census in plan 3 Task 3.2 (both orders recorded).

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status`), `CHANGELOG.md` (head entry) | 1, 2, 3 | Release-slot stack: every plan bumps all four slots and appends the CHANGELOG head. Serial landing + the directive form is the resolution. Plan 3's release blurb is the first consumer of the categorical guard (Task 3.6). |
| `skills/war/assets/workflow-template.js` + `.test.mjs` | 1, 2 | Plan 1 rewrites routing in ten phases and every dispatch site in Phase 10; plan 2 makes three prompt-line touches plus registry rows and one lock-step text pin. Serial 1 → 2; plan 2's `REGISTRY.length` bump rebases onto plan 1's last bump. |
| `agents/war-auditor.md`, `agents/war-refiner.md`, `agents/war-worker.md` | 1, 2, 3 | Byte budgets: refiner 130 B, worker 1,752 B, auditor 3,661 B hard headroom at conversion. Plan 1 Phase 1 evicts the refiner card; every card-touching task in plans 2 and 3 measures at its rebased base and evicts under 512 B (eviction over Budget-Raise). Plan 3 Phase 6 (Vale) rewords last with a mechanical freeze list. |
| `CONTEXT.md` | 1, 2, 3 | Over its advisory line at conversion (114,280 B vs 111,616 B). Only plan 3 evicts (Task 1.2, mandatory first step, ≥ 3.5 KB named entries). Plans 1 and 2 add rows and measure per commit. |
| `skills/war/SKILL.md` | 1, 2, 3 | 228 B hard headroom at conversion. Plan 1 Task 1.2 and plan 2 Task 5.2 grow it (self-funded evictions); plan 3 Task 2.2 evicts the 1,594 B preflight span. Every touch measures before and after. |
| `skills/war/references/schemas.md`, `resume-and-recovery.md`, `refiner-recovery.md` | 1, 2, 3 | Plan 1 owns them one task per phase; plan 2 adds the task-less hygiene row and the eviction fallback destination; plan 3 rewords in Phase 6. Rebase-only, one owner per phase within each plan. |
| `skills/war/assets/skill-doc-contracts.test.mjs`, `prompt-surface-budgets.test.mjs` | 1, 2, 3 | Append-only rows in plans 1 and 2; plan 3 owns the D43 fourth-home row, the budget derivation guard and the Phase 4 re-anchor. Serial by plan; plan 3's Phase 4 is one commit. |
| `skills/war/assets/war-config.mjs` + `.test.mjs`, `skills/war-room/SKILL.md` | 1, 2, 3 | Plan 1 (`maxParallel: null`), plan 2 (`doneWhenPreamble` knob + key-list guard), plan 3 (leading-star qualifier, Vale). Disjoint lines; rebase-clean. |
| `skills/war/assets/provision-worktrees.sh` + `.test.sh` | 1, 2 | Plan 1 Task 4.3 changes one die (calls `branch_holder_path`, which plan 2 keeps); plan 2 rewrites the SIGPIPE helper, the hygiene arm and the land-advance retry. Test file append-only. |
| `docs/adr/0044-*.md`, ADR 0013 | 1, 2, 3 | All edits are living-form (in place + Decision-log line) under the 2026-09-06 ruling; plan 3 Phase 4 folds the remaining dated sections in one commit. Fold-compatible in either order. |
| `skills/war-strategy/war-strategy-structure.test.sh`, `skills/war/references/auditor-teach.md`, `setup.md` | 2, 3 | Plan 2 renames a ctl label and adds the guard-class section; plan 3 adds pins and rewords. Serial 2 → 3. |
| `skills/snipe/SKILL.md`, `skills/war-review/SKILL.md`, `design.md`, `disposition-eligibility.md`, `file-followups.md`, `run-manifest.md`, `submodule-flows.md`, `reference-link-integrity.test.mjs` | 1, 3 | Plan 1 authors the doctrine; plan 3 pins or rewords it. Serial 1 → 3. |

## Issue → spec → plan chain

| Spec | Plan | Issues |
|------|------|--------|
| `docs/specs/2026-09-06-engine-and-audit-verdict-integrity-design.md` | plan 1 | #1481, #1664, #1736, #1739, #1749, #1750, #1751, #1767, #1768, #1777, #1781, #1782, #1788, #1792, #1793, #1797, #1798, #1799, #1801, #1805, #1806, #1807, #1811, #1815, #1817, #1858, #1859, #1862, #1863, #1864, #1865, #1869, #1870, #1871, #1872, #1873, #1874, #1875, #1876, #1878, #1882, #1886, #1895, #1914, #1916, #1973, #1989, #2000, #2005, #2006, #2053, #2058, #2085, #2086, #2087, #2088, #2093, #2094, #2096, #1480, #1813; folded #2097 (tracking — stays open after land); closed at conversion and recorded as such: #1731, #1866, #2034, #2051, #2059, #2060, #2068 |
| `docs/specs/2026-09-06-shell-floors-guards-and-provisioning-design.md` | plan 2 | #1828, #1829, #1830, #1915, #2001, #1421, #1840, #2007, #1839, #1826, #1824, #1825, #1823, #1837, #1833, #1732, #1733, #1734, #1827, #2090, #1775, #1760, #1896, #1834, #1835, #2092, #1836 |
| `docs/specs/2026-09-06-doc-truth-drift-guards-and-authoring-doctrine-design.md` | plan 3 | #1735, #1759, #1850, #1880, #1919, #1620, #1958, #1776, #1778, #1848, #2004, #1399, #2083, #2084, #2089, #2091, #2095, #1741 |
| (no spec — operator ruling) | hotfix PR, outside the campaign | #2099 |
