# Survey-corps memory mining — lessons become issues before the sweep

## 1. Context — the gap / problem

`/survey-corps` turns the open-issue backlog into war-shaped design specs, but the memory system
is a second backlog it never reads: durable lessons in `docs/learnings/` and the local root record
open defects, ceilings, and recurring traps (some with double-digit recurrence counters) that no
one ever filed as issues. That debt is invisible to the pipeline — it can only become spec'd work
if a human happens to re-discover it. The fix: a mining step that runs **before** the sweep, turns
qualifying lessons into real GitHub issues, and then lets the existing sweep → cluster → synthesize
machinery treat them like any other issue.

Ratified in the grill session of 2026-07-11.

## 2. Pivotal constraints

- **Ordering is fixed**: mine → file issues → existing sweep. Mined issues are *real* issues that
  ride the normal pipeline; there is no parallel "virtual issue" channel.
- **The local root can contain lint-demoted content.** The redaction lint demotes lessons carrying
  home paths, emails, handles, or credential shapes to the local root — mining local lessons into
  public issues without a guard would publish exactly what the lint scrubbed.
- **Bare invoke stays cron-able** (fully autonomous end to end); `--erwin` remains the only
  human-gate flag.
- **Idempotency**: re-surveys are normal (manifest is latest-wins); mining must never re-file.
- **Never dropped silently**: every mined-and-not-filed lesson appears in the closing report with a
  reason (the existing completeness discipline, extended to mining).

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Mine which roots? | **Both roots' hot sets**: the repo root (`docs/learnings/`) and the local root. `archive/` (both roots) is excluded — cold lessons are mostly resolved/evicted. |
| 2 | Leak guard for local-root candidates | **Lint body, skip on hit**: every drafted issue body is piped through the existing fail-closed redaction lint (`war-memory.mjs lint`) before `gh issue create`. A hit → the issue is NOT filed; the lesson is reported as `withheld: redaction`. No auto-scrub, ever. |
| 3 | Filter predicate | **Open actionable defects only**: a lesson qualifies iff it names a still-live defect, limitation, or ceiling in the target repo's code/docs, verified against the live tree by the reader agent (referent exists; not `[RESOLVED]`/superseded). Process recipes and `user`/`feedback`-typed lessons are excluded. Recurrence counters boost priority in the issue body, not eligibility. |
| 4 | Dedup rule | **Slug search, never re-file**: search issues open AND closed for the lesson slug. Open hit → skip (the normal sweep picks it up). Closed hit → skip and report `previously adjudicated (#N)` — a human reopens if they disagree. A closed-as-fixed issue whose lesson still verifies live is a stale-lesson signal reported for `/lessons-learned`, never acted on here. |
| 5 | Filing gate | **Autonomous on bare invoke; `--erwin` gates it**: bare invoke files immediately after lint + dedup. Under `--erwin` the run pauses **before filing** (present the drafted issue batch; file only approved ones) — a second pause in addition to the existing post-clustering gate. |
| 6 | Provenance marking | **New label `memory-mined`** (created on the target repo if absent) + the issue body cites the lesson path/slug and its provenance tier. `war-followup` keeps its distinct run-debt meaning. The sweep's bookkeeping-label filter is untouched — `memory-mined` passes through. |
| 7 | Manifest schema | **Unchanged.** The issue body's lesson citation carries the durable issue↔lesson chain; mining results live in the closing coverage report only. |

## 4. Mechanics

**New Step 0 — Mine** (before the existing Sweep step in `skills/survey-corps/SKILL.md`):

1. Enumerate hot lessons from both roots (repo root `docs/learnings/`, local root via the same
   resolution `render-index` uses). Exclude `archive/`.
2. Reader fan-out (may share the existing Workflow): per lesson, verify the referent against the
   live tree and classify — actionable / resolved-or-stale / process-recipe / excluded-type.
3. Per actionable lesson: draft the issue (title from the lesson `description`; body = the defect
   statement, the lesson citation `docs/learnings/<slug>.md` or `<local>/<slug>.md`, provenance
   tier, recurrence note if any).
4. Dedup: `gh issue list`/`search` for the slug across open + closed states (decision 4).
5. Lint: pipe the drafted body through the redaction lint (decision 2).
6. File survivors with the `memory-mined` label (decision 6), honoring the `--erwin` pause
   (decision 5).
7. Report rows for every mined lesson: `filed #N` / `withheld: redaction` /
   `previously adjudicated (#N)` / `skipped: <not-actionable reason>`.

**Steps 1–6 (existing)** run unchanged; freshly filed `memory-mined` issues enter the sweep as
ordinary open issues. The closing coverage report gains a **Mining** section rendering the rows
from Step 0.7 ahead of the existing issue→spec table.

## 5. Surface changes

- `skills/survey-corps/SKILL.md` — new Step 0 (Mine), `--erwin` gains the pre-filing pause,
  coverage report gains the Mining section, description/frontmatter mentions memory mining.
- No changes to the survey-manifest schema, `/war-machine`, or `war-memory.mjs` (the lint is
  consumed as-is).
- README pipeline blurb for `/survey-corps` (one line: issues **and memories** → specs).

## 6. New domain terms (CONTEXT.md)

- **Memory mining** — the survey's Step 0: turning qualifying hot lessons from both memory roots
  into real tracker issues (lint-guarded, slug-deduped) before the issue sweep runs.
- **memory-mined** — the provenance label carried by an issue that originated as a lesson; the
  body's lesson citation is the durable issue↔lesson link.

## 7. Recommended ADRs

None — reversible (delete the step), unsurprising given the pipeline's existing shape, and no
genuine alternative was rejected that a future reader would puzzle over.

## 8. Open risks / implementation notes

- **Local-root titles can leak too.** The lint runs on the full drafted body *including title*;
  the drafting instruction should quote lesson bodies minimally.
- **`gh` search by slug is substring-fragile** — cite the slug verbatim in a fixed, greppable body
  line (e.g. `Lesson: <slug>`) so the dedup search has a stable token.
- **Label creation needs a gh write** — ride the existing gh-preflight (`overrides.ghUser`)
  discipline like every other gh write batch.
- Mining volume on first run may be large (a mature repo has 100+ hot lessons); the reader
  fan-out batches like the existing per-issue readers.

## 9. Non-goals / deferred

- No archiving/retiring of lessons (that's `/lessons-learned`; this skill only *reports*
  stale-lesson signals).
- No auto-close loop (issue closed → lesson archived) — deferred to `/aftermath`/`/lessons-learned`
  evolution.
- No mining of `archive/` cold sets.
- No manifest schema change.

## 10. Validation criteria

1. A fixture lesson naming a live defect → issue filed with `memory-mined` label and a body line
   citing the lesson slug; re-running the survey files **zero** duplicates (open-hit skip).
2. A fixture lesson whose slug appears in a **closed** issue → not filed; report row says
   `previously adjudicated (#N)`.
3. A fixture local-root lesson containing a home path or email → not filed; report row says
   `withheld: redaction`; `gh issue list` confirms nothing was created.
4. A `[RESOLVED]` lesson and a `user`-typed lesson → both reported `skipped`, neither filed.
5. `--erwin` run: no `gh issue create` occurs before the operator approves the drafted batch.
6. Bare invoke end-to-end: mined issues appear in the sweep and the closing coverage report maps
   each to a spec or a deferral, plus the Mining section accounts for every mined lesson.
