---
name: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
description: "A membership floor at a trust boundary must test one direction only, with a minimum length; `a.includes(b) || b.includes(a)` is a wildcard. RESOLVED at PIN-15."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
  phase: "2026-08-27-in-run-finding-resolution/phase-1 (found) -> 2026-09-06-engine-and-audit-verdict-integrity/phase-7 task 7.1 (fixed, PIN-15), landed 2694f617c02b8ae0a527086792355331c5cc5a79 on dev/2026-09-06-engine-and-audit-verdict-integrity"
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

## What happened

Phase 1 ("in-run-finding-resolution") added the `citationOf` helper in
`skills/war/assets/workflow-template.js`, under the `ROW-EXISTENCE FLOOR` comment. That comment
calls a seat-asserted `citation.row` "the only thing standing between a claim and the removal of
an operator-gated ask from the Checkpoint channel" and says existence must be "mechanical
set-membership" against the threaded `adjudications` set.

The membership line inside `citationOf` used to read:

```js
t === row || t.includes(row) || row.includes(t)
```

The `row.includes(t)` arm inverted the intended direction. It passed whenever the SEAT's cited
text merely contained some threaded row, with no minimum-length floor on either side. A run that
threaded even one short adjudication row made nearly any cited string satisfy membership. Five
audit seats across phase 1 flagged this independently as Minor/Nit. It was not a hold: a refused
citation fails open to a plain absorb (no stamp, no unpark, refusal logged once), and the
re-audit panel's soundness duty is the primary control. So this was defense-in-depth erosion, not
a broken guardrail — and it stayed open through at least one archive pass (archived 2026-09-04
noting "still open... no follow-up issue was found").

## RESOLVED (code-verified — landed tip `2694f617c02b8ae0a527086792355331c5cc5a79` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, phase 7 "Citations" task 7.1, read via the
run-scoped `_refinery` worktree whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

`citationOf` in `skills/war/assets/workflow-template.js` (search `const citationOf`, near the
`ROW-EXISTENCE FLOOR` comment) now tests directionally only — exact match, or the THREADED row
contains the cited text — never the reverse — and adds `const CITATION_MIN_LENGTH = 24`: a cited
string under 24 characters is refused regardless of containment. This is exactly the durable rule
below, ratified as PIN-15 in the 2026-09-06-engine-and-audit-verdict-integrity plan's Commander's
Intent binding guardrails. The engine also now refuses on ambiguity (a cited fragment contained by
more than one threaded row is refused, never arbitrarily picking one).

**Residual (still open, recorded separately):** the seat-facing prompt surfaces
(`agents/war-auditor.md` via its `disposition-eligibility.md` pointer, and the dispatched
`DISPOSITION WIDENINGS` block) still do not teach a seat the 24-character/directional rule — a
seat that appends its own gloss to a threaded row now gets a silent refusal (fails open to a
plain absorb) instead of the credit it used to get. Deliberately deferred at PIN-1 (card + prompt
must land in one commit) with no Phase 7 task owning the card; the plan defers it to Phases 10-12.

## Durable rule (still true — this is WHY the fix works, generalize it)

When a membership or containment check gates a privileged or durable side effect (here: silently
removing an operator-facing question from a ruling queue), never write bidirectional
`a.includes(b) || b.includes(a)`. Pick the one direction the trust model requires: the untrusted,
seat-supplied value must be contained in, or equal to, a trusted, engine-held value, never the
reverse. Add a minimum significant-length floor (here 24 chars) before containment counts as a
match. Otherwise a short trusted value becomes an accidental wildcard. Also refuse on ambiguity
(more than one trusted value contains the candidate) rather than picking one arbitrarily.

## Related

[[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]] — the same
phase 7 task 7.1 that fixed this floor also shipped several unrelated in-diff `absorb`/
`autoFixable:true` findings unfixed (schemas.md's citation-shape doc still stale, a stray `#`
before a commit sha, an unre-flowed comment) — the fix landing does not mean every finding on the
same task landed.

> archived 2026-09-04 (original finding); this copy resolved 2026-09-08 following phase 7 land.
