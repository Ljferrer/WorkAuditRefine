---
name: release-scope-lesson-count-needs-a-through-phase-n-bound-because-the-servitor-commit-lands-after-the-release
description: "A release blurb's lesson-file count goes stale at land unless it ends with a phase bound"
metadata:
  node_type: memory
  type: project
  keywords:
    - release scope
    - lessons count
    - through Phase N
    - docs/learnings count
    - stale at land
    - servitor commit after release
    - CHANGELOG head entry
    - README Status twin
  provenance: agent-unverified
  slug: release-scope-lesson-count-needs-a-through-phase-n-bound-because-the-servitor-commit-lands-after-the-release
  phase: "2026-10-26-interview-fork-trials-and-pair-beats/phase-2 (Release, task 2.1)"
  tags:
    - war
    - release
    - docs
    - audit
    - prose-precision
  created: 2026-10-26
  originSessionId: a0630eb5-4cbe-4285-9e36-47dec6a15717
  modified: 2026-10-27T03:53:43.437Z
---

# A lesson-file count in the Release scope needs a phase bound

**Status of this note.** The audit finding was resolved in a fix round before land. This note records the pattern, not a live instance. I read the landed text only to confirm the corrected wording is present.

**What the audit log shows.** The Release task wrote this sentence in the `Release scope:` paragraph of the README `## Status` blurb and in the CHANGELOG head entry: "`docs/learnings/` gains six files and edits two." The count was true at the audited pin. Phase 1's servitor wrote those files. The servitor of the Release phase and the Lead's Gate-2 commit land after the release commit, so the bare count goes stale at land.

The auditor filed a Nit with `disposition: absorb` and asked for the bound "through Phase 1" in both twins, byte-identical. The fix landed before the phase closed. The 0.21.18 text landed as "gains six files and edits two through Phase 1" in both places.

**Precedent.** The previous release (0.21.17) already used the bounded form in its CHANGELOG head entry: "gains 28 files through Phase 7 and edits three archived lessons".

**Rule.**
1. In a plan's final Release phase, any count of lesson files in the Release scope carries "through Phase N".
2. N is the last phase whose servitor had finished when the release commit was cut.
3. The Release phase's own servitor commit enters the window after the release commit, so an unbounded count is false by the time it lands.

Same family as [[bounded-window-measurement-comment-self-invalidates-when-its-own-release-commit-lands]] (a later commit enters the window the sentence measures) and [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (a count word that outruns its enumeration).

**Locate-cue (verify still present before acting).** `CHANGELOG.md` `## 0.21.18`, `Release scope:` paragraph. Search `through Phase 1`. Its README twin is the `## Status` `Release scope:` paragraph, which is replaced at each release, so it carries the current release's bound: search `through Phase` there. Grounded at the landed tip via the run-scoped `_refinery` worktree (rung 2, `<repo-root>/.claude/war-worktrees/<run-id>/_refinery`).
