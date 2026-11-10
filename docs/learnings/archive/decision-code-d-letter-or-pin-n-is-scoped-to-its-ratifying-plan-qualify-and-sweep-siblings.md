---
name: decision-code-d-letter-or-pin-n-is-scoped-to-its-ratifying-plan-qualify-and-sweep-siblings
description: "A D-letter or PIN-N decision code is scoped to the plan or spec that ratifies it, so qualify it with that plan's name or date when another plan's code is nearby, and fix every bare sibling in the file"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: decision-code-d-letter-or-pin-n-is-scoped-to-its-ratifying-plan-qualify-and-sweep-siblings
  phase: "auditor-guard-policy-and-mirror-truth/phase-1 task 1.1 +recurrence (latest 2026-09-06-engine-and-audit-verdict-integrity/phase-4 p4-polish, 2026-07-27)"
  keywords:
    - D-letter decision label
    - decision tree taxonomy
    - D1 D6 namespace collision
    - bare decision letter
    - spec date qualifier
    - cross-spec comment ambiguity
    - ADR decision code collision
    - PIN-N citation collision
    - PIN-8 D4 collision
    - ADR ratifying plan
    - Status line ratification
    - qualify decision code with plan name
    - sibling bare reference unfixed
  tags:
    - documentation
    - comment-hygiene
    - audit-pattern
  created: 2026-07-27
  originSessionId: 0ad881e1-4bbc-43c6-8e45-8597d9cec1cf
  modified: 2026-09-07T21:50:49.953Z
---

# A D-letter or PIN-N code is scoped to its ratifying plan: qualify it, and sweep the siblings

**Rule:** any short decision code (`D4`, `PIN-8`) that a spec, ADR, or code comment cites belongs to
that document's own ratifying plan. It is never global. When a sentence brings in a different
plan's code, qualify it with the plan's name or date (for example "the 2026-07-22 spec's D6"). When
you qualify one occurrence of a colliding code, also qualify every other bare occurrence of that
code nearby.

**Why:** this repo's specs and plans each reuse the same `D1`-`D6` "Resolved design tree" letters,
so collisions across documents are structural, not one-off. A bare code next to a qualified one
reads as if both belong to the same plan.

- Spec instance: a comment had a `2026-07-22` spec's `D6` bare, two lines from "the 2026-07-26
  spec's D3". The plan's own caution said "don't renumber, and qualify new references". Qualifying
  only the new reference left the old bare one ambiguous. The caution forbids changing the letter,
  not adding a date qualifier.
- ADR instance (2026-09-06-engine-and-audit-verdict-integrity, phase 4): a fix added
  `(D4, PIN-8, #1973)` to `docs/adr/0049-pin-transfer-and-proportional-re-audit.md`. ADR 0049's
  `**Status:**` line ratifies it against `docs/plans/2026-08-30-engine-concurrency-and-pin-transfer.md`,
  whose `D4` and `PIN-8` mean other things. The intended referents were the 2026-09-06 plan's.
  Four auditor seats raised the same Minor in one round. The fix qualified that citation ("the
  2026-09-06 engine-and-audit-verdict-integrity plan's D4 and PIN-8, #1973"), but a bare `(D4)`
  three lines below, naming the other plan's decision, shipped unfixed. That residual came from a
  terminal audit round; see [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

**How to apply:**
- Before trusting a bare code in an ADR, read that ADR's `**Status:**`-line plan and check for a
  same-letter or same-number collision.
- When a fix qualifies one occurrence, grep the whole file for every other occurrence of the same
  bare code. A fix pass tends to stop at the first hit.

> archived 2026-08-15: resolved — moved to archive
