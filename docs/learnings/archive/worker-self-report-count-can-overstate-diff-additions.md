---
name: worker-self-report-count-can-overstate-diff-additions
description: "Worker done-report counts can overstate diff; verify vs diff count"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: worker-self-report-count-can-overstate-diff-additions
  phase: guard-floor-and-scope-hook-coverage-completeness/t1.6
  keywords: 
    - worker done report
    - self-report inaccuracy
    - PASS FAIL counters
    - test case count mismatch
    - audit cross-check
    - diff line count
    - reporting discrepancy
  tags: 
    - audit
    - worker-report
    - test-fidelity
    - process
  created: 2026-07-10
  absence_note: "referent skills/war/assets/assert-test-in-diff.test.sh exists in this cwd but lacks the phase-1 Case 10 addition (t1.6) — servitor's worktree checkout may lag the landed branch; see [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]]. Verify Case 10 content directly against the landed branch before acting on specifics."
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
---

# A worker's done-report count claim can overstate what the diff actually adds

**The finding (two independent auditor cross-checks, t1.6, disposition note — Nit each):** the
worker's done-report summary for a new parity-test case (`assert-test-in-diff.test.sh`, Case 10)
claimed "10 new parity checks in Case 10." The actual diff adds exactly 5 pass/fail assertions
(labeled 10a–10e). The test code itself was correct, complete against the spec criterion, and
uncompromised — this was purely a self-report counting error with zero effect on the shipped test.

**The durable rule:** when auditing or reading a worker's done-report, treat a claimed count of
"N new checks/cases/assertions" as a **claim to verify**, not a fact to record. A worker can
overcount sub-cases (e.g. counting a case's setup, one PASS check, and one FAIL check as three
separate "checks," or double-counting a labeled sub-case like `10a`/`10b`). The gate/floor pass
verdict is driven by the live PASS/FAIL counters in the test run, never by the worker's prose
count — so a miscounted done-report is never load-bearing for merge/land, but propagating the wrong
number into a phase summary, PR body, or memory file would be. Cross-check any reported count
against a direct diff read or the test's own counter output before repeating it.

> archived 2026-07-13: resolved — moved to archive
