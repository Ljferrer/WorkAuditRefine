---
name: a-seat-label-parser-must-not-take-the-rebut-suffix-as-the-lens
description: "Rebuttal seat labels end in :rebut and gate-audit seats use a family prefix, so a trailing-segment lens parse misreads them"
metadata:
  type: project
  provenance: code-verified
  slug: a-seat-label-parser-must-not-take-the-rebut-suffix-as-the-lens
  phase: "authoring-side-verification/phase-3 task 3.2"
  keywords:
    - rebut suffix
    - seat label
    - lens extraction
    - runSeat label
    - gate-audit family prefix
  tags:
    - war
    - engine
    - workflow-template
    - gate-audit
  created: 2026-08-24
  originSessionId: dcda690d-99d2-4fba-9d28-2a2a858d4676
  modified: 2026-08-25T08:18:31.435Z
---

# A seat-label parser must not take the `:rebut` suffix as the lens

**Rule:** seat labels of the form `audit:<task>:<lens>:rebut` break trailing-segment lens
extraction. Parse a seat label by its family prefix, and treat a trailing `:rebut` as a dispatch
label, never the lens.

**Instance (#1659, now fixed):** the file-followups filing-prompt clause told the filing agent to
take "each entry's trailing `:<lens>` segment" from a row's `seats` list. Seat labels are built as
`` `audit:${task.id}:${seat.lens}${peers ? ':rebut' : ''}` `` (the `label:` construction inside
`runSeat`). When a split panel takes a rebuttal round and then approves, the surviving rows' `seats`
carry `:rebut`-suffixed labels, so the lens read as `rebut`. It failed open (no throw, no hold) but
silently degraded the evidence. Fix: the Evidence-artifacts clause in
`skills/war/assets/workflow-template.js` now says a trailing `:rebut` is a dispatch label, never
the lens, and applies a family-prefix rule for `gate-audit` seats.

**How to apply:** before parsing a seat label for its lens, check for the `:rebut` suffix and the
`gate-audit` family prefix.

## Related

- [[requirestest-false-tasks-have-no-gate-audit-entry-so-gate-audit-derived-lookups-need-a-landed-sha-fallback]]: the sibling gap found in the same audit pass.
- [[ace-bisection-ladder-shipped-with-four-known-residual-fragilities-filed-not-fixed]]: the model for recording known, filed, not-fixed gaps on a fresh mechanism.
- [[standing-instruction-vs-dispatched-prompt-coverage-split]]: the standing `file-followups.md` reference under-describes the dispatched prompt's Evidence-artifacts duty.

> archived 2026-10-27: resolved — moved to archive
