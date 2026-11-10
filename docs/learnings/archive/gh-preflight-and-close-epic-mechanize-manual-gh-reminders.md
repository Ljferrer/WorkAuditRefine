---
name: gh-preflight-and-close-epic-mechanize-manual-gh-reminders
description: "At a phase land, run gh-preflight.sh before gh writes and assert-issues-filed.sh --close-epic before assert; a done-but-open exit 1 means close the epic, not escalate"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: gh-preflight-and-close-epic-mechanize-manual-gh-reminders
  phase: github-issue-lifecycle-and-run-bookkeeping-mechanization/t1.1+t1.2+t1.4
  keywords: 
    - gh-preflight.sh
    - gh auth switch
    - assert-issues-filed.sh
    - close-epic
    - overrides.ghUser
    - active gh account
    - done-but-open
    - epic close
    - Checkpoint
    - epic close ordering
    - DAG advance blocked
  tags: 
    - gh-cli
    - mechanization
    - checkpoint
    - ordering
  related: 
    - "[[gh-account-must-be-ljferrer]]"
    - "[[close-epic-when-status-done]]"
  created: 2026-07-09
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# gh-preflight.sh + assert-issues-filed.sh --close-epic mechanize the gh bookkeeping at a phase land

Both scripts answer one trigger: the `gh` bookkeeping steps at a phase land. Phase 1 of
`github-issue-lifecycle-and-run-bookkeeping-mechanization` turned two **manual, prose-only**
reminders into code:

- **[[gh-account-must-be-ljferrer]]** ("re-check the active `gh` account before every gh write
  batch") is now `skills/_shared/gh-preflight.sh <expected-account>`: empty/unset arg is a no-op
  (exit 0, `gh` never invoked — the C1 null-knob path so an unconfigured `overrides.ghUser: null`
  costs nothing); a non-empty arg re-verifies the active login via `gh api user --jq .login`,
  switches with `gh auth switch --hostname github.com --user <expected>` on drift, re-verifies
  again, and exits non-zero printing **both** the wanted and actual login when the switch doesn't
  take (fail-loud, never a silent wrong-account write). The expected account is threaded from the
  `overrides.ghUser` `war-config` knob, which ships `null` — no personal handle hardcoded in
  any committed file.
- **[[close-epic-when-status-done]]** ("pair the `status:done` relabel with `gh issue close` in the
  same step") is now `assert-issues-filed.sh --close-epic <n> --sha <sha>`, which performs the
  label edit and `gh issue close --reason completed` (with the landed-SHA comment) as **one atomic
  call**, and the same script's `assert` mode makes the pairing **non-bypassable**: a landed phase
  whose epic is `state:OPEN` with `status:done` exits 1 (`done-but-open`) at the Checkpoint gate,
  blocking DAG advance until `--close-epic` is run.

**Ordering:** on a landed phase, run `assert-issues-filed.sh --close-epic <epic> --sha <landed-sha>`
before `assert-issues-filed.sh assert <ledger> <phase>`; a `done-but-open` exit 1 from `assert` means
close the epic and re-run `assert`, not escalate.

**Why this matters going forward:** the two source lessons above are still correct in spirit
(gh writes can still fail if `overrides.ghUser` is left `null`/misconfigured, or if a Lead runs
`assert-issues-filed.sh assert` without ever invoking `--close-epic`), but the *mechanism* to
prevent the drift now exists in code. Treat those two lessons as **historical context for why this
mechanism exists**, not as the current operating procedure — the operating procedure is now "run
`gh-preflight.sh` before the write batch, run `--close-epic` then `assert-issues-filed.sh assert` at
Checkpoint, and let the done-but-open exit-1 route force `--close-epic` if it was skipped."

> archived 2026-07-11: resolved — moved to archive
