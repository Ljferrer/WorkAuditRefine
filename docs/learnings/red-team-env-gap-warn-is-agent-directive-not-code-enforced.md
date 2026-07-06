---
name: ""
description: "'warn never red' = prompt directive, not code-enforced"
metadata: 
  node_type: memory
  slug: red-team-env-gap-warn-is-agent-directive-not-code-enforced
  phase: B3
  type: project
  keywords: [prompt-only enforcement, provision failure, exit code, no enforcement point, deliberate deferral, false gap finding, prose rule]
  tags: 
    - red-team
    - provisioning
    - executed-probe
    - agent-directive
    - enforcement-model
    - design-boundary
    - deferred
  files: 
    - skills/red-team/assets/workflow-scaffold.js
    - skills/red-team/references/lenses.md
  relates: 
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# Red-team env-gap→warn is an agent-prompt directive, not a code-enforced rule

**Rule:** the executed-probe guarantee — a failing provision step is an env-gap → `status:"warn"` + a note, NEVER a red/fail (Critical/Major) verdict — is delivered as prompt text only: `provisionDirective(technique)` in `skills/red-team/assets/workflow-scaffold.js` plus the scope-lock "Provision step (executed probes)" bullet in `skills/red-team/references/lenses.md`. The scaffold runs no shell: it assembles prompts and never executes provision commands, inspects exit codes, or mechanically downgrades a failure to `warn`. An empty/absent `provision` list adds no directive at all (byte-for-byte back-compat; analyzed/read-only probes never provision).

This is the same enforcement model as fingerprint and scope-lock: correctness rests on the agent obeying the directive. Mirrors [[template-defers-runtime-values-to-agent-via-literal-placeholder]].

**How to apply:**

- Don't audit the scaffold's control flow for an enforcement point — there isn't one, by design. "What stops a broken environment being mis-scored as a broken plan?" = the agent honoring the prompt.
- Don't "harden" it in passing. A deterministic execution harness (run the provision commands, mechanically emit `warn` on non-zero exit) was explicitly **deferred** in B3 and would be its own task.

**Why:** a future robustness lens will look for where "never red on an env-gap" is enforced and find only prose — recording that this is intentional prevents both false-gap findings and drive-by hardening.
