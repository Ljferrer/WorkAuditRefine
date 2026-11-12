---
name: a-hard-end-state-whose-observable-needs-a-non-git-tool-has-no-seat-that-can-judge-it
description: A HARD End state that needs vale or another non-git tool has no seat that can judge it
metadata:
  node_type: memory
  type: project
  keywords:
    - HARD at audit_sha
    - judge seat
    - vale count
    - read-only auditor
    - cannot-confirm
    - unverified attestation
    - plan authoring
    - check row
  provenance: code-verified
  slug: a-hard-end-state-whose-observable-needs-a-non-git-tool-has-no-seat-that-can-judge-it
  phase: "2026-11-08-doc-truth-drift-and-adr-hygiene/phase-4 (Vale prose pass, held:escalation)"
  tags:
    - plan-authoring
    - end-state
    - audit
  created: 2026-11-12
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-12T22:26:14.099Z
---

**Observed.** End state 30 was a `HARD at audit_sha` row whose observable was a `vale --config hooks/vale-md/.vale.ini --output=line <file> | wc -l` count "re-run by the seat".
Every plan-faithfulness seat on tasks 4.1, 4.2, 4.4 and 4.6 reported that it could not run vale.
The phase end-state gate-audit seat also attested the row `unverified` for the same reason.
So the count floor rested only on the worker's done report, a SOFT rung, at every seat.

**Why.** `hooks/validate-auditor-git.sh` lets an auditor run only allowlisted read-only git verbs. Vale is not git, so the guard denies it.
Seats fell back to hand counts of words per sentence. One hand count (task 4.3) found a real floor miss the worker's report hid.

**Rule for plan authors.** If an End state needs a non-git tool to measure, make it a `check:` row.
The endstate-check dispatch runs a `check:` command and stamps the artifact at the tip, so a seat can read the result.
Keep `HARD at audit_sha` with a seat judge for facts a seat can read with git and file reads alone.
If the judgment needs both a count and a seat's reading (for example freeze reasons), split it into a `check:` row and a judged row.

**Locate-cue.** `hooks/validate-auditor-git.sh` and `hooks/vale-md/.vale.ini` were found at the phase-4 landed tip a5a30fe5 (rung 2, the run-scoped `_refinery` worktree). Verify still present before acting.
Related: [[full-gates-green-end-state-soft-without-threaded-gate-log-artifact]].
