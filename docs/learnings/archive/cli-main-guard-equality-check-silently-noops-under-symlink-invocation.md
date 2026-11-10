---
name: cli-main-guard-equality-check-silently-noops-under-symlink-invocation
description: "A bare fileURLToPath(import.meta.url) === process.argv[1] CLI main guard silently no-ops under symlink invocation, so realpath the argv side (RESOLVED #1070 in all three guards)"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: cli-main-guard-equality-check-silently-noops-under-symlink-invocation
  phase: "land-failure-recovery/phase-1 task 1.1 (audit finding, disposition note) + cli-main-guard-normalization/phase-1 task 1.1 (fix)"
  keywords: 
    - fileURLToPath import.meta.url
    - "process.argv[1]"
    - node CLI main guard
    - run as CLI only when invoked directly
    - relative invocation silent no-op
    - ESM entry point check
    - path.resolve argv
    - symlink invocation
    - realpathSync
    - percent-encodable path
  tags: 
    - node
    - cli
    - footgun
    - fail-loud
  created: 2026-07-16
  originSessionId: 655475be-a01b-4702-b846-b2c53bbde3d3
  modified: 2026-07-23T21:23:49.408Z
---

# The bare-equality Node CLI main guard silently no-ops under symlink invocation

RESOLVED (realpathSync normalization + symlink-invocation regression tests, 2026-07-23 —
cli-main-guard-normalization, #1070).

**Corrected mechanism:** the originally recorded trigger — relative invocation — never fired. On
Node ≥ 24, `process.argv[1]` arrives **pre-resolved to an absolute path** before the script sees
it (confirmed by red-team probe on v24.17.0). The bare-equality guard
`fileURLToPath(import.meta.url) === process.argv[1]` no-ops under **symlink invocation**: the
module loader realpaths the main module for `import.meta.url` while `process.argv[1]` keeps the
symlink path the caller typed, so the comparison is false, `main()` is never called, and the
process exits 0 having done nothing. (A second trigger, **percent-encodable checkout paths**, hit
only the now-replaced `` file://${process.argv[1]} `` string-concat variant — string concatenation
never percent-encodes but `import.meta.url` does.)

**The canonical idiom:** normalize the argv side —
`if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) main()`
— now live in all three guards (`stage-workflow.mjs`, `war-config.mjs`, `campaign-ledger.mjs`),
matching `skills/_shared/war-memory.mjs`, each locked by a symlink-invocation regression test
(symlink the CLI into a `mkdtempSync` scratch dir, spawn the symlink, assert non-zero exit + the
live `usage:` line).

**The rule:** this is the standard Node ESM "run as CLI only when invoked directly" idiom and it
is routinely copy-pasted in its bare-equality form — any new Node CLI that does so reinherits the
silent-no-op defect. Use the realpathSync-both-sides form from the start.

## Related

[[uniform-shell-out-idiom-mislabels-export-only-function-as-cli-subcommand]] — a different
CLI-surface footgun in the same family (shell-invocation idiom assumptions), unrelated mechanism
but same "grep the idiom before trusting it" discipline.

> archived 2026-07-27: resolved — moved to archive
