# PR #2297 finalization ledger

## Authority and scope

User-requested bounded integrity finalization; source `dev/2026-09-06-engine-and-audit-verdict-integrity`, target `master`, repository `Ljferrer/WorkAuditRefine`. Commit and push fixes and update the existing PR; **do not merge or release**. The authoritative campaign plan remains `docs/plans/2026-09-06-engine-and-audit-verdict-integrity.md`.

Initial source: `6497e0cefaff7cdd3f4d52006111500e793dbc10`. Refreshed master and merge base: `ba08a77f812fe3e00fdf21aa5114a3f00f90df4b`. Initial PR scope: 75 files, 7,649 insertions, 1,161 deletions. GitHub: CLEAN; redaction-lint SUCCESS; no comments/reviews. Historical 1,723 JS / 31 shell results are not final-candidate evidence.

Work occurs in the clean, isolated Codex worktree `7d12/WorkAuditRefine`, attached to the existing source branch after verifying local/remote equality and no other worktree ownership. The main checkout's config, roadmap, untracked AGENTS, plans, and port/red-team material are user-owned and untouched.

## Protected branches

The following initial branch tips must remain unchanged by this task:

```text
refs/heads/claude/codex-red-team-migration-5ca53a 6a472540f7b9a317436705f3ece2213d930e5395
refs/heads/claude/work-audit-refine-red-team-4de4e6 067b7b538350044c283f2f7e14f5b85c6677d882
refs/heads/claude/work-audit-refine-red-team-726b55 30c8b7ece4d806e90ac7394f464d387a521410e0
refs/heads/codex-port 7271cc3a08db978c71c450def81f49a1816dc20c
refs/heads/codex/red-team-comparison 9bc8f676fac1794838f556ed74f2c0d1a9b7bac5
refs/heads/codex/red-team-implementation 25404070284cce65f68a8d7f16a0526641bf40b5
refs/heads/codex/red-team-review-claude 6a472540f7b9a317436705f3ece2213d930e5395
refs/heads/codex/red-team-review-codex 46aef4a25b68874bff7b3b3fed14f9058c270da7
refs/heads/codex/red-team-review-codex-artifacts 0ea5d4bce168034b0856fa9db8c406a9f9ebf5e0
refs/heads/dev/2026-08-06-red-team-gate-cli 1655b98c6c22be7490cc48809b509d3aeaabd16c
refs/heads/integration/2026-08-06-red-team-gate-cli/phase-1 062386e1b83c8a2a421ad12e799478f0daa8fe63
refs/heads/integration/2026-08-06-red-team-gate-cli/phase-2 d5740b65b0d2384607c5d7053ec54527bb960f32
refs/heads/war/2026-08-06-red-team-gate-cli/p1-1.1 17eb083a63fa94a2a1612622a218385ea1034af4
refs/heads/war/2026-08-06-red-team-gate-cli/p1-1.2 e0fd31cda193551973d5cbd86c5b42203c8805a2
refs/heads/war/2026-08-06-red-team-gate-cli/p1-polish 062386e1b83c8a2a421ad12e799478f0daa8fe63
refs/heads/war/2026-08-06-red-team-gate-cli/p2-2.1 97df02ef26f7f5d6c152c86d786841b227f6594b
refs/heads/war/2026-08-06-red-team-gate-cli/p2-polish d5740b65b0d2384607c5d7053ec54527bb960f32
```

## Audit identity and checkpoints

Installed Snipe: `war-snipe-local/work-audit-refine-snipe`, version `0.21.12+codex.20260908.8fd30f3`. Execute its owned `skills/snipe/assets/snipe-runner.mjs`; request `rawArgs: "4 correctness,simplicity,auto"`, an explicit merge-base target with full base/head SHAs, and no path filters. The active task does not expose exact model/effort metadata. Profile discovery succeeded. User selected `gpt-5.6-sol / high` for every seat. Initial panel is running against the initial full-SHA scope at capacity 3; actual assigned lenses are correctness, simplicity, cascading-impact, test-fidelity. No completed-panel verdict yet. Read-only auditors must retain confinement, coverage, failure, and scope-stability evidence; incomplete is never clean.

## Issue dispositions (pending reproduction)

| Issue | Risk | Status / evidence |
|---|---|---|
| #2279 | Conflict routing bypasses a fixable surviving blocker | Pending actual-flow reproduction and D17/D19 ruling |
| #2280 | Bare scope prose falsely triggers a mandate conflict | Pending reproduction and paired routing analysis |
| #2196 | Later relaunch counts sibling work as never-started task completion | Pending real-git reproduction |
| #2154 | Approval transfer accounts seats at null SHA | Pending actual-flow reproduction |
| #2182 | Baseline-proceed gate evidence can select superseded log | Pending actual-flow reproduction |

## Completion checklist

- [x] Read handoff; verify live PR identity and isolated source ownership; preserve comparison refs.
- [ ] Initial four-seat Snipe panel, roster/profile/package, findings and dispositions.
- [ ] Read relevant plan, doctrine, learnings, and test fixtures; reproduce priority issues.
- [ ] Record consequential operator ruling if needed; implement verified repairs and synchronized doctrine.
- [ ] Bounded remaining-follow-on triage for false approval/completion/source/pin/gate evidence.
- [ ] Targeted regressions red before, green after; class-closure evidence.
- [ ] Full JS, shell, redaction, release-slot and applicable checks on candidate.
- [ ] Final complete four-seat Snipe audit; resolve/adjudicate material findings.
- [ ] Reviewed commits pushed without force; PR description updated; remote head/checks verified.
- [ ] Exact candidate SHA and merge-ready/held verdict with remaining backstops.

## Resume notes

GitHub snapshots and initial worktree/ref inventories currently live under `/private/tmp/war-2297-*`. Move durable, relevant evidence into the branch before completion. Node `v24.17.0` is available. Repo runner instructions: `node --test 'skills/**/*.test.mjs'`; shell tests only under `hooks/` and `skills/`; `node skills/_shared/war-memory.mjs lint docs/learnings/`; release slots guarded by `skills/war/assets/version-slots.test.mjs`. No new version bump is planned.

## Operator ruling — 2026-09-09 (user-confirmed)

For #2279/#2280, the operator adopted this integrity-first rule in this task: rebuttal first; fix when **all** surviving blockers have concrete fixes; hold on **any** fix-less blocker or unchanged survivor; preserve genuine mandate-conflict asks while held; require a ruling and re-audit before approval; recognize mandate-shaped phrases rather than bare `scope`. This supersedes conflicting D17/D19 routing language; update the living plan and operative mirrors in the repair commit. It is an explicit ruling, not a recommendation inferred from the handoff.

## Reproduction checkpoint — initial source 6497e0c

Using the existing `workflow-template.test.mjs` actual-flow harness copied to an OS-temporary file (source loaded from this worktree):

- `node --test --test-name-pattern='^finalization-repro' /private/tmp/war-2297-repro.test.mjs` initially ran the #2279/#2280 rows: **4 failures**, exact intended symptoms. For each interactive/unattended case, `landed: [t1]`, `landDecision: landed`, and zero fix dispatches. #2279 supplied a concrete guard fix plus mandate prose; #2280 supplied ordinary lexical-scope prose and no fix. Ask evidence survived but the task merged anyway. Output: `/private/tmp/war-2297-routing-red.log`.
- Transfer/gate subset command `node --test --test-name-pattern='^finalization-repro #(2154|2182)' /private/tmp/war-2297-repro.test.mjs`: **6 failures**. #2154 null-destination approvals reproduced through direct transferred, contradiction-routed already_upstream→transferred, and mismatch re-audit paths. #2182's old `GATE_LOG_BASELINE_NONE` construct is absent at this head, but absent, empty, and non-empty debt ids all select the conventional initial gate log after an uncaptured baseline-proceed rerun. Output: `/private/tmp/war-2297-transfer-gate-red.log`. This proves the current symptom; it does not claim the historical condition remains.

No production repair has been applied before the initial panel. Regression fixtures and class-closure records remain to be committed with the fixes.

- #2196 real-git reproduction: `node --test --test-name-pattern='^finalization-repro #2196' /private/tmp/war-2297-repro.test.mjs` **failed**. Fixture creates base→sibling commit, cuts never-started t1 at sibling tip, executes the dispatched ancestor/count expression, and feeds its result through the real Workflow. Count=1, tree contains only base/sibling deliverables, `work:t1` absent, audit verdict `recovered:pre-merged`. Source-confirmed pre-existing residual, not a campaign regression. Log: `/private/tmp/war-2297-relaunch-red.log`.

Class sweep underway: #2181/#2168/#2187 share gate-source attribution; #2141 reports a worker-tip/merge-base mismatch requiring origin verification; #2244 concerns drain metadata loss (triage against bounded scope); #2251 appears superseded by the statement-boundary ruling; #2277 is compound-command execution evidence. Do not classify open issues solely from their title or historic status.

## Class analysis before repair

- Verdict routing: producer `auditRound`/rebuttal → `seatConflictsOf` → direct `parkAsk`/seat mutation → survivor checks → FIX_NEEDED → collector/merge. Sweep includes finding-less seats, mixed fixable/fix-less sets, unchanged survivors, explicit escalation, interactive/AFK and existing citation/ruled-ask paths. The adopted ruling requires retaining blocking findings and their verdicts on a held ask; ordinary Minor/Nit asks retain their existing contract.
- Transfer: `PIN_TRANSFER` → `probeStatus` → `probeRow`/`landMerged`/mismatch `auditRound`. Invalid destination affects every success-bearing status, not just contradiction-routed transfer; a null tip also bypasses meaningful re-audit pin checking. Unknown/error probe fallback is a distinct established contract.
- Gate evidence: `landMerged` → evidence `evItems` and task `artifactLine`; source also names a conventional task path in `endStateBlock`. Initial/floor/environment capture differs from baseline-proceed. Same-tip continuation reuse (#2168) is a sibling read-side hazard, not solved by suppressing the baseline seat path alone.
- Relaunch: the committed graph in the reported shape does not encode which branch authored a shared commit. A branch cut at the integrated sibling tip and a task branch fast-forwarded into integration may have identical refs/trees. Any repair must obtain task-specific origin/completion evidence or conservatively refuse the ambiguous skip; changing only the shared phase base cannot prove task ownership. Existing `.war-task` stores the branch name only and is rewritten/recreated on provision, so it currently supplies no birth SHA.

## Initial Snipe complete

All four seats completed and validated, each request_changes/high confidence; coverage complete, scope stable. Exact report: [initial-snipe.md](2026-09-09-engine-pr-2297-initial-snipe.md); request/profile/seat metadata and raw transport hash: [initial-snipe.json](2026-09-09-engine-pr-2297-initial-snipe.json). Audited head remains 6497e0c; current edits are not covered. Packaged post-audit guidance consumed in full. Five Major findings and two Minor findings require disposition. Routing, transfer and baseline findings corroborate the ongoing reproductions; new in-scope investigation: post-push merge-dispatch death and missing alternate death-consumer tests. Seeded-queue duplication and lossy remint hash need bounded classification.

## Repair checkpoint — routing and transfer

Root cause → sibling sweep → proof → consequence:

- #2279/#2280 and Snipe cascading-impact finding-less dissent: conflict parking used to erase findings and approve every dissenter. It now only preserves questions on held panels. Rebuttal remains first; ALL survivors must be fixable; any fix-less, unchanged or finding-less blocker holds. Ordinary lexical scope is not mandate evidence. Common checks cover split and agreed-block panels. Sibling sweep found unanimous approve labels carrying a Major could still merge; `allApprove` now also requires zero open blockers. Old tests deliberately using approve+Major to enter a merged-with-held-absorb drain were unsafe characterizations; they are replaced with hold/evidence regressions. Existing seeded-held-row and ordinary dedup coverage remain.
- #2154 and Snipe transfer evidence: every success-bearing probe needs a valid destination before accounting, contradiction routing, re-audit or completion. Direct transfers also need non-empty equal patch IDs; otherwise the full roster re-audits the valid destination. Uncontradicted already-upstream completion additionally requires a valid base, non-empty PRE, explicit empty POST and valid matched commit SHAs. Missing evidence holds. Historical #1973 contradictory-enum replay still follows its true patch evidence. Error probes retain the established ordinary-merge fallback. Required schema fields and producer/reference instructions agree with consumer checks.
- Red evidence: original routing fixtures failed 10/12; missing-tip regressions failed in all three success modes; missing patch evidence and approve+Major cases independently failed before their guards. Disposable mutations removed/inverted the any-fix-less, unchanged, finding-less, mandate matcher, open-blocker approval, destination, transfer patch and upstream-evidence guards: all eight mutations failed their targeted behavior tests (2, 2, 1, 4, 1, 3, 1, 1 assertions/tests respectively). Details remain `/private/tmp/war-2297-routing-mutations.json` and named logs; none ran against the candidate source in place.
- Consequences: unresolved questions no longer grant a merge; some legacy refiner replies now hold or re-audit; fully evidenced transfers and ordinary unanimous approvals remain accepted. Standing/dispatched auditor doctrine, plan D17/D19, ADRs 0013/0049, glossary, schemas and contract tests updated together. Full-candidate audit and all-repository validation still outstanding.

## Additional ruling and investigation

User authorized the #2196 task-provenance requirement: a nonempty worker commit must carry `WAR-Task: <task branch>` before recovery can automatically skip an integrated task. Legacy branches without evidence take ordinary work/audit. Implementation pending.

Snipe's post-push death finding is independently reproduced with a real local bare Git remote: merge/push completes, refiner throws ECONNRESET, and the real Workflow still dispatches Land. Regression failed as intended (`published === true`). Proposed D21 exception is pending the operator's choice: hold uncertain merge outcomes for reconciliation versus automatic reconciliation. Reproduction stored in `/private/tmp/war-2297-post-push-regression.txt` and `/private/tmp/war-2297-post-push-red.log`; it is not yet a committed passing test.

Routing/transfer checkpoint validation: `node --test skills/war/assets/workflow-template.test.mjs skills/war/assets/skill-doc-contracts.test.mjs skills/war/assets/prompt-surface-budgets.test.mjs` — **840 passed, 0 failed**. `git diff --check` passed. A ninth mutation restoring strict string equality for abbreviated/full base SHAs failed the new already-upstream contradiction test; prefix-equivalent SHA names now cannot falsely prove distinct base/tip. These are checkpoint checks, not final-candidate evidence.
