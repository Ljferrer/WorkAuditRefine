---
name: shared-string-constant-quote-literal-byte-anchor-fragility
description: "Byte-identity test on a quote-bearing string breaks on quote lint — now MITIGATED (#811, 2026-07-12): coupling comments added at both source surfaces"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - byte-anchor
    - quote normalization
    - curly quotes
    - straight quotes
    - both-surfaces test
    - drift guard
    - shared constant
    - doc-lint
    - COST_CLAIM_SHARED
    - "#811"
    - coupling comment
  provenance: code-verified
  slug: shared-string-constant-quote-literal-byte-anchor-fragility
  phase: "audit-calibration-and-graduation/t1 (mitigated audit-gate-evidence-fidelity/1.1, 2026-07-12)"
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
  updated: 2026-07-12
  originSessionId: 3e7df1e1-5759-4eb0-9cb3-db7f6b90a91d
---

# A shared test constant that embeds literal quote-mark examples is a latent byte-anchor trap

**Recurrence-on-a-repo-lesson note:** the covering fact lives at
`docs/learnings/shared-string-constant-quote-literal-byte-anchor-fragility.md` (repo root, not
servitor-editable). This is the local, same-slug recurrence-update copy (D1); a future Gate-2
promotion should overwrite the repo file with this content.

**What (audit-calibration-and-graduation/t1 audit finding, disposition: note, no action taken at
the time):** the COST-CLAIM RULE sentence includes literal double-quoted cost-claim examples —
`"too slow"`, `"too expensive"`, `"too complex"`. The both-surfaces drift test in
`skills/war/assets/workflow-template.test.mjs` (`COST_CLAIM_SHARED` constant) asserts this sentence
is byte-identical across three surfaces: the JS template literal in `auditPrompt()`, the mirrored
prose in `agents/war-auditor.md`, and the test's own copy of the string.

**The trap (still valid — this fix does not eliminate it, only flags it):** this is sound today
because all three surfaces use the same quote style. If a future doc-lint or editor
auto-normalizes quote style on one surface but not the others, the drift test will **correctly
fail** — the intended fail-safe behavior of a both-surfaces test, not a defect to pre-empt.

## MITIGATED — phase "Engine fidelity + evidence contract" (#811, 2026-07-12)

**Code-verified via the phase's own task worktree** (this servitor's own cwd was a stale,
unrelated checkout — see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] —
confirmed instead at
`<repo-root>/.claude/war-worktrees/2026-07-12-audit-gate-evidence-fidelity/p1-1.1/skills/war/assets/workflow-template.js`
and its `.test.mjs`): this phase implemented exactly option (a) from the original lesson's "How to
apply" section — an adjacent comment at BOTH the `workflow-template.js` literal and the test's
`COST_CLAIM_SHARED` declaration, each naming the three coupled surfaces and requiring any
quote-style lint to run identically across all three in one commit:

- `workflow-template.js` (adjacent to the `COST-CLAIM RULE` prompt literal): `// #811
  BYTE-COUPLED SURFACE (JS comment — NOT emitted into the prompt): this quote-bearing COST-CLAIM
  RULE literal is byte-identical to agents/war-auditor.md's Cost-claim rule line AND the test's
  COST_CLAIM_SHARED anchor. Any quote-style lint MUST run identically across ALL THREE in one
  commit... A lint most plausibly starts here.`
- `workflow-template.test.mjs` (adjacent to `const COST_CLAIM_SHARED = ...`): `// #811 QUOTE-LINT
  ANCHOR: COST_CLAIM_SHARED is a quote-bearing byte literal COUPLED across THREE surfaces...`

Per the Commander's Intent, `agents/war-auditor.md` was deliberately left untouched — a comment
there would ship as standing-prompt bytes read by every auditor spawn, which the plan explicitly
ruled out. **The trap itself is not eliminated** (a quote-style lint touching only one of the three
surfaces would still silently break the byte-identity guard) — this fix only makes the coupling
*discoverable* at the two commentable surfaces before someone runs that lint.

**Durable pattern (unchanged):** any both-surfaces (or N-surfaces) byte-identity test that anchors
on a string containing user-facing punctuation (quotes, em-dashes, ellipses) is silently coupled to
every surface's punctuation-normalization tooling staying in sync — same class of fragility as
[[verbatim-mirror-directive-context-mismatch-at-destination]] but for *punctuation* rather than
*semantic content*.

**How to apply (updated):** when adding a both-surfaces test anchored on a literal string with
quote marks or other typographic punctuation, add the coupling comment at every surface that CAN
carry a code comment (test file, JS source) — but skip any standing-prompt `.md` surface whose
bytes are read verbatim by a dispatched agent, since a comment there ships as literal instruction
text, not documentation.
