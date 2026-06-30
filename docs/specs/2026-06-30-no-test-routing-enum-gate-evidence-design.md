# No-test sub-loop: exit-2 mis-routing, enum hygiene, and gate-evidence reporting

**Status:** proposed — targets **v0.8.2** (doc/correctness sweep, landOrder 2). **Severity: MEDIUM.**
**Source:** issues #237, #236, #235, #269, #268 — memory slugs `floor-script-exit-codes-1-vs-2-route-differently`, `shared-status-enum-widening-silently-widens-land-path`, `gate-output-curated-excerpt-obscures-mapped-test-evidence`, `inline-comment-names-wrong-purpose-for-load-bearing-code`, `retrofit-site-existing-tests-as-regression-guard`, `standing-instruction-vs-dispatched-prompt-coverage-split`.

These five issues all live in the **same no-test sub-loop region** of [`workflow-template.js`](../../skills/war/assets/workflow-template.js) (the merge-task dispatch prompts + escalation push, plus the `HARD_ESCALATION_REASONS` reuse) and the gate-evidence reporting boundary. Co-grouping turns five would-be cross-spec rebase conflicts into one cohesive spec with ordered, dependent tasks. Only #237 is a real (latent) routing defect; the other four are nits — exact rewords / one additive test, called out plainly below.

**Integration-base pin:** war this on the **landed tip of Spec 1** (the land-phase prompt at [`workflow-template.js` land-phase prompt](../../skills/war/assets/workflow-template.js)). #236's edit is adjacent to Spec 1's landed land-phase prompt string; baselining off main avoids a spurious adjacent-line conflict. (Master now sits at v0.8.0 — two submodule increments landed; the land-phase prompt region this is adjacent to has churned, so the construct-name anchor below — the `HARD_ESCALATION_REASONS.includes(landResult.status)` check — is authoritative, not a line number.)

## Problem

The no-test sub-loop runs inside the serial refine queue:

- The merge-task dispatch prompt — [`workflow-template.js` merge-task prompt (requiresTest branch)](../../skills/war/assets/workflow-template.js) — tells the refiner: *"If the script exits non-zero, return `{ mode: 'merge-task', status: 'no-test' }`."* The no-test retry prompt ([no-test retry dispatch](../../skills/war/assets/workflow-template.js)) says the same. But the canonical exit-code contract — [`war-refiner.md` step 4 (exit 0/1/2 split)](../../agents/war-refiner.md), [`schemas.md` `no-test` bullet](../../skills/war/references/schemas.md), and [`assert-test-in-diff.sh` exit-code legend](../../skills/war/assets/assert-test-in-diff.sh) — splits **exit 1** (no test in diff → `no-test`) from **exit 2** (`die "git diff failed" 2`, a git/ref error → `error`/`gate_failed`, *never* `no-test`). The script genuinely emits all three codes (`exit 0` match, `exit 1` no-match, `die … 2`). A refiner acting on the **dispatched prompt** rather than the standing `.md` collapses a transient exit-2 bad-ref into `status:'no-test'`, kicking a pointless add-test fix-worker + full re-audit sub-loop against code whose only problem was a flaky ref. **(#237 — the substantive one.)**

- `HARD_ESCALATION_REASONS` ([the inline array](../../skills/war/assets/workflow-template.js) — at HEAD `['escalate', 'audit-blocked', 'conflict', 'land_stale', 'dep-failed', 'gate-evidence', 'unrunnable-deps', 'no-test']`) includes `'no-test'`, which is **load-bearing**: the merge-task escalation push (`escalated.push({ task, reason: 'no-test' })`) and `hardEscalation = escalated.some(e => …includes(e.reason))` both depend on it. But the same array is reused on the **land side** — [the `HARD_ESCALATION_REASONS.includes(landResult.status)` check](../../skills/war/assets/workflow-template.js) — where `'no-test'` is not a valid land-phase status. The land-phase prompt only ever returns `landed`/`land_stale`/`gate_failed`/`error`/`submodule-pr` (the v0.8.0 submodule increment added `submodule-pr`, but it is intercepted by a direct-return guard — `landDecision: held:submodule-pr`, DP2 — *above* this `.includes` check, so it never reaches the reuse), so the membership of `'no-test'` is inert today, but logically a never-emitted `no-test` land result would spuriously hard-escalate. **(#236 — nit, latent-correctness.)**

- The comment on the reAuditFailed `continue` — [*"Vacuous re-audit path: escalation already pushed above (lines 358-359), noTestMr===null"*](../../skills/war/assets/workflow-template.js) — frames the line as belt-and-suspenders. It is actually the **sole null-deref guard**: both sites that set `reAuditFailed = true` also set `noTestMr = null`, and the unconditional `noTestMr.status` deref below would crash without it. The cited line numbers (358-359) are also stale. **(#235 — nit, comment-accuracy.)**

- The `gate_output` population directive — [merge-task prompt gate_output sentence](../../skills/war/assets/workflow-template.js) (mirrored at the no-test retry prompt) and the `war-refiner.md` merge-task **`Populate gate_output`** step (the final numbered point in the `## merge-task` list — renumbered from step 5 to point 6 after the v0.8.0 submodule-mutation check was inserted as a new step; anchor by the `Populate gate_output` construct, not the number) — asks for *"the executed gate output (stdout+stderr)"* but never forbids curating it. The tracked `*.test.sh` runners (13 at HEAD; the gate self-discovers — never a literal count) each emit a single aggregate PASS line, so a partial excerpt leaves the downstream execution-evidence auditor ([gate-audit prompt consuming `gateOutput`](../../skills/war/assets/workflow-template.js)) unable to confirm all runners ran by direct evidence — a partial paste reads as an under-run. **(#269 — nit, reporting-completeness.)**

- Site 3 of the `blockedReason` retrofit — [the blocked-add-test branch](../../skills/war/assets/workflow-template.js) — pushes `escalated{reason:'escalate', blocked}` + `auditLog{verdict:'no-test:add-test-blocked'}` with `reAuditFailed = true`. The unique token `no-test:add-test-blocked` has **zero occurrences** in [`workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs). The existing M2 tests ([`isAddTestWorker` helper](../../skills/war/assets/workflow-template.test.mjs)) drive an *implemented* add-test worker (M2 Test 1) or assert no add-test worker fires (Test 2b) — neither exercises the **blocked** add-test escalation outcome. **(#268 — nit, test-coverage.)**

## Decisions

| # | Issue | Decision | Rejected alternative |
|---|---|---|---|
| 1 | #237 | In **both** merge-task dispatch prompt strings, replace *"exits non-zero → `no-test`"* with the exit-1-vs-2 split that mirrors `war-refiner.md` step 4: **exit 1 → `no-test`** (do NOT merge); **exit 2 → `error`** (git/ref error — never `no-test`). Prose-only; the sub-loop already keys on `mr.status === 'no-test'`, so an exit-2 `error` simply stops entering the branch. | Touching production control flow — unnecessary; the branch predicate is already correct, only the prompt was loose. Removing the standing `.md` redundancy — the `.md` is the authority; the fix is to make the dispatched prompt agree with it. |
| 2 | #236 | At the land-side `HARD_ESCALATION_REASONS.includes(landResult.status)` check, add an inline comment stating `'no-test'` is structurally unreachable here because no land-phase prompt emits it. **Do NOT remove `'no-test'` from `HARD_ESCALATION_REASONS`** — load-bearing for the merge-task escalation path. | Narrowing the `HARD_ESCALATION_REASONS.includes(landResult.status)` check to an explicit land-status subset — larger diff, re-introduces a second hand-maintained enum that can drift from the land-phase prompt. The comment is the minimal honest hardening. Removing `'no-test'` from the array — breaks the merge-task escalation it mirrors. |
| 3 | #235 | Reword the comment to name its real role (null-deref guard before the `noTestMr.status` deref) and drop the stale line numbers. Comment-only. | Restructuring to remove the deref — out of scope; the guard is correct, only its label is wrong. |
| 4 | #269 | Append one completeness clause to the `gate_output` population sentence at its canonical source (the `war-refiner.md` merge-task **`Populate gate_output`** point — anchor by construct, not number) and its two mirror sites in `workflow-template.js`: *do NOT curate/excerpt; include the complete `*.test.sh` runner list or **state the total runner count***. **Never a literal count** (the gate self-discovers — 13 runners at HEAD, a 14th would silently stale a hardcoded number; memory `task-prompt-suite-count-stale-after-stacking`). Prompt-only. | A schema field for runner-count — speculative; the auditor reads `gate_output` as text, a prose directive closes the gap with no control-flow change. Editing `war-worker.md` — the worker self-report routes through the same `gate_output` field; no separate worker summary exists, so no edit needed. |
| 5 | #268 | Add one `buildSeqImpl`-driven test that drives merge-task→`no-test`, then a **blocked** add-test worker (`{status:'blocked', blocked_reason}`), asserting the Site-3 outputs load-bearing on the unique token `no-test:add-test-blocked`. Purely additive test code. | Skipping the test because "existing tests are the regression guard" — confirmed false: the M2 tests exercise the *implemented* path only, never the blocked-escalation outcome (`retrofit-site-existing-tests-as-regression-guard` — the cover claim does not hold for Site 3). |

## Affected files

| File | Change |
|---|---|
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | #237: rewrite the exit-code clause in **both** merge-task dispatch prompts (requiresTest branch + no-test retry). #236: inline comment at the land-side `HARD_ESCALATION_REASONS.includes(landResult.status)` check. #235: reword the reAuditFailed `continue` comment. #269: append the completeness clause to **both** `gate_output` population sentences. |
| [`agents/war-refiner.md`](../../agents/war-refiner.md) | #269: append the same completeness clause to the merge-task **`Populate gate_output`** point's sentence (the final numbered point in the `## merge-task` list — renumbered to point 6 after the v0.8.0 submodule check insertion; anchor by construct). (Step 4's exit-1-vs-2 split is already correct — #237 brings the template *to* it, no `.md` change for #237.) |
| [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) | #268: add the Site-3 blocked-add-test-worker behavioral test. Optional for #237: grep-assert both merge-task dispatch prompts mention `exit 2`/`error` and do not collapse non-zero to `no-test`. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to `0.8.2` across the four canonical slots (release task). |

No schema, no `land-decision.mjs`, no `assert-test-in-diff.sh`, no control-flow changes.

## Task order (dependent stack)

1. **#237** — routing fix (both dispatch prompts). The substantive change; everything else is adjacent to it.
2. **#236** — enum-narrowing comment (land-side check). Adjacent to Spec 1's land-phase prompt — pin the integration base here.
3. **#235** — reAuditFailed comment reword.
4. **#269** — `gate_output` completeness clause (template ×2 + `war-refiner.md` merge-task `Populate gate_output` point).
5. **#268** — Site-3 blocked-add-test behavioral test.

One-task-per-file-region ordering avoids the up-front-provisioning same-file rebase conflict (`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`): all four prose tasks touch `workflow-template.js`, so they run serially, each rebased on the prior's landed tip.

## Alternatives considered

- **Status quo (reject):** #237 leaves a transient bad-ref spinning a pointless add-test loop + full re-audit; the prompt/`.md`/schema contract stays internally inconsistent. The four nits leave latent foot-guns (enum widening, mislabeled guard, curated-excerpt misread, untested branch) for the next maintainer.
- **Five separate specs (reject):** all five edit the same ~100-line region of `workflow-template.js`; separate branches would rebase-conflict on every land. One spec with a serial stack is strictly cheaper.
- **Production-logic fix for #237 (reject):** the branch already keys on `mr.status === 'no-test'`; correcting the *prompt* is the smallest root-cause-honest diff. No code path needs to change once exit-2 returns `error`.
- **Remove `'no-test'` from `HARD_ESCALATION_REASONS` for #236 (reject):** it is load-bearing on the merge-task escalation path and mirrors `land-decision.mjs`. The defect is the land-side *reuse*, addressed by a comment, not by gutting the shared array.

## Validation criteria

1. **#237** — both merge-task dispatch prompt strings in `workflow-template.js` mention **exit 2 → `error`** and **exit 1 → `no-test`**, and neither collapses "non-zero → `no-test`". (Optional guard test: a grep assertion in `workflow-template.test.mjs` over both merge prompts.) Manual trace: an exit-2 result no longer satisfies `mr.status === 'no-test'`, so the add-test sub-loop is not entered.
2. **#236** — the land-side `HARD_ESCALATION_REASONS.includes(landResult.status)` check carries an inline comment stating `'no-test'` is unreachable there (no land-phase prompt emits it); `'no-test'` remains in the array; the existing M2 budget-exhaustion test (`escalated {reason:'no-test'}` → `held:escalation`) still passes.
3. **#235** — the comment on `if (reAuditFailed) continue` names the null-deref guard role (skip before the `noTestMr.status` deref) and contains no stale `358-359` line reference; no logic change (all no-test sub-loop tests still pass).
4. **#269** — the `gate_output` population sentence in the `war-refiner.md` merge-task **`Populate gate_output`** point and both merge-task prompt strings instruct the agent not to curate/excerpt and to include the full `*.test.sh` runner list or state the total runner count (no literal count); a grep for the new clause finds it in all three sites.
5. **#268** — a new `buildSeqImpl`-driven test drives merge-task→`no-test` then a blocked add-test worker (`{status:'blocked', blocked_reason:'Y'}`) and asserts: exactly one `escalated` entry for `t1` with `{reason:'escalate', blocked:'Y'}`; exactly one `auditLog` entry with `verdict:'no-test:add-test-blocked'` and `blocked:'Y'`; no `no-test:exhausted` verdict; `t1` does not land and `landDecision === 'held:escalation'`. The token `no-test:add-test-blocked` (zero occurrences today) is load-bearing — deleting the blocked branch fails the test.
6. **Full gate green** — `node --test "skills/**/*.test.mjs"` plus all `*.test.sh` runners (13 at HEAD; self-discovered, never a literal count) pass after the stack lands.

## Coverage map

| Issue | Decision | Validation |
|---|---|---|
| #237 | D1 (exit-1-vs-2 prompt fix, ×2) | V1 |
| #236 | D2 (land-side comment; keep array) | V2 |
| #235 | D3 (guard comment reword) | V3 |
| #269 | D4 (gate_output completeness clause, ×3) | V4 |
| #268 | D5 (Site-3 blocked-add-test test) | V5 |

## Open risks / non-goals

- **Non-goal:** the broader gate-evidence legibility problem (read-only auditor cannot execute the tests it verifies — `auditor-cannot-execute-the-tests-it-must-verify-pass`). #269 only makes the *reported* excerpt complete; it does not let the auditor re-run anything. That seam is unchanged by design.
- **Non-goal:** unifying `MERGE_RESULT.status` vs land-result statuses into separate enums. #236 documents the boundary with a comment; a real type split is deferred (no live path triggers it).
- **Version serialization:** `0.8.2` replaces the four canonical slots (`plugin.json`, `marketplace.json` ×2, `README` `## Status`) in one release commit at the tip of this stack; this stack lands serially on Spec 1's landed tip (live is `0.8.0` after the two submodule increments; landOrder 2 in the v0.8.x remediation stack means Spec 1 lands `0.8.1` first, this spec lands `0.8.2`).
