# `--ace`: opt-in, fail-closed pre-merge auto-fix of auditor-flagged Minor/Nit findings Implementation Plan

**Goal:** add an opt-in `--ace` mode to `/war` that *fixes* the trivially-mechanical nits an auditor explicitly
authorizes — in the task worktree, pre-merge, panel-re-audited — instead of filing every Minor/Nit as a `war-followup`
issue. Fail-closed: fixes only findings marked `autoFixable:true`, refuses release slots and deliberate-mirror lines,
runs a single attempt on the shared `fixRounds` budget, and **can never turn a mergeable task into a hold or an
escalate** — a regressing re-audit forward-reverts the ace commit and lands the originally-approved work. Smallest
correct change per decision, no speculative scope.

**Source spec:** [`docs/specs/2026-06-30-ace-nit-autofix-design.md`](../specs/2026-06-30-ace-nit-autofix-design.md).
**Roadmap (authoritative version source):** [`docs/plans/2026-06-30-open-issue-remediation-roadmap.md`](2026-06-30-open-issue-remediation-roadmap.md) — references the spec this plan implements; `/war` executes this plan, no code imports it.
**Memory slugs:** `shared-status-enum-widening-silently-widens-land-path`, `version-slots-no-cross-slot-consistency-test`,
`release-bump-slots-canonical-no-badge`, `release-status-is-replace-slot-not-empty-field`,
`absence-guard-redundant-filter-is-deliberate-mirror`, `buildseqimpl-harness-for-multi-call-lens-tests`,
`new-status-tests-bypass-coverage-wiring-by-design`, `red-team-env-gap-warn-is-agent-directive-not-code-enforced`,
`task-prompt-suite-count-stale-after-stacking`, `stacked-per-branch-releases-make-main-lag-cumulative`,
`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`, `plan-line-number-refs-stale-use-construct-locator`,
`defined-but-not-yet-emitted-plan-slice-pattern`.

> **RATIFY WITH `/red-team` BEFORE `/war`.** This plan changes **pre-merge control flow** in the serial refine loop —
> it inserts a new dispatch + re-audit + conditional forward-revert *between* the approve verdict and the merge that
> lands the work. That is the highest-leverage kind of change in this repo (a bug here can silently drop or corrupt an
> approved land). Run `/red-team` on this plan and get it CLEARED before executing `/war`.

## Coordination

- **Target version:** **v0.8.7** (net-new feature; *not* one of the 16 remediation issues; **Severity: N/A**).
- **landOrder:** stacks on the **v0.8.6 tip** (spec 6 in the roadmap). War this plan on that tip.
- **Integration base:** the **latest `origin/master`** per the serial-stack convention (`war-branch-base-off-latest-master-not-prior-tip`
  — the operator merges each PR as a merge-commit, so base each WAR branch off the newest master, not the prior working tip).
- **Standalone fallback:** if run off a tip earlier than v0.8.6, the roadmap is authoritative — resolve the **next free
  patch by construct** at land time and drop the v0.8.6-tip pin. (Re-grounded 2026-07-01: this stacked tip now reads
  **v0.8.6** in all four slots — specs 1–6 landed — so T5 bumps `0.8.6 → 0.8.7`, "Builds on v0.8.6".) Never hardcode a
  leap over an empty stack (`stacked-per-branch-releases-make-main-lag-cumulative`).
- **Four-slot serial-land note:** a release bump **REPLACE-in-place**s the four canonical slots in lockstep (no badge):
  [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`;
  [`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and**
  `plugins[0].version`; [`README.md`](../../README.md) `## Status` line. Only one spec can hold a given number, so the
  stack **MUST land serially**. No cross-slot consistency test exists — verify all four slots **by hand** at the release
  commit (`version-slots-no-cross-slot-consistency-test`).
- **File-lane contention:** T1 (`war-config.mjs`) and T2 (`schemas.md` + `war-auditor.md`) touch **disjoint** files and
  run in parallel; T3 (`workflow-template.js`) is serial and depends on both. No two tasks touch the same file in the
  same phase (`war-phase-up-front-provisioning-conflicts-same-file-serial-tasks`).

## Operator decisions — RESOLVED (bake exactly; these SUPERSEDE any stale "reset --hard" / "file-and-close-issue" wording in the spec)

- **D1 — Structural spine (where the ace sub-loop sits).** At the **TOP of the `if (r.verdict === 'approve')` branch**
  (construct at `workflow-template.js` — the `if (r.verdict === 'approve') {` line, currently ~L351), **BEFORE** the merge
  dispatch (`const mr = await agent('Merge WAR task …')`, currently ~L362). Flow: ace-fix worker commits on the task
  branch → `auditRound(r.task, null, null)` re-audit at the new sha → if re-approved, **fall through to the UNCHANGED
  merge dispatch** (which rebases, re-gates, merges the polished tip). **No separate ace-merge dispatch** — the existing
  merge's gate run satisfies "re-gate at the new sha".
- **D2 — Discard = forward-revert, NEVER reset (never block a land).** The ace-fix worker makes **EXACTLY ONE commit**.
  On re-audit regression (a new `Critical`/`Major`, or non-approve), do **NOT** `git reset --hard` — it trips safety
  classifiers, can't be cleared in an AFK run, and Sonnet may balk. Instead the discard path **prepends ONE clause** to
  the merge dispatch prompt: in the task worktree, `git revert --no-edit <aceSha>` (forward-only, classifier-safe), then
  the normal rebase+gate+merge runs on the reverted-to-approved tip. **Never escalate**; the task still lands its
  approved work. The revert commit doubles as a provenance trace.
- **D3 — Provenance = commit + `aced` list, NOT GitHub issues.** No `gh issue create`+close for aced nits. Durable
  record = (a) the ace worker's **single commit message** citing each finding's title+rationale, and (b) a new
  `aced: [{ task, finding, sha }]` list in the Workflow return, surfaced in the Lead's phase report. Un-aced **RESIDUAL**
  nits still file as `war-followup` exactly as today. At the `minorsFiled.push(...minorsOf(r.seats)…)` site
  (construct at `workflow-template.js` ~L348), for an aced task **recompute** so only un-aced residual goes to
  `minorsFiled`; aced ones go to `aced`.
- **D4 — Two-layer refusal.** The **AUDITOR** owns the code-reading refusals — it sets `finding.autoFixable:true` only
  for mechanical, single-file, non-load-bearing changes and **NOT** on a line carrying a `ponytail:`/deliberate-mirror
  comment (the auditor already reads the code). The **ORCHESTRATOR** `aceEligible(f)` is **ONLY** a deterministic
  release-slot **string** backstop: refuse if `f.file` ends in `plugin.json`, `marketplace.json`, or `README.md` (the
  sandbox can't read files, so this is the one refusal it can enforce). Conservatively refuse **ALL** of `README.md`.
- **D5 — Budget + CLI.** A **single** ace attempt per task, sharing `r.task.fixRounds`. Guard:
  `run.ace && blockingOf(r.seats).length === 0 && aceable.length && r.task.fixRounds < roundLimit`. `/war --ace` is a
  **Lead-side instruction** that sets `run.ace = true` for the run (no code parser — `/war` is skill-driven, same shape
  as `--working`/`--landing`).
- **D6 — No enum leak.** **No** new `MERGE_RESULT.status`, **no** new `HARD_ESCALATION_REASONS` member, **no**
  `land-decision.mjs` change. Ace is orthogonal soft-polish recorded as an attribute, not a status
  (`shared-status-enum-widening-silently-widens-land-path`). The existing `deepEqual` drift guards in
  `war-config.test.mjs` (which import `HARD_ESCALATION_REASONS` from `land-decision.mjs`) MUST stay green.

---

## Phase 1 — Foundations (T1 + T2 parallel; disjoint files)

### Task 1 — `war-config.mjs`: add `run.ace` (default `false`) + validator (STRICT TDD)

Isolated lane. **Note:** there is **no** run-key data-mirror trip here — the data-mirror in `war-config.test.mjs` is
`run.provision`-specific (the `validateProvision`/`resolveProvision` set), not a generic run-key enumeration, so adding
`ace` does not cascade into it. Confirm at execution that no test enumerates run keys against a fixed set; if one does,
add `ace` there too.

**Files:**
- modify [`skills/war/assets/war-config.test.mjs`](../../skills/war/assets/war-config.test.mjs) — default-`false` test +
  reject-non-boolean test.
- modify [`skills/war/assets/war-config.mjs`](../../skills/war/assets/war-config.mjs) — `ace: false` in `DEFAULTS.run`;
  one boolean `typeof` check in `validate()` mirroring the `run.afk` check.

**`requiresTest`: true** — `war-config.test.mjs` is the config's mapped test; the default + reject cases make the field load-bearing.

- [ ] **Step 1 — RED: add two cases to `war-config.test.mjs`.** Model the reject case on the existing **`non-boolean
  provisionAuto rejected`** case (war-config.test.mjs has **no** `run.afk` test to copy — grep `afk` returns nothing — so
  mirror the `provisionAuto` reject shape and the source-side `run.afk` validator at war-config.mjs `~L97`): (a)
  `assert.equal(DEFAULTS.run.ace, false)` (and/or that `presetConfig('balanced'|'thorough'|'economy').run.ace === false`
  — all inherit `false` via `deepMerge`); (b) a `validate` reject case: a config with `run.ace` set to a non-boolean
  (e.g. `'yes'` or `1`) yields an error containing `run.ace must be a boolean`.
- [ ] **Step 2 — Run `node --test skills/war/assets/war-config.test.mjs` → RED.** The default case fails (`ace`
  undefined ≠ `false`) and the reject case fails (no such error string emitted yet).
- [ ] **Step 3 — GREEN: add the field + validator.** In `DEFAULTS.run` (the object literal at ~L34:
  `run: { roundLimit: 3, afk: false, provision: [], provisionSource: 'none', provisionAuto: true }`), add `ace: false`.
  In `validate()`, next to the `run.afk` check (~L97: `if (typeof c.run.afk !== 'boolean') errors.push('run.afk must be a boolean')`),
  add `if (typeof c.run.ace !== 'boolean') errors.push('run.ace must be a boolean')`. Re-run → GREEN.
  **Load-bearing check:** reverting the `DEFAULTS.run.ace` line must re-fail the default case; reverting the validator
  line must re-fail the reject case. State this in the commit body.
- [ ] **Step 4 — Run the full gate → green** (see ## Gate). Only `war-config.test.mjs` changed behavior.
- [ ] **Step 5 — Commit** — `feat(war): add run.ace (default false) + validator, mirroring run.afk (#ace)`

### Task 2 — `schemas.md` + `war-auditor.md`: `autoFixable?` finding field + auditor guidance (prose)

**`requiresTest`: false** — no behavioral surface; the deliverable is verified by grep-presence in validation, not a
new runner. (No `.test.sh`/`.mjs` maps to these `.md` files; the schemas-manifest shell gate checks structure, not this
optional field's prose.)

**Files:**
- modify [`skills/war/references/schemas.md`](../../skills/war/references/schemas.md) — extend the AuditVerdict finding
  shape; amend the `Minor/Nit → follow-up issues` line to note ace files only *un-aced* residual nits.
- modify [`agents/war-auditor.md`](../../agents/war-auditor.md) — when/how to set `autoFixable:true`.

- [ ] **Step 1 — `schemas.md`: extend the finding shape.** At the `findings:` shape (construct at ~L38-39:
  `{ severity: "Critical"|"Major"|"Minor"|"Nit", title, file, line?, rationale, suggested_fix?, plan_ref? }`), add optional
  `autoFixable?: boolean` to the field list. At the `Minor/Nit findings → new follow-up issues labeled war-followup`
  line (~L89), amend to note: under `--ace`, an auditor-flagged auto-fixable nit is fixed in the worktree pre-merge and
  recorded on the Workflow's `aced` list (commit-cited); only **un-aced residual** nits file as `war-followup`.
- [ ] **Step 2 — `war-auditor.md`: guidance for `autoFixable:true`.** Near the finding-emission guidance (construct at
  ~L58: "Emit findings tagged `Critical | Major | Minor | Nit`"), add a clause: set `autoFixable:true` on a `Minor`/`Nit`
  **only** when the fix is **mechanical, self-contained, single-file, non-load-bearing**, touches **no** version/release
  slot, and does **NOT** remove or edit a line carrying a `ponytail:`/deliberate-mirror rationale comment — otherwise
  **omit** the field (fail-closed). This is a prompt-layer directive with a code-side release-slot backstop in the
  orchestrator (`red-team-env-gap-warn-is-agent-directive-not-code-enforced`).
- [ ] **Step 3 — Validation (no gate change):** grep-confirm `autoFixable` appears in both files and the `war-followup`
  line references ace/`aced`. Run the full gate → green (unchanged; prose-only).
- [ ] **Step 4 — Commit** — `docs(war): add optional autoFixable finding field + auditor guidance for --ace (#ace)`

---

## Phase 2 — Orchestrator core (T3, serial; depends on P1)

### Task 3 — `workflow-template.js`: the pre-merge ace sub-loop, `aceEligible` backstop, forward-revert discard, `minorsFiled` recompute + `aced` return (STRICT TDD)

One-file family. Anchor by **construct, not line number** (`plan-line-number-refs-stale-use-construct-locator`) — the
serial refine loop churns.

**Files:**
- modify [`skills/war/assets/workflow-template.test.mjs`](../../skills/war/assets/workflow-template.test.mjs) —
  `buildSeqImpl`-driven tests, one per spec validation criterion (`buildseqimpl-harness-for-multi-call-lens-tests`).
- modify [`skills/war/assets/workflow-template.js`](../../skills/war/assets/workflow-template.js) — the ace sub-loop,
  `aceEligible`, forward-revert discard clause, `minorsFiled` recompute + `aced` list.

**`requiresTest`: true** — the ace control-flow is the load-bearing surface; every criterion below is a `buildSeqImpl` case.

- [ ] **Step 1 — RED: add `buildSeqImpl`-driven tests to `workflow-template.test.mjs`**, one per criterion (fresh
  `buildSeqImpl` instance per test; it maps label→results and `.shift()`s per call):
  - **default-off byte-identical** — `run.ace` unset ⇒ no `ace:<id>` dispatch; a task with `Minor`/`Nit` findings files
    them to `minorsFiled` exactly as today; `aced` is empty/absent.
  - **eligibility gate** — `run.ace` on, task approved, zero blockers: a nit with `autoFixable:true` dispatches an
    `ace:<id>` worker; a nit **without** the flag is filed, never dispatched.
  - **re-audit-at-new-sha** — after a successful ace-fix, a fresh `auditRound` occurs and the merge dispatch runs on the
    post-fix tip (assert the extra audit round happened and the merge dispatch followed it).
  - **never-blocks-a-land via forward-revert** — the ace re-audit returns a regressing verdict (new `Critical`/`Major`
    or non-approve): assert the merge dispatch prompt now carries the `git revert --no-edit <aceSha>` clause, the task
    appears in `landed`, and it appears in **neither** `escalated` nor with any hard reason.
  - **release-slot refusal** — a nit whose `f.file` ends in `plugin.json`/`marketplace.json`/`README.md` is filed, never
    aced, even with `autoFixable:true` (asserts `aceEligible` string backstop).
  - **ponytail / no-flag refusal** — a nit without `autoFixable:true` (auditor's own refusal path) is filed, not aced.
  - **budget single-attempt** — ace dispatches at most once per task and only while `fixRounds < roundLimit`; assert a
    second ace attempt is not dispatched (shares `r.task.fixRounds`).
  - **provenance `aced` list** — an aced nit appears on the return `aced` list with `{ task, finding, sha }`; it is NOT
    in `minorsFiled`.
  - **no-enum-leak** — assert (or lean on the existing `war-config.test.mjs` `deepEqual`) that `MERGE_RESULT.status`
    enum and `HARD_ESCALATION_REASONS` are unchanged.
- [ ] **Step 2 — Run `node --test skills/war/assets/workflow-template.test.mjs` → RED.** All new cases fail (no ace
  code path yet).
- [ ] **Step 3 — GREEN: add `aceEligible`** — a local predicate near `blockingOf`/`minorsOf` (constructs at ~L153-154):
  `const aceEligible = f => f.file && !/(?:plugin\.json|marketplace\.json|README\.md)$/.test(f.file)`. Release-slot
  string backstop **only** (D4); the auditor owns code-reading refusals.
- [ ] **Step 4 — GREEN: the ace sub-loop** at the TOP of the `if (r.verdict === 'approve')` branch (construct ~L351),
  **before** `const mr = await agent('Merge WAR task …')` (~L362). Shape (single-attempt clone of the no-test
  sub-loop's dispatch/`blockedReason`/`auditRound`/`fixRounds++` accounting, construct ~L390-443):
  ```js
  // --ace: opt-in, fail-closed pre-merge polish of auditor-flagged nits. Single attempt (D1/D2/D5).
  const aceable = run.ace ? minorsOf(r.seats || []).filter(f => f.autoFixable === true && aceEligible(f)) : []
  let aceSha = null
  if (run.ace && blockingOf(r.seats).length === 0 && aceable.length && r.task.fixRounds < roundLimit) {
    const ace = await agent(/* FIX_NEEDED-shape, header "advisory polish", list=aceable, EXACTLY ONE commit citing each finding title+rationale */,
      { agentType: NS + 'war-worker', phase: 'Audit', label: `ace:${r.task.id}:r${r.task.fixRounds + 1}`, schema: WORKER_RESULT, ...spawn('worker') })
    const aceWhy = blockedReason(ace)
    // WORKER_RESULT's commit field is `head_sha` (NOT `sha` — grep confirms no `.sha` on any worker result).
    // Guard on a truthy head_sha: a falsy sha would make r.aceReverted falsy (revert clause never fires) AND
    // would emit a `git revert --no-edit ` with no arg (fails → escalate). Both defeat the never-blocks-a-land invariant.
    if (!aceWhy && typeof ace.head_sha === 'string' && ace.head_sha) {
      r.task.fixRounds++
      aceSha = ace.head_sha /* the single ace commit */
      const { seats: reSeats, expected: reExpected } = await auditRound(r.task, null, null)   // re-pin + re-audit (D1)
      if (allApprove(reSeats, reExpected) && blockingOf(reSeats).length === 0) {
        r.seats = reSeats                          // merge proceeds on the polished tip; aced recorded below
      } else {
        r.aceReverted = aceSha                     // D2: merge dispatch prepends `git revert --no-edit <aceSha>`; never escalate
        aceSha = null
      }
    } // aceWhy or falsy head_sha: log, fall through to normal merge-and-file on the un-aced approved tip (never hold)
  }
  ```
- [ ] **Step 5 — GREEN: forward-revert discard clause on the merge dispatch.** In the merge dispatch prompt (construct
  ~L362-377), **prepend one clause** when `r.aceReverted` is set: "in the TASK worktree `git -C <worktree> revert
  --no-edit <aceSha>` (forward-only, classifier-safe) BEFORE the rebase step, so the merge runs on the
  reverted-to-approved tip." Do **not** add a `reset --hard`. Never route to `escalated`.
  **Why this cannot introduce a new escalate (closes the never-blocks-a-land invariant):** `aceSha` is the **single ace
  commit**, which is the **task-branch tip** at the moment of revert (the ace worker made exactly one commit and nothing
  is added between it and this merge dispatch). `git revert --no-edit <tip>` is the clean inverse diff of HEAD — it has
  nothing to conflict against, so it **cannot fail with a conflict**; the worktree returns to a tree functionally
  identical to the originally-approved tip. Therefore the subsequent rebase+gate+merge behaves **exactly as it would have
  without `--ace`**: a task that would have merged clean still merges clean; the *only* outcomes ace can produce are the
  same outcomes the un-aced approved work would have produced. Ace never turns a **mergeable** task into a hold/escalate.
  (The truthy-`head_sha` guard in Step 4 ensures the revert clause is emitted only with a real sha; a blocked/`head_sha`-less
  ace result falls through to the plain merge on the un-aced tip — also no escalate.) Belt-and-suspenders: the revert
  clause is prepended **only** `when r.aceReverted` is a non-empty string — never unconditionally.
- [ ] **Step 6 — GREEN: `minorsFiled` recompute + `aced` list.** At the `minorsFiled.push(...minorsOf(r.seats)…)` site
  (~L348) — or right after the ace sub-loop resolves — for an aced task push only **un-aced residual** nits to
  `minorsFiled` and push `{ task, finding, sha: aceSha }` per aced finding to a new `aced` array (declare `const aced =
  []` alongside `minorsFiled`/`escalated`). Add `aced` to **both** `return { … }` shapes (constructs ~L644 and ~L648).
- [ ] **Step 7 — Guard the invariants.** Assert **NO** new `MERGE_RESULT.status` member (the enum at ~L44 is unchanged),
  **NO** new `HARD_ESCALATION_REASONS` member (~L556), **NO** `land-decision.mjs` change (D6). The `deepEqual` drift
  guards in `war-config.test.mjs` must stay green. Re-run `workflow-template.test.mjs` → GREEN.
- [ ] **Step 8 — Run the full gate → green** (see ## Gate).
- [ ] **Step 9 — Commit** — `feat(war): --ace pre-merge auto-fix of auditor-flagged nits — single-attempt, panel-re-audited, forward-revert-on-regression, aced provenance list (#ace)`

---

## Phase 3 — Surface + release (T4 then T5)

### Task 4 — `SKILL.md` + `war-room/SKILL.md`: `--ace` CLI + `run.ace` override (prose)

**`requiresTest`: false** — prose surface; verified by grep-presence.

**Files:**
- modify [`skills/war/SKILL.md`](../../skills/war/SKILL.md) — `--ace` in the CLI synopsis mapping to `run.ace`; ace
  behavior narrative in the audit/refine section; the durable-record rule (D3).
- modify [`skills/war-room/SKILL.md`](../../skills/war-room/SKILL.md) — `run.ace` in the step-2 overrides list.

- [ ] **Step 1 — `SKILL.md`: CLI + narrative.** In the synopsis (construct at ~L14:
  `/war <plan-file> [--working <branch>] [--landing <branch>] [--afk] [--config <path>]`), add `[--ace]`. Document that
  `--ace` sets `run.ace = true` for this run (Lead-side, one-off override, same shape as `--working`/`--landing`; no code
  parser). In the audit/refine narrative, add the ace behavior: with `run.ace`, an approved task with zero blockers and
  ≥1 auditor-flagged `autoFixable` nit gets a **single** pre-merge ace-fix + panel re-audit; on regression the ace commit
  is **forward-reverted** and the originally-approved work still lands (never escalates). Durable-record rule (D3): aced
  nits are recorded via the ace commit message + the `aced` list in the phase report; **only un-aced residual** nits file
  as `war-followup`.
- [ ] **Step 2 — `war-room/SKILL.md`: overrides list.** In the step-2 allowed-overrides block (construct at ~L20:
  `run.roundLimit (integer ≥ 1); run.afk (bool).`), add `run.ace (bool)` with a one-line note (opt-in pre-merge
  auto-fix of auditor-flagged nits; default `false`).
- [ ] **Step 3 — Validation:** grep-confirm `--ace` and `run.ace` appear in both files. Full gate → green (unchanged).
- [ ] **Step 4 — Commit** — `docs(war): document --ace CLI flag + run.ace war-room override (#ace)`

### Task 5 — Release v0.8.7 + full gate green (alone, last)

Bump only after T1-T4 land and this plan is based on the v0.8.6 tip. **Standalone fallback:** if run off an earlier tip,
resolve the next free patch by construct (not a hardcoded 0.8.7) and adjust the `Builds on` clause to the real prior
version. This release task edits `README.md ## Status` — but that is a normal release task, **not** an ace-fix, so D4's
release-slot refusal (which governs *auditor nits*) does not apply to it.

**`requiresTest`: false.**

**Files:** [`.claude-plugin/plugin.json`](../../.claude-plugin/plugin.json) `version`;
[`.claude-plugin/marketplace.json`](../../.claude-plugin/marketplace.json) `metadata.version` **and**
`plugins[0].version`; [`README.md`](../../README.md) `## Status` (REPLACE-in-place — the version literal line under the
`## Status` heading; anchor by the `## Status` heading, not a raw line number).

- [ ] **Step 1 — Bump all four slots to `0.8.7`** (REPLACE-in-place, no badge). In the README `## Status` paragraph,
  replace the leading version literal **and** the trailing `Builds on vX` clause to the prior landed tip (`v0.8.6` in the
  stack). Status copy: `--ace` opt-in pre-merge auto-fix of auditor-flagged mechanical nits — single-attempt,
  panel-re-audited at the new sha, forward-reverted on regression (never blocks a land), with an `aced` provenance list;
  un-aced residual nits still file as `war-followup`. (`release-bump-slots-canonical-no-badge`,
  `release-status-is-replace-slot-not-empty-field`.)
- [ ] **Step 2 — Verify all four slots + the `Builds on` clause by hand** — no cross-slot consistency test exists
  (`version-slots-no-cross-slot-consistency-test`). Run the full gate → green.
- [ ] **Step 3 — Commit** — `chore(release): v0.8.7 — --ace opt-in pre-merge nit auto-fix`

---

## Gate

Run at the release commit — the self-discovering multi-runner. Quote the `.mjs` glob (bash 3.2 under-covers it
unquoted). Never assert a literal count; a cross-branch merge can add `*.test.sh` runners the bare node glob misses —
run **ALL** discovered runners post-merge (`gate-under-covers-after-cross-branch-merge-new-runner`,
`task-prompt-suite-count-stale-after-stacking`):

```
node --test 'skills/**/*.test.mjs' && for f in $(find . -type f -name '*.test.sh' \
  -not -path '*/node_modules/*' -not -path '*/.git/*' | sort); do bash "$f" || exit 1; done
```

The behavioral surfaces are `war-config.test.mjs` (T1) and `workflow-template.test.mjs` (T3); both must stay green.
The `find`-based discovery is authoritative — the runner set is self-discovered, never a hardcoded count.

**Stale-tip audit guard:** an auditor on a pre-impl worktree tip will see the new ace tests as "test unrun" / a spurious
land-halt. Verify the real tip and re-run the gate at the actual task commit before treating any "test unrun" as
blocking (`audit-worktree-pre-impl-tip-stale-verdict`).

## Coverage

| Concern | Decision(s) | Spec criterion | Task |
|---------|-------------|----------------|------|
| Opt-in, default-safe (byte-identical off) | D5/D6 | 1, 10 | T1, T3 |
| Only auditor-flagged nits fixed | D4 | 2 | T2, T3 |
| Fix panel-reviewed at the new sha | D1 | 3 | T3 |
| Polish never blocks a land (forward-revert) | D2 | 4 | T3 |
| Release-slot refusal (string backstop) | D4 | 5 | T3 |
| Deliberate-marker / no-flag refusal (auditor) | D4 | 6 | T2, T3 |
| Bounded work (single attempt, shared budget) | D5 | 7 | T3 |
| Durable audit trail (`aced` list + commit) | D3 | 8 | T3 |
| No land/escalation enum leak | D6 | 9 | T3 |
| Config wiring / CLI / war-room | D5 | 10 | T1, T4 |
| Suite green at release | — | 11 | T5 |

## Deliberate simplifications (`ponytail:`)

- **`aceEligible` is a string suffix test, not a file reader.** The sandbox can't read files, so the orchestrator's only
  enforceable refusal is the release-slot filename backstop; the auditor (which reads code) owns the mechanical /
  non-load-bearing / no-`ponytail:`-line refusals. Two layers, each doing only what it can see. Upgrade path: a
  code-enforced diff-scope guard (reject any ace diff > 1 file / non-comment lines) only if ace over-reaches in practice.
- **Discard is forward-revert, never `reset --hard`.** One `git revert --no-edit <aceSha>` is classifier-safe,
  AFK-clearable, and leaves a provenance trace — a reset trips safety hooks and can strand an AFK run. The revert is a
  smaller, safer diff than any reset path.
- **Provenance is a commit + return-list attribute, not a GitHub issue round-trip.** No `gh issue create`+close for aced
  nits; the single ace commit message + the `aced` list is the durable, queryable record. Un-aced residual nits keep the
  existing `war-followup` path unchanged.
- **No new `MERGE_RESULT`/`HARD_ESCALATION_REASONS`/`land-decision.mjs`.** Ace is an attribute on the return, not a
  status — widening the enum would silently widen the land-side reuse (`shared-status-enum-widening-silently-widens-land-path`).
- **Phase-wide batching is out of scope.** Ace is per-task, in the worktree the nit was found in; a phase-level sweep
  needs its own checkout/rebase target (spec non-goal).
