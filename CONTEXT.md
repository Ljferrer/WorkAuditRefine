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
The fail-open polish pass at a would-land phase's **integrated tip**: one worker in a `_polish` worktree
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

**Memory root**:
One of the two directories a lesson can canonically live in: the **repo root** (committable — travels
with clones, merges across users, reviewed like code) or the **local root** (private to one
machine/user, never committed). A lesson belongs to exactly one root, routed by its `metadata.type`
and the redaction lint.
_Avoid_: "the memory dir" (which one?); treating the roots as mirrors (they hold different lessons).

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
