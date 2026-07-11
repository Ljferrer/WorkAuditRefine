---
name: shared-string-constant-quote-literal-byte-anchor-fragility
description: "A both-surfaces byte-identity test on a string with quote-mark examples breaks on quote lint"
metadata:
  type: project
  keywords: [byte-anchor, quote normalization, curly quotes, straight quotes, both-surfaces test, drift guard, shared constant, doc-lint, COST_CLAIM_SHARED]
  provenance: agent-unverified
  slug: shared-string-constant-quote-literal-byte-anchor-fragility
  phase: audit-calibration-and-graduation/t1
  tags:
    - war
    - test-fidelity
    - both-surfaces-test
    - drift-guard
    - byte-anchor
  files:
    - skills/war/assets/workflow-template.test.mjs
    - skills/war/assets/workflow-template.js
    - agents/war-auditor.md
  relates:
    - "[[verbatim-mirror-directive-context-mismatch-at-destination]]"
    - "[[standing-instruction-vs-dispatched-prompt-coverage-split]]"
  created: 2026-07-06
---

# A shared test constant that embeds literal quote-mark examples is a latent byte-anchor trap

**What (audit-calibration-and-graduation/t1 audit finding, disposition: note, no action taken):**
the COST-CLAIM RULE sentence includes literal double-quoted cost-claim examples — `"too slow"`,
`"too expensive"`, `"too complex"`. The both-surfaces drift test in
`skills/war/assets/workflow-template.test.mjs` (a `COST_CLAIM_SHARED` constant, referent not
re-confirmed in this checkout — phase landed on `dev/2026-07-06-audit-calibration-and-graduation`,
absent here; verify present before acting) asserts this sentence is byte-identical across three
surfaces: the JS template literal in `auditPrompt()`, the mirrored prose in `agents/war-auditor.md`,
and the test's own copy of the string.

**The trap:** this is sound today because all three surfaces use the same quote style (straight
double-quotes as of phase land). But if a future doc-lint or editor auto-normalizes quote style
(straight → curly, or vice versa) on `agents/war-auditor.md` prose but not on the JS string literal
(or vice versa), the drift test will **correctly fail** — this is the intended fail-safe behavior of
a both-surfaces test, not a defect to pre-empt. The risk is a maintainer being surprised by a "why
did this pass forever and now break" moment when a global lint sweep touches only one surface.

**Durable pattern:** any both-surfaces (or N-surfaces) byte-identity test that anchors on a string
containing user-facing punctuation (quotes, em-dashes, ellipses) is silently coupled to every
surface's punctuation-normalization tooling staying in sync. This is the same class of fragility as
[[verbatim-mirror-directive-context-mismatch-at-destination]] (context-noun mismatch at a mirror
destination) but for *punctuation* rather than *semantic content* — the shared string is a hidden
dependency surface, not just prose.

**How to apply:** when adding a both-surfaces test anchored on a literal string with quote marks or
other typographic punctuation, either (a) note in a comment that any future quote-style lint must
run identically across all anchored surfaces, or (b) normalize the anchor comparison (e.g. strip/
canonicalize quote style before comparing) if the punctuation itself isn't the fact under test. No
action was needed at land time — this is a forward-looking gotcha for whoever next touches quote
style in `agents/war-auditor.md` or the JS prompt template.
