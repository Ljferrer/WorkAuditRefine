# Submodule + servitor doc/comment + test-isolation hygiene sweep Implementation Plan (issues #333 #279 #282 #294 #296 #300 #303 #307)

**Goal:** clear the residue of the servitor-provenance + submodule-support landings in one cohesive pass — lagging comments, misleading doc prose, wire-key/enum placeholder drift, test-isolation gaps, and one inert dead-code path. Decomposed **by conflict-boundary** (not by issue) because #279+#294 share the `assert-no-submodule-mutation` file and #282+#307 share `schemas.md`. Not purely cosmetic: T1 adds behavioral test-isolation cases and T4 removes engine dead code.

**Source spec:** [`docs/specs/2026-07-01-submodule-servitor-hygiene-sweep-design.md`](../specs/2026-07-01-submodule-servitor-hygiene-sweep-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source** (this slug = landOrder 11 = **v0.8.11**, lands last).
Memory hooks: [[source-comment-lags-emitted-prompt-after-rewrite]], [[mirrored-prose-row-parenthetical-inversion]], [[prose-cross-ref-direction-contradicts-physical-layout]], [[wire-key-rename-misses-prose-placeholders]], [[phase-vs-task-status-enum-leakage]], [[in-memory-landed-shas-inert-for-cross-phase-bump]], [[submodule-phase-repo-derived-from-task-targetrepo]], [[weak-test-assertion-passes-without-feature-being-exercised]], [[submodule-fixture-protocol-file-allow-discipline]], [[gate-under-covers-after-cross-branch-merge-new-runner]], [[version-slots-no-cross-slot-consistency-test]] (#release).

**Ratify with `/red-team` before `/war`** — T4 drops engine code (`landedShas` threading). Run `/red-team` on this plan first; expect the verify-inert analysis to confirm the removed path was cross-phase-empty.

## Coordination

- **Target version:** **v0.8.11** (roadmap landOrder 11, severity LOW). Bumps `0.8.10 → 0.8.11`. **Lands last** (behavioral-before-cosmetic).
- **Integration base:** the **landed tip of Spec 10 (v0.8.10)**. **Standalone fallback:** off a different tip, re-baseline the release to the next free patch off the live tip and drop the pin — version literal not authoritative ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]).
- **Cross-spec same-file (serial-land resolves; re-anchor by construct):** T3 edits `war-auditor.md` (a header — disjoint from **spec 10**'s pin-validity lens); T2 edits `schemas.md` (disjoint from **spec 7 `--ace`**'s `autoFixable?` addition); T4 edits `workflow-template.js` (drops `landedShas` — disjoint from specs 1/2/4/6/7/8 regions). This sweep lands after all of them, so contention is version-serialized, not concurrent.
- **Four-slot serial land (replace-in-place, no badge):** `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status`. All four read `0.8.11` after release; verify by hand.
- **Commit boundaries:** five tasks, one commit each — T1 assert-file, T2 schemas.md, T3 grouped prose, T4 drop `landedShas`, T5 release. Same-file tasks land serially.

## Operator decisions — RESOLVED (bake in exactly)

- **Full hygiene sweep** — prose + doc-correctness + test-isolation + the dead-code drop; verify-and-close the resolved/deferred items.
- **#300 = DROP the inert `landedShas` threading** (engine code), gated by a **verify-inert step** (grep all consumers, confirm cross-phase-empty + ledger fallback, gate stays green). NOT a comment-softening.
- **Decompose by conflict-boundary** (T1–T4 as below), never by-issue (shared files would collide).
- **Test-isolation rigor:** each new case isolates its step — a mode-160000 gitlink change NOT matching a `.gitmodules` path (step 2), and a `.gitmodules`-path content touch with NO gitlink move (step 3). `file://` fixture protocol discipline ([[submodule-fixture-protocol-file-allow-discipline]]).
- **Verify-and-close (no edit), folded into the parent task's closure:** #279-3 (Increment-2 deferral), #307-2 (resolved at integration), #300-nit + #294-f (report/plan artifacts).

---

## Phase 1 — `assert-no-submodule-mutation` comment hygiene + test-isolation

### Task 1 — Comment hygiene + step-isolating cases (#279 1/2, #294 a/b/c/d)

**Files:** [`skills/war/assets/assert-no-submodule-mutation.sh`](../../skills/war/assets/assert-no-submodule-mutation.sh), [`skills/war/assets/assert-no-submodule-mutation.test.sh`](../../skills/war/assets/assert-no-submodule-mutation.test.sh). Anchor by construct (the awk gitlink-collect block; the case blocks by their echoed labels).

**`requiresTest`: true** — adds test-isolation cases (behavioral coverage).

- [ ] **Step 1 — Baseline.** `bash skills/war/assets/assert-no-submodule-mutation.test.sh` → passes at HEAD. Note that cases 1/2/8 conflate the guard's step-2 (mode 160000) and step-3 (`.gitmodules`-path) arms (the #279/#294-d weakness).
- [ ] **Step 2 — Add the step-isolating cases.** (a) **step-3 isolation** (#279-1): a `.gitmodules`-path content touch under a **still-gitlinked** submodule, NO gitlink move → guard refuses via step 3. (b) **step-2 isolation** (#279-2): a pure mode-160000 gitlink change whose path does NOT match any `.gitmodules` path → guard refuses via step 2. (c) **pure-content case** (#294-d): case-8 analogue with no incidental gitlink deletion. Use the `file://` fixture protocol (`-c protocol.file.allow=always` on every transport command). Run → **GREEN** (guard refuses-all, so each isolated case is denied as expected).
- [ ] **Step 3 — Prove each case isolates its step (temp-break + revert).** Temporarily disable the guard's step-2 arm → the step-2-isolation case flips to allow (**RED** in the test); revert. Same for step-3. Confirms each new case independently exercises its step ([[weak-test-assertion-passes-without-feature-being-exercised]]).
- [ ] **Step 4 — Comment hygiene.** (#294-a) drop the stale "macOS bash 3.2: use read with IFS" comment (describes the pre-awk approach); (#294-b) add a one-line comment that the awk `split>=2` guard is equivalent to the old unconditional `found=1` (git diff --raw always emits a tab); (#294-c) drop the unused `BASE7_PRESUB` var in case 7.
- [ ] **Step 5 — Full self-discovering gate → green.** Commit — `test(war): isolate assert-no-submodule-mutation steps 2/3 + comment hygiene (#279 #294)`.
- **Closes #279** (items 1/2; **item 3 verify-and-close**: the working-tree-`.gitmodules` read is Increment-2-deferred — note it, no edit) **and advances #294** (a/b/c/d here; e in T3, f verify-and-close: the "ONLY 2 files" task-summary is a plan-doc artifact, no code edit).

---

## Phase 2 — `schemas.md` doc-correctness

### Task 2 — Fix the exit-code parenthetical + add the phase-vs-task targetRepo note (#282-1, #307-1)

**Files:** [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md). Anchor by the `submodule-blocked` bullet and the `targetRepo?` mention.

**`requiresTest`: false** — reference-doc prose; grep-verify (no executable surface).

- [ ] **Step 1 — Fix the misleading parenthetical (#282-1).** The `submodule-blocked` bullet's `(exit 1 from the script, not exit 2)` parallel-reads as *error = exit 1*. Reword to name `submodule-blocked = exit 1` unambiguously (error = exit 2), mirroring the no-test sibling's phrasing exactly ([[mirrored-prose-row-parenthetical-inversion]]).
- [ ] **Step 2 — Add the targetRepo note (#307-1).** One clause: "a submodule **phase** = the set of tasks sharing a `targetRepo`; the per-task `targetRepo?` tag is canonical, the phase repo is derived" ([[submodule-phase-repo-derived-from-task-targetrepo]]).
- [ ] **Step 3 — Grep-verify + full gate green.** `grep` confirms the `submodule-blocked` bullet no longer reads error=exit-1; the targetRepo note is present. Full suite unchanged-green (no behavioral surface). Commit — `docs(war): fix submodule-blocked exit-code parenthetical + phase/task targetRepo note (#282 #307)`.
- **Closes #282 item 1 & #307 item 1** (#282 items 2/3 land in T3; **#307 item 2 verify-and-close**: the design.md §6 forward-link resolved at integration — note it, no edit).

---

## Phase 3 — grouped prose across disjoint files

### Task 3 — Header/direction/placeholder/enum prose + inert-comment rewords (#282 2/3, #296, #303 1/2, #333, #294 e)

**Files (all disjoint; one commit):** [`agents/war-auditor.md`](../../agents/war-auditor.md), [`agents/war-refiner.md`](../../agents/war-refiner.md), [`agents/war-worker.md`](../../agents/war-worker.md), [`skills/war/SKILL.md`](../../skills/war/SKILL.md), [`hooks/validate-servitor-provenance.sh`](../../hooks/validate-servitor-provenance.sh) (comment only), [`skills/war/assets/provision.mjs`](../../skills/war/assets/provision.mjs) (comment only). Anchor each by its named construct.

**`requiresTest`: false** — prose + inert comments; the `validate-servitor-provenance.sh` comment change is non-behavioral (its `*.test.sh` stays green); grep-verify each surface.

- [ ] **Step 1 — Agent prose.** (#282-2) `war-auditor.md` header "Submodule pre-flight (before computing the diff)" → "before lens review" (matches the body, which inspects the computed diff). (#282-3) `war-refiner.md`: optional one-line note that the submodule check and `assert-test-in-diff` are order-independent (both fail-closed pre-merge). (#303-1) `war-refiner.md`: align residual `<submodule_remote>`/`<submodule-remote>` placeholders at the `gh pr view`/`gh pr create` examples to `<pr_remote>` ([[wire-key-rename-misses-prose-placeholders]]). (#303-2) `war-worker.md`: drop `/landed` from the gitlink-bump blocked-condition prose — `landed` is phase-level, not in the task enum ([[phase-vs-task-status-enum-leakage]]).
- [ ] **Step 2 — SKILL.md direction (#296).** §4.3: "cleared by the Resume procedure (sub-procedure **below**)" → "the `held:submodule-pr` sub-procedure in §Resume" (drop the direction; the section is above — [[prose-cross-ref-direction-contradicts-physical-layout]]).
- [ ] **Step 3 — Inert comments (#333, #294-e).** `validate-servitor-provenance.sh` `:71` comment: "take the next `  provenance:` line" → "then take the next indented `provenance:` line (any leading whitespace)" (matches the `/^[[:space:]]+provenance:/` token from #247). `provision.mjs`: optional one-line comment that the path-value regex is intentionally greedy-to-EOL (correct for `.gitmodules`).
- [ ] **Step 4 — Grep-verify + full gate green.** Confirm: `war-auditor.md` says "before lens review"; `war-refiner.md`/`war-worker.md` carry `<pr_remote>` and no task-level `/landed`; `SKILL.md` names `§Resume` (no "below"); `validate-servitor-provenance.sh` `:71` no longer has the 2-space literal. `validate-servitor-provenance.test.sh` stays green (comment-only change). Commit — `docs(war): prose/comment hygiene — headers, direction, pr_remote placeholders, enum, awk comment (#282 #296 #303 #333 #294)`.
- **Closes #282 (2/3), #296, #303, #333; advances #294 (item e).**

---

## Phase 4 — drop the inert `landedShas` threading

### Task 4 — Remove the cross-phase-empty in-memory `landedShas` threading (#300)

**Files:** [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js). Anchor by the `landedShas` construct + the `~L102` comment.

**`requiresTest`: false (no NEW test)** — the removal is behavior-neutral; the existing full gate staying green IS the proof (the cross-phase path already fell back to the ledger).

- [ ] **Step 1 — Verify-inert (REQUIRED before removal).** `grep -n landedShas skills/war/assets/workflow-template.js` — enumerate every producer/consumer. Confirm: (a) the map is populated only in a phase's REFINE loop; (b) the `gitlink-bump` cross-phase read is empty and falls back to the ledger placeholder; (c) no **intra-phase** consumer depends on it in a load-bearing way. If any intra-phase use is load-bearing, retain it and drop only the cross-phase threading + soften the comment (documented fallback). Otherwise proceed to full removal.
- [ ] **Step 2 — Drop the threading.** Remove the inert `landedShas` map + its cross-phase read (and the now-dead `~L102` comment). The authoritative cross-phase SHA source — the ledger read in `war-worker.md` T7 — is **untouched**.
- [ ] **Step 3 — Prove behavior-neutral.** Full self-discovering gate → **green** (removal changed no observable behavior; the workflow-template.test.mjs suite passes unchanged). `grep -n landedShas` shows no remaining reference to the removed path.
- [ ] **Step 4 — Commit** — `refactor(war): drop inert cross-phase landedShas threading; ledger is authoritative (#300)`.
- **Closes #300** (**nit verify-and-close**: the `new_tests:3`-vs-4 worker report is a report artifact, no code edit).

---

## Phase 5 — Release v0.8.11

### Task 5 — Bump the four canonical version slots + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json`; `.claude-plugin/marketplace.json` (×2); `README.md` `## Status` (REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]]).

**`requiresTest`: false** — version serialization.

- [ ] **Step 1 — Bump all four slots `0.8.10 → 0.8.11`** (or next free patch off the live tip). README `## Status` copy: *submodule + servitor hygiene sweep — comment/prose fidelity, step-isolated submodule-guard tests, inert landedShas threading dropped.* Verify all four by hand.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.11 — submodule+servitor hygiene sweep (#333 #279 #282 #294 #296 #300 #303 #307)`.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

`assert-no-submodule-mutation.test.sh` and `validate-servitor-provenance.test.sh` are among the self-discovered `*.test.sh` runners; `workflow-template.test.mjs` is among the `node --test` suites. Run **all** post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]); count self-discovered, never a literal ([[task-prompt-suite-count-stale-after-stacking]]).

## Coverage

| Issue | Task | Kind | Closure |
|---|---|---|---|
| #279 | T1 | test-isolation + verify-and-close | steps 2/3 isolated (temp-break proven); item 3 Increment-2-deferred (no edit) |
| #294 | T1 (a-d), T3 (e) | comment hygiene + test + verify | stale comment/unused var dropped, equivalence comment, pure-content case; item f plan-artifact (no edit) |
| #282 | T2 (1), T3 (2/3) | doc-correctness + prose | exit-code parenthetical fixed; auditor header + refiner order note |
| #307 | T2 (1) | doc + verify-and-close | targetRepo phase/task note; item 2 resolved-at-integration (no edit) |
| #296 | T3 | prose | §Resume named, direction dropped |
| #303 | T3 | prose | `<pr_remote>` placeholders + drop task-level `/landed` |
| #333 | T3 | comment | awk comment → any-indent |
| #300 | T4 | dead-code drop + verify-and-close | inert `landedShas` threading removed (verify-inert, gate-green); nit report-artifact (no edit) |
| *(release)* | T5 | version bump | four slots `0.8.10 → 0.8.11` (fallback: next free patch off live tip) |

## Deliberate simplifications (ponytail)

- **By conflict-boundary, not by-issue.** #279+#294 share the assert file and #282+#307 share `schemas.md`; grouping by file avoids same-task-file rebase conflicts and matches one-commit-per-file-family.
- **T3 groups 6 disjoint prose files in one commit.** All non-behavioral edits with no shared file — separate audits would add rounds for zero isolation benefit on LOW nits.
- **T4 adds no new test.** A pure dead-code removal is proven by the existing gate staying green + the verify-inert grep; a bespoke "it's gone" test would be redundant.
- **Verify-and-close items carry no edit.** #279-3 (Increment-2), #307-2 (resolved), #300-nit, #294-f are recorded in their parent task's closure note and closed by the Lead — re-touching already-correct/future-scoped work is churn.
