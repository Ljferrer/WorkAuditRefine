---
name: an-end-state-check-that-reads-a-shell-variable-runs-with-it-unset-because-nothing-produces-it
description: An End-state check naming $PHASE_BASE runs with it unset. Use a real ref
metadata:
  node_type: memory
  type: project
  keywords:
    - PHASE_BASE
    - end-state check variable
    - unset shell variable
    - endstate-check dispatch
    - check literal producer
    - origin/master compare
    - release version check
    - cmd file verbatim
  provenance: code-verified
  slug: an-end-state-check-that-reads-a-shell-variable-runs-with-it-unset-because-nothing-produces-it
  phase: "2026-11-08-pipeline-skills-and-memory-tooling/phase-2 (Release, tasks 2.1 + seed-1)"
  tags:
    - end-state
    - plan-authoring
    - red-team
    - release
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-13T05:07:00.527Z
---

# An End-state check that reads a shell variable runs with it unset

**The pattern:** a plan's `check:` literal may name a variable like `$PHASE_BASE`.
No manifest field or dispatch exports that variable.
The endstate-check dispatch writes the literal byte-verbatim to a `.cmd` file and runs it as a whole.
So the variable expands empty, and the check tests the wrong thing or fails.

**Instance:** the release End state (version strictly above the base) first compared against `PHASE_BASE`.
`/red-team` on 2026-11-12 found the variable had no producer.
It rewrote the check to read `git show origin/master:.claude-plugin/plugin.json` instead.
The check then passed at the landed tip (`PASS-E31`, 0.21.47 above 0.21.46).

**Verified referent:** the endstate-check dispatch in `skills/war/assets/workflow-template.js` (the `endStateCheckRows` block, "copy bytes, never re-quote, never substitute").
Read at the main checkout, not the landed tip.
That plan barred any edit to `workflow-template.js`, so the file is the same at the tip.
Verify still present before acting.

**How to apply:**
- Name only real refs or files in a `check:` literal, for example `origin/master` or a path.
- Never name a shell variable unless the check itself assigns it.
- When you review a plan, grep each `check:` for `$` and find the line that sets each variable.

Related: [[claimed-end-state-ids-are-intent-ordinals-and-phase-row-indexes-are-a-different-numbering]], [[a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner]].
