---
name: a-prose-note-line-under-an-end-state-row-is-folded-into-that-rows-check-and-its-code-span-runs
description: "A Note line under an End-state row joins its check, so the Note's code span runs"
metadata:
  node_type: memory
  type: project
  keywords:
    - end state check
    - note line
    - unnumbered line
    - code span
    - extra statement
    - grep usage error
    - exit_code 2
    - plan authoring
  provenance: agent-unverified
  slug: a-prose-note-line-under-an-end-state-row-is-folded-into-that-rows-check-and-its-code-span-runs
  phase: 2026-11-08-engine-comment-and-duplication-tidy/phase-1
  tags:
    - plan-authoring
    - end-state
    - gate-audit
  created: 2026-11-11
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T19:42:57.784Z
---

An unnumbered prose line inside the numbered End-state list is read as part of the row above it.

Its inline code span then joins that row's check literal and runs as an extra statement.

Instance: plan 2026-11-08-engine-comment-and-duplication-tidy put a red-team `Note (...)` line right after End state 14.
The Note held the inline span `grep -c`.
End state 14's artifact ran the declared `node --test` statement (fail 0, exit 0) and then a bare `grep -c` as cmd[1].
That bare grep printed its usage text, so the artifact ended `exit_code: 2`.
Both gate-audit seats (auditSha 7ba05d8b, gateEvidence true) had to judge the declared statement's printed output and set the stray one aside.

Irony: the Note itself was written to explain the grep -c exit-1 trap, see [[a-grep-c-check-that-expects-zero-exits-1-and-reads-as-red]].

Rule for plan authors and red-team patches: put list-wide notes before or after the numbered End-state list, never between two rows.
If a note must sit near a row, keep shell code spans out of it.
Seats should read a stray statement like this as a transport fault of the check text, never as `unmet`.

Sibling traps in the same check-literal path: [[a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner]].

Locate-cue (verify still present before acting): the Note line sits between End states 14 and 15 in `docs/plans/2026-11-08-engine-comment-and-duplication-tidy.md`, found at landed tip 47cd644d @ phase 1.
Provenance note: the folding step was observed in the gate-audit evidence only.
The servitor did not read the Lead-side code that extracts the check literal from the condition text, so the exact folding rule is unverified.
