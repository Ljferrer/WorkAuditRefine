---
name: gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity
description: "Presence-only gate on a mirrored line misses wording drift"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity
  phase: learnings-read-path/phase-1-T3
  date: 2026-07-06
  keywords:
    - byte-identical pointer line
    - cross-surface prose consistency
    - anchor-phrase assertion vs literal-text assertion
    - doc-contract test gap
    - mirrored clause drift
  tags:
    - gate-design
    - doc-contract-test
    - plan-floor-vs-ceiling
    - cross-surface-prose
  relates:
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[plan-survey-token-sweep-misses-untagged-siblings]]"
    - "[[wire-key-rename-misses-prose-placeholders]]"
  originSessionId: 25ba6ce0-3716-47e8-98b6-d39b33de3609
---

# A doc-contract gate can assert a mirrored clause is *present* without asserting it is *byte-identical*

**What was found (learnings-read-path phase-1, T3, Nit — referent not found in this worktree @
phase-1 landing; verify still present before acting in the integrated `skills/lessons-learned/`
tree):** Commander's Intent required the CLAUDE.md pointer line be "byte-identical across every
surface that emits it" (migrate playbook, Gate 2 publication, and the target repo's own
CLAUDE.md). T3's new doc-contract test asserted only the anchor phrases
`` `CLAUDE.md` carries the pointer line `` and `append-if-absent` were present in
`references/migration.md` — it did not assert the *quoted pointer-line text itself* matches
byte-for-byte. The plan's mapped-tests list for T3 enumerated exactly 4 anchor-phrase assertions
and did not include a byte-identity check, so this was not a plan-floor violation — but a future
edit to the pointer line's wording or emoji at one surface would silently diverge from its
siblings and no test would catch it.

**The pattern:** when a plan requires the same literal string to be reproduced across N surfaces
(a pointer line, a CLI invocation example, a version string), a doc-contract test that asserts
each surface *contains a clause about* the shared text (an anchor-phrase match) is necessarily
weaker than one that asserts the *literal shared substring* is identical across surfaces. Anchor-
phrase tests catch removal; they do not catch drift between copies. This is the sibling case to
[[verbatim-mirror-directive-context-mismatch-at-destination]] (which is about a mirror being
*wrong* at the destination context) — here the risk is the mirror silently *diverging* over time
because no single task owns cross-surface consistency and the gate for each surface only checks
its own presence.

**Why:** per-task plan slices are scoped to one surface at a time; nothing in a phase's task
breakdown assigns ownership of "these N surfaces must stay byte-identical" unless the plan
explicitly adds a cross-surface diff/consistency test.

**How to apply:** when a plan (or Commander's Intent) requires byte-identical text across
multiple surfaces, add one small cross-surface test that extracts the literal substring from
each surface and asserts equality (not just each surface's own anchor-phrase presence) — ideally
owned by whichever task lands last among the mirrored sites, or as a phase-closing task. Absent
that test, flag the gap as a Nit at every task landing that emits the mirrored text, so a future
sweep can add the missing consistency gate deliberately rather than by accident.

> archived 2026-07-15: resolved — moved to archive
