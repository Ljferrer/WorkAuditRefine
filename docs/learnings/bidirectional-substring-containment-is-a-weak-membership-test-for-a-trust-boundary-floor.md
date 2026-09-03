---
name: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
description: "A membership floor at a trust boundary must test one direction only, with a minimum length; `a.includes(b) || b.includes(a)` is a wildcard."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
  phase: 2026-08-27-in-run-finding-resolution/phase-1
  keywords: 
    - citationOf
    - row-existence floor
    - bidirectional containment
    - membership test
    - trust boundary
    - substring containment weak
    - includes() both directions
    - absorb-by-citation
  tags: 
    - workflow-template
    - security-hardening
    - audit-finding
    - defense-in-depth
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-27T12:55:20.777Z
---

# Bidirectional `includes()` is a loose sieve for a membership floor

## What happened

Phase 1 ("in-run-finding-resolution") added the `citationOf` helper in
`skills/war/assets/workflow-template.js`, under the `ROW-EXISTENCE FLOOR` comment. That comment
calls a seat-asserted `citation.row` "the only thing standing between a claim and the removal of
an operator-gated ask from the Checkpoint channel" and says existence must be "mechanical
set-membership" against the threaded `adjudications` set.

The membership line inside `citationOf` still reads:

```js
t === row || t.includes(row) || row.includes(t)
```

The `row.includes(t)` arm inverts the intended direction. It passes whenever the SEAT's cited
text merely contains some threaded row, with no minimum-length floor on either side. A run that
threads even one short adjudication row (a terse scope note, say) makes nearly any cited string
satisfy membership. Five audit seats across the phase flagged this independently as Minor/Nit. It
is not a hold: a refused citation fails open to a plain absorb (no stamp, no unpark, refusal
logged once), and the re-audit panel's `citationSoundnessClause` duty is the primary control. So
this is defense-in-depth erosion, not a broken guardrail.

Still open: the line is unchanged at the current tip and no follow-up issue was found.

## Durable rule

When a membership or containment check gates a privileged or durable side effect (here: silently
removing an operator-facing question from a ruling queue), never write bidirectional
`a.includes(b) || b.includes(a)`. Pick the one direction the trust model requires: the untrusted,
seat-supplied value must be contained in, or equal to, a trusted, engine-held value, never the
reverse. Add a minimum significant-length floor (for example `>= 12` chars) before containment
counts as a match. Otherwise a short trusted value becomes an accidental wildcard.

## Related

None found in the local store at write time.
