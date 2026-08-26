---
name: parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof
description: "parkAsk's exactly-once dedup is by finding OBJECT identity, but minorsOf mints a fresh copy of every Minor/Nit on every call — inside a multi-round loop (e.g. the aceBisect re-audit ladder), a persisting ask parks once per round, not once per task."
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: parkask-object-identity-dedup-breaks-under-per-round-fresh-copy-minorsof
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/phase-7 tasks 7.1+7.2 (landed dev/2026-08-25-engine-reliability-and-filing-fidelity)
  keywords: 
    - parkAsk
    - minorsOf
    - object identity dedup
    - asks channel
    - ask disposition
    - fresh copy per call
    - aceBisect re-audit loop
    - Checkpoint strike-list duplicate
    - exactly-once contract
    - workflow-template.js
  tags: 
    - war
    - engine
    - workflow-template
    - ask-disposition
    - dedup
  created: 2026-08-26
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-08-26T22:42:32.679Z
---

# `parkAsk`'s exactly-once dedup is by object identity — a per-round fresh-copy re-invocation defeats it

**Code-verified** at the pinned gate-audit tip `b5c54b58be788017647aaad446bde204de8d395e`
(task 7.2, `gateEvidence: true`), read via its live task worktree (gitdir physical path containing
the plan slug `2026-08-25-engine-reliability-and-filing-fidelity`). No worktree was live at the
actual merged tip `fb732efb4ae1d29a9efd8aa0b9722887bc5e2d60`; since the phase's terminal `p7-polish`
task was **discarded** (zero commits — `git diff` against the pre-polish tip was empty), this pin's
content is the landed content for this referent.

## The mechanism

`skills/war/assets/workflow-template.js`:

```js
const minorsOf = seats => seats.flatMap(s => (s.findings || []).filter(f => f.severity === 'Minor' || f.severity === 'Nit').map(f => ({ seat: s.seat, sha: auditShaOrSentinel(s.audit_sha), ...f })))
...
const parkAsk = f => {
  if (asks.some(a => a.finding === f)) return
  ...
}
```

`minorsOf` maps every call's seats into **brand-new objects** (`{ seat, sha, ...f }`) — even across
repeated calls over the *same underlying finding*. `parkAsk`'s guard compares `a.finding === f` —
JavaScript reference/object identity, not content. Two structurally-identical findings from two
different `minorsOf(...)` calls are never `===` to each other, so the guard never fires between them.

## Why it used to be safe, and why it stopped being safe

Historically each of `parkAsk`'s two call sites fired **at most once per task** (once per
`minorsOf` invocation covering that task's Minor/Nits), so the same finding object was never routed
through `parkAsk` twice. Phase 7 ("aceBisect robustness") added a bisection re-audit loop that calls
`minorsOf(subSeats)` / `minorsOf(reSeats)` **inside a `while` loop iterating bisection rounds** (up
to depth 2, so up to several rounds per task). A seat that re-raises the **same decision-shaped
`ask`** across successive re-audit rounds (the normal case — the seats are re-auditing the same task
at a new sha each round) now produces a fresh, non-`===` finding object on every round, and
`parkAsk` parks all of them: the Checkpoint strike-list gate sees N near-identical rows for what is
conceptually one open question.

## Durable rule

An object-identity dedup guard (`arr.some(x => x.key === candidate)`) is only load-bearing if the
candidate objects are guaranteed to be the **same reference** across every code path that could
produce "the same fact" more than once. Before adding a new call site that re-invokes a
fresh-copy-producing helper (`minorsOf`, or any `.map(f => ({...f}))` pattern) inside a loop, check
whether an existing identity-based dedup downstream assumes single-invocation semantics. The fix
belongs on the dedup side (a content key — task + seat + file + line + title, or per-task routed-set
tracking across rounds) not the mapping side; changing `parkAsk`'s contract is a design decision
shared with the ask-disposition campaign's asks channel and its census/fixture set, not a one-file
mechanical absorb.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js` — the
`const minorsOf = seats => ...` declaration and the `const parkAsk = f => { if (asks.some(a =>
a.finding === f)) return ...}` block; the bisection loop's `for (const f of minorsOf(subSeats)...)` /
`minorsOf(reSeats)` call sites inside `aceBisect`.

## Related

[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] — the parent
lesson; this file is the standalone write-up of that lesson's phase-7 addendum residual on the
#1563 fix.
