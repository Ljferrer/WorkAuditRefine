---
name: a-helper-with-no-js-callers-can-be-live-by-contract-via-skill-prose
description: "resolveProvision has no JS callers but war-room SKILL.md prose calls it, so grep skill prose before deleting a helper that looks dead"
metadata:
  node_type: memory
  slug: a-helper-with-no-js-callers-can-be-live-by-contract-via-skill-prose
  phase: B1,B3,B4a,B4b
  type: project
  provenance: code-verified
  keywords: [dead code, live by contract, resolveProvision, prose consumer, SKILL.md, helper deletion, zero callers]
  tags:
    - war
    - provisioning
    - war-room
    - test-only-contract
  files:
    - skills/war/assets/war-config.mjs
    - skills/war-room/SKILL.md
  relates:
    - "[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]"
  created: 2026-06-25
---

# A helper with no JS callers can be live by contract through skill prose

**Rule:** before deleting a helper that has zero JS callers, grep SKILL.md and other prose for
consumers. A helper can be live by contract.

**Instance:** `resolveProvision` (`war-config.mjs`) has zero JS callers outside its unit tests. Its
consumer is `skills/war-room/SKILL.md` prose, which tells the agent to ask the module what to do.
It is not dead code. This is the same model as
[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]].

**How to apply:** grep prose consumers before deleting a "dead" helper. A future JS caller must
consume the typed result, not re-derive the branching inline.

Split from [[run-provision-config-not-yet-mirrored-into-template]].

> archived 2026-07-12: resolved — moved to archive
