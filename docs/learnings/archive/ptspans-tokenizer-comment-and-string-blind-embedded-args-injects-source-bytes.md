---
name: ptspans-tokenizer-comment-and-string-blind-embedded-args-injects-source-bytes
description: "A raw-source tokenizer's header claim that comments or strings are \"excluded by construction\" is testable: verify it skips //, /* */, string and regex context. FIXED: assert-args-complete.mjs's ptSpans was comment- and string-blind until ptSpanRanges learned to skip them"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - ptSpans
    - assert-args-complete
    - comment-blind tokenizer
    - string-literal-blind scanner
    - EMBEDDED_ARGS
    - stage-workflow
    - source-scanning floor
    - excluded by construction
    - false header claim
    - bogus interpolation span
  provenance: code-verified
  slug: ptspans-tokenizer-comment-and-string-blind-embedded-args-injects-source-bytes
  phase: 2026-08-25-engine-reliability-and-filing-fidelity/3.2
  tags: 
    - war
    - engine
    - args-preflight
    - tokenizer
    - entry-validation
  created: 2026-08-26
  originSessionId: 46a4dbcd-fa2b-416c-87f8-931f5c3c90b5
  modified: 2026-11-09T00:12:56.692Z
---

# A raw-source tokenizer's "excluded by construction" comment claim can be merely incidental

**Rule:** when writing or reviewing a raw-source-scanning floor, a header comment asserting a class of
text is "excluded by construction" is a testable claim, not free. Verify the tokenizer actually
special-cases `//`, `/* */`, quoted-string and regex-literal context before trusting it, or downgrade
the claim to "excluded today, incidentally" in the doc. The in-repo precedent that already does this
correctly is `extractTopLevelTemplateLiterals` in `skills/war/assets/prompt-surface-budgets.test.mjs`
— port its comment/string-skipping loop rather than re-deriving one.

**Instance:** `ptSpans` (the `assert-args-complete.mjs` launch-args preflight's span extractor) opened
a span on any `` /\bpt`/g `` byte-run in the raw template source and tracked only backtick / `${` /
`{` / `}` nesting — no comment or string-literal context. The module header nonetheless claimed:
*"Only pt-tagged template literals are scanned … Comments, error messages, and derivation helpers are
not prompt bytes and are excluded by construction."* Those regions were excluded only
**incidentally**, because they happened not to contain a `` pt` `` byte-run.

**Related:** [[template-defers-runtime-values-to-agent-via-literal-placeholder]] (a sibling
`workflow-template.js` scanning-surface gotcha).

> archived 2026-09-03: resolved — moved to archive

> FIXED at phase 1 of `2026-11-08-args-floor-and-launch-preflight`: `ptSpanRanges` in
> `skills/war/assets/assert-args-complete.mjs` now skips strings, comments and regex literals, and
> an `EMBEDDED_ARGS` prose fixture pins the field set (End states 5 and 6). Verify still present
> before acting.
>
> Pre-fix exposure: `stage-workflow.mjs`'s `EMBEDDED_ARGS` prelude (`JSON.stringify`, which escapes
> no backticks) let threaded prose naming `` `pt` `` open a bogus span under the `--template` re-check
> arm, usually a false `exit 1` block, with a rare fail-open corner.
