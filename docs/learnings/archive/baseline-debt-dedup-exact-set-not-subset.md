---
name: baseline-debt-dedup-exact-set-not-subset
description: "SUPERSEDED (#798, 2026-07-12): recordBaselineDebt now dedups by subset-containment, not exact id-set"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: baseline-debt-dedup-exact-set-not-subset
  phase: "target-repo-agnostic-execution/p3t1 (superseded audit-gate-evidence-fidelity/1.1, 2026-07-12)"
  date: 2026-07-07
  updated: 2026-07-12
  keywords: 
    - recordBaselineDebt
    - baselineDebtClause
    - gate_failure_class baseline
    - backstops source auto
    - dedup key subset containment
    - covered subset language
    - gate_failing_ids
    - empty-set carve-out
    - "#798"
  tags: 
    - gate-failure-classification
    - backstops
    - dedup
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# `recordBaselineDebt` dedup — SUPERSEDED: now subset-containment, not exact-set (#798, 2026-07-12)

**Recurrence-on-a-repo-lesson note:** the covering fact lives at
`docs/learnings/baseline-debt-dedup-exact-set-not-subset.md` (repo root, not servitor-editable).
This is the local, same-slug recurrence-update copy (D1); a future Gate-2 promotion should
overwrite the repo file with this content.

**What changed (code-verified via the phase's own task worktree** — this servitor's own cwd was a
stale, unrelated checkout, see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]];
confirmed instead at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`,
the true landed task worktree reached via `.git/worktrees/<task-id>/gitdir`):

The **original fact below (now stale) is exactly the "future change" this lesson predicted** —
`recordBaselineDebt` dedup moved from exact-id-set equality to **subset-containment**, aligning the
dedup key with `baselineDebtClause()`'s "covered" prose:

```
const recordBaselineDebt = (ids, baseSha) => {
  const idset = debtIds(ids), base = String(baseSha || '')
  const key = JSON.stringify([[...idset].sort(), base])
  const covered = idset.length
    ? baselineDebt.some(d => d.baseSha === base && idset.every(id => d.ids.includes(id)))   // subset of an existing entry at the same base
    : baselineDebt.some(d => d.key === key)                                                 // empty: exact-empty-vs-empty only
  if (covered) return
  ...
}
```

- A **non-empty** id-set that is a subset (⊆) of an existing entry's ids at the **same base sha**
  is now COVERED — no new entry recorded (a strict superset still records normally).
- An **empty** id-set (absent/empty `gate_failing_ids`) keeps the OLD exact-empty-vs-empty dedup —
  a deliberate carve-out, because `[]` is a subset of every set, and naive containment would
  silently stop recording the `'(see gate_output)'` entry whenever *any* entry already existed at
  that base (a behavior change never ratified).
- The pre-existing exact-set test (`#598 validation 5+6`) still passes under subset-containment
  (an exact-set match is trivially also a subset match).

**Why this superseded fact matters:** the original lesson (below) explicitly flagged this exact
scenario — "if a future change loosens `recordBaselineDebt`'s dedup key toward subset-match... the
id-set comparator and the existing exact-set test coverage must move together." That prediction
held: the comparator changed AND a new dedicated test (superset-then-subset / non-subset /
empty-set-carve-out cases) shipped in the same commit.

**Known doc-cascade residual (Nit, non-blocking, not fixed this phase):** `skills/war/references/schemas.md`'s
"backstops" paragraph still reads "exactly one deduped entry per unique (identifier-set, base sha)
key" — under subset-containment a subset id-set is a *distinct* key that now yields **zero** new
entries, so the phrase over-describes the relation (a subset-match never even reaches "per unique
key"). Out of this task's plan-scoped Files list; the core one-entry-one-backstop invariant is
unaffected. Flag for a future doc-sweep: reword to "at most one deduped entry; a non-empty id-set
that is a subset of an existing entry at the same base sha is covered (no new entry), an empty
id-set dedups exact-empty-vs-empty only."

---

## Original fact (2026-07-07, now superseded — kept for history)

`recordBaselineDebt(ids, baseSha)` dedups new `source:'auto'` backstop entries on
`JSON.stringify([sortedIds, baseSha])` — **exact-set** equality. `baselineDebtClause()`, threaded
into every *subsequent sibling task's* merge/land dispatch, tells the refiner a failure whose ids
are already **covered** by recorded debt (subset language) can be proceeded over without a fresh
base re-run. Those two contracts previously operated at different granularities: a later task's
own (smaller) id set reported back through `recordBaselineDebt` would mint a second, near-duplicate
entry rather than recognizing the subset relationship. **This granularity gap is now closed (see
above).**

**How to apply (still valid):** when auditing or extending baseline-debt code, check both the dedup
key (`recordBaselineDebt`) and the reuse-clause wording (`baselineDebtClause`) for granularity
agreement — as of #798 they now agree (subset-containment on both sides, with the empty-set
carve-out as the one deliberate asymmetry).

> archived 2026-07-15: resolved — moved to archive
