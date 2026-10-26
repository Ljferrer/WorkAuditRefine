---
name: loud-failure-parser-needs-its-block-end-grammar-in-the-plan-slice
description: "A loud-drop parser needs its block-end grammar in the plan slice, or audit finds one silent arm per round"
metadata:
  node_type: memory
  type: project
  keywords:
    - target-artifacts parser
    - loud failure
    - silent drop
    - block end rule
    - orphan row
    - rowless marker
    - ace rounds
    - closed grammar
    - line classes
    - fix the class
  provenance: agent-unverified
  slug: loud-failure-parser-needs-its-block-end-grammar-in-the-plan-slice
  phase: 2026-10-20-rea-artifact-evidence/phase-1 task 1.7
  tags:
    - war
    - plan-authoring
    - parser
    - audit-rounds
  created: 2026-10-20
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T06:59:43.149Z
---

# A parser that must fail loudly needs its block-end grammar in the plan slice

Audit finding resolved in a fix round before land. Recorded as pattern, not live instance.

**What happened.** The plan slice for Task 1.7 said the parser "extracts the block rows" and exits 2 on an unreadable file. It named no block-end rule, no orphan rule and no blank-line rule. The module header promised that a dropped artifact must be loud. A silently dropped row would run the evidence seat against fewer targets than the plan declares.

**The cost.** Task 1.7 took six fix rounds. Each round closed the one silent-drop arm the last audit named:
- a blank line under the marker;
- an absent block that still returned citing tasks;
- a marker with no rows;
- a blank line between rows;
- a row after a continuation line;
- a row-shaped orphan with a bad field.

The audit seats saw each arm as a new defect, and each was one. The plan had left the whole class open.

**Rule for plan authors.** When a slice says a scanner must never drop X silently, list the closed set of line classes it can meet. For a block parser that is: marker, row, blank, continuation, prose, heading, fence, end of file. State the outcome for each class. Add one fixture per class, and prove each guard red by removing it. Auditors then close the class in one round, not six. See [[fix-the-finding-class-not-the-site-and-prove-every-new-guard-red-before-commit]].

**Fix anchor (verified present at landed tip 4e33b6db).** The header of `skills/war/assets/target-artifacts.mjs` states the final rule: every row-shaped line in Part 1 reaches `rows`, or the parse throws. Blank lines under the marker and between rows are skipped. A `- path:` bullet that does not open as a row (`ROW_HEAD`) stays inert prose by design.
