---
name: release-blurb-headline-count-word-can-mismatch-its-own-enumeration
description: "A release blurb's headline count can outrun its list. Count items before landing"
metadata: 
  node_type: memory
  type: project
  promoted: dev/2026-07-24-runbook-and-standing-record-coherence@phase-2
  provenance: code-verified
  slug: release-blurb-headline-count-word-can-mismatch-its-own-enumeration
  phase: "runbook-and-standing-record-coherence/phase-2 (Release, task 2.1)"
  keywords: 
    - release blurb count mismatch
    - Status section headline count
    - eight drifts seven described
    - enumeration undercounts headline
    - self-inconsistent prose count
    - README Status line
    - version bump release note
    - campaign carry-over undescribed
    - comment blocks corrected count wrong
    - version slot undercount
    - fixed small countable set
    - bare count no enumeration
    - count word drift
    - cite the record not the count
    - scope adjudication row
  tags: 
    - release
    - prose-precision
    - audit-finding
    - readme-status
  created: 2026-07-25
  modified: 2026-07-28T21:01:27.742Z
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
---

# A release blurb's headline count can outrun what it actually enumerates

**The pattern:** a release blurb's opening headline count is easy to set once (or copy from a plan or
adjudication artifact that tracked N items) and then drift silently as the blurb is drafted sentence by
sentence. An item can drop out of the prose without anyone decrementing the headline. Nothing checks a
blurb's headline number against its own sentence count.

**Instance:** the `runbook-and-standing-record-coherence` Release blurb (task 2.1) opened "a prose,
contract, and guard-text truth sweep across eight drifts" and narrated seven. The eighth, a roadmap
`Files` cell and `CONTEXT.md` contention-row fix, had no sentence. It was a Nit (`disposition: note`):
the End state required only six describable items, and the `## Status` line was then outside the fix
round's scope.

**How to apply:** before landing a blurb that opens with a headline count, count the clauses that follow.
If an item is deliberately left undescribed, decrement the headline or add one clause naming it. This has
no automated guard (`version-slots.test.mjs` and the doc-contract locks check other properties of this
section), so only a careful audit read catches it.

## Sub-shapes of the same rule

- **Count inside one quoted block:** "an identical one-sentence skeleton" that is really two
  sentences (plan `2026-07-28-audit-evidence-precedence`, Release task 2.1). Count the sentences in the
  actual string.
- **Mid-sentence tally of edits:** "Two `workflow-template.js` comment blocks are corrected" when
  the diff carried a third comment-only hunk. Count the diff hunks the note claims to cover.
- **Fixed small set undercounted:** "Slots: `plugin.json`, `marketplace.json`." named 2 of the 4
  canonical version slots, and "one pointer each" missed that one card carried two. A small,
  exactly countable set is as easy to undercount as an open list.
- **True count with no enumeration:** "names the two dispatch shapes" and "four new" lessons, with
  none of them named. No reader can check a bare count. Enumerate the items or drop the count word.
  A lesson count rots fastest, because the servitor and Gate 2 add lessons after the blurb is
  drafted.

Recurrences: 1 labeled (the one-sentence skeleton) plus the other sub-shapes above.

## Generalization: cite the record, do not restate its count

Any hand-typed count that restates a list recorded elsewhere (an adjudication row, a plan
skeleton, a table) should cite that record by name or section, not restate the number. The count
drifts the moment the list changes and the summary does not. Instance: a scope adjudication row
said "28 seed slugs" while the plan's own Skeleton record enumerated 29, and audit seats re-flagged
the drift as a Nit every round.

Related: [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (sibling: a structural-test
banner count frozen by a plan mandate, deliberately stale; here the count and enumeration were authored
together and fell out of sync). [[release-blurb-overstates-guard-semantics]] (same prose-precision family,
guard-scope overclaim). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (verify referents
at the landed tip, not a stale cwd).
