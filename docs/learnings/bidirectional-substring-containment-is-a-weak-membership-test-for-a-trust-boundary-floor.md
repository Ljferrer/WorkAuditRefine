---
name: bidirectional-substring-containment-is-a-weak-membership-test-for-a-trust-boundary-floor
description: "A mechanical set-membership floor guarding a privileged action (here: unparking an operator-gated ask from the Checkpoint channel on a seat-asserted citation) implemented as `t === row || t.includes(row) || row.includes(t)` is far weaker than its own comment's stated contract ('member of the set') — the `row.includes(t)` arm passes ANY seat-supplied string that merely CONTAINS a short threaded row, so one short adjudication row in the run makes the floor a near-universal pass"
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

Phase 1 ("in-run-finding-resolution") added `citationOf` in
`skills/war/assets/workflow-template.js` (~line 1954) as a "ROW-EXISTENCE FLOOR" — its own
comment calls a seat-asserted `citation.row` "the only thing standing between a claim and the
removal of an operator-gated ask from the Checkpoint channel" and says existence must be
"mechanical set-membership" against the threaded `adjudications` set.

The implementation (verified present at the landed tip `faa76d6415bdf61ba87a0cd82235d386020eb7f5`,
`skills/war/assets/workflow-template.js` ~line 1957):

```js
const member = adjudications.some(r => { const t = adjRow(r); return typeof t === 'string' && t.length > 0 && (t === row || t.includes(row) || row.includes(t)) })
```

The `row.includes(t)` arm inverts the intended direction: it passes whenever the SEAT's cited
text merely *contains* some threaded row, with no minimum-length floor on either side. A run
that threads even one short adjudication row (e.g. a terse scope note) makes nearly any cited
string satisfy membership. Five separate audit seats across the phase (task 1.1's
plan-faithfulness/security lenses at three different shas, plus the p1-polish task) each
independently flagged this as a Minor/Nit — a strong multi-seat corroboration signal — yet it
remained unchanged at the final landed tip. It is not a hold: a refused citation fails **open**
to a plain absorb (no stamp, no unpark, refusal logged once), and the re-audit panel's separate
`citationSoundnessClause` duty is the primary control, so this is defense-in-depth erosion, not
a broken guardrail.

## Durable rule

When writing a membership/containment check that gates a privileged or durable side effect
(here: silently removing an operator-facing question from a ruling queue), never write
bidirectional `a.includes(b) || b.includes(a)`. Pick the one direction the trust model actually
requires (the untrusted/seat-supplied value must be contained in, or equal to, a trusted/engine-
held value — never the reverse), and add a minimum significant-length floor (e.g. `>= 12` chars)
before containment counts as a match. Otherwise a short trusted value becomes an accidental
wildcard that defeats the floor's purpose.

## Related

None found in the local store at write time — first instance of this specific pattern recorded.
