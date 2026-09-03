# Budget-Raise floor — full branch prose + funded evictions

Read this file when the merge-task **Budget-Raise citation floor** fires (`agents/war-refiner.md` § merge-task step 7), when a `Budget-Raise:` trailer must be authored or judged, or when a trigger pointer on the refiner card names one of the evicted blocks below. The evicted blocks were moved here from `agents/war-refiner.md` as ADR 0042 byte-funding for the step-7 wiring (plan 2026-08-25-engine-reliability-and-filing-fidelity, Phase 2 Task 2); each block still speaks in the card's own voice — its step numbers refer to the card sections it was lifted from (resolve them against `agents/war-refiner.md`). Provenance differs by block. The CAS-loop, `*-proceed` asymmetry and floor-order blocks are byte-identical to their pre-eviction card text at eviction time, and their in-page anchors resolve against the card. The Gate-contract block is byte-identical at eviction time except for one rewrite: the card's in-page `#gate-failure-classification` anchor became a plugin-root-anchored link back to the card, because an in-page anchor cannot resolve from this file.

## Budget-Raise citation floor (merge-task step 7 — full branch prose)

`assert-budget-raise-cited.sh <integrationBranch> <taskBranch>` is the merge-path counterweight to the prompt-surface budget ratchet: a merge range that RAISES any `hard:`/`advisory:` ceiling value in `skills/war/assets/prompt-surface-budgets.test.mjs` (a `FILE_BUDGETS` row, `WORKFLOW_LITERAL_BUDGET`, or any future sibling constant — detection is default-deny; the script header is the authority on detection mechanics) must carry, on at least one commit in the range, a commit trailer of the exact form:

```
Budget-Raise: ADR-0042 <surface> +<bytes>
```

Branch on the exit code (run in `<taskWorktree>`, the same calling shape as `assert-test-in-diff.sh`):

- **exit 0** — no ceiling touch, a pure ratchet-down (lowering needs no trailer), a brand-new constant's initial values, or a raise whose range carries a well-formed trailer; continue to merge.
- **exit 1** — a ceiling raise (or default-deny raise-suspect) with NO trailer in the range: the **budget-uncited** route. Return `status: "no-test"` **plus `floor_route: "budget-uncited"`** — the in-band route marker (the `MERGE_RESULT` status enum is never widened; the red-team adjudication rules status widening outside the pre-authorization, so the route rides an existing floor status exactly as the segmented-land marker rides a field). Do **NOT** merge. The Workflow routes the no-test-style bounded fix-worker + full re-audit sub-loop; the fix message points at the trailer form above and at the operator **re-baseline pass** ([budget-rebaseline.md](budget-rebaseline.md)) — a worker funds growth *under* the existing ceiling (ADR 0042 eviction to `references/` behind a trigger pointer); a ceiling change is an operator act via the re-baseline pass, never a silent raise.
- **exit 2** — a git/ref error: return `status: "error"`, never the budget-uncited route — the exit-1-vs-2 split is the same correctness boundary as the sibling merge floors (ADR 0006: 2 never collapses into 1).

## Evicted: § land-phase / Superproject phase — CAS loop (card step 2) + landed return (card step 4)

Card step 3 (the final-failed-CAS-attempt reland discrimination) stays on the card between these two steps.

2. In `_refinery`, run the following push-first CAS loop (≤ `roundLimit` attempts):
   ```
   git -C <_refinery> fetch
   git -C <_refinery> switch --detach origin/<working>        # re-base the land on the shared tip each iteration
   git -C <_refinery> merge --no-ff integration/<slug>/phase-N
   <run the gate>                                              # green required
   provision-worktrees.sh land-advance <working> <merge-sha>
   ```
   - `land-advance` does a **no-force** `git push origin HEAD:refs/heads/<working>`. The remote's non-ff rejection IS the atomic compare-and-swap against shared truth (another run advanced the working branch). The local `refs/heads/<working>` advances **only after** a successful push (as a follower). A rejected push leaves the local ref unchanged — nothing to rewind.
   - On push success → exit the loop, proceed to step 3.
   - On push rejection (reland code) → go back to the top of the loop (re-fetch, re-detach at new `origin/<working>`, re-merge, re-gate). Never `--force`.
   - On any other push error → return `status: "error"` (escalate).

4. On push success → return `status: "landed"` with the new working SHA. The Lead then runs an **opportunistic resync** of its cwd: `git -C <cwd> merge --ff-only <new-working-tip>` iff the cwd is on the working branch and the tree is clean; otherwise skip. The Lead never forces or blocks on this.

## Evicted: § Gate-failure classification — the two `*-proceed` dispatch flavors are NOT symmetric

- **The two `*-proceed` dispatch flavors are NOT symmetric.** A **baseline-proceed** re-merge/re-land PROCEEDS OVER the named pre-existing failures with the debt recorded (a `source:'auto'` backstop) — the gate stays red and that is the sanctioned outcome. An **environment-proceed** re-merge/re-land waives NOTHING: it is a clean re-run in a fresh environment (fresh TMPDIR/shell) that must come back **fully green**, never a proceed-over, with no debt recorded and no backstop minted. Both are bounded at exactly ONE re-run and neither chains into the other: a second `environment` classification hard-escalates at the merge site and holds `held:land-failed` at the land site, and a second failure classified `baseline` on an environment-proceed is routed as `introduced`.

## Evicted: § Gate contract — the full contract paragraph

The gate command you receive is a **resolved, self-discovering string** — composed by the engine's **gate composition point** (the Workflow normalizes `plan.gate` through `resolveGate` at entry, idempotently, so a missed Lead pre-resolution can no longer hand you a shell-blind gate); the Lead's Setup `war-config.mjs --resolve-gate` pre-resolution is the belt. It runs the declared node/pytest/etc. suite **and** discovers + runs every `*.test.sh` in the repo via a `find`-based loop. Run it **verbatim** (do not abbreviate or re-compose it) for every merge-task, land-phase, and release check. Any non-zero exit ⇒ `gate_failed` (then classify per [Gate-failure classification](${CLAUDE_PLUGIN_ROOT}/agents/war-refiner.md#gate-failure-classification)) — this covers all runners, including bash suites added by intra-phase merges. **Narrow baseline carve-out:** you may PROCEED past a red gate ONLY on a **baseline-proceed** re-merge/re-land the Workflow explicitly dispatches, ONLY over the **same** classified pre-existing `baseline` failures it names, and ONLY with the debt recorded (a `source:'auto'` backstop) — a NEW failure outside that named set is a real regression, so return `gate_failed`; an `introduced` red never merges. Never skip the gate; never delete or weaken tests to make it pass.

## Evicted: § merge-task step 6 — the evicted floor-order block

Evicted verbatim from `agents/war-refiner.md` merge-task step 6 (ADR 0042; the card keeps a trigger pointer):

> **Order-independent:** this submodule-mutation check, the step-4 test-floor check, the step-5 packaging-floor check, and the step-7 Budget-Raise check are all four fail-closed pre-merge gates on the same diff; running them in any order yields the same merge/refuse outcome (any failing exit blocks the final merge, step 9). The pinned placement — the two `assert-*-in-diff.sh` coverage floors (steps 4 and 5) adjacent, submodule-mutation next — is for readable grouping, not semantics. (The step-8 done-when floor is NOT a diff gate — it executes the task's acceptance command — but it is equally fail-closed pre-merge.)
