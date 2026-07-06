---
name: gate-under-covers-after-cross-branch-merge-new-runner
description: "Setup gate snapshot misses new runners; resolveGate"
metadata: 
  node_type: memory
  slug: gate-under-covers-after-cross-branch-merge-new-runner
  phase: B5
  type: project
  keywords: [stale gate command, test surface snapshot, resolveGate, bash suite missed, self-discovery, unverified coverage, merged-in tests unrun]
  tags: 
    - war
    - gate
    - test-runner
    - cross-branch-merge
    - release-verification
    - under-coverage
    - reusable-pattern
  files: 
    - hooks/clean-surface-war-worktree.test.sh
    - hooks/validate-worktree-scope.test.sh
    - skills/war/assets/provision-worktrees.test.sh
  relates: 
    - "[[auditor-cannot-execute-the-tests-it-must-verify-pass]]"
    - "[[retire-token-needs-clean-surface-gate-test]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# Setup-time gate snapshot can silently under-cover after a merge adds a new runner

**Rule:** a gate command captured at setup is a snapshot of the test surface; a cross-branch merge
can introduce an entirely new runner (bash `*.test.sh` beside node `*.test.mjs`) the snapshot never
executes — green from one runner is not green for the repo.

Fixed: `resolveGate()` in `skills/war/assets/war-config.mjs` (threaded via SKILL.md step 3) appends
a repo-wide `*.test.sh` discovery loop on every invocation, so re-detection after integration is
automatic — this memory is the rationale behind that self-discovery.

**Why:** B5's release was verified only by `node --test` until the Lead ran the 3 merged-in bash
suites by hand; trusting the setup-time gate would have shipped a runner's worth of coverage unverified.
**How to apply:** never trust a literal gate string across an integration; resolve it fresh each time.
Same family as [[auditor-cannot-execute-the-tests-it-must-verify-pass]]; consumer side of the gate
[[retire-token-needs-clean-surface-gate-test]] relies on.
