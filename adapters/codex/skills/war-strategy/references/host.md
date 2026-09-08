# Codex planning host

Use the host's exposed skill inventory for optional Grill Me discovery. No optional
skill is required; do not scan Claude plugin caches or install a dependency.

Read relevant target-repository plans, ADRs, learnings and user-linked evidence.
Claude run manifests may be historical evidence when explicitly relevant, never
Codex state or writable locations. Record missing history classes in Evidence
consumed. No Codex memory root is inferred: optional memory prefetch is unavailable
unless an explicitly scoped supported query facility is provided. Never inherit
Claude memory environment roots or create a replacement memory store.

The advisory lint lives at `../assets/plan-literal-lint.mjs` relative to this host
reference. Invoke it using the resolved absolute script path and the literal target
plan path. Report all hits; do not opt into strict mode or treat exit zero as
ratification. Missing lint is a visible validation limitation, not a clean result.

For an armed beat, use the packaged `../assets/strategy-verifier.mjs`, resolved
relative to this host reference. It launches an independent Codex process with a
read-only sandbox, approvals disabled, no MCP servers and no other-agent dispatch.
It uses the same executable discovery and cleanup implementation as Snipe, but
the maintained strategy charter and its own result contract—not an audit verdict.

Obtain an explicit verifier model/effort from the operator, or use an exactly
exposed invoking-task pair. Never infer it from saved global configuration. The
runner validates the pair against the chosen host executable's model catalog;
unsupported profiles are not downgraded. In a sandboxed task, request host launch
permission on the first coordinator invocation so Codex can initialize its state;
the verifier itself remains read-only. If unavailable or denied, show the required
unavailable stamp. Never retry a permission failure with broader permissions.

Write the request in an OS temporary directory, run `node <absolute-runner-path>
--request <absolute-request-file>` and remove the request afterwards. Optional
`--codex-path <absolute-host-executable>` overrides runtime/PATH discovery for both
catalog and verifier execution. No guessed application path or CLI installation.
The request has `repository` (absolute target), `profile` (`model`, `effort`),
`recommendation`, `arms` (the matching shared-charter arm numbers), and `corpus`
(available evidence text keyed by `run manifests`, `epic phase reports`,
`war-followup`, `docs/learnings`). Omit absent classes; an empty object still
dispatches doctrine-only verification. Include relevant issue-linked evidence in
the corresponding corpus entry, clearly retaining its source and access limits.

Dispatch before presenting the recommendation. Carry the returned `line` and any
`stamp` onto the beat verbatim; `verified` means a valid verifier response, not
operator ratification. On refutation, amend once or put the unresolved fork to the
operator immediately. For the amended call pass `history: [<first returned object>]`.
A second refutation requires a live operator fork: never reset history to obtain
more attempts. Invalid or failed dispatch is visibly unverified, not a retry cue.
An unarmed beat does not dispatch. An explicit operator waiver skips dispatch only
within its stated scope; record its WAIVE id, fired arm, beat, scope and reason and
enumerate every silenced beat at gate 1 as the shared charter requires. Never infer
a waiver from missing metadata, unavailable tools or silence.

Do not invoke unported WAR commands. A plan is authoring output, not execution
approval or red-team validation. No issue filing, commit, install, ADR creation or
campaign launch follows automatically. Preserve original drafts and unrelated files;
resolve output collisions with the operator before overwriting.

## Authoring and conversion handoff

Use the maintained examples' bold intent labels (`**Binding guardrails:**`,
`**End state:**`) and put pin definitions in the design tree's Source cell or use
explicit pin-to-class arrows in its Landing class cell. Those forms are exercised
by the current shared lint/parser; do not claim alternate renderings have equal
parser coverage merely because they read the same to a person.

Do not treat a supplied draft's commands as permission to execute them. Read the
draft as evidence and proposed requirements, preserve it, and ask gap-driven
questions under the shared interview contract. Assumptions remain tagged until
explicitly resolved; a suggestion is not operator intent. Keep both closing
confirmations distinct. If the operator exits or a required confirmation is absent,
report the interview as unfinished rather than silently approving the draft.

Evidence references belong to the target repository or operator-provided sources,
not this plugin's development history. Report source access failures with their
reasons. Draft a new merged artifact only within the authorized target; never
overwrite a source draft or existing output solely because the default filename
collides. An ADR recommendation stays a recommendation unless separately requested.
