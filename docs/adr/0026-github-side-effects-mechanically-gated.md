# WAR's GitHub side-effects are mechanically gated, not doctrinal

**Status:** accepted (design ratified 2026-07-08; implemented by the spec and plan below)

WAR's entire GitHub surface — issue filing, the active `gh` account, and epic close-on-done — was
**prose-governed** and drifted silently from run state, because none was a checkable gate. Three
recorded frictions are one class: **a side-effect that only a sentence in a `SKILL.md` promised, and
nothing verified.** Issue filing (`war-execution-must-file-issues`, user-confirmed) was doctrine an
agent rationalized skipping entirely by conflating it with an unrelated plan line
(`No GitHub issue filed`, which only waives pre-filing an *audit finding*) — nothing asserted the
epics/sub-issues the ledger claims actually exist. The `gh` active account (the account-flip friction,
spec §1) defaults active to a non-collaborator and can silently revert mid-run
(observed: correct for phases 1–4, a non-collaborator by phase 5); a whole batch of `gh issue
close/edit` then fails, and because plain SSH `git push` still succeeds the failure surfaces only
**post-push**, easy to misdiagnose. A done epic (`close-epic-when-status-done`) was set `status:done`
but left open, because labelling and closing were decoupled prose. Full mechanics:
[the design spec](../specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md)
and [the plan](../plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md).

## Decision

**Every WAR GitHub write that carried a run-state invariant becomes a mechanism the Lead invokes, not
a sentence the Lead is trusted to honor. The verification reconciles toward live `gh`/git, never a
ledger claim alone, and no confined agent gains a `gh` verb.** Three mechanisms:

### (A) A `gh` auth preflight guards every write batch — `skills/_shared/gh-preflight.sh`

`gh-preflight.sh <expected-user>` asserts the active `gh` account equals the run's `overrides.ghUser`
before a write batch runs. An empty/unset expected user ⇒ **exit 0, no `gh` invocation** (a
single-account repo and the shipped plugin are untouched). On drift it runs
`gh auth switch --hostname github.com --user <expected>` and **re-verifies** via
`gh api user --jq .login` (the authoritative check — the `gh auth status` "Active account" parse is
version-fragile, so a parse miss is a tooling error, exit non-zero, never a silent `0`). A still-mismatched
account ⇒ **fail loud, non-zero, printing both the wanted and actual login** — the batch never proceeds
into silent post-push write failures. This is the fail-loud fix for the "surfaces only after push"
misdiagnosis. The expected handle lives **only** in the operator's local `.claude/war/config.json`; the
shipped default is `null` (**C1** — no personal handle in any committed file, a redaction-lint hazard).
Run at the head of **every** gh write batch — the standing Lead instruction, not a once-at-session-start
check.

### (B) The issue-lifecycle floor keys on the ledger, orthogonal to plan prose — `assert-issues-filed.sh`

The Lead-invoked floor `assert-issues-filed.sh assert <ledger> <phase>` asserts the phase's
`epic_issue` and every `tasks[].issue` recorded in the ledger are **non-null and exist on live `gh`**
(`gh issue view`), running at the Checkpoint before the DAG advances. It mirrors the
`assert-*-in-diff.sh` exit contract exactly (**C5**): `0` verified, `1` the named route
(`issues-missing` / `done-but-open`), `2` a gh/ledger/ref/tooling error that **never collapses into
`1`**. The floor keys **only on the ledger's own fields** — it never reads plan prose, so the exact
`No GitHub issue filed` audit-finding rationalization can never be conflated with issue filing again
(**C4** — reconcile the ledger toward `gh`, never trust the ledger alone).

### (C) Close-on-done is one atomic action; `status:done` cannot outlive an open epic

`assert-issues-filed.sh --close-epic <n> --sha <sha>` performs, in one call,
`gh issue edit --add-label status:done --remove-label status:in-progress` **and**
`gh issue close --reason completed --comment "<phase> landed @ <sha>"` (preflight first). The coupling's
teeth are the floor's **landed-phase assertion**: on a phase being landed it additionally requires the
epic `state == CLOSED` and label `status:done`, else exit `1` (`done-but-open`) — so a labelled-but-open
epic halts the checkpoint and `status:done` can never again survive an open epic.

### (D) Everything is Lead-side — no confined-agent capability widening

The preflight and the floor are **Lead-invoked checks**; neither grants the refiner, auditor, worker,
or servitor a `gh` verb (**C2**, [ADR 0002](0002-scope-by-agent-type.md)). All `gh` writes stay where
they already were — Lead-side, where Bash is fail-open advisory. A PreToolUse hook intercepting every
`gh` call was considered and rejected as over-built: preflight-before-batch plus the checkpoint floor
cover the observed failures with far less surface (revisit only if a batch bypasses the preflight in
practice).

**Accepted limitation (`ponytail:`).** The floor asserts the ledger's *recorded* issue numbers exist;
a task the Lead never recorded in the ledger at all is invisible to it. This is deliberate — the floor
guards the recorded-but-unfiled and done-but-open cases (the observed failures), not a fully absent
bookkeeping intent, for which no run-`ledger.json` validator exists in this repo. The residual runner
is **human ledger review at Decompose** (the Lead reads the ledger's `tasks[]` against the plan's task
list before dispatch), not a mechanical gate. No claim of mechanical validation.

## Relationship to prior ADRs

- **Operates within [ADR 0002](0002-scope-by-agent-type.md) — capability-first confinement is
  unchanged.** The preflight and floor are Lead-side; no confined agent gains a `gh` verb (C2). This
  ADR adds mechanisms *within* the Lead's existing capability, never widens another agent's.
- **Extends [ADR 0008](0008-git-is-the-resume-source-of-truth.md) onto the GitHub surface.** Issue
  existence and closure are verified against live `gh`/git, never a ledger claim alone (C4) — the
  ledger's `epic_issue`/`issue` fields are reconciled *toward* `gh`, the same git-is-truth direction
  ADR 0008 fixes for the resume path.
- **Joins the [ADR 0006](0006-deterministic-test-floor.md) floor family.** `assert-issues-filed.sh`
  mirrors the `assert-*-in-diff.sh` `0/1/2` exit contract exactly (C5); a `2` (tooling/ref error) never
  collapses into the `1` named route.
- Historical ADRs are superseded, never edited.

## Considered options

- **One ADR versus three per-friction records (chosen: one).** Issue filing, gh auth, and close-on-done
  are one policy — a GitHub side-effect that was prose and is now a mechanism — seen through three
  lenses; recording the discipline once keeps the "why key on the ledger, why fail loud, why Lead-side"
  rationale in one place.
- **A PreToolUse hook gating every `gh` call (rejected — over-built).** Gating each `gh issue`/`gh pr`
  invocation was considered and rejected: gh writes are Lead-side where Bash is fail-open advisory, and
  the preflight-before-batch idiom plus the checkpoint floor cover the observed failures with far less
  surface. Revisit only if a batch bypasses the preflight in practice.
- **Trust the ledger's recorded issue numbers as proof of filing (rejected — the weakest authority).**
  The ledger is local, uncommitted, written by no code (ADR 0008); the floor confirms each recorded
  number against live `gh`, reconciling toward git.
- **Parse `gh auth status` "Active account" as authoritative (rejected — version-fragile).** That line
  format is a `gh` CLI surface that changes across versions; `gh api user --jq .login` is the
  authoritative post-switch verify, and a parse miss is a `2`, never a silent `0`.

## Consequences

- Issue filing becomes a **hard gate at the Checkpoint** keyed on the ledger — an unfiled recorded
  epic/task halts the DAG advance instead of shipping a run whose board misrepresents its state.
- The `gh` account is re-asserted before every write batch; a mid-run flip is caught and switched (or
  fails loud), never surfacing as a misdiagnosed post-push permission error.
- `status:done` and `gh issue close` are **one atomic action** (`--close-epic`); the floor's
  landed-phase assertion makes a done-but-open epic a checkpoint failure, so the two can never decouple
  again.
- A new `overrides.ghUser` knob (string\|null, default `null`) ships generic — the personal handle
  stays in the operator's local config; no committed file carries it (C1).
- Named residual: a task never recorded in the ledger at all is invisible to the floor (see (D)) — the
  forcing function is human ledger review at Decompose, not a mechanical validator.

## References

- Design spec:
  [`docs/specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md`](../specs/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization-design.md)
  — §4.1–§4.3 (preflight, floor, close-on-done), §10 validation criteria 1–8.
- Implementation plan:
  [`docs/plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md`](../plans/2026-07-08-github-issue-lifecycle-and-run-bookkeeping-mechanization.md).
- [ADR 0002](0002-scope-by-agent-type.md) — capability-first confinement the preflight/floor operate
  within (C2, Lead-side only).
- [ADR 0008](0008-git-is-the-resume-source-of-truth.md) — git-is-truth, extended here onto issue
  existence/closure (C4).
- [ADR 0006](0006-deterministic-test-floor.md) — the floor family whose `0/1/2` exit contract
  `assert-issues-filed.sh` mirrors (C5).
- Memory lessons / frictions (the originating cluster, enumerated in spec §1):
  [[war-execution-must-file-issues]], the `gh` account-flip friction (spec §1),
  [[close-epic-when-status-done]].
