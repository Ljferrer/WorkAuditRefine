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

## Superseded in part (code-verified, 2026-10-26, phase 2026-10-20-rea-artifact-evidence/phase-8)

The refusal is now narrower than this note says. `RELEASE_SLOT_FILES` is `['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json']` only (canonical in `skills/war/assets/land-decision.mjs`, mirrored in `skills/war/assets/workflow-template.js`). The section "Release-slot eligibility by literal (D20, #2000)" in `skills/war/references/disposition-eligibility.md` says a fully specified `Minor` or `Nit` on `CHANGELOG.md` or `README.md` is `absorb`-eligible when its fix moves no version literal, no CHANGELOG head heading and no README `## Status` version token. The engine's release-task ace clause says the CHANGELOG head entry and the README `## Status` blurb are twins that move together.

Phase 8 task 8.2 showed it live. Two Nit findings on the CHANGELOG head blurb and its README Status twin took `disposition: absorb`, two ace commits fixed both files in-run, and the task approved and merged. So the rule below holds only for `plugin.json`, `marketplace.json` and a version token. Prose in the blurb is not exempt. The 2026-08-27 account that follows is the history that led to D20. Related: [[release-blurb-that-restates-a-code-comment-inherits-its-overclaim]].

## The pattern (as of 2026-08-27, before D20)

This repo's disposition-eligibility doctrine (`skills/war/references/disposition-eligibility.md`,
`## Absorb eligibility`) refuses `disposition:'absorb'` for any fix that "touches **no**
version/release slot" — the orchestrator additionally backstops this with a deterministic
release-slot filename check (`plugin.json`/`marketplace.json`). The `2026-08-27-in-run-finding-resolution`
plan's own D3 widening (re-audit-born default-absorb) names the exemption explicitly: `follow-up`
"stays correct for unspecified, decision-shaped, or **sweep-excluded (release-slot / cross-task)**
findings."

This means a finding introduced **by the release commit itself** — a task whose own `Files:` list
*is* `plugin.json` / `marketplace.json` / `README.md` `## Status` / `CHANGELOG.md` — cannot use
either in-run vehicle this repo now has for mechanical findings: not the ace-batch/re-entry ladder,
and not the phase-close sweep. Even a single missing blank line is routed `Minor`/`follow-up`, the
same disposition a genuinely unspecified or decision-shaped finding gets.

## Concrete instance (confirmed at land)

Task 2.1 (the 0.20.1→0.21.0 version bump) introduced a CommonMark lazy-continuation regression in
`README.md`'s `## Status` section (see
[[bold-label-immediately-after-list-item-lazily-continues-into-it-commonmark]] Update 2 for the
rendering-defect detail). The auditor correctly filed it `Minor`/`follow-up` rather than `absorb`,
citing exactly this refusal rule by name. The finding was still unresolved at the landed tip
(verified by direct read of the landed worktree README.md at
`2af20e5878f0364ac65a7791aa58b770fa909c74`) — it will become a filed issue (or await a Checkpoint
hand-fix) rather than self-healing in-run, which is the correct, doctrine-consistent outcome, not
an engine gap.

## How to apply

- Do not expect (or audit-request) an in-run `absorb`/ace fix for anything filed against
  `plugin.json` or `marketplace.json`, or for a fix that moves a version literal, a CHANGELOG head
  heading or the README `## Status` version token — it is refused by design, not by omission.
  A prose fix to the CHANGELOG head blurb or the README Status blurb that moves none of those is
  `absorb`-eligible since D20 (#2000), and phase 8 task 8.2 landed two of them in-run.
- The cheapest real remediation for a trivial release-slot regression is a hand-fix folded into
  the *same* release commit before land (Lead or operator, at the Checkpoint) — cheaper than
  minting a `war-followup` issue for a one-line diff, and doctrine explicitly prefers this route
  when available.
- When auditing a release-bump task, do not grade a correctly-filed `follow-up` on a release-slot
  finding as a disposition mistake even though this run's whole Commander's Intent is "fix what is
  broken when it is identified" — the exemption is a deliberate, named carve-out, not friction to
  route around.
