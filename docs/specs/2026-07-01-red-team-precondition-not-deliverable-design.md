# `/red-team` verifies preconditions, not already-applied-ness: stop probes filing a plan's own deliverable as "missing"

**Status:** proposed — targets **v0.8.9** (red-team correctness — recurring false signal). **Severity: MEDIUM.**
**Source:** issue #311. Memory: [[redteam-claims-vs-reality-misfires-on-impl-plans]], [[redteam-adjudication-is-authoritative-version-source]], [[pass-probe-demotion-gate-layer-without-probe-contract]], [[new-status-tests-bypass-coverage-wiring-by-design]], [[plan-line-number-refs-stale-use-construct-locator]].
Group: standalone (behavioral spec). Files disjoint from every other pending plan except the shared version slots; lands serially (landOrder 9).

## Problem

`/red-team` exists to verify a plan **can be executed against the current repo** — that its *preconditions* hold: the anchor / insertion-point text each edit attaches to exists, the assumed files / symbols / signatures are present, and the edits would apply and compose. Instead, analyzed probes repeatedly report that the plan's **proposed changes are not present** and file each absence as a finding. Of course they aren't present — the plan hasn't run yet. A plan's new code, new tests, comment edits, and version bumps are its **deliverable**; their absence is the *expected* pre-execution baseline, **never a defect**. Flagging them is backwards from the skill's purpose.

**Two probe surfaces produce the misfire** (both say "before" but nothing tells the agent the plan's *proposed* edits are expected-absent):

1. The spine **`claims-vs-reality`** prompt ([`workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js) `SPINE[0]`): *"For every CONCRETE claim … (a file/symbol exists, a signature, a cited line number, a 'before' snippet), check it against the LIVE repo. Report each false claim."* — grades not-yet-built tasks Critical, forcing a Lead "not yet implemented" adjudication every run.
2. The bespoke **`snippet-fidelity`** lens ([`lenses.md`](../../skills/red-team/references/lenses.md) catalog row): *"Confirm each 'before' snippet appears VERBATIM in the live file."* — enumerates the plan's proposed edits as "not inserted / not present."

**Observed** (real run, `2026-06-30-land-advance-origin-propagation` v0.8.0): `snippet-fidelity` returned `status:"fail"` with 6 findings, every one of the form "the plan's proposed change isn't applied yet" — including *"Step-3 land-advance call is bare, not cwd-pinned"* (**literally the current state the plan exists to fix**) and *"version remains v0.8.0; should be v0.8.1"* (the plan's own release deliverable).

**Secondary root cause — the gate silently swallows malformed findings.** All 6 used a non-FINDINGS shape (`{file, line, summary, failure_scenario, evidence}`, **no `severity`**). In [`red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs), `classify()` buckets are `blockers = fs.filter(f => BLOCKER_SEVERITIES.includes(f.severity) && f.probeStatus !== 'pass')`, `minors = severity==='Minor'`, `needsDecision = f.needsDecision===true`. A finding with **no `severity`** matches **none** of them → invisible. "Lucky" here, but it masks signal both ways: a genuinely-missing **precondition** reported in that same shape would also vanish.

**Relationship to #50** (closed): #50 fixed the *opposite* misfire — probes filing *confirmations of correct claims* as blockers, addressed by the status-aware gate (`probeStatus !== 'pass'` demotes) + the "a finding is a DEFECT" contract. This issue is the **inverse**: probes asserting a *defect* for a change the plan hasn't made yet. The "defect only" contract doesn't catch it, because "X is missing" *is* a defect — just not one relative to a plan that proposes to add X. The fix here must **not** re-open #50 (pass-status findings must stay demoted, never block — [[pass-probe-demotion-gate-layer-without-probe-contract]]).

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | Fix scope | **Probe-side (root cause) + gate backstop.** Probe-side stops the false findings being generated; the backstop stops malformed *precondition* failures from vanishing. | Probe-side only (leaves the secondary silent-drop — a malformed real precondition-failure is still lost). |
| D2 | Probe-side placement | **A shared "precondition semantics" instruction layer**, prepended (alongside `scopeLock`) to **every analyzed probe** — so spine `claims-vs-reality`, `consistency-placeholders`, `coverage-vs-source`, **and any bespoke analyzed probe the Lead composes** all inherit it. Reinforce the `snippet-fidelity` row + the "before/after edit snippet" guidance in `lenses.md`, and the FINDINGS finding-shape description. | Patch only the two named probes (`claims-vs-reality` prompt + `snippet-fidelity` row) — a future bespoke analyzed probe re-introduces the same false positive because it never sees the rule (issue's literal suggestion; too narrow). |
| D3 | Rule content (narrow, must not blunt red-team) | Verify **preconditions** hold: the anchor / insertion-point text each edit attaches to, assumed-existing files / symbols / signatures, and that the edits would apply and compose. The plan's **proposed new code, new tests, comment edits, and version bumps are its deliverable — EXPECTED absent from the current repo; NEVER report their absence.** Only a missing or changed **anchor / precondition** is a defect. **Explicitly preserved as real findings:** a missing/renamed anchor, a false claim about *existing* code, a wrong signature, cited-line drift, an internal plan contradiction, edits that would not compose. | A blunt "ignore the plan's proposed changes" wording — over-corrects into rubber-stamping (a red-team that verifies nothing). The rule is a **narrow carve-out** for the plan's *own output*, not a licence to skip claim-checking. |
| D4 | Gate backstop shape | A finding with **no / invalid `severity`** is no longer dropped: on a **non-pass** probe → route to **`needsDecision`** (verdict BLOCKED; the Lead adjudicates the malformed finding). On a **pass**-status probe → demoted / informational, **never blocks** (preserves the #50 invariant). | Coerce to `Minor` (a malformed real precondition-failure gets quietly Minor-ranked, no decision forced); mark the whole run INCOMPLETE (conflates "malformed finding" with "probe didn't run"; forces a re-run even when a human can read the finding). |
| D5 | Malformed-finding dedup | Route to `needsDecision` **before** the `planRef|severity|claim` dedup, or widen the dedup key with a `file\|line\|summary` fallback — so multiple severity-less findings don't collapse into one entry (all-undefined key = `"\|\|"`). | Leave dedup as-is (N malformed findings dedup to a single surfaced entry — undercounts the signal the backstop exists to surface). |

### Mechanics

**Probe-side ([`workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js)).** Add a shared layer, applied to analyzed probes (mirrors the `scopeLock(technique)` pattern; not needed for `executed` probes, which run the plan's artifacts in a sandbox rather than checking presence):

```
PRECONDITION vs DELIVERABLE — a plan PROPOSES changes; it has not run.
Verify only that its PRECONDITIONS hold against the live repo:
  • the anchor / insertion-point text each edit attaches to EXISTS (verbatim);
  • assumed-existing files, symbols, and signatures are present;
  • the described edits would apply and compose.
The plan's PROPOSED new code, new tests, comment edits, and version bumps are its
DELIVERABLE — they are EXPECTED to be absent from the current repo. NEVER report
their absence as a finding. Only a missing or changed ANCHOR / PRECONDITION —
something an edit needs in order to land — is a defect. A false claim about
EXISTING code, a wrong signature, a drifted line number, or an internal
contradiction remains a real finding.
```

Reinforce in [`lenses.md`](../../skills/red-team/references/lenses.md): reword the `snippet-fidelity` row to "confirm each **anchor/'before'** snippet (the text an edit attaches to) appears verbatim; the plan's proposed **after**-state is expected absent — never report it," and split the finding-shape guidance into **precondition-missing (real finding)** vs **after-state-not-yet-present (never a finding)**.

**Gate-side ([`red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs)).** In `classify()`, before bucketing, treat a finding whose `severity` is absent or not one of the known severities as malformed: if `probeStatus !== 'pass'`, set `needsDecision = true` (so it lands in the existing `needsDecision` bucket → BLOCKED); if `probeStatus === 'pass'`, drop it to informational/minor (never a blocker). Ensure the dedup key tolerates missing `severity`/`claim` (D5).

## Affected files

| File | Change |
|------|--------|
| [`skills/red-team/assets/workflow-scaffold.js`](../../skills/red-team/assets/workflow-scaffold.js) | D2/D3: shared precondition-semantics layer prepended to every analyzed probe; optional one-line reinforcement in the FINDINGS schema `findings` description. |
| [`skills/red-team/references/lenses.md`](../../skills/red-team/references/lenses.md) | D3: reword the `snippet-fidelity` row + the "before/after edit snippet" guidance; split finding-shape guidance (precondition-missing vs after-state-absent). |
| [`skills/red-team/assets/red-team-gate.mjs`](../../skills/red-team/assets/red-team-gate.mjs) | D4/D5: route no/invalid-severity findings (non-pass → `needsDecision`; pass → demoted); dedup-key tolerance for malformed findings. |
| [`skills/red-team/assets/workflow-scaffold.test.mjs`](../../skills/red-team/assets/workflow-scaffold.test.mjs) | Assert every analyzed probe's composed prompt contains the precondition rule (anchor by a stable token, e.g. `PRECONDITION vs DELIVERABLE`); assert `executed` probes are unaffected. |
| [`skills/red-team/assets/red-team-gate.test.mjs`](../../skills/red-team/assets/red-team-gate.test.mjs) | New cases: severity-less finding on a `fail` probe → `needsDecision`/BLOCKED; severity-less finding on a `pass` probe → not a blocker (#50 preserved); two severity-less findings do not dedup to one. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **0.8.9** (four canonical slots, replace-in-place). |

## Alternatives considered

- **Probe-side only.** Rejected — D1; leaves malformed real precondition-failures silently dropped (the secondary root cause).
- **Gate-side only (classify absence-findings as non-blocking).** Rejected — treats the symptom at the gate while probes keep burning effort generating false findings; doesn't fix the `claims-vs-reality` Critical variant that forces Lead adjudication.
- **Blunt "ignore proposed changes" wording.** Rejected — D3; over-corrects into a red-team that rubber-stamps. The carve-out is narrow (the plan's *own output* only).
- **Auto-block malformed findings as Critical.** Rejected — re-opens #50 (spurious blocks) and punishes probes for a shape error.

## Validation criteria

1. **(#311 — rule reaches every analyzed probe)** `workflow-scaffold.test.mjs` asserts the composed prompt for **each** analyzed probe (spine `claims-vs-reality`, `consistency-placeholders`, `coverage-vs-source`, and a representative bespoke analyzed probe) contains the precondition-vs-deliverable rule token; the `executed` spine probe's prompt is unchanged. Removing the shared layer fails these.
2. **(#311 — narrow, not blunting)** The rule text explicitly retains "a false claim about EXISTING code / wrong signature / drifted line / contradiction is a real finding" — asserted present, so the carve-out can't be read as "skip claim-checking."
3. **(#311 — gate backstop)** `red-team-gate.test.mjs`: a finding with no `severity` on a `status:"fail"` probe lands in `needsDecision` and the verdict is `BLOCKED`; the same on a `status:"pass"` probe is **not** a blocker (verdict unaffected by it). Two distinct severity-less findings surface as two `needsDecision` entries, not one.
4. **(#311 — regression: the observed misfire no longer blocks)** A synthetic probe result mirroring the 6 observed "proposed-change-absent" findings, when the probe is analyzed and `status:"fail"`, does not by itself yield spurious blockers attributable to deliverable-absence (the probe would not have generated them under the new rule; the gate test pins the malformed-shape handling).
5. **(gate)** Full suite green at the release commit: `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner self-discovered by `find` (run all post-merge — [[gate-under-covers-after-cross-branch-merge-new-runner]]).

## Open risks / non-goals

- **Non-goal: the executed-probe path.** `executable-proof` runs the plan's shipped artifacts in a sandbox; it does not check repo-presence, so the rule targets analyzed probes only. Documented so a future reader doesn't "fix" the executed path too.
- **Risk: over-correction (the fix's own failure mode).** Mitigated by D3's explicit retained-findings clause + validation #2. If red-team starts missing real anchor/precondition defects, the wording — not the mechanism — is at fault; sharpen the carve-out, don't widen it.
- **Non-goal: changing `probeStatus` demotion (#50).** The backstop respects it (pass → never blocks). This spec must not reopen #50.
- **Version literal not authoritative** — resolve to the next free patch off the actual landed baseline at land time ([[stacked-release-plan-version-literal-lags-operator-target]], [[redteam-adjudication-is-authoritative-version-source]]).

## Coverage

| Issue | Decisions | Validation |
|-------|-----------|------------|
| #311  | D1, D2, D3, D4, D5 | 1, 2, 3, 4 (gate: 5) |
