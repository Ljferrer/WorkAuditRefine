---
name: an-in-run-repo-lesson-edit-leaves-the-same-slug-local-copy-stale
description: "An in-run edit to a docs/learnings lesson leaves its same-slug local copy stale, and that copy can overwrite the fix on promote"
metadata:
  node_type: memory
  type: project
  keywords:
    - stale local copy
    - overwrite-on-promote
    - Gate 2 promotion
    - same slug
    - late-fix lesson edit
    - RESOLVED stamp
    - local memory root
  provenance: code-verified
  slug: an-in-run-repo-lesson-edit-leaves-the-same-slug-local-copy-stale
  phase: 2026-11-08-engine-recovery-relaunch-and-land/phase-1
  tags:
    - memory
    - promotion
    - servitor
  created: 2026-11-09
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-09T13:22:21.008Z
---

# An in-run repo lesson edit leaves the same-slug local copy stale

**What happened.** Late fixes 89a9e678 and 7aed5190 marked two repo lessons RESOLVED in `docs/learnings/`.
A worker cannot write the local memory root, so the same-slug copies there kept the retired text.
The two lessons are `never-move-report-it-merged-sentence-resolves-to-a-hold-not-a-recorded-merge` and `a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3`.
The late-fix pass noted the gap and left it to the servitor.

**Why it matters.** Both stale copies carried `type: project`, and one carried a `metadata.promoted:` stamp.
Gate-2 promotion overwrites the same-slug repo file with the local copy.
So an unsynced stale copy can silently revert the in-run fix at the next promotion.
The local `MEMORY.md` row also keeps the old description until the copy changes.

**How to apply.**
- If a phase edits a lesson under `docs/learnings/`, Glob the local root for the same slug.
- If a provenance-tagged local copy exists, rewrite it as a full copy of the landed repo text.
- Keep its `metadata.promoted:` stamp.
- If the local copy has no `metadata.provenance`, leave it untouched and report it to the Lead.

Locate-cue: verify still present before acting. Both repo lessons read RESOLVED at landed tip f8ea3b11, through the run's `_refinery` worktree. Both local copies were synced at phase 1 close.

Related: [[audit-log-finding-can-be-stale-by-land-time]], [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]].
