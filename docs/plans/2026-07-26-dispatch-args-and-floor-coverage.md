# Dispatch args & floor coverage — mechanized `--args` embedding in the stager, submodule floor/note completion across the re-land/polish/floor-retry families, `classificationClause` arbiter

Source spec: `docs/specs/2026-07-26-dispatch-args-and-floor-coverage-design.md` (issues #1134,
#1114, #1151 — all three re-verified live on the working tree at plan time: `submodLandNote`
occurs 2× pre-change, `assert-no-submodule-mutation` 3×, `classificationClause` has exactly 3
call sites, and neither `'submodule-blocked'` nor `'submodule-pr'` is in
`HARD_ESCALATION_REASONS`).

## Commander's Intent

- **Purpose:** the per-phase Workflow engine's dispatch surfaces must tell the truth at three
  layers. (1) The staging tool: at real campaign size the assembled phase args (~104.5 KB
  measured — `args.memory` blocks + verbatim plan slices + the Commander's Intent) cannot ride
  the Workflow tool call inline; phase 1 of the measuring campaign shipped an operator-approved
  hand edit of the staged copy — mechanize it as `stage-workflow.mjs --args <file>`, which also
  closes the `resumeFromRunId` hazard (an args-less resume currently dies at entry validation
  despite a healthy journal). (2) The dispatched prompts: three sibling gaps left open when
  `2026-07-24-recovery-re-merge-dispatch-coherence` phase 1 closed the MERGE-side retries —
  both re-land prompts omit `submodLandNote` (a submodule phase whose first land gate-fails
  recoverable is re-dispatched land-blind), the polish merge names no submodule floor at all,
  and the floor-retry re-merge omits the `assert-no-submodule-mutation.sh` invocation its own
  adjacent comments claim it carries — each fix converging the dispatched surface on what
  `agents/war-refiner.md` already declares ("always"). (3) A header comment: the
  `classificationClause` consumer-site enumeration is the exact shape that rotted for
  `gateCaptureClause` (#1034); repair it while it is still accurate and arbiter it with a drift
  guard.
- **Method:** two content phases carved on the spec's §8 seam, then the release. The seam is not
  fully file-disjoint — §4.1's same-commit coupling comment puts one `workflow-template.js`
  touch inside the #1134 slice — so the collision is resolved by a **phase edge** (Phase 1 lands
  first; Phase 2's worktree is cut from the landed tip), never a deps-wave dodge of a same-file
  collision. All prompt gains are prose appends reusing in-scope consts (`submodLandNote`, the
  environment-proceed floor-sentence form), mirror-with-eyes-open — re-verify each donor
  sentence, never byte-copy blind. The two routing corrections reuse existing enum members only
  (`reason: 'escalate'`, `held:submodule-pr`); `land-decision.mjs` is byte-untouched (ADR 0005).
  Stage-time substitution keeps the fail-loud exactly-once anchor discipline (new exported
  `ARGS_FALLBACK_ANCHOR`, imported by the anchor-guard test, never a second hardcoded copy;
  coupling comments referential, never restating anchor bytes) and the injection-ordering
  invariant (payload injected only after every exactly-once count has run). Tests discriminate
  dispatched-prompt content by label-keyed capture (the #1032 sibling harness), except the one
  deliberate #1151 source-count guard whose job is arbitering the source site list. Every spec
  §4.4 grep is a floor, not a ceiling — run it, then hand-scan same-scope tests/comments and
  record survey-derived corrections in the done report. Every edit anchors by named construct;
  the issues' line numbers have drifted and are non-authoritative.
- **End state:**
  1. **No-flag byte identity:** staging the shipped template without `--args` produces
     byte-identical output to the pre-change stager — the existing restore-roundtrip tests in
     `stage-workflow.test.mjs` pass unmodified (they whole-file byte-compare via reverse
     substitution — a full-byte proof, not a spot check), plus one direct negative: the no-flag
     staged output contains zero `EMBEDDED_ARGS` occurrences (steps (2)–(3) provably never ran).
  2. **Valid `--args`:** staging with a valid JSON-object file yields a staged script whose text
     (i) starts with the `EMBEDDED_ARGS` prelude carrying the payload, (ii) contains
     `: (args || EMBEDDED_ARGS)` and not the original fallback bytes, and (iii) restores to the
     shipped template when the three substitutions (two meta anchors + fallback) are reversed
     and the prelude stripped.
  3. **Invalid `--args`:** a malformed-JSON file, and each non-object parse (array, scalar,
     `null`), exits non-zero with a named `stage-workflow:`-prefixed stderr error and writes no
     staged file; `--args` missing its value token exits non-zero with the usage error; a
     duplicate `--args` exits non-zero with the usage error; `--args --force` consumes `--force`
     as the filename and dies at the named read error (the value is the immediately-following
     token verbatim — the peel ordering is pinned by tests, never incidental). All
     validation runs before any write (ADR 0034 parity with the template's entry guard).
  4. **Injection-order invariant:** an args file whose payload string-quotes the `NAME_ANCHOR`,
     `DESCRIPTION_ANCHOR`, and `: (args || {})` bytes AND carries JS-meta content (backticks,
     `${`, quote characters, newlines, U+2028/U+2029) still stages cleanly — exactly-once
     counts unperturbed and the prelude carrying the `JSON.stringify` output byte-equal (the
     discriminating case for the spec §2 ordering constraint AND for the
     JSON.stringify-is-valid-JS claim on real payload shapes, not just anchor quoting).
  5. **Prompt gains (label-keyed dispatch capture):** for a submodule-phase fixture, the prompts
     captured at `land:phase-<id>:environment-proceed` and `land:phase-<id>:baseline-proceed`
     carry the `SUBMODULE PHASE:` marker (colon-pinned) and the fixture's `targetRepo`; the
     `merge:p<id>-polish` prompt carries the **bare** `assert-no-submodule-mutation.sh`
     invocation (never `--declared`) and the `merge:<taskId>:floor-retry:r<n>` prompt carries it
     **with** the gitlink-bump `--declared` conditional shape. Each assertion (items 5–6) goes
     RED with its edit deleted — **demonstrated** by a mutate-and-run probe (temporarily delete
     the append/arm in the worktree, run the test, restore) recorded in the done report, never
     merely asserted (the recorded weak-assertion lesson); the probe evidence is
     done-report-only and SOFT for gate-audit (the recorded worker-probe lesson).
  6. **Routing arms:** a floor-retry re-merge stubbed to return `submodule-blocked` escalates
     with `reason: 'escalate'` (HARD — never the soft `reason: floorMr.status` fallback); a
     re-land stubbed to return `submodule-pr` yields `landDecision === 'held:submodule-pr'`
     with `pr_number`/`pr_remote` on the escalated entry (never the `held:land-failed` else).
  7. **Fail-open polish routing unchanged:** a polish merge returning `submodule-blocked`
     routes the existing DISCARD arm (queue demoted to follow-up, the pre-polish tip lands) —
     no new hold, no routing edit.
  8. **Arbiter in place:** a new drift guard in `workflow-template.test.mjs` (sibling of
     `captureUses`) counts `classificationClause\(` call-paren source matches (any first
     argument — the definition's `const classificationClause = (refineryP,` has ` = (` between
     name and paren and cannot match) and asserts exactly 3, with a message naming the three
     sites; the rewritten `classificationClause` header comment contains no consumer-site
     enumeration, never contains the `classificationClause(` byte-run, and names that guard as
     arbiter — verified by reading the comment block, not a single-line grep (the wrap trap).
  9. **Sweeps + survey:** every spec §4.4 grep lands on its expected post-change count
     (`submodLandNote` 4; `assert-no-submodule-mutation` 5 dispatched-prompt sites —
     **site-classified**, never a whole-file `grep -c`: each hit is named by its dispatch label
     and any extra non-prompt mention (a comment, the reworded skip sentence) is recorded
     separately, per the marker-completeness lesson; every `submodule-pr`/`submodule-blocked`
     routing arm hard/held; the `EMBEDDED_ARGS`/`ARGS_FALLBACK_ANCHOR` grep hits exactly its
     four named surfaces), Phase 1 additionally asserts `grep -cF ': (args || {})'` = 1 on
     `workflow-template.js` (Phase 2's anchor stays exactly-once through the prose edits), the two
     "ALL floor invocations (test + packaging + submodule)" comments are re-verified true (no
     edit), and each task's done report records the mandatory same-scope hand-scan with any
     survey-derived corrections.
  10. **Enum + guard stability:** `git diff` shows no `land-decision.mjs` edit, no
      `MERGE_RESULT` status addition, no `HARD_ESCALATION_REASONS`/`KNOWN_LAND_DECISIONS`
      member change; the `captureUses` guard still counts 3; no `agents/*.md` or `hooks/` edit
      (the standing card already states the target behavior — spec §2 rationale, recorded here
      so an auditor does not hold the commit for a missing mirror).
  11. **Non-submodule byte identity:** `submodLandNote`/`submodMergeNote` are `''` off the
      submodule path — every existing non-submodule prompt test passes unmodified; churn there
      is a defect in the change.
  12. **Launch prose:** `skills/war/SKILL.md`'s "Stage the per-phase script first (ADR 0037)"
      paragraph documents the `--args` flow — when to write the args JSON to
      `$MAIN/.claude/war/runs/<runId>/args-p<phase.id>.json` and pass `--args`, dispatch with
      **no** Workflow `args` (the `{}`-is-truthy caveat), dispatched-args-always-win precedence,
      the resume note (an `--args`-staged script needs no re-passed args; a script staged
      **without** `--args` keeps today's behavior — an args-less resume still dies at entry —
      and the note sanctions no new resume path: `resumeFromRunId` stays
      `held:phase-incomplete`-only), the concrete decision rule (campaign phases default to
      `--args`; small hand-built launches may stay inline), the stage-failure runbook line
      (an exactly-once failure names the offending anchor label; `--force` cannot help), and
      the `--force` re-embed rule; the paragraph's inline stager command line gains
      `[--args <file>]`. **Doc truth, same commit:** ADR 0037's "the two anchor literals"
      enumeration gains a one-line dated amendment note and `CONTEXT.md`'s staged-phase-script
      entry gains one clause, each naming the optional third exactly-once substitution — no
      new glossary term.
  13. **Whole suite green:** `node --test 'skills/**/*.test.mjs'` passes; the shipped
      `workflow-template.js` stages cleanly through the extended anchor guard (all three
      anchors exactly-once).
  14. **Release:** all four version slots bumped in lock-step to the next free patch above the
      live integration base at land time; `version-slots.test.mjs` green.

## Build order (for /war)

- Phase 1 — Workflow-template floor completion + arbiter (#1114, #1151): one task (both issues
  live entirely in `workflow-template.js` + `workflow-template.test.mjs` — same files, so never
  parallel tasks; spec §8).
- Phase 2 — Stager `--args` embedding + coupling + launch prose (#1134): one task. Phase edge,
  not a wave: its same-commit referential coupling comment touches `workflow-template.js`,
  colliding with Phase 1's footprint — Phase 1 must be **landed** first so Phase 2's worktree
  is cut from the integrated tip (a deps edge inside one phase would be the forbidden same-file
  dodge). Ordering bonus: the extended anchor guard then pins `ARGS_FALLBACK_ANCHOR`
  exactly-once against the final template bytes.
- Phase 3 — Release (its own trailing phase per the decomposition rule).

## Phase 1 — Workflow-template floor completion + arbiter

### Task 1.1: Submodule floor/note completion + `classificationClause` arbiter

- Files: `skills/war/assets/workflow-template.js`, `skills/war/assets/workflow-template.test.mjs`
- Plan slice: spec §4.2, §4.3, and the §4.4 sweeps scoped to these two files.
  **(a) Re-lands:** append `+ submodLandNote` as the final prompt segment of the
  `land:phase-<id>:environment-proceed` and `land:phase-<id>:baseline-proceed` dispatches,
  mirroring the initial `land:phase-<id>` prompt's trailing placement (all three dispatches live
  inside the `if (landDecision === 'landed')` block, so the const is in scope).
  **(a′) Re-land `submodule-pr` routing (spec row 7):** on **both** re-land results, add the
  `status === 'submodule-pr'` arm before the generic routing — push the escalated entry carrying
  `pr_number`/`pr_remote` and set `landDecision = 'held:submodule-pr'`, byte-mirroring the
  initial land's direct-return guard (the `#236`-commented block). Without it, a 2B PR-and-hold
  return newly reachable from the re-lands would mislabel `held:land-failed` and lose the PR ref
  the Lead's gh-resume reads.
  **(b) Polish merge:** append one sentence to the `merge:p<id>-polish` prompt instructing —
  before the `_refinery` merge step — the **bare** invocation
  `assert-no-submodule-mutation.sh <integrationBranch> <polishBranch>` (never `--declared`; a
  coherence sweep is never a declared gitlink bump); exit 1 → return
  `{ mode: 'merge-task', status: 'submodule-blocked' }`, do NOT merge; exit 2 → `status:
  'error'`. Keep the existing test/packaging skip sentence and class-exempt prose, but reword
  the skip rationale minimally so it no longer implies *all* floors are skipped — the submodule
  floor is named as the one that still runs (it is unconditional per `agents/war-refiner.md`
  step 6 and needs no task fields). No routing edit: both non-`merged` statuses already hit the
  fail-open DISCARD arm.
  **(c) Floor-retry re-merge:** insert the compact floor sentence — mirroring the
  environment-proceed re-merge's form, **with** the
  `taskType === 'gitlink-bump' && declared ? ' --declared' : ''` conditional — into the
  `merge:<taskId>:floor-retry:r<round>` prompt, placed before the `requiresTest` ternary (the
  donor site's ordering): exit 1 → `submodule-blocked`, do NOT merge; exit 2 → `error`.
  Mirror-with-eyes-open: re-verify the donor sentence, never byte-copy.
  **(c′) Floor-retry `submodule-blocked` routing (spec row 6):** in the floor-retry sub-loop's
  post-loop routing, add an explicit `floorMr.status === 'submodule-blocked'` arm that escalates
  with the existing `reason: 'escalate'` (detail naming the task + the floor-retry surface) and
  pushes the audit-log entry — mirroring the primary submodule-blocked arm — so the result can
  never reach the soft `reason: floorMr.status ?? 'merge_failed'` fallback (`'submodule-blocked'`
  is not in `HARD_ESCALATION_REASONS`).
  **(§4.3) Arbiter:** rewrite the `classificationClause` header comment count-free — no
  consumer-site enumeration; name the new drift guard in `workflow-template.test.mjs` as the
  arbiter of the site list; keep the accurate per-site-base (`baseDesc`) statement and the
  both-surfaces/`agents/war-refiner.md` mirror sentence (final wording is the worker's within
  those floors). Add the guard as a sibling of `captureUses`: count `classificationClause\(`
  call-paren source matches (any first argument), assert `=== 3`, message naming the three
  sites (initial merge-task, floor-retry re-merge, the land prompt). The bare call-paren anchor
  deliberately widens spec row 9's `refinery(?:Path|LandPath)` first-arg pin: a future 4th site
  passing any other base variable trips it (the first-arg pin's blind spot), a line-wrapped
  argument list still matches (the wrap lands after the paren), and the definition still cannot
  match (`const classificationClause = (refineryP,` has ` = (` between name and paren); the
  rewritten header comment must not contain the `classificationClause(` byte-run. This is the
  one deliberate source-count test (spec §2 exception); every other new test is label-keyed
  dispatch capture.
  **Comments made true, not edited:** the two adjacent comments claiming the retry re-instructs
  "ALL floor invocations (test + packaging + submodule)" (above `FLOOR_STATUSES` and above the
  retry dispatch) become accurate once (c) lands — re-verify at implementation time, no edit.
  **Tests (label-keyed, the #1032 harness):** End-state items 5–7 — submodule-phase fixture
  prompts at both re-land labels carry `SUBMODULE PHASE:` + `targetRepo`; polish prompt carries
  the bare floor; floor-retry prompt carries the `--declared`-conditional floor; routing stubs
  for `submodule-blocked` (floor-retry → HARD escalate) and `submodule-pr` (re-land →
  `held:submodule-pr` + PR refs); polish `submodule-blocked` → DISCARD. Reuse the existing
  drivers — `runNoTestLoop` (floor-retry: a custom impl returning `submodule-blocked` on the
  second Refine call, mirroring T2 #280 Test 1's routing assertions), `clsImpl`/`CLS_ARGS` with
  a `landResult` override + the `submodRetryTask` fixture (both re-land labels), and
  T4 #297 Test 1 as the `submodule-pr` routing donor — expected zero net-new harness machinery.
  **Known collateral pins (update with eyes open, same commit):** the polish reword must keep
  satisfying the existing `/skip assert-test-in-diff\.sh/` and class-exempt assertions; any new
  **untagged** template literal the routing arms add (the escalated/audit-log entry heads)
  requires the matching `LITERAL_REGISTRY` multiset bump in `workflow-template.test.mjs` (the
  default-deny untagged-literal census REDs otherwise). Existing non-submodule
  prompt tests pass byte-unmodified (End state 11).
  **Sweeps:** the `submodLandNote` (expect 4), `assert-no-submodule-mutation` (expect 5
  dispatched-prompt sites — **site-classified**: name each hit's dispatch label, record extra
  non-prompt mentions separately, never a bare whole-file count), `submodule-pr|submodule-blocked`
  (every arm hard/held; read each hit in context), and `ALL floor invocations|all
  three|floor-retry` greps from spec §4.4, anchored to the named files, **plus**
  `grep -cF ': (args || {})' skills/war/assets/workflow-template.js` = 1 (Phase 2's fallback
  anchor must stay exactly-once through this phase's prose edits — caught here, not first by
  Phase 2's guard), plus the mandatory same-scope hand-scan; record survey-derived corrections
  in the done report. No `agents/war-refiner.md` edit (spec §2/§4.4-item-4 rationale — the
  standing card already states "always" and the submodule-as-repo generic coverage).
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Stager `--args` embedding + coupling + launch prose

### Task 2.1: `--args <file>` embedding in `stage-workflow.mjs`

- Files: `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/assets/workflow-template.js`, `skills/war/SKILL.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md`, `CONTEXT.md`
- Plan slice: spec §4.1 + §4.5. The CLI grows one optional value-attached flag —
  `[--args <file>]` — two-token only, never `--args=<file>`; usage string and the header-comment
  CLI line updated in the same commit; never describe the flag set with a blanket adjective in
  errors or blurbs (recorded deny-string lesson).
  **Parse:** peel `--args` and its value token from the raw `rest` **before** the `--force`
  filter and the positional split (the existing `--force` peel is boolean-only; this one removes
  two tokens); the value is the immediately-following token **verbatim**, so `--args --force`
  consumes `--force` as the filename and dies at the named read error (fail-loud, pinned by a
  test); `--args` as the last token (missing value) ⇒ the named usage error, non-zero; a second
  `--args` remaining after the peel (duplicate) ⇒ the named usage error, non-zero.
  **Validate before any write:** read the file, `JSON.parse`, require a non-null, non-array
  object — the ADR 0034 predicate mirrored from the template's entry guard. Read failure, parse
  failure, or a scalar/array/`null` result ⇒ one named `stage-workflow:`-prefixed stderr error,
  exit non-zero, no staged file written.
  **New exported anchor:** `ARGS_FALLBACK_ANCHOR` with the bytes of the template's string-arm
  fallback tail `: (args || {})` (verified exactly-once in the shipped template — the D8-guarded
  `const A =` ternary's object arm). The anchor-guard test imports it like the two meta anchors
  — never a second hardcoded copy.
  **Substitution order (the spec §2 invariant):** (1) the two existing meta-anchor
  substitutions; (2) when `--args` is present,
  `replaceExactlyOnce(staged, ARGS_FALLBACK_ANCHOR, ': (args || EMBEDDED_ARGS)')`; (3) **last**,
  prepend the prelude — one provenance comment line plus
  `const EMBEDDED_ARGS = <JSON.stringify(parsed)>` — to the top of the staged text. Payload
  bytes are injected only after every exactly-once count has run, so a payload quoting any
  anchor cannot fork the stage. `JSON.stringify` output is valid JS source (ES2019 JSON-superset
  grammar) — no re-escaping pass. Prelude placement above the template's opening COUPLING
  comment is legal (spec §8 latitude); any placement satisfying injected-after-all-substitutions
  is acceptable.
  **Contract preserved:** write-if-absent short-circuits before any `--args` processing exactly
  as today (path printed, exit 0) — with one addition: when `--args` was passed and the
  short-circuit fires, print one stderr warning line (`stage-workflow: existing staged file
  reused — --args ignored (pass --force to re-embed)`) so an operator who believes they just
  re-embedded is told otherwise; exit code and stdout stay byte-unchanged (resume flows
  re-running the same stage command see a harmless, accurate warning — never an error).
  Re-embedding changed args is a deliberate `--force` restage.
  Without `--args`, steps (2)–(3) never run — byte-identical output (End state 1). The fallback
  is `||`, deliberately matching the shipped hand edit — do NOT "fix" it to a deep-merge or
  emptiness check (spec §8; SKILL.md prose is the guard for the `{}`-is-truthy footgun).
  **Coupling comments (same commit, both surfaces):** a referential comment beside the fallback
  in `workflow-template.js` and beside the constant in the stager — each naming the other
  surface and the anchor-guard test as arbiter, **never restating the anchor bytes** (restating
  trips the exactly-once count — the meta-anchor comment discipline). Deliberate asymmetry,
  recorded so a worker does not "clean it up": the template comment **may and does** name
  `EMBEDDED_ARGS`/the stager (that name is the §4.4 sweep's expected template hit) while it
  must never contain the `: (args || {})` byte-run — naming the mechanism is referential;
  restating the anchor bytes forks the count. This is this task's only
  `workflow-template.js` touch; Phase 1 landed first, so no collision.
  **Tests:** extend the anchor-guard loop to the imported `ARGS_FALLBACK_ANCHOR`
  (exactly-once in the shipped template); the invalid-`--args` cases incl. duplicate-`--args`
  and the `--args --force` peel-ordering case (End state 3); the valid-`--args` staged-text
  assertions (End state 2 i–iii); the payload-quotes-anchor-bytes + JS-meta payload case (End
  state 4); the no-flag zero-`EMBEDDED_ARGS` negative (End state 1); the ignored-`--args`
  write-if-absent warning case (stderr line present, exit 0, staged file byte-untouched);
  existing restore-roundtrip tests pass unmodified.
  **SKILL.md (§4.5):** extend the "Stage the per-phase script first (ADR 0037)" paragraph — the
  real-size class (~104.5 KB: `args.memory` + verbatim plan slices + intent) writes the
  assembled args JSON to `$MAIN/.claude/war/runs/<runId>/args-p<phase.id>.json` (sibling of the
  staged script, untracked via the same existing `.claude/` ensure-exclude — no new ignore
  machinery) and passes `--args <that file>`; then dispatch the staged script with **no**
  Workflow `args` (a dispatched `{}` is truthy and beats the embedded fallback); dispatched
  args, when passed, always win; a `resumeFromRunId` resume of an `--args`-staged script needs
  no re-passed args (write-if-absent guarantees the resume sees the same embedded bytes — the
  staged script's top-level entry validation re-runs on resume, the exact incident shape #1134
  names); re-embedding changed args requires a deliberate `--force` restage. Also state:
  the concrete decision rule — campaign phases **default to `--args`** (assembled campaign args
  always carry `args.memory` + verbatim plan slices, the measured over-size class; small
  hand-built launches may stay inline); the residuals — a script staged **without** `--args`
  keeps today's behavior (an args-less resume still dies at entry validation; the embedded
  fallback exists only when `--args` staged it), and this note sanctions **no new resume
  path** (`resumeFromRunId` stays `held:phase-incomplete`-only per the existing §4.3/Resume
  doctrine); and one stage-failure runbook line — an exactly-once anchor failure names the
  offending anchor label, the remedy is the shipped template/stager pair (they version
  together), `--force` re-runs the same substitution and cannot help. The paragraph's inline
  stager command line gains `[--args <file>]`.
  **Doc truth (survey-derived; same commit):** the repo grep for `stage-workflow` shows exactly
  three stale-able CLI/substitution prose surfaces — `skills/war/SKILL.md` (above),
  `docs/adr/0037-run-scoped-staged-phase-scripts.md` ("replaces exactly once each of the
  **two** meta anchor literals"), and `CONTEXT.md`'s staged-phase-script entry ("substitutes
  the **two** `export const meta` anchor literals"). Amend the latter two: one dated amendment
  note in ADR 0037 and one clause in the CONTEXT.md entry, each naming the optional third
  exactly-once substitution (`--args` fallback embedding), phrased without the `EMBEDDED_ARGS`
  literal so the §4.4 four-surface grep expectation stays exact. No new glossary term
  ("embedded args" stays a mechanism of the staged-copy concept — the /war-machine review
  ruling, final).
  **Sweep:** the spec §4.4 `EMBEDDED_ARGS|ARGS_FALLBACK_ANCHOR` grep over the four named files —
  post-change hits exactly: stager (constant + prelude builder), test (imported anchor + cases),
  template (referential comment only, not the bytes), SKILL.md (launch prose) — plus the
  same-scope hand-scan recorded in the done report.
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Release

### Task 3.1: Version bump — all four slots

- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`
- Plan slice: this plan changes plugin-shipped surfaces (`skills/war/assets/stage-workflow.mjs`,
  `skills/war/assets/workflow-template.js`, their test assets, `skills/war/SKILL.md`) — users
  receive them only via a release. Bump all four release slots together to the **next free patch
  above the live integration base at land time** (never a resolved semver literal, per the
  /war-strategy §2 next-free-patch convention; version literals in plans are non-authoritative):
  `plugin.json` `version`, `marketplace.json` `metadata.version` **and** `plugins[0].version`,
  and the `README.md` `## Status` line (replace-in-place, never emptied, no badge).
  `skills/war/assets/version-slots.test.mjs` is the lock-step + monotonic-floor arbiter — a
  partial bump or a downgrade is a red test. Expected integration base: master tip (currently
  `738cf6a`) — or, when run inside the campaign, the campaign's live integration tip after
  every stacked predecessor (including its own release bumps) has landed; resolve the next free
  patch from the four slots **as they stand at land time**, never from any plan literal, so
  stacked-release lag is absorbed by construction. Standalone fallback: a run through plain
  `/war` (outside the campaign) resolves the next free patch from the four slots itself.
  An intervening external release landing between this phase's provision and its land surfaces
  as a **rebase conflict on the slot lines** at the serial merge (all four slots are same-line
  surfaces); the re-resolution recomputes the next free patch from the **rebased** tip — never
  resolved toward the worktree's stale copy (the recorded gate2-stale-verify-worktree revert
  shape) — with `version-slots.test.mjs`'s monotonic floor as the backstop.
  Release blurb describes the change additively and precisely — `--args <file>` stage-time args
  embedding (absent-args fallback only; dispatched args still win) and completed submodule
  floor/note coverage on the re-land, polish-merge, and floor-retry dispatch prompts,
  **naming the two operator-visible routing corrections explicitly** (a floor-retry
  `submodule-blocked` now HARD-holds the phase instead of soft-landing minus the task; a
  re-land `submodule-pr` now returns `held:submodule-pr` carrying the PR refs instead of
  `held:land-failed`), plus the
  `classificationClause` site-list drift guard — never a claim that any enum, floor script, or
  `land-decision.mjs` byte changed (they are untouched), and never a headline count its own
  enumeration does not match (recorded blurb lessons).
- requiresTest: false — the existing `version-slots.test.mjs` covers the bump
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- Integrated-tip sweep re-check — re-run the spec §4.4 greps once on the tip with **both**
  content phases landed (`submodLandNote` = 4, `assert-no-submodule-mutation` = 5
  dispatched-prompt sites, `EMBEDDED_ARGS`/`ARGS_FALLBACK_ANCHOR` on exactly the four named
  surfaces, every `submodule-pr`/`submodule-blocked` arm hard/held) · why deferred: each task's
  sweep runs pre-land in its own worktree; only the integrated tip proves the counts survived
  the serial merge queue and the cross-phase file handoff · runner: the Lead at Phase 3 land
  (before the release commit), from the repo root anchored to the named files.
- First real-size `--args` launch observation — one live phase launch staging with an actual
  large args file (the ~104.5 KB class) dispatched with no Workflow `args`, confirming entry
  validation passes via the embedded fallback · why deferred: needs a live `/war` run; the test
  suite proves the mechanism on fixtures, not the harness path end-to-end — this observation
  also re-proves the harness's absent-args dispatch behavior (args arrives falsy; the embedded
  fallback satisfies entry validation), which the phase-1 hand-edited staged copy demonstrated
  live exactly once · runner: the operator/Lead on the first campaign phase that uses `--args`,
  recorded in that run's notes; the entry rides `args.backstops` → `handoff.backstops` → the
  final PR like every backstop, so it stays visible until executed
  (spec §9 defers any new staged-file-size ceiling until observed).

## Notes / conscious deviations

- **Phase edge over the spec's "file-disjoint" seam claim:** spec §8 calls #1134 file-disjoint
  from #1114/#1151, but §4.1/§5 put the referential coupling comment inside
  `workflow-template.js` in the #1134 commit (same-commit both-surfaces coupling). The plan
  honors the same-commit rule and resolves the resulting shared-file collision with a phase
  edge (Phase 1 landed first) — never a deps-wave dodge. Recorded so an auditor reads the
  two-phase shape as deliberate, not as an unjustified landing-order constraint.
- **No `agents/war-refiner.md` edit** despite the both-surfaces rule: the standing card already
  states the target behavior (step 6 "always"; the submodule-as-repo section's generic
  coverage) — every dispatched-surface fix converges on it (spec §2 rationale, recorded for the
  auditor).
- The `{}`-is-truthy `||` fallback is the operator-approved phase-1 shape — a worker must not
  "improve" it (spec §8).
- **Resolve-round self-decisions (adversarial grill, 2026-07-26):**
  - **#1151 guard anchor widened** from spec row 9's `classificationClause\(refinery(?:Path|LandPath),`
    to the bare call-paren `classificationClause\(` — strengthen-under-latitude: the first-arg pin
    is blind to a 4th site passing any other base variable while the comment declares the guard
    arbiter; the bare anchor keeps every row-9 rationale (definition unmatchable via ` = (`,
    no ternary/trailing-context coupling) and closes the blind spot.
  - **Stage-time validation stays object-ness only** (no derivation-trio pre-check): the entry
    guard's own explicit-`branch`+`worktree` escape hatch makes a trio-less args object legal,
    so a stager-side trio check would false-reject a sanctioned launch shape. ADR 0034 parity
    is the deliberate ceiling.
  - **Ignored `--args` on write-if-absent = stderr warning, exit 0** (not an error): an error
    would break resume flows that re-run the identical stage command; the warning closes the
    operator's false "I re-embedded" belief without touching the ADR 0037 contract.
  - **Phase-edge direction is a preference, not a hard dependency:** serialization of the shared
    `workflow-template.js` file is the requirement; Phase 1-first is chosen for the
    anchor-guard bonus. If Phase 1 holds/escalates, the Lead may land Phase 2 first — the
    Phase 1 prose appends cannot legally introduce anchor bytes either way (both phases'
    exactly-once checks police it).
  - **Phase 1 alone is shippable:** floors-complete-without-`--args` is a coherent release; if
    Phase 2 is abandoned the Lead runs Phase 3 on Phase 1 alone and drops the `--args` item
    from the blurb.
  - **Floor-retry `submodule-blocked` phase-hold stands** (spec row 6, ratified): uniform with
    the three existing hard arms (primary, environment-proceed, baseline-proceed);
    `held:escalation` + Lead manual completion is the recorded runbook. Named in the release
    blurb because it is operator-visible.
  - **Re-land 2B idempotence:** a re-land running the submodLandNote 2B procedure is a *first*
    2B attempt — `held:submodule-pr` is terminal for the run (no land re-dispatch after it), and
    `gh pr create` fails loud on an existing open PR, so no duplicate-PR mechanism exists;
    verbatim append is correct, no retry-context adaptation needed.
  - **Polish DISCARD evidence trail:** the existing discard log line already interpolates the
    polish merge's returned status (`polish merge returned submodule-blocked`) and the polish
    branch is left in place (never-lose-unmerged-commits) — the Lead can see *why* before
    re-dispatching; no routing/demote edit.
  - **`args-p<phase.id>.json` retention accepted:** same lifecycle and exposure class as the
    staged scripts, run manifests, and journals it sits beside (untracked under
    `.claude/war/runs/`; the same content already rides dispatched prompts/transcripts); no new
    cleanup machinery (spec §9 non-goal). Embedding into staged bytes adds no new redaction
    surface beyond what the inline-args path already had.
  - **Untracked residuals, tracked by record not issue:** polish-worktree rooting for submodule
    phases stays untraced (spec §8 records it; harmless-if-unreached, correct-when-reached — no
    follow-up issue filed); the Bash-write-path scope-hook residual stays a non-goal tracked by
    its recorded lesson.
  - **Task 1.1 stays one task:** all seven edits live in the same two files (same-file ⇒ never
    parallel tasks), and no edit *depends* on another landing first — a deps-wave split would
    be the forbidden collision dodge, not a real dependency; the audit roster is the run
    config's concern (/war-room), not the plan's.
  - **Cross-plan contention is owned upstream:** both sibling 2026-07-26 specs
    (auditor-guard-policy-and-mirror-truth constraint 5; standing-doc-and-remedy-truth-sweep
    constraint 1) declare they land *after* this plan on every shared file
    (`workflow-template.js`/`.test.mjs`, `skills/war/SKILL.md`); /war-campaign's stack-and-plow
    serialization plus the roadmap ordering enforce it.
  - **Backstop 1's runner is the standing backstop pipeline**, not a new enforcement: the entry
    rides `args.backstops` → `handoff.backstops` → the final PR's "Unexecuted backstops" line
    until the Lead executes and records it — same for Backstop 2.

## Open decisions

None — the spec's design tree (§3 rows 1–10) is fully resolved; wording latitude inside named
floors (the polish skip-sentence reword, the `classificationClause` comment final wording, the
prelude placement) is the worker's.
