---
name: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
description: "PARTLY RESOLVED (#2615): run_shim rows use 10 s, run rows red past 540 s (#2724)"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint.core.test.sh
    - audit-tree-fingerprint.deadline.test.sh
    - audit-tree-fingerprint.marks.test.sh
    - deadline passed on a Bash call
    - environment-proceed re-merge
    - mid-round flag not caught
    - flaky test
    - git-error skip labelled wrong
    - WAR_FINGERPRINT_DEADLINE_SECONDS
    - polish discarded
    - gate_failed
    - phase-close absorb lost
    - timing-sensitive
    - load average
    - environment-class gate failure
    - environment-proceed re-land
    - held:escalation
    - plain sibling edit not caught beside odd names
    - fsmonitor hook ran or the round failed
    - fingerprint timeout
    - held:land-failed
    - land-advance recovery
  provenance: code-verified
  slug: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 (task p1-polish), recurrence at phase-2 (task 2.1), phase-5 (land gate), 2026-11-08-doc-truth-drift-and-adr-hygiene/phase-1 (land gate) and 2026-11-08-shell-floors-tests-and-lint/phase-1 (task 1.4, p1-polish)
  tags:
    - war
    - gate
    - flaky
    - phase-close
    - hypothesis
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-13T19:01:25.130Z
---

# The fingerprint test reds under heavy load

**PARTLY RESOLVED (#2615, PR #2722, 2026-11-08).** The old 2 s `run_shim` budget caused the d8 row (`git-error skip labelled wrong`) flake.
A 3 s stall on wtB's `git status` reproduced it: marker wtB, skipped list `wtB wtD wtS`.
Every `run_shim` row now uses a 10 s deadline (`SHIM_D`), and the d8 row carries that 3 s stall on every run, so it proves its own margin.
Rows that use `run`, not `run_shim`, are still open (#2724).
They red only when one hook run outlasts the hook's own 540 s default under extreme load.
Three such rows have red so far: c7 (`plain sibling edit not caught beside odd names`), g5 (`fsmonitor hook ran or the round failed`) and g3 (`mid-round flag not caught`).
A third shape reds in `audit-tree-fingerprint.marks.test.sh`: a pattern-value row gets the `!deadline passed on a Bash call` mark in place of its expected touched set.

**Sightings.** Phase 1 of 2026-11-04-late-defects-fixed-in-run: a docs-only polish gate failed the d8 row, and the engine discarded the polish (`polish-discarded`, `findings: []`), so its phase-close absorbs never landed.
Phase 2: task 2.1 (nothing under `hooks/`) failed the c7 row and then the d8 row; the environment-proceed re-merge hit the same load and the merge site held `held:escalation`.
Phase 5: the land gate failed the d8 row twice at load 45-62 and held `held:land-failed`; the Lead reran the gate at load about 12 (green), ran one `land-advance`, and dispatched the servitor by hand.
2026-11-08-doc-truth-drift-and-adr-hygiene phase 1: a docs-only land gate failed row 11 (g5) with `AUDIT-TAMPER: fingerprint timeout ... after 540s, deadline 540s` at 589 s.
The suite alone was green at base and at the land-merge tip (85/85 each, fresh TMPDIR), so the refiner classed it `environment`.
The single environment-proceed re-land then came back fully green (89/89) and landed with no Lead action.
2026-11-08-shell-floors-tests-and-lint phase 1, twice in the marks suite:
- Task 1.4 (touches no hook): case 67 failed after 612 s. The suite alone passed 130/130 in 52-57 s at base and at the tip. The environment-proceed re-merge was green.
- The p1-polish gate: case 39 failed after 667 s. The class-exempt polish was discarded, so its README and CLAUDE.md gate-doc absorbs never landed. See [[a-plan-slice-that-edits-claude-md-needs-a-lead-owner-because-the-worker-declines-it]].

**Evidence that it is load.** The refiner reran only this suite in phase 2:

| Run | Load average | Result |
|---|---|---|
| base cb7ce6c9, fresh TMPDIR | quiet | 231/231, 185 s |
| task tip, fresh TMPDIR | 28-55 | 230/231, 586 s |
| task tip, fresh TMPDIR | 17-23 | 231/231, 219 s |

Much of that load came from unrelated projects on the same machine. Which call stalls in the `run` rows is unproven.
In the marks sightings the suite took over 10 times its quiet run time, which fits the same load cause.

2026-11-08-shell-floors-tests-and-lint phase 2: the merge gate of task 2.2 (config and docs only) failed case 8 (g3) at 614 s, load about 29.
The suite alone was green at base and at the task tip (85/85 each, fresh TMPDIR), so the refiner classed it `environment`.
The single environment-proceed re-merge came back green (90/90) and merged with no Lead action.

**How to apply.**
- Before you launch a phase, or when a fingerprint row reds, check the load average (`uptime`).
- If it is above about 20 and other projects share the machine, wait or pause them before you retry the gate.
- Do not rerun the unchanged gate under the same load: the second failure is near certain and it spends the environment retry.
- Run the full gate once on a quiet machine, and treat that run as the proof.
- After a `polish-discarded`, re-route its absorbs by hand. The discard entry does not list them.
- File the flake once against the suite, not per row. A new red row in any of the four fingerprint suites is the same flake, not a new defect.

Locate-cue: verify still present before acting. The 540 s default and the `WAR_FINGERPRINT_DEADLINE_SECONDS` clamp are in `hooks/audit-tree-fingerprint.sh`. `run_shim`, `SHIM_D`, the d8 row, the g3 row and the g5 row (by label) are in `hooks/audit-tree-fingerprint.deadline.test.sh`, and the c7 row is in `hooks/audit-tree-fingerprint.operands.test.sh`. The `deadline passed on a Bash call` mark is set in `hooks/audit-tree-fingerprint.sh` and asserted in `hooks/audit-tree-fingerprint.marks.test.sh`. #2823 split the old single suite into four files, so row numbers changed.
Grounding note (2026-11-13): the marks-suite referents were read in the plan's `_refinery` worktree on the integration branch (tip 12fbb132, the source of land merge d2fafed7).

Related: [[held-escalation-lead-manual-completion]], [[never-follow-resumefromrunid-hint-after-a-land-failure]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead]].
