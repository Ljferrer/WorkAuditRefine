---
name: end-state-file-level-grep-floor-satisfied-by-explanatory-comment-alone
description: "A plan End-state's file-level grep floor over a source file (grep -Fc 'phrase' file.js >= 1) can stay green even after the EMITTED prompt clause it's meant to pin is reverted, when a nearby drift-guard/coupling COMMENT in the same file independently contains the same literal token — cite the mechanically-pinning rendered-output test row as the real observable, treat the raw grep as a floor only."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - end-state check
    - grep floor
    - file-level grep
    - coupling comment
    - D3 registry
    - discrimination gap
    - auditPrompt
    - workflow-template.js
    - plan-authoring
    - mechanical pin
  provenance: code-verified
  slug: end-state-file-level-grep-floor-satisfied-by-explanatory-comment-alone
  phase: 2026-08-06-gate-audit-finding-routing/2.1
  tags: 
    - plan-authoring
    - gate-audit
    - evidence-capture
  created: 2026-08-15
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
  modified: 2026-08-16T02:53:52.273Z
---

# A file-level grep End-state floor can be defeated by its own coupling comment

## What happened

Task 2.1 (2026-08-06-gate-audit-finding-routing) added two literal tokens to
`skills/war/assets/workflow-template.js`'s `auditPrompt()` — `however severe` (ESCALATE-BOUNDARY
CONTRACT clause) and `metacharacter` (SEARCH-TOOLING RULE clause) — and the plan's End states
16/17 pinned them with file-level greps: `grep -Fc 'however severe' workflow-template.js >= 1`,
`grep -ci 'metacharacter' workflow-template.js >= 1`.

Both tokens ALSO appear in explanatory JS comments directly above the `pt`-tagged emission lines
(verified at the landed tip `06020944b884d2e2860ccf2fe698ef3d5ba4868e`):
`workflow-template.js` :918 contains the literals "required when" and "however severe", and :904
contains "metacharacter" — both inside drift-guard/coupling comments (required by this repo's
both-surfaces mirroring law), not the emitted clauses themselves (which live at :907 and :921).
So the two greps stay green even if the emitted `pt` clauses were reverted — the file-level floor
can no longer discriminate an emitted-clause revert from a comment-only file.

Not a defect in the diff — the coupling comments are correct and required. The real mechanical
pin is sound: a D3 test-registry row asserts the same tokens against the RENDERED `auditPrompt()`
OUTPUT (not the source file), so a per-surface revert still reds that test.

## Durable rule

- When a plan End-state's mechanical `check:` is a file-level grep over a source file that ALSO
  carries drift-guard/coupling comments (a near-universal pattern in this repo — see
  [[standing-instruction-vs-dispatched-prompt-coverage-split]]), the grep floor is
  discrimination-weak by construction: it cannot tell "the emitted clause is live" from "only the
  comment survives". Prefer pinning against the RENDERED output (call the function under test,
  assert on its return) wherever a registry test already does so.
- When attesting such an End state at gate-audit time, cite the rendered-output test row as the
  observable and treat the raw file-level grep as a floor-only signal, not proof.

## Locate cue

`skills/war/assets/workflow-template.js` :902-921 (SEARCH-TOOLING RULE / ESCALATE-BOUNDARY
CONTRACT comments + emitted `pt` clauses, both carrying the pinned literals) — verify still
present before acting.
