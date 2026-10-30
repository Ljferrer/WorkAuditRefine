---
name: a-dispatch-context-key-that-names-an-action-must-ride-only-the-dispatches-that-run-it
description: "A context key that tells prompts an action runs must ride only the dispatches that run it, and never as null"
metadata:
  node_type: memory
  type: project
  keywords:
    - revert_range
    - taskMergeContext
    - revertMergeContext
    - merge snapshot
    - floor-retry
    - null key
    - context JSON
    - patch prediction
  provenance: code-verified
  slug: a-dispatch-context-key-that-names-an-action-must-ride-only-the-dispatches-that-run-it
  phase: 2026-10-28-blocked-ace-and-merge-provenance/phase-1
  tags:
    - engine
    - merge-slot
    - prompts
    - context
  created: 2026-10-29
  originSessionId: 3f00b529-667c-446f-a615-e0d3485ae35a
  modified: 2026-10-29T13:13:18.284Z
---

# Bind a context key to the dispatch that performs its action

**Fact.** The merge slot shares one context object across several refiner dispatches.
In phase 1 that object gained `revert_range`.
The snapshot and pin-confirm prompts read it as "this dispatch forward-reverts the range, so predict the approved commit's patch".
Only two dispatches actually run the revert clause: the pin-transfer probe and the primary merge.
The floor-retry, environment-proceed and baseline-proceed re-merges reused the same context.
After a floor-fix commit, the floor-retry snapshot predicted the approved patch without the floor fix.
`confirmMerge` and `reconcileMerge` then failed on a merge already pushed, and the task held (a PIN-5 breach).
A Major on this sat across two ace rounds before it landed fixed.

**Second half: a null key is a third state.** The context first always carried the key, so JSON rendered `"revert_range":null`.
Prompts that branch on "when the context names revert_range" are ambiguous on a null key.
A refiner that reads the null key as present returns the wrong `content_sha`, then retries to `pin-transfer:unverified`.
Emit the key only when it has a value.

**Rule.**
- If a prompt branches on a context key, attach the key only to the dispatches whose prompt runs the matching clause.
- Build a plain base context and spread the key in for those dispatches only.
- Never emit the key as null. Absent means absent.
- Add a test that a retry dispatch's context does not carry the key, and prove it red by restoring the shared context.

**Locate-cue (verify still present before acting).** Found at `skills/war/assets/workflow-template.js` @ phase 1 landed tip b0c2e25.
Look for `const revertMergeContext = revertRange ? { ...taskMergeContext, revert_range: revertRange } : taskMergeContext` and the "Two merge contexts (#2485 D17, PIN-5)" comment above it.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]], [[template-defers-runtime-values-to-agent-via-literal-placeholder]].
