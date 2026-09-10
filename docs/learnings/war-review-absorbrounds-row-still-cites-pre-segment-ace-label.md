---
name: war-review-absorbrounds-row-still-cites-pre-segment-ace-label
description: "war-review/SKILL.md's absorbRounds-per-task row still corroborates via the flat ace:<task>:a<n> dispatch label, but the engine now emits three per-site labels (ace:polish:/ace:subset:/ace:reentry:), so the corroboration read no longer matches any live dispatch"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: war-review-absorbrounds-row-still-cites-pre-segment-ace-label
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-8 (Task 8.1, correctness lens, disposition absorb/phaseClose:true, deferred — file out of task's Files list, owned by Task 11.2 in phase 11)"
  keywords: 
    - war-review
    - absorbRounds
    - ace label
    - aceLabel
    - ace:polish: null
    - ace:subset: null
    - ace:reentry: null
    - ace-gate
    - corroboration
    - stale doc cascade
    - cross-task doc drift
    - Task 11.2
  tags: 
    - war-review
    - doc-drift
    - ace
    - workflow-template
    - deferred-fix
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T10:52:51.478Z
---

# A cross-task ace-label rename left `war-review`'s absorbRounds corroboration text stale, deferred to a later phase's task

## What happened

Verified at the landed tip `8884782176ff60a2c93eb249f328aa2751eac060` on
`dev/2026-09-06-engine-and-audit-verdict-integrity` (read via the `_refinery46` worktree, gitdir
physical path
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`,
`HEAD` byte-equal to the landed tip).

`skills/war-review/SKILL.md`'s "absorbRounds spent per task" row (line 114) still reads:

> corroborated by the `ace:<task>:a<n>` / `ace-gate:<task>:a<n>` dispatch labels and the
> `absorb-budget:` log lines

Task 8.1 changed the three worker-side ace dispatch labels (the ADVISORY POLISH, ACE BISECTION
SUBSET, and ACE RE-ENTRY BATCH dispatches) from a flat `ace:<task>:a<n>` shape to a per-site shape,
via a new `aceLabel` helper (`skills/war/assets/workflow-template.js` line 2838):

```js
const aceLabel = (r, site) => 'ace:' + site + ':' + r.task.id + ':a' + (r.task.absorbRounds + 1)
```

emitting `ace:polish:<task>:a<n>`, `ace:subset:<task>:a<n>`, and `ace:reentry:<task>:a<n>`. The
`ace-gate:<task>:a<n>` half of `war-review`'s corroboration text is still exact (unchanged by this
task), but the worker half (`ace:<task>:a<n>`) no longer matches any label the engine actually
emits — a reader following that row's own corroboration instruction literally will fail to find a
match and can render the row `n/a`.

**Why still stale at land:** `skills/war-review/SKILL.md` is outside Task 8.1's two-file `Files`
list. The finding was disposed `absorb`/`phaseClose:true`/`autoFixable:true` (normally the
phase-close sweep vehicle), but its own rationale explicitly names `Task 11.2` in **phase 11** as
the owning task — this is a plan-scheduled forward fix, not a same-phase sweep miss. Confirmed
still present verbatim at the phase-8 landed tip; do not treat this as evidence the phase-close
sweep malfunctioned.

## The durable rule

A `--ace` dispatch-label rename (or any grammar change to a label a doc surface names literally for
its own corroboration/verification instructions) is a cross-cutting change: grep every doc surface
that quotes the old label shape, not just the engine file and its test. When a plan defers that doc
sweep to a specific later task, the deferred file will legitimately still read stale at the
originating phase's land — check the plan's owning-task pointer before filing a fresh issue for it.

## Locate-cue (verify still present before acting)

`skills/war-review/SKILL.md`, the "absorbRounds spent per task" row (search `ace-gate:<task>:a<n>`
or `ace:<task>:a<n>`). `skills/war/assets/workflow-template.js`, the `aceLabel` helper (search
`const aceLabel`).

## Related

[[keep-green-sites-shared-reachedby-regex-cannot-discriminate-sibling-ace-fixtures]] — the same
`aceLabel` per-site split this row's staleness is a downstream side effect of; that lesson's
RESOLVED note (2026-09-07) confirms the split itself landed correctly in the engine and its test.
[[source-comment-lags-emitted-prompt-after-rewrite]] — same family of gap (a doc/comment surface
naming an old literal grammar after a rewrite), different surface.
