# Doc-CLI consistency corpus — decoupled posterity scan, default-deny placement census, composite-emphasis carve-out fix, and the Spec-truth-guard supersession record

Converted by `/war-machine` from [docs/specs/2026-08-06-doc-cli-consistency-corpus-design.md](../specs/2026-08-06-doc-cli-consistency-corpus-design.md)
(Part 1 is its decision digest; every spec assumption is carried into the ledger or retired with a stated
reason; spec citations are provenance-only — this plan's Part 1 alone carries every decision, constraint,
and mechanic the run needs). Issues addressed: #1368, #1306, #1358. Issue → task mapping: #1368 → Task 1.1
(the partition census + the lesson stamp); #1306 → Task 1.1 (the `EVICTION_DESTINATIONS` row);
#1358 findings 1/7/9/10 → Task 1.1 (posterity corpus, sentinel floors, carve-out fix, decoupling),
finding 4 → Task 1.2 (`CONTEXT.md` supersession note) + Task 1.3 (ADR 0046 amendment); #1358 findings
2/3/5/6/8 are already fixed at the live tip by the phase-5 close polish commit `2ba7f0a` — re-verified at
conversion 2026-08-12: `grep -c '0001–' CLAUDE.md` → 0 and
`grep -c 'WAR_CAMPAIGN_LEGACY' skills/_shared/doc-cli-consistency.test.mjs` → 0, and `git show --stat
2ba7f0a` touches exactly `CLAUDE.md` + the suite — citation-only closure at the checkpoint. `/war` files
its own epic + task issues regardless (war-execution-must-file-issues); closing the three source issues is
Lead checkpoint work at phase close (war-checkpoint-must-close-task-issues), never assumed from the epic
close — #1358's checkpoint close comment must cite `2ba7f0a` for findings 2/3/5/6/8 (with the two
verifying greps) and this plan's landing commits for findings 1/4/7/9/10.

**Stacked base — the honest construct analysis.** The source spec declares this group lands after the
`verdict-adjudication-integrity` sibling (plan 5), wording the coupling as `CONTEXT.md` contention (the
survey manifest's machine hint is not present in this worktree — the spec's §8 ordering declaration plus
plan 5's committed Note 5, which names this group downstream, are the source). `CONTEXT.md` is now touched
by three plans, and the couplings are (verified: plans 5/6's committed `- Files:` lists and task slices,
read at conversion 2026-08-12): **construct-disjoint on `CONTEXT.md`** — plan 5 Task 1.1 edits the
**Sandbox-escape guard** and **Land-barrier check** entries and evicts the bodies of **Dead-agent land
failure**, **Stale prior attempt**, **provision base divergence** (reserve: **Near-miss diagnostic**);
plan 6 Task 1.4 adds two rows beside the **Phase-close coherence sweep** entry; this plan touches only the
**Spec-truth guard** entry (under the `### Gate composition & spec-truth guards (ADR 0036)` subsection —
in none of plan 5's strike/pin lists, verified against its D14 census) plus two additive new terms. **One
real content coupling** — plan 5 Task 1.1 creates `skills/war/references/glossary-cold.md`, a file that
does NOT exist at `6fff2ee`: this plan's directory-scanned surfaces pick it up two ways (Context 9), so
the census placement is base-dependent and the worker's land-time re-census resolves it at either base.
The `dependsOn` edge onto plan 5 stays on the roadmap (ADR 0011 spine order; it also keeps this plan's
`CONTEXT.md` bytes inside plan 5's post-shrink base, Context 9) — but the standalone fallback is **plain
re-census at the rebased base** (the scan-derived corpus and census are valid whether `glossary-cold.md`
exists or not), never halt-on-missing-witness (Note 2). Snapshot base for every measured claim below: the
repo tip at `6fff2ee` (2026-08-06), re-verified live at conversion 2026-08-12; no committed 2026-08-06
plan touches `skills/_shared/doc-cli-consistency.test.mjs` or `docs/adr/0046-*` (verified: the seven
committed plans' `- Files:` lines carry neither), and the only same-file overlaps are `CONTEXT.md` (above)
and the sanctioned trailing release-slot overlap.

## Context — the gap / problem

The shared suite `skills/_shared/doc-cli-consistency.test.mjs` carries two rules over one corpus: the CLI
verb-resolution drift guard (plan D11, ADR 0025) and the spec-posterity citation rule (F7 / ADR 0046).
Three defects cluster on that corpus's completeness semantics; all are future-regression gaps, none is a
live falsehood at the current tip.

1. **#1368 — the corpus membership guard pins 3 of 14 entries** (verified: issue #1368 (2026-08-06);
   confirmed live at `6fff2ee`, re-read at conversion: the membership loop inside the
   `spec-posterity (F7 / ADR 0046)` test asserts exactly `README.md`,
   `skills/lessons-learned/references/seeding.md`, `skills/war/references/design.md`, while
   `EVICTION_DESTINATIONS` enumerates fourteen). Deleting a listed file fails closed via the unguarded
   `readFileSync`, but silently removing any of the other twelve entries from the in-file array narrows
   both the spec-posterity scan and the original UNION verb scan with the suite green (the issue body
   counts eleven — its own off-by-one: of the loop's three pinned paths, `README.md` is appended by
   `specRuleCorpus` outside the array, so only two pins are array entries and 12 of 14 are silently
   removable; verified: the live membership loop + array at conversion 2026-08-12) — a recorded
   recurrence of the guard-narrowing class the lesson
   `enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed` names (verified: issue
   #1368 (2026-08-06)).
2. **#1306 — `skills/war-strategy/references/plan-interview.md` is unenumerated** (verified: issue #1306
   (2026-08-06); confirmed live at `6fff2ee`: its Stage-0 fenced block carries
   `war-memory.mjs query … --repo docs/learnings`, and the array holds no war-strategy entry). No live
   falsehood — a conversion-time function probe (the suite's own `claimedVerbs` against the live `VERBS`
   dispatch) extracts `query`, which resolves (verified: probe at conversion 2026-08-12) — the exposure is
   a future verb rename rotting the doctrine file's recon command silently.
3. **#1358 findings 1/10 — the posterity corpus is a strict subset of ADR 0046's named surfaces**
   (verified: issue #1358 (2026-08-06)). Census re-run at conversion 2026-08-12 (base `6fff2ee`): 22 files
   match `skills/*/references/*.md`, 14 are enumerated, 8 are unscanned —
   `skills/war/references/auditor-teach.md`, `skills/war/references/gastown-design-params.md`,
   `skills/war/references/refiner-recovery.md`, `skills/war/references/schemas.md`,
   `skills/war/references/worker-servitor-edges.md`, `skills/red-team/references/lenses.md`,
   `skills/red-team/references/loop-budget.md`, `skills/war-strategy/references/plan-interview.md` — plus
   the 5 `agents/*.md` cards. A `grep -rF 'docs/specs'` over all 13 returns zero hits (re-verified at
   conversion), and the mandatory manual same-scope survey of the 13 files' headings/comments/prose (run
   at conversion: a targeted scan for decorated and reworded forms — `design.md`, "the YYYY-MM-DD design",
   "design notes" shapes) found no straggler either — zero survey-derived corrections at authoring time.
4. **Finding 10's coupling constraint is real, reproduced at conversion** (verified: direct function probe
   at conversion 2026-08-12, running the suite's own `claimedVerbs`/extractors over the 13 unscanned
   surfaces): `skills/war/references/schemas.md` phrases `war-config.mjs` immediately followed by its
   export `resolveGate` — extracted as a claimed verb against `war-config.mjs`'s **empty-by-design** verb
   set → a false red if that file were blanket-enumerated. The same probe shows the only other claimed
   verbs among the 13 are `plan-interview.md` → `query` [resolves] and `agents/war-worker.md` → `query`
   [resolves]; the remaining ten surfaces phrase no claimed verb at all. This grounds the decoupled-corpus
   + `VERB_SCAN_EXCLUSIONS` design (D1/D2/D9), matching the pre-existing corpus comment that
   contract/design references legitimately name module EXPORTS beside module filenames.
5. **Finding 4 — glossary contradiction, unrecorded supersession** (verified: issue #1358 (2026-08-06);
   confirmed live at conversion: `CONTEXT.md`'s **Spec-truth guard** entry — under
   `### Gate composition & spec-truth guards (ADR 0036)` — still describes a per-claim doc-contract row
   locking `docs/specs/` code-fact sentences to current mechanics, a "defined-but-not-yet-emitted slice"
   by its own text, while ADR 0046 ratifies the opposite (specs are never updated); neither the entry nor
   ADR 0046's `## Relationship to prior ADRs` section records the supersession — the section names
   0044/0042/0025 only, and `grep -c 'Spec-truth' docs/adr/0046-*.md` → 0 at conversion).
6. **Finding 7 — no SKILL.md floor** (verified: issue #1358 (2026-08-06)): the membership loop pins no
   readdir-derived `SKILL.md` path; if the `skills/` readdir ever stopped yielding SKILL.md files, the
   `docs.length > 0` floor would pass on the enumerated entries alone and the scan would silently drop
   every SKILL.md.
7. **Finding 9 — composite-emphasis escape, reproduced at conversion** (verified: issue #1358
   (2026-08-06); reproduced by direct function probe against the live `specCitations` at conversion
   2026-08-12): the bold-wrapping-a-code-span form (`` see **`docs/specs/2026-01-01-x-design.md`** §3 ``)
   returns **0** findings, the bold-link composite returns **0**, plain bold returns **1** — the `[<*…]`
   carve-out tests the whole whitespace-free run, and the paired-emphasis trim fires only when the char
   immediately before the match opens the emphasis. No fixture pins either composite form (confirmed in
   the live carve-outs test).
8. **#1358 findings 2/3/5/6/8 — already fixed at `2ba7f0a`** (verified: live tree at conversion
   2026-08-12: `CLAUDE.md` carries no ADR-range literal — the greps in the header paragraph — and the
   suite carries no `WAR_CAMPAIGN_LEGACY` constant, with the carve-outs test instead pinning the
   retired war-campaign citation's resurrection as flagged). Citation-only closure; no work here.
9. **The glossary-cold.md interaction and the `CONTEXT.md` budget** (verified: plan 5/6 committed texts +
   live measurements at conversion). Plan 5 creates `skills/war/references/glossary-cold.md` — inside this
   plan's `skills/*/references/*.md` scan pattern — by moving three `CONTEXT.md` entry bodies there
   byte-identical. Two consequences: (i) the **posterity scan** picks it up automatically (scan-derived —
   valid at both pre- and post-plan-5 bases) and it is green by construction: all five `docs/specs` tokens
   in `CONTEXT.md` at conversion sit outside every eviction-candidate entry (three inside the Spec-truth
   guard entry itself — bare-directory and glob forms, carved by pattern — plus the input-shape line and
   the stacked-branch pathspec line), so the moved bodies carry none; (ii) the **partition census** must
   place it at a post-plan-5 base — the conversion probe of the candidate bodies shows no shell-out prose
   for any of the four scanned modules (the one module-ish mention is `land-decision.mjs`, not a scanned
   module), so it lands in `VERB_SCAN_EXCLUSIONS` (D10). Budget: `CONTEXT.md` measures 114,449 B at
   conversion (above the 111,616 B warning-only advisory; hard 126,976 B); plan 5's Task 1.1 shrinks it to
   ≤ 111,616 B at its own land, plan 6's ≤ ~450 B rows land before plan 5 per its grill-ratified
   roadmap hint (absorbed by plan 5's re-measure); this plan's ≤ ~1.2 KB of additions land after plan 5's
   shrink and may re-cross the advisory line by that margin — a logged warning, never a failure, per the
   budget suite's stated semantics, honestly extending plans 5/6's arithmetic (A5).
10. **Downstream spine: none.** No remaining unconverted 2026-08-06 spec declares a `dependsOn` onto this
    group (verified: zero `doc-cli-consistency` mentions across all six sibling spec texts at conversion
    2026-08-12; `adr-doc-truth-sweep`'s §8 names `war-strategy-mirror-guards`, `gate2-publication-guard`,
    and `shell-pin-helpers` only). Two siblings will later write surfaces this plan's guard scans —
    `references-pointer-integrity` (agent cards, plus one additive `CONTEXT.md` term) and
    `adr-doc-truth-sweep` (`README.md`) — content-disjoint from this plan's edits; their diffs simply run
    under the landed guard (roadmap contention rows, no spine edge).

## Pivotal constraints

1. **ADR 0025 drift-guard discipline**: extraction + equality, fail-closed; a corpus that can be silently
   narrowed by an in-file edit is the recorded defect class, not a guard.
2. **The verb-rule corpus cannot be blanket-widened**: `schemas.md`'s `resolveGate` false red is
   probe-reproduced (Context 4). Whatever widens the posterity scan must leave the verb scan's membership
   a conscious, per-file decision.
3. **ADR 0046's own "The guard." bullet describes the corpus mechanics** — the corpus change must amend
   that description in the same landing wave or the ADR asserts a stale mechanism (doc cascade; Task 1.3).
4. **ADR amendment discipline, two channels**: the ratified decision sentences (the bolded posterity rule)
   stay byte-unchanged; the Relationship row is an append; the guard-bullet's corpus description is a
   *mechanics currency* update — the established in-place channel for factual descriptions the code has
   moved under (plan 5 constraint-4 precedent), carrying a dated parenthetical; the Status currency header
   line is exempt from any byte-freeze reading (the recorded
   adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line lesson).
5. **`CONTEXT.md` is contended and budgeted**: construct-disjointness per the header analysis; additions
   stay tight (≤ ~1.2 KB combined, A5) and introduce no swept token — of `war-config.test.mjs`'s
   enumerated OLD-absent sweeps, only the `_polish` sweep lists `CONTEXT.md` (its needle there: the
   `_polish` token; verified at conversion 2026-08-12); avoid it, and — safe direction — the sibling
   sweeps' needle shapes too (`docs/learnings/*`, the `docs/learnings/phase-<N>.md` aggregate shape)
   even though those sweeps do not read `CONTEXT.md` (trivially satisfied; state it in the done report).
6. **Legitimate carve-outs must survive the tightened test**: red-team's design-glob forms, war-machine's
   glob and placeholder forms, survey-corps' slug/date placeholders, and the README bare-directory mention
   all carry their `*` / `<` / `…` inside the path segment itself (verified: issue #1358 finding 9's
   auditor pre-check (2026-08-06)); the existing fixture set encodes them and stays byte-unchanged.
7. **The D5 fix is order-sensitive** (conversion trace, Note 3): the existing trailing-punctuation trim
   runs first, then the new path-segment truncation at the first backtick / `]` / `)` delimiter, then the
   existing conditional paired-emphasis peel (keyed on the pre-match character) — this order keeps every
   existing fixture green by trace (the unpaired glob keeps its `*` inside the segment; the bold-link
   composite is caught by truncation + peel) while flagging both composite forms.
8. **Grep is a floor**: every token-sweep step below pairs with a mandatory manual same-scope
   title/comment survey; stragglers land as survey-derived corrections.
9. **Platform law (BSD grep)**: any check grep whose pattern contains `$`, `"`, or a backslash uses
   `grep -F` or correct escaping; the `docs/specs` sweeps below use `-F` (execute-your-literals — the
   batch has caught two BSD false-reds already).
10. **Census snapshots are dated**: the D9 exclusion list and every count here (22/14/8/5, the
    `must be flagged` count of 8) are dated snapshots at conversion; the implementing worker re-runs the
    census at its dispatch base and places any references file added since (A7).
11. Node ≥ 24; the suite runs under `node --test` with no package.json.

## Resolved design tree

| # | Decision | Resolution | Source |
|---|----------|------------|--------|
| D1 | Corpus topology | **Decouple.** The verb rule keeps readdir-derived `skills/*/SKILL.md` + the enumerated `EVICTION_DESTINATIONS`. The spec-posterity rule gets its own **directory-scanned posterity corpus**: every `skills/*/SKILL.md`, every `skills/*/references/*.md`, every `agents/*.md`, plus `README.md` — membership readdir-derived (never an editable in-file list), reads unguarded, no `existsSync` on any member | spec §3 D1; (verified: issue #1358 finding 10 (2026-08-06)) |
| D2 | Membership guard semantics (#1368) | **Default-deny partition census**: the sorted union of `EVICTION_DESTINATIONS` and a new per-entry-reasoned `VERB_SCAN_EXCLUSIONS` constant must `deepEqual` the sorted directory scan of `skills/*/references/*.md`, with the two lists asserted disjoint. Removing any entry, or adding a references file without placing it, goes red; the failure message names the unplaced/removed path and says which list to extend and why | spec §3 D2; (verified: issue #1368's prescribed fix shape (2026-08-06)) |
| D3 | SKILL.md floor (finding 7) | Sentinel membership asserts, not a count literal: the posterity corpus must include one readdir-derived SKILL.md path (`skills/war/SKILL.md`), one agent card (`agents/war-worker.md`), `skills/war-strategy/references/plan-interview.md`, and `README.md` | spec §3 D3 (carried [assumed] row → A1) |
| D4 | plan-interview.md placement (#1306) | Into `EVICTION_DESTINATIONS` (verb-scanned; `query` probe-resolves at conversion), not the exclusion list — the file's whole exposure is its CLI command; a comment cites #1306 | spec §3 D4; (verified: probe at conversion 2026-08-12) |
| D5 | Composite-emphasis fix (finding 9) | Apply the `[<*…]` and `yyyy` carve-out tests to the **path segment only** — after the existing trailing-punctuation trim, truncate the captured run at the first backtick, `]`, or `)` delimiter, then run the existing conditional paired-emphasis peel (constraint 7's order) — and add fixtures: composite bold+code must yield exactly 1, bold-link composite must yield ≥ 1, each new fixture's assertion message carrying the literal `must be flagged` (the suite's message convention — End state 3's growth grep counts exactly that literal) | spec §3 D5; (verified: 0/0/1 probe reproduction at conversion 2026-08-12) |
| D6 | `CONTEXT.md` Spec-truth guard entry (finding 4) | Supersede in place: a dated supersession note **as the first body line of the entry** (immediately after the `**Spec-truth guard**:` heading line, so End state 8's `-A8` grep window reads it) — the slice was never emitted and ADR 0046's posterity rule retires its premise — keeping the entry below it for archaeology; no deletion | spec §3 D6 (+ D13 placement, conversion judgment) |
| D7 | ADR 0046 amendment | One appended row in `## Relationship to prior ADRs` retiring the ADR 0036-era Spec-truth-guard glossary mechanism (never emitted; superseded by the posterity rule); the "The guard." Decision bullet's corpus description updated in place to the decoupled scan (posterity corpus directory-scanned; verb corpus enumerated + placement census) with a dated parenthetical; Status line notes the amendment date. All other pre-existing body text byte-unchanged (constraint 4). OLD-absent: the bullet's retired sentence fragment `hand-enumerated list could not see` gone (1 hit at conversion → 0) | spec §3 D7 + amendment-discipline precedent |
| D8 | Agent cards in the verb scan | No — posterity scan only (`agents/war-worker.md`'s `query` would resolve green, probe-verified, but the verb rule's corpus stays as-is this change) | spec §3 D8 (carried [assumed] row → A2) |
| D9 | Exclusion-list contents at land | The seven unenumerated references files of Context 3, each with a one-line reason comment: `schemas.md` = the probe-verified export-naming false red (resolveGate); the other six = no shell-out prose for the scanned modules (probe-verified zero claimed verbs at conversion). Dated snapshot — land-time re-census per constraint 10 | spec §3 D9; (verified: probe census at conversion 2026-08-12) |
| D10 | glossary-cold.md placement (post-plan-5 base) | Into `VERB_SCAN_EXCLUSIONS`, reason: evicted `CONTEXT.md` glossary bodies — incident/recovery doctrine, no shell-out prose for the scanned modules (conversion probe, Context 9). The worker re-verifies at its rebased base: if the landed bodies do phrase a scanned module's command, place in `EVICTION_DESTINATIONS` instead and say so in the done report. At a pre-plan-5 base (standalone run) the file does not exist and the scan-derived census correctly omits it | conversion judgment (Context 9), logged for /red-team |
| D11 | Lesson stamp (#1368's mined lesson) | Fold into Task 1.1 (the batch fold-into-fixing-task precedent, operator-mandated — a conscious deviation from the spec's "servitor housekeeping" non-goal, Note 1): prefix the `description` of `docs/learnings/archive/enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed.md` with `RESOLVED (doc-cli-consistency-corpus/1.1, #1368): …` — body/keywords otherwise untouched per the resolved-lesson-stamp convention; redaction lint must stay green | operator batch directive; A6 |
| D12 | Task decomposition | Three file-disjoint wave-1 tasks in Phase 1 — Task 1.1 the suite + lesson stamp (one file carries #1368 + #1306 + findings 1/7/9/10: the same-file rule forbids splitting); Task 1.2 `CONTEXT.md`; Task 1.3 ADR 0046 — plus the standard trailing release phase. No deps edges: no mechanical guard here reads a sibling task's file (the suite scans neither `CONTEXT.md` nor `docs/adr/`, verified at conversion), so rule 7 does not bind; the ADR/glossary prose describing Task 1.1's mechanics is authored from this plan's Part 1 (defined-but-not-yet-emitted; produced in Task 1.1 — the plan-5 Task-1.5 precedent), not from the landed diff | conversion judgment; war-strategy §3 |
| D13 | Census asymmetry is stated intent | The census test's comment states the deletion asymmetry: a deleted references file silently leaves the scan-derived posterity corpus (a deleted file is no live surface — by design), while deletion of an enumerated verb-list entry still throws via unguarded `readFileSync` **and** reds the census — so the asymmetry reads as intent, not oversight | spec §8 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | Sentinels beat a count floor (D3) — count literals rot under file churn | spec §3 D3 (carried [assumed] row) | a whole *family* silently drops while its sentinel survives — add a family-count floor beside the sentinels | End state 5; ratify in /red-team |
| A2 | Verb scan stays unwidened to agent cards (D8) — minimal diff | spec §3 D8 (carried [assumed] row) | a card's CLI command rots silently — a later one-line widening adds the cards | End state 5's sentinel keeps the card posterity-scanned meanwhile; ratify in /red-team |
| A3 | Amending ADR 0046 suffices; no new ADR | spec §7 (carried [assumed] row) — the change is guard mechanics inside its existing Decision, not a new binding decision | a short ADR "posterity corpus is scan-derived" supersedes the guard bullet instead | ratify in /red-team |
| A4 | Plan 5 has LANDED before any task of this plan dispatches (campaign path) | the spec §8 ordering declaration + plan 5's committed Note 5 naming this group downstream; the roadmap sequences plan 5 ahead (ADR 0011); the survey manifest is not in this worktree — the two committed artifacts are the source | none fatal: every scan/census construct is base-agnostic by design (D1/D2 scan-derived; D10's placement is re-censused) — the only effect of a pre-plan-5 base is `glossary-cold.md`'s absence from the census and this plan's `CONTEXT.md` bytes landing before the shrink | the worker's land-time re-census (D10); standalone fallback = plain re-census, never halt (Note 2) |
| A5 | This plan's `CONTEXT.md` additions stay a warning-only budget event | Context 9's arithmetic: post-plan-5 base ≤ 111,616 B + ≤ ~1.2 KB here → possible advisory re-cross by that margin; advisory = logged warning, never a failure (the budget suite's stated semantics); hard 126,976 B not approachable | tighten the wording; the supersession note is the load-bearing half, the two terms can compress | End state 8's budget-suite run; `wc -c` recorded in the done report at the rebased base |
| A6 | The lesson stamp is in-scope for the fixing task (D11) | the operator's batch directive (fold-into-fixing-task precedent, plans 6/7 house shape); the spec's non-goal is consciously overridden (Note 1) | operator/red-team vetoes the stamp → drop the lesson file from Task 1.1's `Files:`; #1368 still closes on the code fix | End state 10's grep; ratify in /red-team |
| A7 | The D9 seven-entry exclusion list + D10's eighth entry is the complete census delta at land | conversion census at 2026-08-12 (22 references files; plan 5 adds the 23rd; no other committed plan creates or deletes a `skills/*/references/*.md` file — verified against the seven `- Files:` lists) | a references file added by an intervening land goes red in the census — exactly the designed friction; the worker places it with a reason | the census test itself (default-deny); constraint 10's re-census duty |

## Non-goals / deferred

- **No blanket markdown/AST parser** over doc surfaces — ADR 0046's rejected ceiling stands; the
  posterity rule stays a regex sweep with pattern carve-outs.
- **Verb-scanning `agents/*.md`** — deferred (D8/A2).
- **`skill-doc-contracts.test.mjs` untouched**: the Spec-truth-guard slice was never emitted, so there are
  no rows to remove (verified: issue #1358 finding 4 (2026-08-06)); the supersession is doc-only.
- **#1358 findings 2/3/5/6/8** — fixed at `2ba7f0a` (re-verified at conversion, header paragraph);
  citation-only closure at the checkpoint, no work here.
- **No edit to `skills/war-strategy/references/plan-interview.md`** — it enters both scans as-is; its
  Stage-0 command is probe-verified correct against the live `VERBS` dispatch.
- **No edit to the eight newly scanned references files or the five agent cards** — the pre-widen sweep
  found zero citations to fix (Context 3); they are scanned, not changed.
- **No `CONTEXT.md` shrink pass here** — the possible advisory re-cross is accepted as warning-only (A5);
  the next shrink signal accrues to a future pass per ADR 0042, never a silent constant raise.
- **No change to the four dispatch-module extractors or the verb-resolution rule's semantics** — the verb
  rule's corpus gains exactly one entry (D4); everything else on that side is unchanged.

## New domain terms · Recommended ADRs

Two terms land in `CONTEXT.md` via Task 1.2 (spec §6, worded there; ≤ ~800 B combined): **Posterity
corpus** — the directory-scanned live-surface set the ADR 0046 citation rule sweeps (every
`skills/*/SKILL.md`, every `skills/*/references/*.md`, every `agents/*.md`, plus `README.md`), derived
from the tree, never from an editable in-file list; *avoid* conflating it with the verb-rule corpus
(enumerated, deliberately narrower). **Verb-scan placement census** — the default-deny partition assert
making every `skills/*/references/*.md` file either verb-scanned (`EVICTION_DESTINATIONS`) or
reason-excluded (`VERB_SCAN_EXCLUSIONS`); a new references file is red until consciously placed; *avoid*
"exclusion" as suppression — an excluded entry carries a stated reason and is still posterity-scanned.
No new ADR — amend ADR 0046 per D7 (A3).

## Commander's Intent

- **Purpose:** the spec-posterity rule sweeps every doctrine surface ADR 0046 names — all SKILL.md files,
  all references files, all agent cards, and the README — from a corpus derived from the tree, so no
  in-file edit can silently narrow it; every `skills/*/references/*.md` file is a conscious, reasoned
  member of the verb scan or a reasoned exclusion, and an unplaced newcomer is red by default; the
  composite-emphasis escapes are closed with the legitimate carve-outs intact; the doctrine record is
  coherent — the never-emitted Spec-truth-guard glossary mechanism is recorded superseded, and ADR 0046
  describes the corpus its guard actually scans.
- **Method:** decouple the two corpora in `skills/_shared/doc-cli-consistency.test.mjs` — the verb rule
  keeps its enumerated list (plus `plan-interview.md`, whose `query` command probe-resolves today), the
  posterity rule gets a directory-scanned corpus with unguarded reads and sentinel floors instead of a
  membership list; bind the references-file partition with a default-deny census (`deepEqual` of the
  sorted scan against the sorted disjoint union of `EVICTION_DESTINATIONS` and a per-entry-reasoned
  `VERB_SCAN_EXCLUSIONS`, failure message naming the unplaced path and the placement duty, deletion
  asymmetry stated as intent); fix `specCitations` by applying the carve-out tests to the path segment
  only (trim → truncate at the first backtick / `]` / `)` → conditional paired-emphasis peel), pinning
  both composite forms as new fixtures with every existing fixture byte-unchanged; record the
  supersession in `CONTEXT.md` (dated note atop the Spec-truth guard entry) and amend ADR 0046
  (Relationship row appended, guard-bullet mechanics updated in place, Status line dated); stamp the
  mined lesson RESOLVED in the fixing task; land after plan 5 on the campaign path with a land-time
  re-census placing `glossary-cold.md`, and re-census identically on any base standalone.
- **End state:**
  1. The doc-cli-consistency suite passes at the landed tip ·
     check: `node --test skills/_shared/doc-cli-consistency.test.mjs`.
  2. Deleting any single `EVICTION_DESTINATIONS` entry in a throwaway worktree reds the partition
     census, and an unplaced probe file `skills/war/references/zz-census-probe.md` reds it naming that
     path · check: two mutation probes — remove one entry, run the suite, expect nonzero exit; create
     the probe file, run the suite, expect nonzero exit with the path in the message (uncommittable
     runs — done-report evidence, backstop row).
  3. `specCitations` on a bold-wrapped code-span citation returns exactly one finding, and the bold-link
     composite returns at least one · check: `grep -c 'must be flagged'
     skills/_shared/doc-cli-consistency.test.mjs` grows by the two D5 fixtures (8 → 10, dated snapshot at
     conversion), and the suite passes · manual same-scope survey: hand-scan the suite's same-scope
     tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
     survey-derived correction.
  4. Every pre-existing legitimate carve-out fixture stays green with its fixture lines byte-unchanged ·
     check: `git diff` over the carve-outs test shows additions only among fixtures; suite passes.
  5. The posterity corpus includes a readdir-derived SKILL.md path, `agents/war-worker.md`,
     `skills/war-strategy/references/plan-interview.md`, and `README.md` (the D3 sentinels) ·
     check: `grep -n 'agents/war-worker.md' skills/_shared/doc-cli-consistency.test.mjs` · manual
     same-scope survey: hand-scan the suite's same-scope tests/comments for same-meaning reworded
     siblings the grep misses; list stragglers as survey-derived corrections.
  6. `EVICTION_DESTINATIONS` contains `skills/war-strategy/references/plan-interview.md` ·
     check: `grep -n 'plan-interview.md' skills/_shared/doc-cli-consistency.test.mjs` · manual same-scope
     survey: hand-scan the suite's same-scope tests/comments for same-meaning reworded siblings the grep
     misses; list stragglers as survey-derived corrections.
  7. Renaming the `query` verb inside `war-memory.mjs`'s `VERBS` object in a throwaway worktree makes the
     verb rule flag `plan-interview.md`'s recon command as unresolved · check: mutation probe — rename
     the verb, run the suite, expect nonzero exit (uncommittable — done-report evidence, backstop row).
  8. `CONTEXT.md`'s Spec-truth guard entry opens with a dated supersession note naming ADR 0046 and the
     never-emitted status, and the file stays inside its hard budget ·
     check: `grep -A8 'Spec-truth guard' CONTEXT.md | grep -c '0046'` ≥ 1 and
     `node --test skills/war/assets/prompt-surface-budgets.test.mjs` (advisory re-cross is warning-only,
     A5; record `wc -c CONTEXT.md` in the done report) · manual same-scope survey: hand-scan the entry's
     subsection and glossary neighbors for sibling claims still presenting the doc-contract-row mechanism
     as live; list stragglers as survey-derived corrections.
  9. ADR 0046's Relationship section carries a row retiring the ADR 0036-era Spec-truth-guard glossary
     mechanism, and its guard bullet describes the decoupled corpus ·
     check: `grep -c 'Spec-truth' docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`
     ≥ 1 and `grep -c 'hand-enumerated list could not see'
     docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md` = 0 · manual same-scope
     survey: hand-scan the ADR's full body for sibling sentences still describing the old coupled corpus;
     list stragglers as survey-derived corrections.
  10. The mined lesson is stamped RESOLVED citing #1368, and the redaction lint passes over
      `docs/learnings/` ·
      check: `grep -cF 'RESOLVED' docs/learnings/archive/enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed.md`
      ≥ 1 and `node skills/_shared/war-memory.mjs lint docs/learnings/`.
  11. The pre-widen sweep is recorded: `grep -rF 'docs/specs'` over the 13 newly scanned surfaces returns
      zero hits (zero at conversion), and the mandatory manual same-scope hand-scan of the 13 files'
      headings/comments/prose for decorated or reworded spec references is run and its outcome recorded
      even when zero stragglers · check: done-report evidence (backstop row).
  12. The full gates are green at the integrated tip ·
      gate: the self-discovery gate (`resolveGate` in `war-config.mjs`) — `node --test
      'skills/**/*.test.mjs'`, the documented hooks/skills shell-test loop, and the redaction-lint
      wrapper all pass.
  13. Every plan-tracked issue is cited by at least one commit in the phase range `<phase-base>..<tip>` — #1368 and #1306 for Task 1.1 (plus #1358 findings
      1/7/9/10), #1358 for Tasks 1.2/1.3; the citation-only closures (#1358 findings 2/3/5/6/8 via
      `2ba7f0a`) are cited in the phase-close checkpoint notes, no code change ·
      HARD at audit_sha (git log between the phase base and the tip; execution-evidence seat). **Range-level, not per commit** — judged by the execution-evidence seat via `git log --grep=<issue> <phase-base>..<tip>`; the engine-authored **phase-merge** commit and the **phase-close polish** commit cite no issue *by construction* and are compliant. The range does not exist at any task's pre-merge gate, so this can never be a `gate:` member. Ratified lesson: `each-commit-cites-its-issue-endstates-are-judged-over-the-full-phase-range-not-gated-per-commit`. *(Normalized 2026-08-16 by the campaign-wide sweep — the original per-commit phrasing caused a false escalation in plan 6 and was corrected again in plan 7.)*
  14. Release: all four version slots move lock-step to the next free patch above the live integration
      base at land time ·
      check: `node --test skills/war/assets/version-slots.test.mjs` (lock-step + monotonic floor; the
      bump's presence is judged at audit_sha — the suite cannot fail on a wholly absent release).

## Build order (for /war)

Phase 1 (wave 1 = Tasks 1.1, 1.2, 1.3 — file-disjoint, no deps edges per D12: no mechanical guard in any
task reads a sibling task's file, and the doc prose describing Task 1.1's mechanics is authored from this
plan's Part 1, defined-but-not-yet-emitted) → Phase 2 (release).

## Phase 1 — Decouple, census, carve-out fix, supersession record

### Task 1.1: The suite — posterity corpus, partition census, sentinels, +1 row, carve-out fix, lesson stamp (#1368, #1306; #1358 findings 1/7/9/10)

- Files: `skills/_shared/doc-cli-consistency.test.mjs`, `docs/learnings/archive/enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed.md`
- Plan slice: **Re-census first (constraint 10 / A7)** — re-run the references-file census at the
  dispatch base (`ls skills/*/references/*.md`); at a post-plan-5 base it includes
  `skills/war/references/glossary-cold.md` (D10); place every file not in the conversion snapshot with a
  reason, reporting the deltas. **Posterity corpus (D1)** — new `posterityCorpus()` construct: per-skill
  directory scan (each `skills/<name>/` dir's readdir-listed `SKILL.md` and its `references/*.md`
  members — membership readdir-derived, a skill dir without `references/` or `SKILL.md` is normal and
  skipped), plus `agents/*.md`, plus `README.md`; all reads unguarded `readFileSync` (a scanned path that
  vanishes between scan and read throws); redefine `specRuleCorpus` onto it (or retire it in its favor);
  **replace** the three-path membership loop with the D3 sentinel asserts (`skills/war/SKILL.md`,
  `agents/war-worker.md`, `skills/war-strategy/references/plan-interview.md`, `README.md`). **Partition
  census (D2/D13)** — new census test: derive the references-file set from the same directory scan;
  assert `deepEqual` of its sorted form against the sorted union of `EVICTION_DESTINATIONS` and the new
  `VERB_SCAN_EXCLUSIONS`; assert the two constants disjoint; the failure message names the
  unplaced/removed path and says which list to extend and why (census friction is the point); the test
  comment states the deletion asymmetry (D13) so it reads as intent. **`EVICTION_DESTINATIONS` +1
  (D4)** — add `skills/war-strategy/references/plan-interview.md` with a comment citing #1306 (`query`
  probe-resolves; no edit to the doctrine file itself). **`VERB_SCAN_EXCLUSIONS` (D9/D10)** — the seven
  Context-3 leftovers, one reason comment each (`schemas.md`: the probe-verified export-naming false
  red — `resolveGate` beside `war-config.mjs`, whose verb set is empty by design; the other six: no
  shell-out prose for the scanned modules), plus `glossary-cold.md` at a post-plan-5 base (reason:
  evicted `CONTEXT.md` glossary bodies, incident/recovery doctrine — re-verify no scanned-module
  shell-out prose at the rebased base, else move it to `EVICTION_DESTINATIONS` and say so). Reason
  comments are descriptive and never restate a grep pattern's bytes (the coupling-comment self-match
  lesson); in particular, when reworking the corpus comment block, mind its near-sibling phrase
  `could not previously see` (the plan-2026-08-05 widening note) — never rework it into the ADR's
  retired fragment bytes (`hand-enumerated list could not see`): End state 9's OLD-absent grep is
  deliberately file-scoped to the ADR, and the suite must not grow a byte-run a future repo-wide sweep
  of that fragment would double-count. **Carve-out fix (D5, constraint 7's order)** — in `specCitations`, after the existing
  trailing-punctuation trim, truncate the captured run at the first backtick / `]` / `)` delimiter, then
  apply the existing conditional paired-emphasis peel, then run the `[<*…]` / `yyyy` carve-out tests on
  that path segment; add the two fixtures to the carve-outs test — composite bold+code
  (`` see **`docs/specs/2026-01-01-x-design.md`** §3 ``) must yield exactly 1, bold-link composite must
  yield ≥ 1, and each new fixture's assertion message carries the literal `must be flagged` (the
  suite's message convention; End state 3's 8 → 10 growth grep counts exactly that literal) — with
  every existing fixture line byte-unchanged and green (End state 4's diff check).
  **Pre-widen sweep (End state 11)** — before wiring the scan: `grep -rF 'docs/specs'` over the 13 newly
  scanned surfaces (expected zero, zero at conversion), then the mandatory hand-scan of each file's
  headings/comments/prose for decorated or reworded spec references the token grep cannot see; list each
  straggler as a survey-derived correction and record the outcome even when zero. **Mutation probes
  (End states 2/7, backstop rows)** — in a throwaway worktree/scratch copy: (a) delete one
  `EVICTION_DESTINATIONS` entry → census red; (b) create `skills/war/references/zz-census-probe.md`
  unplaced → census red naming the path; (c) rename `query` in `war-memory.mjs`'s `VERBS` → verb rule
  flags `plan-interview.md`; record all three reds in the done report; never leave probe residue (the
  red-team sandbox-residue lesson — probes live in throwaway copies, cleaned after). **Lesson stamp
  (D11/A6)** — prefix the lesson's `description` with `RESOLVED (doc-cli-consistency-corpus/1.1,
  #1368): `, body/keywords otherwise untouched (the resolved-lesson-stamp convention: the body's
  present-tense prose survives deliberately); redaction lint green. Commits cite #1368, #1306, #1358.
- Done when: `node --test skills/_shared/doc-cli-consistency.test.mjs`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.2: CONTEXT.md — supersession note + the two corpus terms (#1358 finding 4)

- Files: `CONTEXT.md`
- Plan slice: **Supersession note (D6)** — in the **Spec-truth guard** entry (under
  `### Gate composition & spec-truth guards (ADR 0036)`), insert a dated supersession note as the first
  body line after the `**Spec-truth guard**:` heading line (placement is load-bearing for End state 8's
  `-A8` window): the slice was never emitted, and ADR 0046's posterity rule (specs are never updated)
  retires its premise — a per-claim row could stay green only by editing a frozen spec; the entry below
  is kept for archaeology, byte-unchanged — no deletion. **New terms (spec §6)** — add **Posterity
  corpus** and **Verb-scan placement census** as two additive entries in the same subsection
  neighborhood, worded per the New-domain-terms section above (each with its `_Avoid_` contrast);
  additive only — no existing entry's bytes move beyond the one inserted note line. Constraint 5's
  pin-safety duty: introduce no swept-token shape (no `node …*.sh` invocation, no `docs/learnings/*`
  literal, no `_polish` token — state it in the done report), and keep the combined delta ≤ ~1.2 KB
  (A5); re-measure `wc -c CONTEXT.md` at the rebased base and record it (the advisory re-cross, if any,
  is a logged warning — never a failure). Sibling-plan honesty: plan 5's evicted entries and plan 6's
  added rows are other constructs (header analysis) — touch neither. Run End state 8's grep + hand-scan
  and record the outcome even when zero stragglers. Commit cites #1358 (finding 4's close condition
  requires the citation).
- Done when: None — glossary-only edit; the mechanical pins are End state 8's greps plus the budget
  suite (`prompt-surface-budgets.test.mjs`, a discovered gate member).
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 1.3: ADR 0046 amendment — Relationship row, guard-bullet currency, Status date (#1358 finding 4)

- Files: `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`
- Plan slice: **(D7, constraint 4's two channels)** — append one row to
  `## Relationship to prior ADRs`: the ADR 0036-era **Spec-truth guard** glossary mechanism (a per-claim
  `skill-doc-contracts.test.mjs` row locking `docs/specs/` code-fact sentences to current mechanics) was
  never emitted and is retired by this ADR's posterity rule — its premise (landed specs track reality)
  is the exact posture this ADR rejects; the `CONTEXT.md` entry carries the supersession note. Update
  the "The guard." Decision bullet's corpus description in place to the decoupled scan — the
  spec-posterity rule sweeps the directory-scanned posterity corpus (every `skills/*/SKILL.md`, every
  `skills/*/references/*.md`, every `agents/*.md`, plus `README.md`), while the verb rule keeps its
  enumerated corpus bound by the default-deny placement census — with a dated parenthetical marking the
  amendment (mechanics-currency channel: the guard bullet describes the guard, and the guard moved; the
  bolded ratified decision sentence and every other pre-existing body line stay byte-unchanged). Note
  the amendment date on the Status line (exempt from byte-freeze). OLD-absent: the retired fragment
  `hand-enumerated list could not see` is gone from the file (End state 9). This prose is authored from
  this plan's Part 1 — the mechanics are defined-but-not-yet-emitted at the wave-1 base; produced in
  Task 1.1 (D12). Run End state 9's greps + the mandatory hand-scan of the ADR's full body for sibling
  old-corpus descriptions; record the outcome even when zero stragglers. Commit cites #1358.
- Done when: None — prose-only ADR amendment; the mechanical pins are End state 9's greps.
- requiresTest: false
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
  sequenced predecessors — at minimum `2026-08-06-verdict-adjudication-integrity` (plan 5, this plan's
  declared upstream, A4) — have landed their own release phases (ADR 0011 stack-and-plow; N stacked
  unlanded releases lag main cumulatively, so resolve from the slots at the actual base, never from
  memory). Standalone fallback: run through plain `/war`, resolve the next free patch from the four
  slots themselves. The Status blurb names the scan-derived posterity corpus, the default-deny
  placement census, and the composite-emphasis carve-out fix — quoting only identifiers that exist in
  the landed diff (release-blurb lessons: count words match the enumeration; quoted literals byte-match
  landed identifiers — `VERB_SCAN_EXCLUSIONS` only if that exact name lands; guard semantics stated no
  wider than the implementation — the posterity rule sweeps its scanned corpus, it does not scan the
  whole repo, and the README itself is inside that corpus, so the blurb must not introduce a concrete
  `docs/specs/` citation).
- Done when: `node --test skills/war/assets/version-slots.test.mjs`
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- The three mutation probes (End states 2 and 7: entry-deletion census red, unplaced-probe-file census
  red with the path named, verb-rename false-red trace) · why deferred: mutation runs are uncommittable
  by design — the committed census and suite are the standing checks · runner: Task 1.1's worker runs
  all three on throwaway copies, records the reds in the done report, and cleans every probe artifact
  (no `zz-census-probe.md` residue); gate-audit reads them SOFT.
- The manual same-scope survey halves of End states 3, 5, 6, 8, 9, and 11 (including the 13-file
  pre-widen hand-scan) · why deferred: a hand-scan cannot be a mechanical gate member; done-report-only
  evidence, which gate-audit reads as SOFT and never a hold · runner: the owning task's worker (1.1 for
  End states 3/5/6/11, 1.2 for End state 8, 1.3 for End state 9) records each outcome — mandatory
  statement even when "zero stragglers"; the Lead re-runs all the greps at phase close.
- The land-time census placement (D10 and A7: `glossary-cold.md`'s list, plus any references file an
  intervening land added) · why deferred: membership is base-dependent by design; the conversion lists
  are dated snapshots · runner: Task 1.1's worker re-censuses at its rebased base and reports every
  delta from the conversion snapshot; the Lead surfaces the final two-list partition at the phase
  checkpoint before land.
- The A6 lesson-stamp veto · why deferred: operator/red-team may prefer servitor-channel closure (the
  spec's original non-goal) · runner: /red-team ratification; a veto drops the lesson file from
  Task 1.1's `Files:` and #1368 still closes on the code fix.

## Notes / conscious deviations

1. **Lesson stamp folded into Task 1.1** — the spec's Non-goals route it to servitor housekeeping; the
   operator's batch directive mandates the fold-into-fixing-task precedent (plans 6/7 house shape), so
   D11 overrides the spec with A6 carrying the veto fallback. Logged for /red-team ratification.
2. **Standalone fallback is re-census, not witness-halt.** Unlike plans 5–7's predecessor witnesses,
   nothing here consumes a predecessor's constructs: D1/D2 are scan-derived and valid at any base, and
   the only base-dependent datum — `glossary-cold.md`'s census membership — is resolved by the same
   re-census the task runs anyway (D10). A plain-`/war` run at a pre-plan-5 base is therefore fully
   green with a 22-file census and no `glossary-cold.md` row; the `dependsOn` edge stays on the roadmap
   for ADR 0011 spine order and the Context-9 budget sequencing. **Reverse-order residual (designed
   friction — operator-ratified at the /war-machine volley, 2026-08-11):** if this plan lands first standalone and plan 5
   lands later, plan 5's own land goes census-RED on the then-unplaced `glossary-cold.md` — and plan 5's
   committed text carries no placement duty (it predates this census). That red is the census working
   as designed: the failure message names the path and the placement duty, and the remedy is one line —
   plan 5's worker (or its phase-close polish) places the file in `VERB_SCAN_EXCLUSIONS` with the D10
   reason. Campaign order (A4) avoids the state entirely. Logged for /red-team.
3. **The D5 order-of-operations is a conversion-time refinement** of the spec's "truncate … (equivalently:
   peel wrapping decoration from both ends)" framing: trim → truncate-at-first-delimiter → conditional
   paired-emphasis peel. Traced at conversion against every existing fixture (markdown-link one-finding,
   inline-code, case-insensitive, plain bold, italic, unpaired trailing glob, bare directory,
   placeholders, ellipsis, date placeholders, fence pins, the resurrection pin) — all stay green — and
   against both composite escapes — both flag. The plan states the contract (End states 3/4); the worker
   may implement any equivalent that satisfies both fixture sets. Logged for /red-team.
4. **Contention honesty.** `CONTEXT.md`: three committed plans touch it, construct-disjoint (header
   analysis); the roadmap carries the contention row (plans 5, 6, this plan — and downstream
   `references-pointer-integrity` adds a term later, Context 10). `war-config.test.mjs`: plans 5 AND 6
   both edit it (plan 5 Task 1.1 the enumerated `sweptSurfaces` list, plan 6 Task 1.2 the resolveGate
   banner test — disjoint constructs, per their own contention notes); this plan does NOT touch it — but
   its `_polish` sweep enumerates `CONTEXT.md`, hence Task 1.2's no-swept-token duty (constraint 5). `docs/adr/0046-*`: this plan is its only owner across the batch
   (verified: seven committed plans' `- Files:` lines; `adr-doc-truth-sweep`'s surface list names ADRs
   0030/0033/0025/0008/0044 — not 0046). The trailing release-slot overlap with every sibling is the
   sanctioned stacked-release pattern, not contention.
5. **Posterity survivors.** Historical artifacts keep old wordings and are never retro-edited (ADR 0046
   posture — the very rule this plan hardens): the source issues' verbatim finding quotes, the source
   spec, landed plans and red-team reports, and the lesson body's present-tense defect prose under its
   RESOLVED stamp. Every OLD-absent check here is scoped to the single live surface its End state names
   (the ADR 0046 bullet fragment, End state 9).
6. **Spec §10 criteria are carried 1:1 into the End states** with their survey notes kept: criteria
   1–11 → End states 1, 2 (criteria 2+3), 3, 4, 5, 6, 7, 8, 9, 10 (criterion 11's lint + the D11 stamp),
   and 11 (the §4 pre-widen sweep, promoted to an End state so its recording duty is checkable); plus
   the house-standard citation and release End states (13/14) and the full-gates End state (12).
7. **Intent provenance.** Part 1 and the intent block are distilled from the ratified source spec —
   itself synthesized from the code-verified #1368, the one-line #1306, and the war-followup #1358 with
   its auditor-verbatim findings; the spec's flagged [assumed] rows are carried as A1/A2/A3 with their
   fallbacks intact; conversion-time judgments (D10–D13, A4–A7, Notes 1–4) are logged for /red-team
   ratification.

## Open decisions

None. The spec's design tree is fully resolved; the operator-facing points (the A6 lesson-stamp veto,
the D10 placement re-verify, the land-time census partition) are registered as backstop rows, and every
conversion-time judgment is logged above for /red-team ratification.
