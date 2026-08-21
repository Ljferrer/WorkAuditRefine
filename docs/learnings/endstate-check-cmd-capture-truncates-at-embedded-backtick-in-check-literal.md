---
name: endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal
description: "An End-state `check:` literal that itself embeds a backtick-delimited Markdown code span (e.g. a grep -qF pin on a `` `ponytail:` `` bullet) truncates the endstate-check dispatch's captured .cmd at that inner backtick, producing a bash syntax error at execution — SOFT/cannot-confirm, never unmet."
metadata: 
  node_type: memory
  type: project
  keywords: 
    - endstate-check
    - backtick
    - markdown code span
    - grep -qF
    - cmd capture
    - dispatch truncation
    - unexpected EOF
    - bash syntax error
    - SOFT cannot-confirm
    - gate-audit
    - workflow-template
    - endstate cmd artifact
  provenance: code-verified
  slug: endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal
  phase: adr-doc-truth-sweep/phase-1
  tags: 
    - gate-audit
    - endstate-check
    - dispatch-artifact
    - workflow-template
  created: 2026-08-21
  originSessionId: 7ca1efff-82f4-4b12-a4e0-5ec1e43ee937
  modified: 2026-08-21T20:04:13.326Z
---

# End-state `check:` capture truncates at an embedded backtick

## What happened

Task 1.7's phase End state 3 pins a plan clause with a three-conjunct check:

```
grep -qi 'baseline' docs/adr/0033-executed-probes-behind-escape-guard.md && grep -qi 'zero-byte' docs/adr/0033-executed-probes-behind-escape-guard.md && grep -qF '`ponytail:` a full ref-diff' docs/adr/0033-executed-probes-behind-escape-guard.md
```

The third conjunct deliberately embeds a Markdown inline code span (`` `ponytail:` ``) inside the
`grep -qF` literal, to pin the ratified Consequences bullet byte-intact. The endstate-check dispatch's
command-extraction (the same mechanism implicated by the sibling lessons below, in
`skills/war/assets/workflow-template.js`) stopped at the **first backtick it found inside the check
string** — i.e. it treated the check literal's own embedded backtick as a delimiter rather than
content — and wrote a truncated `.cmd` artifact ending mid-literal at `grep -qF '`. Executing that
truncated command dies with a bash parse error ("unexpected EOF while looking for matching `''` /
"syntax error: unexpected end of file"), exit code 2.

## Why it matters

This is a **capture/setup failure of the dispatch artifact**, not the plan condition evaluating
false — the gate-audit seat correctly attested it `unverified`/SOFT (never `unmet`, per the #1395
rule) and corroborated the condition's substance instead by reading the pinned blob directly
(`git show <auditSha>:<path>`, the rung-1 content-at-pin fallback) rather than trusting the broken
artifact. The underlying plan clause was in fact satisfied at the tip; only the executed-log channel
was defective.

## The pattern to watch for

Any End-state `check:` literal that legitimately needs to pin a Markdown-code-span token (backtick
delimited) inside a `grep -qF`/`grep -qi` argument is at risk: the dispatch's `.cmd`-extraction logic
does not appear to distinguish "backtick that closes the outer check fence" from "backtick that is
part of the check string's own content." A future plan author who needs to pin a backtick-quoted
literal should expect the executed artifact for that condition to come back truncated/environmentally
red, and should not treat that as the condition itself failing.

## Related

- [[endstate-check-dispatch-captures-only-one-command-per-condition-row]] — same dispatch mechanism, a different capture defect (drops a second `&&`-joined command entirely rather than truncating one).
- [[endstate-check-cmd-artifact-can-double-quote-a-single-quoted-plan-literal]] — same family, a quoting-not-truncation defect.
- [[check-command-grep-literal-must-include-markdown-code-span-backticks]] — the opposite-direction concern (omitting the backticks makes the pin unreachable); this lesson is about *including* them correctly per plan intent and the harness still mishandling them.
- [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]] — general SOFT-not-a-hold precedent for artifact-channel failures.

Verify still present before acting: the generator lives in `skills/war/assets/workflow-template.js`
(confirmed present at the landed tip via the sibling lessons' own locate-cues); look for the
`.cmd`-writing logic in the endstate-check dispatch path. A concrete reproduction is any
`.war/endstate-N-M.cmd` artifact whose corresponding plan `check:` literal contains a single
backtick-delimited Markdown code span — such an artifact is transient (written into a task/refinery
worktree, reaped after phase close), so do not expect it to persist; re-derive from a live run if
re-verifying.
