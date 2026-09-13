---
name: plugin-cache-template-can-lag-a-branch-hotfix-mid-self-hosting-run
description: "A self-hosting WAR run may execute the installed plugin's template, not the branch's own copy"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: plugin-cache-template-can-lag-a-branch-hotfix-mid-self-hosting-run
  phase: 2026-09-11-backward-chain-doctrine/phase-1
  keywords: 
    - self-hosting
    - plugin cache
    - workflow-template.js
    - stage-workflow.mjs
    - Date.now forbidden
    - dogfooding WAR on WAR
    - shipped template
    - plugin-dir reload
  tags: 
    - engine
    - self-hosting
    - hypothesis
  created: 2026-09-12
  originSessionId: 5a652d85-60d8-4ec9-9cbf-3333802c7056
  modified: 2026-09-12T08:15:01.772Z
---

# Hypothesis: a self-hosting run can execute the installed plugin's template, not the branch's own copy

**Explicitly a hypothesis note (agent-unverified)** — this servitor could not independently confirm
the causal mechanism (no Bash, no git log access); it rests on the Lead's narrative for this phase
plus circumstantial code evidence, not a primary-evidence-plus-refute trail.

**What the Lead reported:** Attempt 2 of this phase died at entry because "the branch's own
`workflow-template.js` still called `Date.now()`, which the Workflow harness forbids" — a defect
already fixed upstream at plugin version 0.21.14 (PR #2301). Staging from the plugin-cache
template (the installed/running plugin's own copy) with the branch's hotfix reapplied on top is
what fixed it — implying the run was executing a template resolved from the plugin cache, not from
this branch's own checkout of `skills/war/assets/workflow-template.js`.

**Circumstantial code support:** `skills/war/references/staged-script.md` documents that the
per-phase stager (`skills/war/assets/stage-workflow.mjs`) assembles each run's staged script from
"the shipped template" — language consistent with resolving a plugin-shipped copy rather than
necessarily the repo branch under active review. `CLAUDE.md`'s "Local plugin iteration" note
already warns that local-path plugin dirs resolve to version `unknown` and need `/reload-plugins`
after every edit for changes to take effect, which is the general shape of this same risk.

**Guidance (treat as a hypothesis to re-verify, not a settled fact):** when a plan's own tasks
modify `workflow-template.js` (or any engine file WAR itself runs on) inside a live `/war` run
against this repo, do not assume a hotfix committed to the working branch is automatically what
the running session executes. If a run dies at entry with a defect already fixed upstream of the
branch's current base, suspect a stale plugin-cache/installed-version template before re-diagnosing
the branch code itself — verify which template actually loaded before spending a round on it.
