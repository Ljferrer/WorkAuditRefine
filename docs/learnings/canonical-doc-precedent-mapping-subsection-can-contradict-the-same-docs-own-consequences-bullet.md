---
name: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
description: "An ADR/doctrine record's 'precedent evidence' or 'mapping' subsection can misdescribe the incident it cites and contradict the same document's own correct account elsewhere — verify the mapping bullet against the cited lesson's actual text, not just against the doc's internal consistency"
metadata:
  node_type: memory
  type: project
  promoted: dev/2026-07-28-audit-evidence-precedence@phase-1
  provenance: code-verified
  slug: canonical-doc-precedent-mapping-subsection-can-contradict-the-same-docs-own-consequences-bullet
  phase: "audit-evidence-precedence/phase-1 task 1.1 +1 recurrence (phase-2 task 2.1 README blurb, live at land, 2026-07-28)"
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

## Recurrence 1 (2026-07-28, plan `2026-07-28-audit-evidence-precedence`, phase 2 "Release", task 2.1) — the predicted propagation actually happened, one hop downstream, landed, and was corrected at phase close by the Lead

The prior entry's "why this is worth recording even though the live instance was fixed" paragraph
predicted exactly this: the canonical source (ADR 0041) is mirrored by other surfaces, so an
uncorrected drift at the source is a *seed*. This recurrence is that seed germinating one hop
further out, in the **same phase's own Release task** — `code-verified` at the landed tip
`5f018f183eefa225ee900afd7e33dca9c5dfb4e8` (read directly in the `_refinery` worktree whose `HEAD`
equals that SHA, gitdir physical path
`<repo-root>/.claude/war-worktrees/2026-07-28-audit-evidence-precedence-2026-07-28/_refinery/`).
`README.md`'s `## Status` paragraph (task 2.1's own blurb) reproduces the ADR's `###
Precedent-lesson mapping` subsection framing verbatim — "each of the three motivating lessons maps
to exactly one claim shape and to the surface that shape's ladder forbids as a verdict basis — all
three to `content-at-pin`" — but drops the same ADR's own `## Consequences` bullet qualifying the
third mapping: "The third precedent-lesson mapping is the least clean fit: the ladders … mostly
*prescribe* the ranked surface rather than *forbid* a named one, so
`auditor-grep-tool-unrestricted-by-git-verb-bash-guard` maps to misuse of the D2 default arm …
rather than to a listed forbidden surface." Both referents confirmed present at the tip:
`docs/adr/0041-audit-evidence-precedence.md` lines 156-160 (the `## Consequences` qualifier) and
`README.md`'s `## Status` paragraph (the unqualified blurb sentence). Nine independent auditor
seats flagged variants of this same README paragraph across the two gate-audit passes; none was
absorbed (the `## Status` paragraph is a release slot, fail-closed off `absorb`) and none was fixed
before land (`fixRounds: 0` on task 2.1) — so this instance **did reach the landed tip**, unlike the
ADR-internal instance the base entry recorded as fixed-in-flight.

**Correction at phase close (2026-07-28, commit `29df5b46d23a41c9151513f88e6074b07b6c44eb`):** the
Lead re-grounded all nine notes at `5f018f18` and corrected the blurb, so the drift is **no longer
live** — `grep` for the unqualified sentence returns zero at `29df5b4`, and the paragraph now names
the third mapping's default-arm caveat explicitly. Do **not** cite this file as evidence of a live
uncorrected instance; the durable teaching is the *route*, not a surviving defect.

**Sharper form of the rule:** when a doctrine record's precedent-mapping subsection is
*intentionally* echoed by a downstream release/status blurb (progressive disclosure, summary
prose), the echo inherits the source's own caveats too — copying the mapping-subsection sentence
without also carrying the `## Consequences` qualifier re-broadcasts the unqualified absolute one
surface further than the canonical source itself asserts it. A downstream author paraphrasing a
canonical doctrine record's "mapping"/"precedent" subsection should read that record's own
`## Consequences` (or equivalent caveats) section before echoing the mapping bullet, not just the
subsection being echoed.

**Provenance note:** the base entry above is `agent-unverified` because its specific ADR-internal
instance was resolved before land; this recurrence is `code-verified` — the propagation was
confirmed by direct read at the landed tip `5f018f18`, and its correction confirmed at `29df5b4`.
This file's overall provenance is therefore `code-verified`, the strongest evidence any single fact
in the file carries.

**The load-bearing lesson is the routing, not the defect.** The absorb path is deliberately
fail-closed on release slots, so a release-blurb finding can only reach a fix through the Lead's
close-out pass. That makes "nine notes, zero absorbs" the *expected* shape for a release-slot
finding, not a failure — but it also means a Lead who treats `disposition: note` as "no action
required" ships the defect. Notes on a release slot are the Lead's queue, and re-grounding them at
the pin before editing is what makes acting on them safe.

Related: [[release-blurb-overstates-guard-semantics]] and
[[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (sibling release-blurb
prose-precision families — this recurrence is the same "absolute claim vs. a documented residual
exception" failure mode Recurrence 1 of `release-blurb-overstates-guard-semantics` already names,
here applied to a doctrine-mapping absolute rather than a guard-behavior absolute).
