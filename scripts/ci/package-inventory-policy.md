# Branch-only package inventory policy

This is T4 baseline preparation, not dual-runtime certification. The inactive
`scripts/ci/war-ci.yml` runs the complete reviewed census on Linux and macOS,
including package checks. Moving it into `.github/workflows` and making `WAR CI`
required are separate T8 changes after the engine campaign and a proven rollout.

## Independent package expectations

- Claude: retain the manifest-selected skills and agents, their regular entry
  files, and the default `hooks/hooks.json`. The literal expected members in
  `check-war-ci.test.mjs` require deliberate review when inventory changes; they
  must not be regenerated from the manifest being checked. Existing version-slot,
  reference-integrity and pipeline suites remain mandatory.
- Codex: `adapters/codex/package-snipe.test.mjs` independently enumerates the
  standalone Snipe package, checks the dependency closure and qualified prompts,
  excludes hooks, compares both injected references to source, and demonstrates
  refusal/import failure when required shared content is removed. Reuse that
  production builder and verifier; do not create a second package format here.
- A changed package member requires matching reviewed policy/tests, not an
  automatic acceptance snapshot. The tracked test census itself is checked by
  the baseline collector; neither package suite can silently disappear.

## Evidence and boundaries

`WAR CI` requires both platform artifacts, a successful mandatory matrix job,
unchanged clean source at the requested SHA, the exact reviewed suite inventory,
valid passing case counts, explicitly named allowed skips, and diagnostic files.
The opt-in host suites may be entirely skipped only under the existing named
policy. That is baseline evidence, never proof that a client loaded the plugin.

These reports are diagnostics from the same unprivileged workflow run, not signed
attestations or a defense against a PR rewriting its own tests. Workflow and test
policy require review ownership. T7/T8 must separately bind real client loading,
authentication, sandbox behavior, candidate/package digests and trusted release
evidence; no provider secrets or elevated downstream artifact consumer belong in
this PR workflow. The template does not install either plugin or alter Claude's
engine, hooks, configuration, or active campaign branches.

Before activation, exercise both hosted runner labels and an intentionally failing
PR under the actual ruleset. Local template lint and simulated reports cannot
prove hosted compatibility or enforcement. The existing memory-audit workflow
remains unchanged. Merge-queue event support is drafted, not claimed exercised.
