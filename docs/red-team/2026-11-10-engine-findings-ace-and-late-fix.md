# Red-team: 2026-11-08-engine-findings-ace-and-late-fix (Phase 5 ratification)

- **Plan:** `docs/plans/2026-11-08-engine-findings-ace-and-late-fix.md`
- **Verdict:** ADJUDICATED (round 2: every blocker patched in place, AI-declared, under the operator's 2026-11-09 byte-budget ruling)
**Rounds:** 2
- **Scope:** backstop row 1, the pre-launch ratification of Phase 5 at its real base, plus the T5.1 ADR number.
- **Base:** `3f8534a5` (Phases 1 to 4 landed, plus the phase 4 learnings commit), sandbox clone at that sha.
- **Probes:** 9 (6 spine, 3 bespoke), 3 executed, 6 analyzed, all on target, none dropped. Escape guard exit 0 against the snapshot.
- **Gate:** first pass BLOCKED (6 blockers, 1 needsDecision, 10 minors). After the patches, 6 findings stamped adjudicated. The gate returned ADJUDICATED at rounds 2 with no route upstream.

## Backstop row 1 result

- **Net-zero clash replay (executed, pass).** In a throwaway git repo, the clash, the identical edit and the moved tip all behave as T5.1 claims. A rebase only through the approved sha merges with no conflict, and the claimant's line survives.
- **Card block for D22 (executed).** The refiner card is 38,905 B against a 38,912 B hard line, so only 7 B of headroom remain, not 22 B. The block to evict is the descriptive clause of `## File-followups dispatch` (about 233 B), moved byte-identically into `refiner-recovery.md` § File-followups filing. The intra-phase-dep evidence paragraph stays, because two tests pin it to the card.

## Patched in place (Lead, AI-declared)

- **ADR number (needsDecision, Major).** At this base the head is 0059. origin/master holds 0060, which the stack never merges in. The two paths differ, so git raises no conflict and no gate check notices a duplicate number. T5.1 now names `docs/adr/0061-polish-claim-and-net-zero-clash-range.md`. The ledger row no longer claims a merge conflict.
- **Card headroom (Major, 5 seats).** T5.1 no longer allows 22 B of growth. It funds the pointer by the named eviction, else by a cited ADR 0042 raise (operator ruling 2026-11-09).
- **D22 location (Minor).** D22 now names the step-4 `§ Pin-transfer arms` pointer, to match T5.1 and the card. Step 2 has no pointer.
- **Prompt-literal share (Minor).** T5.1 now states the live share: 169,289 B, 2,743 B below the hard line. Dedup first, else a cited raise.

## Adjudications

| Value | Supersedes | Provenance |
|---|---|---|
| D19 ADR number 0061 | `00NN`, next free at the rebased base | AI-declared |
| Card pointer funded by the File-followups eviction | net card growth of 22 B or less | AI-declared |

## Residual risk (minors not patched)

- End states 6, 9, 34, 50 and 54 use case-sensitive, one-line greps. They pass on the landed text, and those phases already landed.
- Wording drift in P23 ("Open decision 2") and T4.1 ("PIN-13 to PIN-18"). Both phases already landed.
- The Evidence-consumed join could not reach gh from the sandbox clone. Round 1 ran it from the real checkout.
