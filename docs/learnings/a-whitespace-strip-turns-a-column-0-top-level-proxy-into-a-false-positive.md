---
name: a-whitespace-strip-turns-a-column-0-top-level-proxy-into-a-false-positive
description: "An indent strip moves nested lines to column 0, so column-0 readers over-match"
metadata:
  node_type: memory
  type: project
  keywords:
    - column 0
    - top-level proxy
    - indent strip
    - unguardedTopLevelKeys
    - extractArgsFields
    - META_STATEMENT
    - staged copy
    - regex anchor
  provenance: code-verified
  slug: a-whitespace-strip-turns-a-column-0-top-level-proxy-into-a-false-positive
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 task 1.1
  tags:
    - war
    - staged-script
    - regex
    - pattern
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T06:04:16.209Z
---

# A whitespace strip turns a column-0 top-level proxy into a false positive

**Pattern.** Many readers use "starts at column 0" as a cheap proxy for "top-level statement".
A transform that drops leading indent moves function-body lines to column 0.
Each such reader then matches lines it never matched on the raw source.
The transform can be semantically safe and still change what these readers report.

**Two live instances on the staged template.**
- `unguardedTopLevelKeys` in `skills/war/assets/assert-args-complete.mjs` anchors on `^const X = A.key` and `^const { … } = A$`. On the staged copy, an indented `const z = A.zz` inside a function would become a required args field. `assert-args-complete.mjs --template <staged path>` would then demand it.
- `META_STATEMENT` in `skills/war/assets/stage-workflow.mjs` ends `meta` at the first `^\}$` line. On the staged copy, a nested `}`-only line at any indent would end the match early. The args prelude would then land inside the object literal.

**Guard that landed.** The `indent-strip` args-field census rows in `skills/war/assets/stage-workflow.test.mjs` assert both `unguardedTopLevelKeys` and `extractArgsFields` are equal on raw and stripped forms.
A fixture with an indented `const z = A.zz` proves the stripped form binds the extra field.
The `META_STATEMENT` comment now states the real invariant: no line inside `meta` is exactly `}`.
Nothing tests that `META_STATEMENT` invariant directly.

**How to apply.** Before you add a whitespace transform, Grep its consumers for `^`-anchored regexes.
For each one, add a raw-versus-transformed equality row, plus a fixture that would differ.

Locate-cue: verify still present before acting. Found both regexes and the census rows, @ phase 1 of 2026-11-04-late-defects-fixed-in-run.
Read in the run's `_refinery` worktree at 6c4f0f4e, the gate-audited sha whose tree the land merge 99d325fd keeps.

Related: [[ptspans-tokenizer-comment-and-string-blind-embedded-args-injects-source-bytes]], [[the-staged-form-execution-run-is-not-in-the-repo-gate]], [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]].
