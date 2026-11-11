---
name: the-staged-form-execution-run-is-not-in-the-repo-gate
description: "The repo gate never sets WAR_TEMPLATE_STRIPPED=1, so staged-form breaks pass"
metadata:
  node_type: memory
  type: project
  keywords:
    - WAR_TEMPLATE_STRIPPED
    - staged form
    - repo-gate.mjs
    - indent strip
    - stripFullLineComments
    - gate coverage gap
    - staged copy
  provenance: code-verified
  slug: the-staged-form-execution-run-is-not-in-the-repo-gate
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 task 1.1
  tags:
    - war
    - gate
    - staged-script
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T06:04:06.123Z
---

# The staged-form execution run is not in the repo gate

**Fact.** The Workflow tool runs the staged copy of `skills/war/assets/workflow-template.js`, not the raw file.
`stripFullLineComments` in `skills/war/assets/stage-workflow.mjs` now blanks full-line comments and drops the leading indent of top-level code lines (#2613).
The tests execute that staged copy only when `WAR_TEMPLATE_STRIPPED=1` is set.
Neither `skills/war/assets/repo-gate.mjs` nor `.claude/war/config.json` sets that flag.
The flagged run `WAR_TEMPLATE_STRIPPED=1 node --test 'skills/war/assets/workflow-template.*.test.mjs'` appears only in End state 1's check of plan 2026-11-04-late-defects-fixed-in-run.

**What the gate does cover.** Every gate run checks the static oracles on the live template.
Those are the line-for-line check, the pt-literal byte check, idempotence, `node --check` and the args-field census.
They prove the strip moves only whitespace and comments, so the residual risk is low.

**How to apply.** If you change `workflow-template.js` or the stager, run the flagged suite once by hand.
If a plan relies on staged-form execution, add it as an End-state check or a gate step.
Do not assume a green gate ran the staged bytes.

Locate-cue: verify still present before acting. `STAGED_RUN` reads the flag in `skills/war/assets/workflow-template.test-harness.mjs`, and a Grep for `STRIPPED` in `repo-gate.mjs` and `.claude/war/*.json` found nothing, @ phase 1 of 2026-11-04-late-defects-fixed-in-run.
Read in the run's `_refinery` worktree at 6c4f0f4e, the gate-audited sha whose tree the land merge 99d325fd keeps.

Related: [[a-new-workflow-template-test-file-must-wrap-each-compile-site-in-runform-and-import-it-on-its-own-two-space-line]], [[a-whitespace-strip-turns-a-column-0-top-level-proxy-into-a-false-positive]].
