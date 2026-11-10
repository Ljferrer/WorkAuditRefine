---
name: gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity
description: "An anchor-phrase gate proves a mirrored clause is present, not byte-identical; byte-identity needs a cross-surface extract-and-equal test, so check the registry row's mode before trusting a 'verbatim' doc claim"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: gate-can-assert-mirrored-clause-presence-without-asserting-byte-identity
  phase: learnings-read-path/phase-1-T3
  date: 2026-07-06
  keywords:
    - byte-identical pointer line
    - cross-surface prose consistency
    - anchor-phrase assertion vs literal-text assertion
    - doc-contract test gap
    - mirrored clause drift
    - pointer byte-identity
    - war-config.test.mjs
    - mirrored verbatim
    - token-anchor drift guard
    - assert.doesNotMatch retired claim lock
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

**The original gap (learnings-read-path phase-1, T3, Nit):** Commander's Intent required the
CLAUDE.md pointer line to be byte-identical across every surface that emits it. T3's doc-contract
test asserted only the anchor phrases `` `CLAUDE.md` carries the pointer line `` and
`append-if-absent` in `references/migration.md`. It did not assert that the quoted pointer-line
text matched byte for byte. Anchor-phrase tests catch removal. They do not catch drift between
copies.

**RESOLVED (drift-guards phase, t1.2 — code-verified):** `skills/war/assets/war-config.test.mjs`
now has the test `'pointer byte-identity: the ratified pointer line is byte-identical across the
three canonical surfaces (#656, D4)'`. It names this lesson's slug in its source comment. It
extracts the pointer line from `CLAUDE.md`, `skills/war/SKILL.md`, and
`skills/lessons-learned/references/migration.md` by locating the 📚 lead marker on the anchor's
line (skipping each surface's legitimately-different blockquote/indentation prefix), then asserts
byte-`equal` across all three. The older `#534` presence-only duty test stays in place as
orthogonal: it catches full removal, and the new test catches wording drift.

**Durable pattern:** when a plan or Commander's Intent requires N surfaces to carry byte-identical
text, add a cross-surface literal-extraction plus equality test. Extract from each surface by
construct (anchor + lead-marker slice, never a fixed substring offset), and compare pairwise
against a canonical first surface. The test above is the reference implementation in this
codebase.

**Reader-side rule:** before you trust a "verbatim" or "byte-identical" claim in a standing doc,
find the registry row that backs it and read its `mode` (or its anchor list). Anchors prove
presence only. Byte-identity holds only when the row does `deepEqual` on extracted literal text.
Instance: `agents/war-auditor.md`'s "## Read-only git guard contract" said it was "mirrored
verbatim" into the audit prompt, but its registry row in
`skills/war/assets/workflow-template.test.mjs` checked four regex anchors per surface. The claim
was retired and is locked by `assert.doesNotMatch(auditorMd, /mirrored verbatim/i)`.

> archived 2026-07-15: resolved — moved to archive
