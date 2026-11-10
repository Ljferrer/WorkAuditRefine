---
name: workflow-template-growth-is-capped-by-the-staged-copy-headroom-floor-not-just-file-size
description: "workflow-template.js growth is bounded by stage-workflow.test.mjs's stripped-copy + ARGS_HEADROOM_BYTES <= SCRIPT_BYTE_CAP floor, a file an engine task rarely touches"
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
    - indent strip
  tags:
    - engine
    - budget
    - release
  created: 2026-09-08
  originSessionId: e8da971f-dacd-4f27-a998-5f603270dabe
  modified: 2026-11-05T06:04:36.408Z
---

# `workflow-template.js` growth is arbitered by a stripped-copy headroom floor in a sibling test file, not by the engine file's own size

**The floor:** `skills/war/assets/stage-workflow.test.mjs` asserts

```js
assert.ok(bytes + ARGS_HEADROOM_BYTES <= SCRIPT_BYTE_CAP, ...)
```

`bytes` is `Buffer.byteLength(stripFullLineComments(TEMPLATE))`, the engine source with full-line
comments blanked. `stripFullLineComments` also drops the leading indent of top-level code lines
(#2613), so the staged copy is smaller than a comment-only strip. `SCRIPT_BYTE_CAP` is the Workflow
tool's hard `scriptPath` cap. So the arbiter is not the raw size of `workflow-template.js`: it is
whether the **stripped** copy leaves `ARGS_HEADROOM_BYTES` free under the cap.

Do not trust any byte literal for these values. Read `ARGS_HEADROOM_BYTES` in
`stage-workflow.test.mjs` and `SCRIPT_BYTE_CAP` (exported from `stage-workflow.mjs`, imported by
the test). The headroom is 4096 today; it has been lowered several times.

**Why this matters:** `workflow-template.js` is by far the largest and most frequently touched file
in this repo. A task whose diff touches only this file, with no `stage-workflow.test.mjs` in its
`Files:` list, can still erode the shared headroom floor that gates every future engine change. The
phase gate (`node --test 'skills/**/*.test.mjs'`) is the only thing that catches an actual breach;
there is no per-task warning short of running that gate.

**How to apply:** before or after a large `workflow-template.js` diff, run
`node --test skills/war/assets/stage-workflow.test.mjs` specifically to see the headroom margin. The
assertion message prints the stripped byte count on failure. Treat sustained engine growth across
several phases as a standing release risk: track the trend, not just one diff's delta, since the
floor is shared across the whole file's history.

See [[the-staged-form-execution-run-is-not-in-the-repo-gate]].

> archived 2026-10-27: resolved — moved to archive
