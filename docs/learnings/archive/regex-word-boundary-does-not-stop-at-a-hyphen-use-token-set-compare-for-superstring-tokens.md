---
name: regex-word-boundary-does-not-stop-at-a-hyphen-use-token-set-compare-for-superstring-tokens
description: "`\b` is not a hyphen boundary — `/\bCLEARED\b/` matches inside `CLEARED-WITH-NOTES` because `-` is a non-word character, so a presence/containment check for a short enum token that is also a prefix of a longer hyphenated sibling needs a delimiter-split token-set compare (or a hyphen-aware lookaround), not `\b`"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: regex-word-boundary-does-not-stop-at-a-hyphen-use-token-set-compare-for-superstring-tokens
  phase: "2026-08-02-redteam-doctrine-and-guards/phase-2 task 2.1 (End state 9, red-team adjudication 12)"
  created: 2026-08-02
  tags: 
    - regex
    - word-boundary
    - drift-guard
    - structural-test
    - default-deny
  keywords: 
    - word boundary hyphen
    - \b regex trap
    - CLEARED vs CLEARED-WITH-NOTES
    - token-set compare
    - hyphen-aware lookaround
    - negative lookahead lookbehind
    - default-deny exact set
    - superstring token containment
    - mutation proof
    - verdict enumeration guard
  originSessionId: 4095ea62-efc7-4ed1-8045-8de0cd2f76bb
  modified: 2026-08-03T09:23:38.824Z
---

# `\b` does not stop at a hyphen — a short enum token inside a longer hyphenated sibling still matches

**The trap:** `-` is a non-word character in JS/POSIX regex, so a word-boundary check like
`/\bCLEARED\b/` is satisfied by `CLEARED-WITH-NOTES` — the `\b` fires at the `D`/`-` transition
just as validly as at a space or string edge. A guard built to confirm a documentation surface
lists the standalone verdict `CLEARED` will pass even when `CLEARED` never appears standalone,
only as the head of `CLEARED-WITH-NOTES` — and a mutation test that only deletes the standalone
line (leaving `CLEARED-WITH-NOTES` in place) stays green under `\b`, giving false confidence in a
guard that cannot actually discriminate the two.

**Where this was caught and fixed:** `skills/red-team/assets/workflow-scaffold.test.mjs`'s
verdict-enumeration drift guard (End state 9) — first drafted with a `\b`-based check, corrected on
a red-team re-verify round (adjudication 12, 2026-08-02) after the hyphen hole was demonstrated.
Verify still present before acting: the landed guard instead does a **delimiter-split token-set
compare** — split each documentation surface's verdict-list line into tokens on its own delimiter
(comma / pipe) and assert `assert.deepEqual` set-equality against the exact literal set extracted
from the `verdict()` function body — so `CLEARED-WITH-NOTES` and `CLEARED` are distinct tokens by
construction, never a substring relationship. A hyphen-aware lookaround
(`(?<![A-Z-])CLEARED(?![A-Z-])`) was verified as an equally-correct alternative (reds on the
mutated line, passes on the correct one) if a full split isn't practical.

**How to apply:** whenever a structural/drift guard needs to confirm a short token is present
**standalone** (not merely as a substring of the token that appears in the actual text), first ask
whether any sibling token in the same domain is `<token>` plus a hyphenated/underscored/dotted
suffix. If so, `\b` is not sufficient — use an exact delimiter-split token-set compare (preferred:
it also gives you a natural default-deny non-empty-floor assertion for free) or a lookaround that
explicitly excludes the punctuation character your domain uses as a compound-word joiner.

Related: [[structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census]]
(the general default-deny-exact-multiset technique this guard also had to apply — a bare presence
loop over the extracted verdict set was independently defeated two ways: a behavior-preserving
refactor emptied the function-scoped slice, and a plain containment check let
`CLEARED-WITH-NOTES` satisfy a standalone-`CLEARED` presence check — this file's hyphen trap is the
second of those two defeats, in isolation). [[weak-test-assertion-passes-without-feature-being-exercised]].

> archived 2026-08-15: resolved — moved to archive
