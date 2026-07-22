# Audit adjudication threading — decompose-gate Lead adjudications become first-class `args.adjudications` producers, with an adjudication-match confirmation-note rule

Source spec: `docs/specs/2026-07-22-audit-adjudication-threading-design.md` (from issue #985).

## AI-Commander's Intent

*(AI-authored under `/war-machine --afk`, ADR 0014 — the heading is the provenance marker; intent
is the ceiling, the plan slice is the floor)*

- **Purpose:** a ruling the Lead has already made never costs a phase again — decompose-gate and
  escalation-time scope adjudications ride the existing `args.adjudications` channel to every
  audit seat, and a seat that meets a pre-adjudicated delta confirms it instead of re-litigating
  it (the incident: one full `held:escalation` + sanctioned relaunch paid for a decision already
  made and routed).
- **Method:** widen producers, not machinery — the string-row arm of `adjRow` is reused untouched;
  `adjudicationClause` gains one producer-agnostic ADJUDICATION-MATCH sentence (the
  version-precedence sentence stays byte-identical); the clause is additionally emitted at the
  three gate-audit-family prompt sites immediately after their `intentClause`; the /war Lead is
  instructed at both missing moments (decompose-gate assemble/thread/record, recovery-runbook
  record + re-thread); the sentence is mirrored verbatim on the standing auditor card and locked
  by extending the existing Task 1.5 both-surfaces test pair — deliberately NO new D3 registry
  row (D6) and no enum/`land-decision.mjs` change (ADR 0005). Empty/absent adjudications keep
  every prompt byte-identical to today. A sole-producer token sweep (grep floor + mandatory
  same-scope manual survey) retires every claim that the red-team report block is the only
  producer.
- **End state:**
  1. The extended test `Task 1.5 — the version-precedence adjudication clause is on BOTH
     surfaces …` proves a threaded string scope row emits the anchors `a confirmation note,
     never an escalation` and `not re-litigable this run` in the roster-seat `auditPrompt` AND
     `agents/war-auditor.md`; the pre-existing anchors (`task instruction > red-team adjudication
     > plan body literal`; `a value matching the adjudication is correct even when it differs
     from the plan body literal`) pass unchanged.
  2. The test `Task 1.5 back-compat — empty/absent adjudications ⇒ NO version-precedence clause
     and a byte-identical auditPrompt to today` stays green **byte-unmodified** — the
     byte-identity proof (spec constraint 2).
  3. A new assertion proves a threaded run's gate-audit-family prompt (e.g. the seat labeled
     `gate-audit:phase-<id>:end-state`) carries the clause, and an unthreaded run's gate-audit
     prompts carry none of the new anchors.
  4. `grep -n 'args.adjudications' skills/war/SKILL.md` hits the `## Decompose + approve — GATE`
     section (assemble/thread/record duty) AND the held-partial-phase recovery runbook (record at
     escalation adjudication; re-thread the accumulated set on relaunch).
  5. `skills/war/references/schemas.md` `## Workflow per-phase args contract` documents
     `adjudications`: shape, both producers, run-long accumulation + recovery-relaunch
     re-threading, empty ⇒ byte-identical.
  6. `skills/red-team/SKILL.md` step 5 names the channel as shared with decompose/escalation-time
     Lead adjudications.
  7. No sole-producer claim survives: the `workflow-template.js` comment introducing the
     `adjudications` const names both producers; the §4.F sweep + manual same-scope survey are
     completed with stragglers listed as survey-derived corrections.
  8. `agents/war-auditor.md` carries the Adjudication-match bullet verbatim and the widened
     producer parenthetical.
  9. The D3 both-surfaces directive registry and its `REGISTRY.length` floor assertion are
     byte-unchanged by this plan (D6; #693 floor untouched at whatever exact count the
     integration base carries).
  10. `CONTEXT.md` carries the widened **Adjudication** term (per spec §6) and
      `docs/adr/0013-commanders-intent-and-disposition-routing.md` carries the one-paragraph
      second-producer amendment note (spec §7).
  11. `node --test 'skills/**/*.test.mjs'` is green end-to-end.
  12. Release lands last: all four version slots in lock-step at the next free patch above the
      live base.

## Build order (for /war)

Stacks on `docs/plans/2026-07-22-auditor-guard-ergonomics.md`, which lands first (the survey
manifest's ordering edge; spec constraint 3 — same two auditor prompt surfaces + same drift-test
file). Draft assumes that plan's deltas are present at dispatch; landing order is
roadmap/campaign-enforced, not re-mechanized here.

1. **Phase 1 — Channel widening + doctrine** (waves: 1.1 ∥ 1.2 → 1.3)
2. **Phase 2 — Release** (trailing, own phase)

## Phase 1 — Channel widening + doctrine

### Task 1.1: adjudication-match sentence + three gate-audit emission sites + standing-card mirror + drift tests

- Files: `skills/war/assets/workflow-template.js`, `agents/war-auditor.md`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: **Template (spec §4.B).** In `adjudicationClause`, append one producer-agnostic
  sentence after the existing version-precedence sentence (which stays byte-identical — the
  existing mid-sentence test anchors must survive) and before the row list, verbatim:
  "ADJUDICATION-MATCH RULE: a finding whose substance matches an adjudicated row below is a
  confirmation note, never an escalation — cite the matching row; the delta is pre-adjudicated
  and not re-litigable this run. A candidate that deviates from BOTH the plan and the
  adjudicated row is not a match — judge it normally." It is a string literal inside the
  existing `pt`-tagged clause: no new interpolations, the pt census is untouched. **Three new
  emission sites:** append `adjudicationClause` immediately after `intentClause` in the
  `POST-MERGE GATE-AUDIT`, `INTEGRATED-TIP GATE-AUDIT`, and `END-STATE-ONLY GATE-AUDIT` prompt
  blocks (each currently ends `… + endStateBlock + intentClause`). Every other `intentClause`
  site (worker dispatch, provision barrier, refiner, servitor, phase-close sweep) is untouched —
  workers take adjudicated values via task instructions, the top of the precedence order (D5).
  Empty set ⇒ `''` ⇒ all three prompts byte-identical to today. **Header-comment producer
  rewrite:** the comment block introducing the `adjudications` const names BOTH producers — the
  red-team report's `## Adjudications` block AND the Lead's gate/escalation adjudications per
  `skills/war/SKILL.md` — replacing the sole-producer description. `adjudications` filtering,
  `adjRow`, and the row shapes are untouched. **Standing card (§4.C, same commit — the
  both-prompt-surface split rule).** New bullet **"Adjudication-match rule"** under
  `## Latitude and disposition (ADR 0013)` in `agents/war-auditor.md`, carrying the §4.B sentence
  verbatim (the both-surfaces mirror; the inline gate-audit seats also inherit the rule as
  standing doctrine through this card). Widen the version-precedence bullet's parenthetical:
  rows are threaded when the red-team report carries a `## Adjudications` block **and/or** the
  Lead adjudicated scope at the decompose gate or an escalation (per `skills/war/SKILL.md`).
  **Mapped tests (§4.D, same diff).** (a) Extend `Task 1.5 — the version-precedence adjudication
  clause is on BOTH surfaces (threaded auditPrompt + war-auditor.md), mid-sentence anchors`:
  assert the new mid-sentence anchors (`a confirmation note, never an escalation`;
  `not re-litigable this run`) on both the threaded `auditPrompt` and `auditorMd`; the four
  pre-existing anchors pass unchanged. (b) New assertion: a run threaded with a string scope row
  carries the clause in a dispatched gate-audit-family prompt — any of the three labeled seats;
  the end-state-only seat (`gate-audit:phase-<id>:end-state`) has the cheapest existing harness
  idiom (empty merged set + non-empty `phase.endState` claims, per the existing end-state-only
  seat test) — and with empty/absent adjudications those gate-audit prompts carry none of the
  new anchors. (c) The test `Task 1.5 back-compat — empty/absent adjudications ⇒ NO
  version-precedence clause and a byte-identical auditPrompt to today` keeps passing
  **unmodified** — it is the byte-identity proof for constraint 2. (d) The D3 both-surfaces
  directive registry and its `REGISTRY.length` floor assertion are **not touched** (D6 — the
  registry's baseline dispatch threads no adjudications, so a row would be unsatisfiable there).
  **Sweep (this task's half) + mandatory survey (§4.F).** Known sole-producer hits inside this
  task's files: the `workflow-template.js` header comment (rewritten above) and the
  `war-auditor.md` parenthetical (widened above). Then the manual same-scope survey — grep is a
  floor, not a ceiling: hand-scan the Task 1.5 comment block in `workflow-template.test.mjs`,
  the clause-adjacent comments in `workflow-template.js`, and the surrounding bullets in
  `war-auditor.md` for same-meaning phrasings of the sole-producer claim; update each and list
  stragglers as survey-derived corrections in the done report. Spec §10 criteria 1–4, 8–10.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: Lead procedure — decompose-gate producer step + recovery-runbook record/re-thread

- Files: `skills/war/SKILL.md`
- Plan slice: **Decompose gate (spec §4.A, D3).** Add a new numbered step in
  `## Decompose + approve — GATE`: **insert as step 5**, between the current step 4
  (**Backstop extraction**) and the current step 5 ("Present the DAG … Wait for
  approval/edits."), **renumbering the existing steps 5–7 to 6–8** — the mechanical renumber is
  part of this slice, not collateral scope (verified at plan time: no test reads that section,
  and the only "step 6" cross-reference elsewhere is the recovery runbook's own internal step).
  The new step: assemble the run's
  adjudication set as (1) the plan's red-team report `## Adjudications` rows
  (`docs/red-team/<plan-slug>.md`, machine-readable block) — the existing producer, now
  instructed on the /war side too; (2) **every scope finding the Lead adjudicates at this
  gate** — especially a known spec delta routed to a follow-up issue — recorded **at the moment
  of adjudication** as a preformatted string row naming the delta, the ruling, the route
  (`#<issue>` where filed), and the adjudication moment. Thread the set as `args.adjudications`
  (array|null) into **every** per-phase Workflow of the run; record each row in the run ledger.
  Interactive runs present the rows at the approval gate alongside the DAG; `--afk`
  self-adjudicates and records without waiting (the standing afk posture). No adjudications ⇒
  omit the arg (byte-identical prompts). Provenance discipline rides the step: a row records a
  real ruling made at a named moment — the Lead never synthesizes rows to smooth over an unruled
  delta (spec constraint 6; a row re-scores a known, already-routed delta and never waives a
  gate, floor, or backstop, ADR 0017). **Recovery runbook amendments (§4.A).** In the
  held-partial-phase recovery runbook: step 1 (**Adjudicate the escalation**) — when the Lead
  rules on the escalation (routes to a `/red-team` plan amendment, or completes manually),
  record the ruling as a new `args.adjudications` row; step 4 (**Relaunch as a sanctioned
  recovery relaunch**) — the relaunch args carry the **full accumulated adjudication set**
  alongside `args.recovery`, re-threaded from the ledger record, so relaunch seats are never
  adjudication-blind (the incident's exact missing link). Verification shape: End-state 4's grep
  hits both sections. Spec §10 criterion 5.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: docs — args contract, shared-channel clause, glossary widening, ADR 0013 amendment note

- Files: `skills/war/references/schemas.md`, `skills/red-team/SKILL.md`, `CONTEXT.md`, `docs/adr/0013-commanders-intent-and-disposition-routing.md`
- Plan slice: **schemas.md (D7).** In `## Workflow per-phase args contract`, add an
  `adjudications` paragraph alongside the existing `intent` and `memory` paragraphs: optional
  `adjudications` (array|null of preformatted strings or `{ adjudicated|value, supersedes }`
  objects — shapes unchanged by this change); both producers (the red-team report's
  `## Adjudications` block; the Lead's decompose-gate / escalation adjudications per
  `skills/war/SKILL.md`); the set accumulates run-long and is re-threaded in full on a sanctioned
  recovery relaunch (from the run-ledger record); empty/absent ⇒ every prompt byte-identical to
  an adjudication-less run. **red-team SKILL.md (§4.E — this task's sweep half).** In step 5, one
  clause noting the report's `## Adjudications` block is **one** producer of a shared channel —
  decompose/escalation-time Lead adjudications are the other, per `skills/war/SKILL.md`
  (retiring that sentence's sole-producer reading; the precedence sentence quoted there stays
  byte-identical, D2). In the **same sentence edit**, widen the destination phrase "the WAR Lead
  threads those rows into `auditPrompt()`" — after Task 1.1 the rows also reach the
  gate-audit-family prompts, so `auditPrompt()`-only is under-inclusive (e.g. "into the auditor
  prompts (`auditPrompt()` and the gate-audit seats)"). The **identical** destination phrase in
  `skills/red-team/references/lenses.md`'s machine-readable comment stays untouched per the
  spec's explicit §4.F ruling — record the pair in the done report's sweep notes.
  **CONTEXT.md (spec §6 — this task's sweep half).** Widen
  **Adjudication (red-team)** → **Adjudication** per the spec §6 text: an authoritative resolved
  ruling threaded to audit seats as an `args.adjudications` row — produced by the red-team
  report's `## Adjudications` block (version literals and grill decisions) **or** by the Lead at
  the decompose gate / an escalation adjudication (scope deltas routed to follow-ups); auditor
  scoring keys on it: version precedence (task instruction > red-team adjudication > plan body
  literal) and the adjudication-match confirmation-note rule; _Avoid_: "override", "waiver" — a
  row records a ruling already made and routed; it never waives a gate, floor, or backstop
  (ADR 0017). **ADR 0013 (spec §7).** Add a one-paragraph dated amendment note — following the
  file's existing Addendum idiom — naming the second producer (Lead gate/escalation
  adjudications) and the adjudication-match sentence; the ratified body, including Decision 3's
  byte-identical precedence sentence, is unchanged. The originating 2026-07-08 spec stays
  uncorrected per convention. **Survey duty:** hand-scan each edited file's same-scope
  neighbors (the schemas.md `intent`/`memory` paragraphs, the red-team step-5/step-6 prose, the
  CONTEXT.md terms adjacent to Adjudication) for same-meaning sole-producer phrasings; list
  stragglers as survey-derived corrections. Spec §10 criteria 6–8 (doc half).
- requiresTest: false
- requiresPackaging: false
- deps: [1.1, 1.2]
- target repo: superproject

## Phase 2 — Release

### Task 2.1: version bump, all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land
  time — `plugin.json` `version`, `marketplace.json` `metadata.version` and
  `plugins[0].version`, and the README `## Status` line (replace-in-place, no badge).
  `version-slots.test.mjs` is the arbiter — never a resolved v-literal from this plan (version
  literals in plans are non-authoritative). Expected integration base: branch
  `claude/work-audit-specs-plans-4304cd` — a stacked campaign base that will have advanced by
  land time (at minimum past the auditor-guard-ergonomics release); resolve the patch from the
  four slots as they stand at land. Standalone fallback: a run through plain `/war` (outside the
  campaign) resolves the next free patch from the four slots itself. Release blurb describes the
  widening additively and precisely — Lead decompose-gate/escalation adjudications now thread to
  audit seats over the **existing** `args.adjudications` channel, gate-audit seats receive the
  rows, and a pre-adjudicated delta draws a confirmation note instead of a re-escalation; say
  "widens the producers of an existing channel", never "new adjudication system". No rename; no
  absence-guard interactions expected.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops — AI-declared)

- Live confirmation-note behavior — the first real run that threads a gate-time scope row shows
  a seat meeting the pre-adjudicated delta returning a confirmation note (citing the row), not
  an escalation, across rounds and relaunches · why deferred: prompt-rule efficacy over live
  seat judgment is exactly what D9 chose not to enforce mechanically (matching is a judgment
  call over prose); not fixture-able in CI · runner: operator via `/war-review` after the first
  post-release `/war` run carrying a scope adjudication.
- Suppression-risk outcome (spec §8) — the confirmation-note rule does not demote genuine
  defects on the next real threaded run: findings scored as adjudication matches genuinely match
  a row's substance, and candidates deviating from both plan and row are still judged normally ·
  why deferred: over-broad-match behavior is live seat judgment over prose, the deliberate D9
  no-mechanical-matcher ceiling; not fixture-able · runner: operator via `/war-review` after the
  first post-release threaded run (review findings cited as matches against their rows).
- Lead-procedure adherence + ledger persistence (D8) — rows recorded at adjudication moments
  actually survive to a recovery relaunch's re-thread (the ledger is a lagging view; an operator
  hand-assembling a relaunch without consulting it loses the rows — mitigated by the runbook
  step-4 args list naming `args.adjudications` next to `args.recovery`) · why deferred:
  `skills/war/SKILL.md` prose is deliberately unenforced by gate or code (D9), and persistence
  spans compaction/relaunch, not a CI fixture · runner: operator inspection at the first live
  gate adjudication or post-release `held:escalation` recovery relaunch.

## Notes / conscious deviations

- **ADR 0014 provenance headings:** this plan uses `## AI-Commander's Intent` and the AI-declared
  backstop heading — a deliberate, mode-required divergence from the read predecessors
  (`2026-07-22-lessons-learned-seed.md`, `2026-07-21-lessons-learned-tighten.md`, both
  operator-confirmed `## Commander's Intent` plans). Tone/scope/standing constraints otherwise
  follow them (directive-form release task, four-slot lock-step, requiresPackaging false).
- **Stacking + shared-file contention:** stacks on
  `docs/plans/2026-07-22-auditor-guard-ergonomics.md` (lands first). Both plans — and
  `servitor-wrapup-landed-tip` after this one — touch `skills/war/assets/workflow-template.js`,
  `skills/war/assets/workflow-template.test.mjs`, and `agents/war-auditor.md`; the campaign
  roadmap's contention table serializes landing order (not re-mechanized here). Regions are
  disjoint: this plan edits `adjudicationClause` + the three gate-audit prompt blocks + the
  Task 1.5 test pair + the `## Latitude and disposition` bullets; the predecessor edits the
  git-forms teach in `auditPrompt()` + the D3 registry/F03 tests + a new
  `## Read-only git guard contract` section — so the stack is expected to rebase clean.
- **No D3 registry row, floor untouched (D6):** the predecessor lands a new registry row and
  bumps the `REGISTRY.length` floor to its new exact count; this plan adds **no** row and leaves
  the floor assertion byte-unchanged at whatever count the integration base carries. The
  adjudication-match sentence is locked by extending the existing Task 1.5 both-surfaces test
  pair instead — the registry's baseline dispatch threads no adjudications, so a registry row
  would be unsatisfiable there (spec D6). **An auditor (including the gate-audit pass) finding
  the D3 registry and its floor assertion untouched is CONFIRMING the design, not catching an
  omission.** Consequently drift-guard rule 5 (new mirror ⇒ registry
  row) is n/a: no new inline mirror of a canonical export exists; `land-decision.mjs`,
  `HARD_ESCALATION_REASONS`, and `KNOWN_LAND_DECISIONS` are byte-untouched (ADR 0005 —
  `held:workflow-error` is never added to `HARD_ESCALATION_REASONS`).
- **ADR 0013 in Files despite spec §5:** the spec's §5 surface table omits
  `docs/adr/0013-commanders-intent-and-disposition-routing.md` while §7 explicitly mandates the
  one-paragraph amendment note — resolved toward §7 (the explicit instruction); the ADR rides
  Task 1.3. Spec-internal inconsistency, logged here rather than silently absorbed.
- **Sweep split along task file-ownership lines** (the predecessor plan's pattern): every known
  sole-producer hit falls inside Task 1.1's or Task 1.3's Files — no dedicated sweep task.
  Plan-time survey already run against the live tree; two narration-only hits are **deliberately
  untouched**: the `skills/red-team/references/lenses.md` machine-readable comment (no
  exclusivity claim — spec §4.F expects it to survive unchanged) and the
  `skills/_shared/war-memory.mjs` effective-date comment ("red-team adjudication 2026-07-21" —
  narration of one past ruling, not a producer claim). An auditor finding those files unmodified
  is confirming the design, not catching an omission. `docs/adr/0013`'s Decision-3 precedence
  sentence also survives byte-identical (D2); the amendment note is additive.
- **`deps: [1.1, 1.2]` on Task 1.3 is a prose-coherence wave edge, not a same-file dodge:** the
  schemas paragraph, the CONTEXT term, the red-team clause, and the ADR note all describe the
  sentence Task 1.1 lands and the SKILL.md procedure Task 1.2 lands; the wave edge means 1.3's
  worker and auditors write and judge that prose against an integrated tip where the described
  constructs are real. File sets are fully disjoint across all three tasks.
- **requiresTest false on 1.2/1.3:** prose-only surfaces; the spec's D9 posture is
  prompt-threaded + drift test, no gate/code enforcement — the corresponding validation criteria
  (5–7) are grep-shaped and run at `/red-team`/land verification, not as new committed tests.
  The pure-docs solo `correctness` roster is the Lead's decompose-time proposal per
  `skills/war/SKILL.md`, not plan-mandated.
- **requiresPackaging false throughout** — no Dockerfile in this repo; the packaging floor would
  no-op regardless.

## Open decisions

None hard — the spec's design tree (D1–D9) resolved every fork. Three soft calls were
self-adjudicated under the ADR triad (none is hard-to-reverse, surprising-without-context, or a
genuine trade-off), recorded here for `/red-team` ratification:

1. **ADR 0013 file inclusion** (spec §5 table vs §7 instruction) — adjudicated toward §7;
   easily reversible by dropping the file from Task 1.3.
2. **Which gate-audit seat the new threaded-prompt assertion exercises** — recommendation: the
   end-state-only seat (`gate-audit:phase-<id>:end-state`), whose harness idiom (empty merged
   set + claimed `phase.endState`) already exists in the suite; the spec offers "any of the
   three labeled seats", so this is worker latitude, not a plan constraint.
3. **Amendment-note placement in ADR 0013** — recommendation: a dated addendum section matching
   the file's existing 2026-07-10 addendum idiom (leaves the ratified body untouched, the
   spec's stated requirement); an inline Decision-3 edit was rejected as body mutation.
