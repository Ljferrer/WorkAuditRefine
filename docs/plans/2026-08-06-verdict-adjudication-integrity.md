# Verdict/adjudication integrity — probe-proof `adjudicated` provenance, ADJUDICATED doc-cascade completion, the five-surface verdict-enumeration guard, and ADR 0045 / CONTEXT.md truth + budget

Converted by `/war-machine` from [docs/specs/2026-08-06-verdict-adjudication-integrity-design.md](../specs/2026-08-06-verdict-adjudication-integrity-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason; spec citations are provenance-only — this plan's Part 1 alone carries every decision, constraint,
and mechanic the run needs). Issues addressed: #1264, #1265, #1267, #1357, and #1386 (folded
2026-08-15 by operator direction — campaign-era follow-up from landed plan 1, whose
`red-team-gate.mjs` family this plan already owns). Issue → task mapping:
#1264 → Task 1.5 (doctrine backstop) + Task 1.6 (strip + pins); #1265 item 1 → Task 1.3 (`CLAUDE.md`),
item 2 → Task 1.1 (`CONTEXT.md` escape-guard), item 3 → Task 1.4 (gate header comment);
#1267 (+ the survey-derived third surface) → Task 1.6 (guard extensions); #1357 findings 1/5 → Task 1.1,
findings 2/4/7 → Task 1.2, findings 3/6 already fixed at the live tip — citation-only closure;
#1386 → Task 1.7 (delta-interpolated zero-form assert messages). `/war`
files its own epic + task issues regardless (war-execution-must-file-issues); closing the five source
issues is Lead checkpoint work at phase close (war-checkpoint-must-close-task-issues), never assumed from
the epic close.

**Stacked base.** This is the batch's first stacked plan: the source spec's header declares
`dependsOn: red-team-gate-cli` (shares `skills/red-team/assets/red-team-gate.mjs`) and
`done-when-floor-wiring` (shares `CLAUDE.md`) — the 2026-08-06 survey manifest is not present in this
worktree, so the spec's statement of its machine hint is the source — and both predecessor plans are
committed in `docs/plans/` and MUST land first (ADR 0011 stack-and-plow). Snapshot base for every measured claim below: the repo tip at
`6fff2ee` (2026-08-06). Any fact a predecessor moves is stated **measured-at-base + expected-post-predecessor**
(the verify-stacked-plan-facts rule), never as a bare present-tense claim; the standalone fallback
(plain `/war`, no campaign) is per-task witness verification with halt-and-report (A5).

## Context — the gap / problem

Four defect families, all orbiting the ADJUDICATED verdict contract (ADR 0043) that landed in the
2026-08-02 red-team-doctrine wave.

1. **#1264 — the `adjudicated` flag is Lead-only by doctrine but probe-settable by construction**
   (verified: issue #1264 (2026-08-06); re-verified at `6fff2ee`: zero hits for `adjudicated` or
   `additionalProperties` anywhere in `skills/red-team/assets/workflow-scaffold.js`). The `FINDINGS`
   schema declares `findings.items` with nine properties and neither an `adjudicated` member nor
   `additionalProperties: false`. Flow re-traced live at `6fff2ee`: probe finding objects flow from the
   `runProbe` dispatch through `confirmStage` and the Layer-4 probe-collection loop (the
   `const probeResults = []` retry loop) into `probeResults`, then through the gate's `allFindings()`
   (`{ probe, probeStatus, ...f }` spread), `classify()`, and `verdict()`'s `f.adjudicated !== true`
   read — no layer strips unknown finding keys, so a probe-emitted `adjudicated: true` is honored
   byte-identically to a Lead stamp and silently converts BLOCKED → ADJUDICATED: the fake-clear shape
   ADR 0043 exists to close, with a different actor. Contrast the two precedent flags:
   `deliverableAbsence` and `envGap` are deliberately probe-set **and** schema-declared, each with a
   scope comment. The doctrine side already exists — the finding-schema comment in
   `skills/red-team/references/lenses.md` reads "Lead-stamped at grill time (never probe-set)"
   (re-verified at `6fff2ee`) — but nothing enforces it. Severity Minor: the field is absent from every
   probe prompt and schema shown to probes, and a stamped blocker with no matching `## Adjudications`
   report row is operator-visible (verified: issue #1264 (2026-08-06)).
2. **#1265 — three ADJUDICATED-cascade stragglers, all outside the landing wave's task footprints, all
   live at `6fff2ee`** (verified: issue #1265 (2026-08-06); each re-verified at `6fff2ee`):
   (i) the `CLAUDE.md` pipeline-gospel roles sentence still reads "patches the plan in place until
   CLEARED" — `grep -c ADJUDICATED CLAUDE.md` → 0 — while `README.md` and
   `skills/war/references/design.md` both already carry the ratified cascade wording ("until it reaches
   a proceed verdict — CLEARED, or ADJUDICATED when a patched blocker was not re-verified by a probe
   re-run (ADR 0043)"); the roles sentence sits outside predecessor plan 3's two `CLAUDE.md` edits
   (Enum-discipline parenthetical, Guard-architecture floor list — verified against its Task 1.2
   slice), so the defect is expected live at this plan's post-plan-3 base. (ii) the `CONTEXT.md`
   **Sandbox-escape guard** glossary entry states the unqualified absolute "routes the verdict through
   the self-confound gate (ADR 0020), never `CLEARED`", while its ADR 0033 twin carries the rescuing
   qualifier "never `CLEARED` — until the state is clean"; the unqualified form now conflicts with the
   landed foreign-delta carve-out (`/red-team` doctrine: a provenance-cleared foreign delta does not
   block `CLEARED` — the lenses.md escape-guard bullet and SKILL.md Step 4, re-verified at `6fff2ee`).
   (iii) the retained header comment above `export function verdict(` in
   `skills/red-team/assets/red-team-gate.mjs` — "the gate NEVER returns CLEARED while a probe was
   off-target, dropped, or never ran" — under-states by two arms: with incomplete coverage the gate
   also never returns ADJUDICATED or CLEARED-WITH-NOTES (INCOMPLETE outranks every arm). Not false —
   the precedence block above it is correct — but it is the one remaining rule-shaped verdict-naming
   sentence in the file at `6fff2ee`, and it sits outside predecessor plan 1's rewrite (plan 1's
   Task 1.2 rewrites the CLI doc block and `main()`; the `verdict()` header comment is outside that
   slice — verified against the committed plan), so it is expected live post-plan-1. Safe to amend:
   the End-state-9 drift guard slices from the `export function verdict(` line, so this comment sits
   outside the extracted region (verified: guard source in
   `skills/red-team/assets/workflow-scaffold.test.mjs`, re-read at `6fff2ee`).
3. **#1267 — hand-copied verdict enumerations with no drift guard** (verified: issue #1267
   (2026-08-06); guard re-read at `6fff2ee`). The End-state-9 verdict-enumeration drift guard (the
   `verdict-enumeration drift guard` test in `workflow-scaffold.test.mjs`) extracts `verdict()`'s
   literal set (`EXPECTED_VERDICTS`, exact-set, default-deny both directions, non-empty floor) and pins
   exactly two `references/lenses.md` surfaces: the severity section's `- **Verdict:**` bullet and the
   report template's verdict line. The same wave added two further hand-copies no guard covers: the
   precedence chain on the `Precedence:` line of `CONTEXT.md`'s **ADJUDICATED (verdict)** glossary
   entry, and the proceed-verdict list in `skills/war-campaign/SKILL.md` step 3's `**(a) Proceed**`
   triage arm (`` `CLEARED`, `CLEARED-WITH-NOTES`, or `ADJUDICATED` `` — both re-verified at
   `6fff2ee`). A future verdict widening reds the lenses.md guard while silently leaving these stale —
   the exact ADR 0025 drift class. **Survey-derived straggler** (authoring-time token sweep at
   `6fff2ee` plus the mandatory hand-scan of every hit's enclosing scope): `references/lenses.md`'s
   ``- **`INCOMPLETE` verdict**`` spine bullet carries a **third** full in-file enumeration — "the gate
   returns `CLEARED | CLEARED-WITH-NOTES | ADJUDICATED | BLOCKED | INCOMPLETE`" (one pipe-delimited
   code span) — that the existing two-surface guard does not read (re-verified live at `6fff2ee`). The
   same sweep found the precedence chain restated twice in `red-team-gate.mjs`'s own comments (the
   block above `verdict()` and the Lead-workflow note in the CLI doc block) — same-file, directly
   beside the canonical source; recorded and exempted (Non-goals). `docs/adr/` hits quote historical
   state and are exempt by genre (the pipeline-structure suite's own pin-scope precedent).
4. **#1357 — the still-open residue of the phase-5 glossary/ADR follow-up** (verified: issue #1357
   (2026-08-06); each item re-verified at `6fff2ee`): (i) `CONTEXT.md` measures 114,449 B, over its
   ADR 0042 advisory line of 111,616 B (`FILE_BUDGETS` in
   `skills/war/assets/prompt-surface-budgets.test.mjs`: hard 126,976 / advisory 111,616; `checkBudget`
   asserts hard-only and WARNs above advisory — the suite stays green but per ADR 0042 the crossing is
   the defined shrink-pass signal). **Corrected by the /red-team pass (2026-08-16): the conversion-time
   prediction "no predecessor plan touches `CONTEXT.md` … so 114,449 B is expected unchanged at this
   plan's base" is FALSIFIED and retired.** It rested on a scan of only four committed 2026-08-06 plans
   when `docs/plans/` carries fourteen, and it scoped "predecessor" to `dependsOn` edges rather than to
   every plan sequenced ahead on the campaign spine. The sibling `2026-08-06-gate-audit-finding-routing`
   declares `Files: CONTEXT.md`, runs ahead of this plan, and has landed (merge `a489067`), adding two
   glossary rows: `CONTEXT.md` measures **114,982 B** at the campaign base — **+533 B**, so the overage
   is **3,366 B, not 2,833 B**. The advisory/hard constants are unchanged (111,616 / 126,976). Every
   byte figure in this plan is therefore stated at `a489067` and re-measured again at the task's rebased
   base; the standing rule for the rest of this campaign is that the `Files:` scan covers **every plan
   sequenced ahead**, not just declared predecessors. (ii)
   `docs/adr/0045-red-team-loop-budget-and-route-upstream.md` twice attributes the ≤ 2
   per-blocker re-verify bound to ADR 0043 — the **rounds unit** decision bullet reads "the
   per-blocker bound ADR 0043's Step 5 already imposed", and the **Per-blocker-only accounting
   (rejected)** alternative reads "ADR 0043's ≤ 2 re-verify attempts bounds one blocker in one run" —
   but ADR 0043 states no numeric per-blocker bound and has no "Step 5"; the bound lives in
   `/red-team` `SKILL.md`'s Step 5 and predates the ADR. The file carries seven "ADR 0043" citations total (dated snapshot at `6fff2ee`);
   the Context sentence was auditor-judged neutral and stands. (iii) ADR 0045's census sentence drops
   the plan's "just outside that window" qualifier for the 7-round outlier
   (`2026-07-24-runbook-and-standing-record-coherence`, dated before the 12-newest 2026-07-26 →
   window), so the durable record implies membership in a census that excludes it. (iv) the
   `CONTEXT.md` **Land-barrier check** entry's `_Avoid_` contrast says "this executes End-state
   `check:` commands, every phase" — but the dispatch in `skills/war/assets/workflow-template.js` is
   guarded by `endStateCheckRows.length > 0`; a claims-less or judgment-only phase dispatches nothing.
   (The source issue names this entry "Land-barrier endstate-check dispatch"; the live glossary
   heading is **Land-barrier check** — anchored here by the live construct, Note 1.) (v) findings 3/6
   (the `CLAUDE.md` ADR-range literal) are already fixed at the live tip — `CLAUDE.md` reads "numbered
   sequentially — `ls docs/adr/` for the current head" (re-verified at `6fff2ee`) — citation-only
   closure at the checkpoint.
5. **Conversion-time verifications that shape the guard extensions** (all at `6fff2ee`): `verdict()`'s
   body-appearance order of the five literals is INCOMPLETE, BLOCKED, ADJUDICATED, CLEARED-WITH-NOTES,
   CLEARED — exactly the `Precedence:` chain's order; the existing guard's pre-sort `literals` array is
   already the first-appearance dedupe of that extraction (a JS `Set` preserves insertion order), so
   the ordered compare needs no second extraction. The `**(a) Proceed**` line appears exactly once in
   `skills/war-campaign/SKILL.md`; its enumeration segment sits between the `**(a) Proceed** —` marker
   and the first following `(` (the `--afk` parenthetical, which carries the line's second
   `ADJUDICATED`), and its trailing routing-invariant clause carries `` `BLOCKED` `` (and no
   `ADJUDICATED`) — extraction must scope to the segment, never the whole line. The arm-(b) line (`**(b) Route upstream**`) carries `` `BLOCKED` `` and the arm-(c)
   line (``**(c) Persistent `INCOMPLETE`**``) carries `` `INCOMPLETE` `` — the three-arm partition is
   provable. The spine bullet's enumeration is a single pipe-bearing backtick span. `CONTEXT.md`'s
   `Precedence:` chain segment terminates at the first `;` on one physical line inside the
   **ADJUDICATED (verdict)** entry.
6. **Downstream spine** (verified in the sibling spec texts at `6fff2ee`): `doc-cli-consistency-corpus`
   declares this group lands first (shares `CONTEXT.md` — "must not enter a campaign wave before that
   group's `CONTEXT.md` change is on the base") and `redteam-rounds-config-telemetry` declares a
   `dependsOn` edge onto this group (its `skills/war-campaign/SKILL.md` edits must keep the new
   five-surface guard green; this plan only guard-reads that file — Note 5).

## Pivotal constraints

1. **The stamping mechanic must survive intact.** The Lead stamps `adjudicated: true` on a **working
   copy of the gate input** and re-pipes it through the same `--stdin` channel — the gate cannot
   distinguish actors at read time, so gate-side stripping would break legitimate stamping. Provenance
   enforcement can live only at the scaffold's probe-collection boundary (before `probeResults` is
   assembled), where every finding is probe-authored by construction.
2. **The End-state-9 guard's extraction contract is load-bearing**: it slices from
   `export function verdict(` to the column-0 closing brace, so comment edits above the function are
   guaranteed safe, and any guard extension must reuse extraction + set/sequence equality per surface
   (single-line addressing by named construct, exactly-one-match assertion, non-empty floor first,
   delimiter-split extraction, default-deny both directions) — never presence-hope (ADR 0025).
   Referential assertion messages, never restating the pattern bytes (the self-match lesson).
3. **Cascade edits reuse the ratified wording.** The `CLAUDE.md` fix adapts the proceed-verdict form
   already landed in `README.md` / `skills/war/references/design.md`, compressed to gospel-paragraph
   register; it must not invent a third phrasing.
4. **ADR 0045 corrections are in-place factual-attribution fixes** — the established channel for
   rotted factual pointers (the ADR 0008 precedent in the 2026-08-02 sweep), not the append-only
   amendment channel reserved for decision changes. Ratified decision sentences stay byte-intact; only
   the two misattributing clauses and the census parenthetical move. The Status currency header line
   is exempt from any byte-freeze reading (the recorded
   adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line lesson).
5. **Never raise the budget constant silently.** The ADR 0042 remedy for the `CONTEXT.md` overage is a
   shrink/eviction pass (hot/cold law: byte-identical move to a `references/` home behind the fixed
   `when <trigger>, read <file>` pointer shape — a pointer without a trigger is a defect), or an
   operator-gated, ADR-0042-justified budget re-derivation recorded in the commit body. This plan's
   own `CONTEXT.md` additions (the D6 qualifier, the D13 fix) count against the target. `references/`
   is unbudgeted cold storage; the **ADJUDICATED (verdict)** entry is hot and guard-read (D8) — never
   an eviction candidate.
6. **Ordering.** Both predecessor plans land first: `2026-08-06-red-team-gate-cli` owns
   `red-team-gate.mjs`'s CLI doc block rewrite and `2026-08-06-done-when-floor-wiring` owns the
   `CLAUDE.md` floor enumerations; this plan's edits to those files are authored against the
   post-predecessor shapes and rebase onto their landed tips. Standalone fallback: witness-verify,
   halt-and-report on absence (A5) — never improvise.
7. **Anchor by named construct, never line number** — every anchor in this plan is a heading, marker,
   or code construct; line numbers in the source issues had already drifted between filing and the
   survey.
8. **The war-campaign arm-(a) line is extraction-hostile**: the same line carries `` `BLOCKED` `` in
   its trailing routing-invariant clause and `ADJUDICATED` twice. Extraction must scope to the
   enumeration segment (after the `**(a) Proceed**` marker, up to the first following `(`), never the
   whole line.
9. **Findings route by close condition.** Every #1357 close condition requires the correcting change
   to cite the issue; landing commits carry the issue numbers (End state 13).
10. **Platform law (BSD grep):** any check grep whose pattern contains `$`, `"`, or a backslash uses
    `grep -F` or correct escaping; the apostrophe-bearing ADR greps below use `-F` (the
    execution-proven false-red class from plan 1's End-state-1 conversion note).
11. **Both-ways discipline for the schema posture:** the D2 deliberate-absence comment inside the
    `FINDINGS` literal must avoid the `adjudicated:` key-colon shape, so the D4(b) pin can assert the
    key's absence line-anchored without the comment satisfying or tripping it (the
    coupling-comment-self-match lesson applied forward).

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | `adjudicated` provenance enforcement point | **Targeted one-key strip at the Layer-4 probe-collection loop** in `workflow-scaffold.js`: every collected result's `findings[]` has the `adjudicated` key deleted (with a comment naming the Lead-only contract, ADR 0043) before it is pushed into `probeResults` — one strip site right before the push covers the first-pass and retried results alike. Rejected: `additionalProperties: false` on `findings.items` — validator semantics belong to the harness, not this repo, and a strict validator would turn any benign extra key into a dead probe → INCOMPLETE. Rejected: gate-side stripping — breaks the Lead's re-pipe channel (constraint 1) | spec §3 D1; (verified: issue #1264 (2026-08-06)) |
| D2 | Schema posture for the field | **Deliberately undeclared.** Declaring `adjudicated` in `FINDINGS` would ship the key name to every probe's schema — advertising the exact channel being closed. A JS comment inside the schema literal records the deliberate absence (JS comments never reach the dispatched JSON); the comment avoids the key-colon shape (constraint 11) | spec §3 D2 |
| D3 | Provenance backstop (prose) | One clause added to the **stamping mechanic** paragraph of `skills/red-team/SKILL.md` ("The stamping mechanic, named exactly"): a finding arriving already-stamped in the Workflow return / persisted task output is impossible by construction (the collection strip) and must be **treated as unstamped and investigated** — widening the backstop from "the Lead stamps" to the flag's provenance | spec §3 D3 |
| D4 | Pin shape for D1/D2 | Source-scan pins in `workflow-scaffold.test.mjs` (the suite's established module-level `src` read idiom): (a) the Layer-4 collection construct (sliced between its `const probeResults = []` anchor and the `return { plan: planFile` line) carries the strip — worded descriptively, never restating pattern bytes; (b) the `FINDINGS` schema literal's `findings.items` properties still do **not** declare `adjudicated` (line-anchored key-absence assert) **and** the deliberate-absence comment is present — default-deny both directions: a future declaring diff must consciously red pin (b). Fail-first: pin (a) run against the pre-fix source is red (backstop row) | spec §3 D4 |
| D5 | `CLAUDE.md` cascade wording | The roles sentence's parenthetical becomes "patches the plan in place until a proceed verdict — CLEARED, or ADJUDICATED when a patched blocker was not re-verified (ADR 0043)". OLD-absent: "until CLEARED" gone from the file | spec §3 D5; A1 |
| D6 | `CONTEXT.md` escape-guard qualifier | Append the ADR 0033 twin's qualifier to the **Sandbox-escape guard** entry: "… never `CLEARED` until the state is clean", plus a brief parenthetical naming the foreign-delta carve-out (a provenance-cleared foreign delta is clean state and does not block `CLEARED`) — the carve-out is named conceptually, never by quoting plan-2-owned bytes (Note 4) | spec §3 D6 |
| D7 | Gate header-comment fix | Rewrite the retained sentence to the withheld-arms form: "with incomplete coverage the gate returns INCOMPLETE and nothing else — never CLEARED, CLEARED-WITH-NOTES, or ADJUDICATED — while a probe was off-target, dropped, or never ran." Stays above `export function verdict(`, outside the guard's slice (constraint 2) | spec §3 D7 |
| D8 | Guard extension — `CONTEXT.md` precedence chain | New surface in the End-state-9 guard: slice the **ADJUDICATED (verdict)** entry (the `skill-doc-contracts.test.mjs` D19 entry-slice idiom — heading match with next-entry lookahead), locate its single `Precedence:` line, slice to the first `;`, extract code-span tokens **in order**, and compare as an **ordered sequence** against the guard's existing pre-sort `literals` array (`verdict()`'s body-appearance order — verified identical to the chain at `6fff2ee`, Context 5) — the chain's order is semantic, so sequence equality beats the set compare; token-set equality with `EXPECTED_VERDICTS` follows by implication | spec §3 D8; Context 5 |
| D9 | Guard extension — war-campaign proceed list | New surface: locate the single `**(a) Proceed**` line, slice the enumeration segment per constraint 8, extract code-span tokens; assert set equality with the proceed subset **derived** from `EXPECTED_VERDICTS` by filtering out `BLOCKED`/`INCOMPLETE` (derived, never a second hand-list — no new unguarded mirror), **and** assert the three-arm partition — `` `BLOCKED` `` present as a code span on the single `**(b) Route upstream**` line, `` `INCOMPLETE` `` on the single `**(c) Persistent** `` line — so a sixth verdict reds the exact-set compare first and must then be consciously placed in an arm | spec §3 D9; A2 |
| D10 | Guard extension — lenses spine bullet (survey-derived) | Third new surface: the single line starting ``- **`INCOMPLETE` verdict**``; extract its pipe-bearing backtick span, split on `\|`, trim, token-set equality with `EXPECTED_VERDICTS` — the report-template surface's idiom | spec §3 D10 |
| D11 | ADR 0045 attribution fix | In-place, the auditor's exact wording: the rounds-unit bullet's clause becomes "the per-blocker bound `/red-team`'s Step 5 already imposed"; the rejected-alternative bullet opens "`/red-team` Step 5's ≤ 2 re-verify attempts bounds one blocker in one run". No other bytes move | spec §3 D11; (verified: issue #1357 (2026-08-06), finding 2) |
| D12 | ADR 0045 census qualifier | Insert the plan's own disambiguator into the census parenthetical: "the 7-round outlier (`2026-07-24-runbook-and-standing-record-coherence`, just outside that window)". Additive, single parenthetical | spec §3 D12; (verified: issue #1357 (2026-08-06), findings 4/7) |
| D13 | Land-barrier `_Avoid_` fix | The auditor's suggestion, in the live-named **Land-barrier check** entry: "this executes End-state `check:` commands, on every phase that claims one" | spec §3 D13; Note 1 |
| D14 | `CONTEXT.md` budget remedy | **Preferred arm: eviction pass** — move the coldest glossary-entry bodies byte-identical to the cold home (D15), leaving each term heading + a fixed-shape trigger pointer, until `CONTEXT.md` ≤ 111,616 B including this plan's additions. Named candidates (A3, operator-vetoable), **all five primary** — the three-entry list this row carried before the /red-team pass falls 757 B SHORT and is retired: **Dead-agent land failure**, **Stale prior attempt**, **provision base divergence**, **Orphan adoption** (`record-as-owned`), **Near-miss diagnostic**. The **ADJUDICATED (verdict)** entry is hot and guard-read (D8) — never a candidate; likewise excluded, per the full pin census (Note 2): the D19-pinned **Adjudication** entry, the D24-pinned **Staged phase script** entry, the D26-pinned `### Audit` terms, the two D28 pointer-pair entries (**`held:submodule-pr`**, **recovery relaunch** — a veto redirect reaching for **recovery relaunch** would red D28), the **Advisory line** / **Tighten pass** entries needled by `lessons-learned-doc-contract.test.mjs`, and — added by the /red-team pass, missing from the pre-pass census — the **D29-pinned trio `Surface budget` / `Prose temperature` / `Trigger pointer`** (the `### Prompt-surface budgets` ADR-0042 mirror block, #1208), each read by construct and required to span its `_Avoid_` line. **Fallback arm (operator-gated): ADR-0042-justified re-derivation** recorded in the commit body plus the re-derived constants landing in `prompt-surface-budgets.test.mjs` in the same diff — never a silent constant raise | spec §3 D14; A3/A4 |
| D15 | Eviction destination | One new cold home `skills/war/references/glossary-cold.md` — all three candidates are war-execution incident/recovery doctrine, `skills/war/references/` is the existing cold store for war doctrine (`resume-and-recovery.md` precedent), and `references/` is unbudgeted (ADR 0042). Each moved body lands byte-identical under an additive per-term heading (the recorded byte-identical-eviction lesson: the block's own bytes govern, the surrounding outline may gain a heading); repo-root-relative links inside moved bodies re-anchor for the new depth (the verbatim-move lesson) | conversion judgment (A4), logged for /red-team |
| D16 | Task decomposition | Six file-disjoint tasks in Phase 1 — Task 1.1 `CONTEXT.md` + cold home + the `war-config.test.mjs` sweep-list row (the eviction destination joins the enumerated `_polish` OLD-absent list per the UNION-extension precedent — same task as the file it guards); Task 1.2 the ADR; Task 1.3 `CLAUDE.md`; Task 1.4 the gate comment; Task 1.5 the skill doctrine clause; Task 1.6 scaffold + suite with `deps: [1.1]` (rule 7: the D8 guard pins a line in Task 1.1's file — same wave is insufficient at the frozen phase base, and the guard's surface read must be against the post-eviction file) — plus the standard trailing release phase | conversion judgment; war-strategy §3 rule 7 |
| D17 | Guard banner/title currency | The guard block's banner ("Both surfaces are addressed as SINGLE LINES") and the test title's "each documented verdict line is token-set equal" both go stale at five surfaces and two compare modes — both are updated in the same diff to enumerate five surfaces and name the per-surface compare (set vs ordered-sequence vs subset+partition); the banner-undercount lesson | conversion judgment, logged for /red-team |
| D18 | Pointer-pair drift guard for the evicted entries | **New D30 row in `skills/war/assets/skill-doc-contracts.test.mjs`**, modelled on the existing D28 pointer-pair test. Each eviction creates a hand-copied cross-file fact (the `CONTEXT.md` residue's destination path + the per-term heading it promises in `glossary-cold.md`) with no guard in the pre-pass plan — the exact ADR 0025 class. Per evicted term, both halves are asserted: the `CONTEXT.md` residue keeps a trigger clause **and** the literal destination path; `glossary-cold.md` carries that term's heading **and** a non-empty body. Rides in **Task 1.1**, the same task that authors the fact (no `deps` edge needed). Rejected: leaving the pairs unguarded on the "green by construction" argument — that argument covers the `_polish` sweep, not heading/path drift | /red-team `unguarded-new-mirror`, 2026-08-16; ADR 0025 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | D5's exact compression is the wanted wording | spec §3 D5 (carried [assumed] row) | the plan interview / operator picks different bytes — the binding contract is the OLD-absent + ADJUDICATED-present checks (End state 4), not the byte string | End state 4's greps; ratify in /red-team |
| A2 | The D9 partition proof (subset compare + per-arm placement asserts) is wanted — invention beyond #1267's literal two-surface ask | spec §3 D9 (carried [assumed] row); constraint 8 makes the plain whole-line compare wrong, and the subset compare alone would let a sixth verdict land unplaced | drop to the subset compare alone and record the narrowing in the task's done report | End state 7's fail-first mutation traces; ratify in /red-team |
| A3 | Eviction-target selection: coldest = the named incident-only recovery entries. **Figures re-measured at the campaign base `a489067` by the /red-team pass (2026-08-16); the conversion-time figures were wrong and are retired.** Measured entry spans (heading→next-entry-heading, stopping at the next `**Term**:`-shaped line OR the next `##`/`###` heading): **Dead-agent land failure** 1,401 B, **Stale prior attempt** 1,052 B, **provision base divergence** 696 B, **Orphan adoption** 987 B, **Near-miss diagnostic** 728 B. Net removable per entry (span minus the retained `**Term**:` heading, minus one ≈85 B pointer line, minus the trailing blank): 1,286 + 941 + 579 + 860 + 616 = **4,290 B**, against a **3,563 B need** (3,366 B overage at the campaign base + ≈175 B for D6's qualifier/parenthetical + 22 B for D13) — **727 B of margin**. All five entries carry zero test pins (**Orphan adoption** re-verified: the `record-as-owned` pin in `skill-doc-contracts.test.mjs` D28 reads `references/resume-and-recovery.md`'s Recovery-relaunch section, never the CONTEXT.md entry) | /red-team re-measurement at `a489067` (2026-08-16), superseding the conversion cold-scan at `6fff2ee`; re-measure again at the task's rebased base | operator redirects the strike list at the veto, or elects the D14 fallback arm | End state 11's byte check re-verifies at the rebased base; a residual shortfall pulls a further unpinned cold entry before the operator-gated fallback arm |
| A3-note | **Why the conversion-time census was wrong** (recorded so the error is not re-derived): its entry slice terminated only on the next `**`-opening line, so it (a) ran past **provision base divergence**'s real terminator and swallowed the adjacent **Orphan adoption** entry (695 + 987 ≈ the claimed 1,683), and (b) truncated **Stale prior attempt** early at a mid-body `**never**` bold span. The conversion figures ≈1,412/≈1,377/≈1,683 and "frees ≈4.2 KB" are retired; on the corrected slice the original three-entry list frees only 2,806 B net and lands `CONTEXT.md` **757 B OVER** the advisory line — the reserve alone does not rescue it (116 B over), which is why D14's strike list is widened to five primaries | /red-team `budget-math` + Lead re-measurement, 2026-08-16 | n/a — this row is a recorded correction, not a live assumption | n/a |
| A4 | `skills/war/references/glossary-cold.md` is the right cold home | D15's reasoning (war-scoped candidates, existing cold store, unbudgeted) | operator renames the destination at the veto; the pointer shape and byte-identity rules are unchanged | destination operator-ratified at the /war-machine volley (2026-08-11); /red-team re-verifies mechanics only |
| A5 | Both predecessor plans have LANDED before any task of this plan dispatches | the spec header's `dependsOn` declaration (`red-team-gate-cli`, `done-when-floor-wiring`), corroborated by both sibling-spec texts at `6fff2ee` (the 2026-08-06 survey manifest is not present in this worktree — the spec's statement of the machine hint is the source); both plans committed in `docs/plans/` and sequenced ahead in the roadmap spine (ADR 0011) | authored-against-post-predecessor edits collide with the predecessors' rewrites or land against stale shapes | per-task witnesses at the rebased base — Task 1.3: `grep -c 'done-unmet' CLAUDE.md` ≥ 1 (plan 3's End state 11); Task 1.4: `grep -c 'refused by construction' skills/red-team/assets/red-team-gate.mjs` = 0 (plan 1's End state 6); witness fails ⇒ halt and report the missing predecessor, never improvise |
| A6 | The `CLAUDE.md` D5 edit fits under the budget suite's advisory line at the post-plan-3 base | measured 13,523 B at `6fff2ee` + plan 3's ≲200 B expected delta + ≈90 B here ≈ 13.8 KB vs advisory 14,336 B | tighten the added wording (the hard 16,384 B line is not approachable) | End state 4's budget-suite run |
| A7 | The three guard-read surfaces outside this plan's footprint (`lenses.md` spine bullet, severity bullet, report-template line; `skills/war-campaign/SKILL.md` triage arms) are unchanged at this plan's base | verified at `6fff2ee`; predecessor plan 1 touches only `lenses.md`'s `## Route upstream` template region (verified against its Task 1.1 slice), and no predecessor touches `war-campaign/SKILL.md` | the guard reds at land against a moved surface — fix the guard's addressing, never the surface | End state 7's suite run at the integrated tip |

## Non-goals / deferred

- **No behavior change to `verdict()`, `classify()`, the loop-breaker arithmetic, or the gate CLI** —
  the CLI is the landed `red-team-gate-cli` group's scope.
- **Not declaring `adjudicated` in the `FINDINGS` schema, and not adopting
  `additionalProperties: false`** (rejected in D1/D2 with reasons — the rejections are decisions, not
  trivia, and stand).
- **Not guarding `docs/adr/` quotations, run records, campaign state, or `red-team-gate.mjs`'s own
  same-file comment restatements of the precedence chain** (adjacency exemption, recorded in
  Context 3) — the guard's pin scope stays live doctrine surfaces.
- **Not re-opening ADR 0043's stamping doctrine or the 2026-07-28 operator directive on advisory
  BLOCKED.**
- **Not rewriting `CONTEXT.md` glossary entries beyond the two named lines** — the eviction moves
  bodies byte-identical, never rewrites them.
- **No edits to `skills/red-team/references/lenses.md` or `skills/war-campaign/SKILL.md`** — both are
  guard-read only (D9/D10 pin them; their enumerations are currently correct).
- **#1357 findings 3/6** (the `CLAUDE.md` ADR-range literal) are already fixed at the live tip and take
  no work here; the checkpoint's close comment on #1357 records that with the verifying grep.
- **No new ADR** — ADR 0043's contract is enforced, not changed; ADR 0025's discipline is applied;
  ADR 0045 receives in-place factual-pointer corrections (constraint 4). If the operator elects D14's
  fallback arm, the justification is recorded in the commit body per ADR 0042 — still no new ADR.

## New domain terms · Recommended ADRs

None. "Proceed verdict", the stamping mechanic, and the hot/cold law are existing vocabulary; no new
WAR construct is introduced (the cold home is a file, not a term). No ADR (Non-goals).

## Commander's Intent

- **Purpose:** the ADJUDICATED contract is enforceable end to end — a probe can never mint the Lead's
  stamp, and the one legitimate stamping channel is documented as the only one; every live doc surface
  states the ratified proceed-verdict cascade instead of a CLEARED-only absolute; every hand-copied
  verdict enumeration on a live doctrine surface is mechanically bound to `verdict()`'s literal set so
  the next widening reds instead of rotting; and the durable records are true — ADR 0045 attributes
  the per-blocker bound to its real home, its census names its outlier's window position, and
  `CONTEXT.md` is factually right and back at or under its ADR 0042 advisory budget.
- **Method:** a one-key `adjudicated` strip at the scaffold's Layer-4 probe-collection boundary (the
  only layer where every finding is probe-authored by construction — gate-side stripping and schema
  declaration stay rejected because the Lead's stamp re-pipes through the same channel and a declared
  key would advertise it), pinned both ways by source-scan pins with a fail-first red; the End-state-9
  guard grows from two surfaces to five with per-surface extraction + equality — ordered-sequence for
  the semantic precedence chain, derived-subset + three-arm partition for the extraction-hostile
  war-campaign triage line, pipe-split token-set for the spine bullet — banner and title updated in
  the same diff; the `CLAUDE.md` roles sentence adopts the ratified cascade wording compressed to
  gospel register; the `CONTEXT.md` escape-guard absolute gains the until-clean qualifier and the
  foreign-delta carve-out parenthetical; the gate's header comment names all withheld proceed arms;
  ADR 0045 gets two in-place attribution clauses and one census parenthetical; and `CONTEXT.md` comes
  under budget by an operator-vetoable byte-identical eviction of three named cold recovery entries to
  a new unbudgeted cold home behind fixed-shape trigger pointers — never by touching the constant.
  Predecessor-moved files are edited against their post-plan-1/plan-3 shapes with per-task witnesses;
  standalone runs halt on a missing witness.
- **End state:**
  1. A probe result whose findings carry `adjudicated: true` loses that key at the Layer-4 collection
     loop — no finding in the assembled `probeResults` carries it — and the D4(a) source-scan pin
     holds (fail-first: the pin is red against the pre-fix source; the trace is done-report evidence,
     backstop row) ·
     check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs` **plus the base-red floor**
     `grep -c 'adjudicated' skills/red-team/assets/workflow-scaffold.js` ≥ 2 (the strip site and the
     D2 deliberate-absence comment; the file carries **zero** hits at the base, so the suite run alone
     cannot distinguish "Task 1.6 landed" from "Task 1.6 was skipped" — the suite is green at base and
     every new pin is an addition to it).
  2. The `FINDINGS` schema literal still does not declare `adjudicated` and carries the
     deliberate-absence comment — a future declaring diff must consciously red the D4(b) pin ·
     check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs` **plus the base-red floor**
     `grep -c 'deliberate' skills/red-team/assets/workflow-scaffold.js` ≥ 1. Note this End state's
     first half is **near-tautological at base** — the literal already declares no `adjudicated` key —
     so the deliberate-absence comment is the only half that new work can move, and it is the half the
     floor pins.
  3. The stamping-mechanic paragraph carries the provenance backstop (an already-stamped finding in
     the Workflow return / persisted task output is impossible by construction and is treated as
     unstamped and investigated), and every standing doc-guard row on the skill stays green ·
     check: `grep -c 'treated as unstamped' skills/red-team/SKILL.md` ≥ 1 and
     `node --test skills/red-team/assets/red-team-gate.test.mjs`.
  4. `CLAUDE.md`'s roles sentence carries the proceed-verdict cascade and the old absolute is gone,
     with the ratified pointer line byte-unchanged and the budget suite green ·
     check: `grep -c 'ADJUDICATED' CLAUDE.md` ≥ 1, `grep -c 'until CLEARED' CLAUDE.md` = 0, and
     `node --test skills/war/assets/prompt-surface-budgets.test.mjs`. **Mandatory manual same-scope
     survey (grep is a floor):** hand-scan the full pipeline-gospel section for sibling CLEARED-only
     verdict claims; list each straggler as a survey-derived correction.
  5. The `CONTEXT.md` **Sandbox-escape guard** entry's never-CLEARED sentence carries the
     "until the state is clean" qualifier and the foreign-delta parenthetical ·
     check: `grep -c 'until the state is clean' CONTEXT.md` ≥ 1. **Mandatory manual same-scope
     survey:** hand-scan the entry and its ADR 0020/0033-citing glossary neighbors for sibling
     unqualified absolutes; list stragglers.
  6. `red-team-gate.mjs`'s header comment names all withheld proceed arms and the CLEARED-only
     sentence is gone, with the End-state-9 guard's extraction untouched (the comment sits above the
     slice) ·
     check: `grep -c 'NEVER returns CLEARED while' skills/red-team/assets/red-team-gate.mjs` = 0,
     `grep -c 'nothing else' skills/red-team/assets/red-team-gate.mjs` ≥ 1, and
     `node --test skills/red-team/assets/workflow-scaffold.test.mjs`. **Mandatory manual same-scope
     survey:** hand-scan the file's remaining comments — including the CLI doc block as rewritten by
     the landed plan 1 — for sibling rule-shaped verdict-naming sentences; the two same-file
     precedence-chain restatements are recorded exempt (Context 3); list any other straggler as a
     survey-derived correction.
  7. All five documented enumerations (the two lenses.md originals + the D8/D9/D10 surfaces) are
     guard-bound: any drift from `verdict()`'s literal set — or a sixth verdict — reds the extended
     End-state-9 guard, whose banner and title enumerate the five surfaces and their compare modes ·
     check: `node --test skills/red-team/assets/workflow-scaffold.test.mjs` **plus the base-red floors**
     (the suite is green at base and all three surfaces are additions to it, so the suite run alone
     cannot detect their absence) — over `skills/red-team/assets/workflow-scaffold.test.mjs`:
     `grep -c 'CONTEXT_PATH' … ` ≥ 1, `grep -c 'CAMPAIGN_PATH' …` ≥ 1, `grep -cF 'Precedence:' …` ≥ 1,
     `grep -cF '(a) Proceed' …` ≥ 1, and `grep -cF 'five surfaces' …` ≥ 1 (the D17 banner/title
     currency update); each reads **0** at the base. Fail-first proof: a one-token mutation of each
     NEW surface (scratch copy) reds its assertion — the three traces are done-report evidence
     (backstop row).
  8. ADR 0045 attributes the ≤ 2 per-blocker bound to `/red-team`'s Step 5 and never to ADR 0043 ·
     check (**line-joined and case-insensitive — a single-line `grep -cF` false-negates here**: the
     live clause already straddles a line boundary, `…the per-blocker bound` ending line 28 and
     `ADR 0043's Step 5 already imposed…` opening line 29, and Task 1.2 rewrites exactly that clause,
     so any reflow that moves the wrap leaves the misattribution intact while a single-line absence
     grep returns 0):
     `tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -ciF "ADR 0043's Step 5"`
     = 0 and
     `tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -ciF "ADR 0043's ≤ 2"`
     = 0 (`-F`: apostrophe- and non-ASCII-bearing patterns, constraint 10; `-i`: the OLD-absent half
     must not be evadable by sentence-initial recapitalization — the recorded
     `retirement-grep-for-prose-needle-must-be-case-insensitive-or-sentence-initial-capitalization-evades-it`
     lesson). **NEW-present half (an absence-only pair passes on a deleted clause):**
     `tr '\n' ' ' < docs/adr/0045-red-team-loop-budget-and-route-upstream.md | grep -ciF "/red-team"`
     ≥ 2 — the two rewritten clauses must actually name their real home, not merely drop the wrong one. **Mandatory manual same-scope survey:**
     hand-scan every remaining ADR-0043 citation in the file (seven space-form hits at `6fff2ee`,
     dated snapshot — Context, Decision bullets, Consequences, References — **plus** the two
     hyphenated `pre-ADR-0043` mentions the space-form grep misses) for sibling misattributions; the
     Context sentence is auditor-judged neutral and stands; list stragglers.
  9. The ADR 0045 census sentence carries the window disambiguator ·
     check:
     `grep -c 'just outside that window' docs/adr/0045-red-team-loop-budget-and-route-upstream.md` ≥ 1.
  10. The **Land-barrier check** entry's `_Avoid_` contrast is scoped to claiming phases ·
      check: `grep -c 'every phase that claims one' CONTEXT.md` ≥ 1, with the unscoped
      "commands, every phase" form absent from that entry (hand-verified within the entry — grep is a
      floor).
  11. `CONTEXT.md` is at or under its advisory line at land, with the **ADJUDICATED (verdict)** entry
      unmoved and every evicted body byte-identical at the cold home behind a triggered pointer ·
      check: `[ "$(wc -c < CONTEXT.md)" -le 111616 ]` and the budget suite's run log carries no
      `CONTEXT.md` WARN — or, on the operator-gated D14 fallback arm, the commit body carries the
      ADR-0042 justification and the re-derived constants land in
      `skills/war/assets/prompt-surface-budgets.test.mjs` in the same diff. **The strike list is the
      five D14 primaries** (A3, re-measured 2026-08-16): the pre-pass three-entry list frees only
      2,806 B net and lands 757 B OVER — it is retired and must not be re-derived. All five free
      4,290 B net against a 3,563 B need (727 B margin).
  12. The full gates are green at the integrated tip ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'`, the documented hooks/skills shell-test loop, and the redaction-lint
      wrapper all pass.
  13. Each landing commit cites its issue(s) — #1264 for Tasks 1.5/1.6, #1265 for Tasks 1.1/1.3/1.4,
      #1267 for Task 1.6, #1357 for Tasks 1.1/1.2, #1386 for Task 1.7; the citation-only closures
      (#1357 findings 3/6) are cited in the phase-close checkpoint notes, no code change ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat).
  14. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).
  15. *(amendment 2026-08-15, #1386)* Both zero-form `out.rounds` assertion messages in
      `red-team-gate.test.mjs` interpolate the observed value; the assertion predicates are
      byte-unchanged ·
      check: `node --test skills/red-team/assets/red-team-gate.test.mjs` green, and the two
      zero-form rows' message arguments are template literals carrying `out.rounds`
      (hand-verified in the diff — messages only, no predicate change).
  16. *(added by the /red-team pass, 2026-08-16 — D18)* Every evicted glossary term is pointer-pair
      guarded: for each, the `CONTEXT.md` residue keeps a trigger clause and the literal
      `skills/war/references/glossary-cold.md` destination path, and the cold home carries that term's
      heading with a non-empty body — a renamed or dropped destination heading reds ·
      check: `node --test skills/war/assets/skill-doc-contracts.test.mjs` **plus the base-red floor**
      `grep -cF 'glossary-cold.md' skills/war/assets/skill-doc-contracts.test.mjs` ≥ 1 (the file
      carries zero hits at the base, so the suite run alone cannot detect a skipped D30 row).

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.2, 1.3, 1.4, 1.5, 1.7; wave 2 = Task 1.6 `deps: [1.1]`) → Phase 2
(release). Task 1.7 (amendment 2026-08-15) is file-disjoint from every sibling — no plan task
touches `red-team-gate.test.mjs` — and dependency-free.

The wave edge is rule 7's guard-split case, never a collision dodge: Task 1.1/1.6 file sets are
disjoint, and Task 1.6's D8 guard surface is a line in Task 1.1's file — at the frozen phase base the
guard would read a pre-eviction `CONTEXT.md`, and the guard's surface read must be against the final
file (the eviction never moves the **ADJUDICATED (verdict)** entry, but the ordering makes that a
verified property instead of an assumption); Task 1.6's worker rebases onto the integration tip as its
first act. Tasks 1.2–1.5 are file-disjoint from everything and dependency-free within the phase (their
constructs exist at the frozen base, which already carries both landed predecessor plans).

## Phase 1 — Strip, cascade, guards, records, budget

### Task 1.1: CONTEXT.md truth + eviction to the cold home (#1265 item 2; #1357 findings 1/5)

- Files: `CONTEXT.md`, `skills/war/references/glossary-cold.md`, `skills/war/assets/war-config.test.mjs`, `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: **Escape-guard qualifier (D6)** — in the **Sandbox-escape guard** glossary entry, extend
  the sentence "routes the verdict through the self-confound gate (ADR 0020), never `CLEARED`" with the
  ADR 0033 twin's qualifier "until the state is clean" and one brief parenthetical naming the
  foreign-delta carve-out (a provenance-cleared foreign delta is clean state and does not block
  `CLEARED`) — concept-named, no bytes quoted from plan-2-owned regions (Note 4). **Land-barrier
  `_Avoid_` fix (D13)** — in the **Land-barrier check** entry (the live heading; the source issue's
  "Land-barrier endstate-check dispatch" name is stale — Note 1), the `_Avoid_` contrast becomes "this
  executes End-state `check:` commands, on every phase that claims one". **Eviction pass (D14/D15)** —
  create `skills/war/references/glossary-cold.md` (header naming it the unbudgeted cold home for
  evicted `CONTEXT.md` glossary bodies, ADR 0042); move the bodies of **Dead-agent land failure**,
  **Stale prior attempt**, and **provision base divergence** (reserve if the re-measured shortfall
  needs it: **Near-miss diagnostic**) byte-identical under additive per-term headings, re-anchoring any
  repo-root-relative links for the new depth (the verbatim-move lesson; e.g. the ADR 0005/0008 links
  those bodies carry); leave in `CONTEXT.md`, per entry, the `**Term**:` heading plus one fixed-shape
  pointer line `when <trigger>, read skills/war/references/glossary-cold.md` with a real per-term
  trigger (e.g. "when a land dispatch returns null or an unrecognized status", "when a relaunch push
  is rejected non-fast-forward", "when `cmd_ensure_integration` halts on divergence") — a pointer
  without a trigger is a defect. Never touch the **ADJUDICATED (verdict)** entry (guard-read, D8) or
  any other D14-excluded entry (the full pin census, Note 2: D19 **Adjudication**, D24 **Staged phase
  script**, D26 `### Audit` terms, the D28 pointer pairs, the lessons-learned-needled **Advisory
  line** / **Tighten pass**). **Sweep-list row (UNION-extension precedent):** append
  `skills/war/references/glossary-cold.md` to the enumerated `sweptSurfaces` list in
  `war-config.test.mjs`'s `_polish` OLD-absent test — the eviction destination joins the anchored
  file list exactly as the prior SKILL.md eviction destinations did, so a future retirement sweep
  cannot silently skip the cold home (the enumerated-destination fail-open lesson); green by
  construction at land (the moved bodies come from a swept-green `CONTEXT.md`).
  **Pointer-pair drift guard (D18, added by the /red-team pass — ADR 0025: the guard ships in the same
  task as the fact it guards, which is this one):** each retained `**Term**:` heading + trigger pointer
  is a hand-copied cross-file fact (destination path plus the per-term heading it must resolve to), and
  a body move with no pin lets the destination heading be renamed or dropped while `CONTEXT.md` still
  promises it. Add a **D30 row** to `skills/war/assets/skill-doc-contracts.test.mjs` modelled
  byte-for-byte on the existing **D28** pointer-pair test (`'D28 — CONTEXT.md compressed glossary
  entries keep definition + trigger pointer, and each destination carries the delegated doctrine
  (#1228)'`) — the established idiom for exactly this construct. Per evicted term, assert **both**
  halves: (a) the `CONTEXT.md` residue still carries a trigger clause **and** the literal destination
  path `skills/war/references/glossary-cold.md`; (b) `glossary-cold.md` carries that term's heading
  **and** a non-empty body under it. Extract by construct (heading match + next-heading lookahead),
  never by line number, and assert exactly-one-match per surface with a non-empty floor — a renamed
  destination heading must red, not silently pass. Re-measure the byte
  math at the rebased base (A3 figures are a dated `6fff2ee` snapshot); target
  `wc -c CONTEXT.md` ≤ 111,616 **including this task's additions**; a shortfall pulls the reserve
  candidate, and the operator veto / D14 fallback arm is the redirect (backstop row). Run End states
  5/10/11's greps + hand-scans and record outcomes in the done report even when zero stragglers.
  Commits cite #1265 and #1357.
- Done when: `[ "$(wc -c < CONTEXT.md)" -le 111616 ]`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

  *(`requiresTest` flipped `false` → `true` by the /red-team pass, 2026-08-16: D18 makes this task
  author a real test — the D30 pointer-pair row in `skills/war/assets/skill-doc-contracts.test.mjs` —
  so the refiner's `assert-test-in-diff.sh` floor is satisfiable and now genuinely enforcing. It was
  correctly `false` when the task was docs-only.)*

### Task 1.2: ADR 0045 attribution + census truth (#1357 findings 2/4/7)

- Files: `docs/adr/0045-red-team-loop-budget-and-route-upstream.md`
- Plan slice: in-place factual-pointer corrections (constraint 4; ratified decision sentences
  byte-intact, Status currency line exempt): **(D11)** the rounds-unit decision bullet's clause becomes
  "the per-blocker bound `/red-team`'s Step 5 already imposed"; the **Per-blocker-only accounting
  (rejected)** bullet opens "`/red-team` Step 5's ≤ 2 re-verify attempts bounds one blocker in one
  run". **(D12)** the census sentence's outlier parenthetical becomes
  "(`2026-07-24-runbook-and-standing-record-coherence`, just outside that window)". No other bytes
  move. Run End state 8's `-F` greps (constraint 10) and the mandatory hand-scan of every remaining
  ADR-0043 citation (seven space-form hits at `6fff2ee`, dated snapshot, plus the two hyphenated
  `pre-ADR-0043` mentions the space-form grep misses; the Context sentence stands); record the
  outcome in the done report even when zero stragglers. Commit cites #1357 (its close conditions
  require the citation).
- Done when: None — prose-only ADR correction; the mechanical pins are End states 8/9's greps.
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: CLAUDE.md proceed-verdict cascade (#1265 item 1)

- Files: `CLAUDE.md`
- Plan slice: **Witness first (A5)** — after the standard rebase, verify `grep -c 'done-unmet'
  CLAUDE.md` ≥ 1 (the landed `done-when-floor-wiring` plan's End-state-11 shape); a miss means the
  predecessor has not landed: halt and report, never improvise. **Edit (D5)** — in the
  pipeline-gospel roles sentence, the `/red-team` parenthetical's tail "patches the plan in place
  until CLEARED" becomes "patches the plan in place until a proceed verdict — CLEARED, or ADJUDICATED
  when a patched blocker was not re-verified (ADR 0043)" (the ratified `README.md` /
  `references/design.md` cascade form compressed to gospel register — never a third phrasing; A1: the
  binding contract is OLD-absent + ADJUDICATED-present, not the byte string). The ratified pointer
  line and every other sentence are byte-untouched; the edit's ≈90 B ride under the budget suite's
  advisory line at the post-plan-3 base (A6). Pin safety, verified at `6fff2ee`: the
  pipeline-structure suite's sixteen gospel-fragment `lacks_i` pins and its `has_i` presence twin
  ("one interview, one merged artifact") sweep different anchors — the new wording contains none of
  the sixteen retired fragments; the diff records the suite green. Run End state 4's greps +
  mandatory hand-scan of the full pipeline-gospel section for sibling CLEARED-only verdict claims;
  record the outcome even when zero stragglers. Commit cites #1265.
- Done when: None — prose-only gospel-doc edit; the mechanical pins are End state 4's greps plus the
  budget and pipeline-structure suites (discovered gate members).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.4: Gate header comment — the withheld-arms rewrite (#1265 item 3)

- Files: `skills/red-team/assets/red-team-gate.mjs`
- Plan slice: **Witness first (A5)** — after the standard rebase, verify
  `grep -c 'refused by construction' skills/red-team/assets/red-team-gate.mjs` = 0 (the landed
  `red-team-gate-cli` plan's End-state-6 shape); a hit means the predecessor has not landed: halt and
  report. **Edit (D7)** — in the comment block above `export function verdict(`, replace the retained
  sentence "the gate NEVER returns CLEARED while a probe was off-target, dropped, or never ran" with
  the withheld-arms form: "with incomplete coverage the gate returns INCOMPLETE and nothing else —
  never CLEARED, CLEARED-WITH-NOTES, or ADJUDICATED — while a probe was off-target, dropped, or never
  ran." Comment-only; the precedence block above it and every code byte are untouched, and the edit
  sits outside the End-state-9 guard's extraction slice (constraint 2) — run the scaffold suite to
  prove the guard is unperturbed. **Grep is a floor:** run End state 6's greps, then hand-scan the
  file's remaining comments — the precedence block, and the CLI doc block **as rewritten by the landed
  plan 1** (this task is authored against that post-predecessor shape, not `6fff2ee`'s bytes) — for
  sibling rule-shaped verdict-naming sentences; the two same-file precedence-chain restatements are
  recorded exempt (Context 3); list any other straggler as a survey-derived correction, and record the
  outcome even when zero. Commit cites #1265.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.5: Stamping-provenance doctrine backstop (#1264)

- Files: `skills/red-team/SKILL.md`
- Plan slice: **(D3)** — in the Steps section's stamping-mechanic paragraph ("The stamping mechanic,
  named exactly"), append one clause widening the backstop from "the Lead stamps" to the flag's
  provenance: a finding arriving **already stamped** in the Workflow's return value or the persisted
  task-output file is impossible by construction (the scaffold strips the key at probe collection —
  defined-but-not-yet-emitted at this task's wave-1 base; produced by Task 1.6) and must be **treated
  as unstamped and investigated** before any adjudication. One clause, no other edits — the paragraph's
  existing mechanics (working copy, `--stdin` re-pipe, top-level `probeResults` precedence,
  fingerprint/expected carry) are byte-untouched, and the edit stays clear of Step 4's escape-guard
  prose (a sibling plan's construct — Note 4). Prove the standing doc-guard rows on this file still
  pass. Commit cites #1264.
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.6: Scaffold strip + both-ways pins + the five-surface guard (#1264, #1267)

- Files: `skills/red-team/assets/workflow-scaffold.js`, `skills/red-team/assets/workflow-scaffold.test.mjs`
- Plan slice: **Scaffold (D1/D2)** — in the Layer-4 probe-collection loop (the
  `const probeResults = []` retry loop), strip the `adjudicated` key from every finding object of
  every collected result at the single site right before the push (covers first-pass and retried
  results alike), with a comment naming the contract: Lead-stamped post-run only, in the Lead's
  working copy of the gate input (ADR 0043) — a probe has no legitimate path to it. Blast radius
  zero beyond the one key: the result-level `dropped: true` coverage markers and the confirm-stage
  `reality` suffix (a declared key) are untouched — the D4(a) fail-first run is the proof. Inside the
  `FINDINGS` schema literal, beside the `findings.items` properties, add the deliberate-absence
  comment (JS comments never reach the dispatched JSON), avoiding the `adjudicated:` key-colon shape
  (constraint 11), mirroring the lenses.md finding-schema comment's stance. **Pins (D4)** — beside
  the suite's module-level `src` read: (a) slice between the `const probeResults = []` anchor and the
  `return { plan: planFile` line and assert the collection construct performs the strip — descriptive
  wording and referential messages, never restating pattern bytes; demonstrate the pre-fix red on a
  scratch copy and record it (backstop row); (b) slice the `FINDINGS` literal and assert
  line-anchored that `findings.items` declares no `adjudicated` key AND that the deliberate-absence
  comment is present — default-deny both directions. **Guard extensions (D8/D9/D10/D17)** — extend
  the End-state-9 guard block (same test or an adjacent sibling in the block) with three new
  surfaces, each keeping the block's discipline (single-line addressing by named construct,
  exactly-one-match assertion, non-empty floor, delimiter-split extraction, referential messages):
  new path constants beside `LENSES_PATH`/`GATE_PATH` for `CONTEXT.md` (three dirs up) and
  `skills/war-campaign/SKILL.md`. Surface 3 (D8): slice the **ADJUDICATED (verdict)** entry
  (heading-match with next-entry lookahead — the `skill-doc-contracts.test.mjs` D19 idiom), assert
  exactly one `Precedence:` line, slice it to the first `;`, extract code-span tokens in order, and
  `assert.deepEqual` the sequence against the guard's existing pre-sort `literals` array (body
  appearance = precedence, Context 5) — ordered compare, not set. Surface 4 (D9): assert exactly one
  `**(a) Proceed**` line; slice after the marker to the first following `(` (constraint 8); extract
  code spans; compare the sorted set against the proceed subset **derived** from `EXPECTED_VERDICTS`
  by filtering `BLOCKED`/`INCOMPLETE` (never a second hand-list); then the partition — exactly one
  `**(b) Route upstream**` line carrying `` `BLOCKED` `` as a code span, exactly one
  ``**(c) Persistent `INCOMPLETE`**`` line carrying `` `INCOMPLETE` `` (A2 carries the
  narrowing fallback). Surface 5 (D10): assert exactly one line starting
  ``- **`INCOMPLETE` verdict**``; extract its single pipe-bearing backtick span, split on `|`, trim,
  sorted token-set `deepEqual` with `EXPECTED_VERDICTS`. Update the guard's banner comment and the
  test title in the same diff to enumerate five surfaces and name each compare mode (D17 — the
  banner-undercount lesson; keep the banner's defeat-history notes intact). Fail-first: one-token
  mutation of each new surface on a scratch copy reds its assertion; record the three traces
  (backstop row). No content edit to `CONTEXT.md`, `skills/war-campaign/SKILL.md`, or `lenses.md` —
  all three enumerations are correct at the base (A7); the guard pins them. Commits cite #1264 and
  #1267.
- Done when: `node --test skills/red-team/assets/workflow-scaffold.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: [1.1]
- target repo: superproject

### Task 1.7: Zero-form assert messages interpolate the observed delta (#1386; folded 2026-08-15)

- Files: `skills/red-team/assets/red-team-gate.test.mjs`
- Plan slice: the two End-state-3 zero-form rows (locate by construct: the assertions checking
  `out.rounds` echoes a supplied `0` — near-duplicate `assert.equal(out.rounds, 0, '<fixed string>')`
  calls; #1386 cites ~876/~888 as rotting line hints only) each pass a fixed-string message, which
  per the code-verified lesson `assert-deepequal-custom-message-suppresses-diff-interpolate-delta`
  suppresses node:assert's generated actual/expected diff. Interpolate the observed value into both
  messages — the issue's prescribed shape:
  `` rounds: 0 must be echoed — 0 is a supplied value, got ${JSON.stringify(out.rounds)} (keys: ${Object.keys(out)}) ``
  (or the file's nearest existing delta-interpolation idiom, e.g. the roundLimit row's — in-file
  consistency is the point). **Not a nonvacuity gap** (#1386 traced both rows red in both
  directions); this is diagnostics-quality only — assertion *predicates* byte-unchanged, messages
  only. Suite stays green. Commit cites #1386.
- Done when: `node --test skills/red-team/assets/red-team-gate.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Release

### Task 2.1: Version slots, lock-step

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: bump all four slots together — `plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the `README.md` `## Status` blurb (replace-in-place,
  never an empty field, no badge) — to the **next free patch above the live integration base at land
  time**; never a resolved version literal (any version literal in this plan, the source spec, or the
  campaign roadmap is non-authoritative). Expected integration base: the tip after the roadmap's
  sequenced predecessors — at minimum `2026-08-06-red-team-gate-cli` and
  `2026-08-06-done-when-floor-wiring`, this plan's hard upstreams (A5) — have landed their own release
  phases (ADR 0011 stack-and-plow; N stacked unlanded releases lag main cumulatively, so resolve from
  the slots at the actual base, never from memory). Standalone fallback: run through plain `/war`,
  resolve the next free patch from the four slots themselves. The Status blurb names the probe-proof
  `adjudicated` strip, the five-surface verdict-enumeration guard, and the CONTEXT.md budget
  restoration — quoting only identifiers that exist in the landed diff (release-blurb lessons: count
  words match the enumeration; quoted literals byte-match landed identifiers; guard semantics stated
  no wider than the implementation — the guard pins five documented surfaces, it does not scan the
  repo).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The manual same-scope survey halves of End states 4, 5, 6, 8, and 10 · why deferred: a hand-scan
  cannot be a mechanical gate member; done-report-only evidence, which gate-audit reads as SOFT and
  never a hold (deliberately-uncommitted-probe lesson class) · runner: the owning task's worker (1.3
  for End state 4, 1.1 for End states 5/10, 1.4 for End state 6, 1.2 for End state 8) records each
  outcome — mandatory statement even when "zero stragglers"; the Lead re-runs all the greps at phase
  close.
- The D4(a) fail-first red (the strip pin against the pre-fix scaffold source) and the three
  one-token guard-surface mutation reds (End state 7) · why deferred: mutation runs are uncommittable
  by design — the committed pins and the extended guard are the standing checks · runner: Task 1.6's
  worker runs all four on scratch copies and records the reds in the done report; gate-audit reads
  them SOFT.
- The operator veto over the D14 eviction strike list (and the A4 destination name) · why deferred:
  the strike list is re-measured at the task's rebased base and ADR 0042's fallback arm is
  operator-gated — a plan literal cannot pre-ratify it · runner: the Lead surfaces Task 1.1's final
  list (with before/after byte counts) at the phase checkpoint before land; a veto redirects to the
  reserve candidate or the D14 fallback arm.
- The predecessor witnesses (A5) on a standalone run · why deferred: a campaign run discharges them by
  spine order; only a plain-`/war` run can encounter the missing-predecessor state · runner: Tasks 1.3
  and 1.4 run their witness greps as their first post-rebase act and halt-and-report on a miss.
- *(amendment 2026-08-15)* End state 15's messages-only half (assertion predicates byte-unchanged) ·
  why deferred: a diff-shape property, not a mechanical gate member · runner: Task 1.7's worker
  states it in the done report; the refiner eyeballs the diff at merge; gate-audit reads it SOFT.

## Notes / conscious deviations

1. **Live-construct correction:** the source issue and spec name the `CONTEXT.md` entry "Land-barrier
   endstate-check dispatch"; the live glossary heading at `6fff2ee` is **Land-barrier check**. The
   plan anchors by the live construct (anchor-by-named-construct rule); the fix's content is
   unchanged. Logged for /red-team ratification.
2. **Eviction candidate selection and pin census (A3/D14).** *(census corrected by the /red-team pass,
   2026-08-16 — the pre-pass version was incomplete in one arm and wrong in another; both corrections
   are recorded here rather than silently applied.)* The census of CONTEXT.md-reading suites at the
   campaign base `a489067`: `skill-doc-contracts.test.mjs` entry-pins **Adjudication** (D19),
   **Staged phase script** (D24, #1134), the `### Audit` terms (D26), the two D28 pointer-pair
   entries **`held:submodule-pr`** and **recovery relaunch** (#1228), **and — omitted from the
   pre-pass census — the D29-pinned trio `Surface budget` / `Prose temperature` / `Trigger pointer`**
   (the `### Prompt-surface budgets` ADR-0042 mirror block, #1208; the D29 test reads each by
   construct and requires it to span its `_Avoid_` line);
   `skills/lessons-learned/lessons-learned-doc-contract.test.mjs` carries OLD-absent needles on the
   **Advisory line** and **Tighten pass** entries (surfaces 7–8); `war-config.test.mjs` sweeps
   `CONTEXT.md` in its enumerated `_polish` OLD-absent list; the pipeline-structure suite pins the
   gospel fragments and `input shape`; the budget suite pins bytes, not entries. All **five** named
   candidates (D14, as widened) were re-verified against this corrected census — all genuinely
   unpinned. **Orphan adoption** specifically: the `record-as-owned` regex in `skill-doc-contracts`
   D28 reads `references/resume-and-recovery.md`'s `### Recovery relaunch` section, **never** the
   CONTEXT.md entry, so evicting that entry's body cannot red it.
   **Correction — the "zero cross-file name references" half was false:** `stale prior attempt` is
   named on ~14 lines under `skills/` (including `provision-worktrees.sh` and
   `workflow-template.js`'s `STALE_PRIOR_ATTEMPT_RULE`) and `near-miss diagnostic` on ~21 (including
   `skills/war/references/schemas.md` prose, not merely "two code comments"). This does **not** change
   the conclusion — eviction keeps each `**Term**:` heading plus a triggered pointer, so every one of
   those references still resolves — but the census must not be read as asserting the names are
   unused. Temperature here is branch frequency (incident-only recovery doctrine), never size or
   reference count. Every D14-excluded entry above is a forbidden veto-redirect target (a redirect
   reaching for **recovery relaunch** would red D28; one reaching for any of the D29 trio would red
   D29). Sizes are measured entry spans at `a489067` (A3), re-measured at the task's rebased base.
3. **The 1.6 → 1.1 deps edge is rule 7's guard-split case**: the D8 guard (Task 1.6's file) pins a
   line in `CONTEXT.md` (Task 1.1's file). The pinned **ADJUDICATED (verdict)** entry is excluded
   from eviction by D14, so the guard would in fact be green at the frozen base — but the edge makes
   "the eviction did not move the guard's surface" a property verified at the guard's own base
   instead of an assumption, and rule 7 prefers the available edge (no cycle). Logged for /red-team
   ratification.
4. **Contention honesty — same-file overlaps with non-predecessor siblings.**
   `skills/red-team/SKILL.md` is shared with the `escape-guard-exit-contract` plan (its Task 1.2
   edits Step 4's triage prose; this plan's Task 1.5 edits the stamping-mechanic paragraph — disjoint
   constructs, no content dependency in either direction, no ordering edge; whichever lands second
   rebases trivially). `lenses.md` is a guard-read here, never an edit: plan 1 edits its
   `## Route upstream` template, plan 2 its escape-guard bullet, and this plan's D10 surface is the
   ``- **`INCOMPLETE` verdict**`` spine bullet — three disjoint constructs, verified at `6fff2ee`.
   The roadmap carries `## Shared-file contention` rows for `skills/red-team/SKILL.md` (plan 2 + this
   plan) and `lenses.md` (plans 1, 2 + this plan's guard-read); the D6 parenthetical names the
   foreign-delta carve-out conceptually rather than quoting plan-2-owned bytes so no cross-plan byte
   coupling exists.
   **New contention introduced by the /red-team pass (2026-08-16):** D18 adds
   `skills/war/assets/skill-doc-contracts.test.mjs` to Task 1.1's `Files:`. Two campaign plans
   sequenced **after** this one also own that file — `structural-pin-extractors` (its Task 1.x
   `Files:` pairs it with `skills/war/SKILL.md`) and `gate2-publication-guard` (same pairing). Because
   this plan lands first, both rebase onto the D30 row rather than the reverse; the additive
   row-per-contract shape of that suite makes the rebase mechanical. No plan **ahead** of this one
   touches the file, so Task 1.1 is authored against a stable shape. The roadmap must gain a
   `## Shared-file contention` row for `skill-doc-contracts.test.mjs` naming this plan plus those two.
5. **Downstream spine edges** (Context 6): `doc-cli-consistency-corpus` and
   `redteam-rounds-config-telemetry` both declare `dependsOn` onto this group — the former shares
   `CONTEXT.md`, the latter edits `skills/war-campaign/SKILL.md`, a file this plan only guard-reads
   (their spec words the overlap as "shares/touches"; the real coupling is that their triage-arm
   edits must keep the D9 guard green, which is exactly why the edge points at this plan). The
   roadmap must carry this plan → both as dependency-spine edges, plus the contention rows;
   /war-campaign's sweep contention check re-verifies.
6. **Posterity survivors.** Historical artifacts keep the retired wordings and are never retro-edited
   (ADR 0046 posture): the source issues' verbatim quotes, the landed 2026-08-02/2026-08-05 plans and
   red-team reports, `docs/adr/` historical quotations, and lesson bodies. Every OLD-absent check
   here is scoped to the single live surface its End state names.
7. **Spec §10 criteria are carried 1:1 into the End states** with their survey notes kept (criteria
   1–11 → End states 1/2, 4, 5, 6, 7, 8, 9, 10, 11, 12; the D3 doctrine clause gains its own End
   state 3, which the spec folded into §4.1's mechanics), plus the house-standard citation and
   release End states (13/14).
8. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified issue #1264, the doc-truth issues #1265/#1267, and the
   war-followup #1357 with its auditor-verbatim findings; the spec's three flagged [assumed] design
   calls are carried as A1/A2/A3 with their fallbacks intact; conversion-time judgments (D15, D16,
   D17, A4–A7, Notes 1–5) are logged for /red-team ratification.
9. **Amendment (2026-08-15, operator-directed): #1386 folded as Task 1.7.** The campaign-era
   follow-up from landed plan 1 (`red-team-gate-cli`, epic #1382) is mechanical, test-file-only, and
   family-resident: this plan already owns the gate CLI family (Task 1.4 edits
   `red-team-gate.mjs`), and no plan 4–14 task touches `red-team-gate.test.mjs`, so the fold adds
   zero contention. Amendment surfaces: header issue map, Task 1.7, End states 13/15, build order.
   Logged for this plan's /red-team pass (which runs after the amendment and validates it like any
   other Part 2 content).

## Open decisions

None. The spec's design tree is fully resolved; the operator-gated points (the D14 eviction strike
list + fallback arm, the A4 destination name) are registered as backstop-row vetoes, and every
conversion-time judgment is logged above for /red-team ratification.
