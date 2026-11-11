---
name: an-end-state-grep-on-a-card-that-now-holds-only-a-pointer-passes-without-fixing-the-text
description: A doc End-state grep aimed at a card whose text moved to references/ passes vacuously
metadata:
  node_type: memory
  type: project
  keywords:
    - end state
    - grep -c
    - vacuous check
    - references pointer
    - ADR 0042 eviction
    - stale doc text
    - red at base
    - card pointer
  provenance: code-verified
  slug: an-end-state-grep-on-a-card-that-now-holds-only-a-pointer-passes-without-fixing-the-text
  phase: "2026-11-08-engine-comment-and-duplication-tidy/phase-2 (task 2.1), landed 044a11f76d821eb44f8c5080df2aecb499c22e18"
  tags:
    - plan-authoring
    - end-state
    - doc-drift
    - hot-cold-law
  created: 2026-11-11
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T21:09:05.287Z
---

# A doc End-state grep on a card that holds only a pointer is vacuous

ADR 0042 evictions move card text into a `references/` file and leave a pointer on the card.
A plan that quotes the card text from an older read still aims its fix and its check at the card.
The check `grep -c '<stale phrase>' agents/<card>.md` then prints `0` before any fix.
The plan's "red at base" claim is false, so the End state passes while the stale text survives.

## Instance (open at this tip)

- `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md` End state 12 checks `grep -c 'that arm skips' agents/war-refiner.md`.
- At the landed tip, `agents/war-refiner.md` § Post-merge evidence dispatch step 3 holds only a pointer to `refiner-recovery.md` § Evidence phase diff.
- The stale phrase "absent ⇒ that arm skips" lives in `skills/war/references/refiner-recovery.md` (Evidence phase diff, step 3).
- A second copy, "absent ⇒ that arm skips with a log", lives in `skills/war/references/schemas.md` on the `phase_diff_files?` row.
- Two plan-faithfulness audit seats raised this as a `note` in task 2.1 of the engine-comment-and-duplication-tidy plan.

## What to do

- Before you write a doc End state, grep the phrase across the repo, not only the card the plan names.
- Aim the fix and the check at every file that carries the phrase. Follow card pointers to the reference file.
- Run the check at base and confirm it is red before you record "red at base".
- Related: [[a-phrase-grep-end-state-passes-on-a-sentence-that-negates-the-phrase]], [[default-flip-must-audit-all-doc-surfaces]].

Verify still present before acting: found at `agents/war-refiner.md`, `skills/war/references/refiner-recovery.md`,
`skills/war/references/schemas.md` and the plan's End state 12 @ phase 2 tip 044a11f7.
