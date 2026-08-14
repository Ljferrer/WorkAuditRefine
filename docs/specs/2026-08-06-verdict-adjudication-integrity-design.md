# Verdict/adjudication integrity — probe-proof `adjudicated` provenance, ADJUDICATED doc-cascade completion, verdict-enumeration drift guards, and ADR 0045 / CONTEXT.md truth fixes

Issues: #1264, #1265, #1267, #1357

Survey group: `verdict-adjudication-integrity`.
dependsOn: `red-team-gate-cli` (shares `skills/red-team/assets/red-team-gate.mjs`) and
`done-when-floor-wiring` (shares `CLAUDE.md`) — this spec's work lands **after both**, rebasing its
edits onto theirs (see §8).

## 1. Context — the gap / problem

Four defect families, all orbiting the ADJUDICATED verdict contract (ADR 0043) that landed in the
2026-08-02 red-team-doctrine wave. Every count and line-content claim below is a dated snapshot,
re-verified at base `6fff2ee` (2026-08-06) unless noted.

**(a) #1264 — the `adjudicated` flag is Lead-only by doctrine but probe-settable by construction.**
The `FINDINGS` schema in `skills/red-team/assets/workflow-scaffold.js` declares `findings.items`
with nine properties and neither an `adjudicated` member nor `additionalProperties: false`
(verified: issue #1264 (2026-08-06); re-verified live — zero hits for either token anywhere in the
file). Traced end to end: probe finding objects flow from the `runProbe` dispatch through
`confirmStage` and the Layer-4 probe-collection loop (the `const probeResults = []` retry loop)
into `probeResults`, then through the gate's `allFindings()` (`{ probe, probeStatus, ...f }`
spread), `classify()`, and `verdict()`'s `f.adjudicated !== true` read — no layer strips unknown
finding keys, so a probe-emitted `adjudicated: true` is honored byte-identically to a Lead stamp
and silently converts BLOCKED → ADJUDICATED: the fake-clear shape ADR 0043 exists to close, with a
different actor (verified: issue #1264 (2026-08-06); flow re-traced live). Contrast the two
precedent flags: `deliverableAbsence` and `envGap` are deliberately probe-set **and**
schema-declared, each with a scope comment. The doctrine side already exists — the finding-schema
comment in `skills/red-team/references/lenses.md` reads "Lead-stamped at grill time (never
probe-set)" — but nothing enforces it. Severity Minor: the field is absent from every probe prompt
and schema shown to probes, and a stamped blocker with no matching `## Adjudications` report row is
operator-visible (verified: issue #1264 (2026-08-06)).

**(b) #1265 — three ADJUDICATED-cascade stragglers, all outside the landing wave's task
footprints, all still live.**

1. The `CLAUDE.md` pipeline-gospel roles sentence still reads "patches the plan in place until
   CLEARED"; `grep -c ADJUDICATED CLAUDE.md` → 0 (verified: issue #1265 (2026-08-06); re-verified
   live). `README.md` and `skills/war/references/design.md` both already carry the ratified
   cascade wording — "until it reaches a proceed verdict — **CLEARED**, or **ADJUDICATED** when a
   patched blocker was not re-verified by a probe re-run (ADR 0043)" (verified: live tree,
   2026-08-06).
2. The `CONTEXT.md` **Sandbox-escape guard** glossary entry states the unqualified absolute "routes
   the verdict through the self-confound gate (ADR 0020), never `CLEARED`", while its ADR 0033 twin
   carries the rescuing qualifier "never `CLEARED` — **until the state is clean**" (verified: issue
   #1265 (2026-08-06); both re-verified live). The unqualified form now conflicts with the landed
   foreign-delta carve-out — `/red-team` `SKILL.md`'s escape-classification **Foreign** arm:
   "a provenance-cleared foreign delta does **not** block `CLEARED`" (verified: live tree,
   2026-08-06).
3. The retained header comment above `export function verdict(` in
   `skills/red-team/assets/red-team-gate.mjs` — "the gate NEVER returns CLEARED while a probe was
   off-target, dropped, or never ran" — under-states by two arms: with incomplete coverage the gate
   also never returns ADJUDICATED or CLEARED-WITH-NOTES (INCOMPLETE outranks every arm). Not false
   — the precedence block above it is correct — but it is the one remaining rule-shaped
   verdict-naming sentence in the file (verified: issue #1265 (2026-08-06)). Safe to amend: the
   End-state-9 drift guard extracts literals from the `verdict()` **function body** (its slice
   starts at the `export function verdict(` line), so this comment sits outside the extracted
   region (verified: guard source in `skills/red-team/assets/workflow-scaffold.test.mjs`,
   re-read live).

**(c) #1267 — hand-copied verdict enumerations with no drift guard.** The End-state-9
verdict-enumeration drift guard (the `verdict-enumeration drift guard` test in
`skills/red-team/assets/workflow-scaffold.test.mjs`) extracts `verdict()`'s literal set
(`EXPECTED_VERDICTS`, exact-set, default-deny both directions) and pins it against exactly two
`references/lenses.md` surfaces: the severity section's `- **Verdict:**` bullet and the report
template's verdict line (verified: issue #1267 (2026-08-06); guard re-read live). The same wave
added two further hand-copies that no guard covers:

- the precedence chain `` `INCOMPLETE` > `BLOCKED` > `ADJUDICATED` > `CLEARED-WITH-NOTES` >
  `CLEARED` `` on the `Precedence:` line of `CONTEXT.md`'s **ADJUDICATED (verdict)** glossary
  entry (verified: issue #1267 (2026-08-06); re-verified live);
- the proceed-verdict list in `skills/war-campaign/SKILL.md` step 3's **(a) Proceed** triage arm —
  `` `CLEARED`, `CLEARED-WITH-NOTES`, or `ADJUDICATED` `` (verified: issue #1267 (2026-08-06);
  re-verified live).

A future verdict widening reds the lenses.md guard while silently leaving these stale — the exact
ADR 0025 drift class. **Survey-derived straggler** (authoring-time token sweep at `6fff2ee`, plus
the mandatory hand-scan of every hit's enclosing scope): `references/lenses.md`'s
`- **`INCOMPLETE` verdict**` spine bullet carries a **third** full in-file enumeration —
"the gate returns `CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED | INCOMPLETE`" — that the
existing two-surface guard also does not read (verified: live tree, 2026-08-06). The same sweep
found the precedence chain restated twice in `red-team-gate.mjs`'s own comments (the block above
`verdict()` and the Lead-workflow note above the CLI arm) — same-file, directly beside the
canonical source; recorded and exempted in §9. `docs/adr/` hits quote historical state and are
exempt by genre (the pipeline-structure suite's own pin-scope precedent).

**(d) #1357 — the still-open residue of the phase-5 glossary/ADR follow-up.** Seven findings were
filed; the two `CLAUDE.md` ADR-range findings (3/6) are already fixed at the live tip — `CLAUDE.md`
now reads "numbered sequentially — `ls docs/adr/` for the current head" (verified: live tree,
2026-08-06). Open:

1. `CONTEXT.md` measures 114,449 B, over its ADR 0042 advisory line of 111,616 B
   (`FILE_BUDGETS` in `skills/war/assets/prompt-surface-budgets.test.mjs`: hard 126,976 /
   advisory 111,616) — the budget suite stays green (hard-only assert) but WARNs, and per ADR 0042
   crossing the advisory line is the defined signal for a shrink pass (verified: issue #1357
   (2026-08-06); size and constants re-verified live).
2. `docs/adr/0045-red-team-loop-budget-and-route-upstream.md` twice attributes the ≤ 2 per-blocker
   re-verify bound to "ADR 0043's Step 5" — in the **rounds unit** decision bullet and again in the
   **Per-blocker-only accounting (rejected)** alternative — but ADR 0043 states no numeric
   per-blocker bound and has no "Step 5"; the bound lives in `/red-team` `SKILL.md`'s Step 5 and
   predates the ADR (verified: issue #1357 (2026-08-06); both lines re-verified live).
3. ADR 0045's census sentence still drops the plan's "just outside that window" qualifier for the
   7-round outlier (`2026-07-24-runbook-and-standing-record-coherence`, dated before the
   12-newest 2026-07-26 → window it is contrasted against), so the durable record implies
   membership in a census that excludes it (verified: issue #1357 findings 4/7 (2026-08-06);
   re-verified live).
4. `CONTEXT.md`'s **Land-barrier endstate-check dispatch** entry's _Avoid_ contrast says "this
   executes End-state `check:` commands, every phase" — but the dispatch in
   `skills/war/assets/workflow-template.js` is guarded by `endStateCheckRows.length > 0`; a
   claims-less or judgment-only phase dispatches nothing (verified: issue #1357 finding 5
   (2026-08-06); guard construct re-verified live).

## 2. Pivotal constraints

1. **The stamping mechanic must survive intact.** The Lead stamps `adjudicated: true` on a
   **working copy of the gate input** and re-pipes it through the same `--stdin` channel — so the
   gate cannot distinguish actors at read time and gate-side stripping would break legitimate
   stamping. Provenance enforcement can live only at the scaffold's probe-collection boundary
   (before `probeResults` is assembled), where every finding is probe-authored by construction.
2. **The End-state-9 guard's extraction contract is load-bearing**: it slices from
   `export function verdict(` to the column-0 closing brace, so comment edits above the function
   are guaranteed safe, and any guard extension must reuse extraction + set/sequence equality per
   surface (delimiter-split, default-deny both directions, non-empty floor first) — never
   presence-hope (ADR 0025).
3. **Cascade edits reuse the ratified wording.** The `CLAUDE.md` fix adapts the proceed-verdict
   form already landed in `README.md` / `references/design.md`, compressed to gospel-paragraph
   register; it must not invent a third phrasing.
4. **ADR 0045 corrections are in-place factual-attribution fixes** — the established channel for
   rotted factual pointers (the ADR 0008 precedent in the 2026-08-02 sweep spec), not the
   append-only amendment channel reserved for decision changes. Ratified decision sentences stay
   byte-intact; only the misattributing clauses and the census parenthetical move. The Status
   currency header line is exempt from any byte-freeze reading, per the recorded lesson.
5. **Never raise the budget constant silently.** The ADR 0042 remedy for #1357 finding 1 is a
   shrink/eviction pass (hot/cold law: byte-identical move to a `references/` home behind a
   `when <trigger>, read references/<file>` pointer), or an operator-gated, ADR-0042-justified
   budget re-derivation recorded in the commit body. This spec's own `CONTEXT.md` additions
   (§4.2, §4.4) count against the target.
6. **Ordering.** Both sibling groups land first: `red-team-gate-cli` owns
   `red-team-gate.mjs` concurrently and `done-when-floor-wiring` owns `CLAUDE.md`; this group's
   edits rebase onto theirs (the survey manifest carries the machine hint).
7. **Anchor by named construct, never line number** — every anchor in this spec and its plan is a
   heading, marker, or code construct; line numbers in the source issues had already drifted
   between filing and this survey.
8. **The war-campaign arm-(a) line is extraction-hostile**: the same line carries `` `BLOCKED` ``
   in its trailing routing-invariant clause and `ADJUDICATED` twice. Extraction must scope to the
   enumeration segment (between the `**(a) Proceed** —` marker and its first parenthetical), never
   the whole line.
9. **Findings route by close condition.** Every #1357 close condition requires the correcting
   change to cite the issue; the plan's commit bodies must carry the issue numbers.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|------------|
| D1 | `adjudicated` provenance enforcement point | **Targeted strip at the Layer-4 probe-collection loop** in `workflow-scaffold.js`: every collected result's `findings[]` has the `adjudicated` key deleted (a one-key strip with a comment naming the Lead-only contract, ADR 0043) before entering `probeResults`. Rejected: `additionalProperties: false` on `findings.items` — validator semantics belong to the harness, not this repo, and a strict validator would turn any benign extra key into a dead probe → INCOMPLETE. Rejected: gate-side stripping — breaks the Lead's re-pipe channel (constraint 1). |
| D2 | Schema posture for the field | **Deliberately undeclared.** Declaring `adjudicated` in `FINDINGS` would ship the key name to every probe's schema — advertising the exact channel being closed. A JS comment inside the schema literal records the deliberate absence (JS comments never reach the dispatched JSON). |
| D3 | Provenance backstop (prose) | One clause added to the **stamping mechanic** paragraph of `skills/red-team/SKILL.md`: a finding arriving already-stamped in the Workflow return / persisted task output is impossible by construction (the collection strip) and must be treated as unstamped and investigated — widening the backstop from "the Lead stamps" to the flag's provenance. |
| D4 | Pin shape for D1/D2 | Source-scan pins in `workflow-scaffold.test.mjs` (the suite's established idiom): (a) the collection construct carries the strip — worded descriptively, never restating the pattern bytes (self-match lesson); (b) the `FINDINGS` schema literal still does **not** declare `adjudicated` (default-deny both directions: a future declaring diff must consciously red this pin). Fail-first: the pre-fix source reds pin (a). |
| D5 | `CLAUDE.md` cascade wording | The roles sentence's parenthetical becomes "patches the plan in place until a proceed verdict — CLEARED, or ADJUDICATED when a patched blocker was not re-verified (ADR 0043)". OLD-absent: "until CLEARED" gone from the file. [assumed: exact compression — if wrong: the plan interview picks the wording; the OLD-absent + ADJUDICATED-present checks in §10 are the binding contract, not the byte string]. |
| D6 | `CONTEXT.md` escape-guard qualifier | Append the ADR 0033 twin's qualifier: "… never `CLEARED` until the state is clean", plus a brief parenthetical naming the foreign-delta carve-out (a provenance-cleared foreign delta is clean state and does not block `CLEARED`). |
| D7 | Gate header-comment fix | Rewrite the retained sentence to the withheld-arms form, e.g. "with incomplete coverage the gate returns INCOMPLETE and nothing else — never CLEARED, CLEARED-WITH-NOTES, or ADJUDICATED — while a probe was off-target, dropped, or never ran." Stays above `export function verdict(`, outside the guard's slice (constraint 2). |
| D8 | Guard extension — `CONTEXT.md` precedence chain | New surface in the End-state-9 guard: locate the single `Precedence:` line inside the `**ADJUDICATED (verdict)**` entry, slice to the first `;`, extract code-span tokens, and compare as an **ordered sequence** against `verdict()`'s body-appearance order (first-appearance dedupe of the same extraction the guard already runs) — the chain's order is semantic, so sequence equality beats the set compare. Token-set equality with `EXPECTED_VERDICTS` also holds by implication. |
| D9 | Guard extension — war-campaign proceed list | New surface: locate the `**(a) Proceed**` line, slice the enumeration segment per constraint 8, extract code-span tokens filtered by the verdict shape; assert set equality with `EXPECTED_VERDICTS` minus the halt verdicts, **and** assert the partition — `BLOCKED` present on the arm-(b) line, `INCOMPLETE` on the arm-(c) line — so a sixth verdict reds the exact-set compare first and must then be consciously placed in an arm. [assumed: partition-proof design — if wrong: the minimal alternative is the subset compare alone; the plan may drop the partition arm but must record the narrowing]. |
| D10 | Guard extension — lenses spine bullet (survey-derived) | Third new surface: the `- **`INCOMPLETE` verdict**` spine bullet's pipe-delimited enumeration, token-set equality with `EXPECTED_VERDICTS` — same idiom as the existing report-template surface. |
| D11 | ADR 0045 attribution fix | In-place, per the auditor's exact wording: the rounds-unit bullet's clause becomes "the per-blocker bound `/red-team`'s Step 5 already imposed"; the rejected-alternative bullet opens "`/red-team` Step 5's ≤ 2 re-verify attempts bounds one blocker in one run". No other bytes move. |
| D12 | ADR 0045 census qualifier | Insert the plan's own disambiguator: "the 7-round outlier (`2026-07-24-runbook-and-standing-record-coherence`, just outside that window)". Additive, single parenthetical. |
| D13 | Land-barrier _Avoid_ fix | Per the auditor's suggestion: "this executes End-state `check:` commands, on every phase that claims one". |
| D14 | `CONTEXT.md` budget remedy | **Preferred arm: eviction pass** — move the coldest glossary-entry bodies (recovery-runbook-shaped entries are the largest and the natural candidates) byte-identical to a `references/` home, leaving the term heading + the fixed trigger-pointer shape, until `CONTEXT.md` ≤ 111,616 B **including this spec's additions** (≈ 2.9 KB + additions to free). The **ADJUDICATED (verdict)** entry is hot and guard-read (D8) — never an eviction candidate. **Fallback arm (operator-gated): ADR-0042-justified re-derivation** recorded in the commit body — never a silent constant raise. [assumed: eviction-target selection method (coldest = largest, recovery-detail-heavy, already mirrored in a skills reference) — if wrong: the plan names the exact blocks after a cold-scan at its base and the operator can redirect to the fallback arm]. |

## 4. Mechanics

### 4.1 `adjudicated` provenance (#1264) — scaffold, doctrine, pins

Surfaces: `skills/red-team/assets/workflow-scaffold.js`,
`skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/red-team/SKILL.md`.

- In the Layer-4 probe-collection loop (the `const probeResults = []` retry loop), strip
  `adjudicated` from every finding object of every collected result before it is pushed (D1). The
  strip comments the contract: Lead-stamped post-run only, in the Lead's working copy of the gate
  input (ADR 0043) — a probe has no legitimate path to it.
- Inside the `FINDINGS` schema literal, a JS comment beside the `findings.items` properties records
  that `adjudicated` is **deliberately undeclared** (D2), mirroring the `references/lenses.md`
  finding-schema comment ("Lead-stamped at grill time (never probe-set)").
- `skills/red-team/SKILL.md` stamping-mechanic paragraph gains the one-clause provenance backstop
  (D3).
- Pins per D4, both in `workflow-scaffold.test.mjs`.

### 4.2 ADJUDICATED doc cascade (#1265) — three one-construct edits

- `CLAUDE.md` roles sentence per D5. Note the gospel-fragment old-absent pins in the
  pipeline-structure suite sweep different anchors and the `has_i` presence twin pins a different
  sentence — verified untouched by this edit; the diff records the suite green.
- `CONTEXT.md` **Sandbox-escape guard** entry per D6.
- `red-team-gate.mjs` header comment per D7. **Grep is a floor:** after the edit, hand-scan the
  file's remaining comments (the precedence block, the Lead-workflow CLI note) for sibling
  rule-shaped verdict-naming sentences and list each straggler as a survey-derived correction —
  the issue's claim that this is "the one remaining" such sentence is a dated snapshot, and the
  `red-team-gate-cli` sibling group lands in this file first.

### 4.3 Verdict-enumeration drift guards (#1267) — guard extensions

Surface: `skills/red-team/assets/workflow-scaffold.test.mjs` (the End-state-9 guard block), plus
read-only reads of `CONTEXT.md`, `skills/war-campaign/SKILL.md`, `references/lenses.md`.

- Extend the guard (same test or an adjacent sibling test in the same block) with the three new
  surfaces per D8, D9, D10. Each surface keeps the block's discipline: single-line addressing by
  named construct, exactly-one-match assertion, non-empty floor, delimiter-split extraction,
  referential assertion messages (never restating the pattern bytes — the self-match lesson).
- The guard's banner comment enumerates its surfaces; update the count wording in the same diff
  (the banner-undercount lesson).
- No content edit to `CONTEXT.md` or `skills/war-campaign/SKILL.md` is required — both
  enumerations are currently correct; the guard pins them.

### 4.4 ADR 0045 + CONTEXT.md truth and budget (#1357)

- ADR 0045: attribution per D11 (two clauses), census qualifier per D12 (one parenthetical). The
  correcting commit cites #1357 (constraint 9). **Grep is a floor:** after `grep -n "ADR 0043"`
  over the ADR, hand-scan every remaining ADR-0043 citation in the file (Context, Decision 5,
  Consequences, References) for sibling misattributions and list stragglers as survey-derived
  corrections — the Context sentence was auditor-judged neutral and stands.
- `CONTEXT.md` **Land-barrier endstate-check dispatch** `_Avoid_` line per D13.
- `CONTEXT.md` shrink per D14: eviction pass to below the advisory line, measured post-land with
  all of this spec's additions in. The eviction follows the hot/cold law's fixed pointer shape;
  moved bodies are byte-identical at their destination (relative links re-anchored per the
  verbatim-move lesson if any block carries them).

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/red-team/assets/workflow-scaffold.js` | Layer-4 collection strip + schema non-declaration comment (§4.1). |
| `skills/red-team/assets/workflow-scaffold.test.mjs` | Provenance pins (D4); End-state-9 guard extended to three new surfaces + banner count (§4.3). |
| `skills/red-team/SKILL.md` | One-clause stamping-provenance backstop (D3). |
| `skills/red-team/assets/red-team-gate.mjs` | Header-comment withheld-arms rewrite (D7) — comment-only, outside the guard's extraction slice. |
| `CLAUDE.md` | Roles-sentence proceed-verdict cascade (D5). |
| `CONTEXT.md` | Escape-guard qualifier (D6); land-barrier `_Avoid_` fix (D13); eviction pass to ≤ advisory (D14). Precedence line is guard-read, not edited. |
| `skills/war-campaign/SKILL.md` | No edit — arm-(a) enumeration becomes guard-read (D9). |
| `docs/adr/0045-red-team-loop-budget-and-route-upstream.md` | Two in-place attribution clauses (D11); census qualifier (D12). |
| new `references/` home(s) for evicted `CONTEXT.md` entries | Byte-identical bodies behind trigger pointers (D14) — exact path named by the plan. |

## 6. New domain terms (CONTEXT.md)

None. "Proceed verdict", the stamping mechanic, and the hot/cold law are all existing vocabulary;
no new WAR construct is introduced.

## 7. Recommended ADRs

None new. ADR 0043's contract is enforced, not changed; ADR 0025's discipline is applied; ADR 0045
receives in-place factual-pointer corrections (constraint 4). If the operator elects D14's fallback
arm, the justification is recorded in the commit body per ADR 0042's rule — still no new ADR.

## 8. Open risks / implementation notes

- **Cross-group ordering (the survey manifest's machine hint):** this group depends on
  `red-team-gate-cli` (both edit `skills/red-team/assets/red-team-gate.mjs`) and
  `done-when-floor-wiring` (both edit `CLAUDE.md`) landing first; §4.2's gate-comment survey and
  the `CLAUDE.md` edit are authored against their landed tips.
- **Same-file collisions inside this group (for the decomposition, not restated as dispatch):**
  - `workflow-scaffold.test.mjs` is edited by #1264 (pins) and #1267 (guard extensions) — same
    file ⇒ same task, or ordered phases.
  - `CONTEXT.md` is edited by #1265 (escape-guard), #1357 (_Avoid_ line, eviction) and guard-read
    by #1267 — all `CONTEXT.md` **edits** belong to one owner; the D8 guard must land after (or
    with) the eviction pass so its surface read is against the final file, and the eviction may
    never move the **ADJUDICATED (verdict)** entry (D14).
  - `workflow-scaffold.js` (#1264) and `red-team-gate.mjs` (#1265) are distinct files — cleanly
    parallel.
- **Guard-split deps edges:** the D8–D10 guard extensions pin surfaces authored in other tasks'
  files; where the decomposition puts a guard in a different task from a fact it reads, the guard
  task carries a `deps` edge onto the fact-authoring task (ADR 0025's 2026-08-02 amendment) —
  here the facts are pre-existing, so edges arise only if the eviction task reshapes `CONTEXT.md`.
- **Eviction scope risk:** `CONTEXT.md` has no precedent eviction (the pointer shape is defined
  there but unused in-file); the plan must pick targets that are genuinely cold and already
  doctrine-mirrored elsewhere, and the operator vetoes the list before land (D14's assumed tag is
  the veto handle). The budget suite's WARN is advisory — a shortfall is visible, not red.
- **Strip-layer blast radius:** D1 deletes exactly one key; it must not touch the `dropped: true`
  coverage markers (result-level, not finding-level) or the confirm-stage `reality` suffix
  (declared key). The D4 pin's fail-first run is the proof.
- **Version/release:** no release phase here; if the campaign cuts one, the version is the next
  free patch resolved from the four slots at land time — never a literal from this spec.

## 9. Non-goals / deferred

- No behavior change to `verdict()`, `classify()`, the loop-breaker arithmetic, or the gate CLI —
  the CLI is the `red-team-gate-cli` group's scope.
- Not declaring `adjudicated` in the `FINDINGS` schema, and not adopting
  `additionalProperties: false` (rejected in D1/D2 with reasons).
- Not guarding `docs/adr/` quotations, run records, campaign state, or the gate's own same-file
  comments (adjacency exemption, recorded in §1c) — the guard's pin scope stays live doctrine
  surfaces.
- Not re-opening ADR 0043's stamping doctrine or the 2026-07-28 operator directive on advisory
  BLOCKED.
- Not rewriting `CONTEXT.md` glossary entries beyond the two named lines — the eviction moves
  bodies byte-identical, never rewrites them.
- #1357 findings 3/6 (the `CLAUDE.md` ADR-range literal) are already fixed at the live tip and
  take no work here; the plan's close comment on #1357 records that with the verifying grep.

## 10. Validation criteria

1. WHEN a probe result whose findings carry `adjudicated: true` passes the Layer-4 collection loop
   THE assembled `probeResults` SHALL carry no `adjudicated` key on any finding · check:
   `node --test skills/red-team/assets/workflow-scaffold.test.mjs` (the D4 pins; pin (a) run
   against the pre-fix source is red — fail-first proof recorded in the plan).
2. WHEN the `FINDINGS` schema literal is scanned THE `findings.items` properties SHALL still not
   declare `adjudicated` · check: the D4(b) pin in the same suite run (a declaring diff reds it).
3. WHEN `CLAUDE.md` is swept THE roles sentence SHALL carry the proceed-verdict form and the old
   absolute SHALL be gone · check: `grep -c 'ADJUDICATED' CLAUDE.md` ≥ 1 and
   `grep -c 'until CLEARED' CLAUDE.md` = 0. Grep is a floor: hand-scan the full pipeline-gospel
   section for sibling CLEARED-only verdict claims and list each straggler as a survey-derived
   correction.
4. WHEN the `CONTEXT.md` **Sandbox-escape guard** entry is read THE never-CLEARED sentence SHALL
   carry the "until the state is clean" qualifier · check:
   `grep -c 'until the state is clean' CONTEXT.md` ≥ 1. Grep is a floor: hand-scan the entry and
   its ADR 0020/0033 neighbors in the glossary for sibling unqualified absolutes; list stragglers.
5. WHEN `red-team-gate.mjs` is read THE header comment SHALL name all withheld proceed arms and
   the old CLEARED-only sentence SHALL be gone · check:
   `grep -c 'NEVER returns CLEARED while' skills/red-team/assets/red-team-gate.mjs` = 0 with the
   new withheld-arms sentence present (`grep -n 'nothing else'` or the plan's pinned wording).
   Grep is a floor: hand-scan the file's remaining comments for rule-shaped verdict-naming
   sentences; list stragglers.
6. WHEN any of the five documented enumerations (two lenses.md originals + D8/D9/D10 surfaces)
   drifts from `verdict()`'s literal set — or a sixth verdict lands — THE extended End-state-9
   guard SHALL go red · check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`;
   fail-first proof: a one-token mutation of each new surface (scratch copy) reds its assertion.
7. WHEN `docs/adr/0045-red-team-loop-budget-and-route-upstream.md` is swept THE Step-5 bound SHALL
   be attributed to `/red-team`'s Step 5 and never to ADR 0043 · check:
   `grep -c "ADR 0043's Step 5" docs/adr/0045-red-team-loop-budget-and-route-upstream.md` = 0 and
   `grep -c "ADR 0043's ≤ 2" docs/adr/0045-red-team-loop-budget-and-route-upstream.md` = 0. Grep
   is a floor: hand-scan every remaining ADR-0043 citation in the file; list stragglers.
8. WHEN the ADR 0045 census sentence is read THE 7-round outlier SHALL carry the window
   disambiguator · check:
   `grep -c 'just outside that window' docs/adr/0045-red-team-loop-budget-and-route-upstream.md` ≥ 1.
9. WHEN the `CONTEXT.md` land-barrier `_Avoid_` contrast is read THE every-phase claim SHALL be
   scoped to claiming phases · check: `grep -c 'every phase that claims one' CONTEXT.md` ≥ 1 and
   the unscoped "commands, every phase" form absent from that entry.
10. WHEN `CONTEXT.md` is measured at land THE file SHALL be at or under its advisory line ·
    check: `wc -c CONTEXT.md` ≤ 111616 (or, on the operator-gated D14 fallback arm, the commit
    body carries the ADR-0042 justification and the re-derived constants land in the budget suite
    in the same diff).
11. WHEN the full suites run at land THE gates SHALL be green with no floor or lint change ·
    check: `node --test 'skills/**/*.test.mjs'`, the `hooks/` + `skills/` shell-test loop, and
    `node skills/_shared/war-memory.mjs lint docs/learnings/` all pass.
