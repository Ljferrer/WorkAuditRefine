# Recovery re-merge dispatch coherence — thread submodule scoping into every retry merge, retire the stale env route in ADR 0019, un-rot the gate-capture comment

**Source issues:** #1032 (recovery re-merges omit `submodMergeNote` — submodule retry loses targetRepo
scoping), #1033 (ADR 0019 still states the retired 0-fix-round `env-blocked` route for the
`environment` class), #1034 (`gateCaptureClause` header comment names 2 of 3 consumer sites).
All three are `war-followup` findings from plan 4/9 of the 2026-07-22 run-resilience-and-hardening
campaign (merge-land-resilience); all three verified still live on the working tree at spec time.

## 1. Context — the gap / problem

Plan 4 (merge-land-resilience) rebuilt the merge-time gate-failure recovery path: an
`environment`-classified gate failure now earns exactly one bounded `environment-proceed` re-merge
(ADR 0040) instead of an immediate `env-blocked` soft escalation, alongside the pre-existing
`baseline-proceed` re-merge and the floor-retry re-merge. That change left three coherence gaps,
one in each layer of the record:

- **Dispatched-prompt gap (code, #1032).** `submodMergeNote` — the `SUBMODULE TASK` paragraph that
  threads `targetRepo`/`targetBase` so the refiner runs rebase/gate cwd-scoped to the submodule
  checkout — is built once per task in the Refine loop and appended **only to the initial
  merge-task prompt**. Every retry dispatch omits it: the `environment-proceed` re-merge, the
  `baseline-proceed` re-merge, **and** the floor-retry re-merge (a third omitting site the issue
  body does not name; found by the same-scope survey, confirmed by grep — `submodMergeNote` has
  exactly two occurrences in `skills/war/assets/workflow-template.js`, its definition and the
  initial-prompt use). A `taskType:'submodule'` task whose first merge trips a recoverable route is
  re-dispatched unscoped and would rebase/gate in the superproject worktree. Blast radius is
  bounded — the refiner fails the merge → `error` → the terminal else → soft escalation, no
  wrong-repo write — so it degrades rather than corrupts, but the environment-proceed arm made this
  newly reachable: before plan 4, submodule task + environment-class failure short-circuited to
  `env-blocked` and dispatched nothing.
- **Decision-record gap (ADR, #1033).** ADR 0019's class-routes doctrine (`## Decision`, "Class
  routes the recovery, status does not") still states `environment` → soft-escalate reusing
  `env-blocked` with **zero** fix rounds, and its `## Scope` supersession paragraph repeats "routes
  as `env-blocked`". Plan 4 replaced exactly that route (ADR 0040), but no task touched 0019 —
  Task 1.4 authored 0040 and amended 0023 only. 0040's `## Relationship to prior ADRs` section
  names 0005, 0025, 0017, 0023, 0024 — never 0019 — so a reader consulting either record from
  either end gets no pointer to the live routing.
- **Comment gap (code comment, #1034).** The `gateCaptureClause` (D5) header comment still reads
  "mirrored into the initial merge-task prompt AND the floor-retry re-merge prompt" while the same
  plan added the environment-proceed re-merge as a third consumer and bumped the mapped drift
  guard's `captureUses` assertion 2 → 3 ("ALL THREE dispatched merge sites"). Verified live: three
  `gateCaptureClause(refineryPath, r.task.id)` call sites, a comment enumerating two. The stale
  phrase wraps a line break ("the initial" / "merge-task prompt AND …"), so a single-line grep for
  the full sentence cannot find it — the exact vacuous-guard class plan 4's own End state 9 was
  patched to avoid (lesson `misattribution-pairing-spanning-two-lines-defeats-line-based-repo-grep`).

Issue bodies cite line numbers measured at the landed tip (`submodMergeNote` at :1202/:1239, the
comment at :718-719); the live tree has drifted. This spec anchors by named construct throughout
(CLAUDE.md known trap: line numbers rot across the serial merge queue).

## 2. Pivotal constraints

- **No routing change.** This spec threads *scoping prose* into already-dispatched prompts and
  repairs records/comments. The `MergeResult` status enum, `HARD_ESCALATION_REASONS`,
  `KNOWN_LAND_DECISIONS`, and every recovery route stay byte-untouched (ADR 0005 enum discipline;
  ADR 0040's bounded-retry semantics are preserved, not revisited).
- **Split prompt surfaces.** Dispatched prompts live in `workflow-template.js`; standing refiner
  instructions in `agents/war-refiner.md`. The both-surfaces rule requires a same-commit standing
  edit only when standing prose diverges. Checked at spec time: `agents/war-refiner.md`'s
  submodule section is deliberately generic — "All merge-task and land-phase steps below run with
  `<taskWorktree>` and `<_refinery>` rooted in the submodule checkout" — which already covers
  retries; the fix makes the dispatched surface match the standing claim. **No standing edit is
  needed, and this rationale is recorded so an auditor does not hold the commit for a missing
  mirror.**
- **ADRs are never retro-edited.** 0019's Decision text stays byte-intact; the repair is a dated
  amendment appended (established practice: ADR 0023 carries
  `## Amendment (2026-07-22): the push's own precondition is part of land truth` from the same
  plan 4).
- **The `captureUses` drift guard pins exactly 3 `gateCaptureClause` call sites** in
  `workflow-template.test.mjs`. Nothing here adds or removes a call site; the comment fix is
  prose-only and must leave that guard green at 3.
- **Tests must discriminate on dispatched-prompt content, not source shape.** Assert the captured
  prompt text of the retry dispatches (the repo's existing agent-stub capture harness), never a
  source-regex occurrence count (lessons `pt-tagged-prompt-value-identity-beats-whole-prompt-undefined-scan`,
  `marker-completeness-check-needs-row-scoped-grep-not-whole-file-grep-c`).
- **Comment fixes must be rot-proof.** The replacement comment states the invariant count-free and
  names the drift-guard arbiter — the treatment already given the gate composition point comment
  ("GATE COMPOSITION POINT (engine-owned, ADR 0036): normalize plan.gate ONCE here…"), which
  enumerates no consumer sites.
- **Sibling-spec contention (inverse direction only).** This group has no `dependsOn`. The sibling
  spec `docs/specs/2026-07-24-drift-guard-and-floor-diagnostic-hardening-design.md` orders itself
  *after* this one because both touch `skills/war/assets/workflow-template.test.mjs` — a
  surface-contention ordering, not a design input to anything resolved here.

## 3. Resolved design tree

| # | Decision | Options considered | Resolution + why |
|---|----------|--------------------|-------------------|
| 1 | Which dispatches gain `submodMergeNote` | (a) the two recovery re-merges the issue names (environment-proceed + baseline-proceed); (b) all three omitting sites, adding the floor-retry re-merge | **(b) all three.** The floor-retry re-merge is the same defect class at the same scope (survey-derived, §4.5); a submodule task tripping a floor would retry unscoped identically. Root-cause symmetry: after the change, *every* merge-task dispatch for the task carries the same scoping. |
| 2 | Note mechanism | (a) reuse the in-scope `submodMergeNote` const, append `+ submodMergeNote` trailing each retry prompt (mirroring the initial prompt's placement); (b) extract a helper or re-derive per site | **(a).** The const is already defined once per task iteration and in scope at all four dispatch sites; appending is the entire fix. No new helper, no signature change. |
| 3 | Regression-test shape | (a) behavioral dispatch-capture: drive a submodule-task fixture through each retry route and assert the captured prompt carries the `SUBMODULE TASK` / targetRepo line; (b) source-regex count of `submodMergeNote` occurrences | **(a), with (b) only as a validation-criteria sweep, never the test.** The harness precedent exists twice: the T4 #297 submodule threading test (asserts targetRepo in the initial merge-task/land/worker/Provision prompts) and the environment-class stub harness (dispatches by `:environment-proceed` / `:baseline-proceed` labels). A source count is blind to which prompt the token landed in. |
| 4 | `gateCaptureClause` comment repair | (a) re-enumerate all three sites; (b) drop the enumeration, state the invariant count-free and name the `captureUses` drift guard as the arbiter | **(b)** — the issue's own preferred fix. (a) rots again the next time a site is added or removed (the plan-mandated-banner-count lesson class); (b) cannot. The comment's second clause (both-surfaces rule; `agents/war-refiner.md` step 7 is the standing mirror) stays — it is accurate. |
| 5 | ADR 0019 repair vehicle | (a) amendment appended to 0019; (b) supersession bullet in 0040's `## Relationship to prior ADRs`; (c) both | **(c) both.** Readers enter from either record: 0019's reader needs the redirect at the stale doctrine's home; 0040's Relationship section is the enumeration of what it touches and currently omits the one ADR it actually supersedes a row of. Both edits are one short paragraph/bullet each; the 0023 amendment is the in-repo precedent for (a). |
| 6 | Fix baseline-proceed's missing `gateCaptureClause` while here? | (a) add it, bumping the drift guard to 4; (b) leave it | **(b) leave it.** No issue in this group raises it; the baseline-proceed proceeds over a locally-red gate, so its evidence contract differs by design (ADR 0040 relationship bullet documents which sites thread the clause). Recorded as a non-goal (§9) so the omission is visibly deliberate, not overlooked. |

## 4. Mechanics

### 4.1 `submodMergeNote` threading (`skills/war/assets/workflow-template.js`)

Append `+ submodMergeNote` as the final prompt segment (matching the initial merge-task prompt's
trailing placement) to each of the three retry dispatches, identified by their dispatch labels:

1. the floor-retry re-merge (label `merge:<taskId>:floor-retry:r<round>`),
2. the environment-proceed re-merge (label `merge:<taskId>:environment-proceed`),
3. the baseline-proceed re-merge (label `merge:<taskId>:baseline-proceed`).

`submodMergeNote` is `''` for non-submodule tasks, so every existing non-submodule prompt is
byte-identical after the change. No dispatch options, schema, or routing branches change.

### 4.2 Dispatch-capture regression tests (`skills/war/assets/workflow-template.test.mjs`)

One new test (or one per flavor, implementer's choice) using the existing agent-stub capture
harness: fixture a `taskType:'submodule'` task carrying `targetRepo`/`targetBase` (the T4 #297
fixture shape), stub the initial merge to return the triggering result for each route —
`status:'no-test'` for the floor-retry, `gate_failed` classified `environment`, and `gate_failed`
classified `baseline` (the environment-class harness already fabricates these) — and assert each
captured retry prompt (located by its dispatch label) contains the `SUBMODULE TASK` marker **and**
the fixture's `targetRepo` value. Discrimination proof: with any one of the three `+
submodMergeNote` appends mentally deleted, that route's assertion fails RED (§10.2). If the
implementer extends the existing T4 test rather than adding a sibling, its header comment's
prompt-surface enumeration ("merge-task, land, worker, and Provision prompts") must be updated in
the same commit (§4.5 survey item 2).

### 4.3 `gateCaptureClause` header comment (`skills/war/assets/workflow-template.js`)

Rewrite the two stale enumeration lines of the comment above the `gateCaptureClause` arrow to
state the invariant count-free, in the spirit of (final wording is the implementer's):

> gateCaptureClause (D5): the merge-task gate-output capture directive — threaded into EVERY
> dispatched merge-task prompt whose gate must come back green; the `captureUses` drift guard in
> `workflow-template.test.mjs` is the arbiter of the site list (never enumerate it here).

The remainder of the comment (both-surfaces rule, `agents/war-refiner.md` step 7 standing mirror,
the anti-excerpt replacement rationale, `.war/` exclusion) is accurate and stays.

### 4.4 ADR repairs

- **`docs/adr/0019-target-derived-execution-values.md`** — append a dated
  `## Amendment (2026-07-24): the environment class-route is superseded by ADR 0040` section (the
  0023 amendment shape). Body: the class-routes doctrine's `environment` row ("soft-escalate
  reusing the `env-blocked` reason with **zero** fix rounds") and the `## Scope` paragraph's
  "routes as `env-blocked`" restatement are superseded — an `environment`-classified gate failure
  now earns exactly one bounded `environment-proceed` re-run per gate site, with merge-site
  exhaustion HARD via the existing reason `'escalate'`; cite
  `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`. The original Decision text is
  not retro-edited. `introduced` and `baseline` routes are unchanged.
- **`docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`** — add one bullet to
  `## Relationship to prior ADRs`: **Supersedes one row of ADR 0019** — the class-routes
  doctrine's `environment` → 0-fix-round `env-blocked` route; 0019 carries the matching dated
  amendment; every other 0019 route (`introduced`, `baseline`, the target-derived execution
  values) stands.

### 4.5 Token sweep + mandatory same-scope survey

Sweep steps (each grep is a completeness **floor, not a ceiling** — after running it, hand-scan
the target file's same-scope tests and comments and list each straggler as a survey-derived
correction):

- `grep -n "submodMergeNote" skills/war/assets/workflow-template.js` — expect exactly 5 matches
  post-change (1 definition + 4 uses). Anchor the grep to the file, never repo-root (stale
  worktree duplicates under `.claude/worktrees/`, the known trap).
- `grep -n "env-blocked" docs/adr/0019-target-derived-execution-values.md docs/adr/0040-environment-class-gate-failures-earn-one-retry.md`
  — every 0019 match must sit either inside byte-intact original text covered by the new
  amendment, or inside the amendment itself.
- `grep -n "floor-retry\|ALL THREE\|all three\|initial merge" skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs`
  — hunting other stale merge-site enumerations. Because #1034's own stale phrase wraps a line
  break, do not trust full-sentence single-line greps; grep the short tokens above and read each
  hit in context.

**Survey performed at spec time — stragglers found and their dispositions:**

1. `classificationClause` header comment (same comment block family as `gateCaptureClause`)
   enumerates "the initial merge-task prompt, the floor-retry re-merge prompt, THE LAND PROMPT,
   and agents/war-refiner.md" — verified **accurate** (its three call sites are exactly initial
   merge, floor-retry, land). Legitimate survivor; no edit. Re-verify at implementation time.
2. The T4 #297 threading test's header comment enumerates the four prompt surfaces it asserts —
   accurate for its own scope today; becomes stale **only if** §4.2 extends that test rather than
   adding a sibling; update it in the same commit in that case.
3. The packaging-floor literal-count assertion ("exactly four dispatched packaging-floor
   invocation literals") and its neighbor comments — unaffected: appending `submodMergeNote` adds
   no packaging-floor literal. No edit.
4. The `FLOOR_SITE_RE` comment "(four at this base: initial merge, floor-retry re-merge,
   environment-proceed, baseline-proceed)" — accurate, and its regex-fragility hardening is owned
   by sibling issue #1050 (not this group). No edit here.
5. Stale copies under `.claude/worktrees/` — out of every sweep's anchored scope by design; never
   edited.

## 5. Surface changes

- `skills/war/assets/workflow-template.js` — three `+ submodMergeNote` appends (§4.1) + the
  `gateCaptureClause` header-comment rewrite (§4.3)
- `skills/war/assets/workflow-template.test.mjs` — dispatch-capture regression test(s) for the
  three retry prompts (§4.2)
- `docs/adr/0019-target-derived-execution-values.md` — appended dated amendment (§4.4)
- `docs/adr/0040-environment-class-gate-failures-earn-one-retry.md` — one Relationship bullet (§4.4)

No `agents/*.md`, `hooks/`, or `skills/war/SKILL.md` surface (§2 records why the standing refiner
doc deliberately stays untouched).

## 6. New domain terms (CONTEXT.md)

None. "Recovery re-merge", "environment-proceed", "baseline-proceed", and "floor-retry" are
existing vocabulary from plan 4 / ADR 0040.

## 7. Recommended ADRs

No new ADR. The decision content is an amendment to ADR 0019 plus a cross-reference in ADR 0040
(§4.4) — record repair, not a new architectural decision.

## 8. Open risks / implementation notes

- **Floor-retry reachability for submodule tasks** is narrow today (a submodule task's floors run
  refiner-side against the superproject refs unless separately threaded — see
  `docs/specs/2026-07-22-test-floor-target-repo-design.md`). The append is harmless when the route
  is unreached and correct when it is; do not let a reachability debate shrink row 1's resolution.
- **Prompt-size growth** is three short paragraphs, submodule tasks only. Negligible.
- **Non-submodule byte-identity**: `submodMergeNote` is `''` off the submodule path, so existing
  prompt-content tests for non-submodule fixtures must stay green unmodified — treat any such test
  churn as a defect in the change, not the tests.
- **The environment-class stub harness defaults recovery dispatches to `merged`** — the new test
  must capture the retry prompt *before* the stub returns, which the existing capture pattern
  (record `{ prompt, opts }` per call, filter by label) already does.
- **Issue line numbers have drifted** between the landed tip and the live tree; every edit site in
  this spec is anchored by construct name (dispatch label, const name, ADR heading), never by line.

## 9. Non-goals / deferred

- No `gateCaptureClause` on the baseline-proceed re-merge (§3 row 6) — its proceed-over evidence
  contract is ADR 0040's documented design; revisiting it needs its own issue.
- No change to any land-phase prompt, the re-land path, or `land-decision.mjs`.
- No retro-edit of ADR 0019's Decision/Scope prose — amendment only.
- No `FLOOR_SITE_RE` / drift-guard hardening in `workflow-template.test.mjs` — owned by the
  sibling drift-guard spec's group (#1050), which orders itself after this one.
- No standing-doc (`agents/war-refiner.md`) edit — §2 records the checked rationale.

## 10. Validation criteria

1. **Threading completeness:** `grep -c "submodMergeNote" skills/war/assets/workflow-template.js`
   returns 5 (1 definition + 4 uses: initial, floor-retry, environment-proceed, baseline-proceed),
   and the §4.5 manual survey items are re-confirmed at implementation time.
2. **Discrimination proof:** each new dispatch-capture assertion fails RED with its route's
   `+ submodMergeNote` append removed (feature mentally deleted) and passes GREEN with it —
   asserting both the `SUBMODULE TASK` marker and the fixture's `targetRepo` value inside the
   prompt captured for that route's dispatch label.
3. **Non-submodule byte-identity:** the full existing suite passes unmodified —
   `node --test skills/war/assets/workflow-template.test.mjs` green, then the repo glob
   `node --test 'skills/**/*.test.mjs'` green.
4. **Drift guard stability:** the `captureUses` assertion still counts exactly 3
   `gateCaptureClause` call sites — the comment fix changed prose only.
5. **Comment rot-proofing:** the `gateCaptureClause` header comment no longer contains any
   consumer-site enumeration (no "AND the floor-retry" / site list), states the invariant, and
   names the `captureUses` drift guard as the arbiter; checked by reading the comment block, not
   by a single-line grep (the wrap trap).
6. **ADR coherence, both directions:** ADR 0019 ends with a dated `## Amendment` heading naming
   ADR 0040 and the `environment` class-route row; ADR 0040's `## Relationship to prior ADRs`
   names ADR 0019. A reader landing on either record reaches the live routing in one hop.
7. **Enum discipline untouched:** `git diff` for the change shows no edit to
   `skills/war/assets/land-decision.mjs`, no new `MergeResult` status, and no
   `HARD_ESCALATION_REASONS` / `KNOWN_LAND_DECISIONS` member.
