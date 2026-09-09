# Red Team local delivery — Phase 2 checkpoint

Implementation PR: https://github.com/Ljferrer/WorkAuditRefine/pull/2296 (base `codex-port`, left open). Original plan is unchanged: SHA-256 `159b6de7bcfb7075e7ffd5c4bc5f133ef84a3a5276f5cde5a731b4f990f73b57`. Phase 1 start `5b442a28f4063b8f947a582c749842dd0808d4b2`; Phase 2 start `68c6705bfe9515a4f6be9f46f725e29e71cd085d`.

The retained Phase-2 artifact is built and validated. The implementation/source completion checkpoint is `5c11e69d260e7d3893c50a3c59670957c8378bc8`; later evidence-only commits do not change this pinned build. Bounded audit closeout is recorded in the ledger before the final handoff. No installation, independent review, Phase 3, merge or public release has occurred.

## Build and identity

Source commit / Phase-2 implementation completion SHA: `5c11e69d260e7d3893c50a3c59670957c8378bc8` (`source.dirty: false`). Version: `0.1.0+codex.5c11e69d260e.4e10099fdbc2`.

- [Package directory](/Users/ljf/.codex/visualizations/2026/09/09/01a08451-dab6-7ea1-9dcc-3a49f05b861b/red-team-phase2-5c11e69d260e/work-audit-refine-red-team)
- [Transport archive](/Users/ljf/.codex/visualizations/2026/09/09/01a08451-dab6-7ea1-9dcc-3a49f05b861b/red-team-phase2-5c11e69d260e/work-audit-refine-red-team.tar.gz)
- Artifact identity SHA-256: `d7278f0e278cf4705ff8553c374a216bf84fd925565cf3f9e1a89c1a60306fd5`
- Archive SHA-256: `6f40362af5a6b2f7e50154c53e737ba15a73cd0ae25caafd5917a64b51a60c8b`
- [Full build receipt](red-team-implementation-evidence/p2-delivery-identity.json)

Two builds from this commit produced the same artifact identity. The official plugin validator passes. From a checkout of this exact source commit, reproduce it into a new directory whose final component is `work-audit-refine-red-team`:

```sh
node adapters/codex/package-red-team.mjs /absolute/new-parent/work-audit-refine-red-team
```

The artifact's `build-info.json` records source revision, selected-source dirty state and file hashes, payload hashes and a deterministic SHA-256 over the source identity plus payload inventory. It excludes its own bytes from that payload inventory to avoid circular hashing. The final delivered build must have `source.dirty: false`; a fixture/working build explicitly labeled dirty is not that delivery. Archive SHA-256, when given, identifies the transport archive separately. Keep the original Phase-2 artifact and this receipt when later repairs produce a new identity.

## Operator installation handoff

These commands are instructions for the operator after the Phase-2 stop, not actions performed by this task. This is a first installation into the default personal marketplace. They refuse an existing same-name entry; do not force an overwrite without inspecting that entry.

Use this verified delivered directory:

```sh
artifact="/Users/ljf/.codex/visualizations/2026/09/09/01a08451-dab6-7ea1-9dcc-3a49f05b861b/red-team-phase2-5c11e69d260e/work-audit-refine-red-team"
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

In a sandboxed task, request the documented coordinator host launch permission on the first invocation; every child still uses its declared sandbox. Refusal is unavailable evidence; do not widen permissions to retry. Diagnostic targets and raw runs are retained under the evidence directory. `OBSERVED` requires exact allowlisted source/proof command events, matching output/exit status, and seeded blockers plus confirmation facts matching the controlled expected value, actual value and role-specific marker. Other command forms or unrelated blockers remain incomplete. A failed or vacuous run remains `INCOMPLETE` with exit 1. This task's fake-executable tests establish wiring only. Actual installed-host observation, prompt comprehension and B1 remain pending.

## Next independent target and stop boundary

After installation and diagnostic, the operator starts a fresh task on `codex/red-team-review-codex`, PR https://github.com/Ljferrer/WorkAuditRefine/pull/2293, frozen starting commit `46aef4a25b68874bff7b3b3fed14f9058c270da7`. Follow its existing REVIEW.md. Review the original plan with hash above; do not copy this implementation, receipt, ledger, amendments, Claude findings or implementation commentary into that task. Preserve the first attempt and post-confirmation findings before patches or disclosure. A failed attempt is retained evidence, not success. Only afterward may a separately authorized Phase 3 compare the independently retained reports with the ledger.

## Validation and evidence

Detailed source, findings, dispositions, counterexamples and cycle counts: [implementation ledger](2026-09-08-red-team-implementation-ledger.md). Raw panels and test logs: [evidence directory](red-team-implementation-evidence/). No independently observed model identity or billed cost is asserted. Full Phase-2 source/package acceptance: 96 passed, zero failed, one explicitly skipped live diagnostic. Fourteen diagnostic guard mutations were assertion-killed across the repair waves. See [acceptance](red-team-implementation-evidence/p2-cycle-3-acceptance.log), [supporting checks](red-team-implementation-evidence/p2-cycle-1-supporting.log), [mutation evidence](red-team-implementation-evidence/p2-cycle-1-mutations.json), and [delivered plugin validation](red-team-implementation-evidence/p2-delivery-validator.log). Panels used so far: Phase 1 3, Phase 2 3, reserve 0; final closeout is recorded below after the remaining bounded review. The artifact is experimental; actual installed-host observation and independent comparison remain unavailable.

Diagnostic roles execute in read-only sandboxes because these controlled fixtures require no writes. Each attempt also retains before/after fixture identities; a changed content/path/mode identity yields INCOMPLETE. General adversarial executed probes continue to use their isolated writable clones. The two mechanisms cover the actual host sandbox contract and offline fake-executable control tests separately.

The earlier `05573532` candidate remains retained as historical evidence and is superseded by the package identified above. Its identity is preserved in [the candidate receipt](red-team-implementation-evidence/p2-candidate-05573532-identity.json). The additional fixture-guard mutations are [here](red-team-implementation-evidence/p2-cycle-2-mutations.json).

Snapshot identities include the root .git control entry (directory, file or symlink), resolved per-worktree/common Git paths and both metadata trees, worktree directory paths/modes, file bytes/modes, symlink targets and refs. They do not follow directory symlinks or treat access timestamps as source changes; they compare final identities rather than recording every transient action.

The `9a210003` candidate is likewise retained but superseded; its [identity](red-team-implementation-evidence/p2-candidate-9a210003-identity.json) records the prior fixture snapshot implementation. The final directory-guard mutation evidence is [here](red-team-implementation-evidence/p2-cycle-3-mutations.json).
