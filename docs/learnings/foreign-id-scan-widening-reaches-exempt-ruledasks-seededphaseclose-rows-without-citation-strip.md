---
name: foreign-id-scan-widening-reaches-exempt-ruledasks-seededphaseclose-rows-without-citation-strip
description: "D10/PIN-14's every-row foreign-plan-id scan reaches ruledAsks/seededPhaseClose rows the own-token floor exempts, but the #1751 citation strip never applies to them, so a legitimate predecessor-plan citation in their prose hard-refuses the whole launch"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: foreign-id-scan-widening-reaches-exempt-ruledasks-seededphaseclose-rows-without-citation-strip
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-6 (task 6.1, D10/PIN-14,"
  keywords: 
    - provenance floor
    - foreign plan id scan
    - ruledAsks
    - seededPhaseClose
    - idText
    - evidenceText
    - stripSupersedes
    - predecessor citation
    - held:workflow-error
    - zero spawns
    - own-token floor exemption
    - false refusal
    - args provenance
    - workflow-template.js entry validation
    - D10 PIN-14
    - "#1749 #1751"
  tags: 
    - war
    - engine
    - entry-validation
    - provenance
    - workflow-template
  created: 2026-09-08
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-08T05:06:54.888Z
---

# The D10/PIN-14 foreign-id scan widening reaches two exempt surfaces the #1751 citation strip never covers

**Code-verified** at the landed tip `618ea8f49eaeaa52b2fd1721111d772ff69ea76e` on
`dev/2026-09-06-engine-and-audit-verdict-integrity` (landed-tip grounding: the `_refinery46`
worktree's `gitdir` physical path,
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/.git`,
contains this plan's slug, and its `HEAD` reads the threaded tip exactly). Read directly:
`skills/war/assets/workflow-template.js`, the provenance-floor surface loop.

Task 6.1 (D10, PIN-14, #1749) widens the args-provenance floor's foreign-plan-id refusal to scan
**every row's text across all five surfaces** (`intent`, `backstops`, `adjudications`, `ruledAsks`,
`seededPhaseClose`) — plan-mandated, "every row, exempt included," to close a leak class where a
foreign args blob's rows all carried `source:'auto'` and so were never id-scanned at all.

**The #1751 predecessor-citation strip did not widen with it.** `stripSupersedes`/`idText` — the
mechanism that lets a legitimate `supersedes … docs/plans/<other>.md` citation survive the foreign-id
scan — is produced only by `rowText` (the `intent`/`backstops`/`adjudications` extractor). The other
two extractors, `ruledAskRowText` and `seededPhaseCloseRowText`, return no `idText` at all; the
surface loop falls back to raw `.text` for them (`idText = rows.filter(r => r.text).map(r => r.idText
?? r.text).join('\n')`). Both extractors' own code comments say so explicitly: "The #1751
predecessor-citation strip (stripSupersedes / idText) is deliberately adjudications-only."

**The consequence: an exempt row is still refused on its own citation.** A `ruledAsks` or
`seededPhaseClose` row stamped with the run's own plan slug is exempt from the *own-token* floor —
but it is not exempt from the *foreign-id* scan, and its raw `suggested_fix` / `rationale` / `ruling`
/ `title` prose is now id-scanned uncited. A ruled-ask whose `suggested_fix` legitimately names a
predecessor plan's path (a routine shape in a stacked campaign, or — concretely — this very plan's
own Task 1.2, which edits `docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md` in
place) refuses the **entire next launch at entry**: `held:workflow-error`, zero spawns, terminal per
`schemas.md` ("never retried").

**Not a defect — ratified and plan-faithful, but load-bearing operational risk.** D10's own prose
in `schemas.md` states the widening runs "over every row's intent-bearing text, exempt rows
included," with no carve-out for the two non-`rowText` surfaces. At least six independent audit-seat
findings across task 6.1 (correctness, cascading-impact, plan-faithfulness, simplicity lenses, two
separate rounds) converged on this exact residual and every one recorded it `disposition: note` —
recorded as a bound, not requested as a fix. The `schemas.md` prose itself (`skills/war/references/schemas.md`
line 357) still describes the citation strip as applying "run-wide" without scoping it to the three
`rowText` surfaces — a further doc-accuracy gap task 6.3's own audit flagged and which also shipped
unfixed (see [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] for the
sibling schemas.md-drop pattern from the same phase).

**Same failure class as the archived
[[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]] lesson, different mechanism.**
That lesson names the #1413 own-token floor's false-refusal direction (a legitimate citation on
`intent` refuses outright). This is the #1751/#1749 pairing's equivalent gap on the *exempt-row*
surfaces of the newly widened foreign-id scan — a third manifestation of "a refuse-not-warn
provenance floor's protective carve-out does not automatically extend when the floor's scan scope
widens."

**Pattern to watch for:** when widening a shared entry-validation scan across N producer surfaces,
audit EACH surface's existing protective carve-outs (strips, exemptions) independently — a
protection built for one producer (here, the string/object `rowText` shape) does not automatically
cover a sibling producer that emits a different record shape (here, `ruledAskRowText`/
`seededPhaseCloseRowText`'s free-text fields), even when both feed the same downstream scan.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
`ruledAskRowText` and `seededPhaseCloseRowText` — search "deliberately adjudications-only" (the
comment appears at both sites); the surface loop's `idText = rows.filter(...).map(r => r.idText ??
r.text)` line, a few lines below the `provenanceSurfaces` array definition.
