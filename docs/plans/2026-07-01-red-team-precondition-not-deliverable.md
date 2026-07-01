# `/red-team` verifies preconditions, not already-applied-ness Implementation Plan (issue #311)

**Goal:** stop analyzed probes filing a plan's own proposed deliverable as a "missing" defect, and stop the gate silently dropping severity-less findings. Add a narrow **precondition-vs-deliverable** rule to a shared analyzed-probe preamble in [`workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js) (so spine + bespoke analyzed probes all inherit it), reinforce it in [`lenses.md`](../../skills/red-team/references/lenses.md), and route severity-less findings to `needsDecision` (respecting `probeStatus`) in [`red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs).

**Source spec:** [`docs/specs/2026-07-01-red-team-precondition-not-deliverable-design.md`](../specs/2026-07-01-red-team-precondition-not-deliverable-design.md).
**Roadmap:** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — the **authoritative version source** (this slug = landOrder 9 = **v0.8.9**).
Memory hooks: [[redteam-claims-vs-reality-misfires-on-impl-plans]], [[pass-probe-demotion-gate-layer-without-probe-contract]] (do NOT reopen #50), [[new-status-tests-bypass-coverage-wiring-by-design]], [[redteam-adjudication-is-authoritative-version-source]], [[gate-under-covers-after-cross-branch-merge-new-runner]], [[version-slots-no-cross-slot-consistency-test]] (#release).

**Ratify with `/red-team` before `/war`** — this changes the red-team skill's own probe contract + gate classification. Run `/red-team` on this plan first (self-hosting; expect the analyzed probes to now correctly NOT flag this plan's proposed rule text as "missing").

## Coordination

- **Target version:** **v0.8.9** (roadmap landOrder 9, severity MED). Bumps `0.8.8 → 0.8.9`.
- **Integration base:** the **landed tip of Spec 8 (v0.8.8)**. **Standalone fallback:** off a different tip, re-baseline the release to the next free patch off the live tip and drop the pin — version literal not authoritative ([[stacked-release-plan-version-literal-lags-operator-target]], [[war-branch-base-off-latest-master-not-prior-tip]]). The probe-side + gate-side edits are baseline-independent.
- **File-independence:** all files are under `skills/red-team/*` — an isolated lane disjoint from every other pending spec except the four version slots.
- **Four-slot serial land (replace-in-place, no badge):** `plugin.json` `version`; `marketplace.json` `metadata.version` **and** `plugins[0].version`; `README.md` `## Status`. All four read `0.8.9` after the release task; verify by hand.
- **Commit boundaries:** three tasks, one commit each — T1 probe-side, T2 gate backstop, T3 release. T1 and T2 touch **different files** (scaffold/lenses vs gate), so they are independent audits; land serially.

## Operator decisions — RESOLVED (bake in exactly)

- **Probe-side + gate backstop** (both halves).
- **Rule placement = a shared analyzed-probe preamble** (mirrors the `scopeLock(technique)` pattern), prepended to every **analyzed** probe (spine `claims-vs-reality`, `consistency-placeholders`, `coverage-vs-source`, and bespoke analyzed probes). **NOT** the `executed` probes (they run artifacts in a sandbox, not presence-checks). Reinforce the `snippet-fidelity` row + before/after guidance in `lenses.md`.
- **Rule content is NARROW** — verify preconditions (anchor/insertion-point text exists, assumed files/symbols/signatures present, edits compose); the plan's proposed new code/tests/comment edits/version bumps are its **deliverable**, EXPECTED absent, **NEVER** report their absence. **Explicitly preserved as real findings:** missing/renamed anchor, false claim about *existing* code, wrong signature, drifted line number, internal contradiction, non-composing edits. (Must NOT blunt red-team into rubber-stamping.)
- **Gate backstop:** a finding with **no/invalid `severity`** → on a **non-pass** probe set `needsDecision = true` (verdict BLOCKED); on a **pass** probe demote to informational/minor, **never** a blocker (preserves #50). Widen the dedup key with a `file|line|summary` fallback so multiple severity-less findings don't collapse into one.

---

## Phase 1 — probe-side: the precondition-vs-deliverable rule

### Task 1 — Shared analyzed-probe preamble + `lenses.md` reinforcement (#311, probe-side)

**Files:** [`skills/red-team/assets/workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js) (add the shared layer; anchor by the `scopeLock` construct + the analyzed-probe composition site), [`skills/red-team/references/lenses.md`](../../skills/red-team/references/lenses.md) (`snippet-fidelity` row + before/after guidance), [`skills/red-team/assets/workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs) (assertions).

**`requiresTest`: true** — the scaffold test asserts the rule reaches every analyzed probe.

- [ ] **Step 1 — RED: write the scaffold assertions first.** In `workflow-scaffold.test.mjs`, assert that the composed prompt for **each analyzed probe** (`claims-vs-reality`, `consistency-placeholders`, `coverage-vs-source`, and a representative bespoke analyzed probe) contains a stable rule token (e.g. `PRECONDITION vs DELIVERABLE`), AND that the rule retains the "false claim about EXISTING code / wrong signature / drifted line / contradiction is a real finding" clause, AND that the `executed` spine probe (`executable-proof`) prompt does **not** gain the rule. Run → **RED** (token absent).
- [ ] **Step 2 — GREEN: add the shared analyzed-probe layer.** In `workflow-scaffold.js`, add a `preconditionRule` string (the narrow rule from the spec's Mechanics block) and prepend it to analyzed-technique probes alongside `scopeLock` (guard on `technique === 'analyzed'` so `executed` probes are untouched). Re-run → **GREEN**.
- [ ] **Step 3 — reinforce `lenses.md`.** Reword the `snippet-fidelity` row to "confirm each **anchor/'before'** snippet (the text an edit attaches to) appears verbatim; the plan's proposed **after**-state is expected absent — never report it," and split the finding-shape guidance into precondition-missing (real) vs after-state-not-yet-present (never). (Reference doc; the behavioral assertion is Step 1's scaffold test.)
- [ ] **Step 4 — prove not-blunting (sanity).** Confirm Step 1's "retained real findings" assertion is present and would fail if the rule were reworded to a blunt "ignore proposed changes" (i.e. the clause is load-bearing against over-correction).
- [ ] **Step 5 — full self-discovering gate → green.** Commit — `feat(red-team): teach analyzed probes to verify preconditions, not deliverable-presence (#311)`.
- **Advances #311** (probe-side root cause closed; gate backstop in Task 2).

---

## Phase 2 — gate backstop: surface severity-less findings

### Task 2 — Route no/invalid-severity findings to `needsDecision` (respecting `probeStatus`) (#311, gate-side)

**Files:** [`skills/red-team/assets/red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs) (the `classify()` function + dedup key), [`skills/red-team/assets/red-team-gate.test.mjs`](../../skills/red-team/assets/red-team-gate.test.mjs) (cases). Anchor by the `classify` construct and the `blockers`/`needsDecision`/`minors` filter lines.

**`requiresTest`: true** — the gate test pins the new routing.

- [ ] **Step 1 — RED: write the gate cases first.** In `red-team-gate.test.mjs`, add: (a) a `status:"fail"` probe with one finding lacking `severity` → assert it lands in `needsDecision` and `verdict === 'BLOCKED'`; (b) a `status:"pass"` probe with a severity-less finding → assert it is **not** a blocker and does not force BLOCKED (preserves #50); (c) two distinct severity-less findings on a fail probe → assert **two** `needsDecision` entries (not deduped to one). Run → **RED** (current gate drops severity-less findings from all buckets).
- [ ] **Step 2 — GREEN: add the routing.** In `classify()`, before bucketing, mark a finding whose `severity` is absent or not in the known-severity set as malformed: if `probeStatus !== 'pass'` set `needsDecision = true`; else demote (informational/minor). Widen the dedup key to include a `file|line|summary` fallback when `severity`/`claim` are absent. Re-run → **GREEN**.
- [ ] **Step 3 — confirm #50 preserved (sanity).** A `pass`-status finding WITH a `Critical` severity is still demoted (not a blocker) — the existing `probeStatus !== 'pass'` guard on `blockers` is unchanged; the new routing only adds the severity-less path.
- [ ] **Step 4 — full self-discovering gate → green.** Commit — `fix(red-team): surface severity-less findings as needsDecision (non-pass) instead of silently dropping (#311)`.
- **Closes #311** (both halves: probes no longer file deliverable-absence; malformed real findings no longer vanish).

---

## Phase 3 — Release v0.8.9

### Task 3 — Bump the four canonical version slots + full self-discovering gate green

**Files:** `.claude-plugin/plugin.json`; `.claude-plugin/marketplace.json` (×2); `README.md` `## Status` (REPLACE-in-place, no badge — [[release-bump-slots-canonical-no-badge]]).

**`requiresTest`: false** — version serialization; no executable surface.

- [ ] **Step 1 — Bump all four slots `0.8.8 → 0.8.9`** (or next free patch off the live tip). README `## Status` copy: *`/red-team` verifies preconditions not deliverables — shared analyzed-probe rule + severity-less gate backstop.* Verify all four by hand.
- [ ] **Step 2 — Full self-discovering gate → green.**
- [ ] **Step 3 — Commit** — `chore(release): v0.8.9 — red-team precondition-not-deliverable (#311)`.

---

## Gate

Run the **full** self-discovering gate before **every** commit:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

`workflow-scaffold.test.mjs` and `red-team-gate.test.mjs` are among the `node --test` suites. Run **all** `*.test.sh` post-merge ([[gate-under-covers-after-cross-branch-merge-new-runner]]); the count is self-discovered, never a literal ([[task-prompt-suite-count-stale-after-stacking]]).

## Coverage

| Issue | Task | Kind | Closure |
|---|---|---|---|
| #311 (probe-side) | Task 1 (Phase 1) | shared preamble + lenses | narrow precondition-vs-deliverable rule reaches every analyzed probe; retained-real-findings clause guards against over-correction |
| #311 (gate-side) | Task 2 (Phase 2) | gate backstop | severity-less → `needsDecision` on non-pass, demoted on pass (#50 preserved); dedup tolerant of malformed shape |
| *(release)* | Task 3 (Phase 3) | version bump | four slots `0.8.8 → 0.8.9` (fallback: next free patch off live tip) |

## Deliberate simplifications (ponytail)

- **Two impl tasks, split by file family** (probe-side vs gate-side). They're independent audits touching disjoint files; splitting aids the fix-worker loop and matches the two-root-cause structure of #311.
- **`lenses.md` has no dedicated test** — it's a reference doc the Lead reads; the behavioral guarantee is the scaffold-test assertion (Task 1 Step 1). A grep-test on a prose doc would be brittle for no added safety.
- **The rule targets analyzed probes only** — `executed` probes run artifacts, not presence-checks; adding the rule there is inert. Asserted in Task 1 Step 1 (executed prompt unchanged).
