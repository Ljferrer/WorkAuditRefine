# Structural-test non-vacuity — kill vacuous passes, self-matching comments, and widening-proof gaps

Issues addressed: #1233, #1241, #1163, #1246, #1180

## 1. Context — the gap / problem

Five verified, live instances of one failure class: **guards that pass green without exercising
what they lock**. The repo's `weak-test-assertion-passes-without-feature-being-exercised` and
`coupling-comment-restating-grep-pattern-bytes-self-matches-the-sweep` lessons record the class;
this spec makes the remedy mechanical across the three structural-test suites and the auditor-guard
shell suite.

1. **Self-matching sweep comment** (#1241 instance 1, #1163 finding 1 — the same defect; the two
   issues' fixes are merged here). The Task 2.1 doc-cascade banner comment in
   `skills/war/assets/skill-doc-contracts.test.mjs` (above the D23 test, the comment beginning
   `---- Task 2.1 doc-cascade gates`) quotes the dispatch-args plan's four-surface
   embedded-args token-pair grep pattern verbatim. Because the sweep is an ERE **alternation**,
   the comment itself is a hit: running the sweep over `skills/` today returns **five** files
   (`skills/war/SKILL.md`, `skills/war/assets/stage-workflow.mjs`,
   `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/workflow-template.js`, and the
   test file's own comment). No test asserts the count, so nothing goes red — a future sweeper
   wastes a round re-deriving "why 5, not 4", and the dispatch-args plan's End state 9
   (exactly-four surfaces) stands violated, recorded-not-waived.
2. **Weakened D29 non-vacuity assert** (#1241 instance 2). The D29 test in
   `skill-doc-contracts.test.mjs` extracts `prompt-surface-budgets.test.mjs`'s header region
   (file start → first top-level `import`) and proves non-truncation with a bare `/Formula/`
   match. The coupling comment in that header ("reword the Formula sentence below and that row in
   the same commit") sits **before** the actual Formula sentence and contains the token — an
   extraction truncated between the two still passes the non-vacuity assert.
3. **Retired per-row derivation-comment guard** (#1233). Phase 1's PLACEHOLDER-BUDGET count assert
   doubled as a per-row comment-presence guard; Task 7.1 correctly flipped the expectation to zero
   when the marker retired, silently retiring the side-effect guard. ADR 0042 D5's "constants live
   in the budget test with a comment naming the formula and measurement" is now doctrine with no
   mechanism: all ten live guard subjects (nine `FILE_BUDGETS` rows plus
   `WORKFLOW_LITERAL_BUDGET`) carry correct derivation comments, but a future bare
   `{ hard, advisory }` row would land unauditable.
4. **Two known-vacuous asserts in `workflow-template.test.mjs`** (#1246). (a) The test
   `pkg §4.2 — retry-merge prompt re-instructs ALL floor invocations` pins bare filenames
   (`/assert-test-in-diff\.sh/`, `/assert-packaging-in-diff\.sh/`), but **both** ternary arms of
   each floor clause in the retry-merge prompt carry the filename byte-run (the run arm says
   "run assert-test-in-diff.sh …"; the skip arm says "skip the assert-test-in-diff.sh check") —
   presence cannot discriminate run from skip. (b) The ADR 0041 evidence-precedence card-only
   supplementary loop asserts rung bodies for only three of the four claim shapes; the `authority`
   rung's body (`Roadmap/spec literals`, live at the auditor card's Evidence-precedence ladder
   rung 4) is asserted nowhere — deleting the entire ladder body from `agents/war-auditor.md`
   leaves the suite green.
5. **Widening-proof coverage gap in the auditor-guard suite** (#1180). CASE GROUP K's char-set
   widening safety argument leans on the group C injection cases staying green, but no deny case
   exists for glob `*`, braces (including the `HEAD@{1}` reflog form both the standing card and
   the dispatched guard-contract prose explicitly teach as denied), backslash continuation, or
   backtick substitution. The hook's live allowlist (the `tr -d 'A-Za-z0-9 ./_=:,@^~%+-'` residue
   check in `hooks/validate-auditor-git.sh`) denies all four today — this is strictly a coverage
   gap in the floor future widenings lean on, not a live guard hole.

This group is the primary owner of `skill-doc-contracts.test.mjs`,
`prompt-surface-budgets.test.mjs`, and `workflow-template.test.mjs` for the campaign; sibling
specs touching those files depend on this one.

## 2. Pivotal constraints

- **The sweep is an alternation ERE.** `grep -rE 'EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR'` hits any
  file containing **either** token. #1163's "break the token pair" phrasing is insufficient — a
  broken pair still matches one alternate. Both raw token names must leave the comment entirely
  (#1241's descriptive-naming fix shape subsumes #1163's).
- **D29 pins the budgets-file header.** The D29 row in `skill-doc-contracts.test.mjs` extracts
  `prompt-surface-budgets.test.mjs` from file start to the first top-level `import` and asserts
  the two formula bindings (`advisory = post-shrink … 1.10`, `hard = post-shrink … 1.25`). Any
  edit to that header region and any change to the D29 assert must land in the same commit
  (the header's own coupling comment mandates this).
- **The CONTEXT.md placeholder-retained row lacks the ×1.10 token.** Its comment block carries
  the `post-shrink 101,769 B @ c6a05fb` derivation and `×1.25`, but no `×1.10` (the placeholder
  pair is stated as raw values `126,976/111,616`). The per-row guard's required shape must pass
  all ten live guard subjects (nine `FILE_BUDGETS` rows plus `WORKFLOW_LITERAL_BUDGET`)
  **unmodified** — it may not unconditionally require the multiplier pair.
- **Live comments use the `×` glyph** (U+00D7), not the letter `x` — the guard regexes must
  target the live bytes.
- **New guards must not join the self-match class.** Any test that greps for a token must build
  its pattern from split fragments so its own source never matches — the suite's existing
  `'PLACEHOLDER-' + 'BUDGET'` idiom (the marker-retired test in `prompt-surface-budgets.test.mjs`)
  is the precedent.
- **The retry-merge run/skip arms share filename bytes; the discriminator is the verb.** The run
  arms carry `run assert-test-in-diff.sh` / `run assert-packaging-in-diff.sh`; the skip arms carry
  `skip the assert-…-in-diff.sh check`. The `run ` prefix is the cheapest discriminating anchor;
  the adjacent submodule assertion in the same test already pins distinguishing wording.
- **Card-only placement for the `authority` rung body is safe by construction.** The source plan's
  End state 8(ii) forbids rung-body tokens on dispatched surfaces, and `Roadmap/spec literals`
  appears only on `agents/war-auditor.md` — the same construction as the loop's existing four
  regexes (the loop's own comment records this).
- **Both stage-workflow fail-loud arms are fixturable.** `replaceExactlyOnce`'s `args fallback`
  label throws `expected exactly one args fallback anchor` on a template carrying both meta
  anchors but no `: (args || {})` tail; `insertArgsPrelude` throws `could not locate the` on a
  meta statement whose closing `}` is not a column-0 line (e.g. a one-line `export const meta`
  statement) — the name/description/fallback substitutions succeed first, so the fixture reaches
  the prelude step. `assert-guard-specificity-in-diff.sh` cannot cover either (a Node throw is
  outside its documented shell-die ceiling), so tests are the only mechanism.
- **Zero behavioral diff.** Every change in this spec is test-file or comment prose. The hook
  script, the stager, and `workflow-template.js` are untouched.
- **Uniform validation story: demonstrated-RED mutation proof.** Every new or tightened assert
  must be shown to fail when the guarded fact is deleted or flipped (in a scratch copy), then
  pass on restore — the weak-test-assertion lesson made mechanical. Proofs are recorded verbatim
  in done reports; per the repo's deliberately-uncommitted-probe-evidence lesson, gate-audit
  treats them as soft evidence, so the verbatim capture (command + failing assert message) is
  mandatory, not optional.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| Line-608 banner comment: break the token pair, or remove both tokens? | **Remove both raw tokens** — reword to name the sweep descriptively ("the spec §4.4 four-surface embedded-args token-pair grep"). The sweep is an alternation; a broken pair still hits. |
| Pin the four-surface count mechanically, or leave it prose-only? | **Pin it**: a default-deny exact-set census test in `skill-doc-contracts.test.mjs` — enumerate the four expected files, sweep `skills/` with a fragment-built pattern, assert set equality. A legitimate fifth surface REDs the census and forces a deliberate update, instead of a sweeper round re-deriving the fork. |
| D29 non-vacuity: tighten the assert, or paraphrase the colliding comment? | **Both.** Tighten the assert to a phrase the coupling comment cannot contain (`/Formula \(adjudication D\)/i`, matching the live Formula sentence) AND paraphrase the coupling comment ("reword the **derivation** sentence below") so the collision class is removed at the root. |
| Per-row derivation-guard required shape | Contiguous comment block immediately above each `FILE_BUDGETS` row and above `WORKFLOW_LITERAL_BUDGET` must match `/post-shrink [\d,]+ B @ [0-9a-f]{7}/` and contain at least one `×1.25` or `×1.10` multiplier token. Calibrated so all ten live guard subjects (the nine `FILE_BUDGETS` rows plus `WORKFLOW_LITERAL_BUDGET`) pass as-authored (the CONTEXT.md placeholder row has `×1.25` only). |
| Retry-merge tightening shape | Tighten the two predicates to the run-arm's verb (`/run assert-test-in-diff\.sh/`, `/run assert-packaging-in-diff\.sh/`); leave the sibling submodule assertion as-is (already discriminating). |
| `authority` rung: assert or comment-flag? | **Assert**: add `/Roadmap\/spec literals/i` to the card-only supplementary loop, completing 4-of-4 claim-shape coverage. A comment flag is the rejected floor. |
| Auditor-guard case placement | **Extend group C** (C9–C12) — glob, braces/`HEAD@{1}`, backslash continuation, backtick substitution — via the existing `expect_deny` helper. Keeps the injection family together and CASE GROUP K's "C … cases above" reference automatically covers them. No renumbering (C8 is the group's last case today). |
| stage-workflow fail-loud coverage vehicle | Exact-message tests in `stage-workflow.test.mjs` using the suite's existing fixture idiom: assert non-zero exit and stderr matching `/expected exactly one args fallback anchor/` (fallback-tail-less fixture) and `/could not locate the/` (one-line meta fixture), each citing #1163. |
| Mutation-proof protocol | One scratch mutation per assert (enumerated in §10), each shown RED then restored; verbatim command + failing-assert output recorded in the done report. |

## 4. Mechanics

### `skills/war/assets/skill-doc-contracts.test.mjs`

- **Banner reword** (the `---- Task 2.1 doc-cascade gates` comment above the D23 test): replace the
  verbatim pattern quote with descriptive naming; zero raw occurrences of either token name remain
  anywhere in this file after the fix.
- **Four-surface census test** (new): build the sweep pattern from split fragments (so this test's
  own source is self-excluding by construction), walk `skills/` recursively, and assert the hit set
  equals exactly the four expected files. Default-deny both ways: a missing expected file and an
  unexpected fifth file both RED with a message naming the delta.
- **D29 tightening**: replace the bare `/Formula/` non-vacuity match with
  `/Formula \(adjudication D\)/i` (the live Formula sentence's own bytes); the two `assertMirror`
  formula-binding keys are unchanged.

### `skills/war/assets/prompt-surface-budgets.test.mjs`

- **Coupling-comment paraphrase** (header, the "Pinned by skill-doc-contracts.test.mjs's D29 row"
  sentence): "reword the Formula sentence below" → "reword the derivation sentence below". Same
  commit as the D29 tightening (the comment's own same-commit mandate).
- **Per-row derivation-comment guard** (new test): parse this file's own source; for every line
  matching a `FILE_BUDGETS` row shape (`'<path>': { hard: N, advisory: N }`) and for the
  `WORKFLOW_LITERAL_BUDGET` declaration, collect the contiguous `//` comment block immediately
  above and assert it matches the required shape (§3 row 4). Failure message names the offending
  row key. The guard's own regex literals cannot match a row shape, so no self-match. New test
  code sits below the imports — the D29-extracted header region is byte-unchanged except for the
  paraphrase above.

### `skills/war/assets/stage-workflow.test.mjs`

- **`args fallback` exactly-once arm** (new test): fixture template carrying both meta anchors
  (name, description) but no `: (args || {})` fallback tail; invoke the stager with an `--args`
  payload; assert non-zero exit and stderr matching `/expected exactly one args fallback anchor/`.
- **`insertArgsPrelude` meta-not-found arm** (new test): fixture template whose
  `export const meta` statement closes on the same line (no column-0 `}` line) but still carries
  all three anchors; assert non-zero exit and stderr matching
  `/could not locate the/` (anchor on that stable fragment, not the full message bytes).
- Both tests cite #1163 in their comment.

### `skills/war/assets/workflow-template.test.mjs`

- **Retry-merge test** (`pkg §4.2 — retry-merge prompt re-instructs ALL floor invocations …`):
  tighten the two bare-filename predicates to `/run assert-test-in-diff\.sh/` and
  `/run assert-packaging-in-diff\.sh/`. The submodule predicate is untouched.
- **Card-only supplementary loop** (below the evidence-precedence registry row): append
  `/Roadmap\/spec literals/i` to the loop's regex array, with the same card-only-by-construction
  failure-message shape as the existing four.

### `hooks/validate-auditor-git.test.sh`

- **C9–C12** (appended after C8, inside CASE GROUP C): `git ls-files *.mjs` (glob),
  `git log HEAD@{1}` (braces — the reflog form both teach surfaces name as denied), a
  backslash-continuation payload, and a backtick-substitution payload — each via `expect_deny`,
  asserting the standard `WAR: deny` marker. A short banner line cites #1180 and the
  widening-proof purpose.
- After insertion, hand-survey every case-group banner in the file for count or enumeration
  claims the additions falsify (the banner-count lesson); CASE GROUP K's banner references the
  "C … injection cases above" generically and is expected to stand, but the survey is mandatory,
  not assumed — list any straggler as a survey-derived correction.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/skill-doc-contracts.test.mjs` | Banner comment reword (both tokens removed); new four-surface census test; D29 non-vacuity regex tightened |
| `skills/war/assets/prompt-surface-budgets.test.mjs` | Header coupling-comment paraphrase; new per-row derivation-comment guard test |
| `skills/war/assets/stage-workflow.test.mjs` | Two new exact-message fail-loud-arm tests |
| `skills/war/assets/workflow-template.test.mjs` | Two retry-merge predicates tightened; one regex appended to the card-only rung-body loop |
| `hooks/validate-auditor-git.test.sh` | Four new `expect_deny` cases (C9–C12) + banner survey corrections if any |

No production file changes. No doc-surface changes outside test comments.

## 6. New domain terms (CONTEXT.md)

None required. (The "demonstrated-RED mutation proof" phrase is used throughout this spec as
plain description of the existing weak-test-assertion lesson's remedy, not as a new glossary
term; if the campaign wants it ratified, that is a separate glossary decision.)

## 7. Recommended ADRs

None. Governing doctrine already exists: ADR 0025 (drift-guard discipline), ADR 0042 D5 (budget
constants carry a derivation comment), and the structural-test hardening lesson
(`structural-test-blind-spot-narrowing-needs-negative-reference-and-default-deny-census`). This
spec adds mechanisms under that doctrine, not new doctrine.

## 8. Open risks / implementation notes

- **Same-file sequencing (for /war-machine).** The banner reword, census test, and D29 tightening
  all land in `skill-doc-contracts.test.mjs`; the coupling-comment paraphrase and per-row guard
  both land in `prompt-surface-budgets.test.mjs`. Same file → same task, per the decomposition
  rule. The D29 tightening and the coupling-comment paraphrase span the two files but are bound
  by the header's same-commit mandate — carve them so they merge together (one task owning both
  files, or a `deps` edge with the paraphrase+pin in the dependent task; never same-wave siblings,
  per the guard-task-split lesson).
- **Cross-group contention.** This group is the primary owner of the three `.mjs` suites; any
  sibling spec touching them must carry a `dependsOn` edge onto this spec's plan in the roadmap's
  shared-file-contention table.
- **The census test intentionally REDs on legitimate growth.** A future fifth embedded-args
  surface must update the census's expected list in the same diff — that is the designed
  friction, trading a silent count fork for a loud one.
- **Exact-message coupling.** The two stage-workflow tests anchor on stable message fragments
  (`expected exactly one args fallback anchor`, `could not locate the`). If a future stager
  refactor rewords these, the tests RED loudly — acceptable; anchor no wider than these
  fragments to keep the coupling minimal.
- **Per-row guard calibration is survey-derived, not assumed.** Before finalizing the required
  shape, the implementer re-reads every live row comment (all nine `FILE_BUDGETS` rows plus
  `WORKFLOW_LITERAL_BUDGET`) and confirms the shape passes each as-authored — the CONTEXT.md
  placeholder row is the known outlier; list any other outlier found as a survey-derived
  calibration note in the test's comment.
- **#1233's guard is deliberately not covered by the dispatch-args plan's backstops** (the issue
  records this); this spec is its home. Landing it discharges ADR 0042 D5's mechanism gap.
- Version literals: no release is implied by this spec; if the campaign batches one, the next
  free patch is resolved from the four slots at land time.

## 9. Non-goals / deferred

- **No hook or engine changes.** `hooks/validate-auditor-git.sh`'s allowlist, the stager, and
  `workflow-template.js` are untouched — #1180 is a coverage gap, not a guard hole, and #1163's
  arms already fail loud.
- **#1179 (denial-rate telemetry comparison)** is a /war-review measurement task, not a code or
  test change — out of scope.
- **The `landResult` re-land symmetry fix (#1245)** touches `workflow-template.js` engine code
  and belongs to whichever group owns engine changes; its optional drift-guard pin would land in
  `workflow-template.test.mjs` and must carry a `dependsOn` edge onto this spec's plan.
- **No banner rewrite of CASE GROUP K's historical widening record** unless the mandatory §4
  survey finds its claims falsified.
- **No retroactive discharge of the dispatch-args plan's End state 9 paperwork** beyond the fix
  itself; the issue-close comment citing #1163 and #1241 is the record.

## 10. Validation criteria

All criteria are concrete and testable; the mutation proofs follow one protocol — mutate in a
scratch copy, observe the named assert RED, restore, observe green, record the verbatim command
and failing message in the done report.

1. **Sweep restored to four surfaces**: `grep -rlE 'EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR' skills/`
   returns exactly `skills/war/SKILL.md`, `skills/war/assets/stage-workflow.mjs`,
   `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/workflow-template.js` — and
   `skill-doc-contracts.test.mjs` is absent. **Grep is the floor**: after the grep, hand-scan the
   comments of the four remaining surfaces and of `skill-doc-contracts.test.mjs` for any other
   restatement of the pattern bytes or a contiguous token-pair quote, and list each straggler as
   a survey-derived correction.
2. **Census non-vacuity**: adding either token to a scratch fifth file under `skills/` REDs the
   new census test; removing it restores green.
3. **D29 non-vacuity**: truncating a scratch copy of `prompt-surface-budgets.test.mjs`'s header
   immediately after the (paraphrased) coupling comment — before the Formula sentence — REDs the
   tightened D29 assert; the untruncated file passes.
4. **Per-row guard**: all nine live `FILE_BUDGETS` rows and `WORKFLOW_LITERAL_BUDGET` pass with
   zero comment rewrites; deleting one row's derivation comment (scratch) REDs the guard naming
   that row; appending a bare `{ hard: 1024, advisory: 512 }` row with no comment (scratch) REDs.
5. **stage-workflow arms**: both new tests pass against the live stager; neutralizing each throw
   in a scratch copy of `stage-workflow.mjs` (or, for the fallback arm, restoring the fallback
   tail to the fixture) flips the corresponding test RED, proving the test exercises the arm.
6. **Retry-merge discrimination**: flipping the run arm's `run assert-test-in-diff.sh` wording to
   the skip form in a scratch copy of `workflow-template.js` REDs the tightened predicate (and
   likewise for the packaging arm); the live template passes.
7. **`authority` rung coverage**: deleting the `Roadmap/spec literals` rung body from a scratch
   copy of `agents/war-auditor.md` REDs the appended loop regex; the live card passes.
8. **Widening-proof cases**: each of C9–C12 passes against the live hook; adding the case's
   character (`*`, `{}`, `\`, backtick) to the `tr -d` allowlist in a scratch copy of
   `hooks/validate-auditor-git.sh` REDs exactly that case; all pre-existing cases stay green
   throughout.
9. **Suites green at the tip**: `node --test skills/war/assets/skill-doc-contracts.test.mjs
   skills/war/assets/prompt-surface-budgets.test.mjs skills/war/assets/stage-workflow.test.mjs
   skills/war/assets/workflow-template.test.mjs` and
   `bash hooks/validate-auditor-git.test.sh` all pass.
10. **Done-report evidence**: every mutation proof (2, 3, 4, 5, 6, 7, 8) is recorded verbatim —
    command plus failing assert message — in the executing task's done report.
