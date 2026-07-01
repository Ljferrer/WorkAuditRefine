# WAR — Context

The ubiquitous language of WAR (Work · Audit · Refine), a Claude-native orchestration of
worker/auditor/refiner agents over git worktrees and GitHub issues. This file is a glossary
only — no implementation detail.

## Language

### Worktree provisioning

**Provisioning**:
The owned lifecycle of the git topology a WAR run executes in: cutting the integration branch,
creating each task's worktree on the correct base, scoping it, reusing it for fixes, and tearing
it down (or preserving it on escalation).
_Avoid_: setup, bootstrapping, worktree management.

**Git-topology owner**:
The single role responsible for every mutation of *shared* git state — branches and worktree
directories — **in whatever repo the phase targets**. In WAR this is the refiner (the Refinery); for a
**submodule phase** the same role owns the submodule repo's shared state too (its integration branch, and
the land — a CAS push for a WAR-owned submodule, or a branch-push + PR under PR-and-hold).
_Avoid_: provisioner (no separate role exists), branch manager; assuming the owner only ever touches the
superproject.

**Container** / **Contents**:
The boundary between what the git-topology owner controls and what a worker controls. The
*container* is the branch and worktree directory (refiner-owned); the *contents* are the files
and commits inside a worktree (worker-owned). A worker never runs `git worktree add/remove` or
touches a shared branch; the refiner never edits task code.

**Task worktree**:
The one git worktree assigned to a single task, where its worker (and any later fix-worker)
implements that task. One per task, persisting until the task lands.
_Avoid_: checkout, sandbox, workspace.

**Integration branch**:
The per-phase branch (`integration/<plan-slug>/phase-N`, plan-namespaced so concurrent runs don't
collide) cut off the working branch, from which all of that phase's task worktrees are created and
into which approved tasks are merged. Removed after the phase lands.
_Avoid_: feature branch, phase branch, staging branch.

**Frozen phase base**:
The single integration tip, captured **once** at a phase's Provision barrier, that **every** task
worktree in that phase is cut from — including tasks in later dependency waves. The wave loop never
re-cuts a worktree onto a sibling's merge; only the refiner rebases (at merge time, in the task
worktree). So within a phase, `deps`/waves order **when** a worker runs, never **what base it sees** —
all workers build on the same frozen base and cannot observe each other's in-flight code.
_Avoid_: assuming a later wave sees an earlier wave's merged code; "advancing tip" for the worker base
(only the *refiner's* merge sees the advancing tip).

**Code-boundary decomposition**:
The authoring rule for carving a plan into phases/tasks, forced by the **Frozen phase base** + serial
rebase-merge. Parallelize tasks whose **file sets are disjoint** and each **green on its own** off the
frozen base; push any **shared-file** work or **code-consumption dependency** across a **phase edge** (a
later phase cut from the prior phase's landed tip). Two same-file tasks in one phase rebase-**conflict**
at the serial merge (a hard escalation, no fix round) — intermittently, since disjoint *regions* of one
file may land by luck; a code-consuming task in the same phase can't see the symbol it needs. One task
targets exactly one repo, and a release/version bump (shared release-slot files) is its own trailing
phase. Sibling of **Repo-per-phase** (its cross-repo special case).
_Avoid_: "one task per phase" (over-serializes — the rule is disjoint-and-independent, not solo); using
intra-phase `deps` for code visibility or to dodge a same-file collision (neither works).

### Repo-derived provisioning (Part B)

**Provision list** (`run.provision`):
The ordered, pinned shell commands that take a bare worktree from checkout to **gate-ready**, derived
from the target repo's *own* declared setup. Run verbatim, in order, before the gate.
_Avoid_: setup script, bootstrap steps, install commands.

**Setup-scout**:
The read-only agent that derives the provision list from the target repo's signals, in descending
authority (explicit → CI → dev-onboarding → structural floor). Holds no ecosystem knowledge itself.
_Avoid_: detector, provisioner, bootstrapper.

**`env-blocked`**:
The task outcome when a provision step fails: the worktree is not gate-ready, the worker is **never
spawned**, and the Lead escalates with **zero FIX rounds**. Distinct from a failed gate (which means
the code is broken, not the environment).
_Avoid_: build-failed, setup-error, broken.

**Worker block**:
A worker — initial *or* fix — returning `status:'blocked'` (or dying / returning null), which
**escalates the task immediately** carrying the worker's `blocked_reason`, decided uniformly by the
`blockedReason` predicate at every worker-dispatch site.
_Avoid_: conflating it with `env-blocked` (a provision failure — the worker was never spawned) or
`audit-blocked` (the audit/fix loop exhausted `roundLimit` without unanimous approve). All three hold
the land, but a *worker block* is the worker itself reporting it cannot proceed, with a reason.

### Cross-repo tasks (submodules)

**Target repo** (task field):
The repo a task's diff lands in — the **superproject** (default) or a named **submodule**. A task
targets **exactly one** repo. A change that both edits a submodule *and* bumps the superproject's pin
to it is therefore **two** tasks, not one (an edit in the submodule + a bump in the superproject).
_Avoid_: "the repo" (which one?), conflating a task's *worktree* with its target repo.

**Repo-per-phase** (cross-repo structure):
A phase targets **exactly one** repo, so cross-repo work is a **phase→phase** edge in the existing phase
DAG, never a mix inside one phase. A submodule change is its **own phase** that lands into the submodule
repo (its integration branch, task worktrees, and land all in that repo); the dependent **superproject**
phase runs after and reads the landed/merged SHA from the **ledger** to drive its gitlink-bump task. The
serialization is intrinsic — a superproject task cannot consume new submodule code before the pin is
bumped, which cannot happen before the submodule SHA exists — so the phase boundary costs no ordering
that was not already required.
_Avoid_: a mixed-repo phase; a mid-phase cross-repo barrier; threading the SHA outside the ledger.

**Submodule task**:
A task whose target repo is a submodule — its worker implements, its auditor reviews, and its land all
operate in the **nested** repo, against that repo's own branches, not the superproject's.
_Avoid_: submodule step, nested task.

**Submodule-as-repo** (topology stance):
For the duration of its phase a submodule is driven as a **standalone repo** — its own integration branch,
its own task worktrees, its own provision list and gate, all in the nested repo; the auditor reviews
**inside** it (a real file diff, no gitlink in view). The superproject's pin is irrelevant until the later
gitlink-bump task. This is *why* the auditor-blindness failure cannot occur on a submodule task: there is
no superproject gitlink in the diff to be blind to.
_Avoid_: editing the in-place gitlink working tree; treating the submodule as a sub-area of the
superproject's worktree.

**Gitlink-bump task**:
A superproject task whose entire diff is advancing a submodule **gitlink** (the pin the superproject
records for a submodule path) to a SHA produced by a submodule task it **depends on**. Mechanical, but
a first-class task so the cross-repo SHA dependency is an explicit graph edge, not hidden in a body.
_Avoid_: "the bump" as a refiner step; pin task.

**Pin-validity** (auditor lens for gitlink diffs):
The lens that judges a submodule-**gitlink** change. A gitlink-only diff is **valid** only on a declared
**gitlink-bump task**, and only if the new SHA is (1) **reachable on the submodule remote** — pushed, so
a fresh clone/CI can resolve it (a *local-only* commit fails) — and (2) the SHA the depended-on submodule
task produced. The remote ref it is reachable from need **not** be the default branch: a submodule
legitimately pinned to a feature branch is allowed, so the bar is *reachable on the remote*, not
*merged-to-mainline*. A gitlink move on **any other** task — one no bump task declared — is a hard
**refuse**; the same lens thereby guards against accidental or invisible submodule edits.
_Avoid_: requiring the pin to track the default branch; approving a pin to a local-only SHA.

**PR-and-hold landing** (default submodule-landing authority):
WAR pushes the submodule task's *branch* and opens a **PR in the submodule repo**, then **holds** the
phase (`held:submodule-pr`) until an external actor merges it; on resume WAR reads the *actual merged
SHA* and runs the dependent gitlink-bump task. The default because it respects the submodule repo's own
review/CI and is squash/rebase-merge-correct (only the merge author knows the SHA a pin may reference).
_Avoid_: auto-merging the submodule PR; bumping the gitlink to the pre-merge branch tip.

**WAR-owned submodule** (opt-in landing authority):
A submodule the operator **declares** WAR may land on directly — WAR runs the submodule's own
integration→working CAS land (mirroring the superproject), authoring the merge commit itself, so it
knows the landed SHA immediately and the run completes straight through with no hold. For submodules
this superproject solely controls; never the default.
_Avoid_: assuming WAR owns every submodule; landing on a shared library's mainline by default.

**AFK landing confirmation**:
Because `--afk` removes the human who would merge a `held:submodule-pr`, an AFK run cannot clear that
hold. So at **launch** WAR must confirm every touched submodule is a **WAR-owned submodule** (2A);
an un-owned submodule under `--afk` is **refused up front**, never started and left to stall on a hold
nobody can clear.
_Avoid_: entering an AFK run that will deadlock on a submodule PR.

**Submodule reachability precondition** (red-team check):
A submodule WAR will land into must be **reachable by `gh`** from the run's account. A submodule on a
non-GitHub host — or one needing a different account — is **out of scope**: WAR does not land it, and
`/red-team` must **flag the unreachable submodule up front** rather than letting a run discover it at
resume. Reachability is a launch-time precondition, not a runtime surprise.
_Avoid_: starting a submodule phase whose remote `gh` cannot resolve; deferring the check to resume.

**Submodule base branch**:
The branch a submodule phase's integration branch is cut from and (under PR-and-hold) the PR targets.
Resolved by **explicit signal only**: a run-config override → the `.gitmodules` `branch` field → otherwise
**raised to the human** at launch. The remote default branch may be *offered* as a suggestion but is
**never silently adopted**. Ambiguity is escalated, not guessed — consistent with WAR's worker/auditor
"stop and escalate instead of guessing" rule.
_Avoid_: silently assuming `main`/`master`/the remote default; inferring the base mid-run.

**`held:submodule-pr`** (cross-repo hold):
The phase outcome when a submodule task has produced a reviewed PR in the submodule repo that has not
yet merged. Distinct from a dead phase (the Workflow completed) and from a content `conflict`; it is a
deliberate pause on an out-of-band merge, cleared by a **human-triggered** resume that auto-detects the
merge via `gh pr view <n> --json state,mergeCommit` against the submodule remote — taking
**`mergeCommit.oid`** (squash/rebase-correct) as the phase's landed SHA, with an operator-supplied SHA as
fallback. There is **no** background poller; the resume trigger is the human re-running `/war` after they
merge. The merged SHA must still be reachable on the submodule remote (the branch the PR targeted — not
assumed to be the default branch).
_Avoid_: treating it as a failure; resuming before the submodule PR actually merged; building a watcher.

**Undeclared submodule touch** (the fail-closed guard):
Any submodule mutation **not** routed through a declared submodule task (content) or gitlink-bump task
(pin) — an in-place gitlink edit, an accidental pin move, or a worker whose target falls under a
`.gitmodules` path without the `target repo` tag. It is **refused** wherever caught (worker block, auditor
hard-refuse, refiner push-refuse). The guard runs in two modes: **refuse-all** (increment 1, before
first-class support) and **refuse-undeclared / route-declared** (increment 2); the net survives the relax —
anything off the explicit first-class path is still refused.
_Avoid_: treating a gitlink-only diff as reviewable; letting an untagged submodule-path edit through.

### Concurrent-run isolation

**Refinery worktree**:
The one run-scoped git worktree the Refinery performs a phase's merges in. On the integration branch
for the integration-side of merge-task; detached at the working tip for the land. (The task-branch
rebase of merge-task runs in the *task* worktree, not here.) Provisioned in the Provision barrier
(`<worktreeRoot>/<runId>/_refinery`), reaped by path at phase teardown. It is the Refinery's
*container*; it exists so the Refinery never mutates the Lead's main checkout, which a second
concurrent run could share. Isolation is prompt-enforced, not hook-enforced.
_Avoid_: refiner checkout, merge sandbox.

### Phase outcomes

**Dead phase**:
A phase whose Workflow did not return a usable land decision — it failed to complete (timed out,
sandbox died, never returned), self-reported a caught exception, or returned an unrecognized result.
Categorically distinct from a phase that completed and *held* its land (`held:escalation` /
`held:nothing-merged` / `held:land-failed`). A dead phase **never advances the DAG** and its git
state is preserved for resume or inspection.
_Avoid_: failed phase, crashed phase, errored phase (each names only one of the three failure surfaces).

**`held:phase-incomplete`** (retryable dead phase):
The outcome when a phase Workflow did not run to completion. The cause is the *environment* (timeout,
sandbox death), so a bounded resume of the same run may finish it.
_Avoid_: timeout (one cause only), retry (the mechanism, not the outcome).

**`held:workflow-error`** (terminal dead phase):
The outcome when a phase Workflow completed-with-error (a broken / `null` return) or self-reported a
caught exception. The cause is the *artifact* (a script bug or bad input), so a resume cannot fix it;
the Lead halts for the human regardless of mode.
_Avoid_: crash, exception (each names one surface only).

**Retry budget**:
The single bound on every bounded-retry loop in WAR — fix-worker rounds, the land reland-CAS, and
phase-resume all share `run.roundLimit` (default 3). One knob, one mental model.
_Avoid_: separate per-loop limits, max-attempts.

### Test discipline

**Test floor**:
The deterministic guarantee that a task which *requires* a test changed at least one test file in
its diff, enforced by a tested shell assertion at merge-task. The coarse *floor* (a test exists) is
distinct from the auditor's semantic *ceiling* (it is the right test, exercises the slice, is not
weakened or skipped).
_Avoid_: test coverage, test gate (the gate runs the suite; the floor inspects the diff).

**`requiresTest`** (task field):
Whether a task must change a test file to be mergeable. Defaults `true`; the Lead sets it `false` at
decompose for tasks that legitimately add no test (docs, config, a VERIFY-no-op whose scenario the
base already covers).
_Avoid_: hasTests, testExempt (state the requirement positively, default-on).

**`no-test`** (merge outcome):
The refiner's merge-task result when a `requiresTest` task's diff contains no test file. It is not a
failing gate — it routes a bounded fix-worker + full re-audit, and escalates only on budget exhaustion.
_Avoid_: gate-failed (the suite is green; the *diff* lacks a test).

### Memory

**Memory provenance**:
The trust tier of a durable learning — `agent-unverified` < `code-verified` < `user-confirmed` —
recording how the fact was established. The ladder is also the recall-weight order and the
correction-precedence order: a higher tier supersedes a lower.
_Avoid_: source, confidence (overloaded); accuracy (provenance records *how established*, not *how correct*).

**Verify-on-write**:
The servitor's discipline of Read/Grep-confirming a named file/flag/symbol exists before recording a
fact about it: found → `code-verified`; absent → `agent-unverified` with an absence-note. Distinct
from running the gate (which the servitor cannot do).
_Avoid_: fact-checking, validation (it confirms *existence*, not *truth*).

### State & resume

**Resume precedence**:
The ordering **git branch state > GitHub issue labels > `ledger.json`** that decides which layer wins
when the three resume records disagree. Git wins because the refiner's push-first CAS makes the shared
branches monotonic, so a recorded merge is real iff its SHA is reachable; the ledger is the richest
record but the weakest authority (local, uncommitted, written by no code).
_Avoid_: treating the "three-layer source of truth" as three co-equal authorities — only git is
authoritative; labels and the ledger are durable/advisory records that can lag.

**Resume reconciliation (pre-flight)**:
The read-only cross-check a resuming Lead runs before continuing — verifies each ledger-recorded
`merge_sha` is reachable on its branch, repairs the ledger + labels *toward git*, and **halts on an
unexplained (foreign) commit** rather than absorbing it.
_Avoid_: editing git to match a stale record; auto-trusting a commit no ledger task claims.

### Campaigns (multi-plan orchestration)

**Roadmap**:
The ordered **index of plans** (a meta-plan, not a plan). Its load-bearing parts are the **dependency
spine** (strict landing order) and the **shared-file contention table** — **Code-boundary decomposition**
applied one level up: plans touching a shared file (or the four release-slot files) **serialize** in
roadmap order; file-independent plans are free-ordered (usually by version/severity). Authored via the
`/war-strategy` template; consumed by the **Hopper**. A committed file, so it doubles as the campaign's
progress ledger and its live-append surface.
_Avoid_: a generic product roadmap; treating it as a plan `/war` can execute directly (it indexes plans).

**Hopper**:
The autonomous loop that executes a **Roadmap** — one chat running `/red-team <plan>` then
`/war <plan> … --afk --ace` over each plan in roadmap order, driven by the `/war-campaign` skill. Default
AFK model is **stack-and-plow**: plan N's working branch bases off plan N-1's landed tip and its PR
targets plan N-1's branch (stacked PRs, merged bottom-up; deleting each merged branch cascades the next
onto master). `--wait-for-merge` switches to **base-off-master** (wait for PR N-1 to merge, base plan N
off fresh `origin/master`). Live-appendable: a second chat authors + merges new plans and the hopper
picks them up on its next rebase.
_Avoid_: pointing every stacked PR at master (cumulative diffs → shared-doc conflicts — the stacked PR
target is plan N-1's branch); assuming Mode A works overnight (it needs a human merging each PR).
