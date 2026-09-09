# Red Team local delivery — Phase 2 checkpoint

Implementation PR: https://github.com/Ljferrer/WorkAuditRefine/pull/2296 (base `codex-port`, left open). Original plan is unchanged: SHA-256 `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`. Phase 1 start `5b442a28f4063b8f947a582c749842dd0808d4b2`; Phase 2 start `68c6705bfe9515a4f6be9f46f725e29e71cd085d`.

This receipt is being finalized during Phase 2. Final source commit, completion commit, artifact location/version/digest and bounded audit outcomes will be recorded below after validation. No installation, independent review, Phase 3, merge or public release has occurred.

## Build and identity

From the committed implementation source, build into a new directory whose final component is `work-audit-refine-red-team`:

```sh
node adapters/codex/package-red-team.mjs /absolute/new-parent/work-audit-refine-red-team
```

The artifact's `build-info.json` records source revision, selected-source dirty state and file hashes, payload hashes and a deterministic SHA-256 over the source identity plus payload inventory. It excludes its own bytes from that payload inventory to avoid circular hashing. The final delivered build must have `source.dirty: false`; a fixture/working build explicitly labeled dirty is not that delivery. Archive SHA-256, when given, identifies the transport archive separately. Keep the original Phase-2 artifact and this receipt when later repairs produce a new identity.

## Operator installation handoff

These commands are instructions for the operator after the Phase-2 stop, not actions performed by this task. This is a first installation into the default personal marketplace. They refuse an existing same-name entry; do not force an overwrite without inspecting that entry.

Set `artifact` to the verified delivered directory below. Then:

```sh
plugin_tools="$HOME/.codex/skills/.system/plugin-creator/scripts"
plugin_python="/Users/ljf/miniconda3/envs/codex-snipe-port/bin/python"
"$plugin_python" "$plugin_tools/create_basic_plugin.py" work-audit-refine-red-team \
  --path "$HOME/.agents/plugins/plugins" --with-marketplace
cp -R "$artifact/." "$HOME/.agents/plugins/plugins/work-audit-refine-red-team/"
"$plugin_python" "$plugin_tools/validate_plugin.py" "$HOME/.agents/plugins/plugins/work-audit-refine-red-team"
marketplace_name="$("$plugin_python" "$plugin_tools/read_marketplace_name.py")"
"/Applications/ChatGPT.app/Contents/Resources/codex" plugin add "work-audit-refine-red-team@$marketplace_name"
```

The specified existing Python environment includes PyYAML; this host’s system `python3` did not. No dependency was installed. Run each step only after the preceding command succeeds. The scaffold creates the entry through the supported helper and the copy replaces its default manifest with the verified package. The default personal marketplace is discovered implicitly; no marketplace registration command is needed. This executable was resolved from the current Desktop host; another host must use its resolver or an operator-supplied absolute executable path. Start a fresh task after installation. Use the picker or `$work-audit-refine-red-team:red-team`; bare `$red-team` is not the installation contract.

Select an explicit model/effort for the red-team roles, or inherit an exactly exposed active profile. `node skills/red-team/assets/red-team-runner.mjs --list-profiles` from the installed plugin root lists current supported pairs; never assume that Snipe's Sol/medium selection transfers to the independent review. The runner also accepts `--codex-path /absolute/executable` as its final option.

## Diagnostic before independent review

Locate the installed cached plugin root in the fresh task. Set `installed_plugin` to that root. Write a JSON file at `/absolute/diagnostic-request.json` with `enabled: true`, a new absolute `evidenceDir` whose parent exists, and the operator-selected `profile: {model, effort}`. Then:

```sh
node "$installed_plugin/skills/red-team/assets/red-team-runner.mjs" \
  --diagnostic /absolute/diagnostic-request.json
```

In a sandboxed task, request the documented coordinator host launch permission on the first invocation; every child still uses its declared sandbox. Refusal is unavailable evidence; do not widen permissions to retry. Diagnostic targets and raw runs are retained under the evidence directory. `OBSERVED` requires analysis reads, executed proof output/exit and applicable independent confirmations to match known-clean and seeded fixtures. A failed or vacuous run remains `INCOMPLETE` with exit 1. This task's fake-executable tests establish wiring only. Actual installed-host observation, prompt comprehension and B1 remain pending.

## Next independent target and stop boundary

After installation and diagnostic, the operator starts a fresh task on `codex/red-team-review-codex`, PR https://github.com/Ljferrer/WorkAuditRefine/pull/2293, frozen starting commit `46aef4a25b68874bff7b3b3fed14f9058c270da7`. Follow its existing REVIEW.md. Review the original plan with hash above; do not copy this implementation, receipt, ledger, amendments, Claude findings or implementation commentary into that task. Preserve the first attempt and post-confirmation findings before patches or disclosure. A failed attempt is retained evidence, not success. Only afterward may a separately authorized Phase 3 compare the independently retained reports with the ledger.

## Validation and evidence

Detailed source, findings, dispositions, counterexamples and cycle counts: [implementation ledger](2026-09-08-red-team-implementation-ledger.md). Raw panels and test logs: [evidence directory](red-team-implementation-evidence/). No independently observed model identity or billed cost is asserted. Final acceptance and delivery identities follow after Phase-2 auditing.
