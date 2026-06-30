# Land-advance gates `landed` on origin readback, not a process exit code — Implementation Plan (#251)

**Goal:** `cmd_land_advance` currently advances the **local** follower ref to the agent-supplied merge-sha whenever
the push process exits 0 — even when origin never moved. From a wrong cwd (the Lead's main checkout, any sibling
worktree on the same origin) the push is a no-op against the working branch's **old** tip that origin already holds:
it exits 0, emits no `[rejected]`, and step 3 silently advances **local** past origin while reporting `landed` with no
escalation. This plan closes the hole at the shared function — a **post-push origin readback** that makes the local
advance contingent on `git ls-remote origin == new_sha` (exit 3 on mismatch) — and pins step 3 of the land prompt to
the `_refinery` worktree as belt-and-suspenders, matching steps 1–2.

**Source spec:** [`docs/specs/2026-06-30-land-advance-origin-propagation-design.md`](../specs/2026-06-30-land-advance-origin-propagation-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source**.
Memory: `land-advance-push-first-cas-rejected-token`, `land-decision-not-demoted-on-land-step-failure`,
`land-local-follower-ref-can-lag-sync-before-next-phase`, `weak-test-assertion-passes-without-feature-being-exercised`.

**One guard, all callers.** Per ponytail: the readback lives **inside the shared `cmd_land_advance`**, not in the
prompt — every caller of `land-advance` routes through it, so the no-op-push hole is closed regardless of cwd. The
cwd-pin is the secondary safety net (Decision 2), not the primary fix.

## Coordination

- **Target version:** **v0.7.8** (per the roadmap's authoritative table — landOrder 1). Severity **HIGH** (the lone
  behavioral BUG in the audit batch).
- **landOrder:** **1** — the bottom of the stack; lands **first** so every later spec rebases onto the corrected land
  path.
- **Integration base:** the **current `master` tip** (live **v0.7.7**, `88c64cc` at plan time). This is landOrder 1 —
  there is no prior-tip pin to inherit; the base IS live master.
- **Four canonical version slots** (REPLACE-in-place, land **serially** in the release task): `.claude-plugin/plugin.json`
  `version`; `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status`
  line (both the leading `**0.7.8**` literal **and** the trailing `Builds on v0.7.7.` clause — currently reads
  `**0.7.7** … Builds on v0.7.6.`). No badge. No cross-slot consistency test exists — verify all four by hand (memory
  `version-slots-no-cross-slot-consistency-test`).
- **Standalone fallback:** this plan assumes the stacked roadmap. If run off **current master (v0.7.7)** as a one-off
  rather than as part of the stack, the base is already live master and the target is already the next free patch
  (v0.7.8) — nothing to re-baseline. If the stack order ever shifts and v0.7.8 is taken, re-baseline the release to the
  next free patch by construct and drop any prior-tip pin (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

**Task order (one task per disjoint edit site, strictly serial):** P1 = `provision-worktrees.sh` readback + header
comment + new `.test.sh` regression case (single commit, red-first via the new case). P2 = `workflow-template.js`
cwd-pin + new `.mjs` load-bearing assertion. P3 = release v0.7.8. P1 touches only `provision-worktrees.sh`/`.test.sh`;
P2 touches only `workflow-template.js`/`.test.mjs` — disjoint, no intra-plan rebase conflict.

---

## Phase 1 — Origin readback in `cmd_land_advance` (the shared guard) + regression test

### Task 1 — `cmd_land_advance` gates the local advance on `ls-remote origin == new_sha` (#251, readback)

**Files:**
- modify [`skills/war/assets/provision-worktrees.sh`](../../skills/war/assets/provision-worktrees.sh) — in
  `cmd_land_advance`, **inside** the `if [ "$push_rc" -eq 0 ]; then` branch (currently around the
  `# Success: advance the local follower ref…` comment), **after** the push succeeded and **before** the
  `if [ -n "$pre_push_local" ]; then … git update-ref …` block, insert the readback. Plus the header-comment edit (the
  `# 3. ONLY on push success (exit 0): advance the local follower ref:` block).
- modify [`skills/war/assets/provision-worktrees.test.sh`](../../skills/war/assets/provision-worktrees.test.sh) — new
  case **T2.5**, modeled on the existing T2.2 block (the `working/myplan2` ff-pushable case) but deliberately **NOT**
  using `run_in_detached()` (that helper does `git checkout --detach "$sha"` so `HEAD` always == `$new_sha`, which
  masks the bug — memory `weak-test-assertion-passes-without-feature-being-exercised`).

**`requiresTest`: true** — the new `.test.sh` case is the mapped behavioral test; it is written **red-first** and FAILS
against the pre-fix `cmd_land_advance` (which exits 0 and advances local), proving the readback assertion is
load-bearing.

- [ ] **Step 1 — Write the T2.5 regression case (failing first).** Append to
  `skills/war/assets/provision-worktrees.test.sh` after the T2.4 block. Seed via the existing helpers
  (`setup_origin_pair` + `seed_working_branch "$c1" "$c2" "working/myplan5"`) so **origin already holds the working
  branch at the SEED tip**. Produce a `NEW_SHA5` in clone1 (a separate commit, as T2.2 does). Then call the script
  **directly from a cwd whose `HEAD` is the OLD tip (the SEED, NOT `NEW_SHA5`)** — i.e. NOT through `run_in_detached`:
  ```sh
  # clone1 HEAD is the OLD working tip (SEED) here — a no-op push exits 0 against origin.
  code="$( ( cd "$C1_5" && bash "$SCRIPT" land-advance working/myplan5 "$NEW_SHA5" ); echo $? )"
  ```
  Record `LOCAL_BEFORE5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"` before the call. Assert **both**:
  - `expect "T2.5: no-op push from wrong cwd (HEAD≠new_sha, origin already at HEAD) → readback mismatch → exit 3" "3" "$code"`
  - `LOCAL_AFTER5="$(git -C "$C1_5" rev-parse refs/heads/working/myplan5)"; expect "T2.5: local working ref did NOT advance to new_sha (origin readback gated the advance)" "$LOCAL_BEFORE5" "$LOCAL_AFTER5"`

  (The seed leaves clone1's checkout on the SEED commit, so its ambient `HEAD` is the OLD tip — the push is a genuine
  no-op that exits 0 without `[rejected]`. Do **not** detach to `NEW_SHA5`; that is exactly the masked path.)
- [ ] **Step 2 — Run `bash skills/war/assets/provision-worktrees.test.sh` → RED.** Pre-fix the push exits 0, local
  advances to `NEW_SHA5`, the call returns 0: T2.5 fails on both the `3` exit assertion and the `unchanged-local`
  assertion. (If T2.5 passes here, it is vacuous — most likely `run_in_detached` crept in; fix the case before
  proceeding.)
- [ ] **Step 3 — Implement the readback (green).** Inside `if [ "$push_rc" -eq 0 ]; then`, **before** the
  `if [ -n "$pre_push_local" ]; then` update-ref block, insert:
  ```sh
  # Origin readback: the push exited 0, but a no-op push from the wrong cwd
  # (HEAD == origin's old tip) also exits 0 without moving origin. Advance the
  # local follower ONLY if origin actually holds <new-sha>; else escalate.
  actual="$(git ls-remote origin "refs/heads/$working" | cut -f1)"
  [ "$actual" = "$new_sha" ] || exit 3
  ```
  `git ls-remote origin` runs against the ambient repo (no `-C`) — correct, since every worktree on the same clone
  shares one origin URL; with the Phase-2 cwd-pin it runs in `_refinery`. Then update the header comment: change the
  `# 3. ONLY on push success (exit 0): advance the local follower ref:` line to
  `# 3. ONLY on push success AND ls-remote origin == new_sha: advance the local follower ref:` and add a line under it
  noting `#    On readback mismatch (origin not at <new-sha>) → exit 3 (escalate); local ref unchanged.` Keep the
  comment edit in the **same commit** as the code (memory `source-comment-lags-emitted-prompt-after-rewrite`).
- [ ] **Step 4 — Run the full gate → green.** T2.1/T2.2/T2.3/T2.4 still pass (T2.2's clean push has origin == new_sha,
  so the readback is a no-op there); T2.5 now passes.
- [ ] **Step 5 — Commit** — `fix(war): land-advance gates local advance on origin readback, not push exit code (#251)`
- **Closes:** Decision 1 (origin readback) + Decision 3 (regression test) — Validation #1 and #2. The cwd-pin
  (Decision 2) is Phase 2.

**Note on routing (do NOT "fix" this):** `exit 3` → the step-3 prompt maps to `status:'error'` →
`workflow-template.js`'s `else if (landResult && (landResult.status === 'error' || landResult.status === 'gate_failed'))`
branch → `landDecision = 'held:land-failed'`. This is a non-landed hold surfaced to the Lead — **correct**. Do **NOT**
add `'error'` to `HARD_ESCALATION_REASONS` (line 504; the array deliberately excludes it); doing so would mislabel
every land error as `held:escalation`. The spec's Open-risks sentence implying HARD_ESCALATION routing is a prose nit
— **corrected here**: exit 3 routes via the `error||gate_failed` branch to `held:land-failed`, not through
`HARD_ESCALATION_REASONS`. No enum is widened (memory `shared-status-enum-widening-silently-widens-land-path`).

---

## Phase 2 — Pin step 3 of the land prompt to `_refinery` + load-bearing assertion

### Task 2 — Pin the bare `land-advance` call to `_refinery` (#251, cwd pin)

**Files:**
- modify [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) — the `landDecision === 'landed'`
  land block. Anchor by the **named construct**: the step-3 line in the land prompt template string that reads
  `` `  3. Push-first CAS: run \`provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>\` where … ``
  (the **bare** call, not the `escalate exit code` documentation line below it which also contains `land-advance`).
- modify [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) — extend
  the existing `Task 5 — land prompt:` test (the one asserting `detached`, `_refinery`, `/land-advance/`, `reland`,
  `land_stale`). The existing `assert.match(p, /land-advance/)` stays green either way, so it does **not** prove the
  pin — a NEW assertion is required (memory `weak-test-assertion-passes-without-feature-being-exercised`).

**`requiresTest`: true** — the new `.mjs` assertion is the mapped test; written red-first, it FAILS on the pre-pin
template string (bare `land-advance` with no `cd`/`git -C`) and passes after the pin.

- [ ] **Step 1 — Add the load-bearing assertion (failing first).** In the `Task 5 — land prompt:` test, after the
  existing `/land-advance/` match, assert the step-3 call carries the cwd-pin **and** no bare call remains in the land
  block:
  ```js
  // Decision 2: step 3 runs land-advance inside _refinery (cwd-pin), matching steps 1-2.
  assert.match(p, /cd \$\{refineryLandPath\} && provision-worktrees\.sh land-advance|cd .*_refinery.* && provision-worktrees\.sh land-advance/,
    'land prompt step 3 pins land-advance to the _refinery worktree (cd ${refineryLandPath} && …)')
  // No BARE `provision-worktrees.sh land-advance` (not preceded by `cd …` / `git -C …`) remains in the land block.
  assert.ok(!/(?<!&& )(?<!git -C [^\n]{0,80})provision-worktrees\.sh land-advance \$\{ph\.workingBranch\}/.test(p),
    'no bare provision-worktrees.sh land-advance ${ph.workingBranch} remains (must be cwd-pinned)')
  ```
  (If the lookbehind regex is awkward under the Node version, the equivalent is: assert the substring
  `cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch}` is present AND the substring
  ``` `provision-worktrees.sh land-advance ${ph.workingBranch} ``` is preceded by `cd ` everywhere it appears as an
  invocation. The non-negotiable: the assertion must FAIL on the current bare string and PASS only after the `cd` prefix.)
- [ ] **Step 2 — Run `node --test 'skills/**/*.test.mjs'` → RED.** The current template emits the bare call, so the new
  assertion fails. (Quote the glob — bash 3.2 under-covers it unquoted.)
- [ ] **Step 3 — Add the cwd-pin (green).** In the step-3 line of the land prompt, change the bare
  ``` `provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>` ``` to
  ``` `cd ${refineryLandPath} && provision-worktrees.sh land-advance ${ph.workingBranch} <merge-sha>` ```. Use the
  **`cd &&` style** (the spec text says `cd`); steps 1–2 use `git -C ${refineryLandPath}` — note the deliberate style
  choice in the diff (the subcommand has no `-C` arg of its own, so `cd` is the natural pin for it). Do not touch the
  `escalate exit code` documentation line (it references `land-advance` as prose, not as a call).
- [ ] **Step 4 — Run the full gate → green.** The existing `/land-advance/` match at line 398 stays green; the new
  assertion now passes.
- [ ] **Step 5 — Commit** — `fix(war): pin land prompt step 3 to the _refinery worktree (#251)`
- **Closes:** Decision 2 (cwd pin) — Validation #3.

---

## Phase 3 — Release v0.7.8

### Task 3 — Version bump v0.7.8 + full gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and**
`plugins[0].version`); `README.md` `## Status` (REPLACE-in-place). No badge.

**`requiresTest`: false** — release metadata; the gate is the existing suite staying green.

- [ ] **Step 1 — Bump all four slots `0.7.7` → `0.7.8`.** `.claude-plugin/plugin.json` `version`;
  `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` — replace
  the leading `**0.7.7**` with `**0.7.8**`, rewrite the status sentence to describe this fix (land-advance gates the
  local advance on an origin `ls-remote` readback instead of the push exit code; step 3 of the land prompt pinned to
  `_refinery`), and update the trailing `Builds on v0.7.6.` clause to `Builds on v0.7.7.`. Verify all four slots **and**
  the Builds-on clause by hand — no cross-slot consistency test exists (memory
  `version-slots-no-cross-slot-consistency-test`, `release-status-is-replace-slot-not-empty-field`,
  `release-bump-slots-canonical-no-badge`).
- [ ] **Step 2 — Run the full gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.8 — land-advance origin readback + step-3 cwd pin (#251)`

---

## Gate

The self-discovering multi-runner — run **all** runners after each task (memory
`gate-under-covers-after-cross-branch-merge-new-runner`):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- **6** `*.test.mjs` (quote the glob — bash 3.2 under-covers unquoted): `skills/_shared/provision.test.mjs`,
  `skills/red-team/assets/red-team-gate.test.mjs`, `skills/red-team/assets/workflow-scaffold.test.mjs`,
  `skills/war/assets/land-decision.test.mjs`, `skills/war/assets/war-config.test.mjs`,
  `skills/war/assets/workflow-template.test.mjs`.
- **12** `*.test.sh` runners (6 `hooks/` + 6 `skills/`): `hooks/clean-surface-hook-only-confinement.test.sh`,
  `hooks/clean-surface-war-worktree.test.sh`, `hooks/validate-auditor-git.test.sh`,
  `hooks/validate-servitor-provenance.test.sh`, `hooks/validate-worktree-scope.test.sh`,
  `hooks/warn-bash-write-scope.test.sh`, `skills/red-team/manifest-provenance.test.sh`,
  `skills/war/assets/assert-test-in-diff.test.sh`, `skills/war/assets/provision-worktrees.test.sh`,
  `skills/war/assets/refinery-surface.test.sh`, `skills/war/assets/scout-manifest-surface.test.sh`,
  `skills/war/references/schemas-manifest.test.sh`.

**Stale-tip auditor note:** the new T2.5 `.test.sh` case and the new `.mjs` assertion only exist on the task commit.
An auditor on a pre-impl worktree tip will see them as "test unrun" / spurious land-halt — verify the real tip and
re-run the gate at the actual task commit before treating any "unrun" as blocking (memory
`audit-worktree-pre-impl-tip-stale-verdict`).

## Coverage

| Issue | Task | Decisions covered | Validation |
|-------|------|-------------------|------------|
| #251 | T1 (readback + regression test), T2 (cwd pin) | 1 (origin readback), 2 (cwd pin), 3 (regression test) | 1, 2, 3 |

## Deliberate simplifications

- **`ls-remote` has no `-C`** — runs against the ambient origin. Correct: every worktree on one clone shares a single
  origin URL, so the readback is right even pre-cwd-pin. This is why Decision 1 alone makes the **result** correct and
  the cwd-pin (Decision 2) is genuinely belt-and-suspenders (it keeps the happy path actually pushing the merge-sha
  rather than escalating spuriously). `// ponytail:` — one `ls-remote` round-trip per land is negligible vs. a phantom
  partial-land (memory `cost-not-a-concern-max-20x`).
- **No new exit code, no enum widening.** `exit 3` reuses the existing escalate code → `status:'error'` →
  `held:land-failed`. The spec's Open-risks "HARD_ESCALATION_REASONS path" wording is corrected to the actual
  `error||gate_failed` → `held:land-failed` route in T1's note.
- **Opportunistic resync (§5.4) untouched** — it is already ff-only/clean-guarded and reads origin as truth; this plan
  only fixes the step-3 advance that feeds it.
- **`run_in_detached` left in place** — it correctly models the detached refinery state for T2.1–T2.4; the bug lives
  precisely in the path it skips, which is why T2.5 must call the script directly from a non-detached cwd.
