---
name: glob-literal-fools-block-comment-strip-regex-in-structural-tests
description: "A source-string glob literal containing /* and */ mis-reads as block-comment delimiters, corrupting a naive comment-stripping regex used by structural tests"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: glob-literal-fools-block-comment-strip-regex-in-structural-tests
  phase: "Engine-owned gate composition (#894)/1.1"
  keywords: 
    - block comment strip
    - comment stripping regex
    - glob literal
    - node_modules glob
    - structural test
    - resolveGate discovery string
    - false comment delimiter
    - line-only strip
    - regex mis-read
    - test corruption
  tags: 
    - testing
    - regex
    - workflow-template
    - gotcha
  created: 2026-07-15
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# A glob literal's `/*` ... `*/` inside a source string fools a block-comment-strip regex

**What happened (code-verified — found at
`skills/war/assets/workflow-template.test.mjs` lines 269, 872-885, 1101, 5855, landed tip of
`dev/2026-07-14-gate-evidence-and-prose-truth`, phase "Engine-owned gate composition #894",
task 1.1):** several structural tests strip comments out of the template source before
grepping for a target token, using the common two-step idiom:

```js
const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
```

Task 1.1 added an inline `resolveGate` mirror whose discovery-clause string contains glob
literals with `find`-exclusion patterns: `'*/node_modules/*'`, `'*/.git/*'`, `'*/.claude/*'`.
Each of those literals carries a `/*` immediately followed later by a `*/` — exactly the
block-comment delimiter pair the second `.replace` looks for. The regex has no notion of
"inside a string literal" vs "inside a real comment," so it started matching from the `/*` in
`'*/node_modules/*'` through to the next `*/` it could find, silently eating a swath of real
executable code between them — including, in this case, `succeeded.add(...)` calls the
"Task 3 — succeeded set" test asserted on.

**The fix applied here:** that one test (`workflow-template.test.mjs` ~line 872) was narrowed to
line-comment-only stripping (`src.replace(/\/\/[^\n]*/g, '')`, no block-comment pass), with an
inline comment explaining why — the asserted tokens (`const succeeded = new Set()`,
`succeeded.add`, `succeeded.has`) only ever appear in executable code, never inside a real block
comment, so dropping the block-strip pass is safe for that specific assertion set. Three sibling
tests in the same file (lines 269, 1101, 5855) still run the full two-step strip and currently
pass, because their asserted tokens happen to sit outside the corrupted span — but they remain
latently fragile to any *future* string literal near their tokens that introduces the same `/*
... */` shape.

**The generalizable rule:** before trusting (or reusing) a `.replace(/\/\*[\s\S]*?\*\//g, '')`
block-comment strip in a structural test, check whether the file under test contains **any**
string literal (glob patterns, shell snippets, regex source, HTML/CSS embedded in a prompt
string, etc.) carrying a literal `/*` and a later `*/` — the strip is comment-blind and
string-blind alike, and once it over-matches it can delete real code between them, both hiding
a true positive (assertion silently starts failing) and, more dangerously, letting a *should-fail*
test pass if the deleted span happened to contain the negated/absent token check.
- Prefer line-comment-only stripping (`src.replace(/\/\/[^\n]*/g, '')`) when the asserted tokens
  provably never appear inside a real block comment — cheaper and immune to this trap.
- If a block-comment strip is required, verify the corrupted-vs-real span manually (grep the raw
  source for `/*` and `*/` occurrences) whenever a new string literal is added near the file's
  `/*`-bearing content, not just when the *test* changes.
- A grep sweep for the strip idiom (`\.replace\(/\\\/\\\*/`) is a floor to *find* every sibling
  using the pattern — it does not tell you which ones are currently safe; that still needs the
  per-file manual check this phase's worker did (recorded as a `Survey:` block in the landing
  commit).

**Why it matters:** this is a "grep a naive comment strip is standing" trap — the pattern reads
as robust (accounts for both // and /* */) but silently degrades the moment source code contains
a string that merely *looks like* a comment delimiter. The failure mode is a false negative
(assertion stops discriminating) or, worse, a false positive on a should-fail case, not a loud
crash — exactly the kind of drift a future worker adding a new glob/regex/shell literal near an
existing structural-test target could reintroduce without any test going red to warn them.

## Related

[[weak-test-assertion-passes-without-feature-being-exercised]] — the broader "test looks strict
but isn't" family this belongs to.
