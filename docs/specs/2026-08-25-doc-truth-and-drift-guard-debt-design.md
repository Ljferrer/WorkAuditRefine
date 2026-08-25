# Doc-truth and drift-guard debt — fix the prose first, then pin it

dependsOn: `docs/specs/2026-08-25-authoring-doctrine-and-lint-coherence-design.md` — both specs' plans edit the shared structure suites (`skills/war/assets/skill-doc-contracts.test.mjs`, `skills/war/assets/reference-link-integrity.test.mjs`, `skills/_shared/doc-cli-consistency.test.mjs`); the campaign roadmap must serialize the two plans' guard-suite phases (shared-file contention), with this plan's guard phase landing after the sibling's suite edits or vice versa — never concurrently. [assumed: default — if wrong: rebase conflicts in the serial merge queue on every shared suite file]

Issues addressed (all 39): #1662, #1625, #1622, #1621, #1620, #1618, #1292, #1565, #1545, #1537, #1536, #1651, #1522, #1399, #1477, #1474, #1678, #1652, #1653, #1654, #1656, #1521, #1525, #1488, #1513, #1587, #1539, #1538, #1535, #1446, #1542, #1673, #1675, #1676, #1677, #1683, #1686, #1687, #1689.

## 1. Context — the gap / problem

The backlog carries two intertwined classes of documentation debt, and their coupling dictates the shape of the fix.

**Class 1 — prose that is false or lagging at HEAD.**

- The README `## Status` blurb and CHANGELOG 0.19.0 entry state a doc-only engine scope that omits `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable) change (verified: issue #1662 (2026-08-25)). The CHANGELOG preamble's universal "each entry is that release's blurb as last edited before its supersession" does not cover a freshly-authored head entry (verified: issue #1625 (2026-08-25)); three relocated deictic self-references ("this paragraph lives in the very section strip_prose drops", two "this README") are false or dangling in CHANGELOG.md (verified: issue #1622 (2026-08-25)); and the relocated 0.15.1 entry republishes a release-window scope claim false of its own `90c3b44..46d42be` window (verified: issue #1621 (2026-08-25)).
- Tour step 10 asserts a classified `gate_failed` cannot merge, omitting the baseline / environment-proceed carve-outs (verified: issue #1618 (2026-08-25)); a tour step still anchors the `..`-traversal guard by "(line ≈51)" while the `case` construct in `hooks/validate-worktree-scope.sh` sits ~10 lines lower (verified: issue #1292 (2026-08-25)); README lines ~97/147 still narrate a "3-round fix budget" and the retired `--ace` whole-revert, and the `.tour` file is absent from `war-config.test.mjs`'s watched-surface array (verified: issue #1565 (2026-08-25)).
- The D3-fallback resolution line is scoped to the plugin repo, but `skills/war/references/worker-servitor-edges.md`'s header residuals bullet, the plan mirror `docs/plans/2026-08-06-references-pointer-integrity.md`, and ADR 0047 framing present it as a general foreign-repo resolution path (verified: issue #1545 (2026-08-25); verified: issue #1678 (2026-08-25)). ADR 0047 item 1 declares ADR 0042's pointer shape "unchanged" while the same phase anchored the agent-card pointer's path half (verified: issue #1537 (2026-08-25)). CONTEXT.md's _Avoid_ list mixes an anti-pattern with a don't-confuse item without the house "not the …" marker, reading as an inversion of ADR 0047 point 1 (verified: issue #1536 (2026-08-25)).
- CONTEXT.md measures ~121.5 KB against its 126,976 B hard budget in `prompt-surface-budgets.test.mjs` — past advisory, ~5.4 KB headroom; the next comparable glossary addition reds the suite (verified: issue #1651 (2026-08-25)).
- ADR 0018's Decision row and the `const recovery` comment in `workflow-template.js` lag the landed conditional branch derivation/refusal arms and the preMerged relaunch prompt delta (verified: issue #1477 (2026-08-25)); ADR 0026 lacks an Addendum for the now-existing dispatched-refiner gh-write class (file-followups) (verified: issue #1474 (2026-08-25)).
- Two published lessons carry unsound recipes: `prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md` still prescribes the range probe without the fail-closed `git fetch` refresh (verified: issue #1522 (2026-08-25)); the archived awk lesson's frontmatter description and gotcha section still state the base/live degeneracy backwards (verified: issue #1399 (2026-08-25)).
- `skills/war/references/schemas.md`'s ledger `doneWhen` row omits the value-vs-key boundary and backtick-stripping that `skills/war/SKILL.md`'s intake bullet specifies (verified: issue #1675 (2026-08-25)).

**Class 2 — guards that are missing, mis-scoped, or self-describing falsely.**

- `reference-link-integrity.test.mjs`: `SCAN_DIRS = [AGENTS_DIR, REFERENCES_DIR]` at line 38 excludes README.md's relative links from every mechanical sweep (verified: `skills/war/assets/reference-link-integrity.test.mjs` at a60221a; issue #1673 (2026-08-25)); the five-entry `QUALIFIED_HEADERS` list omits three live eviction destinations while its coverage comment asserts a universal (verified: issues #1538, #1535, #1446 (2026-08-25)); the Arm-1 `anchoredProbe` round-trips `PLUGIN_ROOT_PREFIX` instead of asserting its literal bytes — a self-referential positive control (verified: issue #1542 (2026-08-25)); `RETIRED_NO_PATH_FORM_CLAIM` scans header regions only, narrower than the whole-file End-state grep it backstops, while sibling `RETIRED_REBASING_CAVEAT` scans whole text (verified: issue #1677 (2026-08-25)); and the D3 fallback sentence on all five agent cards has no standing guard at all (verified: issue #1539 (2026-08-25)).
- `skill-doc-contracts.test.mjs`: the D36 Evidence-artifacts duty row binds only the consumption surface on one generic key while the normative homes (ADR 0044, survey-corps SKILL.md, the clustered filing prompt) now exist unguarded (verified: issues #1652, #1676 (2026-08-25)); D36 asserts against whole canonical files, weaker than D35's construct-extraction idiom in the same file (verified: issue #1683 (2026-08-25)); the D36 header comment miscounts parenthesized-token headers ("two", actually one) (verified: issue #1653 (2026-08-25)); the D35 rationale cites "End states 3/10" wrongly (verified: issue #1654 (2026-08-25)); D33's "EVERY file under skills/war/references/" comment overstates its flat `readdirSync` (verified: issue #1525 (2026-08-25)); D31's "Two clauses are load-bearing" lead-in omits two landed intake clauses (verified: issue #1488 (2026-08-25)); `D31_INTERACTIVE_ARM`'s `(?!--afk)` gap and two `D22_ORDERED_SPAN` fragments (do-not-push refusal, leading `docs(learnings)` anchor) have no both-ways proof — dead weight fragments that red nothing on deletion (verified: issues #1521, #1689 (2026-08-25)); and the CONTEXT.md ↔ ADR 0013 Intent-ceiling latitude-clause mirror has no drift-guard row (verified: issue #1513 (2026-08-25)).
- `workflow-template.test.mjs`: the D6 keep-green census is a count-only source pin (`=== 7`) blind to an occurrence relocating to a fixture-unreachable dispatch site, with a looser regex than the sweep's matcher (verified: issue #1686 (2026-08-25)); no test pins `agents/war-refiner.md`'s file-followups pointer to `references/file-followups.md` nor the destination body to the dispatched prompt literals (verified: issue #1587 (2026-08-25)).
- `doc-cli-consistency.test.mjs`: `posterityCorpus()` does not scan CHANGELOG.md though ADR 0046's ratified extension names it (verified: issue #1620 (2026-08-25)); `specCitations()` truncates at the first delimiter before the bare-mention carve-out, silently discarding link-shaped citations with real spec targets (verified: issue #1687 (2026-08-25); truncation-before-carve-out order confirmed in `specCitations()` at a60221a).
- `war-pipeline-structure.test.sh`: the war-review three→four ratified-rows flip has a presence pin only, no OLD-absent `lacks_i` twin, and this suite is its only possible host (verified: issue #1656 (2026-08-25)).

**Why one spec:** the pin work in Class 2 asserts the exact bytes the Class 1 fixes rewrite (the D3 sentence, CONTEXT.md glossary entries, CHANGELOG prose, references/ headers). Pinning stale prose freezes the defect; fixing prose after its pin lands means editing two surfaces per fix. The #1539/#1545 pairing is the model: fix the wording, then pin the corrected wording — pin-after-fix, in that order, always [assumed: default ordering doctrine — if wrong: guard suites red on every prose correction and each fix doubles in size].

## 2. Pivotal constraints

- **Two movements, phase-ordered:** every prose-truth fix lands before the guard that pins its surface. Guards are authored against post-fix bytes only.
- **Shared-suite serialization:** all edits to `skill-doc-contracts.test.mjs` are one task; likewise `reference-link-integrity.test.mjs`, `workflow-template.test.mjs`, `doc-cli-consistency.test.mjs`, `war-pipeline-structure.test.sh` — one owning task each (code-boundary rule 1).
- **CONTEXT.md eviction discipline (ADR 0042):** #1651's shrink pass is a byte-identical move to `references/glossary-cold.md` plus trigger pointers — never a rewrite; it must not relocate any token pinned by live D34–D36 keys without this plan's later guard task re-anchoring them (phase edge, not same-task).
- **Lesson amendments preserve provenance:** #1522/#1399 edits amend Fix/Pattern/description text; `metadata.provenance` and slugs unchanged; the archived awk lesson stays in `archive/`.
- **ADR amendments are addenda, never rewrites of ratified text** (#1474 explicitly requests the 0013-style Addendum form; #1477 an amendment row).
- **New guards must be both-ways proven** (the #1689 class): every added regex fragment or pin needs a negative reference or scratch-deletion note; no new dead-weight fragments.
- **Cross-spec contention:** guard-suite phases here serialize against the sibling spec's (see dependsOn header).

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| One sweep or per-issue commits for CHANGELOG prose? | One CHANGELOG+README task (#1662/#1625/#1622/#1621 + README half of #1565) — all four issues edit overlapping regions of two files |
| Where does the D3-fallback wording fix land? | Authority surface first (`worker-servitor-edges.md` header), then mirrors (plan doc, ADR 0047, agent cards) in the same task, per #1678's authority-first rule |
| #1537 with the D3 task or the ADR task? | With the D3 task — #1545 and #1537 both edit ADR 0047; same-file ⇒ same task |
| #1651 eviction destination | `references/glossary-cold.md` (the issue's named destination); eviction targets chosen at implementation from coldest glossary entries not covered by live drift-guard keys |
| #1565's test half (tour into `war-config.test.mjs` watched-surface) | Rides the tour task in movement 1 — `war-config.test.mjs` is owned by no movement-2 task, so no collision |
| QUALIFIED_HEADERS: narrow comment or widen list (#1446's three options)? | Widen the list to the three destinations and qualify their headers "at eviction time" (#1535's shape); the comment then becomes true without narrowing |
| D36 re-bind shape (#1652/#1676/#1683) | Widen the Evidence-artifacts row to the landed normative homes AND adopt D35's construct-extraction idiom for all eight canonical-side asserts in the same edit |
| #1675: extend the schemas.md row or register an ADR-0025 mirror pair? | Extend the row's parenthetical (movement 1); mirror registration deferred — the sibling spec owns mirror-registry policy [assumed: cheapest sufficient fix — if wrong: register the pair as a follow-up row in the movement-2 guard task] |
| #1673 scope | Add README.md (root-level `*.md`) to the sweep alongside `SCAN_DIRS`, preserving directory-scan design |
| #1620 ordering | After the CHANGELOG prose sweep — extending `posterityCorpus()` to CHANGELOG.md must scan the corrected text, and any concrete-spec-path hits it finds in old entries are fixed in the guard task as survey-derived corrections |

## 4. Mechanics

**Movement 1 — prose truth (three file-disjoint work fronts):**

1. *Release prose* (`CHANGELOG.md`, `README.md`): rescope the 0.19.0 engine-scope absolute to name `workflow-scaffold.js`'s dispatched-prompt change (#1662); soften the preamble's supersession universal to cover fresh head entries (#1625); repair the three relocated deictics (#1622); correct the 0.15.1 window-scope sentence (#1621); fix README's fix-budget and `--ace` narrations (#1565 README half).
2. *Tour truth* (`.tours/architect-war-system.tour`, `skills/war/assets/war-config.test.mjs`): step 10 gains the baseline/environment-proceed carve-outs (#1618); the `..`-traversal anchor is re-derived to name the `case` construct in `hooks/validate-worktree-scope.sh`, not a line number (#1292); the tour joins `war-config.test.mjs`'s watched-surface array (#1565 tour half).
3. *Doctrine, glossary, lessons* (ADRs, CONTEXT.md, references/, docs/learnings/): D3-fallback requalification at authority-then-mirrors (#1545/#1678/#1537 — one task owning `worker-servitor-edges.md`, the 2026-08-06 plan mirror, ADR 0047, and any agent-card wording touch); ADR 0018 amendment row + `const recovery` comment widening (#1477); ADR 0026 Addendum for the file-followups gh-write class (#1474); CONTEXT.md _Avoid_ "not the …" marker (#1536) and the ADR-0042 eviction pass into `references/glossary-cold.md` with headroom re-measured against `prompt-surface-budgets.test.mjs` (#1651); lesson amendments #1522 (add the fail-closed fetch precondition to Fix/Pattern) and #1399 (invert the description + gotcha wording in the archived awk lesson); `schemas.md` `doneWhen` row parenthetical extension (#1675).

**Movement 2 — pins and drift guards (five file-disjoint suite tasks, one owning task per suite):**

1. `reference-link-integrity.test.mjs` (#1673, #1539, #1538, #1535, #1446, #1542, #1677): add root-level README.md to the scan; add the five-card D3-sentence guard against the corrected (post-movement-1) wording; extend `QUALIFIED_HEADERS` with `refiner-recovery.md`/`setup.md`/`docker-gate.md` and qualify their headers "at eviction time"; make the coverage comment true; assert `PLUGIN_ROOT_PREFIX`'s literal bytes in the Arm-1 positive control; widen `RETIRED_NO_PATH_FORM_CLAIM` to the `RETIRED_REBASING_CAVEAT` whole-text scope. Header qualifications edit the three references/ files — these are owned by this task (movement-1 task 3 does not touch them).
2. `skill-doc-contracts.test.mjs` (#1652, #1676, #1683, #1653, #1654, #1525, #1488, #1521, #1689, #1513): D36 re-bind to the landed normative homes + construct-scoping; comment-truth fixes (D36 "two headers", D35 citation, D33 census claim or recursive walk, D31 clause count); both-ways proof fixtures for `D31_INTERACTIVE_ARM`'s `(?!--afk)` and the two `D22_ORDERED_SPAN` fragments, with the residual-tracking comment rewritten to name whatever remains unproven; a new row binding CONTEXT.md's Intent-ceiling latitude clause to ADR 0013's Amendment doctrine. Largest task in the plan; internally sequenced by D-block, single worker.
3. `workflow-template.test.mjs` (+ `agents/war-refiner.md`, `skills/war/references/file-followups.md`) (#1686, #1587): pair the D6 count pin with per-occurrence membership (each source match inside a fixture-reachable dispatch-site byte range) and align the census regex (`\b`) with the sweep matcher; add the (h2)-precedent paired pins binding the refiner card's file-followups pointer and the destination body to the dispatched prompt literals.
4. `doc-cli-consistency.test.mjs` (#1620, #1687): add CHANGELOG.md to `posterityCorpus()`; fix `specCitations()` so the truncated-away tail is re-scanned for its own citation (or the path-capture regex made non-swallowing across the `](` seam) before the bare-mention carve-out fires.
5. `war-pipeline-structure.test.sh` (#1656): add the `lacks_i "three ratified rows"` OLD-absent assert plus the "four ratified rows" presence pin to the WAR_REVIEW block.

## 5. Surface changes

- `CHANGELOG.md`, `README.md` — movement 1 task 1
- `.tours/architect-war-system.tour`, `skills/war/assets/war-config.test.mjs` — movement 1 task 2
- `docs/adr/0018-…`, `docs/adr/0026-…`, `docs/adr/0047-…`, `skills/war/assets/workflow-template.js` (comment only), `skills/war/references/worker-servitor-edges.md`, `docs/plans/2026-08-06-references-pointer-integrity.md`, `CONTEXT.md`, `references/glossary-cold.md`, `skills/war/references/schemas.md`, `docs/learnings/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`, `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`, agent cards as the D3 requalification requires — movement 1 task 3 (splittable into file-disjoint subtasks at decompose)
- `skills/war/assets/reference-link-integrity.test.mjs`, `skills/war/references/refiner-recovery.md`, `skills/war/references/setup.md`, `skills/war/references/docker-gate.md` — movement 2 task 1
- `skills/war/assets/skill-doc-contracts.test.mjs` — movement 2 task 2
- `skills/war/assets/workflow-template.test.mjs`, `agents/war-refiner.md`, `skills/war/references/file-followups.md` — movement 2 task 3
- `skills/_shared/doc-cli-consistency.test.mjs` — movement 2 task 4
- `skills/war-machine/war-pipeline-structure.test.sh` — movement 2 task 5

Decomposition sketch (for /war-machine): **Phase 1** = movement 1 tasks 1–3 in parallel (file-disjoint as carved above; if task 3 splits, keep each ADR/lesson/reference file in exactly one subtask — ADR 0047 stays with the D3 subtask). **Phase 2** = movement 2 tasks 1–5 in parallel (each owns its suite file; task 1 additionally owns the three references/ headers, task 3 the refiner card + file-followups.md — no cross-task file overlap). Phase edge, not deps, between the movements: every pin is authored against landed prose. No release phase — this campaign's version bump belongs to the roadmap's trailing release plan [assumed: default — if wrong: add a trailing bump phase resolving the next free patch from the four slots at land time].

## 6. New domain terms (CONTEXT.md)

None proposed. (#1651 shrinks CONTEXT.md; adding terms would work against the budget it exists to restore.)

## 7. Recommended ADRs

None new. Existing ADRs amended in place: 0018 (amendment row, #1477), 0026 (Addendum, #1474), 0047 (item-1 scope qualification, #1537/#1545).

## 8. Open risks / implementation notes

- **Eviction vs. live pins (#1651):** D34–D36 keys and prompt-surface-budgets pins read CONTEXT.md bytes. The eviction task must run the full JS suite before merge and choose eviction targets that keep existing keys green; the byte arithmetic of the freed span is routinely optimistic (per the recorded ADR-0042 eviction lesson) — measure with `wc -c` after, not before.
- **#1539 pins wording that #1545/#1678 change:** the guard task must copy the D3 sentence from the merged movement-1 tree, never from the issue text.
- **#1620 may surface latent violations:** extending `posterityCorpus()` to CHANGELOG.md can red on historical entries citing concrete spec paths; the task fixes those entries as in-scope survey-derived corrections (they are the rule's exact target).
- **D22/D31 fixture work (#1689) can red the sibling spec's edits:** if the sibling campaign lands D31/D22 changes first, re-derive fragments against its merged shape (dependsOn header).
- **#1565 splits across two movement-1 tasks** (README half vs. tour half); the decomposer must keep both halves' issue citation so the issue closes only when both land.
- Line numbers cited in issues (38, 2055, 2112, 8078, 8092, …) rot across the serial merge queue — anchor every edit by named construct (`SCAN_DIRS`, `QUALIFIED_HEADERS`, `D22_ORDERED_SPAN`, `posterityCorpus()`, `specCitations()`, the D-block comments), never by line.

## 9. Non-goals / deferred

- Registering the schemas.md `doneWhen` row as a formal ADR-0025 mirror pair (#1675's alternative arm) — deferred to the sibling spec's mirror-registry scope.
- Any Status-blurb authoring-checklist enforcement beyond #1662's one-time correction (the #1662 clusterHint's "checklist enforcement" idea) — no issue mandates it.
- Restructuring `posterityCorpus()`/`specCitations()` beyond the two named defects.
- New CONTEXT.md glossary content of any kind.

## 10. Validation criteria

Each grep below is a completeness **floor**: after running it, hand-scan the named file's same-scope prose/tests/comments for paraphrased survivors the pattern misses, and list each straggler as a survey-derived correction in the task's done report.

1. WHEN the movement-1 CHANGELOG sweep lands THE CHANGELOG SHALL carry no false deictic or window-scope claim · check: `grep -n -i "this README\|lives in the very section" CHANGELOG.md` prints nothing (then manual same-scope survey of the preamble and 0.15.x–0.19.0 entries for other relocated deictics).
2. WHEN #1662 lands THE 0.19.0 blurb (README Status + CHANGELOG head) SHALL name the red-team scaffold prompt change as engine-class · check: `grep -c "workflow-scaffold" README.md CHANGELOG.md` ≥ 1 each, with a decisive printed count (then manual survey of both blurbs for surviving "doc-only" absolutes).
3. WHEN #1545/#1678/#1539 land THE D3-fallback wording SHALL be plugin-repo-conditioned on the authority surface and mirrors, and pinned · check: `node --test skills/war/assets/reference-link-integrity.test.mjs` green including a new named five-card D3 test (then manual survey of `worker-servitor-edges.md` and the five agent cards for unqualified residuals).
4. WHEN #1651 lands THE CONTEXT.md byte count SHALL be back under the advisory line · check: `wc -c CONTEXT.md` prints a value below the advisory threshold in `prompt-surface-budgets.test.mjs`, and `node --test 'skills/**/*.test.mjs'` green.
5. WHEN #1689/#1521 land THE named fragments SHALL be both-ways proven · check: scratch-deleting `(?!--afk)` from `D31_INTERACTIVE_ARM`, the do-not-push clause, or the leading `docs(learnings)` anchor from `D22_ORDERED_SPAN` each reds ≥ 1 assert (proof recorded in the residual comment).
6. WHEN #1686 lands THE D6 census SHALL red when a keep-green occurrence relocates outside fixture-reachable dispatch sites · check: scratch-move one occurrence in `workflow-template.js` to a comment → suite red; restore → green.
7. WHEN #1620 lands THE posterity rule SHALL cover CHANGELOG.md · check: `node --test skills/_shared/doc-cli-consistency.test.mjs` green, and a scratch concrete-spec-path line added to CHANGELOG.md reds it.
8. WHEN #1673 lands THE README links SHALL be mechanically resolved · check: scratch-breaking one README relative link reds `reference-link-integrity.test.mjs`.
9. WHEN #1656 lands THE WAR_REVIEW block SHALL carry the OLD-absent + presence pair · check: `bash skills/war-machine/war-pipeline-structure.test.sh` green; scratch-inserting "three ratified rows" into `skills/war-review/SKILL.md` reds it (then manual survey of the WAR_REVIEW block for other unpaired flips).
10. WHEN both movements land THE full suites SHALL pass · check: `node --test 'skills/**/*.test.mjs'` and `for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done` both exit 0.
