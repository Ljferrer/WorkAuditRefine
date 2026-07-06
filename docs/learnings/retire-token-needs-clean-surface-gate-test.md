---
name: retire-token-needs-clean-surface-gate-test
description: "Retire token via *.test.sh grep gate; excl load-bearing"
metadata: 
  node_type: memory
  slug: retire-token-needs-clean-surface-gate-test
  phase: 4
  type: project
  keywords: [env var removal, absence assertion, grep exclusion, token reappearance, resolveGate self-discovery, deprecated flag sweep]
  tags: 
    - war
    - retirement
    - clean-surface
    - gate-test
    - grep-guard
    - reusable-pattern
    - WAR_WORKTREE
  files: 
    - hooks/clean-surface-war-worktree.test.sh
    - skills/war/assets/workflow-template.test.mjs
    - skills/war/references/schemas.md
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[scope-guard-needs-agent-type]]"
    - "[[scope-hook-servitor-pattern-residuals]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# Retiring a token: the reword is not the deliverable — a clean-surface GATE test is

`WAR_WORKTREE` (proven NO-OP in [[scope-guard-needs-agent-type]]) was retired via a
three-part recipe that keeps a token from silently creeping back:

1. **Reword every live-surface site** to the new model, linking the ADRs that justify it.
2. **Add a positive absence-assertion** where the token lived in generated output —
   `workflow-template.test.mjs` asserts the dispatched servitor prompt no longer contains
   `WAR_WORKTREE` (worker/fix-worker prompts likewise). Behavioral, not just textual.
3. **Add a repo-wide clean-surface gate as a `*.test.sh`** so the `resolveGate` self-discovery
   in `skills/war/assets/war-config.mjs` runs it every time:
   `hooks/clean-surface-war-worktree.test.sh` runs
   `grep -rn WAR_WORKTREE skills agents hooks | grep -vE '\.test\.'` and FAILS if non-empty.

Two non-obvious gotchas:
- **The `*.test.*` exclusion in the grep is load-bearing.** The step-2 absence-assertions
  legitimately *contain* the token; without the exclusion the gate flags its own sibling tests
  and can never go green. The exclusion is what lets assert-present-here and
  assert-absent-everywhere-else coexist.
- **Encode the guard as a test, not a one-time grep.** A hand-cleaned token reappears the
  moment a future worker pastes old prose; a gate-discovered test turns "we removed it" into
  "it cannot come back".

(The phase's side obligation — documenting the provisioning args and the literal-`"undefined"`
footgun in `schemas.md` — landed and stands closed.)

**Why:** a "docs & retire" phase reads like changelog noise, but the transferable artifact is
the retire-via-gate recipe.
**How to apply:** reword → assert-absent-in-output → grep-gate-the-whole-surface with a
deliberate test-file exclusion; reuse for the next retired env var / flag / token.
