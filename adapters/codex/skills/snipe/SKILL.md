---
name: snipe
description: Explicit one-shot read-only WAR-style audit of a pinned diff through 1-5 independent Codex lenses. Reports only; never fixes, files, comments, widens, or gates.
---

# Snipe for Codex

Run only when the user explicitly invokes `$snipe`. Convene one to five independent read-only audit seats, report their evidence, and stop. This is not a WAR phase and grants no authority to change the repository or external systems.

## Request

Use the shared seat/lens grammar for `rawArgs`; do not parse it yourself. `rawArgs` contains only a seat count and/or lens list. Put review scope in the structured target envelope:

- omit `target` (or use `{ "type": "default" }`) for the clean default-branch comparison or dirty advisory scope;
- `{ "type": "ref", "ref": "..." }` for a merge-base comparison to HEAD;
- `{ "type": "range", "expression": "base..head" }` for exact two-dot semantics;
- `{ "type": "merge-base", "base": "...", "head": "..." }` for an explicit merge-base comparison;
- `{ "type": "pr", "url": "https://github.com/OWNER/REPO/pull/N", "base": "trusted-base-ref-or-sha" }` only when the matching local PR head object already exists.

Put each path filter in the separate `paths` array. Never interpolate targets or paths into shell commands. Supply the invoking session's exact model/effort and the selected host's supported profile map; an unsupported pair is a refusal, not a downgrade. If the host profile or trusted PR base is unavailable, explain that requirement and stop.

## Coordinate

Create the JSON request in an OS temporary directory, not the target repository. Invoke `node <this-skill>/assets/snipe-runner.mjs --request <absolute-request-file>`, optionally adding `--capacity N` when host capacity is known, then remove the temporary request file. The runner resolves the scope once, passes literal Git arguments, launches fresh `codex exec` processes with read-only sandboxing and approvals disabled, removes MCP configuration, bounds output/time, accounts for every seat, and returns the final scope-stability check.

Never add `--dangerously-bypass-approvals-and-sandbox`, extra writable directories, connectors, or inherited MCP servers. Do not retry permission failures. Do not fetch missing PR objects from a seat.

After seats finish, inspect the runner's `stability` result before making any stable statement. If it changed, lead with the instability and do not call the panel clean. A nonzero exit, timeout, cancellation, output limit, missing response, or result that remains invalid after its single schema-only repair attempt leaves that seat incomplete. Preserve valid peers and never turn an incomplete panel into “no findings.”

Present the runner's `report` field as the Snipe result. It is derived only from validated seat results and orders the canonical scope, seat outcomes, limitations, severity-ranked attributed findings, operator asks, and report-only widening recommendations. Do not replace an incomplete warning with a prose clean summary. Raw transport output is diagnostic evidence, not an additional finding source.

## Stop boundary

Report scope and every seat outcome. Do not fix findings, edit files, commit, push, file issues, post PR comments, run a merge gate, widen the panel, or initiate follow-up work. The operator chooses any later action in a separate request.
