# war-followup #444 — endState plan_ref binding + structure-test robustness

Converts [#444](https://github.com/Ljferrer/WorkAuditRefine/issues/444) (clean-handoff phase-1
residual Minor/Nit findings, all adjudicated no-change-needed, filed for the record) into an
executable plan. Scope resolved with the operator: fix **F1** (the one genuine latent bug), fold
**F2**, harden **F3**; **F4** is a conscious no-change.

## Commander's Intent
  - **Purpose:** Close the one genuine latent bug in #444's residuals — a whitespace/case-off
    `plan_ref` silently upgrading an *unmet* End-state condition to `met` — and tighten the two
    adjacent test-robustness nits, without weakening the auditor VERBATIM prompt-directive contract.
  - **Method:** Two file-disjoint tasks in one phase. **(A)** normalize the `plan_ref === condition`
    compare in the handoff endState resolver and fold F2's proxy-gap assertion into the criterion-10
    test; **(B)** bind the war-strategy structure-test's ordering grep to its plan-template
    occurrence (fence-robust). Behavior-preserving except the F1 near-match binding; **F4 is left
    untouched** — already pinned by the `check_f` verbatim guard. A trailing release phase bumps the
    version **+0.0.1**.
  - **End state:**
    1. A gate finding whose `plan_ref` differs from a claimed condition only by leading/trailing or
       internal whitespace or letter-case **binds** that condition → it resolves `unmet` (or its true
       severity-derived status), never a silent `met`. A new test proves it.
    2. The criterion-10 test asserts an intent-absent prompt contains a **known stable pre-intent
       substring**, not only that `intent:null ≡ intent-absent`.
    3. The structure-test ordering check binds `## Commander's Intent` / `## Build order` to their
       **plan-template** occurrences, robust to a stray earlier heading of the same text.
    4. F4 is left untouched (already pinned by the `check_f` verbatim guard) and recorded here as
       accepted-no-change; no code references it.
    5. Full `node --test` + every `*.test.sh` green; version bumped +0.0.1 across `.claude-plugin/plugin.json` +
       `.claude-plugin/marketplace.json` (×2 slots) + README `## Status`.

## Build order (for /war)
1. **Phase 1 — endState binding + structure-test robustness** (Task 1 ∥ Task 2, file-disjoint, no deps)
2. **Phase 2 — release** (patch bump +0.0.1; trailing, lands last)

---

## Phase 1 — endState binding + structure-test robustness

Two tasks, disjoint file sets, dispatched in one wave. Each reaches a green gate independently
(`node --test` runs `.test.mjs`; the self-discovering bash-suite loop runs every `*.test.sh`).

### Task 1: normalize endState `plan_ref` binding (F1) + fold criterion-10 proxy assertion (F2)
  - **Files:**
    - `skills/war/assets/workflow-template.js`
    - `skills/war/assets/workflow-template.test.mjs`
  - **Plan slice:**
    - **F1 (`workflow-template.js`):** in the handoff-assembly `endState: endStateClaims.map(condition => …)`
      block, the relevance filter is currently `const rel = gateFindings.filter(f => f && f.plan_ref === condition)`
      — an exact string match. Introduce a one-line normalizer (`s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase()`)
      and compare both sides normalized, so a `plan_ref` that differs from the condition only by
      whitespace or letter-case still binds. Leave the `!gateAuditRan ⇒ 'deferred'` guard and the
      severity→status derivation (`unmet` / `out-of-scope` / `deferred` / `met`) exactly as-is — the
      only change is *which findings match a condition*. **Do not** adopt the issue's alternative
      "default-to-`deferred`" — it would make every clean condition `deferred` and destroy the
      meaning of `met` (see Notes).
    - **F2 (`workflow-template.test.mjs`):** in the criterion-10 test
      (`test('intent absent (criterion 10): …')`), which today only proves the intent-absent and
      `intent:null` dispatch sequences are byte-identical, add one assertion that at least one
      intent-absent prompt contains a **known stable pre-intent substring** (e.g. the worker's
      `Work in the ALREADY-PROVISIONED worktree` phrase) — proving absence ≡ the real pre-change
      bytes, not merely `null ≡ absent`. Pick a substring that exists independently of intent
      threading so the assertion cannot pass vacuously.
    - **F1 test:** add an endState case alongside the existing HARD/SOFT cases — a gate finding whose
      `plan_ref` is the claimed condition with drifted whitespace/case (e.g. `\`  \${ES_CONDS[0].toUpperCase()}  \``)
      and Critical severity — asserting the handoff marks that condition `unmet` (it binds despite the
      drift). Guard against the vacuous inverse: also assert a genuinely non-matching `plan_ref` does
      **not** bind (the condition stays `met`), so the normalizer is proven to bind near-misses only,
      not everything.
  - **requiresTest:** true
  - **deps:** []
  - **target repo:** superproject

### Task 2: bind structure-test ordering grep to the plan-template occurrence (F3)
  - **Files:**
    - `skills/war-strategy/war-strategy-structure.test.sh`
  - **Plan slice:** in the `# Commander's Intent sits BEFORE ## Build order` ordering check, the two
    locators (`ci="$(grep -nF "## Commander's Intent" … | head -n 1 …)"` and the `bo=` twin) grep the
    **bare** heading text and take the first hit — fence-blind, so a future prose occurrence of
    `## Commander's Intent` ahead of the template would misbind. Anchor each `grep -nF` to the
    **verbatim template line** already pinned by the `check_f` guard just above (the arrow-bearing
    `## Commander's Intent              ← operator-authored…` and `## Build order (for /war)` lines) so
    the locator can only match the plan-template occurrence. Keep `head -n 1`/`cut` and the
    `ci < bo` comparison as-is; the check must still emit its `ok - Commander's Intent precedes
    ## Build order` line and the file must still `exit $fails`.
  - **requiresTest:** true — the deliverable is a hardening of an existing test; verification is that
    `war-strategy-structure.test.sh` (self-discovered by the gate's bash-suite loop) still passes,
    now robustly. The diff touches a `**/*.test.sh` path, satisfying the worker test-floor guard.
  - **deps:** []
  - **target repo:** superproject

---

## Phase 2 — release

### Task 1: patch bump +0.0.1
  - **Files:**
    - `.claude-plugin/plugin.json`
    - `.claude-plugin/marketplace.json` (two `"version"` slots)
    - `README.md` (the `## Status` replace-in-place line)
  - **Plan slice:** read the current version literal on the integration tip and increment the **patch
    by +0.0.1** (do **not** hardcode a target — at authoring time the tip reads `0.11.0`, so the bump
    is `→ 0.11.1`, but the authority is the tip at land time, not this literal). Update every version
    slot: `.claude-plugin/plugin.json`, both `.claude-plugin/marketplace.json` slots, and replace the `## Status`
    line in `README.md` (it is a replace-in-place slot — one-line summary of this change, not an
    append). No badge slot exists.
  - **requiresTest:** false (version-slot edit; no behavior)
  - **deps:** []
  - **target repo:** superproject

---

## Notes / conscious deviations   (ratify in /red-team)
- **F4 is a deliberate no-change.** The ordering check's document-order dependency is already made
  load-bearing-correct by the `check_f` verbatim guard on the exact Commander's-Intent template line.
  Reworking it would be redundant. No file references it; recorded here for the record only.
- **Rejected the issue's "default-to-`deferred`" alternative for F1.** `met` is meaningful precisely
  because it means *"gate-audit ran and raised nothing against this condition."* Defaulting an
  unmatched condition to `deferred` would collapse every clean condition to `deferred`. Normalized
  compare is the correct fix: it widens *binding* (catches near-miss `plan_ref`s) without touching
  the `met` semantics.
- **The normalizer is whitespace + case only.** Beyond that (paraphrase, reordered words) the binding
  still relies on the auditor's VERBATIM prompt directive — that reliance is out of scope and is the
  known env-gap pattern flagged in memory `handoff-endstate-met-default-hinges-on-verbatim-planref-match`.
  This plan narrows the gap; it does not claim to close it.
- **Release version literal lags the operator target by design** — the +0.0.1 bump is relative to the
  tip at land time, not the `0.11.1` implied here.

## Open decisions   (resolved by /red-team)
- None open. Scope (F1+F3, fold F2, note F4), the default-to-`deferred` rejection, and the +0.0.1
  release are all operator-confirmed. /red-team ratifies before execution.
