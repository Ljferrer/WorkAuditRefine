---
name: cd-dashdash-does-not-neutralize-cdpath
description: "bash `cd -- \"$dir\"` still honors CDPATH — a leading-dash hardening pass can miss a silent-cwd-redirect + stdout-pollution hazard"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - CDPATH
    - cd --
    - bash confinement
    - silent cwd redirect
    - stdout pollution
    - floor script hygiene
    - assert-done-when.sh
  provenance: code-verified
  slug: cd-dashdash-does-not-neutralize-cdpath
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags: 
    - bash
    - security
    - floor-scripts
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T06:31:49.762Z
---

A bash script confining itself with `cd -- "$dir"` (leading `--` to stop option-parsing
on a possibly-dash-prefixed argument) is **not** protected against `CDPATH`: `--`
suppresses option parsing, not the shell's `CDPATH` directory search. If `CDPATH` is
exported in the caller's environment and `$dir` is a **relative** path, bash resolves the
`cd` against `CDPATH` entries first — landing the script in an unintended directory —
**and echoes the resolved path to stdout**, which is a second-order hazard for any script
whose stdout contract is load-bearing (e.g. a floor script whose stdout is captured
verbatim as an evidence artifact).

Found in `skills/war/assets/assert-done-when.sh` (WAR phase
2026-08-05-precision-chain-and-loop-breaker/Task 2.1): a polish commit hardened the `cd`
calls with `--` but left `CDPATH` unneutralized. The gate-audit finding was **absorbed**
same-phase; the landed fix is `unset CDPATH` immediately after `set -euo pipefail`, with
an inline comment naming both the cwd-redirect and stdout-pollution hazards — verify
still present before acting: `skills/war/assets/assert-done-when.sh` line ~43.

**Pattern for future floor/confinement scripts:** `unset CDPATH` (or `CDPATH=''`) belongs
in the same defensive-hygiene tier as `set -euo pipefail` for any script that `cd`s into
an externally-supplied path, independent of whether that `cd` also carries `--`. The
concrete exploit is gated on the caller passing a **relative** path — an absolute-only
calling convention (as this engine's own `${task.worktree}` wiring uses) makes the gap
unreachable in practice, but the defense-in-depth cost is one line and should not be
skipped just because today's caller happens to pass absolute paths.
