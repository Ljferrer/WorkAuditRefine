---
name: misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep
description: "A banned two-token pairing wrapping across a comment line break defeats a single-line repo-wide grep on exactly the defect it polices"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep
  phase: gate-evidence-and-prose-truth/phase-2 (2026-07-15, red-team adjudication 2026-07-15)
  keywords:
    - OLD-absent correction
    - both-surfaces rule
    - line-based grep
    - multiline comment
    - vacuous negative assertion
    - repo-wide sweep
    - construct-anchored extraction
    - D14 guard
    - reword-tolerant negative arm
    - grep -n limitation
  tags:
    - verification-design
    - grep-pitfall
    - doc-contract-guard
    - red-team
    - plan-fidelity
  created: 2026-07-15
  relates:
    - "[[plan-survey-token-sweep-misses-untagged-siblings]]"
    - "[[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]]"
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# A repo-wide OLD-absent grep is vacuous when the banned pairing wraps across a comment's line break

**What happened (code-verified):** phase "gate-evidence-and-prose-truth" End state 10 required
correcting a misattribution — `classOf` in `skills/war/assets/workflow-template.js` was wrongly
described as *performing* the classification-base gate re-run, when the refiner performs the
re-run and `classOf` merely reads the resulting `gate_failure_class`. The correction needed to be
"OLD-absent on every surface carrying the old value, not merely NEW-present in the new bullet" (the
plan's rule 6, /war-strategy §3). A repo-scoped OLD-absent grep across the whole tree was proposed
as the closure mechanism and **rejected by red-team adjudication (2026-07-15)** for a concrete,
verified reason: the D14 block comment in `skills/war/assets/skill-doc-contracts.test.mjs` wrapped
the exact banned pairing across two source lines —

```
// ...the gate-time `gate_failure_class` classifier (`classOf`) keys on
// re-running the failing gate at the classification base and comparing failing identifiers...
```

`classOf` ends one line; `re-running` opens the next. A `grep -n` (or any single-line-match) sweep
for a pattern that requires both tokens on one line reports **no match** here even while the
misattribution stands verbatim in the file — the grep is vacuous on the very surface it was
invented to catch. Confirmed both directions: the pre-fix comment (this exact two-line wrap) and
the post-fix comment (rewritten as one continuous non-wrapping sentence attributing the re-run to
the refiner and casting `classOf` as a reader) were both directly read at
`skills/war/assets/skill-doc-contracts.test.mjs`'s D14 test block (verify still present before
acting — locate by the `D14 —` test title).

**Why durable:** this is not specific to this one misattribution. Any "assert the banned clause is
gone everywhere" sweep that relies on a single-line-anchored grep across free-form prose/comments
will silently pass over an instance that a human editor (or a prior worker) happened to wrap across
a line break — which is common in commented source, since comment lines wrap at ~100 columns.
Trusting the grep's zero-match result as proof of absence is a false negative, not a clean bill of
health.

**How to apply:**
- When designing an OLD-absent completeness check across many surfaces (docs, comments, prompts),
  do not rely on one repo-wide single-line grep as the *sole* proof of closure for a claim that
  could plausibly wrap across lines in prose. Either (a) extract the containing construct first
  (function/bullet/comment block, by an anchor marker) and regex over the **extracted, joined**
  text — the repo's own D-series guards already do this (locate-by-marker, then regex the slice) —
  or (b) enumerate every carrying surface explicitly and close each one by its own in-place
  reword/assertion, never by one blanket grep.
- Prefer the **bullet-/block-scoped negative arm** pattern already used by D14 (extract the
  `**Daemon reachable**` bullet, then assert no phrasing inside it casts `classOf` as the re-run's
  agent) over a repo grep — it is immune to the line-wrap trap because the extraction step already
  joins the block into one string before the regex runs.
- If a repo-wide grep is still wanted as a completeness *floor* (not the sole gate), pair it with a
  mandatory manual same-scope survey of each enumerated surface, exactly as this plan's `Survey:`
  block convention requires elsewhere — never let the grep's silence alone certify a multi-surface
  correction.

## Related

[[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]] — a different comment-text
fidelity gotcha in the same family (comment prose vs. real behavior).
[[plan-survey-token-sweep-misses-untagged-siblings]] — grep-as-floor-not-ceiling, the general
sibling principle this instance sharpens with a concrete line-wrap mechanism.
