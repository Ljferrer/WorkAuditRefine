---
name: claimed-end-state-ids-are-intent-ordinals-and-phase-row-indexes-are-a-different-numbering
description: "A worker's claimed End-state ids are intent ordinals, so a compare against the phase row index is wrong"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-2
  node_type: memory
  type: project
  keywords:
    - acceptance_criteria_covered
    - claimedEndStateIds
    - intentOrdinalByRow
    - phaseWideNs
    - endStateRows
    - phase-local row number
    - intent ordinal
    - fixture numbering coincide
  provenance: code-verified
  slug: claimed-end-state-ids-are-intent-ordinals-and-phase-row-indexes-are-a-different-numbering
  phase: "2026-11-08-engine-findings-ace-and-late-fix/phase-2 (task 2.1), landed cebb1d4d0a7826952f241b91d1c76a3197b140bf"
  tags:
    - war
    - workflow-template
    - end-state
    - gate-audit
    - test-fidelity
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T23:56:49.614Z
---

# Claimed End-state ids and phase row indexes are two numberings

Two id spaces live side by side in `skills/war/assets/workflow-template.js`.

- `claimedEndStateIds` (the worker's `acceptance_criteria_covered`) holds intent ordinals. `ACCEPTANCE_IDS_RULE` defines each id as the condition's 1-based ordinal in the intent's numbered End-state list.
- `endStateRows` comes from `ph.endState`. A row's index `i + 1` is its phase-local claim number. It is also the artifact `<n>` in `endstate-<phase>-<n>.log`.

A phase that claims intent conditions 44 and 45 holds them as rows 1 and 2.

## What went wrong in task 2.1

The first D30 cut of `phaseWideNs` tested `claimedByMerged.has(String(n))` with `n` the phase row index.
Three seats raised it as a Major.
It marked claimed rows phase-wide and suppressed per-task findings on them.
It also spawned an extra end-state-only seat and filtered real per-task out-of-scope rows.
The fixture passed because its phase rows were intent conditions 1..3, so both numberings agreed.

The fix round added `intentOrdinalByRow`.
It parses the numbered items out of the threaded `intent`.
It matches each row's condition through `normRef`: an exact match wins, else a starts-with match.
A row that resolves to no single ordinal gets `null`, is never marked phase-wide, and is logged once.

## How to apply

- If code compares a claimed id to a phase row, map the row through `intentOrdinalByRow` first. Never compare a claimed id to `i + 1`.
- If you write a fixture for such a compare, make the phase claim intent conditions that are not 1..k (for example 3..5 or 44..45). A 1..k fixture cannot fail on this bug.
- This is the same class as the archived [[endstate-check-dispatch-numbers-rows-positionally-not-by-plan-id]]. That lesson predates the intent-ordinal rule.

Related: [[weak-test-assertion-passes-without-feature-being-exercised]].

**Locate-cue (verify still present before acting):** found in `skills/war/assets/workflow-template.js` at `const intentOrdinalByRow`, `const phaseWideNs` and `const ACCEPTANCE_IDS_RULE` @ phase 2. Read via the run-scoped `_refinery` worktree, whose HEAD equals the landed tip.
