---
name: checkpoint-auto-recover-prose-is-silent-on-rejected-cas-loss
description: "Checkpoint's held:land-failed auto-recover bullet doesn't spell out the [rejected] CAS-loss outcome of its own manual push, but never-force makes the omission benign"
metadata:
  type: project
  keywords:
    - Checkpoint
    - held:land-failed
    - auto-recover
    - rejected
    - CAS loss
    - never-force
    - land-advance
    - SKILL.md
  provenance: code-verified
  slug: checkpoint-auto-recover-prose-is-silent-on-rejected-cas-loss
  phase: checkout-guard/phase-1-t2
  tags:
    - SKILL.md
    - land
    - CAS
    - nit
  created: 2026-07-06
---

# The `held:land-failed` auto-recover bullet never names its own `[rejected]` failure mode — benign, but worth knowing why

**Confirmed at `skills/war/SKILL.md`, "Checkpoint" section, the `held:land-failed` bullet** (the
narrow checkout-collision auto-recover added by this phase, mirrored in
`docs/adr/0018-war-working-branch-checkout-guard.md`): the prose says, under `--afk`, to "auto-perform"
the manual land — merge, gate, then `git push` — "Gate the push on green — MUST NOT push on a red gate."
It does not spell out what happens if that manual `git push` itself loses a race and comes back
`[rejected]` (another process advanced `origin/<working>` in the interim).

**Why this is benign, not a gap to fix:** the never-force invariant (ADR 0004) means a lost race here
just leaves the working branch un-advanced — no data loss, no forced overwrite. The bullet's own
constraint ("never `--force`") already forecloses the dangerous outcome; the only missing piece is
*naming* the [rejected] case explicitly, which `cmd_land_advance`'s own exit-code contract
(see [[land-advance-push-first-cas-rejected-token]]: 0/2/3, `[rejected]` → 2 → reland) already handles
for the **automated** path. This Checkpoint bullet is a **Lead standing instruction only** — the
manual-recover git commands run ad hoc in the Lead's own prose-driven flow, not through
`cmd_land_advance`, so the 0/2/3 contract doesn't literally apply to it; that's exactly why the prose
gap exists and exactly why it's low-stakes (a human Lead retrying a rejected push is not silently corrupting
state).

Auditor disposition on this phase: Nit, `disposition: note` — not filed as a follow-up, not blocking.

**How to apply:** if this bullet is ever revised, consider adding one clause: "if the push is
`[rejected]`, treat it like any other `held:land-failed` — do not retry with `--force`; re-diagnose."
Not urgent given the invariant already covers it.

Related: [[land-advance-push-first-cas-rejected-token]] (the automated path's exit-code contract this
bullet's manual path deliberately does not reuse), [[absent-origin-working-branch-baseline-also-forces-manual-land]]
(the other `held:land-failed` cause this same phase addressed).

> archived 2026-07-11: resolved — moved to archive
