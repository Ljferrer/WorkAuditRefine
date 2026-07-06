---
name: post-loop-assert-closes-silent-undefined-class
description: "Post-loop truthy assert + 3-case derivation test"
metadata: 
  node_type: memory
  type: project
  keywords: [literal undefined, missing args, truthy check, derivation loop, error message hint, three-case test, carry-forward]
  slug: post-loop-assert-closes-silent-undefined-class
  phase: provisioning-lifecycle/2b
  tags: 
    - war
    - workflow-template
    - args-contract
    - footgun
    - test-pattern
    - derivation
  files: 
    - skills/war/assets/workflow-template.js
    - skills/war/assets/workflow-template.test.mjs
  relates: 
  created: 2026-06-26
  originSessionId: fab06e87-b8c3-454f-a1d8-ecc9fa41faf6
---

# Post-loop assertion closes the silent-undefined derivation class; test needs three cases

Rule: after a derivation loop fills `t.branch`/`t.worktree`, assert both are truthy and
throw with the task id + failure surface + fix hint ("supply planSlug+runId+worktreeRoot or
explicit branch/worktree") — placed after derivation (so gap-fill and explicit carry-forward
are both resolved) and before any agent spawn. Without it, missing args interpolate the
literal text `undefined` into prompts.

Landed in the derivation loop of `workflow-template.js` ("cannot derive branch/worktree"
throw). Drift note: the missing-everything failure no longer rejects — the in-script
top-level try/catch converts the throw into a returned `held:workflow-error` envelope, and
the #71 test asserts `out.landDecision === 'held:workflow-error'`, not `assert.rejects`.

Test coverage for any throw-or-not derivation gate needs exactly **three cases**:
missing-everything (throw path — assert task id, branch/worktree token, and fix hint in the
message), explicit carry-forward (back-compat, no failure), derivation succeeds (happy path).
Skipping either non-failure case lets a regression break back-compat or derivation silently.

**Why:** an error message asserted only as "any Error" masks a wrong message that leaves the
Lead without actionable context.
**How to apply:** adding a derived-field loop → post-loop assert + 3-case test + 3-property
message check (id, surface, hint).
