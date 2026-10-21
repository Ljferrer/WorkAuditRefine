---
name: evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass
description: "The MCP hook compares tool names only, so a foreign server's same-named tool and output_directory writes pass"
metadata:
  node_type: memory
  type: project
  keywords:
    - suffix keying
    - foreign server prefix
    - canary line
    - output_directory
    - pull_adb_file
    - extract_firmware
    - host write channel
    - REA allowlist snapshot
    - effect predicate
    - tool_input not checked
    - accepted residual
  provenance: code-verified
  slug: evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.2
  tags:
    - war
    - hooks
    - mcp
    - residual
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T16:42:27.127Z
---

# The MCP hook is name-only: three accepted residuals

`hooks/validate-evidence-auditor-mcp.sh` decides from the tool name and the `agent_type`. It never reads `tool_input`. Three gaps follow. The plan accepted all three (G4). Tests pin the first as intended behavior.

**1. A foreign server's tool can pass.** The hook compares the suffix after the second `__`. A tool named `mcp__<any server>__comment` or `mcp__<any server>__read_bytes` matches `mcp__rea__<suffix>` and passes for `war-worker` and `war-evidence-auditor`. The only signal is one canary line on stdout, naming the non-`rea` prefix. The header sentence "the suffix never widens the set" is true for the set of suffixes. It is not true for the set of servers. The evidence seat's card pins its MCP tools on its `tools:` line, so the platform limits that seat to `mcp__rea__` names. `war-worker` has no `tools:` line and inherits every registered server, so the hook is its only filter.

**2. Allowlisted tools can write to the host.** The allowlist is REA's effect predicate (never `mutatesTarget`, `executesForeignCode`, `mutatesDevice` or `destructive`). It is not a host-write ban. Six allowlisted tools write to a caller-named `output_directory`: `collect_adb_bugreport`, `export_web_scripts`, `extract_firmware`, `pull_adb_file`, `pull_adb_package`, `recover_javascript_sources`. The hook cannot check where they write. `agents/war-evidence-auditor.md` (section `## Read-only guard contract`) limits them to the run's evidence directory in prose only. The hook's own `RESIDUAL` header names the non-`mcp__` channels but not this one.

**3. The allowlist is a version snapshot.** The hook owns the list as full `mcp__rea__<tool>` names, measured at one REA version. A newer REA tool is denied until the name is added to the hook and to the card's `tools:` line. A test guards the two as set-equal, so one cannot move alone.

**How to apply.**
- Do not file residual 1 or 2 as a bug. Changing either means revisiting G4 and the test rows that pin it.
- To harden residual 1, the hook would have to pin the server prefix or read the registry. Neither exists today.
- To add a REA tool, edit the hook list and the card `tools:` line in one commit, then run `hooks/validate-evidence-auditor-mcp.test.sh`.

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the `REA_ALLOWLIST` literal and the `server != "rea"` canary branch. `hooks/validate-evidence-auditor-mcp.test.sh`, search `foreign server prefix, member suffix`. Found at landed tip 0d8a9fba, read through the run's `_refinery` worktree (HEAD equal to the tip).

Related: [[evidence-mcp-hook-blast-radius-exceeds-the-evidence-knob]].
