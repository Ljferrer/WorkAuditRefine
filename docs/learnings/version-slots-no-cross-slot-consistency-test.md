---
name: version-slots-no-cross-slot-consistency-test
metadata:
  node_type: memory
  slug: version-slots-no-cross-slot-consistency-test
  phase: red-team-verdict-integrity/t4.2 + 7 recurrences (through resume-prec/p2-t4)
  type: project
  keywords: [partial bump, silent release, manifest mismatch, plugin.json, marketplace.json, release audit, version drift, gate not evidence]
  tags:
    - release
    - version-bump
    - testing-gap
    - invariant
    - hardening
    - pre-existing
  files:
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
    - README.md
  relates:
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[verify-task-no-op-is-correct-when-already-covered]]"
  created: 2026-06-26
  originSessionId: e734fab0-d931-4547-a090-ed30c93e12f8
---

# The four canonical version slots have no automated cross-slot consistency test

## The gap (durable, pre-existing)

Four canonical version slots — `plugin.json#version`, `marketplace.json#metadata.version`,
`marketplace.json#plugins[0].version`, and `README.md ## Status` — are bumped by convention +
plan text, NOT by any enforced test. The gate's JSON well-formedness check catches malformed
JSON but NOT a partial bump where one slot (e.g. `plugins[0].version`) lags the others. A partial
bump is a silent no-op release from the gate's view: gate green, task approved, manifest internally
inconsistent. Gap still open as of v0.14.2 — no test parses both JSONs and asserts version equality.

**Corollary (gate is not release evidence):** a green gate does NOT prove a bump occurred — the
suite has no version-pinning assertion, so it passes identically at any version. Canonical evidence
is the **diff at the release commit**, not gate output: `git show <sha> -- plugin.json marketplace.json README.md`.

## How to apply (manual protocol, until the test exists)

During any release audit:
1. Read `plugin.json` — note `version`.
2. Read `marketplace.json` — confirm `metadata.version` AND `plugins[0].version` both match
   (the second marketplace slot is the common single-slot-update footgun).
3. Grep `README.md ## Status` — confirm the version string appears (replace-in-place, no badge).
4. Record a Nit if any slot mismatches; record HARD only if `plugins[0].version` was left at the
   prior release value (a real silent-partial-bump, not a cosmetic gap).

Note: release tasks frequently exhibit the stale-tip pattern (gate ran at the pre-release parent),
so verify the slots by direct Read at the release commit, not at the gate-HEAD tip.

## Suggested hardening (track separately, not a release blocker)

A small gate-level `*.test.mjs` (no framework): read both JSON files, assert
`metadata.version === plugins[0].version === plugin.json.version`, and assert `README.md ## Status`
contains the same version string. Runs on every `node --test`.

Relates to [[release-bump-slots-canonical-no-badge]] (canonical bump list + phantom-badge footgun)
and [[release-status-is-replace-slot-not-empty-field]] (README slot is replace-in-place).
