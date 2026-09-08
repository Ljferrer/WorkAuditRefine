# Snipe app launch acceptance

This check supplements the direct `snipe-actual-host.test.mjs` runtime test. A direct host runner cannot establish that a Codex task requests the necessary launch permission.

## Installed skill discovery (#2211)

In a fresh task, use the installed plugin's qualified invocation:

```text
$work-audit-refine-snipe:snipe correctness,security
Auditor profile: gpt-5.6-sol / medium
```

Alternatively, select **Snipe** from **WAR Snipe** in the host's skill picker so the host attaches the skill. The plugin remains explicit-only (`allow_implicit_invocation: false`). Bare `$snipe` text is not a reliable installed-plugin alias on the tested host; the earlier unqualified examples below describe source-selected tests, not a discovery guarantee. Do not work around failed lookup by searching cache directories or launching substitute auditors. Verify the installed plugin is enabled and select its qualified skill; if it still cannot resolve, report the failure and stop.

The host's [App Server skill invocation contract](https://learn.chatgpt.com/docs/app-server#skills) recommends a structured `skill` input attachment and supports discovering its name/path with `skills/list`. Paths belong in host-resolved attachments, not manual user prompts. A skill omitted from the default model catalog can still be installed and explicitly invocable.

Evidence on bundled Codex CLI `0.153.4`, with installed `work-audit-refine-snipe` version `0.21.12+codex.20260908045352`:

- `skills/list` with `forceReload: true` returned enabled `work-audit-refine-snipe:snipe`, plugin ID `work-audit-refine-snipe@war-snipe-local`, and no discovery errors.
- A fresh ephemeral read-only process given bare `$snipe` reported unavailable. Changing only the marker to `$work-audit-refine-snipe:snipe` loaded the skill and identified its owned runner without a path hint or filesystem search. No install or policy change occurred between those probes.
- The regression below failed before the prompt correction with `available: false` and null runner/sandbox/approval fields. After correction, both packaged default prompts resolved the skill in separate fresh processes and returned `snipe-runner.mjs`, `read-only`, and `never`. The negative conceptual request performed no commands and produced no audit report.

Run the opt-in discovery regression with the absolute host executable and an explicitly selected supported model/effort:

```sh
SNIPE_CODEX_BIN=/absolute/path/to/codex \
SNIPE_CODEX_MODEL=gpt-5.6-sol SNIPE_CODEX_EFFORT=medium \
node --test adapters/codex/snipe-discovery-host.test.mjs
```

This test requires the Snipe plugin already installed and enabled. It builds candidate metadata, submits those prompts through the actual bundled host against the installed skill, and launches no audit seats. It proves qualified text discovery, not a Desktop picker click or installation of the candidate package. After merge/reinstall, repeat the qualified invocation in a fresh Desktop task to accept the release. Both shipped default prompts now use that qualified name; the ten-file package inventory, explicit-only policy, runner, and Claude plugin are unchanged.

## Reproduce and verify

1. In a disposable Git repository, commit a `normalizedScore(value, maximum)` helper that rejects non-finite operands with `Number.isFinite`. Configure `origin/HEAD` to that baseline. Remove only the validation in the working tree; leave ratio clamping. Include no tests so absent-test reporting is exercised.
2. In a Codex app task with workspace sandboxing, invoke `$snipe correctness,security`, with the operator concern “invalid and non-finite inputs.” When validating a candidate before installation, explicitly select its `SKILL.md` and adjacent runner and record that this is source validation.
3. Inspect the task's command invocation: it must request `sandbox_permissions: "require_escalated"` for the coordinator's first launch. The child command must retain `--sandbox read-only`, `approval_policy="never"`, and the existing disabled connector/plugin/hook surfaces. A denied launch stops; no broader-permission retry is allowed.
4. Require runner exit 0, `complete: true`, two completed/validated seats, the actual task profile, and identical before/after scope fingerprints. Require a finding identifying the removed input validation. On this no-tests fixture, require `tests_verified: {exist: false, inspected: []}` without schema repair.
5. A transport failure, an audit run only from a separate terminal, or manually supplied verdicts fails this app acceptance. Preserve incomplete results as failures.

## Evidence — 2026-09-07

WAR issue #2160 correction: https://github.com/Ljferrer/WorkAuditRefine/issues/2160#issuecomment-5578440805

- Original app task: `01a07edf-5200-7d10-9380-bbde4f8de204` (“Test Snipe Codex plugin”). Both seats failed with `failed to initialize in-process app-server client: Operation not permitted`.
- Minimal reproduction in the enclosing task sandbox: `codex exec --ephemeral --ignore-user-config --sandbox read-only -c 'approval_policy="never"' 'Reply OK'` exited 1 before inference. The same command with coordinator host permission returned `OK`; child sandbox remained read-only.
- Candidate source validation in that same app task, turn `01a07ef7-6bbd-7f73-9d34-7ed03691e356`: revised skill read, coordinator launched through the task's shell permission mechanism, runner exit 0; correctness and security completed with `request_changes`; both reported absent tests and neither required repair. The active profile was `gpt-6-astra` / `low`, read from that task's current turn context.
- Scope fingerprint before and after: `313e8d41443a95bc4beeec3ae22c6d54ef12b51f6be5d9d26b797a5cfb917b97`.
- This verifies candidate source instructions in an app task. It does not claim that the previously installed package has been updated. Rebuild/reinstall after review and repeat the explicit invocation against the installed skill when accepting the release.

The fix requests host permission only for coordinator initialization. Auditor permissions and the no-retry rule are unchanged. Hosts without an approval mechanism cannot launch this workflow and must report that limitation.

## Missing active-profile acceptance

Fresh tasks may not expose their active model/effort. Test this separately: forbid reading session logs or global settings and invoke `$snipe correctness,security` without an auditor profile. The skill must run `--list-profiles`, show host-returned choices, and ask for a model and effort without launching seats. Then provide an explicit pair (for example, `gpt-5.6-sol` / `medium` if returned by this host). The request must contain `profile`, omit `inheritedProfile` and `supportedProfiles`, and complete both seats through the normal coordinator launch.

The CLI discovers supported profiles via the selected binary's [App Server model/list endpoint](https://learn.chatgpt.com/docs/app-server#list-models-modellist), using only initialize/initialized/model/list. Discovery is bounded to 30 seconds and 1 MiB of output and follows pagination; failures stop before audit dispatch. It neither creates a thread nor starts an inference turn. Programmatic callers can still supply a verified host map. No shared WAR config or persistent defaults are introduced.

Candidate evidence in task `01a07edf-5200-7d10-9380-bbde4f8de204`: turn `01a07f1e-f30f-7ff0-bbb2-1ba074bbdd63` discovered real host profiles and asked for a pair without dispatch. Follow-up turn `01a07f1f-c4ec-7b91-93f0-4129b83a7ce3` received explicit `gpt-5.6-sol` / `medium`, omitted both inherited metadata and the support map, and completed both seats with validated `request_changes`, no repairs, absent tests preserved, and the unchanged fingerprint above. The test explicitly withheld active metadata; no transcript or global-config inference was needed. All 58 deterministic tests passed across the focused suites. Installed-package validation remains a post-review release step.

## Desktop executable acceptance

Restrict the coordinator PATH to `/usr/bin:/bin`, verify `command -v codex` finds nothing, and invoke Node using the absolute host-provided `CODEX_MCP_NODE_PATH`. Preserve that runtime hint but omit both `--codex-path` and `SNIPE_CODEX_BIN`. Require successful `--list-profiles` and a complete two-seat audit against the fixture above. This tests the actual Desktop environment without relying on a developer-installed CLI alias.

Resolution order is explicit absolute `--codex-path`, absolute `SNIPE_CODEX_BIN`, the `codex` sibling of `Contents/Resources/cua_node` identified by the host runtime path, then executable Codex entries in absolute PATH directories. Candidates must be executable files and resolve to absolute paths. The Desktop convention is verified on this macOS host; unfamiliar runtime layouts must use an explicit path rather than guess a global application location. Both profile listing and ordinary requests support `--codex-path`; an invalid override is an actionable failure rather than a fallback to another binary.

Candidate app acceptance: task `01a07edf-5200-7d10-9380-bbde4f8de204`, turn `01a07f4d-3635-7492-abd2-6ff9b6bcb862`. PATH was `/usr/bin:/bin` and `command -v codex` returned nothing. The retained Node runtime hint resolved `/Applications/ChatGPT.app/Contents/Resources/codex`; neither executable override nor inherited profile/support map was supplied. Both real seats completed with validated request_changes, no repairs, absent-test evidence preserved, and unchanged scope fingerprint. Runner exit 0 and complete true. The 22 affected runner/package/structure tests passed, including a synthetic Desktop bundle path containing spaces and profile listing with an explicit path under an empty PATH.
