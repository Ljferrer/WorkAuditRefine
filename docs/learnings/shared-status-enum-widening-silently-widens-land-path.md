---
name: shared-status-enum-widening-silently-widens-land-path
description: Shared enum widening widens all modes; #236 guarded
metadata: 
  node_type: memory
  type: project
  keywords: [HARD_ESCALATION_REASONS, hard escalation, constant array mirror, unreachable value, includes check, latent behavior change, prompt drift]
  slug: shared-status-enum-widening-silently-widens-land-path
  phase: worker-test-floor/p2-t2
  date: 2026-06-29
  tags: 
    - workflow-template
    - status-enum
    - hard-escalation
    - merge-task
    - land-phase
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# Widening a shared status enum silently widens the hard-escalation path for all consumers

**Rule:** a status enum or constant array shared across workflow-template modes (merge-task, land-phase, ...) is widened for EVERY consumer mode when widened for one. An added value that only one mode's prompts emit is inert elsewhere — but that inertness is fragile, invisible to JS, and one prompt drift away from a silent hard escalation. When adding a mode-specific status: comment the unreachability at each shared check site (minimum), or split the enum if modes diverge.

Fixed/landed: the #236 unreachability comment now sits at the land-phase `HARD_ESCALATION_REASONS.includes(landResult.status)` check in `skills/war/assets/workflow-template.js`, and the array is drift-guarded as a documented mirror of land-decision.mjs's canonical export.

**Why:** shared constants make one mode's feature flag another mode's latent behavior change.

**How to apply:** before widening any shared status list, grep every `.includes(` / consumer site and either scope, comment, or split.

Related: [[done-add-on-soft-failure-unblocks-true-dependents]] — another shared workflow primitive with wider effect than its origin context implies.
