---
name: regex-slice-disambiguation-relies-on-match-order-not-anchoring
description: "[RESOLVED #326] Regex slices of source in tests must anchor on unique tokens, never on match order or the first terminal"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: regex-slice-disambiguation-relies-on-match-order-not-anchoring
  phase: no-test-routing-enum-gate-evidence/p1-t1; resolved #326/t6
  tags:
    - test-fragility
    - regex
    - audit-nit
    - workflow-template
    - resolved
  relates:
    - "[[regex-slice-disambiguation-relies-on-match-order-not-anchoring]]"
    - "[[weak-test-assertion-passes-without-feature-being-exercised]]"
  keywords:
    - regex slice
    - match order
    - unique anchor
    - lazy quantifier
    - greedy quantifier
    - terminal token
    - eval extraction
    - new Function
    - blockedReason
  created: 2026-06-30
  updated: 2026-07-01
  originSessionId: fa4a98d9-e917-4fc2-8838-f98e4a473a1a
---

# [RESOLVED] Anchor near-duplicate text slices on unique leading phrases, not match order

**Rule:** when a test slices two near-duplicate text blocks out of one shared source string, anchor EACH regex on a phrase unique to its block. Relying on `.match()` first-occurrence order plus delimiter bounding is correct at HEAD but silently cross-matches after a source reorder or a stray delimiter — no failure, just a wrong match.

Fixed/landed in the `'#237 — both merge-task dispatch prompts split exit-1 (no-test) from exit-2 (error)'` test in `skills/war/assets/workflow-template.test.mjs` (#326/t6, later evolved further): both prompt slices now carry disjoint anchors (`to verify the task diff contains` vs `now contains`), and the test's own comment cites this slug.

**Why:** shared-substring regexes only stay distinct while source order holds; a reorder makes both regexes hit the same clause and the test stays green.

**How to apply:** give each slice a unique leading-phrase anchor; if order-reliance is deliberately kept, assert the two matches occupy distinct index ranges so a reorder fails loudly. Locate the test by construct name, not line number ([[plan-line-number-refs-stale-use-construct-locator]]).

**Same rule for eval-extraction:** before regex-extracting a multi-line source expression for eval/`new Function`, count every occurrence of the terminal token (`null)`, `}`, `;`) inside the body. Lazy `[\s\S]+?` undershoots to the FIRST occurrence; greedy `[\s\S]+` overshoots to the LAST. Anchor on a token unique to the terminal line, or import the symbol directly and skip extraction. Worst case, a shorter-but-valid expression evals green while omitting branches. Fixed instance: the `blockedReason` extraction in `skills/war/assets/workflow-template.test.mjs` anchors on the unique trailing `:\s*null\)` (#266).

Sibling failure mode: [[regex-slice-disambiguation-relies-on-match-order-not-anchoring]] (lazy quantifier stops at first terminal token — same "correct today, silently wrong after an unrelated edit" family). Related: [[weak-test-assertion-passes-without-feature-being-exercised]].

> archived 2026-07-04: resolved — moved to archive
