# `--ace`: opt-in, fail-closed auto-fix of auto-fixable Minor/Nit findings before merge, instead of filing them

**Status:** proposed — targets **v0.8.7** (net-new feature; *not* one of the 16 remediation issues). **Severity: N/A (feature).**
**Source:** operator request (expand `/war` so MINOR/NITs are fixed upfront, not filed). Grounded by a 6-agent map+design+red-team pass (2026-06-30). Memory slugs it depends on: `shared-status-enum-widening-silently-widens-land-path`, `version-slots-no-cross-slot-consistency-test`, `release-bump-slots-canonical-no-badge`, `absence-guard-redundant-filter-is-deliberate-mirror`, `buildseqimpl-harness-for-multi-call-lens-tests`, `new-status-tests-bypass-coverage-wiring-by-design`, `red-team-env-gap-warn-is-agent-directive-not-code-enforced`.

**Name.** The flag is `--ace` — an ace pilot flies a *flawless* run and comes home with a perfect scorecard. `--ace` aims for a clean audit scorecard: WAR fixes the nits it can safely fix in-worktree so the phase lands with as few surviving `war-followup` issues as possible. Crucially, an ace pilot also knows which targets to leave — so `--ace` is **fail-closed**: it fixes only findings an auditor explicitly marked mechanical-and-safe, and consciously *defers* (files) load-bearing or ambiguous ones. A "perfect score" here means "left nothing sloppy unfixed", not "touched everything".

## Problem

Today an auditor finding at severity `Minor`/`Nit` never blocks a merge. It is collected into [`minorsFiled`](../../skills/war/assets/workflow-template.js) (the `minorsFiled.push(...minorsOf(r.seats || []))` line in the serial refine loop) and returned by the Workflow (the `return { phase, landed, escalated, minorsFiled, ... }` lines); the Lead then files each as a `war-followup` GitHub issue at the checkpoint ([schemas.md](../../skills/war/references/schemas.md) `Minor/Nit findings → new follow-up issues labeled war-followup`). By contrast a `Critical`/`Major` finding — [`blockingOf`](../../skills/war/assets/workflow-template.js) — is batched into a `FIX_NEEDED` dispatch to a fresh fix-worker *in the same task worktree*, then **re-audited by the full panel** before merge, bounded by `roundLimit`.

The asymmetry is deliberate but it accretes backlog: this repo carries ~20 open nit issues, and its own roadmap notes "one cohesive sweep beats scattering nits". An operator running a MAX-20x fleet would often rather WAR *fix* the trivially-mechanical nits inline than file them. The feature adds that as an **opt-in** mode — while preserving every safety property the audit loop exists to guarantee.

**Why naive "auto-fix all nits" is unsafe (the constraints this design is shaped by).** A red-team pass surfaced five load-bearing hazards; each is a live pattern in this tracker's history:

1. **Self-approval.** `minorsOf(...)` is read *after* the audit loop already exited on `verdict==='approve'`. A nit-fix applied there is reviewed by nobody — the fixer would grade its own homework. Blocking fixes avoid this because the loop re-runs [`auditRound`](../../skills/war/assets/workflow-template.js) on the next iteration.
2. **SHA invalidation.** A fix commit moves HEAD off the approved `audit_sha`, breaking the [convergent-unanimity](../../skills/war/references/schemas.md) invariant ("if HEAD moves, every seat re-confirms against the new SHA") and the recorded `gateHeadSha`.
3. **No behavior-safety subclass.** `minorsOf` partitions purely on the severity string; nothing distinguishes a comment typo from a load-bearing "nit" (a "dead" regex alternate that isn't; a comment masking a null-deref shield — both real here). Sweeping the raw bucket is unsafe.
4. **The post-merge gate-audit checks *evidence*, not diff correctness** — a behavior-changing nit-fix that keeps the gate green passes it silently.
5. **Provenance loss.** A `war-followup` issue is a durable, queryable record; a silent inline edit is not.

Plus a version-specific hazard: a nit on `README ## Status` "fixed" without the other three canonical slots yields a partial bump that no cross-slot test catches (`version-slots-no-cross-slot-consistency-test`).

## Decisions

| # | Decision | Choice | Rejected alternative |
|---|----------|--------|----------------------|
| D1 | Where the fix happens | **Reuse the existing fix-worker loop, pre-merge.** In the serial refine path, when a task is `approve` with zero blockers and ≥1 *eligible* nit and budget remains, dispatch the same `war-worker`/`FIX_NEEDED` mechanism (same worktree, same `WORKER_RESULT` schema) with the eligible nit list, structured as a **single-attempt** clone of the no-test sub-loop. | A dedicated post-merge nit-sweep on the landed tip — reintroduces hazards #2/#4 (edits an already-approved/landed sha, no panel re-audit). |
| D2 | Which nits are eligible | **Only findings an auditor explicitly flags `autoFixable: true`** — a new optional field on the AuditVerdict finding shape. NEVER the raw `minorsOf` bucket. Absent/false ⇒ file, don't fix (fail-closed). | Key on `severity==='Nit'` (hazard #3) or on presence of `suggested_fix` (free-text prose, not authorization). |
| D3 | Who reviews the fix | **Re-audit through the full panel.** After the ace-fix commit, re-pin `audit_sha` and re-run `auditRound` to convergent unanimity + re-run the gate at the new tip, exactly as the blocking-fix loop does, before merge. | Trust the fixer (hazard #1); carry the pre-fix approval across the fix commit (hazard #2). |
| D4 | Polish must never block a land | **Discard via forward revert.** The ace-fix worker makes **exactly one commit**. If the ace-fix re-audit surfaces any new `Critical/Major`, or does not re-confirm unanimity, prepend one clause to the merge dispatch: `git revert --no-edit <aceSha>` in the task worktree (forward-only, classifier-safe — **never `reset --hard`**, which trips safety classifiers and can't be cleared in an AFK run), then merge the reverted-to-approved tip and file the nits as today. An ace-fix can never turn a mergeable task into a hold or an `escalate`; the revert commit is itself a durable trace. | `reset --hard <approvedSha>` (destructive; safety-classifier-blocked, AFK-unclearable, Sonnet may balk). Escalate on regression (advisory polish would gain the power to halt a phase). |
| D5 | Hard refusals (fail-closed) | **File, never fix, when ANY holds:** the finding's `file` is a version/release slot (`plugin.json`, `marketplace.json`, `README.md` `## Status`); the target line carries a `ponytail:`/deliberate-mirror rationale comment; the finding has no `autoFixable:true`; the task's `fixRounds` budget is exhausted; or the task was a coven split. | A permissive default that auto-fixes everything it can (hits every hazard above). |
| D6 | Preserve provenance | **Durable record — but not a GitHub issue.** An aced nit is recorded by (a) the ace worker's **single commit message** citing each finding's title + rationale, and (b) a new **`aced: [{task, finding, sha}]`** list in the Workflow return, surfaced in the Lead's phase report. Un-aced residual nits still file `war-followup` as today. | `gh issue create`+close for every aced nit (churn, redundant with the landed commit); or empty `minorsFiled` silently (hazard #5). |
| D7 | Surface & isolation | **`run.ace` (boolean, default `false`)** in the run config, plus a `--ace` CLI override on `/war`. **No** new `MERGE_RESULT.status`, **no** `HARD_ESCALATION_REASONS` member, **no** `land-decision.mjs` change — ace is orthogonal soft-polish, recorded as an attribute, not a status. | A `nits-aced` `MERGE_RESULT` status — silently widens the land-side `HARD_ESCALATION_REASONS.includes(...)` reuse (`shared-status-enum-widening-silently-widens-land-path`). |

### Mechanics

**Config ([`war-config.mjs`](../../skills/war/assets/war-config.mjs)).** Add `ace: false` to `DEFAULTS.run` (next to `roundLimit`/`afk`/`provisionAuto`); no `PRESETS` edit (all three inherit `false` via `deepMerge`). Add one line to `validate()` in the `run.*` block, mirroring the `run.afk` check verbatim:

```js
if (typeof c.run.ace !== 'boolean') errors.push('run.ace must be a boolean')
```

**Finding schema ([`schemas.md`](../../skills/war/references/schemas.md), [`agents/war-auditor.md`](../../agents/war-auditor.md)).** Extend the AuditVerdict finding object from
`{ severity, title, file, line?, rationale, suggested_fix?, plan_ref? }` to add optional `autoFixable?: boolean`. The auditor sets it `true` **only** when the fix is mechanical, self-contained, single-file, touches no version/release slot, and removes nothing carrying a `ponytail:`/deliberate-mirror rationale — otherwise omit it. (This is a prompt-layer directive, like the red-team env-gap "warn never red" rule — `red-team-env-gap-warn-is-agent-directive-not-code-enforced` — with a code-side refusal backstop in D5.)

**Orchestrator ([`workflow-template.js`](../../skills/war/assets/workflow-template.js)).** In the serial refine loop, inside the `verdict === 'approve'` branch, **before** the merge dispatch, insert an ace sub-loop that is a single-attempt clone of the existing no-test sub-loop (the `while (noTestMr && noTestMr.status === 'no-test' && r.task.fixRounds < roundLimit)` block — reuse its `add-test`-worker dispatch shape, its `blockedReason` guard, its `auditRound` re-audit, and its `fixRounds++` accounting). Locate by construct, not line number.

```js
// --ace: opt-in, fail-closed pre-merge polish of auditor-flagged nits. Single attempt.
const aceable = run.ace
  ? minorsOf(r.seats || []).filter(f => f.autoFixable === true && aceEligible(f))   // aceEligible = D5 refusals
  : []
if (run.ace && blockingOf(r.seats).length === 0 && aceable.length && r.task.fixRounds < roundLimit) {
  const ace = await agent(/* FIX_NEEDED template, header="advisory polish", list = aceable, commit EXACTLY ONE commit */,
    { agentType: NS + 'war-worker', phase: 'Audit', label: `ace:${r.task.id}:r${r.task.fixRounds + 1}`,
      schema: WORKER_RESULT, ...spawn('worker') })
  const aceWhy = blockedReason(ace)
  if (!aceWhy) {
    r.task.fixRounds++
    const { seats: reSeats } = await auditRound(r.task, null, null)      // re-pin + re-audit at the new sha (D3)
    if (allApprove(reSeats) && blockingOf(reSeats).length === 0) {
      r.seats = reSeats                                                  // merge proceeds on the polished tip
      // residual nits (not aced) still file; aced ones recorded aced:true (D6)
    } else {
      // D4: prepend `git revert --no-edit <aceSha>` (forward-only, classifier-safe) to the merge dispatch → merge the reverted tip. File all nits. Never escalate.
    }
  } // aceWhy: log, fall through to normal merge-and-file (never hold)
}
// ... unchanged merge dispatch ...
```

`aceEligible(f)` is a pure **string** check: the orchestrator is the Workflow sandbox and cannot read files, so it enforces only the one deterministic refusal it can — `false` if `f.file` ends in `plugin.json`/`marketplace.json`/`README.md` (release/version slots). The **code-reading** refusals (load-bearing, `ponytail:`/deliberate-mirror lines) are the auditor's job — it sets `autoFixable:true` only when they don't apply (D2). The final `minorsFiled` for the task is recomputed from the post-ace seats so only *un-aced* nits are filed; aced ones go to the new `aced` return list.

**CLI ([`skills/war/SKILL.md`](../../skills/war/SKILL.md)).** `/war <spec> [--ace]` — after resolving the run config, `--ace` sets `run.ace = true` for this run (a one-off override, same shape as `--working`/`--landing`). Persistent opt-in is set via war-room.

**war-room ([`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md)).** Add `run.ace (bool)` to the step-2 allowed-overrides list, with a one-line note.

## Affected files

| File | Change |
|------|--------|
| [`skills/war/assets/war-config.mjs`](../../skills/war/assets/war-config.mjs) | Add `ace: false` to `DEFAULTS.run`; one boolean `typeof` check in `validate()` (mirrors `run.afk`). |
| [`skills/war/assets/war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) | Test: `run.ace` defaults `false`; `validate` rejects non-boolean. Add `ace` to the run-field data-mirror set if one enumerates keys. |
| [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) | The ace sub-loop in the `verdict==='approve'` refine branch (D1/D3/D4); the `aceEligible` refusal predicate (D5); `minorsFiled` recompute + `aced:true` marking (D6). No new `MERGE_RESULT`/`HARD_ESCALATION_REASONS`/`land-decision.mjs` (D7). |
| [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) | `buildSeqImpl`-driven tests for every validation criterion below (`buildseqimpl-harness-for-multi-call-lens-tests`). |
| [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) | Add `autoFixable?: boolean` to the finding shape; amend the `Minor/Nit → follow-up issues` line to note ace files only *un-aced* residual nits. |
| [`agents/war-auditor.md`](../../agents/war-auditor.md) | When/how to set `autoFixable:true` (mechanical, self-contained, non-release, non-deliberate-marker). |
| [`skills/war/SKILL.md`](../../skills/war/SKILL.md) | Document `--ace` CLI flag + the ace behavior in the audit/refine narrative; note the durable-record rule (D6). |
| [`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md) | Surface `run.ace` in step-2 overrides. |
| `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (×2), `README.md` `## Status` | Version bump to **v0.8.7** (four canonical slots — see below). |

## Alternatives considered

- **Post-merge nit-sweep (design B).** Rejected as the primary path: editing an already-landed tip reintroduces the SHA-invalidation and no-re-audit hazards; discard-on-failure is messier than never-having-merged. D1's pre-merge, panel-re-audited loop is both safer and a near-clone of existing code.
- **`autoFixable` as a severity level (a fifth `AutoFix` severity).** Rejected — widening the severity enum ripples into `blockingOf`/`minorsOf` and every consumer; an optional boolean on the finding is orthogonal and additive.
- **A `nits-aced` `MERGE_RESULT.status`.** Rejected — `shared-status-enum-widening-silently-widens-land-path`: it would silently widen the land-side `HARD_ESCALATION_REASONS` reuse and force new drift mirrors. Ace is an attribute, not a status.
- **Code-enforced diff-scope guard (reject any ace diff touching >1 file / non-comment lines).** Deferred (YAGNI) — the auditor `autoFixable` flag + D5 refusals + panel re-audit already bound scope; a hard `assert-*.sh` guard is a larger surface, addable later if ace over-reaches in practice.
- **Auto-fix on by default.** Rejected — changes established behavior for every existing run; opt-in preserves byte-identical default and honors the fail-closed principle.

## Validation criteria

1. **Default off is byte-identical.** `run.ace` defaults `false` (`war-config.test.mjs`); with it unset, a task with `Minor/Nit` findings files them to `minorsFiled` exactly as today (`workflow-template.test.mjs` — existing minors behavior unchanged).
2. **Eligibility gate.** With `run.ace` on and a task approved with zero blockers: a nit carrying `autoFixable:true` dispatches an `ace:<id>` worker; a nit **without** the flag is filed, never dispatched. (`buildSeqImpl` asserts the worker call happened for the flagged nit only.)
3. **Re-audit at the new sha (D3).** After a successful ace-fix, `auditRound` re-runs and the subsequent merge dispatch targets the **post-fix** tip, not the pre-fix `audit_sha`. Assert a fresh audit round occurred and the merge sha advanced.
4. **Never blocks a land (D4).** When the ace-fix re-audit surfaces a new `Critical/Major`, the task still lands at the **originally-approved** sha, its nits are filed, and it appears in neither `escalated` nor with a hard reason. (`buildSeqImpl` returns a regressing re-audit; assert `landed` includes the task and `escalated` does not.)
5. **Release-slot refusal (D5).** A nit whose `file` is `plugin.json`/`marketplace.json`/`README.md ## Status` is filed, never aced, even with `autoFixable:true`.
6. **Deliberate-marker refusal (D5).** A nit whose target line carries `ponytail:` is filed, not aced.
7. **Budget & single-attempt.** Ace runs at most once per task and only while `fixRounds < roundLimit`; it shares `r.task.fixRounds` so it cannot compound unboundedly with the no-test loop. Assert a second ace attempt is not dispatched.
8. **Provenance (D6).** An aced nit produces a durable record: the `minorsFiled`/`auditLog` entry (or filed-then-closed issue note) carries `aced:true` + sha + rationale; it is not silently dropped.
9. **No enum leak (D7).** `MERGE_RESULT.status` and `HARD_ESCALATION_REASONS` are unchanged (existing drift-guard `deepEqual` tests stay green); `land-decision.mjs` is untouched.
10. **Config wiring.** `validate` rejects non-boolean `run.ace`; war-room lists `run.ace`; `/war --ace` flips `run.ace` for the run.
11. **Gate.** Full suite green at the release commit — `node --test "skills/**/*.test.mjs"` plus every `*.test.sh` runner discovered by `find` (never a literal count; run ALL post-merge — `gate-under-covers-after-cross-branch-merge-new-runner`).

## Version serialization

v0.8.7 replaces the four canonical version slots in lockstep (no badge): [`plugin.json`](../../.claude-plugin/plugin.json) `version`, [`marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and** `plugins[0].version`, and the [`README.md`](../../README.md) `## Status` line (replace-in-place). Lands serially **after v0.8.6** (spec 6) on that tip; confirm all four slots by hand at the release commit (no cross-slot consistency test). Note: this spec's own release bump touches `README ## Status` — but that is a normal worker/release task, not an ace-fix, so D5's release-slot refusal does not apply to it (the refusal governs *auditor nits*, not the release task).

## Open risks / non-goals

- **Non-goal: honesty of `autoFixable`.** Like every prompt-layer directive here, the auditor *could* mis-flag a load-bearing nit as `autoFixable`. The code-side D5 refusals + mandatory panel re-audit (D3) + never-block fallback (D4) are the backstops; the flag is a heuristic, the re-audit is the gate.
- **Non-goal: phase-wide batching.** Ace is per-task, in the worktree the nit was found in. A phase-level sweep (one pass after the whole queue drains) is out of scope — it needs its own checkout/rebase target.
- **Risk (low, latency): serial re-gate.** Each aced task adds one rebase+gate+re-audit on the serial refine tail. Acceptable on MAX-20x (cost is not the concern per `cost-not-a-concern-max-20x`); the single-attempt cap (D7/crit 7) bounds it.
- **Risk (low): `aceEligible` release-slot list drift.** If a new canonical version slot is added, the refusal list must track it. Anchor the list to the same slot set the release task edits; a drift test that asserts the two sets match is a cheap follow-up.

## Coverage

| Concern | Decision(s) | Validation |
|---------|-------------|------------|
| Opt-in, default-safe | D7 | 1, 10 |
| Only auditor-flagged nits fixed | D2 | 2 |
| Fix is panel-reviewed at the right sha | D1, D3 | 3 |
| Polish never blocks a land | D4 | 4 |
| Load-bearing nits are spared | D5 | 5, 6 |
| Bounded work | D1, D7 | 7 |
| Durable audit trail | D6 | 8 |
| No land/escalation enum leak | D7 | 9 |
| Suite green | — | 11 |
