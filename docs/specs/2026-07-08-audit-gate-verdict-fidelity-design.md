# Audit/gate verdict fidelity — pin every verdict to the integrated tip and gate it on captured evidence

**Status:** proposed. **Severity:** high. **Enforcement target:** mechanical (Node checks + a shell floor + captured artifacts), replacing prose-only authoring discipline wherever a friction says "not code-enforced". **Targets** the next free patch (current v0.14.14; version literals here are non-authoritative — resolve at land time from the four release slots).

**Addresses (memory lessons):** gate-audit-pin-bracket-test-blocked-by-git-guard, audit-worktree-pre-impl-tip-stale-verdict, stacked-per-branch-releases-make-main-lag-cumulative, within-phase-dep-gate-must-rerun-on-integrated-tip, gate-output-curated-excerpt-obscures-mapped-test-evidence, fail-closed-gate-silently-redirects-existing-failure-tests, weak-test-assertion-passes-without-feature-being-exercised, gate-evidence-severity-not-verdict-gates-hard-path

**Source:** memory cluster mined 2026-07-08 (group *"Guarantee every audit/gate verdict is computed at the right integration SHA and from real test evidence"*). Extends the landed `2026-07-01-gate-audit-integration-sha-validation-design.md` (the `pinOrSentinel` format-guard + `cat-file -t` recommendation), ADR 0012 (intra-phase visibility), ADR 0013 (disposition routing), ADR 0019 (target-derived execution values).

---

## 1. Context — the gap / problem

WAR's auditor/gate layer is the anti-cheat spine: it is what stops a phase from landing green-by-deletion or on a mis-read tree. Across dozens of recorded runs it has been defeated along two axes, and every recorded defeat currently resolves through *hand-run LLM reconstruction* rather than a mechanical check.

**Axis A — the verdict is computed against the wrong tree.**
- **[[gate-audit-pin-bracket-test-blocked-by-git-guard]]** (31+ recurrences): once ≥ 2 tasks land in sequence on one integration branch, the gate-audit `gateHeadSha` pin near-guaranteed mismatches the worktree HEAD. Every observed mismatch resolved as a *benign forward advance* — yet each seat re-runs the same manual `cat-file -t` → `merge-base --is-ancestor` → mapped-file-diff dance to prove it. The proof is deterministic git; the auditor should never reconstruct it by hand.
- **[[audit-worktree-pre-impl-tip-stale-verdict]]** (9+ instances): an auditor/servitor/Lead spawned against a worktree pinned mid-phase can read a *pre-implementation* tip and emit a false-absent / false-regression verdict; left unhandled it escalates to a spurious `held:escalation` land-halt. Nothing mechanically compares the seat's reviewed SHA against the SHA it was dispatched to judge.
- **[[stacked-per-branch-releases-make-main-lag-cumulative]]**: when N stacked plans each release on their own unlanded branch, a *main-checkout* audit baseline lags by N versions, so a legitimate 1-step bump reads as an N+1-step leap and tempts a scope-error flag.
- **[[within-phase-dep-gate-must-rerun-on-integrated-tip]]**: when Task N references code a sibling within-phase Task M writes, N can gate green on its own frozen-base branch while its cross-reference points at code absent from that base — a false green. Per-branch (work-wave) gate results are not land-authoritative, but the pipeline can still lean on them.

**Axis B — the verdict accepts weak evidence.**
- **[[gate-output-curated-excerpt-obscures-mapped-test-evidence]]** (10+ instances): the gate-audit seat can only catch a deleted test when each mapped test's own PASS line is directly visible. `#269` added a *"Do NOT curate or excerpt…"* clause to the three `gate_output`-population prose sites — but it is prompt-only, a should-do the refiner may ignore, so the `node --test` suite-summary variant stays an open, accepted gap.
- **[[fail-closed-gate-silently-redirects-existing-failure-tests]]**: adding an early-exit gate to a function silently converts any existing test that calls it in a gate-failing config and asserts only a generic outcome (`non-zero`) into a *gate* test — the originally-targeted failure path quietly loses coverage with no visible signal.
- **[[weak-test-assertion-passes-without-feature-being-exercised]]** (9 instances across 9 phases): vacuous assertions (contains-match on a base string, shared exit code, dead regex alternate, negative match on an undefined) pass without the feature being exercised, so green no-op tests survive feature deletion.
- **[[gate-evidence-severity-not-verdict-gates-hard-path]]**: the hold-land decision (`isHardGateEvidence` in `workflow-template.js`'s gate-audit loop) is computed *purely* from finding severity; the gate-audit seat's own `verdict: 'escalate'` field is ignored. A finding-less `escalate` is silently SOFT and does **not** hold the land — surprising against the general WAR rule that any `escalate` halts.

The through-line: **the load-bearing checks are prose the agent may skip, and the deterministic parts (ancestor proof, tip equality, evidence capture) are reconstructed per-seat instead of computed once and enforced.** This spec pushes each deterministic part into Node/shell/artifact enforcement and narrows the remaining LLM judgment to the parts that genuinely require it.

## 2. Pivotal constraints

1. **The Workflow sandbox has no shell/git and cannot `import`** (CLAUDE.md; `land-decision.mjs` is *hand-mirrored* into `workflow-template.js`). Mechanical enforcement therefore lives in one of three places only: pure Node in the Workflow body, a shell floor the **refiner** invokes (exit 0/1/2), or a hand-mirrored constant guarded by a drift test. Any new hard/soft constant added to `HARD_ESCALATION_REASONS` cascades across both mirrors + the drift guard.
2. **The auditor is read-only and its Bash is fail-closed to a git-verb allowlist** (`validate-auditor-git.sh`: `diff/log/show/merge-base/rev-parse/status/ls-files/cat-file/blame`, one `-C` peel, no arbitrary scripts, no `fetch`). An auditor **cannot** run a helper shell script — so any *script*-based proof must run refiner-side and be handed to the auditor as a token + cited evidence; the auditor may only spot-verify with individual allowlisted verbs.
3. **The frozen-phase-base doctrine holds** (ADR 0001/0012): every task worktree is cut at one captured integration tip; waves order *when* a worker runs, never *what base it sees*. Intra-phase `deps` grant a fast-forwarded base at dispatch (ADR 0012) — so within-phase cross-references are legal, which is exactly why their authoritative gate must be the *integrated* tip, not the per-branch frozen base.
4. **`gate-evidence` is SOFT by default, HARD only when a mapped test is provably unrun** (`land-decision.mjs` header; CONTEXT.md *Gate-audit pass*). This spec must not weaken that default — it only adds a second, orthogonal HARD trigger (`verdict==='escalate'`) and better evidence, never a looser default.
5. **Floor discovery must mirror `resolveGate`** (`war-config.mjs`) — any new floor's match set must not admit evidence the gate ignores (the `floor ⊆ gate` invariant, `assert-test-in-diff.sh` precedent).
6. **Findings route by auditor-owned `disposition`, orthogonal to severity** (ADR 0013). New auditor duties emit findings; they do not invent a new routing lane.

## 3. Resolved design tree

| # | Decision | Resolution |
|---|----------|-----------|
| D1 | How to stop the per-seat benign-advance reconstruction ([[gate-audit-pin-bracket-test-blocked-by-git-guard]]) | New refiner-side shell floor **`gate-pin-status.sh`** computes the ancestor + mapped-file-diff proof deterministically (exit 0 CONFIRMED/BENIGN-ADVANCE, 1 STALE-MISMATCH, 2 git error). The refiner runs it once during the post-merge step and stamps a structured `pin_status` + cited intervening-diff into the gate-audit input. The `execution-evidence` seat consumes the token instead of hand-running `cat-file`→`is-ancestor`→`diff`; a benign advance auto-resolves as CONFIRMED-equivalent, not a burned round. |
| D2 | How to catch a seat that judged the wrong tree ([[audit-worktree-pre-impl-tip-stale-verdict]]) | The Workflow already dispatches every seat with a pinned SHA and collects `seat.audit_sha`. Add a **Node-side pin-equality gate**: any finding from a seat whose returned `audit_sha ≠ the dispatched pin` is mechanically demoted to `agent-unverified` and cannot contribute a HARD hold — it becomes a SOFT absence-note. Applies to both the work-wave roster and the gate-audit seat. No reliance on each agent hand-running `merge-base`. |
| D3 | How to stop the cumulative-lag scope-error false-positive ([[stacked-per-branch-releases-make-main-lag-cumulative]]) | The authoritative version-bump / release audit baseline is the **integration-branch merge-base** (`git diff ${integrationBranch}...${task.branch}`, the three-dot set already used at the work-wave audit prompt), never a main checkout. Add an explicit standing clause: an N-step main-lag is the *expected* signal when N stacked plans have not all landed on main — it is not scope error. Mirrors [[audit-baseline-must-pin-integration-branch-not-main-checkout]]. |
| D4 | Which gate result is land-authoritative for intra-phase deps ([[within-phase-dep-gate-must-rerun-on-integrated-tip]]) | The **integrated-tip gate is authoritative; per-branch (work-wave) gates are advisory.** When a phase carries any intra-phase `deps` edge, the Workflow dispatches one **integrated-tip gate re-run** (refiner runs `plan.gate` once at the final integration tip after the serial merge queue) whose captured output feeds a single authoritative `execution-evidence` seat. A phase with no intra-phase deps keeps today's per-task passes unchanged. |
| D5 | How to structurally guarantee visible per-mapped-test PASS evidence ([[gate-output-curated-excerpt-obscures-mapped-test-evidence]]) | The refiner **tees** the full gate stdout+stderr to an artifact file under `_refinery` (`.war/gate-<taskId>.log`) and returns its **path** alongside `gate_output`; the `execution-evidence` seat reads the file (read-only `Read` permitted) so the complete runner list is always present. Replace the prose *"Do NOT curate"* clause with this structural capture. The seat's HARD-unrun determination is made against the captured file, not a prose paste. |
| D6 | How to catch coverage masking by a new gate ([[fail-closed-gate-silently-redirects-existing-failure-tests]]) | Two-part, honest about the ceiling. **Mechanical:** a `guard-assertion-specificity` check — when a task diff adds a new early-exit guard emitting a unique `die`/stderr message, a test in the *same* diff must assert that exact stderr substring (not merely `non-zero`); wired as a **test-fidelity auditor duty backed by a greppable floor arm** modelled on `assert-test-in-diff.sh`. **Judgment (agent-unverified):** the auditor's test-fidelity lens must also flag existing failure-path tests that now route through the new guard. Full call-graph masking detection is a non-goal (§9). |
| D7 | How to institutionalize the delete-and-trace check ([[weak-test-assertion-passes-without-feature-being-exercised]]) | Elevate the existing **`test-fidelity`** lens duty (already in `agents/war-auditor.md`) to a **mandatory delete-and-trace / temp-break-RED step on the `execution-evidence` gate-audit seat**: mentally delete the guarded feature and assert the mapped test would fail; pair every positive assertion with a negative absence assert. Remains agent-unverified judgment — but a required checklist item, not scattered prose. Mutation-style spot-check deferred (§9). |
| D8 | Whether a finding-less `escalate` should hold the land ([[gate-evidence-severity-not-verdict-gates-hard-path]]) | **Yes — defence-in-depth.** In the gate-audit loop, `isHardGateEvidence` also fires when `verdict === 'escalate'` (both the per-task and end-state-only seats). Reuses the existing `gate-evidence` escalation reason — **no new `HARD_ESCALATION_REASONS` member, no `land-decision.mjs` enum cascade** (ponytail: smallest correct change). An inline comment records that severity *and* verdict now gate the hard path. |

## 4. Mechanics (per component/role)

### `skills/war/assets/gate-pin-status.sh` (new floor; D1)
Sibling of `assert-test-in-diff.sh`, same bash-3.2-safe / cwd-independent style, same exit-code discipline.
- **Usage:** `gate-pin-status.sh <gateHeadSha> <observedHead> [--mapped <glob-set>] [--repo <git-dir>]` (`--repo` test-only, mirroring the floor precedent).
- **Contract:**
  - `cat-file -t <gateHeadSha>` fails, or `gateHeadSha` is the `(integration_sha …)` sentinel ⇒ **exit 2** (git/ref error — never collapses into a status; caller treats as cannot-confirm SOFT).
  - `gateHeadSha == observedHead` ⇒ **exit 0**, prints `CONFIRMED`.
  - `merge-base --is-ancestor <gateHeadSha> <observedHead>` holds **and** `git diff --name-only <gateHeadSha>..<observedHead>` ∩ `--mapped` set is empty ⇒ **exit 0**, prints `BENIGN-ADVANCE` + the intervening file list as cited evidence.
  - ancestor holds but a mapped file *did* change, or not an ancestor ⇒ **exit 1**, prints `STALE-MISMATCH` + offending files (the genuine cannot-confirm case).
- **`--mapped` default** mirrors the resolved gate discovery set (`floor ⊆ gate`, §2 constraint 5) — the same default `assert-test-in-diff.sh` uses.
- Paired test `gate-pin-status.test.sh`.

### `skills/war/assets/workflow-template.js` (D1, D2, D4, D8)
- **Post-merge gate-audit loop** (`mergedTasksForGateAudit` → the `parallel(...)` block): carry `pin_status` (the D1 token + cited diff, populated by the refiner) into the seat prompt; the prompt's hand-run `cat-file`/`rev-parse`/compare recipe is replaced by *"consume the stamped `pin_status`; a `BENIGN-ADVANCE`/`CONFIRMED` token is the pin proof — do not reconstruct it."* The stale-tip SOFT-defusing rule is preserved for `STALE-MISMATCH`/exit-2.
- **D2 pin-equality gate:** after collecting seats (both `auditRound` roster seats and the gate-audit seat), compare each `seat.audit_sha` against the dispatched pin; a mismatched seat's findings are tagged `agent-unverified` and excluded from the HARD path (a SOFT absence-note remains in `auditLog`). Pure Node, in the Workflow body.
- **D4 integrated-tip re-run:** detect intra-phase deps (`tasks.some(t => (t.deps||[]).some(d => tasks.some(x => x.id === d)))`); when true, after the serial merge queue dispatch one refiner `land-phase`-style gate re-run at the final integration tip and feed its captured output to one authoritative `execution-evidence` seat, in place of leaning on the per-branch results for dep-crossing tasks.
- **D8:** `const isHardGateEvidence = gateAuditVerdict.verdict === 'escalate' || findings.some(f => f.severity === 'Critical' || f.severity === 'Major')`, mirrored into the end-state-only seat's `isHard`. Inline comment: *"severity OR verdict gates the hard path; a finding-less escalate is HARD by design (defence-in-depth) — the SOFT-by-default rule still governs Minor/Nit findings."*
- Prompt surfaces are split (CLAUDE.md): every clause change here that concerns refiner/auditor behavior must land **in the same commit** as its `agents/*.md` mirror.

### `agents/war-refiner.md` (D1, D4, D5)
- Post-merge step: run `gate-pin-status.sh` in `_refinery`, tee the gate run to `.war/gate-<taskId>.log`, and return `pin_status` + the artifact path alongside `gate_output`. The *"Do NOT curate or excerpt"* prose is superseded by the tee-to-file capture (D5) — replace, do not merely append.
- New `land-phase` sub-behavior: on an intra-phase-dep phase, re-run `plan.gate` once at the final integration tip and capture it as the authoritative evidence (D4).

### `agents/war-auditor.md` (D6, D7)
- `execution-evidence` seat: consume `pin_status`; read the captured gate artifact; perform the **mandatory delete-and-trace** step (D7) and the **guard-masking flag** (D6) as named checklist duties. `test-fidelity` lens gains the guard-assertion-specificity duty.

### `skills/war/assets/land-decision.mjs`
- **Unchanged enum.** D8 reuses the existing `gate-evidence` reason; explicitly no new `HARD_ESCALATION_REASONS` member (avoids the two-mirror + drift-guard cascade, per constraint 1). A one-line header note records that `gate-evidence` HARD now fires on `verdict==='escalate'` too.

### `skills/war/assets/war-config.mjs`
- `resolveGate` untouched; the new floor's `--mapped` default is documented to mirror it (the authoritative source stays `resolveGate`).

## 5. Surface changes (files touched)

- `skills/war/assets/gate-pin-status.sh` — **new** floor (D1).
- `skills/war/assets/gate-pin-status.test.sh` — **new** test.
- `skills/war/assets/workflow-template.js` — gate-audit loop, pin-equality gate, integrated-tip re-run, `isHardGateEvidence` (D1/D2/D4/D8).
- `skills/war/assets/workflow-template.test.mjs` — pin-equality demotion, verdict-hard, integrated-tip-dispatch unit tests.
- `skills/war/assets/land-decision.mjs` — header note only (no enum change).
- `agents/war-refiner.md` — pin-status run, gate-artifact tee, integrated-tip re-run (mirror of the dispatched-prompt changes).
- `agents/war-auditor.md` — `execution-evidence` consume-token + delete-and-trace + guard-masking duties.
- `CONTEXT.md` — new terms (§6).
- `docs/adr/` — one new ADR (§7).
- `skills/war/SKILL.md` / `skills/war/assets/schemas.md` — only if the `MergeResult` schema grows a `pin_status` / artifact-path field (keep the schema drift-guard green).

## 6. New domain terms (CONTEXT.md)

- **Benign forward-advance** — a gate-HEAD-pin/HEAD mismatch where the observed HEAD *descends* the pinned gate SHA and no mapped file changed in the intervening diff; proven mechanically by `gate-pin-status.sh`, treated as pin-CONFIRMED (never a burned audit round, never a hold).
- **Integrated-tip gate re-run** — the single authoritative gate execution at a phase's final integration tip, dispatched when the phase carries intra-phase `deps`; per-branch (work-wave) gate results are advisory, this one is land-authoritative.
- **Gate-evidence artifact** — the tee'd full gate stdout+stderr file under `_refinery/.war/gate-<taskId>.log`; the `execution-evidence` seat's source of per-mapped-test PASS evidence, replacing curated `gate_output` prose.
- **Pin-equality gate** — the Node-side check that a seat's returned `audit_sha` equals the SHA it was dispatched to judge; a mismatch demotes that seat's findings to `agent-unverified` (SOFT-only).

## 7. Recommended ADRs

- **New ADR 0023 — "Audit/gate verdicts are computed at the integrated tip from captured evidence."** Records: (a) the integrated-tip gate is land-authoritative over per-branch gates for intra-phase deps (D4); (b) the pin-equality gate (D2) and the benign-advance floor (D1) move the tree-fidelity proof from per-seat LLM reconstruction to mechanical enforcement; (c) `verdict==='escalate'` is a second HARD trigger alongside severity (D8), while `gate-evidence` stays SOFT-by-default. Cross-references ADR 0012 (intra-phase visibility) and ADR 0019 (target-derived values).
- No amendment needed to ADR 0005 (dead-phase halt) or 0007 (provenance) — D2's `agent-unverified` demotion uses the existing provenance ladder, it does not extend it.

## 8. Open risks / implementation notes

- **Circularity of refiner-computed evidence (D1):** the refiner both merges and computes `pin_status`. Mitigated because `pin_status` is a *deterministic git fact* (an exit code from allowlisted read-only verbs), not a judgment; the auditor may spot-verify with a single `git cat-file -t` / `rev-parse` and the pin-equality gate (D2) independently guards the seat's own tip. It is not a fresh trust surface — it is the same git the auditor would query.
- **Artifact path vs sandbox reset (D5):** the `_refinery/.war/gate-<taskId>.log` path must be absolute in the seat prompt — subagent cwd is the main repo, not the worktree ([[workflow-agents-cwd-is-main-repo-not-session-worktree]]). Capture is fail-open: a missing artifact ⇒ SOFT cannot-confirm, never a hold.
- **`floor ⊆ gate` for the new floor (D1/D6):** `gate-pin-status.sh --mapped` and the guard-specificity arm must mirror `resolveGate`'s discovery set or they will read evidence the gate ignores; pin the default verbatim and cover it in the drift test ([[floor-script-discovery-set-must-mirror-gate-exclusions]]).
- **Both-mirror drift (D1/D4/D8):** every prompt clause change to the gate-audit/refiner behavior touches both `workflow-template.js` and `agents/*.md`; land them in one commit ([[standing-instruction-vs-dispatched-prompt-coverage-split]]).
- **Prove the new asserts are load-bearing:** apply delete-and-trace to *this spec's own* new tests — a pin-equality test must fail if the demotion is removed ([[weak-test-assertion-passes-without-feature-being-exercised]]).

## 9. Non-goals / deferred

- **Full call-graph coverage-masking detection** (D6) — detecting *every* existing test that now routes through a new guard needs a call graph WAR does not have; the mechanical arm covers the greppable stderr-substring case, the rest stays auditor judgment.
- **Mutation testing / automated mutant spot-check** (D7) — out of scope; delete-and-trace stays a human/auditor checklist step.
- **Widening the auditor git allowlist** (e.g. admitting `fetch` or arbitrary helper scripts) — explicitly rejected; the pin-status proof runs refiner-side precisely because the auditor Bash is fail-closed (constraint 2). Tracks the separate submodule-lens `fetch` question, not reopened here.
- **Changing the `gate-evidence` SOFT-by-default rule** — untouched; D8 only *adds* a HARD trigger.

## 10. Validation criteria

1. **D1 floor exists and is correct:** `gate-pin-status.sh` present; `bash gate-pin-status.test.sh` green, covering all four exits — CONFIRMED (equal shas), BENIGN-ADVANCE (descendant + no mapped-file change, evidence printed), STALE-MISMATCH (mapped file changed in the intervening diff → exit 1), and git/ref error → exit 2 (never collapses into a status).
2. **D1 wired:** `grep -n 'gate-pin-status' agents/war-refiner.md skills/war/assets/workflow-template.js` shows the refiner invocation and the seat-prompt token consumption; the gate-audit prompt no longer instructs the auditor to hand-run the `cat-file`→`is-ancestor`→mapped-diff sequence (the recipe is replaced by "consume `pin_status`").
3. **D2 pin-equality gate:** a `workflow-template.test.mjs` case where a seat returns `audit_sha` ≠ the dispatched pin asserts the finding is tagged `agent-unverified` and does **not** appear in `escalated` (no HARD hold); a matching-SHA control keeps the finding HARD. Delete-and-trace: removing the demotion makes the test fail.
4. **D3 baseline:** `agents/war-auditor.md` / the audit prompt state the release-diff baseline is the three-dot `${integrationBranch}...${task.branch}` merge-base and that an N-step main-lag under N unlanded stacked releases is expected, not scope error; greppable for the "expected … lag" clause.
5. **D4 integrated-tip re-run:** a `workflow-template.test.mjs` case with an intra-phase `deps` edge asserts one integrated-tip gate re-run is dispatched after the serial merge queue and its result feeds the authoritative `execution-evidence` seat; a no-intra-dep phase dispatches no extra re-run (byte-identical to today).
6. **D5 evidence capture:** `agents/war-refiner.md` tees the gate run to an absolute `_refinery/.war/gate-<taskId>.log` and returns the path; the *"Do NOT curate or excerpt"* prose is removed (replaced, not duplicated); a missing artifact yields a SOFT cannot-confirm, verified by a test.
7. **D6 guard-specificity:** a task diff adding a new `die`/stderr guard without a same-diff test asserting its unique stderr substring is flagged (floor arm exit 1 / auditor finding); a diff whose test asserts the exact substring passes. `floor ⊆ gate` preserved (drift test green).
8. **D7 delete-and-trace mandatory:** `agents/war-auditor.md`'s `execution-evidence` seat carries the named delete-and-trace / temp-break-RED duty and the pair-positive-with-negative-absence rule as a checklist item (greppable), not scattered prose.
9. **D8 verdict-hard:** a `workflow-template.test.mjs` case where the gate-audit seat returns `verdict: 'escalate'` with **zero** Critical/Major findings asserts `gate-evidence` is pushed to `escalated` (land held); a `verdict: 'approve'` control with no findings does not hold. `HARD_ESCALATION_REASONS` is **unchanged** (`land-decision.test.mjs` drift guard stays green — no new member).
10. **Suites green, prompts mirrored:** `node --test 'skills/**/*.test.mjs'` and every `hooks/` + `skills/` `*.test.sh` pass; the redaction lint (`war-memory.mjs lint docs/learnings/`) passes; each dispatched-prompt change in `workflow-template.js` has its `agents/*.md` mirror in the same diff.
