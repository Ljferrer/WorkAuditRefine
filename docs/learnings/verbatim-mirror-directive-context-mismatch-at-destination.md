---
name: verbatim-mirror-directive-context-mismatch-at-destination
description: VERBATIM mirror copies env-specific prose wrong-context
metadata: 
  node_type: memory
  slug: verbatim-mirror-directive-context-mismatch-at-destination
  phase: dispatched-gate-run-tmpdir-pin-parity/t1 → RESOLVED audit-gate-evidence-fidelity/1.1
  type: project
  keywords: [byte-identical copy, wrong cwd prose, directive-parallel paraphrase, TMPDIR clause, copy-paste drift, misleading prose, two-surface parity]
  tags: 
    - war
    - prompt-architecture
    - workflow-template
    - verbatim-mirror
    - audit-finding
    - nit
    - land-phase
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
    - "[[source-comment-lags-emitted-prompt-after-rewrite]]"
  created: 2026-06-27
  originSessionId: 2eb2f9f5-ce97-45bd-bd88-d173ce9ab936
---

# Verbatim-mirror directive produces context-wrong prose at the destination site

## What was found (dispatched-gate-run-tmpdir-pin-parity / t1 — Nit)

The plan directed a VERBATIM copy of the TMPDIR clause from `agents/war-refiner.md` step 2 of
the merge-loop (a merge-task context) into BOTH dispatched prompt sites in
`skills/war/assets/workflow-template.js` (verify still present before acting). The merge-task
sites (the two `refineryPath` merge-loop prompts in the `merge-task` / fix-retry blocks) are
correct: the clause reads "the gate's cwd stays the task worktree" and at those sites the gate
genuinely runs in a task worktree.

The land-phase site (the gate clause inside the `refineryLandPath` land block, step 2 "Merge")
received the identical text, but the land gate runs inside the detached `_refinery` worktree
(`refineryLandPath`), NOT a task worktree. The verbatim copy therefore states an inaccurate cwd
for that context. It is inert — the TMPDIR pin semantics are unchanged — but it is misleading prose.

The auditor rated this a Nit and explicitly noted no action is required because the plan
mandated verbatim mirroring and correcting it would deviate from the plan's stated directive.

## The pattern

Whenever a plan says "mirror VERBATIM from X into Y and Z":

- Check whether X's prose contains any environment-specific references (cwd, paths, worktree
  names, agent names).
- If Y and Z have different environments at the referenced noun, the verbatim copy will be
  accurate at one site and inaccurate at the other.
- The fix is either: (a) use context-appropriate paraphrase instead of byte-identical copy,
  or (b) accept the Nit and document it (as was done here).

## Durable rule

> "Verbatim mirror" instructions don't account for context drift at the destination.
> When mirroring prose that names execution context (cwd, path, worktree), verify the
> noun is correct at each destination site — don't assume same text = correct semantics.
> If the plan requires byte-identical copy, file a Nit and note which context noun is wrong.

If ever revised: the land-phase variant (the gate clause in the `refineryLandPath` land block's
step 2 "Merge" of `skills/war/assets/workflow-template.js`, verify still present before acting)
could read "the gate's cwd stays the _refinery land worktree" instead. No correctness impact until then.

## Positive resolution pattern (memory-provenance/t3)

T3 faced a similar two-surface parity requirement (war-servitor.md + workflow-template.js
wrap-up block). The worker correctly chose **directive-parallel paraphrase** rather than a
byte-identical copy: the wrap-up condensed war-servitor.md's markdown tables into inline
template-string prose with dispatched-context phrasing (`'the input is LLM-authored audit
monologue'`), preserving every semantic directive while avoiding the verbatim-mirror
context-mismatch footgun. Gate-audit confirmed full parity (all four directives + three
tier names present in both surfaces) with no context-noun errors. This is the recommended
pattern when two surfaces share directives but differ in execution context.

## Resolution (audit-gate-evidence-fidelity/1.1)

**RESOLVED (instance) — kept as concept anchor.** The land-site instance this lesson tracked
is fixed: the land dispatch's step 2 "Merge" clause in `skills/war/assets/workflow-template.js`
now reads "the gate's cwd stays the `_refinery` land worktree" (exact bytes, backticks
included) instead of the inherited "the gate's cwd stays the task worktree". The two
merge-task TMPDIR clauses are untouched and stay byte-identical to each other. A new durable
source-count test in `workflow-template.test.mjs` asserts `workflow-template.js` contains
exactly 2 occurrences of `cwd stays the task worktree` and exactly 1 of `` cwd stays the
`_refinery` land worktree `` — the three near-identical clauses can no longer silently
re-converge into the same wrong noun.

The lesson stays hot (no archive, no retitle): it remains the generic verbatim-mirror
pattern record, and the durable rule above ("verify the noun is correct at each destination
site — don't assume same text = correct semantics") still governs any future "mirror
VERBATIM from X into Y and Z" directive.

Relates to [[standing-instruction-vs-dispatched-prompt-coverage-split]] (the broader
two-layer coverage pattern this Nit lives inside);
[[source-comment-lags-emitted-prompt-after-rewrite]] (analogous lag: template comments
describing the old model after a rewrite);
[[relaxed-assertion-test-title-must-update-together]] (scope-lock corollary: cross-file
label drift when rename is in one file and test titles are in another);
[[shared-string-constant-quote-literal-byte-anchor-fragility]] (sibling fragility: a
byte-identity test anchored on literal punctuation rather than semantic content, from
audit-calibration-and-graduation/t1).
