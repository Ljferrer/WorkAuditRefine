---
name: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
description: "The fingerprint test reds under heavy machine load on diffs that cannot touch the hook, and a quiet rerun passes"
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
    - load average
    - environment-class gate failure
    - held:escalation
    - plain sibling edit not caught beside odd names
  provenance: agent-unverified
  slug: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 (task p1-polish), recurrence at phase-2 (task 2.1)
  tags:
    - war
    - gate
    - flaky
    - phase-close
    - hypothesis
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-05T09:22:52.053Z
---

# The fingerprint test reds under heavy load (phase 1: mechanism is a hypothesis; phase 2: load is evidenced)

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

## Recurrence at phase 2 (task 2.1): a real task held, not only a polish discarded

**Observed.** Task 2.1 changed 12 files and none sit under `hooks/`.
Its merge gate failed twice on `hooks/audit-tree-fingerprint.test.sh`, in two different rows, so the cause is not one bad row.
The gate runs 36 jobs, and the fingerprint suite ran 1506 s in one of them.
First failing row: `FAIL 112 - plain sibling edit not caught beside odd names`.
That run's output carried `AUDIT-TAMPER: fingerprint timeout (... still hashing after 540s, deadline 540s ...)`.
Row 112 does not set the 2 s override, so the hook's own 540 s default fired.
Second failing row: `FAIL 166 - git-error skip labelled wrong` (the original d8 row), 230/231, 586 s.

**Evidence that it is load.** The refiner reran only this suite:

| Run | Load average | Result |
|---|---|---|
| base cb7ce6c9, fresh TMPDIR | quiet | 231/231, 185 s |
| task tip, fresh TMPDIR | 28-55 | 230/231, 586 s |
| task tip, fresh TMPDIR | 17-23 | 231/231, 219 s |

Much of that load came from unrelated projects on the same machine.
The refute pass: the diff touches nothing under `hooks/`, and the same tip passes on a quieter machine.
What stays unproven: which call stalls. The mechanism is still a hypothesis.

**Cost.** The first failure was classed environment, so the engine spent its one environment-proceed re-merge.
The re-merge hit the same load and failed the same way, so the merge site hard-escalated (`held:escalation`).
The re-merge gate alone ran 1506 s. The phase did not land until the Lead intervened.
See [[held-escalation-lead-manual-completion]] for what the Lead then did.

**How to apply.**
Before you launch a phase, or when a fingerprint row reds, check the load average (`uptime`).
If it is above about 20 and other projects share the machine, wait or pause them before you retry the gate.
Do not rerun the unchanged gate under the same load: the second failure is certain and it spends the environment retry.
Run the full gate once on a quiet machine, and treat that run as the proof.
File the flake once against the suite, not per row. Issue #2615 holds the phase-2 sighting.

Locate-cue: verify still present before acting. The 540 s default and the `WAR_FINGERPRINT_DEADLINE_SECONDS` clamp are in `hooks/audit-tree-fingerprint.sh`. The rows are in `hooks/audit-tree-fingerprint.test.sh`. Found at landed tip fc9cb08c, phase 2 of 2026-11-04-late-defects-fixed-in-run.

Related: [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead]].
