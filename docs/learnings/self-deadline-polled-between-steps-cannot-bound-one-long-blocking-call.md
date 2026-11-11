---
name: self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call
description: "A deadline checked between steps cannot stop one long call. Bound each call"
metadata:
  node_type: memory
  type: project
  keywords:
    - hook deadline
    - hooks.json timeout
    - host kill
    - blocking call
    - git hash-object
    - watchdog
    - margin design
    - audit-tree-fingerprint
  provenance: code-verified
  slug: self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call
  phase: 2026-10-20-rea-artifact-evidence/phase-7 task 7.2, resolved at phase-8 task 8.1
  tags:
    - war
    - hooks
    - audit
    - guard-design
    - fail-open
  created: 2026-10-24
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:25:32.097Z
---

# A deadline you poll between calls does not bound a call

**Rule.** A script that sets its own deadline below a host kill timeout, to stay in control, must bound every blocking call by the time left. Polling the deadline between calls leaves one call as long as the whole margin (kill timeout minus deadline) unprotected. If that call starts before the deadline and ends after the kill, the host kills the script and the control never fires.

**Why:** the kill arrives during the call, so a check after the call never runs. The margin only protects if no single call can exceed it. In task 7.2 the fingerprint hook had a 600 s `hooks.json` timeout and a 540 s deadline, and its git calls were not wrapped. The security seat's trigger was a sparse untracked file (`truncate -s 1T`): cheap to create, and the batched `hash-object` then reads its whole logical size. That size and the hashing speed are the seat's estimate, not measured.

**How to apply:**
- Bound each call under bash 3.2 with one of the three shapes the seats named: poll `kill -0` every 0.1 to 0.2 s while checking `expired`, a `sleep` plus `kill` watchdog mapped to the existing return-3 path, or a `perl -e 'alarm shift; exec ...'` wrapper that execs the rest of its argument list. The second landed.
- Background the call with explicit redirects, because a non-interactive async command gets `/dev/null` for stdin. Redirect the watchdog's stdio too, or an orphaned `sleep` holds the caller's `$(...)` pipe open. The landed watchdog signals the direct pid only, not the process group. See [[bash-watchdog-kills-direct-pid-only-grandchild-survives]]. The four traps the watchdog hit are in [[bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm]].
- When a ruling pairs a purpose with a mechanism, check that the mechanism reaches the purpose, and say whether one overrunning call is in scope. Here the slice's loop-level wording split the panel, and the early ruling ended that loop: see [[an-ask-finding-re-raised-as-major-absorb-keeps-the-ace-ladder-from-converging]].

**Fixed in phase 8 (task 8.1, ruling A).** `bounded` in `hooks/audit-tree-fingerprint.sh` is the sleep-and-kill watchdog and maps a kill to the return-3 timeout path.

**Later fixed (#2742, ec3e7ae7).** The `rev-parse HEAD` and `worktree list` calls are now bounded too. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]] item 1.

**Still open.** The host's real behavior on a hook kill is the ruling's premise, taken from the operator. No run measured it.

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`, `bounded()` wraps the `ls-files` and `status` calls in `fingerprint()` and both `hash-object` calls in `blob_lines()`. `bounded()` also wraps `git -C "$1" rev-parse HEAD` in `fingerprint()`, and its `bcap` wrapper bounds `git worktree list --porcelain` in `marked_worktrees_of()`.
