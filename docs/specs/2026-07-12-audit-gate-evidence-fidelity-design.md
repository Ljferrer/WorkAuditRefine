# Audit/gate/dispatch bookkeeping fidelity — debt dedup, disposition ride-through, evidence mapping, and anchor corrections in the /war engine

Issues addressed: #798, #805, #806, #811, #815, #817, #818

Depends on (sibling spec, same file): `docs/specs/2026-07-12-war-launch-entry-validation-design.md` — both specs amend `skills/war/assets/workflow-template.js`; their plans must be stacked (ADR 0011), never interleaved in one phase.

## 1. Context — the gap / problem

Seven verified fidelity gaps in the `/war` engine's audit/gate/dispatch spine, all of the same shape: an engine-side record, routing set, or prompt clause diverges from what the dispatched agent is told or what it reports back. None corrupts a run outright — each silently weakens bookkeeping, evidence, or config fidelity:

- **#798 (minor)** — `recordBaselineDebt` dedups `source:'auto'` baseline backstops on *exact* sorted-id-set + base-sha equality, but `baselineDebtClause` tells the refiner to classify `baseline` when failing ids are *COVERED* (subset) by recorded debt and to report the covered ids back. Both routing sites (the merge-result path that calls `recordBaselineDebt(mr.gate_failing_ids, mr.gate_base_sha)` and the land-result twin) feed that reported set straight back in, so a strict subset at the same base sha misses the exact key and mints a near-duplicate debt entry plus a second auto backstop.
- **#805 (minor)** — `auditRound`'s pin-equality demotion spread (`s.findings = (s.findings || []).map(f => ({ ...f, pinMismatch: true, originalSeverity: f.severity, severity: 'Nit' }))`) rewrites severity but leaves `disposition` (and legacy `autoFixable`) intact. `dispositionOf` honors `disposition:'absorb'` regardless of severity, `aceEligible` filters only on file path, and the approve-branch routing loop never checks `f.pinMismatch` — so a finding made against a tree the seat never reviewed at the pinned SHA can still enter the `aceable` set and burn a `--ace` attempt plus a `fixRounds` increment.
- **#806 (minor)** — the post-merge evidence dispatch derives each gate-audited task's `preMergeTip` from the *previous entry in the filtered* `mergedTasksForGateAudit` list (`i === 0 ? phaseBaseCmd : mergedTasksForGateAudit[i - 1].gateHeadSha`), but `landMerged` pushes every task to the unfiltered `landed` order while `requiresTest:false` tasks skip the gate-audit list. A skipped task that merges between two gate-audited tasks still advances the fast-forward integration tip, so the next entry's `preMergeTip..gateHeadSha` diff range absorbs the skipped task's files into its `--mapped` set — leaning `gate-pin-status.sh` toward spurious STALE-MISMATCH (SOFT, fail-open, but wrong evidence).
- **#811 (minor)** — the `COST_CLAIM_SHARED` byte-identity anchor in `workflow-template.test.mjs` embeds straight-double-quoted examples and asserts byte-identity across three surfaces (`auditPrompt()` in `workflow-template.js`, `agents/war-auditor.md`, the test's own copy), with no comment warning that a one-sided quote-style normalization breaks it surprisingly. The later `CALIBRATION_RULE_ANCHORS` block deliberately avoids quote-bearing byte literals and cites the lesson; the earlier anchor never got the mitigation.
- **#815 (minor)** — the land block's step-2 "Merge" prompt (the `git -C ${refineryLandPath} merge --no-ff` step) says "the gate's cwd stays the task worktree" — a verbatim mirror of the TMPDIR-pin clause from the two merge-task prompt sites where that wording is correct. At the land site the gate runs inside the detached `_refinery` land worktree; the prose states a wrong execution context (inert, but a dispatched-prompt lie).
- **#817 (minor)** — the floor-retry fix-worker dispatch (labels `add-test:<id>:r<n>` / `package-it:<id>:r<n>`) spawns via plain `spawn('worker')` at the `floorFix` call site, while the sibling `fix:` and `ace:` dispatches use tier-aware `spawnWorker('fix')`. An operator-configured `agents.worker.fix` override silently never applies to this third fix-follow-up class. (Origin: a deliberate audited gap in war-room-config-expansion Task 1.2 — the converting plan should carry the intent amendment.)
- **#818 (major)** — `EVIDENCE_RESULT.integratedTipGate` carries only `{ gate_output, tip_sha }` — no `gate_log_path` — even though the evidence-dispatch prompt instructs the refiner to tee the integrated-tip gate re-run to `.war/gate-phase-<id>.log`. The INTEGRATED-TIP GATE-AUDIT seat prompt therefore threads only inline `gate_output`, while `agents/war-auditor.md`'s standing execution-evidence duty makes the captured artifact at a threaded path the *sole* authoritative basis for a HARD provably-unrun finding (missing artifact ⇒ SOFT cannot-confirm). The land-authoritative seat is thus structurally locked out of its own HARD path even when a full log was teed.

## 2. Pivotal constraints

1. **No enum surface moves.** None of these changes adds a task/phase `status` value, a `KNOWN_LAND_DECISIONS` member, or a `HARD_ESCALATION_REASONS` member — `land-decision.mjs` and its hand-mirrored copy in `workflow-template.js` are untouched, so the drift-guard test is exercised but not amended (ADR 0005). Any future drift into enum territory re-triggers the both-copies-plus-drift-guard rule.
2. **Both-surfaces rule.** A change to a dispatched prompt in `workflow-template.js` whose contract is mirrored in a standing `agents/*.md` file must land both surfaces in the same commit. #818 changes the refiner's evidence return contract → `agents/war-refiner.md` (the intra-phase-dep re-run paragraph and the `Return { perTask: [...], integratedTipGate? }` shape line) moves with it. #815 is deliberately *one*-surface: the two merge-task clauses stay byte-identical; only the land-site clause rewords.
3. **Fail-open evidence lane preserved.** The gate-audit evidence path never blocks on absence: #818 makes the authoritative HARD path *reachable* when a log was captured, but an absent/unreadable `gate_log_path` still falls to SOFT cannot-confirm, and #806's fix only narrows the `--mapped` set (a spurious STALE-MISMATCH remains SOFT). No new hold is introduced anywhere in this spec.
4. **ADR 0013 disposition discipline.** Demotions never drop silently. The #805 fix strips routing (`disposition`/`autoFixable`) but keeps `originalSeverity` and the existing pin-mismatch `auditLog` absence-note, so the audit trail is intact.
5. **Anchor by named construct, never line number** — all locators in this spec name functions, constants, labels, or prompt clauses; line numbers rot across the serial merge queue.
6. **Sequencing.** The sibling spec above also amends `workflow-template.js` (entry validation and error routing, #740/#742). Same-file tasks across the two resulting plans must be phase-ordered, per the code-boundary decomposition rule.

## 3. Resolved design tree

| Decision | Resolution |
|---|---|
| #798 — dedup comparator: exact set vs subset containment | Subset containment at the same base sha: a new id-set that is a subset (⊆) of any recorded entry's id-set with equal `baseSha` is a no-op. A non-subset set (including a strict superset) records normally — it carries new information. This matches `baselineDebtClause`'s own COVERED semantics. |
| #805 — pin-mismatch finding routing: filter at aceable vs strip at demotion | Strip at the demotion spread (single collection-site enforcement, same principle the D2 comment already states): delete `disposition` and legacy `autoFixable` in the same `map` that stamps `pinMismatch`/`originalSeverity`. The finding falls to the Nit default (`note`) and can never enter `aceable`. No new filter at the approve-branch loop. |
| #806 — preMergeTip source: filtered chain vs true predecessor | Stamp the pre-merge tip at `landMerged` time: track the last landed integration sha across *every* `landMerged` call (including `requiresTest:false` tasks) and record it on the `mergedTasksForGateAudit` entry when pushed. The `evItems` map reads the stamped value instead of chaining `mergedTasksForGateAudit[i - 1].gateHeadSha`; the first-entry `phaseBaseCmd` fallback is preserved for a null stamp. `landed` stays an array of bare ids — no handoff ripple. |
| #811 — canonicalize punctuation vs anchor-adjacent comment | Comment only. Canonicalizing quote marks before comparison would weaken the byte-identity guarantee the test exists to provide; the `CALIBRATION_RULE_ANCHORS` precedent solves brittleness by avoiding quote-bearing literals in *new* anchors, and for this existing shared-string anchor the cheap fix is a comment stating that any quote-style lint must run identically across all three surfaces in one commit. |
| #815 — reword vs restructure the TMPDIR clause | One-noun reword at the land site only: "the gate's cwd stays the `_refinery` land worktree". The two merge-task sites are correct and stay byte-identical to each other. A resolution note is appended to the source learning. |
| #817 — tier the floorFix spawn vs ratify the gap | One-token change: `...spawn('worker')` → `...spawnWorker('fix')` at the `floorFix` call site, making all three fix-follow-up classes (`fix:`, `ace:`, `add-test:`/`package-it:`) uniformly tier-aware. Absent-config behavior is unchanged (fix tier defaults to inherit-base). |
| #818 — where the artifact path lives | Add optional `gate_log_path` to `EVIDENCE_RESULT.integratedTipGate`; the evidence-dispatch prompt (which already instructs the tee to `.war/gate-phase-<id>.log`) additionally requires returning that absolute path; the INTEGRATED-TIP GATE-AUDIT seat prompt gains a GATE LOG ARTIFACT clause modeled on the per-task seat's `artifactLine` clause (captured file authoritative; missing ⇒ SOFT). `agents/war-refiner.md` mirrors the widened return shape in the same commit. |

## 4. Mechanics

### Engine — `skills/war/assets/workflow-template.js`

- **`recordBaselineDebt` (#798):** replace the exact-key membership test (`baselineDebt.some(d => d.key === key)`) with a containment test: no-op iff some existing entry has equal `baseSha` and the new id-set is a subset of its `ids`. Keep the one-entry-one-backstop invariant and the function's header comment in sync (the comment currently says "dedup on (sorted failing-identifier set, base sha)" — reword to subset-containment semantics in the same commit, per the source-comment-lags-emitted-prompt lesson).
- **Pin-equality demotion in `auditRound` (#805):** in the demotion spread, additionally remove `disposition` and `autoFixable` from the copied finding (destructure-and-drop or explicit `delete`-equivalent in the spread). Update the D2 block comment ("Demotion is findings/verdict-only…") to state that routing metadata is stripped so a demoted finding can never ride `--ace`.
- **`landMerged` + evidence dispatch (#806):** introduce a single tracked variable (e.g. `lastLandedTip`, module-scope beside `mergedTasksForGateAudit`) updated to `pinOrSentinel(mr.integration_sha)` on *every* `landMerged` call; when pushing a `mergedTasksForGateAudit` entry, stamp the value the tracker held *before* this task's update (its true immediate predecessor's tip). In the `evItems` map, use the stamped field with the existing `phaseBaseCmd` fallback for a first/absent stamp. The dep-crossing and `--mapped` prompt prose is unchanged — only the range endpoint becomes topology-true.
- **`floorFix` dispatch (#817):** swap `...spawn('worker')` for `...spawnWorker('fix')` in the dispatch options at the `floorFix` `agent(...)` call (labels `add-test:`/`package-it:`).
- **`EVIDENCE_RESULT` + evidence dispatch + authoritative seat (#818):** add `gate_log_path: { type: 'string' }` to the `integratedTipGate` properties; in the intra-phase-dep branch of the evidence-dispatch prompt, extend the return instruction to `integratedTipGate = { gate_output, tip_sha, gate_log_path }` (the absolute teed path); in the INTEGRATED-TIP GATE-AUDIT seat prompt, thread the path with a clause mirroring the per-task GATE LOG ARTIFACT clause — captured file is the authoritative basis for a HARD provably-unrun finding; missing/unreadable path ⇒ SOFT cannot-confirm; inline `gate_output` stays non-authoritative context. Update the `EVIDENCE_RESULT` header comment.
- **Land-block prompt (#815):** in the land dispatch's step-2 "Merge" clause, replace "the gate's cwd stays the task worktree" with "the gate's cwd stays the `_refinery` land worktree". Touch nothing else in that clause; leave the two merge-task TMPDIR clauses untouched.

### Standing prompts — `agents/war-refiner.md` (#818, same commit as the engine change)

- The intra-phase-dep paragraph ("also **re-run the full gate once at the final integration tip**…") gains the teed-path return: `integratedTipGate: { gate_output, tip_sha, gate_log_path }`.
- The evidence return-shape line (`Return { perTask: [...], integratedTipGate? }`) stays shape-accurate (the optional object now carries the path).
- `agents/war-auditor.md` is deliberately untouched: its execution-evidence standing duty ("read the captured gate-log artifact at the threaded path…") already states exactly the behavior #818 makes reachable.

### Tests — `skills/war/assets/workflow-template.test.mjs`

- **#798:** beside the existing `#598 validation 5+6` exact-set dedup test, add a case where the second task reports a strict subset of the first task's recorded ids at the same `gate_base_sha` — assert exactly one `source:'auto'` backstop entry. Update the existing test's title/assertions if its "same ids" framing narrows (relaxed-assertion-and-title move together).
- **#805:** a pin-mismatched seat returns a `Minor` finding with `disposition:'absorb'` on an ace-eligible file — assert no `ace:` labeled dispatch occurs and the demoted finding carries `pinMismatch`, `originalSeverity`, and no `absorb` routing.
- **#806:** three tasks where the middle one is `requiresTest:false` — assert the third task's evidence-dispatch prompt line carries `preMergeTip` equal to the *middle* task's integration sha, not the first task's `gateHeadSha`.
- **#817:** with an `agents.worker.fix` config override, a floor-tripped task's `add-test:`/`package-it:` dispatch carries the fix-tier spawn opts (same assertion shape as whatever locks `fix:`/`ace:` tiering).
- **#818:** extend the evidence fixture that already returns `integratedTipGate` so it carries `gate_log_path`, and assert the authoritative-seat prompt threads the path with the artifact-authoritative clause; add the absent-path counter-case asserting the SOFT fallback wording.
- **#811:** add the anchor-adjacent comment at `COST_CLAIM_SHARED` naming the three coupled surfaces and the rule that a quote-style lint must run identically across all of them in one commit. Comment-only; the assertions themselves do not change.

### Learnings — `docs/learnings/verbatim-mirror-directive-context-mismatch-at-destination.md` (#815)

Append a resolution note: the land-site mirror of the TMPDIR clause now names its true cwd; the lesson stays hot as the generic pattern record.

## 5. Surface changes

| File | Change |
|---|---|
| `skills/war/assets/workflow-template.js` | `recordBaselineDebt` comparator + comment; `auditRound` demotion spread strips routing metadata + D2 comment; `landMerged` pre-merge-tip stamp + `evItems` consumption; `floorFix` spawn tier; `EVIDENCE_RESULT.integratedTipGate.gate_log_path` + evidence-dispatch and authoritative-seat prompt clauses; land-block cwd noun |
| `skills/war/assets/workflow-template.test.mjs` | new/updated cases per §4; `COST_CLAIM_SHARED` anchor comment |
| `agents/war-refiner.md` | integratedTipGate return contract widened with `gate_log_path` (same commit as the engine change) |
| `docs/learnings/verbatim-mirror-directive-context-mismatch-at-destination.md` | resolution note for the land-site reword |

Not touched (verified couplings): `skills/war/assets/land-decision.mjs` and its drift guard (no enum change); `agents/war-auditor.md` (standing duty already correct); `skills/war/references/schemas.md` (documents `MergeResult.gate_log_path` only; it does not document `EVIDENCE_RESULT` — confirmed by grep before authoring, and re-verify at implementation time).

## 6. New domain terms (CONTEXT.md)

None. All vocabulary used (baseline debt, pin-mismatch demotion, evidence dispatch, integrated-tip gate-audit seat, fix tier) is already established.

## 7. Recommended ADRs

None new. The work executes inside existing decisions: ADR 0005 (fail-open ace path, no `HARD_ESCALATION_REASONS` widening), ADR 0013 (auditor-owned disposition, demotion ladder), ADR 0019 (baseline gate debt), and the ratified both-surfaces prompt rule.

## 8. Open risks / implementation notes

- **#798 superset shape:** a new id-set strictly containing an existing entry records a second entry whose ids overlap the first. Accepted — only subset minting contradicts the clause's semantics; collapsing overlapping supersets is out of scope.
- **#806 first-entry fallback:** the stamped predecessor tip is null for the first landed task; the existing `phaseBaseCmd` fallback must remain byte-identical so a no-`requiresTest:false` phase dispatches an unchanged prompt.
- **#818 partial results:** a refiner that returns `integratedTipGate` without `gate_log_path` (older prompt in flight, partial failure) must land on the SOFT cannot-confirm path, never an error — all `EVIDENCE_RESULT` fields stay optional.
- **#817 intent provenance:** the origin plan (war-room-config-expansion Task 1.2) recorded this exact gap as deliberate; the converting plan's Commander's Intent should note it now closes that recorded gap so an auditor doesn't flag scope creep.
- **Prompt-byte sensitivity:** several existing tests lock dispatched-prompt substrings (e.g. TMPDIR clauses, evidence-dispatch lines). Any clause edit here must run the full `workflow-template.test.mjs` suite and update locked substrings in the same commit — never loosen a lock to pass.
- **Stacking:** if the sibling entry-validation plan lands first, re-anchor by the named constructs in this spec (they are stable across that plan's diff); do not re-derive line positions.

## 9. Non-goals / deferred

- No change to task/phase status enums, `KNOWN_LAND_DECISIONS`, `HARD_ESCALATION_REASONS`, or `land-decision.mjs`.
- No `pinMismatch` filter at the approve-branch routing loop — the upstream demotion strip is the single enforcement site.
- No convergent-unanimity handling for wrong-tree seats (explicitly out of D2's slice per the existing comment; unchanged here).
- No punctuation canonicalization in the `COST_CLAIM_SHARED` assertions.
- No reword of the two (correct) merge-task TMPDIR clauses.
- Entry-validation and worker-report error routing (#740/#742) — the sibling spec owns them.
- Gate/floor shell-script ceilings (#800/#802/#803/#812/#819) and prose-drift sweeps outside dispatched prompts (#799/#804/#808) — other groups.

## 10. Validation criteria

1. `node --test skills/war/assets/workflow-template.test.mjs` is green, including every new case below.
2. **#798:** the new subset case yields exactly one `source:'auto'` baseline backstop for (superset then subset, same base sha); the pre-existing exact-set test still passes with its title updated if its assertion framing changed.
3. **#805:** a pin-mismatched seat's `disposition:'absorb'` finding produces zero `ace:` labeled dispatches; the demoted finding retains `originalSeverity` and `pinMismatch:true` and carries no `disposition`/`autoFixable`.
4. **#806:** with tasks A (gated) → B (`requiresTest:false`) → C (gated), C's evidence-dispatch `preMergeTip` equals B's integration sha; with no `requiresTest:false` task interleaved, the dispatch prompt is byte-identical to today's.
5. **#817:** under an `agents.worker.fix` config override, the `add-test:`/`package-it:` dispatch carries the fix-tier opts; without the override, spawn opts equal today's base-worker opts.
6. **#818:** the evidence fixture with `gate_log_path` produces an authoritative-seat prompt containing the threaded path and the captured-file-authoritative clause; the fixture without it produces the SOFT missing-artifact fallback; `agents/war-refiner.md`'s intra-phase-dep paragraph and return-shape line both name `gate_log_path`.
7. **Token sweep (#815):** `grep -n "cwd stays the task worktree" skills/war/assets/workflow-template.js` returns exactly the two merge-task prompt sites, and `grep -n "cwd stays the _refinery land worktree"` returns exactly the land site. Grep is a floor, not a ceiling: after the grep, hand-scan the same scope — `workflow-template.js` prompt clauses, `workflow-template.test.mjs` test titles/locked substrings, and `agents/war-refiner.md` — for any other mirror of the TMPDIR/cwd clause, and list each straggler found as a survey-derived correction.
8. **Token sweep (#817):** `grep -n "spawn('worker')" skills/war/assets/workflow-template.js` — every remaining match is adjudicated in the plan as deliberately non-tiered (e.g. the initial `work:` dispatch route through `spawnWorker(isDocsTask(...) ? 'docs' : null)` is the tiered form and must not regress). Grep is a floor, not a ceiling: after the grep, hand-scan the same file's dispatch call sites and their adjacent comments plus the test file's tier-assertion titles for any fix-follow-up dispatch the token sweep missed, and list each straggler as a survey-derived correction.
9. **Token sweep (#818):** `grep -rn "integratedTipGate" skills/war/assets/workflow-template.js skills/war/assets/workflow-template.test.mjs agents/war-refiner.md` — every match is updated or confirmed consistent with the widened `{ gate_output, tip_sha, gate_log_path }` shape. Grep is a floor, not a ceiling: after the grep, hand-scan the same scope's comments and test titles (the `EVIDENCE_RESULT` header comment, the intra-phase-dep prompt branch, the refiner's return-shape prose) for stale two-field descriptions of the object, and list each straggler as a survey-derived correction.
10. **#811:** the `COST_CLAIM_SHARED` declaration carries an adjacent comment naming its three coupled surfaces and requiring any quote-style lint to run across all three in one commit.
11. **#815 learning:** the source learning file carries the resolution note; the redaction lint (`node skills/_shared/war-memory.mjs lint docs/learnings/`) stays green.
12. All engine behavior changes are invisible at the fail-open boundaries: absent `gate_log_path` ⇒ SOFT; absent `agents.worker.fix` config ⇒ base tier; empty `baselineDebt` ⇒ byte-identical prompts.
