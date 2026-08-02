---
name: release-bump-slots-canonical-no-badge
description: "No README badge; bump=plugin+marketplace×2+Status"
metadata:
  node_type: memory
  slug: release-bump-slots-canonical-no-badge
  phase: verification-layer-integrity/phase-3
  type: project
  keywords: [version bump, marketplace.json, plugin.json, partial bump, mirrored value, Status paragraph, phantom template artifact]
  tags:
    - war
    - release
    - plan-repo-mismatch
    - bump-list
    - phantom-badge
    - version-of-truth
    - reusable-pattern
  files:
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
    - README.md
  relates:
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[audit-baseline-must-pin-integration-branch-not-main-checkout]]"
  created: 2026-06-26
  originSessionId: war-servitor-verification-layer-integrity-p3
---

# Release bump-list: three canonical slots, no badge

This repo's `README.md` has **no version badge**. Plan slices saying "bump the README badge"
are a reused-template artifact (seen in at least two release phases): skip it, never add one.

The README "Releasing" table is authoritative — a release bumps exactly **three files / four
slots** in lock-step:

| File | Field | Operation |
|------|-------|-----------|
| `.claude-plugin/plugin.json` | `version` | replace value |
| `.claude-plugin/marketplace.json` | `metadata.version` | replace value |
| `.claude-plugin/marketplace.json` | `plugins[0].version` | replace value (same file, second slot) |
| `README.md` | `## Status` paragraph | replace entire paragraph, NOT append — see [[release-status-is-replace-slot-not-empty-field]] |

Updating only one `marketplace.json` slot is a silent partial bump (mirrored-value footgun).
After bumping, `git diff --name-only` should list exactly those three files.

**Resolved:** the old "three version-of-truth files" undersell is fixed — README now reads "all
four version slots across three files together (`marketplace.json` carries two)" — and
`skills/war/assets/version-slots.test.mjs` (which postdates this lesson) locks the four slots in
lock-step and guards the README prose against the undersell regressing.

**Why:** reused plan templates keep emitting the phantom-badge instruction until a plan author
fixes the template.
**How to apply:** bump the four slots, skip any badge mention, and read "populate empty Status"
as "replace the current paragraph".
