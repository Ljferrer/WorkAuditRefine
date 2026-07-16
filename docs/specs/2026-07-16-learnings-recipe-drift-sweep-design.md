# Retired-token sweep — a Lead-run, phase-close backstop catches stale command recipes in memory lessons when land/merge mechanics change

Date: 2026-07-16
Status: draft (memory-mined; claims verified against the live tree 2026-07-16) — awaiting conversion

## 1. Context — the gap / problem

Source issues: #930

Lesson bodies under `docs/learnings/` carry hand-authored *operational recipes* — numbered lists of
literal git commands a Lead is told to run (the canonical instance:
`docs/learnings/held-escalation-lead-manual-completion.md`, whose old step 5 was a raw
`git push … --force-with-lease=…`). Unlike hand-mirrored code constants (`HARD_ESCALATION_REASONS`,
`KNOWN_LAND_DECISIONS`), which dedicated drift-guard tests bind, **no drift-guard test, floor, or
grep-parity check binds lesson prose** — the mirror registry from the
drift-guards-for-mirrored-and-asserted-facts work covers code constructs only. When a plan retires,
renames, or consolidates a land / merge / escalation mechanism — as when `cmd_land_advance`
consolidated every land call site onto the land-advance primitive (ADR 0023) — stale recipes in
lesson bodies survive silently until a human happens to reread them.

Issue #930 (memory-mined 2026-07-16 from
`docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md`) asks to mechanize
the manual backstop that lesson's "How to apply" paragraph describes: when land/merge mechanics
change, grep `docs/learnings/` for the retired mechanism's literal command tokens (raw `git push`,
`--force-with-lease`, `update-ref`, `ls-remote`, and similar) so recipes get corrected or filed as
debt instead of rotting. Verified against the live tree, no surface carries such a step today:

- the phase-close coherence sweep (ADR 0012; the `- **Sweeps (phase-close, ADR 0012)**` bullet
  under `## Per phase (in DAG order)` in `skills/war/SKILL.md`, and the `phaseCloseQueue` dispatch
  in `skills/war/assets/workflow-template.js`) is **strictly findings-queue-driven** — it fixes only
  auditor-flagged `absorb`/`phaseClose:true` findings, never hunts;
- the servitor wrap-up (standing file `agents/war-servitor.md` + the dispatched Wrap-up prompt in
  `workflow-template.js`) has no retired-token instruction;
- `/lessons-learned` Phase 2 verifies lesson claims against the live repo, but only on demand — it
  is housekeeping, not refactor-triggered.

The motivating instance is already fixed in prose (step 4 of
`held-escalation-lead-manual-completion.md` now routes through the single `land-advance` primitive
and explicitly *negates* the raw-push tokens), so only the general mechanization gap remains. That
fixed lesson also demonstrates the central trap: its body still *mentions* `--force-with-lease`,
`update-ref`, and `ls-remote` — in narration position, describing the retired dance — so a naive
token grep hits it. Any mechanization must adjudicate, never hard-fail (the same trap recorded in
the local lesson release-blurb-describing-a-rename-trips-the-renames-own-absence-guard).

## 2. Pivotal constraints

- **Adjudication is semantic, so the sweep can never be a fail-closed gate, floor, or hook.**
  Legitimate teaching narration deliberately names retired tokens (past-tense or negated mentions);
  a hard grep gate would flag exactly the lessons that were correctly rewritten. The sweep files
  debt and records; it never blocks or holds a land (consistent with ADR 0017 — it is not a
  validation being waived, it is a detection step that routes findings).
- **"Phase-close sweep" is taken.** ADR 0012's coherence sweep is engine-dispatched and strictly
  findings-queue-driven; the new mechanism must not touch `phaseCloseQueue`, the polish worker, or
  `workflow-template.js` at all, and needs its own name.
- **The servitor cannot own the trigger.** Its spawn inputs (phase id/title, landed tasks, audit
  log, escalations, plan slice) carry no reliable "this phase retired a mechanism" signal; threading
  one would require engine changes plus the standing-file/dispatched-prompt dual edit. The Lead has
  the plan, the landed diff, Bash, and the gh-write path — it is the only seat that can run this
  cheaply.
- **gh writes require the preflight.** Any issue filed by the sweep must ride the existing
  per-phase gh-write batch in `skills/war/SKILL.md` `## Per phase (in DAG order)` (the paragraph
  that runs `gh-preflight.sh` before updating issues + ledger) — never a bare `gh` call.
- **Local-root lessons may hold personal content.** Nothing from the local memory root is ever
  quoted into a public GitHub issue; local hits are report-only.
- **Prose locks must survive rewording pressure.** The drift guard for the new clause follows the
  existing `doc-contract:` test family in `skills/war/assets/war-config.test.mjs` and must tolerate
  sentence case and anchor on mid-sentence tokens (the
  prompt-only-clause-grep-guard-must-tolerate-sentence-case lesson).
- **Grep is a floor, not a ceiling** (`skills/war-strategy/SKILL.md` §2 rule): the sweep
  instruction itself must mandate a hand-scan beyond the literal token grep, with stragglers listed
  as survey-derived corrections.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Placement | One Lead-run prose step in `skills/war/SKILL.md` under `## Per phase (in DAG order)`, adjacent to the per-phase gh-write batch paragraph, executed on a **landed** phase. Rejected: servitor wrap-up (no trigger signal without engine threading; dual-surface edit; weaker judgment seat); engine/`phaseCloseQueue` (ADR 0012 sweep is findings-queue-driven by design; this needs judgment + gh writes); `/lessons-learned` (on-demand, not refactor-triggered — it stays the generic net beneath this one). |
| Name | **Retired-token sweep** — a new CONTEXT.md term, explicitly distinct from the ADR 0012 phase-close coherence sweep. |
| Trigger | Lead judgment at each landed phase close: did this phase retire, rename, or consolidate a land, merge, or escalation mechanism (a command, script subcommand, procedure step, or status token that prior lesson prose could cite as a recipe)? Signals: the plan slice / Commander's Intent plus the landed diff. Not plan-declared — a plan field would reopen the gap whenever the plan forgets, which is the failure mode being fixed. |
| Mandatory record | The Lead writes one line into the phase report / ledger notes **every landed phase**, ran or not: `retired-token sweep: <tokens> — <N repo hits / M local hits / K narration-exempt>` or `retired-token sweep: n/a`. An unrecorded judgment step decays into a never-run step; the record line makes omission visible to `/war-review`. |
| Detection (two nets) | (1) Literal grep of both **hot** memory roots — `docs/learnings/` (or a non-null `overrides.learningsTarget`) and the Setup-resolved local root, excluding `archive/` — for the retired mechanism's command tokens. This grep is a **completeness floor, not a ceiling**: (2) after it, run a ranked `node skills/_shared/war-memory.mjs query '<mechanism terms>'` over the same roots and hand-scan the hit lessons plus any lesson whose title/keywords name the mechanism, listing each same-meaning straggler (prose describing the retired dance without the literal token) as a survey-derived correction. |
| Adjudication | Per hit: **recipe-position** (an imperative step the reader is told to run now) = load-bearing; **narration-position** (past-tense, negated, or teaching mention of the retired approach) = exempt but counted in the record line. No allowlist file — exemption is adjudicated judgment, and an allowlist is config for a judgment call. |
| Routing | Repo-root load-bearing hits → **one consolidated `war-followup` issue per triggering phase** (slug + stale fragment + replacing mechanism per hit), filed inside the same preflighted per-phase gh-write batch. Local-root load-bearing hits → named by slug in the phase report only (personal content never pasted into an issue); the next `/lessons-learned` pass owns the local fix. No in-run auto-repair of lesson bodies. |
| Drift guard | One new `doc-contract:` test in `skills/war/assets/war-config.test.mjs` asserting the clause exists in `skills/war/SKILL.md` — case-insensitive, mid-sentence anchors (the sweep name plus its routing and record tokens). |
| Source lesson | `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md` gains a dated mechanization note (RESOLVED-style, citing #930 and the new SKILL.md clause); the fail-closed redaction lint stays green. |

## 4. Mechanics

**Lead (the only role that changes).** After a phase lands and the Workflow returns, as part of the
existing per-phase bookkeeping under `## Per phase (in DAG order)`:

1. **Judge the trigger.** From the plan slice / Commander's Intent and the landed diff: did the
   phase retire, rename, or consolidate a land, merge, or escalation mechanism? No → write the
   `retired-token sweep: n/a` record line and stop.
2. **Derive the token list** from the *old* mechanism — the literal command fragments a recipe
   would quote (e.g. raw `git push`, `--force-with-lease`, `update-ref`, `ls-remote`, a retired
   script subcommand, a retired status token). The list is per-refactor and Lead-derived; the spec
   deliberately hardcodes no list.
3. **Sweep, floor then ceiling.** Grep both hot memory roots (repo learnings root + Setup-resolved
   local root, `archive/` excluded) for each token. The grep is a completeness floor, not a
   ceiling — after it, run the ranked `war-memory` query for the mechanism's name/terms and
   hand-scan the hit lessons and same-topic lessons for same-meaning stragglers that dodge the
   literal token; list each straggler as a survey-derived correction alongside the grep hits.
4. **Adjudicate each hit**: recipe-position (load-bearing) vs narration-position (exempt,
   counted). The worked example at authoring time: sweeping
   {`--force-with-lease`, `update-ref`, `ls-remote`, raw `git push`} over `docs/learnings/` hits
   only `held-escalation-lead-manual-completion.md` (step 4's *negation* of the raw tokens and the
   "Why" paragraph's past-tense mention) and the source lesson's own description of the incident —
   all narration-position, zero follow-ups. That outcome is the adjudication rule working, not the
   sweep failing.
5. **Route.** Repo-root load-bearing hits: file one consolidated `war-followup` issue in the same
   preflighted gh-write batch the phase already runs (each hit: lesson slug, the stale recipe
   fragment, the mechanism that replaced it). Local-root load-bearing hits: slug-only line in the
   phase report. Everything: the one-line sweep record.

**Drift guard.** One `doc-contract:` test beside the existing SKILL.md doc-contract tests in
`skills/war/assets/war-config.test.mjs`, asserting (case-insensitively, on mid-sentence anchors)
that the `## Per phase` prose retains: the sweep name, the trigger family
(retire/rename/consolidate + land/merge/escalation), the `war-followup` routing token, and the
record-line duty. It locks token presence, not semantics — prose truth remains a review concern
(the structure-test-check-f lesson's known ceiling, accepted).

**Vocabulary.** CONTEXT.md gains **retired-token sweep** with an *Avoid* line: do not conflate
with the ADR 0012 phase-close coherence sweep (findings-queue-driven, engine-dispatched,
fail-open polish); the retired-token sweep is Lead-run, judgment-triggered, and files debt — it
never edits lessons and never blocks a land.

## 5. Surface changes

- `skills/war/SKILL.md` — the retired-token sweep step under `## Per phase (in DAG order)`,
  adjacent to the per-phase gh-write batch paragraph
- `skills/war/assets/war-config.test.mjs` — one new `doc-contract:` test locking the clause
- `CONTEXT.md` — the retired-token sweep term + Avoid line
- `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md` — dated
  mechanization note citing #930

No other file. Explicitly untouched: `skills/war/assets/workflow-template.js`,
`skills/war/assets/workflow-template.test.mjs`, `agents/war-servitor.md`,
`skills/lessons-learned/SKILL.md`, ADR 0012.

## 6. New domain terms (CONTEXT.md)

- **Retired-token sweep** — the Lead-run, judgment-triggered, phase-close check that greps both hot
  memory roots for a just-retired mechanism's literal command tokens, adjudicates recipe-position
  vs narration-position hits, and files repo-root load-bearing hits as one consolidated
  `war-followup` issue. *Avoid:* conflating it with the ADR 0012 phase-close coherence sweep;
  treating it as a gate (it never blocks a land); an exemption allowlist (narration exemption is
  adjudicated per hit).

## 7. Recommended ADRs

None. This is a Lead-duty prose step plus its drift guard — no architectural boundary moves. ADR
0012 is referenced, not amended (the new sweep is deliberately outside its queue-driven contract).

## 8. Open risks / implementation notes

- **Ordering:** this spec is expected to land **after** `2026-07-16-land-failure-recovery-design.md`
  and `2026-07-16-structural-test-integrity-design.md` — the three share a file family
  (`skills/war/SKILL.md` prose and the war test surfaces), and the land-failure spec edits the same
  skill's `## Per phase`/Checkpoint region. Author the plan against the tree those two leave
  behind; the clause anchors here are named constructs, not line numbers, precisely so they survive
  that stacking.
- **The trigger is judgment, so a Lead can wrongly judge n/a.** Accepted residual: the mandatory
  per-phase record line converts a silent omission into an auditable `n/a` that `/war-review` can
  challenge; a fail-closed trigger is impossible without a false-positive gate (constraint 1).
- **Token derivation quality varies by Lead.** The ranked `war-memory` query second net hedges the
  weak-token case (lesson keywords weigh ~8× body in FTS ranking, and lessons about a mechanism
  usually carry its name as a keyword — e.g. the source lesson carries `force-with-lease` and
  `land-advance` in `metadata.keywords`).
- **The doc-contract test locks tokens, not meaning.** A reworded-but-hollow clause could keep the
  anchors; accepted (same ceiling as every doc-contract test in the family).
- **The sweep runs on the launch session's checkout.** Post-land, the Lead's checkout may lag the
  landed tip (the servitor-verify recurrence family); the sweep greps lesson files, which the phase
  itself rarely touches, and the follow-up issue names slugs, not SHAs — staleness risk is
  negligible, but the implementer should not add tip-dependent claims to the issue body.
- The consolidated follow-up issue should carry the `war-followup` label exactly (survey-corps
  treats that debt as first-class input), and its filing sits inside the preflighted batch so an
  account flip cannot drop it silently.

## 9. Non-goals / deferred

- **No engine or agent changes** — no `workflow-template.js` edit, no new Workflow args, no
  servitor prompt/standing-file change, no `phaseCloseQueue` widening.
- **No in-run auto-repair of lesson bodies.** A plan that retires a mechanism should still carry
  the lesson rewrite as an explicit task (the motivating instance's Commander's Intent did exactly
  that); the sweep is the net beneath forgetful plans, and its output is debt, not edits.
- **No fail-closed automation** — no hook, floor, CI lint, or hard grep gate over lesson prose; no
  exemption allowlist file.
- **No `/lessons-learned` change.** Its Phase 2 fan-out already verifies every lesson's concrete
  claims against the live repo on demand; sharpening its instructions for recipe-shaped claims is
  deferred until evidence shows the generic pass missing them.
- **`archive/` excluded** — cold lessons are `/lessons-learned` housekeeping territory.
- **No change to plan/spec templates** in `skills/war-strategy/SKILL.md` (no "retired tokens"
  plan field).

## 10. Validation criteria

1. **Drift guard red/green:** the new `doc-contract:` test in
   `skills/war/assets/war-config.test.mjs` passes on the landed tree; deleting the retired-token
   sweep clause from `skills/war/SKILL.md` in a scratch checkout makes exactly that test fail. Its
   assertions are case-insensitive and anchor on mid-sentence tokens (sweep name, trigger family,
   `war-followup`, record duty) — verified by inspection of the test body.
2. **Clause completeness (each item greppable in `skills/war/SKILL.md`):** the clause names the
   trigger family (retire/rename/consolidate a land, merge, or escalation mechanism); scopes the
   grep to both hot memory roots with `archive/` excluded; states the grep is a **completeness
   floor, not a ceiling** and mandates the ranked `war-memory` query + hand-scan with stragglers
   listed as survey-derived corrections; states the recipe-position vs narration-position
   adjudication; routes repo-root load-bearing hits to one consolidated `war-followup` issue inside
   the preflighted per-phase gh-write batch and local-root hits to the phase report only; and
   mandates the one-line `retired-token sweep: …` record on every landed phase including `n/a`.
3. **Naming hygiene:** the clause and CONTEXT.md entry never call the new mechanism a
   "phase-close sweep" bare — `grep -n 'retired-token sweep' skills/war/SKILL.md CONTEXT.md`
   returns hits in both files, and the CONTEXT.md entry's Avoid line names the ADR 0012 sweep as
   the thing it is not.
4. **Source-lesson note + lint:** `docs/learnings/process-recipe-lesson-body-is-not-drift-guarded-by-any-test.md`
   carries a dated note citing #930 and the SKILL.md clause;
   `node skills/_shared/war-memory.mjs lint docs/learnings/` exits 0.
5. **Worked-example dry run (manual, recorded in the landing PR):** executing the sweep procedure
   by hand for tokens {`--force-with-lease`, `update-ref`, `ls-remote`, raw `git push`} over
   `docs/learnings/` classifies every hit as narration-position and files nothing — re-verified at
   implementation time against the then-current tree (at authoring time the hits are
   `held-escalation-lead-manual-completion.md` and the source lesson itself).
6. **Diff-scope negative check (reviewed on the PR):** the landing diff touches only the four
   files in §5 — in particular none of `workflow-template.js`, `workflow-template.test.mjs`, or
   `agents/*.md`.
7. **Suite green:** `node --test 'skills/**/*.test.mjs'` passes at the landed tip.
