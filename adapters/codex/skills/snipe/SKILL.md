---
name: snipe
description: Explicit one-shot read-only WAR-style audit of a pinned diff through 1-5 independent Codex lenses. Reports only; never fixes, files, comments, widens, or gates.
---

# Snipe for Codex

Run only when the user explicitly invokes `$snipe`, the installed plugin's qualified name `$work-audit-refine-snipe:snipe`, or selects Snipe from the skill picker. Convene one to five independent read-only audit seats, report their evidence, and stop. This is not a WAR phase and grants no authority to change the repository or external systems.

For the installed plugin, use the qualified name or picker selection: the host registers this skill as `work-audit-refine-snipe:snipe`, and bare `$snipe` text may not resolve when explicit-only skills are omitted from the default catalog. Do not treat a missing default catalog entry as proof that the plugin is uninstalled. If skill resolution or the owned runner is unavailable, report the limitation and stop; never substitute manual or unconstrained auditor agents.

## Request

Use the shared seat/lens grammar for `rawArgs`; do not parse it yourself. `rawArgs` contains only a seat count and/or lens list. Put review scope in the structured target envelope:

- omit `target` (or use `{ "type": "default" }`) for the clean default-branch comparison or dirty advisory scope;
- `{ "type": "ref", "ref": "..." }` for a merge-base comparison to HEAD;
- `{ "type": "range", "expression": "base..head" }` for exact two-dot semantics;
- `{ "type": "merge-base", "base": "...", "head": "..." }` for an explicit merge-base comparison;
- `{ "type": "pr", "url": "https://github.com/OWNER/REPO/pull/N", "base": "trusted-base-ref-or-sha" }` only when the matching local PR head object already exists.

Put each path filter in the separate `paths` array. Never interpolate targets or paths into shell commands. Select the auditor profile in this order:

1. If the user explicitly selects an auditor model and effort, put that complete pair in `profile`, for example `{"model":"gpt-5.6-sol","effort":"medium"}`. No invoking-task metadata is required for an explicit profile. Model/effort are separate from the seat/lens-only `rawArgs`.
2. Otherwise, when the exact active task model and effort are exposed, put that pair in `inheritedProfile`.
3. If neither is available, run `node <this-skill>/assets/snipe-runner.mjs --list-profiles` with the same coordinator launch permission described below. Show the returned choices and ask the user which model and effort to use for the auditors. Continue when they answer; missing task metadata is not a permanent blocker. Do not select a fallback silently.

Omit `supportedProfiles` in CLI request files: the runner queries the selected Codex binary's read-only `model/list` endpoint and validates the chosen pair before launching any auditor. Never fabricate a supported-profile map. A catalog failure or unsupported pair is a visible refusal, not a downgrade. A missing trusted PR base still requires operator clarification.

## Coordinate

The runner resolves one executable for discovery and auditor seats: explicit `--codex-path /absolute/path/to/codex`, then `SNIPE_CODEX_BIN`, then the Desktop bundle identified by the host's `CODEX_MCP_NODE_PATH` runtime hint, then an executable on PATH. Both `--request` and `--list-profiles` accept `--codex-path`. Do not assume `command -v codex` succeeds in Desktop. If resolution fails, the diagnostic lists attempted paths; ask for the host's absolute Codex executable path and supply it with `--codex-path`. Do not guess an application installation directory or install another CLI. An invalid explicit override fails instead of silently selecting another executable.

Create the JSON request in an OS temporary directory, not the target repository. Invoke `node <this-skill>/assets/snipe-runner.mjs --request <absolute-request-file>`, optionally adding `--capacity N` when host capacity is known, then remove the temporary request file. The runner resolves the scope once, passes literal Git arguments, launches fresh `codex exec` processes with read-only sandboxing and approvals disabled, removes MCP configuration, bounds output/time, accounts for every seat, and returns the final scope-stability check.

In a sandboxed Codex task, request host permission for this coordinator command on its **first invocation**: use the shell tool's `sandbox_permissions: "require_escalated"` with a justification explaining that Codex subprocess initialization needs host app-server/state access while each auditor remains read-only. This is permission for the coordinator launch, not for auditor actions. Do not launch it inside the enclosing workspace sandbox first: nested Codex initialization can fail before its own read-only sandbox starts. If the host does not expose this permission mechanism or denies the request, report that the panel could not start and stop. Never retry a denied launch or a failed seat with broader permissions.

Saved global configuration and historical transcripts are not proof of the active task profile. Do not search private session logs to infer it; use an explicit auditor profile when active metadata is unavailable. The report labels the configured auditor profile, not an independently observed model identity.

Never add `--dangerously-bypass-approvals-and-sandbox`, extra writable directories, connectors, or inherited MCP servers. Do not retry permission failures. Do not fetch missing PR objects from a seat.

When the user approves submodule fetches or the scope contains changed submodules, read `references/submodules.md`.

After seats finish, inspect the runner's `stability` and `coverage` results. Changed submodule contents that are unavailable leave coverage incomplete even when the parent scope is stable and every seat approves. Lead with the incomplete warning, preserve findings from readable parent code, and never describe those approvals as a complete review. Do not fetch or change submodule checkouts to repair coverage. If scope changed, lead with the instability and do not call the panel clean. A nonzero exit, timeout, cancellation, output limit, missing response, or result that remains invalid after its single schema-only repair attempt leaves that seat incomplete. Preserve valid peers and never turn an incomplete panel into “no findings.”

Present the runner's `report` field as the Snipe result. It is derived only from validated seat results and orders the canonical scope, seat outcomes, limitations, severity-ranked attributed findings, operator asks, and report-only widening recommendations. Do not replace an incomplete warning with a prose clean summary. Raw transport output is diagnostic evidence, not an additional finding source.

## Stop boundary

Report scope and every seat outcome. Do not fix findings, edit files, commit, push, file issues, post PR comments, run a merge gate, widen the panel, or initiate follow-up work. The operator chooses any later action in a separate request.
