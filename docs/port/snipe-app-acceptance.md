# Snipe app launch acceptance

This check supplements the direct `snipe-actual-host.test.mjs` runtime test. A direct host runner cannot establish that a Codex task requests the necessary launch permission.

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
