---
name: handoff-endstate-met-default-hinges-on-verbatim-planref-match
description: "endState 'met' = no normRef-matched plan_ref finding; exact-match gap closed (#452)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: handoff-endstate-met-default-hinges-on-verbatim-planref-match
  phase: clean-handoff/phase-1/t1
  tags: 
    - handoff-block
    - endState
    - plan_ref
    - agent-directive
    - enforcement-model
    - gate-audit
  files: 
    - skills/war/assets/workflow-template.js
  relates: 
    - "[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]"
    - "[[audit-worktree-pre-impl-tip-stale-verdict]]"
  created: 2026-07-02
  originSessionId: 61876e7f-1f8a-45c3-92bb-885bdccba10e
---

# Handoff endState "met" default = absence of a matching finding, not verified absence

Rule: the handoff block in `skills/war/assets/workflow-template.js` defaults a claimed condition to `'met'` when no gate-audit finding's `plan_ref` matches it. That is absence-of-a-matching-finding — weaker than a verified absence of problems. And `plan_ref` itself is still prompt-fed (the auditor's VERBATIM directive is agent-obedience, not code-enforced) — same enforcement-model shape as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]].

Fixed/landed: the original exact-string-equality gap is closed — the `normRef` helper (trim, collapse whitespace, lowercase) now wraps both sides of the compare in workflow-template.js (code-verified on master; the two earlier stale-worktree re-Grep failures are the pattern in [[audit-worktree-pre-impl-tip-stale-verdict]]).

**Why:** reading `'met'` as a mechanical guarantee overstates it; a paraphrased plan_ref can still miss.
**How to apply:** treat `'met'` as "no finding cited this condition"; when auditing this construct, verify at the real landed tip, not a possibly-stale worktree.

> archived 2026-07-04: resolved — moved to archive
