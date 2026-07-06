---
name: plan-survey-token-sweep-misses-untagged-siblings
description: "Grep sweep = floor; add manual title survey"
metadata: 
  node_type: memory
  type: project
  keywords: [rename completeness, grep floor not ceiling, silent survivor, doc-contract test, manual read-through, stale concept]
  provenance: code-verified
  slug: plan-survey-token-sweep-misses-untagged-siblings
  phase: variable-audit-roster/T1
  tags: 
    - plan-authoring
    - grep-sweep
    - drift-guard
    - survey
  created: 2026-07-02
  originSessionId: 61876e7f-1f8a-45c3-92bb-885bdccba10e
---

# A grep-token sweep instruction in a plan misses siblings that lack the token

Rule: "grep for `<token>`, delete/rename every match" is a sound *mechanical* step but an
unsound *completeness* claim — a test, comment, or doc line encoding the same stale concept
in different words (a numbered nit reference, a prose description, a doc-reading migration
guard) survives the sweep silently. Treat the grep as a floor, not a ceiling: do one manual
read-through of the file's test/comment titles for the same semantic scope, and call each
survey-caught straggler out in the plan as a "survey-derived correction" so red-team and
the worker know it isn't a spec typo.

Instance: the variable-audit-roster plan's `covenSeats` sweep of `war-config.test.mjs`
would have missed two same-meaning siblings (a `#6 Nit 1` drift-guard with zero `covenSeats`
tokens; a fourth F06 doc-contract test); both were caught only by the plan author's manual
title survey. T1 has since landed and rewritten that file.

**Why:** drift-guards and doc-contract tests are named descriptively and don't always echo
the renamed symbol literally.
**How to apply:** any plan step of the shape "grep X, handle every match" → add a manual
title survey of the target file before declaring the sweep complete.

Related: [[wire-key-rename-misses-prose-placeholders]] (same family, prose-placeholder
surface); [[redteam-claims-vs-reality-misfires-on-impl-plans]] (this plan's red-team flagged
an already-stated drift as a hole); [[task-prompt-suite-count-stale-after-stacking]]
(grep-vs-count discipline for suite counts).
