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

Plans A and B have landed (0.20.1 and 0.21.8; the campaign also landed
`2026-08-27-in-run-finding-resolution` as 0.21.0 between them): this plan's branch is cut
from plan B's tip `a8a9391` (release 0.21.8) and every edit below is authored against
that tree — pins copy bytes from it, never from issue text or from this plan's own
literals. Every count and byte figure quoted below was re-measured at `c8c22e5` (the
2026-09-03 red-team refresh); a figure a task must act on is always re-measured at the
task's rebased base. Concurrent execution is forbidden (serial merge queue would
rebase-conflict on every shared file).

Issues addressed (all 72): #1662, #1625, #1622, #1621, #1620, #1618, #1292, #1565, #1545,
#1537, #1536, #1651, #1522, #1399, #1477, #1474, #1678, #1652, #1653, #1654, #1656, #1521,
#1525, #1488, #1513, #1587, #1539, #1538, #1535, #1446, #1542, #1673, #1675, #1676, #1677,
#1683, #1686, #1687, #1689; plus the operator-ratified 2026-08-25 fold batch (see Notes):
#1695, #1705, #1706, #1707, #1708, #1709; plus the operator-ratified 2026-08-27 fold
batch 2 (see Notes — 27 doc-truth/comment-lag `war-followup` issues from the
engine-reliability campaign, prose/comment-only, no behavior change): #1737, #1738,
#1740, #1741, #1742, #1743, #1744, #1752, #1764, #1765, #1766, #1769, #1771, #1772,
#1791, #1793, #1800, #1801, #1802, #1804, #1812, #1814, #1817, #1832, #1841, #1842,
#1843.

## Context — the gap / problem

Two intertwined classes of documentation debt; their coupling dictates the two-movement
shape (fix prose, then pin the corrected prose — pin-after-fix, always).

**Class 1 — prose that is false or lagging at HEAD.**

- The CHANGELOG `## 0.19.0` entry — locate it by heading, never by position (the 0.20.0
  release relocated the 0.19.0 blurb out of README, whose `## Status` now carries the
  live head blurb and no 0.19.0 scope claim) — states an engine-scope absolute ("the run-time engine's only change is
  the clustered filing prompt's `## Evidence artifacts` emission") that omits
  `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable)
  change (verified: issue #1662 (2026-08-25); re-verified at 5aeb8b3 — the defect
  survives ONLY in CHANGELOG; the README half is moot, End state 17 retired). The
  CHANGELOG preamble's universal "each
  entry is that release's blurb as last edited before its supersession" does not cover a
  freshly-authored head entry (verified: issue #1625 (2026-08-25); preamble unchanged at
  5aeb8b3). Three relocated deictic
  self-references are false or dangling in CHANGELOG.md — "this paragraph lives in the very
  section `strip_prose` drops" (the 0.17.4 prose-stripped pin paragraph) and two "this
  README" (the 0.17.0 spec-posterity bullet, the 0.15.0 entry) (verified: issue #1622
  (2026-08-25); all three re-located by grep at 5aeb8b3 — the 0.20.0 head entry shifted
  every line number, and the two non-head homes read 0.17.4/0.17.0, not the 0.18.x/0.19.0
  homes recorded at authoring). The relocated 0.15.1 entry republishes a release-window scope
  claim false of its own `90c3b44..46d42be` window (verified: issue #1621 (2026-08-25)).
- Tour step 10 asserts a classified `gate_failed` cannot merge, omitting the
  baseline/environment-proceed carve-outs (verified: issue #1618 (2026-08-25)); the tour's
  scope-hook step anchors the `..`-traversal guard by "(line ≈51)" while the `case`
  constructs in `hooks/validate-worktree-scope.sh` sit 24–30 lines lower at c8c22e5
  (verified: issue #1292 (2026-08-25); the "(line ≈51)" literal re-confirmed at c8c22e5 — the 0.20.0 tour
  retype left it in place; the scope-hook step sits at step 14, the merge-queue step at
  step 10);
  README still narrates "a 3-round fix budget" (defaults paragraph) and the retired `--ace`
  single-attempt/whole-revert semantics (`--ace` argument row), and the tour is absent from
  `war-config.test.mjs`'s roundLimit watched-surface array (the `surfaces` array inside the
  `roundLimit default is 6` test) (verified: issue #1565 (2026-08-25)). Beyond the two
  fixed steps, the tour carries a residual rot family this same campaign's ask phases
  left behind: two stale roster-count snapshots (step 8's "default-trio fallback", step
  9's "three independent unanimous seats" — the shipped default is a five-seat roster;
  the economy preset keeps the historical quartet) and raw pattern-less step-level
  `"line"` anchors (12 step-level `"line"` keys at c8c22e5; the file's other two
  `"line"` occurrences are step 17's `selection` range coordinates, a schema-required
  construct that stays) —
  the absorb fixing them was forward-reverted at 9ce8d50 and never landed (verified:
  issue #1709 (2026-08-25)).
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
- CONTEXT.md measures 124,809 B at 5aeb8b3 (it grew +70 lines at 0.20.0 — the seven
  ask-disposition glossary terms) against
  `prompt-surface-budgets.test.mjs`'s `{ hard: 126976, advisory: 111616 }` row
  (both constants unchanged at 5aeb8b3) — past
  advisory by ~12.9 KB, only ~2.1 KB from hard; the next comparable glossary addition reds
  the suite (verified: issue #1651 (2026-08-25); bytes re-measured at 5aeb8b3).
- ADR 0018's Decision row and the `const recovery` comment in `workflow-template.js` lag
  the landed conditional branch derivation/refusal arms and the preMerged relaunch prompt
  delta (verified: issue #1477 (2026-08-25)); ADR 0026 lacks an Addendum for the
  now-existing dispatched-refiner gh-write class (file-followups) (verified: issue #1474
  (2026-08-25)); and ADR 0013's 2026-08-20 amendment still attributes the
  absorb-eligibility blockquotes to "the standing auditor card" — which the 0.20.0
  eviction emptied into `skills/war/references/disposition-eligibility.md`, leaving only
  a trigger pointer, so the amendment's attribution (and its
  standing-surface-reaches-every-seat justification) is false at the tip; the parallel
  sentence in `touched-doc-accuracy.md` was re-pointed, the ADR sibling was not
  (verified: issue #1695 (2026-08-25)).
- `skills/war/SKILL.md`'s ruled-ask filing bullet routes the filing "inside the
  preflighted per-phase gh-write batch" — but that batch executes under `## Per phase`,
  before the Checkpoint report, while a *ruled* ask exists only after the operator
  answers the strike list: temporally unsatisfiable as written, and the new gh-write
  site names no preflight of its own (the line-79 discipline); the sibling
  Follow-up-filing-floor phrasing is identically loose (verified: issue #1708
  (2026-08-25)).
- Two archived lessons carry unsound recipes:
  `docs/learnings/archive/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`
  (moved to `archive/` by the 2026-08-30 projection-tighten pass, commit 37e2ee0) still
  prescribes the range probe without the fail-closed `git fetch` refresh (verified:
  issue #1522 (2026-08-25); re-verified at c8c22e5 — zero `git fetch` hits); the archived awk lesson
  `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md` still states the
  degeneracy backwards in its frontmatter `description` ("every stdin record is new" —
  the corrected direction is every live ref reported removed); its BODY already carries
  an appended `## Correction (2026-08-15, #1399)` section fixing the mechanism sentence
  under the frozen-body convention, so the residual defect is the description alone
  (verified: issue #1399; re-measured at 5aeb8b3).
- `skills/war/references/schemas.md`'s ledger `doneWhen` row omits the value-vs-key
  boundary and backtick-stripping that `skills/war/SKILL.md`'s intake bullet specifies
  (verified: issue #1675 (2026-08-25); re-verified at 5aeb8b3 — the +11 lines schemas.md
  gained at 0.20.0 are ask-shape rows; the `doneWhen` field row still carries neither
  clause, and the SKILL.md intake bullet still states both).

**Class 2 — guards that are missing, mis-scoped, or self-describing falsely.**

- `skills/war/assets/reference-link-integrity.test.mjs`: `SCAN_DIRS = [AGENTS_DIR,
  REFERENCES_DIR]` excludes README.md's relative links from every mechanical sweep
  (verified: construct confirmed at 5aeb8b3; issue #1673 (2026-08-25)); the now-nine-entry
  `QUALIFIED_HEADERS` list (`disposition-eligibility.md` joined at 0.20.0;
  `budget-raise-floor.md`, `refiner-recovery.md`, `run-manifest.md` joined with plans
  1–2) omits two live eviction destinations (`setup.md`, `docker-gate.md`) while its
  coverage comment asserts a universal (verified: issues #1538, #1535, #1446
  (2026-08-25); nine-entry list confirmed at c8c22e5 — `refiner-recovery.md` is a member
  whose header carries the qualifier line-wrapped, invisible to a line-scoped grep);
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
  (2026-08-25); re-verified at c8c22e5 — the suite now runs through D43 plus D37a; the
  0.20.0 growth added D37–D42, which bind the seven ask-disposition glossary terms and ADR 0013's 2026-08-25
  ask amendment/ADR 0012 cross-ref (D38) only; none touches the 2026-08-17
  latitude-clause amendment or the `**Intent ceiling / plan floor**` glossary entry —
  every D36/D35/D33/D31/D22 anchor above also re-confirmed present at 5aeb8b3). The
  0.20.0 D-rows carry their own pin defects, folded in by operator ratification: D37's
  `Never-filed-unruled`/`Strike-list ruling gate` canonical-side keys
  (`/consolidation/i`, `/file-followups…dispatch/i`) are satisfied by the sibling
  Follow-up-filing-floor bullet inside the same `## Checkpoint` region — deleting the
  ask-ruling-gate bullet's own clause leaves them green — and the row's rationale
  comment claims an exclusion the code does not achieve (verified: issue #1705
  (2026-08-25)); D40's `/never filed unruled/i` key matches two independent schemas.md
  sites (the AuditVerdict `ask?` field comment and the GitHub-conventions bullet it
  names), so the named clause is not independently pinned (verified: issue #1706
  (2026-08-25)); and D19a's OLD-absent justification comment cites "the very literal
  D19's block comment quotes" — a byte-run the same commit removed from D19's comment;
  the true base carrier was CONTEXT.md's base blob (verified: issue #1707 (2026-08-25)).
- `skills/war/assets/workflow-template.test.mjs`: the D6 keep-green census is a count-only
  source pin blind to an occurrence relocating to a fixture-unreachable dispatch site,
  with a looser regex than the sweep's matcher (verified: issue #1686 (2026-08-25)); no
  test pins `agents/war-refiner.md`'s file-followups pointer to
  `references/file-followups.md` nor the destination body to the dispatched prompt
  literals (verified: issue #1587 (2026-08-25); re-verified at 5aeb8b3 —
  `workflow-template.test.mjs`'s file-followups tests exercise dispatch behavior only;
  the 0.20.0 D42 row in `skill-doc-contracts.test.mjs` pins ask-parity SENTENCES in
  `file-followups.md` and the refiner card, not the pointer/procedure parity #1587 asks).
- `skills/_shared/doc-cli-consistency.test.mjs`: `posterityCorpus()` does not scan
  CHANGELOG.md though ADR 0046's ratified extension names it (verified: issue #1620
  (2026-08-25)); `specCitations()` truncates at the first delimiter before the
  bare-mention carve-out, silently discarding link-shaped citations with real spec
  targets (verified: issue #1687 (2026-08-25); order re-confirmed in `specCitations()`
  at 5aeb8b3 — the `cut` truncation still precedes every carve-out, and
  `posterityCorpus()` pushes `README.md` but still not CHANGELOG.md).
- `skills/war-machine/war-pipeline-structure.test.sh`: the war-review three→four
  ratified-rows flip has a presence pin only, no OLD-absent `lacks_i` twin, and this
  suite is its only possible host (verified: issue #1656 (2026-08-25); at 5aeb8b3
  `skills/war-review/SKILL.md` carries the NEW "four ratified rows" phrasing and the
  suite's WAR_REVIEW block — grown at 0.20.0 with the asks-tally and grind-measurement
  row pins — still carries no `ratified rows` needle in either direction).

**Why one plan, two movements:** the pin work in Class 2 asserts the exact bytes the
Class 1 fixes rewrite. Pinning stale prose freezes the defect; fixing prose after its pin
lands means editing two surfaces per fix. Every guard is authored against the
movement-1-landed tree (phase edge between the movements). [assumed: pin-after-fix
ordering doctrine — if wrong: guard suites red on every prose correction and each fix
doubles in size]

## Pivotal constraints

- **Two movements, phase-ordered:** every prose-truth fix lands (Phase 1) before the
  guard that pins its surface (Phase 2). Guards copy bytes from the merged Phase-1 tree,
  never from issue text (§3 rule 7 satisfied by the phase edge, with one sanctioned
  in-phase exception — the Phase 1 Task 1 → Task 2 README guard pair, split by an
  explicit deps edge; the only same-task pairs are self-authored, e.g. Phase 2
  Task 1's "at eviction time" header qualifications pinned by the same task's
  `QUALIFIED_HEADERS` extension).
- **Shared-suite serialization:** all Phase-2 edits to `skill-doc-contracts.test.mjs` are
  one task; likewise `reference-link-integrity.test.mjs`, `workflow-template.test.mjs`,
  `doc-cli-consistency.test.mjs`, `war-pipeline-structure.test.sh` — one owning task each.
  Sanctioned exception (the Phase-1 preamble's lock-step rule): Phase 1 Task 8's #1708
  rewrite moves the D37/D41 pin keys over the same bytes in the SAME commit — a coupling
  updated lock-step, never a second owner (no Phase-1 sibling touches the suite;
  Phase 2 Task 2 then reads the Phase-1-landed suite, phase-serial).
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
- **Lesson amendments preserve provenance:** both lessons are archived, so both take
  the frozen-body convention — #1522 lands as an appended dated `## Correction` section
  (the awk lesson's own precedent) plus a description touch, #1399 touches the
  description only; `metadata.provenance` and slugs unchanged; both stay in
  `archive/`; edits must pass `war-memory lint`.
- **ADR amendments are addenda, never rewrites of ratified text** (#1474 requests the
  0013-style Addendum form; #1477 an amendment row; #1537 a scope qualification appended
  to item 1, not a rewrite of it).
- **New guards must be both-ways proven** (the #1689 class): every added regex fragment
  or pin carries a negative reference (fixture or scratch-deletion trace recorded in the
  done report); no new dead-weight fragments.
- **Cross-plan contention:** see the stacking preamble — this plan launches only after
  plans A and B land.
- **check: transport:** one command per End-state row; no backticks inside check
  strings; `grep -F` for `# Doc-truth and drift-guard debt — fix the prose first, then pin it

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

Plans A and B have landed (0.20.1 and 0.21.8; the campaign also landed
`2026-08-27-in-run-finding-resolution` as 0.21.0 between them): this plan's branch is cut
from plan B's tip `a8a9391` (release 0.21.8) and every edit below is authored against
that tree — pins copy bytes from it, never from issue text or from this plan's own
literals. Every count and byte figure quoted below was re-measured at `c8c22e5` (the
2026-09-03 red-team refresh); a figure a task must act on is always re-measured at the
task's rebased base. Concurrent execution is forbidden (serial merge queue would
rebase-conflict on every shared file).

Issues addressed (all 72): #1662, #1625, #1622, #1621, #1620, #1618, #1292, #1565, #1545,
#1537, #1536, #1651, #1522, #1399, #1477, #1474, #1678, #1652, #1653, #1654, #1656, #1521,
#1525, #1488, #1513, #1587, #1539, #1538, #1535, #1446, #1542, #1673, #1675, #1676, #1677,
#1683, #1686, #1687, #1689; plus the operator-ratified 2026-08-25 fold batch (see Notes):
#1695, #1705, #1706, #1707, #1708, #1709; plus the operator-ratified 2026-08-27 fold
batch 2 (see Notes — 27 doc-truth/comment-lag `war-followup` issues from the
engine-reliability campaign, prose/comment-only, no behavior change): #1737, #1738,
#1740, #1741, #1742, #1743, #1744, #1752, #1764, #1765, #1766, #1769, #1771, #1772,
#1791, #1793, #1800, #1801, #1802, #1804, #1812, #1814, #1817, #1832, #1841, #1842,
#1843.

## Context — the gap / problem

Two intertwined classes of documentation debt; their coupling dictates the two-movement
shape (fix prose, then pin the corrected prose — pin-after-fix, always).

**Class 1 — prose that is false or lagging at HEAD.**

- The CHANGELOG `## 0.19.0` entry — locate it by heading, never by position (the 0.20.0
  release relocated the 0.19.0 blurb out of README, whose `## Status` now carries the
  live head blurb and no 0.19.0 scope claim) — states an engine-scope absolute ("the run-time engine's only change is
  the clustered filing prompt's `## Evidence artifacts` emission") that omits
  `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable)
  change (verified: issue #1662 (2026-08-25); re-verified at 5aeb8b3 — the defect
  survives ONLY in CHANGELOG; the README half is moot, End state 17 retired). The
  CHANGELOG preamble's universal "each
  entry is that release's blurb as last edited before its supersession" does not cover a
  freshly-authored head entry (verified: issue #1625 (2026-08-25); preamble unchanged at
  5aeb8b3). Three relocated deictic
  self-references are false or dangling in CHANGELOG.md — "this paragraph lives in the very
  section `strip_prose` drops" (the 0.17.4 prose-stripped pin paragraph) and two "this
  README" (the 0.17.0 spec-posterity bullet, the 0.15.0 entry) (verified: issue #1622
  (2026-08-25); all three re-located by grep at 5aeb8b3 — the 0.20.0 head entry shifted
  every line number, and the two non-head homes read 0.17.4/0.17.0, not the 0.18.x/0.19.0
  homes recorded at authoring). The relocated 0.15.1 entry republishes a release-window scope
  claim false of its own `90c3b44..46d42be` window (verified: issue #1621 (2026-08-25)).
- Tour step 10 asserts a classified `gate_failed` cannot merge, omitting the
  baseline/environment-proceed carve-outs (verified: issue #1618 (2026-08-25)); the tour's
  scope-hook step anchors the `..`-traversal guard by "(line ≈51)" while the `case`
  constructs in `hooks/validate-worktree-scope.sh` sit 24–30 lines lower at c8c22e5
  (verified: issue #1292 (2026-08-25); the "(line ≈51)" literal re-confirmed at c8c22e5 — the 0.20.0 tour
  retype left it in place; the scope-hook step sits at step 14, the merge-queue step at
  step 10);
  README still narrates "a 3-round fix budget" (defaults paragraph) and the retired `--ace`
  single-attempt/whole-revert semantics (`--ace` argument row), and the tour is absent from
  `war-config.test.mjs`'s roundLimit watched-surface array (the `surfaces` array inside the
  `roundLimit default is 6` test) (verified: issue #1565 (2026-08-25)). Beyond the two
  fixed steps, the tour carries a residual rot family this same campaign's ask phases
  left behind: two stale roster-count snapshots (step 8's "default-trio fallback", step
  9's "three independent unanimous seats" — the shipped default is a five-seat roster;
  the economy preset keeps the historical quartet) and raw pattern-less step-level
  `"line"` anchors (12 step-level `"line"` keys at c8c22e5; the file's other two
  `"line"` occurrences are step 17's `selection` range coordinates, a schema-required
  construct that stays) —
  the absorb fixing them was forward-reverted at 9ce8d50 and never landed (verified:
  issue #1709 (2026-08-25)).
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
- CONTEXT.md measures 124,809 B at 5aeb8b3 (it grew +70 lines at 0.20.0 — the seven
  ask-disposition glossary terms) against
  `prompt-surface-budgets.test.mjs`'s `{ hard: 126976, advisory: 111616 }` row
  (both constants unchanged at 5aeb8b3) — past
  advisory by ~12.9 KB, only ~2.1 KB from hard; the next comparable glossary addition reds
  the suite (verified: issue #1651 (2026-08-25); bytes re-measured at 5aeb8b3).
- ADR 0018's Decision row and the `const recovery` comment in `workflow-template.js` lag
  the landed conditional branch derivation/refusal arms and the preMerged relaunch prompt
  delta (verified: issue #1477 (2026-08-25)); ADR 0026 lacks an Addendum for the
  now-existing dispatched-refiner gh-write class (file-followups) (verified: issue #1474
  (2026-08-25)); and ADR 0013's 2026-08-20 amendment still attributes the
  absorb-eligibility blockquotes to "the standing auditor card" — which the 0.20.0
  eviction emptied into `skills/war/references/disposition-eligibility.md`, leaving only
  a trigger pointer, so the amendment's attribution (and its
  standing-surface-reaches-every-seat justification) is false at the tip; the parallel
  sentence in `touched-doc-accuracy.md` was re-pointed, the ADR sibling was not
  (verified: issue #1695 (2026-08-25)).
- `skills/war/SKILL.md`'s ruled-ask filing bullet routes the filing "inside the
  preflighted per-phase gh-write batch" — but that batch executes under `## Per phase`,
  before the Checkpoint report, while a *ruled* ask exists only after the operator
  answers the strike list: temporally unsatisfiable as written, and the new gh-write
  site names no preflight of its own (the line-79 discipline); the sibling
  Follow-up-filing-floor phrasing is identically loose (verified: issue #1708
  (2026-08-25)).
- Two archived lessons carry unsound recipes:
  `docs/learnings/archive/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`
  (moved to `archive/` by the 2026-08-30 projection-tighten pass, commit 37e2ee0) still
  prescribes the range probe without the fail-closed `git fetch` refresh (verified:
  issue #1522 (2026-08-25); re-verified at c8c22e5 — zero `git fetch` hits); the archived awk lesson
  `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md` still states the
  degeneracy backwards in its frontmatter `description` ("every stdin record is new" —
  the corrected direction is every live ref reported removed); its BODY already carries
  an appended `## Correction (2026-08-15, #1399)` section fixing the mechanism sentence
  under the frozen-body convention, so the residual defect is the description alone
  (verified: issue #1399; re-measured at 5aeb8b3).
- `skills/war/references/schemas.md`'s ledger `doneWhen` row omits the value-vs-key
  boundary and backtick-stripping that `skills/war/SKILL.md`'s intake bullet specifies
  (verified: issue #1675 (2026-08-25); re-verified at 5aeb8b3 — the +11 lines schemas.md
  gained at 0.20.0 are ask-shape rows; the `doneWhen` field row still carries neither
  clause, and the SKILL.md intake bullet still states both).

**Class 2 — guards that are missing, mis-scoped, or self-describing falsely.**

- `skills/war/assets/reference-link-integrity.test.mjs`: `SCAN_DIRS = [AGENTS_DIR,
  REFERENCES_DIR]` excludes README.md's relative links from every mechanical sweep
  (verified: construct confirmed at 5aeb8b3; issue #1673 (2026-08-25)); the now-nine-entry
  `QUALIFIED_HEADERS` list (`disposition-eligibility.md` joined at 0.20.0;
  `budget-raise-floor.md`, `refiner-recovery.md`, `run-manifest.md` joined with plans
  1–2) omits two live eviction destinations (`setup.md`, `docker-gate.md`) while its
  coverage comment asserts a universal (verified: issues #1538, #1535, #1446
  (2026-08-25); nine-entry list confirmed at c8c22e5 — `refiner-recovery.md` is a member
  whose header carries the qualifier line-wrapped, invisible to a line-scoped grep);
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
  (2026-08-25); re-verified at c8c22e5 — the suite now runs through D43 plus D37a; the
  0.20.0 growth added D37–D42, which bind the seven ask-disposition glossary terms and ADR 0013's 2026-08-25
  ask amendment/ADR 0012 cross-ref (D38) only; none touches the 2026-08-17
  latitude-clause amendment or the `**Intent ceiling / plan floor**` glossary entry —
  every D36/D35/D33/D31/D22 anchor above also re-confirmed present at 5aeb8b3). The
  0.20.0 D-rows carry their own pin defects, folded in by operator ratification: D37's
  `Never-filed-unruled`/`Strike-list ruling gate` canonical-side keys
  (`/consolidation/i`, `/file-followups…dispatch/i`) are satisfied by the sibling
  Follow-up-filing-floor bullet inside the same `## Checkpoint` region — deleting the
  ask-ruling-gate bullet's own clause leaves them green — and the row's rationale
  comment claims an exclusion the code does not achieve (verified: issue #1705
  (2026-08-25)); D40's `/never filed unruled/i` key matches two independent schemas.md
  sites (the AuditVerdict `ask?` field comment and the GitHub-conventions bullet it
  names), so the named clause is not independently pinned (verified: issue #1706
  (2026-08-25)); and D19a's OLD-absent justification comment cites "the very literal
  D19's block comment quotes" — a byte-run the same commit removed from D19's comment;
  the true base carrier was CONTEXT.md's base blob (verified: issue #1707 (2026-08-25)).
- `skills/war/assets/workflow-template.test.mjs`: the D6 keep-green census is a count-only
  source pin blind to an occurrence relocating to a fixture-unreachable dispatch site,
  with a looser regex than the sweep's matcher (verified: issue #1686 (2026-08-25)); no
  test pins `agents/war-refiner.md`'s file-followups pointer to
  `references/file-followups.md` nor the destination body to the dispatched prompt
  literals (verified: issue #1587 (2026-08-25); re-verified at 5aeb8b3 —
  `workflow-template.test.mjs`'s file-followups tests exercise dispatch behavior only;
  the 0.20.0 D42 row in `skill-doc-contracts.test.mjs` pins ask-parity SENTENCES in
  `file-followups.md` and the refiner card, not the pointer/procedure parity #1587 asks).
- `skills/_shared/doc-cli-consistency.test.mjs`: `posterityCorpus()` does not scan
  CHANGELOG.md though ADR 0046's ratified extension names it (verified: issue #1620
  (2026-08-25)); `specCitations()` truncates at the first delimiter before the
  bare-mention carve-out, silently discarding link-shaped citations with real spec
  targets (verified: issue #1687 (2026-08-25); order re-confirmed in `specCitations()`
  at 5aeb8b3 — the `cut` truncation still precedes every carve-out, and
  `posterityCorpus()` pushes `README.md` but still not CHANGELOG.md).
- `skills/war-machine/war-pipeline-structure.test.sh`: the war-review three→four
  ratified-rows flip has a presence pin only, no OLD-absent `lacks_i` twin, and this
  suite is its only possible host (verified: issue #1656 (2026-08-25); at 5aeb8b3
  `skills/war-review/SKILL.md` carries the NEW "four ratified rows" phrasing and the
  suite's WAR_REVIEW block — grown at 0.20.0 with the asks-tally and grind-measurement
  row pins — still carries no `ratified rows` needle in either direction).

**Why one plan, two movements:** the pin work in Class 2 asserts the exact bytes the
Class 1 fixes rewrite. Pinning stale prose freezes the defect; fixing prose after its pin
lands means editing two surfaces per fix. Every guard is authored against the
movement-1-landed tree (phase edge between the movements). [assumed: pin-after-fix
ordering doctrine — if wrong: guard suites red on every prose correction and each fix
doubles in size]

## Pivotal constraints

- **Two movements, phase-ordered:** every prose-truth fix lands (Phase 1) before the
  guard that pins its surface (Phase 2). Guards copy bytes from the merged Phase-1 tree,
  never from issue text (§3 rule 7 satisfied by the phase edge, with one sanctioned
  in-phase exception — the Phase 1 Task 1 → Task 2 README guard pair, split by an
  explicit deps edge; the only same-task pairs are self-authored, e.g. Phase 2
  Task 1's "at eviction time" header qualifications pinned by the same task's
  `QUALIFIED_HEADERS` extension).
- **Shared-suite serialization:** all Phase-2 edits to `skill-doc-contracts.test.mjs` are
  one task; likewise `reference-link-integrity.test.mjs`, `workflow-template.test.mjs`,
  `doc-cli-consistency.test.mjs`, `war-pipeline-structure.test.sh` — one owning task each.
  Sanctioned exception (the Phase-1 preamble's lock-step rule): Phase 1 Task 8's #1708
  rewrite moves the D37/D41 pin keys over the same bytes in the SAME commit — a coupling
  updated lock-step, never a second owner (no Phase-1 sibling touches the suite;
  Phase 2 Task 2 then reads the Phase-1-landed suite, phase-serial).
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
- **Lesson amendments preserve provenance:** both lessons are archived, so both take
  the frozen-body convention — #1522 lands as an appended dated `## Correction` section
  (the awk lesson's own precedent) plus a description touch, #1399 touches the
  description only; `metadata.provenance` and slugs unchanged; both stay in
  `archive/`; edits must pass `war-memory lint`.
- **ADR amendments are addenda, never rewrites of ratified text** (#1474 requests the
  0013-style Addendum form; #1477 an amendment row; #1537 a scope qualification appended
  to item 1, not a rewrite of it).
- **New guards must be both-ways proven** (the #1689 class): every added regex fragment
  or pin carries a negative reference (fixture or scratch-deletion trace recorded in the
  done report); no new dead-weight fragments.
- **Cross-plan contention:** see the stacking preamble — this plan launches only after
  plans A and B land.
-bearing literals; case-insensitive greps (`-i`) for every
  retirement needle, anchored on a mid-sentence token (the sentence-case false-negative
  class); every "N hits at base" figure below was measured at c8c22e5.

## Resolved design tree

| Decision | Resolution |
|---|---|
| One sweep or per-issue commits for CHANGELOG prose? | One CHANGELOG+README task (#1662/#1625/#1622/#1621 + README half of #1565) — all four issues edit overlapping regions of two files |
| Where does the D3-fallback wording fix land? | Authority surface first (`worker-servitor-edges.md` header), then mirrors (plan doc, ADR 0047, agent cards only if a wording touch proves necessary) in the same task, per #1678's authority-first rule |
| #1537 with the D3 task or the ADR task? | With the D3 task — #1545 and #1537 both edit ADR 0047; same-file ⇒ same task |
| #1651 eviction destination | `skills/war/references/glossary-cold.md` (existing destination, already in `QUALIFIED_HEADERS`); targets chosen at implementation from coldest glossary entries not covered by live drift-guard keys |
| #1565's test half (tour into `war-config.test.mjs`) | Rides the tour task in Phase 1 — `war-config.test.mjs` is owned by no Phase-2 task, so no collision; the tour joins the `surfaces` array inside the `roundLimit default is 6` test with a NEW-present/OLD-absent pattern pair |
| QUALIFIED_HEADERS: narrow comment or widen list (#1446's three options)? | Widen the list to the two missing destinations (`setup.md`, `docker-gate.md` — `refiner-recovery.md` already joined with plan 1) and qualify their headers "at eviction time" (#1535's shape); the comment then becomes true without narrowing |
| D36 re-bind shape (#1652/#1676/#1683) | Widen the Evidence-artifacts row to the landed normative homes AND adopt D35's construct-extraction idiom for all eight canonical-side asserts in the same edit |
| #1675: extend the schemas.md row or register an ADR-0025 mirror pair? | Extend the row's parenthetical (Phase 1); mirror registration deferred — the sibling spec owns mirror-registry policy [assumed: cheapest sufficient fix — if wrong: register the pair as a follow-up row in Phase 2 Task 2] |
| #1673 scope | Add README.md (root-level `*.md`) to the sweep alongside `SCAN_DIRS`, preserving the directory-scan design |
| #1620 (CHANGELOG in `posterityCorpus()`) | RETIRED at the 2026-09-03 red-team: ADR 0046 never names CHANGELOG — its ratified extension is README, and its Consequences explicitly exclude historical-record surfaces (plans, red-team reports, ADRs) from the posterity rule, the class CHANGELOG belongs to; the base also carries zero would-be violations. No corpus widening; #1620 closes on that record. Phase 2 Task 4 keeps only the #1687 seam fix |
| Release phase in this plan? | Yes, directive form (Phase 3) — pipeline doctrine gives each stacked plan its own trailing four-slot bump; the spec's no-release-phase assumption is retired (its own "if wrong" arm) |
| #1651 shrink depth | Below advisory with real headroom: target ≤ 110,000 B measured, floor = strictly < 111,616 B (provisional default — see Open decisions) |

## Assumptions ledger

| # | Assumption | If wrong |
|---|---|---|
| A1 | Campaign serialization: this plan's guard-suite edits land strictly after plans A and B (carried from the spec's dependsOn row) | Rebase conflicts in the serial merge queue on every shared suite file; pins authored against a stale tree |
| A2 | Pin-after-fix is the ordering doctrine — guards are authored against post-fix bytes only (carried from spec §1) | Guard suites red on every prose correction; each fix doubles in size |
| A3 | #1675's cheapest sufficient fix is the parenthetical extension; formal ADR-0025 mirror registration belongs to the sibling spec (carried from spec §3) | Register the pair as a follow-up row in Phase 2 Task 2 |
| A4 | The five agent cards' D3 sentence itself needs no wording change — it is already plugin-repo-conditioned; only the header/plan/ADR mirrors overstate it [re-verified at 5aeb8b3: all five cards carry the "plugin itself" conditioning — if wrong: Phase 1 Task 3 touches the cards too (they are in its Files reservation) and Phase 2 Task 1 copies the changed sentence] | Phase 1 Task 3 edits all five cards; the #1539 pin still copies from the merged tree, so no downstream change |
| A5 | Enough CONTEXT.md glossary content is genuinely cold and un-pinned to free the needed net bytes: ≥ 14.9 KB net (evicted minus pointer bytes) for the ≤ 110,000 B default target, ≥ 13.2 KB net for the bare advisory floor (base re-measured 124,912 B at c8c22e5 vs advisory 111,616 B — ≥ 14,912 B net for the 110,000 B target, ≥ 13,297 B net for the advisory floor; the 0.20.0 glossary growth deepened the required eviction by ~3.3 KB, and the seven ask-disposition terms are D37-pinned, so the un-pinned cold pool did NOT grow with the file; re-measure at the task base) [assumed: from budget math at c8c22e5] | Evict to the reachable floor, record the measured shortfall in the done report, and escalate the residual target to the Lead rather than evicting pinned bytes |
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
- **Method:** two movements with a hard phase edge. Movement 1 (Phase 1, ten
  file-disjoint tasks) fixes prose truth: the CHANGELOG/README release-prose sweep, tour
  carve-outs + construct anchor + the whole-tour pattern-only-anchor pass + roster-count
  de-snapshot + watched-surface join, D3-fallback requalification
  authority-first, ADR 0018/0026 amendments + the ADR 0013 eligibility-attribution
  correction note + the `const recovery` comment, the
  CONTEXT.md _Avoid_ marker + ADR-0042 byte-identical eviction into `glossary-cold.md`
  measured back under the advisory line, two lesson amendments, the schemas.md
  `doneWhen` parenthetical + fold-batch-2 rows, the SKILL.md ruled-ask filing bullet
  rewritten as its own preflighted gh-write site with its pin keys moved lock-step, the
  budget-floor doc coherence pass (refiner-card pointers, budget-raise-floor header,
  ADR 0048 citation, CLAUDE.md fifth floor), and the provision-worktrees comment/banner
  truth. Movement 2 (Phase 2, five file-disjoint suite tasks — one
  owning task per suite) pins the corrected bytes: README joins the link sweep + the
  five-card D3 guard + `QUALIFIED_HEADERS` widened + literal-bytes positive control +
  whole-text retirement scan; D36 re-bound to the normative homes with
  construct-extraction + comment-truth fixes (D19a's included) + both-ways proof
  fixtures + the D37 canonical-key re-scope + the D40 key uniquified + the #1513
  mirror row; the D6 census made relocation-blind-proof + the file-followups paired
  pins; the `specCitations()` seam fix (the CHANGELOG corpus widening is retired — ADR 0046
  excludes it); the war-review OLD-absent/presence pair. Folded issues with no End-state
  needle (#1772, #1804 in Task 4; #1801 in Task 5; #1842 in Task 10) are proven by the
  owning task's done-report before/after quotes, the same path Task 7's non-literal rows
  take. Phase 3 bumps the four release slots
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
  2. The CHANGELOG `## 0.19.0` entry (located by heading) names the red-team scaffold
     prompt change as engine-class, with no surviving doc-only absolute — entry-scoped
     because other entries already mention workflow-scaffold (3 whole-file hits at
     c8c22e5, none inside the 0.19.0 entry, so a whole-file grep is vacuous) ·
     check: sed -n '/^## 0\.19/,/^## /p' CHANGELOG.md | grep -c workflow-scaffold prints at least 1 (then manual survey of the 0.19.0 entry for surviving doc-only absolutes; the README half is retired — End state 17).
  3. Tour step 10 carries the baseline/environment-proceed carve-outs and the
     scope-hook step anchors the `..`-traversal guard by the `case` construct, not a
     line number ·
     check: grep -ci 'line ≈51' .tours/architect-war-system.tour | grep -qx 0 && echo ANCHOR-RETIRED prints ANCHOR-RETIRED (1 hit at c8c22e5; grep -c alone exits 1 on the desired zero count).
  4. README narrates the 6-round budget and the culprit-first ace bisection; BOTH the
     tour and README are rows in `war-config.test.mjs`'s roundLimit watched-surface
     array (README's OLD-absent /\b3-round\b/i, NEW-present from the corrected bytes);
     the retired whole-revert ace narration is gone from README and the bisection
     narration present ·
     check: node --test skills/war/assets/war-config.test.mjs && ! grep -qiF 'the ace commit is reverted' README.md && grep -qi 'bisect' README.md (the suite green with both rows present; the ace needles: 1 and 0 hits respectively at c8c22e5, so both are decisive; scratch-flipping the tour's roundLimit literal AND scratch-reinserting '3-round' into README each red the suite — traces in the done report).
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
  8. Both archived lessons state the sound recipe (fetch-refresh precondition as an
     appended dated Correction section; corrected awk degeneracy direction in the
     description) with provenance and slugs unchanged, lint-clean ·
     check: node skills/_shared/war-memory.mjs lint docs/learnings/ && grep -qi 'git fetch' docs/learnings/archive/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md && ! grep -qiF 'every stdin record is new' docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md (lint green; the two content needles are 0 and 1 hits respectively at c8c22e5, so both are decisive).
  9. The schemas.md `doneWhen` row states the value-vs-key boundary and
     backtick-stripping — row-discriminating (a pre-existing off-row 'backtick' hit
     lives in the gate-string validator comment, so a bare file grep is vacuous) ·
     check: awk '/doneWhen: null,/,/^      targetRepo/' skills/war/references/schemas.md | grep -ci backtick prints at least 1 (construct-scoped — a same-line pipe would miss a wrapped continuation; 0 at c8c22e5).
  10. README's relative links are mechanically resolved by the link-integrity sweep ·
      check: node --test skills/war/assets/reference-link-integrity.test.mjs (green; scratch-breaking one README relative link reds it — trace in the done report).
  11. The five-card D3 sentence is pinned against the merged wording;
      `QUALIFIED_HEADERS` carries every live eviction destination — the nine members at
      c8c22e5 plus `setup.md` and `docker-gate.md` (eleven) — with true coverage comment;
      the Arm-1 positive control asserts literal bytes; the no-path-form retirement
      scan is whole-text ·
      check: node --test skills/war/assets/reference-link-integrity.test.mjs (including the new named five-card D3 test; per-change scratch traces in the done report).
  12. D36 binds the normative Evidence-artifacts homes via construct extraction; the
      D36/D35/D33/D31 comments are true — D19a's OLD-absent justification comment
      included (#1707); `(?!--afk)` and both `D22_ORDERED_SPAN`
      fragments are both-ways proven; D37's canonical-side keys are scoped to the
      ask-ruling-gate bullet construct and D40's never-filed-unruled key to the
      GitHub-conventions bullet, each with a both-ways trace (#1705/#1706); the
      CONTEXT.md ↔ ADR 0013 Intent-ceiling
      latitude mirror has a drift-guard row ·
      check: node --test skills/war/assets/skill-doc-contracts.test.mjs (green; scratch-deleting the negated fragment, either D22 fragment, the ask-ruling-gate bullet's own clause, or the GitHub-conventions never-filed-unruled clause each reds at least 1 assert — proofs recorded in the residual comment and done report).
  13. The D6 census reds when a keep-green occurrence relocates outside
      fixture-reachable dispatch sites, and the refiner-card file-followups pointer +
      destination body are pinned to the dispatched prompt literals ·
      check: node --test skills/war/assets/workflow-template.test.mjs (green; the discriminating scratch proof: move the ace-bisection-subset keep-green occurrence into a comment — baseline-green under the old count-only floor, red only under the new per-occurrence membership check — trace in the done report).
  14. `specCitations()` no longer swallows link-shaped citations — proven
      non-vacuously (a green suite at a zero-violation base proves nothing): the #1687
      link-shaped fixture is red with the seam fix reverted (trace in the done report);
      the war-review block carries the OLD-absent + presence pair; and the full suites
      pass ·
      check: node --test 'skills/**/*.test.mjs' exits 0.
  15. All shell suites pass, including the widened war-review pair ·
      check: for f in $(find hooks skills -name '*.test.sh' | sort); do bash "$f" || exit 1; done exits 0 (scratch-inserting 'three ratified rows' into skills/war-review/SKILL.md reds war-pipeline-structure.test.sh — trace in the done report).
  16. All four version slots and the CHANGELOG head entry are bumped coherently to the
      next free patch above the live integration base ·
      check: node --test skills/war/assets/version-slots.test.mjs exits 0 (plus the land-time differs-from-launch-base assertion in the task).
  17. RETIRED at the 2026-08-25 refresh (5aeb8b3): the 0.20.0 release relocated the
      0.19.0 blurb out of README — `## Status` now carries the 0.20.0 (ask-disposition)
      blurb with no 0.19.0 scope claim, so #1662's README half has no remaining target;
      the relocated 0.19.0 text is CHANGELOG's second entry, covered by End state 2. No
      README edit remains for this condition (the original region-scoped
      workflow-scaffold grep would now red against the unrelated 0.20.0 blurb) ·
      check: echo RETIRED prints RETIRED (deliberately vacuous — the live half of the
      original condition is End state 2's check).
  18. ADR 0026 carries the file-followups Addendum ·
      check: grep -c -i 'addendum' docs/adr/0026-github-side-effects-mechanically-gated.md prints at least 1.
  19. The `const recovery` comment in `workflow-template.js` names the landed
      derivation/refusal arms (the widened comment must carry the literal token
      'refusal arm' — zero hits at base, so the grep is decisive; 'preMerged' alone is
      non-discriminating, it already appears in code) ·
      check: grep -c -i 'refusal arm' skills/war/assets/workflow-template.js prints at least 1 (worker confirms the hit sits in the const recovery comment block, not code).
  20. The SKILL.md ruled-ask filing routes as its own preflighted gh-write site after
      the Checkpoint ruling — the temporally-unsatisfiable per-phase-batch routing is
      retired from the ruled-ask bullet (and the sibling Follow-up-filing-floor
      phrasing corrected in the same pass), with the D37/D41 pin keys moved lock-step
      and the contracts suite green ·
      check: grep -ciF 'inside the preflighted per-phase gh-write batch' skills/war/SKILL.md | grep -qx 0 && echo OLD-ROUTING-RETIRED prints OLD-ROUTING-RETIRED (2 hits at c8c22e5 — the ruled-ask bullet and the Follow-up-filing-floor bullet; the `## Per phase` section's own batch line uses different wording and is untouched — so the zero is decisive; then manual survey of the Checkpoint section that the new routing names its own gh-preflight — a bare presence grep is vacuous, the Checkpoint section already carries 1 gh-preflight hit — and node --test skills/war/assets/skill-doc-contracts.test.mjs green proves the lock-step key moves).
  21. The tour carries no raw pattern-less `"line"` anchors and no roster-count
      snapshot words — pattern-only anchors throughout (CodeTour resolves `line`
      before `pattern`, so the keys are dropped, not supplemented), roster narration
      de-counted ("default-roster fallback"), the file still valid JSON with the
      D12/D39 step pins green ·
      check: node -e 'const t=JSON.parse(require("fs").readFileSync(".tours/architect-war-system.tour"));process.exit(t.steps.some(s=>"line" in s)?1:0)' && echo LINE-ANCHORS-RETIRED prints LINE-ANCHORS-RETIRED (12 step-level `"line"` keys at c8c22e5, so the zero is decisive; step 17's `selection` range coordinates are not step anchors and stay; then manual survey for surviving count words — 'default-trio', 'three independent').
  22. ADR 0013's 2026-08-20 amendment carries the dated correction note re-pointing
      the absorb-eligibility-block attribution to
      `references/disposition-eligibility.md`, ratified text untouched ·
      check: grep -ci 'Correction (2026-08-25)' docs/adr/0013-commanders-intent-and-disposition-routing.md prints at least 1 (zero hits at c8c22e5 — the file's 2026-08-25 heading is an Amendment, not a Correction — so the grep is decisive; skill-doc-contracts stays green per End state 12's suite run).
  23. The schemas.md fold sweep retires the two decisive stale literals (fold batch 2:
      the `run.maxParallel` row's "unthrottled" absolute — now reading "absent =
      unthrottled dispatch" after the 0.21.7 global-semaphore rewrite — and the two
      "rows stay raw" absolutes falsified by the landed filing-on-held behavior), and
      the manifest suite stays green ·
      check: ! grep -iF 'unthrottled' skills/war/references/schemas.md && ! grep -iF 'rows stay raw' skills/war/references/schemas.md && echo SCHEMAS-FOLD-CLEAN prints SCHEMAS-FOLD-CLEAN (1 and 2 hits respectively at c8c22e5, so both zeros are decisive; the seven remaining fold rows are non-literal requalifications proven by the Task 7 done report's per-issue before/after list plus bash skills/war/references/schemas-manifest.test.sh green).
  24. The retired ace-budget boundary ("remainder demotes on budget exhaustion") stays
      absent from the three rewritable prose homes and ADR 0013 carries the
      floor-retry-reserve amendment — a NO-REGRESS floor: plan 2 landed all four homes
      (#1812), verified at the plan-4 base `a8a9391` at the 2026-09-03 re-amendment ·
      check: ! grep -iF 'exhaustion demotes the remainder' skills/war/SKILL.md CONTEXT.md && ! grep -iF 'budget-exhausted remainder' skills/war/references/design.md && grep -qi 'floor-retry reserve' docs/adr/0013-commanders-intent-and-disposition-routing.md && echo ACE-BOUNDARY-RETIRED prints ACE-BOUNDARY-RETIRED (green at base by design — the ADR's 2026-08-20 rows keep their ratified text under the amendment-append convention, so the ADR needle is the amendment's presence, never the old rows' absence).
  25. The decisive engine-comment staleness literal is retired from
      `workflow-template.js` (fold batch 2: the "THREE problem classes" header
      miscount; the "six-site" and "plus the seven" fragments were already gone at
      c8c22e5 — #1814/#1817 verified-fixed, retired at the 2026-09-03 red-team) ·
      check: ! grep -i 'THREE problem classes' skills/war/assets/workflow-template.js && echo ENGINE-COMMENT-TRUTH prints ENGINE-COMMENT-TRUTH (1 hit at c8c22e5, so the zero is decisive; #1769/#1800 are qualification rewrites without a decisive retirement literal — proven by the Task 4 done report's before/after quotes; comment-only, full JS suite green).
  26. The provision-worktrees divergence-claim literals are retired — the `.sh`
      Behaviors header's "(b) diverges" solo claim and the test-suite banner's
      "EXCEPT behavior (b)" understatement both name the full divergence set (#1841,
      #1843) ·
      check: ! grep -iF '(b) diverges' skills/war/assets/provision-worktrees.sh && ! grep -iF 'EXCEPT behavior (b)' skills/war/assets/provision-worktrees.test.sh && echo PROVISION-BANNER-TRUE prints PROVISION-BANNER-TRUE (1 hit each at c8c22e5; comment/banner-only, bash skills/war/assets/provision-worktrees.test.sh green).
  27. The budget-floor doc surfaces are true (fold batch 2, Task 9): CLAUDE.md's merge-path
      floor enumeration names `assert-budget-raise-cited.sh`, `budget-rebaseline.md` cites
      ADR 0048 by number, and the refiner card no longer claims its land prompt carries
      the steps "verbatim" ·
      check: grep -q 'assert-budget-raise-cited' CLAUDE.md && ! grep -qiF 'the budget-maintenance-authority ADR' skills/war/references/budget-rebaseline.md && ! grep -qiF 'carries the same steps verbatim' agents/war-refiner.md && echo BUDGET-DOCS-TRUE prints BUDGET-DOCS-TRUE (0, 1, 1 hits respectively at c8c22e5, so all three needles are decisive; #1741's header caveat is proven by the Task 9 done report's before/after quote).

## Build order (for /war)

Phase 1 (prose truth — ten file-disjoint tasks, fully parallel except Task 2's deps
edge; the five agent cards are reserved by no task except `agents/war-refiner.md`, owned
by Task 9 alone) → Phase 2
(pins and drift guards — five file-disjoint suite tasks, fully parallel, no deps; every
pin copies bytes from the Phase-1-landed tree; phase edge, not deps, is the rule-7
mechanism) → Phase 3 (release). This plan launches only after plans A and B land (see
stacking preamble).

## Phase 1 — Prose truth (movement 1)

Ten file-disjoint tasks. Each runs `node --test 'skills/**/*.test.mjs'` and the shell
suites locally before pushing; any red pin is a coupling updated lock-step in the same
commit, never loosened.

### Task 1: Release-prose sweep (CHANGELOG.md + README.md)
- Files: `CHANGELOG.md`, `README.md`
- Plan slice: (#1662) rescope the 0.19.0 engine-scope absolute in the CHANGELOG
  `## 0.19.0` entry (locate by heading — the sentence "the run-time engine's only
  change is the clustered filing prompt's `## Evidence artifacts` emission") to name
  `skills/red-team/assets/workflow-scaffold.js`'s dispatched-prompt (executable) change.
  The README half is retired (End state 17): `## Status` carries the live head blurb
  (0.21.8 at c8c22e5) — make NO #1662 edit there; README is touched only for the #1565 half below, and the Status
  version token, heading, and checklist structure are
  pinned by `version-slots.test.mjs` and must not move. (#1625) soften the CHANGELOG
  preamble's supersession universal so it covers a freshly-authored head entry. (#1622)
  repair the three relocated deictics: the "this paragraph lives in the very section
  `strip_prose` drops" sentence in the 0.17.4 prose-stripped pin paragraph, and the two
  "this README"
  references (the 0.17.0 spec-posterity bullet, the 0.15.0 entry — homes re-located at
  5aeb8b3; locate by grep, never by entry memory) — reword each to be true from
  its CHANGELOG location. (#1621) correct the relocated 0.15.1 entry's release-window
  scope claim to be true of its own `90c3b44..46d42be` window. (#1565 README half) update
  the defaults paragraph's "a 3-round fix budget" to the landed 6-round default and
  rewrite the `--ace` argument row from single-attempt/whole-revert ("on any regression
  the ace commit is reverted" — End state 4's OLD-absent needle) to the landed
  culprit-first bisection ladder (End state 4's NEW-present 'bisect' needle) — without
  reintroducing any `RETIRED_CLAIM_SURFACES`-scanned retired phrasing (README is
  enumerated there); while in the defaults paragraph, re-verify its model/effort claims
  ("opus workers on `max` effort, opus auditors on `xhigh`") against `DEFAULTS` in
  `war-config.mjs` at the rebased base and correct them as survey-derived corrections
  if they lag. Grep floor: case-insensitive greps for 'this README', 'lives in the very
  section', '3-round', 'reverted' over both files; then hand-scan the preamble, the 0.15.x–0.19.0
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
  "(line ≈51)" literal. (#1709, operator-ratified fold) widen to the whole-tour
  pattern-only-anchor pass: drop ALL raw step-level `"line"` keys (12 at c8c22e5;
  CodeTour resolves `line` before `pattern`, so each must be dropped, not supplemented
  — give every step a `pattern` anchor derived from its file's landed bytes; step 17's
  `selection` range coordinates are not step anchors and stay). Binding guardrail for
  the patterns: same-phase siblings rewrite four of the tour's target files from the same
  frozen base (`skills/war/SKILL.md` — Task 8; `workflow-template.js` comments — Task 4;
  `agents/war-refiner.md` — Task 9; `CONTEXT.md` — Task 5), so derive every pattern
  from a byte run NO sibling touches — structural headings and code constructs (e.g.
  `## Invariants (never violate)`, `const dispositionOf = f =>`), never a prose
  sentence a sibling may reword — and record each pattern's source line in the done
  report and de-snapshot
  the two roster-count words per the mechanism-narrative discipline (step 8
  "default-trio fallback" and step 9 "three independent unanimous seats" → count-free
  "default-roster" phrasing; never re-snapshot a number) — End state 21. (#1565 tour half) add
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
  `agents/war-worker.md`, `agents/war-auditor.md`,
  `agents/war-servitor.md`, `agents/war-setup-scout.md` (four cards: reserved —
  touch ONLY if the requalification proves a card wording change necessary; A4 expects
  no card edit — re-verified at c8c22e5: all five cards carry "plugin itself";
  `agents/war-refiner.md` is NOT reserved here — Task 9 owns it under its hard byte
  ceiling; if the A4 if-wrong arm ever reaches the refiner card, route that one wording
  change through Task 9's slice, never a second owner)
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

### Task 4: ADR 0018 + 0026 amendments + the ADR 0013 correction notes + the recovery comment + fold-batch-2 comment truth
- Files: `docs/adr/0018-war-working-branch-checkout-guard.md`,
  `docs/adr/0026-github-side-effects-mechanically-gated.md`,
  `docs/adr/0013-commanders-intent-and-disposition-routing.md`,
  `skills/war/assets/workflow-template.js` (comment only),
  `skills/war/references/resume-and-recovery.md`,
  `skills/war/references/design.md`
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
  boundary. (#1695, operator-ratified fold) append a dated correction note to ADR
  0013's 2026-08-20 amendment re-pointing the absorb-eligibility-block attribution
  from "the standing auditor card" to
  `skills/war/references/disposition-eligibility.md` (the 0.20.0 eviction destination;
  the card retains only the trigger pointer) — addendum form headed
  'Correction (2026-08-25)' (End state 22's needle), ratified text untouched,
  per this plan's ADR constraint; binding pins: `skill-doc-contracts.test.mjs` reads
  this ADR (D38 binds the 2026-08-25 amendment, D19a counts the producer widening) —
  the appended note must keep that suite green (an additive dated note outside the
  pinned spans; run the full JS suite before push, per the phase preamble). Touched-doc treatment (rule 8): the recovery-arm facts are
  machine-derivable — the executable arms are already covered by
  `workflow-template.test.mjs`'s recovery tests (guard exists; this task restores
  comment truth beside it); ADR prose — explicitly-defer as in Task 3.
  Fold batch 2 (operator-ratified 2026-08-27, engine-reliability `war-followup`s —
  all comment/prose-only, re-measure every quoted literal at the rebased base per D12):
  (#1772) append a dated qualification note to ADR 0013's 2026-08-05 amendment — the
  "Whole-pass absence stays all-`deferred`" absolute now carries the landed vacuous-
  phase carve-out (zero-tasks-landed note channel); addendum form, ratified text
  untouched, same convention as the #1695 correction note above (verified: issue
  #1772 (2026-08-26)). (#1812, this task's two homes — RETIRED at the 2026-09-03 re-amendment: plan 2
  (in-run-finding-resolution, 0.21.0) landed ADR 0013's dated 2026-08-27 amendment,
  which names the floor-retry reserve as the ladder's sole stop condition and
  supersedes the 2026-08-20 rows (their ratified text stays byte-untouched by the
  amendment-append convention), and rewrote `design.md` §18 to the reserve boundary;
  verified at the plan-4 base `a8a9391`. No edit here — the worker re-verifies End
  state 24's needles at its rebased base and records the reading). (#1804) extend `resume-and-recovery.md`'s pre-launch ref-holder enumeration
  bullet with the foreign-plan never-free guardrail its engine twin (`holderFreeClause`)
  carries — scope the free to "this plan's own refs", never a foreign plan's holder
  (verified: issue #1804 (2026-08-26)). Engine comment-lag trio + two qualifications
  (`workflow-template.js`, comment-only, no executable line moves): (#1765) the entry-
  validation header's "THREE problem classes" miscount → the true count; (#1814, #1817 — RETIRED at the 2026-09-03 red-team: the "six-site" remnant now reads
  "five sites at this pin — the count is the census's, never restated here" and no
  "plus the seven" fragment survives anywhere in the file at c8c22e5; the worker records
  verified-fixed in the done report and both issues close on that record); End state 25's
  sole needle is #1765's (verified: issues #1765/#1814/#1817 (2026-08-26); #1814/#1817
  re-verified fixed at c8c22e5). (#1769) qualify
  the endState header's "Whole-pass absence stays all-'deferred'" absolute with the
  vacuous-clamp arm (the comment twin of #1772's ADR note — fix both in this one task,
  same wording direction); (#1800) verify the #1411 classification comment's grammar at
  the rebased base — the phase-6/7 polish may already have corrected it (the issue's
  quoted fragment no longer greps at the plan-1 landed tip): if broken, re-flow the
  sentence; if already correct, record verified-fixed in the done report and make no
  edit (the issue closes on that record) (verified: issues #1769/#1800 (2026-08-26)).
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
  `skill-doc-contracts.test.mjs` (D34–D37 and every other CONTEXT.md-reading row through
  D42 — D37's seven ask-disposition glossary terms joined at 0.20.0 and are NOT
  evictable — plus any row plan A adds),
  `war-config.test.mjs`'s CONTEXT.md rows, and `war-pipeline-structure.test.sh` for
  CONTEXT.md-scanning keys; the Intent-ceiling latitude clause is EXCLUDED from
  eviction (Phase 2 Task 2 pins it). Before evicting, enumerate the candidate entries
  with a measured per-entry byte count (wc -c on each extracted span) and select until
  the summed net (entry bytes minus that entry's pointer-line bytes) covers the target —
  A5's arithmetic (re-measured at c8c22e5, base 124,912 B): ≥ 14,912 B net for
  ≤ 110,000 B, ≥ 13,297 B net for the bare advisory floor — re-measure at the task base. Move each selected entry byte-identical into
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
  Fold batch 2 (operator-ratified 2026-08-27): (#1801) correct CONTEXT.md's
  **Clean handoff** glossary row — the landed filing-on-held behavior (plan-1 phase 6:
  on `held:land-failed` the follow-up filing dispatch still runs, or the handoff
  carries an explicit unfiled-followups block) falsifies the row's stricter claim; the
  `resume-and-recovery.md` sentence is the TRUE side and stays byte-untouched here
  (verified: issue #1801 (2026-08-26)). (#1812, CONTEXT home — RETIRED at the 2026-09-03 re-amendment: plan 2 landed the
  floor-retry-reserve wording in CONTEXT.md's **Ace bisection** row; verified at the
  plan-4 base `a8a9391`, no edit here). The #1801 edit is byte-additive-neutral or
  negative — it must not undo this task's eviction arithmetic (re-run wc -c after it).
- Done when: node --test skills/war/assets/prompt-surface-budgets.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 6: Lesson recipe amendments (two learnings files)
- Files: `docs/learnings/archive/prepush-condemnation-check-must-scope-full-unpushed-range-not-head-only.md`,
  `docs/learnings/archive/awk-empty-baseline-nr-fnr-degeneracy.md`
- Plan slice: (#1522) the prepush lesson is archived (moved by the 2026-08-30
  projection-tighten pass, commit 37e2ee0, with an "archived 2026-08-30" trailer), so it
  takes the frozen-body convention: append a dated `## Correction (2026-09-03, #1522)`
  section naming the fail-closed `git fetch` refresh as a precondition of the range
  probe (the recipe is unsound against a stale local remote-tracking ref without it) —
  End state 8's 'git fetch' needle — and touch the description only if it restates the
  unsound recipe; the body's original Fix/Pattern text stays frozen; the lesson stays in
  `archive/` (ruled at the 2026-09-03 red-team, AI-declared). (#1399) invert the
  archived awk lesson's frontmatter `description` to state the degeneracy in the correct
  direction (per the lesson's own appended `## Correction (2026-08-15, #1399)` section:
  every live ref reported `removed:`, not "every stdin record is new") — the body's
  mechanism sentence is ALREADY corrected by that appended section and stays frozen per
  the frozen-body convention; touch the description only (narrowed at the 2026-08-25
  refresh, measured at 5aeb8b3). Both: `metadata.provenance` and
  slugs byte-unchanged; both lessons stay under `archive/`; frontmatter stays
  parseable (keywords nested under `metadata:`). Touched-doc treatment (rule 8): lesson
  bodies are not drift-guarded by any test (the recorded
  process-recipe-lesson-body lesson says exactly this) — explicitly-defer, with the
  redaction lint as the only mechanical floor.
- Done when: node skills/_shared/war-memory.mjs lint docs/learnings/
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 7: schemas.md truth sweep — doneWhen parenthetical (#1675) + the fold-batch-2 contract rows
- Files: `skills/war/references/schemas.md`
- Plan slice: extend the ledger `doneWhen` field-comment row's parenthetical to state
  the value-vs-key parse boundary and the backtick-stripping that
  `skills/war/SKILL.md`'s intake bullet specifies — an informal-summary extension
  matching the canonical rule, not a restatement fork (cite the SKILL.md intake bullet
  as canonical, per the recorded schemas-md-ledger-row lesson). Honor A3: no mirror
  registration. Touched-doc treatment (rule 8): the parse rule is machine-derivable
  from SKILL.md — de-mirror posture (the row explicitly defers to the canonical intake
  bullet; no new pin — the sibling spec owns mirror-registry policy, deferred).
  Fold batch 2 (operator-ratified 2026-08-27) — nine schemas.md rows the
  engine-reliability campaign's gate-audits proved stale or lagging; every quoted
  literal is a dated snapshot at the plan-1 landed tip, re-measure at the rebased base
  (D12); each fix is a row requalification or additive field note, never a contract
  change: (#1738 — RETIRED at the 2026-09-03 red-team: the MergeResult section already documents
  `floor_route?` on the wire shape and a full field bullet naming 'budget-uncited' and
  the in-band route at c8c22e5; record verified-fixed in the done report, close on that
  record); (#1744) widen the `no-test` bullet's routing
  sentence to the three landed downstream arms — fix-worker sub-loop at
  primary/floor-retry sites, hard escalation at the two `*-proceed` sites, fail-open
  discard at the polish-sweep site (verified: issue #1744 (2026-08-26)); (#1752)
  replace the provenance-floor row's retired "applies only when its arg is present and
  non-empty" precondition with the D6-recalibrated scannable-intent-bearing-text gate
  (verified: issue #1752 (2026-08-26)); (#1764/#1771) correct the `handoff.endState`
  row for the landed vacuous-clamp shape — the optional third `note` key and the
  zero-tasks-landed derivation (verified: issues #1764/#1771 (2026-08-26)); (#1766)
  reword the entry-belt sentence so "`doneWhen` a string when present" no longer reads
  as refusing the ratified `doneWhen: null` the same file documents as legal
  (verified: issue #1766 (2026-08-26)); (#1791) requalify the two "rows stay raw"
  absolutes against the landed filing-on-held behavior — End state 23's second needle
  (verified: issue #1791 (2026-08-26)); (#1793) add the post-collapse `merged[]` key to
  the top-level `minorsFiled` row, matching the handoff row two lines below (verified:
  issue #1793 (2026-08-26)); (#1802, re-scoped at the 2026-09-03 red-team) retire the "unthrottled" absolute on the
  `run.maxParallel` row — the row now reads "absent = unthrottled dispatch, no preset
  sets it" after the 0.21.7 global-semaphore rewrite, and the ratified "no engine-side
  cap beyond the Workflow default" form ships on no surface — by requalifying it to the
  landed semantics: absent = no engine-side cap (the global counting semaphore is armed
  only when the key is set); keep the row byte-consistent with `design.md`'s
  `run.maxParallel` sentence at the rebased base — End state 23's first needle
  (verified: issue #1802 (2026-08-26); re-measured at c8c22e5). Cross-plan
  caution: plan A landed schemas.md edits in several phases — anchor every row by its
  field name/construct, never by line; run the manifest suite before push.
- Done when: bash skills/war/references/schemas-manifest.test.sh
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 8: SKILL.md ruled-ask filing — own preflighted gh-write site (#1708, operator-ratified fold)
- Files: `skills/war/SKILL.md`, `skills/war/assets/skill-doc-contracts.test.mjs`
  (lock-step pin-key moves only)
- Plan slice: (#1708) rewrite the Checkpoint's ruled-ask filing sentence so the filing
  is its own preflighted gh-write site executed AFTER the strike-list ruling — per the
  issue's fix shape ("file each ruled ask Lead-side in a gh-write of its own — run
  `gh-preflight.sh` first, the per-phase batch having already closed — under the same
  discipline as engine-filed follow-ups"; wording latitude per the Intent, the facts
  are the End state), retiring the temporally-unsatisfiable "inside the preflighted
  per-phase gh-write batch" routing from the ruled-ask bullet (at c8c22e5 the bullet
  reads "when filed, it files Lead-side inside the preflighted per-phase gh-write batch
  under the same discipline as engine-filed follow-ups" — the 2026-08-27 ruled-ask
  execution rewrite kept the routing defect; the rewrite must also keep that bullet's
  in-run ruled-ask execution arm intact); correct the identically-loose sibling
  Follow-up-filing-floor phrasing ("file it **now**, inside the preflighted per-phase
  gh-write batch above") in the same edit (its filing fires at the Checkpoint gate, also
  after the per-phase batch closed). The `## Per phase` section's own batch line uses
  different wording, is legitimate, and stays — End state 20 counts 2 → 0. In the
  SAME commit, move the affected `skill-doc-contracts.test.mjs` pin keys lock-step —
  D37's canonical-side keys and D41's Checkpoint pins read these very sentences; a red
  pin here is a coupling to update, never to loosen (do NOT take over Phase 2 Task 2's
  precision re-scopes — #1705/#1706/#1707 stay in Phase 2; this task moves only the
  keys its own byte changes red). Budget discipline: `skills/war/SKILL.md` carries a
  `prompt-surface-budgets.test.mjs` row — the rewrite must land at or under the
  current byte count's budget (run that suite before push). Cross-plan caution:
  plan A's Phase 3 Task 2 also touches `skills/war/SKILL.md` (launch wiring) — a
  DIFFERENT region, and plans A/B land fully before this plan launches
  (phase-serial across plans, stacking preamble); rebase-verify the Checkpoint
  section at the task base before editing. Touched-doc treatment (rule 8): the
  routing fact is pinned by the moved D37/D41 keys (guard exists, moved lock-step);
  End state 20's OLD-absent grep is the retirement floor.
  Fold batch 2 (operator-ratified 2026-08-27): (#1812, SKILL home — RETIRED at the
  2026-09-03 re-amendment: plan 2 landed the `--ace` bullet's floor-retry-reserve
  wording; verified at the plan-4 base `a8a9391`, no edit here).
- Done when: node --test skills/war/assets/skill-doc-contracts.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 9: Budget-floor doc coherence (fold batch 2)
- Files: `agents/war-refiner.md`, `skills/war/references/budget-raise-floor.md`,
  `skills/war/references/budget-rebaseline.md`, `CLAUDE.md`
- Plan slice: five engine-reliability `war-followup`s on the freshly-landed
  Budget-Raise floor's doc surfaces, all prose-only. (#1737) requalify the refiner
  card's Superproject-land pointer claim "Your dispatched land prompt carries the same
  steps verbatim" — the land-phase block was evicted, so the dispatched prompt carries
  the operative steps via the same reference, not verbatim card bytes; reword to the
  true relationship (the sibling pointer's "carries the operative rules" form is the
  house precedent, one line up at the `*-proceed` bullet) (verified: issue #1737
  (2026-08-26)). (#1740) give the Gate-contract line's trigger-less pointer its
  trigger — the fixed ADR 0042 shape is `when <trigger>, read references/<file>`; the
  two sibling pointers on the same card already carry triggers, mirror their form
  (verified: issue #1740 (2026-08-26)). BUDGET DISCIPLINE (binding): `agents/war-refiner.md`
  sits 110 B under its `prompt-surface-budgets.test.mjs` hard ceiling (36,754 B vs
  36,864 B at c8c22e5 — re-measure `wc -c` against the row's `hard` at the task base) — both card edits together must land at or under
  the ceiling (rewording, not addition; #1737's fix shortens); if a net byte increase
  proves unavoidable, evict per ADR 0042 first — an uncited ceiling raise is refused
  by the floor itself (`assert-budget-raise-cited.sh`), and a cited raise here is NOT
  pre-authorized: escalate instead. (#1741) fix `budget-raise-floor.md`'s header
  caveat, falsified by its own Gate-contract block (the byte-identity + in-page-anchor
  claim does not hold for that block) — requalify the header per the QUALIFIED_HEADERS
  "at eviction time" convention, naming the true provenance of each block (verified:
  issue #1741 (2026-08-26)). (#1743) resolve `budget-rebaseline.md`'s number-less
  "the budget-maintenance-authority ADR" citation to ADR 0048 now that the number
  exists (verified: issue #1743 (2026-08-26)). (#1742) append
  `assert-budget-raise-cited.sh` to CLAUDE.md's merge-path floor enumeration (§ Guard
  architecture — currently four floors named; the phase landed a fifth) and re-verify
  the sentence's floor descriptions still hold at the rebased base (verified: issue
  #1742 (2026-08-26); zero `assert-budget-raise-cited` hits in CLAUDE.md at c8c22e5,
  so the presence grep is decisive — End state 27's needles: this, the ADR 0048
  citation, and the refiner card's "verbatim" claim). Touched-doc treatment (rule 8): the
  floor enumeration and pointer facts are narrative over shell scripts with their own
  suites — explicitly-defer (no CLAUDE.md drift guard exists; recorded as accepted
  residual, same posture as the tour backstop).
- Done when: node --test skills/war/assets/prompt-surface-budgets.test.mjs
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 10: provision-worktrees comment truth (fold batch 2)
- Files: `skills/war/assets/provision-worktrees.sh`,
  `skills/war/assets/provision-worktrees.test.sh`
- Plan slice: four engine-reliability `war-followup`s on the phase-8 reuse-hygiene
  landing, ALL comment/banner-only — no executable line moves, the full suite stays
  green (the behavioral siblings #1823/#1839/#1840 and the marker-payload contract
  #1826 are deliberately NOT folded — they change behavior and stay on the follow-up
  ladder). (#1841) update `cmd_ensure_publication_worktree`'s header mirror claim
  ("byte-for-byte EXCEPT behavior (b)") and the test-suite banner's matching carve-out
  to name the full landed divergence set (the refinery twin now also runs
  `reuse_hygiene` on both reuse arms and emits WORKTREE_HYGIENE markers) — retire the
  literal "EXCEPT behavior (b)" understatement, End state 26's second needle
  (verified: issue #1841 (2026-08-27)). (#1843) correct the in-function Behaviors
  block header's "(b) diverges" solo claim to the true divergence pair and re-flow the
  ragged mid-clause wrap the phase-8 edit left — End state 26's first needle
  (verified: issue #1843 (2026-08-27)). (#1842) requalify the two new carve-out
  clauses' unearned "deliberately" — either cite a recorded basis (as the
  pre-existing carve-out does) or downgrade the wording to a described-not-ratified
  scope statement; never harden a scope gap into documented intent without a record
  (verified: issue #1842 (2026-08-27)). (#1832 — RETIRED at the 2026-09-03 red-team: the classifier it names lives in
  `hooks/validate-auditor-git.sh`, outside this task's files, and its comment already
  carries the corrected reason at c8c22e5; record verified-fixed in the done report,
  close on that record). Touched-doc treatment (rule 8): all four are comment truth over
  behavior the suite already pins — the suite run IS the guard; nothing new to pin.
- Done when: bash skills/war/assets/provision-worktrees.test.sh
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
  `skills/war/references/setup.md`, `skills/war/references/docker-gate.md`
- Plan slice: (#1673) add README.md to the sweep alongside `SCAN_DIRS` — preserve the
  directory-scan design (a root-level file entry joining the scan set, resolved
  repo-root-relative), so README's relative markdown links red on breakage; both-ways:
  scratch-break one README link, observe red. (#1539) add a named five-card D3-sentence
  guard asserting the (post-Phase-1) D3 fallback sentence present on all five
  `agents/*.md` cards — copy the sentence bytes from the merged tree; grep -F semantics
  for the `$`-bearing literal. (#1538/#1535/#1446) extend `QUALIFIED_HEADERS` (nine entries at c8c22e5 — widened to
  eleven) with `setup.md` and `docker-gate.md` (`refiner-recovery.md` already joined
  with plan 1 and its header already carries the qualifier, line-wrapped — see Notes);
  verify both at the rebased base with a whitespace-tolerant matcher (the suite's own
  `EVICTION_TIME_QUALIFIER`, never a line-scoped grep) and add the qualified "at
  eviction time" byte-identity claim to each header lacking it — at c8c22e5 both lack
  it, so expect two header edits, but touch only what is actually missing at the task
  base (this task owns the two references/ files — Phase 1 touches neither); rewrite the
  coverage comment so its universal is true of the widened list. (#1542) make the Arm-1
  `anchoredProbe` positive control assert `PLUGIN_ROOT_PREFIX`'s literal bytes
  (the `${CLAUDE_PLUGIN_ROOT}/` string) instead of round-tripping the constant —
  both-ways: scratch-change the constant, observe the control red. (#1677) widen
  `RETIRED_NO_PATH_FORM_CLAIM`'s scan from header regions to the
  `RETIRED_REBASING_CAVEAT` whole-text scope. Self-authored pair note: the two header
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
  (#1513) add a new D-row binding CONTEXT.md's `**Intent ceiling / plan floor**`
  glossary entry to ADR 0013's 2026-08-17 latitude-clause amendment (the suite's
  D-blocks run through D43 plus D37a at c8c22e5 — take the next free D-number; D38 binds
  only the 2026-08-25 ask amendment, D43 the #1812 reserve rows, and no existing row
  covers this mirror; anchor literals
  copied from the post-plan-A,
  post-Phase-1-eviction merged tree — A6; Phase 1 Task 5 kept the clause hot).
  Operator-ratified folds (2026-08-25 volley): (#1705) re-scope D37's
  `Never-filed-unruled`/`Strike-list ruling gate` canonical-side keys from the
  `## Checkpoint` region match to the ask-ruling-gate bullet construct itself (the
  same D35 construct-extraction idiom this task adopts for D36 — the sibling
  Follow-up-filing-floor bullet inside the region currently satisfies
  `/consolidation/i` and the file-followups-dispatch key), and fix the row's rationale
  comment that claims an exclusion the extraction does not achieve; both-ways prove
  per the #1689 convention (scratch-delete the ask bullet's own clause, observe red).
  Anchor against the POST-Task-8 bytes — Phase 1 Task 8 rewrites these very sentences
  and moves the keys lock-step; this task then narrows their scope (phase edge, rule
  7). (#1706) uniquify D40's `/never filed unruled/i` key by scoping it to the
  schemas.md GitHub-conventions bullet construct (the AuditVerdict `ask?` field
  comment carries the same phrase — a whole-file match passes with the named clause
  deleted); scratch-deletion both-ways trace in the done report. (#1707) fix D19a's
  OLD-absent justification comment to cite the true base carrier — CONTEXT.md's base
  blob (`_Avoid_ … rows come only from the two named producers`) — instead of "the
  very literal D19's block comment quotes", a byte-run the same commit removed from
  D19's comment (comment-truth family, alongside #1653/#1654).
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
  refiner-card edits landed before this plan launched). Binding pin (0.20.0):
  `skill-doc-contracts.test.mjs`'s D42 row pins ask-parity sentences in BOTH files (the
  `Ruled-ask filing parity` heading, the never-filed-unruled statement, and the refiner
  card's "a parked ask is never in the batch" clause) — any anchor-alignment touch must
  keep D42 green, never reword those pinned sentences.
- Done when: node --test skills/war/assets/workflow-template.test.mjs
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4: doc-cli-consistency.test.mjs — the citation seam
- Files: `skills/_shared/doc-cli-consistency.test.mjs`
- Plan slice: (#1620 — RETIRED at the 2026-09-03 red-team: ADR 0046 never names
  CHANGELOG; its ratified extension is README and its Consequences exclude
  historical-record surfaces from the posterity rule, the class CHANGELOG belongs to;
  the base also carries zero would-be violations — no corpus widening, the issue closes
  on this record via the done report). (#1687) fix `specCitations()`
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
  superseded README Status blurb content (whatever the launch base carries — 0.21.8 at
  c8c22e5) into that CHANGELOG entry per release doctrine (no deictic may regress; run
  the End-state-1 grep after relocation). Expected integration base: the
  tip this campaign's phases landed on — plan B's tip `a8a9391` carries 0.21.8, so the
  expected result is 0.21.9 (resolve from the slots at land time, never from this
  paragraph).
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
- **Evidence conflict RE-RESOLVED (2026-09-03 red-team, measured at c8c22e5):** whether
  `skills/war/references/refiner-recovery.md`'s header carries "at eviction time" —
  the grill was RIGHT: the phrase is present, hard-wrapped across a line break ("at
  eviction\ntime"), which the drafter's line-scoped grep could not see; the suite's own
  whitespace-tolerant `EVICTION_TIME_QUALIFIER` matches it, and `refiner-recovery.md`
  already sits in `QUALIFIED_HEADERS` with the suite green. Only `setup.md` and
  `docker-gate.md` lack the phrase. Phase 2 Task 1 therefore expects two header edits;
  the recorded lesson class is the wrapped-literal vacuity
  (`a-both-ways-proof-can-be-vacuous-twice-over-normalized-extraction-and-a-wrapped-literal`).
- **ADR filenames verified at draft time and re-verified at 5aeb8b3**
  (`0018-war-working-branch-checkout-guard.md`,
  `0026-github-side-effects-mechanically-gated.md`); workers still locate by
  ADR number if a rename lands first. End state 7's needle stays decisive: at 5aeb8b3
  ADR 0018 has zero 'Amendment (2026-08-25)' hits (the 0.20.0 amendment of that date
  lives in ADR 0013, a different file), End state 19's 'refusal arm' and End state 18's
  'addendum' needles are still zero-hit in their targets.
- **#1525 leaves the code-vs-comment choice to the worker** (make the comment true OR
  the walk recursive) — both arms satisfy the issue; the End state pins agreement, not
  the arm.
- **Spec validation criterion 2's grep form** (`grep -c` "≥ 1 each") was vacuous as
  written — CHANGELOG.md already prints 2 whole-file workflow-scaffold hits from earlier
  entries — so it is transported as End state 2's region-scoped check (the CHANGELOG
  0.19.0 entry via sed range); the README-region half (End state 17) is retired at the
  2026-08-25 refresh — the 0.20.0 release removed its target from README.
- Line numbers cited in issues (38, 8078, …) are already rotted or will rot — every
  task anchors by named construct (`SCAN_DIRS`, `QUALIFIED_HEADERS`,
  `D22_ORDERED_SPAN`, `posterityCorpus()`, `specCitations()`, `const recovery`, the
  D-block comments), never by line.

- **Fold batch — operator-ratified scope additions (2026-08-25 volley):** six
  `war-followup` issues from the ask-disposition campaign folded in on operator
  approval of the refresh agent's proposal: #1695 → Phase 1 Task 4 (ADR 0013
  eligibility-attribution correction note, End state 22); #1705/#1706/#1707 → Phase 2
  Task 2 (D37 canonical-key re-scope + rationale-comment fix, D40 key uniquified,
  D19a justification-comment fix — End state 12 widened in place); #1708 → NEW Phase 1
  Task 8 (SKILL.md ruled-ask filing as its own preflighted gh-write site, lock-step
  D37/D41 pin-key moves, End state 20); #1709 → Phase 1 Task 2 widened to the
  whole-tour pattern-only-anchor pass + roster de-snapshot (End state 21). End-state
  numbering stayed append-only (20–22 new; 12 widened, none renumbered); the
  addressed-issues enumeration grew 39 → 45.

- **Fold batch 2 — operator-ratified scope additions (2026-08-27):** 27 `war-followup`
  issues from the engine-reliability campaign (plan 1 of this same campaign, landed as
  0.20.1 / PR #1847) folded in on operator approval of the Lead's categorization —
  the doc-truth/comment-lag class only, every item prose/comment-only, routed to the
  file-owning task: #1765/#1769/#1772/#1800/#1804/#1812(two homes)/#1814/#1817 →
  Phase 1 Task 4 (which gains `resume-and-recovery.md` + `design.md` in Files);
  #1801/#1812(CONTEXT home) → Phase 1 Task 5; #1738/#1744/#1752/#1764/#1766/#1771/
  #1791/#1793/#1802 → Phase 1 Task 7 (retitled to the schemas.md truth sweep);
  #1812(SKILL home) → Phase 1 Task 8; #1737/#1740/#1741/#1742/#1743 → NEW Phase 1
  Task 9; #1832/#1841/#1842/#1843 → NEW Phase 1 Task 10. End-state numbering stayed
  append-only (23–26 new, none renumbered); the addressed-issues enumeration grew
  45 → 72. #1812 was a cross-task fold (four prose homes, four owning tasks); plan 2
  (in-run-finding-resolution, 0.21.0) landed all four homes, so its rows were retired
  at the 2026-09-03 re-amendment and End state 24 became a no-regress floor.
  **Deliberate exclusions from the fold** (recorded so red-team does not re-litigate):
  #1816 and #1803 — verified ALREADY FIXED at the plan-1 landed tip (the phase-7
  absorb commit corrected the census comment; the CONTEXT Budget-Raise appositive was
  reworded in the phase-6 fold) — close-candidates at the PR #1847 merge, no plan
  work; #1826/#1828/#1829/#1830/#1823/#1839/#1840 and the whole args-preflight/
  provenance-floor/endstate-transport/test-fixture families — behavior or coverage
  changes outside this plan's doc-truth intent ceiling, left on the follow-up ladder
  (#1828 flagged separately as urgent, a confinement gap); #1811 — a standing-card
  prompt-behavior addition needing its own byte accounting on the hard-budgeted
  auditor card, surfaced to the operator rather than folded.

## Open decisions — all RATIFIED (operator, interactive volley, 2026-08-25)

No open decisions remain; each row below was ratified at its provisional default and is
settled for /red-team purposes.

| Question | Options | Ratified resolution |
|---|---|---|
| #1651 shrink depth: how far below the 111,616 B advisory should the eviction land? | (a) just under advisory (~111.5 KB); (b) ≤ 110,000 B measured (~1.6 KB real headroom); (c) deep shrink toward the ×1.10 formula's implied post-shrink base (~101 KB) | **(b) ≤ 110,000 B measured** — operator-ratified (2026-08-25, interactive volley); real headroom without evicting warm entries. Refresh note (5aeb8b3): the base grew to 124,809 B at 0.20.0, so (b) now needs ≥ 14.9 KB net from a cold un-pinned pool that did not grow (the new ask terms are D37-pinned) — the ratified target stands; if the pool runs out before 110,000 B, the escalation arm applies (A5: stop at the reachable floor, record the shortfall, escalate — never evict pinned or warm entries) |
| #1620 latent CHANGELOG posterity violations: fix historical entries in place, or carve out pre-rule entries? | (a) fix in place as survey-derived corrections (spec's resolution); (b) date-bounded carve-out preserving old entries verbatim | **(a) fix in place** — operator-ratified (2026-08-25, interactive volley). MOOT at the 2026-09-03 red-team: ADR 0046 excludes CHANGELOG from the posterity corpus, so no widening lands and the base carries zero violations to fix |
| #1689 unproven-fragment endgame: must every fragment end fixture-proven, or may a scratch-deletion trace + residual comment stand? | (a) fixture-proven only; (b) fixture where reachable, documented scratch-trace + named residual otherwise | **(b) fixture where reachable + documented residual** — operator-ratified (2026-08-25, interactive volley); matches the suite's existing residual-tracking comment convention; no dead weight survives undocumented either way |
