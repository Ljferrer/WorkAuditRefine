---
name: bash-watchdog-kills-direct-pid-only-grandchild-survives
description: "RESOLVED (#1365): kill of $cmd_pid alone never reaches a backgrounded grandchild; group kill under set -m does"
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
2026-08-05-precision-chain-and-loop-breaker/Task 2.1) — this original single-PID gap was
filed as a `follow-up` at gate-audit, not fixed in-phase.

**Pattern for future timeout/watchdog scripts:** if process-group containment is wanted,
gate it behind `set -m` (job control) around the background launch plus `kill -TERM -"$pid"`
(negative PID = process group), with a `|| kill -TERM "$pid"` single-PID fallback for
platforms where the group form fails — and add a fixture whose command backgrounds a
long-lived grandchild (`sleep 60 & wait`) to actually exercise the containment.

## RESOLVED (2026-08-06-done-when-floor-wiring/1.4, #1365 + #1338, landed dev/2026-08-06-done-when-floor-wiring @ c0665c15) — group-form kill now lands; residual narrowed to two named ceilings, one still open

Code-verified at the landed tip (read via the `_refinery` worktree whose `gitdir` physical
path contains this plan's slug — HEAD equalled the confirmed tip exactly):
`skills/war/assets/assert-done-when.sh` now brackets the background launch in `set -m` /
`set +m` (giving the command tree its own process group, pgid `$cmd_pid`) and the watchdog
signals group-first with a single-PID fallback: `kill -TERM -"$cmd_pid" 2>/dev/null || kill
-TERM "$cmd_pid" 2>/dev/null || true`, then after `sleep 2`, the same shape with `-KILL`.
The original concrete instance this lesson named (grandchild never signalled at all) is
fixed — this exercises the `sleep 60 & wait` fixture the "Pattern" section above already
prescribed, and the landed suite pins it (case 21: exit 1, timed-out diagnostic, empty
stdout, capture returns within budget).

**New residual nuance, surfaced by the SAME landing's audit and left open as a follow-up —
a general teardown-ordering trap, not specific to this file:** the parent does `wait
"$cmd_pid"` and, the instant the command dies (e.g. from the group TERM), runs `kill
"$watchdog_pid"` on the very next line — killing the watchdog subshell **while it is still
inside its `sleep 2`**, so the watchdog's own pending `kill -KILL -"$cmd_pid"` line never
executes. A descendant that stayed in the command's own process group (never escaped into a
new session) but ignores/traps SIGTERM is therefore signalled once, ignored, and never
KILLed — it survives the "insurance" step entirely, still holding any inherited stdout fd.
This is a **different** survivor class from the daemonized-new-session-group ceiling (which
is a deferred, unfixable ceiling on bash 3.2 — no `setsid`): this one is reachable and
fixable (e.g. have the parent itself issue the group KILL after `wait` returns, or defer
killing the watchdog until past its own KILL window), but as of this landing it has no gate
member, floor, or backstop row — it is documented truthfully in the floor's header comment
but otherwise unfixed. Verify still present before acting.

**Durable pattern to reuse (general, beyond this script):** when a monitor/watchdog process
has a pending cleanup or insurance step gated behind its own `sleep`, and the *parent*
tears the watchdog down as soon as the *monitored* job exits, the watchdog's insurance step
can be skipped entirely — the parent's teardown races the watchdog's own pending action.
Killing a monitor early is not equivalent to letting it finish; if the monitor's tail action
matters (a final containment KILL, a log flush, a lock release), either let it run to
completion before tearing it down, or have the *parent* itself perform the tail action
before/instead of killing the monitor.
