# Provisioning Lifecycle Implementation Plan (F08 · F09 · F10 + #69/#71 residuals)

**Goal:** harden WAR's worktree provisioning lifecycle — remove misleading dead code, make teardown/resume
ownership-safe, and stop the template emitting an ambiguous integration-tip placeholder. Self-contained: mostly
`provision-worktrees.sh` (shell) + a small `workflow-template.js` change; independent of the audit core.

**Scope (v0.6.3 — hygiene/correctness):**

> **Baseline-drift note (2026-06-25 red-team):** drafted at v0.5.1; this plan STACKS on plans 1+2 (v0.6.1, v0.6.2),
> so the release is **v0.6.3** (not the drafted v0.5.4). `provision-worktrees.sh` is untouched by plans 1/2 (its
> anchors hold), but `workflow-template.js` DRIFTED: `<integration-tip>` is at **line 211** (not 195) AND there is a
> **SECOND** occurrence at **line 307** (the refine-loop rebase instruction) — both must be resolved (see Task 4).
> `branch_ahead_of` is at ~103-107 (not 97-107). Extract by construct, not line.
- **F08** — delete the dead `branch_ahead_of` helper + correct the heal comment.
- **F09** — teardown & resume verify the `--owned-file` ledger (ownership checked at create only today).
- **F10** — resolve the `<integration-tip>` placeholder before emitting it.
- **#69 residuals** (folded per the issue): teardown **merged-guard**; three cosmetic nits.
- **#71 residual** (folded per the issue): **throw** on an undefined `branch`/`worktree` derivation.

**Issue provenance:** [#69](https://github.com/Ljferrer/WorkAuditRefine/issues/69) (Phase-2 provision hardening) and
[#71](https://github.com/Ljferrer/WorkAuditRefine/issues/71) (Phase-3 template hardening) re-scope their residuals
into this plan; [#85](https://github.com/Ljferrer/WorkAuditRefine/issues/85) confirms the disposition (and is itself
out of scope — red-team skill). Close #69 and #71 when this plan lands.

**Key finding that shapes scope:** teardown is **not wired into the orchestrator yet** — `workflow-template.js:87-88`
leaves the teardown call as "the future seam." So **F09 + the merged-guard are pure script-level hardening** in
`provision-worktrees.sh` (tested via `provision-worktrees.test.sh`), with **no refiner/template contract to change**.
Because there are no teardown callers, teardown can be **fail-closed** (require `--owned-file`) cleanly.

**Architecture:** `provision-worktrees.sh` is a standalone POSIX-sh script with an existing `.test.sh` suite (its
own runner — exactly the class F12 exists to keep covered); `workflow-template.js` is the no-shell Workflow template
with the `.test.mjs` harness. Two file clusters ⇒ two phases, each serialized within itself.

**Tech stack:** POSIX `sh` + the existing `provision-worktrees.test.sh` harness; ESM + `workflow-template.test.mjs`.

**Gate (for `/war`):** the full multi-runner command (F12 lesson). Quote the node glob (unquoted under-covers on
bash 3.2) and **self-discover** the bash suites — the repo now has **FOUR** `*.test.sh` (incl. `refinery-surface`,
added since this plan was drafted; F12's resolveGate landed in plan 2 and dogfoods exactly this):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [F08](../specs/2026-06-25-F08-dead-branch-ahead-of-design.md),
[F09](../specs/2026-06-25-F09-ledger-teardown-resume-design.md),
[F10](../specs/2026-06-25-F10-integration-tip-placeholder-design.md); roadmap
[here](2026-06-25-audit-remediation-roadmap.md). Memory: `provision-conservative-heal-not-gated-on-ahead-check`,
`provision-ownership-ledger-gates-create-not-teardown`, `template-defers-runtime-values-to-agent-via-literal-placeholder`,
`task-branch-worktree-derivation-silent-undefined-fallback`.

**Design resolutions (grill-with-docs, 2026-06-25 — no blocking decisions surfaced):**
- **F10 → D2 (refiner-captured tip), not D1 (Lead-resolved SHA).** Step 3 captures `TIP="$(git rev-parse
  <integrationBranch>)"` once (all phase worktrees are cut off that single barrier tip); per-task `ensure-worktree`
  lines reference `"$TIP"`. D1 is unworkable — the integration branch is cut/reused in step 2 *inside* the Workflow,
  so the tip isn't known at Lead dispatch.
- **#69 merged-guard → `git branch -d` (safe), `-D` only behind an explicit `--force`/`--keep`.** Never loses
  un-merged work; worst case leaves a merged ref (cosmetic). `-d`'s merged-into-HEAD dependency is accepted as a
  safe-fail (see open decisions).
- **F09 teardown → fail-closed.** `teardown-task`/`teardown-phase` require `--owned-file` and refuse a non-owned or
  ledger-less ref (exit 3). Safe to require since teardown has no callers yet.

## Build order (for `/war`)

- **Phase 1 — `provision-worktrees.sh` hardening:** T1 (F08 delete) → T2 (F09 ownership) → T3 (#69 merged-guard +
  nits). Serial: same file.
- **Phase 2 — `workflow-template.js` hardening:** T4 (F10 tip) → T5 (#71 throw). Serial: same file.
- **Phase 3 — Release:** T6 — v0.6.3.

---

## Phase 1 — provision-worktrees.sh hardening

### Task 1: F08 — delete the dead `branch_ahead_of` helper

**Files:** Modify `skills/war/assets/provision-worktrees.sh`; Test `skills/war/assets/provision-worktrees.test.sh`;
fix the heal comment in `docs/specs/2026-06-25-worktree-provisioning-design.md` (D7) if it implies an ahead-check.

- [ ] **Step 1: Write/adjust test** — add a structural assertion that `grep -n branch_ahead_of` over `skills/`
  returns nothing (clean-surface style); confirm no existing test references it.
- [ ] **Step 2: Run gate → fail** (helper still present).
- [ ] **Step 3: Implement** — delete `branch_ahead_of()` (`provision-worktrees.sh:103-107`, comment ~99-102); reword nearby
  conservative-heal comments to state the real guard: *never destroy a worktree whose branch carries un-merged
  commits; prune+recreate only empty/unregistered no-commit dirs; an unregistered non-empty dir → fail loud (D7)*.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "refactor(war): remove dead branch_ahead_of helper, correct heal comment (F08)"`

### Task 2: F09 — teardown & resume verify the ownership ledger

**Files:** Modify `skills/war/assets/provision-worktrees.sh` (`cmd_teardown_task`, `cmd_teardown_phase`); Test
`skills/war/assets/provision-worktrees.test.sh`.

- [ ] **Step 1: Write failing tests**
  - **Teardown refuses a foreign ref:** `teardown-task --run-dir D --owned-file L <path> <branch>` where `branch` is
    **not** in ledger `L` → exit 3, **no deletion** (worktree + branch still present).
  - **Teardown of a foreign integration ref:** `teardown-phase --run-dir D --owned-file L <slug> <N>` where
    `integration/<slug>/phase-<N>` is not owned → exit 3, ref preserved.
  - **Owned teardown still works:** owned branch → worktree removed + branch deleted.
  - **Ledger-less teardown fails loud:** `--owned-file` absent (or empty) while a namespace ref exists → exit 3 with
    a recovery hint (record-as-owned or delete).
  - **Resume (create-side) coverage:** `ensure-integration` on a ledger-less existing namespace branch already dies
    foreign — add/confirm a test pinning the recovery-hint message (F09 D2).
- [ ] **Step 2: Run gate → fail.**
- [ ] **Step 3: Implement** — add `--owned-file PATH` to `teardown-task`/`teardown-phase`; `load_owned_file` + a
  `owned_has` gate **before** `remove_worktree`/`delete_branch` (task: gate on `<branch>`; phase: gate on
  `integration/<slug>/phase-<N>`); fail-closed (absent/empty ledger → exit 3 with hint). Reuse the create-side
  helpers (`load_owned_file`, `owned_has`, `record_owned_file`).
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): teardown/resume verify the --owned-file ledger, fail-closed on foreign refs (F09)"`

### Task 3: #69 — teardown merged-guard + cosmetic nits

**Files:** Modify `skills/war/assets/provision-worktrees.sh` (`delete_branch`, `cmd_ensure_exclude`,
`cmd_ensure_integration` branch-create, `cmd_ensure_worktree`); Test `skills/war/assets/provision-worktrees.test.sh`.

- [ ] **Step 1: Write failing tests**
  - **Merged-guard:** teardown of an **un-merged** branch without `--force` → branch **preserved** + warn; with
    `--force` (or `--keep`-style force) → deleted. A merged branch → deleted normally.
  - **ensure-exclude strict args:** an unexpected positional/flag → `die` (mirrors `ensure-integration`'s rejection),
    not silent ignore.
  - **git-branch stderr surfaced:** a failing `git branch` create reports git's stderr, not just a generic message.
  - **Empty-dir recreate:** the missing `ensure-worktree` acceptance test — an **empty** unregistered dir at `<path>`
    is consumed and the worktree created (the `dir_is_empty` → `rmdir` branch).
- [ ] **Step 2: Run gate → fail.**
- [ ] **Step 3: Implement**
  - `delete_branch`: try `git branch -d` (safe); on "not fully merged" failure, escalate to `git branch -D` **only**
    when a `force` flag (threaded from `teardown-* --force`) is set; else `warn` and leave it. **Wiring:** add a
    `--force` flag to `cmd_teardown_task`/`cmd_teardown_phase` arg-parsing (today they parse only `--keep`) and thread
    it into `delete_branch` — without this, the `force` path is unreachable.
  - `cmd_ensure_exclude`: reject unknown args with `die` (consistent with `ensure-integration`).
  - `cmd_ensure_integration` branch create (`:193`): capture git stderr and include it in the `die` message.
  - Add the empty-dir-recreate acceptance test (no source change beyond the above).
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): teardown merged-guard (-d/+force) + strict ensure-exclude/stderr/empty-dir-test (#69)"`

---

## Phase 2 — workflow-template.js hardening

### Task 4: F10 — resolve the integration tip before emitting it

**Files:** Modify `skills/war/assets/workflow-template.js` (Provision prompt, step 3 + per-task `ensure-worktree`
lines); Test `skills/war/assets/workflow-template.test.mjs`.

> **Two occurrences (red-team).** `workflow-template.js` has TWO bare `<integration-tip>` placeholders, not one:
> **(1)** line ~211 in the Provision prompt's per-task `ensure-worktree` line, and **(2)** line ~307 in the
> **refine-loop rebase** instruction (`git -C ${r.task.worktree} rebase <integration-tip>`). A Provision-prompt-only
> fix + test would leave (2) and give a FALSE sense of security. F10 must resolve **both** and the guard must be
> **global** (the whole emitted template), not Provision-prompt-scoped. (The F10 spec's own `:195/:202` cites are
> stale → back-port `:211`.)
- [ ] **Step 1: Write failing tests**
  - **Global guard:** the **entire emitted template text** contains **no bare `<integration-tip>`** (nor any bare
    `<...>` token adjacent to a resolved absolute path) — a regex guard over the full emitted prompt(s), covering
    BOTH the Provision prompt and the refine-loop rebase instruction.
  - Step 3 sets a captured tip variable (`git rev-parse <integrationBranch>` → `TIP`), and each per-task
    `ensure-worktree` line references `"$TIP"` (assert the emitted text).
  - The refine-loop rebase instruction references a concrete ref (`${ph.integrationBranch}`), not a bare placeholder.
- [ ] **Step 2: Run gate → fail** (`<integration-tip>` literals at `:211` Provision AND `:307` refine-rebase).
- [ ] **Step 3: Implement** — (a) in the provision prompt, step 3 emits `TIP="$(git rev-parse ${ph.integrationBranch})"`;
  change the per-task line (`:211`) from `… ${t.branch} <integration-tip>` to `… ${t.branch} "$TIP"` (keep the
  "the integration tip captured in step 3" framing). (b) In the refine-loop rebase instruction (`:307`), replace the
  bare `rebase <integration-tip>` with `rebase ${ph.integrationBranch}` (a concrete ref the refiner resolves) — the
  rebase happens outside the Provision barrier so there is no captured `$TIP` in scope there.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): resolve integration tip into a captured var, drop bare placeholder + guard test (F10)"`

### Task 5: #71 — throw on an undefined branch/worktree derivation

**Files:** Modify `skills/war/assets/workflow-template.js` (`taskBranch`/`taskWorktree`, `:89-91`); Test
`skills/war/assets/workflow-template.test.mjs`.

- [ ] **Step 1: Write a failing test** — a task with neither explicit `branch`/`worktree` nor the derivation args
  (`planSlug`/`worktreeRoot`/`runId`) makes the template **throw** (a clear message naming the task), instead of
  interpolating the literal `"undefined"` into prompts.
- [ ] **Step 2: Run gate → fail** (today it silently yields `undefined`).
- [ ] **Step 3: Implement** — after the `t.branch = taskBranch(t); t.worktree = taskWorktree(t)` loop (`:91`),
  assert each resolved `t.branch`/`t.worktree` is a non-empty string; throw `Error(`task ${t.id}: cannot derive
  branch/worktree — supply planSlug+runId+worktreeRoot or explicit branch/worktree`)` otherwise.
- [ ] **Step 4: Run gate → pass.**
- [ ] **Step 5: Commit** — `git commit -am "fix(war): throw on undefined task branch/worktree derivation (#71)"`

---

## Phase 3 — Release & verify

### Task 6: Version bump v0.6.3 + full multi-runner gate green

**Files:** the README-documented bump list.

- [ ] **Step 1:** Bump to **v0.6.3** (patch over the stacked v0.6.2) across the COMPLETE bump list:
  `.claude-plugin/plugin.json` `version`, `.claude-plugin/marketplace.json` `metadata.version` AND `plugins[0].version`
  (do NOT omit — stale = silent-no-op release), README badge/`## Status` (REPLACE-in-place single-release slot —
  overwrite the prior paragraph; a "Builds on v0.6.2" lineage phrase is fine). NB: the README has no version *badge*;
  bump only the slots that exist.
- [ ] **Step 2:** Run the **full** gate (all runners, quoted + self-discovered — all FOUR `*.test.sh`) → green.
- [ ] **Step 3: Commit** — `git commit -am "chore(release): v0.6.3 — provisioning lifecycle (dead-code, teardown ownership+merged-guard, tip resolution)"`
- [ ] **Step 4:** Close issues #69 and #71 (residuals landed) with a pointer to this plan's commits.

---

## Notes / conscious deviations (ratify in `/red-team`)

- **F10 supersedes the spec's open-decision #1 toward D2** (refiner-captured), with a concrete rationale (tip not
  known at dispatch). Back-port into the F10 spec.
- **Teardown is an unwired future seam** (`workflow-template.js:87-88`): F09 + the merged-guard harden the *script*;
  when teardown is later wired into the refiner, it must pass `--owned-file` + `--run-dir` (and `--force` only on the
  keep/escalation path). Flag for the future teardown-wiring plan.
- **#69 disposition honored:** F08+F09 from the specs, merged-guard + nits as residuals; **#71** residual = the throw.
  Close both issues on land.
- **All changes are guarded by `provision-worktrees.test.sh` / `workflow-template.test.mjs`** — the same suites F12
  ensures the gate runs.

## Open decisions — RESOLVED by `/red-team` (2026-06-25, `--afk` autonomous adjudication)

1. **Merged-guard correctness vs HEAD → accept the safe-fail.** `git branch -d` checks merged-into-HEAD; at teardown
   the refiner's HEAD may not be the integration target, so a legitimately-merged branch could be *refused* (left as
   cruft, never data loss). Accept the safe-fail for v0.6.3; revisit the `git merge-base --is-ancestor` refinement
   when teardown is actually wired into the refiner and the integration target is in hand.
2. **Resume auto-adopt (F09 open #1) → keep fail-closed** (explicit record/delete; already the behavior). No
   auto-adopt of namespace refs into the ledger.
3. **Release granularity → v0.6.3, standalone** (patch over the stacked v0.6.2; not batched).
