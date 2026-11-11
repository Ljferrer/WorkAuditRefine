---
name: doc-drift-on-a-near-full-budgeted-surface-is-parked-not-fixed-by-late-fix-rounds
description: "Late-fix workers park doc drift on near-full budgeted cards as Ignore-for-now"
metadata:
  promoted: dev/2026-11-08-engine-findings-ace-and-late-fix@phase-3
  node_type: memory
  type: project
  keywords:
    - byte headroom
    - hard line
    - ADR 0042 eviction
    - late-fix pass
    - Ignore for now
    - doc drift
    - war-refiner.md
    - GLOSSARY.md
  provenance: agent-unverified
  slug: doc-drift-on-a-near-full-budgeted-surface-is-parked-not-fixed-by-late-fix-rounds
  phase: "2026-11-08-engine-findings-ace-and-late-fix/phase-3 (tasks p3-latefix-1, p3-latefix-3)"
  tags:
    - prompt-budgets
    - late-fix
    - doc-cascade
    - plan-authoring
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-10T03:08:52.292Z
---

# Doc drift on a near-full budgeted surface is parked, not fixed, by late-fix rounds

**What happened.** Phase 3 changed ace-gate and absorb-charge rules (D11, D35, D40).
The doc cascade then spent all five late-fix rounds on stale prose in references, ADRs and comments.
Two fixes never landed because their surfaces were full:
- `agents/war-refiner.md`: the ace gate sentence does not say a red must echo `head_sha` or name the `provision_failed` arm. The worker reported 7 bytes of headroom under the hard line.
- `GLOSSARY.md`: the segmented-gate entry does not name the D11 unjudged-red re-dispatch. The worker tried the edit, broke the hard line (21 bytes of headroom), and reverted it.
Both went to `Ignore for now:` notes.
The dispatched prompts already carry the right rule, so only the standing surfaces lag.

**Why.** A late-fix worker does not pay an ADR 0042 eviction to fund a one-line doc fix.
The binding guardrail also forbids a `Budget-Raise` trailer in this plan.
So drift on a near-full card stays until a planned task moves bytes out.

**Rules.**
- Plan authors: if a phase changes a rule that a near-full card or `GLOSSARY.md` states, put the card edit and its eviction in the task slice.
- Do not count on the late-fix pass or the sweep to fix it.
- Lead: route the parked notes to a follow-up that names the eviction, or to the doc-truth plan.

The headroom numbers come from worker reports, not a measure at the tip.
Referents not byte-measured @ phase 3 (no Bash) — verify with `prompt-surface-budgets.test.mjs` before acting.

Related: [[byte-caps-force-justification-not-forbid-raises]], [[default-flip-must-audit-all-doc-surfaces]], [[standing-instruction-vs-dispatched-prompt-coverage-split]].
