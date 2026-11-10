---
name: floor-script-exit-codes-1-vs-2-route-differently
description: "Floor exit 1=no-test vs 2=git-err; every consumer incl dispatched prompts must split"
metadata:
  node_type: memory
  slug: floor-script-exit-codes-1-vs-2-route-differently
  phase: worker-test-floor/t1
  date: 2026-06-29
  tags:
    - floor-script
    - exit-codes
    - routing
    - error-handling
  related:
    - floor-script-discovery-set-must-mirror-gate-exclusions
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Floor exit 1 (no-test) and exit 2 (git/ref error) route differently

`assert-test-in-diff.sh` exits: 0 = matching test present; 1 = valid diff, no matching test; 2 = git-diff itself failed (bad ref, unfetched branch). Collapsing non-zero to "no-test" misroutes a transient git-ref failure into a pointless fix-worker cycle on a perfectly fine diff.

**Rule:** any script splitting expected-negative (exit 1) from infrastructure failure (exit 2+) must document the codes at the call site, and EVERY consumer — including dispatched prompt language instructing an agent to act on the return code — must branch on them. The `# exit 1=no-test, exit 2=git-err` comment is load-bearing, not decoration.

Fixed on all three surfaces: the merge-task and no-test-retry dispatched prompts in `skills/war/assets/workflow-template.js`, the refiner standing prose in `agents/war-refiner.md` (step 4), and `skills/war/references/schemas.md` all split exit 1 → `status:'no-test'` vs exit 2 → `status:'error'`, never `'no-test'`. See [[standing-instruction-vs-dispatched-prompt-coverage-split]].

**Why:** exit 2 misread as no-test wastes a worker slot and obscures the real infra cause.
**How to apply:** enumerate each exit code explicitly at every consumer; mirror the split verbatim into any agent prompt that acts on the code.

Related: [[floor-script-discovery-set-must-mirror-gate-exclusions]]

> archived 2026-07-04: resolved — moved to archive
