# Audit Remediation — Loop Runbook

**Pattern:** `sequential` · **Mode:** `safe` · **Started:** 2026-06-25 · **Branch:** `claude/sweet-chaum-2d0cdf`

A bounded loop that emits **one design-spec doc per finding** from the agent-architecture-audit into
[`docs/specs/`](../../docs/specs/). These specs are the seed for implementation plans (a later pass).

## Goal & stop condition

- **Goal:** every finding has a committed, house-format design spec that *defines a fix* (not just restates the problem).
- **Stop condition:** all **12** specs written + self-validated (each has Problem · Decisions · Solution shape ·
  Affected files · Alternatives · Validation · Open decisions; evidence is `file:line`; markdown lints clean;
  cross-linked to the relevant ADR / memory slug). Loop ends — does **not** continue into implementation.

## Decisions taken at loop start (the two genuine forks)

- **Scope = 12 specs:** the audit's F1–F10 **plus** the two WAR defects that surfaced in project memory this
  session — `dropped-coven-seat-silently-shrinks-quorum` (F11) and `gate-under-covers-after-cross-branch-merge-new-runner`
  (F12). Both are confirmed silent-failure defects in the same enforcement-vs-reality family as the audit.
- **F6 audit breadth = full 3-lens panel** (operator's call): the default audit becomes correctness +
  cascading-impact + plan-faithfulness on every task, unanimous. (Economy preset keeps solo.)

## Baseline (verified before iteration 1 — safe-mode gate)

- `node --test skills/**/*.test.mjs` → **92 pass / 0 fail** @ `48afd7e`.
- `hooks/clean-surface-war-worktree.test.sh` → PASS; `hooks/validate-worktree-scope.test.sh` → 11/11;
  `skills/war/assets/provision-worktrees.test.sh` → 62/62.
- Note: the 3 `*.test.sh` suites are **not** run by `node --test` — this is exactly finding **F12**.

## The 12 specs (severity from the audit · proposed version target)

| # | Finding | Sev | Spec | Target |
|---|---------|-----|------|--------|
| F01 | Scope guard blind to the Bash write path | HIGH | [2026-06-25-F01-bash-scope-gap-design.md](../../docs/specs/2026-06-25-F01-bash-scope-gap-design.md) | v0.6.0 |
| F02 | Soft-failed predecessor unblocks dependents | HIGH | [2026-06-25-F02-scheduler-succeeded-gate-design.md](../../docs/specs/2026-06-25-F02-scheduler-succeeded-gate-design.md) | v0.5.1 |
| F03 | Auditor baseline conflation / no diff path | HIGH | [2026-06-25-F03-auditor-diff-artifact-design.md](../../docs/specs/2026-06-25-F03-auditor-diff-artifact-design.md) | v0.6.0 |
| F04 | Auditor told to verify "PASS" it can't run | MED | [2026-06-25-F04-auditor-anticheat-claim-design.md](../../docs/specs/2026-06-25-F04-auditor-anticheat-claim-design.md) | v0.5.1 |
| F05 | Servitor memory admission undisciplined | MED | [2026-06-25-F05-servitor-memory-admission-design.md](../../docs/specs/2026-06-25-F05-servitor-memory-admission-design.md) | v0.5.1 |
| F06 | Default audit breadth = single lens | MED | [2026-06-25-F06-default-audit-breadth-design.md](../../docs/specs/2026-06-25-F06-default-audit-breadth-design.md) | v0.6.0 |
| F07 | Mirrored *logic* (not just constants) drifts | MED | [2026-06-25-F07-mirror-logic-drift-guard-design.md](../../docs/specs/2026-06-25-F07-mirror-logic-drift-guard-design.md) | v0.5.1 |
| F08 | Dead `branch_ahead_of` helper | LOW | [2026-06-25-F08-dead-branch-ahead-of-design.md](../../docs/specs/2026-06-25-F08-dead-branch-ahead-of-design.md) | v0.5.1 |
| F09 | Ownership ledger gates create, not teardown | LOW | [2026-06-25-F09-ledger-teardown-resume-design.md](../../docs/specs/2026-06-25-F09-ledger-teardown-resume-design.md) | v0.5.1 |
| F10 | Literal `<integration-tip>` placeholder | NIT | [2026-06-25-F10-integration-tip-placeholder-design.md](../../docs/specs/2026-06-25-F10-integration-tip-placeholder-design.md) | v0.5.1 |
| F11 | Coven quorum shrinks on dropped seats | HIGH | [2026-06-25-F11-coven-quorum-integrity-design.md](../../docs/specs/2026-06-25-F11-coven-quorum-integrity-design.md) | v0.5.1 |
| F12 | Single-runner gate under-covers | HIGH | [2026-06-25-F12-multi-runner-gate-design.md](../../docs/specs/2026-06-25-F12-multi-runner-gate-design.md) | v0.5.1 |

## Versioning note (open, for the planning pass)

Correctness fixes (F02, F04, F05, F07, F08, F09, F10, F11, F12) suit a **v0.5.1** patch; the behavior /
tool-surface changes (F01 servitor allowlist, F03 audit flow, F06 panel default) suit **v0.6.0**. Bundling is
deferred to plan conversion — not decided here.

## Next step (out of loop scope)

Convert each spec to an implementation plan under `docs/plans/` (then `/war` or `/red-team` as usual). The
two HIGH silent-failure fixes (F11, F02) and the anti-cheat fix (F04) are the natural first plan.
