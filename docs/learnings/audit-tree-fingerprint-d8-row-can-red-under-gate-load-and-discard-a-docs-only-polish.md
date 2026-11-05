---
name: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
description: "HYPOTHESIS: the fingerprint test's 2-second git-error-skip row can red under gate load and discard a docs-only polish"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint.test.sh
    - flaky test
    - git-error skip labelled wrong
    - WAR_FINGERPRINT_DEADLINE_SECONDS
    - polish discarded
    - gate_failed
    - phase-close absorb lost
    - timing-sensitive
  provenance: agent-unverified
  slug: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 (task p1-polish)
  tags:
    - war
    - gate
    - flaky
    - phase-close
    - hypothesis
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T06:04:27.641Z
---

# HYPOTHESIS: the fingerprint test's git-error-skip row can red under gate load

**This is a hypothesis note.** No inward refute pass ran, and no rerun proved the flake.

**Observed.** In phase 1, the polish branch changed docs only (`CONTEXT.md`, `skills/war/references/staged-script.md`, ADR 0037).
Its gate failed on one case of `hooks/audit-tree-fingerprint.test.sh`: `FAIL 166 - git-error skip labelled wrong`.
The suite took 236 s in a 36-job gate.
The row expects the watchdog to fire on the last worktree, wtS.
The observed marker named wtB, and the skipped list was `wtB wtD wtS`.

**Why it may be timing.** `run_shim` sets `WAR_FINGERPRINT_DEADLINE_SECONDS=2` for the whole hook run.
The d8 row (`SHIM_FAIL="$WTA status" SHIM_SLOW="$WTS status"`) needs real `git status` calls on the earlier worktrees to finish inside that budget.
Under parallel gate load, those calls can plausibly take longer than 2 s, so the deadline fires at wtB.
A docs-only diff cannot change the hook's behavior.

**Cost.** The engine discarded the polish (`polish-discarded`, `findings: []`), and every phase-close absorb it carried did not land.
At tip 99d325fd, ADR 0037 has no 2026-11-04 indent-strip amendment.
At the same tip, `CONTEXT.md` still says "comment-stripped substitution".

**How to apply.** If this row reds on a diff that cannot touch the hook, rerun the suite alone before you blame the diff.
If it reproduces only under load, file a flake issue against the row's deadline.
After a `polish-discarded`, re-route its absorbs by hand.
The discard entry does not list them.

Locate-cue: verify still present before acting. `run_shim` and the d8 row are in `hooks/audit-tree-fingerprint.test.sh` @ phase 1 of 2026-11-04-late-defects-fixed-in-run.
Read in the run's `_refinery` worktree at 6c4f0f4e, which has the same tree as the land merge 99d325fd.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead]].
