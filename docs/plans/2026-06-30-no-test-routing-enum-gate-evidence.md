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

- **Target version:** **v0.8.2** (doc/correctness sweep, **landOrder 2**, severity **MED**). Master sits at **v0.8.0**
  after two submodule increments (v0.7.8 guard + v0.8.0 first-class support); the v0.8.x remediation stack reversions
  serially — Spec 1 = v0.8.1, this spec = **v0.8.2**.
- **Integration base:** the **landed tip of Spec 1** ([land-advance origin propagation, v0.8.1](../specs/2026-06-30-land-advance-origin-propagation-design.md), #251).
  #236's land-side check (the `HARD_ESCALATION_REASONS.includes(landResult.status)` guard — **anchor by construct, not
  line; the submodule increments churned this region, the guard now sits near the END of the land block, just after the
  new `submodule-pr` direct-return**) is **adjacent to** Spec 1's land-phase prompt (the step-3 land-advance call inside
  the land-phase agent prompt). Author #236 against the **post-Spec-1 tip** so the comment lands clean rather than
  rebase-conflicting on Spec 1's land-phase edit. Pin the integration base to Spec 1's landed merge-tip; verify with
  `git ls-remote` before dispatch.
- **Four-slot serial release:** the version slots — `.claude-plugin/plugin.json` `version`,
  `.claude-plugin/marketplace.json` (`metadata.version` **and** `plugins[0].version`), `README.md` `## Status`
  (REPLACE-in-place, "Builds on v0.8.1") — are **replace-in-place** and land in **one release commit** at the tip of
  this stack. No badge. There is no cross-slot consistency test — verify all four by hand at the release commit
  (memory `version-slots-no-cross-slot-consistency-test`).
- **Standalone fallback:** if this is run off current `master` (v0.8.0) instead of the stack, **re-baseline the release
  to the next free patch by construct** (v0.8.1 if Spec 1 has not landed) and **drop the prior-tip pin** — #236's
  adjacency to Spec 1's land-phase prompt is the only reason the pin exists, and without #251 in the base there is no
  conflict to avoid. The version literals below say v0.8.2 because that is the roadmap target; the next-free-patch rule
  wins if the stack order shifts (memory `stacked-per-branch-releases-make-main-lag-cumulative`).

## Build order (for `/war`)

All four prose tasks touch `workflow-template.js` in the same merge/no-test/land region (the REFINE merge queue through
the land block — roughly `:344`–`:600` at HEAD after the submodule increments churned it; anchor by construct), so they
run **strictly serial**, each
rebased on the prior's landed tip — **one task per phase** (memory
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`). Parallelizing any of them WILL rebase-conflict.

1. **Phase 1 — #237** routing fix (both merge-task dispatch prompts). The substantive change; everything else is adjacent.
2. **Phase 2 — #236** land-side enum-reuse comment (pin the integration base here; adjacent to Spec 1's land-phase prompt).
3. **Phase 3 — #235** reAuditFailed guard-comment reword.
4. **Phase 4 — #269** `gate_output` completeness clause (template ×2 + `war-refiner.md` merge-task `Populate gate_output` point).
5. **Phase 5 — #268** Site-3 blocked-add-test behavioral test (additive test code; disjoint test file but still serial on the tip).
6. **Phase 6 — Release** v0.8.2.

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
  `noTestMr.status` deref) and **drop the stale parenthetical line numbers** (the live comment still cites `lines 358-359`,
  which is stale — those lines are unrelated; the real `reAuditFailed=true`+`noTestMr=null` pairs at HEAD are the
  **blocked-add-test branch** and the **re-audit-failed branch**, both inside the no-test sub-loop). Any new literal
  re-stales, so drop it entirely. Comment-only.
- **D4 (#269):** append one completeness clause to the `gate_output` population sentence at all three sites (template ×2
  + the `war-refiner.md` merge-task **`Populate gate_output`** point — renumbered from step 5 to point 6 after the
  v0.8.0 submodule-mutation check was inserted; anchor by the `Populate gate_output` construct, not the number):
  *do NOT curate/excerpt; include the complete `*.test.sh` runner list or state the total runner count*. **State "total
  runner count", never a hardcoded number** — the gate self-discovers (13 runners at HEAD), and a 14th would silently
  stale any literal (memory `task-prompt-suite-count-stale-after-stacking`). Prompt-only.
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
  merge.` (HEAD ~:374, inside the `requiresTest ? … : …` ternary — note the NEW `assert-no-submodule-mutation.sh`
  exit-1/exit-2 clause now sits **immediately above** this on the unconditional path at ~:372; do not edit that
  submodule clause).
- Prompt B: the **no-test-retry** merge prompt — `… now contains at least one test file. If the script exits non-zero,
  return { mode: 'merge-task', status: 'no-test' }.` (HEAD ~:439).
- Authority to mirror: `agents/war-refiner.md` step 4 (exit 0 continue / exit 1 → `no-test` / exit 2 → `error`,
  never `no-test`) — already correct at HEAD (the **Test-floor check** numbered step in the `## merge-task` list,
  lines ~39-42; the parallel submodule step 5 mirrors the same exit-1-vs-2 discipline).

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

**Anchor:** the `if (landResult && HARD_ESCALATION_REASONS.includes(landResult.status)) {` guard (HEAD ~:597), inside
the land-result dispatch block, just after Spec 1's land-phase prompt body. Locate by the
`HARD_ESCALATION_REASONS.includes(landResult.status)` construct, never a line number. **NOTE (v0.8.0 churn):** the
v0.8.0 submodule increment inserted a `submodule-pr` direct-return guard (`if (landResult && landResult.status ===
'submodule-pr') { … landDecision = 'held:submodule-pr' } else` — HEAD ~:592) **immediately above** this `.includes`
check, chained via `else if`. So at HEAD the land-side `.includes(landResult.status)` only ever sees a status that is
NOT `submodule-pr`. Place the #236 comment on the `.includes` guard itself; do not touch the `submodule-pr` guard.

- [ ] **Step 1 — (no behavioral test — comment-only.)** Confirm: do NOT touch `HARD_ESCALATION_REASONS` (the inline
  array, HEAD ~:556 — at HEAD `['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence',
  'unrunnable-deps', 'no-test']`) — the drift-guard `war-config.test.mjs:356` asserts the inline array deepEquals the
  canonical export incl. `'no-test'`, so any narrowing goes RED. The comment is the only gate-green hardening (memory
  `shared-status-enum-widening-silently-widens-land-path`). **This deliberately takes the _comment_ arm of #236's own
  "scope the land-side check to `mode==='merge-task'` **or** comment its unreachability" disjunction** — a literal
  `&& landResult.mode==='merge-task'` predicate at the `.includes` guard (~:597) would never fire (this guard only ever
  sees a land-phase result) and would silently disable `land_stale`/`conflict` hard-escalation on the land path: a
  regression, not a hardening. (The roadmap's shorthand "narrow … to mode" is satisfied by the comment arm here.)
  **v0.8.0 re-verification:** the narrowing-to-merge-task is STILL the wrong arm and the comment arm is STILL correct —
  the new `submodule-pr` land status does NOT change this. `submodule-pr` is intercepted by its own direct-return guard
  *above* the `.includes` check (DP2 — deliberately NOT in `HARD_ESCALATION_REASONS`), so it never reaches this reuse;
  the `.includes` guard still legitimately fires only on genuine land-side hard statuses (`land_stale` et al.). Adding
  `submodule-blocked` to the merge-result enum likewise does not touch this land-side reuse (`submodule-blocked` is
  merge-task-only and routes via the existing `'escalate'` member). So #236's comment claim — `'no-test'` unreachable
  here — remains true and load-bearing at HEAD.
- [ ] **Step 2 — Add the inline comment.** At the land-side guard, add a comment stating: `'no-test'` is **structurally
  unreachable here** — no land-phase prompt emits it (land statuses are only `landed`/`land_stale`/`gate_failed`/
  `error`/`submodule-pr`, and `submodule-pr` is short-circuited by its own direct-return guard above this check); the
  array is **reused** from the merge-task escalation path where `'no-test'` IS load-bearing, so it is **kept intact**,
  not narrowed. No array edit, no logic change.
- [ ] **Step 3 — Run the full gate → green** (existing M2 budget-exhaustion test still asserts `held:escalation`;
  drift-guard still green).
- [ ] **Step 4 — Commit** — `docs(war): comment that 'no-test' is unreachable on the land-side HARD_ESCALATION_REASONS reuse, keep array intact (#236)`
- **Closes #236.**

---

## Phase 3 — #235 reAuditFailed guard-comment reword

### Task — Reword the reAuditFailed `continue` comment to name its null-deref-guard role

**Files:** `skills/war/assets/workflow-template.js` (one comment). **`requiresTest`: false** — comment-only;
the existing no-test sub-loop tests are the regression guard (any logic change would break them).

**Anchor:** the comment on `if (reAuditFailed) continue` (HEAD ~:451; the live comment is at ~:450:
`// Vacuous re-audit path: escalation already pushed above (lines 358-359), noTestMr===null`). Locate by the
`if (reAuditFailed) continue` construct.

- [ ] **Step 1 — (no behavioral test — comment-only.)** Confirm the real role: both sites that set
  `reAuditFailed = true` (the blocked-add-test branch ~:404-407 and the re-audit-failed branch ~:421-424) **also set
  `noTestMr = null`**; the unconditional `noTestMr.status` deref below (~:454, `if (noTestMr.status === 'merged')`)
  would crash without the `continue`. The cited `(lines 358-359)` in the live comment is **stale** (those lines are
  unrelated). It is the **sole null-deref guard**, not belt-and-suspenders.
- [ ] **Step 2 — Reword the comment.** Name the real role and **drop the parenthetical line numbers entirely** (any new
  literal re-stales), e.g.: *"Null-deref guard: both reAuditFailed=true sites set noTestMr=null; skip before the
  unconditional noTestMr.status deref below."* No logic change.
- [ ] **Step 3 — Run the full gate → green** (all no-test sub-loop tests still pass).
- [ ] **Step 4 — Commit** — `docs(war): reword reAuditFailed continue comment to name its null-deref-guard role, drop stale line refs (#235)`
- **Closes #235.**

---

## Phase 4 — #269 gate_output completeness clause (template ×2 + war-refiner.md Populate gate_output point)

### Task — Forbid curating gate_output excerpts; require full runner list or total count

**Files:** `skills/war/assets/workflow-template.js` (two `gate_output` sentences), `agents/war-refiner.md` (the
merge-task `Populate gate_output` point). **`requiresTest`: false** — prompt-only; V4 is a grep over all three sites.

**Anchors (by construct):**
- Template sentence A: `On success, populate gate_output in the returned MergeResult with the executed gate output
  (stdout+stderr) so the post-merge gate-audit pass can review it as execution evidence.` (HEAD ~:370).
- Template sentence B: the identical sentence in the no-test-retry prompt (HEAD ~:437).
- `war-refiner.md` merge-task `Populate gate_output` point: `**Populate \`gate_output\`** with the full stdout+stderr of
  the gate run from step 2 …` (HEAD ~line 53 — the final numbered point in the `## merge-task` list; renumbered from
  step 5 to point 6 after the v0.8.0 submodule-mutation check was inserted as a new step 5; anchor by the
  `Populate gate_output` construct, never the number).

- [ ] **Step 1 — (no behavioral test — prompt-only.)** Pick one exact grep-assertable token for the new clause (e.g.
  `do NOT curate`) so V4 can confirm it in all three sites.
- [ ] **Step 2 — Append the completeness clause to all three sentences.** Append, e.g.: *"Do NOT curate or excerpt —
  each `*.test.sh` runner emits a single aggregate PASS line, so a partial paste reads as an under-run; include the
  complete `*.test.sh` runner list or state the total runner count."* **Use "total runner count", never a literal
  number** (the gate self-discovers — 13 runners at HEAD; memory `task-prompt-suite-count-stale-after-stacking`). Same
  clause, adapted to each surface's prose form.
- [ ] **Step 3 — Run the full gate → green; manual:** `grep -rn 'do NOT curate' skills/war/assets/workflow-template.js agents/war-refiner.md`
  finds the clause at all three sites.
- [ ] **Step 4 — Commit** — `docs(war): forbid curating gate_output excerpts; require full runner list or total count (#269)`
- **Closes #269.**

---

## Phase 5 — #268 Site-3 blocked-add-test behavioral test

### Task — Cover the blocked add-test-worker escalation outcome (Site 3, `no-test:add-test-blocked`)

**Files:** `skills/war/assets/workflow-template.test.mjs` (one additive test). **`requiresTest`: true** — this IS the test.
No production change.

**Site-3 anchor (the branch under test — the `if (addFixWhy) { … }` body inside the no-test sub-loop, HEAD ~:401-409):**
```
const addFixWhy = blockedReason(addFix)
if (addFixWhy) {
  escalated.push({ task: r.task.id, reason: 'escalate', blocked: addFixWhy })
  auditLog.push({ task: r.task.id, verdict: 'no-test:add-test-blocked', findings: [], blocked: addFixWhy, fixRounds: r.task.fixRounds })
  noTestMr = null; reAuditFailed = true; break
}
```

**Harness pins (verified at HEAD):**
- Use `buildSeqImpl(seqMap, fallback)` (HEAD ~:525 — **unchanged** by the submodule increments; the test harness is
  stable), keyed on `opts.label`. The add-test worker label is
  `add-test:${r.task.id}:r${r.task.fixRounds + 1}` → for `t1` on the first round this is **`add-test:t1:r1`** (the
  add-test dispatch is at HEAD ~:400). The seqMap key MUST be exactly `add-test:t1:r1` or the stub never fires.
- The blocked worker result MUST use field name **`blocked_reason`** (matches existing fixtures ~:673/:1425 and the
  `blockedReason` predicate at production ~:159): `{ task_id: 't1', status: 'blocked', blocked_reason: 'Y' }`. A wrong
  key (e.g. `blocked`) makes `blockedReason` falsy, the Site-3 branch never fires, and the test passes by exercising the
  wrong path (memory `weak-test-assertion-passes-without-feature-being-exercised`).
- Model the fallback closure on `L3 T2 Test 1` (HEAD ~:2032 — still present; the new submodule-routing tests were added
  **after** it at ~:2140+, so the Site-3 region of the sub-loop and this exemplar both still exist): the merge-task
  refiner returns
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

## Phase 6 — Release v0.8.2

### Task — Version bump v0.8.2 + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json` (`version`, HEAD :4); `.claude-plugin/marketplace.json` (`metadata.version`
:7 **and** `plugins[0].version` :14); `README.md` `## Status` (HEAD ~:236, REPLACE-in-place, "Builds on v0.8.1").
**No badge.**

- [ ] **Step 1 — Bump all four slots `0.8.1` → `0.8.2`** (or next-free-patch by construct per the standalone fallback —
  v0.8.1 if Spec 1 has not landed; the four canonical slots all read `0.8.0` at HEAD). Update the README `## Status`
  "Builds on vX" clause to the new prior version (currently "Builds on v0.7.8" at HEAD; it becomes "Builds on v0.8.1"
  once Spec 1 lands). Verify all four slots + the Builds-on line **by hand** — no cross-slot consistency test (memory
  `version-slots-no-cross-slot-consistency-test`, `release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`). Status copy: no-test sub-loop hygiene — exit-1-vs-2 routing fix +
  land-side enum comment + reAuditFailed guard-comment + gate_output completeness clause + Site-3 blocked-add-test
  coverage.
- [ ] **Step 2 — Run the full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.2 — no-test exit-routing fix + enum/comment/gate-evidence hygiene (#237 #236 #235 #269 #268)`

---

## Gate

The self-discovering multi-runner (quote the `.mjs` glob — bash 3.2 under-covers it unquoted):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**6 `.test.mjs`** (`skills/_shared/provision.test.mjs`, `skills/red-team/assets/red-team-gate.test.mjs`,
`skills/red-team/assets/workflow-scaffold.test.mjs`, `skills/war/assets/land-decision.test.mjs`,
`skills/war/assets/war-config.test.mjs`, `skills/war/assets/workflow-template.test.mjs`) **+ 13 `*.test.sh` runners**
(6 `hooks/` + 7 `skills/` — the v0.8.0 submodule increment added `skills/war/assets/assert-no-submodule-mutation.test.sh`)
at HEAD. The gate self-discovers — never assert a literal runner count. If the cross-branch merge from Spec 1 adds a
runner, the `find` loop picks it up automatically; run the WHOLE gate post-merge (memory
`gate-under-covers-after-cross-branch-merge-new-runner`).

## Test plan

| Task | Test | Key assertion | Notes |
|---|---|---|---|
| #237 | new grep-guard in `workflow-template.test.mjs` | both merge prompts: `exit 2`+`error` AND `exit 1`+`no-test` present; **no** `exits non-zero` collapse | load-bearing negative assertion — matching bare `no-test` passes against old+new |
| #236 | (no test — comment) | full gate green; drift-guard `war-config.test.mjs:356` + M2 budget test still green | array intact; comment-only |
| #235 | (no test — comment) | full gate green; all no-test sub-loop tests still pass | drop stale line refs |
| #269 | (no test — prompt) | `grep 'do NOT curate'` finds the clause at all 3 sites | "total runner count", no literal count (13 runners at HEAD) |
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
- **Integration-base / version are stack-conditional** — v0.8.2 + the post-Spec-1 pin assume Spec 1 (v0.8.1) lands first.
  The standalone fallback (re-baseline to next-free-patch, drop the pin) covers a lone run off v0.8.0 (current master).
