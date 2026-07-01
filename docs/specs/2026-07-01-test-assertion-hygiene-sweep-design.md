# Test-assertion hygiene sweep: kill vacuous, over-matching, and stale-titled tests — Design

**Status:** proposed — hygiene patch, targets **v0.8.12** (current is v0.8.11; operator confirms final version). **Severity: LOW.**
**Source:** GitHub #367, #373, #380. Memory: [[weak-test-assertion-passes-without-feature-being-exercised]], [[drift-guard-extraction-regex-unions-comparisons-with-assignments]], [[relaxed-assertion-test-title-must-update-together]], [[verbatim-mirror-directive-context-mismatch-at-destination]].
Group: standalone test-hygiene sweep. All three touch `*.test.mjs` only; **zero production diff**. Files are disjoint (one war template test, one war land-decision test, one red-team scaffold test), so order-free.

## Problem

Three tests go **green without proving their stated invariant** — the recurring [[weak-test-assertion-passes-without-feature-being-exercised]] genus. Each passes by the wrong path (short-circuit, regex union, or a title that no longer describes the body) rather than by exercising the guard it names. The standard this sweep sets: **a test must fail if the named invariant breaks.** Fix is the same shape across all three — tighten or delete an assertion/title, **no production behavior change**.

- **#367 — vacuous by short-circuit.** [`workflow-template.test.mjs:2695`](../../skills/war/assets/workflow-template.test.mjs) (`Task 3 — budget: ace does NOT dispatch when fixRounds has already reached roundLimit`) claims to exercise the ace guard `r.task.fixRounds < roundLimit` ([workflow-template.js:366](../../skills/war/assets/workflow-template.js)). It sets `roundLimit:1` and returns `request_changes(Major)` on round 1. Traced the audit loop ([workflow-template.js:316-348](../../skills/war/assets/workflow-template.js)): round 0 enters, no early-exit fires, an unblocked fix-worker runs, `round++`→1, loop guard `1 < 1` fails, verdict falls through to `audit-blocked` (L347). Because `r.verdict !== 'approve'`, the approve branch (L359) is skipped and **the guard at L366 is never evaluated** — the `!calls.some(isAce)` assertion (L2717) passes coincidentally via the `audit-blocked` short-circuit. Compounding: the guard term is **defensively-dead** on the approve path — `fixRounds` is seeded from `r.round` (L355) and an approve only breaks the loop while `round < roundLimit`, so `fixRounds` is always `< roundLimit` when the approve branch runs. Single-attempt budget is genuinely covered by the adjacent [`:2685`](../../skills/war/assets/workflow-template.test.mjs) test (`calls.filter(isAce).length === 1`).

- **#373 — over-matching regex union (latent false-RED).** In `workflowEmitted()` of [`land-decision.test.mjs:81`](../../skills/war/assets/land-decision.test.mjs) the `direct` extractor `/landDecision\s*(?:={1,3}|:)\s*(['"])(landed|held:[a-z-]+)\1/g` alternation `(?:={1,3}|:)` matches `=`, `==`, `===`, and `:`. Since `===`/`==` are **only ever comparisons** in JS, the regex captures literals from `if (landDecision === '…')` sites too — the "emitted" set is actually "emitted OR compared-against in the block". Green at HEAD only because both compared literals (`'landed'` at [workflow-template.js L626](../../skills/war/assets/workflow-template.js), `'held:escalation'` at L681) are **also** emitted, so `uniqSort` dedupes the union away. Latent trap: adding a comparison against a canonical-but-non-emitted value — e.g. `else if (landDecision === 'held:phase-incomplete')` (member 5 of the 7-element `KNOWN_LAND_DECISIONS`, [land-decision.mjs L21](../../skills/war/assets/land-decision.mjs)) — spuriously enters the emitted set and breaks **both** the expected-6 assertion (`:88`) and the Step-5 non-emitted-gap assertion. The adjacent comment ([`:72`](../../skills/war/assets/land-decision.test.mjs)) compounds it: `(= / == / === / :)` mislabels the comparison operators as assignment. Carries `code_change_required:true`, but the change is a one-char-class regex tighten **inside the test file** — still strictly test-only, no production diff.

- **#380 — stale title + name-scoped 1c pin.** Two Nits in [`workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs); production ([workflow-scaffold.js:153](../../skills/red-team/assets/workflow-scaffold.js)) is correct (guard is already `technique==='analyzed'`-scoped). **Nit 1 (stale title):** the BACK-COMPAT test title at [`:335`](../../skills/red-team/assets/workflow-scaffold.test.mjs) reads `…prompts are byte-for-byte today's`, reading like a golden/snapshot claim, but the body ([`:338-342`](../../skills/red-team/assets/workflow-scaffold.test.mjs)) asserts an internal **equality** (`provision:[]` prompts == key-absent prompts). Inner comment + assertion message already state the real semantics. **Nit 2 (name-scoped pin):** the #311 "1c negative" (precondition rule ABSENT on executed probes) is asserted only against the single spine probe `probe:executable-proof` ([`:327-333`](../../skills/red-team/assets/workflow-scaffold.test.mjs)). A regression swapping the guard from `p.technique==='analyzed'` to a name check (e.g. `p.name!=='executable-proof'`) would still pass 1c yet leak the rule onto a differently-named executed probe. A bespoke executed probe pins the guard as **technique-scoped, not name-scoped**.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | #367 — vacuous ace-budget test | **DELETE the test at [`workflow-template.test.mjs:2695-2718`](../../skills/war/assets/workflow-template.test.mjs). Recommended.** It adds no coverage — single-attempt/budget is genuinely proven at `:2685` (`calls.filter(isAce).length===1`), and the guard it *names* is defensively-dead on the approve path (unreachable-as-gating). Deleting removes the misleading green. | Keep + rewrite to drive an approved task to the guard boundary (largely duplicates `:2685` since ace is single-attempt by design — no re-ace loop); keep + add a `// ponytail: fixRounds<roundLimit is defensively-dead on the approve path` comment (leaves a coincidental-pass test in the suite). |
| D2 | #373 — regex union | **Tighten the `direct` regex at [`land-decision.test.mjs:81`](../../skills/war/assets/land-decision.test.mjs): replace `(?:={1,3}\|:)` with `(?:=(?![=])\|:)`.** Drops `===`/`==` comparison sites while still catching all 4 assignments + the `landDecision: 'held:workflow-error'` catch-block `:` literal. Verified: on `landDecision === 'landed'` the negative lookahead fails at every `=` and `\s*` cannot skip `=` to reach the quote → no match; on `landDecision = 'x'` the single `=` matches. Forecloses the latent false-RED. | Leave the regex, add a comment that the union is "deliberate and harmless while all compared values are emitted" — weaker, leaves the trap armed. |
| D3 | #373 — stale comment | **Same pass: fix the comment at [`land-decision.test.mjs:72`](../../skills/war/assets/land-decision.test.mjs).** Change `(= / == / === / :)` to `(= or :)` — after the tighten only `=`/`:` are matched, and `==`/`===` were never assignment operators. | Leave it (perpetuates mislabeling comparison as assignment — [[source-comment-lags-emitted-prompt-after-rewrite]]). |
| D4 | #380 Nit 1 — stale title | **Reword the title at [`workflow-scaffold.test.mjs:335`](../../skills/red-team/assets/workflow-scaffold.test.mjs)** from `provision BACK-COMPAT: no provision list => scope-lock + prompts are byte-for-byte today's` to `provision BACK-COMPAT: an empty provision list must not change prompts vs an absent one`. No body change (assertions/comment already match — [[relaxed-assertion-test-title-must-update-together]]). | Leave it (title reads as a snapshot claim the body doesn't make). |
| D5 | #380 Nit 2 — name-vs-technique pin | **Extend the #311 executed-absence test at [`workflow-scaffold.test.mjs:327-333`](../../skills/red-team/assets/workflow-scaffold.test.mjs)** with a bespoke executed probe and loop the absence assertion over both labels, so it fails if the guard is ever rewritten name-scoped. Recommended (small, closes the real blind spot). | Ship Nit 1 only (leaves the guard pinned by probe name, not technique). |

### Mechanics

**D2/D3 ([`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs)).**
```js
// comment ~L72: change "(= / == / === / :)" → "(= or :)"
const direct = [...block.matchAll(/landDecision\s*(?:=(?![=])|:)\s*(['"])(landed|held:[a-z-]+)\1/g)].map((m) => m[2])
```
No test-of-the-test needed — the existing expected-6 (`:88`) and Step-5 gap assertions already exercise the extractor; they stay green at HEAD (the tighten only removes redundant comparison-site matches that `uniqSort` was already collapsing).

**D5 ([`workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs)) — extend the `:327` test.** Add a bespoke executed probe and assert absence over both labels:
```js
const a = baseArgs({ probes: [{ name: 'bespoke-executed', kind: 'bespoke', technique: 'executed', prompt: 'do bespoke executed' }] })
const { prompts } = await runScaffold(a, passResult(a))
const byLabel = Object.fromEntries(prompts.map(p => [p.opts.label, p.prompt]))
for (const label of ['probe:executable-proof', 'probe:bespoke-executed'])
  assert.ok(!/PRECONDITION vs DELIVERABLE/.test(byLabel[label]),
    label + ': executed probes must not gain the precondition rule (technique-scoped, not name-scoped)')
```

## Affected files

| File | Change |
|------|--------|
| [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) | D1: delete the vacuous ace-budget test (`:2695-2718`). |
| [`skills/war/assets/land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs) | D2: tighten the `direct` regex (`:81`). D3: fix the operator comment (`:72`). |
| [`skills/red-team/assets/workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs) | D4: reword BACK-COMPAT title (`:335`). D5: extend the #311 executed-absence test with a bespoke executed probe (`:327`). |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **v0.8.12** (four canonical slots, replace-in-place — see below). |

**No production files touched.** All three fixes are inside `*.test.mjs`; the guards they name (`workflow-template.js:366`, the landDecision block, `workflow-scaffold.js:153`) are already correct and unchanged.

## Alternatives considered

- **#367 — leave as-is.** Rejected: a test that passes via `audit-blocked` short-circuit while claiming to exercise the ace guard is exactly the [[weak-test-assertion-passes-without-feature-being-exercised]] trap; keeping it banks false confidence in a guard that is never run.
- **#367 — rewrite instead of delete.** Rejected as the primary: ace is single-attempt by design, so a boundary-driving rewrite mostly duplicates `:2685`. Delete is the lazy correct move.
- **#373 — comment-only ("union is harmless").** Rejected: leaves the latent false-RED armed; the one-char-class tighten costs nothing and forecloses it.
- **#380 Nit 1 — rewrite the body to a real byte snapshot.** Rejected: the equality (empty ⟺ absent) is the correct invariant; only the title was stale.
- **#380 Nit 2 — skip.** Rejected: without a bespoke executed probe the 1c guard is pinned by probe name, so a name-scoped regression passes green — the blind spot the pin exists to close.

## Validation criteria

1. **(#367 — D1)** `grep -n "budget: ace does NOT dispatch when fixRounds" skills/war/assets/workflow-template.test.mjs` returns nothing; the single-attempt guard at `:2685` remains. Suite stays green.
2. **(#373 — D2)** `grep -n "(?:=(?!\[=\])|:)" skills/war/assets/land-decision.test.mjs` matches the `direct` regex; `grep -n "={1,3}" skills/war/assets/land-decision.test.mjs` returns nothing. The `behavioral ⊆` (`:88`) and Step-5 assertions pass. Adding `else if (landDecision === 'held:phase-incomplete')` to `workflow-template.js` no longer breaks the extractor (union closed) — but that line is **not** committed; it is only the proof-of-tighten.
3. **(#373 — D3)** `grep -n "=== " skills/war/assets/land-decision.test.mjs` no longer appears in the `direct`-extractor comment; the comment reads `(= or :)`.
4. **(#380 Nit 1 — D4)** `grep -n "byte-for-byte today" skills/red-team/assets/workflow-scaffold.test.mjs` returns nothing; the reworded title `an empty provision list must not change prompts vs an absent one` is present.
5. **(#380 Nit 2 — D5)** `grep -n "bespoke-executed" skills/red-team/assets/workflow-scaffold.test.mjs` matches; the #311 test loops the absence assertion over both `probe:executable-proof` and `probe:bespoke-executed`. Rewriting the guard to `p.name !== 'executable-proof'` in `workflow-scaffold.js` fails this test.
6. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner self-discovered by the gate's `find` — run **all** post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Version serialization

v0.8.12 replaces the four canonical slots in one bump (no badge): [`plugin.json`](../../.claude-plugin/plugin.json) `version`; [`marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status` (replace-in-place). The version literal is **not** authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]); confirm all four slots by hand ([[version-slots-no-cross-slot-consistency-test]]).

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #367  | D1 | 1 (gate: 6) |
| #373  | D2, D3 | 2, 3 (gate: 6) |
| #380  | D4, D5 | 4, 5 (gate: 6) |
