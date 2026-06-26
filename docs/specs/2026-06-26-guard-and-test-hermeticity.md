# WAR Guard Fidelity & Test Hermeticity (#95, #102)

**One-line summary:** Close two meta-test fidelity gaps so the WAR guards exercise the *full forbidden equivalence class* and the meta-suite neither false-fails nor false-passes — make `validate-worktree-scope.test.sh` case 11 hermetic so it cannot spuriously `gate_failed` when the suite runs from inside a `.war-task` worktree (#95), and extend `refinery-surface.test.sh` ABSENCE CHECK 2 to guard the `git switch origin/<working>` verb (not just `checkout`) against a dropped `--detach` (#102).

**Closes:** #95 (validate-worktree-scope.test.sh case 11 non-hermetic — spurious gate_failed inside `.war-task` worktrees), #102 (refinery-surface.test.sh absence-guard is verb-specific — misses non-detached `git switch origin/<working>`).

**Release:** patch bump **v0.6.5 → v0.6.6** (test-fidelity only; no live behavior change — both current live surfaces stay passing).

---

## 1. Problem statement

Both issues are *meta-test fidelity* defects: the guards/tests that are supposed to protect a WAR invariant have a hole. Neither is an active production defect — the live surfaces are currently correct — but each meta-test can give a wrong verdict (#95 false-FAILs, #102 latently false-PASSes a future regression).

### Issue #95 — case 11 non-hermetic (severity: major; verified still-valid)

**Symptom (verified):** Spurious `gate_failed` escalation during WAR merge-task, seen in run `clandiso-0625` Phase 1 task T1. The refiner runs the gate from inside the task worktree (`agents/war-refiner.md:24` — "Run the gate command (in `<taskWorktree>`)"), and the task worktree's root carries a `.war-task` marker.

**Root cause (verified):** The full meta-suite `hooks/validate-worktree-scope.test.sh` includes a load-bearing regression case (case 11) that asserts a `war-worker` writing to a *relative* path with no `.war-task` ancestor is **denied** (exit 2). It runs the hook through `rel_guard()` which `cd`s into a fresh `mktemp -d` before piping the payload, with the explicit intent (test comment, `validate-worktree-scope.test.sh:114-118`) to "prevent the CWD's own `.war-task` from satisfying the walk." But when the *suite itself* is invoked from inside a `.war-task`-marked worktree, the hook's ancestor-walk (`hooks/validate-worktree-scope.sh:62-68`) can still climb out of the clean temp dir and find a `.war-task` marker in an ancestor of the temp dir's *mount point path*, so the hook returns exit 0 (allow) instead of exit 2 (deny) → case 11 FAILs → the whole gate fails → spurious `gate_failed`.

The relevant hook walk:

```sh
# hooks/validate-worktree-scope.sh:62-68
prev=""
while [ -n "$d" ] && [ "$d" != "$prev" ]; do
  [ -e "$d/.war-task" ] && exit 0
  [ "$d" = "/" ] && break
  prev="$d"
  d="$(dirname "$d")"
done
```

For a *relative* path (`relative/sub/file.txt`), `dirname` converges to `.`, and the walk evaluates `[ -e "./.war-task" ]`, `[ -e "../.war-task" ]`-equivalents only insofar as `.` resolves against the *current working directory* of the hook process. `rel_guard` sets that cwd to a fresh `mktemp -d`, but on a system where `mktemp -d` returns a path *under* a `.war-task`-marked tree (e.g. `$TMPDIR` resolving inside the worktree, or the suite invoked with a relative `$HOOK` from inside the worktree), the relative-path resolution `.` → temp dir → still has a `.war-task` ancestor reachable by `dirname`, satisfying the walk and returning exit 0.

**Current evidence anchors (do not invent — these are from the verified inspection):**
- `hooks/validate-worktree-scope.test.sh:119-137` — `rel_guard()` (creates `mktemp -d`, runs hook via subshell `cd`).
- `hooks/validate-worktree-scope.test.sh:138-139` — case 11 expectation (`2`, "war-worker relative path denies (no infinite loop)").
- `hooks/validate-worktree-scope.test.sh:114-118` — comment stating the intent to isolate from the CWD's own `.war-task`.
- `hooks/validate-worktree-scope.sh:55-70` — the `*war-worker*` branch and ancestor-walk loop.
- `agents/war-refiner.md:24` — "Run the gate command (in `<taskWorktree>`)" — the environment that triggers the failure (the task worktree root holds `.war-task`).

### Issue #102 — absence-guard is verb-specific (severity: minor; verified still-valid)

**Root cause (verified):** `refinery-surface.test.sh` ABSENCE CHECK 2 scans only for `checkout origin/` lines lacking `--detach`. The live land loop now uses the `switch` verb — `git -C <_refinery> switch --detach origin/<working>` (`agents/war-refiner.md:38`, inside the land-phase CAS loop). A regression that drops `--detach` from the **switch** form (`git switch origin/<working>`, same dangerous semantic — a named, non-detached checkout that git refuses when the working branch is checked out in the Lead's main checkout) would **not** be caught: the guard's grep only matches the `checkout` verb. This is a latent false-negative, not an active defect — the current surface correctly uses `--detach`, so the guard passes today, but its coverage of the forbidden equivalence class is incomplete.

**Current evidence anchors:**
- `skills/war/assets/refinery-surface.test.sh:156-181` — ABSENCE CHECK 2 (the `checkout origin/` scan).
- `skills/war/assets/refinery-surface.test.sh:167` — the single grep: `grep -n 'checkout origin/' "$f" | grep -v '\-\-detach' | grep -v 'detach'`.
- `skills/war/assets/refinery-surface.test.sh:11-14` (header prose) — names the forbidden token but only in `checkout` terms; must acknowledge both verbs. (Note: the structural header prose spans roughly lines 11-22 in the live file; the verb-specific phrasing "`checkout <working>` by name (non-detached)" lives in that block.)
- `agents/war-refiner.md:38` — the live, *correct* `git -C <_refinery> switch --detach origin/<working>` line that the guard must keep green.

This mirrors a known WAR memory lesson: `absence-guard-verb-specific-coverage-gap` (4/t8) — "`checkout origin/` guard misses `git switch origin/`; enumerate full equivalence class of forbidden behavior."

---

## 2. Design / approach

### #95 — make case 11 hermetic (chosen: test-level fix (a); refiner change (b) deferred)

The inspection offers two fixes:
- **(a)** make case 11 hermetic — run the hook from a guaranteed-clean location with *no* `.war-task` ancestor, verified at runtime (preferred for the test).
- **(b)** change `agents/war-refiner.md:24` so the gate runs from a non-`.war-task` cwd (defense-in-depth for the refiner).

**Chosen:** **(a)**, harden `rel_guard()` so the relative-path denial is exercised regardless of where the suite is invoked from. **(b) is deferred** (see Decision record + Open questions): it touches live merge behavior and the clean-surface invariant, and (a) alone fully closes the spurious `gate_failed` in the meta-suite.

**Hardening (a) — three reinforcing measures, all on `hooks/validate-worktree-scope.test.sh:119-137`:**

1. **Pin the temp dir under a guaranteed `.war-task`-free root.** Create the clean dir under the *suite's own already-isolated `$WT` fixture root* (which the suite creates at `validate-worktree-scope.test.sh:41` and is a fresh `mktemp -d` known to have no `.war-task` ancestor *within* the run), OR `mktemp -d` and then **walk its ancestors at runtime asserting none holds `.war-task`**; if any does, fall back to a nested dir under `$WT/plain/` (line 47 already creates a `.war-task`-free `$WT/plain/sub`). Because `$WT` is the suite's own controlled fixture, a dir beneath `$WT/plain/` is provably ancestor-clean even when the suite runs from inside a `.war-task` worktree.

2. **Verify the isolation before asserting.** Before running the hook, the guard walks the chosen clean dir's ancestors (`d=$clean; while ...; [ -e "$d/.war-task" ] && <fail-loud>`). If a `.war-task` is found, the guard prints a SPECIFIC diagnostic and forces the test to fail with a *non-spurious* message (so an environment that genuinely cannot isolate is reported as a harness problem, not silently mis-asserted). This is the analog of the audit-fidelity plan's "assert deny by a SPECIFIC marker, not merely exit code" discipline.

3. **Make the relative-path resolution deterministic.** Keep the existing subshell `cd "$clean"` so the hook's `.` resolves under the verified-clean dir; the relative payload (`relative/sub/file.txt`) then walks `clean/relative/sub` → `clean/relative` → `clean` → `clean`'s ancestors, all asserted `.war-task`-free, so the hook reaches `deny` (exit 2) as case 11 requires.

**Rationale:** the bug is that "clean temp dir" was assumed but never *verified*. The fix makes the precondition (no `.war-task` ancestor) an explicit, checked invariant of the test, and roots the clean dir under the suite's own controlled fixture (`$WT/plain/`) rather than an ambient `mktemp` that can land under a worktree. This keeps case 11 deterministic whether the suite runs from a clean checkout **or** from inside a `.war-task` worktree.

**Rejected alternative (from the issue):** modifying the *hook* (`validate-worktree-scope.sh`) to canonicalize relative paths or refuse to climb above the cwd. Rejected because it changes production guard semantics to fix a test-harness isolation gap, and could mask the very relative-path-loop class the case is meant to protect (memory: `scope-hook-relative-path-loop-hang`). The test, not the hook, is the thing that lacks hermeticity.

### #102 — mirror the `switch` verb in ABSENCE CHECK 2 (chosen: second grep + header prose)

Add a **second grep** in the same ABSENCE CHECK 2 block (`refinery-surface.test.sh:156-181`) that catches `switch origin/` lines lacking `--detach`, mirroring the existing `checkout origin/` scan exactly (same `grep -v '\-\-detach' | grep -v 'detach'` filter, same fail-loud message form, same `$LIVE_SURFACE_FILES` loop with the load-bearing `*.test.*` exclusion). Update the header prose (`:11-14` block) to name **both** `checkout` and `switch` as guarded verbs.

**Rationale:** this is the fix the issue itself prescribes; it extends the guard to the full forbidden equivalence class (any named, non-detached re-base onto the working branch in a land context, regardless of verb) without changing the live surface. The live `agents/war-refiner.md:38` uses `switch --detach`, so the new grep finds zero hits and the assertion passes (green) today; it only bites a future `switch`-without-`--detach` regression. Prior-art to mirror: the existing `checkout origin/` block immediately above it in the same file.

---

## 3. Decision record

- **Scope boundary (#95): fix the test, not the hook.** Case 11's hermeticity is a *test-harness* property. The production hook `validate-worktree-scope.sh` is unchanged. The relative-path-loop progress guard (`prev`) stays exactly as is.
- **Scope boundary (#95): refiner change (b) deferred.** `agents/war-refiner.md:24` is NOT changed in this run. Fix (a) closes the spurious `gate_failed`; the cwd-of-gate change is a separate live-behavior decision (Open question 1). This keeps the change set test-only and the patch bump honest.
- **Back-compat guarantee (both):** both current live surfaces MUST keep passing. #95: cases 1-10, the servitor frontmatter checks, and the `..`-traversal cases stay green; only case 11 becomes deterministic. #102: the existing `checkout origin/` assertion is untouched and `agents/war-refiner.md:38`'s `switch --detach` keeps the new grep green.
- **Defense-in-depth (#95):** the test now *verifies* its own isolation precondition (asserts no `.war-task` ancestor on the clean dir) rather than assuming it — fail-loud on a harness that cannot isolate, so the class can never silently false-pass either.
- **Defense-in-depth (#102):** the guard now covers the full verb equivalence class (`checkout` + `switch`); the `*.test.*` exclusion (load-bearing, `refinery-surface.test.sh:31-34`, `:112`, `:164`) is preserved so the new grep's own token doesn't self-trip the absence check.
- **Independence:** the two issues touch disjoint files (`hooks/validate-worktree-scope.test.sh` vs `skills/war/assets/refinery-surface.test.sh`) and can share one integration base; tasks can run in parallel or serially with no ordering dependency.
- **TDD framing:** #95 is a "make the test go red, then make it deterministically green" exercise — reproduce the spurious failure by running the suite from inside a `.war-task` worktree, then fix `rel_guard`. #102 is "add a new assertion that would catch a regression, prove it catches a planted regression, then confirm the clean live surface passes."

---

## 4. Phase → task decomposition

Two TDD tasks. Independent files; one integration base; a release task to close.

### Phase 1 — Guard & meta-test fidelity

#### Task 1 (#95): Make `validate-worktree-scope.test.sh` case 11 hermetic

**Files:** Modify `hooks/validate-worktree-scope.test.sh` (`rel_guard()` at `:119-137`; case 11 at `:138-139` stays, possibly with a strengthened message). No change to `hooks/validate-worktree-scope.sh`. (#95 fix (b) — `agents/war-refiner.md:24` — deferred, see Decision record.)

- [ ] **Step 1 — Reproduce red.** Run the full suite *from inside a `.war-task`-marked worktree* (mirroring the refiner's cwd per `war-refiner.md:24`): create a throwaway dir with a `.war-task` marker at its root, `cd` into it, and invoke `bash <repo>/hooks/validate-worktree-scope.test.sh`. Confirm case 11 ("war-worker relative path denies (no infinite loop)") FAILs (hook returns 0 instead of 2) — this is the spurious `gate_failed`. (Memory: `scope-hook-test-nonhermetic-inside-war-task-worktree`, `relative-path-test-needs-clean-cwd`.)
- [ ] **Step 2 — Strengthen the assertion to be diagnostic.** Add to `rel_guard()` a runtime precondition check: after choosing the clean dir, walk its ancestors and, if any holds `.war-task`, emit a SPECIFIC marker and force a fail-loud (so a non-isolatable environment is reported, never silently mis-asserted). At this point case 11 still FAILs (red) for the right reason.
- [ ] **Step 3 — Implement the hermetic fix.** Root the clean dir under the suite's own controlled, `.war-task`-free fixture (`$WT/plain/…`, created at `:47`) instead of an ambient `mktemp -d` that can land under a worktree; keep the subshell `cd "$clean"` so the relative payload resolves under the verified-clean dir; preserve the existing `timeout`/background-watchdog loop-bound logic (`:121-134`) so the relative-path infinite-loop protection is retained.
- [ ] **Step 4 — Green from BOTH locations.** Run the suite (a) from a clean checkout and (b) from inside a `.war-task` worktree (the Step 1 reproduction). Case 11 must be exit 2 (deny) in both. Confirm cases 1-10, servitor-frontmatter checks, and `..`-traversal cases stay green.
- [ ] **Step 5 — Commit:** `fix(war): make validate-worktree-scope case 11 hermetic — verified-clean cwd so relative-path worker denial holds inside .war-task worktrees (#95)`

#### Task 2 (#102): Add `switch origin/` absence assertion + header prose

**Files:** Modify `skills/war/assets/refinery-surface.test.sh` (ABSENCE CHECK 2 block `:156-181`; header prose `:11-14`). No live-surface change.

- [ ] **Step 1 — Red via planted regression.** Temporarily (in a scratch copy, NOT committed) change `agents/war-refiner.md:38` from `switch --detach origin/<working>` to `switch origin/<working>` and confirm the *current* guard does NOT catch it (the `checkout origin/` grep misses the `switch` verb) — proving the gap. Revert the scratch change.
- [ ] **Step 2 — Add the failing assertion.** Add a second grep in ABSENCE CHECK 2 mirroring the `checkout origin/` scan: collect `switch origin/` lines lacking `--detach` across `$LIVE_SURFACE_FILES` (with the `*.test.*` exclusion preserved), fail-loud with a SWITCH-specific message if any are found. With the planted regression re-applied to a scratch copy, this new assertion FAILs (red); revert.
- [ ] **Step 3 — Header prose.** Update the `:11-14` header block to name both `checkout` and `switch` verbs as guarded forms of "named, non-detached re-base onto the working branch in a land context."
- [ ] **Step 4 — Green on the live surface.** Run `refinery-surface.test.sh` against the *real* `agents/war-refiner.md:38` (`switch --detach`) — the new grep finds zero hits, assertion passes; the existing `checkout origin/` assertion stays passing.
- [ ] **Step 5 — Commit:** `test(war): guard switch origin/<working> without --detach in refinery-surface ABSENCE CHECK 2 (mirror checkout verb) (#102)`

### Phase 2 — Release

#### Task 3: Version bump v0.6.6 + full self-discovering gate green

**Files:** the README-documented bump list — `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` AND `plugins[0].version` (both slots — stale = silent no-op release); `README.md` `## Status` (REPLACE-in-place; "Builds on v0.6.5" lineage ok). README has no version *badge*.

- [ ] **Step 1:** Bump all four slots from `0.6.5` → `0.6.6`. (Memory: `release-bump-slots-canonical-no-badge`, `release-status-is-replace-slot-not-empty-field`.)
- [ ] **Step 2:** Run the full self-discovering gate (Test plan §6) → green.
- [ ] **Step 3 — Commit:** `chore(release): v0.6.6 — guard fidelity & test hermeticity (#95, #102)`

---

## 5. Test plan

**Gate command (run verbatim; quote the node glob — unquoted under-covers on bash 3.2; self-discover the bash suites):**

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Task 1 (#95) assertions — `hooks/validate-worktree-scope.test.sh`:**
- Case 11 ("war-worker relative path denies (no infinite loop)") returns exit **2** (deny) when the suite is run from a clean checkout.
- Case 11 returns exit **2** when the suite is run from inside a `.war-task`-marked worktree (the reproduction in Task 1 Step 1) — the hermeticity fix.
- `rel_guard()`'s clean dir is asserted `.war-task`-free at runtime; a non-isolatable environment fails loud with a SPECIFIC marker (never a silent exit-0 false-pass).
- Regression: cases 1-10, the servitor frontmatter `tools:` checks (`:148-216`), and the `..`-traversal cases (`:226-253`) stay green.

**Task 2 (#102) assertions — `skills/war/assets/refinery-surface.test.sh`:**
- New: any `switch origin/<working>` line WITHOUT `--detach` on the live surface (`agents/war-refiner.md` + `workflow-template.js`, `*.test.*` excluded) → FAIL with a switch-specific message; the real `switch --detach origin/<working>` at `war-refiner.md:38` → PASS (zero hits).
- Prior-art mirror: the new grep matches the existing `checkout origin/` block's shape (`refinery-surface.test.sh:162-181`) — same loop, same `grep -v '\-\-detach' | grep -v 'detach'` filter, same fail-loud form.
- Regression: existing `checkout origin/` assertion stays passing; all PRESENCE checks (`_refinery`, `ensure-refinery-worktree`) and ABSENCE CHECK 1 ("from the Lead") stay green.

**Release (Task 3):** full self-discovering gate green; all four version slots = `0.6.6`.

---

## 6. Out of scope

- **#95 fix (b)** — changing `agents/war-refiner.md:24` so the gate runs from a non-`.war-task` cwd. Deferred (Open question 1); fix (a) closes the meta-suite defect.
- The `done.add()` unconditional-bookkeeping note mentioned in #95's inspection (failed task's code left on the integration branch) — benign, separate concern, tracked elsewhere (memory: `done-add-on-soft-failure-unblocks-true-dependents`); not in this group.
- Broader `git switch` flag classes (`-c`/`-C` create-and-switch) beyond `switch origin/<working>` without `--detach` (Open question 2).
- Any change to the production hook `validate-worktree-scope.sh` or to the live refinery routing surface.

## 7. Open questions

1. **#95 fix (b):** does the operator want the refiner's gate-cwd change (`war-refiner.md:24` → run gate from a non-`.war-task` location) in this run, or as a follow-up? Fix (a) is sufficient to close the meta-suite spurious failure; (b) is defense-in-depth that touches live merge behavior and the clean-surface invariant.
2. **#102 verb breadth:** is `switch origin/<working>` without `--detach` the complete forbidden equivalence class for the land context, or should `switch -c/-C <working>` (create-and-switch) also be guarded? #102 claims only the `checkout`-mirror; broader coverage is out of scope unless requested.

---

## 8. Coverage table

| Issue | Sub-item | Closing task |
|------|----------|--------------|
| #95 | Make case 11 hermetic: `rel_guard` guarantees no `.war-task` ancestor (verified-clean dir under suite fixture) | Task 1 (Steps 2-3) |
| #95 | Verify the subshell cwd change isolates the hook ancestor-walk (explicit runtime cwd/ancestor verification) | Task 1 (Step 2) |
| #95 | Consider refiner change: run gate from a non-`.war-task` location (`war-refiner.md:24`) | Deferred — Decision record + Open question 1 (not changed this run) |
| #102 | Add scan for `switch origin/` lines without `--detach` in ABSENCE CHECK 2 (mirror `checkout origin/` guard) | Task 2 (Steps 1-2) |
| #102 | Update `refinery-surface.test.sh` header prose to acknowledge both `checkout` and `switch` verbs | Task 2 (Step 3) |
| #95, #102 | Release (v0.6.6) + full gate green | Task 3 |
