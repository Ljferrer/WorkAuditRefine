---
name: new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection
description: "A fix that widens an internal record with a new signal field (here: `corroborators: [{seat, sha}]` merged onto a parked-ask record when N seats independently raise the same question) is easy to wire at the write site while missing every pre-existing READ-time projection of that record — the operator-facing `handoff.asks` projection in workflow-template.js enumerates its output keys explicitly (`{task, seat, sha, question, fork}`) rather than spreading, so the new field never reaches the Checkpoint strike-list ruling gate even though the raw run return still carries it"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: new-record-signal-computed-but-dropped-by-a-pre-existing-explicit-key-projection
  phase: "2026-08-27-in-run-finding-resolution/phase-1 +recurrence (2026-09-03-in-band-absorb-default/phase-4 task 4.1)"
  keywords: 
    - handoff projection
    - corroborators
    - lossy projection
    - explicit key mapping
    - operator-facing gate
    - parkAsk
    - Checkpoint strike-list
    - new field dropped
  tags: 
    - workflow-template
    - operator-visibility
    - audit-finding
    - projection-lag
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-09-04T15:25:22.975Z
---

# A new record field can ship without updating an existing explicit-key projection

## What happened

Phase 1 ("in-run-finding-resolution") changed `parkAsk` in
`skills/war/assets/workflow-template.js` so that N seats independently raising the same question
on one task merge into ONE parked record carrying a `corroborators: [{seat, sha}]` list (the
#1790 fix — previously each raise parked a separate record).

Verified present at the landed tip (`faa76d6415bdf61ba87a0cd82235d386020eb7f5`,
`skills/war/assets/workflow-template.js` ~line 3785): the `handoff.asks` projection —
"the Checkpoint strike-list ruling gate's input" per its own comment — still maps explicitly:

```js
asks: asks.map(a => ({ task: a.task, seat: a.seat, sha: a.sha, question: a.question, fork: a.fork })),
```

`corroborators` is absent from this list, so a question re-raised by three seats renders
identically to one raised once at the one surface the operator actually rules from. The full
record survives on the run's raw top-level return, and the merge itself is logged (so #1790's
"never a silent drop" duty is discharged) — this is an attribution-fidelity gap in the operator
channel, not a data-loss defect. It was independently re-raised as a `note`-disposition finding
by at least four separate audit seats across three different shas in the phase, which is itself
a signal that this class of gap (new signal added at the write site, old projection at the read
site untouched) recurs and stays unabsorbed — `note` disposition is deliberately informational,
never auto-fixed by the engine's `--ace` machinery.

## Durable rule

When a fix widens an internal record's shape with a new field carrying operator- or
consumer-relevant signal, grep every existing serialization/projection site of that record type
— not just the primary write site — before considering the fix complete. An **explicit-key
object literal** (`{ task: a.task, seat: a.seat, ... }`) rather than a spread (`{ ...a }`) is the
tell that a projection will silently keep excluding any newly added field forever; a spread would
have carried the new field automatically at the cost of exposing internal bookkeeping (e.g. a
dedup `key`) that the projection may deliberately want to hide — so the fix is to add the new
field by name, not to switch to a spread.

## Related

None found in the local store at write time — first instance of this specific pattern recorded.

## Recurrence — a sibling projection on the SAME handoff object drops a different new field,
## `2026-09-03-in-band-absorb-default`/phase-4 task 4.1 (landed
## `dev/2026-09-03-2026-09-03-in-band-absorb-default` @ `1fcc88f9c6515707b1e52bb7215a5b5134860b03`,
## 2026-09-04)

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery45`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-09-03-in-band-absorb-default-2026-09-03/_refinery/.git`
(contains this plan's slug) and its `HEAD` reads `1fcc88f9c6515707b1e52bb7215a5b5134860b03`,
exactly the threaded landed tip — a direct Read there is `code-verified`-capable.

Task 4.1 landed `demote()` stamping every engine `follow-up` demotion with `demoteReason`, plus
`floorSkipped` on rows the intake floor never judged, plus a `barrier` tag a seat cites. The
`handoff.followUps` projection — `handoff.asks`'s sibling on the SAME `handoff` return object —
is the identical explicit-key shape this lesson's original finding named:

```js
followUps: minorsFiled.map(m => ({ issue: m.issue ?? null, reason: [m.title, m.rationale].filter(Boolean).join(' — ') || '(untitled finding)',
  ...(mergedRowsOf(m).length ? { merged: mergedRowsOf(m).map(...) } : {}) })),
```

confirmed present verbatim at the landed tip (`skills/war/assets/workflow-template.js`, near line
4689). None of `demoteReason`, `barrier`, or `floorSkipped` ride this projection — the Lead's
machine-readable phase-return handoff (what the Checkpoint reads) cannot distinguish an
engine-demoted row from a seat-filed row with a `barrier` tag, exactly the failure mode this
lesson's durable rule predicts. Queued as a Minor, `disposition: absorb`, finding by task 4.1's
own audit and its post-merge gate-audit; still unfixed at land because the phase's terminal
`p4-polish` round was `polish-rejected` then `polish-discarded` (see
[[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] for the mechanism).

**Confirms the durable rule generalizes across sibling projections on the same record, not just
one write site:** `handoff.asks` (the original finding) and `handoff.followUps` (this recurrence)
are two independent explicit-key literals over two independent underlying arrays inside the SAME
function's SAME return object — a fix that widens `demote()`'s or `parkAsk`'s output shape must
grep BOTH sibling handoff projections, not just the one nearer the field it touched.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`, the
`followUps: minorsFiled.map(m => ({ issue: ...` line (search `followUps: minorsFiled.map`).

> archived 2026-09-03: resolved — moved to archive
