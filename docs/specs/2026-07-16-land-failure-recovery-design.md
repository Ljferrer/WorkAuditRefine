# Land-failure routing and recovery ergonomics — a dead land agent must never read as `landed`, and per-phase dispatches must carry operator-meaningful identity

Date: 2026-07-16
Status: draft (claims verified against the live tree 2026-07-16) — awaiting conversion

## 1. Context — the gap / problem

Source issues: #925

**#925 — false `landed` on a dead land agent, and a resume hint that invites the wrong recovery.**
A phase whose `land:phase-<N>` refiner dispatch dies on a transient API error (observed: 529
Overloaded, 0 tokens, `land-advance` never ran) finishes the Workflow with notification
`status: completed` and `landResult: null`. Verified in the live
`skills/war/assets/workflow-template.js`: every branch of the land routing chain that follows the
`land:phase-<N>` dispatch (in the section under the `---- LAND — only when no hard escalation is
open ----` banner comment) is guarded by `landResult &&` — the `submodule-pr` direct return, the
`HARD_ESCALATION_REASONS.includes(landResult.status)` arm, both `gate_failed` classification arms,
the `error || gate_failed` demotion arm, and the opportunistic-resync arm. A null result matches
none of them, so `landDecision` keeps the pre-dispatch value computed from the merged set —
`'landed'` — while the working branch was never advanced. A harness probe against the live template
(reader evidence, 2026-07-16) confirms: `landDecision:'landed'`, `landResult:null`, zero land
escalations, `handoff` present. The wrap-up gate (`landResult && landResult.status === 'landed'`)
correctly skips the servitor, but the Lead's fail-closed phase classification (`skills/war/SKILL.md`
§4.2) takes a returned in-set `landDecision` as truth at step 3 — so the DAG advances, the epic is
closed as landed, and the next phase's `cmd_ensure_integration` cuts its base from an
`origin/<working>` tip that silently lacks this phase's content. The Resume reconciliation
pre-flight's landed-phase check would flag the mismatch on a later resume — defense-in-depth, not
prevention.

The recovery ergonomics then compound the defect: the Workflow tool prints an unconditional
harness-owned resume hint (`To resume … Workflow({scriptPath, resumeFromRunId})`). A Lead following
it re-enters the same run and re-dispatches the already-merged tasks' `merge:*` agents **live** —
`skills/war/references/design.md` §6 records `resumeFromRunId` as an off-ladder journal replay that
re-runs the gate and the push-first CAS. During the same overload window those re-dispatches
re-fail, converting one transient land-agent death into `held:escalation` (~730k tokens in the
observed repro). The sanctioned paths — recovery relaunch (fresh `runId`, derive-and-skip) or the
manual tree-identity land — are documented in `skills/war/SKILL.md` but nothing at the failure
point steers to them, because the failure point reads `completed`/`landed`.

The enum fix is free: `held:land-failed` already exists in `KNOWN_LAND_DECISIONS`
(`skills/war/assets/land-decision.mjs`) and already has a Lead runbook bullet (SKILL.md §4.3), and
the baseline-proceed re-land arm already handles *its* null result via the
`reLand ? reLand.status : 'error'` fallback — the primary dispatch simply lacks the same arm.

**Operator-added requirement (clustering gate) — per-phase dispatch identity.** Operator evidence
(screenshot of the /workflows UI): a completed per-phase run renders title `workflow-template` with
description `WAR per-phase execution: Work, Audit, Refine, Land, …`, making every phase of every
plan read identically in the workflow list and task notifications. Verified against source: the
live template's `export const meta` block carries `name: 'war-phase'` — **not** `workflow-template`
— so the rendered title evidently derives from the dispatched script file's **basename**
(`assets/workflow-template.js`), while the rendered description matches `meta.description`. The
design must therefore cover the real display surface: dispatch a run-scoped copy whose basename
carries the plan slug + phase number, and substitute the same identity into
`meta.name`/`meta.description` as pure literals before dispatch (the template sandbox has no
shell/fs to compute them — see `docs/learnings/template-defers-runtime-values-to-agent-via-literal-placeholder.md`).

## 2. Pivotal constraints

- **ADR 0005 enum discipline.** No new enum member anywhere: `held:land-failed` is reused; the
  emitted-superset comment above the `let landResult = null` declaration stays at 6 values;
  `held:workflow-error` is never added to `HARD_ESCALATION_REASONS`; `land-decision.mjs` is
  untouched.
- **Sandbox mirrors.** The Workflow sandbox cannot import (constants are hand-mirrored) and has no
  shell/fs (`meta` must remain a pure literal in the dispatched text; runtime values are deferred
  to agents, never computed by the template).
- **Harness-owned surfaces are immutable from this repo.** The resume-hint text and the
  workflow-list title renderer cannot be changed here. The hint is countered in skill prose; the
  renderer is fed better inputs (basename + meta literals).
- **Doc-surface drift guard.** `land-decision.test.mjs` pins the landDecision token set across 4
  doc surfaces via line anchors (`` `landDecision` ∈ `` in SKILL.md, `not in the known set` in
  §4.2, and two schemas.md anchors). Prose edits near those lines must preserve the anchors and
  must not change the token surface counts.
- **`resumeFromRunId` contract.** `held:phase-incomplete`-only, off-ladder journal replay,
  re-runs merges + CAS live (design.md §6). This spec narrows nothing and widens nothing about it —
  it only makes the contract visible at the land-failure outcome site.
- **Structural-test comment-strip trap.** Naive block-comment stripping in
  `workflow-template.test.mjs` is corrupted by glob literals containing `/*` (issue #929, lesson
  `glob-literal-fools-block-comment-strip-regex-in-structural-tests`). Any new source-text
  assertion this spec adds must be line-scoped or strip line comments only.
- **Main-checkout anchoring.** Run-scoped state lives under the main checkout resolved via the
  ratified `git rev-parse --path-format=absolute --git-common-dir` idiom; `.claude/war/runs/`
  rides the existing `ensure-exclude` (no `.gitignore` change).
- **Resume needs a stable `scriptPath`.** `Workflow({ scriptPath, resumeFromRunId })` must receive
  the same script across Lead restarts — staged copies must persist for the run's life and never
  live in a reaped worktree directory.
- **Importing the template executes it.** The template's top-level body *is* the phase run; tests
  over a staged copy must assert on its text, never `import()` it.
- **Standing/dispatched split.** Prose changes in `skills/war/SKILL.md` and the corresponding
  template text (header comment, meta anchors) must move in the same change.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Route for a null/unrouted primary land result | `held:land-failed`. Not `held:workflow-error` (HARD-halts and forbids the natural re-land) and not `held:phase-incomplete` (its `--afk` auto-resume is exactly the hazardous `resumeFromRunId` path). The land never ran; the integration tip is complete and gate-green; `held:land-failed` already means "the land step itself failed — the Lead re-runs the land". |
| 2 | Arm shape | A terminal `else` on the primary land routing chain: push `{ task: 'phase-<N>-land', reason: landResult ? String(landResult.status \|\| 'error') : 'error', detail: landResult }` onto `escalated`, set `landDecision = 'held:land-failed'`. Mirrors the baseline-proceed re-land's existing `reLand ? reLand.status : 'error'` fallback idiom. Catches both the null result and a non-null result whose status matches no routed value. |
| 3 | Engine-side retry of a dead land dispatch | None. A blind immediate re-dispatch during an overload window compounds the outage — the exact recorded failure mode. Retry discipline stays Lead-side where `--afk`/interactive rules already exist. |
| 4 | Lead runbook extension | The §4.3 `held:land-failed` bullet gains root cause **(c) dead land agent**: predicate = the escalated `phase-<N>-land` entry carries `reason:'error'` with a null/evidence-free `detail` (the agent died; no `MergeResult` was produced). Recovery = the same one-primitive land every land uses (fetch, detach `_refinery` at `origin/<working>`, `merge --no-ff` the integration tip, resolved gate, single `land-advance`, closing `sync-follower` assertion — the escalation-completion recipe), or the full recovery relaunch when the operator prefers a fresh run. Same green-gate guard and `--afk`-auto / interactive-offer discipline as branches (a)/(b). |
| 5 | Anti-hint prose | Both the `held:land-failed` bullet and the "Resume vs. recovery relaunch" paragraph state explicitly: the Workflow tool's printed `resumeFromRunId` hint is generic harness text — following it after a land failure re-dispatches already-merged `merge:*` agents live (gate + push-first CAS re-run), and is exactly wrong during a transient-API window when the integration tip is already complete and green. |
| 6 | Dispatch title format | Basename `war-<planSlug>-p<N>.js`; when the run belongs to a campaign, `war-c<K>-<planSlug>-p<N>.js` with `K` = the plan's 1-based position in the campaign queue. `meta.name` = the basename minus `.js`; `meta.description` = `WAR phase <N> of <planSlug>[ (campaign plan <K>)]: Work, Audit, Refine, Land, then Wrap-up learnings.` Both substituted pre-dispatch as pure literals; `meta.phases` untouched. |
| 7 | Staging mechanism | A new small helper `skills/war/assets/stage-workflow.mjs`: reads the shipped template, replaces **exactly once** each of the two meta anchor literals (`name: 'war-phase'` and the shipped description literal), writes the staged copy, prints the staged absolute path (the `scriptPath` to dispatch). Exits non-zero when an anchor is missing or matches more than once (fail-loud, never a silent fork). Exports pure `deriveName`/`deriveDescription` helpers so the title format lives in one testable place. Deterministic: same inputs ⇒ same bytes (idempotent restaging on resume). |
| 8 | Staged-copy home + retention | `$MAIN/.claude/war/runs/<runId>/` — a per-run directory sibling of the run manifest, same main-checkout anchor, riding the existing `.claude/` exclude. Retention = the manifest's (kept, not reaped): the copies double as dispatch provenance for `/war-review`, and a recovery relaunch (new `runId`) gets its own directory, so no collisions. |
| 9 | Campaign ordinal source | `/war-campaign` passes the ordinal explicitly on its step-4 `/war` invocation — the campaign Lead already iterates the queue in order (it derives `dev/<slug-N>` stacking from the same position), and the ledger's `plans[]` array order is the authority. `/war` never scans campaign ledgers itself; an absent ordinal simply omits the `c<K>` segment. |
| 10 | Injected-stages home | The staged copy becomes *the* sanctioned copy for approved stage injection — the template's header comment ("The Lead may inject APPROVED extra stages by editing a copy of this file") is updated to name the staged per-phase copy, unifying the two copy reasons. |
| 11 | Prose lock for the new clauses | Extend `land-decision.test.mjs` (which already reads both doc surfaces) with one case-tolerant, mid-sentence-anchored grep asserting the never-`resumeFromRunId`-on-land-failure clause exists in SKILL.md (lesson `prompt-only-clause-grep-guard-must-tolerate-sentence-case`). No new whole-file comment-strip regexes. |

## 4. Mechanics

**Workflow engine (`skills/war/assets/workflow-template.js`).**
- In the LAND section, after the existing routed arms of the primary `land:phase-<N>` dispatch,
  add the terminal `else` arm per decision 2. The chain's existing arms are untouched; the
  emitted-superset comment stays at 6 values (`held:land-failed` is reused, ADR 0005-safe).
- Update the header comment naming the sanctioned copy-editing flow (decision 10) — same commit as
  the SKILL.md launch-prose change (standing/dispatched split).
- The shipped template's `meta` block itself is unchanged (`name: 'war-phase'` stays — it is the
  stager's anchor).

**Engine tests (`skills/war/assets/workflow-template.test.mjs`).**
- Beside the existing "Task 5 — land step error → landDecision held:land-failed …" tests, add:
  (i) land dispatch returns `null` → `landDecision === 'held:land-failed'`, an escalated entry
  `{ task: 'phase-1-land', reason: 'error' }`, `servitorResult === null`, and no servitor dispatch
  recorded; (ii) land dispatch returns an unrecognized status (e.g. `{ mode:'land-phase',
  status:'bogus' }`) → `held:land-failed`, never `'landed'`. Any accompanying source-text assertion
  must be line-scoped (constraint above).

**Lead prose (`skills/war/SKILL.md`).**
- §4.3 `held:land-failed`: add root cause (c) + the anti-hint warning (decisions 4–5).
- "Resume vs. recovery relaunch" paragraph: add the one-sentence hint warning (decision 5).
- Per-phase launch prose ("Run **one Workflow per phase** …"): insert the staging step — run
  `stage-workflow.mjs` with the template path, the run's staged-scripts dir, `planSlug`,
  `phase.id`, and the optional campaign ordinal; dispatch the **printed staged path** as
  `scriptPath`. The `held:phase-incomplete` resume bullet gains: resume passes the **same staged
  scriptPath** the launch used.

**Schemas (`skills/war/references/schemas.md`).**
- The `held:land-failed` description bullet gains the dead-land-agent root cause (a dispatch that
  died producing no `MergeResult` routes here, with `reason:'error'`, `detail:null`). The
  landDecision enum lines are untouched.

**Stager (`skills/war/assets/stage-workflow.mjs` + `stage-workflow.test.mjs`, new).**
- Per decisions 6–8. The test asserts on staged **text** and on the exported derive functions;
  it never imports the staged module. It also asserts the staged copy differs from the shipped
  template in exactly the two meta literals (whole-file comparison after substituting them back),
  and that a template missing an anchor fails loud.

**Campaign prose (`skills/war-campaign/SKILL.md`).**
- Step 4 ("Execute") threads the plan's queue ordinal into the `/war` invocation (decision 9).

**Drift guards (`skills/war/assets/land-decision.test.mjs`).**
- One added prose pin per decision 11; the existing 4-surface parity tests must stay green
  unmodified.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | terminal else arm on the primary land routing chain; header-comment update for the staged-copy flow |
| `skills/war/assets/workflow-template.test.mjs` | null-land + unrecognized-status tests beside the existing Task-5 land tests |
| `skills/war/SKILL.md` | §4.3 `held:land-failed` root cause (c) + anti-hint warning; Resume-vs-recovery warning; launch prose staging step; resume bullet staged-scriptPath note |
| `skills/war/references/schemas.md` | `held:land-failed` description gains the dead-land-agent root cause |
| `skills/war/assets/stage-workflow.mjs` (new) | the staging helper (decisions 6–8) |
| `skills/war/assets/stage-workflow.test.mjs` (new) | stager unit + text-diff tests |
| `skills/war/assets/land-decision.test.mjs` | one case-tolerant prose pin for the never-resume clause |
| `skills/war-campaign/SKILL.md` | step 4 passes the campaign ordinal to `/war` |

Deliberately untouched: `skills/war/assets/land-decision.mjs` (no enum change),
`agents/war-refiner.md` (the fix is Workflow-side routing; refiner behavior and `land-advance` are
unchanged), `hooks/` (no confinement change).

## 6. New domain terms (CONTEXT.md)

- **Staged phase script** — the run-scoped, identity-stamped copy of `workflow-template.js` the
  Lead dispatches for one phase (`war-[c<K>-]<planSlug>-p<N>.js` under the run's
  `.claude/war/runs/<runId>/` directory); the only sanctioned home for approved stage injection.
- **Dead-agent land failure** — a `land:phase-<N>` dispatch that dies producing no `MergeResult`
  (null result); routes `held:land-failed` with `reason:'error'`, `detail:null`.

## 7. Recommended ADRs

- **Run-scoped staged phase scripts** (next free ADR number at land time): the dispatch identity
  contract — basename + meta literal substitution, the staging helper's replace-exactly-once
  fail-loud rule, the `.claude/war/runs/<runId>/` home, manifest-equivalent retention, and the
  resume same-scriptPath requirement. The null-arm routing fix needs no new ADR — it operates
  entirely inside ADR 0005's reuse discipline.

## 8. Open risks / implementation notes

- **Fallback reason string.** Implementation latitude on `String(landResult.status || 'error')`
  vs a flat `'error'` for non-null unrouted results; either way the reason string is escalation
  metadata, never a new member of `HARD_ESCALATION_REASONS` or any enum.
- **Drift-guard anchors.** The §4.3 and schemas.md edits sit near the 4 pinned doc surfaces —
  verify the `` `landDecision` ∈ ``, `not in the known set`, and schemas anchor lines survive
  byte-intact and the token counts are unchanged (`node --test skills/war/assets/land-decision.test.mjs`).
- **Source-text assertions.** Follow the line-scoped precedent (the narrowed strip already applied
  to one sibling site) — never the two-step block-comment strip (#929 owns fixing the existing
  sites; this spec must not add a fourth victim).
- **Stager tests must not execute the template.** `import()` of a staged copy runs the phase body;
  assert on file text and on the exported pure derive functions only.
- **Long titles.** Dated plan slugs produce long basenames (`war-2026-07-14-lessons-learned-….js`);
  accepted — UI truncation is preferable to lossy slug shortening, and `planSlug` stays verbatim
  (it is the same token branch names derive from).
- **Idempotent restaging.** A same-run resume may restage before resuming; identical inputs must
  produce identical bytes so `scriptPath` content never shifts under a journal replay.
- **Manifest cross-link (optional).** The stager or the Lead may record the staged path in the run
  manifest for `/war-review` provenance — fail-open telemetry, implementation latitude.
- **Reader evidence was line-numbered.** The issue and reader cite template line numbers; this spec
  anchors by named construct (the LAND banner comment, the `land:phase-<N>` label, the
  `relandDiscrimination` helper, the `export const meta` block) — line numbers rot across the
  serial merge queue.

## 9. Non-goals / deferred

- Changing any harness-owned surface: the printed resume-hint text, the workflow-list title
  renderer, or the notification `status` vocabulary.
- New enum members, `handoff` emission on `held:land-failed`, or any `land-decision.mjs` change.
- Engine-side automatic re-dispatch of a dead land agent (decision 3 rationale).
- Null-result hardening of the other dispatch sites (`merge:*`, audit seats, provision) — the wave
  loop and merge routing have their own guards; a broader sweep is a separate survey if wanted.
- Reaping staged phase scripts (`/aftermath` scope; retention deliberately equals the manifest's).
- Renaming `meta.phases` step titles (Provision/Work/… are fine generic).

## 10. Validation criteria

1. **Null land routes held:land-failed.** New test in `skills/war/assets/workflow-template.test.mjs`:
   with the Land-phase mock returning `null`, `out.landDecision === 'held:land-failed'`,
   `out.escalated` contains an entry with `task` ending `-land` and `reason === 'error'`,
   `out.servitorResult === null`, and no servitor call was made. `node --test
   skills/war/assets/workflow-template.test.mjs` green.
2. **Unrecognized status never reads landed.** Companion test: Land mock returns
   `{ mode:'land-phase', status:'bogus' }` → `landDecision === 'held:land-failed'`, never
   `'landed'`.
3. **No behavior change on routed paths.** The existing Task-5 land tests (`land_stale`,
   `gate_failed`, `error`, landed/resync) pass unmodified.
4. **Enum + doc parity intact.** `node --test skills/war/assets/land-decision.test.mjs` green,
   including the new never-resume prose pin (case-tolerant, mid-sentence anchor).
5. **Runbook prose present.** `grep -in "dead land agent" skills/war/SKILL.md` hits inside the
   `held:land-failed` bullet, and a same-bullet clause states that `resumeFromRunId` re-runs
   merges/CAS live and must not be used for a land failure.
6. **Schemas prose present.** `grep -n "held:land-failed" skills/war/references/schemas.md` shows
   the description bullet naming the dead-land-agent root cause; the enum union line is
   byte-unchanged.
7. **Stager derivation.** `node --test skills/war/assets/stage-workflow.test.mjs` green: basename
   `war-<slug>-p<N>.js` (and `war-c<K>-<slug>-p<N>.js` with an ordinal); staged text carries the
   derived `meta.name`/`meta.description` literals; staged copy differs from the shipped template
   in exactly those two literals; a template with a missing/duplicated anchor exits non-zero.
8. **Anchor guard.** A test asserts the shipped `workflow-template.js` contains exactly one
   occurrence of each stager anchor literal (line-scoped match — no block-comment stripping).
9. **Launch + resume prose.** `grep -n "stage-workflow" skills/war/SKILL.md` hits the per-phase
   launch prose; the `held:phase-incomplete` bullet references dispatching/resuming the staged
   scriptPath. `grep -n "stage-workflow\|ordinal" skills/war-campaign/SKILL.md` shows step 4
   threading the ordinal.
10. **resumeFromRunId consistency sweep.** `grep -rn "resumeFromRunId" skills/ agents/ docs/adr/
    skills/war/references/` — every hit must be consistent with the held:land-failed guidance
    (held:phase-incomplete-only, never for land failures). The grep is a completeness floor, not a
    ceiling — after the grep, hand-scan `skills/war/SKILL.md`'s Resume and Checkpoint sections and
    the template's prompt text for same-meaning stragglers ("resume the run", "replay the
    journal") and list each one found as a survey-derived correction.
11. **Live-title observation (manual).** After one staged dispatch, the /workflows UI renders the
    phase title as `war-[c<K>-]<planSlug>-p<N>` and its description names the plan + phase —
    operator-eyeball criterion; the automated proxy is criterion 7's basename/meta assertions.
