# Run-lifecycle contract: provision is refiner mode three; env-blocked requires execution evidence; recovery relaunches are fresh runs over reused git state

**Status:** accepted (design ratified 2026-07-08; implementation tracked by the spec and plan below)

WAR's run lifecycle fails at three seams — dispatch, relaunch, launch — and three incidents showed each
failing in the **wrong class**. In #582 a refiner **refused** a provision dispatch (its standing card,
`agents/war-refiner.md`, named only `merge-task` and `land-phase`, and the barrier/polish dispatches
demanded a `MergeResult` whose `mode` enum cannot express provisioning); the Workflow then **fabricated**
an `env-blocked` outcome from `provisionList[0]` with a `'provision-run returned no result'` string —
reporting a systemic contract bug as an environment gap with invented evidence. In #583 a same-run
cross-phase relaunch collided with a stale task worktree (the derived path was phase-blind,
`<runId>/<taskId>`), and — with no *sanctioned* retry path for an escalated task or a dead phase —
operators improvised "phase 4b" branch surgery against a guard that (correctly) rejects non-numeric phase
ids. In #586 a launch missing a top-level derivation arg died per-task, deep in the roster loop, instead
of once at entry naming what was absent. This records the contract that fixes all three. Full mechanics:
[the design spec](../specs/2026-07-08-war-run-lifecycle-robustness-design.md) and
[the plan](../plans/2026-07-08-war-run-lifecycle-robustness.md).

## Decision

**The run lifecycle fails in the right class at each seam. Provisioning is a first-class refiner
dispatch mode; `env-blocked` is accepted only on execution evidence; and a retry — of a task or a whole
phase — is a fresh run over reused git state, never an in-place journal replay or a branch-namespace
improvisation.**

### (A) Provision is the refiner's third dispatch mode

`agents/war-refiner.md` gains a `provision` mode alongside `merge-task` and `land-phase`, in the same
commit as any dispatched-prompt change (the both-surfaces rule — the standing card and the string-built
prompts in `skills/war/assets/workflow-template.js` drift silently otherwise). The mode covers all three
dispatch flavors — the phase git-topology barrier (`provision:phase-<id>`), the per-task provision-run
(`provision-run:<taskId>`), and the phase-close polish worktree (`polish-worktree:phase-<id>`) — states
that provisioning **is** a refiner duty ([ADR 0001](0001-explicitly-managed-worktrees.md)), and instructs:
**a provision dispatch is never out-of-mode — do not decline it.** All three return the **env-outcome**
shape (`{ ok, taskId?, failedCommand?, exitCode?, stderrTail?, provisionSource? }`), never a MergeResult;
the barrier and polish dispatches switch their `schema:` from `MERGE_RESULT` to `ENV_OUTCOME` and **bind**
their results (both were discarded). Rejected: rerouting provisioning to another agent type (contradicts
ADR 0001 and the refiner-owned-worktree doctrine); a bare "you may also receive…" note that leaves the
return shape unspecified — the half that caused the refusal.

### (C) `env-blocked` is evidence-gated; everything else is a workflow error

In `provisionStep`, an `ok:false` provision result classifies as the soft `env-blocked` escalation
**only when it carries execution evidence**: a `failedCommand` that trim-matches one of the dispatched
`run.provision` steps (exact array membership, never substring) **and** a numeric non-zero `exitCode` (an
`ok:false` with `exitCode: 0` is incoherent). Anything else — a missing result, a refusal, a
foreign/absent `failedCommand`, or the incoherent exit-0 — **throws**; the existing catch routes it to
`held:workflow-error`. The `provisionList[0]` / `'provision-run returned no result'` fabrication is
**deleted**. Genuine failures keep today's soft path byte-for-byte (reason `env-blocked`, worker never
spawned, worktree kept, siblings proceed, 0 fix rounds). The barrier `!ok` throws the same way — no git
topology means nothing in the phase can run, so a hard stop is correct with or without evidence (the die
text, including a foreign-branch exit 3, travels in `stderrTail`). The polish `!ok` **fails open** — log
+ drain the phase-close queue to `follow-up`, sweep skipped, `polishStatus: 'skipped'`, mirroring the
invalid-roster arm; never a hold. The accepted residual: the gate cannot catch a refiner that *echoes* a
plausible `failedCommand`; the standing-card fix (A) removes the incentive to refuse, and the prompt's
new verbatim-`failedCommand` clause is the mitigation. Rejected: a new soft escalation reason for refusals
(widens the escalation vocabulary for a case A makes rare, and mislabels a systemic bug as a per-task
outcome). No `MERGE_RESULT` mode/status widening; [ADR 0005](0005-dead-phase-halts-the-dag.md)'s enum sets
(`HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`) and `land-decision.mjs` are **untouched**.

### (G) A recovery relaunch is a fresh run over reused git state

The sanctioned retry for an escalated/`env-blocked` task or a dead phase is a **documented Lead/operator
playbook, not a new mechanism**: launch a **fresh Workflow run** (new `runId`) with the **same `planSlug`
and the same numeric `phase.id`**, and **owned-file continuity** — pass the prior run's `--owned-file`
ledger (or append the `integration/<slug>/phase-<N>` ref into the new run's owned-file) so
`cmd_ensure_integration` **reuses** the owned integration branch (already carrying landed sibling merges)
instead of dying foreign (exit 3). Everything else composes from existing semantics
([ADR 0008](0008-git-is-the-resume-source-of-truth.md)): the fresh run's phase-scoped worktree checks the
existing task branch out **as-is with its kept commits** (fix forward per the recorded findings, seeded
into the retry `planSlice` — **no `reset`, no `--force`**); the land path is the normal push-first CAS.
There are **two entry points** — a **single-task retry** (one-task DAG) and a **whole-phase relaunch**
(DAG = the phase's unmerged tasks, verified against git per the reconciliation pre-flight) — so every hold
the new hard-stop routing can produce has a documented exit. It is **never** `resumeFromRunId`, which
replays the same run's off-ladder journal (the cached escalation); `resumeFromRunId` stays
`held:phase-incomplete`-only. Rejected: making `resumeFromRunId` retry escalations (contradicts the
off-ladder-journal doctrine); automating relaunch in the template (the Lead owns run lifecycle by design).

### (E, kept) No auto-heal re-point of a mismatched worktree

With the phase-scoped keying (D, below), a same-run cross-phase relaunch derives a **fresh** worktree path
and checks the existing branch out there — the collision class an auto-heal re-point would serve is gone.
The `provision-worktrees.sh` exit-6 mismatch die stays as the fail-loud backstop for residual
hand-mangled states; the `ponytail:` clean-tree re-attach comment in `cmd_ensure_worktree` stays. **No
`provision-worktrees.sh` change.**

### (F, kept) Numeric-only phase ids

`cmd_ensure_integration`/`cmd_teardown_phase` keep rejecting non-numeric `<N>`. The "phase 4b"
improvisation existed only because no sanctioned retry path did (G); the recovery relaunch reuses the same
numeric `phase.id` and obsoletes the workaround. Rejected: widening `<N>` to slug-safe tokens — it
multiplies the branch-namespace shapes (`integration/<slug>/phase-4b`, teardown regexes, ledger keys) to
serve a workaround G removes.

### (D) Worktree keying + the run-scoped-vs-phase-scoped naming convention

The derived task worktree path is phase-scoped: `<worktreeRoot>/<runId>/p<ph.id>-<t.id>`, mirroring the
`taskBranch` convention (`war/<planSlug>/p<ph.id>-<t.id>`); the polish worktree moves the same way,
`<worktreeRoot>/<runId>/p<ph.id>-polish`. This renames the polish worktree directory from the old
`_polish` literal to `p<N>-polish` (its branch `war/<slug>/p<N>-polish` was already phase-scoped, so
teardown — which selects by branch pattern, never path basename — is unaffected). The naming convention
this establishes, the sentence future worktree additions read:

> **Underscore-prefixed run-dir siblings (`_refinery`) are run-scoped / cross-phase; `p<N>-`-prefixed dirs
> are phase-scoped.**

`_refinery` stays run-scoped **by design** — `ensure-refinery-worktree` has clean-tree re-attach heals for
crossing phases; task and polish worktrees have no such heal, hence they are phase-scoped so a cross-phase
relaunch never collides. **[ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md) is not edited**
— it is historical (it records the sweep's design at authoring time); historical ADRs are superseded, never
rewritten, and this ADR records the rename.

### (H) Launch-args entry validation

One conditional check at args parse — inside the existing `try{}` so the catch produces
`held:workflow-error` with git untouched, before the roster loop and the Provision barrier — enumerates
the absent members of `{ planSlug, runId, worktreeRoot }` **and** a missing `phase.id`, and throws once
naming both classes distinctly (the trio-keys list; and `phase.id is missing` — the silent `pundefined-`
derivation class). Skipped when every task carries an explicit `branch`+`worktree` (the hand-patched-DAG
escape hatch). The per-task derivation throw stays as a belt-and-suspenders backstop. The `phase.id`
widening is operator-ratified beyond #586's trio-only ask.

## Relationship to prior ADRs

- **Extends [ADR 0001](0001-explicitly-managed-worktrees.md)** — provisioning is refiner-owned; this names
  the dispatch mode that owns it on the standing surface.
- **Extends [ADR 0008](0008-git-is-the-resume-source-of-truth.md)** — the recovery relaunch composes
  git-first reuse; merged-ness is verified against git, records are never trusted over the branch.
- **Leaves [ADR 0005](0005-dead-phase-halts-the-dag.md) untouched** — no enum, status, or
  `land-decision.mjs` change; `env-blocked` reuses the existing soft-escalation reason.
- **[ADR 0012](0012-intra-phase-visibility-and-phase-close-sweep.md) is historical, not edited** — the
  `_polish` → `p<N>-polish` rename is recorded here, not back-patched into 0012.

## Considered options

- **One ADR versus per-decision records (chosen: one).** The three seams share one lifecycle contract and
  one commit boundary; recording them together keeps the class-discipline rationale in one place.
- **A soft escalation reason for refusals (rejected).** It would widen the escalation vocabulary for a case
  the standing-card fix makes rare and mislabel a systemic contract bug as a per-task outcome — the exact
  wrong-class failure #582 was.
- **Template-automated relaunch (rejected, deferred to prose).** The Lead owns run lifecycle; a playbook
  subsection composes existing git-first reuse without new machinery. A live relaunch drill is the named
  deferred backstop.
- **Auto-heal re-point of a mismatched worktree (rejected).** Phase-scoped keying removes the collision
  class; the exit-6 die stays the backstop for residual hand-mangled states.
