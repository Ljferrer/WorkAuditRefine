---
name: adopted-pre-merged-task-gets-an-empty-three-dot-audit-diff-seats-must-judge-its-own-commit-range
description: "A task already on the integration tip gives the auditor an empty three-dot diff, so seats must judge its own commit range"
metadata:
  node_type: memory
  type: project
  keywords:
    - empty diff
    - three-dot diff
    - recovery relaunch
    - adopted integration branch
    - partial phase recovery
    - ADR 0035
    - pre-merged task
    - audit change set
    - vacuous approve
    - task branch equals integration tip
  provenance: code-verified
  slug: adopted-pre-merged-task-gets-an-empty-three-dot-audit-diff-seats-must-judge-its-own-commit-range
  phase: "2026-10-20-rea-artifact-evidence/phase-2 (tasks 2.2, 2.3)"
  tags:
    - war
    - audit
    - recovery
    - prompt-surface
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:43:10.014Z
---

# An adopted, already-merged task audits against an empty three-dot diff

**What happened.** Phase 2 ran as a full-DAG recovery relaunch that adopted the phase integration branch (ADR 0035). Task 2.1 came back `recovered:pre-merged`. Tasks 2.2 and 2.3 re-audited with their task branch at the same commit as the integration tip. Every seat that got a prompt for those tasks found `git diff <integration>...<task branch>` empty. About ten separate `note` findings across the correctness, security, test-fidelity, plan-faithfulness, cascading-impact and simplicity seats recorded this same fact.

**Why it is empty.** `auditPrompt` in `skills/war/assets/workflow-template.js` tells the seat that the three-dot diff is "the authoritative change set". A three-dot diff is merge-base to head. If the task branch is already contained in the integration branch, the merge-base is the head, and the diff has no lines. Nothing in the prompt says what to do then.

**The risk.** An empty diff reads as "nothing changed, nothing wrong". A seat that stops there approves a task it never read. The seats in this phase did not stop. They took the task's own commit range (the base before its first commit, up to the pinned sha) and judged that. One seat wrote the rule down: an empty integration diff alone does not prove the behavior exists.

**How to apply.**
- When a seat meets an empty three-dot diff on a recovered or adopted task, compare the two refs first. If both name the pin, judge `git diff <task base> <pin>` instead.
- Confirm the judged range covers the plan slice's Files list. A range that misses a listed file is a finding, not a pass.
- Do not file the empty diff as a defect of the task. It is a property of the relaunch.
- The engine does not detect this case. A follow-up could have the audit prompt name the task base sha. No issue was filed in this phase.

**Evidence trail.** The ref equality (task branch and integration branch at one sha) comes from the seats' own `git rev-parse` output in the audit log. Those task refs have since advanced through ace commits, so I could not re-read the equal state. The empty result follows from the definition of a three-dot diff, which is the inward check I could run. The prompt construct is code-verified.

**Locate-cue (verify still present before acting).** `skills/war/assets/workflow-template.js`, function `auditPrompt`, search `three-dot = merge-base..head`. Found at landed tip 0d8a9fba.
