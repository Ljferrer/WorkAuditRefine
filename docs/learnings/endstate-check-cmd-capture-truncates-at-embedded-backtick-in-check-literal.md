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
  provenance: code-verified
  promoted: dev/2026-08-20-adr-doc-truth-sweep@phase-1
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

A broken End-state `.cmd` artifact (truncated literal, bash parse error, `unexpected EOF`) is a
capture failure of the dispatch, not the plan condition evaluating false. The gate-audit seat
attests it `unverified` (SOFT), never `unmet`, and corroborates the condition's substance by
reading the pinned content directly (`git show <auditSha>:<path>`).

**Why:** the old dispatch re-rendered each `check:` literal and stopped at the first backtick
inside it, so any literal that pinned a Markdown code span (for example `grep -qF '`ponytail:` ...'`)
was written mid-literal and died with exit code 2. The condition itself was satisfied at the tip.

**How to apply:** the endstate-check dispatch in `skills/war/assets/workflow-template.js` (the
`if (endStateCheckRows.length > 0)` block, comment `Quoting-agnostic .cmd transport`) now threads
each literal inside a fence longer than any backtick run in the content, directs the refiner to copy
the bytes verbatim, and requires a byte-for-byte verify of the written `.cmd`. A mismatch records a
`cmd_bytes_mismatch:` line and the row is never executed. If a `.cmd` artifact still comes back
truncated, suspect a regression in that block before suspecting the plan.

**Residual gap:** the new `cmd_bytes_mismatch:` / `intake_lint:` record-only states are mapped to
`unverified` only in a source comment, not on the seat-facing prompt. See
[[endstate-check-record-only-artifact-states-lack-directed-unverified-mapping-on-seat-surfaces]].

## Related

- [[endstate-check-dispatch-captures-only-one-command-per-condition-row]] (archived): same dispatch, a second `&&`-joined command dropped instead of truncated.
- [[endstate-check-cmd-artifact-can-double-quote-a-single-quoted-plan-literal]] (archived): same root cause, resolved by the same fenced transport.
- [[check-command-grep-literal-must-include-markdown-code-span-backticks]] (archived): the opposite direction, omitting the backticks makes the pin unreachable.
- [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]]: general SOFT-not-a-hold precedent for artifact-channel failures.
