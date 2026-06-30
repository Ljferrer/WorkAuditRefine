# No-test sub-loop: exit-2 mis-routing, enum hygiene, and gate-evidence reporting Implementation Plan

**Goal:** close five issues clustered in the **no-test sub-loop region** of `workflow-template.js` (the merge-task
dispatch prompts + the escalation push + the `HARD_ESCALATION_REASONS` reuse) and the gate-evidence reporting boundary.
Only **#237** is a real (latent) routing defect: a refiner acting on the **dispatched prompt** (which says "exits
non-zero → `no-test`") rather than the standing `war-refiner.md` collapses a transient **exit-2** bad-ref into
`status:'no-test'`, kicking a pointless add-test fix-worker + full re-audit against code whose only problem was a flaky
ref. The other four are nits — exact rewords (#236/#235/#269) or one additive test (#268). Co-grouping turns five
would-be cross-spec rebase conflicts into one cohesive serial stack.

**Source spec:** [`docs/specs/2026-06-30-no-test-routing-enum-gate-evidence-design.md`](../specs/2026-06-30-no-test-routing-enum-gate-evidence-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) (authoritative version source).
**No new ADR** — these are prompt/comment/test edits; no architectural decision recorded.

## Coordination

- **Target version:** **v0.7.9** (doc/correctness sweep, **landOrder 2**, severity **MED**).
- **Integration base:** the **landed tip of Spec 1** ([land-advance origin propagation, v0.7.8](../specs/2026-06-30-land-advance-origin-propagation-design.md), #251).
  #236's land-side check (`workflow-template.js` line ~527, the `HARD_ESCALATION_REASONS.includes(landResult.status)`
  guard) is **adjacent to** Spec 1's land-phase prompt (the step-3 land-advance call ~`:511-523`). Author #236 against
  the **post-#251 tip** so the comment lands clean rather than rebase-conflicting on Spec 1's land-phase edit. Pin the
  integration base to Spec 1's landed merge-tip; verify with `git ls-remote` before dispatch.
- **Four-slot serial release:** the version slots — `.claude-plugin/plugin.json` `version`,
  `.claude-plugin/marketplace.json` (`metadata.version` **and** `plugins[0].version`), `README.md` `## Status`
  (REPLACE-in-place, "Builds on v0.7.8") — are **replace-in-place** and land in **one release commit** at the tip of
  this stack. No badge. There is no cross-slot consistency test — verify all four by hand at the release commit
  (memory `version-slots-no-cross-slot-consistency-test`).
- **Standalone fallback:** if this is run off current `master` (v0.7.7) instead of the stack, **re-baseline the release
  to the next free patch by construct** (v0.7.8 if Spec 1 has not landed) and **drop the prior-tip pin** — #236's
  adjacency to Spec 1's land-phase prompt is the only reason the pin exists, and without #251 in the base there is no
  conflict to avoid. The version literals below say v0.7.9 because that is the roadmap target; the next-free-patch rule
  wins if the stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

## Build order (for `/war`)

All four prose tasks touch `workflow-template.js` in the same ~320-530 region, so they run **strictly serial**, each
rebased on the prior's landed tip — **one task per phase** (memory
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`). Parallelizing any of them WILL rebase-conflict.

1. **Phase 1 — #237** routing fix (both merge-task dispatch prompts). The substantive change; everything else is adjacent.
2. **Phase 2 — #236** land-side enum-reuse comment (pin the integration base here; adjacent to Spec 1's land-phase prompt).
3. **Phase 3 — #235** reAuditFailed guard-comment reword.
4. **Phase 4 — #269** `gate_output` completeness clause (template ×2 + `war-refiner.md` step 5).
5. **Phase 5 — #268** Site-3 blocked-add-test behavioral test (additive test code; disjoint test file but still serial on the tip).
6. **Phase 6 — Release** v0.7.9.

## Decisions baked in (from spec, RESOLVED)

- **D1 (#237):** rewrite the exit-code clause in **both** merge-task dispatch prompt strings to mirror `war-refiner.md`
  step 4 — **exit 1 → `no-test`** (do NOT merge); **exit 2 → `error`** (git/ref error, never `no-test`). Prose-only; the
  sub-loop already keys on `mr.status === 'no-test'`, so an exit-2 `error` simply stops entering the branch. No
  production control-flow change; no `.md` change for #237 (step 4 is already correct — the template is brought *to* it).
- **D2 (#236):** add an inline comment at the land-side check stating `'no-test'` is structurally unreachable there (no
  land-phase prompt emits it). **Do NOT remove `'no-test'` from `HARD_ESCALATION_REASONS`** — it is load-bearing on the
  merge-task escalation path, AND the drift-guard `war-config.test.mjs:356` asserts the inline array deepEquals the
  canonical export incl. `'no-test'`, so removal is **gate-blocked**. Comment-only is the only gate-green path.
- **D3 (#235):** reword the comment on `if (reAuditFailed) continue` to name its real role (null-deref guard before the
  `noTestMr.status` deref) and **drop the stale parenthetical line numbers** (`lines 358-359` — actually stale; the real
  escalation+null-set pairs are at `353-356` blocked and `370-373` re-audit-failed). Any new literal re-stales, so drop
  it entirely. Comment-only.
- **D4 (#269):** append one completeness clause to the `gate_output` population sentence at all three sites (template ×2
  + `war-refiner.md` step 5): *do NOT curate/excerpt; include the complete `*.test.sh` runner list or state the total
  runner count*. **State "total runner count", never a hardcoded `12`** — a 13th runner would silently stale the
  directive (memory `task-prompt-suite-count-stale-after-stacking`). Prompt-only.
- **D5 (#268):** add one `buildSeqImpl`-driven test driving merge-task→`no-test` then a **blocked** add-test worker,
  asserting the Site-3 outputs load-bearing on the unique token `no-test:add-test-blocked` (zero occurrences today).
  The M2 tests (`L3 T2 Test 1`/`Test 2`) drive the *implemented* add-test path only — they never exercise the **blocked**
  add-test escalation outcome, so the cover claim does not hold for Site 3 (memory
  `retrofit-site-existing-tests-as-regression-guard`). Purely additive test code.

---

## Phase 1 — #237 exit-code routing fix (both merge-task dispatch prompts)

### Task — Split exit-1-vs-2 in both merge-task dispatch prompt strings

**Files:** `skills/war/assets/workflow-template.js` (two prompt strings), `skills/war/assets/workflow-template.test.mjs`
(one grep-guard test). **`requiresTest`: true** — the grep-guard is the mapped behavioral assertion.

**Anchors (by construct, not line — they drift after Spec 1 lands):**
- Prompt A: the **requiresTest-branch** merge prompt — the template string containing
  `run assert-test-in-diff.sh ${ph.integrationBranch} ${r.task.branch} to verify the task diff contains at least one
  test file. If the script exits non-zero, return { mode: 'merge-task', status: 'no-test' } — do NOT proceed with the
  merge.` (HEAD ~:332).
- Prompt B: the **no-test-retry** merge prompt — `… now contains at least one test file. If the script exits non-zero,
  return { mode: 'merge-task', status: 'no-test' }.` (HEAD ~:388).
- Authority to mirror: `agents/war-refiner.md` step 4 (exit 0 continue / exit 1 → `no-test` / exit 2 → `error`,
  never `no-test`) — already correct at HEAD (lines 27-29).

- [ ] **Step 1 — Write the grep-guard test (RED first).** In `workflow-template.test.mjs`, add a test
  `#237 — both merge-task dispatch prompts split exit-1 (no-test) from exit-2 (error), no non-zero collapse`.
  Render the template text (the same way the existing prompt tests do) and, **for each of the two merge prompts**,
  assert the **load-bearing tokens**: the prompt mentions **`exit 2`** AND **`error`**, AND **`exit 1`** AND
  **`no-test`**, AND the **negative assertion** that the prompt does **not** contain the substring `exits non-zero`
  (the collapse phrasing). The negative + the `exit 2`/`error` presence together are load-bearing: a test matching only
  the still-legitimate word `no-test` (exit-1 path) would pass against BOTH old and new text (memory
  `weak-test-assertion-passes-without-feature-being-exercised`). Run → **FAIL** (template still says `exits non-zero`).
- [ ] **Step 2 — Rewrite both clauses (GREEN).** Replace the `If the script exits non-zero, return { … status:
  'no-test' }` clause in **both** prompt strings with the exit-1-vs-2 split, e.g.: *"Branch on the exit code: **exit 1**
  (no test in the diff) → return `{ mode: 'merge-task', status: 'no-test' }`, do NOT merge; **exit 2** (a git/ref error
  — bad ref, fatal git failure) → return `{ mode: 'merge-task', status: 'error' }`, **never** `no-test` — a transient
  bad-ref must not spin a pointless add-test loop."* Mirror `war-refiner.md` step 4 wording. Prose-only; the
  `mr.status === 'no-test'` predicate is unchanged. Run → **GREEN**.
- [ ] **Step 3 — Run the full gate → green.**
- [ ] **Step 4 — Commit** — `fix(war): split exit-1-vs-2 in both merge-task dispatch prompts so a transient bad-ref returns error not no-test (#237)`
- **Closes #237.** Manual trace: an exit-2 result now returns `error`, which does not satisfy `mr.status === 'no-test'`,
  so the add-test sub-loop is never entered for a bad-ref.

---

## Phase 2 — #236 land-side enum-reuse comment (pin integration base here)

### Task — Comment that `'no-test'` is unreachable on the land-side `HARD_ESCALATION_REASONS` reuse

**Files:** `skills/war/assets/workflow-template.js` (one inline comment). **`requiresTest`: false** — comment-only;
the existing M2 budget-exhaustion test + the `war-config.test.mjs:356` drift-guard are the regression guards.

**Anchor:** the `if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {` guard (HEAD ~:527), inside
the land-result dispatch block, just after Spec 1's land-phase prompt body (~:511-523). Locate by the
`HARD_ESCALATION_REASONS.includes(landResult.status)` construct, never a line number.

- [ ] **Step 1 — (no behavioral test — comment-only.)** Confirm: do NOT touch `HARD_ESCALATION_REASONS` (line ~504) —
  the drift-guard `war-config.test.mjs:356` asserts the inline array deepEquals the canonical export incl. `'no-test'`,
  so any narrowing goes RED. The comment is the only gate-green hardening (memory
  `shared-status-enum-widening-silently-widens-land-path`). **This deliberately takes the _comment_ arm of #236's own
  "scope the land-side check to `mode==='merge-task'` **or** comment its unreachability" disjunction** — a literal
  `&& landResult.mode==='merge-task'` predicate at ~:527 would never fire (this guard only ever sees a land-phase
  result) and would silently disable `land_stale`/`conflict` hard-escalation on the land path: a regression, not a
  hardening. (The roadmap's shorthand "narrow … to mode" is satisfied by the comment arm here.)
- [ ] **Step 2 — Add the inline comment.** At the land-side guard, add a comment stating: `'no-test'` is **structurally
  unreachable here** — no land-phase prompt emits it (land statuses are only `landed`/`land_stale`/`gate_failed`/
  `error`); the array is **reused** from the merge-task escalation path where `'no-test'` IS load-bearing, so it is
  **kept intact**, not narrowed. No array edit, no logic change.
- [ ] **Step 3 — Run the full gate → green** (existing M2 budget-exhaustion test still asserts `held:escalation`;
  drift-guard still green).
- [ ] **Step 4 — Commit** — `docs(war): comment that 'no-test' is unreachable on the land-side HARD_ESCALATION_REASONS reuse, keep array intact (#236)`
- **Closes #236.**

---

## Phase 3 — #235 reAuditFailed guard-comment reword

### Task — Reword the reAuditFailed `continue` comment to name its null-deref-guard role

**Files:** `skills/war/assets/workflow-template.js` (one comment). **`requiresTest`: false** — comment-only;
the existing no-test sub-loop tests are the regression guard (any logic change would break them).

**Anchor:** the comment on `if (reAuditFailed) continue` (HEAD ~:399-400: `// Vacuous re-audit path: escalation already
pushed above (lines 358-359), noTestMr===null`). Locate by the `if (reAuditFailed) continue` construct.

- [ ] **Step 1 — (no behavioral test — comment-only.)** Confirm the real role: both sites that set
  `reAuditFailed = true` (the blocked-add-test branch ~:353-356 and the re-audit-failed branch ~:370-373) **also set
  `noTestMr = null`**; the unconditional `noTestMr.status` deref below (~:403) would crash without the `continue`. The
  cited `(lines 358-359)` is **stale** (those lines are unrelated). It is the **sole null-deref guard**, not
  belt-and-suspenders.
- [ ] **Step 2 — Reword the comment.** Name the real role and **drop the parenthetical line numbers entirely** (any new
  literal re-stales), e.g.: *"Null-deref guard: both reAuditFailed=true sites set noTestMr=null; skip before the
  unconditional noTestMr.status deref below."* No logic change.
- [ ] **Step 3 — Run the full gate → green** (all no-test sub-loop tests still pass).
- [ ] **Step 4 — Commit** — `docs(war): reword reAuditFailed continue comment to name its null-deref-guard role, drop stale line refs (#235)`
- **Closes #235.**

---

## Phase 4 — #269 gate_output completeness clause (template ×2 + war-refiner.md step 5)

### Task — Forbid curating gate_output excerpts; require full runner list or total count

**Files:** `skills/war/assets/workflow-template.js` (two `gate_output` sentences), `agents/war-refiner.md` (step 5).
**`requiresTest`: false** — prompt-only; V4 is a grep over all three sites.

**Anchors (by construct):**
- Template sentence A: `On success, populate gate_output in the returned MergeResult with the executed gate output
  (stdout+stderr) so the post-merge gate-audit pass can review it as execution evidence.` (HEAD ~:329).
- Template sentence B: the identical sentence in the no-test-retry prompt (HEAD ~:386).
- `war-refiner.md` step 5: `**Populate \`gate_output\`** with the full stdout+stderr of the gate run from step 2 …`
  (HEAD line 31).

- [ ] **Step 1 — (no behavioral test — prompt-only.)** Pick one exact grep-assertable token for the new clause (e.g.
  `do NOT curate`) so V4 can confirm it in all three sites.
- [ ] **Step 2 — Append the completeness clause to all three sentences.** Append, e.g.: *"Do NOT curate or excerpt —
  each `*.test.sh` runner emits a single aggregate PASS line, so a partial paste reads as an under-run; include the
  complete `*.test.sh` runner list or state the total runner count."* **Use "total runner count", never a literal
  `12`** (memory `task-prompt-suite-count-stale-after-stacking`). Same clause, adapted to each surface's prose form.
- [ ] **Step 3 — Run the full gate → green; manual:** `grep -rn 'do NOT curate' skills/war/assets/workflow-template.js agents/war-refiner.md`
  finds the clause at all three sites.
- [ ] **Step 4 — Commit** — `docs(war): forbid curating gate_output excerpts; require full runner list or total count (#269)`
- **Closes #269.**

---

## Phase 5 — #268 Site-3 blocked-add-test behavioral test

### Task — Cover the blocked add-test-worker escalation outcome (Site 3, `no-test:add-test-blocked`)

**Files:** `skills/war/assets/workflow-template.test.mjs` (one additive test). **`requiresTest`: true** — this IS the test.
No production change.

**Site-3 anchor (the branch under test, HEAD ~:350-358):**
```
const addFixWhy = blockedReason(addFix)
if (addFixWhy) {
  escalated.push({ task: r.task.id, reason: 'escalate', blocked: addFixWhy })
  auditLog.push({ task: r.task.id, verdict: 'no-test:add-test-blocked', findings: [], blocked: addFixWhy, fixRounds: r.task.fixRounds })
  noTestMr = null; reAuditFailed = true; break
}
```

**Harness pins (verified at HEAD):**
- Use `buildSeqImpl(seqMap, fallback)` (HEAD ~:525), keyed on `opts.label`. The add-test worker label is
  `add-test:${r.task.id}:r${r.task.fixRounds + 1}` → for `t1` on the first round this is **`add-test:t1:r1`** (HEAD
  ~:349). The seqMap key MUST be exactly `add-test:t1:r1` or the stub never fires.
- The blocked worker result MUST use field name **`blocked_reason`** (matches existing fixtures ~:673/:1425 and the
  `blockedReason` predicate at production ~:157): `{ task_id: 't1', status: 'blocked', blocked_reason: 'Y' }`. A wrong
  key (e.g. `blocked`) makes `blockedReason` falsy, the Site-3 branch never fires, and the test passes by exercising the
  wrong path (memory `weak-test-assertion-passes-without-feature-being-exercised`).
- Model the fallback closure on `L3 T2 Test 1` (HEAD ~:2032): the merge-task refiner returns
  `{ mode: 'merge-task', status: 'no-test' }` (to enter the sub-loop), the worker returns implemented, the auditor
  approves; the seqMap supplies the blocked add-test worker on the `add-test:t1:r1` label.

- [ ] **Step 1 — Write the test (RED first).** Add `#268 — blocked add-test worker escalates via Site 3 (no-test:add-test-blocked)`.
  Drive merge-task → `no-test`, then the **blocked** add-test worker on label `add-test:t1:r1` returning
  `{status:'blocked', blocked_reason:'Y'}`. Run it (against current code it PASSES — this is the regression guard, not a
  TDD-against-unwritten-code case). **Verify it is load-bearing:** transiently delete/comment the Site-3 `escalated.push`
  + `auditLog.push` (the `if (addFixWhy)` body), re-run, confirm the test **FAILS** (RED on the unique token), then
  restore. This proves the assertions exercise Site 3 (memory `retrofit-site-existing-tests-as-regression-guard`).
- [ ] **Step 2 — Assertions.** Assert: exactly one `escalated` entry for `t1` with `{reason:'escalate', blocked:'Y'}`;
  exactly one `auditLog` entry with `{verdict:'no-test:add-test-blocked', blocked:'Y'}`; **no** `no-test:exhausted`
  verdict present; `t1` does not land; `landDecision === 'held:escalation'` (`escalate` ∈ `HARD_ESCALATION_REASONS`).
  The token `no-test:add-test-blocked` is load-bearing (zero occurrences in the test file today).
- [ ] **Step 3 — Run the full gate → green.**
- [ ] **Step 4 — Commit** — `test(war): cover the blocked add-test-worker escalation outcome (Site 3, no-test:add-test-blocked) (#268)`
- **Closes #268.**

---

## Phase 6 — Release v0.7.9

### Task — Version bump v0.7.9 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`, HEAD :4); `.claude-plugin/marketplace.json` (`metadata.version`
:7 **and** `plugins[0].version` :14); `README.md` `## Status` (HEAD ~:224, REPLACE-in-place, "Builds on v0.7.8").
**No badge.**

- [ ] **Step 1 — Bump all four slots `0.7.8` → `0.7.9`** (or next-free-patch by construct per the standalone fallback —
  v0.7.8 if Spec 1 has not landed). Update the README `## Status` "Builds on vX" clause to the new prior version
  (currently "Builds on v0.7.6" at HEAD; it becomes "Builds on v0.7.8" once Spec 1 lands). Verify all four slots + the
  Builds-on line **by hand** — no cross-slot consistency test (memory `version-slots-no-cross-slot-consistency-test`,
  `release-bump-slots-canonical-no-badge`, `release-status-is-replace-slot-not-empty-field`). Status copy: no-test
  sub-loop hygiene — exit-1-vs-2 routing fix + land-side enum comment + reAuditFailed guard-comment + gate_output
  completeness clause + Site-3 blocked-add-test coverage.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.7.9 — no-test exit-routing fix + enum/comment/gate-evidence hygiene (#237 #236 #235 #269 #268)`

---

## Gate

The self-discovering multi-runner (quote the `.mjs` glob — bash 3.2 under-covers it unquoted):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**6 `.test.mjs`** (`skills/_shared/provision.test.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`,
`skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/war/assets/land-decision.test.mjs`,
`skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.test.mjs`) **+ 12 `*.test.sh` runners**
(6 `hooks/` + 6 `skills/`) at HEAD. The gate self-discovers — never assert a literal runner count. If the cross-branch
merge from Spec 1 adds a runner, the `find` loop picks it up automatically; run the WHOLE gate post-merge (memory
`gate-under-covers-after-cross-branch-merge-new-runner`).

## Test plan

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| #237 | new grep-guard in `workflow-template.test.mjs` | both merge prompts: `exit 2`+`error` AND `exit 1`+`no-test` present; **no** `exits non-zero` collapse | load-bearing negative assertion — matching bare `no-test` passes against old+new |
| #236 | (no test — comment) | full gate green; drift-guard `war-config.test.mjs:356` + M2 budget test still green | array intact; comment-only |
| #235 | (no test — comment) | full gate green; all no-test sub-loop tests still pass | drop stale line refs |
| #269 | (no test — prompt) | `grep 'do NOT curate'` finds the clause at all 3 sites | "total runner count", no literal `12` |
| #268 | new `buildSeqImpl` test in `workflow-template.test.mjs` | one `escalated{escalate,blocked:'Y'}`, one `auditLog{no-test:add-test-blocked,blocked:'Y'}`, no `no-test:exhausted`, `landDecision==='held:escalation'` | label `add-test:t1:r1`, field `blocked_reason`; load-bearing on token + Site-3-deletion check |

## Coverage map

| Issue | Decision | Phase / Task | Test |
|---|---|---|---|
| #237 | D1 (exit-1-vs-2 prompt fix, ×2) | Phase 1 | grep-guard (red-first) |
| #236 | D2 (land-side comment; keep array) | Phase 2 | drift-guard + M2 (existing) |
| #235 | D3 (guard-comment reword) | Phase 3 | sub-loop tests (existing) |
| #269 | D4 (gate_output completeness clause, ×3) | Phase 4 | grep post-condition |
| #268 | D5 (Site-3 blocked-add-test test) | Phase 5 | new buildSeqImpl test (load-bearing) |

## Deliberate simplifications (ponytail)

- **#237 is prompt-only, not control-flow.** The branch predicate `mr.status === 'no-test'` is already correct; once
  exit-2 returns `error`, the branch is simply not entered. The smallest root-cause-honest diff is the prompt, not the
  code. Touching control flow would be speculative scope.
- **#236 is a comment, not a type split.** Unifying `MERGE_RESULT.status` vs land-result statuses into separate enums is
  deferred — no live path triggers the `no-test`-on-land case, and the drift-guard already pins the shared array. A
  comment documents the boundary at zero blast radius.
- **#269 is a prose directive, not a schema field.** A runner-count schema field is speculative; the auditor reads
  `gate_output` as text, so a prose clause closes the gap with no control-flow change. No `war-worker.md` edit — the
  worker self-report routes through the same `gate_output` field.
- **#235/#269 carry no dedicated behavioral test** — they are comment/prompt edits guarded by existing tests (#235) or a
  grep post-condition (#269). YAGNI applies to tests too; a vacuous test here would assert nothing.
- **No new ADR, no schema change, no `land-decision.mjs`, no `assert-test-in-diff.sh` change.** Out of scope by design.

## Out of scope / Non-goals

- **The auditor cannot re-run the tests it verifies** (memory `auditor-cannot-execute-the-tests-it-must-verify-pass`).
  #269 only makes the *reported* excerpt complete; it does not give the read-only auditor execution capability. That
  seam is unchanged.
- **Unifying the merge-result vs land-result status enums** — #236 documents the boundary with a comment; a real type
  split is deferred (no live path triggers it).
- **Integration-base / version are stack-conditional** — v0.7.9 + the post-#251 pin assume Spec 1 (v0.7.8) lands first.
  The standalone fallback (re-baseline to next-free-patch, drop the pin) covers a lone run off v0.7.7.
