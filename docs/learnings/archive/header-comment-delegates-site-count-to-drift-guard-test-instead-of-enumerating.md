---
name: header-comment-delegates-site-count-to-drift-guard-test-instead-of-enumerating
description: "RESOLVED (2026-07-26-dispatch-args-and-floor-coverage/1.1, #1151): classificationClause converted to the drift-guard-arbiter form this lesson recommends. A shared prompt-clause helper's header comment can name a drift-guard test as the arbiter of its consumer-site count instead of enumerating the sites in prose — the enumeration is exactly what rotted last time"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-24-recovery-re-merge-dispatch-coherence@phase-2
  slug: header-comment-delegates-site-count-to-drift-guard-test-instead-of-enumerating
  phase: 2026-07-24-recovery-re-merge-dispatch-coherence/2.1 (2026-07-24)
  keywords: 
    - gateCaptureClause
    - captureUses
    - drift guard arbiter
    - header comment rot
    - consumer site enumeration
    - classificationClause
    - site-list drift
    - count-free invariant
    - classification-site drift guard
    - overstated guard reach
    - byte-run vs prose enumeration
  tags: 
    - workflow-template
    - documentation-pattern
    - drift-guard
    - prompt-clause
    - comment-accuracy
  relates: 
    - "[[drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape]]"
    - "[[shared-block-extraction-regex-reaches-every-consumer]]"
  created: 2026-07-25
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
  modified: 2026-07-27T20:37:59.822Z
---

# Prefer "a named test is the arbiter of this count" over enumerating consumer sites in a header comment

**The gap this closes (verify still present before acting — found at
`skills/war/assets/workflow-template.js` around the `gateCaptureClause` helper, phase
`2026-07-24-recovery-re-merge-dispatch-coherence/2.1`):** a shared prompt-clause helper's header
comment previously enumerated its dispatch consumer sites by name (2 of the then-3 real call
sites), and the enumeration rotted — a third call site existed and wasn't listed. The fix replaced
the prose enumeration with a comment that states the invariant **count-free** and names the drift
guard that arbitrates it instead:

```js
// gateCaptureClause (D5): the merge-task gate-output capture directive — threaded into the dispatched
// merge-task prompts whose evidence contract REQUIRES the captured fully-green gate for the post-merge
// gate-audit (ADR 0024). Never enumerate those sites here: the captureUses drift guard in
// workflow-template.test.mjs is the arbiter of the site list. Deliberately NOT every merge-task prompt —
// ...
```

`captureUses` in `skills/war/assets/workflow-template.test.mjs` counts real call sites via
`src.match(/gateCaptureClause\(refineryPath, r\.task\.id\)/g)` and asserts the count equals 3 — so
a future call site added or removed makes this test the discoverer, not a hand-maintained comment.

**Why this is the more durable form:** a hand-written "used at sites A, B, C" comment has no
mechanism forcing it to stay in sync with the source it describes — adding call site D is a
same-file, easy-to-forget edit away from a stale comment (see
[[drift-guard-site-discovery-regex-coupled-to-ternary-terminator-shape]] and
[[shared-block-extraction-regex-reaches-every-consumer]] for two sibling ways a
site-tracking mechanism can silently under-cover). Pointing the comment at a **named test**
that would go red on drift converts "trust the prose" into "trust the gate" — the comment can
say "never enumerate here" precisely because the enumeration is exactly what previously rotted.

**Contrast in the same file — RESOLVED at phase `2026-07-26-dispatch-args-and-floor-coverage/1.1`:**
the sibling `classificationClause` helper's header comment previously enumerated its consumer
sites by name ("mirrored ... into the initial merge-task prompt, the floor-retry re-merge prompt,
THE LAND PROMPT, and agents/war-refiner.md") — a live instance of the very shape that just rotted
for its neighbor. This phase performed exactly the conversion this lesson recommends: the header
comment above `classificationClause` (`skills/war/assets/workflow-template.js`, immediately before
the helper's definition) is now count-free and names a new sibling drift guard, `#1151` (test
`'#1151 — classification-site drift guard: EXACTLY 3 classificationClause call sites in the
template'`, `skills/war/assets/workflow-template.test.mjs`), which counts
`classificationClause\(` call-paren occurrences in the source and asserts exactly 3 — the same
`captureUses` pattern this lesson documents, applied to the second helper. Verified present at
landed tip `0250694ea5c69e77e2fa2f0543f81c6ccf111978`. One nuance surfaced during that phase's
audit and self-corrected before land: an early draft of both header comments overstated the guard
as catching *any* site enumeration ("a site enumeration written here would itself go RED"), which
is false for a **prose** enumeration (only a `classificationClause(` call-paren byte-run trips the
guard, exactly the enumeration shape this lesson's own donor fix predates) — the landed wording
correctly narrows this to "kept count-free by convention; the call-paren byte-run is the part the
guard mechanically forbids". State the guard's actual reach precisely when writing this kind of
comment: it forbids the byte-run it counts, not the human-readable fact it stands for.

**How to apply:** when a shared clause/constant/helper's header comment names its own consumer
sites in prose, check whether a test already counts real call sites (a `matchAll`/`match` +
`assert.equal(count, N)` shape). If one exists, point the comment at that test by name and drop
the enumeration. If none exists, consider adding one before trusting the enumeration to stay
accurate across future edits.

> archived 2026-07-27: resolved — moved to archive
