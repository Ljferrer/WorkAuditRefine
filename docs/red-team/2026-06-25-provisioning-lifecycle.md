# Red Team — Provisioning Lifecycle (F08 · F09 · F10 + #69/#71) (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES (adjudicated) — plan is sound; 6 genuine defects patched. Mechanical gate **BLOCKED (23)**; most are the impl-plan misfire (the probe itself labeled many "plan correctly identifies this / no step executed yet"). Verified against the stacked base `4cb14a2` (v0.6.2, plans 1+2). Ready for `/war`.

## Attack surface
Spine (5) + bespoke (5): `anchor-check`, `gate-baseline` (executed), `owned-ledger-feasibility`, `f10-tip-occurrences`, `coverage-f08-f09-f10`. Coverage 10/10 on-target, 0 dropped (the f10 probe dropped on first attempt but succeeded on the scaffold's retry → true BLOCKED, not INCOMPLETE).

## Executed proof / key findings
- **F10 has TWO `<integration-tip>` placeholders, not one** (the headline catch): line **211** (Provision-prompt ensure-worktree, F10's stated target) AND line **307** (refine-loop `git rebase <integration-tip>`). The plan's Provision-prompt-only test would PASS while leaving (2) — a false sense of security (Critical). → **Patched:** Task 4 now resolves BOTH (per-task line → `"$TIP"`; rebase → `${ph.integrationBranch}`) and the guard is GLOBAL over the whole emitted template.
- **Version v0.5.4 → v0.6.3** (live is v0.6.2; v0.5.4 never existed). → Patched (Scope, Build order, Task 6, commit msg).
- **Gate glob unquoted + only 3 suites named** (ironic given F12 just landed). → Patched: quoted `'skills/**/*.test.mjs'` + self-discovery (all 4 incl. `refinery-surface`).
- **`branch_ahead_of` at 103-107, not 97-107** (Task 1). → Patched.
- **F10 spec line cites (:195/:202) stale → :211** → noted for back-port.
- **`owned-ledger-feasibility`:** confirmed the create-side helpers `load_owned_file`/`owned_has`/`record_owned_file` exist at file scope (lines ~128-141) and are reusable by teardown; create-side foreign-ref→exit-3 precedent exists; `cmd_teardown_task`/`cmd_teardown_phase` (lines ~350/390) currently have no ownership check (the F09 gap, correct).
- **Task 3 merged-guard `--force` wiring:** teardown commands today parse only `--keep`; → Patched Task 3 to add `--force` parsing + thread to `delete_branch` (else the `-D` path is unreachable).
- `gate-baseline`: base green (plans 1+2 present); all 4 suites run.

## Resolutions applied (decisions, `--afk` autonomous)
- Open #1 merged-guard → accept safe-fail (never data loss); revisit when teardown is wired. Open #2 resume → keep fail-closed. Open #3 → v0.6.3 standalone.

## Adjudicated as NON-defects (the misfire)
- BLOCKERS for "branch_ahead_of still present", "teardown has no --owned-file", "delete_branch force-deletes", "ensure-exclude no arg-validation", "no throw on undefined derivation", "<integration-tip> still at :211" — all correct for an unbuilt implementation plan; each maps to a task. `taskBranch`/`taskWorktree` at :89-91 are still accurate (#71 anchor holds).

## Residual risk
- Merged-guard safe-fail can leave a merged ref as cruft (cosmetic; never data loss) — accepted until teardown is wired.
- `find $(...)` word-splitting assumes no spaces in test paths (true today).
