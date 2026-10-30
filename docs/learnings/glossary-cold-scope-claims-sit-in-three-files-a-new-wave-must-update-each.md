---
name: glossary-cold-scope-claims-sit-in-three-files-a-new-wave-must-update-each
description: "A new glossary-cold.md body can leave its header, the D32 test comment and the census comment claiming the old scope"
metadata:
  node_type: memory
  type: project
  keywords:
    - glossary-cold.md
    - born-cold
    - D32
    - eviction wave
    - skill-doc-contracts
    - doc-cli-consistency
    - VERB_SCAN_EXCLUSIONS
    - EVICTION_DESTINATIONS
    - coldness criterion
    - comment lag
  provenance: code-verified
  slug: glossary-cold-scope-claims-sit-in-three-files-a-new-wave-must-update-each
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-1 (tasks 1.1, 1.4)"
  tags:
    - war
    - glossary
    - adr-0042
    - doc-drift
    - drift-guard
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T02:35:18.289Z
---

# `glossary-cold.md` scope claims sit in three files, and a new wave must update each

**The three sites.** Each one states what the cold file holds.

1. `skills/war/references/glossary-cold.md`, the header. Its coldness-criterion parenthetical lists
   the waves recorded in the D32 row. Wave 5 added two evicted bodies (Executor gate, Decisive slot)
   and three born-cold bodies (Fork trial, Pair beat, Trials run block). The list said "through wave 3".
2. `skills/war/assets/skill-doc-contracts.test.mjs`, the D32 lead comment. It said the row "covers every
   evicted term". That was already false for wave 4, whose bodies are deliberately unpinned. It was also
   false for the born-cold terms, which CONTEXT.md never held.
3. `skills/_shared/doc-cli-consistency.test.mjs`, the reason comment above the `glossary-cold.md` entry.
   It scoped the file to "evicted incident/recovery bodies".

**Who owned what.** Task 1.4 owned sites 1 and 2, and its ace fix round corrected both. Site 3 is in
task 1.1's Files, a file-disjoint sibling. The 1.4 audit raised it as a cross-task cascade
(`phaseClose: true`), because task 1.4 could not touch it. It read correctly for wave 5 at the integrated
tip. Which later commit made it correct is not recorded in the audit log.

**A born-cold body has no pre-eviction text.** The header now says so (search `born-cold body is
authored here first`). A pinned companion test, `D32 companion`, checks that the clause stays beside the
`at eviction time` qualifier. It checks the clause's presence, not its truth. ADR 0044 records that
residual.

**A plan locator was wrong.** The plan slice for task 1.1 put the census reason comment in
`EVICTION_DESTINATIONS`. Its only home is `VERB_SCAN_EXCLUSIONS`, because the file phrases no scanned
module's CLI commands. The worker reworded it in the live home. The audit ruled that a faithful
deviation.

**Wave 6 repeated the lag.** Its four born-cold bodies (Tip probe, Merge-commit provenance, Provision tree
marker, Launch identity of a recovery) are pinned by `skills/red-team/assets/workflow-scaffold.test.mjs`,
not by the D32 rows. The header and the D32 comment record that. The census comment does not: it still
lists only fork trial, pair beat and Trials run block.

**How to apply.** For the next wave, edit the header wave list, the D32 rows and lead comment, and the census
reason comment together. If the wave's pin lives elsewhere, as wave 6's does, the header and D32 comment
must name that file. Search by the file name `glossary-cold.md`, not by the old phrase. Check which
task owns each file before you split the work, because the files are disjoint across tasks.

**Locate-cue (verify still present before acting).** Search `selections for waves 1-3 and 5` in the
header, `since wave 5, the born-cold terms too` in the D32 comment, and `born-cold bodies that never
lived in CONTEXT.md` in the census file. The wave 6 pin is the `Tip probe` term list in
`workflow-scaffold.test.mjs`. Grounded at the phase-1 integration tip via the `_refinery`
worktree (rung 2).

Related: [[new-references-md-file-forces-doc-cli-consistency-placement-census-registration]],
[[adr-0042-eviction-destination-creation-does-not-auto-register-in-qualified-headers]],
[[plan-line-number-refs-stale-use-construct-locator]].
