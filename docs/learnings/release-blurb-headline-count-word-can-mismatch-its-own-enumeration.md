---
name: release-blurb-headline-count-word-can-mismatch-its-own-enumeration
description: "A release blurb's opening count word ('a truth sweep across eight drifts') can outrun the count of items its own following sentences actually enumerate — one landed drift can have no describing sentence at all"
metadata: 
  node_type: memory
  type: project
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
  tags: 
    - release
    - prose-precision
    - audit-finding
    - readme-status
  created: 2026-07-25
  modified: 2026-07-25T07:06:20.997Z
  originSessionId: 4eee3466-8bcc-44f9-a6c2-754d46624537
---

# A release blurb's headline count can outrun what it actually enumerates

**Context (gate-audit-sourced, `phase-2-end-state` pass, task 2.1, plan
`2026-07-24-runbook-and-standing-record-coherence`, landed tip
`3444016a48a3d97b5beb21fc9700bd7fa788272d`):** the `## Status` blurb (`README.md` line 340 —
`code-verified`, read at the `_refinery` worktree whose gitdir physical path contains this plan's
slug, `.claude/worktrees/2026-07-24-runbook-and-standing-record-coherence-2026-07-24/_refinery/`,
this servitor's own cwd being a stale sibling worktree per
[[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]) opens "a prose, contract, and
guard-text truth sweep across **eight** drifts," then narrates seven: ledger `adjudications` key,
the two-path `held:land-failed` bullet, the relaunch Adjudication-continuity duty, the run-manifest
envelope trio, the doctrine-anchor restore + drift-locks, the auditor deny-text correction, and the
T2.9 census wording carry-over. The eighth landed drift — a roadmap `Files` cell + `CONTEXT.md`
contention-row correction (commit `3fae45b`, both referents confirmed still present at the landed
tip: `docs/roadmaps/2026-07-22-run-resilience-and-hardening-roadmap.md` and `CONTEXT.md`'s
contention row) — has no describing sentence anywhere in the blurb, so a reader counting sentences
against the headline comes up one short with no way to reconcile it.

**Why this is a Nit, not a defect:** the plan's End state named exactly six describable items and
all six are present in the blurb; the omitted eighth item is internal campaign bookkeeping on a
non-plugin-shipped doc (a roadmap file + a glossary contention row), not a plugin-shipped surface
the End state required narrating. Non-blocking, `disposition: note`, and not absorbable — the
`## Status` line is a release slot outside this fix-round's scope to touch incidentally.

**The pattern:** a release blurb's opening headline count is easy to set once (or copy from an
adjudication/plan artifact that tracked N items) and then drift silently as the blurb is drafted
sentence-by-sentence — an item can be dropped from the prose (judged low-value to narrate, or
simply missed) without anyone remembering to decrement the headline number. This is the release-note
sibling of [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (a structural-test
banner's stale count, held byte-unchanged deliberately across plans) — same shape, opposite
mechanism: there the count is frozen by a plan mandate and correctly stale; here the count and the
enumeration are both freshly authored in the same release commit and simply fell out of sync with
each other, because nothing checks a blurb's headline number against its own sentence count.

**How to apply:** when drafting or reviewing a release blurb that opens with "a sweep across N
things" (or any headline count), count the sentences/clauses that actually follow before landing —
if an item is deliberately left undescribed (e.g. because it's internal bookkeeping, not a
user-facing surface), either decrement the headline or add one clause naming it, rather than leaving
the two to silently disagree. This has no automated guard (`version-slots.test.mjs` and the doc-
contract locks check other properties of this section, not headline-vs-enumeration arithmetic), so
it is only ever caught by a careful audit read.

Related: [[plan-mandated-banner-count-can-undercount-additive-drift-pins]] (sibling family: a count
word in a doc surface can legitimately or accidentally drift from what it counts — the discriminator
is whether a plan mandate freezes the number deliberately). [[release-blurb-overstates-guard-semantics]]
(same release-blurb-prose-precision family, different specific overclaim shape — guard-behavior
scope rather than headline arithmetic). [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]
(how the eighth drift's referents were confirmed against the actual landed tip rather than a stale
cwd).
