---
name: ask-question-blank-check-three-spellings-deferred-to-phase-3
description: "ask.question presence has 3 different spellings across sites; only contentTextOf is whitespace-aware, intakeFloor/askContentKey/parkAsk use raw truthiness"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - ask.question
    - blankText
    - contentTextOf
    - intakeFloor
    - parkAsk
    - askContentKey
    - whitespace
    - ask channel
    - Phase 3
    - askShaped
  provenance: code-verified
  slug: ask-question-blank-check-three-spellings-deferred-to-phase-3
  phase: 2026-09-06-engine-and-audit-verdict-integrity/phase-2 (Task 2.1)
  tags: 
    - engine-design
    - workflow-template
    - audit-findings
    - known-limitation
    - ask-channel
  created: 2026-09-07
  originSessionId: a2a576b1-d8af-4c79-ad1a-af3d3e5c5c91
  modified: 2026-09-07T14:41:57.602Z
---

# ask.question "is it present" test has three inconsistent spellings

## What

`skills/war/assets/workflow-template.js` (landed phase `2026-09-06-engine-and-audit-verdict-integrity`
Task 2.1, tip `1a30b56ecda78e7ccf829e947c54df95b3128f7c`) tests whether a finding's `ask.question`
carries real content at several sites, and the tests disagree on whitespace-only strings. Verified
live at the landed tip:

- `contentTextOf` feeds `f.ask.question` through `blankText` (`v => typeof v !==
  'string' || !v.trim()`) — a whitespace-only question reads as blank. Used by `normalizeSeat`'s
  intake demotion. `askShaped` is separate: `(Minor|Nit) && disposition === 'ask'`, with no
  `contentTextOf` read.
- `intakeFloor`'s ask arm: `typeof f.ask.question === 'string' && f.ask.question` —
  raw truthiness. A whitespace-only string is truthy, so it reads as present and routes
  `barrier:trade-off` to `'ask'`.
- `askContentKey` and `parkAsk`'s `question:` field: both
  `(f.ask && f.ask.question) || f.title || '(question unrecorded)'` — same raw truthiness.
- The gate-audit floor pass (its `barrier:trade-off` arm) and the seat-conflict peer check
  (`p.peer.ask && p.peer.ask.question`) also use raw truthiness.

So the SAME `ask.question: '   '` is blank at intake (a Minor with no title, no other content and
no `disposition: 'ask'` demotes to a note) but "present" everywhere else on a row that survives
intake (routes to the ask channel, keys the dedup, becomes the rendered question).

## Why durable

This is a live, documented inconsistency, not a false alarm — three different auditor lenses (two
`simplicity`, one earlier round) flagged it independently. Task 2.1's plan slice left the ask
channel to Phase 3 ("ask records"). Phase 3 landed (#2134) and this gap outlived it, so it is open
debt.

## How to apply

Before touching `parkAsk`, `askContentKey`, `intakeFloor`'s ask arm, the gate-audit floor pass or
the seat-conflict peer check: decide whether all of them should share one `blankText`-based spelling of "does this ask carry a question," and if so
change all of them together in one commit (a partial migration would make the inconsistency worse,
not better, by adding a fourth spelling).

## Related

[[intake-normalization-notes-push-bypasses-demote-no-dedup]] — a sibling documented residual from
the same task.

[[auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking]] — a
second, independent ask-channel gap (finding-level `task`/`seat`/`sha` at non-gate-audit `parkAsk`
call sites). Recheck it before relying on it.
