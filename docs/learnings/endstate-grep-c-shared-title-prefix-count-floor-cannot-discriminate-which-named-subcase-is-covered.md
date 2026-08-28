---
name: endstate-grep-c-shared-title-prefix-count-floor-cannot-discriminate-which-named-subcase-is-covered
description: "A plan End-state check of the shape `grep -c '<shared-title-prefix>' <test-file> >= N` is satisfied by ANY N fixtures sharing that title prefix — it cannot tell WHICH of several explicitly-ENUMERATED named sub-cases those N fixtures actually cover. End state 1 of phase 1 (in-run-finding-resolution) named three re-entry origins verbatim ('a plain re-audit, a bisection-subset re-audit, and a later-round re-audit') behind `grep -c 'ace-reentry' >= 3`; at land 5 fixtures existed but covered five DIFFERENT named/unnamed facets, never the third named origin — the check read green throughout because 5 >= 3, and two earlier phase-close polish attempts to add the missing fixture were both fully forward-reverted before the phase closed"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: endstate-grep-c-shared-title-prefix-count-floor-cannot-discriminate-which-named-subcase-is-covered
  phase: 2026-08-27-in-run-finding-resolution/phase-1
  keywords: 
    - grep -c count floor
    - End state check
    - shared title prefix
    - ace-reentry
    - fragile fixture count
    - enumerated named sub-case
    - non-discriminating check
    - fixture coverage gap
  tags: 
    - plan-authoring
    - audit-calibration
    - gate-audit
    - fragile-check
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T12:55:53.809Z
---

# A grep -c count floor over a shared title prefix cannot tell WHICH named case is covered

## What happened

Phase 1 ("in-run-finding-resolution")'s End state 1 named three re-entry origins verbatim: "a
fresh absorb born at a plain re-audit, a bisection-subset re-audit, and a later-round re-audit
each re-enters as an ace-style batch," gated by `grep -c 'ace-reentry'
skills/war/assets/workflow-template.test.mjs` printing **at least 3**.

Verified at the landed tip (`faa76d6415bdf61ba87a0cd82235d386020eb7f5`,
`skills/war/assets/workflow-template.test.mjs`): 5 fixtures carry the `ace-reentry` title
prefix — "plain re-audit", "bisection-subset re-audit", "forward-revert posture",
"batch-regressed arm", and "reserve gate". The third NAMED origin in the End state's own
prose — a later-round re-audit (a fresh absorb born at a re-entry batch's *own* approving
re-audit, which would assert a third ace dispatch and an incremented `Ace-Subset: t1:reentry:r3:…`
trailer) — has **no fixture** at the landed tip. `git log -S ace-reentry` over the phase's commit
range shows this fixture was added twice by phase-close/ace polish passes and **both times fully
forward-reverted**, so the gap survived to land. The `grep -c >= 3` check passed at every point
in the phase's history regardless (5 >= 3), because it counts title-prefix matches, not coverage
of the three specifically enumerated origins. The underlying mechanism is implemented correctly
(`routeReauditMinors(r, reS)` runs inside the re-entry loop's own approve arm, so a third-origin
re-entry does work) — this is a **coverage gap**, not a behavioral defect, and was correctly
attested `unmet`-but-SOFT by gate-audit (not a land-halt).

## Durable rule

When a plan End-state check is a bare `grep -c '<shared-prefix>' <file> >= N` floor over a set of
**enumerated named items** (not just "at least N of this general kind"), the count is necessary
but not sufficient evidence. Separately verify — by reading the actual fixture titles/bodies, not
just counting title-prefix hits — that each specifically-named item in the End-state prose has
its own fixture. A title-prefix count can stay green at N while silently missing one named case
and admitting unrelated fixtures sharing the same prefix instead.

## Related

[[grep-c-assertion-count-floor-is-a-fragile-dated-snapshot]] (archived) — a sibling fragile-
count-floor family with a different root cause (a miscounted conversion-time base line, versus
here a title-prefix count that cannot discriminate between enumerated named sub-cases).
