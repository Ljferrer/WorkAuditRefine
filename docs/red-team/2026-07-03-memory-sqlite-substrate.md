# Red-team report — WAR compounding memory (in-memory FTS5, two-root store, per-seat JIT retrieval)

**Plan:** [docs/plans/2026-07-03-memory-sqlite-substrate.md](../plans/2026-07-03-memory-sqlite-substrate.md)
**Run:** `wf_cc60e078-76b` (task `wu3o0dwow`) · 10 probes (6 spine + 4 bespoke), each adversarially confirmed.
**Sandbox tip:** `a9c0241` (plan-4 branch cut off fresh master; #470 merged). **Node:** v24.17.0.
**Verdict:** **CLEAR** — no plan patch required. Gate returned `BLOCKED` on 7 `needsDecision` items; all
adjudicated non-genuine under AFK (NYI-deliverable misfires), corroborated by the purpose-built
`construct-anchors-present` probe passing.

## Attack surface

| Probe | Kind | Status | Findings |
|---|---|---|---|
| preconditions (live repo) | spine | **fail** | 7 — all NYI misfires (F1) |
| executable-proof | spine | pass | 0 (ran in sandbox) |
| coverage-vs-source | spine | pass | 0 |
| consistency-placeholders | spine | pass | 0 |
| dependency-feasibility | spine | pass | 0 |
| intent-vs-plan | spine | pass | 0 |
| node-sqlite-fts5-available | bespoke | **pass** | 0 — Node 24.17, `node:sqlite` + FTS5 + bm25 verified |
| construct-anchors-present | bespoke | **pass** | 0 — every edit anchor correct (F1 refutation) |
| phase1-file-disjointness | bespoke | **pass** | 0 — T1–T4 / T5–T7 pairwise disjoint |
| testsh-gate-discovery | bespoke | **pass** | 0 — Open-decision 3 resolved |

Coverage whole: `onTarget 10/10`, `offTarget []`, `dropped []` — not INCOMPLETE.

## F1 — 7 NYI-deliverable misfires (`needsDecision`, adjudicated NON-BLOCKING)

The generic "preconditions" spine probe graded the plan's own **deliverables** as missing preconditions:

| # | Probe claim | Reality (why it's a misfire) |
|---|---|---|
| 1 | war-servitor.md D4 append-pointer "still exists" | T4 **deletes** it — the instruction existing now is the *precondition* for its deletion. |
| 2 | war-servitor.md D4 discipline "still exists" | T4 deletes it. Same. |
| 3 | war-servitor.md `memory_index_updated` "still exists" | T4 drops it. Same. |
| 4 | workflow-template.js `memory_index_updated` schema "still defined" | T4 drops it. Same. |
| 5 | workflow-template.js D4 INDEX HYGIENE line "still exists" | T4 deletes it. Same. |
| 6 | war-config.mjs DEFAULTS "has no memory block" | T2 **adds** it — correctly absent today. |
| 7 | workflow-template.js "no `memoryClause`" | T4 **threads** it — a new construct, correctly absent today. |

This is the known `redteam-claims-vs-reality-misfires-on-impl-plans` pattern: an analysis lens grades
not-yet-implemented work as a Critical/Major/needsDecision gap, and the Lead adjudicates. The decisive
refutation is the bespoke **`construct-anchors-present`** probe (built to check these exact anchors),
which **passed** — independently confirming (a) the deletion anchors (D4 lines, `memory_index_updated`)
EXIST as the plan needs them to for deletion, and (b) the additive constructs (`memory` block,
`memoryClause`) are correctly ABSENT because T2/T4 create them. The plan is internally coherent; no
patch applied.

## Open decisions — all resolved

1. **Stacking** → **fresh `origin/master`.** PR #470 merged 2026-07-03, so the spec/ADR 0014/CONTEXT
   terms are on master; the plan-4 branch was cut off fresh master (`a9c0241`), not #470's branch.
2. **Version literal** → **+0.1.0.** Land-time base is 0.13.0 (plan 3 shipped); target **0.14.0**
   (operator is version authority at land).
3. **`safe-swap.test.sh` placement** → **no convention violated.** The `testsh-gate-discovery` probe
   confirmed existing `*.test.sh` files ride the gate's `find … -name '*.test.sh'` sweep with no
   `-maxdepth`/path exclusion; a new test under `skills/lessons-learned/assets/` is discovered and run.

## Residual risk (non-blocking)

- **T7 CI YAML is unexercisable by the gate** (`.github/workflows/memory-audit.yml`) — proves itself on
  this plan's own PR; the plan already flags this (Notes §5). The worker smoke-runs the `lint` command
  against a fixture path pre-commit.
- Migration against the operator's live 133-lesson corpus is **post-land ops**, not a task (Notes §3).
