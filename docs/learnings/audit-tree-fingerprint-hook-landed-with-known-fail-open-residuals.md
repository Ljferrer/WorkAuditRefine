---
name: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
description: "The audit tree fingerprint hook still has fail-open gaps: single git calls outrun its deadline and a start timeout masks a mismatch"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint
    - AUDIT-TAMPER
    - residual
    - fail-open
    - hook timeout
    - fingerprint deadline
    - start timeout marker
    - D22
  provenance: code-verified
  slug: audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals
  phase: 2026-10-20-rea-artifact-evidence/phase-6 task 6.2, updated at phase-7 task 7.2 and p7-polish
  tags:
    - war
    - hooks
    - audit
    - residuals
    - ask-unruled
  created: 2026-10-23
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-25T00:57:07.631Z
---

# Read this list before you touch `hooks/audit-tree-fingerprint.sh` or call it fail-closed

The hook is the D22 compensating control for the D21 `git grep -F -e <token>` admission. Phase 6 landed it with gaps. Phase 7 task 7.2 (deadline ruling, 2026-10-24) and the p7-polish sweep closed some and left the rest. Everything below was read at landed tip 218012434004 on `dev/2026-10-20-rea-artifact-evidence`, through the run-scoped `_refinery` worktree (its gitdir names this run and its HEAD equals the tip). Verify each item before acting.

## Still open at the phase-7 tip

1. **One git call can outrun the deadline.** `expired` is polled at `fingerprint` entry, per worktree in `compare` and in the SubagentStart loop, and per status record in `blob_lines`. The calls that cost time are not wrapped: `git status -uall`, the one batched `git hash-object --stdin-paths`, and the single-path `hash-object --`. A call that starts before 540 s and runs past 600 s gets the hook killed. By the operator ruling's premise, the verdict then passes unchecked. That host behavior was never measured in this run. Full write-up: [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]]. The fork was never ruled: [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]].
2. **A start-arm timeout masks a later provable mismatch.** In `compare`, the first touched worktree with no start line returns the timeout reason at once when `$STATE/timeout` exists. Later touched worktrees are never compared. The same branch labels a worktree the start arm skipped on a git error, or one created after SubagentStart, as a timeout. A timeout reason offers the fail-open question. `no start record` does not. Raised as an absorb finding in at least four audit rounds of 7.2. Never landed.
3. **A `-C` after the subcommand moves the operand base.** The Bash token loop has no subcommand gate: `-C` and `-C<n>` after `diff`, `log` or `blame` are copy-detection flags in git, but the hook treats them as global `-C`. `git -C <run dir> diff -C --no-index T1 T2` leaves the touched set empty. See [[touched-set-resolver-must-cover-every-path-form-the-admitting-guard-passes]]. Raised in at least four audit rounds. The last one was the terminal polish round, which has no round left to land it.
4. **An operand that names an ancestor of task worktrees is not resolved to them.** A run directory operand reaches every worktree below it through `diff --no-index` recursion. The Bash arm comment names this residual.
5. **Two comments overclaim.** The DEADLINE header says the clamp means "the hook always ends before Claude Code kills it". The test comment above the `hooks.json` timeout row says the deadline "always fires before the harness kills it". The clamp bounds the deadline value only, not the end time (item 1).
6. **No test row reaches the mid-hash timeout arms.** Every deadline row expires at the first pre-check (deadline 0, or an inherited `SECONDS`). The `_frc = 3` arms in `compare` ("still hashing") and the SubagentStart loop, and the per-path check in `blob_lines`, are never reached. Deleting one turns no row red. The default-540 pin greps `[^0-9]540[^0-9]`, which the header comment also satisfies.
7. **The timeout marker and the seat verdict on the tamper record are forgeable.** `$STATE/timeout` and `$MAIN/.claude/war/audit-tamper/<agent_id>.json` sit where a worker's Bash can write (ADR 0002: advisory only). The fail-open branch in `skills/war/references/resume-and-recovery.md` accepts the record's `seat_verdict` with no cross-check. Narrow: a worker who can write there can already rewrite `$STATE/start`.

Carried from phase 6 and re-read at the phase-7 tip:

8. **Touched-set writes fail open.** `touch_line` returns 0 when `mkdir -p` fails and does not check the append. `compare` returns clean when `$STATE/touched` is missing.
9. **State dirs are never pruned.** Nothing removes `$MAIN/.claude/war/audit-fingerprints/<agent_id>/`. About 8 KB per seat run.
10. **Cost grows with marked worktrees.** SubagentStart runs `git status -uall` plus one `hash-object` batch in every marked worktree for every seat.
11. **Sibling `.gitmodules` readers split on whitespace.** `reuse_hygiene` in `skills/war/assets/provision-worktrees.sh` pipes `--get-regexp` through an awk that drops field 1. `skills/war/assets/assert-no-submodule-mutation.sh` keeps awk field 2. A submodule path with a space breaks both. The hook itself reads with `git config -z`.

## Closed in phase 7

- **No hook `timeout`.** All four `hooks/hooks.json` entries for the hook now carry `"timeout": 600` (SubagentStart, SubagentStop, PreToolUse `Read|Bash|Glob|Grep`, PreToolUse `StructuredOutput`). The ruling text said "three" entries. The file registers four. Count registrations from the file, not from the slice. The hook's own deadline is 540 s by default, and an override of 600 or more falls back to 540.
- **Relative operands.** Every non-flag Bash token now resolves against the running `-C` base. Tilde forms and `--opt=<path>` values are covered too.
- **The seat's verdict was lost on a rewrite.** The StructuredOutput rewrite replaces `verdict` and `escalate_reason`, so the doc's fail-open branch ("accept the verdict as the seat returned it") had no stored value to accept. The tamper record now keeps `seat_verdict` and `seat_escalate_reason`. Same family as [[doc-promises-ledger-field-the-schema-contract-never-defines]].

## Why they shipped

Items 1 to 3 were audit findings that the fix rounds never closed. Task 7.2's ace ladder ran six rounds, and the engine forward-reverted the ace commits, so the absorb fixes moved to the phase-close polish queue. The polish changed code, tests or docs for ten of the twelve queued findings and closed two with no change. The terminal polish round approved with items 3 and 5 still open. See [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]], [[in-diff-absorb-autofixable-finding-can-ship-unfixed-despite-a-real-fix-round]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]] and [[fix-round-uncommitted-leftover-is-stashed-by-pin-transfer-and-never-lands]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `compare` returns on the first touched worktree with no start line when `$STATE/timeout` exists. The Bash token loop has `-C)` and `-C?*)` arms and no `_sub` flag. `fingerprint` and `blob_lines` call `git` with no watchdog or bound helper. Found at landed tip 218012434004.

Related: [[submodule-task-worktrees-are-invisible-to-a-superproject-worktree-list]], [[dirty-worktree-fingerprint-needs-blob-hashes-z-status-and-link-text-not-a-bare-status-hash]], [[git-status-in-a-live-sibling-worktree-needs-optional-locks-off]].
