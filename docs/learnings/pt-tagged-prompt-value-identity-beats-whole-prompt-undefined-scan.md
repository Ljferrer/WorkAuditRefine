---
name: pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan
description: "Check each interpolated value's identity in a tag, not a regex scan of rendered text"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan
  phase: war-engine-harden-r3/t1.2
  keywords: 
    - undefined interpolation
    - tagged template literal
    - pt tag
    - whole-prompt regex scan
    - false positive by construction
    - prompt build time guard
    - zero false positives
    - workflow-template.js
    - Option B
  tags: 
    - design-pattern
    - prompts
    - guard
  created: 2026-07-10
  promoted: true
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Tag interpolated VALUES, don't regex-scan the rendered TEXT — a value-identity check is zero-false-positive by construction

**The disproved approach (Option A, operator-ratified rejection 2026-07-10):** a whole-prompt scan
for `/\bundefined\b/` against the fully-rendered prompt string. This produces false positives on
any legitimate prose containing the literal word "undefined" — e.g. a finding title
("`json-parse-catch-misses-valid-scalar`"-style bug reports), a test name, or quoted code — because
the scan cannot distinguish "the interpolation produced the string `undefined`" from "the prompt
legitimately discusses the word undefined." This exact failure was observed against a live `/war`
audit before this plan and is why the design changed.

**The pattern that replaced it (Option B, `pt` tagged template):** a small tagged-template function
that checks each interpolated **value**'s identity (`vals[i] === undefined`) at prompt-BUILD time,
before the string is ever assembled or scanned:

```js
const pt = (strings, ...vals) => {
  vals.forEach((v, i) => { if (v === undefined) throw new Error(`... undefined interpolation after "…${strings[i].slice(-40)}" ...`) })
  ...
}
```
Verified present: `skills/war/assets/workflow-template.js` (landed tip, `const pt = (strings,
...vals) => {`, ~line 160).

**Why it's zero-false-positive by construction:** text is never scanned — only the *identity* of
each interpolated slot's value is checked. A defined value whose rendered text happens to contain
the word "undefined" can never trip it, because the check runs before string concatenation, on the
JS value, not the substring.

**Coverage discipline that makes this work:** EVERY prompt-rendering template literal must be
tagged — not just the "risky-looking" ones — including non-awaited spawn sites (`runSeat`) and
prompt-builder helpers (`auditPrompt`). Optional fields get an explicit `?? '<unset>'` default so a
legitimately-absent field doesn't throw. A coverage-floor test (regex on the source forbidding
`agent(` immediately followed by an untagged backtick) catches the common omission, with a known
ceiling: it only catches an untagged literal immediately following `agent(`, not one buried
mid-concatenation (ratified deferred-validation, not a defect).

**General lesson:** when guarding against a "bad value leaked into rendered output" class of bug,
prefer checking the VALUE at its interpolation site (identity-based, structural) over scanning the
OUTPUT text (pattern-based, string-based) — the latter is inherently vulnerable to legitimate text
that resembles the bad pattern.

Related: [[held-workflow-error-infra-death-prose-mismatch]] (same phase family — held:workflow-error
routing discipline), [[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]]
(a different case of the general "test the mechanism, not just the surface symptom" theme).
