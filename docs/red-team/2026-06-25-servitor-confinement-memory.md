# Red Team — Servitor Confinement & Memory (F01 · F05 + #58) (2026-06-25)

**Verdict:** CLEARED-WITH-NOTES (adjudicated) — plan is sound; 5 genuine defects patched. Mechanical gate **BLOCKED**, but `claims-vs-reality` + `anchor-check` were **PASS** (the probes self-labeled the "not yet implemented" items as expected to-dos). Verified against the stacked base `aca2baf9` (v0.6.3). Ready for `/war`.

## Attack surface
Spine (5) + bespoke (5): `anchor-check`, `gate-baseline` (executed), `warn-hook-feasibility` (executed), `dotdot-guard-feasibility`, `coverage-f01-f05-58`. Coverage 10/10 on-target, 0 dropped.

## Executed proof / key findings
- **`warn-hook-feasibility` (executed): PROVEN buildable** — a PreToolUse:Bash hook on bash 3.2 + jq detects redirections/`sed -i`/`git -C`/`cp`/`tee`, resolves the target, warns when no `.war-task` ancestor, and always exits 0. Confirmed the plan's case matrix. **Surfacing → stderr+exit0** (resolved). Accepted misses: opaque writes (`python -c`).
- **`dotdot-guard-feasibility`: the `..` hole is real** — `/repo/docs/learnings/../../etc/passwd` matches the bare servitor glob today and is ALLOWED; a single pre-branch insertion point exists for the `..`-reject guard (#58 fix sound).
- **T4 reword scope is incomplete** (the substantive catch): servitor-confinement-attributed-to-the-hook claims live not just in war-servitor.md but ALSO in `skills/war/SKILL.md` (×2), `references/schemas.md`, `references/design.md`, and `workflow-template.js:421` (the Wrap-up prompt). → **Patched:** T4 is now grep-driven over the whole live surface, file list expanded.
- **Version v0.6.0 → v0.6.4** (live is v0.6.3; F05 spec says v0.5.1). → Patched.
- **Wrap-up prompt line `:310-317` → ~420-426** (workflow-template.js drifted; F05 spec has the same stale cite). → Patched T5.
- **Gate unquoted + lists the not-yet-created 5th suite** → Patched: quoted + self-discovery (auto-picks up `warn-bash-write-scope.test.sh` once T3 makes it).
- `gate-baseline`: base green (4 suites; 5th arrives with T3).

## Resolutions applied (decisions, `--afk` autonomous)
- Open #1 warn-hook surfacing → stderr+exit0. #2 false-positive budget → accept best-effort (avoid quoted-`>`/`[ ]`/`node --test` FPs). #3 #58 → `..`-only (anchoring deferred). #4 F05 lint → defer. #5 (NEW) cross-plan: hooks.json `PreToolUse:Bash` is shared with plan 5 — plan 5 must **append**, not overwrite (flagged for plan 5).

## Execution note (Lead)
T1, T4, T5 all edit `war-servitor.md`; T1+T2 both edit `validate-worktree-scope.test.sh`; T4+T5 both edit `workflow-template.js`. Per the plan-3 lesson (`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`), I will run plan-4 tasks **one-per-phase** (1a=T1, 1b=T2, 1c=T3, then T4, T5, T6), each cut from the prior landed tip, to avoid same-file rebase conflicts.

## Adjudicated as NON-defects (the misfire)
- All "X not implemented / file doesn't exist / no `tools:` line yet" — correct for an unbuilt plan; each maps to a task. Grep-in-allowlist + tool-order vs F01 spec = documented operator deviation. T1's structural-test-can't-prove-harness-denial = documented limitation (pin the contract in the doc).

## Residual risk
- Warn-hook is advisory/best-effort (ADR 0002: exact bash-write confinement unattainable); the auditor is the real backstop. `..`-rejection not full anchoring.
