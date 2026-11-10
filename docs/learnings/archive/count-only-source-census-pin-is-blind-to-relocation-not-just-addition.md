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
    - release blurb mechanism description
    - moved census reds
  tags: 
    - structural-test
    - audit-finding
    - regex
  created: 2026-08-17
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-17T21:30:43.528Z
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

**Downstream near-miss (2026-08-17, phase 2 "Release", task 2.1, same plan):** the `## Status`
blurb describing this exact census (`README.md` line 364 at the landed tip
`1c059bdb6451f51ae8203190d8af781a4f2bb2ba`, `code-verified` — `_refinery18` worktree whose `HEAD`
is byte-equal to that tip) reads "a default-deny census pins the case-insensitive space-form
occurrence count of \"keep the gate\" over the template source at 6 — **a moved census reds** …".
The antecedent clause ("pins the … occurrence count … at 6") is correct and disambiguates for a
careful reader, but "a moved census reds" — phrasing lifted from the census's own landed assert
message — invites exactly the misreading this lesson's Rule says is false: the census does **not**
red when the matched phrase moves between reachable and unreachable sites, only when the total
count changes. Audit judged this a Nit (not Minor) because the correct mechanism is stated one
clause earlier in the same sentence, so no reader is actually misled, and it was left unfixed at
land (`## Status` is a release slot). **Applies-to note:** when a release blurb describes a
count-only census using the phrase "a moved X reds," check that the guard's own message (and the
lesson recording its blind spot, if one exists) doesn't say the opposite — prefer naming the
mechanism the count actually guards ("a **new** occurrence anywhere moves the count off N and
reds") over reusing the guard's own terse assert-message wording in prose.

> archived 2026-08-30: resolved — moved to archive
