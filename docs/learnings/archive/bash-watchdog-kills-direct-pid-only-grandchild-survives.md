---
name: bash-watchdog-kills-direct-pid-only-grandchild-survives
description: "Three bash watchdog traps: killing $cmd_pid alone misses a backgrounded grandchild (use a set -m group kill, RESOLVED #1365), tearing the watchdog down early skips its insurance KILL, and a set -m async launch needs an explicit < /dev/null"
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
    - set -m
    - group kill
    - teardown ordering
    - KILL insurance
    - RESOLVED
    - /dev/null stdin
    - implicit redirect
    - SIGTTIN
    - async command
  provenance: code-verified
  slug: bash-watchdog-kills-direct-pid-only-grandchild-survives
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags:
    - bash
    - timeout
    - process-management
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-15T11:29:20.721Z
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
2026-08-05-precision-chain-and-loop-breaker/Task 2.1).

**Pattern for future timeout/watchdog scripts:** if process-group containment is wanted,
gate it behind `set -m` (job control) around the background launch plus `kill -TERM -"$pid"`
(negative PID = process group), with a `|| kill -TERM "$pid"` single-PID fallback for
platforms where the group form fails — and add a fixture whose command backgrounds a
long-lived grandchild (`sleep 60 & wait`) to actually exercise the containment.

## RESOLVED (2026-08-06-done-when-floor-wiring/1.4, #1365 + #1338)

`skills/war/assets/assert-done-when.sh` now brackets the background launch in `set -m` /
`set +m` and signals group-first with a single-PID fallback: `kill -TERM -"$cmd_pid" 2>/dev/null
|| kill -TERM "$cmd_pid" 2>/dev/null || true`, then after `sleep 2`, the same shape with `-KILL`.
The landed suite pins the `sleep 60 & wait` grandchild fixture (case 21).

## Trap 2: `set -m` around an async launch removes the implicit /dev/null stdin

Wrapping `cmd &` in `set -m` silently changes stdin semantics: background jobs under job
control keep the caller's tty/pipe stdin instead of the implicit `/dev/null`, so a child that
reads stdin can hang to the timeout budget or consume the caller's input (under a TTY, SIGTTIN
can stop it). The hang is silent and only bites when the launched command reads stdin. Any
`set -m` + `&` launch must carry an explicit `< /dev/null` (or a deliberate stdin) on the
launched command; `assert-done-when.sh` does. When reviewing watchdog/timeout shells, grep the
launch site for both `set -m` and stdin redirection together.

## Trap 3: teardown ordering skips the insurance KILL

**Residual surfaced by the same landing's audit and left open as a follow-up — a general
teardown-ordering trap, not specific to this file:** the parent does `wait "$cmd_pid"` and, the
instant the command dies (e.g. from the group TERM), runs `kill "$watchdog_pid"` on the very next
line — killing the watchdog subshell **while it is still inside its `sleep 2`**, so the
watchdog's own pending `kill -KILL -"$cmd_pid"` line never executes. A descendant that stayed in
the command's own process group (never escaped into a new session) but ignores/traps SIGTERM is
therefore signalled once, ignored, and never KILLed — it survives the "insurance" step entirely,
still holding any inherited stdout fd. This is a **different** survivor class from the
daemonized-new-session-group ceiling (which is a deferred, unfixable ceiling on bash 3.2 — no
`setsid`): this one is reachable and fixable (e.g. have the parent itself issue the group KILL
after `wait` returns, or defer killing the watchdog until past its own KILL window), but as of
this landing it has no gate member, floor, or backstop row — it is documented truthfully in the
floor's header comment but otherwise unfixed. Verify still present before acting.

**Durable pattern to reuse (general, beyond this script):** when a monitor/watchdog process
has a pending cleanup or insurance step gated behind its own `sleep`, and the *parent*
tears the watchdog down as soon as the *monitored* job exits, the watchdog's insurance step
can be skipped entirely — the parent's teardown races the watchdog's own pending action.
Killing a monitor early is not equivalent to letting it finish; if the monitor's tail action
matters (a final containment KILL, a log flush, a lock release), either let it run to
completion before tearing it down, or have the *parent* itself perform the tail action
before/instead of killing the monitor.

> archived 2026-08-25: resolved — moved to archive
