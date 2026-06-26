# Concurrent-Run Land Isolation — Implementation Plan

Converts [`docs/specs/2026-06-25-concurrent-run-land-isolation-design.md`](../specs/2026-06-25-concurrent-run-land-isolation-design.md)
into a TDD, tiny-commit build. **Read the spec first** — this plan executes its resolved design tree
(§4) and validation criteria (§11); it does not re-open them.

> **Module under change:** the **Refinery** (`war-refiner` + the serial merge queue). Today the
> Refinery mutates the Lead's **main checkout** (one working tree, one HEAD per repo) for *both*
> merge-task and land-phase, so two runs in one repo overwrite each other. This plan moves every
> Refinery merge into a run-scoped **refinery worktree** (`<worktreeRoot>/<runId>/_refinery`) — the
> Refinery's *container* — so the "single git-topology owner" invariant holds **per repo**, not just
> per run. The deep seam: the **push is the cross-run CAS**; the local ref only follows.

**Empirical basis (do not re-litigate without re-running the sandbox):** the spec's §12 verification
proved, with real git in a throwaway repo: a second checkout of a checked-out branch is refused; a
detached worktree can `merge --no-ff` then CAS-`update-ref`; a no-force push is rejected non-ff when
origin moved (and a local `update-ref`-first ordering **diverges** local/origin); `git rebase` of a
branch checked out in another worktree fails (and `rebase --onto` does **not** dodge it). Every task
below encodes one of those proven facts as a test.

**Gate (this repo has no `package.json`):**
```
bash hooks/clean-surface-war-worktree.test.sh
bash hooks/validate-worktree-scope.test.sh
bash skills/war/assets/provision-worktrees.test.sh
node --test skills/war/assets/land-decision.test.mjs skills/war/assets/workflow-template.test.mjs skills/war/assets/war-config.test.mjs
node -e "<workflow-template.js compile-check>"   # the existing template parse guard
```

## Build order (for `/war`)

- **Phase 1 — Refinery-worktree shell primitives (testable core):** Task 1 → 2 → 3. Independent of
  the rest; the `/red-team`-provable heart. Each appends to `provision-worktrees.test.sh`.
- **Phase 2 — `land_stale` status surface:** Task 4 (independent; `land-decision.mjs` + `schemas.md`).
- **Phase 3 — Workflow + agent wiring:** Task 5 → 6 (depends on Phases 1 & 2).
- **Phase 4 — Docs, domain term & clean-surface guard:** Task 7 → 8 (depends on Phases 1–3).
- **Phase 5 — Verify:** Task 9 (full green + concurrency simulation + clean-surface grep).
- **Phase 6 — Release 0.6.0:** Task 10 (depends on all; mirrored version bump).

Branch model: per-phase `integration/<slug>/phase-N`; `--no-ff` land onto the working branch; one PR
working → landing at the end.

---

## Phase 1 — Refinery-worktree shell primitives

> Harness: `provision-worktrees.test.sh` already spins a fresh repo per case. Phase-1 cases also need
> a **bare `origin` + a second clone** to simulate the cross-run race deterministically (the spec's
> §12 method) — add a small helper that creates `origin.git`, two working clones, and advances
> `origin/<working>` out-of-band.

### Task 1: `ensure-refinery-worktree` — create + **ensure-and-re-attach** on reuse

- File: `skills/war/assets/provision-worktrees.sh`
- Test (append): `skills/war/assets/provision-worktrees.test.sh`
- Spec: §5.1, §9 (resume re-attach)

`ensure-refinery-worktree <path> <integration-branch>`:
- Not registered, no/empty dir → `git worktree add <path> <integration-branch>`; drop a `.war-task`
  marker. (The integration branch is not checked out elsewhere; a normal checkout is valid.)
- Registered + present + HEAD **on the integration branch** → reuse untouched (marker only).
- Registered + present + HEAD **detached or on a different branch** (the crash-mid-land state) **and
  tree clean** → `git -C <path> switch <integration-branch>` (re-attach), then reuse. **Fail loud on
  a dirty tree** — never reset. This is **ensure + re-attach**, distinct from `ensure-worktree`'s
  pure no-op reuse.
- Stale registry (dir gone) → prune + recreate on the integration branch. Non-empty unregistered dir
  → fail loud (D7 discipline).

Steps:
- [ ] **Step 1 — write tests (fail):** fresh-create; reuse-on-integration is a no-op; **reuse when
  detached re-attaches to integration**; reuse when detached **and dirty fails loud**; stale-registry
  recreate. Run `bash skills/war/assets/provision-worktrees.test.sh` → subcommand absent.
- [ ] **Step 2 — implement** `cmd_ensure_refinery_worktree` + dispatch entry.
- [ ] **Step 3 — run → pass.**
- [ ] **Commit:** `feat(provision): ensure-refinery-worktree with ensure-and-re-attach reuse`

### Task 2: `land-advance` — **push-first** cross-run CAS

- File: `skills/war/assets/provision-worktrees.sh`
- Test (append): `skills/war/assets/provision-worktrees.test.sh`
- Spec: §3b, §5.3, decision 2/4

`land-advance <working-ref> <new-sha>` (the caller has already produced `<new-sha>` = the `--no-ff`
merge of integration into a detached worktree at `origin/<working>`):
1. `git push origin <new-sha>:refs/heads/<working>` — **no `--force`**. The non-ff rejection IS the
   atomic compare-and-swap against shared truth.
2. **Classify** the push result: success → continue; output contains `non-fast-forward`/`[rejected]`
   → exit with a distinct **reland** code (the loser re-merges onto the new `origin/<working>`); any
   other failure → exit with a distinct **escalate** code (never infer success from absence of
   `[rejected]`).
3. **Only on push success**, advance the local follower:
   `git update-ref refs/heads/<working> <new-sha> <pre-push-local-tip>`.

So a rejected push leaves the **local** `refs/heads/<working>` **unchanged** — nothing to rewind.

Steps:
- [ ] **Step 1 — write tests (fail), using the bare-origin + second-clone helper:**
  (a) origin advanced out-of-band → `land-advance` push **rejected**, exit = reland code, **and the
  local working ref is byte-identical to before**;
  (b) origin at the expected tip → push **accepted**, local follower advanced to `<new-sha>`;
  (c) a non-ff-unrelated push error maps to the **escalate** code, not reland.
  Run → subcommand absent.
- [ ] **Step 2 — implement** `cmd_land_advance` (push, classify output, conditional follower
  `update-ref`) + dispatch.
- [ ] **Step 3 — run → pass.**
- [ ] **Commit:** `feat(provision): land-advance push-first CAS (local ref follows only on push success)`

### Task 3: `teardown-phase` reaps `_refinery` **by path** + verifies the integration delete

- File: `skills/war/assets/provision-worktrees.sh`
- Test (append): `skills/war/assets/provision-worktrees.test.sh`
- Spec: §5.5, §9 (root reconciliation)

The existing `teardown-phase` `awk` filter matches only `refs/heads/war/<slug>/p<N>-*`; it **cannot
see** `_refinery` (on `integration/<slug>/phase-N`, or **detached** after the land → no `branch`
porcelain line). Add, **before** the integration `delete_branch`:
- Reap `<worktreeRoot>/<runId>/_refinery` **by path**, run-scoped via its **own** `path_under` check.
  **Root note (§9):** `_refinery` lives under `worktreeRoot`, which is `.claude/worktrees` — a
  *sibling* of `--run-dir` (`.claude/teams/<runId>`), so the reap is scoped to
  `<worktreeRoot>/<runId>`, **not** blindly to `--run-dir`. Take the worktree-root as an explicit
  argument (e.g. `teardown-phase --run-dir <ledger-dir> --worktree-root <worktreeRoot> <slug> <N>`).
- Works whether `_refinery` is on-integration or detached (path-based, not branch-keyed).
- Then `delete_branch integration/<slug>/phase-N` and **verify it actually succeeded** — propagate a
  real non-zero exit instead of the current `|| warn` swallow (which even returns 0 today).
- `--keep` (held/escalated phase) preserves `_refinery` for inspection.

Steps:
- [ ] **Step 1 — write tests (fail):** teardown reaps an **on-integration** `_refinery`; teardown
  reaps a **detached** `_refinery`; integration delete **fails loud** if `_refinery` was not reaped
  first; an **out-of-run** `_refinery` path is refused; `--keep` preserves it.
- [ ] **Step 2 — implement:** path-based reap + `--worktree-root` arg + verified `delete_branch`.
- [ ] **Step 3 — run → pass.**
- [ ] **Commit:** `fix(provision): teardown-phase reaps _refinery by path; integration delete fails loud`

---

## Phase 2 — `land_stale` status surface

### Task 4: Add `land_stale` (CAS-exhaustion ≠ content `conflict`)

- Files: `skills/war/assets/land-decision.mjs`, `skills/war/references/schemas.md`
- Test: `skills/war/assets/land-decision.test.mjs` (append)
- Spec: §5.3, §7, §9

A same-branch land that exhausts `roundLimit` relands is a **topology** failure, not a merge-text
`conflict`. Introduce `land_stale`:
- `land-decision.mjs:6` → `HARD_ESCALATION_REASONS = ['escalate','audit-blocked','conflict','land_stale']`.
- `schemas.md` `MergeResult.status` enum gains `land_stale`; document it (land-advance exhausted the
  bounded reland; held for the Lead, distinct from a content conflict).

Steps:
- [ ] **Step 1 — write test (fail):** `decideLand({ escalated:[{reason:'land_stale'}] })` → `held:escalation`.
- [ ] **Step 2 — implement** the one-token addition + schemas.md doc.
- [ ] **Step 3 — run → pass** (`node --test skills/war/assets/land-decision.test.mjs`).
- [ ] **Commit:** `feat(land): land_stale hard-escalation status for CAS-exhausted same-branch lands`

---

## Phase 3 — Workflow + agent wiring

### Task 5: Wire `_refinery` into the Workflow (barrier, merge-task, land, resync)

- File: `skills/war/assets/workflow-template.js`
- Test: `skills/war/assets/workflow-template.test.mjs` (append) + the compile-check
- Spec: §5.1–§5.4

Changes (the Workflow sandbox can't import — mirror primitives inline, keep in sync, same pattern as
`ROLE_MODEL`/`decideLand`):
- **Provision barrier (~L197–204):** after `ensure-integration`, also instruct
  `ensure-refinery-worktree <worktreeRoot>/<runId>/_refinery <integrationBranch>`.
- **merge-task prompt (~L271–273):** the refiner **rebases in the task worktree**
  (`git -C ${task.worktree} rebase <integration-tip>`), runs the gate, then **merges in `_refinery`**
  (`git merge ${task.branch}` into the integration branch) and pushes. State plainly that `git rebase`
  cannot run in `_refinery` (task branch checked out in `${task.worktree}`) and `rebase --onto` does
  not dodge it.
- **land prompt (~L298–300):** detached land in `_refinery` at `origin/${ph.workingBranch}`, merge
  `--no-ff`, gate, then `land-advance ${ph.workingBranch} <merge-sha>`; on reland code re-fetch /
  re-merge / re-gate ≤ `roundLimit`; on exhaustion return `status:"land_stale"`. Add `land_stale` to
  the inline `MERGE_RESULT` status enum (mirror of Task 4) and the inline land-decision mirror.
- **Opportunistic resync:** after a `landed` result, the Lead runs the §5.4 ff-only/clean-guard
  resync against its cwd (advance iff ff descendant + on-branch + clean; else skip; never force/block).

Steps:
- [ ] **Step 1 — write tests (fail):** prompt-content assertions (merge-task mentions
  `git -C <taskWorktree> rebase` and merges in `_refinery`; land mentions detached
  `origin/<working>` + `land-advance` + reland≤roundLimit→`land_stale`; barrier mentions
  `ensure-refinery-worktree`); `MERGE_RESULT` enum includes `land_stale`; compile-check passes.
- [ ] **Step 2 — implement** the barrier/merge/land/resync wiring.
- [ ] **Step 3 — run → pass.**
- [ ] **Commit:** `feat(workflow): route refiner merges through _refinery; push-first land + resync`

### Task 6: Rewrite `war-refiner.md` for the refinery worktree

- File: `agents/war-refiner.md`
- Spec: §2, §5.2–§5.4, §6 (enforcement caveat)

- Inputs gain the **refinery worktree path** and the **task worktree path**.
- **merge-task:** rebase in the task worktree → gate → merge into integration **in `_refinery`** →
  push. Never rebase in `_refinery`.
- **land-phase:** detached in `_refinery` at `origin/<working>` → `--no-ff` merge → gate →
  **push-first** `land-advance` → bounded reland → `land_stale` on exhaustion. Never `--force`.
- **Never** run `git checkout`/`merge`/`update-ref`/`push` against the Lead's main checkout.
- One line of honesty: this confinement is **prompt-enforced**, not hook-enforced (the scope hook
  fail-opens for `war-refiner`); the clean-surface gate is the backstop.

Steps:
- [ ] **Step 1 — rewrite** the agent doc per §5.2–§5.4.
- [ ] **Step 2 — run the gate** (no agent-md test; covered by Task 8's clean-surface grep + Task 5
  prompt asserts).
- [ ] **Commit:** `docs(refiner): merge/land in the refinery worktree; push-first; never the main checkout`

---

## Phase 4 — Docs, domain term & clean-surface guard

### Task 7: Domain term + ADR + design.md amendment

- Files: `CONTEXT.md`, `docs/adr/0004-refinery-merges-in-a-worktree.md` (new), `skills/war/references/design.md`
- Use the `/domain-modeling` discipline for the term.

- `CONTEXT.md`: add **Refinery worktree** (spec §8 wording) — the Refinery's *container*; on
  integration for merge-task's merge step, detached for the land; isolation prompt-enforced.
- New **ADR 0004** "Refinery merges run in a run-scoped worktree, never the main checkout": records
  the concurrent-run motivation, the **push-first CAS** choice, the detached-land constraint, and the
  prompt-vs-hook enforcement caveat. Reference ADR-0001/0003.
- `design.md`: a `v0.6.0 amendments` section — the Refinery now operates in `_refinery`; land is
  push-first; `land_stale` joins the hard-escalation set; §12's "multiple concurrent runs in one
  repo" is now partially in-scope (the Refinery write surface) while multi-repo / concurrent-phases
  stay deferred.

Steps:
- [ ] **Step 1 — write** the term, ADR, and amendment.
- [ ] **Commit:** `docs(adr): 0004 refinery merges in a run-scoped worktree; CONTEXT term + design v0.6.0`

### Task 8: Clean-surface guard — the Refinery never targets the main checkout

- Files: `hooks/clean-surface-war-worktree.test.sh` (extend) **or** a new
  `skills/war/assets/refinery-surface.test.sh`
- Spec: §6, §11 (criterion 3)

A grep-able gate (mirroring the WAR_WORKTREE-retirement clean-surface test) asserting the refiner
agent + the land/merge prompts route merges through `_refinery`/`${task.worktree}` and contain **no**
instruction to `checkout`/`merge`/`push` the working branch in the main checkout. The test-file
exclusion is load-bearing (the test names the forbidden tokens; exclude `*.test.*` from the scan).

Steps:
- [ ] **Step 1 — write test (fail):** scan asserts the forbidden main-checkout-merge pattern is
  absent and the `_refinery`/`<taskWorktree>` routing is present.
- [ ] **Step 2 — make it pass** (Tasks 5–6 already satisfy it; this pins it against regression).
- [ ] **Commit:** `test(refiner): clean-surface gate — refinery never merges in the main checkout`

---

## Phase 5 — Verify

### Task 9: Full green + concurrency simulation

- [ ] Run the whole gate (all `*.test.sh` + the `*.test.mjs` + the compile-check) → green.
- [ ] Confirm the deterministic concurrency simulation passes: two clones + bare origin, two
  `land-advance` attempts on the **same** working branch → exactly one pushes, the loser is rejected
  with its **local ref unchanged** and relands; two attempts on **different** working branches both
  succeed with zero cross-bleed.
- [ ] Confirm the clean-surface grep gate (Task 8) is green.
- [ ] **Commit (if any test fixups):** `test: full gate green for concurrent-run land isolation`

---

## Phase 6 — Release 0.6.0

### Task 10: Mirrored version bump (release-drift discipline)

A release **must** update all three versions-of-truth together (a stale `marketplace.json` makes the
update a silent no-op):

- `.claude-plugin/plugin.json:4` `"version"`: `0.5.1` → `0.6.0`
- `.claude-plugin/marketplace.json:7` `metadata.version` **and** `:14` `plugins[0].version`: `0.5.1` → `0.6.0`
- `README.md` `## Status` (L159–161): replace the 0.5.1 paragraph with a **0.6.0** paragraph —
  "concurrent-run land isolation: the Refinery performs every merge in a run-scoped worktree
  (`_refinery`), never the Lead's main checkout, so two WAR runs in one repo on different branches
  cannot overwrite each other; same-branch lands serialize via a push-first CAS + bounded reland
  (`land_stale` on exhaustion)."

Steps:
- [ ] **Step 1 — bump** all three files together.
- [ ] **Step 2 — full gate green** (re-run Task 9's gate).
- [ ] **Commit:** `chore(release): work-audit-refine 0.6.0 — concurrent-run land isolation`

---

## Notes / conscious deviations (ratify in this plan's `/red-team`)

1. **Prompt-enforced, not hook-enforced isolation.** The Refinery's "never the main checkout"
   invariant rests on the agent prompt + the Task-8 clean-surface gate; the scope hook fail-opens for
   `war-refiner`. Hook-level confinement is an out-of-scope stronger guarantee (spec §10).
2. **`worktreeRoot` ≠ `runDir`.** Teardown of `_refinery` is scoped to `worktreeRoot/<runId>` via an
   explicit `--worktree-root` arg, **not** the `--run-dir` ledger path (a sibling). Pre-existing root
   split surfaced by the spec's §12; ratify the chosen reconciliation.
3. **merge-task is inherently split across two worktrees** (rebase in the task worktree; merge in
   `_refinery`). `git rebase --onto` does not avoid the checked-out-branch rule; a no-checkout
   `update-ref` replay is forbidden (it desyncs the task worktree).
4. **`land_stale` is a new `MergeResult.status`** (mirrored in `land-decision.mjs` + inline in
   `workflow-template.js` + `schemas.md`) — keep the three in sync (same footgun family as
   `ROLE_MODEL`/`decideLand`).
5. **Opportunistic resync may leave the Lead's cwd on a non-latest tip** when multiple runs share one
   cwd (ff-only fails closed). Safe; the human reconciles. Truth is the working ref + origin.
6. **No live two-Lead E2E.** Concurrency is proven by a deterministic same-`.git` simulation (two
   clones + bare origin), not a real two-Workflow run — the same method the spec's §12 used.
