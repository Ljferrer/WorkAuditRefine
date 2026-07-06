---
name: release-blurb-overstates-guard-semantics
description: "Guard blurb: say 'refuse diffs touching X' not repos"
metadata: 
  node_type: memory
  type: project
  keywords: [Status section wording, trigger surface, diff vs repo, fail-closed phrasing, submodule refuse, prose nit, operator misinformation]
  provenance: code-verified
  slug: release-blurb-overstates-guard-semantics
  phase: submodule-inc1/T4
  tags: 
    - war
    - release
    - readme
    - status-section
    - guard
    - submodule
    - plan-repo-mismatch
    - prose-precision
  relates: 
    - "[[release-status-is-replace-slot-not-empty-field]]"
    - "[[release-bump-slots-canonical-no-badge]]"
    - "[[gitmodules-working-tree-read-vs-ref-snapshot]]"
  created: 2026-06-30
  originSessionId: 0e364ee5-f0b3-47f6-a9e4-9bf2dd555733
---

# Release blurb prose overstates guard semantics

**Rule** — when drafting the `## Status` blurb for a guard task, describe the **trigger surface** (what property of the task's *diff* causes the refuse), not repo topology. "Refuse diffs that touch X" is almost always more precise than "refuse repos that contain X". Fail-closed template: "Changes that X are blocked; safe-to-ignore diffs are unaffected." Blurbs favor short concrete phrasing, so writers unconsciously upgrade the restriction from the mutation surface to the topology surface — a prose Nit, never a land-halt, but it accumulates as operator misinformation across releases.

Instance (submodule-inc1/T4, v0.7.8): the blurb said "agents refuse to process repos that contain git submodules", but the landed guard (`skills/war/assets/assert-no-submodule-mutation.sh`) refuses **diffs touching submodule entries** (paths in `.gitmodules` or gitlink entries) and is a no-op on a submodule-free repo. Auditor rated it a Nit; suggested "refuse to process changes that touch git submodules". The offending blurb is gone from the live README — `## Status` is a replace-in-place slot ([[release-status-is-replace-slot-not-empty-field]]).

See [[gitmodules-working-tree-read-vs-ref-snapshot]] for the companion reading-context hazard.
