# Engine recovery, relaunch and land — make land confirm, pin proof, relaunch provision and provenance wording truthful and safe

Drafted by the `/war-machine` drafter from `docs/specs/2026-11-08-engine-recovery-relaunch-and-land-design.md`
(Part 1 is its decision digest; every spec ledger row is carried forward or retired with a stated reason).
Campaign chain position: third of nine. This plan stacks on
`docs/plans/2026-11-08-auditor-and-worker-guard-habits.md`, which stacks on
`docs/plans/2026-11-08-args-floor-and-launch-preflight.md`. It lands before
`docs/plans/2026-11-08-engine-findings-ace-and-late-fix.md`.

Issues claimed (29): #1823, #1910, #2328, #2412, #2442, #2494, #2495, #2509, #2555, #2575, #2588, #2589,
#2590, #2645, #2646, #2657, #2659, #2662, #2669, #2670, #2671, #2699, #2700, #2701, #2702, #2703, #2704,
#2705, #2750. #2669–#2671 are one run's friction reports (83f08e8c, the Aligned repo), folded after conversion; the
rows of theirs this plan does not own are listed in `## Non-goals / deferred` with their owner. #2699–#2705
are the seven survey-derived residuals the 2026-11-08 evidence fold first recorded in Non-goals; the operator
ruled them campaign work, they were filed, and context L claims each.

Tree facts below were read at `365f3da2`, whose only change over master `35aa4144` is the nine survey
specs under `docs/specs/` (verified: `git diff --stat 35aa4144 365f3da2` at 365f3da2). Code facts are cited
"at 35aa4144".

**Evidence consumed** — one row per linked evidence artifact, whatever the issue calls its section
(`## Evidence`, `## Evidence artifacts`, an evidence table); issues whose body links no artifact are
vacuously satisfied: #2494, #2495, #2555, #2575, #2588, #2646, #2670, #2671:
- #2645 · Workflow journals `wf_5ef7a051-efa` (0 agents, 33 ms), `wf_f840d83e-26e` (127 agents, 10 `failed`), `wf_7e758fde-fea` (provision only) · unread — harness journals, not on this machine; the issue's own table carries the counts this plan uses, and its `## Hypotheses (not proven)` rows stay unproven here (A19 is assumed; the prologue cause is refuted by TRIAL-1)
- #2669 · the full review file under `.claude/war/runs/` in the Aligned main checkout (untracked) · unread — out of repo; the three issue bodies carry every row this plan uses
- #2589 · result JSON and journal under an out-of-repo reports directory (`phases/`, p3held) · read 2026-11-08 in the retired corpus — DocTrail Aligned/reports/2026-10-30-aligned-campaign-2/campaigns/2026-10-30-mobile-v1-corrections/lead-tools/plan-6/result-p3held.json carries the `StructuredOutput retry cap (5) exceeded — 5 failed calls with no valid output` text; the issue body's symptom text (malformed `{"remote_sha": }` ×5, cap tripped, 4 tasks merged) is the fact used
- #2590 · result JSON in the same out-of-repo bundle (p4held) · read 2026-11-08 in the retired corpus — DocTrail Aligned/reports/2026-10-30-channels-and-runner/phases/result-p4held.json shows `pre_tree` and `approved_tree` equal after the approved subset ace; root cause stays unknown (A7)
- #1910 · `journal.jsonl` and agent transcripts of `wf_4507b840-3e3` · unread — not on this machine; the issue's split counts (22 before, 28 after, 5 replayed) are the fact used
- #2509 · journals of `wf_1e75eb8d-8c6` (0 agents, #1413 floor) and `wf_f525c164-502` (dropped `ace:reentry` return) · unread — not on this machine; both rows are deferred to sibling plans or already covered (Non-goals)
- #2328 · the two verbatim death strings in the body ("Your organization has disabled Claude subscription access…", "Failed to authenticate. API Error: 401 OAuth access token has expired.") · read — they are the D12 positive fixtures
- #2412 · evidence table in the body (`ENOTFOUND`, 401 rows) · read
- #2442 · evidence table in the body (row 5, the moved-worktree journal loss) · read
- #1823 · `skills/war/assets/provision-worktrees.sh` (`cmd_ensure_refinery_worktree`, the `WORKTREE_HYGIENE` emitter) · read
- #1823 · `skills/war/references/resume-and-recovery.md` (§ Recovery relaunch) · read
- #1823 · `skills/war/assets/workflow-template.js` (`worktreeHygieneClause`) · read
- #2657 · `skills/war/assets/provision-worktrees.sh` (`cmd_land_advance`, PHANTOM LAND and ALREADY LANDED arms) · read
- #2657 · `skills/war/assets/workflow-template.js` (`RELAND_CAS`, `landErrorArm`, `relandDiscrimination`, `landPrompt`) · read
- #2657 · `skills/war/references/refiner-recovery.md` (§ Reland discrimination, the D4 retry clause) · read
- #2657 · `agents/war-refiner.md` (§ land-phase, the two exit bullets) · read
- #2657 · `docs/learnings/a-land-advance-rerun-after-a-lost-exit-code-reads-as-a-phantom-land-exit-3.md` · read
- #2659 · `skills/war/assets/workflow-template.js` (`taskProvenanceClause`, `deriveSkipClause`) · read
- #2659 · `agents/war-worker.md` (step 5) · read
- #2659 · `skills/war/assets/task-integrated.sh` (header, last line) · read
- #2659 · `docs/learnings/changing-a-proofs-source-leaves-the-old-input-producer-instruction-live.md` · read
- #2659 · `docs/plans/2026-10-28-blocked-ace-and-merge-provenance.md` · unread — the file exists; the lesson and the live `task-integrated.sh` header carry the one fact this plan uses (merge-commit provenance needs no worker trailer)
- #2659 · plan #2485 · unread — same reason as the row above
- #2662 · `skills/war/assets/workflow-template.js` (`NEVER_MOVE_MERGED`, `neverMoveStep`, probe step (2)) · read
- #2662 · `skills/war/assets/workflow-template.engine-1.test.mjs` (`2485/ES9`) · read
- #2662 · `agents/war-refiner.md` (merge-task step 1) · read
- #2662 · `docs/learnings/never-move-report-it-merged-sentence-resolves-to-a-hold-not-a-recorded-merge.md` · read
- #2662 · #2485, #1895 · unread — the lesson states the #1895 regression guard the hold keeps; this plan keeps the hold unchanged
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-27-aligned-campaign-1 · read: `war/runs/dee61ebe-5be1-470f-92fc-dc81a8dbf044.json`, `teams/4db2fccb-e4be-4aa3-a78d-c8b65d238b07/ledger.json`, `war/runs/0d9b818b-461b-4424-8493-df801349148f.json`, `war/runs/4ca1b81a-d0fa-489d-8d05-a4e139189a6c/return-p1.json`; rows only for `war/runs/9ab30574-8691-4e4e-9c8a-aa486a6d76ec.json`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-aligned-campaign-2 · read: `campaigns/2026-10-30-mobile-v1-corrections/lead-tools/plan-6/result-p3held.json`, `analysis.md`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-board-mcp · read: `phases/result-p3.json`, `phases/result-p3held2.json`, `phases/result-p2held.json`, `lead/launch.sh`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-channels-and-runner · read: `phases/journal-p2.jsonl`, `phases/result-p4held.json`, `analysis.md`; rows only for `campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-docs-mirror · read: `lead/rulings-p1.md`, `campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md`, `war/runs/b2197eb4-5786-4a59-bf26-c2a0bd20fe68.json`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-mobile-v1-corrections · read: `campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-proof-of-contemplation · read: `phases/result-p1held2.json`, `lead/issue-2497-comment.md`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-10-30-war-strategy-adapter · read: `phases/result-p1held.json`, `phases/result-p1.json`, `analysis.md`, `phases/journal-p1held.jsonl`, `war/runs/02574030-ee20-47d4-ba54-c39fd2cc7b61.json`
- Survey fold 2026-11-08 · DocTrail Aligned/reports/2026-11-05-user-never-waits · read: `workflows/wf_bcdabb0e-f8b.json`, `workflows/wf_2d0c14e9-12c.json`
- Survey fold 2026-11-08 · DocTrail WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool · read: `journals/wf_f525c164-502/journal.jsonl`
- Survey fold 2026-11-08 · DocTrail WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout · read: `CORRECTIONS.md`, `timeline.md`, `war/runs/e98b59fa-d759-41bf-8f87-6405579bccfa.json`
- Survey fold 2026-11-08 · DocTrail WorkAuditRefine/reports/2026-10-28-blocked-ace-and-merge-provenance · read: `lead/reports/p2-report.md`, `lead/reports/p3-report.md`, `teams/f4aaf5fa-d874-44f3-b1d2-8de1fdc9b894/ledger.json`
- Survey fold 2026-11-08 · DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run · read: `war/runs/a5fc17cc-c938-4126-8bae-0be9bb0c6beb-review.md`, `lead/issues/review-issue.md`, `war/runs/a5fc17cc-c938-4126-8bae-0be9bb0c6beb.json`, `war/runs/bf901c3d-66d1-409d-8df7-7add08a58b6e/args-p6.json`, `results/p6b-wjytsvokj.output`, `lead/issues/item24-comments/c2562.md`, `lead/reports/p3-report.md`
- Survey fold 2026-11-08 · DocTrail WorkAuditRefine/reports/2026-11-06-session-worktree-leftovers · read: `war-fable-opus-audit-loops-0592b7/files/.claude/campaigns/2026-09-06-survey-debt/CAMPAIGN-STATE.md`
- Survey fold 2026-11-08 · DocLot AutoIndex/pr-1119 · read: `96cfe3c658aecf7b98e9611835f29dd3c81de9e3/README.md`, `96cfe3c658aecf7b98e9611835f29dd3c81de9e3/logs/p2a1-agents.csv`
- Survey fold 2026-11-08 · DocLot AutoIndex/pr-795 · read: `dc27b35406c6b4704b0b3d11a0c3bcfe9e6c9675/logs/workflow/p2-a7-engine-log.json`, `dc27b35406c6b4704b0b3d11a0c3bcfe9e6c9675/logs/run-manifests/` (eight manifests listed)
- #2699, #2700, #2701, #2702, #2703, #2704, #2705 · each body's `## Evidence artifacts` section names one DocTrail row already read in the survey-fold rows above (`return-p1.json`, `war-strategy-adapter/analysis.md`, `p6b-wjytsvokj.output`, `c2562.md`, `journal-p1held.jsonl`, `issue-2497-comment.md`, the `session-worktree-leftovers` `CAMPAIGN-STATE.md`) plus tree constructs · read 2026-11-08: the constructs were re-opened at 279a0d4a (context L); #2704 also names #2497 · unread — the comment file carries the one row this plan uses

**Trials run** — one row per trial:
bounds: wall 600 s · cmd 120 s · excerpt 20 · config: .claude/war/config.json (section present) · overrides: none · trial tier: opus/default (config)
tokens: n/a · wall: 4 min (source: n/a)
escape-guard: clean
- TRIAL-1 · fact · does an args-prologue throw already reach the top-level catch that builds `workflowError`? · settles: D13 (PIN-13, PIN-25) · if yes: drop the prologue wrap, keep `dispatchFailures` · if no: wrap the prologue as the spec says · bound: wall 600 s · cmd 120 s · base: 365f3da2 · sandbox: <scratchpad>/trial-1 · guard: snapshot 0 / baseline 0 · cap: unenforced — `timeout 300` was set, above the 120 s bound; the run took under 30 s · result: settled — yes. The first column-0 `try {` opens before `const A`; only `export const meta`, schema literals, accumulators, `pt` and the staged `EMBEDDED_ARGS` JSON literal sit above it, and none of them throws at load · removed: <scratchpad>/trial-1 · wall: 2 min
    ```
    command: node --test --test-reporter=tap --test-name-pattern="criterion 2 — a scalar args string" skills/war/assets/workflow-template.engine-1.test.mjs
    observed: ok 1 - criterion 2 — a scalar args string ('null'/'true'/'5') RETURNS held:workflow-error naming the JSON-object guard, dispatches ZERO agents, renders phase:null
    observed: # tests 1 · # pass 1 · # fail 0
    command: awk 'NR<588 && /throw /' skills/war/assets/workflow-template.js
    observed: one hit, inside the `pt` function body (it runs only when a prompt is built, inside the try)
    ```
- TRIAL-2 · sweep · End-state checks red at base · base: 365f3da2 · sandbox: none · bound: wall 600 s · cmd 120 s · cap: unenforced · result: infra-failed — dirty tree (the escape-guard snapshot exited 1 on a sibling drafter's untracked `docs/plans/2026-11-08-args-floor-and-launch-preflight.md`) · the grep checks were read in the checkout instead, read-only: `fill-defaults` 0, `transcriptDir` 0, `ls-remote origin refs/heads` 0, `exits 0 via Task 1.1` 1, `and report it merged` 1 in each of the engine and the refiner card, `preprovision-` 0, `refinery: true` 0, `merge-base --is-ancestor origin/` 0, `prior-manifest` 0, `git_error` 0, `WAR-Task` on the worker card 1; every named test-name token is absent at base (no such test exists) · reach walk: each End state below names its owning task · wall: 1 min
- TRIAL-3 · fact · can a staged phase script load its args from a sibling script through `workflow({ scriptPath })`? · settles: D38 · base: 7e70e874 · sandbox: `.claude/red-team/trial-args/` (a 387 B parent and a 110,379 B child holding plan 2026-11-08-auditor-and-worker-guard-habits phase 1 args) · result: settled, yes. The parent got an object back with 22 keys, 6 tasks, the right `runId` and 109,925 B of JSON, with 0 agents in 23 ms (Workflow run wf_b792e04d-c79) · wall: 1 min

**Critical path:**
- End states 5, 33 and 34 ← T1.2 (Phase 1's first wave: T1.1 depends on it through `deps: [1.2]`, because the args sibling script frees the staged room T1.1's engine growth needs).
- End states 1–4 ← T1.1 (bottleneck: the Phase 1 chain is T1.2 then T1.1; T1.1 is Phase 1's single `workflow-template.js` owner and every later phase rebases onto its engine).
- End states 6–9 ← T2.1.
- End states 10–14 ← T3.1.
- End states 15–17 ← T4.1; End state 18 ← T4.2 (independent chain, same wave).
- End state 19 ← T5.1.
- End state 20 is a guardrail End state with no owning task (green at base by design; every task must keep it green).
- End states 21–23 ← T4.1, T3.1 and T4.2 (the #2669/#2670/#2671 fold; each rides an existing task, no new chain link).
- End state 24 ← T4.2; End state 25 ← T2.1 (the 2026-11-08 survey-evidence fold; each rides an existing task, no new chain link).
- End state 26 ← T1.1; End states 29 and 31 ← T2.1; End state 30 ← T3.1; End states 27 and 28 ← T4.1; End state 32 ← T4.2
  (the #2699–#2705 claims; each rides an existing task, no new chain link).
- Phases 2–4 are serial only because `skills/war/assets/workflow-template.js` has one owner per phase. Their chains share no other link.

## Context — the gap / problem

All 29 claimed issues are open (verified: `gh issue view` on each, 2026-11-09) (verified: issue state read for each number, 2026-11-08). They touch one
area: what the engine and the refiner do when a phase dies, is relaunched, moves an approved pin, or lands.
The engine is `skills/war/assets/workflow-template.js` (810,684 B) (verified: `wc -c` at 35aa4144). Its
standing prompt twins are `agents/war-refiner.md` and `agents/war-worker.md`. Recovery is common and costly in
the retired runs: in one campaign 9 of 16 runs were recoveries or relaunches of held runs (verified: DocTrail
Aligned/reports/2026-10-30-aligned-campaign-2/analysis.md, WAR 0.21.35); in one plan the three held runs took
47% of its subagent tokens, 22,660,717 (verified: DocTrail Aligned/reports/2026-10-30-channels-and-runner/analysis.md,
WAR 0.21.35); one phase took 7 Workflow attempts, and the 6 non-landing attempts spent 30.7M of its 42.1M tokens
(verified: DocLot AutoIndex/pr-795/dc27b35406c6b4704b0b3d11a0c3bcfe9e6c9675/logs/workflow/p2-a7-engine-log.json,
WAR 0.21.15).

**A. Land confirm (#2657).** `cmd_land_advance` exits 3 (`EX_FOREIGN`) as a PHANTOM LAND when the pre-push
origin tip and the local follower both equal `<new-sha>` (verified: the PHANTOM LAND arm of
`cmd_land_advance` at 35aa4144). A rerun after a push that worked, but whose exit code the refiner lost, hits
that arm (verified: issue #2657 (2026-11-08)). The same lost-exit-code rerun read exit 3 on the phantom-land arm
in another run's phase 7 (verified: DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/war/runs/a5fc17cc-c938-4126-8bae-0be9bb0c6beb-review.md,
WAR 0.21.35). `RELAND_CAS` says "on any exit but 0 or 2" then
`landErrorArm`; `landPrompt` says "On any other exit from land-advance" then `landErrorArm`;
`relandDiscrimination` routes its extra-attempt failure and its "still exits 3" server-side case to
`landErrorArm` (verified: those three constructs at 35aa4144). The card's land-phase bullets say the same
(verified: `agents/war-refiner.md` § Superproject phase, the "Land-advance escalate" and "Server-side push
error" bullets at 35aa4144). The D4 clause in `skills/war/references/refiner-recovery.md` § Reland
discrimination says the retry "exits 0 via Task 1.1's already-landed reconciliation", which is true only
when the follower lags (verified: that clause and the ALREADY LANDED comment in `cmd_land_advance` at
35aa4144). Every land dispatch goes through `segmentedLand` → `reconciledMerge` → `confirmMerge`, which reads
origin with `git ls-remote` on its own (verified: `segmentedLand`, `reconciledMerge`, `confirmMerge` at
35aa4144). So a refiner `landed` claim is checked in Git. The `landErrorArm` return is `status: 'error'`,
which `uncertainMerge` admits, so today a phantom-land exit 3 after a real push does not hold the phase: it
enters `reconcileMerge`, whose LAND RECOVERY prompt tells the refiner to find the already-pushed phase
commit with parents `[snapshot remote_sha, snapshot source_sha]` and reuse it (verified: `uncertainMerge`,
`reconcileMerge`'s LAND RECOVERY branch at 35aa4144; the `Git reconciliation: <site> post-push response
loss reuses the actual phase commit` fixture in `workflow-template.git-4.test.mjs` proves the reuse for a
dispatch death, and the `status: 'error'` variant takes the same `uncertainMerge` route by code reading, no
fixture run). The harm left in #2657 is therefore one extra `merge-reconcile` dispatch on the recovery
tier, a second full gate run at the landed commit, and a refiner report that calls a finished land an
error; a hold follows only when reconciliation also fails `roundLimit` times. The land confirm removes
that cost and the misreport.

**B. Never-move wording (#2662).** `NEVER_MOVE_MERGED` ends "and report it merged." The engine never records
a merge from that report: probe step (2) returns `empty-unmatched`, and a merge step (a) `merged` reply fails
the Git match and holds (verified: issue #2662 (2026-11-08); `const NEVER_MOVE_MERGED`, `neverMoveStep` at
35aa4144). Three audit seats noted the same gap in an earlier run's phase 2, none filed it, and the servitor
recorded it as a lesson (verified: DocTrail WorkAuditRefine/reports/2026-10-28-blocked-ace-and-merge-provenance/lead/reports/p2-report.md,
WAR 0.21.19). The hold guards the #1895 regression; only the words mislead. `2485/ES9` pins the sentence
(verified: the `NEVER_MOVE_SENTENCE` assertion in `workflow-template.engine-1.test.mjs` at 35aa4144). The
card's merge-task step 1 carries it (verified: `agents/war-refiner.md` § merge-task step 1 at 35aa4144). A
different sentence in the reconcile prompt, "an existing such merge commit IS the merge: report it merged",
is correct there, because reconcile records merges from Git (verified: its assertion in
`workflow-template.git-4.test.mjs` at 35aa4144).

**C. Pin proof dies the whole phase (#2589).** `verifyPinTransfer` loops `roundLimit` times over a
`git-pin:` dispatch with schema `PIN_GIT_PROOF`, which requires only `remote_sha` (verified: at 35aa4144).
`dispatchSite` turns only `INFRA_DEATH_RE` matches into a soft death record; any other dispatch-layer throw
rethrows HARD to the top-level catch (verified: `dispatchDied` at 35aa4144). A malformed StructuredOutput
past the harness cap held the phase `held:workflow-error` with 4 tasks merged (verified: issue #2589
(2026-11-04)). The retired result carries the five replies as `StructuredOutput retry cap (5) exceeded — 5
failed calls with no valid output` (verified: DocTrail Aligned/reports/2026-10-30-aligned-campaign-2/campaigns/2026-10-30-mobile-v1-corrections/lead-tools/plan-6/result-p3held.json,
WAR 0.21.35). The per-task `pin-transfer:unverified` hold already exists and lets siblings merge (verified:
the `!pinProof` arm in the merge slot at 35aa4144). `mergeSnapshot` dispatches `git-pin-snapshot:` and
`git-snapshot:` through the same `dispatchSite` (verified: at 35aa4144).

**D. Approved ace tree not advanced (#2590).** After a subset-mode approved ace, the pin proof still compared
the pre-ace tree (verified: issue #2590 (2026-11-04)). The retired result shows `pre_tree` and `approved_tree`
both at `6f517e30…` after the approved subset ace, with one ace file in the diff (verified: DocTrail
Aligned/reports/2026-10-30-channels-and-runner/phases/result-p4held.json, WAR 0.21.35). `approvedShaOf` returns `r.aceSha`, else the first
seat `audit_sha`; `r.aceSha` is set at the aceBisect subset arm, the aceReentry arm and the wave-side ace
arm; `registerRangeRevert` reads `approvedShaOf` (verified: at 35aa4144). A fourth site sets `r.seats`
without touching `r.aceSha`: the merge-slot pin-transfer `mismatch` re-audit (`r.seats = rbSeats`, after
`probeRow('mismatch', rbSeats)`), so a prior ace's `r.aceSha` survives that later full-panel re-approval
and `approvedShaOf` still returns it (verified: the four `r.seats =` and three `r.aceSha =` assignments at
35aa4144). The root cause is not known; this fourth site is a candidate, not a finding.

**E. Relaunch destroys or blocks work.**
- `provisionStep` interpolates `PROVISION_CLEAN_LINE` (`git checkout -- .`). On a recovery relaunch the
  reused task worktree lost about 720 lines of a dead worker's edits (verified: issue #2588 (2026-11-04);
  `PROVISION_CLEAN_LINE` header comment at 35aa4144). The phase-2 journal of that run shows the dispatched clean
  line discarded six tracked edits of the prior worker and kept only the untracked files, reported in free text
  (verified: DocTrail Aligned/reports/2026-10-30-channels-and-runner/phases/journal-p2.jsonl, WAR 0.21.33).
  Workers leave such edits when the harness asks for the result before a gate rerun finishes under machine load
  (verified: DocTrail Aligned/reports/2026-10-30-board-mcp/phases/result-p2held.json, WAR 0.21.31), and the only
  save path so far is a Lead's hand patch (verified: DocTrail
  WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout/timeline.md, WAR 0.21.19). `.war/` is
  git-excluded by every provision run (verified: `PROVISION_TREE_LINE` at 35aa4144).
- `STALE_PRIOR_ATTEMPT_RULE` rides `depClause` beside `FORCE_WITH_LEASE_RULE`, and the worker card carries it
  (verified: at 35aa4144). A recovery worker that rebased its own reused branch could not push (verified:
  issue #2646 (2026-11-06)). The issue also says the host auto-mode classifier blocked the force push
  (verified: issue #2646 (2026-11-06)). A host-denied lease push is not rare: workers reported one and stopped
  in four retired runs — the permission system on 0.21.18 (verified: DocTrail
  WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool/journals/wf_f525c164-502/journal.jsonl, WAR 0.21.18),
  the auto-mode classifier twice on 0.21.31 (verified: DocTrail
  Aligned/reports/2026-10-30-proof-of-contemplation/phases/result-p1held2.json, WAR 0.21.31; DocTrail
  Aligned/reports/2026-10-30-board-mcp/phases/result-p3held2.json, WAR 0.21.31) and again on 0.21.37 (verified:
  DocTrail Aligned/reports/2026-11-05-user-never-waits/workflows/wf_2d0c14e9-12c.json, WAR 0.21.37). Any relaunch
  that rebases a reused branch whose tip is already pushed needs the lease, because the plain push is
  non-fast-forward; one such attempt spent 423,527 tokens to reach that wall (verified: DocTrail
  Aligned/reports/2026-10-30-proof-of-contemplation/phases/result-p1held2.json, WAR 0.21.31).
- In a sanctioned recovery, preMerged tasks never set `lastLandedTip`, so the first fresh merge stamps
  `preMergeTip: null`, and the gate-audit falls back to `phaseBaseCmd` (verified: issue #2575 (2026-11-02);
  `landMerged`'s `predTip`, `preMergeTip: m.preMergeTip || phaseBaseCmd` at 35aa4144). The landed phase-3 result
  of that run shows the gate-audit dispatched with `preMergeTip` at the phase merge-base, so the mapped set
  pulled in five other tasks' files and the gate pin read STALE-MISMATCH (verified: DocTrail
  Aligned/reports/2026-10-30-board-mcp/phases/result-p3.json, WAR 0.21.33). `task-integrated.sh`
  prints `TASK_INTEGRATED <branch> <merge_commit> <integration_tip>` (verified: its last line at 35aa4144).
- `assert-args-complete.mjs` has no plugin-identity check; `launch-identity.md` states the same-root,
  same-version rule as doctrine only (verified: issue #2495 (2026-10-29); grep `plugin` empty in
  `assert-args-complete.mjs` at 35aa4144). The manifest records `pluginRoot` and `pluginVersion` (verified:
  `run-manifest.md` field table at 35aa4144). That `pluginVersion` is Lead-stamped: a launch script hard-codes
  it per phase row, and one manifest carries 0.21.33 on phase 3 beside 0.21.31 on phases 1 and 2 (verified:
  DocTrail Aligned/reports/2026-10-30-board-mcp/lead/launch.sh, WAR 0.21.33); in another run the stamp named
  the staged template's 0.21.18 while hook paths in the phase 2 and 3 transcripts show 0.21.19 after a mid-run
  plugin update (verified: DocTrail WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout/CORRECTIONS.md,
  WAR 0.21.19). D10 compares against that field; Open decision 4 asks what a mid-run update means for it.

**F. Deaths with no text.**
- A resolved null at the implementation, fix-round, floor-fix, late-fix and wave-side ace sites reads
  `blockedReason`'s "worker returned no result"; only the aceBisect subset and re-entry sites use `nullDied`
  (verified: issue #2555 (2026-10-31); the `blockedReason(` and `nullDied(` call sites at 35aa4144). At the
  late-fix site a null takes the "no reviewable commit" continue, not a HARD escalate (verified: the
  `wWhy` arm at 35aa4144).
- `INFRA_DEATH_RE` has no 401, OAuth, subscription or DNS term (verified: issues #2328 (2026-09-24), #2412
  (2026-10-22), #2442 (2026-10-26); `const INFRA_DEATH_RE` at 35aa4144). The two #2328 strings are verbatim
  in the issue body; #2412 and #2442 name `ENOTFOUND` and `401` only — no issue names `getaddrinfo` or
  `EAI_AGAIN` (verified: issue bodies read 2026-11-08). A bare `401`, `oauth` or `subscription` term would
  also match a SHA fragment (`4019abc`), a task id (`t401`) or a title word (`oauth module`) in a tagged
  dispatch-layer message (verified: `node -e` regex probe at 365f3da2); the untagged engine-throw case is
  already HARD by the structural `warDispatchDeath` scope, so it proves nothing about the regex. A usage-limit
  death on 0.21.18 held a phase `held:workflow-error` with 19 agent errors — 12 audit seats, one ace worker and
  six `git-pin-snapshot` dispatches (verified: DocLot AutoIndex/pr-1119/96cfe3c658aecf7b98e9611835f29dd3c81de9e3/README.md,
  WAR 0.21.18); the corpus quotes no harness text for it, so D12 adds no term for it (backstop row 3).
- A non-infra dispatch-layer throw at `git-pin:` or `git-pin-snapshot:` (for example the harness's
  "StructuredOutput retry cap exceeded") returns `held:workflow-error` on its first attempt today
  (verified: the grill's sandbox run of both labels at 365f3da2). `mergeSnapshot`'s exhaustion tail returns
  `before` only when `deathOf(before)` is set; otherwise it throws `Git merge snapshot unavailable before
  <label>; no merge dispatched`, which is HARD (verified: the tail of `mergeSnapshot` at 35aa4144). One phase on
  0.21.30 took that throw at land after all four tasks merged, because the Lead had pushed the working branch to
  origin only and no local ref existed; the hold text named the site and not the cause, and the held attempt
  cost 87 minutes and 5,044,045 tokens before the relaunch (verified: DocTrail
  Aligned/reports/2026-10-30-war-strategy-adapter/phases/result-p1held.json, WAR 0.21.30; DocTrail
  Aligned/reports/2026-10-30-war-strategy-adapter/war/runs/02574030-ee20-47d4-ba54-c39fd2cc7b61.json, WAR 0.21.30).
  T2.1's D4 message extension covers it (End state 25).
- A 0-agent, 33 ms death left no error text, and failed audit and `git-pin-snapshot` seats left no per-seat
  reason (verified: issue #2645 (2026-11-06)). The spec's cause, a throw in an args prologue outside the
  try, does not hold at 35aa4144 (verified: TRIAL-1 at 365f3da2).

**G. Provenance wording.** `taskProvenanceClause` asks workers for a `WAR-Task: <branch>` trailer at the
implementation and fix-round prompts, and the worker card step 5 asks the same (verified: at 35aa4144). The
proof reads only the engine's merge commit; `task-integrated.sh` says "Worker commits need no trailer"
(verified: issue #2659 (2026-11-08); its header at 35aa4144). `workflow-template.recovery.test.mjs` pins the
old sentence (verified: the `TASK PROVENANCE: put the exact trailer` assertion at 35aa4144). A phase-3 audit note
in the run that landed the merge-commit proof already said the clause still asks for the trailer (verified:
DocTrail WorkAuditRefine/reports/2026-10-28-blocked-ace-and-merge-provenance/lead/reports/p3-report.md, WAR
0.21.19). The kept one-trailer-block sentence has a run behind it: a trailer outside the final paragraph lost an
`Ace-Charge` in the #2485 hold, and the Lead carries that as a standing gotcha (verified: DocTrail
Aligned/reports/2026-10-30-channels-and-runner/campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md, WAR
0.21.26). An ace worker
read a sibling's commit message from a shared scratchpad file (verified: issue #2494 (2026-10-29)). The
guard-habits plan lands the write half (`.war/commit-msg.txt` through Write) first [assumed: its spec D10
lands as written — if wrong: T3.1 lands the whole sentence, write and read halves].

**H. Hygiene markers (#1823).** `cmd_ensure_refinery_worktree` emits `WORKTREE_HYGIENE` markers, but
`worktreeHygieneClause` scopes capture to "an ensure-worktree REUSE" keyed by task id (verified: at
35aa4144).

**I. Runbook (#1910, #2328, #2442).** `resume-and-recovery.md` has no `--fill-defaults` line and no
`transcriptDir` check (verified: grep counts 0 at 35aa4144). `war-config.mjs` has `--fill-defaults`
(verified: at 35aa4144). The harness journal key is out of repo (verified: issue #1910 (2026-08-28)). A relaunch
after a wholesale usage-limit death (27 of 37 agents errored, no return file) kept the WIP commits and landed 20
of 20 End states (verified: DocTrail Aligned/reports/2026-10-27-aligned-campaign-1/war/runs/9ab30574-8691-4e4e-9c8a-aa486a6d76ec.json,
WAR 0.21.18).

**J. Tests that already pin changed text.** Engine-1 pins the old never-move sentence (`2485/ES9`), the
old exit-3 server-side text of `relandDiscrimination`, and the null worker's default reason; recovery pins
the old trailer sentence (verified: grep of each sentence across `skills/war/assets/*.test.mjs` at
35aa4144). An engine task that changes such text without its pin reds its own gate.

**K. One run, three friction reports (#2669, #2670, #2671).** Run 83f08e8c (the Aligned repo, plugin
0.21.36 then 0.21.37) landed six phases, and phase 1 took six attempts (verified: issues #2669, #2670, #2671
(2026-11-08)). Three row groups are this plan's:
- *Owned-file miss on relaunch.* Attempt 2 died `held:workflow-error` in 12 s with one agent: "integration
  branch not in owned-file". The relaunch reused the integration branch attempt 1 cut, and that branch was
  missing from `args.ownedFile`; the Lead ran `record-as-owned` and relaunched (verified: issue #2671 row 1,
  #2670 row 1, #2669 row 1 (2026-11-08)). The barrier's step 2 is `ensure-integration <slug> <N> <working
  branch> --owned-file <args.ownedFile>`, and `cmd_ensure_integration` dies `EX_FOREIGN` on an existing
  branch the ledger does not list (verified: `const ownedFile = A.ownedFile`, the barrier step 2 line and the
  "foreign branch … not owned by this run" die at 279a0d4a). Only the integration branch is ownership-gated
  at the barrier: `record_owned_file` is called from the `ensure-integration` cut path, `record-as-owned` and
  `resolve-working-branch`, and `cmd_ensure_worktree` reads no owned set (verified: the `record_owned_file`
  and `owned_file` call sites at 279a0d4a). `cmd_record_as_owned` proves `git merge-base --is-ancestor <base>
  <branch>`, prints the ahead-commits and appends the ref idempotently; it moves no ref (verified:
  `cmd_record_as_owned` at 279a0d4a). The runbook already gives the Lead this duty (the "Owned-file
  continuity" bullet and step 3 of the held-partial-phase runbook) (verified: `resume-and-recovery.md`
  § Recovery relaunch at 279a0d4a); the run shows a prose duty is skipped under pressure. The two
  recovery-gated barrier clauses `deriveSkipClause` and `holderFreeClause` are the shape for a mechanical
  arm, and the `recovery absent (criterion 10)` fixture already lets the sanctioned barrier prompt differ from
  the recovery-absent one (verified: both consts and that test at 279a0d4a). Attempt 1's args carried no
  `ownedFile` key at all, so its cut was never recorded; attempts 2 and 3 carried the key (verified: DocTrail
  Aligned/reports/2026-11-05-user-never-waits/workflows/wf_bcdabb0e-f8b.json, WAR 0.21.37). Across the retired
  runs every sanctioned relaunch threaded the prior run's owned file by hand, because the new run's team
  directory holds none (verified: DocTrail Aligned/reports/2026-10-30-mobile-v1-corrections/campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md,
  WAR 0.21.26; DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/war/runs/bf901c3d-66d1-409d-8df7-7add08a58b6e/args-p6.json,
  WAR 0.21.35). When it was threaded, adoption worked: one relaunch landed 8 of 8 tasks with six adopted through
  `record-as-owned`, every commit mapped (verified: DocTrail Aligned/reports/2026-10-30-docs-mirror/campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md,
  WAR 0.21.35), and a four-task relaunch took 7 agents and 415,414 tokens against 76 agents and 5,044,045 for the
  held attempt (verified: DocTrail Aligned/reports/2026-10-30-war-strategy-adapter/phases/result-p1.json, WAR
  0.21.30). Before adoption existed, a relaunch re-dispatched 9 already-merged tasks and landed none (verified:
  DocTrail Aligned/reports/2026-10-27-aligned-campaign-1/war/runs/dee61ebe-5be1-470f-92fc-dc81a8dbf044.json, WAR
  0.21.18), and another re-ran a five-task DAG for 14,078,555 tokens (verified: DocLot
  AutoIndex/pr-1119/96cfe3c658aecf7b98e9611835f29dd3c81de9e3/README.md, WAR 0.21.18).
- *Lease push denied by the host.* On attempt 4 the t1-2 worker's ADR 0012 `git push --force-with-lease` of
  its own task branch was denied by the host auto-mode classifier as "[Git Destructive]"; the Lead ran the
  push by hand, and the phase was held (verified: issue #2671 row 2, #2670 row 8, #2669 row 4
  (2026-11-08)). This is at least the fourth run with a host-denied lease push, counting the three retired runs
  in context E and #2646 (verified: DocTrail Aligned/reports/2026-10-30-proof-of-contemplation/phases/result-p1held2.json,
  WAR 0.21.31). `FORCE_WITH_LEASE_RULE` and
  `STALE_PRIOR_ATTEMPT_RULE` ride `depClause`, and the card § Dep-wave rebase + force-with-lease carve-out
  carries both; neither surface says what the worker does when the host, not git, refuses the push, and no
  worker surface names `push_denied` (verified: `depClause`, that card section and grep `push_denied` empty at
  279a0d4a). `WORKER_RESULT` carries `blocked_reason: string`, and `PLAN_DEFECT_RULE` is the precedent for a
  reason prefix kept inside the reason (verified: `WORKER_RESULT`, `PLAN_DEFECT_RULE` at 279a0d4a).
- *Manifest left unstamped across Lead hand-offs.* Phase 1 still reads `land: held:escalation` with
  `endedAt: null` although attempt 6 landed; phases 2 to 6 and the landing attempt have no manifest record;
  the run `endedAt` is null after the PR merged; phase 1 `agents: 88` is attempt 1's count while the stamped
  `workflowRunId` journals 20; the later workflow ids exist only in the ledger's `workflow_run` fields
  (verified: issue #2671 rows 4 and 5, #2670 row 10, #2669 rows 8 and 9 (2026-11-08)). The Lead moved across
  three sessions mid-run [assumed: the later Leads never re-read the manifest duty after the hand-off — the
  three issues give it as a hypothesis, and the retired runs below show the same gaps with no hand-off, so it
  is at most one cause; if wrong: the restamp step still makes the record current, and the cause goes to
  `/war-review`]. The gap is general, not one run's: manifests were unstamped or half-stamped in every retired
  campaign — 3 of 7 incomplete in one, including a `"phases": []` manifest with no `endedAt` (verified: DocTrail
  Aligned/reports/2026-10-27-aligned-campaign-1/war/runs/0d9b818b-461b-4424-8493-df801349148f.json, WAR 0.21.18);
  no phase record with `endedAt`, `tasks` or `land` in a run with no session hand-off, where the Lead landed
  three phases by hand and no engine handoff arrived to prompt a close stamp (verified: DocTrail
  WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/issues/review-issue.md, WAR 0.21.35); eight
  manifests for one run chain, one per runId (verified: DocLot
  AutoIndex/pr-795/dc27b35406c6b4704b0b3d11a0c3bcfe9e6c9675/logs/run-manifests/4589fb63-ac9c-4d42-bd2c-00e027f60d71.json,
  WAR 0.21.15), because a launch that dies at entry leaves `"phases": []` and the relaunch starts a fresh manifest
  (verified: DocTrail WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout/war/runs/e98b59fa-d759-41bf-8f87-6405579bccfa.json,
  WAR 0.21.18). The stamps are written by Lead scratch scripts, and their shapes drift inside one manifest —
  `manualLand {sha, recipe}` on one phase, `{reason, landSha}` on another, no `land` on a third, and a
  `priorAttempts` row of a different shape from its sibling (verified: DocTrail
  WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/war/runs/a5fc17cc-c938-4126-8bae-0be9bb0c6beb.json,
  WAR 0.21.35; DocTrail Aligned/reports/2026-10-30-docs-mirror/war/runs/b2197eb4-5786-4a59-bf26-c2a0bd20fe68.json,
  WAR 0.21.35; DocTrail Aligned/reports/2026-10-30-board-mcp/lead/launch.sh, WAR 0.21.33). When § Relaunch is
  followed the record is complete: one relaunch manifest carries `attempts[]` with the held attempt's cause,
  `endedAt`, land decision and totals (verified: DocTrail
  Aligned/reports/2026-10-30-war-strategy-adapter/war/runs/02574030-ee20-47d4-ba54-c39fd2cc7b61.json, WAR 0.21.30).
  Open decision 5 asks whether the catch-up duty should run at every Checkpoint. `run-manifest.md` § Relaunch orders `workflowRunId` + `transcriptDir`
  overwritten together and the died attempt archived, and its Checkpoint on-return reminder re-checks only
  that pair; the envelope aggregates are binding-to-attempt (verified: § Relaunch at 279a0d4a). The card's
  Checkpoint "Manifest stamp" bullet and its "when a phase is relaunched, read run-manifest.md (§ Relaunch
  …)" pointer exist (verified: `skills/war/SKILL.md` § Run manifest and the Checkpoint bullet at 279a0d4a).
  The Resume pre-flight has no manifest step: `manifest` appears once in `resume-and-recovery.md`, in the
  "Fresh identity" bullet (verified: grep at 279a0d4a). `/war-review` already renders the "unfinalized phase
  record" and "half-stamped relaunch" rows after a run (verified: `skills/war-review/SKILL.md` § 4 at
  279a0d4a); nothing checks mid-run, and `skills/war-review/SKILL.md` belongs to the pipeline-skills plan
  (its T1.5) (verified: `docs/plans/2026-11-08-pipeline-skills-and-memory-tooling.md`, untracked, read
  2026-11-08). `run-manifest.md` is also in the doc-truth plan's Task 4.3 Files, and its Task 3.5 pins three
  § Relaunch phrases (`Dispatch counts are summed across attempts`, ``overwrite `workflowRunId` +
  `transcriptDir` together``, ``Archive the died attempt under `attempts[]` ``) (verified:
  `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md`, untracked, read 2026-11-08). That plan lands
  after this one, so this plan edits the file first and the doc-truth plan rebases; the three phrases stay
  byte-identical here. The doc-truth plan also declines the #2509 Lead manifest stamps ("not taken")
  (verified: its Non-goals, untracked, read 2026-11-08), so A26's owner for that row was wrong; D29 takes it.

**L. Survey-derived residuals, filed 2026-11-08 (#2699–#2705).** The evidence fold recorded these seven as
Non-goals; the operator ruled them campaign work, and each is now an issue. All seven are open (verified:
issue state read 2026-11-08). Each fix lives in a file this plan owns.
- *First merge push of a fresh phase (#2699).* Merge step (c) at both merge-task sites — the green-gate arm
  and the baseline-proceed arm — says only "push" before the `merged` return, and the card's merge-task step
  9 says "Push, and return" (verified: issue #2699 (2026-11-08); the two `push, return { mode: 'merge-task',
  status: 'merged'` prompt sites and `agents/war-refiner.md` § merge-task step 9 at 279a0d4a). A fresh
  integration branch has no upstream, so a bare `git push` fails and the refiner falls back to an explicit
  refspec on its own, about nine times across four runs (verified: DocTrail
  Aligned/reports/2026-10-27-aligned-campaign-1/war/runs/4ca1b81a-d0fa-489d-8d05-a4e139189a6c/return-p1.json,
  WAR 0.21.18). The land side already names the form: `land-advance` pushes `git push origin
  HEAD:refs/heads/<working>` (verified: `skills/war/references/budget-raise-floor.md` § the evicted CAS-loop
  block at 279a0d4a). No surface names `HEAD:refs/heads/` for the integration push (verified: grep of
  `HEAD:refs/heads` in the engine's merge-task prompts, the card and `refiner-recovery.md` at 279a0d4a).
- *Relaunch return loses the held attempt's findings (#2700).* The sanctioned-recovery preMerged loop records
  each pre-merged task with `landed.push(id)` and one `recovered:pre-merged` auditLog row and touches
  neither `aced` nor `minorsFiled`; `recovery` reads only `sanctioned` and `reclaimStaleRemote` (verified:
  issue #2700 (2026-11-08); the preMerged loop and `const recovery` at 279a0d4a). A relaunch return therefore
  carries empty `aced` and `minorsFiled` arrays while the held attempt had 6 ace commits and 4 Minors, and the
  Lead rebuilt the record by hand (verified: DocTrail Aligned/reports/2026-10-30-war-strategy-adapter/analysis.md,
  WAR 0.21.30). The Lead already threads prior-return rows back as args (`seededPhaseClose`, `seededTasks`,
  `ruledAsks`), and the filing dispatch is dedup-first — an open-issue match posts a corroboration comment and
  reuses the number (verified: the `seededPhaseClose` intake and the `THEN dedup (D3)` filing line at
  279a0d4a) — so a re-threaded filed row never files twice.
- *Held-carry relabels seeded rows (#2701).* `carryPhaseClose` writes `carriedFrom: { phase: phaseId, reason
  }` over every carried row, and the held-phase arm sends the whole sweep queue through it, seeded rows
  included; the intake log reads `s.carriedFrom.phase` (verified: issue #2701 (2026-11-08); `carryPhaseClose`,
  the `phaseCloseQueue.length > 0 && landDecision !== 'landed'` carry arm and the `held-carry (D3b): seeded
  phase-close row` log at 279a0d4a). So a row the first attempt logged as "carried from phase 5" is logged as
  carried from the relaunched phase after one hold (verified: DocTrail
  WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/results/p6b-wjytsvokj.output, WAR 0.21.35).
- *No servitor and no handoff on a held land (#2702).* The Wrap-up gate is `landResult.status === 'landed'
  && memoryLocalRoot`; the handoff block emits on `landed` and `held:escalation` only; the filing block
  already fires on `landed`, `held:escalation` and `held:land-failed` (verified: issue #2702 (2026-11-08); the
  Wrap-up `if`, the `let handoff = null` condition and the filing condition at 279a0d4a). The hoisted
  `tipSha` already falls back to `lastLandedTip`, the last merge commit, on a hold, and the servitor card's
  grounding ladder takes that anchor (verified: the LANDED-TIP ANCHOR block and `agents/war-servitor.md`
  § Landed-tip grounding at 279a0d4a). A phase the Lead landed by hand under constraint 10 therefore keeps
  no lessons and no per-condition End-state status unless the Lead dispatches the servitor by hand
  (verified: DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/issues/item24-comments/c2562.md,
  WAR 0.21.35). The servitor card opens "You run once, after a phase has landed" (verified: at 279a0d4a).
- *A 39-hex `head_sha` forces a full re-audit (#2703).* `WORKER_RESULT.head_sha` is `{ type: 'string' }` with
  no pattern; the worker's value becomes the audit pin; the audit-pin helper resolves a malformed value to
  null; any resolved pin unequal to the Git head logs `pin-mismatch:reconcile` and re-runs the whole panel
  (verified: issue #2703 (2026-11-08); `WORKER_RESULT`, `let pin = impl && impl.head_sha`, and the
  `resolved.pins.some(sha => sha !== resolved.head_sha)` arm at 279a0d4a). That re-audit ran though every
  seat had judged the real tip (verified: DocTrail
  Aligned/reports/2026-10-30-war-strategy-adapter/phases/journal-p1held.jsonl, WAR 0.21.30). The
  `GATE_CHECK` if/then is the precedent for a schema rule that makes the tool layer re-ask a terse reply; the
  "ponytail" comment at the merge queue forbids a schema `pattern` only where a sentinel string must pass
  (`integration_sha`), and `head_sha` carries no sentinel (verified: both comments at 279a0d4a).
- *An empty `pins` array blocks the task (#2704).* The audit-pin check returns `{ seats: [], expected, died }`
  when `pins.length !== reported.length`, and the dropped-seat lane then holds the task `audit-blocked`; the
  dispatched prompt itself tells the helper to answer `{ head_sha: '', pins: [] }` on a branch Git error
  (verified: issue #2704 (2026-11-08); the `resolved.pins.length !== reported.length` arm, the `seats.length
  < expected` lane and the prompt's last sentence at 279a0d4a). One transient Git read therefore costs a
  task hold; the reporter asked for one re-dispatch (verified: DocTrail
  Aligned/reports/2026-10-30-proof-of-contemplation/lead/issue-2497-comment.md, WAR 0.21.31). D4 (T2.1)
  already retries the pin-proof dispatches in `verifyPinTransfer`; this is the same shape at the audit-pin
  site.
- *Run state is machine-local (#2705).* The run manifest, the team ledger and owned-refs, the args files, the
  saved phase returns and the staged script all live under the git-excluded `.claude/` tree, and the runbook
  has no word for a resume on another machine (verified: issue #2705 (2026-11-08); grep `machine` empty in
  `resume-and-recovery.md`; the `.claude/teams/<run-id>/ledger.json` and `.claude/teams/<prior-run-id>/owned-refs`
  paths in `skills/war/SKILL.md` and the runbook at 279a0d4a). A campaign state file carried across a session
  worktree move lost its run state (verified: DocTrail
  WorkAuditRefine/reports/2026-11-06-session-worktree-leftovers/war-fable-opus-audit-loops-0592b7/files/.claude/campaigns/2026-09-06-survey-debt/CAMPAIGN-STATE.md,
  WAR 0.21.13). D17 (c) already stops a `resumeFromRunId` whose `transcriptDir` is gone, which is every
  cross-machine resume; what is missing is the carry list. A tool that moves run state is outside this
  campaign (no plan owns one); this plan ships the Lead-side carry recipe.

**Staged cap (re-measured at `7e70e874`, operator ruling 2026-11-09: the staged-template cap is funded by moving the embedded args into a sibling args script).** At the live base the comment- and indent-stripped engine is 404,473 B, so the room under arm (p) is 7 B, not the 459 B measured below at `279a0d4a` (verified: `stripFullLineComments` over the template, red-team round 1). The engine growth of this plan's slices is about 4 to 5 KB. T1.2 funds it: the stager writes the phase args to a sibling args script that the staged copy loads with `workflow({ scriptPath })`, so `ARGS_HEADROOM_BYTES` reserves only that one prelude line (D38). The older text follows, superseded by D38: The comment- and indent-stripped engine plus `ARGS_HEADROOM_BYTES` had 459 B of room under
the 524,288 B script cap (verified: `stripFullLineComments` over the engine, `ARGS_HEADROOM_BYTES` 119,808 and
`SCRIPT_BYTE_CAP` at 279a0d4a; the roadmap's contention row says the same). Every engine byte this plan adds
counts against it; full-line comments are free. The seven claims add about 860 B of code and prompt prose
across T1.1, T2.1, T3.1 and T4.1 (estimates per decision row), so each engine task measures the stripped size
per commit and funds growth by removing dead code or tightening prompt prose byte-for-byte, never by lowering
`ARGS_HEADROOM_BYTES` (constraint 12).

**Card budgets.** `agents/war-refiner.md` 38,846 B of a 38,912 B hard line (66 B free); `agents/war-worker.md`
13,292 B of 13,312 B (20 B free) (verified: `wc -c` at 7e70e874, red-team round 2). The
two predecessor plans edit both cards first, so headroom is re-measured at each task's rebased base. Refiner
card: the two land-phase bullets T1.1 evicts are 155 B and 313 B, and no test names their labels, but `workflow-template.recovery.test.mjs` pins the Server-side push error text (red-team round 1, see T1.1) (verified: `wc -c`
per line and grep of `Land-advance escalate` / `Server-side push error` across `skills/war/assets/*.test.mjs`
at 35aa4144 — the one `still exits 3` pin reads the dispatched prompt, not the card). Worker card: the
`## Prior lessons (memory)` block IS pinned (`memory-tool-name.test.mjs` and an engine-1 test read that
heading); the unpinned tier-2 blocks are `## Harness note` (heading and its `GateGuard` body absent from
every test) and `## Comment hygiene (before commit)` (verified: grep of each heading and body term across
`skills/war/assets/*.test.mjs` and `hooks/*.test.sh` at 35aa4144).

**Test reporter.** `node --test` here prints the spec reporter; the `# fail 0` and `ok <n> - <name>` tokens
need `--test-reporter=tap` (verified: TRIAL-1 at 365f3da2).

## Pivotal constraints

1. Both-surfaces rule: a dispatched refiner or worker prompt change lands with its `agents/*.md` twin in the
   same task (verified: CLAUDE.md § Execution architecture at 35aa4144).
2. One `workflow-template.js` owner per phase; parallel tasks are file-disjoint.
3. An engine task owns every test file that pins text it changes, and its new fixtures (context J). This
   replaces the spec's engine-task / test-task split.
4. No card budget raise. Card growth is funded by a byte-identical ADR 0042 eviction in the same task (the
   card has one owner per phase).
5. No new `KNOWN_LAND_DECISIONS` or `HARD_ESCALATION_REASONS` member.
6. Git is truth (ADR 0008): a `landed` after a land confirm must still pass `confirmMerge`.
7. The preMerged block keeps `lastLandedTip` unset, so `tipSha` is unchanged.
8. `skills/war/references/schemas.md` is not edited here; the doc-truth plan writes the new field rows.
9. `skills/war/assets/provision-worktrees.sh` and `skills/war/assets/task-integrated.sh` are read only; the
   #2657 fix is prompt-side. A Lead ruling under the operator's keep-this-war-alive mandate keeps
   `task-integrated.sh` strict on a late-fix commit whose trailer names another task: "Strict fails safe: it
   never gives a false `preMerged`" (verified: DocTrail
   WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/reports/p3-report.md, WAR 0.21.35).
10. Operator standing ruling, "escalation-completion land": when a phase is held on one escalation, the Lead
    merges the task and lands the phase by hand (verified: DocTrail
    Aligned/reports/2026-10-27-aligned-campaign-1/teams/4db2fccb-e4be-4aa3-a78d-c8b65d238b07/ledger.json, WAR
    0.21.18). A Lead-landed phase gets no engine handoff, so D29's catch-up (T4.2) stamps `land` and `endedAt`
    from git for such a phase, never from a return that does not exist.
11. Operator ruling 2026-11-04 after a pin-transfer rebase-conflict hold: "P1-R1 recovery: one sanctioned
    full-DAG relaunch, new runId" (verified: DocTrail Aligned/reports/2026-10-30-docs-mirror/lead/rulings-p1.md,
    WAR 0.21.35). The sanctioned full-DAG relaunch with a new runId is the recovery shape D27 (T4.1) and D29
    (T4.2) serve; neither may assume a resumed runId.
12. Staged cap (the roadmap's contention row for `stage-workflow.test.mjs` arm (p)), amended by operator ruling 2026-11-09: the staged-template cap is funded by moving the embedded args into a sibling args script (D38): T1.2 lands first and lowers `ARGS_HEADROOM_BYTES` to the sibling-loader prelude size (at most 4 digits), because the args no longer ride the staged copy. That lowering is the ruled exception to the rule below, never a precedent for lowering it while args are embedded. After T1.2, each engine task measures and records the stripped size per commit, and funds growth only if arm (p) would go red; `ARGS_HEADROOM_BYTES` is never raised and never lowered again. The original text, superseded by D38: the stripped engine plus
    `ARGS_HEADROOM_BYTES` had 459 B of room at 279a0d4a. Every engine task measures the stripped size per
    commit (`stripFullLineComments` over the file, plus `ARGS_HEADROOM_BYTES`, against `SCRIPT_BYTE_CAP`) and
    funds growth by removing dead code or tightening prompt prose byte-for-byte; `ARGS_HEADROOM_BYTES` is
    never lowered. Each decision row below carries its byte estimate.

## Resolved design tree

| # | Decision | Resolution | Source | Landing class |
|---|----------|------------|--------|---------------|
| D1 | Land confirm on exit 3 | One shared const `landConfirmArm`: on a `land-advance` exit 3, run `git ls-remote origin refs/heads/<working>` and `git rev-parse refs/heads/<working>`; if both print `<merge-sha>`, return `{ mode:'land-phase', status:'landed', working_sha:'<merge-sha>' }`, else `landErrorArm`. It rides `RELAND_CAS`, `landPrompt`'s "any other exit" bullet and both `landErrorArm` uses in `relandDiscrimination`; `refiner-recovery.md` carries it for the superproject and 2A arms | (verified: issue #2657 (2026-11-08)) | PIN-1→slice (T1.1) |
| D2 | D4 prose fix | `refiner-recovery.md`: the retry exits 0 only when the follower lags; when it already sits at `<merge-sha>`, it exits 3 and the land confirm returns `landed` | (verified: issue #2657 (2026-11-08)) | PIN-2→slice (T1.1) |
| D3 | Never-move wording | Keep engine behavior. New sentence: "A task branch whose tip is already an ancestor of the integration tip is merged: never rebase, move or re-merge it; the engine holds it for the Lead and never records a merge from your report." No apostrophe (the harness regex is single-quote) | (verified: issue #2662 (2026-11-08)) | PIN-3→slice (T1.1) |
| D4 | Pin dispatch failure scope | In `verifyPinTransfer` and `mergeSnapshot`, a dispatch-layer throw (`warDispatchDeath === true`) that `infraDeathCause` does not match counts as a failed attempt and the loop retries within `roundLimit` (the next attempt already runs on the recovery tier). Exhaustion keeps each site's existing arm: the pin proof returns `null` → `pin-transfer:unverified` for that task; the snapshot keeps its HARD `Git merge snapshot unavailable` throw, whose message now also names the last caught reason. A caught non-infra throw is never minted into a `DISPATCH_DEATH` record, so no `env-died` is read from it (the D21 comment's fail-safe: an unmatched dispatch-layer death stays in the louder class). An untagged throw rethrows HARD at once. No backoff | (verified: issue #2589 (2026-11-04); the `mergeSnapshot` tail at 35aa4144) | PIN-4→slice (T2.1) |
| D5 | Typed Git-read error | Optional `git_error: { type:'string' }` on `PIN_GIT_PROOF` and on `MERGE_SNAPSHOT`; each prompt says on a Git read error return its required SHA fields as empty strings plus `"git_error":"<stderr tail>"` (so the reply still passes the schema's `required` list); the engine logs it on the `pin-transfer:unverified` auditLog row, and the snapshot loop appends it to the HARD `Git merge snapshot unavailable` message when its last reply had no usable snapshot | (verified: issue #2589 (2026-11-04)) | PIN-5→slice (T2.1) |
| D6 | Approved ace tree | Repro first: a real-git fixture of a subset-mode approved ace then a merge, asserting `pin-transfer:git-verified` and `pins[0]` equal to the ace tip, proven red at the phase base. Fix rule: every arm that sets `r.seats` to an approving re-audit at tip T also sets `r.aceSha = T`, and no later read overwrites an approved tip | (verified: issue #2590 (2026-11-04)) | PIN-6→slice (T2.1) |
| D7 | Reused-worktree provision | `provisionStep`'s task-worktree prompt gets a save-and-restore preamble as two named consts (so a test can extract their exact spelling the way `PROVISION_CLEAN_SENTENCE` extracts the clean line): before step 1, run `git reset -q` (unstage everything, keep the edits in the tree — `git checkout -- .` restores from the INDEX, so a staged edit would survive the clean line and make the later apply fail as a false conflict), then if `git status --porcelain --untracked-files=no` prints anything, write `git diff --binary HEAD` to `.war/preprovision-<task id>.patch`; after the steps and the clean line, `git apply <that patch>` (worktree only — no `--index`, no `reset`). Untracked files, including a formerly staged new file, are never touched by the clean line and stay in place. An apply failure keeps the patch and returns `ok:true` with optional `savedWork: "<patch path>"` on `ENV_OUTCOME`; the worker prompt names the patch when `savedWork` is set, and the card's `## Inputs` list gets one bullet for it (recovery only). `PROVISION_RERUN_CLAUSE` is unchanged | (verified: issue #2588 (2026-11-04); the grill's scratch repos d7a/d7b at 365f3da2 — staged edits survive `git checkout -- .` and then fail `git apply --index`) | PIN-7→slice (T4.1) |
| D8 | Recovery push path | `STALE_PRIOR_ATTEMPT_RULE` applies only when `git merge-base --is-ancestor origin/<branch> <pre-rebase HEAD>` exits 1, where `<pre-rebase HEAD>` is the SHA the worker records with `git rev-parse HEAD` before its rebase (`ORIG_HEAD` right after the rebase holds the same value); the sentence names that read, so a worker whose rebase has moved HEAD can still run the test. When the remote tip is an ancestor, `FORCE_WITH_LEASE_RULE` already allows the lease push. Engine const and card sentence change together; the old unconditional sentence is gone from both surfaces | (verified: issue #2646 (2026-11-06); the plain push of a reused, already-pushed branch after a dispatch rebase is non-fast-forward, so the lease is the only push — DocTrail Aligned/reports/2026-10-30-proof-of-contemplation/phases/result-p1held2.json, WAR 0.21.31) | PIN-8→slice (T3.1) |
| D9 | Recovery predecessor seed | The barrier returns optional `integrationTip` (the third `TASK_INTEGRATED` field). A separate `recoveryPredSeed` is set only when `recovery` and preMerged rows exist; `landMerged` reads `lastLandedTip ?? recoveryPredSeed` | (verified: issue #2575 (2026-11-02)) | PIN-9→slice (T4.1) |
| D10 | Plugin identity at relaunch | `assert-args-complete.mjs --prior-manifest <path>`: when `args.recovery.sanctioned === true`, compare the running plugin root and its `.claude-plugin/plugin.json` version with the manifest's `pluginRoot` / `pluginVersion`. The running root is the script's own location (`import.meta.url` → `realpathSync` → three directories up from `skills/war/assets/`), never an environment variable — the script already resolves its default template that way, and no script in `skills/` or `hooks/` reads `process.env.CLAUDE_PLUGIN_ROOT`; both roots are compared as realpaths. Mismatch exits 1 printing both values and the `--plugin-dir` form; an absent or null field warns on stderr and exits 0; without the flag, or on a non-recovery launch, the manifest is never read. Wiring: `launch-identity.md`'s recovery paragraph (which the runbook's "Fresh identity" bullet already sends the Lead to) names the flag and the manifest path to pass | (verified: issue #2495 (2026-10-29); `fileURLToPath(import.meta.url)` in `assert-args-complete.mjs`, no script reads `process.env.CLAUDE_PLUGIN_ROOT` (a grep for it hits only a doc snippet in `skills/war/references/sweep-exclusion.md`), the runbook's "Fresh identity" bullet at 35aa4144) | PIN-10→slice (T1.2) |
| D11 | Worker-site null | Route a resolved null at the implementation, fix-round, floor-fix, late-fix and wave-side ace sites through `nullDied`; implementation and fix sites return verdict `env-died`; the ace site takes its failed-attempt arm; the late-fix site stops like its death arm | (verified: issue #2555 (2026-10-31)) | PIN-11→slice (T3.1) |
| D12 | Infra death terms | Widen `INFRA_DEATH_RE` with bounded phrases only: `api error: 401`, `oauth access token`, `disabled claude subscription`, `enotfound`, `getaddrinfo`, `eai_again` (case-insensitive, like the existing terms). No bare `401`, `oauth`, `unauthorized` or `subscription`: each matches a SHA fragment, task id or title word. The positive fixtures are the two verbatim #2328 strings plus one `getaddrinfo ENOTFOUND` string; the negative fixtures are TAGGED dispatch throws reading `sha 4019abc`, `task t401 failed` and `refactor oauth module title`, which stay HARD. The structural `warDispatchDeath` scope stays | (verified: issues #2328 (2026-09-24), #2412 (2026-10-22), #2442 (2026-10-26); the `node -e` probe at 365f3da2 — the bounded set matches both #2328 strings and none of the three decoys) | PIN-12→slice (T3.1) |
| D13 | Death text | Add `dispatchFailures: [{ label, reason }]` to both returns; every `dispatchDied` call and every dropped audit seat pushes one row. The spec's prologue wrap is dropped (PIN-25) | (verified: issue #2645 (2026-11-06)), after TRIAL-1 | PIN-13→slice (T2.1) |
| D14 | Retire the worker trailer | Delete `taskProvenanceClause`'s trailer sentence; keep its no-empty-commit and `git rev-parse HEAD` sentences; card step 5 the same. `Late-Fix:` and `Ace-Charge:` untouched | (verified: issue #2659 (2026-11-08)) | PIN-14→slice (T3.1) |
| D15 | Commit-message read rule | One worker sentence on both surfaces: never read a commit message from a scratchpad or any path outside your own task worktree | (verified: issue #2494 (2026-10-29)) | PIN-15→slice (T3.1) |
| D16 | Refinery hygiene rows | `worktreeHygieneClause` names `ensure-refinery-worktree` too, captured as `{ task: null, refinery: true, path, action, detail }`; card barrier step mirrors it | (verified: issue #1823 (2026-08-27)) | PIN-16→slice (T4.1) |
| D17 | Runbook lines | `resume-and-recovery.md` § Recovery relaunch: (a) rebuild `agents`/`audit`/`run`/`gate` from `war-config.mjs --fill-defaults`; (b) capture `git -C <worktree> status --short` per escalated task first; (c) confirm the manifest's `transcriptDir` exists before `resumeFromRunId`; (d) stop a resume that re-dispatches seats (cache miss) and relaunch fresh; (e) a 0-agent `held:workflow-error` with no text is a harness entry refusal; (f) a diverged local copy is repointed to its remote (End state 24) | (verified: issues #2328 (2026-09-24), #2442 (2026-10-26), #1910 (2026-08-28), #2645 (2026-11-06)) | PIN-17→slice (T4.2) |
| D18 | Enum set | No new `KNOWN_LAND_DECISIONS` or `HARD_ESCALATION_REASONS` member | spec constraint 4 | PIN-18→guardrail |
| D19 | Git is truth | A refiner `landed` after a land confirm still passes `confirmMerge`; an unconfirmed `landed` never lands | (verified: `confirmMerge` at 35aa4144) | PIN-19→guardrail ‡ |
| D20 | preMerged tip | `lastLandedTip` stays unset in the preMerged block; `tipSha` unchanged | (verified: issue #2575 (2026-11-02)) | PIN-20→guardrail |
| D21 | Card budgets | No raise; growth funded by a byte-identical ADR 0042 eviction in the same task | workflow task rule | PIN-21→guardrail |
| D22 | Test ownership | An engine task owns the tests that pin text it changes (context J) | (verified: grep at 35aa4144) | PIN-22→context |
| D23 | schemas.md rows | New optional fields (`git_error`, `integrationTip`, `savedWork`, `refinery`, `dispatchFailures`, `recovery.priorReturn`, the `recovered` row stamp, the `head_sha` 40-hex pattern) get rows in the doc-truth plan | spec constraint 7 | PIN-23→backstop |
| D24 | Shell scripts | `provision-worktrees.sh` and `task-integrated.sh` stay untouched | spec constraint 8 | PIN-24→guardrail |
| D25 | Prologue wrap | Dropped: the args prologue already sits inside the try | (verified: TRIAL-1 at 365f3da2) | PIN-25→non-goal |
| D26 | Lease rule bytes | `FORCE_WITH_LEASE_RULE` stays byte-identical | (verified: its byte-compare test at 35aa4144) | PIN-26→guardrail |
| D27 | Relaunch adopts the owned integration branch | A recovery-gated barrier const `adoptOwnedClause`, present only when `recovery` and `ownedFile` are both set, placed before step 2: if `git show-ref --verify --quiet refs/heads/<integration branch>` exits 0 and `grep -qxF '<integration branch>' <ownedFile>` exits 1, run `provision-worktrees.sh record-as-owned <integration branch> <working branch> --owned-file <ownedFile>`, then step 2 as today; a non-zero exit returns `{ ok: false, … }` with the die text in `stderrTail` and stops (a branch that does not descend from the working tip stays a foreign halt, ADR 0003). Absent `recovery`, the barrier prompt is byte-identical to today. Card twin in the refiner card's barrier step. The script is unchanged (PIN-24) | (verified: issues #2671 row 1, #2670 row 1, #2669 row 1 (2026-11-08); `cmd_record_as_owned` proof 1 at 279a0d4a; the die text `foreign branch 'integration/…/phase-1' already exists and is not owned by this run` in the attempt-2 journal — DocTrail Aligned/reports/2026-11-05-user-never-waits/workflows/wf_bcdabb0e-f8b.json, WAR 0.21.37) | PIN-27→slice (T4.1) |
| D28 | Lease push denied by the host | One const `LEASE_DENIED_RULE` beside `STALE_PRIOR_ATTEMPT_RULE` in `depClause`, and the same sentence in the card carve-out section: when the host denies the lease push (a permission or classifier denial, not a git rejection), stop — return `status: "blocked"` with `blocked_reason` starting `push_denied:` followed by the exact command and the denial text; never retry the push, never a plain `--force`, never another ref. No engine routing change: the blocked worker takes the existing escalation arm, and `push_denied:` is a reason prefix like `PLAN-DEFECT:`, not an enum member (PIN-18). `FORCE_WITH_LEASE_RULE` byte-identical (PIN-26). The runbook's Checkpoint arms gain the hand-push recipe for a `held:escalation` whose reason starts `push_denied:` | (verified: issues #2671 row 2, #2670 row 8, #2669 row 4 (2026-11-08); issue #2646 (2026-11-06)) | PIN-28→slice (T3.1 both surfaces; T4.2 runbook) |
| D29 | Manifest full-record restamp and hand-off catch-up | Lead-side doc only. `run-manifest.md` § Relaunch: every relaunch restamps the whole phase record — `workflowRunId` + `transcriptDir` (as today), the envelope aggregates from the relaunch's own envelope, `land` and `endedAt` from the relaunch's return — and names the stale shape it prevents (`land` a prior attempt's hold while git shows the phase landed; `agentCount` from attempt 1). New section `## Hand-off catch-up`: the first act of a Lead who takes over a run in a new session is to read the manifest, compare its `phases[]` with the ledger's phase records and the working branch, and restamp every missing or stale record — from the ledger (`workflow_run` → `workflowRunId`, its transcript dir), from git (`land: landed` when the phase merge is reachable on the working branch; `endedAt` from that merge commit's committer date), from the envelope when the transcript dir still exists (else `null`); each restamped record carries `restamped: <clock read>`; a restamped `cause` is copied from the prior record or the ledger, never inferred (a retired run's record overstated a pause as budget exhaustion when the stamped reason was an operator config switch — verified: DocTrail WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout/CORRECTIONS.md, WAR 0.21.19); the run `endedAt` is stamped when the landing PR merges. `resume-and-recovery.md` § Resume reconciliation pre-flight gains **Manifest catch-up** as the named first act after a session hand-off (a pointer to the new section), and § Recovery relaunch gains a **Manifest restamp** bullet. The three § Relaunch phrases the doc-truth plan pins stay byte-identical | (verified: issues #2671 rows 4 and 5, #2670 row 10, #2669 rows 8 and 9 (2026-11-08); `run-manifest.md` § Relaunch at 279a0d4a; the same unstamped shape in a run with no hand-off — DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/issues/review-issue.md, WAR 0.21.35) | PIN-29→slice (T4.2) |
| D30 | Cheap manifest check | A `/war-review` row for a manifest with fewer phase records than the ledger, or a `land` hold while git shows the phase landed, belongs to the pipeline-skills plan (`skills/war-review/SKILL.md`, its T1.5); this plan ships the Lead-side duty and its doc only | (verified: `docs/plans/2026-11-08-pipeline-skills-and-memory-tooling.md`, untracked, read 2026-11-08) | PIN-30→non-goal |
| D31 | First-push refspec | Merge step (c) at both merge-task sites (the green-gate arm and the baseline-proceed arm) names the push: `git push origin HEAD:refs/heads/<integration branch>` — the explicit refspec `land-advance` already uses, which works with or without an upstream; never `-u`, never a plain `git push`. The card's merge-task step 9 carries the same form in one sentence (≤ 150 B, paid from T1.1's eviction; the ≥ 200 B reserve for T2.1 stays). About 90 B of engine growth | (verified: issue #2699 (2026-11-08); the two `push, return { mode: 'merge-task', status: 'merged'` sites and card step 9 at 279a0d4a) | PIN-31→slice (T1.1) |
| D32 | Prior-return carry | Optional `args.recovery.priorReturn: { aced?: [...], minorsFiled?: [...] }` — the held attempt's two top-level arrays, threaded verbatim by the Lead beside `seededPhaseClose`. Inside the sanctioned-recovery preMerged loop, each row whose `task` normalizes (`preMergedIdOf`) to a pre-merged task id is carried: an aced row is pushed to `aced` as `{ ...row, recovered: true }` (a plain push, so no citation logic re-runs); a minorsFiled row goes through `fileFollowUp({ ...row, recovered: true })`, so `filedKeys` is stamped and a seat re-mint reads as corroboration. Rows for tasks that are not pre-merged are dropped with one log line (that task re-runs here and raises its own rows). A row already carrying `issue` keeps it; the filing dispatch is dedup-first, so a re-threaded filed row posts a corroboration comment and reuses the number, never a duplicate. A present-but-malformed `priorReturn` (not an object, or arrays that are not arrays) is ignored with one log line (the `ruledAsks` container-loudness precedent); outside sanctioned recovery it is ignored with a log line (the preMerged precedent). The runbook's Recovery relaunch step 4 names the threading step (T4.2). About 320 B of engine growth | (verified: issue #2700 (2026-11-08); the preMerged loop, `fileFollowUp`, the `THEN dedup (D3)` filing line at 279a0d4a) | PIN-32→slice (T4.1 engine; T4.2 runbook) |
| D33 | Carried-from origin | `carryPhaseClose` keeps a row's first origin: `carriedFrom: { phase: <the row's existing carriedFrom.phase when it is not null, else phaseId>, reason: why }` — the phase is the origin, the reason is the latest hop. The intake log is unchanged (it already reads the row's origin). About 40 B | (verified: issue #2701 (2026-11-08); `carryPhaseClose` at 279a0d4a) | PIN-33→slice (T4.1) |
| D34 | Held-land wrap-up | (a) The Wrap-up gate becomes `(landDecision === 'landed' \|\| landDecision === 'held:escalation' \|\| landDecision === 'held:land-failed') && memoryLocalRoot` — the filing block's set, where merged work exists; the prompt's first line names the land decision (`land decision: <landDecision>; working branch <branch>`) instead of "landed on", and the `Landed tip:` line keeps `landedTipAnchor` (the hoisted `tipSha` already reads `lastLandedTip`, the last merge commit, on a hold). The death arm is unchanged (env-died SOFT). (b) The handoff block's condition gains `held:land-failed`; the filing block's comment that says no handoff emits there is updated in the same diff. (c) Card twin: the servitor card's opening sentence says it also runs on a held land (`held:escalation` or `held:land-failed`), where the anchor is the last merge tip, not a working-branch tip (one sentence, ≤ 160 B; the card has about 3.6 KB of hard headroom). No new land decision (PIN-18); a hold stays a hold. About 120 B of engine growth | (verified: issue #2702 (2026-11-08); the Wrap-up `if`, the handoff condition, the filing condition and the LANDED-TIP ANCHOR block at 279a0d4a) | PIN-34→slice (T2.1) |
| D35 | 40-hex `head_sha` | (a) `WORKER_RESULT.head_sha` gets `pattern: '^[0-9a-f]{40}$'`; the field stays optional, so a blocked worker without a commit is unaffected, and a 39-hex reply is re-asked at the tool layer (the `GATE_CHECK` if/then precedent). (b) In the audit-pin reconciliation: when the worker's reported pin (`pins[0]`) is the only mismatch and every seat `audit_sha` resolved equal to `head_sha`, repair the pin to `head_sha`, push an auditLog row `verdict: 'pin-repaired:worker'`, and let the seats stand — no `pin-mismatch:reconcile` re-audit; any seat mismatch keeps today's full re-audit. (c) Both worker surfaces say `head_sha` is all 40 hex characters from `git rev-parse HEAD` (the kept D14 sentence, extended on the card and in `taskProvenanceClause`). About 200 B of engine growth | (verified: issue #2703 (2026-11-08); `WORKER_RESULT`, the `GATE_CHECK` if/then, the ponytail comment at the merge queue, `resolved.pins.some(...)` at 279a0d4a) | PIN-35→slice (T3.1) |
| D36 | Audit-pin retry | The `audit-pin:` dispatch is re-dispatched once when its reply is malformed: `pins` not an array, `pins.length !== reported.length` (the helper's documented Git-error reply `{ head_sha: '', pins: [] }` for a non-empty request has this shape), or a non-null pin failing the prefix check. One log line names the shape and the retry. A second malformed reply takes today's arm (seats dropped → the dropped-seat `audit-blocked` lane; no new reason, PIN-18). A dead dispatch keeps `deathOf` → env-died on either attempt. The helper card is unchanged (it already says to follow the prompt's error rule). About 90 B | (verified: issue #2704 (2026-11-08); the `resolved.pins.length !== reported.length` arm and the prompt's last sentence at 279a0d4a) | PIN-36→slice (T2.1) |
| D37 | Cross-machine state carry | Lead-side doc only. `resume-and-recovery.md` § Resume reconciliation pre-flight gains a **Machine-local run state** bullet: the run manifest, the team ledger and owned-refs (`.claude/teams/<run-id>/`), the args files, the saved phase returns and the staged script are git-excluded and never travel; a resume on another machine first fetches origin and recreates the local integration and task branches the ledger names (the `git branch <branch> <remoteSha>` adopt form in `schemas.md`'s staleRemote row (read-only here, constraint 8)), copies the manifest, ledger, owned-refs, args files and the held return to the same paths under the new machine's run root (`skills/war/references/setup.md` § Run root, ADR 0059) by hand, with the ledger and owned-refs under `$MAIN/.claude/teams/`, then takes a fresh Recovery relaunch — new runId, never `resumeFromRunId`, whose `transcriptDir` check (D17 (c)) fails there by construction — threading `seededPhaseClose`, `seededTasks`, `priorReturn` (D32) and `ownedFile` from the copied files; Manifest catch-up (D29) then restamps from the copied manifest. No tooling: a state-carry script is outside this campaign | (verified: issue #2705 (2026-11-08); grep `machine` empty in the runbook; the ledger and owned-refs paths in `skills/war/SKILL.md` and the runbook at 279a0d4a) | PIN-37→slice (T4.2) |
| D39 | Lease after a merge-slot rebase (#2750) | `floorFixHead` gets one sentence: a merge-slot rebase may move the task branch off its pushed remote, that rebase counts as a dispatch-rebase for the lease carve-out, and a host-denied lease push takes the D28 route; `FORCE_WITH_LEASE_RULE` stays byte-identical (PIN-26); no card twin, because the worker card already points at the lease rule | (verified: issue #2750 (2026-11-09)) · AI-declared, --afk | PIN-21 n/a · T3.1 |
| D38 | Args ride a sibling args script | The stager's `--args <file>` writes `<staged basename>.args.js` beside the staged copy: `export const meta = { … }`, then `return <the validated args JSON>`. The staged copy's prelude loads it with `workflow({ scriptPath: '<absolute args script path>' })` only when no args were dispatched, inside a try/catch that stores the error, so nothing above the engine's `try {` throws and PIN-25 holds. The `ARGS_FALLBACK_ANCHOR` rewrite adds a named throw for a failed load, inside the engine's try, so a bad sibling returns `held:workflow-error`, and dispatched args still win. The args script gets its own `.sha256` sidecar; write-if-absent and `--force` cover both files; a staged copy with no sibling refuses reuse; `--force` refuses on either sidecar mismatch; and the size floor checks each file against `SCRIPT_BYTE_CAP`. `ARGS_HEADROOM_BYTES` drops to the prelude reserve. The Lead still types no args (the #1134 fix holds) and still dispatches with no Workflow args. The engine never calls `workflow()` itself, so the one-level nesting limit holds | (verified: TRIAL-3, 2026-11-09) · operator ruling 2026-11-09: the staged-template cap is funded by moving the embedded args into a sibling args script | PIN-21 n/a (no card) · T1.2 |

## Assumptions ledger

| ID | Assumption | Basis | Blast radius if wrong | Check |
|----|-----------|-------|----------------------|-------|
| A1 | No new enum member is needed (D18) | every route reuses `pin-transfer:unverified`, `env-died`, `landed`, `held:workflow-error` | the phase that needs one also edits `land-decision.mjs`, the inline mirror and the drift-guard test in one task | gate: `land-decision.test.mjs` |
| A2 | RETIRED — the engine reads origin on its own after a `landed` claim | verified: `segmentedLand` → `reconciledMerge` → `confirmMerge` at 35aa4144 | — | End state 3 |
| A3 | The never-move hold stays; only wording changes (D3) | spec D3; #1895 guard | an operator who wants the report to record a merge must first rule on #1895 | Open decision 2 |
| A4 | A malformed StructuredOutput past the harness cap surfaces as a throw at `dispatch` (D4) | issue #2589 symptom | the fix is a null arm, which the `!proof` check already covers; only D5 remains | End state 6 fixture throws and returns null |
| A5 | The Workflow sandbox has no sleep primitive, so retries stay immediate (D4) | spec D4; the cost of immediate retries under a dead host is known: six `git-pin-snapshot:t3` dispatches errored in under 0.7 s each with 0 tokens, five of them on the recovery tier (verified: DocLot AutoIndex/pr-1119/96cfe3c658aecf7b98e9611835f29dd3c81de9e3/logs/p2a1-agents.csv, WAR 0.21.18) | add a bounded backoff between attempts | T2.1 worker reads the sandbox globals |
| A6 | An optional string `git_error` beats the issue's `{error:'git-read-failed'}` object (D5) | spec D5 | use the object shape; routing is the same | End state 7 |
| A7 | The #2590 fault is a missed or stale `r.aceSha` write among the three approve arms, the fourth `r.seats` site (the merge-slot `mismatch` re-audit, `r.seats = rbSeats`, which writes no `aceSha`) or `registerRangeRevert` (D6) | spec D6; the four `r.seats =` sites (verified: at 35aa4144); no confirmed root cause | the repro names the real path and T2.1 fixes that path; the fixture stays. If no repro goes red, T2.1 exits `PLAN-DEFECT:` with the repro, and the rest of T2.1 still lands | End state 8 |
| A8 | Save-and-restore beats doc-only for #2588 (D7) | spec D7 | drop the preamble; keep only the runbook line | Open decision 3 |
| A9 | `git apply` of the saved patch can conflict when a provision step rewrites a file the worker also edited (spec open risk) | spec §8 | the patch stays and the worker is told where; work is never lost but may need a hand merge | End state 15: the recovery fixture asserts `savedWork` reaches the worker prompt, and the git-1 fixture runs the exact save/clean/restore spelling on staged and unstaged edits |
| A10 | An ancestry test is enough proof of branch ownership; no new `args.recovery` field (D8) | spec D8 | thread a barrier-recorded remote task tip into the worker prompt as the lease value | End state 12 |
| A11 | PARTLY RETIRED — the host auto-mode classifier allows the lease push once the prompt sanctions it | refuted once: #2671 row 2 shows a sanctioned lease push denied as "[Git Destructive]" (verified: issue #2671 (2026-11-08)). Still assumed: the Lead's hand push under the same lease is approved | the push always needs the Lead's hand; D28's stop rule and recipe are the route either way | backstop row 2 |
| A12 | The adopted integration tip is the correct predecessor of the first fresh merge (D9) | spec D9 | seed from the last preMerged task's `merge_commit` instead | End state 16 |
| A13 | Exit 1 (the floor route) is right for the plugin-identity refusal (D10) | spec D10 | use a distinct exit code and update the exit contract header | End state 5 |
| A14 | A worker-site null is `env-died`, not a ratified HARD hold (D11) | #1481 close left "the worker-site resolved-null question" open (verified: issue #2555 (2026-10-31)) | the operator ratifies the HARD hold; D11 shrinks to a comment plus a fixture pinning the HARD read | Open decision 1 |
| A15 | An issue-level ruling is enough for D11; no ADR (spec §7) | the #1481 precedent | write the next free ADR for null-return classification | Open decision 1 |
| A16 | PARTLY RETIRED — the `api error: 401`, `oauth access token`, `disabled claude subscription` and `enotfound` phrases are verbatim in #2328 and #2412 (verified: issue bodies 2026-11-08). Still assumed: `getaddrinfo` and `eai_again` appear in the harness DNS death messages | Node's DNS errors print `getaddrinfo ENOTFOUND` / `EAI_AGAIN`; no issue quotes one | the two DNS terms never fire; `enotfound` still covers the #2412 case | backstop row 3 |
| A17 | A top-level additive `dispatchFailures` is enough for "surface each failed agent's reason"; per-seat retries are already bounded by `auditRound` passes and `roundLimit` (D13) | spec D13 | add a per-seat retry counter, and the hold names the seat | End state 9 |
| A18 | RETIRED — the prologue throw is the 0-agent cause (spec D13) | TRIAL-1: the prologue is inside the try | — | — |
| A19 | A 0-agent death with no text is a harness entry refusal (script parse or size cap) the script cannot catch (D17 (e)) | TRIAL-1; the stager's `SCRIPT_BYTE_CAP` comment says the tool refuses before entry validation (verified: `stage-workflow.mjs` at 35aa4144) | the cause is elsewhere and stays undiagnosed; the runbook line still names the first checks | backstop row 4 |
| A20 | The guard-habits plan lands the commit-message write half (D15) | its spec D10 | T3.1 lands the whole sentence | T3.1 worker greps the card at its rebased base |
| A21 | The Lead can see a resume cache miss from the journal or dispatch counts while the run is live (D17 (d)) | spec D17 | (d) becomes a post-hoc `/war-review` check only | backstop row 4 |
| A22 | RETIRED — the spec's chosen card bullet is the cheapest eviction | replaced: T1.1 evicts the two land-phase exit bullets; `workflow-template.recovery.test.mjs` pins the Server-side push error text three ways, so T1.1 either updates those pins or keeps that text and evicts other bytes; the ≥ 200 B reserve and D31's sentence bind on either branch | — | — |
| A23 | The refiner card's existing pointer to `refiner-recovery.md` § Uncertain merge reconciliation counts as the standing twin for the `git_error` answer | spec T2.1 note; the pointer line exists (verified: `agents/war-refiner.md` § Git mutation recovery at 35aa4144) | pre-funded: T2.1 adds one card sentence (≤ 60 B) in § Git mutation recovery, paid from the ≥ 200 B of headroom T1.1 must leave (at 7e70e874: 66 B free + about 468 B evicted − the pointer bullet, about 156 B linked or about 120 B plain-path − D3's +55 B on step 1 − D31's step-9 sentence; T1.1 caps that sentence at about 120 B or also evicts § Gate contract, so the reserve holds); `agents/war-refiner.md` is already in T2.1's Files, so no plan change | audit of T2.1; T1.1's commit body records the measured headroom |
| A24 | `workflow-template.git-4.test.mjs` has room for one more real-git fixture | harness header: 6 blocks, ~19 s (verified: at 35aa4144) | use `workflow-template.git-1.test.mjs` | gate time |
| A25 | RETIRED — `hooks/reply-standard/subagent-card.war-worker.md` repeats the trailer sentence | verified: 325 B, no `WAR-Task` at 35aa4144 | — | — |
| A26 | The friction-report rows in Non-goals belong to the named sibling plans (#2328 row 4 → args-floor; #2412 exit-2 attestation → engine-findings; #2442 merge-base-relative check → pipeline-skills; #2509 manifest stamps → this plan's D29, because the doc-truth plan declined that row (verified: its Non-goals, untracked, read 2026-11-08)) | spec §9 | the doc-truth or args-floor plan owns them instead; nothing here changes | `/war-machine` roadmap claim sweep |
| A27 | The predecessor plans keep the named constructs (`RELAND_CAS`, `taskProvenanceClause`, `provisionStep` and the rest) under their names | constructs are cited by name, not line | the worker re-finds the renamed construct; the slice stays | worker grep at the rebased base |
| A28 | No existing engine-1 pin reds under T4.1's additive edits beyond the ones T4.1 updates | T4.1 owns engine-1 for that case | none — T4.1 owns the file | T4.1 gate |
| A29 | New optional fields exist only in code and test until the doc-truth plan lands its `schemas.md` rows (spec open risk) | contention note | a reader of `schemas.md` misses the fields for one plan's span | backstop row 1 |
| A30 | T1.2's rebased base carries the args-floor plan's edits to `assert-args-complete.mjs` (that plan names the file 11 times), so the flag parser and header T1.2 extends may have moved | chain order | T1.2 re-finds the flag loop and the header by their `Usage:` and `Exit contract` comments, never by line; the slice is unchanged | T1.2 worker grep at the rebased base |
| A31 | A worker card `## Inputs` bullet is the right standing twin for the dispatched `savedWork` line (D7): the card already lists conditional spawn-prompt inputs there (the `Done when:` bullet, "present only when the plan declares one") | the `## Inputs` section at 35aa4144 | the bullet moves to the dep-wave section; bytes are the same | End state 15 card grep |
| A32 | `git reset -q` before the save is safe on a dead worker's tree: it unstages, never discards, and the following `git diff --binary HEAD` then carries every tracked edit (D7) | git semantics; the grill's d7b scratch run (a staged edit survives `git checkout -- .` and breaks `apply --index`) | a staged rename or mode change needs `--binary`'s rename hunks, which `git apply` honors; if a case still fails, the `savedWork` arm keeps the patch | End state 15 git-1 fixture (staged + unstaged + a provision rewrite of a tracked file) |
| A33 | The prompt's exit number for the land confirm (3) stays bound to `cmd_land_advance`'s `EX_FOREIGN` | `readonly EX_FOREIGN=3` and the PHANTOM LAND arm's `die … "$EX_FOREIGN"` (verified: `provision-worktrees.sh` at 35aa4144) | the T1.1 cross-file pin reads the script and goes red if the constant or the arm changes | End state 1 fixture (the cross-file read) |
| A34 | `record-as-owned <integration> <working branch>` passes its ancestor proof on a same-phase relaunch, because the integration branch was cut from the working tip and phase N has not landed (D27) | `cmd_ensure_integration` cuts from the working tip, and `merge-base --is-ancestor` accepts equal SHAs (verified: at 279a0d4a); a hand `record-as-owned` adoption on a same-phase relaunch passed with every commit mapped and landed 8 of 8 (verified: DocTrail Aligned/reports/2026-10-30-docs-mirror/campaigns/2026-10-30-mobile-v1-corrections/CAMPAIGN-STATE.md, WAR 0.21.35) | a working branch that moved under the run makes the adopt step die `EX_FOREIGN`; that is the right fail-loud (ADR 0003), and the runbook's hand `record-as-owned` with the true base stays the route | End state 21 real-repo fixture and its control |
| A35 | A `push_denied:` prefix inside `blocked_reason` needs no engine read; the escalation arm already holds the task and the Lead reads the reason (D28) | the `PLAN_DEFECT_RULE` precedent; attempt 4 held `held:escalation` (verified: issue #2670 row 4 (2026-11-08)) | add a sentinel read like `PLAN_DEFECT_SENTINEL` that stamps the escalation record; no enum change | End state 22; the Lead at the next denial |
| A36 | A per-record `restamped: <clock read>` field is harmless to `/war-review`, which reads named fields and ignores others (D29) | `run-manifest.md` says nesting may be refined and only the MUST-carry set binds | drop the field and note the catch-up in the ledger instead | End state 23 doc grep; the pipeline-skills plan's war-review task |
| A37 | The ledger's per-phase record carries each attempt's workflow id in a `workflow_run` field (D29) | issue #2671 row 5 says `/war-review` read the ids there (verified: issue #2671 (2026-11-08)); `schemas.md` § ledger.json names no such field at 279a0d4a | the catch-up reads the transcript dirs by date under `subagents/workflows/` and matches them to phases by the journal's plan slug and phase | the T4.2 worker greps `workflow_run` in `schemas.md` and the engine at its base and names the field it finds in the commit body |
| A38 | The explicit refspec `git push origin HEAD:refs/heads/<integration branch>` is the right form from `_refinery` on the integration branch (D31) [assumed: `land-advance`'s form carries over to the integration push — if wrong: the sentence names `git push origin <integration branch>` instead; the fixture reads whichever spelling the const carries] | `budget-raise-floor.md` names the same form for the working branch (verified: at 279a0d4a) | one spelling swap on both surfaces | End state 26 |
| A39 | A `{ aced, minorsFiled }` object under `args.recovery.priorReturn` is the right channel, and re-threading a filed row is safe because the filing dispatch is dedup-first (D32) [assumed: the dedup line matches the held attempt's own issue by exact title — if wrong: T4.1 keeps rows carrying `issue` out of the filing prompt rows (the stamping loop never overwrites them) and records the choice in the commit body] | the `seededPhaseClose` precedent; the `THEN dedup (D3)` line (verified: at 279a0d4a) | one duplicate issue per re-threaded filed row until the exclusion lands | End state 27; the Lead at the next sanctioned relaunch |
| A40 | The harness re-asks a reply that fails a schema `pattern`, as it re-asks a reply that fails the `GATE_CHECK` if/then (D35 (a)) [assumed: pattern failures take the same tool-layer re-ask — if wrong: a 39-hex reply reaches the engine as before, and D35 (b)'s repair arm alone carries the fix, which End state 30's second fixture proves] | the `GATE_CHECK` comment: "a terse green reply is re-asked at the tool layer" (verified: at 279a0d4a) | none — the repair arm is the fallback | End state 30 |
| A41 | One re-dispatch is enough for a transient audit-pin Git read (D36) [assumed: the second read succeeds on a live host — if wrong: raise the retry to the D4 shape (within `roundLimit`), one line] | the reporter asked for one; the D4 precedent exists (verified: issue #2704 (2026-11-08)) | a second transient still holds the task `audit-blocked`, as today | End state 31; `/war-review` at the next such hold |
| A42 | The servitor's grounding ladder handles an anchor that is a merge commit on the integration branch, not a working-branch tip (D34) [assumed: rung 2's worktree lookup or rung 4's gate-audit fallback holds on a hold — if wrong: the card sentence says to take rung 4 at once on a held land] | the card's four-rung ladder and its rung-4 fallback (verified: `agents/war-servitor.md` at 279a0d4a) | lessons tagged `agent-unverified` instead of `code-verified` on held lands | End state 29; the next held land's servitor return |
| A43 | The five named locations are the whole of a run's machine-local state (D37) [assumed: manifest, ledger + owned-refs, args files, saved returns, staged script — if wrong: the Lead who hits the gap adds the path to the bullet in the same session, and `/war-review` records it] | `skills/war/SKILL.md` Setup and the runbook name those paths (verified: at 279a0d4a) | one more hand copy at the next cross-machine resume | End state 32; the Lead at the next cross-machine resume |
| A44 | The handoff block dereferences nothing that is null on `held:land-failed` (D34 (b)) [assumed: it reads only the hoisted `tipSha`, `polishStatus` and the arrays, as its header comment says for `held:escalation` — if wrong: T2.1 guards the one field it finds, like the `mergedRowsOf` element guard] | the block's header comment (verified: at 279a0d4a) | a throw there would turn a held phase into `held:workflow-error`; End state 29's second fixture catches it | End state 29 |

## Non-goals / deferred

- The `land-advance` script and its tests (#1837): `shell-floors-tests-and-lint`.
- `skills/war/references/schemas.md` rows for the new fields: `doc-truth-drift-and-adr-hygiene` (backstop row 1).
- The prologue wrap from spec D13 (PIN-25; TRIAL-1).
- #2328 row 2 (`assert-issues-filed.sh` followUps) and row 6 (`_refinery` path across repos): shell-floors.
  Rows 3 and 7: auditor-and-worker-guard-habits. Row 4: args-floor-and-launch-preflight.
- #2412: worktree-hook Edit denials, worker scratchpad writes and auditor denials → guard-habits;
  demoted-then-fixed findings, the absorb budget, zero-commit polish and the End-state exit-2 attestation →
  engine-findings-ace-and-late-fix. The render-index refusal is not engine work.
- #2442: the three FIXED rows are landed (verified: issue #2442 (2026-10-26); `DIRTY_TASK_STOP` at
  35aa4144). Absorb non-convergence → engine-findings; the merge-base-relative End-state check →
  pipeline-skills-and-memory-tooling.
- #2509: the #1413 floor death → args-floor; auditor denials, worker scratchpad and Bash-advisory false
  positives → guard-habits; Lead manifest stamps → this plan's D29 (T4.2). Its dropped ace re-entry return is already
  covered by `nullDied` at the re-entry site (verified: `rwWhy` at 35aa4144).
- #1910: the harness journal key is out of repo; only D17 (d) lands here.
- #2494: rewriting the trailer on the already-landed commit is an operator call about a default branch.
- #2555: the aceBisect half is fixed by #2625 (verified: `nullDied` call sites at 35aa4144).
- #2669, #2670, #2671 (one run, three reports), rows owned elsewhere: the auditor git guard denials (#2671
  row 3, #2670 row 7, #2669 row 6) and the `validate-evidence-auditor-mcp.sh` denials of the host turn
  tools `mcp__ccd_turn__update_plan` and `mcp__ccd_turn__wrap_up` in audit seats (#2669 row 6) →
  `docs/plans/2026-11-08-auditor-and-worker-guard-habits.md`; the worker edit denials by the host
  worktree guard (#2670 rows 2 and 6, #2669 row 3) → already #2583 and #2637 in that plan; the ace
  re-entry blocked on an ace commit with the wrong message and no `Ace-Subset` or `Ace-Charge` trailer
  (#2669 row 7) and the `absorb-budget:` "barrier returned no absorbCharges map" / "NO usable
  absorbCharges entry" seed-0 rows (#2670 row 9) → `docs/plans/2026-11-08-engine-findings-ace-and-late-fix.md`;
  the jest 5 s flake under host load (#2670 rows 3 and 5, #2671's closing note) is a target-repo test
  defect, not WAR; the mid-run manifest check (PIN-30) → `docs/plans/2026-11-08-pipeline-skills-and-memory-tooling.md`
  (`skills/war-review/SKILL.md`).
- A tool that moves run state between machines (the mechanical half of #2705): no campaign plan owns one;
  D37 ships the Lead-side carry recipe only.

## New domain terms · Recommended ADRs

- **Land confirm** (GLOSSARY.md, via the doc-truth plan): the `ls-remote` plus follower read a refiner runs
  on a `land-advance` exit 3 before it reports an error. "Phantom land" stays the script's name for that arm.
- **Recovery predecessor seed**: the adopted integration tip a sanctioned recovery uses as the first fresh
  merge's `preMergeTip`, kept apart from `lastLandedTip`.
- **Manifest catch-up** (GLOSSARY.md, via the doc-truth plan): the first act of a Lead who takes over a run in
  a new session — restamp every missing or stale phase record in the run manifest from the ledger, git and
  the transcript envelopes (`run-manifest.md` § Hand-off catch-up).
- ADRs: none required. D11 is the one operator choice (Open decision 1).

## Commander's Intent

- **Purpose:** when a phase dies, is relaunched, moves an approved pin, or lands, the engine and the
  refiner say what really happened and no finished work is lost or thrown away.
- **Method:** fix the words and the narrow engine arms each issue names. Confirm a land in Git before calling
  it an error. Keep one bad pin read from killing the phase. Save a dead worker's edits before provision
  cleans the tree. Seed the recovery merge's predecessor. Retire the worker trailer nobody reads. Prove each
  change with a pin that goes red when the change is removed. Keep every engine change and its card twin
  in one task.
- **Mechanism latitude:** the wording of `landConfirmArm` and of the new card and reference sentences; how
  `verifyPinTransfer` and `mergeSnapshot` catch the dispatch-layer throw (a local try or a wrapper); the
  D6 fix site, once the repro names it; the save-and-restore shell form inside the provision prompt; where
  `recoveryPredSeed` is declared; the shape of each fixture; which unpinned tier-2 block each card eviction
  moves; substituting any of these mechanisms while the End states and binding guardrails hold is not a
  plan deviation and warrants no issue.
- **Binding guardrails:** Git is truth — a `landed` from a land confirm still passes `confirmMerge`, and an
  unconfirmed claim never lands (PIN-19 ‡) · no new land-decision or hard-escalation enum member (PIN-18) ·
  `lastLandedTip` stays unset in the preMerged block, `tipSha` unchanged (PIN-20) · no card budget raise;
  card growth is paid by a byte-identical eviction in the same task (PIN-21) · `FORCE_WITH_LEASE_RULE`
  byte-identical (PIN-26) · the never-move hold behavior is unchanged (PIN-3) · `provision-worktrees.sh`,
  `task-integrated.sh` and `schemas.md` untouched (PIN-24, PIN-23) · worker-supplied text is never
  laundered into `env-died` (the `warDispatchDeath` scope stays), and a caught non-infra dispatch throw is
  never minted into a death record — a retry, then the site's existing arm (PIN-4) ·
  `gate: node skills/war/assets/repo-gate.mjs`.
- **End state:**
  Every test check below uses one TAP reader, written out in full each time: it prints `PASS-<id>` and
  exits 0 only when at least the stated number of named `ok` lines print and no top-level `not ok` line
  does; otherwise it prints `RED-<id>` and exits 1. A pattern that matches no test prints `RED-<id>`.
  1. Every land prompt (in-flow, environment-proceed and baseline-proceed re-lands) carries `landConfirmArm`
     at each exit-3 route, dropping it from one site reds a pin, the prompt's exit number is read from
     `provision-worktrees.sh`'s `EX_FOREIGN` and its PHANTOM LAND arm (the cross-file pin), and a confirmed
     land saves the reconcile dispatch (a refiner mock that returns `landed` only when its prompt carries
     the confirm text lands the phase with zero `merge-reconcile` dispatches — red at base, where the
     prompt lacks the text and the `status: 'error'` reply enters reconciliation) · check:
     `node --test --test-reporter=tap --test-name-pattern='land-confirm \(#2657\): (every land prompt|a confirmed land)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - land-confirm \(\\#2657\): (every land prompt|a confirmed land)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E1":"RED-E1"} END{exit !r}'`
     · token: `PASS-E1` · owner T1.1 · red at base: no such test (TRIAL-2 grep read).
  2. `refiner-recovery.md` carries the land-confirm rule and no longer says the retry "exits 0 via Task 1.1"
     · check: `grep -q "ls-remote origin refs/heads" skills/war/references/refiner-recovery.md && ! grep -qi "via Task 1.1" skills/war/references/refiner-recovery.md && echo PASS-E2`
     · token: `PASS-E2` · owner T1.1 · red at base: counts `0` and `1`.
  3. A refiner `landed` claim whose SHA origin does not hold never lands · check:
     `node --test --test-reporter=tap --test-name-pattern='land-confirm \(#2657\): an unconfirmed landed claim' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - land-confirm \(\\#2657\): an unconfirmed landed claim/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E3":"RED-E3"} END{exit !r}'`
     · token: `PASS-E3` · owner T1.1 · red at base: no such test. This is a guardrail fixture (PIN-19):
     it stays green if `landConfirmArm` is deleted, by design; End state 1 is the delete-the-feature check.
  4. The never-move sentence says the engine holds the task, and the old ending is gone from the engine and
     the card · check:
     `! grep -qi "re-merge it, and report it merged" skills/war/assets/workflow-template.js agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='2485/ES9' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - 2485\/ES9/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E4":"RED-E4"} END{exit !r}'`
     · token: `PASS-E4` · owner T1.1 · red at base: the old ending is present once in each file.
  5. A sanctioned recovery run from another plugin root or version is refused before launch, a
     non-recovery launch never reads the manifest, and the relaunch doctrine the runbook sends the Lead to
     names the flag · check:
     `grep -q -- "--prior-manifest" skills/war/references/launch-identity.md && node --test --test-reporter=tap --test-name-pattern='prior-manifest \(#2495\)' skills/war/assets/assert-args-complete.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - prior-manifest \(\\#2495\)/{n++} END{r=(n>=5&&!b)} END{print r?"PASS-E5":"RED-E5"} END{exit !r}'`
     · token: `PASS-E5` · owner T1.2 · red at base: `prior-manifest` is absent from the doc; no such test.
  6. Three cases, each a non-infra tagged throw (`StructuredOutput retry cap exceeded`): (a) a `git-pin:`
     dispatch that throws on every attempt holds only that task as `pin-transfer:unverified`, a sibling
     merges, and the phase is not `held:workflow-error`; (b) a `git-pin-snapshot:` dispatch that throws on
     attempt 1 and returns a good snapshot on attempt 2 lets the task merge (red at base: the first throw is
     HARD today); (c) a `git-snapshot:` dispatch that throws on every attempt ends `held:workflow-error`
     with `workflowError.message` naming the site label and the caught reason, and no `env-died` row ·
     check:
     `node --test --test-reporter=tap --test-name-pattern='pin-proof throw \(#2589\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - pin-proof throw \(\\#2589\)/{n++} END{r=(n>=3&&!b)} END{print r?"PASS-E6":"RED-E6"} END{exit !r}'`
     · token: `PASS-E6` · owner T2.1 · red at base: no such test; the grill's sandbox showed (a) and (b)
     return `held:workflow-error` at base.
  7. A `git_error` string reaches the `pin-transfer:unverified` auditLog row, the `git-pin:` prompt names
     the field, and `refiner-recovery.md` § Uncertain merge reconciliation names the same field · check:
     `grep -q "git_error" skills/war/references/refiner-recovery.md && node --test --test-reporter=tap --test-name-pattern='pin-proof git_error \(#2589\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - pin-proof git_error \(\\#2589\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E7":"RED-E7"} END{exit !r}'`
     · token: `PASS-E7` · owner T2.1 · red at base: `git_error` count 0 in the doc; no such test.
  8. A subset-mode approved ace tip, then a merge, verifies against the ace tip · check:
     `node --test --test-reporter=tap --test-name-pattern='approved ace tip \(#2590\)' skills/war/assets/workflow-template.git-4.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - approved ace tip \(\\#2590\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E8":"RED-E8"} END{exit !r}'`
     · token: `PASS-E8` · owner T2.1 · red at base: no such test. The red proof against the phase-base
     engine is a T2.1 duty (the slice says how; the correctness seat reads the `not ok` line quoted in the
     commit body), not a second tag.
  9. Each dead or dropped dispatch shows in `dispatchFailures` with its label and reason · check:
     `node --test --test-reporter=tap --test-name-pattern='dispatchFailures \(#2645\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - dispatchFailures \(\\#2645\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E9":"RED-E9"} END{exit !r}'`
     · token: `PASS-E9` · owner T2.1 · red at base: no such test.
  10. No worker prompt or worker card asks for a `WAR-Task` trailer, and the card still carries the kept
      no-empty-commit and `git rev-parse HEAD` sentences (so deleting step 5 outright is not a pass) ·
      check:
      `! grep -q "WAR-Task" agents/war-worker.md && grep -qi "never create an empty commit" agents/war-worker.md && grep -q "git rev-parse HEAD" agents/war-worker.md && node --test --test-reporter=tap --test-name-pattern='task provenance \(#2659\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - task provenance \(\\#2659\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E10":"RED-E10"} END{exit !r}'`
      · token: `PASS-E10` · owner T3.1 · red at base: `WAR-Task` is on the card once; no such test. The
      recovery fixtures are two: OLD-absent on both surfaces, NEW-present on both surfaces.
  11. The worker prompt and card forbid reading a commit message from outside the task worktree · check:
      `node --test --test-reporter=tap --test-name-pattern='commit-message read \(#2494\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - commit-message read \(\\#2494\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E11":"RED-E11"} END{exit !r}'`
      · token: `PASS-E11` · owner T3.1 · red at base: no such test.
  12. A recovery worker whose remote task tip is an ancestor of its pre-rebase HEAD is not told it is a stale
      prior attempt: the narrowed sentence (with the ancestry test and the `rev-parse HEAD` before-rebase
      read) is on both surfaces, and the old unconditional run "shares only an older base is a stale prior
      attempt" is on neither · check:
      `grep -q "merge-base --is-ancestor origin/" agents/war-worker.md && ! grep -qiF "older base is a stale prior attempt" agents/war-worker.md skills/war/assets/workflow-template.js && node --test --test-reporter=tap --test-name-pattern='stale-prior-attempt \(#2646\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - stale-prior-attempt \(\\#2646\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E12":"RED-E12"} END{exit !r}'`
      · token: `PASS-E12` · owner T3.1 · red at base: the ancestry phrase is absent from the card and the
      old run is present once on each surface.
  13. A resolved-null implementation worker records verdict `env-died`, and a control that removes the
      `nullDied` route goes red · check:
      `node --test --test-reporter=tap --test-name-pattern='worker-site null \(#2555\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - worker-site null \(\\#2555\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E13":"RED-E13"} END{exit !r}'`
      · token: `PASS-E13` (the fixture and its control) · owner T3.1 · red at base: no such test.
  14. A tagged dispatch-layer throw carrying either verbatim #2328 string or `getaddrinfo ENOTFOUND`
      classifies `env-died`; a tagged throw reading `sha 4019abc`, `task t401 failed` or `refactor oauth
      module title` stays HARD (the decoys that a bare `401` or `oauth` term would launder); an untagged
      engine throw embedding a term in a task title stays HARD (green at base by the structural scope — a
      guardrail case, kept) · check:
      `node --test --test-reporter=tap --test-name-pattern='INFRA_DEATH_RE \(#2328\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - INFRA_DEATH_RE \(\\#2328\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E14":"RED-E14"} END{exit !r}'`
      · token: `PASS-E14` · owner T3.1 · red at base: no such test.
  15. A dirty reused task worktree has its diff saved to `.war/preprovision-<id>.patch` and restored after
      the clean line; `depClause` still omits the clean line; a provision reply with `savedWork` puts that
      path in the next worker prompt and one without it adds no such line; the card's `## Inputs` names
      the saved-work patch; and the dispatched save/clean/restore spelling, extracted from the prompt and
      run through bash in a real repo whose reused worktree holds staged and unstaged edits while a
      provision step rewrites a tracked file, brings every edit back with exit 0 · check:
      `grep -q "preprovision-" agents/war-worker.md && node --test --test-reporter=tap --test-name-pattern='reused-worktree provision \(#2588\)' skills/war/assets/workflow-template.recovery.test.mjs skills/war/assets/workflow-template.git-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - reused-worktree provision \(\\#2588\)/{n++} END{r=(n>=3&&!b)} END{print r?"PASS-E15":"RED-E15"} END{exit !r}'`
      · token: `PASS-E15` · owner T4.1 · red at base: `preprovision-` is absent from the card; no such
      tests. Fixtures: the recovery prompt-text case, the recovery `savedWork` plumbing case, the git-1
      real-repo case.
  16. A sanctioned recovery's first fresh merge after preMerged tasks stamps `preMergeTip` equal to the
      barrier `integrationTip`, and `tipSha` is unchanged when no fresh merge lands · check:
      `node --test --test-reporter=tap --test-name-pattern='recovery predecessor seed \(#2575\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - recovery predecessor seed \(\\#2575\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E16":"RED-E16"} END{exit !r}'`
      · token: `PASS-E16` · owner T4.1 · red at base: no such test.
  17. An `ensure-refinery-worktree` hygiene marker is captured as `{ task: null, refinery: true }` and logs
      without `<task>` · check:
      `grep -q "refinery: true" agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='refinery hygiene \(#1823\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - refinery hygiene \(\\#1823\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E17":"RED-E17"} END{exit !r}'`
      · token: `PASS-E17` · owner T4.1 · red at base: `refinery: true` is absent from the card.
  18. The relaunch runbook names `--fill-defaults`, `status --short`, the `transcriptDir` check, the
      cache-miss stop, the 0-agent entry death and the `preprovision-` patch the provision prompt leaves ·
      check:
      `F=skills/war/references/resume-and-recovery.md; grep -qi -e "--fill-defaults" "$F" && grep -qi "transcriptDir" "$F" && grep -qi "status --short" "$F" && grep -qi "cache miss" "$F" && grep -qi "0-agent" "$F" && grep -qi "preprovision-" "$F" && echo PASS-E18`
      · token: `PASS-E18` · owner T4.2 · red at base: `fill-defaults`, `transcriptDir`, `status --short`, `cache miss`, `0-agent` and
      `preprovision-` are absent.
  19. All four release slots name one version, the next free patch above the integration base · HARD at audit_sha
      (observable: `.claude-plugin/plugin.json` `version`, `marketplace.json` `metadata.version`
      and `plugins[0].version`, and the README `## Status` line are equal, and that version is above the
      version in the integration base's `.claude-plugin/plugin.json`; judge: the plan-faithfulness seat) ·
      owner T5.1 · red at base: the slots equal the base's version. The lock-step suite
      (`version-slots.test.mjs`) is in the gate and needs no second tag here.
  20. Guardrail End state: the card budgets hold and the repository gate is green after every task ·
      gate: `node skills/war/assets/repo-gate.mjs` (member suite
      `skills/war/assets/prompt-surface-budgets.test.mjs`) · no owning task; green at base by design.
  21. On a sanctioned recovery relaunch the barrier prompt adopts an existing unrecorded integration branch
      with `record-as-owned` before `ensure-integration`, the recovery-absent prompt is unchanged, the
      refiner card names the step, and the dispatched spelling run through bash in a real repo whose
      owned-file lacks the branch lets `ensure-integration` exit 0 while a control without the step exits
      3 · check:
      `grep -q "record-as-owned" agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='owned-file adoption \(#2671\)' skills/war/assets/workflow-template.recovery.test.mjs skills/war/assets/workflow-template.git-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - owned-file adoption \(\\#2671\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E21":"RED-E21"} END{exit !r}'`
      · token: `PASS-E21` · owner T4.1 · red at base: `record-as-owned` is absent from the card; no such
      test.
  22. The dep-wave worker prompt and the worker card carry the `push_denied:` stop rule, and
      `FORCE_WITH_LEASE_RULE` is byte-identical · check:
      `grep -q "push_denied" agents/war-worker.md && node --test --test-reporter=tap --test-name-pattern='push-denied \(#2671\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - push-denied \(\\#2671\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E22":"RED-E22"} END{exit !r}'`
      · token: `PASS-E22` · owner T3.1 · red at base: `push_denied` is on no worker surface; no such test.
  23. The runbook carries the `push_denied:` hand-push recipe (the `--force-with-lease=<branch>:<remote
      tip>` form) and the Manifest catch-up first act, and `run-manifest.md` carries the hand-off catch-up
      and keeps the three phrases the doc-truth plan pins · check:
      `F=skills/war/references/resume-and-recovery.md; M=skills/war/references/run-manifest.md; grep -qi "push_denied" "$F" && grep -qi "force-with-lease=" "$F" && grep -qi "Manifest catch-up" "$F" && grep -qi "Hand-off catch-up" "$M" && grep -qi "Dispatch counts are summed across attempts" "$M" && grep -qiE 'overwrite .workflowRunId. \+ .transcriptDir. together' "$M" && grep -qiE 'Archive the died attempt under .attempts\[\].' "$M" && grep -qi "Manifest restamp" "$F" && echo PASS-E23`
      · token: `PASS-E23` · owner T4.2 · red at base: `push_denied`, `force-with-lease=`, `Manifest
      catch-up`, `Manifest restamp` and `Hand-off catch-up` count 0; the three run-manifest.md frozen-phrase greps are green at base by design (the
      present half that keeps the doc-truth pins valid).
  24. The relaunch runbook names the diverged-local-copy repoint before a relaunch: a reused task branch whose
      local tip diverged from origin with an equal patch-id is repointed to the origin tip so the relaunch
      pushes without a lease · check:
      `F=skills/war/references/resume-and-recovery.md; grep -qi "patch-id" "$F" && grep -qi "repoint" "$F" && echo PASS-E24`
      · token: `PASS-E24` · owner T4.2 · red at base: `patch-id` and `repoint` count 0 in the runbook (survey
      fold 2026-11-08).
  25. A `git-snapshot:` dispatch whose every attempt returns a reply with no usable snapshot and a `git_error`
      string ends `held:workflow-error` with that string in `workflowError.message`, so a working branch with
      no local ref is named in the hold · check:
      `node --test --test-reporter=tap --test-name-pattern='snapshot reply git_error \(#2589\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - snapshot reply git_error \(\\#2589\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E25":"RED-E25"} END{exit !r}'`
      · token: `PASS-E25` · owner T2.1 · red at base: no such test (survey fold 2026-11-08).
  26. Both merge-task prompts (the green-gate arm and the baseline-proceed arm) name the integration push as
      `git push origin HEAD:refs/heads/<integration branch>`, and the refiner card's merge-task step carries
      the same form · check:
      `grep -q "HEAD:refs/heads" agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='first-push refspec \(#2699\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - first-push refspec \(\\#2699\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E26":"RED-E26"} END{exit !r}'`
      · token: `PASS-E26` · owner T1.1 · red at base: `HEAD:refs/heads` is absent from the card; no such
      test.
  27. A sanctioned recovery whose `args.recovery.priorReturn` carries the held attempt's `aced` and
      `minorsFiled` rows returns those rows for its pre-merged tasks, stamped `recovered: true`, and none for
      a task that is not pre-merged; a run without `priorReturn` returns today's empty arrays · check:
      `node --test --test-reporter=tap --test-name-pattern='prior-return carry \(#2700\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - prior-return carry \(\\#2700\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E27":"RED-E27"} END{exit !r}'`
      · token: `PASS-E27` · owner T4.1 · red at base: no such test; the preMerged loop writes no `aced` row.
  28. A seeded phase-close row carried again by a held phase keeps its origin `carriedFrom.phase`, and a row
      born in the held phase carries that phase's id · check:
      `node --test --test-reporter=tap --test-name-pattern='carried-from origin \(#2701\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - carried-from origin \(\\#2701\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-E28":"RED-E28"} END{exit !r}'`
      · token: `PASS-E28` · owner T4.1 · red at base: no such test; `carryPhaseClose` stamps `phaseId`.
  29. A phase held on `held:escalation` with a merged sibling and a threaded `memoryLocalRoot` dispatches
      `wrap-up:phase-<id>` once and stays held; a `held:land-failed` phase emits a handoff whose `tipSha` is
      the last merge commit; a `held:workflow-error` phase dispatches no servitor (guardrail); and the
      servitor card says it runs on a held land · check:
      `grep -qi "held land" agents/war-servitor.md && node --test --test-reporter=tap --test-name-pattern='held-land wrap-up \(#2702\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - held-land wrap-up \(\\#2702\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E29":"RED-E29"} END{exit !r}'`
      · token: `PASS-E29` · owner T2.1 · red at base: `held land` is absent from the card; no such test; the
      Wrap-up gate reads `landResult.status === 'landed'`.
  30. `WORKER_RESULT.head_sha` carries the 40-hex pattern, and a worker pin that resolves null while every
      seat `audit_sha` resolves to the Git head is repaired without a second panel (one audit dispatch, an
      auditLog row `pin-repaired:worker`, no `pin-mismatch:reconcile` row) · check:
      `node --test --test-reporter=tap --test-name-pattern='worker head_sha \(#2703\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - worker head_sha \(\\#2703\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E30":"RED-E30"} END{exit !r}'`
      · token: `PASS-E30` · owner T3.1 · red at base: no such test; the schema has no pattern and the
      mismatch arm re-runs the panel.
  31. An `audit-pin:` helper reply of `{ head_sha: '', pins: [] }` on the first attempt and a full
      resolution on the second lets the task approve with no `audit-blocked`; two such replies keep
      today's `audit-blocked` (control) · check:
      `node --test --test-reporter=tap --test-name-pattern='audit-pin retry \(#2704\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - audit-pin retry \(\\#2704\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-E31":"RED-E31"} END{exit !r}'`
      · token: `PASS-E31` · owner T2.1 · red at base: no such test; the first empty reply blocks the task.
  32. The runbook's Resume pre-flight names the machine-local run state and the hand-carry recipe, and its
      Recovery relaunch step names the `priorReturn` threading · check:
      `F=skills/war/references/resume-and-recovery.md; grep -qi "machine-local" "$F" && grep -qi "priorReturn" "$F" && echo PASS-E32`
      · token: `PASS-E32` · owner T4.2 · red at base: `machine-local` and `priorReturn` count 0 in the
      runbook.
  33. A staged phase script carries a one-line args loader and no args JSON, and its sibling args script
      returns the exact args (D38, operator ruling 2026-11-09: the staged-template cap is funded by moving the embedded args into a sibling args script) · check:
      `node --test --test-reporter=tap --test-name-pattern='args sibling \(D38\)' skills/war/assets/stage-workflow.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - args sibling \(D38\)/{n++} END{r=(n>=7&&!b)} END{print r?"PASS-E33":"RED-E33"} END{exit !r}'`
      · token: `PASS-E33` · owner T1.2 · red at base: no such test.
  34. `ARGS_HEADROOM_BYTES` reserves only the loader prelude · check:
      `grep -qE 'const ARGS_HEADROOM_BYTES = [0-9]{1,4}$' skills/war/assets/stage-workflow.test.mjs && echo PASS-E34`
      · token: `PASS-E34` · owner T1.2 · red at base: the value is 119808 (6 digits).

## Build order (for /war)

Phase 1 (T1.2 → T1.1, a deps wave: T1.1 needs the cap room T1.2 frees) → Phase 2 (T2.1) → Phase 3 (T3.1) → Phase 4 (T4.1 ∥ T4.2) → Phase 5 (T5.1, release).
Phases 1–4 are serial because each has the single `workflow-template.js` owner. Inside Phases 1 and 4 the two
tasks share no file. Phase 4's two tasks run in one wave, and Phase 1 runs T1.2 first.

## Phase 1 — Land confirm, never-move wording, plugin identity floor

### Task 1.1: Land confirm at every exit-3 route, the D4 prose fix and the never-move sentence
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `skills/war/references/refiner-recovery.md`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`, `skills/war/assets/workflow-template.recovery.test.mjs`
- Plan slice: Fund the card first (PIN-21). Red-team round 1: `workflow-template.recovery.test.mjs` pins the Server-side push error bullet three ways (the #2626 card asserts on `RELAND_REMOTE_REJECTED` and `RELAND_ADVANCE_TIMEOUT`, the Every-attempt line rule over `refiner-recovery.md`, and the `recoveryTriggers` set of linked § names). Update all three in this diff, or keep those two sentences on the card and evict other bytes: move the card's "Land-advance escalate" and "Server-side push
  error" bullets (§ land-phase, Superproject phase) byte-identical into `refiner-recovery.md` § Reland
  discrimination, and leave one pointer bullet of the form `when land-advance exits non-zero, read
  references/refiner-recovery.md (§ Reland discrimination)`, linked the way the card's other
  refiner-recovery pointers are. Re-measure headroom with `wc -c` at the rebased base; leave at least 200 B
  free after this task (A23 pre-funds T2.1's one card sentence from it) and record the measured number in
  the commit body. Then add a shared
  const `landConfirmArm` (D1, PIN-1) and use it at `RELAND_CAS`, at `landPrompt`'s "On any other exit"
  bullet, and at both `landErrorArm` uses in `relandDiscrimination`, so an exit 3 reads `ls-remote` and the
  follower before `landErrorArm`. In `refiner-recovery.md`, add the same rule after the moved bullets and in
  the 2A arm (§ Submodule phase — 2A), and rewrite the D4 clause per D2 (PIN-2): say that the retry exits 0
  only when the follower lags and that a follower already at `<merge-sha>` takes the script's PHANTOM LAND
  arm (name the arm; the exit number lives in the prompt const and is bound by the cross-file pin below).
  Harness: a new shared fixture, builder or constant goes in `workflow-template.test-harness.mjs` per its
  `WHERE A NEW TEST GOES` header; a helper one test uses stays local to the part file. Rewrite
  `NEVER_MOVE_MERGED` to the D3 sentence (PIN-3) and carry it at `neverMoveStep`, the probe step (2) site
  and card merge-task step 1. Engine-1: update `2485/ES9` to the D3 sentence and assert the old ending absent
  from the engine source and the card; update the existing exit-3 pin on `relandDiscrimination`'s
  server-side text; add `land-confirm (#2657): every land prompt carries landConfirmArm` (byte-equal at all
  three land prompts, the same rule text on `refiner-recovery.md` — the touched-doc guard — and the
  cross-file read: `provision-worktrees.sh` carries `readonly EX_FOREIGN=3` and its PHANTOM LAND arm dies
  with `"$EX_FOREIGN"`, so the exit number the prompt names is bound to the script, A33),
  `land-confirm (#2657): delete control` (drops it from one site and the pin goes red),
  `land-confirm (#2657): a confirmed land saves the reconcile dispatch` (a refiner mock answers `landed`
  only when its prompt contains the `landConfirmArm` text and `{ status: 'error' }` otherwise; the phase
  lands with zero `merge-reconcile` dispatchKind calls — at base the mock sees no confirm text, answers
  `error`, and `reconcileMerge` runs, so the fixture is red there), and `land-confirm (#2657): an
  unconfirmed landed claim` (the refiner returns `landed` but origin does not hold the SHA; the phase must
  not land — PIN-19; a guardrail fixture that stays green without `landConfirmArm`). Sweep: grep
  `landErrorArm` and `exits 3` in `skills/war/assets/workflow-template.js`,
  `agents/war-refiner.md` and `skills/war/references/refiner-recovery.md`, and handle every match. Manual
  same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for
  same-meaning siblings worded differently, and list each straggler as a survey-derived correction. Sweep:
  grep `report it merged` and `NEVER_MOVE_MERGED` repo-wide, and handle every match. Manual same-scope survey
  required: after the grep, hand-scan the target file's same-scope tests and comments for same-meaning
  siblings worded differently, and list each straggler as a survey-derived correction. Known survey-derived
  exception: the reconcile prompt's "an existing such merge commit IS the merge: report it merged" and its
  `workflow-template.git-4.test.mjs` pin stay, because reconcile records merges from Git. D31 (PIN-31,
  #2699): at both merge step (c) sites (grep `push, return { mode: 'merge-task', status: 'merged'`) replace
  the bare "push" with `git push origin HEAD:refs/heads/${ph.integrationBranch}` (one spelling at both sites;
  never `-u`), and give the card's merge-task step 9 one sentence (≤ 150 B) naming the same form and why (a
  fresh integration branch has no upstream) — paid from the eviction above, with the ≥ 200 B reserve still
  left and the measured number in the commit body. Engine-1 fixture `first-push refspec (#2699): both merge
  prompts and the card` — the dispatched green-gate and baseline-proceed merge-task prompts both carry
  `git push origin HEAD:refs/heads/<integration branch>` and the card carries `HEAD:refs/heads/`; prove it red
  against the phase-base engine before the change. Measure the stripped engine size per commit (constraint
  12) and record it in the commit body.
- Done when: `! grep -qi "re-merge it, and report it merged" skills/war/assets/workflow-template.js agents/war-refiner.md && grep -q "ls-remote origin refs/heads" skills/war/references/refiner-recovery.md && ! grep -qi "via Task 1.1" skills/war/references/refiner-recovery.md && grep -q "HEAD:refs/heads" agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='land-confirm \(#2657\)|2485/ES9|first-push refspec \(#2699\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - (land-confirm \(\\#2657\)|2485\/ES9|first-push refspec \(\\#2699\))/{n++} END{r=(n>=6&&!b)} END{print r?"PASS-T1.1":"RED-T1.1"} END{exit !r}'` · token: `PASS-T1.1` (ES9, the land-prompt pin, its delete control, the saved-reconcile fixture, the unconfirmed-claim fixture and the first-push fixture)
- requiresTest: true
- requiresPackaging: false
- deps: [1.2]
- deps note: the engine growth needs the staged room the args sibling script frees.
- target repo: superproject

### Task 1.2: Plugin identity floor for a sanctioned recovery relaunch, and the args sibling script
- Files: `skills/war/assets/assert-args-complete.mjs`, `skills/war/assets/assert-args-complete.test.mjs`, `skills/war/references/launch-identity.md`, `skills/war/assets/stage-workflow.mjs`, `skills/war/assets/stage-workflow.test.mjs`, `skills/war/references/staged-script.md`, `docs/adr/0037-run-scoped-staged-phase-scripts.md`, `skills/war/assets/workflow-template.submodule-1.test.mjs`, `GLOSSARY.md`
- Plan slice: Add `--prior-manifest <path>` per D10 (PIN-10). When `args.recovery.sanctioned === true`,
  compare the running plugin root — new code: `realpathSync(fileURLToPath(import.meta.url))`, then three
  `dirname()` calls up from `skills/war/assets/` (the default `--template` path uses `fileURLToPath` without
  the realpath); never `process.env` — and its `.claude-plugin/plugin.json` version with the manifest's `pluginRoot`
  (realpath'd) and `pluginVersion`. A mismatch exits 1 and prints both values and the `--plugin-dir` form;
  an absent or null field warns on stderr and exits 0; a non-recovery launch, or a launch without the flag,
  never reads the manifest. Update the header exit contract and usage lines. Re-find the flag loop and the
  header by their `Usage:` / `Exit contract` comments: the args-floor plan edits this file at your base
  (A30). Fixtures, each named `prior-manifest (#2495): <case>`: version mismatch
  exits 1 and prints both versions; root mismatch exits 1 (a manifest `pluginRoot` pointing at a temp
  directory); a manifest without the fields warns and exits 0; a non-recovery launch never reads the
  manifest (a `--prior-manifest` path that does not exist still exits 0); a matching root and version exits
  0 with no warning. In `launch-identity.md`'s recovery paragraph (the one the runbook's "Fresh identity"
  bullet sends the Lead to), add one sentence: on a sanctioned recovery relaunch, run the args-complete
  preflight with `--prior-manifest <prior run's manifest path>` so the plugin-identity floor runs, and
  point at the script's header exit contract for the codes (touched-doc rule: de-mirror, no exit code
  restated). That sentence is the Lead-side wiring; the SKILL.md preflight line is unchanged.
  Then the args sibling script (D38, operator ruling 2026-11-09: the staged-template cap is funded by moving the embedded args into a sibling args script). In `stage-workflow.mjs`, under `--args <file>`, write the
  validated args to `<staged basename>.args.js` (a meta statement, then `return` of the JSON) and make
  `insertArgsPrelude` emit a loader that runs only when no args were dispatched and never throws at load:
  `let EMBEDDED_ARGS = null, EMBEDDED_ARGS_ERROR = null` and `if (!args) try { EMBEDDED_ARGS = await
  workflow({ scriptPath: '<absolute path>' }) } catch (e) { EMBEDDED_ARGS_ERROR = e }`. The
  `ARGS_FALLBACK_ANCHOR` rewrite becomes `(args || EMBEDDED_ARGS || <throw a named Error: args sibling load
  failed, plus the caught message>)`; the anchor sits inside the engine's top-level `try {`, so a bad
  sibling returns a structured `held:workflow-error` and PIN-25 holds. Keep the `EMBEDDED_ARGS` name.
  Partial presence: a staged copy whose sibling is missing exits non-zero and names `--force` /
  `--discard-injections`; a sibling with no staged copy is overwritten; `--force` refuses when either
  file's sidecar mismatches. Give the args script its own
  `.sha256` sidecar, apply write-if-absent and `--force` to both files together, and refuse either file
  over `SCRIPT_BYTE_CAP`. Lower `ARGS_HEADROOM_BYTES` in `stage-workflow.test.mjs` to the prelude reserve
  (4,096 B or less) and keep arm (p). Add fixtures named `args sibling (D38): <case>`: the staged copy
  carries the one-line loader and no args JSON; the sibling returns the exact args object (evaluate its
  body with a stub `workflow`); a `--force` restage over a hand-edited sibling refuses; an over-cap args
  file refuses; dispatched args skip the loader; a missing sibling yields a `held:workflow-error` whose
  message names the args sibling; a staged copy with no sibling refuses reuse. Rewrite the seven existing
  `stage-workflow.test.mjs` rows the sibling change turns red: (i) restore-roundtrip, (i) CRLF two lines,
  (j) prelude byte-equal, (m) falsy-args fallback (it needs a `workflow` stub), `indent-strip:
  NAME_ANCHOR and ARGS_FALLBACK_ANCHOR substitute on the staged form`, (q) over-cap naming of the args
  size, and (t) every write leaves a matching sidecar. In `workflow-template.submodule-1.test.mjs`, compile
  the staged copy locally with a `workflow` parameter that evaluates the sibling (a helper one test uses
  stays local; wrap the compile site in `runForm`), so the shared harness is untouched. Update `assert-args-complete.test.mjs`'s `CLI --template: EMBEDDED_ARGS prose` fixture to
  read the prose from the sibling, and keep `assert-args-complete.mjs` reading the args file the Lead
  passes. In `staged-script.md`, rewrite the room snapshot and the embedding description for the sibling
  (touched-doc rule: de-mirror the byte numbers to a pointer at arm (p)); never write the `EMBEDDED_ARGS`
  identifier there, because the D30 census in `skill-doc-contracts.test.mjs` pins its surfaces. In
  `GLOSSARY.md`'s staged-script entry, replace the prelude-carries-the-args and two-prelude-lines
  wording with the sibling args script and its loader. Also fix the stager header's travel-with-the-script
  sentence. Append a dated ADR 0037 amendment
  that records D38 and the ruled headroom drop. Leave `workflow-template.js` and `skills/war/SKILL.md`
  unchanged: the fallback anchor and the `EMBEDDED_ARGS` name keep the engine true, and SKILL.md's
  "over-size args ride the staged script (`--args <file>`)" stays true because the sibling is part of the stage.
- Done when: `grep -q -- "--prior-manifest" skills/war/references/launch-identity.md && node --test --test-reporter=tap --test-name-pattern='prior-manifest \(#2495\)' skills/war/assets/assert-args-complete.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - prior-manifest \(\\#2495\)/{n++} END{r=(n>=5&&!b)} END{print r?"PASS-T1.2":"RED-T1.2"} END{exit !r}' && node --test --test-reporter=tap --test-name-pattern='args sibling \(D38\)' skills/war/assets/stage-workflow.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - args sibling \(D38\)/{n++} END{r=(n>=7&&!b)} END{print r?"PASS-T1.2b":"RED-T1.2b"} END{exit !r}' && grep -qE 'const ARGS_HEADROOM_BYTES = [0-9]{1,4}$' skills/war/assets/stage-workflow.test.mjs && echo PASS-T1.2c` · token: `PASS-T1.2`, then `PASS-T1.2b`, then `PASS-T1.2c`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 2 — Pin proof scope, approved ace tree, death text

### Task 2.1: One bad pin read holds one task, the ace tip is the approved tree, and dead seats are named
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `agents/war-servitor.md`, `skills/war/references/refiner-recovery.md`, `skills/war/assets/workflow-template.git-4.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`
- Plan slice: Repro first (D6, PIN-6): add `approved ace tip (#2590): subset-mode approval then merge` to
  `workflow-template.git-4.test.mjs` — a real-git fixture of an ace commit approved in subset mode (one seat
  re-run, the rest transferred), then a merge, asserting `pin-transfer:git-verified` and `pins[0]` equal to
  the ace tip; a second shape drives the merge-slot `mismatch` re-audit after a prior ace (the fourth
  `r.seats` site, `r.seats = rbSeats`, which writes no `aceSha` — A7) and asserts the same. Run both against
  the phase-base engine (restore the base file in your worktree, run, then
  restore HEAD's file) and quote each `not ok` line in the commit body. Then fix the path the repro names,
  under the rule: every arm that sets `r.seats` to an approving re-audit at tip T also sets `r.aceSha = T`,
  and no later `approvedShaOf` read overwrites an approved tip. If no repro can be made red, return
  `PLAN-DEFECT:` with the repro and land the rest of this slice. D4 (PIN-4): in `verifyPinTransfer` and
  `mergeSnapshot`, a tagged dispatch-layer throw (`warDispatchDeath === true`) that `infraDeathCause` does
  not match counts as a failed attempt and the loop retries within `roundLimit`; exhaustion keeps each
  site's existing arm — the pin proof returns `null` (→ `pin-transfer:unverified`), the snapshot keeps its
  HARD `Git merge snapshot unavailable` throw with the last caught reason appended to the message. When the
  last attempt returned a reply with no usable snapshot instead of throwing, append that reply's `git_error`
  when present (D5: add optional `git_error` to `MERGE_SNAPSHOT` and a Git-error answer to the `git-snapshot:` and `git-pin-snapshot:` prompts — empty-string SHA fields plus `git_error` — so the reply passes the schema), so a working branch with no local ref is
  named in the hold rather than the bare site label (End state 25; survey fold 2026-11-08). Never
  mint a `DISPATCH_DEATH` record from a caught non-infra throw (the binding guardrail); an untagged throw
  rethrows HARD at once. D5 (PIN-5): optional `git_error` on
  `PIN_GIT_PROOF`, the prompt's Git-error answer, and the auditLog row; add the `git_error` answer to
  `refiner-recovery.md` § Uncertain merge reconciliation, which the card already points at (A23); if the
  audit rules the pointer is not a twin, add one sentence (≤ 60 B) to the card's § Git mutation recovery
  from the headroom T1.1 left — no eviction, no plan change. D13 (PIN-13):
  `dispatchFailures: [{ label, reason }]` on both top-level returns, one row per `dispatchDied` call, per
  caught D4 attempt and per dropped audit seat. Harness: a new shared fixture, builder or constant goes
  in `workflow-template.test-harness.mjs` per its `WHERE A NEW TEST GOES` header; a helper one test uses
  stays local. Engine-1 fixtures: `pin-proof throw (#2589): git-pin every attempt` (a `git-pin:` dispatch
  throws `StructuredOutput retry cap exceeded` on every attempt; that task is `pin-transfer:unverified`, a
  sibling merges, `landDecision` is not `held:workflow-error`), `pin-proof throw (#2589): pin-snapshot
  retry` (a `git-pin-snapshot:` dispatch throws on attempt 1 and answers a good snapshot on attempt 2; the
  task merges), `pin-proof throw (#2589): snapshot exhaustion stays HARD` (a `git-snapshot:` dispatch throws
  on every attempt; `landDecision` is `held:workflow-error`, `workflowError.message` names the site label
  and the caught reason, no `env-died` row, and `dispatchFailures` lists each attempt), `pin-proof
  git_error (#2589)` (the auditLog row carries the string and the `git-pin:` prompt names the field),
  `dispatchFailures (#2645)`, `snapshot reply git_error (#2589)` (a `git-snapshot:` dispatch answers a reply
  with no usable snapshot and `git_error: "fatal: no local ref for the working branch"` on every attempt;
  `landDecision` is `held:workflow-error` and `workflowError.message` contains that string). Sweep: grep
  `spawnRefinerRecovery() : spawn('refiner')` for every read-only Git dispatch D4 covers, and handle every
  match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope tests and
  comments for same-meaning siblings worded differently, and list each straggler as a survey-derived
  correction. Sweep: grep `r.aceSha =` and `r.seats =` (four `r.seats` sites, three `r.aceSha` sites at
  35aa4144), and check that each approving arm sets both. Manual
  same-scope survey required: after the grep, hand-scan the target file's same-scope tests and comments for
  same-meaning siblings worded differently, and list each straggler as a survey-derived correction.
  D36 (PIN-36, #2704): wrap the `audit-pin:` dispatch so a malformed reply (`pins` not an array, a length
  unequal to the request, or a non-null pin failing the prefix check) is re-dispatched once with one log
  line naming the shape; a second malformed reply takes today's `return { seats: [], expected, died }` arm;
  `deathOf` on either attempt keeps the env-died return. D34 (PIN-34, #2702): widen the Wrap-up gate to
  `landDecision` in `landed`, `held:escalation`, `held:land-failed` with `memoryLocalRoot`; the prompt's
  first line names the land decision and the working branch instead of "landed on", the `Landed tip:` line
  keeps `landedTipAnchor`; add `held:land-failed` to the handoff block's condition and read the block once
  for any field null only there (A44); update the filing block's comment that says no handoff emits on
  `held:land-failed`. Card twin: one sentence (≤ 160 B) in the servitor card's opening paragraph — it also
  runs on a held land (`held:escalation` or `held:land-failed`), where the anchor is the last merge tip.
  Sweep: grep `servitorResult` in the engine and in `skills/war/SKILL.md` § Checkpoint, and list any reader
  that infers `landed` from a non-null `servitorResult` as a survey-derived correction (SKILL.md is not in
  this task's Files; report, never edit). Engine-1 fixtures: `audit-pin retry (#2704): one empty reply then a
  good one approves` (the helper mock answers `{ head_sha: '', pins: [] }` on its first `audit-pin:` call and
  a full resolution on its second; the task approves; no `audit-blocked` in auditLog), `audit-pin retry
  (#2704): two empty replies keep audit-blocked` (control), `held-land wrap-up (#2702): servitor on
  held:escalation` (a phase held on one escalation with one merged sibling and a threaded `memoryLocalRoot`
  dispatches `wrap-up:phase-<id>` once; `landDecision` stays `held:escalation`; `servitorResult` is the
  mock's return), `held-land wrap-up (#2702): handoff on held:land-failed` (the existing held:land-failed
  fixture shape; `handoff.tipSha` equals the last merge commit), `held-land wrap-up (#2702): no servitor on
  held:workflow-error` (guardrail). Prove each red against the phase-base engine before the change. Measure
  the stripped engine size per commit (constraint 12) and record it in the commit body.
- Done when: `grep -q "git_error" skills/war/references/refiner-recovery.md && grep -qi "held land" agents/war-servitor.md && node --test --test-reporter=tap --test-name-pattern='approved ace tip \(#2590\)' skills/war/assets/workflow-template.git-4.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - approved ace tip \(\\#2590\)/{n++} END{r=(n>0&&!b)} END{print r?"PASS-T2.1a":"RED-T2.1a"} END{exit !r}' && node --test --test-reporter=tap --test-name-pattern='pin-proof (throw|git_error) \(#2589\)|snapshot reply git_error \(#2589\)|dispatchFailures \(#2645\)|audit-pin retry \(#2704\)|held-land wrap-up \(#2702\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - (pin-proof (throw|git_error) \(\\#2589\)|snapshot reply git_error \(\\#2589\)|dispatchFailures \(\\#2645\)|audit-pin retry \(\\#2704\)|held-land wrap-up \(\\#2702\))/{n++} END{r=(n>=11&&!b)} END{print r?"PASS-T2.1b":"RED-T2.1b"} END{exit !r}'` · token: `PASS-T2.1a` then `PASS-T2.1b` (the five earlier engine-1 fixtures, the End state 25 snapshot fixture, the two audit-pin fixtures and the three held-land fixtures)
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 3 — Worker surfaces: trailer, commit-message read, recovery push, worker-site null, infra terms

### Task 3.1: Worker prompt and card changes with their pins
- Files: `skills/war/assets/workflow-template.js`, `agents/war-worker.md`, `skills/war/references/worker-servitor-edges.md`, `skills/war/assets/workflow-template.recovery.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`
- Plan slice: D14 (PIN-14) first: delete the trailer sentence from `taskProvenanceClause` and from card
  step 5, keeping the no-empty-commit and `git rev-parse HEAD` sentences and the one-trailer-block sentence
  (it still governs `Ace-Charge:` and attribution lines). D15 (PIN-15): one sentence on both surfaces —
  never read a commit message from a scratchpad or any path outside your own task worktree (add the write
  half too only if the guard-habits rule is absent at your rebased base). D8 (PIN-8, PIN-26): narrow
  `STALE_PRIOR_ATTEMPT_RULE` and its card sentence to apply only when `git merge-base --is-ancestor
  origin/<branch> <pre-rebase HEAD>` exits 1, and say in the sentence that `<pre-rebase HEAD>` is the SHA
  recorded with `git rev-parse HEAD` before the rebase (`ORIG_HEAD` right after it); the old run "shares
  only an older base is a stale prior attempt" must be gone from both surfaces;
  `FORCE_WITH_LEASE_RULE` stays byte-identical. D28 (PIN-28): add one const `LEASE_DENIED_RULE` beside
  `STALE_PRIOR_ATTEMPT_RULE` in `depClause`, and the same sentence after the stale-prior-attempt sentence in
  the card's § Dep-wave rebase + force-with-lease carve-out: when the host denies the lease push (a
  permission or classifier denial, not a git rejection), stop — return `status: "blocked"` with
  `blocked_reason` starting `push_denied:` followed by the exact command and the denial text; never retry
  the push, never a plain `--force`, never another ref. No engine read of the prefix (A35). D11 (PIN-11):
  route a resolved null at the implementation, fix-round, floor-fix, late-fix and wave-side ace sites
  through `nullDied`. D12 (PIN-12): widen `INFRA_DEATH_RE` with the bounded phrases D12 lists and no bare
  term; update its header comment and the null-arm
  comment above it in the same diff. Fund the worker card (PIN-21): `## Harness note` is 171 B and `## Comment hygiene (before commit)` is 616 B; the
  D8, D15 and D28 sentences add more than 171 B, so expect to move both blocks. At `7e70e874` the card has 20 B free (13,292 B), and each moved block leaves an ADR 0042 trigger pointer of about 140 to 190 B, so the two blocks free about 516 B net against at least 577 B needed. Measure each pointer before you count a block as freed, and move a third unpinned tier-2 block or shorten the new sentences until the hard line holds. D39 (#2750): add one sentence to `floorFixHead` saying a merge-slot rebase may have moved your task branch off its pushed remote, that this rebase counts as a dispatch-rebase for the lease carve-out, and that a host-denied lease push takes the D28 route. `FORCE_WITH_LEASE_RULE` stays byte-identical (PIN-26). Engine-1 fixture `merge-slot lease (#2750): floorFixHead names the dispatch-rebase carve-out`; prove it red against the phase-base engine. If the net card growth
  exceeds the headroom measured at the rebased base, move one tier-2 block byte-identical into
  `worker-servitor-edges.md` with a trigger pointer; candidate `## Harness note` (heading and body named
  by no test), then `## Comment hygiene (before commit)`; never `## Prior lessons (memory)`, which
  `memory-tool-name.test.mjs` and an engine-1 test read, and never a block this plan edits. Leave at
  least 120 B free after this task for T4.1's one `## Inputs` bullet, and record the measured headroom in
  the commit body. Harness: a new shared fixture, builder or constant goes in
  `workflow-template.test-harness.mjs` per its `WHERE A NEW TEST GOES` header; a helper one test uses
  stays local.
  Recovery test: replace the `TASK PROVENANCE: put the exact trailer` pin with two fixtures named `task
  provenance (#2659): <case>`: OLD-absent (the trailer sentence is on neither the dispatched prompt nor
  the card) and NEW-present (the no-empty-commit and `git rev-parse HEAD` sentences are on both). Engine-1:
  update the existing null-worker default-reason pin; update the criterion-14 stale-sentence pin to the
  narrowed sentence and make its FRAG the old run, asserted ABSENT on both surfaces (SKILL §3 rule 6: a
  scope narrowing asserts the old scope gone, not only the new one present); add `stale-prior-attempt
  (#2646)` (narrowed sentence present on both surfaces, delete-the-feature per surface),
  `commit-message read (#2494)` (both surfaces), `push-denied (#2671): both surfaces` (the
  `LEASE_DENIED_RULE` sentence with `push_denied:` on the dispatched dep-wave prompt and on the card, a
  row in the D3 both-surfaces directive registry, and the `FORCE_WITH_LEASE_RULE` byte-compare untouched),
  `worker-site null (#2555): implementation null is env-died`
  and `worker-site null (#2555): control` (removes the `nullDied` route and goes red), `INFRA_DEATH_RE
  (#2328)` (positive: the two verbatim #2328 strings and `getaddrinfo ENOTFOUND` on a tagged throw
  classify `env-died`; negative: tagged throws reading `sha 4019abc`, `task t401 failed` and `refactor
  oauth module title` stay HARD; guardrail: an untagged engine throw embedding a term in a task title stays
  HARD). Sweep: grep
  `WAR-Task` in `agents/war-worker.md` and in the worker prompt builders of `workflow-template.js`, and handle
  every match. Manual same-scope survey required: after the grep, hand-scan the target file's same-scope
  tests and comments for same-meaning siblings worded differently, and list each straggler as a
  survey-derived correction (the refiner's merge-commit `--trailer "WAR-Task: …"` lines stay). Sweep: grep
  `blockedReason(`, and handle each worker-site match per D11. Manual same-scope survey required: after the
  grep, hand-scan the target file's same-scope tests and comments for same-meaning siblings worded
  differently, and list each straggler as a survey-derived correction (the sweep and terminal sites stay
  fail-open). D35 (PIN-35, #2703): add `pattern: '^[0-9a-f]{40}$'` to `WORKER_RESULT.head_sha` (the field
  stays optional); in the audit-pin reconciliation, when `pins[0]` (the worker's pin) is the only mismatch
  and every seat pin resolved equal to `head_sha`, set `pin = resolved.head_sha`, push
  `{ task, verdict: 'pin-repaired:worker', ... }` to auditLog and return the seats — no re-audit; a seat
  mismatch keeps today's `pin-mismatch:reconcile` arm. Both worker surfaces: the kept D14 sentence says
  `head_sha` is all 40 hex characters from `git rev-parse HEAD` (card step 5 and `taskProvenanceClause`; the
  card grows about 20 B, inside the headroom this task leaves). Engine-1 fixtures: `worker head_sha (#2703):
  schema pattern` (read `WORKER_RESULT` through the harness's `evalTemplateConst`; the `head_sha` pattern
  accepts 40 hex and rejects 39), `worker head_sha (#2703): worker-pin-only mismatch repairs without a
  re-audit` (the worker returns a 39-hex `head_sha`; the audit-pin mock resolves it null and every seat to
  the head; exactly one panel dispatch, verdict approve, a `pin-repaired:worker` row, no
  `pin-mismatch:reconcile` row — red at base: two panels and a reconcile row). Measure the stripped engine
  size per commit (constraint 12) and record it in the commit body.
- Done when: `! grep -q "WAR-Task" agents/war-worker.md && grep -q "merge-base --is-ancestor origin/" agents/war-worker.md && ! grep -qiF "older base is a stale prior attempt" agents/war-worker.md skills/war/assets/workflow-template.js && node --test --test-reporter=tap --test-name-pattern='task provenance \(#2659\)' skills/war/assets/workflow-template.recovery.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - task provenance \(\\#2659\)/{n++} END{r=(n>=2&&!b)} END{print r?"PASS-T3.1a":"RED-T3.1a"} END{exit !r}' && node --test --test-reporter=tap --test-name-pattern='stale-prior-attempt \(#2646\)|commit-message read \(#2494\)|worker-site null \(#2555\)|INFRA_DEATH_RE \(#2328\)|push-denied \(#2671\)|worker head_sha \(#2703\)|merge-slot lease \(#2750\)' skills/war/assets/workflow-template.engine-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - (stale-prior-attempt \(\\#2646\)|commit-message read \(\\#2494\)|worker-site null \(\\#2555\)|INFRA_DEATH_RE \(\\#2328\)|push-denied \(\\#2671\)|worker head_sha \(\\#2703\)|merge-slot lease \(\\#2750\))/{n++} END{r=(n>=9&&!b)} END{print r?"PASS-T3.1b":"RED-T3.1b"} END{exit !r}'` · token: `PASS-T3.1a` then `PASS-T3.1b`
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 4 — Recovery barrier and provision, and the runbook

### Task 4.1: Reused-worktree save, recovery predecessor seed, refinery hygiene rows
- Files: `skills/war/assets/workflow-template.js`, `agents/war-refiner.md`, `agents/war-worker.md`, `skills/war/references/refiner-recovery.md`, `skills/war/references/worker-servitor-edges.md`, `skills/war/assets/workflow-template.recovery.test.mjs`, `skills/war/assets/workflow-template.git-1.test.mjs`, `skills/war/assets/workflow-template.engine-1.test.mjs`, `skills/war/assets/workflow-template.test-harness.mjs`
- Plan slice: D7 (PIN-7): the save-and-restore preamble in `provisionStep`'s task-worktree prompt only (not
  `_refinery`), as two named consts (save: `git reset -q`, then on a non-empty `git status --porcelain
  --untracked-files=no` write `git diff --binary HEAD` to `.war/preprovision-<task id>.patch`; restore after
  the clean line: `git apply <patch>`, worktree only); optional `savedWork` on `ENV_OUTCOME`, carried from
  the provision reply into the wave thunk's worker prompt as one line naming the patch when set and no
  line otherwise; the worker card's `## Inputs` gets one bullet — the saved-work patch path, recovery
  only, apply it before you start (A31) — paid from the headroom T3.1 left, else by moving `## Harness
  note` (or the next unpinned block T3.1 did not move) byte-identical into `worker-servitor-edges.md`
  with a trigger pointer; `PROVISION_RERUN_CLAUSE` unchanged. D9 (PIN-9, PIN-20): optional `integrationTip` on the barrier derive
  step and `ENV_OUTCOME`; `recoveryPredSeed` set only when `recovery` and preMerged rows exist; `landMerged`
  reads `lastLandedTip ?? recoveryPredSeed`; `lastLandedTip` stays unset. D16 (PIN-16): widen
  `worktreeHygieneClause` to `ensure-refinery-worktree` rows `{ task: null, refinery: true, path, action,
  detail }`, and the log line renders them without `<task>`. D27 (PIN-27): a recovery-gated
  `adoptOwnedClause` that rides the barrier prompt only when `recovery` and `ownedFile` are both set, placed
  before step 2 (beside `holderFreeClause`, which also runs before steps 2–4): if `git show-ref --verify
  --quiet refs/heads/<integration branch>` exits 0 and `grep -qxF '<integration branch>' <ownedFile>`
  exits 1, run `provision-worktrees.sh record-as-owned <integration branch> <working branch> --owned-file
  <ownedFile>`, then step 2 as today; a non-zero exit returns `{ ok: false, … }` with the die text in
  `stderrTail` and stops (A34). The recovery-absent barrier prompt stays byte-identical. Card twin: the
  barrier step's `integrationTip` and `refinery: true` words, one sentence in the refiner card's barrier
  step 1 naming `record-as-owned` before `ensure-integration` on a sanctioned relaunch, and the provision
  preamble's twin sentence. Fund the card (PIN-21): move one
  tier-2 block that no `skills/war/assets/*.test.mjs` assertion reads from the card byte-identical into
  `refiner-recovery.md` with a trigger pointer; never a block this plan edits. Harness: a new shared
  fixture, builder or constant goes in `workflow-template.test-harness.mjs` per its `WHERE A NEW TEST GOES`
  header (the two new preamble consts get `evalTemplateConst` readers there, beside
  `PROVISION_CLEAN_SENTENCE`); a helper one test uses stays local. Recovery fixtures:
  `reused-worktree provision (#2588): prompt` (the dispatched task-worktree provision prompt text carries
  the save line, the clean line and the restore line in that order; `depClause` still omits the clean
  line), `reused-worktree provision (#2588): savedWork reaches the worker` (a provision-run mock answers
  `{ ok: true, savedWork: '.war/preprovision-<id>.patch' }` and the worker prompt names that path; a mock
  answering `{ ok: true }` yields a worker prompt with no `preprovision-` text), `recovery predecessor
  seed (#2575)` (one preMerged and one fresh task: the
  fresh task's `preMergeTip` equals the barrier `integrationTip`; `tipSha` unchanged when no fresh merge
  lands), `refinery hygiene (#1823)` (a `{ task: null, refinery: true }` row logs without `<task>`),
  `owned-file adoption (#2671): sanctioned barrier prompt` (the sanctioned prompt carries `record-as-owned
  <integration branch>` and `--owned-file` before the `ensure-integration` text; the recovery-absent prompt
  carries no `record-as-owned`; a sanctioned run with no `ownedFile` carries none either). Git-1 fixture
  `owned-file adoption (#2671): real repo` (extract the adopt spelling from the dispatched prompt; build a
  repo with a working branch, cut `integration/<slug>/phase-1` through `ensure-integration` with owned-file
  A; run the adopt spelling with an empty owned-file B through `spawnSync('bash', ['-c', …])`, then
  `ensure-integration … --owned-file B` exits 0 and B lists the branch; a control that skips the adopt
  spelling exits 3). Git-1
  fixture `reused-worktree provision (#2588): real repo` (the precedent is git-1's `PROVISION_CLEAN_SENTENCE`
  restore run): extract the save, clean and restore spellings from the dispatched prompt, build a repo with
  a reused worktree holding one staged edit, one unstaged edit to a second tracked file and one untracked
  file, run save → a provision step that rewrites a tracked lockfile → clean → restore through
  `spawnSync('bash', ['-c', …])`, and assert exit 0, both edits present in the tree, the untracked file
  still there and the lockfile at its provisioned content; a control without the save and restore lines
  loses the edits. Edit
  engine-1 only to update an existing pin these additive edits red. Sweep: grep `PROVISION_CLEAN_LINE` and
  `worktreeHygieneClause`, and handle every match. Manual same-scope survey required: after the grep,
  hand-scan the target file's same-scope tests and comments for same-meaning siblings worded differently,
  and list each straggler as a survey-derived correction. D32 (PIN-32, #2700): read
  `A.recovery.priorReturn` into `recovery` (an object with optional `aced` and `minorsFiled` arrays; any
  other shape ignored with one log line, the `ruledAsks` container precedent); inside the preMerged loop,
  for each matched task push its `priorReturn.aced` rows to `aced` as `{ ...row, recovered: true }` and send
  its `priorReturn.minorsFiled` rows through `fileFollowUp({ ...row, recovered: true })`, matching `row.task`
  through `preMergedIdOf`; log one line per task with both counts; rows for a task that is not pre-merged are
  dropped with one log line; a row already carrying `issue` keeps it (A39). D33 (PIN-33, #2701): in
  `carryPhaseClose`, `carriedFrom.phase` is the row's existing `carriedFrom.phase` when not null, else
  `phaseId`; `reason` stays `why`. Recovery fixtures: `prior-return carry (#2700)` (a sanctioned recovery
  with one preMerged task; `priorReturn` carries one aced and one minorsFiled row for that task and one aced
  row for a task that is not pre-merged; the return's `aced` and `minorsFiled` hold the pre-merged task's rows
  stamped `recovered: true` and not the other; the same run without `priorReturn` returns empty arrays),
  `carried-from origin (#2701)` (a `seededPhaseClose` row with `carriedFrom.phase: 5` on a phase 6 that
  holds: the returned `carriedPhaseClose` row keeps `carriedFrom.phase === 5` while a row born in phase 6
  carries 6). Prove both red against the phase-base engine before the change. Measure the stripped engine
  size per commit (constraint 12) and record it in the commit body; D32's growth (about 320 B) is the largest
  single addition in this plan; fund it only if arm (p) would go red (constraint 12).
- Done when: `grep -q "preprovision-" agents/war-worker.md && grep -q "refinery: true" agents/war-refiner.md && grep -q "record-as-owned" agents/war-refiner.md && node --test --test-reporter=tap --test-name-pattern='reused-worktree provision \(#2588\)|recovery predecessor seed \(#2575\)|refinery hygiene \(#1823\)|owned-file adoption \(#2671\)|prior-return carry \(#2700\)|carried-from origin \(#2701\)' skills/war/assets/workflow-template.recovery.test.mjs skills/war/assets/workflow-template.git-1.test.mjs | awk '/^not ok/{b=1} /^ok [0-9]+ - (reused-worktree provision \(\\#2588\)|recovery predecessor seed \(\\#2575\)|refinery hygiene \(\\#1823\)|owned-file adoption \(\\#2671\)|prior-return carry \(\\#2700\)|carried-from origin \(\\#2701\))/{n++} END{r=(n>=9&&!b)} END{print r?"PASS-T4.1":"RED-T4.1"} END{exit !r}'` · token: `PASS-T4.1` (three provision fixtures, the seed fixture, the hygiene fixture, the two adoption fixtures, the prior-return fixture, the carried-from fixture)
- requiresTest: true
- requiresPackaging: false
- deps: []
- target repo: superproject

### Task 4.2: Recovery relaunch runbook lines
- Files: `skills/war/references/resume-and-recovery.md`, `skills/war/references/run-manifest.md`
- Plan slice: In § Recovery relaunch, add D17 (PIN-17) (a)–(f), short, one line each: (a) rebuild
  `agents`/`audit`/`run`/`gate` with the `war-config.mjs --fill-defaults` flag, never copy a prior attempt's
  args (flag form only — `doc-cli-consistency.test.mjs` scans this file, and `war-config.mjs` has no verb
  subcommands); (b) capture `git -C <worktree> status --short` per escalated task before a relaunch, because
  provision restores a reused worktree's edits but a hand teardown does not; (c) before `resumeFromRunId`,
  confirm the manifest's `transcriptDir` still exists (point at `run-manifest.md` for the field), and take a
  fresh Recovery relaunch if the session worktree moved; (d) a resume that re-dispatches seats it should
  replay is a harness cache miss: stop it and relaunch fresh; (e) a 0-agent `held:workflow-error` with no
  `workflowError` text is a harness entry refusal before the script ran: re-run the args preflight against
  the staged copy and the stager's size check before the relaunch; (f) before a relaunch, compare each reused
  task branch's local tip with its origin tip; a local copy that diverged from origin with an equal patch-id
  (a merge-slot rebase copy) is repointed to the origin tip so the relaunch pushes without a lease — a Lead did
  this by hand in a retired run (End state 24; survey fold 2026-11-08). Add one sentence that points, not
  restates: `provisionStep`'s save-and-restore preamble (Task 4.1) brings a reused worktree's edits back
  after the clean line, and when its apply fails the patch stays at the path the prompt names
  (`.war/preprovision-<task id>.patch`); End state 18's `preprovision-` grep binds this doc to that path
  (D7; defined-but-not-yet-emitted, produced in Task 4.1 in the same phase).
  D28 runbook half (PIN-28): under § Checkpoint outcome handling, one `held:escalation` arm for a
  `blocked_reason` starting `push_denied:` — read the command from the reason; confirm the branch is the
  task's own (`war/<planSlug>/p<N>-<id>`) and `git -C <worktree> rev-parse HEAD` is the rebased tip; read
  the remote tip with `git ls-remote origin refs/heads/<branch>`; run `git -C <worktree> push
  --force-with-lease=refs/heads/<branch>:<remote tip> origin <branch>` yourself (the operator approves
  it); never a plain `--force`; then retry the task through Recovery relaunch (a). D29 (PIN-29): in
  `run-manifest.md` § Relaunch, add the full-record restamp rule and the stale shape it prevents, keeping
  the three phrases the doc-truth plan pins byte-identical (`Dispatch counts are summed across attempts`,
  ``overwrite `workflowRunId` + `transcriptDir` together``, ``Archive the died attempt under `attempts[]` ``);
  add `## Hand-off catch-up` with the source per field (ledger `workflow_run` → `workflowRunId` and its
  transcript dir; git → `land: landed` and `endedAt` from the phase merge commit's committer date; the
  envelope when the transcript dir exists, else `null`; `restamped: <clock read>` on each restamped record;
  a restamped `cause` copied from the prior record or the ledger, never inferred; a Lead-landed phase
  (constraint 10) stamped from git because no engine handoff exists for it; the run `endedAt` when the
  landing PR merges), fail-open like every stamp (A36, A37). In
  `resume-and-recovery.md`: § Resume reconciliation pre-flight gets **Manifest catch-up** as the named
  first act after a session hand-off, as a pointer (`when you take over a run from another session, read
  run-manifest.md (§ Hand-off catch-up)`); § Recovery relaunch gets a **Manifest restamp** bullet (after
  the relaunch returns, restamp the whole phase record per `run-manifest.md` § Relaunch, not only the id
  pair). Hot/cold law: the runbook carries pointers and one-line duties; the field detail lives in
  `run-manifest.md`. The mid-run check is not this task's (PIN-30, Non-goals). D32 runbook half (PIN-32):
  in § Held-partial-phase recovery runbook step 4, beside the `args.seededPhaseClose` threading, one clause — thread the held
  return's `aced` and `minorsFiled` as `args.recovery.priorReturn: { aced, minorsFiled }` so the relaunch
  return carries the pre-merged tasks' findings (defined-but-not-yet-emitted, produced in Task 4.1 in the
  same phase). D37 (PIN-37, #2705): in § Resume reconciliation pre-flight, one **Machine-local run state**
  bullet: the run manifest, the team ledger and owned-refs, the args files, the saved phase returns and the
  staged script are git-excluded and machine-local; a resume on another machine first fetches origin and
  recreates the local integration and task branches the ledger names (point at the `git branch <branch> <remoteSha>` adopt form in `schemas.md`'s
  staleRemote row, read-only per constraint 8), copies the manifest, ledger, owned-refs, args files and the held
  return to the same paths under the new machine's run root (`skills/war/references/setup.md` § Run root, ADR 0059) by hand, with the ledger and owned-refs under `$MAIN/.claude/teams/`, then takes a fresh Recovery relaunch — new runId, never
  `resumeFromRunId` (its `transcriptDir` is gone there by construction, line (c)) — threading
  `seededPhaseClose`, `seededTasks`, `priorReturn` and `ownedFile` from the copied files, and runs Manifest
  catch-up from the copied manifest. Short lines; pointers, not restatements.
- Done when: `F=skills/war/references/resume-and-recovery.md; M=skills/war/references/run-manifest.md; grep -qi -e "--fill-defaults" "$F" && grep -qi "transcriptDir" "$F" && grep -qi "status --short" "$F" && grep -qi "cache miss" "$F" && grep -qi "0-agent" "$F" && grep -qi "preprovision-" "$F" && grep -qi "push_denied" "$F" && grep -qi "force-with-lease=" "$F" && grep -qi "Manifest catch-up" "$F" && grep -qi "machine-local" "$F" && grep -qi "priorReturn" "$F" && grep -qi "Hand-off catch-up" "$M" && grep -qi "Dispatch counts are summed across attempts" "$M" && grep -qiE 'overwrite .workflowRunId. \+ .transcriptDir. together' "$M" && grep -qiE 'Archive the died attempt under .attempts\[\].' "$M" && grep -qi "patch-id" "$F" && grep -qi "repoint" "$F" && grep -qi "Manifest restamp" "$F" && echo PASS-T4.2` · token: `PASS-T4.2` (doc-only task; the gate's `doc-cli-consistency.test.mjs` under `skills/_shared/` also scans this file)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Phase 5 — Release

### Task 5.1: Version bump
- Files: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md`, `CHANGELOG.md`
- Plan slice: Bump all four slots to the next free patch above the live integration base at land time, per
  the `/war-strategy` §2 next-free-patch convention (`plugin.json` `version`, `marketplace.json`
  `metadata.version` and `plugins[0].version`, the README `## Status` line, replace-in-place). Expected
  integration base: the working tip left by `docs/plans/2026-11-08-auditor-and-worker-guard-habits.md`.
  Standalone fallback: a plan run through plain `/war` resolves the next free patch from the four slots
  itself. The README `## Status` block stays a byte twin of the new CHANGELOG lead entry. The entry names the
  land confirm, the never-move wording, the plugin identity floor, the per-task pin-proof hold and
  `git_error`, the ace-tip fix, `dispatchFailures`, the retired worker trailer, the commit-message read rule,
  the recovery push path, worker-site `env-died`, the infra terms, the provision save-and-restore, the
  recovery predecessor seed, the refinery hygiene rows, the runbook lines, the relaunch owned-branch adoption,
  the `push_denied:` stop rule, the manifest catch-up, the first-push refspec, the prior-return carry, the
  carried-from origin, the held-land wrap-up, the 40-hex `head_sha`, the audit-pin retry and the
  machine-local state carry line, and counts nothing it does not enumerate.
- Done when: `node --test --test-reporter=tap skills/war/assets/version-slots.test.mjs | awk '/^not ok/{b=1} /^ok /{n++} END{r=(n>0&&!b)} END{print r?"PASS-T5.1":"RED-T5.1"} END{exit !r}' && node -e "const cp=require('child_process'),v=(t)=>JSON.parse(t).version.split('.').map(Number),a=v(require('fs').readFileSync('.claude-plugin/plugin.json','utf8')),b=v(cp.execSync('git show origin/master:.claude-plugin/plugin.json',{encoding:'utf8'})),d=(a[0]-b[0])||(a[1]-b[1])||(a[2]-b[2]),ok=d>0,o=console.log(ok?'PASS-T5.1b':'RED-T5.1b'),x=process.exit(ok?0:1)"` · token: `PASS-T5.1`, then `PASS-T5.1b` (the version is strictly above the landing branch's; red at base)
- requiresTest: false
- requiresPackaging: false
- deps: []
- target repo: superproject

## Deferred validations (backstops)

- `skills/war/references/schemas.md` carries rows for `git_error`, `integrationTip`, `savedWork`, `refinery`,
  `dispatchFailures`, `recovery.priorReturn`, the `recovered` row stamp and the `head_sha` pattern · why deferred: `schemas.md` belongs to the doc-truth plan by the campaign
  contention table (PIN-23) · runner: `docs/plans/2026-11-08-doc-truth-drift-and-adr-hygiene.md`'s schemas
  task, at its land, and `skills/war/references/schemas-manifest.test.sh` there.
- A real sanctioned recovery pushes a rebased reused task branch with the lease and no operator approval ·
  why deferred: the host auto-mode classifier is outside the gate (A11) · runner: the Lead at the next
  sanctioned recovery relaunch that rebases a reused branch, recorded in that run's `/war-review`.
- A real 401, OAuth or DNS death classifies `env-died`, and a usage-limit death's harness text is compared with
  the regex's `session limit|rate limit|quota` terms (the retired corpus quotes none — verified: DocLot
  AutoIndex/pr-1119/96cfe3c658aecf7b98e9611835f29dd3c81de9e3/README.md, WAR 0.21.18) · why deferred: the exact
  harness messages are not in the repo (A16) · runner: the Lead at the next such death, comparing its message
  with `INFRA_DEATH_RE`, recorded in `/war-review`.
- The runbook's cache-miss stop and 0-agent entry-death lines name the real signals · why deferred: both
  need a live harness run (A19, A21) · runner: the Lead at the next resume or 0-agent death, recorded in
  `/war-review`.
- A live sanctioned relaunch whose integration branch is unrecorded passes the barrier through the adopt
  step, and a live host lease denial yields a `push_denied:` reason the Lead hand-pushes from · why
  deferred: both need a live run under the host classifier · runner: the Lead at the next sanctioned
  relaunch, recorded in that run's `/war-review`.
- The flag and field names in `resume-and-recovery.md` (`--fill-defaults`, `transcriptDir`) resolve in
  `war-config.mjs` and `run-manifest.md` · why deferred: no in-gate test binds a references flag to the
  `war-config.mjs` flag list (touched-doc rule 8, explicit defer) · runner: `/red-team`'s
  touched-doc-fact-coverage probe at ratification, then the T4.2 audit seat at audit_sha.
- A live held land dispatches the servitor and its lessons ground on the last merge tip (D34, A42), and a
  live cross-machine resume succeeds from the five carried locations (D37, A43) · why deferred: both need a
  live run — a real hold with a threaded memory root, and a second machine · runner: the Lead at the next
  held land and the next cross-machine resume, recorded in `/war-review`.

## Notes / conscious deviations

- **Red-team round 1 adjudications (2026-11-09).** Operator ruling: the staged-template cap is funded by the args sibling script (D38, T1.2, End states 33 and 34), and lowering `ARGS_HEADROOM_BYTES` to the loader prelude is part of that ruling. AI-declared under --afk: End states 24 to 32 bind as intent as appended, the #2750 `floorFixHead` sentence rides T3.1, and the check rewrites (semicolon-free awk END rules, TAP `\#` anchors, `grep -qi` runbook greps) keep each check's meaning. Report: `docs/red-team/2026-11-08-engine-recovery-relaunch-and-land.md`.
- **Red-team round 2 adjudications (2026-11-09, AI-declared under --afk).** The args loader is conditional and caught, so PIN-25 holds (D38). `MERGE_SNAPSHOT` gets the optional `git_error` (D5). #2750 is claimed as D39. T5.1 gains a red-at-base version check. The submodule staged-copy test compiles its own `workflow` stub, so the shared harness stays with T1.1.

- Test ownership (PIN-22): the spec split each engine phase into an engine task and a test task with `deps`.
  Engine-1 and recovery already pin text the engine tasks change (context J), so a split engine task reds its
  own gate. Each engine task now owns its pinning tests and new fixtures. Phase 4 keeps a parallel doc task. Phase 1 runs T1.2 then T1.1 (`deps: [1.2]`).
- D6 repro and fix share T2.1, so the worker proves red at the phase base and green after the fix in one
  task (spec §8's "must go red before T2.1 merges").
- D13 shrinks to `dispatchFailures`: TRIAL-1 shows the args prologue already reaches the catch. The spec's
  `workflowError.stage === 'prologue'` validation criterion is retired with it; the 0-agent death gets a
  runbook line (D17 (e)) instead.
- `skills/war/assets/prompt-surface-budgets.test.mjs` and `skills/war/assets/reference-link-integrity.test.mjs`
  left the spec's T1.1 file list: no raise is allowed (PIN-21), and the link test scans pointers on its own.
- Phase 4 adds `skills/war/references/refiner-recovery.md` as the eviction destination, and Phase 3 adds
  `skills/war/references/worker-servitor-edges.md`, both for PIN-21.
- The `--test-reporter=tap` flag rides every test check because the default reporter prints no `# fail 0`.
- Issue fetches: all 18 first-draft issues were read, and all 29 claimed issues are open at 2026-11-09; none was unreachable.
- Grill revise pass (2026-11-08), self-decided findings:
  - P3 → D12 uses bounded phrases (`api error: 401`, `oauth access token`, `disabled claude subscription`,
    `enotfound`, `getaddrinfo`, `eai_again`), the two #2328 strings are the positive fixtures, three
    tagged decoys are the negative fixtures; A16 partly retired.
  - P5 → Context D and A7 name the merge-slot `mismatch` re-audit (`r.seats = rbSeats`) as the fourth
    `r.seats` site; T2.1's repro gets a second shape for it.
  - P7 → `workflow-template.test-harness.mjs` is in the Files of every test-owning task (T1.1, T2.1, T3.1,
    T4.1) with the harness header's placement rule stated; no two same-phase tasks share it.
  - P10 → D7's `savedWork` line gets a card twin: one `## Inputs` bullet (A31), `agents/war-worker.md` in
    T4.1's Files, funded by T3.1's left-over headroom (≥ 120 B) or a `## Harness note` eviction. A23's
    fallback is pre-funded: T1.1 leaves ≥ 200 B and `agents/war-refiner.md` is in T2.1's Files.
  - P13 → the exit number is bound by T1.1's cross-file pin on `EX_FOREIGN` (A33), the D2 prose names the
    PHANTOM LAND arm instead of restating the code; `git_error` in `refiner-recovery.md` is in End state
    7's check; the runbook's `preprovision-` path is in End state 18's check and the sentence points at
    `provisionStep`; the restore claim is covered by End state 15's git-1 real-repo fixture.
  - P16 → D4's exhaustion arm for `mergeSnapshot` keeps the HARD throw (with the caught reason appended);
    no caught non-infra throw is minted into a death record, now a binding guardrail. End state 6 has
    three cases (git-pin every attempt, pin-snapshot retry, snapshot exhaustion stays HARD). Chosen over
    minting `env-died` because D21's comment reserves the soft class for matched infra deaths and the
    Intent forbids laundering; the one-task hold #2589 asks for is delivered on the pin-proof path, and
    the snapshot path now survives a transient throw by retrying.
  - P18 → the stale-prior-attempt fixtures assert the old run absent on both surfaces; D8's sentence
    names the `rev-parse HEAD` before-rebase read (`ORIG_HEAD` right after).
  - P20 → the plugin root is the script's own location, not an env var; the wiring sentence lives in
    `launch-identity.md`'s recovery paragraph (reached from the runbook's "Fresh identity" bullet), in
    T1.2's Files and End state 5's check; A30 records the args-floor base.
  - P22 → the Evidence-consumed block has one row per linked artifact, read or unread with the reason.
  - P23 → End state 15 asserts the `savedWork` plumbing, End state 10 asserts the kept card sentences,
    End states 8 and 19 carry one tag each, End state 3 says it is a guardrail fixture.
  - P24 → D7 runs `git reset -q` before the save and restores with plain `git apply`; T4.1 adds a git-1
    real-repo fixture that runs the dispatched spelling through bash on staged and unstaged edits (A32).
  - X1 → Context A says `landErrorArm`'s `status: 'error'` already enters `reconcileMerge`'s LAND RECOVERY,
    so the #2657 harm is one extra reconcile dispatch, a second full gate and a misreport; End state 1
    gains the `a confirmed land saves the reconcile dispatch` fixture, red at base.
  - Card-budget fact fix: the draft called `## Prior lessons (memory)` unpinned; two tests read it, so
    T3.1's eviction candidate is now `## Harness note`, then `## Comment hygiene (before commit)`.
- Operator ruling 2026-11-08: S1 (the grill's surviving question on D1) — option 1, keep D1 as planned.
  The shared `landConfirmArm` (the `ls-remote` confirm before the land error arm) rides every land prompt;
  `refiner-recovery.md` carries the rule; the card eviction of the two land-phase bullets funds the
  pointer (T1.1). The fixture `land-confirm (#2657): a confirmed land saves the reconcile dispatch` stays
  the observable, red at base. Baseline it measures against (the grill's X1 fact): at base a phantom
  exit 3 already recovers through `reconcileMerge`'s LAND RECOVERY, at the cost of one recovery-tier
  `merge-reconcile` dispatch, a second full gate run at the landed commit, and a refiner report that calls
  a finished land an error. D1 removes that cost and the misreport; it adds no new behavior class.
- Folded 2026-11-08 after conversion: #2669, #2670, #2671 (one run, three reports); rows owned elsewhere
  listed in Non-goals.
- Evidence correction 2026-11-08: context K called run 83f08e8c "the second such run after #2646" for a
  host-denied lease push; the retired corpus shows four such runs before it (0.21.18, 0.21.31 twice, 0.21.37 —
  citations in context E), so the sentence now says at least the fourth.
- Evidence correction 2026-11-08: context K's assumed cause for the unstamped manifest (Leads not re-reading
  the duty after a session hand-off) is at most one cause; retired runs with no hand-off show the same
  unstamped shape (verified: DocTrail WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/issues/review-issue.md,
  WAR 0.21.35). The tag now says so, and Open decision 5 asks whether the catch-up should run at every
  Checkpoint.
- Survey-evidence fold 2026-11-08 (117 reader rows over the DocTrail and DocLot corpora; 49 used, 68 dropped as
  duplicates, already-stated, superseded by a landed fix, or another plan's): D29 gains the copied-cause rule;
  T2.1 gains the snapshot-reply `git_error` text in the HARD hold message (End state 25); T4.2 gains runbook
  line (f), the diverged-local-copy repoint (End state 24); constraints 10 and 11 quote two operator rulings
  and constraint 9 a Lead ruling; seven residuals are recorded in Non-goals for filing. End states 24 and 25
  are appended, not reworded, and need the operator's re-confirmation of the intent.
- Claimed 2026-11-08 (operator ruling: survey-derived residuals are campaign work): #2699 (T1.1, D31),
  #2700 (T4.1 engine + T4.2 runbook, D32), #2701 (T4.1, D33), #2702 (T2.1, D34), #2703 (T3.1, D35), #2704
  (T2.1, D36), #2705 (T4.2, doc-only, D37); rerouted: none; kept deferred: none — only #2705's mechanical
  half (a state-carry tool) stays in Non-goals, because no campaign plan owns one. The seven residual
  bullets left Non-goals; context L carries the verified defects. End states 26–32 are appended, not
  reworded, and need the operator's re-confirmation of the intent. The staged cap (constraint 12) is funded by D38 (operator ruling 2026-11-09).

## Open decisions

1. D11: classify a worker-site resolved null as `env-died` (this plan's default), or ratify the HARD hold.
   If the HARD hold is ratified, T3.1's D11 part shrinks to a comment plus a fixture pinning the HARD read,
   and the ruling goes in the #2555 close comment.
2. D3: keep the never-move hold (this plan's default). Changing it to record a merge needs a ruling on the
   #1895 guard first.
3. D7: save-and-restore (this plan's default) or the doc-only option from #2588.
4. D10: the manifest `pluginVersion` is Lead-stamped and named the staged template's 0.21.18 while the live
   hooks ran 0.21.19 after a mid-run plugin update (verified: DocTrail
   WorkAuditRefine/reports/2026-10-27-memory-query-mcp-tool-closeout/CORRECTIONS.md, WAR 0.21.19); another
   manifest carries two versions across its phase rows (verified: DocTrail
   Aligned/reports/2026-10-30-board-mcp/lead/launch.sh, WAR 0.21.33). For `/red-team`: should the floor compare
   against the manifest's `pluginVersion` (this plan's default), against the staged script's version, or both —
   and is a mid-run plugin update a refusal, a warning or a restamp?
5. D29: retired runs with no session hand-off show the same unstamped phase records (verified: DocTrail
   WorkAuditRefine/reports/2026-11-04-late-defects-fixed-in-run/lead/issues/review-issue.md, WAR 0.21.35;
   DocTrail Aligned/reports/2026-10-27-aligned-campaign-1/war/runs/0d9b818b-461b-4424-8493-df801349148f.json,
   WAR 0.21.18). For `/red-team`: should Manifest catch-up be a Checkpoint duty after every phase return (this
   plan's default is hand-off only, with the per-relaunch restamp)?

- Resolved: S1 (D1 land confirm, the grill's surviving question) — operator ruling 2026-11-08, option 1,
  keep D1 as planned; recorded in `## Notes / conscious deviations`. Items 1–5 above stay open for
  `/red-team`.
