# workflow-template.test.mjs fidelity sweep: brittle extract regex, stale post-rename titles, mispredicting comment, dead local

**Status:** proposed — targets **v0.7.13** (test-hygiene / cosmetic sweep). **Severity: LOW.**
**Source:** issues #266, #267, #250, #221. Memory: [[regex-extract-live-code-lazy-quantifier-fragility]], [[weak-test-assertion-passes-without-feature-being-exercised]] (Variant 3), [[relaxed-assertion-test-title-must-update-together]], [[source-comment-lags-emitted-prompt-after-rewrite]].

One cohesive test-hygiene polish across a single file — [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs). Four same-kind nits co-grouped so a single pass touches the file once instead of scattering four edits across the stack. **Zero production change** — pure test prose / robustness. Lands **last** in its stack per behavioral-before-cosmetic ordering (landOrder 6).

All anchors below were opened and confirmed at HEAD `88c64cc` (v0.7.7). The suite is green: 12/12 of the affected tests pass.

## Problem

Four independent test-fidelity defects live in one file. None affects coverage or behavior; each is a small prose/robustness fix.

1. **#266 — brittle extract regex (latent).** [test `L3 T1 — blockedReason predicate is total`](../../skills/war/assets/workflow-template.test.mjs) extracts the internal `blockedReason` const from `src` via regex and evals it with `new Function`. The extraction regex `/const blockedReason\s*=\s*(r\s*=>[\s\S]+?null\))/` uses a lazy `[\s\S]+?` that terminates on the **first** `null)` substring. The production [`blockedReason` arrow](../../skills/war/assets/workflow-template.js) (the `r => !r ? … : … : null)` const) contains exactly **one** `null)` token today (the terminal `: null)`), so the capture is faithful and all four assertions exercise the real predicate. But the boundary is keyed on a recurrable **content** token: any future interior `null)` (e.g. a new branch ending `|| null)` or `?? null)`) would truncate the capture to an unbalanced expression. Same shape as [[regex-extract-live-code-lazy-quantifier-fragility]], which the issue cites.

2. **#267 — comment mispredicts deletion failure-mode + dead local.** In [test `L3 T2 Test 1 — blocked fix-worker escalates on round r`](../../skills/war/assets/workflow-template.test.mjs): (a) the "Load-bearing assertion" comment originally predicted that deleting the fix-worker binding makes the loop **reach audit-blocked** — wrong. Tracing the `buildSeqImpl` harness: with the bind removed, the seqMap serves the first `fix:t1:r1` dispatch, so `fixDispatchCount` stays 0; the auditor returns `request_changes` only on the `fixDispatchCount === 0` branch and `approve` otherwise, so the next round re-audits and the task **approves + lands** — never audit-blocked. The three assertions (`t1Esc.reason==='escalate'`, `logEntry.blocked==='X'`, `fixCalls.length===1`) still fail RED on bind-deletion, so the test is genuinely load-bearing; only the narration was wrong. (b) a `const t1Log = …` local was computed but never referenced. **Already self-corrected in this worktree** (uncommitted) — verify-and-confirm. Variant 3 of [[weak-test-assertion-passes-without-feature-being-exercised]].

3. **#250 — five stale F05 labels after a D2/D3 rename.** M3 renamed the two wrap-up directives in [`workflow-template.js`](../../skills/war/assets/workflow-template.js) (`D2 TIER PRECEDENCE`, `D3 VERIFY-ON-WRITE`) and [`agents/war-servitor.md`](../../agents/war-servitor.md) (`D2 — Tier precedence.`, `D3 — Verify-on-write.`), but that task was scope-locked to the impl file and could not realign the sibling test file. The test still narrates the **pre-rename** labels at five sites: the F05 [section comment block](../../skills/war/assets/workflow-template.test.mjs) (two lines, `D2 — CORRECTION PRIORITY` / `D3 — VERIFY-CUE`) and four test titles — `instructs CORRECTION PRIORITY`, `instructs VERIFY-CUE`, `admission checklist includes CORRECTION PRIORITY (D2)`, `admission checklist includes VERIFY-CUE (D3)`. The issue named only three; a grep found two more (the war-servitor.md admission-checklist titles). The `assert.match` patterns key on **semantic tokens** (`supersede|contradict|overrides?|replac`, `verify.{0,40}still.{0,40}present`, `user.{0,40}outrank`), never the label words — so this is pure title/comment drift. [[relaxed-assertion-test-title-must-update-together]].

4. **#221 — M1 criterion-6 mock throws on the auditor seat, not literally "after a merge".** [test `M1 criterion #6 — catch after a mid-phase throw skips teardown`](../../skills/war/assets/workflow-template.test.mjs) injects the throw on the `war-auditor` seat. The auditor panel runs strictly after the worker and strictly **before** any task-branch merge, so it does not literally match the historical PR #214 plan prose "throws AFTER at least one merge". But the at-HEAD code is **already accurate**: title says "mid-phase throw", the mock is `throwAfterWorkerImpl`, the comment says "should not be reached since auditor throws first", and the error is `injected-auditor-throw-after-worker`. Nothing in-file misleads; the only divergence is from now-historical plan text. The catch path is identical from any mid-phase throw past the worker, and teardown is inline cleanup (not an observable `agent()` call), so the assertion is meaningful without a merge having happened.

## Decisions

| # | Issue | Decision | Choice | Rejected alternative |
|---|-------|----------|--------|----------------------|
| D1 | #266 | How to pin the lazy quantifier's terminator | Anchor to the token unique to the terminal position: change `null\)` → `:\s*null\)`, i.e. regex becomes `/const blockedReason\s*=\s*(r\s*=>[\s\S]+?:\s*null\))/`. Optional one-line comment that the colon anchors the terminal branch. | Paren-depth matching or line-range extraction (larger, unnecessary for one const); exporting `blockedReason` from the module (production change for a test convenience — out of scope). |
| D2 | #267 | Comment + dead local | Verify the worktree's self-correction is present and correct: comment reworded to "re-audit and approve+land; blocked:'X' is absent", `t1Log` local deleted. Confirm RED-on-bind-deletion and re-run green. | Re-editing (already applied); moving the load-bearing logic (test is already correct). |
| D3 | #250 | Realign the five stale labels | Five string edits, one file: section comment `CORRECTION PRIORITY`→`TIER PRECEDENCE` and `VERIFY-CUE`→`VERIFY-ON-WRITE`; four test titles likewise. **Leave every `assert.match` pattern untouched** (semantic-token based, must stay green). | Touching the regexes (would break green for no reason); fixing only the three sites the issue named (leaves two stale). |
| D4 | #221 | Reconcile the plan-prose divergence | Treat "after a merge" as superseded-by-HEAD — at-HEAD names are already accurate, nothing in-file misleads. **Smallest honest option:** add a one-line deliberate-choice comment at the auditor throw, e.g. `// auditor seat = first agent() past the worker, before any merge; teardown would run from here — the non-vacuous injection point`. Acceptable to close as superseded without any edit. | Moving the throw to a post-merge refiner seat (strictly more code, zero added coverage — rejected for a Nit). |

## Surface changes

| File | Change |
|------|--------|
| [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) | #266: one-token regex tighten (`null\)`→`:\s*null\)`) + optional anchor comment. #267: confirm reworded comment + deleted `t1Log` (already in worktree). #250: five label string edits (1 comment block + 4 titles). #221: one deliberate-choice comment at the auditor throw (or no-op if closed as superseded). |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` (`## Status`) | Version serialization to v0.7.13 (four canonical slots, replace-in-place). |

No production source (`workflow-template.js`, `war-servitor.md`) changes.

## Alternatives considered

- **Status quo (do nothing).** Rejected: #266 is latent fragility that will surface as a confusing `new Function` SyntaxError on a future edit; #250 leaves five sites narrating pre-rename labels; #267's mispredicting comment misleads the next reader about what the test guards. All cheap to fix in one pass.
- **Scatter the four nits across their natural stacks.** Rejected by the group rationale: four same-kind edits to one file, co-grouped so the file is touched once. Landed last (cosmetic after behavioral).
- **Heavier #266 fix (balanced-paren / line-range extraction).** Rejected — the colon anchor is the smallest change that removes the recurrable-token dependency.
- **#221: move the throw to a real post-merge seat.** Rejected — more code, no added coverage, for a Nit where the at-HEAD naming is already correct.

## Validation criteria

One concrete criterion per assigned issue:

1. **#266** — In `workflow-template.test.mjs`, the `blockedReason` extraction regex terminates on `:\s*null\)` (not bare `null\)`). Proof: `node --test --test-name-pattern='L3 T1' skills/war/assets/workflow-template.test.mjs` passes (the colon-anchored regex still captures the full arrow); and a grep `grep -n ':\\\\s\\*null\\\\)' skills/war/assets/workflow-template.test.mjs` finds the tightened pattern.
2. **#267** — The "Load-bearing assertion" comment at the top of `L3 T2 Test 1` states the bind-deletion outcome is **re-audit + approve+land** (not audit-blocked), and `grep -c 't1Log' skills/war/assets/workflow-template.test.mjs` returns `0`. `node --test --test-name-pattern='L3 T2 Test 1'` passes; sanity-spot that deleting the `'fix:t1:r1'` seqMap entry makes the three token-`'X'` assertions fail (load-bearing).
3. **#250** — `grep -nE 'CORRECTION PRIORITY|VERIFY-CUE' skills/war/assets/workflow-template.test.mjs` returns **no matches** (all five sites renamed to `TIER PRECEDENCE` / `VERIFY-ON-WRITE`), while every `assert.match` semantic pattern is byte-unchanged. `node --test --test-name-pattern='F05'` passes (9 tests).
4. **#221** — Either: a deliberate-choice comment at the `war-auditor` throw documents that the auditor seat is the first `agent()` past the worker and before any merge (the non-vacuous injection point); or the issue is closed superseded-by-HEAD with a note that the at-HEAD names (`throwAfterWorkerImpl`, "mid-phase throw", "throws on the auditor", `injected-auditor-throw-after-worker`) already match reality. `node --test --test-name-pattern='M1 criterion #6'` passes.
5. **Whole-suite green + version bump.** `node --test "skills/**/*.test.mjs"` passes, and all `*.test.sh` runners (self-discovered, not a hardcoded count) pass. The four canonical version slots (`.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` ×2, `README.md ## Status`) all read **0.7.13** with no other slot left at a prior version.

## Open risks / non-goals

- **Non-goal: any production change.** `workflow-template.js` and `war-servitor.md` already carry the canonical labels and the correct `blockedReason` body; this sweep only realigns the test file's prose and robustness.
- **Non-goal: re-touching the #268 Site-3 region.** Group 2 (#268) lands first and adds a Site-3 test to this same file; this sweep is authored on a tip that already contains it and must **not** edit that region.
- **#267 is partly pre-applied.** The fix already exists uncommitted in the worktree — the task is verify-and-confirm, not re-author. If a clean checkout is used, re-apply the two edits (comment reword + `t1Log` deletion).
- **Version serialization.** Replaces the four canonical version slots in place (no badge). Lands serially as landOrder 6 — last in the stack, behavioral-before-cosmetic.

## Coverage map

| Issue | Decision | Validation |
|-------|----------|------------|
| #266 | D1 | V1 |
| #267 | D2 | V2 |
| #250 | D3 | V3 |
| #221 | D4 | V4 |

Gate to run before landing: `node --test "skills/**/*.test.mjs"` plus all `*.test.sh` runners (discovered via the gate's own `find`, not a literal count — per [[task-prompt-suite-count-stale-after-stacking]]).
