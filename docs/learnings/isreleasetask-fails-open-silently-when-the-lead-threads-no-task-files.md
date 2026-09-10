---
name: isreleasetask-fails-open-silently-when-the-lead-threads-no-task-files
description: isReleaseTask keys solely on task.files; a release task dispatched without files threaded gets no RELEASE TASK ace clause and no log of the miss
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: isreleasetask-fails-open-silently-when-the-lead-threads-no-task-files
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-12 (task 12.1), landed 48a7120616627a35ecf2a05e76e34d15dcf985a3 on dev/2026-09-06-engine-and-audit-verdict-integrity"
  keywords: 
    - isReleaseTask
    - release task detection
    - RELEASE_SLOT_FILES
    - releaseSlotAceClause
    - fail open
    - task.files optional
    - version-slots.test.mjs guard
    - twins move together
    - silent miss
    - NEVER_MOVE_LITERAL
  tags: 
    - war
    - workflow-template
    - release
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-08T23:57:59.065Z
---

# `isReleaseTask` fails open, silently, when the Lead threads no `task.files`

**Found (code-verified — landed tip `48a7120616627a35ecf2a05e76e34d15dcf985a3` on
`dev/2026-09-06-engine-and-audit-verdict-integrity`, read via the run-scoped `_refinery` worktree
whose `HEAD` is directly on this tip:
`<repo-root>/.claude/war-worktrees/2026-09-06-engine-and-audit-verdict-integrity-2026-09-07/_refinery/`).**

`skills/war/assets/workflow-template.js`:

```js
const isReleaseTask = t => Array.isArray(t && t.files) && t.files.some(isReleaseSlotFile)
```

`isReleaseTask` keys solely on the task's plan `Files:` list containing a `RELEASE_SLOT_FILES`
basename (`plugin.json`/`marketplace.json`/`CHANGELOG.md`/`README.md`, canonical set in
`skills/war/assets/land-decision.mjs`). The args contract documents `task.files` as optional
("Absent/empty ⇒ base worker tier (fail-safe)"). If the Lead dispatches a release task without
threading `task.files`, `isReleaseTask` returns `false`, `releaseSlotAceClause` renders `''`, and
the ace worker never sees the `version-slots.test.mjs` merge-guard name or the CHANGELOG-head/
README-`## Status`-twins-move-together rule (`NEVER_MOVE_LITERAL`). **The miss is silent — no log
line marks it.**

The same detector also cannot see a release task carved to touch ONLY `README.md` and
`CHANGELOG.md` (no `plugin.json`/`marketplace.json` in that task's Files) — exactly the file pair
the twins rule governs — if for some reason those two entries were absent from `task.files` while
the task still moves a version literal.

**Blast radius is bounded, not zero:** the clause is prompt guidance only.
`version-slots.test.mjs` in the gate remains the merge guard regardless (A14 — no engine-side
version-literal detector exists; the gate is the sole enforcement). This repo's own release
discipline always moves all four slots in one task, so the gap has not manifested in practice here.
But any future workflow change that dispatches a release-adjacent fix (e.g., a single-file
`README.md` ace re-dispatch without re-threading the full task) would silently lose the guard
clause with no signal.

**Pattern to watch for:** before assuming an ace/fix-worker prompt carries the release-task
guardrail, confirm `task.files` is non-empty and contains a `RELEASE_SLOT_FILES` basename at that
specific dispatch site — do not assume it propagates from the original task launch to every
re-dispatch (bisection subset, re-entry batch) without checking.

**Locate-cue (verify still present before acting):** `skills/war/assets/workflow-template.js`,
search `const isReleaseTask` (near `RELEASE_SLOT_FILES`) and `const releaseSlotAceClause`.
