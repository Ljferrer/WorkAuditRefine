# F03 — Auditor diff: precomputed artifact pinned to the integration branch — Design

**Status:** proposed — targets **v0.6.0** (audit-flow change). **Severity: HIGH.**
**Source:** agent-architecture-audit F3 · memory `audit-baseline-must-pin-integration-branch-not-main-checkout`,
`auditor-cannot-execute-the-tests-it-must-verify-pass` (baseline half).

## Problem — the auditor is pointed at the wrong baseline, and promised a diff it never gets

`auditPrompt` tells the auditor the baseline is *"the main repo checkout (your current working directory / the
integration base)"* ([workflow-template.js:150-151](../../skills/war/assets/workflow-template.js)). In a parallel
WAR run the main checkout is on **another run's branch** or simply **lags** the task's `integrationBranch`, so the
candidate-vs-baseline file comparison runs against the wrong tree → false scope-creep / added-test findings, or
missed real changes. Two things compound it:

- The auditor has only `Read, Grep, Glob` ([war-auditor.md:5](../../agents/war-auditor.md)) — it **cannot `git
  diff`** the correct base to self-correct.
- [war-auditor.md:14](../../agents/war-auditor.md) promises *"the diff for this task (path provided)"*, but the
  orchestrator never provides a diff path — forcing the fragile read-both-trees-and-compare fallback.

## Decisions

- **D1 — Baseline is the integration branch, never the main checkout.** The change set is
  `git diff <merge-base(integrationBranch, task.branch)>..task.branch` (three-dot semantics — what the task added
  since it branched), regenerated **each audit round** (after a fix-worker pushes).
- **D2 — The refiner produces the diff artifact (preserves the read-only auditor).** A pre-audit step run by the
  refiner (full tools, git-topology owner) writes the diff to the run ledger, e.g.
  `.claude/teams/<run-id>/diffs/<task-id>-r<round>.diff` plus a `--name-status` summary. The auditor stays purely
  `Read/Grep/Glob` — the audit's strongest property (true read-only-by-construction) is untouched.
- **D3 — Pass the artifact path into `auditPrompt`, honoring [war-auditor.md:14](../../agents/war-auditor.md).**
  The auditor reads the diff as the authoritative change set and still reads the worktree for neighbor/`deep`
  tracing context.
- **D4 — Drop the "compare against the main checkout" prose** from `auditPrompt`.
- **D5 — Cost.** +1 refiner spawn per audit round per task. Accepted; the alternative (give the auditor a git
  Bash capability) erodes read-only-by-construction.

## Solution shape

A `computeDiff` refiner step before each `auditRound` (initial + rebuttal/re-audit rounds); `auditPrompt` gains a
`diffPath`; the auditor reads the diff first, then the worktree.

## Schema & contract changes

- New small `DiffResult` returned by the diff step: `{ task_id, round, diff_path, base_sha, head_sha, files[] }`
  (document in `references/schemas.md`).
- `auditPrompt` input gains `diffPath`; `war-auditor.md` inputs already list a diff path — make it real.
- `AuditVerdict.tests_verified` semantics clarified alongside F04.

## Affected files

`skills/war/assets/workflow-template.js` (`computeDiff` step, `auditRound`, `auditPrompt`) ·
`agents/war-auditor.md` (diff path is authoritative; cwd note) · `skills/war/references/schemas.md` (DiffResult) ·
ledger-path note in the provisioning design (`docs/specs/2026-06-25-worktree-provisioning-design.md`, teardown D9).

## Alternatives considered

- **Give the auditor `tools: ...,Bash` limited to `git diff`/`git log` via a Bash-scope hook** — simpler, fewer
  spawns, but **erodes** the clean read-only allowlist that makes the auditor trustworthy. Recorded as the main
  open alternative.
- **The worker emits its own diff** — rejected: the audited party cannot be trusted to produce the audit's
  baseline (a green-by-deletion vector).
- **Point the baseline at the `integrationBranch` worktree files** — still no line-diff, no rename detection.

## Validation criteria

- A parallel run with the main checkout on a foreign branch → the auditor's diff is still correct (pinned to the
  `integrationBranch` merge-base).
- Renames/deletes appear in the diff; a fix-worker round N+1 regenerates a fresh diff; the auditor never reads the
  main checkout.

## Open decisions

1. **Three-dot vs two-dot** diff (recommend three-dot / merge-base).
2. **Diff artifact retention** — tie cleanup to teardown (provisioning D9) vs keep-on-escalation for inspection.
3. **Producer mechanism** — refiner-produced artifact (recommend) vs narrow-git-Bash auditor.
