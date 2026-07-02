# spec/doc prose-drift reconciliation — SKILL.md returns bullet (`+aced`), submodule-support §5.6 reachability reattribution; #392 close-as-clean — Implementation Plan (issues #368 #385 #392)

**Goal:** reconcile two prose-only drifts against an **already-correct authority**, and close one confirmed non-defect. Doc-only — **zero code / test / schema change**:
- **#368** — append `aced` to the `skills/war/SKILL.md` per-phase return bullet, which lags the canonical `references/schemas.md` contract and the `workflow-template.js` returns.
- **#385** — reattribute reachability in `docs/specs/2026-06-29-submodule-support-design.md` §5.6, whose closing sentence now contradicts the post-#310 §5.4 wording.
- **#392** — **close-as-clean** (non-defect): the quoted plan prose does not exist at HEAD and the case-11 rationale is already documented. **Not a worker task.**

**Spec 14** in the remediation roadmap stack — **lands last** (most cosmetic, roadmap principle #2) at **v0.8.14** on the spec-13 (test-hygiene) tip.

**Source spec:** [`docs/specs/2026-07-01-spec-and-doc-prose-drift-reconciliation-design.md`](../specs/2026-07-01-spec-and-doc-prose-drift-reconciliation-design.md) (PR #395).
**Roadmap (authoritative version source):** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — this slug = **spec 14 = v0.8.14** (third batch: specs 12–14, behavioral-first).
**Memory hooks:** [[wire-key-rename-misses-prose-placeholders]] + [[default-flip-must-audit-all-doc-surfaces]] (#368 omitted return field), [[default-flip-must-audit-all-doc-surfaces]] sibling-section variant (#385), [[report-nothing-to-commit-never-implement-unprompted]] + [[verify-and-close-claim-can-trace-to-transient-uncommitted-edit]] (#392 close-as-clean, no empty-diff task), [[plan-line-number-refs-stale-use-construct-locator]] (anchors by construct), [[version-slots-no-cross-slot-consistency-test]] (release).

**Anchors** re-grounded against master HEAD `72d07c7` (v0.8.11) and independently verified: #368 return bullet `skills/war/SKILL.md:49` (the `returns \`{ … }\` — \`landDecision\` ∈ …` line); #385 stale sentence `docs/specs/2026-06-29-submodule-support-design.md:173` (`(§5.4) independently re-checks reachability …`); #392 premise `grep '8 cases' docs/plans/2026-07-01-submodule-servitor-hygiene-sweep.md` → **no match**. Re-anchor by named construct, never a line number.

## Coordination

- **Spec 14 · target v0.8.14 · lands LAST.** Doc-only, most cosmetic → last in the stack (roadmap principle #2 "behavioral before cosmetic"). **Integration base:** the **landed tip of spec 13 (test-hygiene, v0.8.13)**, which itself sits on spec 12 (gate-audit, v0.8.12) on master.
- **Roadmap is the authoritative version source.** The `v0.8.14` literal is **not** authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). The two prose edits are baseline-independent.
- **One phase, two parallel tasks** (#368 `SKILL.md`, #385 `submodule-support-design.md` — **disjoint files**): isolated worktrees, concurrent workers, independent audits, refiner serializes the non-conflicting merges. **#392 is close-as-clean — not a task** (an empty-diff task would trip the refiner's "nothing to commit"; the spec forbids a make-work edit for a dead LOW nit).
- **Four-slot serial land (replace-in-place, no badge):** [`plugin.json`](../../.claude-plugin/plugin.json) `version`; [`marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status`. All read `0.8.14` after release; verify by hand ([[version-slots-no-cross-slot-consistency-test]]).
- **Shared-file contention:** none between this spec and specs 12/13 **except the four version slots** (serialized by the ordered versions). `SKILL.md` and `submodule-support-design.md` are single-owner lanes for this spec.
- **`requiresTest`: false for both tasks** — pure prose, no executable surface ([WAR SKILL.md](../../skills/war/SKILL.md): `false` for "docs/config/prose-only"). The full gate still runs.
- **#368 has a live doc-reader:** `land-decision.test.mjs` `doc-parity (a)` reads `SKILL.md:49`. Its extractor `/\`(landed|held:[a-z-]+)\`/g` matches only the individually-backticked **enum** tokens after `∈`; `aced` sits inside the single `` `{ … }` `` span and isn't in the alternation, so the append is **provably inert** — but Task 1 **must** confirm that test stays green.

## Operator decisions — RESOLVED (bake in exactly)

- **Grilling resolutions (2026-07-01):** **(a)** stacked under the existing roadmap as **spec 14, v0.8.14, lands last**; **(b)** stack land order is **behavioral-first** — gate-audit (#393) v0.8.12 → test-hygiene v0.8.13 → this (prose) v0.8.14; **(c)** **#392 = close-as-clean, not a worker task**; **(d)** **#368 + #385 = two parallel tasks** (per-issue independent audits, disjoint files); **(e)** `requiresTest: false` for both (doc-only).
- **#368 — append `aced` after `minorsFiled` in the SKILL.md return bullet (spec D1).** Edit `skills/war/SKILL.md:49` `returns \`{ landed, escalated, minorsFiled, landResult, servitorResult, auditLog, landDecision }\`` → `returns \`{ landed, escalated, minorsFiled, aced, landResult, servitorResult, auditLog, landDecision }\``. Mirrors `schemas.md:206` field order (`minorsFiled` then `aced`) and the `workflow-template.js` returns. One-token insert; the `— \`landDecision\` ∈ …` remainder of the line is untouched.
- **#385 — reattribute reachability in §5.6 (spec D2).** Replace the false closing sentence of §5.6 (`submodule-support-design.md:173`) — *"The pin-validity lens (§5.4) independently re-checks reachability — defense in depth against a wrong/forged fallback SHA."* — with a reattribution to the parties that actually own the check: the **Lead resume-time reconciliation** (§6/L2, re-verifies reachability on the submodule remote) + the **refiner's refusal to push an unreachable gitlink pin** (**§4.1 Refiner bullet** — the fail-closed floor, exercised under §5.5's landing authority; also §12 criterion 3. **Red-team corrected 2026-07-01:** §5.5 itself contains only the 2A/2B landing procedures and never mentions reachability — do NOT cite §5.5 for this check); the §5.4 lens now only enforces the **ledger SHA-match**. Single-passage swap — the replacement reads as **two sentences** (the source spec's own "one-sentence" phrasing undercounts its blockquote; red-team noted, harmless); §5.4 is the authority and is unchanged.
- **#392 — close as not-a-defect, NO edit (spec D3).** The quoted "existing 8 cases" plan prose is absent at HEAD (grep → nothing; the plan has no CONSTRAINTS section), and the case-11 `.gitmodules`-drop rationale is already documented in the `assert-no-submodule-mutation.test.sh` header. Close #392 with that evidence; no branch, no commit.
- **Zero code / test / schema change** — `schemas.md`, `workflow-template.js`, `land-decision.mjs`/`.test.mjs`, and `assert-no-submodule-mutation.test.sh` are all untouched; they are the authorities these docs are being reconciled *to*.

---

## Phase 1 — parallel prose reconciliation (two disjoint docs)

Two tasks, run in parallel (disjoint files). Each: baseline (authority + any doc-reader test green) → make the one-line edit → grep post-condition + confirm the reader test stays green → full gate → commit.

### Task 1 — Append `aced` to the SKILL.md per-phase return bullet (#368)

**File:** [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — locate by the construct `returns \`{ landed, escalated, minorsFiled,` (the per-phase Refines return bullet, `:49`).

**`requiresTest`: false** — prose; no executable surface. The load-bearing check is that `land-decision.test.mjs` `doc-parity (a)` (which reads this line) stays green.

- [ ] **Step 1 — Baseline + confirm the authority.** `grep -n 'aced' skills/war/references/schemas.md` → `:206` (`aced` after `minorsFiled` in the "Workflow per-phase return"); `grep -n 'const aced' skills/war/assets/workflow-template.js` → the return attribute exists. Run `node --test skills/war/assets/land-decision.test.mjs` → green (`doc-parity (a)` currently passes on the pre-edit line).
- [ ] **Step 2 — Insert the token.** In `SKILL.md:49`, change `{ landed, escalated, minorsFiled, landResult, …` → `{ landed, escalated, minorsFiled, aced, landResult, …` (insert `aced` after `minorsFiled`). Leave the `— \`landDecision\` ∈ …` remainder of the line byte-unchanged.
- [ ] **Step 3 — Confirm inert + post-condition.** `node --test skills/war/assets/land-decision.test.mjs` → still green (`doc-parity (a)` extracts only the backticked `landed|held:*` enum after `∈`; `aced` is not matched). `grep -n 'minorsFiled, aced, landResult' skills/war/SKILL.md` → the append is present in schemas.md field order. Run the **full** gate → green.
- [ ] **Step 4 — Commit** — `docs(war): append aced to the SKILL.md per-phase return bullet to match schemas.md + workflow-template.js (#368)`
- **Closes #368.** The summary bullet now matches the canonical return contract; the doc-parity test is confirmed unaffected.

### Task 2 — Reattribute reachability in submodule-support §5.6 (#385)

**File:** [`docs/specs/2026-06-29-submodule-support-design.md`](../specs/2026-06-29-submodule-support-design.md) — locate by the sentence `independently re-checks reachability` in §5.6 (`:173`). **No test reads this file** — the edit is purely inert prose.

**`requiresTest`: false** — spec prose; no executable surface.

- [ ] **Step 1 — Baseline.** `grep -n 'independently re-checks reachability' docs/specs/2026-06-29-submodule-support-design.md` → the stale §5.6 sentence (`:173`). Confirm §5.4 is the authority: it states reachability is established upstream and **not** re-verified by an auditor `git fetch` (the read-only guard denies it); the lens enforces the ledger SHA-match.
- [ ] **Step 2 — Swap the sentence.** Replace the §5.6 closing sentence with the reattribution: reachability is guarded by the **Lead resume-time reconciliation** (§6/L2, re-verifies the SHA is reachable on the submodule remote) and the **refiner's refusal to push an unreachable gitlink pin** (**§4.1 Refiner bullet**, exercised under §5.5's landing authority — cite §4.1, NOT §5.5, which contains only the 2A/2B procedures); the §5.4 lens only enforces the ledger SHA-match, so defense-in-depth against a wrong/forged fallback SHA comes from the reconciliation + refiner, **not** the auditor lens. Anchor on the quoted sentence, not a line number.
- [ ] **Step 3 — Post-condition.** `grep -c 'independently re-checks reachability' docs/specs/2026-06-29-submodule-support-design.md` → **0**; the §5.6 text no longer contradicts §5.4's "read-only guard denies it" wording. Run the **full** gate → green (inert; no test reads this doc).
- [ ] **Step 4 — Commit** — `docs(war): reattribute §5.6 reachability to the Lead reconciliation + refiner, not the pin-validity lens (post-#310) (#385)`
- **Closes #385.** §5.6 names the real reachability owners; the sibling-section contradiction with §5.4 is gone.

---

## #392 — close-as-clean (NOT a task)

**No branch, no commit, no worker.** #392 is a confirmed non-defect:
- The quoted plan prose *"Keep the existing 8 cases green"* **does not exist at HEAD** — `grep -n '8 cases' docs/plans/2026-07-01-submodule-servitor-hygiene-sweep.md` → no match; the plan has no CONSTRAINTS section and no case-count claim (red-team verified: absent at **every** revision of the file — `75d4d72` → `3f4f3d5` → `c6882a7`; the file has three commits, not one).
- The optional case-11 note (`.gitmodules` dropped for the temp-break RED proof) is **already documented** in the `assert-no-submodule-mutation.test.sh` header (the case enumeration + the working-tree-`.gitmodules` rationale block).

**Action:** close #392 on GitHub as not-a-defect with the two grep evidences above (operator, or the WAR wrap-up). Adding any file edit would be make-work on a dead LOW nit — rejected by the spec ([[report-nothing-to-commit-never-implement-unprompted]]).

---

## Phase 2 — Release v0.8.14

### Task 3 — Bump the four canonical version slots + full self-discovering gate green

**Files:** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) (`version`); [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) (`metadata.version` **and** `plugins[0].version`); [`README.md`](../../README.md) `## Status` (REPLACE-in-place, no badge — [[release-status-is-replace-slot-not-empty-field]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.13 → 0.8.14`** (base = spec-13 tip). Verify each by hand — no cross-slot consistency test ([[version-slots-no-cross-slot-consistency-test]]). Update README `## Status` "Builds on" clause to `v0.8.13`. Status copy: *spec/doc prose-drift reconciliation — SKILL.md return bullet now lists `aced`; submodule-support §5.6 reattributes reachability to the Lead reconciliation + refiner.* **Standalone fallback:** if landing off a different tip, bump to the next free patch off the live tip by construct, not the literal `0.8.14`.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.14 — spec/doc prose-drift reconciliation (#368/#385; #392 closed clean)`. Lands last in the stack.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- Even though the edits are doc-only, run the **full** gate — `land-decision.test.mjs` `doc-parity (a)`/(b) read `SKILL.md`, so #368's edit is gate-relevant ([[gate-under-covers-after-cross-branch-merge-new-runner]]).
- Quote the `.mjs` glob (bash 3.2 — [[node-breadth-assertion-test-js-overclaims]]); the `for`-loop self-discovers every `*.test.sh` ([[task-prompt-suite-count-stale-after-stacking]]).

## Coverage

| Issue | Task | Phase | `requiresTest` | Kind | Closure |
|---|---|---|---|---|---|
| #368 | Task 1 | 1 (parallel) | false | doc reconciliation | append `aced` after `minorsFiled` in `SKILL.md:49`; `doc-parity (a)` confirmed inert + green |
| #385 | Task 2 | 1 (parallel) | false | spec-prose reattribution | swap the §5.6 reachability sentence to name the Lead reconciliation + refiner; no test reads it |
| #392 | *(none)* | — | — | close-as-clean | non-defect: `grep '8 cases'` → nothing; case-11 rationale already documented — closed on GitHub, no edit |
| *(release)* | Task 3 | 2 | false | version bump | four slots `0.8.13 → 0.8.14` (standalone fallback: next free patch off the live tip) |

## Deliberate simplifications (ponytail)

- **#392 is closed, not coded.** A VERIFY task would produce an empty diff (refiner "nothing to commit"); a make-work note edit is exactly the belt-and-suspenders the spec rejects for a dead LOW nit. The two grep evidences ARE the closure.
- **No drift-guard test added for the return field list.** #368 exists because no test asserts the SKILL.md return *field* list (only the `landDecision` enum is guarded). Adding such a guard is a real feature, out of scope for a one-token prose fix — file it separately if the field list drifts again.
- **Two tasks, not one.** #368 and #385 are unrelated subsystems (WAR return contract vs submodule spec); separate audits are worth more than the orchestration they cost (cost is not a constraint here).
- **Doc-only, zero authority change.** `schemas.md` / `workflow-template.js` / §5.4 are the authorities being reconciled *to* — untouched by design.
