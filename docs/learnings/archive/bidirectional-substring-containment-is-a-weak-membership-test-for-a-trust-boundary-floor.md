---
name: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
description: "A membership floor at a trust boundary must test one direction only, with a minimum length; `a.includes(b) || b.includes(a)` is a wildcard. RESOLVED at PIN-15."
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
  phase: "2026-08-27-in-run-finding-resolution/phase-1 (found) -> 2026-09-06-engine-and-audit-verdict-integrity/phase-7 task 7.1 (fixed, PIN-15)"
  keywords:
    - citationOf
    - row-existence floor
    - bidirectional containment
    - membership test
    - trust boundary
    - substring containment weak
    - includes() both directions
    - absorb-by-citation
    - CITATION_MIN_LENGTH
    - PIN-15
    - directional match
  tags:
    - war
    - workflow-template
    - security-hardening
    - audit-finding
    - defense-in-depth
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-09-08T09:03:10.024Z
---

# Bidirectional `includes()` is a loose sieve for a membership floor — RESOLVED

## Durable rule (still true — this is WHY the fix works, generalize it)

When a membership or containment check gates a privileged or durable side effect (here: silently
removing an operator-facing question from a ruling queue), never write bidirectional
`a.includes(b) || b.includes(a)`. Pick the one direction the trust model requires: the untrusted,
seat-supplied value must be contained in, or equal to, a trusted, engine-held value, never the
reverse. Add a minimum significant-length floor (here 24 chars) before containment counts as a
match. Otherwise a short trusted value becomes an accidental wildcard. Also refuse on ambiguity
(more than one trusted value contains the candidate) rather than picking one arbitrarily.

## RESOLVED (code-verified — 2026-09-06-engine-and-audit-verdict-integrity, phase 7 "Citations" task 7.1)

`citationOf` in `skills/war/assets/workflow-template.js` (search `const citationOf`, near the
`ROW-EXISTENCE FLOOR` comment) used to test `t === row || t.includes(row) || row.includes(t)`.
It now tests directionally only — exact match, or the THREADED row
contains the cited text — never the reverse — and adds `const CITATION_MIN_LENGTH = 24`: a cited
string under 24 characters is refused regardless of containment. This is exactly the durable rule
above, ratified as PIN-15 in the 2026-09-06-engine-and-audit-verdict-integrity plan's Commander's
Intent binding guardrails. The engine also now refuses on ambiguity (a cited fragment contained by
more than one threaded row is refused, never arbitrarily picking one).

**Residual (open at the fix):** the seat-facing prompt surfaces (`agents/war-auditor.md` and the
dispatched `DISPOSITION WIDENINGS` block) did not yet teach a seat the 24-character/directional
rule, so a seat that glosses a threaded row gets a silent refusal (fails open to a plain absorb).

> archived 2026-09-04 (original finding); this copy resolved 2026-09-08 following phase 7 land.
