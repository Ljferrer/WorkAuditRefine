---
name: endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal
description: "A truncated or unrunnable End-state `.cmd` artifact is a transport failure: attest `unverified`, never `unmet`. Fixed by fenced transport."
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
    - fenced byte transport
    - cmd_bytes_mismatch
    - quoting-agnostic transport
    - bad substitution
    - double quote
    - dollar brace plan literal
    - unverified never unmet
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
  modified: 2026-08-26T15:24:40.701Z
---

# End-state `check:` capture truncates at an embedded backtick

**Fixed in** phase 2026-08-25-engine-reliability-and-filing-fidelity, Task 4.1 (quoting-agnostic fenced byte transport).

## Durable rule

A broken End-state `.cmd` artifact (truncated literal, bash parse error, `unexpected EOF`,
`bad substitution`) is a capture failure of the dispatch, not the plan condition evaluating false.
A present, readable, tip-stamped but environmentally red artifact attests `unverified`, never
`unmet`. The gate-audit seat attests it `unverified` (SOFT) and corroborates the condition's
substance by reading the pinned content directly (`git show <auditSha>:<path>`).

**Why:** the old dispatch re-rendered each `check:` literal instead of copying its bytes. Two
shapes followed:

- **Backtick truncation.** It stopped at the first backtick inside the literal, so any literal that
  pinned a Markdown code span (for example `grep -qF '`ponytail:` ...'`) was written mid-literal and
  died with exit code 2. Example: Task 1.7's End state 3 pinned `` `ponytail:` a full ref-diff `` in
  an ADR, and the `.cmd` ended at `grep -qF '`. The condition itself was satisfied at the tip.
- **Double-quote re-render.** A plan literal that single-quoted a `${...}`-shaped token (for example
  `! grep -qF 'Plan file: ${plan.file}'`) came out double-quoted in the `.cmd`. Bash then tried to
  expand `${plan.file}` (not a legal identifier) and died `bad substitution`, so the whole `&&` chain
  stopped before later clauses ran. The plan author had quoted it correctly.

**Correction:** the double-quote shape was archived early (2026-08-17) but stayed live until the same
fenced byte-verbatim transport fixed both shapes on 2026-08-25 (phase 4, task 4.1).

**How to apply:** the endstate-check dispatch in `skills/war/assets/workflow-template.js` (the
`if (endStateCheckRows.length > 0)` block, comment `Quoting-agnostic .cmd transport`) now threads
each literal inside a fence longer than any backtick run in the content, directs the refiner to copy
the bytes verbatim (never re-quote, re-escape or substitute), and requires a byte-for-byte verify of
the written `.cmd`. A mismatch records a `cmd_bytes_mismatch:` line and the row is never executed. If
a `.cmd` artifact still comes back truncated or re-quoted, suspect a regression in that block before
suspecting the plan.

**Residual gap (since fixed, #1781):** the new `cmd_bytes_mismatch:` / `intake_lint:` record-only
states were first mapped to `unverified` only in a source comment, not on the seat-facing prompt. See
[[endstate-check-record-only-artifact-states-lack-directed-unverified-mapping-on-seat-surfaces]].

## Related

- [[endstate-check-dispatch-captures-only-one-command-per-condition-row]] (archived): same dispatch, a second `&&`-joined command dropped instead of truncated.
- [[endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal]] (archived): same root cause, resolved by the same fenced transport.
- [[check-command-grep-literal-must-include-markdown-code-span-backticks]]: grep-side `$` hazard, a different mechanism from the double-quote re-render.
- [[check-command-grep-literal-must-include-markdown-code-span-backticks]] (archived): the opposite direction, omitting the backticks makes the pin unreachable.
- [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]]: general SOFT-not-a-hold precedent for artifact-channel failures.

> archived 2026-10-30: resolved — moved to archive
