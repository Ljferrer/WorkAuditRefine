---
name: bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm
description: "A bash 3.2 watchdog around one call inside $(...) needs detached stdio, an empty pid seed and an expired gate on exit 143"
metadata:
  node_type: memory
  type: project
  keywords:
    - bounded
    - watchdog
    - command substitution
    - orphan sleep
    - exit 143
    - octal 08
    - "10#"
    - PATH shim test
  provenance: code-verified
  slug: bash-per-call-watchdog-under-command-substitution-needs-detached-stdio-and-an-expired-gate-on-sigterm
  phase: 2026-10-20-rea-artifact-evidence/phase-8 task 8.1
  tags:
    - war
    - hooks
    - bash
    - watchdog
    - guard-design
  created: 2026-10-26
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-26T21:26:46.632Z
---

# Four traps in a per-call bash watchdog, found by audit seats over eight commits

**Rule.** To bound one blocking call in a bash 3.2 script, run the call as a background child with its output sent to a temp file. Start a watchdog subshell that sleeps for the time left, then sends SIGTERM to the child. `wait` the child, then cancel the watchdog. `bounded` in `hooks/audit-tree-fingerprint.sh` is the landed shape. It answers the problem in [[self-deadline-polled-between-steps-cannot-bound-one-long-blocking-call]].

**Trap 1: the watchdog holds the caller's pipe.** Every bounded call runs inside a caller's `$(...)`. The watchdog subshell and its `sleep` inherit that pipe as stdout. If the cancel TERM lands between `sleep &` and `_s=$!`, the trap kills nothing and the `sleep` lives on. The `$(...)` then blocks until the deadline, up to 540 s, and the round gets a false timeout. Fix: send the watchdog's stdout and stderr to `/dev/null`, and set `_s=""` before the trap. Without the seed, `kill "$_s"` aborts under `set -u`. Three seats rated this Nit or Minor in round 1 from reading the code. Nobody ran the race, so treat the mechanism as a labeled hypothesis. The fix cost nothing and landed.

**Trap 2: exit 143 is not proof of a timeout.** `wait` reports 143 for any SIGTERM. The first version returned the timeout code for every 143. Then a SIGTERM from elsewhere, such as a worker-set `core.fsmonitor` helper that kills its parent, read as a timeout. A timeout reason offers the Lead the fail-open question, and a git error does not. The landed line is `[ "$_crc" = 143 ] && expired && return 3`. It is sound because the watchdog sleeps the whole remaining deadline in whole seconds, so `SECONDS >= DEADLINE` at its kill. Row d6d pins it with a wall-time oracle that shares no code with the hook.

**Trap 3: a leading zero is octal inside `$((...))`.** The override digit check and `[ -lt 600 ]` read decimal, so `08` passed both. The new `$((DEADLINE - SECONDS))` read `08` as octal and failed, and every round with that override escalated. Before `bounded`, `DEADLINE` was only read by `[ -ge ]`. Fix: `DEADLINE=$((10#$DEADLINE))` once, after the clamp. A new arithmetic use of an old variable needs a fresh look at how the variable is validated.

**Trap 4: the header said "spawns no grandchild".** That is false. `git status` runs a child status per submodule, and it runs an fsmonitor hook if one is set. The kill reaches only the direct child. The hook still returns on time because the grandchild writes only to the killed git's output, never to a pipe the hook reads. Say that in the header instead of denying the grandchild. Related: [[bash-watchdog-kills-direct-pid-only-grandchild-survives]].

**How the rows test it.** A PATH shim `git` runs the real git, then sleeps 5 s when its arguments carry `<worktree> status` or `<worktree> hash-object` (`SHIM_SLOW`). It kills its own process with TERM when they carry `SHIM_TERM`. The hook runs under a 2 s deadline through `WAR_FINGERPRINT_DEADLINE_SECONDS`. Rows d6, d6b, d6c, d7 and d8 each wait out that deadline, which adds about 10 s to the shell gate. The shim sleeps after real git returns, so the watchdog always kills the call before the per-record `expired` check in `blob_lines` runs. That check has no discriminating row, and the plan's optional third-dirty-path row was declined for that reason. For the cheaper test of a pre-call expiry, see [[bash-seconds-inherits-from-the-environment-so-a-test-forces-an-expired-deadline-without-sleeping]].

**Not covered by `bounded`.** `git rev-parse HEAD` in `fingerprint` and `git worktree list` in `marked_worktrees_of` run unbounded. See [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]].

**Locate-cue (verify still present before acting).** In `hooks/audit-tree-fingerprint.sh`: `bounded()`, its `>/dev/null 2>&1 &` watchdog line, the `[ "$_crc" = 143 ] && expired && return 3` line, and the `DEADLINE=$((10#$DEADLINE))` line. In `hooks/audit-tree-fingerprint.test.sh`: the `SHIM_SLOW` and `SHIM_TERM` shim and rows d6 to d8. Found at landed tip c01f2b9022b2 on `dev/2026-10-20-rea-artifact-evidence`, read through the run-scoped `_refinery` worktree (its HEAD equaled the tip).
