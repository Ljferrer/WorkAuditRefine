---
name: endstate-check-dispatch-captures-only-one-command-per-condition-row
description: "The endstate-check dispatch runs one command per End-state row, so a check: that names two mandatory commands gets only one captured artifact; combine them or split the row"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - endstate-check
    - endStateAttestations
    - land barrier
    - artifact-first
    - multi-command check
    - gate evidence
    - evidence capture gap
    - two-command condition
    - workflow-template.js
  provenance: code-verified
  slug: endstate-check-dispatch-captures-only-one-command-per-condition-row
  phase: 2026-08-06-done-when-floor-wiring/1.4
  tags: 
    - engine
    - evidence-capture
    - gate-audit
    - plan-authoring
  relates:
    - "[[endstate-check-fixed-context-window-undercaptures-growing-enumerated-block]]"
    - "[[endstate-check-artifact-with-exit-0-and-empty-stdout-is-non-substantiating]]"
  created: 2026-08-15
  modified: 2026-08-17T05:52:07.269Z
  originSessionId: 8bae67aa-acfa-461e-acc9-278fc79ba6c1
---

# A plan End state's `check:` field naming two mandatory commands only gets one captured artifact

## The rule

The land-barrier endstate-check dispatch (the `endstate-check:phase-<id>` dispatch and its
`ENDSTATE_CHECK_RESULT` schema in `skills/war/assets/workflow-template.js`) runs each claimed
`check:`-tagged End-state condition **once**. It tees the output to one artifact,
`.war/endstate-<phaseId>-<n>.log` (n = the condition's 1-based claim number). One command, one
row, one file. That is correct for a single-command check, and it is by construction, not a bug in
the dispatch.

A prose "AND" inside one `check:` field does not make the dispatch run a second command. Only the
first command gets an artifact.

## Instance

In `2026-08-06-done-when-floor-wiring`, End state 1's check was a `-TERM -"$cmd_pid"` grep
returning 1 *and* its `-KILL` sibling also returning 1. Only the first grep produced an artifact.
The gate-audit seat caught the gap and re-grounded the missing half on the pinned blob
(`git show <sha>:<path>`), so the verdict was still right. But that re-grounding is manual and
unrecorded. A consumer that trusts the artifact as the complete evidence trail would score a
half-verified condition as fully artifact-backed.

## How to apply

1. **As a plan author:** when an End state's `check:` truly needs two (or more) mandatory
   commands, either (a) combine them into ONE shell command whose exit status reflects both
   (e.g. `cmd1 && cmd2`, or a single script), or (b) split it into two numbered End-state
   conditions, each with its own `check:` and its own artifact.
2. **As an auditor/servitor reading endstate artifacts:** never assume a `.war/endstate-*.log`
   artifact is the complete evidence for a condition whose stated check names more than one
   command. Check which single command the artifact logged. If the check prose names a second
   command, re-verify it against the pinned blob.

A separate failure, an artifact with `exit_code: 0` and an empty body, is in
[[endstate-check-artifact-with-exit-0-and-empty-stdout-is-non-substantiating]].

> archived 2026-08-30: resolved — moved to archive
