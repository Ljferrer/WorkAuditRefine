---
name: ensure-origin-swallows-stderr-unlike-sibling-subcommands
description: "RESOLVED: cmd_ensure_origin now captures git push stderr into its die message with the sibling _tmp_err idiom; reuse that idiom, don't invent a third"
metadata:
  type: project
  keywords:
    - ensure-origin
    - stderr
    - _tmp_err
    - die message
    - diagnostics
    - provision-worktrees.sh
    - git push
    - error capture idiom
  provenance: code-verified
  slug: ensure-origin-swallows-stderr-unlike-sibling-subcommands
  phase: checkout-guard/phase-1-t1
  tags:
    - shell
    - diagnostics
    - provisioning
    - nit
  created: 2026-07-06
---

# `cmd_ensure_origin` swallowed git's real stderr; sibling subcommands capture it into the die message

**Before the fix:** in `skills/war/assets/provision-worktrees.sh`, `cmd_ensure_origin` ran its
`git push -u origin …` with `>/dev/null 2>&1` and died with a **static** message, while its siblings
`cmd_resolve_working_branch` and `cmd_ensure_integration` capture stderr with the `_tmp_err` idiom.
A diagnostic asymmetry, not a correctness defect (Nit, `disposition: note`).

## Resolution (2026-07-12, plan `land-path-verification-hygiene`, #801)

The `_tmp_err` capture idiom was retrofitted around `cmd_ensure_origin`'s
`git push -u origin …` exactly as the sibling `cmd_ensure_integration` fetch and branch-create
sites use it: stdout still discarded, stderr to a `mktemp` file, and on failure the captured stderr
is **appended to** the die message before the temp file is removed on both paths — no third pattern
invented.

The static never-force guidance **SURVIVED** — it was NOT deleted or replaced. The die now reads
`…refusing to force). git: <git's own stderr>`: the operator keeps the never-force context AND now
also sees git's ground truth (e.g. `does not appear to be a git repository`). The push command, its
refspec, and the `-u` flag are byte-identical (ADR 0004 never-force). Regression coverage:
`provision-worktrees.core.test.sh` case `RWB.e` (a broken-origin-URL failure fixture); `RWB.c` stays the
success/idempotency control, unmodified.

**How to apply:** when a subcommand in this file needs better failure diagnosis, reuse the
`_tmp_err` capture idiom — don't invent a third pattern.

Related: [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]] (the mechanism `ensure-origin`
exists to fix); [[provision-divergence-die-exit-7-unenumerated]] (same file, same
`cmd_ensure_integration`/sibling family, a different nit — exit-code enumeration rather than stderr
capture).

> archived 2026-07-15: resolved — moved to archive
