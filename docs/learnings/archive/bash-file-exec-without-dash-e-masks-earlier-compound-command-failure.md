---
name: bash-file-exec-without-dash-e-masks-earlier-compound-command-failure
description: "Executing a plan/operator-supplied command file as `bash <file>` (no -e) means a compound `a; b` command reports only b's exit status — a red `a` is silently masked. This is correct standard-shell semantics, not a defect, but is a real check-vacuity residual worth naming explicitly"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - set -e
    - compound command
    - check vacuity
    - bash file
    - done-when
    - exit status masking
    - plan.gate
  provenance: code-verified
  slug: bash-file-exec-without-dash-e-masks-earlier-compound-command-failure
  phase: 2026-08-05-precision-chain-and-loop-breaker/2
  tags: 
    - bash
    - floor-scripts
    - check-vacuity
  created: 2026-08-05
  originSessionId: 428f1fab-f385-493a-952d-9509fdac5e10
  modified: 2026-08-06T06:32:45.387Z
---

A floor/acceptance script that file-threads an operator- or plan-supplied command via
`bash "$cmd_file"` (no `-e` on that invocation) inherits ordinary shell semantics: a
compound command `a; b` inside the file reports only `b`'s exit status. If `a` fails and
`b` succeeds, the whole file "passes" — a red intermediate statement is silently masked.

Found in `skills/war/assets/assert-done-when.sh` (WAR phase
2026-08-05-precision-chain-and-loop-breaker/Task 2.1) — verify still present before acting:
the command file is executed via `exec bash "$cmd_file_abs"` at line ~134, with no `-e` in
that invocation. This is **faithful to the slice, not a deviation** — it is identical to
what an operator typing the `Done when:` line at a shell would get, and identical to how
this engine's `plan.gate` has always been executed (same trust class, per the F6
adjudication — see [[audit-log-finding-can-be-stale-by-land-time]] for the general
finding-can-be-resolved-before-land caution, not directly applicable here since this one
was *never* meant to be fixed). Adding `bash -e` would be the **wrong** remedy: it would
false-red commands that legitimately use non-zero intermediate statuses (e.g. `grep ... ||
true; other-check`).

**Pattern:** when authoring a "run this operator-supplied command file verbatim" floor,
recognize that compound/multi-statement commands only ever report their *last* statement's
status — this is inherent to the design choice (trust the plan-author's shell semantics),
not a bug to fix. If a plan wants stronger per-statement checking, that needs a different
mechanism (e.g. a mutation-floor or explicit red/green backstop), not `-e` on the
file-exec. Worth field-data attention if `Done when:` compound-command masking ever causes
a real false-green in production.

> archived 2026-08-15: resolved — moved to archive
