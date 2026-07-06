---
name: run-provision-config-not-yet-mirrored-into-template
description: "RESOLVED seam: mirror+drift-guard land as one task"
metadata: 
  node_type: memory
  slug: run-provision-config-not-yet-mirrored-into-template
  phase: B1,B3,B4a,B4b
  type: project
  keywords: [documented before wired, live by contract, dead helper, prose consumer, env-blocked, zero JS callers, inline copy drift]
  tags: 
    - war
    - provisioning
    - war-config
    - drift-guard
    - inline-mirror
    - forward-obligation
    - schemas-doc
    - war-room
    - test-only-contract
    - resolved
  files: 
    - skills/war/assets/war-config.mjs
    - skills/_shared/provision.mjs
    - skills/war/assets/workflow-template.js
    - skills/war/assets/workflow-template.test.mjs
    - skills/war/references/schemas.md
    - skills/war-room/SKILL.md
  relates: 
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]"
    - "[[done-add-on-soft-failure-unblocks-true-dependents]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# run.provision documented-before-wired seam — RESOLVED; two durable patterns

Seam closed in B4b (#79/T6): the template reads the pinned `provisionList`, the refiner runs a per-task Provision barrier emitting `env-blocked` (SOFT escalation), the behavioral test exists, and `schemas.md` documents `run.provision`/`provisionSource`/`provisionAuto`.

1. **Mirror without a guard re-opens drift** — when threading a config field into the template's inline copy, land the drift-guard test in the SAME task; mirror + guard are one unit of work.
2. **A helper can be "live by contract"** — `resolveProvision` (`war-config.mjs`) still has zero JS callers; its only consumer is war-room SKILL.md prose (plus unit tests). Not dead code — same model as [[red-team-env-gap-warn-is-agent-directive-not-code-enforced]]. A future JS caller must consume the typed result, not re-derive the branching inline.

**Why:** documented-before-wired is a transient seam, not a bug — but easy to lose between green-in-isolation phases.
**How to apply:** land mirror + drift-guard atomically; grep prose consumers before deleting a "dead" helper.

Related: [[template-defers-runtime-values-to-agent-via-literal-placeholder]], [[provision-barrier-refiner-owned-not-worker-self-create]], [[done-add-on-soft-failure-unblocks-true-dependents]]
