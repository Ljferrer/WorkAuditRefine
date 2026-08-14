# Doc-CLI consistency corpus — decoupled posterity scan, default-deny membership census, composite-emphasis carve-out fix
Issues: #1368, #1306, #1358

## 1. Context — the gap / problem

The shared suite `skills/_shared/doc-cli-consistency.test.mjs` carries two rules over one corpus:
the CLI verb-resolution drift guard (plan D11, ADR 0025) and the spec-posterity citation rule
(F7 / ADR 0046). Three defects cluster on that corpus's completeness semantics; all are
future-regression gaps, none is a live falsehood at the current tip.

- The spec-posterity test's corpus membership guard asserts membership for only three paths —
  `README.md` plus the two Task-5.4 widened references files — while the `EVICTION_DESTINATIONS`
  array feeding the same corpus enumerates fourteen entries (verified: issue #1368 (2026-08-06);
  confirmed live in the membership loop inside the `spec-posterity (F7 / ADR 0046)` test, and by
  counting the array, at `6fff2ee` (2026-08-06)). Deleting a listed file fails closed via the
  unguarded `readFileSync`, but silently removing any of the other eleven entries from the in-file
  array narrows both the spec-posterity scan and the original UNION verb scan with the suite green
  (verified: issue #1368 (2026-08-06)). This is a recorded recurrence of the guard-narrowing class
  the lesson `enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed` names
  (verified: issue #1368 (2026-08-06)).
- `skills/war-strategy/references/plan-interview.md` phrases the recon command
  `war-memory.mjs query … --repo docs/learnings` in its Stage-0 block and is absent from
  `EVICTION_DESTINATIONS` (verified: issue #1306 (2026-08-06); confirmed live at `6fff2ee` — the
  Stage-0 fenced block carries the command, and the array holds no war-strategy entry). No live
  falsehood: `query` is a real `VERBS` dispatch case, so adding the row is green today; the
  exposure is a future verb rename rotting the doctrine file's command silently (verified: issue
  #1306 (2026-08-06)).
- Issue #1358 consolidates ten demoted-to-follow-up audit findings from phase-5 task 5.4
  (verified: issue #1358 (2026-08-06)). Five are already fixed at the live tip by the phase-5
  close polish commit `2ba7f0a` — the `CLAUDE.md` ADR-range snapshot literal is retired, and the
  `WAR_CAMPAIGN_LEGACY` split pin is deleted with a resurrection fixture in its place (verified:
  live tree at `6fff2ee` (2026-08-06): `CLAUDE.md` carries no range literal; the test file carries
  no `WAR_CAMPAIGN_LEGACY` constant and its carve-outs test asserts the retired war-campaign
  citation is flagged). Four findings remain live:
  - **Findings 1/10 — corpus subset.** The posterity corpus is the verb corpus plus `README.md`,
    leaving eight live `references/` doctrine surfaces and every `agents/*.md` card unscanned
    (verified: issue #1358 (2026-08-06)). Census at `6fff2ee` (2026-08-06): 22 files match
    `skills/*/references/*.md`, 14 are enumerated, so 8 are unscanned —
    `skills/war/references/auditor-teach.md`, `skills/war/references/gastown-design-params.md`,
    `skills/war/references/refiner-recovery.md`, `skills/war/references/schemas.md`,
    `skills/war/references/worker-servitor-edges.md`, `skills/red-team/references/lenses.md`,
    `skills/red-team/references/loop-budget.md`, `skills/war-strategy/references/plan-interview.md` —
    plus 5 `agents/*.md` cards. A token grep for `docs/specs` over all 13 returns zero hits today
    (verified: live tree at `6fff2ee` (2026-08-06)); per the grep-floor rule a manual same-scope
    survey of those 13 files' headings and comments was also run at authoring time and found no
    decorated or reworded spec references either — zero survey-derived corrections.
  - **Finding 10's coupling constraint is real, not hypothetical.** Blanket-widening
    `EVICTION_DESTINATIONS` also widens the verb scan: a claimed-verb probe over the 13 unscanned
    surfaces at `6fff2ee` (2026-08-06) shows `skills/war/references/schemas.md` phrases
    `war-config.mjs` immediately followed by its export resolveGate — and `war-config.mjs`'s verb
    set is empty by design, so enumerating that file would false-red the verb rule (verified: live
    probe at `6fff2ee` (2026-08-06), matching the pre-existing corpus comment that contract/design
    references legitimately name module EXPORTS beside module filenames).
  - **Finding 4 — glossary contradiction.** `CONTEXT.md`'s **Spec-truth guard** entry (under the
    `### Gate composition & spec-truth guards (ADR 0036)` construct) still describes a per-claim
    doc-contract row locking `docs/specs/` code-fact sentences to current mechanics — a slice that
    was never emitted — while ADR 0046 ratifies the opposite (specs are never updated), and neither
    the entry nor ADR 0046's `## Relationship to prior ADRs` section records the supersession
    (verified: issue #1358 (2026-08-06); confirmed live at `6fff2ee` — the entry's own text says
    "defined-but-not-yet-emitted slice", and the ADR's Relationship section names 0044/0042/0025
    only).
  - **Finding 7 — no SKILL.md floor.** The membership loop pins no readdir-derived `SKILL.md`
    path: if the `skills/` readdir ever stopped yielding SKILL.md files, the `docs.length > 0`
    floor would pass on the enumerated entries alone and the scan would silently drop every
    SKILL.md (verified: issue #1358 (2026-08-06)).
  - **Finding 9 — composite emphasis escape.** `specCitations` applies its `[<*…]` carve-out to
    the whole whitespace-free run, and the paired-emphasis trim fires only when the character
    immediately before the match opens the emphasis — so the composite form
    bold-wrapping-a-code-span (backtick directly before the match) escapes unflagged, as does a
    bold-text markdown link, while plain bold is correctly flagged (verified: issue #1358
    (2026-08-06); reproduced by direct function probe at `6fff2ee` (2026-08-06): composite
    bold+code returns 0 findings, bold-link composite returns 0, plain bold returns 1). No fixture
    pins the composite form (verified: live tree at `6fff2ee` (2026-08-06)).

Issues #1368 and #1358 (findings 1/7/10) demand the same redesign of the same test's corpus
semantics, and #1306 is a one-line addition to the same list — one file, one coherent change.

## 2. Pivotal constraints

- **ADR 0025 drift-guard discipline**: extraction + equality, fail-closed; a corpus that can be
  silently narrowed by an in-file edit is the recorded defect class, not a guard.
- **The verb-rule corpus cannot be blanket-widened**: `skills/war/references/schemas.md` names
  module exports (resolveGate) beside module filenames — probe-verified false red at `6fff2ee`.
  Whatever widens the posterity scan must leave the verb scan's membership a conscious, per-file
  decision.
- **ADR 0046's own "The guard" bullet describes the corpus mechanics**; any corpus change must
  amend that description in the same commit or the ADR asserts a stale mechanism (doc cascade).
- **ADR amendment style**: pre-existing body text stays byte-unchanged; additions are new rows /
  appended notes, and the Status currency line is exempt (repo precedent, recorded in
  `docs/learnings/adr-amendment-byte-unchanged-body-mandate-exempts-status-currency-line.md`).
- **`CONTEXT.md` is contended** with the sibling survey group `verdict-adjudication-integrity`;
  this group's plan lands after it (ordering edge, see §8).
- **Legitimate carve-outs must survive the tightened test**: red-team's design-glob forms,
  war-machine's glob and placeholder forms, survey-corps' slug/date placeholders, and the README
  bare-directory mention all carry their `*` / `<` / `…` inside the path segment itself
  (verified: issue #1358 finding 9's auditor pre-check (2026-08-06)).
- **Grep is a floor**: every token-sweep step below pairs with a mandatory manual same-scope
  title/comment survey; stragglers land as survey-derived corrections.
- Node ≥ 24; the suite runs under `node --test` with no package.json.

## 3. Resolved design tree

| # | Decision | Resolution | Evidence |
|---|----------|------------|----------|
| D1 | Corpus topology | Decouple. The verb rule keeps readdir-derived `skills/*/SKILL.md` + the enumerated `EVICTION_DESTINATIONS`. The spec-posterity rule gets its own **directory-scanned posterity corpus**: all `skills/*/SKILL.md`, all `skills/*/references/*.md`, all `agents/*.md`, plus `README.md` — no `existsSync` guard on any member read. | (verified: issue #1358 finding 10 (2026-08-06)) |
| D2 | Membership guard semantics (#1368) | **Default-deny partition census**: the sorted union of `EVICTION_DESTINATIONS` and a new per-entry-reasoned `VERB_SCAN_EXCLUSIONS` constant must deepEqual the sorted directory scan of `skills/*/references/*.md`, with the two lists asserted disjoint. Removing any entry, or adding a references file without placing it, goes red. | (verified: issue #1368's prescribed fix shape (2026-08-06)) |
| D3 | SKILL.md floor (finding 7) | Sentinel membership asserts, not a count literal: the posterity corpus must include one readdir-derived SKILL.md path (e.g. `skills/war/SKILL.md`), one agent card (e.g. `agents/war-worker.md`), `skills/war-strategy/references/plan-interview.md`, and `README.md`. | [assumed: sentinels over a count floor, because count literals rot under file churn — if wrong: add a family-count floor beside the sentinels] |
| D4 | plan-interview.md placement (#1306) | Into `EVICTION_DESTINATIONS` (verb-scanned; `query` resolves green today), not the exclusion list — the file's whole exposure is its CLI command. | (verified: issue #1306 (2026-08-06)) |
| D5 | Composite-emphasis fix (finding 9) | Apply the `[<*…]` and `yyyy` carve-out tests to the **path segment only** — truncate the captured run at the first backtick, `]`, or `)` delimiter before testing (equivalently: peel wrapping decoration from both ends) — and add fixtures for the composite bold+code form (must yield 1) and the bold-link composite (must yield ≥ 1). | (verified: issue #1358 finding 9 suggested fix (2026-08-06)) |
| D6 | CONTEXT.md Spec-truth guard entry (finding 4) | Supersede in place: append a dated supersession note to the entry — the slice was never emitted and ADR 0046's posterity rule retires its premise — keeping the entry for archaeology; no deletion. | (verified: issue #1358 finding 4 suggested fix (2026-08-06)) |
| D7 | ADR 0046 amendment | Add one row to `## Relationship to prior ADRs` retiring the ADR 0036 Spec-truth-guard glossary mechanism, and update the "The guard" Decision bullet's corpus description to the decoupled scan; Status line notes the amendment date. Pre-existing body text otherwise byte-unchanged. | (verified: issue #1358 finding 4 (2026-08-06)) + amendment-style precedent |
| D8 | Agent cards in the verb scan | No — posterity scan only. (`agents/war-worker.md` phrases `war-memory.mjs query`, which would resolve green, but the verb rule's corpus stays as-is this change.) | [assumed: minimal diff — if wrong: a later one-line widening adds the cards] |
| D9 | Exclusion-list contents at land | The seven remaining unenumerated references files: `skills/war/references/auditor-teach.md`, `skills/war/references/gastown-design-params.md`, `skills/war/references/refiner-recovery.md`, `skills/war/references/schemas.md`, `skills/war/references/worker-servitor-edges.md`, `skills/red-team/references/lenses.md`, `skills/red-team/references/loop-budget.md` — each with a one-line reason comment (export-naming contract/design references, or no shell-out prose). | (verified: live census at `6fff2ee` (2026-08-06); membership is a land-time re-census, the list here is a dated snapshot) |

## 4. Mechanics

**`skills/_shared/doc-cli-consistency.test.mjs`** (one task — every change below shares this file
and cannot be split across parallel tasks):

- New `posterityCorpus()` construct: per-skill directory scan (each `skills/<name>/` dir's
  `SKILL.md` and its `references/*.md` members), plus `agents/*.md`, plus `README.md`. Reads are
  unguarded `readFileSync` (a scanned path that vanishes between scan and read throws). A skill
  directory without a `references/` subdirectory is normal and skipped; the fail-closed floors are
  the D3 sentinel asserts, not `existsSync` on members.
- `specRuleCorpus` is redefined onto `posterityCorpus()` (or retired in its favor); the
  spec-posterity test's three-path membership loop is **replaced** by the D3 sentinel asserts.
- New census test (D2): derive the references-file set from the same directory scan, assert
  `deepEqual` of its sorted form against the sorted union of `EVICTION_DESTINATIONS` and
  `VERB_SCAN_EXCLUSIONS`, and assert the two constants share no entry. The census failure message
  must name the unplaced/removed path so a new references file's author sees the placement duty.
- `EVICTION_DESTINATIONS` gains `skills/war-strategy/references/plan-interview.md` (D4); a
  comment cites #1306.
- New `VERB_SCAN_EXCLUSIONS` constant per D9, one reason comment per entry (the `schemas.md`
  entry's reason is the probe-verified export-naming false red).
- `specCitations` carve-out change per D5, plus the two new fixtures in the carve-outs test; all
  existing fixtures (bold, italic, unpaired glob, placeholder, ellipsis, date, fence pins, the
  war-campaign resurrection pin) stay byte-unchanged and green.
- Pre-widen sweep (worker's first verification, before wiring the scan): `grep -rn "docs/specs"`
  over the 13 newly scanned surfaces — expected zero hits (zero at `6fff2ee`). **Grep is a floor**:
  after the grep, hand-scan each of the 13 files' headings, comments, and prose for decorated or
  reworded spec references the token grep cannot see (emphasis-wrapped runs, prose like "the
  2026-07-01 design"), and list each straggler as a survey-derived correction in the done report.
  The authoring-time survey found none.

**`CONTEXT.md`**: append the D6 supersession note inside the **Spec-truth guard** entry (anchor:
the `### Gate composition & spec-truth guards (ADR 0036)` subsection); no other glossary text
changes in this group's diff. Add the §6 terms in the same touch.

**`docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`**: the D7 amendment —
Relationship row, guard-bullet corpus description, Status currency line.

**`skills/war-strategy/references/plan-interview.md`**: no edit. It enters both scans as-is; its
Stage-0 command is already correct against the live `VERBS` dispatch.

## 5. Surface changes

| File | Change |
|------|--------|
| `skills/_shared/doc-cli-consistency.test.mjs` | posterity corpus scan, partition census, sentinels, `EVICTION_DESTINATIONS` +1, `VERB_SCAN_EXCLUSIONS`, carve-out path-segment fix + fixtures |
| `CONTEXT.md` | Spec-truth guard supersession note; new terms (§6) |
| `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md` | amendment: Relationship row + guard-bullet corpus description + Status line |
| `skills/war-strategy/references/plan-interview.md` | none (newly scanned only) |

## 6. New domain terms (CONTEXT.md)

- **Posterity corpus**: the directory-scanned live-surface set the ADR 0046 citation rule sweeps —
  every `skills/*/SKILL.md`, every `skills/*/references/*.md`, every `agents/*.md`, plus
  `README.md` — derived from the tree, never from an editable in-file list. _Avoid_: conflating it
  with the verb-rule corpus (enumerated, deliberately narrower).
- **Verb-scan placement census**: the default-deny partition assert making every
  `skills/*/references/*.md` file either verb-scanned (`EVICTION_DESTINATIONS`) or
  reason-excluded (`VERB_SCAN_EXCLUSIONS`) — a new references file is red until consciously
  placed. _Avoid_: "exclusion" as suppression — an excluded entry carries a stated reason and is
  still posterity-scanned.

## 7. Recommended ADRs

No new ADR. Amend ADR 0046 per D7 — the change is guard mechanics inside its existing Decision,
not a new binding decision [assumed: amendment suffices — if wrong: a short ADR "posterity corpus
is scan-derived" supersedes the guard bullet instead].

## 8. Open risks / implementation notes

- **Ordering edge**: this group depends on the sibling group `verdict-adjudication-integrity`
  landing first — both touch `CONTEXT.md`, and the survey manifest carries the machine hint. Plans
  converted from this spec must not enter a campaign wave before that group's `CONTEXT.md` change
  is on the base.
- **Scan-derived corpus and deletions**: a deleted references file silently leaves the posterity
  corpus — correct by design (a deleted file is no live surface), and distinct from the enumerated
  verb list, where deletion still throws via unguarded `readFileSync` and additionally reds the
  census. State this in the census test's comment so the asymmetry reads as intent, not oversight.
- **Census friction is the point**: every new `skills/*/references/*.md` file now costs one
  conscious placement line. The failure message must say which list to extend and why.
- **Carve-out tightening risk**: a decorated glob (emphasis-wrapped `docs/specs/2026-*`) must stay
  carved — the path-segment-only test still sees the `*` inside the segment. Keep the existing
  unpaired-glob fixture green as the proof.
- **One file, one task**: #1368, #1306, and #1358's findings 1/7/9/10 all land in
  `skills/_shared/doc-cli-consistency.test.mjs`; the same-file rule forbids splitting them into
  parallel tasks. The `CONTEXT.md` and ADR 0046 touches are file-disjoint and can be a sibling
  task in the same phase.
- D9's exclusion list is a dated snapshot at `6fff2ee` (2026-08-06); the implementing worker
  re-runs the census at its dispatch base and places any references file added since.

## 9. Non-goals / deferred

- **No blanket markdown/AST parser** over doc surfaces — ADR 0046's rejected ceiling stands; the
  posterity rule stays a regex sweep with pattern carve-outs.
- **Verb-scanning `agents/*.md`** — deferred (D8).
- **`skill-doc-contracts.test.mjs` untouched**: the Spec-truth-guard slice was never emitted, so
  there are no rows to remove (verified: issue #1358 finding 4 (2026-08-06)); the supersession is
  doc-only.
- **#1358 findings 2, 3, 5, 6, 8** — already fixed at `2ba7f0a` (verified: live tree at `6fff2ee`
  (2026-08-06)); their close conditions are satisfied by citing that commit, no work in this spec.
- **Lesson-file stamping**: updating
  `docs/learnings/enumerated-destination-list-existssync-guard-fail-open-vs-sibling-fail-closed.md`
  with the recurrence/resolution is servitor housekeeping, not a task here.

## 10. Validation criteria

1. WHEN the suite runs at the landed tip THE doc-cli-consistency suite SHALL pass ·
   check: `node --test skills/_shared/doc-cli-consistency.test.mjs`
2. WHEN any single entry is deleted from `EVICTION_DESTINATIONS` in a throwaway worktree THE
   partition census SHALL fail ·
   check: mutation probe — remove one entry, run the suite, expect nonzero exit
3. WHEN a probe file `skills/war/references/zz-census-probe.md` exists unplaced in a throwaway
   worktree THE partition census SHALL fail naming that path ·
   check: create the probe file, run the suite, expect nonzero exit with the path in the message
4. WHEN `specCitations` reads a bold-wrapped code-span citation (backtick directly inside `**`)
   THE rule SHALL return exactly one finding ·
   check: `grep -c 'must be flagged' skills/_shared/doc-cli-consistency.test.mjs` grows by the two
   D5 fixtures, and the suite passes ·
   manual same-scope survey: hand-scan `skills/_shared/doc-cli-consistency.test.mjs`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction
5. WHEN `specCitations` reads each pre-existing legitimate carve-out fixture THE carve-outs SHALL
   stay green with the fixture lines byte-unchanged ·
   check: `git diff` over the carve-outs test shows additions only among fixtures; suite passes
6. WHEN the posterity corpus is built THE corpus SHALL include a readdir-derived SKILL.md path,
   `agents/war-worker.md`, `skills/war-strategy/references/plan-interview.md`, and `README.md` ·
   check: sentinel asserts present — `grep -n 'agents/war-worker.md' skills/_shared/doc-cli-consistency.test.mjs` ·
   manual same-scope survey: hand-scan `skills/_shared/doc-cli-consistency.test.mjs`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction
7. WHEN `EVICTION_DESTINATIONS` is read THE array SHALL contain
   `skills/war-strategy/references/plan-interview.md` ·
   check: `grep -n 'plan-interview.md' skills/_shared/doc-cli-consistency.test.mjs` ·
   manual same-scope survey: hand-scan `skills/_shared/doc-cli-consistency.test.mjs`'s same-scope
   tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
   survey-derived correction
8. WHEN the `query` verb is renamed inside `war-memory.mjs`'s `VERBS` object in a throwaway
   worktree THE verb rule SHALL flag `plan-interview.md`'s recon command as unresolved ·
   check: mutation probe — rename the verb, run the suite, expect nonzero exit
9. WHEN `CONTEXT.md`'s Spec-truth guard entry is read THE entry SHALL carry a supersession note
   naming ADR 0046 and the never-emitted status ·
   check: `grep -A8 'Spec-truth guard' CONTEXT.md | grep -c '0046'` ≥ 1 ·
   manual same-scope survey: hand-scan `CONTEXT.md`'s same-scope tests/comments for same-meaning
   reworded siblings the grep misses; list each straggler as a survey-derived correction
10. WHEN ADR 0046's Relationship section is read THE section SHALL carry a row retiring the
    ADR 0036 Spec-truth-guard glossary mechanism ·
    check: `grep -c 'Spec-truth' docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md` ≥ 1 ·
    manual same-scope survey: hand-scan
    `docs/adr/0046-specs-are-posterity-skills-cite-maintained-surfaces.md`'s same-scope
    tests/comments for same-meaning reworded siblings the grep misses; list each straggler as a
    survey-derived correction
11. WHEN the redaction lint runs THE spec and any learnings touched SHALL pass ·
    check: `node skills/_shared/war-memory.mjs lint docs/learnings/`
