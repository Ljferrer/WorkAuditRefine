---
name: gitmodules-working-tree-read-vs-ref-snapshot
description: ".gitmodules read = working-tree not ref snapshot"
metadata:
  node_type: memory
  type: project
  keywords: [git config --blob, submodule guard, checked-out file, diff endpoint mismatch, declared paths misclassified, gitlink check, base vs branch]
  provenance: code-verified
  slug: gitmodules-working-tree-read-vs-ref-snapshot
  phase: submodule-support-increment-1-guard/T1
  tags: 
    - submodule
    - gitmodules
    - shell-guard
    - increment-2
    - ref-snapshot
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# `.gitmodules` cross-check reads the working-tree file, not a ref snapshot

**Rule:** `assert-no-submodule-mutation.sh` Step 3 resolves submodule paths via
`git config -f "$gitmodules_file"` where `gitmodules_file` is the checked-out working-tree
`.gitmodules` — not `.gitmodules` as of `<base>` or `<branch>` in the diff. Benign for the
refuse-all default (the mode-160000 gitlink check fires first), and still true under the landed
`--declared` mode: if a task branch edits `.gitmodules` itself, the working-tree read can
misclassify which paths are declared. Ref-accurate form if ever needed:
`git config --blob "${branch}:.gitmodules" --get-regexp '\.path$'`.

Increment 2 landed with a gitlink-only diff-mode design that sidesteps base-vs-branch declaration
comparison, so the limitation is latent by design, not fixed. Anchor at the `gitmodules_file=`
assignment in the Step-3 block, not line numbers.

**Why:** working-tree reads silently diverge from the diff endpoints the guard reasons about.
**How to apply:** any future path-discrimination widening must switch to `git config --blob` reads.
Related: [[weak-test-assertion-passes-without-feature-being-exercised]] (Variant 4),
[[submodule-fixture-protocol-file-allow-discipline]].
