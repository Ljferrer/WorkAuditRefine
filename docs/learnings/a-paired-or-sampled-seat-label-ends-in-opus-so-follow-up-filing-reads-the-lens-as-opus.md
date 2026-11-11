---
name: a-paired-or-sampled-seat-label-ends-in-opus-so-follow-up-filing-reads-the-lens-as-opus
description: "A seat label ending :opus files follow-ups under lens opus. Add a carve-out"
metadata:
  node_type: memory
  type: project
  keywords:
    - seat label
    - lens suffix
    - ":opus"
    - sampled review
    - lens pair
    - follow-up filing
    - file-followups
    - keyOf
  provenance: code-verified
  slug: a-paired-or-sampled-seat-label-ends-in-opus-so-follow-up-filing-reads-the-lens-as-opus
  phase: 2026-11-08-model-routing-and-prompt-byte-budgets/phase-4
  tags:
    - audit
    - routing
    - follow-up
    - residual
  created: 2026-11-10
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T03:15:31.878Z
---

`auditRound` keys a sampled seat or the opus half of a lens pair as `<lens>:opus` (`keyOf`).

The follow-up filing rule takes the lens as the trailing `:<lens>` segment, with a carve-out only for `:rebut`.

So a finding from such a seat files with lens `opus`.

This fires only with `routing.sampleOpusReview` set or a roster lens pair, so the default config is unaffected.

The phase 4 slice forbade prompt text changes, so the fix stayed an open `ask` at land.

The fix is a `:opus` pair-suffix carve-out beside `:rebut`, in both the filing prompt literal in `skills/war/assets/workflow-template.js` and `skills/war/references/file-followups.md`.

Any new seat-label suffix needs the same carve-out in every reader that parses the lens from a label.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]].

Locate-cue: verify still present before acting. Found at `skills/war/assets/workflow-template.js` (`keyOf` in `auditRound`) and `skills/war/references/file-followups.md` (only `:rebut` carve-out) @ phase 4 landed tip 7dfb8b69.
