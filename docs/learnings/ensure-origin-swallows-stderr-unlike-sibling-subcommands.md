---
name: ensure-origin-swallows-stderr-unlike-sibling-subcommands
description: "cmd_ensure_origin discards git push stderr behind a static die message, diverging from the _tmp_err capture idiom its siblings use"
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

# `cmd_ensure_origin` swallows git's real stderr; sibling subcommands capture it into the die message

**Confirmed at `skills/war/assets/provision-worktrees.sh`:** `cmd_ensure_origin` (lines 847-856) runs
`git push -u origin refs/heads/$resolved:refs/heads/$resolved >/dev/null 2>&1` and on failure dies with a
**static** message ("no origin remote, or the remote branch has diverged — refusing to force") that
never surfaces git's actual stderr. Its two siblings do differently:

- `cmd_resolve_working_branch` (lines 830-833) and `cmd_ensure_integration` (lines 227-230) both redirect
  stderr to a `mktemp` file (`_tmp_err`), and on failure `cat` that file's contents **into** the die
  message before removing it — the `_tmp_err` idiom.

This is a **diagnostic asymmetry**, not a correctness defect (the never-force invariant is intact either
way — a diverged remote is still refused, just without git's own explanation of *why* on the operator's
screen). Auditor disposition on this phase: Nit, `disposition: note` — not filed as a follow-up issue,
not blocking.

**How to apply:** if `ensure-origin` failures turn out to need better diagnosis in practice (e.g. an
operator can't tell "no remote" from "diverged" from the static string), retrofit the same `_tmp_err`
capture idiom used by `cmd_resolve_working_branch` / `cmd_ensure_integration` — don't invent a third
pattern.

Related: [[absent-origin-working-branch-baseline-also-forces-manual-land]] (the mechanism `ensure-origin`
exists to fix); [[provision-divergence-die-exit-7-unenumerated]] (same file, same
`cmd_ensure_integration`/sibling family, a different nit from the same p1t2 task — exit-code
enumeration rather than stderr capture).
