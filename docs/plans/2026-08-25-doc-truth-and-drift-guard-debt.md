# Doc-truth and drift-guard debt — fix the prose first, then pin it

Source spec: `docs/specs/2026-08-25-doc-truth-and-drift-guard-debt-design.md` (converted by /war-machine drafter, 2026-08-25).

**Stacking position (third in campaign):** this plan stacks after
`docs/plans/2026-08-25-engine-reliability-and-filing-fidelity.md` (plan A) and
`docs/plans/2026-08-25-authoring-doctrine-and-lint-coherence.md` (plan B), per the spec's
`dependsOn` header. The contention is real and named honestly:

- Shared with **plan A**: `skills/war/assets/workflow-template.js` (its many engine tasks vs.
  this plan's `const recovery` comment widening), `skills/war/assets/workflow-template.test.mjs`
  (its D6/handoff tasks vs. this plan's Phase 2 Task 3), `skills/war/assets/war-config.test.mjs`,
  `CONTEXT.md`, `skills/war/references/schemas.md`, `docs/adr/0013-…` (plan A amends it; this
  plan's #1513 guard row pins against its post-amendment shape), `agents/war-refiner.md`,
  plus `README.md`/`CHANGELOG.md` and the four release slots.
- Shared with **plan B**: `skills/war-machine/war-pipeline-structure.test.sh` (its Phase 2
  Task 4 vs. this plan's Phase 2 Task 5), plus `README.md`/`CHANGELOG.md` and the four
  release slots. Plan B's red-team and war-strategy surfaces are disjoint from this plan.

The campaign roadmap must land plans A and B fully before launching this plan; every edit
below is authored against the integration tip **after both land** — pins copy bytes from
that merged tree, never from issue text or from this plan's own literals. Concurrent
execution is forbidden (serial merge queue would rebase-conflict on every shared file).

Issues addressed (all 39): #1662, #1625, #1622, #1621, #1620, #1618, #1292, #1565, #1545,
#1537, #1536, #1651, #1522, #1399, #1477, #1474, #1678, #1652, #1653, #1654, #1656, #1521,
#1525, #1488, #1513, #1587, #1539, #1538, #1535, #1446, #1542, #1673, #1675, #1676, #1677,
#1683, #1686, #1687, #1689.

## Context — the gap / problem

Two intertwined classes of documentation debt; their coupling dictates the two-movement
shape (fix prose, then pin the corrected prose — pin-after-fix, always).

**Class 1 — prose that is false or lagging at HEAD.**

- The README `## Status` blurb and CHANGELOG 0.19.0 entry state a doc-only engine scope
  that omits `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable)
  change (verified: issue #1662 (2026-08-25)). The CHANGELOG preamble's universal "each
  entry is that release's blurb as last edited before its supersession" does not cover a
  freshly-authored head entry (verified: issue #1625 (2026-08-25)). Three relocated deictic
  self-references are false or dangling in CHANGELOG.md — "this paragraph lives in the very
  section `strip_prose` drops" (0.18.x pin paragraph) and two "this README" (0.19.0 spec-
  posterity bullet, 0.15.0 entry) (verified: issue #1622 (2026-08-25); all three located by
  grep at the launch base). The relocated 0.15.1 entry republishes a release-window scope
  claim false of its own `90c3b44..46d42be` window (verified: issue #1621 (2026-08-25)).
- Tour step 10 asserts a classified `gate_failed` cannot merge, omitting the
  baseline/environment-proceed carve-outs (verified: issue #1618 (2026-08-25)); the tour's
  scope-hook step anchors the `..`-traversal guard by "(line ≈51)" while the `case`
  construct in `hooks/validate-worktree-scope.sh` sits ~10 lines lower (verified: issue
  #1292 (2026-08-25); the "(line ≈51)" literal confirmed in the tour at the launch base);
  README still narrates "a 3-round fix budget" (defaults paragraph) and the retired `--ace`
  single-attempt/whole-revert semantics (`--ace` argument row), and the tour is absent from
  `war-config.test.mjs`'s roundLimit watched-surface array (the `surfaces` array inside the
  `roundLimit default is 6` test) (verified: issue #1565 (2026-08-25)).
- The D3-fallback resolution line on the five agent cards is correctly plugin-repo-
  conditioned ("…and the repo under review is the plugin itself…"), but
  `skills/war/references/worker-servitor-edges.md`'s header residuals bullet, the plan
  mirror `docs/plans/2026-08-06-references-pointer-integrity.md`, and ADR 0047's framing
  present it as a general foreign-repo resolution path (verified: issue #1545 (2026-08-25);
  issue #1678 (2026-08-25) — authority-first fix order). ADR 0047 item 1 declares ADR
  0042's pointer shape "unchanged" while the same phase anchored the agent-card pointer's
  path half (verified: issue #1537 (2026-08-25)). CONTEXT.md's _Avoid_ list mixes an
  anti-pattern with a don't-confuse item without the house "not the …" marker, reading as
  an inversion of ADR 0047 point 1 (verified: issue #1536 (2026-08-25)).
- CONTEXT.md measures 121,557 B at the launch base against
  `prompt-surface-budgets.test.mjs`'s `{ hard: 126976, advisory: 111616 }` row — past
  advisory by ~9.9 KB, ~5.4 KB from hard; the next comparable glossary addition reds the
  suite (verified: issue #1651 (2026-08-25); bytes re-measured at a60221a).
- ADR 0018's Decision row and the `const recovery` comment in `workflow-template.js` lag
  the landed conditional branch derivation/refusal arms and the preMerged relaunch prompt
  delta (verified: issue #1477 (2026-08-25)); ADR 0026 lacks an Addendum for the
  now-existing dispatched-refiner gh-write class (file-followups) (verified: issue #1474
  (2026-08-25)).
- Two published lessons carry unsound recipes:
  `docs/learnings/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`
  still prescribes the range probe without the fail-closed `git fetch` refresh (verified:
  issue #1522 (2026-08-25)); the archived awk lesson
  `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md` states the base/live
  degeneracy backwards in its frontmatter description and gotcha section (verified: issue
  #1399 (2026-08-25)).
- `skills/war/references/schemas.md`'s ledger `doneWhen` row omits the value-vs-key
  boundary and backtick-stripping that `skills/war/SKILL.md`'s intake bullet specifies
  (verified: issue #1675 (2026-08-25)).

**Class 2 — guards that are missing, mis-scoped, or self-describing falsely.**

- `skills/war/assets/reference-link-integrity.test.mjs`: `SCAN_DIRS = [AGENTS_DIR,
  REFERENCES_DIR]` excludes README.md's relative links from every mechanical sweep
  (verified: construct confirmed at a60221a; issue #1673 (2026-08-25)); the five-entry
  `QUALIFIED_HEADERS` list omits three live eviction destinations (`refiner-recovery.md`,
  `setup.md`, `docker-gate.md`) while its coverage comment asserts a universal (verified:
  issues #1538, #1535, #1446 (2026-08-25); current five-entry list confirmed at a60221a);
  the Arm-1 `anchoredProbe` round-trips `PLUGIN_ROOT_PREFIX` instead of asserting its
  literal bytes — a self-referential positive control (verified: issue #1542 (2026-08-25));
  `RETIRED_NO_PATH_FORM_CLAIM` scans header regions only, narrower than the whole-file
  End-state grep it backstops, while sibling `RETIRED_REBASING_CAVEAT` scans whole text
  (verified: issue #1677 (2026-08-25)); and the D3 fallback sentence on all five agent
  cards has no standing guard at all (verified: issue #1539 (2026-08-25)).
- `skills/war/assets/skill-doc-contracts.test.mjs`: the D36 Evidence-artifacts duty row
  binds only the consumption surface on one generic key while the normative homes (ADR
  0044, survey-corps SKILL.md, the clustered filing prompt) exist unguarded (verified:
  issues #1652, #1676 (2026-08-25)); D36 asserts against whole canonical files, weaker
  than D35's construct-extraction idiom in the same file (verified: issue #1683
  (2026-08-25)); the D36 header comment miscounts parenthesized-token headers ("two",
  actually one) (verified: issue #1653 (2026-08-25)); the D35 rationale cites "End states
  3/10" wrongly (verified: issue #1654 (2026-08-25)); D33's "EVERY file under
  skills/war/references/" comment overstates its flat `readdirSync` (verified: issue #1525
  (2026-08-25)); D31's "Two clauses are load-bearing" lead-in omits two landed intake
  clauses (verified: issue #1488 (2026-08-25)); `D31_INTERACTIVE_ARM`'s `(?!--afk)` gap
  and two `D22_ORDERED_SPAN` fragments (do-not-push refusal, leading `docs(learnings)`
  anchor) have no both-ways proof — dead-weight fragments that red nothing on deletion
  (verified: issues #1521, #1689 (2026-08-25)); and the CONTEXT.md ↔ ADR 0013
  Intent-ceiling latitude-clause mirror has no drift-guard row (verified: issue #1513
  (2026-08-25)).
- `skills/war/assets/workflow-template.test.mjs`: the D6 keep-green census is a count-only
  source pin blind to an occurrence relocating to a fixture-unreachable dispatch site,
  with a looser regex than the sweep's matcher (verified: issue #1686 (2026-08-25)); no
  test pins `agents/war-refiner.md`'s file-followups pointer to
  `references/file-followups.md` nor the destination body to the dispatched prompt
  literals (verified: issue #1587 (2026-08-25)).
- `skills/_shared/doc-cli-consistency.test.mjs`: `posterityCorpus()` does not scan
  CHANGELOG.md though ADR 0046's ratified extension names it (verified: issue #1620
  (2026-08-25)); `specCitations()` truncates at the first delimiter before the
  bare-mention carve-out, silently discarding link-shaped citations with real spec
  targets (verified: issue #1687 (2026-08-25); order confirmed in `specCitations()` at
  a60221a).
- `skills/war-machine/war-pipeline-structure.test.sh`: the war-review three→four
  ratified-rows flip has a presence pin only, no OLD-absent `lacks_i` twin, and this
  suite is its only possible host (verified: issue #1656 (2026-08-25)).

**Why one plan, two movements:** the pin work in Class 2 asserts the exact bytes the
Class 1 fixes rewrite. Pinning stale prose freezes the defect; fixing prose after its pin
lands means editing two surfaces per fix. Every guard is authored against the
movement-1-landed tree (phase edge between the movements). [assumed: pin-after-fix
ordering doctrine — if wrong: guard suites red on every prose correction and each fix
doubles in size]

## Pivotal constraints

- **Two movements, phase-ordered:** every prose-truth fix lands (Phase 1) before the
  guard that pins its surface (Phase 2). Guards copy bytes from the merged Phase-1 tree,
  never from issue text (§3 rule 7 satisfied by the phase edge — no in-phase guard/fix
  pair exists in this plan; the only same-task pairs are self-authored, e.g. Phase 2
  Task 1's "at eviction time" header qualifications pinned by the same task's
  `QUALIFIED_HEADERS` extension).
- **Shared-suite serialization:** all edits to `skill-doc-contracts.test.mjs` are one
  task; likewise `reference-link-integrity.test.mjs`, `workflow-template.test.mjs`,
  `doc-cli-consistency.test.mjs`, `war-pipeline-structure.test.sh` — one owning task each.
- **Existing-pin safety:** README `## Status` and CHANGELOG head are pinned by
  `version-slots.test.mjs` (Status token replace-in-place, newest-first head version, the
  Status-blurb authoring checklist, Releasing prose halves) — the #1662 rescope edits
  blurb *content* only, never the version token, heading structure, or checklist;
  README.md is enumerated in `war-config.test.mjs`'s `RETIRED_CLAIM_SURFACES` — the #1565
  README fix must not reintroduce any retired phrasing; CHANGELOG.md is deliberately
  outside `war-pipeline-structure.test.sh`'s enumerated absence-scan lists (its header
  comment says so) — no pin moves needed there. Every Phase-1 task runs the full JS +
  shell suites locally and treats any red pin as a coupling to update lock-step, never a
  pin to loosen.
- **CONTEXT.md eviction discipline (ADR 0042, #1651):** byte-identical move into
  `skills/war/references/glossary-cold.md` (an existing eviction destination, already in
  `QUALIFIED_HEADERS`) plus trigger pointers — never a rewrite. Eviction targets are
  chosen from cold glossary entries NOT covered by live drift-guard keys (D34–D36,
  war-config.test.mjs's CONTEXT.md rows, and any key plan A added); the Intent-ceiling
  latitude clause (about to be pinned by #1513 in Phase 2) must stay hot. Per the
  recorded eviction lesson, evicted-bytes-minus-pointer arithmetic is routinely
  optimistic — the End state is a **measured** `wc -c` below the advisory line
  (111,616 B), with a working target of ≤ 110,000 B for real headroom; measure after,
  not before.
- **Lesson amendments preserve provenance:** #1522/#1399 edits amend
  Fix/Pattern/description text; `metadata.provenance` and slugs unchanged; the archived
  awk lesson stays in `archive/`; edits must pass `war-memory lint`.
- **ADR amendments are addenda, never rewrites of ratified text** (#1474 requests the
  0013-style Addendum form; #1477 an amendment row; #1537 a scope qualification appended
  to item 1, not a rewrite of it).
- **New guards must be both-ways proven** (the #1689 class): every added regex fragment
  or pin carries a negative reference (fixture or scratch-deletion trace recorded in the
  done report); no new dead-weight fragments.
- **Cross-plan contention:** see the stacking preamble — this plan launches only after
  plans A and B land.
- **check: transport:** one command per End-state row; no backticks inside check
  strings; `grep -F` for `$`-bearing literals; case-insensitive greps for retirement
  needles.

## Resolved design tree

| Decision | Resolution |
|---|---|
| One sweep or per-issue commits for CHANGELOG prose? | One CHANGELOG+README task (#1662/#1625/#1622/#1621 + README half of #1565) — all four issues edit overlapping regions of two files |
| Where does the D3-fallback wording fix land? | Authority surface first (`worker-servitor-edges.md` header), then mirrors (plan doc, ADR 0047, agent cards only if a wording touch proves necessary) in the same task, per #1678's authority-first rule |
| #1537 with the D3 task or the ADR task? | With the D3 task — #1545 and #1537 both edit ADR 0047; same-file ⇒ same task |
| #1651 eviction destination | `skills/war/references/glossary-cold.md` (existing destination, already in `QUALIFIED_HEADERS`); targets chosen at implementation from coldest glossary entries not covered by live drift-guard keys |
| #1565's test half (tour into `war-config.test.mjs`) | Rides the tour task in Phase 1 — `war-config.test.mjs` is owned by no Phase-2 task, so no collision; the tour joins the `surfaces` array inside the `roundLimit default is 6` test with a NEW-present/OLD-absent pattern pair |
| QUALIFIED_HEADERS: narrow comment or widen list (#1446's three options)? | Widen the list to the three destinations and qualify their headers "at eviction time" (#1535's shape); the comment then becomes true without narrowing |
| D36 re-bind shape (#1652/#1676/#1683) | Widen the Evidence-artifacts row to the landed normative homes AND adopt D35's construct-extraction idiom for all eight canonical-side asserts in the same edit |
| #1675: extend the schemas.md row or register an ADR-0025 mirror pair? | Extend the row's parenthetical (Phase 1); mirror registration deferred — the sibling spec owns mirror-registry policy [assumed: cheapest sufficient fix — if wrong: register the pair as a follow-up row in Phase 2 Task 2] |
| #1673 scope | Add README.md (root-level `*.md`) to the sweep alongside `SCAN_DIRS`, preserving the directory-scan design |
| #1620 ordering | Phase 2, after the Phase-1 CHANGELOG sweep — `posterityCorpus()` must scan the corrected text; concrete-spec-path hits in old entries are fixed in the guard task as survey-derived corrections |
| Release phase in this plan? | Yes, directive form (Phase 3) — pipeline doctrine gives each stacked plan its own trailing four-slot bump; the spec's no-release-phase assumption is retired (its own "if wrong" arm) |
| #1651 shrink depth | Below advisory with real headroom: target ≤ 110,000 B measured, floor = strictly < 111,616 B (provisional default — see Open decisions) |

## Assumptions ledger

| # | Assumption | If wrong |
|---|---|---|
| A1 | Campaign serialization: this plan's guard-suite edits land strictly after plans A and B (carried from the spec's dependsOn row) | Rebase conflicts in the serial merge queue on every shared suite file; pins authored against a stale tree |
| A2 | Pin-after-fix is the ordering doctrine — guards are authored against post-fix bytes only (carried from spec §1) | Guard suites red on every prose correction; each fix doubles in size |
| A3 | #1675's cheapest sufficient fix is the parenthetical extension; formal ADR-0025 mirror registration belongs to the sibling spec (carried from spec §3) | Register the pair as a follow-up row in Phase 2 Task 2 |
| A4 | The five agent cards' D3 sentence itself needs no wording change — it is already plugin-repo-conditioned; only the header/plan/ADR mirrors overstate it [assumed: from reading the sentence at a60221a — if wrong: Phase 1 Task 3 touches the cards too (they are in its Files reservation) and Phase 2 Task 1 copies the changed sentence] | Phase 1 Task 3 edits all five cards; the #1539 pin still copies from the merged tree, so no downstream change |
| A5 | Enough CONTEXT.md glossary content is genuinely cold and un-pinned to free the needed net bytes: ≥ 11.6 KB net (evicted minus pointer bytes) for the ≤ 110,000 B default target, ≥ 10.0 KB net for the bare advisory floor (base is 121,557 B vs advisory 111,616 B) [assumed: from budget math at a60221a] | Evict to the reachable floor, record the measured shortfall in the done report, and escalate the residual target to the Lead rather than evicting pinned bytes |
| A6 | Plan A's ADR 0013 amendment and CONTEXT.md edits land before Phase 2 Task 2 authors the #1513 mirror row (follows from A1) | The row's anchor literals miss; re-derive against the actual merged tree at implementation |

Retired spec assumption (D19): spec §5's "No release phase … [assumed: default — if
wrong: add a trailing bump phase resolving the next free patch from the four slots at
land time]" — **retired by taking its own if-wrong arm**: /war-machine doctrine and both
sibling plans give every stacked plan a directive release phase (Phase 3 below).

## Non-goals / deferred

- Registering the schemas.md `doneWhen` row as a formal ADR-0025 mirror pair (#1675's
  alternative arm) — deferred to the sibling spec's mirror-registry scope (honored per
  the drafter directive).
- Any Status-blurb authoring-checklist *enforcement* beyond #1662's one-time correction —
  no issue mandates it.
- Restructuring `posterityCorpus()`/`specCitations()` beyond the two named defects.
- New CONTEXT.md glossary content of any kind (#1651 shrinks; additions work against the
  budget it restores).

## New domain terms · Recommended ADRs

None proposed (spec §6/§7). Existing ADRs amended in place: 0018 (amendment row, #1477),
0026 (Addendum, #1474), 0047 (item-1 scope qualification, #1537/#1545).

## Commander's Intent

- **Purpose:** every named doc surface tells the truth at HEAD — release prose, tour,
  ADRs, glossary, lessons, schemas — and every corrected fact that a machine can derive
  is bound by a drift guard that actually reds when the fact rots: no missing pins, no
  self-satisfied positive controls, no dead-weight regex fragments, no coverage comments
  overstating their scan.
- **Method:** two movements with a hard phase edge. Movement 1 (Phase 1, seven
  file-disjoint tasks) fixes prose truth: the CHANGELOG/README release-prose sweep, tour
  carve-outs + construct anchor + watched-surface join, D3-fallback requalification
  authority-first, ADR 0018/0026 amendments + the `const recovery` comment, the
  CONTEXT.md _Avoid_ marker + ADR-0042 byte-identical eviction into `glossary-cold.md`
  measured back under the advisory line, two lesson amendments, and the schemas.md
  `doneWhen` parenthetical. Movement 2 (Phase 2, five file-disjoint suite tasks — one
  owning task per suite) pins the corrected bytes: README joins the link sweep + the
  five-card D3 guard + `QUALIFIED_HEADERS` widened + literal-bytes positive control +
  whole-text retirement scan; D36 re-bound to the normative homes with
  construct-extraction + comment-truth fixes + both-ways proof fixtures + the #1513
  mirror row; the D6 census made relocation-blind-proof + the file-followups paired
  pins; `posterityCorpus()` over CHANGELOG.md + the `specCitations()` seam fix; the
  war-review OLD-absent/presence pair. Phase 3 bumps the four release slots
  directively.
- **Mechanism latitude:** exact wording of every prose correction (End states pin
  facts, not phrasing); which glossary entries are evicted and the pointer wording
  (guardrails: byte-identical move, un-pinned targets, measured result); the D36
  construct-extraction helper's shape; anchor-literal choice for every new pin (stable
  mid-clause tokens chosen against landed text); whether `specCitations()` is fixed by
  re-scanning the truncated tail or by a non-swallowing path-capture across the `](`
  seam; the tour's NEW-present/OLD-absent pattern pair; fixture vs. scratch-deletion
  trace for each both-ways proof. Substituting any of these while the End states and
  binding guardrails hold is not a plan deviation and warrants no issue.
- **Binding guardrails:** pin-after-fix — no Phase-2 guard authored from issue text ·
  no existing pin loosened to get green (a red pin is a lock-step coupling to update) ·
  CONTEXT.md eviction is a byte-identical move, never a rewrite; the Intent-ceiling
  latitude clause stays hot · lesson `metadata.provenance` and slugs unchanged; the awk
  lesson stays archived · ADR edits are addenda/amendment rows, never rewrites of
  ratified text · version-slots.test.mjs stays green through every README/CHANGELOG
  touch (Status token, checklist, newest-first head) · every new regex fragment or pin
  is both-ways proven with the proof recorded in the done report · every grep floor
  below is followed by a manual same-scope survey, stragglers recorded as
  survey-derived corrections · anchor every edit by named construct, never line number.
- **End state:**
  1. CHANGELOG.md carries no false deictic or window-scope claim ·
     check: grep -Ein 'this README|lives in the very section' CHANGELOG.md || echo OLD-ABSENT prints OLD-ABSENT (then manual survey of the preamble and 0.15.x–0.19.0 entries for other relocated deictics).
  2. The CHANGELOG head (0.19.0) entry names the red-team scaffold prompt change as
     engine-class, with no surviving doc-only absolute — head-entry-scoped because
     0.18.x entries already mention workflow-scaffold (2 hits at base, so a whole-file
     grep is vacuous) ·
     check: sed -n '/^## 0\.19/,/^## /p' CHANGELOG.md | grep -c workflow-scaffold prints at least 1 (then manual survey of the head entry for surviving doc-only absolutes; the README half is End state 17).
  3. Tour step 10 carries the baseline/environment-proceed carve-outs and the
     scope-hook step anchors the `..`-traversal guard by the `case` construct, not a
     line number ·
     check: grep -c 'line ≈51' .tours/architect-war-system.tour | grep -qx 0 && echo ANCHOR-RETIRED prints ANCHOR-RETIRED (grep -c alone exits 1 on the desired zero count).
  4. README narrates the 6-round budget and the culprit-first ace bisection; BOTH the
     tour and README are rows in `war-config.test.mjs`'s roundLimit watched-surface
     array (README's OLD-absent /\b3-round\b/i, NEW-present from the corrected bytes) ·
     check: node --test skills/war/assets/war-config.test.mjs (green with both rows present; scratch-flipping the tour's roundLimit literal AND scratch-reinserting '3-round' into README each red it — traces in the done report).
  5. The D3-fallback framing is plugin-repo-conditioned on the authority surface and
     all mirrors (worker-servitor-edges.md header, the 2026-08-06 plan mirror, ADR
     0047), and ADR 0047 item 1 no longer claims the pointer shape "unchanged".
     NEW-present needle, not a bare retirement grep — the header's Bash-capable-seats
     clause ("expand the placeholder in their own shell … even on a foreign target
     repo") is TRUE and is a sanctioned survivor no absence-grep may condemn; the
     defect is only the D3-line-as-foreign-repo-resolution framing for non-Bash seats ·
     check: grep -c -i 'plugin itself' skills/war/references/worker-servitor-edges.md prints at least 1 (the requalified header conditions D3 resolution on the plugin repo; then manual survey of the header, the plan mirror, and ADR 0047 for residuals — leaving the sanctioned Bash-capable survivor untouched).
  6. CONTEXT.md is measured back under the advisory line with the _Avoid_ marker fixed ·
     check: wc -c CONTEXT.md prints a byte count strictly below 111616 (target at or below 110000; the full JS suite green — End state 14 — proves no pinned byte moved).
  7. ADR 0018 carries the dated amendment row ·
     check: grep -c 'Amendment (2026-08-25)' docs/adr/0018-war-working-branch-checkout-guard.md prints at least 1 (ADR 0026 is End state 18; the recovery comment is End state 19).
  8. Both lessons state the sound recipe (fetch-refresh precondition; corrected awk
     degeneracy direction) with provenance and slugs unchanged, lint-clean ·
     check: node skills/_shared/war-memory.mjs lint docs/learnings/ exits 0.
  9. The schemas.md `doneWhen` row states the value-vs-key boundary and
     backtick-stripping — row-discriminating (a pre-existing off-row 'backtick' hit
     lives in the gate-string validator comment, so a bare file grep is vacuous) ·
     check: grep -n 'doneWhen' skills/war/references/schemas.md | grep -c -i 'backtick' prints at least 1.
  10. README's relative links are mechanically resolved by the link-integrity sweep ·
      check: node --test skills/war/assets/reference-link-integrity.test.mjs (green; scratch-breaking one README relative link reds it — trace in the done report).
  11. The five-card D3 sentence is pinned against the merged wording;
      `QUALIFIED_HEADERS` carries all eight destinations with true coverage comment;
      the Arm-1 positive control asserts literal bytes; the no-path-form retirement
      scan is whole-text ·
      check: node --test skills/war/assets/reference-link-integrity.test.mjs (including the new named five-card D3 test; per-change scratch traces in the done report).
  12. D36 binds the normative Evidence-artifacts homes via construct extraction; the
      D36/D35/D33/D31 comments are true; `(?!--afk)` and both `D22_ORDERED_SPAN`
      fragments are both-ways proven; the CONTEXT.md ↔ ADR 0013 Intent-ceiling
      latitude mirror has a drift-guard row ·
      check: node --test skills/war/assets/skill-doc-contracts.test.mjs (green; scratch-deleting the negated fragment or either D22 fragment each reds at least 1 assert — proofs recorded in the residual comment and done report).
  13. The D6 census reds when a keep-green occurrence relocates outside
      fixture-reachable dispatch sites, and the refiner-card file-followups pointer +
      destination body are pinned to the dispatched prompt literals ·
      check: node --test skills/war/assets/workflow-template.test.mjs (green; the discriminating scratch proof: move the ace-bisection-subset keep-green occurrence into a comment — baseline-green under the old count-only floor, red only under the new per-occurrence membership check — trace in the done report).
  14. `posterityCorpus()` covers CHANGELOG.md and `specCitations()` no longer swallows
      link-shaped citations — each proven non-vacuously (a green suite at a
      zero-violation base proves neither): scratch-adding a concrete docs/specs/
      real-file citation line to CHANGELOG.md reds doc-cli-consistency, and the #1687
      link-shaped fixture is red with the seam fix reverted (both traces in the done
      report); the war-review block carries the OLD-absent + presence pair; and the
      full suites pass ·
      check: node --test 'skills/**/*.test.mjs' exits 0.
  15. All shell suites pass, including the widened war-review pair ·
      check: for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done exits 0 (scratch-inserting 'three ratified rows' into skills/war-review/SKILL.md reds war-pipeline-structure.test.sh — trace in the done report).
  16. All four version slots and the CHANGELOG head entry are bumped coherently to the
      next free patch above the live integration base ·
      check: node --test skills/war/assets/version-slots.test.mjs exits 0 (plus the land-time differs-from-launch-base assertion in the task).
  17. The README `## Status` blurb names the red-team scaffold prompt change as
      engine-class (region-scoped: the CHANGELOG half is End state 2) ·
      check: sed -n '/^## Status/,/^## /p' README.md | grep -c workflow-scaffold prints at least 1 (then manual survey of the blurb for surviving doc-only absolutes).
  18. ADR 0026 carries the file-followups Addendum ·
      check: grep -c -i 'addendum' docs/adr/0026-github-side-effects-mechanically-gated.md prints at least 1.
  19. The `const recovery` comment in `workflow-template.js` names the landed
      derivation/refusal arms (the widened comment must carry the literal token
      'refusal arm' — zero hits at base, so the grep is decisive; 'preMerged' alone is
      non-discriminating, it already appears in code) ·
      check: grep -c -i 'refusal arm' skills/war/assets/workflow-template.js prints at least 1 (worker confirms the hit sits in the const recovery comment block, not code).

## Build order (for /war)

Phase 1 (prose truth — seven file-disjoint tasks, fully parallel, no deps) → Phase 2
(pins and drift guards — five file-disjoint suite tasks, fully parallel, no deps; every
pin copies bytes from the Phase-1-landed tree; phase edge, not deps, is the rule-7
mechanism) → Phase 3 (release). This plan launches only after plans A and B land (see
stacking preamble).

## Phase 1 — Prose truth (movement 1)

Seven file-disjoint tasks. Each runs `node --test 'skills/**/*.test.mjs'` and the shell
suites locally before pushing; any red pin is a coupling updated lock-step in the same
commit, never loosened.

### Task 1: Release-prose sweep (CHANGELOG.md + README.md)
- Files: `CHANGELOG.md`, `README.md`
- Plan slice: (#1662) rescope the 0.19.0 engine-scope absolute in BOTH the README
  `## Status` blurb and the CHANGELOG 0.19.0 entry to name
  `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable) change —
  edit blurb content only; the Status version token, heading, and checklist structure are
  pinned by `version-slots.test.mjs` and must not move. (#1625) soften the CHANGELOG
  preamble's supersession universal so it covers a freshly-authored head entry. (#1622)
  repair the three relocated deictics: the "this paragraph lives in the very section
  `strip_prose` drops" sentence in the 0.18.x pin paragraph, and the two "this README"
  references (0.19.0 spec-posterity bullet, 0.15.0 entry) — reword each to be true from
  its CHANGELOG location. (#1621) correct the relocated 0.15.1 entry's release-window
  scope claim to be true of its own `90c3b44..46d42be` window. (#1565 README half) update
  the defaults paragraph's "a 3-round fix budget" to the landed 6-round default and
  rewrite the `--ace` argument row from single-attempt/whole-revert to the landed
  culprit-first bisection ladder — without reintroducing any
  `RETIRED_CLAIM_SURFACES`-scanned retired phrasing (README is enumerated there). Grep
  floor: case-insensitive greps for 'this README', 'lives in the very section',
  '3-round', 'reverted' over both files; then hand-scan the preamble, the 0.15.x–0.19.0
  entries, and the README defaults/arguments sections for paraphrased survivors; list
  stragglers as survey-derived corrections. Touched-doc treatment (rule 8): the 0.19.0
  blurb scope fact and the ace/roundLimit narrations are machine-source-derivable —
  their guards are Phase 2 Task 4 (`posterityCorpus()` over CHANGELOG) and the README
  row Phase 1 Task 2 adds to `war-config.test.mjs`'s roundLimit watched-surface array
  (README is NOT guarded there today — it appears only in `RETIRED_CLAIM_SURFACES`,
  whose retirement needles do not cover the roundLimit/ace narration; Task 2 closes
  that gap with patterns derived from this task's merged bytes, hence its deps edge);
  the deictic and window-scope fixes are
  historical-prose truth with no machine source — explicitly-defer (no guard; CHANGELOG
  is deliberately outside the absence-scan lists).
- Done when: node --test skills/war/assets/version-slots.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: Tour truth + watched-surface join (.tour + war-config.test.mjs)
- Files: `.tours/architect-war-system.tour`, `skills/war/assets/war-config.test.mjs`
- Plan slice: (#1618) tour step 10 (the merge-queue/gate step) gains the
  baseline/environment-proceed carve-outs — a classified `gate_failed` can merge under
  the environment-class proceed arms; state the carve-outs alongside the existing
  cannot-merge claim. (#1292) re-anchor the `..`-traversal guard description in the
  scope-hook step by the `case` construct in `hooks/validate-worktree-scope.sh` — name
  the construct ("fires before the `case` dispatch on `agent_type`"), delete the
  "(line ≈51)" literal. (#1565 tour half) add
  `.tours/architect-war-system.tour` to the `surfaces` array inside the
  `roundLimit default is 6` test in `war-config.test.mjs`, with a NEW-present pattern
  matching the tour's landed 6-literal and an OLD-absent pattern for the 3-default form
  (JSON-escaped content — derive both patterns from the tour's actual bytes; both-ways
  proof: scratch-flip the tour literal, observe red, restore). ALSO add a `README.md`
  row to the same `surfaces` array — NEW-present pattern derived from Task 1's merged
  README bytes (the corrected 6-round narration), OLD-absent /\b3-round\b/i — closing
  the guard gap Task 1's rescope exposes (this is the deps edge: the pattern derives
  from Task 1's landed text, guard-split rule 7). Binding pins: the tour is
  JSON — `skill-doc-contracts.test.mjs` JSON.parses it and pins step 17 (D12); every
  tour edit must keep it valid JSON and leave the D12 step-17 pin's bytes untouched.
  Touched-doc treatment (rule 8): the roundLimit literals are machine-derivable —
  guarded by the two array rows this task lands (tour row self-authored, rule 7 N/A;
  README row deps-edged); the carve-out and construct-anchor prose are narrative truth
  over `workflow-template.js`/`validate-worktree-scope.sh` behavior — explicitly-defer
  (no tour-prose drift guard exists; recorded as accepted residual, tour rot is caught
  by doc sweeps).
- Done when: node --test skills/war/assets/war-config.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: [Phase 1 Task 1]
- target repo: superproject

### Task 3: D3-fallback requalification, authority-first (+ ADR 0047)
- Files: `skills/war/references/worker-servitor-edges.md`,
  `docs/plans/2026-08-06-references-pointer-integrity.md`,
  `docs/adr/0047-agent-card-pointer-skeleton-plugin-root-anchored.md`,
  `agents/war-worker.md`, `agents/war-auditor.md`, `agents/war-refiner.md`,
  `agents/war-servitor.md`, `agents/war-setup-scout.md` (the five cards: reserved —
  touch ONLY if the requalification proves a card wording change necessary; A4 expects
  no card edit)
- Plan slice: (#1545/#1678, authority first) requalify the header residuals bullet in
  `worker-servitor-edges.md` — the D3 fallback line resolves the pointer only when
  "the repo under review is the plugin itself"; the header's "resolves this file even on
  a foreign target repo … resolution rests on … the cards' D3 fallback line" framing must
  stop presenting D3 as a foreign-repo resolution path (on a foreign repo, resolution
  rests on harness substitution and the inline decisive-rules digests alone). Sanctioned
  survivor: the Bash-capable-seats clause ("expand the placeholder in their own shell …
  even on a foreign target repo") is TRUE and stays — only the non-Bash-seat D3 framing
  is requalified. Binding pins on this file: `worker-servitor-edges.md` is a
  `QUALIFIED_HEADERS` member — its header must keep the "at eviction time" qualified
  byte-identity claim — and the header region is scanned by the `RETIRED_*` patterns in
  `reference-link-integrity.test.mjs`; run that suite before push and never reintroduce
  a retired form. Then the
  mirrors in the same task: the corresponding framing in the plan mirror
  `docs/plans/2026-08-06-references-pointer-integrity.md` (annotate as a
  posterity-correction note appended to the plan, not a silent rewrite of the ratified
  plan text), and ADR 0047's fallback-first framing (items describing the auditor and
  no-shell seats). (#1537) append a scope qualification to ADR 0047 item 1: the phase
  anchored the agent-card pointer's path half, so "unchanged" holds only for the
  trigger-grammar half of ADR 0042's pointer shape — an appended qualification sentence
  or amendment row, never a rewrite of the ratified item. Grep floor: grep -i 'foreign'
  and 'unchanged' over the three surfaces, handle every hit; then hand-scan the five
  agent cards' D3 sentences for any wording that overstates foreign-repo resolution
  (A4 expects none — if found, fix on the card and note it for Phase 2 Task 1's pin
  copy). Touched-doc treatment (rule 8): the D3 sentence is machine-derivable (card
  bytes) — its guard is Phase 2 Task 1's five-card pin (phase-later per rule 7's
  sanctioned alternative); the ADR/plan framing is ratified-decision prose —
  explicitly-defer (ADRs are not drift-guard-scanned; the amendment IS the record).
- Done when: node --test skills/war/assets/reference-link-integrity.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: ADR 0018 + 0026 amendments + the recovery comment
- Files: `docs/adr/0018-war-working-branch-checkout-guard.md`,
  `docs/adr/0026-github-side-effects-mechanically-gated.md`,
  `skills/war/assets/workflow-template.js` (comment only)
- Plan slice: (#1477) add an amendment row to ADR 0018's Decision section covering the
  landed conditional branch derivation/refusal arms and the preMerged relaunch prompt
  delta (date-stamped, appended — ratified text untouched); widen the `const recovery`
  comment in `workflow-template.js` to match the landed arms (locate by the
  `const recovery` construct; comment-only change — no executable line moves; the
  widened comment carries the literal token 'refusal arm' — End state 19's decisive
  needle, zero hits at base; and the full workflow-template.test.mjs suite must stay
  green). The ADR 0018 amendment row is date-stamped 'Amendment (2026-08-25)' — End
  state 7's needle. (#1474) append a 0013-style
  Addendum to ADR 0026 recording the now-existing dispatched-refiner gh-write class
  (the `file-followups:phase-<id>` batch — `dispatchKind: file-followups`, fail-open
  filing, never out-of-mode) and why it does not violate the original decision's
  boundary. Touched-doc treatment (rule 8): the recovery-arm facts are
  machine-derivable — the executable arms are already covered by
  `workflow-template.test.mjs`'s recovery tests (guard exists; this task restores
  comment truth beside it); ADR prose — explicitly-defer as in Task 3.
- Done when: node --test skills/war/assets/workflow-template.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: CONTEXT.md — _Avoid_ marker + ADR-0042 eviction under advisory
- Files: `CONTEXT.md`, `skills/war/references/glossary-cold.md`
- Plan slice: (#1536) add the house "not the …" don't-confuse marker to the _Avoid_
  list item that currently reads as an inversion of ADR 0047 point 1. (#1651) ADR-0042
  eviction pass: select cold glossary entries NOT matched by any live drift-guard key —
  before choosing, enumerate the pinned spans by grepping
  `skill-doc-contracts.test.mjs` (D34–D36 and any CONTEXT.md-reading row plan A added),
  `war-config.test.mjs`'s CONTEXT.md rows, and `war-pipeline-structure.test.sh` for
  CONTEXT.md-scanning keys; the Intent-ceiling latitude clause is EXCLUDED from
  eviction (Phase 2 Task 2 pins it). Before evicting, enumerate the candidate entries
  with a measured per-entry byte count (wc -c on each extracted span) and select until
  the summed net (entry bytes minus that entry's pointer-line bytes) covers the target —
  A5's arithmetic: ≥ 11.6 KB net for ≤ 110,000 B, ≥ 10.0 KB net for the bare advisory
  floor. Move each selected entry byte-identical into
  `skills/war/references/glossary-cold.md` (existing destination; its header already
  carries the "at eviction time" qualified claim — append under it) and leave the fixed
  trigger-pointer shape in CONTEXT.md: when <trigger>, read
  references/glossary-cold.md — a pointer without a trigger is a defect. Byte
  discipline (recorded eviction lesson): the freed-bytes arithmetic is routinely
  optimistic — after the move, run wc -c CONTEXT.md and iterate eviction until the
  measured count is at or below 110,000 B (floor: strictly below the 111,616 B advisory
  in `prompt-surface-budgets.test.mjs`); if un-pinned cold content runs out first (A5),
  stop at the reachable floor, record the measured shortfall in the done report, and
  escalate rather than evicting pinned bytes. Run the FULL JS suite before push —
  D34–D36, budgets, and link integrity must all be green. Touched-doc treatment
  (rule 8): the byte count is machine-checked by `prompt-surface-budgets.test.mjs`
  (guard exists — advisory is warn-only, hard is red; the End state adds the measured
  floor); moved glossary entries keep whatever guard keys already bind them (none, by
  selection); the _Avoid_ marker is glossary prose — explicitly-defer.
- Done when: node --test skills/war/assets/prompt-surface-budgets.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 6: Lesson recipe amendments (two learnings files)
- Files: `docs/learnings/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`,
  `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`
- Plan slice: (#1522) amend the prepush lesson's Fix/Pattern text to add the
  fail-closed `git fetch` refresh as a precondition of the range probe (the recipe is
  unsound against a stale local remote-tracking ref without it). (#1399) invert the
  archived awk lesson's frontmatter `description` and gotcha-section wording to state
  the base/live degeneracy in the correct direction. Both: `metadata.provenance` and
  slugs byte-unchanged; the awk lesson stays under `archive/`; frontmatter stays
  parseable (keywords nested under `metadata:`). Touched-doc treatment (rule 8): lesson
  bodies are not drift-guarded by any test (the recorded
  process-recipe-lesson-body lesson says exactly this) — explicitly-defer, with the
  redaction lint as the only mechanical floor.
- Done when: node skills/_shared/war-memory.mjs lint docs/learnings/
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 7: schemas.md doneWhen parenthetical (#1675)
- Files: `skills/war/references/schemas.md`
- Plan slice: extend the ledger `doneWhen` field-comment row's parenthetical to state
  the value-vs-key parse boundary and the backtick-stripping that
  `skills/war/SKILL.md`'s intake bullet specifies — an informal-summary extension
  matching the canonical rule, not a restatement fork (cite the SKILL.md intake bullet
  as canonical, per the recorded schemas-md-ledger-row lesson). Honor A3: no mirror
  registration. Touched-doc treatment (rule 8): the parse rule is machine-derivable
  from SKILL.md — de-mirror posture (the row explicitly defers to the canonical intake
  bullet; no new pin — the sibling spec owns mirror-registry policy, deferred).
- Done when: bash skills/war/references/schemas-manifest.test.sh
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Pins and drift guards (movement 2)

Five file-disjoint suite tasks, one owning task per suite, fully parallel. Every pin
copies its anchor bytes from the Phase-1-landed integration tip (the phase edge is the
rule-7 mechanism — never from issue text, never from this plan). Every new fragment or
pin ships with a both-ways proof (fixture or scratch-deletion trace in the done report).

### Task 1: reference-link-integrity.test.mjs + the three headers
- Files: `skills/war/assets/reference-link-integrity.test.mjs`,
  `skills/war/references/refiner-recovery.md`, `skills/war/references/setup.md`,
  `skills/war/references/docker-gate.md`
- Plan slice: (#1673) add README.md to the sweep alongside `SCAN_DIRS` — preserve the
  directory-scan design (a root-level file entry joining the scan set, resolved
  repo-root-relative), so README's relative markdown links red on breakage; both-ways:
  scratch-break one README link, observe red. (#1539) add a named five-card D3-sentence
  guard asserting the (post-Phase-1) D3 fallback sentence present on all five
  `agents/*.md` cards — copy the sentence bytes from the merged tree; grep -F semantics
  for the `$`-bearing literal. (#1538/#1535/#1446) extend `QUALIFIED_HEADERS` with
  `refiner-recovery.md`, `setup.md`, `docker-gate.md`; verify each of the three at the
  rebased base and add the qualified "at eviction time" byte-identity claim to any
  header lacking it — at a60221a NONE of the three carries the phrase (grep-verified),
  so expect three header edits, but touch only what is actually missing after plans
  A/B land (this task owns the three references/ files — Phase 1 touches none of
  them); rewrite the coverage
  comment so its universal is true of the widened list. (#1542) make the Arm-1
  `anchoredProbe` positive control assert `PLUGIN_ROOT_PREFIX`'s literal bytes
  (the `${CLAUDE_PLUGIN_ROOT}/` string) instead of round-tripping the constant —
  both-ways: scratch-change the constant, observe the control red. (#1677) widen
  `RETIRED_NO_PATH_FORM_CLAIM`'s scan from header regions to the
  `RETIRED_REBASING_CAVEAT` whole-text scope. Self-authored pair note: the three header
  qualifications and their `QUALIFIED_HEADERS` pins land in this one task (rule 7 N/A).
- Done when: node --test skills/war/assets/reference-link-integrity.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 2: skill-doc-contracts.test.mjs (largest task; single worker, sequenced by D-block)
- Files: `skills/war/assets/skill-doc-contracts.test.mjs`
- Plan slice: (#1652/#1676) re-bind the D36 Evidence-artifacts duty row to the landed
  normative homes — ADR 0044, `skills/survey-corps/SKILL.md`, and the clustered filing
  prompt surface — not just the consumption surface's one generic key. (#1683) adopt
  D35's construct-extraction idiom for all eight D36 canonical-side asserts in the same
  edit (extract the named construct's span, assert within it — locate each by heading or
  construct name in the post-plan-A tree). (#1653) fix the D36 header comment's
  parenthesized-token miscount ("two" → the true count). (#1654) fix the D35 rationale's
  wrong "End states 3/10" citation against the actual source plan rows. (#1525) make
  D33's comment true of its flat `readdirSync` (or make the walk recursive if any
  references/ subdirectory now exists — choose whichever makes comment and code agree;
  spec allows either arm). (#1488) extend D31's "Two clauses are load-bearing" lead-in
  to name the two landed intake clauses it omits. (#1521/#1689) both-ways proof for
  `D31_INTERACTIVE_ARM`'s `(?!--afk)` and the two `D22_ORDERED_SPAN` fragments
  (do-not-push refusal, leading docs(learnings) anchor): add negative-reference
  fixtures (a decoy text that the fragment alone rejects) or, where a fixture cannot
  reach, record the scratch-deletion trace and rewrite the residual-tracking comment to
  name exactly what remains unproven — no dead-weight fragment survives undocumented.
  (#1513) add a new D-row binding CONTEXT.md's Intent-ceiling latitude clause to ADR
  0013's Amendment doctrine (anchor literals copied from the post-plan-A,
  post-Phase-1-eviction merged tree — A6; Phase 1 Task 5 kept the clause hot).
- Done when: node --test skills/war/assets/skill-doc-contracts.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 3: workflow-template.test.mjs — D6 census + file-followups pins
- Files: `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`,
  `skills/war/references/file-followups.md`
- Plan slice: (#1686) pair the D6 keep-green count census with per-occurrence
  membership: each source match must fall inside a fixture-reachable dispatch-site byte
  range (derive the ranges from the named dispatch-site constructs), so an occurrence
  relocating to a comment or unreachable site reds the census rather than keeping the
  count; align the census regex with the sweep matcher (word-boundary `\b` parity);
  keep the existing re-pin-only-with-sweep-extension failure message. Both-ways:
  scratch-move one occurrence into a comment, observe red, restore. (#1587) add the
  (h2)-precedent paired pins binding (a) `agents/war-refiner.md`'s file-followups
  pointer line to `references/file-followups.md` and (b) the destination body's
  procedure clauses to the dispatched `file-followups` prompt literals built in
  `workflow-template.js` — the standing-card/dispatched-prompt coverage split made
  mechanical for this dispatch class. This task owns the card and reference file for
  any anchor-alignment touch the pins need (no Phase-2 sibling touches either; plan A's
  refiner-card edits landed before this plan launched).
- Done when: node --test skills/war/assets/workflow-template.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: doc-cli-consistency.test.mjs — posterity over CHANGELOG + the citation seam
- Files: `skills/_shared/doc-cli-consistency.test.mjs`, `CHANGELOG.md`
- Plan slice: (#1620) add CHANGELOG.md to `posterityCorpus()` per ADR 0046's ratified
  extension — scanning the Phase-1-corrected text; if the widened scan reds on
  historical entries citing concrete `docs/specs/` paths, fix those entries in this
  task as in-scope survey-derived corrections (they are the rule's exact target; this
  task owns CHANGELOG.md within Phase 2 — no collision). (#1687) fix `specCitations()`
  so a link-shaped citation with a real spec target is flagged: either re-scan the
  truncated-away tail for its own citation before the bare-mention carve-out fires, or
  make the path-capture regex non-swallowing across the `](` seam — add a fixture
  asserting the previously-swallowed shape is flagged (both-ways: the fixture is red
  with the fix reverted; note it in the done report).
- Done when: node --test skills/_shared/doc-cli-consistency.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 5: war-pipeline-structure.test.sh — the war-review flip pair
- Files: `skills/war-machine/war-pipeline-structure.test.sh`
- Plan slice: (#1656) in the WAR_REVIEW block, add the OLD-absent twin
  lacks_i on the retired 'three ratified rows' phrasing plus the 'four ratified rows'
  NEW-present pin (case-insensitive; the retirement needle class demands it) —
  authored against plan B's landed edits to this suite (A1). Both-ways: scratch-insert
  the retired phrase into `skills/war-review/SKILL.md`, observe red, restore; then
  hand-scan the WAR_REVIEW block for other unpaired flips and list stragglers as
  survey-derived corrections.
- Done when: bash skills/war-machine/war-pipeline-structure.test.sh
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 1: Version bump (all four slots + CHANGELOG head)
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`,
  `CHANGELOG.md`
- Plan slice: bump all four slots together — `plugin.json` `version`,
  `marketplace.json` `metadata.version` AND `plugins[0].version`, and the `README.md`
  `## Status` line (replace-in-place, no badge) — to the **next free patch above the
  live integration base at land time** (directive, never a resolved literal here; plan
  literals are non-authoritative). In the same commit, append the new release entry to
  `CHANGELOG.md` **newest-first** (its first version heading must equal the bumped
  `plugin.json` version — `version-slots.test.mjs` asserts this) and relocate the
  superseded README Status blurb content into that CHANGELOG entry per release
  doctrine — the relocated 0.19.x blurb is the Phase-1-corrected text (no deictic may
  regress; run the End-state-1 grep after relocation). Expected integration base: the
  tip this campaign's phases landed on — above plan B's release, itself above plan A's.
  Standalone-fallback rule: a plan run through plain `/war` resolves the next free
  patch from the four slots themselves. `version-slots.test.mjs` (lock-step + monotonic
  floor + CHANGELOG head + Status prose halves) is the arbiter. Land-time assertion
  (wholesale-omission catch — the suite alone is green at untouched slots): before
  landing, assert the resolved version **differs from the launch-base version** (a
  no-op bump is a defect).
- Done when: node --test skills/war/assets/version-slots.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Tour narrative accuracy beyond the two fixed steps: tour prose is not drift-guarded
  (only its roundLimit literal joins a watched array here) · why deferred: no tour-prose
  guard surface exists and no issue mandates one · runner: the next doc-truth sweep
  (`/survey-corps`), which is exactly how #1618/#1292 were caught.
- Lesson-body recipe soundness (#1522/#1399) in live use: the amended prepush recipe's
  fetch-refresh is proven by reading, not by a mechanized execution · why deferred:
  lesson bodies are not executable test surfaces (recorded
  process-recipe-lesson-body lesson) · runner: the next operator land that exercises
  the prepush condemnation check.
- CONTEXT.md advisory headroom durability: this plan restores ≤ 110,000 B, but the
  advisory is warn-only — future glossary growth re-erodes it silently · why deferred:
  ratchet semantics are ADR 0042's, not this plan's; no issue mandates a stricter
  advisory · runner: operator, on the next prompt-surface-budgets warning.
- README/CHANGELOG blurb truthfulness for FUTURE releases (the #1662 class): Phase 2
  Task 4 mechanizes only concrete spec-path posterity over CHANGELOG; scope-absolute
  truth stays a Status-blurb authoring-checklist duty · why deferred: checklist
  enforcement is an explicit non-goal (no issue mandates it) · runner: release author,
  each bump, via the checklist `version-slots.test.mjs` already pins.

## Notes / conscious deviations

- **Release phase added** despite spec §5's assumed omission — the assumption's own
  if-wrong arm, mandated by pipeline doctrine; recorded in the Assumptions ledger's
  retired row.
- **Movement 1 task 3 split**: the spec's single "Doctrine, glossary, lessons" front is
  decomposed into five file-disjoint tasks (Phase 1 Tasks 3–7) per its own "splittable
  at decompose" note; ADR 0047 stays with the D3 task as the spec's design tree
  requires; `workflow-template.js`'s comment rides the ADR 0018 task (#1477 couples
  them), keeping it out of every other task's footprint.
- **Five agent cards reserved, likely untouched** (A4): the D3 sentence is already
  plugin-conditioned at HEAD; the mirrors are the defect. Reserving them in Phase 1
  Task 3 keeps the fix path open without a plan amendment if the requalification
  proves otherwise.
- **#1620's CHANGELOG ownership crosses movements**: CHANGELOG.md is owned by Phase 1
  Task 1, then by Phase 2 Task 4 (latent-violation fixes), then by Phase 3 Task 1 —
  strictly phase-serial, never concurrent.
- **Unresolved evidence conflict (from the grill exchange, recorded for the worker):**
  whether `skills/war/references/refiner-recovery.md`'s header carries "at eviction
  time" at base — the grill asserted yes; the drafter's re-grep at a60221a found no hit
  in any of the three files (refiner-recovery.md, setup.md, docker-gate.md). Phase 2
  Task 1's verify-at-rebased-base wording already handles both realities: the worker
  greps each of the three at the rebased base and adds the qualifier only where
  actually missing.
- **ADR filenames verified at draft time** (`0018-war-working-branch-checkout-guard.md`,
  `0026-github-side-effects-mechanically-gated.md` at a60221a); workers still locate by
  ADR number if a rename lands first.
- **#1525 leaves the code-vs-comment choice to the worker** (make the comment true OR
  the walk recursive) — both arms satisfy the issue; the End state pins agreement, not
  the arm.
- **Spec validation criterion 2's grep form** (`grep -c` "≥ 1 each") was vacuous as
  written — CHANGELOG.md already prints 2 whole-file workflow-scaffold hits from 0.18.x
  entries — so it is transported as two region-scoped checks: End state 2 (CHANGELOG
  head entry via sed range) and End state 17 (README ## Status region).
- Line numbers cited in issues (38, 8078, …) are already rotted or will rot — every
  task anchors by named construct (`SCAN_DIRS`, `QUALIFIED_HEADERS`,
  `D22_ORDERED_SPAN`, `posterityCorpus()`, `specCitations()`, `const recovery`, the
  D-block comments), never by line.

## Open decisions — all RATIFIED (operator, interactive volley, 2026-08-25)

No open decisions remain; each row below was ratified at its provisional default and is
settled for /red-team purposes.

| Question | Options | Ratified resolution |
|---|---|---|
| #1651 shrink depth: how far below the 111,616 B advisory should the eviction land? | (a) just under advisory (~111.5 KB); (b) ≤ 110,000 B measured (~1.6 KB real headroom); (c) deep shrink toward the ×1.10 formula's implied post-shrink base (~101 KB) | **(b) ≤ 110,000 B measured** — operator-ratified (2026-08-25, interactive volley); real headroom without evicting warm entries |
| #1620 latent CHANGELOG posterity violations: fix historical entries in place, or carve out pre-rule entries? | (a) fix in place as survey-derived corrections (spec's resolution); (b) date-bounded carve-out preserving old entries verbatim | **(a) fix in place** — operator-ratified (2026-08-25, interactive volley); the entries are the rule's exact target and CHANGELOG prose truth is this plan's charter |
| #1689 unproven-fragment endgame: must every fragment end fixture-proven, or may a scratch-deletion trace + residual comment stand? | (a) fixture-proven only; (b) fixture where reachable, documented scratch-trace + named residual otherwise | **(b) fixture where reachable + documented residual** — operator-ratified (2026-08-25, interactive volley); matches the suite's existing residual-tracking comment convention; no dead weight survives undocumented either way |
