---
name: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
description: "PARTLY RESOLVED (#2615): rows use 10 s, old row 112 reds past 540 s (#2724)"
metadata:
  node_type: memory
  type: project
  keywords:
    - audit-tree-fingerprint.core.test.sh
    - audit-tree-fingerprint.deadline.test.sh
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
    - held:land-failed
    - land-advance recovery
  provenance: agent-unverified
  slug: audit-tree-fingerprint-d8-row-can-red-under-gate-load-and-discard-a-docs-only-polish
  phase: 2026-11-04-late-defects-fixed-in-run/phase-1 (task p1-polish), recurrence at phase-2 (task 2.1) and phase-5 (land gate)
  tags:
    - war
    - gate
    - flaky
    - phase-close
    - hypothesis
  created: 2026-11-04
  originSessionId: f18978de-02f5-4ccd-9681-eb7dbaa3087b
  modified: 2026-11-08T00:00:00.000Z
---

# The fingerprint test reds under heavy load

**PARTLY RESOLVED (#2615, PR #2722, 2026-11-08).** The old 2 s `run_shim` budget caused the d8 row (`git-error skip labelled wrong`) flake.
A 3 s stall on wtB's `git status` reproduced it: marker wtB, skipped list `wtB wtD wtS`.
Every `run_shim` row now uses a 10 s deadline (`SHIM_D`), and the d8 row carries that 3 s stall on every run, so it proves its own margin.
The c7 row (`plain sibling edit not caught beside odd names`) is still open (#2724).
It uses `run`, not `run_shim`, so it reds only when one hook run outlasts the hook's own 540 s default under extreme load.

**Sightings.** Phase 1 of 2026-11-04-late-defects-fixed-in-run: a docs-only polish gate failed the d8 row, and the engine discarded the polish (`polish-discarded`, `findings: []`), so its phase-close absorbs never landed.
Phase 2: task 2.1 (nothing under `hooks/`) failed the c7 row and then the d8 row; the environment-proceed re-merge hit the same load and the merge site held `held:escalation`.
Phase 5: the land gate failed the d8 row twice at load 45-62 and held `held:land-failed`; the Lead reran the gate at load about 12 (green), ran one `land-advance`, and dispatched the servitor by hand.

**Evidence that it is load.** The refiner reran only this suite in phase 2:

| Run | Load average | Result |
|---|---|---|
| base cb7ce6c9, fresh TMPDIR | quiet | 231/231, 185 s |
| task tip, fresh TMPDIR | 28-55 | 230/231, 586 s |
| task tip, fresh TMPDIR | 17-23 | 231/231, 219 s |

Much of that load came from unrelated projects on the same machine. Which call stalls in the c7 row is unproven.

**How to apply.**
- Before you launch a phase, or when a fingerprint row reds, check the load average (`uptime`).
- If it is above about 20 and other projects share the machine, wait or pause them before you retry the gate.
- Do not rerun the unchanged gate under the same load: the second failure is near certain and it spends the environment retry.
- Run the full gate once on a quiet machine, and treat that run as the proof.
- After a `polish-discarded`, re-route its absorbs by hand. The discard entry does not list them.
- File the flake once against the suite, not per row.

Locate-cue: verify still present before acting. The 540 s default and the `WAR_FINGERPRINT_DEADLINE_SECONDS` clamp are in `hooks/audit-tree-fingerprint.sh`. `run_shim`, `SHIM_D` and the d8 row (by label) are in `hooks/audit-tree-fingerprint.deadline.test.sh`, and the c7 row is in `hooks/audit-tree-fingerprint.operands.test.sh`. #2823 split the old single suite into four files, so row numbers changed.

Related: [[held-escalation-lead-manual-completion]], [[never-follow-resumefromrunid-hint-after-a-land-failure]], [[audit-tree-fingerprint-hook-landed-with-known-fail-open-residuals]], [[terminal-phase-close-polish-absorb-finding-has-no-further-round-to-land-it]], [[polish-discarded-auditlog-entry-carries-no-findings-critical-major-ride-polish-rejected-instead]].
