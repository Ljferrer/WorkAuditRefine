# Red-team report — 2026-07-22-servitor-wrapup-landed-tip

**Verdict: CLEARED-WITH-NOTES** (first round, no plan patches required)

- **Plan:** `docs/plans/2026-07-22-servitor-wrapup-landed-tip.md`
- **Source spec:** `docs/specs/2026-07-22-servitor-wrapup-landed-tip-design.md`
- **artifactKind:** impl-plan
- **Baseline:** plan-3 base tip `94ace10` (stacked on audit-adjudication-threading v0.14.50), read-only worktree
- **Run:** `wf_0333c39f-640` — analyzed probes on `Explore`; model opus / effort high

## Attack surface

12 probes (6 spine + 6 bespoke); 3 executed, 9 analyzed. **12/12 on-target, 12 pass, 0 fail, 0 warn, 0 dropped, 0 off-target.** Escape guard (`assert-no-repo-escape.sh`) exit 0 — no sandbox leakage.

## Executed proof

- **`premise-grep-count`** (executed) — **pass.** `grep -rin 'committed tip'` over `agents/`, `skills/war/assets/`, and `docs/adr/0029-*.md` confirmed exactly the two asserting premise sentences on the prompt surfaces (workflow-template.js FINDING-MATCH CHECK parenthetical; war-servitor.md), the auditor-pin "worker's committed tip" hits as a distinct true fact (correctly left unedited), **and** the ADR 0029 relationship-bullet "already **reflects** the committed tip" straggler that a naive "is the committed tip" grep would miss — the plan's survey-derived straggler claim is real.
- **`default-flip-old-absent`** (executed, mandatory drift-guard) — **pass.** In a throwaway copy (`rt-sb-…`, Node v24.17.0; source never mutated): confirmed no whole-string premise-absence guard exists today; the minimal edit the plan describes (premise inversion on both surfaces + two whole-string `doesNotMatch` guards) goes green; reverting the premise on **one** surface alone turns the suite **red**. The OLD-absent enforcement bites per-surface — the drift the guard exists to catch cannot survive a single-surface regression.
- **`executable-proof`** (spine, executed) — **pass.**

## Analyzed proof (all pass)

- **`hoist-fidelity`** — the `lastPinned`/`tipSha` computation is where the plan says (inside the `landDecision === 'landed' || 'held:escalation'` handoff block); the Wrap-up gate is `if (landResult && landResult.status === 'landed' && memoryLocalRoot)`; the held:escalation path can reach the handoff with `landResult` null — so the plan's "hoist to top level, retain the `landResult &&` guard, never inside the Wrap-up `if`" instruction is correct and load-bearing.
- **`pt-guard-and-schema`** — `MERGE_RESULT.required` does not list `working_sha`; the `pt` tag throws on undefined — the plan's pre-resolve-to-placeholder-before-interpolation requirement is justified.
- **`anchor-token-absence`** — `/gitdir/i` and "not assumed" are absent from both prompt surfaces at base (valid discriminating anchors); `<session-worktree>` is present in war-servitor.md (validates the plan's reused-token warning).
- **`unguarded-new-mirror`** (drift-guard) — **vacuous pass.** The plan adds a D3 both-surfaces registry row, not an inline canonical-export mirror; `land-decision.mjs` and mirrored enum copies stay byte-untouched. No MIRROR_REGISTRY row required.
- Spine `claims-vs-reality`, `coverage-vs-source`, `consistency-placeholders`, `dependency-feasibility` — all pass.

## Backstop-legitimacy (2 AI-declared entries)

Both entries are legitimate: each names a concrete not-fixture-able reason (live-agent ladder obedience; a live degraded land omitting `working_sha`), a runner, and timing (operator at the first post-release `/war` phase land / first live placeholder wrap-up). No cheaper pre-merge proxy covers them — the drift guards prove both surfaces **carry** the directive, not that a live servitor **obeys** it (the ADR 0029 prompt-enforced residual). Each carries the ADR 0014 **AI-declared** marker; noted for operator attention, non-blocking under AFK.

## Residual risk / notes

- **Minor (auto-noted):** the intent block is `## AI-Commander's Intent` (AI-drafted under `/war-machine --afk`, ADR 0014), not operator-confirmed. Well-formed — 10 checkable End-state conditions, each mapped to a task, collectively covering the Purpose — but lacking a human ratification pass. Human upgrade path: `/war-strategy <plan>`. Under the campaign's AFK posture the intent stays AI-declared and its backstops keep their marker.

## Adjudications

The red-team made **no** value changes; it **ratified** the three self-adjudications the plan already records (ADR 0014 unattended pass). Threaded into the `/war` run as `args.adjudications` so audit seats confirm rather than re-litigate:

| # | delta | ruling | route |
|---|-------|--------|-------|
| 1 | Spec §4 describes the hoisted computation as "SHA-shaped `working_sha`"; live code checks `working_sha` truthy-only (the SHA-shape regex applies to the `gateHeadSha` fallback). | Criterion 7 (byte-identical `handoff.tipSha` before/after) wins — the hoist moves the computation verbatim and adds no new validation. Red-team `hoist-fidelity` + `pt-guard-and-schema` confirm the truthy check and the schema-optional `working_sha`. | plan Notes (self-adjudicated); ratified |
| 2 | Task 1.1's `REGISTRY.length` floor is stated in directive form ("current true row count + 1, resolved at the rebased tip"), not a frozen literal. | Directive form binds; the expected sibling-plan state (row count one above today's) is recorded but non-binding — resolve against the rebased integration tip at implementation time. | plan Notes; ratified |
| 3 | The new registry row's exact anchor regexes and the premise-absence guard's negation-exclusion shape are worker latitude. | Latitude within the red-first requirement — each anchor must red on a per-surface revert (proven feasible by `default-flip-old-absent`), and the absence guard must not false-positive on the negated "is NOT assumed" grounding prose. `anchor-token-absence` confirms `/gitdir/i` + "not assumed" are valid discriminating anchors. | plan Open decisions; ratified |
