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
directories. In WAR this is the refiner (the Refinery).
_Avoid_: provisioner (no separate role exists), branch manager.

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
