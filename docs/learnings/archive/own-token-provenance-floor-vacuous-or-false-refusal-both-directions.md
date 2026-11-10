---
name: own-token-provenance-floor-vacuous-or-false-refusal-both-directions
description: "A refuse-not-warn args-provenance floor can err both ways: a serialized row matches vacuously, generic or citing rows refuse falsely, and an exemption or carve-out keyed wrong opens a bypass or a false refusal"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: own-token-provenance-floor-vacuous-or-false-refusal-both-directions
  phase: 2026-08-06-handoff-schemas-contract/2.1
  keywords:
    - own-token floor
    - args provenance
    - held:workflow-error
    - backstops
    - adjudications
    - intent
    - JSON.stringify vacuity
    - false refusal
    - foreign docs/plans identifier
    - refuse not warn
    - workflow-template.js entry validation
    - source auto exemption
    - EXEMPT rows
    - refusal bypass
    - D6 recalibration
    - foreign plan id scan
    - ruledAsks
    - seededPhaseClose
    - idText
    - stripSupersedes
    - predecessor citation
    - D10 PIN-14
    - "#1749 #1751"
  tags:
    - war
    - engine
    - entry-validation
    - provenance
    - workflow-template
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T15:23:11.320Z
---

# The #1413 own-token args-provenance floor is mis-calibrated in both directions

**Rule:** a floor that refuses a launch when a token is missing from args text errs both ways. It can
pass vacuously on text that is not run provenance, and it can refuse honest args. Every exemption
and carve-out on it must be checked for who sets it and which surfaces it covers.

`skills/war/assets/workflow-template.js`'s entry-validation block (the "Args provenance floor
(#1413)") refuses a launch **before any agent spawns** when `intent` / `backstops` /
`adjudications` carry none of the run's own plan-slug tokens. The refusal is `held:workflow-error`:
per `schemas.md`, "Terminal — HARD-halts regardless of `--afk`; never retried". So a false positive
is a dead launch that needs a human.

## Class 1: vacuous pass (false accept)

The first version matched each token as a substring of `JSON.stringify(row)`. That serializes
schema KEY names and fixed VALUES that are not provenance: `"check"`, `"why"`, `"runner"`,
`"source"`, and `"source":"plan"` on every plan-declared row. A plan slug built from words like
`plan`, `check` or `source` gives an own token that a **foreign** backstops/adjudications array
satisfies with zero real overlap.

## Class 2: false refusal (false reject)

Two shapes carry zero slug tokens by construction:
- A short, generic backstop/adjudication row. The landing diff had to inject a synthetic token
  (e.g. `(wtprov)`) into five realistic fixtures, one of them `"no daemon at setup"`, just to pass.
- An `intent` that **cites** a predecessor plan path (`docs/plans/<other-slug>.md`), routine in a
  stacked campaign. The foreign-`docs/plans`-identifier arm refused it outright.

Candidate fixes the auditor recorded: probe row VALUES only (`Object.values(row)` joined), not the
serialized object; and/or scope the own-token arm to `intent` alone.

## Class 3: the `source:'auto'` exemption was a refusal bypass

The `rowText` helper did `if (row.source === 'auto') return { text, exempt: true }`, so an auto row
was never scanned by the foreign-id refusal arm. But `args.backstops` rows are **Lead-assembled at
Setup**. The engine's own auto rows (`autoBaselineBackstops`) are appended only at land and never
pass entry validation. So at entry every `source:'auto'` row is Lead-supplied. A wholesale foreign
args blob (the #1413 incident shape) carries plan-B's auto rows verbatim, and those rows skipped the
foreign-id scan. `intent` was never exempt, and a foreign `planFile` stamp still refused.

Proposed narrowing at the time: a `source:'auto'` row must still pass the foreign-id check, and is
exempt only from the own-token floor (the false-refusal direction the exemption was added to fix).

**Rule:** an exemption keyed on a flag the same input channel sets is a bypass, not a hardening.
Trace who sets the flag (engine-only vs. Lead-assembled) before trusting "exempt because
self-authored."

## Class 4: a widened scan reaches exempt rows the citation strip does not cover

D10/PIN-14 (#1749) widened the foreign-id scan to every row of all five surfaces, exempt rows
included. The #1751 predecessor-citation strip (`stripSupersedes` / `idText`) did not widen with
it: only `rowText` produced `idText`, so `ruledAskRowText` and `seededPhaseCloseRowText` rows fell
back to raw `.text` (`r.idText ?? r.text`). A `ruledAsks` or `seededPhaseClose` row exempt from the
own-token floor was still refused on a legitimate predecessor-plan citation in its prose.

**Rule:** when widening a shared scan across N producer surfaces, check each surface's carve-outs
(strips, exemptions) on its own. A protection built for one producer's record shape does not cover a
sibling producer that emits a different shape, even when both feed the same scan.

## Current state

The current `workflow-template.js` reflects fixes for these classes. Row text is built from named
fields (`check`, `why`, `adjudicated`, `value`), not `JSON.stringify`. Tokens match whole-word
behind a stoplist. Exemption is from the OWN-TOKEN floor only (D10, #1749): the foreign-id scan
reads every backstops and adjudications row, exempt rows included. A foreign id in `intent` warns
and launches (#2375). A foreign path in a `ruledAsks`, `seededPhaseClose` or `seededTasks` row
neither refuses nor warns (#2208, #2197). Re-read the floor's header comment before changing it.

**Related:** [[dispatched-seat-intent-can-leak-from-a-different-concurrent-plan]] (the incident
class #1413 exists to catch); [[reproduce-a-gate-blocker-before-patching-or-escalating]] (measure
before changing a floor); [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]].

> archived 2026-08-25: resolved — moved to archive
