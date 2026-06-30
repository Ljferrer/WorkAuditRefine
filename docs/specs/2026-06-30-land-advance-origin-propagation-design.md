# Land-advance reports `landed` from a process exit code, not from origin truth

**Status:** proposed — targets **v0.8.1** (behavioral-bug fix; builds on **v0.8.0** master tip after the two
submodule-support increments). **Severity: HIGH.**
**Source:** issue #251. Memory: `land-advance-push-first-cas-rejected-token`, `war-phantom-land-reports-success-without-advancing-integration`, `land-decision-not-demoted-on-land-step-failure`, `land-local-follower-ref-can-lag-sync-before-next-phase`.

This is the lone behavioral BUG in the audit batch. It lands **first** (landOrder 1) so every later spec rebases onto the corrected land path.

## Problem

The dispatched land phase advances the **local** follower ref to the agent-supplied merge-sha whenever the push process exits 0 — even when origin never moved. Two gaps compound, both at step 3 of the land:

**(1) Step 3 is the only un-pinned step in the land prompt.** In [workflow-template.js: the `if (landDecision === 'landed')` land block](../../skills/war/assets/workflow-template.js), steps 1 and 2 are explicitly pinned to the refinery worktree with `git -C ${refineryLandPath}` (the `fetch`/`checkout --detach` and the `merge --no-ff`). Step 3 then emits a **bare** ``provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>`` with no `git -C ${refineryLandPath}` and no `cd` — so it runs against whatever ambient cwd the refiner happens to be in.

**(2) `cmd_land_advance` never reads origin back after the push.** In [provision-worktrees.sh: `cmd_land_advance()`](../../skills/war/assets/provision-worktrees.sh), both the CAS expected-value (`git rev-parse "refs/heads/$working"`) and the push (`git push origin "HEAD:refs/heads/$working"`) run against the ambient repo resolved by [`git_dir()`](../../skills/war/assets/provision-worktrees.sh) — no `-C`, no worktree arg. The local `update-ref` advances on `push_rc -eq 0` alone. The header comment block above the function documents the push-first CAS and `[rejected]` classification but states **no cwd precondition**.

The interaction: if the refiner's cwd is **not** `_refinery` when step 3 fires (the Lead's main checkout, or any sibling worktree on the same origin), `HEAD` is the working branch's **old** tip — which origin already has. `git push` reports "up-to-date", exits 0, emits no `[rejected]`. Step 3 then advances the **local** `refs/heads/$working` to the agent-supplied `<merge-sha>` (reachable in the shared object DB after the detached merge). Result: **local moves, origin doesn't, status=`landed`, no escalation** — the exact reported symptom.

The existing test masks it: [provision-worktrees.test.sh: `run_in_detached()`](../../skills/war/assets/provision-worktrees.test.sh) does `git checkout --detach "$sha"` so `HEAD` **is** `$new_sha` before every land-advance call. It only ever exercises the happy precondition production fails to enforce.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| 1 | Where to make `landed` contingent on origin | Add an **origin readback** in `cmd_land_advance`: after `push_rc -eq 0` and **before** the local `update-ref`, assert `git ls-remote origin refs/heads/$working` == `$new_sha`; on mismatch do **not** advance local — `exit 3` (escalate). One guard in the shared function closes the no-op-push hole regardless of cwd. | Patch only the workflow prompt — leaves the latent gap and every other caller of land-advance still trusting the exit code. |
| 2 | Fix the ambient-cwd dependency at the call site | Pin step 3 in the land prompt: `cd ${refineryLandPath} && provision-worktrees.sh land-advance …` so the subcommand runs in `_refinery`, matching steps 1-2. | Add a worktree-path arg to the subcommand and thread `git -C` through every git call inside it — larger diff, and the readback (Decision 1) already makes the result correct regardless of cwd, so the cwd pin only needs to be belt-and-suspenders. |
| 3 | Close the test blind spot | Add a regression case that calls land-advance from a cwd whose `HEAD` is **not** `$new_sha` (the un-pre-detached path `run_in_detached` skips) and origin is already at `HEAD` — assert it does **not** report success and the local ref does **not** silently advance past origin. | Keep relying on `run_in_detached` — it structurally cannot reach the failing precondition. |

## Affected files

| File | Change |
|------|--------|
| [skills/war/assets/provision-worktrees.sh](../../skills/war/assets/provision-worktrees.sh) | In `cmd_land_advance`, after `push_rc -eq 0`, before the `update-ref` branch: `ls-remote origin refs/heads/$working`; if it != `$new_sha`, `exit 3` (escalate) without advancing local. Update the header comment to document the readback as the success gate. |
| [skills/war/assets/workflow-template.js](../../skills/war/assets/workflow-template.js) | Step 3 of the land prompt: prefix the bare `provision-worktrees.sh land-advance …` with `cd ${refineryLandPath} && …` so it runs in the refinery worktree like steps 1-2. |
| [skills/war/assets/provision-worktrees.test.sh](../../skills/war/assets/provision-worktrees.test.sh) | New case: land-advance from a non-pre-detached cwd whose `HEAD` is already on origin → assert no false `landed` (exit 3 / local ref unchanged past origin). |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to v0.8.1 (4 canonical slots; from master tip v0.8.0). |

## Alternatives considered

- **Status quo (rejected):** `landed` stays contingent on a process exit code. A no-op push from the wrong cwd exits 0 and silently advances only the local follower — the bug as filed.
- **Demote `landed` downstream in the Lead instead of in the subcommand (rejected):** the Lead has no cheap origin-truth signal short of its own `ls-remote`; putting the readback inside `cmd_land_advance` fixes it once for all callers (`land-decision-not-demoted-on-land-step-failure` is the symptom of trusting the self-report). Per ponytail: one guard where all callers route through, not a guard per caller.
- **Drop the cwd pin and rely on the readback alone (rejected as sole fix):** the readback makes the *result* correct, but a wrong-cwd push still does the wrong thing first (no-op against the wrong HEAD) and then escalates spuriously. Pinning cwd keeps the happy path actually pushing the merge-sha; the readback is the safety net.

## Validation criteria

1. **(#251 — primary)** A land-advance invocation whose cwd `HEAD` is **not** the merge-sha and whose origin already holds that `HEAD` no longer reports success: `cmd_land_advance` exits 3 (escalate) and leaves `refs/heads/$working` un-advanced past origin. New `provision-worktrees.test.sh` case (calling the script **without** `run_in_detached`) asserts both the exit code and that local does not silently lead origin; it FAILS against the pre-fix `cmd_land_advance` (proving the assertion is load-bearing, per `weak-test-assertion-passes-without-feature-being-exercised`).
2. **(#251 — readback gate)** After a clean push, `cmd_land_advance` performs `git ls-remote origin refs/heads/$working` and advances the local ref **only** when it equals `$new_sha`; a mismatch escalates (exit 3) rather than advancing. Asserted by extending the T2.x land-advance cases to confirm origin and local agree post-success, and that an induced origin/`$new_sha` divergence escalates.
3. **(#251 — cwd pin)** The emitted land prompt's step 3 runs land-advance inside `${refineryLandPath}`: a grep over the workflow-template land block confirms step 3 carries `cd ${refineryLandPath} &&` (or `git -C ${refineryLandPath}`), so no bare `provision-worktrees.sh land-advance` remains in the `landDecision === 'landed'` block.

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #251 | 1 (origin readback), 2 (cwd pin), 3 (regression test) | 1, 2, 3 |

## Open risks / non-goals

- **Non-goal:** the opportunistic resync (§5.4, the `landResult.status === 'landed'` branch in workflow-template.js) is untouched — it is already ff-only/clean-guarded and reads origin as truth. This spec only fixes the step-3 advance that feeds it.
- **Risk (acceptable):** the readback adds one `ls-remote` round-trip per land. Negligible vs. a phantom partial-land; this is the operator's stated trade (`cost-not-a-concern-max-20x`).
- **Latent sibling:** the reland loop still re-fetches and retries on exit 2; exit 3 from the readback maps to
  `status:'error'`, which the land block routes via its `else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed'))`
  branch to `landDecision: 'held:land-failed'` — **not** through `HARD_ESCALATION_REASONS` (`'error'` is deliberately
  excluded from that const). This plan introduces **no** new status enum member (avoids
  `shared-status-enum-widening-silently-widens-land-path`).
  - *v0.8.0 re-ground:* the MERGE_RESULT `status` enum widened at v0.8.0 to add `submodule-blocked` (merge-task,
    hard-escalate, 0 fix rounds) and `submodule-pr` (land-phase). `submodule-pr` is mapped **directly** to
    `landDecision: 'held:submodule-pr'` (DP2 — the same direct-return pattern as `held:workflow-error`, evaluated
    *before* the `error||gate_failed` branch and deliberately NOT routed through `HARD_ESCALATION_REASONS`). Those are
    the submodule increments' additions; `cmd_land_advance`'s `exit 3` never emits a submodule status, so this fix is
    orthogonal to them and the `error||gate_failed` → `held:land-failed` route is unchanged.

## Version serialization

Bumps the four canonical slots — `plugin.json`, `marketplace.json` (×2), and the `README.md` `## Status` line — from the master-tip v0.8.0 to **v0.8.1** (`Builds on v0.8.0`). No badge. Lands serially as **landOrder 1**; later specs in this batch rebase onto this corrected land path and continue the version stack (v0.8.2…v0.8.6).

**Gate:** `node --test "skills/**/*.test.mjs"` plus the 13 `*.test.sh` runners (self-discovered by the `find` runner; includes `provision-worktrees.test.sh` and the v0.8.0 `assert-no-submodule-mutation.test.sh` floor).
