---
name: phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land
description: "RESOLVED (gate-audit-finding-routing, #1377/#1372, 2026-08-15) — A phase-close polish task's own post-hoc audit can surface Minor/absorb findings about defects the polish diff itself introduced (a false justifying comment, a cosmetic reflow); since Minor/absorb never blocks approval and polish IS the terminal phase-close mechanism, those findings have no subsequent round to drain them and can land unfixed — verify a polish-task absorb finding actually landed, never assume disposition:absorb guarantees a fix within the same phase"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - phase-close polish
    - p1-polish
    - absorb disposition
    - unfixed finding
    - recursive phase-close
    - polish-of-polish
    - Minor never blocks approval
    - autoFixable not applied
  provenance: code-verified
  slug: phase-close-polish-tasks-own-absorb-findings-have-no-further-round-to-land
  phase: 2026-08-02-references-pointer-link-truth/1 (p1-polish)
  tags: 
    - war
    - phase-close
    - process
    - audit-findings
  created: 2026-08-03
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T12:39:15.523Z
---

# Phase-close polish task's own absorb findings have no further round to land

**Found (code-verified — landed tip `44c28c854e547c1fbcfed559ea485bab5b83f916` on
`dev/2026-08-02-references-pointer-link-truth`, plan `2026-08-02-references-pointer-link-truth`
phase 1):** the phase's `p1-polish` task (the phase-close coherence sweep instance for this
phase) absorbed six prior findings into commit `4899b2d`. Its *own* post-commit audit then
raised two **new** findings against the polish diff itself, both `severity: Minor`, one
`disposition: absorb, phaseClose: true` and a near-duplicate from a second auditor seat at
`disposition: absorb, phaseClose: false, autoFixable: true`:

- a justifying comment above the new `refinerMd` assert in
  `skills/war/assets/workflow-template.test.mjs` (around the `war-refiner.md` pointer-shape
  guard-family extension) claims war-refiner.md's `refiner-recovery.md` pointers were
  "unguarded" and that "otherwise 606b72b can silently regress" — false: a count-pinned
  `assert.equal` plus an any-depth `../`-absence `assert.ok` for exactly that fact already
  existed elsewhere in the same file (the "Task 1.2 — grep parity" test), so the comment mints
  a new false doc claim in a diff whose own plan Purpose forbids minting one;
- a cosmetic reflow in `skills/war/references/worker-servitor-edges.md`'s header left the
  backticked `skills/war/assets/workflow-template.js` path stranded alone on its own short
  line (an avoidable diff artifact, `disposition: absorb, phaseClose: false, autoFixable: true`
  from one seat, `disposition: note` from another).

The task's overall verdict was `approve` (Minor/absorb never blocks approval — only
Critical/Major does). **No further fix round or later polish task existed in this phase** to
drain these two absorb findings, because `p1-polish` *is* the phase's terminal phase-close
mechanism. Verified directly by reading both files at the landed tip: the comment at
`skills/war/assets/workflow-template.test.mjs` (immediately above the `war-refiner.md`
`../`-absence assert in the "Task 5.1 — worker/servitor card evictions" test, the assert
whose message reads `war-refiner.md: no references/ pointer uses a forbidden ../-prefixed
path, at any depth`) still carries the flagged false clause verbatim, and
`skills/war/references/worker-servitor-edges.md`'s header still carries the lone-line reflow —
neither was rewritten between the `p1-polish` commit and the phase land merge.

**Contrast — findings raised against an *earlier* task's diff, absorbed by `p1-polish` itself,
DID land fixed:** Task 1.1's own gate-audit flagged its header's "byte-identical … at eviction
time" claim as contradicted by the eviction commit's own history (a Minor,
`disposition: absorb, phaseClose: true`), and `p1-polish`'s commit correctly rewrote that
header to "byte-identical … at eviction time and until this pass … re-rooted again here" —
verified present at the landed tip. Likewise Task 1.3's own within-task fix round (bounded by
`roundLimit`) added positive-control asserts for two negative-only guard arms in
`skills/war/assets/reference-link-integrity.test.mjs`, flagged Minor/absorb/autoFixable by its
first audit — also verified present at the landed tip. **The asymmetry is specifically that a
polish/phase-close task cannot absorb findings raised against *its own* diff** — there is
nowhere left in the phase's pipeline for that absorb to run.

**How to catch it:** when reviewing a phase-close polish task's audit output, treat any
`disposition: absorb` (or `note`-paired-with-absorb from a sibling seat) finding filed **against
the polish commit itself** as a standing gap, not a routed-and-handled item — it will not be
fixed within this phase's pipeline. A servitor or Lead closing out the phase should either
hand-verify these are cosmetic/non-load-bearing (as both were here) or explicitly re-file them
as a follow-up issue, the same way an out-of-Files straggler is routed.

**Related:** [[phase-close-polish-revert-can-silently-orphan-a-subset-of-absorbed-findings]] —
a different mechanism (a revert-then-redo losing track of what the reverted commit fixed); this
lesson is about absorb findings that were **never routed to a fix at all**, no revert involved.

> archived 2026-08-15: resolved — moved to archive
