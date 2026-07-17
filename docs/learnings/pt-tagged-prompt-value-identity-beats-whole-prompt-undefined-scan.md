---
name: pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan
description: "Check interpolated value identity per tag, not a rendered-text regex"
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

## Ceiling update (phase "structural-test-integrity", task 1.1, #931, 2026-07-16)

The coverage-floor test's ceiling recorded above — "it only catches an untagged literal
immediately following `agent(`, not one buried mid-concatenation" — was a **ratified accepted
residual**, not a design gap; #931 is that residual being deliberately lifted. The floor test
itself (`criterion 3 (coverage floor) — no agent() spawn site passes a bare untagged inline
template literal`) stays byte-unchanged and keeps catching the narrow case it always caught. What
closes the broader blind spot — an untagged literal behind a variable, inside a
`pt`-concatenation helper body, or nested inside another `pt` literal's `${}` interior — is a
separate, new **default-deny census**: `scanTemplateLiterals(text)` in
`workflow-template.test.mjs`, a string-aware single-pass scanner (Node-stdlib-only, no
AST/lexer) that recognizes comments and quoted strings, walks template literals recursively
through nested `${}` interiors, and tags each occurrence tagged/untagged by whether the
identifier `pt` immediately precedes its backtick. Its assertion is exact-multiset equality:
every untagged literal's head fragment (plus occurrence count) must equal an enumerated,
class-grouped registry — a new untagged literal *anywhere* in the file, including nested inside
a `pt` interpolation, is red by construction, and so is a stale registry row whose literal no
longer exists.

**Measured scale at this plan's authoring baseline (2026-07-16):** ≈129 untagged template
literals (120 distinct heads) in `skills/war/assets/workflow-template.js` — the spec's original
design (a handful of named zero-backtick exemption rows, asserting "zero backticks remain") was
found factually unimplementable at conversion and corrected to this registry shape (see the
structural-test-integrity plan's "Notes / conscious deviations"). Most of the 129 are
value-composition (log lines, error/validation messages, label/branch/path/git-command builders)
and become registry rows; a smaller, explicitly verified subset is prompt-feeding and gets
`pt`-tagged instead — seeds: the `adjudications.map` row and `adjRow`, `auditPrompt`'s
`peers.map` row and its nested findings row, the `evItems.map` row, the acceptance-criteria
`.map` row, `mergedSlices`, and the untagged interiors nested inside `submodNote`/
`pinStatusLine`/`guardLine`. The exact split is Task 1.1's dispatch-base classification, recorded
in that task's landing commit as an `Audit:` table — this note is a design-time snapshot, not a
re-verification of the final count.

**The new, smaller ceiling this creates:** registry-row review. Once a literal is filed as a
value-composition row, nothing mechanically re-checks that classification — a careless or wrong
row for a literal that actually feeds a prompt re-opens exactly the gap this census exists to
close, just narrowed from "129 unexamined literals" to "one misclassified row." The mitigation is
the registry's own header rule ("a literal that feeds `agent()` prompt text is NEVER registered
here — tag it with `pt`") plus ordinary auditor grep, not a mechanical guard — a review-discipline
ceiling, not a code one. Separately, `scanTemplateLiterals` carries its own mechanical ceiling:
regex-literal ambiguity — the scanner is not a JS lexer, so a regex literal containing an
unbalanced quote or backtick can desync it, but the recorded failure mode is **loud**, not silent:
an unclosed quoted-string or unterminated-template desync throws (fail-closed) rather than
under-counting.

At this note's authoring time (Task 1.3, same wave as Task 1.1 — file-disjoint, no `deps` edge
between them), `scanTemplateLiterals` is defined-but-not-yet-emitted from this worker's own
worktree; verify presence and the registry's actual row count at the phase's landed tip
(`skills/war/assets/workflow-template.test.mjs`) before treating the measured-scale figures above
as code-verified in a fresh session.

Related: [[held-workflow-error-infra-death-prose-mismatch]] (same phase family — held:workflow-error
routing discipline), [[decoy-fixture-comment-must-match-actual-throw-order-not-just-outcome]]
(a different case of the general "test the mechanism, not just the surface symptom" theme).
