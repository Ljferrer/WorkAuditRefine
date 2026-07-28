---
name: cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape
description: "RESOLVED (war-memory-cli-correctness/1.1, #1145): cmdQuery's --top-k/--budget now carry the same three-way typeof-gated resolution #1059 ratified for tighten-plan's --target, closing the truthy-ternary shape (argv['top-k'] ? Number(...) : DEFAULT) this lesson flagged as deliberately left open; a bare/NaN --top-k no longer silently empties the seat memory-prefetch block, it refuses loud instead"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cmdquery-topk-budget-share-tighten-targets-pre-fix-truthy-ternary-shape
  phase: "memory-tooling-hardening/phase-1 task 1.1 (audit finding, landed dev/2026-07-24-memory-tooling-hardening 2026-07-26)"
  keywords: 
    - cmdQuery
    - "--top-k"
    - "--budget"
    - DEFAULT_TOP_K
    - DEFAULT_BUDGET
    - truthy ternary
    - Number(true)
    - selectForBudget
    - empty prompt block
    - seat prefetch
    - war-memory.mjs
    - sibling flag audit
    - same coercion bug shape
  tags: 
    - war-memory
    - cli-flags
    - argv-parsing
    - follow-up
  created: 2026-07-26
  modified: 2026-07-27T03:52:46.006Z
  originSessionId: 8e038db9-6931-4633-b7d8-6d7977473ca5
---

# `cmdQuery`'s `--top-k`/`--budget` share `--target`'s pre-fix truthy-ternary coercion shape — deliberately left open

**What (code-verified — found at `skills/_shared/war-memory.mjs`, `cmdQuery`, lines 703-704; verify
still present before acting):**

```js
const topK = argv['top-k'] ? Number(argv['top-k']) : DEFAULT_TOP_K;
const budget = argv.budget ? Number(argv.budget) : DEFAULT_BUDGET;
```

This is exactly the shape [[tighten-target-flag-has-three-independent-silent-degradation-paths]]
closed for `--target` in the same phase (task 1.1, #1059): a bare `--top-k` (no value) makes
`parseArgv` hand back boolean `true`, so `Number(true) === 1` silently selects **one** lesson instead
of refusing or falling back to the real default; `--top-k abc` gives `NaN`, and `selectForBudget`
(`skills/_shared/war-memory.mjs` line 320, `records.slice(0, topK)`) turns a `NaN` slice bound into an
**empty** array — a silently-empty seat memory-prefetch block, not a visible error.

**Why left open (not a defect, a scoping decision):** the plan's Method for #1059 explicitly says
"bind each fix at its own boundary, never a shared one" — the guard was scoped to `cmdTightenPlan`
only. `cmdQuery` is a different verb, on a different call path (the Lead's per-seat prefetch, not an
operator-typed CLI invocation), so extending the fix here is a separate behavior change needing its
own regression cases, not a mechanical copy of the tighten-plan guard.

**Failure-direction difference from `--target`:** `--target`'s bare-flag failure mode was "select
*everything*" (fail loud-ish, over-triggers). `--top-k`/`--budget`'s bare-flag failure mode is
"select *nothing*" (fail silent, under-triggers) — worse, because a seat that gets zero prefetched
lessons has no signal that anything went wrong; it just runs without the context.

**How to apply:** when closing a silent-coercion-bug CLI flag, grep sibling flags on the *same file*
for the identical `arg ? Number(arg) : DEFAULT` (or `arg ? arg : DEFAULT`) shape before calling the
class of bug closed — a scoped single-boundary fix (correctly) leaves siblings open, and that's worth
recording explicitly as a follow-up rather than letting an End state that says "silent-degradation
closed" get misread as covering every flag in the file. If ever closed, mirror `cmdTightenPlan`'s
three-way `typeof argv[x] === 'string'` resolution (undefined → default; string + `Number.isFinite &&
> 0` → value; else stderr diagnostic + exit 1) at `cmdQuery`'s own boundary.

Related: [[tighten-target-flag-has-three-independent-silent-degradation-paths]] (the sibling fix this
gotcha was found alongside, in the same audit pass).

## RESOLVED (war-memory-cli-correctness/1.1, #1145)

`cmdQuery` now carries the same three-way `typeof`-gated resolution ratified for
`cmdTightenPlan`'s `--target` — a shape copy at `cmdQuery`'s own boundary, not a shared helper
(`parseArgv` stays frozen): flag absent → the unchanged default; `typeof === 'string'` and
`Number.isFinite(t) && t > 0` → the value binds; anything else (bare flag, non-numeric, zero,
negative) → `war-memory query: --top-k requires a positive count (got '<token>')` (resp.
`--budget requires a positive byte count`) on stderr, exit 1 — placed above the `walkCorpus` call,
so a refusal appends no query-log line and prints no block. This closes exactly the gap this
lesson flagged: a bare `--top-k` no longer takes `Number(true) === 1` into a one-lesson block, and
a `NaN` `--top-k`/`--budget` no longer reaches `selectForBudget`'s `slice` to silently empty it.

Covered by the `refusal (#1145): --<flag> <label> → exit 1, empty stdout, stderr names the flag +
the token` parameterized test cases in `war-memory.test.mjs` (eight cases — bare, non-numeric,
zero, negative, crossed with `--top-k`/`--budget`) plus the no-query-log-on-refusal assertion and
the unchanged-path cases built from the imported `DEFAULT_TOP_K`/`DEFAULT_BUDGET` constants.

Related: [[tighten-target-flag-has-three-independent-silent-degradation-paths]] — its own
"Extended to siblings" paragraph now records this fix in past tense.
