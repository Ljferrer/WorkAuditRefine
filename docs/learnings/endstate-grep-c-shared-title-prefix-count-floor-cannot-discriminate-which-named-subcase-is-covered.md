---
name: endstate-grep-c-shared-title-prefix-count-floor-cannot-discriminate-which-named-subcase-is-covered
description: "A `grep -c '<prefix>' >= N` End-state floor cannot show which enumerated named sub-cases have fixtures; read the titles too."
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

**Still open:** the later-round re-audit fixture is still absent from
`skills/war/assets/workflow-template.test.mjs` (no `ace-reentry` test names it; no `reentry:r3` trailer asserted).

## Durable rule

When an End-state check is a bare `grep -c '<shared-prefix>' <file> >= N` floor over a set of
enumerated named items, the count is necessary but not sufficient. Verify separately, by reading
the fixture titles and bodies, that each named item in the End-state prose has its own fixture. A
prefix count stays green at N while missing one named case and admitting unrelated fixtures that
share the prefix.

**Why:** End state 1 of phase 2026-08-27-in-run-finding-resolution/1 named three re-entry origins
(a plain re-audit, a bisection-subset re-audit, and a later-round re-audit) behind
`grep -c 'ace-reentry' ... >= 3`. Five `ace-reentry` fixtures exist (plain, bisection-subset,
forward-revert posture, batch-regressed arm, reserve gate), so the check read green throughout,
but the third named origin never got a fixture. Two phase-close polish attempts to add it were both
forward-reverted before land. The mechanism itself works (`routeReauditMinors` runs inside the
re-entry loop's approve arm), so this is a coverage gap, attested `unmet` but SOFT by gate-audit.

**How to apply:** when authoring a plan, prefer one named check per enumerated item (for example
`grep -c 'ace-reentry (End state 1, later-round re-audit)'`) over a shared-prefix floor. When
auditing, list the matching titles and map each named item to one.

## Related

- [[grep-c-assertion-count-floor-is-a-fragile-dated-snapshot]] (archived): sibling fragile count-floor family with a different root cause (a miscounted conversion-time base line).
