# Validate `integration_sha` before it becomes the gate-audit pin — `pinOrSentinel` format-guard at both copy sites + a `cat-file -t` pin-check in the gate-audit prompt — Implementation Plan (issue #393)

**Goal:** one behavioral hygiene fix on the post-merge gate-audit pin path. Today the pin (`gateHeadSha`) is copied **verbatim** from a free-form schema field the war-refiner LLM fills from prose (`MERGE_RESULT.integration_sha`, a bare `{ type: 'string' }`), guarded only by a null-coalesce sentinel. A hallucinated / repeating-tail value sails through and the read-only gate-audit auditor burns a round reasoning about an unverifiable object. Two coupled fixes:
- **D1 — format-guard at the copy site.** A `pinOrSentinel` helper collapses a non-sha-shaped pin to the cannot-confirm sentinel at **both** `gateHeadSha` copy sites, so most bad pins die at the source.
- **D2 — `cat-file -t` the pin first.** The gate-audit prompt gains a `git -C <refineryPath> cat-file -t <gateHeadSha>` existence check before the existing `rev-parse HEAD` pin-check, folded into the existing cannot-confirm SOFT branch, so the auditor recognises a malformed pin **deliberately** (as malformed) rather than **accidentally** (as a `rev-parse` mismatch) — for the residue D1's shape-regex can't catch (a valid-length hex that is not a real object).

**One production file** (`skills/war/assets/workflow-template.js`) + its test file (`workflow-template.test.mjs`). **No new control flow, no schema `pattern`, no new escalation, no guard change.** Ships **v0.8.12** — the **one behavioral fix** of the open-queue batch (specs 12–14); **lands FIRST**, base = master.

**Source spec:** [`docs/specs/2026-07-01-gate-audit-integration-sha-validation-design.md`](../specs/2026-07-01-gate-audit-integration-sha-validation-design.md) (in PR #395).
**Roadmap (authoritative version source):** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — this slug = **spec 12 = v0.8.12**, landing on **master** (behavioral-first order, 2026-07-01); specs 13 (test-hygiene) and 14 (prose-drift) stack on this tip.
**Memory hooks:** [[gate-audit-pin-bracket-test-blocked-by-git-guard]] (the `cat-file -t` recommendation; also: a `gateHeadSha` can be a synthetic/non-existent object, not just stale), [[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]] (`-C` peel already covers `cat-file` — no guard change), [[plan-line-number-refs-stale-use-construct-locator]] (the spec's `:457/:468` are stale — anchor by construct), [[version-slots-no-cross-slot-consistency-test]] (release), [[stacked-release-plan-version-literal-lags-operator-target]] + [[war-branch-base-off-latest-master-not-prior-tip]] (version fallback), [[weak-test-assertion-passes-without-feature-being-exercised]] (prove the pin-guard is load-bearing, not coincidentally green).

**Anchors** are re-grounded against master HEAD **`72d07c7` (v0.8.11)** and independently verified in this grilling — **the spec's line numbers were stale; these are the live ones, anchored by construct**:
- **Schema** `integration_sha: { type: 'string' }` inside `MERGE_RESULT` (`workflow-template.js:47`) — unchanged (no `pattern`).
- **Copy site A** (no-test retry path): the line `gateHeadSha: noTestMr.integration_sha ?? '(integration_sha unrecorded)'` (**~:520**, inside the `if (noTestMr.status === 'merged')` block of the no-test sub-loop).
- **Copy site B** (normal merged path): the line `gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)'` + its trailing `// ponytail: sentinel, not mr.working_sha …` comment (**~:530**, inside `if (mr && mr.status === 'merged')`).
- **Refine block top:** the section comment `// ---- REFINE — serial merge of approved tasks (THE merge queue) ----` (**~:351**) immediately preceding `for (const r of results.filter(Boolean)) {` (**~:352**) — where `pinOrSentinel` is defined (in scope for both copy sites).
- **Gate-audit prompt** built at **~:554–582**; the `rev-parse HEAD` pin-check instruction is **~:565–568**; the cannot-confirm SOFT-note required fields are **~:572–575**. **Zero `cat-file`** in the file today.
- **Tests** (`workflow-template.test.mjs`): `makeGateAuditImpl` factory (**~:1639**) drives the gate-audit prompt; `#193 T1-1` (**~:1653**), `T1-2` (**~:1668**), `T1-3` (**~:1683**), `T1-4` (**~:1700**), `T1-5` (**~:1733**); the prompt-content mirror harness `#193 T2-2` (**~:1534**); the `new Function` extract-and-eval pattern to reuse for the `pinOrSentinel` unit test at `L3 T1` (**~:2000**). **Re-anchor by named construct, never a line number** — churn moves them.

## Coordination

- **Target version:** **v0.8.12** (spec 12 in the roadmap; severity LOW). Bumps `0.8.11 → 0.8.12`. Current tip is `0.8.11` (verified in `.claude-plugin/plugin.json`).
- **Integration base:** **master `72d07c7` (v0.8.11)**. This plan **lands FIRST** in the batch — it is the sole behavioral change; specs 13/14 (docs/test hygiene) stack on its landed tip.
- **One phase, one task (NOT parallel).** The whole fix touches a **single production file** and its **single test file**; D1 and D2 are one coherent behavioral change (D1 stops most bad pins; D2 handles the residue and recognises the sentinel). Same-file edits serialize regardless, so splitting D1/D2 into separate tasks would only fragment one audit — keep it as **one task** + a release task.
- **Cross-spec contention (resolved by order):** spec 13 (test-hygiene, #367) **deletes** the vacuous ace-budget test from **this same file** (`workflow-template.test.mjs`, ~:2695). This plan (spec 12) **adds** tests near the `#193` suite (~:1656) and edits the `#193` fixtures — **disjoint regions**. Spec 12 lands **first**, so spec 13's deletion is later authored on a tip already carrying these additions (clean).
- **Four-slot serial land (replace-in-place, no badge):** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`; [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status`. All four read `0.8.12` after the release task; verify each by hand — no cross-slot consistency test, a partial bump is gate-silent ([[version-slots-no-cross-slot-consistency-test]]).
- **Version fallback:** the version literal is **not** authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]).
- **Commit boundaries:** one impl commit (Task 1), one `chore(release):` commit (Task 2). Two task-branches, not one squash.

## Operator decisions — RESOLVED (bake in exactly)

- **Grilling resolutions (2026-07-01):**
  - **(a) Sentinel text → `'(integration_sha unrecorded/malformed)'`** (the spec's new string), and **update `#193 T1-3`** to match. Behaviour is identical either way (the auditor SOFT-downgrades by `rev-parse` mismatch / `cat-file` failure, **never** by matching the sentinel string) — the `/malformed` variant honestly signals "absent OR malformed"; T1-3 is the **only** test coupled to the sentinel text (grep-bounded) and its expected-string + message must move to the new value.
  - **(b) Add a real D2 regression test** (the spec specified only grep-verification). Mirror `#193 T2-2`'s prompt-content harness: assert the emitted gate-audit prompt contains the **`git -C <refineryPath> cat-file -t`** step (value-independent, like T2-2's `rev-parse HEAD` assertion). Guards the D2 half against a future prompt refactor silently dropping it (which would reopen #393).
- **Spec corrections caught in grilling (the spec's own text is wrong here — follow THIS):**
  - **(c) Copy sites are `~:520` (`noTestMr`) and `~:530` (`mr`)**, NOT `:457/:468` (those are now the ADD_TEST worker dispatch). Anchor by the construct `gateHeadSha: <x>.integration_sha ?? '(integration_sha unrecorded)'` — there are **exactly two** ([[plan-line-number-refs-stale-use-construct-locator]]).
  - **(d) D1's regex `/^[0-9a-f]{7,40}$/` ACCEPTS the spec's example `'8478834b3c9e0e8b3c9e0e8b'`** (24 valid hex chars). The spec's Validation-criteria line ("returns the sentinel") **contradicts** its own Mechanics/Problem sections, which say the loose regex deliberately lets a well-shaped fake **sail through** for D2/`cat-file` to catch. So the `pinOrSentinel` unit test asserts the **sentinel** for **non-hex** inputs (empty / prose / the issue's *ellipsis-tailed* `'8478834b3c9e0e8b3c9e0e8b…'`) and **pass-through** for a pure-hex value (documents the D1/D2 division — do NOT tighten the regex, which cannot distinguish a fake 40-hex from a real one and would reject legit abbreviated shas).
  - **(e) `pinOrSentinel` breaks two existing fixtures.** The stub value `'sha-abc123unique'` is **non-hex** → after D1 it collapses to the sentinel, breaking **`#193 T1-1`** (`prompt.includes('sha-abc123unique')`, ~:1664) and **`#193 T1-4`** (`gateHeadSha === 'sha-abc123unique'`, ~:1727). Both fixtures (stub + assertion + T1-4's comment) must move to a **valid lowercase-hex** sha (e.g. `c0ffee1234`, distinct from the `'deadbeef'` worker-`head_sha` stub). **Leave the non-asserting stubs unchanged** (`T1-2`/`T1-5` assert the directive text / hardness, not the value; the merge/land stubs at ~:1511/:1593/:1622/:2525 never assert their sha) — they route to the sentinel harmlessly; touching them widens the diff into unrelated tests (ponytail).
  - **(f) No guard change.** `hooks/validate-auditor-git.sh` allowlists `cat-file` and peels global `-C <path>` before re-validating the subcommand, so `git -C <refineryPath> cat-file -t <sha>` passes ([[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]]). Corollary baked into the prompt wording: when the pin **is** the sentinel, the command carries `()`/spaces → the guard's char-allowlist denies it → "command cannot run" → the existing cannot-confirm SOFT path, exactly as D2 intends. #393's stale "Related" sub-item (a plugin-root/worktree divergence) is not in scope.
- **`requiresTest`:** **Task 1 `true`** (it *adds* tests — the `pinOrSentinel` unit test + the D2 prompt assertion — so the refiner's `assert-test-in-diff.sh` floor becomes a live precondition that refuses to merge unless a test actually landed in the diff). **Task 2 (release) `false`** (version serialization, no executable surface). The floor is the only behaviour `requiresTest` changes; the post-merge gate-audit runs regardless and stays SOFT here.

---

## Phase 1 — the fix (single file)

### Task 1 — `pinOrSentinel` guard at both copy sites + `cat-file -t` pin-check in the gate-audit prompt (#393)

**Files:** [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) (D1 + D2) and [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) (tests). Locate every site by the **constructs** named in Anchors — never by the line numbers here.

**`requiresTest`: true** — this task adds the `pinOrSentinel` unit test and the D2 prompt-assertion test; the refiner's `assert-test-in-diff.sh` floor confirms a test actually landed in the diff (it does — the diff touches `workflow-template.test.mjs`).

TDD order — mapped tests first (RED), then production (GREEN), then a reverted-break sanity to prove the wiring is load-bearing.

- [ ] **Step 1 — Baseline green.** Run the **full** self-discovering gate → green (establishes the pre-change baseline: existing `#193` suite passes with the non-hex fixtures and the old sentinel).
- [ ] **Step 2 — Write / update the tests (expected RED).** In `workflow-template.test.mjs`:
  - **2a — `pinOrSentinel` unit test (D1).** Add a test that extracts the helper from the template source via the `new Function` extract-and-eval pattern used by `L3 T1` (~:2000) — read `src` (the already-loaded template text), regex-capture the `pinOrSentinel` arrow (span the possibly-multi-line body with `[\s\S]`), `new Function('return (' + captured + ')')()`, and assert **corrected** cases:
    - `pinOrSentinel('deadbeef') === 'deadbeef'` (valid short hex — passes)
    - `pinOrSentinel(undefined) === '(integration_sha unrecorded/malformed)'` (absent)
    - `pinOrSentinel('') === '(integration_sha unrecorded/malformed)'` (empty)
    - `pinOrSentinel('8478834b3c9e0e8b3c9e0e8b…') === '(integration_sha unrecorded/malformed)'` (the issue's ellipsis-tailed value — non-hex → sentinel)
    - `pinOrSentinel('8478834b3c9e0e8b3c9e0e8b') === '8478834b3c9e0e8b3c9e0e8b'` (**pass-through** — a valid-shape fake D1 deliberately does NOT catch; `cat-file` (D2) is what rejects it — this assertion documents the D1/D2 split)
  - **2b — D2 `cat-file` prompt assertion.** Mirror `#193 T2-2` (~:1534): drive `runPhase`/`makeGateAuditImpl`, grab the `execution-evidence` gate-audit prompt, and assert it contains the **command-form** `git -C <refineryPath> cat-file -t` (value-independent, as T2-2 does for `rev-parse HEAD`). Use the same `refineryPath` literal T2-2 uses.
  - **2c — Migrate the value-asserting fixtures to valid hex (D1 breakage fix).** In `#193 T1-1` (stub ~:1656 + assertion/message ~:1664–1665) and `#193 T1-4` (stub ~:1719 + comment ~:1702 + assertion ~:1727), replace `'sha-abc123unique'` with a **valid lowercase-hex** sha (e.g. `c0ffee1234`). Leave `T1-2`/`T1-5` and all other `integration_sha` stubs unchanged.
  - **2d — Update the sentinel assertion (Q1).** In `#193 T1-3` (comment ~:1685 + assertion + message ~:1694–1695), change the expected sentinel `'(integration_sha unrecorded)'` → `'(integration_sha unrecorded/malformed)'`. (Stub stays `{}` — absent sha — and the `!prompt.includes('undefined')` assertion is unaffected.)
  - Run the gate → **RED** (the `pinOrSentinel` unit test, the D2 `cat-file` assertion, and T1-3's new sentinel all fail against unmodified production; T1-1/T1-4 already pass because raw hex flows through the current `?? sentinel` copy sites).
- [ ] **Step 3 — D1 production.** In `workflow-template.js`, at the top of the REFINE block (immediately after the `// ---- REFINE …` section comment ~:351, before the `for` loop — in scope for both copy sites), define:
  ```js
  // ponytail: guard the agent-emitted pin at the copy site, not via a schema `pattern` —
  //           the model must still be able to emit the '(integration_sha …)' sentinel legitimately.
  const pinOrSentinel = s =>
    (typeof s === 'string' && /^[0-9a-f]{7,40}$/.test(s)) ? s : '(integration_sha unrecorded/malformed)'
  ```
  Replace **both** copy sites: `gateHeadSha: noTestMr.integration_sha ?? '(integration_sha unrecorded)'` → `gateHeadSha: pinOrSentinel(noTestMr.integration_sha)` (~:520) and `gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)'` → `gateHeadSha: pinOrSentinel(mr.integration_sha)` (~:530; keep/trim the trailing `working_sha` ponytail comment). → the `pinOrSentinel` unit test and T1-3 go green; T1-1/T1-4 stay green.
- [ ] **Step 4 — D2 production.** In the gate-audit prompt (~:554–582), **before** the `First confirm your evidence is pinned … git -C ${refineryPath} rev-parse HEAD` step (~:565–568), insert a `cat-file` existence check, e.g.:
  ```js
  + `First, validate the gate-HEAD pin is a real object. Run (read-only git, permitted):\n`
  + `    git -C ${refineryPath} cat-file -t ${gateHeadSha}\n`
  + `If that command fails (non-zero exit, or the guard refuses it because the pin is the '(integration_sha …)' sentinel), the pin is malformed/synthetic: record the SOFT cannot-confirm note (fields below) and skip the rev-parse comparison — never a HARD finding.\n`
  ```
  Fold the malformed-pin outcome into the **existing** cannot-confirm SOFT branch, reusing the same required note fields (~:572–575). **Do NOT add a new outcome, escalation, or control flow.** → the D2 `cat-file` assertion goes green.
- [ ] **Step 5 — Full gate green, then prove load-bearing (sanity, reverted — NOT committed).**
  - Run the **full** gate → green.
  - **Wiring proof (D1):** temporarily replace `pinOrSentinel`'s body with `s => '(integration_sha unrecorded/malformed)'` (always-sentinel); confirm **both** `T1-1` and `T1-4` go **RED** (the valid-hex pin no longer reaches the prompt / auditLog → proves both copy sites route through `pinOrSentinel`, not the raw field). **Revert.**
  - **Wiring proof (D2):** temporarily delete the `cat-file -t` line; confirm the Step-2b assertion goes **RED**. **Revert.**
- [ ] **Step 6 — Grep post-conditions.**
  - `grep -c 'pinOrSentinel(' skills/war/assets/workflow-template.js` → **2** (the two call sites; the `const pinOrSentinel = s =>` definition has no `(`).
  - `grep -c "?? '(integration_sha unrecorded)'" skills/war/assets/workflow-template.js` → **0** (both old copy patterns replaced).
  - `grep -c 'integration_sha unrecorded/malformed' skills/war/assets/workflow-template.js` → **1** (the new sentinel, inside `pinOrSentinel`).
  - `grep -c 'cat-file -t' skills/war/assets/workflow-template.js` → **1** (inside the gate-audit prompt; was 0 at HEAD).
- [ ] **Step 7 — Commit** — `fix(war): validate integration_sha before it becomes the gate-audit pin — pinOrSentinel guard at both copy sites + cat-file pin-check in the gate-audit prompt (#393)`
- **Closes #393.** A malformed/synthetic pin now collapses to the cannot-confirm sentinel at the source (D1), and the auditor `cat-file -t`s the pin before comparing it (D2) — a bad pin is recognised as malformed (SOFT), not burned as an unverifiable `rev-parse` mismatch.

---

## Phase 2 — Release v0.8.12

### Task 2 — Bump the four canonical version slots + full self-discovering gate green

**Files:** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) (`version`); [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) (`metadata.version` **and** `plugins[0].version`); [`README.md`](../../README.md) `## Status` (REPLACE-in-place, no badge — [[release-status-is-replace-slot-not-empty-field]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.11 → 0.8.12`.** Verify each by hand — no cross-slot consistency test, so a partial bump is gate-silent ([[version-slots-no-cross-slot-consistency-test]]). Update the README `## Status` "Builds on" clause to `v0.8.11`. Status copy: *gate-audit integration_sha validation — a `pinOrSentinel` format-guard collapses a malformed/synthetic gate-HEAD pin to the cannot-confirm sentinel at both copy sites, and the gate-audit auditor now `cat-file -t`s the pin before comparing it, so a bad pin is recognised as malformed (SOFT) rather than burning an audit round.* **Fallback:** if landing off a tip other than master `72d07c7`, bump to the next free patch off the live tip by construct, not the literal `0.8.12` ([[stacked-release-plan-version-literal-lags-operator-target]]).
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.12 — gate-audit integration_sha validation (#393)`. **Lands FIRST** in the batch (before specs 13/14).

---

## Gate

Run the **full** self-discovering gate before **every** commit (never a `--test-name-pattern` subset — the fixture/sentinel edits change pattern-match strings):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- `node --test 'skills/**/*.test.mjs'` — quote the glob (bash 3.2 under-covers it unquoted — [[node-breadth-assertion-test-js-overclaims]]).
- The `for`-loop self-discovers every `*.test.sh` runner via the gate's own `find` — never a hardcoded count ([[task-prompt-suite-count-stale-after-stacking]]). `hooks/validate-auditor-git.test.sh` is one such runner; it is **not touched** by this plan (no guard change) but still runs.
- **Run the full gate after the merge converges** on the integration tip.

## Coverage

| Issue | Task | Phase | `requiresTest` | Kind | Closure |
|---|---|---|---|---|---|
| #393 (D1) | Task 1 | 1 | **true** | format-guard at the copy site | `pinOrSentinel` defined at the REFINE-block top; both `gateHeadSha: <x>.integration_sha ?? '(integration_sha unrecorded)'` sites → `pinOrSentinel(<x>.integration_sha)`; unit test asserts non-hex→sentinel, valid-hex→pass-through (D1/D2 split); T1-1/T1-4 fixtures → valid hex; T1-3 sentinel → `/malformed`; wiring proven via always-sentinel→RED→revert |
| #393 (D2) | Task 1 | 1 | **true** | `cat-file -t` pin-check in the gate-audit prompt | `git -C ${refineryPath} cat-file -t ${gateHeadSha}` inserted before the `rev-parse HEAD` step, folded into the existing cannot-confirm SOFT branch (reuse note fields; no new outcome); prompt-assertion test mirrors `#193 T2-2`; proven via delete-line→RED→revert; no guard change ([[guard-c-peel-resolves-pin-blocker-but-scoped-to-read-verbs-only]]) |
| *(release)* | Task 2 | 2 | false | version bump | four slots `0.8.11 → 0.8.12` (roadmap spec 12; fallback: next free patch off the live tip); lands first |

## Deliberate simplifications (ponytail)

- **No schema `pattern` on `integration_sha`.** A `pattern` would reject the legitimate `'(integration_sha …)'` sentinel the refiner emits when it genuinely has no sha; the guard lives at the copy site so the sentinel path stays intact.
- **No new HARD escalation / no new outcome.** A malformed pin is a cannot-confirm case, and cannot-confirm is already SOFT by the stale-tip defusing rule. D2 folds into the existing branch — no `HARD_ESCALATION_REASONS` / land-decision cascade.
- **Loose regex by design; the unit test documents the D1/D2 split.** `/^[0-9a-f]{7,40}$/` only rejects non-sha *shapes* (empty, prose, truncated tails); a valid-length hex fake passes D1 and is caught by D2's `cat-file`. The pass-through assertion pins this intent so no one later "tightens" the regex (which can't tell a fake 40-hex from a real one, and would reject legit abbreviated shas). This corrects the spec's self-contradictory `8478834b… → sentinel` example.
- **No guard change.** `validate-auditor-git.sh` already peels `-C` and allowlists `cat-file`; the sentinel-pin case is handled for free by the char-allowlist denial → cannot-confirm SOFT.
- **Minimal fixture churn.** Only the two value-asserting fixtures (T1-1, T1-4) move to hex; non-asserting stubs (T1-2, T1-5, and the merge/land stubs) are left routing to the sentinel harmlessly.
- **One task, not two.** D1+D2 are one coupled fix on one file; same-file edits serialize regardless, and one issue → one audit. Splitting would only fragment the audit.
- **No ADR, no new GitHub issues.** #393 is the audit finding, closed by Task 1; the fix is a localized hygiene patch with no hard-to-reverse, surprising trade-off.
