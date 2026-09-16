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

- `contentTextOf` (line ~1306) feeds `f.ask.question` through `blankText` (`v => typeof v !==
  'string' || !v.trim()`) — a whitespace-only question reads as blank. Used by `normalizeSeat`'s
  intake demotion (`askShaped` also spares this correctly via `contentTextOf`).
- `intakeFloor`'s ask arm (line ~1264): `typeof f.ask.question === 'string' && f.ask.question` —
  raw truthiness. A whitespace-only string is truthy, so it reads as present and routes
  `barrier:trade-off` to `'ask'`.
- `askContentKey` (line ~1286) and `parkAsk`'s `question:` field (line ~1342): both
  `(f.ask && f.ask.question) || f.title || '(question unrecorded)'` — same raw truthiness.
- The gate-audit floor pass (line ~4280) also uses the raw-truthiness spelling.

So the SAME `ask.question: '   '` is blank at intake (never demoted to a note as empty-content,
because `askShaped`/`contentTextOf` already spare it) but "present" everywhere else (routes to the
ask channel, keys the dedup, becomes the rendered question).

## Why durable

This is a live, documented inconsistency, not a false alarm — three different auditor lenses (two
`simplicity`, one earlier round) flagged it independently. Task 2.1's own plan slice explicitly
reserves the ask channel for a **later phase**: "this task touches neither `parkAsk` nor the asks
projection." The plan's Method names Phase 3 as "ask records" — so this is inherited debt for
that phase's implementer, not a defect to fix now.

## How to apply

Before touching `parkAsk`, `askContentKey`, or `intakeFloor`'s ask arm: decide whether all four
sites should share one `blankText`-based spelling of "does this ask carry a question," and if so
change all of them together in one commit (a partial migration would make the inconsistency worse,
not better, by adding a fourth spelling).

## Related

[[intake-normalization-notes-push-bypasses-demote-no-dedup]] — a sibling documented residual from
the same task.

[[auditor-supplied-provenance-keys-trusted-verbatim-in-followup-collapse-and-ask-parking]] — a
second, independent ask-channel gap (finding-level `task`/`seat`/`sha` still auditor-supplied at
non-gate-audit `parkAsk` call sites) also explicitly deferred to Phase 3.
