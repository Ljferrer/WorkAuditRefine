---
name: an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging
description: "An unruled ask finding that later rounds re-raise as Major absorb makes every ace round fail, so the fix is an early ruling"
metadata:
  node_type: memory
  type: project
  keywords:
    - ace ladder
    - ask finding unruled
    - recurring Major
    - forward-revert
    - phase-close polish queue
    - Ignore-for-now
    - disposition flip
    - round limit
  provenance: agent-unverified
  slug: an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging
  phase: 2026-10-20-rea-artifact-evidence/phase-7 task 7.2
  tags:
    - war
    - audit
    - ace
    - process
    - ask-unruled
  created: 2026-10-24
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-25T00:57:10.285Z
---

# Rule it early: one defect, three dispositions, six reverted rounds

**Status of this note.** Every fact below comes from the phase-7 audit log, not from reading git objects. The causal sentence is a hypothesis, labeled as one.

**What the log shows (task 7.2).**
- The round-0 panel (pin 970157736be2) rated one defect, "the deadline cannot stop a running git call", as Minor with disposition `ask` (two seats, one tagged `barrier:trade-off`). The panel approved with `fixRounds: 0`.
- Ace rounds ran on pins 7c1e6eae, 9d9752f3, 0687a047, 5360f024, 35bbf700 and 7771b585. Correctness and security re-raised the same defect each round. Its severity and disposition flipped: Major absorb, Minor follow-up (`barrier:underspecified`), Minor ask, note. Plan-faithfulness and test-fidelity called it a slice-faithful note in most rounds.
- The fixer listed it under Ignore-for-now from the third ace round on. By the fourth the stated reason was "no threaded finding asks for a per-call timeout". The Major had been threaded every round, and seats cited backward-chain rule 7 (an ignored link on the chain keeps its severity).
- The seats' text names forward-reverts of the ace work: 8fe69e4e reverts 7c1e6eae, and c72c9570 reverts 7771b585. The pin-transfer entry records the content tree equal to the approved tree. The landed 7.2 tree is therefore the round-0 tree.
- The absorb fixes the ladder produced did not land with 7.2. They rode the phase-close polish queue: twelve queued titles, ten changed in code, tests or docs, two closed with no change. The terminal polish round approved with two absorb findings open (a `-C`-after-subcommand Minor and a header-comment Nit), because a terminal round has no round left.
- The audit log carries `escalations: []`. No operator ruling on the per-call question exists in it.

**Hypothesis (agent-unverified).** The ladder could not converge because the fork was never ruled. A defect the fixer will not take under its subset cannot reach approval. A seat that sees it as a fixable bug will keep blocking. A seat that sees it as an operator decision will keep filing an `ask`. An operator ruling on the round-0 `ask` (bound each call, or accept the 60 s margin and document it) would have ended the loop in round 1.

**How to apply.**
- When one finding title recurs across ace rounds with a flipping disposition, stop the ladder and put the round-0 `ask` to the operator. Do not raise the round cap: it is a safety control ([[bounded-fix-and-ace-rounds-are-a-safety-precaution-plan-defect-exit-discloses-at-round-5]]).
- When you write the slice, say whether the contested case is in scope. Here the slice held a loop-level mechanism and a "stop hashing" purpose, and the two read differently: [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]].
- Check an Ignore-for-now reason against the audit log before you accept it. A claim about what was threaded is checkable.
- Budget the polish queue. Absorb fixes from a reverted ladder land there, and the terminal polish round cannot drain what it raises: [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

Related: [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].
