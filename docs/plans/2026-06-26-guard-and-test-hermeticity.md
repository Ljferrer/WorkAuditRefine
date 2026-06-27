# WAR Guard Fidelity & Test Hermeticity Implementation Plan (#95 · #102)

**Goal:** close two meta-test fidelity gaps so the WAR guards exercise the *full forbidden equivalence class* and the
meta-suite neither false-fails nor false-passes — make `validate-worktree-scope.test.sh` case 11 hermetic so it
cannot spuriously `gate_failed` when the suite runs from inside a `.war-task` worktree (#95), harden the refiner's
gate run against the same class (#95 fix (b), operator-requested), and extend `refinery-surface.test.sh` ABSENCE
CHECK 2 to guard the `git switch origin/<working>` verb against a dropped `--detach` (#102).

**Closes:** #95 (validate-worktree-scope case 11 non-hermetic — spurious `gate_failed` inside `.war-task` worktrees),
#102 (refinery-surface absence-guard is verb-specific — misses non-detached `git switch origin/<working>`).

**Scope (v0.6.8 — guard/test fidelity + a small live-behavior hardening; PLAN 3 of the [open-issue remediation stack](2026-06-26-open-issue-remediation-roadmap.md)):**
test-fidelity (#95a, #102) plus one minimal live-merge hardening (#95b — refiner gate run pins a `.war-task`-free
`TMPDIR`). Files: `hooks/validate-worktree-scope.test.sh`, `skills/war/assets/refinery-surface.test.sh`,
`agents/war-refiner.md`. No change to the production hook `validate-worktree-scope.sh`.

**Operator decisions (2026-06-26, grill-with-docs):**
- **#95 fix (b) — INCLUDED, as a subsequent task gated on (a)'s audit (operator decision, raised + answered).** The
  operator chose to include the refiner gate-cwd hardening *but* implement it in a task that **depends on #95 (a)** so
  (a) is audited and merged independently first, and (b) is then audited on its own. Realized as: **Task 3 (#95b)
  `deps: [Task 1 (#95a), Task 2 (#102)]`** — Task 1 runs/audits/merges in wave 1, Task 3 in wave 2.
- **#95 (b) mechanism → pin a `.war-task`-free `TMPDIR` for the refiner's gate run** (NOT relocate the gate). The
  merge-task gate MUST run in `<taskWorktree>` — `war-refiner.md:24`, step 2 — because a `gate_failed` routes a
  FIX_NEEDED back to a fix-worker working *in that worktree* (`war-refiner.md:25,28`); relocating the gate to
  `_refinery` would break fix-in-place. The worktree root necessarily carries `.war-task` (worker confinement). The
  non-hermeticity vector is meta-tests creating scratch dirs via `mktemp` that land under that marker; pinning
  `TMPDIR` to a freshly-created, `.war-task`-free directory makes those scratch dirs isolate. **Rejected
  alternatives:** (i) relocate the gate to a marker-free checkout — infeasible without duplicating the rebased code,
  breaks fix-in-place; (ii) temporarily rename/remove the `.war-task` marker during the gate — fragile and unsafe
  (the marker is the worker-confinement signal). The exact mechanism is **flagged for #95(b)'s own `/red-team`**, as
  the operator requested (b) "gets audited itself."
- **#102 verb breadth → stay scoped to `switch origin/<working>` without `--detach`** (mirror the `checkout` verb).
  `switch -c/-C` (create-and-switch) is **out of scope** — the memory lesson `absence-guard-verb-specific-coverage-gap`
  is about the *verb* equivalence (`checkout`↔`switch`), not create-flags; #102 explicitly claims only the
  checkout-mirror.
- **#95a scope → fix the test, not the hook.** Case 11's hermeticity is a test-harness property; the production hook
  `validate-worktree-scope.sh` (incl. the `prev` relative-path-loop progress guard) is unchanged.

**Architecture:** both #95 sites and #102 are meta-tests over WAR invariants. #95a roots `rel_guard()`'s clean dir
under the suite's own controlled `.war-task`-free fixture (`$WT/plain/…`, created at `validate-worktree-scope.test.sh:47`)
and *verifies* the precondition at runtime, so case 11's relative-path DENY (exit 2) holds regardless of where the
suite is invoked. #95b hardens the live refiner so its gate run pins a clean `TMPDIR`. #102 adds a second grep to
ABSENCE CHECK 2 covering the `switch` verb, preserving the load-bearing `*.test.*` exclusion.

**Dependency / ordering:** **plan 3 in the stack.** Isolated lane — touches only `hooks/validate-worktree-scope.test.sh`,
`skills/war/assets/refinery-surface.test.sh`, `agents/war-refiner.md`; **no file overlap with plans 1/2/4/5** except
the four version slots. Lands on plan 2's tip → **v0.6.8**.

**Tech stack:** POSIX `sh`/bash 3.2 meta-tests (`hooks/*.test.sh`, `skills/war/assets/*.test.sh`); agent markdown.
No `*.test.mjs` change.

**Gate (for `/war`):** the self-discovering multi-runner (quote the node glob; discover bash suites):
```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Source of truth:** [spec](../specs/2026-06-26-guard-and-test-hermeticity.md). Memory:
`scope-hook-test-nonhermetic-inside-war-task-worktree`, `relative-path-test-needs-clean-cwd`,
`scope-hook-relative-path-loop-hang` (#95); `absence-guard-verb-specific-coverage-gap` (#102).

## Build order (for `/war`)

One integration base; Phase 1 fans out then converges:
- **Wave 1 (parallel):** Task 1 (#95a hermetic case 11) + Task 2 (#102 switch-verb guard) — disjoint files.
- **Wave 2:** Task 3 (#95b refiner `TMPDIR` hardening) — `deps: [Task 1, Task 2]` (Task 1 audited first per the
  operator decision; Task 2 because both touch `refinery-surface.test.sh`).
- **Phase 2:** Task 4 (release v0.6.8).

---

## Phase 1 — Guard & meta-test fidelity

### Task 1 (#95a) — Make `validate-worktree-scope.test.sh` case 11 hermetic
**deps:** none.
**Files:** modify `hooks/validate-worktree-scope.test.sh` (`rel_guard()` `:119-137`; case 11 `:138-139`). No change
to `hooks/validate-worktree-scope.sh`.

- [ ] **Step 1 — Reproduce red.** Run the full suite *from inside a `.war-task`-marked worktree* (mirroring the
  refiner cwd, `war-refiner.md:24`): create a throwaway dir with a `.war-task` marker at its root, `cd` in, and run
  `bash <repo>/hooks/validate-worktree-scope.test.sh`. Confirm case 11 FAILs (hook returns 0 instead of 2).
- [ ] **Step 2 — Strengthen the assertion to be diagnostic.** In `rel_guard()`, after choosing the clean dir, walk
  its ancestors; if any holds `.war-task`, emit a SPECIFIC marker and fail loud (a non-isolatable environment is
  reported, never silently mis-asserted). Case 11 still red here for the right reason.
- [ ] **Step 3 — Implement the hermetic fix.** Root the clean dir under the suite's own `.war-task`-free fixture
  (`$WT/plain/…`, `:47`) instead of an ambient `mktemp -d`; keep the subshell `cd "$clean"` so the relative payload
  (`relative/sub/file.txt`) resolves under the verified-clean dir; preserve the existing `timeout`/watchdog
  loop-bound logic (`:121-134`) so the relative-path infinite-loop protection is retained.
- [ ] **Step 4 — Green from BOTH locations.** Run the suite (a) from a clean checkout and (b) from inside a
  `.war-task` worktree. Case 11 must be exit 2 in both. Cases 1-10, servitor-frontmatter checks (`:148-216`), and
  the `..`-traversal cases (`:226-253`) stay green.
- [ ] **Step 5 — Commit** — `fix(war): make validate-worktree-scope case 11 hermetic — verified-clean cwd so the worker relative-path denial holds inside .war-task worktrees (#95)`
- **Closes:** #95 sub-items 1-2 (hermetic case 11 + runtime isolation verification).

### Task 2 (#102) — Add `switch origin/` absence assertion + header prose
**deps:** none.
**Files:** modify `skills/war/assets/refinery-surface.test.sh` (ABSENCE CHECK 2 `:156-181`; header prose `:11-14`).
No live-surface change.

- [ ] **Step 1 — Red via planted regression.** In a scratch copy (NOT committed) change `agents/war-refiner.md:38`
  from `switch --detach origin/<working>` to `switch origin/<working>`; confirm the *current* guard does NOT catch it
  (the `checkout origin/` grep misses the `switch` verb). Revert.
- [ ] **Step 2 — Add the failing assertion.** Add a second grep in ABSENCE CHECK 2 mirroring the `checkout origin/`
  scan exactly: collect `switch origin/` lines lacking `--detach` across `$LIVE_SURFACE_FILES` (preserve the
  `*.test.*` exclusion, `:31-34`/`:112`/`:164`), fail loud with a SWITCH-specific message. With the planted
  regression re-applied to a scratch copy this new assertion FAILs (red); revert.
- [ ] **Step 3 — Header prose.** Update the `:11-14` header block to name both `checkout` and `switch` as guarded
  verbs of "named, non-detached re-base onto the working branch in a land context."
- [ ] **Step 4 — Green on the live surface.** Run `refinery-surface.test.sh` against the real
  `agents/war-refiner.md:38` (`switch --detach`) — new grep finds zero hits, assertion passes; the existing
  `checkout origin/` assertion stays green.
- [ ] **Step 5 — Commit** — `test(war): guard switch origin/<working> without --detach in refinery-surface ABSENCE CHECK 2 (mirror checkout verb) (#102)`
- **Closes:** #102 (switch-verb scan + header prose).

### Task 3 (#95b) — Refiner gate run pins a `.war-task`-free `TMPDIR`
**deps:** [Task 1, Task 2].  (Task 1 audited/merged first per the operator decision; Task 2 because both edit
`refinery-surface.test.sh`.)
**Files:** modify `agents/war-refiner.md` (merge-task step 2, `:24`) and `skills/war/assets/refinery-surface.test.sh`
(a new PRESENCE assertion).

- [ ] **Step 1 — Write failing test.** Add a PRESENCE assertion to `refinery-surface.test.sh`: the merge-task gate
  step in `agents/war-refiner.md` instructs running the gate with a `.war-task`-free `TMPDIR`. **Assert with `grep -F`
  on a robust literal token** (red-team 2026-06-26): use `grep -qF 'TMPDIR=' <war-refiner.md>` (present after the
  reword, absent on the original = valid RED). Do **NOT** assert the contiguous substring `war-task-free` — the reword
  writes `` `.war-task`-free `` with a backtick, so that substring is absent → false-RED; and do **NOT** BRE-grep
  `TMPDIR=$(cd /` — the `$(` is a regex anchor under BRE → no match (use `grep -F`). Fails today (no TMPDIR directive).
- [ ] **Step 2 — Run gate → fail.**
- [ ] **Step 3 — Implement (live-behavior hardening).** Reword `war-refiner.md` step 2 (`:24`) to: *"Run the gate
  command in `<taskWorktree>` with `TMPDIR` set to a freshly-created, `.war-task`-free directory (created outside any
  worktree — e.g. `TMPDIR=$(cd / && mktemp -d)`), so any meta-test that materialises scratch dirs isolates from the
  worktree's `.war-task` marker. The gate's cwd stays `<taskWorktree>` so it tests the rebased task-branch code and a
  `gate_failed` still routes a fix-worker in place."* Add a one-line cross-reference that the scope-hook meta-test is
  hermetic to this (Task 1).
- [ ] **Step 4 — Run gate → pass** (the new PRESENCE assertion + the existing surface checks green;
  `agents/war-refiner.md:38`'s `switch --detach` keeps Task 2's grep green).
- [ ] **Step 5 — Commit** — `fix(war): refiner runs the merge-task gate with a .war-task-free TMPDIR (defense-in-depth, #95 fix b)`
- **Closes:** #95 sub-item 3 (the deferred refiner change, now included per operator decision).
- **Ratify in `/red-team`:** the `TMPDIR=$(cd / && mktemp -d)` mechanism (vs alternatives) — this task is to be
  audited independently per the operator decision.

---

## Phase 2 — Release

### Task 4 — Version bump v0.6.8 + full self-discovering gate green
**Files:** `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` AND
`plugins[0].version` (both); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.6.7" lineage ok).

- [ ] **Step 1 — Bump all four slots to `0.6.8`** (memory: `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`). **Roadmap-assigned** (plan 3, on plan 2's v0.6.7); take the
  next free patch if the order shifts. Status copy: case-11 hermeticity, switch-verb guard, refiner clean-`TMPDIR`.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.6.8 — guard fidelity & test hermeticity (#95 #102)`

---

## Test plan

**Gate** = the self-discovering multi-runner above; run at every Step 2/4, final green required.

- **Task 1 (#95a) — `hooks/validate-worktree-scope.test.sh`:** case 11 returns exit 2 from a clean checkout AND from
  inside a `.war-task` worktree; `rel_guard()`'s clean dir is asserted `.war-task`-free at runtime (specific marker,
  never a silent exit-0 false-pass); cases 1-10, servitor-frontmatter (`:148-216`), `..`-traversal (`:226-253`) stay
  green.
- **Task 2 (#102) — `skills/war/assets/refinery-surface.test.sh`:** any `switch origin/<working>` without `--detach`
  on the live surface (`*.test.*` excluded) → FAIL with a switch-specific message; the real `switch --detach` at
  `war-refiner.md:38` → PASS; existing `checkout origin/` assertion + PRESENCE checks + ABSENCE CHECK 1 stay green.
- **Task 3 (#95b) — `skills/war/assets/refinery-surface.test.sh` + `agents/war-refiner.md`:** the new PRESENCE
  assertion (gate step pins a `.war-task`-free `TMPDIR`) passes against the reworded `war-refiner.md:24`; all prior
  surface checks stay green.

**Regression guard:** the whole meta-suite stays green; no production-hook (`validate-worktree-scope.sh`) change.

## Out of scope
- Broader `git switch` flag classes (`-c`/`-C` create-and-switch) beyond `switch origin/<working>` without
  `--detach` (OQ2 resolved: scoped to the checkout-mirror).
- The `done.add()` unconditional-bookkeeping note in #95's inspection — benign, tracked via memory
  `done-add-on-soft-failure-unblocks-true-dependents`; handled by plan 2's complementary work, not here.
- Any change to the production hook `validate-worktree-scope.sh` or the land-phase routing surface.

## Notes / conscious deviations (ratify in `/red-team`)
- **#95(b) included as a gated subsequent task** (operator decision) — (a) audited/merged before (b) starts; (b)
  audited on its own. (b) is a small *live-merge* hardening (clean `TMPDIR` for the gate), so it ratifies in its own
  red-team; the `TMPDIR=$(cd / && mktemp -d)` mechanism vs alternatives (relocate-gate / rename-marker) is the thing
  to stress.
- **#95(b) does not relocate the gate** — the merge-task gate must stay in `<taskWorktree>` for fix-in-place; only
  the scratch space (`TMPDIR`) is hardened. After Task 1, the scope-hook meta-test is hermetic regardless, so (b) is
  forward-looking defense-in-depth for the class.
- **#95 premise is environment-specific (red-team 2026-06-26).** The red-team could NOT reproduce case 11 failing on
  this macOS/BSD host (for the relative payload `dirname` converges to `.` and the progress guard stops the walk at
  `.`). The original flake was observed in a real run (clandiso-0625), so it CAN occur — Task 1's hermetic fix is a
  valid robustness/determinism improvement regardless, and the meta-suite stays green with it applied. Also: **BSD
  `mktemp -d` ignores `TMPDIR`**, so #95(b)'s pin is a **no-op on macOS** and only load-bearing on GNU-coreutils CI
  hosts — kept as Linux-CI defense-in-depth (Task 1 is the real fix). Both non-blocking.

## Open decisions — RESOLVED (grill-with-docs, 2026-06-26)
1. **#95 fix (b) → INCLUDED** as Task 3, `deps:[Task 1, Task 2]` (operator decision: (a) audited before (b) starts;
   (b) audited itself). Mechanism = pin a `.war-task`-free `TMPDIR`; flagged for (b)'s red-team.
2. **#102 verb breadth → scoped** to `switch origin/<working>` without `--detach` (checkout-mirror); `switch -c/-C`
   out of scope.
3. **#95a → test-only** (production hook unchanged).
4. **Version** roadmap-assigned v0.6.8 (plan 3); Release task takes the next free patch if the order shifts.
