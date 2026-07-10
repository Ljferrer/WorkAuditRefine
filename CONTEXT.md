# WAR — Context

The ubiquitous language of WAR (Work · Audit · Refine), a Claude-native orchestration of
worker/auditor/refiner agents over git worktrees and GitHub issues. This file is a glossary
only — no implementation detail.

## Language

### Authoring pipeline (spec → plan)

**Design spec** (`docs/specs/`):
The ratified **decision record** for a change — problem, pivotal constraints, numbered decisions with
alternatives considered, affected surfaces, test intent. Answers *what changes and why*; carries no
dispatch structure (no phases, waves, or file-disjointness guarantees). Authored by interview
(`grill-with-docs`); `/war` cannot execute one.
_Avoid_: handing a spec to `/red-team` (it validates **plans** and never converts); treating a spec's
affected-files list as dispatch-ready tasks.

**Implementation plan** (`docs/plans/`):
The **executable artifact** `/war` consumes — Commander's Intent (intent ceiling, plan floor) plus
phases and tasks with exact file sets, `requiresTest`, `deps`, and target repo, carved by the
code-boundary decomposition rule. Produced from a spec by `/war-strategy` (gap review + intent
echo-back); hardened by `/red-team`. Answers *who does what, in which order, against which files*.
_Avoid_: authoring one without a ratified spec behind it; using `/war-strategy` to validate
(war-strategy **converts**, red-team **ratifies**).

The pipeline: `grill-with-docs` authors the spec → `/war-strategy` converts it to a plan →
`/red-team` validates the plan → `/war` executes it.

### Worktree provisioning

**Provisioning**:
The owned lifecycle of the git topology a WAR run executes in: cutting the integration branch,
creating each task's worktree on the correct base, scoping it, reusing it for fixes, and tearing
it down (or preserving it on escalation).
_Avoid_: setup, bootstrapping, worktree management.

**provision mode**:
The refiner's third dispatch mode, alongside `merge-task` and `land-phase`: the three provisioning
dispatches it performs — the phase git-topology barrier (`provision:phase-<id>`), the per-task
provision-run (`provision-run:<taskId>`), and the phase-close polish worktree
(`polish-worktree:phase-<id>`). All three return the **env-outcome** shape
(`{ ok, taskId?, failedCommand?, exitCode?, stderrTail?, provisionSource? }`), never a MergeResult, and
a provision dispatch is never out-of-mode — the refiner does not decline it ([ADR 0001](docs/adr/0001-explicitly-managed-worktrees.md)).
_Avoid_: rerouting provisioning to another agent; treating a provision dispatch as a MergeResult mode.

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

**launch-worktree collision**:
The desired working branch is checked out in the worktree `/war` is launched from (or any sibling
worktree), so the refinery cannot advance it — git refuses to advance a ref that is checked out
somewhere, and the push-first land ([ADR 0004](docs/adr/0004-refinery-merges-in-a-worktree.md)) has
no un-checked-out ref to fast-forward. Detected via `git worktree list --porcelain`. Left
unresolved, it forces a `held:land-failed` every phase.
_Avoid_: merge conflict (this is a checkout/topology collision, not a content collision); worktree
directory collision (directories are run-scoped and already safe).

**dedicated working branch**:
A Setup-resolved working branch (`dev/<date>-<slug>`) auto-created when the desired branch is under
a *launch-worktree collision*, guaranteeing the working ref is checked out nowhere so the refinery
can advance it. Cut at the desired branch's tip, run-owned (reuse-if-ours on resume, ADR 0003), and
bootstrapped on origin at Setup before Phase 1.
_Avoid_: working branch (this is the *substitute* only created under collision — with no collision
the desired branch stands unchanged).

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

**provision base divergence**:
The local working-branch ref and `origin/<working>` are **neither equal nor ancestor-related** when
`cmd_ensure_integration` cuts a phase's integration branch. A **fail-loud halt** — the script dies
non-zero carrying both SHAs and the two repair directions, cuts no branch, and the phase never starts —
never a silent pick of one side (ADR 0008: repair toward git). Equal / behind / ahead resolve
automatically (cut at the origin tip when behind, with a guarded follower fast-forward); only true
divergence halts.
_Avoid_: silently picking local or origin; conflating it with a fetch failure / no-origin (which falls
back to today's local cut with a warning).

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

**execution evidence (provision)**:
The fields an `ok:false` provision result must carry for the outcome to classify as `env-blocked`: a
`failedCommand` that **matches a dispatched `run.provision` step** (exact trimmed array membership, never
substring) **and** a **numeric non-zero `exitCode`**. Absent that evidence — a refusal, a missing result,
a foreign/absent `failedCommand`, or an incoherent `exitCode: 0` — the outcome is `held:workflow-error`,
never a fabricated environment excuse. The gate is the boundary between a genuine environment gap and a
provision-dispatch contract failure.
_Avoid_: accepting any `ok:false` as `env-blocked`; inventing a `failedCommand` the worker never ran.

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

**Publication worktree**:
The transient, **phase-scoped** working-branch checkout the Lead provisions at Gate 2 to publish a
landed phase's promotable lessons (`<worktreeRoot>/<runId>/p<N>-publication`). Created and removed by
`provision-worktrees.sh` (`ensure-publication-worktree` / `remove-publication-worktree`, never a prose
`git worktree add`); it holds the `docs(learnings): phase N` commit + the CLAUDE.md pointer duty and is
pushed via `ensure-origin`'s push-first CAS, then removed. It **never persists across phases**; a leftover
from a crash is healed at Setup and Gate-2 entry (clean ⇒ removed, dirty ⇒ escalated). Contrast the
run-scoped `_refinery` naming (Refinery worktree): `_refinery` is one-per-run, `p<N>-publication` is
one-per-phase — the run-scoped-vs-phase-scoped naming convention of [ADR 0021](docs/adr/0021-run-lifecycle-provision-contract.md).
_Avoid_: publish checkout, learnings worktree.

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

**gate-failure class** (`MergeResult.gate_failure_class`):
The orthogonal label on a `gate_failed` — `introduced` | `baseline` | `environment` — that selects the
recovery path: the bounded fix-worker loop, a proceed-with-backstop record, or a 0-round `env-blocked`
escalation. Populated by the refiner's on-failure base re-run; absent ⇒ `introduced` (the fail-safe
default). **Class routes; status stays `gate_failed`** — the status enum, `HARD_ESCALATION_REASONS`, and
`KNOWN_LAND_DECISIONS` are untouched (ADR 0005 enum discipline; the finding-`disposition` precedent).
_Avoid_: a new `MergeResult` status for the baseline/environment cases (status widening leaks into the
land path); treating an absent class as anything but `introduced`.

**baseline gate debt**:
A gate failure the refiner proves **pre-existing** at the classification base (the phase integration
base at merge-task; the detached `origin/<working>` tip at land) by re-running the failing gate there and
matching the failing identifiers. It **never blocks** the diff that did not cause it — the merge/land
proceeds — and is always recorded as a deduped `source: 'auto'` **Backstop** entry, surfaced at every
land and in the final PR (ADR 0017: the un-run validation becomes a ratified-backstop record, never
prose).
_Avoid_: treating it as a passing gate (the gate is red — the debt just predates the diff); a silent
proceed (the backstop entry is mandatory).

### Landing

**Phantom land**:
A land that reports `status:'landed'` while the working ref **never advanced** — the `--no-ff` merge
produced no commit because the integration branch had nothing ahead of the working branch, so
`working_sha` still equals the tip the merge started from and the phase's work is silently dropped.
Refused by the **Land-truth guard** (exit 3, escalate class — never a reland).
_Avoid_: a content conflict or a rejected CAS (nothing conflicted — the merge simply produced no
commit); trusting a `landed` self-report as proof the ref moved.

**Land-truth guard**:
The `land-advance` (**Land primitive**) assertion set that makes a `landed` result **provable against
git** rather than self-reported. Immediately before the push it captures the **pre-push origin tip**
(`git ls-remote origin refs/heads/<working>`; a failed readback exits non-zero and never collapses
into the first-land carve-out), and it refuses a **phantom land** (exit 3) when `<merge-sha>` equals
that pre-push origin tip **and** the local follower already sits at it; the post-push readback still
confirms origin advanced to `<merge-sha>`. Anchored on the **origin tip, never the local follower**
(which lags). A `landDecision:'landed'` is trustworthy only downstream of it — extends
[ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md) onto the land path
([ADR 0023](docs/adr/0023-land-asserts-git-ground-truth.md)).
_Avoid_: anchoring the advance check on the local follower ref (it lags); treating the post-push
readback alone as sufficient (it passes on a phantom, which never advanced origin).

**Contender-less transient CAS**:
A push rejection with **no** competing run behind it, told apart from a real divergence by
`git rev-list --left-right --count <merge-sha>...origin/<working>` (the merge sha the loop just tried
to push vs. the freshly-fetched origin tip — **never** the lagging local follower) returning a
**right count of 0**: every commit on origin is already contained in the merge sha, so no contender
exists. It buys **exactly one** extra push-first land attempt beyond `roundLimit` exhaustion (an
explicit +1, once) rather than an immediate surrender; a **nonzero** right count is a real divergence
and returns `land_stale` at once. A resolved transient returns `landed`, so the existing
`servitorResult` gate fires with no Lead step.
_Avoid_: counting against the local follower (`<working>...origin/<working>`) instead of the merge
sha; folding the extra attempt into `roundLimit` (it is an explicit, one-time +1).

**Land primitive (single land chokepoint)**:
`provision-worktrees.sh land-advance <working> <merge-sha>` — the one path **every** land routes
through: the refiner's in-flow land, the `held:land-failed` auto-recover, and the
escalation-completion land. Routing all of them through it means the **Land-truth guard** and the
follower CAS reconciliation cover every land and no path re-implements a raw `git push`. The 2-arg
contract is stable for every caller ([ADR 0023](docs/adr/0023-land-asserts-git-ground-truth.md)).
_Avoid_: a bespoke escalation-completion script (the resolved gate is a runtime string a subcommand
can't own); a manual `git push` / `--force-with-lease` land that bypasses the guard and follower sync.

### Audit

**Audit roster**:
The per-task ordered list of **1–5 distinct-lens seats** that convene to audit the task's diff. Seat
count *is* the roster's length — there is no separate size knob — and the ruling is **unanimous**
regardless of parity (even counts are legal; nothing tie-breaks because nothing votes by majority).
_Avoid_: covenSize, panel size, seat count as a knob independent of the lens list.

**Seat** (audit):
One independent read-only auditor, convened from one roster entry — a **lens** plus that seat's own
**depth**. Perspective diversity is the entire value of extra seats, so duplicate lenses in one roster
are invalid.
_Avoid_: reviewer instance; redundant/duplicate seats as a form of rigor.

**Lens**:
The single perspective a seat reviews through. The namespace is **open** (a run may mint domain lenses,
e.g. `healthcare-safety`); the **catalog** documents the standard menu (`correctness`,
`cascading-impact`, `plan-faithfulness`, `security`, `performance`, `simplicity`, `usability`,
`test-fidelity`). `execution-evidence` and `pin-validity` are **reserved** for their built-in passes,
never roster-picked. Every seat, whatever its lens, still carries the anti-cheat duty (tests exist,
not weakened).
_Avoid_: a closed enum; delegating the anti-cheat baseline to one lens.

**Depth** (`neighbors` | `deep`):
How far a seat traces beyond the diff — the diff plus one hop of what its changed lines reference
(`neighbors`), or wherever the changed symbols are used (`deep`). Depth rides on **each seat** and may
be heterogeneous within a roster.
_Avoid_: task-wide depth; deriving depth from seat count.

**Coven**:
Any roster of **two or more** seats — prose flavor only; no config key carries the word.
_Avoid_: coven as a boolean mechanism; calling a solo seat a coven.

**`rosterPolicy`** (`all` | `auto` | `solo`):
How task rosters are **seeded** at decompose: the full default roster on every task (`all`); the Lead
**composes each task's roster from the lens catalog** — 1–5 seats, each with an explicit depth and a
one-line rationale, scaled to the task's blast radius (`auto`, the default); or the first default lens
alone at `neighbors` (`solo`). A seed only — the Lead may hand-edit any task's roster at the decompose
gate, subject to human approval.
_Avoid_: covenPolicy; treating the seed as a cap on Lead editing; the old binary full-roster-vs-one-seat
reading of `auto`.

**Auto-escalation** (audit):
The runtime widening of a **lone** seat that returns a Critical or low-confidence verdict: the roster
becomes the **union** of the existing seat and a **widening source** (capped at 5), then the full widened
roster re-audits on the pinned SHA. The source is the seat's own **`widen` nomination** when it supplies
a valid one (a non-empty list of distinct, non-reserved lens names → those lenses at `deep`), else the
**default roster's lenses** (the byte-identical trio-union fallback). Fires only on 1-seat rosters — a
multi-seat roster the human approved is never second-guessed.
_Avoid_: replacing (rather than unioning away from) the lone seat's lens; widening covens further;
treating the trio union as the only source (nomination comes first).

**Gate-audit pass**:
The post-merge, pre-land review of each merged task's **executed gate output** through the reserved
`execution-evidence` lens — SOFT by default, HARD (land-holding) only on a provably-unrun mapped test.
It **auto-skips** a `requiresTest:false` task (no mapped tests ⇒ its HARD path is vacuous); the skip
is logged, never silent, and there is no operator off-switch.
_Avoid_: audit-gate, "the additional audit"; treating it as a second full audit; a Lead-flippable toggle.

**Benign forward-advance**:
A gate-HEAD-pin/HEAD mismatch where the observed HEAD *descends* the pinned gate SHA and no mapped file
changed in the intervening diff; proven mechanically by `gate-pin-status.sh`, treated as pin-CONFIRMED
(never a burned audit round, never a hold). Near-universal once ≥ 2 tasks land in sequence on one
integration branch.
_Avoid_: conflating it with a `STALE-MISMATCH` (a mapped file *did* change, or the pin is not an
ancestor — the genuine cannot-confirm case); reading the pin/HEAD mismatch itself as a defect (the
mismatch is the expected steady state, not a regression).

**Integrated-tip gate re-run**:
The single authoritative gate execution at a phase's final integration tip, dispatched when the phase
carries intra-phase `deps` between same-repo tasks; per-branch (work-wave) gate results are advisory,
this one is land-authoritative ([ADR 0024](docs/adr/0024-audit-gate-verdicts-integrated-tip-captured-evidence.md)).
_Avoid_: treating a per-branch (frozen-base) gate as land-authoritative for a dep-crossing task; expecting
the extra re-run on a phase with no intra-phase deps (there it is not dispatched — byte-identical to today).

**Gate-evidence artifact**:
The tee'd full gate stdout+stderr file under `_refinery/.war/gate-<taskId>.log`; the `execution-evidence`
seat's source of per-mapped-test PASS evidence, replacing curated `gate_output` prose. Phase-ephemeral
(last-write-wins across a task's up-to-four gate runs; destroyed by `_refinery` heal and phase teardown) —
audit input, never a resume/adjudication record.
_Avoid_: minting a HARD provably-unrun finding from a possibly-curated inline `gate_output` paste (the
HARD determination is made only against the captured file); treating a missing artifact as a hold (missing
⇒ SOFT cannot-confirm).

**Pin-equality gate**:
The Node-side check that a seat's returned `audit_sha` equals the SHA it was dispatched to judge; a
well-formed mismatch tags that seat's findings `pin-mismatch` and excludes them from the HARD path
(SOFT-only). Fail-open — an absent/malformed pin on either side keeps today's behavior.
_Avoid_: conflating the `pin-mismatch` findings tag with the `agent-unverified` *memory-provenance* tier
([ADR 0007](docs/adr/0007-memory-provenance.md)) — unrelated concepts; confusing it with `pin_status`
(which classifies the `gateHeadSha`↔`observedHead` relationship — this checks seat-vs-dispatched-pin).

### Diagnosis discipline

**self-confound gate**:
The mandatory diagnosis pre-flight run before an observed failure — a red probe, a broken baseline, an
unexpected sandbox or live-system state — may be attributed to a **systemic bug** (the plan, the code, a
subsystem). Four parts: enumerate and rule out your own and any concurrent actor's recent **mutating**
actions against the observed state ("did I cause this?" is question #1); validate **single-path** over
shared mutable state (never manual **and** automated back-to-back — re-provision fresh state before
switching paths); gate **hypothesis promotion** on primary evidence (raw logs, a clean repro) plus an
inward refute pass; and state the observation that would falsify the diagnosis, then go check it. It
**blocks promotion, never diagnosis or escalation** — when primary evidence is unobtainable, record a
labeled hypothesis note and/or escalate, then proceed. Standing-instruction prose carried across WAR's
failure-diagnosing surfaces (the red-team Lead and confirm stage, the WAR Lead, workers, the servitor
write-side), **not code-enforced**.
_Avoid_: "observer-effect check" as the code/test token (the greppable anchor is `self-confound`);
treating the gate as a hook or floor (nothing mechanical enforces it — it is prose discipline).

**hypothesis promotion**:
Escalating a root-cause diagnosis into a **durable artifact**, along a **closed list of four channels**: a
memory/lesson write, a `war-followup` issue, a fix plan or spec, a sub-agent fan-out. Gated by the
**self-confound gate** — no channel may encode a root-cause claim without primary evidence plus a stated
falsifier. A hypothesis that must survive compaction is a **labeled ledger/phase-report note, never a
memory lesson**.
_Avoid_: promoting a diagnosis merely *consistent* with the theory; treating "must survive compaction" as
license to write a memory lesson (it is a labeled note instead).

### Clean handoff (intent + disposition)

**Commander's Intent**:
The plan's `## Commander's Intent` section — **Purpose** (why), **Method** (how the operator envisions
winning; the latitude bounds), **End state** (numbered, individually *checkable* conditions).
Staff-drafted, commander-confirmed: an authoring skill may draft it from operator answers, but the
operator's explicit confirmation is the gate. The Lead extracts it **verbatim** into `args.intent`;
a missing section → `intent = null` and the run degrades to literal plan behavior — never Lead-invented,
with one exception: the **AI-Commander's Intent** block `/war-machine --afk` authors, marked by its own
heading (ADR 0014).
_Avoid_: mission statement, goals (neither carries the checkable End state); Lead-synthesized intent.

**Intent ceiling / plan floor**:
The latitude rule a threaded intent licenses: the plan slice is the **floor** (must be satisfied), the
Commander's Intent is the **ceiling** (bounds judgment beyond the slice). Intent-consistent work beyond
the literal slice is APPROVE, judged on its own correctness — never a plan-faithfulness violation; only
deviations that contradict the intent or the slice block. No intent ⇒ judge against the slice alone.
_Avoid_: plan literalism as a virtue; latitude as unbounded scope.

**Disposition** (`absorb` | `follow-up` | `note`):
The auditor-owned routing of a Minor/Nit finding, orthogonal to severity: fix it this phase (`absorb` —
the per-task ace, or the phase-close sweep when `phaseClose:true`/release-slot-adjacent), file it as an
affirmative issue (`follow-up` — must state why it is not absorbable), or record it without filing
(`note` — phase report + servitor feed). Omitted → Minor becomes follow-up, Nit becomes note; `absorb`
is never a default. A failed or ineligible route **demotes one step toward durability**, logged — never
dropped silently.
_Avoid_: autoFixable (deprecated legacy alias for absorb); severity as the routing signal.

**Phase-close coherence sweep**:
The fail-open polish pass at a would-land phase's **integrated tip**: one worker in a `p<N>-polish` worktree
fixes ONLY the queued `phaseClose` absorb findings, a full default-roster panel re-audits the polish SHA,
and the refiner merges it at the serial queue's tail — or **discards** it (branch + worktree left in
place; queue demotes to follow-up) and the pre-polish tip lands exactly as it would have. It may only
improve the tip; a discarded sweep recomputes nothing.
_Avoid_: cleanup phase; ad-hoc seam hunting; treating a discard as a failure that holds the land.

**Dep-wave visibility**:
The mechanism by which a task's declared `deps` grant **code visibility**, not just ordering: the
worker's first action is `git rebase <integrationBranch>` in its own worktree (a pure fast-forward on
first dispatch), so its base includes the merged dep content. Same-repo deps only — `gitlink-bump`
tasks are excluded (their dep merged into the submodule repo). Doctrine: dependency ⇒ **wave** edge;
phase edges remain for what must be *landed* first.
_Avoid_: repin/reset scripts (never-reset-on-reuse stands); dependency ⇒ phase edge as the default.

**Clean handoff**:
The end-state a phase owes the next: a tip whose quality debt is **zero or enumerated and intentional**
— every finding absorbed (commit-cited), filed (issue + why-not-absorbable), or noted (report) — plus a
machine-readable `handoff` block (`{ tipSha, polish, absorbed, followUps, notes, endState,
intentPresent }`) emitted on `landed` and `held:escalation` for the next phase's decompose.
_Avoid_: follow-up issues as the default disposal; a handoff block on `held:workflow-error` (infra
death has no trustworthy return to render).

### Test discipline

**Test floor**:
The deterministic guarantee that a task which *requires* a test changed at least one test file in
its diff, enforced by a tested shell assertion at merge-task. The coarse *floor* (a test exists) is
distinct from the auditor's semantic *ceiling* (it is the right test, exercises the slice, is not
weakened or skipped).
_Avoid_: test coverage, test gate (the gate runs the suite; the floor inspects the diff).

**test-floor pattern** (`overrides.testPattern`):
The per-run glob set the **Test floor** matches a task's diff against, pinned at Setup *together with*
the gate so floor ⊆ gate holds on any target repo. Threaded end-to-end like `plan.gate`, never parsed
out of the gate command (the globs live in the target's test-runner config, not the command line). The
gate's unconditional `*.test.sh` discovery is always unioned in; `null` (default) = the built-in
WAR-repo gate-mirror defaults, byte-identical to today.
_Avoid_: deriving it by parsing the gate command; pinning a pattern independent of the confirmed gate
(floor ⊆ gate is one decision).

**`requiresTest`** (task field):
Whether a task must change a test file to be mergeable. Defaults `true`; the Lead sets it `false` at
decompose for tasks that legitimately add no test (docs, config, a VERIFY-no-op whose scenario the
base already covers).
_Avoid_: hasTests, testExempt (state the requirement positively, default-on).

**`no-test`** (merge outcome):
The refiner's merge-task result when a `requiresTest` task's diff contains no test file. It is not a
failing gate — it routes a bounded fix-worker + full re-audit, and escalates only on budget exhaustion.
_Avoid_: gate-failed (the suite is green; the *diff* lacks a test).

**Packaging floor**:
The deterministic guarantee that a file a task adds beside individually-COPY'd siblings of a
Dockerfile is either packaged (a `COPY` line), excluded (`.dockerignore`), or exempted
(`requiresPackaging: false`) before it can merge — enforced by a tested shell assertion at
merge-task, the artifact-side sibling of the **Test floor**. Coarse and heuristic by design: the
floor proves enumerated packaging kept up with the diff; the opt-in docker-build gate (when the
operator accepts it at Setup) is the definitive artifact check. When unsure (unparseable
`.dockerignore` pattern), it flags — never silently excuses.
_Avoid_: docker gate (that is the executed build, a separate mechanism); treating a floor pass as
proof the image builds.

**`requiresPackaging`** (task field):
Whether the packaging floor applies to a task's diff. Defaults `true`; the Lead sets it `false` at
decompose for tasks whose added files legitimately never ship in an image. Independent of
`requiresTest` — a task can require a test but not packaging, and vice versa.
_Avoid_: packagingExempt (state the requirement positively, default-on).

**`unpackaged`** (merge outcome):
The refiner's merge-task result when the packaging floor flags an added file. Not a failing gate —
it routes a bounded fix-worker (add the `COPY`, or `.dockerignore` it; never delete the file) plus
a full re-audit, and escalates hard only on budget exhaustion.
_Avoid_: gate-failed (the suite is green; the *image manifest* lags the diff).

**Backstop** (deferred validation):
An operator-ratified validation the run's gate will not execute pre-merge — declared in the plan's
required `## Deferred validations (backstops)` section (check · why deferred · external runner;
explicit `None` allowed), graded for legitimacy by `/red-team`, threaded as `args.backstops`, and
surfaced as *unexecuted* in every phase report, the final PR, and the handoff block. A validation
that is in neither the gate, a floor, nor this section may never be waived in prose — the Lead
escalates instead. A gate that degrades at Setup (docker daemon unavailable) auto-records itself
here.
_Avoid_: out-of-scope note (unratified prose with no forcing function); treating a declared
backstop as discharged — declared ≠ executed; conflating it with the ace's release-slot **string
backstop** (ADR 0013 — an in-run deterministic check, nearly the opposite of a deferred one).

### Drift-guard discipline

**Drift-guard**:
A mechanical test that extracts a fact from a non-canonical surface and asserts equality (`deepEqual` /
byte-`===`) against its canonical source. Distinguished from a **presence check**, which only asserts an
anchor phrase exists and is explicitly *not* a drift-guard.
_Avoid_: calling a presence-only or JSON-well-formedness check a drift-guard (neither extracts and
compares — both pass identically whether the surfaces agree or have drifted).

**Canonical source vs mirror site**:
The single authoritative definition of a fact (a code export, a JSON field, a routing predicate) vs any
hand-maintained copy of it (an inline sandbox mirror, a doc claim, a tour count).
_Avoid_: treating a mirror site as authoritative — the guard reads the canonical source, never a second
hand-typed copy.

**Mirror registry**:
The explicit, listed set of (canonical export → mirror site) pairs, each carrying a drift-guard. The
ratified alternative to an automatic mirror-detector; adding a mirror means adding a registry row.
_Avoid_: a generic AST/import-graph scanner auto-discovering every inline copy (the rejected
research-project ceiling — `// ponytail:` the registry instead).

**Both-surfaces directive registry**:
The listed set of correctness-critical directives asserted present in BOTH an agent's standing `.md` and
its dispatched prompt (incl. gate-audit inline seats).
_Avoid_: asserting a directive on only one surface — a change to one never propagates to the other (the
standing-vs-dispatched coverage split).

**Mechanism-style narrative**:
A doc convention: describe the invariant and the guard that holds it, never a snapshot count/divergence
that rots (extends the existing "cite the section that DEFINES a mechanism" discipline to narrative/tour
prose).
_Avoid_: freezing a structural count ("differ by exactly one entry", "lists 8 reasons") or a line-number
reference in narrative prose — it reads authoritative while silently going false.

### Red-team plan-vs-state grading (ADR 0032 / ADR 0033)

**Artifact-kind**:
The class of artifact `/red-team` is verifying (`impl-plan` / `tdd-plan` / `design-doc` / `prd`), computed
by the Lead pre-flight and threaded into every probe. Drives whether a claimed-but-absent symbol is a
deliverable baseline (suppressed) or a precondition failure (a finding). Defaults to `impl-plan` when
absent — the suppression-safe choice.
_Avoid_: "plan type", "mode" — and never default to a kind that *un*-suppresses future-work absence;
`impl-plan` leans safe because the reverse direction re-opens the false-Critical misfire.

**Deliverable-absence**:
A symbol/test/file the plan *promises to build* whose absence from the current repo is the expected
pre-execution baseline — never a red-team defect. Carried as the typed `deliverableAbsence` finding flag
that `classify()`/`verdict()` never count as a blocker (the gate keys on the flag, not on `reality`-string
NLP). Distinct from a **precondition-missing** anchor (a real finding).
_Avoid_: "missing code", "gap" — and never conflate it with the retained-findings carve-out (a false
claim about EXISTING code still blocks).

**Sandbox-escape guard**:
The deterministic post-run check (`assert-no-repo-escape.sh`, floor exit contract 0/1/2) that no executed
probe mutated the real repo working tree or pushed a junk remote ref. Runs between the Workflow return and
the gate; a positive result routes the verdict through the self-confound gate (ADR 0020), never `CLEARED`.
The hardened `git -C` scope-lock is prevention (Layer 2); this guard is the detection authority (Layer 3).
_Avoid_: "cleanup", "sandbox jail" — it is detection, not confinement; the agent-type probe jail is a
recorded non-goal (D6).

**Adjudication (red-team)**:
An authoritative resolved value (especially a version literal) recorded in the red-team report's
`## Adjudications` block, superseding the plan body literal. Auditor version-scoring keys on it:
task instruction > red-team adjudication > plan body literal.
_Avoid_: "override", "the real version" — the block is written by the grill loop when it patches an
authoritative value, never mined from arbitrary prose.

### Guard coverage by equivalence class (ADR 0031)

**Traversal equivalence class**:
The full set of `..`-bearing path shapes a scope guard must reject: bare `..`, leading `../*`, embedded
`*/../*`, and trailing `*/..`. A guard covering a proper subset has a latent sandbox-escape hole even
when downstream branches incidentally deny the rest.
_Avoid_: rejecting only the shape that bit us (`*/../*|*/..`) — the class, not the instance, is what the
guard covers; the reject arm stays pre-`case` so it binds every agent type (ADR 0002 D5).

**Verb equivalence class (absence guard)**:
The set of git verbs that express one forbidden behavior (e.g. `checkout` and `switch` both re-attach a
branch). A git-surface absence guard enumerates the class in a comment and scans every verb; scanning
one verb is false coverage the moment the surface adopts an equivalent.
_Avoid_: scanning one verb and trusting review to remember the rest — a new equivalent verb is added to
both the enumerating comment and the scan.

**Subtree-anchored search root**:
A guard test's grep/find root resolved to the narrowest subtree from `$SCRIPT_DIR` (never the repo root),
so it cannot scan stale `.claude/worktrees/**` checkouts. A repo-root scan that omits a `.claude/`
exclusion is environment-dependent and a green worktree run does not prove it correct.
_Avoid_: a bare repo-root `grep -r`/`find` without a `.claude` exclusion — enforced by the
`hooks/guard-conventions.test.sh` search-root lint (a deliberate exception carries an inline
`# guard-conventions: allow <reason>` tag).

**Floor⊆gate parity**:
The tested (not inspected) equality between the test floor's discovery predicates
(`assert-test-in-diff.sh`) and the gate's (`resolveGate` in `war-config.mjs`). Any asymmetry over- or
under-credits test presence.
_Avoid_: hand-mirroring the exclusion set (`node_modules`, `.git`, `.claude`) and the name globs across
the two mechanisms with no cross-check — the parity test asserts against `resolveGate`'s *output string*,
so a semantics-preserving refactor cannot break it.

**Precondition marker**:
A specific loud stderr token (e.g. `REL_GUARD_PRECONDITION_FAILED`) a guard emits when its environment is
non-isolatable. A `gate_failed` carrying one is classified `environment`, never `introduced` — the reader
consults stderr markers, not just TAP stdout.
_Avoid_: classifying a marker-bearing `gate_failed` as `introduced` (blaming the code for a
non-isolatable environment); the marker is carried in `gate_output` uncurated.

### Live artifacts over stack-fragile literals (ADR 0030)

**Construct locator**:
A plan/prompt reference by enclosing symbol or comment header (plus a change description) rather than a
`:N-M` line range — stable across integration churn because the symbol name survives the serial merge
queue where a line number does not.
_Avoid_: a raw line-range literal (stale on any prior land); reserve `:N-M` for a flat config file with
no named construct, and then qualify it as approximate against a named base sha.

**Stack-fragile literal**:
Any plan/prompt value pinned to the drafting base that rots the instant an earlier stacked task lands —
line ranges, `*.test.sh` enumerations, suite counts, mirrored-constant final arrays, hardcoded version
bumps, flat-key abbreviations of nested paths. The authoritative form is always the live artifact (the
construct, the self-discovery gate, the canonical export, the worktree baseline).
_Avoid_: restating a value the live artifact already carries — reference the artifact and let the drift
guard or the self-discovery gate be the arbiter.

**Defined-but-not-yet-emitted slice**:
A foundation task's constant/field/prose-ref added *before* its emitter task lands; benign **iff** the
plan carries a "produced in Task N" cross-link. Without the link, auditors misgrade the inert slice as
dead code or an omission.
_Avoid_: shipping a mirrored constant/schema/prose-ref whose emitter is a later task without the
cross-link — and, as an auditor, holding an inert slice that the cross-link explains.

**Grep as floor**:
A token sweep is a completeness *floor*, not a *ceiling*: it must be backed by a manual same-scope
title/comment survey, because same-meaning siblings encode the concept in different words and survive
the sweep silently. (Extends the existing floor/ceiling language.)
_Avoid_: treating "grep X, handle every match" as a completeness proof; call out each straggler the
manual survey catches as a survey-derived correction.

**Stale-looking-but-correct calibration**:
The auditor discipline of demoting a plan↔candidate divergence to Nit **only** when the live artifact
confirms benignity — done once per pattern in the standing auditor surface rather than re-litigated per
seat, per pass.
_Avoid_: a blanket amnesty — a demonstrably-untrue claim still blocks; the demotion is gated on
live-artifact confirmation, never unconditional.

### Memory

**Memory provenance**:
The trust tier of a durable learning — `agent-unverified` < `code-verified` < `user-confirmed` —
recording how the fact was established. The ladder is also the recall-weight order and the
correction-precedence order: a higher tier supersedes a lower.
_Avoid_: source, confidence (overloaded); accuracy (provenance records *how established*, not *how correct*).

**WAR-editable memory file**:
A memory file the servitor is allowed to mutate in place: one whose frontmatter carries a nested
`metadata.provenance` value. A pre-existing file **without** it is user-authored — top-of-ladder
([ADR 0007](docs/adr/0007-memory-provenance.md)), agent-immutable: the servitor may not Write, Edit, or
NotebookEdit over it (the provenance-presence discriminator, enforced fail-closed by
`validate-servitor-provenance.sh`); it writes a new `[[slug]]`-cross-linked file instead. A top-level
`provenance:` line does **not** count — the value must be nested under `metadata:`.
_Avoid_: "verified file" (presence of the *key*, not any tier value, is the discriminator); assuming an
untagged file is agent-authored (untagged ≈ hand-authored).

**Verify-on-write**:
The servitor's discipline of Read/Grep-confirming a named file/flag/symbol exists before recording a
fact about it: found → `code-verified`; absent → `agent-unverified` with an absence-note. Distinct
from running the gate (which the servitor cannot do).
_Avoid_: fact-checking, validation (it confirms *existence*, not *truth*).

**Memory root**:
One of the two directories a lesson can canonically live in: the **repo root** (committable — travels
with clones, merges across users, reviewed like code) or the **local root** (private to one
machine/user, never committed). A lesson belongs to exactly one root, routed by its `metadata.type`
and the redaction lint.
_Avoid_: "the memory dir" (which one?); treating the roots as mirrors (they hold different lessons).

**Promotion**:
The Lead's Gate-2 act of publishing a `type: project` lesson from the local root into the repo root — a
**copy-with-marker**, completed only **after the push succeeds**: the repo copy rides the phase PR (a
same-slug repo file is **overwritten on recurrence**), and the local original gains a nested
`metadata.promoted: <workingBranch>@phase-<N>` marker and is **never deleted** — it stays recall-visible
(to `render-index`/prefetch/`/lessons-learned`) and is retired only by a future `/lessons-learned` pass
once the merge is confirmed. A failed push or a redaction flag leaves the lesson unmarked in the local
root — never dropped. The servitor never promotes; the Lead is the sole repo-root writer
([ADR 0022](docs/adr/0022-servitor-local-root-writes-gate-2-promotion.md)).
_Avoid_: "move" / "publish-and-delete" (the local original survives); treating it as a servitor write.

**Hot set** / **Cold set**:
The temperature split of a memory root, encoded by *location*: hot lessons sit in the root itself and
each gets one row in the index projection; cold lessons sit in `archive/` — no projection row, still
indexed and retrievable by query, forever. Archiving is a file move plus a dated body note; it is
never a deletion.
_Avoid_: deleted/retired-as-removed (cold lessons remain queryable); a status field (the path *is* the
state).

**Index projection**:
The generated, size-capped rendering of both roots' hot sets into the **local** `MEMORY.md` (the
session auto-load file) — one row per hot lesson, capped by *selection* (archive candidates), never by
dropping knowledge. Generated-only: no process or person edits it in place; writers write lesson files
and the projection is re-rendered atomically. The repo root carries no projection — a committed
generated file is a merge-conflict surface.
_Avoid_: "the index" as a hand-maintained file; compaction (the projection is regenerated, not
trimmed); a committed copy.

**Derived memory index**:
The SQLite/FTS5 index built **in memory, per invocation**, from both roots' lesson files (hot + cold).
It never exists on disk — nothing to commit, back up, corrupt, or heal. The canonical store is always
the text.
_Avoid_: memory database as a source of truth or as a file; index staleness (it is rebuilt on every
use).

**Redaction lint**:
The deterministic, fail-closed content check a lesson must pass to sit in the repo root: a flagged
lesson (home paths, emails, account handles, credential-shaped strings) is demoted to the local root
and reported — never committed, never dropped. First of three publication gates (lint → PR review →
repo CI).
_Avoid_: treating it as truth- or quality-checking (it checks *publishability*).

**Memory prefetch**:
The Lead-side retrieval step at phase launch: one query per prospective seat (task text plus the
seat's role/lens), each result capped and injected into that agent's spawn prompt. Per-seat queries
mean different auditor lenses receive different lessons. Fails open — a phase without memory runs
lesson-less, logged.
_Avoid_: agents querying at spawn time (only workers may, mid-task, as an extra); a shared identical
memory block for all seats.

**Graduation candidate**:
A durable lesson whose recurrence trail shows **≥2 re-triggers** and whose content describes a
**machine-checkable invariant** (a greppable pattern, a diff property, an enum mirror), flagged by the
`/lessons-learned` housekeeping pass for promotion from prose to machine enforcement (hook, floor,
drift-guard test, or lint) with a one-line proposed enforcement shape. Flag-only: the operator decides
what, if anything, is filed or built.
_Avoid_: auto-filed issue, auto-built hook (the flag never implements); treating every recurring lesson
as a candidate (only machine-checkable ones qualify).

**Concept hub**:
A lesson that is dead as a bug warning yet load-bearing as a vocabulary anchor (≥2 inbound `[[links]]`
from siblings citing it as "same family as …"). Archived only with an explicit hub WARN; when its rule
is resolved it is downgraded to a compressed `RESOLVED — kept as concept anchor` stub that retains its
hot index row rather than removed ([ADR 0028](docs/adr/0028-memory-store-integrity-tool-enforced.md)).
_Avoid_: treating inbound-ref count as staleness (a hub is stale as a warning, live as vocabulary);
dropping the hot index row on archive (the stub keeps it).

**Link trichotomy (HOT / COLD / MISSING)**:
The three-way classification of a `[[wikilink]]` target — HOT (`<root>/<slug>.md`, keep), COLD
(`<root>/archive/<slug>.md`, keep — a legal cold link into the queryable-forever archive), MISSING
(neither — the only removal candidate). Adjudicated centrally by the archive-aware `safe-swap verify`,
never by a hot-only `ls <staging>/<slug>.md` in a fan-out verifier.
_Avoid_: calling a cold link dangling (it resolves via `resolves_in()`); a verifier recommending removal
from a hot-only `ls` (the central check is the sole authority).

**Non-destructive default (`--candidates`)**:
A flag that reads like a query and *lists* like a query: `war-memory archive --candidates` reports the
ranked candidate set and mutates nothing (a dry-run); archiving requires an explicit `--apply` or an
explicit slug list (`archive <slug>…`). The mechanical replacement for the "never run `--candidates`"
prose gotcha ([ADR 0028](docs/adr/0028-memory-store-integrity-tool-enforced.md)).
_Avoid_: a query-shaped flag that mutates by default (the retired footgun — `--candidates` archived the
whole ranked set); assuming `--candidates` alone still moves files.

**Finding-match check**:
The servitor's obligation to re-confirm that an audit finding's *named construct* (the specific defect,
not merely the file) still matches at the landed tip before recording it as a live gotcha — match →
`code-verified` with the file/line locate-cue; no match (fixed in-flight) → the generic pattern at
`agent-unverified`, never a live file/line. Extends verify-on-write (which checks referent *existence*
only) ([ADR 0029](docs/adr/0029-capture-grounds-on-committed-tip.md)).
_Avoid_: recording a stale audit-log finding's file/line as a current instance (the log outlives the
fix round that resolved it); conflating file-exists with finding-still-matches.

**Committed-tree grounding**:
Resolving an "already-done" / verify-and-close no-op claim against a pinned committed SHA
(`git show <audit_sha>:<path>` for a blob, `git log -S/-G` for history) rather than the working tree, so
a transient uncommitted edit cannot fabricate the verdict; the working-tree grep is advisory only. The
auditor allowlist is **not** widened — `git grep` stays denied
([ADR 0029](docs/adr/0029-capture-grounds-on-committed-tip.md)).
_Avoid_: grepping the dirty working tree as the sole basis (a reverted edit lies about the committed
tree); assuming `git log -S` answers "is the token present at the path" (it answers "when did the count
change").

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

**recovery relaunch**:
The sanctioned retry of an escalated/`env-blocked` task or a dead phase (`held:workflow-error`,
retries-exhausted `held:phase-incomplete`): a **fresh Workflow run** (new `runId`) over the **same plan
slug** and the **same numeric `phase.id`**, with **owned-file continuity** so `cmd_ensure_integration`
reuses the run's owned integration branch instead of dying foreign. It composes git-first reuse
([ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md)) — the existing task branches (with their
kept commits) are checked out into the fresh run's phase-scoped worktrees and fixed forward — and is
**never** `resumeFromRunId` (which replays the same run's off-ladder journal, the cached escalation).
Single-task retry uses a one-task DAG; whole-phase relaunch uses the phase's unmerged tasks (verified
against git). A Lead/operator playbook, never template-automated.
_Avoid_: `resumeFromRunId` for an escalation; letter-suffixed phase ids ("4b"); rewriting the kept
commits on a retried branch.

### GitHub side-effects

**gh preflight**:
The pre-batch assertion (`gh-preflight.sh <overrides.ghUser>`) that the active `gh` account is the run's
`overrides.ghUser`, re-switching on drift (`gh auth switch`) and re-verifying via `gh api user --jq
.login`, failing loud on an unrecoverable mismatch, so a mid-run account flip never silently drops a
write batch. Unset `ghUser` ⇒ exit 0 no-op (single-account repos and the shipped default untouched).
_Avoid_: relying on a once-at-session-start auth check.

**issue-lifecycle floor**:
The Lead-invoked check (`assert-issues-filed.sh`) that phase epics and task sub-issues named in the
ledger actually exist on `gh`, and are closed with `status:done` on a landed phase. A hard gate at the
checkpoint keyed on the ledger's own fields (orthogonal to any plan's `No GitHub issue filed` line);
issue filing is verified, not doctrinal. Mirrors the `assert-*-in-diff.sh` `0/1/2` exit contract — a `2`
(gh/ledger/ref error) never collapses into the `1` named route.
_Avoid_: trusting the ledger's `epic_issue`/`issue` fields as proof of filing.

**acknowledged-stranded**:
An aftermath report bucket for remote branches an operator has permanently accepted as stranded (content
landed under rewritten SHAs), recorded in `docs/aftermath/known-stranded.tsv` with a landing PR (or a
documented PR-less `note`). Suppressed from needs-human, never auto-deleted, the tip-reachable +
PR-merged deletion bar unchanged. Matched by exact `refs/heads/<ref>` name, never a substring.
_Avoid_: re-deriving them as fresh needs-human rows every run; treating an allowlist row as a deletion
license.

**churny shared docs**:
The pathspec (`docs/plans docs/specs docs/roadmaps`) whose files a stacked branch predictably conflicts
on against master; snapped to master's canonical copy by `snap-shared-docs.sh` (merge master,
`checkout --theirs` under the pathspec, byte-identity guard outside it, fast-forward push, never
`--force`). ADR 0011 stack-and-plow is the primary recurrence reducer; the snap is the residual fallback.
_Avoid_: rebasing or force-pushing a docs-only conflict; `--theirs`-ing a code-touching doc outside the
pathspec.

### Campaigns (multi-plan orchestration)

**Roadmap**:
The ordered **index of plans** (a meta-plan, not a plan). Its load-bearing parts are the **dependency
spine** (strict landing order) and the **shared-file contention table** — **Code-boundary decomposition**
applied one level up: plans touching a shared file (or the four release-slot files) **serialize** in
queue order; file-independent plans are free-ordered (usually by version/severity). Authored via the
`/war-strategy` template. An **authoring input and on-demand snapshot** of a campaign: `/war-campaign`
ingests it to seed the **Campaign ledger**, and can render the ledger back out as a committable roadmap
(machine switches, review). It is **not** the live feed — the running queue never lives in git, so two
writers can never merge-conflict on it.
_Avoid_: a generic product roadmap; treating it as a plan `/war` can execute directly (it indexes
plans); treating the committed file as live campaign state (that's the **Campaign ledger**).

**Campaign ledger**:
The uncommitted per-run state of a campaign at `.claude/campaigns/<id>/ledger.json` — the plan queue
plus per-plan outcome (status, branch, PR#, landed SHA, stop point). **Single-writer** (the campaign
Lead), written atomically (temp file + rename), owned by `campaign-ledger.mjs`. The resume source: a
re-invoked campaign re-reads ledger + **Inbox** and continues; on resume the Lead reconciles the ledger
*toward git* (`git ls-remote`, `gh pr view`) before trusting it.
_Avoid_: committing it (that's the **Roadmap** snapshot's job); editing it by hand mid-run.

**Inbox**:
The multi-writer add path of a campaign: `.claude/campaigns/<id>/inbox/`, one file per added plan
(maildir-style — atomic by construction, no locks). Any chat, human, or cron drops a plan reference in;
the **Hopper** sweeps the inbox at every plan boundary, runs the shared-file contention check against
the remaining queue, and inserts in dependency-safe order.
_Avoid_: writing the queue directly from a second chat (single-writer ledger); using git as the add
transport (the conflict surface the inbox exists to remove).

**Hopper**:
The autonomous loop that executes a campaign — one chat running `/red-team <plan>` then
`/war <plan> … --afk --ace` over each plan in **Campaign-ledger** queue order, driven by the
`/war-campaign` skill. Default AFK model is **stack-and-plow**: plan N's working branch bases off plan
N-1's landed tip and its PR targets plan N-1's branch (stacked PRs, merged bottom-up; deleting each
merged branch cascades the next onto master). `--wait-for-merge` switches to **base-off-master** (wait
for PR N-1 to merge, base plan N off fresh `origin/master`). Live-appendable via the **Inbox**, swept at
each plan boundary.
_Avoid_: pointing every stacked PR at master (cumulative diffs → shared-doc conflicts — the stacked PR
target is plan N-1's branch); assuming Mode A works overnight (it needs a human merging each PR).

**Write-ahead checkpoint**:
The discipline of updating the resume brief (**CAMPAIGN-STATE.md**) *before* dispatching the thing you'll
wait on — each `/red-team` launch, each `/war` phase, each `--wait-for-merge` wait, and every plan boundary.
Freshness never depends on when compaction fires: the brief already describes *now* before the Lead blocks.
_Avoid_: writing the checkpoint *after* the wait (compaction can strike mid-wait); treating it as
code-enforced (it is a Lead prompt directive — the code-enforced half is **Post-compact re-injection**).

**CAMPAIGN-STATE.md**:
The Lead's curated, uncommitted resume brief — a sibling of the ledger at `.claude/campaigns/<id>/`,
plain markdown, single-writer — carrying queue status, in-flight run/task ids, the continuation sequence,
and gotchas so a fresh context can resume from *now*.
_Avoid_: treating it as the authority — it is a brief *toward* git truth, not the ledger (resume still
reconciles toward git per the ADR 0008 discipline).

**Post-compact re-injection**:
The campaign-gated `SessionStart(compact|clear|resume)` hook that restores **CAMPAIGN-STATE.md** into a
fresh window after compaction — the code-enforced half of survival (paired with the **Write-ahead
checkpoint** prompt directive). Silent and harmless in any session not running a campaign.
_Avoid_: `PreCompact` blocking or summary-shaping to steer compaction — rejected (no trigger, no sensor,
blocking rides into the ceiling); see the ADR.

### Pipeline (outer loop)

**Survey manifest**:
The uncommitted record a survey run leaves at `.claude/aot/YYYY-MM-DD-survey.json` under the **main
checkout**: the specs it created, the issues each addresses, ordering hints, and a consumed stamp. The
cross-session handoff from `/survey-corps` to `/war-machine`, and the first link in
`/aftermath`'s swept-issue evidence chain. Retained after consumption; never committed.
_Avoid_: survey ledger, spec index.

**AI-Commander's Intent**:
The provenance-marked intent heading (`## AI-Commander's Intent`) emitted only by `/war-machine --afk`:
the **single sanctioned exception** to "the Lead never invents intent," checked against predecessor
intent blocks before being committed to, and readable downstream exactly like operator intent. The
heading *is* the provenance record.
_Avoid_: synthetic intent (as a config value); treating it as operator-confirmed.

**Scorched-earth sweep**:
`/aftermath`'s opt-in widened mode: every local branch and worktree is a candidate and unmerged
work is force-deleted after ⚠-flagging. Only the protected core is exempt.
_Avoid_: deep clean, full cleanup (neither names the force-delete semantics).

**Protected core**:
The set no aftermath mode may touch: the current branch + worktree, the default branch, running
sessions' worktrees, and anything referenced by an active run/campaign ledger. Correctness, not
preference — deleting these breaks live state.
_Avoid_: exclusion list, denylist (both sound configurable; the core is not).
