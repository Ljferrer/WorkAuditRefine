# Red-team: 2026-11-08-engine-findings-ace-and-late-fix

- **Plan:** `docs/plans/2026-11-08-engine-findings-ace-and-late-fix.md`
- **Verdict:** ADJUDICATED (round 1: every blocker and decision ruled and patched in place; four rulings operator-confirmed on 2026-11-09, the rest AI-declared)
**Rounds:** 1
- **Base:** `ed183b08` (plans 1 to 3 of campaign 2026-11-08-survey-debt merged), sandbox clone at `8c15e55e` (base plus the plan).
- **Probes:** 14 (6 spine, 8 bespoke), 6 executed, 8 analyzed, all on target, none dropped. Escape guard exit 0 against the snapshot.
- **Gate:** first pass BLOCKED (16 blockers, 7 needsDecision, 28 minors). After the rulings, 18 findings stamped adjudicated; the gate returned ADJUDICATED at rounds 1 with no route upstream.

## Pre-round claim (2026-11-09)

Follow-ups carried from the recovery plan were claimed before round 1:

- #2770, #2771, #2772 ride T1.1 as a re-apply of `2677cc81` (D41, End state 52). The commit applies clean at `ed183b08`. End state 52 is red at base and prints 5 after a sandbox cherry-pick.
- #2763 rides T1.1 (D43, End state 54).
- #2773 rides T4.1 (D42, End state 53).

## Operator rulings (2026-11-09)

- **parkFixless (Q1):** a "None needed." fix counts as no fix at all seven `blankText(f.suggested_fix)` sites, `parkFixless` included, so the row parks as an ask.
- **Setup-step ace gate red (Q2):** a `provision_failed: true` red gets D35's one fresh re-run but no re-ask for ids. It reverts only when the re-run is red again. End state 23 and its fixture changed to match.
- **Net-zero clash check (Q3):** it runs inside the clashed task's pin-transfer dispatch, after that dispatch's own forward revert.
- **Byte budget (Q4):** the prompt-literal share is the binding limit (8,528 B to its hard line at `ed183b08`). Dedup is the first choice. A task may raise the hard line if it cites an ADR 0042 justification in its commit body.

## Patched in place (Lead, AI-declared)

- **Staged cap (Major, 4 probes):** re-based on the #2761 args sibling script: `ARGS_HEADROOM_BYTES` = 4,096 B, about 107 KB of room. The 459 B ledger row and the mandatory dedup funding are gone. Arm (p) stays in every engine Done when.
- **Seven blankText sites (Major, 3 probes):** Context A, D1, End state 2 (base prints 7) and the T1.1 slice now name `parkFixless`.
- **Evidence consumed (Major):** rows added for #2676, #2763, #2770 to #2772 and #2773.
- **End state 51 owner (Major):** added to the Critical path as T3.1.
- **T4.1 REGISTRY row (Major):** T4.1 now owns `workflow-template.engine-1.test.mjs` and adds a late-fix merge prompt to `late-fix-pass.md` row, with the floor raised.
- **Refiner card "unconditionally on merge outcomes" (Major):** T2.1 owns `agents/war-refiner.md` and rewrites the sentence with no net growth. Its Done when checks the old text is absent.
- **T5.1 card pointer (Major):** the net-zero arm rides the existing step-4 `§ Pin-transfer arms` pointer within 22 B, or a named eviction pays for it. The Phase 5 red-team confirms the block.
- **Backstop row 1 (Major):** the clash, identical-edit and moved-tip cases are now T5.1 git-4 fixtures (Done when count 6, End state 22 prints 2). The row stays as a pre-launch ratification of Phase 5.
- **D42 (Minor):** an at-tip fix is pushed onto `lateFixed` (`atTip: true`) so the handoff endState map reads it as fixed.
- **End state 30 (needsDecision):** kept judged, with the reason written down. Lock-step and the floor are gate tests already, and "next free" depends on live sibling branches.
- **Stale numbers (Minor):** card headroom (1,482 B, 22 B, 25 B), the REGISTRY floor (45), four `r.aceSha =` sites, four `tipClass(` reads, the D33 section created new with a funded card pointer, "over engine-1" on End states 13, 14 and 21, the issue count (37) and the Context count.

## Residual risk (minors not patched)

- Several prose greps in End state 34 and T3.1's Done when are case-sensitive. A re-cased landing sentence false-negates. Workers should copy the anchor text exactly.
- The other minors are duplicates of the stale-number rows above.

## Phase 5

The Build order still requires its own `/red-team` before the Phase 5 `/war` launch. Agenda: the D22 card block size and the net-zero step against the Phase 5 base.
