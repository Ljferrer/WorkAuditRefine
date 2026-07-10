---
name: gh-preflight-and-close-epic-mechanize-manual-gh-reminders
description: gh-preflight.sh + assert-issues-filed.sh --close-epic now mechanize the old manual gh-account/close-epic reminders
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
  tags: 
    - gh-cli
    - mechanization
    - checkpoint
  related: 
    - "[[gh-account-must-be-ljferrer]]"
    - "[[close-epic-when-status-done]]"
  created: 2026-07-09
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# gh-preflight.sh + assert-issues-filed.sh --close-epic mechanize two prior manual reminders

Phase 1 of `github-issue-lifecycle-and-run-bookkeeping-mechanization` (landed on
`dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization`) turns two previously
**manual, prose-only** reminders into code:

- **[[gh-account-must-be-ljferrer]]** ("re-check the active `gh` account before every gh write
  batch") is now `skills/_shared/gh-preflight.sh <expected-account>`: empty/unset arg is a no-op
  (exit 0, `gh` never invoked — the C1 null-knob path so an unconfigured `overrides.ghUser: null`
  costs nothing); a non-empty arg re-verifies the active login via `gh api user --jq .login`,
  switches with `gh auth switch --hostname github.com --user <expected>` on drift, re-verifies
  again, and exits non-zero printing **both** the wanted and actual login when the switch doesn't
  take (fail-loud, never a silent wrong-account write). The expected account is threaded from the
  new `overrides.ghUser` `war-config` knob, which ships `null` — no personal handle hardcoded in
  any committed file (spec criterion 12 / C1).
- **[[close-epic-when-status-done]]** ("pair the `status:done` relabel with `gh issue close` in the
  same step") is now `assert-issues-filed.sh --close-epic <n> --sha <sha>`, which performs the
  label edit and `gh issue close --reason completed` (with the landed-SHA comment) as **one atomic
  call**, and the same script's `assert` mode makes the pairing **non-bypassable**: a landed phase
  whose epic is `state:OPEN` with `status:done` exits 1 (`done-but-open`) at the Checkpoint gate,
  blocking DAG advance until `--close-epic` is run.

**Why this matters going forward:** the two source lessons above are still correct in spirit
(gh writes can still fail if `overrides.ghUser` is left `null`/misconfigured, or if a Lead runs
`assert-issues-filed.sh assert` without ever invoking `--close-epic`), but the *mechanism* to
prevent the drift now exists in code rather than depending on an operator/Lead remembering a prose
rule. Treat those two lessons as **historical context for why this mechanism exists**, not as the
current operating procedure — the operating procedure is now "run `gh-preflight.sh` before the
write batch, run `assert-issues-filed.sh assert` at Checkpoint, and let the done-but-open exit-1
route force `--close-epic`."

**Verification caveat (absence note):** this servitor ran from a worktree checked out to a
*different* branch (`claude/war-campaign-1ecdd0`), which does not contain
`skills/_shared/gh-preflight.sh` or `skills/war/assets/assert-issues-filed.sh` — both `Read`
attempts returned "file does not exist" here. The facts above are drawn from the phase's landed
task list, plan (`docs/plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md`,
present in this checkout), and the audit log's approve verdicts + gate-audit evidence (both scripts'
mapped acceptance tests were confirmed passing at the pinned `audit_sha` per the gate-audit records),
not from a direct Read of the shipped files. **Verify both files are present and behave as described
before relying on this mechanism in a future run** — re-check on the branch that actually landed
this phase (`dev/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization`) or on
`master` once merged.
