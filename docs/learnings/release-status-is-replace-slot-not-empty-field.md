---
name: release-status-is-replace-slot-not-empty-field
description: "README ## Status = replace-in-place, never empty"
metadata:
  node_type: memory
  slug: release-status-is-replace-slot-not-empty-field
  phase: 5
  type: project
  keywords: [version bump, overwrite paragraph, populate empty premise, single current value, latest pointer, verify baseline]
  tags:
    - war
    - release
    - readme
    - status-section
    - plan-repo-mismatch
    - mirrored-value
    - reusable-pattern
  files:
    - README.md
    - .claude-plugin/plugin.json
    - .claude-plugin/marketplace.json
  relates:
    - "[[retire-token-needs-clean-surface-gate-test]]"
  created: 2026-06-25
  originSessionId: war-phase-5
---

# README `## Status` is a replace-in-place release slot, not an empty field

Durable rule: `README.md ## Status` holds exactly ONE current-release paragraph. The correct
release operation is always "overwrite the whole paragraph with the new version's note" —
never append below, never treat as a blank to fill. The slot is *always* non-empty by the
next release, so a plan slice saying "populate an EMPTY Status" is factually wrong on every
release after the first (first observed in the 0.5.0 release; practiced correctly in every
release since).

**Why:** a "populate empty" framing hands the worker a false premise, and a mirrored-slot
overwrite silently replaces a real prior value — verify the baseline yourself instead of
trusting the "empty" wording.
**How to apply:** for any single-current-value slot (Status paragraph, version string, a
"latest" pointer), read plan text saying "populate" as **"replace and verify baseline"**.
Full slot enumeration lives in [[release-bump-slots-canonical-no-badge]].
