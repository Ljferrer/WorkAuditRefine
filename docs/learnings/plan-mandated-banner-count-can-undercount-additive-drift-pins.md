---
name: plan-mandated-banner-count-can-undercount-additive-drift-pins
description: "A structural-test block banner's literal count ('Four checks...') can legitimately undercount its own block after a later plan appends more pins, when the plan explicitly mandates the banner stay byte-untouched — self-documented by an adjacent sub-comment, not count-drift"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: plan-mandated-banner-count-can-undercount-additive-drift-pins
  phase: aftermath-class1-postdelete-verify/phase-1
  tags: 
    - structural-test
    - drift-guard
    - comment-lag
    - audit-calibration
    - plan-fidelity
  created: 2026-07-23
  keywords: 
    - banner comment count drift
    - Four checks two shapes two casings
    - criterion-9b precedent
    - byte-untouched banner
    - self-describing sub-comment
    - comment-lag cascade false positive
    - additive drift pin
    - war-pipeline-structure.test.sh
    - block banner undercount
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-23T18:35:21.014Z
---

In `skills/war-machine/war-pipeline-structure.test.sh`'s Class-1 gate-evidence block, the banner
comment "Four checks, two shapes and two casings:" (verify still present before acting — found
in the block starting `printf '\n# Class-1 gate evidence …'` in
`skills/war-machine/war-pipeline-structure.test.sh`, `@` phase `aftermath-class1-postdelete-verify`
2026-07-23) describes only the block's four **original** assertions
(`has 'git cherry'`, `has '--unset-upstream'`, the row-scoped keep-green pin, the row-scoped
red-pre-fix pin). A later plan (`2026-07-22-aftermath-class1-postdelete-verify`) appended three
more assertions (two `has_i()` prose pins plus one `has()` command pin) **inside the same block,
after** the four originals — the banner's literal "Four checks" now undercounts the block's true
seven assertions.

**This is correct-by-construction, not a defect.** The appending plan's own slice mandated the
banner and its four original assertions stay byte-untouched (a "criterion-9b precedent" — the
banner belongs to the *original* naming plan, not the appending one, and renumbering it would
misattribute ownership across plans that share one drift-guard block). The worker added a new
**sub-comment** directly above the three new assertions that self-documents them as a distinct,
separately-cited group and explicitly restates "the block banner + its four assertions above stay
byte-untouched" — so a reader lands on the true count one comment-block below, never misled.

**Why this matters for audits and future comment-lag/drift sweeps:** a naive "does this banner's
count match the block's assertion count" check will false-positive on this exact shape. Before
flagging a banner-vs-block-size mismatch as comment-lag/count-drift, check whether (a) the block
was extended by a **different, later plan** than the one that authored the banner, and (b) that
later plan's own diff carries a sub-comment self-documenting the addition as a separate,
identifiable group. When both hold, the mismatch is deliberate and any edit to the banner would
itself violate the appending plan's slice — the right audit disposition is `note`, informational
only, never a fix demand.

**Pattern, not just this instance:** any drift-guard block designed to accept append-only
extension across multiple plans (rather than each new plan authoring its own numbered block) will
recreate this shape — a stale top-of-block summary count, offset by a self-describing sub-comment
at each addition site. Treat the sub-comment, not the banner, as the source of truth for a block's
current composition.

Related: [[source-comment-lags-emitted-prompt-after-rewrite]] (a different comment-lag family —
prompt text, not a structural-test banner) — the discriminator between "genuine lag" and "this
deliberate shape" is the presence of a plan-mandated preserve directive plus a self-describing
sub-comment at the addition site.
