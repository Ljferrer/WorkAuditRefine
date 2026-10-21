#!/usr/bin/env bash
# WAR evidence-auditor MCP guard (PreToolUse: mcp__.*).
# Plan 2026-10-20-rea-artifact-evidence Task 2.2 (D3, D14, D18; PIN-11, PIN-15; G4).
#
# PURPOSE
#   The MCP arm of the capability-first confinement (ADR 0002). Keyed on
#   `agent_type` from the hook payload, suffix-anchored (`*war-<role>`, never
#   `*war-<role>*`, so a `war-<role>-helper` decoration falls through):
#     - war-auditor, war-servitor, war-refiner : DENY every MCP tool.
#     - war-evidence-auditor, war-worker       : ALLOW only the REA allowlist
#                                               below, and only with an output
#                                               path under the evidence dir;
#                                               DENY anything else.
#     - every other agent_type (the main session with no agent_type, any
#       non-WAR agent)                         : pass-through, exit 0.
#
# RESIDUAL (accepted)
#   This guard sees only tool calls whose name matches the hooks.json matcher
#   `mcp__.*`. Outside that matcher sit a Bash call to the REA CLI (`rea ...`,
#   the binary `rea doctor --json` probes for presence) and the built-in MCP
#   resource tools (ListMcpResourcesTool, ReadMcpResourceTool). The cards
#   agents/war-worker.md and agents/war-refiner.md carry no `tools:` line, so
#   war-worker and war-refiner inherit the Bash channel and the resource-tool
#   channel, and neither channel reaches this hook.
#   The residual is accepted: G4 confines the MCP tool channel, and Bash for
#   those roles is covered only advisorily (warn-bash-write-scope.sh).
#   war-servitor is not affected: its card pins `tools:` without Bash and
#   without the resource tools. war-auditor and war-evidence-auditor carry
#   Bash, but validate-auditor-git.sh denies every non-git command for them,
#   so `rea ...` never runs there; neither card lists the resource tools.
#
# ALLOWLIST (G4)
#   This file OWNS the allowlist literal, as full `mcp__rea__<tool>` names:
#   the tools that pass REA's effect predicate (never mutatesTarget,
#   executesForeignCode, mutatesDevice or destructive) at the REA version
#   measured at land. The card `agents/war-evidence-auditor.md` carries the
#   same names on its `tools:` line and is guarded set-equal to this list
#   (validate-evidence-auditor-mcp.test.sh); the presence tool
#   `mcp__rea__binary_session` is guarded as a member there and in
#   evidence-presence.test.mjs. Extraction contract: one full name per line
#   between the REA_ALLOWLIST quotes, nothing else on the line.
#   Derived at rea-agents: 6.5.0
#   The line above is the derivation version, in a fixed lead-in:
#   evidence-card-allowlist.test.mjs pins DERIVED_AT_REA to it and runs its
#   predicate arms only at that version; evidence-presence.test.mjs extracts
#   it and asserts equality. A REA upgrade re-derives the allowlist and moves
#   both literals together.
#
#   Output-path check: after membership passes, a `tool_input.output_directory`
#   (or `destination`, where a contract uses it) must name a path under the
#   run's evidence dir: the value carries the segment `/.claude/war/evidence/`
#   and no `..` segment, else DENY. The rule binds war-evidence-auditor and
#   war-worker alike (the G2 bundle rule). An absent key passes.
#
# SUFFIX KEYING + CANARY
#   A tool name is `mcp__<server>__<tool>`. The compare uses the suffix after
#   the second `__`, so a server registered under another name than `rea`
#   (`mcp__rea-local__binary_session`) still matches its allowlist entry. When
#   the server prefix is not `rea` the guard prints ONE canary line on stdout
#   naming the live prefix, then decides as usual. The suffix never widens the
#   set: a non-member stays denied under any prefix.
#
# EXIT CONTRACT
#   0 = allow or pass-through. 2 = deny, OR a parse / infra error (payload not
#   JSON, jq missing, no tool_name, a tool_name that is not
#   `mcp__<server>__<tool>`, a tool_name carrying a newline). The jq check
#   runs before the agent_type routing, so a host without jq exits 2 on every
#   `mcp__.*` call, in the main session and in non-WAR agents too; the deny
#   message names the cause. Never any other code: `set -E` + the ERR trap
#   fold an unexpected failure into 2, because a non-2 PreToolUse exit does
#   NOT block the tool call (fail-closed, never a pass). Proof rows: the
#   `ERR trap` rows in validate-evidence-auditor-mcp.test.sh Group E.
#
# CONSTRAINTS
#   Runs on macOS bash 3.2.57 — no globstar, no associative arrays, no ${,,}.
#   Reads the payload via jq (already a hook dependency).
set -Eeuo pipefail

infra() { echo "WAR: evidence-auditor mcp guard: $1" >&2; exit 2; }
deny()  { echo "WAR: evidence-auditor mcp guard DENIED: $1" >&2; exit 2; }
trap 'infra "unexpected failure (exit folded to 2, fail-closed)"' ERR

command -v jq >/dev/null 2>&1 || infra "jq is not installed"

input="$(cat)"
printf '%s' "$input" | jq -e . >/dev/null 2>&1 || infra "payload is not JSON"
get() { printf '%s' "$input" | jq -r "$1 // empty"; }

atype="$(get '.agent_type')"
tool="$(get '.tool_name')"

# Route by agent type first: the three MCP-less roles deny before any tool
# parsing (the deny holds whatever the tool name is), the two allowlisted
# roles fall through to the suffix check, everything else passes through.
case "$atype" in
  *war-auditor|*war-servitor|*war-refiner)
    deny "agent type '$atype' reaches no MCP tool (capability-first confinement, ADR 0002); refusing '$tool'." ;;
  *war-evidence-auditor|*war-worker) ;;
  *) exit 0 ;;
esac

# ---------------------------------------------------------------------------
# REA allowlist: full `mcp__rea__<tool>` names, one per line, nothing else on
# the line (the extraction contract the set-equality tests read).
# ---------------------------------------------------------------------------
REA_ALLOWLIST='
mcp__rea__address_name
mcp__rea__address_to_file_offset
mcp__rea__analyze_function
mcp__rea__analyze_javascript_application
mcp__rea__analyze_swift_types
mcp__rea__analyze_web_bundle
mcp__rea__batch_decompile
mcp__rea__binary_overview
mcp__rea__binary_session
mcp__rea__build_call_path
mcp__rea__build_reconstruction_obligation_ledger
mcp__rea__collect_adb_bugreport
mcp__rea__comment
mcp__rea__compare_application_versions
mcp__rea__compare_artifacts
mcp__rea__compare_bundles
mcp__rea__compare_functions
mcp__rea__compare_javascript_export_shapes
mcp__rea__compare_managed_members
mcp__rea__compare_process_captures
mcp__rea__compare_source_to_bundle
mcp__rea__compare_wasm_interfaces
mcp__rea__compare_web_captures
mcp__rea__compare_web_screenshots
mcp__rea__correlate_static_and_runtime
mcp__rea__current_address
mcp__rea__current_document
mcp__rea__current_procedure
mcp__rea__decode_android_resources
mcp__rea__decode_interface_builder
mcp__rea__decode_signal_recording
mcp__rea__decompile_jeb_item
mcp__rea__demangle_swift
mcp__rea__discover_webmcp_tools
mcp__rea__evaluate_reconstruction_coverage
mcp__rea__export_web_scripts
mcp__rea__extract_artifact
mcp__rea__extract_firmware
mcp__rea__find_changed_behavior
mcp__rea__find_xrefs_to_name
mcp__rea__frida_session_status
mcp__rea__gdb_session_status
mcp__rea__get_call_graph
mcp__rea__get_evidence_bundle
mcp__rea__get_navigation_context
mcp__rea__get_objc_classes
mcp__rea__get_objc_protocols
mcp__rea__goto_address
mcp__rea__identify_flutter_build
mcp__rea__import_evidence_bundle
mcp__rea__import_managed_reconstruction
mcp__rea__inline_comment
mcp__rea__inspect_adb_client
mcp__rea__inspect_adb_device
mcp__rea__inspect_adb_display
mcp__rea__inspect_adb_package
mcp__rea__inspect_adb_window
mcp__rea__inspect_address_context
mcp__rea__inspect_analysis_view
mcp__rea__inspect_android_class
mcp__rea__inspect_android_method
mcp__rea__inspect_android_package
mcp__rea__inspect_apktool_client
mcp__rea__inspect_artifact
mcp__rea__inspect_asset_catalog
mcp__rea__inspect_binary_layout
mcp__rea__inspect_dart_aot
mcp__rea__inspect_electron_fuses
mcp__rea__inspect_electron_page
mcp__rea__inspect_evm_interface
mcp__rea__inspect_firmware_regions
mcp__rea__inspect_go_binary
mcp__rea__inspect_jeb_client
mcp__rea__inspect_keyed_archive
mcp__rea__inspect_macho
mcp__rea__inspect_managed_artifact
mcp__rea__inspect_managed_members
mcp__rea__inspect_managed_native_boundaries
mcp__rea__inspect_native_api
mcp__rea__inspect_native_data_type
mcp__rea__inspect_native_dispatch_metadata
mcp__rea__inspect_native_instruction
mcp__rea__inspect_native_load_image
mcp__rea__inspect_packet_capture
mcp__rea__inspect_packet_fields
mcp__rea__inspect_pcap_capture
mcp__rea__inspect_pcap_client
mcp__rea__inspect_pe_resources
mcp__rea__inspect_plist
mcp__rea__inspect_recorded_crash
mcp__rea__inspect_rust_binary
mcp__rea__inspect_signal_decoders
mcp__rea__inspect_signature
mcp__rea__inspect_sqlite_database
mcp__rea__inspect_wasm_artifact
mcp__rea__inspect_web_event_listeners
mcp__rea__inspect_web_network_capture
mcp__rea__inspect_web_page
mcp__rea__inspect_with_objdump
mcp__rea__list_adb_devices
mcp__rea__list_adb_directory
mcp__rea__list_adb_features
mcp__rea__list_adb_packages
mcp__rea__list_adb_processes
mcp__rea__list_adb_services
mcp__rea__list_architectures
mcp__rea__list_bookmarks
mcp__rea__list_browser_targets
mcp__rea__list_cutter_sessions
mcp__rea__list_documents
mcp__rea__list_electron_targets
mcp__rea__list_frida_devices
mcp__rea__list_frida_processes
mcp__rea__list_javascript_runtime_targets
mcp__rea__list_jeb_units
mcp__rea__list_names
mcp__rea__list_procedures
mcp__rea__list_segments
mcp__rea__list_strings
mcp__rea__list_unknowns
mcp__rea__next_address
mcp__rea__observe_javascript_runtime
mcp__rea__observe_native_ui
mcp__rea__observe_web_session
mcp__rea__open_binary
mcp__rea__open_jeb_project
mcp__rea__prev_address
mcp__rea__procedure_address
mcp__rea__procedure_assembly
mcp__rea__procedure_callees
mcp__rea__procedure_callers
mcp__rea__procedure_info
mcp__rea__procedure_pseudo_code
mcp__rea__procedure_references
mcp__rea__project_android_application_graph
mcp__rea__project_apple_application_graph
mcp__rea__project_harmony_application_graph
mcp__rea__project_managed_application_graph
mcp__rea__pull_adb_file
mcp__rea__pull_adb_package
mcp__rea__read_adb_logcat
mcp__rea__read_adb_setting
mcp__rea__read_bytes
mcp__rea__read_function_instructions
mcp__rea__reconcile_javascript_runtime
mcp__rea__record_unknown
mcp__rea__recover_javascript_sources
mcp__rea__resolve_adb_packages
mcp__rea__resolve_containing_procedure
mcp__rea__resolve_native_call_targets
mcp__rea__rizin_debug_session_status
mcp__rea__search_android_classes
mcp__rea__search_bytes
mcp__rea__search_procedures
mcp__rea__search_strings
mcp__rea__start_gdb_session
mcp__rea__trace_android_references
mcp__rea__trace_application_feature
mcp__rea__trace_call_path
mcp__rea__trace_dylib_resolution
mcp__rea__trace_feature
mcp__rea__trace_javascript_semantics
mcp__rea__trace_native_ui_action
mcp__rea__trace_native_values
mcp__rea__trace_web_module_imports
mcp__rea__trace_web_source_location
mcp__rea__update_unknown
mcp__rea__verify_managed_native_boundaries
mcp__rea__verify_reconstruction
mcp__rea__verify_unknown_resolution
mcp__rea__xrefs
'

# ---------------------------------------------------------------------------
# Parse `mcp__<server>__<tool>`: fail closed on any other shape. A newline
# inside the name is rejected first: the membership match below delimits
# allowlist lines by newline, so a name that splices two adjacent members
# (`mcp__rea__binary_overview`, newline, `mcp__rea__binary_session`) would
# otherwise match the block as a whole. This reads $tool itself; $(...)
# strips only trailing newlines, so an embedded one survives to here.
# ---------------------------------------------------------------------------
[ -z "$tool" ] && infra "no tool_name in the payload"
case "$tool" in
  *$'\n'*) infra "tool_name carries a newline; not an mcp__<server>__<tool> name" ;;
  mcp__*__*) ;;
  *) infra "tool_name '$tool' is not an mcp__<server>__<tool> name" ;;
esac
rest="${tool#mcp__}"
server="${rest%%__*}"
suffix="${rest#*__}"
if [ -z "$server" ] || [ -z "$suffix" ]; then
  infra "tool_name '$tool' is not an mcp__<server>__<tool> name (empty server or tool part)"
fi

# Live-name canary: the registered server prefix differs from `rea`.
if [ "$server" != "rea" ]; then
  echo "WAR: evidence-auditor mcp guard canary: server prefix '$server' is not 'rea' (tool '$tool'); matching the suffix '$suffix' against the REA allowlist."
fi

# Membership: the full name `mcp__rea__<suffix>` must sit on its own line in
# the allowlist (newline-delimited exact match, no substring capture). The
# suffix is quoted so a glob character in it matches literally; the newline
# reject above keeps a name from spanning two lines.
case "$REA_ALLOWLIST" in
  *$'\n'"mcp__rea__$suffix"$'\n'*) ;;
  *) deny "tool '$tool' (suffix '$suffix') is not on the REA allowlist for agent type '$atype'; the allowlist is the REA effect predicate (never mutatesTarget, executesForeignCode, mutatesDevice or destructive)." ;;
esac

# ---------------------------------------------------------------------------
# Output-path check (G2 bundle rule): a member that takes a caller-named output
# path may name only a path under the run's evidence dir. The value must carry
# the segment `/.claude/war/evidence/` and no `..` segment (the value is
# wrapped in `/` so a leading or trailing `..` is a segment too; `v1..v2` is a
# name, not a segment). An absent or empty key passes. A non-object tool_input
# makes jq fail, and the ERR trap folds that to 2.
# ---------------------------------------------------------------------------
for key in output_directory destination; do
  val="$(get ".tool_input.$key")"
  if [ -n "$val" ]; then
    case "$val" in
      *"/.claude/war/evidence/"*) ;;
      *) deny "tool '$tool' names $key '$val' outside the run's evidence dir (a path under /.claude/war/evidence/ only; the G2 bundle rule) for agent type '$atype'." ;;
    esac
    case "/$val/" in
      *"/../"*) deny "tool '$tool' names $key '$val' with a .. segment (the G2 bundle rule) for agent type '$atype'." ;;
    esac
  fi
done
exit 0
