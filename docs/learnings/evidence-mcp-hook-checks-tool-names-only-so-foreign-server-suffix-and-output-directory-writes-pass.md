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
    - HOST_WRITE_KEY
    - tool_input type check
  provenance: code-verified
  slug: evidence-mcp-hook-checks-tool-names-only-so-foreign-server-suffix-and-output-directory-writes-pass
  phase: 2026-10-20-rea-artifact-evidence/phase-2 task 2.2, updated at phase-3 (task 3.1 rulings #2402 and #2403, p3-polish, servitor)
  tags:
    - war
    - hooks
    - mcp
    - residual
  created: 2026-10-21
  originSessionId: 18c261f6-f7c5-4bb3-8473-a40e81fb5346
  modified: 2026-10-22T15:48:10.008Z
---

# The MCP hook is suffix-keyed with one input check: accepted residuals

`hooks/validate-evidence-auditor-mcp.sh` decides from the tool name and the `agent_type`. Beyond a type check (a `tool_input` that is neither absent nor an object is denied), the only `tool_input` it reads is the output-path pair (`output_directory`, `destination`), added by ruling #2402. Three gaps follow. The plan accepted all three (G4). Tests pin the first as intended behavior. The slug keeps its phase-2 wording on purpose: a rename would break inbound links.

**1. A foreign server's tool can pass.** The hook compares the suffix after the second `__`. A tool named `mcp__<any server>__comment` or `mcp__<any server>__read_bytes` matches `mcp__rea__<suffix>` and passes for `war-worker` and `war-evidence-auditor`. The only signal is one canary line on stdout, naming the non-`rea` prefix. The header sentence "the suffix never widens the set" is true for the set of suffixes. It is not true for the set of servers. The evidence seat's card pins its MCP tools on its `tools:` line, so the platform limits that seat to `mcp__rea__` names. `war-worker` has no `tools:` line and inherits every registered server, so the hook is its only filter.

**2. Host writes are limited by an output-path check, not banned.** The allowlist is REA's effect predicate (never `mutatesTarget`, `executesForeignCode`, `mutatesDevice` or `destructive`). It is not a host-write ban. Six allowlisted tools write to a caller-named `output_directory`: `collect_adb_bugreport`, `export_web_scripts`, `extract_firmware`, `pull_adb_file`, `pull_adb_package`, `recover_javascript_sources`. Since ruling #2402 the hook's output-path check limits these writes. After membership passes, it loops over `tool_input.output_directory` and `tool_input.destination`. It reads each key by presence, never by value. A present key must hold a non-empty string that carries the segment `/.claude/war/evidence/` and no `..` segment, else DENY. A present empty string, `null`, `false`, a number, an array or an object is denied. An absent key passes. The rule binds `war-evidence-auditor` and `war-worker` alike (the G2 bundle rule). Three residuals remain:
- The check is segment containment, not a `$MAIN` anchor. The hook cannot know `$MAIN`, so any `.claude/war/evidence/` path passes (another repo's, a task worktree's, `/tmp/x/.claude/war/evidence/`). The hook header's `RESIDUAL (accepted)` section records this.
- The check is a string check. A symlink already present under an evidence-segment dir that points elsewhere is outside what it sees.
- Key completeness rests on a schema claim. The hook checks only the two keys ruling #2402 names. The allowlist test derives host-write tools from the `output_directory` schema key only (`HOST_WRITE_KEY`) and collects top-level keys, so a nested or differently named output path is invisible to both. `destination` has no oracle, and the hook applies it to every allowlisted tool.

`agents/war-evidence-auditor.md` (section `## Read-only guard contract`) says the hook denies an `output_directory` "outside the run's evidence dir". That wording is stronger than the hook, and ruling #2402 dictated it. Audit seats confirmed it as adjudicated text, not drift.

**3. The allowlist is a version snapshot, pinned by `DERIVED_AT_REA`.** The hook owns the list as full `mcp__rea__<tool>` names, measured at one REA version. The hook header records that version on a fixed lead-in line, `Derived at rea-agents: `. `skills/war/assets/evidence-card-allowlist.test.mjs` pins the same literal as `DERIVED_AT_REA` and runs its predicate arms only at that version. At any other installed version the arms skip with a diagnostic that names both versions and says "re-derive the allowlist" (ruling #2403). A broken oracle import skips too. So after a REA upgrade, a tool that turns `mutatesTarget` or `destructive` no longer reds the gate. The compensating controls are the launch warning in `skills/war-room/SKILL.md` and `skills/war/references/artifact-evidence-lead.md`, and the version-equality row in `skills/war-room/assets/evidence-presence.test.mjs`, which extracts the header literal and asserts it equals `DERIVED_AT_REA`. A newer REA tool is denied until the name is added to the hook and to the card's `tools:` line. A test guards the two as set-equal, so one cannot move alone.

**How to apply.**
- Do not file residual 1 as a bug. Changing it means revisiting G4 and the test rows that pin it.
- Do not file the `$MAIN` anchor, the symlink gap or the card-wording gap of residual 2 as a bug. Ruling #2402 accepted all three.
- If a REA re-derivation finds another host-write key, add it to the hook loop's key list and to the allowlist test's `HOST_WRITE_KEY` filter together.
- To harden residual 1, the hook would have to pin the server prefix or read the registry. Neither exists today.
- To add a REA tool, edit the hook list and the card `tools:` line in one commit, then run `hooks/validate-evidence-auditor-mcp.test.sh`.
- On a REA upgrade, re-derive the allowlist and move `DERIVED_AT_REA` and the hook header's `Derived at rea-agents: ` line together.

**Locate-cue (verify still present before acting).** `hooks/validate-evidence-auditor-mcp.sh`, the `REA_ALLOWLIST` literal, the `server != "rea"` canary branch, the `for key in output_directory destination` loop, the `RESIDUAL (accepted)` header section and the `Derived at rea-agents: ` header line (value 6.5.0). `hooks/validate-evidence-auditor-mcp.test.sh`, search `foreign server prefix, member suffix` and `output_directory outside evidence dir denied`. `skills/war/assets/evidence-card-allowlist.test.mjs`, search `DERIVED_AT_REA` and `HOST_WRITE_KEY`. Found at the phase-3 integration tip f94b8783, read through the run's `_refinery` worktree. That commit is the second parent of landed tip 6e655d6e, and the landed merge's other parent is an ancestor of it, so the two trees match by ancestry (tree not read directly).

Related: [[evidence-mcp-hook-blast-radius-exceeds-the-evidence-knob]].
