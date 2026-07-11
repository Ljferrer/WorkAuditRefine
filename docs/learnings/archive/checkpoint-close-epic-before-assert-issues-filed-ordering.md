---
name: checkpoint-close-epic-before-assert-issues-filed-ordering
description: "On a landed phase, run --close-epic before assert-issues-filed.sh assert, else assert exits 1"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: checkpoint-close-epic-before-assert-issues-filed-ordering
  phase: github-issue-lifecycle-and-run-bookkeeping-mechanization/t1.4
  keywords: 
    - assert-issues-filed.sh
    - close-epic
    - done-but-open
    - Checkpoint
    - epic close ordering
    - status done
    - DAG advance blocked
  tags: 
    - checkpoint
    - ordering
    - gh-cli
  related: 
    - "[[gh-preflight-and-close-epic-mechanize-manual-gh-reminders]]"
    - "[[close-epic-when-status-done]]"
  created: 2026-07-09
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# Checkpoint: `--close-epic` must run BEFORE `assert-issues-filed.sh assert` on a landed phase

`skills/war/SKILL.md`'s Checkpoint bullet (phase 1 of
`github-issue-lifecycle-and-run-bookkeeping-mechanization`, landed on
`dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization`) presents
`assert-issues-filed.sh assert` as the pre-advance gate and `--close-epic` as the landed-phase
action, but the ordering between them is **implicit, not spelled out** in the bullet text (an audit
Nit on Task 1.4, disposition `note`, non-blocking).

**The gotcha:** on a landed phase whose epic is still `state:OPEN` (even with `status:done`
correctly applied), `assert-issues-filed.sh assert` exits 1 (`done-but-open`) and blocks DAG
advance. A Lead who runs `assert` before `--close-epic` will hit this block — it is not a bug, it
is the intended non-bypassable coupling (this is precisely the mechanism [[close-epic-when-status-done]]
existed to manually enforce), but a Lead unfamiliar with the ordering may misread the exit-1 as an
error rather than "you forgot to close the epic yet."

**How to apply:** on every landed phase, run `assert-issues-filed.sh --close-epic <epic> --sha
<landed-sha>` **before** `assert-issues-filed.sh assert <ledger> <phase>`. If `assert` returns
`done-but-open`, that is the signal to run `--close-epic` and re-run `assert`, not a hold to
escalate.

**Verification caveat (absence note):** written from a worktree checked out to a different branch
(`claude/war-campaign-1ecdd0`); `skills/war/SKILL.md` in this checkout's working tree predates this
phase's `## Checkpoint` changes (no `assert-issues-filed`/`close-epic` text found there). Grounded
in the phase's audit log (Task 1.4, approve verdict, Nit finding on the Checkpoint bullet) and the
plan doc present in this checkout, not a direct Read of the landed SKILL.md. **Re-verify the exact
Checkpoint bullet wording and ordering** on the branch that landed this phase or on `master` once
merged, before treating this as gospel.

> archived 2026-07-11: resolved — moved to archive
