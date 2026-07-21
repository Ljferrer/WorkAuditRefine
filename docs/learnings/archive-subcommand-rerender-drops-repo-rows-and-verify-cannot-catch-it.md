---
name: archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it
description: "RESOLVED (lessons-learned-repo-projection-integrity/2.1): archive's local-only re-render + verify's blind spot closed by a do_verify repo-completeness hard fail"
metadata: 
  node_type: memory
  type: project
  provenance: code-verified
  slug: archive-subcommand-rerender-drops-repo-rows-and-verify-cannot-catch-it
  phase: "lessons-learned-repo-projection-integrity/phase-2 (Release, task 2.1)"
  keywords: 
    - war-memory
    - archive
    - render-index
    - repo rows
    - projection
    - safe-swap
    - do_verify
    - CLAUDE_MEMORY_REPO
    - wholesale drop
    - repo-completeness
    - lessons-learned
    - housekeeping
    - resolved
  tags: 
    - memory-tooling
    - lessons-learned
    - resolved
  created: 2026-07-13
  updated: 2026-07-16
  originSessionId: e11422bd-1b49-4d13-9840-37a67306b3f5
---

# RESOLVED — archive's local-only re-render + verify's blind spot to a wholesale `[repo]`-row drop

**Original defect (#891, 2026-07-13, superseded — see below):** `war-memory archive` re-renders
the projection into the local root as its last step, walking only the roots it was given —
`cmdArchive` calls `resolveRoots(argv)` so it does accept `--repo`, but the `/lessons-learned`
Phase 5 template invoked it `--local`-only. On a repo-adopted store that intermediate render
silently dropped every `[repo]` row (observed: 23,888 B / 144 lines → 3,849 B / 30 lines).
`safe-swap.sh verify` could not catch this: its hard checks (index-row→file, budget) and warn
checks (unindexed file, dangling link) are internal-consistency checks, not completeness checks
against a root the script was never told about.

**Resolution — code-verified 2026-07-15 at this plan's own task worktree** (`p2-2.1` for plan
`2026-07-14-lessons-learned-repo-projection-integrity`, resolved via `.git/worktrees/p2-2.1{1,2}/gitdir`
per [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] — this servitor's own session
worktree still showed the pre-fix script with no repo-completeness block at all, confirming the
lag pattern yet again):

1. **`skills/_shared/war-memory.mjs`'s `resolveRoots()` already read `CLAUDE_MEMORY_REPO`** as a
   fallback for `--repo` (`argv.repo || process.env.CLAUDE_MEMORY_REPO || null`) — PRE-EXISTING
   behavior the plan leveraged, not a change (the plan's stack diff touches no `war-memory.mjs`;
   its spec §5/§9 forbade it, and the phase-2 gate-audit proved the forbidden-path clause MET).
   Every command built on `resolveRoots` — including `archive`'s internal re-render — inherits the
   env convention for free. Zero new argument parsing (the plan's own Method clause).
2. **`skills/lessons-learned/assets/safe-swap.sh`'s shared `do_verify` gate** gained an *additive*
   Rule 3: when `CLAUDE_MEMORY_REPO` is set AND resolves to an existing directory AND that
   directory holds >= 1 top-level hot lesson, but the projection's `[repo]`-marked row count is
   zero, `do_verify` now **FAILs** with a fix hint (`re-render with: render-index --local <staging>
   --repo <repo root>`). An unset env, a misconfigured (non-directory) env, or a legitimately-empty
   repo root (e.g. post-`evict`) all stay silent/WARN-only — never a false hard-fail, and legacy
   (env-unset) invocations are byte-identical in output.
3. The row-count check is **row-scoped** (`grep -E '^\|' ... | grep -c '\[repo\]'`), never a
   whole-file `grep -c '\[repo\]'` — a whole-file count would false-PASS if the literal string
   `[repo]` happened to appear inside a surviving *local* row's summary cell.
4. The test suite (`safe-swap.test.sh`) explicitly `unset CLAUDE_MEMORY_REPO` before its
   pre-existing (Rule-1/Rule-2) fixture cases, precisely because an ambient export of that same
   convention from an unrelated playbook (e.g. `references/migration.md`'s own example export)
   would otherwise silently activate the new Rule-3 path in fixtures that predate it.

**Correction at Gate-2 (Lead-verified against the landed branch, 2026-07-16):** the Phase 5
archive invocation in `skills/lessons-learned/SKILL.md` DOES now carry the explicit flag —
`archive --local "$STAGING" --repo "$REPO_ROOT" <slug>...` — added by this plan's Task 1.1 (its
End state 9, audited met) and pinned by a new doc-contract lock. The servitor draft of this note
claimed the callsite was flag-less by design; that read came from a stale checkout (the
verify-on-write lag hazard this note's sibling documents). The real belt-and-suspenders shape:
the explicit `--repo` on the Phase 5 command (lock-pinned) is the belt, and `resolveRoots`'s
pre-existing `CLAUDE_MEMORY_REPO` env fallback (point 1) is the suspenders — either alone keeps
`[repo]` rows through archive's internal re-render; `do_verify`'s Rule-3 hard fail backstops
both.

**Why it matters:** the original write-up's "how to apply" advice (manually `grep -c '\[repo\]'`
after every archive, treat the explicit Phase 5 render as REQUIRED) is now a belt-and-suspenders
habit rather than the only backstop — `do_verify` itself now hard-fails the wholesale-drop case,
provided `CLAUDE_MEMORY_REPO` is exported in the calling shell.

Related: [[servitor-verify-on-write-worktree-can-lag-just-landed-phase]] (how this resolution was
confirmed despite this servitor's own lagging checkout), [[projection-byte-budget-driven-by-descriptions-not-bodies]].
