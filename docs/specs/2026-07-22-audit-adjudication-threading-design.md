# Decompose-gate Lead adjudications become first-class `args.adjudications` producers, with an adjudication-match confirmation-note rule for auditor seats

**Source issues:** #985 (decompose-time Lead adjudications are not auto-threaded to audit seats — pre-adjudicated scope findings get re-litigated; cost: 1 full phase relaunch).

**Sequencing note:** this spec **lands after** the `auditor-guard-ergonomics` group — both edit the
same two auditor prompt surfaces (`agents/war-auditor.md` + the string-built prompts in
`skills/war/assets/workflow-template.js`) and the same shared drift tests in
`skills/war/assets/workflow-template.test.mjs`. The survey manifest carries this ordering edge
authoritatively; this note records it for readers of the spec alone.

## 1. Context — the gap / problem

Run `war-game-benchmark-harness-2026-07-21`, manifest `phases.3.attempt2`: a known spec delta was
identified at decompose, adjudicated by the Lead at the approval gate (routed to a `/red-team` plan
amendment tracked as a follow-up issue), and approved. In phase 3's recovery relaunch, a
plan-faithfulness audit seat — with no visibility into that adjudication — ESCALATED the exact
delta as a plan-level Major. The verdict was correct from the seat's inputs; from the run's
perspective it was a full `held:escalation` plus a sanctioned relaunch, paid for a decision the
Lead had already made. The improvised fix — threading the adjudication as an `args.adjudications`
row — produced zero recurrence across all subsequent rounds and phases, including re-audits of the
same diff.

The channel exists but has exactly one documented producer. Verified against the live tree:

- `workflow-template.js` builds `adjudicationClause` from `args.adjudications` (string rows or
  `{ adjudicated|value, supersedes }` objects, `adjRow` renderer) and appends it inside
  `auditPrompt()` alongside `intentClause`; empty/absent ⇒ `''` ⇒ byte-identical prompts. Its
  header comment ("Red-team adjudications (Task 1.5, ADR 0032)") names the red-team report's
  `## Adjudications` block as *the* source.
- `skills/red-team/SKILL.md` step 5 is the **only** place any Lead is instructed to thread rows
  ("the WAR Lead threads those rows into `auditPrompt()`").
- `skills/war/SKILL.md` — the surface the /war Lead actually executes — contains **no**
  `args.adjudications` instruction at all: neither the `## Decompose + approve — GATE` section nor
  the held-partial-phase recovery runbook (§4.3) mentions the channel. Gate-time scope
  adjudications and recovery relaunches therefore reach audit seats adjudication-blind unless the
  Lead improvises.
- `agents/war-auditor.md` carries the version-precedence bullet with the parenthetical "(When the
  red-team report carries a `## Adjudications` block, the Lead threads its rows into your
  dispatched prompt.)" — a sole-producer claim.
- The clause the seats receive is **version-scoped** ("VERSION-PRECEDENCE RULE … a
  version/release-slot mismatch"): a scope-delta row threaded today rides along with no scoring
  instruction attached to it.

Two gaps, one channel: (a) decompose-time and escalation-time Lead adjudications have no
instructed path into `args.adjudications`; (b) even when threaded, non-version rows carry no
"this is pre-adjudicated — confirm, don't re-escalate" scoring rule.

## 2. Pivotal constraints

1. **Both-prompt-surface split rule.** Any auditor behavior change edits `agents/war-auditor.md`
   AND the string-built prompt in `workflow-template.js` in the **same commit**; the drift tests in
   `workflow-template.test.mjs` (the Task 1.5 both-surfaces pair) are the arbiter. The D3
   both-surfaces directive registry in that file has an exact no-slack row-count floor (#693) —
   whether this design adds a registry row is resolved explicitly in the design tree (it does not).
2. **Back-compat byte-identity.** Empty/absent `adjudications` ⇒ `adjudicationClause` is `''` ⇒
   every affected prompt is byte-identical to today (the `intentClause` threading pattern; the
   originating spec's constraint 4). Any new emission site must preserve this.
3. **Ordering edge.** Lands after `auditor-guard-ergonomics` (shared surfaces + shared drift
   tests); serialized solely to avoid same-file collisions on `war-auditor.md`,
   `workflow-template.js`, and `workflow-template.test.mjs`.
4. **ADR 0013 / ADR 0017 discipline.** Finding disposition stays auditor-owned; the
   confirmation-note rule must not become a prose waiver of a validation. The distinction: an
   adjudication row is a **ratified decision record** produced by the Lead at a gate or by the
   red-team grill loop — it re-scores a *known, already-routed* delta; it never waives a gate,
   floor, or backstop.
5. **No enum widening.** No new `held:*` members, no `HARD_ESCALATION_REASONS` /
   `KNOWN_LAND_DECISIONS` change, `land-decision.mjs` untouched (ADR 0005). This design adds
   prompt text and Lead procedure only.
6. **Intent is never Lead-invented (ADR 0013/0014).** An adjudication row records a real ruling
   made at a named moment (decompose gate, escalation adjudication, red-team grill); the Lead
   never synthesizes rows to smooth over an unruled delta.
7. **Anchor by named construct, never line number** — all references below use construct names
   (clause constants, prompt-block headers, test titles); line numbers rot across the serial
   merge queue.

## 3. Resolved design tree

| # | Decision | Resolution + why |
|---|----------|------------------|
| D1 | How do Lead adjudications enter the channel? | **Reuse `args.adjudications` string rows.** The existing string arm of `adjRow` renders preformatted rows verbatim — a scope adjudication is naturally prose ("<delta> — adjudicated at decompose gate: routed to follow-up #N; not re-litigable this run"). Rejected: a parallel `args.leadAdjudications` arg (duplicate clause machinery for the same consumer) and a new object shape (schema widening with no renderer gain). Row shape and `adjRow` are untouched. |
| D2 | Does widening producers reverse the ratified D8/D9 decision (2026-07-08 spec) that the red-team report block is the producer? | **Explicitly widened, not reversed.** The report's `## Adjudications` block remains a producer with unchanged semantics; the Lead's gate/escalation adjudications become the second producer of the *same* rows. The precedence sentence "task instruction > red-team adjudication > plan body literal" stays **byte-identical** on every surface (it is test-locked on both prompt surfaces and quoted in `red-team/SKILL.md`, `lenses.md`, and the CONTEXT.md term); the new confirmation-note sentence is producer-agnostic. Rejected: a global rename to "task instruction > adjudication > plan body literal" — a six-surface token rewrite plus test churn for zero behavioral gain. |
| D3 | Where is the producer instruction homed? | **`skills/war/SKILL.md`**, two sites: a new numbered step in `## Decompose + approve — GATE` (assemble + thread + record), and amendments to the held-partial-phase recovery runbook (record escalation-time rulings; re-thread the accumulated set on relaunch — the incident's exact missing link). Rejected: homing it only in `red-team/SKILL.md` (the /war Lead demonstrably does not execute that file). |
| D4 | Clause semantics for non-version rows | **Extend `adjudicationClause` with an adjudication-match sentence** (exact text in §4.B), keeping the version-precedence sentence byte-identical so the existing mid-sentence test anchors survive. A finding whose substance matches a row is a **confirmation note, never an escalation**; a candidate deviating from *both* the plan and the row is not a match and is judged normally. Rejected: a second, separate clause constant (two constants, one consumer, same emptiness condition). |
| D5 | Which prompts receive the rows? | **`auditPrompt()` (already wired) plus the three inline gate-audit-family seat prompts** — the `POST-MERGE GATE-AUDIT`, `INTEGRATED-TIP GATE-AUDIT`, and `END-STATE-ONLY GATE-AUDIT` prompt blocks — appended immediately after their existing `intentClause`. The incident's delta was an End-state-shaped scope ruling; the end-state seats are exactly where it would be re-litigated next. Workers, refiner, servitor, and the phase-close sweep get nothing (workers take the adjudicated value via task instructions — the top of the precedence order; the sweep is a worker dispatch). `''` back-compat preserved at all three sites. |
| D6 | Drift-guard home | **Extend the existing Task 1.5 both-surfaces test pair** in `workflow-template.test.mjs`; **do not add a D3 registry row**. The D3 registry's baseline dispatch threads no adjudications, so its prompts legitimately lack the clause — a registry row would be unsatisfiable there, and threading adjudications into the registry's baseline run would couple every unrelated row to this feature. The registry row-count floor (#693) is **unchanged** by this design. |
| D7 | Where is the args contract documented? | **`skills/war/references/schemas.md` `## Workflow per-phase args contract`** gains an `adjudications` paragraph alongside the existing `intent` and `memory` paragraphs (shape, both producers, run-long accumulation, recovery-relaunch re-threading, byte-identity on empty). |
| D8 | Row persistence across relaunch/compaction | **Ledger + issue trail, no new artifact.** Each row is recorded in the run ledger at the moment of adjudication (the ledger is the lagging-view record; rows also cite their follow-up issue where one exists). The relaunch instruction (D3) re-threads from the ledger record. Rejected: a dedicated adjudications file (new artifact lifecycle for data the ledger already carries). |
| D9 | Enforcement mechanism | **Prompt-threaded + both-surfaces drift test, no gate/code enforcement** — same posture the originating spec chose (its D9) for version precedence. Matching is a judgment call over prose; a mechanical matcher is the rejected ceiling. |

## 4. Mechanics

### A. Lead (`skills/war/SKILL.md`)

- **New step in `## Decompose + approve — GATE`** (after the backstop-extraction step, so rows are
  presented at the same approval gate): assemble the run's adjudication set as
  1. the plan's red-team report `## Adjudications` rows (`docs/red-team/<plan-slug>.md`,
     machine-readable block) — the existing producer, now instructed on the /war side too;
  2. **every scope finding the Lead adjudicates at this gate** — especially a known spec delta
     routed to a follow-up issue — recorded **at the moment of adjudication** as a preformatted
     string row naming the delta, the ruling, the route (`#<issue>` where filed), and the
     adjudication moment.
  Thread the set as `args.adjudications` (array|null) into **every** per-phase Workflow of the
  run; record each row in the run ledger. Interactive runs present the rows at the approval gate
  alongside the DAG; `--afk` self-adjudicates and records without waiting (the standing afk
  posture). No adjudications ⇒ omit the arg (byte-identical prompts).
- **Held-partial-phase recovery runbook amendments:** step 1 (adjudicate the escalation) — when
  the Lead rules on the escalation (routes to a `/red-team` plan amendment, or completes
  manually), record the ruling as a new `args.adjudications` row; step 4 (sanctioned recovery
  relaunch) — the relaunch args carry the **full accumulated adjudication set** alongside
  `args.recovery`, so relaunch seats are never adjudication-blind (the incident's failure mode).

### B. Template (`skills/war/assets/workflow-template.js`)

- **`adjudicationClause`** gains one producer-agnostic sentence appended after the existing
  version-precedence sentence (which stays byte-identical), before the row list:
  > ADJUDICATION-MATCH RULE: a finding whose substance matches an adjudicated row below is a
  > confirmation note, never an escalation — cite the matching row; the delta is pre-adjudicated
  > and not re-litigable this run. A candidate that deviates from BOTH the plan and the
  > adjudicated row is not a match — judge it normally.
- **Three new emission sites:** append `adjudicationClause` immediately after `intentClause` in
  the `POST-MERGE GATE-AUDIT`, `INTEGRATED-TIP GATE-AUDIT`, and `END-STATE-ONLY GATE-AUDIT`
  prompt blocks (each currently ends `… + endStateBlock + intentClause`). Empty set ⇒ `''` ⇒ all
  three prompts byte-identical to today.
- **Header comment rewrite** (the block introducing the `adjudications` const): name **both**
  producers — the red-team report block and the Lead's gate/escalation adjudications per
  `skills/war/SKILL.md` — replacing the sole-producer description (the D9 comment-lag duty; the
  stale comment is exactly the drift this repo's auditor lens flags).
- `adjudications` filtering, `adjRow`, and the row shapes are untouched.

### C. Standing card (`agents/war-auditor.md`)

- New bullet **"Adjudication-match rule"** under `## Latitude and disposition (ADR 0013)`,
  carrying the §4.B sentence **verbatim** (the both-surfaces mirror; this card is also how the
  inline gate-audit seats inherit the rule as standing doctrine).
- The version-precedence bullet's parenthetical producer note is widened: rows are threaded when
  the red-team report carries a `## Adjudications` block **and/or** the Lead adjudicated scope at
  the decompose gate or an escalation (per `skills/war/SKILL.md`).

### D. Drift tests (`skills/war/assets/workflow-template.test.mjs`)

- Extend the test `Task 1.5 — the version-precedence adjudication clause is on BOTH surfaces …`:
  assert the new mid-sentence anchors (`a confirmation note, never an escalation`;
  `not re-litigable this run`) on **both** the threaded `auditPrompt` and `war-auditor.md`, and
  that the existing anchors (`task instruction > red-team adjudication > plan body literal`;
  `a value matching the adjudication is correct even when it differs from the plan body literal`)
  still pass unchanged.
- Add an assertion that a threaded run's dispatched gate-audit-family prompt carries the clause
  (any of the three labeled seats, e.g. `gate-audit:phase-<id>:end-state`), and that with
  empty/absent adjudications those prompts carry none of the new anchors.
- The test `Task 1.5 back-compat — empty/absent adjudications ⇒ … byte-identical` must keep
  passing **unmodified** — it is the byte-identity proof for constraint 2.
- The D3 both-surfaces directive registry and its row-count floor assertion are **not touched**.

### E. Docs (`skills/war/references/schemas.md`, `skills/red-team/SKILL.md`)

- `schemas.md` `## Workflow per-phase args contract`: an `adjudications` paragraph per D7.
- `red-team/SKILL.md` step 5: one clause noting the report's `## Adjudications` block is one
  producer of a **shared** channel — decompose/escalation-time Lead adjudications are the other,
  per `skills/war/SKILL.md`.

### F. Sole-producer token sweep

Grep `Adjudications` and `red-team adjudication` across `skills/`, `agents/`, `docs/adr/`, and
`CONTEXT.md`; handle every match that asserts or implies the red-team report block is the *sole*
producer of `args.adjudications` (known at authoring time: the `workflow-template.js` header
comment, the `war-auditor.md` parenthetical, the CONTEXT.md `Adjudication (red-team)` term, the
`red-team/SKILL.md` step-5 sentence; the `lenses.md` machine-readable comment makes no
exclusivity claim and is expected to survive unchanged). **Mandatory manual same-scope survey:
grep is a floor, not a ceiling** — after the grep, hand-scan each target file's same-scope tests
and comments (the Task 1.5 comment block in `workflow-template.test.mjs`, the clause-adjacent
comments in `workflow-template.js`, the surrounding bullets in `war-auditor.md`) for same-meaning
siblings that encode the sole-producer claim in different words, and list each straggler as a
survey-derived correction.

## 5. Surface changes (files touched)

| File | Change |
|---|---|
| `skills/war/SKILL.md` | New decompose-gate adjudication step; recovery-runbook step 1/4 amendments (record + re-thread). |
| `skills/war/assets/workflow-template.js` | `adjudicationClause` sentence; three gate-audit emission sites; header-comment producer rewrite. |
| `agents/war-auditor.md` | Adjudication-match bullet (verbatim mirror); widened producer parenthetical. |
| `skills/war/assets/workflow-template.test.mjs` | Task 1.5 threaded test extended; gate-audit-site assertions; back-compat test untouched; D3 registry untouched. |
| `skills/war/references/schemas.md` | `adjudications` paragraph in the per-phase args contract. |
| `skills/red-team/SKILL.md` | Shared-channel clause in step 5. |
| `CONTEXT.md` | Term widening per §6 (rides the same change; glossary-only). |

Per the both-prompt-surface split rule, the `war-auditor.md` and `workflow-template.js` edits (and
the drift-test extension that locks them) belong to one commit.

## 6. New domain terms (CONTEXT.md)

- Widen **Adjudication (red-team)** → **Adjudication**: an authoritative resolved ruling threaded
  to audit seats as an `args.adjudications` row — produced by the red-team report's
  `## Adjudications` block (version literals and grill decisions) **or** by the Lead at the
  decompose gate / an escalation adjudication (scope deltas routed to follow-ups). Auditor
  scoring keys on it: version precedence (task instruction > red-team adjudication > plan body
  literal) and the adjudication-match confirmation-note rule. _Avoid_: "override", "waiver" — a
  row records a ruling already made and routed; it never waives a gate, floor, or backstop
  (ADR 0017).

## 7. Recommended ADRs

None new — this widens an existing guarded-invariant prompt channel, the same class as its
introduction (ADR 0013's Decision-3 inline note records `adjudicationClause` as a
no-new-ADR addition). Add a one-paragraph amendment note to **ADR 0013** naming the second
producer and the adjudication-match sentence. The originating spec
(`docs/specs/2026-07-08-red-team-plan-vs-state-grading-and-probe-sandboxing-design.md`) stays
uncorrected per convention.

## 8. Open risks / implementation notes

- **Suppression risk.** An over-broad "matches a row" reading could demote genuine defects. The
  clause self-scopes (substance match only; deviation from both plan and row is judged normally),
  and rows are unforgeable by workers: they arrive only via Lead-threaded dispatch args, never
  from repo content a worker can edit.
- **Clause heading cosmetics.** A run with only scope rows still emits the version-precedence
  sentence first; it self-scopes to version/release-slot mismatches, so this is inert prose, not
  a misdirection. Accepted.
- **Ledger is a lagging view.** An operator who hand-assembles a relaunch without consulting the
  ledger loses the rows; mitigated by the runbook step-4 args list naming `args.adjudications`
  explicitly next to `args.recovery`.
- **Merge-order coupling.** All three shared files are also edited by `auditor-guard-ergonomics`;
  the ordering edge (this spec second) is the collision control — do not parallelize.
- The `pt` tag discipline applies to any new interpolation; the new sentence is a string literal
  inside the existing `pt`-tagged clause, adding no interpolations.

## 9. Non-goals / deferred

- **No mechanical adjudication-match enforcement** (gate or code) — prompt + drift test only
  (D9 of the originating spec, reaffirmed).
- **No auto-mining of adjudications from prose** — rows are written at the moment of ruling by
  the Lead or the red-team grill loop, never extracted from plan/report prose after the fact
  (matches the existing `lenses.md` "never mined from arbitrary prose" doctrine).
- **No worker-visible adjudications** — workers receive adjudicated values via task
  instructions, the top of the precedence order.
- **No precedence-vocabulary rename** (D2) and **no D3 registry row** (D6).
- **No new args beyond `adjudications`** and no change to its row shapes.

## 10. Validation criteria (concrete, testable)

1. `node --test skills/war/assets/workflow-template.test.mjs` is green.
2. The extended test `Task 1.5 — the version-precedence adjudication clause is on BOTH surfaces …`
   proves: a threaded string scope row emits the anchors `a confirmation note, never an
   escalation` and `not re-litigable this run` in the roster-seat `auditPrompt` **and**
   `agents/war-auditor.md` carries the same sentence; the pre-existing anchors
   (`task instruction > red-team adjudication > plan body literal`, `a value matching the
   adjudication is correct even when it differs from the plan body literal`) pass unchanged.
3. The untouched test `Task 1.5 back-compat — empty/absent adjudications ⇒ NO version-precedence
   clause and a byte-identical auditPrompt to today` stays green (byte-identity proof).
4. A new assertion proves a threaded run's gate-audit-family prompt (e.g. the seat labeled
   `gate-audit:phase-<id>:end-state`) carries the clause, and an unthreaded run's gate-audit
   prompts carry none of the new anchors.
5. `grep -n 'args.adjudications' skills/war/SKILL.md` hits the `## Decompose + approve — GATE`
   section (assemble/thread/record duty) **and** the held-partial-phase recovery runbook (record
   at escalation adjudication; re-thread the accumulated set on relaunch).
6. `skills/war/references/schemas.md` `## Workflow per-phase args contract` documents
   `adjudications` (shape, both producers, empty ⇒ byte-identical).
7. `skills/red-team/SKILL.md` step 5 names the channel as shared with decompose/escalation-time
   Lead adjudications.
8. The `workflow-template.js` comment introducing the `adjudications` const names both producers
   (no sole-producer claim survives — §4.F sweep + survey completed, stragglers listed as
   survey-derived corrections).
9. The D3 both-surfaces directive registry assertion (`REGISTRY.length` floor, #693) is
   byte-unchanged by this change.
10. `agents/war-auditor.md` contains the Adjudication-match bullet verbatim and the widened
    producer parenthetical.
