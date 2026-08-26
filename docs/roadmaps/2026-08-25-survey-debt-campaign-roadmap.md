# Survey-debt campaign (2026-08-25) — 3 plans

Converted by `/war-machine` from the 2026-08-25 survey manifest (`.claude/aot/2026-08-25-survey.json`;
specs `docs/specs/2026-08-25-*-design.md`). Landing order is **strictly serial** — all three plans
carry a trailing directive-form release phase over the same four version slots plus the CHANGELOG
head entry, so no two plans may be in flight at once. The ask-disposition campaign this spine
originally waited on **landed 2026-08-25** (PR #1711, master `40afddb`, release 0.20.0) — the
campaign is launchable; all three plans were refreshed against that tree, and its 12 follow-up
issues (#1691–#1696, #1704–#1709) were folded into plans 1 and 3 (operator-ratified 2026-08-25).

| # | Plan | Files owned | Ver | Depends on |
|---|------|-------------|-----|------------|
| 1 | [engine-reliability-and-filing-fidelity](../plans/2026-08-25-engine-reliability-and-filing-fidelity.md) | `skills/war/assets/workflow-template.js` + `.test.mjs`, `war-config.mjs` + `.test.mjs`, `provision-worktrees.sh`, merge floors (`assert-*.sh`), `prompt-surface-budgets.test.mjs`, `campaign-ledger.mjs`, auditor git guard, `skills/war/SKILL.md`, `schemas.md`, `agents/war-refiner.md`, ADR 0013 | next free patch (directive) | ask-disposition campaign landed |
| 2 | [authoring-doctrine-and-lint-coherence](../plans/2026-08-25-authoring-doctrine-and-lint-coherence.md) | `skills/war-strategy/**` (plan-interview.md, strategy-verifier.md, SKILL.md §2, plan-literal-lint.mjs + test, war-strategy-structure.test.sh), `skills/war-machine/SKILL.md` + `war-pipeline-structure.test.sh`, `skills/red-team/**` (workflow-scaffold.js + test, assert-no-repo-escape.sh + cases, loop-budget.md, lenses.md, SKILL.md) | next free patch (directive) | 1 |
| 3 | [doc-truth-and-drift-guard-debt](../plans/2026-08-25-doc-truth-and-drift-guard-debt.md) | `CHANGELOG.md`, `README.md`, `.tours/`, `CONTEXT.md` (+ new `glossary-cold.md` eviction target), `docs/adr/0018|0026|0047`, `docs/learnings/` (2 lessons), `worker-servitor-edges.md`, `skill-doc-contracts.test.mjs`, `reference-link-integrity.test.mjs`, `doc-cli-consistency.test.mjs` | next free patch (directive) | 2 |

## Dependency spine (strict landing order)

```
ask-disposition campaign — LANDED 2026-08-25 (0.20.0, master 40afddb)
        ▼
  1  engine-reliability-and-filing-fidelity
        │ lands (advances the four slots + CHANGELOG head)
        ▼
  2  authoring-doctrine-and-lint-coherence
        │ lands (advances the four slots + CHANGELOG head)
        ▼
  3  doc-truth-and-drift-guard-debt
```

The spine is the survey manifest's `dependsOn` hint (spec C → spec B) firmed up by footprints:
plan 3's guard suites (`war-pipeline-structure.test.sh`, red-team-adjacent pins) assert bytes plan 2
rewrites, and every plan's release phase stacks the same slots — so 1 → 2 → 3 is both the operator's
enhancement-first build order and the only contention-free serialization. Each plan's release phase
resolves "next free patch above the live integration base at land time"; version literals authored
early are non-authoritative by house rule.

## Shared-file contention

| File | Plans | Risk |
|------|-------|------|
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` (`## Status`), `CHANGELOG.md` (head entry) | 1, 2, 3 | Release-slot stack: every plan bumps all four slots + appends the CHANGELOG head. Serial landing + the directive form (next free patch at land time) is the resolution; a parallel launch would collide on every release commit. |
| `skills/war/assets/workflow-template.test.mjs` | 1, 3 | Plan 1 adds engine fixtures; plan 3 rewrites the D6 keep-green census (#1686) and adds file-followups pins (#1587). Same suite, different regions — serial order 1 → 3 makes plan 3's census edits land on plan 1's merged fixtures. |
| `skills/war/assets/war-config.test.mjs` | 1, 3 | Plan 1 validates `run.maxParallel`; plan 3 adds the README roundLimit surfaces row. Disjoint constructs; serial order resolves. |
| `skills/war-machine/war-pipeline-structure.test.sh` | 2, 3 | Plan 2 touches D9/D10 pins and drafter-arm pins; plan 3 adds the war-review ratified-rows pair (#1656). Serial order 2 → 3; plan 3's pins are authored against plan 2's landed bytes. |
| `skills/red-team/SKILL.md` | 1, 2 | Plan 1's maxParallel prose instruction; plan 2's escape-semantics doc hits. Disjoint sections; serial order resolves. |
| `CONTEXT.md` | 1, 3 | Plan 1 adds three glossary rows (batching helper, Budget-Raise trailer, drain cause); plan 3 evicts to `glossary-cold.md` (#1651) and must re-measure headroom AFTER plan 1's additions land — plan 3's eviction arithmetic is stated re-measure-at-base for exactly this reason. |
| `skills/war/references/schemas.md`, `agents/war-refiner.md` | 1, 3 | Plan 1's contract rows / refiner wiring; plan 3's doneWhen parenthetical and card pins. Disjoint rows; serial order resolves. |
| `skills/war/SKILL.md` | 1, 3 | Plan 1's P3 launch-wiring edits; plan 3's new Phase 1 Task 8 (#1708 ruled-ask bullet rewrite with lock-step D37/D41 pin moves). Different regions; serial order 1 → 3 resolves, and plan 3's task names the cross-plan caution explicitly. |

## Issue → spec → plan chain

| Spec | Plan | Issues |
|------|------|--------|
| `docs/specs/2026-08-25-engine-reliability-and-filing-fidelity-design.md` | `docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md` | #1552, #1586, #1671, #1430, #1666, #1480, #1679, #1680, #1681, #1672, #1476, #1456, #1560, #1561, #1562, #1597, #1592, #1589, #1575, #1574, #1571, #1659, #1660, #1577, #1435, #1421, #1688 + folded ask-campaign follow-ups #1691, #1692, #1693, #1694, #1696, #1704 |
| `docs/specs/2026-08-25-authoring-doctrine-and-lint-coherence-design.md` | `docs/plans/2026-08-25-authoring-doctrine-and-lint-coherence.md` | #1641, #1637, #1640, #1642, #1638, #1639, #1643, #1682, #1655, #1684, #1685, #1650, #1674, #1397, #1396 |
| `docs/specs/2026-08-25-doc-truth-and-drift-guard-debt-design.md` | `docs/plans/2026-08-25-doc-truth-and-drift-guard-debt.md` | #1662, #1625, #1622, #1621, #1620, #1618, #1292, #1565, #1545, #1537, #1536, #1651, #1522, #1399, #1477, #1474, #1678, #1652, #1653, #1654, #1656, #1521, #1525, #1488, #1513, #1587, #1539, #1538, #1535, #1446, #1542, #1673, #1675, #1676, #1677, #1683, #1686, #1687, #1689 + folded ask-campaign follow-ups #1695, #1705, #1706, #1707, #1708, #1709 |
