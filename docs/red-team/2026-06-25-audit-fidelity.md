# Red Team — Audit Fidelity (F03 · F06) (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES (adjudicated) — plan is sound; defects patched, operator overrides ratified. Mechanical gate **BLOCKED**; most blockers are the impl-plan misfire ("not built yet") or the F03/F06 spec-deviation flags (ratified below). Verified against the stacked base `3cac50c` (v0.6.4). Final plan of the series. Ready for `/war`.

## Attack surface
Spine (5) + bespoke (5): `anchor-check`, `gate-baseline` (executed), `auditor-git-guard-feasibility` (executed), `covenpolicy-default-feasibility`, `coverage-f03-f06`. Coverage 10/10 on-target, 0 dropped.

## Executed proof / key findings
- **`auditor-git-guard-feasibility` (executed): the guard is PROVEN buildable** — a 47-case `.test.sh` prototype passed on `/bin/bash 3.2.57 + jq`. Hardened guidance folded into Task 2: use a **fail-closed character allowlist** (`[A-Za-z0-9 ./_=:,@^-]` via `LC_ALL=C tr`), NOT a metachar denylist (bash-3.2 bracket-class/backtick → `unexpected EOF`, crash-exits → false-pass); don't materialize a newline via `$(...)` (bash-3.2 strips it → matches everything); **"pager option" = global controls only** (leading `-p`/`--paginate`/`--no-pager`/`--pager=`), NOT subcommand `-p` (cat-file/show/log patch, read-only); assert deny by a **specific message**, not just `exit≠0`.
- **Two `PreToolUse:Bash` hooks coexist** (cross-plan, verified): the prototype added a 2nd `{matcher:"Bash"}` block (guard first, plan-4's warn-hook second); valid JSON; auditor `git push` → guard exit 2 = DENIED; `git diff` → both exit 0 = allowed. → Patched Task 2 to **APPEND**, not overwrite.
- **`covenpolicy-default-feasibility`: F06 is a safe one-line flip** — `DEFAULTS.audit.covenPolicy 'auto'→'all'` (line ~31); `covenSeats` keys on the pre-seeded `task.coven` boolean (the Lead seeds it from `covenPolicy`), economy's explicit `solo` override is unaffected, the `task.coven?'deep':'neighbors'` rule already yields deep — no template/depth change.
- **auditPrompt main-checkout lines at ~154-158** (plan cited :150-151, drifted) → Patched T1 + steered the auditor to allowlist-safe git forms.
- **Version v0.7.0 → v0.6.5**; gate unquoted → quoted+self-discover (auto-includes the new 7th suite). → Patched.

## Resolutions applied (decisions, `--afk` autonomous)
- Open #1 guard robustness → fail-closed char-allowlist (denies chaining/redirect/substitution/global pager/`-c`/`--output`; allows subcommand `-p`). #2 deep-always cost → accept for balanced (economy is the escape; cost note in schemas.md). #3 → v0.6.5.

## Adjudicated / ratified (operator overrides — NOT defects)
- **F03 → narrow-git-Bash auditor, NOT spec D2's refiner DiffResult artifact** (the spec recommended D2; the operator override is documented in the plan + my roadmap memory "F03 narrow-git-Bash auditor — don't re-litigate"). No `DiffResult` schema; three-dot diff. **Ratified; back-port the reversal into the F03 spec.** Trade-off accepted: the auditor's read-only-ness is now partly hook-enforced (the tiny git allowlist) rather than purely allowlist-by-construction — Write/Edit stay hard-denied by the worktree-scope hook.
- **F06 → full 3-lens panel at `deep` always, NOT spec F06-D3's neighbors-default.** Documented override; cost noted. **Ratified; back-port.**
- All "not implemented / file absent / covenPolicy still auto" — correct for an unbuilt plan; each maps to a task.

## Execution note (Lead)
T1 (auditPrompt/war-auditor.md/schemas.md) and T2 (new hook files + hooks.json) touch DISJOINT files, so phase 1 can run T1→T2 in one phase safely; T3 (config/docs) and T4 (release) are single-task. I will verify each land's working_sha advances (the plan-4 phantom-land lesson).

## Residual risk
- The auditor's git read-only-ness is hook-enforced (best-effort char-allowlist), not allowlist-by-construction — accepted with mitigations. `deep`-always tripled audit cost on the happy path (economy escape).
