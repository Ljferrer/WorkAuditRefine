---
name: bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands
description: "Scope a bounded-window measurement or count ('N of N were merges', 'the landed diff touches only', 'gains six files') to the commit or phase it was measured at — the commit that lands it enters that same window and falsifies an unscoped claim"
metadata: 
  node_type: memory
  type: project
  provenance: agent-unverified
  slug: bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands
  phase: "gate-evidence-and-release-integrity/phase-2 (Release, task 2.1 + p2-polish), landed 2026-07-26"
  keywords: 
    - diff-merges=off
    - monotonic floor
    - version-slots.test.mjs
    - SLOT_LOG_ARGS
    - bounded git log window
    - measured at the implementation base
    - self-invalidating comment
    - present-tense measurement claim
    - first-parent window
    - release commit changes its own evidence
    - through Phase N
    - lessons count
  tags: 
    - documentation
    - release
    - version-guard
    - comment-drift
    - test-strategy
  created: 2026-07-26
  originSessionId: 8e038db9-6931-4633-b7d8-6d7977473ca5
  modified: 2026-08-17T21:29:55.060Z
---

# A "measured at this window" claim can be falsified by the very commit that lands it

**The rule:** a comment or doc line reporting a concrete measurement over a bounded window must be
scoped to the commit or phase it was measured at, never stated as an unscoped present-tense fact.
The commit that ships the line is itself guaranteed to enter the window it describes. When a
downstream mirror (a release blurb, a doc paragraph) gets that scoping added during review, sweep
the upstream source comment it mirrors in the same pass. The correction direction is not always
docs-lag-code.

**Instances:**
- **Git-log window count.** The monotonic-floor comment above `SLOT_LOG_ARGS` in
  `skills/war/assets/version-slots.test.mjs` says "measured 50 of 50 at the implementation base
  ... `--diff-merges=off` on the identical command yields ZERO versions". The claim holds only at
  that base: a single-parent release commit among the merges changes the result from a loud RED to
  a quiet divergence.
- **Diff-footprint claim (2026-08-17).** A `## Status` blurb said "the landed diff touches only
  the two structural suites, the SKILL.md intake bullet, and lesson files". That was true for
  phase 1 only. The release commit that landed the sentence touched `plugin.json`,
  `marketplace.json` and `README.md`. The plan's End state said "the landed **Phase-1** diff"; the
  blurb dropped the scope word. Carry an End state's scope word through into release prose.
- **Release-scope lesson count (2026-10-26).** A `Release scope:` line said "`docs/learnings/`
  gains six files and edits two". The release phase's own servitor commit lands after the release
  commit, so a bare count goes stale at land. Bound it "through Phase N", where N is the last phase
  whose servitor had finished when the release commit was cut.

Related: [[release-blurb-overstates-guard-semantics]] (same family of release-prose overclaim —
this lesson is the sibling case where the source comment, not the blurb, is the stale surface).
[[gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump]]
(the incident this exact monotonic-floor test and comment were written to close, #1083, same phase).
[[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (a count word that outruns
its enumeration).
[[count-only-source-census-pin-is-blind-to-relocation-not-just-addition]] (same phase as the
diff-footprint instance, a different guard-description imprecision).

> archived 2026-08-02: resolved — moved to archive
