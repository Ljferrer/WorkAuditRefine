---
name: evidence-mcp-hook-blast-radius-exceeds-the-evidence-knob
description: The MCP hook locks war-worker to REA tools in every run and denies every mcp__ call when jq is missing
metadata:
  node_type: memory
  type: project
  keywords:
    - validate-evidence-auditor-mcp
    - mcp__ hook
    - war-worker MCP denied
    - run.evidence off
    - mcp__github denied
    - jq missing
    - exit 2 fail closed
    - PreToolUse matcher
    - REA allowlist
    - worker tools
  provenance: code-verified
  slug: evidence-mcp-hook-blast-radius-exceeds-the-evidence-knob
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.2
  tags:
    - war
    - hooks
    - mcp
    - guard
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:42:00.332Z
---

# The MCP hook acts in every run, not only when `run.evidence` is on

`hooks/validate-evidence-auditor-mcp.sh` is wired in `hooks/hooks.json` under the matcher `mcp__.*`. It reads the hook payload's `agent_type`. It does not read `run.evidence`, `args.evidence`, or any plan state.

**1. Every worker loses every non-REA MCP tool.** The `*war-evidence-auditor|*war-worker` arm lets only the REA allowlist through. `agents/war-worker.md` has no `tools:` line, so a worker inherits every registered MCP server. After this hook, a worker call to `mcp__github__get_issue` or any other non-REA tool exits 2. This holds on a run with evidence off. The plan accepted it (G4, D14). Prompts stay byte-identical when evidence is off (G3). Hook behavior does not.

**2. A host without `jq` denies every MCP call, for every agent type.** The `jq` check runs before the `agent_type` routing. A missing `jq` exits 2 for the main session and for non-WAR agents too. The deny message names the cause. This is fail-closed by design: only exit 2 blocks a PreToolUse call, so an unexpected failure must fold into 2.

**How to apply.**
- If a worker task needs a non-REA MCP tool, it will be denied. Route that need through the Lead or a non-MCP path.
- If MCP tools stop working for the main session on a new host, check `command -v jq` first.
- The channels outside the matcher are a documented residual: a Bash call to the `rea` CLI, and the built-in MCP resource tools. `war-worker` and `war-refiner` inherit both channels.

**Locate-cue (verify still present before acting).** In `hooks/validate-evidence-auditor-mcp.sh`, search the `case "$atype" in` block and the line `command -v jq`. The test row for the missing-`jq` branch is in `hooks/validate-evidence-auditor-mcp.test.sh`, searching `jq is not installed`. Found at landed tip 0d8a9fba, read through the run's `_refinery` worktree (HEAD equal to the tip).
