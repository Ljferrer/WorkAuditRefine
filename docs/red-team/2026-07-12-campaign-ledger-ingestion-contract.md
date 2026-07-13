# Red-team report — campaign-ledger-ingestion-contract

**Plan:** `docs/plans/2026-07-12-campaign-ledger-ingestion-contract.md`
**Source spec:** `docs/specs/2026-07-12-campaign-ledger-ingestion-contract-design.md`
**Run:** Workflow `wf_5f914cec-c20` (session-opus). Base: `51361d6` (detached worktree `redteam-p5`).
**Artifact kind:** impl-plan

## Verdict: **CLEARED** (was BLOCKED — 1 Critical, resolved in 1 patch round)

- Initial: blockers **1** (Critical) · needsDecision 0 · minors 1. Coverage whole (7/7 on-target, 1 fail / 6 pass, 0 dropped). Escape guard clean.
- After patch (commit `a5803fd`): the Critical is resolved and re-verified end-to-end → CLEARED.

## The Critical (executable-proof, executed) — RESOLVED

**Finding:** the probe implemented the plan's *exact* stated mechanics (first-table state machine in `resolveRoadmapPlans` + backtick-ABSENCE-keyed fallback in `extractFiles`) and ran `init --roadmap` against the real `2026-07-11-war-resilience-and-recovery-roadmap.md`. It **still threw** `unparseable footprint for …/drift-guard-tightening.md — explicit position required`, so the plan's own primary verification (End-state 2) was unattainable as designed.

**Root cause:** `collectBlock` (left **unchanged** by the plan) breaks its continuation loop only on blank / heading / bold / checkbox (`NEW_CONSTRUCT`), **not** on a plain `- ` bullet. On a real `/war-machine` plan, `- Files:` is immediately followed by `- Plan slice:` (a `- ` bullet, no blank line), so the Files block bleeds through the backtick-heavy Plan-slice prose → the block contains backticks → the backtick-absence fallback never fires → the backtick matcher finds no path-shaped token → `extractFiles` returns `[]`. The `#739` bare-path fallback was therefore inert on real war-plan shape.

**Resolution applied (Task 1.1):** extend `collectBlock`'s continuation break to also stop at the next list item (`/^\s*-\s/`), scoping the block to the `Files:` line's own content. Added a block-scoping regression fixture; corrected End-state 2 and Notes Q7 (only `drift-guard-tightening` actually exercises the fallback; `servitor-redaction-at-source` already yields a footprint today).

**Re-verification (prototype, end-to-end):** first-table parser + `collectBlock` list-item break + backtick-absence fallback, run against the real roadmap →
- `resolveRoadmapPlans` → exactly **4** plan paths (first table only; chain-table spec links excluded).
- `extractFiles` per plan → red-team-resilience 4, drift-guard-tightening **1** (was `[]`), servitor-redaction 3, partial-phase 2 — all non-empty.
- **Result: 4 entries, no throw — End-state 2 MET.**

## Spine lenses

claims-vs-reality **pass** · coverage-vs-source **pass** · consistency-placeholders **pass** · dependency-feasibility **pass** · intent-vs-plan **pass** (Minor: AI-Commander's Intent is machine-authored — well-formed, all 14 End-states individually checkable and task-mapped; human upgrade path `/war-strategy`). executable-proof **fail → resolved**.

## Drift-guards (Lead-run)

- `unguarded-new-mirror` — vacuous. The plan explicitly declares the `bare-files-path` lint predicate a **deliberately-loose, independent NON-mirror** of the ledger's `isPathShaped` (Notes Q11), with the rule comment stating so and naming the fail-loud ledger throw as the real backstop. No sync contract → no drift-guard row required.
- `default-flip-old-absent` — not a default-flip/scope-narrow task; vacuous.
- `ff-topology` — N/A (no per-task merge-commit topology anchors).

## Backstops (2 — AI-declared, legitimate)

- E2E `/war-campaign` init on the next real roadmap · runner: next `/war-campaign` · covered by the in-task live-corpus probe on the committed corpus.
- `bare-files-path` lint hits surface in a `/war-machine` conversion report · runner: next `/war-machine` conversion · covered by unit tests (rule) + the SKILL.md lock (instruction).

Each carries its AI-declared operator-attention marker (ADR 0014).

## Residual risk

AI-Commander's Intent un-ratified by operator (human upgrade: `/war-strategy <plan>`).
