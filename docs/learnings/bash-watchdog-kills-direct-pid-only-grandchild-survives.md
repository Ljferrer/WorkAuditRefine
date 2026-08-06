---
name: bash-watchdog-kills-direct-pid-only-grandchild-survives
description: "A bash timeout watchdog that signals only $cmd_pid (no setsid/process group, bash 3.2 constraint) never reaches a backgrounded grandchild — exit code stays correct but the grandchild survives indefinitely"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - timeout
    - watchdog
    - process group
    - setsid
    - kill -TERM
    - grandchild
    - job control
    - bash 3.2
    - done-when floor
  provenance: code-verified
  slug: bash-watchdog-kills-direct-pid-only-grandchild-survives
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags: 
    - bash
    - timeout
    - process-management
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T06:32:01.101Z
---

A hand-rolled bash timeout watchdog of the shape `( cd -- "$dir" && exec bash "$cmdfile" ) &
cmd_pid=$!; ...; kill -TERM "$cmd_pid"; sleep N; kill -KILL "$cmd_pid"` signals **exactly
one PID** — the direct child. Job control is off in a non-interactive script (no `set -m`),
and macOS/bash 3.2 has no `setsid`, so there is no process-group containment available.
For the ordinary case (the executed command is a leaf process or a short pipeline) this is
fine — the exec'd interpreter *is* the whole job. But if the executed command backgrounds
or daemonizes a **grandchild** (a test server, a watcher, `foo & wait`), that grandchild is
never signaled by either the TERM or the KILL: it survives the watchdog entirely, can keep
writing into the confined worktree or holding a port/lock, and (if it inherited the parent's
stdout/stderr fds) can stall whoever captures the watchdog's output through a pipe.

**The exit code is never wrong** — the watchdog still reports a timeout correctly via its
own marker-file precedence, so this is a resource-leak / stdout-capture residual, not a
correctness defect in the floor's own contract.

Found in `skills/war/assets/assert-done-when.sh` (WAR phase
2026-08-05-precision-chain-and-loop-breaker/Task 2.1) — verify still present before
acting: the watchdog subshell at lines ~140-151 signals `"$cmd_pid"` only (no `-"$cmd_pid"`
process-group form), and the header residual note at lines ~31-32 ("a child the command
spawned ... may briefly outlive the kill; it cannot change the exit code") still
understates the general case — it is accurate for a fast-exiting grandchild but not for one
that daemonizes indefinitely. This was filed as a `follow-up` at gate-audit, not fixed
in-phase; treat the header wording as an honest-but-incomplete residual, not settled fact,
if re-auditing this file later.

**Pattern for future timeout/watchdog scripts:** if process-group containment is wanted,
gate it behind `set -m` (job control) around the background launch plus `kill -TERM -"$pid"`
(negative PID = process group), with a `|| kill -TERM "$pid"` single-PID fallback for
platforms where the group form fails — and add a fixture whose command backgrounds a
long-lived grandchild (`sleep 60 & wait`) to actually exercise the containment.
