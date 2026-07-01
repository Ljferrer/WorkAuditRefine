# First-class submodule support — let one WAR run produce, audit, and land a change inside a git submodule

**Status:** design resolved by grilling (`grill-with-docs`, 2026-06-29). **Not yet a plan** — this spec is
authored *ahead* of the in-flight M1→L3 audit-remediation stack and will become a `/war` plan only after that
stack lands (see §6). **ADRs:** [`0009-first-class-submodule-support.md`](../adr/0009-first-class-submodule-support.md),
[`0010-submodule-landing-authority.md`](../adr/0010-submodule-landing-authority.md) (both written + accepted with
this spec). **CONTEXT.md** terms landed in the same session (§8).

## 1. Context — the read/write asymmetry

A git submodule is a nested, independent repo: the superproject records only a commit SHA (the *gitlink* / pin)
for the submodule path, never its file contents; the submodule has its own `.git`, its own remote, its own
branches. WAR is built single-repo, and that assumption is load-bearing in every role. Today a plan that needs a
change *inside* a submodule (the originating case: a new file `auto_index/utils/layers/boto_helpers/extraction_helpers.py`
inside the `PyUtils` submodule of the `AutoIndex` superproject, then a pin bump every later task depends on)
fails in five distinct ways:

1. **Worker silent false-success.** [`war-worker.md:16,20`](../../agents/war-worker.md) — "work only inside the
   worktree", a single `git push` of the superproject branch. It edits the file in the submodule working tree, the
   gate may go green (the file is on disk), but a superproject commit captures **nothing** (the gitlink only moves
   if the submodule's own HEAD was committed, which the worker has no step for). It can return `status:"completed"`
   with `files_changed` that omit the actual file.
2. **Auditor blindness (sharpest).** [`war-auditor.md:14`](../../agents/war-auditor.md) pins review to
   `git diff <integrationBranch>...<task.branch>` in the superproject. A submodule content change is invisible there
   — at most a one-line `Subproject commit <a>..<b>` gitlink move. The auditor reviews an empty/gitlink-only diff
   and can `approve` code it never saw. **This bites even if submodule landings are never supported.**
3. **Refiner dangling pin.** [`war-refiner.md:26,54`](../../agents/war-refiner.md) pushes the superproject branch
   only. A gitlink bump pointing at a submodule commit that lives solely in one worker's local clone leaves the
   integration branch referencing a commit nobody else (CI, prod, other workers) can resolve — and the local gate
   can pass while the pushed pin dangles.
4. **No gate of its own.** A submodule-creating task often owns no test (the test is a later superproject task), so
   there is nothing for WAR to drive green for that task.
5. **Single-repo decomposition.** [`SKILL.md:26,31`](../../skills/war/SKILL.md) builds a phase→task DAG in **one**
   repo; it cannot express "superproject task B depends on a SHA produced by a merge in a *different* repo", nor
   pause for an out-of-band merge and resume with that SHA threaded in.

**The asymmetry.** [`provision.mjs:61-74`](../../skills/_shared/provision.mjs) and
[`war-setup-scout.md:31-33,71-73`](../../agents/war-setup-scout.md) already detect `.gitmodules` and emit
`git submodule update --init --recursive` — but purely to **populate for read** (make the worktree gate-ready).
Nothing models a submodule as a **target** a task may *modify, audit, and land*. `/war-room` gives no warning;
the only submodule awareness anywhere is that read-time init. This spec closes the write side.

## 2. The pivotal constraints

- **A submodule is an independent repo.** Every role that operates on "the repo" must be told *which* repo. The
  clean consequence (chosen, §3): for the duration of its phase a submodule is driven as a standalone repo.
- **Only the merge author knows the landed SHA.** If the submodule repo squash- or rebase-merges, the branch-tip
  SHA a worker created is **not** the SHA that lands on its mainline. A pin bumped to the pre-merge tip dangles on
  squash. So whoever creates the submodule's merge commit must be the one that supplies the SHA the pin references.
- **The cross-repo dependency is intrinsically serial.** A superproject task cannot consume new submodule code
  before the pin is bumped, which cannot happen before the submodule SHA exists and is reachable. Paying for the
  ordering at a phase boundary therefore costs no serialization that was not already required.

## 3. Resolved design tree

Seven forks, all resolved (grilling, 2026-06-29). The vocabulary is in [CONTEXT.md](../../CONTEXT.md) (§8).

- **Q1 — Task↔repo cardinality → two tasks, repo-scoped.** A task targets exactly one repo (`target repo` field,
  default superproject). A submodule edit and the pin bump are **two** tasks: a **submodule task** + a
  **gitlink-bump task** that depends on it. *Rejected:* one task spanning both repos (breaks every "one worktree /
  branch / integration branch per task" invariant at once).
- **Q2 — Landing authority → PR-and-hold default, WAR-owned opt-in.** Default **2B**: push the submodule *branch*,
  open a PR in the submodule repo, **hold** (`held:submodule-pr`), resume on the merged SHA — respects the
  submodule repo's own review/CI and is squash-correct. Opt-in **2A** (**WAR-owned submodule**, declared in run
  config): WAR runs the submodule's own CAS land, authors the merge, knows the SHA immediately, no hold. Under
  `--afk` a `held:submodule-pr` can never be cleared (no human to merge), so an AFK run must **confirm at launch**
  that every touched submodule is WAR-owned, else refuse it up front. *Rejected:* 2A-by-default (unilaterally lands
  on a shared library's mainline, bypassing its review).
- **Q3 — The bump → a trivial worker + a pin-validity lens.** The gitlink-bump task has a real (mechanical) worker
  in a normal superproject worktree: resolve the dep's landed SHA, `git -C <super> add <submodule-path>` at it,
  commit. Audited by a **pin-validity** lens. *Rejected:* refiner-authored bump commit (dents the
  Container/Contents boundary — the refiner owns containers, not contents).
- **Q3b — Pin-validity bar → reachable on the submodule remote (not "merged-to-mainline").** A gitlink-only diff is
  valid only on a declared bump task, only if the new SHA is (1) reachable on the submodule remote (pushed; a
  local-only commit fails) and (2) the SHA the dep submodule task produced. The remote ref need **not** be the
  default branch — a submodule legitimately pinned to a feature branch is allowed. A gitlink move on any other task
  is a hard refuse.
- **Q4 — Cross-repo structure → repo-per-phase.** A phase targets exactly one repo; cross-repo work is a
  **phase→phase** edge in the existing DAG. The submodule change is its own phase landing into the submodule repo;
  the dependent superproject phase's bump task reads the landed/merged SHA from the **ledger**. *Rejected:* a
  mixed-repo phase with a mid-phase cross-repo barrier (a brand-new land/resume path; the serialization is intrinsic
  anyway).
- **Q5 — Resume detection → `gh pr view` auto-detect + operator-supplied fallback, human-triggered, no poller.**
  On resume of a `held:submodule-pr`, `gh pr view <n> --json state,mergeCommit -R <submodule-remote>`; `MERGED` →
  take **`mergeCommit.oid`** (squash-correct) as the phase's landed SHA. Fallback: operator-supplied SHA / a
  `git fetch`+reachability check for a non-GitHub submodule. The resume trigger is the human re-running `/war` after
  they merge; AFK never reaches this state (Q2). **Out of scope:** moving a submodule to a `gh`-reachable host —
  but `/red-team` must flag an unreachable submodule up front (**reachability precondition**).
- **Q6 — Worktree mechanics → submodule-as-repo (6-A).** For its phase the submodule is driven as a standalone
  repo by the **existing cwd-scoped toolchain** run from the initialized submodule checkout
  ([`provision-worktrees.sh`](../../skills/war/assets/provision-worktrees.sh) resolves the target repo from cwd via
  `git_dir()` ~`:64`; `ensure-integration` already takes `<base>` ~`:150`). Its own provision list (setup-scout
  pointed at the submodule), its own gate, its own worktrees, its own integration branch. The auditor diffs
  **inside** the submodule worktree — no gitlink in view, so failure mode (2) cannot occur on a submodule task.
  **Base branch** is resolved by explicit signal only: run-config override → `.gitmodules` `branch` field →
  otherwise **raised to the human** (the remote default branch may be *offered*, never silently adopted).
  *Rejected:* 6-B, editing the in-place gitlink working tree (detached HEAD, scope-hook confusion, entangled gate).
- **Q7 — Determination & enforcement → explicit `target repo` tag, overlap-check proposes + validates, fail-closed
  guard.** The decompose/`war-room` overlap check (plan targets vs `.gitmodules` paths) **proposes** the
  classification; the human approves; the tag is then explicit on the sub-issue + ledger. Every downstream guard
  **validates** against the explicit tag — never silent runtime inference. *Rejected:* auto-classification as the
  authority (path-magic decides cross-repo; surprises; no durable record).

## 4. The two increments

The guard has two modes that map to two shippable increments (Q7). The split is deliberate: increment 1 is a
fail-closed correctness fix with value **today**, independent of the rest; increment 2 builds the feature on top of
an already-proven refuse-by-default floor.

### 4.1 Increment 1 — the fail-closed guard (refuse-*all* submodule touches)

Makes WAR *honestly* single-repo and kills the auditor rubber-stamp. **No submodule support yet — any submodule
touch is refused, loudly.** This is the original (a)+(b) recommendation.

- **Auditor:** a gitlink-only / submodule-content diff → a **hard finding** (Critical) → `request_changes`. (Failure
  mode 2.)
- **Worker:** a target path under a `.gitmodules` submodule path → return `status:"blocked"` with a clear reason,
  never the empty/false-success commit. (Failure mode 1.)
- **Refiner:** refuse to push a gitlink bump whose new SHA is not reachable on the submodule remote. (Failure
  mode 3.)
- **war-room:** at config time, surface a `.gitmodules`-vs-plan-targets overlap as a setup warning.
- On a submodule-free repo this is a **no-op** (no `.gitmodules`, no gitlink ever in a diff).

### 4.2 Increment 2 — first-class support (refuse-*undeclared*, route-*declared*)

Relaxes the same guard from "refuse all" to "refuse undeclared, route declared", and adds the machinery (§5). The
fail-closed net from 4.1 stays underneath: anything not on the explicit first-class path is still refused.

## 5. Mechanics (increment 2)

### 5.1 Decompose / `war-room` router
Overlap plan targets against `.gitmodules` paths (`git config --file .gitmodules --get-regexp '\.path$'`). A target
under a submodule path → **propose**: classify that task as a submodule task (`target repo` = the submodule), spawn
a paired gitlink-bump task depending on it, and fire the launch-time resolutions — **base branch** (Q6, raise if
unresolved), **reachability precondition** (Q5, `/red-team`), **AFK ownership confirmation** (Q2). The human
approves; the tag is explicit on the sub-issue + ledger.

### 5.2 Submodule-as-repo provisioning & worktrees (Q6 / 6-A)
The submodule phase's Provision barrier: ensure the submodule is init'd (the existing read-side
`git submodule update --init --recursive`), then run the cwd-scoped toolchain **from the initialized submodule
checkout** (git-dir `<superproject>/.git/modules/<name>`) to cut the submodule's integration branch off its resolved
base and `git worktree add` task worktrees under `<worktreeRoot>/<runId>/`. Setup-scout runs against the submodule
dir for *its* provision list; the gate is the submodule's self-discovered gate. The `.war-task` marker lands in the
submodule worktree, so the worktree-scope hook works unchanged.

### 5.3 Worker
- **Submodule task:** `cd`s into its submodule task worktree (a standalone submodule checkout), implements, writes
  the mapped tests *in the submodule repo*, gates green, commits, pushes the submodule branch. The M2 test-floor
  (§6) runs against the submodule diff.
- **Gitlink-bump task:** a trivial superproject worker — resolve the dep submodule task's landed SHA from the
  ledger, `git -C <super> add <submodule-path>` at that SHA, commit. Reuses the entire existing task/worktree/merge
  path.

### 5.4 Auditor — pin-validity lens
- On a **submodule task**: a normal lensed review *inside* the submodule worktree
  (`git -C <submodule-task-worktree> diff <sub-integration>...<branch>`) — real file diffs.
- On a **gitlink-bump task** (`pin-validity` lens): **validate** the gitlink-only diff — new SHA **equals the dep's
  landed SHA** (ledger match, authoritative). Remote-reachability is **established upstream** (the dep-task land +
  the Lead pre-flight reconciliation), not re-verified by an auditor `git fetch` (the read-only guard denies it); an
  optional read-only `git -C <submodule> cat-file -e <oid>` is a non-blocking confirmation (its absence is not a finding).
- On **any other** task: a gitlink move / submodule "modified content" → **hard refuse** (the fail-closed net).

### 5.5 Refiner — landing authority (Q2)
- **2A (WAR-owned submodule):** run the submodule's own integration→working CAS land (the existing
  `land-advance` push-first CAS, cwd = submodule), author the merge, record the landed SHA. No hold.
- **2B (PR-and-hold, default):** push the submodule branch, `gh pr create` in the submodule repo, record the PR
  number + remote in the ledger, return `landDecision: held:submodule-pr`.

### 5.6 `held:submodule-pr` lifecycle + resume (Q5)
Hold halts like any other `held:*` (and always under `--afk`, consistent with M1). On a human-triggered resume:
`gh pr view <n> --json state,mergeCommit` → `MERGED` → write `mergeCommit.oid` to the ledger as the submodule
phase's landed SHA, clear the hold, the dependent superproject phase's bump task reads it. The pin-validity lens
(§5.4) independently re-checks reachability — defense in depth against a wrong/forged fallback SHA.

## 6. Integration with the in-flight M1→L3 stack — the four pinned points

This spec is authored against v0.7.2 but its **real baseline is the post-L3 tip**. Four of the five stacked plans
introduce the exact constructs this feature extends; build on L3's landed tip and honor:

- **M1 (`held:workflow-error`, v0.7.3) — the sharpest ordering constraint.** M1's Lead-side fail-closed classifier
  maps `landDecision ∉ KNOWN_LAND_DECISIONS` → `held:workflow-error`. `held:submodule-pr` is a **new** `landDecision`:
  it must be added to the `schemas.md` enum (M1 takes it to 6 values → this makes 7) **and** to
  `KNOWN_LAND_DECISIONS`, or M1's classifier silently rewrites the hold into a terminal error. Treated as an
  interactive hold (it only arises in non-AFK 2B). See [M1 plan](../plans/2026-06-29-dead-phase-halt.md),
  [ADR-0005](../adr/0005-dead-phase-halts-the-dag.md).
- **M2 (test-floor, v0.7.4) — heaviest surface overlap.** Shares `war-refiner.md` merge-task step order,
  `MERGE_RESULT.status` enum, the `HARD_ESCALATION_REASONS` **cascade** (canonical `land-decision.mjs` + inline
  mirror in `workflow-template.js` + the `war-config.test.mjs` drift-guard — must move atomically in one commit),
  the Task shape (`target repo` joins `requiresTest`), and the SKILL.md decompose step. The `assert-test-in-diff.sh`
  floor runs **inside the submodule worktree** for a submodule task; reuse its tested-shell-guard idiom for any new
  `assert-*.sh`. See [M2 plan](../plans/2026-06-29-worker-test-floor.md), [ADR-0006](../adr/0006-deterministic-test-floor.md).
- **L2 (resume precedence, v0.7.6) — a conceptual extension, not just a same-file touch.** L2's "git can only lag,
  never be wrong, because superproject CAS is monotonic" is **single-repo**. This feature makes the **submodule
  remote a co-source-of-truth** for the pin SHA. The reconciliation pre-flight extends to verify the gitlink SHA is
  reachable on the submodule remote; `ledger.json` gains submodule PR/SHA fields (advisory, authoritative-when-
  reachable — same rule as L2's `merge_sha`). Likely amends [ADR-0008](../adr/0008-git-is-the-resume-source-of-truth.md).
  See [L2 plan](../plans/2026-06-29-resume-precedence-reconciliation.md).
- **L3 (fix-worker binding, v0.7.7) — new dispatch sites.** This feature adds worker-dispatch sites (submodule
  worker, gitlink-bump worker, submodule fix-worker). Each must route through L3's shared `blockedReason` predicate
  so a blocked submodule/bump worker escalates early with its reason. Increment 1's worker-block (§4.1) *produces* a
  `blocked` status the predicate consumes — clean synergy. See [L3 plan](../plans/2026-06-29-fix-worker-result-binding.md).
- **M3 (memory-provenance, v0.7.5)** is **independent** — servitor/memory is orthogonal to git topology; only a
  same-file (`workflow-template.js`) re-anchor on a different construct.

## 7. Surface changes

| Surface | Increment | Change |
|---|---|---|
| `agents/war-auditor.md` | 1 + 2 | gitlink-only-diff refuse (1); `pin-validity` lens that validates declared bumps / refuses undeclared (2); submodule-internal diff base (2) |
| `agents/war-worker.md` | 1 + 2 | submodule-path pre-flight block (1); submodule-task worktree mechanics + bump-task mechanics (2) |
| `agents/war-refiner.md` | 1 + 2 | refuse unresolvable gitlink bump (1); 2A CAS land / 2B PR-and-hold from the submodule (2) — **layers onto M2's merge-task step order** |
| `agents/war-setup-scout.md` / `_shared/provision.mjs` | 2 | scout the submodule's own provision list; a `submodulePaths(repoDir)` helper (parse `.gitmodules`) for the overlap check (~10 lines + self-check) |
| `skills/war/SKILL.md` | 2 | decompose router + `target repo` tag; `held:submodule-pr` Checkpoint handling; resume detection — **extends M1's Checkpoint + L2's Resume** |
| `skills/war-room/SKILL.md` | 1 + 2 | overlap warning (1); base-branch / reachability / AFK-ownership prompts (2) |
| `skills/war/references/schemas.md` | 2 | Task `target repo`; `landDecision += held:submodule-pr` (**M1 enum**); `MERGE_RESULT.status` additions (**M2 enum**); ledger submodule PR/SHA fields (**L2 block**) |
| `skills/war/assets/workflow-template.js` + `land-decision.mjs` + `war-config.test.mjs` | 2 | new landDecision/escalation wiring through the **M2 cascade** + **L3 dispatch predicate** |

## 8. New domain terms (CONTEXT.md) — landed in this session

`Target repo`, `Repo-per-phase`, `Submodule task`, `Submodule-as-repo`, `Gitlink-bump task`, `Pin-validity`,
`PR-and-hold landing`, `WAR-owned submodule`, `AFK landing confirmation`, `Submodule reachability precondition`,
`Submodule base branch`, `held:submodule-pr`, `Undeclared submodule touch`; and the evolved `Git-topology owner`
(now spans the phase's target repo).

## 9. Recommended ADRs

- [**ADR-0009 — First-class submodule support via repo-per-phase**](../adr/0009-first-class-submodule-support.md):
  the structural stance (repo-scoped tasks/phases, the two task kinds, phase→phase SHA dependency, submodule-as-repo,
  the guard's two modes). Hard to reverse, surprising (WAR was deliberately single-repo), real trade-off (vs. the
  guard-only option and vs. mixed-repo phases).
- [**ADR-0010 — Submodule landing authority**](../adr/0010-submodule-landing-authority.md): PR-and-hold default /
  WAR-owned opt-in, the `held:submodule-pr` lifecycle, AFK confirmation, `gh` resume detection, the reachable-on-
  remote pin bar. Hard to reverse (the safety posture), surprising (why WAR pauses for an out-of-band merge), real
  trade-off (automation vs. submodule review autonomy + squash correctness).

## 10. Open risks / implementation notes

- **Refiner cwd discipline.** The toolchain must run with cwd = the *initialized submodule checkout* so worktrees
  attach to the submodule (git-dir `.git/modules/<name>`), not the superproject. Mirrors the existing
  `provision-ensure-exclude-cwd-contract` discipline.
- **Branch-name namespacing.** `integration/<slug>/phase-N` exists in *both* repos' ref namespaces; unambiguous by
  repo but human-confusable. Leave as-is (no rename); note in the bump/audit prompts which repo a ref lives in.
- **`gh` account.** Resume detection assumes the run's `gh` account can read the submodule repo (the project's
  account constraint applies). An unreachable submodule is out of scope and caught by the `/red-team` reachability
  precondition (Q5), not at runtime.
- **Squash vs the pin bar.** The 2B default waits for the merge precisely to avoid orphaning a pre-merge tip on
  squash; the looser pin-validity bar (reachable-on-remote, Q3b) is the *audit* invariant, not the *production*
  policy — they are intentionally different layers.

## 11. Non-goals / deferred

- **Moving a submodule to a `gh`-reachable host** (Q5) — out of scope; flagged at `/red-team`, never auto-handled.
- **Mixed-repo phases / a mid-phase cross-repo barrier** (Q4) — rejected; the serialization is intrinsic.
- **Auto-merging the submodule PR under 2B** — rejected; only the merge author may supply the pin SHA, and 2B
  defers that to the submodule repo's own review.
- **A background PR-merge poller** (Q5) — rejected; resume is human-triggered, AFK never reaches the hold.
- **Recursive / nested submodules beyond one level** — out of scope for this spec (the originating case is
  one-level: `AutoIndex` → `PyUtils`).
- **Increment 2 before the M1→L3 stack lands** (§6) — the integration points are pinned to their post-stack form;
  building earlier risks the M1-classifier silent rewrite and the M2 drift-guard cascade.

## 12. Validation criteria

**Increment 1 (fail-closed guard):**
1. An auditor facing a gitlink-only / submodule-content diff returns `request_changes` (Critical), never `approve`.
2. A worker whose target is under a `.gitmodules` path returns `status:"blocked"` with a reason — no empty/
   false-success commit.
3. A refiner refuses to push a gitlink bump whose new SHA is unreachable on the submodule remote.
4. On a submodule-free repo, all three are no-ops (gate green, no behavior change).
5. `war-room` surfaces a `.gitmodules`-vs-plan-targets overlap as a setup warning.

**Increment 2 (first-class support):**
6. A submodule task is provisioned, worked, and audited **inside** the submodule repo — the auditor diff shows real
   files, no gitlink.
7. A submodule task's mapped test lands in the submodule repo; the M2 floor runs against the submodule diff.
8. **2B:** the refiner opens a submodule PR and returns `held:submodule-pr`; the phase halts; a human-triggered
   resume reads `mergeCommit.oid` via `gh pr view` and proceeds to the bump task.
9. **2A:** a declared WAR-owned submodule lands via CAS with no hold; the bump runs in the same DAG.
10. The gitlink-bump task's pin-validity lens **approves** a bump whose SHA is reachable-on-remote and equals the
    dep's landed SHA, and **refuses** one that is local-only or mismatched.
11. A gitlink move on a task **not** declared a bump task is a hard refuse (the fail-closed net survives the relax).
12. **AFK:** an un-owned submodule under `--afk` is refused at launch; a declared WAR-owned one runs straight
    through.
13. `held:submodule-pr` is in `KNOWN_LAND_DECISIONS` (M1) — the fail-closed classifier never rewrites it to
    `held:workflow-error`.
14. Base-branch resolution raises to the human when no explicit signal exists; never silently uses the remote
    default.
