---
name: release-slot-files-exempt-from-in-run-ace-and-sweep-machinery
description: "Narrowed by D20 (#2000): only plugin.json and marketplace.json refuse in-run absorb, and CHANGELOG or README prose fixes are absorb-eligible"
metadata: 
  node_type: memory
  type: project
  keywords: 
    - release slot exemption
    - RELEASE_SLOT_FILES
    - ace eligibility
    - absorb eligibility
    - D20
    - disposition-eligibility.md
    - CHANGELOG README blurb
    - phase-close sweep
  provenance: code-verified
  slug: release-slot-files-exempt-from-in-run-ace-and-sweep-machinery
  phase: 2026-08-27-in-run-finding-resolution/2.1 (landed dev/2026-08-27-in-run-finding-resolution @ 2af20e5878f0364ac65a7791aa58b770fa909c74)
  tags: 
    - war
    - disposition
    - release
    - absorb
    - gotcha
  created: 2026-08-27
  originSessionId: c878d5da-ed5a-4614-8006-47e692e60042
  modified: 2026-10-26T21:25:59.060Z
---

# Release-slot files sit structurally outside the in-run auto-fix machinery, even for a one-character regression

## The rule (D20, #2000)

`RELEASE_SLOT_FILES` is `['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']` only (canonical in `skills/war/assets/land-decision.mjs`, mirrored in `skills/war/assets/workflow-template.js`). The engine refuses those two by basename from the per-task ace, the phase-close sweep and the terminal pass.

The section "Release-slot eligibility by literal (D20, #2000)" in `skills/war/references/disposition-eligibility.md` covers the rest. A fully specified `Minor` or `Nit` on `CHANGELOG.md` or `README.md` is `absorb`-eligible when its fix moves no version literal, no CHANGELOG head heading and no README `## Status` version token. A fix that moves one is a release change, never a Minor. No engine literal detector exists: `version-slots.test.mjs` in the gate is the merge guard, and the ace prompts carry `NEVER_MOVE_LITERAL`. The engine's release-task ace clause says the CHANGELOG head entry and the README `## Status` blurb are twins that move together.

Narrowed by D20. The older, wider exemption also held release-task findings in `README.md` and `CHANGELOG.md` out of the in-run fixers (origin: [[bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark]]). Phase 8 task 8.2 showed the narrow rule live: ace commit d2e64f63 fixed the CHANGELOG head blurb and its README Status twin in-run. Related: [[release-blurb-that-restates-a-code-comment-inherits-its-overclaim]].

**Why:** the engine comment calls the two files pure version-slot JSONs, so a refusal by filename is safe there. Blurb prose needs no such refusal, because `version-slots.test.mjs` guards the version tokens.

## How to apply

- Do not expect (or audit-request) an in-run `absorb`/ace fix for anything filed against `plugin.json` or `marketplace.json`. The refusal is by design, not by omission. A prose fix to the CHANGELOG head blurb or the README Status blurb that moves no version token is `absorb`-eligible.
- When auditing a release-bump task, do not grade a `follow-up` tagged `barrier:release-slot` on those two files as a disposition mistake. The exemption is a deliberate, named carve-out.
