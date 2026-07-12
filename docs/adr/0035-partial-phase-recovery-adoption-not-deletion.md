# Partial-phase recovery is adoption plus re-dispatch, never deletion plus re-run

**Status:** accepted (design ratified 2026-07-11; implemented by the spec and plan below)

A `held:escalation` partial phase strands real work. Observed live (campaign `2026-07-08-memory-frictions`,
plan 9, run `wf_20ff5e9e-6a4`): 6 of 7 tasks merged to `integration/<slug>/phase-1`, one task escalated,
the gate-audit HARD-held, `landResult` null. Recovery today is either whole-run replay or hand-editing git
refs, and the two paths that *could* clear the blockage both push against ADR 0008: the non-empty
integration branch carrying 6 real commits hits `cmd_ensure_integration`'s foreign-branch `EX_FOREIGN` die
(the die even names a `record-as-owned` verb that did not exist —
[[provision-nonidempotent-orphan-integration-branch-blocks-relaunch]]), and the empty-orphan reclaim's proof
read a `git log` failure as "proven empty," so it could delete a branch with unique commits
([[reclaim-empty-orphan-proof-swallows-git-log-error-as-empty]]). The full six-gap surface — orphan
adoption, single-task re-dispatch, plan-vs-implementation defect signalling, a missing local base ref, stale
remote task branches, and a manual-land follower assertion — is in
[the design spec](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md) §1–§4 and
[the plan](../plans/2026-07-11-partial-phase-recovery-and-branch-hygiene.md); this ADR records the doctrine
those mechanics share.

## Decision

**A held partial phase is recovered by *adopting* the work already on the integration branch and
re-dispatching only the unfinished task against it — never by deleting the branch and re-running the phase.
Every step reads git as truth, every destructive act is opt-in and proves its own preconditions before
touching a ref, and the plan-vs-implementation defect distinction is escalation-record metadata that never
becomes a land or escalation enum member.**

1. **The adopted integration tip is the recovery relaunch's frozen phase base.** A non-empty partial-phase
   integration branch is *adopted*, not deleted: the `record-as-owned` subcommand repairs the owned-file
   ledger toward git (proof-carrying — lineage-checked, moves no ref) so relaunch takes
   `cmd_ensure_integration`'s existing owned-reuse path, and that adopted tip is the frozen base every
   re-dispatched worktree is cut from. This is ADR 0021's "recovery relaunch is a fresh run over reused git
   state," with the reused state now being a partial phase's real merged commits rather than an empty or
   fully-landed branch. (§4.1)

2. **The merged-set is derived from git ancestry — never labels or the ledger — and is derived by the
   provision-barrier refiner, not the engine.** A task whose branch tip is already an ancestor of the
   adopted integration tip is recorded `merged` (terminal, task-level status — never `landed`, which is
   phase-level) and never re-dispatched; only non-ancestor or absent-branch tasks run. The ancestry checks
   are shell, and the Workflow sandbox has no shell or filesystem — so the **existing** provision-barrier
   refiner dispatch runs them and returns the merged set (a `preMerged` list on its env-outcome); the engine
   only routes that result. Git is the source of truth (ADR 0008); issue labels and `ledger.json` are
   reconciled toward the derived answer by the Lead, never the reverse. (§4.2)

3. **Only the unfinished task is re-dispatched, and it earns the same evidence as a first run.** The
   re-dispatched task gets the full Work+Audit loop, the serial Refine merge, and the post-merge gate-audit
   (`execution-evidence` lens) at the newly integrated tip, with the endState block riding that pass so every
   claimed condition is verified at the tip. Recovery is a shorter path, never a path around the gate. (§4.2)

4. **Destructive reconciliation is always flag-gated, proves its own preconditions mechanically, fails loud
   on command error, and prints its own reverse path.** The two deletions — `--reclaim-empty-orphan` (an
   empty orphan) and `--reclaim-stale-remote` (a stale prior-attempt remote branch) — are opt-in flags the
   Lead supplies only on a sanctioned recovery relaunch. Each proves its preconditions in-script before
   acting: the empty-orphan delete proves emptiness **and** origin-absence; the stale-remote delete proves
   the branch matches the `war/<slug>/pN-tK` **namespace** glob, the **local ref is absent**, and the remote
   tip is **not an ancestor** of the frozen tip (integrated work is mechanically undeletable). Every proof
   captures its git exit status separately and dies on a non-zero rc — a git error is never read as "empty"
   or "absent" ([[reclaim-empty-orphan-proof-swallows-git-log-error-as-empty]], the #728 hazard). Because the
   stale-remote delete removes unmerged commits by design, both its default fail-loud die and its reclaim
   warn print the reverse path `git push origin <sha>:refs/heads/<branch>` — reversible until remote GC. **No
   path force-pushes any ref**; stale-remote reconciliation is `git push origin --delete` plus a later plain
   push (the recorded #650 Lead reconciliation, now tooled). (§4.4, §4.5)

5. **`defectClass` is escalation-record metadata, orthogonal to `reason`, and never a land or escalation enum
   member.** A `PLAN-DEFECT:` sentinel the worker prefixes onto `blocked_reason` sets `defectClass: 'plan'`
   on the escalation record, distinguishing a plan/spec defect (routes to `/red-team` plan amendment) from an
   implementation defect (routes to fix-rounds / escalation-completion); it rides the machine-readable
   `handoff` block. It never enters `decideLand`, `HARD_ESCALATION_REASONS`, or `KNOWN_LAND_DECISIONS`, and a
   negative drift-guard in `land-decision.test.mjs` pins non-membership against **both** the canonical
   exports and the hand-mirrored inline copies in `workflow-template.js` (ADR 0005). Absence is not
   `'implementation'` — the field is only ever set to `'plan'`, keeping prior-run records shape-compatible.
   (§4.3)

6. **No amendment to ADR 0005 or ADR 0008 is needed — this doctrine operates strictly inside both.** Nothing
   here adds a `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` member or a new task/phase status (ADR 0005:
   the re-dispatch path classifies already-integrated tasks with the existing terminal `merged`); every
   reconciliation moves records toward git and never destroys unadjudicated work (ADR 0008). The doctrine is
   a composition of the existing invariants, not a change to them.

## Considered options

- **Deletion plus re-run — widen `--reclaim-empty-orphan` to non-empty branches, or clean up remote branches
  unconditionally at restart (rejected).** Destroys the merged work a partial phase already produced — the
  exact ADR 0008 violation the adoption path exists to avoid. Adoption reuses the commits; re-run throws them
  away and pays for the audit evidence twice.
- **Deriving the merged-set from issue labels or `ledger.json` (rejected).** Trusts Lead bookkeeping over
  git — the precise failure ADR 0008 exists to prevent. Git ancestry at the moment of provisioning is the
  only authoritative source; labels and the ledger are the lagging views reconciled *toward* it.
- **A Lead-computed re-dispatch task list, or a new standalone re-dispatch CLI/mode (rejected).** The first
  trusts a hand-assembled DAG over git — and a hand-filtered single-task DAG dep-blocks when the escalated
  task depends on a merged sibling absent from the list; the second duplicates the scheduler. The relaunch
  passes the **full original phase DAG** and lets the barrier-derived skip filter it — git > Lead bookkeeping.
- **A new dedicated dispatch (or `dispatchKind`) to run the ancestry checks (rejected).** A second
  Provision-phase dispatch shape for zero isolation gain; the existing provision-barrier refiner already has
  the shell and the frozen tip, so the derivation is a new optional return field, not a new dispatch.
- **A `held:plan-defect` land decision, or a new `HARD_ESCALATION_REASONS` member (rejected).** Enum
  discipline (ADR 0005): the classification is metadata orthogonal to the escalation `reason`, exactly as a
  finding's `disposition` is orthogonal to its severity. It rides the record; it never gates the land.
- **Swallowing a git error into empty/absent output — `2>/dev/null || true` on a safety proof (rejected).** A
  proof that reads a command *failure* as a passing precondition can delete work (the #728 defect). Every
  proof captures its rc separately and dies loud.
- **A stale-remote force-push, or widening `FORCE_WITH_LEASE_RULE` (rejected).** The no-force-push invariant
  holds without exception: the one carve-out stays byte-identical and un-widened, and stale-remote
  reconciliation is delete-then-plain-push, never a force.

## Consequences

- **A held partial phase is cheaply recoverable.** The Lead adopts the branch, relaunches with the full
  original DAG plus `args.recovery`, and the engine skips the merged tasks and re-dispatches the one — no
  whole-run replay, no hand-edited refs, no lost audit evidence.
- **Records always reconcile toward git, and an unexplained commit halts.** The derivation reads git; labels
  and the ledger follow. Mapping every `<base>..<integration>` commit to a merged task is the Lead's standing
  duty at adoption time, and an unexplained commit halts the recovery rather than being silently adopted (ADR
  0008 resume doctrine; the runbook is the teeth).
- **Every destructive act is reversible and adjudicated.** The default on a stale prior attempt is a
  fail-loud die whose diagnostic forces the adopt-vs-discard decision first; the sanctioned delete prints its
  restore command. Nothing fires unattended.
- **The `defectClass` non-membership is a standing regression risk, pinned by a test.** The most likely
  future drift is someone "completing" the feature into the reason enum; the negative drift-guard across both
  the canonical export and the inline mirror is load-bearing, not decorative.
- **Stale-remote failure is a per-task classification, not a phase halt** (operator-ratified 2026-07-11). A
  stale prior-attempt remote surfaces at the barrier as a per-task `env-blocked` outcome — siblings proceed,
  dependents follow the existing `dep-failed` semantics — so ADR 0021's all-or-nothing topology barrier is
  untouched: all cuttable worktrees are still cut from the one frozen base, and stale-remote is env
  classification, the same family as a `run.provision` failure.
- **Live-fire recovery is a deferred backstop.** The unit and shell tests prove each mechanic in fixture
  repos and prove the engine path against a mocked barrier return, but the end-to-end Lead-driven runbook
  over a genuine `held:escalation` cannot be synthesized inside a task gate; it is exercised at the first
  real recovery after this lands (spec §8 / plan backstops).

## References

- Design spec: [`docs/specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md`](../specs/2026-07-11-partial-phase-recovery-and-branch-hygiene-design.md)
  §7 (this ADR), §3 (design tree), §4 (mechanics), §6 (domain terms), §8 (open risks), §10 (criteria).
- Plan: [`docs/plans/2026-07-11-partial-phase-recovery-and-branch-hygiene.md`](../plans/2026-07-11-partial-phase-recovery-and-branch-hygiene.md).
- [ADR-0034 — engine ingest guards and provision exit codes](0034-engine-ingest-guards-and-provision-exit-codes.md) —
  the opt-in, two-proof, fail-loud **empty-orphan reclaim** this ADR's adoption path is the non-empty
  counterpart to; the exit-code catalogue the new stale-remote code joins.
- [ADR-0021 — run-lifecycle provision contract](0021-run-lifecycle-provision-contract.md) — recovery
  relaunches are fresh runs over reused git state; its all-or-nothing topology barrier the stale-remote
  per-task classification leaves intact.
- [ADR-0008 — git is the resume source of truth](0008-git-is-the-resume-source-of-truth.md) — the
  repair-toward-git, never-destroy-work rule every proof and every reconciliation honors.
- [ADR-0005 — a dead phase halts the DAG](0005-dead-phase-halts-the-dag.md) — the `HARD_ESCALATION_REASONS`
  / `KNOWN_LAND_DECISIONS` enum sets `defectClass` is deliberately kept out of.
- [ADR-0003 — plan-namespaced branches](0003-plan-namespaced-branches.md) — the foreign/unowned-ref
  fail-loud default the adopt and reclaim flags opt out of only behind their proofs.
