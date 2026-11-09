---
name: a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner
description: "A semicolon inside a quoted End-state check literal splits the statement, so the check can never go green"
metadata:
  node_type: memory
  type: project
  keywords:
    - end state check
    - semicolon
    - quoted literal
    - statement split
    - cmd exit
    - endstate artifact
    - plan authoring
    - transport fault
  provenance: code-verified
  slug: a-semicolon-inside-a-quoted-end-state-check-literal-is-split-by-the-statement-runner
  phase: 2026-11-08-auditor-and-worker-guard-habits/phase-1
  tags:
    - plan-authoring
    - end-state
    - gate-audit
  created: 2026-11-08
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T06:09:57.040Z
---

The End-state check runner appends a `cmd[i] exit:` printf after each statement.
It finds statement ends at `;` and newline boundaries only, and it does not respect shell quotes.
So a `;` inside a quoted grep pattern ends the statement in the middle of the quote.

Instance: End state 13 of plan 2026-11-08-auditor-and-worker-guard-habits used `grep -c 'is not a conflict; do the task' ...`.
The artifact printed `grep: exit:: No such file or directory` and ended with `exit_code: 2`.
The condition was true. Four gate-audit seats had to re-ground it with `git grep -F` at the pin.
One seat attested it `unverified`, the rest attested `met` on their own re-read.

Rule for plan authors: never put `;` (or a newline) inside a quoted check literal.
Pick a shorter substring with no semicolon, for example `grep -c 'is not a conflict'`.
Seats should read a split statement as a transport fault (`unverified`), never as `unmet`.

Sibling trap: a backtick inside a check literal once truncated the `.cmd` capture, see [[endstate-check-cmd-capture-truncates-at-embedded-backtick-in-check-literal]].

Locate-cue (verify still present before acting): the runner rule is the comment near the END-STATE CHECK runner in `skills/war/assets/workflow-template.js` ("`;` / newline boundaries only"), locked by the "compound check exit aggregation" test in `skills/war/assets/workflow-template.engine-1.test.mjs`. Found at landed tip 242704f4 @ phase 1.
