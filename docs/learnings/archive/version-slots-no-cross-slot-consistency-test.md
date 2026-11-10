---
name: version-slots-no-cross-slot-consistency-test
description: "RESOLVED: version-slots.test.mjs locks all four release slots in lock-step, fail-closed, so a partial version bump goes red"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: version-slots-no-cross-slot-consistency-test
  phase: drift-guards-for-mirrored-and-asserted-facts/t1.1
  keywords:
    - partial bump
    - silent release
    - manifest mismatch
    - plugin.json
    - marketplace.json
    - version drift
    - version-slots.test.mjs
    - README Status
  tags:
    - release
    - version-bump
    - invariant
    - hardening
    - resolved
  files:
    - skills/war/assets/version-slots.test.mjs
    - README.md
  relates:
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[readme-undersell-guard-couples-doc-prose-to-true-slot-count]]"
  created: 2026-07-09
  originSessionId: 68b2ca32-fa05-459c-9ddf-f23ca91a5f40
---

# RESOLVED: the four version slots are locked in lock-step by a fail-closed test

**Rule:** `skills/war/assets/version-slots.test.mjs` is the guard against a partial release bump.
Verify still present before acting.

**What it does:** `readSlots()` extracts all four slots (`plugin.json#version`,
`marketplace.json#metadata.version`, `marketplace.json#plugins[0].version`, the README `## Status`
bold semver token) and asserts each is a well-formed semver. It is fail-closed:
`assert.ok(value != null, …)` runs before the format check, so two `undefined` extractions cannot
pass vacuously against each other. Root is resolved from `import.meta.url`, never `process.cwd()`.

**Why:** before this test, nothing checked the slots against each other, so a partial bump could
ship a silent release. The first release bump after it landed resolved a stale plan literal
(`0.14.14`) to the next free patch (`0.14.18`) across all four slots, so per-phase audit flagging of
[[stacked-release-plan-version-literal-lags-operator-target]] is no longer needed.

The same task also changed the README `## Releasing` prose from "three version-of-truth files" to
"all four version slots across three files". See
[[readme-undersell-guard-couples-doc-prose-to-true-slot-count]].

The heading-anchor gotcha this test's fix round hit lives in its own lesson:
`indexof-of-a-heading-name-binds-to-an-earlier-prose-mention-so-anchor-with-a-leading-newline`.

> archived 2026-07-11: resolved — moved to archive
