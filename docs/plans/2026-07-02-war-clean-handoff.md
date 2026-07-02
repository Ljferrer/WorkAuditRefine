# WAR clean handoff — commander's intent, disposition routing, dep-wave visibility, phase-close sweep

**Source spec:** [`docs/specs/2026-07-02-war-clean-handoff-design.md`](../specs/2026-07-02-war-clean-handoff-design.md)
(ratified; companion ADRs [`0012`](../adr/0012-intra-phase-visibility-and-phase-close-sweep.md),
[`0013`](../adr/0013-commanders-intent-and-disposition-routing.md)). This plan lands **third** in the
clean-audit series (after the #422 nit sweep and the variable-audit roster —
[`../roadmaps/2026-07-02-clean-audit-series.md`](../roadmaps/2026-07-02-clean-audit-series.md)); it is
**authored against POST-ROSTER constructs** (`task.roster` seats, per-seat depth, `ROSTER_POLICIES`,
D7-guarded `mergedTasksForGateAudit.push` sites). Every code reference below is anchored by **construct
name**; `~:N` line hints are from the pre-roster survey and WILL drift — re-locate by construct
([[plan-line-number-refs-stale-use-construct-locator]]). Collision inventory to re-anchor after roster
lands: `auditRound`, `auditPrompt`, the mirror marker comment, both `mergedTasksForGateAudit.push` sites,
`agents/war-auditor.md`, `skills/war/SKILL.md`, `references/schemas.md`, `references/design.md`.

Memory hooks: [[standing-instruction-vs-dispatched-prompt-coverage-split]] (every auditor/worker behavior
change edits standing .md + dispatched prompt in ONE commit),
[[weak-test-assertion-passes-without-feature-being-exercised]] (temp-break proofs),
[[gate-under-covers-after-cross-branch-merge-new-runner]] (run ALL suites post-merge),
[[default-flip-must-audit-all-doc-surfaces]] (disposition replaces Minor/Nit→issue on every prose surface),
[[release-bump-slots-canonical-no-badge]] + [[version-slots-no-cross-slot-consistency-test]] +
[[stacked-release-plan-version-literal-lags-operator-target]] (release task),
[[war-branch-base-off-latest-master-not-prior-tip]] (series stacking),
[[dont-leave-work-on-the-table]] (collateral fixes absorbed by the file's owning task).

**Ratify with `/red-team` before `/war`.** The ten grilling resolutions under *Open decisions* are
already operator-resolved — ratify, don't re-open.

## Commander's Intent

- **Purpose:** every WAR phase must hand the next phase a tip whose quality debt is **zero or enumerated and
  intentional** — auditors exist to get gaps *addressed before proceeding*, not to file homework. Follow-up
  issues become affirmative, justified acts; mechanical polish is absorbed in-phase; agents get licensed
  judgment instead of plan literalism.
- **Method:** give every judgment point (worker, auditor, ace, gate-audit, servitor) the operator's intent as
  its ceiling and the plan slice as its floor; route findings by auditor-owned *disposition* instead of
  severity alone; make declared `deps` grant real code visibility at wave dispatch; add one fail-open
  phase-close polish pass at the *integrated* tip where per-task machinery structurally cannot reach.
  Keep every existing HARD gate (unanimous audit, Critical/Major block, serial merge queue, push-first CAS).
- **End state** (each condition individually checkable — §10 maps them to tests):
  1. A phase can land with **zero unrouted findings**: every Minor/Nit is absorbed (commit SHA), filed
     (issue # + why-not-absorbable), or noted (phase report) — nothing defaults into an issue.
  2. A task may declare `deps` on a sibling and its worker **sees the merged dep content** before writing.
  3. A README/doc absorb-class nit is **fixable in-phase** under `--ace` (routed, not refused).
  4. Intent-consistent work beyond the literal plan slice is **approve**, not `request_changes`.
  5. The phase checkpoint carries a machine-readable **handoff block** the next phase's decompose reads.
  6. The reference run's 9-nit litter class replays as ≤ 2 justified follow-up issues.

## Build order (for /war)

- **Topology:** 3 phases. Phase 1 = three parallel, file-disjoint code tasks (template+agents /
  war-strategy / red-team lens). Phase 2 = one doc-mirrors task — a phase edge, not a fourth parallel task,
  because the mirrors must describe post-T1 behavior. Phase 3 = release.
- **Run mechanics:** this plan's own run executes under the post-roster template — dep-wave visibility does
  **not** exist yet, so decomposition uses file-disjoint parallel tasks + dependency ⇒ **phase** edge, as
  today. Task audit annotations use the **roster schema** (`task.roster`).
- **Integration base:** the clean-audit series tip (roster plan landed); latest `origin/master` if run
  standalone. Version = **+0.1.0 over the land-time base** — the operator is the version authority; no
  literal in this file is.
- **File-disjointness map (Phase 1):** T1 → `skills/war/assets/workflow-template.js` + `.test.mjs`,
  `agents/war-auditor.md`, `agents/war-worker.md`. T2 → `skills/war-strategy/**`. T3 →
  `skills/red-team/**`. No overlaps, no intra-phase `deps`. Phase 2 → `skills/war/SKILL.md`,
  `skills/war/references/{schemas,design}.md`, `CONTEXT.md`, `docs/adr/0012-*.md`, `docs/adr/0013-*.md`.
  Phase 3 alone touches the version slots.
- **Gate:** the full self-discovering gate before every commit —
  `node --test 'skills/**/*.test.mjs'` + the `find … '*.test.sh'` sweep. No gate edits needed
  (T2's test already exists; T3's assertions ride `workflow-scaffold.test.mjs`). Run **all** suites
  post-merge; count self-discovered, never a literal ([[task-prompt-suite-count-stale-after-stacking]]).

**Coverage — spec §10 criteria → tasks:** 1–6, 10, 11 → T1 (template unit tests); 7 → T2 (structure test +
temp-break); 8 → T1 (`workflow-template.test.mjs` already reads `agents/war-auditor.md` and asserts both
surfaces — extend that existing pattern, currently at ~:9/:812-831); 9 → T3; 12 → Appendix A of the spec,
checkable at spec time — no task, cite it in the PR body. Criterion 11 runs under resolution 2's
phase-scoped semantics (see Open decisions).

---

## Phase 1 — orchestration + coupled agent surfaces (3 parallel, file-disjoint tasks)

### Task 1 — workflow template + both agent standing files (the big one)

**Files:** `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`,
`agents/war-auditor.md`, `agents/war-worker.md`.
**requiresTest:** true · **roster:** default (config `audit.roster` — full distinct-lens panel) ·
**deps:** none · **target repo:** superproject.

One task by code boundary: disposition routing, `phaseCloseQueue`, the sweep stage, and the `handoff`
block are one coupled data flow (spec §5 decomposition note); the agent .md files ride along for the
single-commit standing/dispatched sync. Plan slice (TDD each behavioral change; every new template-string
behavior gets a unit test + temp-break proof):

- [ ] **Disposition routing — a RESTRUCTURE, not a filter swap.** Today `minorsFiled` is populated
  **eagerly** for every task result before the approve branch (push site currently at ~:360) and
  successfully-aced findings are **spliced back out** keyed on task+title+file (~:400-406). Replace with
  **classify-at-collection**: each Minor/Nit routes once, by `disposition` (default when omitted:
  Minor → `follow-up`, Nit → `note`; `absorb` never defaulted; legacy `autoFixable:true` reads as `absorb`
  for one release). `minorsFiled` receives only `follow-up`; new `notes` array receives `note`. Preserve
  the splice's semantics as the demotion ladder's failed-ace arm (below). Findings on a task that never
  reaches the approve branch (escalate / audit-blocked) → `follow-up` filed with the escalation — today's
  eager-push behavior, now stated.
- [ ] **`aceEligible` narrowing.** Regex becomes `/(?:plugin\.json|marketplace\.json)$/` — README.md no
  longer refused. **KEEP the `f.file &&` truthiness guard** (the spec's quoted successor filter
  accidentally drops it; a fileless finding is never ace-eligible — it takes the severity-default demotion
  instead). Aceable filter in the approve branch (~:368) becomes: absorb-disposition ∧ `!phaseClose` ∧
  filename test → per-task ace exactly as today (one commit, panel re-audit, forward-revert). Absorb
  findings failing that test push to `const phaseCloseQueue = []` (declared beside `aced`).
- [ ] **AUDIT_VERDICT tightening.** The executable schema literal's finding items currently have **no
  required array** (autoFixable was never declared — it rode open objects, ~:36-42). Add
  `required: ['severity']` to finding items plus declared optional `disposition`
  (enum `absorb|follow-up|note`), `phaseClose` (boolean), `autoFixable` (boolean — documented deprecated,
  removed next release). Schema-layer retry corrects sloppy seats; persistent failure falls into the
  existing dropped-seat → audit-blocked lane.
- [ ] **Terminal-disposition demotion ladder** (uniform: demote one step toward durability, never drop
  silently, every demotion `log()`ged): failed absorb (ace blocked / falsy `head_sha` / re-audit
  regression → forward-revert) → `follow-up`; non-approve-branch findings → `follow-up` w/ escalation;
  held-phase `phaseCloseQueue` (sweep never dispatches) → drained to `follow-up`; fileless absorb →
  severity default.
- [ ] **Intent threading.** New `args.intent` (string|null); when present, thread into every prompt surface
  the spec names — worker dispatch ("intent-consistent deviation is in-band — note it in your result"),
  `auditPrompt`, ace + sweep dispatches, gate-audit pass, servitor wrap-up (which also gains the `notes`
  array — memory candidates, not issues). `args.intent` absent ⇒ prompts **byte-compatible** with today
  (criterion 10 test).
- [ ] **Auditor surfaces (same commit):** `auditPrompt()` and `agents/war-auditor.md` both gain the
  **latitude rule** (plan slice = floor, Commander's Intent = ceiling; intent-consistent work beyond the
  slice is APPROVE, judged on its own correctness) and the **disposition rule** (absorb / follow-up must
  state why-not-absorbable / note; `phaseClose:true` when the fix needs the integrated tip or a
  shared/slot-adjacent file). Extend the existing both-surfaces assertion in `workflow-template.test.mjs`
  (criterion 8).
- [ ] **Dep-wave visibility.** When `(task.deps || []).length > 0` **and the dep is same-repo** — scope by
  `taskType`, `gitlink-bump` tasks EXCLUDED (their dep merged into the *submodule* repo's integration
  branch; the clause would assert a merge that happened in a different repo) — the worker dispatch prompt
  prepends: deps already merged into the integration branch; FIRST ACTION
  `git -C <worktree> rebase <integrationBranch>`; conflict (resume-with-commits only) → `status:blocked`
  with conflict files, never resolve. Dep-less tasks untouched (frozen phase base stands). Test: clause
  present iff deps non-empty ∧ same-repo (criterion 4 + the gitlink-bump negative).
- [ ] **Force-with-lease carve-out (worker surfaces, same commit):** a worker may
  `git push --force-with-lease` ONLY its own task branch, ONLY after a dispatch-rebase diverged it from its
  pushed remote. Identical wording in `agents/war-worker.md` (standing — today it says plain `git push`)
  and the dispatched worker prompt clause.
- [ ] **Phase-close coherence sweep.** Insert **after** `landDecision` is computed (the
  `let landDecision = …` ternary after the ghost-dep sweep, currently at ~:631-633) and **before** the
  `if (landDecision === 'landed')` land dispatch (~:635); gate on `landDecision === 'landed'` ∧
  `phaseCloseQueue.length > 0`. Pseudo-task synthesis: branch `war/<slug>/p<N>-polish`, worktree
  `<worktreeRoot>/<runId>/_polish` via existing `ensure-worktree` at the post-merge integrated tip, issue =
  the phase epic, planSlice = the sweep charter (drain `phaseCloseQueue` + cross-task coherence at the
  integrated tip). One war-worker dispatch: queued findings verbatim + intent + merged tasks' plan slices;
  fix ONLY the queue, no version-slot literals, ONE commit, gate green, **no ad-hoc seam hunting**. Sweep
  roster = the config default `audit.roster`, normalized like any task roster — the Lead may NOT downgrade
  it; full `auditRound` re-audit at the polish SHA, same unanimity. Re-approved → refiner merges at the
  serial queue's tail, land proceeds on the polished tip. Anything else → **discard**: branch + `_polish`
  worktree left in place (never-lose-unmerged-commits; reaping is a human act), `handoff.polish:
  'discarded'` + branch name recorded, queue findings demoted to `follow-up`, land proceeds on the
  pre-polish tip — a discarded sweep **recomputes nothing**. NO owned-refs registration (see Open
  decisions 4); bookkeeping = task-grade `ledger.json` entry (Lead-side) + polish SHA/status in the handoff
  block. Spec §9 stands: zero provisioning-script changes.
- [ ] **End-state check — phase-scoped.** Rides the existing gate-audit pass when it runs: conditions
  claimed by THIS phase, provably unmet at the confirmed tip → HARD (existing `escalated`,
  reason `gate-evidence` lane); unverifiable/tip-unconfirmable → SOFT note; later-phase conditions →
  `out-of-scope`, never a hold (criterion 11's three cases). When `mergedTasksForGateAudit` is empty
  (roster-D7 skip) AND the phase claims ≥1 End-state condition: spawn ONE End-state-only seat at the
  confirmed tip, `log()` why — preserving D7's cost saving.
- [ ] **Handoff block.** Return gains `handoff: { tipSha, polish: 'merged'|'discarded'|'skipped',
  absorbed: [{sha, findings:[title]}], followUps: [{issue, reason}], notes: [{task, title}],
  endState: [{condition, status: 'met'|'unmet'|'deferred'|'out-of-scope'}], intentPresent }`. Emitted on
  `landed` AND `held:escalation` (degraded: `polish:'skipped'`, End-state statuses as known, demotion log);
  **omitted** on `held:workflow-error` (infra death — ledger + issues are the record).
- [ ] Full gate green; temp-break proofs on the new assertions. Commit —
  `feat(war): disposition routing, phase-close sweep, dep-wave visibility, intent threading, handoff block (ADR 0012/0013)`.

### Task 2 — `/war-strategy` two-mode restructure

**Files:** `skills/war-strategy/SKILL.md`, `skills/war-strategy/war-strategy-structure.test.sh`.
**requiresTest:** true · **roster:** default (config `audit.roster`) · **deps:** none ·
**target repo:** superproject.

Full ruling in Open decisions 8; bake exactly:

- [ ] **Two modes.** *Bare invoke* = primer + handoff (templates + rule as today); from-scratch spec
  authoring routes to grill-with-docs + domain-modeling, and the **intent interview beat ships as a HANDOFF
  DIRECTIVE** the authoring skill executes — draft only from operator answers, echo the block back,
  explicit confirm. *With-artifact invoke* = **REVIEW & CONVERT**: war-shape gap review against the
  templates + rule (missing sections, same-file collisions, phase-edge violations, one-task-one-repo,
  release placement, plan-count/ordering at roadmap scale); gap-driven interview (one question at a time,
  recommendation first); structural fixes applied with confirmation; given a SPEC, author the war-shaped
  plan into `docs/plans/` itself, running the intent echo-back inline.
- [ ] **Pipeline doctrine:** war-strategy converts; **/red-team VALIDATES plans and never converts** —
  rewrite both `/red-team convert` mentions (frontmatter description ~:3, §4 Handoff ~:101). Replace both
  "no grilling loop" absolutes (~:8, ~:102) with the honest boundary: never authors a spec from scratch;
  deep from-scratch interviewing stays with grill-with-docs. Frontmatter description gains the
  bring-your-draft/convert trigger.
- [ ] **Plan template:** `## Commander's Intent` (Purpose / Method / numbered checkable End state) added
  INSIDE the template fence, before `## Build order` — no SKILL.md section renumbering (the structure
  test's `^## 3. The code-boundary decomposition rule` anchor is number-coupled).
- [ ] **Code-boundary rule:** rewrite consequence 2 to **dependency ⇒ wave edge** ("add X" + "call X from
  Y" = one phase, two waves via `deps`; phase edges remain for what must be *landed* first — cross-repo,
  release) — AND sweep the two other places the old doctrine lives: the heuristics paragraph (~:93-97,
  states it twice) and the template's `deps:` annotation line (~:56). A consequence-2-only edit leaves the
  file self-contradicting.
- [ ] **Structure test widening (absorbs #422 item 3):** anchor ALL FIVE SKILL.md sections + the new
  template headings. The test's grep is fence-blind — anchor template-internal headings with
  fence-safe patterns (e.g. exact leading-space/verbatim-line greps), and keep the widened set temp-break
  proven (delete a heading → RED).
- [ ] Full gate green. Commit —
  `feat(war-strategy): two-mode review-and-convert, intent template section + interview directive, wave-edge rule`.

### Task 3 — red-team `intent-vs-plan` spine lens

**Files:** `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`,
`skills/red-team/references/lenses.md`.
**requiresTest:** true · **roster:** default (config `audit.roster`) · **deps:** none ·
**target repo:** superproject.

- [ ] **SPINE entry (the executable home — a doc-only lens would never run):** add `intent-vs-plan`
  (`{ name, kind: 'spine', technique, prompt }`) to the `SPINE` array: each End-state condition
  individually checkable (else Major), mapped to ≥1 claiming phase (else Major), collectively sufficient
  for the Purpose (else Major `needsDecision`); missing `## Commander's Intent` section → lens passes with
  a **Minor** note recommending the intent interview — never Major (criterion 9).
- [ ] **Test:** add the new name to the `SPINE_NAMES` presence assertions in `workflow-scaffold.test.mjs`
  (non-exhaustive today — adding the entry alone would pass vacuously; the name assertion is the guard) +
  a Minor-not-Major prompt-text assertion, temp-break proven.
- [ ] **lenses.md:** 6th bullet under `## Spine lenses (always run)` in the house bold-name em-dash shape;
  update the count word "five" and keep the scaffold pointer accurate.
- [ ] Full gate green. Commit — `feat(red-team): intent-vs-plan spine lens`.

---

## Phase 2 — doc mirrors (1 task)

### Task 4 — WAR prose, schemas, design notes, glossary, ADRs

**Files:** `skills/war/SKILL.md`, `skills/war/references/schemas.md`, `skills/war/references/design.md`,
`CONTEXT.md`, `docs/adr/0012-intra-phase-visibility-and-phase-close-sweep.md`,
`docs/adr/0013-commanders-intent-and-disposition-routing.md`.
**requiresTest:** false · **roster:** `[{lens: correctness, depth: neighbors}]` · **deps:** none (phase
edge from Phase 1 is the dependency) · **target repo:** superproject.

- [ ] **SKILL.md — disposition prose at ALL THREE Minor/Nit-filing sites** (not the one the spec's surface
  table names): the "Minor/Nit → follow-up issues" refine bullet (~:44), the `--ace` residual-nits rule
  (~:46), and the checkpoint report's "minor issues filed" field (~:77 — now renders the handoff block).
- [ ] **SKILL.md — decompose-gate intent extraction:** step 1 (Lead reads the plan) extracts
  `## Commander's Intent` verbatim → threads `args.intent`; interactive: ask at the approval gate and
  transcribe when missing; `--afk`: `intent = null`, degrade to literal behavior — never Lead-invented.
- [ ] **SKILL.md — invariants:** sweep fail-open addendum; the never-force bullet (~:96) gains the explicit
  force-with-lease exemption matching T1's carve-out wording.
- [ ] **schemas.md:** AUDIT_VERDICT findings gain `disposition`/`phaseClose`, `autoFixable` marked
  deprecated (prose "remains schema-required" → "**becomes**" — see Open decisions 3); args `intent`;
  return `handoff` + `notes` canonical shapes; ledger gains the phase-level `handoff` field (written by the
  Lead from the Workflow return). WORKER_RESULT **unchanged**.
- [ ] **design.md:** frozen-base scope note (HARD for same-wave parallel tasks only); sweep + disposition
  sections.
- [ ] **CONTEXT.md (spec §6 terms):** Commander's Intent, Disposition, Phase-close coherence sweep, Clean
  handoff, Dep-wave visibility, Intent ceiling / plan floor.
- [ ] **ADRs 0012 + 0013:** status `proposed` → `accepted`; 0013 amended per the two-homes ruling (the
  intent interview beat lives in BOTH war-strategy homes: the bare-invoke handoff directive and the
  convert-mode inline echo-back).
- [ ] Grep-verify: zero surviving "Minor/Nit → follow-up issues" phrasing anywhere in `skills/war/**`
  ([[default-flip-must-audit-all-doc-surfaces]]). Full gate green. Commit —
  `docs(war): disposition + handoff + sweep mirrors; CONTEXT terms; ADRs 0012/0013 accepted`.

---

## Phase 3 — release

### Task 5 — bump the four canonical version slots

**Files:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2: `metadata.version`,
`plugins[0].version`), `README.md` `## Status` (REPLACE-in-place, no badge).
**requiresTest:** false · **roster:** `[{lens: correctness, depth: neighbors}]` · **deps:** none ·
**target repo:** superproject.

- [ ] **+0.1.0 over the land-time base** (the operator is the version authority — resolve the literal at
  land time; the series stacks nits(+patch) → roster(+0.1.0) → this). Verify all four slots by hand
  ([[version-slots-no-cross-slot-consistency-test]]). Status copy: *Clean handoff — Commander's Intent
  threading, disposition routing (absorb/follow-up/note), dep-wave visibility, phase-close coherence sweep,
  machine-readable handoff block (ADR 0012/0013).*
- [ ] Full self-discovering gate green. Commit — `chore(release): clean handoff (ADR 0012/0013)`.

---

## Notes / conscious deviations (ratify in /red-team)

- **Spec §5 surface-table path corrections:** the auditor standing file is root **`agents/war-auditor.md`**
  (`skills/war/agents/` does not exist; the spec's own §4.2 uses the correct path). `agents/war-worker.md`
  is added to T1 (the spec table omits it; the force-with-lease + rebase-first clauses are worker-surface
  changes under the same single-commit sync constraint). The red-team lens's executable home
  `workflow-scaffold.js` + its test are added to T3 (the spec table lists only `lenses.md` — a doc-only
  lens would never run).
- **Spec §4.5.5 partially dropped:** "branch registered in the run's owned-refs ledger exactly like a task
  branch" describes machinery that does not exist — no task branch is ever registered; only
  `ensure-integration` records ownership. Replaced by resolution 4 (ledger.json entry + handoff field).
- **Spec §4.2 "severity remains schema-required" is false** at the executable literal (finding items have
  no required array) — this plan *introduces* the requirement (resolution 3); schemas.md prose says
  "becomes".
- **Routing is a restructure:** the spec's "push site" framing collides with the live
  eager-push-then-splice mechanics (`minorsFiled` push before the approve branch + aced-splice) —
  T1 classifies at collection and preserves the splice's failed-ace → stays-filed fallback as a demotion
  arm.
- **`f.file` truthiness guard kept** in the successor aceable filter — the spec's quoted filter drops it;
  fileless findings take the severity-default demotion instead.
- **Sweep insertion point pinned:** after the ghost-dep sweep and the `landDecision` computation, before
  the land dispatch — the spec's "between the gate-audit pass and the Land block" seam is where
  `landDecision` does not exist yet.
- **war-strategy wave-edge rewrite sweeps three sites, not one** (consequence 2 + heuristics paragraph +
  template `deps:` annotation) — the spec names only consequence 2; a partial edit self-contradicts.
- **T2 absorbs #422 item 3** (structure-test widening) — declared won't-fix in the nit-sweep plan because
  this task owns the test.
- **lenses.md count word + SPINE_NAMES discipline** (survey-derived): the "five universal lenses" intro and
  the non-exhaustive name assertions both need touching or the change lands half-guarded.
- **Criterion 12 (Appendix A replay) is spec-time-checkable** — no task carries it; the PR cites it.

## Open decisions (resolved by /red-team)

Grilled + operator-ratified 2026-07-02. Recorded as resolved — ratify, don't re-open.

1. **Sweep roster** — the config default `audit.roster`, normalized like any task roster; Lead may NOT
   downgrade. Pseudo-task: branch `war/<slug>/p<N>-polish`, worktree `_polish`, issue = phase epic,
   planSlice = sweep charter. *Why:* the sweep touches the integrated tip — it gets the full panel, not a
   discount seat.
2. **End-state check is phase-scoped** — rides the gate-audit pass; empty `mergedTasksForGateAudit` +
   ≥1 claimed condition → ONE End-state-only seat at the confirmed tip (logged). *Why:* preserves
   roster-D7's cost saving without letting a docs-only phase skip its own claimed conditions.
3. **AUDIT_VERDICT tightened** — finding items gain `required:['severity']` + declared optional
   `disposition`/`phaseClose`/`autoFixable` (deprecated, removed next release); schema retry → dropped-seat
   lane on persistence. *Why:* the spec's "severity remains schema-required" was false — this plan makes it
   true.
4. **Polish bookkeeping** — task-grade `ledger.json` entry + polish SHA/status in the handoff block; NO
   owned-refs registration. *Why:* the spec described nonexistent machinery; §9's
   no-provisioning-script-change stands.
5. **Discarded sweep disposal** — leave branch + `_polish` worktree; record `handoff.polish:'discarded'` +
   branch name; reaping is human (never-lose-unmerged-commits). Same-phase-resume reuse documented: worst
   case a wasted worker re-judged by the panel; the tip stays guarded by discard-on-reject.
6. **Force-with-lease carve-out** — own task branch only, only after a dispatch-rebase diverged it from its
   pushed remote; identical wording on both worker surfaces in one commit; SKILL.md never-force bullet
   gains the exemption. *Why:* dep-rebase leaves a cleanly-rebased branch non-ff against its own remote and
   the standing instruction said plain `git push`.
7. **Dep-rebase clause scoped by taskType** — same-repo deps only; `gitlink-bump` excluded. *Why:* a
   gitlink-bump's dep merged into the submodule repo's integration branch; the clause would assert a merge
   from a different repo.
8. **war-strategy two-mode ruling** — bare invoke = primer + handoff (intent beat as a handoff DIRECTIVE:
   draft from operator answers, echo back, explicit confirm); with-artifact invoke = review & convert
   (gap review, one-question-at-a-time interview with recommendation first — the partial overlap with
   grill-with-docs is operator-ratified; given a spec it authors the plan itself, intent echo-back inline).
   Pipeline doctrine: war-strategy converts, **/red-team validates and never converts**. *Why:* the
   "no grilling loop" absolute was dishonest about the gap interview; the honest boundary is
   never-authors-a-spec-from-scratch.
9. **Terminal-disposition demotion ladder** — uniform: demote one step toward durability, never drop
   silently, every demotion logged. Failed absorb → follow-up; never-approved task's findings → follow-up
   with the escalation; held-phase queue → drained to follow-up; fileless absorb → severity default.
   *Why:* End state 1 requires zero unrouted findings on every exit path, not just the happy one.
10. **Handoff emission** — on `landed` AND `held:escalation` (degraded: `polish:'skipped'`, statuses as
    known, demotion log); omitted on `held:workflow-error`. Ledger placement: phase-level `handoff` field
    in `ledger.json`, written by the Lead from the Workflow return. *Why:* an escalated phase still hands
    off — the next decompose needs the debt map most exactly then; infra death has no trustworthy return
    to render.
