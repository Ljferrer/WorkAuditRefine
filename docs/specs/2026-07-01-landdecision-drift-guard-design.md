# Drift-guard the `landDecision` known-set: canonical export + behavioral-and-doc parity test

**Status:** proposed — targets **v0.8.8** (latent-correctness robustness). **Severity: MEDIUM.**
**Source:** issue #271. Memory: [[plan-array-literal-lags-canonical-export]], [[shared-status-enum-widening-silently-widens-land-path]], [[held-workflow-error-infra-death-prose-mismatch]], [[plan-line-number-refs-stale-use-construct-locator]], [[gate-under-covers-after-cross-branch-merge-new-runner]].
Group: standalone (behavioral spec). Disjoint files from the pending v0.8.5–v0.8.7 stack except the shared version slots and a one-line comment touch in `workflow-template.js`; lands serially after them (landOrder 8).

## Problem

The `landDecision` **known-set** — the canonical enumeration of every terminal outcome a per-phase Workflow run can resolve to — has **7 members**:

```
landed · held:escalation · held:nothing-merged · held:land-failed · held:phase-incomplete · held:workflow-error · held:submodule-pr
```

It is written as **unguarded prose in four surfaces** (issue #271 named three and undercounted; the line numbers it cites are already stale — anchor by construct, [[plan-line-number-refs-stale-use-construct-locator]]):

1. [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — the **return-contract** line (`` `landDecision` ∈ `landed` | `held:escalation` | … ``; issue said `:40`, now ~L47).
2. [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — the **§4.2 fail-closed classifier's** parenthetical known-set (the `"… not in the known set (`landed`, `held:escalation`, …)"` list; issue said `:62`, now ~L78).
3. [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — the **enum union type** in the Workflow-return block (issue said `:198`, now ~L208).
4. [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — the **per-value definition bullet list** (`- **`held:escalation`** — …` through `held:submodule-pr`, ~L210-217). **The issue missed this surface entirely.**

Unlike `HARD_ESCALATION_REASONS` (a canonical export in [`land-decision.mjs`](../../skills/war/assets/land-decision.mjs) + an inline mirror in `workflow-template.js` + the [`war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) `deepEqual` drift-guard), **nothing binds these four surfaces**, and there is no JS array to diff them against.

**The sharp trap (why MEDIUM, not NIT).** §4.2 step 2 reads: *"…or `landDecision` is not in the known set (…) → classify as `held:workflow-error`."* This classifier is **read by the Lead agent at runtime**. So if a future `held:foo` is added to the schemas enum (surface 3) but not to the §4.2 list (surface 2), then when the Workflow legitimately returns `held:foo` the Lead's fail-closed classifier **silently rewrites it to `held:workflow-error`** — and `held:workflow-error` is **terminal, HARD-halts regardless of `--afk`, never retries**. A retryable or interactive hold becomes a dead phase. This is the sharpest failure mode in the land area, and it fires silently (the docs still "look right" in isolation). Related: [[shared-status-enum-widening-silently-widens-land-path]], [[held-workflow-error-infra-death-prose-mismatch]].

**Structural nuance that shapes the fix.** The known-set is a **union of three code/agent origins**, not a single code branch:

| Origin | Values | Where |
|--------|--------|-------|
| `decideLand()` returns | `landed`, `held:escalation`, `held:nothing-merged` (3) | [`land-decision.mjs`](../../skills/war/assets/land-decision.mjs) `decideLand` |
| Workflow assigns directly | the above **plus** `held:land-failed`, `held:submodule-pr`, `held:workflow-error` (6 total) | [`workflow-template.js`](../../skills/war/assets/workflow-template.js) landDecision block (~L558-645) |
| Lead classifies (never emitted by the script) | `held:phase-incomplete` (set when `status !== "completed"`) | SKILL.md §4.2 step 1 |

So a `KNOWN_LAND_DECISIONS` export is a **superset** of what any single code site branches on. The Workflow emits 6 of 7; `held:phase-incomplete` is **canonical-but-not-emitted** by design (the Lead sets it from the notification status, not the script). A related imprecision to fix in the same pass: the comment at [`workflow-template.js`](../../skills/war/assets/workflow-template.js) ~L553 says landDecision *"mirrors land-decision.mjs (decideLand)"*, but the Workflow emits 6 values while `decideLand` emits only 3 — the Workflow emits a **superset** of `decideLand`.

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | Build a guard, or rely on discipline? | **Build it.** The failure mode (silent `held:X` → `held:workflow-error` terminal downgrade) is the sharpest trap in the land area; cost is one export + one test. The "enumerate all surfaces" discipline already needed a manual save during submodule-support (that's why #271 exists). | Discipline only / close #271 won't-fix (leaves the silent-trap latent); a human-only cross-link comment at each surface (no mechanical catch). |
| D2 | Source of truth | **A canonical `KNOWN_LAND_DECISIONS` array export in [`land-decision.mjs`](../../skills/war/assets/land-decision.mjs)**, beside `HARD_ESCALATION_REASONS` and `decideLand`. Its consumers are the drift-guard test and the behavioral subset assertions (D3) — a legitimate contract anchor, not an unconsumed export. | Pick one `.md` surface as canonical and diff the others against it (no single intended anchor; the sharp surface — §4.2 — is the *last* place you'd want to treat as ground truth). |
| D3 | Guard strength: doc-parity only, or behavioral too? | **Behavioral + doc-parity.** (a) **Behavioral:** regex-extract the `landDecision` string literals the Workflow assigns (`workflow-template.js`) and `decideLand`'s output literals (`land-decision.mjs`), assert **both ⊆ `KNOWN_LAND_DECISIONS`** — this is the same extract-and-`deepEqual` shape as the `HARD_ESCALATION_REASONS` precedent and catches the trap **at its source** (a code-emitted value the known-set doesn't contain). (b) **Doc-parity:** assert each of the 4 doc surfaces **== `KNOWN_LAND_DECISIONS`**. | Pure doc-parity (proves the docs agree with each other but never checks the code's actual emissions are inside the set — the issue's own "weaker than deepEqual" caveat stands). |
| D4 | Surface coverage | **All 4 surfaces** (both SKILL.md sites, both schemas.md sites). A guard that skips a surface has the exact blind spot it exists to close. | 3 delimited-list surfaces only (leaves the schemas.md bullet list free to drift silently — the surface the issue itself missed). |
| D5 | Extraction robustness | **Anchor each surface's extraction region by a stable phrase** (`"not in the known set"`, `"The full `landDecision` enum:"`, the `` `landDecision` ∈ `` contract line, the enum union line), then collect backtick-wrapped `` `landed` `` / `` `held:[a-z-]+` `` tokens within that region → set. **Assert each parsed set is non-empty** (a broken anchor must fail loudly, not vacuously pass) and **pin `KNOWN_LAND_DECISIONS.length === 7`** (adding a value forces a conscious test + count update). Never a lazy `[\s\S]+?` capture ([[regex-extract-live-code-lazy-quantifier-fragility]]). | Free-prose scan of the whole file (matches stray `held:*` mentions outside the enumerations); adding machine-readable markers to each surface (a 5th representation to drift — self-defeating for a drift-guard). |
| D6 | Test home | **[`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs)** (already exists; co-located with `decideLand` and the new export). | `war-config.test.mjs` (where the `HARD_ESCALATION_REASONS` guard lives for historical reasons — but a `land-decision.mjs` export belongs with its module's test). |
| D7 | Fix the imprecise mirror comment | In the same pass, correct the `workflow-template.js` ~L553 comment: the Workflow emits a **superset** of `decideLand` (6 vs 3), not a mirror. | Leave it (perpetuates a subtly wrong model of which values the Workflow can emit — [[source-comment-lags-emitted-prompt-after-rewrite]]). |

### Mechanics

**Export ([`land-decision.mjs`](../../skills/war/assets/land-decision.mjs)).**
```js
// Canonical known-set of landDecision values the Lead may observe/classify (7 members).
// Superset of decideLand()'s 3 outputs and of the Workflow's 6 emitted literals:
// 'held:phase-incomplete' is Lead-classified (status !== 'completed'), never emitted by the script.
// Drift-guarded against workflow-template.js emissions + all 4 doc surfaces in land-decision.test.mjs.
export const KNOWN_LAND_DECISIONS = ['landed', 'held:escalation', 'held:nothing-merged', 'held:land-failed', 'held:phase-incomplete', 'held:workflow-error', 'held:submodule-pr']
```

**Test ([`land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs)) — one suite, five assertions.**
1. **Count pin:** `assert.equal(KNOWN_LAND_DECISIONS.length, 7)` and no duplicates (`new Set(...).size === 7`).
2. **Behavioral — Workflow emissions ⊆ canonical:** read `workflow-template.js`; collect the string literals assigned to `landDecision` (the `landDecision = '…'` / `landDecision: '…'` right-hand sides — anchor on the landDecision block, not a whole-file `'held:*'` scrape which would also match comments); assert every one is in `KNOWN_LAND_DECISIONS` and that the extracted set is exactly the expected 6 (so a *new* emitted value fails until the export + docs learn it).
3. **Behavioral — decideLand outputs ⊆ canonical:** the three literals `decideLand` can return are each in `KNOWN_LAND_DECISIONS`.
4. **Doc-parity ×4:** for each of the 4 surfaces, extract the region by its stable phrase, tokenize backtick `` `landed` ``/`` `held:*` ``, assert the set is non-empty **and** `deepEqual` (order-insensitive) to `KNOWN_LAND_DECISIONS`.
5. **Non-emitted documented:** assert `held:phase-incomplete` ∈ `KNOWN_LAND_DECISIONS` **and** ∉ the Workflow-emitted set (pins the intentional canonical-but-not-emitted gap, so a future refactor that starts emitting it — or drops it from the export — trips the test).

## Affected files

| File | Change |
|------|--------|
| [`skills/war/assets/land-decision.mjs`](../../skills/war/assets/land-decision.mjs) | Add the `KNOWN_LAND_DECISIONS` export (D2) + the explanatory comment. |
| [`skills/war/assets/land-decision.test.mjs`](../../skills/war/assets/land-decision.test.mjs) | Add the drift-guard suite (D3/D4/D5) — count pin, 2 behavioral subset checks, 4 doc-parity checks, non-emitted assertion. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | D7: reword the ~L553 comment (Workflow emits a superset of `decideLand`, not a mirror). No behavioral change. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **0.8.8** (four canonical slots, replace-in-place — see below). |

**No change to SKILL.md / schemas.md** — the four doc surfaces are already correct at HEAD (all enumerate the same 7). The guard freezes that agreement; it does not edit the prose.

## Alternatives considered

- **Discipline only (close #271).** Rejected — D1; the silent hold→terminal-error trap is too sharp to leave to editor vigilance, and the discipline already lapsed once.
- **Pure doc-parity.** Rejected — D3; without the behavioral subset check the guard never verifies the code's real emissions are inside the set, so it can't catch a new `workflow-template.js` emission the known-set doesn't recognize (the actual trap).
- **Behavioral `deepEqual` (not subset) against Workflow emissions.** Rejected — the Workflow emits 6 of 7; `held:phase-incomplete` is Lead-classified. Equality would false-fail. Subset (⊆) + the explicit non-emitted assertion (test #5) captures the real invariant.
- **Machine-readable markers at each surface.** Rejected — D5; a 5th canonical representation is one more thing to drift, defeating the purpose. Parse the existing prose.

## Validation criteria

1. **(#271 — export + count)** `KNOWN_LAND_DECISIONS` exists in `land-decision.mjs` with exactly the 7 members; `land-decision.test.mjs` pins `length === 7` and no dupes. Adding a fabricated 8th member to the export (without touching docs) makes the doc-parity checks fail — proving they are load-bearing.
2. **(#271 — behavioral)** The test extracts the Workflow's emitted `landDecision` literals from `workflow-template.js` and asserts the set is exactly the 6 expected and all ⊆ `KNOWN_LAND_DECISIONS`; `decideLand`'s 3 outputs ⊆ `KNOWN_LAND_DECISIONS`. Introducing a `landDecision = 'held:bogus'` line in `workflow-template.js` fails assertion #2.
3. **(#271 — doc-parity ×4)** Each of the 4 surfaces parses to a **non-empty** set that `deepEqual`s `KNOWN_LAND_DECISIONS`. Deleting one value from any single surface (e.g. dropping `held:submodule-pr` from the §4.2 list) fails that surface's check. A broken region anchor yields an empty set → fails the non-empty assertion (fail-closed, not vacuous — [[printf-json-escaping-vacuous-test-case]]).
4. **(#271 — non-emitted gap)** The test asserts `held:phase-incomplete` is canonical but **not** in the Workflow-emitted set.
5. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner self-discovered by the gate's `find` (never a literal count — run **all** post-merge, a cross-branch merge can add runners the bare glob misses, [[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Version serialization

v0.8.8 replaces the four canonical slots in one bump (no badge): [`plugin.json`](../../.claude-plugin/plugin.json) `version`; [`marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status` (replace-in-place). Lands serially at landOrder 8 on the landed tip of the pending stack (…v0.8.7 → **v0.8.8**); the version literal is **not** authoritative — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). Confirm all four slots by hand ([[version-slots-no-cross-slot-consistency-test]]).

## Open risks / non-goals

- **Non-goal: making the §4.2 classifier executable.** It stays Lead-read prose (M1's deliberate choice — dead-phase-halt). The guard is the mechanical safety net around that prose, not a replacement for it.
- **Non-goal: editing the doc prose.** The 4 surfaces agree at HEAD; the guard freezes agreement. If the release stack ahead (esp. spec 7 `--ace`, which touches `workflow-template.js`) shifts the landDecision block, re-anchor the behavioral extractor by construct at implementation time.
- **Risk (low): prose-extraction brittleness.** Mitigated by stable-phrase anchoring + the non-empty assertion (a mis-anchor fails loudly). Documented inline. If a surface's phrasing later changes, the fix is to re-anchor the extractor, not to weaken the assertion.
- **Risk: the behavioral extractor scanning the whole file** would match `'held:*'` tokens in comments/prose. Mitigated by anchoring to the landDecision-assignment block (D5), not a whole-file scrape.

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #271  | D1, D2, D3, D4, D5, D6, D7 | 1, 2, 3, 4 (gate: 5) |
