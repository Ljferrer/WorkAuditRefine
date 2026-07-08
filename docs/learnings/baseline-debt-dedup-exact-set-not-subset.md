---
name: baseline-debt-dedup-exact-set-not-subset
description: "recordBaselineDebt dedups on exact id-set+baseSha; prompt says 'covered' (subset)"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: baseline-debt-dedup-exact-set-not-subset
  phase: target-repo-agnostic-execution/p3t1
  date: 2026-07-07
  keywords:
    - recordBaselineDebt
    - baselineDebtClause
    - gate_failure_class baseline
    - backstops source auto
    - dedup key exact set
    - covered subset language
    - gate_failing_ids
  tags:
    - gate-failure-classification
    - backstops
    - dedup
  originSessionId: null
---

# `recordBaselineDebt` dedups on exact id-set equality; the prompt clause promises subset "covered"

**The mechanism** (`skills/war/assets/workflow-template.js`): `recordBaselineDebt(ids, baseSha)`
(defined ~L379) dedups new `source:'auto'` backstop entries on
`JSON.stringify([sortedIds, baseSha])` — **exact-set** equality. `baselineDebtClause()` (~L394),
threaded into every *subsequent sibling task's* merge/land dispatch, tells the refiner a failure
whose ids are already **covered** by recorded debt (subset language) can be proceeded over without
a fresh base re-run.

**The nuance:** those two contracts operate at different granularities. If a later task's own
`gate_failing_ids` is a strict *subset* of an already-recorded id-set (same base sha), the reuse
clause's "covered" language says proceed without re-recording — but if that refiner instead reports
its own (smaller) id set back through `recordBaselineDebt`, the exact-set dedup key treats it as a
**new** key and mints a **second, near-duplicate** `source:'auto'` entry rather than recognizing the
subset relationship. This is consistent with the plan's stated per-unique-key dedup contract (each
distinct id-set/base-sha pair is its own key) — not a code defect, breaks no consumer (backstops are
just rendered/aggregated) — but it's a granularity gap worth knowing before extending baseline-debt
reuse to subset-match dedup.

**Related, same commit:** `baselineDebtClause()` is **not** appended to the baseline-proceed
re-merge/re-land dispatch (the *same* task's own bounded re-dispatch after being routed
`'baseline'`) — only to *subsequent* merge/land prompts (verified: sibling task's initial merge
threads the prior task's debt). This is by design, not an omission: the baseline-proceed prompt
already names the exact classified ids to proceed over and performs no base re-run, so the clause
(whose only purpose is short-circuiting a repeated base re-run) has nothing to add there. Read the
plan's "every subsequent merge/land prompt" as scoped across tasks, not to a task's own re-dispatch.

**Why this matters:** if a future change loosens `recordBaselineDebt`'s dedup key toward
subset-match (to align with the clause's "covered" language), the id-set comparator and the
existing exact-set test coverage must move together — same class of coupling as
[[pass-probe-demotion-gate-layer-without-probe-contract]].

**How to apply:** when auditing or extending baseline-debt code, check both the dedup key
(`recordBaselineDebt`) and the reuse-clause wording (`baselineDebtClause`) for granularity
agreement — don't assume "covered" in prose implies subset-aware dedup in code.
