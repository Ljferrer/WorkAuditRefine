---
name: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
description: "Check a doctrine record's precedent-mapping bullet against the cited lesson's text and the same doc's Consequences caveats, and carry those caveats into any downstream echo"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
  phase: "audit-evidence-precedence/phase-1 task 1.1 +1 recurrence (phase-2 task 2.1 README blurb, corrected at phase close, 2026-07-28)"
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
    - README Status blurb echo
    - downstream propagation of a source drift
    - bound every absolute
  tags:
    - doctrine
    - adr
    - audit-pipeline
    - documentation
  created: 2026-07-28
  originSessionId: unknown
  modified: 2026-07-28T21:10:15.607Z
---

# A doctrine record's precedent-mapping subsection can contradict the same document's own Consequences bullet

**Pattern:** when an ADR or doctrine record adds a "precedent evidence" or "precedent-lesson
mapping" subsection that cites a prior lesson as proof of a decision, the mapping bullet's
paraphrase of the incident can drift from the lesson's own text. It can also contradict the *same
document's* correct account elsewhere (e.g. its `## Consequences` section).

**Instance (fixed before land):** in `docs/adr/0041-audit-evidence-precedence.md`'s
`### Precedent-lesson mapping`, the bullet for `auditor-grep-tool-unrestricted-by-git-verb-bash-guard`
said the seat "fell back to lower-rung prose" and that "the unrestricted Grep tool still reached the
pinned content". The cited lesson records that the seat **self-demoted** to a SOFT
`disposition: note` finding. The ADR's own `## Consequences` bullet already said so ("misuse of the
D2 default arm — self-demotion off a reachable rung 1"). And the ADR's own `content-at-pin` ladder
ranks working-tree Grep at rung 2: the Grep tool reads the mutable working tree, never the pinned
blob. A fix round corrected it before land.

**Why it matters:** this ADR is a canonical doctrine source that other surfaces mirror (CONTEXT.md
glossary terms, dispatched-prompt skeletons). A false code fact or ladder mis-rank there is a drift
seed, not a typo.

**How to apply:** when adding or reviewing a "precedent evidence" / "mapping" subsection, check each
mapping bullet against (1) the cited lesson's own text (read it; don't paraphrase from memory) and
(2) every other section of the same document that describes the same incident (a `## Consequences`
bullet, a design-tree row). If the document's ladder/rung vocabulary is involved, confirm the
bullet doesn't license the anti-pattern the cited lesson exists to prevent.

Related: [[tour-narrative-can-assert-a-false-code-fact-that-survives-until-a-doc-sweep-catches-it]]
(same family — a canonical/narrative document asserting a false code-fact). [[audit-log-finding-can-be-stale-by-land-time]]
(the finding-match-check discipline that demoted this to a generic pattern rather than a live
instance).

## Recurrence 1 — the drift propagated one hop downstream and landed

In the same plan's Release task (phase 2, task 2.1), `README.md`'s `## Status` blurb copied the
mapping subsection's framing verbatim ("each of the three motivating lessons maps to exactly one
claim shape ... all three to `content-at-pin`"). It dropped the ADR's own `## Consequences`
qualifier that the third mapping is "the least clean fit" and maps to misuse of the D2 default arm.
Nine auditor seats flagged it; none could absorb it, so it reached the landed tip. The Lead
re-grounded the notes and corrected the blurb at phase close, so it is no longer live.

**Sharper rule:** a downstream release or status blurb that echoes a doctrine record's mapping
subsection inherits that record's caveats too. Before echoing a mapping bullet, read the record's
`## Consequences` (or equivalent caveats) section, not just the subsection you copy.

For why release-slot findings arrive as notes and must be fixed in the Lead's close-out pass, see
[[release-slot-files-exempt-from-in-run-ace-and-sweep-machinery]].

Related: [[release-blurb-overstates-guard-semantics]] and
[[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (sibling release-blurb
prose-precision families — the same "absolute claim vs. a documented residual exception" failure
mode, here applied to a doctrine-mapping absolute).

> archived 2026-08-15: resolved — moved to archive
