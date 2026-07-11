---
name: dispatchkind-discriminator-replaces-label-prefix-parsing
description: "Stable opts.dispatchKind literal on a spawn call lets mocks/handlers/audits key on an explicit discriminator instead of parsing the human-readable label prefix (e.g. `provision-run:${task.id}` vs `provision:phase-${ph.id}`) — same pattern used for provision-barrier / provision-run / polish-worktree / evidence dispatches"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: dispatchkind-discriminator-replaces-label-prefix-parsing
  phase: war-engine-harden-r3/t1.2
  keywords: 
    - dispatchKind
    - label prefix parsing
    - spawn opts discriminator
    - isProvision
    - isProvisionRun
    - mocks keyed on label
    - workflow-template.js
    - stable discriminator field
  tags: 
    - design-pattern
    - dispatch
    - test-fragility
  created: 2026-07-10
  promoted: true
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Give a spawn call a stable discriminator field instead of making callers regex the label

**Pattern.** `workflow-template.js`'s refiner-dispatch call sites now each carry a literal
`opts.dispatchKind` string — `'provision-barrier'`, `'provision-run'`, `'polish-worktree'`,
`'evidence'` — set right next to the (still human-readable, still label-prefixed) `label` field.
Mocks, handlers, and audit code key on `dispatchKind`, not on parsing `label` prefixes like
`provision:` vs `provision-run:`. Verified present at the landed tip: grep `dispatchKind:` in
`skills/war/assets/workflow-template.js` finds all four sites (~line 391, 701, 1193, 1404), each
with a same-line or preceding comment naming it "stable discriminator — mocks/handlers/audits key
on it, not the label prefix."

**Why this beats label-prefix parsing:** a label string is built for human legibility (and can grow
a related-but-different prefix, e.g. `provision:` vs `provision-run:`, which a substring/regex
match can conflate) — a literal discriminator field is exact-match, immune to future label wording
changes, and self-documents the caller's intent at the call site (co-located with `label`, so a
reviewer sees both).

**Delete-the-feature check:** collapsing two dispatch kinds to the same `dispatchKind` value is
supposed to fail a distinctness assert (per the phase's end-state 8) — confirming the field is
load-bearing for test/mock routing, not decorative.

**General lesson:** when a dispatch/event site needs to be identified by downstream code (mocks,
handlers, audits, routers), add an explicit machine-readable discriminator field alongside any
human-readable label — don't make downstream code parse the label string. This generalizes past
this specific `workflow-template.js` refiner-dispatch case to any similar "many call sites, one
routing table" shape in this codebase.

Related: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (same file family, different
axis — prompt-surface coverage rather than dispatch routing).
