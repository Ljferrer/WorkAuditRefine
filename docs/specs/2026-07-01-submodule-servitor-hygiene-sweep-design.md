# Submodule + servitor doc/comment + test-isolation hygiene sweep

**Status:** proposed — targets **v0.8.11** (hygiene sweep: lagging comments, misleading doc prose, wire-key/enum placeholder drift, test-isolation gaps, one dead-code removal). **Severity: LOW.**
**Source:** issues #333, #279, #282, #294, #296, #300, #303, #307. Memory: [[source-comment-lags-emitted-prompt-after-rewrite]], [[mirrored-prose-row-parenthetical-inversion]], [[prose-cross-ref-direction-contradicts-physical-layout]], [[wire-key-rename-misses-prose-placeholders]], [[phase-vs-task-status-enum-leakage]], [[in-memory-landed-shas-inert-for-cross-phase-bump]], [[submodule-phase-repo-derived-from-task-targetrepo]], [[weak-test-assertion-passes-without-feature-being-exercised]], [[submodule-fixture-protocol-file-allow-discipline]], [[yaml-extraction-indent-coupling-in-shell-gate]].
Group: standalone hygiene sweep, lands **last** (behavioral-before-cosmetic, landOrder 11). The residue of two subsystems that just landed — servitor-provenance (#333) and submodule-support increments 1 & 2 (all the rest). Co-grouped by the shared root-cause family "prose/comment/test lags the code that landed."

## Problem

Eight follow-up issues survive from the servitor-provenance and submodule-support landings. Cross-referencing the bodies, they are **not uniformly cosmetic** — they split five ways:

**A. Lagging comments / misleading doc prose (rewords):**
- **#333** — [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) `:71` comment still says "take the next `  provenance:` line" (2-space literal) after #247 widened the awk token to `/^[[:space:]]+provenance:/` (any indent). Prose lags code.
- **#296** — [`skills/war/SKILL.md`](../../skills/war/SKILL.md) §4.3 says the `held:submodule-pr` hold is "cleared by the Resume procedure (sub-procedure **below**)", but the Resume section physically **precedes** Checkpoint (it's above). Direction-word contradicts layout ([[prose-cross-ref-direction-contradicts-physical-layout]]). Fix: name the section (`the held:submodule-pr sub-procedure in §Resume`), drop the direction.
- **#282 items 2–3** — [`agents/war-auditor.md`](../../agents/war-auditor.md) header "Submodule pre-flight (before computing the diff)" contradicts its body (which inspects the *computed* diff) → "before lens review"; [`agents/war-refiner.md`](../../agents/war-refiner.md) orders the submodule check step 5 (after test-floor) while the engine emits it before `assert-test-in-diff` — behaviorally inert (both fail-closed pre-merge), an optional order-independent note.
- **#303** — [`agents/war-refiner.md`](../../agents/war-refiner.md) residual `<submodule_remote>`/`<submodule-remote>` placeholders at the `gh pr view`/`gh pr create` examples after the fix-round renamed the wire key to `pr_remote` ([[wire-key-rename-misses-prose-placeholders]]) → align to `<pr_remote>`; [`agents/war-worker.md`](../../agents/war-worker.md) gitlink-bump blocked-condition prose says "not yet merged/landed" but `landed` is a **phase**-level value, not in the task-level ledger enum (`todo|working|audited|merged|escalated|blocked`) → drop `/landed` ([[phase-vs-task-status-enum-leakage]]).
- **#294 items a, b, e** — [`skills/war/assets/assert-no-submodule-mutation.sh`](../../skills/war/assets/assert-no-submodule-mutation.sh) stale "macOS bash 3.2: use read with IFS" comment describes the pre-awk approach the refactor replaced (drop/reword); the awk gitlink-collect's `split>=2` guard is inert (git diff --raw always emits a tab) — add a one-line equivalence comment; [`skills/war/assets/provision.mjs`](../../skills/war/assets/provision.mjs) path-value regex is greedy-to-EOL (correct for `.gitmodules`) — optional one-line comment.

**B. Doc-correctness (misleading, not just stylistic):**
- **#282 item 1** — [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) `submodule-blocked` bullet's `(exit 1 from the script, not exit 2)` parallel-reads as *error = exit 1* (wrong — error is exit 2, `submodule-blocked` is exit 1). Mirror the no-test sibling exactly, or name `submodule-blocked`'s own code ([[mirrored-prose-row-parenthetical-inversion]]).
- **#307 item 1** — `schemas.md` tags `targetRepo?` at the **task** level while `SKILL.md` speaks of a submodule **phase** — a one-clause note that "a submodule phase = the set of tasks sharing a `targetRepo`; the per-task tag is canonical, the phase repo is derived" ([[submodule-phase-repo-derived-from-task-targetrepo]]).

**C. Test-isolation gaps (Minor — behavioral test additions):**
- **#279 items 1–2** — in [`skills/war/assets/assert-no-submodule-mutation.test.sh`](../../skills/war/assets/assert-no-submodule-mutation.test.sh): case 2 (content-under-`.gitmodules`) doesn't isolate step 3 (the fixture's `git rm sub` also deletes the gitlink, so step 2 fires first) — add a case touching a path under a **still-gitlinked** submodule without moving the gitlink; case 1 (gitlink bump) doesn't isolate step 2 from step 3 (the bumped path also matches the `.gitmodules` path) — pin the mode-160000 detector independently ([[weak-test-assertion-passes-without-feature-being-exercised]]).
- **#294 item d** — case 8's content touch carries an incidental gitlink deletion; add a pure-content-no-gitlink case to isolate.

**D. Dead-code removal (engine):**
- **#300** — the engine's in-memory `landedShas` map is populated in one phase's REFINE loop, but the `gitlink-bump` task lives in a **separate** phase → empty cross-phase → `depSha` falls back to a placeholder. The authoritative cross-phase SHA source is the **ledger** (`war-worker.md` T7 reads it — [[in-memory-landed-shas-inert-for-cross-phase-bump]]). **Decision: drop the inert threading** (not just soften the comment).

**E. Verify-and-close (no edit):**
- **#279 item 3** — step-3 reads working-tree `.gitmodules`, not the ref snapshot; benign for refuse-all, deferred to **Increment 2** (`git show <ref>:.gitmodules`). Out of scope here — record the deferral, don't implement.
- **#307 item 2** — `design.md` §6 forward-links T9's ledger fields; resolved at Phase-5 integration (T9 landed them). No action.
- **#300 nit** & **#294 item f** — a worker report said `new_tests:3` but added 4; a task-summary said "ONLY 2 files" — report/plan-doc artifacts, not live code. Verify moot; no code edit.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | Sweep width | **Full hygiene sweep** — prose/comment rewords + doc-correctness + test-isolation cases + the one dead-code removal, in one spec. Same-subsystem residue; the test-isolation items share the `assert-no-submodule-mutation` file with #294, so handling them together avoids a cross-spec same-file conflict. | Pure-prose only (splits the assert file across two future specs); minimal lagging-comments only (leaves doc-correctness + test-isolation open). |
| D2 | #300 in-memory `landedShas` | **Drop the inert threading** (engine code). Precede with a **verify-inert step**: grep every `landedShas` consumer, confirm the cross-phase path is empty and falls back to the ledger, and confirm no load-bearing intra-phase consumer breaks; removal is proven safe iff the full gate stays green. | Soften the line-102 comment only (leaves dead threading in the engine); drop without the verify-inert step (risks removing a live intra-phase use). |
| D3 | Decomposition | **By conflict-boundary** (~4 impl tasks + release): T1 `assert-no-submodule-mutation.{sh,test.sh}` (#279 1/2, #294 a-e); T2 `schemas.md` (#282-1, #307-1); T3 grouped prose across disjoint files (war-auditor/refiner/worker.md + SKILL.md + servitor-provenance.sh comment + provision.mjs comment — #282 2/3, #296, #303, #333, #294 e); T4 drop `landedShas` (#300). | By-issue (8 tasks — #279+#294 collide on the assert file, #282+#307 on schemas.md); by-file-family (~6 tasks, more serialization for low-priority nits). |
| D4 | The verify-and-close items | **Record and close, no edit** (#279-3 deferred to Increment 2; #307-2 resolved at integration; #300-nit & #294-f are report/plan artifacts). | Re-implement / re-touch already-correct or future-scoped work (churn — [[verify-task-no-op-is-correct-when-already-covered]]). |
| D5 | Test-isolation rigor | Each new case must **isolate the step it targets** — a mode-160000 (gitlink) change that does NOT also match a `.gitmodules` path, and a `.gitmodules`-path content touch that does NOT move a gitlink — so step 2 and step 3 of the guard are each independently exercised. Use the `file://` submodule fixture protocol discipline ([[submodule-fixture-protocol-file-allow-discipline]]). | Add cases that still conflate steps 2/3 (the exact weakness #279 flags). |

## Surface changes (by task)

| Task | Files | Issues | Kind |
|------|-------|--------|------|
| T1 | [`assert-no-submodule-mutation.sh`](../../skills/war/assets/assert-no-submodule-mutation.sh) + [`.test.sh`](../../skills/war/assets/assert-no-submodule-mutation.test.sh) | #279 (1,2), #294 (a,b,c,d) | comment hygiene (drop stale IFS comment; equivalence comment; drop unused `BASE7_PRESUB`) + 3 test-isolation cases |
| T2 | [`schemas.md`](../../skills/war/references/schemas.md) | #282 (1), #307 (1) | doc-correctness: fix the `exit 1 vs 2` parenthetical; add the phase=tasks-sharing-targetRepo note |
| T3 | [`war-auditor.md`](../../agents/war-auditor.md), [`war-refiner.md`](../../agents/war-refiner.md), [`war-worker.md`](../../agents/war-worker.md), [`SKILL.md`](../../skills/war/SKILL.md), [`validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) (comment), [`provision.mjs`](../../skills/war/assets/provision.mjs) (comment) | #282 (2,3), #296, #303 (1,2), #333, #294 (e) | prose/comment across disjoint files, one commit |
| T4 | [`workflow-template.js`](../../skills/war/assets/workflow-template.js) | #300 | drop inert `landedShas` threading after verify-inert |
| release | `plugin.json`, `marketplace.json` (×2), `README.md` `## Status` | — | v0.8.11 four-slot bump |

**Cross-spec same-file notes (serial-land, disjoint regions):** T3 edits `war-auditor.md` (a header) — **spec 10** edits the same file's *pin-validity lens* (disjoint region); this sweep lands after spec 10. T2 edits `schemas.md` — **spec 7 (`--ace`)** adds `autoFixable?` to the finding shape there (disjoint region); this sweep lands after spec 7. Serial version-ordering resolves both.

## Alternatives considered

- **Scatter the nits back to per-issue specs.** Rejected — D1/D3; #279+#294 and #282+#307 share files, so scattering creates same-file rebase conflicts. One sweep, conflict-boundary tasks.
- **Soften #300's comment instead of dropping the threading.** Rejected per operator decision — the dead threading is removed (deletion over addition), gated by the verify-inert step so it stays a safe, gate-green change.
- **Implement #279-3 (ref-snapshot `.gitmodules` read) here.** Rejected — it's an Increment-2 scope item (path-discrimination matters only once submodules are first-class in the guard's cross-check); record the deferral.
- **Re-touch #307-2 / the report-artifact nits.** Rejected — already resolved or non-code; verify-and-close.

## Validation criteria

1. **(#333/#296/#282-2,3/#303/#294-a,b,e — prose)** Each reworded surface reads correctly and its stale form is gone: `grep` confirms `validate-servitor-provenance.sh` no longer says `  provenance:` (2-space literal) in the `:71` comment; `SKILL.md` §4.3 names `§Resume` with no "below"; `war-auditor.md` header says "before lens review"; `war-refiner.md`/`war-worker.md` carry `<pr_remote>` (no `<submodule_remote>`) and no task-level `/landed`; `assert-no-submodule-mutation.sh` has no stale IFS comment. No behavioral change — the full suite is unchanged-green.
2. **(#282-1/#307-1 — doc-correctness)** `schemas.md`'s `submodule-blocked` bullet no longer parallel-reads error=exit 1 (it names `submodule-blocked = exit 1` unambiguously or mirrors the no-test sibling exactly); the `targetRepo?` note states phase = tasks sharing a `targetRepo`.
3. **(#279-1,2/#294-d — test-isolation)** `bash skills/war/assets/assert-no-submodule-mutation.test.sh` passes with three new/adjusted cases that **independently** exercise step 2 (a mode-160000 gitlink change not matching any `.gitmodules` path) and step 3 (a `.gitmodules`-path content touch with no gitlink move). Reverting the guard's step-2 (or step-3) arm makes the corresponding isolated case fail RED — proving each step is independently covered (not conflated as #279 flags).
4. **(#300 — dead-code removal, verify-inert)** After dropping the `landedShas` threading, `grep -n landedShas skills/war/assets/workflow-template.js` shows no remaining producer/consumer of the removed path (or only the intra-phase use that is retained, if any is proven load-bearing); the full `node --test` + `*.test.sh` gate is **green** (removal is behavior-neutral — the cross-phase path already fell back to the ledger). The `war-worker.md` T7 ledger-read remains the authoritative cross-phase SHA source, untouched.
5. **(verify-and-close)** #279-3 recorded as Increment-2-deferred (no edit); #307-2 confirmed resolved-at-integration (no edit); #300-nit & #294-f confirmed non-code report/plan artifacts (no edit). Each closed with a note.
6. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner self-discovered by `find` (run **all** post-merge, incl. `assert-no-submodule-mutation.test.sh` and `validate-servitor-provenance.test.sh` — [[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Version serialization

v0.8.11 replaces the four canonical slots in one bump (no badge): `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status` (replace-in-place). Lands serially at landOrder 11 on the landed tip of the pending stack (…v0.8.10 → **v0.8.11**), **last** (behavioral-before-cosmetic). Version literal not authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). Confirm all four slots by hand ([[version-slots-no-cross-slot-consistency-test]]).

## Open risks / non-goals

- **Non-goal: Increment-2 submodule work** (#279-3 ref-snapshot read). Deferred; recorded only.
- **Risk (low): #300 is engine code in a hygiene sweep.** Mitigated by D2's verify-inert step + the gate-green requirement (removal proven behavior-neutral). If any intra-phase consumer is load-bearing, retain it and only drop the cross-phase threading + soften the comment — but the issue's analysis (cross-phase empty, ledger authoritative) indicates the threading is inert.
- **Risk: cross-spec same-file contention** on `war-auditor.md` (vs spec 10) and `schemas.md` (vs spec 7). Disjoint regions; serial landing (this sweep is last) resolves it. Re-anchor by construct at implementation time ([[plan-line-number-refs-stale-use-construct-locator]]).
- **Non-goal: widening the servitor-provenance or submodule-mutation guards.** #333 is a comment-only fix; the awk token stays `/^[[:space:]]+provenance:/`.

## Coverage

| Issue | Item(s) | Decision | Task | Kind |
|-------|---------|----------|------|------|
| #333 | comment reword | D1 | T3 | prose |
| #279 | 1, 2 (test-isolation); 3 (defer) | D1, D5; D4 | T1; — | test / verify-and-close |
| #282 | 1 (doc-correctness); 2, 3 (prose) | D1 | T2; T3 | doc / prose |
| #294 | a, b, c, e (comment/hygiene); d (test); f (moot) | D1; D4 | T1, T3; — | comment/test / verify-and-close |
| #296 | direction fix | D1 | T3 | prose |
| #300 | drop threading; nit (moot) | D2; D4 | T4; — | dead-code / verify-and-close |
| #303 | 1 (placeholder), 2 (enum) | D1 | T3 | prose |
| #307 | 1 (targetRepo note); 2 (resolved) | D1; D4 | T2; — | doc / verify-and-close |
