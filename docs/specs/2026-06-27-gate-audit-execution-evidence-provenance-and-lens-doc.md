# Gate-audit execution-evidence: sha provenance + lens documentation — Design

**Status:** proposed — targets **v0.7.1**. **Severity: Major.**
**Source:** #193 (Major, behavioral — gate-HEAD-sha provenance), #117 (Nit, doc-only — execution-evidence lens). Audit origin: stale-tip audit-worktree false-negative (memory `audit-worktree-pre-impl-tip-stale-verdict`, #193's exact fingerprint).

## Problem — a stale gate_output can raise a land-HALTING false-negative because the gate-audit auditor has no gate-HEAD-sha to confirm the gate ran at the integration tip

The post-merge gate-audit pass ([workflow-template.js, the `if (mergedTasksForGateAudit.length > 0)` block](../../skills/war/assets/workflow-template.js)) is a **text-only** review of `mr.gate_output`. At the merge-success capture ([`mergedTasksForGateAudit.push`](../../skills/war/assets/workflow-template.js)) it records `{ taskId, gateOutput: mr.gate_output, acceptanceCriteria: r.task.planSlice }` — **no sha**. The dispatched gate-audit prompt hands the auditor `Executed gate output:\n${gateOutput}` with no way to confirm *gate-ran-at == integration tip*. The keying logic ([`isHardGateEvidence = findings.some(f => f.severity === 'Critical' || f.severity === 'Major')`](../../skills/war/assets/workflow-template.js)) then pushes `{ reason: 'gate-evidence' }` to `escalated`; `'gate-evidence'` is in the [`HARD_ESCALATION_REASONS` array literal](../../skills/war/assets/workflow-template.js) (shares the `gate-evidence` membership with `land-decision.mjs:8`, though the template array intentionally diverges by also carrying `unrunnable-deps`) → `held:escalation`.

So a gate output captured at a stale / pre-rebase tip (a mapped runner added by the task commit is reported as *unrun* because the auditor's evidence predates that commit) becomes a **false land-halt** — the recurring `audit-worktree-pre-impl-tip-stale-verdict` fingerprint, now reachable through the very `isHardGateEvidence` severity-keying mechanism above. `MergeResult` already computes [`integration_sha`](../../skills/war/assets/workflow-template.js) (the post-rebase tip the gate ran at — the gate runs "after the rebase in the task worktree") but it is **dropped** at the capture and never shown to the auditor.

Separately, the auditor's own standing instruction file ([war-auditor.md `## Review through your lens`](../../agents/war-auditor.md)) enumerates only `correctness` / `cascading-impact` / `plan-faithfulness` / `domain` — **no execution-evidence entry**, and no mention that gate-evidence escalation keys on finding **severity** not the seat verdict. The seat that runs the lens does not document it.

## Decisions

- **D1 — Ride the existing `integration_sha`; do NOT invent a `gate_head_sha` schema field.** `MergeResult.integration_sha` is the post-rebase tip the gate ran at. The sha rides through the existing optional field into the prompt + auditLog. No `MERGE_RESULT`/`AUDIT_VERDICT` schema change (ponytail: a new field is speculative — the Lead reads the sha from the prompt/auditLog, no consumer needs it structurally).
- **D2 — Defuse, don't disarm.** The new directive downgrades a finding from HARD to SOFT **only** when the auditor *cannot confirm the gate output corresponds to the current integration tip*. The provably-unrun-at-the-correct-sha path stays HARD. This relaxes a gate; the condition is kept strict so a true-positive unrun-test cannot silently slip to SOFT.
- **D3 — The refiner must populate `integration_sha`.** The merge-task prompt today only asks for `gate_output`; `integration_sha` is in the schema but never instructed, so it may arrive empty. Step (c) is **load-bearing**, not cosmetic — without it the threaded sha is `undefined` and the directive is a no-op.
- **D4 — Sequential tasks, one spec.** Task 1 (code+prompt+schema-doc) lands first; Task 2 (doc-only) mirrors the **final** wording so war-auditor.md includes the stale-tip false-positive warning #193 introduces. Both co-edit the same gate-audit prompt string / L321 capture — planning them apart would double-edit one construct and risk a prompt-merge collision.
- **D5 — `gate-evidence` hardness is unchanged.** The fix does not touch the `HARD_ESCALATION_REASONS` membership; `gate-evidence` stays hard. So **no** drift against `land-decision.mjs:8` or its per-member membership assertions in `land-decision.test.mjs` (`assert.ok(HARD_ESCALATION_REASONS.includes('gate-evidence'))` and siblings — there is no `deepEqual` guard, and the template array deliberately diverges by carrying the extra `unrunnable-deps` member). (Noted because any reviewer who *does* touch that list must touch both files.)
- **D6 — Pin the gate-audit seat to the integration tip (operator-ratified 2026-06-27).** The gate-audit seat is **PINNED** to the integration tip: point it at the existing `_refinery` worktree (already checked out on `ph.integrationBranch` at the integration tip after the serial merge queue), confirm `git -C <refineryPath> rev-parse HEAD == gateHeadSha`, then read the mapped test **present at that tip**. A HARD finding is raised **only** when the test is genuinely absent at the confirmed tip; a SOFT note when the pin cannot be confirmed. This reuses the existing `_refinery` worktree and the seat's existing read-only git (**no new worktree, no tool/allowlist change**) and reuses `AUDIT_VERDICT.audit_sha` for the seat's reviewed sha (**no new field**). This fully closes #193 — the worktree-pin is **in-scope**, not deferred.

## Solution shape

**Task 1 — code + prompt + one schema-doc line (#193).** Three small edits in `workflow-template.js`, all additive (read an already-computed optional field, pass it into an existing prompt string), plus one line in `schemas.md`:

- **(a)** at the `mergedTasksForGateAudit.push` capture, add `gateHeadSha: mr.integration_sha ?? '(integration_sha unrecorded)'` — a literal sentinel, not `mr.working_sha`. `working_sha` is **land-only** (set only on the land-phase `MergeResult`, never on a merge-task result this capture reads), so that fallback is a dead branch; the sentinel keeps the directive's "cannot confirm" branch reading cleanly (never the literal `undefined`).
- **(b)** in the gate-audit prompt, include the gate-HEAD sha **and** add a defusing directive: *"if you cannot confirm the gate output corresponds to the current integration tip (gate-HEAD sha vs the phase integration tip), record a SOFT note, never a HARD finding"* — strictly conditioned on "cannot confirm sha == integration tip" (D2). (The worktree-pin that makes "cannot confirm" *mechanical* — rewriting the prompt from text-only into a pinned read-only auditor — is **Task 2** below.)
- **(c)** in the merge-task dispatch prompt (the "populate gate_output" clause), instruct the refiner to **also** populate `integration_sha` with the rebased tip the gate ran against.
- **(d)** one line in `schemas.md` MergeResult naming `integration_sha` as the gate-HEAD provenance the gate-audit pass uses.

**Task 2 — gate-audit worktree-pin (#193, depends on Task 1).** Rewrite the gate-audit prompt from text-only ("you cannot run commands") into a **pinned read-only auditor** (D6): reconstruct the `_refinery` integration-tip path at the gate-audit pass, instruct the seat to confirm `git -C <refineryPath> rev-parse HEAD == gateHeadSha`, then read the mapped acceptance-criteria test **present at that confirmed tip** (read-only git in `_refinery`) — a HARD finding only when the test is genuinely absent at the confirmed tip, a SOFT note when the pin cannot be confirmed. Builds on Task 1's threaded `gateHeadSha`; carries the behavioral tests listed below.

**Task 3 — doc-only (#117, depends on Tasks 1–2).** Add **one bullet** to war-auditor.md under `## Review through your lens`, using the literal term `execution-evidence` (greppable-consistent with the template prompt label + the Tasks 1–2 tests). It mirrors the **final** mechanism (sha provenance + the worktree-pin + the stale-tip SOFT-downgrade). The bullet states: the post-merge gate-audit pass runs this lens over the refiner's executed `gate_output`; findings are **SOFT by default** and do **not** hold the land; a finding is **HARD only** when a mapped acceptance-criteria test is provably unrun (present in the pre-merge diff but absent/0-count in the gate output), recorded at **Critical/Major** severity; escalation keys on finding **SEVERITY, not the seat verdict** — so a finding-less `escalate` is intentionally SOFT (resolves #117 Open decision #1). Fold in **one clause** warning that a stale `gate_output` (gate-HEAD sha != integration tip) is downgraded to SOFT (closing the operator-protocol gap Task 1 introduces). ~2–5 lines of markdown; do **not** restructure the lens section or add a new top-level heading.

## Affected files

- [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) — **Tasks 1–2.** Edit (a) the `mergedTasksForGateAudit.push` capture (add `gateHeadSha`, Task 1); (b) the gate-audit prompt (`POST-MERGE GATE-AUDIT … lens: execution-evidence`) — inject sha + defusing directive (Task 1) **and rewrite the prompt from text-only into the pinned read-only auditor (worktree-pin, D6 — Task 2): reconstruct the `_refinery` integration-tip path, confirm `rev-parse HEAD == gateHeadSha`, read the mapped test at that tip**; (c) the merge-task `agent()` prompt's "populate gate_output" clause — also populate `integration_sha` (Task 1). The `parallel(...)` destructure `{ taskId, gateOutput, acceptanceCriteria }` must also pull `gateHeadSha`. **No** change to `isHardGateEvidence` or `HARD_ESCALATION_REASONS`.
- [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — **Task 1.** One line under the MergeResult section: `integration_sha` is the gate-HEAD provenance the gate-audit pass reads to confirm the gate ran at the integration tip.
- [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) — **Tasks 1–2.** New assertions beside the existing `Task 4 — post-merge gate-audit` tests: the sha-threading tests (Task 1) plus the worktree-pin behavioral tests (Task 2: pinned-path interpolation, `rev-parse HEAD`-confirm instruction, "you cannot run commands" removed, read-at-tip instruction, hardness/soft preserved).
- [`agents/war-auditor.md`](../../agents/war-auditor.md) — **Task 3 only.** One bullet under `## Review through your lens`.
- Version slots (all four): [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`; [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`; [`README.md`](../../README.md) `## Status` (replace-in-place the `0.7.0` block, "Builds on v0.7.0"). No badge.

## Test plan

TDD slices. Repo gate is the self-discovering multi-runner (F12 lesson) — quote the node glob (bash 3.2 under-covers unquoted) PLUS every `*.test.sh` runner discovered by `find`:

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

**Task 1** (new tests in `workflow-template.test.mjs`, auto-discovered, beside `Task 4 — post-merge gate-audit` at the `runPhase`/`PROVISION_ARGS` + `seatOf`/`impl` harness):

1. **RED → GREEN — sha threading.** Stub the merge `MergeResult` with a **unique** `integration_sha` token (e.g. `'sha-abc123unique'`); capture the gate-audit prompt for that task; assert the prompt **contains that exact token**. Assert on the unique sha, NOT pre-existing content (memory `weak-test-assertion-passes-without-feature-being-exercised`). Fails today (sha is dropped at capture).
2. **RED → GREEN — defusing directive present.** Assert the gate-audit prompt contains the SOFT-on-sha-mismatch instruction string (a unique substring of the new directive). Fails today (no such directive).
3. **Regression — sentinel on absent sha.** When `integration_sha` is absent, assert the prompt carries the sentinel `(integration_sha unrecorded)` (never the literal `undefined`) — covers the `mr.integration_sha ?? '(integration_sha unrecorded)'` path.
4. **Unchanged — hardness preserved.** The existing `Task 4 — post-merge gate-audit HARD case` tests (Critical/Major → `held:escalation`) and the SOFT-default test must stay green; the fix does not change `gate-evidence` hardness.

**Task 2 — worktree-pin (behavioral, D6).** The pin is a behavioral feature and carries tests in `workflow-template.test.mjs` beside Task 1's: pinned-`_refinery`-path interpolation, the `rev-parse HEAD`-confirm instruction, "you cannot run commands" removed from the prompt, the read-the-mapped-test-at-the-confirmed-tip instruction, and hardness/soft preserved (HARD at the confirmed tip, SOFT when the pin cannot be confirmed).

**Task 3 — #117 lens-doc (doc-only)** — pure markdown with no executable surface; **no behavioral test warranted** (ponytail: YAGNI on tests; markdown prose has no runnable surface). This is the **only** doc-only no-test task. The full gate is the regression guard — none of the `*.test.sh` runners read `war-auditor.md`, so the edit cannot break them.

**Membership watch (no action expected):** `HARD_ESCALATION_REASONS` (template) vs `land-decision.mjs:8` + the per-member `.includes()` assertions in `land-decision.test.mjs` (no `deepEqual` guard; the template array deliberately carries an extra `unrunnable-deps` member) — this fix does NOT change `gate-evidence` hardness, so no drift. Flagged only so a reviewer touching that list knows to touch both.

## Alternatives considered

- **Add a first-class `gate_head_sha` field to `AUDIT_VERDICT`/`MERGE_RESULT`.** Rejected (D1) — the sha already exists as `integration_sha`; a new field is speculative surface with a schema-mirror cost. Ride the existing optional field.
- **Pin the gate-audit seat's worktree to the phase integration tip** (the issue's secondary "consider also" suggestion). **In-scope** (D6, operator-ratified 2026-06-27) — a *second mechanism* (a worktree that re-reads files at a sha) that makes "cannot confirm" mechanical. It reuses the existing `_refinery` worktree and the seat's existing read-only git, so it carries no new worktree and no tool/allowlist change. The sha-record alone would let the auditor/Lead *see* the mismatch; the pin closes the false-negative at the source.
- **Fix only the prompt without instructing the refiner to populate `integration_sha`.** Rejected (D3) — the field arrives empty in practice (the merge-task prompt never asks for it), so the directive would be a silent no-op.

## Out of scope / Deferred

- **No change to `isHardGateEvidence`, `HARD_ESCALATION_REASONS`, `land-decision.mjs`, or the land-decision membership assertions.** `gate-evidence` stays hard.
- **No new schema field** (`AUDIT_VERDICT` / `MERGE_RESULT` unchanged beyond the schemas.md doc line).
- **Cross-spec note:** `workflow-template.js` is also touched by G2. The G1 (#193) and G2 (#184) edits are **adjacent lines in one template literal** (the `merge:${r.task.id}` `agent()` call) — **NOT disjoint regions**: G1 step (c) appends an `integration_sha` instruction to the "populate `gate_output`" sentence, while G2 appends a TMPDIR clause to the adjacent gate-RUN sentence in the same literal. So **serial landing G1→G2 is mandatory** and the later (G2) worker **re-anchors by named construct** (the `merge:${r.task.id}` agent call + the specific sentence) because G1 will have shifted lines and added an adjacent clause. This spec also lands serially within itself (Task 2 depends on Task 1). The two specs **stack**: this spec (G1) owns the `0.7.1` version slot; G2 (`dispatched-gate-run-tmpdir-pin-parity`) lands **after** it and bumps to `0.7.2` building on v0.7.1. Each Release task replaces the four canonical version slots in place, so G1 then G2 must land in order — not concurrently.

## Coverage

| Issue | Coverage |
|---|---|
| #193 | **full** — sha provenance threaded via `integration_sha` (prompt + auditLog) **AND** the gate-audit seat pinned to the `_refinery` integration tip (confirm `rev-parse HEAD == gateHeadSha`, read the mapped test at the confirmed tip) **AND** the stale-tip SOFT-downgrade + defusing directive + refiner populates the field + schemas.md doc line. **No deferral** — the worktree-pin is implemented. |
| #117 | full — execution-evidence lens bullet added to war-auditor.md, documenting the severity-keyed hard/soft coupling + the stale-tip SOFT-downgrade clause. |
