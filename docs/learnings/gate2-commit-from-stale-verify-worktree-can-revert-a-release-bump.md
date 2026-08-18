---
name: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
description: "MITIGATED (#1083): a Gate-2 commit from a stale verify worktree can silently revert a release bump; lock-step is not monotonic"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  promoted: dev/2026-07-22-cli-main-guard-normalization@phase-2
  slug: gate2-commit-from-stale-verify-worktree-can-revert-a-release-bump
  phase: "war-campaign-resilience-roadmap plan 8 (cli-main-guard-normalization) — Lead-caught during plan-8 phase-2 setup, 2026-07-23; MITIGATED gate-evidence-and-release-integrity/phase-1 task 1.4 (#1083, landed dev/2026-07-24-gate-evidence-and-release-integrity, 2026-07-26)"
  keywords:
    - Gate-2 promotion commit
    - stale verify worktree
    - version slot regression
    - release bump reverted
    - version-slots lock-step not monotonic
    - git add picks up stale tracked files
    - stacked PR version conflict
    - plugin.json marketplace.json README Status
    - lock-step invariant blind to downgrade
    - restore release on predecessor tip then merge into successor
    - monotonic floor
    - pre-push staged-file check
    - publication-worktree dirty-reuse refusal
    - EX_WRONG_BRANCH
  tags:
    - release
    - version
    - gate-2
    - campaign
  originSessionId: 8e99f0a3-aecc-4068-9cd8-79868840feb7
  modified: 2026-07-26T22:55:35.620Z
---

# A Gate-2 `docs(learnings)` commit from a stale verify worktree can silently revert a release bump

## What happened (code-verified — directly confirmed by `git show`/`git diff` against the campaign branches)

During the `run-resilience-and-hardening` campaign (stack-and-plow, ADR 0011), plan 7's phase-2
Release merge `1edd92d` correctly bumped all four version slots to `0.14.55`. The very next commit
on that branch — the phase-2 **Gate-2** promotion `cae15d3` (`docs(learnings): phase 2 …`) —
reverted `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (both `metadata.version`
and `plugins[0].version`), and the `README.md` `## Status` blurb back to plan 6's `0.14.54`
release. The Gate-2 commit was staged in a **verify worktree** whose tracked version-slot files
still held `0.14.54` (a prior `git checkout <older-sha>` had left them stale); a broad `git add`
during the learnings commit picked up those stale files alongside the intended
`docs/learnings/*.md` edits.

Because plan 8 was cut from plan 7's tip, the whole plan-8 stack inherited the reverted version,
and plan 7's open PR head showed `0.14.54` + plan 6's blurb — its `0.14.55` release effectively
erased.

## Why the guard missed it

At the time, `skills/war/assets/version-slots.test.mjs` locked the four release slots **in
lock-step** only — it asserted they all carry the *same* version, fail-closed, but **not** that the
version **increased** over any base. A wholesale revert that moves all four slots down together
(here `0.14.55` → `0.14.54`) keeps them consistent, so the lock-step invariant still held and the
test stayed green. Lock-step ≠ monotonic. (Closed by layer 1 below.)

## Detection (the check that would have caught it at land)

At each phase-close / stacked-PR boundary, read the four version slots at the **branch tip** and
compare against the expected next-free-patch above the landed predecessor. A tip reading a version
**≤ a landed predecessor's** is a regression, even when all four slots agree. `git show
<tip>:.claude-plugin/plugin.json` is the one-line probe; do it as part of verifying a Release
phase's End state, not only the lock-step test.

## Fix pattern (when a successor stack was already cut from the bad tip)

1. Restore the correct version on the **affected branch** — extract the good slot files from the
   release merge (`git show <release-merge>:<file> > <file>`) and commit on that branch. This
   corrects its own PR.
2. If a successor branch was cut from the bad tip, make the successor **contain** the fix: merge
   the corrected predecessor tip into the successor (a stack-sync merge of the immediate
   predecessor — not a merge of master, so ADR 0011 is intact). Because the successor never touched
   the version slots, the merge is conflict-free and its own later Release bump then descends from
   the restored version and merges cleanly when the stacked PR lands.

## Prevention

Staging only the explicit `docs/learnings/<slug>.md` paths is **not sufficient** — it was tried and
still failed here. A verify/publication worktree reused across phases can hold the release branch at
an older tip: when a later phase lands elsewhere (the `_refinery` push-first CAS), this worktree's
checked-out working tree and index keep the **old** version-slot files, and the Gate-2 commit
records them relative to the new parent as a downgrade — no blanket `git add` required. The
authoritative guard is **detection, not staging discipline**: after *any* commit made in a reused
verify worktree, inspect what the commit actually staged before pushing (see layer 2 below). This is
the [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] hazard applied to the version
files; the safest habit is to run Gate-2 from a **freshly checked-out** worktree at the true landed
tip, never one reused across the phase's own merge work.

## Mitigation (#1083) — three layers, all landed in one phase

1. **Monotonic floor (mechanical).** `skills/war/assets/version-slots.test.mjs` gained a test
   asserting the working tree's `plugin.json#version` is `>=` the max version seen in a bounded
   first-parent window of slot-touching history. A lock-step-coherent all-four-slots *downgrade* —
   the exact shape of this incident — now reds the gate that used to pass it. Fail-open only on an
   unusable git context (non-git dir, non-zero git exit) or a genuinely empty window; a non-empty
   log that parses to zero versions is RED, never a vacuous pass. Ceiling: the load-bearing
   `--diff-merges=first-parent` flag requires git >= 2.31 — an older git exits non-zero and the
   floor fail-opens (disclosed via a `t.diagnostic`, not silent).
2. **Gate-2 pre-push staged-file check (procedural).** As of plan `gate2-publication-guard`
   (landed 2026-08-18), the `skills/war/SKILL.md` publication flow refreshes the range's left
   boundary first — `git fetch origin <working>` in the publication worktree, fail-closed: a
   non-zero fetch exit means do not probe, do not push, escalate — then, between the commit step
   and the `ensure-origin` push, enumerates **every unpushed commit** and its file set over the
   freshly-fetched range (`git log --name-only --format='commit %H' '@{upstream}'..HEAD`, with
   the deterministic `origin/<working>..HEAD` fallback when the publication worktree has no
   upstream configured), condemning any commit whose file set escapes the promotion destination
   or `CLAUDE.md` — the whole range, never the tip alone; a commit neutralized by a later
   in-range revert (git's own `This reverts commit` body token) is exempt, as is that reverting
   commit. This is the **root-cause** probe, one level above the version slots: the mechanism is
   stale *tracked files* being staged, so it catches a stale skill or hook the same way it
   catches a stale slot. Locked by the `D22_ORDERED_SPAN` ordered key in
   `skills/war/assets/skill-doc-contracts.test.mjs`.
3. **Publication-worktree dirty-reuse refusal (provisioning).** `cmd_ensure_publication_worktree`'s
   behavior (b) — registered, present, already on the working branch — now runs the same
   `status --porcelain -uno` probe as behaviors (c)/(d) and refuses a dirty reuse loudly
   (`$EX_WRONG_BRANCH`), naming the remove-then-re-provision remedy. It only ever refuses: nothing
   is reset, cleaned, or switched away. Untracked files (the `.war-task` marker) still never count.

Layers 2 and 3 also stop the *non-`git add`* variant this file's Prevention section records — a
reused worktree whose index and tree simply lag a ref that advanced underneath.

Related: [[stacked-per-branch-releases-make-main-lag-cumulative]],
[[stacked-release-plan-version-literal-lags-operator-target]],
[[version-slots-no-cross-slot-consistency-test]],
[[gate-audit-end-state-owned-by-downstream-dep-task-is-non-holding-upstream]],
[[gate-artifact-never-includes-war-memory-lint]] — sibling #1082/#1081 closures landed in the same
gate-evidence-and-release-integrity phase 1.
