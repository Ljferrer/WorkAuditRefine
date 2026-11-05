---
name: turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held
description: "When an always-hold signal becomes fixable, every reader that inferred a hold from it goes stale"
metadata:
  node_type: memory
  type: project
  keywords:
    - gateHardOf
    - gate-evidence HARD trigger
    - late-fix route
    - handoff endState unmet
    - ADR 0024
    - land-decision header
    - stale doctrine
    - hold becomes fix
    - route change doc cascade
    - rides the sweep
    - behavior-row sort
  provenance: code-verified
  slug: turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1) + phase-4 (task 4.1, recurrence)
  tags:
    - gate-audit
    - handoff
    - doc-cascade
    - adr
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T16:17:58.811Z
---

# Turning an always-hold signal into a fix route stales every reader that assumed it held

Before task 3.1, every gate-audit Critical/Major held the land as `gate-evidence`.
Task 3.1 added `gateHardOf` in `skills/war/assets/workflow-template.js`.
Now only a fix-less blocker or an `escalate` verdict holds, and a blocker with a `suggested_fix` goes to the late-fix pass.

Many readers had silently relied on "a blocker means the phase held".
Each one turned false on a landed phase:

- The handoff endState map marked the condition `unmet`. Fixed: a late-fixed condition now reads `unverified` with a "fixed by the late-fix pass … not re-attested" note.
- The handoff `tipSha` fallback read a stale `lastLandedTip`. Fixed.
- The end-state check prompt said "(gate-evidence lane, holds the land)". Fixed.
- STILL STALE at the landed tip: the `gate-evidence` header comment in `skills/war/assets/land-decision.mjs` (says HARD only when provably unrun, or a finding-less escalate).
- STILL STALE at the landed tip: ADR 0024 §(C) in `docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md` says `isHardGateEvidence` fires on escalate or any Critical/Major.
  The plan's ADR 0058 (task 6.2) amends ADR 0012, 0013, 0026 and 0054, not 0024. So the plan never fixes this row unless task 6.2 adds it.

Rule: when you narrow a hold trigger, grep every reader of the signal, not only the trigger site.
Include handoff projections, tip trackers, prompt parentheticals, the canonical enum header comment and the ADR policy row.

Also see [[contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads]] and [[source-comment-lags-emitted-prompt-after-rewrite]].

Locate-cue: verify still present before acting — `gateHardOf` and the "fixed by the late-fix pass" endState note found in `skills/war/assets/workflow-template.js`, the stale header in `skills/war/assets/land-decision.mjs`, and the stale `isHardGateEvidence` sentence in ADR 0024 §(C) @ phase 3 landed tip c271332.

## Recurrence: a route change, phase 4 (task 4.1)

Task 4.1 moved `behavior` rows off the phase-close sweep (PIN-21).
The behavior-row sort now sends them to the late-fix pass, or demotes them naming the owner.
A behavior row raised after the pass carries on `carriedTasks[]` (non-final) or files "raised after the late-fix pass" (final).

The same cascade followed, one audit round at a time.
Four rounds found about eleven surfaces that still said a behavior row "rides the sweep":

- `skills/war/references/late-fix-pass.md` (the queue producer list and step 3), `skills/war/references/finding-class.md`, the `seededPhaseClose` row in `skills/war/references/schemas.md`, and the `noReentry` sentence in `CONTEXT.md`.
- Three full-line comments in `workflow-template.js` (the intakeFloor behavior-arm header, the gate-audit floor pass, the `lfRecord` comment), the LATE-FIX PASS header comment, and the `sweepExclude` validator messages.
- One operator log string in intakeFloor's behavior arm, the `remintBlock` queued reason (an `includes()` test literal matched it), and a demote-census comment in `workflow-template.engine-1.test.mjs`.

All were fixed before land, through ace rounds and the phase-close sweep.
`skills/war/SKILL.md` and `skills/war/references/design.md` carry the carve-out too.

Not every hit is stale.
The `dispositionOf` header and the follow-up-arm log still say "rides the sweep", and that is correct: cosmetic and classless rows still go there.

Rule for a route change: before the first audit, grep the whole repo once for the old destination phrase ("rides the sweep", "to the sweep", "through the sweep").
Judge each hit by the row class it describes.
Include log strings and test literals, not only prose and comments.

Locate-cue (phase 4): verify still present before acting — the PIN-21 sentence in `late-fix-pass.md` `## When it runs`, the "behavior-row sort (PIN-21)" text in `finding-class.md`, and the PIN-21 carve-out in `CONTEXT.md`, found @ phase 4 landed tip 28e74359 (the run's `_refinery` worktree at that HEAD).
