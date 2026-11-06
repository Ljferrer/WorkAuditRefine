---
name: a-new-workflow-template-test-file-must-wrap-each-compile-site-in-runform-and-import-it-on-its-own-two-space-line
description: A new workflow-template.*.test.mjs file reds the staged-form census unless each new Function site wraps runForm
metadata:
  node_type: memory
  type: project
  keywords:
    - runForm
    - WAR_TEMPLATE_STRIPPED
    - new Function
    - compile-site census
    - staged form
    - indent-strip
    - topic test file
    - harness runs the staged form
  provenance: code-verified
  slug: a-new-workflow-template-test-file-must-wrap-each-compile-site-in-runform-and-import-it-on-its-own-two-space-line
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 task 1.1
  tags:
    - war
    - tests
    - staged-script
    - census
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T06:03:57.030Z
---

# A new workflow-template topic test file must wrap each compile site in `runForm`

**The rule.** The row `indent-strip: harness runs the staged form` in `skills/war/assets/stage-workflow.test.mjs` scans every `workflow-template.*.test.mjs` file.
In each file, every `new Function(` or `new AsyncFunction(` window must contain `runForm(`.
The window runs from the call to the next blank line or the next compile call.
A file with any compile site must also import `runForm` on a line that matches `/^  runForm,$/m`.
That means a multi-line import block with `runForm,` on its own line, indented two spaces.
A one-line import such as `import { h, runForm } from ...` fails the row.
The test-file census has no exempt list.
Only the harness census exempts `evalPt` and `evalTemplateConst`, which evaluate pt literals.

**Why.** `runForm` lives in `skills/war/assets/workflow-template.test-harness.mjs`.
It returns the code unchanged unless `WAR_TEMPLATE_STRIPPED=1`.
With the flag set, it returns the comment- and indent-stripped copy, so the test runs the staged bytes.
A raw compile under the flag would prove nothing about the staged form.

**Known gap.** The window check uses `includes('runForm(')`.
A site that compiles two slices, such as the harness `makeDispatch`, still passes if only one wrapper is dropped.

**How to apply.** If you add a topic test file that compiles a template slice, wrap each slice in `runForm(...)`.
Import it from the harness in the two-space multi-line shape.
Run `node --test --test-name-pattern='^indent-strip: harness' skills/war/assets/stage-workflow.test.mjs` before you commit.
The failure message names the file and line.

Locate-cue: verify still present before acting. Found `compileSiteWindows`, `assertTestFilesCompileStaged` and the `/^  runForm,$/m` match in `skills/war/assets/stage-workflow.test.mjs`, and `runForm` in the harness, @ phase 1 of 2026-11-04-late-defects-fixed-in-run.
Read in the run's `_refinery` worktree at 6c4f0f4e, the gate-audited sha whose tree the land merge 99d325fd keeps.

Related: [[the-staged-form-execution-run-is-not-in-the-repo-gate]], [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]].
