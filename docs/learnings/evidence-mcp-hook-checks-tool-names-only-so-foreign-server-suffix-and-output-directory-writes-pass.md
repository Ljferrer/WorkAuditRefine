---
name: evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass
description: "The MCP hook keys on the tool suffix plus an output-path segment check, so a foreign server's same-named tool passes and a symlink under an evidence dir is unseen"
metadata:
  node_type: memory
  type: project
  keywords:
    - suffix keying
    - foreign server prefix
    - canary line
    - output_directory
    - destination
    - output-path check
    - segment containment
    - pull_adb_file
    - extract_firmware
    - host write channel
    - REA allowlist snapshot
    - DERIVED_AT_REA
    - effect predicate
    - accepted residual
  provenance: code-verified
  slug: evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.2, updated at phase-3 (task 3.1 rulings #2402 and #2403, p3-polish)
  tags:
    - war
    - hooks
    - mcp
    - residual
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-21T20:10:00.000Z
---

# The MCP hook is suffix-keyed with one input check: three accepted residuals

`hooks/validate-evidence-auditor-mcp.sh` decides from the tool name and the `agent_type`. The only `tool_input` it reads is the output-path pair (`output_directory`, `destination`), added by ruling #2402. Three gaps follow. The plan accepted all three (G4). Tests pin the first as intended behavior.

**1. A foreign server's tool can pass.** The hook compares the suffix after the second `__`. A tool named `mcp__<any server>__comment` or `mcp__<any server>__read_bytes` matches `mcp__rea__<suffix>` and passes for `war-worker` and `war-evidence-auditor`. The only signal is one canary line on stdout, naming the non-`rea` prefix. The header sentence "the suffix never widens the set" is true for the set of suffixes. It is not true for the set of servers. The evidence seat's card pins its MCP tools on its `tools:` line, so the platform limits that seat to `mcp__rea__` names. `war-worker` has no `tools:` line and inherits every registered server, so the hook is its only filter.

**2. Host writes are limited by an output-path check, not banned.** The allowlist is REA's effect predicate (never `mutatesTarget`, `executesForeignCode`, `mutatesDevice` or `destructive`). It is not a host-write ban. Six allowlisted tools write to a caller-named `output_directory`: `collect_adb_bugreport`, `export_web_scripts`, `extract_firmware`, `pull_adb_file`, `pull_adb_package`, `recover_javascript_sources`. Since ruling #2402 the hook's output-path check limits these writes. After membership passes, it loops over `tool_input.output_directory` and `tool_input.destination`. A present key must hold a non-empty string that carries the segment `/.claude/war/evidence/` and no `..` segment, else DENY. An absent key passes. The rule binds `war-evidence-auditor` and `war-worker` alike (the G2 bundle rule). Two residuals remain. The check is segment containment, not a `$MAIN` anchor: the hook cannot know `$MAIN`, so any `.claude/war/evidence/` path passes (another repo's, a task worktree's, `/tmp/x/.claude/war/evidence/`). The check is a string check: a symlink already present under an evidence-segment dir that points elsewhere is outside what it sees. `agents/war-evidence-auditor.md` (section `## Read-only guard contract`) names the hook denial and keeps the `$MAIN` placement as a card instruction to the seat.

**3. The allowlist is a version snapshot, pinned by `DERIVED_AT_REA`.** The hook owns the list as full `mcp__rea__<tool>` names, measured at one REA version. The hook header records that version on a fixed lead-in line, `Derived at rea-agents: `. `skills/war/assets/evidence-card-allowlist.test.mjs` pins the same literal as `DERIVED_AT_REA` and runs its predicate arms only at that version. At any other installed version the arms skip with a diagnostic that names both versions and says "re-derive the allowlist" (ruling #2403). `skills/war-room/assets/evidence-presence.test.mjs` extracts the header literal and asserts it equals `DERIVED_AT_REA`. A newer REA tool is denied until the name is added to the hook and to the card's `tools:` line. A test guards the two as set-equal, so one cannot move alone.

**How to apply.**
- Do not file residual 1 as a bug. Changing it means revisiting G4 and the test rows that pin it.
- Do not file the `$MAIN` anchor or the symlink gap of residual 2 as a bug. Ruling #2402 accepted both.
- To harden residual 1, the hook would have to pin the server prefix or read the registry. Neither exists today.
- To add a REA tool, edit the hook list and the card `tools:` line in one commit, then run `hooks/validate-evidence-auditor-mcp.test.sh`.
- On a REA upgrade, re-derive the allowlist and move `DERIVED_AT_REA` and the hook header's `Derived at rea-agents: ` line together.

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the `REA_ALLOWLIST` literal, the `server != "rea"` canary branch, the `for key in output_directory destination` loop and the `Derived at rea-agents: ` header line. `hooks/validate-evidence-auditor-mcp.test.sh`, search `foreign server prefix, member suffix` and `output_directory outside evidence dir denied`. `skills/war/assets/evidence-card-allowlist.test.mjs`, search `DERIVED_AT_REA`. Found at phase-3 integrated tip f39fca02, read in the p3-polish worktree.

Related: [[evidence-mcp-hook-blast-radius-exceeds-the-evidence-knob]].
