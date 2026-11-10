---
name: uncited-budget-ceiling-raise-caught-only-by-audit-luck-now-a-floor
description: "An uncited raise of a prompt-surface budget ceiling once passed every gate and was caught only by audit luck; the assert-budget-raise-cited.sh floor now holds it"
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

# An uncited ADR-0042 ceiling re-baseline was caught by audit luck, not by a gate — now a floor

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

**Why this is durable, not a one-off:** at the time, nothing in the gate suite or the merge floors
*mechanically* distinguished a lawful ADR-0042-cited ceiling raise from an uncited one — a
`prompt-surface-budgets` diff that only widens numbers passes the suite either way. This instance was caught purely by an
auditor's attention to the diff, i.e. by luck, not by structure. The floor
`assert-budget-raise-cited.sh` now exists and holds an uncited raise.

## Locate-cue (verify still present before acting)

`skills/war/assets/prompt-surface-budgets.test.mjs` line ~39, `'agents/war-refiner.md': { hard: 34816,
advisory: 30720 }` — confirmed at landed tip `7cacd59`. `skills/war/references/file-followups.md`
exists at the same tip (the eviction destination). The citation floor is `skills/war/assets/assert-budget-raise-cited.sh`.

## Related

[[adr-0042-eviction-replacement-pointer-bytes-outrun-plan-arithmetic]] — a sibling ADR-0042 byte-
arithmetic hazard, on the eviction-planning side rather than the raise-detection side.

> archived 2026-08-30: resolved — moved to archive
