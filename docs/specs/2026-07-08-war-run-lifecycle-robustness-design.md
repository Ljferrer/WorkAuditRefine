# /war run-lifecycle robustness — provision dispatch contract, phase-scoped worktree keying + relaunch recovery, launch-args entry validation

Source: `/survey-corps` 2026-07-08, from three run-lifecycle issues filed off live `/war` runs.
Not yet a plan — convert with `/war-strategy`, then validate with `/red-team`.

**Issues addressed: #582 · #583 · #586.**

## 1. Context — the gap / problem

Three frictions from live runs share one file family (`skills/war/assets/workflow-template.js` +
`skills/war/SKILL.md` + `agents/war-refiner.md`) and one theme: the run lifecycle misbehaves at its
seams — dispatch, relaunch, launch — and each misbehavior surfaces as a *wrong-class* error. Each
premise is verified against the current tree (master, v0.14.9 line):

1. **The refiner's standing card does not know provisioning is its job (#582).** `provisionStep(task)`
   in `workflow-template.js` dispatches `agentType: war-refiner` with a PROVISION prompt (label
   `provision-run:<taskId>`, schema `ENV_OUTCOME`) whenever the run carries a non-empty
   `run.provision` list — for **every** task, independent of `requiresTest` (the issue title's
   `requiresTest:false` correlation is a red herring; with an empty list `provisionStep` is a no-op
   and no agent is dispatched). But `agents/war-refiner.md` declares exactly two modes in its input
   contract (`mode`: `merge-task` or `land-phase`) and its Output contract enumerates only those two
   return shapes. A standing-card-obedient refiner can therefore *correctly* refuse the dispatch —
   observed live: one refiner complied for the sibling task, one declined ("neither merge-task nor
   land-phase"), pure LLM nondeterminism. Worse, `provisionStep`'s fallback (`!out || out.ok !==
   true`) **fabricates** an `env-blocked` outcome: `failedCommand` defaults to `provisionList[0]`
   (never run), `exitCode` to `1`, `stderrTail` to `'provision-run returned no result'`. A harness
   contract bug is reported to the operator as an environment gap, with invented evidence. The same
   out-of-contract exposure holds for the other two refiner provisioning dispatches: the phase
   git-topology barrier (label `provision:phase-<id>`) and the phase-close polish worktree (label
   `polish-worktree:phase-<id>`) — both also demand a `MergeResult` whose `mode` enum
   (`['merge-task','land-phase']` in `MERGE_RESULT`) cannot even express what they did, and **both
   `await agent(...)` calls discard their results**, so a refused or failed barrier is detected only
   when downstream workers crash against missing worktrees.
2. **Task worktrees are keyed without the phase; relaunch collides (#583, partially landed).** The
   `taskBranch` helper derives a phase-scoped branch (`war/<planSlug>/p<ph.id>-<t.id>`) but
   `taskWorktree` derives a phase-blind path (`<worktreeRoot>/<runId>/<t.id>`). Re-running a taskId
   under a different phase id in the same runId reuses the leftover directory still pinned to the
   old phase's branch. The issue's "fail loudly at provision" ask **already landed**: commit
   `88f0d20` (2026-07-03) added the branch-mismatch die (exit 6, message naming `teardown-task`) to
   `cmd_ensure_worktree`'s reuse path in `provision-worktrees.sh`. Surviving gaps: (a) the collision
   class itself still exists — fail-loud moved the failure earlier, it did not remove it; (b) the
   incident's improvised recovery ("phase 4b") is structurally impossible — `cmd_ensure_integration`
   and `cmd_teardown_phase` both hard-reject a non-numeric `<N>` (`''|*[!0-9]*` case guard); (c)
   there is **no sanctioned retry-failed-task path**: `Workflow({ resumeFromRunId })` replays the
   journal — `references/design.md` §6 calls the resume journal "off-ladder: an intra-phase replay
   cache" — so resuming a run that ended in an escalation replays the cached escalation, and
   `SKILL.md` permits resume only for `held:phase-incomplete`. A fresh relaunch then trips (a) if
   the runId is reused, or the foreign-integration-branch exit 3 if it is not (the prior run's
   `--owned-file` ledger does not travel; see learning
   `provision-nonidempotent-orphan-integration-branch-blocks-relaunch`). The polish worktree shares
   the collision class: `_polish` is run-scoped but its branch (`war/<planSlug>/p<ph.id>-polish`)
   is phase-scoped.
3. **Missing launch args produce a per-task throw, not an entry-point diagnosis (#586, partially
   landed).** The original "cryptic error" ask partially landed via #71 (commit `9103252`): the
   derivation throw now names the trio ("supply planSlug+runId+worktreeRoot or explicit
   branch/worktree") and fails closed into `held:workflow-error` with zero agents dispatched (the
   task loop precedes the Provision barrier). Surviving asks: the throw fires per-task on the
   *first* task and does not say **which** of the three args are missing; and the `SKILL.md` "Run
   one Workflow per phase" step enumerates `learningsTarget`, `memory`, `agents`/`audit`/`run` but
   never names `planSlug`/`runId`/`worktreeRoot` — today only the "Provisioning args
   (refiner-owned worktree lifecycle)" section of `references/schemas.md` documents the trio and
   its `undefined`-interpolation footgun.

The three compound in one operator story: a provision dispatch is refused (#582) → the task
escalates with a fabricated environment excuse → the operator relaunches and collides with the
stale worktree or an unowned integration branch (#583) → the improvised fresh launch omits a
top-level arg and dies one task at a time (#586).

## 2. Pivotal constraints

- **External ordering constraint (record, not a sibling-spec dependency):**
  `docs/plans/2026-07-07-target-repo-agnostic-execution.md` (merged, **not yet executed**)
  substantially rewrites `agents/war-refiner.md` (step-4 clause, gate contract, never-list,
  gate-failure classification) and edits the `workflow-template.js` Provision and merge prompts;
  `docs/plans/2026-07-07-test-floor-pattern-threading.md` (merged, not yet executed) also edits
  `workflow-template.js` prompt sites and `agents/war-refiner.md`. This spec's future plan must be
  roadmap-ordered **after** those campaigns land, or explicitly plan to rebase over them — the
  three change sets collide on the same prompt surfaces.
- **Both-surfaces rule.** Refiner behavior lives in dispatched prompts string-built in
  `workflow-template.js` **and** standing instructions in `agents/war-refiner.md`; every behavioral
  change lands in both in the same commit, drift-guarded.
- **Refiner owns provisioning (ADR 0001/0003, CLAUDE.md "Provision (refiner-owned worktrees)").**
  Routing provisioning dispatches to `war-refiner` is doctrinally correct; it is the standing card
  that lags. The fix direction is *teach the card*, never *reroute the dispatch*.
- **Enum discipline (ADR 0005).** No new `MergeResult` statuses, no new members in
  `HARD_ESCALATION_REASONS` or `KNOWN_LAND_DECISIONS` (both hand-mirrored copies stay untouched),
  and `held:workflow-error` is never added to `HARD_ESCALATION_REASONS`. `env-blocked` stays a
  **soft** escalation reason (siblings proceed, phase lands what passed).
- **Fail-open phase-close sweep.** The polish path may never produce a phase hold — the existing
  invalid-roster branch (skip sweep + drain queue to `follow-up`) is the template for any polish
  provisioning failure.
- **Resume doctrine (ADR 0008): git > labels > ledger; repair toward git.** Any sanctioned
  relaunch path must compose the existing git-first reuse semantics (`cmd_ensure_integration`
  owned-reuse, `cmd_ensure_worktree` existing-branch checkout) rather than introduce new state.
- **The Workflow sandbox cannot import.** `ENV_OUTCOME`, `MERGE_RESULT`,
  `HARD_ESCALATION_REASONS` live inline in `workflow-template.js`; changes to shared shapes must
  update `references/schemas.md` in the same commit.
- **Class-example prose must match routing predicates** (learning
  `held-workflow-error-infra-death-prose-mismatch`): if refiner-refusal starts routing to
  `held:workflow-error`, the SKILL.md description of that class must say so.
- **`provision-worktrees.sh` stays bash-3.2-safe and is the single tested owner of git-topology
  mutation** — and this spec deliberately changes **nothing** in it (§3 E/F).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| **A. Provision duty on the standing surface (#582)** | **`agents/war-refiner.md` gains a third mode, `provision`**, same commit as any dispatched-prompt change (both-surfaces rule). The mode section covers all three dispatch flavors — phase git-topology barrier (`provision:phase-<id>`), per-task provision-run (`provision-run:<taskId>`), phase-close polish worktree (`polish-worktree:phase-<id>`) — states that provisioning **is** a refiner duty (ADR 0001), lists the allowed `provision-worktrees.sh` subcommands and the run-verbatim rule for `run.provision` steps, and instructs: never refuse a provision dispatch as out-of-mode. Rejected: rerouting provisioning to another agent type (contradicts ADR 0001 and the refiner-owned worktree doctrine); a bare "you may also receive…" note (leaves the Output contract silent on the return shape, which is the half that caused the refusal). |
| **B. Provision-dispatch result contract (#582)** | **All three provision dispatches return the `ENV_OUTCOME` shape and all three results are captured.** Today the barrier and polish dispatches demand a `MergeResult` whose `mode` enum cannot express provisioning, and both results are discarded. Switch their `schema:` to `ENV_OUTCOME` (`{ ok, taskId?, failedCommand?, exitCode?, stderrTail?, provisionSource? }` — already the documented provision outcome shape in `schemas.md`) and bind the results. `MERGE_RESULT` is untouched — no `mode` widening, no status widening (enum discipline). |
| **C. Refusal/no-result vs genuine env failure (#582)** | **Evidence-gated `env-blocked`; everything else is a workflow error.** In `provisionStep`, an `ok:false` result is accepted as `env-blocked` **only when it carries execution evidence**: `failedCommand` matches one of the dispatched `run.provision` steps and `exitCode` is a number. A missing result, a refusal, or a result without matching evidence → `throw` (message naming the task, the label, and that the refiner returned no execution evidence) → the existing catch → `held:workflow-error`. The fabrication fallback (`provisionList[0]` / `'provision-run returned no result'`) is deleted. Genuine failures keep today's soft path verbatim: reason `env-blocked`, worker never spawned, worktree kept, siblings proceed, 0 fix rounds. Barrier result `!ok` → same throw route (no topology ⇒ nothing in the phase can run; the die text — including a foreign-branch exit 3 — travels in `stderrTail` into the error message). Polish result `!ok` → **fail-open**: log + drain the phase-close queue to `follow-up`, mirroring the invalid-roster branch; never a hold. Rejected: a new soft escalation reason for refusals (widens the escalation vocabulary for a case the standing-card fix makes rare, and mislabels a systemic contract bug as a per-task outcome); keeping fabricated env-blocked (the live incident — wrong class, invented evidence). |
| **D. Worktree keying (#583)** | **Phase-scope the derived task worktree path**: `taskWorktree` derives `<worktreeRoot>/<runId>/p<ph.id>-<t.id>`, mirroring the `taskBranch` convention (`war/<planSlug>/p<ph.id>-<t.id>`). The polish worktree moves the same way: `<worktreeRoot>/<runId>/p<ph.id>-polish` (its branch is already phase-scoped). `_refinery` stays run-scoped **by design** — `ensure-refinery-worktree` has clean-tree re-attach heal cases for crossing phases; task worktrees have no such heal, hence the keying fix. Explicit `t.worktree` on a task still wins (derivation only fills gaps). Doc mirrors updated in the same change: the two `<worktreeRoot>/<runId>/<task>` rows/callouts in `schemas.md` "Provisioning args", and `agents/war-refiner.md` "Submodule-as-repo provisioning" step 4's `worktree add <worktreeRoot>/<runId>/<taskId>` line. Rejected: a nested `<runId>/<phaseId>/<taskId>` layout (two segments where one mirrors the branch convention; `_refinery`/`_polish` siblings stay flat). |
| **E. Auto-heal re-point of a mismatched worktree (#583)** | **Rejected.** With D, a same-run cross-phase relaunch derives a fresh path and checks the existing task branch out there (`cmd_ensure_worktree` already checks out an existing branch as-is, preserving its commits) — the collision class the auto-heal would serve is gone. The `88f0d20` exit-6 die stays as the fail-loud backstop for residual hand-mangled states; the `ponytail:` comment in `cmd_ensure_worktree` naming the clean-tree re-attach upgrade path stays as-is. **No `provision-worktrees.sh` change.** |
| **F. Non-numeric phase ids ("phase 4b") (#583)** | **Keep numeric-only; document it as deliberate.** `cmd_ensure_integration`/`cmd_teardown_phase` continue rejecting non-numeric `<N>`. The "4b" improvisation existed only because no sanctioned retry path did (G). Rejected: widening `<N>` to slug-safe tokens — it multiplies branch-namespace shapes (`integration/<slug>/phase-4b`, teardown regexes, ledger keys) to serve a workaround the recovery playbook obsoletes. |
| **G. Sanctioned retry-failed-task path (#583)** | **A documented recovery relaunch, not a new mechanism**: retry an escalated/env-blocked task by launching a **fresh Workflow run** (new `runId` — never `resumeFromRunId`, which replays the cached escalation; design.md §6 keeps the journal off-ladder) with the **same `planSlug` and the same numeric `phase.id`**, a single-task DAG, and **owned-file continuity** — pass the prior run's `--owned-file` ledger (or `record-as-owned` the integration branch) so `cmd_ensure_integration` reuses the owned integration branch instead of dying foreign (exit 3). Everything then composes from existing semantics: the integration branch (already carrying landed sibling merges) is reused; the new run's fresh worktree path checks out the existing task branch with its approved commits; the land path is the normal one. Lands as a SKILL.md playbook subsection under outcome handling, cross-referenced from the `env-blocked` bullet and the Resume procedure. Rejected: making `resumeFromRunId` retry escalations (contradicts the off-ladder journal doctrine and `held:phase-incomplete`-only resume); automating relaunch in the template (the Lead owns run lifecycle; the playbook is operator/Lead prose by design). |
| **H. Launch-args entry validation (#586)** | **One conditional check at args parse, enumerating the missing keys.** After destructuring `A`: if any task lacks an explicit `branch`/`worktree` **and** the derivation trio is incomplete, throw once — `workflow-template: requires top-level { planSlug, runId, worktreeRoot } — missing: [<exactly the absent keys>] (or supply explicit branch/worktree per task)` — before the roster loop and the Provision barrier. Routes to `held:workflow-error` via the existing catch, still zero agents dispatched. The per-task derivation throw stays as a belt-and-suspenders backstop. Rejected: unconditionally requiring the trio (breaks the documented explicit-branch/worktree escape hatch for hand-patched DAGs). |
| **I. Launch-step documentation (#586)** | The `SKILL.md` "Run one Workflow per phase" step names `planSlug`, `runId`, `worktreeRoot` as required top-level args (one sentence + pointer to the `schemas.md` "Provisioning args" section, which stays the detailed reference). The `schemas.md` derivation-footgun callout gains one line noting entry validation now names the missing keys. |

## 4. Mechanics (per component/role)

### `skills/war/assets/workflow-template.js`
- **Entry validation (H):** immediately after the `A` destructure, compute the absent members of
  `{planSlug, runId, worktreeRoot}`; if non-empty and any task lacks explicit `branch`/`worktree`,
  throw the enumerating message. Inside the existing `try{}` so the catch produces
  `held:workflow-error` with git state untouched.
- **Keying (D):** `taskWorktree` becomes
  `t.worktree || ((worktreeRoot && runId) ? \`${worktreeRoot}/${runId}/p${ph.id}-${t.id}\` : t.worktree)`;
  the `polishWorktree` literal becomes `.../p${ph.id}-polish`. `_refinery` paths unchanged.
- **`provisionStep` (C):** replace the `!out || out.ok !== true` fabrication block with the
  evidence gate: accept `ok:false` iff `provisionList.includes(out.failedCommand)` (trimmed
  compare) and `typeof out.exitCode === 'number'`; otherwise throw. The PROVISION prompt keeps its
  run-verbatim wording and additionally tells the refiner its `failedCommand` must be the failing
  step **verbatim** (the gate depends on it).
- **Barrier + polish dispatches (B/C):** change both `schema:` args from `MERGE_RESULT` to
  `ENV_OUTCOME`; capture both results; prompts reworded from "report a MergeResult" to the
  `{ ok: true }` / env-outcome contract. Barrier `!ok` → throw with `stderrTail` in the message;
  polish `!ok` → log + `demote(f, 'follow-up', …)` drain, sweep skipped.
- **Comments** at the three dispatch sites name the standing-card mode (`provision`) they pair with
  (source-comment/prompt coherence; learning `source-comment-lags-emitted-prompt-after-rewrite`).

### `agents/war-refiner.md` (same commit as every template prompt change above)
- Input contract line becomes `mode: merge-task, land-phase, or provision`.
- New `## provision` section: the three dispatch flavors and their labels; allowed
  `provision-worktrees.sh` subcommands; `run.provision` steps run verbatim, in order, stop at
  first failure; return shape = the env-outcome JSON (`{ ok: true }` or
  `{ ok: false, taskId, failedCommand: <the failing step verbatim>, exitCode, stderrTail,
  provisionSource }`); a provision dispatch is never out-of-mode — do not decline it.
- Output-contract paragraph gains the provision return shape alongside the two `MergeResult`
  modes.
- "Submodule-as-repo provisioning" step 4 path mirror updated to
  `<worktreeRoot>/<runId>/p<phase>-<taskId>` (D).

### `skills/war/SKILL.md`
- "Run one Workflow per phase" step: name the trio (I).
- `env-blocked` outcome bullet: note the outcome is evidence-gated — a provision dispatch that
  returns no execution evidence is `held:workflow-error`, not `env-blocked` (C), keeping the
  class-example prose aligned with the routing predicate.
- `held:workflow-error` classification prose: add refiner-refusal/no-result-on-provision to the
  class examples (same alignment rule).
- New **recovery relaunch** playbook subsection (G): fresh run, same plan slug, same numeric phase
  id, single-task DAG, owned-file continuity, never `resumeFromRunId` for escalations; explicit
  warning that letter-suffixed phase ids are rejected by design (F). Cross-referenced from the
  `env-blocked` bullet and the Resume procedure.

### `skills/war/references/schemas.md`
- "Provisioning args" table + derivation callout: path convention becomes
  `<worktreeRoot>/<runId>/p<phase>-<task>` (D); callout notes entry validation names missing keys
  (H).
- The env-blocked/`ENV_OUTCOME` section documents the shape as the uniform return for **all**
  provision dispatches (barrier, provision-run, polish) and the evidence-gate rule (B/C).

### `skills/war/assets/workflow-template.test.mjs`
- New/extended cases per §10. Existing tests asserting the old `<runId>/<t.id>` path shape or the
  fabricated `'provision-run returned no result'` string are updated in the same change
  (learning `relaxed-assertion-test-title-must-update-together`).

### `skills/war/assets/provision-worktrees.sh`
- **No change** (E/F are explicit keep-decisions). The exit-6 mismatch die, the numeric-`<N>`
  guards, and `ensure-refinery-worktree`'s re-attach heals are load-bearing as-is.

## 5. Surface changes (files touched)

- `skills/war/assets/workflow-template.js` — entry validation; phase-scoped `taskWorktree` +
  `polishWorktree`; `provisionStep` evidence gate; barrier/polish `ENV_OUTCOME` capture + routing.
- `skills/war/assets/workflow-template.test.mjs` — §10 criteria 1–5.
- `agents/war-refiner.md` — third mode `provision`; output contract; submodule path mirror.
- `skills/war/SKILL.md` — launch-step trio; env-blocked/workflow-error class prose; recovery
  relaunch playbook.
- `skills/war/references/schemas.md` — provisioning-args path rows/callout; uniform
  `ENV_OUTCOME` documentation.
- `CONTEXT.md` — new terms (§6).
- No changes: `provision-worktrees.sh`, `land-decision.mjs`, any enum, any hook.

## 6. New domain terms (CONTEXT.md)

- **provision mode** — the refiner's third dispatch mode (alongside merge-task and land-phase):
  the phase git-topology barrier, per-task provision-run, and polish-worktree dispatches; returns
  the env-outcome shape, never a MergeResult.
- **execution evidence (provision)** — the fields a `ok:false` provision result must carry to
  classify as `env-blocked` (a `failedCommand` matching a dispatched step + numeric `exitCode`);
  absent evidence ⇒ `held:workflow-error`, never a fabricated environment excuse.
- **recovery relaunch** — the sanctioned retry of an escalated task: a fresh Workflow run (new
  runId) over the same plan slug and same numeric phase id with owned-file continuity; composes
  git-first reuse (ADR 0008), never `resumeFromRunId`.

## 7. Recommended ADRs

- **New ADR (next free number): "Run-lifecycle contract: provision is refiner mode three;
  env-blocked requires execution evidence; recovery relaunches are fresh runs over reused git
  state."** Records A/C/G and the two deliberate keeps (E: no auto-heal re-point, F: numeric-only
  phase ids). Extends ADR 0001 (refiner-owned provisioning) and ADR 0008 (relaunch composes
  git-first reuse); explicitly leaves ADR 0005's enum sets untouched.

## 8. Open risks / implementation notes

- **The evidence gate cannot catch a lying agent.** A refiner that refuses but *echoes* a
  plausible `failedCommand` from the prompt passes the gate and misclassifies as `env-blocked`.
  Accepted residual: the standing-card fix (A) removes the incentive to refuse, and the gate
  catches both live-observed shapes (no result; refusal prose without execution fields).
- **`failedCommand` matching is string-exact (trimmed).** A refiner that paraphrases the failing
  command turns a genuine env failure into `held:workflow-error` — wrong class in the opposite,
  fail-closed direction (operator inspects; no invented evidence). The prompt's new
  verbatim-`failedCommand` clause is the mitigation; token-anchor the test, not full-line bytes.
- **A barrier/refusal throw aborts in-flight sibling work** (the throw rejects the wave's
  `parallel`). Accepted: a refused dispatch is a systemic contract bug (same prompt shape for all
  tasks), the dead phase is preserved and resumable, and post-A refusals should be rare.
- **Stale worktrees from pre-change runs** live at the old `<runId>/<t.id>` paths and are never
  collided with (new runs derive new-shape paths) but also never reaped by those runs' teardowns
  if the run died pre-teardown. Same manual-cleanup posture as today's leftovers; note in the
  playbook.
- **Prompt-surface collision with the two merged, unexecuted plans** (§2 first constraint) is the
  dominant sequencing risk; the plan for this spec must state its base explicitly at roadmap time.
- **Anchor all tests by named construct** (`provisionStep`, `ENV_OUTCOME`, the entry-validation
  message), never line numbers.

## 9. Non-goals / deferred

- **No auto-heal re-point** of a branch-mismatched worktree (E) — the exit-6 die stays the
  backstop.
- **No non-numeric phase ids** (F).
- **No `resumeFromRunId` retry of escalations** — the journal stays off-ladder (design.md §6).
- **No template-automated relaunch** — recovery relaunch is a documented Lead playbook (G).
- **No `MERGE_RESULT` mode/status widening, no `HARD_ESCALATION_REASONS` /
  `KNOWN_LAND_DECISIONS` / land-decision changes** (ADR 0005).
- **No `provision-worktrees.sh` changes** — `88f0d20`'s guard and the numeric-`<N>` checks are
  kept verbatim.
- **No ledger-based retry bookkeeping** — the ledger stays a lagging advisory view (ADR 0008).
- **No change to `_refinery` keying** — its cross-phase re-attach heal is the designed behavior.

## 10. Validation criteria (concrete, testable)

1. **Entry validation (`workflow-template.test.mjs`):** launching with tasks lacking explicit
   `branch`/`worktree` and (a) no trio → result is `held:workflow-error` and the error message
   lists all three keys; (b) only `runId` missing → message lists exactly `runId`; (c) trio absent
   but every task carries explicit `branch`+`worktree` → no throw, run proceeds. In (a)/(b) zero
   agents are dispatched.
2. **Phase-scoped keying:** derived `t.worktree` equals `<worktreeRoot>/<runId>/p<ph.id>-<t.id>`;
   the same taskId under two phase ids yields two distinct paths (delete-the-feature check: the
   assertion fails on the old phase-blind derivation); explicit `t.worktree` still wins; the
   polish worktree path carries `p<ph.id>-polish`.
3. **Evidence gate:** a provision-run result with `failedCommand` ∈ the dispatched list and
   numeric `exitCode` → soft `env-blocked` escalation (reason `env-blocked`, worker not spawned,
   siblings land — today's path byte-preserved); a missing result, an `ok:false` without evidence,
   or a foreign `failedCommand` → `held:workflow-error` whose message names the task and
   `provision-run`; the literal `'provision-run returned no result'` fabrication no longer appears
   anywhere in the template.
4. **Barrier/polish capture:** the barrier and polish dispatches pass `ENV_OUTCOME` (not
   `MERGE_RESULT`) as `schema`; a barrier `ok:false` → `held:workflow-error` carrying the
   `stderrTail`; a polish `ok:false` → sweep skipped, queue drained to `follow-up`, phase still
   lands (no hold).
5. **Both-surfaces drift guard:** a token-anchored, sentence-case-tolerant test asserts
   `agents/war-refiner.md` names the `provision` mode, all three dispatch labels' duties, and the
   env-outcome return fields wherever the dispatched prompts do; and that the submodule
   provisioning path in the standing card matches the template's derivation shape.
6. **Doc presence checks (grep-able):** `SKILL.md`'s launch step names `planSlug`, `runId`, and
   `worktreeRoot`; a recovery-relaunch heading exists and its body names owned-file continuity and
   "never `resumeFromRunId`"; the `held:workflow-error` prose names the provision-refusal case;
   `schemas.md`'s provisioning-args rows carry the `p<phase>-<task>` path shape.
7. **Operator-only (deferred backstop material for the plan):** (a) a live relaunch drill — after
   a forced task escalation, the playbook relaunch lands the task with no manual merge and no
   exit-3/exit-6; (b) refiner-refusal classification — LLM refusal cannot be forced
   deterministically, so the `held:workflow-error` routing of a real refusal is verifiable only by
   observation across future runs. Runner: the next live `/war` campaign; not unit-testable.
