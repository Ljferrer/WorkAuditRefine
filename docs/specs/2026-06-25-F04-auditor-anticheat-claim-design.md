# F04 — Make the auditor's anti-cheat claim match its capability — Design

**Status:** proposed — targets **v0.5.1** (prompt/contract). **Severity: MEDIUM.**
**Source:** agent-architecture-audit F4 · memory `auditor-cannot-execute-the-tests-it-must-verify-pass`.

## Problem — the anti-cheat seat is told to do something it structurally cannot

[war-auditor.md:23](../../agents/war-auditor.md) and
[workflow-template.js:152](../../skills/war/assets/workflow-template.js) demand the auditor confirm the mapped
acceptance-criteria tests *"EXIST and PASS"*. The auditor has only `Read, Grep, Glob` — it **cannot run tests**,
so "PASS" is asserted without execution (hallucinated execution in the one seat meant to catch cheating). The
genuine, code-executed gate is the **refiner's** at merge/land
([:271](../../skills/war/assets/workflow-template.js), [:298](../../skills/war/assets/workflow-template.js)) — a
real safety net — but a green-by-deletion slips the gate (a deleted test simply isn't run), so the auditor's
**read** is the sole defense and the "and PASS" clause overstates it.

## Decisions

- **D1 — Reword to capability.** Replace "EXIST and PASS" with: *"verify the mapped tests EXIST in the diff and
  are not deleted, skipped, weakened, or made trivially true (xfail / early-return / `assert True` / commented-out
  body). The refiner re-runs the gate at merge — you verify the tests are real, not that they pass."* This is
  fully achievable read-only.
- **D2 — Feed the auditor the worker's claimed result.** Thread `WorkerResult.tests` (counts + command) into
  `auditPrompt` so the auditor can cross-check the worker's claim against the diff (e.g. "claims N passing" but the
  test file shrank → flag). Inspecting a claim ≠ executing it; stays read-only.
- **D3 — Name the pass/fail authority.** Document that the **gate run at the refiner** — not the auditor — is the
  pass/fail authority; the auditor owns *test integrity*, the refiner owns *test execution*.
- **D4 — Compose with F03.** The precomputed diff artifact makes "is a test weakened/deleted" mechanically
  checkable line-by-line.

## Solution shape

Prompt/agent-doc reword + thread the worker's `tests` summary into `auditPrompt`; no new tooling.

## Schema & contract changes

- `AuditVerdict.tests_verified` documented as "existence + integrity verified," **not** "executed."
- `auditPrompt` gains the worker's `tests` summary input.

## Affected files

`agents/war-auditor.md` (reword §Always verify… and §Verdict) · `skills/war/assets/workflow-template.js`
(`auditPrompt`) · `skills/war/references/schemas.md` (`tests_verified` semantics).

## Alternatives considered

- **Give the auditor Bash to run the gate** — rejected: breaks read-only-by-construction and duplicates the
  refiner gate.
- **Leave the wording** — rejected: it invites hallucinated execution in the anti-cheat seat.

## Validation criteria

- A green-by-deletion diff (test removed, gate still green) → the auditor flags the missing/weakened test from the
  diff and returns `request_changes`.
- The auditor verdict never claims to have executed tests; worker-claimed counts are cross-checked against the diff.

## Open decisions

1. Whether to also pass the **refiner's gate output** to a *post-merge* auditor view, or keep audit strictly
   pre-merge (recommend: keep pre-merge; the refiner gate is the execution authority).
