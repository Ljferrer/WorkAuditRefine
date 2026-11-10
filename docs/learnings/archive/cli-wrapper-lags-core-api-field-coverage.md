---
name: cli-wrapper-lags-core-api-field-coverage
description: New core-API field needs 2nd edit in CLI dispatch wrapper; grep for it [RESOLVED]
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cli-wrapper-lags-core-api-field-coverage
  phase: war-companion-skills/p1-t3
  tags: 
    - cli
    - api-surface
    - plan-code-mismatch
    - doc-drift
  created: 2026-07-01
  originSessionId: 4e5003ee-7132-4597-be6e-d8061e9d86a8
---

# CLI wrapper lags core API field coverage

**Rule:** a field added to a module's core function needs a second, easy-to-forget edit in the
same file's CLI dispatch wrapper (flag accepted + threaded into the call). Core-function tests
going green does not cover the CLI path — and when SKILL.md tells the operator to reach the
feature via the CLI, the CLI wiring is the load-bearing path, not the core function.

Instance [RESOLVED]: `campaign-ledger.mjs` `record()` supported `stopPoint` but the CLI
`case 'record':` block dropped it; the CLI record case's key loop now includes `stopPoint`
(verified at master 2fcc8cb).

**Why:** thin CLI dispatchers are usually untested and grow independently of the well-tested core.
**How to apply:** when a plan adds a field to a core options object, grep the same file for a
CLI/dispatch wrapper around that function and confirm the field is accepted and threaded.

Related: [[wire-key-rename-misses-prose-placeholders]] (rename drift into doc placeholders),
[[run-provision-config-not-yet-mirrored-into-template]] (documented-before-wired config).

> archived 2026-07-04: resolved — moved to archive
