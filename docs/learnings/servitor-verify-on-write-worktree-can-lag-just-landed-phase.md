---
name: servitor-verify-on-write-worktree-can-lag-just-landed-phase
description: "Servitor verify-on-write checkout can lag the landed phase"
metadata:
  node_type: memory
  type: project
  provenance: code-verified
  slug: servitor-verify-on-write-worktree-can-lag-just-landed-phase
  phase: guard-floor-and-scope-hook-coverage-completeness/servitor-wrapup +20 recurrences (latest precision-chain-and-loop-breaker/phase-5 wrap-up, 2026-08-05) — MECHANIZED at phase servitor-wrapup-landed-tip (2026-07-22)
  promoted: dev/2026-07-22-aftermath-class1-postdelete-verify@phase-2
  tags:
    - servitor
    - memory-protocol
    - worktree
    - verification
    - process
  created: 2026-07-10
  updated: 2026-08-05
  keywords:
    - phase boundary persistence
    - cross-phase gitdir sweep
    - trailing release phase persistence check
    - p2-2.17
    - landed tip anchor
    - Landed tip prompt line
    - landedTipAnchor
    - grounding ladder
    - tipSha hoist
    - ADR 0034
    - premise retired
    - stale worktree
    - D3 verify-on-write
    - servitor cwd
    - landed phase
    - worktree lag
    - absence check
    - branch mismatch
    - phase wrap-up
    - checkout stale
    - gate-audit rationale
    - positive confirmation
    - session-stable lag
    - HEAD ref check
    - task worktree gitdir
    - war-worktrees
    - worktree name collision
    - reserved worktree name _refinery
    - gitdir numeric suffix
    - reaped task worktree
    - gate-audit confirmed-tip fallback
    - main checkout no worktree
    - branch not locally fetched
    - packed-refs absent
    - version-slots test
    - release version bump verification
    - loose ref present no checkout
    - same branch reused across phases
    - campaign branch persistence
    - servitor cwd is a linked worktree
    - Glob bare directory pattern returns nothing
    - Glob wildcard file suffix required
    - false negative live worktree enumeration
    - HEAD suffix glob pattern
    - nested task worktree under session worktree
    - war/wt path convention
    - task worktree naming scheme drift
    - release phase version bump confirmed via task worktree
    - p3-3.1
    - cross-phase fix persistence
    - trailing release phase wrap-up
    - test orchestration harness gap not phase-specific
    - p2-2.13
    - p2-2.16
    - _refinery6
    - persistent worktree fixture
    - cross-campaign recurrence
    - long-lived session worktree
    - war-memory-hardening
    - cli-main-guard-normalization
    - realpathSync gitdir sweep
    - refinery worktree resets after land
    - ort strategy merge tree-identical
    - first-parent ancestor merge commit
    - Landed tip line present but sweep still short
    - _refinery7
    - p5-polish worktree
    - reflog HEAD history
    - dev branch ref matches but no live worktree
    - run-UUID worktree directory
  originSessionId: 8c039a7f-0c62-47a8-85f9-10099b5a6caf
  modified: 2026-08-07T00:16:06.428Z
---

# A servitor's own worktree checkout can lag the phase it is wrapping up

**MECHANIZED (phase `servitor-wrapup-landed-tip`, 2026-07-22).** `skills/war/assets/workflow-template.js` (the `LANDED-TIP ANCHOR (hoisted; spec D1)` banner) computes `landedTipAnchor` before the Wrap-up dispatch, with the placeholder `landed tip unrecorded — ground via the gate-audit auditSha entries in your audit-log input` as fallback (ADR 0034). The Wrap-up prompt carries a `Landed tip:` line and the LANDED-TIP GROUNDING ladder; `agents/war-servitor.md` mirrors both (Inputs bullet and `### Landed-tip grounding`, see [[standing-instruction-vs-dispatched-prompt-coverage-split]]). A `Landed tip:` line in the spawn prompt is the grounding. Its absence is not proof of a regression: some harness spawn paths have not threaded it, so fall back to the gitdir sweep.

## The rule

The servitor's Read/Grep see whatever is checked out at its cwd, a worktree frozen at provision time (ADR 0001) and never re-synced after land. When D3 verify-on-write finds a phase referent absent, first suspect checkout lag. Never write a plan/code-mismatch lesson from a local absence alone: read the referent at a worktree proven to hold the landed tip, or tag the fact `agent-unverified` with an absence note. Positive claims are exposed too: a gate-audit "verified MET" re-read against a stale checkout is equally suspect. One HEAD/branch mismatch is session-stable, so do not re-diagnose per phase. When no readable worktree resolves to the phase, trust the gate-audit's pinned-`auditSha`, `gateEvidence:true` confirmation over a stale-cwd read. A bare ref with no live worktree on it is a dead end (no Bash to check it out), not `code-verified`.

## The gitdir-sweep fallback

`<repo-root>/.git/worktrees/` is readable with Glob/Read and no Bash. Sweep `Glob '.git/worktrees/*/gitdir'` (and `*/HEAD`), pick the entry whose `gitdir` path contains the phase's plan slug, and read referents there. Read the `gitdir` value; never guess a path shape. A `_refinery` worktree whose detached HEAD equals the landed tip is the strongest match. A later phase's task worktree carries every prior-phase commit, so it doubles as a persistence check.

- **Glob gotcha:** a bare `Glob('.git/worktrees/*')` matches files, not directories, so it returns zero entries even when dozens exist. Always use a file-suffixed pattern (`*/HEAD` or `*/gitdir`).
- **Name-collision rule:** worktree names (task ids like `p1-1.1`, and `_refinery`) collide across concurrent plans, and git adds a numeric suffix (`p1-1.11`, `_refinery8`). Never trust a bare name; confirm via `gitdir` and `HEAD`, and re-sweep per wrap-up.
- **Run-UUID gotcha:** run worktrees can live under `.claude/war-worktrees/<run-uuid>/<name>/`, so a plan-slug filter can return zero. Then Glob every `*/HEAD` and compare to the landed tip. The audit log's `gate_log_path` strings also name the run's worktree root.
- **No worktree parked at the tip:** after land the refiner returns `_refinery` to the phase integration branch, so no live worktree may sit at the landed SHA even when the sweep works (Recurrence 20, 2026-08-05). The integration tip is tree-identical to a `dev/<slug>` land merge whose first parent is already its ancestor, so the nearest worktree is a valid read surface for content; keep the pinned `auditSha` as the authority.

## History

Twenty recurrences (2026-07-10 to 2026-08-05) across every cwd topology: an unrelated session worktree, a main checkout with no live worktree, a loose ref with no checkout, and reaped task worktrees whose name now points at another plan. A long-lived harness session worktree was stale for seven wrap-ups in a row; on sight of a reused session worktree, go straight to the sweep. A plan citing a lower recurrence count over a stated window is a point-in-time citation, not a contradiction.

## Related

[[audit-worktree-pre-impl-tip-stale-verdict]] (auditor-side analogue), [[land-local-follower-ref-can-lag-sync-before-next-phase]] (same staleness at the ref layer), [[war-launch-worktree-with-working-branch-checked-out-forces-manual-land]], [[audit-log-finding-can-be-stale-by-land-time]] (the negative-finding sibling). Facts confirmed via the sweep: [[wave-loop-thunk-catch-prevents-null-result-infinite-redispatch]], [[entry-validation-unconditional-phase-field-check-comment-overclaims-runtime-path]], [[gate-audit-inline-prompts-excluded-from-auditprompt-both-surfaces-coverage]], [[baseline-debt-dedup-exact-set-not-subset]], [[git-common-dir-anchor-idiom-fail-open-gotchas]], [[git-probing-hook-requires-fixtures-outside-any-git-repo]], [[release-bump-slots-canonical-no-badge]], [[byte-convergence-plan-can-mandate-per-file-import-style-variant]].
