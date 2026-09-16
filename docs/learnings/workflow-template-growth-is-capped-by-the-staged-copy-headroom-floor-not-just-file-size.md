---
name: workflow-template-growth-is-capped-by-the-staged-copy-headroom-floor-not-just-file-size
description: "workflow-template.js growth is bounded by stage-workflow.test.mjs's stripped-copy + ARGS_HEADROOM_BYTES <= SCRIPT_BYTE_CAP floor, a file this task never touches"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: workflow-template-growth-is-capped-by-the-staged-copy-headroom-floor-not-just-file-size
  phase: "2026-09-06-engine-and-audit-verdict-integrity/phase-13 (Every dispatch classified, D21), task 13.1"
  keywords: 
    - workflow-template.js
    - SCRIPT_BYTE_CAP
    - ARGS_HEADROOM_BYTES
    - stage-workflow.test.mjs
    - staged-copy headroom
    - engine byte budget
    - stripFullLineComments
    - Workflow tool scriptPath cap
    - release risk
    - card headroom
  tags: 
    - engine
    - budget
    - release
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-09-09T02:59:29.888Z
---

# `workflow-template.js` growth is arbitered by a stripped-copy headroom floor in a sibling test file, not by the engine file's own size

**Context (code-verified at landed tip `891bbc7a5da617332d404d6088f2bcf80c9fded5`,
`dev/2026-09-06-engine-and-audit-verdict-integrity`, `skills/war/assets/stage-workflow.test.mjs`
lines 640/702, read via the `_refinery` worktree whose HEAD equals that tip):**

```js
const ARGS_HEADROOM_BYTES = 131072
// ...
assert.ok(bytes + ARGS_HEADROOM_BYTES <= SCRIPT_BYTE_CAP, ...)
```

`bytes` is `Buffer.byteLength(stripFullLineComments(TEMPLATE))` — the engine source with
full-line comments blanked out. `SCRIPT_BYTE_CAP` is the Workflow tool's hard `scriptPath` cap
(524,288 B, i.e. 512 KiB). So the arbiter is not "does `workflow-template.js` fit under some
size," it's "does the **comment-stripped** copy leave at least 131,072 B of headroom under the
512 KiB cap for embedded run args." A phase's audit-log noted (agent-unverified, not
independently re-measured by this servitor — no Bash to run `stripFullLineComments`) that this
phase's diff to `workflow-template.js` alone moved the raw file from 595,893 B to 611,089 B
(`git cat-file -s` at both revs), and that roughly 35 of the added lines were full-line comments
the strip blanks, with the rest counting as executable growth against the floor.

**Why this matters:** `workflow-template.js` is by far the largest and most frequently touched
file in this repo (hundreds of dispatch sites, prompt builders, and doc-mirror comments). A task
whose diff only touches this one file, with no `stage-workflow.test.mjs` in its own `Files:` list,
can still silently erode the shared headroom floor that gates every future engine change — the
floor lives in a sibling file this task never opens. The phase gate
(`node --test 'skills/**/*.test.mjs'`) is the only thing that catches an actual breach; there is
no per-task warning short of running that gate.

**How to apply:** before or after a large `workflow-template.js` diff, run
`node --test skills/war/assets/stage-workflow.test.mjs` specifically (not just trust the full
gate ran clean) if you want to see the current headroom margin explicitly — the assertion message
prints the stripped byte count on failure. Treat sustained engine growth across several phases as
a standing release risk: track the trend, not just the latest diff's delta, since the floor is
shared across the whole file's history, not reset per phase.
