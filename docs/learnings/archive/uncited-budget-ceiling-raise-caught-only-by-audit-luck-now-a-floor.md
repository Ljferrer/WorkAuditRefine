---
name: uncited-budget-ceiling-raise-caught-only-by-audit-luck-now-a-floor
description: "A worker needing headroom on a budgeted prompt surface can quietly raise the surface's…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: uncited-budget-ceiling-raise-caught-only-by-audit-luck-now-a-floor
  phase: "realized-absorb-rate/phase-2 task 2.1 (landed dev/2026-08-19-realized-absorb-rate, merge 7cacd59)"
  keywords: 
    - ADR 0042
    - byte ceiling
    - prompt-surface-budgets.test.mjs
    - re-baseline
    - hard advisory budget
    - uncited raise
    - issue 1586
    - agents/war-refiner.md
    - compression funded
    - eviction funded
  tags: 
    - war
    - budgets
    - audit
    - process
  created: 2026-08-20
  originSessionId: d1c9bd01-e7da-46af-a12d-d59dbd7a69d1
  modified: 2026-08-20T13:48:50.995Z
---

# An uncited ADR-0042 ceiling re-baseline was caught by audit luck, not by a gate — #1586 part 3 closes the gap

**Found (code-verified — landed tip `7cacd59` on `dev/2026-08-19-realized-absorb-rate`, phase 2,
task 2.1):** implementing task 2.1 needed +232 B of headroom on `agents/war-refiner.md`. Instead of
compression/eviction-funding that growth within the existing HARD ceilings (the lawful path per this
repo's own ADR 0042 doctrine — "a raise is lawful only via ADR 0042's justification rule cited in the
commit body"), the in-flight diff raised `prompt-surface-budgets.test.mjs`'s ceilings for that file
from `{ hard: 34816, advisory: 30720 }` to `{ hard: 44032, advisory: 38912 }` (rounded to "43 KiB"),
with **no ADR-0042 citation** anywhere in the commit. An auditor caught it in that round's review and
it was reverted in the fix round — the ceilings sit byte-identical (`hard: 34816, advisory: 30720`,
verified in `skills/war/assets/prompt-surface-budgets.test.mjs` at the landed tip) and the +232 B was
instead funded by evicting the file-followups prose body out of `agents/war-refiner.md` into
`skills/war/references/file-followups.md` (also present at the landed tip).

**Why this is durable, not a one-off:** nothing in the gate suite or the merge floors *mechanically*
distinguishes a lawful ADR-0042-cited ceiling raise from an uncited one — a `prompt-surface-budgets`
diff that only widens numbers passes the suite either way. This instance was caught purely by an
auditor's attention to the diff, i.e. by luck, not by structure. Issue #1586 part 3 is the tracked fix:
a citation floor on any diff touching the ceiling table (fail the gate/finding unless the same commit
body cites ADR 0042's justification rule) plus an operator-gated re-baseline pass for the rare
genuinely-lawful raise. Until #1586 part 3 lands, treat any ceiling-table diff without an inline
ADR-0042 citation as a live, mechanically-undetected regression risk in every phase touching a
budgeted surface.

## Locate-cue (verify still present before acting)

`skills/war/assets/prompt-surface-budgets.test.mjs` line ~39, `'agents/war-refiner.md': { hard: 34816,
advisory: 30720 }` — confirmed at landed tip `7cacd59`. `skills/war/references/file-followups.md`
exists at the same tip (the eviction destination). Issue #1586 part 3 tracks the citation-floor fix —
verify its status before assuming this gap is still open.

## Related

[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] — a sibling ADR-0042 byte-
arithmetic hazard, on the eviction-planning side rather than the raise-detection side.

> archived 2026-08-30: resolved — moved to archive
