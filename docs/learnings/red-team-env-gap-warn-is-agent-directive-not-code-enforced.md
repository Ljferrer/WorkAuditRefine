---
name: ""
description: "envGap flag + classify() demotion enforce env-gap→warn gate-side, not prompt-only"
metadata: 
  node_type: memory
  slug: red-team-env-gap-warn-is-agent-directive-not-code-enforced
  phase: B3 (origin); red-team-enforcement-hygiene/p1-1.1 (resolved, 2026-07-13)
  type: project
  provenance: code-verified
  keywords: [envGap flag, classify demotion, gate-side typed enforcement, deliverableAbsence precedent, provision failure, false gap finding, deliberate deferral, deterministic provision runner]
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
    - skills/red-team/assets/red-team-gate.mjs
    - skills/red-team/references/lenses.md
  relates: 
    - "[[run-provision-config-not-yet-mirrored-into-template]]"
    - "[[provision-barrier-refiner-owned-not-worker-self-create]]"
    - "[[template-defers-runtime-values-to-agent-via-literal-placeholder]]"
  created: 2026-06-25
  originSessionId: 53421d17-5351-48da-baf8-7d315d56c7b5
---

# Red-team env-gap→warn is now enforced gate-side by a typed `envGap` flag, not prompt-trust alone

**Rule:** the executed-probe guarantee — a failing provision step is an env-gap → `status:"warn"` + a
note, NEVER a red/fail (Critical/Major) verdict — is enforced at `classify()` in
`skills/red-team/assets/red-team-gate.mjs`. The failure clause of `provisionDirective(technique)`
(`skills/red-team/assets/workflow-scaffold.js`) directs the agent to stamp the note `envGap: true`
(the `FINDINGS` schema carries `envGap: { type: 'boolean' }`, the `deliverableAbsence` precedent, ADR
0032). `classify()` demotes any finding carrying `envGap === true` to an informational Minor —
unconditionally, regardless of severity or probe status — checked BEFORE the `KNOWN_SEVERITIES`
branch (so a severity-less env-gap note on a non-`pass` probe can never reach the `needsDecision`
force-promotion below it — the old obedient-path trap) and directly after the `deliverableAbsence`
check (a finding carrying both flags demotes via `deliverableAbsence` first, by pinned branch order).
`needsDecision` is deliberately NOT cleared: an env-gap note that also self-declares
`needsDecision: true` stays user-owned and still blocks. Mirrored in
`skills/red-team/references/lenses.md`'s "Provision step (executed probes)" bullet and
`skills/red-team/SKILL.md` step 3 (both-surfaces rule).

**Residual trust boundary:** the *demotion* is now mechanical and gate-side, but *setting* the flag is
still agent-side — the same enforcement class as `deliverableAbsence`, fingerprint attestation, and
the scope-lock (mirrors [[template-defers-runtime-values-to-agent-via-literal-placeholder]]). A probe
that fails to stamp `envGap: true` on a genuine provision failure still produces a blocking finding
(the old failure mode, unchanged by this fix); a probe that mis-stamps a genuine defect `envGap: true`
to dodge `blockers` is bounded, not prevented — the directive scopes the flag narrowly to
provision-step failures, and any demoted finding stays visible as a Minor in the grill loop, never
silently dropped (identical risk profile to `deliverableAbsence`). The gate does no NLP on
`reality`/`evidence` to second-guess the flag — it stays pure, keying on the typed flag alone.

**Superseded:** "don't audit the scaffold's control flow for an enforcement point — there isn't one"
no longer holds; `classify()` **is** the enforcement point now. What stays accurate from the original
guidance: the B3 **deterministic provision runner** — mechanically running the provision commands and
inspecting exit codes itself, with no agent stamp in the loop at all — remains explicitly deferred.
Today's mechanism is a hybrid (agent-stamped flag + gate-mechanical demotion), not an end-to-end
execution harness — don't "harden" the deferred runner in passing; it is still its own task.

**Why:** a future robustness lens auditing this guarantee should verify the `classify()` branch order
and the flag-omission residual — not re-litigate whether an enforcement point exists (it does now).
