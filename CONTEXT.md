# WAR — Context

The ubiquitous language of WAR (Work · Audit · Refine), a Claude-native orchestration of
worker/auditor/refiner agents over git worktrees and GitHub issues. This file is a glossary
only — no implementation detail.

## Language

### Authoring pipeline (interview → merged plan)

**Plan** (`docs/plans/`):
The pipeline's **one execution artifact** — merged and self-contained. Part 1 is the ratified decision
record (tagged context, pivotal constraints, resolved design tree, the Assumptions ledger, non-goals,
new domain terms · recommended ADRs); Part 2 the Commander's Intent (intent ceiling, plan floor) with
tagged End states, then the decomposed phases and tasks with exact file sets, `requiresTest`, `deps`,
and target repo, carved by the code-boundary decomposition rule. Part 1/Part 2 is prose framing, never
heading nesting — Part 2 keeps the exact H2 headings `/war` extraction reads (`## Commander's Intent`
among them). Produced by one interview run to completion
(`skills/war-strategy/references/plan-interview.md`); hardened by `/red-team`; executed by `/war`.
_Avoid_: a spec + plan pair as current doctrine (the two-artifact split is retired — the
authoring-contract ADR); using `/war-strategy` to validate (war-strategy **converts**, red-team
**ratifies**).

**Spec** (`docs/specs/`):
A standalone decision record, valid as an **input shape** only — `/survey-corps`' AFK synthesis
intermediate and externally-brought drafts arrive in it, and `/war-strategy` converts them into the
merged plan. Answers *what changes and why*; carries no dispatch structure (no phases, waves, or
file-disjointness guarantees); `/war` cannot execute one.
_Avoid_: handing a spec to `/red-team` (a merged plan's Part 1 — not a spec — is its source of truth);
treating a spec as a required predecessor of every plan (the interview produces the merged plan
directly); treating a spec's affected-files list as dispatch-ready tasks.

The pipeline: one interview to completion — `/war-strategy` bare invoke, or the recommended Grill Me
front door when installed — produces the merged plan → `/red-team` validates it → `/war` executes it.
Legacy spec + plan pairs are grandfathered in place; conversion upgrades a pair into one merged plan on
request, never retroactively.

**Evidence tag**:
The per-claim provenance marker every claim of fact in a merged plan (or input-shape spec) carries —
`(user)` · `(verified: <source> at <base>)` · `[assumed: <default> — if wrong: <consequence>]`;
issue-derived facts use `(verified: issue #N (<date>))`. Maps onto the
memory-provenance ladder ([ADR 0007](docs/adr/0007-memory-provenance.md)) — `(user)` ≈ user-confirmed,
`(verified:)` ≈ code-verified, `[assumed:]` ≈ agent-unverified — with deliberately distinct syntax: the
tag grades a plan claim, the tier a memory lesson.
_Avoid_: memory/training as a `(verified:)` source (verify against the live repo, or tag `[assumed:]`);
an untagged claim of fact (a bug, per the provenance gate).

**Assumptions ledger**:
The one required `## Assumptions ledger` section in a merged plan's Part 1 — one row per live
assumption: assumption · basis · blast radius if wrong · check; explicit `None` allowed (the ADR 0017
required-section vehicle). Conversion and AFK paths carry rows forward or retire each with a stated
reason. The first target of `/red-team`'s `[assumed]`-first probes.
_Avoid_: multiple ledgers; retiring a row silently; parking an assumption in prose where no probe reads
it.

**Done-when**:
The per-task `Done when: <command>` slot — required iff `requiresTest: true`, and permitted (not
required) on any other task; otherwise `None — <basis>`. Its End-state sibling rule: every End state carries
exactly one tag from the closed set `check:` | `gate:` | `HARD at audit_sha` (observable + judge seat) |
`backstop:` row.
_Avoid_: a prose promise where a command belongs; a check that still passes with the feature deleted
(vacuous — the delete-the-feature probe); minting a fifth End-state tag.

**Decisive slot**:
One row of the interview doctrine's decisive-slots table: an interview extract hard-linked to where it
lands in the merged plan and which consumer reads it there (validation criteria → tagged End states;
constraints → `## Pivotal constraints`; file footprints → per-task `Files:`; assumptions → the ledger;
new terms → this glossary). The interview's completion bar: an interview with an unfilled decisive slot
has not finished.
_Avoid_: treating a slot as an optional heading; filling one in free prose where its consumer never
reads.

**Executor gate** (authoring):
The final silent gate before the merged plan file is written: *could `/war` decompose-dispatch this,
and `/red-team` attack it, with zero operator questions?* A "no" reopens the interview while question
budget remains; otherwise the residue is default-and-tagged and recorded in the ledger. Runs beside the
provenance gate (the untagged-claim scan — an untagged claim of fact is a bug).
_Avoid_: the run-time **gate command** / gate-audit (those gate merges and lands; this gates
authoring completeness).

**Run-history recon lane**:
The Stage-0 interview recon lane (`skills/war-strategy/references/plan-interview.md`) that reads the
four run-history corpus classes — run manifests (`.claude/war/runs/`) · epic phase reports · the
war-followup corpus · `docs/learnings/` — plus each cited source issue's `## Evidence artifacts`
section. Fail-open: an empty or partial corpus never blocks the interview. What it read (or could
not) lands in the plan's **Evidence consumed block**.
_Avoid_: static recon and the batched memory prefetch (sibling Stage-0 lanes — the repo-tree/ADR
read and the ranked-lesson query; not the run-history lane); treating an empty corpus as a blocker.

**Strategy-verifier seat**:
The adversarial counterweight for the `/war-strategy` interviewer's `Recommended:` beats: one
read-only verifier agent per armed beat, loaded with the run-history corpus, dispatched before the
beat is shown, chartered to refute (`skills/war-strategy/references/strategy-verifier.md`). Arming
is by rule — arm any beat whose wrong branch surfaces only at run time (four arms, enumerated in
the charter) — dispatch-without-asking; skips flow the other way, as **WAIVE channel** rows.
Surviving output rides the beat as one line (`if wrong: <consequence> · caught by: <layer or
NOTHING>`); refute flow is bounded (amend + re-arm once; unresolved = live fork); degradation is
one of three inline stamps (`corpus-empty` · `corpus-partial — missing: <classes>` ·
`unavailable (<reason>)`), never silent and never blocking.
_Avoid_: the audit **Seat** (a roster lens over a task diff — not the interview-beat verifier);
letting the verifier auto-accept, block, or convert a beat on its own.

**Ratified-pin ledger** (`PIN-<n>`):
The artifact-borne record of ratified interview state — the principle, verbatim: state that must
survive to a gate lands in the artifact, not the transcript. Design-tree rows carry ratified
`PIN-<n>` ids (digits-only, matched as a whole right-delimited token — `PIN-1` never matches inside
`PIN-13`; amendment pins mint fresh numbers, letter suffixes are illegal) plus a landing-class cell
(pin→class pairs; a single-class cell covers all row pins), mapped class→section. The advisory
`plan-literal-lint.mjs` checks the map report-only (exit 0); the hard half of the inseparable pair
is gate 1's enumerate-aloud duty.
_Avoid_: the `PIN-` prefix as a skip token (it carries reconciliation join keys only — not the
skip token; that is the **WAIVE channel**'s `WAIVE-<n>`); a fail-closed authoring lint (the lint
stays exit-0; gate 1 carries the hard duty).

**WAIVE channel**:
The skip channel for **Strategy-verifier seat** dispatches: skips are operator utterances, never
interviewer inferences, recorded as artifact-borne `WAIVE-<n>` rows — id · beat · fired arming arm ·
scope · reason — enumerated aloud at gate 1 before the confirm counts, standing class-scoped skips
included. `--afk` runs are armed-by-rule unwaived (no operator can utter a skip), so a `WAIVE-<n>`
row in an AFK-authored plan is a defect. The fired-arm field feeds `/war-review`'s
waive-rate-per-arm telemetry.
_Avoid_: `PIN-<n>` as the skip token (that prefix is the **Ratified-pin ledger**'s join key — not
the skip channel); an interviewer-inferred skip.

**Evidence-artifacts duty**:
The filing-side duty that an issue a WAR surface files carries a `## Evidence artifacts` section —
concrete paths/URLs (for run-filed issues: the pinned SHA, seat lenses, audit round) — so a later
interview's **Run-history recon lane** reads the evidence instead of re-deriving it. Homes on the
filing surfaces (the `/survey-corps` memory-mined issue template, `/war`'s clustered filing
prompt); the ADR 0044 amendment records the decision. Consumption-side, a consumed issue lacking
the section is a named gap the recon lane records — never a blocker.
_Avoid_: the **Evidence consumed block** (the plan-side record of what the lane read — not the
issue-side section this duty places); the per-claim **Evidence tag** (a single claim's provenance
marker in a plan — not the issue-side evidence section this duty places).

**Evidence consumed block**:
The plan Part-1 artifact-borne record of the **Run-history recon lane**'s reads: one row per linked
artifact, read or unread-with-reason. Placement latitude anywhere in Part 1 — never a new required
H2 (extraction surfaces untouched); enumerated aloud at gate 1 before the confirm counts.
_Avoid_: a new required H2 or extraction heading; the issue-side `## Evidence artifacts` section
(that is the **Evidence-artifacts duty**'s surface — not the plan-side block).

**Omittability probe**:
The delete-the-feature probe's dual, run over the End-state enumeration (the Stage-1 falsifier list
and the Stage-4 sweep): for each required outcome ask, "if this had no numbered End state of its
own, could the run omit it silently with every other check still green?" — a yes means the outcome
needs its own row, an explicit backstop row, or an explicit non-goal, never silence.
_Avoid_: the delete-the-feature probe (that catches a check that cannot fail — not the missing-check
dual; omittability catches an outcome with no check at all).

**Oracle duality**:
The authoring rule for vacuously-greenable checks: a `check:` / `Done when:` command whose exit
code can go green vacuously (a bare `grep -q`, a `test -f`) proves success by a decisive printed
token in addition to exit status; the advisory lint's single-signal-oracle rule flags the bare
form.
_Avoid_: exit status alone as the oracle on a vacuously-greenable command; the delete-the-feature
probe (that judges whether the check can fail at all — not the form of its success signal).

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
A Setup-resolved working branch (`dev/<date>-<slug>`, or the flat `war-<date>-<slug>` when a leaf
branch `dev` blocks the nested namespace) auto-created when the desired branch is under
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
when `cmd_ensure_integration` halts on divergence, read skills/war/references/glossary-cold.md

**Orphan adoption** (`record-as-owned`):
when a torn-down run leaves a non-empty partial-phase integration branch, read skills/war/references/glossary-cold.md

**Stale prior attempt**:
when a relaunch push is rejected non-fast-forward, read skills/war/references/glossary-cold.md

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
deliberate pause on an out-of-band merge, cleared by a **human-triggered** resume (there is **no**
background poller — the trigger is the human re-running `/war` after they merge) that reads the *actual
merged SHA*, which must still be reachable on the submodule remote (the branch the PR targeted — not
assumed to be the default branch). When clearing the hold, read the resume sub-procedure (merge
auto-detect, operator-SHA fallback) in `skills/war/references/submodule-flows.md`.
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
phase-resume all share `run.roundLimit` (default 6). One knob, one mental model.
_Avoid_: separate per-loop limits, max-attempts.

**gate-failure class** (`MergeResult.gate_failure_class`):
The orthogonal label on a `gate_failed` — `introduced` | `baseline` | `environment` — that selects the
recovery path: the bounded fix-worker loop, a proceed-with-backstop record, or one bounded
**environment-proceed** re-run (green required — exhaustion hard-escalates the merge site via the
reused `'escalate'` reason, and falls back to `env-blocked` ⇒ `held:land-failed` at the land site,
never a 0-round escalation). Populated by the refiner's on-failure base re-run; absent ⇒
`introduced` (the fail-safe default). **Class routes; status stays `gate_failed`** — the status enum,
`HARD_ESCALATION_REASONS`, and `KNOWN_LAND_DECISIONS` are untouched (ADR 0005 enum discipline; the
finding-`disposition` precedent).
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

**environment-proceed**:
The bounded — exactly **one per gate site** — Workflow-dispatched fresh-env re-run of a gate-failed
merge or land whose failure classified `environment` (`merge:<taskId>:environment-proceed`,
`land:phase-<N>:environment-proceed`). Sibling of the baseline-proceed re-dispatch with the
**opposite gate discipline**: baseline-proceed *proceeds over* named pre-existing failures with
**baseline gate debt** recorded; environment-proceed *re-runs and must be green* — nothing is
pre-existing, so there is no `gate_failing_ids` carve-out and no `source:'auto'` backstop. Never
chained, and exhaustion holds rather than shrugs: a second `environment` classification
hard-escalates the merge site (the reused reason `'escalate'` ⇒ `held:escalation`, so the phase never
completes minus an approved task) and falls back to `held:land-failed` at the land site, with the retry
provably spent ([ADR 0040](docs/adr/0040-environment-class-gate-failures-earn-one-retry.md)).
_Avoid_: any new `MergeResult` status or escalation-reason enum member for it (the existing
`merged`/`gate_failed`/`landed` statuses and the reused `'escalate'`/`'env-blocked'` reasons carry it
end-to-end); a second retry at the same gate site, or chaining it with a **baseline gate debt**
proceed (the bound is structural, not a config knob).

**Defect class** (`defectClass`):
Escalation-record metadata distinguishing the *root cause* of a worker block: a **plan/spec defect** —
tagged `defectClass: 'plan'` when the worker prefixes its `blocked_reason` with the `PLAN-DEFECT:`
sentinel — routes to a `/red-team` plan amendment, while an **implementation defect** (the field
**absent**, never `'implementation'`) routes to fix-rounds / escalation-completion. Orthogonal to the
escalation `reason` and **never an enum member** — it rides the escalation record into the `handoff`
block but never enters `HARD_ESCALATION_REASONS`, `KNOWN_LAND_DECISIONS`, or any land decision (ADR 0005
enum discipline; the same orthogonal-label pattern as **gate-failure class** and the finding-`disposition`
precedent).
_Avoid_: adding a `plan-defect` reason or land-decision member (the classification is metadata, not a
reason); reading an absent field as `'implementation'` (absence asserts no classification nobody made).

### Landing

**Phantom land**:
A land that reports `status:'landed'` while the working ref **never advanced** — the `--no-ff` merge
produced no commit because the integration branch had nothing ahead of the working branch, so
`working_sha` still equals the tip the merge started from and the phase's work is silently dropped.
Refused by the **Land-truth guard** (exit 3, escalate class — never a reland).
_Avoid_: a content conflict or a rejected CAS (nothing conflicted — the merge simply produced no
commit); trusting a `landed` self-report as proof the ref moved.

**Land-truth guard**:
when diagnosing a `land-advance` exit code (2 `[rejected]` / 3 phantom / 6 wrong-HEAD), read skills/war/references/glossary-cold.md

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

**Dead-agent land failure**:
when a land dispatch returns null or an unrecognized status, read skills/war/references/glossary-cold.md

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

**Snipe**:
A **one-shot roster outside a run** (`/snipe`, #1920): 1–5 read-only auditor seats convened on demand
against a diff — no plan, no phase, no refinery, no filing — verdicts reported in chat, informational
only (Critical/Major labeled *would block in a phase*, gating nothing). Seats spawn at the config
tier ladder `agents.snipe` → `agents.auditor` → defaults (shipped default opus/`high`), always `deep`.
_Avoid_: treating a snipe verdict as a phase gate; snipe seats that write or file anything.

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
**default roster's lenses** (the byte-identical default-roster-union fallback). Fires only on 1-seat rosters — a
multi-seat roster the human approved is never second-guessed.
_Avoid_: replacing (rather than unioning away from) the lone seat's lens; widening covens further;
treating the default-roster union as the only source (nomination comes first).

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

**Land-barrier check**:
The refiner-executed run of a claimed `check:`-tagged End-state condition — once per phase at the
integrated tip, between serial-merge completion and the gate-audit pass, unconditionally (it runs in
the no-merged-tasks arm too, so a `requiresTest: false`-only phase still executes its claimed
checks). Each condition tees one artifact to `_refinery/.war/endstate-<phaseId>-<n>.log`, stamped
with the tip SHA it ran at; the gate-audit seats verify from those artifacts — auditors stay
read-only (ADR 0002), the refiner executes everything.
_Avoid_: conflating it with the **Integrated-tip gate re-run** (that re-runs the *gate*, and only on a
phase with intra-phase deps — this executes End-state `check:` commands, on every phase that claims one);
a seat executing a check (seats read artifacts, never run commands).

**`unverified`** (End-state status):
The handoff End-state status for a claimed condition no seat attests — attestation is a POSITIVE
channel (every gate-audit-family seat returns one `endStateAttestations` row per claimed condition:
the condition verbatim, status `met` | `unmet` | `unverified`, evidence), so silence maps to
`unverified`, never `met`. A missing, unreadable, or stale artifact (its stamped tip SHA mismatching
the confirmed tip) also attests `unverified`. Whole-pass absence stays all-`deferred`; findings stay
defect-only (attestation rides the rows, never a finding).
_Avoid_: reading silence as `met` (the failure mode the status exists to close); conflating it with
`deferred` (the whole-pass-absent status) or `unmet` (an attested, evidenced failure).

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

**Claim shape**:
Which of the **four closed evidence categories** a claim under audit falls into — `content-at-pin`,
`execution`, `history`, `authority` — determining the evidence ladder it is judged by
([ADR 0041](docs/adr/0041-audit-evidence-precedence.md)). Closed with a default arm: an unmatched
claim is judged under `content-at-pin` (strictest); if unworkable, a SOFT `cannot-confirm`, never a
new shape. The phrase predates the doctrine: "pick the verb per claim shape" in the mirrored
COMMITTED-TREE GROUNDING clause (`agents/war-auditor.md` + `workflow-template.js`) is its first,
open use — *what kind of question is being asked* — and ADR 0041 closes the set those verbs are
picked against.
_Avoid_: mintable shapes; conflating the `execution` shape with the `execution-evidence` lens (the
shape classifies a claim, the reserved lens judges gate output through it); treating shape as a
finding field (judgment guidance, not schema).

**Evidence rung**:
A surface's rank within **one claim shape's ladder** — e.g. the pinned blob is rung 1 of
`content-at-pin`, the gate-evidence artifact rung 1 of `execution`. The floor rules hold across all
shapes and all bound roles: the working tree and the worker done-report are never any ladder's top
rung.
_Avoid_: a global rank across shapes (rank inverts by claim — a single total order is wrong
somewhere); treating a prefetched lesson as a rung (lessons are priors, never evidence — a
lesson-derived claim is re-grounded at the pin before it may appear in a finding).

**Rule + record**:
The conflict discipline when evidence at two rungs disagrees: the **higher rung rules the verdict**,
and the cross-rung contradiction is mandatorily recorded as a `disposition: note` finding naming
both rungs — signal, never silence, never an automatic escalation. Benign forward-advance stays
benign: the steady-state pin/HEAD mismatch is not a cross-rung contradiction.
_Avoid_: silent-win; escalation-on-contradiction; recording benign forward-advance as a
contradiction.

### Worker tiers (dispatch)

**Docs tier**:
The worker spawn tier for a task whose `Files:` list is entirely `*.md` — mechanically classified
at dispatch (never a plan field), configured at `agents.worker.docs`, default opus. Mixed
docs+code tasks stay on the base worker tier; auditors review docs-tier work at full strength.
_Avoid_: low-complexity flag (nothing is authored); re-tiering mid-flight (the predicate reads the
plan's file list, not the diff).

**Fix bump**:
The optional distinct model/effort (`agents.worker.fix`) applied to fix-round and `--ace` worker
spawns — either direction: a stronger fixer than the first pass, or (the balanced default) an opus
first pass with a faster fable/`low` fixer. Absent = fix work inherits the base worker config
(today's behavior).
_Avoid_: fix model (it's an optional override, not a standing role); splitting ace from fix (one
knob covers both).

**Dispatch semaphore**:
The /war engine's global agent ceiling: with `run.maxParallel` set, one global counting semaphore
caps agent dispatches in flight across the whole run at that many — workers, auditors, aces, fix
workers and gate-audit seats share the one counter, so nested fan-outs cannot exceed it. A permit
is taken at each leaf dispatch, released in a `finally`. Knob absent ⇒ the unthrottled path,
byte-identical. Shape/default: `war-config.mjs` `validate()`.
_Avoid_: `Promise.all` (the live `parallel` NULLS a rejected thunk — the #742 invariant); a
wall-clock pacing guarantee (the ceiling bounds concurrency, nothing more); a per-site cap (nested
sites multiply — issue #1897, the reason there is one counter).

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
When the threaded intent carries an explicit `Mechanism latitude:` clause, "contradicts the slice" is
read against its `Binding guardrails:` list, not against every pinned mechanism literal — a substitution
inside the enumerated latitude that holds the guardrails and End states is in-band; the clause never
waives a check, gate, or backstop (ADR 0017).
_Avoid_: plan literalism as a virtue; latitude as unbounded scope.

**Disposition** (`absorb` | `follow-up` | `note` | `ask`):
The auditor-owned routing of a Minor/Nit finding, orthogonal to severity: fix it this phase (`absorb` —
the per-task ace, or the phase-close sweep when `phaseClose:true`/release-slot-adjacent), file it as an
affirmative issue (`follow-up` — must state why it is not absorbable), record it without filing
(`note` — phase report + servitor feed), or park it as a question (`ask` — see **Ask disposition**).
A fully specified Minor/Nit defaults to `absorb` (in the task diff) or `absorb` + `phaseClose:true`
(outside it); `follow-up` needs a tag from the **Barrier list**. Omitted → Minor becomes follow-up,
Nit becomes note; `ask` is never a default. A failed or ineligible route **demotes one step toward
durability**, logged — per subset under the ace bisection ladder — never dropped silently, while
`demote()` refuses an ask (log + re-route onto `asks[]`); zero unrouted findings on every exit path.
_Avoid_: autoFixable (deprecated legacy alias for absorb); severity as the routing signal.

**Ask disposition** (`ask`):
The fourth, Minor/Nit-only disposition member (#1550; ADR 0013 amendment 2026-08-25): a decision-shaped
finding only the operator can rule, carrying a mandatory question + fork (the decision needed and its
two branches). Minor/Nit-only holds by construction — `dispositionOf` sits behind the severity filter;
Critical/Major findings route via `blockingOf` and never carry a disposition.
_Avoid_: treating an ask as an escalation (it never blocks); machinery defaulting a finding to ask.

**asks[] channel**:
The parked-ask artifact path: the top-level return's `asks[]` beside `minorsFiled` (full finding rows,
exactly-once by finding identity) plus the lossy ninth `handoff.asks` key (question + fork +
task/seat/sha). `demote()` refuses an ask loudly — log() + re-route onto `asks[]`, never
`minorsFiled`/`notes`, never a throw.
_Avoid_: filing from this channel; hardening the refusal to a throw (`held:workflow-error` omits the
handoff — the throw would destroy the parked records the refusal protects).

**Ruled / unruled ask**:
An ask is **unruled** until the operator rules its fork at the Checkpoint; a **ruled** ask carries the
operator's ruling and is minted as an adjudication row (the third producer) in standing-row format.
Its fully-specified fix **executes in-run** (next-phase decompose injection, or the final phase's
polish-style dispatch); it files Lead-side with filing parity (`## Evidence artifacts` + dedup against
engine-filed rows) **only** on cannot-execute or execution-failure, the ruling recorded either way
(ADR 0013 amendment 2026-08-27).
_Avoid_: treating the `--afk` no-match demotion (follow-up, question preserved) as a ruling; reading
filing as a ruled ask's default outcome (it is filing-on-non-execution).

**Never-filed-unruled**:
The filing law: an unruled ask is excluded from in-phase consolidation and the `file-followups`
dispatch, and the Lead never re-adds one — filing happens only after a ruling.
_Avoid_: "park it as a follow-up for now" (the decision-free filing the channel exists to prevent).

**Strike-list ruling gate**:
The ONE Checkpoint gate that rules all parked asks in a single pass — one row per ask (question + fork +
task/seat/sha) — behind the **absolute advance floor**: the DAG never advances over an unruled ask.
Interactively a hard wait; under `--afk` an adjudication match resolves by citation, a no-match demotes
to follow-up with the question preserved, and suppression rows are minted only from operator rulings.
_Avoid_: per-ask mini-gates; any severity, count, or staleness exception to the floor.

**Grind measurement**:
The #1664 backstop's read of decision-shaped round-grinding from three terminal sources — manifest
`phases[].dispatches.fixRounds`, the filing site's audit-round field, and `minorsFiled` rationales —
coarseness named: round-level attribution does not exist.
_Avoid_: inventing per-round attribution the record does not carry.

**Failure-routing asymmetry**:
The grind backstop's load-bearing property: an ambiguous reading routes to #1664's
instrumentation-first refinement (a per-round `auditLog` row), never to a silent "no grinding".
_Avoid_: reading ambiguity as absence of grinding.

**Pin transfer**:
An audit approval carried to a new SHA by a mechanical predicate, not a re-convened panel (canonical:
`pinTransfers` in `skills/war/assets/workflow-template.js`). *Seat-approval transfer*: a wave-side
ace whose git-derived file set (`ace_diff_files`) is a subset of the findings' file set re-runs only
the originating seats; the rest transfer to the ace sha. *Rebase pin transfer*: at the merge slot, a
conflict-free rebase plus `git patch-id --stable` equality of the task's own diff, before and after,
carries the panel pin to the rebased tip. Neither accounts an approval at a SHA the gate never
passed; a mismatch degrades to the in-lock full panel for that task alone.
Arms and shape: `skills/war/references/schemas.md`.

**Ace bisection**:
The regression-recovery ladder on a failed `--ace` batch (canonical: `aceBisect` in
`skills/war/assets/workflow-template.js`, dispatched wave-side per task, never inside the merge lock):
named culprits are excised (demoted, logged) and the remainder re-applies as ONE subset; blind halving
is reserved for ambiguous attribution; subsets apply serially at the tip, depth ≤ 2, same-file findings
never split; each subset commit charges one `absorbRounds` slot of the task's **Absorb budget** (reverts
uncharged, `fixRounds` never charged) and dispatches only while `absorbRounds < run.absorbRounds`. A
spent budget mid-bisection stops the ladder and the still-queued subsets ride to the phase-close sweep as
absorbs (`routeToSweep`, `phaseClose: true`), logged and by design; the same budget gates the batch ace
and **Re-entry**. Failed subset tips are
forward-reverted in-loop; only finally-failing subsets demote; the ladder never holds or escalates a
mergeable task.
_Avoid_: whole-batch demotion (retired); demoting a never-re-audited subset on a spent budget (retired —
it rides to the sweep; only a subset that failed its own re-audit demotes); git-bisect (this is
finding-subset re-application, not a history search).

**Re-entry**:
The budget-bounded return of the ace ladder for a fresh `absorb`-dispositioned finding born at a
WAVE-SIDE re-audit (plain, bisection-subset, or a re-entry batch's own), dispatched as another
ace-style batch on the same machinery (canonical: `aceReentry` in
`skills/war/assets/workflow-template.js`), **never a new round type or status member**. The
**Absorb budget** (`absorbRounds < run.absorbRounds`, the per-task ace meter separate from `fixRounds`)
is their SOLE bound. A fourth source, the **merge-slot pin-transfer mismatch re-audit**, never re-enters:
its absorbs route straight to the sweep (`routeReauditMinors`' `noReentry` opt), never
budget-gated. Budget spent ⇒ the finding routes `phaseClose: true` to the sweep ⇒
sweep-discard ⇒ carried on `carriedPhaseClose` (non-final phase) or `follow-up` (final); a forward-reverted finding never re-enters (the oscillation bound);
every demotion is logged. Re-entry rounds inherit the **Ace-Subset trailer** discipline and the
tip-preflight idempotency verbatim
([ADR 0013](docs/adr/0013-commanders-intent-and-disposition-routing.md) amendment 2026-08-27).
_Avoid_: charging `fixRounds`; treating the budget as a soft target (it is the stop condition);
reading it as bounding the merge-slot source.

**Absorb budget**:
The per-task ace meter, separate from `fixRounds`: the knob `run.absorbRounds` (integer ≥ 1, default 6,
validated like `run.roundLimit`) bounds the counter `r.task.absorbRounds`, charged once per ace-side
COMMIT (batch ace, re-entry batch, bisection subset; the terminal pass once it lands) and never by
reverts, re-audit panels, or fix rounds. All three ace gates read `absorbRounds < run.absorbRounds`;
a spent budget routes the rows to the phase-close sweep as absorbs, logged and naming the counter
(at the batch ace only when no Critical/Major blocker is open; open blockers hold the rows on
`r.task.pendingAbsorbs` for the next approve, regardless of budget).
Every ace-side commit carries the trailer `Ace-Charge: <task>:<n>` (n = the counter after the charge),
and a relaunch seeds the counter from the highest trailer index on the task branch (the phase-start
barrier's `absorbCharges`), 0 with a loud log on error or absence. Supersedes the retired reserve
arithmetic on `fixRounds` (ADR 0013 amendment 2026-09-03); `fixRounds` counts blocking fix rounds and
floor retries only.
_Avoid_: an ace-side commit that charges `fixRounds`; reading a revert as a charge; a second meter.

**Exclusion set**:
The phase-close sweep's union of foreign-owned files and release-slot files: the files of every
`args.sweepExclude` entry (the Lead's slug-attributed campaign contention list) ∪ the `Files:` of every
task whose status is not `merged` ∪ `RELEASE_SLOT_FILES`, both sides `aceRelPath`-normalized. A queued
absorb whose file is in the set demotes to `follow-up` with a reason naming the owner — the entry's plan
slug, the task id, or "the release slot" — and every demotion is logged. The seat never decides
exclusion; the engine applies the set at sweep time.
_Avoid_: a seat-side exclusion judgment; a prose or size estimate in place of the file-set match.

**Barrier list** (`BARRIER_TOKENS`):
The closed enum a seat cites in a finding's structured `barrier` field to route a fully specified
Minor/Nit away from its `absorb` default: `barrier:release-slot` (a release-slot file),
`barrier:underspecified` (the fix is not fully specified), `barrier:rationale-comment` (the fix removes or
edits a `ponytail:`/deliberate-mirror rationale line), and `barrier:trade-off` (a nameable trade-off — routes
`ask`, never `follow-up`). Three follow-up barriers plus one ask route; canonical in
`skills/war/assets/land-decision.mjs`, hand-mirrored in `workflow-template.js`, body in
`skills/war/references/disposition-eligibility.md` (ADR 0013 amendment 2026-09-04). A scope argument is
never a barrier, and the why-not-absorbable prose stays free text beside the tag.
_Avoid_: a prose barrier; a fifth member minted on a card; the engine estimating fix size.

**Demote reason prefix** (`DEMOTE_REASONS`):
The closed prefix enum every engine `follow-up` demotion cites, canonical in
`skills/war/assets/land-decision.mjs`, hand-mirrored in `workflow-template.js` (mirror-registry row and `F07`
registration). Twelve members: `demote:absorb-regressed`, `demote:absorb-blocked`, `demote:fileless`,
`demote:task-unapproved`, `demote:sweep-skipped`, `demote:sweep-discarded`, `demote:terminal-pass`,
`demote:exclusion-set`, `demote:release-slot`, `demote:floor-skipped`, `demote:ask-unruled-afk`, and
`demote:unclassified`. `demote()` validates every `follow-up` reason at runtime; a miss prepends
`demote:unclassified` with a loud log, never a throw. Each engine-filed issue body carries the prefix on its
`Demote-Reason:` line, and `/war-review` tallies `demote:unclassified` as a defect signal. A failed ATTEMPT
(an untouched file, a dead ace worker, a red gate at the ace tip) and an ace-off run route the row to the
phase-close sweep instead of demoting (ADR 0013 amendment 2026-09-04, Phase 4).
_Avoid_: an unprefixed `follow-up` demotion; a prefix minted outside the enum; reading a member as a
`HARD_ESCALATION_REASONS` or `BARRIER_TOKENS` member.

**Absorb-by-citation**:
An `--afk` ask resolution whose ruling is a quoted standing operator-ratified adjudication row and
whose outcome is an **executed absorb**, run through the **Re-entry** vehicle. **Match strictness**:
the row must cover the finding's NAMED trade-off, never merely its topic — ambiguity is NO-match and
demotes (the demotion is the consequence of the rule, never a substitute for it). **Soundness duty**:
the re-audit panel verifies the cited row covers the trade-off; an unsound citation is a **blocking**
finding — the batch forward-reverts and the finding demotes naming the mismatch. **Record**: the
durable record (the ace commit message and the `aced` row) carries the row-id plus a one-line match
rationale — presence is the floor, format is latitude — and feeds `/war-review`'s citation-resolution
telemetry. Matching is panel judgment charged in the prompt, never engine-side matching; `--afk` still
never mints a standing row (ADR 0013 amendment 2026-08-27).
_Avoid_: topic-level matching; an engine-side matcher; a citation recorded without its row-id or
rationale; minting a standing row under `--afk`.

**Ace-Subset trailer**:
The deterministic commit trailer (`Ace-Subset:` key) every bisection-subset commit carries; each subset
dispatch preflights the **bisection range** (never the tip alone) for it and returns the existing sha
without committing on a hit — the resume-idempotency contract.
_Avoid_: tip-only preflight; pinning the value shape (latitude — the key is the contract).

**Phase-close coherence sweep**:
The fail-open polish pass at a would-land phase's **integrated tip**: one worker in a `p<N>-polish` worktree
fixes ONLY the queued `phaseClose` absorb findings, a full default-roster panel re-audits the polish SHA,
and the refiner merges it at the serial queue's tail — or **discards** it (branch + worktree left in
place; queue carries on `carriedPhaseClose` (non-final phase) or demotes to follow-up (final)) and the pre-polish tip lands exactly as it would have. It may only
improve the tip; a discarded sweep recomputes nothing.
_Avoid_: cleanup phase; ad-hoc seam hunting; treating a discard as a failure that holds the land.

**sweep-raised finding**:
A finding the phase-close re-audit panel raises against the polish commit itself, not a queued
`phaseCloseQueue` finding the sweep drains; Minor/Nit route by disposition at sweep close
(Critical/Major keep today's blocking visibility): on the merged arm an absorb joins the terminal
pass, on the discard arm it rides the carried queue (non-final phase) or demotes `demote:sweep-discarded`.

**Terminal pass**:
The one-hop ace commit plus one re-audit seat after the polish merge (ADR 0012 successor of the
merged-sweep demote arm): the polish panel's absorbs plus what the sweep left unlanded, filtered
through `aceEligible`, land as ONE `Ace-Charge` commit at the post-polish tip; a regression is
forward-reverted, then the rows carry (non-final) or demote `demote:absorb-regressed` (final); an
unlanded or seat-raised absorb demotes `demote:terminal-pass` (final); it
convenes with `run.ace` off and never budget-blocks.
_Avoid_: a second pass; reading its charge as a gate; a release-slot file in its commit.

**Carried queue**:
The absorb rows a phase could not land and did not demote — a held phase's whole queue, a non-final discarded
sweep's absorbs, a non-final terminal pass's rows — emitted top-level as `carriedPhaseClose` on the
phase return (always present, `[]` when nothing was carried, so absence is never ambiguous) and
threaded back by the Lead as `args.seededPhaseClose`, where they drain into the relaunch's sweep queue.
_Avoid_: reading absence as empty; demoting a held phase's queue; a carry inside the handoff block.

**truncated gate log**:
A captured gate log whose bash half aborted at the first red suite (some per-file headers, not
all discovered suites); the D7 enumeration-conditional treats post-abort mapped paths as SOFT
cannot-confirm, never HARD.

**Retired-token sweep**:
when a landed phase closes and the retired-token judgment fires (a land/merge/escalation mechanism was retired, renamed, or consolidated), read skills/war/references/glossary-cold.md

**Dep-wave visibility**:
The mechanism by which a task's declared `deps` grant **code visibility**, not just ordering: the
worker's first action is `git rebase <integrationBranch>` in its own worktree (a pure fast-forward on
first dispatch), so its base includes the merged dep content. Same-repo deps only — `gitlink-bump`
tasks are excluded (their dep merged into the submodule repo). Doctrine: dependency ⇒ **wave** edge;
phase edges remain for what must be *landed* first.
_Avoid_: repin/reset scripts (never-reset-on-reuse stands); dependency ⇒ phase edge as the default.

**Clean handoff**:
The end-state a phase owes the next: a tip whose quality debt is **zero or enumerated and intentional**
— every finding absorbed (commit-cited), filed (issue + why-not-absorbable), noted (report), or parked
as an ask (question + fork — ruled at the Checkpoint strike-list gate, never filed unruled) — plus a
machine-readable `handoff` block (`{ tipSha, polish, absorbed, followUps, asks, notes, endState,
intentPresent, backstops }`) emitted on `landed`, `held:escalation` and `held:land-failed` for the
next phase's decompose — a held land forfeits the land, not the filing fidelity.
_Avoid_: follow-up issues as the default disposal; a handoff block on `held:workflow-error` (infra
death has no trustworthy return to render).

**Drain cause**:
The stamped reason a demoted absorb finding was fail-open-routed to follow-up — recorded per
finding when a phase-close polish dispatch dies, so the drain is attributable instead of a bare
follow-up dump. Emitted by `workflow-template.js`'s phase-close polish-dispatch drain path; the
field name is engine-owned.
_Avoid_: disposition (the stamp records *why demoted*, never the route chosen); reading a missing
stamp as a clean route.

### Test discipline

**Test floor**:
The deterministic guarantee that a task which *requires* a test changed at least one test file in
its diff, enforced by a tested shell assertion at merge-task. The coarse *floor* (a test exists) is
distinct from the auditor's semantic *ceiling* (it is the right test, exercises the slice, is not
weakened or skipped).
_Avoid_: test coverage, test gate (the gate runs the suite; the floor inspects the diff).

**test-floor pattern** (`overrides.testPattern`):
The glob set the **Test floor** matches a task's diff against, pinned at Setup *together with* the gate
so floor ⊆ gate holds on any target repo, then **resolved per phase** (see **Pending testPattern
proposal**). Threaded end-to-end like `plan.gate`, never parsed out of the gate command (the globs live
in the target's test-runner config, not the command line). The gate's unconditional `*.test.sh`
discovery is always unioned in; `null` (default) = the built-in WAR-repo gate-mirror defaults,
byte-identical to today.
_Avoid_: deriving it by parsing the gate command; pinning a pattern independent of the confirmed gate
(floor ⊆ gate is one decision).

**Pending testPattern proposal**:
A Setup-proposed **test-floor pattern** the `--afk` sanity floor rejected (it had zero-match tokens),
recorded verbatim in the ledger and re-checked at each phase launch until adopted (or closed — a
validator-failing proposal cannot self-heal and is never re-checked). Adoption is
monotonic (`null` → the Setup proposal, once, for that and every subsequent phase) and never a fresh
interactive ask — it is why `overrides.testPattern` is *per-phase-resolved* rather than decided once
per run.
_Avoid_: treating the Setup confirmation as the final word on the value; minting a new pattern at
re-check time (the pending proposal is the only adoptable value); reading the ledger note as a resume
authority (git > labels > ledger).

**Near-miss diagnostic**:
when a `no-test` result carries a `floor_diagnostic`, read skills/war/references/glossary-cold.md

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

**done-unmet route**:
when `assert-done-when.sh` returns the `done-unmet` floor route, read skills/war/references/glossary-cold.md

**`mappedTests`** (`MergeResult.mappedTests`):
The mechanical definition of "mapped test": every test path `assert-test-in-diff.sh` matched in the
task diff, printed on its exit-0 stdout (one per line — an accumulating scan, never first-hit) and
captured by the refiner into the MergeResult. The gate-audit seat greps them against the captured
gate-evidence artifact, so the HARD "provably unrun mapped test" trigger is mechanical, never
judged — HARD only where the captured log ENUMERATES test file paths (the bash half's per-file
headers); a zero-hit grep against a titles-only `node --test` half is SOFT cannot-confirm, never a
hold (the round-3 enumeration-conditional).
_Avoid_: inferring mapped tests from the diff or from prose; treating an empty list on a
`requiresTest: false` task as a defect (no mapped tests ⇒ the gate-audit HARD path is vacuous
there); holding on a zero-hit grep against a non-enumerating log half (the pre-narrowing false-hold
— it proves nothing about that path).

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

**Guard-split deps edge**:
The mandatory `deps` edge a drift-guard task must carry onto the same-phase task that authors the fact
it guards, when file-disjointness forces the guard into a different task. Same phase and same wave are
insufficient alone — every task worktree is cut from one frozen phase base at Provision, so an unedged
guard task is audited against a base that predates the fact it guards, through no fault of its diff
([ADR 0025 amendment](docs/adr/0025-drift-guard-discipline.md)).
_Avoid_: treating shared-phase or shared-wave placement as sufficient by itself — only the `deps` edge
forces the guard task's rebase to include the fact-authoring task's landed content.

**Touched-doc accuracy duty**:
The authoring trichotomy (`/war-strategy` §3 authoring rule 8; ADR 0025's 2026-08-19 amendment): a task
whose slice rewrites a doc owns the factual accuracy of what it renders authoritative — for every fact
derivable from a machine-readable in-repo source (config/manifest/enum/version slot, never prose claims
generally) the plan picks **guard** (a drift test binding doc value to source), **de-mirror** (the doc
points at the source), or **explicitly defer** (a legitimacy-complete backstop row — named runner +
timing), never silence. Reference text: `skills/war/references/touched-doc-accuracy.md`.
_Avoid_: treating a silent restatement as a follow-up (it is a plan defect), and never stretch the duty
to general prose claims — those stay governed by the evidence-tag discipline (D4).

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

**env-gap finding**:
A probe finding flagged `envGap: true` — recording a PROVISION-STEP failure inside an executed probe's
own sandbox (the setup broke; the artifact under test did not). `classify()` demotes it to an
informational Minor regardless of severity or probe status, checked adjacent to and after the
`deliverableAbsence` flag (a finding carrying both demotes via `deliverableAbsence` first). `needsDecision`
is not cleared by the flag — a self-declared ambiguity still blocks.
_Avoid_: conflating it with /war's **`env-blocked`** — that is a per-task *provisioning* outcome (the
worker is never spawned); an env-gap finding is a /red-team probe-*result* flag (the probe ran to
completion and reports the broken environment as a note).

**Sandbox-escape guard**:
The deterministic post-run check (`assert-no-repo-escape.sh`, floor exit contract 0/1/2) that no executed
probe mutated the real repo working tree or pushed a junk remote ref. Runs between the Workflow return and
the gate; a positive result routes the verdict through the self-confound gate (ADR 0020), never `CLEARED`
until the state is clean (a provenance-cleared foreign delta is clean state and does not block `CLEARED`).
The hardened `git -C` scope-lock is prevention (Layer 2); this guard is the detection authority (Layer 3).
_Avoid_: "cleanup", "sandbox jail" — it is detection, not confinement; the agent-type probe jail is a
recorded non-goal (D6).

**Ref-diff baseline**:
The pre-run ref-set snapshot `assert-no-repo-escape.sh --snapshot` writes outside the `--repo` working
tree (the full local `git for-each-ref` set) — the exact half of the post-run `--baseline` check: a
name-agnostic diff over `refs/heads/`/`refs/tags/` that closes the #1244 pattern-slipping-branch hole a
name allowlist could not, and that excludes `refs/remotes/*` (which moves on an ordinary `fetch`).
_Avoid_: conflating it with the unconditional pre-run local-integrity refusal (clean porcelain, no
junk-pattern ref) — that refusal runs first and blocks baselining pre-existing residue; the baseline
file is the separate artifact the post-run diff compares against.

**Adjudication**:
An authoritative resolved ruling threaded to audit seats as an `args.adjudications` row — produced by
the red-team report's `## Adjudications` block (version literals and grill decisions), by the
Lead at the decompose gate / an escalation adjudication (scope deltas routed to follow-ups), **or** by
the Checkpoint's ask rulings (each ruled ask minted as a row at the strike-list gate). Auditor
scoring keys on it: version precedence (task instruction > red-team adjudication > plan body literal)
and the adjudication-match confirmation-note rule.
_Avoid_: "override", "waiver" — a row records a ruling already made and routed; it never waives a gate,
floor, or backstop (ADR 0017), and a row is **never mined from arbitrary prose** — rows come only from
the three named producers.

**ADJUDICATED (verdict)**:
The gate's fifth, distinct, gate-emitted terminal verdict: every blocker/`needsDecision` is patched and
carries an adjudication row, but at least one was not re-proven by a probe re-run — a proceed verdict,
never a `CLEARED` synonym ([ADR 0043](docs/adr/0043-adjudicated-clear-distinct-terminal-verdict.md)).
Precedence: `INCOMPLETE` > `BLOCKED` > `ADJUDICATED` > `CLEARED-WITH-NOTES` > `CLEARED`; a run with
zero blockers/`needsDecision` can never emit it.
_Avoid_: "CLEARED by adjudication" or other Lead-invented prose — the verdict is emitted by `verdict()`
alone, never hand-written, and it always means at least one finding stayed probe-unverified.

**Adjudicated flag**:
The typed per-finding `adjudicated: true` the Lead stamps on a finding object in the gate-input working
copy at grill time, then re-pipes through the gate via `--stdin` — the only channel by which adjudication
reaches `verdict()`.
_Avoid_: a string `'true'`, a truthy value, or NLP over finding text — the gate reads a strict boolean
`=== true` on the finding itself, matching the `deliverableAbsence`/`envGap` typed-flag pattern.

**Adjudication provenance marker**:
The per-row `operator-ratified (<date>)` / `AI-declared` token every row of a report's `## Adjudications`
block carries (ADR 0014 family) — finer-grained than the heading-level intent marker, because one run
can mix operator rulings with Lead self-adjudication (`--afk`) inside the same report.
_Avoid_: a block-level provenance stamp — the marker is per-row precisely because a single report can
mix operator-ratified and AI-declared rows side by side.

**topology-void**:
A plan clause anchored on git topology that does not exist under WAR's fast-forward per-task merges (a
per-task merge commit, its `^1` parent, a non-empty post-merge three-dot diff). The `ff-topology` executed
probe classifies it — error, wrong-commit resolution, or degenerate/empty diff for the claimed anchor.
_Avoid_: conflating with a merge *conflict* — the anchor is void, not contested.

**analyzed-agent fallback**:
The red-team scaffold's sticky re-route of analyzed probes/confirms from the preferred read-only agent
type to `general-purpose` when the harness lacks the preferred type: the FIRST dead preferred dispatch
pins the whole run (#890), and every later analyzed dispatch routes to `general-purpose` proactively —
not a per-item re-dispatch. The Lead's SKILL.md Step-3 pre-flight can pre-empt it entirely by passing
`analyzedAgentType` up front; the pin is the in-run backstop when the Lead doesn't (or can't enumerate
the registry).
_Avoid_: "capability check" — the scaffold fallback is reactive (detect the first dead dispatch, pin,
re-route), never itself a pre-flight harness query (that is the separate Lead-side Step-3 check).

### Red-team loop budget & route-upstream (ADR 0045)

**Loop budget**:
The cumulative bound on `/red-team` grill rounds per plan — `run.redteamRoundLimit` (integer ≥ 1,
default 3, economy preset 2), resolved by Step 3's fail-open config read (absent or invalid ⇒ the
default 3 — the limit is never unset, config only overrides it). A **round** is one full grill sweep
over the open blockers/`needsDecision` set, counted cumulatively across invocations via the Rounds
header seed and threaded into every gate computation as `--rounds=<n> --round-limit=<resolved>`.
_Avoid_: `run.roundLimit` (the /war retry budget — a different knob); "round" for the per-blocker
bound (that unit is **re-verify attempts**, ≤ 2 per blocker — never rounds).

**Rounds header**:
The dedicated report line `**Rounds:** <integer>` directly under the Verdict line — the
cumulative-round carrier across `/red-team` invocations. Step 1 seeds from it by the strict-form
rule: glob `docs/red-team/*-<plan-slug>.md`, take the newest by filename date, read its first line
matching `^\s*[-*]?\s*\*\*Rounds:\*\*\s*(\d+)`. Anything else — absent, non-matching, non-integer,
every legacy variant — seeds 0: fail-open, clean slate. The Lead reads reports; the gate stays
integers-only and never parses markdown.
_Avoid_: NLP-mining a count from report prose; treating a legacy variant (`**Rounds: 4**`, an
unbolded `Rounds:` line) as a seed — the strict form is the only one read.

**Route-upstream**:
when a red-team gate returns `routeUpstream: true` or a campaign halts `redteam-route-upstream`, read skills/war/references/glossary-cold.md

### Guard coverage by equivalence class (ADR 0031)

**Traversal equivalence class**, **Verb equivalence class (absence guard)**, **Subtree-anchored
search root**, **Floor⊆gate parity**, **Precondition marker**:
when scoping a guard to the class of shapes rather than the one instance that bit us, read
skills/war/references/glossary-cold.md

### Live artifacts over stack-fragile literals (ADR 0030)

**Construct locator**, **Stack-fragile literal**, **Defined-but-not-yet-emitted slice**, **Grep as
floor**, **Stale-looking-but-correct calibration**:
when a plan or prompt restates a value the live artifact already carries, read
skills/war/references/glossary-cold.md

### Engine ingest guards & provision exit-code contract (ADR 0034)

**Ingest guard**, **Undefined-render guard**, **Provision exit-code catalogue**, **Empty-orphan
reclaim**, **Dispatch kind**, **Deliberately-unwired marker**:
when a hand-built dispatch renders wrong, or a provision exit code needs reading, read
skills/war/references/glossary-cold.md

### Gate composition & spec-truth guards (ADR 0036)

**Gate composition point**, **Spec-truth guard**, **Posterity corpus**, **Verb-scan placement
census**:
when composing a gate string, or guarding a doc claim against its spec, read
skills/war/references/glossary-cold.md

### Run-scoped staged phase scripts (ADR 0037)

**Staged phase script**:
The run-scoped, identity-stamped copy of `workflow-template.js` the Lead dispatches for one phase —
basename `war-[c<K>-]<planSlug>-p<N>.js` under `$MAIN/.claude/war/runs/<runId>/` (a directory sibling
of the run manifest, same main-checkout anchor idiom, riding the existing `.claude/` exclude),
produced by `stage-workflow.mjs` (**defined-but-not-yet-emitted as of this entry; produced in Task 1.1,
same phase** — see [ADR 0037](docs/adr/0037-run-scoped-staged-phase-scripts.md)). The stager makes
**exactly-once**, pre-dispatch substitutions as pure literals — the Workflow sandbox has no shell/fs
to compute them: always the two `export const meta` anchors (`name`/`description`), and, when
`--args <file>` is passed, an **optional third** — the template's string-arm args fallback tail,
rewritten so the staged copy falls back to a prelude carrying the validated phase-args object, which
lets an assembled payload too large to ride the Workflow tool call travel with the script instead
(dispatched args, when passed, still win). It fails loud on a missing or duplicated anchor rather
than forking silently onto the wrong text.
**Write-if-absent**: an existing staged file *is* the run's script and is reused byte-untouched
(approved stage injections and journal-replay identity survive a resume or a same-day recovery
relaunch); a deliberate `--force` overwrites it with a fresh substitution from the shipped template.
Retention is **manifest-equivalent** — kept, never reaped, doubling as dispatch provenance for
`/war-review`. The **sole sanctioned home** for approved stage injection (superseding an edit to the
shipped template directly); `Workflow({ scriptPath, resumeFromRunId })` resume dispatches the **same**
staged path the launch used.
_Avoid_: dispatching `assets/workflow-template.js` directly (loses the per-phase display identity —
the harness renders the workflow-list title from the dispatched script's own basename); editing the
shipped template to inject an approved stage (the staged copy is now the sanctioned home); treating a
same-`runId` restage that reuses the existing file as a bug (same phase ⇒ same basename ⇒ benign reuse
by construction).

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
session auto-load file) — a two-column router (`[[slug]]` + summary cell), one row per hot lesson,
capped by *selection* (archive candidates) **and per-cell budgets** (the cell budget). Both are
view-mechanisms: neither drops knowledge, which stays whole in the lesson files (deep recall is the
`query` path, not the projection). Generated-only: no process or person edits it in place; writers write
lesson files and the projection is re-rendered atomically. The repo root carries no projection — a
committed generated file is a merge-conflict surface.
_Avoid_: "the index" as a hand-maintained file; compaction (the projection is regenerated, not
trimmed); a committed copy; reading a terse or truncated row as lost detail (the row routes; `query`
retrieves the full lesson).

**Cell budget**:
The per-cell render cap on a projection row's summary cell (`SUMMARY_CELL_BYTES`) — a *view-only*
truncation: the lesson file keeps its full text, only the row's rendering is bounded, and the trailing
provenance tier / `[repo]` markers are never cut (the `safe-swap` extractors and row classifiers key on
them). One of the index projection's two cap mechanisms; the other is *selection*.
_Avoid_: treating a capped cell as lost content (the file is intact; `query` returns it in full);
conflating it with the advisory line (the cell budget caps one cell, the advisory line caps the whole
projection).

**Advisory line**:
The index projection's advisory byte ceiling — the soft WARN threshold that sits below the hard
render-refuse cap. It is the **default tighten trigger** (crossing it is the signal to run a tighten
pass) and the **default exit target** (a tighten pass runs until the projection is back below it); a
stricter operator-supplied `--target` becomes both for that one invocation. The projection's normal
operating ceiling.
_Avoid_: conflating it with the hard cap (the hard cap *refuses* the render; the advisory line only
warns and invites tightening); treating it as trigger-only (it is equally the exit target); reading a
*looser* `--target` as raising it (a target above the advisory line never suppresses the advisory warn).

**Tighten pass**:
The operator-gated projection-shrink mode (`/lessons-learned tighten`): triggered at the **effective
target** — the advisory line by default, a stricter `--target` when the operator supplies one — and
exits once the projection is back below it. One destructive phase behind a single strike-list approval,
with a loud shortfall report when the approved strikes still miss the target. Always operator-invoked —
the system only ever *suggests* it, never self-runs.
_Avoid_: an auto-run or cron (tighten is only suggested); a per-lesson re-ask loop (one strike-list gate,
then a shortfall report); equating it with the bare `/lessons-learned` housekeeping pass (that pass stays
local-only — tighten is this skill's sole repo-side actor, and only through its gate + PR).

**Usage-scored eviction**:
The tighten pass's ranking of eviction candidates by *ascending* query-log hits, behind hard floors that
make a lesson ineligible: `user-confirmed` tier, concept hubs (≥2 inbound citers), and lessons created or
recurrence-stamped within the last 8 days. When the query log is silent the ranking degrades to the
tier + age eviction order; the floors still apply. Nothing is blended into a weighted composite.
_Avoid_: reading zero hits as zero value (the log records WAR prefetch/seat queries, not the operator's
own reading — the floors and the gate are the counterweight); a weighted score (hits *rank*; floors
*gate*; nothing is summed).

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

**Graduation candidate**, **Concept hub**, **Link trichotomy (HOT / COLD / MISSING)**,
**Non-destructive default (`--candidates`)**:
when running the `/lessons-learned` housekeeping pass over a memory store, read
skills/war/references/glossary-cold.md

**Finding-match check**:
The servitor's obligation to re-confirm that an audit finding's *named construct* (the specific defect,
not merely the file) still matches at the landed tip before recording it as a live gotcha — match →
`code-verified` with the file/line locate-cue; no match (fixed in-flight) → the generic pattern at
`agent-unverified`, never a live file/line. Extends verify-on-write (which checks referent *existence*
only) ([ADR 0029](docs/adr/0029-capture-grounds-on-committed-tip.md)).
_Avoid_: recording a stale audit-log finding's file/line as a current instance (the log outlives the
fix round that resolved it); conflating file-exists with finding-still-matches; assuming the wrap-up
cwd is the committed tip (ground on the threaded landed-tip anchor via the grounding ladder instead).

**Committed-tree grounding**:
Resolving an "already-done" / verify-and-close no-op claim against a pinned committed SHA
(`git show <audit_sha>:<path>` for a blob, `git log -S/-G` for history) rather than the working tree, so
a transient uncommitted edit cannot fabricate the verdict; the working-tree grep is advisory only. The
auditor allowlist is **not** widened — `git grep` stays denied
([ADR 0029](docs/adr/0029-capture-grounds-on-committed-tip.md)).
_Avoid_: grepping the dirty working tree as the sole basis (a reverted edit lies about the committed
tree); assuming `git log -S` answers "is the token present at the path" (it answers "when did the count
change").

**Seed set**, **Seed candidate**, **Warm-seed**, **Seed archive**:
when packing, nominating for, or warm-seeding the portable `docs/seed/` corpus, read
skills/war/references/glossary-cold.md

### Prompt-surface budgets (ADR 0042)

**Surface budget**:
The advisory/hard byte pair a prompt-bearing surface may not exceed, test-enforced: crossing the
advisory line warns, crossing the hard line is a red test. Lowering a budget is a normal PR; raising
one requires ADR 0042's named justification in the commit body.
_Avoid_: treating advisory as blocking; raising a hard line without the ADR's justification rule;
budgeting `references/` (cold storage is unbudgeted, like `archive/`); not the index projection's
**Advisory line** (a different mechanism, different caps).

**Budget-Raise trailer**:
The machine-checkable citation a merge diff must carry when it *raises* any `hard:`/`advisory:`
ceiling constant in `prompt-surface-budgets.test.mjs` — a `Budget-Raise:` commit trailer citing
ADR 0042, the surface, and the byte delta (exact form: `assert-budget-raise-cited.sh`, a landed
merge-path floor that refuses an uncited raise). Ratchet-downs need no trailer.
_Avoid_: prose justification alone (the floor greps the trailer, not the commit body's argument).

**Prose temperature**:
A block's branch-frequency tier — every-phase / once-per-run / branch-gated / incident-only — i.e.
how often a window pays for the text unused that turn. Only tier-1 (every-invocation) doctrine stays
inline; everything rarer lives in `references/` behind a trigger pointer.
_Avoid_: size as temperature (a long every-invocation procedure belongs inline; a short
incident-only note still costs every window); a tier-1 claim for text reachable only through a
conditional; not the memory roots' hot/cold split (**Hot set** / **Cold set**) — that temperature
is location, this one is branch frequency.

**Trigger pointer**:
The inline residue of an evicted block: `when <trigger>, read references/<file>` — the trigger is
the skeleton.
_Avoid_: pointers without triggers; rewriting while moving (the move is byte-identical; the pointer
is new text).

**Plugin-root-anchored pointer**:
The `${CLAUDE_PLUGIN_ROOT}/`-prefixed agent-card link form that resolves against the plugin
install root regardless of the dispatched seat's cwd (Bash-capable seats expand the placeholder in
their own shell; the auditor falls back to the card's strip-the-prefix resolution line). Supersedes
the owner-relative agent-card skeleton (ADR 0047); remains best-effort enrichment under
adjudication O(1) — decisive rules stay inline.
_Avoid_: treating the pointer as the sole carrier of a blocking rule; anchoring `skills/*/SKILL.md`
— not the SKILL.md owner-relative `references/<file>` skeleton, which ADR 0047 point 1 leaves
untouched (skill surfaces are read in-plugin — the supersession is agent-cards only).

### State & resume

**Run manifest**:
The uncommitted per-run telemetry record `/war` accumulates under the main checkout's
`.claude/war/runs/` — per-phase timestamps, workflow IDs, transcript-dir pointers, dispatch
counts, terminal statuses. Fail-open bookkeeping consumed by `/war-review`; **never resume
input** (the correctness record stays git > issues > ledger).
_Avoid_: run ledger (the ledger is the owned-refs record); reading it during resume.

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
reuses the run's owned integration branch instead of dying foreign
([ADR 0008](docs/adr/0008-git-is-the-resume-source-of-truth.md)) — and **never** `resumeFromRunId`
(which replays the same run's off-ladder journal, the cached escalation). A Lead/operator playbook,
never template-automated; when retrying an escalated task or a held phase, read the Recovery relaunch
playbook (single-task vs full-DAG forms, orphan adoption, `args.recovery` and
`reclaimStaleRemote` arming) in `skills/war/references/resume-and-recovery.md`.
_Avoid_: `resumeFromRunId` for an escalation; letter-suffixed phase ids ("4b"); rewriting the kept
commits on a retried branch; hand-filtering the DAG to the unmerged tasks (pass the full DAG; git at the
barrier is the filter).

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

**patch-equivalence probe**:
when an `/aftermath` candidate fails the tip-reachability gate, read skills/war/references/glossary-cold.md

**stranded upstream**:
A local WAR branch's tracking ref pinned at the worker's pre-rebase remote SHA — the refiner
rebases task branches locally in the serial merge queue and **never force-pushes**, so the tracked
remote ref never advances to the rebased tip that lands. Makes `git branch -d` check
merged-into-upstream and refuse a branch whose content is already in master. Recovery, only after
the gate passes on the **local SHA**: `git branch --unset-upstream <branch>` then `git branch -d <branch>` (restoring
git's own merged-into-HEAD check), never `-D`; a needs-human outcome after the unset restores
tracking (`git branch -u`).
_Avoid_: reading the `-d` refusal as an unmerged-work signal; escalating to `-D` in a default-mode
sweep.

**residual-set verification**:
when verifying an `/aftermath` Class-1 delete batch, read skills/war/references/glossary-cold.md

**churny shared docs**:
when a stacked branch conflicts on `docs/plans` / `docs/specs` / `docs/roadmaps`, read skills/war/references/glossary-cold.md

### Campaigns (multi-plan orchestration)

**Roadmap**, **Inbox**, **Hopper**, **Write-ahead checkpoint**, **CAMPAIGN-STATE.md**,
**Post-compact re-injection**:
when running or resuming a `/war-campaign` stack-and-plow campaign, read
skills/war/references/glossary-cold.md

**Plan-index table**:
The **first table** in a **Roadmap** — its ordered plan rows (`| # | Plan | Files owned | Ver | Depends on |`).
The **only** table `campaign-ledger.mjs init --roadmap` ingests; every later table (the issue→spec→plan
chain, the **shared-file contention** table) is **ledger-inert**. Placing an auxiliary table first would get
it ingested as the plan index instead of the real plans.
_Avoid_: putting an auxiliary table before it (silently mis-ingested); assuming the ledger reads all tables
(it reads only the first).

**Campaign ledger**:
The uncommitted per-run state of a campaign at `.claude/campaigns/<id>/ledger.json` — the plan queue
plus per-plan outcome — the entry shape's maintained home is `makePlanEntry` in `campaign-ledger.mjs`
(ADR 0046), cited rather than re-enumerated here so the field set cannot rot on this surface
(ADR 0025). **Single-writer** (the campaign
Lead), written atomically (temp file + rename), owned by `campaign-ledger.mjs`. The resume source: a
re-invoked campaign re-reads ledger + **Inbox** and continues; on resume the Lead reconciles the ledger
*toward git* (`git ls-remote`, `gh pr view`) before trusting it.
_Avoid_: committing it (that's the **Roadmap** snapshot's job); editing it by hand mid-run.

### Pipeline (outer loop)

**Memory mining**:
The survey's opening step: turning qualifying hot lessons from both memory roots into real
tracker issues — lint-guarded (a redaction hit withholds the issue, never scrubs it) and
slug-deduped (open or closed prior filing → never re-filed) — before the issue sweep runs, so
lesson-recorded debt enters the pipeline as ordinary issues.
_Avoid_: memory sweep (the sweep is the issue step); treating mined lessons as a parallel channel
(they become real issues or are reported, nothing else).

**memory-mined**:
The provenance label on an issue that originated as a lesson; the body's lesson citation is the
durable issue↔lesson link. Distinct from `war-followup` (a run's own deferred debt).
_Avoid_: reusing `war-followup` for mined issues (conflates two provenances).

**/war-review**:
The post-run skill that turns a run manifest plus its transcripts into a telemetry and friction
report (chat + a local untracked file), optionally filing one operator-confirmed friction issue
on the plugin repo. Metrics it cannot source render `n/a`, never an estimate.
_Avoid_: cost report (tokens, not dollars); treating it as part of the run (it is post-run,
read-only apart from the report file and the confirmed issue).

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
