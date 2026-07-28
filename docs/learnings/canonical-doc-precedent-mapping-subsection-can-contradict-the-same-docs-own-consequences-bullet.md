---
name: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
description: "An ADR/doctrine record's 'precedent evidence' or 'mapping' subsection can misdescribe the incident it cites and contradict the same document's own correct account elsewhere — verify the mapping bullet against the cited lesson's actual text, not just against the doc's internal consistency"
metadata:
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
  phase: audit-evidence-precedence/phase-1 task 1.1
  keywords:
    - ADR self-contradiction
    - precedent-lesson mapping
    - doctrine record internal consistency
    - cited lesson text mismatch
    - canonical source drift
    - tour narrative false code fact
    - fix round resolved before land
    - ladder rung misplacement
    - Consequences bullet vs mapping bullet
  tags:
    - doctrine
    - adr
    - audit-pipeline
    - documentation
  created: 2026-07-28
  originSessionId: unknown
  modified: 2026-07-28T19:50:06.954Z
---

# A doctrine record's precedent-mapping subsection can contradict the same document's own Consequences bullet

**Pattern (generic — recorded from a resolved-before-land audit finding, not a live instance):**
when an ADR or doctrine record adds a "precedent evidence" or "precedent-lesson mapping"
subsection that cites a prior recorded lesson as proof of a design decision, the mapping bullet's
paraphrase of *what actually happened* in the cited incident can drift from the lesson's own text
— and, independently, from the *same document's* own correct account of the same incident stated
elsewhere (e.g. in a `## Consequences` section). Multiple auditor seats independently flagged this
shape on `docs/adr/0041-audit-evidence-precedence.md`'s `### Precedent-lesson mapping` subsection:
the mapping bullet for `auditor-grep-tool-unrestricted-by-git-verb-bash-guard` said the seat "fell
back to lower-rung prose" and rested a verdict "on rung-3 claims," and that "the unrestricted Grep
tool still reached the pinned content" — but the cited lesson's own text records the seat
**self-demoted** to a SOFT `disposition: note` finding instead of resting on any rung-3 claim, and
the same ADR's own `## Consequences` bullet already stated the correct version ("misuse of the D2
default arm — self-demotion off a reachable rung 1"). Separately, "the Grep tool... reached the
pinned content" conflicts with the ADR's own `content-at-pin` ladder, which ranks working-tree
Grep at rung 2 (advisory corroboration only) — the Grep tool reads the mutable working tree, never
the pinned blob.

**Why this is worth recording even though the live instance was fixed:** this ADR is a *canonical
doctrine source* other surfaces mirror (CONTEXT.md glossary terms, dispatched-prompt skeletons) —
a false code-fact or ladder mis-rank at the canonical source is a drift *seed*, not a cosmetic typo,
even when it is corrected in a fix round before land. The specific instance here was resolved
before land (task 1.1 carried `fixRounds: 1`, and the landed text at
`docs/adr/0041-audit-evidence-precedence.md` lines 99-104 reads the corrected version verbatim —
verified absent of the flagged wrong phrasing at the landed tip
`731d46e88b502009745bfbb07e9655fdd027cd0a`), so record only the **generic pattern**, not a live
instance.

**How to apply:** when adding or reviewing a "precedent evidence" / "mapping" subsection in a
doctrine record, verify each mapping bullet's incident description against (1) the cited lesson's
own text (read it, don't paraphrase from memory of the finding that produced it) and (2) any other
section of the *same* document that also describes the same incident (a `## Consequences` bullet,
a design-tree row) — a two-way self-consistency check inside one file, not just a check against the
external source. If the document's own ladder/rung vocabulary is involved, confirm the mapping
bullet doesn't silently license the exact anti-pattern the cited lesson exists to prevent (here:
describing a working-tree read as reaching "the pinned content" when the same document's own ladder
ranks working-tree reads below the pinned rung).

Related: [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]]
(same family — a canonical/narrative document asserting a false code-fact). [[audit-log-finding-can-be-stale-by-land-time]]
(the finding-match-check discipline that demoted this to a generic pattern rather than a live
instance).
