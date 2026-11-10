---
name: run-provision-config-not-yet-mirrored-into-template
description: "RESOLVED seam: when threading a config field into the template's inline copy, land the drift-guard test in the same task"
metadata: 
  node_type: memory
  slug: run-provision-config-not-yet-mirrored-into-template
  phase: B1,B3,B4a,B4b
  type: project
  provenance: code-verified
  keywords: [documented before wired, env-blocked, inline copy drift, mirror plus drift guard, run.provision, provisionList]
  tags: 
    - war
    - provisioning
    - war-config
    - drift-guard
    - inline-mirror
    - forward-obligation
    - schemas-doc
    - resolved
  files: 
    - skills/war/assets/war-config.mjs
    - skills/_shared/provision.mjs
    - skills/war/assets/workflow-template.js
    - skills/war/assets/workflow-template.test.mjs
    - skills/war/references/schemas.md
  relates: 
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[done-add-on-soft-failure-unblocks-true-dependents]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# run.provision documented-before-wired seam — RESOLVED

**Rule:** mirror without a guard re-opens drift. When threading a config field into the
template's inline copy, land the drift-guard test in the SAME task. Mirror + guard are one unit of
work.

Seam closed in B4b (#79/T6): the template reads the pinned `provisionList`, the refiner runs a
per-task Provision barrier emitting `env-blocked` (SOFT escalation), the behavioral test exists, and
`schemas.md` documents `run.provision`/`provisionSource`/`provisionAuto`.

**Why:** documented-before-wired is a transient seam, not a bug — but easy to lose between
green-in-isolation phases.
**How to apply:** land mirror + drift-guard atomically.

The second pattern from this seam (a helper with no JS callers can be live by contract) lives in
its own lesson: `a-helper-with-no-js-callers-can-be-live-by-contract-via-skill-prose`.

Related: [[template-defers-runtime-values-to-agent-via-literal-placeholder]], [[provision-barrier-refiner-owned-not-worker-self-create]], [[done-add-on-soft-failure-unblocks-true-dependents]]

> archived 2026-07-12: resolved — moved to archive
