---
name: a-card-sentence-that-reads-an-absent-prompt-line-as-disabled-needs-the-line-at-every-worker-dispatch-site
description: A worker card that reads a missing MEMORY QUERY line as memory disabled is false at any dispatch site that omits the line
metadata:
  node_type: memory
  type: project
  keywords:
    - MEMORY_QUERY_TOOL_LINE
    - MEMORY QUERY line
    - fix-round worker prompt
    - dispatch site coverage
    - ace prompt
    - phase-close sweep
    - card absence rule
    - prompt parity
    - workflow-template
    - memory disabled
  provenance: agent-unverified
  slug: a-card-sentence-that-reads-an-absent-prompt-line-as-disabled-needs-the-line-at-every-worker-dispatch-site
  phase: 2026-10-27-memory-query-mcp-tool/phase-1 task 1.3
  tags:
    - war
    - prompt-architecture
    - workflow-template
    - dispatch
    - memory
  created: 2026-10-27
  originSessionId: c3af584e-8b97-41a9-9abc-594c7cf1d33c
  modified: 2026-10-27T13:45:21.569Z
---

# A prompt line that a card keys on must reach every dispatch site

*Audit finding resolved in a fix round before land — recorded as pattern, not live instance.*

**The pattern.** `agents/war-worker.md` says the worker may call the memory query tool with the roots its spawn prompt's MEMORY QUERY line carries, and "when that line is absent, memory is disabled for this run and you skip the call". The first cut of task 1.3 added `MEMORY_QUERY_TOOL_LINE` only to the primary `work:<id>` worker prompt. `workflow-template.js` builds its own worker-family prompts at other sites: FIX_NEEDED, the add-test, make-pass, cite-budget and package-it floor fixes, the three ace prompts, the phase-close sweep and the terminal pass. A fresh fix-round worker in a memory-enabled run then read a false rule and skipped the tool. The retired Bash self-query sentence was unconditional, so those workers lost a capability they had before.

**Why the gate stayed green.** End states 6 and 9 test the primary worker prompt and the four seat kinds. They do not test each dispatch family.

**The fix shape.** Append `MEMORY_QUERY_TOOL_LINE` at each worker-family dispatch site. It renders as an empty string when `memoryLocalRoot` is not threaded, so a memory-less run stays byte-identical. The comment above the const now names the covered families.

**How to apply.**
- If a standing card keys behavior on the presence of a dispatched line, list every dispatch family that builds a prompt for that role, and add the line to each.
- Add a test row per family, or a census that fails when a worker-family prompt builder lacks the line.
- A line that a card reads as "absent means off" is stronger than a plain hint. Treat it as a contract.

Same family: [[standing-instruction-vs-dispatched-prompt-coverage-split]].

**Locate-cue (verify the fixed form is still present before acting).** `skills/war/assets/workflow-template.js`, the `MEMORY_QUERY_TOOL_LINE` const and its comment, and each prompt build that appends it. `agents/war-worker.md`, the Prior-lessons sentence. Seen in the fixed form at landed tip fcdc744e, read through the run's `_refinery` worktree.
