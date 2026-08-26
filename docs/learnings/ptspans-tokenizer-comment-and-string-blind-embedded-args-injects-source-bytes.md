---
name: ptspans-tokenizer-comment-and-string-blind-embedded-args-injects-source-bytes
description: "assert-args-complete.mjs's ptSpans tokenizer opens a span on any /\\bpt`/g byte-run with no comment or string-literal skipping, so its header claim \"Comments, error messages, and derivation helpers are ... excluded by construction\" is false (exclusion is incidental); under --template re-check of a staged copy, stage-workflow.mjs's EMBEDDED_ARGS prelude (JSON.stringify(args), which never escapes backticks) feeds Lead-assembled prose to the same scanner, so args prose containing a pt-backtick byte-run opens a bogus span"
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
  modified: 2026-08-26T13:46:13.065Z
---

# A raw-source tokenizer's "excluded by construction" comment claim can be merely incidental

**Code-verified at the landed tip** (`73120000ff9fb694292b1b892a56c507a9308d7b` on
`dev/2026-08-25-engine-reliability-and-filing-fidelity`, read via the still-live `p3-polish` task
worktree whose branch tip `24480ebc54a41a7ba6f601ce46cf7833fe72f835` sits directly on that history —
`skills/war/assets/assert-args-complete.mjs`). `ptSpans` (the `assert-args-complete.mjs` launch-args
preflight's span extractor) opens a span on any `` /\bpt`/g `` byte-run in the raw template source and
tracks only backtick / `${` / `{` / `}` nesting — it models **no comment or string-literal context**.
The module header nonetheless claims: *"Only pt-tagged template literals are scanned … Comments,
error messages, and derivation helpers are not prompt bytes and are excluded by construction."* That
claim is false as stated: those regions are excluded only **incidentally**, because they happen not to
contain a `` pt` `` byte-run today — not because the tokenizer skips them.

**Concrete exposure:** `skills/war/assets/stage-workflow.mjs` (`insertArgsPrelude`) injects
`const EMBEDDED_ARGS = ${JSON.stringify(embedded)}` into a `--args`-staged copy of the template.
`JSON.stringify` escapes neither backticks nor `$`. SKILL.md documents re-running the preflight
against that staged copy via `--template <the stager's printed staged path>` for injected-stage runs.
Threaded prose (Commander's Intent, verbatim plan slices, prefetched memory blocks) in this repo
routinely contains the literal sequence `` `pt` `` (naming the tag itself), which satisfies `` \bpt` ``
and opens a **bogus span inside a string literal**. The flat `${…}` re-scan over that bogus span can
then harvest prose interpolations as if they were real prompt sites. Effect is usually fail-**closed**
(a spurious required field ⇒ a false `exit 1` block on a complete launch) but has a fail-**open**
corner if the bogus span's terminating backtick is the one that opens a real `pt` site (skipped via
`re.lastIndex = i`). The shipped-template default path is unaffected (its own default-deny census
pins the extracted set clean); this is a latent defect on the `--args`/`--template` re-check arm, not
a live break, filed `disposition: follow-up` and unfixed at land.

**Pattern to remember when writing or reviewing a raw-source-scanning floor:** a comment in the header
asserting a class of text is "excluded by construction" is a testable claim, not free — verify the
tokenizer actually special-cases `//`, `/* */`, and quoted-string context before trusting it, or
downgrade the claim to "excluded today, incidentally" in the doc. The in-repo precedent that already
does this correctly is `extractTopLevelTemplateLiterals` in
`skills/war/assets/prompt-surface-budgets.test.mjs` — port its comment/string-skipping loop rather
than re-deriving one.

**Related:** [[template-defers-runtime-values-to-agent-via-literal-placeholder]] (a sibling
`workflow-template.js` scanning-surface gotcha).
