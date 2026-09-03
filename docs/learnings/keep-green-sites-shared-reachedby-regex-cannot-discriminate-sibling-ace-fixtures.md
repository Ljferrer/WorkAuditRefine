---
name: keep-green-sites-shared-reachedby-regex-cannot-discriminate-sibling-ace-fixtures
description: "A fixture-reachability floor's reachedBy regex shared by three sibling dispatch sites cannot tell which one actually ran"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: keep-green-sites-shared-reachedby-regex-cannot-discriminate-sibling-ace-fixtures
  phase: "2026-08-25-doc-truth-and-drift-guard-debt/phase-2 tasks 2.1+2.3 (cascading-impact lens, disposition note)"
  keywords: 
    - KEEP_GREEN_SITES
    - reachedBy
    - fixture reachability
    - ace bisection subset
    - ace re-entry batch
    - advisory polish
    - non-discriminating regex
    - workflow-template.test.mjs
    - dispatch label
    - relocation guard
  tags: 
    - war
    - test-coverage
    - workflow-template
    - drift-guard
  created: 2026-09-03
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-03T19:12:45.746Z
---

# A shared `reachedBy` regex across sibling dispatch sites cannot prove which one ran

## What happened (code-verified at the landed tip)

Verified at `6a7a46d7f2262575bf624a78be47f4dc5042ce28` on
`dev/2026-08-25-doc-truth-and-drift-guard-debt` (read via the `_refinery` worktree whose `HEAD` is
byte-equal to this tip; gitdir physical path names this plan's slug).

`skills/war/assets/workflow-template.test.mjs`'s `KEEP_GREEN_SITES` array (~line 9084) pairs each
named dispatch site with a `reachedBy` regex used to prove a keep-the-gate-green fixture actually
reached a live dispatch. Three sibling entries — `ace bisection subset`, `ace re-entry batch`, and
`ace advisory polish` — all set `reachedBy: /^ace:/` (lines 9085-9087). All three real dispatch
labels in `workflow-template.js` share the identical `ace:<taskId>:r<n>` shape, so this specific
check cannot tell which of the three fixtures actually exercised its code path. If one of the three
ace code paths silently stopped running, any of the other two ace-labeled captures would still
satisfy all three assertions.

## Why this is a real, not hypothetical, gap

The static per-range membership check (`keepGreenRanges`) — the primary relocation guard for a
keep-green occurrence — stays fully precise regardless of this weakness; only the supplementary
fixture-reachability floor is blind. Two independent audit lenses (`cascading-impact`) flagged the
identical gap on two different tasks in the same phase (2.1 and 2.3), both `disposition: note`,
both `autoFixable: false` — fixing it needs a new dispatch-label discriminator in
`workflow-template.js` production code, out of scope for a test-and-reference-file-only task.

## The durable rule

When a fixture-reachability floor's discriminator is a regex over a dispatch **label prefix**, and
several sibling dispatch sites share that same label prefix by construction (e.g. all bisection
depths of one `ace` ladder), the floor can only prove "one of this family ran," never "this specific
member ran." If a future change needs the tighter guarantee, either widen the dispatch label to
carry a per-site discriminator (e.g. `ace:subset:`, `ace:reentry:`, `ace:polish:`) or accept the
weaker floor and rely on the static membership check for precision instead.

## Locate-cue (verify still present before acting)

`skills/war/assets/workflow-template.test.mjs`, the `KEEP_GREEN_SITES` array (~line 9084), the
three `reachedBy: /^ace:/` entries at lines 9085-9087, versus the real dispatch label
`'ace:' + r.task.id + ':r' + r.task.fixRounds`-shaped construction in `workflow-template.js`.

## Related

[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] — the
production-code `aceBisect` fragilities; this file's gap is in the *test* fixture-reachability
floor, a distinct and additional weak point in the same feature area.
