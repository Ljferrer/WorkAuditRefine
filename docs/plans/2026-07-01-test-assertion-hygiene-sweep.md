# test-assertion hygiene sweep — kill a vacuous ace-budget test, tighten the landDecision drift-guard extractor regex, pin the red-team 1c guard technique-scoped — Implementation Plan (issues #367 #373 #380)

**Goal:** one test-hygiene pass across **three disjoint `*.test.mjs` files** closing three same-genus nits — tests that go green (or would stay green under a future regression) without exercising the invariant they name:
- **#367** — a vacuous ace-budget test that passes via an `audit-blocked` short-circuit, never evaluating the `fixRounds < roundLimit` guard it claims to cover ([`workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs)).
- **#373** — the landDecision drift-guard `direct` extractor regex unions `===` comparisons with assignments, arming a latent false-RED ([`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs)).
- **#380** — a red-team scaffold test with a stale BACK-COMPAT title + a 1c guard pinned by probe **name** not **technique**, so a name-scoped regression would slip ([`workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs)).

**Zero production change.** The guards these tests name (the ace branch in `workflow-template.js`, the `landDecision` block, `workflow-scaffold.js:153`) are already correct and stay untouched (except transient, reverted sanity edits). Ships **v0.8.12** (hygiene).

**Source spec:** [`docs/specs/2026-07-01-test-assertion-hygiene-sweep-design.md`](../specs/2026-07-01-test-assertion-hygiene-sweep-design.md) (in PR #395). **Standalone** — not part of a stack; no roadmap.
**Memory hooks:** [[weak-test-assertion-passes-without-feature-being-exercised]] (#367), [[drift-guard-extraction-regex-unions-comparisons-with-assignments]] (#373), [[relaxed-assertion-test-title-must-update-together]] + [[verbatim-mirror-directive-context-mismatch-at-destination]] (#380), [[plan-line-number-refs-stale-use-construct-locator]] (all anchors by construct), [[war-phase-up-front-provisioning-conflicts-same-file-serial-tasks]] (disjoint files ⇒ parallel), [[version-slots-no-cross-slot-consistency-test]] (release).

**Anchors** are re-grounded against master HEAD **`72d07c7` (v0.8.11)** and independently verified: #367 test title `Task 3 — budget: ace does NOT dispatch when fixRounds has already reached roundLimit` (~`:2695`; single-attempt covered at ~`:2642`/`:2692`); #373 `const direct` regex (`:81`), operator comment (`:72`), `behavioral ⊆` expected-6 (`:88`), `held:phase-incomplete` gap-assert (`:151`); #380 `provision BACK-COMPAT` title (`:335`), production guard `p.technique === 'analyzed'` (`workflow-scaffold.js:153`). **Re-anchor by named construct, never a line number** — churn moves them.

## Coordination

- **Target version:** **v0.8.12** (next free patch off master v0.8.11, severity LOW). Bumps `0.8.11 → 0.8.12`.
- **Integration base:** current **master tip `72d07c7`**. Standalone — not stacked on another branch.
- **One parallel phase (NOT one-task-per-phase).** The three tasks touch **disjoint files** (`workflow-template.test.mjs` / `land-decision.test.mjs` / `workflow-scaffold.test.mjs`), so they run as **one phase, three parallel tasks** — WAR provisions an isolated worktree per task, workers run concurrently, each is audited independently, and the refiner serializes the (non-conflicting) merges. The one-task-per-phase / strictly-serial rule applies only when tasks share a file ([[war-phase-up-front-provisioning-conflicts-same-file-serial-tasks]]) — it does **not** apply here.
- **Four-slot serial land (replace-in-place, no badge):** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`; [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status`. All four read `0.8.12` after the release task; verify each by hand — there is no cross-slot consistency test, a partial bump is gate-silent ([[version-slots-no-cross-slot-consistency-test]]).
- **Standalone fallback:** the version literal is **not** authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). The three test-edits are baseline-independent.
- **Cross-spec caveat (out of scope):** spec #3 (`gate-audit-integration-sha-validation`, #393) also edits `workflow-template.test.mjs` — the file Task 1 (#367) deletes from. This plan is standalone; if #393 is implemented later off master, coordinate the land order (or expect one merge on that file). Nothing here touches #393's surface.
- **Commit boundaries:** one task per issue (independent audits), one commit per task; the release is its own `chore(release):` commit. Four task-branches, not one squashed commit.

## Operator decisions — RESOLVED (bake in exactly)

- **Grilling resolutions (2026-07-01):** **(a)** standalone → v0.8.12; **(b)** one parallel phase + a release phase; **(c)** #380 **includes** the bespoke-executed probe (spec D5, upgraded from the issue's "optional"); **(d)** `requiresTest` — **#380 `true`** (the one task that *adds* a test: the refiner's `assert-test-in-diff.sh` floor becomes a live precondition that refuses to merge unless the probe actually landed in the test file), **#367 / #373 `false`** (a deletion / a regex tighten — no *new* test to enforce; the floor would pass trivially on their `*.test.mjs` diff and is a no-op there). The floor is the **only** behavior `requiresTest` changes — the post-merge gate-audit runs for every merged task regardless and stays SOFT for all three.
- **#367 — DELETE the vacuous test (spec D1).** Remove the whole `test('Task 3 — budget: ace does NOT dispatch when fixRounds has already reached roundLimit', …)` block. It adds no coverage — single-attempt is genuinely proven by the two `calls.filter(isAce).length === 1` assertions at the adjacent "single attempt" tests (~`:2642`, ~`:2692`) — and the guard it *names* is defensively-dead on the approve path (a freshly-approved task reaches the ace branch only while `round < roundLimit`). **Do NOT touch production** (`workflow-template.js`): no comment on the dead guard — that would break zero-production-change and the disjoint-file parallelism.
- **#373 — tighten the regex + fix the comment (spec D2/D3).** In [`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs), change the `direct` extractor (`:81`) `(?:={1,3}|:)` → `(?:=(?![=])|:)` so `==`/`===` comparison sites are no longer captured as "emitted"; and reword the operator comment (`:72`) `(= / == / === / :)` → `(= or :)`. Forecloses the latent false-RED where a future `landDecision === 'held:phase-incomplete'` comparison in the block would spuriously enter the emitted set.
- **#380 — reword the title + add the bespoke-executed probe (spec D4/D5).** In [`workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs): reword the stale BACK-COMPAT title (`:335`) from `…prompts are byte-for-byte today's` to `an empty provision list must not change prompts vs an absent one` (the body already asserts empty ⟺ absent equality); and add a bespoke `{ technique: 'executed' }` probe, looping the 1c precondition-absence assertion over **both** `probe:executable-proof` and the new probe so the guard is pinned **technique-scoped, not name-scoped** (production guard is `p.technique === 'analyzed'` at `workflow-scaffold.js:153`).

---

## Phase 1 — parallel test-assertion hygiene (three disjoint files)

Three tasks, run in parallel (disjoint files). Each: establish the load-bearing baseline green → make the edit → prove load-bearing (sanity, reverted — not committed) → full gate green → commit.

### Task 1 — Delete the vacuous ace-budget test (#367)

**File:** [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) — locate by the **test title** `Task 3 — budget: ace does NOT dispatch when fixRounds has already reached roundLimit` (~`:2695`).

**`requiresTest`: false** — a deletion, no new test; single-attempt coverage is preserved by the two sibling `calls.filter(isAce).length === 1` assertions, and the full gate is the proof nothing else regressed.

- [ ] **Step 1 — Baseline: confirm the coverage this test claims is held elsewhere.** `grep -n "calls.filter(isAce).length, 1" skills/war/assets/workflow-template.test.mjs` shows the two single-attempt assertions (~`:2642`, ~`:2692`) that genuinely cover "ace dispatches at most once". Run the full gate → green (establishes the pre-delete baseline).
- [ ] **Step 2 — Delete the whole test block.** Remove the entire `test('Task 3 — budget: ace does NOT dispatch when fixRounds has already reached roundLimit', async () => { … })` (title through its closing `})`). Touch nothing else; **do not** touch `workflow-template.js`.
- [ ] **Step 3 — GREEN + grep post-condition.** `grep -c "budget: ace does NOT dispatch when fixRounds" skills/war/assets/workflow-template.test.mjs` → **0**; the two single-attempt assertions remain. Run the **full** gate → green.
- [ ] **Step 4 — Commit** — `test(war): delete vacuous ace-budget test that passed via audit-blocked short-circuit (#367)`
- **Closes #367.** The coincidental-green test is gone; single-attempt stays covered by the two load-bearing assertions.

### Task 2 — Tighten the landDecision drift-guard extractor regex + fix its comment (#373)

**File:** [`skills/war/assets/land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs) — locate by the construct `const direct = [...block.matchAll(` inside `function workflowEmitted()` (`:81`) and its preceding operator comment (`:72`).

**`requiresTest`: false** — a one-char-class regex tighten + a comment fix inside the test file; the existing `behavioral ⊆` (`:88`) and `held:phase-incomplete` gap (`:151`) assertions are the load-bearing proof and stay green.

- [ ] **Step 1 — Baseline.** Run the enclosing suite → green (`node --test skills/war/assets/land-decision.test.mjs`). Confirm the union today: the `direct` regex `(?:={1,3}|:)` matches `=`, `==`, `===`, `:`; green only because both compared literals are also emitted and `uniqSort` dedupes.
- [ ] **Step 2 — Tighten + fix the comment.** Change the `direct` regex (`:81`) to `/landDecision\s*(?:=(?![=])|:)\s*(['"])(landed|held:[a-z-]+)\1/g` (negative-lookahead drops `==`/`===`, keeps single `=` and `:`). Reword the comment (`:72`) `(= / == / === / :)` → `(= or :)`.
- [ ] **Step 3 — Prove the latent trap is closed (sanity, reverted — not committed).** Temporarily add `else if (landDecision === 'held:phase-incomplete')` inside the landDecision block of `workflow-template.js`; confirm `workflowEmitted()` does **not** pick it up (the `behavioral ⊆` expected-6 and the `:151` gap assertion stay green — pre-tighten this comparison would have false-RED'd both). **Revert** the production edit.
- [ ] **Step 4 — GREEN + grep post-condition.** `grep -n "={1,3}" skills/war/assets/land-decision.test.mjs` → **nothing**; `grep -n "=(?![=])" skills/war/assets/land-decision.test.mjs` → the tightened regex. Run the **full** gate → green.
- [ ] **Step 5 — Commit** — `test(war): tighten landDecision extractor regex to assignment-only (=(?![=])|:) + fix operator comment (#373)`
- **Closes #373.** Comparison sites no longer masquerade as emitted; the false-RED trap is foreclosed.

### Task 3 — Reword the BACK-COMPAT title + pin the 1c guard technique-scoped (#380)

**File:** [`skills/red-team/assets/workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs) — the `provision BACK-COMPAT` test title (`:335`) and the 1c precondition-absence assertion on `probe:executable-proof`.

**`requiresTest`: true** — this task **adds** a regression-pin assertion; the refiner's `assert-test-in-diff.sh` floor confirms the probe actually landed in the diff (it does — the diff touches this `*.test.mjs`).

- [ ] **Step 1 — Baseline.** Run the suite → green (`node --test skills/red-team/assets/workflow-scaffold.test.mjs`). Confirm production is already technique-scoped: `grep -n "p.technique === 'analyzed'" skills/red-team/assets/workflow-scaffold.js` → `:153` (the preconditionRule rides only on analyzed probes).
- [ ] **Step 2a — Reword the stale title (D4).** Change the `:335` title `provision BACK-COMPAT: no provision list => scope-lock + prompts are byte-for-byte today's` → `provision BACK-COMPAT: an empty provision list must not change prompts vs an absent one`. Body unchanged (it already asserts empty ⟺ absent).
- [ ] **Step 2b — Add the bespoke-executed probe (D5).** Add a bespoke `{ technique: 'executed' }` probe and loop the 1c absence assertion over both labels:
  ```js
  const a = baseArgs({ probes: [{ name: 'bespoke-executed', kind: 'bespoke', technique: 'executed', prompt: 'do bespoke executed' }] })
  const { prompts } = await runScaffold(a, passResult(a))
  const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
  for (const label of ['probe:executable-proof', 'probe:bespoke-executed'])
    assert.ok(!/PRECONDITION vs DELIVERABLE/.test(byLabel[label]),
      label + ': executed probes must not gain the precondition rule (technique-scoped, not name-scoped)')
  ```
  (Adapt the probe-construction/label helpers to the file's existing fixtures — `baseArgs`, `runScaffold`/`promptsByLabel`, `passResult`.)
- [ ] **Step 3 — Prove it is load-bearing (sanity, reverted — not committed).** Temporarily rewrite the guard in `workflow-scaffold.js:153` from `p.technique === 'analyzed'` to a **name** check (e.g. `p.name !== 'executable-proof'`); confirm the new `bespoke-executed` absence assertion goes **RED** (the rule leaks onto the differently-named executed probe). **Revert** the production edit.
- [ ] **Step 4 — GREEN + grep post-conditions.** `grep -c "byte-for-byte today" skills/red-team/assets/workflow-scaffold.test.mjs` → **0**; `grep -c "bespoke-executed" skills/red-team/assets/workflow-scaffold.test.mjs` → ≥1. Run the **full** gate → green.
- [ ] **Step 5 — Commit** — `test(red-team): reword stale BACK-COMPAT title + pin 1c guard technique-scoped via bespoke executed probe (#380)`
- **Closes #380.** The title matches the body's invariant; the 1c guard is pinned technique-scoped — a name-scoped regression now goes RED.

---

## Phase 2 — Release v0.8.12

### Task 4 — Bump the four canonical version slots + full self-discovering gate green

**Files:** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) (`version`); [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) (`metadata.version` **and** `plugins[0].version`); [`README.md`](../../README.md) `## Status` (REPLACE-in-place, no badge — [[release-status-is-replace-slot-not-empty-field]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.11 → 0.8.12`.** Verify each by hand — no cross-slot consistency test, so a partial bump is gate-silent ([[version-slots-no-cross-slot-consistency-test]]). Update the README `## Status` "Builds on" clause to `v0.8.11`. Status copy: *test-assertion hygiene sweep — deleted a vacuous ace-budget test, tightened the landDecision drift-guard extractor to assignment-only, pinned the red-team 1c guard technique-scoped.* **Standalone fallback:** if landing off a tip other than master v0.8.11, bump to the next free patch off the live tip by construct, not the literal `0.8.12`.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.12 — test-assertion hygiene sweep (#367/#373/#380)`. Lands last (behavioral-before-cosmetic).

---

## Gate

Run the **full** self-discovering gate before **every** commit (never a `--test-name-pattern` subset — #380's title edit changes a pattern-match string):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

- `node --test 'skills/**/*.test.mjs'` — quote the glob (bash 3.2 under-covers it unquoted — [[node-breadth-assertion-test-js-overclaims]]).
- The `for`-loop self-discovers every `*.test.sh` runner via the gate's own `find` — never a hardcoded count ([[task-prompt-suite-count-stale-after-stacking]]).
- **Run the full gate after the parallel merges converge** on the integration tip — a title/regex edit in one file must not have shifted a sibling runner or doc ([[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Coverage

| Issue | Task | Phase | `requiresTest` | Kind | Closure |
|---|---|---|---|---|---|
| #367 | Task 1 | 1 (parallel) | false | delete vacuous test | remove the `Task 3 — budget: ace…` block; single-attempt stays covered by the two `calls.filter(isAce).length===1` asserts |
| #373 | Task 2 | 1 (parallel) | false | regex tighten + comment | `(?:={1,3}\|:)` → `(?:=(?![=])\|:)`; comment `(= or :)`; latent false-RED closed (proven via reverted `held:phase-incomplete` sanity) |
| #380 | Task 3 | 1 (parallel) | **true** | title reword + regression-pin | title → empty⟺absent; bespoke executed probe loops the 1c absence over both labels; guard-rewrite→RED→revert proves load-bearing |
| *(release)* | Task 4 | 2 | false | version bump | four slots `0.8.11 → 0.8.12` (standalone fallback: next free patch off the live tip) |

## Deliberate simplifications (ponytail)

- **#367 adds no test — it removes one.** The coverage it claimed is genuinely held by the two sibling single-attempt assertions; a replacement boundary-driving test would just duplicate `:2692`. Delete is the lazy correct move.
- **No production touch anywhere.** #367 does **not** annotate the defensively-dead guard in `workflow-template.js`; #373/#380 sanity edits to production are transient and reverted. This keeps the three tasks disjoint-file and parallel-safe, and the diffs test-only.
- **#380 is `requiresTest:true`, the other two `false`.** The floor is a live precondition only where a test is *added*; on a deletion/tighten it can't fail, so enforcing it there would be ceremony. This is the one place the plan distinguishes the flag per task, deliberately.
- **No ADR, no new GitHub issues authored by this plan** — pure test-file hygiene; #367/#373/#380 are the audit findings, closed by their tasks.
- **Standalone, not stacked.** No roadmap doc; the #393/`workflow-template.test.mjs` overlap is noted as a land-order caveat, not coordinated here.
