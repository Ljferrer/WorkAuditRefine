---
name: count-only-source-census-pin-is-blind-to-relocation-not-just-addition
description: "A default-deny census that pins the total OCCURRENCE COUNT of a phrase across a whole source…"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: count-only-source-census-pin-is-blind-to-relocation-not-just-addition
  phase: 2026-08-06-structural-pin-extractors/1.1
  keywords: 
    - default-deny census
    - occurrence count pin
    - keep-green sweep
    - relocation blind spot
    - anti-vacuity floor
    - regex match length
    - structural test coverage gap
  tags: 
    - structural-test
    - audit-finding
    - regex
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T19:30:43.241Z
---

# A count-only census pin catches additions, not relocations

**The pattern (2026-08-06-structural-pin-extractors/1.1, audit disposition: note, Nit x3):**
`skills/war/assets/workflow-template.test.mjs`'s D6 keep-green default-deny census asserts
`(src.match(/keep the gate/gi) || []).length === 6` over the whole template source — verify still
present before acting, found at `skills/war/assets/workflow-template.test.mjs` (the
`prompt truth (D6)` test, the assert immediately following the sweep of six named dispatch-site
fixtures). This is exactly what the plan mandated (a source-side occurrence-count floor, not a
location-aware assert) and it correctly reds when a NEW keep-the-gate-green prompt is added
anywhere in the template. But it is invariant to an EXISTING space-form occurrence being **moved**
from a dispatch site the D6 sweep's six fixtures reach to one they do not: the total count is
unchanged, the census stays green, and the sweep silently stops covering that prompt.

**The durable rule:** a count-only census (source-wide occurrence total pinned to N) is a floor
against *addition*, never a floor against *relocation* — a phrase moving between reachable and
unreachable sites is invisible to a pure count. If location coverage matters (not just "the phrase
still exists somewhere"), the count needs to be paired with a per-occurrence membership check (each
match falls inside a byte-range the sweep's fixtures actually reach), not just a total. Two riders
observed in the same finding, useful when writing or reviewing a similar census: (1) if the census
regex is looser than the sweep's own matcher (e.g. the census drops a `\b` word boundary the sweep
carries), the census can move on a substring the sweep would never have caught anyway — check the
census pattern is a superset, not a mismatch, of what the sweep actually filters on; (2) a census
keyed on SOURCE text and a sweep keyed on RENDERED PROMPTS are only coincidentally at the same
count — they can diverge (comment-only occurrences move the source census without ever reaching a
dispatch prompt).

Related, same audit: [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
describes the general default-deny-census pattern this instance implements faithfully; this lesson
records the specific relocation blind spot the count-only variant leaves open.
