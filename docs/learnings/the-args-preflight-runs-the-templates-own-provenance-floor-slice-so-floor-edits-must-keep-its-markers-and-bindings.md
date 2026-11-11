---
name: the-args-preflight-runs-the-templates-own-provenance-floor-slice-so-floor-edits-must-keep-its-markers-and-bindings
description: "The args preflight runs the template floor slice. Keep its markers and bindings"
metadata:
  node_type: memory
  type: project
  keywords:
    - FLOOR_BINDINGS
    - FLOOR_MARKERS
    - provenance mirror
    - assert-args-complete
    - provenance floor
    - PreflightToolingError
    - hoist
    - own-token floor
  provenance: code-verified
  slug: the-args-preflight-runs-the-templates-own-provenance-floor-slice-so-floor-edits-must-keep-its-markers-and-bindings
  phase: 2026-11-08-args-floor-and-launch-preflight/1
  tags:
    - war
    - args-preflight
    - workflow-template
    - entry-validation
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T00:12:31.776Z
---

# The args preflight runs the template's own provenance floor code

`skills/war/assets/assert-args-complete.mjs` no longer copies the provenance floor rules.
Its `provenanceProblems` function slices `skills/war/assets/workflow-template.js` between two marker lines.
The markers live in `FLOOR_MARKERS`: `const provenanceProblems = []` and `if (provenanceProblems.length) throw`.
It runs that slice in `new Function('A', 'log', ...)` after the lines in `FLOOR_BINDINGS`.
Lines match with leading whitespace stripped, because the staged form strips the indent of top-level lines.

What this means for a later edit of the floor block in `workflow-template.js`:
- If you reword or delete a marker line, the preflight exits 2 ("no provenance floor slice").
- If you change one of the six binding lines, the preflight exits 2 ("FLOOR_BINDINGS drift").
- If you hoist a name the slice reads to module level, add its binding line to `FLOOR_BINDINGS` in the same commit. Otherwise the slice throws a ReferenceError and the preflight exits 2.
- A comment inside the slice is safe to edit. The staged form strips comments.
- The floor's throw line sits outside the slice. Any throw from inside the slice is foreign, never a refusal.

Two floor rules changed in this phase (#2673).
Own tokens now match on alphanumeric lookarounds, so an underscore beside a token counts as a boundary (`REMAP_FALLBACK` proves `remap`).
The stoplist now holds `when`.

The refusal remedy depends on the arm (`provenanceRemedies`).
A foreign stamp or a foreign docs/plans id means drop the row, never restamp it.
Backstops and adjudications take `planFile`, and ruledAsks, seededPhaseClose and seededTasks take `planSlug`.
Fix the row at its ledger source, not the launch copy. See [[a-refusal-remedy-shared-by-every-arm-can-tell-the-user-to-launder-the-input-it-refused]].

Verify still present before acting: found at `skills/war/assets/assert-args-complete.mjs` (`FLOOR_BINDINGS`, `provenanceProblems`, `provenanceRemedies`) and `skills/war/assets/workflow-template.js` (`tokenRe`, `PROVENANCE_TOKEN_STOPLIST`) at landed tip 608887813aa5 of phase 1.

Related: [[own-token-provenance-floor-vacuous-or-false-refusal-both-directions]], [[ptspans-tokenizer-comment-and-string-blind-embedded-args-injects-source-bytes]].
