---
name: a-seed-task-in-a-release-phase-merges-after-the-release-task-so-the-blurb-cannot-name-it
description: A seed task added to a release phase ships unnamed in the release blurb
metadata:
  node_type: memory
  type: project
  keywords:
    - seed task release phase
    - release blurb omission
    - CHANGELOG missing change
    - frozen phase base
    - work scope not release scope
    - phase-close absorb blurb
    - killGroup EPERM
  provenance: code-verified
  slug: a-seed-task-in-a-release-phase-merges-after-the-release-task-so-the-blurb-cannot-name-it
  phase: "2026-11-08-engine-comment-and-duplication-tidy/phase-3 (Release, tasks 3.1 + seed-1)"
  tags:
    - release
    - seed-task
    - readme-status
    - changelog
    - audit-finding
  created: 2026-11-11
  originSessionId: af72d7d8-ef0f-4543-bac4-2a766b4fb11f
  modified: 2026-11-11T21:51:23.533Z
---

# A seed task in a release phase ships unnamed in the release blurb

**The pattern:** the Lead can add a seed task to the trailing Release phase.
Every task worktree is cut from one frozen phase base.
So the release task never sees the seed's diff, and its blurb cannot describe it.
The serial merge queue here also merged the release task first and the seed second.

**Instance:** phase 3 landed task 3.1 (the 0.21.45 blurb) and seed-1.
Seed-1 made `killGroup` in `skills/war/assets/repo-gate.mjs` treat a group-kill `EPERM` like `ESRCH`.
The 3.1 correctness seat raised "Blurb omits the phase 3 repo-gate killGroup seed" as a Minor `absorb` with `phaseClose: true`.
The seat could not confirm the seed would land, so the fix was deferred to the integrated tip.

**Verified state:** at `cc48c1f9` (the integration tip, tree-equal to landed tip `b008a01b`), the `## 0.21.45` entry in `CHANGELOG.md` names no repo-gate change.
The same tree still says "names `rowText`'s two surfaces" with no list, the sibling Minor.
A later phase-close polish commit may fix both, so verify still present before acting.
Found at `CHANGELOG.md` `## 0.21.45` and `skills/war/assets/repo-gate.mjs` `killGroup` @ phase 3.

**How to apply:**
- If a seed lands in a release phase, plan a blurb line for it, or give the release task a `deps` edge on the seed.
- At phase close, diff the whole phase (`base..tip --name-only`) against the blurb, not only the release task's diff.
- Do not count on the phase-close sweep alone, because it is fail-open.

Related: [[release-blurb-headline-count-word-can-mismatch-its-own-enumeration]] (the "two surfaces" bare count is its "true count with no enumeration" sub-shape).
[[release-blurb-categorical-scope-enumeration-omits-a-window-class-despite-a-dedicated-checklist-item]] (same omission family, window scope).
