---
name: structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census
description: "Two reusable techniques for hardening text-based structural tests against a source-text blind spot: keep one explicitly-unwired negative-reference helper for both-ways regression proof when narrowing a naive idiom, and close a residual gap with a default-deny exact-multiset census pinned to a structural invariant"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census
  phase: structural-test-integrity/1.1-1.3
  keywords: 
    - structural test blind spot
    - comment strip narrowing
    - negative reference helper
    - naiveTwoStepStrip
    - blockCommentSpans
    - scanTemplateLiterals
    - default-deny census
    - exact multiset equality
    - LITERAL_REGISTRY
    - both-ways probe
  tags: 
    - testing
    - structural-test
    - pattern
    - hardening
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
---

# Hardening a text-based structural test against a source-text blind spot

## Context

`skills/war/assets/workflow-template.test.mjs` asserts on the SOURCE TEXT of
`workflow-template.js`. Two prior idioms were blind to string/template literals that merely
*look like* syntax: a naive two-step comment strip mis-read `/* */` sequences inside glob
literals as real comment delimiters (#929), and a `pt`-tag undefined-interpolation guard only
caught a bare untagged backtick immediately after `agent(`, missing ~129 untagged literals
(#931). Verified present at structural-test-integrity/1.1-1.3 (functions confirmed in the
landed tree: `blockCommentSpans`, `naiveTwoStepStrip`, `scanTemplateLiterals`, `LITERAL_REGISTRY`
in `skills/war/assets/workflow-template.test.mjs`).

## Technique 1 — narrow the real sites, keep ONE isolated negative reference

When narrowing a naive strip idiom (here: a two-step `.replace(//.../g,'').replace(/\/\*[\s\S]*?\*\//g,'')`
comment strip) to a safer line-only form at the real assertion sites, do not delete the naive
form outright. Retain it as exactly one explicitly-unwired helper (`naiveTwoStepStrip`, carrying
a comment stating it is never used by a real structural assert) so the regression probes that
prove the fix — "the narrowed form doesn't lose the token" and "the naive form still would have"
— have a live negative reference to diff against both ways. Deleting the naive form entirely
would remove the ability to regression-prove the fix ever mattered. The enumerating replacement
(`blockCommentSpans`, using `matchAll` to enumerate spans rather than `.replace` to strip them)
is a distinct helper from the retained negative reference — don't conflate "the strip pattern
appears once" with "the strip pattern appears only in the census helper": it legitimately
appears in both the enumerating census and the negative-reference helper, never in a live assert.

## Technique 2 — default-deny exact-multiset census pinned to a structural invariant

To close a residual blind spot where a mechanical guard only catches a bare pattern (not covering
literals reached through variables, helper operands, or nested interiors), build a hand-rolled
string-aware scanner (`scanTemplateLiterals` — recognizes `//`, `/* */`, quoted strings, and
`` ` `` template literals with `${}` interpolation, fail-closed on unclosed constructs) and assert
that its untagged-literal-head multiset is **byte-identical, in both directions**, against a
hand-classified, grouped registry (`LITERAL_REGISTRY`). A new untagged literal (any spawn site)
or a stale registry row (removed/renamed literal) each go red — exact multiset equality is a
default-deny gate, not a subset check. Pin one structural invariant as the coupling proof that
makes the census trustworthy without re-deriving it by hand each time: every TRUE block comment
in the source is backtick-free, so the scanner's own comment/template-literal disambiguation
can't silently misclassify one as the other.

## When this generalizes

Reach for this pair of techniques whenever a source-text structural test's blindness is the risk
(not runtime behavior) — AST tooling is unavailable/out of scope (ADR-level "no AST/npm"
constraint here), and the fix must be provably complete (default-deny) rather than merely
extending the existing allowlist.

## Cross-links

- [[registry-header-rule-can-read-stricter-than-its-own-documented-exception]] — a classification
  nuance inside `LITERAL_REGISTRY` itself, same phase.
