---
name: turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held
description: "When an always-hold signal becomes fixable, readers that assumed a hold go stale"
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
    - absolute rule exception
    - ADR dated amendment
    - pin-transfer.md stale
    - paraphrase grep miss
    - wrapUpDecision
    - handoff emit set
    - held:land-failed
    - servitorResult reader
    - gate widening
  provenance: code-verified
  slug: turning-an-always-hold-signal-into-a-fix-route-stales-every-reader-that-assumed-it-held
  phase: 2026-11-04-late-defects-fixed-in-run/phase-3 (task 3.1) + phase-4 (task 4.1, recurrence) + phase-5 (task 5.1, recurrence) + phase-6 (task 6.2 and polish, status) + 2026-11-08-engine-recovery-relaunch-and-land/phase-2 (task 2.1, recurrence)
  tags:
    - gate-audit
    - handoff
    - doc-cascade
    - adr
  created: 2026-11-05
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-09T16:10:56.695Z
---

# Turning an always-hold signal into a fix route stales every reader that assumed it held

**Pattern.** When a signal that always meant "hold" becomes fixable, every reader that inferred a hold from it goes stale.
It recurred four times in two plans:
- `gateHardOf` in `skills/war/assets/workflow-template.js` made a gate-audit Critical/Major with a `suggested_fix` go to the late-fix pass instead of holding the land. The handoff endState map, the `tipSha` fallback and an end-state prompt parenthetical all still assumed a hold.
- Behavior rows moved off the phase-close sweep to the late-fix pass (PIN-21). Four audit rounds found about eleven surfaces, including log strings and a test literal, that still said a behavior row "rides the sweep". Not every hit was stale: cosmetic and classless rows still ride the sweep.
- Exceptions were added to rules that doctrine stated as absolute (PIN-10 `aceBaseIds`, PIN-11, PIN-12). Audit seats found the absolute sentence in references, ADRs, the glossary and prompts. A fixer wrongly skipped an ADR as "a dated record"; ADRs here take a dated amendment bullet.
- `wrapUpDecision` widened to run the servitor on `held:land-failed`, and the handoff now emits there too (#2702). Readers that inferred "landed" from a non-null `servitorResult` or a handoff went stale. The fixes rode five late-fix passes, and later passes found their slices already done.

## Rules

- When you narrow a hold, change a route or widen a gate, grep every reader of the signal and of its output fields (`servitorResult`, `handoff`), not only the trigger site. Include handoff projections, tip trackers, prompt parentheticals, enum header comments, ADR policy rows, log strings and test literals.
- Grep the rule's meaning, not one spelling. Try short forms ("can't merge", "never merge", "no approval", "rides the sweep", "to the sweep"). Judge each hit by the row class it describes.
- Amend an ADR with a dated bullet. Never defer it as "a dated record".
- Add a doc pin that extracts the set from the engine source and checks each doc restatement in the same task as the gate change, not after the first stale reader escapes. The model is the test `2702/D34 — the Wrap-up gate equals the handoff emit gate` in `skills/war/assets/skill-doc-contracts.test.mjs`.
- A late-fix slice built from early-round findings can be stale by dispatch time, so diff it against the integration tip first.

## Still stale at master 4b101693

- The `gate-evidence` header comment in `skills/war/assets/land-decision.mjs` names only "provably unrun" and a finding-less escalate.
- ADR 0024 §(C) (`docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md`) says `isHardGateEvidence` fires on escalate "or a Critical/Major finding". ADR 0058 does not amend ADR 0024.
- `skills/war/references/design.md` Validation criteria says "A task can't merge with an open Critical/Major", with no probe carve-out.
- `skills/war/references/schemas.md`: the `handoff?` ledger comment says "(landed / held:escalation only)", and the Consolidation bullet says of `held:land-failed` "no handoff emits there".

Locate-cue (verify before acting): `gateHardOf`, `aceBaseIds` and `wrapUpDecision` in `workflow-template.js`; the stale lines above by their quoted text.

Also see [[contract-cardinality-change-leaves-singular-prose-that-no-value-guard-reads]] and [[source-comment-lags-emitted-prompt-after-rewrite]].
