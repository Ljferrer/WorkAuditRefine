# workflow-template.test.mjs fidelity sweep — brittle extract regex, stale F05 labels, mispredicting comment, auditor-seat rationale Implementation Plan (issues #266 #267 #250 #221)

**Goal:** one cohesive test-hygiene pass over a single file — [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) — that closes four same-kind nits: a brittle extract-and-eval regex (#266), five-but-actually-six stale F05 D2/D3 labels after a rename (#250), a mispredicting comment + dead-local fix (#267, both halves un-fixed at HEAD — re-grounded from the earlier "pre-applied" claim), and a one-line deliberate-choice comment at the auditor-seat throw (#221). **Zero production change** — `workflow-template.js` and `war-servitor.md` already carry the canonical labels and the correct `blockedReason` body. Lands **last** in its stack (behavioral-before-cosmetic, landOrder 6). All edits are test-prose / robustness.

**Source spec:** [`docs/specs/2026-06-30-workflow-template-test-fidelity-sweep-design.md`](../specs/2026-06-30-workflow-template-test-fidelity-sweep-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source** (this slug = landOrder 6 = v0.8.6, re-baselined off master v0.8.0).
Memory hooks: [[regex-extract-live-code-lazy-quantifier-fragility]] (#266), [[relaxed-assertion-test-title-must-update-together]] + [[source-comment-lags-emitted-prompt-after-rewrite]] (#250), [[weak-test-assertion-passes-without-feature-being-exercised]] Variant 3 (#267), [[plan-line-number-refs-stale-use-construct-locator]] (all anchors by construct), [[version-slots-no-cross-slot-consistency-test]] (#release).

Anchors below are re-grounded against current master HEAD (`89e5968`, v0.8.0) after the two submodule-support increments (v0.7.8 guard + v0.8.0 first-class) landed and added +316 lines of submodule tests to this same file. The affected suite is green. **NOTE (re-grounding):** the pre-update fork point was `88c64cc` (v0.7.7); construct line numbers below moved only where the +316 churn pushed them down — re-anchor by named construct per [[plan-line-number-refs-stale-use-construct-locator]].

## Coordination

- **Target version:** **v0.8.6** (roadmap landOrder 6, severity LOW). Bumps `0.8.5 → 0.8.6`. (Re-baselined: master advanced to v0.8.0 via the two submodule increments; the six-spec stack now lands v0.8.1…v0.8.6 in the same serial order — this slug is last at v0.8.6.)
- **Integration base:** the **landed tip of Spec 5 (v0.8.5, `test-floor-script-glob-and-doc-hardening`)**, which itself sits on the **post-#268 tip**. This sweep is authored on a tree that **already contains Spec 2's (#268) Site-3 test** in this same file — **do NOT re-touch that region** (it is a sibling's landed work; nothing in this plan edits it).
- **Four-slot serial land (replace-in-place, no badge):** `.claude-plugin/plugin.json` `version`; `.claude-plugin/marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (line ~236). All four read `0.8.6` after the release task; no other slot left at a prior version. (At master HEAD all four read `0.8.0`.) There is no cross-slot consistency test — verify all four by hand ([[version-slots-no-cross-slot-consistency-test]]).
- **Standalone fallback:** if this is run **off current master (v0.8.0)** instead of the stack, **re-baseline the release to the next free patch** (v0.8.1 off the live tip) and **drop the prior-tip pin** — the version literal is NOT authoritative; the operator directive + the actual landed baseline is ([[stacked-per-branch-releases-make-main-lag-cumulative]]). The four test-prose edits (#266/#267/#250/#221) are baseline-independent and unaffected by the fallback.
- **Commit boundaries:** one task per issue (independent audits), one commit per task. The release is its own `chore(release):` commit. Five task-branches + a release, not one squashed commit — so the WAR refiner audits each nit separately.
- **One-task-per-phase:** every task touches the **same file** (`workflow-template.test.mjs`), so they are **strictly serial**, each landing on the prior's landed tip ([[war-phase-up-front-provisioning-conflicts-same-file-serial-tasks]]). Never parallel.

## Operator decisions — RESOLVED (bake in exactly)

- **#266 — anchor the lazy quantifier to the terminal token.** Change the extract regex terminator `null\)` → `:\s*null\)` so an interior `null)` (a future `|| null)` / `?? null)` branch) cannot truncate the capture. The existing 4-case totality test (`L3 T1 — blockedReason predicate is total`) **stays green** — that *is* the proof the colon-anchored capture still grabs the full arrow. No new test; the existing test is load-bearing.
- **#250 — rename ALL stale F05 sites: it is SIX, not five.** Live `grep -cE 'CORRECTION PRIORITY|VERIFY-CUE'` returns **6** (the spec's "five sites" counts the 2-line comment block as one). Edit all six occurrences: 2 comment lines (`~L1168-1169`) + 4 test titles (`~L1190/1203/1239/1246`). Swap `CORRECTION PRIORITY → TIER PRECEDENCE` and `VERIFY-CUE → VERIFY-ON-WRITE`. **Also reframe the L1168-1169 comment prose** to the tier-precedence framing so the comment doesn't itself become fresh source-comment-lags drift (production already frames D2 as tier-precedence in `workflow-template.js` / `war-servitor.md`). **Leave every `assert.match` semantic-token pattern byte-unchanged.** Post-condition: `grep -nE 'CORRECTION PRIORITY|VERIFY-CUE'` returns nothing.
- **#267 — APPLY both halves (NOT pre-applied; the original "already self-corrected" claim was wrong).** RE-GROUNDING CORRECTION: at current HEAD `89e5968` (and at the original fork `88c64cc`) BOTH halves are still un-fixed — the unused `t1Log` local IS present (`grep -c 't1Log'` returns **1**, at the line `const t1Log = (out.auditLog || []).find(e => e && e.task === 't1' && typeof e.fixRounds === 'number')`, inside `L3 T2 Test 1`), and the bind-deletion comment STILL mispredicts ("…makes the loop reach **audit-blocked** … and the blocked:'X' field is absent"). The +316 submodule churn did not touch this region; this was never self-corrected. So this task is a real two-edit fix, not verify-and-confirm: **(1) delete the dead `t1Log` local; (2) reword the comment** to the true outcome — deleting the fix-worker binding makes the loop re-audit and **approve+land** (the auditor returns `approve` once `fixDispatchCount > 0`), so the early-escalate path is skipped and `blocked:'X'` is absent. Confirm load-bearing: deleting the `'fix:t1:r1'` seqMap entry must fail the three token-`'X'` assertions (`t1Esc.blocked==='X'`, `logEntry.blocked==='X'`, and `t1Esc.reason==='escalate'`).
- **#221 — add the one-line deliberate-choice comment (operator-deferred = our call).** At the `war-auditor` throw (`~L1783`, `if (seat === 'war-auditor') throw new Error('injected-auditor-throw-after-worker')`) add a one-line comment: *auditor seat = first `agent()` past the worker, before any merge; `workerRan === true` guarantees the catch is reached mid-flow.* **Do NOT close with zero edit** — an empty diff risks the refiner flagging "nothing to commit" ([[report-nothing-to-commit-never-implement-unprompted]]). One concrete auditable artifact.
- **Zero production change** — `workflow-template.js` and `war-servitor.md` are untouched. The whole sweep is test-prose / robustness.

---

## Phase 1 — #266 brittle extract regex (latent fragility)

### Task 1 — Anchor the `blockedReason` extract regex to the terminal `: null)` token (#266)

**File:** `skills/war/assets/workflow-template.test.mjs` — locate by the **named construct** `const blockedReason\s*=\s*(r\s*=>` (the only such extract regex in the file; currently `~L1987`, inside the `L3 T1 — blockedReason predicate is total` test). The production arrow it captures (`workflow-template.js:157-158`, `const blockedReason = r => … : null)`) contains **exactly one** `null)` token today (the terminal `: null)`), so the capture is faithful now; the swap makes it stay faithful if a future interior `null)` branch is added.

**`requiresTest`: false (no NEW test) — the existing `L3 T1` 4-case totality test IS the load-bearing test;** it evals the captured arrow with `new Function`, so a mis-captured (truncated/unbalanced) regex makes `L3 T1` fail loudly. RED-on-regression is structural.

- [ ] **Step 1 — Establish the load-bearing baseline (no new test).** Run `node --test --test-name-pattern='L3 T1' skills/war/assets/workflow-template.test.mjs` → **green** at HEAD (the bare `null\)` regex captures the full arrow today). Confirm there is exactly one match site: `grep -n 'const blockedReason' skills/war/assets/workflow-template.test.mjs` → the extract regex line only.
- [ ] **Step 2 — Tighten the terminator.** In the extract regex, change `null\)` → `:\s*null\)`, so it reads `/const blockedReason\s*=\s*(r\s*=>[\s\S]+?:\s*null\))/`. Add a one-line comment that the colon anchors the terminal `: null)` branch (so an interior `null)` cannot truncate the lazy capture — [[regex-extract-live-code-lazy-quantifier-fragility]]).
- [ ] **Step 3 — GREEN + grep post-condition.** Run `node --test --test-name-pattern='L3 T1' skills/war/assets/workflow-template.test.mjs` → still **passes** (the colon-anchored regex captures the full arrow, all four totality assertions hold). `grep -n ':\\s\\*null\\\\)' skills/war/assets/workflow-template.test.mjs` finds the tightened pattern. Then run the **full** gate → green.
- [ ] **Step 4 — Commit** — `test(war): anchor blockedReason extract regex to terminal ': null)' so interior null) can't truncate (#266)`
- **Closes #266.** Latent fragility removed; the totality test still exercises the real predicate (proof the capture is intact).

---

## Phase 2 — #267 reword mispredicting comment + delete dead local

### Task 2 — Reword the bind-deletion comment + drop the dead `t1Log` local (#267)

**File:** `skills/war/assets/workflow-template.test.mjs` — the `L3 T2 Test 1 — blocked fix-worker escalates on round r` test (anchor by the test-title string, not a line number). **RE-GROUNDING CORRECTION:** both halves are STILL un-fixed at HEAD `89e5968` (and were un-fixed at the original fork `88c64cc` — the prior "already self-corrected" claim was never true; the +316 submodule churn did not touch this region). The "Load-bearing assertion" comment (block beginning `// Load-bearing assertion: deleting the fix-worker binding makes the loop reach audit-blocked`) STILL mispredicts; and `grep -c 't1Log'` returns **1** (the dead local survives at the line `const t1Log = (out.auditLog || []).find(e => e && e.task === 't1' && typeof e.fixRounds === 'number')`). This is a real **two-edit fix**, not verify-and-confirm. Variant 3 of [[weak-test-assertion-passes-without-feature-being-exercised]].

**`requiresTest`: false** — a comment reword + dead-local deletion; no behavioral change (the three token-`'X'` assertions are unchanged and remain load-bearing).

- [ ] **Step 1 — Delete the dead local.** Remove the exact line `const t1Log = (out.auditLog || []).find(e => e && e.task === 't1' && typeof e.fixRounds === 'number')` (anchor by the construct `const t1Log`, the only match in the file). Post-condition: `grep -c 't1Log' skills/war/assets/workflow-template.test.mjs` → **0**.
- [ ] **Step 2 — Reword the mispredicting comment.** The "Load-bearing assertion" comment block (the two `//` lines beginning `Load-bearing assertion: deleting the fix-worker binding makes the loop reach audit-blocked`) must be reworded to the TRUE outcome: deleting the fix-worker binding makes the loop re-audit and **approve+land** (the auditor returns `approve` once `fixDispatchCount > 0`), so the early-escalate is skipped and `blocked:'X'` is absent — assert on the unique token `'X'`. Post-condition: `grep -n 'reach audit-blocked' skills/war/assets/workflow-template.test.mjs` finds nothing in this comment.
- [ ] **Step 3 — Confirm load-bearing (sanity, not a committed edit).** Temporarily delete the `'fix:t1:r1'` seqMap entry (`{ 'fix:t1:r1': [{ task_id: 't1', status: 'blocked', blocked_reason: 'X' }] }`) and confirm the three token-`'X'` assertions (`t1Esc.reason==='escalate'`, `t1Esc.blocked==='X'`, the auditLog `logEntry.blocked==='X'` check) **fail** — proving the test exercises the feature. **Revert** the deletion.
- [ ] **Step 4 — Full gate → green.** Run `node --test --test-name-pattern='L3 T2 Test 1' …` → passes; then the full gate → green.
- [ ] **Step 5 — Commit** — `test(war): reword L3 T2 Test1 bind-deletion comment + drop dead t1Log local (#267)`.
- **Closes #267.** Dead local gone, comment names the real outcome (approve+land, not audit-blocked), test confirmed load-bearing.

> **ponytail:** #267 is now a genuine two-edit fix (both halves un-applied at HEAD — the original "verify-and-confirm" framing was based on a stale claim). Delete the dead local, reword the one comment, re-run green. Nothing more.

---

## Phase 3 — #250 realign the six stale F05 D2/D3 labels

### Task 3 — Rename all six pre-rename F05 labels to TIER PRECEDENCE / VERIFY-ON-WRITE (#250)

**File:** `skills/war/assets/workflow-template.test.mjs`. Live `grep -cE 'CORRECTION PRIORITY|VERIFY-CUE'` returns **6** (NOT five — the spec counts the 2-line comment block as one site). The six occurrences (anchor by the surrounding construct, not the line number — [[plan-line-number-refs-stale-use-construct-locator]]):
- the **F05 section comment block** (2 lines, `~L1168-1169`): `D2 — CORRECTION PRIORITY: …` / `D3 — VERIFY-CUE: …`
- `test('F05 — Wrap-up prompt: instructs CORRECTION PRIORITY …')` (`~L1190`)
- `test('F05 — Wrap-up prompt: instructs VERIFY-CUE …')` (`~L1203`)
- `test('F05 — war-servitor.md: admission checklist includes CORRECTION PRIORITY (D2)')` (`~L1239`)
- `test('F05 — war-servitor.md: admission checklist includes VERIFY-CUE (D3)')` (`~L1246`)

The `assert.match` patterns key on **semantic tokens** (`supersede|contradict|overrides?|replac`, `user.{0,40}outrank…`, `verify.{0,40}still.{0,40}present…`), **never** the label words — so this is pure title/comment drift and the renames keep the suite green. [[relaxed-assertion-test-title-must-update-together]].

**`requiresTest`: false** — title/comment string edits; the semantic `assert.match` patterns are byte-unchanged and stay green (they prove the renames are inert).

- [ ] **Step 1 — Confirm the assertions are label-independent (RED would be a bug).** Inspect the three `assert.match` patterns in the F05 block and confirm none matches the literal words `CORRECTION PRIORITY` / `VERIFY-CUE` (they key on `supersede|contradict|overrides?|replac`, `user.{0,40}outrank`, `verify.{0,40}still.{0,40}present`). These patterns must be **left byte-unchanged**. Establish green: `node --test --test-name-pattern='F05' skills/war/assets/workflow-template.test.mjs` → passes (9 tests).
- [ ] **Step 2 — Swap all six labels + reframe the comment prose.** At every one of the six sites: `CORRECTION PRIORITY → TIER PRECEDENCE`, `VERIFY-CUE → VERIFY-ON-WRITE`. **Also** reframe the L1168-1169 comment prose so it describes the landed semantics (D2 = "a higher tier supersedes a lower; `user-confirmed` outranks any agent write" rather than the old "user corrections outrank agent assertions"; D3 = "verify the referent is still present before acting") — matching production (`workflow-template.js`, `war-servitor.md`), so the comment doesn't become fresh [[source-comment-lags-emitted-prompt-after-rewrite]] drift. **Do not touch any `assert.match` regex.**
- [ ] **Step 3 — GREEN + grep post-condition.** `grep -nE 'CORRECTION PRIORITY|VERIFY-CUE' skills/war/assets/workflow-template.test.mjs` returns **nothing** (the V3 success criterion — authoritative over the 5-vs-6 prose). `node --test --test-name-pattern='F05' …` → still 9 tests pass. Then the **full** gate → green (title edits change `--test-name-pattern` match strings, so run the full self-discovering gate, not a pattern subset).
- [ ] **Step 4 — Commit** — `test(war): realign 6 stale F05 D2/D3 labels to TIER PRECEDENCE / VERIFY-ON-WRITE (#250)`
- **Closes #250.** All six sites renamed; semantic assertions byte-identical and green.

---

## Phase 4 — #221 deliberate-choice comment at the auditor-seat throw

### Task 4 — Document the auditor seat as the non-vacuous mid-phase throw injection point (#221)

**File:** `skills/war/assets/workflow-template.test.mjs` — the `M1 criterion #6` test (`throwAfterWorkerImpl`). Anchor by the throw string `if (seat === 'war-auditor') throw new Error('injected-auditor-throw-after-worker')` (`~L1783`). The at-HEAD naming is already accurate (title "mid-phase throw", mock `throwAfterWorkerImpl`, `landDecision === 'held:workflow-error'`); the only divergence is from now-historical PR-#214 plan prose ("after a merge"). We add a durable rationale rather than closing with a zero-edit diff (AD2 Option 1).

**`requiresTest`: false** — a one-line comment; no behavioral change.

- [ ] **Step 1 — Confirm non-vacuity.** Verify the catch path is inline cleanup (no teardown `agent()` dispatch) and the auditor throw is the first `agent()` past the worker — so the assertion is meaningful without a merge having happened. `workerRan === true` (asserted at `~L1789`) guarantees the catch is reached mid-flow. Establish green: `node --test --test-name-pattern='M1 criterion #6' skills/war/assets/workflow-template.test.mjs` → passes.
- [ ] **Step 2 — Add the one-line comment** immediately above the `war-auditor` throw: `// auditor seat = first agent() past the worker, before any merge; workerRan===true guarantees the catch is reached mid-flow — the non-vacuous injection point (supersedes historical 'after a merge' prose).`
- [ ] **Step 3 — GREEN.** `node --test --test-name-pattern='M1 criterion #6' …` → passes; then the **full** gate → green.
- [ ] **Step 4 — Commit** — `test(war): document auditor-seat injection point as the non-vacuous mid-phase throw (#221)`
- **Closes #221.** Durable rationale at the throw; the historical "after a merge" divergence is reconciled in-file (no zero-edit close).

---

## Phase 5 — Release v0.8.6

### Task 5 — Bump the four canonical version slots + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`); `.claude-plugin/marketplace.json` (`metadata.version` **and** `plugins[0].version`); `README.md` `## Status` (REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]], [[release-status-is-replace-slot-not-empty-field]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.5 → 0.8.6`.** Verify each by hand — there is no cross-slot consistency test, so a partial bump is gate-silent ([[version-slots-no-cross-slot-consistency-test]]). Update the README `## Status` "Builds on vX" clause to the new prior version (`v0.8.5`). Status copy: *workflow-template.test.mjs fidelity sweep — terminal-token-anchored extract regex, realigned F05 D2/D3 labels, reworded bind-deletion comment, auditor-seat rationale.* **Standalone fallback:** if running off master v0.8.0 (not the stack), bump to the **next free patch off the live tip** (v0.8.1) by construct, not the literal 0.8.6 — [[stacked-per-branch-releases-make-main-lag-cumulative]].
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.6 — workflow-template test fidelity sweep (#266/#267/#250/#221)`. Land last (behavioral-before-cosmetic, landOrder 6).

---

## Gate

Run the **full** self-discovering gate before **every** commit (not `--test-name-pattern` subsets — #250's title edits change pattern-match strings, so a stale pattern in a sibling runner or doc must surface):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- `node --test 'skills/**/*.test.mjs'` — **6** `.test.mjs` suites (quote the glob; bash 3.2 under-covers it unquoted — [[node-breadth-assertion-test-js-overclaims]]).
- The `for`-loop self-discovers every `*.test.sh` runner — **13 at master HEAD** (6 under `hooks/`, 7 under `skills/`; the v0.8.0 submodule increment added `skills/war/assets/assert-no-submodule-mutation.test.sh`). Self-discovered via the gate's own `find`, never a hardcoded count ([[task-prompt-suite-count-stale-after-stacking]]) — the literal here is descriptive, not load-bearing.

## Coverage

| Issue | Task | Kind | Closure |
|---|---|---|---|
| #266 | Task 1 (Phase 1) | regex robustness | terminal-token anchor `null\)` → `:\s*null\)`; existing `L3 T1` totality test is the load-bearing proof |
| #267 | Task 2 (Phase 2) | comment reword + dead-local delete | both halves un-fixed at HEAD (grep `t1Log`=1; comment still says "reach audit-blocked"); delete dead local + reword comment to approve+land; load-bearing sanity confirmed |
| #250 | Task 3 (Phase 3) | label drift | all **6** F05 sites renamed (2 comment + 4 titles) + comment prose reframed; `assert.match` patterns byte-unchanged; grep post-condition empty |
| #221 | Task 4 (Phase 4) | deliberate-choice comment | one-line rationale at the `war-auditor` throw; no zero-edit close |
| *(release)* | Task 5 (Phase 5) | version bump | four slots `0.8.5 → 0.8.6` (standalone fallback: next free patch off master v0.8.0) |

## Deliberate simplifications (ponytail)

- **#266 adds no new test.** The existing `L3 T1` evals the captured arrow with `new Function`; a truncated capture fails it loudly. A bespoke regression test would duplicate that coverage. *Add a dedicated test only if* the extract site is ever refactored away from `new Function`.
- **#267 is a two-line fix.** RE-GROUNDED: the fix does NOT live at HEAD (the prior "verify pass" framing rested on a stale claim — both halves are un-applied at `89e5968`). Delete the dead `t1Log` local + reword the one mispredicting comment. No new test (the three token-`'X'` assertions stay load-bearing and unchanged).
- **#221 is a comment, not a code move.** Moving the throw to a post-merge seat is strictly more code for zero added coverage (rejected by the spec for a Nit).
- **No production change, no ADR, no GitHub issue created by this plan** — pure test-file hygiene; the issue ids (#266/#267/#250/#221) are the audit findings.
- **#250 reframes the comment prose, not just the label tokens** — the one place this plan does *more* than a token swap, deliberately, to avoid leaving the comment as fresh source-comment-lags drift. Marked as a choice, not scope creep.
