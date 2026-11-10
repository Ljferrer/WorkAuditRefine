---
name: assert-no-submodule-mutation-parses-positionals-before-flags-so-declared-must-trail
description: "assert-no-submodule-mutation.sh does shift 2 before its flag loop, so --declared placed before <base> <branch> binds as a positional and exits 2"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: assert-no-submodule-mutation-parses-positionals-before-flags-so-declared-must-trail
  phase: "recovery-re-merge-dispatch-coherence/phase-1 (tasks 1.1, 1.2)"
  keywords: 
    - assert-no-submodule-mutation
    - --declared
    - argument order
    - shift 2
    - exit 2
    - gitlink-bump
    - floor script
  tags: 
    - war
    - submodule
    - floor-script
  created: 2026-07-25
---

# Call assert-no-submodule-mutation.sh as `<base> <branch> [--repo <dir>] [--declared]`

**Rule:** put the positionals first and the flags after them. A flag-first call exits 2 (a status
error), never a floor verdict.

**Why:** `skills/war/assets/assert-no-submodule-mutation.sh` parses with
`base="$1"; branch="$2"; shift 2` before its flag loop. So
`assert-no-submodule-mutation.sh --declared <integrationBranch> <taskBranch>` binds
`base='--declared'` and `branch='<integrationBranch>'`. The leftover `<taskBranch>` hits the
`*) die "unexpected positional argument"` arm and exits 2. The refiner contract maps exit 2 to
`status:'error'`, not a clean pass.

**Instance:** `agents/war-refiner.md` step 6's declared-gitlink-bump example once wrote the flag
first. The dispatched prompts in `workflow-template.js` all used the trailing form
(`<base> <branch> --declared`), so only the standing card was wrong. The card has since been
corrected.

**How to apply:** when you write or review any call to this floor, in a card, a prompt or a test,
check that `--declared` and `--repo` come after both positionals.

Related: [[submodule-scoping-gap-survives-in-land-and-polish-dispatch-families]] (the phase that
found this gotcha).

> archived 2026-07-27: resolved — moved to archive
