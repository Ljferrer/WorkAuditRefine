# Submodule flows — router, resume co-truth, `held:submodule-pr`

Verbatim evictions from `skills/war/SKILL.md` (prompt-surface simplification, spec §4.3; each moved
block was byte-identical to its pre-eviction SKILL.md text **at eviction time**). Positional words
inside the moved blocks ("above", "below") refer to their original SKILL.md positions; the
Checkpoint's `held:submodule-pr` outcome bullet lives with the other `held:*` arms in
[resume-and-recovery.md](resume-and-recovery.md).

## Submodule router (Decompose step 8)

Trigger: `.gitmodules` declares a submodule path overlapping a task's target.

8. **Submodule router (Increment 2).** After extracting the DAG, call `submodulePaths(repoDir)` (from `skills/_shared/provision.mjs`) to get the declared submodule paths from `.gitmodules`. For each task whose target overlaps a submodule path, **propose** to the user:
   - classifying that task as a **submodule task** (`target repo` = the submodule);
   - adding a paired **gitlink-bump task** (depending on the submodule task) that records the new pin in the superproject.
   **Require human approval** for each proposal before filing any issues. The `target repo` tag must be **explicit** on the sub-issue and in the ledger — never implicit.
   - **Base branch (launch-time resolution):** resolve in this order: (1) a run-config `overrides.submoduleBaseBranch` for that submodule; (2) the `branch` field for the submodule in `.gitmodules`; (3) otherwise **raise to the human** — never silently use the remote default.
   - **Reachability precondition:** verify `gh`-reachability of the submodule remote at `/red-team` time (before the run), not at runtime — a non-reachable remote surfaces as a `/red-team` finding, not a mid-run crash.
   - **AFK ownership confirmation:** if `--afk` is set, an un-owned submodule (2B path) is **refused at launch** — a 2B hold can never be cleared without human interaction, so allowing the run to start would guarantee a deadlock.

## Resume — submodule remote as co-source-of-truth

Trigger: on resume, a phase ledger records a `submodule_merge_sha` (a gitlink pin).

**Reconciliation extension — submodule remote as co-source-of-truth (Increment 2).** For any phase whose ledger records a `submodule_merge_sha` (a gitlink pin), the pre-flight additionally verifies reachability of that SHA on the submodule remote (`git -C <submodule-checkout> fetch && git cat-file -e <submodule_merge_sha>`). The recorded gitlink SHA is authoritative **only when reachable on the submodule remote** (same advisory rule as the superproject `merge_sha`). A gitlink SHA that is not reachable on the submodule remote → treat as class A (ledger-ahead for the pin; clear the pin from the ledger, surface to the user before re-landing).

## `held:submodule-pr` sub-procedure (human-triggered resume)

Trigger: the current phase has `landDecision:'held:submodule-pr'` and a human re-triggered `/war`.

**`held:submodule-pr` sub-procedure (human-triggered resume).** When the current phase has `landDecision:'held:submodule-pr'`, the Lead performs this procedure **on human trigger** (not automatically, no poller):
1. Read the PR number and submodule remote from the ledger.
2. Run `gh pr view <pr-number> --json state,mergeCommit --repo <pr_remote>`.
3. **If `state === "MERGED"`:** take `mergeCommit.oid` as the submodule phase's landed SHA (correct for squash and rebase merges). Write it to the ledger as `submodule_merge_sha`. Clear the `held:submodule-pr` hold. Proceed to run the gitlink-bump task (the dependent bump task that pins the new SHA in the superproject).
4. **If `state === "OPEN"` (or any non-MERGED state):** stay held; report the current PR state to the user; do not advance the DAG.
5. **Fallback:** if `gh pr view` fails or `mergeCommit` is absent, accept an operator-supplied SHA (`submodule_merge_sha` provided directly by the user) and proceed as in step 3. Never guess a SHA.
