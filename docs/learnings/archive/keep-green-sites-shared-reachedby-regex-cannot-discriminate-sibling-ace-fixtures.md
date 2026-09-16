---
name: keep-green-sites-shared-reachedby-regex-cannot-discriminate-sibling-ace-fixtures
description: "A fixture-reachability floor's reachedBy regex shared by three sibling dispatch sites cannot tell which one actually ran"
metadata: 
  promoted: dev/2026-08-25-doc-truth-and-drift-guard-debt@phase-2
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
    - aceLabel
    - per-site discriminator
    - RESOLVED
    - ace:polish:
    - ace:subset:
    - ace:reentry:
  tags: 
    - war
    - test-coverage
    - workflow-template
    - drift-guard
  created: 2026-09-03
  originSessionId: ffad230a-d9ac-4d86-8988-75714445b989
  modified: 2026-09-08T10:52:08.957Z
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

## RESOLVED (2026-09-07, plan `2026-09-06-engine-and-audit-verdict-integrity`, phase 8 "Re-entry
and the ace ladder", task 8.1, landed `dev/2026-09-06-engine-and-audit-verdict-integrity` @
`8884782176ff60a2c93eb249f328aa2751eac060`) — the exact fix this lesson's durable rule recommended
landed verbatim

**Code-verified** — landed-tip grounding reached rung 2 (worktree lookup): the `_refinery46`
worktree's `gitdir` physical path is
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/.git`
(contains this plan's slug) and its `HEAD` reads `8884782176ff60a2c93eb249f328aa2751eac060`,
exactly the threaded landed tip — a direct Read there is `code-verified`-capable.

`skills/war/assets/workflow-template.js` now defines (line 2838):

```js
const aceLabel = (r, site) => 'ace:' + site + ':' + r.task.id + ':a' + (r.task.absorbRounds + 1)
```

called at the three previously-colliding sites with `site` = `'polish'` | `'subset'` | `'reentry'`
— exactly the per-site discriminator this lesson's durable rule named as the fix
(`ace:subset:`, `ace:reentry:`, `ace:polish:`). `skills/war/assets/workflow-template.test.mjs`'s
`KEEP_GREEN_SITES` array no longer carries any `reachedBy: /^ace:/` entry — the phase's own End
state 14 pins this negatively: `test "$(grep -c 'reachedBy: /^ace:/'
skills/war/assets/workflow-template.test.mjs)" -eq 0`, i.e. deleting the per-site split reds the
suite. The fixture-reachability floor can now discriminate which of the three ace sites actually
ran, closing the exact gap this lesson recorded.

**Confirms:** a recorded "no fix in scope this phase, here's the fix if one is ever done" lesson
can be fully retired by a later, unrelated phase picking up its own-recommended fix — worth
checking a lesson's "durable rule" fix suggestion against current code before treating it as still
open.

## Related

[[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]] — the
production-code `aceBisect` fragilities; this file's gap is in the *test* fixture-reachability
floor, a distinct and additional weak point in the same feature area.

> archived 2026-09-03: resolved — moved to archive. Underlying weakness fully fixed
> 2026-09-07 (see RESOLVED note above) — left in archive/ per servitor doctrine (never move
> hot/cold, only `war-memory` retempers).
